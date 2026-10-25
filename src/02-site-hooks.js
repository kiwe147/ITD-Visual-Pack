    const siteUsers = new Map(), siteUsersWait = new Map();
    const siteAuth = { token: null, at: 0, me: null, meWait: [] };
    const OVERLAY_KEYS = ['vpGal', 'vpMsgs', 'vpMenu'];
    function overlayEnter(key) {
        const st = Object.assign({}, history.state);
        const had = OVERLAY_KEYS.some(k => st[k]);
        OVERLAY_KEYS.forEach(k => delete st[k]);
        delete st.vpChat; delete st.vpImg;
        st[key] = 1;
        history[had ? 'replaceState' : 'pushState'](st, '', location.href);
    }
    const overlayAt = key => !!(history.state && history.state[key]);
    const STACK_KEYS = ['vpGames', 'vpNews', 'vpChat', 'vpImg'];
    function stackEnter(key) { history.pushState(Object.assign({}, history.state, { [key]: 1 }), '', location.href); }
    function stackLeave(key) { if (overlayAt(key)) history.back(); }
    if ([...OVERLAY_KEYS, ...STACK_KEYS].some(overlayAt)) {
        const st = Object.assign({}, history.state);
        [...OVERLAY_KEYS, ...STACK_KEYS].forEach(k => delete st[k]);
        history.replaceState(st, '', location.href);
    }
    const postIndex = { byMedia: new Map(), byUser: new Map(), byRepost: new Map(), original: new Map() };
    const normText = t => String(t || '').replace(/\s+/g, ' ').trim();
    const POSTS_URL = /\/api\/posts(?:\/user\/[^/?#]+(?:\/liked)?|\/[0-9a-f-]{36})?\/?(?:[?#]|$)/;
    const POST_INDEX_MAX = 4000;
    const trimMap = m => { if (m.size > POST_INDEX_MAX) { const it = m.keys(); for (let n = m.size - POST_INDEX_MAX * 0.75; n > 0; n--) m.delete(it.next().value); } };
    function keepSitePosts(body) {
        try {
            const j = typeof body === 'string' ? JSON.parse(body) : body;
            const list = (j && j.data && (j.data.posts || (j.data.id ? [j.data] : null))) || (j && j.posts) || [];
            for (const p of list) {
                if (!p || !p.id || !p.author) continue;
                (p.attachments || []).forEach(a => a && a.url && postIndex.byMedia.set(a.url, p.id));
                const user = String(p.author.username || '').toLowerCase(), text = normText(p.content);
                const o = p.originalPost;
                if (o && o.id) { postIndex.original.set(p.id, o.id); trimMap(postIndex.original); }
                if (o && user) {
                    (o.attachments || []).forEach(a => a && a.url && postIndex.byRepost.set(user + '|' + a.url, p.id));
                    const ot = normText(o.content);
                    if (ot) postIndex.byRepost.set(user + '|' + ot, p.id);
                }
                if (!user || !text) continue;
                const mine = postIndex.byUser.get(user) || new Map();
                mine.set(p.id, text);
                postIndex.byUser.set(user, mine);
                trimMap(mine);
            }
            trimMap(postIndex.byMedia); trimMap(postIndex.byRepost); trimMap(postIndex.byUser);
        } catch (e) { }
    }
    const USER_URL = /\/api\/users\/([\w.]+)\/?(?:[?#]|$)/;
    function keepSiteUser(url, body) {
        const m = String(url).match(USER_URL);
        if (!m || m[1] === 'me') return;
        try {
            const j = typeof body === 'string' ? JSON.parse(body) : body;
            const d = j && (j.data || j.user || j);
            if (!d || !d.username) return;
            const key = d.username.toLowerCase();
            siteUsers.set(key, d);
            (siteUsersWait.get(key) || []).forEach(done => done(d));
            siteUsersWait.delete(key);
        } catch (e) { }
    }
    function siteUser(user, ms) {
        const key = user.toLowerCase();
        if (siteUsers.has(key)) return Promise.resolve(siteUsers.get(key));
        if (!ms) return Promise.resolve(null);
        return new Promise(res => {
            const list = siteUsersWait.get(key) || [];
            list.push(res);
            siteUsersWait.set(key, list);
            setTimeout(() => res(siteUsers.get(key) || null), ms);
        });
    }
    const SERVICE_POSTS = [VERIFICATION_POST_ID, STICKER_POST_ID, MSG_POST_ID, GAMES_POST_ID];
    const isServiceEvent = text => SERVICE_POSTS.some(id => text.includes(id));
    function hideServicePosts(res) {
        return res.then(async r => {
            if (!r.ok) return r;
            const j = await r.clone().json(), d = j && (j.data || j);
            if (!d || !Array.isArray(d.posts)) return r;
            const keep = d.posts.filter(p => !(p && SERVICE_POSTS.includes(p.id)));
            if (keep.length === d.posts.length) return r;
            d.posts = keep;
            const h = new Headers(r.headers);
            h.delete('content-length');
            return new Response(JSON.stringify(j), { status: r.status, statusText: r.statusText, headers: h });
        }).catch(() => res);
    }
    function quietServiceStream(res) {
        return res.then(r => {
            if (!r.ok || !r.body || typeof TransformStream !== 'function') return r;
            const dec = new TextDecoder(), enc = new TextEncoder();
            let buf = '';
            const body = r.body.pipeThrough(new TransformStream({
                transform(chunk, out) {
                    buf += dec.decode(chunk, { stream: true });
                    const events = buf.split('\n\n');
                    buf = events.pop();
                    for (const ev of events) if (!isServiceEvent(ev)) out.enqueue(enc.encode(ev + '\n\n'));
                },
                flush(out) { if (buf && !isServiceEvent(buf)) out.enqueue(enc.encode(buf)); }
            }));
            return new Response(body, { status: r.status, statusText: r.statusText, headers: r.headers });
        });
    }
    (function watchSiteRequests() {
        const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        try {
            const origFetch = w.fetch;
            w.fetch = function (input, init) {
                try {
                    const own = profOldAnswer(typeof input === 'string' ? input : input && input.url);
                    if (own) return own;
                } catch (e) { }
                try {
                    const re = profSortUrl(typeof input === 'string' ? input : input && input.url);
                    if (re) arguments[0] = typeof input === 'string' ? re : new Request(re, input);
                } catch (e) { }
                let res = origFetch.apply(this, arguments);
                try {
                    const u0 = String(typeof input === 'string' ? input : input && input.url || '').replace(/^https?:[/][/][^/]+/, '');
                    if (/^[/]api[/]posts[/]user[/]neurosfw(?:[?]|$)/i.test(u0)) res = hideServicePosts(res);
                } catch (e) { }
                try {
                    const url = typeof input === 'string' ? input : input && input.url;
                    if (!netMod.skip) netNote(url, (init && init.method) || (input && input.method), false);
                    if (url && /\/notifications\/stream(?:[?#]|$)/.test(url)) res = quietServiceStream(res);
                    if (url && /\/api\//.test(url)) res.then(apiPause).catch(() => { });
                    const method = (init && init.method) || (input && input.method) || 'GET';
                    if (url && /^get$/i.test(method) && USER_URL.test(url)) {
                        res.then(r => r.ok && r.clone().text().then(t => keepSiteUser(url, t))).catch(() => { });
                    }
                    if (url && /^get$/i.test(method) && POSTS_URL.test(url)) {
                        res.then(r => r.ok && r.clone().text().then(keepSitePosts)).catch(() => { });
                    }
                    const act = url && /^(post|delete)$/i.test(method) && String(url).match(/\/api\/posts\/([\w-]+)\/(like|repost)\/?(?:[?#]|$)/);
                    if (act) {
                        const on = /^post$/i.test(method);
                        res.then(r => { if (r.ok) document.dispatchEvent(new CustomEvent('vp-post-act', { detail: { id: act[1], act: act[2], on } })); }).catch(() => { });
                    }
                    if (url && /\/auth\/refresh(?:[?#]|$)/.test(url)) {
                        res.then(r => r.ok && r.clone().json().then(d => { if (d && d.accessToken) { siteAuth.token = d.accessToken; siteAuth.at = Date.now(); } })).catch(() => { });
                    }
                    if (url && /^get$/i.test(method) && /\/api\/users\/me\/?(?:[?#]|$)/.test(url)) {
                        res.then(r => r.ok && r.clone().json().then(d => {
                            const me = d && (d.data || d.user || d);
                            if (me && me.username) { siteAuth.me = me; siteAuth.meWait.splice(0).forEach(done => done(me)); }
                        })).catch(() => { });
                    }
                } catch (e) { }
                return res;
            };
            for (const m of ['pushState', 'replaceState']) {
                const orig = w.history[m];
                w.history[m] = function () {
                    const r = orig.apply(this, arguments);
                    try { document.dispatchEvent(new CustomEvent('vp-loc')); } catch (e) { }
                    return r;
                };
            }
            const X = w.XMLHttpRequest.prototype, origOpen = X.open;
            X.open = function (method, url) {
                try { const re = /^get$/i.test(method) && profSortUrl(String(url)); if (re) { arguments[1] = re; url = re; } } catch (e) { }
                if (/^get$/i.test(method) && USER_URL.test(String(url))) {
                    this.addEventListener('load', () => {
                        if (this.status !== 200) return;
                        try { keepSiteUser(url, this.responseType === 'json' ? this.response : this.responseText); } catch (e) { }
                    });
                }
                return origOpen.apply(this, arguments);
            };
        } catch (e) { console.warn('[ITD VP] не вышло подсмотреть запросы сайта', e); }
    })();

