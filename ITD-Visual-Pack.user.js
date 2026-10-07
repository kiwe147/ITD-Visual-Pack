// ==UserScript==
// @name         ITD Visual Pack
// @name:ru      ИТД X
// @name:en      ITD X
// @namespace    http://tampermonkey.net/
// @version      3.5.2.6
// @author       NeuroSFW
// @description  Подсветка ника + подсветка аватарок + фон + загрузка баннера + стикеры в комментариях + бейдж
// @match        https://xn--d1ah4a.com/*
// @match        https://итд.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @connect      raw.githubusercontent.com
// @connect      cdn.xn--d1ah4a.com
// @run-at       document-start
// @noframes
// @downloadURL  https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/main/ITD-Visual-Pack.user.js
// @updateURL    https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/main/ITD-Visual-Pack.user.js
// @icon         data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='n' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%2300e5ff'/><stop offset='.5' stop-color='%237c4dff'/><stop offset='1' stop-color='%23ff3d9a'/></linearGradient><linearGradient id='d' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%230a3d62'/><stop offset='.5' stop-color='%233b1a7a'/><stop offset='1' stop-color='%237a1450'/></linearGradient><linearGradient id='m' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%231565c0'/><stop offset='.5' stop-color='%235e35b1'/><stop offset='1' stop-color='%23ad1457'/></linearGradient><filter id='b' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='2.2'/></filter><filter id='s' x='-20%' y='-20%' width='140%' height='140%'><feDropShadow dx='0' dy='1.5' stdDeviation='1.5' flood-opacity='.5'/></filter></defs><rect width='64' height='64' rx='16' fill='%230b0d13'/><g fill='none'><path d='M17 17L47 47M47 17L17 47' stroke='url(%23n)' stroke-opacity='1' stroke-width='12' stroke-linecap='round'/><path d='M17 17L47 47M47 17L17 47' stroke='%230b0d13' stroke-opacity='1' stroke-width='7' stroke-linecap='round'/></g><text x='32' y='40' font-family='Arial Black, Arial, sans-serif' font-weight='900' text-anchor='middle' font-size='21' fill='%23fff' filter='url(%23s)'>ИТД</text></svg>
// ==/UserScript==

(function () {
    'use strict';
    if (window.top !== window.self) return;
    const PHONE_MAX = 1173;
    const VERIFICATION_POST_ID = 'a0d6625a-b3ec-44c4-98da-48422af101d5';
    const STICKER_POST_ID = '92f2913c-18be-499a-bc03-97aed0947b34';
    const MSG_POST_ID = 'a53b53e0-9950-4f62-83f4-91e5985ef6c5';
    const GAMES_POST_ID = 'd5f8b7c0-b97d-40cd-bdd4-3c07b3ea0611';
    const OWNER_ID = '5e064703-104d-4794-bc28-9ed6f5847cca';
    const OWNER_PUB = 'BLrLT8O1H3uwudBCiyDf7xEWqFo-5AQCAInPIe_rP3Jn-Ws1gjwZJ5RvN0nNWNMY9cfHt2w32qVTBc3HwtwJ-tc';
    const TG_URL = 'https://t.me/NeuroSFW';
    const TG_CHAT_URL = 'https://t.me/+P7NeR_AEc35lYjEy';
    const AUTO_LIKE_KEY = 'itd_auto_like_ids';
    const addCss = css => {
        const st = document.createElement('style');
        st.textContent = css;
        document.head.appendChild(st);
        return st;
    };
    const GLYPH = {
        close: '<path d="M18 6 6 18M6 6l12 12"/>',
        check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
        phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
        camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/>'
    };
    function fpsMeter(box, label = '') {
        let n = 0, t0 = performance.now(), last = t0, worst = 0;
        (function tick(t) {
            if (!box.isConnected) return;
            n++; worst = Math.max(worst, t - last); last = t;
            if (t - t0 >= 1000) {
                const fps = Math.round(n * 1000 / (t - t0));
                box.textContent = `${label}${fps} FPS · рывок ${Math.round(worst)} мс`;
                box.dataset.bad = fps < 45 || worst > 50 ? '1' : '';
                box.style.color = box.dataset.bad ? '#ff6b6b' : '#6f6';
                n = 0; t0 = t; worst = 0;
            }
            requestAnimationFrame(tick);
        })(t0);
    }

    try {
        if (sessionStorage.getItem('vp-off') === '1') {
            const back = () => {
                const b = document.createElement('button');
                b.textContent = 'Включить ИТД X';
                b.style.cssText = 'position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:2147483000;padding:10px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(20,20,24,.9);color:#fff;font:600 14px system-ui,sans-serif;cursor:pointer';
                b.onclick = () => { sessionStorage.removeItem('vp-off'); location.reload(); };
                document.body.appendChild(b);
                const f = document.createElement('div');
                f.style.cssText = 'position:fixed;left:8px;top:8px;z-index:2147483000;padding:4px 8px;border-radius:8px;pointer-events:none;background:rgba(0,0,0,.75);color:#6f6;font:600 12px ui-monospace,monospace';
                f.textContent = 'без мода';
                document.body.appendChild(f);
                fpsMeter(f, 'без мода · ');
            };
            if (document.body) back(); else addEventListener('DOMContentLoaded', back);
            return;
        }
    } catch (e) { }
    function tabletViewport() {
        const meta = document.querySelector('meta[name="viewport"]');
        if (!meta) return;
        if (!meta.dataset.vpOrig) meta.dataset.vpOrig = meta.getAttribute('content') || 'width=device-width, initial-scale=1.0';
        const landscape = matchMedia('(orientation: landscape)').matches;
        const w = landscape ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
        const on = GM_getValue('tabletDesktop', true) && w >= 1024 && w <= PHONE_MAX;
        const want = on ? 'width=1180' : meta.dataset.vpOrig;
        if (meta.getAttribute('content') !== want) meta.setAttribute('content', want);
    }
    if (document.querySelector('meta[name="viewport"]')) tabletViewport();
    else document.addEventListener('DOMContentLoaded', tabletViewport);
    addEventListener('orientationchange', () => setTimeout(tabletViewport, 50));
    matchMedia('(orientation: landscape)').addEventListener('change', tabletViewport);

    const vpErrors = [];
    const logErr = (where, e) => { vpErrors.push(new Date().toTimeString().slice(0, 8) + ' ' + where + ': ' + (e && (e.message || e))); if (vpErrors.length > 30) vpErrors.shift(); };

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
                let res = origFetch.apply(this, arguments);
                try {
                    const url = typeof input === 'string' ? input : input && input.url;
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

    const TAB_ID = Math.random().toString(36).slice(2);
    const apiPaused = () => Date.now() < (+GM_getValue('vp_api_pause', 0) || 0);
    function apiPause(res) {
        if (!res || res.status !== 429) return;
        const s = Math.max(60, +(res.headers && res.headers.get('Retry-After')) || 0);
        GM_setValue('vp_api_pause', Math.max(+GM_getValue('vp_api_pause', 0) || 0, Date.now() + s * 1000));
    }
    function leadTab() {
        const l = GM_getValue('vp_lead_tab', null), now = Date.now();
        if (l && l.id !== TAB_ID && now - l.at < 20000 && (document.hidden || !l.hidden)) return false;
        GM_setValue('vp_lead_tab', { id: TAB_ID, at: now, hidden: document.hidden });
        return true;
    }
    setInterval(() => { const l = GM_getValue('vp_lead_tab', null); if (l && l.id === TAB_ID) GM_setValue('vp_lead_tab', { id: TAB_ID, at: Date.now(), hidden: document.hidden }); }, 5000);
    const soundVolume = () => Math.max(0, Math.min(100, +GM_getValue('soundVolume', 100))) / 100;
    const INTRO = {
        LOCK: [620, 1020, 1420],
        FLY: 520,
        SETTLE: 170,
        SHAKE: [4, 6, 9],
        VOLUME: 0.11,
        FROM: [{ ang: 200, rot: -110, sc: 1.8 }, { ang: 272, rot: 80, sc: 2.4 }, { ang: -12, rot: 130, sc: 1.6 }],
        X_DRAW: 170,
        X_GAP: 150,
        SPLIT: 380,
        IDLE: 3000,
        RARE: [[true, 0.05 / 3], ['assemble', 0.05 / 3], ['twist', 0.05 / 3]],
        RARE_HOLD: 550
    };
    INTRO.X = INTRO.LOCK[2] + 220;
    INTRO.EXIT = INTRO.X + INTRO.X_GAP + INTRO.X_DRAW + 380;
    function introPlan(rare) {
        if (rare === 'twist') {
            const LOCK = [620, 1020, 1760], FLY = [520, 520, 230];
            const BOUNCE = LOCK[1] + 250, WAVE = LOCK[2] + 330, X = WAVE + 420, STICK = X + 430;
            return { LOCK, FLY, BOUNCE, WAVE, X, STICK, X_DRAW: 0, X_GAP: 0, EXIT: STICK + 480 };
        }
        if (rare === 'assemble') {
            const LOCK = [1150, 1500, 1850], ASM = 950;
            const X = LOCK[2] + 280, X_DRAW = INTRO.X_DRAW, X_GAP = INTRO.X_GAP;
            const TICKS = [];
            let t = X + X_GAP + X_DRAW + 260, a = 0;
            [[12, 1], [6, -1], [6, 1]].forEach(([n, dir]) => {
                for (let k = 0; k < n; k++) {
                    t += 28 + 40 * Math.pow(k / (n - 1), 2);
                    a += 30 * dir;
                    TICKS.push({ t: Math.round(t), a });
                }
                t += 150;
            });
            const LOCKED = TICKS[TICKS.length - 1].t + 90;
            return { LOCK, ASM, FLY: LOCK.map(() => ASM), X, X_DRAW, X_GAP, TICKS, LOCKED, EXIT: LOCKED + 560 };
        }
        if (!rare) return { LOCK: INTRO.LOCK, FLY: INTRO.LOCK.map(() => INTRO.FLY), X: INTRO.X, X_DRAW: INTRO.X_DRAW, X_GAP: INTRO.X_GAP, EXIT: INTRO.EXIT };
        const LOCK = [620, 1020, 1960], FLY = [520, 520, 1040];
        const X = LOCK[2] + 300, X_DRAW = 300, X_GAP = 70;
        return { LOCK, FLY, X, X_DRAW, X_GAP, EXIT: X + X_GAP + X_DRAW + 380 + INTRO.RARE_HOLD };
    }

    function introSound(ctx, at, rare) {
        const out = ctx.createDynamicsCompressor();
        out.connect(ctx.destination);
        const master = ctx.createGain();
        master.gain.value = INTRO.VOLUME * soundVolume();
        master.connect(out);
        const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const nd = noise.getChannelData(0);
        for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
        const env = (param, t, peak, attack, decay) => {
            param.setValueAtTime(0.0001, t);
            param.exponentialRampToValueAtTime(peak, t + attack);
            param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
        };
        function whoosh(t, dur, low) {
            const src = ctx.createBufferSource();
            src.buffer = noise;
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.Q.value = 1.2;
            bp.frequency.setValueAtTime(low ? 140 : 300, t);
            bp.frequency.exponentialRampToValueAtTime(low ? 1500 : 3200, t + dur);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.45, t + dur * 0.95);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
            src.connect(bp).connect(g).connect(master);
            src.start(t);
            src.stop(t + dur + 0.1);
        }
        const TAIL = 1.6;
        const tailEnv = (param, t, peak, attack) => {
            param.setValueAtTime(0.0001, t);
            param.exponentialRampToValueAtTime(peak, t + attack);
            param.exponentialRampToValueAtTime(peak * 0.5, t + attack + 0.3);
            param.linearRampToValueAtTime(0, t + attack + 0.3 + TAIL);
        };
        const echo = ctx.createConvolver();
        const ir = ctx.createBuffer(2, ctx.sampleRate * 1.8, ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
            const d = ir.getChannelData(c);
            for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.5);
        }
        echo.buffer = ir;
        const echoGain = ctx.createGain();
        echoGain.gain.value = 0.35;
        echo.connect(echoGain).connect(master);

        function clank(t, heavy) {
            const end = t + (heavy ? 0.3 + TAIL + 0.1 : 1.2);
            const thump = ctx.createOscillator();
            thump.frequency.setValueAtTime(heavy ? 110 : 150, t);
            thump.frequency.exponentialRampToValueAtTime(heavy ? 45 : 48, t + (heavy ? 0.9 : 0.25));
            const tg = ctx.createGain();
            if (heavy) tailEnv(tg.gain, t, 1, 0.004);
            else env(tg.gain, t, 0.8, 0.004, 0.3);
            thump.connect(tg).connect(master);
            if (heavy) tg.connect(echo);
            thump.start(t);
            thump.stop(end);
            if (heavy) {
                const rumble = ctx.createBufferSource();
                rumble.buffer = noise;
                rumble.loop = true;
                const lp = ctx.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.value = 160;
                const rg = ctx.createGain();
                tailEnv(rg.gain, t, 0.9, 0.01);
                rumble.connect(lp).connect(rg).connect(master);
                rg.connect(echo);
                rumble.start(t);
                rumble.stop(end);
            }
            [1, 1.47, 2.09, 2.76, 3.9].forEach((k, i) => {
                const m = ctx.createOscillator();
                m.type = 'triangle';
                m.frequency.value = (heavy ? 420 : 560) * k;
                const mg = ctx.createGain();
                env(mg.gain, t, 0.16 / (i + 1), 0.002, (heavy ? 0.6 : 0.45) / (1 + i * 0.4));
                m.connect(mg).connect(master);
                m.start(t);
                m.stop(t + 1);
            });
            const click = ctx.createBufferSource();
            click.buffer = noise;
            const hp = ctx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 2000;
            const cg = ctx.createGain();
            env(cg.gain, t, 0.6, 0.001, 0.05);
            click.connect(hp).connect(cg).connect(master);
            click.start(t, Math.random() * 0.5);
            click.stop(t + 0.1);
        }
        function slash(t, dur) {
            const src = ctx.createBufferSource();
            src.buffer = noise;
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.Q.value = 2.5;
            bp.frequency.setValueAtTime(1200, t);
            bp.frequency.exponentialRampToValueAtTime(7000, t + dur);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.55, t + dur * 0.7);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
            src.connect(bp).connect(g).connect(master);
            src.start(t, Math.random() * 0.5);
            src.stop(t + dur + 0.1);
            const zing = ctx.createOscillator();
            zing.type = 'sine';
            zing.frequency.setValueAtTime(900, t + dur * 0.5);
            zing.frequency.exponentialRampToValueAtTime(2600, t + dur);
            const zg = ctx.createGain();
            env(zg.gain, t + dur * 0.5, 0.07, 0.01, 0.16);
            zing.connect(zg).connect(master);
            zg.connect(echo);
            zing.start(t + dur * 0.5);
            zing.stop(t + dur + 0.3);
        }
        function subDrop(t) {
            const o = ctx.createOscillator();
            o.frequency.setValueAtTime(70, t);
            o.frequency.exponentialRampToValueAtTime(32, t + 1.2);
            const g = ctx.createGain();
            tailEnv(g.gain, t, 0.9, 0.01);
            o.connect(g).connect(master);
            o.start(t);
            o.stop(t + 0.3 + TAIL + 0.2);
        }
        const P = introPlan(rare);
        function tick(t, gain, freq) {
            const src = ctx.createBufferSource();
            src.buffer = noise;
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.Q.value = 6;
            bp.frequency.value = freq;
            const g = ctx.createGain();
            env(g.gain, t, gain, 0.001, 0.02);
            src.connect(bp).connect(g).connect(master);
            src.start(t, Math.random() * 0.5);
            src.stop(t + 0.05);
        }
        if (rare === 'twist') {
            whoosh(at(P.LOCK[0] - P.FLY[0]), P.FLY[0] / 1000); clank(at(P.LOCK[0]), false);
            whoosh(at(P.LOCK[1] - P.FLY[1]), P.FLY[1] / 1000); clank(at(P.LOCK[1]), false);
            tick(at(P.BOUNCE), 0.5, 900); clank(at(P.BOUNCE + 10), false);
            const fall = ctx.createOscillator(), fg = ctx.createGain();
            fall.type = 'sine';
            fall.frequency.setValueAtTime(1500, at(P.LOCK[2] - P.FLY[2]));
            fall.frequency.exponentialRampToValueAtTime(260, at(P.LOCK[2]));
            fg.gain.setValueAtTime(0.0001, at(P.LOCK[2] - P.FLY[2]));
            fg.gain.exponentialRampToValueAtTime(0.18, at(P.LOCK[2] - 20));
            fg.gain.exponentialRampToValueAtTime(0.0001, at(P.LOCK[2] + 10));
            fall.connect(fg).connect(master);
            fall.start(at(P.LOCK[2] - P.FLY[2])); fall.stop(at(P.LOCK[2] + 40));
            clank(at(P.LOCK[2]), true);
            subDrop(at(P.LOCK[2]));
            [0, 80, 160].forEach(d => tick(at(P.WAVE + d + 60), 0.25, 1200));
            const whir = ctx.createBufferSource(), wbp = ctx.createBiquadFilter(), wg = ctx.createGain();
            whir.buffer = noise; whir.loop = true;
            wbp.type = 'bandpass'; wbp.Q.value = 2; wbp.frequency.value = 1800;
            wg.gain.setValueAtTime(0.0001, at(P.X));
            const dur = (P.STICK - P.X) / 1000;
            for (let k = 0, n = 26; k < n; k++) {
                const tt = at(P.X) + dur * Math.pow(k / n, 0.8);
                wg.gain.setValueAtTime(0.35 * (0.4 + 0.6 * k / n), tt);
                wg.gain.setValueAtTime(0.02, tt + 0.012);
            }
            whir.connect(wbp).connect(wg).connect(master);
            whir.start(at(P.X)); whir.stop(at(P.STICK));
            clank(at(P.STICK), false);
            const tw = ctx.createOscillator(), vib = ctx.createOscillator(), vg = ctx.createGain(), tg = ctx.createGain();
            tw.type = 'triangle'; tw.frequency.value = 190;
            vib.frequency.value = 24; vg.gain.value = 14;
            vib.connect(vg).connect(tw.frequency);
            env(tg.gain, at(P.STICK), 0.35, 0.005, 0.55);
            tw.connect(tg).connect(master); tg.connect(echo);
            tw.start(at(P.STICK)); vib.start(at(P.STICK)); tw.stop(at(P.STICK + 700)); vib.stop(at(P.STICK + 700));
            whoosh(at(P.EXIT - 200), 0.26);
            return;
        }
        if (rare === 'assemble') {
            P.LOCK.forEach((lock, i) => {
                for (let ms = lock - P.ASM + 120, k = 0; ms < lock - 30; k++) {
                    const q = (ms - (lock - P.ASM)) / P.ASM;
                    tick(at(ms), 0.08 + 0.22 * q, 2200 + Math.random() * 2600);
                    ms += 26 - 17 * q + Math.random() * 4;
                }
                clank(at(lock), i === 2);
            });
            [0, P.X_GAP].forEach(d => slash(at(P.X + d), P.X_DRAW / 1000));
            P.TICKS.forEach(tk => { tick(at(tk.t), 0.5, 1700); tick(at(tk.t + 6), 0.25, 3400); });
            clank(at(P.LOCKED), true);
            whoosh(at(P.EXIT - 200), 0.26);
            return;
        }
        P.LOCK.forEach((lock, i) => {
            whoosh(at(lock - P.FLY[i]), P.FLY[i] / 1000, rare && i === 2);
            clank(at(lock), i === 2);
        });
        if (rare) {
            subDrop(at(P.LOCK[2]));
            whoosh(at(P.X - 140), 0.3, true);
        }
        [0, P.X_GAP].forEach(d => slash(at(P.X + d), P.X_DRAW / 1000));
        whoosh(at(P.EXIT - 200), 0.26);
    }

    function introIsLight() {
        const t = document.documentElement.getAttribute('data-theme');
        return t ? t !== 'dark' : GM_getValue('siteTheme', 'dark') === 'light';
    }
    let introOn = false;
    function playIntro(mode, variant) {
        const root = document.documentElement;
        const rare = variant === true, asm = variant === 'assemble', twist = variant === 'twist';
        const light = introIsLight();
        const css = document.createElement('style');
        css.textContent = `
            .vpi-overlay { position: fixed; inset: 0; z-index: 2147483647; overflow: hidden; cursor: pointer;
                --vpi-bg: #000; --vpi-ink: #fff; --vpi-hole: #000; --vpi-hint: rgba(255, 255, 255, .38); }
            .vpi-overlay.vpi-light { --vpi-bg: #f5f5f5; --vpi-ink: #141414; --vpi-hole: #f5f5f5; --vpi-hint: rgba(0, 0, 0, .42); }
            .vpi-half { position: absolute; inset: 0; background: var(--vpi-bg); overflow: hidden; will-change: transform; }
            .vpi-half-0 { clip-path: inset(0 50% 0 0); }
            .vpi-half-1 { clip-path: inset(0 0 0 50%); }
            .vpi-world { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
            .vpi-word { position: relative; display: flex; gap: .05em; color: var(--vpi-ink); user-select: none; line-height: 1;
                font: 900 min(24vw, 36vh)/1 "Arial Black", "Segoe UI Black", "Helvetica Neue", Arial, sans-serif; }
            .vpi-letter { display: inline-block; will-change: transform, opacity, filter; }
            .vpi-fx { position: absolute; left: 0; top: 0; pointer-events: none; opacity: 0; }
            .vpi-spark { width: 2px; height: 16px; margin: -8px 0 0 -1px; border-radius: 1px;
                background: linear-gradient(var(--vpi-ink), transparent); }
            .vpi-flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; }
            .vpi-x { position: absolute; left: 50%; top: 50%; width: min(46vw, 70vh); height: min(46vw, 70vh);
                transform: translate(-50%, -50%); overflow: visible; pointer-events: none; will-change: filter; }
            .vpi-seam { position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; margin-left: -1px; opacity: 0; pointer-events: none;
                background: linear-gradient(transparent, #fff 30%, #fff 70%, transparent); box-shadow: 0 0 18px 2px #7c4dff; }
            .vpi-hole { stroke: var(--vpi-hole); }
            .vpi-ghost { position: absolute; }
            .vpi-xpulse { opacity: 0; }
            .vpi-shards { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        `;
        const el = (cls, parent, text) => {
            const e = document.createElement('div');
            e.className = cls;
            if (text) e.textContent = text;
            parent.appendChild(e);
            return e;
        };
        const ov = el('vpi-overlay' + (light ? ' vpi-light' : ''), root);
        introOn = true;
        const halves = [0, 1].map(i => el('vpi-half vpi-half-' + i, ov));
        const worlds = halves.map(h => el('vpi-world', h));
        const xMarks = worlds.map((w, n) => {
            w.insertAdjacentHTML('beforeend', `<svg class="vpi-x" viewBox="0 0 100 100">
                <defs><linearGradient id="vpiX${n}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#00e5ff"/><stop offset=".5" stop-color="#7c4dff"/><stop offset="1" stop-color="#ff3d9a"/>
                </linearGradient></defs>
                <g fill="none" stroke-linecap="round">
                    <path class="vpi-x1" d="M14 14L86 86" pathLength="1" stroke="url(#vpiX${n})" stroke-width="12"/>
                    <path class="vpi-x1 vpi-hole" d="M14 14L86 86" pathLength="1" stroke-width="7"/>
                    <path class="vpi-x2" d="M86 14L14 86" pathLength="1" stroke="url(#vpiX${n})" stroke-width="12"/>
                    <path class="vpi-x2 vpi-hole" d="M86 14L14 86" pathLength="1" stroke-width="7"/>
                </g></svg>`);
            return w.lastElementChild;
        });
        const words = worlds.map(w => el('vpi-word', w));
        const flash = el('vpi-flash', ov);
        const seam = el('vpi-seam', ov);
        root.appendChild(css);
        const prevOverflow = root.style.overflow;
        root.style.overflow = 'hidden';

        const { SETTLE, FROM, SPLIT } = INTRO;
        const PLAN = introPlan(variant);
        const { LOCK, FLY, X, X_DRAW, X_GAP, EXIT } = PLAN;
        const SHAKE = rare ? [5, 7, 16] : INTRO.SHAKE;
        const GLOW = light ? '124,77,255' : '255,255,255';
        const vmax = Math.max(innerWidth, innerHeight);
        const rnd = (a, b) => a + Math.random() * (b - a);
        const anims = [];
        const play = (target, frames, opts) => { const a = target.animate(frames, { fill: 'both', ...opts }); anims.push(a); return a; };
        const playBoth = (targets, frames, opts) => targets.map(t => play(t, frames, opts));

        function shake(at, amp) {
            const frames = [];
            for (let i = 0, n = 8; i <= n; i++) {
                const k = i === n ? 0 : amp * Math.pow(1 - i / n, 1.5) * (i % 2 ? -1 : 1);
                frames.push({ transform: `translate(${k * rnd(.6, 1)}px, ${k * rnd(-.8, .8)}px)` });
            }
            playBoth(worlds, frames, { delay: at, duration: 340, fill: 'none', composite: 'add' });
        }
        function burst(at, x, y, size, strong) {
            const big = rare && strong;
            for (let i = 0, n = strong ? (big ? 32 : 20) : 10; i < n; i++) {
                const ang = rnd(0, Math.PI * 2), r0 = size * .22, dist = size * rnd(.3, strong ? .75 : .55) * (big ? 1.35 : 1);
                const rot = ang * 180 / Math.PI + 90, c = Math.cos(ang), sn = Math.sin(ang);
                playBoth(worlds.map(w => el('vpi-fx vpi-spark', w)), [
                    { transform: `translate(${x + c * r0}px, ${y + sn * r0}px) rotate(${rot}deg)`, opacity: 1 },
                    { transform: `translate(${x + c * (r0 + dist)}px, ${y + sn * (r0 + dist)}px) rotate(${rot}deg) scaleY(.2)`, opacity: 0 }
                ], { delay: at, duration: rnd(300, 560), easing: 'cubic-bezier(.1,.8,.3,1)', fill: 'forwards' });
            }
            play(flash, [{ opacity: 0 }, { opacity: big ? .18 : strong ? .14 : .06, offset: .12 }, { opacity: 0 }],
                { delay: at, duration: strong ? 380 : 220, fill: 'none' });
        }

        const letters = words.map(w => [...'ИТД'].map(ch => el('vpi-letter', w, ch)));
        const wr = worlds[0].getBoundingClientRect();
        if (asm) letters[0].forEach((box, i) => {
            const lock = LOCK[i], lr = box.getBoundingClientRect();
            playBoth([letters[0][i], letters[1][i]], [
                { opacity: 0, transform: 'none', filter: `drop-shadow(0 0 0 rgba(${GLOW},0))` },
                { opacity: 1, transform: 'scale(1.07, .93)', filter: `drop-shadow(0 0 30px rgba(${GLOW},.9))`, offset: .25 },
                { opacity: 1, transform: 'none', filter: `drop-shadow(0 0 10px rgba(${GLOW},.3))` }
            ], { delay: lock - 25, duration: SETTLE + 120, easing: 'cubic-bezier(.2,.9,.3,1)' });
            shake(lock, SHAKE[i]);
            burst(lock, lr.left - wr.left + lr.width / 2, lr.top - wr.top + lr.height / 2, lr.height * (i === 2 ? 1.8 : 1.3), i === 2);
        });
        if (!asm) letters[0].forEach((box, i) => {
            if (twist && i === 2) return;
            const lock = LOCK[i], f = FROM[i], fly = FLY[i];
            const lr = box.getBoundingClientRect();
            const cx = lr.left - wr.left + lr.width / 2, cy = lr.top - wr.top + lr.height / 2;
            const a = f.ang * Math.PI / 180, dist = vmax * .75;
            const dx = Math.cos(a) * dist, dy = Math.sin(a) * dist;
            const hit = fly / (fly + SETTLE);
            const flyEase = 'cubic-bezier(.6,0,.9,.35)';
            const at = k => `translate(${dx * (1 - k)}px, ${dy * (1 - k)}px) rotate(${f.rot * (1 - k)}deg) scale(${1 + (f.sc - 1) * (1 - k)})`;
            const from = { transform: at(0), opacity: 0, filter: `blur(10px) drop-shadow(0 0 0 rgba(${GLOW},0))`, easing: flyEase };
            const touch = { transform: `translate(${-dx * .012}px, ${-dy * .012}px) scale(1.07, .93)`, opacity: 1, filter: `blur(0px) drop-shadow(0 0 30px rgba(${GLOW},.9))`, offset: hit, easing: 'cubic-bezier(.2,.9,.3,1)' };
            const flight = rare && i === 2 ? [
                { ...from, easing: 'cubic-bezier(.15,.7,.35,1)' },
                { transform: at(.8), opacity: 1, filter: `blur(2px) drop-shadow(0 0 12px rgba(${GLOW},.4))`, offset: hit * .3, easing: 'linear' },
                { transform: at(.88), opacity: 1, filter: `blur(0px) drop-shadow(0 0 16px rgba(${GLOW},.5))`, offset: hit * .86, easing: 'cubic-bezier(.8,0,1,.5)' },
                touch
            ] : [from, { opacity: 1, offset: hit * .25 }, touch];
            playBoth([letters[0][i], letters[1][i]], [
                ...flight,
                { transform: 'none', opacity: 1, filter: `blur(0px) drop-shadow(0 0 10px rgba(${GLOW},.3))` }
            ], { delay: lock - fly, duration: fly + SETTLE });
            if (rare) [1, 2].forEach(k => {
                const ghosts = words.map(w => el('vpi-letter vpi-ghost', w, box.textContent));
                ghosts.forEach(g => { g.style.left = box.offsetLeft + 'px'; g.style.top = box.offsetTop + 'px'; });
                const path = flight.slice(0, -1).map(fr => ({ transform: fr.transform, easing: fr.easing, offset: fr.offset === undefined ? undefined : fr.offset / hit }))
                    .filter(fr => fr.transform);
                playBoth(ghosts, [
                    ...path.map((fr, j) => ({ ...fr, opacity: j === 0 ? 0 : .42 / k, filter: 'blur(8px)' })),
                    { transform: touch.transform, opacity: 0, filter: 'blur(4px)' }
                ], { delay: lock - fly + 45 * k, duration: fly, fill: 'both' });
            });
            shake(lock, SHAKE[i]);
            burst(lock, cx, cy, lr.height * (i === 2 ? 2.2 : 1.5), i === 2);
        });

        if (twist) {
            const all = i => letters.map(l => l[i]);
            const hop = (i, at, h, dur) => playBoth(all(i), [
                { transform: 'translateY(0)' },
                { transform: `translateY(${-h}px) scale(.96, 1.05)`, offset: .45, easing: 'cubic-bezier(.3,0,.7,1)' },
                { transform: 'translateY(0) scale(1.05, .95)', offset: .85 },
                { transform: 'translateY(0)' }
            ], { delay: at, duration: dur, easing: 'cubic-bezier(.2,.7,.3,1)', composite: 'add', fill: 'none' });
            const tb = letters[0][1].getBoundingClientRect();
            playBoth(all(1), [
                { transform: 'translateY(0) rotate(0deg)' },
                { transform: `translateY(${-tb.height * .42}px) rotate(-9deg)`, offset: .5, easing: 'cubic-bezier(.3,0,.7,1)' },
                { transform: 'translateY(0) rotate(0deg) scale(1.06, .92)', offset: .9 },
                { transform: 'translateY(0) rotate(0deg)' }
            ], { delay: LOCK[1] + 30, duration: PLAN.BOUNCE - LOCK[1] + 30, easing: 'cubic-bezier(.2,.7,.3,1)', composite: 'add', fill: 'none' });
            shake(PLAN.BOUNCE, 3);
            const db = letters[0][2].getBoundingClientRect();
            playBoth(all(2), [
                { transform: `translateY(${-(db.bottom + db.height * 1.5)}px) scale(.94, 1.25)`, opacity: 0, filter: `blur(7px) drop-shadow(0 0 0 rgba(${GLOW},0))`, easing: 'cubic-bezier(.55,0,1,.45)' },
                { opacity: 1, offset: .04 },
                { transform: 'translateY(0) scale(1.18, .78)', opacity: 1, filter: `blur(0px) drop-shadow(0 0 40px rgba(${GLOW},1))`, offset: .55, easing: 'cubic-bezier(.2,.9,.3,1)' },
                { transform: 'translateY(-6px) scale(.97, 1.04)', opacity: 1, offset: .78 },
                { transform: 'none', opacity: 1, filter: `blur(0px) drop-shadow(0 0 10px rgba(${GLOW},.3))` }
            ], { delay: LOCK[2] - FLY[2], duration: FLY[2] / .55 });
            shake(LOCK[2], 20);
            burst(LOCK[2], db.left - wr.left + db.width / 2, db.bottom - wr.top - db.height * .15, db.height * 2.2, true);
            play(flash, [{ opacity: 0 }, { opacity: .2, offset: .1 }, { opacity: 0 }], { delay: LOCK[2], duration: 380, fill: 'none' });
            [0, 1].forEach(i => hop(i, LOCK[2] + 20, 30, 300));
            [0, 1, 2].forEach(i => hop(i, PLAN.WAVE + i * 80, 22, 280));
            const T = PLAN.STICK - PLAN.X;
            playBoth(xMarks, [
                { transform: `translate(calc(-50% + ${innerWidth * .75}px), -50%) rotate(1440deg) scale(.5)`, opacity: 0 },
                { opacity: 1, offset: .12 },
                { transform: 'translate(-50%, -50%) rotate(0deg) scale(1)', opacity: 1 }
            ], { delay: PLAN.X, duration: T, easing: 'cubic-bezier(.15,.6,.35,1)' });
            playBoth(xMarks, [
                { transform: 'rotate(0deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(-6deg)' },
                { transform: 'rotate(4deg)' }, { transform: 'rotate(-2deg)' }, { transform: 'rotate(1deg)' }, { transform: 'rotate(0deg)' }
            ], { delay: PLAN.STICK, duration: 460, easing: 'ease-out', composite: 'add', fill: 'none' });
            shake(PLAN.STICK, 7);
            play(flash, [{ opacity: 0 }, { opacity: .06, offset: .3 }, { opacity: 0 }], { delay: PLAN.STICK, duration: 200, fill: 'none' });
            playBoth(xMarks, [
                { filter: 'drop-shadow(0 0 6px rgba(124,77,255,.5))' },
                { filter: 'drop-shadow(0 0 28px rgba(124,77,255,1))', offset: .3 },
                { filter: 'drop-shadow(0 0 12px rgba(124,77,255,.55))' }
            ], { delay: PLAN.STICK, duration: 520 });
        }
        if (!twist) ['.vpi-x1', '.vpi-x2'].forEach((sel, i) => {
            xMarks.forEach(xm => xm.querySelectorAll(sel).forEach(path => play(path, [
                { strokeDasharray: '1 1', strokeDashoffset: 1 },
                { strokeDasharray: '1 1', strokeDashoffset: 0 }
            ], { delay: X + i * X_GAP, duration: X_DRAW, easing: 'cubic-bezier(.7,0,.3,1)' })));
            play(flash, [{ opacity: 0 }, { opacity: .05, offset: .5 }, { opacity: 0 }], { delay: X + i * X_GAP + X_DRAW * .6, duration: 160, fill: 'none' });
        });
        if (!twist) shake(X + X_GAP + X_DRAW * .8, rare ? 10 : 3);
        if (!twist) playBoth(xMarks, [
            { filter: 'drop-shadow(0 0 0 rgba(124,77,255,0))' },
            { filter: 'drop-shadow(0 0 26px rgba(124,77,255,.95))', offset: .35 },
            { filter: 'drop-shadow(0 0 12px rgba(124,77,255,.55))' }
        ], { delay: X + X_GAP + X_DRAW, duration: 520 });

        if (rare) {
            playBoth(worlds, [{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }],
                { delay: 0, duration: EXIT, easing: 'linear', composite: 'add', fill: 'forwards' });
            playBoth(worlds, [{ transform: 'scale(1)' }, { transform: 'scale(1.13)', offset: .14 }, { transform: 'scale(1)' }],
                { delay: X + X_GAP + X_DRAW * .7, duration: 560, easing: 'cubic-bezier(.2,.8,.2,1)', composite: 'add', fill: 'none' });
            playBoth(xMarks, [
                { transform: 'translate(-50%, -50%) scale(2.6) rotate(-35deg)', opacity: 0 },
                { opacity: 1, offset: .2 },
                { transform: 'translate(-50%, -50%) scale(.94) rotate(3deg)', opacity: 1, offset: .8 },
                { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 }
            ], { delay: X - 90, duration: X_DRAW + X_GAP + 150, easing: 'cubic-bezier(.3,0,.2,1)' });
            const pulses = worlds.map((w, n) => {
                const c = xMarks[n].cloneNode(true);
                c.setAttribute('class', 'vpi-x vpi-xpulse');
                c.querySelectorAll('[id]').forEach(e => e.id += 'p');
                c.querySelectorAll('[stroke^="url"]').forEach(e => e.setAttribute('stroke', `url(#vpiX${n}p)`));
                w.insertBefore(c, xMarks[n]);
                return c;
            });
            playBoth(pulses, [
                { transform: 'translate(-50%, -50%) scale(1)', opacity: .85, filter: 'blur(0px)' },
                { transform: 'translate(-50%, -50%) scale(1.75)', opacity: 0, filter: 'blur(7px)' }
            ], { delay: X + X_GAP + X_DRAW, duration: 720, easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'forwards' });
        }

        if (asm) {
            const cv = document.createElement('canvas');
            cv.className = 'vpi-shards';
            ov.insertBefore(cv, flash);
            const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
            cv.width = W * dpr; cv.height = H * dpr;
            const g = cv.getContext('2d');
            g.scale(dpr, dpr);
            const cs = getComputedStyle(letters[0][0]);
            const ink = cs.color, fontPx = parseFloat(cs.fontSize);
            const step = Math.max(3, Math.round(fontPx / 52));
            const off = document.createElement('canvas');
            off.width = W; off.height = H;
            const o = off.getContext('2d', { willReadFrequently: true });
            o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
            o.textAlign = 'center';
            o.textBaseline = 'alphabetic';
            o.fillStyle = '#fff';
            const pieces = [];
            letters[0].forEach((box, li) => {
                const r = box.getBoundingClientRect(), m = o.measureText(box.textContent);
                const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
                o.clearRect(0, 0, W, H);
                o.fillText(box.textContent, cx, cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
                const x0 = Math.max(0, Math.floor(r.left - step)), y0 = Math.max(0, Math.floor(r.top - step));
                const w = Math.min(W - x0, Math.ceil(r.width + step * 2)), h = Math.min(H - y0, Math.ceil(r.height + step * 2));
                const px = o.getImageData(x0, y0, w, h).data;
                const lock = LOCK[li];
                for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
                    if (px[(y * w + x) * 4 + 3] < 128) continue;
                    const ang = rnd(0, Math.PI * 2), dist = vmax * rnd(.3, .8);
                    const t0 = lock - PLAN.ASM + rnd(0, PLAN.ASM * .62);
                    pieces.push({
                        tx: x0 + x, ty: y0 + y, li, t0, d: Math.min(rnd(230, 430), lock - 20 - t0),
                        sx: cx + Math.cos(ang) * dist, sy: cy + Math.sin(ang) * dist * .8, spin: rnd(-3, 3)
                    });
                }
            });
            const draw = t => {
                g.clearRect(0, 0, W, H);
                g.fillStyle = ink;
                for (const p of pieces) {
                    if (t < p.t0 || t >= LOCK[p.li] + 20) continue;
                    const k = Math.min(1, (t - p.t0) / p.d), e = 1 - Math.pow(1 - k, 3);
                    const x = p.sx + (p.tx - p.sx) * e, y = p.sy + (p.ty - p.sy) * e, sz = step * (.95 + (1 - e) * 1.4);
                    g.globalAlpha = Math.min(1, k * 3);
                    if (e < .98) {
                        g.save(); g.translate(x, y); g.rotate(p.spin * (1 - e)); g.fillRect(-sz / 2, -sz / 2, sz, sz); g.restore();
                    } else g.fillRect(x - sz / 2, y - sz / 2, sz, sz);
                }
                g.globalAlpha = 1;
            };
            const clock = play(cv, [{ opacity: 1 }, { opacity: 1 }], { duration: LOCK[2] + 80, fill: 'none' });
            const frame = () => {
                if (!cv.isConnected) return;
                const t = clock.currentTime;
                if (t === null || t > LOCK[2] + 60) { cv.remove(); return; }
                draw(t);
                requestAnimationFrame(frame);
            };
            requestAnimationFrame(frame);

            const T0 = PLAN.TICKS[0].t - 60, D = PLAN.LOCKED + 260 - T0;
            const rot = (a, sc = 1) => `translate(-50%, -50%) rotate(${a}deg) scale(${sc})`;
            const frames = [{ offset: 0, transform: rot(0) }];
            let prev = 0, prevT = T0;
            PLAN.TICKS.forEach(tk => {
                const move = Math.min(40, (tk.t - prevT) * .6);
                frames.push({ offset: (tk.t - move - T0) / D, transform: rot(prev) });
                frames.push({ offset: (tk.t - T0) / D, transform: rot(tk.a) });
                prev = tk.a; prevT = tk.t;
            });
            frames.push({ offset: (PLAN.LOCKED - T0) / D, transform: rot(prev) });
            frames.push({ offset: (PLAN.LOCKED + 60 - T0) / D, transform: rot(prev + 4, 1.1) });
            frames.push({ offset: 1, transform: rot(prev) });
            playBoth(xMarks, frames, { delay: T0, duration: D, easing: 'linear' });
            shake(PLAN.LOCKED, 9);
            play(flash, [{ opacity: 0 }, { opacity: .12, offset: .15 }, { opacity: 0 }], { delay: PLAN.LOCKED, duration: 300, fill: 'none' });
            playBoth(xMarks, [
                { filter: 'drop-shadow(0 0 12px rgba(124,77,255,.55))' },
                { filter: 'drop-shadow(0 0 30px rgba(124,77,255,1))', offset: .3 },
                { filter: 'drop-shadow(0 0 12px rgba(124,77,255,.55))' }
            ], { delay: PLAN.LOCKED, duration: 520, fill: 'forwards' });
        }

        play(seam, [
            { opacity: 0, transform: 'scaleY(0)' },
            { opacity: 1, transform: 'scaleY(1)', offset: .55 },
            { opacity: 0, transform: 'scaleY(1)' }
        ], { delay: EXIT - 140, duration: 260, easing: 'ease-out', fill: 'none' });
        const doors = [-1, 1].map((dir, i) => play(halves[i], [
            { transform: 'translateX(0)' },
            { transform: `translateX(${dir * 52}%)` }
        ], { delay: EXIT, duration: SPLIT, easing: 'cubic-bezier(.7,0,.3,1)', fill: 'forwards' }));
        const out = doors[1];

        let ctx = null;
        let done = false, started = false;
        const cleanup = () => {
            if (done) return;
            done = true;
            ov.remove();
            css.remove();
            introOn = false;
            document.dispatchEvent(new CustomEvent('vp-intro-done'));
            root.style.overflow = prevOverflow;
            if (ctx) setTimeout(() => ctx.close().catch(() => { }), 3500);
        };
        out.finished.then(cleanup, cleanup);
        const skip = () => {
            if (done) return;
            removeEventListener('keydown', skip, true);
            if (ctx) ctx.close().catch(() => { });
            ctx = null;
            ov.animate([{ opacity: getComputedStyle(ov).opacity }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).finished.then(cleanup, cleanup);
        };
        function begin(withSound) {
            if (started) return;
            started = true;
            for (const a of anims) { a.currentTime = 0; a.play(); }
            afterStart();
            if (withSound) syncSound();
        }
        function syncSound() {
            let queued = false;
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
                Promise.all([ctx.resume(), anims[0].ready]).then(() => {
                    if (!ctx || done) return;
                    queued = true;
                    const start = anims[0].startTime;
                    const toCtx = perf => {
                        const ts = ctx.getOutputTimestamp ? ctx.getOutputTimestamp() : null;
                        if (ts && ts.performanceTime > 0) return ts.contextTime + (perf - ts.performanceTime) / 1000;
                        return ctx.currentTime + (perf - performance.now()) / 1000 - (ctx.outputLatency || 0);
                    };
                    introSound(ctx, ms => Math.max(ctx.currentTime + 0.01, toCtx(start + ms)), variant);
                }, () => { });
            } catch (e) { ctx = null; }
            anims[0].ready.then(() => setTimeout(() => { if (!queued && ctx) { ctx.close().catch(() => { }); ctx = null; } }, 600), () => { });
        }
        function afterStart() {
            setTimeout(cleanup, EXIT + SPLIT + 2500);
            setTimeout(() => { if (done) return; ov.addEventListener('click', skip); addEventListener('keydown', skip, true); }, 400);
        }

        if (mode !== 'tap') { begin(mode === 'desk'); return anims; }

        for (const a of anims) a.pause();
        const idle = document.createElement('div');
        idle.className = 'vpi-idle';
        idle.innerHTML = `<div class="vpi-idle-logo"><svg viewBox="0 0 100 100"><defs><linearGradient id="vpiXi" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#00e5ff"/><stop offset=".5" stop-color="#7c4dff"/><stop offset="1" stop-color="#ff3d9a"/></linearGradient></defs>
            <g fill="none" stroke-linecap="round"><path d="M14 14L86 86M86 14L14 86" stroke="url(#vpiXi)" stroke-width="12"/>
            <path class="vpi-hole" d="M14 14L86 86M86 14L14 86" stroke-width="7"/></g></svg><span>ИТД</span></div><div class="vpi-idle-hint">коснись</div>`;
        ov.appendChild(idle);
        css.textContent += `
            .vpi-idle { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; }
            .vpi-idle-logo { position: relative; width: 96px; height: 96px; display: flex; align-items: center; justify-content: center;
                animation: vpiBreath 2.6s ease-in-out infinite; }
            .vpi-idle-logo svg { position: absolute; inset: 0; width: 100%; height: 100%; }
            .vpi-idle-logo span { position: relative; color: var(--vpi-ink); font: 900 30px/1 "Arial Black", "Segoe UI Black", Arial, sans-serif; }
            .vpi-idle-hint { color: var(--vpi-hint); font: 500 13px/1 system-ui, sans-serif; letter-spacing: .28em; text-transform: lowercase;
                opacity: 0; animation: vpiHint .8s ease 1.1s forwards; }
            @keyframes vpiBreath { 0%, 100% { opacity: .55; transform: scale(.96); filter: drop-shadow(0 0 0 rgba(124,77,255,0)); }
                50% { opacity: 1; transform: scale(1.03); filter: drop-shadow(0 0 16px rgba(124,77,255,.55)); } }
            @keyframes vpiHint { to { opacity: 1; } }`;
        const auto = setTimeout(() => go(false), INTRO.IDLE);
        function go(withSound) {
            if (started) return;
            clearTimeout(auto);
            ov.removeEventListener('pointerup', tap, true);
            ov.removeEventListener('click', tap, true);
            idle.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.9)' }], { duration: 220, fill: 'forwards' })
                .finished.then(() => idle.remove(), () => idle.remove());
            begin(withSound);
        }
        function tap(e) { e.stopPropagation(); go(true); }
        ov.addEventListener('pointerup', tap, true);
        ov.addEventListener('click', tap, true);
        return anims;
    }

    const IS_PHONE = matchMedia('(pointer: coarse)').matches;
    const introMode = () => IS_PHONE ? GM_getValue('introMobile', GM_getValue('introEnabled', true) ? 'tap' : 'off')
        : GM_getValue('introEnabled', true) ? 'desk' : 'off';
    if (window.top === window.self && introMode() !== 'off'
        && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const preview = GM_getValue('introPreview', '');
        const pickIntro = () => { let r = Math.random(); for (const [v, p] of INTRO.RARE) { if (r < p) return v; r -= p; } return false; };
        let again = false;
        try { again = Date.now() - (+sessionStorage.getItem('vp-intro-at') || 0) < 60000; sessionStorage.setItem('vp-intro-at', Date.now()); } catch (e) { }
        if (!again || preview) try { playIntro(introMode(), preview ? (preview === 'rare' || preview) : pickIntro()); } catch (e) { console.warn('[ITD VP] заставка', e); }
    }

    const start = () => {

        const SELECTORS = {
            post: 'vp-post',
            repost: 'vp-repost',
            postText: 'vp-post-text',
            postMedia: 'vp-post-media',
            postAction: 'vp-post-action',
            avatarLink: 'vp-avatar-link',
            avatar: 'vp-avatar',
            nickContainer: 'vp-nick',
            nickText: 'vp-nick-text',
            nickBadges: 'vp-nick-badges',
            nickRow: 'vp-nick-row',
            nickLarge: 'vp-nick-large',
            banner: 'vp-banner',
            bannerButtons: 'vp-banner-buttons',
            bannerDraw: 'vp-banner-draw',
            bannerDelete: 'vp-banner-delete',
            sidebar: 'vp-sidebar',
            sidebarRight: 'vp-sidebar-right',
            nav: 'vp-nav',
            navLink: 'vp-nav-link',
            navIcon: 'vp-nav-icon',
            logoContainer: 'vp-logo',
            versionBtn: 'vp-version',
            tabs: 'vp-tabs',
            feedBar: 'vp-feed-bar',
            commentBox: 'vp-comment-box',
            stickerContainer: 'vp-comment-row',
            stickerMicBtn: 'vp-comment-mic',
            stickerSendBtn: 'vp-comment-send',
            modal: 'vp-modal',
            notification: 'vp-notif',
            notificationText: 'vp-notif-text',
            badgeVerify: 'mod-badge-verify',
            badgeVoronoi: 'mod-badge-voronoi'
        };
        const siteEl = k => document.querySelector('.' + SELECTORS[k]);
        SELECTORS.commentPreviewContainer = SELECTORS.commentBox;
        SELECTORS.nickParent = SELECTORS.nickContainer;

        const PROFILE_LINK = 'a[href^="/@"]';
        const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
        const ownText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());

        function siteClasses(el) {
            return el ? [...el.classList].filter(c => !c.startsWith('vp-')).join(' ') : '';
        }
        function commonClasses(els) {
            if (!els.length) return '';
            return [...els[0].classList].filter(c => !c.startsWith('vp-') && els.every(e => e.classList.contains(c))).join(' ');
        }

        const learned = JSON.parse(GM_getValue('vp_learned', '{}'));
        function learn(role, el) {
            const cls = el && [...el.classList].find(c => !c.startsWith('vp-'));
            if (cls && learned[role] !== cls) {
                learned[role] = cls;
                GM_setValue('vp_learned', JSON.stringify(learned));
            }
        }
        const byLearned = role => learned[role] ? [...document.getElementsByClassName(learned[role])].filter(inScope) : [];

        function nickTextOf(container) {
            if (!container.children.length) return container;
            return $$('span', container).find(s => !s.children.length && s.textContent.trim()
                && !s.closest('.' + SELECTORS.badgeVoronoi + ', .' + SELECTORS.badgeVerify)) || null;
        }

        const FIND = {
            post: () => [...new Set([...$$('article'), ...$$('footer')
                .filter(f => !f.closest('article') && f.querySelector('button[aria-label="Нравится"]'))
                .map(f => { let el = f.parentElement; for (let i = 0; el && i < 4 && !el.querySelector(':scope > header'); i++) el = el.parentElement; return el; })
                .filter(el => el && el.querySelector(':scope > header'))])],
            repost: () => F('post').flatMap(p => $$('span[data-icon="share"]', p))
                .filter(s => !s.closest('footer, button'))
                .map(s => s.parentElement && s.parentElement.parentElement).filter(Boolean),
            postMedia: () => [...$$('img[data-post-media-image]'), ...F('post').flatMap(p => $$('video', p))],
            postAction: () => F('post').flatMap(p => $$('button[aria-label]', p)).filter(b => b.querySelector('[data-icon]')),
            postText: () => F('post').flatMap(p => $$('div', p)).filter(d => ownText(d) && !d.closest('header, footer, a, button, time')),
            avatarLink: () => F('post').flatMap(p => $$(PROFILE_LINK, p)).filter(a => a.firstElementChild && a.firstElementChild.tagName === 'DIV' && !a.querySelector('[data-user-name]')),
            avatar: () => {
                const sample = F('avatarLink').map(a => a.firstElementChild);
                if (sample[0]) learn('avatar', sample[0]);
                const all = new Set(sample);
                byLearned('avatar').forEach(el => { if (el.querySelector('span, img')) all.add(el); });
                return [...all];
            },
            nickContainer: () => {
                const sample = [...new Set(F('post').flatMap(p => $$('header ' + PROFILE_LINK + ' > span, header ' + PROFILE_LINK + ' [data-user-name]', p)))];
                if (sample[0]) learn('nick', sample[0]);
                const all = new Set(sample);
                byLearned('nick').forEach(el => { if (el.textContent.trim()) all.add(el); });
                return [...all];
            },
            nickText: () => F('nickContainer').map(nickTextOf).filter(Boolean),
            nickBadges: () => F('nickContainer').flatMap(c => [...c.children]
                .filter(s => !s.matches('.' + SELECTORS.badgeVoronoi + ', .' + SELECTORS.badgeVerify) && !s.querySelector('.' + SELECTORS.nickText)
                    && $$('img, svg', s).some(x => !x.closest('.' + SELECTORS.badgeVoronoi + ', .' + SELECTORS.badgeVerify)))),
            nickRow: () => F('nickContainer').map(c => (c.closest(PROFILE_LINK) || c).parentElement).filter(Boolean),
            nickLarge: () => F('nickContainer').filter(c => !c.closest('a, article, .' + SELECTORS.post) && atLoginOf(c) && isProfileHeader(c)),
            banner: () => $$('img[alt="Banner"]').map(i => i.parentElement).filter(Boolean),
            bannerButtons: () => F('banner').map(b => [...b.children].find(c => c.querySelector('button'))).filter(Boolean),
            bannerDelete: () => F('bannerButtons').flatMap(c => $$('button', c))
                .filter(b => /удал/i.test(b.title || '') || b.innerHTML.includes('points="3 6 5 6 21 6"')),
            bannerDraw: () => F('bannerButtons').map(c => $$('button', c)
                .find(b => !/custom-/.test(b.className) && !/удал/i.test(b.title || '') && !b.innerHTML.includes('points="3 6 5 6 21 6"'))).filter(Boolean),
            nav: () => $$('nav').filter(n => n.querySelector('a[href="/"], a[href="/notifications"]')),
            navLink: () => F('nav').flatMap(n => $$('a[href]', n).filter(a => a.parentElement === n || a.parentElement.parentElement === n)),
            navIcon: () => F('navLink').map(a => a.firstElementChild).filter(s => s && s.tagName === 'SPAN' && s.querySelector('svg')),
            sidebar: () => $$('aside').filter(a => a.querySelector('nav')),
            sidebarRight: () => $$('aside').filter(a => !a.querySelector('nav')),
            logoContainer: () => F('nav').map(n => n.previousElementSibling)
                .filter(d => d && (d.querySelector('svg, button') || d.querySelector(`a[href="${TG_URL}"]`))),
            versionBtn: () => F('logoContainer').flatMap(c => $$('button', c))
                .filter(b => /^v\d/.test(b.textContent.trim()) && !b.classList.contains('itd-update-sidebar-btn')),
            tabs: () => [...new Set($$('button')
                .filter(b => ['Для вас', 'Подписки', 'Лента кланов', 'Кланы', 'Посты', 'Лайки'].includes(b.textContent.trim()))
                .map(b => b.parentElement))],
            feedBar: () => F('tabs').filter(t => /Для вас/.test(t.textContent)).map(t => t.parentElement).filter(Boolean),
            stickerContainer: () => commentInputs().map(commentRow).filter(Boolean),
            stickerMicBtn: () => F('stickerContainer').map(r => siteButtons(r)).filter(bs => bs.length > 1).map(bs => bs[0]),
            stickerSendBtn: () => F('stickerContainer').map(r => siteButtons(r).pop()).filter(Boolean),
            commentBox: () => commentInputs().map(i => i.closest('form') || (commentRow(i) || i).parentElement).filter(Boolean),
            modal: () => $$('[role="dialog"], [aria-modal="true"], dialog[open]').filter(e => !e.closest('.vp-call')),
            notification: () => {
                if (!location.pathname.startsWith('/notifications')) return [];
                const top = b => !b.closest('article') && !b.parentElement.closest('[role="button"]');
                const lists = new Set($$('[role="button"]').filter(b => b.querySelector(PROFILE_LINK) && top(b)).map(b => b.parentElement));
                return [...lists].flatMap(l => [...l.children].filter(c => c.matches('[role="button"]') && top(c)));
            },
            notificationText: () => F('notification').map(n => {
                const nickLink = $$(PROFILE_LINK, n).filter(a => a.textContent.trim() && !a.querySelector('.' + SELECTORS.avatar)).pop();
                const el = nickLink && nickLink.nextElementSibling;
                return el && ownText(el) ? el : null;
            }).filter(Boolean)
        };

        function atLoginOf(c) {
            const row = c.parentElement;
            const at = row && [...row.children].find(s => /^@[\w.]+$/.test(s.textContent.trim()));
            return at ? at.textContent.trim().slice(1) : null;
        }
        function isProfileHeader(c) {
            for (let el = c, i = 0; el && i < 7; el = el.parentElement, i++) {
                if (el.querySelector('img[alt="Banner"]')) return true;
            }
            if (document.querySelector('img[alt="Banner"]')) return false;
            const item = c.parentElement && c.parentElement.parentElement;
            return !(item && item.parentElement && [...item.parentElement.children]
                .filter(x => x !== item && x.querySelector('.' + SELECTORS.nickContainer)).length);
        }

        function commentInputs() {
            return $$('[contenteditable="true"][data-placeholder]').filter(i => /коммент/i.test(i.getAttribute('data-placeholder')));
        }
        function commentRow(input) {
            let el = input.parentElement;
            for (let i = 0; el && i < 6; i++, el = el.parentElement) {
                if (siteButtons(el).length) return el;
            }
            return null;
        }
        const siteButtons = root => $$('button', root).filter(b => !b.classList.contains('sticker-btn') && !b.classList.contains('vp-sticker-sendbtn'));

        const ROLE_ORDER = ['post', 'repost', 'postMedia', 'postAction', 'postText', 'avatarLink', 'avatar',
            'nickContainer', 'nickText', 'nickBadges', 'nickRow', 'nickLarge',
            'banner', 'bannerButtons', 'bannerDelete', 'bannerDraw',
            'nav', 'navLink', 'navIcon', 'sidebar', 'sidebarRight', 'logoContainer', 'versionBtn',
            'tabs', 'feedBar', 'commentBox', 'stickerContainer', 'stickerMicBtn', 'stickerSendBtn',
            'modal', 'notification', 'notificationText'];
        const roleCount = {};
        let tickCache = null;
        const F = role => (tickCache && tickCache[role]) || FIND[role]();

        let scope = null;
        const dirtyPosts = new Set();
        let lastFullTag = 0;
        function inScope(el) {
            if (!scope) return true;
            const p = el.closest('.' + SELECTORS.post);
            return !p || scope.has(p);
        }

        function tagAll(full = true) {
            tickCache = {};
            scope = null;
            const now = performance.now();
            if (full || now - lastFullTag > 5000) { full = true; lastFullTag = now; }
            for (const role of ROLE_ORDER) {
                let els = [];
                try { els = FIND[role](); } catch (e) { console.warn('[ITD VP] поиск сломался:', role, e); }
                const cls = SELECTORS[role];
                if (role === 'post' && !full) {
                    scope = new Set(els.filter(el => !el.classList.contains(cls) || dirtyPosts.has(el)));
                }
                tickCache[role] = role === 'post' && scope ? [...scope] : els;
                if (full) roleCount[role] = els.length;
                for (const el of els) if (!el.classList.contains(cls)) el.classList.add(cls);
            }
            dirtyPosts.clear();
            tickCache = null;
            scope = null;
        }

        const domHandlers = [];
        function onDom(fn) { domHandlers.push(fn); }
        let domQueued = false;
        const DOM_WATCH = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true };
        let lastTick = 0;
        function domTick() {
            domQueued = false;
            lastTick = performance.now();
            domRecords(domObserver.takeRecords());
            domObserver.disconnect();
            try {
                tagAll(false);
                for (const fn of domHandlers) { try { fn(); } catch (e) { console.warn('[ITD VP]', fn.name || 'обработчик', e); logErr(fn.name || 'обработчик', e); } }
            } finally {
                domObserver.observe(document.body, DOM_WATCH);
            }
        }
        const lostVp = m => {
            const old = m.oldValue || '';
            if (!old.includes('vp-')) return false;
            const cl = m.target.classList;
            return old.split(/\s+/).some(c => c.startsWith('vp-') && !cl.contains(c));
        };
        function domRecords(muts) {
            let any = false;
            for (const m of muts) {
                if (m.type === 'attributes' && !lostVp(m)) continue;
                if (m.type === 'characterData' && !/\p{Extended_Pictographic}/u.test(m.target.nodeValue || '')) continue;
                any = true;
                const el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
                const p = el && el.closest('.' + SELECTORS.post);
                if (p) dirtyPosts.add(p);
            }
            return any;
        }
        const domObserver = new MutationObserver(muts => {
            if (domRecords(muts) && !domQueued) {
                domQueued = true;
                const wait = IS_PHONE ? Math.max(0, lastTick + 50 - performance.now()) : 0;
                if (wait) setTimeout(() => requestAnimationFrame(domTick), wait); else requestAnimationFrame(domTick);
            }
        });
        tagAll();
        domObserver.observe(document.body, DOM_WATCH);

        const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        pageWindow.itdvp = {
            diag() {
                tagAll();
                console.table(ROLE_ORDER.map(r => ({ роль: r, найдено: roleCount[r], класс: SELECTORS[r] })));
                return roleCount;
            },
            learned
        };
        setTimeout(() => {
            tagAll();
            const must = ['nav', 'sidebar', 'logoContainer'];
            if (roleCount.post) must.push('avatar', 'nickContainer', 'nickText');
            const lost = must.filter(r => !roleCount[r]);
            if (lost.length) console.warn('[ITD VP] не нашёл на странице:', lost.join(', '), '— похоже, сайт поменял разметку. Подробно: itdvp.diag()');
        }, 4000);

        function scriptIconSrc() {
            const meta = (GM_info.scriptMetaStr || '').match(/^\/\/ @icon\s+(.+?)\s*$/m);
            return (GM_info.script && GM_info.script.icon) || (meta && meta[1]) || null;
        }

        const APP_ICONS = [
            { id: "classic", name: "Классика", svg: null },
            { id: "itd", name: "ИТД", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"n\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#00e5ff\"/><stop offset=\".5\" stop-color=\"#7c4dff\"/><stop offset=\"1\" stop-color=\"#ff3d9a\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#0b0d13\"/><text x=\"32\" y=\"39.5\" text-anchor=\"middle\" font-family=\"Arial Black, Arial, sans-serif\" font-weight=\"900\" font-size=\"20\" fill=\"url(#n)\">ИТД</text><text x=\"32\" y=\"50\" text-anchor=\"middle\" font-family=\"Arial, sans-serif\" font-weight=\"700\" font-size=\"8\" fill=\"#fff\" opacity=\".7\" letter-spacing=\"1.5\">X</text></svg>" },
            { id: "neon", name: "Неон", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"n\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#00e5ff\"/><stop offset=\".5\" stop-color=\"#7c4dff\"/><stop offset=\"1\" stop-color=\"#ff3d9a\"/></linearGradient><filter id=\"g\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\"><feGaussianBlur stdDeviation=\"3\"/></filter></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#0b0d13\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"url(#n)\" stroke-width=\"10\" stroke-linecap=\"round\" fill=\"none\" filter=\"url(#g)\" opacity=\".9\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"url(#n)\" stroke-width=\"8\" stroke-linecap=\"round\" fill=\"none\" /><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#fff\" stroke-width=\"3\" stroke-linecap=\"round\" fill=\"none\" opacity=\".55\"/></svg>" },
            { id: "glitch", name: "Глитч", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#0b0b10\"/><g transform=\"translate(-2.5 0)\" opacity=\".95\"><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#00f0ff\" stroke-width=\"8\" stroke-linecap=\"round\" fill=\"none\" /></g><g transform=\"translate(2.5 0)\" opacity=\".95\"><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#ff2bd6\" stroke-width=\"8\" stroke-linecap=\"round\" fill=\"none\" /></g><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#fff\" stroke-width=\"8\" stroke-linecap=\"round\" fill=\"none\" /><rect x=\"14\" y=\"30\" width=\"36\" height=\"3\" fill=\"#0b0b10\" opacity=\".85\"/></svg>" },
            { id: "orbit", name: "Орбита", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"n\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#00e5ff\"/><stop offset=\".5\" stop-color=\"#7c4dff\"/><stop offset=\"1\" stop-color=\"#ff3d9a\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#0b0d13\"/><ellipse cx=\"32\" cy=\"32\" rx=\"23\" ry=\"9\" fill=\"none\" stroke=\"url(#n)\" stroke-width=\"2.2\" transform=\"rotate(-25 32 32)\" opacity=\".9\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#fff\" stroke-width=\"8\" stroke-linecap=\"round\" fill=\"none\" /><circle cx=\"51.5\" cy=\"22.5\" r=\"2.6\" fill=\"#ff3d9a\"/></svg>" },
            { id: "matrix", name: "Матрица", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><filter id=\"g\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\"><feGaussianBlur stdDeviation=\"2.5\"/></filter></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#020a02\"/><text x=\"4\" y=\"9\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.06\">ア</text><text x=\"4\" y=\"18\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.41\">エ</text><text x=\"4\" y=\"27\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.26\">キ</text><text x=\"4\" y=\"36\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.11\">コ</text><text x=\"4\" y=\"45\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.46\">ス</text><text x=\"4\" y=\"54\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.31\">タ</text><text x=\"4\" y=\"63\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.16\">テ</text><text x=\"13\" y=\"9\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.21\">ク</text><text x=\"13\" y=\"18\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.06\">サ</text><text x=\"13\" y=\"27\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.41\">セ</text><text x=\"13\" y=\"36\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.26\">チ</text><text x=\"13\" y=\"45\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.11\">ト</text><text x=\"13\" y=\"54\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.46\">ア</text><text x=\"13\" y=\"63\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.31\">エ</text><text x=\"22\" y=\"9\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.36\">ソ</text><text x=\"22\" y=\"18\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.21\">ツ</text><text x=\"22\" y=\"27\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.06\">0</text><text x=\"22\" y=\"36\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.41\">イ</text><text x=\"22\" y=\"45\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.26\">オ</text><text x=\"22\" y=\"54\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.11\">ク</text><text x=\"22\" y=\"63\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.46\">サ</text><text x=\"31\" y=\"9\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.51\">1</text><text x=\"31\" y=\"18\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.36\">ウ</text><text x=\"31\" y=\"27\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.21\">カ</text><text x=\"31\" y=\"36\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.06\">ケ</text><text x=\"31\" y=\"45\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.41\">シ</text><text x=\"31\" y=\"54\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.26\">ソ</text><text x=\"31\" y=\"63\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.11\">ツ</text><text x=\"40\" y=\"9\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.16\">キ</text><text x=\"40\" y=\"18\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.51\">コ</text><text x=\"40\" y=\"27\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.36\">ス</text><text x=\"40\" y=\"36\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.21\">タ</text><text x=\"40\" y=\"45\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.06\">テ</text><text x=\"40\" y=\"54\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.41\">1</text><text x=\"40\" y=\"63\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.26\">ウ</text><text x=\"49\" y=\"9\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.31\">セ</text><text x=\"49\" y=\"18\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.16\">チ</text><text x=\"49\" y=\"27\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.51\">ト</text><text x=\"49\" y=\"36\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.36\">ア</text><text x=\"49\" y=\"45\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.21\">エ</text><text x=\"49\" y=\"54\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.06\">キ</text><text x=\"49\" y=\"63\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.41\">コ</text><text x=\"58\" y=\"9\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.46\">0</text><text x=\"58\" y=\"18\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.31\">イ</text><text x=\"58\" y=\"27\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.16\">オ</text><text x=\"58\" y=\"36\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.51\">ク</text><text x=\"58\" y=\"45\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.36\">サ</text><text x=\"58\" y=\"54\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.21\">セ</text><text x=\"58\" y=\"63\" font-size=\"7\" font-family=\"monospace\" fill=\"#39ff14\" opacity=\"0.06\">チ</text><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#39ff14\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\" filter=\"url(#g)\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#39ff14\" stroke-width=\"7\" stroke-linecap=\"round\" fill=\"none\" /><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#d8ffd0\" stroke-width=\"2.5\" stroke-linecap=\"round\" fill=\"none\" opacity=\".8\"/></svg>" },
            { id: "gold", name: "Золото", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><radialGradient id=\"bg\" cx=\".5\" cy=\".4\" r=\".75\"><stop offset=\"0\" stop-color=\"#2a1f0c\"/><stop offset=\"1\" stop-color=\"#0b0906\"/></radialGradient><linearGradient id=\"au\" gradientUnits=\"userSpaceOnUse\" x1=\"0\" y1=\"16\" x2=\"0\" y2=\"48\"><stop offset=\"0\" stop-color=\"#fff2c2\"/><stop offset=\".35\" stop-color=\"#f3cb62\"/><stop offset=\".7\" stop-color=\"#dba53a\"/><stop offset=\"1\" stop-color=\"#c48a24\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"url(#bg)\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"url(#au)\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\"/></svg>" },
            { id: "itdchan", name: "ИТД-чан", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><clipPath id=\"c\"><rect width=\"64\" height=\"64\" rx=\"16\"/></clipPath><linearGradient id=\"bg\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#1a0d10\"/><stop offset=\"1\" stop-color=\"#0b0708\"/></linearGradient><linearGradient id=\"red\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#e2233b\"/><stop offset=\"1\" stop-color=\"#8e0f22\"/></linearGradient><radialGradient id=\"bell\" cx=\".38\" cy=\".32\" r=\".75\"><stop offset=\"0\" stop-color=\"#ffffff\"/><stop offset=\".45\" stop-color=\"#c9c9d1\"/><stop offset=\"1\" stop-color=\"#6d6d78\"/></radialGradient></defs><g clip-path=\"url(#c)\"><rect width=\"64\" height=\"64\" fill=\"url(#bg)\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"url(#red)\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\"/></g></svg>" },
            { id: "gradient", name: "Градиент", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"n\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#00e5ff\"/><stop offset=\".5\" stop-color=\"#7c4dff\"/><stop offset=\"1\" stop-color=\"#ff3d9a\"/></linearGradient><filter id=\"s\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\"><feDropShadow dx=\"0\" dy=\"1.5\" stdDeviation=\"1.5\" flood-opacity=\".35\"/></filter></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"url(#n)\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#fff\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\" filter=\"url(#s)\"/></svg>" },
            { id: "glass", name: "Стекло", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><filter id=\"b\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\"><feGaussianBlur stdDeviation=\"7\"/></filter><clipPath id=\"c\"><rect width=\"64\" height=\"64\" rx=\"16\"/></clipPath></defs><g clip-path=\"url(#c)\"><rect width=\"64\" height=\"64\" fill=\"#0d0f1a\"/><circle cx=\"16\" cy=\"18\" r=\"16\" fill=\"#00c6ff\" filter=\"url(#b)\"/><circle cx=\"50\" cy=\"48\" r=\"18\" fill=\"#ff3d9a\" filter=\"url(#b)\"/><circle cx=\"46\" cy=\"14\" r=\"11\" fill=\"#7c4dff\" filter=\"url(#b)\"/><rect x=\"10\" y=\"10\" width=\"44\" height=\"44\" rx=\"14\" fill=\"#fff\" fill-opacity=\".12\" stroke=\"#fff\" stroke-opacity=\".35\"/></g><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#fff\" stroke-width=\"7\" stroke-linecap=\"round\" fill=\"none\" /></svg>" },
            { id: "paw", name: "Лапка", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><clipPath id=\"c\"><rect width=\"64\" height=\"64\" rx=\"16\"/></clipPath><linearGradient id=\"db\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#6d28d9\"/><stop offset=\"1\" stop-color=\"#4c1d95\"/></linearGradient></defs><g clip-path=\"url(#c)\"><rect width=\"64\" height=\"64\" fill=\"url(#db)\"/><g fill=\"#ede4ff\"><ellipse cx=\"20\" cy=\"30\" rx=\"3.7\" ry=\"4.7\" transform=\"rotate(-22 20 30)\"/><ellipse cx=\"27.3\" cy=\"22.3\" rx=\"3.9\" ry=\"5.1\" transform=\"rotate(-6 27.3 22.3)\"/><ellipse cx=\"36.7\" cy=\"22.3\" rx=\"3.9\" ry=\"5.1\" transform=\"rotate(6 36.7 22.3)\"/><ellipse cx=\"44\" cy=\"30\" rx=\"3.7\" ry=\"4.7\" transform=\"rotate(22 44 30)\"/></g><path d=\"M32 34c-5.6 0-10.4 4.6-11.5 9-.9 3.6 1.5 6.6 4.9 6.6 2.6 0 4.4-1.3 6.6-1.3s4 1.3 6.6 1.3c3.4 0 5.8-3 4.9-6.6C42.4 38.6 37.6 34 32 34Z\" fill=\"#ede4ff\"/></g></svg>" },
            { id: "sakura", name: "Сакура", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"bg\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#3a1330\"/><stop offset=\"1\" stop-color=\"#1c0a1a\"/></linearGradient><radialGradient id=\"halo\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#ff7fb0\" stop-opacity=\".35\"/><stop offset=\"1\" stop-color=\"#ff7fb0\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"pgA\" gradientUnits=\"userSpaceOnUse\" cx=\"0\" cy=\"0\" r=\"20\"><stop offset=\"0\" stop-color=\"#fff6f9\"/><stop offset=\".45\" stop-color=\"#ffd3e2\"/><stop offset=\"1\" stop-color=\"#ff8db4\"/></radialGradient><radialGradient id=\"pgB\" gradientUnits=\"userSpaceOnUse\" cx=\"0\" cy=\"0\" r=\"20\"><stop offset=\"0\" stop-color=\"#ffe9f1\"/><stop offset=\"1\" stop-color=\"#ff9cbf\"/></radialGradient><radialGradient id=\"cg\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#ff9ab8\"/><stop offset=\"1\" stop-color=\"#c8356a\"/></radialGradient><filter id=\"sh\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\"><feDropShadow dx=\"0\" dy=\"1.2\" stdDeviation=\"1.3\" flood-color=\"#12040f\" flood-opacity=\".55\"/></filter></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"url(#bg)\"/><circle cx=\"31\" cy=\"33\" r=\"24\" fill=\"url(#halo)\"/><g transform=\"translate(31 33.5) rotate(-14) scale(1.05)\"><g filter=\"url(#sh)\"><path d=\"M0 0C-6.2-3.4-8.6-11.4-5.6-17.6C-4.3-20.2-2.3-21.1-.9-19.6L0-18.2L.9-19.6C2.3-21.1 4.3-20.2 5.6-17.6C8.6-11.4 6.2-3.4 0 0Z\" transform=\"rotate(0)\" fill=\"url(#pgA)\"/><path d=\"M0-2.5C-.3-8-.2-12.5 0-16\" transform=\"rotate(0)\" stroke=\"#e5779c\" stroke-width=\".55\" stroke-linecap=\"round\" fill=\"none\" opacity=\".45\"/><path d=\"M0 0C-6.2-3.4-8.6-11.4-5.6-17.6C-4.3-20.2-2.3-21.1-.9-19.6L0-18.2L.9-19.6C2.3-21.1 4.3-20.2 5.6-17.6C8.6-11.4 6.2-3.4 0 0Z\" transform=\"rotate(72)\" fill=\"url(#pgA)\"/><path d=\"M0-2.5C-.3-8-.2-12.5 0-16\" transform=\"rotate(72)\" stroke=\"#e5779c\" stroke-width=\".55\" stroke-linecap=\"round\" fill=\"none\" opacity=\".45\"/><path d=\"M0 0C-6.2-3.4-8.6-11.4-5.6-17.6C-4.3-20.2-2.3-21.1-.9-19.6L0-18.2L.9-19.6C2.3-21.1 4.3-20.2 5.6-17.6C8.6-11.4 6.2-3.4 0 0Z\" transform=\"rotate(144)\" fill=\"url(#pgA)\"/><path d=\"M0-2.5C-.3-8-.2-12.5 0-16\" transform=\"rotate(144)\" stroke=\"#e5779c\" stroke-width=\".55\" stroke-linecap=\"round\" fill=\"none\" opacity=\".45\"/><path d=\"M0 0C-6.2-3.4-8.6-11.4-5.6-17.6C-4.3-20.2-2.3-21.1-.9-19.6L0-18.2L.9-19.6C2.3-21.1 4.3-20.2 5.6-17.6C8.6-11.4 6.2-3.4 0 0Z\" transform=\"rotate(216)\" fill=\"url(#pgA)\"/><path d=\"M0-2.5C-.3-8-.2-12.5 0-16\" transform=\"rotate(216)\" stroke=\"#e5779c\" stroke-width=\".55\" stroke-linecap=\"round\" fill=\"none\" opacity=\".45\"/><path d=\"M0 0C-6.2-3.4-8.6-11.4-5.6-17.6C-4.3-20.2-2.3-21.1-.9-19.6L0-18.2L.9-19.6C2.3-21.1 4.3-20.2 5.6-17.6C8.6-11.4 6.2-3.4 0 0Z\" transform=\"rotate(288)\" fill=\"url(#pgA)\"/><path d=\"M0-2.5C-.3-8-.2-12.5 0-16\" transform=\"rotate(288)\" stroke=\"#e5779c\" stroke-width=\".55\" stroke-linecap=\"round\" fill=\"none\" opacity=\".45\"/></g><circle r=\"3.4\" fill=\"url(#cg)\"/><path d=\"M2.57 0.36L6.34 0.89\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"6.34\" cy=\"0.89\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M1.97 1.7L5.53 4.76\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"5.53\" cy=\"4.76\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M0.74 2.49L2.34 7.86\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"2.34\" cy=\"7.86\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M-0.72 2.5L-1.78 6.15\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"-1.78\" cy=\"6.15\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M-1.96 1.71L-5.5 4.8\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"-5.5\" cy=\"4.8\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M-2.57 0.38L-8.11 1.19\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"-8.11\" cy=\"1.19\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M-2.37 -1.07L-5.83 -2.64\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"-5.83\" cy=\"-2.64\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M-1.41 -2.18L-3.97 -6.13\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"-3.97\" cy=\"-6.13\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M-0.01 -2.6L-0.03 -8.2\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"-0.03\" cy=\"-8.2\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M1.4 -2.19L3.44 -5.39\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"3.44\" cy=\"-5.39\" r=\".85\" fill=\"#ffd66b\"/><path d=\"M2.36 -1.09L6.63 -3.05\" stroke=\"#d94a7a\" stroke-width=\".6\" stroke-linecap=\"round\"/><circle cx=\"6.63\" cy=\"-3.05\" r=\".85\" fill=\"#ffd66b\"/></g><g transform=\"translate(49 15) rotate(38) scale(.42)\"><path d=\"M0 0C-6.2-3.4-8.6-11.4-5.6-17.6C-4.3-20.2-2.3-21.1-.9-19.6L0-18.2L.9-19.6C2.3-21.1 4.3-20.2 5.6-17.6C8.6-11.4 6.2-3.4 0 0Z\" fill=\"url(#pgB)\" opacity=\".9\"/></g><g transform=\"translate(14.5 52) rotate(-120) scale(.3)\"><path d=\"M0 0C-6.2-3.4-8.6-11.4-5.6-17.6C-4.3-20.2-2.3-21.1-.9-19.6L0-18.2L.9-19.6C2.3-21.1 4.3-20.2 5.6-17.6C8.6-11.4 6.2-3.4 0 0Z\" fill=\"url(#pgB)\" opacity=\".75\"/></g></svg>" },
            { id: "minimal", name: "Минимал", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#f4f4f6\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#111\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\" /></svg>" },
            { id: "minimal2", name: "Минимал 2", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><clipPath id=\"c\"><rect width=\"64\" height=\"64\" rx=\"16\"/></clipPath><clipPath id=\"L\"><rect width=\"32\" height=\"64\"/></clipPath><clipPath id=\"R\"><rect x=\"32\" width=\"32\" height=\"64\"/></clipPath></defs><g clip-path=\"url(#c)\"><rect width=\"32\" height=\"64\" fill=\"#f4f4f6\"/><rect x=\"32\" width=\"32\" height=\"64\" fill=\"#111\"/><g clip-path=\"url(#L)\"><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#111\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\"/></g><g clip-path=\"url(#R)\"><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#f4f4f6\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\"/></g></g></svg>" },
            { id: "printstream", name: "Принтстрим", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"pearl\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fbf4f7\"/><stop offset=\".3\" stop-color=\"#f3e6ee\"/><stop offset=\".55\" stop-color=\"#eeeef6\"/><stop offset=\".8\" stop-color=\"#e5edf6\"/><stop offset=\"1\" stop-color=\"#f4f6f9\"/></linearGradient><linearGradient id=\"sheen\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#fff\" stop-opacity=\"0\"/><stop offset=\".5\" stop-color=\"#fff\" stop-opacity=\".7\"/><stop offset=\"1\" stop-color=\"#fff\" stop-opacity=\"0\"/></linearGradient><clipPath id=\"c\"><rect width=\"64\" height=\"64\" rx=\"16\"/></clipPath></defs><g clip-path=\"url(#c)\"><rect width=\"64\" height=\"64\" fill=\"url(#pearl)\"/><rect x=\"-20\" y=\"-6\" width=\"30\" height=\"90\" fill=\"url(#sheen)\" transform=\"rotate(-30 32 32)\" opacity=\".8\"/><g stroke=\"#111\" stroke-width=\"2.2\" stroke-linecap=\"round\"><path d=\"M11 10l4.5 4.5M15.5 10l-4.5 4.5\"/></g><g stroke=\"#111\" stroke-linecap=\"round\" fill=\"none\" opacity=\".55\"><path d=\"M40 52h14M46 49.5h8\" stroke-width=\".7\"/></g><g fill=\"#111\"><rect x=\"44\" y=\"10.5\" width=\"1.6\" height=\"1.6\"/><rect x=\"45.6\" y=\"12.1\" width=\"1.6\" height=\"1.6\"/><rect x=\"47.2\" y=\"10.5\" width=\"1.6\" height=\"1.6\"/><rect x=\"48.8\" y=\"12.1\" width=\"1.6\" height=\"1.6\"/></g><path d=\"M17.60 51.50L15.00 53.00L12.40 51.50L12.40 48.50L15.00 47.00L17.60 48.50Z\" fill=\"none\" stroke=\"#111\" stroke-width=\".7\" opacity=\".55\"/><path d=\"M18.5 10l4.5 4.5M23 10l-4.5 4.5\" stroke=\"#111\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M18.5 10l4.5 4.5M23 10l-4.5 4.5\" stroke=\"#f1eef5\" stroke-width=\".8\" stroke-linecap=\"round\"/><path d=\"M21 21L43 43M43 21L21 43\" stroke=\"#111\" stroke-width=\"9\" stroke-linecap=\"round\" fill=\"none\"/></g></svg>" },
            { id: "uwu", name: "UwU", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"bg\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#f7dfb3\"/><stop offset=\".55\" stop-color=\"#f5bfb2\"/><stop offset=\"1\" stop-color=\"#ef93b3\"/></linearGradient><radialGradient id=\"glow\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#fff2c7\"/><stop offset=\".4\" stop-color=\"#ffe1a0\" stop-opacity=\".75\"/><stop offset=\"1\" stop-color=\"#ffe1a0\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"vig\" cx=\".5\" cy=\".45\" r=\".75\"><stop offset=\".6\" stop-color=\"#8f4f72\" stop-opacity=\"0\"/><stop offset=\"1\" stop-color=\"#8f4f72\" stop-opacity=\".22\"/></radialGradient></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"url(#bg)\"/><path d=\"M17 26v6a5 5 0 0 0 10 0v-6\" stroke=\"#1a1016\" stroke-width=\"3.4\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M37 26v6a5 5 0 0 0 10 0v-6\" stroke=\"#1a1016\" stroke-width=\"3.4\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M26 40q3 4 6 0 3 4 6 0\" stroke=\"#1a1016\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/></svg>" },
            { id: "xxx", name: "XXX", svg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#000\"/><path d=\"M8 24h4.8L15.0 30.1L17.2 24H22L18.0 32.5L22 41h-4.8L15.0 34.9L12.8 41H8L12.0 32.5Z\" fill=\"#fff\"/><rect x=\"25\" y=\"19\" width=\"32\" height=\"27\" rx=\"6\" fill=\"#ff9000\"/><path d=\"M28.5 24h4.1L34.5 30.1L36.4 24H40.5L37.0 32.5L40.5 41h-4.1L34.5 34.9L32.6 41H28.5L32.0 32.5Z\" fill=\"#000\"/><path d=\"M41.5 24h4.1L47.5 30.1L49.4 24H53.5L50.0 32.5L53.5 41h-4.1L47.5 34.9L45.6 41H41.5L45.0 32.5Z\" fill=\"#000\"/></svg>" },
        ];
        const ICON_BG_EXTRA = {
            shimmer: ['#7c3aed', '#a78bfa', '#f0abfc'],
            glitch: ['#00fff0', '#7c4dff', '#ff00c8'],
            rainbow: ['#ff3b3b', '#ffb000', '#3ddc84', '#29b6f6', '#b04dff']
        };
        let iconBgList = null;
        function iconBgs() {
            if (iconBgList) return iconBgList;
            iconBgList = styleKeys.map(k => {
                const st = nickStyles[k];
                const c = ICON_BG_EXTRA[k] || ((st.gradientDark || '').match(/#[0-9a-f]{3,6}\b/gi)) || [st.color];
                return { id: k, name: st.name, c };
            });
            iconBgList.push({ id: 'black', name: 'Чёрный', c: ['#26262c', '#050507'] });
            const MULTI = ['glitch', 'rainbow'], NEUTRAL = ['white', 'gray', 'black'];
            const rank = b => {
                if (MULTI.includes(b.id)) return 1000 + MULTI.indexOf(b.id);
                const h = hueOf(b.c[0]);
                return h === null ? 2000 + Math.max(0, NEUTRAL.indexOf(b.id)) : (h + 330) % 360;
            };
            iconBgList.sort((a, b) => rank(a) - rank(b));
            return iconBgList;
        }
        const svgUrl = svg => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
        const xmlText = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        function firstGrapheme(s) {
            s = (s || '').trim();
            if (!s) return '';
            if (window.Intl && Intl.Segmenter) return new Intl.Segmenter().segment(s)[Symbol.iterator]().next().value.segment;
            return Array.from(s)[0];
        }
        function customIconSvg({ bg, emoji }) {
            const b = iconBgs().find(x => x.id === bg) || iconBgs().find(x => x.id === 'purpleMystic');
            const stops = b.c.map((c, i) => `<stop offset="${b.c.length > 1 ? i / (b.c.length - 1) : 0}" stop-color="${c}"/>`).join('');
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs>` +
                `<rect width="64" height="64" rx="16" fill="url(#g)"/><text x="32" y="34" text-anchor="middle" dominant-baseline="central" font-size="36">${xmlText(emoji || '🦊')}</text></svg>`;
        }
        let appIcon = GM_getValue('appIcon', 'classic');
        const iconCustom = () => GM_getValue('appIconCustom', { bg: 'purpleMystic', emoji: '🦊' });
        function iconSrcById(id) {
            if (id === 'image') return GM_getValue('appIconImage', '') || scriptIconSrc();
            if (id === 'custom') return svgUrl(customIconSvg(iconCustom()));
            const it = APP_ICONS.find(i => i.id === id);
            return it && it.svg ? svgUrl(it.svg) : scriptIconSrc();
        }
        const appIconSrc = () => iconSrcById(appIcon);
        function scriptLogo(size) {
            const src = appIconSrc();
            if (!src) return null;
            const img = document.createElement('img');
            img.className = 'vp-app-logo';
            img.src = src;
            img.alt = 'ИТД';
            img.width = img.height = size;
            img.style.cssText = `width:${size}px;height:${size}px;display:block;border-radius:${Math.round(size * 0.25)}px;`;
            return img;
        }
        function sizedSvg(src, size) {
            const m = src.match(/^data:image\/svg\+xml(;[^,]*)?,(.*)$/s);
            if (!m) return src;
            let svg = (m[1] || '').includes('base64') ? atob(m[2]) : decodeURIComponent(m[2].replace(/%(?![0-9a-f]{2})/gi, '%25'));
            svg = svg.replace(/<svg\b([^>]*)>/, (all, attrs) => '<svg' + attrs.replace(/\s(width|height)=(["'])[^"']*\2/g, '') + ` width="${size}" height="${size}">`);
            return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        }
        function iconPng(src, size) {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => {
                    const c = document.createElement('canvas');
                    c.width = c.height = size;
                    const g = c.getContext('2d');
                    g.imageSmoothingQuality = 'high';
                    g.drawImage(img, 0, 0, size, size);
                    try { resolve(c.toDataURL('image/png')); } catch (e) { resolve(null); }
                };
                img.onerror = () => resolve(null);
                img.src = sizedSvg(src, size);
            });
        }
        function headLink(id, rel, attrs) {
            let l = document.getElementById(id);
            if (!l) {
                l = document.createElement('link');
                l.id = id;
                l.rel = rel;
                document.head.appendChild(l);
            }
            for (const k in attrs) if (l.getAttribute(k) !== attrs[k]) l.setAttribute(k, attrs[k]);
            return l;
        }
        let pngFor = null;
        function applyAppIcon() {
            const src = appIconSrc();
            if (!src) return;
            headLink('vp-favicon', 'icon', { type: src.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png', href: src });
            document.querySelectorAll('img.vp-app-logo').forEach(img => { if (img.src !== src) img.src = src; });
            if (pngFor === src) return;
            pngFor = src;
            iconPng(src, 512).then(png => { if (png && pngFor === src) headLink('vp-icon-512', 'icon', { type: 'image/png', sizes: '512x512', href: png }); });
            iconPng(src, 192).then(png => { if (png && pngFor === src) headLink('vp-icon-192', 'icon', { type: 'image/png', sizes: '192x192', href: png }); });
            iconPng(src, 180).then(png => { if (png && pngFor === src) headLink('vp-touch-icon', 'apple-touch-icon', { sizes: '180x180', href: png }); });
        }
        function setAppIcon(id) {
            appIcon = id;
            GM_setValue('appIcon', id);
            applyAppIcon();
        }

        const TAB_TITLE = 'ИТД X';
        function brandTab() {
            if (document.title !== TAB_TITLE) document.title = TAB_TITLE;
            document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]').forEach(l => { if (!l.id.startsWith('vp-')) l.remove(); });
            applyAppIcon();
        }
        const svgIcon = (body, size = 20, stroke = 'currentColor') =>
            `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
        const I_BG = '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M12 8.2l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z"/><path d="M17.5 6.8v1.6M16.7 7.6h1.6"/>';

        const ICONS = {
            settings: {
                'Фон': svgIcon(I_BG),
                'Неоновая подсветка': svgIcon('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z"/>'),
                'Подсветка ника': svgIcon('<path d="M4 19 9 5h1l5 14M5.8 14.5h7.4"/><path d="M18.5 3.5v4M16.5 5.5h4"/><path d="M19 11.5v2M18 12.5h2"/>'),
                'Подсветка аватарок': svgIcon('<circle cx="12" cy="10" r="3"/><path d="M7 17.5a5.5 5.5 0 0 1 10 0"/><circle cx="12" cy="12" r="9.5" stroke-dasharray="2.2 2.6"/>'),
                'Подсветка постов': svgIcon('<rect x="5" y="6" width="14" height="12" rx="2.5"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/><rect x="2" y="3" width="20" height="18" rx="4.5" stroke-dasharray="2.2 2.6"/>'),
                'Размытый фон постов': svgIcon('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="5" stroke-dasharray="1.4 2"/>'),
                'Анти цензура': svgIcon('<path d="M12 3 5 6v5.2c0 4.3 2.9 7.9 7 9.8 1.6-.7 3-1.7 4.1-3M19 13.5c.1-.8.2-1.5.2-2.3V6L12 3"/><path d="m3 3 18 18"/>'),
                'Стиль фона': svgIcon(I_BG),
                'Стекло': svgIcon('<rect x="3" y="3" width="13" height="13" rx="3"/><rect x="8" y="8" width="13" height="13" rx="3"/><path d="M11.5 15.5l3-3M11.5 18.5l6-6"/>'),
                'Звуки интерфейса': svgIcon('<path d="M4 9.5h3l4-3.5v12l-4-3.5H4z"/><path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11"/>'),
                'Боковая панель': svgIcon('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M15 3v18"/><path d="M17.5 7.5h1M17.5 11h1M17.5 14.5h1"/>'),
                'Версия для ПК на планшете': svgIcon('<rect x="2.5" y="5" width="19" height="13" rx="2"/><path d="M9 21h6"/><path d="M6 9h6M6 12h4"/>'),
                'Сцена ленты': svgIcon('<rect x="5" y="3" width="14" height="5" rx="1.5" stroke-dasharray="2 2"/><rect x="4" y="10" width="16" height="5" rx="1.5"/><rect x="3" y="17" width="18" height="5" rx="1.5"/>'),
                'Свечение видео': svgIcon('<rect x="6" y="7" width="12" height="10" rx="2"/><path d="m11 10 3 2-3 2z"/><path d="M3 5.5 4.5 7M21 5.5 19.5 7M3 18.5 4.5 17M21 18.5 19.5 17M12 2.5v2M12 19.5v2"/>'),
                'Заставка при входе': svgIcon('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 9 5 3-5 3z"/>'),
                'Мику и Тето': svgIcon('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="13" r="2"/><circle cx="15.5" cy="13" r="2"/><path d="M5 20c.5-2 2-3 3.5-3s3 1 3.5 3M12 20c.5-2 2-3 3.5-3s3 1 3.5 3"/>'),
                'Мику справа': svgIcon('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="16" cy="13" r="2.2"/><path d="M12 20c.6-2.2 2.2-3.3 4-3.3s3.4 1.1 4 3.3"/>'),
                'Тето слева': svgIcon('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8" cy="13" r="2.2"/><path d="M4 20c.6-2.2 2.2-3.3 4-3.3s3.4 1.1 4 3.3"/>'),
                'Автолайки': svgIcon('<path transform="translate(.5 1) scale(.74)" stroke-width="2.43" d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/><path d="M21.3 17.2a3.3 3.3 0 1 1-1-2.4"/><path d="M21 12.9v2.3h-2.3"/>')
            },

            PALETTE: svgIcon('<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16a5 5 0 0 0 5-5C21 6.4 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/><circle cx="17" cy="10.5" r="1"/>'),
            SLIDERS: svgIcon('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>', 17),
            MESSAGES: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M5 3a3 3 0 00-3 3v10a3 3 0 003 3h1v2.47a.5.5 0 00.85.36L11.12 19H19a3 3 0 003-3V6a3 3 0 00-3-3H5zm2 5a1 1 0 000 2h10a1 1 0 100-2H7zm0 4a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>`,
            SCROLL_TOP: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 4.5h14M12 20V9M7 13.5l5-5 5 5"/></svg>',
            BANNER_IMAGE: svgIcon('<path d="M20 12.5V17a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17V7a2.5 2.5 0 0 1 2.5-2.5H12"/><circle cx="9" cy="9.5" r="1.5"/><path d="m20 15.5-3.5-3.5L8 19.5"/><path d="M18 2.5v6M15 5.5h6"/>'),
            BANNER_CHANGE: svgIcon('<path d="M20 11.5V17a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17V7a2.5 2.5 0 0 1 2.5-2.5h5"/><circle cx="9" cy="9.5" r="1.5"/><path d="m20 15.5-3.5-3.5L8 19.5"/><path d="M15 6.5a3 3 0 0 1 5.2-1.8M21 3v2.4h-2.4"/>'),
            BANNER_CANCEL: svgIcon(GLYPH.close),
            BANNER_APPLY: svgIcon(GLYPH.check),
            STICKER_BUTTON: svgIcon('<path d="M15 21H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v7z"/><path d="M15 21v-2.5a3.5 3.5 0 0 1 3.5-3.5H21"/><path d="M8.5 13.5a4.5 4.5 0 0 0 6 .5"/><path d="M9 9h.01M15 9h.01" stroke-width="2.6"/>'),
            LOADING: svgIcon('<path d="M21 12a9 9 0 1 1-6.2-8.6"/>', 22).replace('<svg ', '<svg class="spin" '),
            RECENT: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>', 18),
            ADD_PACK: svgIcon('<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M12 8.5v7M8.5 12h7"/>', 18),
            ZIP_PACK: svgIcon('<path d="M4 8h16v11.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5z"/><path d="M3 4.5h18V8H3z"/><path d="M10 12h4"/>', 18),
            ADD: svgIcon('<path d="M12 5v14M5 12h14"/>', 24),
            EDIT: svgIcon('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>', 14),
            DELETE: svgIcon(GLYPH.close, 12),
            CHECK: svgIcon(GLYPH.check, 16, '#fff'),
            TRASH: svgIcon('<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/>', 16, '#fff'),
            EMPTY_PACK: svgIcon('<rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke-dasharray="2.5 2.5" opacity=".5"/>', 18),
            UPDATE: svgIcon('<path d="M12 4v10M7.5 9.5 12 14l4.5-4.5"/><path d="M4.5 15v2.5A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5V15"/>', 14),
            badge: function (size) {
                if (!document.getElementById('vp-badge-defs')) {
                    const holder = document.createElement('div');
                    holder.innerHTML = `<svg id="vp-badge-defs" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
        <defs>
            <filter id="vp-badge-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2"/>
            </filter>
            <pattern id="vp-badge-rainbow" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <g filter="url(#vp-badge-blur)">
                <circle cx="4" cy="5" r="6" fill="#ff0044" opacity="1">
                <animate attributeName="cx" values="4;8;4" dur="6s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="5;3;5" dur="5s" repeatCount="indefinite"/>
                <animate attributeName="r" values="6;7;6" dur="7s" repeatCount="indefinite"/>
                </circle>
                <circle cx="16" cy="7" r="6" fill="#ff8800" opacity="1">
                <animate attributeName="cx" values="16;12;16" dur="5s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="7;9;7" dur="6s" repeatCount="indefinite"/>
                <animate attributeName="r" values="6;5;6" dur="5.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="8" cy="16" r="6.5" fill="#ffee00" opacity="1">
                <animate attributeName="cx" values="8;10;8" dur="7s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="16;14;16" dur="4s" repeatCount="indefinite"/>
                <animate attributeName="r" values="6.5;7.5;6.5" dur="4.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="20" cy="14" r="5.5" fill="#00ff44" opacity="1">
                <animate attributeName="cx" values="20;17;20" dur="4s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="14;16;14" dur="5.5s" repeatCount="indefinite"/>
                <animate attributeName="r" values="5.5;6.5;5.5" dur="6s" repeatCount="indefinite"/>
                </circle>
                <circle cx="3" cy="18" r="5" fill="#00ffff" opacity="1">
                <animate attributeName="cx" values="3;6;3" dur="5.5s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="18;16;18" dur="6.5s" repeatCount="indefinite"/>
                <animate attributeName="r" values="5;6;5" dur="5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="12" cy="3" r="5.5" fill="#2288ff" opacity="1">
                <animate attributeName="cx" values="12;9;12" dur="6.5s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="3;6;3" dur="4.5s" repeatCount="indefinite"/>
                <animate attributeName="r" values="5.5;6.5;5.5" dur="5.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="21" cy="20" r="6" fill="#aa44ff" opacity="1">
                <animate attributeName="cx" values="21;18;21" dur="4.5s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="20;18;20" dur="5s" repeatCount="indefinite"/>
                <animate attributeName="r" values="6;5;6" dur="6s" repeatCount="indefinite"/>
                </circle>
                <circle cx="6" cy="9" r="4.5" fill="#ff0088" opacity="1">
                <animate attributeName="cx" values="6;9;6" dur="5s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="9;7;9" dur="6s" repeatCount="indefinite"/>
                <animate attributeName="r" values="4.5;5.5;4.5" dur="4s" repeatCount="indefinite"/>
                </circle>
            </g>
            </pattern>
        </defs>
        </svg>`;
                    document.body.appendChild(holder.firstElementChild);
                }
                return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="1.8 1.8 20.4 20.4" fill="none">
        <path fill="url(#vp-badge-rainbow)" fill-rule="evenodd" clip-rule="evenodd" d="M9.5924 3.20027C9.34888 3.4078 9.22711 3.51158 9.09706 3.59874C8.79896 3.79854 8.46417 3.93721 8.1121 4.00672C7.95851 4.03705 7.79903 4.04977 7.48008 4.07522C6.6787 4.13918 6.278 4.17115 5.94371 4.28923C5.17051 4.56233 4.56233 5.17051 4.28923 5.94371C4.17115 6.278 4.13918 6.6787 4.07522 7.48008C4.04977 7.79903 4.03705 7.95851 4.00672 8.1121C3.93721 8.46417 3.79854 8.79896 3.59874 9.09706C3.51158 9.22711 3.40781 9.34887 3.20027 9.5924C2.67883 10.2043 2.4181 10.5102 2.26522 10.8301C1.91159 11.57 1.91159 12.43 2.26522 13.1699C2.41811 13.4898 2.67883 13.7957 3.20027 14.4076C3.40778 14.6511 3.51158 14.7729 3.59874 14.9029C3.79854 15.201 3.93721 15.5358 4.00672 15.8879C4.03705 16.0415 4.04977 16.201 4.07522 16.5199C4.13918 17.3213 4.17115 17.722 4.28923 18.0563C4.56233 18.8295 5.17051 19.4377 5.94371 19.7108C6.278 19.8288 6.6787 19.8608 7.48008 19.9248C7.79903 19.9502 7.95851 19.963 8.1121 19.9933C8.46417 20.0628 8.79896 20.2015 9.09706 20.4013C9.22711 20.4884 9.34887 20.5922 9.5924 20.7997C10.2043 21.3212 10.5102 21.5819 10.8301 21.7348C11.57 22.0884 12.43 22.0884 13.1699 21.7348C13.4898 21.5819 13.7957 21.3212 14.4076 20.7997C14.6511 20.5922 14.7729 20.4884 14.9029 20.4013C15.201 20.2015 15.5358 20.0628 15.8879 19.9933C16.0415 19.963 16.201 19.9502 16.5199 19.9248C17.3213 19.8608 17.722 19.8288 18.0563 19.7108C18.8295 19.4377 19.4377 18.8295 19.7108 18.0563C19.8288 17.722 19.8608 17.3213 19.9248 16.5199C19.9502 16.201 19.963 16.0415 19.9933 15.8879C20.0628 15.5358 20.2015 15.201 20.4013 14.9029C20.4884 14.7729 20.5922 14.6511 20.7997 14.4076C21.3212 13.7957 21.5819 13.4898 21.7348 13.1699C22.0884 12.43 22.0884 11.57 21.7348 10.8301C21.5819 10.5102 21.3212 10.2043 20.7997 9.5924C20.5922 9.34887 20.4884 9.22711 20.4013 9.09706C20.2015 8.79896 20.0628 8.46417 19.9933 8.1121C19.963 7.95851 19.9502 7.79903 19.9248 7.48008C19.8608 6.6787 19.8288 6.278 19.7108 5.94371C19.4377 5.17051 18.8295 4.56233 18.0563 4.28923C17.722 4.17115 17.3213 4.13918 16.5199 4.07522C16.201 4.04977 16.0415 4.03705 15.8879 4.00672C15.5358 3.93721 15.201 3.79854 14.9029 3.59874C14.7729 3.51158 14.6511 3.40781 14.4076 3.20027C13.7957 2.67883 13.4898 2.41811 13.1699 2.26522C12.43 1.91159 11.57 1.91159 10.8301 2.26522C10.5102 2.4181 10.2043 2.67883 9.5924 3.20027Z"/>
        <path fill="black" d="M16.3735 9.86314C16.6913 9.5453 16.6913 9.03 16.3735 8.71216C16.0557 8.39433 15.5403 8.39433 15.2225 8.71216L10.3723 13.5624L8.77746 11.9676C8.45963 11.6498 7.94432 11.6498 7.62649 11.9676C7.30866 12.2854 7.30866 12.8007 7.62649 13.1186L9.79678 15.2889C10.1146 15.6067 10.6299 15.6067 10.9478 15.2889L16.3735 9.86314Z"/>
        </svg>`;
            }
        };

        const SECRET_SALT = 'ITD_MOD_2026_SECRET_SALT_NEUROSFW';
        const VERIFICATION_STORAGE_KEY = 'itd_verified_users';
        const readVerified = () => { try { return JSON.parse(localStorage.getItem(VERIFICATION_STORAGE_KEY) || '{}') || {}; } catch (e) { return {}; } };
        let isVerifying = false;

        const QUARANTINE_MS = 3 * 24 * 60 * 60 * 1000;
        const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
        const GONE_MS = 90 * 24 * 60 * 60 * 1000;
        const GONE_FROM = Date.UTC(2026, 9, 1);

        let approvedIds = new Set();
        function isApprovedId(id) {
            if (!id) return false;
            const key = String(id).toLowerCase();
            if (key === OWNER_ID.toLowerCase()) return true;
            return approvedIds.has(key);
        }
        function isApprovedAuthor(author) {
            return !!(author && isApprovedId(author.id));
        }
        function acctKey(base) {
            const id = (meData && meData.id) || (siteAuth.me && siteAuth.me.id) || '';
            if (!id) return base;
            const k = base + '@' + id;
            if (GM_getValue(k, undefined) === undefined) {
                const owner = GM_getValue('vp_acct_owner', null);
                if (!owner) GM_setValue('vp_acct_owner', id);
                const legacy = GM_getValue(base, undefined);
                if ((!owner || owner === id) && legacy !== undefined) GM_setValue(k, legacy);
            }
            return k;
        }
        function loadApprovedIds() {
            let all = {};
            try { all = readVerified(); } catch (e) { }
            const s = new Set();
            for (const info of Object.values(all)) if (info && info.state === 'approved' && info.id) s.add(String(info.id).toLowerCase());
            approvedIds = s;
            return s;
        }
        async function ensureApproved() {
            for (let i = 0; i < 40 && isVerifying; i++) await new Promise(r => setTimeout(r, 250));
            if (!localStorage.getItem(VERIFICATION_STORAGE_KEY)) await checkAllComments();
            loadApprovedIds();
        }

        let globalHue = 0;
        let colorDirection = 1;
        let myUsername = null;
        let meData = null;
        let myDisplayName = null;
        let postBorderEnabled = GM_getValue('postBorderEnabled', true);
        let postBlurEnabled = GM_getValue('postBlurEnabled', true);
        let currentStyle = GM_getValue('nickStyle', 'white');
        let backgroundEnabled = GM_getValue('backgroundEnabled', true);
        let backgroundStyle = GM_getValue('backgroundStyle', 'matrix');
        let neonEnabled = GM_getValue('neonEnabled', true);
        document.documentElement.classList.toggle('vp-no-neon', !neonEnabled);
        let nickGlowEnabled = GM_getValue('nickGlowEnabled', true);
        let avatarGlowEnabled = GM_getValue('avatarGlowEnabled', true);
        let antiCensorshipEnabled = GM_getValue('antiCensorshipEnabled', true);
        let showLooks = GM_getValue('showLooks', true);
        document.documentElement.classList.toggle('vp-looks', showLooks);
        let autoLikeUsers = (() => { try { return JSON.parse(GM_getValue('itd_auto_like_users', '{}')) || {}; } catch (e) { return {}; } })();
        let autoLikeEnabled = GM_getValue('autoLikeEnabled', true);

        function myAvatarEl() {
            if (!myUsername) return null;
            const link = document.querySelector(`a[href="/@${myUsername}" i]`);
            if (!link) return null;
            const container = link.querySelector(':scope > div');
            if (container && container.querySelector('span')) return container;
            return link.firstElementChild || link.querySelector('span');
        }
        const AUTO_LIKE_CACHE_KEY = 'itd_auto_like_full_cache';
        const AUTO_LIKE_CACHE_TTL = 10 * 60 * 1000;
        const LIKE_INTERVAL_MIN = 15 * 60 * 1000;
        const LIKE_INTERVAL_MAX = 30 * 60 * 1000;
        const LIKE_DELAY_MIN = 3 * 60 * 1000;
        const LIKE_DELAY_MAX = 10 * 60 * 1000;
        const DAY = 24 * 60 * 60 * 1000;

        function saveAutoLikeUsers() {
            GM_setValue(acctKey('itd_auto_like_users'), JSON.stringify(autoLikeUsers));
        }

        const autoLikeIds = JSON.parse(GM_getValue(AUTO_LIKE_KEY, '{}') || '{}');
        const autoLikeGone = new Set();
        function reloadAutoLike() {
            try { autoLikeUsers = JSON.parse(GM_getValue(acctKey('itd_auto_like_users'), '{}')) || {}; } catch (e) { autoLikeUsers = {}; }
            let ids = {};
            try { ids = JSON.parse(GM_getValue(acctKey(AUTO_LIKE_KEY), '{}') || '{}') || {}; } catch (e) { }
            Object.keys(autoLikeIds).forEach(k => delete autoLikeIds[k]);
            Object.assign(autoLikeIds, ids);
        }
        function rememberAutoLikeId(username) {
            const id = (verifiedInfo(username) || {}).id;
            if (id && autoLikeIds[username] !== id) { autoLikeIds[username] = id; GM_setValue(acctKey(AUTO_LIKE_KEY), JSON.stringify(autoLikeIds)); }
        }
        function renamedAutoLike(username) {
            const id = autoLikeIds[username];
            if (!id) return null;
            let all = {};
            try { all = readVerified(); } catch (e) { }
            const now = Object.keys(all).find(n => all[n] && all[n].id === id && n !== username);
            if (!now) return null;
            autoLikeUsers[now] = true;
            delete autoLikeUsers[username];
            autoLikeIds[now] = id;
            delete autoLikeIds[username];
            saveAutoLikeUsers();
            GM_setValue(acctKey(AUTO_LIKE_KEY), JSON.stringify(autoLikeIds));
            return now;
        }
        async function autoLikeLook(username) {
            if (autoLikeGone.has(username)) return [];
            rememberAutoLikeId(username);
            const res = await api(`/api/posts/user/${username}?limit=7`);
            if (res.status === 404) {
                const now = renamedAutoLike(username);
                if (now) return autoLikeLook(now);
                autoLikeGone.add(username);
                return [];
            }
            if (!res.ok) return [];
            const data = await res.json();
            return (data.data?.posts || data.posts || [])
                .filter(p => p.isLiked === false && Date.now() - new Date(p.createdAt).getTime() <= DAY);
        }

        let autoLikeBusy = false;
        const rndBetween = (a, b) => a + Math.random() * (b - a);
        async function autoLikeTick() {
            if (!autoLikeEnabled || autoLikeBusy || apiPaused() || !leadTab()) return;
            const users = Object.keys(autoLikeUsers).filter(u => autoLikeUsers[u] === true);
            const now = Date.now(), next = GM_getValue('vp_like_next', {}) || {};
            let queue = (GM_getValue('vp_like_queue', []) || []).filter(q => autoLikeUsers[q.u] === true && now - q.at < DAY);
            autoLikeBusy = true;
            try {
                const due = queue.filter(q => q.at <= now).sort((x, y) => x.at - y.at)[0];
                if (due) {
                    const like = await api(`/api/posts/${due.id}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                    if (like.status !== 429) queue = queue.filter(q => q !== due);
                } else {
                    users.forEach(u => { if (!next[u]) next[u] = now + rndBetween(30e3, 5 * 60e3); });
                    const u = users.filter(x => next[x] <= now).sort((x, y) => next[x] - next[y])[0];
                    if (u) next[u] = now + rndBetween(LIKE_INTERVAL_MIN, LIKE_INTERVAL_MAX);
                    GM_setValue('vp_like_next', Object.fromEntries(users.map(x => [x, next[x]])));
                    if (u) {
                        for (const p of await autoLikeLook(u)) if (!queue.some(q => q.id === p.id)) queue.push({ id: p.id, u, at: Date.now() + rndBetween(LIKE_DELAY_MIN, LIKE_DELAY_MAX) });
                    }
                }
            } catch (e) { console.warn('[ITD VP] автолайк', e); logErr('автолайк', e); } finally {
                GM_setValue('vp_like_queue', queue);
                autoLikeBusy = false;
            }
        }
        function scheduleAutoLike() {
            setInterval(autoLikeTick, 20000);
        }

        async function fetchAutoLikeUsers() {
            try {
                const c = JSON.parse(localStorage.getItem(AUTO_LIKE_CACHE_KEY) || 'null');
                if (c && Date.now() - c.timestamp <= AUTO_LIKE_CACHE_TTL) return c.usersData;
            } catch (e) { }

            const usernames = verifiedNames();
            if (!usernames.includes('NeuroSFW')) usernames.push('NeuroSFW');

            const usersData = {};
            await Promise.all(usernames.map(async username => {
                const v = verifiedInfo(username);
                if (v && (v.displayName || v.avatar)) { usersData[username] = { username, displayName: v.displayName, avatar: v.avatar }; return; }
                try {
                    const res = await api(`/api/users/${username}`);
                    if (res.ok) usersData[username] = await res.json();
                } catch (e) { }
            }));
            if (Object.keys(usersData).length) {
                try { localStorage.setItem(AUTO_LIKE_CACHE_KEY, JSON.stringify({ usersData, timestamp: Date.now() })); } catch (e) { }
            }
            return usersData;
        }

        const nickStyles = {
            fire: {
                name: 'Огненный',
                color: '#ff4400',
                gradientLight: 'linear-gradient(270deg, #ff2200, #ff6600, #ffaa00)',
                gradientDark: 'linear-gradient(270deg, #ff4400, #ff8800, #ffcc22)',
                glow: 'drop-shadow(0 0 20px rgba(255, 68, 0, 0.9)) drop-shadow(0 0 35px rgba(255, 68, 0, 0.6))',
                matrixHue: 25,
                avatarHue: 25,
                matrixSat: 100,
                avatarSat: 100
            },
            pinkNeon: {
                name: 'Розовый неон',
                color: '#ff2d75',
                gradientLight: 'linear-gradient(270deg, #ff2d75, #ff69b4, #ff9eb5)',
                gradientDark: 'linear-gradient(270deg, #ff44aa, #ff77cc, #ff99dd)',
                glow: 'drop-shadow(0 0 20px #ff2d75) drop-shadow(0 0 35px #ff2d75)',
                matrixHue: 330,
                avatarHue: 330,
                matrixSat: 100,
                avatarSat: 100
            },
            gold: {
                name: 'Золотой',
                color: '#ffd700',
                gradientLight: 'linear-gradient(270deg, #ffd700, #ffb347, #ff8c00)',
                gradientDark: 'linear-gradient(270deg, #ffea00, #ffcc44, #ffaa33)',
                glow: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.9)) drop-shadow(0 0 25px rgba(255, 215, 0, 0.6))',
                matrixHue: 50,
                avatarHue: 50,
                matrixSat: 100,
                avatarSat: 100
            },
            neonPulse: {
                name: 'Неон-пульс',
                color: '#00ff88',
                gradientLight: 'linear-gradient(270deg, #00ff88, #00ffcc, #88ffcc)',
                gradientDark: 'linear-gradient(270deg, #44ffaa, #44ffdd, #aaffdd)',
                glow: 'drop-shadow(0 0 15px #00ff88) drop-shadow(0 0 25px #00ff88)',
                matrixHue: 155,
                avatarHue: 155,
                matrixSat: 100,
                avatarSat: 100
            },
            matrix: {
                name: 'Матрица',
                color: '#0f0',
                gradientLight: 'linear-gradient(270deg, #0f0, #0f8, #0f0)',
                gradientDark: 'linear-gradient(270deg, #2f2, #2fa, #2f2)',
                glow: 'drop-shadow(0 0 6px #0f0) drop-shadow(0 0 12px #0f0)',
                matrixHue: 120,
                avatarHue: 120,
                matrixSat: 100,
                avatarSat: 100
            },
            blueGlow: {
                name: 'Голубое свечение',
                color: '#00b4d8',
                gradientLight: 'linear-gradient(270deg, #0288d1, #00b4d8, #48cae4)',
                gradientDark: 'linear-gradient(270deg, #4fc3f7, #90e0ef, #caf0f8)',
                glow: 'drop-shadow(0 0 20px #00b4d8) drop-shadow(0 0 35px #0288d1)',
                matrixHue: 195,
                avatarHue: 195,
                matrixSat: 100,
                avatarSat: 100
            },
            purpleMystic: {
                name: 'Фиолетовый мистик',
                color: '#9b30ff',
                gradientLight: 'linear-gradient(270deg, #7b2fff, #9b30ff, #c55aff)',
                gradientDark: 'linear-gradient(270deg, #9b44ff, #bb66ff, #dd88ff)',
                glow: 'drop-shadow(0 0 20px #9b30ff) drop-shadow(0 0 35px #7b2fff)',
                matrixHue: 270,
                avatarHue: 270,
                matrixSat: 100,
                avatarSat: 100
            },
            default: {
                name: 'Стандартный',
                color: '#0288d1',
                gradientLight: 'linear-gradient(270deg, #0288d1, #26c6da)',
                gradientDark: 'linear-gradient(270deg, #4fc3f7, #e0f7fa)',
                glow: 'drop-shadow(0 0 20px rgba(0, 128, 255, 0.9)) drop-shadow(0 0 35px rgba(0, 128, 255, 0.6))',
                matrixHue: 210,
                avatarHue: 210,
                matrixSat: 100,
                avatarSat: 100
            },
            white: {
                name: 'Белый',
                color: '#ffffff',
                gradientLight: 'linear-gradient(270deg, #e0e0e0, #ffffff, #f0f0f0)',
                gradientDark: 'linear-gradient(270deg, #d0d0d0, #ffffff, #e8e8e8)',
                glow: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 25px rgba(255, 255, 255, 0.6))',
                matrixHue: 0,
                avatarHue: 0,
                matrixSat: 15,
                avatarSat: 15
            },
            orange: {
                name: 'Оранжевый',
                color: '#ff8c1a',
                gradientLight: 'linear-gradient(270deg, #f26b00, #ff8c1a, #ffa64d)',
                gradientDark: 'linear-gradient(270deg, #ff8c1a, #ffa64d, #ffc080)',
                glow: 'drop-shadow(0 0 15px rgba(255, 140, 26, 0.9)) drop-shadow(0 0 25px rgba(255, 140, 26, 0.6))',
                matrixHue: 30,
                avatarHue: 30,
                matrixSat: 100,
                avatarSat: 100
            },
            gray: {
                name: 'Серый',
                color: '#9a9aa2',
                gradientLight: 'linear-gradient(270deg, #55555c, #7a7a82, #606067)',
                gradientDark: 'linear-gradient(270deg, #8e8e96, #b8b8c0, #a0a0a8)',
                glow: 'drop-shadow(0 0 15px rgba(170, 170, 180, 0.8)) drop-shadow(0 0 25px rgba(170, 170, 180, 0.5))',
                matrixHue: 0,
                avatarHue: 0,
                matrixSat: 0,
                avatarSat: 0
            },
            shimmer: {
                name: 'Перелив',
                color: '#b388ff',
                nickCss: dark => `background: linear-gradient(100deg, ${dark ? '#a78bfa 0%, #a78bfa 38%, #ffffff 50%, #f0abfc 58%, #a78bfa 72%, #a78bfa 100%'
                    : '#5b21b6 0%, #5b21b6 38%, #c084fc 50%, #db2777 58%, #5b21b6 72%, #5b21b6 100%'}) 0 0 / 250% 100% !important;
                -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important;
                animation: vpShimmer 3.2s ease-in-out infinite !important;`,
                glow: 'drop-shadow(0 0 10px rgba(179, 136, 255, 0.75)) drop-shadow(0 0 22px rgba(179, 136, 255, 0.4))',
                matrixHue: 265,
                avatarHue: 265,
                matrixSat: 90,
                avatarSat: 90
            },
            glitch: {
                name: 'Глитч',
                color: '#00fff0',
                nickCss: dark => `color: ${dark ? '#eafffd' : '#111'} !important; -webkit-text-fill-color: currentColor !important; background: none !important;
                display: inline-block; text-shadow: 1.5px 0 rgba(255, 0, 200, .75), -1.5px 0 rgba(0, 255, 240, .75) !important;
                animation: vpGlitch 3.6s steps(1, end) infinite !important;`,
                glow: 'drop-shadow(0 0 8px rgba(0, 255, 240, 0.55))',
                matrixHue: 180,
                avatarHue: 180,
                matrixSat: 100,
                avatarSat: 100
            },
            rainbow: {
                name: 'Радужный',
                color: 'rainbow',
                gradientLight: null,
                gradientDark: null,
                glow: null,
                matrixHue: null,
                avatarHue: null,
                matrixSat: 100,
                avatarSat: 100,
                animated: true
            }
        };

        const hueOf = hex => {
            const h = hex.length === 4 ? hex.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : hex;
            const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
            const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
            if (d < 0.15) return null;
            const hue = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
            return (hue * 60 + 30) % 360;
        };
        const styleKeys = Object.keys(nickStyles).sort((a, b) => {
            const rank = k => {
                const c = nickStyles[k].color; const h = c && c.startsWith('#') ? hueOf(c) : null;
                return h !== null ? h : c === 'rainbow' ? 1001 : 1000;
            };
            return rank(a) - rank(b);
        });
        brandTab();
        new MutationObserver(brandTab).observe(document.head, { childList: true, subtree: true, characterData: true });

        const globalStyles = addCss(`
        :where(:root) { --vp-accent: #0080ff; }
        .nick-controls-panel {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: var(--bg-secondary, rgba(128, 128, 128, 0.15)) !important;
            border-radius: 24px !important;
            padding: 4px !important;
            margin-left: 10px !important;
            gap: 2px !important;
            vertical-align: middle !important;
            flex-shrink: 0 !important;
        }
        .vp-pill-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 32px !important;
            height: 32px !important;
            cursor: pointer !important;
            background: var(--bg-secondary, rgba(128, 128, 128, 0.15)) !important;
            border-radius: 50% !important;
            transition: background 0.2s ease, color 0.2s ease !important;
            vertical-align: middle !important;
            flex-shrink: 0 !important;
            user-select: none !important;
            color: var(--text-primary, currentColor) !important;
        }
        .vp-pill-btn:hover { background: var(--accent-primary) !important; }
        .vp-pill-btn svg:not([width]) { width: 20px !important; height: 20px !important; }
        .vp-pill-btn svg:not([fill]) { fill: none !important; }
        .vp-menu-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--text-primary, currentColor); }
        .vp-menu-note { padding: 20px; text-align: center; color: var(--text-secondary); }
        .vp-setting-label { display: flex; align-items: center; gap: 8px; }
        .vp-like-list { overflow-y: auto; overflow-x: hidden; flex: 1; padding: 4px 0; display: flex; flex-direction: column; gap: 2px; max-height: 350px; }
        .vp-like-footer { padding: 8px 12px; text-align: center; font-size: 12px; color: var(--text-secondary); border-top: 1px solid var(--border-color); flex-shrink: 0; }
        .nick-style-option.vp-like-row { justify-content: space-between !important; }
        .nick-style-option.vp-like-row:hover { transform: none !important; }
        .vp-like-user { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
        .vp-like-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; background: rgba(0, 0, 0, 0.2); flex-shrink: 0; overflow: hidden; }
        .vp-like-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .vp-like-names { display: flex; flex-direction: column; min-width: 0; }
        .vp-like-name { font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-like-login { font-size: 11px; color: var(--text-secondary); }
        .nick-style-option {
            padding: 8px 12px !important;
            cursor: pointer !important;
            transition: all 0.15s ease !important;
            color: var(--text-primary, #ffffff) !important;
            font-size: 14px !important;
            font-family: inherit !important;
            border-radius: 16px !important;
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
        }
        .nick-style-option:hover {
            background: var(--bg-hover, rgba(0, 128, 255, 0.15)) !important;
            transform: translateX(2px) !important;
        }
        .style-color-dot {
            width: 24px !important;
            height: 24px !important;
            border-radius: 12px !important;
            flex-shrink: 0 !important;
            transition: all 0.2s ease !important;
        }
        .style-color-dot.rainbow-dot {
            background: linear-gradient(135deg, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff) !important;
            background-size: 200% 200% !important;
            animation: dotRainbow 12s ease infinite !important;
        }
        @keyframes dotRainbow {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
        }
        .nick-style-option.vp-active {
            background: color-mix(in srgb, var(--vp-accent) 16%, transparent) !important;
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 45%, transparent) !important;
            font-weight: 600 !important;
        }
        .vp-opt-check { margin-left: auto; display: flex; color: var(--vp-accent); }
        html.vp-light .vp-bg-canvas { filter: invert(1) hue-rotate(180deg); }
        html.vp-light .settings-dropdown { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important; }
        .nick-style-option:not(:last-child) {
            margin-bottom: 2px !important;
        }
        .settings-dropdown.vp-logo-menu { min-width: 170px !important; padding: 6px !important; }
        .settings-dropdown.vp-logo-menu .vp-opt-icon { display: inline-flex; width: 20px; justify-content: center; }
        .settings-dropdown {
            background: var(--block-bg) !important;
            border-radius: 24px !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
            padding: 12px !important;
            min-width: 220px !important;
            z-index: 10001 !important;
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1)) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            animation: settingsFadeIn 0.15s ease !important;
            position: fixed !important;
        }
        @keyframes settingsFadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .settings-option {
            padding: 10px 12px !important;
            cursor: pointer !important;
            transition: all 0.15s ease !important;
            color: var(--text-primary, #ffffff) !important;
            font-size: 14px !important;
            font-family: inherit !important;
            border-radius: 16px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 12px !important;
        }
        .settings-option:hover {
            background: var(--bg-hover, rgba(0, 128, 255, 0.15)) !important;
        }
        .vp-vol-row { cursor: default; }
        .vp-vol { display: inline-flex; align-items: center; gap: 8px; flex: 0 0 auto; }
        .vp-vol b { min-width: 38px; text-align: right; font-weight: 500; font-size: 13px; color: var(--text-secondary); }
        .vp-vol input { -webkit-appearance: none; appearance: none; width: 120px; height: 4px; border-radius: 4px; margin: 0; cursor: pointer;
            background: linear-gradient(to right, var(--vp-accent) var(--vp-vol, 100%), rgba(128,128,128,.35) var(--vp-vol, 100%)); }
        .vp-vol input::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.4); }
        .vp-vol input::-moz-range-thumb { width: 16px; height: 16px; border: 0; border-radius: 50%; background: #fff; }
        .toggle-switch {
            width: 40px !important;
            height: 22px !important;
            background: rgba(0, 0, 0, 0.5) !important;
            border-radius: 11px !important;
            position: relative !important;
            transition: all 0.2s ease !important;
            flex-shrink: 0 !important;
        }
        .toggle-switch.active {
            background: var(--accent-primary) !important;
        }
        .toggle-switch::after {
            content: '' !important;
            position: absolute !important;
            top: 2px !important;
            left: 2px !important;
            width: 18px !important;
            height: 18px !important;
            background: white !important;
            border-radius: 50% !important;
            transition: all 0.2s ease !important;
        }
        .toggle-switch.active::after {
            left: 20px !important;
        }
        .vp-feed-bar .vp-tabs button { white-space: nowrap !important; }
        @media (max-width: ${PHONE_MAX}px) { [data-vp-posts] > hr { display: none !important; } }
        .vp-emoji-tint .vp-soft-bg, .itd-blur-active .vp-soft-bg { background-color: rgba(0, 0, 0, .22) !important; }
        html.vp-light .vp-emoji-tint .vp-soft-bg, html.vp-light .itd-blur-active .vp-soft-bg { background-color: rgba(255, 255, 255, .35) !important; }
        .vp-nick-row > a { min-width: 0; overflow: hidden; }
        .vp-nick-row .vp-nick:not(.vp-nick-large *) { min-width: 0; max-width: 100%; }
        .vp-nick:not(.vp-nick-large) > :has(> .vp-nick-text) { display: inline-flex; align-items: center; gap: inherit; min-width: 0; }
        .vp-nick-row .vp-nick-text:not(.vp-nick-large *) { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 0 1 auto; }
        .vp-post header .vp-nick-row:not(:last-child) { padding-right: 50px; }
        @media (max-width: ${PHONE_MAX}px) { .vp-post header .vp-nick-row:not(:last-child) { padding-right: 42px; } }
        .vp-notif .vp-nick-row > a { max-width: 100%; }
        .vp-notif .vp-nick-row .vp-nick:not(.vp-nick-large *) { display: flex; flex-wrap: nowrap; align-items: center; }
        article .vp-nick-row time { flex-shrink: 0; }
        .vp-clamp::after { display: none !important; }
        .vp-clamp { -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 60px), transparent); mask-image: linear-gradient(to bottom, #000 calc(100% - 60px), transparent); }
        .vp-banner-buttons { inset: var(--vp-bar-top, 0px) auto auto 50% !important; width: auto !important; height: auto !important; margin: 0 !important; translate: none !important; scale: none !important; rotate: none !important;
            transform: translateX(-50%); display: flex !important; gap: 2px !important; align-items: center !important;
            z-index: 3; }
        .vp-banner-ours { display: flex !important; gap: 2px !important; padding: 4px 12px 7px !important; align-items: center !important;
            border-radius: 0 0 22px 22px; background: rgba(12, 12, 16, .6); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); transition: clip-path .25s cubic-bezier(.2,.8,.2,1), opacity .2s; }
        html.vp-light .vp-banner-ours { background: rgba(255, 255, 255, .65); }
        .vp-banner-ours > button { background: transparent !important; box-shadow: none !important; }
        .vp-banner-ours > button:hover { background: rgba(128, 128, 128, .22) !important; }
        @media (hover: hover) and (pointer: fine) {
            .vp-banner-ours:not(.vp-banner-editing) { opacity: 0; clip-path: inset(0 0 100% 0); visibility: hidden;
                transition: clip-path .25s cubic-bezier(.2,.8,.2,1), opacity .2s, visibility 0s linear .25s; }
            .vp-banner:hover .vp-banner-ours, .vp-banner-ours:has(:focus-visible) { opacity: 1; clip-path: inset(0 0 0 0); visibility: visible;
                transition: clip-path .25s cubic-bezier(.2,.8,.2,1), opacity .2s, visibility 0s; }
        }
        .toggle-switch.vp-tri { width: 58px !important; }
        .toggle-switch.vp-tri[data-s="1"]::after { left: 20px !important; }
        .toggle-switch.vp-tri { background: rgba(0, 0, 0, 0.5) !important; }
        .toggle-switch.vp-tri::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 22px; border-radius: 11px;
            background: var(--accent-primary); opacity: 0; transition: width .2s ease, opacity .2s ease; }
        .toggle-switch.vp-tri[data-s="1"]::before { width: 40px; opacity: 1; }
        .toggle-switch.vp-tri[data-s="2"]::before { width: 58px; opacity: 1; }
        .toggle-switch.vp-tri[data-s="2"]::after { left: 38px !important;
            background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230080ff' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 9.5v5h3.5L12 18.5V5.5L7.5 9.5z'/%3E%3Cpath d='M16 9a4 4 0 0 1 0 6'/%3E%3C/svg%3E") center / 12px no-repeat !important; }
        .vp-tri-text { display: flex; flex-direction: column; gap: 1px; }
        .vp-tri-text small { font-size: 11.5px; color: var(--text-secondary); }
        .vp-nuksta-hidden { display: none !important; }
        .vp-sec-title { font-size: 12px; font-weight: 600; letter-spacing: .02em; color: var(--text-secondary);
            margin: 12px 12px 6px; }
        .vp-like-inline { max-height: none !important; }
        .vp-settings-tabs { width: 320px !important; max-width: calc(100vw - 16px) !important; box-sizing: border-box !important;
            max-height: calc(100dvh - 16px); display: flex !important; flex-direction: column; overflow: hidden !important; }
        .vp-settings-tabs .vp-stabs { flex: 0 0 auto; }
        .vp-settings-tabs .settings-option.vp-dim { opacity: .4; pointer-events: none; }
        .vp-pals { position: fixed; inset: 0; z-index: 9000; pointer-events: none; overflow: hidden; }
        .vp-pal { position: absolute; bottom: 0; box-sizing: content-box; padding: 24px; margin: -24px; width: auto; height: min(var(--vp-pal-h, 45vh), calc(48vw * var(--vp-pal-r, 1))); pointer-events: none;
            user-select: none; -webkit-user-drag: none; animation: vpPalIn .7s cubic-bezier(.2, .9, .3, 1.15) both; }
        .vp-pal-miku { right: 0; transform: translate(6%, 5%); }
        .vp-pal-teto { left: 0; transform: scaleX(-1) translate(6%, 5%); }
        .vp-pals[data-look="neon"] .vp-pal-miku { filter: drop-shadow(0 0 1.5px rgba(120, 255, 245, .9)) drop-shadow(0 0 10px rgba(57, 197, 187, .55)); }
        .vp-pals[data-look="neon"] .vp-pal-teto { filter: drop-shadow(0 0 1.5px rgba(255, 150, 170, .9)) drop-shadow(0 0 10px rgba(255, 77, 109, .55)); }
        .vp-pals[data-look="dim"] .vp-pal { filter: brightness(.82) saturate(.85) contrast(1.05) drop-shadow(0 10px 28px rgba(0, 0, 0, .65)); }
        .vp-pals-phone { -webkit-mask-image: linear-gradient(to top, transparent calc(var(--vp-pal-nav, 0px) - 6px), #000 calc(var(--vp-pal-nav, 0px) + 20px));
            mask-image: linear-gradient(to top, transparent calc(var(--vp-pal-nav, 0px) - 6px), #000 calc(var(--vp-pal-nav, 0px) + 20px)); }
        .vp-pals-phone .vp-pal { bottom: calc(var(--vp-pal-nav, 0px) - 4px); }
        html.vp-pals-r { scrollbar-width: none !important; scrollbar-gutter: auto !important; }
        html.vp-pals-r::-webkit-scrollbar { display: none !important; }
        @keyframes vpPalIn { from { translate: 0 60%; opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .vp-pal { animation: none; } }
        .vp-rcard-move { display: flex; gap: 2px; margin-left: auto; margin-right: 10px; }
        .vp-rcard-move button { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: inherit; cursor: pointer; }
        .vp-rcard-move button:hover:not(:disabled) { background: rgba(127, 127, 127, .18); }
        .vp-rcard-move button:disabled { opacity: .25; cursor: default; }
        .vp-rcards-hint { padding: 2px 12px 8px; font-size: 12px; opacity: .55; }
        .vp-tab-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none;
            touch-action: pan-y; -webkit-overflow-scrolling: touch; margin: 0 -12px -12px; padding: 0 12px 12px; }
        .vp-tab-body::-webkit-scrollbar { display: none; }
        .vp-pick-grid { display: grid; grid-template-columns: 1fr 1fr; grid-auto-flow: column; gap: 2px 4px; }
        .vp-pick-grid .nick-style-option { padding: 8px 8px !important; gap: 8px !important; font-size: 13px !important; min-width: 0; margin: 0 !important; }
        .vp-pick-grid .nick-style-option:hover { transform: none !important; }
        .vp-pick-grid .nick-style-option > span:not(.vp-opt-check) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-pick-grid .vp-opt-check { display: none; }
        .vp-pick-grid .style-color-dot { width: 18px !important; height: 18px !important; }
        .vp-settings-tabs::-webkit-scrollbar { display: none; }
        .vp-stabs { display: flex; gap: 4px; padding: 3px; margin-bottom: 8px; border-radius: 16px;
            background: color-mix(in srgb, var(--text-primary, #fff) 7%, transparent); }
        .vp-stab { flex: 1 1 auto; min-width: 0; border: 0; background: none; cursor: pointer; font: inherit; font-size: 13px;
            padding: 7px 2px; white-space: nowrap; border-radius: 13px; color: var(--text-secondary); transition: background .15s ease, color .15s ease; }
        .vp-stab:hover { color: var(--text-primary, #fff); }
        .vp-stab.vp-active { color: var(--text-primary, #fff); font-weight: 600;
            background: color-mix(in srgb, var(--vp-accent) 22%, transparent);
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 45%, transparent); }
        .vp-icon-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .vp-icon-tile { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; padding: 6px 2px 5px;
            border: 0; border-radius: 14px; background: none; cursor: pointer; font: inherit; color: var(--text-secondary); }
        .vp-icon-tile img { width: 44px; height: 44px; border-radius: 11px; display: block; }
        .vp-icon-tile span { font-size: 10.5px; line-height: 1.15; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-icon-tile:hover { background: var(--bg-hover, rgba(0, 128, 255, 0.15)); }
        .vp-icon-tile.vp-active { color: var(--text-primary, #fff);
            background: color-mix(in srgb, var(--vp-accent) 16%, transparent);
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 45%, transparent); }
        .vp-icon-own { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.1)); }
        .vp-icon-own-title { font-size: 13px; font-weight: 600; color: var(--text-primary, #fff); margin: 0 4px 8px; }
        .vp-icon-own-row { display: flex; align-items: center; gap: 10px; padding: 0 4px; }
        .vp-icon-emoji { width: 44px; height: 44px; flex: 0 0 44px; box-sizing: border-box; text-align: center; font-size: 24px; padding: 0;
            border-radius: 12px; border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15)); outline: none;
            background: color-mix(in srgb, var(--text-primary, #fff) 6%, transparent); color: var(--text-primary, #fff); }
        .vp-icon-emoji:focus { border-color: var(--vp-accent); }
        .vp-icon-bgs { display: flex; flex-wrap: wrap; gap: 5px; }
        .vp-icon-bg { width: 20px; height: 20px; border-radius: 50%; border: 0; padding: 0; cursor: pointer;
            box-shadow: inset 0 0 0 1px rgba(127, 127, 127, .35); }
        .vp-icon-bg.vp-active { box-shadow: 0 0 0 2px var(--block-bg), 0 0 0 4px var(--vp-accent); }
        .vp-icon-upload { width: 100%; margin-top: 12px; padding: 10px 12px; border-radius: 16px; cursor: pointer; font: inherit; font-size: 14px;
            border: 1px dashed var(--border-color, rgba(255, 255, 255, 0.2)); background: none; color: var(--text-primary, #fff); }
        .vp-icon-upload:hover { background: var(--bg-hover, rgba(0, 128, 255, 0.15)); }
        .vp-icon-note { font-size: 11.5px; line-height: 1.35; margin: 8px 4px 2px; color: var(--text-secondary); }
    `);

        const styleBgCanvas = addCss(`
        .vp-bg-canvas {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;
            opacity: 0.2; pointer-events: none; transition: opacity .4s ease;
        }
        .vp-bg-canvas.vp-bg-off { display: none; }
    `);
        const canvas = document.createElement('canvas');
        canvas.className = 'vp-bg-canvas';
        document.body.appendChild(canvas);
        const bgMedia = document.createElement('div');
        bgMedia.className = 'vp-bg-media vp-bg-off';
        document.body.appendChild(bgMedia);
        styleBgCanvas.textContent += `
        .vp-bg-media { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
        .vp-bg-media.vp-bg-off { display: none; }
        .vp-bg-media > img, .vp-bg-media > video { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(.5) saturate(1.1); }
        html.vp-light .vp-bg-media > img, html.vp-light .vp-bg-media > video { filter: none; opacity: .45; }
    `;
        const bgDb = () => new Promise((ok, no) => {
            const r = indexedDB.open('itdx', 1);
            r.onupgradeneeded = () => r.result.createObjectStore('files');
            r.onsuccess = () => ok(r.result);
            r.onerror = () => no(r.error);
        });
        async function bgFile(blob) {
            const db = await bgDb();
            return new Promise((ok, no) => {
                const tx = db.transaction('files', blob ? 'readwrite' : 'readonly'), st = tx.objectStore('files');
                const r = blob ? st.put(blob, 'background') : st.get('background');
                r.onsuccess = () => ok(blob || r.result || null);
                r.onerror = () => no(r.error);
            });
        }
        let bgMediaUrl = '';
        async function showBgMedia(blob) {
            const fresh = !!blob;
            if (!blob) blob = await bgFile().catch(() => null);
            if (bgMediaUrl) URL.revokeObjectURL(bgMediaUrl);
            bgMediaUrl = blob ? URL.createObjectURL(blob) : '';
            bgMedia.replaceChildren();
            if (!blob) return;
            if (/^video\//.test(blob.type)) {
                const v = document.createElement('video');
                Object.assign(v, { src: bgMediaUrl, muted: true, loop: true, autoplay: true, playsInline: true });
                v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
                v.addEventListener('error', () => { if (fresh) alert('Браузер не умеет показывать это видео. Сохрани его как mp4 (H.264) или webm и выбери снова'); }, { once: true });
                bgMedia.appendChild(v);
                v.play().catch(() => { });
            } else {
                const img = document.createElement('img');
                img.src = bgMediaUrl;
                img.alt = '';
                bgMedia.appendChild(img);
            }
        }
        function pickBgFile(done) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,video/*';
            input.onchange = async () => {
                const f = input.files[0];
                if (!f) return;
                if (f.size > 150 * 1024 * 1024) { alert('Файл больше 150 МБ — возьми поменьше'); return; }
                if (/^video\//.test(f.type) && f.size > VIDEO_UP_MAX) alert('Видео больше 30 МБ: у тебя оно будет играть, а другие увидят только первый кадр. Чтобы видели видео — сожми его до 30 МБ');
                try { await bgFile(f); } catch (e) { alert('Не вышло сохранить файл: ' + (e && e.message || e)); return; }
                backgroundStyle = 'custom';
                GM_setValue('backgroundStyle', 'custom');
                await showBgMedia(f);
                updateBackgroundVisibility();
                if (done) done();
            };
            input.click();
        }
        let bgGuest = null, bannerVideoGuest = '', bannerVideoBusy = false;
        const BANNER_VIDEO_RE = /^[\w-]+(\/[\w-]+)*\.(mp4|webm|mov)$/i;
        const bannerVideoOwn = () => { const v = GM_getValue(acctKey('vp_banner_video'), ''); return BANNER_VIDEO_RE.test(v) ? v : ''; };
        const effBg = () => bgGuest ? bgGuest.b : backgroundStyle;
        function setBgGuest(look) {
            const gv = showLooks && look && look.v || '';
            if (gv !== bannerVideoGuest) { bannerVideoGuest = gv; bannerVideoSync(); }
            const g = showLooks && look && look.b && look.b !== '-' && (look.b !== 'custom' || look.i)
                ? { b: look.b, n: look.n, img: look.b === 'custom' ? lookImgUrl(look.i) : '', vid: look.b === 'custom' && look.bv ? 'https://cdn.xn--d1ah4a.com/' + look.bv : '' } : null;
            const key = g ? g.b + '|' + g.n + '|' + g.img + '|' + g.vid : '';
            if (key === (bgGuest ? bgGuest.key : '')) return;
            bgGuest = g && Object.assign(g, { key });
            bgName = '';
            if (bgGuest && bgGuest.b === 'custom') {
                const im = document.createElement('img');
                im.src = bgGuest.img; im.alt = '';
                bgMedia.replaceChildren(im);
                if (bgGuest.vid) {
                    const v = document.createElement('video');
                    Object.assign(v, { muted: true, loop: true, autoplay: true, playsInline: true, poster: bgGuest.img });
                    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
                    v.addEventListener('error', () => { if (v.isConnected) v.replaceWith(im); }, { once: true });
                    v.src = bgGuest.vid;
                    bgMedia.replaceChildren(v);
                }
                bgMedia._guest = true;
            } else if (bgMedia._guest) { bgMedia._guest = false; bgMedia.replaceChildren(); }
            updateBackgroundVisibility();
        }
        function updateBackgroundVisibility() {
            const custom = effBg() === 'custom';
            if (custom && backgroundEnabled && introOn) {
                if (!updateBackgroundVisibility._wait) {
                    updateBackgroundVisibility._wait = true;
                    document.addEventListener('vp-intro-done', () => { updateBackgroundVisibility._wait = false; updateBackgroundVisibility(); }, { once: true });
                }
                canvas.classList.add('vp-bg-off');
                return;
            }
            canvas.classList.toggle('vp-bg-off', !backgroundEnabled || custom);
            bgMedia.classList.toggle('vp-bg-off', !backgroundEnabled || !custom);
            const v = bgMedia.querySelector('video');
            if (v) { if (backgroundEnabled && custom) v.play().catch(() => { }); else v.pause(); }
            if (backgroundEnabled && custom && !bgMedia.firstChild) showBgMedia();
        }
        updateBackgroundVisibility();
        const ctx = canvas.getContext('2d');
        let W = 0, H = 0;
        let bg = null, bgName = '';
        const mouse = { x: -1e4, y: -1e4 };
        let canvasRect = { left: 0, top: 0, width: 1, height: 1 };
        addEventListener('pointermove', e => {
            mouse.x = (e.clientX - canvasRect.left) * W / canvasRect.width;
            mouse.y = (e.clientY - canvasRect.top) * H / canvasRect.height;
        }, { passive: true });
        document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });

        function resizeCanvas() {
            const r = canvas.getBoundingClientRect();
            const w = Math.round(r.width) || innerWidth, h = Math.round(r.height) || innerHeight;
            canvasRect = { left: r.left, top: r.top, width: r.width || w, height: r.height || h };
            if (w === W && h === H) return;
            canvas.width = W = w;
            canvas.height = H = h;
            bgName = '';
        }
        const rand = (a, b) => a + Math.random() * (b - a);
        const hsla = (h, s, l, a) => `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
        function theme() {
            const key = bgGuest ? bgGuest.n : currentStyle;
            if (key === 'rainbow') return { h: globalHue, s: 100 };
            const st = nickStyles[key] || nickStyles[currentStyle];
            return { h: st.matrixHue || 210, s: st.matrixSat ?? 100 };
        }

        const spriteCache = new Map();
        function sprite(kind, h, s, l) {
            const key = kind + Math.round(h) + ',' + Math.round(s) + ',' + Math.round(l);
            let c = spriteCache.get(key);
            if (c) return c;
            if (spriteCache.size > 400) spriteCache.clear();
            c = document.createElement('canvas');
            const g = c.getContext('2d');
            if (kind === 'curtain') {
                c.width = 1; c.height = 128;
                const grad = g.createLinearGradient(0, 0, 0, 128);
                grad.addColorStop(0, hsla(h, s, l, 0));
                grad.addColorStop(0.55, hsla(h, s, l, 0.3));
                grad.addColorStop(0.9, hsla(h, s, l + 10, 1));
                grad.addColorStop(1, hsla(h, s, l, 0));
                g.fillStyle = grad;
                g.fillRect(0, 0, 1, 128);
            } else {
                c.width = c.height = 64;
                const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
                const stops = kind === 'disc'
                    ? [[0, 0.5], [0.72, 0.6], [0.86, 0.3], [1, 0]]
                    : [[0, 1], [0.35, 0.4], [0.7, 0.08], [1, 0]];
                stops.forEach(([o, a]) => grad.addColorStop(o, hsla(h, s, l, a)));
                g.fillStyle = grad;
                g.fillRect(0, 0, 64, 64);
            }
            spriteCache.set(key, c);
            return c;
        }
        function drawSprite(kind, x, y, r, h, s, l, a) {
            ctx.globalAlpha = Math.max(0, Math.min(1, a));
            ctx.drawImage(sprite(kind, h, s, l), x - r, y - r, r * 2, r * 2);
            ctx.globalAlpha = 1;
        }
        let fadeAcc = 0;
        function fadeOut(k, dt) {
            fadeAcc += dt;
            const a = 1 - Math.pow(1 - k, fadeAcc);
            if (a < 0.08) return;
            fadeAcc = 0;
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = `rgba(0, 0, 0, ${a})`;
            ctx.fillRect(0, 0, W, H);
            ctx.globalCompositeOperation = 'source-over';
        }

        const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        const WAVES = [
            { amp1: 100, freq1: 0.008, speed1: 0.4, amp2: 50, freq2: 0.018, speed2: 0.7, amp3: 70, freq3: 0.004, speed3: 0.25, alpha: 0.45, offset: 0, dh: 0, dl: 15 },
            { amp1: 80, freq1: 0.009, speed1: 0.5, amp2: 40, freq2: 0.020, speed2: 0.8, amp3: 60, freq3: 0.005, speed3: 0.3, alpha: 0.35, offset: 1.5, dh: 15, dl: 10 },
            { amp1: 60, freq1: 0.010, speed1: 0.6, amp2: 30, freq2: 0.022, speed2: 0.9, amp3: 50, freq3: 0.006, speed3: 0.35, alpha: 0.28, offset: 3.0, dh: -15, dl: 5 },
            { amp1: 40, freq1: 0.011, speed1: 0.7, amp2: 20, freq2: 0.025, speed2: 1.0, amp3: 30, freq3: 0.007, speed3: 0.4, alpha: 0.20, offset: 4.5, dh: 30, dl: 0 }
        ];

        const BACKGROUNDS = {
            matrix: {
                opacity: 0.2,
                init() {
                    const size = 15;
                    return { size, cols: Array.from({ length: Math.ceil(W / size) }, () => ({ y: rand(-H / size, H / size), v: rand(0.35, 1), prev: null })) };
                },
                draw(s, dt, { h, s: sat }) {
                    fadeOut(0.06, dt);
                    ctx.font = `${s.size}px monospace`;
                    ctx.textBaseline = 'top';
                    s.cols.forEach((c, i) => {
                        const cell = Math.floor(c.y);
                        c.y += c.v * dt;
                        const next = Math.floor(c.y);
                        if (next !== cell) {
                            const x = i * s.size;
                            if (c.prev) {
                                ctx.clearRect(x, c.prev.y * s.size, s.size, s.size);
                                ctx.fillStyle = hsla(h + rand(-12, 12), sat, 45, 1);
                                ctx.fillText(c.prev.ch, x, c.prev.y * s.size);
                            }
                            const ch = MATRIX_CHARS[Math.random() * MATRIX_CHARS.length | 0];
                            ctx.fillStyle = hsla(h, Math.min(sat, 50), 88, 1);
                            ctx.fillText(ch, x, next * s.size);
                            c.prev = { ch, y: next };
                        }
                        if (c.y * s.size > H && Math.random() < 0.03 * dt) Object.assign(c, { y: rand(-15, 0), v: rand(0.35, 1), prev: null });
                    });
                }
            },
            stars: {
                opacity: 0.4,
                init() {
                    const n = Math.min(600, Math.floor(W * H / 3500));
                    return {
                        stars: Array.from({ length: n }, () => {
                            const d = Math.random() ** 2;
                            return { x: rand(0, W), y: rand(0, H), d, r: 0.5 + d * 1.8, ph: rand(0, 6.3), sp: rand(0.03, 0.1) };
                        }),
                        shoot: null, wait: rand(40, 120)
                    };
                },
                draw(s, dt, { h, s: sat }) {
                    ctx.clearRect(0, 0, W, H);
                    const S = Math.min(100, sat * 1.2);
                    const packs = Array.from({ length: 8 }, () => new Path2D());
                    for (const st of s.stars) {
                        st.ph += st.sp * dt;
                        st.x -= (0.03 + st.d * 0.3) * dt;
                        if (st.x < -5) { st.x = W + 5; st.y = rand(0, H); }
                        const a = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(st.ph));
                        if (st.r > 1.4) drawSprite('glow', st.x, st.y, st.r * 7, h, S, 70, a * 0.3);
                        const pack = packs[Math.min(7, a * 8 | 0)];
                        pack.moveTo(st.x + st.r, st.y);
                        pack.arc(st.x, st.y, st.r, 0, Math.PI * 2);
                    }
                    ctx.fillStyle = hsla(h, S, 82, 1);
                    packs.forEach((pack, i) => { ctx.globalAlpha = (i + 0.5) / 8; ctx.fill(pack); });
                    ctx.globalAlpha = 1;
                    s.wait -= dt;
                    if (!s.shoot && s.wait <= 0) {
                        s.shoot = { x: rand(W * 0.3, W * 1.05), y: rand(-20, H * 0.35), vx: -rand(16, 24), vy: rand(6, 10), life: 1 };
                        s.wait = rand(80, 220);
                    }
                    const p = s.shoot;
                    if (p) {
                        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.035 * dt;
                        const tx = p.x - p.vx * 7, ty = p.y - p.vy * 7;
                        const tail = ctx.createLinearGradient(p.x, p.y, tx, ty);
                        tail.addColorStop(0, hsla(h, S * 0.5, 95, Math.max(0, p.life)));
                        tail.addColorStop(1, hsla(h, S, 70, 0));
                        ctx.strokeStyle = tail;
                        ctx.lineWidth = 2;
                        ctx.lineCap = 'round';
                        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(tx, ty); ctx.stroke();
                        drawSprite('glow', p.x, p.y, 10, h, S * 0.5, 90, p.life * 0.8);
                        if (p.life <= 0 || p.x < -200 || p.y > H + 200) s.shoot = null;
                    }
                }
            },
            particles: {
                opacity: 0.35,
                init() {
                    const n = Math.min(130, Math.floor(W * H / 14000));
                    return { ps: Array.from({ length: n }, () => ({ x: rand(0, W), y: rand(0, H), vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.6), r: rand(1.2, 3), ph: rand(0, 6.3) })) };
                },
                draw(s, dt, { h, s: sat }) {
                    ctx.clearRect(0, 0, W, H);
                    const S = Math.min(100, sat * 1.4), link = Math.max(110, Math.min(170, Math.min(W, H) * 0.14)), link2 = link * link;
                    const ps = s.ps;
                    for (const p of ps) {
                        const dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
                        if (d2 < 48000 && d2 > 1) {
                            const d = Math.sqrt(d2), f = (d < 90 ? -1.2 : 0.3) / d;
                            p.vx += dx * f * 0.05 * dt; p.vy += dy * f * 0.05 * dt;
                        }
                        const sp = Math.hypot(p.vx, p.vy);
                        if (sp > 1.3) { p.vx *= 1.3 / sp; p.vy *= 1.3 / sp; }
                        if (sp < 0.15) { p.vx += rand(-0.05, 0.05); p.vy += rand(-0.05, 0.05); }
                        p.x += p.vx * dt; p.y += p.vy * dt; p.ph += 0.05 * dt;
                        if (p.x < 0 || p.x > W) { p.vx *= -1; p.x = Math.max(0, Math.min(W, p.x)); }
                        if (p.y < 0 || p.y > H) { p.vy *= -1; p.y = Math.max(0, Math.min(H, p.y)); }
                    }
                    const lines = Array.from({ length: 6 }, () => new Path2D());
                    const add = (a, x1, y1, x2, y2) => { const l = lines[Math.min(5, a * 6 | 0)]; l.moveTo(x1, y1); l.lineTo(x2, y2); };
                    for (let i = 0; i < ps.length; i++) {
                        const a = ps[i];
                        for (let j = i + 1; j < ps.length; j++) {
                            const b = ps[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
                            if (d2 < link2) add(0.45 * (1 - Math.sqrt(d2) / link) / 0.7, a.x, a.y, b.x, b.y);
                        }
                        const mx = mouse.x - a.x, my = mouse.y - a.y, m2 = mx * mx + my * my;
                        if (m2 < link2 * 1.7) add(1 - Math.sqrt(m2 / (link2 * 1.7)), a.x, a.y, mouse.x, mouse.y);
                    }
                    ctx.strokeStyle = hsla(h, S, 75, 1);
                    ctx.lineWidth = 1;
                    lines.forEach((l, i) => { ctx.globalAlpha = 0.7 * (i + 0.5) / 6; ctx.stroke(l); });
                    ctx.globalAlpha = 1;
                    const dots = new Path2D();
                    for (const p of ps) {
                        const r = p.r * (0.85 + 0.15 * Math.sin(p.ph));
                        drawSprite('glow', p.x, p.y, r * 5, h, S, 70, 0.4);
                        dots.moveTo(p.x + r, p.y);
                        dots.arc(p.x, p.y, r, 0, Math.PI * 2);
                    }
                    ctx.fillStyle = hsla(h, S, 85, 1);
                    ctx.fill(dots);
                }
            },
            waves: {
                opacity: 0.3,
                init() { return { time: rand(0, 50) }; },
                draw(s, dt, { h, s: sat }) {
                    ctx.clearRect(0, 0, W, H);
                    s.time += 0.01 * dt;
                    const S = Math.min(100, sat * 1.3), L = 75;
                    const k = Math.min(200, Math.max(80, H * 0.15)) / 100, mid = H * 0.5;
                    WAVES.forEach((c, w) => {
                        ctx.beginPath();
                        for (let x = 0; x <= W; x += 3) {
                            const y = mid + (Math.sin(x * c.freq1 + s.time * c.speed1 + c.offset) * c.amp1
                                + Math.sin(x * c.freq2 + s.time * c.speed2 + c.offset * 0.7) * c.amp2
                                + Math.sin(x * c.freq3 + s.time * c.speed3 + c.offset * 2) * c.amp3) * k;
                            x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
                        }
                        const color = hsla(h + c.dh, S, L + c.dl, 1);
                        const width = 2 + w * 0.5;
                        ctx.strokeStyle = color;
                        ctx.globalAlpha = c.alpha * 0.14;
                        ctx.lineWidth = width + 10 + w * 3;
                        ctx.stroke();
                        ctx.globalAlpha = c.alpha;
                        ctx.lineWidth = width;
                        ctx.stroke();
                        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
                        const fill = ctx.createLinearGradient(0, mid - 150 * k, 0, H);
                        fill.addColorStop(0, hsla(h + c.dh, S, L, 0.06));
                        fill.addColorStop(1, hsla(h + c.dh, S, L, 0));
                        ctx.globalAlpha = 1;
                        ctx.fillStyle = fill;
                        ctx.fill();
                    });
                }
            },
            aurora: {
                opacity: 0.45,
                init() { return { t: rand(0, 100) }; },
                draw(s, dt, { h, s: sat }) {
                    ctx.clearRect(0, 0, W, H);
                    s.t += 0.012 * dt;
                    const S = Math.min(100, sat * 1.15), step = 6;
                    ctx.globalCompositeOperation = 'lighter';
                    [
                        { base: 0.64, amp: 0.08, len: 0.3, dh: 0, a: 0.45, f: 0.0021, sp: 1 },
                        { base: 0.72, amp: 0.06, len: 0.24, dh: 45, a: 0.3, f: 0.0016, sp: -0.7 },
                        { base: 0.58, amp: 0.05, len: 0.2, dh: -40, a: 0.28, f: 0.0027, sp: 0.55 }
                    ].forEach(b => {
                        const img = sprite('curtain', h + b.dh, S, 60);
                        for (let x = 0; x < W; x += step) {
                            const y = H * (b.base + b.amp * Math.sin(x * b.f + s.t * b.sp) + 0.025 * Math.sin(x * b.f * 3.1 - s.t * 1.7 * b.sp));
                            const len = H * b.len * (0.6 + 0.4 * Math.sin(x * 0.011 + s.t * 2.3 * b.sp));
                            ctx.globalAlpha = b.a * (0.5 + 0.5 * Math.sin(x * 0.004 - s.t * 1.3 + b.dh));
                            ctx.drawImage(img, x, y - len, step + 1, len);
                        }
                    });
                    ctx.globalAlpha = 1;
                    ctx.globalCompositeOperation = 'source-over';
                }
            },
            bokeh: {
                opacity: 0.4,
                init() {
                    const n = Math.min(45, Math.floor(W * H / 38000));
                    return { b: Array.from({ length: n }, () => this.spawn(rand(0, H))) };
                },
                spawn(y) {
                    const d = Math.random();
                    return { x: rand(0, W), y, d, r: 12 + d * 80, vy: -(0.12 + d * 0.45), ph: rand(0, 6.3), dh: rand(-30, 30), a: 0.5 - d * 0.28 };
                },
                draw(s, dt, { h, s: sat }) {
                    ctx.clearRect(0, 0, W, H);
                    const S = Math.min(100, sat * 1.2);
                    ctx.globalCompositeOperation = 'lighter';
                    s.b.forEach((p, i) => {
                        p.y += p.vy * dt;
                        p.ph += 0.02 * dt;
                        p.x += Math.sin(p.ph) * 0.25 * dt;
                        if (p.y < -p.r) s.b[i] = this.spawn(H + p.r);
                        drawSprite('disc', p.x, p.y, p.r, h + p.dh, S, 62, p.a * (0.75 + 0.25 * Math.sin(p.ph * 1.7)));
                    });
                    ctx.globalCompositeOperation = 'source-over';
                }
            },
            grid: {
                opacity: 0.4,
                init() { return { z: 0 }; },
                draw(s, dt, { h, s: sat }) {
                    ctx.clearRect(0, 0, W, H);
                    s.z = (s.z + 0.012 * dt) % 1;
                    const hor = H * 0.6, S = Math.min(100, Math.max(sat, 25) * 1.1), cx = W / 2;
                    const R = Math.min(W, H) * 0.18, cy = hor - R * 0.6;
                    drawSprite('glow', cx, cy, R * 2.4, h + 20, S, 60, 0.35);
                    const sun = ctx.createLinearGradient(0, cy - R, 0, cy + R);
                    sun.addColorStop(0, hsla(h + 45, S, 72, 0.95));
                    sun.addColorStop(1, hsla(h - 25, S, 55, 0.95));
                    ctx.fillStyle = sun;
                    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
                    ctx.globalCompositeOperation = 'destination-out';
                    for (let i = 0; i < 6; i++) ctx.fillRect(cx - R, cy + R * (0.02 + i * 0.105), 2 * R, 1.5 + i * 1.2);
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.clearRect(0, hor, W, H - hor);
                    const floor = ctx.createLinearGradient(0, hor, 0, H);
                    floor.addColorStop(0, hsla(h, S, 45, 0.22));
                    floor.addColorStop(1, hsla(h, S, 30, 0));
                    ctx.fillStyle = floor;
                    ctx.fillRect(0, hor, W, H - hor);
                    ctx.strokeStyle = hsla(h, S, 68, 1);
                    ctx.lineWidth = 1.2;
                    const n = 18;
                    for (let i = -n; i <= n; i++) {
                        ctx.globalAlpha = 0.55;
                        ctx.beginPath(); ctx.moveTo(cx + i * 6, hor); ctx.lineTo(cx + i * (W / n) * 1.4, H); ctx.stroke();
                    }
                    for (let i = 0; i < 18; i++) {
                        const d = i + 1 - s.z, y = hor + (H - hor) * 0.9 / d;
                        if (y > H) continue;
                        ctx.globalAlpha = Math.min(0.8, 1.2 / d);
                        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
                    }
                    ctx.globalAlpha = 1;
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = hsla(h + 20, S, 75, 0.9);
                    ctx.beginPath(); ctx.moveTo(0, hor); ctx.lineTo(W, hor); ctx.stroke();
                    const haze = ctx.createLinearGradient(0, hor, 0, hor + (H - hor) * 0.3);
                    haze.addColorStop(0, 'rgba(0, 0, 0, 1)');
                    haze.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.fillStyle = haze;
                    ctx.fillRect(0, hor + 1, W, (H - hor) * 0.3);
                    ctx.globalCompositeOperation = 'source-over';
                }
            },
            snow: {
                opacity: 0.5,
                init() {
                    const n = Math.min(260, Math.floor(W * H / 6000));
                    return { f: Array.from({ length: n }, () => this.spawn(rand(0, H))), windT: rand(0, 100) };
                },
                spawn(y) {
                    const d = Math.random() ** 1.5;
                    return { x: rand(0, W), y, d, r: 0.8 + d * 2.6, ph: rand(0, 6.3) };
                },
                draw(s, dt, { h, s: sat }) {
                    ctx.clearRect(0, 0, W, H);
                    s.windT += 0.004 * dt;
                    const wind = Math.sin(s.windT) * 0.6 + Math.sin(s.windT * 2.7) * 0.3;
                    const S = sat * 0.4;
                    const packs = Array.from({ length: 4 }, () => new Path2D());
                    s.f.forEach((p, i) => {
                        p.ph += 0.03 * dt;
                        p.y += (0.35 + p.d * 1.4) * dt;
                        p.x += (wind * (0.4 + p.d) + Math.sin(p.ph) * 0.3) * dt;
                        if (p.y > H + 5) { s.f[i] = this.spawn(-5); return; }
                        if (p.x > W + 5) p.x = -5; else if (p.x < -5) p.x = W + 5;
                        if (p.d > 0.6) drawSprite('glow', p.x, p.y, p.r * 3.5, h, S, 85, 0.45);
                        const pack = packs[Math.min(3, p.d * 4 | 0)];
                        pack.moveTo(p.x + p.r, p.y);
                        pack.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    });
                    ctx.fillStyle = hsla(h, S, 90, 1);
                    packs.forEach((pack, i) => { ctx.globalAlpha = 0.45 + (i + 0.5) / 4 * 0.55; ctx.fill(pack); });
                    ctx.globalAlpha = 1;
                }
            }
        };

        function drawBackground(dt = 1) {
            const cur = effBg();
            if (cur === 'custom') return;
            const def = BACKGROUNDS[cur] || BACKGROUNDS.matrix;
            if (bgName !== cur) {
                bgName = cur;
                ctx.clearRect(0, 0, W, H);
                bg = def.init();
                canvas.style.opacity = def.opacity;
            }
            def.draw(bg, dt, theme());
        }

        const paintStyle = document.createElement('style');
        paintStyle.textContent = '.vp-my-nick {} .vp-my-nick-box {} .my-avatar-glow {} article.vp-post:hover {} '
            + '.vp-nav-link.vp-active .vp-nav-icon {} .vp-tabs > div:empty {} :root {} ::selection {}';
        document.head.appendChild(paintStyle);
        let paintKey = '', paintRootKey = '';


        function paint() {
            const style = nickStyles[currentStyle];
            const rainbow = currentStyle === 'rainbow';
            const dark = isDarkTheme();
            const h = Math.round(globalHue);
            const key = [currentStyle, rainbow ? h : '', dark, nickGlowEnabled, avatarGlowEnabled, postBorderEnabled, neonEnabled].join();
            const nickGlowOn = neonEnabled && nickGlowEnabled, avatarGlowOn = neonEnabled && avatarGlowEnabled;
            if (key === paintKey) return;
            paintKey = key;
            const [nick, nickBox, avatar, post, navIcon, tab, root, selection] = [...paintStyle.sheet.cssRules].map(r => r.style);
            const hsl = `hsl(${h}, 100%, ${dark ? 55 : 42}%)`;
            if (rainbow) {
                nick.cssText = `color: ${hsl} !important;${neonEnabled ? ` text-shadow: 0 0 5px ${hsl} !important;` : ''}`;
            } else if (style.nickCss) {
                nick.cssText = style.nickCss(dark);
            } else {
                const gradient = dark ? style.gradientDark || style.gradientLight
                    : currentStyle === 'white' ? 'linear-gradient(270deg, #1a1a1a, #4a4a4a, #262626)' : style.gradientLight;
                nick.cssText = `background: ${gradient} !important; -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important;`;
            }
            const glow = rainbow ? `drop-shadow(0 0 6px ${hsl}) drop-shadow(0 0 12px ${hsl})`
                : dark ? style.glow
                    : currentStyle === 'white' ? 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.25))'
                        : `brightness(0.8) saturate(1.3) drop-shadow(0 0 5px color-mix(in srgb, ${accentOf(style)} 55%, transparent))`;
            nickBox.cssText = !nickGlowOn ? (dark || rainbow ? '' : 'filter: brightness(0.8) saturate(1.3) !important;')
                : `filter: ${glow} !important;`;
            const ah = style.avatarHue || 210, as = style.avatarSat ?? 100;
            avatar.cssText = !avatarGlowOn ? '' : `filter: ${rainbow
                ? `drop-shadow(0 0 5px ${hsl}) drop-shadow(0 0 12px ${hsl})`
                : `drop-shadow(0 0 3px hsl(${ah}, ${as}%, 60%)) drop-shadow(0 0 6px hsl(${ah}, ${as}%, 60%))`} !important;`;
            post.cssText = '';
            document.documentElement.classList.toggle('vp-post-hl', neonEnabled && postBorderEnabled);

            const accent = rainbow ? `hsl(${h}, 100%, ${dark ? 62 : 45}%)`
                : dark ? accentOf(style)
                    : currentStyle === 'white' ? '#1a1a1a' : `color-mix(in srgb, ${accentOf(style)} 78%, #000)`;
            navIcon.cssText = `color: ${accent} !important;${neonEnabled ? ` filter: drop-shadow(0 0 6px ${accent}) !important;` : ''}`;
            tab.cssText = `box-shadow: inset 0 0 0 1px ${accent}${neonEnabled ? `, 0 0 14px -4px ${accent}` : ''} !important;`;
            const rootKey = (rainbow ? 'r' + Math.round(h / 30) : accent) + dark;
            if (rootKey !== paintRootKey) {
                paintRootKey = rootKey;
                const slow = rainbow ? `hsl(${Math.round(h / 30) * 30}, 100%, ${dark ? 62 : 45}%)` : accent;
                root.cssText = `--vp-accent: ${slow}; --vp-on-accent: ${onAccentFor(slow, dark)}; scrollbar-color: color-mix(in srgb, ${slow} 55%, transparent) transparent;`;
                selection.cssText = `background: color-mix(in srgb, ${slow} 45%, transparent) !important;`;
            }
        }
        const lookStyleEl = document.createElement('style');
        (function buildLookCss() {
            const out = ['@keyframes vp-look-rb { 0%, 100% { color: hsl(0, 100%, 58%); } 17% { color: hsl(60, 100%, 50%); } 33% { color: hsl(120, 100%, 45%); }'
                + ' 50% { color: hsl(180, 100%, 45%); } 67% { color: hsl(240, 100%, 66%); } 83% { color: hsl(300, 100%, 62%); } }'];
            for (const [key, st] of Object.entries(nickStyles)) {
                for (const dark of [true, false]) {
                    const th = dark ? 'html.vp-looks:not(.vp-light) ' : 'html.vp-looks.vp-light ';
                    let nick, glow;
                    if (key === 'rainbow') {
                        nick = 'animation: vp-look-rb 8s linear infinite !important; background: none !important; -webkit-text-fill-color: currentColor !important;';
                        glow = 'drop-shadow(0 0 6px hsl(300, 100%, 60%)) drop-shadow(0 0 10px hsl(200, 100%, 60%))';
                    } else {
                        if (st.nickCss) nick = st.nickCss(dark);
                        else {
                            const g = dark ? st.gradientDark || st.gradientLight : key === 'white' ? 'linear-gradient(270deg, #1a1a1a, #4a4a4a, #262626)' : st.gradientLight;
                            nick = `background: ${g} !important; -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important;`;
                        }
                        glow = dark ? st.glow : key === 'white' ? 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.25))'
                            : `brightness(0.8) saturate(1.3) drop-shadow(0 0 5px color-mix(in srgb, ${accentOf(st)} 55%, transparent))`;
                    }
                    out.push(`${th}[data-vp-look="${key}"] { ${nick} }`);
                    if (glow) out.push(`${th}[data-vp-look-glow="${key}"] { filter: ${glow} !important; }`);
                }
                const ah = st.avatarHue || 210, as = st.avatarSat ?? 100;
                out.push(key === 'rainbow'
                    ? `html.vp-looks [data-vp-look-av="${key}"] { filter: drop-shadow(0 0 5px hsl(300, 100%, 60%)) drop-shadow(0 0 10px hsl(190, 100%, 55%)) !important; }`
                    : `html.vp-looks [data-vp-look-av="${key}"] { filter: drop-shadow(0 0 3px hsl(${ah}, ${as}%, 60%)) drop-shadow(0 0 6px hsl(${ah}, ${as}%, 60%)) !important; }`);
            }
            out.push('html.vp-no-neon .vp-my-nick, html.vp-no-neon [data-vp-look], html.vp-no-neon [data-vp-look] * { text-shadow: none !important; }',
                'html.vp-no-neon.vp-no-neon [data-vp-look-glow], html.vp-no-neon.vp-no-neon [data-vp-look-av] { filter: none !important; }',
                'html.vp-no-neon .vp-gal-ind { box-shadow: inset 0 0 0 1px var(--vp-accent) !important; }',
                'html.vp-no-neon .vp-nav-blob { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 32%, transparent) !important; }',
                'html.vp-no-neon .vp-portal { animation: none !important; filter: none !important; }');
            lookStyleEl.textContent = out.join('\n');
            document.head.appendChild(lookStyleEl);
        })();
        const LOOK_RE = /^ITDXL1 (.+)$/;
        const VER_RE = /^\d{1,3}(\.\d{1,4}){1,4}$/;
        const MOD_VER = (() => { try { const v = GM_info.script.version; return VER_RE.test(v) ? v : ''; } catch (e) { return ''; } })();
        const verCmp = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };
        function parseLook(t) {
            const m = openText(t).match(LOOK_RE);
            if (!m) return null;
            const o = {};
            for (const tok of m[1].split(/\s+/)) { const i = tok.indexOf('='); if (i > 0) o[tok.slice(0, i)] = tok.slice(i + 1); }
            if (!nickStyles[o.n]) return null;
            const look = { n: o.n, b: '-', g: /^[01]{2}$/.test(o.g || '') ? o.g : '11' };
            if (o.b === 'custom' ? /^[0-4][0-9a-f]{32}$/.test(o.i || '') : BACKGROUNDS[o.b]) look.b = o.b;
            if (look.b === 'custom') look.i = o.i;
            if (look.b === 'custom' && BANNER_VIDEO_RE.test(o.bv || '')) look.bv = o.bv;
            if (BANNER_VIDEO_RE.test(o.v || '')) look.v = o.v;
            if (VER_RE.test(o.ver || '')) look.ver = o.ver;
            if (/^\d{5,6}$/.test(o.t || '')) look.t = +o.t;
            return look;
        }
        function lookImgUrl(ref) {
            const h = ref.slice(1);
            return `https://cdn.xn--d1ah4a.com/images/${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}.${MSG_IMG_EXT[+ref[0]] || 'png'}`;
        }
        function videoFrame(blob) {
            return new Promise((ok, no) => {
                const v = document.createElement('video'), u = URL.createObjectURL(blob);
                v.muted = true; v.preload = 'auto'; v.src = u;
                v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 2) / 2); };
                v.onseeked = () => {
                    const c = document.createElement('canvas');
                    c.width = v.videoWidth; c.height = v.videoHeight;
                    c.getContext('2d').drawImage(v, 0, 0);
                    URL.revokeObjectURL(u);
                    c.toBlob(b => b ? ok(new File([b], 'bg.jpg', { type: 'image/jpeg' })) : no(new Error('кадр видео')), 'image/jpeg', 0.85);
                };
                v.onerror = () => { URL.revokeObjectURL(u); no(new Error('видео фона')); };
            });
        }
        async function customBgCdn() {
            const blob = await bgFile().catch(() => null);
            if (!blob) return '';
            const sig = blob.size + ':' + blob.type;
            const saved = GM_getValue(acctKey('vp_bg_cdn'), null);
            const video = /^video\//.test(blob.type);
            if (saved && saved.sig === sig && saved.ref && (!video || 'vid' in saved || Date.now() - (saved.vidFail || 0) < 36e5)) return saved;
            let ref = saved && saved.sig === sig && saved.ref;
            if (!ref) {
                const img = await msgUploadImage(video ? await videoFrame(blob) : new File([blob], 'bg', { type: blob.type }));
                ref = img.ext + img.id.replace(/-/g, '');
            }
            let vid = '';
            if (video && blob.size <= VIDEO_UP_MAX) vid = await uploadVideo(new File([blob], 'bg.' + (blob.type.split('/')[1] || 'mp4').replace('quicktime', 'mov'), { type: blob.type })).catch(e => { logErr('видео фона на сервер', e); return null; });
            const out = vid === null ? { sig, ref, vidFail: Date.now() } : { sig, ref, vid };
            GM_setValue(acctKey('vp_bg_cdn'), out);
            return out;
        }
        const VIDEO_UP_MAX = 30 * 1024 * 1024;
        async function uploadVideo(f) {
            const fd = new FormData();
            fd.append('file', f, f.name || 'video.mp4');
            const res = await api('/api/files/upload', { method: 'POST', body: fd });
            const j = await res.json().catch(() => null), d = j && (j.data || j);
            if (!res.ok) throw new Error((d && (d.error && d.error.message || d.message)) || 'сайт ответил ' + res.status);
            const m = String(d && d.url || '').match(/^https:\/\/cdn\.xn--d1ah4a\.com\/(.+)$/);
            if (!m || !BANNER_VIDEO_RE.test(m[1])) throw new Error('сайт вернул не видео: ' + String(d && d.url || '—').slice(0, 90));
            return m[1];
        }
        let lookBusy = false, lookSent = '';
        async function lookVer() {
            if (!MOD_VER) return '';
            const c = GM_getValue('vp_vx', null);
            if (c && c.v === MOD_VER && c.x) return c.x;
            try { const x = await ownerSeal(new TextEncoder().encode(MOD_VER)); GM_setValue('vp_vx', { v: MOD_VER, x }); return x; }
            catch (e) { logErr('версия', e); return ''; }
        }
        async function publishLook() {
            const myId = meData && meData.id;
            if (!myId || lookBusy) return;
            lookBusy = true;
            try {
                const b = backgroundEnabled ? backgroundStyle : '-';
                const today = Math.floor(srvNow() / 864e5), was = GM_getValue(acctKey('vp_look_day'), 0), day = today - was < 7 && today >= was ? was : today;
                let img = '', bv = '';
                if (b === 'custom') ({ ref: img = '', vid: bv = '' } = await customBgCdn().then(x => x || {}).catch(e => { logErr('свой фон на сервер', e); return {}; }));
                const text = `ITDXL1 n=${currentStyle} b=${b === 'custom' && !img ? '-' : b} g=${nickGlowEnabled ? 1 : 0}${avatarGlowEnabled ? 1 : 0}` + (img ? ' i=' + img : '') + (img && bv ? ' bv=' + bv : '') + (bannerVideoOwn() ? ' v=' + bannerVideoOwn() : '') + await lookVer().then(x => x ? ' vx=' + x : '') + ' t=' + day;
                if (text === lookSent) return;
                const all = await loadVerificationComments();
                const mine = all.find(c => c.author && c.author.id === myId && LOOK_RE.test(openText(c.content)));
                if (mine && openText(mine.content) === text && String(mine.content).startsWith('ITDXE ')) { lookSent = text; GM_setValue(acctKey('vp_look_day'), day); return; }
                const content = sealText(text);
                const res = mine
                    ? await editComment(mine.id, content)
                    : await sendComment(VERIFICATION_POST_ID, content);
                if (res.ok) { lookSent = text; GM_setValue(acctKey('vp_look_day'), day); if (day !== was) checkAllComments(true); }
            } catch (e) { logErr('стиль', e); } finally { lookBusy = false; }
        }
        let accentProbe = null;
        function onAccentFor(color, dark) {
            try {
                if (!accentProbe) { accentProbe = document.createElement('i'); accentProbe.style.display = 'none'; }
                if (!accentProbe.isConnected) (document.body || document.documentElement).appendChild(accentProbe);
                accentProbe.style.color = '';
                accentProbe.style.color = color;
                const c = getComputedStyle(accentProbe).color, n = (c.match(/[\d.]+/g) || []).map(Number);
                if (n.length < 3) return dark ? '#0b0b0f' : '#fff';
                const k = /^color\(/.test(c) ? 1 : 1 / 255;
                const lin = v => { v *= k; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
                const L = 0.2126 * lin(n[0]) + 0.7152 * lin(n[1]) + 0.0722 * lin(n[2]);
                return (L + 0.05) / 0.05 >= 1.05 / (L + 0.05) ? '#0b0b0f' : '#fff';
            } catch (e) { return dark ? '#0b0b0f' : '#fff'; }
        }
        function accentOf(style) {
            if (style.color && style.color.startsWith('#')) return style.color;
            return `hsl(${style.avatarHue || 210}, ${style.avatarSat ?? 100}%, 62%)`;
        }
        function isDarkTheme() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
        function applySiteTheme() {
            document.documentElement.classList.toggle('vp-light', !isDarkTheme());
            rememberSiteTheme();
            paint();
        }
        function rememberSiteTheme() {
            const t = document.documentElement.getAttribute('data-theme');
            if (t && GM_getValue('siteTheme', '') !== (t === 'dark' ? 'dark' : 'light')) GM_setValue('siteTheme', t === 'dark' ? 'dark' : 'light');
        }
        rememberSiteTheme();
        document.documentElement.classList.toggle('vp-light', !isDarkTheme());
        new MutationObserver(applySiteTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        function stepHue(dt = 1) {
            globalHue += colorDirection * 0.8 * dt;
            if (globalHue >= 360) { globalHue = 360; colorDirection = -1; }
            else if (globalHue <= 0) { globalHue = 0; colorDirection = 1; }
        }

        function glowMyAvatar(avatar) {
            if (avatar && avatar.isConnected) avatar.classList.add('my-avatar-glow');
        }
        function markMyNick(nickSpan) {
            nickSpan.classList.add('vp-my-nick');
            const box = nickSpan.closest('.' + SELECTORS.nickContainer);
            if (box) box.classList.add('vp-my-nick-box');
            glowRoom(box || nickSpan);
        }
        const GLOW_ROOM = 60, CLIP_MARGIN = typeof CSS !== 'undefined' && CSS.supports('overflow-clip-margin', '1px');
        function glowRoom(el) {
            for (let p = el, i = 0; p && i < 4 && p !== document.body; p = p.parentElement, i++) {
                if (p.matches('article, .' + SELECTORS.post)) return;
                if (p._vpGlowRoom) continue;
                const cs = getComputedStyle(p);
                if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
                if (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowY === 'auto' || cs.overflowY === 'scroll') continue;
                p._vpGlowRoom = true;
                if (CLIP_MARGIN) {
                    p.style.setProperty('overflow', 'clip', 'important');
                    p.style.setProperty('overflow-clip-margin', GLOW_ROOM + 'px', 'important');
                    continue;
                }
                const px = v => parseFloat(v) || 0, r = 8;
                p.style.setProperty('padding', `${px(cs.paddingTop) + r}px ${px(cs.paddingRight) + r}px ${px(cs.paddingBottom) + r}px ${px(cs.paddingLeft) + r}px`, 'important');
                p.style.setProperty('margin', `${px(cs.marginTop) - r}px ${px(cs.marginRight) - r}px ${px(cs.marginBottom) - r}px ${px(cs.marginLeft) - r}px`, 'important');
            }
        }

        let popup = null;

        let popupHist = false;
        function closePopup(keepHist) {
            if (!popup) return;
            popup.el.remove();
            window.removeEventListener('scroll', placePopup, true);
            window.removeEventListener('resize', placePopup);
            document.removeEventListener('click', clickOutsidePopup, true);
            popup = null;
            if (popupHist && !keepHist) {
                popupHist = false;
                if (history.state && history.state.vpPopup) history.back();
            }
        }
        window.addEventListener('popstate', () => {
            if (!popupHist) return;
            popupHist = false;
            closePopup();
        });
        function placePopup() {
            if (!popup) return;
            const r = popup.btn.getBoundingClientRect();
            if (!popup.btn.isConnected || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) {
                closePopup();
                return;
            }
            const w = popup.el.offsetWidth, h = popup.el.offsetHeight;
            if (popup.el.classList.contains('vp-settings-tabs')) {
                const cx = innerWidth < 600 ? innerWidth / 2 : r.left + r.width / 2;
                popup.el.style.left = Math.max(8, Math.min(cx - w / 2, innerWidth - w - 8)) + 'px';
                const vh = window.visualViewport ? Math.min(innerHeight, visualViewport.height) : innerHeight;
                const fixedH = Math.min(vh - 16, 580);
                popup.el.style.height = popup.el.style.maxHeight = fixedH + 'px';
                popup.el.style.top = Math.max(8, Math.min(r.bottom + 8, vh - fixedH - 8)) + 'px';
                return;
            }
            let left = r.right + 8;
            if (left + w > innerWidth) left = r.left - w - 8;
            popup.el.style.left = Math.max(8, left) + 'px';
            popup.el.style.top = Math.max(8, Math.min(r.top, innerHeight - h - 8)) + 'px';
        }
        function clickOutsidePopup(e) {
            if (popup && !popup.el.contains(e.target) && !popup.btn.contains(e.target)) closePopup();
        }
        function openPopup(btn, el) {
            const same = popup && popup.btn === btn;
            closePopup(!same);
            if (same) return false;
            popup = { el, btn };
            if (!popupHist) {
                history.pushState(Object.assign({}, history.state, { vpPopup: true }), '', location.href);
                popupHist = true;
            }
            el.style.position = 'fixed';
            document.body.appendChild(el);
            placePopup();
            window.addEventListener('scroll', placePopup, true);
            window.addEventListener('resize', placePopup);
            document.addEventListener('click', clickOutsidePopup, true);
            return true;
        }

        function menuOption(icon, label, onPick, active) {
            const option = document.createElement('div');
            option.className = 'nick-style-option' + (active ? ' vp-active' : '');
            const text = document.createElement('span');
            text.textContent = label;
            option.append(icon, text);
            if (active) {
                option.setAttribute('aria-checked', 'true');
                const mark = document.createElement('span');
                mark.className = 'vp-opt-check';
                mark.innerHTML = svgIcon(GLYPH.check, 16);
                option.appendChild(mark);
            }
            option.onclick = (e) => { e.stopPropagation(); onPick(); closePopup(); };
            return option;
        }

        const LOGO_LINKS = [
            ['ТГК', TG_URL, '<path d="M21 4 3 11l6 2m12-9-3 16-9-7m12-9L9 13m0 0v6l3-4"/>'],
            ['ТГ Чат', TG_CHAT_URL, '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>'],
            ['Донат', 'https://donatex.gg/donate/kiwe147', '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>']
        ];
        document.addEventListener('click', e => {
            const a = e.target.closest && e.target.closest(`a[href="${TG_URL}"]`);
            if (!a || !a.querySelector('img, svg')) return;
            e.preventDefault(); e.stopPropagation();
            const menu = document.createElement('div');
            menu.className = 'settings-dropdown vp-logo-menu';
            for (const [label, url, icon] of LOGO_LINKS) {
                const ic = document.createElement('span');
                ic.className = 'vp-opt-icon';
                ic.innerHTML = svgIcon(icon, 18);
                menu.appendChild(menuOption(ic, label, () => window.open(url, '_blank', 'noopener')));
            }
            openPopup(a, menu);
        }, true);

        function getColorDot(styleKey) {
            const style = nickStyles[styleKey];
            const dot = document.createElement('div');
            dot.className = 'style-color-dot';
            if (styleKey === 'rainbow') {
                dot.classList.add('rainbow-dot');
            } else {
                dot.style.background = style.color;
                dot.style.boxShadow = `0 0 6px ${style.color}`;
            }
            return dot;
        }
        const BG_STYLES = {
            matrix: { name: 'Матрица', icon: svgIcon('<path d="M6 3v3M6 9.5v5M6 18v3M12 3v6M12 12.5v2M12 18v3M18 3v2M18 8.5v6M18 18v3"/>') },
            stars: { name: 'Звёзды', icon: svgIcon('<path d="M10 3.5l1.6 3.9 3.9 1.6-3.9 1.6L10 14.5l-1.6-3.9L4.5 9l3.9-1.6z"/><path d="M17.5 13.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>') },
            waves: { name: 'Волны', icon: svgIcon('<path d="M3 8c2.5-3 5-3 7.5 0s5 3 7.5 0M3 13c2.5-3 5-3 7.5 0s5 3 7.5 0M3 18c2.5-3 5-3 7.5 0s5 3 7.5 0"/>') },
            particles: { name: 'Частицы', icon: svgIcon('<circle cx="5" cy="7" r="1.8"/><circle cx="18" cy="5" r="1.8"/><circle cx="12" cy="13" r="1.8"/><circle cx="6" cy="19" r="1.8"/><circle cx="19" cy="17" r="1.8"/><path d="m6.6 8.1 3.9 3.8M16.6 6.2l-3.5 5.2M10.7 14.4l-3.4 3.4M13.6 13.8l3.8 2.4"/>') },
            aurora: { name: 'Сияние', icon: svgIcon('<path d="M3 14c3-5 6-7 9-7s6 2 9 7"/><path d="M6 17c2-3 4-4.5 6-4.5s4 1.5 6 4.5"/><path d="M3 21h18"/>') },
            bokeh: { name: 'Боке', icon: svgIcon('<circle cx="8" cy="9" r="4"/><circle cx="16.5" cy="15.5" r="4.5"/><circle cx="17" cy="6" r="1.5"/>') },
            grid: { name: 'Неон-сетка', icon: svgIcon('<path d="M8 8a4 4 0 0 1 8 0"/><path d="M2 12h20"/><path d="M12 12v9M12 12l-8 9M12 12l8 9M5 17h14"/>') },
            snow: { name: 'Снегопад', icon: svgIcon('<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/>') },
            custom: { name: 'Своя картинка', icon: svgIcon('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>') }
        };
        function renderAutoLikeUsers(list, footer, usersData) {
            const own = n => (usersData[n] && usersData[n].id) === OWNER_ID;
            const users = Object.keys(usersData).sort((a, b) => own(a) ? -1 : own(b) ? 1 : a.localeCompare(b));
            const count = () => { footer.textContent = `Активно: ${Object.keys(autoLikeUsers).length}`; };
            count();
            if (!users.length) {
                list.innerHTML = '<div class="vp-menu-note">Нет пользователей</div>';
                return;
            }
            list.innerHTML = '';
            for (const username of users) {
                const data = usersData[username];
                if (!data) continue;
                const row = document.createElement('div');
                row.className = 'nick-style-option vp-like-row';
                row.innerHTML = `<div class="vp-like-user"><div class="vp-like-avatar"></div><div class="vp-like-names"><span class="vp-like-name"></span><span class="vp-like-login"></span></div></div><div class="toggle-switch"></div>`;
                const av = row.querySelector('.vp-like-avatar'), ava = (data.avatar && (data.avatar.url || data.avatar)) || '👤';
                if (/^https?:|^\//.test(ava)) { const img = document.createElement('img'); img.alt = ''; img.onerror = () => { av.textContent = '👤'; }; img.src = ava; av.appendChild(img); } else av.textContent = ava;
                row.querySelector('.vp-like-name').textContent = (data.displayName || username).slice(0, 20);
                row.querySelector('.vp-like-login').textContent = '@' + username;
                const toggle = row.querySelector('.toggle-switch');
                toggle.classList.toggle('active', !!autoLikeUsers[username]);
                row.onclick = (e) => {
                    e.stopPropagation();
                    if (toggle.classList.toggle('active')) autoLikeUsers[username] = true;
                    else delete autoLikeUsers[username];
                    saveAutoLikeUsers();
                    count();
                };
                list.appendChild(row);
            }
        }
        function applyPostBlurSetting() {
            document.querySelectorAll('.' + SELECTORS.post + '[data-post-colored]').forEach(post => {
                post.removeAttribute('data-post-colored');
                post.classList.remove('vp-emoji-tint');
            });
            if (postBlurEnabled) {
                addBlurBackground();
            } else {
                document.querySelectorAll('[data-blur-bg]').forEach(dropBlur);
            }
            colorizePosts();
        }
        let palsOn = GM_getValue('palsEnabled', false);
        const PALS = { miku: { key: 'palMiku', file: 'miku.webp', r: 800 / 790 }, teto: { key: 'palTeto', file: 'teto.webp', r: 776 / 734 } };
        const PAL_VER = 8;
        const PAL_LOOKS = [
            ['plain', 'Как есть', '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="12" cy="11" r="3"/><path d="M7 20c.8-2.6 2.8-4 5-4s4.2 1.4 5 4"/>'],
            ['neon', 'Неон', '<circle cx="12" cy="10" r="3.5"/><path d="M5.5 20c1-3.3 3.5-5 6.5-5s5.5 1.7 6.5 5"/><path d="M12 2.5v2M4.6 5.6l1.4 1.4M19.4 5.6 18 7"/>'],
            ['dim', 'Под тему', '<circle cx="12" cy="10" r="3.5"/><path d="M5.5 20c1-3.3 3.5-5 6.5-5s5.5 1.7 6.5 5"/><path d="M18 3.5a3 3 0 1 0 2.5 4.5 3.5 3.5 0 0 1-2.5-4.5z"/>']
        ];
        let palsBox = null;
        function palStore(key, blob) {
            return bgDb().then(db => new Promise((ok, no) => {
                const st = db.transaction('files', blob ? 'readwrite' : 'readonly').objectStore('files'), r = blob ? st.put(blob, key) : st.get(key);
                r.onsuccess = () => ok(blob || r.result || null);
                r.onerror = () => no(r.error);
            }));
        }
        function palFetch(url) {
            return new Promise((ok, no) => GM_xmlhttpRequest({
                method: 'GET', url, responseType: 'blob', timeout: 60000,
                onload: r => r.status === 200 && r.response && r.response.size > 1000 ? ok(new Blob([r.response], { type: 'image/webp' })) : no(new Error('персонаж: ' + r.status)),
                onerror: no, ontimeout: no
            }));
        }
        async function palBlob(id) {
            const key = `pal-${id}@${PAL_VER}`;
            const have = await palStore(key).catch(() => null);
            if (have) return have;
            for (const branch of ['claude/github-script-access-ihd9ne', 'main']) {
                const b = await palFetch(`https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/${branch}/assets/${PALS[id].file}`).catch(() => null);
                if (b) { await palStore(key, b).catch(() => { }); return b; }
            }
            return null;
        }
        function palsApply() {
            if (!palsBox) { palsBox = document.createElement('div'); palsBox.className = 'vp-pals'; }
            if (!palsBox.isConnected) document.body.appendChild(palsBox);
            palsNav();
            palsBox.dataset.look = GM_getValue('palLook', 'plain');
            document.documentElement.classList.toggle('vp-pals-r', palsOn && GM_getValue('palMiku', true));
            const imgs = [];
            let fresh = false;
            for (const [id, pal] of Object.entries(PALS)) {
                const want = palsOn && GM_getValue(pal.key, true);
                let img = palsBox.querySelector('.vp-pal-' + id);
                if (!want) { if (img) { URL.revokeObjectURL(img.src); img.remove(); } continue; }
                if (!img) {
                    img = document.createElement('img');
                    img.className = 'vp-pal vp-pal-' + id;
                    img.alt = '';
                    img.style.setProperty('--vp-pal-r', pal.r);
                    palsBox.appendChild(img);
                    fresh = true;
                }
                imgs.push([id, img]);
            }
            if (!fresh) return;
            const gen = palsApply.gen = (palsApply.gen || 0) + 1;
            Promise.all(imgs.map(([id]) => palBlob(id))).then(blobs => {
                if (gen !== palsApply.gen) return;
                imgs.forEach(([, img], i) => {
                    if (!blobs[i] || !img.isConnected) return;
                    if (img.src) URL.revokeObjectURL(img.src);
                    img.src = URL.createObjectURL(blobs[i]);
                });
            }).catch(e => logErr('персонаж', e));
        }
        let palNavEl = null, palNavAt = -1e9;
        function palsNav() {
            if (!palsBox || !palsOn) return;
            if (palNavEl && (!palNavEl.isConnected || palNavEl.getBoundingClientRect().bottom < innerHeight - 200)) palNavEl = null;
            if (!palNavEl && performance.now() - palNavAt > 800) {
                palNavAt = performance.now();
                const nav = document.querySelector('nav.' + SELECTORS.nav) || [...document.querySelectorAll('nav a')].find(a => a.textContent.trim() === 'Лента')?.closest('nav');
                for (let e = nav; e && e !== document.body; e = e.parentElement) {
                    if (getComputedStyle(e).position !== 'fixed') continue;
                    const r = e.getBoundingClientRect();
                    if (r.width >= innerWidth * 0.8 && r.bottom >= innerHeight - 200) palNavEl = e;
                    break;
                }
                if (!palNavEl) for (const d of [3, 24, 48, 80, 120]) {
                    for (let e of document.elementsFromPoint(innerWidth / 2, innerHeight - d)) {
                        for (; e && e !== document.body; e = e.parentElement) {
                            if (getComputedStyle(e).position !== 'fixed') continue;
                            const r = e.getBoundingClientRect();
                            if (r.width >= innerWidth * 0.8 && r.height < 200 && r.bottom >= innerHeight - 4) palNavEl = e;
                            break;
                        }
                        if (palNavEl) break;
                    }
                    if (palNavEl) break;
                }
            }
            const mob = !!palNavEl, size = GM_getValue('palSize', 45), ph = mob ? size * 0.8 + 'vw' : size + 'vh';
            palsBox.classList.toggle('vp-pals-phone', mob);
            if (palsBox.style.getPropertyValue('--vp-pal-h') !== ph) palsBox.style.setProperty('--vp-pal-h', ph);
            const pill = palNavEl && (palNavEl.matches('nav') ? palNavEl : palNavEl.querySelector('nav')) || palNavEl, top = pill ? pill.getBoundingClientRect().top : innerHeight, z = palNavEl ? parseInt(getComputedStyle(palNavEl).zIndex) : NaN;
            const nav = Math.max(0, Math.round(innerHeight - top)) + 'px', zi = z > 1 ? String(Math.min(z - 1, 9000)) : '';
            if (palsBox.style.getPropertyValue('--vp-pal-nav') !== nav) palsBox.style.setProperty('--vp-pal-nav', nav);
            if (palsBox.style.zIndex !== zi) palsBox.style.zIndex = zi;
        }
        onDom(palsNav);
        addEventListener('resize', palsNav);
        function palSizeRow() {
            const row = document.createElement('div');
            row.className = 'settings-option vp-vol-row';
            row.innerHTML = `<span class="vp-setting-label">${ICONS.settings['Мику и Тето'] || ''}<span>Размер</span></span>`
                + `<span class="vp-vol"><input type="range" min="25" max="70" step="5" aria-label="Размер"><b></b></span>`;
            const inp = row.querySelector('input'), out = row.querySelector('b');
            inp.value = GM_getValue('palSize', 45);
            const show = () => { out.textContent = inp.value + '%'; inp.style.setProperty('--vp-vol', ((inp.value - 25) / 45 * 100) + '%'); };
            show();
            inp.addEventListener('input', () => { GM_setValue('palSize', +inp.value); show(); palsApply(); });
            row.onclick = e => e.stopPropagation();
            return row;
        }
        const SETTINGS = [
            { label: 'Фон', get: () => backgroundEnabled, set: v => { backgroundEnabled = v; updateBackgroundVisibility(); }, key: 'backgroundEnabled' },
            { label: 'Неоновая подсветка', get: () => neonEnabled, set: v => { neonEnabled = v; document.documentElement.classList.toggle('vp-no-neon', !v); paint(); }, key: 'neonEnabled' },
            { label: 'Подсветка ника', get: () => nickGlowEnabled, set: v => { nickGlowEnabled = v; paint(); }, key: 'nickGlowEnabled' },
            { label: 'Подсветка аватарок', get: () => avatarGlowEnabled, set: v => { avatarGlowEnabled = v; paint(); }, key: 'avatarGlowEnabled' },
            { label: 'Подсветка постов', get: () => postBorderEnabled, set: v => { postBorderEnabled = v; paint(); }, key: 'postBorderEnabled' },
            { label: 'Заставка при входе', get: () => GM_getValue('introEnabled', true), set: () => { }, key: 'introEnabled' },
            { label: 'Размытый фон постов', get: () => postBlurEnabled, set: v => { postBlurEnabled = v; applyPostBlurSetting(); }, key: 'postBlurEnabled' },
            { label: 'Анти цензура', get: () => antiCensorshipEnabled, set: v => { antiCensorshipEnabled = v; }, key: 'antiCensorshipEnabled' },
            {
                label: 'Автолайки', get: () => autoLikeEnabled, key: 'autoLikeEnabled',
                set: v => { autoLikeEnabled = v; }
            },
            { label: 'Стекло', get: () => glassEnabled, set: v => { glassEnabled = v; applyGlass(); }, key: 'glassEnabled' },
            { label: 'Звуки интерфейса', get: () => uiSoundEnabled, set: v => { uiSoundEnabled = v; if (v) uiSound('toggle'); }, key: 'uiSoundEnabled' },
            { label: 'Стили других', get: () => showLooks, set: v => { showLooks = v; document.documentElement.classList.toggle('vp-looks', v); if (!v) setBgGuest(null); }, key: 'showLooks' },
            { label: 'Сцена ленты', get: () => sceneEnabled, set: v => { sceneEnabled = v; sceneAutoOff = false; document.documentElement.classList.toggle('vp-scene', v); sceneKick(); }, key: 'sceneEnabled' },
            { label: 'Свечение видео', get: () => ambientEnabled, set: v => { ambientEnabled = v; applyAmbient(); }, key: 'ambientEnabled' },
            { label: 'Боковая панель', get: () => railEnabled, set: v => { railEnabled = v; placeRail(); }, key: 'railEnabled' },
            { label: 'Версия для ПК на планшете', get: () => GM_getValue('tabletDesktop', true), set: () => tabletViewport(), key: 'tabletDesktop' },
            { label: 'Мику и Тето', get: () => palsOn, set: v => { palsOn = v; palsApply(); }, key: 'palsEnabled' },
            { label: 'Мику справа', get: () => GM_getValue('palMiku', true), set: () => palsApply(), key: 'palMiku' },
            { label: 'Тето слева', get: () => GM_getValue('palTeto', true), set: () => palsApply(), key: 'palTeto' }
        ];
        const SETTINGS_TABS = [
            { id: 'nick', name: 'Ник', items: ['Неоновая подсветка', 'Подсветка ника', 'Подсветка аватарок', 'Подсветка постов'] },
            { id: 'bg', name: 'Фон', items: ['Фон'] },
            { id: 'look', name: 'Вид', items: ['Стекло', 'Сцена ленты', 'Свечение видео', 'Размытый фон постов', 'Боковая панель', 'Карточки панели', 'Версия для ПК на планшете'] },
            { id: 'likes', name: 'Лайки', items: ['Автолайки'] },
            { id: 'pals', name: 'Мику', items: ['Мику и Тето', 'Мику справа', 'Тето слева', 'Размер персонажей'] },
            { id: 'misc', name: 'Ещё', items: ['Анти цензура', 'Звуки интерфейса', 'Громкость', 'Заставка при входе'] },
            { id: 'icon', name: 'Иконка' }
        ];
        function settingRow(opt, after) {
            const row = document.createElement('div');
            row.className = 'settings-option';
            row.innerHTML = `<span class="vp-setting-label">${ICONS.settings[opt.label] || ''}<span></span></span><div class="toggle-switch"></div>`;
            row.querySelector('.vp-setting-label > span').textContent = opt.label;
            const toggle = row.lastElementChild;
            toggle.classList.toggle('active', !!opt.get());
            row.onclick = (e) => {
                e.stopPropagation();
                const v = !opt.get();
                GM_setValue(opt.key, v);
                opt.set(v);
                toggle.classList.toggle('active', v);
                if (after) after();
            };
            return row;
        }
        function railCardsBox(redraw) {
            const box = document.createElement('div');
            box.className = 'vp-rcards';
            box.appendChild(secTitle('Карточки панели'));
            const st = railCards();
            st.order.forEach((id, i) => {
                const c = RAIL_CARDS.find(x => x.id === id), on = !st.off.includes(id);
                const row = document.createElement('div');
                row.className = 'settings-option vp-rcard';
                row.dataset.card = id;
                row.innerHTML = `<span class="vp-setting-label"><span></span></span><span class="vp-rcard-move"><button type="button" data-d="-1" aria-label="Выше">${svgIcon('<path d="m6 15 6-6 6 6"/>', 16)}</button><button type="button" data-d="1" aria-label="Ниже">${svgIcon('<path d="m6 9 6 6 6-6"/>', 16)}</button></span><div class="toggle-switch"></div>`;
                row.querySelector('.vp-setting-label > span').textContent = c.name;
                const ico = rail.querySelector(`.vp-rail-card[data-block="${id}"] .vp-rail-title svg`);
                if (ico) row.querySelector('.vp-setting-label').prepend(ico.cloneNode(true));
                row.querySelector('[data-d="-1"]').disabled = i === 0;
                row.querySelector('[data-d="1"]').disabled = i === st.order.length - 1;
                row.querySelector('.toggle-switch').classList.toggle('active', on);
                row.onclick = e => {
                    e.stopPropagation();
                    const mv = e.target.closest('[data-d]'), cur = railCards();
                    if (mv) {
                        const j = cur.order.indexOf(id), k = j + +mv.dataset.d;
                        if (k < 0 || k >= cur.order.length) return;
                        [cur.order[j], cur.order[k]] = [cur.order[k], cur.order[j]];
                    } else {
                        cur.off = cur.off.filter(x => x !== id);
                        if (on) cur.off.push(id);
                    }
                    railCardsSave(cur);
                    redraw();
                };
                box.appendChild(row);
            });
            const hint = document.createElement('div');
            hint.className = 'vp-rcards-hint';
            hint.textContent = 'На самой панели карточки тоже можно перетаскивать за заголовок';
            box.appendChild(hint);
            return box;
        }
        function introModeRow() {
            const STEPS = [['off', 'Выкл'], ['silent', 'Вкл'], ['tap', 'Вкл + звук · коснись при входе']];
            const row = document.createElement('div');
            row.className = 'settings-option';
            row.innerHTML = `<span class="vp-setting-label">${ICONS.settings['Заставка при входе'] || ''}<span class="vp-tri-text"><span>Заставка при входе</span><small></small></span></span><div class="toggle-switch vp-tri"></div>`;
            const sw = row.querySelector('.vp-tri'), sub = row.querySelector('small');
            let idx = Math.max(0, STEPS.findIndex(st => st[0] === introMode()));
            const show = () => { sw.dataset.s = idx; sw.classList.toggle('active', idx > 0); sub.textContent = STEPS[idx][1]; };
            show();
            row.onclick = (e) => {
                e.stopPropagation();
                idx = (idx + 1) % STEPS.length;
                GM_setValue('introMobile', STEPS[idx][0]);
                show();
            };
            return row;
        }
        function volumeRow() {
            const row = document.createElement('div');
            row.className = 'settings-option vp-vol-row';
            row.innerHTML = `<span class="vp-setting-label">${ICONS.settings['Звуки интерфейса'] || ''}<span>Громкость</span></span>`
                + `<span class="vp-vol"><input type="range" min="0" max="100" step="5" aria-label="Громкость"><b></b></span>`;
            const inp = row.querySelector('input'), out = row.querySelector('b');
            inp.value = Math.round(soundVolume() * 100);
            const show = () => { out.textContent = inp.value + '%'; inp.style.setProperty('--vp-vol', inp.value + '%'); };
            show();
            inp.addEventListener('input', () => { GM_setValue('soundVolume', +inp.value); show(); });
            inp.addEventListener('change', () => { const was = uiSoundEnabled; uiSoundEnabled = true; uiSound('toggle'); uiSoundEnabled = was; });
            row.onclick = e => e.stopPropagation();
            return row;
        }
        const secTitle = (text) => {
            const t = document.createElement('div');
            t.className = 'vp-sec-title';
            t.textContent = text;
            return t;
        };
        function pickRow(icon, label, active, onPick, redraw) {
            const o = menuOption(icon, label, onPick, active);
            o.onclick = (e) => { e.stopPropagation(); onPick(); redraw(); };
            return o;
        }
        function openSettingsMenu(btn) {
            const menu = document.createElement('div');
            menu.className = 'settings-dropdown vp-settings-tabs';
            const tabs = document.createElement('div');
            tabs.className = 'vp-stabs';
            const body = document.createElement('div');
            body.className = 'vp-tab-body';
            menu.append(tabs, body);
            let current = GM_getValue('settingsTab', 'nick');
            if (!SETTINGS_TABS.some(t => t.id === current)) current = 'nick';
            const show = (id) => {
                current = id;
                GM_setValue('settingsTab', id);
                tabs.querySelectorAll('.vp-stab').forEach(t => t.classList.toggle('vp-active', t.dataset.tab === id));
                const keep = body.dataset.tab === id ? body.scrollTop : 0;
                body.dataset.tab = id;
                body.textContent = '';
                const redraw = () => show(id);
                const tab = SETTINGS_TABS.find(t => t.id === id);
                if (id === 'icon') body.appendChild(iconPicker());
                else for (const label of tab.items) {
                    if (label === 'Заставка при входе' && IS_PHONE) { body.appendChild(introModeRow()); continue; }
                    if (label === 'Громкость') { body.appendChild(volumeRow()); continue; }
                    if (label === 'Карточки панели') { body.appendChild(railCardsBox(redraw)); continue; }
                    if (label === 'Размер персонажей') { const r = palSizeRow(); if (!palsOn) r.classList.add('vp-dim'); body.appendChild(r); continue; }
                    const row = settingRow(SETTINGS.find(o => o.label === label), id === 'bg' || id === 'nick' || id === 'pals' ? redraw : null);
                    if (!neonEnabled && label.startsWith('Подсветка ')) row.classList.add('vp-dim');
                    if (!palsOn && (label === 'Мику справа' || label === 'Тето слева')) row.classList.add('vp-dim');
                    body.appendChild(row);
                }
                if (id === 'pals') {
                    body.appendChild(secTitle('Вид'));
                    const grid = document.createElement('div');
                    grid.className = 'vp-pick-grid' + (palsOn ? '' : ' vp-dim');
                    const look = GM_getValue('palLook', 'plain');
                    PAL_LOOKS.forEach(([key, name, glyph]) => {
                        const icon = document.createElement('div');
                        icon.className = 'vp-menu-icon';
                        icon.innerHTML = svgIcon(glyph);
                        grid.appendChild(pickRow(icon, name, key === look, () => { GM_setValue('palLook', key); palsApply(); }, redraw));
                    });
                    grid.style.gridTemplateRows = `repeat(${Math.ceil(grid.children.length / 2)}, auto)`;
                    body.appendChild(grid);
                }
                if (id === 'nick') {
                    body.appendChild(secTitle('Стиль ника'));
                    const grid = document.createElement('div');
                    grid.className = 'vp-pick-grid';
                    styleKeys.forEach(key => grid.appendChild(pickRow(getColorDot(key), nickStyles[key].name, key === currentStyle, () => {
                        currentStyle = key;
                        GM_setValue('nickStyle', key);
                        paint();
                    }, redraw)));
                    grid.style.gridTemplateRows = `repeat(${Math.ceil(grid.children.length / 2)}, auto)`;
                    body.appendChild(grid);
                }
                if (id === 'bg' && backgroundEnabled) {
                    body.appendChild(secTitle('Стиль фона'));
                    const grid = document.createElement('div');
                    grid.className = 'vp-pick-grid';
                    Object.entries(BG_STYLES).forEach(([key, bg]) => {
                        const icon = document.createElement('div');
                        icon.className = 'vp-menu-icon';
                        icon.innerHTML = bg.icon;
                        grid.appendChild(pickRow(icon, bg.name, key === backgroundStyle, () => {
                            if (key === 'custom') {
                                bgFile().then(f => {
                                    if (!f) return pickBgFile(redraw);
                                    backgroundStyle = 'custom'; GM_setValue('backgroundStyle', 'custom');
                                    updateBackgroundVisibility(); redraw();
                                }).catch(() => pickBgFile(redraw));
                                return;
                            }
                            backgroundStyle = key;
                            GM_setValue('backgroundStyle', key);
                            updateBackgroundVisibility();
                        }, redraw));
                    });
                    grid.style.gridTemplateRows = `repeat(${Math.ceil(grid.children.length / 2)}, auto)`;
                    body.appendChild(grid);
                    if (backgroundStyle === 'custom') {
                        const icon = document.createElement('div');
                        icon.className = 'vp-menu-icon';
                        icon.innerHTML = svgIcon('<path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/><path d="M12 4v11M7.5 8.5 12 4l4.5 4.5"/>');
                        const row = menuOption(icon, 'Сменить картинку или видео', () => { });
                        row.onclick = e => { e.stopPropagation(); pickBgFile(redraw); };
                        body.appendChild(row);
                    }
                }
                if (id === 'likes') {
                    body.appendChild(secTitle('Кого лайкать'));
                    const box = document.createElement('div');
                    box.className = 'vp-like-menu vp-like-inline';
                    box.innerHTML = '<div class="vp-like-list"><div class="vp-menu-note">Загрузка...</div></div><div class="vp-like-footer">Активно: 0</div>';
                    body.appendChild(box);
                    const list = box.firstElementChild, footer = box.lastElementChild;
                    fetchAutoLikeUsers().then(usersData => {
                        if (!list.isConnected) return;
                        renderAutoLikeUsers(list, footer, usersData);
                        if (popup && popup.el === menu) placePopup();
                    }).catch(() => { list.innerHTML = '<div class="vp-menu-note">Ошибка загрузки</div>'; });
                }
                if (popup && popup.el === menu) placePopup();
                body.scrollTop = keep;
            };
            for (const t of SETTINGS_TABS) {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'vp-stab';
                b.dataset.tab = t.id;
                b.textContent = t.name;
                b.onclick = (e) => { e.stopPropagation(); if (current !== t.id) show(t.id); };
                tabs.appendChild(b);
            }
            for (const t of ['touchstart', 'touchmove']) menu.addEventListener(t, e => e.stopPropagation(), { passive: true });
            show(current);
            openPopup(btn, menu);
        }

        function iconPicker() {
            const wrap = document.createElement('div');
            wrap.className = 'vp-icon-picker';
            const grid = document.createElement('div');
            grid.className = 'vp-icon-grid';
            const tile = (id, name, src) => {
                const t = document.createElement('button');
                t.type = 'button';
                t.className = 'vp-icon-tile' + (appIcon === id ? ' vp-active' : '');
                t.dataset.icon = id;
                t.title = name;
                t.innerHTML = '<img alt=""><span></span>';
                t.firstChild.src = src;
                t.lastChild.textContent = name;
                t.onclick = (e) => { e.stopPropagation(); pick(id); };
                return t;
            };
            const pick = (id) => {
                setAppIcon(id);
                wrap.querySelectorAll('.vp-icon-tile').forEach(t => t.classList.toggle('vp-active', t.dataset.icon === id));
            };
            for (const it of APP_ICONS) grid.appendChild(tile(it.id, it.name, iconSrcById(it.id)));
            const customTile = tile('custom', 'Своя', iconSrcById('custom'));
            grid.appendChild(customTile);
            let imageTile = null;
            const addImageTile = () => {
                if (imageTile) { imageTile.firstChild.src = iconSrcById('image'); return; }
                imageTile = tile('image', 'Картинка', iconSrcById('image'));
                grid.appendChild(imageTile);
            };
            if (GM_getValue('appIconImage', '')) addImageTile();
            wrap.appendChild(grid);

            const own = document.createElement('div');
            own.className = 'vp-icon-own';
            own.innerHTML = '<div class="vp-icon-own-title">Своя иконка</div><div class="vp-icon-own-row"><input class="vp-icon-emoji" type="text" maxlength="16" placeholder="🦊" aria-label="Эмодзи"><div class="vp-icon-bgs"></div></div>';
            const input = own.querySelector('input');
            const bgs = own.querySelector('.vp-icon-bgs');
            const cur = iconCustom();
            input.value = cur.emoji;
            const saveCustom = (patch) => {
                const c = Object.assign(iconCustom(), patch);
                GM_setValue('appIconCustom', c);
                customTile.firstChild.src = iconSrcById('custom');
                bgs.querySelectorAll('.vp-icon-bg').forEach(d => d.classList.toggle('vp-active', d.dataset.bg === c.bg));
                pick('custom');
            };
            for (const b of iconBgs()) {
                const d = document.createElement('button');
                d.type = 'button';
                d.className = 'vp-icon-bg' + (cur.bg === b.id ? ' vp-active' : '');
                d.dataset.bg = b.id;
                d.title = b.name;
                d.style.background = b.c.length > 1 ? `linear-gradient(135deg, ${b.c.join(', ')})` : b.c[0];
                d.onclick = (e) => { e.stopPropagation(); saveCustom({ bg: b.id }); };
                bgs.appendChild(d);
            }
            input.addEventListener('click', e => e.stopPropagation());
            input.addEventListener('input', () => {
                const g = firstGrapheme(input.value);
                if (!g) return;
                saveCustom({ emoji: g });
            });
            input.addEventListener('blur', () => { input.value = iconCustom().emoji; });
            wrap.appendChild(own);

            const up = document.createElement('button');
            up.type = 'button';
            up.className = 'vp-icon-upload';
            up.textContent = 'Загрузить свою картинку';
            up.onclick = (e) => {
                e.stopPropagation();
                const f = document.createElement('input');
                f.type = 'file';
                f.accept = 'image/*';
                f.onchange = () => {
                    const file = f.files && f.files[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    const img = new Image();
                    img.onload = () => {
                        const s = Math.min(img.naturalWidth, img.naturalHeight);
                        const c = document.createElement('canvas');
                        const side = Math.min(512, s);
                        c.width = c.height = side;
                        c.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, side, side);
                        URL.revokeObjectURL(url);
                        GM_setValue('appIconImage', c.toDataURL('image/png'));
                        pngFor = null;
                        addImageTile();
                        pick('image');
                    };
                    img.onerror = () => URL.revokeObjectURL(url);
                    img.src = url;
                };
                f.click();
            };
            wrap.appendChild(up);
            const note = document.createElement('div');
            note.className = 'vp-icon-note';
            note.textContent = 'Иконка меняется на вкладке и в логотипе. Ярлык на главном экране телефона добавь заново — старый сам не обновится.';
            wrap.appendChild(note);
            return wrap;
        }
        function copyText(text) {
            if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(() => true, () => fallback());
            return Promise.resolve(fallback());
            function fallback() {
                const ta = document.createElement('textarea');
                ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
                document.body.appendChild(ta); ta.select();
                let ok = false; try { ok = document.execCommand('copy'); } catch (e) { }
                ta.remove(); return ok;
            }
        }
        const callCss = () => { if (!document.getElementById('vp-call-css')) addCss(CALL_CSS).id = 'vp-call-css'; };
        const CALL_CSS = `
        .vp-call { position: fixed; inset: 0; z-index: 2147483600; display: flex; align-items: center; justify-content: center; padding: 16px;
            background: rgba(0, 0, 0, .9); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); animation: vpCallIn .25s ease; font-family: inherit; }
        .vp-call-card { width: min(300px, 100%); box-sizing: border-box; padding: 34px 22px 24px; border-radius: 22px; background: #2b2d31; color: #f2f3f5; text-align: center;
            box-shadow: 0 24px 70px rgba(0, 0, 0, .6), inset 0 0 0 1px rgba(255, 255, 255, .06); }
        .vp-call-ava { position: relative; width: 132px; height: 132px; margin: 0 auto 22px; border-radius: 50%; background: #fff; display: grid; place-items: center; }
        .vp-call-ava::before, .vp-call-ava::after { content: ""; position: absolute; inset: -6px; border-radius: 50%; border: 3px solid rgba(255, 255, 255, .5); animation: vpCallRing 1.6s ease-out infinite; }
        .vp-call-ava::after { animation-delay: .8s; }
        .vp-call.vp-talk .vp-call-ava::before, .vp-call.vp-talk .vp-call-ava::after { animation: none; opacity: 0; }
        .vp-call-ava img { position: relative; z-index: 1; width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; }
        .vp-call-name { font-size: 19px; font-weight: 800; letter-spacing: .02em; text-transform: uppercase; line-height: 1.2; }
        .vp-call-sub { margin-top: 6px; font-size: 15px; color: #b5bac1; min-height: 0; font-variant-numeric: tabular-nums; }
        .vp-call-btns { display: flex; gap: 14px; justify-content: center; margin-top: 26px; }
        .vp-call-btns button { flex: 1 1 0; max-width: 118px; height: 48px; border: 0; border-radius: 12px; color: #fff; font: 700 15px/1 inherit; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 7px; transition: filter .15s, transform .15s; }
        .vp-call-btns button:hover { filter: brightness(1.12); }
        .vp-call-btns button:active { transform: scale(.96); }
        .vp-call-btns svg { width: 18px; height: 18px; }
        .vp-call-no { background: #248046; }
        .vp-call-yes { background: #248046; }
        .vp-call.vp-talk .vp-call-btns { visibility: hidden; }
        .vp-call.vp-out { animation: vpCallOut .3s ease forwards; }
        @keyframes vpCallIn { from { opacity: 0; } }
        @keyframes vpCallOut { to { opacity: 0; } }
        @keyframes vpCallRing { from { transform: scale(1); opacity: .8; } to { transform: scale(1.35); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .vp-call-ava::before, .vp-call-ava::after { animation: none; opacity: .4; } }
        .vp-call-real .vp-call-card { position: relative; }
        .vp-call-min { position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 50%; background: rgba(255, 255, 255, .08);
            color: #b5bac1; cursor: pointer; display: grid; place-items: center; }
        .vp-call-min:hover { background: rgba(255, 255, 255, .16); color: #fff; }
        .vp-call-emoji { position: relative; z-index: 1; font-size: 64px; line-height: 1; }
        .vp-call-real .vp-call-btns button span { white-space: nowrap; }
        .vp-call-end { background: #da373c; }
        .vp-call-end svg { transform: rotate(135deg); }
        .vp-call-mute { background: #4e5058; }
        .vp-call-mute.vp-on { background: #f2f3f5; color: #111; }
        .vp-call-note { margin-top: 16px; font-size: 11.5px; line-height: 1.35; color: #80848e; }
        .vp-call-audio { display: none; }
        .vp-call-tag { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 18px; font-size: 12.5px; font-weight: 600; color: #23a55a; }
        .vp-call-mini .vp-call-tag { display: none; }
        .vp-call-lv { display: none; gap: 14px; justify-content: center; margin-top: 12px; font-size: 12px; color: #b5bac1; }
        .vp-call-real.vp-live:not(.vp-call-mini) .vp-call-lv { display: flex; }
        .vp-call-lv span { display: flex; align-items: center; gap: 6px; min-width: 0; }
        .vp-call-lv em { font-style: normal; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-call-lv b { display: block; width: 44px; height: 6px; border-radius: 3px; background: rgba(255, 255, 255, .12); overflow: hidden; }
        .vp-call-lv i { display: block; height: 100%; background: #23a55a; transform-origin: 0 50%; transform: scaleX(.04); transition: transform .1s linear; }
        .vp-call-info { margin-top: 8px; padding: 4px 8px; border: 0; background: none; color: #80848e; font: inherit; font-size: 11.5px; text-decoration: underline; cursor: pointer; }
        .vp-call-info:hover { color: #b5bac1; }
        .vp-call-mini .vp-call-info { display: none; }
        .vp-call-real.vp-live .vp-call-ava::before, .vp-call-real.vp-live .vp-call-ava::after { animation: none; opacity: 0; }
        .vp-call.vp-call-mini { inset: auto 16px 16px auto; padding: 0; background: none; backdrop-filter: none; -webkit-backdrop-filter: none; }
        .vp-call-mini .vp-call-card { width: auto; max-width: calc(100vw - 32px); padding: 8px 8px 8px 16px; display: flex; align-items: center; gap: 12px; text-align: left; cursor: pointer; }
        .vp-call-mini .vp-call-ava, .vp-call-mini .vp-call-note, .vp-call-mini .vp-call-min { display: none; }
        .vp-call-mini .vp-call-name { font-size: 14px; text-transform: none; letter-spacing: 0; }
        .vp-call-mini .vp-call-sub { margin: 0; font-size: 13px; }
        .vp-call-mini .vp-call-btns { margin: 0; gap: 6px; }
        .vp-call-mini .vp-call-btns button { width: 40px; height: 40px; flex: 0 0 auto; padding: 0; border-radius: 50%; }
        .vp-call-mini .vp-call-btns button span { display: none; }`;
        function callTone(kind) {
            let ac, t = 0;
            try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return () => { }; }
            if (ac.state === 'suspended') ac.resume().catch(() => { });
            const beep = (at, freqs, len, vol, rise, trill) => {
                const g = ac.createGain();
                g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + rise); g.gain.setValueAtTime(vol, at + len - .04); g.gain.linearRampToValueAtTime(0, at + len);
                if (trill) { const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = trill; lg.gain.value = .5; lfo.connect(lg).connect(g.gain); lfo.start(at); lfo.stop(at + len + .03); }
                freqs.forEach(fr => { const o = ac.createOscillator(); o.frequency.value = fr; o.connect(g); o.start(at); o.stop(at + len + .03); });
                g.connect(ac.destination);
            };
            const stop = () => { clearInterval(t); t = 0; if (ac) { const c = ac; ac = null; c.close().catch(() => { }); } };
            const loop = (fn, ms) => { fn(); t = setInterval(() => ac && fn(), ms); };
            if (kind === 'ring') loop(() => { const t0 = ac.currentTime + .05; beep(t0, [440, 480], .42, .16, .02, 22); beep(t0 + .6, [440, 480], .42, .16, .02, 22); }, 3000);
            else if (kind === 'back') loop(() => beep(ac.currentTime + .05, [425], 1, .1, .02), 4000);
            else { const t0 = ac.currentTime + .05; for (let i = 0; i < 3; i++) beep(t0 + i * .5, [425], .32, .18, .015); setTimeout(stop, 1800); }
            return stop;
        }
        function fakeCall() {
            if (document.querySelector('.vp-call')) return;
            callCss();
            const phone = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + GLYPH.phone + '</svg>';
            const el = document.createElement('div');
            el.className = 'vp-call';
            el.innerHTML = `<div class="vp-call-card" role="dialog" aria-label="Входящий звонок"><div class="vp-call-ava"><img alt="" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAAAAAAbPrZOAAACyklEQVR42u3dQU8TQRjG8XmbnrjJx9RIwKCCgigGjV50EcJn9OTBcCAQx0sTw9Ju7c7sMO88/7ltMm32t8+zs9tNm1oMWmMWAAMGDBgwYMCAAQMGDBgwYMCAAQMGDBgwYMCAAQMGDBgwYMCAAQMGDBgwYMCAAQMGDBgwYMCAAQOuDGz3x+Dc/ftz9+sE2/DvlnrEuMHcEBuvtImdwxbEwGqrtImBTS5hMbCJgU0uYTGwiYFfuEo4w730qoBbvZc2sXP4pbNFK7nSqwNus9LOCp0MPnJ3HU6s9FDALVbaXaETwScOby2TKj0ccHuVdljoJPDhZDt1UWelJwx4p6sQ/MAbMx6BWF+lP/lYo/KB3/a2PzZ+WbIlAbdc6TOnhR4NPip2iaqj0rY04HYr/dVtoUeCX6/Zbq3StiLgViv93XGhR4H3etvv8+/VXk2VtpUBu6j0fNMXnBfZN5vuEMXB8XBy//XHQ5PXvV8IIbz6v2lpjn9jlnroT1PDvK160eryF9qqBu/2tt8Fb2OWlsaHxsGubzkygHeCGLgTA7v8xwS+ttR4wAngKJewGDiKgYt6l33qOVCr9HZZ8OMX+q4ouIIT2NQqXXTRimLgKJewGDiKgaNcwmLgEgH/qAhcpNA3apX+VQ+4zIp1XQ240Ao95dPQeUahiwsWlyXAgAEDThzf1MA/1cBfOIcBA/YMNhIG3BT4sxr4DZVuG2xi4FO1hE/EwCZwDts479hHpPNHB9+Ni3fLLfhJCCF0v4+HShC72eKILBoZn+325lz+WUx9vqZQVTw9v3qa8c2iA3DWxSpypwUYMGDAgAEDBgwYMOD0Ma9yrzb7CGckDBgwYMCAAQMGDBgwYMCAAQMGLDUskjBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwBOPv+gU+qgZ1lnIAAAAAElFTkSuQmCC"></div>
                <div class="vp-call-name">Илья Новки</div><div class="vp-call-sub"></div>
                <div class="vp-call-btns"><button type="button" class="vp-call-no">${phone}Принять</button><button type="button" class="vp-call-yes">${phone}Принять</button></div></div>`;
            document.body.appendChild(el);
            const sub = el.querySelector('.vp-call-sub'), timers = [];
            const stopRing = callTone('ring'), hangup = () => callTone('hang');
            const later = (fn, ms) => timers.push(setTimeout(fn, ms));
            const close = () => { stopRing(); timers.forEach(clearTimeout); el.classList.add('vp-out'); setTimeout(() => el.remove(), 320); };
            const answer = () => {
                if (el.classList.contains('vp-talk')) return;
                stopRing(); timers.forEach(clearTimeout); timers.length = 0;
                el.classList.add('vp-talk');
                sub.textContent = 'Соединение…';
                later(() => {
                    let sec = 0;
                    sub.textContent = '00:00';
                    const tick = setInterval(() => { sec++; sub.textContent = '00:0' + sec; }, 1000);
                    later(() => { clearInterval(tick); sub.textContent = 'Звонок сброшен: сервер ИТД упал'; hangup(); later(close, 1700); }, 3200);
                }, 1300);
            };
            el.querySelectorAll('.vp-call-btns button').forEach(b => b.addEventListener('click', answer));
            later(() => { stopRing(); el.classList.add('vp-talk'); sub.textContent = 'Пропущенный звонок'; hangup(); later(close, 1700); }, 30000);
        }
        const CALL_ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: 'stun:stun.cloudflare.com:3478' }];
        const CALL_RING_S = 60;
        const CALL_MIC = '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>';
        const callNet = { cur: null, done: null, lastSync: 0, title: null };
        function callDone() { if (!callNet.done) callNet.done = new Set(GM_getValue(acctKey('callDone'), [])); return callNet.done; }
        function callMarkDone(key) { const d = callDone(); d.add(key); GM_setValue(acctKey('callDone'), [...d].slice(-60)); }
        function callSig(uid, type, id, data) { return msgSend(uid, '', false, null, cat(new Uint8Array([4, type]), be32(id), data || new Uint8Array(0))); }
        function sdpSlim(sdp, drop) {
            const lines = sdp.split(/\r?\n/).filter(Boolean), opus = new Set(), bundle = lines.some(l => l.startsWith('a=group:BUNDLE'));
            lines.forEach(l => { const m = l.match(/^a=rtpmap:(\d+) opus\//i); if (m) opus.add(m[1]); });
            const out = [];
            let sec = -1;
            for (let l of lines) {
                if (l.startsWith('m=')) sec++;
                if ((/^a=extmap:/.test(l) && !/sdes:mid/.test(l)) || /^a=(rtcp-fb|extmap-allow-mixed)/.test(l)) continue;
                if (/^a=candidate:/.test(l) && (/^a=candidate:\S+ \d+ tcp /i.test(l) || (bundle && sec > 0) || (drop && drop(l)))) continue;
                const pt = l.match(/^a=(?:rtpmap|fmtp):(\d+)/);
                if (opus.size && pt && !opus.has(pt[1])) continue;
                if (opus.size && /^m=audio /.test(l)) l = l.split(' ').filter((x, i) => i < 3 || opus.has(x)).join(' ');
                out.push(l);
            }
            return out.join('\r\n') + '\r\n';
        }
        async function callPack(sdp, drop) {
            const raw = te.encode(sdpSlim(sdp, drop));
            try {
                const z = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
                if (z.length < raw.length) return cat(new Uint8Array([1]), z);
            } catch (e) { }
            return cat(new Uint8Array([0]), raw);
        }
        async function callPackFit(sdp) {
            const drops = [null, l => /^a=candidate:.* typ host/.test(l) && /:[0-9a-f]*:/i.test(l.split(' ')[4]), l => /^a=candidate:.* typ (host|relay)/.test(l)];
            let out = null;
            const max = GM_getValue('msgMode', 'c') === 'b' ? 640 : 1400;
            for (const d of drops) { out = await callPack(sdp, d); if (out.length <= max) break; }
            return out;
        }
        async function callUnpack(b) {
            const body = b.slice(1);
            return td.decode(b[0] === 1 ? new Uint8Array(await new Response(new Blob([body]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()) : body);
        }
        function callGather(pc) {
            if (pc.iceGatheringState === 'complete') return Promise.resolve();
            return new Promise(ok => {
                const t = setTimeout(ok, 2500);
                pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); ok(); } });
            });
        }
        async function callMedia(c) {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Браузер не даёт микрофон');
            const hint = setTimeout(() => c.state !== 'end' && callSub(c, 'Разреши микрофон — значок в адресной строке'), 6000);
            try { c.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
            catch (e) {
                clearTimeout(hint);
                logErr('звонок: микрофон', e);
                throw new Error(e && e.name === 'NotAllowedError' ? 'Нет доступа к микрофону — разреши его для итд.com'
                    : e && e.name === 'NotFoundError' ? 'Микрофон не найден' : 'Микрофон не включился');
            }
            clearTimeout(hint);
            if (c.state === 'end') { c.stream.getTracks().forEach(t => t.stop()); return false; }
            callMeter(c, 'me', c.stream);
            return true;
        }
        function callAudioPrep(c) {
            const a = document.createElement('audio');
            a.className = 'vp-call-audio';
            a.autoplay = true;
            a.setAttribute('playsinline', '');
            document.body.appendChild(a);
            c.audio = a;
            try { c.ac = new (window.AudioContext || window.webkitAudioContext)(); if (c.ac.state === 'suspended') c.ac.resume().catch(() => { }); } catch (e) { c.ac = null; }
        }
        function callPlay(c) {
            const a = c.audio;
            if (!a || c.state === 'end') return;
            if (c.ac && c.ac.state === 'suspended') c.ac.resume().catch(() => { });
            if (!a.srcObject) return;
            const p = a.play();
            if (p) p.then(() => { if (c.blocked) { c.blocked = false; callPaint(c); } }, e => {
                if (!e || e.name !== 'NotAllowedError' || c.blocked) return;
                c.blocked = true;
                logErr('звонок: браузер не дал включить звук', e);
                callPaint(c);
            });
        }
        function callMeter(c, who, stream) {
            if (!c.ac || (c.meters && c.meters[who])) return;
            try {
                const an = c.ac.createAnalyser();
                an.fftSize = 256;
                c.ac.createMediaStreamSource(stream).connect(an);
                (c.meters || (c.meters = {}))[who] = an;
            } catch (e) { logErr('звонок: индикатор', e); }
        }
        function callLevels(c) {
            const lv = c.el && c.el.querySelector('.vp-call-lv');
            if (!lv || !c.meters) return;
            const buf = new Uint8Array(128);
            for (const who of ['me', 'them']) {
                const an = c.meters[who], bar = lv.querySelector(`[data-who="${who}"] i`);
                if (!an || !bar) continue;
                an.getByteTimeDomainData(buf);
                let sum = 0;
                for (const v of buf) sum += (v - 128) * (v - 128);
                const lvl = Math.min(1, Math.sqrt(sum / buf.length) / 40);
                bar.style.transform = `scaleX(${Math.max(.04, lvl).toFixed(2)})`;
                if (lvl > .06) c.heard = Object.assign(c.heard || {}, { [who]: true });
            }
        }
        async function callInfo(c) {
            const out = [`ИТД X ${GM_info.script.version} · ${navigator.userAgent}`, `звонок: ${c.dir === 'out' ? 'исходящий' : 'входящий'}, ${c.state}`];
            try {
                const pc = c.pc;
                if (pc) {
                    out.push(`соединение: ${pc.connectionState}, ice: ${pc.iceConnectionState}, сбор: ${pc.iceGatheringState}`);
                    const cand = d => d ? (d.sdp.match(/^a=candidate:.*$/gm) || []).map(l => (l.match(/typ (\w+)/) || [])[1]).join(',') : '—';
                    out.push(`кандидаты: наши ${cand(pc.localDescription)}; их ${cand(pc.remoteDescription)}`);
                    const st = await pc.getStats(), by = {};
                    st.forEach(r => { by[r.id] = r; });
                    st.forEach(r => {
                        if (r.type === 'candidate-pair' && (r.nominated || r.selected) && r.state === 'succeeded') {
                            const l = by[r.localCandidateId], rm = by[r.remoteCandidateId];
                            out.push(`путь: ${l && l.candidateType}/${l && l.protocol} → ${rm && rm.candidateType}`);
                        }
                        if (r.type === 'inbound-rtp' && r.kind === 'audio') out.push(`пришло: ${r.bytesReceived} байт, пакетов ${r.packetsReceived}, потеряно ${r.packetsLost}`);
                        if (r.type === 'outbound-rtp' && r.kind === 'audio') out.push(`ушло: ${r.bytesSent} байт`);
                    });
                }
            } catch (e) { out.push('статистика: ' + (e.message || e)); }
            const a = c.audio;
            out.push(`звук: ${a ? (a.paused ? 'на паузе' : 'играет') + ', дорожек ' + (c.remote ? c.remote.getAudioTracks().length : 0) : 'нет элемента'}${c.blocked ? ', заблокирован браузером' : ''}; микрофон: ${c.stream ? c.stream.getAudioTracks().map(t => t.label || 'без имени').join(', ') + (c.muted ? ' (выкл)' : '') : 'нет'}; слышно: ${JSON.stringify(c.heard || {})}`);
            out.push('журнал: ' + vpErrors.filter(x => /звон/.test(x)).slice(-6).join(' | '));
            return out.join('\n');
        }
        function callPeer(c) {
            const pc = new RTCPeerConnection({ iceServers: CALL_ICE });
            pc.ontrack = e => {
                if (!c.audio) callAudioPrep(c);
                c.remote = e.streams[0] || new MediaStream([e.track]);
                if (c.audio.srcObject !== c.remote) c.audio.srcObject = c.remote;
                callPlay(c);
                callMeter(c, 'them', c.remote);
            };
            pc.onconnectionstatechange = () => {
                const st = pc.connectionState;
                if (c.state === 'end') return;
                if (st === 'connected') { clearTimeout(c.lostT); callLive(c); }
                else if (st === 'failed') { callInfo(c).then(t => logErr('звонок: не соединились', new Error(t.split('\n').slice(2, 4).join('; ')))); callEnd(c, 'Не удалось соединиться напрямую — обычно мешает мобильный интернет. Попробуйте, чтобы хотя бы у одного был Wi-Fi', 0); }
                else if (st === 'disconnected' && c.state === 'talk') {
                    callSub(c, 'Связь прерывается…');
                    clearTimeout(c.lostT);
                    c.lostT = setTimeout(() => pc.connectionState !== 'connected' && callEnd(c, 'Связь потеряна', 0), 10000);
                }
            };
            return pc;
        }
        function callDc(c, dc) {
            c.dc = dc;
            dc.onmessage = e => {
                if (e.data === 'bye') callEnd(c, 'Собеседник положил трубку', null);
                else if (/^mute:[01]$/.test(e.data)) { c.peerMuted = e.data === 'mute:1'; callSub(c); }
            };
            dc.onopen = () => { if (c.muted) try { dc.send('mute:1'); } catch (e) { } };
        }
        function callWho(uid) {
            const k = msgNet.keys.get(uid), login = k ? k.login : '', p = login && msgPeople.get(login);
            return { name: (p && p.name) || login || 'ИТД X', ava: (p && p.ava) || '👤' };
        }
        function callTitle(text) {
            if (text && callNet.title === null) callNet.title = document.title;
            if (text) document.title = text;
            else if (callNet.title !== null) { document.title = callNet.title; callNet.title = null; }
        }
        const callBtn = (cls, label, glyph) => `<button type="button" class="${cls}">${svgIcon(glyph, 18)}<span>${label}</span></button>`;
        function callUi(c) {
            callCss();
            const el = document.createElement('div');
            el.className = 'vp-call vp-call-real';
            el.innerHTML = `<div class="vp-call-card" role="dialog" aria-label="Звонок"><button type="button" class="vp-call-min" title="Свернуть">${svgIcon('<path d="M6 9l6 6 6-6"/>', 18)}</button>
                <div class="vp-call-ava"></div><div class="vp-call-name"></div><div class="vp-call-sub"></div>
                <div class="vp-call-lv"><span data-who="me">ты<b><i></i></b></span><span data-who="them"></span></div><div class="vp-call-btns"></div>
                <div class="vp-call-tag">${svgIcon('<path d="M4 20v-3M9 20v-7M14 20v-11M19 20V4"/>', 14)}Ловит даже на парковке</div>
                <div class="vp-call-note">Звук идёт напрямую между вами, мимо серверов ИТД. Собеседнику виден твой IP-адрес</div>
                <button type="button" class="vp-call-info">Скопировать сведения о звонке</button></div>`;
            el.querySelector('[data-who="them"]').innerHTML = '<em></em><b><i></i></b>';
            el.querySelector('[data-who="them"] em').textContent = c.name;
            el.querySelector('.vp-call-info').onclick = async e => {
                const b = e.currentTarget;
                try { await navigator.clipboard.writeText(await callInfo(c)); b.textContent = 'Скопировано — отправь разработчику'; }
                catch (er) { b.textContent = 'Не скопировалось'; }
            };
            const ava = el.querySelector('.vp-call-ava');
            if (/^https?:|^\//.test(c.ava)) { const im = document.createElement('img'); im.src = c.ava; im.alt = ''; ava.appendChild(im); }
            else { const sp = document.createElement('span'); sp.className = 'vp-call-emoji'; sp.textContent = c.ava; ava.appendChild(sp); }
            el.querySelector('.vp-call-name').textContent = c.name;
            el.querySelector('.vp-call-min').onclick = e => { e.stopPropagation(); el.classList.add('vp-call-mini'); };
            el.querySelector('.vp-call-card').addEventListener('click', e => { if (el.classList.contains('vp-call-mini') && !e.target.closest('button')) el.classList.remove('vp-call-mini'); });
            document.body.appendChild(el);
            c.el = el;
            callPaint(c);
        }
        function callPaint(c) {
            const el = c.el;
            if (!el) return;
            const ring = c.dir === 'in' && c.state === 'ringing', key = c.state + (c.muted ? 1 : 0) + (c.missed ? 1 : 0) + (c.blocked ? 1 : 0);
            el.classList.toggle('vp-live', c.state === 'talk' || c.state === 'end');
            if (el.dataset.k !== key) {
                el.dataset.k = key;
                const btns = el.querySelector('.vp-call-btns');
                btns.innerHTML = c.state === 'end' ? (c.missed ? callBtn('vp-call-mute vp-call-close', 'Закрыть', GLYPH.close) + callBtn('vp-call-yes vp-call-again', 'Перезвонить', GLYPH.phone) : '')
                    : ring ? callBtn('vp-call-end', 'Отклонить', GLYPH.phone) + callBtn('vp-call-yes', 'Принять', GLYPH.phone)
                        : callBtn('vp-call-mute' + (c.muted ? ' vp-on' : ''), c.muted ? 'Включить' : 'Микрофон', CALL_MIC + (c.muted ? '<path d="M4 4l16 16"/>' : ''))
                        + callBtn('vp-call-end', 'Завершить', GLYPH.phone)
                        + (c.blocked ? callBtn('vp-call-yes vp-call-sound', 'Включить звук', '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/>') : '');
                const b = cls => btns.querySelector('.' + cls);
                if (b('vp-call-sound')) b('vp-call-sound').onclick = () => callPlay(c);
                if (b('vp-call-close')) b('vp-call-close').onclick = () => callClose(c, 0);
                else if (b('vp-call-again')) b('vp-call-again').onclick = () => { callClose(c, 0); callStart(c.uid, c.name, c.ava); };
                if (c.state !== 'end') {
                    if (b('vp-call-yes')) b('vp-call-yes').onclick = () => callAccept(c);
                    if (b('vp-call-mute')) b('vp-call-mute').onclick = () => callMute(c);
                    if (b('vp-call-end')) b('vp-call-end').onclick = () => ring ? callEnd(c, 'Звонок отклонён', 1)
                        : callEnd(c, c.state === 'talk' ? 'Звонок завершён' : 'Звонок отменён', c.offered || c.dir === 'in' ? 0 : null);
                }
            }
            callSub(c);
        }
        function callSub(c, text) {
            if (text !== undefined) c.subText = text;
            const sub = c.el && c.el.querySelector('.vp-call-sub');
            if (sub) sub.textContent = (c.subText || '') + (c.state === 'talk' && c.peerMuted ? ' · у собеседника выключен микрофон' : c.state === 'talk' && c.warn ? ' · ' + c.warn : '');
        }
        function callClose(c, wait) {
            const el = c.el;
            if (!el || el.dataset.closing) return;
            el.dataset.closing = '1';
            setTimeout(() => { el.classList.add('vp-out'); setTimeout(() => el.remove(), 320); }, wait);
        }
        function callLive(c) {
            if (c.state === 'talk' || c.state === 'end') return;
            c.state = 'talk';
            c.stops.splice(0).forEach(f => f());
            clearTimeout(c.connT);
            const t0 = c.t0 = Date.now();
            try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(w => { if (c.state === 'end') w.release().catch(() => { }); else c.wake = w; }, () => { }); } catch (e) { }
            callSub(c, '00:00');
            c.tick = setInterval(() => callSub(c, callMmss(Math.floor((Date.now() - t0) / 1000))), 1000);
            c.lvT = setInterval(() => callLevels(c), 120);
            callPlay(c);
            c.timers.push(setTimeout(async () => {
                if (c.state !== 'talk' || !c.pc) return;
                let got = 0;
                try { (await c.pc.getStats()).forEach(r => { if (r.type === 'inbound-rtp' && r.kind === 'audio') got += r.bytesReceived || 0; }); } catch (e) { }
                if (got) return;
                c.warn = 'звук от собеседника не приходит';
                callSub(c);
                callInfo(c).then(t => logErr('звонок: звук не приходит', new Error(t.split('\n').slice(2, 5).join('; '))));
            }, 6000));
            callPaint(c);
        }
        function callMute(c) {
            c.muted = !c.muted;
            if (c.stream) c.stream.getAudioTracks().forEach(t => { t.enabled = !c.muted; });
            if (c.dc && c.dc.readyState === 'open') try { c.dc.send(c.muted ? 'mute:1' : 'mute:0'); } catch (e) { }
            callPaint(c);
        }
        function callEnd(c, text, reason) {
            if (c.state === 'end') return;
            const was = c.state;
            c.state = 'end';
            c.missed = c.dir === 'in' && was === 'ringing' && reason === null;
            if (reason !== null && c.dc && c.dc.readyState === 'open') try { c.dc.send('bye'); } catch (e) { }
            const dur = was === 'talk' && c.t0 ? Math.max(1, Math.round((Date.now() - c.t0) / 1000)) : 0;
            if (reason !== null) callSig(c.uid, 3, c.id, dur ? cat(new Uint8Array([reason]), be32(dur)) : new Uint8Array([reason])).catch(e => logErr('звонок: отбой', e));
            c.stops.splice(0).forEach(f => f());
            c.timers.forEach(clearTimeout);
            clearInterval(c.tick); clearInterval(c.lvT); clearTimeout(c.lostT); clearTimeout(c.connT);
            if (c.wake) { c.wake.release().catch(() => { }); c.wake = null; }
            if (c.pc) try { c.pc.close(); } catch (e) { }
            if (c.stream) c.stream.getTracks().forEach(t => t.stop());
            if (c.audio) { c.audio.srcObject = null; c.audio.remove(); }
            if (c.ac) { c.ac.close().catch(() => { }); c.ac = null; }
            callMarkDone(c.uid + '|' + c.id);
            if (callNet.cur === c) callNet.cur = null;
            if (!(c.dir === 'in' && was === 'ringing')) callTone('hang');
            if (c.missed) callTitle('📞 Пропущенный звонок'); else callTitle(null);
            callSub(c, text);
            callPaint(c);
            if (c.el) c.el.classList.remove('vp-call-mini');
            if (!c.missed) callClose(c, 1800);
            else if (c.el) c.el.addEventListener('click', () => callTitle(null), { once: true });
        }
        async function callStart(uid, name, ava) {
            if (callNet.cur) { if (callNet.cur.el) callNet.cur.el.classList.remove('vp-call-mini'); return; }
            const c = { uid, dir: 'out', id: crypto.getRandomValues(new Uint32Array(1))[0], name, ava, state: 'calling', stops: [], timers: [] };
            callNet.cur = c;
            callAudioPrep(c);
            callUi(c);
            callSub(c, 'Включаю микрофон…');
            try {
                if (!(await callMedia(c))) return;
                c.pc = callPeer(c);
                callDc(c, c.pc.createDataChannel('itdx'));
                c.stream.getTracks().forEach(t => c.pc.addTrack(t, c.stream));
                await c.pc.setLocalDescription(await c.pc.createOffer());
                callSub(c, 'Соединяю…');
                await callGather(c.pc);
                if (c.state === 'end') return;
                const offer = await callPackFit(c.pc.localDescription.sdp);
                c.offered = true;
                await callSig(uid, 1, c.id, offer);
                if (c.state === 'end') return;
                callSub(c, 'Вызываю…');
                c.stops.push(callTone('back'));
                c.timers.push(setTimeout(() => callEnd(c, 'Не отвечает', 3), (CALL_RING_S + 15) * 1000));
                callNet.lastSync = 0;
            } catch (e) { logErr('звонок', e); callEnd(c, e.message || 'Не вышло позвонить', c.offered ? 0 : null); }
        }
        async function callAnswered(c, data) {
            if (c.answering) return;
            c.answering = true;
            c.stops.splice(0).forEach(f => f());
            c.timers.forEach(clearTimeout);
            c.state = 'connecting';
            callPaint(c);
            callSub(c, 'Соединяю…');
            try { await c.pc.setRemoteDescription({ type: 'answer', sdp: await callUnpack(data) }); }
            catch (e) { logErr('звонок: ответ', e); return callEnd(c, 'Не удалось соединиться', 0); }
            c.connT = setTimeout(() => c.state !== 'talk' && callEnd(c, 'Не удалось соединиться: мешает сеть', 0), 25000);
        }
        function callIncoming(s) {
            const w = callWho(s.uid);
            const c = { uid: s.uid, dir: 'in', id: s.id, offer: s.data, name: w.name, ava: w.ava, state: 'ringing', stops: [callTone('ring')], timers: [] };
            callNet.cur = c;
            callUi(c);
            callSub(c, 'Звонит тебе…');
            callTitle('📞 ' + c.name + ' звонит');
            const left = Math.max(5, CALL_RING_S + 15 - (srvNow() / 1000 - s.ts));
            c.timers.push(setTimeout(() => callEnd(c, 'Пропущенный звонок', null), left * 1000));
        }
        async function callAccept(c) {
            if (c.state !== 'ringing') return;
            callAudioPrep(c);
            c.stops.splice(0).forEach(f => f());
            c.timers.forEach(clearTimeout);
            c.state = 'connecting';
            callPaint(c);
            callSub(c, 'Включаю микрофон…');
            callTitle(null);
            try {
                if (!(await callMedia(c))) return;
                c.pc = callPeer(c);
                c.pc.ondatachannel = e => callDc(c, e.channel);
                c.stream.getTracks().forEach(t => c.pc.addTrack(t, c.stream));
                await c.pc.setRemoteDescription({ type: 'offer', sdp: await callUnpack(c.offer) });
                await c.pc.setLocalDescription(await c.pc.createAnswer());
                callSub(c, 'Соединяю…');
                await callGather(c.pc);
                if (c.state === 'end') return;
                await callSig(c.uid, 2, c.id, await callPackFit(c.pc.localDescription.sdp));
                if (c.state !== 'talk') c.connT = setTimeout(() => c.state !== 'talk' && callEnd(c, 'Не удалось соединиться: мешает сеть', 0), 30000);
            } catch (e) { logErr('звонок: принять', e); callEnd(c, e.message || 'Не вышло ответить', 0); }
        }
        const callMmss = sec => String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
        function callHistory(uid) {
            const by = new Map(), live = callNet.cur;
            for (const s of msgNet.sigs || []) {
                if (s.uid !== uid) continue;
                const e = by.get(s.id) || { id: s.id };
                if (s.type === 1) { e.dir = s.dir; e.ts = s.ts; }
                else if (s.type === 2) e.ok = s.ts;
                else if (s.type === 3 && (!e.end || s.data.length > e.end.data.length)) e.end = s;
                by.set(s.id, e);
            }
            const now = srvNow() / 1000;
            return [...by.values()].filter(e => e.ts && !(live && live.id === e.id) && (e.end || now - e.ts > CALL_RING_S + 20)).sort((a, b) => a.ts - b.ts);
        }
        function callChip(e) {
            const r = e.end ? e.end.data[0] || 0 : -1, dur = e.end && e.end.data.length >= 5 ? u32(e.end.data, 1) : 0, out = e.dir === 'out';
            if (e.ok) return { text: (out ? 'Исходящий звонок' : 'Входящий звонок') + (dur ? ' · ' + callMmss(dur) : ''), miss: false };
            if (!out) return r === 1 ? { text: 'Входящий звонок · отклонён', miss: false } : { text: 'Пропущенный звонок' + (r === 2 ? ' · было занято' : ''), miss: true };
            return { text: 'Исходящий звонок · ' + (r === 1 ? 'отклонён' : r === 2 ? 'занято' : r === 0 ? 'отменён' : 'не ответил'), miss: false };
        }
        function callCheck() {
            const sigs = msgNet.sigs || [], now = srvNow() / 1000, c = callNet.cur;
            const ended = new Map(sigs.filter(s => s.type === 3).map(s => [s.uid + '|' + s.id, s.data[0] || 0]));
            if (c && c.state !== 'end') {
                const key = c.uid + '|' + c.id;
                const ans = c.dir === 'out' && c.state === 'calling' && sigs.find(s => s.dir === 'in' && s.type === 2 && s.uid === c.uid && s.id === c.id);
                const endIn = sigs.find(s => s.dir === 'in' && s.type === 3 && s.uid === c.uid && s.id === c.id);
                if (endIn) {
                    const r = ended.get(key);
                    if (c.dir === 'in' && c.state === 'ringing') callEnd(c, 'Пропущенный звонок', null);
                    else callEnd(c, r === 1 ? 'Звонок отклонён' : r === 2 ? 'Занято: у собеседника другой звонок' : r === 3 ? 'Не отвечает'
                        : c.state === 'talk' ? 'Собеседник положил трубку' : c.dir === 'out' ? 'Звонок сброшен' : 'Звонок отменён', null);
                } else if (ans) callAnswered(c, ans.data);
            }
            for (const s of sigs) {
                if (s.dir !== 'in' || s.type !== 1) continue;
                const key = s.uid + '|' + s.id;
                if (callDone().has(key) || ended.has(key) || now - s.ts > CALL_RING_S + 10 || (callNet.cur && callNet.cur.id === s.id)) continue;
                callMarkDone(key);
                if (callNet.cur) { callSig(s.uid, 3, s.id, new Uint8Array([2])).catch(e => logErr('звонок: занято', e)); continue; }
                callIncoming(s);
            }
            if (messagesOverlay && messagesOverlay.refreshCalls) messagesOverlay.refreshCalls();
        }

        function pillButton(cls, title, icon, open) {
            const b = document.createElement('span');
            b.className = 'vp-pill-btn ' + cls;
            b.title = title;
            b.innerHTML = icon;
            b.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                open(b);
            });
            return b;
        }
        function findNukstaButton(from) {
            for (let el = from, i = 0; el && i < 6; el = el.parentElement, i++) {
                const b = [...el.querySelectorAll('button')].find(x => !x.classList.contains('vp-itdx-btn') && /нукста/i.test(x.textContent));
                if (b) return b;
            }
            return null;
        }
        function addToggleButtonToNick(ru5n) {
            const nickSpan = ru5n.querySelector('.' + SELECTORS.nickText);
            if (!nickSpan) return;
            const nickText = nickSpan.textContent.trim();
            if (nickText !== myUsername && nickText !== myDisplayName) return;

            const nuksta = findNukstaButton(ru5n);
            if (nuksta) {
                nuksta.classList.add('vp-nuksta-hidden');
                const next = nuksta.nextElementSibling;
                if (!next || !next.classList.contains('vp-itdx-btn')) {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.className = nuksta.className.replace('vp-nuksta-hidden', '').trim() + ' vp-itdx-btn';
                    b.innerHTML = ICONS.SLIDERS + '<span>ИТД X</span>';
                    b.title = 'Настройки ИТД X';
                    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openSettingsMenu(b); });
                    nuksta.after(b);
                    if (innerWidth <= PHONE_MAX && !nuksta.parentElement.querySelector('.vp-menu-btn')) {
                        const m = document.createElement('button');
                        m.type = 'button';
                        m.className = b.className.replace('vp-itdx-btn', '').trim() + ' vp-menu-btn';
                        m.textContent = 'Меню';
                        m.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openMobileMenu(); });
                        b.after(m);
                    }
                }
                document.querySelectorAll('.nick-controls-panel').forEach(p => p.remove());
                return;
            }
            if (document.querySelector('.vp-itdx-btn') || ru5n.querySelector('.nick-controls-panel')) return;
            const panel = document.createElement('div');
            panel.className = 'nick-controls-panel';
            panel.append(pillButton('settings-toggle', 'ИТД X', ICONS.SLIDERS, openSettingsMenu));
            const nick = ru5n.querySelector('.' + SELECTORS.nickContainer);
            if (nick) nick.after(panel);
            else ru5n.appendChild(panel);
        }

        const bannerEdit = { banner: null, img: null, url: null, top: 0, drag: null };
        const bannerBtns = { row: null, draw: null, del: null, image: null, change: null, cancel: null, apply: null };

        const styleBanner = addCss(`
        .custom-image-btn:hover, .custom-change-btn:hover {
            background: var(--accent-primary) !important;
            color: #fff !important;
        }
        .custom-cancel-btn:hover { background: #dc3545cc !important; }
        .custom-apply-btn:hover { background: #28a745cc !important; }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .vp-banner-ours:not(.vp-banner-editing) :is(.custom-change-btn, .custom-cancel-btn, .custom-apply-btn),
        .vp-banner-ours.vp-banner-editing > :not(.custom-change-btn, .custom-cancel-btn, .custom-apply-btn) { display: none !important; }
        .vp-banner.vp-banner-editing { position: relative; overflow: hidden; z-index: 0; }
        .vp-banner-ours.vp-banner-editing { pointer-events: none; }
        .vp-banner-ours.vp-banner-editing > button { pointer-events: auto; }
        .vp-banner.vp-banner-editing > img:not(.vp-banner-drag) { position: relative; z-index: -3; }
        .vp-banner > img.vp-banner-drag {
            position: absolute; left: 0; top: 0; width: 100%; height: auto; z-index: -1;
            cursor: grab; user-select: none; -webkit-user-drag: none; touch-action: none;
            transition: top 0.1s ease-out;
        }
        .vp-banner > img.vp-banner-drag.vp-dragging { cursor: grabbing; transition: none; }
    `);

        function bannerButton(cls, title, icon) {
            const b = document.createElement('button');
            b.className = siteClasses(bannerBtns.draw) + ' ' + cls;
            b.title = title;
            b.innerHTML = icon;
            return b;
        }
        function bannerOurs(row) {
            if (!row) return null;
            let ours = row.querySelector(':scope > .vp-banner-ours');
            if (!ours) {
                ours = document.createElement('div');
                ours.className = 'vp-banner-ours';
                row.appendChild(ours);
            }
            return ours;
        }
        function createAllButtons() {
            const row = siteEl('bannerButtons');
            if (!row || row.querySelector('.custom-image-btn')) return;
            const B = bannerBtns;
            B.row = row;
            B.ours = bannerOurs(row);
            B.draw = row.querySelector('button:not(.' + SELECTORS.bannerDelete + ')');
            B.del = row.querySelector('.' + SELECTORS.bannerDelete);
            B.image = bannerButton('custom-image-btn', 'Добавить картинку', ICONS.BANNER_IMAGE);
            B.change = bannerButton('custom-change-btn', 'Сменить картинку', ICONS.BANNER_CHANGE);
            B.cancel = bannerButton('custom-cancel-btn', 'Отмена', ICONS.BANNER_CANCEL);
            B.apply = bannerButton('custom-apply-btn', 'Применить', ICONS.BANNER_APPLY);
            B.ours.append(B.image, B.change, B.cancel, B.apply);
            B.image.onclick = B.change.onclick = pickBannerFile;
            B.cancel.onclick = () => setBannerEditing(false);
            B.apply.onclick = applyBanner;
        }

        function pickBannerFile() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/jpeg,image/png,image/webp,image/gif';
            input.onchange = () => {
                const file = input.files[0];
                if (file) putBannerImage(URL.createObjectURL(file));
            };
            input.click();
        }

        function setBannerEditing(on) {
            const E = bannerEdit;
            if (!on) {
                if (E.img) E.img.remove();
                if (E.url) URL.revokeObjectURL(E.url);
                E.img = E.url = E.drag = null;
                E.top = 0;
            }
            if (E.banner) E.banner.classList.toggle('vp-banner-editing', on);
            if (bannerBtns.row) bannerBtns.row.classList.toggle('vp-banner-editing', on);
            if (bannerBtns.apply && !on) { bannerBtns.apply.innerHTML = ICONS.BANNER_APPLY; bannerBtns.apply.disabled = false; }
        }

        function putBannerImage(url) {
            const banner = siteEl('banner');
            if (!banner) return;
            setBannerEditing(false);
            const E = bannerEdit;
            E.banner = banner;
            E.url = url;
            E.img = document.createElement('img');
            E.img.className = 'vp-banner-drag';
            E.img.draggable = false;
            E.img.src = url;
            banner.appendChild(E.img);
            const center = () => moveBannerImage((banner.clientHeight - E.img.offsetHeight) / 2, true);
            E.img.onload = center;
            if (E.img.complete) center();
            setBannerEditing(true);
        }

        function moveBannerImage(top, free) {
            const E = bannerEdit;
            if (!E.img) return;
            E.top = free ? top : Math.max(E.banner.clientHeight - E.img.offsetHeight, Math.min(0, top));
            E.img.style.top = E.top + 'px';
        }
        const bannerMovable = () => bannerEdit.img && bannerEdit.img.offsetHeight > bannerEdit.banner.clientHeight;

        document.addEventListener('pointerdown', e => {
            const E = bannerEdit;
            if (e.target !== E.img || !bannerMovable()) return;
            e.preventDefault();
            E.drag = { y: e.clientY, top: E.top };
            E.img.classList.add('vp-dragging');
            E.img.setPointerCapture(e.pointerId);
        });
        document.addEventListener('pointermove', e => {
            const E = bannerEdit;
            if (!E.drag) return;
            e.preventDefault();
            moveBannerImage(E.drag.top + e.clientY - E.drag.y);
        });
        const endBannerDrag = () => {
            const E = bannerEdit;
            if (!E.drag) return;
            E.drag = null;
            if (E.img) E.img.classList.remove('vp-dragging');
        };
        document.addEventListener('pointerup', endBannerDrag);
        document.addEventListener('pointercancel', endBannerDrag);
        document.addEventListener('wheel', e => {
            const E = bannerEdit;
            if (!E.img || E.drag || !E.banner.contains(e.target)) return;
            e.preventDefault();
            if (bannerMovable()) moveBannerImage(E.top + (e.deltaY > 0 ? -30 : 30));
        }, { passive: false });

        function cropBannerImage() {
            return new Promise((resolve, reject) => {
                const img = bannerEdit.img;
                const br = bannerEdit.banner.getBoundingClientRect(), ir = img.getBoundingClientRect();
                const sx = img.naturalWidth / img.offsetWidth, sy = img.naturalHeight / img.offsetHeight;
                const x = Math.max(0, br.left - ir.left) * sx, y = Math.max(0, br.top - ir.top) * sy;
                const w = (Math.min(ir.right, br.right) - Math.max(ir.left, br.left)) * sx;
                const h = (Math.min(ir.bottom, br.bottom) - Math.max(ir.top, br.top)) * sy;
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const src = new Image();
                src.crossOrigin = 'anonymous';
                src.onload = () => {
                    canvas.getContext('2d').drawImage(src, x, y, w, h, 0, 0, w, h);
                    canvas.toBlob(resolve, 'image/jpeg', 0.95);
                };
                src.onerror = reject;
                src.src = img.src;
            });
        }

        function uploadBannerFile(blob, token) {
            return new Promise((resolve, reject) => {
                const form = new FormData();
                form.append('file', blob, blob.name || 'banner.jpg');
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/files/upload');
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.onload = () => {
                    let data = null;
                    try { data = JSON.parse(xhr.responseText); } catch (e) { }
                    if (xhr.status >= 200 && xhr.status < 300) return data ? resolve(data) : reject(new Error('Ошибка загрузки: ответ не JSON'));
                    reject(new Error(data ? (data.error?.message || data.message || `Ошибка ${xhr.status}`) : `Ошибка загрузки: ${xhr.status}`));
                };
                xhr.onerror = () => reject(new Error('Ошибка сети'));
                xhr.send(form);
            });
        }

        async function applyBanner() {
            const E = bannerEdit, apply = bannerBtns.apply;
            if (!E.img || !E.banner) return;
            apply.innerHTML = ICONS.LOADING;
            apply.disabled = true;
            try {
                const token = await getAccessToken();
                const file = await uploadBannerFile(await cropBannerImage(), token);
                const res = await fetch('/api/users/me', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ bannerId: file.id })
                });
                if (!res.ok) {
                    let msg = `Ошибка обновления профиля: ${res.status}`;
                    try { msg = (await res.json()).error?.message || msg; } catch (e) { }
                    throw new Error(msg);
                }
                const site = E.banner.querySelector('img:not(.vp-banner-drag)');
                setBannerEditing(false);
                if (site) site.src = file.url;
                alert('✅ Баннер успешно обновлён!');
            } catch (error) {
                console.error('Ошибка:', error);
                const message = error.message || 'Неизвестная ошибка';
                if (message.includes('запрещённый контент') || message.includes('CONTENT_MODERATION')) {
                    alert('❌ Изображение не прошло модерацию.\nПожалуйста, выберите другое изображение.');
                } else if (message.includes('сети') || message.includes('network')) {
                    alert('❌ Ошибка сети. Проверьте подключение к интернету.');
                } else {
                    alert(`❌ Ошибка: ${message}`);
                }
                apply.innerHTML = ICONS.BANNER_APPLY;
                apply.disabled = false;
            }
        }

        function initBanner() {
            onDom(function bannerButtons() { createAllButtons(); });
        }

        const CHANGELOG = [
            ['3.5.2 – 3.5.2.6', '4 октября 2026', [
                'Мику и Тето двигаются втрое плавнее: в каждом прыжке 45 кадров вместо 13',
                'В списке автолайка настоящие аватарки показываются картинкой, а не ссылкой',
                'Уведомления от сайта, например про ивент, тоже получают цветной фон, как остальные',
                'Уведомления от людей с аватаркой-картинкой тоже с цветным фоном: он берётся из самой аватарки, как у постов с картинкой',
                'Кнопка «Убрать стекло с баннера» работает и на ивенте, когда стекло разбитое',
                'Видео в баннере больше не больше картинки — та же маска и тот же сдвиг',
                'У ника больше не появляется вторая галочка ИТД X',
                'Секция ауры на баннере осталась ванильной — наши кнопки и стили её не касаются',
                'Кнопки на баннере больше не съезжают: строка с ауры снова по центру']],
            ['3.5.1 – 3.5.1.11', '2 октября 2026', [
                'Мику и Тето теперь и на телефоне: выглядывают из-за нижней панели вкладок и ничего не закрывают',
                'Кто не заходил с модом больше трёх месяцев, теряет галочку и место в клубе ИТД X, его стиль больше не показывается. Зайдёт снова — всё вернётся само',
                'Профили за шторами больше не затемняются и не размываются',
                'Мод шлёт на сайт намного меньше запросов: реже проверяет сообщения и кто в сети, запоминает это между перезагрузками, а если открыто несколько вкладок, фоном работает только одна',
                'Автолайк заглядывает к каждому раз в 15–30 минут и ставит лайки не пачкой, а вразброс, через 3–10 минут после просмотра',
                'Если сайт ответил «слишком много запросов», мод сам затихает и ждёт',
                'Видео на фоне теперь видят и другие: раньше им показывался только первый кадр',
                'Клуб ИТД X: если с прошлого захода прошло больше 5 минут, кто в сети, видно сразу, а дальше мод спокойно обновляет по одному человеку: кто в сети — раз в 5 минут, кто нет — раз в 20 минут']],
            ['3.5.0 – 3.5.0.8', '1 октября 2026', [
                'Мику и Тето: новая вкладка «Мику» в настройках — Мику держится за экран справа, Тето слева. Прыгают вместе и в такт, можно оставить одну, поменять размер и вид: как есть, неоновый контур или приглушённые под тёмный сайт. Пока только на компьютере. Без потери качества, а весят всего по 2–3 МБ',
                'Оптимизация и исправление багов']],
            ['3.4.4.3', '1 октября 2026', [
                'Оптимизация и исправление багов']],
            ['3.4.4.2', '1 октября 2026', [
                'Обновления: если сайт долго открыт, мод сам раз в 10 минут проверяет, не вышла ли новая версия, и показывает кнопку «Обновить»']],
            ['3.4.4.1', '1 октября 2026', [
                'Заставка: редкие варианты выпадают чаще — 5% вместо 1%']],
            ['3.4.4', '1 октября 2026', [
                'Оптимизация и исправление багов']],
            ['3.4.3.2', '1 октября 2026', [
                'Сообщения: кнопка «вниз» — если отлистал переписку вверх, одно нажатие возвращает к последним сообщениям, на ней видно, сколько пришло новых']],
            ['3.4.3.1', '1 октября 2026', [
                'Оптимизация и исправление багов']],
            ['3.4.3', '1 октября 2026', [
                'Оптимизация и исправление багов']],
            ['3.4.2.1', '1 октября 2026', [
                'Кнопка «ИТД X» в профиле — со значком настроек, чтобы сразу было понятно, что там настройки']],
            ['3.4.2', '1 октября 2026', [
                'Баннер: GIF снова можно обрезать и сдвинуть перед установкой — сайт всё равно показывает баннер обычной картинкой']],
            ['3.4.1', '1 октября 2026', [
                'Баннер: у видео в баннере скруглённые углы, как у картинки']],
            ['3.4.0', '1 октября 2026', [
                'Сообщения: ссылки в тексте нажимаются — ссылки на итд открываются сразу, остальные в новой вкладке',
                'Настройки → Ник: «Неоновая подсветка» одним переключателем убирает всё свечение — и своё, и чужое',
                'Правая панель: карточки можно перетаскивать за заголовок, а в «Вид → Карточки панели» — менять местами, прятать и возвращать (игры тоже)',
                'Баннер: своё видео в баннере — кнопка в шторке, его видят все, у кого стоит ИТД X',
                'Галерея: точки листания — шторкой у верхнего края',
                'Звонки: входящий вызов доходит быстрее, во время разговора экран телефона не гаснет, понятнее, если соединиться не вышло']],
            ['3.3.15.5', '30 сентября 2026', [
                'Баннер: шторка с кнопками раскрывается прямо на баннере сверху вниз и больше не показывается над ним']],
            ['3.3.15.4', '30 сентября 2026', [
                'Баннер: шторка с кнопками только на баннере — не вылезает поверх верхней полосы сайта и задвигается после нажатия кнопки']],
            ['3.3.15.3', '30 сентября 2026', [
                'Блокировка: заблокированный видит в чате, что ты его заблокировал(а), и не может писать и звонить',
                'Блокировка теперь общая для всех твоих устройств',
                'Репосты: у ника автора репоста снова его стиль и галочка ИТД X']],
            ['3.3.15.2', '30 сентября 2026', [
                'Сообщения: в «•••» чата можно заблокировать человека — его новые сообщения и звонки к тебе не приходят',
                'Баннер: шторка с кнопками выезжает из-под верхнего края баннера, а не из-за верха страницы']],
            ['3.3.15.1', '30 сентября 2026', [
                'Звонки: звук собеседника включается надёжнее',
                'В окне звонка видно, идёт ли звук от тебя и от собеседника; если браузер не дал включить звук — кнопка «Включить звук»',
                'Звонки в переписке: «Исходящий звонок · 01:23», «Пропущенный звонок» и другие — нажми, чтобы перезвонить',
                'Свёрнутый звонок больше не размывает страницу',
                'В меню у логотипа — ссылка на ТГ-чат']],
            ['3.3.15', '30 сентября 2026', [
                'Звонки в сообщениях: кнопка с трубкой в шапке чата — звонок голосом другому пользователю ИТД X',
                'Во время звонка можно выключить микрофон, свернуть звонок в плашку в углу и положить трубку',
                'Пропущенный звонок остаётся на экране с кнопкой «Перезвонить»',
                'Звонок доходит, если у собеседника открыт итд; быстрее всего — когда у него открыты «Сообщения»']],
            ['3.3.14.1 – 3.3.14.3', '30 сентября 2026', [
                'Лента и профиль: после выхода из поста возвращают к тому же посту, а не в начало',
                'Кнопка «Обновить» у поста с репостом: свои цифры получают и пост, и репост (раньше цифры поста попадали в репост)',
                'Баннер: в шторке появились кнопки «убрать стекло» и «скрыть стикеры» на время ивента, выбор помнится после перезагрузки',
                'Баннер: шторка с кнопками больше не вылезает выше баннера',
                'Профиль: галочка ИТД X снова стоит после ника, а не перед ним',
                'Посты: галочка ИТД X снова рядом с ником, а не под ним',
                'Профиль на телефоне: кнопки под статистикой ровно по центру, «•••» больше не съезжает вниз']],
            ['3.3.13.6 – 3.3.13.12', '30 сентября 2026', [
                'Фон «Матрица»: символы снова гаснут после падения — дождь, а не сплошная стена иероглифов (особенно на экранах 120–144 Гц)',
                'Посты: время и значки у ника больше не заезжают под кнопки «Скопировать картинку», «Скопировать ссылку» и «•••» — длинный ник обрезается многоточием',
                'Уведомления: галочка ИТД X стоит рядом с ником, а не под ним; длинный ник обрезается многоточием и не вылезает за карточку',
            ]],
            ['3.3.11 – 3.3.13.5', '29 сентября 2026', [
                'Галочка ИТД X у ника — по центру строки и не переносится на отдельную строку',
                'Кнопка «ИТД X» в профиле — в оттенке твоего акцентного цвета',
                'Окно «Оформление поста» больше не мылит всю страницу',
                'Ивент «Алиса AI»: иконка ИТД X на пункте «Ивент», «Сбор на шторы» больше не наезжает на статистику профиля, окно ивента не ломает баннер',
                'Сообщения: окно больше не мигает — новые сообщения, реакции и галочки появляются на месте',
                'Сообщения: реакция ставится сразу и не пропадает, перезаходить не нужно',
                'Сообщения: галочки как в Телеграме — одна «доставлено», двойная «прочитано»',
                'Сообщения: порядок верный, даже если у кого-то неправильно идут часы на устройстве; новые сообщения от такого человека не теряются',
                'Клуб ИТД X: видно, кто сейчас в сети — зелёная точка на аватарке, такие люди наверху списка; наведи на строку — «в сети» или когда был(а)',
                'Статистика в боковой панели — общая для всех твоих устройств: на телефоне тот же прирост за день и месяц, что на компьютере',
                'Сообщения: прочитанное на одном устройстве не висит непрочитанным на другом',
            ]],
            ['3.3.10 – 3.3.10.5', '29 сентября 2026', [
                'Галерея на компьютере: кнопка громкости справа от вкладок — ползунок, колёсико мыши, щелчок выключает и возвращает звук видео при наведении',
                'Сообщения: если собеседник пришлёт то, чего твоя версия ещё не умеет показать, вместо непонятных символов будет просьба обновить мод',
                'Всплывашки новых сообщений — такие же, как уведомления сайта (аватарка, имя, текст, оттенок), и показываются по одной вместе с ними, а не двумя стопками',
                'Сообщения на телефоне: долгое нажатие больше не выделяет текст — сразу меню с реакциями',
                'Сообщения: правая кнопка (на телефоне — долгое нажатие) по сообщению открывает меню — реакции, копировать текст, открыть картинку; реакции видны обоим; ✓ — отправлено, ✓✓ — прочитано',
                'Клуб ИТД X: свечение ников больше не обрезается резко у краёв списка',
                'Сообщения: альбомы — до 10 картинок в одном сообщении, сеткой как в Телеграме; в просмотре листаются стрелками, клавишами ← → и свайпом; список диалогов обновляется сразу, как пришло новое',
                'Клуб ИТД X в боковой панели: ники и аватарки — в стиле каждого, твоя строка — в твоём',
                'Стили других: ники и аватарки людей с ИТД X — в их стиле и свечении, а на их профиле — их фон (свой фон-картинку видно тоже, у видео — кадр). Выключается в настройках «Стили других»',
                'Сапёр: щелчок колёсиком мыши по клетке оставляет рамку 3×3 — видно зону цифры; кнопка «❓ Как играть» — правила прямо в окне игры',
                'Сообщения: над картинками больше не вылезает панель Яндекс Браузера; в просмотре — «Открыть оригинал»']],
            ['3.3.9 – 3.3.9.1', '29 сентября 2026', [
                'Картинки в сообщениях: перед отправкой — превью с крестиком, можно дописать подпись; картинка показывается целиком, без обрезки; по нажатию — крупно прямо в окне сообщений («назад» и Esc закрывают)',
                'Вкладка лидеров в играх теперь «Топ задротов»',
                'Сцена ленты плавнее при прокрутке, а на слабых телефонах выключается сама, если не успевает (раньше лента дёргалась, особенно при прокрутке вверх)',
                'Сообщения: можно отправлять картинки — скрепкой или вставкой из буфера (Ctrl+V), с подписью. Картинка сжимается перед отправкой, ссылка на неё шифруется вместе с сообщением',
                'Сообщения: сверху — чаты, где было последнее сообщение или куда ты последний раз заходил, как в Телеграме']],
            ['3.3.8 – 3.3.8.1', '29 сентября 2026', [
                'Сообщения: «назад» из переписки возвращает к списку диалогов, а не закрывает сообщения целиком',
                'Бот «Сервер ИТД» сменил репертуар: теперь шутит про сервера, лайки, ленту и прочие баги ИТД',
                'Статистика: у лайков снова виден прирост за день и месяц (раньше стоял 0); «День» больше не показывает прирост за недели — если давно не заходил, видно, с какого числа считается',
                '«Назад» (и кнопка «назад» на телефоне) закрывает окна «Игры» и «Что нового», а не уводит со страницы',
                'Сообщения: свои сообщения подкрашены цветом стиля и читаются на любом стиле и теме; под полем ввода — сколько символов из 500',
                'Сообщения: кнопка эмодзи заработала — окно с категориями и «Недавними»',
                'Несколько аккаунтов на одном устройстве: рекорды игр, статистика, прочитанное в сообщениях и автолайки у каждого аккаунта свои']],
            ['3.3.7 – 3.3.7.3', '29 сентября 2026', [
                'Галочка: если не подтвердили, через неделю мод сам отправит запрос снова — достаточно просто зайти на сайт',
                'Сообщения без подтверждённой галочки: пароль больше не спрашивается заново при каждом входе, чат с поддержкой работает сразу, переписка с людьми — после подтверждения',
                'Телефон: рядом с «ИТД X» в профиле — кнопка «Меню»: статистика, клуб ИТД X и игры в полноэкранном окне (раньше на телефоне панели не было совсем)',
                '«Назад» на телефоне и Esc закрывают меню; открытое окно помечается в истории — листается как галерея и личка',
                'Рекорды игр подтягиваются с сервера: зашёл с другого устройства — старые рекорды на месте']],
            ['3.3.5 – 3.3.6', '28 сентября 2026', [
                'Галочка «пользуется ИТД X» теперь выдаётся вручную: новая — серая и ждёт подтверждения, после подтверждения становится радужной',
                'Личные сообщения и лидеры игр — только для подтверждённых: без галочки эти разделы пустые']],
            ['3.3.3.1 – 3.3.3.2', '28 сентября 2026', ['Игры: окно не меняет размер при смене вкладок; поле каждой игры целиком влезает в окно, без прокрутки; страница под окном не крутится']],
            ['3.3.3', '28 сентября 2026', [
                'Сообщения заработали: личка с теми, у кого ИТД X, — со сквозным шифрованием (прочитать можете только вы двое, даже зная код мода)',
                'Сообщения хранятся в зашифрованном виде; пароль сообщений открывает переписку на любом устройстве — придумай надёжный',
                'Поддержка ИТД X — настоящая: вопрос уходит разработчику, ответ приходит в тот же чат',
                'Сообщения: видно, кто в сети, и когда человек был в сети последний раз',
                'Сообщения: число непрочитанных на пункте меню (как у уведомлений) и всплывашка о новом сообщении — нажми, чтобы открыть чат',
                'Игры: лидеры — отдельная вкладка, у каждой игры свой список с прокруткой',
                'Галерея грузится плавно: одно обновление — 100 постов, запросы идут потоком, а не пачкой',
                'Меню: «Галерея» — сразу под «Лентой»; под галереей не просвечивают ссылки сайта справа']],
            ['3.3.1 – 3.3.2', '28 сентября 2026', [
                'Долгая прокрутка ленты расходует меньше памяти',
                'Меньше лишней работы на каждом обновлении страницы',
                'Игры: общий лидерборд — топ-10 по каждой игре внизу окна, твои рекорды попадают туда сами']],
            ['3.3.0', '28 сентября 2026', [
                'У всех постов рядом с «…» — кнопки «Скопировать картинку» и «Скопировать ссылку», как в галерее; «Обновить» — по-прежнему только у своих постов, теперь и у репостов, и у закреплённого',
                'Галерея грузится бережно: по 50 постов за раз и не больше 4 страниц подряд, дальше — «Показать ещё» или прокрутка (раньше листала десятки страниц и сайт мог ограничить запросы)',
                'Галерея помнит загруженное 10 минут: перезагрузка страницы — картинки сразу, без новых запросов; повторное нажатие на «Галерею» — обновить',
                'Сайт просит подождать — галерея ждёт и пробует снова сама, без потока повторов',
                'Галерея: картинки не обрезаются — очень широкие и высокие видны целиком',
                'Галерея на телефоне: стрелки листания видны всегда; на компьютере — перетаскивание мышью докатывается плавно',
                'Под галереей и «Сообщениями» не просвечивает страница (поиск и другие), и не мешает кнопка «наверх»',
                'Настройки → «Ещё»: ползунок громкости для всех звуков ИТД X',
                'Всплывающие уведомления — по одному, сверху по центру (компьютер и телефон), живут 7 секунд; новое сразу заменяет старое; оформлены как во вкладке «Уведомления»',
                'Правая панель: вместо змейки — «Игры»: Змейка, Сапёр и Тетрис в большом окне, рекорды в панели',
                'Змейка: без задержки нажатий — быстрые повороты подряд срабатывают все, скорость больше не растёт, на телефоне — свайпы',
                'Компьютер: навёл мышь на видео в ленте или галерее — звук включается, увёл — выключается']],
            ['3.2.22 – 3.2.22.3', '28 сентября 2026', [
                'Галерея: если первые картинки не заполнили экран, следующие подгружаются сами (раньше внизу оставалась пустота)',
                'Галерея: кнопка «Скопировать картинку» рядом со ссылкой; правой кнопкой мыши картинка тоже копируется сразу',
                'Галерея: колонки под ширину окна галереи (маленький экран и телефон — меньше колонок, кнопки компактнее, не налезают)',
                'Галерея и картинки постов в ленте: пока картинка грузится — заготовка со значком загрузки; не загрузилась — значок, нажми, чтобы повторить; в галерее картинки грузятся заранее',
                'Галерея: лайк и репост, поставленные в самом посте, видны и на картинке в галерее',
                'Галерея и «Сообщения»: видео и звук страницы под ними ставятся на паузу (раньше звук играл дальше)',
                'Галерея: картинки поста листаются и перетаскиванием мышью; точки — на подложке; после возврата из поста — та же картинка; у края первой и последней нажатие не открывает пост',
                'Галерея: кнопки, стрелки и счётчик картинок — белые на тёмной стеклянной подложке, хорошо видны на любой картинке',
                'Галерея: справа внизу на картинке — кнопка «Скопировать ссылку» на пост',
                'Галерея: стрелки листания крупнее; кнопки на картинке прячутся, когда уводишь мышь после лайка или репоста',
                'Галерея: правая кнопка мыши — «Копировать картинку» снова копирует, «Сохранить как» — с нормальным именем файла',
                'Магазин → «Сообщения»: меню и правая панель стоят как на ленте (раньше разъезжались по краям, панель сужалась)',
                'Галерея: кнопки крупнее, отзываются на нажатие, сердце «подпрыгивает» при лайке',
                'Магазин → «Сообщения»: окно открывается поверх магазина (раньше не было видно)',
                'Свой и живой фон видны в магазине и в «Сообщениях»',
                'Заставка: звук точно в такт анимации (на компьютере опережал её), свой фон включается сразу после заставки']],
            ['3.2.21', '28 сентября 2026', [
                'Галерея: пост с несколькими картинками — одна плитка, картинки листаются внутри (телефон — свайп, компьютер — стрелки), лайк и репост — один на пост',
                '«Что нового»: страница за окном размыта сразу, а не после нажатия']],
            ['3.2.20', '28 сентября 2026', [
                'Кнопка «назад» и переходы с открытой галереей и «Сообщениями» работают как на обычных страницах: переход по меню больше не возвращает обратно, «назад» из поста — снова в галерею, «вперёд» открывает окно снова',
                'Галерея и «Сообщения» сменяют друг друга без лишних нажатий «назад»']],
            ['3.2.19', '28 сентября 2026', ['Вкладки галереи — 1 в 1 как у ленты: отдельная таблетка сверху, тот же порядок; на телефоне слева — логотип']],
            ['3.2.18', '28 сентября 2026', [
                'Галерея на компьютере — на всю ширину: меню у левого края, «Статистика» и клуб — у правого, картинки между ними',
                'Вкладки галереи — как у ленты, без заголовка',
                'На картинках галереи — лайк, комментарии и репост (на компьютере — при наведении)',
                'Галерея открывается как была; повторное нажатие на «Галерею» — обновить',
                'В галерее не всплывает панель браузера над картинками; правая кнопка по-прежнему сохраняет и копирует картинку']],
            ['3.2.17', '28 сентября 2026', [
                'Галерея: на компьютере — по центру, от меню до правой панели; вкладки как у ленты; стеклянный фон, как у постов; лента под ней больше не просвечивает; без крестика — обычная вкладка',
                'Лента → Галерея → «Лента» больше не обновляет ленту (и с «Сообщениями» так же)',
                'В профиле — «лайков» при любом числе']],
            ['3.2.16', '28 сентября 2026', [
                'Лайки за всё время — в своём профиле рядом с постами; в «Статистике» — сколько прибавилось за день и за месяц',
                'Галерея открывается как страница сайта: меню слева (на телефоне — снизу) остаётся, ширина — под экран; иконка в стиле сайта',
                'Паки стикеров сохраняются на сервере — одинаковые на всех устройствах',
                'Кнопка «обновить пост» больше не съезжает, если пост поменялся',
                'Подложка кнопок баннера прозрачнее',
                'Автолайки не теряют человека, если он сменил ник']],
            ['3.2.15', '27 сентября 2026', [
                'Галерея — картинки и видео из ленты сеткой, как в Пинтересте: кнопка рядом с поиском (на ПК — в меню слева)',
                'Свой фон — картинка или видео: «ИТД X» → «Фон» → «Своя картинка»',
                'Паки стикеров из архива: папка в .zip = пак, картинки встают как есть (правила — у кнопки в панели стикеров)',
                'Паки стикеров одинаковые на всех устройствах одного аккаунта',
                'Галочка ИТД X держится за аккаунт, а не за ник — смена ника её не снимает',
                'Фон рисуется на частоте экрана — любой, хоть 240 Гц — и сам возвращается к ней после подтормаживаний']],
            ['3.2.14', '27 сентября 2026', [
                'На своих постах — кнопка «обновить» слева от «…»: лайки, комменты и просмотры обновляются без перезагрузки страницы',
                'Меньше запросов к сайту: «Клуб ИТД X» и автолайки не спрашивают профиль каждого участника, мод не повторяет запросы сайта при загрузке']],
            ['3.2.13', '27 сентября 2026', ['Форма «Ответить» в комментариях больше не тёмный прямоугольник']],
            ['3.2.12', '27 сентября 2026', [
                'Ссылки в постах и комментариях (t.me/…, https://…) подсвечиваются и открываются по нажатию',
                'Иконка ИТД X в углу открывает меню: ТГК и донат',
                'Всплывающее поверх страницы (уведомления сайта, выпадающие окна) больше не просвечивает насквозь',
                'Уведомления, пришедшие пока открыт список, тоже окрашиваются',
                'Карточка профиля при наведении не остаётся висеть после перехода в профиль',
                'Баннер больше не бледнеет, если зайти в профиль из прокрученной ленты',
                'Свечение за видео меняет цвет плавно, без скачков']],
            ['3.2.11', '27 сентября 2026', ['Кнопки баннера — аккуратная «шторка» сверху по центру; на компьютере появляются при наведении']],
            ['3.2.10', '29 сентября 2026', ['Стикеры: при перетаскивании стикер больше не отстаёт от пальца']],
            ['3.2.9', '29 сентября 2026', [
                'Стикеры: в режиме правки их можно перетаскивать мышью и пальцем — как иконки на рабочем столе телефона, остальные плавно разъезжаются']],
            ['3.2.8', '29 сентября 2026', [
                'Кнопка «Обновить» больше не сдвигает плашку версии']],
            ['3.2.5 – 3.2.7', '27–28 сентября 2026', [
                'Заставка в светлой теме — светлый фон и тёмные буквы',
                'Плашка версии открывает «Что нового» — это окно',
                'На компьютере плашка версии стоит ровно по центру под иконкой',
                'Пост с картинкой только в репосте больше не прозрачный']],
            ['3.2.1 – 3.2.4', '27 сентября 2026', [
                'Стикеры отправляются без перезагрузки страницы — как обычная картинка через скрепку',
                'Стикеры, загруженные с другого аккаунта, снова отправляются',
                'Светлая тема: размытый фон постов светлый, а не серый',
                '«Сообщения» на компьютере — отдельная карточка; прокрутка в них не двигает страницу, меню не тускнеет',
                'Уведомления на телефоне снова видны при уменьшенных анимациях']],
            ['3.2.0', '26 сентября 2026', [
                'Большая уборка кода: всё работает как раньше, только надёжнее',
                'Стикеры: обрезку можно двигать пальцем, снятый крестиком стикер больше не уходит с комментарием',
                '«Клуб ИТД X» не ломается от испорченных данных']],
            ['3.0.23 – 3.1.26', '25–26 сентября 2026', [
                '«Сообщения» — первая версия лички',
                '«Создать пост» — бугорок по центру нижней панели',
                'Заставка на телефоне ждёт касания и играет со звуком',
                'Планшет боком — версия для компьютера (настройка «Версия для ПК на планшете»)',
                'Баннер: картинку можно двигать пальцем',
                '«Анти цензура» выключается сразу, без перезагрузки',
                'Телефон: всё работает быстрее и плавнее']]
        ];
        function markChangelogChips() {
            const unseen = GM_getValue('changelogSeen', '') !== CHANGELOG[0][0];
            document.querySelectorAll('.vp-version-chip').forEach(c => {
                c.classList.toggle('vp-news', unseen);
                if (!c.hasAttribute('role')) { c.setAttribute('role', 'button'); c.tabIndex = 0; c.title = 'Что нового в ИТД X'; }
            });
        }
        function openChangelog() {
            if (document.querySelector('.vp-news-back')) return;
            const back = document.createElement('div');
            back.className = 'vp-news-back';
            back.innerHTML = `<div class="vp-news-box" role="dialog" aria-label="Что нового в ИТД X"><div class="vp-news-head"><b>Что нового в ИТД X</b>
            <button type="button" class="vp-news-x" aria-label="Закрыть">${svgIcon(GLYPH.close, 18)}</button></div><div class="vp-news-list"></div></div>`;
            const list = back.querySelector('.vp-news-list');
            for (const [v, date, items] of CHANGELOG) {
                const sec = document.createElement('section');
                sec.className = 'vp-news-ver';
                sec.innerHTML = '<div class="vp-news-tag"><span></span><em></em></div><ul></ul>';
                sec.querySelector('span').textContent = 'v' + v;
                sec.querySelector('em').textContent = date;
                sec.querySelector('em').style.fontStyle = 'normal';
                for (const t of items) { const li = document.createElement('li'); li.textContent = t; sec.lastChild.appendChild(li); }
                list.appendChild(sec);
            }
            const close = fromHistory => {
                back.remove(); removeEventListener('keydown', onKey, true); removeEventListener('popstate', onPop);
                if (fromHistory !== true) stackLeave('vpNews');
            };
            const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
            const onPop = () => { if (!overlayAt('vpNews')) close(true); };
            back.addEventListener('click', e => { if (e.target === back) close(); });
            back.querySelector('.vp-news-x').onclick = () => close();
            addEventListener('keydown', onKey, true);
            document.body.appendChild(back);
            stackEnter('vpNews');
            addEventListener('popstate', onPop);
            GM_setValue('changelogSeen', CHANGELOG[0][0]);
            markChangelogChips();
        }
        document.addEventListener('click', e => {
            const chip = e.target.closest && e.target.closest('.vp-version-chip');
            if (!chip) return;
            e.preventDefault();
            e.stopPropagation();
            openChangelog();
        }, true);
        document.addEventListener('keydown', e => {
            if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('vp-version-chip')) { e.preventDefault(); openChangelog(); }
        });
        onDom(function changelogChips() { if (document.querySelector('.vp-version-chip:not([role])')) markChangelogChips(); });

        let token = null, tokenTime = 0, tokenPending = null;
        function getAccessToken(force) {
            if (!force && siteAuth.token && siteAuth.at > tokenTime && Date.now() - siteAuth.at < 4 * 60 * 1000) { token = siteAuth.token; tokenTime = siteAuth.at; }
            if (!force && token && Date.now() - tokenTime < 4 * 60 * 1000) return Promise.resolve(token);
            if (!tokenPending) {
                tokenPending = fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
                    .then(r => r.json())
                    .then(d => { token = d.accessToken; tokenTime = Date.now(); return token; })
                    .finally(() => { tokenPending = null; });
            }
            return tokenPending;
        }
        function noteServerTime(res, t0, t1) {
            const d = Date.parse((res && res.headers && res.headers.get('date')) || '');
            if (!d) return;
            const s = noteServerTime.s || (noteServerTime.s = []);
            s.push(d + 500 - (t0 + t1) / 2);
            if (s.length > 9) s.shift();
            const o = s.slice().sort((a, b) => a - b);
            noteServerTime.v = o[o.length >> 1];
        }
        function srvNow() { const v = noteServerTime.v || 0; return Date.now() + (Math.abs(v) > 1500 ? v : 0); }
        function sendComment(postId, content) { return api(`/api/posts/${postId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }); }
        function editComment(id, content) { return api(`/api/comments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }); }
        async function api(path, opts = {}) {
            const call = async t => { const t0 = Date.now(), r = await fetch(path, { credentials: 'include', ...opts, headers: { ...opts.headers, Authorization: `Bearer ${t}` } }); noteServerTime(r, t0, Date.now()); return r; };
            let res = await call(await getAccessToken());
            if (res.status === 401) res = await call(await getAccessToken(true));
            apiPause(res);
            return res;
        }

        function hashString(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash = hash & hash;
            }
            return Math.abs(hash).toString(36);
        }
        function generateCode(username) {
            return hashString(username + SECRET_SALT).substring(0, 8).padEnd(8, '0');
        }
        function parseCode(commentText) {
            const match = (commentText || '').match(/^([A-Za-z0-9]{8})(\d+)$/);
            return match ? { code: match[1], flags: match[2] } : null;
        }
        const isModCode = (username, parsed) => parsed && parsed.flags[0] === '1' && parsed.code === generateCode(username);
        const isAuthorCode = (author, parsed) => !!author && !!parsed && parsed.flags[0] === '1'
            && ((author.id && parsed.code === generateCode(author.id)) || (author.username && parsed.code === generateCode(author.username)));

        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const OBF_KEY = new TextEncoder().encode('ITDX|2026|комменты от рандомов|NeuroSFW');
        const obfBytes = (u8, salt) => { const o = new Uint8Array(u8.length); for (let i = 0; i < u8.length; i++) o[i] = u8[i] ^ OBF_KEY[(i + salt) % OBF_KEY.length] ^ ((salt * 31 + i * 7) & 255); return o; };
        const sealB64 = u8 => { let t = ''; for (const x of u8) t += String.fromCharCode(x); return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
        const openB64 = t => Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - t.length % 4) % 4)), c => c.charCodeAt(0));
        function sealText(t) {
            const salt = (Math.random() * 256) | 0, body = obfBytes(new TextEncoder().encode(t), salt), out = new Uint8Array(body.length + 1);
            out[0] = salt; out.set(body, 1);
            return 'ITDXE ' + sealB64(out);
        }
        function openText(content) {
            const t = String(content || '').trim();
            if (!t.startsWith('ITDXE ')) return t;
            try { const b = openB64(t.slice(6)); return new TextDecoder().decode(obfBytes(b.slice(1), b[0])); } catch (e) { return ''; }
        }

        function parseOwnerList(comments, prefix) {
            const map = new Map();
            for (const c of comments) {
                const a = c.author;
                if (!a || a.id !== OWNER_ID) continue;
                const text = openText(c.content);
                if (text !== prefix && !text.startsWith(prefix + ' ')) continue;
                const rest = text.slice(prefix.length).trim();
                if (!rest) continue;
                for (const tok of rest.split(/\s+/)) {
                    const m = tok.match(/^([0-9a-f-]{36})(?::(\d+))?$/i);
                    if (!m || !UUID_RE.test(m[1])) continue;
                    const k = m[1].toLowerCase(), v = m[2] ? +m[2] : 0;
                    map.set(k, Math.max(map.get(k) || 0, v));
                }
            }
            return map;
        }

        function parseRequests(comments) {
            const map = new Map();
            for (const c of comments) {
                const a = c.author, m = openText(c.content).match(/^ITDX-R (\d+)$/);
                if (!a || !a.id || !m) continue;
                const k = String(a.id).toLowerCase();
                map.set(k, Math.max(map.get(k) || 0, +m[1]));
            }
            return map;
        }

        function parseAllOwnerLists(comments) {
            return {
                approved: parseOwnerList(comments, 'ITDX-V'),
                seen: parseOwnerList(comments, 'ITDX-SEEN'),
                cooldown: parseOwnerList(comments, 'ITDX-C'),
                request: parseRequests(comments),
            };
        }

        function verifyTimeline(id, lists, now) {
            const out = (state, extra) => Object.assign({ state, seenCur: 0, needRequest: false, until: 0 }, extra);
            if (!id) return out('quarantine');
            const key = String(id).toLowerCase();
            if (lists.approved.has(key)) return out('approved');
            const cd = (lists.cooldown.get(key) || 0) * 1000;
            const seen = (lists.seen.get(key) || 0) * 1000;
            const req = ((lists.request && lists.request.get(key)) || 0) * 1000;
            const sCur = seen && (!cd || seen > cd - COOLDOWN_MS) ? seen : 0;
            if (cd > now) return out('none', { until: cd });
            let cdEnd = cd;
            if (sCur) {
                if (now < sCur + QUARANTINE_MS) return out('quarantine', { seenCur: sCur, until: sCur + QUARANTINE_MS });
                if (now < sCur + QUARANTINE_MS + COOLDOWN_MS) return out('none', { until: sCur + QUARANTINE_MS + COOLDOWN_MS });
                cdEnd = Math.max(cdEnd, sCur + QUARANTINE_MS + COOLDOWN_MS);
            }
            if (cdEnd && req < cdEnd) return out('none', { needRequest: true });
            return out('quarantine');
        }

        function resolveVerifyState(id, lists, now) {
            return verifyTimeline(id, lists, now).state;
        }

        function verifiedNames() {
            try {
                const all = readVerified();
                return Object.keys(all).filter(n => all[n] && all[n].state === 'approved');
            } catch (e) { return []; }
        }

        function verifiedPending() {
            try {
                const all = readVerified();
                return Object.keys(all).filter(n => all[n] && all[n].state === 'quarantine');
            } catch (e) { return []; }
        }

        let verifyLoad = null, verifyLoadAt = 0;
        async function allComments(postId, maxPages = 30) {
            const all = [];
            let cursor = null;
            for (let page = 0; page < maxPages; page++) {
                const res = await api(`/api/posts/${postId}/comments?limit=100` + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
                if (!res.ok) throw new Error('комментарии: ' + res.status);
                const j = await res.json(), d = j.data || j;
                const list = d.comments || [];
                if (page && list.length && all.some(c => c.id === list[0].id)) break;
                all.push(...list);
                cursor = d.nextCursor || null;
                if (!cursor || !d.hasMore && d.hasMore !== undefined || !list.length) break;
            }
            return all;
        }
        function loadVerificationComments(fresh) {
            if (!fresh && verifyLoad && Date.now() - verifyLoadAt < 20000) return verifyLoad;
            verifyLoadAt = Date.now();
            verifyLoad = allComments(VERIFICATION_POST_ID);
            verifyLoad.catch(() => { verifyLoad = null; });
            return verifyLoad;
        }
        function verifiedInfo(name) {
            try { return readVerified()[name] || null; } catch (e) { return null; }
        }

        async function checkAllComments(fresh) {
            if (isVerifying) return null;
            isVerifying = true;
            try {
                const comments = await loadVerificationComments(fresh);
                const lists = parseAllOwnerLists(comments);
                const now = Date.now();
                const verifiedUsers = {}, looks = new Map(), lookAt = new Map(), myId = (meData && meData.id) || (siteAuth.me && siteAuth.me.id) || '';
                for (const c of comments) {
                    const a = c.author;
                    if (!a || !a.id || looks.has(a.id)) continue;
                    const l = parseLook(c.content);
                    if (l) { looks.set(a.id, l); if (l.t) lookAt.set(a.id, l.t * 864e5); }
                }
                for (const c of comments) {
                    const name = c.author?.username;
                    const parsed = parseCode(c.content);
                    if (!name || verifiedUsers[name] || !isAuthorCode(c.author, parsed)) continue;
                    const a = c.author, ava = a.avatar && (a.avatar.url || a.avatar) || a.avatarUrl || a.emoji;
                    const seen = Math.max(lookAt.get(a.id) || 0, GONE_FROM);
                    const gone = a.id !== OWNER_ID && a.id !== myId && !(myUsername && name === myUsername) && now - seen > GONE_MS;
                    verifiedUsers[name] = {
                        code: parsed.code, commentId: c.id, hasMod: true, flags: parsed.flags,
                        id: a.id || undefined,
                        displayName: a.displayName || a.display_name || undefined,
                        avatar: typeof ava === 'string' ? ava : undefined,
                        state: a.id === OWNER_ID ? 'approved' : gone ? 'gone' : resolveVerifyState(a.id, lists, now),
                        look: gone ? undefined : looks.get(a.id) || undefined
                    };
                }
                if (JSON.stringify(verifiedUsers) !== localStorage.getItem(VERIFICATION_STORAGE_KEY)) {
                    localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(verifiedUsers));
                }
                return verifiedUsers;
            } catch (e) {
                console.warn('[ITD VP] верификация:', e);
                logErr('верификация', e);
                return null;
            } finally {
                isVerifying = false;
            }
        }

        async function verifyRequestAgain() {
            const myId = meData && meData.id;
            if (!myId || myId === OWNER_ID) return;
            try {
                const all = await loadVerificationComments();
                if (!verifyTimeline(myId, parseAllOwnerLists(all), Date.now()).needRequest) return;
                const content = sealText('ITDX-R ' + Math.floor(Date.now() / 1000));
                const mine = all.find(c => c.author && c.author.id === myId && /^ITDX-R \d+$/.test(openText(c.content)));
                const res = mine
                    ? await editComment(mine.id, content)
                    : await sendComment(VERIFICATION_POST_ID, content);
                if (res.ok) await checkAllComments(true);
            } catch (e) { logErr('запрос галочки', e); }
        }

        async function verifyMyself() {
            if (!myUsername) return false;
            try {
                const all = await loadVerificationComments();
                const myId = (meData && meData.id) || (all.find(c => c.author?.username === myUsername) || {}).author?.id;
                const mine = all.filter(c => (myId ? c.author?.id === myId : c.author?.username === myUsername) && parseCode(c.content));
                const byId = c => myId && parseCode(c.content).code === generateCode(myId);
                if (!myId && mine.some(c => isModCode(myUsername, parseCode(c.content)))) return true;
                if (mine.some(byId)) return true;
                const code = generateCode(myId || myUsername) + '1';
                const stale = mine.find(c => !isAuthorCode(c.author, parseCode(c.content)));
                const res = stale
                    ? await api(`/api/comments/${stale.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: code }) })
                    : await api(`/api/posts/${VERIFICATION_POST_ID}/comments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: code })
                    });
                if (!res.ok) return false;
                await checkAllComments(true);
                return true;
            } catch (e) {
                console.warn('[ITD VP] верификация себя:', e);
                logErr('верификация себя', e);
                return false;
            }
        }

        const styleScrollTop = addCss(`
        .itd-scroll-top-btn {
            position: fixed !important; bottom: 16px !important; right: 16px !important;
            width: 64px !important; height: 64px !important;
            display: flex !important; align-items: center !important; justify-content: center !important;
            background: var(--glass-bg) !important;
            -webkit-backdrop-filter: blur(16px) !important; backdrop-filter: blur(16px) !important;
            border: none !important; border-radius: 32px !important; cursor: pointer !important;
            pointer-events: auto !important; color: var(--text-primary) !important;
            box-shadow: var(--shadow-elevated) !important;
            transition: opacity 0.2s ease, visibility 0.2s ease !important;
            margin: 0 !important; padding: 0 !important;
            opacity: 0 !important; visibility: hidden !important;
        }
        .itd-scroll-top-btn.vp-shown { opacity: 1 !important; visibility: visible !important; }
        .itd-scroll-top-btn::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 1px;
            background: linear-gradient(to bottom, #ffffff40, #ffffff0d);
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
        }
        @media (max-width: ${PHONE_MAX}px) {
            .itd-scroll-top-btn { z-index: 1 !important; bottom: 100px !important; }
            html.vp-has-up, html.vp-has-up body { overscroll-behavior: none !important; }
            html.vp-has-up ::-webkit-scrollbar { display: none !important; }
            html.vp-has-up .vp-nick-large { display: flex; flex-direction: column; align-items: center; gap: 4px; }
            .nick-wrapper { display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 4px !important; }
        }
    `);

        let scrollTopButton = null;
        function createScrollTopButton() {
            if (scrollTopButton) return;
            scrollTopButton = document.createElement('button');
            scrollTopButton.className = 'itd-scroll-top-btn';
            scrollTopButton.innerHTML = ICONS.SCROLL_TOP;
            scrollTopButton.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
            document.body.appendChild(scrollTopButton);
            document.documentElement.classList.add('vp-has-up');
            const toggle = () => scrollTopButton.classList.toggle('vp-shown', window.scrollY > 300);
            window.addEventListener('scroll', toggle, { passive: true });
            toggle();
            placeNickWrapper();
        }

        const narrowScreen = matchMedia(`(max-width: ${PHONE_MAX}px)`);
        function placeNickWrapper() {
            const nick = siteEl('nickLarge');
            if (!nick) return;
            const wrapper = nick.querySelector(':scope > .nick-wrapper');
            if (narrowScreen.matches && scrollTopButton) {
                if (wrapper) return;
                const w = document.createElement('span');
                w.className = 'nick-wrapper';
                const parts = [...nick.children];
                nick.prepend(w);
                w.append(...parts);
            } else if (wrapper) {
                wrapper.replaceWith(...wrapper.children);
            }
        }
        narrowScreen.addEventListener('change', placeNickWrapper);
        onDom(placeNickWrapper);

        async function initVisuals() {
            try {
                const me = siteAuth.me || await new Promise(done => { siteAuth.meWait.push(done); setTimeout(() => done(null), 1500); })
                    || await (await api('/api/users/me')).json();
                if (!me || !me.username) return;
                meData = me;
                myUsername = me.username;
                reloadAutoLike();
                myDisplayName = me.displayName || me.username;
                tagAll();
                try { placeRail(); } catch (e) { }

                createScrollTopButton();

                checkAllComments().then(() => { markVerifiedUsers(); return verifyMyself(); }).then(verifyRequestAgain).then(publishLook);
                setInterval(publishLook, 60000);
                setInterval(() => { if (!document.hidden && !apiPaused()) checkAllComments(); }, 10 * 60 * 1000);

                lbSyncFromServer();

                function findAllMyAvatars() {
                    const primaryAvatar = myAvatarEl();
                    if (primaryAvatar) glowMyAvatar(primaryAvatar);
                    const me = myUsername.toLowerCase();
                    const isMe = href => ((href || '').split('/@')[1] || '').split(/[/?#]/)[0].toLowerCase() === me;
                    document.querySelectorAll('.' + SELECTORS.avatar).forEach(avatar => {
                        const link = avatar.closest(PROFILE_LINK);
                        if (link) { if (isMe(link.getAttribute('href'))) glowMyAvatar(avatar); return; }
                        if (avatar.closest('.' + SELECTORS.post)) return;
                        const inComposer = avatar.parentElement && avatar.parentElement.querySelector('[contenteditable="true"]');
                        if (inComposer || (isMe(location.pathname) && nearLargeNick(avatar))) glowMyAvatar(avatar);
                    });
                }
                function nearLargeNick(el) {
                    for (let p = el, i = 0; p && i < 5; p = p.parentElement, i++) {
                        if (p.querySelector('.' + SELECTORS.nickLarge)) return true;
                    }
                    return false;
                }

                function findAllMyNicks() {
                    const myUsernameLower = myUsername.toLowerCase();
                    const myDisplayNameLower = myDisplayName.toLowerCase();

                    document.querySelectorAll('.' + SELECTORS.nickText).forEach(nickSpan => {
                        const nickText = nickSpan.textContent.trim();
                        const nickTextLower = nickText.toLowerCase();
                        if (nickTextLower !== myUsernameLower && nickTextLower !== myDisplayNameLower) return;

                        let container = nickSpan.closest('.' + SELECTORS.nickRow);
                        if (!container) container = nickSpan.closest('.' + SELECTORS.nickContainer);
                        if (!container) container = nickSpan.closest('header');
                        if (!container) return;

                        markMyNick(nickSpan);

                        const isLarge = !!nickSpan.closest('.' + SELECTORS.nickLarge);
                        if (!container.querySelector('.' + SELECTORS.badgeVoronoi)) {
                            const size = isLarge ? 18 : 16;
                            const badgeSVG = ICONS.badge(size);
                            const badge = document.createElement('span');
                            badge.className = SELECTORS.badgeVoronoi;
                            badge.innerHTML = badgeSVG;
                            badge.style.setProperty('--vp-badge', size + 'px');
                            nickSpan.parentNode.insertBefore(badge, nickSpan.nextSibling);
                        }

                        if (isLarge) {
                            const ru5n = container.closest('.' + SELECTORS.nickRow) || container;
                            addToggleButtonToNick(ru5n);
                        }
                    });
                }

                const userOf = href => ((href || '').split('/@')[1] || '').split(/[/?#]/)[0].toLowerCase();
                function nickLeaf(root) {
                    const tagged = root.querySelector('.' + SELECTORS.nickText);
                    if (tagged) return tagged;
                    return [...root.querySelectorAll('span, p, div')].find(e => {
                        if (e.children.length) return false;
                        const t = e.textContent.trim();
                        return t && !t.startsWith('@') && /[\p{L}\p{N}]/u.test(t)
                            && !e.closest('.' + SELECTORS.avatar + ', .' + SELECTORS.badgeVerify + ', .' + SELECTORS.badgeVoronoi + ', time');
                    }) || null;
                }
                function addVerifyBadge(nick, size, state) {
                    if (!nick) return; const vpR = nick.closest('.' + SELECTORS.nickContainer); const vpN = nick.nextElementSibling; const vpOk = vpN && vpN.classList.contains(SELECTORS.badgeVerify) ? vpN : null; if (vpR) vpR.querySelectorAll('.' + SELECTORS.badgeVerify).forEach(function (x) { if (x !== vpOk) x.remove(); }); if (vpOk) return;
                    const badge = document.createElement('span');
                    badge.className = SELECTORS.badgeVerify + (state === 'quarantine' ? ' vp-badge-quarantine' : '');
                    badge.innerHTML = ICONS.badge(size);
                    badge.style.setProperty('--vp-badge', size + 'px');
                    if (state === 'quarantine') {
                        const p = badge.querySelector('path[fill^="url"]');
                        if (p) p.setAttribute('fill', '#7a7a82');
                    }
                    nick.insertAdjacentElement('afterend', badge);
                }
                let verifiedRaw = null, verifiedSet = new Set(), verifiedPendingSet = new Set(), verifiedById = new Map();
                const loneNicks = () => [...document.querySelectorAll('[data-user-name]')].filter(el => !el.closest(PROFILE_LINK))
                    .map(el => ({ el, u: verifiedById.get(String(el.getAttribute('data-user-name')).toLowerCase()) })).filter(x => x.u);
                function markVerifiedUsers() {
                    const raw = localStorage.getItem(VERIFICATION_STORAGE_KEY) || '{}';
                    if (raw !== verifiedRaw) {
                        verifiedRaw = raw;
                        verifiedSet = new Set();
                        verifiedPendingSet = new Set();
                        let parsed;
                        try { parsed = JSON.parse(raw) || {}; } catch (e) { parsed = {}; }
                        approvedIds = new Set();
                        verifiedById = new Map();
                        for (const [name, info] of Object.entries(parsed)) {
                            if (!info || !info.state) continue;
                            if (info.id) verifiedById.set(String(info.id).toLowerCase(), name.toLowerCase());
                            if (info.state === 'approved') {
                                verifiedSet.add(name.toLowerCase());
                                if (info.id) approvedIds.add(String(info.id).toLowerCase());
                            } else if (info.state === 'quarantine') verifiedPendingSet.add(name.toLowerCase());
                        }
                    }
                    const allNames = new Set([...verifiedSet, ...verifiedPendingSet]);
                    allNames.delete((myUsername || '').toLowerCase());
                    if (!allNames.size) return;
                    const stateOf = u => verifiedSet.has(u) ? 'approved' : 'quarantine';
                    document.querySelectorAll(PROFILE_LINK).forEach(link => {
                        const u = userOf(link.getAttribute('href'));
                        if (allNames.has(u)) addVerifyBadge(nickLeaf(link), 16, stateOf(u));
                    });
                    document.querySelectorAll('.' + SELECTORS.nickContainer).forEach(c => {
                        if (c.closest(PROFILE_LINK)) return;
                        const login = atLoginOf(c);
                        if (login && allNames.has(login.toLowerCase()))
                            addVerifyBadge(nickLeaf(c), c.matches('.' + SELECTORS.nickLarge) ? 18 : 16, stateOf(login.toLowerCase()));
                    });
                    loneNicks().forEach(({ el, u }) => { if (allNames.has(u)) addVerifyBadge(nickLeaf(el), el.closest('.' + SELECTORS.repost) ? 14 : 16, stateOf(u)); });
                }

                let lookRaw = null, lookBy = new Map();
                function markLooks() {
                    const me = (myUsername || '').toLowerCase();
                    const pm = location.pathname.match(/^\/@([\w.]+)(\/.*)?$/), pu = pm && !/\/post\//.test(pm[2] || '') ? pm[1].toLowerCase() : '';
                    if (!showLooks) { setBgGuest(null); return; }
                    const raw = localStorage.getItem(VERIFICATION_STORAGE_KEY) || '{}';
                    if (raw !== lookRaw) {
                        lookRaw = raw;
                        lookBy = new Map();
                        let parsed = {};
                        try { parsed = JSON.parse(raw) || {}; } catch (e) { }
                        for (const [name, info] of Object.entries(parsed)) if (info && info.look) lookBy.set(name.toLowerCase(), info.look);
                    }
                    setBgGuest(pu && pu !== me ? lookBy.get(pu) : null);
                    if (!lookBy.size) return;
                    const put = (el, attr, val) => {
                        if (!el) return;
                        if (val) { if (el.getAttribute(attr) !== val) el.setAttribute(attr, val); }
                        else if (el.hasAttribute(attr)) el.removeAttribute(attr);
                    };
                    const apply = (nick, avatar, look) => {
                        if (nick) {
                            put(nick, 'data-vp-look', look.n);
                            const box = nick.closest('.' + SELECTORS.nickContainer) || nick.parentElement;
                            put(box, 'data-vp-look-glow', look.g[0] === '1' ? look.n : '');
                            if (box && look.g[0] === '1') glowRoom(box);
                        }
                        if (avatar) put(avatar, 'data-vp-look-av', look.g[1] === '1' ? look.n : '');
                    };
                    document.querySelectorAll(PROFILE_LINK).forEach(link => {
                        const u = userOf(link.getAttribute('href'));
                        const look = u !== me && lookBy.get(u);
                        if (!look) return;
                        const av = link.querySelector('.' + SELECTORS.avatar);
                        if (av) apply(null, av, look); else apply(nickLeaf(link), null, look);
                    });
                    loneNicks().forEach(({ el, u }) => {
                        const look = u !== me && lookBy.get(u);
                        if (!look) return;
                        apply(nickLeaf(el), [...(el.parentElement || el).children].find(x => x.matches('.' + SELECTORS.avatar)) || null, look);
                    });
                    const look = pu && pu !== me && lookBy.get(pu);
                    if (look) {
                        const large = siteEl('nickLarge');
                        if (large) apply(nickLeaf(large), null, look);
                        document.querySelectorAll('.' + SELECTORS.avatar).forEach(av => {
                            if (!av.closest(PROFILE_LINK) && !av.closest('.' + SELECTORS.post) && nearLargeNick(av)) apply(null, av, look);
                        });
                    }
                }

                findAllMyAvatars();
                findAllMyNicks();

                markVerifiedUsers();
                markLooks();
                onDom(function myNickAndAvatar() {
                    findAllMyAvatars();
                    findAllMyNicks();
                    markVerifiedUsers();
                    markLooks();
                });

                function replaceIcon() {
                    let container = siteEl('logoContainer');
                    if (!container) return;
                    const customLink = container.querySelector(`a[href="${TG_URL}"]`);
                    if (customLink) return;
                    const oldSvg = container.querySelector('svg');
                    if (!oldSvg) return;
                    const logo = scriptLogo(36);
                    if (!logo) return;
                    const link = document.createElement('a');
                    link.href = TG_URL;
                    link.target = '_blank';
                    link.style.cursor = 'pointer';
                    link.style.display = 'inline-flex';
                    link.style.alignItems = 'center';
                    link.appendChild(logo);
                    const versionBtn = container.querySelector('.' + SELECTORS.versionBtn);
                    let bottomBlock = container.querySelector('.vp-version-row');
                    container.innerHTML = '';
                    container.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start; gap: 4px;';
                    const topRow = document.createElement('div');
                    topRow.className = 'vp-logo-top';
                    const iconCol = document.createElement('div');
                    iconCol.className = 'vp-logo-col';
                    iconCol.appendChild(link);
                    topRow.appendChild(iconCol);
                    const siteVer = versionBtn || document.createElement('button');
                    if (!versionBtn) { siteVer.className = SELECTORS.versionBtn; siteVer.textContent = 'v1.1.1'; }
                    siteVer.style.margin = '0';
                    siteVer.style.padding = '0';
                    topRow.appendChild(siteVer);
                    container.appendChild(topRow);
                    const container0 = container;
                    container = iconCol;
                    if (bottomBlock) {
                        bottomBlock.style.margin = '0';
                        bottomBlock.style.justifyContent = 'center';
                        container.appendChild(bottomBlock);
                    } else {
                        const newBottom = document.createElement('div');
                        newBottom.className = 'vp-version-row';
                        const versionSpan = document.createElement('span');
                        versionSpan.className = 'vp-version-chip';
                        versionSpan.title = 'ИТД X';
                        versionSpan.textContent = 'v' + GM_info.script.version;
                        newBottom.appendChild(versionSpan);
                        container.appendChild(newBottom);
                        container0._bottomBlock = newBottom;
                    }
                    markChangelogChips();
                }

                replaceIcon();

                onDom(function logoIcon() { replaceIcon(); });

                let resizeTimer;
                window.addEventListener('resize', () => {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(() => {
                        replaceIcon();
                        updateNavIcon();
                    }, 300);
                });

                const updateUrl = 'https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/main/ITD-Visual-Pack.user.js?t=' + Date.now();
                const UPDATE_EVERY = 10 * 60 * 1000;
                let updateAskedAt = 0;
                function latestVersion(fresh) {
                    let cached = null;
                    try { cached = JSON.parse(GM_getValue('vp_latest', 'null')); } catch (e) { }
                    if (cached && (versionCompare(cached.v, GM_info.script.version) > 0 || !fresh && Date.now() - cached.at < UPDATE_EVERY)) {
                        return Promise.resolve(cached.v);
                    }
                    updateAskedAt = Date.now();
                    return new Promise(resolve => GM_xmlhttpRequest({
                        method: 'GET',
                        url: updateUrl.replace(/t=\d+$/, 't=' + Date.now()),
                        headers: { Range: 'bytes=0-2047' },
                        onload: res => {
                            const m = (res.status === 200 || res.status === 206) && res.responseText.match(/\/\/\s*@version\s+([\d.]+)/);
                            if (m) GM_setValue('vp_latest', JSON.stringify({ v: m[1], at: Date.now() }));
                            resolve(m ? m[1] : null);
                        },
                        onerror: e => { console.warn('[ITD VP] обновление: GitHub не ответил', e); resolve(null); }
                    }));
                }

                function versionCompare(v1, v2) {
                    const a = v1.split('.').map(Number);
                    const b = v2.split('.').map(Number);
                    for (let i = 0; i < Math.max(a.length, b.length); i++) {
                        const na = a[i] || 0, nb = b[i] || 0;
                        if (na > nb) return 1;
                        if (na < nb) return -1;
                    }
                    return 0;
                }

                function createUpdateButton() {
                    const container = siteEl('logoContainer');
                    if (!container) return;
                    if (container.querySelector('.itd-update-sidebar-btn')) return;
                    const row = container.querySelector('.vp-version-row');
                    if (!row) return;
                    const btn = document.createElement('button');
                    btn.className = 'itd-update-sidebar-btn';
                    btn.title = 'Доступна новая версия';
                    btn.innerHTML = ICONS.UPDATE + ' <span>Обновить</span>';
                    btn.onclick = function () { window.open(updateUrl, '_blank'); this.remove(); };
                    row.appendChild(btn);
                }

                let updateAvailable = false;
                const updateCheck = latestVersion().then(v => {
                    updateAvailable = !!v && versionCompare(v, GM_info.script.version) > 0;
                    console.log(`[ITD VP] обновление: на GitHub ${v || '?'}, у тебя ${GM_info.script.version}${updateAvailable ? ' — есть новее' : ''}`);
                    return updateAvailable;
                });
                updateCheck.then(yes => { if (yes) setTimeout(createUpdateButton, 1000); });
                let updateTimer = 0;
                function updatePoll() {
                    if (updateAvailable) { clearInterval(updateTimer); return; }
                    if (document.hidden || Date.now() - updateAskedAt < UPDATE_EVERY - 5000) return;
                    latestVersion(true).then(v => {
                        if (updateAvailable || !v || versionCompare(v, GM_info.script.version) <= 0) return;
                        updateAvailable = true;
                        clearInterval(updateTimer);
                        document.removeEventListener('visibilitychange', updatePoll);
                        console.log(`[ITD VP] обновление: вышла ${v}, у тебя ${GM_info.script.version}`);
                        createUpdateButton();
                    });
                }
                updateCheck.then(yes => {
                    if (yes) return;
                    updateAskedAt = updateAskedAt || Date.now();
                    updateTimer = setInterval(updatePoll, 60 * 1000);
                    document.addEventListener('visibilitychange', updatePoll);
                });

                const originalReplaceIcon = replaceIcon;
                replaceIcon = function () {
                    originalReplaceIcon();
                    if (updateAvailable) createUpdateButton();
                };

                function createNavIcon() {
                    const nav = siteEl('feedBar');
                    if (!nav) return;
                    if (nav.querySelector('.my-nav-block')) return;

                    const block = document.createElement('div');
                    block.className = 'my-nav-block';
                    block.style.cssText = 'display: flex; align-items: center; gap: 12px; flex-shrink: 0;';

                    const wrapper = document.createElement('div');
                    wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 2px;';

                    const logo = scriptLogo(28);
                    if (!logo) return;
                    const link = document.createElement('a');
                    link.href = TG_URL;
                    link.target = '_blank';
                    link.style.cursor = 'pointer';
                    link.style.display = 'inline-flex';
                    link.style.alignItems = 'center';
                    link.appendChild(logo);
                    wrapper.appendChild(link);

                    const bottomRow = document.createElement('div');
                    bottomRow.className = 'vp-version-row vp-version-col';

                    const versionSpan = document.createElement('span');
                    versionSpan.className = 'vp-version-chip';
                    versionSpan.textContent = 'v' + GM_info.script.version;
                    bottomRow.appendChild(versionSpan);

                    const updateBtn = document.createElement('button');
                    updateBtn.className = 'itd-update-sidebar-btn';
                    updateBtn.title = 'Доступна новая версия';
                    updateBtn.innerHTML = ICONS.UPDATE + ' <span>Обновить</span>';
                    updateBtn.style.display = 'none';
                    updateBtn.onclick = function () {
                        window.open(updateUrl, '_blank');
                        this.remove();
                    };
                    bottomRow.appendChild(updateBtn);

                    wrapper.appendChild(bottomRow);
                    block.appendChild(wrapper);
                    markChangelogChips();

                    nav.prepend(block);
                    fixNavLayout();

                    updateCheck.then(yes => { if (yes) updateBtn.style.display = 'inline-flex'; });
                }

                function fixNavLayout() {
                    const nav = siteEl('feedBar');
                    if (!nav) return;
                    const block = nav.querySelector('.my-nav-block');
                    const tabs = nav.querySelector('.' + SELECTORS.tabs);
                    if (block && tabs) {
                        tabs.style.flex = '1 1 auto';
                        tabs.style.minWidth = '0';
                        tabs.style.width = 'auto';
                        block.style.flex = '0 0 auto';
                        nav.style.display = 'flex';
                        nav.style.width = '100%';
                        const logo = block.querySelector('img.vp-app-logo'), chip = block.querySelector('.vp-version-row');
                        const h = tabs.getBoundingClientRect().height;
                        if (logo && chip && h) {
                            const size = Math.round(Math.max(28, Math.min(48, h - chip.offsetHeight - 4)));
                            if (logo.width !== size) {
                                logo.width = logo.height = size;
                                logo.style.width = logo.style.height = size + 'px';
                                logo.style.borderRadius = Math.round(size * 0.25) + 'px';
                            }
                            block.style.alignSelf = 'center';
                            block.style.height = h + 'px';
                            block.firstElementChild.style.justifyContent = 'space-between';
                            block.firstElementChild.style.height = '100%';
                        }
                    }
                }

                function updateNavIcon() {
                    const nav = siteEl('feedBar');
                    if (!nav) return;
                    const isMobile = window.innerWidth <= PHONE_MAX;
                    const block = nav.querySelector('.my-nav-block');
                    const tabs = nav.querySelector('.' + SELECTORS.tabs);

                    if (isMobile) {
                        if (!block) {
                            createNavIcon();
                        } else {
                            fixNavLayout();
                        }
                    } else {
                        if (block) block.remove();
                        if (tabs) {
                            tabs.style.flex = '';
                            tabs.style.minWidth = '';
                            tabs.style.width = '';
                        }
                        nav.style.width = '';
                        nav.style.display = '';
                    }
                }

                setTimeout(updateNavIcon, 500);

                onDom(function clanTabName() {
                    document.querySelectorAll('.' + SELECTORS.feedBar + ' button').forEach(b => {
                        const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
                        for (let t; (t = walker.nextNode());) if (t.nodeValue.trim() === 'Лента кланов') t.nodeValue = t.nodeValue.replace('Лента кланов', 'Кланы');
                    });
                });

                onDom(function feedBarIcon() {
                    if (siteEl('feedBar')) updateNavIcon();
                });
                scheduleAutoLike();
            } catch (e) { console.warn('[ITD VP] запуск мода', e); logErr('запуск мода', e); }
        }

        let lastFrame = 0, bestGap = 1000, slow = 0, halfRate = false, odd = false, halfSince = 0, retryMs = 15000;
        function frame(t) {
            requestAnimationFrame(frame);
            if (halfRate && t - halfSince > retryMs) { halfRate = false; slow = 0; retryMs = Math.min(retryMs * 2, 240000); }
            if (halfRate && (odd = !odd)) return;
            const gap = lastFrame ? t - lastFrame : 16.7;
            lastFrame = t;
            if (gap > 0 && gap < 100) {
                const base = halfRate ? gap / 2 : gap;
                bestGap = Math.min(bestGap, base);
                slow = base > bestGap * 1.7 ? slow + 1 : Math.max(0, slow - 2);
                if (!halfRate && slow > 45) {
                    halfRate = true; halfSince = t; slow = 0;
                    document.documentElement.classList.add('vp-glass-lite');
                }
            }
            const dt = Math.min(3, gap / 50);
            if (currentStyle === 'rainbow') { stepHue(dt); paint(); }
            if (backgroundEnabled && !introOn) drawBackground(dt);
        }
        paint();
        requestAnimationFrame(frame);

        new ResizeObserver(resizeCanvas).observe(canvas);
        resizeCanvas();
        initVisuals();
        initBanner();

        (function () {
            const STORAGE_KEY = 'user_sticker_packs_v1';
            const RECENT_STORAGE_KEY = 'recent_stickers_v1';
            const MAX_NAME_LENGTH = 20;
            const DEFAULT_PACK_NAME = 'Новый пакет';
            const PANEL_WIDTH = 320;

            const readList = key => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; } };
            const writeList = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } };
            let userPacks = readList(STORAGE_KEY);
            let recentStickers = readList(RECENT_STORAGE_KEY);
            const saveUserPacks = () => { writeList(STORAGE_KEY, userPacks); packsChanged(); };
            const saveRecent = () => writeList(RECENT_STORAGE_KEY, recentStickers);
            const packStickers = key => key === 'recent' ? recentStickers : (userPacks.find(p => p.id === key) || { stickers: [] }).stickers;
            const packName = key => key === 'recent' ? 'Недавние' : ((userPacks.find(p => p.id === key) || {}).name || DEFAULT_PACK_NAME);
            const allPackKeys = () => ['recent', ...userPacks.map(p => p.id)];
            function savePack(key) { if (key === 'recent') saveRecent(); else saveUserPacks(); }

            const SYNC_TAG = 'ITDXS';
            const PACKS_AT_KEY = 'user_sticker_packs_at';
            const EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
            const CDN_IMG = /^https:\/\/cdn\.xn--d1ah4a\.com\/images\/([0-9a-f-]{36})\.(\w+)$/i;
            let packsAt = +(localStorage.getItem(PACKS_AT_KEY) || 0), syncTimer = 0, syncing = false, applyingRemote = false;
            const hexToBytes = h => Uint8Array.from(h.replace(/-/g, '').match(/../g), x => parseInt(x, 16));
            const bytesToUuid = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
            const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            function encodePacks(packs, at) {
                const out = [1], put = (...b) => out.push(...b), str = t => { const u = new TextEncoder().encode(t).slice(0, 255); put(u.length, ...u); };
                const sec = Math.floor(at / 1000);
                put((sec >>> 24) & 255, (sec >>> 16) & 255, (sec >>> 8) & 255, sec & 255, packs.length);
                for (const pk of packs) {
                    str(pk.id || ''); str(pk.name || '');
                    const list = pk.stickers.slice(0, 65535);
                    put(list.length >> 8, list.length & 255);
                    for (const st of list) {
                        const m = String(st.url || '').match(CDN_IMG), ext = m ? EXT.indexOf(m[2].toLowerCase()) : -1;
                        if (m && ext >= 0 && UUID.test(st.id || '')) { put(ext, ...hexToBytes(st.id), ...hexToBytes(m[1])); }
                        else { put(255); str(st.id || ''); str(st.url || ''); }
                    }
                }
                out[0] = 2;
                for (let i = 1; i < out.length; i++) out[i] ^= OBF_KEY[i % OBF_KEY.length];
                let bin = '';
                out.forEach(b => { bin += String.fromCharCode(b); });
                return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            }
            function decodePacks(b64) {
                const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
                const b = Uint8Array.from(bin, c => c.charCodeAt(0));
                if (b[0] === 2) { for (let i = 1; i < b.length; i++) b[i] ^= OBF_KEY[i % OBF_KEY.length]; b[0] = 1; }
                let i = 0;
                const byte = () => { if (i >= b.length) throw new Error('обрыв данных'); return b[i++]; };
                const str = () => { const n = byte(), t = new TextDecoder().decode(b.slice(i, i + n)); i += n; return t; };
                if (byte() !== 1) throw new Error('версия паков');
                const at = ((byte() << 24) >>> 0) + (byte() << 16) + (byte() << 8) + byte();
                const packs = [];
                for (let n = byte(); n > 0; n--) {
                    const pk = { id: str(), name: str(), stickers: [] };
                    for (let k = (byte() << 8) + byte(); k > 0; k--) {
                        const ext = byte();
                        if (ext === 255) { const id = str(), url = str(); pk.stickers.push({ id, url }); continue; }
                        const id = bytesToUuid(b.slice(i, i + 16)), img = bytesToUuid(b.slice(i + 16, i + 32));
                        i += 32;
                        pk.stickers.push({ id, url: `https://cdn.xn--d1ah4a.com/images/${img}.${EXT[ext] || 'png'}` });
                    }
                    packs.push(pk);
                }
                return { at: at * 1000, packs };
            }
            const myAccountId = () => (meData && meData.id) || (verifiedInfo(myUsername || '') || {}).id || null;
            const partsKey = () => 'vp_sticker_parts_' + myAccountId();
            const remotePacksAt = () => { const f = String((verifiedInfo(myUsername || '') || {}).flags || ''); return f.length > 1 ? +f.slice(1) * 1000 : 0; };
            async function packParts(scan) {
                if (!scan) { const saved = GM_getValue(partsKey(), null); if (saved) return saved; }
                const me = myAccountId();
                const list = (await allComments(STICKER_POST_ID)).filter(c => c.author && c.author.id === me && /^ITDXS \d+\/\d+ /.test(c.content || ''))
                    .map(c => { const m = c.content.match(/^ITDXS (\d+)\/(\d+) (\S*)/); return { id: c.id, i: +m[1], n: +m[2], d: m[3] }; });
                GM_setValue(partsKey(), list.map(({ id, i, n }) => ({ id, i, n })));
                return list;
            }
            function applyRemotePacks(remote) {
                applyingRemote = true;
                userPacks = remote.packs;
                writeList(STORAGE_KEY, userPacks);
                packsAt = remote.at;
                localStorage.setItem(PACKS_AT_KEY, String(packsAt));
                applyingRemote = false;
                if (scrollContainer) { updateTabButtons(); refreshAllPackGrids(); }
            }
            const patchComment = (id, content) => editComment(id, content);
            async function pullPacks() {
                const at = remotePacksAt();
                if (!at || at <= packsAt + 999) return;
                const parts = (await packParts(true)).filter(p => p.n).sort((a, b) => a.i - b.i);
                const n = parts.length && parts[0].n;
                if (!n || parts.length < n || !parts.slice(0, n).every((p, k) => p.i === k + 1 && p.n === n)) return;
                const remote = decodePacks(parts.slice(0, n).map(p => p.d).join(''));
                if (remote.at <= packsAt + 999) return;
                const legacy = !packsAt && userPacks.length ? userPacks.filter(pk => !remote.packs.some(r => r.id === pk.id)) : [];
                applyRemotePacks({ at: remote.at, packs: [...remote.packs, ...legacy] });
                if (legacy.length) { packsAt = Date.now(); localStorage.setItem(PACKS_AT_KEY, String(packsAt)); return 'push'; }
            }
            async function pushPacks() {
                const mine = verifiedInfo(myUsername || '');
                if (!mine || !mine.commentId) return;
                let parts = await packParts(false);
                if (!parts.length) parts = await packParts(true);
                if (!packsAt) { packsAt = Date.now(); localStorage.setItem(PACKS_AT_KEY, String(packsAt)); }
                const data = encodePacks(userPacks, packsAt), CH = 1900, chunks = [];
                for (let k = 0; k < data.length || !chunks.length; k += CH) chunks.push(data.slice(k, k + CH));
                const slots = parts.map(p => p.id), saved = [];
                for (let k = 0; k < Math.max(chunks.length, slots.length); k++) {
                    const content = k < chunks.length ? `${SYNC_TAG} ${k + 1}/${chunks.length} ${chunks[k]}` : `${SYNC_TAG} 0/0 -`;
                    if (slots[k]) {
                        const res = await patchComment(slots[k], content);
                        if (!res.ok) throw new Error('паки: правка ' + res.status);
                        saved.push({ id: slots[k], i: k < chunks.length ? k + 1 : 0, n: k < chunks.length ? chunks.length : 0 });
                    } else {
                        const res = await sendComment(STICKER_POST_ID, content);
                        if (!res.ok) throw new Error('паки: запись ' + res.status);
                        const j = await res.json();
                        saved.push({ id: (j.data || j).id, i: k + 1, n: chunks.length });
                    }
                }
                GM_setValue(partsKey(), saved);
                const code = String(mine.code) + '1' + Math.floor(packsAt / 1000);
                const res = await patchComment(mine.commentId, code);
                if (res.ok) await checkAllComments(true);
            }
            async function syncPacks(up) {
                if (!STICKER_POST_ID || syncing || !myUsername || !myAccountId()) return;
                syncing = true;
                try {
                    if (up) await pushPacks();
                    else {
                        const merged = await pullPacks();
                        const at = remotePacksAt();
                        if (merged === 'push' || (userPacks.length && (!packsAt || packsAt > at + 999))) await pushPacks();
                    }
                } catch (e) {
                    logErr('паки: синхронизация', e);
                } finally {
                    syncing = false;
                }
            }
            function packsChanged() {
                if (applyingRemote) return;
                packsAt = Date.now();
                localStorage.setItem(PACKS_AT_KEY, String(packsAt));
                clearTimeout(syncTimer);
                syncTimer = setTimeout(() => syncPacks(true), 4000);
            }
            (function syncLoop() {
                if (!STICKER_POST_ID) return;
                const tick = () => myUsername && myAccountId() && verifiedInfo(myUsername) ? syncPacks(false) : setTimeout(tick, 3000);
                setTimeout(tick, 6000);
                setInterval(() => { if (!document.hidden && !apiPaused()) syncPacks(false); }, 10 * 60 * 1000);
            })();

            const ZIP_IMG = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };
            const ZIP_LIMITS = { packs: 20, perPack: 120, total: 300, bytes: 5 * 1024 * 1024 };
            async function readZip(file) {
                const buf = new Uint8Array(await file.arrayBuffer()), dv = new DataView(buf.buffer);
                let eocd = -1;
                for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
                if (eocd < 0) throw new Error('это не zip-архив');
                const count = dv.getUint16(eocd + 10, true);
                let at = dv.getUint32(eocd + 16, true);
                const utf8 = new TextDecoder('utf-8', { fatal: true }), dos = new TextDecoder('ibm866');
                const entries = [];
                for (let k = 0; k < count; k++) {
                    if (dv.getUint32(at, true) !== 0x02014b50) throw new Error('архив повреждён');
                    const flags = dv.getUint16(at + 8, true), method = dv.getUint16(at + 10, true);
                    const csize = dv.getUint32(at + 20, true), size = dv.getUint32(at + 24, true);
                    const nlen = dv.getUint16(at + 28, true), xlen = dv.getUint16(at + 30, true), clen = dv.getUint16(at + 32, true);
                    const local = dv.getUint32(at + 42, true), raw = buf.subarray(at + 46, at + 46 + nlen);
                    let name;
                    try { name = flags & 0x800 ? new TextDecoder().decode(raw) : utf8.decode(raw); } catch (e) { name = dos.decode(raw); }
                    entries.push({ name: name.replace(/\\/g, '/'), method, csize, size, local });
                    at += 46 + nlen + xlen + clen;
                }
                entries.data = async e => {
                    const start = e.local + 30 + dv.getUint16(e.local + 26, true) + dv.getUint16(e.local + 28, true);
                    const bytes = buf.slice(start, start + e.csize);
                    if (e.method === 0) return bytes;
                    if (e.method !== 8) throw new Error('неизвестное сжатие');
                    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
                };
                return entries;
            }
            function zipPacks(entries, zipName) {
                const imgs = entries.filter(e => {
                    const parts = e.name.split('/');
                    return !e.name.endsWith('/') && !parts.some(p => p.startsWith('.') || p === '__MACOSX') && ZIP_IMG[(parts.pop().split('.').pop() || '').toLowerCase()];
                });
                let paths = imgs.map(e => e.name.split('/'));
                while (paths.length && paths.every(p => p.length > 2 && p[0] === paths[0][0])) paths = paths.map(p => p.slice(1));
                const groups = new Map();
                imgs.forEach((e, i) => {
                    const p = paths[i], pack = p.length > 1 ? p[0] : zipName.replace(/\.zip$/i, '');
                    if (!groups.has(pack)) groups.set(pack, []);
                    groups.get(pack).push(e);
                });
                return [...groups].map(([name, files]) => ({ name: name.trim().slice(0, MAX_NAME_LENGTH) || DEFAULT_PACK_NAME, files: files.sort((a, b) => a.name.localeCompare(b.name, 'ru', { numeric: true })) }));
            }
            function openZipImport() {
                if (!stickerPanel || stickerPanel.querySelector('.vp-sp-import')) return;
                exitEditMode();
                const card = el('div', 'vp-sp-import', `<b>Паки из архива</b>
                <ul>
                    <li>Архив <b style="font-size:inherit">.zip</b></li>
                    <li>Папка в архиве = пак, имя папки = название пака</li>
                    <li>В папке — картинки png, jpg, gif, webp (до 5 МБ); встают как есть, без обрезки</li>
                    <li>Картинки прямо в архиве, без папки, — пак с именем архива</li>
                </ul>
                <pre>стикеры.zip
├ Коты/
│  ├ 1.png
│  └ 2.gif
└ Мемы/
   └ шрек.jpg</pre>
                <div class="vp-imp-status"></div>
                <div class="vp-imp-btns"><button type="button" class="vp-imp-cancel">Отмена</button><button type="button" class="vp-imp-go">Выбрать архив</button></div>`);
                stickerPanel.appendChild(card);
                const status = card.querySelector('.vp-imp-status'), go = card.querySelector('.vp-imp-go'), cancel = card.querySelector('.vp-imp-cancel');
                let busy = false, stop = false;
                cancel.onclick = () => { if (busy) { stop = true; cancel.disabled = true; status.textContent = 'Останавливаю…'; } else card.remove(); };
                go.onclick = () => {
                    const input = el('input');
                    input.type = 'file';
                    input.accept = '.zip,application/zip';
                    input.onchange = async () => {
                        const file = input.files[0];
                        if (!file) return;
                        busy = true; go.disabled = true;
                        try {
                            status.textContent = 'Читаю архив…';
                            const entries = await readZip(file);
                            const packs = zipPacks(entries, file.name).slice(0, ZIP_LIMITS.packs);
                            const total = Math.min(ZIP_LIMITS.total, packs.reduce((n, pk) => n + Math.min(pk.files.length, ZIP_LIMITS.perPack), 0));
                            if (!total) throw new Error('в архиве нет картинок по правилам');
                            let done = 0, skipped = 0;
                            for (const pk of packs) {
                                if (stop || done >= total) break;
                                const pack = { id: 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), name: pk.name, stickers: [] };
                                for (const e of pk.files.slice(0, ZIP_LIMITS.perPack)) {
                                    if (stop || done >= total) break;
                                    status.textContent = `Загружаю «${pk.name}»: ${done + 1} из ${total}…`;
                                    try {
                                        if (e.size > ZIP_LIMITS.bytes) throw new Error('больше 5 МБ');
                                        const base = e.name.split('/').pop(), type = ZIP_IMG[base.split('.').pop().toLowerCase()];
                                        const data = await uploadImageToServer(new File([await entries.data(e)], base, { type }));
                                        pack.stickers.push(data);
                                    } catch (err) { skipped++; }
                                    done++;
                                }
                                if (pack.stickers.length) { userPacks.push(pack); saveUserPacks(); }
                            }
                            rebuildPanel();
                            const left = stickerPanel.querySelector('.vp-sp-import');
                            if (left) left.remove();
                            showPanel();
                            if (skipped) alert(`Готово. Не загрузились: ${skipped} (слишком большие или битые картинки)`);
                        } catch (err) {
                            status.textContent = 'Не вышло: ' + (err && err.message || err);
                            logErr('паки из архива', err);
                            busy = false; go.disabled = false;
                        }
                    };
                    input.click();
                };
            }

            function addToRecent(sticker) {
                recentStickers = [sticker, ...recentStickers.filter(s => s.id !== sticker.id)].slice(0, 30);
                saveRecent();
            }

            const style = addCss(`
            @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
            .spin{animation:spin 1s linear infinite;transform-origin:center}
            .sticker-dragging{opacity:0.3!important;pointer-events:none!important}
            .sticker-placeholder{background:rgba(0,128,255,0.2)!important;border:2px dashed #0080FF!important}
            @keyframes stickerShake1{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(0.5px,0.5px)rotate(0.3deg)}50%{transform:translate(-0.5px,-0.3px)rotate(-0.2deg)}75%{transform:translate(-0.3px,0.4px)rotate(0.1deg)}}
            @keyframes stickerShake2{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(-0.4px,-0.5px)rotate(-0.3deg)}50%{transform:translate(0.6px,0.2px)rotate(0.2deg)}75%{transform:translate(0.2px,-0.4px)rotate(-0.1deg)}}
            @keyframes stickerShake3{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(-0.5px,0.3px)rotate(0.2deg)}50%{transform:translate(0.4px,-0.5px)rotate(-0.3deg)}75%{transform:translate(0.3px,0.3px)rotate(0.1deg)}}
            @keyframes stickerShake4{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(0.3px,-0.4px)rotate(-0.2deg)}50%{transform:translate(-0.5px,0.5px)rotate(0.3deg)}75%{transform:translate(-0.2px,-0.3px)rotate(-0.1deg)}}
            @keyframes stickerShake5{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(0.2px,-0.3px)rotate(0.25deg)}50%{transform:translate(-0.3px,0.4px)rotate(-0.15deg)}75%{transform:translate(0.4px,0.2px)rotate(0.2deg)}}
            @keyframes stickerShake6{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(-0.6px,0.1px)rotate(-0.35deg)}50%{transform:translate(0.3px,-0.3px)rotate(0.15deg)}75%{transform:translate(-0.2px,0.5px)rotate(-0.25deg)}}
            @keyframes stickerShake7{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(0.4px,-0.2px)rotate(0.2deg)}50%{transform:translate(-0.2px,0.6px)rotate(-0.3deg)}75%{transform:translate(0.3px,-0.1px)rotate(0.1deg)}}
            @keyframes stickerShake8{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(-0.3px,-0.4px)rotate(-0.25deg)}50%{transform:translate(0.5px,0.1px)rotate(0.2deg)}75%{transform:translate(-0.1px,-0.5px)rotate(-0.15deg)}}
            .sticker-editing{animation-duration:0.4s;animation-iteration-count:infinite;animation-timing-function:ease-in-out;cursor:grab}
            .sticker-shake-1{animation-name:stickerShake1}
            .sticker-shake-2{animation-name:stickerShake2}
            .sticker-shake-3{animation-name:stickerShake3}
            .sticker-shake-4{animation-name:stickerShake4}
            .sticker-shake-5{animation-name:stickerShake5}
            .sticker-shake-6{animation-name:stickerShake6}
            .sticker-shake-7{animation-name:stickerShake7}
            .sticker-shake-8{animation-name:stickerShake8}
            .sticker-editing:active{cursor:grabbing}
            .sticker-editing { touch-action: none; }
            .vp-sticker-item.vp-sticker-ghost { position: fixed; z-index: 10001; pointer-events: none; margin: 0; border-radius: 10px; overflow: hidden;
                box-shadow: 0 12px 30px rgba(0, 0, 0, .45), 0 0 0 2px var(--accent-primary); }
            .vp-sticker-ghost .vp-sticker-del { display: none; }
            .vp-sticker-item.vp-sticker-ghost { transition: none; animation: none; will-change: transform; transform-origin: 50% 50%; }
            .sticker-panel.vp-drag .sticker-editing { animation-play-state: paused; }
            .vp-sticker-item.vp-hole { opacity: .25; animation: none; box-shadow: inset 0 0 0 2px var(--accent-primary); }

            .sticker-btn { background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: 9999px;
                display: inline-flex; align-items: center; justify-content: center; color: var(--text-secondary);
                margin-right: 5px; width: 36px; height: 36px; }
            .sticker-btn:hover { background-color: var(--bg-hover, rgba(255,255,255,0.08)); }

            #temp_sticker_preview { padding: 0 0 8px; }
            .vp-sticker-attach { display: flex; gap: 8px; flex-wrap: wrap; }
            .vp-sticker-thumb { width: 80px; height: 80px; position: relative; border-radius: 8px; overflow: hidden; }
            .vp-sticker-thumb > img { width: 100%; height: 100%; object-fit: cover; }
            .vp-sticker-remove { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; background: rgba(0,0,0,0.6);
                border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; }
            .vp-sticker-hide { display: none !important; }
            .vp-sticker-sendbtn { margin: 6px !important; transform: translate(0) !important; }

            .sticker-panel { position: fixed; display: none; flex-direction: column; background: var(--block-bg);
                border-radius: 20px; border: 1px solid var(--border-color,rgba(255,255,255,0.1)); z-index: 10000;
                width: ${PANEL_WIDTH}px; height: 440px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); overflow: hidden; }
            .sticker-panel.vp-open { display: flex; }
            .vp-sp-import { position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; gap: 10px; padding: 16px;
                background: var(--block-bg); border-radius: inherit; font-size: 13px; line-height: 1.4; color: var(--text-primary,#fff); overflow: auto; }
            html.vp-glass .vp-sp-import { background: rgba(24,24,24,.96); }
            html.vp-glass.vp-light .vp-sp-import { background: rgba(255,255,255,.97); }
            .vp-sp-import b { font-size: 15px; }
            .vp-sp-import ul { margin: 0; padding-left: 18px; list-style: disc; color: var(--text-secondary); }
            .vp-sp-import li + li { margin-top: 4px; }
            .vp-sp-import pre { margin: 0; padding: 8px 10px; border-radius: 10px; background: rgba(128,128,128,.14); font-size: 12px; line-height: 1.35; white-space: pre; }
            .vp-sp-import .vp-imp-btns { display: flex; gap: 8px; margin-top: auto; }
            .vp-sp-import button { flex: 1; height: 38px; border: 0; border-radius: 12px; cursor: pointer; font: inherit; font-weight: 600;
                background: rgba(128,128,128,.18); color: inherit; }
            .vp-sp-import button.vp-imp-go { background: var(--accent-primary); color: #fff; }
            .vp-sp-import button:disabled { opacity: .5; cursor: default; }
            .vp-sp-import .vp-imp-status { min-height: 18px; color: var(--text-secondary); }
            .vp-sp-head { display: flex; align-items: center; padding: 8px; border-bottom: 1px solid var(--border-color,rgba(255,255,255,0.1));
                gap: 4px; flex-shrink: 0; }
            .vp-sp-tab { background: transparent; border: none; width: 32px; height: 32px; border-radius: 12px; cursor: pointer;
                display: flex; align-items: center; justify-content: center; padding: 0; flex-shrink: 0;
                color: var(--text-secondary); }
            .vp-sp-tab.vp-recent { color: white; }
            .vp-sp-tab.vp-on { background: var(--accent-primary); }
            .vp-sp-tab > img { width: 24px; height: 24px; object-fit: contain; border-radius: 6px; }
            .vp-sp-tabs { display: flex; gap: 4px; overflow-x: auto; overflow-y: hidden; flex: 1; padding: 0 4px; scrollbar-width: none; }
            .vp-sp-tabs > div { display: flex; gap: 4px; }
            .vp-sp-body { flex: 1; overflow-y: auto; overflow-x: hidden; scroll-behavior: smooth; scrollbar-width: thin; }
            .pack-header { padding: 16px 10px 8px; display: flex; align-items: center; gap: 6px; color: var(--text-secondary); }
            .vp-sp-name { display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-right: auto; }
            .pack-name-input { background: transparent; border: 1px solid transparent; color: inherit; font-size: 14px; font-weight: 600;
                letter-spacing: 0.5px; text-transform: uppercase; padding: 2px 4px; border-radius: 4px; outline: none; width: auto; }
            .pack-header[data-pack="recent"] .pack-name-input { pointer-events: none; }
            .vp-sp-edit { background: transparent; border: none; width: 20px; height: 20px; border-radius: 6px; cursor: pointer;
                display: flex; align-items: center; justify-content: center; padding: 0; color: inherit; }
            .delete-pack-btn, .vp-sp-done { display: none; border: none; width: 24px; height: 24px; border-radius: 6px; cursor: pointer;
                padding: 0; align-items: center; justify-content: center; }
            .delete-pack-btn { background: #ff4444; }
            .vp-sp-done { background: var(--accent-primary); }
            .pack-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 3px; padding: 0 10px 16px; position: relative; }
            .vp-sp-body.vp-editing > :not(.vp-cur) { display: none; }
            .vp-sp-body.vp-editing > .pack-header.vp-cur :is(.delete-pack-btn, .vp-sp-done) { display: flex; }
            .vp-sticker-item { aspect-ratio: 1; font-size: 34px; background: transparent; border: none; border-radius: 10px;
                transition: all 0.15s ease; display: flex; align-items: center; justify-content: center; cursor: pointer;
                padding: 0; position: relative; user-select: none; overflow: hidden; }
            .sticker-panel:not(.vp-drag) .vp-sticker-item:hover { transform: scale(1.05); box-shadow: 0 0 0 2px var(--accent-primary); }
            .vp-sticker-item > img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
            .vp-sticker-item > .vp-sticker-empty { width: 100%; height: 100%; background: rgba(128,128,128,0.1); border-radius: 8px; }
            .vp-sticker-del { position: absolute; top: 2px; right: 2px; width: 16px; height: 16px; background: rgba(0,0,0,0.6);
                border-radius: 50%; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.7);
                transition: all 0.15s; z-index: 2; pointer-events: auto; font-size: 12px; }
            .vp-sticker-del:hover { background: #ff4444; }
            .add-item-btn { aspect-ratio: 1; background: var(--bg-secondary,rgba(128,128,128,0.08));
                border: 2px dashed var(--border-color,rgba(255,255,255,0.2)); border-radius: 10px; display: flex; align-items: center;
                justify-content: center; cursor: pointer; padding: 0; color: var(--text-secondary); transition: all 0.15s; }
            .add-item-btn:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
            .add-item-btn.vp-busy { pointer-events: none; }

            .vp-crop-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8);
                display: flex; align-items: center; justify-content: center; z-index: 20000; }
            .vp-crop-editor { background: var(--block-bg); border-radius: 16px; padding: 20px; display: flex;
                flex-direction: column; gap: 16px; width: 90%; max-width: 500px; }
            .vp-crop-editor > h3 { margin: 0; color: var(--text-primary,#fff); font-size: 18px; font-weight: 600; }
            .vp-crop-view { position: relative; width: 100%; aspect-ratio: 1; overflow: hidden; border-radius: 12px; background: #000; }
            .vp-crop-view > img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
            .vp-crop-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
            .vp-crop-area { position: absolute; border: 2px solid #0080FF; box-sizing: border-box; pointer-events: auto; touch-action: none; }
            .vp-crop-area.vp-moving { cursor: move; }
            .resize-handle { position: absolute; width: 8px; height: 8px; background: #0080FF; pointer-events: auto; touch-action: none; }
            .resize-handle[data-direction="n"] { top: -4px; left: 50%; transform: translateX(-50%); width: 30px; cursor: n-resize; }
            .resize-handle[data-direction="s"] { bottom: -4px; left: 50%; transform: translateX(-50%); width: 30px; cursor: s-resize; }
            .resize-handle[data-direction="e"] { top: 50%; right: -4px; transform: translateY(-50%); height: 30px; cursor: e-resize; }
            .resize-handle[data-direction="w"] { top: 50%; left: -4px; transform: translateY(-50%); height: 30px; cursor: w-resize; }
            .resize-handle[data-direction="nw"] { top: -4px; left: -4px; cursor: nw-resize; }
            .resize-handle[data-direction="ne"] { top: -4px; right: -4px; cursor: ne-resize; }
            .resize-handle[data-direction="sw"] { bottom: -4px; left: -4px; cursor: sw-resize; }
            .resize-handle[data-direction="se"] { bottom: -4px; right: -4px; cursor: se-resize; }
            .vp-crop-ratios { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
            .aspect-ratio-btn { background: var(--bg-hover,rgba(255,255,255,0.1)); border: none; color: var(--text-primary,#fff);
                padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; }
            .aspect-ratio-btn.vp-on { background: #0080FF; }
            .vp-crop-actions { display: flex; gap: 12px; justify-content: flex-end; }
            .vp-crop-actions > button { padding: 8px 16px; border-radius: 8px; cursor: pointer; color: var(--text-primary,#fff); }
            .vp-crop-cancel { background: transparent; border: 1px solid var(--border-color,rgba(255,255,255,0.3)); }
            .vp-crop-actions > .vp-crop-ok { background: #0080FF; border: none; color: white; }
        `);

            const el = (tag, cls, html) => {
                const e = document.createElement(tag);
                if (cls) e.className = cls;
                if (html) e.innerHTML = html;
                return e;
            };

            async function uploadImageToServer(file) {
                const accessToken = await getAccessToken();
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/files/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                    body: formData,
                    credentials: 'include'
                });
                if (!res.ok) throw new Error('Upload failed');
                return await res.json();
            }

            function stickerPostId() {
                const m = location.pathname.match(/\/post\/([^\/?#]+)/);
                if (m) return m[1];
                const row = stickerBtn && stickerBtn.closest('.' + SELECTORS.stickerContainer);
                const card = row && row.closest('article');
                const link = card && card.querySelector('a[href*="/post/"]');
                const lm = link && link.getAttribute('href').match(/\/post\/([^\/?#]+)/);
                return lm ? lm[1] : card ? postIdOf(card) : null;
            }

            let attached = null;
            function detachSticker() {
                if (!attached) return;
                const { preview, send, hidden } = attached;
                attached = null;
                preview.remove();
                send.remove();
                hidden.forEach(b => b.classList.remove('vp-sticker-hide'));
            }
            function stickerFile(sticker) {
                return new Promise((resolve, reject) => GM_xmlhttpRequest({
                    method: 'GET', url: sticker.url, responseType: 'blob',
                    onload: r => r.status === 200 && r.response ? resolve(r.response) : reject(new Error('картинка стикера: ' + r.status)),
                    onerror: () => reject(new Error('картинка стикера: сеть'))
                })).then(blob => {
                    const type = blob.type || 'image/png';
                    return new File([blob], 'sticker.' + (type.split('/')[1] || 'png').replace(/\+.*/, ''), { type });
                });
            }
            function ownStickerCopy(sticker) {
                return stickerFile(sticker).then(uploadImageToServer)
                    .then(data => {
                        const oldId = sticker.id;
                        [recentStickers, ...userPacks.map(p => p.stickers)].forEach(list => list.forEach(s => { if (s.id === oldId) Object.assign(s, data); }));
                        Object.assign(sticker, data);
                        saveRecent();
                        saveUserPacks();
                        return data;
                    });
            }
            async function postStickerComment(postId, stickerId, content) {
                const accessToken = await getAccessToken();
                const response = await fetch(`/api/posts/${postId}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                    body: JSON.stringify({ content, attachmentIds: [stickerId] }),
                    credentials: 'include'
                });
                return { response, result: await response.json().catch(() => ({})) };
            }
            async function sendSticker(postId, sticker, btn) {
                btn.disabled = true;
                const icon = btn.innerHTML;
                btn.innerHTML = ICONS.LOADING;
                try {
                    const field = btn.closest('.' + SELECTORS.commentPreviewContainer)?.querySelector('[contenteditable="true"]')
                        || document.querySelector('[contenteditable="true"][data-placeholder*="комментарий"]');
                    const content = field ? (field.innerText || field.textContent || '').trim() : '';
                    let { response, result } = await postStickerComment(postId, sticker.id, content);
                    if (response.status === 403 || (result.error && result.error.code === 'FORBIDDEN')) {
                        ({ response, result } = await postStickerComment(postId, (await ownStickerCopy(sticker)).id, content));
                    }
                    if (response.ok) { location.reload(); return; }
                    alert('Ошибка: ' + JSON.stringify(result.error || response.status));
                } catch (err) {
                    alert('Ошибка: ' + err.message);
                }
                btn.disabled = false;
                btn.innerHTML = icon;
            }
            function insertStickerToComment(sticker) {
                const postId = stickerPostId();
                if (!postId) throw new Error('Post ID not found');
                detachSticker();
                const row = stickerBtn && stickerBtn.closest('.' + SELECTORS.stickerContainer);
                const box = (row && row.closest('.' + SELECTORS.commentPreviewContainer)) || siteEl('commentPreviewContainer');
                const siteSend = (row && row.querySelector('.' + SELECTORS.stickerSendBtn)) || siteEl('stickerSendBtn');
                if (!box || !siteSend) return;
                document.getElementById('temp_sticker_preview')?.remove();

                const line = box.parentElement && box.parentElement.querySelector(':scope > button') ? box.parentElement : box;
                const preview = el('div', '', `<div class="vp-sticker-attach"><div class="vp-sticker-thumb"><img><button type="button" class="vp-sticker-remove">${svgIcon(GLYPH.close, 14)}</button></div></div>`);
                preview.id = 'temp_sticker_preview';
                preview.querySelector('img').src = sticker.url;
                preview.querySelector('.vp-sticker-remove').onclick = e => { e.preventDefault(); e.stopPropagation(); detachSticker(); };
                line.before(preview);
                preview.firstChild.style.marginLeft = Math.max(0, box.getBoundingClientRect().left - preview.getBoundingClientRect().left) + 'px';

                const send = el('button', siteClasses(siteSend) + ' vp-sticker-sendbtn', siteSend.innerHTML);
                send.type = 'button';
                send.onclick = e => { e.preventDefault(); e.stopPropagation(); sendSticker(postId, sticker, send); };
                siteSend.after(send);
                const hidden = [siteSend];
                if (line !== box) [...line.querySelectorAll(':scope > button')]
                    .filter(b => box.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).forEach(b => hidden.push(b));
                else { const mic = row && row.querySelector('.' + SELECTORS.stickerMicBtn); if (mic && mic !== siteSend) hidden.push(mic); }
                hidden.forEach(b => b.classList.add('vp-sticker-hide'));
                attached = { preview, send, hidden };
            }
            document.addEventListener('keydown', e => {
                if (!attached || e.key !== 'Enter' || e.shiftKey || !e.target.isContentEditable) return;
                if (!e.target.closest('.' + SELECTORS.commentPreviewContainer)) return;
                e.preventDefault();
                e.stopPropagation();
                attached.send.click();
            }, true);

            let stickerPanel = null, scrollContainer = null, tabsRow = null, recentBtn = null;
            let stickerBtn = null, hideTimeout = null;
            let editPack = null;

            let blockWheel = null;
            function disablePageScroll() {
                const root = document.getElementById('root');
                if (blockWheel || !root) return;
                blockWheel = e => e.preventDefault();
                root.addEventListener('wheel', blockWheel, { passive: false });
            }
            function enablePageScroll() {
                const root = document.getElementById('root');
                if (!blockWheel) return;
                if (root) root.removeEventListener('wheel', blockWheel);
                blockWheel = null;
            }

            function adjustInputWidth(input) {
                const n = Math.max(1, Math.min(MAX_NAME_LENGTH, input.value.length || input.placeholder.length || DEFAULT_PACK_NAME.length));
                input.style.width = `${n * (14 - n * 0.2)}px`;
                input.style.minWidth = 'auto';
            }

            function packTab(pack) {
                const btn = el('button', 'vp-sp-tab');
                const first = pack.stickers[0];
                if (first && first.url) { const img = el('img'); img.src = first.url; btn.appendChild(img); }
                else btn.innerHTML = ICONS.EMPTY_PACK;
                btn.title = pack.name || DEFAULT_PACK_NAME;
                btn.dataset.pack = pack.id;
                btn.onclick = () => { exitEditMode(); scrollToPack(pack.id); };
                return btn;
            }
            function updateTabButtons() {
                const wrap = tabsRow && tabsRow.firstElementChild;
                if (wrap) wrap.replaceChildren(...userPacks.map(packTab));
            }

            function createStickerPanel() {
                if (stickerPanel) return;
                stickerPanel = el('div', 'sticker-panel');
                const header = el('div', 'vp-sp-head');
                recentBtn = el('button', 'vp-sp-tab vp-recent vp-on', ICONS.RECENT);
                recentBtn.title = 'Недавние';
                recentBtn.onclick = () => { exitEditMode(); scrollToPack('recent'); };
                tabsRow = el('div', 'vp-sp-tabs', '<div></div>');
                tabsRow.addEventListener('wheel', e => {
                    if (e.deltaY !== 0) { e.preventDefault(); tabsRow.scrollLeft += e.deltaY * 0.4; }
                }, { passive: false });
                updateTabButtons();
                const addPackBtn = el('button', 'vp-sp-tab', ICONS.ADD_PACK);
                addPackBtn.title = 'Создать стикерпак';
                addPackBtn.onclick = () => {
                    const pack = { id: 'user_' + Date.now(), name: '', stickers: [] };
                    userPacks.push(pack);
                    saveUserPacks();
                    rebuildPanel();
                    enterEditMode(pack.id);
                    showPanel();
                };
                const zipBtn = el('button', 'vp-sp-tab', ICONS.ZIP_PACK);
                zipBtn.title = 'Паки из архива';
                zipBtn.onclick = () => openZipImport();
                header.append(recentBtn, tabsRow, addPackBtn, zipBtn);

                scrollContainer = el('div', 'vp-sp-body');
                scrollContainer.addEventListener('wheel', e => e.stopPropagation(), { passive: true });
                scrollContainer.addEventListener('touchmove', e => e.stopPropagation(), { passive: true });
                scrollContainer.addEventListener('scroll', updateActiveTabFromScroll, { passive: true });
                stickerPanel.append(header, scrollContainer);
                stickerPanel.addEventListener('mouseenter', () => {
                    clearTimeout(hideTimeout);
                    stickerPanel.querySelectorAll('.pack-name-input').forEach(adjustInputWidth);
                });
                stickerPanel.addEventListener('mouseleave', () => hidePanel(200));
                document.body.appendChild(stickerPanel);
            }
            function rebuildPanel() {
                if (stickerPanel) stickerPanel.remove();
                stickerPanel = scrollContainer = tabsRow = recentBtn = null;
                editPack = null;
                createStickerPanel();
                renderAllContent();
            }

            function renderAllContent() {
                if (!scrollContainer) return;
                scrollContainer.replaceChildren();
                for (const key of allPackKeys()) {
                    const header = el('div', 'pack-header');
                    header.dataset.pack = key;
                    const name = el('div', 'vp-sp-name');
                    const input = el('input', 'pack-name-input');
                    input.type = 'text';
                    input.value = packName(key);
                    input.placeholder = 'Название...';
                    input.maxLength = MAX_NAME_LENGTH;
                    name.appendChild(input);
                    if (key !== 'recent') {
                        const pack = () => userPacks.find(p => p.id === key);
                        const locked = () => editPack !== key;
                        input.addEventListener('input', () => {
                            if (locked()) input.value = packName(key);
                            else {
                                input.value = input.value.slice(0, MAX_NAME_LENGTH);
                                if (pack()) { pack().name = input.value; saveUserPacks(); }
                            }
                            adjustInputWidth(input);
                        });
                        input.addEventListener('blur', () => {
                            if (locked()) input.value = packName(key);
                            else if (!input.value.trim()) {
                                input.value = DEFAULT_PACK_NAME;
                                if (pack()) { pack().name = DEFAULT_PACK_NAME; saveUserPacks(); }
                            }
                            adjustInputWidth(input);
                        });
                        const editBtn = el('button', 'vp-sp-edit', ICONS.EDIT);
                        editBtn.title = 'Редактировать';
                        editBtn.onclick = () => { if (editPack === key) exitEditMode(); else { exitEditMode(); enterEditMode(key); } };
                        const delPack = el('button', 'delete-pack-btn', ICONS.TRASH);
                        delPack.title = 'Удалить пак';
                        delPack.onclick = () => { if (confirm('Удалить пак?')) deleteStickerPack(key); };
                        const done = el('button', 'vp-sp-done', ICONS.CHECK);
                        done.title = 'Готово';
                        done.onclick = exitEditMode;
                        name.append(editBtn, delPack, done);
                    }
                    header.appendChild(name);
                    const grid = el('div', 'pack-grid');
                    grid.dataset.pack = key;
                    scrollContainer.append(header, grid);
                    refreshPackGrid(key);
                }
                markEditing();
            }

            function markEditing() {
                if (!scrollContainer) return;
                scrollContainer.classList.toggle('vp-editing', !!editPack);
                for (const e of scrollContainer.children) e.classList.toggle('vp-cur', e.dataset.pack === editPack);
            }
            function enterEditMode(key) {
                if (key === 'recent') return;
                editPack = key;
                markEditing();
                refreshAllPackGrids();
                const header = scrollContainer.querySelector(`.pack-header[data-pack="${key}"]`);
                if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            function exitEditMode() {
                editPack = null;
                if (!scrollContainer) return;
                markEditing();
                refreshAllPackGrids();
            }

            function deleteStickerPack(key) {
                userPacks = userPacks.filter(p => p.id !== key);
                saveUserPacks();
                if (stickerPanel) {
                    const open = stickerPanel.classList.contains('vp-open');
                    rebuildPanel();
                    if (open) showPanel();
                }
            }
            function deleteSticker(key, index) {
                packStickers(key).splice(index, 1);
                savePack(key);
                refreshAllPackGrids();
                updateTabButtons();
            }
            function flipGrid(grid, mutate) {
                const items = [...grid.children], before = new Map(items.map(e => [e, e.getBoundingClientRect()]));
                mutate();
                items.forEach(e => {
                    const a = before.get(e), b = e.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
                    if (dx || dy) e.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
                        { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
                });
            }
            function startStickerDrag(e, btn, key) {
                if (e.button > 0 || e.target.closest('.vp-sticker-del')) return;
                const grid = btn.parentElement, x0 = e.clientX, y0 = e.clientY;
                let ghost = null, ox = 0, oy = 0, gx = 0, gy = 0, px = x0, py = y0, raf = 0, cells = [], box = null;
                const measure = () => {
                    const gr = grid.getBoundingClientRect();
                    cells = [...grid.querySelectorAll('.vp-sticker-item')].map(el => {
                        const left = gr.left + grid.clientLeft + el.offsetLeft, top = gr.top + grid.clientTop + el.offsetTop;
                        return { el, r: { left, top, right: left + el.offsetWidth, bottom: top + el.offsetHeight } };
                    });
                    box = scrollContainer.getBoundingClientRect();
                };
                const frame = () => {
                    raf = 0;
                    ghost.style.transform = `translate3d(${px - ox - gx}px, ${py - oy - gy}px, 0) scale(1.12)`;
                    const hit = cells.find(c => px >= c.r.left && px <= c.r.right && py >= c.r.top && py <= c.r.bottom);
                    const target = hit && hit.el;
                    if (target && target !== btn) {
                        const kids = [...grid.children];
                        flipGrid(grid, () => grid.insertBefore(btn, kids.indexOf(target) > kids.indexOf(btn) ? target.nextSibling : target));
                        measure();
                    }
                    if (py < box.top + 36 || py > box.bottom - 36) {
                        scrollContainer.scrollTop += py < box.top + 36 ? -10 : 10;
                        measure();
                        raf = raf || requestAnimationFrame(frame);
                    }
                };
                const move = ev => {
                    if (ev.pointerId !== e.pointerId) return;
                    px = ev.clientX; py = ev.clientY;
                    if (!ghost) {
                        if (Math.hypot(px - x0, py - y0) < 6) return;
                        const r = btn.getBoundingClientRect();
                        ox = x0 - r.left; oy = y0 - r.top; gx = r.left; gy = r.top;
                        ghost = btn.cloneNode(true);
                        ghost.className = 'vp-sticker-item vp-sticker-ghost';
                        Object.assign(ghost.style, { width: r.width + 'px', height: r.height + 'px', left: r.left + 'px', top: r.top + 'px' });
                        domObserver.disconnect();
                        document.body.appendChild(ghost);
                        btn.classList.add('vp-hole');
                        btn._vpDragged = true;
                        stickerPanel.classList.add('vp-drag');
                        measure();
                    }
                    ev.preventDefault();
                    raf = raf || requestAnimationFrame(frame);
                };
                const up = ev => {
                    if (ev.pointerId !== e.pointerId) return;
                    document.removeEventListener('pointermove', move, true);
                    document.removeEventListener('pointerup', up, true);
                    document.removeEventListener('pointercancel', up, true);
                    if (!ghost) return;
                    if (raf) { cancelAnimationFrame(raf); frame(); cancelAnimationFrame(raf); }
                    raf = 0;
                    const r = btn.getBoundingClientRect(), g = ghost.getBoundingClientRect();
                    ghost.style.transform = '';
                    Object.assign(ghost.style, { left: r.left + 'px', top: r.top + 'px' });
                    const land = ghost.animate([
                        { transform: `translate3d(${g.left - r.left + (g.width - r.width) / 2}px, ${g.top - r.top + (g.height - r.height) / 2}px, 0) scale(1.12)` },
                        { transform: 'none' }
                    ], { duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' });
                    const finish = () => {
                        ghost.remove();
                        btn.classList.remove('vp-hole');
                        stickerPanel.classList.remove('vp-drag');
                        const list = packStickers(key);
                        const order = [...grid.querySelectorAll('.vp-sticker-item')].map(b => list[+b.dataset.stickerIndex]);
                        list.splice(0, list.length, ...order);
                        savePack(key);
                        updateTabButtons();
                        refreshPackGrid(key);
                        domObserver.observe(document.body, DOM_WATCH);
                    };
                    land.finished.then(finish, finish);
                };
                document.addEventListener('pointermove', move, true);
                document.addEventListener('pointerup', up, true);
                document.addEventListener('pointercancel', up, true);
            }

            function addStickerToPack(key) {
                const input = el('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async () => {
                    const file = input.files[0];
                    if (!file) return;
                    const addBtn = scrollContainer && scrollContainer.querySelector(`.pack-grid[data-pack="${key}"] .add-item-btn`);
                    const busy = on => { if (addBtn) { addBtn.innerHTML = on ? ICONS.LOADING : ICONS.ADD; addBtn.classList.toggle('vp-busy', on); } };
                    busy(true);
                    try {
                        const cropped = await showCropEditor(URL.createObjectURL(file));
                        if (!cropped) { busy(false); return; }
                        const data = await uploadImageToServer(cropped);
                        if (key === 'recent') {
                            recentStickers = [data, ...recentStickers].slice(0, 20);
                            saveRecent();
                        } else {
                            const pack = userPacks.find(p => p.id === key);
                            if (pack) { pack.stickers.push(data); saveUserPacks(); }
                        }
                        refreshAllPackGrids();
                        updateTabButtons();
                    } catch (err) {
                        alert('Ошибка загрузки: ' + err.message);
                        busy(false);
                    }
                };
                input.click();
            }

            function refreshPackGrid(key) {
                const grid = scrollContainer && scrollContainer.querySelector(`.pack-grid[data-pack="${key}"]`);
                if (!grid) return;
                const editing = editPack === key;
                grid.replaceChildren(...packStickers(key).map((s, i) => createStickerButton(s, key, i, editing)));
                if (editing) {
                    const addBtn = el('button', 'add-item-btn', ICONS.ADD);
                    addBtn.title = 'Добавить стикер';
                    addBtn.onclick = () => addStickerToPack(key);
                    grid.appendChild(addBtn);
                }
            }
            function refreshAllPackGrids() {
                if (scrollContainer) allPackKeys().forEach(refreshPackGrid);
            }

            async function attachAsSiteFile(sticker) {
                const row = stickerBtn && stickerBtn.closest('.' + SELECTORS.stickerContainer);
                let input = null;
                for (let e = row, i = 0; e && !input && i < 5; e = e.parentElement, i++) input = e.querySelector('input[type="file"]');
                if (!input) return false;
                const file = await stickerFile(sticker);
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
            function pickSticker(sticker) {
                if (sticker && sticker.id && sticker.url) {
                    addToRecent(sticker);
                    const fallback = e => {
                        if (e) { console.warn('[ITD VP] стикер через сайт', e); logErr('стикер через сайт', e); }
                        try { insertStickerToComment(sticker); } catch (err) { console.warn('[ITD VP] стикер', err); logErr('стикер', err); }
                    };
                    if (stickerBtn) stickerBtn.innerHTML = ICONS.LOADING;
                    attachAsSiteFile(sticker).then(ok => { if (!ok) fallback(); }, fallback)
                        .finally(() => { if (stickerBtn) stickerBtn.innerHTML = ICONS.STICKER_BUTTON; });
                }
                stickerPanel.classList.remove('vp-open');
                exitEditMode();
                enablePageScroll();
            }
            function createStickerButton(sticker, key, index, editing) {
                const btn = el('button', 'vp-sticker-item');
                btn.dataset.packKey = key;
                btn.dataset.stickerIndex = index;
                if (sticker && sticker.url) { const img = el('img'); img.src = sticker.url; btn.appendChild(img); }
                else btn.appendChild(el('div', 'vp-sticker-empty'));
                btn.onclick = () => { if (btn._vpDragged) { btn._vpDragged = false; return; } pickSticker(sticker); };
                if (!editing) return btn;

                btn.classList.add('sticker-editing', `sticker-shake-${(index % 8) + 1}`);
                btn.draggable = false;
                const del = el('div', 'vp-sticker-del', ICONS.DELETE);
                del.onmousedown = e => { e.stopPropagation(); e.preventDefault(); };
                del.onclick = e => { e.stopPropagation(); e.preventDefault(); deleteSticker(key, index); };
                btn.appendChild(del);
                btn.addEventListener('pointerdown', e => startStickerDrag(e, btn, key));
                return btn;
            }

            function scrollToPack(key) {
                const header = scrollContainer && scrollContainer.querySelector(`.pack-header[data-pack="${key}"]`);
                if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            function updateActiveTabFromScroll() {
                if (editPack || !scrollContainer) return;
                const top = scrollContainer.getBoundingClientRect().top + 50;
                let active = 'recent', min = Infinity;
                for (const h of scrollContainer.querySelectorAll(':scope > .pack-header')) {
                    const d = h.getBoundingClientRect().top - top;
                    if (d <= 0 && -d < min) { min = -d; active = h.dataset.pack; }
                }
                recentBtn.classList.toggle('vp-on', active === 'recent');
                tabsRow.querySelectorAll('.vp-sp-tab').forEach(t => t.classList.toggle('vp-on', t.dataset.pack === active));
            }

            function showPanel() {
                if (!stickerBtn || !stickerBtn.isConnected) return;
                clearTimeout(hideTimeout);
                createStickerPanel();
                if (!scrollContainer.children.length) renderAllContent();
                const rect = stickerBtn.getBoundingClientRect();
                stickerPanel.style.bottom = `${window.innerHeight - rect.top + 8}px`;
                stickerPanel.style.left = `${Math.min(rect.left, window.innerWidth - PANEL_WIDTH - 20)}px`;
                stickerPanel.classList.add('vp-open');
                disablePageScroll();
            }
            function hidePanel(delay) {
                clearTimeout(hideTimeout);
                hideTimeout = setTimeout(() => {
                    if (!stickerPanel || !stickerPanel.classList.contains('vp-open')) return;
                    if (stickerPanel.classList.contains('vp-drag')) return hidePanel(delay);
                    if (stickerPanel.querySelector('.vp-sp-import')) return hidePanel(delay);
                    stickerPanel.classList.remove('vp-open');
                    exitEditMode();
                    enablePageScroll();
                }, delay);
            }

            function showCropEditor(imageUrl) {
                return new Promise(resolve => {
                    const modal = el('div', 'vp-crop-modal');
                    modal.innerHTML = `<div class="vp-crop-editor"><h3>Обрежьте стикер</h3>
                    <div class="vp-crop-view"><img><div class="vp-crop-overlay"><div class="vp-crop-area">${['n', 'e', 's', 'w', 'nw', 'ne', 'sw', 'se'].map(d => `<div class="resize-handle" data-direction="${d}"></div>`).join('')}</div></div></div>
                    <div class="vp-crop-ratios"></div>
                    <div class="vp-crop-actions"><button class="vp-crop-cancel">Отмена</button><button class="vp-crop-ok">Готово</button></div></div>`;
                    const view = modal.querySelector('.vp-crop-view');
                    const img = view.querySelector('img');
                    const area = modal.querySelector('.vp-crop-area');
                    img.src = imageUrl;
                    let ratio = null;
                    let action = null;

                    const RATIOS = [['Свободный', null], ['1:1', 1], ['4:3', 4 / 3], ['3:4', 3 / 4], ['16:9', 16 / 9], ['9:16', 9 / 16]];
                    const ratioRow = modal.querySelector('.vp-crop-ratios');
                    RATIOS.forEach(([label, value], i) => {
                        const b = el('button', 'aspect-ratio-btn' + (i ? '' : ' vp-on'));
                        b.textContent = label;
                        b.onclick = () => {
                            ratio = value;
                            ratioRow.querySelectorAll('.aspect-ratio-btn').forEach(x => x.classList.toggle('vp-on', x === b));
                            if (value !== null) setAspectRatio(value);
                        };
                        ratioRow.appendChild(b);
                    });

                    function imageBounds() {
                        const r = view.getBoundingClientRect();
                        const k = img.naturalWidth / img.naturalHeight;
                        const w = k > r.width / r.height ? r.width : r.height * k;
                        const h = k > r.width / r.height ? r.width / k : r.height;
                        const minX = (r.width - w) / 2, minY = (r.height - h) / 2;
                        return { minX, minY, maxX: minX + w, maxY: minY + h, width: w, height: h };
                    }
                    const place = (left, top, width, height) => Object.assign(area.style, {
                        left: left + 'px', top: top + 'px',
                        ...(width !== undefined && { width: width + 'px', height: height + 'px' })
                    });
                    function constrain() {
                        const b = imageBounds();
                        const w = area.offsetWidth, h = area.offsetHeight;
                        const left = Math.max(b.minX, Math.min(parseFloat(area.style.left) || 0, b.maxX - w));
                        const top = Math.max(b.minY, Math.min(parseFloat(area.style.top) || 0, b.maxY - h));
                        place(left, top, Math.min(w, b.width), Math.min(h, b.height));
                    }
                    function snapToCenter() {
                        const b = imageBounds();
                        const left = parseFloat(area.style.left), top = parseFloat(area.style.top);
                        const cx = b.minX + (b.width - area.offsetWidth) / 2, cy = b.minY + (b.height - area.offsetHeight) / 2;
                        if (Math.abs(left - cx) < 5 || Math.abs(top - cy) < 5) place(Math.abs(left - cx) < 5 ? cx : left, Math.abs(top - cy) < 5 ? cy : top);
                    }
                    function setAspectRatio(k) {
                        const b = imageBounds();
                        let w, h;
                        if (k >= 1) { w = b.width; h = w / k; if (h > b.height) { h = b.height; w = h * k; } }
                        else { h = b.height; w = h * k; if (w > b.width) { w = b.width; h = w / k; } }
                        place(b.minX + (b.width - w) / 2, b.minY + (b.height - h) / 2, w, h);
                        constrain();
                    }
                    function fitToImage() {
                        const b = imageBounds();
                        place(b.minX, b.minY, b.width, b.height);
                    }

                    const onDown = e => {
                        const dir = e.target.classList.contains('resize-handle') ? e.target.dataset.direction : null;
                        const r = area.getBoundingClientRect();
                        action = dir
                            ? { dir, x: e.clientX, y: e.clientY, w: area.offsetWidth, h: area.offsetHeight, left: parseFloat(area.style.left), top: parseFloat(area.style.top) }
                            : { dir: null, x: e.clientX - r.left, y: e.clientY - r.top };
                        if (!dir) area.classList.add('vp-moving');
                        area.setPointerCapture(e.pointerId);
                        e.preventDefault();
                        e.stopPropagation();
                    };
                    const onMove = e => {
                        if (!action) return;
                        const vr = view.getBoundingClientRect();
                        if (!action.dir) {
                            place(e.clientX - vr.left - action.x, e.clientY - vr.top - action.y);
                            constrain();
                            snapToCenter();
                            return;
                        }
                        const b = imageBounds(), a = action, d = a.dir;
                        const dx = e.clientX - a.x, dy = e.clientY - a.y;
                        let w = a.w, h = a.h, x = a.left, y = a.top;
                        if (d.includes('n')) { h = a.h - dy; y = a.top + dy; }
                        if (d.includes('s')) h = a.h + dy;
                        if (d.includes('w')) { w = a.w - dx; x = a.left + dx; }
                        if (d.includes('e')) w = a.w + dx;
                        if (ratio !== null) {
                            if (d === 'n' || d === 's') w = h * ratio; else h = w / ratio;
                            if (w > b.width) { w = b.width; h = w / ratio; }
                            if (h > b.height) { h = b.height; w = h * ratio; }
                            x = d.includes('w') ? a.left + (a.w - w) : d.includes('e') ? a.left : a.left - (w - a.w) / 2;
                            y = d.includes('n') ? a.top + (a.h - h) : d.includes('s') ? a.top : a.top - (h - a.h) / 2;
                        }
                        w = Math.max(50, Math.min(b.width, w));
                        h = Math.max(50, Math.min(b.height, h));
                        x = Math.max(b.minX, Math.min(x, b.maxX - w));
                        y = Math.max(b.minY, Math.min(y, b.maxY - h));
                        place(x, y, w, h);
                        constrain();
                        snapToCenter();
                    };
                    const onUp = () => {
                        if (!action) return;
                        action = null;
                        constrain();
                    };
                    area.addEventListener('pointerdown', onDown);
                    area.addEventListener('pointermove', onMove);
                    area.addEventListener('pointerup', onUp);
                    area.addEventListener('pointercancel', onUp);

                    const close = result => { modal.remove(); URL.revokeObjectURL(imageUrl); resolve(result); };
                    modal.querySelector('.vp-crop-cancel').onclick = () => close(null);
                    modal.querySelector('.vp-crop-ok').onclick = () => {
                        const vr = view.getBoundingClientRect(), cr = area.getBoundingClientRect(), b = imageBounds();
                        const sx = img.naturalWidth / b.width, sy = img.naturalHeight / b.height;
                        const w = cr.width * sx, h = cr.height * sy;
                        const x = Math.max(0, Math.min((cr.left - vr.left - b.minX) * sx, img.naturalWidth - w));
                        const y = Math.max(0, Math.min((cr.top - vr.top - b.minY) * sy, img.naturalHeight - h));
                        const canvas = el('canvas');
                        canvas.width = w;
                        canvas.height = h;
                        canvas.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
                        canvas.toBlob(blob => close(new File([blob], 'sticker.png', { type: 'image/png' })), 'image/png');
                    };
                    document.body.appendChild(modal);
                    img.onload = fitToImage;
                    if (img.complete) fitToImage();
                });
            }

            onDom(function stickerButton() {
                const row = siteEl('stickerContainer');
                if (!row || row.querySelector('.sticker-btn')) return;
                const before = row.querySelector('.' + SELECTORS.stickerMicBtn) || row.querySelector('.' + SELECTORS.stickerSendBtn);
                if (!before) return;
                stickerBtn = el('button', 'sticker-btn', ICONS.STICKER_BUTTON);
                stickerBtn.onmouseenter = showPanel;
                stickerBtn.onmouseleave = () => hidePanel(300);
                row.insertBefore(stickerBtn, before);
            });
        })();

        const MSG_MAX = 990, MSG_TEXT_MAX = 500;
        const MSG_IMG_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
        const MSG_IMG_RE = /\/images\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(\w+)(?:[?#]|$)/i;
        const msgImgUrl = img => `https://cdn.xn--d1ah4a.com/images/${img.id}.${MSG_IMG_EXT[img.ext] || 'png'}`;
        const msgUuidBytes = u => Uint8Array.from(u.replace(/-/g, '').match(/../g), h => parseInt(h, 16));
        const msgBytesUuid = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
        const MSG_ALBUM_MAX = 10;
        const msgPreview = m => m.imgs && m.imgs.length > 1 ? `🖼 ${m.imgs.length} фото` + (m.text ? ' · ' + m.text : '') : m.img ? '🖼 ' + (m.text || 'Фото') : m.text;
        const msgNet = { keys: new Map(), vols: [], me: null, pairs: new Map(), conv: new Map(), syncing: null, blocks: {} };
        const msgBlocks = () => GM_getValue(acctKey('msgBlocked'), {});
        function msgIsBlocked(uid) { const p = msgNet.blocks[uid] || msgBlocks()[uid]; return !!(p && p.length && !p[p.length - 1][1]); }
        const msgBlockedMe = uid => !!(msgNet.blockedMe && msgNet.blockedMe.get(uid) && msgNet.blockedMe.get(uid).on);
        function msgBlockedAt(uid, ts) { const p = msgNet.blocks[uid]; return !!p && p.some(([a, b]) => ts >= a && (!b || ts <= b)); }
        function msgSetBlock(uid, on) {
            const all = msgBlocks(), p = all[uid] || [], now = Math.floor(srvNow() / 1000), open = p.length && !p[p.length - 1][1];
            if (on && !open) p.push([now, 0]);
            if (!on && open) p[p.length - 1][1] = now;
            all[uid] = p.slice(-20);
            GM_setValue(acctKey('msgBlocked'), all);
        }
        const te = new TextEncoder(), td = new TextDecoder();
        const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
        const rnd = n => crypto.getRandomValues(new Uint8Array(n));
        const b64u = {
            enc: u8 => { let s = ''; for (const b of u8) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
            dec: s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0))
        };
        const cjk14 = {
            enc(u8) {
                let out = '', acc = 0, bits = 0;
                for (const b of u8) { acc = (acc << 8) | b; bits += 8; while (bits >= 14) { bits -= 14; out += String.fromCharCode(0x4E00 + ((acc >> bits) & 0x3FFF)); } acc &= (1 << bits) - 1; }
                if (bits) out += String.fromCharCode(0x4E00 + ((acc << (14 - bits)) & 0x3FFF));
                return out;
            },
            dec(s) {
                const out = [];
                let acc = 0, bits = 0;
                for (const ch of s) {
                    const v = ch.charCodeAt(0) - 0x4E00;
                    if (v < 0 || v > 0x3FFF) throw new Error('том: чужой символ');
                    acc = (acc << 14) | v; bits += 14;
                    while (bits >= 8) { bits -= 8; out.push((acc >> bits) & 255); }
                    acc &= (1 << bits) - 1;
                }
                return new Uint8Array(out);
            }
        };
        const pack = recs => cat(...recs.map(r => cat(new Uint8Array([r.length >> 8, r.length & 255]), r)));
        function unpack(u8) {
            const out = [];
            for (let i = 0; i + 2 <= u8.length;) {
                const n = (u8[i] << 8) | u8[i + 1];
                if (!n || i + 2 + n > u8.length) break;
                out.push(u8.slice(i + 2, i + 2 + n)); i += 2 + n;
            }
            return out;
        }
        const volText = (seq, mode, recs) => `ITDXM1 ${seq} ${mode}${(mode === 'c' ? cjk14 : b64u).enc(pack(recs))}`;
        const volRecs = v => unpack(v.mode === 'c' ? cjk14.dec(v.data) : b64u.dec(v.data));
        const msgIdb = (() => {
            let db = null;
            const open = () => db || (db = new Promise((ok, no) => {
                const r = indexedDB.open('itdx-msg', 1);
                r.onupgradeneeded = () => r.result.createObjectStore('keys');
                r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
            }));
            const run = (mode, fn) => open().then(d => new Promise((ok, no) => { const t = d.transaction('keys', mode), q = fn(t.objectStore('keys')); t.oncomplete = () => ok(q.result); t.onerror = () => no(t.error); }));
            return { get: k => run('readonly', s => s.get(k)), set: (k, v) => run('readwrite', s => s.put(v, k)) };
        })();
        const msgMyId = () => (meData && meData.id) || (siteAuth.me && siteAuth.me.id) || null;
        async function pwKey(pw, salt) {
            const base = await crypto.subtle.importKey('raw', te.encode(pw), 'PBKDF2', false, ['deriveKey']);
            return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 310000 }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
        }
        function msgPair(uid) {
            if (!msgNet.pairs.has(uid)) msgNet.pairs.set(uid, (async () => {
                const k = msgNet.keys.get(uid), me = msgNet.me;
                if (!k || !me) return null;
                const pub = await crypto.subtle.importKey('raw', k.pub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
                const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: pub }, me.priv, 256);
                const hk = await crypto.subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
                return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: te.encode([me.id, uid].sort().join('|')), info: te.encode('itdx-msg-v1') },
                    hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
            })().catch(() => null));
            return msgNet.pairs.get(uid);
        }
        async function msgOpenRec(key, rec) {
            try {
                const pt = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: rec.slice(0, 12) }, key, rec.slice(12)));
                const out = { ts: ((pt[0] << 24) >>> 0) + (pt[1] << 16) + (pt[2] << 8) + pt[3], sup: !!(pt[4] & 1) };
                if (pt[4] & 8) { out.svc = pt.slice(5); out.text = ''; return out; }
                if (pt[4] & ~7 || (pt[4] & 4 && !(pt[4] & 2))) { out.text = 'Сообщение из новой версии ИТД X — обнови мод, чтобы его увидеть'; return out; }
                if (pt[4] & 2 && pt.length >= 22) {
                    const imgs = [{ ext: pt[5], id: msgBytesUuid(pt.slice(6, 22)) }];
                    let o = 22;
                    if (pt[4] & 4 && pt.length > 22) {
                        const k = pt[22];
                        o = 23;
                        for (let j = 0; j < k && o + 17 <= pt.length; j++, o += 17) imgs.push({ ext: pt[o], id: msgBytesUuid(pt.slice(o + 1, o + 17)) });
                    }
                    out.img = imgs[0]; out.imgs = imgs; out.text = td.decode(pt.slice(o));
                }
                else out.text = td.decode(pt.slice(5));
                return out;
            } catch (e) { return null; }
        }
        function msgSync() {
            if (msgNet.syncing) return msgNet.again || (msgNet.again = msgNet.syncing.catch(() => { }).then(() => { msgNet.again = null; return msgSync(); }));
            msgNet.syncing = (async () => {
                const keys = new Map(), vols = [];
                let callNote = null;
                await ensureApproved();
                const meId = msgMyId(), iAmOwner = meId === OWNER_ID;
                for (const c of await allComments(MSG_POST_ID, 30)) {
                    const a = c.author, t = String(c.content || '');
                    if (!a || !a.id) continue;
                    if (a.id !== meId && !iAmOwner && !isApprovedAuthor(a)) continue;
                    let m;
                    if ((m = t.match(/^ITDXK1 ([\w-]+) ([\w-]+)$/))) {
                        if (!keys.has(a.id)) keys.set(a.id, { id: a.id, login: a.username || '', cid: c.id, pubText: m[1], pub: b64u.dec(m[1]), sealed: m[2] });
                    } else if (a.id === OWNER_ID && t.startsWith('ITDXE ')) {
                        const o = openText(t);
                        if (o.startsWith('ITDXC1 ')) callNote = { cid: c.id, list: o.slice(7).split(' ').filter(Boolean).map(x => { const [u, ts] = x.split(':'); return { u, ts: +ts || 0 }; }) };
                    } else if ((m = t.match(/^ITDXM1 (\d+) ([cb])([\s\S]*)$/))) vols.push({ cid: c.id, author: a.id, seq: +m[1], mode: m[2], data: m[3], made: Date.parse(c.createdAt || c.created_at || '') || 0 });
                }
                const changed = [...keys].some(([id, k]) => !msgNet.keys.get(id) || msgNet.keys.get(id).pubText !== k.pubText) || keys.size !== msgNet.keys.size;
                msgNet.keys = keys; msgNet.vols = vols.sort((x, y) => x.seq - y.seq); msgNet.callNote = callNote;
                if (changed) msgNet.pairs.clear();
                if (!msgNet.me) await msgLoadMe();
                await msgDecryptAll();
                try { callCheck(); } catch (e) { logErr('звонок', e); }
            })().finally(() => { msgNet.syncing = null; });
            return msgNet.syncing;
        }
        async function msgLoadMe() {
            const id = msgMyId(), k = id && msgNet.keys.get(id);
            if (!k) return null;
            try { const s = await msgIdb.get('me:' + id); if (s && s.pub === k.pubText) msgNet.me = { id, priv: s.priv }; } catch (e) { }
            return msgNet.me;
        }
        async function msgRemember(id, pk8, pubText) {
            const priv = await crypto.subtle.importKey('pkcs8', pk8, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
            msgNet.me = { id, priv }; msgNet.pairs.clear();
            try { await msgIdb.set('me:' + id, { priv, pub: pubText }); } catch (e) { }
        }
        async function msgCreateKey(pw) {
            const id = msgMyId();
            if (!id) throw new Error('Не вошёл в аккаунт');
            const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
            const pub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey)), pk8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', kp.privateKey));
            const salt = rnd(16), iv = rnd(12), ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await pwKey(pw, salt), pk8));
            const content = `ITDXK1 ${b64u.enc(pub)} ${b64u.enc(cat(salt, iv, ct))}`;
            const old = msgNet.keys.get(id);
            const res = old
                ? await editComment(old.cid, content)
                : await sendComment(MSG_POST_ID, content);
            if (!res.ok) throw new Error('Ключ не сохранился: ' + res.status);
            await msgRemember(id, pk8, b64u.enc(pub));
            await msgSync();
        }
        async function msgUnlock(pw) {
            const id = msgMyId(), k = id && msgNet.keys.get(id);
            if (!k) throw new Error('Ключа ещё нет');
            const raw = b64u.dec(k.sealed);
            let pk8;
            try { pk8 = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(16, 28) }, await pwKey(pw, raw.slice(0, 16)), raw.slice(28))); }
            catch (e) { throw new Error('Неверный пароль'); }
            await msgRemember(id, pk8, k.pubText);
            await msgDecryptAll();
        }
        async function msgDecryptAll() {
            const me = msgNet.me;
            if (!me) return;
            const conv = new Map(), add = (uid, dir, m, v, i) => { if (!conv.has(uid)) conv.set(uid, []); conv.get(uid).push({ dir, ...m, _v: v, _i: i }); };
            const others = [...msgNet.keys.keys()].filter(id => id !== me.id);
            for (const v of msgNet.vols) {
                let recs;
                try { recs = volRecs(v); } catch (e) { continue; }
                if (v.author === me.id) {
                    for (const [i, r] of recs.entries()) for (const uid of others) { const k = await msgPair(uid), m = k && await msgOpenRec(k, r); if (m) { add(uid, 'out', m, v, i); break; } }
                } else {
                    const k = await msgPair(v.author);
                    if (k) for (const [i, r] of recs.entries()) { const m = await msgOpenRec(k, r); if (m) add(v.author, 'in', m, v, i); }
                }
            }
            const recBlocks = {}, blockedMe = new Map(), local = msgBlocks(), blocks = Object.assign({}, local);
            conv.forEach((list, uid) => list.forEach(m => {
                if (!m.svc || m.svc[0] !== 5 || m.svc.length < 2) return;
                if (m.dir === 'out') (recBlocks[uid] || (recBlocks[uid] = [])).push([m.ts, !!m.svc[1]]);
                else { const b = blockedMe.get(uid); if (!b || b.ts <= m.ts) blockedMe.set(uid, { ts: m.ts, on: !!m.svc[1] }); }
            }));
            for (const [uid, ev] of Object.entries(recBlocks)) {
                ev.sort((a, b) => a[0] - b[0]);
                const p = [];
                for (const [ts, on] of ev) { const open = p.length && !p[p.length - 1][1]; if (on && !open) p.push([ts, 0]); if (!on && open) p[p.length - 1][1] = ts; }
                const lp = local[uid] || [], lLast = lp.length ? lp[lp.length - 1][1] || lp[lp.length - 1][0] : 0;
                if (ev[ev.length - 1][0] >= lLast) blocks[uid] = p;
            }
            msgNet.blocks = blocks; msgNet.blockedMe = blockedMe;
            conv.forEach((list, uid) => conv.set(uid, list.filter(m => !(m.dir === 'in' && msgBlockedAt(uid, m.ts)))));
            const volSkew = new Map(), authSkew = new Map();
            conv.forEach(list => list.forEach(m => { if (m._i === 0 && m._v.made) volSkew.set(m._v, m.ts - m._v.made / 1000); }));
            volSkew.forEach((k, v) => { if (!authSkew.has(v.author)) authSkew.set(v.author, []); authSkew.get(v.author).push(k); });
            const mid = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
            conv.forEach(list => list.forEach(m => {
                let k = volSkew.has(m._v) ? volSkew.get(m._v) : authSkew.has(m._v.author) ? mid(authSkew.get(m._v.author)) : 0;
                if (Math.abs(k) < 20) k = 0;
                m.at = Math.round(m.ts - k);
                delete m._v; delete m._i;
            }));
            conv.forEach(list => list.sort((x, y) => x.at - y.at || x.ts - y.ts));
            const reacts = new Map(), reads = new Map(), calls = [], sigs = [];
            conv.forEach((list, uid) => {
                const keep = [];
                for (const m of list) {
                    if (!m.svc) { keep.push(m); continue; }
                    const who = m.dir === 'out' ? 'me' : 'them', k = m.svc[0];
                    if (k === 1 && m.svc.length >= 6) {
                        const mine = !!m.svc[5], dir = m.dir === 'out' ? (mine ? 'out' : 'in') : (mine ? 'in' : 'out');
                        const key = reactKey(uid, dir, u32(m.svc, 1)), e = reacts.get(key) || {};
                        if (!e[who] || e[who].ts <= m.ts) e[who] = { ts: m.ts, emoji: td.decode(m.svc.slice(6)) };
                        reacts.set(key, e);
                    } else if (k === 3 && m.dir === 'in' && uid === OWNER_ID) calls.push(m.ts);
                    else if (k === 4 && m.svc.length >= 6) sigs.push({ uid, dir: m.dir, ts: m.ts, type: m.svc[1], id: u32(m.svc, 2), data: m.svc.slice(6) });
                    else if (k === 2 && m.svc.length >= 5) {
                        const r = reads.get(uid) || { me: 0, them: 0 }, at = u32(m.svc, 1), th = m.svc.length >= 6 ? m.svc[5] : -1;
                        r[who] = Math.max(r[who], at);
                        if (th !== 1) r[who + '0'] = Math.max(r[who + '0'] || 0, at);
                        if (th !== 0) r[who + '1'] = Math.max(r[who + '1'] || 0, at);
                        reads.set(uid, r);
                    }
                }
                if (keep.length) conv.set(uid, keep); else conv.delete(uid);
            });
            const pend = msgNet.pendReacts || (msgNet.pendReacts = new Map());
            pend.forEach((q, key) => {
                const e = reacts.get(key) || {}, got = e.me ? e.me.emoji : '';
                if (got === q.emoji || Date.now() > q.until) { pend.delete(key); return; }
                e.me = { ts: q.ts, emoji: q.emoji };
                reacts.set(key, e);
            });
            msgNet.reacts = reacts; msgNet.reads = reads; msgNet.calls = calls; msgNet.sigs = sigs;
            msgNet.conv = conv;
        }
        async function msgPrepImage(file) {
            if (file.type === 'image/gif') { if (file.size > 5 * 1024 * 1024) throw new Error('GIF больше 5 МБ'); return file; }
            const bmp = await createImageBitmap(file);
            const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)), w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            c.getContext('2d').drawImage(bmp, 0, 0, w, h);
            let blob = await new Promise(r => c.toBlob(r, 'image/webp', 0.85));
            if (!blob || blob.type !== 'image/webp') blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
            if (k === 1 && /^image\/(png|jpeg|webp)$/.test(file.type) && file.size <= blob.size) blob = file;
            if (blob.size > 5 * 1024 * 1024) throw new Error('картинка больше 5 МБ');
            return new File([blob], 'img.' + (blob.type.split('/')[1] || 'png'), { type: blob.type });
        }
        async function msgUploadImage(file) {
            const fd = new FormData();
            fd.append('file', await msgPrepImage(file));
            const res = await api('/api/files/upload', { method: 'POST', body: fd });
            if (!res.ok) throw new Error('загрузка картинки: ' + res.status);
            const j = await res.json().catch(() => null), d = j && (j.data || j);
            const m = String(d && d.url || '').match(MSG_IMG_RE), ext = m ? MSG_IMG_EXT.indexOf(m[2].toLowerCase()) : -1;
            if (!m || ext < 0) throw new Error('сервер вернул незнакомую ссылку');
            return { ext, id: m[1].toLowerCase() };
        }
        const be32 = n => new Uint8Array([n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255]);
        const u32 = (b, o) => ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
        const reactKey = (uid, dir, ts) => uid + '|' + dir + '|' + ts;
        const MSG_REACTS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '👎'];
        function msgReact(uid, m, emoji) {
            return msgSend(uid, '', false, null, cat(new Uint8Array([1]), be32(m.ts), new Uint8Array([m.dir === 'out' ? 1 : 0]), te.encode(emoji || '')));
        }
        function msgSendRead(uid, upTo, sup) { return msgSend(uid, '', false, null, cat(new Uint8Array([2]), be32(upTo), new Uint8Array([sup ? 1 : 0]))); }
        async function msgSend(uid, text, sup, img, svc) {
            const me = msgNet.me, key = await msgPair(uid);
            if (!me || !key) throw new Error('нет ключа');
            const ts = Math.floor(srvNow() / 1000), iv = rnd(12);
            const imgs = !img ? [] : Array.isArray(img) ? img.slice(0, MSG_ALBUM_MAX) : [img];
            const one = x => cat(new Uint8Array([x.ext]), msgUuidBytes(x.id));
            const imgBytes = !imgs.length ? new Uint8Array(0)
                : imgs.length === 1 ? one(imgs[0]) : cat(one(imgs[0]), new Uint8Array([imgs.length - 1]), ...imgs.slice(1).map(one));
            const pt = svc ? cat(be32(ts), new Uint8Array([1 | 8]), svc)
                : cat(new Uint8Array([ts >>> 24, (ts >> 16) & 255, (ts >> 8) & 255, ts & 255, (sup ? 1 : 0) | (imgs.length ? 2 : 0) | (imgs.length > 1 ? 4 : 0)]),
                    imgBytes, te.encode(text.slice(0, MSG_TEXT_MAX)));
            const rec = cat(iv, new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, pt)));
            await msgSync();
            const write = async mode => {
                const last = msgNet.vols.filter(v => v.author === me.id).pop();
                let recs = [], seq = 1, cid = null;
                if (last) { try { recs = volRecs(last); } catch (e) { recs = []; } seq = last.seq; cid = last.cid; }
                let content = volText(seq, mode, [...recs, rec]);
                if (!last || content.length > MSG_MAX) { content = volText(last ? seq + 1 : 1, mode, [rec]); cid = null; }
                const res = cid
                    ? await editComment(cid, content)
                    : await sendComment(MSG_POST_ID, content);
                if (!res.ok) throw new Error('сообщение: ' + res.status);
                const saved = await res.json().then(j => { const d = j && (j.data || j.comment || j); return d && d.content; }).catch(() => null);
                return saved == null || saved === content;
            };
            const mode = GM_getValue('msgMode', 'c');
            if (!(await write(mode)) && mode === 'c') { GM_setValue('msgMode', 'b'); await msgSync(); await write('b'); }
            await msgSync();
            return ts;
        }
        const msgKeyOf = login => [...msgNet.keys.values()].find(k => k.login.toLowerCase() === String(login).toLowerCase()) || null;
        const msgIsSupport = () => msgMyId() === OWNER_ID;
        function msgTarget(d) {
            if (d.supUid) return { uid: d.supUid, sup: true };
            if (d.support) { const k = msgNet.keys.get(OWNER_ID); return { uid: k && k.id, sup: true, missing: 'Поддержка ещё не подключила сообщения — напиши в тг @NeuroSFW' }; }
            const k = msgKeyOf(d.login);
            return { uid: k && k.id, sup: false, missing: `У ${d.name} ещё нет ключа сообщений — появится, когда откроет «Сообщения» в ИТД X 3.3.3` };
        }
        const msgThread = t => t.uid ? (msgNet.conv.get(t.uid) || []).filter(m => m.sup === t.sup) : [];
        const msgSeen = () => GM_getValue(acctKey('msgSeen'), {});
        const seenKey = t => (t.sup ? 'sup:' : '') + t.uid;
        const readUpTo = (uid, sup, who) => { const r = msgNet.reads && msgNet.reads.get(uid); return r ? r[(who || 'me') + (sup ? '1' : '0')] || 0 : 0; };
        const seenAt = (seen, uid, sup) => Math.max(seen[(sup ? 'sup:' : '') + uid] || 0, readUpTo(uid, sup));
        const lastInTs = list => list.reduce((a, m) => m.dir === 'in' && m.ts > a ? m.ts : a, 0);
        function msgMarkSeen(t) { const s = msgSeen(), list = msgThread(t); s[seenKey(t)] = Math.max(s[seenKey(t)] || 0, lastInTs(list)); GM_setValue(acctKey('msgSeen'), s); }
        const msgTime = ts => { const d = new Date(ts * 1000), t = d.toTimeString().slice(0, 5); return d.toDateString() === new Date().toDateString() ? t : `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')} ${t}`; };
        function msgFillDialogs() {
            const me = msgNet.me;
            if (me) for (const [uid, list] of msgNet.conv) {
                const k = msgNet.keys.get(uid);
                if (!k) continue;
                if (list.some(m => !m.sup) && !msgPeople.has(k.login) && uid !== OWNER_ID)
                    msgPeople.set(k.login, { id: 'u:' + k.login, login: k.login, ava: '👤', name: k.login, last: '', time: '', unread: 0, msgs: [] });
                if (msgIsSupport() && list.some(m => m.sup) && !MSG_DIALOGS.some(d => d.supUid === uid))
                    MSG_DIALOGS.push({ id: 'sup:' + uid, supUid: uid, ava: '🛟', name: '🛟 ' + k.login, login: '', last: '', time: '', unread: 0, msgs: [] });
            }
            if (msgIsSupport()) MSG_DIALOGS = MSG_DIALOGS.filter(d => !d.support);
            for (const d of msgPeople.values()) if (!MSG_DIALOGS.includes(d)) MSG_DIALOGS.push(d);
            const seen = msgSeen();
            for (const d of MSG_DIALOGS) {
                if (d.bot) continue;
                const t = msgTarget(d), list = msgThread(t);
                if (!list.length) continue;
                const last = list[list.length - 1];
                d.last = (last.dir === 'out' ? 'Ты: ' : '') + msgPreview(last);
                d.lastTs = last.at || last.ts;
                d.time = msgTime(last.at || last.ts);
                d.unread = list.filter(m => m.dir === 'in' && m.ts > seenAt(seen, t.uid, t.sup)).length;
                if (!t.sup && msgIsBlocked(t.uid)) d.last = '🚫 Заблокирован(а)';
                else if (!t.sup && msgBlockedMe(t.uid)) d.last = '🚫 Тебя заблокировали';
            }
        }
        function msgUnread() {
            const seen = msgSeen();
            let n = 0;
            for (const [uid, list] of msgNet.conv) for (const m of list) if (m.dir === 'in' && m.ts > seenAt(seen, uid, m.sup)) n++;
            return n;
        }
        function msgBadge() {
            const n = msgUnread(), txt = n > 99 ? '99+' : String(n);
            const site = document.querySelector('a[href="/notifications"] .' + SELECTORS.navIcon + ' > span');
            const cls = (site ? site.className.split(/\s+/).filter(c => c && !c.startsWith('vp-')).join(' ') + ' ' : '') + 'vp-msg-badge';
            document.querySelectorAll('nav a[href="#"] .' + SELECTORS.navIcon).forEach(ic => {
                let b = ic.querySelector(':scope > .vp-msg-badge');
                if (!n) { if (b) b.remove(); return; }
                if (!b) { b = document.createElement('span'); ic.appendChild(b); }
                if (b.className !== cls) b.className = cls;
                if (b.textContent !== txt) b.textContent = txt;
            });
        }
        onDom(function msgBadgeKeep() { if (msgNet.me) msgBadge(); });
        let msgBase = null, msgToastEl = null;
        function msgOpenFrom(m) {
            if (!messagesOverlay) messagesOverlay = buildMessagesOverlay();
            if (!messagesOverlay.classList.contains('vp-open')) messagesOverlay.open();
            const k = msgNet.keys.get(m.uid);
            const id = m.sup ? (msgIsSupport() ? 'sup:' + m.uid : 'support') : 'u:' + (k ? k.login : '');
            setTimeout(() => messagesOverlay.openDialog && messagesOverlay.openDialog(id), 60);
        }
        function msgToast(m) {
            const k = msgNet.keys.get(m.uid);
            if (!k) return;
            const who = (msgPeople.get(k.login) || {}).name || k.login;
            if (msgToastEl) msgToastEl.remove();
            const tb = toastBox();
            if (tb) tb.querySelectorAll(':scope > div > *').forEach(closeToast);
            const el = document.createElement('div');
            el.className = 'vp-msg-toast';
            el.innerHTML = '<span class="vp-msg-toast-ava"></span><span class="vp-msg-toast-body"><b></b><span></span></span>';
            const ava = m.sup && !msgIsSupport() ? '🛟' : ((msgPeople.get(k.login) || {}).ava || '👤');
            const avaEl = el.firstChild;
            if (/^https?:|^\//.test(ava)) { const im = document.createElement('img'); im.src = ava; im.alt = ''; avaEl.appendChild(im); }
            else { avaEl.textContent = ava; tintCard(el, ava); }
            el.querySelector('b').textContent = m.sup ? (msgIsSupport() ? '🛟 ' + who : 'Поддержка ИТД X') : who;
            el.querySelector('.vp-msg-toast-body span').textContent = msgPreview(m);
            el.onclick = () => { el.remove(); msgOpenFrom(m); };
            document.body.appendChild(el);
            msgToastEl = el;
            setTimeout(() => el.remove(), 7000);
        }
        async function msgBackground() {
            if (!myUsername || apiPaused() || (document.hidden && (!msgNet.me || !leadTab()))) return;
            if (Date.now() - (msgBackground.at || 0) < 20000) return;
            msgBackground.at = Date.now();
            try { await msgSync(); } catch (e) { return; }
            const myId = msgMyId(), plainCalls = ((msgNet.callNote && msgNet.callNote.list) || []).filter(x => x.u === myId).map(x => x.ts);
            const callAt = Math.max(0, ...(msgNet.me ? msgNet.calls || [] : []), ...plainCalls), callSeen = +GM_getValue(acctKey('vp_call_seen'), 0) || 0;
            if (callAt > callSeen) { GM_setValue(acctKey('vp_call_seen'), callAt); if (srvNow() / 1000 - callAt < 180) fakeCall(); }
            if (!msgNet.me) return;
            const incoming = [];
            for (const [uid, list] of msgNet.conv) for (const m of list) if (m.dir === 'in') incoming.push({ uid, ...m });
            incoming.sort((a, b) => (a.at || a.ts) - (b.at || b.ts));
            const idOf = m => m.uid + '|' + m.ts + '|' + (m.sup ? 1 : 0), ids = new Set(incoming.map(idOf));
            if (msgBase !== null) {
                const fresh = incoming.filter(m => !msgBase.has(idOf(m))), last = fresh[fresh.length - 1];
                const open = messagesOverlay && messagesOverlay.classList.contains('vp-open'), cur = open && messagesOverlay.currentTarget && messagesOverlay.currentTarget();
                if (last && !(cur && cur.uid === last.uid && cur.sup === last.sup)) msgToast(last);
            }
            msgBase = ids;
            msgBadge();
            if (messagesOverlay && messagesOverlay.classList.contains('vp-open') && messagesOverlay.refreshList) messagesOverlay.refreshList();
        }
        setTimeout(msgBackground, 8000);
        setInterval(msgBackground, 60000);
        setInterval(() => {
            const c = callNet.cur, open = messagesOverlay && messagesOverlay.classList.contains('vp-open');
            const every = c && /^(calling|ringing|connecting)$/.test(c.state) ? 4000 : document.hidden ? 0 : open ? 15000 : 0;
            if (!every || Date.now() - callNet.lastSync < every || msgNet.syncing || !msgNet.me || apiPaused()) return;
            callNet.lastSync = Date.now();
            msgSync().catch(() => { });
        }, 1000);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) msgBackground(); });
        const msgToastCss = addCss(`
        .vp-msg-badge { position: absolute; top: -6px; right: -10px; min-width: 18px; height: 18px; padding: 0 5px; box-sizing: border-box; font-size: 11px; font-weight: 600;
            line-height: 18px; text-align: center; color: #fff; background-color: var(--accent-like, #f91880); border-radius: 9px; pointer-events: none; }
        nav a[href="#"] .vp-nav-icon:has(> .vp-msg-badge) { position: relative; }
        .vp-msg-toast { position: fixed; top: 16px; left: 50vw; transform: translateX(-50%); z-index: 2147483000; width: min(420px, calc(100vw - 24px)); box-sizing: border-box;
            display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 24px; cursor: pointer; color: var(--text-primary, #fff);
            background: var(--block-bg); border: 1px solid var(--border-color, rgba(255, 255, 255, .12)); box-shadow: 0 14px 36px rgba(0, 0, 0, .45);
            backdrop-filter: var(--vp-glass-filter, blur(18px)); -webkit-backdrop-filter: var(--vp-glass-filter, blur(18px)); animation: vpMsgToastIn .25s ease-out; }
        .vp-msg-toast-ava { flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px;
            overflow: hidden; background: rgba(127, 127, 127, .18); }
        .vp-msg-toast-ava img { width: 100%; height: 100%; object-fit: cover; }
        .vp-msg-toast-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .vp-msg-toast b { font-size: 14px; }
        .vp-msg-toast-body span { font-size: 14px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        @keyframes vpMsgToastIn { from { opacity: 0; transform: translate(-50%, -8px); } }
        @media (max-width: ${PHONE_MAX}px) { .vp-msg-toast { top: calc(env(safe-area-inset-top, 0px) + 10px); } }
        @media (prefers-reduced-motion: reduce) { .vp-msg-toast { animation: none; } }
    `);
        const msgKeyCss = addCss(`
        .vp-msgs-beta { display: inline-block; vertical-align: middle; margin-left: 6px; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;
            letter-spacing: .03em; color: var(--vp-accent); box-shadow: inset 0 0 0 1px var(--vp-accent); }
        .vp-msgs-key { display: flex; flex-direction: column; gap: 10px; max-width: 360px; margin: 12px auto; }
        .vp-msgs-key input { padding: 11px 14px; border-radius: 14px; border: 1px solid var(--border-color, rgba(255,255,255,.14)); background: rgba(255,255,255,.06);
            color: inherit; font: inherit; font-size: 15px; outline: none; }
        .vp-msgs-key input:focus { border-color: var(--vp-accent); }
        .vp-msgs-key button { padding: 11px; border: 0; border-radius: 14px; cursor: pointer; font: inherit; font-weight: 600; background: var(--vp-accent); color: #000; }
        .vp-msgs-key button:disabled { opacity: .5; cursor: default; }
        .vp-msgs-keyerr { min-height: 18px; font-size: 13px; text-align: center; color: var(--text-secondary); }
    `);

        let messagesOverlay = null;

        const MESSAGE_JOKES = [
            ['🔥', 'Сообщение получил. Сервер тоже получил — и перегрелся'],
            ['🐹', 'Сервер работает на хомяке в колесе. Хомяк ушёл на обед'],
            ['⏳', 'Лента грузится. Не трогай — спугнёшь'],
            ['🧱', '502 Bad Gateway — это не ошибка, это стиль жизни'],
            ['🔄', 'Переподключаюсь… Переподключаюсь… О, опять ты'],
            ['❤️', 'Лайк засчитан. Наверное. Обнови страницу — узнаем вместе'],
            ['🔔', 'Уведомление о твоём сообщении придёт завтра. Или вчера. Как повезёт'],
            ['🖼️', 'Картинка не загрузилась? Она стесняется. Дай ей минутку'],
            ['🛠️', 'Ведутся технические работы. Какие — сами не знаем, но ведутся'],
            ['🎲', 'Шанс, что пост опубликуется с первого раза: сегодня 50 на 50'],
            ['🧯', 'Если сайт упал — это не баг, это он прилёг отдохнуть'],
            ['📉', 'Онлайн растёт, сервер — нет. Держимся'],
            ['🐛', 'Это не баг, это фича. Вот этот — точно фича. Наверное'],
            ['🌀', 'Крутилка крутится — значит, я жив. Логика железная'],
            ['🥔', 'Сервер у нас надёжный: картофельный, отечественный'],
            ['🔌', 'Кто-то снова задел провод. Ставим табличку «не трогать»'],
            ['🧊', 'Подморозил ленту, чтобы ты отдохнул от прокрутки. Забота'],
            ['📦', 'Твоё сообщение в очереди. Перед ним ещё 4000 лайков'],
            ['🤐', 'Отправлено в обработку. Обработка отправлена в отпуск'],
            ['🕳️', 'Комментарий исчез? Он в лучшем мире, там где старые посты'],
            ['📶', 'Сайт открылся с первого раза? Сделай скрин — никто не поверит'],
            ['⚙️', 'Обновили сайт. Что сломали — узнаем от пользователей'],
            ['🧪', 'Ты тестируешь ИТД в прямом эфире. Спасибо за вклад в науку'],
            ['🐌', 'Сервер думает. Не торопи, он в первый раз'],
            ['🔢', 'Счётчик подписчиков немного устал считать. Он не врёт, он округляет'],
            ['🕰️', 'Прочитано «только что» — по серверному времени это час назад'],
            ['👻', 'Пост висит, но его нет. Или есть, но не висит. Квантовая лента'],
            ['🎰', 'Обнови страницу — вдруг выпадет рабочая версия'],
            ['🧹', 'Кеш почистили. Вместе с частью ленты. Бывает'],
            ['🫡', 'Все системы в норме. Кроме тех, что не в норме'],
            ['🚧', 'Ошибка загрузки. Попробуйте позже. Позже тоже попробуйте'],
            ['🛸', 'Запрос улетел и не вернулся. Ждём сигнала из космоса'],
        ];
        const BOT_HELLO = [['👋', 'Привет! Я Сервер ИТД. Сегодня почти работаю'], ['🫡', 'На связи! Пока связь есть — пиши быстрее']];
        const BOT_ASK = [['🤔', 'Хороший вопрос. Отвечу после перезагрузки. Своей'], ['🔮', 'Шар предсказаний говорит: «ошибка 500, спроси позже»']];

        const MSG_BOT = {
            id: 'bot', ava: '🤖', name: 'Сервер ИТД', login: '', last: 'Напиши что-нибудь — отвечу, если не упаду', time: 'сейчас', unread: 1, online: true, bot: true,
            msgs: [['in', 'Привет! Я — Сервер ИТД 🤖 Иногда работаю, иногда отдыхаю'], ['in', 'Напиши что угодно — расскажу, как у меня дела. Спойлер: грузятся 😏']]
        };
        const MSG_SUPPORT = {
            id: 'support', ava: '🛟', name: 'Поддержка ИТД X', login: '', last: 'Нашёл баг или есть идея — пиши сюда', time: '', unread: 0, online: true, support: true,
            msgs: [['in', 'Привет! Это поддержка ИТД X 👋'], ['in', 'Нашёл баг или есть идея — опиши здесь, ответ придёт в этот чат']]
        };
        let supportTicket = 0;
        let MSG_DIALOGS = [MSG_BOT, MSG_SUPPORT];
        const msgPins = () => GM_getValue(acctKey('msgPins'), []);
        const msgOpened = () => { const o = GM_getValue(acctKey('msgOpened'), {}); return o && typeof o === 'object' ? o : {}; };
        function msgMarkOpened(id) { const o = msgOpened(); o[id] = Math.floor(Date.now() / 1000); GM_setValue(acctKey('msgOpened'), o); }
        function sortDialogs(list) {
            const pins = msgPins(), opened = msgOpened();
            const act = d => Math.max(d.lastTs || 0, opened[d.id] || 0);
            const rest = list.filter(d => !pins.includes(d.id)).map((d, i) => [d, i]).sort(([a, i], [b, j]) => act(b) - act(a) || i - j).map(([d]) => d);
            return [...list.filter(d => pins.includes(d.id)).sort((a, b) => pins.indexOf(a.id) - pins.indexOf(b.id)), ...rest];
        }
        const msgPeople = new Map();
        async function loadMsgPeople(onUpdate) {
            const names = verifiedNames().filter(n => !myUsername || n.toLowerCase() !== myUsername.toLowerCase()).sort((a, b) => a.localeCompare(b));
            names.forEach(n => { if (!msgPeople.has(n)) msgPeople.set(n, { id: 'u:' + n, login: n, ava: '👤', name: n, last: 'Тоже с ИТД X · напиши первым', time: '', unread: 0, msgs: [] }); });
            MSG_DIALOGS = [MSG_BOT, MSG_SUPPORT, ...names.map(n => msgPeople.get(n))];
            onUpdate();
            await Promise.all(names.map(async n => {
                const d = await hcData(n).catch(() => null), p = msgPeople.get(n);
                if (!d || !p) return;
                p.name = pick(d.displayName, d.display_name, n);
                p.ava = pick(d.avatar && (d.avatar.url || d.avatar), d.avatarUrl, d.emoji, '👤');
                p.online = !!d.online; p.lastSeen = d.lastSeen || null;
            }));
            onUpdate();
        }
        const MSG_ICON = {
            back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
            edit: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z"/><path d="M13.5 6.5l4 4"/></svg>',
            search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
            call: svgIcon(GLYPH.phone, 21),
            more: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
            clip: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5 12.5 19a5 5 0 0 1-7-7L13 4.5a3.3 3.3 0 0 1 4.7 4.7l-7.4 7.4a1.7 1.7 0 0 1-2.4-2.4l6.7-6.7"/></svg>',
            smile: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01" stroke-width="2.6"/></svg>',
            send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>',
            pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15 3l6 6-3 1-4 4 .5 4.5-1.5 1.5-4-4-5 5-1-1 5-5-4-4L5.5 9.5 10 10l4-4Z"/></svg>'
        };

        const EMOJI_SETS = [
            ['😀', 'Смайлы', '😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 🫠 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 🥲 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🫢 🫣 🤫 🤔 🫡 🤐 🤨 😐 😑 😶 🫥 😏 😒 🙄 😬 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🤠 🥳 🥸 😎 🤓 🧐 😕 🫤 😟 🙁 😮 😯 😲 😳 🥺 🥹 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 ☠️ 💩 🤡 👹 👺 👻 👽 👾 🤖 😺 😸 😹 😻 😼 😽 🙀 😿 😾'],
            ['👍', 'Жесты и люди', '👋 🤚 🖐️ ✋ 🖖 🫱 🫲 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 🫵 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 🫶 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾 🦵 🦶 👂 👃 🧠 🫀 👀 👁️ 👅 👄 🫦 👶 🧒 👦 👧 🧑 👱 👨 🧔 👩 🧓 👴 👵 🙍 🙎 🙅 🙆 💁 🙋 🧏 🙇 🤦 🤷 👮 🕵️ 💂 🥷 👷 🤴 👸 👳 🤵 👰 🤰 👼 🎅 🦸 🦹 🧙 🧚 🧛 🧜 🧝 🧞 🧟 💆 💇 🚶 🧍 🧎 🏃 💃 🕺 👯 🧖 🧗 🤺 🏇 ⛷️ 🏂 🏄 🚣 🏊 🚴 🤸 🤼 🤽 🤾 🤹 🧘 🛀 🛌 👭 👫 👬 💏 💑 👪'],
            ['🐱', 'Животные и природа', '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐒 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🪱 🐛 🦋 🐌 🐞 🐜 🪰 🕷️ 🦂 🐢 🐍 🦎 🦖 🦕 🐙 🦑 🦐 🦞 🦀 🐡 🐠 🐟 🐬 🐳 🐋 🦈 🐊 🐅 🐆 🦓 🦍 🦧 🐘 🦛 🦏 🐪 🐫 🦒 🦘 🐃 🐂 🐄 🐎 🐖 🐏 🐑 🦙 🐐 🦌 🐕 🐩 🐈 🐓 🦃 🦚 🦜 🦢 🦩 🕊️ 🐇 🦝 🦨 🦡 🦫 🦦 🦥 🐁 🐀 🐿️ 🦔 🐾 🐉 🐲 🌵 🎄 🌲 🌳 🌴 🌱 🌿 ☘️ 🍀 🍃 🍂 🍁 🍄 🌾 💐 🌷 🌹 🥀 🌺 🌸 🌼 🌻 🌞 🌝 🌚 🌙 🌎 🪐 ⭐ 🌟 ✨ ⚡ ☄️ 💥 🔥 🌪️ 🌈 ☀️ 🌤️ ⛅ ☁️ 🌧️ ⛈️ 🌩️ ❄️ ☃️ ⛄ 💨 💧 💦 🌊'],
            ['🍔', 'Еда и напитки', '🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒 🌶️ 🫑 🌽 🥕 🧄 🧅 🥔 🍠 🥐 🥯 🍞 🥖 🥨 🧀 🥚 🍳 🧈 🥞 🧇 🥓 🥩 🍗 🍖 🌭 🍔 🍟 🍕 🫓 🥪 🥙 🧆 🌮 🌯 🫔 🥗 🥘 🫕 🥫 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🦪 🍤 🍙 🍚 🍘 🍥 🥠 🥮 🍢 🍡 🍧 🍨 🍦 🥧 🧁 🍰 🎂 🍮 🍭 🍬 🍫 🍿 🍩 🍪 🌰 🥜 🍯 🥛 🍼 ☕ 🍵 🧃 🥤 🧋 🍶 🍺 🍻 🥂 🍷 🥃 🍸 🍹 🧉 🍾 🧊 🥄 🍴 🍽️'],
            ['⚽', 'Занятия', '⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🥏 🎱 🪀 🏓 🏸 🏒 🏑 🥍 🏏 🪃 🥅 ⛳ 🪁 🏹 🎣 🤿 🥊 🥋 🎽 🛹 🛼 🛷 ⛸️ 🥌 🎿 🏋️ 🏆 🥇 🥈 🥉 🏅 🎖️ 🎗️ 🎫 🎟️ 🎪 🎭 🩰 🎨 🎬 🎤 🎧 🎼 🎹 🥁 🪘 🎷 🎺 🪗 🎸 🪕 🎻 🎲 ♟️ 🎯 🎳 🎮 🕹️ 🎰 🧩'],
            ['🚗', 'Поездки и места', '🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚐 🛻 🚚 🚛 🚜 🛴 🚲 🛵 🏍️ 🛺 🚨 🚔 🚍 🚘 🚖 🚡 🚠 🚟 🚃 🚋 🚞 🚝 🚄 🚅 🚈 🚂 🚆 🚇 🚊 🚉 ✈️ 🛫 🛬 🛩️ 💺 🛰️ 🚀 🛸 🚁 🛶 ⛵ 🚤 🛥️ 🛳️ ⛴️ 🚢 ⚓ ⛽ 🚧 🚦 🚥 🗺️ 🗿 🗽 🗼 🏰 🏯 🏟️ 🎡 🎢 🎠 ⛲ ⛱️ 🏖️ 🏝️ 🏜️ 🌋 ⛰️ 🏔️ 🗻 🏕️ ⛺ 🏠 🏡 🏘️ 🏚️ 🏗️ 🏭 🏢 🏬 🏣 🏤 🏥 🏦 🏨 🏪 🏫 🏩 💒 🏛️ ⛪ 🕌 🕍 🛕 🕋 ⛩️ 🌅 🌄 🌠 🎇 🎆 🌇 🌆 🏙️ 🌃 🌌 🌉 🌁'],
            ['💡', 'Предметы', '⌚ 📱 📲 💻 ⌨️ 🖥️ 🖨️ 🖱️ 💽 💾 💿 📀 📼 📷 📸 📹 🎥 📽️ 🎞️ 📞 ☎️ 📟 📠 📺 📻 🎙️ ⏱️ ⏰ 🕰️ ⌛ ⏳ 📡 🔋 🔌 💡 🔦 🕯️ 🧯 💸 💵 💴 💶 💷 🪙 💰 💳 💎 ⚖️ 🧰 🔧 🔨 ⚒️ 🛠️ ⛏️ 🔩 ⚙️ 🧱 ⛓️ 🧲 🔫 💣 🧨 🪓 🔪 🗡️ ⚔️ 🛡️ 🚬 ⚰️ 🔮 📿 🧿 💈 ⚗️ 🔭 🔬 🕳️ 🩹 🩺 💊 💉 🩸 🧬 🦠 🧫 🧪 🌡️ 🧹 🧺 🧻 🚽 🚿 🛁 🧼 🪥 🪒 🧽 🧴 🛎️ 🔑 🗝️ 🚪 🪑 🛋️ 🛏️ 🧸 🪆 🖼️ 🪞 🪟 🛍️ 🛒 🎁 🎈 🎏 🎀 🪄 🪅 🎊 🎉 🎎 🏮 🎐 🧧 ✉️ 📩 📨 📧 💌 📥 📤 📦 🏷️ 📪 📬 📭 📮 📯 📜 📃 📄 📑 🧾 📊 📈 📉 🗒️ 🗓️ 📆 📅 🗑️ 📇 🗃️ 🗳️ 🗄️ 📋 📁 📂 🗂️ 🗞️ 📰 📓 📔 📒 📕 📗 📘 📙 📚 📖 🔖 🧷 🔗 📎 🖇️ 📐 📏 🧮 📌 📍 ✂️ 🖊️ 🖋️ ✒️ 🖌️ 🖍️ 📝 ✏️ 🔍 🔎 🔏 🔐 🔒 🔓'],
            ['❤️', 'Символы', '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❤️‍🔥 ❤️‍🩹 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ☮️ ✝️ ☪️ 🕉️ ☸️ ✡️ 🔯 ☯️ ☦️ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ ⚛️ ☢️ ☣️ 📴 📳 ✴️ 🆚 💮 🅰️ 🅱️ 🆎 🆑 🅾️ 🆘 ❌ ⭕ 🛑 ⛔ 📛 🚫 💯 💢 ♨️ 🔞 📵 🚭 ❗ ❕ ❓ ❔ ‼️ ⁉️ 🔅 🔆 ⚠️ 🚸 🔱 ⚜️ 🔰 ♻️ ✅ 💹 ❇️ ✳️ ❎ 🌐 💠 🌀 💤 🚾 ♿ 🅿️ 🚹 🚺 🚼 ⚧️ 🚻 🎦 📶 🔣 ℹ️ 🔤 🆖 🆗 🆙 🆒 🆕 🆓 🔟 🔢 ▶️ ⏸️ ⏹️ ⏺️ ⏭️ ⏮️ ⏩ ⏪ ◀️ 🔼 🔽 ➡️ ⬅️ ⬆️ ⬇️ ↗️ ↘️ ↙️ ↖️ ↕️ ↔️ ↪️ ↩️ ⤴️ ⤵️ 🔀 🔁 🔂 🔄 🔃 🎵 🎶 ➕ ➖ ➗ ✖️ ♾️ 💲 💱 ™️ ©️ ®️ 〰️ ➰ ➿ 🔚 🔙 🔛 🔝 🔜 ✔️ ☑️ 🔘 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🟤 🔺 🔻 🔸 🔹 🔶 🔷 🔳 🔲 ▪️ ▫️ ◾ ◽ ◼️ ◻️ 🟥 🟧 🟨 🟩 🟦 🟪 ⬛ ⬜ 🟫 🔈 🔇 🔉 🔊 🔔 🔕 📣 📢 💬 💭 🗯️ ♠️ ♣️ ♥️ ♦️ 🃏 🎴 🀄'],
            ['🏳️', 'Флаги', '🏳️ 🏴 🏁 🚩 🏳️‍🌈 🏳️‍⚧️ 🏴‍☠️ 🇷🇺 🇺🇦 🇧🇾 🇰🇿 🇺🇸 🇬🇧 🇩🇪 🇫🇷 🇮🇹 🇪🇸 🇵🇱 🇹🇷 🇯🇵 🇰🇷 🇨🇳 🇮🇳 🇧🇷 🇨🇦 🇦🇺 🇦🇲 🇬🇪 🇦🇿 🇺🇿 🇰🇬 🇹🇯 🇲🇩 🇱🇻 🇱🇹 🇪🇪 🇫🇮 🇸🇪 🇳🇴 🇩🇰 🇳🇱 🇧🇪 🇨🇭 🇦🇹 🇨🇿 🇸🇰 🇭🇺 🇷🇴 🇧🇬 🇷🇸 🇬🇷 🇮🇱 🇦🇪 🇪🇬 🇲🇽 🇦🇷 🇹🇭 🇻🇳 🇮🇩']
        ];
        const EMOJI_RECENT_MAX = 24;
        const emojiRecent = () => { const r = GM_getValue(acctKey('vp_emoji_recent'), []); return Array.isArray(r) ? r : []; };
        function emojiRemember(e) { GM_setValue(acctKey('vp_emoji_recent'), [e, ...emojiRecent().filter(x => x !== e)].slice(0, EMOJI_RECENT_MAX)); }
        const vpEmojiCss = addCss(`
        .vp-emoji { position: fixed; z-index: 2147483600; width: 280px; height: 380px; display: flex; flex-direction: column; border-radius: 18px; overflow: hidden;
            background: var(--block-bg); color: var(--text-primary, #fff); box-shadow: 0 12px 40px rgba(0, 0, 0, .45), 0 0 0 1px var(--border-color, rgba(255, 255, 255, .08));
            animation: vp-emoji-in .15s ease-out both; }
        .vp-emoji.vp-closing { animation: vp-emoji-out .15s ease-in both; }
        @keyframes vp-emoji-in { from { opacity: 0; transform: scale(.94); } }
        @keyframes vp-emoji-out { to { opacity: 0; transform: scale(.94); } }
        .vp-emoji-tabs { display: flex; gap: 2px; padding: 6px 6px 4px; border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, .08)); flex-shrink: 0; }
        .vp-emoji-tabs button { flex: 1; min-width: 0; height: 30px; border: 0; padding: 0; border-radius: 8px; background: transparent; font-size: 17px; line-height: 1; cursor: pointer;
            filter: grayscale(1); opacity: .6; transition: opacity .15s, filter .15s, background-color .15s; }
        .vp-emoji-tabs button:hover, .vp-emoji-tabs button.vp-on { filter: none; opacity: 1; background: var(--block-hover-bg, rgba(255, 255, 255, .06)); }
        .vp-emoji-body { flex: 1; overflow-y: auto; padding: 0 6px 8px; overscroll-behavior: contain; scrollbar-width: thin; }
        .vp-emoji-sec b { display: block; position: sticky; top: 0; padding: 8px 4px 4px; font-size: 12px; font-weight: 600; color: var(--text-secondary);
            background-color: var(--block-bg); z-index: 1; }
        .vp-emoji-grid { display: grid; grid-template-columns: repeat(8, 1fr); }
        .vp-emoji-grid button { aspect-ratio: 1; border: 0; padding: 0; border-radius: 8px; background: transparent; font-size: 22px; line-height: 1; cursor: pointer;
            font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif; transition: transform .1s, background-color .1s; }
        .vp-emoji-grid button:hover { background: var(--block-hover-bg, rgba(255, 255, 255, .08)); transform: scale(1.15); }
        .vp-emoji-empty { padding: 6px 4px; font-size: 12px; color: var(--text-secondary); }`);
        function attachEmojiPicker(btn, onPick) {
            let el = null, openT = 0, closeT = 0;
            const hover = matchMedia('(hover: hover) and (pointer: fine)').matches;
            const place = () => {
                const r = btn.getBoundingClientRect(), W = 280, H = 380, gap = 8;
                const top = innerHeight - r.bottom >= H + gap ? r.bottom + gap : Math.max(gap, r.top - H - gap);
                const left = innerWidth - r.left >= W || innerWidth - r.left > r.right ? Math.min(r.left, innerWidth - W - gap) : Math.max(gap, r.right - W);
                el.style.top = top + 'px';
                el.style.left = Math.max(gap, left) + 'px';
                el.style.transformOrigin = `${top < r.top ? 'bottom' : 'top'} ${left <= r.left ? 'left' : 'right'}`;
            };
            const outside = e => { if (el && !el.contains(e.target) && !btn.contains(e.target)) close(); };
            const onKey = e => { if (e.key === 'Escape' && el) { e.stopPropagation(); close(); } };
            function close() {
                clearTimeout(openT); clearTimeout(closeT);
                if (!el) return;
                const old = el;
                el = null;
                old.classList.add('vp-closing');
                setTimeout(() => old.remove(), 150);
                document.removeEventListener('pointerdown', outside, true);
                removeEventListener('keydown', onKey, true);
                removeEventListener('resize', close);
            }
            function later() { clearTimeout(closeT); closeT = setTimeout(close, 250); }
            function build() {
                el = document.createElement('div');
                el.className = 'vp-emoji';
                const recent = emojiRecent();
                const secs = [['🕘', 'Недавние', recent], ...EMOJI_SETS.map(([i, n, e]) => [i, n, e.split(' ')])];
                el.innerHTML = `<div class="vp-emoji-tabs">${secs.map(([i, n], k) => `<button type="button" title="${n}" data-k="${k}">${i}</button>`).join('')}</div><div class="vp-emoji-body"></div>`;
                const body = el.querySelector('.vp-emoji-body');
                secs.forEach(([, n, list], k) => {
                    const sec = document.createElement('section');
                    sec.className = 'vp-emoji-sec';
                    sec.dataset.k = k;
                    sec.innerHTML = '<b></b><div class="vp-emoji-grid"></div>';
                    sec.firstChild.textContent = n;
                    if (!list.length) sec.lastChild.outerHTML = '<div class="vp-emoji-empty">Здесь появятся эмодзи, которые ты выбирал</div>';
                    else sec.lastChild.innerHTML = list.map(e => `<button type="button">${e}</button>`).join('');
                    body.appendChild(sec);
                });
                const tabs = [...el.querySelectorAll('.vp-emoji-tabs button')];
                const mark = () => {
                    const y = body.scrollTop + 4;
                    let cur = 0;
                    body.querySelectorAll('.vp-emoji-sec').forEach(sc => { if (sc.offsetTop <= y) cur = +sc.dataset.k; });
                    tabs.forEach(t => t.classList.toggle('vp-on', +t.dataset.k === cur));
                };
                body.addEventListener('scroll', mark, { passive: true });
                el.querySelector('.vp-emoji-tabs').addEventListener('click', e => {
                    const t = e.target.closest('button');
                    if (!t) return;
                    const sc = body.querySelector(`.vp-emoji-sec[data-k="${t.dataset.k}"]`);
                    if (sc) body.scrollTo({ top: sc.offsetTop, behavior: 'smooth' });
                });
                body.addEventListener('click', e => {
                    const b = e.target.closest('.vp-emoji-grid button');
                    if (!b) return;
                    const em = b.textContent;
                    if (onPick(em) !== false) emojiRemember(em);
                });
                el.addEventListener('mousedown', e => e.preventDefault());
                if (hover) { el.addEventListener('mouseenter', () => clearTimeout(closeT)); el.addEventListener('mouseleave', later); }
                document.body.appendChild(el);
                place();
                if (!recent.length) body.scrollTop = body.querySelector('.vp-emoji-sec[data-k="1"]').offsetTop;
                mark();
                document.addEventListener('pointerdown', outside, true);
                addEventListener('keydown', onKey, true);
                addEventListener('resize', close);
            }
            btn.addEventListener('click', e => { e.preventDefault(); if (el) close(); else build(); });
            if (hover) {
                btn.addEventListener('mouseenter', () => { clearTimeout(closeT); if (!el) { clearTimeout(openT); openT = setTimeout(() => { if (!el) build(); }, 100); } });
                btn.addEventListener('mouseleave', () => { clearTimeout(openT); if (el) later(); });
            }
            return { close };
        }
        function buildMessagesOverlay() {
            const style = addCss(`
        .vp-msgs { position: fixed; z-index: 5; display: none; flex-direction: column; box-sizing: border-box; overflow: hidden;
            background: var(--block-bg); color: var(--text-primary, #fff); font-family: inherit;
            backdrop-filter: var(--vp-glass-filter, none); -webkit-backdrop-filter: var(--vp-glass-filter, none); }
        .vp-msgs.vp-open { display: flex; animation: vpMsgsIn .22s cubic-bezier(.2, .8, .2, 1); }
        html.vp-msgs-open .vp-msgs-navwrap { z-index: 10 !important; }
        html.vp-msgs-open .itd-scroll-top-btn { opacity: 0 !important; visibility: hidden !important; }
        html.vp-msgs-open .vp-comments-sheet { visibility: hidden !important; }
        html.vp-msgs-open .vp-nav-link.vp-site-cur { color: var(--vp-off-c) !important; opacity: var(--vp-off-o) !important; background-color: var(--vp-off-b) !important; }
        html.vp-msgs-open .vp-nav-link[href="#"] { color: var(--vp-on-c) !important; opacity: var(--vp-on-o) !important; background-color: var(--vp-on-b) !important; }
        .vp-msgs.vp-card { border-radius: 36px; border: 1px solid var(--border-color, rgba(255, 255, 255, .15));
            box-shadow: 0 16px 48px rgba(0, 0, 0, .45); }
        html.vp-light .vp-msgs.vp-card { box-shadow: 0 16px 48px rgba(0, 0, 0, .12); }
        .vp-msgs-under { position: fixed; top: 0; bottom: 0; z-index: 4; display: none; background: var(--bg-primary, #000); pointer-events: none; }
        html.vp-msgs-open .vp-msgs-under.vp-on { display: block; }
        .vp-msgs-view { display: flex; flex-direction: column; min-height: 0; flex: 1; }
        .vp-msgs-view[hidden] { display: none; }
        .vp-msgs-call[hidden], .vp-msgs-more[hidden] { display: none; }
        .vp-msgs-chead { position: relative; }
        .vp-msgs-hmenu { position: absolute; top: calc(100% - 4px); right: 12px; z-index: 5; min-width: 190px; padding: 6px; border-radius: 14px;
            background: #202024; box-shadow: 0 12px 34px rgba(0, 0, 0, .45), inset 0 0 0 1px rgba(128, 128, 128, .2); }
        .vp-msgs-hmenu[hidden] { display: none; }
        html.vp-light .vp-msgs-hmenu { background: #fff; }
        .vp-msgs-hmenu button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border: 0; border-radius: 10px; background: none;
            color: var(--text-primary, #fff); font: inherit; font-size: 14px; cursor: pointer; text-align: left; }
        .vp-msgs-hmenu button:hover { background: rgba(128, 128, 128, .16); }
        .vp-msgs-hmenu button.vp-danger { color: #f23f43; }
        .vp-msgs-blocked { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .vp-msgs-blocked button { padding: 6px 14px; border: 0; border-radius: 999px; background: rgba(128, 128, 128, .2); color: var(--text-primary, #fff);
            font: inherit; font-size: 13px; cursor: pointer; }
        .vp-msgs-blocked button:hover { background: rgba(128, 128, 128, .3); }
        .vp-msgs-callrow { align-self: center; display: flex; align-items: center; gap: 7px; width: fit-content; margin: 8px auto; padding: 6px 12px; border-radius: 14px;
            background: rgba(128, 128, 128, .14); color: var(--text-secondary, #b5bac1); font-size: 13px; cursor: pointer; }
        .vp-msgs-callrow:hover { background: rgba(128, 128, 128, .22); }
        .vp-msgs-callrow.vp-miss { color: #f23f43; }
        .vp-msgs-callrow time { opacity: .65; font-size: 12px; }
        .vp-msgs-top { display: flex; align-items: center; gap: 10px; padding: 18px 16px 10px; }
        .vp-msgs-title { font-size: 24px; font-weight: 700; margin-right: auto; }
        .vp-msgs-ib { width: 40px; height: 40px; border-radius: 50%; border: 0; padding: 0; display: flex; align-items: center; justify-content: center;
            cursor: pointer; background: var(--block-bg); color: var(--text-primary, #fff); flex-shrink: 0; }
        .vp-msgs-ib:active { transform: scale(.94); }
        .vp-msgs-search { margin: 0 16px 10px; display: flex; align-items: center; gap: 8px; padding: 0 14px; height: 42px; border-radius: 999px;
            background: var(--block-bg); color: var(--text-secondary); }
        .vp-msgs-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--text-primary, #fff); font: inherit; font-size: 15px; }
        .vp-msgs-sub { padding: 2px 20px 8px; font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .vp-msgs-ava img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .vp-msgs-who, .vp-msgs-chead .vp-msgs-ava { cursor: pointer; }
        .vp-msgs-list { flex: 1; overflow-y: auto; padding: 0 8px 12px; overscroll-behavior: contain; }
        .vp-msgs-row { display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: 18px; cursor: pointer; }
        .vp-msgs-row:hover, .vp-msgs-row:active { background: var(--block-bg); }
        .vp-msgs-ava { position: relative; width: 50px; height: 50px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
            font-size: 26px; background: var(--block-bg); }
        .vp-msgs-ava.vp-sm { width: 38px; height: 38px; font-size: 20px; }
        .vp-msgs-ava.vp-online::after { content: ""; position: absolute; right: 1px; bottom: 1px; width: 11px; height: 11px; border-radius: 50%;
            background: #22c55e; box-shadow: 0 0 0 2.5px var(--bg-primary, #000); }
        .vp-msgs-mid { flex: 1; min-width: 0; }
        .vp-msgs-name { display: flex; align-items: center; gap: 5px; font-weight: 600; font-size: 15px; }
        .vp-msgs-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-msgs-last { margin-top: 3px; font-size: 14px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-msgs-side { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; font-size: 12px; color: var(--text-secondary); }
        .vp-msgs-badge { min-width: 20px; height: 20px; padding: 0 6px; box-sizing: border-box; border-radius: 999px; display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: 700; background: var(--vp-accent); color: var(--vp-on-accent, #fff); }
        .vp-msgs-pin { display: flex; color: var(--text-secondary); }
        .vp-msgs-row.vp-pinned { background: color-mix(in srgb, var(--text-primary, #fff) 4%, transparent); }
        .vp-msgs-row.vp-pinned + .vp-msgs-row:not(.vp-pinned) { margin-top: 6px; }
        .vp-msgs-row { -webkit-touch-callout: none; user-select: none; transition: transform .15s; }
        .vp-msgs-row.vp-held { transform: scale(.97); }
        .vp-msgs-ctx { position: absolute; z-index: 3; display: none; padding: 5px; border-radius: 16px; min-width: 170px;
            background: var(--block-bg); border: 1px solid var(--border-color, rgba(255, 255, 255, .1)); box-shadow: 0 10px 30px rgba(0, 0, 0, .45); }
        .vp-msgs-ctx.vp-open { display: block; animation: vpMsgsCtx .14s ease-out; }
        @keyframes vpMsgsCtx { from { opacity: 0; transform: scale(.94); } }
        .vp-msgs-ctx button { display: flex; align-items: center; gap: 10px; width: 100%; border: 0; background: none; color: var(--text-primary, #fff);
            font: inherit; font-size: 15px; padding: 10px 12px; border-radius: 12px; cursor: pointer; }
        .vp-msgs-ctx button:hover, .vp-msgs-ctx button:active { background: var(--bg-hover, rgba(255, 255, 255, .08)); }
        .vp-msgs-ctx svg { width: 16px; height: 16px; }
        .vp-msgs-empty { padding: 40px 16px; text-align: center; color: var(--text-secondary); font-size: 14px; }
        .vp-msgs-chead { display: flex; align-items: center; gap: 10px; padding: 12px 12px 10px;
            border-bottom: 1px solid color-mix(in srgb, var(--text-primary, #fff) 8%, transparent); }
        .vp-msgs-who { display: flex; flex-direction: column; min-width: 0; margin-right: auto; }
        .vp-msgs-who b { font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-msgs-who small { font-size: 12px; color: var(--text-secondary); }
        .vp-msgs-chat { position: relative; }
        .vp-msgs-down { position: absolute; right: 14px; bottom: 78px; z-index: 3; width: 42px; height: 42px; padding: 0; border: 0; border-radius: 50%; cursor: pointer;
            display: grid; place-items: center; color: var(--text-primary, #fff); background: var(--block-bg, #1f1f23);
            box-shadow: 0 6px 18px rgba(0, 0, 0, .35), inset 0 0 0 1px rgba(127, 127, 127, .25); transition: opacity .18s, transform .18s; }
        .vp-msgs-down[hidden] { display: grid !important; opacity: 0; transform: translateY(10px) scale(.9); pointer-events: none; }
        .vp-msgs-down span { position: absolute; top: -6px; right: -4px; min-width: 18px; height: 18px; padding: 0 5px; box-sizing: border-box; border-radius: 9px;
            font: 600 11px/18px system-ui, sans-serif; text-align: center; color: var(--vp-on-accent, #fff); background: var(--vp-accent, #3b82f6); }
        .vp-msgs-down span:empty { display: none; }
        .vp-msgs-feed { flex: 1; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; overscroll-behavior: contain; }
        .vp-msgs-note { align-self: center; margin: 2px 0 8px; padding: 6px 12px; border-radius: 999px; font-size: 12px;
            background: var(--block-bg); color: var(--text-secondary); text-align: center; }
        .vp-msgs-b { max-width: 78%; padding: 9px 13px 7px; border-radius: 20px; font-size: 15px; line-height: 1.35; overflow-wrap: anywhere;
            animation: vpMsgsPop .2s ease-out; }
        .vp-msgs-b.vp-in { align-self: flex-start; background: var(--block-bg); border-bottom-left-radius: 6px; }
        .vp-msgs-b.vp-out { align-self: flex-end; background: color-mix(in srgb, var(--vp-accent) 26%, var(--block-bg)); color: var(--text-primary, #fff);
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 45%, transparent); border-bottom-right-radius: 6px; }
        .vp-msgs-b a.vp-msgs-link { color: inherit; font-weight: inherit; text-decoration: underline !important; text-decoration-thickness: 1px !important; text-underline-offset: 3px; word-break: break-all; }
        .vp-msgs-b a.vp-msgs-link:hover { text-decoration-thickness: 2px !important; }
        .vp-msgs-b i { display: block; margin-top: 2px; font-style: normal; font-size: 11px; opacity: .6; text-align: right; white-space: nowrap; }
        .vp-msgs-b i[data-tick]::after { content: ""; display: inline-block; width: 16px; height: 11px; margin-left: 3px; vertical-align: -1px; background: currentColor;
            -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 11' fill='none' stroke='%23000' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 6 5.6 9.1 12.5 2.2'/%3E%3C/svg%3E") center / contain no-repeat;
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 11' fill='none' stroke='%23000' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 6 5.6 9.1 12.5 2.2'/%3E%3C/svg%3E") center / contain no-repeat; }
        .vp-msgs-b i[data-tick="2"]::after {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 11' fill='none' stroke='%23000' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M.8 6 3.9 9.1 10.8 2.2M7.4 8.1l1 1 6.9-6.9'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 11' fill='none' stroke='%23000' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M.8 6 3.9 9.1 10.8 2.2M7.4 8.1l1 1 6.9-6.9'/%3E%3C/svg%3E"); }
        .vp-msgs-b.vp-fail i { opacity: .85; }
        .vp-msgs-typing { display: flex; gap: 5px; padding: 14px 16px; }
        .vp-msgs-typing span { width: 7px; height: 7px; border-radius: 50%; background: var(--text-secondary); animation: vpMsgsDot 1s infinite; }
        .vp-msgs-typing span:nth-child(2) { animation-delay: .15s; } .vp-msgs-typing span:nth-child(3) { animation-delay: .3s; }
        .vp-msgs-bar { display: flex; align-items: flex-end; gap: 8px; padding: 10px 12px 12px; }
        .vp-msgs-field { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; padding: 0 6px 0 14px; min-height: 44px; border-radius: 22px;
            background: var(--block-bg); }
        .vp-msgs-field input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--text-primary, #fff); font: inherit; font-size: 15px; }
        .vp-msgs-b.vp-has-img { width: min-content; max-width: 78%; padding: 4px 4px 6px; }
        .vp-msgs-imgw { position: relative; display: block; margin: 0 0 6px; cursor: zoom-in; }
        .vp-msgs-imgw::after, .vp-msgs-lb-body::after { content: ''; position: absolute; inset: 0; }
        .vp-msgs-img { display: block; width: auto; height: auto; max-width: min(330px, 66vw); max-height: 420px; min-width: 120px; min-height: 60px;
            border-radius: 16px; background: rgba(127, 127, 127, .15); pointer-events: none; user-select: none; }
        .vp-msgs-lb { position: absolute; inset: 0; z-index: 30; display: flex; flex-direction: column; background: rgba(0, 0, 0, .92); border-radius: inherit;
            animation: vp-emoji-in .15s ease-out both; }
        .vp-msgs-lb-top { display: flex; align-items: center; gap: 8px; padding: 10px; flex-shrink: 0; }
        .vp-msgs-lb-top .vp-msgs-ib { color: #fff; background: rgba(255, 255, 255, .1); }
        .vp-msgs-lb-top span { color: rgba(255, 255, 255, .8); font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-msgs-lb-body { position: relative; flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 10px 14px; }
        .vp-msgs-lb-body img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 10px; pointer-events: none; user-select: none; }
        .vp-msgs-lb-top a { margin-left: auto; flex-shrink: 0; padding: 7px 12px; border-radius: 9999px; background: rgba(255, 255, 255, .1); color: #fff; font-size: 13px; text-decoration: none; }
        .vp-msgs-pend { display: flex; align-items: center; gap: 10px; padding: 6px 8px; margin: 0 0 6px; border-radius: 16px; background: var(--block-bg); }
        .vp-msgs-pend[hidden] { display: none; }
        .vp-msgs-pend-list { display: flex; gap: 8px; overflow-x: auto; flex: 0 1 auto; max-width: 62%; padding: 4px 4px 2px; scrollbar-width: thin; }
        .vp-msgs-pend .vp-msgs-pend-t { position: relative; flex-shrink: 0; }
        .vp-msgs-pend .vp-msgs-pend-t button { position: absolute; top: -5px; right: -5px; width: 20px; height: 20px; font-size: 10px; line-height: 20px; padding: 0;
            background: rgba(0, 0, 0, .7); color: #fff; }
        .vp-msgs-album { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; width: min(330px, 66vw); margin: 0 0 6px; border-radius: 16px; overflow: hidden; }
        .vp-msgs-album[data-n="2"], .vp-msgs-album[data-n="3"], .vp-msgs-album[data-n="4"] { grid-template-columns: repeat(2, 1fr); }
        .vp-msgs-album .vp-msgs-imgw { margin: 0; aspect-ratio: 1; }
        .vp-msgs-album .vp-wide2 { grid-column: span 2; aspect-ratio: 2 / 1; }
        .vp-msgs-album .vp-wide3 { grid-column: span 3; aspect-ratio: 3 / 1; }
        .vp-msgs-album[data-n] { grid-template-columns: repeat(6, 1fr); }
        .vp-msgs-album[data-n="2"], .vp-msgs-album[data-n="3"], .vp-msgs-album[data-n="4"] { grid-template-columns: repeat(2, 1fr); }
        .vp-msgs-album:not([data-n="2"]):not([data-n="3"]):not([data-n="4"]) > .vp-msgs-imgw { grid-column: span 2; }
        .vp-msgs-album:not([data-n="2"]):not([data-n="3"]):not([data-n="4"]) > .vp-half { grid-column: span 3; aspect-ratio: 3 / 2; }
        .vp-msgs-album:not([data-n="2"]):not([data-n="3"]):not([data-n="4"]) > .vp-wide3 { grid-column: span 6; }
        .vp-msgs-album .vp-msgs-img { width: 100%; height: 100%; max-width: none; max-height: none; min-width: 0; min-height: 0; object-fit: cover; border-radius: 0; }
        @media (hover: none) { .vp-msgs-feed .vp-msgs-b { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; } }
        .vp-msgs-reacts { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0 0; }
        .vp-msgs-reacts button { border: 0; border-radius: 9999px; padding: 2px 9px; font-size: 13px; line-height: 20px; cursor: pointer; color: inherit;
            background: rgba(127, 127, 127, .22); }
        .vp-msgs-reacts button.vp-mine-r { background: color-mix(in srgb, var(--vp-accent) 24%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 70%, transparent); }
        .vp-msgs-menu { position: fixed; z-index: 2147483600; min-width: 210px; padding: 6px; border-radius: 16px; background: var(--block-bg);
            color: var(--text-primary, #fff); box-shadow: 0 12px 40px rgba(0, 0, 0, .45), 0 0 0 1px var(--border-color, rgba(255, 255, 255, .08)); animation: vp-emoji-in .12s ease-out both; }
        .vp-msgs-menu-r { display: flex; gap: 2px; padding: 2px 2px 6px; margin-bottom: 4px; border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, .08)); }
        .vp-msgs-menu-r button { width: 36px; height: 36px; border: 0; padding: 0; border-radius: 50%; background: transparent; font-size: 21px; cursor: pointer; transition: transform .1s; }
        .vp-msgs-menu-r button:hover { transform: scale(1.2); background: rgba(127, 127, 127, .15); }
        .vp-msgs-menu-i { display: block; width: 100%; text-align: left; border: 0; background: transparent; color: inherit; font: inherit; font-size: 14px; padding: 9px 12px; border-radius: 10px; cursor: pointer; }
        .vp-msgs-menu-i:hover { background: rgba(127, 127, 127, .15); }
        .vp-msgs-lb-n { color: rgba(255, 255, 255, .8); font-size: 13px; font-weight: 600; margin-left: auto; flex-shrink: 0; }
        .vp-msgs-lb-n:empty { display: none; }
        .vp-msgs-lb-n:not(:empty) + a { margin-left: 8px; }
        .vp-msgs-lb-nav { position: absolute; top: 50%; z-index: 1; width: 44px; height: 44px; margin-top: -22px; border: 0; border-radius: 50%; cursor: pointer;
            background: rgba(255, 255, 255, .14); color: #fff; font-size: 26px; line-height: 40px; padding: 0; }
        .vp-msgs-lb-nav[hidden] { display: none; }
        .vp-msgs-lb-nav.vp-prev { left: 12px; } .vp-msgs-lb-nav.vp-next { right: 12px; }
        .vp-msgs-pend img { width: 52px; height: 52px; object-fit: cover; border-radius: 10px; flex-shrink: 0; }
        .vp-msgs-pend span { flex: 1; min-width: 0; font-size: 13px; color: var(--text-secondary); }
        .vp-msgs-pend button { width: 30px; height: 30px; border: 0; border-radius: 50%; background: rgba(127, 127, 127, .2); color: var(--text-primary, #fff); cursor: pointer; flex-shrink: 0; }
        .vp-msgs-b.vp-has-img { overflow-wrap: anywhere; }
        .vp-msgs-b.vp-has-img > i { margin-right: 6px; }
        .vp-msgs-cap { display: block; padding: 0 8px; }
        .vp-msgs-count { font-size: 12px; color: var(--text-secondary); white-space: nowrap; font-variant-numeric: tabular-nums; flex-shrink: 0; }
        .vp-msgs-count.vp-warn { color: #ff5c5c; }
        .vp-msgs-ghost { width: 36px; height: 36px; border: 0; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            background: transparent; color: var(--text-secondary); cursor: pointer; flex-shrink: 0; }
        .vp-msgs-send { width: 44px; height: 44px; border: 0; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;
            flex-shrink: 0; background: var(--vp-accent); color: var(--vp-on-accent, #fff); transition: opacity .15s, transform .15s; }
        .vp-msgs-send:disabled { opacity: .4; cursor: default; }
        .vp-msgs-send:not(:disabled):active { transform: scale(.92); }
        @keyframes vpMsgsIn { from { opacity: 0; transform: translateY(10px); } }
        @keyframes vpMsgsPop { from { opacity: 0; transform: translateY(6px) scale(.98); } }
        @keyframes vpMsgsDot { 0%, 60%, 100% { opacity: .35; transform: none; } 30% { opacity: 1; transform: translateY(-3px); } }
        @media (prefers-reduced-motion: reduce) { .vp-msgs, .vp-msgs * { animation: none !important; } }
        html.vp-msgs-open video { visibility: hidden !important; }`);

            const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
            const root = document.createElement('div');
            root.className = 'vp-msgs';
            const blockOuterScroll = e => {
                const area = e.target.closest && e.target.closest('.vp-msgs-list, .vp-msgs-feed, textarea');
                if (!area || area.scrollHeight <= area.clientHeight) e.preventDefault();
            };
            root.addEventListener('wheel', blockOuterScroll, { passive: false });
            root.addEventListener('touchmove', blockOuterScroll, { passive: false });
            root.setAttribute('role', 'region');
            root.setAttribute('aria-label', 'Сообщения');
            root.innerHTML = `
            <section class="vp-msgs-view vp-msgs-home">
                <div class="vp-msgs-top"><div class="vp-msgs-title">Сообщения <span class="vp-msgs-beta" title="Сообщения в бета-версии: возможны сбои — пиши в «Поддержку»">Beta</span></div>
                    <button class="vp-msgs-ib vp-msgs-new" title="Новый чат (пока не работает)">${MSG_ICON.edit}</button></div>
                <label class="vp-msgs-search">${MSG_ICON.search}<input type="search" placeholder="Поиск"></label>
                <div class="vp-msgs-sub"></div>
                <div class="vp-msgs-list"></div>
            </section>
            <section class="vp-msgs-view vp-msgs-chat" hidden>
                <div class="vp-msgs-chead"><button class="vp-msgs-ib vp-msgs-back" title="Назад">${MSG_ICON.back}</button>
                    <div class="vp-msgs-ava vp-sm"></div><div class="vp-msgs-who"><b></b><small></small></div>
                    <button class="vp-msgs-ib vp-msgs-call" title="Позвонить">${MSG_ICON.call}</button><button class="vp-msgs-ib vp-msgs-more" title="Ещё">${MSG_ICON.more}</button>
                    <div class="vp-msgs-hmenu" hidden></div></div>
                <div class="vp-msgs-feed" aria-live="polite"></div>
                <button type="button" class="vp-msgs-down" title="Вниз" hidden>${svgIcon('<path d="m6 9 6 6 6-6"/>', 22)}<span></span></button>
                <form class="vp-msgs-bar"><div class="vp-msgs-field"><button type="button" class="vp-msgs-ghost vp-msgs-attach" title="Картинка">${MSG_ICON.clip}</button>
                    <input type="text" placeholder="Сообщение" enterkeyhint="send" autocomplete="off"><span class="vp-msgs-count" hidden></span>
                    <button type="button" class="vp-msgs-ghost vp-msgs-emoji" title="Эмодзи">${MSG_ICON.smile}</button></div>
                    <button type="submit" class="vp-msgs-send" title="Отправить" disabled>${MSG_ICON.send}</button><input type="file" class="vp-msgs-file" accept="image/png,image/jpeg,image/webp,image/gif" hidden></form>
            </section>`;
            document.body.appendChild(root);
            const under = document.createElement('div');
            under.className = 'vp-msgs-under';
            document.body.appendChild(under);

            const $ = s => root.querySelector(s);
            const downBtn = root.querySelector('.vp-msgs-down'), downNum = downBtn.lastElementChild;
            let downNew = 0;
            const feedEl = root.querySelector('.vp-msgs-feed');
            const downSync = () => {
                const far = feedEl.scrollHeight - feedEl.scrollTop - feedEl.clientHeight > 320;
                if (!far) downNew = 0;
                downBtn.hidden = !far;
                downNum.textContent = downNew ? (downNew > 99 ? '99+' : String(downNew)) : '';
            };
            feedEl.addEventListener('scroll', downSync, { passive: true });
            downBtn.addEventListener('click', () => { downNew = 0; feedEl.scrollTo({ top: feedEl.scrollHeight, behavior: 'smooth' }); });
            const list = $('.vp-msgs-list'), home = $('.vp-msgs-home'), chat = $('.vp-msgs-chat'), feed = $('.vp-msgs-feed');
            const input = $('.vp-msgs-bar input'), send = $('.vp-msgs-send'), search = $('.vp-msgs-search input');
            const countEl = $('.vp-msgs-count');
            const msgCount = () => {
                const n = input.value.length, max = input.maxLength > 0 ? input.maxLength : MSG_TEXT_MAX;
                countEl.hidden = !n;
                countEl.textContent = `${n} / ${max}`;
                countEl.classList.toggle('vp-warn', n >= max * 0.9);
            };
            let current = null, botTimer = 0, lastJoke = -1;
            const isUrl = a => /^https?:|^\//.test(a);
            const avaHtml = a => isUrl(a) ? `<img src="${esc(a)}" alt="">` : esc(a);

            let supDir = false;
            function renderList() {
                const q = search.value.trim().toLowerCase();
                const pins = msgPins();
                let rows = sortDialogs(MSG_DIALOGS).filter(d => !q || (d.name + ' ' + d.login + ' ' + d.last).toLowerCase().includes(q));
                const people = MSG_DIALOGS.filter(d => d.login).length;
                const sups = msgIsSupport() ? sortDialogs(MSG_DIALOGS.filter(d => d.supUid)) : [];
                if (sups.length && !q) {
                    if (supDir) rows = [{ id: '@back', ava: '←', name: 'Все чаты', last: `Обращения в поддержку: ${sups.length}`, time: '', unread: 0 }, ...sups.map(d => Object.assign({}, d, { name: d.name.replace(/^🛟\s*/, '') }))];
                    else {
                        const top = sups.reduce((a, d) => (d.lastTs || 0) > (a.lastTs || 0) ? d : a, sups[0]);
                        const opened = msgOpened(), act = d => Math.max(d.lastTs || 0, opened[d.id] || 0), fAct = Math.max(...sups.map(act));
                        const folder = { id: '@sup', ava: '🛟', name: 'Поддержка', last: top.last ? top.name.replace(/^🛟\s*/, '') + ': ' + top.last : `обращений: ${sups.length}`,
                            time: top.time || '', lastTs: top.lastTs || 0, unread: sups.reduce((n, d) => n + (d.unread || 0), 0) };
                        rows = rows.filter(d => !d.supUid);
                        const at = rows.findIndex(d => !pins.includes(d.id) && act(d) < fAct);
                        rows.splice(at < 0 ? rows.length : at, 0, folder);
                    }
                }
                if (!sups.length) supDir = false;
                $('.vp-msgs-sub').textContent = supDir && sups.length && !q ? 'Все, кто писал в поддержку' : people ? `Сервер ИТД, поддержка и ${people} ${plural(people, 'человек', 'человека', 'человек')} с ИТД X` : 'Пока никого с ИТД X — список обновится сам';
                list.innerHTML = rows.length ? rows.map(d => `
                <div class="vp-msgs-row${pins.includes(d.id) ? ' vp-pinned' : ''}" data-id="${d.id}">
                    <div class="vp-msgs-ava${d.online ? ' vp-online' : ''}">${avaHtml(d.ava)}</div>
                    <div class="vp-msgs-mid"><div class="vp-msgs-name"><span>${esc(d.name)}</span></div>
                        <div class="vp-msgs-last">${esc(d.last)}</div></div>
                    <div class="vp-msgs-side"><span>${esc(d.time)}</span>${d.unread ? `<span class="vp-msgs-badge">${d.unread}</span>`
                        : pins.includes(d.id) ? `<span class="vp-msgs-pin" title="Закреплён">${MSG_ICON.pin}</span>` : ''}</div>
                </div>`).join('') : '<div class="vp-msgs-empty">Ничего не нашлось</div>';
            }
            const now = () => new Date().toTimeString().slice(0, 5);
            function setMeta(i, str) {
                const m = String(str).match(/^(.*?)\s*(✓✓|✓)$/), txt = m ? m[1] : String(str);
                if (i.textContent !== txt) i.textContent = txt;
                if (m) { if (i.dataset.tick !== String(m[2].length)) i.dataset.tick = m[2].length; } else if (i.hasAttribute('data-tick')) i.removeAttribute('data-tick');
            }
            const MSG_LINK_RE = /(?:https?:\/\/|(?<![\w.\/@-])(?:xn--d1ah4a\.com|итд\.com)\/)[^\s<>"'«»]+/gi;
            function msgText(el, text) {
                const str = String(text || '');
                let at = 0, box = null;
                for (const m of str.matchAll(MSG_LINK_RE)) {
                    const raw = m[0].replace(/[.,!?:;)\]]+$/, ''), end = m.index + raw.length;
                    let u;
                    try { u = new URL(/^https?:/i.test(raw) ? raw : 'https://' + raw); } catch (e) { continue; }
                    if (!/^https?:$/.test(u.protocol)) continue;
                    if (!box) { box = document.createElement('span'); box.className = 'vp-msgs-t'; }
                    if (m.index > at) box.append(str.slice(at, m.index));
                    const a = document.createElement('a'), own = u.hostname === location.hostname || u.hostname === 'xn--d1ah4a.com';
                    a.href = u.href;
                    a.textContent = raw.replace(/^(https?:\/\/)?xn--d1ah4a\.com/i, 'итд.com');
                    a.className = 'vp-msgs-link';
                    if (own) a.addEventListener('click', e => {
                        if (e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                        e.preventDefault();
                        e.stopPropagation();
                        close(true);
                        history.pushState({}, '', u.pathname + u.search + u.hash);
                        dispatchEvent(new PopStateEvent('popstate'));
                    });
                    else { a.target = '_blank'; a.rel = 'noopener noreferrer nofollow'; a.addEventListener('click', e => e.stopPropagation()); }
                    box.appendChild(a);
                    at = end;
                }
                if (!box) { el.append(str); return; }
                if (at < str.length) box.append(str.slice(at));
                el.appendChild(box);
            }
            function bubble(dir, text, meta, imgUrl) {
                const urls = !imgUrl ? [] : Array.isArray(imgUrl) ? imgUrl : [imgUrl];
                const b = document.createElement('div');
                b.className = 'vp-msgs-b vp-' + dir + (urls.length ? ' vp-has-img' : '');
                if (!urls.length) msgText(b, text);
                if (urls.length) {
                    const cell = (u, i) => {
                        const wrap = document.createElement('span');
                        wrap.className = 'vp-msgs-imgw';
                        const im = document.createElement('img');
                        im.className = 'vp-msgs-img';
                        im.src = u; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.draggable = false;
                        im.addEventListener('load', () => { if (feed.scrollHeight - feed.scrollTop - feed.clientHeight < 400) feed.scrollTop = feed.scrollHeight; }, { once: true });
                        wrap.appendChild(im);
                        wrap.addEventListener('click', () => openImg(urls, i, text));
                        return wrap;
                    };
                    let box;
                    if (urls.length === 1) box = cell(urls[0], 0);
                    else {
                        box = document.createElement('div');
                        box.className = 'vp-msgs-album';
                        box.dataset.n = urls.length;
                        urls.forEach((u, i) => box.appendChild(cell(u, i)));
                        const n = urls.length, cols = n === 2 || n === 4 || n === 3 ? 2 : 3;
                        if (n === 3) box.firstChild.classList.add('vp-wide2');
                        else if (cols === 3 && n % 3 === 1) box.lastChild.classList.add('vp-wide3');
                        else if (cols === 3 && n % 3 === 2) { box.lastChild.classList.add('vp-half'); box.lastChild.previousSibling.classList.add('vp-half'); }
                    }
                    b.prepend(box);
                    if (text) { const cap = document.createElement('span'); cap.className = 'vp-msgs-cap'; msgText(cap, text); box.after(cap); }
                }
                const i = document.createElement('i');
                setMeta(i, meta || now());
                b.appendChild(i);
                feed.appendChild(b);
                feed.scrollTop = feed.scrollHeight;
                return b;
            }
            let chatBackPending = false;
            function openChat(d, fromHistory) {
                if (fromHistory !== true && !chatBackPending && root.classList.contains('vp-open')) {
                    const st = Object.assign({}, history.state, { vpChat: d.id });
                    history[overlayAt('vpChat') ? 'replaceState' : 'pushState'](st, '', location.href);
                }
                if (current !== d) clearPending();
                blockUi(null);
                $('.vp-msgs-hmenu').hidden = true;
                $('.vp-msgs-more').hidden = !d.login || !!d.support || !!d.supUid || !!d.bot;
                current = d;
                downNew = 0;
                d.unread = 0;
                msgMarkOpened(d.id);
                $('.vp-msgs-chead .vp-msgs-ava').innerHTML = avaHtml(d.ava);
                $('.vp-msgs-chead .vp-msgs-ava').classList.toggle('vp-online', !!d.online);
                $('.vp-msgs-who b').textContent = d.name;
                const seenAgo = t => {
                    const d0 = new Date(t); if (isNaN(d0)) return ''; const h = d0.toTimeString().slice(0, 5);
                    return d0.toDateString() === new Date().toDateString() ? 'в ' + h : `${d0.getDate()}.${String(d0.getMonth() + 1).padStart(2, '0')} в ${h}`;
                };
                $('.vp-msgs-who small').textContent = d.bot ? 'бот · всегда в сети' : d.support ? 'поддержка · на связи' : d.supUid ? 'обращение в поддержку'
                    : '@' + d.login + ' · ' + (d.online ? 'в сети' : d.lastSeen && seenAgo(d.lastSeen) ? 'был(а) в сети ' + seenAgo(d.lastSeen) : 'с ИТД X');
                $('.vp-msgs-call').hidden = !d.login || !!d.support || !!d.supUid || !!d.bot;
                if (d.login || d.support || d.supUid) { home.hidden = true; chat.hidden = false; input.value = ''; send.disabled = true; msgCount(); msgOpenPerson(d); return; }
                feed.innerHTML = '<div class="vp-msgs-note">🤖 Бот-шутник: сообщения ему никуда не уходят и не сохраняются</div>'
                    + (d.msgs.length ? '<div class="vp-msgs-note">Сегодня</div>' : `<div class="vp-msgs-note">Это начало переписки с ${esc(d.name)}</div>`);
                d.msgs.forEach(([dir, text]) => bubble(dir, text, dir === 'out' ? now() + ' ✓✓' : now()));
                home.hidden = true; chat.hidden = false;
                input.value = ''; send.disabled = true; msgCount();
            }
            const note = t => { const n = document.createElement('div'); n.className = 'vp-msgs-note'; n.textContent = t; feed.appendChild(n); return n; };
            let renderN = 0;
            async function msgOpenPerson(d) {
                const my = ++renderN;
                feed.textContent = ''; input.disabled = true; input.maxLength = MSG_TEXT_MAX;
                const wait = note('🔒 Загрузка переписки…');
                try { await msgSync(); } catch (e) { if (my === renderN) wait.textContent = 'Не загрузилось — открой чат ещё раз'; logErr('сообщения', e); return; }
                if (current !== d || my !== renderN) return;
                if (d.login && !d.support && !isApprovedId(msgMyId())) {
                    feed.textContent = '';
                    note('🔒 Переписка с людьми откроется, когда разработчик подтвердит твою галочку ИТД X. Поддержка работает уже сейчас.');
                    return;
                }
                if (!msgNet.me) return msgKeyForm(d);
                feed.textContent = '';
                note('🔒 Сквозное шифрование: переписку можете прочитать только вы двое');
                const t = msgTarget(d);
                if (!t.uid) { note(t.missing); return; }
                const list = msgThread(t);
                if (!list.length) note(d.support ? 'Опиши проблему или идею — ответ придёт сюда' : `Это начало переписки с ${d.name}`).classList.add('vp-msgs-first');
                list.forEach(m => {
                    const b = bubble(m.dir, m.text, msgMetaText(t, m), (m.imgs || (m.img ? [m.img] : [])).map(msgImgUrl));
                    b._m = m; b.dataset.ts = m.ts; b.dataset.dir = m.dir;
                    paintReacts(b, t.uid);
                });
                paintCalls(t);
                d.shown = list.length; d.sig = chatSig(t.uid);
                input.disabled = false; input.focus();
                msgReadNow(d, t, list);
                blockUi(d, t);
            }
            const msgMetaText = (t, m) => msgTime(m.at || m.ts) + (m.dir === 'out' ? (readUpTo(t.uid, t.sup, 'them') >= m.ts ? ' ✓✓' : ' ✓') : '');
            function msgRefreshChat(d) {
                const t = msgTarget(d);
                if (input.dataset.vpBlocked && t.uid) blockUi(d, t);
                if (!t.uid || !msgNet.me || input.disabled) return;
                blockUi(d, t);
                if (input.disabled) return;
                const list = msgThread(t), have = new Map();
                feed.querySelectorAll(':scope > .vp-msgs-b[data-ts]').forEach(b => { const k = b.dataset.dir + '|' + b.dataset.ts; if (!have.has(k)) have.set(k, []); have.get(k).push(b); });
                const nearEnd = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 80, keep = feed.scrollTop;
                let prev = null, added = 0;
                for (const m of list) {
                    let b = (have.get(m.dir + '|' + m.ts) || []).shift();
                    if (b) setMeta(b.lastChild, msgMetaText(t, m));
                    else {
                        b = bubble(m.dir, m.text, msgMetaText(t, m), (m.imgs || (m.img ? [m.img] : [])).map(msgImgUrl));
                        b.dataset.ts = m.ts; b.dataset.dir = m.dir; added++;
                    }
                    b._m = m;
                    const sig = JSON.stringify(msgNet.reacts && msgNet.reacts.get(reactKey(t.uid, m.dir, m.ts)) || null);
                    if (b._rs !== sig) { b._rs = sig; paintReacts(b, t.uid); }
                    const want = prev ? prev.nextElementSibling : feed.querySelector(':scope > .vp-msgs-b');
                    if (want !== b) { if (prev) prev.after(b); else feed.insertBefore(b, want); }
                    prev = b;
                }
                if (added) feed.querySelectorAll(':scope > .vp-msgs-note.vp-msgs-first').forEach(n => n.remove());
                feed.scrollTop = nearEnd ? feed.scrollHeight : keep;
                if (added && !nearEnd && d.shown) downNew += list.slice(-added).filter(m => m.dir === 'in').length;
                downSync();
                paintCalls(t);
                d.shown = list.length; d.sig = chatSig(t.uid);
                msgReadNow(d, t, list);
            }
            function msgReadNow(d, t, list) {
                if (document.hidden) return;
                msgMarkSeen(t); d.unread = 0; msgBadge();
                const inTs = lastInTs(list);
                if (inTs && inTs > readUpTo(t.uid, t.sup)) {
                    const r = msgNet.reads.get(t.uid) || { me: 0, them: 0 };
                    r.me = Math.max(r.me, inTs); r[t.sup ? 'me1' : 'me0'] = inTs; msgNet.reads.set(t.uid, r);
                    msgSendRead(t.uid, inTs, t.sup).catch(e => logErr('прочитано', e));
                }
            }
            function msgKeyForm(d) {
                const has = !!msgNet.keys.get(msgMyId());
                feed.innerHTML = `<form class="vp-msgs-key"><div class="vp-msgs-note"></div><input type="password" minlength="8" required>`
                    + (has ? '' : '<input type="password" minlength="8" required>') + `<button type="submit"></button><div class="vp-msgs-keyerr"></div></form>`;
                const f = feed.firstChild, [p1, p2] = f.querySelectorAll('input'), err = f.querySelector('.vp-msgs-keyerr'), btn = f.querySelector('button');
                f.firstChild.textContent = has ? '🔒 Введи пароль сообщений — он откроет твой ключ на этом устройстве'
                    : '🔒 Придумай пароль для сообщений: им шифруется твой ключ, с ним переписка откроется на любом устройстве. Лучше несколько слов или 10+ символов — простой пароль можно подобрать. Забудешь — старые сообщения не прочитать';
                p1.placeholder = 'Пароль'; p1.autocomplete = has ? 'current-password' : 'new-password';
                if (p2) { p2.placeholder = 'Ещё раз'; p2.autocomplete = 'new-password'; }
                btn.textContent = has ? 'Открыть' : 'Создать ключ';
                f.addEventListener('submit', async e => {
                    e.preventDefault();
                    if (p2 && p1.value !== p2.value) { err.textContent = 'Пароли не совпадают'; return; }
                    btn.disabled = true; err.textContent = has ? 'Открываю…' : 'Создаю ключ…';
                    try { has ? await msgUnlock(p1.value) : await msgCreateKey(p1.value); msgOpenPerson(d); }
                    catch (x) { err.textContent = x.message || 'Не вышло'; btn.disabled = false; }
                });
                p1.focus();
            }
            const msgPoll = setInterval(async () => {
                if (!root.isConnected) return clearInterval(msgPoll);
                if (!msgsOpen || !msgNet.me || apiPaused()) return;
                if (Date.now() - callNet.lastSync > 12000) { callNet.lastSync = Date.now(); try { await msgSync(); } catch (e) { return; } }
                msgFillDialogs();
                if (!current) return renderList();
                if (current.bot) return;
                const tt = msgTarget(current), list = msgThread(tt);
                if (list.length !== current.shown || chatSig(tt.uid) !== current.sig) msgRefreshChat(current);
            }, 20000);
            root.refreshList = () => { if (!current) { msgFillDialogs(); renderList(); } };
            root.refreshCalls = () => {
                if (!current || current.bot || current.support || current.supUid || !msgNet.me) return;
                const t = msgTarget(current);
                if (!t.uid) return;
                blockUi(current, t);
                if (input.disabled) return;
                const near = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 80;
                const n = feed.querySelectorAll(':scope > .vp-msgs-callrow').length;
                paintCalls(t);
                if (near && feed.querySelectorAll(':scope > .vp-msgs-callrow').length !== n) feed.scrollTop = feed.scrollHeight;
                current.sig = chatSig(t.uid);
            };
            root.openDialog = (id, fromHistory) => {
                msgFillDialogs();
                const d = MSG_DIALOGS.find(x => x.id === id) || (id.startsWith('u:') && msgPeople.get(id.slice(2)));
                if (d) openChat(d, fromHistory);
            };
            root.currentTarget = () => current && !current.bot ? msgTarget(current) : null;
            function closeChat(fromHistory) {
                clearPending();
                closeImg(true);
                closeMenu();
                if (fromHistory !== true && current && overlayAt('vpChat')) { chatBackPending = true; history.back(); }
                clearTimeout(botTimer);
                if (current && msgNet.me) msgSync().then(() => { msgFillDialogs(); msgBadge(); if (!current) renderList(); }).catch(() => { });
                current = null;
                chat.hidden = true; home.hidden = false;
                renderList();
            }
            function botReply() {
                const typing = document.createElement('div');
                typing.className = 'vp-msgs-b vp-in vp-msgs-typing';
                typing.innerHTML = '<span></span><span></span><span></span>';
                feed.appendChild(typing);
                feed.scrollTop = feed.scrollHeight;
                botTimer = setTimeout(() => {
                    typing.remove();
                    const q = (current && current.msgs.length ? current.msgs[current.msgs.length - 1][1] : '').toLowerCase();
                    let e, t;
                    if (/(^|\s)(прив|здаров|здрав|хай|ку|йоу|салам)/.test(q)) [e, t] = BOT_HELLO[Math.random() * BOT_HELLO.length | 0];
                    else if (q.includes('?') && Math.random() < .5) [e, t] = BOT_ASK[Math.random() * BOT_ASK.length | 0];
                    else {
                        let i; do i = Math.floor(Math.random() * MESSAGE_JOKES.length); while (i === lastJoke && MESSAGE_JOKES.length > 1);
                        lastJoke = i;
                        [e, t] = MESSAGE_JOKES[i];
                    }
                    bubble('in', e + ' ' + t);
                }, 700 + Math.random() * 600);
            }

            function supportReply() {
                const typing = document.createElement('div');
                typing.className = 'vp-msgs-b vp-in vp-msgs-typing';
                typing.innerHTML = '<span></span><span></span><span></span>';
                feed.appendChild(typing);
                feed.scrollTop = feed.scrollHeight;
                botTimer = setTimeout(() => {
                    typing.remove();
                    supportTicket = supportTicket || 1000 + (Math.random() * 9000 | 0);
                    bubble('in', `🎫 Приняли, обращение №${supportTicket++}. Ответим, как только личка заработает — а по-настоящему сейчас быстрее в тг @NeuroSFW`);
                }, 900 + Math.random() * 700);
            }

            const ctx = document.createElement('div');
            ctx.className = 'vp-msgs-ctx';
            root.appendChild(ctx);
            const hideCtx = () => ctx.classList.remove('vp-open');
            function showCtx(row, x, y) {
                const id = row.dataset.id, pinned = msgPins().includes(id);
                ctx.innerHTML = `<button type="button">${MSG_ICON.pin}<span>${pinned ? 'Открепить' : 'Закрепить'}</span></button>`;
                ctx.firstChild.onclick = (e) => {
                    e.stopPropagation();
                    const pins = msgPins().filter(p => p !== id);
                    if (!pinned) pins.push(id);
                    GM_setValue(acctKey('msgPins'), pins);
                    hideCtx();
                    renderList();
                };
                const rr = root.getBoundingClientRect();
                ctx.classList.add('vp-open');
                ctx.style.left = Math.max(8, Math.min(x - rr.left, rr.width - ctx.offsetWidth - 8)) + 'px';
                ctx.style.top = Math.max(8, Math.min(y - rr.top, rr.height - ctx.offsetHeight - 8)) + 'px';
                row.classList.add('vp-held');
                setTimeout(() => row.classList.remove('vp-held'), 250);
            }
            let holdT = 0, held = false, holdAt = null;
            list.addEventListener('pointerdown', e => {
                const r = e.target.closest('.vp-msgs-row');
                if (!r || e.button > 0 || r.dataset.id[0] === '@') return;
                held = false; holdAt = [e.clientX, e.clientY];
                clearTimeout(holdT);
                holdT = setTimeout(() => { held = true; if (navigator.vibrate) navigator.vibrate(12); showCtx(r, holdAt[0], holdAt[1]); }, 450);
            });
            list.addEventListener('pointermove', e => { if (holdAt && Math.hypot(e.clientX - holdAt[0], e.clientY - holdAt[1]) > 8) clearTimeout(holdT); });
            ['pointerup', 'pointercancel'].forEach(t => list.addEventListener(t, () => { clearTimeout(holdT); holdAt = null; }));
            list.addEventListener('contextmenu', e => {
                const r = e.target.closest('.vp-msgs-row');
                if (!r || r.dataset.id[0] === '@') return;
                e.preventDefault();
                clearTimeout(holdT);
                if (!held) showCtx(r, e.clientX, e.clientY);
                held = true;
            });
            root.addEventListener('pointerdown', e => { if (!ctx.contains(e.target)) hideCtx(); }, true);
            list.addEventListener('scroll', hideCtx, { passive: true });

            list.addEventListener('click', e => {
                const r = e.target.closest('.vp-msgs-row');
                if (held) { held = false; return; }
                if (r && r.dataset.id[0] === '@') { supDir = r.dataset.id === '@sup'; list.scrollTop = 0; renderList(); return; }
                if (r) openChat(MSG_DIALOGS.find(d => d.id === r.dataset.id));
            });
            root.querySelectorAll('.vp-msgs-who, .vp-msgs-chead .vp-msgs-ava').forEach(el => el.onclick = () => {
                if (!current || !current.login) return;
                const login = current.login;
                close(true);
                openProfile(login);
            });
            function blockUi(d, t) {
                const ok = !!(d && t && t.uid && !t.sup), mine = ok && msgIsBlocked(t.uid), them = ok && !mine && msgBlockedMe(t.uid);
                const kind = mine ? 'mine' : them ? 'them' : '', old = feed.querySelector(':scope > .vp-msgs-blocked');
                if (d) $('.vp-msgs-call').hidden = !!kind || !d.login || !!d.support || !!d.supUid || !!d.bot;
                if (old && old.dataset.kind === kind && old === feed.lastElementChild) return;
                feed.querySelectorAll(':scope > .vp-msgs-blocked').forEach(x => x.remove());
                if (!kind) {
                    if (input.dataset.vpBlocked) { delete input.dataset.vpBlocked; input.placeholder = input.dataset.vpPh || ''; input.disabled = false; }
                    return;
                }
                const n = note(mine ? `🚫 Ты заблокировал(а) ${d.name}: новые сообщения и звонки от этого человека к тебе не приходят`
                    : `🚫 ${d.name} заблокировал(а) тебя: твои сообщения и звонки сюда не доходят`);
                n.classList.add('vp-msgs-blocked');
                n.dataset.kind = kind;
                if (mine) {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.textContent = 'Разблокировать';
                    b.onclick = () => msgBlockToggle(d, t, false);
                    n.appendChild(b);
                }
                if (!input.dataset.vpBlocked) { input.dataset.vpBlocked = '1'; input.dataset.vpPh = input.placeholder; }
                input.placeholder = mine ? 'Сначала разблокируй' : 'Тебя заблокировали';
                input.value = '';
                input.disabled = true;
                send.disabled = true;
                feed.scrollTop = feed.scrollHeight;
            }
            async function msgBlockToggle(d, t, on) {
                msgSetBlock(t.uid, on);
                if (on && callNet.cur && callNet.cur.uid === t.uid) callEnd(callNet.cur, 'Звонок завершён', 0);
                await msgDecryptAll();
                msgFillDialogs();
                msgBadge();
                if (current === d) msgOpenPerson(d);
                try { await msgSend(t.uid, '', false, null, new Uint8Array([5, on ? 1 : 0])); }
                catch (e) { logErr('блокировка', e); }
            }
            const blockMenu = $('.vp-msgs-hmenu');
            $('.vp-msgs-more').onclick = e => {
                e.stopPropagation();
                if (!blockMenu.hidden) { blockMenu.hidden = true; return; }
                if (!current || !current.login || current.support || current.supUid || current.bot) return;
                const t = msgTarget(current), d = current;
                if (!t.uid) return note(t.missing);
                const on = msgIsBlocked(t.uid);
                blockMenu.innerHTML = '<button type="button"></button>';
                const b = blockMenu.firstChild;
                b.innerHTML = svgIcon(on ? '<path d="m5 12.5 4.5 4.5L19 7.5"/>' : '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>', 18) + '<span></span>';
                b.querySelector('span').textContent = on ? 'Разблокировать' : 'Заблокировать';
                b.classList.toggle('vp-danger', !on);
                b.onclick = () => { blockMenu.hidden = true; msgBlockToggle(d, t, !on); };
                blockMenu.hidden = false;
            };
            root.addEventListener('click', e => { if (!blockMenu.hidden && !e.target.closest('.vp-msgs-hmenu, .vp-msgs-more')) blockMenu.hidden = true; });
            $('.vp-msgs-call').onclick = () => {
                if (!current || !current.login || current.support || current.bot) return;
                const t = msgTarget(current);
                if (!msgNet.me || !isApprovedId(msgMyId())) return note('📞 Звонки откроются вместе с перепиской');
                if (!t.uid) return note(t.missing);
                callStart(t.uid, current.name, current.ava);
            };
            search.addEventListener('input', renderList);
            $('.vp-msgs-back').onclick = closeChat;
            input.addEventListener('input', () => { send.disabled = !input.value.trim() && !pendingImg; msgCount(); });
            attachEmojiPicker($('.vp-msgs-emoji'), em => {
                if (input.disabled) return false;
                const max = input.maxLength > 0 ? input.maxLength : MSG_TEXT_MAX;
                if (input.value.length + em.length > max) return false;
                const a = input.selectionStart ?? input.value.length, z = input.selectionEnd ?? a;
                input.setRangeText(em, a, z, 'end');
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            let lb = null;
            const chatSig = uid => {
                let sg = '';
                if (msgNet.reacts) msgNet.reacts.forEach((v, k) => { if (k.startsWith(uid + '|')) sg += k + (v.me ? v.me.emoji : '') + '/' + (v.them ? v.them.emoji : '') + ';'; });
                const r = msgNet.reads && msgNet.reads.get(uid);
                return sg + '|' + (r ? (r.them0 || 0) + '/' + (r.them1 || 0) : 0) + '|' + (msgNet.sigs || []).filter(x => x.uid === uid).length + '|' + (msgIsBlocked(uid) ? 1 : 0) + (msgBlockedMe(uid) ? 1 : 0);
            };
            function paintCalls(t) {
                feed.querySelectorAll(':scope > .vp-msgs-callrow').forEach(x => x.remove());
                if (!t.uid || t.sup) return;
                const bs = [...feed.querySelectorAll(':scope > .vp-msgs-b[data-ts]')];
                for (const e of callHistory(t.uid)) {
                    const { text, miss } = callChip(e), row = document.createElement('div');
                    row.className = 'vp-msgs-callrow' + (miss ? ' vp-miss' : '');
                    row.title = 'Позвонить';
                    row.innerHTML = svgIcon(GLYPH.phone, 15) + '<span></span><time></time>';
                    row.querySelector('span').textContent = text;
                    row.querySelector('time').textContent = msgTime(e.ts);
                    row.onclick = () => { if (current) callStart(t.uid, current.name, current.ava); };
                    const next = bs.find(b => +b.dataset.ts > e.ts);
                    if (next) feed.insertBefore(row, next); else feed.appendChild(row);
                }
                if (feed.querySelector(':scope > .vp-msgs-callrow')) feed.querySelectorAll(':scope > .vp-msgs-note.vp-msgs-first').forEach(n => n.remove());
            }
            function paintReacts(b, uid) {
                const old = b.querySelector('.vp-msgs-reacts');
                if (old) old.remove();
                const m = b._m, e = m && msgNet.reacts && msgNet.reacts.get(reactKey(uid, m.dir, m.ts));
                if (!e) return;
                const counts = new Map();
                for (const who of ['them', 'me']) if (e[who] && e[who].emoji) counts.set(e[who].emoji, (counts.get(e[who].emoji) || 0) + 1);
                if (!counts.size) return;
                const box = document.createElement('div');
                box.className = 'vp-msgs-reacts';
                counts.forEach((n, em) => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.textContent = em + (n > 1 ? ' ' + n : '');
                    if (e.me && e.me.emoji === em) btn.classList.add('vp-mine-r');
                    btn.addEventListener('click', ev => { ev.stopPropagation(); toggleReact(b, em); });
                    box.appendChild(btn);
                });
                b.insertBefore(box, b.lastChild);
            }
            function toggleReact(b, emoji) {
                const m = b._m, t = current && msgTarget(current);
                if (!m || !t || !t.uid) return;
                const key = reactKey(t.uid, m.dir, m.ts), e = msgNet.reacts.get(key) || {};
                const next = e.me && e.me.emoji === emoji ? '' : emoji;
                e.me = { ts: Math.floor(srvNow() / 1000), emoji: next };
                msgNet.reacts.set(key, e);
                const pend = msgNet.pendReacts || (msgNet.pendReacts = new Map());
                pend.set(key, { emoji: next, ts: e.me.ts, until: Date.now() + 60e3 });
                const nearEnd = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 80;
                paintReacts(b, t.uid);
                if (nearEnd) feed.scrollTop = feed.scrollHeight;
                current.sig = chatSig(t.uid);
                const d = current;
                msgReact(t.uid, m, next).then(() => { if (current === d) msgRefreshChat(d); })
                    .catch(err => { pend.delete(key); logErr('реакция', err); if (current === d) msgRefreshChat(d); note('Реакция не сохранилась — попробуй ещё раз'); });
            }
            let menu = null, pressT = 0;
            function closeMenu() {
                if (!menu) return;
                menu.remove(); menu = null;
                document.removeEventListener('pointerdown', menuOutside, true);
            }
            const menuOutside = e => { if (menu && !menu.contains(e.target)) closeMenu(); };
            function openMenu(b, x, y) {
                closeMenu();
                const m = b._m, real = m && current && !current.bot && msgNet.me && msgTarget(current).uid;
                const text = m ? m.text : (b.querySelector('.vp-msgs-cap') || b.firstChild || {}).textContent || '';
                const imgs = [...b.querySelectorAll('.vp-msgs-img')].map(i => i.src);
                menu = document.createElement('div');
                menu.className = 'vp-msgs-menu';
                if (real) {
                    const row = document.createElement('div');
                    row.className = 'vp-msgs-menu-r';
                    MSG_REACTS.forEach(em => {
                        const btn = document.createElement('button');
                        btn.type = 'button'; btn.textContent = em;
                        btn.addEventListener('click', () => { closeMenu(); toggleReact(b, em); });
                        row.appendChild(btn);
                    });
                    menu.appendChild(row);
                }
                const item = (label, fn) => {
                    const btn = document.createElement('button');
                    btn.type = 'button'; btn.className = 'vp-msgs-menu-i'; btn.textContent = label;
                    btn.addEventListener('click', () => { closeMenu(); fn(); });
                    menu.appendChild(btn);
                };
                if (text) item('📋 Копировать текст', () => { navigator.clipboard && navigator.clipboard.writeText(text).catch(() => { }); });
                if (imgs.length) item(imgs.length > 1 ? '🖼 Открыть альбом' : '🖼 Открыть картинку', () => openImg(imgs, 0, text));
                if (!menu.childNodes.length) { menu = null; return; }
                document.body.appendChild(menu);
                const w = menu.offsetWidth, h = menu.offsetHeight;
                menu.style.left = Math.max(8, Math.min(x, innerWidth - w - 8)) + 'px';
                menu.style.top = Math.max(8, Math.min(y, innerHeight - h - 8)) + 'px';
                setTimeout(() => document.addEventListener('pointerdown', menuOutside, true), 0);
            }
            const bubbleAt = y => [...feed.querySelectorAll('.vp-msgs-b:not(.vp-msgs-typing)')].find(x => { const r = x.getBoundingClientRect(); return y >= r.top - 3 && y <= r.bottom + 3; });
            feed.addEventListener('contextmenu', e => {
                const b = bubbleAt(e.clientY);
                if (!b) return;
                e.preventDefault();
                openMenu(b, e.clientX, e.clientY);
            });
            feed.addEventListener('pointerdown', e => {
                if (e.pointerType === 'mouse') return;
                const b = bubbleAt(e.clientY), x = e.clientX, y = e.clientY;
                if (!b) return;
                clearTimeout(pressT);
                pressT = setTimeout(() => { pressT = 0; openMenu(b, x, y); }, 480);
            });
            ['pointerup', 'pointercancel'].forEach(t => feed.addEventListener(t, () => clearTimeout(pressT)));
            feed.addEventListener('pointermove', e => { if (pressT && e.pointerType !== 'mouse') clearTimeout(pressT); });
            feed.addEventListener('scroll', () => closeMenu(), { passive: true });
            let lbKey = null;
            function openImg(list, idx, cap) {
                if (typeof list === 'string') list = [list];
                idx = idx || 0;
                if (lb) closeImg(true);
                lb = document.createElement('div');
                lb.className = 'vp-msgs-lb';
                lb.innerHTML = `<div class="vp-msgs-lb-top"><button type="button" class="vp-msgs-ib" title="Назад">${MSG_ICON.back}</button><span class="vp-msgs-lb-cap"></span>`
                    + `<b class="vp-msgs-lb-n"></b><a target="_blank" rel="noopener">Открыть оригинал ↗</a></div>`
                    + `<div class="vp-msgs-lb-body"><button type="button" class="vp-msgs-lb-nav vp-prev" title="Назад">‹</button><img alt="" draggable="false"><button type="button" class="vp-msgs-lb-nav vp-next" title="Дальше">›</button></div>`;
                const orig = lb.querySelector('a'), img = lb.querySelector('img'), num = lb.querySelector('.vp-msgs-lb-n');
                const prev = lb.querySelector('.vp-prev'), next = lb.querySelector('.vp-next');
                const show = i => {
                    idx = (i + list.length) % list.length;
                    img.src = list[idx];
                    if (/^https:\/\/cdn\./.test(list[idx])) { orig.href = list[idx]; orig.hidden = false; } else orig.hidden = true;
                    num.textContent = list.length > 1 ? `${idx + 1} / ${list.length}` : '';
                };
                prev.hidden = next.hidden = list.length < 2;
                prev.addEventListener('click', e => { e.stopPropagation(); show(idx - 1); });
                next.addEventListener('click', e => { e.stopPropagation(); show(idx + 1); });
                lb.querySelector('.vp-msgs-lb-cap').textContent = cap || '';
                show(idx);
                lb.querySelector('.vp-msgs-ib').addEventListener('click', () => closeImg());
                let downX = null;
                lb.addEventListener('pointerdown', e => { downX = e.clientX; });
                lb.addEventListener('click', e => {
                    const dx = downX == null ? 0 : e.clientX - downX;
                    downX = null;
                    if (list.length > 1 && Math.abs(dx) > 40) { show(idx + (dx < 0 ? 1 : -1)); return; }
                    if (e.target === lb || e.target.classList.contains('vp-msgs-lb-body')) closeImg();
                });
                lbKey = e => {
                    if (e.key === 'ArrowLeft' && list.length > 1) { e.preventDefault(); e.stopPropagation(); show(idx - 1); }
                    else if (e.key === 'ArrowRight' && list.length > 1) { e.preventDefault(); e.stopPropagation(); show(idx + 1); }
                };
                document.addEventListener('keydown', lbKey, true);
                root.appendChild(lb);
                history.pushState(Object.assign({}, history.state, { vpImg: 1 }), '', location.href);
            }
            function closeImg(fromHistory) {
                if (!lb) return;
                if (lbKey) { document.removeEventListener('keydown', lbKey, true); lbKey = null; }
                lb.remove(); lb = null;
                if (fromHistory !== true && overlayAt('vpImg')) history.back();
            }
            root.imgOpen = () => !!lb;
            let pendingImg = null;
            const pendEl = document.createElement('div');
            pendEl.className = 'vp-msgs-pend';
            pendEl.hidden = true;
            pendEl.innerHTML = '<div class="vp-msgs-pend-list"></div><span></span><button type="button" class="vp-msgs-pend-all" title="Убрать все">✕</button>';
            const pendList = pendEl.querySelector('.vp-msgs-pend-list');
            function renderPending() {
                pendList.textContent = '';
                (pendingImg || []).forEach((p, i) => {
                    const t = document.createElement('span');
                    t.className = 'vp-msgs-pend-t';
                    t.innerHTML = '<img alt=""><button type="button" title="Убрать">✕</button>';
                    t.firstChild.src = p.url;
                    t.lastChild.addEventListener('click', () => removePending(i));
                    pendList.appendChild(t);
                });
                const n = pendingImg ? pendingImg.length : 0;
                pendEl.querySelector('span:not(.vp-msgs-pend-t)').textContent = n > 1 ? `${n} ${plural(n, 'картинка', 'картинки', 'картинок')} из ${MSG_ALBUM_MAX} · можно добавить подпись` : 'Картинка · можно добавить подпись';
                pendEl.hidden = !n;
                send.disabled = !n && !input.value.trim();
            }
            function setPending(files) {
                files = (Array.isArray(files) ? files : [files]).filter(f => f && /^image\//.test(f.type));
                if (!files.length) return;
                const t = current && msgNet.me && !current.bot ? msgTarget(current) : null;
                if (!t || !t.uid) { note('Картинки можно отправлять в переписке с людьми и поддержкой'); return; }
                pendingImg = pendingImg || [];
                const room = MSG_ALBUM_MAX - pendingImg.length;
                if (files.length > room) note(`В одном сообщении — не больше ${MSG_ALBUM_MAX} картинок`);
                files.slice(0, Math.max(0, room)).forEach(file => pendingImg.push({ file, url: URL.createObjectURL(file) }));
                renderPending();
                input.focus();
            }
            function removePending(i) {
                if (!pendingImg) return;
                const [p] = pendingImg.splice(i, 1);
                if (p) URL.revokeObjectURL(p.url);
                if (!pendingImg.length) pendingImg = null;
                renderPending();
            }
            function clearPending() {
                (pendingImg || []).forEach(p => URL.revokeObjectURL(p.url));
                pendingImg = null;
                renderPending();
            }
            pendEl.querySelector('.vp-msgs-pend-all').addEventListener('click', clearPending);
            function msgSentOk(b, d, ts) {
                setMeta(b.lastChild, now() + ' ✓');
                if (ts && feed.querySelector(`:scope > .vp-msgs-b[data-dir="out"][data-ts="${ts}"]`)) b.remove();
                else if (ts) { b.dataset.ts = ts; b.dataset.dir = 'out'; }
                msgFillDialogs();
                if (current === d) msgRefreshChat(d);
            }
            function sendImages(files) {
                if (!files.length || !current) return;
                const t = msgNet.me && !current.bot ? msgTarget(current) : null;
                if (!t || !t.uid) { note('Картинки можно отправлять в переписке с людьми и поддержкой'); return; }
                const caption = input.value.trim(), d = current, locals = files.map(f => URL.createObjectURL(f));
                input.value = ''; send.disabled = true; msgCount();
                const b = bubble('out', caption, now() + ' · загрузка…', locals);
                (async () => {
                    const imgs = [];
                    for (const f of files) {
                        if (files.length > 1) setMeta(b.lastChild, now() + ` · загрузка ${imgs.length + 1} из ${files.length}…`);
                        imgs.push(await msgUploadImage(f));
                    }
                    setMeta(b.lastChild, now() + ' · отправка…');
                    return msgSend(t.uid, caption, t.sup, imgs);
                })().then(ts => msgSentOk(b, d, ts),
                    e => { setMeta(b.lastChild, now() + ' · не отправлено: ' + (e.message || e)); b.classList.add('vp-fail'); logErr('картинка', e); });
            }
            const fileIn = $('.vp-msgs-file');
            fileIn.multiple = true;
            $('.vp-msgs-attach').addEventListener('click', () => { if (!input.disabled) fileIn.click(); });
            fileIn.addEventListener('change', () => { const f = [...(fileIn.files || [])]; fileIn.value = ''; setPending(f); });
            input.addEventListener('paste', e => {
                const f = [...(e.clipboardData && e.clipboardData.files || [])].filter(x => /^image\//.test(x.type));
                if (f.length) { e.preventDefault(); setPending(f); }
            });
            $('.vp-msgs-bar').before(pendEl);
            $('.vp-msgs-bar').addEventListener('submit', e => {
                e.preventDefault();
                if (pendingImg && current) { const f = pendingImg.map(p => p.file); clearPending(); sendImages(f); return; }
                const text = input.value.trim();
                if (!text || !current) return;
                input.value = ''; send.disabled = true; msgCount();
                current.msgs.push(['out', text]);
                current.last = 'Ты: ' + text; current.time = now();
                if (current.bot) { bubble('out', text, now() + ' ✓'); botReply(); }
                else if (current.support && !(msgNet.me && msgTarget(current).uid)) { bubble('out', text, now() + ' ✓'); supportReply(); }
                else if (msgNet.me && msgTarget(current).uid) {
                    const b = bubble('out', text, now() + ' · отправка…'), d = current, t = msgTarget(d);
                    msgSend(t.uid, text, t.sup).then(ts => msgSentOk(b, d, ts),
                        e => { setMeta(b.lastChild, now() + ' · не отправлено'); b.classList.add('vp-fail'); logErr('сообщения', e); });
                }
                else bubble('out', text, now() + ' · не отправлено').classList.add('vp-fail');
            });

            function place() {
                const nav = siteEl('nav');
                const row = nav && navIsRow(nav) && nav.getBoundingClientRect().top > innerHeight / 2;
                document.querySelectorAll('.vp-msgs-navwrap').forEach(w => w.classList.remove('vp-msgs-navwrap'));
                if (row) {
                    if (nav.parentElement) nav.parentElement.classList.add('vp-msgs-navwrap');
                    const bottom = innerHeight - nav.getBoundingClientRect().top + BUMP_H + 8;
                    Object.assign(root.style, { left: '0px', right: '0px', top: '0px', bottom: '0px', width: '', borderRadius: '', paddingBottom: bottom + 'px' });
                } else {
                    let cb = contentBox() || lastCb;
                    if (!cb || cb.right - cb.left < 300) {
                        const side = siteEl('sidebar'), sr = side && side.getBoundingClientRect();
                        const w = Math.min(650, innerWidth - 32), l = Math.max(sr ? sr.right + 24 : 16, Math.round(innerWidth / 2 - w / 2));
                        cb = { left: l, right: Math.min(innerWidth - 16, l + w) };
                    }
                    const left = cb ? cb.left : Math.max(0, innerWidth / 2 - 300), width = cb ? cb.right - cb.left : Math.min(600, innerWidth);
                    Object.assign(root.style, { left: left + 'px', width: width + 'px', right: '', top: '12px', bottom: '12px', borderRadius: '', paddingBottom: '0px' });
                }
                root.classList.toggle('vp-card', !row);
                under.classList.remove('vp-on');
                if (!row) Object.assign(under.style, { left: root.style.left, width: root.style.width });
            }
            let openPath = '';
            function onKey(e) { if (e.key === 'Escape' && root.classList.contains('vp-open')) { e.stopPropagation(); lb ? closeImg() : menu ? closeMenu() : current ? closeChat() : close(); } }
            function close(fromHistory) {
                if (!root.classList.contains('vp-open')) return;
                clearTimeout(botTimer);
                root.classList.remove('vp-open');
                document.documentElement.classList.remove('vp-msgs-open');
                document.querySelectorAll('.vp-msgs-navwrap').forEach(w => w.classList.remove('vp-msgs-navwrap'));
                document.removeEventListener('keydown', onKey, true);
                removeEventListener('resize', place);
                msgsOpen = false;
                placeSidebar(); placeRail();
                if (!galOpen) galHideFeed(false);
                markActiveNav(); moveNavBlob();
                if (lb) { lb.remove(); lb = null; if (!fromHistory && overlayAt('vpImg')) { history.go(overlayAt('vpChat') ? -3 : -2); return; } }
                if (!fromHistory) {
                    if (overlayAt('vpChat')) history.go(-2);
                    else if (overlayAt('vpMsgs')) history.back();
                }
            }
            addEventListener('popstate', () => {
                const open = root.classList.contains('vp-open');
                if (lb && !overlayAt('vpImg')) { closeImg(true); return; }
                if (chatBackPending) {
                    chatBackPending = false;
                    if (current && overlayAt('vpMsgs') && !overlayAt('vpChat')) history.pushState(Object.assign({}, history.state, { vpChat: current.id }), '', location.href);
                    return;
                }
                if (overlayAt('vpMsgs')) {
                    if (!open) root.open(true);
                    const cid = history.state && history.state.vpChat;
                    if (!cid && current) closeChat(true);
                    else if (cid && (!current || current.id !== cid)) root.openDialog(cid, true);
                }
                else if (open) close(true);
            });
            document.addEventListener('click', e => {
                if (!root.classList.contains('vp-open')) return;
                const a = e.target.closest && e.target.closest('a.' + SELECTORS.navLink);
                if (a && a.getAttribute('href') !== '#' && a.getAttribute('href') === location.pathname) { e.preventDefault(); e.stopPropagation(); close(); }
            }, true);
            const msgsLeft = () => { if (root.classList.contains('vp-open') && location.pathname !== openPath) close(true); };
            onDom(msgsLeft);
            document.addEventListener('vp-loc', msgsLeft);
            root.open = fromHistory => {
                if (root.classList.contains('vp-open')) { if (current) closeChat(); return; }
                if (galOpen) closeGallery(true);
                openPath = location.pathname;
                msgsOpen = true;
                closeChat();
                loadMsgPeople(() => { if (!current) renderList(); });
                msgSync().then(() => { msgFillDialogs(); if (!current) renderList(); }).catch(() => { });
                place();
                placeSidebar(); placeRail();
                root.classList.add('vp-open');
                document.documentElement.classList.add('vp-msgs-open');
                document.addEventListener('keydown', onKey, true);
                addEventListener('resize', place);
                if (fromHistory !== true) overlayEnter('vpMsgs');
                galHideFeed(true);
                markActiveNav(); moveNavBlob();
            };
            root.close = close;
            return root;
        }

        function messagesLabel(notificationsLink) {
            return /уведомления/i.test(notificationsLink.textContent) ? 'Сообщения' : 'Личка';
        }
        function addMessagesButton() {
            const nav = document.querySelector('.' + SELECTORS.sidebar + ' .' + SELECTORS.nav)
                || siteEl('nav')
                || [...document.querySelectorAll('nav a')].find(a => a.textContent.trim() === 'Лента')?.closest('nav');
            if (!nav) return;

            const notificationsLink = nav.querySelector('a[href="/notifications"]');
            if (!notificationsLink) return;

            let messagesLink = nav.querySelector('a[href="#"]');
            if (messagesLink) {
                if (messagesLink.nextElementSibling !== notificationsLink) {
                    nav.insertBefore(messagesLink, notificationsLink);
                }
                const label = messagesLink.children[1], text = messagesLabel(notificationsLink);
                if (label && label.textContent !== text) label.textContent = text;
                return;
            }

            messagesLink = document.createElement('a');
            messagesLink.href = '#';
            const siteLinks = [...nav.querySelectorAll('a')].filter(a => a.parentElement === nav || a.parentElement.parentElement === nav)
                .filter(a => a.getAttribute('href') !== '#' && a.querySelector(':scope > span svg'));
            messagesLink.className = (commonClasses(siteLinks) + ' ' + SELECTORS.navLink).trim();

            const iconSpan = document.createElement('span');
            iconSpan.className = (commonClasses(siteLinks.map(a => a.firstElementChild)) + ' ' + SELECTORS.navIcon).trim();
            iconSpan.innerHTML = ICONS.MESSAGES;
            const textSpan = document.createElement('span');
            textSpan.className = commonClasses(siteLinks.map(a => a.children[1]).filter(Boolean));
            textSpan.textContent = messagesLabel(notificationsLink);
            messagesLink.appendChild(iconSpan);
            messagesLink.appendChild(textSpan);

            nav.insertBefore(messagesLink, notificationsLink);
        }

        addMessagesButton();
        onDom(addMessagesButton);
        document.addEventListener('click', e => {
            const a = e.target.closest && e.target.closest('nav a[href="#"]');
            if (!a || !a.closest('.' + SELECTORS.nav)) return;
            e.preventDefault();
            if (!messagesOverlay) messagesOverlay = buildMessagesOverlay();
            messagesOverlay.open();
        }, true);
        const PROFILE_SHORT = 'Акк';
        onDom(function shortProfileLabel() {
            const nav = siteEl('nav');
            const notif = nav && nav.querySelector(':scope > a[href="/notifications"]');
            if (!notif || /уведомления/i.test(notif.textContent)) return;
            nav.querySelectorAll(':scope > a[href^="/@"]').forEach(a => {
                const label = a.children[1];
                if (label && label.textContent.trim() === 'Профиль') label.textContent = PROFILE_SHORT;
            });
        });

        const PORTAL_ICON = {
            idle: { mask: '<path d="M12 4.17L14.35 9.82L20.45 10.31L15.8 14.28L17.22 20.23L12 17.05L6.78 20.23L8.2 14.28L3.55 10.31L9.65 9.82Z" stroke="currentColor" stroke-width="4.4" stroke-linejoin="round"/>', hole: '<path d="M12 11.13L12.59 12.54L14.11 12.66L12.95 13.66L13.3 15.15L12 14.35L10.7 15.15L11.05 13.66L9.89 12.66L11.41 12.54Z" stroke="currentColor" stroke-width="1.9800000000000002" stroke-linejoin="round"/>' },
            live: { mask: '<path d="M12 4.17L14.35 9.82L20.45 10.31L15.8 14.28L17.22 20.23L12 17.05L6.78 20.23L8.2 14.28L3.55 10.31L9.65 9.82Z" stroke="currentColor" stroke-width="4.4" stroke-linejoin="round"/><path d="M20.5 0.8C21.2 2.6 21.2 2.6 23 3.3C21.2 4 21.2 4 20.5 5.8C19.8 4 19.8 4 18 3.3C19.8 2.6 19.8 2.6 20.5 0.8Z"/><path d="M21.7 15C22.09 16.01 22.09 16.01 23.1 16.4C22.09 16.79 22.09 16.79 21.7 17.8C21.31 16.79 21.31 16.79 20.3 16.4C21.31 16.01 21.31 16.01 21.7 15Z"/><path d="M15.9 0.2C16.26 1.14 16.26 1.14 17.2 1.5C16.26 1.86 16.26 1.86 15.9 2.8C15.54 1.86 15.54 1.86 14.6 1.5C15.54 1.14 15.54 1.14 15.9 0.2Z"/>', over: '<path d="M12 9.18L13.1 11.83L15.97 12.06L13.79 13.93L14.45 16.73L12 15.23L9.55 16.73L10.21 13.93L8.03 12.06L10.9 11.83Z" fill="#5cc8ff" stroke="#5cc8ff" stroke-width="2.64" stroke-linejoin="round"/>' }
        };
        const BUMP = 40, BUMP_UP = 5, BUMP_W = 160, BUMP_H = 21, BUMP_LIFT = BUMP_H;
        function bumpPath(w, h, top) {
            const r = h / 2, cx = w / 2, half = BUMP_W / 2, peak = top - BUMP_H, n = v => +v.toFixed(2);
            return `M${r} ${top}H${n(cx - half)}`
                + `C${n(cx - half * .45)} ${top} ${n(cx - half * .42)} ${peak} ${cx} ${peak}`
                + `C${n(cx + half * .42)} ${peak} ${n(cx + half * .45)} ${top} ${n(cx + half)} ${top}`
                + `H${w - r}A${r} ${r} 0 0 1 ${w - r} ${top + h}H${r}A${r} ${r} 0 0 1 ${r} ${top}Z`;
        }
        let bumpPlus = null;
        onDom(function newPostBump() {
            const nav = siteEl('nav');
            if (!bumpPlus || !bumpPlus.isConnected) bumpPlus = document.querySelector('button[aria-label="Создать пост"]');
            const plus = bumpPlus, up = scrollTopButton;
            if (plus && up) {
                const cls = siteClasses(plus);
                if (cls && !cls.split(' ').every(c => up.classList.contains(c))) cls.split(' ').forEach(c => up.classList.add(c));
            }
            const row = !!(nav && navIsRow(nav) && plus && plus.parentElement === nav.parentElement);
            if (nav) nav.classList.toggle('vp-has-bump', row);
            let bg = nav && nav.querySelector(':scope > svg.vp-bump-bg');
            if (!row) {
                if (bg) bg.remove();
                if (plus) { plus.classList.remove('vp-new-post'); plus.style.removeProperty('top'); plus.style.removeProperty('left'); }
                return;
            }
            plus.classList.add('vp-new-post');
            const w = nav.offsetWidth, h = nav.offsetHeight, key = w + 'x' + h;
            if (!bg) {
                bg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                bg.setAttribute('class', 'vp-bump-bg');
                bg.innerHTML = '<defs><linearGradient id="vp-bump-edge" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1">'
                    + '<stop offset="0" stop-color="rgba(255,255,255,.25)"/><stop offset="1" stop-color="rgba(255,255,255,.05)"/></linearGradient></defs>'
                    + '<path class="vp-bump-fill"/><path class="vp-bump-edge" fill="none" stroke="url(#vp-bump-edge)" stroke-width="2"/>';
                nav.prepend(bg);
            }
            if (bg.dataset.key !== key) {
                bg.dataset.key = key;
                const top = BUMP_LIFT + 2, H = h + top, d = bumpPath(w, h, top);
                bg.setAttribute('width', w); bg.setAttribute('height', H); bg.setAttribute('viewBox', `0 0 ${w} ${H}`);
                bg.style.top = -top + 'px';
                bg.style.clipPath = `path('${d}')`;
                bg.querySelector('.vp-bump-fill').setAttribute('d', d);
                bg.querySelector('.vp-bump-edge').setAttribute('d', d);
                bg.querySelector('linearGradient').setAttribute('y2', H);
            }
            const top = Math.round(nav.offsetTop - BUMP_UP - BUMP / 2) + 'px', left = Math.round(nav.offsetLeft + nav.offsetWidth / 2 - BUMP / 2) + 'px';
            if (plus.style.top !== top) plus.style.top = top;
            if (plus.style.left !== left) plus.style.left = left;
        });
        let eventMaskN = 0;
        onDom(function eventIcon() {
            document.querySelectorAll('a[href^="/event"] img').forEach(img => {
                const own = [...img.classList].filter(c => !c.startsWith('vp-'));
                const state = own.length > 1 || (/portal/.test(img.src) && !/inactive/.test(img.src)) ? 'live' : 'idle';
                if (!img.classList.contains('vp-portal-img')) img.classList.add('vp-portal-img');
                let svg = img.parentElement.querySelector(':scope > svg.vp-portal');
                if (!svg) {
                    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('class', 'vp-portal');
                    svg.setAttribute('width', '24'); svg.setAttribute('height', '24');
                    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'currentColor');
                    img.after(svg);
                }
                if (svg.dataset.state !== state) {
                    svg.dataset.state = state;
                    const id = 'vp-ev-' + (++eventMaskN);
                    const ic = PORTAL_ICON[state];
                    svg.innerHTML = `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">`
                        + `<g fill="#fff" style="color:#fff">${ic.mask}</g>`
                        + (ic.hole ? `<g fill="#000" style="color:#000">${ic.hole}</g>` : '') + `</mask></defs>`
                        + `<rect width="24" height="24" fill="currentColor" mask="url(#${id})"/>` + (ic.over || '');
                }
            });
        });

        const postDesignStyle = addCss(`
        article.vp-post {
            background: var(--block-bg);
            backdrop-filter: var(--vp-glass-filter, blur(4px)) !important;
            border-radius: 24px !important;
            margin-bottom: 16px !important;
            transition: all 0.25s ease !important;
            position: relative;
            border: none !important;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2) !important;
            animation: postAppear 0.3s ease-out forwards !important;
            --vp-edge-a: rgba(255, 255, 255, .08); --vp-edge-b: rgba(255, 255, 255, .08);
        }
        article.vp-post::before {
            content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none; z-index: 1;
            background: linear-gradient(to bottom, var(--vp-edge-a), var(--vp-edge-b));
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor;
            mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
            transition: opacity .25s ease;
        }

        @media (hover: hover) {
            html.vp-post-hl article.vp-post:hover { --vp-edge-a: rgba(255, 255, 255, .24); box-shadow: 0 12px 32px rgba(0, 0, 0, .32) !important; }
        }
        @keyframes postAppear {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .vp-post-text {
            font-size: 15px !important;
            line-height: 1.5 !important;
            color: var(--text-primary, #e0e0e0) !important;
            background: rgba(0, 0, 0, 0.5) !important;
            padding: 8px 12px !important;
            border-radius: 16px !important;
            margin: 8px 0 !important;
        }
        .vp-post-action {
            transition: all 0.2s ease !important;
            border-radius: 40px !important;
            padding: 6px 10px !important;
        }
        @media (hover: hover) {
        .vp-post-action:hover {
            background: rgba(0, 128, 255, 0.15) !important;
            transform: translateY(-2px) !important;
        }
        .vp-avatar-link:hover {
            transform: scale(1.05) !important;
        }
        }
        @media (hover: none) {
            .vp-post-action:hover { background: transparent !important; transform: none !important; }
            .vp-post-action[aria-label="Нравится"]:active, .vp-post-action[aria-label="Нравится"].vp-pressed { background: rgba(249, 24, 128, 0.2) !important; color: #f91880 !important; }
            .vp-post-action[aria-label="Комментировать"]:active, .vp-post-action[aria-label="Комментировать"].vp-pressed { background: rgba(0, 186, 124, 0.2) !important; color: #00ba7c !important; }
            .vp-post-action[aria-label="Репост"]:active, .vp-post-action[aria-label="Репост"].vp-pressed { background: rgba(0, 128, 255, 0.2) !important; color: #0080FF !important; }
        }
        a[href*="/hashtag/"], a[href*="/tag/"], a:not([href^="/@"]):not([href*="/@"]):not([href^="#"]) {
            font-weight: 600 !important;
            text-decoration: none !important;
            transition: all 0.15s ease !important;
        }
        a[href*="/hashtag/"]:hover, a[href*="/tag/"]:hover, a:not([href^="/@"]):not([href*="/@"]):not([href^="#"]):hover {
            filter: brightness(1.25) !important;
        }
        a[href^="/@"], a[href*="/@"] { text-decoration: none !important; }
        a[href^="/@"] .vp-nick-text { font-weight: 600 !important; }
        a[href^="/@"]:hover .vp-nick-text { filter: brightness(0.85) !important; }
        a[href^="/@"] svg, a[href*="/@"] svg, a[href^="/@"] img, a[href*="/@"] img,
        a[href^="/@"] .mod-badge-voronoi, a[href*="/@"] .mod-badge-voronoi,
        a[href^="/@"] .vp-nick-badges {
            filter: none !important;
            transform: none !important;
        }
        .mod-badge-voronoi, .mod-badge-verify {
            display: inline-flex !important; align-items: center !important; flex-shrink: 0 !important;
            vertical-align: middle !important; width: var(--vp-badge) !important; height: var(--vp-badge) !important;
        }
        .mod-badge-voronoi {
            justify-content: center !important; overflow: hidden !important;
            min-width: var(--vp-badge) !important; min-height: var(--vp-badge) !important;
            max-width: var(--vp-badge) !important; max-height: var(--vp-badge) !important;
        }
        .mod-badge-voronoi > svg {
            display: block !important; width: var(--vp-badge) !important; height: var(--vp-badge) !important;
            min-width: var(--vp-badge) !important; min-height: var(--vp-badge) !important; max-width: none !important; max-height: none !important;
        }
        .mod-badge-verify { margin-left: 4px !important; }
        @keyframes likePop {
            0% { transform: scale(1); }
            50% { transform: scale(1.3); color: #ff3366 !important; }
            100% { transform: scale(1); }
        }
        .vp-post-action:active svg {
            animation: likePop 0.2s ease-out !important;
        }
        @media (hover: hover) {
        .vp-post-action[aria-label="Нравится"]:hover {
            background: rgba(249, 24, 128, 0.2) !important;
            color: #f91880 !important;
        }
        .vp-post-action[aria-label="Комментировать"]:hover {
            background: rgba(0, 186, 124, 0.2) !important;
            color: #00ba7c !important;
        }
        .vp-post-action[aria-label="Репост"]:hover {
            background: rgba(0, 128, 255, 0.2) !important;
            color: #0080FF !important;
        }
        }
        .vp-notif {
            animation: notificationAppear 0.3s ease-out both !important;
        }
        @keyframes notificationAppear {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `);


        const styleSidebar = addCss(`
        .vp-sidebar, .vp-sidebar-right {
            animation: fadeSlide 0.4s ease-out;
        }
        @keyframes fadeSlide {
            0% { opacity: 0; transform: translateX(-10px); }
            100% { opacity: 1; transform: translateX(0); }
        }
        .vp-sidebar-right {
            animation-name: fadeSlideRight;
        }
        @keyframes fadeSlideRight {
            0% { opacity: 0; transform: translateX(10px); }
            100% { opacity: 1; transform: translateX(0); }
        }
    `);

        const styleUnderline = addCss(`
        .vp-nick .vp-nick-text {
            transition: text-decoration-color 0.2s ease;
        }
        a[href^="/@"]:hover .vp-nick-text {
            text-decoration: underline;
            text-decoration-thickness: 2px;
            text-underline-offset: 4px;
            text-decoration-color: var(--accent-primary);
        }
    `);

        let modalOverlay = null;
        let updateTimeout = null;

        function floatsOverPage(el) {
            for (let e = el, i = 0; e && e !== document.body && i < 6; e = e.parentElement, i++) if (getComputedStyle(e).position === 'fixed') return true;
            return false;
        }
        function isModalVisible() {
            const modals = document.querySelectorAll('.vp-modal, [class*="modal"]');
            for (const modal of modals) {
                if (!floatsOverPage(modal) || /штор/i.test(modal.getAttribute('aria-label') || '')) continue;
                const style = getComputedStyle(modal);
                if (style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    style.opacity !== '0') {
                    const rect = modal.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        return modal;
                    }
                }
            }
            return null;
        }

        function updateModalOverlay() {
            if (updateTimeout) {
                cancelAnimationFrame(updateTimeout);
                updateTimeout = null;
            }
            updateTimeout = requestAnimationFrame(() => {
                const modal = isModalVisible();
                if (modal) {
                    if (!modalOverlay) {
                        modalOverlay = document.createElement('div');
                        modalOverlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(2px);
                    z-index: 999;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                `;
                        document.body.appendChild(modalOverlay);
                    }
                } else {
                    if (modalOverlay) {
                        modalOverlay.remove();
                        modalOverlay = null;
                    }
                }
                updateTimeout = null;
            });
        }

        const PAINTED = '.vp-nick, .vp-nick-text, .my-avatar-glow, article.vp-post, .vp-nav-link, .vp-nav-icon, .vp-nav-blob, '
            + '.vp-banner > img, .vp-ambient, .vp-bg-canvas, .vp-rail';
        const modalObserver = new MutationObserver(muts => {
            if (muts.some(m => m.type === 'childList' || !m.target.matches(PAINTED))) updateModalOverlay();
        });
        modalObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        window.addEventListener('popstate', () => {
            updateModalOverlay();
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) updateModalOverlay();
        });

        const styleIcons = addCss(`
        .vp-nav-link .vp-nav-icon svg {
            transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1) !important;
        }
        .vp-nav-link:hover .vp-nav-icon svg {
            transform: translateY(-2px) scale(1.05) !important;
        }
    `);

        const blurCards = new Map();
        const blurRO = new ResizeObserver(entries => {
            const todo = new Set(entries.map(e => blurCards.has(e.target) ? e.target : e.target._vpBlurCard));
            todo.forEach(card => card && placeBlur(card));
        });
        function placeBlur(card) {
            const b = blurCards.get(card);
            if (!b) return;
            if (!b.img.isConnected || !card.isConnected) { b.img._vpBlurDone = null; dropBlur(card); return; }
            const ar = card.getBoundingClientRect(), ir = b.img.getBoundingClientRect();
            if (!ar.width || !ir.width) return;
            const k = card.offsetWidth / ar.width;
            Object.assign(b.layer.style, {
                left: ((ir.left - ar.left) * k - card.clientLeft) + 'px', top: ((ir.top - ar.top) * k - card.clientTop) + 'px',
                width: ir.width * k + 'px', height: ir.height * k + 'px'
            });
        }
        function dropBlur(card) {
            const b = blurCards.get(card);
            if (b) { blurRO.unobserve(b.img); blurRO.unobserve(card); blurCards.delete(card); }
            card.removeAttribute('data-blur-bg');
            card.classList.remove('itd-blur-active', 'vp-blur-rel');
            const c = card.querySelector(':scope > .itd-blur-container');
            if (c) c.remove();
        }
        function buildBlur(card, img) {
            const old = blurCards.get(card);
            if (old) { blurRO.unobserve(old.img); blurRO.unobserve(card); }
            card.setAttribute('data-blur-bg', img.src);
            if (getComputedStyle(card).position === 'static') card.classList.add('vp-blur-rel');
            card.classList.add('itd-blur-active');
            let box = card.querySelector(':scope > .itd-blur-container');
            if (!box) {
                box = document.createElement('div');
                box.className = 'itd-blur-container';
                box.innerHTML = '<div class="vp-blur-img"></div><div class="vp-blur-dim"></div>';
                card.insertBefore(box, card.firstChild);
            }
            const layer = box.firstChild;
            layer.style.backgroundImage = `url("${img.src}")`;
            blurCards.set(card, { img, layer });
            img._vpBlurCard = card;
            blurRO.observe(img);
            blurRO.observe(card);
            placeBlur(card);
        }
        function addBlurBackground() {
            const cards = new Set();
            document.querySelectorAll('img.' + SELECTORS.postMedia).forEach(img => {
                if (img._vpBlurDone === img.src) return;
                let pending = false;
                for (const card of [img.closest('.' + SELECTORS.repost), img.closest('article.' + SELECTORS.post)]) {
                    const first = card && card.querySelector('img.' + SELECTORS.postMedia);
                    if (card && first && card.getAttribute('data-blur-bg') !== first.src) { cards.add(card); pending = true; }
                }
                if (!pending) img._vpBlurDone = img.src;
            });
            document.querySelectorAll('[data-blur-bg]').forEach(card => {
                if (!card.querySelector('img.' + SELECTORS.postMedia)) dropBlur(card);
            });
            cards.forEach(card => {
                const img = card.querySelector('img.' + SELECTORS.postMedia);
                if (!img || !img.src || img.src.includes('avatar')) return;
                buildBlur(card, img);
            });
        }

        const styleBlurPosts = addCss(`
        .vp-post.itd-blur-active, .vp-repost.itd-blur-active {
            background: transparent !important;
            backdrop-filter: none !important;
        }
        .vp-blur-rel { position: relative; }
        .itd-blur-container {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: inherit; overflow: hidden;
            z-index: -1; pointer-events: none; background: var(--block-bg);
        }
        .vp-blur-img {
            position: absolute; left: 0; top: 0; width: 0; height: 0;
            background: center / cover no-repeat;
            filter: blur(34px) brightness(1.3) saturate(1.6); transform: scale(1.3);
        }
        .vp-blur-dim { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.45); }
        .itd-blur-active .vp-repost {
            background: rgba(0, 0, 0, 0.3) !important;
        }
        html.vp-light .vp-blur-dim { background: rgba(255, 255, 255, 0.55); }
        html.vp-light .itd-blur-active .vp-repost { background: rgba(255, 255, 255, 0.35) !important; }
        .vp-post .blur-bg-layer, .vp-post .blur-overlay,
        .vp-repost .blur-bg-layer, .vp-repost .blur-overlay {
            display: none !important;
        }
    `);

        onDom(function postBlur() { if (postBlurEnabled) addBlurBackground(); });

        function gifFile(file) {
            if (!(file instanceof File) || !file.type.startsWith('image/') || file.type === 'image/gif') return file;
            return new File([file], file.name.replace(/\.[^.]+$/, '') + '.gif', { type: 'image/gif' });
        }
        function gifTransfer(files) {
            if (!antiCensorshipEnabled || !files || ![...files].some(f => gifFile(f) !== f)) return null;
            const dt = new DataTransfer();
            for (const f of files) dt.items.add(gifFile(f));
            return dt;
        }
        function gifOnPick(e) {
            const input = e.target;
            if (!(input instanceof HTMLInputElement) || input.type !== 'file') return;
            if (!/\.(jpe?g|png|gif|webp)|image\//i.test(input.accept || '')) return;
            const dt = gifTransfer(input.files);
            if (dt) input.files = dt.files;
        }
        document.addEventListener('input', gifOnPick, true);
        document.addEventListener('change', gifOnPick, true);
        document.addEventListener('drop', function (e) {
            const dt = gifTransfer(e.dataTransfer && e.dataTransfer.files);
            if (!dt) return;
            e.preventDefault();
            e.stopPropagation();
            e.target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY }));
        }, true);
        document.addEventListener('dragover', function (e) { if (antiCensorshipEnabled) e.preventDefault(); }, true);
        (function gifOnSend() {
            const X = pageWindow.XMLHttpRequest.prototype, origSend = X.send;
            X.send = function (body) {
                if (antiCensorshipEnabled && body instanceof FormData) {
                    const form = new FormData();
                    let changed = false;
                    for (const [key, value] of body.entries()) {
                        const v = gifFile(value);
                        if (v !== value) changed = true;
                        form.append(key, v);
                    }
                    if (changed) body = form;
                }
                return origSend.call(this, body);
            };
        })();

        const ERROR_TEXT = /ошибк|не удалось|не получилось|попробуйте|что-то пошло не так|error|failed/i;
        const ERROR_REPLIES = [
            'Нет, иди нахуй',
            'Пошёл нахуй',
            'Иди нахуй',
            'Нахуй иди',
            'А не пошёл бы ты нахуй',
            'Вали нахуй',
            'Отвали',
            'Хуй тебе',
            'Ты заебал, отвали',
            'Соси хуй'
        ];
        function replaceNotificationTexts() {
            document.querySelectorAll('[role="alert"], [role="status"], [aria-live]').forEach(box => {
                if (box.closest('.vp-msgs, .vpi-overlay')) return;
                [box, ...box.querySelectorAll('*')].forEach(el => {
                    if (el.childElementCount || el.textContent === el._vpReplaced) return;
                    if (!ERROR_TEXT.test(el.textContent)) return;
                    el.textContent = el._vpReplaced = ERROR_REPLIES[Math.floor(Math.random() * ERROR_REPLIES.length)];
                });
            });
        }

        onDom(replaceNotificationTexts);

        const emojiTints = new Map();
        let emojiCanvas = null;
        function emojiTint(emoji) {
            if (emojiTints.has(emoji)) return emojiTints.get(emoji);
            const c = measureEmojiColor(emoji);
            let tint = null;
            if (c) {
                const [r, g, b] = c.map(v => v / 255);
                const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
                let hue = 0;
                if (d) hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
                const sat = d ? Math.min(1, d / (1 - Math.abs(2 * l - 1)) * 1.25) : 0;
                const L = 0.55, C = (1 - Math.abs(2 * L - 1)) * sat, X = C * (1 - Math.abs((hue % 2 + 2) % 2 - 1)), m = L - C / 2;
                const [R, G, B] = [[C, X, 0], [X, C, 0], [0, C, X], [0, X, C], [X, 0, C], [C, 0, X]][Math.floor((hue + 6) % 6)];
                tint = [R, G, B].map(v => Math.round((v + m) * 255)).join(', ');
            }
            emojiTints.set(emoji, tint);
            return tint;
        }
        function measureEmojiColor(emoji) {
            if (!emojiCanvas) {
                emojiCanvas = document.createElement('canvas');
                emojiCanvas.width = emojiCanvas.height = 64;
            }
            const ctx = emojiCanvas.getContext('2d', { willReadFrequently: true });
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, 64, 64);
            ctx.font = '48px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, 32, 34);
            const data = ctx.getImageData(0, 0, 64, 64).data;
            const sum = [0, 0, 0];
            let count = 0;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] <= 128) continue;
                sum[0] += data[i]; sum[1] += data[i + 1]; sum[2] += data[i + 2];
                count++;
            }
            return count ? sum.map(v => Math.round(v / count)) : null;
        }
        function tintCard(el, emoji) {
            const tint = emoji && emojiTint(emoji);
            if (!tint) return false;
            el.style.setProperty('--vp-emoji', tint);
            el.classList.add('vp-emoji-tint');
            return true;
        }

        function untintCard(el) {
            el.classList.remove('vp-emoji-tint');
            el.style.removeProperty('--vp-emoji');
        }
        function colorizePosts() {
            document.querySelectorAll('article.' + SELECTORS.post).forEach(post => {
                const avatar = post.querySelector('.' + SELECTORS.avatarLink + ' .' + SELECTORS.avatar);
                const emoji = avatar ? avatar.textContent.trim() : '';
                const withBlur = postBlurEnabled && !!post.querySelector('.' + SELECTORS.postMedia);
                const key = emoji ? emoji + (withBlur ? '|blur' : '') : '';
                const tinted = !key || withBlur || post.classList.contains('vp-emoji-tint');
                if ((post.getAttribute('data-post-colored') || '') === key && tinted) return;
                untintCard(post);
                if (!key) { post.removeAttribute('data-post-colored'); return; }
                post.setAttribute('data-post-colored', key);
                if (!withBlur) tintCard(post, emoji);
            });
            document.querySelectorAll('article.' + SELECTORS.post + '[data-post-colored] .' + SELECTORS.repost + ':not([data-vp-soft])').forEach(rp => softenRepost(rp.closest('article')));
        }
        function softenRepost(post) {
            post.querySelectorAll('.' + SELECTORS.repost + ':not([data-vp-soft])').forEach(rp => {
                rp.setAttribute('data-vp-soft', '');
                [rp, ...rp.querySelectorAll('div, p, section')].forEach(el => {
                    if (el.closest('button, a, video') || el.querySelector(':scope > img, :scope > video')) return;
                    const m = getComputedStyle(el).backgroundColor.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
                    if (!m || (m[4] !== undefined && +m[4] < .5)) return;
                    el.classList.add('vp-soft-bg');
                });
            });
        }

        onDom(function postColors() {
            if (!location.pathname.includes('/notifications')) colorizePosts();
        });

        const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[\u200d\ufe0f\u{1F3FB}-\u{1F3FF}])+$/u;
        function emojiAvatarOf(item) {
            const tagged = item.querySelector('.' + SELECTORS.avatar);
            if (tagged && tagged.textContent.trim()) return tagged.textContent.trim();
            const leaves = [...item.querySelectorAll('span, div')].filter(e => !e.children.length && EMOJI_ONLY.test(e.textContent.trim()));
            const leaf = leaves.find(e => e.closest(PROFILE_LINK)) || leaves[0];
            return leaf ? leaf.textContent.trim() : null;
        }

        function avaTint(el, src) {
            let box = el.querySelector(':scope > .vp-ava-tint-bg');
            if (!box) {
                box = document.createElement('div');
                box.className = 'vp-ava-tint-bg';
                box.appendChild(document.createElement('div'));
                el.insertBefore(box, el.firstChild);
            }
            box.firstChild.style.backgroundImage = `url("${src}")`;
            el.classList.add('vp-ava-tint');
        }
        function untintAva(el) {
            el.classList.remove('vp-ava-tint');
            const box = el.querySelector(':scope > .vp-ava-tint-bg');
            if (box) box.remove();
        }
        function colorizeNotifications() {
            document.querySelectorAll('.' + SELECTORS.notification).forEach(el => {
                const emoji = emojiAvatarOf(el) || '';
                const img = emoji ? null : el.querySelector('.' + SELECTORS.avatar + ' img[src]');
                const key = emoji || (img ? img.src : '');
                if ((el.getAttribute('data-colored') || '') === key && (!key || el.classList.contains(emoji ? 'vp-emoji-tint' : 'vp-ava-tint'))) return;
                untintCard(el);
                untintAva(el);
                if (key) el.setAttribute('data-colored', key); else el.removeAttribute('data-colored');
                if (emoji) tintCard(el, emoji);
                else if (img) avaTint(el, img.src);
            });
        }

        onDom(function notificationColors() {
            if (location.pathname.includes('/notifications')) colorizeNotifications();
        });



        const designStyle = addCss(`
        @property --vp-tint { syntax: '<number>'; inherits: false; initial-value: 0.3; }
        .vp-emoji-tint {
            background-image: linear-gradient(105deg,
                rgba(var(--vp-emoji), var(--vp-tint)) 0%,
                rgba(var(--vp-emoji), calc(var(--vp-tint) * 0.4)) 45%,
                rgba(var(--vp-emoji), calc(var(--vp-tint) * 0.1)) 100%) !important;
            --vp-edge-a: rgba(var(--vp-emoji), .22); --vp-edge-b: rgba(var(--vp-emoji), .22);
            transition: --vp-tint 0.25s ease !important;
        }
        .vp-emoji-tint:not(article) { border: 1px solid rgba(var(--vp-emoji), 0.22) !important; }
        .vp-ava-tint { position: relative; isolation: isolate; }
        .vp-ava-tint-bg { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; z-index: -1; pointer-events: none; }
        .vp-ava-tint-bg > div {
            position: absolute; inset: -30%; background: left center / cover no-repeat; filter: blur(40px) saturate(1.8) brightness(.75);
            opacity: .35; transition: opacity 0.25s ease;
            -webkit-mask-image: linear-gradient(105deg, #000 20%, rgba(0, 0, 0, .4) 50%, rgba(0, 0, 0, .1) 80%);
            mask-image: linear-gradient(105deg, #000 20%, rgba(0, 0, 0, .4) 50%, rgba(0, 0, 0, .1) 80%);
        }
        @media (hover: hover) {
            .vp-emoji-tint:hover { --vp-tint: 0.42; }
            .vp-emoji-tint:not(article):hover { border-color: rgba(var(--vp-emoji), 0.4) !important; }
            .vp-ava-tint:hover .vp-ava-tint-bg > div { opacity: .5; }
            html.vp-post-hl article.vp-emoji-tint:hover { --vp-edge-a: rgba(var(--vp-emoji), .55); --vp-edge-b: rgba(var(--vp-emoji), .22); }
        }
        @media (max-width: ${PHONE_MAX}px) {
            .vp-notif { border-radius: 24px !important; margin: 6px 10px !important; }
        }

        .vp-version-row { display: flex; align-items: center; gap: 6px; margin: 2px 0 0; }
        .vp-version-col { flex-direction: column; gap: 3px; margin: 0; }
        .vp-version-chip {
            font: 600 10px/1 ui-monospace, SFMono-Regular, Consolas, monospace;
            color: var(--text-secondary); letter-spacing: 0.02em;
            padding: 3px 6px; border-radius: 6px; background: var(--bg-hover, rgba(255, 255, 255, 0.08));
            cursor: pointer; position: relative; transition: color .15s ease, background-color .15s ease;
        }
        .vp-version-chip:hover { color: var(--text-primary, #fff); background: var(--block-bg-secondary, rgba(255, 255, 255, 0.14)); }
        .vp-version-chip.vp-news::after { content: ""; position: absolute; top: -3px; right: -3px; width: 7px; height: 7px;
            border-radius: 50%; background: #2a8cff; box-shadow: 0 0 0 2px var(--bg-primary, #000); }
        .vp-logo-top { display: flex; align-items: flex-start; gap: 10px; }
        .vp-logo-col { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .vp-logo-col > a { height: 36px; }
        .vp-logo-col .vp-version-row { position: relative; }
        .vp-logo-col .itd-update-sidebar-btn { position: absolute; left: calc(100% + 6px); top: 50%; translate: 0 -50%; }
        .vp-logo-top > :not(.vp-logo-col) { height: 36px; display: inline-flex; align-items: center; }

        .vp-news-back { position: fixed; inset: 0; z-index: 10050; background: rgba(0, 0, 0, .5); display: flex;
            align-items: center; justify-content: center; padding: 16px; animation: vpNewsFade .18s ease;
            backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
        html.vp-light .vp-news-back { background: rgba(0, 0, 0, .25); }
        .vp-news-box { width: min(780px, 100%); max-height: min(82vh, 900px); display: flex; flex-direction: column; overflow: hidden;
            background: var(--modal-bg, var(--block-bg)); color: var(--text-primary, #fff); border-radius: 28px;
            border: 1px solid var(--border-color, rgba(255, 255, 255, .12)); box-shadow: 0 24px 64px rgba(0, 0, 0, .45);
            backdrop-filter: var(--vp-glass-filter, none); -webkit-backdrop-filter: var(--vp-glass-filter, none);
            animation: vpNewsIn .22s cubic-bezier(.2, .8, .2, 1); }
        .vp-news-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 16px 24px;
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, .1)); }
        .vp-news-head b { font-size: 20px; font-weight: 700; }
        .vp-news-x { width: 40px; height: 40px; border-radius: 50%; border: 0; cursor: pointer; display: flex; align-items: center;
            justify-content: center; background: var(--block-bg-secondary, rgba(255, 255, 255, .1)); color: var(--text-primary, #fff); }
        .vp-news-list { overflow-y: auto; padding: 8px 28px 20px; overscroll-behavior: contain; }
        .vp-news-ver { padding: 18px 0; border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, .1)); }
        .vp-news-ver:last-child { border-bottom: 0; }
        .vp-news-tag { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; color: var(--text-secondary); font-size: 15px; }
        .vp-news-tag span { padding: 5px 12px; border-radius: 8px; font-weight: 600; color: #2a8cff; background: rgba(42, 140, 255, .14); }
        .vp-news-ver ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .vp-news-ver li { position: relative; padding-left: 24px; font-size: 16px; line-height: 1.45; }
        .vp-news-ver li::before { content: ""; position: absolute; left: 2px; top: .6em; width: 6px; height: 6px; border-radius: 50%; background: #2a8cff; }
        @keyframes vpNewsFade { from { opacity: 0; backdrop-filter: blur(0); -webkit-backdrop-filter: blur(0); } }
        @keyframes vpNewsIn { from { opacity: 0; transform: translateY(12px) scale(.98); } }
        @media (prefers-reduced-motion: reduce) { .vp-news-back, .vp-news-box { animation: none; } }
        .itd-update-sidebar-btn {
            display: inline-flex; align-items: center; gap: 4px; border: 0; cursor: pointer;
            font-family: inherit; font-size: 10px; font-weight: 700; line-height: 1; color: #fff; white-space: nowrap;
            padding: 4px 8px; border-radius: 999px;
            background: linear-gradient(135deg, #2a8cff, #6a5bff);
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.14) inset, 0 4px 14px rgba(60, 120, 255, 0.35);
            transition: transform 0.15s ease, filter 0.15s ease;
            animation: vpUpdatePulse 2.6s ease-in-out infinite;
        }
        .itd-update-sidebar-btn:hover { transform: translateY(-1px); filter: brightness(1.12); }
        .itd-update-sidebar-btn svg { width: 11px; height: 11px; }
        @keyframes vpUpdatePulse {
            0%, 100% { box-shadow: 0 0 0 1px rgba(255,255,255,.14) inset, 0 4px 14px rgba(60,120,255,.35); }
            50% { box-shadow: 0 0 0 1px rgba(255,255,255,.14) inset, 0 4px 22px rgba(60,120,255,.6); }
        }

        .vp-nav-link:focus-visible, .vp-post-action:focus-visible, .vp-pill-btn:focus-visible,
        .nick-style-option:focus-visible, .settings-option:focus-visible {
            outline: 2px solid var(--vp-accent) !important; outline-offset: 2px !important;
        }
        .vp-nav-link .vp-nav-icon { transition: color 0.2s ease, filter 0.2s ease; }

        @media (prefers-reduced-motion: reduce) {
            .vp-post, .vp-sidebar, .vp-sidebar-right, .vp-notif, .itd-update-sidebar-btn { animation: none !important; }
            .vp-emoji-tint { transition: none !important; }
        }
    `);

        let msgsOpen = false;
        let galOpen = false;
        function markActiveNav() {
            const path = location.pathname;
            document.querySelectorAll('.' + SELECTORS.navLink).forEach(a => {
                const href = a.getAttribute('href') || '';
                const active = msgsOpen ? href === '#' : galOpen ? href === '#gallery'
                    : href.startsWith('/') && (href === path || (href !== '/' && path.startsWith(href + '/')));
                a.classList.toggle('vp-active', active);
            });
            msgsNavLook();
        }
        function msgsNavLook() {
            const links = [...document.querySelectorAll('.' + SELECTORS.navLink)];
            if (!msgsOpen && !galOpen) { links.forEach(a => a.classList.remove('vp-site-cur')); return; }
            const path = location.pathname;
            const cur = links.find(a => { const h = a.getAttribute('href') || ''; return h.startsWith('/') && (h === path || (h !== '/' && path.startsWith(h + '/'))); });
            const other = links.find(a => a !== cur && !/^#/.test(a.getAttribute('href') || '') && a.getAttribute('href') !== path);
            const nav = (cur || other) && (cur || other).closest('nav');
            if (!nav || !other || (cur && cur.classList.contains('vp-site-cur'))) return;
            const look = (a, k) => { const g = getComputedStyle(a); nav.style.setProperty(`--vp-${k}-c`, g.color); nav.style.setProperty(`--vp-${k}-o`, g.opacity); nav.style.setProperty(`--vp-${k}-b`, g.backgroundColor); };
            look(other, 'off');
            look(cur || other, 'on');
            if (cur) cur.classList.add('vp-site-cur');
        }
        markActiveNav();
        onDom(markActiveNav);
        addEventListener('popstate', markActiveNav);

        const fx = addCss(`
        html.vp-glass { --vp-glass-filter: blur(18px) saturate(1.5); }
        html.vp-glass[data-theme="dark"] {
            --block-bg: rgba(28, 28, 28, .52); --block-bg-secondary: rgba(42, 42, 44, .55); --block-hover-bg: rgba(44, 44, 47, .6);
            --modal-bg: rgba(17, 17, 17, .8); --glass-bg: rgba(35, 35, 35, .5);
        }
        html.vp-glass.vp-light {
            --block-bg: rgba(255, 255, 255, .6); --block-bg-secondary: rgba(240, 240, 240, .6); --block-hover-bg: rgba(245, 245, 245, .65);
            --modal-bg: rgba(255, 255, 255, .82); --glass-bg: rgba(255, 255, 255, .55);
        }
        html.vp-glass.vp-glass-lite { --vp-glass-filter: none; }
        html.vp-glass.vp-glass-lite[data-theme="dark"] { --block-bg: rgba(28, 28, 28, .82); --block-bg-secondary: rgba(42, 42, 44, .85); }
        html.vp-glass.vp-glass-lite.vp-light { --block-bg: rgba(255, 255, 255, .85); }
        html.vp-glass[data-theme="dark"] :is(.vp-comments-sheet, .vp-float) {
            --block-bg: rgba(24, 24, 24, .9); --block-bg-secondary: rgba(38, 38, 40, .9); --block-hover-bg: rgba(44, 44, 47, .92);
            --modal-bg: rgba(17, 17, 17, .94); --glass-bg: rgba(30, 30, 30, .9);
        }
        html.vp-glass.vp-light :is(.vp-comments-sheet, .vp-float) {
            --block-bg: rgba(255, 255, 255, .92); --block-bg-secondary: rgba(240, 240, 240, .92); --block-hover-bg: rgba(245, 245, 245, .94);
            --modal-bg: rgba(255, 255, 255, .95); --glass-bg: rgba(255, 255, 255, .9);
        }
        html.vp-glass .vp-nested { background-color: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; border-radius: 18px; }
        html.vp-glass .settings-dropdown {
            backdrop-filter: var(--vp-glass-filter) !important; -webkit-backdrop-filter: var(--vp-glass-filter) !important;
        }

        .vp-nav-has-blob { position: relative; }
        .vp-nav-has-blob .vp-nav-link { position: relative; z-index: 1; transition: background-color .2s ease, opacity .2s ease !important; }
        .vp-nav-has-blob .vp-nav-link .vp-nav-icon { transition: none; }
        .vp-nav-has-blob .vp-nav-link.vp-active { background: transparent !important; }
        .vp-nav-has-blob > div:not(.vp-nav-blob):not(:has(a)) { opacity: 0 !important; }
        .vp-post-slot { border-bottom: none !important; }
        .vp-new-post { position: absolute !important; width: ${BUMP}px !important; height: ${BUMP}px !important; z-index: 2; margin: 0 !important;
            background: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; }
        .vp-new-post::before { display: none !important; }
        .vp-new-post { color: var(--text-secondary) !important; transition: color .2s; }
        .vp-new-post:active { color: var(--text-primary) !important; }
        nav.vp-has-bump { background: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; }
        nav.vp-has-bump::before { display: none !important; }
        .vp-bump-bg { position: absolute; left: 0; z-index: -1; pointer-events: none; overflow: visible;
            backdrop-filter: var(--vp-glass-filter, blur(16px)); -webkit-backdrop-filter: var(--vp-glass-filter, blur(16px)); }
        .vp-bump-bg .vp-bump-fill { fill: var(--glass-bg); }
        a[href^="/event"] img[src*="/portal/"], img.vp-portal-img { display: none !important; }
        .vp-itdx-btn { background: color-mix(in srgb, var(--vp-accent) 16%, var(--block-bg)) !important;
            color: color-mix(in srgb, var(--vp-accent) 75%, #fff) !important; border-color: transparent !important;
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 40%, transparent) !important; transition: background-color .15s ease; }
        .vp-itdx-btn { display: inline-flex !important; align-items: center; justify-content: center; gap: 6px; }
        .vp-itdx-btn > svg { flex: none; }
        .vp-itdx-btn:hover { background: color-mix(in srgb, var(--vp-accent) 24%, var(--block-bg)) !important; }
        html.vp-light .vp-itdx-btn { background: color-mix(in srgb, var(--vp-accent) 12%, #fff) !important; color: color-mix(in srgb, var(--vp-accent) 80%, #000) !important; }
        .vp-nick-tail-moved { display: none !important; }
        .vp-nick-large .vp-nick-text + .mod-badge-voronoi { margin-left: 5px !important; }
        .vp-nick-large .mod-badge-voronoi, .vp-nick-large .mod-badge-verify { vertical-align: -0.08em !important; }
        :has(> .mod-badge-verify), :has(> .mod-badge-voronoi) { flex-wrap: nowrap !important; }
        [data-vp-stack] { grid-template-columns: minmax(0, 1fr) !important; row-gap: 14px !important; }
        [data-vp-stack] > * { grid-area: auto !important; grid-column: 1 / -1 !important; }
        @media (prefers-reduced-motion: reduce) { .vp-portal { animation: none !important; } }
        .vp-portal[data-state="live"] { animation: vpPortalPulse 2s ease-in-out infinite; }
        @keyframes vpPortalPulse {
            0%, 100% { filter: drop-shadow(0 0 4px rgba(144, 162, 255, .2)); }
            50% { filter: drop-shadow(0 0 16px rgb(144, 162, 255)); }
        }
        .vp-nav-blob > i { display: none; }
        .vp-nav-blob.vp-blob-row { width: 0 !important; height: 0 !important; background: none !important; box-shadow: none !important; }
        .vp-nav-blob.vp-blob-row > i { display: block; position: absolute; left: 0; top: 0; box-sizing: border-box; transform-origin: 0 50%; will-change: transform;
            background: color-mix(in srgb, var(--vp-accent) 14%, #242426);
            border: 1px solid color-mix(in srgb, var(--vp-accent) 32%, #3c3c40); transition: background-color .4s ease; }
        html.vp-light .vp-nav-blob.vp-blob-row > i { background: color-mix(in srgb, var(--vp-accent) 14%, #f0f0f2);
            border-color: color-mix(in srgb, var(--vp-accent) 32%, #d6d6da); }
        .vp-nav-blob .vp-bl { border-right: 0 !important; border-radius: 999px 0 0 999px; }
        .vp-nav-blob .vp-bm { border-left: 0 !important; border-right: 0 !important; }
        .vp-nav-blob .vp-br { border-left: 0 !important; border-radius: 0 999px 999px 0; }
        .vp-nav-blob { position: absolute; left: 0; top: 0; z-index: 0; pointer-events: none; opacity: 0;
            background: color-mix(in srgb, var(--vp-accent) 14%, var(--block-bg));
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 32%, transparent),
                0 8px 24px -10px color-mix(in srgb, var(--vp-accent) 70%, transparent);
            transition: opacity .25s ease, background-color .4s ease; }

        .vp-banner.vp-depth { background: transparent !important; }
        .vp-banner { isolation: isolate; }
        .vp-banner.vp-depth > img[alt="Banner"], .vp-banner.vp-depth > .vp-banner-video, .vp-banner.vp-depth > [aria-label="Стекло"], .vp-banner.vp-depth > [aria-label="Разбитое стекло"] { will-change: transform; transform-origin: 50% 50%;
            -webkit-mask-image: linear-gradient(to bottom, #000 58%, transparent); mask-image: linear-gradient(to bottom, #000 58%, transparent); }

        @property --vp-n { syntax: '<integer>'; inherits: false; initial-value: 0; }
        .vp-count { position: relative; color: transparent !important; }
        .vp-count::after { content: counter(vpn); counter-reset: vpn var(--vp-n); position: absolute; left: 0; top: 0;
            color: var(--vp-count-color); animation: vpCount .9s cubic-bezier(.2, .8, .2, 1) forwards; }
        @keyframes vpCount { from { --vp-n: 0; } to { --vp-n: var(--vp-to); } }

        @keyframes vpShimmer { 0% { background-position: 100% 0; } 55%, 100% { background-position: 0% 0; } }
        @keyframes vpGlitch {
            0%, 100% { text-shadow: 1.5px 0 rgba(255, 0, 200, .75), -1.5px 0 rgba(0, 255, 240, .75); clip-path: none; transform: none; }
            60% { text-shadow: 3px 0 rgba(255, 0, 200, .9), -3px 0 rgba(0, 255, 240, .9); transform: translateX(1px) skewX(-8deg); }
            62% { text-shadow: -3px 1px rgba(255, 0, 200, .9), 3px -1px rgba(0, 255, 240, .9); clip-path: inset(38% 0 28% 0); transform: translateX(-2px); }
            64% { text-shadow: 2px 0 rgba(255, 0, 200, .9), -2px 0 rgba(0, 255, 240, .9); clip-path: inset(0 0 55% 0); transform: translateX(2px); }
            66% { text-shadow: 1.5px 0 rgba(255, 0, 200, .75), -1.5px 0 rgba(0, 255, 240, .75); clip-path: none; transform: none; }
            88% { text-shadow: -2px 0 rgba(255, 0, 200, .85), 2px 0 rgba(0, 255, 240, .85); transform: translateX(-1px); }
            89% { text-shadow: 1.5px 0 rgba(255, 0, 200, .75), -1.5px 0 rgba(0, 255, 240, .75); transform: none; }
        }
        @property --vp-so { syntax: '<number>'; inherits: false; initial-value: 1; }
        @property --vp-ss { syntax: '<number>'; inherits: false; initial-value: 1; }
        @property --vp-sy { syntax: '<length>'; inherits: false; initial-value: 0px; }
        html.vp-scene article.vp-post {
            animation: none !important; transform-origin: 50% 0; backface-visibility: hidden;
            opacity: var(--vp-so, 1); transform: translateY(var(--vp-sy, 0px)) scale(var(--vp-ss, 1));
            transition: background-color .25s ease, border-color .25s ease, box-shadow .25s ease, color .25s ease !important;
        }

        .vp-ambient-host { isolation: isolate; }
        .vp-ambient { position: absolute; z-index: -1; pointer-events: none; border-radius: 40px; opacity: 0;
            filter: blur(26px) saturate(1.7); transition: opacity .8s ease; }
        .vp-ambient.vp-on { opacity: .8; }

        .vp-tab-ind { transition: background-color .2s ease !important; }

        .vp-hc { --vp-hc-bg: rgba(22, 22, 24, .94); position: fixed; z-index: 10005; width: 300px; border-radius: 22px; overflow: hidden; cursor: pointer;
            background: var(--vp-hc-bg); color: var(--text-primary, #fff);
            border: 1px solid color-mix(in srgb, var(--text-primary, #fff) 10%, transparent);
            box-shadow: 0 18px 50px rgba(0, 0, 0, .5); backdrop-filter: blur(24px) saturate(1.3);
            -webkit-backdrop-filter: blur(24px) saturate(1.3); animation: vpHcIn .22s cubic-bezier(.2, 1.2, .4, 1); }
        html.vp-light .vp-hc { --vp-hc-bg: rgba(255, 255, 255, .95); box-shadow: 0 18px 50px rgba(0, 0, 0, .18); }
        .vp-hc-banner { height: 84px; background-size: cover; background-position: center; }
        .vp-hc-body { padding: 0 16px 14px; }
        .vp-hc-ava { width: 60px; height: 60px; margin-top: -30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-size: 30px; background: var(--vp-hc-bg); border: 3px solid var(--vp-hc-bg); overflow: hidden; position: relative; }
        .vp-hc-ava img { width: 100%; height: 100%; object-fit: cover; }
        .vp-hc-name { margin-top: 6px; font-weight: 700; font-size: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-hc-login { font-size: 13px; color: var(--text-secondary); }
        .vp-hc-bio { margin-top: 8px; font-size: 13px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .vp-hc-bio:empty { display: none; }
        .vp-hc-stats { display: flex; gap: 14px; margin-top: 10px; font-size: 13px; color: var(--text-secondary); }
        .vp-hc-stats:empty { display: none; }
        .vp-hc-stats b { color: var(--text-primary, #fff); }
        @keyframes vpHcIn { from { opacity: 0; transform: translateY(6px) scale(.97); } }

        @media (prefers-reduced-motion: reduce) {
            .vp-hc { animation: none; }
            .vp-count::after { animation: none; counter-reset: vpn var(--vp-to); }
            .vp-nav-blob { transition: none; }
        }
    `);
        const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

        let glassEnabled = GM_getValue('glassEnabled', true);
        const glassCss = document.createElement('style');
        document.head.appendChild(glassCss);
        let glassSheets = -1, glassSel = '';
        function collectGlass() {
            if (document.styleSheets.length === glassSheets) return;
            glassSheets = document.styleSheets.length;
            const sels = new Set();
            const walk = rules => {
                for (const r of rules) {
                    if (r.cssRules && !r.selectorText) { walk(r.cssRules); continue; }
                    if (!r.selectorText || r.selectorText.includes('::')) continue;
                    if (/var\(--(block-bg|modal-bg|block-bg-secondary|glass-bg)/.test(r.style.background + r.style.backgroundColor)) sels.add(r.selectorText);
                }
            };
            for (const sh of document.styleSheets) {
                if (sh.ownerNode === glassCss || sh.ownerNode === fx) continue;
                try { walk(sh.cssRules); } catch (e) { }
            }
            glassSel = [...sels].join(', ');
            glassCss.textContent = [...sels].map(sel => `html.vp-glass :is(${sel}) { backdrop-filter: var(--vp-glass-filter); -webkit-backdrop-filter: var(--vp-glass-filter); }`).join('\n');
        }
        function applyGlass() {
            document.documentElement.classList.toggle('vp-glass', glassEnabled);
            if (glassEnabled) collectGlass();
        }
        applyGlass();
        onDom(function glassSheetsCheck() { if (glassEnabled) collectGlass(); });
        const floatSeen = new WeakSet();
        let floatAt = 0;
        onDom(function glassFloating() {
            if (!glassEnabled || !glassSel || performance.now() - floatAt < 250) return;
            floatAt = performance.now();
            document.querySelectorAll(`:is(${glassSel}), [style*="--block-bg"], [style*="--modal-bg"], [style*="--glass-bg"]`).forEach(el => {
                if (floatSeen.has(el)) return;
                floatSeen.add(el);
                if (el.matches('article, .' + SELECTORS.post + ', .' + SELECTORS.avatar) || el.closest('nav, aside, .vp-rail, .vp-msgs, .vp-comments-sheet')) return;
                for (let n = el, i = 0; n && n !== document.body && i < 6; n = n.parentElement, i++) {
                    const cs = getComputedStyle(n);
                    if (cs.position === 'fixed' || (cs.position === 'absolute' && +cs.zIndex >= 5)) { el.classList.add('vp-float'); return; }
                }
                const outer = el.parentElement && el.parentElement.closest(`:is(${glassSel})`);
                const bg = getComputedStyle(el).backgroundColor;
                if (outer && !outer.classList.contains('vp-float') && getComputedStyle(outer).backgroundColor === bg && !/^rgba\(0, 0, 0, 0\)$/.test(bg)) el.classList.add('vp-nested');
            });
        });
        onDom(function commentsSheet() {
            for (const input of commentInputs()) {
                let sheet = null;
                for (let p = input.parentElement; p && p !== document.body; p = p.parentElement) {
                    if (getComputedStyle(p).position === 'fixed') sheet = p;
                }
                if (sheet && !sheet.classList.contains('vp-comments-sheet')) sheet.classList.add('vp-comments-sheet');
            }
        });

        onDom(function clampFade() {
            document.querySelectorAll('.vp-clamp').forEach(el => {
                const b = el.nextElementSibling;
                if (!b || b.tagName !== 'BUTTON' || !/Читать далее/i.test(b.textContent)) el.classList.remove('vp-clamp');
            });
            document.querySelectorAll('.' + SELECTORS.post + ' button').forEach(b => {
                if (!/^\s*Читать далее\s*$/i.test(b.textContent)) return;
                const box = b.previousElementSibling;
                if (box && !box.classList.contains('vp-clamp')) box.classList.add('vp-clamp');
            });
        });

        document.addEventListener('pointerdown', e => {
            if (e.pointerType !== 'touch') return;
            const b = e.target.closest && e.target.closest('.vp-post-action');
            if (!b) return;
            b.classList.add('vp-pressed');
            const off = () => { setTimeout(() => b.classList.remove('vp-pressed'), 180); removeEventListener('pointerup', off, true); removeEventListener('pointercancel', off, true); };
            addEventListener('pointerup', off, true);
            addEventListener('pointercancel', off, true);
        }, true);

        let backdropSel = '', backdropSheets = -1;
        function siteBackdropSelector() {
            if (document.styleSheets.length === backdropSheets) return backdropSel;
            backdropSheets = document.styleSheets.length;
            const found = new Set();
            const zero = v => v === '0px' || v === '0';
            for (const sh of document.styleSheets) {
                let rules;
                try { rules = sh.cssRules; } catch (e) { continue; }
                for (const r of rules || []) {
                    const st = r.style;
                    if (!st || !r.selectorText || /vpi?-/.test(r.selectorText)) continue;
                    if (st.position !== 'fixed' || !(parseInt(st.zIndex) >= 100)) continue;
                    const full = zero(st.inset) || (zero(st.top) && zero(st.left) && (zero(st.right) || /^100(%|vw)$/.test(st.width))
                        && (zero(st.bottom) || /^100(%|vh|dvh)$/.test(st.height)));
                    if (full) r.selectorText.split(',').forEach(x => { if (/^\.[\w-]+$/.test(x.trim())) found.add(x.trim()); });
                }
            }
            backdropSel = [...found].join(', ');
            return backdropSel;
        }
        const shown = el => { if (!el.isConnected || !el.getClientRects().length) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.pointerEvents !== 'none'; };
        function siteOverlay() {
            const sel = siteBackdropSelector();
            const list = [...document.querySelectorAll(['[data-comments-modal]', '.vp-comments-sheet', '[role="dialog"]:not(.vp-modal)',
                '[aria-modal="true"]:not(.vp-modal)', sel].filter(Boolean).join(', '))].filter(e => !e.closest('.vp-msg-backdrop, .settings-dropdown'));
            for (let i = list.length - 1; i >= 0; i--) if (shown(list[i]) && list[i].getBoundingClientRect().height > innerHeight * 0.5) return list[i];
            return null;
        }
        let overlayEl = null, overlayHist = false;
        function closeSiteOverlay(el) {
            const gone = () => !shown(el) || siteOverlay() !== el;
            const esc = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true });
            (document.activeElement || document.body).dispatchEvent(esc);
            setTimeout(() => {
                if (gone()) return;
                const back = (sel => sel && el.matches(sel) ? el : el.closest(sel || 'body'))(siteBackdropSelector()) || el;
                for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'])
                    back.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window }));
                setTimeout(() => {
                    if (gone()) return;
                    const x = el.querySelector('button[aria-label*="акры" i], button[aria-label*="close" i], [aria-label*="Назад" i], button[title*="акры" i]');
                    if (x) x.click();
                }, 90);
            }, 90);
        }
        window.addEventListener('popstate', () => {
            if (!overlayHist) return;
            if (history.state && history.state.vpOverlay) return;
            overlayHist = false;
            const el = overlayEl;
            overlayEl = null;
            if (el && shown(el)) closeSiteOverlay(el);
        });
        onDom(function overlayBack() {
            const el = siteOverlay();
            if (el && el !== overlayEl) {
                overlayEl = el;
                if (!overlayHist) {
                    history.pushState(Object.assign({}, history.state, { vpOverlay: true }), '', location.href);
                    overlayHist = true;
                }
            } else if (!el && overlayEl) {
                overlayEl = null;
                if (overlayHist) {
                    overlayHist = false;
                    if (history.state && history.state.vpOverlay) history.back();
                }
            }
        });

        let lastPath = location.pathname;
        function pageColumn() {
            let el = document.querySelector('.' + [SELECTORS.feedBar, SELECTORS.tabs, SELECTORS.banner, SELECTORS.post, SELECTORS.notification].join(', .'));
            if (!el) return null;
            const side = '.' + SELECTORS.sidebar + ', .' + SELECTORS.sidebarRight + ', .' + SELECTORS.nav;
            while (el.parentElement && el.parentElement !== document.body && el.parentElement.getBoundingClientRect().width < 760
                && !el.parentElement.querySelector(side)) el = el.parentElement;
            return el.querySelector(side) ? null : el;
        }
        onDom(function pageTransition() {
            if (location.pathname === lastPath) return;
            lastPath = location.pathname;
            if (calm) return;
            const col = pageColumn();
            if (!col) return;
            const lite = document.documentElement.classList.contains('vp-glass-lite');
            col.animate([
                { opacity: 0, transform: 'translateY(14px)', filter: lite ? 'none' : 'blur(5px)' },
                { opacity: 1, transform: 'none', filter: 'none' }
            ], { duration: 340, easing: 'cubic-bezier(.2, .8, .2, 1)' });
        });

        function navIsRow(nav) {
            const links = nav.querySelectorAll(':scope > .' + SELECTORS.navLink);
            return links.length > 1 && Math.abs(links[0].offsetTop - links[1].offsetTop) < 4;
        }
        let blob = null, blobAt = null;
        function moveNavBlob() {
            const nav = siteEl('nav');
            const active = nav && nav.querySelector(':scope > .' + SELECTORS.navLink + '.vp-active');
            if (!nav) return;
            if (!blob || !nav.contains(blob)) {
                const was = blob && blobAt && blob.style.opacity === '1' ? blobAt : null;
                blob = document.createElement('div');
                blob.className = 'vp-nav-blob';
                nav.classList.add('vp-nav-has-blob');
                nav.prepend(blob);
                blobAt = null;
                if (was && !calm) {
                    blob.style.transition = 'none';
                    if (navIsRow(nav)) rowPlace(was); else Object.assign(blob.style, blobBox(was), { borderRadius: blobRadius });
                    blob.style.opacity = '1';
                    blob.offsetWidth;
                    blob.style.transition = '';
                    blobAt = was;
                    if (flow && performance.now() - flow.t0 < BLOB_MS) blobFlow(flow.f, flow.t, flow.t0);
                }
            }
            if (!active) { blob.style.opacity = '0'; return; }
            const row = navIsRow(nav);
            let to = { top: active.offsetTop, left: active.offsetLeft, width: active.offsetWidth, height: active.offsetHeight };
            const siteInd = row && [...nav.children].find(c => c.tagName === 'DIV' && c !== blob);
            if (siteInd && siteInd.offsetHeight) {
                const w = parseFloat(siteInd.style.width) || siteInd.offsetWidth;
                to = { top: siteInd.offsetTop, height: siteInd.offsetHeight, width: w, left: to.left + (to.width - w) / 2 };
            } else if (row) { const extra = Math.round(to.width * .18); to = { ...to, left: to.left - extra / 2, width: to.width + extra }; }
            if (blobAt && to.top === blobAt.top && to.left === blobAt.left && to.width === blobAt.width && to.height === blobAt.height) return;
            const rad = getComputedStyle(active).borderRadius;
            blob.style.borderRadius = blobRadius = !row ? rad
                : siteInd && parseFloat(getComputedStyle(siteInd).borderRadius) ? getComputedStyle(siteInd).borderRadius
                    : `${to.width / 2}px / ${to.height / 2}px`;
            const from = blobAt && !calm && blob.style.opacity === '1' ? blobAt : null;
            if (from && row) {
                blobAnim = null;
                rowPlace(to);
                blobFlow(from, to);
            } else if (from) {
                blobAnim = { from, to, t0: performance.now() };
            } else { blobAnim = null; if (row) rowPlace(to); else Object.assign(blob.style, blobBox(to)); }
            blob.style.opacity = '1';
            blobAt = to;
            if (!row) proxKick();
        }
        let blobAnim = null, flow = null, blobRadius = '';
        const BLOB_MS = 460;
        const blobBox = r => ({ top: r.top + 'px', left: r.left + 'px', width: r.width + 'px', height: r.height + 'px' });
        const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const lerp = (a, b, t) => a + (b - a) * t;
        function blobMid(f, t, row) {
            if (row) {
                const lo = Math.min(f.left, t.left), hi = Math.max(f.left + f.width, t.left + t.width);
                return { left: lo, top: t.top + t.height * .04, height: t.height * .92, width: hi - lo };
            }
            const lo = Math.min(f.top, t.top), hi = Math.max(f.top + f.height, t.top + t.height);
            return { top: lo, left: t.left + t.width * .04, width: t.width * .92, height: hi - lo };
        }
        function blobGeom(an, now) {
            const p = Math.min(1, (now - an.t0) / BLOB_MS), f = an.from, t = an.to, mid = blobMid(f, t, false);
            const [a, b, q] = p < .45 ? [f, mid, easeIO(p / .45)] : [mid, t, easeIO((p - .45) / .55)];
            return { g: { top: lerp(a.top, b.top, q), left: lerp(a.left, b.left, q), width: lerp(a.width, b.width, q), height: lerp(a.height, b.height, q) }, done: p >= 1 };
        }
        function blobParts() {
            if (!blob.firstElementChild) blob.innerHTML = '<i class="vp-bm"></i><i class="vp-bl"></i><i class="vp-br"></i>';
            const [m, l, r] = blob.children;
            return [l, m, r];
        }
        const BM_W = 100;
        function rowTransforms(r, sy = 1) {
            const R = r.height / 2, mid = Math.max(1, r.width - 2 * R + 3);
            return [`translate(${r.left}px, ${r.top}px) scale(1, ${sy})`,
            `translate(${r.left + R - 1.5}px, ${r.top}px) scale(${mid / BM_W}, ${sy})`,
            `translate(${r.left + r.width - R}px, ${r.top}px) scale(1, ${sy})`];
        }
        function rowPlace(r) {
            blob.classList.add('vp-blob-row');
            const tr = rowTransforms(r);
            blobParts().forEach((el, i) => {
                el.style.width = i === 1 ? BM_W + 'px' : r.height / 2 + 'px';
                el.style.height = r.height + 'px';
                el.style.transform = tr[i];
            });
        }
        function blobFlow(f, t, t0 = performance.now()) {
            flow = { f, t, t0 };
            const e = 'cubic-bezier(.65, 0, .35, 1)';
            const m = blobMid(f, t, true);
            const a = rowTransforms({ ...f, top: t.top, height: t.height }), b = rowTransforms({ ...m, top: t.top, height: t.height }, .92), c = rowTransforms(t);
            blobParts().forEach((el, i) => {
                const an = el.animate([{ transform: a[i], easing: e }, { transform: b[i], offset: .45, easing: e }, { transform: c[i] }], { duration: BLOB_MS });
                an.currentTime = Math.max(0, performance.now() - t0);
            });
        }
        onDom(moveNavBlob);
        addEventListener('resize', () => { blobAt = null; moveNavBlob(); });

        const PROX_MAX = 14, PROX_SIGMA = 46;
        let proxY = null, proxRaf = 0, blobK = 0;
        const proxNow = new WeakMap();
        function proxFrame() {
            proxRaf = 0;
            const nav = siteEl('nav');
            if (!nav) return;
            let moving = false, activeK = 0;
            const rows = [];
            nav.querySelectorAll(':scope > .' + SELECTORS.navLink).forEach(a => {
                const r = a.getBoundingClientRect();
                const d = proxY === null ? Infinity : proxY - (r.top + r.height / 2);
                const want = proxY === null ? 0 : Math.exp(-(d * d) / (2 * PROX_SIGMA * PROX_SIGMA));
                const was = proxNow.get(a) || 0;
                const k = Math.abs(want - was) < 0.004 ? want : was + (want - was) * 0.22;
                if (k !== want) moving = true;
                proxNow.set(a, k);
                const x = (k * PROX_MAX).toFixed(2);
                a.style.transform = k ? `translateX(${x}px)` : '';
                a.style.opacity = k && !a.classList.contains('vp-active') ? String((0.5 + 0.5 * k).toFixed(3)) : '';
                const icon = a.querySelector('.' + SELECTORS.navIcon);
                if (icon) icon.style.transform = k ? `scale(${(1 + 0.12 * k).toFixed(3)})` : '';
                if (a.classList.contains('vp-active')) activeK = k;
                rows.push([a.offsetTop + a.offsetHeight / 2, k]);
            });
            if (blob && blobAnim) {
                const { g, done } = blobGeom(blobAnim, performance.now());
                const y = g.top + g.height / 2;
                let k = rows.length ? rows[0][1] : 0;
                for (let i = 0; i < rows.length; i++) {
                    if (y <= rows[i][0]) { k = i ? lerp(rows[i - 1][1], rows[i][1], (y - rows[i - 1][0]) / (rows[i][0] - rows[i - 1][0])) : rows[0][1]; break; }
                    k = rows[i][1];
                }
                blobK = k;
                Object.assign(blob.style, { top: g.top + 'px', left: g.left + 'px', width: g.width + 'px', height: g.height + 'px' });
                blob.style.transform = blobK ? `translateX(${(blobK * PROX_MAX).toFixed(2)}px)` : '';
                if (done) blobAnim = null;
                moving = true;
            } else if (blob) {
                blobK = Math.abs(activeK - blobK) < 0.004 ? activeK : blobK + (activeK - blobK) * 0.22;
                if (blobK !== activeK) moving = true;
                blob.style.transform = blobK ? `translateX(${(blobK * PROX_MAX).toFixed(2)}px)` : '';
            }
            if (moving) proxRaf = requestAnimationFrame(proxFrame);
        }
        function proxKick() { if (!proxRaf) proxRaf = requestAnimationFrame(proxFrame); }
        if (!calm) {
            document.addEventListener('pointermove', e => {
                if (e.pointerType !== 'mouse') return;
                const nav = siteEl('nav');
                if (!nav || navIsRow(nav)) return;
                const r = nav.getBoundingClientRect();
                const inside = e.clientX >= r.left - 24 && e.clientX <= r.right + 40 && e.clientY >= r.top - 60 && e.clientY <= r.bottom + 60;
                const y = inside ? e.clientY : null;
                if (y !== proxY) { proxY = y; proxKick(); }
            }, { passive: true });
            document.addEventListener('pointerleave', () => { proxY = null; proxKick(); });
        }

        let sceneEnabled = GM_getValue('sceneEnabled', true) && !calm;
        document.documentElement.classList.toggle('vp-scene', sceneEnabled);
        const sceneSeen = new Set();
        const sceneIO = new IntersectionObserver(es => es.forEach(e => {
            if (e.isIntersecting) { sceneLive(e.target); sceneKick(); }
            else sceneDrop(e.target);
        }), { rootMargin: '150px 0px' });
        function sceneLive(a) {
            if (sceneSeen.has(a)) return;
            sceneSeen.add(a);
            if (sceneEnabled && !sceneAutoOff) a.style.willChange = 'transform, opacity';
        }
        function sceneDrop(a) {
            sceneSeen.delete(a);
            a._vpSceneKey = null;
            ['--vp-so', '--vp-sy', '--vp-ss', 'will-change'].forEach(v => a.style.removeProperty(v));
        }
        const ease = t => t * t * (3 - 2 * t);
        let sceneQueued = false, sceneAutoOff = false, sceneLast = 0, sceneGaps = [];
        function sceneTurnOff() {
            sceneAutoOff = true;
            document.documentElement.classList.remove('vp-scene');
            [...sceneSeen].forEach(a => { a._vpSceneKey = null;['--vp-so', '--vp-sy', '--vp-ss', 'will-change'].forEach(v => a.style.removeProperty(v)); });
            console.info('[ITD VP] сцена ленты выключена до перезагрузки: устройство не успевает рисовать её при прокрутке');
        }
        function sceneFrame(t) {
            sceneQueued = false;
            if (!sceneEnabled || sceneAutoOff) return;
            if (sceneLast && t - sceneLast < 100) {
                sceneGaps.push(t - sceneLast);
                if (sceneGaps.length >= 40) {
                    const med = sceneGaps.sort((x, y) => x - y)[20];
                    sceneGaps = [];
                    if (med > 28) { sceneLast = 0; return sceneTurnOff(); }
                }
            }
            sceneLast = t;
            const H = innerHeight;
            const rects = [...sceneSeen].map(a => [a, a.getBoundingClientRect()]);
            for (const [a, r] of rects) {
                const out = ease(Math.max(0, Math.min(1, (-r.top - r.height * 0.25) / Math.max(1, r.height * 0.75))));
                const inn = ease(Math.max(0, Math.min(1, (H - r.top) / 220)));
                const so = (1 - 0.45 * out).toFixed(3), ss = (1 - 0.04 * out).toFixed(4), sy = (14 * (1 - inn)).toFixed(1) + 'px';
                const key = so + ss + sy;
                if (a._vpSceneKey === key) continue;
                a._vpSceneKey = key;
                a.style.setProperty('--vp-so', so);
                a.style.setProperty('--vp-ss', ss);
                a.style.setProperty('--vp-sy', sy);
            }
        }
        const sceneKick = () => { if (!sceneQueued) { sceneQueued = true; requestAnimationFrame(sceneFrame); } };
        addEventListener('scroll', sceneKick, { capture: true, passive: true });
        addEventListener('resize', sceneKick);
        onDom(function sceneWatch() {
            document.querySelectorAll('article.' + SELECTORS.post).forEach(a => {
                if (!a._vpScene) {
                    a._vpScene = true;
                    sceneIO.observe(a);
                    const r = a.getBoundingClientRect();
                    if (r.bottom > -150 && r.top < innerHeight + 150) sceneLive(a);
                }
                const slot = a.parentElement;
                if (slot && !slot.classList.contains('vp-post-slot')) slot.classList.add('vp-post-slot');
            });
            sceneKick();
        });

        const feedSaved = new Map();
        let feedLoc = location.pathname + location.search, feedAt = feedPath(), feedJob = null, feedSaveTimer = 0;
        function feedPath() { return location.pathname.includes('/post/') ? null : location.pathname + location.search; }
        function feedPosts() { return [...document.querySelectorAll('article.' + SELECTORS.post)].filter(a => !a.parentElement.closest('article.' + SELECTORS.post)); }
        function feedTop(el) { let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; return y; }
        function feedId(a) {
            try { const id = postIdOf(a); if (id) return id; } catch (e) { }
            for (const at of a.attributes) if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(at.value)) return at.value;
            return null;
        }
        function feedFp(a) {
            const link = a.querySelector('header ' + PROFILE_LINK);
            const text = [...a.querySelectorAll('.' + SELECTORS.postText)].map(t => t.textContent).join(' ').replace(/\s+/g, ' ').trim().slice(0, 120);
            const img = [...a.querySelectorAll('img')].find(i => !i.closest('header'));
            return (link ? link.getAttribute('href') : '') + '|' + text + '|' + (img ? img.getAttribute('src') : '');
        }
        function feedSave(anchor) {
            const k = feedPath();
            if (!k || k !== feedAt || (feedJob && feedJob.k === k)) return;
            const posts = feedPosts();
            const edge = Math.min(120, innerHeight * 0.15);
            const a = anchor || posts.find(p => p.getBoundingClientRect().bottom > edge);
            if (!a) return;
            feedSaved.delete(k);
            feedSaved.set(k, { id: feedId(a), fp: feedFp(a), off: feedTop(a) - scrollY, y: scrollY, idx: posts.indexOf(a) });
            if (feedSaved.size > 30) feedSaved.delete(feedSaved.keys().next().value);
        }
        function feedRestore(k, s) {
            const job = { k }, t0 = performance.now(), stops = ['wheel', 'touchstart', 'keydown', 'mousedown'];
            feedJob = job;
            let count = -1, grewAt = t0, calm = 0;
            const quit = () => { if (feedJob === job) feedJob = null; };
            stops.forEach(t => addEventListener(t, quit, { capture: true, passive: true }));
            const go = y => scrollTo({ top: y, behavior: 'instant' });
            const step = () => {
                const now = performance.now();
                if (feedJob !== job || feedPath() !== k || now - t0 > 15000) {
                    if (feedJob === job) feedJob = null;
                    return stops.forEach(t => removeEventListener(t, quit, true));
                }
                const posts = feedPosts();
                const a = posts.find(p => (s.id && feedId(p) === s.id) || feedFp(p) === s.fp);
                if (a) {
                    const y = Math.max(0, feedTop(a) - s.off);
                    if (Math.abs(scrollY - y) > 1) { go(y); calm = now; } else if (!calm) calm = now;
                    if (now - calm > 800) feedJob = null;
                } else if (posts.length) {
                    if (posts.length !== count) { count = posts.length; grewAt = now; }
                    if (now - grewAt > 3000 || posts.length > s.idx + 60) { go(s.y); feedJob = null; }
                    else go(document.documentElement.scrollHeight);
                }
                setTimeout(step, 100);
            };
            step();
        }
        function feedNav(pop) {
            const was = feedLoc;
            feedLoc = location.pathname + location.search;
            if (feedLoc === was) return;
            feedAt = feedPath();
            feedJob = null;
            const s = feedAt && feedSaved.get(feedAt);
            if (s && (pop || was.includes('/post/'))) feedRestore(feedAt, s);
        }
        addEventListener('popstate', () => feedNav(true));
        document.addEventListener('vp-loc', () => feedNav(false));
        addEventListener('scroll', () => { clearTimeout(feedSaveTimer); feedSaveTimer = setTimeout(() => feedSave(), 150); }, { passive: true });
        document.addEventListener('click', e => {
            const a = e.target.closest && e.target.closest('article.' + SELECTORS.post);
            if (!a) return;
            clearTimeout(feedSaveTimer);
            feedSave(feedPosts().find(p => p.contains(a)));
        }, true);

        let ambientEnabled = GM_getValue('ambientEnabled', true);
        const ambient = new Map();
        const ambientSeen = new Set();
        const ambientIO = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? ambientSeen.add(e.target) : ambientSeen.delete(e.target)));
        function ambientScan() {
            if (!ambientEnabled || calm) return;
            document.querySelectorAll('.' + SELECTORS.post + ' video').forEach(v => {
                if (ambient.has(v)) return;
                const host = v.closest('.' + SELECTORS.post);
                const cv = document.createElement('canvas');
                cv.className = 'vp-ambient';
                cv.width = 48; cv.height = 27;
                host.classList.add('vp-ambient-host');
                const under = host.querySelector(':scope > .itd-blur-container');
                if (under) under.after(cv); else host.prepend(cv);
                ambient.set(v, { cv, g: cv.getContext('2d'), host });
                ambientIO.observe(v);
                v.addEventListener('loadeddata', () => ambientDraw(v));
                v.addEventListener('seeked', () => ambientDraw(v));
            });
        }
        function ambientDraw(v) {
            const a = ambient.get(v);
            if (!a || !v.isConnected || v.readyState < 2) return;
            const vr = v.getBoundingClientRect(), hr = a.host.getBoundingClientRect(), pad = 26;
            Object.assign(a.cv.style, {
                left: (vr.left - hr.left - pad) + 'px', top: (vr.top - hr.top - pad) + 'px',
                width: (vr.width + pad * 2) + 'px', height: (vr.height + pad * 2) + 'px'
            });
            a.g.globalAlpha = a.cv.classList.contains('vp-on') ? .2 : 1;
            try { a.g.drawImage(v, 0, 0, 48, 27); a.cv.classList.add('vp-on'); } catch (e) { }
        }
        setInterval(() => {
            if (!ambientEnabled) return;
            for (const v of ambientSeen) if (!v.paused || !ambient.get(v)?.cv.classList.contains('vp-on')) ambientDraw(v);
            for (const [v, a] of ambient) if (!v.isConnected) { a.cv.remove(); ambient.delete(v); ambientSeen.delete(v); }
        }, 150);
        function applyAmbient() {
            if (ambientEnabled) ambientScan();
            else { for (const [v, a] of ambient) { a.cv.remove(); ambientIO.unobserve(v); } ambient.clear(); ambientSeen.clear(); }
        }
        onDom(ambientScan);

        const tabObs = new MutationObserver(muts => muts.forEach(m => liquidTab(m.target, m.oldValue || '')));
        const num = (str, re) => { const m = str.match(re); return m ? parseFloat(m[1]) : null; };
        function liquidTab(ind, old) {
            const now = ind.getAttribute('style') || '';
            const x0 = num(old, /translateX\((-?[\d.]+)px/), x1 = num(now, /translateX\((-?[\d.]+)px/);
            const w0 = num(old, /width:\s*([\d.]+)px/), w1 = num(now, /width:\s*([\d.]+)px/);
            if (x0 === null || x1 === null || w0 === null || w1 === null || x0 === x1) return;
            if (calm) return;
            const lo = Math.min(x0, x1), span = Math.abs(x1 - x0) + Math.max(w0, w1);
            ind.animate([
                { transform: `translateX(${x0}px)`, width: w0 + 'px' },
                { transform: `translateX(${lo}px)`, width: span + 'px', offset: .45 },
                { transform: `translateX(${x1}px)`, width: w1 + 'px' }
            ], { duration: 440, easing: 'cubic-bezier(.65, 0, .25, 1)' });
        }
        onDom(function hookTabs() {
            document.querySelectorAll('.' + SELECTORS.tabs + ' > div:empty').forEach(ind => {
                if (ind._vpTab) return;
                ind._vpTab = true;
                ind.classList.add('vp-tab-ind');
                tabObs.observe(ind, { attributes: true, attributeFilter: ['style'], attributeOldValue: true });
            });
        });

        const hcCache = new Map();
        let hc = null, hcTimer = 0, hcHide = 0, hcUser = null, hcLink = null;
        const loginOf = href => ((href || '').match(/^\/@([\w.]+)/) || [])[1] || null;
        const HC_TTL = 10 * 60 * 1000;
        function hcStored(key) {
            try { const v = JSON.parse(sessionStorage.getItem('vp-hc:' + key) || 'null'); return v && Date.now() - v.at < HC_TTL ? v.d : null; } catch (e) { return null; }
        }
        function hcStore(key, d) {
            try { if (d) sessionStorage.setItem('vp-hc:' + key, JSON.stringify({ at: Date.now(), d })); } catch (e) { }
            return d;
        }
        function hcData(user, waitMs = 0) {
            const key = user.toLowerCase();
            if (siteUsers.has(key)) return Promise.resolve(siteUsers.get(key));
            if (!hcCache.has(key)) {
                const stored = waitMs ? null : hcStored(key);
                hcCache.set(key, stored ? Promise.resolve(stored) : siteUser(user, waitMs).then(site => site || api('/api/users/' + encodeURIComponent(user))
                    .then(r => r.ok ? r.json() : null)
                    .then(j => j && (j.data || j.user || j))).then(d => hcStore(key, d)).catch(() => null));
            }
            return hcCache.get(key);
        }
        const pick = (...vals) => vals.find(v => v !== undefined && v !== null && v !== '');
        function hcBuild(user, d) {
            const el = document.createElement('div');
            el.className = 'vp-hc';
            const banner = pick(d.banner && (d.banner.url || d.banner), d.bannerUrl, d.banner_url, d.cover && (d.cover.url || d.cover));
            const ava = pick(d.avatar && (d.avatar.url || d.avatar), d.avatarUrl, d.emoji, '👤');
            const followers = pick(d.followersCount, d.followers_count, d.stats && d.stats.followers, typeof d.followers === 'number' ? d.followers : undefined);
            const following = pick(d.followingCount, d.following_count, d.stats && d.stats.following, typeof d.following === 'number' ? d.following : undefined);
            const bio = pick(d.bio, d.description, d.about, '');
            const tint = typeof ava === 'string' && !/^https?:|^\//.test(ava) ? emojiTint(ava) : null;
            el.innerHTML = `<div class="vp-hc-banner"></div><div class="vp-hc-body"><div class="vp-hc-ava"></div>
            <div class="vp-hc-name"></div><div class="vp-hc-login"></div><div class="vp-hc-bio"></div><div class="vp-hc-stats"></div></div>`;
            const bn = el.querySelector('.vp-hc-banner');
            if (typeof banner === 'string' && banner) bn.style.backgroundImage = `url("${banner.replace(/"/g, '')}")`;
            else bn.style.background = tint ? `linear-gradient(120deg, rgb(${tint}), rgba(${tint}, .25))` : 'linear-gradient(120deg, var(--vp-accent), transparent)';
            const av = el.querySelector('.vp-hc-ava');
            if (/^https?:|^\//.test(ava)) { const img = document.createElement('img'); img.src = ava; av.appendChild(img); } else av.textContent = ava;
            el.querySelector('.vp-hc-name').textContent = pick(d.displayName, d.display_name, d.name, user);
            el.querySelector('.vp-hc-login').textContent = '@' + pick(d.username, user);
            el.querySelector('.vp-hc-bio').textContent = bio;
            const st = el.querySelector('.vp-hc-stats');
            [[followers, 'подписчиков'], [following, 'подписок']].forEach(([n, label]) => {
                if (n === undefined) return;
                const b = document.createElement('span');
                b.innerHTML = '<b></b> ';
                b.firstChild.textContent = n;
                b.append(label);
                st.appendChild(b);
            });
            el.addEventListener('pointerenter', () => clearTimeout(hcHide));
            el.addEventListener('pointerleave', hcScheduleHide);
            el.addEventListener('click', () => { if (hcLink && hcLink.isConnected) hcLink.click(); hcClose(); });
            return el;
        }
        function hcPlace(el, link) {
            const r = link.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
            let top = r.bottom + 10;
            if (top + h > innerHeight - 8) top = Math.max(8, r.top - h - 10);
            el.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
            el.style.top = top + 'px';
        }
        async function hcShow(link, user) {
            const d = await hcData(user);
            if (!d || !link.isConnected || !link.matches(':hover')) return;
            hcClose();
            hc = hcBuild(user, d);
            hcUser = user; hcLink = link;
            document.body.appendChild(hc);
            hcPlace(hc, link);
        }
        function hcClose() { if (hc) { hc.remove(); hc = null; hcUser = null; } }
        function hcScheduleHide() { clearTimeout(hcHide); hcHide = setTimeout(hcClose, 220); }
        document.addEventListener('pointerover', e => {
            const a = e.target.closest && e.target.closest(PROFILE_LINK);
            if (!a || a.closest('nav, .' + SELECTORS.sidebar + ', .vp-hc, .nick-controls-panel')) return;
            const user = loginOf(a.getAttribute('href'));
            if (!user) return;
            clearTimeout(hcHide);
            if (hc && hcUser === user) return;
            clearTimeout(hcTimer);
            hcTimer = setTimeout(() => hcShow(a, user), 450);
        }, true);
        document.addEventListener('pointerout', e => {
            const a = e.target.closest && e.target.closest(PROFILE_LINK);
            if (a && !a.contains(e.relatedTarget)) { clearTimeout(hcTimer); hcScheduleHide(); }
        }, true);
        addEventListener('scroll', () => { clearTimeout(hcTimer); hcClose(); }, { capture: true, passive: true });
        document.addEventListener('click', e => { if (e.target.closest && e.target.closest(PROFILE_LINK)) { clearTimeout(hcTimer); hcClose(); } }, true);
        onDom(function hcLinkGone() { if (hc && !(hcLink && hcLink.isConnected)) hcClose(); });

        const galIcon = size => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="3" y="3" width="8" height="10" rx="2.5"/><rect x="13" y="3" width="8" height="6" rx="2.5"/><rect x="3" y="15" width="8" height="6" rx="2.5"/><rect x="13" y="11" width="8" height="10" rx="2.5"/></svg>`;
        const GAL_TABS = [['popular', 'Популярное'], ['clan', 'Кланы'], ['following', 'Подписки']];
        const gal = { acts: new Map(), el: null, tab: 'popular', cursor: null, loading: false, done: false, cols: [], heights: [], seen: new Set(), hist: false };
        const galStyle = addCss(`
        .vp-gal { position: fixed; z-index: 30; display: flex; flex-direction: column; box-sizing: border-box; color: var(--text-primary, #fff); }
        .vp-gal-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; overflow: hidden; margin-top: 16px;
            border-radius: 36px; background: var(--block-bg);
            backdrop-filter: var(--vp-glass-filter, none); -webkit-backdrop-filter: var(--vp-glass-filter, none); }
        .vp-gal.vp-card .vp-gal-card { border: 1px solid var(--border-color, rgba(255, 255, 255, .15)); }
        html.vp-light .vp-gal.vp-card .vp-gal-card { box-shadow: 0 16px 48px rgba(0, 0, 0, .12); }
        .vp-gal-top { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }
        .vp-gal-top > .vp-gal-tabs { flex: 1 1 auto; min-width: 0; }
        .vp-gal-vol { position: relative; flex: 0 0 auto; }
        .vp-gal-vol-b { width: 45px; height: 45px; border: 0; border-radius: 9999px; padding: 0; margin: 0; display: grid; place-items: center; cursor: pointer;
            color: var(--text-primary, #fff); background: var(--glass-bg, rgba(35, 35, 35, .5)); transition: background-color .15s; }
        .vp-gal-vol-b:hover { background: rgba(255, 255, 255, .12); }
        html.vp-light .vp-gal-vol-b { background: rgba(0, 0, 0, .06); color: var(--text-primary, #141414); }
        html.vp-light .vp-gal-vol-b:hover { background: rgba(0, 0, 0, .1); }
        .vp-gal-vol-b svg { width: 21px; height: 21px; }
        .vp-gal-vol-p { position: absolute; top: calc(100% + 8px); right: 0; z-index: 6; display: flex; align-items: center; gap: 10px; padding: 11px 16px;
            border-radius: 9999px; background: var(--block-bg); border: 1px solid var(--border-color, rgba(255, 255, 255, .15));
            backdrop-filter: var(--vp-glass-filter, blur(14px)); -webkit-backdrop-filter: var(--vp-glass-filter, blur(14px)); box-shadow: 0 12px 32px rgba(0, 0, 0, .35);
            opacity: 0; visibility: hidden; transform: translateY(-4px); transition: opacity .15s, transform .15s, visibility 0s .15s; }
        html.vp-light .vp-gal-vol-p { background: #fff; box-shadow: 0 12px 32px rgba(0, 0, 0, .14); }
        .vp-gal-vol-p::before { content: ''; position: absolute; left: 0; right: 0; top: -10px; height: 10px; }
        .vp-gal-vol:hover .vp-gal-vol-p, .vp-gal-vol:focus-within .vp-gal-vol-p { opacity: 1; visibility: visible; transform: none; transition: opacity .15s, transform .15s; }
        .vp-gal-vol-p input { width: 150px; height: 4px; margin: 0; cursor: pointer; appearance: none; -webkit-appearance: none; border-radius: 9999px;
            background: linear-gradient(to right, var(--vp-accent) var(--vp-vol, 100%), rgba(128, 128, 128, .35) var(--vp-vol, 100%)); }
        .vp-gal-vol-p input::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--vp-accent); box-shadow: 0 1px 4px rgba(0, 0, 0, .4); }
        .vp-gal-vol-p input::-moz-range-thumb { width: 14px; height: 14px; border: 0; border-radius: 50%; background: var(--vp-accent); box-shadow: 0 1px 4px rgba(0, 0, 0, .4); }
        .vp-gal-vol-p span { min-width: 36px; text-align: right; font-size: 13px; font-variant-numeric: tabular-nums; color: var(--text-secondary); }
        .vp-gal.vp-card .vp-gal-logo { display: none !important; }
        .vp-gal-logo { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
        .vp-gal:not(.vp-card) .vp-gal-top { margin: 9px 12px 0 6px; }
        .vp-gal:not(.vp-card) .vp-gal-card { margin-top: 9px; border-radius: 36px 36px 0 0; }
        html.vp-gal-open .vp-gal-hidden, html.vp-msgs-open .vp-gal-hidden { visibility: hidden !important; }
        iframe.vp-page-frame { background: transparent !important; color-scheme: normal; }
        html.vp-gal-open iframe.vp-page-frame, html.vp-msgs-open iframe.vp-page-frame { visibility: hidden !important; }
        .vp-gal-body { padding: 12px 12px var(--vp-gal-pb, 24px) !important; }
        html.vp-gal-open .vp-gal-navwrap { z-index: 40 !important; }
        html.vp-gal-open .vp-nav-link.vp-site-cur { color: var(--vp-off-c) !important; opacity: var(--vp-off-o) !important; background-color: var(--vp-off-b) !important; }
        html.vp-gal-open .vp-gal-nav { color: var(--vp-on-c) !important; opacity: var(--vp-on-o) !important; background-color: var(--vp-on-b) !important; }
        .vp-gal-tabs { position: relative; display: flex; flex: 0 0 auto; box-sizing: border-box; height: 45px; padding: 4px; margin: 0; border-radius: 9999px;
            background: var(--glass-bg, rgba(35, 35, 35, .5)); }
        html.vp-light .vp-gal-tabs { background: rgba(0, 0, 0, .06); }
        .vp-gal-ind { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc((100% - 8px) / 3); border-radius: 9999px; pointer-events: none;
            background: rgba(255, 255, 255, .08); box-shadow: inset 0 0 0 1px var(--vp-accent), 0 0 14px -4px var(--vp-accent);
            transition: transform .3s cubic-bezier(.2,.8,.2,1); }
        html.vp-light .vp-gal-ind { background: #fff; }
        .vp-gal-tab { position: relative; flex: 1 1 0; min-width: 0; border: 0; border-radius: 9999px; padding: 8px 0; margin: 0;
            font: inherit; font-size: 14px; font-weight: 500; line-height: 21px; cursor: pointer; background: transparent;
            color: rgba(255, 255, 255, .5); white-space: nowrap; transition: color .2s; }
        html.vp-light .vp-gal-tab { color: rgba(0, 0, 0, .5); }
        .vp-gal-tab.vp-on { color: var(--text-primary, #f5f5f5); }
        html.vp-gal-open .itd-scroll-top-btn, html.vp-msgs-open .itd-scroll-top-btn { display: none !important; }
        html.vp-gal-open .vp-sidebar-right > :last-child { visibility: hidden !important; }
        .vp-gal-body { flex: 1 1 auto; overflow-y: auto; overscroll-behavior: contain; padding: 0 8px 24px; }
        .vp-gal-grid { display: flex; gap: 8px; align-items: flex-start; max-width: 1400px; margin: 0 auto; }
        .vp-gal-col { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
        .vp-gal-tile { position: relative; border-radius: 16px; overflow: hidden; background: rgba(128,128,128,.15); cursor: pointer; }
        .vp-gal-strip { display: flex; width: 100%; height: 100%; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory;
            scrollbar-width: none; overscroll-behavior-x: contain; }
        .vp-gal-strip::-webkit-scrollbar { display: none; }
        .vp-gal-slide { position: relative; flex: 0 0 100%; height: 100%; scroll-snap-align: start; }
        .vp-gal-slide.vp-wait, .vp-gal-slide.vp-fail, .vp-media-wait, .vp-media-fail { background: rgba(128,128,128,.14); }
        .vp-gal-slide.vp-wait > img, .vp-gal-slide.vp-fail > img, .vp-media-wait > img, .vp-media-fail > img { opacity: 0; }
        .vp-media-rel { position: relative; }
        .vp-gal-slide.vp-wait::before, .vp-media-wait::before { content: ''; position: absolute; inset: 0; pointer-events: none;
            background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,.09) 50%, transparent 70%) 0 0 / 250% 100%;
            animation: vpGalShine 1.4s linear infinite; }
        .vp-gal-slide.vp-wait::after, .vp-media-wait::after { content: ''; position: absolute; left: 50%; top: 50%; width: 26px; height: 26px; margin: -13px 0 0 -13px;
            border-radius: 50%; border: 2.5px solid rgba(255,255,255,.18); border-top-color: rgba(255,255,255,.75);
            animation: vpGalSpin .8s linear infinite; pointer-events: none; }
        .vp-gal-slide.vp-fail::after, .vp-media-fail::after { content: 'не загрузилось — нажми'; position: absolute; left: 0; right: 0; top: 50%; margin-top: -4px;
            padding-top: 38px; text-align: center; font-size: 12px; color: var(--text-secondary); pointer-events: none;
            background: no-repeat center top / 30px 30px url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238a8a8a' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='16' rx='3'/%3E%3Cpath d='m3 16 5-5 4 4'/%3E%3Cpath d='m14 13 2-2 5 5'/%3E%3Cpath d='M3 3l18 18'/%3E%3C/svg%3E");
            transform: translateY(-50%); }
        .vp-gal-slide.vp-fail, .vp-media-fail { cursor: pointer; }
        @keyframes vpGalShine { from { background-position: 125% 0; } to { background-position: -125% 0; } }
        @keyframes vpGalSpin { to { transform: rotate(360deg); } }
        .vp-gal-slide > img, .vp-gal-slide > video { display: block; width: 100%; height: 100%; object-fit: contain; background: #000; }
        .vp-gal-count { position: absolute; right: 8px; top: 8px; padding: 3px 8px; border-radius: 10px; font-size: 12px; font-weight: 600;
            color: #fff; pointer-events: none; background: rgba(0,0,0,.45); backdrop-filter: blur(10px) saturate(1.4); -webkit-backdrop-filter: blur(10px) saturate(1.4);
            box-shadow: 0 0 0 1px rgba(255,255,255,.12) inset; }
        .vp-gal-dots { position: absolute; left: 50%; top: 0; transform: translateX(-50%); display: flex; gap: 5px; padding: 6px 11px 7px;
            border-radius: 0 0 12px 12px; pointer-events: none; background: rgba(0,0,0,.45); backdrop-filter: blur(10px) saturate(1.4);
            -webkit-backdrop-filter: blur(10px) saturate(1.4);
            box-shadow: inset 0 -1px 0 rgba(255,255,255,.12), inset 1px 0 0 rgba(255,255,255,.12), inset -1px 0 0 rgba(255,255,255,.12); }
        .vp-gal-dots i { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.45); }
        .vp-gal-dots i.vp-on { background: #fff; }
        .vp-gal-arrow { position: absolute; top: 50%; width: 44px; height: 44px; margin-top: -22px; border: 0; border-radius: 50%; padding: 0;
            display: inline-flex; align-items: center; justify-content: center; cursor: pointer; -webkit-tap-highlight-color: transparent;
            color: #fff; opacity: 0; transition: opacity .15s, transform .12s ease;
            background: rgba(0,0,0,.45); backdrop-filter: blur(10px) saturate(1.4); -webkit-backdrop-filter: blur(10px) saturate(1.4);
            box-shadow: 0 0 0 1px rgba(255,255,255,.12) inset; }
        .vp-gal-arrow.vp-prev { left: 8px; } .vp-gal-arrow.vp-next { right: 8px; }
        .vp-gal-arrow svg { stroke-width: 2.2; }
        .vp-gal-arrow:active { transform: scale(.9); }
        @media (hover: hover) and (pointer: fine) { .vp-gal-tile:hover .vp-gal-arrow { opacity: 1; } }
        .vp-gal-tile .vp-gal-arrow.vp-edge { opacity: 0; cursor: default; }
        @media not ((hover: hover) and (pointer: fine)) { .vp-gal-arrow { opacity: 1; } }
        .vp-gal-slide > img { pointer-events: none; -webkit-user-drag: none; user-select: none; }
        .vp-gal-tile.vp-ctx .vp-gal-slide > img { pointer-events: auto; }
        .vp-gal-acts { position: absolute; left: 8px; bottom: 8px; display: flex; gap: 2px; padding: 2px; border-radius: 999px;
            background: rgba(0,0,0,.45); backdrop-filter: blur(10px) saturate(1.4); -webkit-backdrop-filter: blur(10px) saturate(1.4);
            box-shadow: 0 0 0 1px rgba(255,255,255,.12) inset; transition: opacity .15s; }
        .vp-gal-act { width: 38px; height: 38px; padding: 0; border: 0; border-radius: 50%; background: none; color: #fff; cursor: pointer;
            display: inline-flex; align-items: center; justify-content: center; -webkit-tap-highlight-color: transparent;
            transition: transform .12s ease, color .2s, background .2s; }
        @media (hover: hover) and (pointer: fine) { .vp-gal-act:hover { background: rgba(255,255,255,.14); } }
        .vp-gal-acts.vp-gal-acts-r { left: auto; right: 8px; }
        .vp-gal-acts-r:empty { display: none; }
        .vp-gal-tile { container-type: inline-size; }
        @container (max-width: 250px) {
            .vp-gal-acts { left: 6px; bottom: 6px; padding: 1px; gap: 0; }
            .vp-gal-acts.vp-gal-acts-r { right: 6px; }
            .vp-gal-act { width: 30px; height: 30px; }
            .vp-gal-act svg { width: 18px; height: 18px; }
            .vp-gal-arrow { width: 34px; height: 34px; margin-top: -17px; }
            .vp-gal-arrow svg { width: 22px; height: 22px; }
        }
        @container (max-width: 175px) { .vp-gal-acts.vp-gal-acts-r { display: none; } }
        .vp-gal-act:active { transform: scale(.86); }
        .vp-gal-act:focus-visible { outline: 2px solid var(--vp-accent); outline-offset: -4px; }
        .vp-gal-act.vp-on[data-act="like"] svg { animation: vpGalPop .35s cubic-bezier(.3, 1.6, .5, 1); }
        @keyframes vpGalPop { 40% { transform: scale(1.35); } }
        .vp-gal-act svg { width: 22px; height: 22px; }
        .vp-gal-act.vp-on { color: var(--accent-liked, #f91880); }
        .vp-gal-act.vp-on[data-act="like"] path { fill: currentColor; }
        .vp-gal-act.vp-busy { opacity: .5; pointer-events: none; }
        @media (hover: hover) and (pointer: fine) {
            .vp-gal-acts { opacity: 0; }
            .vp-gal-tile:hover .vp-gal-acts, .vp-gal-acts:has(:focus-visible) { opacity: 1; }
        }
        .vp-gal-badge { position: absolute; left: 8px; top: 8px; padding: 3px 8px; border-radius: 10px; font-size: 12px; font-weight: 600;
            color: #fff; pointer-events: none; background: rgba(0,0,0,.45); backdrop-filter: blur(10px) saturate(1.4); -webkit-backdrop-filter: blur(10px) saturate(1.4);
            box-shadow: 0 0 0 1px rgba(255,255,255,.12) inset; }
        .vp-gal-more { text-align: center; padding: 18px; color: var(--text-secondary); font-size: 14px; }
        .vp-gal-btn svg { pointer-events: none; }
        @media (min-width: ${PHONE_MAX + 1}px) { .vp-gal-btn { display: none !important; } }
        @media (max-width: ${PHONE_MAX}px) { .vp-gal-nav { display: none !important; } }
    `);
        const galColsCount = () => {
            const g = gal.el && gal.el.querySelector('.vp-gal-grid'), w = g ? g.clientWidth : 0;
            if (!w) return innerWidth >= 1100 ? 4 : innerWidth >= 700 ? 3 : 2;
            return Math.max(2, Math.min(4, Math.floor((w + 8) / 218)));
        };
        function galVol() { const v = +GM_getValue('galVol', 1); return isFinite(v) ? Math.max(0, Math.min(1, v)) : 1; }
        function galVolIcon(v) {
            const waves = v <= 0 ? '<path d="M16 9l5 6M21 9l-5 6"/>' : v < .5 ? '<path d="M15.5 9.5a3.5 3.5 0 0 1 0 5"/>' : '<path d="M15.5 9.5a3.5 3.5 0 0 1 0 5"/><path d="M18.5 6.5a7.5 7.5 0 0 1 0 11"/>';
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/>${waves}</svg>`;
        }
        function galVolUi(top) {
            if (!matchMedia('(hover: hover) and (pointer: fine)').matches || top.querySelector('.vp-gal-vol')) return;
            const w = document.createElement('div');
            w.className = 'vp-gal-vol';
            w.innerHTML = '<button type="button" class="vp-gal-vol-b" aria-label="Громкость видео" title="Громкость видео: звук — при наведении на видео"></button><div class="vp-gal-vol-p"><input type="range" min="0" max="100" step="1" aria-label="Громкость видео"><span></span></div>';
            const b = w.querySelector('button'), r = w.querySelector('input'), lab = w.querySelector('span');
            const paint = () => { const v = galVol(); r.value = Math.round(v * 100); lab.textContent = r.value + '%'; r.style.setProperty('--vp-vol', r.value + '%'); b.innerHTML = galVolIcon(v); };
            const set = v => {
                v = Math.round(Math.max(0, Math.min(1, v)) * 100) / 100;
                GM_setValue('galVol', v);
                if (v > 0) GM_setValue('galVolLast', v);
                paint();
                document.querySelectorAll('.vp-gal video').forEach(x => { x.volume = v; if (!v && x._vpHoverSound) { x.muted = true; x._vpHoverSound = false; } });
            };
            r.addEventListener('input', () => set(r.value / 100));
            b.addEventListener('click', () => set(galVol() > 0 ? 0 : +GM_getValue('galVolLast', 1) || 1));
            w.addEventListener('wheel', e => { e.preventDefault(); set(galVol() - Math.sign(e.deltaY) * .05); }, { passive: false });
            paint();
            top.appendChild(w);
        }
        const galVideoIO = new IntersectionObserver(es => es.forEach(e => {
            const v = e.target;
            if (e.isIntersecting && e.intersectionRatio > .5) v.play().catch(() => { }); else v.pause();
        }), { threshold: [0, .5, 1] });
        function galLayout() {
            const grid = gal.el.querySelector('.vp-gal-grid');
            const tiles = gal.cols.flatMap(c => [...c.children]).sort((a, b) => a._vpN - b._vpN);
            grid.replaceChildren();
            gal.cols = Array.from({ length: galColsCount() }, () => { const c = document.createElement('div'); c.className = 'vp-gal-col'; grid.appendChild(c); return c; });
            gal.heights = gal.cols.map(() => 0);
            tiles.forEach(galPlace);
        }
        function galPlace(tile) {
            let k = 0;
            gal.heights.forEach((h, i) => { if (h < gal.heights[k]) k = i; });
            gal.cols[k].appendChild(tile);
            gal.heights[k] += tile._vpRatio + .05;
        }
        const GAL_ICONS = {
            like: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 4.6a3.7 3.7 0 0 0-5.2-.9C3.2 5 2.4 7.6 3.6 10.2 4.8 12.7 10 17 10 17s5.3-4.3 6.5-6.8c1.2-2.6 0-5.2-1.6-6.5s-4-.8-4.9.9"/>',
            comment: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 17a7 7 0 1 0-6.2-3.7L3 17l3.7-.8a7 7 0 0 0 3.3.8"/>',
            repost: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 9V8a3 3 0 0 1 3-3h9m-3 3 3-3-3-3M16 11v1a3 3 0 0 1-3 3H4m3-3-3 3 3 3"/>',
            link: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-1 1M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1-1"/>',
            done: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="m4.5 10.5 3.5 3.5 7.5-8"/>',
            copy: '<g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect x="7" y="7" width="10" height="10" rx="2.5"/><path d="M13 4.7A2 2 0 0 0 11.2 3.5H5.5a2 2 0 0 0-2 2v5.7A2 2 0 0 0 4.7 13"/></g>'
        };
        const galIsVideo = att => att.type === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(att.url || '');
        function galCopyImage(url) {
            if (!url || typeof ClipboardItem !== 'function' || !navigator.clipboard || !navigator.clipboard.write || typeof GM_xmlhttpRequest !== 'function')
                return Promise.resolve(false);
            const png = new Promise((ok, fail) => GM_xmlhttpRequest({
                method: 'GET', url, responseType: 'blob', timeout: 30000,
                onload: async r => {
                    try {
                        if (r.status !== 200 || !r.response) throw new Error('картинка: ' + r.status);
                        const bmp = await createImageBitmap(r.response);
                        const c = document.createElement('canvas');
                        c.width = bmp.width; c.height = bmp.height;
                        c.getContext('2d').drawImage(bmp, 0, 0);
                        bmp.close && bmp.close();
                        c.toBlob(b => b ? ok(b) : fail(new Error('в PNG не перегналась')), 'image/png');
                    } catch (e) { fail(e); }
                },
                onerror: () => fail(new Error('картинка: сеть')), ontimeout: () => fail(new Error('картинка: долго'))
            }));
            try {
                return navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
                    .then(() => true, e => { logErr('галерея: скопировать картинку', e); return false; });
            } catch (e) { logErr('галерея: скопировать картинку', e); return Promise.resolve(false); }
        }
        function galOpenPost(post) {
            const user = post.author && post.author.username;
            if (!user) return;
            closeGallery(true);
            history.pushState({}, '', `/@${user}/post/${post.id}`);
            dispatchEvent(new PopStateEvent('popstate'));
        }
        function galActions(post) {
            const row = document.createElement('div');
            row.className = 'vp-gal-acts';
            const btn = (act, title, on) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'vp-gal-act' + (on ? ' vp-on' : '');
                b.dataset.act = act;
                b.title = title;
                b.innerHTML = `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">${GAL_ICONS[act]}</svg>`;
                row.appendChild(b);
                return b;
            };
            if (!gal.acts.has(post.id)) gal.acts.set(post.id, { like: post.isLiked === true, repost: post.isReposted === true });
            const state = gal.acts.get(post.id);
            row.dataset.post = post.id;
            const like = btn('like', 'Нравится', state.like);
            const comment = btn('comment', 'Комментарии');
            const repost = btn('repost', 'Репост', state.repost);
            const paint = act => document.querySelectorAll(`.vp-gal-acts[data-post="${post.id}"] .vp-gal-act[data-act="${act}"]`)
                .forEach(b => b.classList.toggle('vp-on', state[act]));
            const busy = (act, on) => document.querySelectorAll(`.vp-gal-acts[data-post="${post.id}"] .vp-gal-act[data-act="${act}"]`)
                .forEach(b => b.classList.toggle('vp-busy', on));
            const toggle = async (b, path, confirmText) => {
                const act = b.dataset.act, on = state[act];
                if (state[act + 'Busy']) return;
                if (confirmText && !on && !confirm(confirmText)) return;
                state[act + 'Busy'] = true; busy(act, true);
                state[act] = !on; paint(act);
                try {
                    const res = await api(path, on ? { method: 'DELETE' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                    if (!res.ok) throw new Error(path + ': ' + res.status);
                } catch (e) {
                    state[act] = on; paint(act);
                    logErr('галерея: ' + act, e);
                } finally { state[act + 'Busy'] = false; busy(act, false); }
            };
            like.addEventListener('click', e => { e.stopPropagation(); toggle(like, `/api/posts/${post.id}/like`); });
            repost.addEventListener('click', e => { e.stopPropagation(); toggle(repost, `/api/posts/${post.id}/repost`, 'Сделать репост этого поста?'); });
            comment.addEventListener('click', e => { e.stopPropagation(); galOpenPost(post); });
            const right = document.createElement('div');
            right.className = 'vp-gal-acts vp-gal-acts-r';
            const copyBtn = (act, title, run) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'vp-gal-act';
                b.dataset.act = act;
                b.title = title;
                const icon = k => { b.innerHTML = `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">${GAL_ICONS[k]}</svg>`; };
                icon(act);
                b.addEventListener('click', e => {
                    e.stopPropagation();
                    if (b.classList.contains('vp-busy')) return;
                    b.classList.add('vp-busy');
                    run(b).then(ok => {
                        b.classList.remove('vp-busy');
                        icon(ok ? 'done' : act);
                        b.title = ok ? 'Скопировано' : 'Не вышло скопировать';
                        clearTimeout(b._vpT);
                        b._vpT = setTimeout(() => { icon(act); b.title = title; }, 1400);
                    });
                });
                right.appendChild(b);
            };
            if ((post.attachments || []).some(att => att && att.url && !galIsVideo(att)))
                copyBtn('copy', 'Скопировать картинку', b => {
                    const strip = b.closest('.vp-gal-tile').querySelector('.vp-gal-strip');
                    const slide = strip.children[Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth))] || strip.children[0];
                    const img = slide && slide.querySelector('img');
                    return img ? galCopyImage(img.dataset.src) : Promise.resolve(false);
                });
            const user = post.author && post.author.username;
            if (user) copyBtn('link', 'Скопировать ссылку', () => copyText(`${location.origin}/@${user}/post/${post.id}`));
            const out = document.createDocumentFragment();
            out.append(row, right);
            return out;
        }
        document.addEventListener('vp-post-act', e => {
            const { id, act, on } = e.detail || {};
            const st = gal.acts.get(id), root = gal.el || gal.kept;
            if (!st || st[act + 'Busy'] || !root) return;
            st[act] = on;
            root.querySelectorAll(`.vp-gal-acts[data-post="${id}"] .vp-gal-act[data-act="${act}"]`).forEach(b => b.classList.toggle('vp-on', on));
        });
        let galN = 0;
        function galMedia(att) {
            if (galIsVideo(att)) {
                const v = document.createElement('video');
                Object.assign(v, { src: att.url, muted: true, loop: true, playsInline: true, preload: 'metadata' });
                v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
                const poster = pick(att.thumbnailUrl, att.thumbnail, att.previewUrl, att.preview);
                if (poster) v.poster = poster.url || poster;
                galVideoIO.observe(v);
                return v;
            }
            const img = document.createElement('img');
            img.decoding = 'async'; img.alt = '';
            img.dataset.src = att.url;
            galImgObs().observe(img);
            return img;
        }
        let galImgIO = null;
        function galImgObs() {
            const body = gal.el && gal.el.querySelector('.vp-gal-body');
            if (!galImgIO || galImgIO.root !== body) {
                if (galImgIO) galImgIO.disconnect();
                galImgIO = new IntersectionObserver(es => es.forEach(e => {
                    if (!e.isIntersecting) return;
                    const tile = e.target.closest('.vp-gal-tile');
                    (tile ? [...tile.querySelectorAll('img[data-src]')] : [e.target]).forEach(i => {
                        galImgIO.unobserve(i);
                        if (!i.getAttribute('src')) i.src = i.dataset.src;
                    });
                }), { root: body || null, rootMargin: '1200px 0px' });
            }
            return galImgIO;
        }
        function galTile(post, media) {
            const tile = document.createElement('div');
            tile.className = 'vp-gal-tile';
            const first = media[0], w = +first.width || 1, h = +first.height || 1;
            tile._vpRatio = Math.min(2.2, Math.max(.45, h / w));
            tile._vpN = galN++;
            tile.style.aspectRatio = `1 / ${tile._vpRatio}`;
            const strip = document.createElement('div');
            strip.className = 'vp-gal-strip';
            media.forEach(att => {
                const slide = document.createElement('div');
                slide.className = 'vp-gal-slide vp-wait';
                const m = galMedia(att);
                const done = () => slide.classList.remove('vp-wait', 'vp-fail');
                const fail = () => { slide.classList.remove('vp-wait'); slide.classList.add('vp-fail'); };
                if (m.tagName === 'IMG') { m.addEventListener('load', done); m.addEventListener('error', fail); }
                else { m.addEventListener('loadeddata', done); m.addEventListener('error', fail); if (m.poster) done(); }
                slide.addEventListener('click', e => {
                    if (!slide.classList.contains('vp-fail')) return;
                    e.stopPropagation();
                    slide.classList.replace('vp-fail', 'vp-wait');
                    if (m.tagName === 'IMG') { m.removeAttribute('src'); m.src = m.dataset.src; } else m.load();
                });
                slide.appendChild(m);
                strip.appendChild(slide);
            });
            tile.appendChild(strip);
            const vid = media.find(galIsVideo);
            if (vid && media.length === 1) {
                const badge = document.createElement('span');
                badge.className = 'vp-gal-badge';
                const sec = Math.round(+vid.duration || 0);
                badge.textContent = sec ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : '▶';
                tile.appendChild(badge);
            }
            if (media.length > 1) {
                tile.classList.add('vp-multi');
                const count = document.createElement('span');
                count.className = 'vp-gal-count';
                const dots = document.createElement('div');
                dots.className = 'vp-gal-dots';
                media.forEach(() => dots.appendChild(document.createElement('i')));
                const prev = document.createElement('button'), next = document.createElement('button');
                prev.type = next.type = 'button';
                prev.className = 'vp-gal-arrow vp-prev'; next.className = 'vp-gal-arrow vp-next';
                prev.innerHTML = svgIcon('<path d="m14.5 6-6 6 6 6"/>', 28); next.innerHTML = svgIcon('<path d="m9.5 6 6 6-6 6"/>', 28);
                prev.setAttribute('aria-label', 'Назад'); next.setAttribute('aria-label', 'Дальше');
                tile.append(count, dots, prev, next);
                const at = () => Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth));
                const show = () => {
                    const i = Math.min(media.length - 1, at());
                    count.textContent = `${i + 1}/${media.length}`;
                    [...dots.children].forEach((d, k) => d.classList.toggle('vp-on', k === i));
                    prev.classList.toggle('vp-edge', i === 0); next.classList.toggle('vp-edge', i === media.length - 1);
                    strip._vpI = i;
                    strip.querySelectorAll('video').forEach((v, k) => { if (v.closest('.vp-gal-slide') !== strip.children[i]) v.pause(); });
                };
                strip.addEventListener('scroll', () => requestAnimationFrame(show), { passive: true });
                const go = d => e => { e.stopPropagation(); strip.scrollTo({ left: (at() + d) * strip.clientWidth, behavior: 'smooth' }); };
                strip.addEventListener('pointerdown', e => {
                    if (e.pointerType !== 'mouse' || e.button !== 0) return;
                    const x0 = e.clientX, s0 = strip.scrollLeft, i0 = at();
                    let moved = false;
                    tile._vpDragged = false;
                    const move = ev => {
                        const dx = ev.clientX - x0;
                        if (!moved && Math.abs(dx) < 6) return;
                        if (!moved) { moved = true; tile._vpDragged = true; strip.style.scrollSnapType = 'none'; strip.setPointerCapture(e.pointerId); }
                        strip.scrollLeft = s0 - dx;
                    };
                    const up = ev => {
                        strip.removeEventListener('pointermove', move);
                        strip.removeEventListener('pointerup', up);
                        strip.removeEventListener('pointercancel', up);
                        if (!moved) return;
                        const dx = ev.clientX - x0;
                        const i = Math.max(0, Math.min(media.length - 1, i0 + (dx < -40 ? 1 : dx > 40 ? -1 : 0)));
                        strip.scrollTo({ left: i * strip.clientWidth, behavior: 'smooth' });
                        const snap = () => { strip.style.scrollSnapType = ''; };
                        strip.addEventListener('scrollend', snap, { once: true });
                        setTimeout(snap, 700);
                        setTimeout(() => { tile._vpDragged = false; }, 0);
                    };
                    strip.addEventListener('pointermove', move);
                    strip.addEventListener('pointerup', up);
                    strip.addEventListener('pointercancel', up);
                });
                prev.addEventListener('click', go(-1));
                next.addEventListener('click', go(1));
                show();
            }
            tile.addEventListener('mousedown', e => { if (e.button === 2) tile.classList.add('vp-ctx'); });
            tile.addEventListener('contextmenu', () => setTimeout(() => tile.classList.remove('vp-ctx'), 300));
            tile.addEventListener('mouseleave', () => tile.classList.remove('vp-ctx'));
            tile.appendChild(galActions(post));
            tile.addEventListener('click', () => { if (!tile._vpDragged) galOpenPost(post); });
            return tile;
        }
        function galNeedMore() {
            const b = gal.el && gal.el.querySelector('.vp-gal-body');
            return !!b && b.clientHeight > 0 && b.scrollTop + b.clientHeight > b.scrollHeight - 1200;
        }
        const GAL_CHAIN = 2, GAL_CACHE_MS = 10 * 60 * 1000, GAL_GAP = 700;
        const galCacheKey = tab => 'vpGalCache:' + tab;
        function galCacheRead(tab) {
            try {
                const c = JSON.parse(sessionStorage.getItem(galCacheKey(tab)) || 'null');
                return c && Array.isArray(c.posts) && Date.now() - c.t < GAL_CACHE_MS ? c : null;
            } catch (e) { return null; }
        }
        function galCacheSave() {
            try {
                sessionStorage.setItem(galCacheKey(gal.tab), JSON.stringify({ t: gal.cacheT || Date.now(), cursor: gal.cursor, done: gal.done, posts: gal.cachePosts.slice(-400) }));
            } catch (e) { }
        }
        function galAdd(post) {
            if (!post || gal.seen.has(post.id)) return false;
            gal.seen.add(post.id);
            const media = (post.attachments || []).filter(att => att && att.url && (!att.type || /image|video/.test(att.type))).slice(0, 10);
            if (!media.length) return false;
            galPlace(galTile(post, media));
            const st = gal.acts.get(post.id);
            gal.cachePosts.push({
                id: post.id, author: post.author && { username: post.author.username },
                attachments: media.map(({ type, url, width, height, duration, thumbnailUrl }) => ({ type, url, width, height, duration, thumbnailUrl })),
                isLiked: st ? st.like : post.isLiked, isReposted: st ? st.repost : post.isReposted
            });
            return true;
        }
        async function galLoad(auto) {
            if (!gal.el || gal.loading || gal.done || (gal.waitUntil || 0) > Date.now()) return;
            if (!auto) gal.chain = 0;
            const gap = (gal.lastReq || 0) + GAL_GAP - Date.now();
            if (gap > 0) { clearTimeout(gal.gapT); const g0 = gal.gen; gal.gapT = setTimeout(() => { if (g0 === gal.gen) galLoad(true); }, gap); return; }
            gal.lastReq = Date.now();
            gal.loading = true;
            const gen = gal.gen, tab = gal.tab;
            const more = gal.el.querySelector('.vp-gal-more');
            more.onclick = null;
            more.textContent = 'Загрузка…';
            const url = lim => `/api/posts?limit=${lim}&tab=${tab}` + (gal.cursor ? '&cursor=' + encodeURIComponent(gal.cursor) : '');
            try {
                let res = await api(url(gal.lim || 50));
                if (res.status === 400 && (gal.lim || 50) !== 20) { gal.lim = 20; res = await api(url(20)); }
                if (res.status === 429) { const e = new Error('лента: 429'); e.retry = +res.headers.get('Retry-After') || 0; throw e; }
                if (!res.ok) throw new Error('лента: ' + res.status);
                const j = await res.json(), d = j.data || j;
                if (!gal.el || gen !== gal.gen) return;
                const posts = d.posts || [];
                keepSitePosts(j);
                gal.fails = 0;
                if (!gal.cacheT) gal.cacheT = Date.now();
                posts.forEach(galAdd);
                gal.cursor = (d.pagination && d.pagination.nextCursor) || d.nextCursor || d.cursor || null;
                gal.done = !gal.cursor || !posts.length;
                galCacheSave();
                more.textContent = gal.done ? (gal.seen.size ? 'Это всё' : 'Пусто') : '';
                gal.loading = false;
                galMore();
            } catch (e) {
                if (gen !== gal.gen) return;
                gal.loading = false;
                if (e.retry !== undefined) {
                    gal.fails = (gal.fails || 0) + 1;
                    const wait = Math.min(60, e.retry || 2 ** gal.fails * 2);
                    gal.waitUntil = Date.now() + wait * 1000;
                    more.textContent = `Сайт просит подождать — ещё раз через ${wait} с`;
                    clearTimeout(gal.waitT);
                    gal.waitT = setTimeout(() => { gal.waitUntil = 0; if (gal.el && gen === gal.gen) galLoad(); }, wait * 1000);
                    return;
                }
                logErr('галерея', e);
                more.textContent = 'Не загрузилось — нажми, чтобы повторить';
                more.onclick = () => galLoad();
            }
        }
        function galMore() {
            if (!gal.el || gal.done || gal.loading || !galNeedMore()) return;
            if ((gal.chain = (gal.chain || 0) + 1) < GAL_CHAIN) return galLoad(true);
            const more = gal.el.querySelector('.vp-gal-more');
            more.textContent = 'Показать ещё';
            more.onclick = () => galLoad();
        }
        function galInd() {
            const ind = gal.el && gal.el.querySelector('.vp-gal-ind');
            const i = GAL_TABS.findIndex(([id]) => id === gal.tab);
            if (ind && i >= 0) ind.style.transform = `translateX(${i * 100}%)`;
        }
        function galSwitch(tab, fresh) {
            gal.tab = tab; gal.cursor = null; gal.done = false; gal.seen.clear(); gal.acts.clear(); galN = 0;
            gal.gen = (gal.gen || 0) + 1; gal.loading = false; gal.chain = 0; gal.cachePosts = []; gal.cacheT = 0;
            clearTimeout(gal.waitT); gal.waitUntil = 0;
            gal.el.querySelectorAll('.vp-gal-tab').forEach(b => b.classList.toggle('vp-on', b.dataset.tab === tab));
            galInd();
            gal.cols.forEach(c => c.querySelectorAll('video').forEach(v => galVideoIO.unobserve(v)));
            if (galImgIO) gal.cols.forEach(c => c.querySelectorAll('img[data-src]').forEach(i => galImgIO.unobserve(i)));
            gal.cols = [];
            galLayout();
            gal.el.querySelector('.vp-gal-body').scrollTop = 0;
            const more = gal.el.querySelector('.vp-gal-more');
            more.onclick = null; more.textContent = '';
            const c = !fresh && galCacheRead(tab);
            if (!c) {
                if (fresh) try { sessionStorage.removeItem(galCacheKey(tab)); } catch (e) { }
                return galLoad();
            }
            gal.cacheT = c.t;
            c.posts.forEach(galAdd);
            gal.cursor = c.cursor; gal.done = !!c.done;
            more.textContent = gal.done ? (gal.seen.size ? 'Это всё' : 'Пусто') : '';
            gal.chain = GAL_CHAIN;
            galMore();
        }
        function galPosition() {
            if (!gal.el) return;
            const nav = siteEl('nav');
            const nr = nav && nav.getBoundingClientRect();
            const row = nav && navIsRow(nav) && nr.top > innerHeight / 2;
            requestAnimationFrame(galInd);
            document.querySelectorAll('.vp-gal-navwrap').forEach(w => w.classList.remove('vp-gal-navwrap'));
            if (row) {
                if (nav.parentElement) nav.parentElement.classList.add('vp-gal-navwrap');
                Object.assign(gal.el.style, { left: '0px', right: '0px', top: '0px', bottom: '0px', width: '', paddingBottom: '0px' });
                gal.el.style.setProperty('--vp-gal-pb', Math.max(24, innerHeight - nr.top + BUMP_H + 8) + 'px');
            } else {
                placeSidebar(); placeRail();
                const side = siteEl('sidebar') || (nav && nav.closest('aside')) || nav;
                const sr = side && side.getBoundingClientRect();
                const margin = sr ? Math.max(12, Math.round(sr.left)) : 20;
                const left = sr ? Math.round(sr.right + 24) : 20;
                const railEl = document.querySelector('.vp-rail.vp-on');
                const rightEdge = railEl ? parseFloat(railEl.style.left) - 24 : innerWidth - margin;
                Object.assign(gal.el.style, { left: left + 'px', right: Math.max(12, Math.round(innerWidth - rightEdge)) + 'px', top: '36px', bottom: '12px', width: '', paddingBottom: '0px' });
                gal.el.style.removeProperty('--vp-gal-pb');
            }
            gal.el.classList.toggle('vp-card', !row);
        }
        const OWN_MEDIA = '.vp-gal, .vp-msgs, .vp-bg-media, .vpi-overlay, .vp-call-audio';
        function pauseSiteMedia() {
            document.querySelectorAll('video, audio').forEach(m => { if (!m.paused && !m.closest(OWN_MEDIA)) m.pause(); });
        }
        document.addEventListener('play', e => {
            const m = e.target;
            if ((galOpen || msgsOpen) && m && m.pause && !m.closest(OWN_MEDIA)) m.pause();
        }, true);
        function galHideFeed(on) {
            document.querySelectorAll('.vp-gal-hidden').forEach(e => { if (!on) e.classList.remove('vp-gal-hidden'); });
            if (!on) return;
            pauseSiteMedia();
            const side = '.' + SELECTORS.sidebar + ', .' + SELECTORS.sidebarRight + ', .vp-rail, nav, .vp-gal, .vp-msgs';
            const up = el => {
                let top = el;
                for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
                    if (p.querySelector(side) || p.getBoundingClientRect().width >= innerWidth * 0.72) break;
                    top = p;
                }
                return top;
            };
            document.querySelectorAll('.' + [SELECTORS.tabs, SELECTORS.feedBar, SELECTORS.banner, SELECTORS.post, SELECTORS.notification].join(', .'))
                .forEach(e => { const t = up(e); if (!t.closest('.vp-gal, .vp-msgs, nav')) t.classList.add('vp-gal-hidden'); });
            const win = gal.el || document.querySelector('.vp-msgs.vp-open');
            const root = document.getElementById('root');
            const r = win && win.getBoundingClientRect();
            if (!r || !r.width || !root || performance.now() - (galHideFeed.at || 0) < 400) return;
            galHideFeed.at = performance.now();
            for (const [fx, fy] of [[.5, .25], [.5, .6], [.3, .45], [.7, .45]]) {
                for (const e of document.elementsFromPoint(r.left + r.width * fx, r.top + r.height * fy)) {
                    if (!root.contains(e) || e === root || e.closest('.vp-gal, .vp-msgs, nav, ' + side)) continue;
                    if (e.querySelector(side)) break;
                    if (getComputedStyle(e).position === 'fixed') continue;
                    const t = up(e);
                    if (t !== root && !t.closest('.vp-gal, .vp-msgs, nav')) t.classList.add('vp-gal-hidden');
                    break;
                }
            }
        }
        onDom(function galFeedHidden() { if (gal.el || msgsOpen) galHideFeed(true); });
        function openGallery(fromHistory) {
            if (gal.el) return;
            const msgs = document.querySelector('.vp-msgs.vp-open');
            if (msgs && msgs.close) msgs.close(true);
            const kept = gal.kept;
            const el = kept || document.createElement('div');
            if (!kept) {
                el.className = 'vp-gal';
                el.innerHTML = `<div class="vp-gal-top"><div class="vp-gal-tabs"><div class="vp-gal-ind"></div>${GAL_TABS.map(([id, name]) => `<button type="button" class="vp-gal-tab" data-tab="${id}">${name}</button>`).join('')}</div>
            </div><div class="vp-gal-card"><div class="vp-gal-body"><div class="vp-gal-grid"></div><div class="vp-gal-more"></div></div></div>`;
            }
            document.body.appendChild(el);
            gal.el = el;
            gal.kept = null;
            galRO.observe(el.querySelector('.vp-gal-grid'));
            galOpen = true;
            gal.path = location.pathname;
            galPosition();
            addEventListener('resize', galPosition);
            document.documentElement.classList.add('vp-gal-open');
            galOpen = true;
            galHideFeed(true);
            markActiveNav(); moveNavBlob();
            if (fromHistory !== true) overlayEnter('vpGal');
            const logo = document.querySelector('.' + SELECTORS.feedBar + ' .my-nav-block');
            const top = el.querySelector('.vp-gal-top'), old = top.querySelector('.my-nav-block');
            if (logo && !old) {
                const copy = logo.cloneNode(true);
                copy.classList.add('vp-gal-logo');
                copy.style.cssText = '';
                top.prepend(copy);
            }
            const body = el.querySelector('.vp-gal-body');
            if (kept) {
                body.scrollTop = gal.scroll || 0;
                el.querySelectorAll('.vp-gal-strip').forEach(st => { if (st._vpI) st.scrollLeft = st._vpI * st.clientWidth; });
                galInd();
                return;
            }
            el.querySelectorAll('.vp-gal-tab').forEach(b => b.onclick = () => { if (b.dataset.tab !== gal.tab || !gal.seen.size) galSwitch(b.dataset.tab); });
            galVolUi(top);
            body.addEventListener('scroll', () => { if (galNeedMore()) galLoad(); }, { passive: true });
            for (const t of ['wheel', 'touchmove']) el.addEventListener(t, e => e.stopPropagation(), { passive: true });
            galSwitch(gal.tab);
        }
        function galRefresh() {
            if (!gal.el) return openGallery();
            galSwitch(gal.tab, true);
        }
        function closeGallery(fromBack) {
            if (!gal.el) return;
            gal.el.querySelectorAll('video').forEach(v => v.pause());
            gal.scroll = gal.el.querySelector('.vp-gal-body').scrollTop;
            gal.el.remove();
            gal.kept = gal.el;
            gal.el = null;
            removeEventListener('resize', galPosition);
            document.documentElement.classList.remove('vp-gal-open');
            galOpen = false;
            galHideFeed(false);
            placeSidebar(); placeRail();
            document.querySelectorAll('.vp-gal-navwrap').forEach(w => w.classList.remove('vp-gal-navwrap'));
            markActiveNav(); moveNavBlob();
            if (!fromBack && overlayAt('vpGal')) history.back();
        }
        addEventListener('popstate', () => {
            if (overlayAt('vpGal')) { if (!gal.el) openGallery(true); }
            else if (gal.el) closeGallery(true);
        });
        const galLeft = () => { if (gal.el && location.pathname !== gal.path) closeGallery(true); };
        onDom(galLeft);
        document.addEventListener('vp-loc', galLeft);
        document.addEventListener('click', e => {
            if (!gal.el) return;
            const a = e.target.closest && e.target.closest('a.' + SELECTORS.navLink);
            if (!a || a.classList.contains('vp-gal-nav')) return;
            if (a.getAttribute('href') === gal.path) { e.preventDefault(); e.stopPropagation(); closeGallery(); }
            else closeGallery(true);
        }, true);
        addEventListener('keydown', e => { if (e.key === 'Escape' && gal.el) closeGallery(); });
        const galRO = new ResizeObserver(() => {
            if (!gal.el) return;
            if (gal.cols.length && galColsCount() !== gal.cols.length) galLayout();
            galMore();
        });
        onDom(function galleryButton() {
            const bar = siteEl('feedBar');
            if (!bar || bar.querySelector('.vp-gal-btn')) return;
            const tabs = bar.querySelector('.' + SELECTORS.tabs);
            const search = [...bar.querySelectorAll('button, a')].reverse().find(b => b.querySelector('svg') && !b.textContent.trim() && !(tabs && tabs.contains(b)) && !b.closest('.my-nav-block'));
            if (!search) return;
            const b = document.createElement('button');
            b.type = 'button';
            b.className = (search.className || '') + ' vp-gal-btn';
            b.title = 'Галерея';
            b.setAttribute('aria-label', 'Галерея');
            b.innerHTML = galIcon(22);
            b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); gal.el ? galRefresh() : openGallery(); });
            search.before(b);
        });
        onDom(function galleryNav() {
            const search = document.querySelector('nav a[href="/search"]');
            if (!search || search.parentElement.querySelector('.vp-gal-nav')) return;
            const a = search.cloneNode(true);
            a.setAttribute('href', '#gallery');
            a.classList.add('vp-gal-nav');
            a.classList.remove('vp-active');
            const icon = a.querySelector('svg'), label = [...a.querySelectorAll('span')].find(sp => !sp.children.length && sp.textContent.trim());
            if (icon) icon.outerHTML = galIcon(24);
            if (label) label.textContent = 'Галерея';
            a.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); gal.el ? galRefresh() : openGallery(); }, true);
            search.before(a);
        });

        function framePages() {
            document.querySelectorAll('iframe').forEach(f => {
                const r = f.getBoundingClientRect();
                const big = r.width >= innerWidth * 0.6 && r.height >= innerHeight * 0.6;
                f.classList.toggle('vp-page-frame', big);
                if (!big || f._vpClear) return;
                const clear = () => {
                    try {
                        const d = f.contentDocument;
                        if (!d || !d.head || d.getElementById('vp-frame-clear')) return;
                        const st = d.createElement('style');
                        st.id = 'vp-frame-clear';
                        st.textContent = 'html, body { background: transparent !important; }';
                        d.head.appendChild(st);
                        f._vpClear = true;
                    } catch (e) { }
                };
                if (!f._vpHooked) { f._vpHooked = true; f.addEventListener('load', () => { f._vpClear = false; clear(); }); }
                clear();
            });
        }
        onDom(framePages);

        function postMediaWait() {
            document.querySelectorAll('img[data-post-media-image]:not([data-vp-wait])').forEach(img => {
                const box = img.parentElement;
                if (!box) return;
                img.dataset.vpWait = '1';
                if (getComputedStyle(box).position === 'static') box.classList.add('vp-media-rel');
                const done = () => box.classList.remove('vp-media-wait', 'vp-media-fail');
                const fail = () => { box.classList.remove('vp-media-wait'); box.classList.add('vp-media-fail'); };
                img.addEventListener('load', done);
                img.addEventListener('error', fail);
                if (!img.complete) box.classList.add('vp-media-wait');
                else if (!img.naturalWidth && img.getAttribute('src')) fail();
                box.addEventListener('click', e => {
                    if (!box.classList.contains('vp-media-fail')) return;
                    e.stopPropagation(); e.preventDefault();
                    box.classList.replace('vp-media-fail', 'vp-media-wait');
                    const src = img.src;
                    img.removeAttribute('src');
                    img.src = src;
                }, true);
            });
        }
        onDom(postMediaWait);

        function postIdOf(card) {
            if (!card.matches('article')) { const m = location.pathname.match(/\/post\/([0-9a-f-]{36})/); if (m) return m[1]; }
            const rp = card.querySelector('.' + SELECTORS.repost);
            if (rp) {
                const own = normText([...card.querySelectorAll('.' + SELECTORS.postText)].filter(t => !t.closest('.' + SELECTORS.repost)).map(t => t.textContent).join(' '));
                const hl = card.querySelector('header ' + PROFILE_LINK) || card.querySelector(PROFILE_LINK);
                const who = hl && (loginOf(hl.getAttribute('href')) || '').toLowerCase();
                if (!own && who) {
                    for (const img of rp.querySelectorAll('img')) { const id = postIndex.byRepost.get(who + '|' + (img.currentSrc || img.src)); if (id) return id; }
                    const ot = normText([...rp.querySelectorAll('.' + SELECTORS.postText)].map(t => t.textContent).join(' '));
                    if (ot) for (const [k, id] of postIndex.byRepost) {
                        if (!k.startsWith(who + '|')) continue;
                        const t = k.slice(who.length + 1);
                        if (t === ot || ot.startsWith(t) || t.startsWith(ot)) return id;
                    }
                    return null;
                }
            }
            for (const img of card.querySelectorAll('img')) {
                if (rp && rp.contains(img)) continue;
                const id = postIndex.byMedia.get(img.currentSrc || img.src); if (id) return id;
            }
            const bg = card.dataset.blurBg && postIndex.byMedia.get(card.dataset.blurBg);
            if (bg) return bg;
            const link = card.querySelector('header ' + PROFILE_LINK) || card.querySelector(PROFILE_LINK);
            const user = link && loginOf(link.getAttribute('href'));
            const posts = user && postIndex.byUser.get(user.toLowerCase());
            if (!posts) return null;
            const text = normText([...card.querySelectorAll('.' + SELECTORS.postText)].filter(t => !t.closest('.' + SELECTORS.repost)).map(t => t.textContent).join(' '));
            if (!text) return null;
            for (const [id, t] of posts) if (t === text || text.startsWith(t) || t.startsWith(text)) return id;
            return null;
        }
        function postFooters(card) {
            const all = [...card.querySelectorAll('footer')];
            const own = all.filter(f => !f.closest('.' + SELECTORS.repost)).pop() || all.pop();
            return { own, repost: all.find(f => f !== own) };
        }
        function postCounters(foot) {
            if (!foot) return null;
            const num = el => el && [...el.querySelectorAll('span')].reverse().find(sp => !sp.children.length && /^\d[\d\s.,KkКк]*$/.test(sp.textContent.trim()));
            const btn = label => num(foot.querySelector(`button[aria-label="${label}"]`));
            const views = [...foot.querySelectorAll('span')].filter(sp => !sp.closest('button') && sp.querySelector('svg')).map(num).filter(Boolean).pop();
            return { likesCount: btn('Нравится'), commentsCount: btn('Комментировать'), repostsCount: btn('Репост'), viewsCount: views };
        }
        async function refreshPost(card, btn) {
            const id = postIdOf(card);
            if (!id || btn.classList.contains('vp-spin')) return;
            btn.classList.add('vp-spin');
            try {
                const foots = postFooters(card), orig = foots.repost && postIndex.original.get(id);
                const ids = orig ? [id, orig] : [id];
                const res = await api('/api/posts/stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
                const j = res.ok ? await res.json() : null;
                const list = j ? (j.posts || (j.data && j.data.posts) || []) : [];
                const pick = (pid, i) => list.find(x => x && x.id === pid) || (list.every(x => !x || !x.id) ? list[i] : null);
                const st = pick(id, 0);
                if (!st) throw new Error('счётчики: ' + res.status);
                let changed = 0;
                const put = (foot, st) => {
                    const els = postCounters(foot) || {};
                    for (const k of ['likesCount', 'commentsCount', 'repostsCount', 'viewsCount']) {
                        const el = els[k];
                        if (!el || typeof st[k] !== 'number' || el.textContent.trim() === String(st[k])) continue;
                        el.textContent = String(st[k]);
                        el.classList.remove('vp-bump'); void el.offsetWidth; el.classList.add('vp-bump');
                        changed++;
                    }
                };
                put(foots.own, st);
                const ost = orig && pick(orig, 1);
                if (ost) put(foots.repost, ost);
                btn.title = changed ? 'Обновлено' : 'Ничего нового';
            } catch (e) {
                logErr('обновить пост', e);
                btn.title = 'Не вышло обновить';
            } finally {
                setTimeout(() => btn.classList.remove('vp-spin'), 400);
            }
        }
        const styleRefresh = addCss(`
        .vp-post-tools { display: flex; align-items: center; gap: 0; }
        .vp-post-tool { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; margin-right: 2px;
            border: 0; border-radius: 50%; background: none; color: var(--text-secondary); cursor: pointer; flex: 0 0 auto; }
        .vp-post-tool:hover { background: var(--block-hover-bg, rgba(128,128,128,.15)); color: var(--text-primary, #fff); }
        .vp-post-tool.vp-busy { opacity: .5; pointer-events: none; }
        .vp-post-refresh.vp-spin svg { animation: vp-refresh-spin .6s linear infinite; }
        @keyframes vp-refresh-spin { to { transform: rotate(360deg); } }
        .vp-bump { animation: vp-bump .7s ease-out; display: inline-block; }
        @keyframes vp-bump { 30% { transform: scale(1.35); color: var(--accent-primary); } }
    `);
        function placeRefresh(b) {
            const card = b.parentElement, menu = b._vpMenu;
            if (!card || !menu || !menu.isConnected) return;
            const cr = card.getBoundingClientRect(), mr = menu.getBoundingClientRect();
            if (!mr.width) return;
            const top = Math.round(mr.top - cr.top + (mr.height - 32) / 2) + 'px', right = Math.round(cr.right - mr.left + 2) + 'px';
            if (b.style.top !== top || b.style.right !== right) Object.assign(b.style, { position: 'absolute', zIndex: '2', top, right });
            const row = menu.parentElement && menu.parentElement.querySelector(':scope > .' + SELECTORS.nickRow);
            if (!row) return;
            const need = Math.max(0, Math.round(row.getBoundingClientRect().right - (cr.right - parseFloat(right) - b.offsetWidth) + 8)) + 'px';
            if (row.style.paddingRight !== need) row.style.paddingRight = need;
        }
        addEventListener('resize', () => document.querySelectorAll('.vp-post-tools').forEach(placeRefresh));
        function postShownImage(card) {
            const cr = card.getBoundingClientRect();
            const imgs = [...card.querySelectorAll('.' + SELECTORS.postMedia + ' img, img[data-post-media-image]')]
                .filter(i => !i.closest('header') && (i.currentSrc || i.src));
            return imgs.find(i => { const r = i.getBoundingClientRect(), cx = r.left + r.width / 2; return r.width > 0 && cx > cr.left && cx < cr.right; }) || imgs[0] || null;
        }
        const postHeadRow = h => [...h.children].find(c => c.querySelector(PROFILE_LINK)) || h.firstElementChild;
        onDom(function postToolButtons() {
            if (!myUsername) return;
            document.querySelectorAll('.vp-post-tools').forEach(b => {
                if (b._vpMenu && !b._vpMenu.isConnected) {
                    const h = b.parentElement && b.parentElement.querySelector('header'), row = h && postHeadRow(h);
                    b._vpMenu = row && [...row.children].reverse().find(c => c.querySelector('svg') && !c.matches('.' + SELECTORS.nickRow + ', a, .vp-post-tools'));
                }
                placeRefresh(b);
            });
            const me = myUsername.toLowerCase();
            document.querySelectorAll('header').forEach(h => {
                const row = postHeadRow(h);
                if (!row) return;
                const card = h.closest('article') || h.closest('div:has(> footer)') || (h.parentElement && h.parentElement.closest('div:has(footer)'));
                if (!card || card.querySelector(':scope > .vp-post-tools') || !card.querySelector('footer') || card.closest('.vp-msgs, .vp-gal')) return;
                const link = h.querySelector(PROFILE_LINK) || card.querySelector(PROFILE_LINK);
                const user = link && loginOf(link.getAttribute('href'));
                if (!user) return;
                const menu = [...row.children].reverse().find(c => c.querySelector('svg') && !c.matches('.' + SELECTORS.nickRow + ', a'));
                const id = menu && postIdOf(card);
                if (!id) return;
                const box = document.createElement('div');
                box.className = 'vp-post-tools';
                const tool = (cls, title, html) => {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'vp-post-tool ' + cls;
                    b.title = title;
                    b.innerHTML = html;
                    box.appendChild(b);
                    return b;
                };
                if (user.toLowerCase() === me) {
                    const b = tool('vp-post-refresh', 'Обновить лайки и комменты', svgIcon('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>', 18));
                    b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); refreshPost(card, b); });
                }
                const icon = k => `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">${GAL_ICONS[k]}</svg>`;
                const copyTool = (act, title, run) => {
                    const b = tool('vp-post-copy', title, icon(act));
                    b.dataset.act = act;
                    b.addEventListener('click', e => {
                        e.preventDefault(); e.stopPropagation();
                        if (b.classList.contains('vp-busy')) return;
                        b.classList.add('vp-busy');
                        Promise.resolve(run()).then(ok => {
                            b.classList.remove('vp-busy');
                            b.innerHTML = icon(ok ? 'done' : act);
                            b.title = ok ? 'Скопировано' : 'Не вышло скопировать';
                            clearTimeout(b._vpT);
                            b._vpT = setTimeout(() => { b.innerHTML = icon(act); b.title = title; }, 1400);
                        });
                    });
                };
                if (postShownImage(card)) copyTool('copy', 'Скопировать картинку', () => { const img = postShownImage(card); return img ? galCopyImage(img.currentSrc || img.src) : false; });
                copyTool('link', 'Скопировать ссылку', () => copyText(`${location.origin}/@${user}/post/${id}`));
                if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
                box._vpMenu = menu;
                card.appendChild(box);
                placeRefresh(box);
            });
        });

        const TOAST_MS = 7000;
        let toastSeq = 0;
        const styleToasts = addCss(`
        .vp-toasts { top: 16px !important; bottom: auto !important; left: 50vw !important; right: auto !important;
            transform: translateX(-50%) !important; align-items: center !important;
            width: min(420px, calc(100vw - 24px)) !important; max-width: none !important; }
        .vp-toasts > button { display: none !important; }
        .vp-toasts > div > * { width: 100%; box-sizing: border-box; border-radius: 24px !important; background-color: var(--block-bg) !important;
            border: 1px solid var(--border-color, rgba(255, 255, 255, .12)); box-shadow: 0 14px 36px rgba(0, 0, 0, .45);
            backdrop-filter: var(--vp-glass-filter, blur(18px)); -webkit-backdrop-filter: var(--vp-glass-filter, blur(18px)); }
        .vp-toast-old { display: none !important; }
        @media (max-width: ${PHONE_MAX}px) { .vp-toasts { top: calc(env(safe-area-inset-top, 0px) + 10px) !important; } }
    `);
        function toastBox() {
            const root = document.getElementById('root');
            if (!root) return null;
            for (const el of root.children) {
                if (el.classList.contains('vp-toasts')) return el;
                if (el.childElementCount > 3 || !el.querySelector(':scope > div') || getComputedStyle(el).position !== 'fixed') continue;
                if (!el.querySelector('p') && !el.querySelector(':scope > button')) continue;
                el.classList.add('vp-toasts');
                return el;
            }
            return null;
        }
        function closeToast(it) {
            if (!it.isConnected || it._vpClosed) return;
            it._vpClosed = true;
            it.classList.add('vp-toast-old');
            const x = [...it.querySelectorAll('button')].pop();
            if (x) x.click();
        }
        onDom(function toastsOne() {
            const box = toastBox(), list = box && box.querySelector(':scope > div');
            if (!list) return;
            const items = [...list.children].filter(it => !it._vpClosed);
            if (!items.length) return;
            if (msgToastEl && items.some(it => !it._vpN)) { msgToastEl.remove(); msgToastEl = null; }
            for (const it of items) if (!it._vpN) {
                it._vpN = ++toastSeq;
                setTimeout(() => closeToast(it), TOAST_MS);
            }
            const newest = items.reduce((a, b) => (b._vpN >= a._vpN ? b : a));
            items.forEach(it => { if (it !== newest) closeToast(it); });
            const emoji = emojiAvatarOf(newest) || '';
            if ((newest.getAttribute('data-colored') || '') !== emoji || (emoji && !newest.classList.contains('vp-emoji-tint'))) {
                untintCard(newest);
                if (emoji) { newest.setAttribute('data-colored', emoji); tintCard(newest, emoji); } else newest.removeAttribute('data-colored');
            }
        });

        if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
            let hoverVid = null;
            const videoAt = t => {
                if (!t || !t.closest) return null;
                const tile = t.closest('.vp-gal-tile');
                if (tile) {
                    const strip = tile.querySelector('.vp-gal-strip'), slide = strip && strip.children[strip._vpI || 0];
                    return slide ? slide.querySelector('video') : null;
                }
                if (t.tagName === 'VIDEO') return t;
                const box = t.closest('.' + SELECTORS.postMedia);
                return box ? [...box.querySelectorAll('video')].find(v => v.getBoundingClientRect().width > 0) || null : null;
            };
            const unmute = v => {
                if (!v || !v.muted) return;
                if (v.closest('.vp-gal')) { const g = galVol(); if (!g) return; v.volume = g; }
                const wasPlaying = !v.paused;
                v._vpHoverSound = true;
                v.muted = false;
                setTimeout(() => { if (wasPlaying && v.paused && !v.muted) { v.muted = true; v._vpHoverSound = false; v.play().catch(() => { }); } }, 0);
            };
            const mute = v => { if (v && v._vpHoverSound) { v.muted = true; v._vpHoverSound = false; } };
            document.addEventListener('pointerover', e => {
                if (e.pointerType !== 'mouse') return;
                const v = videoAt(e.target);
                if (v === hoverVid) return;
                mute(hoverVid);
                hoverVid = v;
                unmute(v);
            }, true);
            document.addEventListener('pointerleave', () => { mute(hoverVid); hoverVid = null; });
            document.addEventListener('scroll', e => {
                if (!hoverVid || !e.target.classList || !e.target.classList.contains('vp-gal-strip')) return;
                requestAnimationFrame(() => { const el = document.querySelectorAll(':hover'), t = el[el.length - 1], v = videoAt(t); if (v !== hoverVid) { mute(hoverVid); hoverVid = v; unmute(v); } });
            }, true);
        }

        const LINK_RE = /(?:https?:\/\/|www\.)[^\s<>"'«»]+|(?<![\w@.\/-])(?:[a-z0-9-]+\.)+(?:com|ru|me|org|net|io|gg|tv|app|dev|xyz|su|ly|co|be|link|site|store|online|info|pro|рф)(?:\/[^\s<>"'«»]*)?(?![\w-])|(?<![\w@.\/-])[а-яё0-9-]+\.(?:com|рф|ru)(?![\w-])/giu;
        const linkNodes = new Map();
        const linkHl = window.Highlight && CSS.highlights ? new Highlight() : null;
        if (linkHl) CSS.highlights.set('vp-link', linkHl);
        const styleLinks = addCss(`::highlight(vp-link) { color: var(--accent-primary); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 2px; }`);
        let linksAt = 0;
        function scanLinks() {
            const root = document.getElementById('root');
            if (!root) return;
            for (const node of linkNodes.keys()) if (!node.isConnected) linkNodes.delete(node);
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            for (let node = walker.nextNode(); node; node = walker.nextNode()) {
                const text = node.nodeValue;
                if (text.length < 5 || !text.includes('.')) { linkNodes.delete(node); continue; }
                const known = linkNodes.get(node);
                if (known && known.text === text) continue;
                const host = node.parentElement;
                if (!host || host.closest('a, button, input, textarea, [contenteditable], script, style, .vp-settings-tabs')) continue;
                const links = [];
                for (const m of text.matchAll(LINK_RE)) {
                    const raw = m[0].replace(/[.,!?:;)\]]+$/, '');
                    if (raw.length < 4) continue;
                    links.push({ start: m.index, end: m.index + raw.length, url: /^https?:\/\//i.test(raw) ? raw : 'https://' + raw });
                }
                if (links.length) linkNodes.set(node, { text, links }); else linkNodes.delete(node);
            }
            if (!linkHl) return;
            linkHl.clear();
            for (const [node, { links }] of linkNodes) for (const l of links) {
                const r = new Range();
                r.setStart(node, l.start); r.setEnd(node, l.end);
                linkHl.add(r);
            }
        }
        onDom(function linksScan() {
            if (performance.now() - linksAt < 500) return;
            linksAt = performance.now();
            scanLinks();
        });
        function linkAt(x, y) {
            const pos = document.caretPositionFromPoint ? document.caretPositionFromPoint(x, y) : document.caretRangeFromPoint && document.caretRangeFromPoint(x, y);
            if (!pos) return null;
            const node = pos.offsetNode || pos.startContainer, off = pos.offset ?? pos.startOffset;
            const info = node && linkNodes.get(node);
            if (!info || info.text !== node.nodeValue) return null;
            const l = info.links.find(l => off >= l.start && off <= l.end);
            if (!l) return null;
            const r = new Range(); r.setStart(node, l.start); r.setEnd(node, l.end);
            return [...r.getClientRects()].some(b => x >= b.left - 2 && x <= b.right + 2 && y >= b.top - 2 && y <= b.bottom + 2) ? l : null;
        }
        document.addEventListener('click', e => {
            if (e.button || !linkNodes.size || e.target.closest('a, button, input, textarea')) return;
            const l = linkAt(e.clientX, e.clientY);
            if (!l) return;
            e.preventDefault(); e.stopPropagation();
            window.open(l.url, '_blank', 'noopener');
        }, true);
        let linkHover = null;
        document.addEventListener('mousemove', e => {
            if (!linkNodes.size) return;
            const el = linkAt(e.clientX, e.clientY) ? e.target : null;
            if (el === linkHover) return;
            if (linkHover) linkHover.style.cursor = '';
            linkHover = el;
            if (el) el.style.cursor = 'pointer';
        }, { passive: true });

        let bannerQueued = false;
        function bannerDepth() {
            bannerQueued = false;
            const banner = siteEl('banner');
            const img = banner && banner.querySelector(':scope > img[alt="Banner"]');
            if (!img || bannerEdit.img) return;
            bannerVideoSync();
            banner.classList.add('vp-depth');
            const r = banner.getBoundingClientRect();
            if (r.bottom < -40 || r.top > innerHeight) return;
            const past = Math.max(0, -r.top);
            const y = Math.round(past * .35);
            const glassEl = bannerGlassEl(banner), glass = !bannerNoGlass && glassEl;
            const tf = calm ? '' : `translateY(${y}px)` + (glassEl ? '' : ' scale(1.15)'), op = String(Math.max(.25, 1 - past / (r.height * 1.4)).toFixed(2));
            for (const el of [img, banner.querySelector(':scope > .vp-banner-video'), glass].filter(Boolean)) {
                if (el.style.transform !== tf) el.style.transform = tf;
                if (el.style.opacity !== op) el.style.opacity = op;
            }
            const bar = banner.querySelector(':scope > .' + SELECTORS.bannerButtons);
            if (bar) {
                const pane = glass ? [glass, glass.firstElementChild].filter(e => e && e.offsetWidth > banner.offsetWidth / 2) : [];
                const top = Math.max(img.getBoundingClientRect().top, ...pane.map(e => e.getBoundingClientRect().top));
                const off = Math.max(0, Math.round(top - r.top)) + 'px';
                if (bar.style.getPropertyValue('--vp-bar-top') !== off) bar.style.setProperty('--vp-bar-top', off);
            }
        }
        addEventListener('scroll', () => { if (!bannerQueued) { bannerQueued = true; requestAnimationFrame(bannerDepth); } }, { capture: true, passive: true });
        onDom(function bannerDepthDom() { bannerDepth(); });

        const BANNER_GLASS_SEL = ':scope > [aria-label="Стекло"], :scope > [aria-label="Разбитое стекло"]';
        const bannerGlassEls = b => [...b.querySelectorAll(BANNER_GLASS_SEL)];
        const bannerGlassEl = b => bannerGlassEls(b).find(e => e.getBoundingClientRect().width > 0) || bannerGlassEls(b)[0] || null;
        let bannerNoGlass = GM_getValue('bannerGlassOff', false), bannerNoStickers = GM_getValue('bannerStickersOff', false);
        document.documentElement.classList.toggle('vp-no-glass', bannerNoGlass);
        document.documentElement.classList.toggle('vp-no-banner-stickers', bannerNoStickers);
        const BANNER_FX = [
            { cls: 'vp-banner-glass', find: b => bannerGlassEls(b).length > 0, key: 'bannerGlassOff', html: 'vp-no-glass',
                get: () => bannerNoGlass, set: v => { bannerNoGlass = v; }, titles: ['Убрать стекло с баннера', 'Вернуть стекло на баннер'],
                icon: svgIcon('<rect x="3" y="5" width="18" height="14" rx="4"/><path d="M7.5 12.5l4-4M7.5 16l7.5-7.5"/>', 20) },
            { cls: 'vp-banner-stickers', find: b => { const d = b.querySelector(':scope > [aria-label^="Оформление профиля"]'); return d && (d.firstElementChild || bannerNoStickers) ? d : null; },
                key: 'bannerStickersOff', html: 'vp-no-banner-stickers', get: () => bannerNoStickers, set: v => { bannerNoStickers = v; },
                titles: ['Скрыть стикеры на баннере', 'Показать стикеры на баннере'],
                icon: svgIcon('<path d="M15 3H7a4 4 0 0 0-4 4v10a4 4 0 0 0 4 4h6l8-8V7a4 4 0 0 0-4-4z"/><path d="M13 21v-4a4 4 0 0 1 4-4h4"/>', 20) }
        ];
        function bannerFx() {
            const banner = siteEl('banner'), row = siteEl('bannerButtons');
            for (const fx of BANNER_FX) {
                let btn = document.querySelector('.' + fx.cls);
                const want = row && banner && bannerBtns.draw && fx.find(banner);
                if (!want) { if (btn) btn.remove(); continue; }
                if (!btn || btn.parentElement !== (bannerBtns.ours || row)) {
                    if (btn) btn.remove();
                    btn = bannerButton('vp-banner-fx ' + fx.cls, '', fx.icon);
                    btn.onclick = e => {
                        e.stopPropagation();
                        const v = !fx.get();
                        fx.set(v);
                        GM_setValue(fx.key, v);
                        document.documentElement.classList.toggle(fx.html, v);
                        bannerFx();
                        bannerDepth();
                    };
                    (bannerBtns.ours || row).appendChild(btn);
                }
                const off = fx.get();
                btn.classList.toggle('vp-off', off);
                if (btn.title !== fx.titles[+off]) btn.title = fx.titles[+off];
            }
            let vb = document.querySelector('.vp-banner-vid');
            const mine = myUsername && (location.pathname.match(/^\/@([\w.]+)\/?$/) || [])[1];
            if (!(row && banner && bannerBtns.draw && mine && mine.toLowerCase() === myUsername.toLowerCase())) { if (vb) vb.remove(); return; }
            if (!vb || vb.parentElement !== (bannerBtns.ours || row)) {
                if (vb) vb.remove();
                vb = bannerButton('vp-banner-fx vp-banner-vid', '', svgIcon('<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10 5-3v10l-5-3z"/>', 20));
                vb.onclick = e => { e.stopPropagation(); bannerVideoPick(); };
                (bannerBtns.ours || row).appendChild(vb);
            }
            const has = !!bannerVideoOwn(), t = bannerVideoBusy ? 'Видео загружается…' : has ? 'Убрать видео с баннера' : 'Видео в баннер — его видят те, у кого стоит ИТД X';
            vb.classList.toggle('vp-on', has);
            vb.classList.toggle('vp-busy', bannerVideoBusy);
            if (vb.title !== t) vb.title = t;
        }
        onDom(bannerFx);
        function bannerVideoWant() {
            const m = location.pathname.match(/^\/@([\w.]+)\/?$/);
            if (!m) return '';
            if (myUsername && m[1].toLowerCase() === myUsername.toLowerCase()) return bannerVideoOwn();
            return showLooks ? bannerVideoGuest : '';
        }
        function bannerVideoSync() {
            const banner = siteEl('banner'), img = banner && banner.querySelector(':scope > img[alt="Banner"]');
            let v = document.querySelector('.vp-banner-video');
            const want = img && !bannerEdit.img && bannerVideoWant();
            if (!want) { if (v) v.remove(); return; }
            const src = 'https://cdn.xn--d1ah4a.com/' + want;
            if (!v || v.parentElement !== banner) {
                if (v) v.remove();
                v = document.createElement('video');
                v.className = 'vp-banner-video';
                v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
                v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
                v.addEventListener('error', () => v.classList.add('vp-fail'));
                v.addEventListener('playing', () => v.classList.add('vp-live'));
                img.after(v);
            }
            const box = `left: ${img.offsetLeft}px; top: ${img.offsetTop}px; width: ${img.offsetWidth}px; height: ${img.offsetHeight}px; border-radius: ${getComputedStyle(img).borderRadius};`;
            if (v.dataset.box !== box) { v.dataset.box = box; v.style.cssText = box + (img.style.transform ? ` transform: ${img.style.transform};` : ''); }
            if (v.getAttribute('src') !== src) { v.classList.remove('vp-fail', 'vp-live'); v.src = src; v.play().catch(() => { }); }
        }
        onDom(bannerVideoSync);
        function bannerVideoPick() {
            if (bannerVideoBusy) return;
            if (bannerVideoOwn()) {
                GM_setValue(acctKey('vp_banner_video'), '');
                publishLook();
                bannerFx();
                bannerVideoSync();
                return;
            }
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'video/mp4,video/webm,video/quicktime';
            input.onchange = async () => {
                const f = input.files && input.files[0];
                if (!f) return;
                if (!/^video\//.test(f.type)) { alert('Нужен видеофайл: mp4, webm или mov'); return; }
                if (f.size > VIDEO_UP_MAX) { alert('Видео больше 30 МБ — возьми покороче или сожми'); return; }
                bannerVideoBusy = true;
                bannerFx();
                try {
                    const path = await uploadVideo(new File([f], f.name || 'banner.mp4', { type: f.type }));
                    GM_setValue(acctKey('vp_banner_video'), path);
                    publishLook();
                    bannerVideoSync();
                } catch (e) { logErr('видео в баннер', e); alert('Не вышло загрузить видео: ' + (e && e.message || e)); }
                finally { bannerVideoBusy = false; bannerFx(); }
            };
            input.click();
        }
        addCss(`
        html.vp-no-glass .vp-banner > [aria-label="Стекло"], html.vp-no-glass .vp-banner > [aria-label="Разбитое стекло"] { display: none !important; }
        html.vp-no-banner-stickers .vp-banner > [aria-label^="Оформление профиля"] { display: none !important; }
        .vp-banner-fx { position: relative; }
        .vp-banner-vid.vp-on { color: var(--vp-accent); }
        .vp-banner-vid.vp-busy { opacity: .5; pointer-events: none; animation: vpBvPulse 1s ease-in-out infinite alternate; }
        @keyframes vpBvPulse { to { opacity: .25; } }
        .vp-banner-video { position: absolute; object-fit: cover; pointer-events: none; opacity: 0; transition: opacity .4s; }
        .vp-banner-video.vp-live { opacity: 1; }
        .vp-banner-video.vp-fail { display: none; }
        .vp-banner-fx.vp-off { opacity: .55; }
        .vp-banner-fx.vp-off::after { content: ''; position: absolute; left: 50%; top: 50%; width: 22px; height: 2px; border-radius: 2px;
            background: currentColor; transform: translate(-50%, -50%) rotate(-45deg); pointer-events: none; }
        `);

        const COUNT_LABEL = /подпис|пост|лайк|друз/i;
        const counted = new Set();
        const countKey = () => loginOf(location.pathname) || location.pathname;
        function countUp() {
            if (counted.has(countKey())) return;
            const spans = [...document.querySelectorAll('span')].filter(sp => {
                const next = sp.nextElementSibling;
                return next && !sp.children.length && /^\d{1,7}$/.test(sp.textContent.trim()) && COUNT_LABEL.test(next.textContent)
                    && !sp.closest('.' + SELECTORS.post + ', .' + SELECTORS.notification + ', nav, .vp-rail');
            });
            if (!spans.length) return;
            counted.add(countKey());
            if (calm) return;
            spans.forEach(sp => {
                sp.style.setProperty('--vp-to', sp.textContent.trim());
                sp.style.setProperty('--vp-count-color', getComputedStyle(sp).color);
                sp.classList.add('vp-count');
                sp.addEventListener('animationend', () => sp.classList.remove('vp-count'), { once: true });
                setTimeout(() => sp.classList.remove('vp-count'), 1400);
            });
        }
        onDom(countUp);

        const plural = (n, one, few, many) => n % 10 === 1 && n % 100 !== 11 ? one
            : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many;
        const postsCounted = new Set();
        function profilePostsRow() {
            const login = loginOf(location.pathname);
            if (!login) return;
            const done = document.querySelector('.vp-posts-stat');
            if (done && done.isConnected && done.parentElement && done.parentElement.dataset.vpPosts === login) return;
            const num = [...document.querySelectorAll('span')].find(sp => sp.nextElementSibling && !sp.children.length && /^\d[\d\s]*$/.test(sp.textContent.trim())
                && /подпис/i.test(sp.nextElementSibling.textContent) && !sp.closest('.' + SELECTORS.post + ', nav, .vp-rail'));
            const item = num && num.parentElement, row = item && item.parentElement;
            if (!row || row.querySelector('.vp-posts-stat')) return;
            if (row.dataset.vpPosts === login) return;
            row.dataset.vpPosts = login;
            hcData(login, 2500).then(d => {
                const total = d && d.postsCount;
                if (typeof total !== 'number' || !row.isConnected || row.querySelector('.vp-posts-stat') || loginOf(location.pathname) !== login) return;
                const last = [...row.children].filter(c => c.querySelector('span')).pop() || item;
                const mine = last.cloneNode(true);
                mine.classList.add('vp-posts-stat');
                mine.querySelectorAll('.vp-count').forEach(e => { e.classList.remove('vp-count');['--vp-to', '--vp-count-color'].forEach(v => e.style.removeProperty(v)); });
                const [n, label] = mine.querySelectorAll('span');
                n.textContent = total;
                label.textContent = plural(total, 'пост', 'поста', 'постов');
                row.appendChild(mine);
                const countUpOnce = (n, total) => {
                    if (calm) return;
                    n.style.setProperty('--vp-to', String(total));
                    n.style.setProperty('--vp-count-color', getComputedStyle(n).color);
                    n.classList.add('vp-count');
                    setTimeout(() => n.classList.remove('vp-count'), 1400);
                };
                if (!postsCounted.has(login)) countUpOnce(n, total);
                if (myUsername && login.toLowerCase() === myUsername.toLowerCase()) myLikesTotal().then(likes => {
                    if (typeof likes !== 'number' || !row.isConnected || row.querySelector('.vp-likes-stat') || loginOf(location.pathname) !== login) return;
                    const lk = mine.cloneNode(true);
                    lk.classList.remove('vp-posts-stat');
                    lk.classList.add('vp-likes-stat');
                    const [ln, llabel] = lk.querySelectorAll('span');
                    ln.classList.remove('vp-count');
                    ln.textContent = likes;
                    llabel.textContent = 'лайков';
                    mine.after(lk);
                    if (!postsCounted.has(login + '|likes')) { postsCounted.add(login + '|likes'); countUpOnce(ln, likes); }
                });
                postsCounted.add(login);
            });
        }
        onDom(profilePostsRow);
        function profileStatsFit() {
            const st = document.querySelector('.vp-posts-stat'), row = st && st.parentElement;
            if (!row || !row.isConnected) return;
            let g = row.parentElement;
            for (let k = 0; g && k < 4 && getComputedStyle(g).display !== 'grid'; k++) g = g.parentElement;
            if (!g || g.hasAttribute('data-vp-stack') || getComputedStyle(g).display !== 'grid') return;
            if (getComputedStyle(g).gridTemplateColumns.trim().split(/\s+/).length < 2) return;
            const col = [...g.children].find(c => c.contains(row));
            if (!col || g.children.length < 2) return;
            const edge = col.getBoundingClientRect().right + 1;
            if ([...row.children].some(c => c.getBoundingClientRect().right > edge)) g.setAttribute('data-vp-stack', '');
        }
        onDom(profileStatsFit);
        onDom(function nickTails() {
            document.querySelectorAll('.vp-nick-text').forEach(sp => {
                const hash = [...sp.classList].find(c => !/^(vp-|my-|mod-)/.test(c));
                if (!hash) return;
                const badges = '.mod-badge-voronoi, .mod-badge-verify';
                const up = sp.parentElement, hops = [sp];
                if (up && !up.matches('.vp-nick') && [...up.children].every(c => c === sp || c.matches(badges))) hops.push(up);
                let tail = null;
                for (const from of hops) {
                    for (let n = from.nextElementSibling; n && !tail; n = n.nextElementSibling) {
                        if (n.matches(badges)) continue;
                        tail = n.matches('span.' + hash) ? n : n.querySelector('span.' + hash);
                        if (!tail) break;
                    }
                    if (tail) break;
                }
                if (!tail || tail === sp) return;
                const txt = tail.textContent;
                if (!txt.trim()) return;
                let node = sp._vpTail;
                const last = sp.lastChild, was = sp.dataset.vpTail;
                if (!node && was && last && last.nodeType === 3 && last.nodeValue.endsWith(was)) {
                    node = last.nodeValue.length > was.length ? last.splitText(last.nodeValue.length - was.length) : last !== sp.firstChild ? last : null;
                    if (node) sp._vpTail = node;
                }
                if (!node || node.parentNode !== sp) { node = document.createTextNode(''); sp.appendChild(node); sp._vpTail = node; }
                if (node.nodeValue !== txt) node.nodeValue = txt;
                if (sp.dataset.vpTail !== txt) sp.dataset.vpTail = txt;
                if (!tail.classList.contains('vp-nick-tail-moved')) tail.classList.add('vp-nick-tail-moved');
            });
        });
        onDom(function hideServiceNotifs() {
            document.querySelectorAll('.' + SELECTORS.notification).forEach(n => {
                if (n.dataset.vpSvc || !/(^|[^A-Za-z0-9])ITDX[A-Z0-9-]*(?: \S{1,12}){0,3} [\w\-/+=]{8,}/.test(n.textContent)) return;
                n.dataset.vpSvc = '1'; n.style.display = 'none';
            });
        });

        let uiSoundEnabled = GM_getValue('uiSoundEnabled', false);
        let uiCtx = null;
        const UI_GAIN = IS_PHONE ? 5 : 1;
        function uiAudio() {
            uiCtx = uiCtx || new (window.AudioContext || window.webkitAudioContext)();
            if (uiCtx.state !== 'running') uiCtx.resume().catch(() => { });
            return uiCtx;
        }
        function uiUnlock() {
            if (!uiSoundEnabled || (uiCtx && uiCtx.state === 'running')) return;
            try {
                const c = uiAudio(), b = c.createBufferSource();
                b.buffer = c.createBuffer(1, 1, c.sampleRate);
                b.connect(c.destination);
                b.start(0);
            } catch (e) { }
        }
        ['pointerdown', 'touchend', 'keydown'].forEach(ev => addEventListener(ev, uiUnlock, { capture: true, passive: true }));
        function uiSound(kind) {
            if (!uiSoundEnabled) return;
            try {
                uiAudio();
                const t = uiCtx.currentTime;
                const tone = (f0, f1, dur, vol, type = 'sine', at = 0) => {
                    const o = uiCtx.createOscillator(), g = uiCtx.createGain();
                    o.type = type;
                    o.frequency.setValueAtTime(f0, t + at);
                    o.frequency.exponentialRampToValueAtTime(f1, t + at + dur);
                    g.gain.setValueAtTime(0.0001, t + at);
                    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * UI_GAIN * soundVolume()), t + at + 0.006);
                    g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
                    o.connect(g).connect(uiCtx.destination);
                    o.start(t + at);
                    o.stop(t + at + dur + 0.02);
                };
                if (kind === 'like') { tone(520, 880, 0.09, 0.015); tone(880, 1320, 0.12, 0.0113, 'sine', 0.06); }
                else if (kind === 'toggle') tone(1400, 900, 0.05, 0.01, 'triangle');
                else if (kind === 'nav') tone(300, 220, 0.07, 0.0125);
                else tone(900, 700, 0.04, 0.0075, 'triangle');
            } catch (e) { }
        }
        document.addEventListener('click', e => {
            if (!uiSoundEnabled || !e.isTrusted) return;
            const t = e.target;
            if (t.closest('button[aria-label="Нравится"]')) uiSound('like');
            else if (t.closest('.settings-option, .toggle-switch')) uiSound('toggle');
            else if (t.closest('.' + SELECTORS.navLink)) uiSound('nav');
            else if (t.closest('.vp-pill-btn, .nick-style-option, .vp-msg-again, button')) uiSound('click');
        }, true);

        let railEnabled = GM_getValue('railEnabled', true);
        let mobileMenuOpen = false, mobileMenuEl = null;
        const GAMES = [
            { id: 'snake', name: 'Змейка', best: 'vp_snake_best', icon: '<path d="M4 17c0-3 2-4 4-4h8a3 3 0 0 0 0-6H9"/><circle cx="7" cy="7" r="1.6"/>' },
            { id: 'mines', name: 'Сапёр', best: 'vp_mines_best', icon: '<circle cx="12" cy="13" r="6"/><path d="M12 3v4M19.5 6 17 8.5M4.5 6 7 8.5"/>' },
            { id: 'tetris', name: 'Тетрис', best: 'vp_tetris_best', icon: '<path d="M4 14h5v5H4zM9 14h5v5H9zM9 9h5v5H9zM14 14h5v5h-5z"/>' }
        ];
        const rail = document.createElement('div');
        rail.className = 'vp-rail';
        rail.innerHTML = `
        <section class="vp-rail-card" data-block="stats"><div class="vp-rail-title">${svgIcon('<path d="M4 19V10M10 19V5M16 19v-7M21 19H3"/>', 16)}<span>Статистика</span></div>
            <div class="vp-seg"><div class="vp-seg-ind"></div><button data-p="day">День</button><button data-p="month">Месяц</button></div>
            <div class="vp-stats"><div class="vp-menu-note">Загрузка...</div></div><div class="vp-stats-since"></div></section>
        <section class="vp-rail-card" data-block="club"><div class="vp-rail-title">${svgIcon('<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.5a3 3 0 0 1 0 5.5M18 14.5a5 5 0 0 1 2.5 4.5"/>', 16)}<span>Клуб ИТД&nbsp;X</span><b class="vp-club-count"></b></div>
            <div class="vp-club"><div class="vp-menu-note">Загрузка...</div></div></section>
        <section class="vp-rail-card" data-block="games"><div class="vp-rail-title">${svgIcon('<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7.5 10.5v4M5.5 12.5h4"/><circle cx="15.5" cy="11.5" r=".8"/><circle cx="17.5" cy="13.5" r=".8"/>', 16)}<span>Игры</span></div>
            <div class="vp-games-list"></div></section>`;
        document.body.appendChild(rail);
        const RAIL_CARDS = [{ id: 'stats', name: 'Статистика' }, { id: 'club', name: 'Клуб ИТД X' }, { id: 'games', name: 'Игры' }];
        function railCards() {
            const v = GM_getValue('railCards', null) || {}, ids = RAIL_CARDS.map(c => c.id);
            const order = (Array.isArray(v.order) ? v.order : []).filter(id => ids.includes(id));
            ids.forEach(id => { if (!order.includes(id)) order.push(id); });
            return { order, off: (Array.isArray(v.off) ? v.off : []).filter(id => ids.includes(id)) };
        }
        function railCardsSave(st) {
            GM_setValue('railCards', { order: st.order, off: st.off });
            applyRailCards();
        }
        function applyRailCards(place = true) {
            const st = railCards();
            for (const id of st.order) {
                const card = rail.querySelector(`:scope > .vp-rail-card[data-block="${id}"]`);
                if (!card) continue;
                rail.appendChild(card);
                card.hidden = st.off.includes(id);
            }
            if (place) placeRail();
        }
        applyRailCards(false);
        rail.addEventListener('pointerdown', e => {
            const title = e.target.closest('.vp-rail-title'), card = title && title.parentElement;
            if (!card || e.button || e.target.closest('button, a') || mobileMenuOpen && e.pointerType !== 'mouse') return;
            const y0 = e.clientY;
            let base = y0, on = false;
            const move = ev => {
                const dy = ev.clientY - base;
                if (!on) {
                    if (Math.abs(ev.clientY - y0) < 6) return;
                    on = true;
                    card.classList.add('vp-rail-drag');
                    rail.classList.add('vp-rail-sorting');
                    try { card.setPointerCapture(e.pointerId); } catch (x) { }
                }
                ev.preventDefault();
                const shown = [...rail.querySelectorAll(':scope > .vp-rail-card:not([hidden])')], i = shown.indexOf(card);
                const prev = shown[i - 1], next = shown[i + 1];
                if (next && dy > next.offsetHeight / 2) { next.after(card); base += next.offsetHeight + 12; }
                else if (prev && dy < -prev.offsetHeight / 2) { prev.before(card); base -= prev.offsetHeight + 12; }
                card.style.transform = `translateY(${ev.clientY - base}px)`;
            };
            const up = () => {
                removeEventListener('pointermove', move, true);
                removeEventListener('pointerup', up, true);
                removeEventListener('pointercancel', up, true);
                if (!on) return;
                card.classList.remove('vp-rail-drag');
                rail.classList.remove('vp-rail-sorting');
                card.style.transform = '';
                const st = railCards();
                st.order = [...rail.querySelectorAll(':scope > .vp-rail-card')].map(c => c.dataset.block);
                railCardsSave(st);
                const stop = ev => { ev.stopPropagation(); ev.preventDefault(); };
                addEventListener('click', stop, { capture: true, once: true });
                setTimeout(() => removeEventListener('click', stop, true), 0);
            };
            addEventListener('pointermove', move, true);
            addEventListener('pointerup', up, true);
            addEventListener('pointercancel', up, true);
        });

        const railCss = addCss(`
        html.vp-side-moved aside:has(nav), html.vp-side-moved .vp-sidebar { left: var(--vp-side-left) !important; }
        .vp-rail { position: fixed; top: 24px; z-index: 50; display: none; flex-direction: column; gap: 12px;
            max-height: calc(100vh - 48px); overflow-y: auto; overflow-x: hidden; scrollbar-width: none; }
        .vp-rail.vp-on { display: flex; animation: vpRailIn .4s ease-out; }
        .vp-rail-card { border-radius: 36px; padding: 20px 22px; color: var(--text-primary, #fff); background: var(--block-bg);
            backdrop-filter: var(--vp-glass-filter, none); -webkit-backdrop-filter: var(--vp-glass-filter, none); }
        .vp-rail-card[hidden] { display: none !important; }
        .vp-rail-card > .vp-rail-title { cursor: grab; }
        .vp-rail-card.vp-rail-drag { position: relative; z-index: 2; cursor: grabbing; box-shadow: 0 16px 40px rgba(0, 0, 0, .45); transition: none; }
        .vp-rail-sorting { -webkit-user-select: none; user-select: none; }
        .vp-rail-title { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 16px; font-weight: 600;
            color: var(--text-primary, #fff); }
        .vp-rail-title svg { color: var(--text-secondary); flex-shrink: 0; }
        .vp-rail-title b { margin-left: auto; color: var(--text-secondary); font-size: 14px; font-weight: 500; }
        .vp-seg { position: relative; display: flex; margin-bottom: 10px; padding: 3px; border-radius: 9999px; background: var(--glass-bg, rgba(35, 35, 35, .8)); }
        .vp-seg button { position: relative; z-index: 1; flex: 1; padding: 6px 0; border: 0; background: none; cursor: pointer; font: inherit;
            font-size: 13px; font-weight: 500; color: var(--text-secondary); transition: color .2s ease; }
        .vp-seg button.vp-on { color: var(--text-primary, #fff); }
        .vp-seg-ind { position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc(50% - 3px); border-radius: 9999px;
            background: var(--tab-active-bg, rgba(255, 255, 255, .08)); transition: transform .3s cubic-bezier(.5, 0, 0, 1); }
        .vp-seg.vp-month .vp-seg-ind { transform: translateX(100%); }
        .vp-stats-since { margin-top: 4px; font-size: 12px; color: var(--text-secondary); }
        .vp-stats-since:empty { display: none; }
        .vp-stat { display: flex; align-items: baseline; gap: 6px; padding: 5px 0; font-size: 15px; }
        .vp-stat-val { font-weight: 700; }
        .vp-stat-label { flex: 1; color: var(--text-secondary); }
        .vp-stat-diff { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .vp-stat-diff.vp-up { color: #3ddc84; }
        .vp-stat-diff.vp-down { color: #ff5a6a; }
        .vp-club { display: flex; flex-direction: column; gap: 2px; max-height: 260px; overflow-y: auto; overflow-x: hidden; padding: 10px 2px;
            scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--text-secondary) 45%, transparent) transparent;
            -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%);
            mask-image: linear-gradient(to bottom, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%); }
        .vp-club-row { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 18px; cursor: pointer; min-width: 0;
            transition: background-color .15s ease; }
        .vp-club-row:hover { background: var(--bg-hover, rgba(255, 255, 255, .08)); }
        .vp-club-ava { width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-size: 17px; background: var(--bg-hover, rgba(255, 255, 255, .08)); overflow: hidden; }
        .vp-club-ava img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .vp-club-row[data-online] .vp-club-ava { overflow: visible; position: relative; }
        .vp-club-row[data-online] .vp-club-ava::after { content: ""; position: absolute; right: -1px; bottom: -1px; width: 9px; height: 9px; border-radius: 50%;
            background: #22c55e; box-shadow: 0 0 0 2px var(--block-bg); }
        html.vp-light .vp-club-row[data-online] .vp-club-ava::after { box-shadow: 0 0 0 2px #fff; }
        .vp-club-count { white-space: nowrap; flex-shrink: 0; }
        .vp-club-count .vp-club-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #22c55e; margin-right: 6px; vertical-align: 1px; }
        .vp-club-names { min-width: 0; display: flex; flex-direction: column; }
        .vp-club-name { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-club-login { font-size: 11px; color: var(--text-secondary); }
        @keyframes vpRailIn { from { opacity: 0; transform: translateX(10px); } }
        @media (prefers-reduced-motion: reduce) { .vp-rail.vp-on { animation: none; } }
    `);

        const menuBtnCss = addCss(`.vp-menu-btn { display: none !important; }
        @media (max-width: ${PHONE_MAX}px) { .vp-menu-btn { display: inline-flex !important; }
            div:has(> div > .vp-itdx-btn) { flex-wrap: wrap; justify-content: center; align-items: center; }
            div:has(> .vp-itdx-btn) { display: contents; } }
        .vp-menu { position: fixed; inset: 0; z-index: 2147483000; display: flex; flex-direction: column; box-sizing: border-box;
            background: var(--bg-primary, #000); color: var(--text-primary, #fff); font-family: inherit; animation: vpMenuIn .22s ease-out; overflow: hidden; }
        @keyframes vpMenuIn { from { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .vp-menu { animation: none; } }
        .vp-menu-top { display: flex; align-items: center; gap: 10px; padding: calc(env(safe-area-inset-top, 0px) + 16px) 16px 10px; }
        .vp-menu-title { flex: 1; min-width: 0; font-size: 22px; font-weight: 700; }
        .vp-menu-close { width: 40px; height: 40px; flex-shrink: 0; border: 0; border-radius: 50%; padding: 0; cursor: pointer;
            display: flex; align-items: center; justify-content: center; background: var(--block-bg); color: var(--text-primary, #fff); }
        .vp-menu-close:active { transform: scale(.94); }
        .vp-menu-body { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 0 16px calc(env(safe-area-inset-bottom, 0px) + 16px); -webkit-overflow-scrolling: touch; }
        .vp-menu-body .vp-rail { position: static !important; width: auto !important; max-height: none !important; left: auto !important; top: auto !important; animation: none !important; }
        html.vp-menu-open .itd-scroll-top-btn { opacity: 0 !important; visibility: hidden !important; }`);

        const RAIL_TOP = 36;
        let cbCached;
        function contentBox() {
            if (cbCached === undefined) {
                cbCached = contentBoxNow();
                queueMicrotask(() => { cbCached = undefined; });
            }
            return cbCached;
        }
        function contentBoxNow() {
            const side = '.' + SELECTORS.sidebar + ', .' + SELECTORS.sidebarRight + ', .vp-rail';
            let left = Infinity, right = 0;
            const memo = new Map(), tops = new Set();
            const up = el => {
                const p = el.parentElement;
                if (!p || p === document.body) return el;
                if (!memo.has(p)) memo.set(p, !p.querySelector(side) && p.getBoundingClientRect().width < innerWidth * 0.72 ? up(p) : null);
                return memo.get(p) || el;
            };
            document.querySelectorAll('.' + [SELECTORS.tabs, SELECTORS.feedBar, SELECTORS.banner, SELECTORS.post, SELECTORS.notification].join(', .')).forEach(e => tops.add(up(e)));
            tops.forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.width > 300) { left = Math.min(left, r.left); right = Math.max(right, r.right); }
            });
            if (right) feedCb = { left, right, w: innerWidth };
            if (!right) {
                const frame = [...document.querySelectorAll('iframe')].find(f => {
                    const r = f.getBoundingClientRect();
                    return r.width >= innerWidth * 0.72 && r.height >= innerHeight * 0.6;
                });
                if (frame) return msgsOpen ? frameColumn() : { left: 0, right: 0 };
                const skip = side + ', nav, .vp-hc, .vp-msgs, .vpi-overlay';
                for (const y of [0.35, 0.6]) {
                    const hit = document.elementsFromPoint(innerWidth / 2, innerHeight * y).find(e => e !== document.body
                        && e !== document.documentElement && !e.closest(skip) && e.getBoundingClientRect().width < innerWidth * 0.72);
                    let el = hit;
                    while (el && el.parentElement && el.parentElement !== document.body && !el.parentElement.querySelector(side)
                        && el.parentElement.getBoundingClientRect().width < innerWidth * 0.72) el = el.parentElement;
                    const r = el && el.getBoundingClientRect();
                    if (r && r.width > 300) { left = Math.min(left, r.left); right = Math.max(right, r.right); }
                }
            }
            return right ? { left, right } : null;
        }
        let lastCb = null;
        let feedCb = null;
        function frameColumn() {
            if (feedCb && feedCb.w === innerWidth) return { left: feedCb.left, right: feedCb.right };
            const side = siteEl('sidebar');
            const sw = side ? side.getBoundingClientRect().width : 0;
            const siteLeft = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-gap')) || 36;
            const w = Math.min(650, innerWidth - 32);
            let left = Math.round(innerWidth / 2 - w / 2);
            if (sw && left - sw - 24 <= siteLeft + 8) left = Math.round(siteLeft + sw + 24);
            return { left, right: Math.min(innerWidth - 16, left + w) };
        }
        function onMenuKey(e) {
            if (e.key === 'Escape' && mobileMenuOpen) { e.stopPropagation(); closeMobileMenu(); }
        }
        function openMobileMenu(fromHistory) {
            if (mobileMenuEl) return;
            const el = document.createElement('div');
            el.className = 'vp-menu';
            el.innerHTML = `<div class="vp-menu-top"><div class="vp-menu-title">ИТД X · Меню</div><button type="button" class="vp-menu-close" aria-label="Закрыть">${svgIcon('<path d="M6 6l12 12M18 6 6 18"/>', 22)}</button></div><div class="vp-menu-body"></div>`;
            document.body.appendChild(el);
            mobileMenuEl = el;
            mobileMenuOpen = true;
            document.documentElement.classList.add('vp-menu-open');
            el.querySelector('.vp-menu-body').appendChild(rail);
            rail.classList.add('vp-on');
            rail.style.position = 'static';
            rail.style.left = 'auto';
            rail.style.top = 'auto';
            rail.style.width = 'auto';
            rail.style.maxHeight = 'none';
            el.querySelector('.vp-menu-close').addEventListener('click', () => closeMobileMenu());
            el.addEventListener('click', e => { if (e.target === el) closeMobileMenu(); });
            document.addEventListener('keydown', onMenuKey, true);
            if (fromHistory !== true) overlayEnter('vpMenu');
        }
        function closeMobileMenu(fromHistory) {
            if (!mobileMenuEl) return;
            const el = mobileMenuEl;
            mobileMenuEl = null;
            mobileMenuOpen = false;
            document.documentElement.classList.remove('vp-menu-open');
            document.removeEventListener('keydown', onMenuKey, true);
            rail.classList.remove('vp-on');
            rail.style.position = '';
            rail.style.left = '';
            rail.style.top = '';
            rail.style.width = '';
            rail.style.maxHeight = '';
            document.body.appendChild(rail);
            el.remove();
            placeRail();
            if (fromHistory !== true && overlayAt('vpMenu')) history.back();
        }
        addEventListener('popstate', () => {
            if (overlayAt('vpMenu') && !mobileMenuOpen) openMobileMenu(true);
            else if (mobileMenuOpen && !overlayAt('vpMenu')) closeMobileMenu(true);
        });
        function placeRail() {
            if (mobileMenuOpen) return;
            const cb = contentBox() || lastCb;
            if (cb) lastCb = cb;
            const edge = cb ? cb.right : 0;
            const side = siteEl('sidebarRight');
            const right = side ? side.getBoundingClientRect().left : innerWidth;
            const gap = right - edge;
            let box = null;
            const on = railEnabled && !!myUsername && !!rail.querySelector(':scope > .vp-rail-card:not([hidden])');
            const sideEl = siteEl('sidebar');
            if (on && galOpen && sideEl && innerWidth > PHONE_MAX) {
                const margin = Math.max(12, Math.round(sideEl.getBoundingClientRect().left)), width = 300;
                box = { left: innerWidth - margin - width, width, maxH: innerHeight - RAIL_TOP - 24 };
            } else if (on && edge > 0 && gap >= 240) {
                const width = Math.min(300, gap - 48);
                box = { left: Math.round(edge + 24), width, maxH: innerHeight - 48 };
            } else if (on && side) {
                const sr = side.getBoundingClientRect(), links = side.lastElementChild;
                const maxH = (links ? links.getBoundingClientRect().top : sr.bottom) - 24 - 24;
                if (sr.width >= 180 && maxH >= 220) box = { left: Math.round(sr.left), width: Math.round(sr.width), maxH };
            }
            rail.style.top = RAIL_TOP + 'px';
            if (box && edge > 0 && gap >= 240 && !galOpen) box.maxH = innerHeight - RAIL_TOP - 24;
            rail.classList.toggle('vp-on', !!box);
            if (!box) return;
            rail.style.width = box.width + 'px';
            rail.style.left = box.left + 'px';
            rail.style.maxHeight = box.maxH + 'px';
        }
        addEventListener('resize', placeRail);
        onDom(placeRail);

        function placeSidebar() {
            if (galOpen) { document.documentElement.classList.remove('vp-side-moved'); return; }
            const side = siteEl('sidebar');
            const cb = contentBox();
            if (!side || !cb) return;
            const siteLeft = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-gap')) || 36;
            const want = Math.round(cb.left - side.getBoundingClientRect().width - 24);
            const on = want > siteLeft + 8 && getComputedStyle(side).position === 'fixed';
            document.documentElement.classList.toggle('vp-side-moved', on);
            if (on) document.documentElement.style.setProperty('--vp-side-left', want + 'px');
        }
        addEventListener('resize', placeSidebar);
        onDom(placeSidebar);
        placeSidebar();

        const railStats = rail.querySelector('.vp-stats'), railSince = rail.querySelector('.vp-stats-since');
        const seg = rail.querySelector('.vp-seg');
        const fmtNum = n => n >= 10000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace('.0', '') + 'к' : String(n);
        let statsPeriod = GM_getValue('vp_stats_tab', 'day'), statsNow = null;
        const DAY_MS = 864e5;
        function statsHistory() { try { return JSON.parse(GM_getValue(acctKey('vp_stats_hist'), '[]')); } catch (e) { return []; } }
        const STATS_TAG = 'ITDXT1 ', STATS_F = ['followers', 'following', 'posts', 'likes'];
        function statsPack(hist) {
            const a = [], put = n => { n = Math.max(0, Math.round(n)); while (n > 127) { a.push((n & 127) | 128); n = Math.floor(n / 128); } a.push(n); };
            let hr0 = 0;
            const prev = {};
            for (const h of hist) {
                const hr = Math.round(h.at / 36e5);
                put(hr - hr0); hr0 = hr;
                let mask = 0;
                STATS_F.forEach((f, i) => { if (typeof h[f] === 'number') mask |= 1 << i; });
                a.push(mask);
                STATS_F.forEach((f, i) => { if (!(mask & 1 << i)) return; const d = h[f] - (prev[f] || 0); put(d >= 0 ? d * 2 : -d * 2 - 1); prev[f] = h[f]; });
            }
            return sealB64(new Uint8Array(a));
        }
        function statsUnpack(t) {
            const b = openB64(t), out = [], prev = {};
            let o = 0, hr = 0;
            const get = () => { let n = 0, k = 1; while (o < b.length) { const x = b[o++]; n += (x & 127) * k; if (x < 128) return n; k *= 128; } throw new Error('обрыв'); };
            while (o < b.length) {
                hr += get();
                const mask = b[o++], h = { at: hr * 36e5 };
                STATS_F.forEach((f, i) => { if (!(mask & 1 << i)) return; const z = get(); prev[f] = (prev[f] || 0) + (z % 2 ? -(z + 1) / 2 : z / 2); h[f] = prev[f]; });
                out.push(h);
            }
            return out;
        }
        function statsMerge(a, b) {
            const out = [];
            [...a, ...b].filter(h => h && h.at && Date.now() - h.at < 40 * DAY_MS).sort((x, y) => x.at - y.at).forEach(h => {
                const l = out[out.length - 1];
                if (l && h.at - l.at < 36e5) STATS_F.forEach(f => { if (typeof l[f] !== 'number' && typeof h[f] === 'number') l[f] = h[f]; });
                else out.push({ ...h });
            });
            return out;
        }
        function statsForUpload(hist) {
            const days = new Set(), last = hist[hist.length - 1];
            return hist.filter(h => {
                const d = new Date(h.at).toDateString(), first = !days.has(d);
                days.add(d);
                return first || h === last || Date.now() - h.at < 3 * DAY_MS;
            });
        }
        async function statsSync(hist) {
            const me = (meData && meData.id) || (siteAuth.me && siteAuth.me.id);
            if (!me || Date.now() - (+GM_getValue(acctKey('vp_stats_sync_at'), 0) || 0) < 30 * 60e3) return hist;
            GM_setValue(acctKey('vp_stats_sync_at'), Date.now());
            const mine = (await allComments(STICKER_POST_ID)).filter(c => c.author && c.author.id === me && openText(c.content).startsWith(STATS_TAG));
            const cur = mine[0];
            let remote = [];
            if (cur) try { remote = statsUnpack(openText(cur.content).slice(STATS_TAG.length)); } catch (e) { remote = []; }
            const merged = statsMerge(hist, remote);
            const up = statsForUpload(merged);
            let text = STATS_TAG + statsPack(up);
            while (sealText(text).length > 990 && up.length > 2) { up.splice(1, 1); text = STATS_TAG + statsPack(up); }
            if (!cur || openText(cur.content) !== text) {
                const content = sealText(text);
                const res = cur
                    ? await editComment(cur.id, content)
                    : await sendComment(STICKER_POST_ID, content);
                if (!res.ok) throw new Error('статистика: запись ' + res.status);
            }
            return merged;
        }
        let likesPending = null;
        function myLikesTotal() {
            const c = GM_getValue('vp_likes_total', null);
            if (c && c.user === myUsername && Date.now() - c.at < 3 * 3600e3) return Promise.resolve(c.total);
            if (likesPending) return likesPending;
            likesPending = (async () => {
                let total = 0, cursor = null, pages = 0;
                do {
                    const res = await api(`/api/posts/user/${encodeURIComponent(myUsername)}?limit=50&sort=new` + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
                    if (!res.ok) throw new Error('посты: ' + res.status);
                    const j = await res.json(), d = j.data || j;
                    keepSitePosts(j);
                    (d.posts || []).forEach(p => { total += +p.likesCount || 0; });
                    cursor = (d.pagination && d.pagination.nextCursor) || d.nextCursor || d.cursor || null;
                    if (!(d.posts || []).length) break;
                } while (cursor && ++pages < 60);
                GM_setValue('vp_likes_total', { user: myUsername, at: Date.now(), total });
                return total;
            })().catch(e => { logErr('лайки всего', e); const c2 = GM_getValue('vp_likes_total', null); return c2 && c2.user === myUsername ? c2.total : null; })
                .finally(() => { likesPending = null; });
            return likesPending;
        }
        async function loadStats() {
            if (!myUsername) return setTimeout(loadStats, 1500);
            const d = meData && typeof meData.followersCount === 'number' ? meData : await hcData(myUsername, 2500);
            const now = {
                followers: pick(d && d.followersCount, d && d.followers_count, d && d.stats && d.stats.followers, d && typeof d.followers === 'number' ? d.followers : undefined),
                following: pick(d && d.followingCount, d && d.following_count, d && d.stats && d.stats.following, d && typeof d.following === 'number' ? d.following : undefined)
            };
            if (d && typeof d.postsCount === 'number') now.posts = d.postsCount;
            const likes = await myLikesTotal();
            if (typeof likes === 'number') now.likes = likes;
            const hist = statsHistory().filter(h => Date.now() - h.at < 40 * DAY_MS);
            if (!hist.length || Date.now() - hist[hist.length - 1].at > 6 * 3600e3) hist.push({ at: Date.now(), ...now });
            GM_setValue(acctKey('vp_stats_hist'), JSON.stringify(hist));
            statsNow = now;
            renderStats();
            statsSync(hist).then(m => { if (m !== hist) { GM_setValue(acctKey('vp_stats_hist'), JSON.stringify(m)); renderStats(); } }).catch(e => logErr('статистика: синхронизация', e));
        }
        function renderStats() {
            seg.classList.toggle('vp-month', statsPeriod === 'month');
            seg.querySelectorAll('button').forEach(b => b.classList.toggle('vp-on', b.dataset.p === statsPeriod));
            if (!statsNow) return;
            const span = statsPeriod === 'month' ? 30 * DAY_MS : DAY_MS;
            const hist = statsHistory();
            const now = Date.now();
            const pickBase = list => {
                const old = list.filter(h => now - h.at >= 3600e3);
                if (!old.length) return list[0] || null;
                return old.reduce((b, h) => Math.abs(now - h.at - span) < Math.abs(now - b.at - span) ? h : b);
            };
            const base = pickBase(hist) || statsNow;
            const off = base.at && Math.abs(now - base.at - span) > span * 0.1;
            railSince.textContent = off ? 'с ' + new Date(base.at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
                + ', ' + new Date(base.at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';
            const rows = [['followers', 'подписчиков'], ['following', 'подписок'], ['posts', 'постов'], ['likes', 'лайков']].filter(([k]) => typeof statsNow[k] === 'number');
            if (!rows.length) { railStats.innerHTML = '<div class="vp-menu-note">Сайт не отдал числа</div>'; return; }
            railStats.innerHTML = '';
            const baseFor = k => typeof base[k] === 'number' ? base : pickBase(hist.filter(h => typeof h[k] === 'number'));
            rows.forEach(([k, label]) => {
                const b = baseFor(k);
                const diff = b ? statsNow[k] - b[k] : 0;
                const row = document.createElement('div');
                if (b && b !== base && b.at) row.title = 'изменение с ' + new Date(b.at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
                    + ', ' + new Date(b.at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                row.className = 'vp-stat';
                row.innerHTML = '<span class="vp-stat-val"></span><span class="vp-stat-label"></span><span class="vp-stat-diff"></span>';
                row.children[0].textContent = fmtNum(statsNow[k]);
                row.children[1].textContent = label;
                const df = row.children[2];
                df.textContent = diff > 0 ? '+' + fmtNum(diff) : diff < 0 ? '−' + fmtNum(-diff) : '0';
                df.classList.add(diff > 0 ? 'vp-up' : diff < 0 ? 'vp-down' : 'vp-same');
                railStats.appendChild(row);
            });
        }
        seg.addEventListener('click', e => {
            const b = e.target.closest('button');
            if (!b || b.dataset.p === statsPeriod) return;
            statsPeriod = b.dataset.p;
            GM_setValue('vp_stats_tab', statsPeriod);
            renderStats();
        });
        renderStats();
        loadStats();

        const railClub = rail.querySelector('.vp-club');
        let clubShown = '';
        function openProfile(login) {
            history.pushState({}, '', '/@' + login);
            dispatchEvent(new PopStateEvent('popstate'));
        }
        function paintClub() {
            railClub.querySelectorAll('.vp-club-row').forEach(row => {
                const n = row.dataset.login, name = row.querySelector('.vp-club-name'), av = row.querySelector('.vp-club-ava');
                if (n === myUsername) { name.classList.add('vp-my-nick', 'vp-my-nick-box'); av.classList.add('my-avatar-glow'); return; }
                const look = (verifiedInfo(n) || {}).look;
                const put = (el, attr, val) => { if (val) { if (el.getAttribute(attr) !== val) el.setAttribute(attr, val); } else el.removeAttribute(attr); };
                put(name, 'data-vp-look', look && look.n);
                put(name, 'data-vp-look-glow', look && look.g[0] === '1' && look.n);
                put(av, 'data-vp-look-av', look && look.g[1] === '1' && look.n);
            });
        }
        async function renderClub() {
            const names = verifiedNames();
            if (myUsername && !names.some(n => n.toLowerCase() === myUsername.toLowerCase())) names.push(myUsername);
            const key = names.sort().join();
            if (key === clubShown) { paintClub(); return; }
            clubShown = key;
            rail.querySelector('.vp-club-count').textContent = names.length || '';
            if (!names.length) { railClub.innerHTML = '<div class="vp-menu-note">Пока никого</div>'; return; }
            const people = await Promise.all(names.map(async n => {
                const v = verifiedInfo(n);
                return { n, d: v && (v.displayName || v.avatar) ? v : n === myUsername && meData ? meData : await hcData(n) };
            }));
            railClub.innerHTML = '';
            people.sort((a, b) => (a.n === myUsername ? -1 : b.n === myUsername ? 1 : a.n.localeCompare(b.n))).forEach(({ n, d }) => {
                const row = document.createElement('div');
                row.className = 'vp-club-row';
                row.dataset.login = n;
                row.innerHTML = '<div class="vp-club-ava"></div><div class="vp-club-names"><span class="vp-club-name"></span><span class="vp-club-login"></span></div>';
                const ava = pick(d && d.avatar && (d.avatar.url || d.avatar), d && d.avatarUrl, '👤');
                const av = row.firstChild;
                if (/^https?:|^\//.test(ava)) { const img = document.createElement('img'); img.src = ava; av.appendChild(img); } else av.textContent = ava;
                row.querySelector('.vp-club-name').textContent = pick(d && d.displayName, d && d.display_name, n) + (n === myUsername ? ' (ты)' : '');
                row.querySelector('.vp-club-login').textContent = '@' + n;
                row.onclick = () => openProfile(n);
                railClub.appendChild(row);
            });
            paintClub();
            paintOnline();
        }
        const CLUB_TTL = 5 * 60 * 1000, CLUB_OFF_TTL = 20 * 60 * 1000, CLUB_GAP = 30e3, CLUB_LIVE = 30 * 60e3;
        const clubOnline = new Map();
        function clubOnlineLoad() {
            const s = GM_getValue('vp_club_online', {}) || {};
            for (const n in s) if (s[n] && (!clubOnline.has(n) || clubOnline.get(n).at < s[n].at)) clubOnline.set(n, s[n]);
        }
        clubOnlineLoad();
        const clubSeenText = t => {
            const d = new Date(t);
            if (!t || isNaN(d)) return '';
            const h = d.toTimeString().slice(0, 5);
            return 'был(а) в сети ' + (d.toDateString() === new Date().toDateString() ? 'в ' + h : `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')} в ${h}`);
        };
        function paintOnline() {
            const rows = [...railClub.querySelectorAll('.vp-club-row')];
            if (!rows.length) return;
            let on = 0;
            rows.forEach(row => {
                const n = row.dataset.login, st = n === myUsername ? { on: true } : clubOnline.get(n);
                const live = !!(st && st.on && (n === myUsername || Date.now() - (st.at || 0) < CLUB_LIVE)), tip = st ? (live ? 'в сети' : clubSeenText(st.seen)) : '';
                if (live) on++;
                if (live !== row.hasAttribute('data-online')) row.toggleAttribute('data-online', live);
                if (row.title !== tip) row.title = tip;
            });
            const me = r => r.dataset.login === myUsername, live = r => r.hasAttribute('data-online');
            const order = rows.slice().sort((a, b) => me(b) - me(a) || live(b) - live(a) || a.dataset.login.localeCompare(b.dataset.login));
            if (order.some((r, i) => r !== rows[i])) order.forEach(r => railClub.appendChild(r));
            const cnt = rail.querySelector('.vp-club-count'), total = rows.length;
            const others = on - (rows.some(me) ? 1 : 0);
            const html = others > 0 ? `<span class="vp-club-dot"></span>${on} · ${total}` : String(total), tip = others > 0 ? `В сети: ${on} из ${total}` : '';
            if (cnt.innerHTML !== html) cnt.innerHTML = html;
            if (cnt.title !== tip) cnt.title = tip;
        }
        let clubPolling = false, clubPolledAt = 0, clubFirst = true;
        async function clubCheck(n) {
            const r = await api('/api/users/' + encodeURIComponent(n)).catch(() => null);
            if (!r || !r.ok) return;
            const j = await r.json().catch(() => null), d = j && (j.data || j.user || j);
            if (d && typeof d === 'object') clubOnline.set(n, { on: !!d.online, seen: d.lastSeen || null, at: Date.now() });
        }
        async function clubPollOnline() {
            if (clubPolling || document.hidden || apiPaused() || !railClub.isConnected || !railClub.getClientRects().length) return;
            clubOnlineLoad();
            const box = railClub.getBoundingClientRect(), now = Date.now();
            const seen = r => { const q = r.getBoundingClientRect(); return q.bottom > box.top && q.top < box.bottom; };
            const age = n => now - ((clubOnline.get(n) || {}).at || 0), late = n => age(n) - ((clubOnline.get(n) || {}).on === false ? CLUB_OFF_TTL : CLUB_TTL);
            const due = [...railClub.querySelectorAll('.vp-club-row')].filter(r => r.dataset.login !== myUsername)
                .map(r => ({ n: r.dataset.login, v: seen(r) })).filter(x => late(x.n) > 0).sort((a, b) => b.v - a.v || late(b.n) - late(a.n));
            if (!due.length) return;
            const fast = clubFirst ? due.map(x => x.n) : [];
            if (!fast.length && now < (+GM_getValue('vp_club_next', 0) || 0)) return;
            clubPolling = true; clubPolledAt = now; clubFirst = false;
            try {
                for (let i = 0; i < fast.length; i += 4) {
                    if (i) { paintOnline(); await new Promise(r => setTimeout(r, 2000)); if (document.hidden || apiPaused()) break; }
                    await Promise.all(fast.slice(i, i + 4).map(clubCheck));
                }
                if (!fast.length) await clubCheck(due[0].n);
                GM_setValue('vp_club_next', Date.now() + CLUB_GAP);
            } finally {
                paintOnline();
                clubPolling = false;
                const keep = {};
                for (const [n, v] of clubOnline) if (Date.now() - v.at < 24 * 3600e3) keep[n] = v;
                GM_setValue('vp_club_online', keep);
            }
        }
        const clubTick = () => Promise.resolve(renderClub()).then(() => clubPollOnline()).catch(e => logErr('клуб: в сети', e));
        setTimeout(() => Promise.resolve(renderClub()).catch(e => logErr('клуб', e)), 2500);
        setTimeout(() => clubPollOnline(), 4000);
        setInterval(clubTick, 60 * 1000);
        setInterval(() => clubPollOnline(), 5000);
        let clubScrollT = 0;
        railClub.addEventListener('scroll', () => { clearTimeout(clubScrollT); clubScrollT = setTimeout(() => clubPollOnline(), 400); }, { passive: true });
        document.addEventListener('visibilitychange', () => { if (!document.hidden) clubPollOnline(); });
        new IntersectionObserver(es => { if (es.some(e => e.isIntersecting) && Date.now() - clubPolledAt > 30e3) clubPollOnline(); }).observe(railClub);

        const gamesList = rail.querySelector('.vp-games-list');
        const bestText = g => {
            const v = GM_getValue(acctKey(g.best), 0);
            if (!v) return 'не играл';
            return g.id === 'mines' ? `лучшее ${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` : `рекорд ${v}`;
        };
        function renderGamesMenu() {
            gamesList.textContent = '';
            for (const g of GAMES) {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'vp-game-row';
                b.innerHTML = `<span class="vp-game-ico">${svgIcon(g.icon, 18)}</span><span class="vp-game-name"></span><span class="vp-game-best"></span>`;
                b.querySelector('.vp-game-name').textContent = g.name;
                b.querySelector('.vp-game-best').textContent = bestText(g);
                b.addEventListener('click', () => openGames(g.id));
                gamesList.appendChild(b);
            }
        }
        const gw = { el: null, cur: null, id: GM_getValue('vp_game_last', 'snake') };
        const gamesCss = addCss(`
        .vp-games-list { display: flex; flex-direction: column; gap: 4px; }
        .vp-game-row { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border: 0; border-radius: 18px; cursor: pointer;
            background: none; color: var(--text-primary, #fff); font: inherit; font-size: 15px; font-weight: 600; text-align: left; transition: background-color .15s; }
        .vp-game-row:hover { background: var(--bg-hover, rgba(255, 255, 255, .08)); }
        .vp-game-ico { width: 34px; height: 34px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px;
            background: var(--bg-hover, rgba(255, 255, 255, .08)); color: var(--vp-accent); }
        .vp-game-name { flex: 1 1 auto; }
        .vp-game-best { font-size: 12px; font-weight: 500; color: var(--text-secondary); white-space: nowrap; }
        .vp-games { position: fixed; inset: 0; z-index: 2147483050; display: flex; align-items: center; justify-content: center; padding: 12px;
            background: rgba(0, 0, 0, .55); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); animation: vpGamesIn .18s ease-out; }
        @keyframes vpGamesIn { from { opacity: 0; } }
        .vp-games-win { display: flex; flex-direction: column; gap: 12px; width: min(760px, 100%); height: min(900px, 100%); max-height: 100%; padding: 16px; border-radius: 32px; box-sizing: border-box;
            background: var(--block-bg); color: var(--text-primary, #fff); border: 1px solid var(--border-color, rgba(255, 255, 255, .12));
            box-shadow: 0 24px 64px rgba(0, 0, 0, .5); overflow: auto; }
        .vp-games-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        @media (max-width: 520px) { .vp-games-win { padding: 12px; border-radius: 26px; } .vp-games-tab { padding: 7px 10px; }
            .vp-games-score { order: 3; flex: 1 0 100%; margin: 0; text-align: center; } .vp-g-side { min-width: 70px; font-size: 13px; } }
        .vp-games-tabs { display: flex; gap: 4px; padding: 4px; border-radius: 9999px; background: var(--glass-bg, rgba(35, 35, 35, .6)); }
        .vp-games-tab { border: 0; border-radius: 9999px; padding: 7px 14px; cursor: pointer; background: none; font: inherit; font-size: 14px; font-weight: 500;
            color: var(--text-secondary); }
        .vp-games-tab.vp-on { color: var(--text-primary, #fff); background: rgba(255, 255, 255, .1); box-shadow: inset 0 0 0 1px var(--vp-accent); }
        .vp-games-score { margin-left: auto; font-size: 14px; font-weight: 600; color: var(--text-secondary); white-space: nowrap; }
        .vp-games-x { width: 36px; height: 36px; border: 0; border-radius: 50%; cursor: pointer; background: rgba(255, 255, 255, .08); color: inherit;
            display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }
        .vp-games-body { display: flex; justify-content: center; align-items: flex-start; gap: 16px; min-height: 0; flex: 1 1 auto; overflow: hidden; }
        .vp-games-body > .vp-games-leads { max-height: 100%; overflow-y: auto; }
        .vp-games-hint { font-size: 12px; text-align: center; color: var(--text-secondary); }
        .vp-g-canvas { display: block; border-radius: 20px; background: var(--bg-primary, #000); touch-action: none; outline: none; cursor: pointer; }
        .vp-g-side { display: flex; flex-direction: column; gap: 10px; min-width: 110px; font-size: 14px; }
        .vp-g-side b { font-size: 20px; }
        .vp-g-pad { display: none; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .vp-g-pad button { width: 56px; height: 48px; border: 0; border-radius: 14px; font-size: 20px; cursor: pointer; background: rgba(255, 255, 255, .1); color: inherit;
            touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
        .vp-g-pad button:active { background: rgba(255, 255, 255, .22); }
        @media (pointer: coarse) { .vp-g-pad { display: flex; } }
        .vp-mines { display: grid; gap: 3px; user-select: none; -webkit-user-select: none; touch-action: manipulation; }
        .vp-mine { width: var(--vp-mc, 36px); height: var(--vp-mc, 36px); border: 0; border-radius: 8px; padding: 0; cursor: pointer; font: 700 calc(var(--vp-mc, 36px) * .5)/1 system-ui, sans-serif;
            background: rgba(255, 255, 255, .12); color: #fff; -webkit-tap-highlight-color: transparent; }
        .vp-mine:hover { background: rgba(255, 255, 255, .2); }
        .vp-mine.vp-open { background: rgba(255, 255, 255, .04); cursor: default; }
        .vp-mine.vp-near { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 35%, transparent); }
        .vp-mine.vp-open.vp-near { background-color: color-mix(in srgb, var(--vp-accent) 5%, rgba(255, 255, 255, .04)); }
        .vp-mine.vp-boom { background: #c0392b; }
        .vp-mine[data-n="1"] { color: #5dade2; } .vp-mine[data-n="2"] { color: #58d68d; } .vp-mine[data-n="3"] { color: #ec7063; }
        .vp-mine[data-n="4"] { color: #af7ac5; } .vp-mine[data-n="5"] { color: #f5b041; } .vp-mine[data-n="6"] { color: #48c9b0; }
        .vp-mine[data-n="7"] { color: #fff; } .vp-mine[data-n="8"] { color: #aab7b8; }
        .vp-mines-bar { display: flex; gap: 8px; justify-content: center; align-items: center; margin-bottom: 10px; font-size: 14px; }
        .vp-mines-bar button { border: 0; border-radius: 9999px; padding: 7px 14px; cursor: pointer; font: inherit; background: rgba(255, 255, 255, .1); color: inherit; }
        .vp-mines-bar button.vp-on { box-shadow: inset 0 0 0 1px var(--vp-accent); }
        .vp-mines-msg { text-align: center; margin-top: 10px; font-weight: 600; min-height: 20px; }
        .vp-mines-wrap { position: relative; }
        .vp-mines-help { position: absolute; inset: 0; z-index: 2; overflow-y: auto; padding: 16px 18px; border-radius: 14px; font-size: 14px; line-height: 1.45;
            background: color-mix(in srgb, var(--block-bg) 96%, transparent); color: var(--text-primary, #fff); }
        .vp-mines-help[hidden] { display: none; }
        .vp-mines-help b { display: block; font-size: 16px; margin-bottom: 8px; }
        .vp-mines-help ul { margin: 0; padding-left: 20px; list-style: disc; }
        .vp-mines-help li { margin: 0 0 7px; }
        .vp-mines-help .vp-n { font-weight: 700; color: #5dade2; }
        .vp-games-leads { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; width: 100%; }
        .vp-games-leads section { padding: 12px; border-radius: 20px; background: rgba(255, 255, 255, .04); min-width: 0; }
        .vp-games-lead-t { font-weight: 600; font-size: 14px; margin-bottom: 6px; }
        .vp-games-lead-list { display: grid; gap: 2px; max-height: min(52vh, 420px); overflow-y: auto; scrollbar-width: thin; }
        .vp-games-lead-row { display: grid; grid-template-columns: 26px 1fr auto; gap: 8px; padding: 4px 10px; border-radius: 10px; font-size: 14px; }
        .vp-games-lead-row > span:first-child { color: var(--text-secondary); }
        .vp-games-lead-row > span:nth-child(2) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-games-lead-row.vp-me { background: rgba(255, 255, 255, .08); box-shadow: inset 0 0 0 1px var(--vp-accent); }
        @media (prefers-reduced-motion: reduce) { .vp-games { animation: none; } }
    `);
        const gameCtx = () => ({ accent: getComputedStyle(document.documentElement).getPropertyValue('--vp-accent').trim() || '#00ff88' });
        function fitCanvas(cv, cols, rows, sideW = 0, extraH = 0) {
            const body = gw.el && gw.el.querySelector('.vp-games-body');
            const winW = (body ? body.clientWidth : Math.min(760, innerWidth - 24) - 32) - sideW, winH = (body ? body.clientHeight : innerHeight - 140) - extraH;
            const cell = Math.max(10, Math.floor(Math.min(winW / cols, winH / rows)));
            const dpr = devicePixelRatio || 1;
            cv.style.width = cols * cell + 'px'; cv.style.height = rows * cell + 'px';
            cv.width = Math.round(cols * cell * dpr); cv.height = Math.round(rows * cell * dpr);
            return cell * dpr;
        }

        const repRng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
        const repNew = g => ({ g, seed: (Math.random() * 4294967296) >>> 0, ev: [] });
        function repSave(rec, score) {
            if (!rec || rec.ev.length > 30000) return;
            GM_setValue(acctKey('vp_rep_' + rec.g), { score, seed: rec.seed, ev: rec.ev.slice(), at: Date.now(), up: false });
        }
        function snakeGame(setScore, rp) {
            const el = document.createElement('div');
            const cv = document.createElement('canvas');
            cv.className = 'vp-g-canvas'; cv.tabIndex = 0;
            const hint = document.createElement('div');
            hint.className = 'vp-games-hint'; hint.style.marginTop = '10px';
            hint.textContent = IS_PHONE ? 'Свайп — поворот · нажми — пауза' : 'Стрелки или WASD · пробел — пауза';
            el.append(cv, hint);
            const g = cv.getContext('2d'), CELLS = 16, STEP = 115;
            let snake, prev, dir, queue, food, on = false, dead = false, score = 0, last = 0, raf = 0, msg = 'Змейка\nнажми или стрелку', cell = 0;
            let best = GM_getValue(acctKey('vp_snake_best'), 0);
            const show = () => setScore(rp ? `счёт ${score}` : `${score} · рекорд ${best}`);
            let rng = Math.random, rec = null, steps = 0, ei = 0;
            const DIRV = [[0, -1], [1, 0], [0, 1], [-1, 0]];
            const rnd = () => ({ x: rng() * CELLS | 0, y: rng() * CELLS | 0, ch: MATRIX_CHARS[rng() * MATRIX_CHARS.length | 0] });
            function reset() {
                rng = repRng(rp ? rp.seed : (rec = repNew('s')).seed); steps = 0; ei = 0;
                snake = [{ x: 7, y: 11 }, { x: 6, y: 11 }, { x: 5, y: 11 }];
                prev = snake.map(p => ({ ...p }));
                dir = { x: 1, y: 0 }; queue = []; score = 0;
                do food = rnd(); while (snake.some(p => p.x === food.x && p.y === food.y));
                show();
            }
            function draw(now = performance.now()) {
                const { accent } = gameCtx(), px = cell * CELLS;
                const t = on ? Math.min(1, (now - last) / STEP) : 1;
                g.clearRect(0, 0, px, px);
                g.fillStyle = 'rgba(255, 255, 255, .035)';
                for (let i = 0; i < CELLS; i++) for (let j = 0; j < CELLS; j++) if ((i + j) % 2) g.fillRect(i * cell, j * cell, cell, cell);
                g.textAlign = 'center'; g.textBaseline = 'middle';
                const pulse = 0.85 + 0.15 * Math.sin(now / 180);
                g.shadowColor = accent; g.shadowBlur = cell * 0.6; g.fillStyle = '#fff';
                g.font = `bold ${Math.round(cell * 0.72 * pulse)}px monospace`;
                g.fillText(food.ch, (food.x + .5) * cell, (food.y + .5) * cell);
                g.font = `bold ${Math.round(cell * 0.6)}px monospace`;
                for (let i = snake.length - 1; i >= 0; i--) {
                    const a = prev[i] || snake[i], b = snake[i];
                    const wrap = Math.abs(a.x - b.x) > 1 || Math.abs(a.y - b.y) > 1;
                    const x = (wrap ? b.x : a.x + (b.x - a.x) * t) * cell, y = (wrap ? b.y : a.y + (b.y - a.y) * t) * cell;
                    const k = i / Math.max(1, snake.length - 1);
                    g.globalAlpha = 1 - k * 0.55; g.shadowBlur = i ? 0 : cell * 0.5; g.fillStyle = i ? accent : '#fff';
                    const pad = cell * (i ? 0.1 + k * 0.06 : 0.06);
                    g.beginPath(); g.roundRect(x + pad, y + pad, cell - pad * 2, cell - pad * 2, cell * 0.28); g.fill();
                    if (i) { g.fillStyle = 'rgba(0, 0, 0, .55)'; g.fillText(MATRIX_CHARS[(b.x * 7 + b.y * 13 + i) % MATRIX_CHARS.length], x + cell / 2, y + cell / 2); }
                }
                g.globalAlpha = 1; g.shadowBlur = 0;
                if (msg) {
                    g.fillStyle = 'rgba(0, 0, 0, .55)'; g.fillRect(0, 0, px, px);
                    g.fillStyle = '#fff'; g.font = `600 ${Math.round(px * 0.06)}px system-ui, sans-serif`;
                    msg.split('\n').forEach((line, i, all) => g.fillText(line, px / 2, px / 2 + (i - (all.length - 1) / 2) * px * 0.09));
                }
            }
            function step() {
                steps++;
                if (queue.length) dir = queue.shift();
                const head = { x: (snake[0].x + dir.x + CELLS) % CELLS, y: (snake[0].y + dir.y + CELLS) % CELLS };
                if (snake.slice(0, -1).some(p => p.x === head.x && p.y === head.y)) {
                    on = false;
                    if (!rp && score > best) { best = score; GM_setValue(acctKey('vp_snake_best'), best); repSave(rec, score); renderGamesMenu(); gamesRecord(); }
                    msg = rp ? `Съел себя · ${score}` : `Съел себя · ${score}\nнажми — ещё раз`;
                    show(); draw(); dead = true;
                    return;
                }
                prev = snake.map(p => ({ ...p }));
                snake.unshift(head);
                if (head.x === food.x && head.y === food.y) {
                    score++; if (!rp) uiSound('click'); show();
                    do food = rnd(); while (snake.some(p => p.x === food.x && p.y === food.y));
                } else snake.pop();
            }
            function loop(now) {
                raf = 0;
                if (!on) return;
                while (on && now - last >= STEP) { last += STEP; step(); if (now - last > STEP * 3) last = now; }
                if (on) { draw(now); raf = requestAnimationFrame(loop); }
            }
            function start() {
                if (!snake || dead) { dead = false; reset(); }
                on = true; msg = '';
                last = performance.now();
                if (!raf) raf = requestAnimationFrame(loop);
            }
            function pause() { if (!on) return; on = false; msg = 'Пауза\nнажми — дальше'; draw(); }
            function turn(x, y) {
                const tail = queue.length ? queue[queue.length - 1] : dir;
                if (rp || (x === -tail.x && y === -tail.y) || (x === tail.x && y === tail.y)) return;
                if (queue.length < 3) { queue.push({ x, y }); if (rec && rec.ev.length < 30000) rec.ev.push([steps, DIRV.findIndex(d => d[0] === x && d[1] === y)]); }
                if (!on) start();
            }
            const TURN = {
                arrowup: [0, -1], w: [0, -1], ц: [0, -1], arrowdown: [0, 1], s: [0, 1], ы: [0, 1],
                arrowleft: [-1, 0], a: [-1, 0], ф: [-1, 0], arrowright: [1, 0], d: [1, 0], в: [1, 0]
            };
            function key(e) {
                const k = e.key.toLowerCase();
                if (k === ' ' || k === 'p' || k === 'з') { e.preventDefault(); on ? pause() : start(); return; }
                const t = TURN[k];
                if (!t) return;
                e.preventDefault();
                if (e.repeat) return;
                turn(t[0], t[1]);
            }
            let sx = 0, sy = 0, swiped = false;
            cv.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; swiped = false; cv.setPointerCapture(e.pointerId); });
            cv.addEventListener('pointermove', e => {
                if (swiped || e.buttons === 0 && e.pointerType === 'mouse') return;
                const dx = e.clientX - sx, dy = e.clientY - sy;
                if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
                swiped = true;
                Math.abs(dx) > Math.abs(dy) ? turn(Math.sign(dx), 0) : turn(0, Math.sign(dy));
            });
            cv.addEventListener('pointerup', () => { if (!swiped && !rp) (on ? pause() : start()); });
            function resize() { cell = fitCanvas(cv, CELLS, CELLS, 0, 34); draw(); }
            function repTo(vt) {
                if (!on && !dead) { on = true; msg = ''; }
                const target = Math.min(Math.floor(vt / STEP), 500000);
                while (!dead && steps < target) {
                    while (ei < rp.ev.length && rp.ev[ei][0] <= steps) { const d = DIRV[rp.ev[ei++][1]] || DIRV[1]; if (queue.length < 3) queue.push({ x: d[0], y: d[1] }); }
                    step();
                }
                if (!rp.instant) { last = performance.now() - STEP; draw(); }
            }
            reset(); msg = rp ? '' : 'Змейка\nнажми или стрелку';
            el._vpTest = () => ({ head: snake[0], dir, queue: queue.length, on, score, food, len: snake.length, dead });
            return { el, key: e => { if (!rp) key(e); }, pause, resize, repTo, repRes: () => ({ score, done: dead }), destroy() { on = false; cancelAnimationFrame(raf); } };
        }

        function minesGame(setScore, rp) {
            const W = 10, H = 10, M = 15;
            const el = document.createElement('div');
            el.innerHTML = `<div class="vp-mines-bar"><button type="button" data-a="new">Новая игра</button><button type="button" data-a="flag">🚩 флажки</button><button type="button" data-a="help">❓ Как играть</button></div>
            <div class="vp-mines-wrap"><div class="vp-mines"></div><div class="vp-mines-help" hidden><b>Как играть в сапёра</b><ul>
            <li>На поле 10×10 спрятано 15 мин. Цель — открыть все клетки без мин.</li>
            <li>Нажми на клетку, чтобы открыть её. Первый ход всегда безопасный.</li>
            <li>Цифра — сколько мин в 8 клетках вокруг неё. Щёлкни по клетке колёсиком мыши — вокруг неё останется рамка 3×3, так видно зону цифры (ещё щелчок колёсиком — убрать). Например, <span class="vp-n">1</span> — ровно одна мина где-то рядом.</li>
            <li>Пустая клетка — мин вокруг нет, соседи откроются сами.</li>
            <li>Уверен, что тут мина, — поставь флажок: правая кнопка мыши, долгое нажатие на телефоне или режим «🚩 флажки».</li>
            <li>Вокруг цифры уже столько флажков, сколько она показывает, — нажми на цифру, и откроются остальные соседи.</li>
            <li>Открыл мину — проигрыш. Открыл всё без мин — победа, время уходит в «Топ задротов». Чем быстрее, тем выше.</li>
            <li>Новая игра — кнопка сверху или клавиша R.</li></ul></div></div><div class="vp-mines-msg"></div>`;
            const grid = el.querySelector('.vp-mines'), msgEl = el.querySelector('.vp-mines-msg'), flagBtn = el.querySelector('[data-a="flag"]');
            grid.style.gridTemplateColumns = `repeat(${W}, auto)`;
            let cells, first, over, opened, flags, t0 = 0, timer = 0, flagMode = false, rec = null, rng = Math.random, repNow = 0, nowT = null, ei = 0, won = false;
            const nb = i => { const x = i % W, y = i / W | 0, out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if ((dx || dy) && nx >= 0 && ny >= 0 && nx < W && ny < H) out.push(ny * W + nx); } return out; };
            const secs = () => rp ? Math.floor(repNow / 1000) : nowT !== null ? Math.floor(nowT / 1000) : t0 ? Math.floor((performance.now() - t0) / 1000) : 0;
            const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
            const show = () => { const b = rp ? 0 : GM_getValue(acctKey('vp_mines_best'), 0); setScore(`💣 ${M - flags} · ${fmt(secs())}` + (b ? ` · лучшее ${fmt(b)}` : '')); };
            function userAct(i, fl) {
                if (rp || over) return;
                const t = t0 ? Math.round(performance.now() - t0) : 0;
                if (fl && cells[i].open) return;
                if (rec && rec.ev.length < 30000) rec.ev.push([t, fl ? 1 : 0, i]);
                nowT = t0 ? t : null;
                fl ? flag(i) : open(i);
                nowT = null;
            }
            function reset() {
                rng = repRng(rp ? rp.seed : (rec = repNew('m')).seed); ei = 0; won = false;
                cells = Array.from({ length: W * H }, () => ({ mine: false, n: 0, open: false, flag: false }));
                first = true; over = false; opened = 0; flags = 0; t0 = 0; clearInterval(timer); msgEl.textContent = '';
                grid.textContent = '';
                cells.forEach((c, i) => {
                    const b = document.createElement('button');
                    b.type = 'button'; b.className = 'vp-mine'; b.dataset.i = i;
                    c.b = b;
                    let lp = 0, longed = false;
                    b.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { longed = false; lp = setTimeout(() => { longed = true; userAct(i, true); }, 400); } });
                    const cancel = () => clearTimeout(lp);
                    b.addEventListener('pointerup', cancel); b.addEventListener('pointerleave', cancel);
                    b.addEventListener('click', () => { if (longed) { longed = false; return; } userAct(i, flagMode); });
                    b.addEventListener('contextmenu', e => { e.preventDefault(); userAct(i, true); });
                    grid.appendChild(b);
                });
                show();
            }
            function paint(c) {
                const b = c.b;
                b.classList.toggle('vp-open', c.open);
                b.textContent = c.open ? (c.mine ? '💣' : c.n || '') : c.flag ? '🚩' : '';
                if (c.open && !c.mine && c.n) b.dataset.n = c.n; else delete b.dataset.n;
            }
            function plant(safe) {
                const ban = new Set([safe, ...nb(safe)]);
                let left = M;
                while (left) { const i = rng() * W * H | 0; if (!ban.has(i) && !cells[i].mine) { cells[i].mine = true; left--; } }
                cells.forEach((c, i) => { c.n = nb(i).filter(j => cells[j].mine).length; });
                t0 = rp ? 1 : performance.now();
                if (!rp) timer = setInterval(show, 1000);
            }
            function end(win, boom) {
                over = true; clearInterval(timer);
                cells.forEach(c => { if (c.mine && !c.flag) { c.open = !win; if (win) c.flag = true; } paint(c); });
                if (boom != null) cells[boom].b.classList.add('vp-boom');
                const s = secs();
                if (win) {
                    won = true;
                    const b = GM_getValue(acctKey('vp_mines_best'), 0);
                    if (!rp && (!b || s < b)) { GM_setValue(acctKey('vp_mines_best'), s); repSave(rec, s); renderGamesMenu(); gamesRecord(); }
                    msgEl.textContent = `Разминировано за ${fmt(s)}!`;
                } else msgEl.textContent = 'Бум! Нажми «Новая игра»';
                show();
            }
            function open(i) {
                if (over) return;
                const c = cells[i];
                if (c.flag) return;
                if (first) { first = false; plant(i); }
                if (c.open) {
                    if (c.n && nb(i).filter(j => cells[j].flag).length === c.n) nb(i).forEach(j => { if (!cells[j].open && !cells[j].flag) open(j); });
                    return;
                }
                if (c.mine) { c.open = true; paint(c); return end(false, i); }
                const stack = [i];
                while (stack.length) {
                    const j = stack.pop(), d = cells[j];
                    if (d.open || d.flag) continue;
                    d.open = true; opened++; paint(d);
                    if (!d.n) nb(j).forEach(k => { if (!cells[k].open && !cells[k].mine) stack.push(k); });
                }
                if (!rp) uiSound('click');
                if (opened === W * H - M) end(true);
            }
            function flag(i) {
                const c = cells[i];
                if (over || c.open) return;
                c.flag = !c.flag; flags += c.flag ? 1 : -1;
                paint(c); show();
            }
            let near = [];
            const unhot = () => { near.forEach(b => b.classList.remove('vp-near')); near = []; };
            let hotI = -1;
            grid.addEventListener('mousedown', e => {
                if (e.button !== 1) return;
                e.preventDefault();
                const b = e.target.closest('.vp-mine');
                const i = b ? +b.dataset.i : -1;
                unhot();
                if (i < 0 || i === hotI) { hotI = -1; return; }
                hotI = i;
                near = [i, ...nb(i)].map(j => cells[j].b);
                near.forEach(x => x.classList.add('vp-near'));
            });
            grid.addEventListener('auxclick', e => { if (e.button === 1) e.preventDefault(); });
            el.querySelector('[data-a="new"]').addEventListener('click', () => { if (rp) return; unhot(); hotI = -1; reset(); });
            const helpEl = el.querySelector('.vp-mines-help'), helpBtn = el.querySelector('[data-a="help"]');
            helpBtn.addEventListener('click', () => { helpEl.hidden = !helpEl.hidden; helpBtn.classList.toggle('vp-on', !helpEl.hidden); });
            helpEl.addEventListener('click', () => { helpEl.hidden = true; helpBtn.classList.remove('vp-on'); });
            flagBtn.addEventListener('click', () => { flagMode = !flagMode; flagBtn.classList.toggle('vp-on', flagMode); });
            function resize() {
                const body = gw.el && gw.el.querySelector('.vp-games-body');
                const side = Math.min(body ? body.clientWidth : innerWidth - 56, (body ? body.clientHeight : innerHeight - 180) - 90);
                grid.style.setProperty('--vp-mc', Math.max(24, Math.floor((side - 3 * (W - 1)) / W)) + 'px');
            }
            function repTo(vt) {
                while (!over && ei < rp.ev.length && rp.ev[ei][0] <= vt) { const [t, fl, i] = rp.ev[ei++]; repNow = t; if (fl) { if (!cells[i].open) flag(i); } else open(i); }
                if (!rp.instant) show();
            }
            reset();
            el._vpTest = () => ({ cells: cells.map(c => ({ mine: c.mine, open: c.open, flag: c.flag })), over, first });
            return { el, key: e => { if (!rp && (e.key === 'F2' || e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'к')) { e.preventDefault(); reset(); } }, pause() { }, resize, repTo,
                repRes: () => ({ score: won ? secs() : 0, win: won, done: over || ei >= rp.ev.length }), destroy() { clearInterval(timer); } };
        }

        function tetrisGame(setScore, rp) {
            const COLS = 10, ROWS = 20;
            const SHAPES = {
                I: [[1, 1, 1, 1]], O: [[1, 1], [1, 1]], T: [[0, 1, 0], [1, 1, 1]], S: [[0, 1, 1], [1, 1, 0]],
                Z: [[1, 1, 0], [0, 1, 1]], J: [[1, 0, 0], [1, 1, 1]], L: [[0, 0, 1], [1, 1, 1]]
            };
            const COLORS = { I: '#4dd0e1', O: '#ffd54f', T: '#ba68c8', S: '#81c784', Z: '#e57373', J: '#64b5f6', L: '#ffb74d' };
            const el = document.createElement('div');
            el.style.cssText = 'display:flex;flex-direction:column;gap:10px;align-items:center';
            const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:16px;align-items:flex-start';
            const cv = document.createElement('canvas'); cv.className = 'vp-g-canvas'; cv.tabIndex = 0;
            const side = document.createElement('div'); side.className = 'vp-g-side';
            side.innerHTML = `<div>Следующая</div><canvas class="vp-g-canvas" style="width:88px;height:88px"></canvas>
            <div>Очки<br><b data-v="score">0</b></div><div>Линии<br><b data-v="lines">0</b></div><div>Уровень<br><b data-v="level">1</b></div>`;
            const pad = document.createElement('div'); pad.className = 'vp-g-pad';
            pad.innerHTML = ['◀:left', '⟳:rot', '▶:right', '▼:down', '⤓:drop', 'Ⅱ:pause'].map(s => { const [t, a] = s.split(':'); return `<button type="button" data-a="${a}">${t}</button>`; }).join('');
            const hint = document.createElement('div'); hint.className = 'vp-games-hint';
            hint.textContent = '← → — двигать · ↑ или X — поворот · ↓ — быстрее · пробел — сбросить · P — пауза';
            if (IS_PHONE) hint.hidden = true;
            row.append(cv, side); el.append(row, pad, hint);
            const nx = side.querySelector('canvas'), g = cv.getContext('2d'), ng = nx.getContext('2d');
            let board, cur, next, score, lines, level, on = false, over = false, last = 0, raf = 0, cell = 0, msg = 'Тетрис\nнажми или стрелку';
            let best = GM_getValue(acctKey('vp_tetris_best'), 0);
            let acc = 0, since = 0, lastT = 0, rec = null, rng = Math.random, ei = 0;
            const bag = []; const take = () => { if (!bag.length) { const k = Object.keys(SHAPES); for (let i = k.length - 1; i > 0; i--) { const j = rng() * (i + 1) | 0; [k[i], k[j]] = [k[j], k[i]]; } bag.push(...k); } return bag.pop(); };
            const piece = t => ({ t, m: SHAPES[t].map(r => [...r]), x: 0, y: 0 });
            const speed = () => Math.max(90, 800 - (level - 1) * 70);
            const show = () => {
                side.querySelector('[data-v="score"]').textContent = score; side.querySelector('[data-v="lines"]').textContent = lines;
                side.querySelector('[data-v="level"]').textContent = level; setScore(rp ? `счёт ${score}` : `${score} · рекорд ${best}`);
            };
            const fits = (m, x, y) => m.every((r, j) => r.every((v, i) => !v || (x + i >= 0 && x + i < COLS && y + j < ROWS && (y + j < 0 || !board[y + j][x + i]))));
            const rotate = (m, dir) => dir > 0 ? m[0].map((_, i) => m.map(r => r[i]).reverse()) : m[0].map((_, i) => m.map(r => r[r.length - 1 - i]));
            function spawn() {
                cur = next || piece(take()); next = piece(take());
                cur.x = (COLS - cur.m[0].length) / 2 | 0; cur.y = -1;
                if (!fits(cur.m, cur.x, cur.y + 1)) return gameOver();
                cur.y = 0;
            }
            function reset() { rng = repRng(rp ? rp.seed : (rec = repNew('t')).seed); bag.length = 0; acc = 0; lastT = 0; ei = 0; board = Array.from({ length: ROWS }, () => Array(COLS).fill(null)); score = 0; lines = 0; level = 1; over = false; next = null; spawn(); show(); }
            function gameOver() {
                on = false; over = true;
                if (!rp && score > best) { best = score; GM_setValue(acctKey('vp_tetris_best'), best); repSave(rec, score); renderGamesMenu(); gamesRecord(); }
                msg = rp ? `Конец · ${score}` : `Конец · ${score}\nнажми — ещё раз`; show(); draw();
            }
            function lock() {
                cur.m.forEach((r, j) => r.forEach((v, i) => { if (v && cur.y + j >= 0) board[cur.y + j][cur.x + i] = cur.t; }));
                let n = 0;
                for (let y = ROWS - 1; y >= 0; y--) if (board[y].every(Boolean)) { board.splice(y, 1); board.unshift(Array(COLS).fill(null)); n++; y++; }
                if (n) { score += [0, 100, 300, 500, 800][n] * level; lines += n; level = Math.floor(lines / 10) + 1; if (!rp) uiSound('click'); }
                show(); spawn();
            }
            function move(dx, dy) { if (fits(cur.m, cur.x + dx, cur.y + dy)) { cur.x += dx; cur.y += dy; return true; } return false; }
            function turn(dir) { const m = rotate(cur.m, dir); for (const k of [0, -1, 1, -2, 2]) if (fits(m, cur.x + k, cur.y)) { cur.m = m; cur.x += k; return; } }
            function hard() { let n = 0; while (move(0, 1)) n++; score += n * 2; lock(); }
            const clock = () => Math.round(acc + (on && !rp ? performance.now() - since : 0));
            function advance(T) { let n = 0; while (on && !over && T - lastT >= speed() && n++ < 1e6) { lastT += speed(); if (!move(0, 1)) lock(); } }
            const ACTS = ['left', 'right', 'down', 'rot', 'back', 'drop'];
            function doAct(a, T) {
                ({
                    left: () => move(-1, 0), right: () => move(1, 0), down: () => { if (move(0, 1)) score++; else lock(); lastT = T; show(); },
                    rot: () => turn(1), back: () => turn(-1), drop: () => { hard(); lastT = T; }
                })[a]();
            }
            function cellAt(ctx, x, y, c, s, alpha = 1) {
                ctx.globalAlpha = alpha; ctx.fillStyle = c;
                ctx.beginPath(); ctx.roundRect(x * s + s * .06, y * s + s * .06, s * .88, s * .88, s * .2); ctx.fill(); ctx.globalAlpha = 1;
            }
            function draw() {
                g.clearRect(0, 0, cv.width, cv.height);
                g.fillStyle = 'rgba(255, 255, 255, .03)';
                for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ((x + y) % 2) g.fillRect(x * cell, y * cell, cell, cell);
                board.forEach((r, y) => r.forEach((t, x) => t && cellAt(g, x, y, COLORS[t], cell)));
                if (cur && !over) {
                    let gy = cur.y; while (fits(cur.m, cur.x, gy + 1)) gy++;
                    cur.m.forEach((r, j) => r.forEach((v, i) => v && cellAt(g, cur.x + i, gy + j, COLORS[cur.t], cell, .22)));
                    cur.m.forEach((r, j) => r.forEach((v, i) => v && cur.y + j >= 0 && cellAt(g, cur.x + i, cur.y + j, COLORS[cur.t], cell)));
                }
                const ns = nx.width / 4;
                ng.clearRect(0, 0, nx.width, nx.height);
                if (next) { const m = next.m, ox = (4 - m[0].length) / 2, oy = (4 - m.length) / 2; m.forEach((r, j) => r.forEach((v, i) => v && cellAt(ng, ox + i, oy + j, COLORS[next.t], ns))); }
                if (msg) {
                    g.fillStyle = 'rgba(0, 0, 0, .55)'; g.fillRect(0, 0, cv.width, cv.height);
                    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${Math.round(cell * .8)}px system-ui, sans-serif`;
                    msg.split('\n').forEach((line, i, all) => g.fillText(line, cv.width / 2, cv.height / 2 + (i - (all.length - 1) / 2) * cell * 1.2));
                }
            }
            function loop(now) {
                raf = 0;
                if (!on) return;
                advance(clock());
                if (on) { draw(); raf = requestAnimationFrame(loop); }
            }
            function start() { if (rp) return; if (over) reset(); on = true; msg = ''; since = performance.now(); if (!raf) raf = requestAnimationFrame(loop); }
            function pause() { if (!on || rp) return; acc += performance.now() - since; on = false; msg = 'Пауза\nнажми — дальше'; draw(); }
            const act = a => {
                if (rp) return;
                if (a === 'pause') return on ? pause() : start();
                if (!on) return start();
                const T = clock();
                advance(T);
                if (!on) return draw();
                if (rec && rec.ev.length < 30000) rec.ev.push([T, ACTS.indexOf(a)]);
                doAct(a, T);
                draw();
            };
            const KEYS = {
                arrowleft: 'left', a: 'left', ф: 'left', arrowright: 'right', d: 'right', в: 'right', arrowdown: 'down', s: 'down', ы: 'down',
                arrowup: 'rot', w: 'rot', ц: 'rot', x: 'rot', ч: 'rot', z: 'back', я: 'back', ' ': 'drop', p: 'pause', з: 'pause'
            };
            function key(e) { const a = KEYS[e.key.toLowerCase()]; if (!a) return; e.preventDefault(); if (e.repeat && (a === 'rot' || a === 'back' || a === 'drop' || a === 'pause')) return; act(a); }
            pad.addEventListener('click', e => { const b = e.target.closest('button'); if (b) act(b.dataset.a); });
            cv.addEventListener('click', () => (on ? pause() : start()));
            function resize() {
                const coarse = IS_PHONE;
                cell = fitCanvas(cv, COLS, ROWS, innerWidth < 520 ? 90 : 140, coarse ? 124 : 40);
                const dpr = devicePixelRatio || 1; nx.width = nx.height = Math.round(88 * dpr);
                draw();
            }
            function repTo(vt) {
                if (!on && !over) { on = true; msg = ''; }
                while (on && ei < rp.ev.length && rp.ev[ei][0] <= vt) { const [T, a] = rp.ev[ei++]; advance(T); if (on) doAct(ACTS[a] || 'down', T); }
                if (on) advance(ei < rp.ev.length ? Math.min(vt, rp.ev[ei][0]) : vt);
                if (!rp.instant) draw();
            }
            reset(); msg = rp ? '' : 'Тетрис\nнажми или стрелку';
            el._vpTest = () => ({ on, over, score, cur: cur && { t: cur.t, x: cur.x, y: cur.y } });
            return { el, key, pause, resize, repTo, repRes: () => ({ score, done: over }), destroy() { on = false; cancelAnimationFrame(raf); } };
        }

        const LB_KEYS = { snake: 's', mines: 'm', tetris: 't' };
        const LB_KEY = 'ITDX-LB-KEY-2026-Kiwe-NSFW-Visual-Pack-games';
        function lbEncode(text) {
            const b = new TextEncoder().encode(text), k = new TextEncoder().encode(LB_KEY);
            const o = new Uint8Array(b.length);
            for (let i = 0; i < b.length; i++) o[i] = b[i] ^ k[i % k.length];
            let s = '';
            for (const byte of o) s += String.fromCharCode(byte);
            return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }
        function lbDecode(b64) {
            try {
                const s = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - b64.length % 4) % 4));
                const b = Uint8Array.from(s, c => c.charCodeAt(0));
                const k = new TextEncoder().encode(LB_KEY);
                const o = new Uint8Array(b.length);
                for (let i = 0; i < b.length; i++) o[i] = b[i] ^ k[i % k.length];
                return new TextDecoder().decode(o);
            } catch (e) { return null; }
        }
        const parseLB = (t, legacy) => {
            const s = String(t || '').trim();
            let body = s;
            if (s.startsWith('ITDXG2 ')) {
                const d = lbDecode(s.slice(7));
                if (!d) return null;
                body = d;
            } else if (!legacy) return null;
            const m = body.match(/^ITDXG((?:\s+[smt]\d+)*)$/);
            if (!m) return null;
            const o = {};
            for (const [, k, v] of m[1].matchAll(/([smt])(\d+)/g)) o[k] = +v;
            return o;
        };
        const lbText = o => {
            const parts = ['s', 'm', 't'].filter(k => o[k]).map(k => ` ${k}${o[k]}`);
            if (!parts.length) return null;
            return 'ITDXG2 ' + lbEncode('ITDXG' + parts.join(''));
        };
        const LB_VOID = 'ITDX-LBX';
        function lbVoids(all) {
            const out = new Set();
            for (const c of all || []) {
                if (!c.author || c.author.id !== OWNER_ID) continue;
                const t = openText(c.content);
                if (!t.startsWith(LB_VOID + ' ')) continue;
                for (const tok of t.slice(LB_VOID.length + 1).split(/\s+/)) { const m = tok.match(/^([0-9a-f-]{36}):([smt]):(\d+)(?::([\w-]{1,12}))?$/i); if (m) out.add(`${m[1].toLowerCase()}:${m[2]}:${m[3]}:${m[4] || '-'}`); }
            }
            return out;
        }
        const lbIsVoid = (voids, uid, k, v, tag) => !!(uid && v && voids.has(`${String(uid).toLowerCase()}:${k}:${v}:${tag || '-'}`));
        const repTag = (rp, v) => rp && rp.n && rp.parts[0] && rp.score === v ? rp.parts[0].slice(0, 10) : '-';
        function lbDropVoid(voids, o, all) {
            const me = meData && meData.id, r = Object.assign({}, o), mine = lbReplays(all).get(me) || {};
            for (const k of ['s', 'm', 't']) if (lbIsVoid(voids, me, k, r[k], repTag(mine[k], r[k]))) r[k] = 0;
            return r;
        }
        function lbResetVoidLocal(voids) {
            const me = meData && meData.id, loc = lbLocal();
            let hit = false;
            for (const k of ['s', 'm', 't']) if (lbIsVoid(voids, me, k, loc[k], (r => r && r.tag && r.score === loc[k] ? r.tag : '-')(GM_getValue(acctKey('vp_rep_' + k), null)))) { GM_setValue(acctKey(LB_LOCAL_KEYS[k]), 0); GM_setValue(acctKey('vp_rep_' + k), null); hit = true; }
            if (hit) renderGamesMenu();
            return hit;
        }
        async function repZip(u8, back) {
            const st = new Blob([u8]).stream().pipeThrough(back ? new DecompressionStream('deflate-raw') : new CompressionStream('deflate-raw'));
            return new Uint8Array(await new Response(st).arrayBuffer());
        }
        function repPack(g, r) {
            const out = [], vi = n => { n = Math.max(0, Math.round(n)); while (n > 127) { out.push((n % 128) | 128); n = Math.floor(n / 128); } out.push(n); };
            out.push(1, 'smt'.indexOf(g)); vi(r.score); vi(r.seed); vi(r.ev.length);
            let p = 0;
            for (const e of r.ev) {
                const d = Math.max(0, e[0] - p);
                p = Math.max(p, e[0]);
                if (g === 's') vi(d * 4 + e[1]); else if (g === 'm') { vi(d); out.push(e[1] * 128 + e[2]); } else vi(d * 8 + e[1]);
            }
            return new Uint8Array(out);
        }
        async function ownerSeal(u8) {
            const S = crypto.subtle, pub = await S.importKey('raw', openB64(OWNER_PUB), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
            const eph = await S.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
            const bits = await S.deriveBits({ name: 'ECDH', public: pub }, eph.privateKey, 256);
            const hk = await S.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
            const aes = await S.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: new TextEncoder().encode('ITDX owner') }, hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
            const iv = crypto.getRandomValues(new Uint8Array(12)), ct = new Uint8Array(await S.encrypt({ name: 'AES-GCM', iv }, aes, u8));
            const raw = new Uint8Array(await S.exportKey('raw', eph.publicKey)), out = new Uint8Array(raw.length + 12 + ct.length);
            out.set(raw); out.set(iv, raw.length); out.set(ct, raw.length + 12);
            return sealB64(out);
        }
        async function repEncode(g, r) {
            return ownerSeal(await repZip(repPack(g, r)));
        }
        const REP_RE = /^ITDXP[12] ([smt]) (\d+)\/(\d+) (?:(\d+) )?(\S+)$/;
        function lbReplays(all) {
            const out = new Map();
            for (const c of all || []) {
                const x = String(c.content || '').trim().match(REP_RE);
                if (!x || !c.author || !+x[3]) continue;
                const u = out.get(c.author.id) || {};
                out.set(c.author.id, u);
                const r = u[x[1]] || (u[x[1]] = { n: +x[3], parts: [], score: x[4] ? +x[4] : null, p: +String(c.content).trim()[5] });
                if (r.n === +x[3]) r.parts[+x[2] - 1] = x[5];
            }
            return out;
        }
        async function lbRepUpload(all) {
            for (const g of ['s', 'm', 't']) {
                const r = GM_getValue(acctKey('vp_rep_' + g), null), best = lbLocal()[g];
                if (!r || r.up || r.score !== best || !Array.isArray(r.ev)) continue;
                const b64 = await repEncode(g, r), parts = [];
                for (let i = 0; i < b64.length; i += 900) parts.push(b64.slice(i, i + 900));
                if (parts.length <= 12) {
                    const mine = all.filter(c => lbIsMe(c.author) && new RegExp(`^ITDXP[12] ${g} `).test(String(c.content || '').trim()));
                    for (let i = 0; i < Math.max(parts.length, mine.length); i++) {
                        const text = i < parts.length ? `ITDXP2 ${g} ${i + 1}/${parts.length} ${r.score} ${parts[i]}` : `ITDXP2 ${g} 0/0 -`, c = mine[i];
                        if (c && String(c.content).trim() === text) continue;
                        const res = c ? await editComment(c.id, text) : await sendComment(GAMES_POST_ID, text);
                        if (!res.ok) throw new Error('повтор: ' + res.status);
                    }
                }
                r.up = true;
                if (parts.length <= 12) r.tag = parts[0].slice(0, 10);
                GM_setValue(acctKey('vp_rep_' + g), r);
            }
        }
        const lbBetter = (k, a, b) => !a ? b : !b ? a : k === 'm' ? Math.min(a, b) : Math.max(a, b);
        const lbLocal = () => ({ s: +GM_getValue(acctKey('vp_snake_best'), 0) || 0, m: +GM_getValue(acctKey('vp_mines_best'), 0) || 0, t: +GM_getValue(acctKey('vp_tetris_best'), 0) || 0 });
        const LB_LOCAL_KEYS = { s: 'vp_snake_best', m: 'vp_mines_best', t: 'vp_tetris_best' };
        function lbMergeIntoLocal(remote) {
            if (!remote) return;
            for (const k of ['s', 'm', 't']) {
                const rv = +remote[k] || 0;
                if (!rv) continue;
                const lv = +GM_getValue(acctKey(LB_LOCAL_KEYS[k]), 0) || 0;
                const best = lbBetter(k, rv, lv);
                if (best && best !== lv) GM_setValue(acctKey(LB_LOCAL_KEYS[k]), best);
            }
        }
        async function lbSyncFromServer() {
            if (!myUsername) return;
            try {
                const all = await lbComments();
                const voids = lbVoids(all), hit = lbResetVoidLocal(voids);
                const mine = all.find(c => lbIsMe(c.author) && parseLB(c.content, true));
                const raw = mine && parseLB(mine.content, true), remote = raw && lbDropVoid(voids, raw, all);
                if (mine) lbMergeIntoLocal(remote);
                if (mine && (hit || !String(mine.content).trim().startsWith('ITDXG2 ') || ['s', 'm', 't'].some(k => (raw[k] || 0) !== (remote[k] || 0)))) gamesRecord();
                renderGamesMenu();
            } catch (e) { }
        }
        const lbIsMe = a => !!a && ((meData && meData.id && a.id === meData.id) || (!!myUsername && a.username === myUsername));
        let lbLoad = null, lbAt = 0, lbBusy = false, lbT = 0;
        function lbComments(fresh) {
            if (!fresh && lbLoad && Date.now() - lbAt < 60000) return lbLoad;
            lbAt = Date.now();
            lbLoad = allComments(GAMES_POST_ID, 5);
            lbLoad.catch(() => { lbLoad = null; });
            return lbLoad;
        }
        async function lbSubmit() {
            if (!myUsername || lbBusy) return;
            lbBusy = true;
            try {
                const all = await lbComments(true);
                const voids = lbVoids(all);
                lbResetVoidLocal(voids);
                const mine = all.find(c => lbIsMe(c.author) && parseLB(c.content, true));
                const was = mine ? lbDropVoid(voids, parseLB(mine.content, true), all) : {}, loc = lbLocal(), now = {};
                for (const k of ['s', 'm', 't']) {
                    now[k] = lbBetter(k, was[k], loc[k]);
                    if (now[k] && now[k] !== loc[k]) GM_setValue(acctKey(LB_LOCAL_KEYS[k]), now[k]);
                }
                const text = lbText(now);
                if (text && !(mine && String(mine.content).trim() === text)) {
                    const res = mine
                        ? await api(`/api/comments/${mine.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }) })
                        : await api(`/api/posts/${GAMES_POST_ID}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }) });
                    if (!res.ok) throw new Error('лидерборд: ' + res.status);
                }
                await lbRepUpload(all);
                lbLoad = null;
                if (gw.el) lbRender();
            } catch (e) { logErr('лидерборд', e); } finally { lbBusy = false; }
        }
        function gamesRecord() { clearTimeout(lbT); lbT = setTimeout(lbSubmit, 2000); }
        function lbRender() {
            const view = gw.el && gw.el.querySelector('.vp-games-leads');
            if (view) GAMES.forEach(g => lbRenderInto(view.querySelector(`[data-lead="${g.id}"]`), g.id));
        }
        async function lbRenderInto(box, id) {
            if (!box) return;
            const k = LB_KEYS[id];
            box.innerHTML = `<div class="vp-games-lead-t"></div><div class="vp-games-hint">Загрузка…</div>`;
            box.firstChild.textContent = GAMES.find(g => g.id === id).name;
            let all;
            try { all = await lbComments(); } catch (e) { box.lastElementChild.textContent = 'Не загрузилось'; return; }
            if (!box.isConnected) return;
            loadApprovedIds();
            const best = new Map(), voids = lbVoids(all), reps = lbReplays(all);
            for (const c of all) {
                const a = c.author, o = a && parseLB(c.content, lbIsMe(a));
                if (!o || !o[k] || lbIsVoid(voids, a.id, k, o[k], repTag((reps.get(a && a.id) || {})[k], o[k]))) continue;
                if (!lbIsMe(a) && !isApprovedAuthor(a)) continue;
                const key = a.id || a.username, cur = best.get(key);
                if (!cur || lbBetter(k, cur.v, o[k]) !== cur.v) best.set(key, { v: o[k], name: a.displayName || a.username || '?', me: lbIsMe(a) });
            }
            const list = [...best.values()].sort((x, y) => k === 'm' ? x.v - y.v : y.v - x.v);
            const fmt = v => k === 'm' ? `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` : String(v);
            const body = box.lastElementChild;
            if (!list.length) { body.textContent = 'Пока пусто — стань первым'; return; }
            body.className = 'vp-games-lead-list';
            body.textContent = '';
            list.forEach((r, i) => {
                const row = document.createElement('div');
                row.className = 'vp-games-lead-row' + (r.me ? ' vp-me' : '');
                row.innerHTML = '<span></span><span></span><b></b>';
                row.children[0].textContent = i + 1; row.children[1].textContent = r.name; row.children[2].textContent = fmt(r.v);
                body.appendChild(row);
            });
        }

        function leadersView() {
            const el = document.createElement('div');
            el.className = 'vp-games-leads';
            el.innerHTML = GAMES.map(g => `<section data-lead="${g.id}"></section>`).join('');
            return { el, key() { }, pause() { }, resize() { }, destroy() { } };
        }
        const GAME_MAKERS = { snake: snakeGame, mines: minesGame, tetris: tetrisGame, lead: leadersView };
        function showGame(id) {
            if (!gw.el) return;
            if (gw.cur) gw.cur.destroy();
            gw.id = id; GM_setValue('vp_game_last', id);
            gw.el.querySelectorAll('.vp-games-tab').forEach(t => t.classList.toggle('vp-on', t.dataset.g === id));
            const score = gw.el.querySelector('.vp-games-score'), body = gw.el.querySelector('.vp-games-body');
            score.textContent = '';
            gw.cur = GAME_MAKERS[id](text => { score.textContent = text; });
            body.replaceChildren(gw.cur.el);
            gw.cur.resize();
            if (id === 'lead') lbRender();
            const f = gw.cur.el.querySelector('[tabindex]');
            if (f) f.focus({ preventScroll: true });
        }
        function openGames(id) {
            if (gw.el) return showGame(id);
            const el = document.createElement('div');
            el.className = 'vp-games';
            el.innerHTML = `<div class="vp-games-win" role="dialog" aria-label="Игры"><div class="vp-games-head"><div class="vp-games-tabs">${GAMES.map(g => `<button type="button" class="vp-games-tab" data-g="${g.id}">${g.name}</button>`).join('')}<button type="button" class="vp-games-tab" data-g="lead">🏆 Топ задротов</button></div>
            <span class="vp-games-score"></span><button type="button" class="vp-games-x" aria-label="Закрыть">${svgIcon('<path d="M6 6l12 12M18 6 6 18"/>', 18)}</button></div><div class="vp-games-body"></div></div>`;
            el.addEventListener('click', e => { if (e.target === el) closeGames(); });
            const still = e => {
                const area = e.target.closest && e.target.closest('.vp-games-lead-list, .vp-games-leads');
                if (!area || area.scrollHeight <= area.clientHeight) e.preventDefault();
            };
            el.addEventListener('wheel', still, { passive: false });
            el.addEventListener('touchmove', still, { passive: false });
            el.querySelector('.vp-games-x').addEventListener('click', closeGames);
            el.querySelectorAll('.vp-games-tab').forEach(t => t.addEventListener('click', () => showGame(t.dataset.g)));
            document.body.appendChild(el);
            gw.el = el;
            showGame(id || gw.id);
            if (!gw.synced) { gw.synced = true; gamesRecord(); }
            stackEnter('vpGames');
        }
        function closeGames(fromHistory) {
            if (!gw.el) return;
            if (gw.cur) { gw.cur.pause(); gw.cur.destroy(); gw.cur = null; }
            gw.el.remove(); gw.el = null;
            if (fromHistory !== true) stackLeave('vpGames');
        }
        addEventListener('popstate', () => { if (gw.el && !overlayAt('vpGames')) closeGames(true); });
        addEventListener('keydown', e => {
            if (!gw.el || !gw.cur) return;
            if (e.key === 'Escape') { e.preventDefault(); closeGames(); return; }
            if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
            gw.cur.key(e);
            if (['PageUp', 'PageDown', 'Home', 'End', ' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
        }, true);
        addEventListener('resize', () => { if (gw.cur) gw.cur.resize(); });
        document.addEventListener('visibilitychange', () => { if (document.hidden && gw.cur) gw.cur.pause(); });
        renderGamesMenu();

        placeRail();
        if (palsOn) palsApply();

        let admLinked = false;
        onDom(function admLink() {
            if (admLinked || !meData || meData.id !== OWNER_ID) return;
            admLinked = true;
            const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
            w.__itdx = {
                OWNER_ID, VERIFICATION_POST_ID, MSG_POST_ID, STICKER_POST_ID, GAMES_POST_ID, SERVICE_POSTS, LOOK_RE, REP_RE, LB_VOID, LB_KEYS, GAMES, GAME_MAKERS,
                COOLDOWN_MS, QUARANTINE_MS, MOD_VER, IS_PHONE, GLYPH, ROLE_ORDER, SETTINGS, roleCount, vpErrors, msgNet,
                svgIcon, addCss, logErr, copyText, openText, sealText, openB64, obfBytes, api, editComment, sendComment, srvNow, allComments,
                loadVerificationComments, checkAllComments, parseAllOwnerLists, readVerified, verifyTimeline, parseCode, isAuthorCode,
                isApprovedAuthor, loadApprovedIds, parseLook, verCmp, lbComments, lbVoids, lbReplays, parseLB, lbBetter, repTag, lbIsVoid,
                playIntro, fakeCall, callCss, msgSync, msgMyId, msgSend, verifiedNames, verifiedInfo, fpsMeter, tagAll, onDom,
                lbReload: () => { lbLoad = null; if (gw.el) lbRender(); },
                look: () => ({ currentStyle, backgroundStyle, appIcon }),
                legacy: () => ({ adminFabPos: GM_getValue('adminFabPos', null), fabFace: GM_getValue('fabFace', ''), junkOk: GM_getValue('junkOk', []) })
            };
            document.dispatchEvent(new Event('itdx-ready'));
        });

        console.log('🟢 ИТД X');
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})();
