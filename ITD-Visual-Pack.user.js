// ==UserScript==
// @name         ITD Visual Pack
// @name:ru      ИТД X
// @name:en      ITD X
// @namespace    http://tampermonkey.net/
// @version      3.0.23
// @author       NeuroSFW
// @description  Подсветка ника + подсветка аватарок + фон + загрузка баннера + стикеры в комментариях + бейдж
// @match        https://xn--d1ah4a.com/*
// @match        https://итд.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @connect      raw.githubusercontent.com
// @run-at       document-start
// @noframes
// @downloadURL  https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/main/ITD-Visual-Pack.user.js
// @updateURL    https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/main/ITD-Visual-Pack.user.js
// @icon         data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='n' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%2300e5ff'/><stop offset='.5' stop-color='%237c4dff'/><stop offset='1' stop-color='%23ff3d9a'/></linearGradient><linearGradient id='d' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%230a3d62'/><stop offset='.5' stop-color='%233b1a7a'/><stop offset='1' stop-color='%237a1450'/></linearGradient><linearGradient id='m' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%231565c0'/><stop offset='.5' stop-color='%235e35b1'/><stop offset='1' stop-color='%23ad1457'/></linearGradient><filter id='b' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='2.2'/></filter><filter id='s' x='-20%' y='-20%' width='140%' height='140%'><feDropShadow dx='0' dy='1.5' stdDeviation='1.5' flood-opacity='.5'/></filter></defs><rect width='64' height='64' rx='16' fill='%230b0d13'/><g fill='none'><path d='M17 17L47 47M47 17L17 47' stroke='url(%23n)' stroke-opacity='1' stroke-width='12' stroke-linecap='round'/><path d='M17 17L47 47M47 17L17 47' stroke='%230b0d13' stroke-opacity='1' stroke-width='7' stroke-linecap='round'/></g><text x='32' y='40' font-family='Arial Black, Arial, sans-serif' font-weight='900' text-anchor='middle' font-size='21' fill='%23fff' filter='url(%23s)'>ИТД</text></svg>
// ==/UserScript==

