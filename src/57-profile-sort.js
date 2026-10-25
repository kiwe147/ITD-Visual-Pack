        const PSORT = [['new', 'Новые'], ['old', 'Старые'], ['popular', 'Популярные']];
        const psortCss = addCss(`
        .vp-psort { position: relative; display: flex; gap: 4px; margin: 0 0 12px; padding: 4px; border-radius: 9999px; background: var(--glass-bg, rgba(35, 35, 35, .8)); }
        .vp-psort button { position: relative; z-index: 1; flex: 1; padding: 7px 10px; border: 0; border-radius: 9999px; background: none; cursor: pointer; font: inherit; font-size: 13px; font-weight: 600;
            color: var(--text-secondary); transition: color .2s ease; }
        .vp-psort button:hover { color: var(--text-primary, #fff); }
        .vp-psort button.vp-on { color: var(--text-primary, #fff); }
        .vp-psort-ind { position: absolute; top: 4px; bottom: 4px; left: 0; width: 0; border-radius: 9999px; pointer-events: none; background: var(--tab-active-bg, rgba(255, 255, 255, .1));
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent, #4aa3ff) 55%, transparent); }
        .vp-psort.vp-busy { opacity: .6; pointer-events: none; }
        `);
        let psortPrev = null, psortFrom = null;
        function psortLeave(old) {
            const i = old.querySelector('.vp-psort-ind');
            if (i && i.dataset.x !== undefined) psortPrev = { login: old.dataset.login, x: i.dataset.x, w: i.dataset.w, at: Date.now() };
            old.remove();
        }
        function psortMove(box, animate) {
            const ind = box.querySelector('.vp-psort-ind'), on = box.querySelector('button.vp-on');
            if (!ind || !on || !on.offsetWidth) return;
            const x0 = parseFloat(ind.dataset.x), w0 = parseFloat(ind.dataset.w), x1 = on.offsetLeft, w1 = on.offsetWidth;
            if (x0 === x1 && w0 === w1) return;
            ind.style.transform = `translateX(${x1}px)`;
            ind.style.width = w1 + 'px';
            ind.dataset.x = x1;
            ind.dataset.w = w1;
            if (!animate || calm || isNaN(x0) || x0 === x1) return;
            psortFrom = { login: box.dataset.login, x: x0, w: w0, at: Date.now() };
            const lo = Math.min(x0, x1), span = Math.abs(x1 - x0) + Math.max(w0, w1);
            ind.animate([
                { transform: `translateX(${x0}px)`, width: w0 + 'px' },
                { transform: `translateX(${lo}px)`, width: span + 'px', offset: .45 },
                { transform: `translateX(${x1}px)`, width: w1 + 'px' }
            ], { duration: 440, easing: 'cubic-bezier(.65, 0, .25, 1)' });
        }
        function profBridge() {
            if (document.documentElement.dataset.vpWallBridge) return;
            document.documentElement.dataset.vpWallBridge = '1';
            const sc = document.createElement('script');
            sc.textContent = '(' + function () {
                function walk(each) {
                    var root = document.getElementById('root') || document.body;
                    var seen = new Set(), stack = root && root.__k ? [root.__k] : [], steps = 0;
                    while (stack.length && steps++ < 60000) {
                        var v = stack.pop();
                        if (!v || typeof v !== 'object' || seen.has(v)) continue;
                        seen.add(v);
                        if (each(v) === true) return steps;
                        if (Array.isArray(v.__k)) for (var j = v.__k.length - 1; j >= 0; j--) stack.push(v.__k[j]);
                    }
                    return steps > 1 ? 0 : -1;
                }
                addEventListener('vp-wall-refresh', function () {
                    var el = document.querySelector('[data-vp-wall="1"]');
                    if (!el) return;
                    var res = 'ok';
                    var r = walk(function (v) {
                        var hooks = v.__c && v.__c.__H && v.__c.__H.__;
                        if (!hooks) return;
                        for (var i = 0; i < hooks.length; i++) {
                            var fn = hooks[i] && hooks[i].__;
                            if (typeof fn !== 'function') continue;
                            var src = String(fn);
                            if (src.length < 600 && src.indexOf('invalidateWallCache') > -1 && src.indexOf('await') > -1) {
                                try { fn(); } catch (e) { res = 'err'; }
                                return true;
                            }
                        }
                    });
                    if (r <= 0) res = r < 0 ? 'novnode' : 'nofunc';
                    el.setAttribute('data-vp-res', res);
                });
                addEventListener('vp-unpin', function () {
                    var m = null;
                    try { m = JSON.parse(sessionStorage.getItem('vp_prof_sort') || 'null'); } catch (e) { }
                    var done = new Set();
                    function profile(o) {
                        if (!o || typeof o !== 'object' || Array.isArray(o) || done.has(o) || typeof o.username !== 'string' || !('pinnedPostId' in o)) return;
                        done.add(o);
                        try {
                            if (m && o.username.toLowerCase() === String(m.u).toLowerCase() && o.pinnedPostId) { o.__vpPin = o.pinnedPostId; o.pinnedPostId = null; }
                            else if (!m && o.__vpPin) { o.pinnedPostId = o.__vpPin; delete o.__vpPin; }
                        } catch (e) { }
                    }
                    walk(function (v) {
                        if (v.props && typeof v.props === 'object') for (var k in v.props) profile(v.props[k]);
                        var c = v.__c, hooks = c && c.__H && c.__H.__;
                        if (!hooks) return;
                        for (var i = 0; i < hooks.length; i++) {
                            var st = hooks[i], val = st && st.__, deps = st && st.__H;
                            profile(val);
                            if (m && Array.isArray(val) && Array.isArray(deps) && deps.length === 3 && Array.isArray(deps[0]) && typeof deps[1] === 'string' && deps[2] === 'posts'
                                && val.length && val[0] && val[0].id === deps[1] && val !== deps[0]) {
                                st.__ = deps[0];
                                try { c.forceUpdate(); } catch (e) { }
                            }
                        }
                    });
                });
            } + ')();';
            document.documentElement.appendChild(sc);
            sc.remove();
        }
        function profWallRefresh() {
            return new Promise(done => {
                const art = document.querySelector('article.' + SELECTORS.post);
                if (!art) return done(false);
                profBridge();
                document.querySelectorAll('[data-vp-wall]').forEach(e => { e.removeAttribute('data-vp-wall'); e.removeAttribute('data-vp-res'); });
                art.setAttribute('data-vp-wall', '1');
                dispatchEvent(new Event('vp-wall-refresh'));
                setTimeout(() => done(art.getAttribute('data-vp-res') === 'ok'), 40);
            });
        }
        async function profOldLoad(login, btn, force) {
            const same = x => x && x.u && x.u.toLowerCase() === login.toLowerCase();
            const hide = login.toLowerCase() === 'neurosfw', label = btn.textContent;
            let base = force ? null : same(profOldPosts) ? profOldPosts : null;
            if (!base && !force) { const c = GM_getValue('vp_old_cache', null); if (same(c) && Array.isArray(c.posts)) base = c; }
            const incr = !!base && Date.now() - base.full < 12 * 3600e3;
            if (incr && Date.now() - base.at < 120e3) { profOldPosts = base; return 'client'; }
            const baseIds = new Set(incr ? base.posts.map(p => p.id) : []), byId = new Map(incr ? base.posts.map(p => [p.id, p]) : []);
            let cursor = null, finished = false;
            try {
                for (let n = 0; n < (incr ? 10 : 60) && !finished; n++) {
                    const r = await api(`/api/posts/user/${encodeURIComponent(login)}?limit=50&sort=new` + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
                    if (!r.ok) return null;
                    const j = await r.json(), d = j.data || j, list = (d.posts || []).filter(p => p && p.id && !(hide && SERVICE_POSTS.includes(p.id)));
                    let hit = false;
                    list.forEach(p => { if (baseIds.has(p.id)) hit = true; byId.set(p.id, p); });
                    cursor = (d.pagination && d.pagination.nextCursor) || d.nextCursor || null;
                    if (!(d.posts || []).length || !cursor || hit) finished = true;
                    else {
                        btn.textContent = label + ' ' + byId.size;
                        await new Promise(res => setTimeout(res, 350));
                        if (apiPaused()) return null;
                    }
                }
            } finally { btn.textContent = label; }
            if (!finished && incr) return profOldLoad(login, btn, true);
            if (!finished) { vpNote('Слишком много постов для такой сортировки'); return null; }
            profOldPosts = { u: login, at: Date.now(), full: incr ? base.full : Date.now(), posts: [...byId.values()].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)) };
            try { GM_setValue('vp_old_cache', profOldPosts); } catch (e) { }
            return 'client';
        }
        const PSORT_TRY = { old: ['old', 'oldest', 'asc'], popular: ['popular'] };
        async function profSortProbe(login, mode) {
            const get = async sort => {
                const r = await api(`/api/posts/user/${encodeURIComponent(login)}?limit=10&sort=${sort}`);
                if (!r.ok) return null;
                const j = await r.json(), d = j.data || j;
                return Array.isArray(d.posts) ? d.posts.filter(p => p && !p.isPinned) : null;
            };
            const base = await get('new');
            if (!base) return null;
            for (const v of PSORT_TRY[mode]) {
                const list = await get(v);
                if (!list) continue;
                if (base.length < 2 || list.length < 2) return v;
                if (mode === 'old') {
                    if (list.every((p, i) => !i || Date.parse(p.createdAt) >= Date.parse(list[i - 1].createdAt)) && list[0].id !== base[0].id) return v;
                } else if (list.map(p => p.id).join() !== base.map(p => p.id).join()) return v;
            }
            return null;
        }
        function psortAnchor() {
            const tabs = [...document.querySelectorAll('.vp-tabs')].find(t => /Лайки/.test(t.textContent) && /Посты/.test(t.textContent));
            if (!tabs) return null;
            const ind = tabs.querySelector('.vp-tab-ind'), first = tabs.querySelector('button');
            if (ind && first && Math.abs(ind.getBoundingClientRect().left - first.getBoundingClientRect().left) > 8) return 'likes';
            let t = tabs;
            for (let i = 0; i < 2 && t.parentElement && t.parentElement.children.length === 1; i++) t = t.parentElement;
            return t;
        }
        function profileSort() {
            const m = location.pathname.match(/^\/@([\w.]+)\/?$/), old = document.querySelector('.vp-psort');
            const anchor = m && psortAnchor();
            const art = anchor && anchor !== 'likes' && document.querySelector('article.' + SELECTORS.post);
            if (!art || !art.querySelector('a[href="/@' + m[1] + '"]')) {
                if (!old) return;
                if (!m || anchor === 'likes' || old.dataset.login.toLowerCase() !== m[1].toLowerCase()) { psortLeave(old); return; }
                if (!old.dataset.lost) { old.dataset.lost = String(Date.now()); setTimeout(profileSort, 1700); return; }
                if (Date.now() - +old.dataset.lost > 1500) psortLeave(old);
                return;
            }
            if (old) delete old.dataset.lost;
            const login = m[1], o = profSortMode();
            let cur = o && o.u.toLowerCase() === login.toLowerCase() ? o.s : 'new';
            if (old && old.dataset.login === login && (old.classList.contains('vp-busy') || (old.dataset.cur === cur && old.nextElementSibling === art))) return;
            if (old) psortLeave(old);
            const box = document.createElement('div');
            box.className = 'vp-psort';
            box.dataset.login = login;
            box.dataset.cur = cur;
            const ind = document.createElement('span');
            ind.className = 'vp-psort-ind';
            box.appendChild(ind);
            PSORT.forEach(([s, label]) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.dataset.s = s;
                b.textContent = label;
                b.classList.toggle('vp-on', s === cur);
                b.addEventListener('click', async () => {
                    const was = box.dataset.cur;
                    if (s === was) return;
                    const t0 = Date.now();
                    box.classList.add('vp-busy');
                    const show = k => {
                        box.querySelectorAll('button').forEach(x => x.classList.toggle('vp-on', x.dataset.s === k));
                        box.dataset.cur = k;
                        psortMove(box, true);
                    };
                    const back = msg => { show(was); vpNote(msg); box.classList.remove('vp-busy'); };
                    show(s);
                    try {
                        if (s === 'new') sessionStorage.removeItem(PROF_SORT_KEY);
                        else {
                            profSortPause = true;
                            let v;
                            try {
                                v = await profSortProbe(login, s);
                                if (!v && s === 'old') v = await profOldLoad(login, b);
                            } finally { profSortPause = false; }
                            if (!v) return back('Сайт не отдаёт такую сортировку');
                            sessionStorage.setItem(PROF_SORT_KEY, JSON.stringify({ u: login, s, v }));
                        }
                        profUnpinSoon();
                        const rest = 520 - (Date.now() - t0);
                        if (rest > 0) await new Promise(r => setTimeout(r, rest));
                        if (await profWallRefresh()) {
                            setTimeout(() => box.classList.remove('vp-busy'), 400);
                            return;
                        }
                        const sm = profSortMode();
                        if (sm && sm.v === 'client') {
                            sessionStorage.removeItem(PROF_SORT_KEY);
                            profUnpinSoon();
                            return back('Не вышло переключить сортировку');
                        }
                        sessionStorage.setItem('vp-soft', String(Date.now()));
                        sessionStorage.setItem('vp-intro-at', String(Date.now()));
                        location.reload();
                    } catch (e) { logErr('сортировка профиля', e); back('Не вышло переключить сортировку'); }
                });
                box.appendChild(b);
            });
            art.parentElement.insertBefore(box, art);
            const keep = [psortFrom && Date.now() - psortFrom.at < 700 ? psortFrom : null, psortPrev && Date.now() - psortPrev.at < 4000 ? psortPrev : null].find(k => k && k.login === login);
            if (keep) {
                ind.dataset.x = keep.x;
                ind.dataset.w = keep.w;
                ind.style.transform = `translateX(${keep.x}px)`;
                ind.style.width = keep.w + 'px';
            }
            psortMove(box, !!keep);
            profBridge();
            if (o) profUnpinSoon();
            if (typeof ResizeObserver === 'function') new ResizeObserver(() => psortMove(box, false)).observe(box);
        }
        onDom(profileSort);