(function () {
    'use strict';
    // Только в самой вкладке: магазин ИТД — страница в рамке (iframe) с того же адреса, и в ней вторая
    // копия скрипта рисовала свою панель и фон поверх товаров. @noframes в шапке — то же для Tampermonkey.
    if (window.top !== window.self) return;

    // Ответы сайта про профили (/api/users/<ник>) подсматриваем и запоминаем: число постов,
    // подписчиков и прочее берём из них, а не шлём свой такой же запрос второй раз.
    const siteUsers = new Map(), siteUsersWait = new Map();
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
        } catch (e) { /* не JSON — не наш ответ */ }
    }
    // ждать ответ сайта про ник не дольше ms; не пришёл — null
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
    (function watchSiteRequests() {
        const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        try {
            const origFetch = w.fetch;
            w.fetch = function (input, init) {
                const res = origFetch.apply(this, arguments);
                try {
                    const url = typeof input === 'string' ? input : input && input.url;
                    const method = (init && init.method) || (input && input.method) || 'GET';
                    if (url && /^get$/i.test(method) && USER_URL.test(url)) {
                        res.then(r => r.ok && r.clone().text().then(t => keepSiteUser(url, t))).catch(() => { });
                    }
                } catch (e) { /* подсмотр не должен ломать запрос сайта */ }
                return res;
            };
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

    // ==== заставка:начало
    // Заставка при входе: белые буквы ИТД прилетают целиком, как части костюма, и с ударом
    // встают на место — лёгкая тряска, вспышка, искры, звук. Всё — анимации с задержками,
    // поэтому любой кадр можно остановить и проверить (test/intro.py).
    const INTRO = {
        LOCK: [620, 1020, 1420],             // когда буква встаёт на место, мс
        FLY: 520,                            // полёт до касания
        SETTLE: 170,                         // дожим после касания
        SHAKE: [4, 6, 9],                    // сила тряски, px
        VOLUME: 0.11,                        // общая громкость звука (0.55 → 0.28 → 0.22 → 0.11: владелец просил тише)
        // откуда летит: угол (0 — справа, 90 — снизу), разворот, масштаб «из камеры»
        FROM: [{ ang: 200, rot: -110, sc: 1.8 }, { ang: 272, rot: 80, sc: 2.4 }, { ang: -12, rot: 130, sc: 1.6 }],
        // X за словом (как на иконке «ИТД X»): два росчерка крест-накрест после последнего удара
        X_DRAW: 170,                         // один росчерк, мс
        X_GAP: 150,                          // между росчерками
        SPLIT: 380                           // уход: экран делится пополам и разъезжается
    };
    INTRO.X = INTRO.LOCK[2] + 220;           // первый росчерк
    INTRO.EXIT = INTRO.X + INTRO.X_GAP + INTRO.X_DRAW + 380;

    // Звук синтезом, без файлов: свист полёта, металлический лязг стыковки, в конце — тяжёлый удар.
    // at(мс от начала ролика) → время звуковой карты.
    function introSound(ctx, at) {
        const out = ctx.createDynamicsCompressor();
        out.connect(ctx.destination);
        const master = ctx.createGain();
        master.gain.value = INTRO.VOLUME;
        master.connect(out);
        const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const nd = noise.getChannelData(0);
        for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
        const env = (param, t, peak, attack, decay) => {
            param.setValueAtTime(0.0001, t);
            param.exponentialRampToValueAtTime(peak, t + attack);
            param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
        };
        function whoosh(t, dur) {
            const src = ctx.createBufferSource();
            src.buffer = noise;
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.Q.value = 1.2;
            bp.frequency.setValueAtTime(300, t);
            bp.frequency.exponentialRampToValueAtTime(3200, t + dur);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.45, t + dur * 0.95);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
            src.connect(bp).connect(g).connect(master);
            src.start(t);
            src.stop(t + dur + 0.1);
        }
        // Последний удар гаснет плавно: быстро до половины, дальше ровно до нуля (TAIL секунд),
        // плюс эхо. Экспонента до нуля глохла за полсекунды — на слух как обрыв.
        // Хвост несут только низы (бум и гул); металл всегда короткий — долгий звенит колоколом.
        const TAIL = 1.6;
        const tailEnv = (param, t, peak, attack) => {
            param.setValueAtTime(0.0001, t);
            param.exponentialRampToValueAtTime(peak, t + attack);
            param.exponentialRampToValueAtTime(peak * 0.5, t + attack + 0.3);
            param.linearRampToValueAtTime(0, t + attack + 0.3 + TAIL);
        };
        // эхо: свёртка с затухающим шумом — хвост тает сам
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
            const thump = ctx.createOscillator();              // низкий удар
            thump.frequency.setValueAtTime(heavy ? 110 : 150, t);
            // у тяжёлого не ниже 45 Гц: ниже колонки не играют, и хвост пропадал бы раньше времени
            thump.frequency.exponentialRampToValueAtTime(heavy ? 45 : 48, t + (heavy ? 0.9 : 0.25));
            const tg = ctx.createGain();
            if (heavy) tailEnv(tg.gain, t, 1, 0.004);
            else env(tg.gain, t, 0.8, 0.004, 0.3);
            thump.connect(tg).connect(master);
            if (heavy) tg.connect(echo);
            thump.start(t);
            thump.stop(end);
            if (heavy) {                                       // глухой гул под хвостом
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
            [1, 1.47, 2.09, 2.76, 3.9].forEach((k, i) => {      // металл: негармоничные призвуки
                const m = ctx.createOscillator();
                m.type = 'triangle';
                m.frequency.value = (heavy ? 420 : 560) * k;
                const mg = ctx.createGain();
                env(mg.gain, t, 0.16 / (i + 1), 0.002, (heavy ? 0.6 : 0.45) / (1 + i * 0.4));
                m.connect(mg).connect(master);
                m.start(t);
                m.stop(t + 1);
            });
            const click = ctx.createBufferSource();            // щелчок касания
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
        // росчерк X: короткий свист клинка — шум, фильтр взлетает вверх, и тонкий «дзынь» без хвоста
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
        INTRO.LOCK.forEach((lock, i) => {
            whoosh(at(lock - INTRO.FLY), INTRO.FLY / 1000);
            clank(at(lock), i === 2);
        });
        [0, INTRO.X_GAP].forEach(d => slash(at(INTRO.X + d), INTRO.X_DRAW / 1000));
        whoosh(at(INTRO.EXIT - 200), 0.26);                  // створки разъезжаются
    }

    function playIntro() {
        const root = document.documentElement;
        const css = document.createElement('style');
        css.textContent = `
            .vpi-overlay { position: fixed; inset: 0; z-index: 2147483647; overflow: hidden; cursor: pointer; }
            /* две одинаковые половины: каждая — весь кадр, обрезанный по своей стороне; в конце разъезжаются */
            .vpi-half { position: absolute; inset: 0; background: #000; overflow: hidden; will-change: transform; }
            .vpi-half-0 { clip-path: inset(0 50% 0 0); }
            .vpi-half-1 { clip-path: inset(0 0 0 50%); }
            .vpi-world { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
            .vpi-word { position: relative; display: flex; gap: .05em; color: #fff; user-select: none; line-height: 1;
                font: 900 min(24vw, 36vh)/1 "Arial Black", "Segoe UI Black", "Helvetica Neue", Arial, sans-serif; }
            .vpi-letter { display: inline-block; will-change: transform, opacity, filter; }
            .vpi-fx { position: absolute; left: 0; top: 0; pointer-events: none; opacity: 0; }
            .vpi-spark { width: 2px; height: 16px; margin: -8px 0 0 -1px; border-radius: 1px;
                background: linear-gradient(#fff, rgba(255,255,255,0)); }
            .vpi-flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; }
            .vpi-x { position: absolute; left: 50%; top: 50%; width: min(46vw, 70vh); height: min(46vw, 70vh);
                transform: translate(-50%, -50%); overflow: visible; pointer-events: none; will-change: filter; }
            .vpi-seam { position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; margin-left: -1px; opacity: 0; pointer-events: none;
                background: linear-gradient(transparent, #fff 30%, #fff 70%, transparent); box-shadow: 0 0 18px 2px #7c4dff; }
        `;
        const el = (cls, parent, text) => {
            const e = document.createElement('div');
            e.className = cls;
            if (text) e.textContent = text;
            parent.appendChild(e);
            return e;
        };
        const ov = el('vpi-overlay', root);
        const halves = [0, 1].map(i => el('vpi-half vpi-half-' + i, ov));
        const worlds = halves.map(h => el('vpi-world', h));
        // X — за словом: неоновый контур (цветная линия, внутри чёрная), как на иконке
        const xMarks = worlds.map((w, n) => {
            w.insertAdjacentHTML('beforeend', `<svg class="vpi-x" viewBox="0 0 100 100">
                <defs><linearGradient id="vpiX${n}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#00e5ff"/><stop offset=".5" stop-color="#7c4dff"/><stop offset="1" stop-color="#ff3d9a"/>
                </linearGradient></defs>
                <g fill="none" stroke-linecap="round">
                    <path class="vpi-x1" d="M14 14L86 86" pathLength="1" stroke="url(#vpiX${n})" stroke-width="12"/>
                    <path class="vpi-x1" d="M14 14L86 86" pathLength="1" stroke="#000" stroke-width="7"/>
                    <path class="vpi-x2" d="M86 14L14 86" pathLength="1" stroke="url(#vpiX${n})" stroke-width="12"/>
                    <path class="vpi-x2" d="M86 14L14 86" pathLength="1" stroke="#000" stroke-width="7"/>
                </g></svg>`);
            return w.lastElementChild;
        });
        const words = worlds.map(w => el('vpi-word', w));
        const flash = el('vpi-flash', ov);
        const seam = el('vpi-seam', ov);
        root.appendChild(css);
        const prevOverflow = root.style.overflow;
        root.style.overflow = 'hidden';

        const { LOCK, FLY, SETTLE, SHAKE, FROM, EXIT, X, X_DRAW, X_GAP, SPLIT } = INTRO;
        const vmax = Math.max(innerWidth, innerHeight);
        const rnd = (a, b) => a + Math.random() * (b - a);
        const anims = [];
        const play = (target, frames, opts) => { const a = target.animate(frames, { fill: 'both', ...opts }); anims.push(a); return a; };
        // обе половины играют одно и то же (со своими случайностями они бы разошлись на стыке)
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
            // искры — от края буквы наружу; до удара их нет
            for (let i = 0, n = strong ? 20 : 10; i < n; i++) {
                const ang = rnd(0, Math.PI * 2), r0 = size * .22, dist = size * rnd(.3, strong ? .75 : .55);
                const rot = ang * 180 / Math.PI + 90, c = Math.cos(ang), sn = Math.sin(ang);
                playBoth(worlds.map(w => el('vpi-fx vpi-spark', w)), [
                    { transform: `translate(${x + c * r0}px, ${y + sn * r0}px) rotate(${rot}deg)`, opacity: 1 },
                    { transform: `translate(${x + c * (r0 + dist)}px, ${y + sn * (r0 + dist)}px) rotate(${rot}deg) scaleY(.2)`, opacity: 0 }
                ], { delay: at, duration: rnd(300, 560), easing: 'cubic-bezier(.1,.8,.3,1)', fill: 'forwards' });
            }
            play(flash, [{ opacity: 0 }, { opacity: strong ? .14 : .06, offset: .12 }, { opacity: 0 }],
                { delay: at, duration: strong ? 380 : 220, fill: 'none' });
        }

        const letters = words.map(w => [...'ИТД'].map(ch => el('vpi-letter', w, ch)));
        const wr = worlds[0].getBoundingClientRect();
        letters[0].forEach((box, i) => {
            const lock = LOCK[i], f = FROM[i];
            const lr = box.getBoundingClientRect();
            const cx = lr.left - wr.left + lr.width / 2, cy = lr.top - wr.top + lr.height / 2;
            const a = f.ang * Math.PI / 180, dist = vmax * .75;
            const dx = Math.cos(a) * dist, dy = Math.sin(a) * dist;
            const hit = FLY / (FLY + SETTLE);
            // разгон до самого касания, затем проскок чуть дальше и сжатие от удара
            playBoth([letters[0][i], letters[1][i]], [
                { transform: `translate(${dx}px, ${dy}px) rotate(${f.rot}deg) scale(${f.sc})`, opacity: 0, filter: 'blur(10px) drop-shadow(0 0 0 rgba(255,255,255,0))', easing: 'cubic-bezier(.6,0,.9,.35)' },
                { opacity: 1, offset: hit * .25 },
                { transform: `translate(${-dx * .012}px, ${-dy * .012}px) scale(1.07, .93)`, opacity: 1, filter: 'blur(0px) drop-shadow(0 0 30px rgba(255,255,255,.9))', offset: hit, easing: 'cubic-bezier(.2,.9,.3,1)' },
                { transform: 'none', opacity: 1, filter: 'blur(0px) drop-shadow(0 0 10px rgba(255,255,255,.3))' }
            ], { delay: lock - FLY, duration: FLY + SETTLE });
            shake(lock, SHAKE[i]);
            burst(lock, cx, cy, lr.height * (i === 2 ? 2.2 : 1.5), i === 2);
        });

        // X: два росчерка крест-накрест за буквами, потом вспышка свечения
        ['.vpi-x1', '.vpi-x2'].forEach((sel, i) => {
            xMarks.forEach(xm => xm.querySelectorAll(sel).forEach(path => play(path, [
                { strokeDasharray: '1 1', strokeDashoffset: 1 },
                { strokeDasharray: '1 1', strokeDashoffset: 0 }
            ], { delay: X + i * X_GAP, duration: X_DRAW, easing: 'cubic-bezier(.7,0,.3,1)' })));
            play(flash, [{ opacity: 0 }, { opacity: .05, offset: .5 }, { opacity: 0 }], { delay: X + i * X_GAP + X_DRAW * .6, duration: 160, fill: 'none' });
        });
        shake(X + X_GAP + X_DRAW * .8, 3);
        playBoth(xMarks, [
            { filter: 'drop-shadow(0 0 0 rgba(124,77,255,0))' },
            { filter: 'drop-shadow(0 0 26px rgba(124,77,255,.95))', offset: .35 },
            { filter: 'drop-shadow(0 0 12px rgba(124,77,255,.55))' }
        ], { delay: X + X_GAP + X_DRAW, duration: 520 });

        // Уход: по центру вспыхивает щель, экран делится ровно пополам — левая половина
        // уезжает влево, правая вправо, под ними уже сайт.
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

        // Звук: браузер пускает его без клика, только если разрешает сайту автозвук.
        // Не пустил сразу — молчим: запоздалый лязг после заставки хуже тишины.
        const t0 = performance.now();
        let ctx = null;
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            const go = () => {
                const base = ctx.currentTime - (performance.now() - t0) / 1000;
                introSound(ctx, ms => Math.max(ctx.currentTime, base + ms / 1000));
            };
            if (ctx.state === 'running') go();
            else ctx.resume().then(() => { if (performance.now() - t0 < 150) go(); else ctx.close(); }, () => {});
        } catch (e) { ctx = null; }

        let done = false;
        const cleanup = () => {
            if (done) return;
            done = true;
            ov.remove();
            css.remove();
            root.style.overflow = prevOverflow;
            if (ctx) setTimeout(() => ctx.close().catch(() => {}), 3500);   // дать дотаять хвосту последнего удара
        };
        out.finished.then(cleanup, cleanup);
        setTimeout(cleanup, EXIT + SPLIT + 2500);           // если анимации не доиграют (вкладка в фоне)
        // клик или клавиша — пропустить
        const skip = () => {
            if (done) return;
            removeEventListener('keydown', skip, true);
            if (ctx) ctx.close().catch(() => {});
            ctx = null;
            ov.animate([{ opacity: getComputedStyle(ov).opacity }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).finished.then(cleanup, cleanup);
        };
        ov.addEventListener('click', skip);
        addEventListener('keydown', skip, true);
        return anims;
    }
    // ==== заставка:конец

    if (window.top === window.self && GM_getValue('introEnabled', true)
        && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        try { playIntro(); } catch (e) { console.warn('[ITD VP] заставка', e); }
    }

    // Остальное — когда страница разобрана (раньше весь скрипт и запускался на document-idle);
    // заставке нужен document-start, чтобы закрыть страницу с первого кадра.
    const start = () => {

    // ================= Поиск элементов сайта =================
    // Классы ИТД (drJg, U91s, iciV…) — хеши сборки, они меняются при каждом обновлении сайта.
    // Поэтому элементы ищем по тому, что не меняется: тегам (article, nav, aside, header, time),
    // ссылкам /@ник, подписям кнопок (aria-label, title), alt и data-атрибутам.
    // Найденному элементу вешаем СВОЙ класс vp-*, и весь остальной код и CSS работают только
    // с ними. Если сайт поменяет разметку, сломается одна функция в FIND, а не весь скрипт;
    // какая — видно в консоли: itdvp.diag().
    const SELECTORS = {
        post: 'vp-post',                  // карточка поста (article)
        repost: 'vp-repost',              // вложенная карточка репоста внутри поста
        postText: 'vp-post-text',
        postMedia: 'vp-post-media',
        postAction: 'vp-post-action',     // кнопки «Нравится», «Комментировать», «Репост»
        avatarLink: 'vp-avatar-link',     // ссылка-аватар в посте
        avatar: 'vp-avatar',
        nickContainer: 'vp-nick',         // имя + значки
        nickText: 'vp-nick-text',         // само имя
        nickBadges: 'vp-nick-badges',
        nickRow: 'vp-nick-row',           // строка, в которой стоит ник
        nickLarge: 'vp-nick-large',       // крупный ник в шапке профиля
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
        tabs: 'vp-tabs',                  // «Для вас / Подписки», «Посты / Лайки»
        feedBar: 'vp-feed-bar',           // верхняя полоса ленты: вкладки + поиск
        commentBox: 'vp-comment-box',     // обёртка формы комментария
        stickerContainer: 'vp-comment-row',
        stickerMicBtn: 'vp-comment-mic',
        stickerSendBtn: 'vp-comment-send',
        modal: 'vp-modal',
        notification: 'vp-notif',
        notificationText: 'vp-notif-text',
        badgeVerify: 'mod-badge-verify',
        badgeVoronoi: 'mod-badge-voronoi'
    };
    SELECTORS.commentPreviewContainer = SELECTORS.commentBox;
    SELECTORS.nickParent = SELECTORS.nickContainer;

    const PROFILE_LINK = 'a[href^="/@"]';
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
    const ownText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());

    // Классы сайта у элемента, без наших vp-*: нужны, когда свой элемент должен выглядеть
    // как родной (свои кнопки баннера, пункт меню «Сообщения»)
    function siteClasses(el) {
        return el ? [...el.classList].filter(c => !c.startsWith('vp-')).join(' ') : '';
    }
    // Классы, общие для всех элементов: у пунктов меню это «обычный пункт» без «активного»
    function commonClasses(els) {
        if (!els.length) return '';
        return [...els[0].classList].filter(c => !c.startsWith('vp-') && els.every(e => e.classList.contains(c))).join(' ');
    }

    // Выученные классы. Надёжный образец (ник и аватар в шапке поста) даёт класс компонента,
    // по нему находим тот же компонент там, где надёжной приметы нет: шапка профиля, репост,
    // поле нового поста. Учимся заново на каждой странице, запоминаем на случай страниц без постов.
    const learned = JSON.parse(GM_getValue('vp_learned', '{}'));
    function learn(role, el) {
        const cls = el && [...el.classList].find(c => !c.startsWith('vp-'));
        if (cls && learned[role] !== cls) {
            learned[role] = cls;
            GM_setValue('vp_learned', JSON.stringify(learned));
        }
    }
    const byLearned = role => learned[role] ? [...document.getElementsByClassName(learned[role])].filter(inScope) : [];

    // Самый глубокий span с текстом внутри ника (имя бывает вложено: span > span > span)
    function nickTextOf(container) {
        if (!container.children.length) return container;
        return $$('span', container).find(s => !s.children.length && s.textContent.trim()
            && !s.closest('.' + SELECTORS.badgeVoronoi + ', .' + SELECTORS.badgeVerify)) || null;
    }

    const FIND = {
        // Пост: в ленте — article; открытый пост собран из div — узнаём его по подвалу с кнопкой
        // «Нравится» и шапке над ним (ближайший предок, у которого шапка — прямой потомок)
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
        // аватар-ссылка — ссылка на профиль, внутри которой блок (у ссылки с ником внутри span)
        avatarLink: () => F('post').flatMap(p => $$(PROFILE_LINK, p)).filter(a => a.firstElementChild && a.firstElementChild.tagName === 'DIV'),
        avatar: () => {
            const sample = F('avatarLink').map(a => a.firstElementChild);
            if (sample[0]) learn('avatar', sample[0]);
            const all = new Set(sample);
            byLearned('avatar').forEach(el => { if (el.querySelector('span, img')) all.add(el); });
            return [...all];
        },
        nickContainer: () => {
            const sample = F('post').flatMap(p => $$('header ' + PROFILE_LINK + ' > span', p));
            if (sample[0]) learn('nick', sample[0]);
            const all = new Set(sample);
            byLearned('nick').forEach(el => { if (el.textContent.trim()) all.add(el); });
            return [...all];
        },
        nickText: () => F('nickContainer').map(nickTextOf).filter(Boolean),
        nickBadges: () => F('nickContainer').flatMap(c => [...c.children]
            .filter(s => s.querySelector('img, svg') && !s.matches('.' + SELECTORS.badgeVoronoi + ', .' + SELECTORS.badgeVerify))),
        nickRow: () => F('nickContainer').map(c => (c.closest(PROFILE_LINK) || c).parentElement).filter(Boolean),
        // Крупный ник — в шапке профиля: не ссылка и не внутри поста, рядом строка «@ник»
        // Крупный ник — в шапке профиля: не ссылка, не в посте, рядом «@ник» и баннер. Строки окон
        // «Подписчики»/«Подписки» устроены так же, но баннера рядом нет — их отсекаем.
        nickLarge: () => F('nickContainer').filter(c => !c.closest('a, article, .' + SELECTORS.post) && atLoginOf(c) && isProfileHeader(c)),
        banner: () => $$('img[alt="Banner"]').map(i => i.parentElement).filter(Boolean),
        bannerButtons: () => F('banner').map(b => [...b.children].find(c => c.querySelector('button'))).filter(Boolean),
        bannerDelete: () => F('bannerButtons').flatMap(c => $$('button', c))
            .filter(b => /удал/i.test(b.title || '') || b.innerHTML.includes('points="3 6 5 6 21 6"')),
        bannerDraw: () => F('bannerButtons').map(c => $$('button', c)
            .find(b => !/custom-/.test(b.className) && !/удал/i.test(b.title || '') && !b.innerHTML.includes('points="3 6 5 6 21 6"'))).filter(Boolean),
        nav: () => $$('nav').filter(n => n.querySelector('a[href="/"], a[href="/notifications"]')),
        navLink: () => F('nav').flatMap(n => $$(':scope > a', n)),
        navIcon: () => F('navLink').map(a => a.firstElementChild).filter(s => s && s.tagName === 'SPAN' && s.querySelector('svg')),
        sidebar: () => $$('aside').filter(a => a.querySelector('nav')),
        sidebarRight: () => $$('aside').filter(a => !a.querySelector('nav')),
        // Логотип стоит прямо перед меню; после замены иконки внутри уже наша ссылка
        logoContainer: () => F('nav').map(n => n.previousElementSibling)
            .filter(d => d && (d.querySelector('svg, button') || d.querySelector('a[href="https://t.me/NeuroSFW"]'))),
        versionBtn: () => F('logoContainer').flatMap(c => $$('button', c))
            .filter(b => /^v\d/.test(b.textContent.trim()) && !b.classList.contains('itd-update-sidebar-btn')),
        tabs: () => [...new Set($$('button')
            .filter(b => ['Для вас', 'Подписки', 'Лента кланов', 'Посты', 'Лайки'].includes(b.textContent.trim()))
            .map(b => b.parentElement))],
        feedBar: () => F('tabs').filter(t => /Для вас/.test(t.textContent)).map(t => t.parentElement).filter(Boolean),
        stickerContainer: () => commentInputs().map(commentRow).filter(Boolean),
        stickerMicBtn: () => F('stickerContainer').map(r => siteButtons(r)).filter(bs => bs.length > 1).map(bs => bs[0]),
        stickerSendBtn: () => F('stickerContainer').map(r => siteButtons(r).pop()).filter(Boolean),
        commentBox: () => commentInputs().map(i => i.closest('form') || (commentRow(i) || i).parentElement).filter(Boolean),
        modal: () => $$('[role="dialog"], [aria-modal="true"], dialog[open]'),
        // Уведомления: пункт — строка-кнопка со ссылкой на профиль (дата там простой span, не time)
        notification: () => location.pathname.startsWith('/notifications')
            ? $$('[role="button"]').filter(b => b.querySelector(PROFILE_LINK) && !b.closest('article')
                && !b.parentElement.closest('[role="button"]'))
            : [],
        // Текст действия («оценил(а) ваш пост») — первый текст сразу после ссылки с ником
        notificationText: () => F('notification').map(n => {
            // ссылка с ником идёт после ссылки-аватарки: берём последнюю ссылку с текстом
            const nickLink = $$(PROFILE_LINK, n).filter(a => a.textContent.trim() && !a.querySelector('.' + SELECTORS.avatar)).pop();
            const el = nickLink && nickLink.nextElementSibling;
            return el && ownText(el) ? el : null;
        }).filter(Boolean)
    };

    // «@ник» в той же строке, что и имя (шапка профиля, строки окон подписок) — логин без ссылки
    function atLoginOf(c) {
        const row = c.parentElement;
        const at = row && [...row.children].find(s => /^@[\w.]+$/.test(s.textContent.trim()));
        return at ? at.textContent.trim().slice(1) : null;
    }
    function isProfileHeader(c) {
        for (let el = c, i = 0; el && i < 7; el = el.parentElement, i++) {
            if (el.querySelector('img[alt="Banner"]')) return true;
        }
        if (document.querySelector('img[alt="Banner"]')) return false;      // баннер есть, но не рядом — это не шапка
        // профиль без баннера: шапка — не строка списка, где у соседей тоже ники
        const item = c.parentElement && c.parentElement.parentElement;
        return !(item && item.parentElement && [...item.parentElement.children]
            .filter(x => x !== item && x.querySelector('.' + SELECTORS.nickContainer)).length);
    }

    function commentInputs() {
        return $$('[contenteditable="true"][data-placeholder]').filter(i => /коммент/i.test(i.getAttribute('data-placeholder')));
    }
    // Строка ввода комментария — ближайший предок поля, в котором есть кнопки
    function commentRow(input) {
        let el = input.parentElement;
        for (let i = 0; el && i < 6; i++, el = el.parentElement) {
            if (siteButtons(el).length) return el;
        }
        return null;
    }
    const siteButtons = root => $$('button', root).filter(b => !b.classList.contains('sticker-btn'));

    // Порядок важен: ник и аватар учатся на постах, остальные роли пользуются результатом
    const ROLE_ORDER = ['post', 'repost', 'postMedia', 'postAction', 'postText', 'avatarLink', 'avatar',
        'nickContainer', 'nickText', 'nickBadges', 'nickRow', 'nickLarge',
        'banner', 'bannerButtons', 'bannerDelete', 'bannerDraw',
        'nav', 'navLink', 'navIcon', 'sidebar', 'sidebarRight', 'logoContainer', 'versionBtn',
        'tabs', 'feedBar', 'commentBox', 'stickerContainer', 'stickerMicBtn', 'stickerSendBtn',
        'modal', 'notification', 'notificationText'];
    const roleCount = {};
    // Внутри одного прохода результат роли считаем один раз: ник нужен пяти другим ролям
    let tickCache = null;
    const F = role => (tickCache && tickCache[role]) || FIND[role]();

    // Разбирать заново всю ленту на каждое изменение страницы — дорого: чем дальше листаешь,
    // тем больше постов. Поэтому внутренности постов разбираем только у новых постов и у тех,
    // в которых что-то поменялось (dirtyPosts). Всё остальное (меню, вкладки, шапка профиля) —
    // как раньше, целиком. Раз в 5 секунд и по itdvp.diag() — полный проход, на всякий случай.
    let scope = null;                                   // null — все посты; иначе Set постов для разбора
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
                // новые посты (ещё без метки) и посты, где что-то поменялось
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

    // Один наблюдатель на всю страницу вместо десятка: сначала расставляем метки,
    // потом вызываем всех подписчиков. Не чаще раза за кадр.
    const domHandlers = [];
    function onDom(fn) { domHandlers.push(fn); }
    let domQueued = false;
    const DOM_WATCH = { childList: true, subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true };
    function domTick() {
        domQueued = false;
        domRecords(domObserver.takeRecords());
        domObserver.disconnect();                 // свои правки не должны будить наблюдателя
        try {
            tagAll(false);
            for (const fn of domHandlers) { try { fn(); } catch (e) { console.warn('[ITD VP]', fn.name || 'обработчик', e); } }
        } finally {
            domObserver.observe(document.body, DOM_WATCH);
        }
    }
    // Что поменялось: пост, внутри которого была правка, разберём заново. Смена класса важна,
    // только если сайт перерисовал элемент и стёр наши метки vp-* (свои правки класса — не повод).
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
            any = true;
            const el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
            const p = el && el.closest('.' + SELECTORS.post);
            if (p) dirtyPosts.add(p);
        }
        return any;
    }
    const domObserver = new MutationObserver(muts => {
        if (domRecords(muts) && !domQueued) { domQueued = true; requestAnimationFrame(domTick); }
    });
    tagAll();
    domObserver.observe(document.body, DOM_WATCH);

    // Проверка: какие элементы не нашлись. В консоли страницы: itdvp.diag()
    const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    pageWindow.itdvp = {
        diag() {
            tagAll();
            console.table(ROLE_ORDER.map(r => ({ роль: r, найдено: roleCount[r], класс: SELECTORS[r] })));
            return roleCount;
        },
        learned
    };
    // Раз в заход — предупреждение, если не нашлось то, что есть на любой странице
    setTimeout(() => {
        tagAll();                                 // полный проход: счёт по всей странице, а не по последним правкам
        const must = ['nav', 'sidebar', 'logoContainer'];
        if (roleCount.post) must.push('avatar', 'nickContainer', 'nickText');
        const lost = must.filter(r => !roleCount[r]);
        if (lost.length) console.warn('[ITD VP] не нашёл на странице:', lost.join(', '), '— похоже, сайт поменял разметку. Подробно: itdvp.diag()');
    }, 4000);

    // Иконки мода — один стиль: контур 1.8 px, скруглённые концы, сетка 24×24, цвет — currentColor.
    // Каждая рисует свою функцию: по ней должно быть понятно, что делает кнопка.
    // Логотип скрипта задаётся в ОДНОМ месте — строкой @icon в шапке. Tampermonkey показывает
    // его в своём списке, а мы берём его оттуда же (GM_info) для логотипа в углу сайта.
    // Нет картинки — логотип сайта остаётся свой.
    function scriptIconSrc() {
        const meta = (GM_info.scriptMetaStr || '').match(/^\/\/ @icon\s+(.+?)\s*$/m);
        return (GM_info.script && GM_info.script.icon) || (meta && meta[1]) || null;
    }
    function scriptLogo(size) {
        const src = scriptIconSrc();
        if (!src) return null;
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'ИТД';
        img.width = img.height = size;
        img.style.cssText = `width:${size}px;height:${size}px;display:block;border-radius:${Math.round(size * 0.25)}px;`;
        return img;
    }
    // Вкладка браузера: наша иконка (та же строка @icon) и название «ИТД X». Сайт сам меняет
    // заголовок и иконку при переходах — следим за <head> и возвращаем своё.
    const TAB_TITLE = 'ИТД X';
    function brandTab() {
        if (document.title !== TAB_TITLE) document.title = TAB_TITLE;
        const src = scriptIconSrc();
        if (!src) return;
        let ours = document.getElementById('vp-favicon');
        document.querySelectorAll('link[rel~="icon"]').forEach(l => { if (l !== ours) l.remove(); });
        if (!ours) {
            ours = document.createElement('link');
            ours.id = 'vp-favicon';
            ours.rel = 'icon';
            ours.type = 'image/svg+xml';
            ours.href = src;
            document.head.appendChild(ours);
        }
    }
    brandTab();
    new MutationObserver(brandTab).observe(document.head, { childList: true, subtree: true, characterData: true });
    const svgIcon = (body, size = 20, stroke = 'currentColor') =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
    // фон: рамка с искрой — «живой фон»
    const I_BG = '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M12 8.2l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z"/><path d="M17.5 6.8v1.6M16.7 7.6h1.6"/>';

    const ICONS = {
        settings: {
            'Фон': svgIcon(I_BG),
            // буква с искрой — светящийся ник
            'Подсветка ника': svgIcon('<path d="M4 19 9 5h1l5 14M5.8 14.5h7.4"/><path d="M18.5 3.5v4M16.5 5.5h4"/><path d="M19 11.5v2M18 12.5h2"/>'),
            // человек в пунктирном ореоле — светящаяся аватарка
            'Подсветка аватарок': svgIcon('<circle cx="12" cy="10" r="3"/><path d="M7 17.5a5.5 5.5 0 0 1 10 0"/><circle cx="12" cy="12" r="9.5" stroke-dasharray="2.2 2.6"/>'),
            // карточка поста в пунктирной рамке — подсветка поста
            'Подсветка постов': svgIcon('<rect x="5" y="6" width="14" height="12" rx="2.5"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/><rect x="2" y="3" width="20" height="18" rx="4.5" stroke-dasharray="2.2 2.6"/>'),
            // карточка с пятном в пунктирном ореоле — размытый фон поста
            'Размытый фон постов': svgIcon('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="5" stroke-dasharray="1.4 2"/>'),
            // перечёркнутый щит — без цензуры
            'Анти цензура': svgIcon('<path d="M12 3 5 6v5.2c0 4.3 2.9 7.9 7 9.8 1.6-.7 3-1.7 4.1-3M19 13.5c.1-.8.2-1.5.2-2.3V6L12 3"/><path d="m3 3 18 18"/>'),
            'Стиль фона': svgIcon(I_BG),
            // два стекла внахлёст с бликом — стеклянные блоки
            'Стекло': svgIcon('<rect x="3" y="3" width="13" height="13" rx="3"/><rect x="8" y="8" width="13" height="13" rx="3"/><path d="M11.5 15.5l3-3M11.5 18.5l6-6"/>'),
            // динамик с волнами — звуки интерфейса
            'Звуки интерфейса': svgIcon('<path d="M4 9.5h3l4-3.5v12l-4-3.5H4z"/><path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11"/>'),
            // колонка из трёх блоков справа — боковая панель
            'Боковая панель': svgIcon('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M15 3v18"/><path d="M17.5 7.5h1M17.5 11h1M17.5 14.5h1"/>'),
            // карточки лесенкой, верхняя тает — сцена ленты
            'Сцена ленты': svgIcon('<rect x="5" y="3" width="14" height="5" rx="1.5" stroke-dasharray="2 2"/><rect x="4" y="10" width="16" height="5" rx="1.5"/><rect x="3" y="17" width="18" height="5" rx="1.5"/>'),
            // экран с лучами вокруг — свечение видео
            'Свечение видео': svgIcon('<rect x="6" y="7" width="12" height="10" rx="2"/><path d="m11 10 3 2-3 2z"/><path d="M3 5.5 4.5 7M21 5.5 19.5 7M3 18.5 4.5 17M21 18.5 19.5 17M12 2.5v2M12 19.5v2"/>'),
            // кадр с кнопкой воспроизведения — заставка при входе
            'Заставка при входе': svgIcon('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 9 5 3-5 3z"/>'),
            // сердце со стрелкой повтора — лайки сами
            'Автолайки': svgIcon('<path transform="translate(.5 1) scale(.74)" stroke-width="2.43" d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/><path d="M21.3 17.2a3.3 3.3 0 1 1-1-2.4"/><path d="M21 12.9v2.3h-2.3"/>')
        },

        // палитра — стиль ника
        PALETTE: svgIcon('<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16a5 5 0 0 0 5-5C21 6.4 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/><circle cx="17" cy="10.5" r="1"/>'),
        // шестерёнка — настройки
        GEAR: svgIcon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
        MESSAGES: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M5 3a3 3 0 00-3 3v10a3 3 0 003 3h1v2.47a.5.5 0 00.85.36L11.12 19H19a3 3 0 003-3V6a3 3 0 00-3-3H5zm2 5a1 1 0 000 2h10a1 1 0 100-2H7zm0 4a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>`,
        // стрелка к черте — наверх ленты
        // как «+» у ИТД (кнопка «Создать пост»): 24 px, линия 2
        SCROLL_TOP: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 4.5h14M12 20V9M7 13.5l5-5 5 5"/></svg>',
        // картинка с плюсом — поставить свою картинку в баннер
        BANNER_IMAGE: svgIcon('<path d="M20 12.5V17a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17V7a2.5 2.5 0 0 1 2.5-2.5H12"/><circle cx="9" cy="9.5" r="1.5"/><path d="m20 15.5-3.5-3.5L8 19.5"/><path d="M18 2.5v6M15 5.5h6"/>'),
        // картинка со стрелками по кругу — сменить картинку
        BANNER_CHANGE: svgIcon('<path d="M20 11.5V17a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17V7a2.5 2.5 0 0 1 2.5-2.5h5"/><circle cx="9" cy="9.5" r="1.5"/><path d="m20 15.5-3.5-3.5L8 19.5"/><path d="M15 6.5a3 3 0 0 1 5.2-1.8M21 3v2.4h-2.4"/>'),
        BANNER_CANCEL: svgIcon('<path d="M18 6 6 18M6 6l12 12"/>'),
        BANNER_APPLY: svgIcon('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
        // наклейка с загнутым углом — стикеры
        STICKER_BUTTON: svgIcon('<path d="M15 21H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v7z"/><path d="M15 21v-2.5a3.5 3.5 0 0 1 3.5-3.5H21"/><path d="M8.5 13.5a4.5 4.5 0 0 0 6 .5"/><path d="M9 9h.01M15 9h.01" stroke-width="2.6"/>'),
        // дуга, крутится — загрузка
        LOADING: svgIcon('<path d="M21 12a9 9 0 1 1-6.2-8.6"/>', 22).replace('<svg ', '<svg class="spin" '),
        // часы — недавние стикеры
        RECENT: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>', 18),
        // квадрат с плюсом — новый набор
        ADD_PACK: svgIcon('<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M12 8.5v7M8.5 12h7"/>', 18),
        ADD: svgIcon('<path d="M12 5v14M5 12h14"/>', 24),
        EDIT: svgIcon('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>', 14),
        DELETE: svgIcon('<path d="M18 6 6 18M6 6l12 12"/>', 12),
        CHECK: svgIcon('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 16, '#fff'),
        TRASH: svgIcon('<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/>', 16, '#fff'),
        EMPTY_PACK: svgIcon('<rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke-dasharray="2.5 2.5" opacity=".5"/>', 18),
        // стрелка в лоток — скачать обновление
        UPDATE: svgIcon('<path d="M12 4v10M7.5 9.5 12 14l4.5-4.5"/><path d="M4.5 15v2.5A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5V15"/>', 14),
        // Радужная заливка бейджа (размытые круги с анимацией) — одна на страницу в скрытом SVG,
        // бейджи на неё ссылаются. Раньше у каждого бейджа была своя копия с 24 анимациями.
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

    const VERIFICATION_POST_ID = 'a0d6625a-b3ec-44c4-98da-48422af101d5';
    const SECRET_SALT = 'ITD_MOD_2026_SECRET_SALT_NEUROSFW';
    const VERIFICATION_STORAGE_KEY = 'itd_verified_users';
    let verificationInterval = null;
    let isVerifying = false;

    let globalHue = 0;
    let colorDirection = 1;
    let myUsername = null;
    let meData = null;                                    // ответ /api/users/me (счётчики — для статистики)
    let myDisplayName = null;
    let postBorderEnabled = GM_getValue('postBorderEnabled', true);
    let postBlurEnabled = GM_getValue('postBlurEnabled', true);
    let currentStyle = GM_getValue('nickStyle', 'white');
    let backgroundEnabled = GM_getValue('backgroundEnabled', true);
    let backgroundStyle = GM_getValue('backgroundStyle', 'matrix');
    let nickGlowEnabled = GM_getValue('nickGlowEnabled', true);
    let avatarGlowEnabled = GM_getValue('avatarGlowEnabled', true);
    let antiCensorshipEnabled = GM_getValue('antiCensorshipEnabled', true);
    let autoLikeUsers = JSON.parse(GM_getValue('itd_auto_like_users', '{}'));
    let autoLikeEnabled = GM_getValue('autoLikeEnabled', true);

    // Мой аватар — в первой ссылке на мой профиль
    function myAvatarEl() {
        if (!myUsername) return null;
        // первая ссылка на мой профиль — обычно пункт «Профиль» в меню: его иконка светится так же, как аватарка
        const link = document.querySelector(`a[href="/@${myUsername}" i]`);
        if (!link) return null;
        const container = link.querySelector(':scope > div');
        if (container && container.querySelector('span')) return container;
        return link.firstElementChild || link.querySelector('span');
    }
    const AUTO_LIKE_CACHE_KEY = 'itd_auto_like_full_cache';
    const CACHE_TTL = 10 * 60 * 1000;

    const LIKE_INTERVAL_MIN = 2 * 60 * 1000;
    const LIKE_INTERVAL_MAX = 5 * 60 * 1000;
    const DAY = 24 * 60 * 60 * 1000;

    // лайкнуть посты пользователя за последние сутки, которые ещё не лайкнуты
    async function likePostsForUser(username) {
        try {
            const res = await api(`/api/posts/user/${username}?limit=7`);
            if (!res.ok) return;
            const data = await res.json();
            const posts = (data.data?.posts || data.posts || [])
                .filter(p => p.isLiked === false && Date.now() - new Date(p.createdAt).getTime() <= DAY);
            for (const post of posts) {
                const like = await api(`/api/posts/${post.id}/like`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: '{}'
                });
                if (like.ok) await new Promise(r => setTimeout(r, 300));
            }
        } catch (e) { }
    }

    async function processAllAutoLikes() {
        if (!autoLikeEnabled) return;
        const activeUsers = Object.keys(autoLikeUsers).filter(u => autoLikeUsers[u] === true);
        if (!activeUsers.length) return;

        await Promise.all(activeUsers.map(username => likePostsForUser(username)));
    }

    function scheduleAutoLike() {
        const delay = Math.floor(Math.random() * (LIKE_INTERVAL_MAX - LIKE_INTERVAL_MIN + 1) + LIKE_INTERVAL_MIN);
        setTimeout(() => {
            processAllAutoLikes().finally(() => scheduleAutoLike());
        }, delay);
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
        // «Перелив» — по буквам пробегает блик; «Глитч» — цифровые помехи. Вид задаёт nickCss(dark).
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

    // В меню — по кругу цветов, от красного: красные к красным, синие к синим; белый и радуга — в конце
    const hueOf = hex => {
        const h = hex.length === 4 ? hex.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : hex;
        const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
        if (d < 0.15) return null;                                   // серые и белый — без оттенка
        const hue = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        return (hue * 60 + 30) % 360;                                // сдвиг: розово-красные (330°+) идут первыми
    };
    const styleKeys = Object.keys(nickStyles).sort((a, b) => {
        const rank = k => { const c = nickStyles[k].color; const h = c && c.startsWith('#') ? hueOf(c) : null;
            return h !== null ? h : c === 'rainbow' ? 1001 : 1000; };
        return rank(a) - rank(b);
    });

    const globalStyles = document.createElement('style');
    globalStyles.textContent = `
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
        .vp-pill-btn:hover { background: var(--accent-primary, rgba(0, 128, 255, 0.3)) !important; }
        .vp-pill-btn.vp-hidden { display: none !important; }
        .vp-pill-btn.vp-on { color: var(--accent-primary, #0080FF) !important; }
        .vp-pill-btn.vp-on:hover { color: #fff !important; }
        .vp-pill-btn svg:not([width]) { width: 20px !important; height: 20px !important; }
        .vp-pill-btn svg:not([fill]) { fill: none !important; }
        .vp-menu-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--text-primary, currentColor); }
        .vp-menu-note { padding: 20px; text-align: center; color: var(--text-secondary); }
        .vp-setting-label { display: flex; align-items: center; gap: 8px; }
        .nick-style-dropdown.vp-like-menu { min-width: 240px !important; max-height: 400px; display: flex; flex-direction: column; overflow: hidden; z-index: 10002 !important; }
        .vp-like-list { overflow-y: auto; overflow-x: hidden; flex: 1; padding: 4px 0; display: flex; flex-direction: column; gap: 2px; max-height: 350px; }
        .vp-like-footer { padding: 8px 12px; text-align: center; font-size: 12px; color: var(--text-secondary); border-top: 1px solid var(--border-color); flex-shrink: 0; }
        .nick-style-option.vp-like-row { justify-content: space-between !important; }
        /* строки списка автолайков при наведении не сдвигаем — иначе вылезают за край и появлялась полоса прокрутки снизу */
        .nick-style-option.vp-like-row:hover { transform: none !important; }
        .vp-like-user { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
        .vp-like-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; background: rgba(0, 0, 0, 0.2); flex-shrink: 0; }
        .vp-like-names { display: flex; flex-direction: column; min-width: 0; }
        .vp-like-name { font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-like-login { font-size: 11px; color: var(--text-secondary); }
        .nick-style-dropdown {
            background: var(--block-bg, #1e1e2e) !important;
            border-radius: 24px !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
            padding: 8px !important;
            min-width: 210px !important;
            z-index: 10000 !important;
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1)) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            animation: dropdownFadeIn 0.15s ease !important;
        }
        @keyframes dropdownFadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
        }
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
            background: color-mix(in srgb, var(--vp-accent, #0080ff) 16%, transparent) !important;
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent, #0080ff) 45%, transparent) !important;
            font-weight: 600 !important;
        }
        .vp-opt-check { margin-left: auto; display: flex; color: var(--vp-accent, #0080ff); }
        /* светлая тема сайта: светлые фоны (звёзды, снег, матрица) выворачиваем по яркости —
           белое станет тёмным, оттенки останутся свои */
        html.vp-light .vp-bg-canvas { filter: invert(1) hue-rotate(180deg); }
        html.vp-light .nick-style-dropdown, html.vp-light .settings-dropdown { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important; }
        .nick-style-option:not(:last-child) {
            margin-bottom: 2px !important;
        }
        .settings-dropdown {
            background: var(--block-bg, #1e1e2e) !important;
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
            background: var(--accent-primary, #0080FF) !important;
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
    `;
    document.head.appendChild(globalStyles);

    // ================= Фоны (выбираются в таблетке у ника) =================
    // Рисуются в цвете стиля ника (у радуги — бегущим оттенком) на полупрозрачном слое под сайтом.
    // Кадр ~30 раз в секунду, скорости заданы на 50 мс (dt), от частоты кадров не зависят.
    // Свечение — заранее нарисованные спрайты, а не shadowBlur: тот считался бы каждый кадр.
    const canvas = document.createElement('canvas');
    canvas.className = 'vp-bg-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;opacity:0.2;pointer-events:none;transition:opacity .4s ease;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;
    let bg = null, bgName = '';                          // текущий фон и его состояние
    const mouse = { x: -1e4, y: -1e4 };
    // курсор — в координатах холста: холст может быть уже окна (полоса прокрутки)
    let canvasRect = { left: 0, top: 0, width: 1, height: 1 };
    addEventListener('pointermove', e => {
        mouse.x = (e.clientX - canvasRect.left) * W / canvasRect.width;
        mouse.y = (e.clientY - canvasRect.top) * H / canvasRect.height;
    }, { passive: true });
    document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });

    // Картинка холста — ровно по его размеру на экране. Раньше бралась ширина окна вместе с
    // полосой прокрутки: картинка чуть сжималась, и точка курсора у частиц уезжала влево.
    function resizeCanvas() {
        const r = canvas.getBoundingClientRect();
        const w = Math.round(r.width) || innerWidth, h = Math.round(r.height) || innerHeight;
        canvasRect = { left: r.left, top: r.top, width: r.width || w, height: r.height || h };
        if (w === W && h === H) return;
        canvas.width = W = w;
        canvas.height = H = h;
        bgName = '';                                     // пересобрать фон под новый размер
    }
    const rand = (a, b) => a + Math.random() * (b - a);
    const hsla = (h, s, l, a) => `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
    function theme() {
        if (currentStyle === 'rainbow') return { h: globalHue, s: 100 };
        const st = nickStyles[currentStyle];
        return { h: st.matrixHue || 210, s: st.matrixSat ?? 100 };
    }

    // Спрайты по цвету, с кешем: мягкое свечение, диск боке, занавес сияния
    const spriteCache = new Map();
    function sprite(kind, h, s, l) {
        const key = kind + Math.round(h) + ',' + Math.round(s) + ',' + Math.round(l);
        let c = spriteCache.get(key);
        if (c) return c;
        if (spriteCache.size > 400) spriteCache.clear();
        c = document.createElement('canvas');
        const g = c.getContext('2d');
        if (kind === 'curtain') {                        // снизу яркий край, вверх тает
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
                ? [[0, 0.5], [0.72, 0.6], [0.86, 0.3], [1, 0]]          // диск с чуть ярким краем
                : [[0, 1], [0.35, 0.4], [0.7, 0.08], [1, 0]];           // свечение
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
    // стереть часть прошлого кадра до прозрачности — хвосты тают, страница не темнеет
    function fadeOut(k, dt) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - Math.pow(1 - k, dt)})`;
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
        // Колонки символов с разной скоростью, яркая «голова», хвост тает
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
                        if (c.prev) {                    // прошлая голова становится телом
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
        // Три слоя глубины: мерцают, медленно плывут (ближние быстрее), иногда падающая звезда
        stars: {
            opacity: 0.4,
            init() {
                const n = Math.min(600, Math.floor(W * H / 3500));
                return {
                    stars: Array.from({ length: n }, () => {
                        const d = Math.random() ** 2;    // ближних меньше
                        return { x: rand(0, W), y: rand(0, H), d, r: 0.5 + d * 1.8, ph: rand(0, 6.3), sp: rand(0.03, 0.1) };
                    }),
                    shoot: null, wait: rand(40, 120)
                };
            },
            draw(s, dt, { h, s: sat }) {
                ctx.clearRect(0, 0, W, H);
                const S = Math.min(100, sat * 1.2);
                // точки собираем в 8 пачек по яркости: 8 заливок на кадр вместо сотен
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
        // Сеть точек; курсор издалека притягивает, вблизи расталкивает, к нему тянутся линии
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
                // линии — в 6 пачек по прозрачности: 6 обводок на кадр вместо сотен
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
        // Четыре волны; под каждой — полупрозрачная заливка, получаются слои
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
        // Северное сияние: три переливающихся занавеса из вертикальных лучей
        aurora: {
            opacity: 0.45,
            init() { return { t: rand(0, 100) }; },
            draw(s, dt, { h, s: sat }) {
                ctx.clearRect(0, 0, W, H);
                s.t += 0.012 * dt;
                const S = Math.min(100, sat * 1.15), step = 6;
                ctx.globalCompositeOperation = 'lighter';
                // base — нижний край занавеса (доля высоты): середина сияния — у центра экрана
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
        // Боке: мягкие диски всплывают на разной глубине — ближние крупнее, прозрачнее и быстрее
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
        // Синтвейв: солнце с прорезями над горизонтом и сетка, которая едет на тебя
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
                ctx.clearRect(0, hor, W, H - hor);               // ниже горизонта — земля
                const floor = ctx.createLinearGradient(0, hor, 0, H);
                floor.addColorStop(0, hsla(h, S, 45, 0.22));
                floor.addColorStop(1, hsla(h, S, 30, 0));
                ctx.fillStyle = floor;
                ctx.fillRect(0, hor, W, H - hor);
                ctx.strokeStyle = hsla(h, S, 68, 1);
                ctx.lineWidth = 1.2;
                const n = 18;
                for (let i = -n; i <= n; i++) {                   // лучи из точки схода
                    ctx.globalAlpha = 0.55;
                    ctx.beginPath(); ctx.moveTo(cx + i * 6, hor); ctx.lineTo(cx + i * (W / n) * 1.4, H); ctx.stroke();
                }
                for (let i = 0; i < 18; i++) {                    // поперечные линии уезжают к зрителю
                    const d = i + 1 - s.z, y = hor + (H - hor) * 0.9 / d;
                    if (y > H) continue;
                    ctx.globalAlpha = Math.min(0.8, 1.2 / d);
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
                }
                ctx.globalAlpha = 1;
                ctx.lineWidth = 2;
                ctx.strokeStyle = hsla(h + 20, S, 75, 0.9);
                ctx.beginPath(); ctx.moveTo(0, hor); ctx.lineTo(W, hor); ctx.stroke();
                // дымка у горизонта прячет густую сетку вдали
                const haze = ctx.createLinearGradient(0, hor, 0, hor + (H - hor) * 0.3);
                haze.addColorStop(0, 'rgba(0, 0, 0, 1)');
                haze.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fillStyle = haze;
                ctx.fillRect(0, hor + 1, W, (H - hor) * 0.3);
                ctx.globalCompositeOperation = 'source-over';
            }
        },
        // Снегопад: хлопья на разной глубине, ветер меняется, ближние светятся
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
                const packs = Array.from({ length: 4 }, () => new Path2D());   // 4 заливки по глубине
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
        const def = BACKGROUNDS[backgroundStyle] || BACKGROUNDS.matrix;
        if (bgName !== backgroundStyle) {
            bgName = backgroundStyle;
            ctx.clearRect(0, 0, W, H);
            bg = def.init();
            canvas.style.opacity = def.opacity;
        }
        def.draw(bg, dt, theme());
    }

    // ================= Покраска: мой ник, его свечение, мои аватарки, рамка поста =================
    // Мои ники, их блоки и аватарки помечены классами, а цвет живёт в четырёх CSS-правилах.
    // Меняются только правила: новые элементы красятся сами, радуга трогает четыре правила,
    // а не каждый ник на странице.
    const paintStyle = document.createElement('style');
    paintStyle.textContent = '.vp-my-nick {} .vp-my-nick-box {} .my-avatar-glow {} article.vp-post:hover {} '
        + '.vp-nav-link.vp-active .vp-nav-icon {} .vp-tabs > div:empty {} :root {} ::selection {}';
    document.head.appendChild(paintStyle);
    let paintKey = '', paintRootKey = '';

    function borderColorOf(style) {
        // как было: цвет стиля с прозрачностью 0.6 (hex) или 0.3 (hsl)
        if (style.color && style.color !== 'rainbow' && style.color.startsWith('#')) {
            const hex = style.color.length === 4 ? style.color.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : style.color;
            const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
            return `rgba(${r}, ${g}, ${b}, 0.6)`;
        }
        return `hsla(${style.avatarHue || 210}, ${style.avatarSat ?? 100}%, 60%, 0.3)`;
    }

    function paint() {
        const style = nickStyles[currentStyle];
        const rainbow = currentStyle === 'rainbow';
        const dark = isDarkTheme();
        // Шаг оттенка — 1°: глазом не отличить от плавного, а правила стилей (и пересчёт страницы за ними)
        // меняются ~16 раз в секунду, а не каждый кадр
        const h = Math.round(globalHue);
        const key = [currentStyle, rainbow ? h : '', dark, nickGlowEnabled, avatarGlowEnabled, postBorderEnabled].join();
        if (key === paintKey) return;
        paintKey = key;
        const [nick, nickBox, avatar, post, navIcon, tab, root, selection] = [...paintStyle.sheet.cssRules].map(r => r.style);
        const hsl = `hsl(${h}, 100%, ${dark ? 55 : 42}%)`;
        if (rainbow) {
            nick.cssText = `color: ${hsl} !important; text-shadow: 0 0 5px ${hsl} !important;`;
        } else if (style.nickCss) {
            nick.cssText = style.nickCss(dark);
        } else {
            // светлая тема сайта: белый ник — графитовым, иначе его не видно
            const gradient = dark ? style.gradientDark || style.gradientLight
                : currentStyle === 'white' ? 'linear-gradient(270deg, #1a1a1a, #4a4a4a, #262626)' : style.gradientLight;
            nick.cssText = `background: ${gradient} !important; -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important;`;
        }
        // на светлом фоне яркие цвета темнее, а свечение мягче — иначе ник расплывается пятном
        const glow = rainbow ? `drop-shadow(0 0 6px ${hsl}) drop-shadow(0 0 12px ${hsl})`
            : dark ? style.glow
            : currentStyle === 'white' ? 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.25))'
            : `brightness(0.8) saturate(1.3) drop-shadow(0 0 5px color-mix(in srgb, ${accentOf(style)} 55%, transparent))`;
        nickBox.cssText = !nickGlowEnabled ? (dark || rainbow ? '' : 'filter: brightness(0.8) saturate(1.3) !important;')
            : `filter: ${glow} !important;`;
        const ah = style.avatarHue || 210, as = style.avatarSat ?? 100;
        avatar.cssText = !avatarGlowEnabled ? '' : `filter: ${rainbow
            ? `drop-shadow(0 0 5px ${hsl}) drop-shadow(0 0 12px ${hsl})`
            : `drop-shadow(0 0 3px hsl(${ah}, ${as}%, 60%)) drop-shadow(0 0 6px hsl(${ah}, ${as}%, 60%))`} !important;`;
        const border = rainbow ? `hsla(${h}, 100%, 55%, 0.3)` : borderColorOf(style);
        post.cssText = !postBorderEnabled ? '' : `border-color: ${border} !important; box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3), 0 0 0 2px ${border} !important;`;

        // цвет стиля — по интерфейсу: иконка активного пункта меню, бегунок вкладок
        const accent = rainbow ? `hsl(${h}, 100%, ${dark ? 62 : 45}%)`
            : dark ? accentOf(style)
            : currentStyle === 'white' ? '#1a1a1a' : `color-mix(in srgb, ${accentOf(style)} 78%, #000)`;
        navIcon.cssText = `color: ${accent} !important; filter: drop-shadow(0 0 6px ${accent}) !important;`;
        tab.cssText = `box-shadow: inset 0 0 0 1px ${accent}, 0 0 14px -4px ${accent} !important;`;
        // прокрутка, выделение и фокус висят на корне — их меняем редко (у радуги шагом 30°),
        // иначе каждый кадр пересчитывалась бы вся страница
        const rootKey = (rainbow ? 'r' + Math.round(h / 30) : accent) + dark;
        if (rootKey !== paintRootKey) {
            paintRootKey = rootKey;
            const slow = rainbow ? `hsl(${Math.round(h / 30) * 30}, 100%, ${dark ? 62 : 45}%)` : accent;
            // надписи поверх акцента: на тёмной теме он светлый (у «Белого» — белый), на светлой — затемнён
            root.cssText = `--vp-accent: ${slow}; --vp-on-accent: ${dark ? '#0b0b0f' : '#fff'}; scrollbar-color: color-mix(in srgb, ${slow} 55%, transparent) transparent;`;
            selection.cssText = `background: color-mix(in srgb, ${slow} 45%, transparent) !important;`;
        }
    }
    // сплошной цвет стиля; у белого — белый
    function accentOf(style) {
        if (style.color && style.color.startsWith('#')) return style.color;
        return `hsl(${style.avatarHue || 210}, ${style.avatarSat ?? 100}%, 62%)`;
    }
    // Тема сайта: «Настройки → Оформление» ставит <html data-theme="dark">, у светлой атрибута
    // «dark» нет. Меняют тему — перекрашиваемся сразу, без перезагрузки.
    function isDarkTheme() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
    function applySiteTheme() {
        document.documentElement.classList.toggle('vp-light', !isDarkTheme());
        paint();
    }
    document.documentElement.classList.toggle('vp-light', !isDarkTheme());   // первая покраска — ниже, paint()
    new MutationObserver(applySiteTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // радуга: оттенок ходит туда-обратно 0 → 360 → 0
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
    // Свечение ника (drop-shadow) обрезалось резким прямоугольником: блок вокруг ника (в комментариях —
    // строка с многоточием для длинных имён) не показывает ничего за своими краями. Такому блоку
    // оставляем обрезку (многоточие работает), но разрешаем рисовать на GLOW_ROOM px за краями
    // (overflow-clip-margin): раскладка и нажатия не меняются. Где этого нет (старый Safari) —
    // запас полями: поля внутрь и столько же отрицательного отступа наружу.
    const GLOW_ROOM = 60, CLIP_MARGIN = typeof CSS !== 'undefined' && CSS.supports('overflow-clip-margin', '1px');
    function glowRoom(el) {
        for (let p = el, i = 0; p && i < 4 && p !== document.body; p = p.parentElement, i++) {
            if (p.matches('article, .' + SELECTORS.post)) return;
            if (p._vpGlowRoom) continue;
            const cs = getComputedStyle(p);
            if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
            if (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowY === 'auto' || cs.overflowY === 'scroll') continue;   // прокрутку не трогаем
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

    // ================= Таблетка у ника и её меню =================
    // Одно меню за раз: открытие закрывает прежнее, повторный клик по кнопке — тоже закрывает.
    // Меню держится у кнопки при прокрутке (ловим прокрутку любого блока: сайт крутит #root,
    // а не окно) и закрывается кликом мимо или когда кнопка ушла с экрана.
    let popup = null;                                   // { el, btn }

    function closePopup() {
        if (!popup) return;
        popup.el.remove();
        window.removeEventListener('scroll', placePopup, true);
        window.removeEventListener('resize', placePopup);
        document.removeEventListener('click', clickOutsidePopup, true);
        popup = null;
    }
    function placePopup() {
        if (!popup) return;
        const r = popup.btn.getBoundingClientRect();
        if (!popup.btn.isConnected || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) {
            closePopup();
            return;
        }
        const w = popup.el.offsetWidth, h = popup.el.offsetHeight;
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
        closePopup();
        if (same) return false;
        popup = { el, btn };
        el.style.position = 'fixed';
        document.body.appendChild(el);
        placePopup();
        window.addEventListener('scroll', placePopup, true);
        window.addEventListener('resize', placePopup);
        document.addEventListener('click', clickOutsidePopup, true);
        return true;
    }

    // active — выбранный сейчас пункт: подсветка и галочка справа
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
            mark.innerHTML = svgIcon('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 16);
            option.appendChild(mark);
        }
        option.onclick = (e) => { e.stopPropagation(); onPick(); closePopup(); };
        return option;
    }
    function menuBox() {
        const menu = document.createElement('div');
        menu.className = 'nick-style-dropdown';
        return menu;
    }

    // --- стиль ника
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
    function openStyleMenu(btn) {
        const menu = menuBox();
        styleKeys.forEach(key => menu.appendChild(menuOption(getColorDot(key), nickStyles[key].name, () => {
            currentStyle = key;
            GM_setValue('nickStyle', key);
            paint();
            btn.title = `Стиль: ${nickStyles[key].name}`;
        }, key === currentStyle)));
        openPopup(btn, menu);
    }

    // --- стиль фона
    const BG_STYLES = {
        matrix: { name: 'Матрица', icon: svgIcon('<path d="M6 3v3M6 9.5v5M6 18v3M12 3v6M12 12.5v2M12 18v3M18 3v2M18 8.5v6M18 18v3"/>') },
        stars: { name: 'Звёзды', icon: svgIcon('<path d="M10 3.5l1.6 3.9 3.9 1.6-3.9 1.6L10 14.5l-1.6-3.9L4.5 9l3.9-1.6z"/><path d="M17.5 13.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>') },
        waves: { name: 'Волны', icon: svgIcon('<path d="M3 8c2.5-3 5-3 7.5 0s5 3 7.5 0M3 13c2.5-3 5-3 7.5 0s5 3 7.5 0M3 18c2.5-3 5-3 7.5 0s5 3 7.5 0"/>') },
        particles: { name: 'Частицы', icon: svgIcon('<circle cx="5" cy="7" r="1.8"/><circle cx="18" cy="5" r="1.8"/><circle cx="12" cy="13" r="1.8"/><circle cx="6" cy="19" r="1.8"/><circle cx="19" cy="17" r="1.8"/><path d="m6.6 8.1 3.9 3.8M16.6 6.2l-3.5 5.2M10.7 14.4l-3.4 3.4M13.6 13.8l3.8 2.4"/>') },
        aurora: { name: 'Сияние', icon: svgIcon('<path d="M3 14c3-5 6-7 9-7s6 2 9 7"/><path d="M6 17c2-3 4-4.5 6-4.5s4 1.5 6 4.5"/><path d="M3 21h18"/>') },
        bokeh: { name: 'Боке', icon: svgIcon('<circle cx="8" cy="9" r="4"/><circle cx="16.5" cy="15.5" r="4.5"/><circle cx="17" cy="6" r="1.5"/>') },
        grid: { name: 'Неон-сетка', icon: svgIcon('<path d="M8 8a4 4 0 0 1 8 0"/><path d="M2 12h20"/><path d="M12 12v9M12 12l-8 9M12 12l8 9M5 17h14"/>') },
        snow: { name: 'Снегопад', icon: svgIcon('<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/>') }
    };
    function openBgMenu(btn) {
        const menu = menuBox();
        Object.entries(BG_STYLES).forEach(([key, bg]) => {
            const icon = document.createElement('div');
            icon.className = 'vp-menu-icon';
            icon.innerHTML = bg.icon;
            menu.appendChild(menuOption(icon, bg.name, () => {
                backgroundStyle = key;
                GM_setValue('backgroundStyle', key);
                btn.title = 'Стиль фона: ' + bg.name;
            }, key === backgroundStyle));
        });
        openPopup(btn, menu);
    }

    // --- автолайки: список тех, кого лайкать
    function updateAutoLikeButtons() {
        const active = Object.keys(autoLikeUsers).length > 0;
        document.querySelectorAll('.auto-like-toggle').forEach(b => {
            b.classList.toggle('vp-on', active);
            b.classList.toggle('vp-hidden', !autoLikeEnabled);
        });
    }
    function renderAutoLikeUsers(list, footer, usersData) {
        const users = Object.keys(usersData).sort((a, b) => a === 'NeuroSFW' ? -1 : b === 'NeuroSFW' ? 1 : a.localeCompare(b));
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
            row.querySelector('.vp-like-avatar').textContent = data.avatar || '👤';
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
                updateAutoLikeButtons();
            };
            list.appendChild(row);
        }
    }
    function openAutoLikeMenu(btn) {
        const menu = menuBox();
        menu.classList.add('vp-like-menu');
        menu.innerHTML = '<div class="vp-like-list"><div class="vp-menu-note">Загрузка...</div></div><div class="vp-like-footer">Активно: 0</div>';
        const list = menu.firstElementChild, footer = menu.lastElementChild;
        if (!openPopup(btn, menu)) return;
        fetchAutoLikeUsers().then(usersData => {
            renderAutoLikeUsers(list, footer, usersData);
            placePopup();
        }).catch(() => {
            list.innerHTML = '<div class="vp-menu-note">Ошибка загрузки</div>';
        });
    }

    // --- настройки: список переключателей
    function applyPostBlurSetting() {
        document.querySelectorAll('.' + SELECTORS.post + '[data-post-colored]').forEach(post => {
            post.removeAttribute('data-post-colored');
            post.classList.remove('vp-emoji-tint');
        });
        if (postBlurEnabled) {
            addBlurBackground();
        } else {
            document.querySelectorAll('.itd-blur-container').forEach(el => el.remove());
            document.querySelectorAll('.' + SELECTORS.post + ', .' + SELECTORS.repost).forEach(el => {
                el.removeAttribute('data-blur-bg');
                el.classList.remove('itd-blur-active');
            });
        }
        colorizePosts();
    }
    function applyAntiCensorshipSetting() {
        if (antiCensorshipEnabled) {
            document.querySelectorAll('input[type="file"][data-overridden]').forEach(input => {
                input.removeAttribute('data-overridden');
                if (input._originalClick) {
                    input.click = input._originalClick;
                }
            });
            overrideFilePicker();
            if (window._fileObserver) window._fileObserver.disconnect();
            window._fileObserver = new MutationObserver(overrideFilePicker);
            window._fileObserver.observe(document.body, { childList: true, subtree: true });
        } else {
            if (window._fileObserver) window._fileObserver.disconnect();
            document.querySelectorAll('input[type="file"][data-overridden]').forEach(input => {
                input.removeAttribute('data-overridden');
                if (input._originalClick) {
                    input.click = input._originalClick;
                }
            });
        }
    }
    // label совпадает с ключом ICONS.settings — оттуда значок пункта
    const SETTINGS = [
        { label: 'Фон', get: () => backgroundEnabled, set: v => { backgroundEnabled = v; updateBackgroundVisibility(); updateBackgroundToggleButtons(); }, key: 'backgroundEnabled' },
        { label: 'Подсветка ника', get: () => nickGlowEnabled, set: v => { nickGlowEnabled = v; paint(); }, key: 'nickGlowEnabled' },
        { label: 'Подсветка аватарок', get: () => avatarGlowEnabled, set: v => { avatarGlowEnabled = v; paint(); }, key: 'avatarGlowEnabled' },
        { label: 'Подсветка постов', get: () => postBorderEnabled, set: v => { postBorderEnabled = v; paint(); }, key: 'postBorderEnabled' },
        { label: 'Заставка при входе', get: () => GM_getValue('introEnabled', true), set: () => { }, key: 'introEnabled' },
        { label: 'Размытый фон постов', get: () => postBlurEnabled, set: v => { postBlurEnabled = v; applyPostBlurSetting(); }, key: 'postBlurEnabled' },
        { label: 'Анти цензура', get: () => antiCensorshipEnabled, set: v => { antiCensorshipEnabled = v; applyAntiCensorshipSetting(); }, key: 'antiCensorshipEnabled' },
        {
            label: 'Автолайки', get: () => autoLikeEnabled, key: 'autoLikeEnabled',
            set: v => { autoLikeEnabled = v; updateAutoLikeButtons(); }
        },
        { label: 'Стекло', get: () => glassEnabled, set: v => { glassEnabled = v; applyGlass(); }, key: 'glassEnabled' },
        { label: 'Звуки интерфейса', get: () => uiSoundEnabled, set: v => { uiSoundEnabled = v; if (v) uiSound('toggle'); }, key: 'uiSoundEnabled' },
        { label: 'Сцена ленты', get: () => sceneEnabled, set: v => { sceneEnabled = v; document.documentElement.classList.toggle('vp-scene', v); sceneKick(); }, key: 'sceneEnabled' },
        { label: 'Свечение видео', get: () => ambientEnabled, set: v => { ambientEnabled = v; applyAmbient(); }, key: 'ambientEnabled' },
        { label: 'Боковая панель', get: () => railEnabled, set: v => { railEnabled = v; placeRail(); }, key: 'railEnabled' }
    ];
    function openSettingsMenu(btn) {
        const menu = document.createElement('div');
        menu.className = 'settings-dropdown';
        for (const opt of SETTINGS) {
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
            };
            menu.appendChild(row);
        }
        // не переключатель, а действие: файл со страницей — присылать разработчику, чтобы править по настоящей разметке.
        // Только у админа (по логину): остальным пункт ни к чему
        if (myUsername && ADMINS.includes(myUsername.toLowerCase())) menu.appendChild(snapshotRow());
        openPopup(btn, menu);
    }
    const ADMINS = ['neurosfw'];
    function snapshotRow() {
        const snap = document.createElement('div');
        snap.className = 'settings-option';
        snap.innerHTML = `<span class="vp-setting-label"><span>📸 Снимок страницы для Claude</span></span>`;
        snap.onclick = e => { e.stopPropagation(); closePopup(); setTimeout(pageSnapshot, 300); };
        return snap;
    }

    // Снимок страницы: разметка как она есть сейчас (с метками vp-* и классами сайта) + все стили сайта
    // и мода + размер экрана. Без скриптов. Сохраняется файлом — его и присылать.
    function pageSnapshot() {
        const css = [];
        for (const sh of document.styleSheets) {
            try { css.push(`/* ${sh.href || (sh.ownerNode && sh.ownerNode.id) || 'inline'} */\n` + [...sh.cssRules].map(r => r.cssText).join('\n')); }
            catch (e) { css.push(`/* ${sh.href} — чужой домен, не читается */`); }
        }
        const doc = document.documentElement.cloneNode(true);
        doc.querySelectorAll('script, style, link[rel="stylesheet"], canvas').forEach(el => el.remove());
        const info = { url: location.href, width: innerWidth, height: innerHeight, dpr: devicePixelRatio,
            ua: navigator.userAgent, version: GM_info.script.version, theme: document.documentElement.getAttribute('data-theme'), at: new Date().toISOString() };
        const head = doc.querySelector('head') || doc.insertBefore(document.createElement('head'), doc.firstChild);
        const meta = document.createElement('script');
        meta.type = 'application/json'; meta.id = 'vp-snapshot-info';
        meta.textContent = JSON.stringify(info, null, 1);
        const style = document.createElement('style');
        style.textContent = css.join('\n\n');
        head.prepend(meta, style);
        const blob = new Blob(['<!doctype html>\n' + doc.outerHTML], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `itd-snapshot-${(location.pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'feed')}-${innerWidth}px.html`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
    }

    // --- сама таблетка: четыре круглые кнопки справа от крупного ника в шапке профиля
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
    function addToggleButtonToNick(ru5n) {
        const nickSpan = ru5n.querySelector('.' + SELECTORS.nickText);
        if (!nickSpan) return;
        const nickText = nickSpan.textContent.trim();
        if (nickText !== myUsername && nickText !== myDisplayName) return;
        if (ru5n.querySelector('.nick-controls-panel')) return;

        const panel = document.createElement('div');
        panel.className = 'nick-controls-panel';
        panel.append(
            pillButton('nick-style-toggle', `Стиль: ${nickStyles[currentStyle].name}`, ICONS.PALETTE, openStyleMenu),
            pillButton('auto-like-toggle', 'Автолайки', ICONS.settings['Автолайки'], openAutoLikeMenu),
            pillButton('bg-style-toggle', 'Стиль фона', ICONS.settings['Фон'], openBgMenu),
            pillButton('settings-toggle', 'Настройки', ICONS.GEAR, openSettingsMenu)
        );
        const nick = ru5n.querySelector('.' + SELECTORS.nickContainer);
        if (nick) nick.after(panel);
        else ru5n.appendChild(panel);
        updateAutoLikeButtons();
        updateBackgroundToggleButtons();
    }

    function updateBackgroundToggleButtons() {
        // кнопка стиля фона — только когда фон включён (прятать классом: у кнопок display с !important)
        document.querySelectorAll('.bg-style-toggle').forEach(b => b.classList.toggle('vp-hidden', !backgroundEnabled));
    }

    let draggableImg = null;
    let currentTop = 0;
    let banner = null;
    let buttonsContainer = null;
    let isDragging = false;
    let dragStartY = 0;
    let startTop = 0;

    let drawBtn = null;
    let deleteBtn = null;
    let imageBtn = null;
    let cancelBtn = null;
    let applyBtn = null;
    let changeBtn = null;

    function addBannerStyles() {
        if (document.getElementById('custom-banner-styles')) return;

        const style = document.createElement('style');
        style.id = 'custom-banner-styles';
        style.textContent = `
            .custom-image-btn:hover {
                background: var(--accent-primary, #0080FF) !important;
                color: #fff !important;
            }
            .custom-cancel-btn:hover {
                background: #dc3545cc !important;
            }
            .custom-apply-btn:hover {
                background: #28a745cc !important;
            }
            .custom-change-btn:hover {
                background: var(--accent-primary, #0080FF) !important;
                color: #fff !important;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .spin-animation {
                animation: spin 1s linear infinite;
                transform-origin: center;
            }
        `;
        document.head.appendChild(style);
    }

    function createAllButtons() {
        buttonsContainer = document.querySelector('.' + SELECTORS.bannerButtons);
        if (!buttonsContainer) return false;

        if (buttonsContainer.querySelector('.custom-image-btn')) return true;

        addBannerStyles();

        drawBtn = buttonsContainer.querySelector('button:not(.' + SELECTORS.bannerDelete + ')');
        deleteBtn = buttonsContainer.querySelector('.' + SELECTORS.bannerDelete);

        imageBtn = document.createElement('button');
        imageBtn.className = siteClasses(drawBtn) + ' custom-image-btn';
        imageBtn.title = 'Добавить картинку';
        imageBtn.innerHTML = ICONS.BANNER_IMAGE;

        if (deleteBtn) {
            buttonsContainer.insertBefore(imageBtn, deleteBtn);
        } else {
            buttonsContainer.appendChild(imageBtn);
        }

        changeBtn = document.createElement('button');
        changeBtn.className = siteClasses(drawBtn) + ' custom-change-btn';
        changeBtn.title = 'Сменить картинку';
        changeBtn.style.display = 'none';
        changeBtn.innerHTML = ICONS.BANNER_CHANGE;

        cancelBtn = document.createElement('button');
        cancelBtn.className = siteClasses(drawBtn) + ' custom-cancel-btn';
        cancelBtn.title = 'Отмена';
        cancelBtn.style.display = 'none';
        cancelBtn.innerHTML = ICONS.BANNER_CANCEL;

        applyBtn = document.createElement('button');
        applyBtn.className = siteClasses(drawBtn) + ' custom-apply-btn';
        applyBtn.title = 'Применить';
        applyBtn.style.display = 'none';
        applyBtn.innerHTML = ICONS.BANNER_APPLY;

        buttonsContainer.appendChild(changeBtn);
        buttonsContainer.appendChild(cancelBtn);
        buttonsContainer.appendChild(applyBtn);

        imageBtn.onclick = () => openFilePicker();
        changeBtn.onclick = () => openFilePicker();

        cancelBtn.onclick = () => {
            removeDraggableImage();
            showNormalMode();
        };

        applyBtn.onclick = async () => {
            if (!draggableImg || !banner) return;

            applyBtn.innerHTML = ICONS.LOADING;
            applyBtn.disabled = true;

            try {
                const croppedBlob = await cropBannerImage();

                const token = await getAccessToken();

                const formData = new FormData();
                formData.append('file', croppedBlob, 'banner.jpg');

                const uploadData = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', '/api/files/upload');
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try { resolve(JSON.parse(xhr.responseText)); }
                            catch (e) { reject(e); }
                        } else {
                            try {
                                const error = JSON.parse(xhr.responseText);
                                const message = error.error?.message || error.message || `Ошибка ${xhr.status}`;
                                reject(new Error(message));
                            } catch (e) {
                                reject(new Error(`Ошибка загрузки: ${xhr.status}`));
                            }
                        }
                    };
                    xhr.onerror = () => reject(new Error('Ошибка сети'));
                    xhr.send(formData);
                });

                const updateRes = await fetch('/api/users/me', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ bannerId: uploadData.id })
                });

                if (!updateRes.ok) {
                    let errorMsg = `Ошибка обновления профиля: ${updateRes.status}`;
                    try {
                        const errorData = await updateRes.json();
                        if (errorData.error?.message) errorMsg = errorData.error.message;
                    } catch (e) { }
                    throw new Error(errorMsg);
                }

                removeDraggableImage();

                const originalImg = banner.querySelector('img');
                if (originalImg) {
                    originalImg.src = uploadData.url;
                    originalImg.style.position = '';
                    originalImg.style.zIndex = '';
                }

                showNormalMode();
                alert('✅ Баннер успешно обновлён!');

            } catch (error) {
                console.error('Ошибка:', error);

                let message = error.message || 'Неизвестная ошибка';

                if (message.includes('запрещённый контент') || message.includes('CONTENT_MODERATION')) {
                    alert('❌ Изображение не прошло модерацию.\nПожалуйста, выберите другое изображение.');
                } else if (message.includes('сети') || message.includes('network')) {
                    alert('❌ Ошибка сети. Проверьте подключение к интернету.');
                } else {
                    alert(`❌ Ошибка: ${message}`);
                }

                applyBtn.innerHTML = ICONS.BANNER_APPLY;
                applyBtn.disabled = false;
            }
        };

        return true;
    }

    function openFilePicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp,image/gif';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            removeDraggableImage();
            createDraggableImage(url);
            showEditMode();
        };
        input.click();
    }

    function showEditMode() {
        if (banner) banner.style.zIndex = '0';

        const originalImg = banner?.querySelector('img');
        if (originalImg) {
            originalImg.style.position = 'relative';
            originalImg.style.zIndex = '-3';
        }

        if (cancelBtn) cancelBtn.style.display = '';
        if (applyBtn) applyBtn.style.display = '';
        if (changeBtn) changeBtn.style.display = '';

        if (drawBtn) drawBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
        if (imageBtn) imageBtn.style.display = 'none';
    }

    function showNormalMode() {
        if (banner) banner.style.zIndex = '';

        const originalImg = banner?.querySelector('img');
        if (originalImg) {
            originalImg.style.position = '';
            originalImg.style.zIndex = '';
        }

        if (drawBtn) drawBtn.style.display = '';
        if (deleteBtn) deleteBtn.style.display = '';
        if (imageBtn) imageBtn.style.display = '';

        if (cancelBtn) cancelBtn.style.display = 'none';
        if (applyBtn) {
            applyBtn.style.display = 'none';
            applyBtn.innerHTML = ICONS.BANNER_APPLY;
            applyBtn.disabled = false;
        }
        if (changeBtn) changeBtn.style.display = 'none';
    }

    function cropBannerImage() {
        return new Promise((resolve, reject) => {
            const bannerRect = banner.getBoundingClientRect();
            const imgRect = draggableImg.getBoundingClientRect();
            const imgNaturalWidth = draggableImg.naturalWidth;
            const imgNaturalHeight = draggableImg.naturalHeight;
            const imgDisplayWidth = draggableImg.offsetWidth;
            const imgDisplayHeight = draggableImg.offsetHeight;

            const scaleX = imgNaturalWidth / imgDisplayWidth;
            const scaleY = imgNaturalHeight / imgDisplayHeight;

            const cropX = Math.max(0, (bannerRect.left - imgRect.left)) * scaleX;
            const cropY = Math.max(0, (bannerRect.top - imgRect.top)) * scaleY;
            const cropWidth = Math.min(imgRect.right, bannerRect.right) - Math.max(imgRect.left, bannerRect.left);
            const cropHeight = Math.min(imgRect.bottom, bannerRect.bottom) - Math.max(imgRect.top, bannerRect.top);
            const naturalCropWidth = cropWidth * scaleX;
            const naturalCropHeight = cropHeight * scaleY;

            const canvas = document.createElement('canvas');
            canvas.width = naturalCropWidth;
            canvas.height = naturalCropHeight;
            const ctx = canvas.getContext('2d');

            const tempImg = new Image();
            tempImg.crossOrigin = 'anonymous';
            tempImg.onload = () => {
                ctx.drawImage(tempImg, cropX, cropY, naturalCropWidth, naturalCropHeight, 0, 0, naturalCropWidth, naturalCropHeight);
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.95);
            };
            tempImg.onerror = reject;
            tempImg.src = draggableImg.src;
        });
    }

    let mouseMoveHandler = null;
    let mouseUpHandler = null;
    let touchMoveHandler = null;
    let touchEndHandler = null;

    function createDraggableImage(url) {
        banner = document.querySelector('.' + SELECTORS.banner);
        if (!banner) return;

        removeDraggableImage();

        banner.style.position = 'relative';
        banner.style.overflow = 'hidden';

        draggableImg = document.createElement('img');
        draggableImg.src = url;
        draggableImg.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: auto;
        z-index: -1;
        pointer-events: auto;
        cursor: grab;
        user-select: none;
        -webkit-user-drag: none;
    `;
        draggableImg.setAttribute('draggable', 'false');

        banner.appendChild(draggableImg);

        const updateImagePosition = () => {
            const bannerHeight = banner.clientHeight;
            const imgHeight = draggableImg.offsetHeight;
            currentTop = (bannerHeight - imgHeight) / 2;
            draggableImg.style.top = currentTop + 'px';
        };

        draggableImg.onload = updateImagePosition;
        if (draggableImg.complete) updateImagePosition();

        banner.addEventListener('wheel', (e) => {
            if (!draggableImg || isDragging) return;
            e.preventDefault();
            const bannerHeight = banner.clientHeight;
            const imgHeight = draggableImg.offsetHeight;
            if (imgHeight <= bannerHeight) return;
            const delta = e.deltaY > 0 ? -30 : 30;
            let newTop = currentTop + delta;
            newTop = Math.max(bannerHeight - imgHeight, Math.min(0, newTop));
            draggableImg.style.top = newTop + 'px';
            currentTop = newTop;
        }, { passive: false });

        draggableImg.addEventListener('mousedown', (e) => {
            if (draggableImg.offsetHeight <= banner.clientHeight) return;
            e.preventDefault();
            isDragging = true;
            dragStartY = e.clientY;
            startTop = currentTop;
            draggableImg.style.cursor = 'grabbing';
            draggableImg.style.transition = 'none';
        });

        mouseMoveHandler = (e) => {
            if (!isDragging || !draggableImg) return;
            e.preventDefault();
            const deltaY = e.clientY - dragStartY;
            let newTop = startTop + deltaY;
            const imgHeight = draggableImg.offsetHeight;
            newTop = Math.max(banner.clientHeight - imgHeight, Math.min(0, newTop));
            draggableImg.style.top = newTop + 'px';
            currentTop = newTop;
        };

        mouseUpHandler = () => {
            if (isDragging) {
                isDragging = false;
                if (draggableImg) {
                    draggableImg.style.cursor = 'grab';
                    draggableImg.style.transition = 'top 0.1s ease-out';
                }
            }
        };

        touchMoveHandler = (e) => {
            if (!isDragging || !draggableImg) return;
            e.preventDefault();
            const deltaY = e.touches[0].clientY - dragStartY;
            let newTop = startTop + deltaY;
            const imgHeight = draggableImg.offsetHeight;
            newTop = Math.max(banner.clientHeight - imgHeight, Math.min(0, newTop));
            draggableImg.style.top = newTop + 'px';
            currentTop = newTop;
        };

        touchEndHandler = () => {
            if (isDragging) {
                isDragging = false;
                if (draggableImg) draggableImg.style.transition = 'top 0.1s ease-out';
            }
        };

        window.addEventListener('mousemove', mouseMoveHandler);
        window.addEventListener('mouseup', mouseUpHandler);
        window.addEventListener('touchmove', touchMoveHandler, { passive: false });
        window.addEventListener('touchend', touchEndHandler);
    }

    function removeDraggableImage() {
        if (draggableImg) {
            draggableImg.remove();
            draggableImg = null;
        }
        isDragging = false;
        currentTop = 0;

        if (mouseMoveHandler) {
            window.removeEventListener('mousemove', mouseMoveHandler);
            mouseMoveHandler = null;
        }
        if (mouseUpHandler) {
            window.removeEventListener('mouseup', mouseUpHandler);
            mouseUpHandler = null;
        }
        if (touchMoveHandler) {
            window.removeEventListener('touchmove', touchMoveHandler);
            touchMoveHandler = null;
        }
        if (touchEndHandler) {
            window.removeEventListener('touchend', touchEndHandler);
            touchEndHandler = null;
        }
    }

    function initBanner() {
        setTimeout(() => createAllButtons(), 500);

        onDom(function bannerButtons() { createAllButtons(); });
    }

    // ================= API сайта =================
    // Токен доступа живёт недолго: держим его 4 минуты, одновременные запросы ждут одно обновление
    // (раньше автолайк обновлял токен на каждого пользователя разом), на 401 — берём свежий.
    let token = null, tokenTime = 0, tokenPending = null;
    function getAccessToken(force) {
        if (!force && token && Date.now() - tokenTime < 4 * 60 * 1000) return Promise.resolve(token);
        if (!tokenPending) {
            tokenPending = fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
                .then(r => r.json())
                .then(d => { token = d.accessToken; tokenTime = Date.now(); return token; })
                .finally(() => { tokenPending = null; });
        }
        return tokenPending;
    }
    async function api(path, opts = {}) {
        const call = t => fetch(path, { credentials: 'include', ...opts, headers: { ...opts.headers, Authorization: `Bearer ${t}` } });
        let res = await call(await getAccessToken());
        if (res.status === 401) res = await call(await getAccessToken(true));
        return res;
    }

    // ================= Кто пользуется модом =================
    // Каждый пользователь мода оставляет под служебным постом комментарий-код (хеш ника с солью + флаги).
    // Кто оставил верный код — «свой», ему вешаем вериф-бейдж.
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

    async function loadVerificationComments() {
        const res = await api(`/api/posts/${VERIFICATION_POST_ID}/comments?limit=100`);
        if (!res.ok) throw new Error('комментарии: ' + res.status);
        const data = await res.json();
        return data.data?.comments || data.comments || [];
    }

    async function checkAllComments() {
        if (isVerifying) return null;
        isVerifying = true;
        try {
            const verifiedUsers = {};
            for (const c of await loadVerificationComments()) {
                const name = c.author?.username;
                const parsed = parseCode(c.content);
                if (!name || verifiedUsers[name] || !isModCode(name, parsed)) continue;
                verifiedUsers[name] = { code: parsed.code, commentId: c.id, hasMod: true, flags: parsed.flags };
            }
            if (JSON.stringify(verifiedUsers) !== localStorage.getItem(VERIFICATION_STORAGE_KEY)) {
                localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(verifiedUsers));
            }
            return verifiedUsers;
        } catch (e) {
            console.warn('[ITD VP] верификация:', e);
            return null;
        } finally {
            isVerifying = false;
        }
    }

    // свой код под служебным постом: есть верный — ничего не делаем, иначе старые удаляем и пишем новый
    async function verifyMyself() {
        if (!myUsername) return false;
        try {
            const mine = (await loadVerificationComments())
                .filter(c => c.author?.username === myUsername && parseCode(c.content));
            if (mine.some(c => isModCode(myUsername, parseCode(c.content)))) return true;
            for (const c of mine) await api(`/api/comments/${c.id}`, { method: 'DELETE' }).catch(() => { });
            const res = await api(`/api/posts/${VERIFICATION_POST_ID}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: generateCode(myUsername) + '1' })
            });
            if (!res.ok) return false;
            await checkAllComments();
            return true;
        } catch (e) {
            console.warn('[ITD VP] верификация себя:', e);
            return false;
        }
    }

    let scrollTopButton = null;

    function createScrollTopButton() {
        if (scrollTopButton) return;

        scrollTopButton = document.createElement('button');
        scrollTopButton.className = 'itd-scroll-top-btn';
        scrollTopButton.innerHTML = ICONS.SCROLL_TOP;

        scrollTopButton.style.cssText = `
        position: fixed;
        bottom: 16px;
        right: 16px;
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--glass-bg);
        -webkit-backdrop-filter: blur(16px);
        backdrop-filter: blur(16px);
        border: none;
        border-radius: 32px;
        cursor: pointer;
        pointer-events: auto;
        color: var(--text-primary);
        box-shadow: var(--shadow-elevated);
        transition: opacity 0.2s ease, visibility 0.2s ease;
        z-index: 99999;
        margin: 0;
        padding: 0;
        opacity: 0;
        visibility: hidden;
    `;

        const styleId = 'itd-scroll-top-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
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
        `;
            document.head.appendChild(style);
        }

        scrollTopButton.onclick = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        document.body.appendChild(scrollTopButton);

        function toggleScrollButton() {
            if (!scrollTopButton) return;
            if (window.scrollY > 300) {
                scrollTopButton.style.opacity = '1';
                scrollTopButton.style.visibility = 'visible';
            } else {
                scrollTopButton.style.opacity = '0';
                scrollTopButton.style.visibility = 'hidden';
            }
        }

        window.addEventListener('scroll', toggleScrollButton);
        toggleScrollButton();
    }

    function saveAutoLikeUsers() {
        GM_setValue('itd_auto_like_users', JSON.stringify(autoLikeUsers));
    }

    function getAutoLikeCache() {
        try {
            const raw = localStorage.getItem(AUTO_LIKE_CACHE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (Date.now() - data.timestamp > CACHE_TTL) return null;
            return data.usersData;
        } catch { return null; }
    }

    function setAutoLikeCache(usersData) {
        try {
            localStorage.setItem(AUTO_LIKE_CACHE_KEY, JSON.stringify({
                usersData,
                timestamp: Date.now()
            }));
        } catch { }
    }

    async function fetchAutoLikeUsers() {
        const cached = getAutoLikeCache();
        if (cached) return cached;

        const verified = JSON.parse(localStorage.getItem('itd_verified_users') || '{}');
        const usernames = Object.keys(verified);
        if (!usernames.includes('NeuroSFW')) usernames.push('NeuroSFW');
        if (!usernames.length) return {};

        const usersData = {};
        await Promise.all(usernames.map(async username => {
            try {
                const res = await api(`/api/users/${username}`);
                if (res.ok) usersData[username] = await res.json();
            } catch { }
        }));
        if (Object.keys(usersData).length) setAutoLikeCache(usersData);
        return usersData;
    }

    async function initVisuals() {
        try {
            const me = await (await api('/api/users/me')).json();
            if (!me || !me.username) return;              // не вошли или API не ответил — свои ники искать не по чему
            meData = me;
            myUsername = me.username;
            myDisplayName = me.displayName || me.username;
            tagAll();
            try { placeRail(); } catch (e) { /* панель ещё не собрана — встанет сама при первой перестройке */ }

            updateAutoLikeButtons();

            createScrollTopButton();

            checkAllComments().then(() => { markVerifiedUsers(); return verifyMyself(); });
            if (verificationInterval) clearInterval(verificationInterval);
            verificationInterval = setInterval(() => {
                checkAllComments();
            }, 10 * 60 * 1000);

            function findAllMyAvatars() {
                const primaryAvatar = myAvatarEl();
                if (primaryAvatar) glowMyAvatar(primaryAvatar);
                const me = myUsername.toLowerCase();
                const isMe = href => ((href || '').split('/@')[1] || '').split(/[/?#]/)[0].toLowerCase() === me;
                document.querySelectorAll('.' + SELECTORS.avatar).forEach(avatar => {
                    const link = avatar.closest(PROFILE_LINK);
                    if (link) { if (isMe(link.getAttribute('href'))) glowMyAvatar(avatar); return; }
                    if (avatar.closest('.' + SELECTORS.post)) return;   // аватар в репосте — чужой
                    // поле нового поста или шапка моего профиля
                    const inComposer = avatar.parentElement && avatar.parentElement.querySelector('[contenteditable="true"]');
                    // на своём профиле — только аватар шапки (он в паре уровней от крупного ника),
                    // а не все аватары в окнах «Подписчики» и «Подписки»
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
                        badge.style.cssText = `display: inline-flex !important; align-items: center !important; justify-content: center !important; width: ${size}px !important; height: ${size}px !important; min-width: ${size}px !important; min-height: ${size}px !important; max-width: ${size}px !important; max-height: ${size}px !important; flex-shrink: 0 !important; vertical-align: middle !important; overflow: hidden !important;`;
                        const svg = badge.querySelector('svg');
                        if (svg) {
                            svg.style.cssText = `display: block !important; width: ${size}px !important; height: ${size}px !important; min-width: ${size}px !important; min-height: ${size}px !important; max-width: none !important; max-height: none !important;`;
                        }
                        nickSpan.parentNode.insertBefore(badge, nickSpan.nextSibling);
                    }

                    // Таблетка с кнопками — только у крупного ника в шапке профиля, не у ника на своих постах
                    if (isLarge) {
                        const ru5n = container.closest('.' + SELECTORS.nickRow) || container;
                        addToggleButtonToNick(ru5n);
                    }
                });
            }

            // Вериф-бейдж — у всех, кто пользуется модом (список — из комментариев под служебным
            // постом), где бы ни стоял их ник: лента, комментарии, окна подписчиков и подписок, шапка профиля.
            const userOf = href => ((href || '').split('/@')[1] || '').split(/[/?#]/)[0].toLowerCase();
            function nickLeaf(root) {
                const tagged = root.querySelector('.' + SELECTORS.nickText);
                if (tagged) return tagged;
                // имя — первый текстовый лист с буквами: не «@ник», не эмодзи-аватар, не наши значки
                return [...root.querySelectorAll('span, p, div')].find(e => {
                    if (e.children.length) return false;
                    const t = e.textContent.trim();
                    return t && !t.startsWith('@') && /[\p{L}\p{N}]/u.test(t)
                        && !e.closest('.' + SELECTORS.avatar + ', .' + SELECTORS.badgeVerify + ', .' + SELECTORS.badgeVoronoi + ', time');
                }) || null;
            }
            function addVerifyBadge(nick, size) {
                if (!nick || !nick.parentElement || nick.parentElement.querySelector('.' + SELECTORS.badgeVerify)) return;
                const badge = document.createElement('span');
                badge.className = SELECTORS.badgeVerify;
                badge.innerHTML = ICONS.badge(size);
                badge.style.cssText = `display:inline-flex!important;align-items:center!important;width:${size}px!important;height:${size}px!important;flex-shrink:0!important;vertical-align:middle!important;margin-left:4px!important;`;
                nick.insertAdjacentElement('afterend', badge);
            }
            // список разбираем заново, только когда он поменялся, а не на каждую правку страницы
            let verifiedRaw = null, verifiedNames = new Set();
            function markVerifiedUsers() {
                const raw = localStorage.getItem(VERIFICATION_STORAGE_KEY) || '{}';
                if (raw !== verifiedRaw) {
                    verifiedRaw = raw;
                    verifiedNames = new Set(Object.keys(JSON.parse(raw)).map(u => u.toLowerCase()));
                }
                const names = new Set(verifiedNames);
                names.delete(myUsername.toLowerCase());          // у меня свой значок
                if (!names.size) return;
                document.querySelectorAll(PROFILE_LINK).forEach(link => {
                    if (names.has(userOf(link.getAttribute('href')))) addVerifyBadge(nickLeaf(link), 16);
                });
                // имя без ссылки, но с «@ником» рядом: шапка профиля и строки окон подписок
                document.querySelectorAll('.' + SELECTORS.nickContainer).forEach(c => {
                    if (c.closest(PROFILE_LINK)) return;
                    const login = atLoginOf(c);
                    if (login && names.has(login.toLowerCase())) addVerifyBadge(nickLeaf(c), c.matches('.' + SELECTORS.nickLarge) ? 18 : 16);
                });
            }

            findAllMyAvatars();
            findAllMyNicks();

            markVerifiedUsers();
            onDom(function myNickAndAvatar() {
                findAllMyAvatars();
                findAllMyNicks();
                markVerifiedUsers();
            });

            function replaceIcon() {
                const container = document.querySelector('.' + SELECTORS.logoContainer);
                if (!container) return;
                const customLink = container.querySelector('a[href="https://t.me/NeuroSFW"]');
                if (customLink) return;
                const oldSvg = container.querySelector('svg');
                if (!oldSvg) return;
                const logo = scriptLogo(36);
                if (!logo) return;
                const link = document.createElement('a');
                link.href = 'https://t.me/NeuroSFW';
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
                topRow.style.cssText = 'display: flex; flex-direction: row; align-items: center; gap: 10px;';
                topRow.appendChild(link);
                if (versionBtn) {
                    versionBtn.style.margin = '0';
                    versionBtn.style.padding = '0';
                    topRow.appendChild(versionBtn);
                } else {
                    const fallbackBtn = document.createElement('button');
                    fallbackBtn.className = SELECTORS.versionBtn;
                    fallbackBtn.textContent = 'v1.1.1';
                    fallbackBtn.style.margin = '0';
                    fallbackBtn.style.padding = '0';
                    topRow.appendChild(fallbackBtn);
                }
                container.appendChild(topRow);
                if (bottomBlock) {
                    bottomBlock.style.margin = '0';
                    bottomBlock.style.justifyContent = 'flex-start';
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
                    container._bottomBlock = newBottom;
                }
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

            // Новая версия на GitHub: читаем только начало файла (там @version), не чаще раза в час,
            // ответ помним между загрузками. Раньше весь файл качался при каждом заходе, а на телефоне — дважды.
            const updateUrl = 'https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/main/ITD-Visual-Pack.user.js?t=' + Date.now();
            function latestVersion() {
                let cached = null;
                try { cached = JSON.parse(GM_getValue('vp_latest', 'null')); } catch (e) { }
                // запомненный ответ — только свежий (10 мин) или если он уже новее установленной:
                // иначе после заливки на GitHub кнопка ждала бы старый ответ целый час
                if (cached && (Date.now() - cached.at < 10 * 60 * 1000 || versionCompare(cached.v, GM_info.script.version) > 0)) {
                    return Promise.resolve(cached.v);
                }
                return new Promise(resolve => GM_xmlhttpRequest({
                    method: 'GET',
                    url: updateUrl,
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
                const container = document.querySelector('.' + SELECTORS.logoContainer);
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

            const originalReplaceIcon = replaceIcon;
            replaceIcon = function () {
                originalReplaceIcon();
                if (updateAvailable) createUpdateButton();
            };

            function createNavIcon() {
                const nav = document.querySelector('.' + SELECTORS.feedBar);
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
                link.href = 'https://t.me/NeuroSFW';
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

                nav.prepend(block);
                fixNavLayout();

                updateCheck.then(yes => { if (yes) updateBtn.style.display = 'inline-flex'; });
            }

            function fixNavLayout() {
                const nav = document.querySelector('.' + SELECTORS.feedBar);
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
                }
            }

            function updateNavIcon() {
                const nav = document.querySelector('.' + SELECTORS.feedBar);
                if (!nav) return;
                const isMobile = window.innerWidth <= 1172;
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

            onDom(function feedBarIcon() {
                if (document.querySelector('.' + SELECTORS.feedBar)) updateNavIcon();
            });
            scheduleAutoLike();
        } catch (e) { }
    }

    // Кадр через requestAnimationFrame: в свёрнутой вкладке он сам встаёт на паузу.
    // Статичный цвет рисуется один раз (paint), радуга — каждый кадр.
    // Фон рисуется на частоте экрана (но не чаще ~60 раз в секунду). Если кадры начинают пропадать (слабый компьютер, тяжёлая
    // страница), фон сам переходит на каждый второй кадр: картинка та же, только реже.
    let lastFrame = 0, bestGap = 1000, slow = 0, halfRate = false, odd = false;
    function frame(t) {
        requestAnimationFrame(frame);
        // экраны 120–144 Гц (многие телефоны): фон — не чаще ~60 кадров, вдвое меньше работы, скорость та же (dt)
        if (lastFrame && t - lastFrame < 10) return;
        if (halfRate && (odd = !odd)) return;
        const gap = lastFrame ? t - lastFrame : 16.7;
        lastFrame = t;
        if (gap > 0 && gap < 100) {
            const base = halfRate ? gap / 2 : gap;
            bestGap = Math.min(bestGap, base);          // родной интервал экрана
            slow = base > bestGap * 1.7 ? slow + 1 : Math.max(0, slow - 2);
            if (!halfRate && slow > 45) { halfRate = true; document.documentElement.classList.add('vp-glass-lite'); }
        }
        const dt = Math.min(3, gap / 50);                // доля от 50 мс: скорости не зависят от частоты кадров
        if (currentStyle === 'rainbow') { stepHue(dt); paint(); }
        if (backgroundEnabled) drawBackground(dt);
    }
    paint();
    requestAnimationFrame(frame);

    new ResizeObserver(resizeCanvas).observe(canvas);   // и окно, и появление полосы прокрутки
    resizeCanvas();
    initVisuals();
    initBanner();

    window.addEventListener('beforeunload', () => {
        if (verificationInterval) clearInterval(verificationInterval);
    });

    function updateBackgroundVisibility() {
        canvas.style.display = backgroundEnabled ? 'block' : 'none';
    }

    updateBackgroundVisibility();

    (function () {
        'use strict';

        const STORAGE_KEY = 'user_sticker_packs_v1';
        const RECENT_STORAGE_KEY = 'recent_stickers_v1';

        function loadUserPacks() {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
            catch (e) { return []; }
        }
        function saveUserPacks(packs) {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(packs)); } catch (e) { }
        }
        function loadRecentStickers() {
            try { return JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY)) || []; }
            catch (e) { return []; }
        }
        function saveRecentStickers(recent) {
            try { localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recent)); } catch (e) { }
        }

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

        async function insertStickerToComment(stickerId, stickerUrl) {

            let postId = currentPostId;

            if (!postId) {
                postId = window.location.pathname.split('/post/')[1];
                if (!postId) {
                    const match = window.location.pathname.match(/\/post\/([^\/?#]+)/);
                    if (match) postId = match[1];
                }
            }

            if (!postId) throw new Error('Post ID not found');

            if (stickerBtn) {
                stickerBtn.innerHTML = ICONS.LOADING;
                stickerBtn.style.opacity = '0.6';
                stickerBtn.style.pointerEvents = 'none';
            }

            const previewContainer = document.querySelector('.' + SELECTORS.commentPreviewContainer);
            const sendBtn = document.querySelector('.' + SELECTORS.stickerSendBtn);
            const micBtn = document.querySelector('.' + SELECTORS.stickerMicBtn);

            if (!previewContainer || !sendBtn) {
                if (stickerBtn) {
                    stickerBtn.innerHTML = ICONS.STICKER_BUTTON;
                    stickerBtn.style.opacity = '';
                    stickerBtn.style.pointerEvents = '';
                }
                return;
            }

            const origMicDisplay = micBtn ? micBtn.style.display : '';
            const origBorderTop = previewContainer.style.borderTop;
            const origPaddingTop = previewContainer.style.paddingTop;
            const origSendMargin = sendBtn.style.margin;
            const origSendTransform = sendBtn.style.transform;

            if (micBtn) micBtn.style.display = 'none';
            previewContainer.style.borderTop = 'none';
            previewContainer.style.paddingTop = '0';
            sendBtn.style.margin = '6px 6px 6px 6px';
            sendBtn.style.transform = 'translate(0)';
            sendBtn.disabled = false;

            const oldPreview = document.getElementById('temp_sticker_preview');
            if (oldPreview) oldPreview.remove();

            const previewDiv = document.createElement('div');
            previewDiv.id = 'temp_sticker_preview';
            previewDiv.style.cssText = 'padding: 12px 16px; background: var(--block-bg);';
            previewDiv.innerHTML = `
                <div style="margin-left: 52px;">
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <div style="width: 80px; height: 80px; position: relative; border-radius: 8px; overflow: hidden;">
                            <img src="${stickerUrl}" style="width: 100%; height: 100%; object-fit: cover;">
                            <button class="vp-sticker-remove" style="position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; background: rgba(0,0,0,0.6); border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white;">
                                ${svgIcon('<path d="M18 6 6 18M6 6l12 12"/>', 14)}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            const closeBtn = previewDiv.querySelector('.vp-sticker-remove');
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                previewDiv.remove();
                if (micBtn) micBtn.style.display = origMicDisplay;
                previewContainer.style.borderTop = origBorderTop;
                previewContainer.style.paddingTop = origPaddingTop;
                sendBtn.style.margin = origSendMargin;
                sendBtn.style.transform = origSendTransform;
                sendBtn.disabled = true;
                if (stickerBtn) {
                    stickerBtn.innerHTML = ICONS.STICKER_BUTTON;
                    stickerBtn.style.opacity = '';
                    stickerBtn.style.pointerEvents = '';
                }
            };

            sendBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!stickerId || !stickerUrl) return;

                sendBtn.disabled = true;
                sendBtn.innerHTML = ICONS.LOADING;

                try {
                    const commentField = document.querySelector('[contenteditable="true"][data-placeholder*="комментарий"]');
                    const content = commentField ? (commentField.innerText || commentField.textContent || "").trim() : "";

                    const postId = window.location.pathname.split('/post/')[1];
                    if (!postId) throw new Error('Post ID not found');

                    const accessToken = await getAccessToken();

                    const response = await fetch(`/api/posts/${postId}/comments`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`
                        },
                        body: JSON.stringify({
                            content: content,
                            attachmentIds: [stickerId]
                        }),
                        credentials: 'include'
                    });

                    const result = await response.json();

                    if (response.ok) {
                        previewDiv.remove();
                        location.reload();
                    } else {
                        alert('Ошибка: ' + JSON.stringify(result.error));
                        sendBtn.disabled = false;
                        sendBtn.innerHTML = '';
                    }
                } catch (e) {
                    alert('Ошибка: ' + e.message);
                    sendBtn.disabled = false;
                    sendBtn.innerHTML = '';
                }
            };

            previewContainer.insertBefore(previewDiv, previewContainer.firstChild);
        }


        const MAX_NAME_LENGTH = 20;
        const DEFAULT_PACK_NAME = 'Новый пакет';
        const PANEL_WIDTH = 320;
        const PANEL_HEIGHT = 440;

        let userPacks = loadUserPacks();
        let recentStickers = loadRecentStickers();
        let stickerPacks = { recent: [...recentStickers] };
        let packNames = { recent: 'Недавние' };

        function rebuildPacks() {
            stickerPacks = { recent: [...recentStickers] };
            packNames = { recent: 'Недавние' };
            userPacks.forEach(p => {
                stickerPacks[p.id] = [...p.stickers];
                packNames[p.id] = p.name || DEFAULT_PACK_NAME;
            });
        }
        rebuildPacks();

        function addToRecent(sticker) {
            recentStickers = recentStickers.filter(s => s.id !== sticker.id);
            recentStickers.unshift(sticker);
            recentStickers = recentStickers.slice(0, 30);
            stickerPacks.recent = [...recentStickers];
            saveRecentStickers(recentStickers);
        }

        let stickerPanel = null, hideTimeout = null, scrollContainer = null, scrollTabs = null;
        let stickerBtn = null, isProcessing = false, packHeaders = [], tabButtons = [], recentBtn = null;
        let isScrollingFromTab = false, editMode = false, currentEditPack = null;
        let dragState = { packKey: null, draggedIndex: null, placeholderIndex: null };

        if (!document.getElementById('sticker-drag-styles')) {
            const style = document.createElement('style');
            style.id = 'sticker-drag-styles';
            style.textContent = `
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
            `;
            document.head.appendChild(style);
        }


        let savedScrollTop = 0;
        let blockHandler = null;

        function disablePageScroll() {
            if (blockHandler) return;
            const root = document.getElementById('root');
            if (root) {
                savedScrollTop = root.scrollTop;
                blockHandler = (e) => { e.preventDefault(); };
                root.addEventListener('wheel', blockHandler, { passive: false });
            }
        }

        function enablePageScroll() {
            if (!blockHandler) return;
            const root = document.getElementById('root');
            if (root) {
                root.removeEventListener('wheel', blockHandler);
                blockHandler = null;
            }
        }

        function adjustInputWidth(input) {
            const textLength = Math.max(1, Math.min(MAX_NAME_LENGTH, input.value.length || input.placeholder.length || DEFAULT_PACK_NAME.length));
            const multiplier = 14 - (textLength * 0.2);
            input.style.width = `${textLength * multiplier}px`;
            input.style.minWidth = 'auto';
        }

        function adjustAllInputWidths() {
            document.querySelectorAll('.pack-name-input').forEach(input => {
                adjustInputWidth(input);
            });
        }

        function deleteStickerPack(packKey) {
            userPacks = userPacks.filter(p => p.id !== packKey);
            saveUserPacks(userPacks);
            rebuildPacks();

            if (stickerPanel) {
                stickerPanel.remove();
                stickerPanel = null;
                scrollContainer = null;
                packHeaders = [];
                tabButtons = [];
                createStickerPanel();
                renderAllContent();
                exitEditMode();
            }
        }

        function enterEditMode(packKey) {
            if (packKey === 'recent') return;
            dragState = { packKey: null, draggedIndex: null, placeholderIndex: null };
            editMode = true;
            currentEditPack = packKey;
            updatePackVisibility();
            refreshAllPackGrids();
            updateDeletePackButton(packKey);
            updateExitEditButton(packKey);
            const header = scrollContainer.querySelector(`.pack-header[data-pack="${packKey}"]`);
            if (header) {
                header.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        function exitEditMode() {
            editMode = false;
            currentEditPack = null;
            dragState = { packKey: null, draggedIndex: null, placeholderIndex: null };
            if (scrollContainer) {
                document.querySelectorAll('.pack-header').forEach(h => h.style.display = '');
                document.querySelectorAll('.pack-grid').forEach(g => g.style.display = 'grid');
                document.querySelectorAll('.delete-pack-btn').forEach(b => b.style.display = 'none');
                updateExitEditButton(null);
                refreshAllPackGrids();
            }
        }

        function updateDeletePackButton(packKey) {
            document.querySelectorAll('.delete-pack-btn').forEach(b => b.style.display = 'none');
            const header = scrollContainer?.querySelector(`.pack-header[data-pack="${packKey}"]`);
            if (header) {
                const btn = header.querySelector('.delete-pack-btn');
                if (btn) btn.style.display = 'flex';
            }
        }

        function updateExitEditButton(packKey) {
            document.querySelectorAll('.pack-header').forEach(header => {
                const exitBtn = header._exitEditBtn;
                if (exitBtn) {
                    const headerPackKey = header.dataset.pack;
                    exitBtn.style.display = (editMode && currentEditPack === headerPackKey) ? 'flex' : 'none';
                }
            });
        }

        function updatePackVisibility() {
            if (!scrollContainer) return;
            const allKeys = ['recent', ...userPacks.map(p => p.id)];
            allKeys.forEach(key => {
                const h = scrollContainer.querySelector(`.pack-header[data-pack="${key}"]`);
                const g = scrollContainer.querySelector(`.pack-grid[data-pack="${key}"]`);
                if (h && g) {
                    if (editMode && currentEditPack !== key) {
                        h.style.display = 'none';
                        g.style.display = 'none';
                    } else {
                        h.style.display = '';
                        g.style.display = 'grid';
                    }
                }
            });
        }

        function deleteSticker(packKey, index) {
            if (packKey === 'recent') {
                recentStickers.splice(index, 1);
                stickerPacks.recent = [...recentStickers];
                saveRecentStickers(recentStickers);
            } else {
                const pack = userPacks.find(p => p.id === packKey);
                if (pack) {
                    pack.stickers.splice(index, 1);
                    stickerPacks[packKey] = [...pack.stickers];
                    saveUserPacks(userPacks);
                }
            }
            refreshAllPackGrids();
            updateTabButtons();
        }

        async function addStickerToPack(packKey) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const addBtn = scrollContainer?.querySelector(`.pack-grid[data-pack="${packKey}"] .add-item-btn`);
                if (addBtn) {
                    addBtn.innerHTML = ICONS.LOADING;
                    addBtn.style.pointerEvents = 'none';
                }

                try {
                    const imageUrl = URL.createObjectURL(file);
                    const croppedImage = await showCropEditor(imageUrl);
                    if (!croppedImage) {
                        if (addBtn) {
                            addBtn.innerHTML = ICONS.ADD;
                            addBtn.style.pointerEvents = 'auto';
                        }
                        return;
                    }

                    const data = await uploadImageToServer(croppedImage);
                    if (packKey === 'recent') {
                        recentStickers.unshift(data);
                        recentStickers = recentStickers.slice(0, 20);
                        stickerPacks.recent = [...recentStickers];
                        saveRecentStickers(recentStickers);
                    } else {
                        const pack = userPacks.find(p => p.id === packKey);
                        if (pack) {
                            pack.stickers.push(data);
                            stickerPacks[packKey] = [...pack.stickers];
                            saveUserPacks(userPacks);
                        }
                    }
                    refreshAllPackGrids();
                    updateTabButtons();
                } catch (err) {
                    alert('Ошибка загрузки: ' + err.message);
                    if (addBtn) {
                        addBtn.innerHTML = ICONS.ADD;
                        addBtn.style.pointerEvents = 'auto';
                    }
                }
            };
            input.click();
        }

        function showCropEditor(imageUrl) {
            return new Promise((resolve) => {
                let isDragging = false;
                let isResizing = false;
                let resizeDirection = null;
                let offsetX, offsetY;
                let originalWidth, originalHeight;
                let originalX, originalY;
                let currentAspectRatio = null;
                let activeRatioBtn = null;

                const modal = document.createElement('div');
                modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:20000;';

                const editor = document.createElement('div');
                editor.style.cssText = 'background:var(--block-bg,#1e1e2e);border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:16px;width:90%;max-width:500px;';

                const title = document.createElement('h3');
                title.textContent = 'Обрежьте стикер';
                title.style.cssText = 'margin:0;color:var(--text-primary,#fff);font-size:18px;font-weight:600;';

                const previewContainer = document.createElement('div');
                previewContainer.style.cssText = 'position:relative;width:100%;aspect-ratio:1;overflow:hidden;border-radius:12px;background:#000;';

                const img = document.createElement('img');
                img.src = imageUrl;
                img.style.cssText = 'width:100%;height:100%;object-fit:contain;pointer-events:none;';
                previewContainer.appendChild(img);

                const overlay = document.createElement('div');
                overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';

                const cropArea = document.createElement('div');
                cropArea.style.cssText = 'position:absolute;border:2px solid #0080FF;box-sizing:border-box;';
                overlay.appendChild(cropArea);
                previewContainer.appendChild(overlay);

                const resizeHandles = {};
                ['n', 'e', 's', 'w', 'nw', 'ne', 'sw', 'se'].forEach(dir => {
                    resizeHandles[dir] = document.createElement('div');
                    resizeHandles[dir].style.cssText = `position:absolute;width:8px;height:8px;background:#0080FF;pointer-events:auto;`;
                    resizeHandles[dir].className = 'resize-handle';
                    resizeHandles[dir].dataset.direction = dir;
                });

                resizeHandles.n.style.top = '-4px';
                resizeHandles.n.style.left = '50%';
                resizeHandles.n.style.transform = 'translateX(-50%)';
                resizeHandles.n.style.width = '30px';
                resizeHandles.n.style.height = '8px';
                resizeHandles.n.style.cursor = 'n-resize';

                resizeHandles.e.style.top = '50%';
                resizeHandles.e.style.right = '-4px';
                resizeHandles.e.style.transform = 'translateY(-50%)';
                resizeHandles.e.style.width = '8px';
                resizeHandles.e.style.height = '30px';
                resizeHandles.e.style.cursor = 'e-resize';

                resizeHandles.s.style.bottom = '-4px';
                resizeHandles.s.style.left = '50%';
                resizeHandles.s.style.transform = 'translateX(-50%)';
                resizeHandles.s.style.width = '30px';
                resizeHandles.s.style.height = '8px';
                resizeHandles.s.style.cursor = 's-resize';

                resizeHandles.w.style.top = '50%';
                resizeHandles.w.style.left = '-4px';
                resizeHandles.w.style.transform = 'translateY(-50%)';
                resizeHandles.w.style.width = '8px';
                resizeHandles.w.style.height = '30px';
                resizeHandles.w.style.cursor = 'w-resize';

                resizeHandles.nw.style.top = '-4px';
                resizeHandles.nw.style.left = '-4px';
                resizeHandles.nw.style.cursor = 'nw-resize';

                resizeHandles.ne.style.top = '-4px';
                resizeHandles.ne.style.right = '-4px';
                resizeHandles.ne.style.cursor = 'ne-resize';

                resizeHandles.sw.style.bottom = '-4px';
                resizeHandles.sw.style.left = '-4px';
                resizeHandles.sw.style.cursor = 'sw-resize';

                resizeHandles.se.style.bottom = '-4px';
                resizeHandles.se.style.right = '-4px';
                resizeHandles.se.style.cursor = 'se-resize';

                Object.values(resizeHandles).forEach(handle => cropArea.appendChild(handle));

                const aspectRatioControls = document.createElement('div');
                aspectRatioControls.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;';

                const ratios = [
                    { label: 'Свободный', value: null },
                    { label: '1:1', value: 1 },
                    { label: '4:3', value: 4 / 3 },
                    { label: '3:4', value: 3 / 4 },
                    { label: '16:9', value: 16 / 9 },
                    { label: '9:16', value: 9 / 16 }
                ];

                ratios.forEach(ratio => {
                    const btn = document.createElement('button');
                    btn.textContent = ratio.label;
                    btn.style.cssText = 'background:var(--bg-hover,rgba(255,255,255,0.1));border:none;color:var(--text-primary,#fff);padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;';
                    btn.onclick = () => {
                        currentAspectRatio = ratio.value;
                        document.querySelectorAll('.aspect-ratio-btn').forEach(b => b.style.background = 'var(--bg-hover,rgba(255,255,255,0.1))');
                        btn.style.background = '#0080FF';
                        activeRatioBtn = btn;

                        if (ratio.value !== null) {
                            setAspectRatio(ratio.value);
                        }
                    };
                    btn.className = 'aspect-ratio-btn';
                    aspectRatioControls.appendChild(btn);
                });

                if (aspectRatioControls.children[0]) {
                    aspectRatioControls.children[0].style.background = '#0080FF';
                    activeRatioBtn = aspectRatioControls.children[0];
                }

                const controls = document.createElement('div');
                controls.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;';

                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = 'Отмена';
                cancelBtn.style.cssText = 'background:transparent;border:1px solid var(--border-color,rgba(255,255,255,0.3));color:var(--text-primary,#fff);padding:8px 16px;border-radius:8px;cursor:pointer;';
                cancelBtn.onclick = () => {
                    document.body.removeChild(modal);
                    resolve(null);
                };

                const confirmBtn = document.createElement('button');
                confirmBtn.textContent = 'Готово';
                confirmBtn.style.cssText = 'background:#0080FF;border:none;color:white;padding:8px 16px;border-radius:8px;cursor:pointer;';
                confirmBtn.onclick = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const containerRect = previewContainer.getBoundingClientRect();
                    const bounds = getImageBounds();
                    const imgDisplayWidth = bounds.width;
                    const imgDisplayHeight = bounds.height;
                    const imgOffsetX = bounds.minX;
                    const imgOffsetY = bounds.minY;

                    const scaleX = img.naturalWidth / imgDisplayWidth;
                    const scaleY = img.naturalHeight / imgDisplayHeight;

                    const cropRect = cropArea.getBoundingClientRect();
                    const cropX = (cropRect.left - containerRect.left - imgOffsetX) * scaleX;
                    const cropY = (cropRect.top - containerRect.top - imgOffsetY) * scaleY;
                    const cropWidth = cropRect.width * scaleX;
                    const cropHeight = cropRect.height * scaleY;

                    const finalCropX = Math.max(0, Math.min(cropX, img.naturalWidth - cropWidth));
                    const finalCropY = Math.max(0, Math.min(cropY, img.naturalHeight - cropHeight));

                    canvas.width = cropWidth;
                    canvas.height = cropHeight;

                    ctx.drawImage(img, finalCropX, finalCropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

                    canvas.toBlob((blob) => {
                        const croppedFile = new File([blob], 'sticker.png', { type: 'image/png' });
                        document.body.removeChild(modal);
                        resolve(croppedFile);
                    }, 'image/png');
                };

                controls.appendChild(cancelBtn);
                controls.appendChild(confirmBtn);

                editor.appendChild(title);
                editor.appendChild(previewContainer);
                editor.appendChild(aspectRatioControls);
                editor.appendChild(controls);
                modal.appendChild(editor);
                document.body.appendChild(modal);

                function getImageBounds() {
                    const containerRect = previewContainer.getBoundingClientRect();

                    const imgAspectRatio = img.naturalWidth / img.naturalHeight;
                    const containerAspectRatio = containerRect.width / containerRect.height;

                    let imgDisplayWidth, imgDisplayHeight;

                    if (imgAspectRatio > containerAspectRatio) {
                        imgDisplayWidth = containerRect.width;
                        imgDisplayHeight = containerRect.width / imgAspectRatio;
                    } else {
                        imgDisplayHeight = containerRect.height;
                        imgDisplayWidth = containerRect.height * imgAspectRatio;
                    }

                    const imgOffsetX = (containerRect.width - imgDisplayWidth) / 2;
                    const imgOffsetY = (containerRect.height - imgDisplayHeight) / 2;

                    return {
                        minX: imgOffsetX,
                        minY: imgOffsetY,
                        maxX: imgOffsetX + imgDisplayWidth,
                        maxY: imgOffsetY + imgDisplayHeight,
                        width: imgDisplayWidth,
                        height: imgDisplayHeight,
                        offsetX: imgOffsetX,
                        offsetY: imgOffsetY
                    };
                }

                function constrainCropArea() {
                    const bounds = getImageBounds();

                    let left = parseFloat(cropArea.style.left);
                    let top = parseFloat(cropArea.style.top);
                    let width = cropArea.offsetWidth;
                    let height = cropArea.offsetHeight;

                    if (isNaN(left)) left = 0;
                    if (isNaN(top)) top = 0;

                    left = Math.max(bounds.minX, Math.min(left, bounds.maxX - width));
                    top = Math.max(bounds.minY, Math.min(top, bounds.maxY - height));

                    width = Math.min(width, bounds.width);
                    height = Math.min(height, bounds.height);

                    cropArea.style.left = left + 'px';
                    cropArea.style.top = top + 'px';
                    cropArea.style.width = width + 'px';
                    cropArea.style.height = height + 'px';
                }

                function checkSnapToCenter() {
                    const bounds = getImageBounds();
                    let left = parseFloat(cropArea.style.left);
                    let top = parseFloat(cropArea.style.top);
                    const width = cropArea.offsetWidth;
                    const height = cropArea.offsetHeight;

                    const centerX = bounds.minX + (bounds.width - width) / 2;
                    const centerY = bounds.minY + (bounds.height - height) / 2;

                    const threshold = 5;

                    let newLeft = left;
                    let newTop = top;
                    let snapped = false;

                    if (Math.abs(left - centerX) < threshold) {
                        newLeft = centerX;
                        snapped = true;
                    }

                    if (Math.abs(top - centerY) < threshold) {
                        newTop = centerY;
                        snapped = true;
                    }

                    if (snapped) {
                        cropArea.style.left = newLeft + 'px';
                        cropArea.style.top = newTop + 'px';
                    }
                }

                function setAspectRatio(ratio) {
                    if (ratio === null) return;

                    const bounds = getImageBounds();
                    const containerRect = previewContainer.getBoundingClientRect();

                    let newWidth, newHeight;

                    if (ratio >= 1) {
                        newWidth = bounds.width;
                        newHeight = newWidth / ratio;
                        if (newHeight > bounds.height) {
                            newHeight = bounds.height;
                            newWidth = newHeight * ratio;
                        }
                    } else {
                        newHeight = bounds.height;
                        newWidth = newHeight * ratio;
                        if (newWidth > bounds.width) {
                            newWidth = bounds.width;
                            newHeight = newWidth / ratio;
                        }
                    }

                    const newX = bounds.minX + (bounds.width - newWidth) / 2;
                    const newY = bounds.minY + (bounds.height - newHeight) / 2;

                    cropArea.style.width = newWidth + 'px';
                    cropArea.style.height = newHeight + 'px';
                    cropArea.style.left = newX + 'px';
                    cropArea.style.top = newY + 'px';

                    constrainCropArea();

                    if (activeRatioBtn) {
                        document.querySelectorAll('.aspect-ratio-btn').forEach(b => b.style.background = 'var(--bg-hover,rgba(255,255,255,0.1))');
                        activeRatioBtn.style.background = '#0080FF';
                    }
                }

                cropArea.addEventListener('mousedown', (e) => {
                    if (e.target.classList.contains('resize-handle')) {
                        isResizing = true;
                        resizeDirection = e.target.dataset.direction;
                        originalWidth = cropArea.offsetWidth;
                        originalHeight = cropArea.offsetHeight;
                        originalX = parseFloat(cropArea.style.left);
                        originalY = parseFloat(cropArea.style.top);
                        offsetX = e.clientX;
                        offsetY = e.clientY;
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }

                    isDragging = true;
                    const cropRect = cropArea.getBoundingClientRect();
                    offsetX = e.clientX - cropRect.left;
                    offsetY = e.clientY - cropRect.top;
                    e.preventDefault();
                    e.stopPropagation();
                    cropArea.style.cursor = 'move';
                });

                cropArea.style.pointerEvents = 'auto';

                document.addEventListener('mousemove', (e) => {
                    if (isDragging) {
                        const containerRect = previewContainer.getBoundingClientRect();

                        let newX = e.clientX - containerRect.left - offsetX;
                        let newY = e.clientY - containerRect.top - offsetY;

                        cropArea.style.left = newX + 'px';
                        cropArea.style.top = newY + 'px';

                        constrainCropArea();

                        checkSnapToCenter();

                    } else if (isResizing) {
                        const bounds = getImageBounds();
                        const deltaX = e.clientX - offsetX;
                        const deltaY = e.clientY - offsetY;

                        let newWidth = originalWidth;
                        let newHeight = originalHeight;
                        let newX = originalX;
                        let newY = originalY;

                        switch (resizeDirection) {
                            case 'n': newHeight = originalHeight - deltaY; newY = originalY + deltaY; break;
                            case 'e': newWidth = originalWidth + deltaX; break;
                            case 's': newHeight = originalHeight + deltaY; break;
                            case 'w': newWidth = originalWidth - deltaX; newX = originalX + deltaX; break;
                            case 'nw': newWidth = originalWidth - deltaX; newHeight = originalHeight - deltaY; newX = originalX + deltaX; newY = originalY + deltaY; break;
                            case 'ne': newWidth = originalWidth + deltaX; newHeight = originalHeight - deltaY; newY = originalY + deltaY; break;
                            case 'sw': newWidth = originalWidth - deltaX; newHeight = originalHeight + deltaY; newX = originalX + deltaX; break;
                            case 'se': newWidth = originalWidth + deltaX; newHeight = originalHeight + deltaY; break;
                        }

                        if (currentAspectRatio !== null && currentAspectRatio !== undefined) {
                            let idealWidth = newWidth;
                            let idealHeight = newHeight;

                            if (resizeDirection === 'n' || resizeDirection === 's') {
                                idealWidth = newHeight * currentAspectRatio;
                                idealHeight = newHeight;
                            } else {
                                idealWidth = newWidth;
                                idealHeight = newWidth / currentAspectRatio;
                            }

                            if (idealWidth > bounds.width) {
                                idealWidth = bounds.width;
                                idealHeight = idealWidth / currentAspectRatio;
                            }
                            if (idealHeight > bounds.height) {
                                idealHeight = bounds.height;
                                idealWidth = idealHeight * currentAspectRatio;
                            }

                            newWidth = idealWidth;
                            newHeight = idealHeight;

                            switch (resizeDirection) {
                                case 'e':
                                    newX = originalX;
                                    newY = originalY - (newHeight - originalHeight) / 2;
                                    break;
                                case 'w':
                                    newX = originalX + (originalWidth - newWidth);
                                    newY = originalY - (newHeight - originalHeight) / 2;
                                    break;
                                case 'n':
                                    newX = originalX - (newWidth - originalWidth) / 2;
                                    newY = originalY + (originalHeight - newHeight);
                                    break;
                                case 's':
                                    newX = originalX - (newWidth - originalWidth) / 2;
                                    newY = originalY;
                                    break;
                                case 'nw':
                                    newX = originalX + (originalWidth - newWidth);
                                    newY = originalY + (originalHeight - newHeight);
                                    break;
                                case 'ne':
                                    newX = originalX;
                                    newY = originalY + (originalHeight - newHeight);
                                    break;
                                case 'sw':
                                    newX = originalX + (originalWidth - newWidth);
                                    newY = originalY;
                                    break;
                                case 'se':
                                    newX = originalX;
                                    newY = originalY;
                                    break;
                            }
                        }

                        const minSize = 50;
                        newWidth = Math.max(minSize, Math.min(bounds.width, newWidth));
                        newHeight = Math.max(minSize, Math.min(bounds.height, newHeight));

                        newX = Math.max(bounds.minX, Math.min(newX, bounds.maxX - newWidth));
                        newY = Math.max(bounds.minY, Math.min(newY, bounds.maxY - newHeight));

                        cropArea.style.width = newWidth + 'px';
                        cropArea.style.height = newHeight + 'px';
                        cropArea.style.left = newX + 'px';
                        cropArea.style.top = newY + 'px';

                        constrainCropArea();
                        checkSnapToCenter();
                    }
                });

                document.addEventListener('mouseup', () => {
                    isDragging = false;
                    isResizing = false;

                    constrainCropArea();
                });

                img.onload = () => {
                    const bounds = getImageBounds();
                    cropArea.style.width = bounds.width + 'px';
                    cropArea.style.height = bounds.height + 'px';
                    cropArea.style.left = bounds.minX + 'px';
                    cropArea.style.top = bounds.minY + 'px';
                };

                if (img.complete) {
                    const bounds = getImageBounds();
                    cropArea.style.width = bounds.width + 'px';
                    cropArea.style.height = bounds.height + 'px';
                    cropArea.style.left = bounds.minX + 'px';
                    cropArea.style.top = bounds.minY + 'px';
                }
            });
        }

        function moveSticker(packKey, from, to) {
            if (packKey === 'recent') {
                const item = recentStickers[from];
                recentStickers.splice(from, 1);
                recentStickers.splice(to, 0, item);
                stickerPacks.recent = [...recentStickers];
                saveRecentStickers(recentStickers);
            } else {
                const pack = userPacks.find(p => p.id === packKey);
                if (pack) {
                    const item = pack.stickers[from];
                    pack.stickers.splice(from, 1);
                    pack.stickers.splice(to, 0, item);
                    stickerPacks[packKey] = [...pack.stickers];
                    saveUserPacks(userPacks);
                }
            }
            updateTabButtons();
        }

        function refreshPackGrid(packKey) {
            if (!scrollContainer) return;
            const grid = scrollContainer.querySelector(`.pack-grid[data-pack="${packKey}"]`);
            if (!grid) return;
            grid.innerHTML = '';
            const stickers = stickerPacks[packKey] || [];
            const isEditingThisPack = editMode && currentEditPack === packKey;
            stickers.forEach((sticker, index) => {
                const btn = createStickerButton(sticker, packKey, index, isEditingThisPack);
                grid.appendChild(btn);
            });
            if (isEditingThisPack) {
                const addBtn = document.createElement('button');
                addBtn.className = 'add-item-btn';
                addBtn.innerHTML = ICONS.ADD;
                addBtn.title = 'Добавить стикер';
                addBtn.style.cssText = 'aspect-ratio:1;background:var(--bg-secondary,rgba(128,128,128,0.08));border:2px dashed var(--border-color,rgba(255,255,255,0.2));border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;color:var(--text-secondary,rgba(255,255,255,0.5));transition:all 0.15s';
                addBtn.onmouseenter = () => { addBtn.style.borderColor = 'var(--accent-primary,#0080FF)'; addBtn.style.color = 'var(--accent-primary,#0080FF)'; };
                addBtn.onmouseleave = () => { addBtn.style.borderColor = 'var(--border-color,rgba(255,255,255,0.2))'; addBtn.style.color = 'var(--text-secondary,rgba(255,255,255,0.5))'; };
                addBtn.onclick = () => addStickerToPack(packKey);
                grid.appendChild(addBtn);
            }
        }

        function refreshAllPackGrids() {
            if (!scrollContainer) return;
            ['recent', ...userPacks.map(p => p.id)].forEach(key => refreshPackGrid(key));
        }

        function createStickerButton(sticker, packKey, index, isEditing) {
            const btn = document.createElement('button');
            btn.dataset.packKey = packKey;
            btn.dataset.stickerIndex = index;
            btn.style.cssText = 'aspect-ratio:1;font-size:34px;background:transparent;border:none;border-radius:10px;transition:all 0.15s ease;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;position:relative;user-select:none;overflow:hidden;';

            if (sticker && sticker.url) {
                const img = document.createElement('img');
                img.src = sticker.url;
                img.style.cssText = 'width:100%;height:100%;object-fit:contain;pointer-events:none;';
                btn.appendChild(img);
            } else {
                const placeholder = document.createElement('div');
                placeholder.style.cssText = 'width:100%;height:100%;background:rgba(128,128,128,0.1);border-radius:8px;';
                btn.appendChild(placeholder);
            }

            if (isEditing) {
                btn.classList.add('sticker-editing', `sticker-shake-${(index % 8) + 1}`);
                btn.draggable = true;

                btn.onclick = () => {
                    if (sticker && sticker.id && sticker.url) {
                        addToRecent(sticker);
                        insertStickerToComment(sticker.id, sticker.url);
                    }
                    stickerPanel.style.display = 'none';

                    exitEditMode();
                };
                btn.onmouseenter = (e) => {
                    if (!dragState.packKey) {
                        btn.style.transform = 'scale(1.05)';
                        btn.style.boxShadow = '0 0 0 2px var(--accent-primary,#0080FF)';
                    }
                };
                btn.onmouseleave = (e) => {
                    if (!dragState.packKey) {
                        btn.style.transform = 'scale(1)';
                        btn.style.boxShadow = 'none';
                    }
                };

                if (dragState.packKey === packKey) {
                    if (index === dragState.draggedIndex) btn.classList.add('sticker-dragging');
                    else if (index === dragState.placeholderIndex) btn.classList.add('sticker-placeholder');
                }

                const deleteBtn = document.createElement('div');
                deleteBtn.innerHTML = ICONS.DELETE;
                deleteBtn.style.cssText = 'position:absolute;top:2px;right:2px;width:16px;height:16px;background:rgba(0,0,0,0.6);border-radius:50%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.7);transition:all 0.15s;z-index:2;pointer-events:auto;font-size:12px;';
                deleteBtn.onmouseenter = (e) => { e.stopPropagation(); deleteBtn.style.background = '#ff4444'; };
                deleteBtn.onmouseleave = (e) => { e.stopPropagation(); deleteBtn.style.background = 'rgba(0,0,0,0.6)'; };
                deleteBtn.onmousedown = (e) => { e.stopPropagation(); e.preventDefault(); };
                deleteBtn.onclick = (e) => { e.stopPropagation(); e.preventDefault(); deleteSticker(packKey, index); };
                btn.appendChild(deleteBtn);

                btn.addEventListener('dragstart', (e) => {
                    if (!editMode || dragState.packKey) return;
                    dragState = { packKey, draggedIndex: index, placeholderIndex: index };
                    e.dataTransfer.setData('text/plain', '');
                    e.dataTransfer.effectAllowed = 'move';
                    setTimeout(() => { if (dragState.packKey === packKey) refreshPackGrid(packKey); }, 0);
                });
                btn.addEventListener('dragend', () => {
                    if (dragState.packKey === packKey) {
                        dragState = { packKey: null, draggedIndex: null, placeholderIndex: null };
                        refreshPackGrid(packKey);
                    }
                });
                btn.addEventListener('dragover', (e) => {
                    if (!dragState.packKey || dragState.packKey !== packKey) return;
                    e.preventDefault();
                });
                btn.addEventListener('dragenter', (e) => {
                    if (!dragState.packKey || dragState.packKey !== packKey) return;
                    e.preventDefault();
                    const targetIdx = parseInt(btn.dataset.stickerIndex);
                    if (targetIdx !== dragState.placeholderIndex) {
                        moveSticker(packKey, dragState.draggedIndex, targetIdx);
                        dragState.draggedIndex = targetIdx;
                        dragState.placeholderIndex = targetIdx;
                        refreshPackGrid(packKey);
                    }
                });
                btn.addEventListener('drop', (e) => {
                    if (!dragState.packKey || dragState.packKey !== packKey) return;
                    e.preventDefault();
                    dragState = { packKey: null, draggedIndex: null, placeholderIndex: null };
                    refreshPackGrid(packKey);
                    updateTabButtons();
                });
            } else {
                btn.onclick = () => {
                    if (sticker && sticker.id && sticker.url) {
                        addToRecent(sticker);
                        insertStickerToComment(sticker.id, sticker.url);
                    }
                    stickerPanel.style.display = 'none';

                    exitEditMode();
                };
                btn.onmouseenter = () => {
                    btn.style.transform = 'scale(1.05)';
                    btn.style.boxShadow = '0 0 0 2px var(--accent-primary,#0080FF)';
                };
                btn.onmouseleave = () => {
                    btn.style.transform = 'scale(1)';
                    btn.style.boxShadow = 'none';
                };
            }

            return btn;
        }

        function updateTabButtons() {
            tabButtons = [];

            const tabsWrapper = scrollTabs?.querySelector('div');
            if (tabsWrapper) {
                tabsWrapper.innerHTML = '';
                userPacks.forEach(pack => {
                    const btn = document.createElement('button');
                    const first = pack.stickers[0];
                    if (first && first.url) {
                        const img = document.createElement('img');
                        img.src = first.url;
                        img.style.cssText = 'width:24px;height:24px;object-fit:contain;border-radius:6px;';
                        btn.appendChild(img);
                    } else {
                        btn.innerHTML = ICONS.EMPTY_PACK;
                        btn.style.color = 'rgba(128,128,128,0.5)';
                    }
                    btn.title = pack.name || DEFAULT_PACK_NAME;
                    btn.style.cssText = 'background:transparent;border:none;width:32px;height:32px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;color:var(--text-secondary,rgba(255,255,255,0.5));';
                    btn.onclick = () => { exitEditMode(); scrollToPack(pack.id); };
                    tabsWrapper.appendChild(btn);
                    tabButtons.push({ button: btn, key: pack.id });
                });
            }
        }

        function createStickerPanel() {
            if (stickerPanel) return stickerPanel;

            stickerPanel = document.createElement('div');
            stickerPanel.className = 'sticker-panel';
            stickerPanel.style.cssText = `position:fixed;display:none;flex-direction:column;background:var(--block-bg,#1e1e2e);border-radius:20px;border:1px solid var(--border-color,rgba(255,255,255,0.1));z-index:10000;width:${PANEL_WIDTH}px;height:${PANEL_HEIGHT}px;box-shadow:0 8px 24px rgba(0,0,0,0.3);overflow:hidden;`;

            const header = document.createElement('div');
            header.style.cssText = 'display:flex;align-items:center;padding:8px;border-bottom:1px solid var(--border-color,rgba(255,255,255,0.1));gap:4px;flex-shrink:0;';

            recentBtn = document.createElement('button');
            recentBtn.innerHTML = ICONS.RECENT;
            recentBtn.title = 'Недавние';
            recentBtn.style.cssText = 'background:var(--accent-primary,#0080FF);border:none;width:32px;height:32px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;color:white;';
            recentBtn.onclick = () => { exitEditMode(); scrollToPack('recent'); };

            scrollTabs = document.createElement('div');
            scrollTabs.style.cssText = 'display:flex;gap:4px;overflow-x:auto;overflow-y:hidden;flex:1;padding:0 4px;scrollbar-width:none;';
            scrollTabs.addEventListener('wheel', (e) => {
                if (e.deltaY !== 0) { e.preventDefault(); scrollTabs.scrollLeft += e.deltaY * 0.4; }
            }, { passive: false });

            const tabsWrapper = document.createElement('div');
            tabsWrapper.style.cssText = 'display:flex;gap:4px;';
            scrollTabs.appendChild(tabsWrapper);

            tabButtons = [];
            userPacks.forEach(pack => {
                const btn = document.createElement('button');
                const first = pack.stickers[0];
                if (first) {
                    const img = document.createElement('img');
                    img.src = first.url;
                    img.style.cssText = 'width:24px;height:24px;object-fit:contain;border-radius:6px;';
                    btn.appendChild(img);
                } else {
                    btn.innerHTML = ICONS.EMPTY_PACK;
                    btn.style.color = 'rgba(128,128,128,0.5)';
                }
                btn.title = pack.name || DEFAULT_PACK_NAME;
                btn.style.cssText = 'background:transparent;border:none;width:32px;height:32px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;color:var(--text-secondary,rgba(255,255,255,0.5));';
                btn.onclick = () => { exitEditMode(); scrollToPack(pack.id); };
                tabsWrapper.appendChild(btn);
                tabButtons.push({ button: btn, key: pack.id });
            });

            const addPackBtn = document.createElement('button');
            addPackBtn.innerHTML = ICONS.ADD_PACK;
            addPackBtn.title = 'Создать стикерпак';
            addPackBtn.style.cssText = 'background:transparent;border:none;width:32px;height:32px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;color:var(--text-secondary,rgba(255,255,255,0.5));';
            addPackBtn.onclick = () => {
                const pack = { id: 'user_' + Date.now(), name: '', stickers: [] };
                userPacks.push(pack);
                saveUserPacks(userPacks);
                rebuildPacks();
                stickerPanel.remove();
                stickerPanel = null;
                scrollContainer = null;
                packHeaders = [];
                tabButtons = [];
                createStickerPanel();
                renderAllContent();
                enterEditMode(pack.id);
                showPanel();
            };

            header.appendChild(recentBtn);
            header.appendChild(scrollTabs);
            header.appendChild(addPackBtn);

            scrollContainer = document.createElement('div');
            scrollContainer.style.cssText = 'flex:1;overflow-y:auto;overflow-x:hidden;scroll-behavior:smooth;scrollbar-width:thin;';
            scrollContainer.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
            scrollContainer.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
            scrollContainer.addEventListener('scroll', updateActiveTabFromScroll, { passive: true });

            stickerPanel.appendChild(header);
            stickerPanel.appendChild(scrollContainer);

            stickerPanel.addEventListener('mouseenter', () => {
                if (hideTimeout) clearTimeout(hideTimeout);
                adjustAllInputWidths();
            });
            stickerPanel.addEventListener('mouseleave', () => {
                hideTimeout = setTimeout(() => {
                    if (stickerPanel && stickerPanel.style.display === 'flex') {
                        stickerPanel.style.display = 'none';
                        exitEditMode();
                        enablePageScroll();
                    }
                }, 200);
            });

            document.body.appendChild(stickerPanel);
            return stickerPanel;
        }

        function renderAllContent() {
            if (!scrollContainer) return;
            scrollContainer.innerHTML = '';
            packHeaders = [];

            const allKeys = ['recent', ...userPacks.map(p => p.id)];
            const allKeysLength = allKeys.length;
            for (let i = 0; i < allKeysLength; i++) {
                const key = allKeys[i];
                const header = document.createElement('div');
                header.className = 'pack-header';
                header.dataset.pack = key;
                header.style.cssText = 'padding:16px 10px 8px;display:flex;align-items:center;gap:6px;color:var(--text-secondary,rgba(255,255,255,0.5));';

                const nameContainer = document.createElement('div');
                nameContainer.style.cssText = 'display:flex;align-items:center;gap:4px;flex-shrink:0;';

                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.className = 'pack-name-input';
                nameInput.value = packNames[key] || '';
                nameInput.placeholder = 'Название...';
                nameInput.maxLength = MAX_NAME_LENGTH;
                nameInput.style.cssText = 'background:transparent;border:1px solid transparent;color:inherit;font-size:14px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;padding:2px 4px;border-radius:4px;outline:none;width:auto;';

                if (key !== 'recent') {
                    nameInput.addEventListener('input', () => {
                        if (!editMode || currentEditPack !== key) {
                            nameInput.value = packNames[key] || '';
                            adjustInputWidth(nameInput);
                            return;
                        }
                        nameInput.value = nameInput.value.slice(0, MAX_NAME_LENGTH);
                        packNames[key] = nameInput.value;
                        const pack = userPacks.find(p => p.id === key);
                        if (pack) { pack.name = nameInput.value; saveUserPacks(userPacks); }
                        adjustInputWidth(nameInput);
                    });
                    nameInput.addEventListener('blur', () => {
                        if (!editMode || currentEditPack !== key) {
                            nameInput.value = packNames[key] || '';
                            adjustInputWidth(nameInput);
                            return;
                        }
                        if (!nameInput.value.trim()) {
                            nameInput.value = DEFAULT_PACK_NAME;
                            packNames[key] = DEFAULT_PACK_NAME;
                            const pack = userPacks.find(p => p.id === key);
                            if (pack) { pack.name = DEFAULT_PACK_NAME; saveUserPacks(userPacks); }
                        }
                        adjustInputWidth(nameInput);
                    });
                } else {
                    nameInput.style.pointerEvents = 'none';
                }

                nameContainer.appendChild(nameInput);

                if (key !== 'recent') {
                    const editBtn = document.createElement('button');
                    editBtn.innerHTML = ICONS.EDIT;
                    editBtn.title = 'Редактировать';
                    editBtn.style.cssText = 'background:transparent;border:none;width:20px;height:20px;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;color:inherit;';
                    editBtn.onclick = () => {
                        if (editMode && currentEditPack === key) exitEditMode();
                        else { exitEditMode(); enterEditMode(key); }
                    };
                    nameContainer.appendChild(editBtn);

                    const deletePackBtn = document.createElement('button');
                    deletePackBtn.className = 'delete-pack-btn';
                    deletePackBtn.innerHTML = ICONS.TRASH;
                    deletePackBtn.title = 'Удалить пак';
                    deletePackBtn.style.cssText = 'display:none;background:#ff4444;border:none;width:24px;height:24px;border-radius:6px;cursor:pointer;padding:0;align-items:center;justify-content:center;';
                    deletePackBtn.onclick = () => { if (confirm('Удалить пак?')) deleteStickerPack(key); };
                    nameContainer.appendChild(deletePackBtn);

                    const exitBtn = document.createElement('button');
                    exitBtn.innerHTML = ICONS.CHECK;
                    exitBtn.title = 'Готово';
                    exitBtn.style.cssText = 'display:none;background:var(--accent-primary,#0080FF);border:none;width:24px;height:24px;border-radius:6px;cursor:pointer;padding:0;align-items:center;justify-content:center;';
                    exitBtn.onclick = exitEditMode;
                    nameContainer.appendChild(exitBtn);
                    header._exitEditBtn = exitBtn;
                    exitBtn.style.display = (editMode && currentEditPack === key) ? 'flex' : 'none';
                }

                header.appendChild(nameContainer);
                const spacer = document.createElement('div');
                spacer.style.flex = '1';
                header.appendChild(spacer);
                scrollContainer.appendChild(header);
                packHeaders.push({ element: header, key });

                const grid = document.createElement('div');
                grid.className = 'pack-grid';
                grid.dataset.pack = key;
                grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:3px;padding:0 10px 16px;';
                const stickers = stickerPacks[key] || [];
                const stickersLength = stickers.length;
                for (let j = 0; j < stickersLength; j++) {
                    const s = stickers[j];
                    grid.appendChild(createStickerButton(s, key, j, false));
                }
                scrollContainer.appendChild(grid);
            }
        }

        function scrollToPack(packKey) {
            const header = scrollContainer.querySelector(`.pack-header[data-pack="${packKey}"]`);
            if (header) {
                isScrollingFromTab = true;
                header.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(() => { isScrollingFromTab = false; }, 500);
            }
        }

        function updateActiveTabFromScroll() {
            if (editMode || !scrollContainer) return;
            const top = scrollContainer.getBoundingClientRect().top + 50;
            let active = 'recent', min = Infinity;
            const packHeadersLength = packHeaders.length;
            for (let i = 0; i < packHeadersLength; i++) {
                const { element, key } = packHeaders[i];
                const d = element.getBoundingClientRect().top - top;
                if (d <= 0 && Math.abs(d) < min) { min = Math.abs(d); active = key; }
            }
            if (recentBtn) recentBtn.style.background = active === 'recent' ? 'var(--accent-primary,#0080FF)' : 'transparent';
            const tabButtonsLength = tabButtons.length;
            for (let i = 0; i < tabButtonsLength; i++) {
                const t = tabButtons[i];
                t.button.style.background = t.key === active ? 'var(--accent-primary,#0080FF)' : 'transparent';
            }
        }

        function showPanel() {
            if (!stickerBtn || !stickerBtn.isConnected) return;
            if (hideTimeout) clearTimeout(hideTimeout);
            createStickerPanel();
            if (!scrollContainer || !scrollContainer.children.length) renderAllContent();
            const rect = stickerBtn.getBoundingClientRect();
            stickerPanel.style.bottom = `${window.innerHeight - rect.top + 8}px`;
            stickerPanel.style.left = `${Math.min(rect.left, window.innerWidth - PANEL_WIDTH - 20)}px`;
            stickerPanel.style.display = 'flex';
            disablePageScroll();
        }

        function hidePanel() {
            hideTimeout = setTimeout(() => {
                if (stickerPanel && stickerPanel.style.display === 'flex') {
                    stickerPanel.style.display = 'none';
                    exitEditMode();
                    enablePageScroll();
                }
            }, 300);
        }

        function addStickerButton() {
            if (isProcessing) return;
            isProcessing = true;
            const container = document.querySelector('.' + SELECTORS.stickerContainer);
            if (!container || container.querySelector('.sticker-btn')) { isProcessing = false; return; }
            // Кнопку стикеров ставим перед микрофоном, а если его нет — перед «Отправить»
            const micBtn = container.querySelector('.' + SELECTORS.stickerMicBtn)
                || container.querySelector('.' + SELECTORS.stickerSendBtn);
            if (!micBtn) { isProcessing = false; return; }

            stickerBtn = document.createElement('button');
            stickerBtn.className = 'sticker-btn';
            stickerBtn.innerHTML = ICONS.STICKER_BUTTON;
            stickerBtn.style.cssText = 'background:transparent;border:none;cursor:pointer;padding:8px;border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;color:var(--text-secondary);margin-right:5px;width:36px;height:36px;';
            stickerBtn.onmouseenter = () => { stickerBtn.style.backgroundColor = 'var(--bg-hover,rgba(255,255,255,0.08))'; showPanel(); };
            stickerBtn.onmouseleave = () => { stickerBtn.style.backgroundColor = 'transparent'; hidePanel(); };
            container.insertBefore(stickerBtn, micBtn);
            isProcessing = false;
        }

        onDom(function stickerButton() {
            const c = document.querySelector('.' + SELECTORS.stickerContainer);
            if (c && !c.querySelector('.sticker-btn')) addStickerButton();
        });

        window.addEventListener('focus', () => {
            const c = document.querySelector('.' + SELECTORS.stickerContainer);
            if (c && !c.querySelector('.sticker-btn')) addStickerButton();
        });

        setTimeout(addStickerButton, 1000);

    })();

    let messagesOverlay = null;

    // Сообщений на ИТД нет — кнопка открывает «чат», где сервер сначала печатает,
    // а потом отвечает шуткой. «Ещё раз» — новая шутка, Esc или клик мимо — закрыть.
    const MESSAGE_JOKES = [
        ['🖤', 'But nobody came...'],
        ['😔', 'Ошибка загрузки'],
        ['💀', 'Загрузка... шучу, ошибка'],
        ['🐎', 'Твои сообщения украли цыгане'],
        ['😈', 'Загрузка... нет'],
        ['🤝', 'Ты им не нужен, брат'],
        ['⏳', 'Сообщения загружены на 99%... 99%... 99%...'],
        ['🎂', 'Сообщения — это ложь'],
        ['🖕', 'Иди ка ты на хуй'],
        ['🤖', 'Сервер ответил: пошёл нахуй'],
        ['🚫', 'Связь заблокирована Роскомнадзором'],
        ['📭', 'Пусто. Как в холодильнике в конце месяца'],
        ['🕊️', 'Сообщение отправлено голубем. Голубь не вернулся'],
        ['🔒', 'Чат зашифрован так надёжно, что даже ты его не прочитаешь'],
        ['👀', 'Все прочитали. Никто не ответил'],
        ['📡', 'Ищем сигнал... Попробуй встать на табуретку'],
        ['🐈', 'Тут были сообщения, но их съел кот'],
        ['💌', 'Тебе пишут... пишут... передумали'],
        ['📵', 'Абонент временно недоступен. И постоянно тоже'],
        ['🗿', 'Сообщений: 0. Друзей: загрузка...'],
        ['🧾', 'Первое сообщение платное: 99 999 ₽'],
        ['🛠️', 'Сообщения появятся в следующем обновлении. В каком — не скажем'],
    ];

    function buildMessagesOverlay() {
        const style = document.createElement('style');
        style.textContent = `
        .vp-msg-backdrop { position: fixed; inset: 0; z-index: 99999; display: none; align-items: center; justify-content: center;
            padding: 16px; background: rgba(0, 0, 0, .6); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
        .vp-msg-backdrop.vp-open { display: flex; animation: vpMsgFade .18s ease-out; }
        .vp-msg-card { width: min(400px, 100%); box-sizing: border-box; padding: 18px; border-radius: 28px; cursor: default;
            background: var(--block-bg, #1c1c22); color: var(--text-primary, #fff); font-family: inherit;
            border: 1px solid color-mix(in srgb, var(--text-primary, #fff) 10%, transparent);
            box-shadow: 0 24px 60px rgba(0, 0, 0, .45); animation: vpMsgPop .28s cubic-bezier(.2, 1.3, .4, 1); }
        .vp-msg-head { display: flex; align-items: center; gap: 12px; padding-bottom: 14px;
            border-bottom: 1px solid color-mix(in srgb, var(--text-primary, #fff) 8%, transparent); }
        .vp-msg-ava { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
            color: var(--vp-on-accent, #fff); background: var(--vp-accent, #0080ff); }
        .vp-msg-who { display: flex; flex-direction: column; min-width: 0; }
        .vp-msg-name { font-weight: 700; font-size: 15px; }
        .vp-msg-status { font-size: 12px; color: var(--text-secondary, #8a8a99); }
        .vp-msg-close { margin-left: auto; width: 32px; height: 32px; border-radius: 50%; border: 0; padding: 0; cursor: pointer; display: flex;
            align-items: center; justify-content: center; background: transparent; color: var(--text-secondary, #8a8a99); }
        .vp-msg-close:hover { background: var(--bg-hover, rgba(255, 255, 255, .08)); color: var(--text-primary, #fff); }
        .vp-msg-body { min-height: 96px; padding: 18px 2px; display: flex; align-items: flex-end; }
        .vp-msg-bubble { max-width: 88%; padding: 12px 16px; border-radius: 20px 20px 20px 6px; font-size: 16px; line-height: 1.4;
            background: var(--bg-hover, rgba(255, 255, 255, .07)); animation: vpMsgIn .25s ease-out; overflow-wrap: anywhere; }
        .vp-msg-emoji { display: block; font-size: 38px; line-height: 1; margin-bottom: 8px; }
        .vp-msg-typing { display: flex; gap: 5px; padding: 16px 18px; }
        .vp-msg-typing i { width: 7px; height: 7px; border-radius: 50%; background: var(--text-secondary, #8a8a99); animation: vpMsgDot 1s infinite; }
        .vp-msg-typing i:nth-child(2) { animation-delay: .15s; }
        .vp-msg-typing i:nth-child(3) { animation-delay: .3s; }
        .vp-msg-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 12px;
            color: var(--text-secondary, #8a8a99); }
        .vp-msg-again { border: 0; border-radius: 999px; padding: 9px 16px; cursor: pointer; font: inherit; font-size: 14px; font-weight: 600;
            color: var(--vp-on-accent, #fff); background: var(--vp-accent, #0080ff); transition: filter .15s, transform .15s; }
        .vp-msg-again:hover { filter: brightness(1.12); }
        .vp-msg-again:active { transform: scale(.96); }
        .vp-msg-again:disabled { opacity: .5; cursor: default; }
        @keyframes vpMsgFade { from { opacity: 0; } }
        @keyframes vpMsgPop { from { opacity: 0; transform: translateY(12px) scale(.96); } }
        @keyframes vpMsgIn { from { opacity: 0; transform: translateY(6px); } }
        @keyframes vpMsgDot { 0%, 60%, 100% { opacity: .35; transform: none; } 30% { opacity: 1; transform: translateY(-3px); } }
        @media (prefers-reduced-motion: reduce) { .vp-msg-backdrop, .vp-msg-backdrop * { animation: none !important; } }
        /* пока окно открыто, видео под ним прячем: Яндекс.Браузер видит курсор над видео сквозь окно
           и выкладывает свою панель («Субтитры», картинка в картинке) поверх наших кнопок */
        html.vp-msg-shown video { visibility: hidden !important; }`;
        document.head.appendChild(style);

        const root = document.createElement('div');
        root.className = 'vp-msg-backdrop';
        root.innerHTML = `
            <div class="vp-msg-card" role="dialog" aria-modal="true" aria-label="Сообщения">
                <div class="vp-msg-head">
                    <div class="vp-msg-ava">${ICONS.MESSAGES}</div>
                    <div class="vp-msg-who"><span class="vp-msg-name">Сервер ИТД</span><span class="vp-msg-status"></span></div>
                    <button class="vp-msg-close" title="Закрыть (Esc)">${svgIcon('<path d="M6 6l12 12M18 6 6 18"/>', 18)}</button>
                </div>
                <div class="vp-msg-body" aria-live="polite"></div>
                <div class="vp-msg-foot"><span>Esc — закрыть</span><button class="vp-msg-again">Ещё раз</button></div>
            </div>`;
        document.body.appendChild(root);
        const body = root.querySelector('.vp-msg-body');
        const status = root.querySelector('.vp-msg-status');
        const again = root.querySelector('.vp-msg-again');
        let last = -1, timer = 0;

        function say() {
            clearTimeout(timer);
            let i;
            do i = Math.floor(Math.random() * MESSAGE_JOKES.length); while (i === last && MESSAGE_JOKES.length > 1);
            last = i;
            status.textContent = 'печатает...';
            again.disabled = true;
            body.innerHTML = '<div class="vp-msg-bubble vp-msg-typing"><i></i><i></i><i></i></div>';
            timer = setTimeout(() => {
                const [emoji, text] = MESSAGE_JOKES[i];
                const bubble = document.createElement('div');
                bubble.className = 'vp-msg-bubble';
                const e = document.createElement('span');
                e.className = 'vp-msg-emoji';
                e.textContent = emoji;
                bubble.append(e, text);
                body.replaceChildren(bubble);
                status.textContent = 'был(а) в сети никогда';
                again.disabled = false;
                again.focus({ preventScroll: true });
            }, 650 + Math.random() * 500);
        }
        function close() {
            clearTimeout(timer);
            root.classList.remove('vp-open');
            document.documentElement.classList.remove('vp-msg-shown');
            document.removeEventListener('keydown', onKey, true);
        }
        function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }

        root.addEventListener('click', (e) => { if (e.target === root) close(); });
        root.querySelector('.vp-msg-close').onclick = close;
        again.onclick = say;
        root.open = () => {
            root.classList.add('vp-open');
            document.documentElement.classList.add('vp-msg-shown');
            document.addEventListener('keydown', onKey, true);
            say();
        };
        return root;
    }

    // На телефоне у сайта короткие подписи («Магаз», «Уведы») — и у нас короткая
    function messagesLabel(notificationsLink) {
        return /уведомления/i.test(notificationsLink.textContent) ? 'Сообщения' : 'Личка';
    }
    function addMessagesButton() {
        const nav = document.querySelector('.' + SELECTORS.sidebar + ' .' + SELECTORS.nav)
            || document.querySelector('.' + SELECTORS.nav)
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
            if (label && label.textContent !== text) label.textContent = text;     // сменилась ширина экрана
            return;
        }

        if (!messagesOverlay) messagesOverlay = buildMessagesOverlay();

        messagesLink = document.createElement('a');
        messagesLink.href = '#';
        const siteLinks = [...nav.querySelectorAll(':scope > a')]
            .filter(a => a.getAttribute('href') !== '#' && a.querySelector(':scope > span svg'));
        messagesLink.className = (commonClasses(siteLinks) + ' ' + SELECTORS.navLink).trim();
        messagesLink.addEventListener('click', (e) => {
            e.preventDefault();
            messagesOverlay.open();
        });

        const iconSpan = document.createElement('span');
        iconSpan.className = (commonClasses(siteLinks.map(a => a.firstElementChild)) + ' ' + SELECTORS.navIcon).trim();
        iconSpan.innerHTML = ICONS.MESSAGES;
        const textSpan = document.createElement('span');
        // классы подписи — как у подписей сайта: на телефоне у них свой (мелкий) шрифт
        textSpan.className = commonClasses(siteLinks.map(a => a.children[1]).filter(Boolean));
        textSpan.textContent = messagesLabel(notificationsLink);
        messagesLink.appendChild(iconSpan);
        messagesLink.appendChild(textSpan);

        nav.insertBefore(messagesLink, notificationsLink);
    }

    addMessagesButton();
    onDom(addMessagesButton);
    // Нижняя панель телефона: у сайта подписи короткие («Магаз», «Уведы»), а «Профиль» — длинная и у самого
    // края: задевала обводку. Там — «Акк», в тон остальным. На компьютере (полные подписи: «Уведомления») — как у сайта.
    const PROFILE_SHORT = 'Акк';
    onDom(function shortProfileLabel() {
        const nav = document.querySelector('.' + SELECTORS.nav);
        const notif = nav && nav.querySelector(':scope > a[href="/notifications"]');
        if (!notif || /уведомления/i.test(notif.textContent)) return;
        nav.querySelectorAll(':scope > a[href^="/@"]').forEach(a => {
            const label = a.children[1];
            if (label && label.textContent.trim() === 'Профиль') label.textContent = PROFILE_SHORT;
        });
    });

    // Ивент: у сайта иконка — картинка-портал (portal-inactive.png), а не значок как у остальных пунктов,
    // поэтому ни цвет стиля, ни свечение активного пункта на неё не ложились. Свой значок в стиле иконок ИТД
    // (24×24, цвет текста): звезда с сильно скруглёнными лучами — по закрашенной площади как соседние иконки (~40% поля, как «Лента» и «Уведы»). «Пассив» — звезда с маленькой
    // вырезанной звёздочкой в центре (как «дырочки» у иконок ИТД); «актив» (сайт вешает
    // на картинку второй класс — пульсацию, или меняет файл) — та же звезда (того же размера) с голубой звездой прямо поверх и три искры
    // рядом, пульсирует как у сайта.
    const PORTAL_ICON = {
        idle: { mask: '<path d="M12 4.17L14.35 9.82L20.45 10.31L15.8 14.28L17.22 20.23L12 17.05L6.78 20.23L8.2 14.28L3.55 10.31L9.65 9.82Z" stroke="currentColor" stroke-width="4.4" stroke-linejoin="round"/>', hole: '<path d="M12 11.13L12.59 12.54L14.11 12.66L12.95 13.66L13.3 15.15L12 14.35L10.7 15.15L11.05 13.66L9.89 12.66L11.41 12.54Z" stroke="currentColor" stroke-width="1.9800000000000002" stroke-linejoin="round"/>' },
        live: { mask: '<path d="M12 4.17L14.35 9.82L20.45 10.31L15.8 14.28L17.22 20.23L12 17.05L6.78 20.23L8.2 14.28L3.55 10.31L9.65 9.82Z" stroke="currentColor" stroke-width="4.4" stroke-linejoin="round"/><path d="M20.5 0.8C21.2 2.6 21.2 2.6 23 3.3C21.2 4 21.2 4 20.5 5.8C19.8 4 19.8 4 18 3.3C19.8 2.6 19.8 2.6 20.5 0.8Z"/><path d="M21.7 15C22.09 16.01 22.09 16.01 23.1 16.4C22.09 16.79 22.09 16.79 21.7 17.8C21.31 16.79 21.31 16.79 20.3 16.4C21.31 16.01 21.31 16.01 21.7 15Z"/><path d="M15.9 0.2C16.26 1.14 16.26 1.14 17.2 1.5C16.26 1.86 16.26 1.86 15.9 2.8C15.54 1.86 15.54 1.86 14.6 1.5C15.54 1.14 15.54 1.14 15.9 0.2Z"/>', over: '<path d="M12 9.18L13.1 11.83L15.97 12.06L13.79 13.93L14.45 16.73L12 15.23L9.55 16.73L10.21 13.93L8.03 12.06L10.9 11.83Z" fill="#5cc8ff" stroke="#5cc8ff" stroke-width="2.64" stroke-linejoin="round"/>' }
    };
    // Нижняя панель телефона: кнопка сайта «Создать пост» (+) — на «бугорке» по центру панели: верхний
    // край панели плавно поднимается дугой вокруг «+» (раньше «+» стоял справа над панелью, и на него
    // ложилась наша «наверх»). Фон, размытие и обводка панели рисуются одной фигурой «панель + бугорок»
    // (SVG под пунктами) — без шва и двойного затемнения; у самой «+» свой круг убран, она лежит на бугорке.
    // Кнопка та же, сайтовая, — только место: она в том же закреплённом блоке, что и панель, и прячется
    // вместе с ней. Пункты панели не сдвигаются: купол — над краем панели. Наша «наверх» — на своём месте, а вид
    // берёт у «+» (классы сайта), чтобы совпадал до пикселя.
    // кнопка; радиус купола; центр купола выше края панели на BUMP_UP (пункты под ним не задеваются);
    // широкие плавные переходы от края к куполу — бугорок выглядит частью панели, как выпуклость
    const BUMP = 48, BUMP_R = 25, BUMP_UP = 11, BUMP_FILLET = 22, BUMP_LIFT = BUMP_R + BUMP_UP;
    // контур «скруглённая панель + бугорок»: w×h панели, её верх — на y = top
    function bumpPath(w, h, top) {
        const r = h / 2, cx = w / 2, cy = top - BUMP_UP, f = BUMP_FILLET;
        const dy = cy - (top - f), d = Math.sqrt((BUMP_R + f) ** 2 - dy ** 2);
        const k = f / (BUMP_R + f);                                    // точка касания скругления и дуги
        const tx = d * (1 - k), ty = (top - f) + dy * k;
        const n = v => +v.toFixed(2);
        return `M${r} ${top}H${n(cx - d)}A${f} ${f} 0 0 0 ${n(cx - tx)} ${n(ty)}A${BUMP_R} ${BUMP_R} 0 0 1 ${n(cx + tx)} ${n(ty)}`
            + `A${f} ${f} 0 0 0 ${n(cx + d)} ${top}H${w - r}A${r} ${r} 0 0 1 ${w - r} ${top + h}H${r}A${r} ${r} 0 0 1 ${r} ${top}Z`;
    }
    onDom(function newPostBump() {
        const nav = document.querySelector('.' + SELECTORS.nav);
        const plus = document.querySelector('button[aria-label="Создать пост"]');
        const up = document.querySelector('.itd-scroll-top-btn');
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
                // обводка — той же фигурой в 2 px: внешнюю половину срезает обрезка по контуру, остаётся 1 px внутри
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
        document.querySelectorAll('a[href="/event"] img').forEach(img => {
            const own = [...img.classList].filter(c => !c.startsWith('vp-'));
            const state = own.length > 1 || (/portal/.test(img.src) && !/inactive/.test(img.src)) ? 'live' : 'idle';
            if (!img.classList.contains('vp-portal-img')) img.classList.add('vp-portal-img');   // сайт перерисует — заметим
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
                // Значок из нескольких фигур (звезда и искры; у звезды ещё заливка и обводка): у неактивного пункта цвет полупрозрачный,
                // и на стыках прозрачность складывалась — пересечения светлели. Поэтому фигуры — белым в маске,
                // а цветом заливаем один раз, как у цельных иконок сайта.
                const id = 'vp-ev-' + (++eventMaskN);
                // hole — прорезь в значке (если понадобится), over — цветная деталь поверх (голубая звезда)
                const ic = PORTAL_ICON[state];
                svg.innerHTML = `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">`
                    + `<g fill="#fff" style="color:#fff">${ic.mask}</g>`
                    + (ic.hole ? `<g fill="#000" style="color:#000">${ic.hole}</g>` : '') + `</mask></defs>`
                    + `<rect width="24" height="24" fill="currentColor" mask="url(#${id})"/>` + (ic.over || '');
            }
        });
    });

    const postDesignStyle = document.createElement('style');
    // Оформление карточки — только постам ленты (article). Открытый пост собран иначе:
    // рамка, отступ и размытый фон на нём съезжали с настоящих краёв блока.
    postDesignStyle.textContent = `
        article.vp-post {
            background: var(--block-bg, rgba(30, 30, 46, 0.8));
            backdrop-filter: var(--vp-glass-filter, blur(4px)) !important;
            border-radius: 24px !important;
            margin-bottom: 16px !important;
            transition: all 0.25s ease !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2) !important;
            animation: postAppear 0.3s ease-out forwards !important;
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
        .vp-post-action:hover {
            background: rgba(0, 128, 255, 0.15) !important;
            transform: translateY(-2px) !important;
        }
        .vp-avatar-link:hover {
            transform: scale(1.05) !important;
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
        @keyframes likePop {
            0% { transform: scale(1); }
            50% { transform: scale(1.3); color: #ff3366 !important; }
            100% { transform: scale(1); }
        }
        .vp-post-action:active svg {
            animation: likePop 0.2s ease-out !important;
        }
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
        .vp-notif {
            animation: notificationAppear 0.3s ease-out forwards !important;
            opacity: 0;
        }
        @keyframes notificationAppear {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(postDesignStyle);


    const styleSidebar = document.createElement('style');
    styleSidebar.textContent = `
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
    `;
    document.head.appendChild(styleSidebar);

    const styleUnderline = document.createElement('style');
    styleUnderline.textContent = `
        .vp-nick .vp-nick-text {
            transition: text-decoration-color 0.2s ease;
        }
        a[href^="/@"]:hover .vp-nick-text {
            text-decoration: underline;
            text-decoration-thickness: 2px;
            text-underline-offset: 4px;
            text-decoration-color: var(--accent-primary, #0080FF);
        }
    `;
    document.head.appendChild(styleUnderline);

    let modalOverlay = null;
    let updateTimeout = null;

    function isModalVisible() {
        const modals = document.querySelectorAll('.vp-modal, [class*="modal"]');
        for (const modal of modals) {
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

    // Свои покраски (ники и аватарки — в радуге каждый кадр) окно не открывают: их пропускаем,
    // иначе проверка окон с пересчётом раскладки шла бы 20 раз в секунду. Так же — то, что мы
    // двигаем каждый кадр: посты при прокрутке (сцена), кнопки меню и подложка, баннер, свечение видео.
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

    const styleIcons = document.createElement('style');
    styleIcons.textContent = `
        .vp-nav-link .vp-nav-icon svg {
            transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1) !important;
        }
        .vp-nav-link:hover .vp-nav-icon svg {
            transform: translateY(-2px) scale(1.05) !important;
        }
    `;
    document.head.appendChild(styleIcons);

    function addBlurBackground() {
        // Идём от картинок, а не от всех постов: посты без картинки иначе перебирались на каждую правку страницы
        const cards = new Set();
        document.querySelectorAll('img.' + SELECTORS.postMedia).forEach(img => {
            if (img._vpBlurDone) return;                  // её карточки уже с фоном
            let pending = false;
            for (const card of [img.closest('.' + SELECTORS.repost), img.closest('article.' + SELECTORS.post)]) {
                if (card && !card.hasAttribute('data-blur-bg')) { cards.add(card); pending = true; }
            }
            if (!pending) img._vpBlurDone = true;
        });
        cards.forEach(article => {
            const img = article.querySelector('img.' + SELECTORS.postMedia);
            if (!img || !img.src || img.src.includes('avatar')) return;

            article.setAttribute('data-blur-bg', 'true');

            if (getComputedStyle(article).position === 'static') {
                article.style.position = 'relative';
            }

            article.classList.add('itd-blur-active');

            let bgContainer = article.querySelector('.itd-blur-container');
            if (!bgContainer) {
                bgContainer = document.createElement('div');
                bgContainer.className = 'itd-blur-container';
                bgContainer.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border-radius: inherit;
                    overflow: hidden;
                    z-index: -1;
                    pointer-events: none;
                    background: var(--block-bg, #1c1c1c);
                `;
                article.insertBefore(bgContainer, article.firstChild);
            } else {
                bgContainer.innerHTML = '';
            }

            // Свечение — ровно там, где картинка, и её размера: раньше размытая картинка растягивалась
            // на всю карточку от центра, и пятно цвета оказывалось далеко от самой картинки
            // (на широком экране — ещё дальше). Место пересчитываем, когда меняется картинка или карточка.
            const blurLayer = document.createElement('div');
            blurLayer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 0;
                height: 0;
                background-image: url(${img.src});
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                filter: blur(34px) brightness(1.3) saturate(1.6);
                transform: scale(1.3);
            `;
            const place = () => {
                if (!img.isConnected || !article.isConnected) return;
                const ar = article.getBoundingClientRect(), ir = img.getBoundingClientRect();
                if (!ar.width || !ir.width) return;
                const k = article.offsetWidth / ar.width;          // сцена ленты чуть масштабирует пост
                Object.assign(blurLayer.style, {
                    left: ((ir.left - ar.left) * k - article.clientLeft) + 'px', top: ((ir.top - ar.top) * k - article.clientTop) + 'px',
                    width: ir.width * k + 'px', height: ir.height * k + 'px'
                });
            };
            const ro = new ResizeObserver(place);
            ro.observe(img);
            ro.observe(article);
            place();

            const darkOverlay = document.createElement('div');
            darkOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.45);
            `;

            bgContainer.appendChild(blurLayer);
            bgContainer.appendChild(darkOverlay);
        });
    }

    const styleBlurPosts = document.createElement('style');
    styleBlurPosts.textContent = `
        .vp-post.itd-blur-active, .vp-repost.itd-blur-active {
            background: transparent !important;
            backdrop-filter: none !important;
        }
        .itd-blur-active .vp-repost {
            background: rgba(0, 0, 0, 0.3) !important;
        }
        .vp-post .blur-bg-layer, .vp-post .blur-overlay,
        .vp-repost .blur-bg-layer, .vp-repost .blur-overlay {
            display: none !important;
        }
    `;
    document.head.appendChild(styleBlurPosts);

    onDom(function postBlur() { if (postBlurEnabled) addBlurBackground(); });

    function overrideFilePicker() {
        document.querySelectorAll('input[type="file"]').forEach(input => {
            if (input.hasAttribute('data-overridden')) return;

            const accept = (input.accept || '').toLowerCase();
            const isImageInput = accept.includes('.jpg') ||
                accept.includes('.png') ||
                accept.includes('.gif') ||
                accept.includes('.webp') ||
                accept.includes('image/');

            if (!isImageInput) return;

            input.setAttribute('data-overridden', 'true');

            const originalClick = input.click;
            input.click = function () {
                const tempInput = document.createElement('input');
                tempInput.type = 'file';
                tempInput.accept = input.accept;
                tempInput.multiple = input.multiple;
                tempInput.style.display = 'none';
                document.body.appendChild(tempInput);

                let handled = false;

                tempInput.addEventListener('change', function (e) {
                    if (handled) return;
                    if (!this.files || !this.files.length) {
                        document.body.removeChild(tempInput);
                        return;
                    }

                    const dt = new DataTransfer();
                    for (const file of this.files) {
                        if (file.type !== 'image/gif' && file.type.startsWith('image/')) {
                            const newFileName = file.name.replace(/\.[^.]+$/, '') + '.gif';
                            const newFile = new File([file], newFileName, { type: 'image/gif' });
                            dt.items.add(newFile);
                        } else {
                            dt.items.add(file);
                        }
                    }
                    input.files = dt.files;
                    const changeEvent = new Event('change', { bubbles: true });
                    input.dispatchEvent(changeEvent);
                    document.body.removeChild(tempInput);
                    handled = true;
                });

                tempInput.click();
            };
        });
    }

    /* function overridePasteHandler() {
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function (type, listener, options) {
            if (type === 'paste') {
                const wrappedListener = function (e) {
                    const items = e.clipboardData?.items;
                    if (!items) return;

                    let hasImage = false;
                    const imageFiles = [];

                    for (const item of items) {
                        if (item.type.startsWith('image/')) {
                            hasImage = true;
                            const file = item.getAsFile();
                            if (file) {
                                imageFiles.push(file);
                            }
                        }
                    }

                    if (!hasImage || !imageFiles.length) {
                        return listener.call(this, e);
                    }

                    e.preventDefault();
                    e.stopPropagation();

                    const dt = new DataTransfer();
                    for (const file of imageFiles) {
                        let finalFile = file;
                        if (file.type !== 'image/gif') {
                            const newFileName = (file.name || 'pasted_image').replace(/\.[^.]+$/, '') + '.gif';
                            finalFile = new File([file], newFileName, { type: 'image/gif' });
                        }
                        dt.items.add(finalFile);
                    }

                    const pasteEvent = new ClipboardEvent('paste', {
                        clipboardData: dt,
                        bubbles: true,
                        cancelable: true
                    });

                    this.dispatchEvent(pasteEvent);
                };
                return originalAddEventListener.call(this, type, wrappedListener, options);
            }
            return originalAddEventListener.call(this, type, listener, options);
        };
    } */

    function overrideDragAndDrop() {
        document.addEventListener('drop', function (e) {
            const files = e.dataTransfer?.files;
            if (!files || !files.length) return;

            const dt = new DataTransfer();
            let modified = false;
            for (const file of files) {
                if (file.type !== 'image/gif' && file.type.startsWith('image/')) {
                    const newFileName = file.name.replace(/\.[^.]+$/, '') + '.gif';
                    const newFile = new File([file], newFileName, { type: 'image/gif' });
                    dt.items.add(newFile);
                    modified = true;
                } else {
                    dt.items.add(file);
                }
            }

            if (modified) {
                e.preventDefault();
                e.stopPropagation();

                const target = e.target.closest('[contenteditable="true"], input, textarea');
                if (target) {
                    const dropEvent = new DragEvent('drop', {
                        dataTransfer: dt,
                        bubbles: true,
                        cancelable: true
                    });
                    target.dispatchEvent(dropEvent);
                }
            }
        }, true);

        document.addEventListener('dragover', function (e) {
            e.preventDefault();
        }, true);
    }

    function overrideFetchAndXHR() {
        const originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function (body) {
            if (body instanceof FormData) {
                const newFormData = new FormData();
                for (const [key, value] of body.entries()) {
                    if (value instanceof File && value.type !== 'image/gif' && value.type.startsWith('image/')) {
                        const newFileName = value.name.replace(/\.[^.]+$/, '') + '.gif';
                        const newFile = new File([value], newFileName, { type: 'image/gif' });
                        newFormData.append(key, newFile);
                    } else {
                        newFormData.append(key, value);
                    }
                }
                return originalSend.call(this, newFormData);
            }
            return originalSend.call(this, body);
        };

        const originalFetch = window.fetch;
        window.fetch = function (input, init) {
            if (init?.body instanceof FormData) {
                const newFormData = new FormData();
                for (const [key, value] of init.body.entries()) {
                    if (value instanceof File && value.type !== 'image/gif' && value.type.startsWith('image/')) {
                        const newFileName = value.name.replace(/\.[^.]+$/, '') + '.gif';
                        const newFile = new File([value], newFileName, { type: 'image/gif' });
                        newFormData.append(key, newFile);
                    } else {
                        newFormData.append(key, value);
                    }
                }
                init.body = newFormData;
            }
            return originalFetch.call(this, input, init);
        };
    }

    function overrideFileReader() {
        const originalReadAsDataURL = FileReader.prototype.readAsDataURL;
        FileReader.prototype.readAsDataURL = function (blob) {
            if (blob instanceof File && blob.type !== 'image/gif' && blob.type.startsWith('image/')) {
                const newFileName = blob.name.replace(/\.[^.]+$/, '') + '.gif';
                const newFile = new File([blob], newFileName, { type: 'image/gif' });
                return originalReadAsDataURL.call(this, newFile);
            }
            return originalReadAsDataURL.call(this, blob);
        };
    }

    if (antiCensorshipEnabled) {
        setTimeout(overrideFilePicker, 500);
        /* setTimeout(overridePasteHandler, 500); */
        setTimeout(overrideDragAndDrop, 500);
        setTimeout(overrideFetchAndXHR, 500);

        window._fileObserver = new MutationObserver(() => {
            overrideFilePicker();
        });
        window._fileObserver.observe(document.body, { childList: true, subtree: true });
    }

    // Мобильная разметка ещё не сохранена, поэтому здесь последние классы сайта: они устарели
    // и сейчас ничего не находят (правки просто не применяются, ошибок нет). Заменить на поиск
    // по приметам, когда будет снимок страницы в мобильной ширине.
    const MOBILE_OLD = {
        container: '.yYHA',       // основной контейнер: на телефоне убираем верхний отступ
        createBtn: '.JHRx',       // кнопка «создать пост» над нижней панелью
        bordered: '.uDYw',        // элементы с нижней границей
        toast: '.eqPa'            // всплывашка: на телефоне переносим наверх
    };

    (function () {
        function applyFixes() {
            const isMobile = window.innerWidth <= 1172;
            const container = document.querySelector(MOBILE_OLD.container);
            const createBtn = document.querySelector(MOBILE_OLD.createBtn);
            const scrollBtn = document.querySelector('.itd-scroll-top-btn');
            const uDYwElements = document.querySelectorAll(MOBILE_OLD.bordered);
            const eqPa = document.querySelector(MOBILE_OLD.toast);
            const nickContainer = document.querySelector('.' + SELECTORS.nickLarge);

            if (!scrollBtn) return;

            if (isMobile) {
                uDYwElements.forEach(el => {
                    el.style.setProperty('border-bottom', 'none', 'important');
                });

                if (!document.querySelector('#itd-mobile-fixes')) {
                    const style = document.createElement('style');
                    style.id = 'itd-mobile-fixes';
                    style.textContent = `
                        html, body { overscroll-behavior: none !important; }
                        ::-webkit-scrollbar { display: none !important; }
                    `;
                    document.head.appendChild(style);
                }

                scrollBtn.style.zIndex = '1';
                scrollBtn.style.bottom = '100px';
                scrollBtn.style.right = '16px';

                if (container) {
                    container.style.paddingTop = '0';
                }

                if (createBtn) {
                    createBtn.style.position = 'absolute';
                    createBtn.style.bottom = 'calc(100% - 1px)';
                    createBtn.style.left = '50%';
                    createBtn.style.transform = 'translateX(-50%)';
                    createBtn.style.width = '120px';
                    createBtn.style.height = '36px';
                    createBtn.style.borderRadius = '24px 24px 0 0';
                }

                if (eqPa) {
                    eqPa.style.bottom = 'auto';
                    eqPa.style.top = '16px';
                }

                if (nickContainer) {
                    let wrapper = nickContainer.querySelector('.nick-wrapper');

                    if (!wrapper) {
                        wrapper = document.createElement('span');
                        wrapper.className = 'nick-wrapper';
                        wrapper.style.cssText = `
                            display: flex !important;
                            align-items: center !important;
                            flex-wrap: wrap !important;
                            gap: 4px !important;
                        `;

                        const controls = nickContainer.querySelector('.nick-controls-panel');
                        const children = [];

                        for (const child of nickContainer.children) {
                            if (child === controls) continue;
                            children.push(child);
                        }

                        nickContainer.insertBefore(wrapper, nickContainer.firstChild);

                        for (const child of children) {
                            wrapper.appendChild(child);
                        }
                    }

                    nickContainer.style.display = 'flex';
                    nickContainer.style.flexDirection = 'column';
                    nickContainer.style.alignItems = 'center';
                    nickContainer.style.gap = '4px';
                    nickContainer.style.width = '';

                    const controls = nickContainer.querySelector('.nick-controls-panel');
                    if (controls) {
                        controls.style.display = 'flex';
                        controls.style.flexWrap = 'wrap';
                        controls.style.gap = '4px';
                        controls.style.marginTop = '0';
                        controls.style.marginLeft = '0';
                        controls.style.marginRight = '0';
                        controls.style.justifyContent = 'center';
                        controls.style.width = '';
                    }
                }

            } else {
                uDYwElements.forEach(el => {
                    el.style.removeProperty('border-bottom');
                });

                scrollBtn.style.zIndex = '';
                scrollBtn.style.bottom = '16px';
                scrollBtn.style.right = '16px';

                if (container) {
                    container.style.paddingTop = '';
                }

                if (createBtn) {
                    createBtn.style.position = '';
                    createBtn.style.bottom = '';
                    createBtn.style.left = '';
                    createBtn.style.transform = '';
                    createBtn.style.width = '';
                    createBtn.style.height = '';
                    createBtn.style.borderRadius = '';
                }

                if (eqPa) {
                    eqPa.style.bottom = '';
                    eqPa.style.top = '';
                }

                if (nickContainer) {
                    const wrapper = nickContainer.querySelector('.nick-wrapper');
                    if (wrapper) {
                        const children = [...wrapper.children];
                        for (const child of children) {
                            nickContainer.insertBefore(child, wrapper);
                        }
                        wrapper.remove();
                    }

                    nickContainer.style.display = '';
                    nickContainer.style.flexDirection = '';
                    nickContainer.style.alignItems = '';
                    nickContainer.style.gap = '';
                    nickContainer.style.width = '';
                }

                const controls = document.querySelector('.nick-controls-panel');
                if (controls) {
                    controls.style.display = '';
                    controls.style.flexWrap = '';
                    controls.style.gap = '';
                    controls.style.marginTop = '';
                    controls.style.marginLeft = '';
                    controls.style.marginRight = '';
                    controls.style.justifyContent = '';
                    controls.style.width = '';
                }

                const fixStyle = document.querySelector('#itd-mobile-fixes');
                if (fixStyle) fixStyle.remove();
            }
        }

        applyFixes();

        onDom(function mobileFixes() {
            if (!window._fixing) {
                window._fixing = true;
                applyFixes();
                setTimeout(() => { window._fixing = false; }, 100);
            }
        });

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                window._fixing = true;
                applyFixes();
                setTimeout(() => { window._fixing = false; }, 100);
            }, 200);
        });
    })();

    let currentPostId = null;

    (function () {
        const originalFetch = window.fetch;
        window.fetch = function (...args) {
            const url = args[0];
            if (typeof url === 'string' && url.includes('/api/posts/') && url.includes('/comments')) {
                const match = url.match(/\/api\/posts\/([^\/]+)\/comments/);
                if (match) {
                    currentPostId = match[1];
                    console.log('📌 Post ID сохранён:', currentPostId);
                }
            }
            return originalFetch.apply(this, args);
        };
    })();

    function replaceNotificationTexts() {
        const messages = [
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

        // Только сообщения об ошибках — всплывашки сайта (role=alert/status, aria-live) с текстом
        // про ошибку. В 2.9.x подмена ошибочно шла по тексту уведомлений — маты стояли у всех у ника.
        document.querySelectorAll('[role="alert"], [role="status"], [aria-live]').forEach(box => {
            if (box.closest('.vp-msg-backdrop, .vpi-overlay')) return;
            [box, ...box.querySelectorAll('*')].forEach(el => {
                if (el.childElementCount || el.hasAttribute('data-replaced')) return;
                if (!ERROR_TEXT.test(el.textContent)) return;
                el.textContent = messages[Math.floor(Math.random() * messages.length)];
                el.setAttribute('data-replaced', 'true');
            });
        });
    }
    const ERROR_TEXT = /ошибк|не удалось|не получилось|попробуйте|что-то пошло не так|error|failed/i;

    onDom(replaceNotificationTexts);

    const emojiColors = new Map();
    function getEmojiColor(emoji) {
        if (!emojiColors.has(emoji)) emojiColors.set(emoji, measureEmojiColor(emoji));
        return emojiColors.get(emoji);
    }
    function measureEmojiColor(emoji) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 64, 64);
        ctx.font = '48px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 32, 34);

        const imageData = ctx.getImageData(0, 0, 64, 64);
        const data = imageData.data;

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 128) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }
        }

        if (count === 0) return null;

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        return { r, g, b };
    }

    // Цвет эмодзи для оттенка карточки: средний цвет, поднятый по яркости и насыщенности,
    // иначе тёмные и серые эмодзи давали мутно-бурую заливку. Возвращает «r, g, b».
    const emojiTints = new Map();
    function emojiTint(emoji) {
        if (emojiTints.has(emoji)) return emojiTints.get(emoji);
        const c = getEmojiColor(emoji);
        let tint = null;
        if (c) {
            const [r, g, b] = [c.r, c.g, c.b].map(v => v / 255);
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
    function tintCard(el, emoji) {
        const tint = emoji && emojiTint(emoji);
        if (!tint) return false;
        el.style.setProperty('--vp-emoji', tint);
        el.classList.add('vp-emoji-tint');
        return true;
    }

    function colorizePosts() {
        document.querySelectorAll('article.' + SELECTORS.post + ':not([data-post-colored])').forEach(post => {
            const avatar = post.querySelector('.' + SELECTORS.avatarLink + ' .' + SELECTORS.avatar);
            if (!avatar) return;

            const emoji = avatar.textContent.trim();
            if (!emoji) return;

            const hasImage = post.querySelector('.' + SELECTORS.postMedia);

            if (postBlurEnabled && hasImage) {
                post.setAttribute('data-post-colored', 'true');
                return;
            }

            tintCard(post, emoji);
            post.setAttribute('data-post-colored', 'true');
        });
    }

    onDom(function postColors() {
        if (!location.pathname.includes('/notifications')) colorizePosts();
    });

    // Эмодзи-аватарка пункта: выученный класс аватара в уведомлениях может не совпасть,
    // поэтому ищем сам лист с одной эмодзи — сначала внутри ссылки на профиль
    const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[\u200d\ufe0f\u{1F3FB}-\u{1F3FF}])+$/u;
    function emojiAvatarOf(item) {
        const tagged = item.querySelector('.' + SELECTORS.avatar);
        if (tagged && tagged.textContent.trim()) return tagged.textContent.trim();
        const leaves = [...item.querySelectorAll('span, div')].filter(e => !e.children.length && EMOJI_ONLY.test(e.textContent.trim()));
        const leaf = leaves.find(e => e.closest(PROFILE_LINK)) || leaves[0];
        return leaf ? leaf.textContent.trim() : null;
    }

    function colorizeNotifications() {
        document.querySelectorAll('.' + SELECTORS.notification).forEach(el => {
            const emoji = emojiAvatarOf(el);
            // сайт переиспользует пункты списка — перекрашиваем, если эмодзи сменилась
            if (!emoji || el.getAttribute('data-colored') === emoji) return;
            if (tintCard(el, emoji)) el.setAttribute('data-colored', emoji);
        });
    }

    onDom(function notificationColors() {
        if (location.pathname.includes('/notifications')) colorizeNotifications();
    });



    // ================= Дизайн и удобство =================
    const designStyle = document.createElement('style');
    designStyle.textContent = `
        /* Оттенок карточки по эмодзи (уведомления, посты без картинки): мягкий градиент от левого
           края поверх родного фона и тонкая рамка того же цвета; при наведении — чуть ярче */
        @property --vp-tint { syntax: '<number>'; inherits: false; initial-value: 0.3; }
        .vp-emoji-tint {
            background-image: linear-gradient(105deg,
                rgba(var(--vp-emoji), var(--vp-tint)) 0%,
                rgba(var(--vp-emoji), calc(var(--vp-tint) * 0.4)) 45%,
                rgba(var(--vp-emoji), calc(var(--vp-tint) * 0.1)) 100%) !important;
            border: 1px solid rgba(var(--vp-emoji), 0.22) !important;
            transition: --vp-tint 0.25s ease, border-color 0.25s ease !important;
        }
        .vp-emoji-tint:hover { --vp-tint: 0.42; border-color: rgba(var(--vp-emoji), 0.4) !important; }
        /* Телефон: уведомления — скруглённые карточки с зазором, как посты, а не полосы во всю ширину */
        @media (max-width: 1172px) {
            .vp-notif { border-radius: 24px !important; margin: 6px 10px !important; }
        }

        /* Версия мода под логотипом: чип и кнопка обновления вместо надписи в 8px */
        .vp-version-row { display: flex; align-items: center; gap: 6px; margin: 2px 0 0; }
        .vp-version-col { flex-direction: column; gap: 3px; margin: 0; }
        .vp-version-chip {
            font: 600 10px/1 ui-monospace, SFMono-Regular, Consolas, monospace;
            color: var(--text-secondary, #8a8a8a); letter-spacing: 0.02em;
            padding: 3px 6px; border-radius: 6px; background: var(--bg-hover, rgba(255, 255, 255, 0.08));
        }
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

        /* Клавиатура: видимый фокус */
        .vp-nav-link:focus-visible, .vp-post-action:focus-visible, .vp-pill-btn:focus-visible,
        .nick-style-option:focus-visible, .settings-option:focus-visible {
            outline: 2px solid var(--vp-accent, #0080ff) !important; outline-offset: 2px !important;
        }
        .vp-nav-link .vp-nav-icon { transition: color 0.2s ease, filter 0.2s ease; }

        /* Кто просил меньше движения — без появлений и пульса */
        @media (prefers-reduced-motion: reduce) {
            .vp-post, .vp-sidebar, .vp-sidebar-right, .vp-notif, .itd-update-sidebar-btn { animation: none !important; }
            .vp-emoji-tint { transition: none !important; }
        }
    `;
    document.head.appendChild(designStyle);

    // Активный пункт меню — по адресу страницы (у сайта это хеш-класс, он меняется)
    function markActiveNav() {
        const path = location.pathname;
        document.querySelectorAll('.' + SELECTORS.navLink).forEach(a => {
            const href = a.getAttribute('href') || '';
            const active = href.startsWith('/') && (href === path || (href !== '/' && path.startsWith(href + '/')));
            a.classList.toggle('vp-active', active);
        });
    }
    markActiveNav();
    onDom(markActiveNav);
    addEventListener('popstate', markActiveNav);

    // ================= 3.0: стекло, переходы, меню, баннер, счётчики, звуки =================
    const fx = document.createElement('style');
    fx.textContent = `
        /* Стекло: блоки сайта полупрозрачные и размывают то, что под ними, — живой фон виден
           сквозь интерфейс. Прозрачность — через переменные сайта, размытие — правилами ниже. */
        html.vp-glass { --vp-glass-filter: blur(18px) saturate(1.5); }
        html.vp-glass[data-theme="dark"] {
            --block-bg: rgba(28, 28, 28, .52); --block-bg-secondary: rgba(42, 42, 44, .55); --block-hover-bg: rgba(44, 44, 47, .6);
            --modal-bg: rgba(17, 17, 17, .8); --glass-bg: rgba(35, 35, 35, .5);
        }
        html.vp-glass.vp-light {
            --block-bg: rgba(255, 255, 255, .6); --block-bg-secondary: rgba(240, 240, 240, .6); --block-hover-bg: rgba(245, 245, 245, .65);
            --modal-bg: rgba(255, 255, 255, .82); --glass-bg: rgba(255, 255, 255, .55);
        }
        /* слабый компьютер: без размытия (его пришлось бы пересчитывать каждый кадр фона), зато плотнее */
        html.vp-glass.vp-glass-lite { --vp-glass-filter: none; }
        html.vp-glass.vp-glass-lite[data-theme="dark"] { --block-bg: rgba(28, 28, 28, .82); --block-bg-secondary: rgba(42, 42, 44, .85); }
        html.vp-glass.vp-glass-lite.vp-light { --block-bg: rgba(255, 255, 255, .85); }
        /* шторка комментариев на телефоне: стекло плотнее — сквозь неё просвечивала лента и мешала читать */
        html.vp-glass[data-theme="dark"] .vp-comments-sheet {
            --block-bg: rgba(24, 24, 24, .9); --block-bg-secondary: rgba(38, 38, 40, .9); --block-hover-bg: rgba(44, 44, 47, .92);
            --modal-bg: rgba(17, 17, 17, .94); --glass-bg: rgba(30, 30, 30, .9);
        }
        html.vp-glass.vp-light .vp-comments-sheet {
            --block-bg: rgba(255, 255, 255, .92); --block-bg-secondary: rgba(240, 240, 240, .92); --block-hover-bg: rgba(245, 245, 245, .94);
            --modal-bg: rgba(255, 255, 255, .95); --glass-bg: rgba(255, 255, 255, .9);
        }
        html.vp-glass .nick-style-dropdown, html.vp-glass .settings-dropdown, html.vp-glass .vp-msg-card {
            backdrop-filter: var(--vp-glass-filter) !important; -webkit-backdrop-filter: var(--vp-glass-filter) !important;
        }

        /* «Жидкая» подложка активного пункта меню: перетекает к новому пункту */
        .vp-nav-has-blob { position: relative; }
        .vp-nav-has-blob > .vp-nav-link { position: relative; z-index: 1; transition: background-color .2s ease, opacity .2s ease !important; }
        .vp-nav-has-blob > .vp-nav-link .vp-nav-icon { transition: none; }
        .vp-nav-has-blob > .vp-nav-link.vp-active { background: transparent !important; }
        /* своя подложка сайта (нижняя панель телефона) — прячем: вместо неё наша, той же формы */
        .vp-nav-has-blob > div:not(.vp-nav-blob) { opacity: 0 !important; }
        /* «+» (Создать пост) — бугорок по центру нижней панели (newPostBump) */
        .vp-new-post { position: absolute !important; width: ${BUMP}px !important; height: ${BUMP}px !important; z-index: 2; margin: 0 !important;
            background: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; }
        .vp-new-post::before { display: none !important; }
        /* фон, размытие и обводка панели — у фигуры «панель + бугорок», у самой панели — выключены */
        nav.vp-has-bump { background: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; }
        nav.vp-has-bump::before { display: none !important; }
        .vp-bump-bg { position: absolute; left: 0; z-index: -1; pointer-events: none; overflow: visible;
            backdrop-filter: var(--vp-glass-filter, blur(16px)); -webkit-backdrop-filter: var(--vp-glass-filter, blur(16px)); }
        .vp-bump-bg .vp-bump-fill { fill: var(--glass-bg); }
        /* Ивент: вместо картинки-портала сайта — свой значок (eventIcon) */
        a[href="/event"] img[src*="/portal/"], img.vp-portal-img { display: none !important; }
        @media (prefers-reduced-motion: reduce) { .vp-portal { animation: none !important; } }
        .vp-portal[data-state="live"] { animation: vpPortalPulse 2s ease-in-out infinite; }
        @keyframes vpPortalPulse {
            0%, 100% { filter: drop-shadow(0 0 4px rgba(144, 162, 255, .2)); }
            50% { filter: drop-shadow(0 0 16px rgb(144, 162, 255)); }
        }
        .vp-nav-blob { position: absolute; left: 0; top: 0; z-index: 0; pointer-events: none; opacity: 0;
            background: color-mix(in srgb, var(--vp-accent, #0080ff) 14%, var(--block-bg, #1c1c1c));
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent, #0080ff) 32%, transparent),
                0 8px 24px -10px color-mix(in srgb, var(--vp-accent, #0080ff) 70%, transparent);
            transition: opacity .25s ease, background-color .4s ease; }

        /* Баннер с глубиной: низ растворяется в фон, при прокрутке картинка отстаёт */
        .vp-banner.vp-depth { background: transparent !important; }
        /* маска — только на картинку: кнопки баннера (палитра, загрузка, удаление) остаются яркими */
        .vp-banner.vp-depth > img[alt="Banner"] { will-change: transform; transform-origin: 50% 50%;
            -webkit-mask-image: linear-gradient(to bottom, #000 58%, transparent); mask-image: linear-gradient(to bottom, #000 58%, transparent); }

        /* Счётчики профиля «накручиваются»: число рисует ::after, свой текст сайта не трогаем */
        @property --vp-n { syntax: '<integer>'; inherits: false; initial-value: 0; }
        .vp-count { position: relative; color: transparent !important; }
        .vp-count::after { content: counter(vpn); counter-reset: vpn var(--vp-n); position: absolute; left: 0; top: 0;
            color: var(--vp-count-color); animation: vpCount .9s cubic-bezier(.2, .8, .2, 1) forwards; }
        @keyframes vpCount { from { --vp-n: 0; } to { --vp-n: var(--vp-to); } }

        /* Стили ника «Перелив» и «Глитч» */
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
        /* 20. Сцена ленты: положение поста на экране (считает sceneFrame) → прозрачность и масштаб.
           Переменные не наследуются: их смена пересчитывает стиль только самого поста, а не всего внутри */
        @property --vp-so { syntax: '<number>'; inherits: false; initial-value: 1; }
        @property --vp-ss { syntax: '<number>'; inherits: false; initial-value: 1; }
        @property --vp-sy { syntax: '<length>'; inherits: false; initial-value: 0px; }
        html.vp-scene article.vp-post {
            animation: none !important; transform-origin: 50% 0;
            opacity: var(--vp-so, 1); transform: translateY(var(--vp-sy, 0px)) scale(var(--vp-ss, 1));
        }

        /* 22. Свечение видео */
        .vp-ambient-host { isolation: isolate; }
        .vp-ambient { position: absolute; z-index: -1; pointer-events: none; border-radius: 40px; opacity: 0;
            filter: blur(26px) saturate(1.7); transition: opacity .8s ease; }
        .vp-ambient.vp-on { opacity: .8; }

        /* 26. Бегунок вкладок: свой переход вместо сайтового */
        .vp-tab-ind { transition: background-color .2s ease !important; }

        /* 27. Карточка профиля */
        /* карточка лежит поверх текста поста — фон почти сплошной (стекло тут мешало читать) */
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
        .vp-hc-login { font-size: 13px; color: var(--text-secondary, #8a8a8a); }
        .vp-hc-bio { margin-top: 8px; font-size: 13px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .vp-hc-bio:empty { display: none; }
        .vp-hc-stats { display: flex; gap: 14px; margin-top: 10px; font-size: 13px; color: var(--text-secondary, #8a8a8a); }
        .vp-hc-stats:empty { display: none; }
        .vp-hc-stats b { color: var(--text-primary, #fff); }
        @keyframes vpHcIn { from { opacity: 0; transform: translateY(6px) scale(.97); } }

        @media (prefers-reduced-motion: reduce) {
            .vp-hc { animation: none; }
            .vp-count::after { animation: none; counter-reset: vpn var(--vp-to); }
            .vp-nav-blob { transition: none; }
        }
    `;
    document.head.appendChild(fx);
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- 1. Стекло
    let glassEnabled = GM_getValue('glassEnabled', true);
    // Какие блоки сайта стеклянные — берём из его же стилей: правила с фоном var(--block-bg…).
    // Классы сайта — хеши, а так их знать не нужно. Новые таблицы (подгрузка) — дописываем.
    const glassCss = document.createElement('style');
    document.head.appendChild(glassCss);
    let glassSheets = -1;
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
            try { walk(sh.cssRules); } catch (e) { /* чужой домен — пропускаем */ }
        }
        glassCss.textContent = [...sels].map(sel => `html.vp-glass :is(${sel}) { backdrop-filter: var(--vp-glass-filter); -webkit-backdrop-filter: var(--vp-glass-filter); }`).join('\n');
    }
    function applyGlass() {
        document.documentElement.classList.toggle('vp-glass', glassEnabled);
        if (glassEnabled) collectGlass();
    }
    applyGlass();
    onDom(function glassSheetsCheck() { if (glassEnabled) collectGlass(); });
    // Шторка комментариев (телефон): самый внешний закреплённый на экране блок вокруг поля комментария
    onDom(function commentsSheet() {
        for (const input of commentInputs()) {
            let sheet = null;
            for (let p = input.parentElement; p && p !== document.body; p = p.parentElement) {
                if (getComputedStyle(p).position === 'fixed') sheet = p;
            }
            if (sheet && !sheet.classList.contains('vp-comments-sheet')) sheet.classList.add('vp-comments-sheet');
        }
    });

    // --- 3. Переходы между страницами: сменился адрес — колонка с содержимым мягко въезжает
    let lastPath = location.pathname;
    function pageColumn() {
        let el = document.querySelector('.' + [SELECTORS.feedBar, SELECTORS.tabs, SELECTORS.banner, SELECTORS.post, SELECTORS.notification].join(', .'));
        if (!el) return null;
        // вверх до колонки, но не до общего контейнера с боковыми меню: сдвиг/размытие предка
        // уводит их закреплённые (fixed) блоки вместе с ним — меню «уезжало» и размывалось
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

    // --- 10. «Жидкая» подложка меню: при смене пункта растягивается от старого к новому и стягивается
    // меню в строку — нижняя панель телефона; в колонку — левое меню компьютера
    function navIsRow(nav) {
        const links = nav.querySelectorAll(':scope > .' + SELECTORS.navLink);
        return links.length > 1 && Math.abs(links[0].offsetTop - links[1].offsetTop) < 4;
    }
    let blob = null, blobAt = null;
    function moveNavBlob() {
        const nav = document.querySelector('.' + SELECTORS.nav);
        const active = nav && nav.querySelector(':scope > .' + SELECTORS.navLink + '.vp-active');
        if (!nav) return;
        if (!blob || !nav.contains(blob)) {
            // Сайт нарисовал меню заново (на телефоне нижняя панель перерисовывается при каждом переходе):
            // новая подложка встаёт туда, где была старая, — и дальше перетекает к новому пункту
            const was = blob && blobAt && blob.style.opacity === '1' ? blobAt : null;
            blob = document.createElement('div');
            blob.className = 'vp-nav-blob';
            nav.classList.add('vp-nav-has-blob');
            nav.prepend(blob);
            blobAt = null;
            if (was && !calm) {
                blob.style.transition = 'none';
                Object.assign(blob.style, blobBox(was), { opacity: '1', borderRadius: blobRadius });
                blob.offsetWidth;                          // применить без перехода прозрачности
                blob.style.transition = '';
                blobAt = was;
                // меню перерисовали посреди перетекания — новая подложка доигрывает его с того же места
                if (flow && performance.now() - flow.t0 < BLOB_MS) blobFlow(flow.f, flow.t, flow.t0);
            }
        }
        if (!active) { blob.style.opacity = '0'; return; }
        const row = navIsRow(nav);
        let to = { top: active.offsetTop, left: active.offsetLeft, width: active.offsetWidth, height: active.offsetHeight };
        // Нижняя панель телефона: у сайта своя подложка (div в панели, 58 px, по 6 px от краёв панели,
        // скругление 32px). Наша встаёт ровно её размера и формы — по центру активной кнопки, а свою
        // сайт прячет (стиль .vp-nav-has-blob > div). Нет её — овал чуть шире кнопки.
        const siteInd = row && [...nav.children].find(c => c.tagName === 'DIV' && c !== blob);
        if (siteInd && siteInd.offsetHeight) {
            const w = parseFloat(siteInd.style.width) || siteInd.offsetWidth;
            to = { top: siteInd.offsetTop, height: siteInd.offsetHeight, width: w, left: to.left + (to.width - w) / 2 };
        } else if (row) { const extra = Math.round(to.width * .18); to = { ...to, left: to.left - extra / 2, width: to.width + extra }; }
        if (blobAt && to.top === blobAt.top && to.left === blobAt.left && to.width === blobAt.width && to.height === blobAt.height) return;
        // У пунктов нижней панели своего скругления нет. Скругление — в px от овала на месте: при растяжке
        // края остаются теми же полуовалами (выходит капля-пилюля), а не растягиваются сами
        const rad = getComputedStyle(active).borderRadius;
        blob.style.borderRadius = blobRadius = siteInd && parseFloat(getComputedStyle(siteInd).borderRadius) ? getComputedStyle(siteInd).borderRadius
            : row || !parseFloat(rad) ? `${to.width / 2}px / ${to.height / 2}px` : rad;
        const from = blobAt && !calm && blob.style.opacity === '1' ? blobAt : null;
        if (from && row) {
            // Нижняя панель телефона: перетекание — анимация браузера, без кода на каждый кадр и без замеров
            // по пути (они и тормозили: сайт в этот момент рисует новую страницу)
            blobAnim = null;
            Object.assign(blob.style, blobBox(to));
            blobFlow(from, to);
        } else if (from) {
            // Левое меню компьютера: считаем по кадрам (proxFrame) — подложка по пути сдвигается так же,
            // как кнопки-«док», мимо которых идёт
            blobAnim = { from, to, t0: performance.now() };
        } else { blobAnim = null; Object.assign(blob.style, blobBox(to)); }
        blob.style.opacity = '1';
        blobAt = to;
        if (!row) proxKick();                             // «док» и покадровое перетекание — только у левого меню
    }
    let blobAnim = null, flow = null, blobRadius = '';
    const BLOB_MS = 460;
    const blobBox = r => ({ top: r.top + 'px', left: r.left + 'px', width: r.width + 'px', height: r.height + 'px' });
    const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const lerp = (a, b, t) => a + (b - a) * t;
    // середина перетекания: подложка растянута от старого пункта до нового
    function blobMid(f, t, row) {
        if (row) {                                         // меню в строку (телефон): растягивается вбок
            const lo = Math.min(f.left, t.left), hi = Math.max(f.left + f.width, t.left + t.width);
            return { left: lo, top: t.top + t.height * .04, height: t.height * .92, width: hi - lo };
        }
        const lo = Math.min(f.top, t.top), hi = Math.max(f.top + f.height, t.top + t.height);
        return { top: lo, left: t.left + t.width * .04, width: t.width * .92, height: hi - lo };
    }
    // геометрия подложки в момент перетекания: 0–45% — растяжение от старого до нового, дальше — стяжка
    function blobGeom(an, now) {
        const p = Math.min(1, (now - an.t0) / BLOB_MS), f = an.from, t = an.to, mid = blobMid(f, t, false);
        const [a, b, q] = p < .45 ? [f, mid, easeIO(p / .45)] : [mid, t, easeIO((p - .45) / .55)];
        return { g: { top: lerp(a.top, b.top, q), left: lerp(a.left, b.left, q), width: lerp(a.width, b.width, q), height: lerp(a.height, b.height, q) }, done: p >= 1 };
    }
    // То же перетекание, но без кода на кадр: анимация браузера по положению и размеру, от старого пункта
    // через растяжку к новому. Не масштабом (transform: scale): тот растягивал и скругления, и обводку —
    // подложка по пути становилась ромбом. Кривая на каждом отрезке — та же easeIO (cubic-bezier(.65, 0, .35, 1)).
    function blobFlow(f, t, t0 = performance.now()) {
        flow = { f, t, t0 };
        const e = 'cubic-bezier(.65, 0, .35, 1)';
        const an = blob.animate([
            { ...blobBox(f), easing: e },
            { ...blobBox(blobMid(f, t, true)), offset: .45, easing: e },
            blobBox(t)
        ], { duration: BLOB_MS });
        an.currentTime = Math.max(0, performance.now() - t0);
    }
    onDom(moveNavBlob);
    addEventListener('resize', () => { blobAt = null; moveNavBlob(); });

    // Кнопки меню выдвигаются к курсору, как док: сдвиг зависит от того, насколько курсор близко
    // (колокол по расстоянию до центра кнопки). Ближние ярче, их иконка чуть крупнее.
    const PROX_MAX = 14, PROX_SIGMA = 46;
    let proxY = null, proxRaf = 0, blobK = 0;
    const proxNow = new WeakMap();
    function proxFrame() {
        proxRaf = 0;
        const nav = document.querySelector('.' + SELECTORS.nav);
        if (!nav) return;
        let moving = false, activeK = 0;
        const rows = [];                                  // центры кнопок и их сдвиг — для перетекания
        nav.querySelectorAll(':scope > .' + SELECTORS.navLink).forEach(a => {
            const r = a.getBoundingClientRect();
            const d = proxY === null ? Infinity : proxY - (r.top + r.height / 2);
            const want = proxY === null ? 0 : Math.exp(-(d * d) / (2 * PROX_SIGMA * PROX_SIGMA));
            const was = proxNow.get(a) || 0;
            const k = Math.abs(want - was) < 0.004 ? want : was + (want - was) * 0.22;   // плавно догоняет
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
        // подложка едет за своей кнопкой отдельно и плавно: после смены пункта она догоняет
        // сдвиг новой кнопки, а не остаётся со сдвигом старой
        if (blob && blobAnim) {
            // сдвиг — как у кнопки, через которую сейчас идёт середина подложки (между кнопками — плавно)
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
            if (e.pointerType !== 'mouse') return;        // палец по экрану — не «док»
            const nav = document.querySelector('.' + SELECTORS.nav);
            if (!nav || navIsRow(nav)) return;
            const r = nav.getBoundingClientRect();
            // зона — меню и немного вокруг, чтобы кнопки начинали выезжать ещё на подходе
            const inside = e.clientX >= r.left - 24 && e.clientX <= r.right + 40 && e.clientY >= r.top - 60 && e.clientY <= r.bottom + 60;
            const y = inside ? e.clientY : null;
            if (y !== proxY) { proxY = y; proxKick(); }
        }, { passive: true });
        document.addEventListener('pointerleave', () => { proxY = null; proxKick(); });
    }

    // --- 20. Сцена ленты: посты, уходящие за верх, уменьшаются и тают; снизу — проявляются.
    // Анимации привязаны к прокрутке средствами браузера (animation-timeline) — без кода на кадр.
    // (animation-timeline: view() не годится: меряет пост от ближайшего блока с обрезкой, а не от
    // экрана — у всех постов выходило одно и то же.) Считаем сами, только видимые посты, раз за кадр.
    let sceneEnabled = GM_getValue('sceneEnabled', true) && !calm;
    document.documentElement.classList.toggle('vp-scene', sceneEnabled);
    const sceneSeen = new Set();
    const sceneIO = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { sceneSeen.add(e.target); sceneKick(); }
        else { sceneSeen.delete(e.target); e.target._vpSceneKey = null; ['--vp-so', '--vp-sy', '--vp-ss'].forEach(v => e.target.style.removeProperty(v)); }
    }), { rootMargin: '150px 0px' });
    const ease = t => t * t * (3 - 2 * t);
    let sceneQueued = false;
    function sceneFrame() {
        sceneQueued = false;
        if (!sceneEnabled) return;
        const H = innerHeight;
        // Сначала все замеры, потом все записи: замер после записи заставлял браузер
        // пересчитывать раскладку страницы заново — на каждый видимый пост в каждом кадре.
        const rects = [...sceneSeen].map(a => [a, a.getBoundingClientRect()]);
        for (const [a, r] of rects) {
            // Мягко: читать не мешает. Уходящий бледнеет, только когда за верх ушла его четверть,
            // и не до конца; входящий снизу не тускнеет — лишь чуть поднимается на своё место.
            const out = ease(Math.max(0, Math.min(1, (-r.top - r.height * 0.25) / Math.max(1, r.height * 0.75))));
            const inn = ease(Math.max(0, Math.min(1, (H - r.top) / 220)));
            const so = (1 - 0.45 * out).toFixed(3), ss = (1 - 0.04 * out).toFixed(4), sy = (14 * (1 - inn)).toFixed(1) + 'px';
            const key = so + ss + sy;
            if (a._vpSceneKey === key) continue;           // пост посреди экрана: ничего не поменялось
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
        document.querySelectorAll('article.' + SELECTORS.post).forEach(a => { if (!a._vpScene) { a._vpScene = true; sceneIO.observe(a); } });
        sceneKick();
    });

    // --- 22. Свечение видео: вокруг видео растекается свет его же кадра (как «эмбиент» у YouTube).
    // Кадр — в маленький холст раз в 150 мс, размывает его CSS; работает только для видимых видео.
    let ambientEnabled = GM_getValue('ambientEnabled', true);
    const ambient = new Map();                          // видео → { cv, g, host }
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
            // поверх размытой подложки поста (если она есть), но под содержимым
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
        Object.assign(a.cv.style, { left: (vr.left - hr.left - pad) + 'px', top: (vr.top - hr.top - pad) + 'px',
            width: (vr.width + pad * 2) + 'px', height: (vr.height + pad * 2) + 'px' });
        try { a.g.drawImage(v, 0, 0, 48, 27); a.cv.classList.add('vp-on'); } catch (e) { /* кадр ещё не готов */ }
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

    // --- 26. Вкладки «Для вас / Лента кланов / Подписки»: бегунок перетекает, как подложка меню.
    // Сайт двигает бегунок сам (стиль translateX + width) — ловим смену и проигрываем свою анимацию.
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

    // --- 27. Карточка профиля при наведении на ник или аватар: баннер, аватар, описание, счётчики
    const hcCache = new Map();
    let hc = null, hcTimer = 0, hcHide = 0, hcUser = null, hcLink = null;
    const loginOf = href => ((href || '').match(/^\/@([\w.]+)/) || [])[1] || null;
    // Данные профиля: сперва — что уже получил сайт (или ждём его ответ waitMs), свой запрос —
    // только если сайт этот профиль не запрашивал (карточка при наведении на чужой ник, клуб).
    function hcData(user, waitMs = 0) {
        const key = user.toLowerCase();
        if (siteUsers.has(key)) return Promise.resolve(siteUsers.get(key));
        if (!hcCache.has(key)) hcCache.set(key, siteUser(user, waitMs).then(site => site || api('/api/users/' + encodeURIComponent(user))
            .then(r => r.ok ? r.json() : null)
            .then(j => j && (j.data || j.user || j))).catch(() => null));
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
        else bn.style.background = tint ? `linear-gradient(120deg, rgb(${tint}), rgba(${tint}, .25))` : 'linear-gradient(120deg, var(--vp-accent, #0080ff), transparent)';
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

    // --- 13. Баннер с глубиной
    let bannerTop0 = null, bannerQueued = false;
    function bannerDepth() {
        bannerQueued = false;
        const banner = document.querySelector('.' + SELECTORS.banner);
        const img = banner && banner.querySelector(':scope > img[alt="Banner"]');
        if (!img || draggableImg) { bannerTop0 = null; return; }       // пока баннер двигают в редакторе — не мешаем
        banner.classList.add('vp-depth');
        const r = banner.getBoundingClientRect();
        if (bannerTop0 === null) bannerTop0 = r.top;
        const past = Math.max(0, bannerTop0 - r.top);                 // на сколько баннер уехал вверх
        if (past > r.height + bannerTop0) return;                    // давно за экраном
        img.style.transform = calm ? '' : `translateY(${(past * .35).toFixed(1)}px) scale(1.15)`;
        img.style.opacity = String(Math.max(.25, 1 - past / (r.height * 1.4)).toFixed(3));
    }
    addEventListener('scroll', () => { if (!bannerQueued) { bannerQueued = true; requestAnimationFrame(bannerDepth); } }, { capture: true, passive: true });
    onDom(function bannerDepthDom() { bannerDepth(); });
    addEventListener('popstate', () => { bannerTop0 = null; });

    // --- 14. Счётчики профиля «накручиваются» до своего числа (один раз на профиль)
    const COUNT_LABEL = /подпис|пост|лайк|друз/i;
    const counted = new Set();                        // профили, где числа уже накручивались
    const countKey = () => loginOf(location.pathname) || location.pathname;
    function countUp() {
        if (counted.has(countKey())) return;
        const spans = [...document.querySelectorAll('span')].filter(sp => {
            const next = sp.nextElementSibling;                          // сначала дешёвые проверки: span-ов тысячи
            return next && !sp.children.length && /^\d{1,7}$/.test(sp.textContent.trim()) && COUNT_LABEL.test(next.textContent)
                && !sp.closest('.' + SELECTORS.post + ', .' + SELECTORS.notification + ', nav, .vp-rail');   // панель — свои числа, не накручиваем
        });
        if (!spans.length) return;
        counted.add(countKey());
        if (calm) return;
        spans.forEach(sp => {
            sp.style.setProperty('--vp-to', sp.textContent.trim());
            sp.style.setProperty('--vp-count-color', getComputedStyle(sp).color);
            sp.classList.add('vp-count');
            sp.addEventListener('animationend', () => sp.classList.remove('vp-count'), { once: true });
            setTimeout(() => sp.classList.remove('vp-count'), 1400);     // запас, если анимация не доиграет
        });
    }
    onDom(countUp);

    // Посты в строке профиля: «235 подписчиков · 123 подписок · 572 поста». Число — из профиля
    // (/api/users/<ник>, поле postsCount), пункт — копия соседнего пункта сайта, вид родной.
    const plural = (n, one, few, many) => n % 10 === 1 && n % 100 !== 11 ? one
        : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many;
    const postsCounted = new Set();
    function profilePostsRow() {
        const login = loginOf(location.pathname);
        if (!login) return;
        // строка счётчиков: пункт «число + подпись», где подпись — «подписчиков»/«подписок»
        const num = [...document.querySelectorAll('span')].find(sp => sp.nextElementSibling && !sp.children.length && /^\d[\d\s]*$/.test(sp.textContent.trim())
            && /подпис/i.test(sp.nextElementSibling.textContent) && !sp.closest('.' + SELECTORS.post + ', nav, .vp-rail'));
        const item = num && num.parentElement, row = item && item.parentElement;
        if (!row || row.querySelector('.vp-posts-stat')) return;
        if (row.dataset.vpPosts === login) return;           // уже ждём ответ для этого профиля
        row.dataset.vpPosts = login;
        hcData(login, 2500).then(d => {
            const total = d && d.postsCount;
            if (typeof total !== 'number' || !row.isConnected || row.querySelector('.vp-posts-stat') || loginOf(location.pathname) !== login) return;
            const last = [...row.children].filter(c => c.querySelector('span')).pop() || item;
            const mine = last.cloneNode(true);
            mine.classList.add('vp-posts-stat');
            // копия могла снять соседа посреди его накрутки — чистим её следы (прозрачный цвет)
            mine.querySelectorAll('.vp-count').forEach(e => { e.classList.remove('vp-count'); ['--vp-to', '--vp-count-color'].forEach(v => e.style.removeProperty(v)); });
            const [n, label] = mine.querySelectorAll('span');
            n.textContent = total;
            label.textContent = plural(total, 'пост', 'поста', 'постов');
            row.appendChild(mine);
            if (!calm && !postsCounted.has(login)) {            // накрутка, как у соседних счётчиков, — раз на профиль
                postsCounted.add(login);
                n.style.setProperty('--vp-to', String(total));
                n.style.setProperty('--vp-count-color', getComputedStyle(n).color);
                n.classList.add('vp-count');
                setTimeout(() => n.classList.remove('vp-count'), 1400);
            }
        });
    }
    onDom(profilePostsRow);

    // --- 19. Тихие звуки интерфейса (по умолчанию выключены): синтез, без файлов
    let uiSoundEnabled = GM_getValue('uiSoundEnabled', false);
    let uiCtx = null;
    // Телефон: динамик маленький — там те же звуки в 5 раз громче. И мобильный браузер не даёт
    // играть звук, пока не было касания: на первом касании «разблокируем» звук пустым сэмплом.
    const UI_GAIN = matchMedia('(pointer: coarse)').matches ? 5 : 1;
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
                g.gain.exponentialRampToValueAtTime(vol * UI_GAIN, t + at + 0.006);
                g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
                o.connect(g).connect(uiCtx.destination);
                o.start(t + at);
                o.stop(t + at + dur + 0.02);
            };
            // громкости — в 4 раза тише первой версии (владелец дважды просил тише в 2 раза)
            if (kind === 'like') { tone(520, 880, 0.09, 0.015); tone(880, 1320, 0.12, 0.0113, 'sine', 0.06); }  // «пи-пинь»
            else if (kind === 'toggle') tone(1400, 900, 0.05, 0.01, 'triangle');                                // щелчок
            else if (kind === 'nav') tone(300, 220, 0.07, 0.0125);                                               // мягкий «тук»
            else tone(900, 700, 0.04, 0.0075, 'triangle');                                                       // клик
        } catch (e) { /* звук не главное */ }
    }
    document.addEventListener('click', e => {
        if (!uiSoundEnabled || !e.isTrusted) return;
        const t = e.target;
        if (t.closest('button[aria-label="Нравится"]')) uiSound('like');
        else if (t.closest('.settings-option, .toggle-switch')) uiSound('toggle');
        else if (t.closest('.' + SELECTORS.navLink)) uiSound('nav');
        else if (t.closest('.vp-pill-btn, .nick-style-option, .vp-msg-again, button')) uiSound('click');
    }, true);

    // ================= Боковая панель: статистика, клуб ИТД X, змейка =================
    // Стоит в пустой полосе между лентой и правой колонкой сайта. Мало места — прячется.
    let railEnabled = GM_getValue('railEnabled', true);
    const rail = document.createElement('div');
    rail.className = 'vp-rail';
    rail.innerHTML = `
        <section class="vp-rail-card" data-block="stats"><div class="vp-rail-title">${svgIcon('<path d="M4 19V10M10 19V5M16 19v-7M21 19H3"/>', 16)}<span>Статистика</span></div>
            <div class="vp-seg"><div class="vp-seg-ind"></div><button data-p="day">День</button><button data-p="month">Месяц</button></div>
            <div class="vp-stats"><div class="vp-menu-note">Загрузка...</div></div><div class="vp-stats-since"></div></section>
        <section class="vp-rail-card" data-block="club"><div class="vp-rail-title">${svgIcon('<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.5a3 3 0 0 1 0 5.5M18 14.5a5 5 0 0 1 2.5 4.5"/>', 16)}<span>Клуб ИТД X</span><b class="vp-club-count"></b></div>
            <div class="vp-club"><div class="vp-menu-note">Загрузка...</div></div></section>
        <section class="vp-rail-card" data-block="snake"><div class="vp-rail-title">${svgIcon('<path d="M4 17c0-3 2-4 4-4h8a3 3 0 0 0 0-6H9"/><circle cx="7" cy="7" r="1.6"/>', 16)}<span>Змейка</span><b class="vp-snake-score"></b></div>
            <canvas class="vp-snake" width="220" height="220"></canvas>
            <div class="vp-snake-hint">Клик — играть · стрелки или WASD · Esc — пауза</div></section>`;
    document.body.appendChild(rail);

    const railCss = document.createElement('style');
    railCss.textContent = `
        html.vp-side-moved aside:has(nav), html.vp-side-moved .vp-sidebar { left: var(--vp-side-left) !important; }
        .vp-rail { position: fixed; top: 24px; z-index: 50; display: none; flex-direction: column; gap: 12px;
            max-height: calc(100vh - 48px); overflow-y: auto; overflow-x: hidden; scrollbar-width: none; }
        .vp-rail.vp-on { display: flex; animation: vpRailIn .4s ease-out; }
        /* как блоки самого ИТД (поле «Что нового?», баннер): скругление 36px, без обводки */
        .vp-rail-card { border-radius: 36px; padding: 20px 22px; color: var(--text-primary, #fff); background: var(--block-bg, #1c1c1c);
            backdrop-filter: var(--vp-glass-filter, none); -webkit-backdrop-filter: var(--vp-glass-filter, none); }
        .vp-rail-title { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 16px; font-weight: 600;
            color: var(--text-primary, #fff); }
        .vp-rail-title svg { color: var(--text-secondary, #8a8a8a); flex-shrink: 0; }
        .vp-rail-title b { margin-left: auto; color: var(--text-secondary, #8a8a8a); font-size: 14px; font-weight: 500; }
        /* переключатель «День / Месяц» — как вкладки ИТД: стеклянная пилюля с бегунком */
        .vp-seg { position: relative; display: flex; margin-bottom: 10px; padding: 3px; border-radius: 9999px; background: var(--glass-bg, rgba(35, 35, 35, .8)); }
        .vp-seg button { position: relative; z-index: 1; flex: 1; padding: 6px 0; border: 0; background: none; cursor: pointer; font: inherit;
            font-size: 13px; font-weight: 500; color: var(--text-secondary, #8a8a8a); transition: color .2s ease; }
        .vp-seg button.vp-on { color: var(--text-primary, #fff); }
        .vp-seg-ind { position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc(50% - 3px); border-radius: 9999px;
            background: var(--tab-active-bg, rgba(255, 255, 255, .08)); transition: transform .3s cubic-bezier(.5, 0, 0, 1); }
        .vp-seg.vp-month .vp-seg-ind { transform: translateX(100%); }
        .vp-stats-since { margin-top: 4px; font-size: 12px; color: var(--text-secondary, #8a8a8a); }
        .vp-stats-since:empty { display: none; }
        .vp-stat { display: flex; align-items: baseline; gap: 6px; padding: 5px 0; font-size: 15px; }
        .vp-stat-val { font-weight: 700; }
        .vp-stat-label { flex: 1; color: var(--text-secondary, #8a8a8a); }
        .vp-stat-diff { font-size: 13px; font-weight: 600; color: var(--text-secondary, #8a8a8a); }
        .vp-stat-diff.vp-up { color: #3ddc84; }
        .vp-stat-diff.vp-down { color: #ff5a6a; }
        /* отрицательный отступ строк давал горизонтальную прокрутку — строки теперь в своих границах */
        .vp-club { display: flex; flex-direction: column; gap: 2px; max-height: 260px; overflow-y: auto; overflow-x: hidden;
            scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--text-secondary, #888) 45%, transparent) transparent; }
        .vp-club-row { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 18px; cursor: pointer; min-width: 0;
            transition: background-color .15s ease; }
        .vp-club-row:hover { background: var(--bg-hover, rgba(255, 255, 255, .08)); }
        .vp-club-ava { width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-size: 17px; background: var(--bg-hover, rgba(255, 255, 255, .08)); overflow: hidden; }
        .vp-club-ava img { width: 100%; height: 100%; object-fit: cover; }
        .vp-club-names { min-width: 0; display: flex; flex-direction: column; }
        .vp-club-name { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-club-login { font-size: 11px; color: var(--text-secondary, #8a8a8a); }
        .vp-snake { display: block; width: 100%; aspect-ratio: 1; border-radius: 24px; cursor: pointer; background: var(--bg-primary, #000); outline: none; }
        .vp-snake-hint { margin-top: 10px; font-size: 12px; text-align: center; color: var(--text-secondary, #8a8a8a); }
        @keyframes vpRailIn { from { opacity: 0; transform: translateX(10px); } }
        @media (prefers-reduced-motion: reduce) { .vp-rail.vp-on { animation: none; } }
    `;
    document.head.appendChild(railCss);

    // место: от правого края ленты до левого края правой колонки сайта
    // верх панели — постоянный, вровень с баннером и лентой сайта (у них отступ сверху 36px)
    const RAIL_TOP = 36;
    // Края колонки с содержимым — по её внешней обёртке: от блока ленты/поста вверх до самой широкой,
    // где ещё нет боковых меню. Внутренние блоки у открытого поста уже карточки (у неё свои поля),
    // и по ним меню наезжало на карточку, а панель прилипала к ней.
    // Посты ленты лежат в одной колонке: путь вверх у них общий. Ответ по каждому предку запоминаем
    // (memo) — раньше путь и поиск меню внутри обёртки повторялись для каждого поста.
    // Один ответ на проход: его спрашивают и панель, и левое меню (забываем, как проход закончится).
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
        const memo = new Map(), tops = new Set();         // предок → куда дойдёт путь от него (null — стоп)
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
        if (!right) {
            // магазин — отдельная страница в рамке (iframe) во весь экран: своей колонки нет, и меню с панелью
            // встают как при открытии с нуля (меню на месте сайта, панель — в правую колонку), а не по прошлой странице
            const frame = [...document.querySelectorAll('iframe')].find(f => {
                const r = f.getBoundingClientRect();
                return r.width >= innerWidth * 0.72 && r.height >= innerHeight * 0.6;
            });
            if (frame) return { left: 0, right: 0 };
            // страница без ленты, вкладок и постов: колонка — то, что лежит в середине
            // экрана, поднятое до обёртки без боковых колонок. Иначе меню и панель стояли по прошлой странице
            const skip = side + ', nav, .vp-hc, .vp-msg-backdrop, .vpi-overlay';
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
    function placeRail() {
        // лента на миг пропала (переход страницы) — остаёмся на прежнем месте, а не прыгаем
        const cb = contentBox() || lastCb;
        if (cb) lastCb = cb;
        const edge = cb ? cb.right : 0;
        const side = document.querySelector('.' + SELECTORS.sidebarRight);
        const right = side ? side.getBoundingClientRect().left : innerWidth;
        const gap = right - edge;
        let box = null;
        const on = railEnabled && !!myUsername;             // не вошли (страница входа) — панели не место
        if (on && edge > 0 && gap >= 240) {
            const width = Math.min(300, gap - 48);
            box = { left: Math.round(edge + 24), width, maxH: innerHeight - 48 };
        } else if (on && side) {
            // узкий экран: в верх правой колонки сайта, над её ссылками (они внизу)
            const sr = side.getBoundingClientRect(), links = side.lastElementChild;
            const maxH = (links ? links.getBoundingClientRect().top : sr.bottom) - 24 - 24;
            if (sr.width >= 180 && maxH >= 220) box = { left: Math.round(sr.left), width: Math.round(sr.width), maxH };
        }
        rail.style.top = RAIL_TOP + 'px';
        // высота во весь экран — только у панели рядом с лентой; в правой колонке сайта (магазин, узкий экран)
        // панель кончается над ссылками сайта, иначе закрывала «Статус серверов» и остальные
        if (box && edge > 0 && gap >= 240) box.maxH = innerHeight - RAIL_TOP - 24;
        rail.classList.toggle('vp-on', !!box);
        if (!box) { snakePause(); return; }
        rail.style.width = box.width + 'px';
        rail.style.left = box.left + 'px';
        rail.style.maxHeight = box.maxH + 'px';
    }
    addEventListener('resize', placeRail);
    onDom(placeRail);

    // Левое меню — к ленте, симметрично правой панели (у сайта оно прижато к краю экрана).
    // Место не позволяет — остаётся, где его ставит сайт.
    // Отступ задаём правилом стилей (переменная на <html>), а не у самого меню: сайт при смене
    // страницы рисует меню заново, и правило действует на новое сразу — без «прыжка» на 0,2 с.
    function placeSidebar() {
        const side = document.querySelector('.' + SELECTORS.sidebar);
        const cb = contentBox();
        if (!side || !cb) return;                                   // ленты пока нет — оставляем как было
        const siteLeft = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-gap')) || 36;
        const want = Math.round(cb.left - side.getBoundingClientRect().width - 24);
        const on = want > siteLeft + 8 && getComputedStyle(side).position === 'fixed';
        document.documentElement.classList.toggle('vp-side-moved', on);
        if (on) document.documentElement.style.setProperty('--vp-side-left', want + 'px');
    }
    addEventListener('resize', placeSidebar);
    onDom(placeSidebar);
    placeSidebar();

    // --- 35. Статистика: разница за день и за месяц. Снимок чисел — не чаще раза в 6 часов,
    // история — 40 дней (GM vp_stats_hist). Истории меньше периода — считаем от первого снимка.
    const railStats = rail.querySelector('.vp-stats'), railSince = rail.querySelector('.vp-stats-since');
    const seg = rail.querySelector('.vp-seg');
    const fmtNum = n => n >= 10000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace('.0', '') + 'к' : String(n);
    let statsPeriod = GM_getValue('vp_stats_tab', 'day'), statsNow = null;
    const DAY_MS = 864e5;
    function statsHistory() { try { return JSON.parse(GM_getValue('vp_stats_hist', '[]')); } catch (e) { return []; } }
    async function loadStats() {
        if (!myUsername) return setTimeout(loadStats, 1500);
        // счётчики — из /users/me, если он их отдаёт; иначе ответ сайта про мой профиль / свой запрос
        const d = meData && typeof meData.followersCount === 'number' ? meData : await hcData(myUsername, 2500);
        const now = {
            followers: pick(d && d.followersCount, d && d.followers_count, d && d.stats && d.stats.followers, d && typeof d.followers === 'number' ? d.followers : undefined),
            following: pick(d && d.followingCount, d && d.following_count, d && d.stats && d.stats.following, d && typeof d.following === 'number' ? d.following : undefined)
        };
        if (d && typeof d.postsCount === 'number') now.posts = d.postsCount;
        const hist = statsHistory().filter(h => Date.now() - h.at < 40 * DAY_MS);
        if (!hist.length || Date.now() - hist[hist.length - 1].at > 6 * 3600e3) hist.push({ at: Date.now(), ...now });
        GM_setValue('vp_stats_hist', JSON.stringify(hist));
        statsNow = now;
        renderStats();
    }
    function renderStats() {
        seg.classList.toggle('vp-month', statsPeriod === 'month');
        seg.querySelectorAll('button').forEach(b => b.classList.toggle('vp-on', b.dataset.p === statsPeriod));
        if (!statsNow) return;
        const span = statsPeriod === 'month' ? 30 * DAY_MS : DAY_MS;
        const hist = statsHistory();
        // опорный снимок — последний, которому уже есть «период»; нет такого — самый первый
        const base = [...hist].reverse().find(h => Date.now() - h.at >= span) || hist[0] || statsNow;
        const short = Date.now() - base.at < span * 0.9;
        railSince.textContent = short && base.at ? 'с ' + new Date(base.at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
            + ', ' + new Date(base.at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';
        const rows = [['followers', 'подписчиков'], ['following', 'подписок'], ['posts', 'постов']].filter(([k]) => typeof statsNow[k] === 'number');
        if (!rows.length) { railStats.innerHTML = '<div class="vp-menu-note">Сайт не отдал числа</div>'; return; }
        railStats.innerHTML = '';
        rows.forEach(([k, label]) => {
            const diff = typeof base[k] === 'number' ? statsNow[k] - base[k] : 0;
            const row = document.createElement('div');
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

    // --- 34. Клуб ИТД X: у кого стоит скрипт (по кодам под служебным постом — те же, что у вериф-бейджа)
    const railClub = rail.querySelector('.vp-club');
    let clubShown = '';
    function openProfile(login) {
        // переход внутри сайта без перезагрузки: роутер слушает popstate
        history.pushState({}, '', '/@' + login);
        dispatchEvent(new PopStateEvent('popstate'));
    }
    async function renderClub() {
        const names = Object.keys(JSON.parse(localStorage.getItem(VERIFICATION_STORAGE_KEY) || '{}'));
        if (myUsername && !names.some(n => n.toLowerCase() === myUsername.toLowerCase())) names.push(myUsername);
        const key = names.sort().join();
        if (key === clubShown) return;
        clubShown = key;
        rail.querySelector('.vp-club-count').textContent = names.length || '';
        if (!names.length) { railClub.innerHTML = '<div class="vp-menu-note">Пока никого</div>'; return; }
        const people = await Promise.all(names.map(async n => ({ n, d: await hcData(n) })));
        railClub.innerHTML = '';
        people.sort((a, b) => (a.n === myUsername ? -1 : b.n === myUsername ? 1 : a.n.localeCompare(b.n))).forEach(({ n, d }) => {
            const row = document.createElement('div');
            row.className = 'vp-club-row';
            row.innerHTML = '<div class="vp-club-ava"></div><div class="vp-club-names"><span class="vp-club-name"></span><span class="vp-club-login"></span></div>';
            const ava = pick(d && d.avatar && (d.avatar.url || d.avatar), d && d.avatarUrl, '👤');
            const av = row.firstChild;
            if (/^https?:|^\//.test(ava)) { const img = document.createElement('img'); img.src = ava; av.appendChild(img); } else av.textContent = ava;
            row.querySelector('.vp-club-name').textContent = pick(d && d.displayName, d && d.display_name, n) + (n === myUsername ? ' (ты)' : '');
            row.querySelector('.vp-club-login').textContent = '@' + n;
            row.onclick = () => openProfile(n);
            railClub.appendChild(row);
        });
    }
    setTimeout(renderClub, 2500);
    setInterval(renderClub, 60 * 1000);

    // --- 39. Змейка из символов матрицы: клик — играть, стрелки/WASD, Esc — пауза.
    // Поле 12х12. Логика ходит шагами, а рисуем каждый кадр: змейка плавно скользит между клетками.
    // Холст — под размер на экране и плотность пикселей, иначе картинка мылилась.
    const sn = rail.querySelector('.vp-snake'), sg = sn.getContext('2d');
    sn.tabIndex = 0;
    const CELLS = 12;
    let snake = null, prev = null, dir, nextDir, food, snakeOn = false, score = 0;
    let stepMs = 170, lastStep = 0, snakeRaf = 0, snakeMsg = '', px = 0, cell = 0;
    let best = GM_getValue('vp_snake_best', 0);
    const scoreEl = rail.querySelector('.vp-snake-score');
    const showScore = () => { scoreEl.textContent = score ? `${score} · рекорд ${best}` : best ? `рекорд ${best}` : ''; };
    const rndCell = () => ({ x: Math.floor(Math.random() * CELLS), y: Math.floor(Math.random() * CELLS), ch: MATRIX_CHARS[Math.random() * MATRIX_CHARS.length | 0] });
    function snakeSize() {
        const w = sn.clientWidth || 200, dpr = devicePixelRatio || 1;
        const want = Math.round(w * dpr);
        if (sn.width !== want) { sn.width = sn.height = want; }
        px = want; cell = want / CELLS;
    }
    function snakeReset() {
        snake = [{ x: 6, y: 9 }, { x: 5, y: 9 }, { x: 4, y: 9 }];      // ниже середины — не под надписью «клик — играть»
        prev = snake.map(p => ({ ...p }));
        dir = nextDir = { x: 1, y: 0 };
        score = 0; stepMs = 170;
        do food = rndCell(); while (snake.some(p => p.x === food.x && p.y === food.y));
    }
    function snakeDraw(now = performance.now()) {
        snakeSize();
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--vp-accent').trim() || '#00ff88';
        const t = snakeOn ? Math.min(1, (now - lastStep) / stepMs) : 1;
        sg.clearRect(0, 0, px, px);
        sg.fillStyle = 'rgba(255, 255, 255, .035)';
        for (let i = 0; i < CELLS; i++) for (let j = 0; j < CELLS; j++) if ((i + j) % 2) sg.fillRect(i * cell, j * cell, cell, cell);
        sg.textAlign = 'center'; sg.textBaseline = 'middle';
        // еда — символ, который мягко пульсирует
        const pulse = 0.85 + 0.15 * Math.sin(now / 180);
        sg.shadowColor = accent; sg.shadowBlur = cell * 0.6;
        sg.fillStyle = '#fff';
        sg.font = `bold ${Math.round(cell * 0.72 * pulse)}px monospace`;
        sg.fillText(food.ch, (food.x + .5) * cell, (food.y + .5) * cell);
        // тело: скруглённые клетки с символами; позиция — между прошлой и новой клеткой
        sg.font = `bold ${Math.round(cell * 0.6)}px monospace`;
        for (let i = snake.length - 1; i >= 0; i--) {
            const a = prev[i] || snake[i], b = snake[i];
            const wrap = Math.abs(a.x - b.x) > 1 || Math.abs(a.y - b.y) > 1;       // прошёл сквозь стену — без скольжения
            const x = (wrap ? b.x : a.x + (b.x - a.x) * t) * cell, y = (wrap ? b.y : a.y + (b.y - a.y) * t) * cell;
            const k = i / Math.max(1, snake.length - 1);
            sg.globalAlpha = 1 - k * 0.55;
            sg.shadowBlur = i ? 0 : cell * 0.5;
            sg.fillStyle = i ? accent : '#fff';
            const pad = cell * (i ? 0.1 + k * 0.06 : 0.06), r = cell * 0.28;
            sg.beginPath();
            sg.roundRect(x + pad, y + pad, cell - pad * 2, cell - pad * 2, r);
            sg.fill();
            if (i) {
                sg.fillStyle = 'rgba(0, 0, 0, .55)';
                sg.fillText(MATRIX_CHARS[(b.x * 7 + b.y * 13 + i) % MATRIX_CHARS.length], x + cell / 2, y + cell / 2);
            }
        }
        sg.globalAlpha = 1; sg.shadowBlur = 0;
        if (snakeMsg) {
            sg.fillStyle = 'rgba(0, 0, 0, .55)'; sg.fillRect(0, 0, px, px);
            sg.fillStyle = '#fff'; sg.font = `600 ${Math.round(px * 0.075)}px system-ui, sans-serif`;
            snakeMsg.split('\n').forEach((line, i, all) => sg.fillText(line, px / 2, px / 2 + (i - (all.length - 1) / 2) * px * 0.11));
        }
    }
    function snakeStep() {
        dir = nextDir;
        const head = { x: (snake[0].x + dir.x + CELLS) % CELLS, y: (snake[0].y + dir.y + CELLS) % CELLS };   // сквозь стены
        if (snake.some(p => p.x === head.x && p.y === head.y)) {
            snakeOn = false;
            if (score > best) { best = score; GM_setValue('vp_snake_best', best); }
            showScore();
            snakeMsg = `Съел себя · ${score}\nклик — ещё раз`;
            snakeDraw();
            snake = null;
            return;
        }
        prev = snake.map(p => ({ ...p }));            // откуда едет каждый сегмент: голова — из старой головы, сегмент i — с места старого i
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score++;
            uiSound('click');
            stepMs = Math.max(85, 170 - score * 5);    // быстрее с каждым символом
            do food = rndCell(); while (snake.some(p => p.x === food.x && p.y === food.y));
        } else snake.pop();
        showScore();
    }
    function snakeLoop(now) {
        snakeRaf = 0;
        if (!snakeOn) return;
        while (now - lastStep >= stepMs && snakeOn) { lastStep += stepMs; snakeStep(); if (now - lastStep > stepMs * 3) lastStep = now; }
        if (snakeOn) { snakeDraw(now); snakeRaf = requestAnimationFrame(snakeLoop); }
    }
    function snakeStart() {
        if (!snake) snakeReset();
        snakeOn = true; snakeMsg = '';
        lastStep = performance.now();
        sn.focus({ preventScroll: true });
        if (!snakeRaf) snakeRaf = requestAnimationFrame(snakeLoop);
    }
    function snakePause() {
        if (!snakeOn) return;
        snakeOn = false;
        snakeMsg = 'Пауза\nклик — дальше';
        snakeDraw();
    }
    sn.addEventListener('click', () => snakeOn ? snakePause() : snakeStart());
    sn.addEventListener('blur', snakePause);
    sn.addEventListener('keydown', e => {
        const k = e.key.toLowerCase();
        const turn = { arrowup: [0, -1], w: [0, -1], ц: [0, -1], arrowdown: [0, 1], s: [0, 1], ы: [0, 1],
            arrowleft: [-1, 0], a: [-1, 0], ф: [-1, 0], arrowright: [1, 0], d: [1, 0], в: [1, 0] }[k];
        if (k === 'escape') { snakePause(); e.preventDefault(); return; }
        if (!turn) return;
        e.preventDefault();                                 // стрелки не крутят ленту, пока играешь
        if (!snakeOn) snakeStart();
        if (turn[0] !== -dir.x || turn[1] !== -dir.y) nextDir = { x: turn[0], y: turn[1] };   // не разворачиваемся в себя
    });
    new ResizeObserver(() => { if (!snakeOn) snakeDraw(); }).observe(sn);
    snakeReset();
    showScore();
    snakeMsg = 'Змейка\nклик — играть';
    snakeDraw();

    placeRail();

    console.log('🟢 ИТД X');
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})();
