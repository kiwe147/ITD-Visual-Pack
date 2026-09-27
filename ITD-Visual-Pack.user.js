// ==UserScript==
// @name         ITD Visual Pack
// @name:ru      ИТД X
// @name:en      ITD X
// @namespace    http://tampermonkey.net/
// @version      3.2.18
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
    // Только в самой вкладке: магазин ИТД — страница в рамке (iframe) с того же адреса, и в ней вторая
    // копия скрипта рисовала свою панель и фон поверх товаров. @noframes в шапке — то же для Tampermonkey.
    if (window.top !== window.self) return;
    // Счётчик FPS: кадры в секунду и самый долгий кадр за секунду (рывок). Один на весь скрипт:
    // и в админке, и в режиме «Мод выкл». Гаснет сам, когда элемент убрали со страницы.
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

    // Админка → «Мод выкл»: до закрытия вкладки скрипт не запускается вовсе, сайт — как без мода.
    // Вернуть — кнопка «Включить ИТД X» внизу страницы.
    try {
        if (sessionStorage.getItem('vp-off') === '1') {
            const back = () => {
                const b = document.createElement('button');
                b.textContent = 'Включить ИТД X';
                b.style.cssText = 'position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:2147483000;padding:10px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(20,20,24,.9);color:#fff;font:600 14px system-ui,sans-serif;cursor:pointer';
                b.onclick = () => { sessionStorage.removeItem('vp-off'); location.reload(); };
                document.body.appendChild(b);
                // счётчик FPS — чтобы сравнить сайт без мода с модом (как в админке)
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
    // Планшет в горизонтальном положении: сайт считает телефоном всё уже 1173 px и растягивает мобильную
    // вёрстку на весь экран. Если экран от 1024 до 1172 px — говорим браузеру, что ширина 1180: сайт
    // показывает компьютерную версию, браузер чуть уменьшает её под экран. Телефоны и вертикальный
    // планшет — как было. Отключается в настройках («Вид» → «Версия для ПК на планшете»).
    function tabletViewport() {
        const meta = document.querySelector('meta[name="viewport"]');
        if (!meta) return;
        if (!meta.dataset.vpOrig) meta.dataset.vpOrig = meta.getAttribute('content') || 'width=device-width, initial-scale=1.0';
        const landscape = matchMedia('(orientation: landscape)').matches;
        const w = landscape ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
        const on = GM_getValue('tabletDesktop', true) && w >= 1024 && w < 1173;
        const want = on ? 'width=1180' : meta.dataset.vpOrig;
        if (meta.getAttribute('content') !== want) meta.setAttribute('content', want);
    }
    if (document.querySelector('meta[name="viewport"]')) tabletViewport();
    else document.addEventListener('DOMContentLoaded', tabletViewport);
    addEventListener('orientationchange', () => setTimeout(tabletViewport, 50));
    matchMedia('(orientation: landscape)').addEventListener('change', tabletViewport);

    // Ошибки скрипта — в журнал для отчёта из админки (последние 30)
    const vpErrors = [];
    const logErr = (where, e) => { vpErrors.push(new Date().toTimeString().slice(0, 8) + ' ' + where + ': ' + (e && (e.message || e))); if (vpErrors.length > 30) vpErrors.shift(); };

    // Ответы сайта про профили (/api/users/<ник>) подсматриваем и запоминаем: число постов,
    // подписчиков и прочее берём из них, а не шлём свой такой же запрос второй раз.
    const siteUsers = new Map(), siteUsersWait = new Map();
    // Сайт сам берёт токен (auth/refresh) и спрашивает «кто я» (users/me) при каждой загрузке — мод
    // раньше повторял оба запроса. Теперь подхватывает ответы сайта и свой делает, только если их не было.
    const siteAuth = { token: null, at: 0, me: null, meWait: [] };
    // Номера постов: в карточке ленты ссылки на пост нет — берём из ответов сайта (лента, профиль, пост)
    // и узнаём карточку по картинке вложения или по автору и тексту
    const postIndex = { byMedia: new Map(), byUser: new Map() };
    const normText = t => String(t || '').replace(/\s+/g, ' ').trim();
    const POSTS_URL = /\/api\/posts(?:\/user\/[^/?#]+(?:\/liked)?|\/[0-9a-f-]{36})?\/?(?:[?#]|$)/;
    function keepSitePosts(body) {
        try {
            const j = typeof body === 'string' ? JSON.parse(body) : body;
            const list = (j && j.data && (j.data.posts || (j.data.id ? [j.data] : null))) || (j && j.posts) || [];
            for (const p of list) {
                if (!p || !p.id || !p.author) continue;
                (p.attachments || []).forEach(a => a && a.url && postIndex.byMedia.set(a.url, p.id));
                const user = String(p.author.username || '').toLowerCase(), text = normText(p.content);
                if (!user || !text) continue;
                const mine = postIndex.byUser.get(user) || new Map();
                mine.set(p.id, text);
                postIndex.byUser.set(user, mine);
            }
        } catch (e) { /* не JSON — не наш ответ */ }
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
                    if (url && /^get$/i.test(method) && POSTS_URL.test(url)) {
                        res.then(r => r.ok && r.clone().text().then(keepSitePosts)).catch(() => { });
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
        SPLIT: 380,                          // уход: экран делится пополам и разъезжается
        IDLE: 3000,                          // телефон: ждём касания (со звуком), потом играем сами без звука
        // редкие заставки: кинематографичная (true), «сборка», «обманка» (introPlan) — общий шанс 1%,
        // внутри — любая из трёх поровну (у каждой по трети процента)
        RARE: [[true, 0.01 / 3], ['assemble', 0.01 / 3], ['twist', 0.01 / 3]],
        RARE_HOLD: 550                       // редкая: пауза на готовом логотипе перед уходом, мс
    };
    INTRO.X = INTRO.LOCK[2] + 220;           // первый росчерк
    INTRO.EXIT = INTRO.X + INTRO.X_GAP + INTRO.X_DRAW + 380;
    // План по времени. Редкая — та же классика, но поставлена круче: «Д» летит в замедлении
    // (влетает, почти зависает, врезается), X влетает целиком и врезается, после — пауза на логотипе.
    function introPlan(rare) {
        // «Обманка»: И — как в классике, Т — как будто тоже, но отскакивает; Д в свой срок не прилетает —
        // пауза, потом падает сверху наковальней (И и Т подпрыгивают от удара); буквы подпрыгивают волной;
        // X не рисуется, а влетает сбоку сюрикеном, втыкается за словом и дрожит, как нож
        if (rare === 'twist') {
            const LOCK = [620, 1020, 1760], FLY = [520, 520, 230];
            const BOUNCE = LOCK[1] + 250, WAVE = LOCK[2] + 330, X = WAVE + 420, STICK = X + 430;
            return { LOCK, FLY, BOUNCE, WAVE, X, STICK, X_DRAW: 0, X_GAP: 0, EXIT: STICK + 480 };
        }
        // «Сборка»: буквы собираются из тысяч осколков (трещотка), X прочерчивается как обычно и крутится,
        // как вентиль сейфа — щелчками по 30°: оборот вправо, пол-оборота назад, пол-оборота вправо; клац
        if (rare === 'assemble') {
            const LOCK = [1150, 1500, 1850], ASM = 950;
            const X = LOCK[2] + 280, X_DRAW = INTRO.X_DRAW, X_GAP = INTRO.X_GAP;
            const TICKS = [];
            let t = X + X_GAP + X_DRAW + 260, a = 0;
            [[12, 1], [6, -1], [6, 1]].forEach(([n, dir]) => {
                for (let k = 0; k < n; k++) {
                    t += 28 + 40 * Math.pow(k / (n - 1), 2);          // к концу поворота — медленнее
                    a += 30 * dir;
                    TICKS.push({ t: Math.round(t), a });
                }
                t += 150;                                          // смена направления
            });
            const LOCKED = TICKS[TICKS.length - 1].t + 90;
            return { LOCK, ASM, FLY: LOCK.map(() => ASM), X, X_DRAW, X_GAP, TICKS, LOCKED, EXIT: LOCKED + 560 };
        }
        if (!rare) return { LOCK: INTRO.LOCK, FLY: INTRO.LOCK.map(() => INTRO.FLY), X: INTRO.X, X_DRAW: INTRO.X_DRAW, X_GAP: INTRO.X_GAP, EXIT: INTRO.EXIT };
        const LOCK = [620, 1020, 1960], FLY = [520, 520, 1040];
        const X = LOCK[2] + 300, X_DRAW = 300, X_GAP = 70;
        return { LOCK, FLY, X, X_DRAW, X_GAP, EXIT: X + X_GAP + X_DRAW + 380 + INTRO.RARE_HOLD };
    }

    // Звук синтезом, без файлов: свист полёта, металлический лязг стыковки, в конце — тяжёлый удар.
    // at(мс от начала ролика) → время звуковой карты.
    function introSound(ctx, at, rare) {
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
        // редкая: глубокий суббас под последним ударом и звенящий аккорд после X
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
        // мелкий металлический щелчок: осколок встал / зубец вентиля
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
            tick(at(P.BOUNCE), 0.5, 900); clank(at(P.BOUNCE + 10), false);        // Т приземлилась после отскока
            // Д: свист падения сверху (тон вниз), наковальня
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
            [0, 80, 160].forEach(d => tick(at(P.WAVE + d + 60), 0.25, 1200));  // волна: мягкие стуки
            // X: жужжание вращения (шум с «рубленой» громкостью), удар, звон дрожащего ножа
            const whir = ctx.createBufferSource(), wbp = ctx.createBiquadFilter(), wg = ctx.createGain();
            whir.buffer = noise; whir.loop = true;
            wbp.type = 'bandpass'; wbp.Q.value = 2; wbp.frequency.value = 1800;
            wg.gain.setValueAtTime(0.0001, at(P.X));
            const dur = (P.STICK - P.X) / 1000;
            for (let k = 0, n = 26; k < n; k++) {                  // лопасти: всё реже к удару
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
                // «тррррр»: щелчки всё чаще и громче к моменту, когда буква сложилась
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
            whoosh(at(P.X - 140), 0.3, true);                // X влетает целиком
        }
        [0, P.X_GAP].forEach(d => slash(at(P.X + d), P.X_DRAW / 1000));
        whoosh(at(P.EXIT - 200), 0.26);                     // створки разъезжаются
    }

    // Тема сайта для заставки: заставка стартует раньше, чем сайт ставит тему, поэтому мод запоминает
    // последнюю (siteTheme, пишет applySiteTheme); если сайт уже успел — берём его.
    function introIsLight() {
        const t = document.documentElement.getAttribute('data-theme');
        return t ? t !== 'dark' : GM_getValue('siteTheme', 'dark') === 'light';
    }
    function playIntro(mode, variant) {
        const root = document.documentElement;
        const rare = variant === true, asm = variant === 'assemble', twist = variant === 'twist';
        const light = introIsLight();
        const css = document.createElement('style');
        css.textContent = `
            /* цвета: тёмная тема — чёрный фон и белые буквы, светлая — светлый фон и тёмные буквы */
            .vpi-overlay { position: fixed; inset: 0; z-index: 2147483647; overflow: hidden; cursor: pointer;
                --vpi-bg: #000; --vpi-ink: #fff; --vpi-hole: #000; --vpi-hint: rgba(255, 255, 255, .38); }
            .vpi-overlay.vpi-light { --vpi-bg: #f5f5f5; --vpi-ink: #141414; --vpi-hole: #f5f5f5; --vpi-hint: rgba(0, 0, 0, .42); }
            /* две одинаковые половины: каждая — весь кадр, обрезанный по своей стороне; в конце разъезжаются */
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
            /* редкая: шлейф буквы — её «призраки», и неоновая волна от X */
            .vpi-ghost { position: absolute; }
            .vpi-xpulse { opacity: 0; }
            /* «сборка»: осколки букв рисуются на холсте поверх половин */
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
        const SHAKE = rare ? [5, 7, 16] : INTRO.SHAKE;          // редкая: «Д» после замедления бьёт сильнее
        // свечение букв при ударе: на тёмном — белое, на светлом — фиолетовое
        const GLOW = light ? '124,77,255' : '255,255,255';
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
            const big = rare && strong;                      // редкая: последний удар — больше искр и дальше
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
            if (twist && i === 2) return;                     // Д у «Обманки» — своя, ниже
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
            // редкая, «Д» — замедление: быстро пролетает 80% пути, медленно дрейфует уже на виду у слова,
            // потом резко врезается
            const flight = rare && i === 2 ? [
                { ...from, easing: 'cubic-bezier(.15,.7,.35,1)' },
                { transform: at(.8), opacity: 1, filter: `blur(2px) drop-shadow(0 0 12px rgba(${GLOW},.4))`, offset: hit * .3, easing: 'linear' },
                { transform: at(.88), opacity: 1, filter: `blur(0px) drop-shadow(0 0 16px rgba(${GLOW},.5))`, offset: hit * .86, easing: 'cubic-bezier(.8,0,1,.5)' },
                touch
            ] : [from, { opacity: 1, offset: hit * .25 }, touch];
            // разгон до самого касания, затем проскок чуть дальше и сжатие от удара
            playBoth([letters[0][i], letters[1][i]], [
                ...flight,
                { transform: 'none', opacity: 1, filter: `blur(0px) drop-shadow(0 0 10px rgba(${GLOW},.3))` }
            ], { delay: lock - fly, duration: fly + SETTLE });
            // редкая: шлейф — два «призрака» буквы тем же путём с запаздыванием, гаснут к удару
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
            // Т: после удара отскакивает с наклоном и приземляется второй раз
            const tb = letters[0][1].getBoundingClientRect();
            playBoth(all(1), [
                { transform: 'translateY(0) rotate(0deg)' },
                { transform: `translateY(${-tb.height * .42}px) rotate(-9deg)`, offset: .5, easing: 'cubic-bezier(.3,0,.7,1)' },
                { transform: 'translateY(0) rotate(0deg) scale(1.06, .92)', offset: .9 },
                { transform: 'translateY(0) rotate(0deg)' }
            ], { delay: LOCK[1] + 30, duration: PLAN.BOUNCE - LOCK[1] + 30, easing: 'cubic-bezier(.2,.7,.3,1)', composite: 'add', fill: 'none' });
            shake(PLAN.BOUNCE, 3);
            // Д: в свой (классический) срок — ничего; потом падает сверху наковальней
            const db = letters[0][2].getBoundingClientRect();
            playBoth(all(2), [
                // до падения — целиком за верхним краем и невидима: сюрприз не должен выглядывать
                { transform: `translateY(${-(db.bottom + db.height * 1.5)}px) scale(.94, 1.25)`, opacity: 0, filter: `blur(7px) drop-shadow(0 0 0 rgba(${GLOW},0))`, easing: 'cubic-bezier(.55,0,1,.45)' },
                { opacity: 1, offset: .04 },
                { transform: 'translateY(0) scale(1.18, .78)', opacity: 1, filter: `blur(0px) drop-shadow(0 0 40px rgba(${GLOW},1))`, offset: .55, easing: 'cubic-bezier(.2,.9,.3,1)' },
                { transform: 'translateY(-6px) scale(.97, 1.04)', opacity: 1, offset: .78 },
                { transform: 'none', opacity: 1, filter: `blur(0px) drop-shadow(0 0 10px rgba(${GLOW},.3))` }
            ], { delay: LOCK[2] - FLY[2], duration: FLY[2] / .55 });
            shake(LOCK[2], 20);
            burst(LOCK[2], db.left - wr.left + db.width / 2, db.bottom - wr.top - db.height * .15, db.height * 2.2, true);
            play(flash, [{ opacity: 0 }, { opacity: .2, offset: .1 }, { opacity: 0 }], { delay: LOCK[2], duration: 380, fill: 'none' });
            [0, 1].forEach(i => hop(i, LOCK[2] + 20, 30, 300));               // ударная волна подбрасывает И и Т
            [0, 1, 2].forEach(i => hop(i, PLAN.WAVE + i * 80, 22, 280));      // волна
            // X: сюрикен — влетает справа, вращаясь, втыкается и дрожит
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
        // X: два росчерка крест-накрест за буквами, потом вспышка свечения
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
            // камера: весь ролик медленно наезжает на слово, на ударе X — рывок вперёд и назад
            playBoth(worlds, [{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }],
                { delay: 0, duration: EXIT, easing: 'linear', composite: 'add', fill: 'forwards' });
            playBoth(worlds, [{ transform: 'scale(1)' }, { transform: 'scale(1.13)', offset: .14 }, { transform: 'scale(1)' }],
                { delay: X + X_GAP + X_DRAW * .7, duration: 560, easing: 'cubic-bezier(.2,.8,.2,1)', composite: 'add', fill: 'none' });
            // X влетает целиком: большой, повёрнутый — врезается на место, пока прочерчиваются росчерки
            playBoth(xMarks, [
                { transform: 'translate(-50%, -50%) scale(2.6) rotate(-35deg)', opacity: 0 },
                { opacity: 1, offset: .2 },
                { transform: 'translate(-50%, -50%) scale(.94) rotate(3deg)', opacity: 1, offset: .8 },
                { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 }
            ], { delay: X - 90, duration: X_DRAW + X_GAP + 150, easing: 'cubic-bezier(.3,0,.2,1)' });
            // неоновая волна: копия контура X расходится и тает
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
            ], { delay: X + X_GAP + X_DRAW, duration: 720, easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'forwards' });   // до своего момента не видна
        }

        if (asm) {
            // Осколки: пиксели букв (тот же шрифт, те же места) — тысячи квадратиков; каждый прилетает
            // со своей стороны и ложится на место к моменту, когда буква «защёлкивается»
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
                    if (t < p.t0 || t >= LOCK[p.li] + 20) continue;       // буква защёлкнулась — дальше её держит текст
                    const k = Math.min(1, (t - p.t0) / p.d), e = 1 - Math.pow(1 - k, 3);
                    const x = p.sx + (p.tx - p.sx) * e, y = p.sy + (p.ty - p.sy) * e, sz = step * (.95 + (1 - e) * 1.4);
                    g.globalAlpha = Math.min(1, k * 3);
                    if (e < .98) {
                        g.save(); g.translate(x, y); g.rotate(p.spin * (1 - e)); g.fillRect(-sz / 2, -sz / 2, sz, sz); g.restore();
                    } else g.fillRect(x - sz / 2, y - sz / 2, sz, sz);
                }
                g.globalAlpha = 1;
            };
            // холст рисует по часам анимаций (своя «пустая» анимация): так он в такт и на паузе, и при перемотке
            const clock = play(cv, [{ opacity: 1 }, { opacity: 1 }], { duration: LOCK[2] + 80, fill: 'none' });
            const frame = () => {
                if (!cv.isConnected) return;
                const t = clock.currentTime;
                if (t === null || t > LOCK[2] + 60) { cv.remove(); return; }
                draw(t);
                requestAnimationFrame(frame);
            };
            requestAnimationFrame(frame);

            // вентиль: X щёлкает по 30° (рывок за 40 мс, пауза), в конце клац — толчок, тряска, вспышка
            const T0 = PLAN.TICKS[0].t - 60, D = PLAN.LOCKED + 260 - T0;
            const rot = (a, sc = 1) => `translate(-50%, -50%) rotate(${a}deg) scale(${sc})`;
            const frames = [{ offset: 0, transform: rot(0) }];
            let prev = 0, prevT = T0;
            PLAN.TICKS.forEach(tk => {
                const move = Math.min(40, (tk.t - prevT) * .6);      // рывок короче промежутка между щелчками
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

        // Звук: браузер пускает его только после касания страницы. На компьютере обычно пускает сразу,
        // на телефоне — нет. Поэтому на телефоне заставка ждёт касания: тёмный экран, в центре «дышит»
        // маленький логотип; коснулся — ролик идёт со звуком ровно в такт. Не коснулся за IDLE мс —
        // идёт сам, без звука (как раньше): на входе никого не держим.
        let ctx = null, t0 = 0;
        function startSound() {
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
                const go = () => {
                    const base = ctx.currentTime - (performance.now() - t0) / 1000;
                    introSound(ctx, ms => Math.max(ctx.currentTime, base + ms / 1000), variant);
                };
                if (ctx.state === 'running') go();
                else ctx.resume().then(() => { if (performance.now() - t0 < 150) go(); else ctx.close(); }, () => {});
            } catch (e) { ctx = null; }
        }

        let done = false, started = false;
        const cleanup = () => {
            if (done) return;
            done = true;
            ov.remove();
            css.remove();
            root.style.overflow = prevOverflow;
            if (ctx) setTimeout(() => ctx.close().catch(() => {}), 3500);   // дать дотаять хвосту последнего удара
        };
        out.finished.then(cleanup, cleanup);
        // клик или клавиша — пропустить
        const skip = () => {
            if (done) return;
            removeEventListener('keydown', skip, true);
            if (ctx) ctx.close().catch(() => {});
            ctx = null;
            ov.animate([{ opacity: getComputedStyle(ov).opacity }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).finished.then(cleanup, cleanup);
        };
        function begin(withSound) {
            if (started) return;
            started = true;
            t0 = performance.now();
            for (const a of anims) { a.currentTime = 0; a.play(); }
            if (withSound) startSound();
            afterStart();
        }
        // Телефон, по касанию: звук выходит из динамика с задержкой (буфер вывода; в Bluetooth-наушниках
        // — до ~0,3 с), и если пустить картинку сразу, удары слышны позже, чем видны. Поэтому сначала
        // ставим звук в очередь, а картинку запускаем ровно на эту задержку позже — совпадают.
        function beginSynced() {
            // Звук подстраиваем под картинку, а не наоборот. Картинка стартует сразу; когда анимации
            // реально пошли (ready → startTime), каждый удар ставим на то время звуковой карты, которое
            // прозвучит из наушников ровно в момент кадра. Сопоставление времён даёт сам браузер
            // (getOutputTimestamp — с учётом задержки вывода, и Bluetooth тоже). Так не важно, что
            // картинка на старте может запоздать (сайт в этот момент грузится) — звук ждёт её.
            if (started) return;
            started = true;
            t0 = performance.now();
            for (const a of anims) { a.currentTime = 0; a.play(); }
            afterStart();
            let queued = false;
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
                Promise.all([ctx.resume(), anims[0].ready]).then(() => {
                    if (!ctx || done) return;
                    queued = true;
                    const start = anims[0].startTime;            // мс, та же шкала, что performance.now()
                    const toCtx = perf => {
                        const ts = ctx.getOutputTimestamp ? ctx.getOutputTimestamp() : null;
                        if (ts && ts.performanceTime > 0) return ts.contextTime + (perf - ts.performanceTime) / 1000;
                        return ctx.currentTime + (perf - performance.now()) / 1000 - (ctx.outputLatency || 0);
                    };
                    introSound(ctx, ms => Math.max(ctx.currentTime + 0.01, toCtx(start + ms)), variant);
                }, () => {});
            } catch (e) { ctx = null; }
            // звук так и не завёлся — картинка уже идёт, просто без него
            setTimeout(() => { if (!queued && ctx) { ctx.close().catch(() => {}); ctx = null; } }, 600);
        }
        function afterStart() {
            setTimeout(cleanup, EXIT + SPLIT + 2500);       // если анимации не доиграют (вкладка в фоне)
            // пропуск — не тем же касанием, что запустило ролик
            setTimeout(() => { if (done) return; ov.addEventListener('click', skip); addEventListener('keydown', skip, true); }, 400);
        }

        if (mode !== 'tap') { begin(mode === 'desk'); return anims; }

        // телефон: ждём касания
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
            if (withSound) beginSynced(); else begin(false);
        }
        // звук включается только в обработчике самого касания (pointerup/click — они дают разрешение)
        function tap(e) { e.stopPropagation(); go(true); }
        ov.addEventListener('pointerup', tap, true);
        ov.addEventListener('click', tap, true);
        return anims;
    }
    // ==== заставка:конец

    // Заставка: на компьютере — вкл/выкл (introEnabled). На телефоне — свой выбор (introMobile):
    // 'tap' — ждёт касания и играет со звуком, 'silent' — сразу без звука, 'off' — выключена.
    const IS_PHONE = matchMedia('(pointer: coarse)').matches;
    const introMode = () => IS_PHONE ? GM_getValue('introMobile', GM_getValue('introEnabled', true) ? 'tap' : 'off')
        : GM_getValue('introEnabled', true) ? 'desk' : 'off';
    if (window.top === window.self && introMode() !== 'off'
        && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // introPreview ('rare' | 'assemble') — показать вариант вместо обычной (тесты, просмотр из админки)
        const preview = GM_getValue('introPreview', '');
        // какая выпала: одно случайное число на все редкие, иначе — классика
        const pickIntro = () => { let r = Math.random(); for (const [v, p] of INTRO.RARE) { if (r < p) return v; r -= p; } return false; };
        try { playIntro(introMode(), preview ? (preview === 'rare' || preview) : pickIntro()); } catch (e) { console.warn('[ITD VP] заставка', e); }
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
            .filter(b => ['Для вас', 'Подписки', 'Лента кланов', 'Кланы', 'Посты', 'Лайки'].includes(b.textContent.trim()))
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
    const siteButtons = root => $$('button', root).filter(b => !b.classList.contains('sticker-btn') && !b.classList.contains('vp-sticker-sendbtn'));

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
    const DOM_WATCH = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true };
    let lastTick = 0;
    function domTick() {
        domQueued = false;
        lastTick = performance.now();
        domRecords(domObserver.takeRecords());
        domObserver.disconnect();                 // свои правки не должны будить наблюдателя
        try {
            tagAll(false);
            for (const fn of domHandlers) { try { fn(); } catch (e) { console.warn('[ITD VP]', fn.name || 'обработчик', e); logErr(fn.name || 'обработчик', e); } }
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
            // сайт сменил текст на месте: важно, только если это эмодзи-аватарка (карточку отдали другому
            // человеку — перекрасить); часы «5 мин.», счётчики и т.п. — не повод всё перебирать
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
            // телефон: не чаще ~20 проходов в секунду — при прокрутке ленты сайт правит страницу почти
            // каждый кадр, и полный проход на каждом отнимал кадры у самой прокрутки
            const wait = IS_PHONE ? Math.max(0, lastTick + 50 - performance.now()) : 0;
            if (wait) setTimeout(() => requestAnimationFrame(domTick), wait); else requestAnimationFrame(domTick);
        }
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
    // Логотип скрипта по умолчанию задаётся в ОДНОМ месте — строкой @icon в шапке. Tampermonkey показывает
    // его в своём списке, а мы берём его оттуда же (GM_info). Остальные иконки — вкладка «Иконка» в настройках.
    function scriptIconSrc() {
        const meta = (GM_info.scriptMetaStr || '').match(/^\/\/ @icon\s+(.+?)\s*$/m);
        return (GM_info.script && GM_info.script.icon) || (meta && meta[1]) || null;
    }

    // ================= Иконка скрипта (вкладка «Иконка» в настройках) =================
    // Выбранная ставится на вкладку браузера, в логотип на сайте и на ярлык «На главный экран».
    // Ярлыку телефон берёт PNG — рисуем её из выбранной картинки на холсте (192 px и 180 px для iOS).
    // Уже созданный ярлык сам не поменяется: его надо добавить заново.
    // Классика — строка @icon из шапки.
    const APP_ICONS = [
        // по виду рядами по 4: фирменные неоновые · тёмные с цветом · яркие · светлые · остальное
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
    // своя иконка: фон — любой из стилей ника (их цвета) или чёрный, сверху любой эмодзи.
    // Список собирается при первом обращении: стили ника объявлены ниже по файлу.
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
        // по кругу цветов от красного до розового, потом многоцветные, потом белый → серый → чёрный
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
    // первый символ так, как его видит человек: эмодзи с оттенком кожи или флаг — это несколько кодов
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
    // PNG нужного размера из любой картинки (SVG или загруженной). SVG без width/height браузер
    // растрирует в своём размере по умолчанию (300×150) и потом растягивает — ярлык выходил мыльным.
    // Поэтому SVG перед отрисовкой получает ровно нужный размер и рисуется сразу в нём.
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
        // ярлык: телефон берёт самую крупную — 512 px хватает и на 2K-экранах (иконка ~200 px)
        iconPng(src, 512).then(png => { if (png && pngFor === src) headLink('vp-icon-512', 'icon', { type: 'image/png', sizes: '512x512', href: png }); });
        iconPng(src, 192).then(png => { if (png && pngFor === src) headLink('vp-icon-192', 'icon', { type: 'image/png', sizes: '192x192', href: png }); });
        iconPng(src, 180).then(png => { if (png && pngFor === src) headLink('vp-touch-icon', 'apple-touch-icon', { sizes: '180x180', href: png }); });
    }
    function setAppIcon(id) {
        appIcon = id;
        GM_setValue('appIcon', id);
        applyAppIcon();
    }

    // Вкладка браузера: наша иконка и название «ИТД X». Сайт сам меняет
    // заголовок и иконку при переходах — следим за <head> и возвращаем своё.
    const TAB_TITLE = 'ИТД X';
    function brandTab() {
        if (document.title !== TAB_TITLE) document.title = TAB_TITLE;
        document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]').forEach(l => { if (!l.id.startsWith('vp-')) l.remove(); });
        applyAppIcon();
    }
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
            // планшет боком с монитором — версия для ПК на планшете
            'Версия для ПК на планшете': svgIcon('<rect x="2.5" y="5" width="19" height="13" rx="2"/><path d="M9 21h6"/><path d="M6 9h6M6 12h4"/>'),
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
        ZIP_PACK: svgIcon('<path d="M4 8h16v11.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5z"/><path d="M3 4.5h18V8H3z"/><path d="M10 12h4"/>', 18),
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
    // Пост, под которым хранятся паки стикеров (синхронизация между устройствами одного аккаунта).
    // Пусто — синхронизация выключена, паки живут только в этом браузере
    const STICKER_POST_ID = '92f2913c-18be-499a-bc03-97aed0947b34';   // старый пост владельца «Гань Юй», 25.02.2026
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
    let autoLikeUsers = (() => { try { return JSON.parse(GM_getValue('itd_auto_like_users', '{}')) || {}; } catch (e) { return {}; } })();
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
    // ==== автолайки
    // Кого отметили в «ИТД X» → «Лайки» (autoLikeUsers, { ник: true } в GM 'itd_auto_like_users'):
    // раз в 2–5 минут лайкаем их посты за последние сутки, которые ещё не лайкнуты.
    // Кандидаты в список — пользователи мода (из проверки значков) и NeuroSFW; их профили
    // для списка держим в localStorage 10 минут, чтобы окно открывалось без запросов.
    const AUTO_LIKE_CACHE_KEY = 'itd_auto_like_full_cache';
    const AUTO_LIKE_CACHE_TTL = 10 * 60 * 1000;
    const LIKE_INTERVAL_MIN = 2 * 60 * 1000;
    const LIKE_INTERVAL_MAX = 5 * 60 * 1000;
    const DAY = 24 * 60 * 60 * 1000;

    function saveAutoLikeUsers() {
        GM_setValue('itd_auto_like_users', JSON.stringify(autoLikeUsers));
    }

    // Список автолайков — по никам, а ник можно сменить: тогда старый ник даёт 404 (раньше — каждые
    // 2–5 минут, бесконечно). Номер аккаунта каждого запоминаем (из данных галочек); ник пропал —
    // ищем по номеру новый и переносим отметку; не нашли — до перезагрузки этот ник не трогаем.
    const autoLikeIds = JSON.parse(GM_getValue('itd_auto_like_ids', '{}') || '{}');
    const autoLikeGone = new Set();
    function rememberAutoLikeId(username) {
        const id = (verifiedInfo(username) || {}).id;
        if (id && autoLikeIds[username] !== id) { autoLikeIds[username] = id; GM_setValue('itd_auto_like_ids', JSON.stringify(autoLikeIds)); }
    }
    function renamedAutoLike(username) {
        const id = autoLikeIds[username];
        if (!id) return null;
        let all = {};
        try { all = JSON.parse(localStorage.getItem(VERIFICATION_STORAGE_KEY) || '{}') || {}; } catch (e) { }
        const now = Object.keys(all).find(n => all[n] && all[n].id === id && n !== username);
        if (!now) return null;
        autoLikeUsers[now] = true;
        delete autoLikeUsers[username];
        autoLikeIds[now] = id;
        delete autoLikeIds[username];
        saveAutoLikeUsers();
        GM_setValue('itd_auto_like_ids', JSON.stringify(autoLikeIds));
        return now;
    }
    // лайкнуть посты пользователя за последние сутки, которые ещё не лайкнуты
    async function likePostsForUser(username) {
        if (autoLikeGone.has(username)) return;
        rememberAutoLikeId(username);
        try {
            const res = await api(`/api/posts/user/${username}?limit=7`);
            if (res.status === 404) {
                const now = renamedAutoLike(username);
                if (now) return likePostsForUser(now);
                autoLikeGone.add(username);
                return;
            }
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
                if (like.ok) await new Promise(r => setTimeout(r, 300));   // не частить: лайки одного — через паузу
            }
        } catch (e) { console.warn('[ITD VP] автолайк', e); logErr('автолайк', e); }
    }

    // следующий проход — через случайные 2–5 минут после конца прошлого
    function scheduleAutoLike() {
        const delay = LIKE_INTERVAL_MIN + Math.floor(Math.random() * (LIKE_INTERVAL_MAX - LIKE_INTERVAL_MIN + 1));
        setTimeout(async () => {
            try {
                const users = Object.keys(autoLikeUsers).filter(u => autoLikeUsers[u] === true);
                if (autoLikeEnabled && users.length) await Promise.all(users.map(likePostsForUser));
            } finally { scheduleAutoLike(); }
        }, delay);
    }

    // профили кандидатов для списка в окне: { ник: профиль }
    async function fetchAutoLikeUsers() {
        try {
            const c = JSON.parse(localStorage.getItem(AUTO_LIKE_CACHE_KEY) || 'null');
            if (c && Date.now() - c.timestamp <= AUTO_LIKE_CACHE_TTL) return c.usersData;
        } catch (e) { /* битый кеш — просто спросим заново */ }

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
    // вкладка браузера и иконка — здесь, после стилей ника: своя иконка берёт фон из них
    brandTab();
    new MutationObserver(brandTab).observe(document.head, { childList: true, subtree: true, characterData: true });

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
        .vp-pill-btn svg:not([width]) { width: 20px !important; height: 20px !important; }
        .vp-pill-btn svg:not([fill]) { fill: none !important; }
        .vp-menu-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--text-primary, currentColor); }
        .vp-menu-note { padding: 20px; text-align: center; color: var(--text-secondary); }
        .vp-setting-label { display: flex; align-items: center; gap: 8px; }
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
        html.vp-light .settings-dropdown { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important; }
        .nick-style-option:not(:last-child) {
            margin-bottom: 2px !important;
        }
        .settings-dropdown.vp-logo-menu { min-width: 170px !important; padding: 6px !important; }
        .settings-dropdown.vp-logo-menu .vp-opt-icon { display: inline-flex; width: 20px; justify-content: center; }
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
        /* вкладки ленты рядом с логотипом: в одну строку, «Лента кланов» не переносится (иначе капсула толстеет) */
        .vp-feed-bar .vp-tabs button { white-space: nowrap !important; }
        /* админ-островок */
        .vp-fab { position: fixed; z-index: 2147483000; width: 48px; height: 48px; touch-action: none; }
        .vp-fab.vp-snap { transition: left .28s cubic-bezier(.3, .8, .3, 1), top .28s cubic-bezier(.3, .8, .3, 1); }
        .vp-fab-btn { width: 48px; height: 48px; border-radius: 50%; border: 1px solid rgba(255, 255, 255, .16); padding: 0; cursor: pointer;
            display: flex; align-items: center; justify-content: center; color: #fff; touch-action: none;
            background: rgba(24, 24, 28, .72); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, .45); transition: opacity .3s, transform .15s; }
        .vp-fab-btn:active { transform: scale(.92); }
        .vp-fab.vp-idle:not(.vp-open) .vp-fab-btn { opacity: .45; }
        .vp-fab-menu { position: absolute; top: 50%; right: 56px; transform: translateY(-50%) scale(.9); transform-origin: right center;
            opacity: 0; pointer-events: none; transition: opacity .18s, transform .18s; padding: 6px; border-radius: 20px;
            background: rgba(24, 24, 28, .86); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
            border: 1px solid rgba(255, 255, 255, .12); box-shadow: 0 8px 24px rgba(0, 0, 0, .45); }
        .vp-fab.vp-left .vp-fab-menu { right: auto; left: 56px; transform-origin: left center; }
        .vp-fab.vp-open .vp-fab-menu { opacity: 1; pointer-events: auto; transform: translateY(-50%) scale(1); }
        .vp-fab-menu button { display: flex; align-items: center; gap: 10px; white-space: nowrap; border: 0; background: none; color: #fff;
            font: inherit; font-size: 14px; padding: 10px 14px; border-radius: 14px; cursor: pointer; }
        .vp-fab-menu button:active { background: rgba(255, 255, 255, .1); }
        .vp-fab svg { flex: 0 0 auto; width: 20px !important; height: 20px !important; }
        .vp-fab-btn img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; pointer-events: none; }
        .vp-fab-btn:has(img) { overflow: hidden; padding: 0; }
        .vp-admin-toast { position: fixed; left: 50%; bottom: 120px; transform: translateX(-50%); z-index: 2147483001; padding: 10px 16px; border-radius: 999px;
            background: rgba(20, 20, 24, .92); color: #fff; font: 500 14px system-ui, sans-serif; border: 1px solid rgba(255, 255, 255, .14); pointer-events: none; }
        .vp-fps { position: fixed; left: 8px; top: 8px; z-index: 2147483001; padding: 4px 8px; border-radius: 8px; pointer-events: none;
            background: rgba(0, 0, 0, .75); color: #6f6; font: 600 12px ui-monospace, monospace; }
        .vp-fps[data-bad="1"] { color: #ff6b6b; }
        .vp-admin-panel { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2147483001; width: min(340px, calc(100vw - 24px));
            max-height: 70vh; display: flex; flex-direction: column; border-radius: 20px; overflow: hidden; color: #fff; font: 13px system-ui, sans-serif;
            background: rgba(20, 20, 24, .96); border: 1px solid rgba(255, 255, 255, .14); box-shadow: 0 16px 40px rgba(0, 0, 0, .5); }
        .vp-admin-head { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid rgba(255, 255, 255, .1); }
        .vp-admin-head b { font-size: 15px; } .vp-admin-head span { color: rgba(255, 255, 255, .5); margin-right: auto; }
        .vp-admin-head button { border: 0; background: none; color: #fff; font-size: 22px; line-height: 1; cursor: pointer; padding: 0 4px; }
        .vp-admin-list { overflow-y: auto; padding: 6px 14px 10px; }
        .vp-admin-list div { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(255, 255, 255, .05); }
        .vp-admin-list .vp-miss { color: #ff8a8a; }
        .vp-fab-a { font: 800 21px/1 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; letter-spacing: -.02em; }
        /* профиль на телефоне: без палочки между «подписчиков» и «подписок» */
        @media (max-width: 1172px) { [data-vp-posts] > hr { display: none !important; } }
        /* репост в подкрашенной карточке — полупрозрачный, цвет карточки просвечивает */
        .vp-emoji-tint .vp-soft-bg, .itd-blur-active .vp-soft-bg { background-color: rgba(0, 0, 0, .22) !important; }
        html.vp-light .vp-emoji-tint .vp-soft-bg, html.vp-light .itd-blur-active .vp-soft-bg { background-color: rgba(255, 255, 255, .35) !important; }
        /* длинный ник в шапке поста не налезает на время: обрезается многоточием (значки — после, не режутся) */
        /* то же в списках «Подписчики»/«Подписки» и везде, где ник в строке (кроме крупного ника профиля) */
        .vp-nick-row > a { min-width: 0; overflow: hidden; }
        .vp-nick-row .vp-nick:not(.vp-nick-large *) { min-width: 0; max-width: 100%; }
        .vp-nick-row .vp-nick-text:not(.vp-nick-large *) { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 0 1 auto; }
        article .vp-nick-row time { flex-shrink: 0; }
        /* свёрнутый длинный пост: низ текста тает сам, без полосы цвета обычной карточки */
        .vp-clamp::after { display: none !important; }
        .vp-clamp { -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 60px), transparent); mask-image: linear-gradient(to bottom, #000 calc(100% - 60px), transparent); }
        /* кнопки на баннере — «шторка»: плашка свисает с верхнего края по центру (снизу закрывает аватарка);
           на компьютере выезжает при наведении на баннер, на телефоне видна всегда */
        .vp-banner-buttons { inset: 0 auto auto 50% !important; width: auto !important; height: auto !important;
            transform: translateX(-50%); display: flex !important; gap: 2px !important; padding: 4px 12px 7px !important;
            border-radius: 0 0 22px 22px; background: rgba(12, 12, 16, .6); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
            z-index: 3; transition: transform .25s cubic-bezier(.2,.8,.2,1), opacity .2s; }
        html.vp-light .vp-banner-buttons { background: rgba(255, 255, 255, .65); }
        .vp-banner-buttons > button { background: transparent !important; box-shadow: none !important; }
        .vp-banner-buttons > button:hover { background: rgba(128, 128, 128, .22) !important; }
        @media (hover: hover) and (pointer: fine) {
            .vp-banner-buttons:not(.vp-banner-editing) { opacity: 0; transform: translate(-50%, -100%); }
            .vp-banner:hover .vp-banner-buttons, .vp-banner-buttons:focus-within { opacity: 1; transform: translateX(-50%); }
        }
        /* заставка на телефоне: три варианта */
        .toggle-switch.vp-tri { width: 58px !important; }
        .toggle-switch.vp-tri[data-s="1"]::after { left: 20px !important; }
        /* синяя часть — отдельная капсула под ручкой: доходит до ручки и прячет конец за ней,
           поэтому в «Вкл» справа тёмное без резкого среза; между положениями плавно растёт */
        .toggle-switch.vp-tri { background: rgba(0, 0, 0, 0.5) !important; }
        .toggle-switch.vp-tri::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 22px; border-radius: 11px;
            background: var(--accent-primary, #0080FF); opacity: 0; transition: width .2s ease, opacity .2s ease; }
        .toggle-switch.vp-tri[data-s="1"]::before { width: 40px; opacity: 1; }
        .toggle-switch.vp-tri[data-s="2"]::before { width: 58px; opacity: 1; }
        .toggle-switch.vp-tri[data-s="2"]::after { left: 38px !important;
            background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230080ff' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 9.5v5h3.5L12 18.5V5.5L7.5 9.5z'/%3E%3Cpath d='M16 9a4 4 0 0 1 0 6'/%3E%3C/svg%3E") center / 12px no-repeat !important; }
        .vp-tri-text { display: flex; flex-direction: column; gap: 1px; }
        .vp-tri-text small { font-size: 11.5px; color: var(--text-secondary, rgba(255, 255, 255, .5)); }
        /* кнопка «ИТД X» вместо «ИТД НУКСТА» */
        .vp-nuksta-hidden { display: none !important; }
        .vp-sec-title { font-size: 12px; font-weight: 600; letter-spacing: .02em; color: var(--text-secondary, rgba(255, 255, 255, .55));
            margin: 12px 12px 6px; }
        .vp-like-inline { max-height: none !important; }
        /* настройки по вкладкам */
        .vp-settings-tabs { width: 320px !important; max-width: calc(100vw - 16px) !important; box-sizing: border-box !important;
            max-height: calc(100dvh - 16px); display: flex !important; flex-direction: column; overflow: hidden !important; }
        /* вкладки стоят на месте, прокручивается только содержимое */
        .vp-settings-tabs .vp-stabs { flex: 0 0 auto; }
        .vp-tab-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none;
            touch-action: pan-y; -webkit-overflow-scrolling: touch; margin: 0 -12px -12px; padding: 0 12px 12px; }
        .vp-tab-body::-webkit-scrollbar { display: none; }
        /* стили ника и фона — сеткой в два столбца */
        /* заполняется по столбцам: сверху вниз, потом следующий — соседние цвета стоят друг под другом */
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
            padding: 7px 2px; white-space: nowrap; border-radius: 13px; color: var(--text-secondary, rgba(255, 255, 255, .6)); transition: background .15s ease, color .15s ease; }
        .vp-stab:hover { color: var(--text-primary, #fff); }
        .vp-stab.vp-active { color: var(--text-primary, #fff); font-weight: 600;
            background: color-mix(in srgb, var(--vp-accent, #0080ff) 22%, transparent);
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent, #0080ff) 45%, transparent); }
        .vp-icon-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .vp-icon-tile { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; padding: 6px 2px 5px;
            border: 0; border-radius: 14px; background: none; cursor: pointer; font: inherit; color: var(--text-secondary, rgba(255, 255, 255, .6)); }
        .vp-icon-tile img { width: 44px; height: 44px; border-radius: 11px; display: block; }
        .vp-icon-tile span { font-size: 10.5px; line-height: 1.15; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-icon-tile:hover { background: var(--bg-hover, rgba(0, 128, 255, 0.15)); }
        .vp-icon-tile.vp-active { color: var(--text-primary, #fff);
            background: color-mix(in srgb, var(--vp-accent, #0080ff) 16%, transparent);
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent, #0080ff) 45%, transparent); }
        .vp-icon-own { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.1)); }
        .vp-icon-own-title { font-size: 13px; font-weight: 600; color: var(--text-primary, #fff); margin: 0 4px 8px; }
        .vp-icon-own-row { display: flex; align-items: center; gap: 10px; padding: 0 4px; }
        .vp-icon-emoji { width: 44px; height: 44px; flex: 0 0 44px; box-sizing: border-box; text-align: center; font-size: 24px; padding: 0;
            border-radius: 12px; border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15)); outline: none;
            background: color-mix(in srgb, var(--text-primary, #fff) 6%, transparent); color: var(--text-primary, #fff); }
        .vp-icon-emoji:focus { border-color: var(--vp-accent, #0080ff); }
        .vp-icon-bgs { display: flex; flex-wrap: wrap; gap: 5px; }
        .vp-icon-bg { width: 20px; height: 20px; border-radius: 50%; border: 0; padding: 0; cursor: pointer;
            box-shadow: inset 0 0 0 1px rgba(127, 127, 127, .35); }
        .vp-icon-bg.vp-active { box-shadow: 0 0 0 2px var(--block-bg, #1e1e2e), 0 0 0 4px var(--vp-accent, #0080ff); }
        .vp-icon-upload { width: 100%; margin-top: 12px; padding: 10px 12px; border-radius: 16px; cursor: pointer; font: inherit; font-size: 14px;
            border: 1px dashed var(--border-color, rgba(255, 255, 255, 0.2)); background: none; color: var(--text-primary, #fff); }
        .vp-icon-upload:hover { background: var(--bg-hover, rgba(0, 128, 255, 0.15)); }
        .vp-icon-note { font-size: 11.5px; line-height: 1.35; margin: 8px 4px 2px; color: var(--text-secondary, rgba(255, 255, 255, .5)); }
    `;
    document.head.appendChild(globalStyles);

    // ================= Фоны (выбираются в таблетке у ника) =================
    // Рисуются в цвете стиля ника (у радуги — бегущим оттенком) на полупрозрачном слое под сайтом.
    // Кадр — в frame() (частота экрана, не чаще ~60 в секунду); скорости заданы на 50 мс (dt),
    // от частоты кадров не зависят. Свечение — заранее нарисованные спрайты, а не shadowBlur:
    // тот считался бы каждый кадр. Прозрачность слоя у каждого фона своя (opacity в BACKGROUNDS).
    const styleBgCanvas = document.createElement('style');
    styleBgCanvas.textContent = `
        .vp-bg-canvas {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;
            opacity: 0.2; pointer-events: none; transition: opacity .4s ease;
        }
        .vp-bg-canvas.vp-bg-off { display: none; }
    `;
    document.head.appendChild(styleBgCanvas);
    const canvas = document.createElement('canvas');
    canvas.className = 'vp-bg-canvas';
    document.body.appendChild(canvas);
    // Свой фон: картинка или видео пользователя. Файл большой — хранится в IndexedDB этого браузера
    // (в настройки Tampermonkey не влезет). Видео — без звука, по кругу. Слой — там же, где холст,
    // чуть притушен, чтобы текст читался (в светлой теме — светлее).
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
    async function bgFile(blob) {                       // без аргумента — прочитать, с ним — сохранить
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
        const fresh = !!blob;                            // только что выбран (а не прочитан из памяти)
        if (!blob) blob = await bgFile().catch(() => null);
        if (bgMediaUrl) URL.revokeObjectURL(bgMediaUrl);
        bgMediaUrl = blob ? URL.createObjectURL(blob) : '';
        bgMedia.replaceChildren();
        if (!blob) return;
        if (/^video\//.test(blob.type)) {
            const v = document.createElement('video');
            Object.assign(v, { src: bgMediaUrl, muted: true, loop: true, autoplay: true, playsInline: true });
            v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
            // формат, который браузер не играет (старый mp4, HEVC…) — сказать, а не молча показать чёрное
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
    // выбрать файл для своего фона: картинка или видео до 150 МБ
    function pickBgFile(done) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*';
        input.onchange = async () => {
            const f = input.files[0];
            if (!f) return;
            if (f.size > 150 * 1024 * 1024) { alert('Файл больше 150 МБ — возьми поменьше'); return; }
            try { await bgFile(f); } catch (e) { alert('Не вышло сохранить файл: ' + (e && e.message || e)); return; }
            backgroundStyle = 'custom';
            GM_setValue('backgroundStyle', 'custom');
            await showBgMedia(f);
            updateBackgroundVisibility();
            if (done) done();
        };
        input.click();
    }
    // выключатель «Фон»: холст прячем, кадры фона не рисуются (frame смотрит backgroundEnabled);
    // свой фон — вместо холста слой с картинкой/видео
    function updateBackgroundVisibility() {
        const custom = backgroundStyle === 'custom';
        canvas.classList.toggle('vp-bg-off', !backgroundEnabled || custom);
        bgMedia.classList.toggle('vp-bg-off', !backgroundEnabled || !custom);
        const v = bgMedia.querySelector('video');
        if (v) { if (backgroundEnabled && custom) v.play().catch(() => { }); else v.pause(); }
        if (backgroundEnabled && custom && !bgMedia.firstChild) showBgMedia();
    }
    updateBackgroundVisibility();
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
        if (backgroundStyle === 'custom') return;          // свой фон — картинка/видео, холст не рисуем
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
        // подсветка поста при наведении — та же обводка ярче (в postDesignStyle), цвет стиля не нужен
        post.cssText = '';
        document.documentElement.classList.toggle('vp-post-hl', postBorderEnabled);

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
        rememberSiteTheme();
        paint();
    }
    // заставка следующего входа возьмёт цвета темы отсюда (она стартует раньше, чем сайт ставит тему)
    function rememberSiteTheme() {
        const t = document.documentElement.getAttribute('data-theme');
        if (t && GM_getValue('siteTheme', '') !== (t === 'dark' ? 'dark' : 'light')) GM_setValue('siteTheme', t === 'dark' ? 'dark' : 'light');
    }
    rememberSiteTheme();
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

    // Кнопка «назад» на телефоне закрывает открытое меню, а не уводит со страницы: при открытии
    // кладём в историю запись с тем же адресом, «назад» снимает её. Закрыли меню сами — снимаем её тоже.
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
        // окно настроек ИТД X — под кнопкой по центру; не влезает вниз — прижимаем к низу экрана
        if (popup.el.classList.contains('vp-settings-tabs')) {
            const cx = innerWidth < 600 ? innerWidth / 2 : r.left + r.width / 2;          // на телефоне — по центру экрана
            popup.el.style.left = Math.max(8, Math.min(cx - w / 2, innerWidth - w - 8)) + 'px';
            // видимая высота: на телефоне панель браузера перекрывает низ окна, innerHeight её не учитывает
            const vh = window.visualViewport ? Math.min(innerHeight, visualViewport.height) : innerHeight;
            // высота окна одна на все вкладки — при переключении окно не прыгает; лишнее прокручивается внутри
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
        closePopup(!same);                              // меню сменилось на другое — запись в истории та же
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

    // --- Иконка ИТД X в углу: не сразу в ТГ, а мини-меню «ТГК» / «Донат». Ссылка у иконки остаётся
    // (по ней скрипт узнаёт свой логотип), нажатие перехватываем
    const LOGO_LINKS = [
        ['ТГК', 'https://t.me/NeuroSFW', '<path d="M21 4 3 11l6 2m12-9-3 16-9-7m12-9L9 13m0 0v6l3-4"/>'],
        ['Донат', 'https://donatex.gg/donate/kiwe147', '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>']
    ];
    document.addEventListener('click', e => {
        const a = e.target.closest && e.target.closest('a[href="https://t.me/NeuroSFW"]');
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
    // --- стиль фона
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
    // --- автолайки: список тех, кого лайкать
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
            };
            list.appendChild(row);
        }
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
            document.querySelectorAll('[data-blur-bg]').forEach(dropBlur);
        }
        colorizePosts();
    }
    // label совпадает с ключом ICONS.settings — оттуда значок пункта
    const SETTINGS = [
        { label: 'Фон', get: () => backgroundEnabled, set: v => { backgroundEnabled = v; updateBackgroundVisibility(); }, key: 'backgroundEnabled' },
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
        { label: 'Сцена ленты', get: () => sceneEnabled, set: v => { sceneEnabled = v; document.documentElement.classList.toggle('vp-scene', v); sceneKick(); }, key: 'sceneEnabled' },
        { label: 'Свечение видео', get: () => ambientEnabled, set: v => { ambientEnabled = v; applyAmbient(); }, key: 'ambientEnabled' },
        { label: 'Боковая панель', get: () => railEnabled, set: v => { railEnabled = v; placeRail(); }, key: 'railEnabled' },
        { label: 'Версия для ПК на планшете', get: () => GM_getValue('tabletDesktop', true), set: () => tabletViewport(), key: 'tabletDesktop' }
    ];
    // Все настройки ИТД X — одно окно по вкладкам (кнопка «ИТД X» в шапке профиля).
    // Последняя открытая вкладка запоминается.
    const SETTINGS_TABS = [
        { id: 'nick', name: 'Ник', items: ['Подсветка ника', 'Подсветка аватарок', 'Подсветка постов'] },
        { id: 'bg', name: 'Фон', items: ['Фон'] },
        { id: 'look', name: 'Вид', items: ['Стекло', 'Сцена ленты', 'Свечение видео', 'Размытый фон постов', 'Боковая панель', 'Версия для ПК на планшете'] },
        { id: 'likes', name: 'Лайки', items: ['Автолайки'] },
        { id: 'misc', name: 'Ещё', items: ['Анти цензура', 'Звуки интерфейса', 'Заставка при входе'] },
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
    // Заставка на телефоне — такой же переключатель, как остальные, но на три положения:
    // Выкл → Вкл (без звука) → Вкл + звук. Тап по строке — следующее положение.
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
    const secTitle = (text) => {
        const t = document.createElement('div');
        t.className = 'vp-sec-title';
        t.textContent = text;
        return t;
    };
    // пункт списка (стиль ника, фон): выбор не закрывает окно — вкладка перерисовывается с новой галочкой
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
            const keep = body.dataset.tab === id ? body.scrollTop : 0;   // перерисовка той же вкладки — прокрутка на месте
            body.dataset.tab = id;
            body.textContent = '';
            const redraw = () => show(id);
            const tab = SETTINGS_TABS.find(t => t.id === id);
            if (id === 'icon') body.appendChild(iconPicker());
            else for (const label of tab.items) {
                // на телефоне у заставки три варианта вместо переключателя
                if (label === 'Заставка при входе' && IS_PHONE) { body.appendChild(introModeRow()); continue; }
                body.appendChild(settingRow(SETTINGS.find(o => o.label === label), id === 'bg' ? redraw : null));
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
                            // свой фон: файла ещё нет — сразу выбрать; есть — просто включить
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
        // палец внутри окна крутит окно: не отдаём касания сайту (он может гасить прокрутку)
        for (const t of ['touchstart', 'touchmove']) menu.addEventListener(t, e => e.stopPropagation(), { passive: true });
        show(current);
        openPopup(btn, menu);
    }

    // Вкладка «Иконка»: готовые, своя (фон + эмодзи) и своя картинка
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

        // своя: эмодзи + фон
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

        // своя картинка: обрезаем по центру в квадрат 512 px и храним у себя (в настройках скрипта)
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
                    const side = Math.min(512, s);                   // мелкую не раздуваем
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
    const ADMINS = ['neurosfw'];
    function adminToast(text) {
        const t = document.createElement('div');
        t.className = 'vp-admin-toast';
        t.textContent = text;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2600);
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
    function diagRows() {
        tagAll();
        return ROLE_ORDER.map(r => [r, roleCount[r] || 0]);
    }
    // Отчёт: версия, браузер, экран, страница, настройки мода, что нашлось на странице и ошибки
    function adminReport() {
        const found = diagRows(), missing = found.filter(([, n]) => !n).map(([r]) => r);
        const opts = SETTINGS.map(o => (o.get() ? '+' : '-') + o.label).join(', ');
        return [
            `ИТД X ${GM_info.script.version} · ${new Date().toISOString()}`,
            `Страница: ${location.pathname} · тема ${document.documentElement.getAttribute('data-theme') || '?'}`,
            `Экран: ${innerWidth}×${innerHeight} @${devicePixelRatio} · ${IS_PHONE ? 'телефон' : 'компьютер'}`,
            `Браузер: ${navigator.userAgent}`,
            `Стиль ника: ${currentStyle} · фон: ${backgroundStyle} · иконка: ${appIcon}`,
            `Настройки: ${opts}`,
            `Не нашлось на странице: ${missing.join(', ') || '—'}`,
            `Найдено: ${found.filter(([, n]) => n).map(([r, n]) => r + ' ' + n).join(', ')}`,
            `Ошибки (${vpErrors.length}):` + (vpErrors.length ? '\n' + vpErrors.join('\n') : ' нет')
        ].join('\n');
    }
    // Диагностика: какие части сайта скрипт узнал на этой странице, а какие — нет
    function adminDiag() {
        document.querySelectorAll('.vp-admin-panel').forEach(p => p.remove());
        const rows = diagRows();
        const box = document.createElement('div');
        box.className = 'vp-admin-panel';
        const miss = rows.filter(([, n]) => !n).length;
        box.innerHTML = `<div class="vp-admin-head"><b>Диагностика</b><span>${miss ? 'не нашлось: ' + miss : 'всё на месте'}</span><button type="button" aria-label="Закрыть">×</button></div><div class="vp-admin-list"></div>`;
        const list = box.querySelector('.vp-admin-list');
        rows.sort((a, b) => (a[1] ? 1 : 0) - (b[1] ? 1 : 0)).forEach(([r, n]) => {
            const d = document.createElement('div');
            d.className = n ? '' : 'vp-miss';
            d.innerHTML = '<span></span><b></b>';
            d.firstChild.textContent = r; d.lastChild.textContent = n || '—';
            list.appendChild(d);
        });
        box.querySelector('button').onclick = () => box.remove();
        document.body.appendChild(box);
    }
    // Счётчик FPS: кадры в секунду и самый долгий кадр за секунду (рывок)
    let fpsBox = null;
    function toggleFps() {
        if (fpsBox) { fpsBox.remove(); fpsBox = null; return; }
        fpsBox = document.createElement('div');
        fpsBox.className = 'vp-fps';
        document.body.appendChild(fpsBox);
        fpsMeter(fpsBox);
    }

    function fabFace() {
        const face = GM_getValue('fabFace', '');
        return face ? `<img src="${face.replace(/"/g, '')}" alt="">` : '<span class="vp-fab-a">A</span>';
    }

    // Админ-островок (только у админа, и на телефоне, и на компьютере): круглая кнопка поверх всего, её можно таскать —
    // отпустил, она прилипает к ближайшему краю (как плавающая кнопка на Samsung). Тап — меню.
    // Пока в меню одно — снимок страницы. Место запоминается.
    function adminFab() {
        if (document.querySelector('.vp-fab') || !myUsername || !ADMINS.includes(myUsername.toLowerCase())) return;
        const fab = document.createElement('div');
        fab.className = 'vp-fab';
        fab.innerHTML = `<button type="button" class="vp-fab-btn" aria-label="Админка">${fabFace()}</button>
            <div class="vp-fab-menu"><button type="button" data-act="snap">${svgIcon('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', 18)}<span>Снимок для Claude</span></button>
                <button type="button" data-act="report">${svgIcon('<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 4.5V3h6v1.5M9 10h6M9 14h4"/>', 18)}<span>Скопировать отчёт</span></button>
                <button type="button" data-act="diag">${svgIcon('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4M8.5 11l1.8 1.8 3.4-3.6"/>', 18)}<span>Диагностика</span></button>
                <button type="button" data-act="rare">${svgIcon('<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6L12 16.4 6.6 19.4l1.3-6L3.4 9.3l6-.7z"/>', 18)}<span>Редкая заставка</span></button>
                <button type="button" data-act="assemble">${svgIcon('<path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z"/>', 18)}<span>Заставка «сборка»</span></button>
                <button type="button" data-act="twist">${svgIcon('<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>', 18)}<span>Заставка «обманка»</span></button>
                <button type="button" data-act="fps">${svgIcon('<path d="M3 17l5-6 4 3 5-7 4 4"/>', 18)}<span>Счётчик FPS</span></button>
                <button type="button" data-act="face">${svgIcon('<rect x="4" y="4" width="16" height="16" rx="8"/><path d="M8 15l2.5-3 2 2 1.5-2 2 3"/>', 18)}<span>Своя картинка кнопки</span></button>
                <button type="button" data-act="off">${svgIcon('<path d="M12 3v8"/><path d="M6.3 7a8 8 0 1 0 11.4 0"/>', 18)}<span>Мод выкл (до закрытия вкладки)</span></button></div>`;
        document.body.appendChild(fab);
        const btn = fab.firstElementChild, SIZE = 48, M = 8;
        const pos = GM_getValue('adminFabPos', { side: 'right', y: 0.6 });
        const place = (x, y) => { fab.style.left = x + 'px'; fab.style.top = y + 'px'; };
        const snap = () => {
            const y = Math.max(M, Math.min(innerHeight - SIZE - M, pos.y * innerHeight));
            fab.classList.toggle('vp-left', pos.side === 'left');
            fab.classList.add('vp-snap');
            place(pos.side === 'left' ? M : innerWidth - SIZE - M, y);
        };
        snap();
        addEventListener('resize', snap);
        let start = null, moved = false, idleT = 0;
        const wake = () => { fab.classList.remove('vp-idle'); clearTimeout(idleT); idleT = setTimeout(() => fab.classList.add('vp-idle'), 2500); };
        wake();
        btn.addEventListener('pointerdown', e => {
            start = { x: e.clientX, y: e.clientY, l: fab.offsetLeft, t: fab.offsetTop };
            moved = false;
            btn.setPointerCapture(e.pointerId);
            wake();
        });
        btn.addEventListener('pointermove', e => {
            if (!start) return;
            const dx = e.clientX - start.x, dy = e.clientY - start.y;
            if (!moved && Math.hypot(dx, dy) < 6) return;
            if (!moved) { moved = true; fab.classList.remove('vp-snap', 'vp-open'); }
            place(Math.max(0, Math.min(innerWidth - SIZE, start.l + dx)), Math.max(0, Math.min(innerHeight - SIZE, start.t + dy)));
        });
        const up = () => {
            if (!start) return;
            start = null;
            if (moved) {
                pos.side = fab.offsetLeft + SIZE / 2 < innerWidth / 2 ? 'left' : 'right';
                pos.y = fab.offsetTop / innerHeight;
                GM_setValue('adminFabPos', { side: pos.side, y: pos.y });
                snap();
            } else {
                fab.classList.toggle('vp-open');
                // меню по центру кнопки, но не за краем экрана (кнопка у верха или низа)
                const menu = fab.querySelector('.vp-fab-menu'), h = menu.offsetHeight, c = fab.offsetTop + SIZE / 2;
                const shift = Math.max(8 - (c - h / 2), Math.min(0, innerHeight - 8 - (c + h / 2)));
                menu.style.marginTop = shift + 'px';
            }
            wake();
        };
        btn.addEventListener('pointerup', up);
        btn.addEventListener('pointercancel', up);
        btn.addEventListener('click', e => e.stopPropagation());
        const act = (name, fn) => fab.querySelector(`[data-act="${name}"]`).addEventListener('click', e => { e.stopPropagation(); fab.classList.remove('vp-open'); fn(); });
        act('snap', () => setTimeout(pageSnapshot, 200));
        act('report', () => copyText(adminReport()).then(ok => adminToast(ok ? 'Отчёт скопирован — вставь его Claude' : 'Не вышло скопировать')));
        act('diag', adminDiag);
        act('fps', toggleFps);
        act('rare', () => playIntro(IS_PHONE ? 'silent' : 'desk', true));
        act('assemble', () => playIntro(IS_PHONE ? 'silent' : 'desk', 'assemble'));
        act('twist', () => playIntro(IS_PHONE ? 'silent' : 'desk', 'twist'));
        // своя картинка кнопки — хранится только у тебя (в настройках скрипта), 96 px; пустой выбор — вернуть «A»
        act('face', () => {
            if (GM_getValue('fabFace', '') && confirm('Вернуть обычную «A»? (Отмена — выбрать другую картинку)')) {
                GM_setValue('fabFace', ''); btn.innerHTML = fabFace(); return;
            }
            const f = document.createElement('input');
            f.type = 'file'; f.accept = 'image/*';
            f.onchange = () => {
                const file = f.files && f.files[0];
                if (!file) return;
                const url = URL.createObjectURL(file), img = new Image();
                img.onload = () => {
                    const sd = Math.min(img.naturalWidth, img.naturalHeight), c = document.createElement('canvas');
                    c.width = c.height = 96;
                    c.getContext('2d').drawImage(img, (img.naturalWidth - sd) / 2, (img.naturalHeight - sd) / 2, sd, sd, 0, 0, 96, 96);
                    URL.revokeObjectURL(url);
                    GM_setValue('fabFace', c.toDataURL('image/png'));
                    btn.innerHTML = fabFace();
                };
                img.src = url;
            };
            f.click();
        });
        act('off', () => { if (!confirm('Выключить ИТД X до закрытия вкладки? Вернуть — кнопкой внизу страницы.')) return; try { sessionStorage.setItem('vp-off', '1'); } catch (e) { } location.reload(); });
        // тап мимо — меню закрывается
        document.addEventListener('pointerdown', e => { if (!fab.contains(e.target)) fab.classList.remove('vp-open'); }, true);
    }
    onDom(adminFab);

    // Снимок страницы: разметка как она есть сейчас (с метками vp-* и классами сайта) + все стили сайта
    // и мода + размер экрана. Без скриптов. Сохраняется файлом — его и присылать.
    function pageSnapshot() {
        const css = [];
        for (const sh of document.styleSheets) {
            try { css.push(`/* ${sh.href || (sh.ownerNode && sh.ownerNode.id) || 'inline'} */\n` + [...sh.cssRules].map(r => r.cssText).join('\n')); }
            catch (e) { css.push(`/* ${sh.href} — чужой домен, не читается */`); }
        }
        const doc = document.documentElement.cloneNode(true);
        doc.querySelectorAll('script, style, link[rel="stylesheet"], canvas, .vp-fab').forEach(el => el.remove());
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

    // --- запасная круглая кнопка настроек у крупного ника (когда на сайте нет «ИТД НУКСТА», см. ниже)
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
    // Кнопка «ИТД X» — на месте кнопки сайта «ИТД НУКСТА» в шапке своего профиля, тем же видом
    // (берём её классы). Открывает все настройки мода. Кнопку сайта только прячем: её рисует сайт.
    // Если такой кнопки нет (сайт поменялся) — у ника остаётся круглая кнопка настроек.
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
                b.textContent = 'ИТД X';
                b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openSettingsMenu(b); });
                nuksta.after(b);
            }
            document.querySelectorAll('.nick-controls-panel').forEach(p => p.remove());
            return;
        }
        if (document.querySelector('.vp-itdx-btn') || ru5n.querySelector('.nick-controls-panel')) return;
        const panel = document.createElement('div');
        panel.className = 'nick-controls-panel';
        panel.append(pillButton('settings-toggle', 'ИТД X', ICONS.GEAR, openSettingsMenu));
        const nick = ru5n.querySelector('.' + SELECTORS.nickContainer);
        if (nick) nick.after(panel);
        else ru5n.appendChild(panel);
    }

    // ==== редактор баннера
    // Своя картинка вместо баннера: кнопка «картинка» рядом с кнопками сайта → выбрать файл →
    // картинка ложится на баннер во всю ширину, её двигают вверх-вниз (мышь, палец, колесо) →
    // «Применить» вырезает видимую часть, грузит файл и ставит его баннером профиля.
    // Режим правки — класс vp-banner-editing на баннере и на ряде кнопок, вид — в CSS.
    const bannerEdit = { banner: null, img: null, url: null, top: 0, drag: null };   // drag: { y, top } при перетаскивании
    const bannerBtns = { row: null, draw: null, del: null, image: null, change: null, cancel: null, apply: null };

    const styleBanner = document.createElement('style');
    styleBanner.textContent = `
        .custom-image-btn:hover, .custom-change-btn:hover {
            background: var(--accent-primary, #0080FF) !important;
            color: #fff !important;
        }
        .custom-cancel-btn:hover { background: #dc3545cc !important; }
        .custom-apply-btn:hover { background: #28a745cc !important; }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        /* обычный режим: кнопки правки спрятаны; в режиме правки — наоборот */
        .vp-banner-buttons:not(.vp-banner-editing) :is(.custom-change-btn, .custom-cancel-btn, .custom-apply-btn),
        .vp-banner-buttons.vp-banner-editing > :not(.custom-change-btn, .custom-cancel-btn, .custom-apply-btn) { display: none !important; }
        .vp-banner.vp-banner-editing { position: relative; overflow: hidden; z-index: 0; }
        /* ряд кнопок сайта бывает во весь баннер — в режиме правки он не должен ловить перетаскивание */
        .vp-banner-buttons.vp-banner-editing { pointer-events: none; }
        .vp-banner-buttons.vp-banner-editing > button { pointer-events: auto; }
        .vp-banner.vp-banner-editing > img:not(.vp-banner-drag) { position: relative; z-index: -3; }
        /* вес выше правил сайта для картинок баннера (там высота во весь баннер) — как раньше style.* */
        .vp-banner > img.vp-banner-drag {
            position: absolute; left: 0; top: 0; width: 100%; height: auto; z-index: -1;
            cursor: grab; user-select: none; -webkit-user-drag: none; touch-action: none;
            transition: top 0.1s ease-out;
        }
        .vp-banner > img.vp-banner-drag.vp-dragging { cursor: grabbing; transition: none; }
    `;
    document.head.appendChild(styleBanner);

    function bannerButton(cls, title, icon) {
        const b = document.createElement('button');
        b.className = siteClasses(bannerBtns.draw) + ' ' + cls;
        b.title = title;
        b.innerHTML = icon;
        return b;
    }
    // Кнопки — в ряд кнопок баннера сайта; сайт перерисовывает ряд — ставим заново
    function createAllButtons() {
        const row = document.querySelector('.' + SELECTORS.bannerButtons);
        if (!row || row.querySelector('.custom-image-btn')) return;
        const B = bannerBtns;
        B.row = row;
        B.draw = row.querySelector('button:not(.' + SELECTORS.bannerDelete + ')');
        B.del = row.querySelector('.' + SELECTORS.bannerDelete);
        B.image = bannerButton('custom-image-btn', 'Добавить картинку', ICONS.BANNER_IMAGE);
        B.change = bannerButton('custom-change-btn', 'Сменить картинку', ICONS.BANNER_CHANGE);
        B.cancel = bannerButton('custom-cancel-btn', 'Отмена', ICONS.BANNER_CANCEL);
        B.apply = bannerButton('custom-apply-btn', 'Применить', ICONS.BANNER_APPLY);
        row.insertBefore(B.image, B.del);                 // del нет — insertBefore(null) ставит в конец
        row.append(B.change, B.cancel, B.apply);
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

    // картинка на баннер — сразу посередине по высоте
    function putBannerImage(url) {
        const banner = document.querySelector('.' + SELECTORS.banner);
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

    // сдвиг в пределах баннера: край картинки за край баннера не уходит;
    // free — без ограничения (середина для картинки ниже баннера, как было)
    function moveBannerImage(top, free) {
        const E = bannerEdit;
        if (!E.img) return;
        E.top = free ? top : Math.max(E.banner.clientHeight - E.img.offsetHeight, Math.min(0, top));
        E.img.style.top = E.top + 'px';
    }
    const bannerMovable = () => bannerEdit.img && bannerEdit.img.offsetHeight > bannerEdit.banner.clientHeight;

    // Перетаскивание — pointer-события: одинаково для мыши и пальца (раньше палец не мог начать
    // перетаскивание — не было обработчика касания). Колесо — шаг 30px.
    // Слушатели одни на всё время работы: раньше каждое открытие картинки добавляло ещё один на колесо.
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

    // видимая в баннере часть картинки — в JPEG исходного разрешения
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

    // файл грузим через XHR, как раньше: на нём «Анти цензура» (gifOnSend)
    function uploadBannerFile(blob, token) {
        return new Promise((resolve, reject) => {
            const form = new FormData();
            form.append('file', blob, 'banner.jpg');
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

    // ================= Что нового =================
    // Плашка версии мода (под логотипом) открывает журнал обновлений — как «Что нового» у сайта.
    // Пока новую версию не открывали, на плашке точка (changelogSeen — последняя просмотренная).
    // Мелкие патчи — одной записью на диапазон версий; служебное (админка и т.п.) сюда не пишем.
    // Редкие заставки — сюрприз, в журнал не пишем.
    const CHANGELOG = [
        ['3.2.18', '28 сентября 2026', [
            'Галерея на компьютере — на всю ширину: меню у левого края, «Статистика» и клуб — у правого, картинки между ними',
            'Вкладки галереи — 1 в 1 как у ленты: отдельная таблетка сверху, тот же порядок; на телефоне слева — логотип',
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
        const unseen = GM_getValue('changelogSeen', '') !== GM_info.script.version;
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
            <button type="button" class="vp-news-x" aria-label="Закрыть">${svgIcon('<path d="M18 6 6 18M6 6l12 12"/>', 18)}</button></div><div class="vp-news-list"></div></div>`;
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
        const close = () => { back.remove(); removeEventListener('keydown', onKey, true); };
        const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
        back.addEventListener('click', e => { if (e.target === back) close(); });
        back.querySelector('.vp-news-x').onclick = close;
        addEventListener('keydown', onKey, true);
        document.body.appendChild(back);
        GM_setValue('changelogSeen', GM_info.script.version);
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

    // ================= API сайта =================
    // Токен доступа живёт недолго: держим его 4 минуты, одновременные запросы ждут одно обновление
    // (раньше автолайк обновлял токен на каждого пользователя разом), на 401 — берём свежий.
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
    // Код по номеру аккаунта (author.id): ник можно сменить — галочка остаётся. Старые коды (по нику)
    // тоже верные: у друзей может стоять прошлая версия, её код — по нику
    const isAuthorCode = (author, parsed) => !!author && !!parsed && parsed.flags[0] === '1'
        && ((author.id && parsed.code === generateCode(author.id)) || (author.username && parsed.code === generateCode(author.username)));

    // Ники пользователей мода — из последней проверки (localStorage). Битая запись — пустой список:
    // на нём держатся «Клуб ИТД X», собеседники в личке, кандидаты автолайков и вериф-бейджи.
    function verifiedNames() {
        try { return Object.keys(JSON.parse(localStorage.getItem(VERIFICATION_STORAGE_KEY) || '{}') || {}); } catch (e) { return []; }
    }

    // Служебный пост читают проверка всех и проверка себя подряд — это один и тот же ответ:
    // держим его 20 с (fresh — после своего нового кода, нужен свежий)
    let verifyLoad = null, verifyLoadAt = 0;
    // Все комментарии поста — страницами по 100 (limit + cursor, как у сайта). Больше 30 страниц не читаем
    async function allComments(postId, maxPages = 30) {
        const all = [];
        let cursor = null;
        for (let page = 0; page < maxPages; page++) {
            const res = await api(`/api/posts/${postId}/comments?limit=100` + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
            if (!res.ok) throw new Error('комментарии: ' + res.status);
            const j = await res.json(), d = j.data || j;
            const list = d.comments || [];
            if (page && list.length && all.some(c => c.id === list[0].id)) break;      // сервер не понял курсор — не зацикливаемся
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
    // Ник и аватар участника — из его же комментария-кода: у комментария есть автор. Клубу и автолайкам
    // так не нужен отдельный запрос профиля на каждого (при сотне участников это сотня запросов на вкладку)
    function verifiedInfo(name) {
        try { return (JSON.parse(localStorage.getItem(VERIFICATION_STORAGE_KEY) || '{}') || {})[name] || null; } catch (e) { return null; }
    }

    async function checkAllComments(fresh) {
        if (isVerifying) return null;
        isVerifying = true;
        try {
            const verifiedUsers = {};
            for (const c of await loadVerificationComments(fresh)) {
                const name = c.author?.username;
                const parsed = parseCode(c.content);
                if (!name || verifiedUsers[name] || !isAuthorCode(c.author, parsed)) continue;
                const a = c.author, ava = a.avatar && (a.avatar.url || a.avatar) || a.avatarUrl || a.emoji;
                verifiedUsers[name] = { code: parsed.code, commentId: c.id, hasMod: true, flags: parsed.flags, id: a.id || undefined,
                    displayName: a.displayName || a.display_name || undefined, avatar: typeof ava === 'string' ? ava : undefined };
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

    // свой код под служебным постом: есть верный — ничего не делаем, иначе старые удаляем и пишем новый
    async function verifyMyself() {
        if (!myUsername) return false;
        try {
            const all = await loadVerificationComments();
            const myId = (meData && meData.id) || (all.find(c => c.author?.username === myUsername) || {}).author?.id;
            const mine = all.filter(c => (myId ? c.author?.id === myId : c.author?.username === myUsername) && parseCode(c.content));
            const byId = c => myId && parseCode(c.content).code === generateCode(myId);
            if (!myId && mine.some(c => isModCode(myUsername, parseCode(c.content)))) return true;
            if (mine.some(byId)) return true;
            // Под служебным постом — только новый комментарий или правка: новый шлёт автору поста уведомление,
            // правка — нет. Есть свой устаревший код (сменил ник, испорчен) — правим его на код по номеру
            // аккаунта; верный код по нику не трогаем (его видят друзья со старой версией) — рядом пишем новый
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

    // ==== кнопка «наверх» и телефонная раскладка
    // Кнопка появляется, когда прокрутили ниже 300px. Вид — в CSS (!important: кнопка берёт классы
    // сайта у «Создать пост», см. newPostBump, и раньше их перебивал style.*).
    // До ширины 1172px (телефон, планшет): кнопка выше нижней панели, у страницы нет полосы
    // прокрутки и оттяжки; всё это — только после входа (html.vp-has-up), как было.
    const styleScrollTop = document.createElement('style');
    styleScrollTop.textContent = `
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
            margin: 0 !important; padding: 0 !important;       /* z-index — от сайта (было так: style.zIndex сбрасывался) */
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
        @media (max-width: 1172px) {
            .itd-scroll-top-btn { z-index: 1 !important; bottom: 100px !important; }
            html.vp-has-up, html.vp-has-up body { overscroll-behavior: none !important; }
            html.vp-has-up ::-webkit-scrollbar { display: none !important; }
            html.vp-has-up .vp-nick-large { display: flex; flex-direction: column; align-items: center; gap: 4px; }
            .nick-wrapper { display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 4px !important; }
        }
    `;
    document.head.appendChild(styleScrollTop);

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

    // Крупный ник в шапке профиля на узком экране: его части — в обёртке .nick-wrapper (строка
    // с переносом), сам блок — столбец по центру. На широком обёртку снимаем. Переключение —
    // по смене ширины (matchMedia) и когда сайт перерисовал шапку (onDom).
    const narrowScreen = matchMedia('(max-width: 1172px)');
    function placeNickWrapper() {
        const nick = document.querySelector('.' + SELECTORS.nickLarge);
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
            if (!me || !me.username) return;              // не вошли или API не ответил — свои ники искать не по чему
            meData = me;
            myUsername = me.username;
            myDisplayName = me.displayName || me.username;
            tagAll();
            try { placeRail(); } catch (e) { /* панель ещё не собрана — встанет сама при первой перестройке */ }

            createScrollTopButton();

            // список пользователей мода: сразу и раз в 10 минут; свой код — после первой проверки
            checkAllComments().then(() => { markVerifiedUsers(); return verifyMyself(); });
            setInterval(checkAllComments, 10 * 60 * 1000);

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
                        badge.style.setProperty('--vp-badge', size + 'px');
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
                badge.style.setProperty('--vp-badge', size + 'px');
                nick.insertAdjacentElement('afterend', badge);
            }
            // список разбираем заново, только когда он поменялся, а не на каждую правку страницы
            let verifiedRaw = null, verifiedSet = new Set();
            function markVerifiedUsers() {
                const raw = localStorage.getItem(VERIFICATION_STORAGE_KEY) || '{}';
                if (raw !== verifiedRaw) {
                    verifiedRaw = raw;
                    verifiedSet = new Set(verifiedNames().map(u => u.toLowerCase()));
                }
                const names = new Set(verifiedSet);
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
                let container = document.querySelector('.' + SELECTORS.logoContainer);
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
                // слева колонка: иконка и под ней, по её центру, плашка версии мода; справа — версия сайта
                // на уровне иконки (раньше плашка стояла от левого края и уезжала вправо от центра иконки)
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
                container = iconCol;                      // плашку версии ниже кладём в колонку иконки
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
                markChangelogChips();

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
                    // логотип с версией — ровно на высоту вкладок и по центру своего места
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

            // «Лента кланов» → «Кланы»: короче, вкладки ленты помещаются в строку. Меняем сам текстовый
            // узел (не пересоздаём) — сайт продолжит им управлять как своим.
            onDom(function clanTabName() {
                document.querySelectorAll('.' + SELECTORS.feedBar + ' button').forEach(b => {
                    const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
                    for (let t; (t = walker.nextNode());) if (t.nodeValue.trim() === 'Лента кланов') t.nodeValue = t.nodeValue.replace('Лента кланов', 'Кланы');
                });
            });

            onDom(function feedBarIcon() {
                if (document.querySelector('.' + SELECTORS.feedBar)) updateNavIcon();
            });
            scheduleAutoLike();
        } catch (e) { console.warn('[ITD VP] запуск мода', e); logErr('запуск мода', e); }
    }

    // Кадр через requestAnimationFrame: в свёрнутой вкладке он сам встаёт на паузу.
    // Статичный цвет рисуется один раз (paint), радуга — каждый кадр.
    // Фон рисуется на частоте экрана — 60, 90, 120, 144 Гц, какой есть (скорость одна и та же: dt от времени).
    // Если кадры начинают пропадать (слабое устройство, тяжёлая страница), фон переходит на каждый второй
    // кадр: картинка та же, только реже. Через 15 с пробует снова полную частоту (не вышло — ждёт вдвое дольше).
    let lastFrame = 0, bestGap = 1000, slow = 0, halfRate = false, odd = false, halfSince = 0, retryMs = 15000;
    function frame(t) {
        requestAnimationFrame(frame);
        if (halfRate && t - halfSince > retryMs) { halfRate = false; slow = 0; retryMs = Math.min(retryMs * 2, 240000); }
        if (halfRate && (odd = !odd)) return;
        const gap = lastFrame ? t - lastFrame : 16.7;
        lastFrame = t;
        if (gap > 0 && gap < 100) {
            const base = halfRate ? gap / 2 : gap;
            bestGap = Math.min(bestGap, base);          // родной интервал экрана
            slow = base > bestGap * 1.7 ? slow + 1 : Math.max(0, slow - 2);
            if (!halfRate && slow > 45) {
                halfRate = true; halfSince = t; slow = 0;
                document.documentElement.classList.add('vp-glass-lite');
            }
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

    // ==== стикеры в комментариях
    // Кнопка у поля комментария → панель паков (наведение открывает, уход мыши закрывает).
    // Паки свои: хранятся в localStorage, картинки грузятся на сайт (/api/files/upload), стикер
    // уходит в комментарий вложением. «Недавние» — последние отправленные.
    // Режим правки пака: стикеры дрожат, их можно таскать, удалять, добавлять (с обрезкой).
    // Вид — в CSS (классы ниже), режимы — классами; в style.* только то, что считается.
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
        // стикеры пака по ключу ('recent' — недавние); имя пака
        const packStickers = key => key === 'recent' ? recentStickers : (userPacks.find(p => p.id === key) || { stickers: [] }).stickers;
        const packName = key => key === 'recent' ? 'Недавние' : ((userPacks.find(p => p.id === key) || {}).name || DEFAULT_PACK_NAME);
        const allPackKeys = () => ['recent', ...userPacks.map(p => p.id)];
        function savePack(key) { if (key === 'recent') saveRecent(); else saveUserPacks(); }

        // ---- Синхронизация паков между устройствами одного аккаунта
        // Паки — свои комментарии «ITDXS 1/2 …» под служебным постом STICKER_POST_ID. Под служебными постами
        // только новый комментарий или правка (без ответов и удалений): ответы и новые комментарии шлют
        // уведомления, правка — нет. Куски создаются один раз, дальше правятся; лишние — правятся в пустые.
        // Автора комментария ставит сервер — свои куски узнаём по номеру аккаунта (author.id), не по нику.
        // Время правки паков дописано цифрами к своему коду галочки («код1» + секунды — старые версии мода
        // такой код принимают): его и так читают раз в 10 минут, а служебный пост паков читаем, только
        // если там новее, чем здесь. Паки упакованы в байты: у стикера номер файла и имя картинки — две
        // UUID по 16 байт, в комментарий (2000 знаков) влезает ~40 стикеров; больше — несколько кусков.
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
                    else { put(255); str(st.id || ''); str(st.url || ''); }        // не с CDN сайта — как есть
                }
            }
            let bin = '';
            out.forEach(b => { bin += String.fromCharCode(b); });
            return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }
        function decodePacks(b64) {
            const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
            const b = Uint8Array.from(bin, c => c.charCodeAt(0));
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
        // время паков в данных галочки (секунды после «1» в коде); 0 — паков там нет
        const remotePacksAt = () => { const f = String((verifiedInfo(myUsername || '') || {}).flags || ''); return f.length > 1 ? +f.slice(1) * 1000 : 0; };
        // свои куски под постом паков: запомненные номера или поиском (один раз на устройство)
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
        const patchComment = (id, content) => api(`/api/comments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
        // скачать: в галочке время новее нашего — читаем свои куски и берём паки оттуда
        async function pullPacks() {
            const at = remotePacksAt();
            if (!at || at <= packsAt + 999) return;
            const parts = (await packParts(true)).filter(p => p.n).sort((a, b) => a.i - b.i);
            const n = parts.length && parts[0].n;
            if (!n || parts.length < n || !parts.slice(0, n).every((p, k) => p.i === k + 1 && p.n === n)) return;
            const remote = decodePacks(parts.slice(0, n).map(p => p.d).join(''));
            if (remote.at <= packsAt + 999) return;
            // паки из прошлых версий (без времени) здесь — не теряем: к скачанным добавляем свои, которых там нет
            const legacy = !packsAt && userPacks.length ? userPacks.filter(pk => !remote.packs.some(r => r.id === pk.id)) : [];
            applyRemotePacks({ at: remote.at, packs: [...remote.packs, ...legacy] });
            if (legacy.length) { packsAt = Date.now(); localStorage.setItem(PACKS_AT_KEY, String(packsAt)); return 'push'; }
        }
        // выгрузить свои паки: куски правкой (новые — новым комментарием), потом время — в код галочки
        async function pushPacks() {
            const mine = verifiedInfo(myUsername || '');
            if (!mine || !mine.commentId) return;                 // без своей галочки некуда записать время
            let parts = await packParts(false);
            if (!parts.length) parts = await packParts(true);
            if (!packsAt) { packsAt = Date.now(); localStorage.setItem(PACKS_AT_KEY, String(packsAt)); }
            const data = encodePacks(userPacks, packsAt), CH = 1900, chunks = [];
            for (let k = 0; k < data.length || !chunks.length; k += CH) chunks.push(data.slice(k, k + CH));
            const slots = parts.map(p => p.id), saved = [];
            for (let k = 0; k < Math.max(chunks.length, slots.length); k++) {
                const content = k < chunks.length ? `${SYNC_TAG} ${k + 1}/${chunks.length} ${chunks[k]}` : `${SYNC_TAG} 0/0 -`;   // лишний кусок — пустой
                if (slots[k]) {
                    const res = await patchComment(slots[k], content);
                    if (!res.ok) throw new Error('паки: правка ' + res.status);
                    saved.push({ id: slots[k], i: k < chunks.length ? k + 1 : 0, n: k < chunks.length ? chunks.length : 0 });
                } else {
                    const res = await api(`/api/posts/${STICKER_POST_ID}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
                    if (!res.ok) throw new Error('паки: запись ' + res.status);
                    const j = await res.json();
                    saved.push({ id: (j.data || j).id, i: k + 1, n: chunks.length });
                }
            }
            GM_setValue(partsKey(), saved);
            // время паков — в свой код галочки (правкой)
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
                    // здесь паки новее, чем записано (правили без сети, паки прошлых версий без времени,
                    // слили свои с скачанными) — выгрузить
                    const at = remotePacksAt();
                    if (merged === 'push' || (userPacks.length && (!packsAt || packsAt > at + 999))) await pushPacks();
                }
            } catch (e) {
                logErr('паки: синхронизация', e);
            } finally {
                syncing = false;
            }
        }
        // правка паков здесь — отметить время и через 4 с выгрузить (серия правок — одна выгрузка)
        function packsChanged() {
            if (applyingRemote) return;
            packsAt = Date.now();
            localStorage.setItem(PACKS_AT_KEY, String(packsAt));
            clearTimeout(syncTimer);
            syncTimer = setTimeout(() => syncPacks(true), 4000);
        }
        // при входе и раз в 10 минут (после проверки галочек — там время паков)
        (function syncLoop() {
            if (!STICKER_POST_ID) return;
            const tick = () => myUsername && myAccountId() && verifiedInfo(myUsername) ? syncPacks(false) : setTimeout(tick, 3000);
            setTimeout(tick, 6000);
            setInterval(() => syncPacks(false), 10 * 60 * 1000);
        })();

        // ---- Паки из архива (.zip): папка = пак (имя папки — название), внутри — картинки, как есть (без обрезки).
        // Картинки прямо в корне архива — пак с именем архива. Одна общая папка сверху («Мои стикеры/Коты/…»)
        // пропускается. ZIP разбираем сами: оглавление в конце файла, сжатие — deflate (DecompressionStream).
        // Имена: флаг UTF-8 — UTF-8; иначе UTF-8, если читается, иначе кодировка DOS (архивы Windows с кириллицей)
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
        // архив → [{ name, files: [entry] }] по правилам выше
        function zipPacks(entries, zipName) {
            const imgs = entries.filter(e => {
                const parts = e.name.split('/');
                return !e.name.endsWith('/') && !parts.some(p => p.startsWith('.') || p === '__MACOSX') && ZIP_IMG[(parts.pop().split('.').pop() || '').toLowerCase()];
            });
            let paths = imgs.map(e => e.name.split('/'));
            // одна общая папка сверху, а в ней ещё папки — пропускаем её
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

        const style = document.createElement('style');
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
            /* перетаскивание (как иконки на рабочем столе телефона): стикер поднят и едет за пальцем,
               на его месте — «дырка», соседи плавно разъезжаются */
            .sticker-editing { touch-action: none; }
            /* вес выше .vp-sticker-item (там position: relative, и «призрак» уезжал вниз страницы) */
            .vp-sticker-item.vp-sticker-ghost { position: fixed; z-index: 10001; pointer-events: none; margin: 0; border-radius: 10px; overflow: hidden;
                box-shadow: 0 12px 30px rgba(0, 0, 0, .45), 0 0 0 2px var(--accent-primary, #0080FF); }
            .vp-sticker-ghost .vp-sticker-del { display: none; }
            .vp-sticker-item.vp-sticker-ghost { transition: none; animation: none; will-change: transform; transform-origin: 50% 50%; }
            .sticker-panel.vp-drag .sticker-editing { animation-play-state: paused; }
            .vp-sticker-item.vp-hole { opacity: .25; animation: none; box-shadow: inset 0 0 0 2px var(--accent-primary, #0080FF); }

            /* кнопка у поля комментария */
            .sticker-btn { background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: 9999px;
                display: inline-flex; align-items: center; justify-content: center; color: var(--text-secondary);
                margin-right: 5px; width: 36px; height: 36px; }
            .sticker-btn:hover { background-color: var(--bg-hover, rgba(255,255,255,0.08)); }

            /* прикреплённый стикер — как вложение сайта (картинка через скрепку): блок над строкой ввода,
               слева вровень с полем (отступ ставит attachSticker), квадрат 80 со скруглением 8 и крестиком */
            #temp_sticker_preview { padding: 0 0 8px; }
            .vp-sticker-attach { display: flex; gap: 8px; flex-wrap: wrap; }
            .vp-sticker-thumb { width: 80px; height: 80px; position: relative; border-radius: 8px; overflow: hidden; }
            .vp-sticker-thumb > img { width: 100%; height: 100%; object-fit: cover; }
            .vp-sticker-remove { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; background: rgba(0,0,0,0.6);
                border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; }
            .vp-sticker-hide { display: none !important; }
            /* наша «Отправить» — классы кнопки сайта, а та по умолчанию стоит за краем капсулы и выезжает,
               только когда у сайта есть вложение или текст: ставим её на место, как сайт при вложении */
            .vp-sticker-sendbtn { margin: 6px !important; transform: translate(0) !important; }

            /* панель */
            .sticker-panel { position: fixed; display: none; flex-direction: column; background: var(--block-bg,#1e1e2e);
                border-radius: 20px; border: 1px solid var(--border-color,rgba(255,255,255,0.1)); z-index: 10000;
                width: ${PANEL_WIDTH}px; height: 440px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); overflow: hidden; }
            .sticker-panel.vp-open { display: flex; }
            .vp-sp-import { position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; gap: 10px; padding: 16px;
                background: var(--block-bg,#1e1e2e); border-radius: inherit; font-size: 13px; line-height: 1.4; color: var(--text-primary,#fff); overflow: auto; }
            html.vp-glass .vp-sp-import { background: rgba(24,24,24,.96); }
            html.vp-glass.vp-light .vp-sp-import { background: rgba(255,255,255,.97); }
            .vp-sp-import b { font-size: 15px; }
            .vp-sp-import ul { margin: 0; padding-left: 18px; list-style: disc; color: var(--text-secondary,rgba(255,255,255,.7)); }
            .vp-sp-import li + li { margin-top: 4px; }
            .vp-sp-import pre { margin: 0; padding: 8px 10px; border-radius: 10px; background: rgba(128,128,128,.14); font-size: 12px; line-height: 1.35; white-space: pre; }
            .vp-sp-import .vp-imp-btns { display: flex; gap: 8px; margin-top: auto; }
            .vp-sp-import button { flex: 1; height: 38px; border: 0; border-radius: 12px; cursor: pointer; font: inherit; font-weight: 600;
                background: rgba(128,128,128,.18); color: inherit; }
            .vp-sp-import button.vp-imp-go { background: var(--accent-primary,#0080FF); color: #fff; }
            .vp-sp-import button:disabled { opacity: .5; cursor: default; }
            .vp-sp-import .vp-imp-status { min-height: 18px; color: var(--text-secondary,rgba(255,255,255,.7)); }
            .vp-sp-head { display: flex; align-items: center; padding: 8px; border-bottom: 1px solid var(--border-color,rgba(255,255,255,0.1));
                gap: 4px; flex-shrink: 0; }
            .vp-sp-tab { background: transparent; border: none; width: 32px; height: 32px; border-radius: 12px; cursor: pointer;
                display: flex; align-items: center; justify-content: center; padding: 0; flex-shrink: 0;
                color: var(--text-secondary,rgba(255,255,255,0.5)); }
            .vp-sp-tab.vp-recent { color: white; }
            .vp-sp-tab.vp-on { background: var(--accent-primary,#0080FF); }
            .vp-sp-tab > img { width: 24px; height: 24px; object-fit: contain; border-radius: 6px; }
            .vp-sp-tabs { display: flex; gap: 4px; overflow-x: auto; overflow-y: hidden; flex: 1; padding: 0 4px; scrollbar-width: none; }
            .vp-sp-tabs > div { display: flex; gap: 4px; }
            .vp-sp-body { flex: 1; overflow-y: auto; overflow-x: hidden; scroll-behavior: smooth; scrollbar-width: thin; }
            .pack-header { padding: 16px 10px 8px; display: flex; align-items: center; gap: 6px; color: var(--text-secondary,rgba(255,255,255,0.5)); }
            .vp-sp-name { display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-right: auto; }
            .pack-name-input { background: transparent; border: 1px solid transparent; color: inherit; font-size: 14px; font-weight: 600;
                letter-spacing: 0.5px; text-transform: uppercase; padding: 2px 4px; border-radius: 4px; outline: none; width: auto; }
            .pack-header[data-pack="recent"] .pack-name-input { pointer-events: none; }
            .vp-sp-edit { background: transparent; border: none; width: 20px; height: 20px; border-radius: 6px; cursor: pointer;
                display: flex; align-items: center; justify-content: center; padding: 0; color: inherit; }
            .delete-pack-btn, .vp-sp-done { display: none; border: none; width: 24px; height: 24px; border-radius: 6px; cursor: pointer;
                padding: 0; align-items: center; justify-content: center; }
            .delete-pack-btn { background: #ff4444; }
            .vp-sp-done { background: var(--accent-primary,#0080FF); }
            .pack-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 3px; padding: 0 10px 16px; position: relative; }
            /* режим правки: виден только свой пак, у него — «удалить пак» и «готово» */
            .vp-sp-body.vp-editing > :not(.vp-cur) { display: none; }
            .vp-sp-body.vp-editing > .pack-header.vp-cur :is(.delete-pack-btn, .vp-sp-done) { display: flex; }
            .vp-sticker-item { aspect-ratio: 1; font-size: 34px; background: transparent; border: none; border-radius: 10px;
                transition: all 0.15s ease; display: flex; align-items: center; justify-content: center; cursor: pointer;
                padding: 0; position: relative; user-select: none; overflow: hidden; }
            .sticker-panel:not(.vp-drag) .vp-sticker-item:hover { transform: scale(1.05); box-shadow: 0 0 0 2px var(--accent-primary,#0080FF); }
            .vp-sticker-item > img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
            .vp-sticker-item > .vp-sticker-empty { width: 100%; height: 100%; background: rgba(128,128,128,0.1); border-radius: 8px; }
            .vp-sticker-del { position: absolute; top: 2px; right: 2px; width: 16px; height: 16px; background: rgba(0,0,0,0.6);
                border-radius: 50%; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.7);
                transition: all 0.15s; z-index: 2; pointer-events: auto; font-size: 12px; }
            .vp-sticker-del:hover { background: #ff4444; }
            .add-item-btn { aspect-ratio: 1; background: var(--bg-secondary,rgba(128,128,128,0.08));
                border: 2px dashed var(--border-color,rgba(255,255,255,0.2)); border-radius: 10px; display: flex; align-items: center;
                justify-content: center; cursor: pointer; padding: 0; color: var(--text-secondary,rgba(255,255,255,0.5)); transition: all 0.15s; }
            .add-item-btn:hover { border-color: var(--accent-primary,#0080FF); color: var(--accent-primary,#0080FF); }
            .add-item-btn.vp-busy { pointer-events: none; }

            /* обрезка стикера */
            .vp-crop-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8);
                display: flex; align-items: center; justify-content: center; z-index: 20000; }
            .vp-crop-editor { background: var(--block-bg,#1e1e2e); border-radius: 16px; padding: 20px; display: flex;
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
        `;
        document.head.appendChild(style);

        const el = (tag, cls, html) => {
            const e = document.createElement(tag);
            if (cls) e.className = cls;
            if (html) e.innerHTML = html;
            return e;
        };

        // ---- загрузка картинки и отправка
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

        // Номер поста — со страницы (раньше его подсматривали в запросах сайта, но та обёртка
        // fetch стояла в песочнице Tampermonkey и запросов сайта не видела): из адреса /post/…,
        // а в ленте — из ссылки на пост в той же карточке, что и поле комментария
        function stickerPostId() {
            const m = location.pathname.match(/\/post\/([^\/?#]+)/);
            if (m) return m[1];
            const row = stickerBtn && stickerBtn.closest('.' + SELECTORS.stickerContainer);
            const card = row && row.closest('article');
            const link = card && card.querySelector('a[href*="/post/"]');
            const lm = link && link.getAttribute('href').match(/\/post\/([^\/?#]+)/);
            return lm ? lm[1] : card ? postIdOf(card) : null;
        }

        // Прикреплённый стикер. Сайт о нём не знает: его «Отправить» включается только от своего текста
        // или своего вложения, по выключенной кнопке нажатие не проходит. Поэтому на это время кнопка
        // сайта спрятана, на её месте — наша такая же: текст поля + стикер вложением нашим запросом,
        // потом перезагрузка (так сайт покажет новый комментарий). Enter в поле — то же, что наша кнопка.
        // Кнопки строки после поля (микрофон) прячем, как сайт при своём вложении.
        // Крестик возвращает всё как было.
        let attached = null;          // { preview, send, hidden: [...] }
        function detachSticker() {
            if (!attached) return;
            const { preview, send, hidden } = attached;
            attached = null;
            preview.remove();
            send.remove();
            hidden.forEach(b => b.classList.remove('vp-sticker-hide'));
        }
        // Сайт пускает во вложения только свои файлы («Некоторые файлы не принадлежат вам»): стикер,
        // загруженный с другого аккаунта, грузим заново от своего имени и запоминаем новый номер в паках.
        // Картинку качает Tampermonkey (у хранилища картинок нет CORS — fetch страницы её не получит).
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
            detachSticker();                                      // прошлый прикреплённый — снять целиком
            const row = stickerBtn && stickerBtn.closest('.' + SELECTORS.stickerContainer);
            const box = (row && row.closest('.' + SELECTORS.commentPreviewContainer)) || document.querySelector('.' + SELECTORS.commentPreviewContainer);
            const siteSend = (row && row.querySelector('.' + SELECTORS.stickerSendBtn)) || document.querySelector('.' + SELECTORS.stickerSendBtn);
            if (!box || !siteSend) return;
            document.getElementById('temp_sticker_preview')?.remove();

            // строка ввода: поле в капсуле + кнопки вокруг (скрепка, микрофон); превью — над ней
            const line = box.parentElement && box.parentElement.querySelector(':scope > button') ? box.parentElement : box;
            const preview = el('div', '', `<div class="vp-sticker-attach"><div class="vp-sticker-thumb"><img><button type="button" class="vp-sticker-remove">${svgIcon('<path d="M18 6 6 18M6 6l12 12"/>', 14)}</button></div></div>`);
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
        // Enter в поле при прикреплённом стикере — отправить стикер (Shift+Enter — новая строка, как у сайта)
        document.addEventListener('keydown', e => {
            if (!attached || e.key !== 'Enter' || e.shiftKey || !e.target.isContentEditable) return;
            if (!e.target.closest('.' + SELECTORS.commentPreviewContainer)) return;
            e.preventDefault();
            e.stopPropagation();
            attached.send.click();
        }, true);

        // ---- панель
        let stickerPanel = null, scrollContainer = null, tabsRow = null, recentBtn = null;
        let stickerBtn = null, hideTimeout = null;
        let editPack = null;                                   // ключ пака в режиме правки

        // колесо над панелью не крутит страницу (сайт крутит #root)
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

        // ширина поля имени — по тексту
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
        // паков стало больше или меньше — панель собираем заново
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
                    // имя меняется только в режиме правки этого пака; пустое — «Новый пакет»
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

        // режим правки — классы: vp-editing на ленте паков, vp-cur на шапке и сетке своего пака
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
        // Плавная перестановка (FLIP): запоминаем места ячеек, меняем порядок, и каждая, что сдвинулась,
        // едет со старого места на новое
        function flipGrid(grid, mutate) {
            const items = [...grid.children], before = new Map(items.map(e => [e, e.getBoundingClientRect()]));
            mutate();
            items.forEach(e => {
                const a = before.get(e), b = e.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
                if (dx || dy) e.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
                    { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
            });
        }
        // Перетаскивание в режиме правки: сдвинул стикер на 6px — он поднимается и едет за мышью/пальцем,
        // на его месте «дырка»; над другим стикером дырка переезжает туда, соседи разъезжаются;
        // отпустил — стикер ложится в дырку, порядок сохраняется. У края ленты — прокрутка.
        // Без сдвига — обычное нажатие (выбрать стикер).
        // Скорость: «призрак» двигается через transform раз за кадр в последнюю точку пальца (без переходов —
        // у ячеек transition: all, из-за него он догонял палец с задержкой); ячейка под пальцем — по
        // запомненным местам ячеек (без elementFromPoint); дрожь и общий наблюдатель мода на это время стоят.
        function startStickerDrag(e, btn, key) {
            if (e.button > 0 || e.target.closest('.vp-sticker-del')) return;
            const grid = btn.parentElement, x0 = e.clientX, y0 = e.clientY;
            let ghost = null, ox = 0, oy = 0, gx = 0, gy = 0, px = x0, py = y0, raf = 0, cells = [], box = null;
            // места ячеек — по раскладке (offsetLeft/Top), а не по экрану: во время разъезда ячейки ещё в пути
            const measure = () => {
                const gr = grid.getBoundingClientRect();
                cells = [...grid.querySelectorAll('.vp-sticker-item')].map(el => {
                    const left = gr.left + grid.clientLeft + el.offsetLeft, top = gr.top + grid.clientTop + el.offsetTop;   // сетка — offsetParent
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
                // у края ленты — прокрутка (и места ячеек заново)
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
                    domObserver.disconnect();                          // свои перестановки не будят общий проход по странице
                    document.body.appendChild(ghost);
                    btn.classList.add('vp-hole');
                    btn._vpDragged = true;                                // клик после перетаскивания — не выбор
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
                if (raf) { cancelAnimationFrame(raf); frame(); cancelAnimationFrame(raf); }   // последняя точка — тоже в счёт
                raf = 0;
                // ложится в дырку
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
                    // новый порядок — по ячейкам в сетке (у каждой — её прежний номер)
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

        // Стикер — как картинка через скрепку: кладём файл в поле выбора файла сайта рядом с полем
        // комментария, дальше сайт всё делает сам — превью, отправка, комментарий в списке без
        // перезагрузки, файл грузится от своего имени (чужие файлы сайт во вложения не пускает).
        // Поля нет или картинка не скачалась — прикрепляем по-своему (insertStickerToComment).
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
            enablePageScroll();                                   // раньше колесо страницы оставалось заблокированным
        }
        function createStickerButton(sticker, key, index, editing) {
            const btn = el('button', 'vp-sticker-item');
            btn.dataset.packKey = key;
            btn.dataset.stickerIndex = index;
            if (sticker && sticker.url) { const img = el('img'); img.src = sticker.url; btn.appendChild(img); }
            else btn.appendChild(el('div', 'vp-sticker-empty'));
            btn.onclick = () => { if (btn._vpDragged) { btn._vpDragged = false; return; } pickSticker(sticker); };
            if (!editing) return btn;

            // правка: дрожь, крестик, перетаскивание внутри пака (мышь и палец)
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
        // подсветка вкладки пака, чья шапка сейчас вверху ленты
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
                if (stickerPanel.classList.contains('vp-drag')) return hidePanel(delay);   // тащат стикер — не закрывать
                if (stickerPanel.querySelector('.vp-sp-import')) return hidePanel(delay);   // импорт архива — тоже
                stickerPanel.classList.remove('vp-open');
                exitEditMode();
                enablePageScroll();
            }, delay);
        }

        // ---- обрезка стикера: рамка по картинке, тянуть за края/углы или целиком (мышь и палец),
        // пропорции на выбор, у середины рамка прилипает. Готово — PNG вырезанной части.
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
                let ratio = null;                        // пропорция рамки, null — свободная
                let action = null;                       // { dir, x, y, w, h, left, top } — что тянут и откуда начали

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

                // где на экране картинка внутри квадрата (object-fit: contain)
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
                // у середины картинки рамка прилипает (порог 5px)
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
                        // с пропорцией: за верх/низ тянут высоту, иначе ширину; рамка растёт от
                        // противоположного края (у боковых — от середины)
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
                    action = null;                       // курсор «move» остаётся, как было
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

        // ---- кнопка у поля комментария (перед микрофоном, а если его нет — перед «Отправить»)
        onDom(function stickerButton() {
            const row = document.querySelector('.' + SELECTORS.stickerContainer);
            if (!row || row.querySelector('.sticker-btn')) return;
            const before = row.querySelector('.' + SELECTORS.stickerMicBtn) || row.querySelector('.' + SELECTORS.stickerSendBtn);
            if (!before) return;
            stickerBtn = el('button', 'sticker-btn', ICONS.STICKER_BUTTON);
            stickerBtn.onmouseenter = showPanel;
            stickerBtn.onmouseleave = () => hidePanel(300);
            row.insertBefore(stickerBtn, before);
        });
    })();

    let messagesOverlay = null;

    // Сообщений на ИТД нет — кнопка открывает «чат», где сервер сначала печатает,
    // а потом отвечает шуткой. «Ещё раз» — новая шутка, Esc или клик мимо — закрыть.
    // Ответы бота «Сервер ИТД» в личке (прототип: сообщения никуда не уходят — бот над этим и шутит)
    const MESSAGE_JOKES = [
        ['📨', 'Твоё сообщение отправлено. Куда — лучше не спрашивай'],
        ['🐌', 'Доставляем почтой России. Ориентировочно — к следующему обновлению сайта'],
        ['🧠', 'Я прочитал твоё сообщение. Потом забыл. Прототип, что с меня взять'],
        ['🔌', 'Сервер на месте. Сообщений нет. Ищем, кто выдернул провод'],
        ['🕳️', 'Сообщение улетело в /dev/null. Там тихо и уютно, ему понравится'],
        ['🧾', 'Статус доставки: «доставлено в мечтах»'],
        ['🤖', 'Я бы ответил по-человечески, но меня писали в три ночи'],
        ['📶', 'Одна палочка связи. Подними телефон повыше. Ещё выше. Почти'],
        ['🪄', 'Отправка сообщений — это магия. Магию пока не завезли'],
        ['🧊', 'Собеседник заморожен до релиза лички. Разморозим — передадим'],
        ['🐢', 'Загрузка чата: ██░░░░░░░░ 20%. Можешь пока погладить кота'],
        ['🗑️', 'Сохранил твоё сообщение в самое надёжное место — в оперативку. До перезагрузки'],
        ['👻', 'Кто-то печатает... а, это ты'],
        ['🎰', 'Шанс, что сообщение дойдёт: 0%. Но крутить можно сколько угодно'],
        ['📜', 'Пользовательское соглашение, пункт 404: личка не найдена'],
        ['🥷', 'Твоё сообщение настолько секретное, что его не видит даже сервер'],
        ['🐦', 'Голубь с твоим сообщением взял больничный'],
        ['⌛', 'Ответ поступит в течение 3–5 рабочих обновлений'],
        ['🎧', 'Я тебя внимательно не слышу. Но киваю'],
        ['🍝', 'Код лички сейчас как макароны: вкусно, но не работает'],
        ['🧪', 'Ты участвуешь в эксперименте. Контрольная группа — тоже ты'],
        ['🛸', 'Сообщение похитили инопланетяне. Обещали вернуть с пометкой «переслано»'],
        ['📦', 'Посылка с перепиской застряла на таможне ИТД'],
        ['🔁', 'Ты пишешь — я шучу. Идеальный диалог, повторим?'],
        ['💤', 'Бэкенд спит. Не буди — он злой спросонья'],
        ['🧯', 'Пробовали запустить личку. Потушили. Пробуем снова'],
        ['🎮', 'Личка: уровень 1. До разблокировки отправки — 9 999 опыта'],
        ['🕵️', 'Модерация проверила твоё сообщение и ушла на обед'],
        ['🍿', 'Поболтал бы, но у меня тут прототип на плите'],
        ['🧩', 'Не хватает одного кусочка пазла. Сервера'],
    ];
    const BOT_HELLO = [['👋', 'Привет! Я всё запомню. Ровно до обновления страницы'], ['🫡', 'Здравия желаю! Сообщения — пока нет, а бот — вот он']];
    const BOT_ASK = [['🤔', 'Отличный вопрос. Отвечу, как только личка заработает'], ['🔮', 'Шар предсказаний говорит: «спроси, когда выйдет релиз»']];

    // ================= Личка: прототип сообщений =================
    // Пока не рабочий: диалоги и переписка — примеры, отправленное видно только тебе. Открывается как
    // страница, но это окно поверх: на телефоне — весь экран над нижней панелью (панель остаётся сверху,
    // активный пункт — «Личка»), на компьютере — на месте ленты, меню и правая панель на месте.
    // «Назад» (кнопка браузера или телефона) закрывает, как при обычном переходе.
    // Диалоги: бот «Сервер ИТД» и все, у кого стоит ИТД X (тот же список, что в «Клубе ИТД X»).
    // Переписки пока нет — пусто, пока не напишешь; ничего не сохраняется.
    const MSG_BOT = { id: 'bot', ava: '🤖', name: 'Сервер ИТД', login: '', last: 'Напиши что-нибудь — отвечу. Честно', time: 'сейчас', unread: 1, online: true, bot: true,
        msgs: [['in', 'Привет! Я — Сервер ИТД. Личка пока в разработке 🛠️'], ['in', 'Сообщения никуда не уходят, зато я отвечаю. Проверь 😏']] };
    // Поддержка ИТД X — отдельный чат: пишешь проблему или идею, отвечает «оператор» (пока тоже прототип)
    const MSG_SUPPORT = { id: 'support', ava: '🛟', name: 'Поддержка ИТД X', login: '', last: 'Нашёл баг или есть идея — пиши сюда', time: '', unread: 0, online: true, support: true,
        msgs: [['in', 'Привет! Это поддержка ИТД X 👋'], ['in', 'Нашёл баг или есть идея — опиши здесь. Личка пока прототип, так что быстрее всего — в тг @NeuroSFW']] };
    let supportTicket = 0;
    let MSG_DIALOGS = [MSG_BOT, MSG_SUPPORT];
    // закреплённые чаты (как в Telegram): id по порядку закрепления, хранятся в настройках скрипта
    const msgPins = () => GM_getValue('msgPins', []);
    function sortDialogs(list) {
        const pins = msgPins();
        return [...list.filter(d => pins.includes(d.id)).sort((a, b) => pins.indexOf(a.id) - pins.indexOf(b.id)), ...list.filter(d => !pins.includes(d.id))];
    }
    const msgPeople = new Map();                        // логин → диалог (переписка живёт, пока открыта вкладка)
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
        }));
        onUpdate();
    }
    const MSG_ICON = {
        back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
        edit: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z"/><path d="M13.5 6.5l4 4"/></svg>',
        search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
        more: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
        clip: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5 12.5 19a5 5 0 0 1-7-7L13 4.5a3.3 3.3 0 0 1 4.7 4.7l-7.4 7.4a1.7 1.7 0 0 1-2.4-2.4l6.7-6.7"/></svg>',
        smile: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01" stroke-width="2.6"/></svg>',
        send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>',
        pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15 3l6 6-3 1-4 4 .5 4.5-1.5 1.5-4-4-5 5-1-1 5-5-4-4L5.5 9.5 10 10l4-4Z"/></svg>'
    };

    function buildMessagesOverlay() {
        const style = document.createElement('style');
        style.textContent = `
        .vp-msgs { position: fixed; z-index: 5; display: none; flex-direction: column; box-sizing: border-box; overflow: hidden;
            background: var(--bg-primary, #000); color: var(--text-primary, #fff); font-family: inherit; }
        .vp-msgs.vp-open { display: flex; animation: vpMsgsIn .22s cubic-bezier(.2, .8, .2, 1); }
        html.vp-msgs-open .vp-msgs-navwrap { z-index: 10 !important; }
        html.vp-msgs-open .itd-scroll-top-btn { opacity: 0 !important; visibility: hidden !important; }
        /* поле комментария страницы поста закреплено поверх всего (z-index 100) и лежало на окне лички */
        html.vp-msgs-open .vp-comments-sheet { visibility: hidden !important; }
        /* сайт всё ещё считает текущим свой пункт (ленту, профиль): пока открыта личка, у него вид обычного
           пункта, у «Сообщений» — вид текущего. Вид снимаем с самих пунктов (msgsNavLook): у сайта он разный —
           на компьютере неактивные полупрозрачные, на телефоне серые; раньше всё красилось серым и тускнело */
        html.vp-msgs-open .vp-nav-link.vp-site-cur { color: var(--vp-off-c) !important; opacity: var(--vp-off-o) !important; background-color: var(--vp-off-b) !important; }
        html.vp-msgs-open .vp-nav-link[href="#"] { color: var(--vp-on-c) !important; opacity: var(--vp-on-o) !important; background-color: var(--vp-on-b) !important; }
        /* компьютер: окно — карточка, как блоки сайта, а не кусок страницы того же цвета */
        .vp-msgs.vp-card { border-radius: 36px; border: 1px solid var(--border-color, rgba(255, 255, 255, .15));
            background: #141414; box-shadow: 0 16px 48px rgba(0, 0, 0, .45); }
        html.vp-light .vp-msgs.vp-card { background: #fff; box-shadow: 0 16px 48px rgba(0, 0, 0, .12); }
        /* под карточкой — вся колонка цветом страницы: в отступах сверху и снизу не видно ленты */
        .vp-msgs-under { position: fixed; top: 0; bottom: 0; z-index: 4; display: none; background: var(--bg-primary, #000); pointer-events: none; }
        html.vp-msgs-open .vp-msgs-under.vp-on { display: block; }
        .vp-msgs-view { display: flex; flex-direction: column; min-height: 0; flex: 1; }
        .vp-msgs-view[hidden] { display: none; }
        .vp-msgs-top { display: flex; align-items: center; gap: 10px; padding: 18px 16px 10px; }
        .vp-msgs-title { font-size: 24px; font-weight: 700; margin-right: auto; }
        .vp-msgs-ib { width: 40px; height: 40px; border-radius: 50%; border: 0; padding: 0; display: flex; align-items: center; justify-content: center;
            cursor: pointer; background: var(--block-bg, #1c1c1c); color: var(--text-primary, #fff); flex-shrink: 0; }
        .vp-msgs-ib:active { transform: scale(.94); }
        .vp-msgs-search { margin: 0 16px 10px; display: flex; align-items: center; gap: 8px; padding: 0 14px; height: 42px; border-radius: 999px;
            background: var(--block-bg, #1c1c1c); color: var(--text-secondary, #8a8a8a); }
        .vp-msgs-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--text-primary, #fff); font: inherit; font-size: 15px; }
        .vp-msgs-sub { padding: 2px 20px 8px; font-size: 13px; font-weight: 600; color: var(--text-secondary, #8a8a8a); }
        .vp-msgs-ava img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .vp-msgs-who, .vp-msgs-chead .vp-msgs-ava { cursor: pointer; }
        .vp-msgs-list { flex: 1; overflow-y: auto; padding: 0 8px 12px; overscroll-behavior: contain; }
        .vp-msgs-row { display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: 18px; cursor: pointer; }
        .vp-msgs-row:hover, .vp-msgs-row:active { background: var(--block-bg, #1c1c1c); }
        .vp-msgs-ava { position: relative; width: 50px; height: 50px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
            font-size: 26px; background: var(--block-bg, #1c1c1c); }
        .vp-msgs-ava.vp-sm { width: 38px; height: 38px; font-size: 20px; }
        .vp-msgs-ava.vp-online::after { content: ""; position: absolute; right: 1px; bottom: 1px; width: 11px; height: 11px; border-radius: 50%;
            background: #22c55e; box-shadow: 0 0 0 2.5px var(--bg-primary, #000); }
        .vp-msgs-mid { flex: 1; min-width: 0; }
        .vp-msgs-name { display: flex; align-items: center; gap: 5px; font-weight: 600; font-size: 15px; }
        .vp-msgs-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-msgs-last { margin-top: 3px; font-size: 14px; color: var(--text-secondary, #8a8a8a); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-msgs-side { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; font-size: 12px; color: var(--text-secondary, #8a8a8a); }
        .vp-msgs-badge { min-width: 20px; height: 20px; padding: 0 6px; box-sizing: border-box; border-radius: 999px; display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: 700; background: var(--vp-accent, #0080ff); color: var(--vp-on-accent, #fff); }
        .vp-msgs-pin { display: flex; color: var(--text-secondary, #8a8a8a); }
        .vp-msgs-row.vp-pinned { background: color-mix(in srgb, var(--text-primary, #fff) 4%, transparent); }
        .vp-msgs-row.vp-pinned + .vp-msgs-row:not(.vp-pinned) { margin-top: 6px; }
        .vp-msgs-row { -webkit-touch-callout: none; user-select: none; transition: transform .15s; }
        .vp-msgs-row.vp-held { transform: scale(.97); }
        .vp-msgs-ctx { position: absolute; z-index: 3; display: none; padding: 5px; border-radius: 16px; min-width: 170px;
            background: var(--block-bg, #1c1c1c); border: 1px solid var(--border-color, rgba(255, 255, 255, .1)); box-shadow: 0 10px 30px rgba(0, 0, 0, .45); }
        .vp-msgs-ctx.vp-open { display: block; animation: vpMsgsCtx .14s ease-out; }
        @keyframes vpMsgsCtx { from { opacity: 0; transform: scale(.94); } }
        .vp-msgs-ctx button { display: flex; align-items: center; gap: 10px; width: 100%; border: 0; background: none; color: var(--text-primary, #fff);
            font: inherit; font-size: 15px; padding: 10px 12px; border-radius: 12px; cursor: pointer; }
        .vp-msgs-ctx button:hover, .vp-msgs-ctx button:active { background: var(--bg-hover, rgba(255, 255, 255, .08)); }
        .vp-msgs-ctx svg { width: 16px; height: 16px; }
        .vp-msgs-empty { padding: 40px 16px; text-align: center; color: var(--text-secondary, #8a8a8a); font-size: 14px; }
        .vp-msgs-chead { display: flex; align-items: center; gap: 10px; padding: 12px 12px 10px;
            border-bottom: 1px solid color-mix(in srgb, var(--text-primary, #fff) 8%, transparent); }
        .vp-msgs-who { display: flex; flex-direction: column; min-width: 0; margin-right: auto; }
        .vp-msgs-who b { font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-msgs-who small { font-size: 12px; color: var(--text-secondary, #8a8a8a); }
        .vp-msgs-feed { flex: 1; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; overscroll-behavior: contain; }
        .vp-msgs-note { align-self: center; margin: 2px 0 8px; padding: 6px 12px; border-radius: 999px; font-size: 12px;
            background: var(--block-bg, #1c1c1c); color: var(--text-secondary, #8a8a8a); text-align: center; }
        .vp-msgs-b { max-width: 78%; padding: 9px 13px 7px; border-radius: 20px; font-size: 15px; line-height: 1.35; overflow-wrap: anywhere;
            animation: vpMsgsPop .2s ease-out; }
        .vp-msgs-b.vp-in { align-self: flex-start; background: var(--block-bg, #1c1c1c); border-bottom-left-radius: 6px; }
        .vp-msgs-b.vp-out { align-self: flex-end; background: var(--vp-accent, #0080ff); color: var(--vp-on-accent, #fff); border-bottom-right-radius: 6px; }
        .vp-msgs-b i { display: block; margin-top: 2px; font-style: normal; font-size: 11px; opacity: .6; text-align: right; }
        .vp-msgs-b.vp-fail i { opacity: .85; }
        .vp-msgs-typing { display: flex; gap: 5px; padding: 14px 16px; }
        .vp-msgs-typing span { width: 7px; height: 7px; border-radius: 50%; background: var(--text-secondary, #8a8a8a); animation: vpMsgsDot 1s infinite; }
        .vp-msgs-typing span:nth-child(2) { animation-delay: .15s; } .vp-msgs-typing span:nth-child(3) { animation-delay: .3s; }
        .vp-msgs-bar { display: flex; align-items: flex-end; gap: 8px; padding: 10px 12px 12px; }
        .vp-msgs-field { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; padding: 0 6px 0 14px; min-height: 44px; border-radius: 22px;
            background: var(--block-bg, #1c1c1c); }
        .vp-msgs-field input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--text-primary, #fff); font: inherit; font-size: 15px; }
        .vp-msgs-ghost { width: 36px; height: 36px; border: 0; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            background: transparent; color: var(--text-secondary, #8a8a8a); cursor: pointer; flex-shrink: 0; }
        .vp-msgs-send { width: 44px; height: 44px; border: 0; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;
            flex-shrink: 0; background: var(--vp-accent, #0080ff); color: var(--vp-on-accent, #fff); transition: opacity .15s, transform .15s; }
        .vp-msgs-send:disabled { opacity: .4; cursor: default; }
        .vp-msgs-send:not(:disabled):active { transform: scale(.92); }
        @keyframes vpMsgsIn { from { opacity: 0; transform: translateY(10px); } }
        @keyframes vpMsgsPop { from { opacity: 0; transform: translateY(6px) scale(.98); } }
        @keyframes vpMsgsDot { 0%, 60%, 100% { opacity: .35; transform: none; } 30% { opacity: 1; transform: translateY(-3px); } }
        @media (prefers-reduced-motion: reduce) { .vp-msgs, .vp-msgs * { animation: none !important; } }
        /* пока открыто, видео под ним прячем: Яндекс.Браузер видит палец/курсор над видео сквозь окно
           и выкладывает свою панель («Субтитры», картинка в картинке) поверх */
        html.vp-msgs-open video { visibility: hidden !important; }`;
        document.head.appendChild(style);

        const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const root = document.createElement('div');
        root.className = 'vp-msgs';
        // Колесо и палец над окном крутят только список и переписку. Где крутить нечего (короткий список,
        // шапка, поле ввода) — никуда: раньше прокрутка уходила странице, и лента с тенями ехала за окном.
        const blockOuterScroll = e => {
            const area = e.target.closest && e.target.closest('.vp-msgs-list, .vp-msgs-feed, textarea');
            if (!area || area.scrollHeight <= area.clientHeight) e.preventDefault();
        };
        root.addEventListener('wheel', blockOuterScroll, { passive: false });
        root.addEventListener('touchmove', blockOuterScroll, { passive: false });
        root.setAttribute('role', 'region');          // это «страница», не всплывающее окно: без затемнения сайта под окнами
        root.setAttribute('aria-label', 'Сообщения');
        root.innerHTML = `
            <section class="vp-msgs-view vp-msgs-home">
                <div class="vp-msgs-top"><div class="vp-msgs-title">Сообщения</div>
                    <button class="vp-msgs-ib vp-msgs-new" title="Новый чат (пока не работает)">${MSG_ICON.edit}</button></div>
                <label class="vp-msgs-search">${MSG_ICON.search}<input type="search" placeholder="Поиск"></label>
                <div class="vp-msgs-sub"></div>
                <div class="vp-msgs-list"></div>
            </section>
            <section class="vp-msgs-view vp-msgs-chat" hidden>
                <div class="vp-msgs-chead"><button class="vp-msgs-ib vp-msgs-back" title="Назад">${MSG_ICON.back}</button>
                    <div class="vp-msgs-ava vp-sm"></div><div class="vp-msgs-who"><b></b><small></small></div>
                    <button class="vp-msgs-ib" title="Ещё (пока не работает)">${MSG_ICON.more}</button></div>
                <div class="vp-msgs-feed" aria-live="polite"></div>
                <form class="vp-msgs-bar"><div class="vp-msgs-field"><button type="button" class="vp-msgs-ghost" title="Вложение (пока не работает)">${MSG_ICON.clip}</button>
                    <input type="text" placeholder="Сообщение" enterkeyhint="send" autocomplete="off">
                    <button type="button" class="vp-msgs-ghost" title="Эмодзи (пока не работает)">${MSG_ICON.smile}</button></div>
                    <button type="submit" class="vp-msgs-send" title="Отправить" disabled>${MSG_ICON.send}</button></form>
            </section>`;
        document.body.appendChild(root);
        const under = document.createElement('div');
        under.className = 'vp-msgs-under';
        document.body.appendChild(under);

        const $ = s => root.querySelector(s);
        const list = $('.vp-msgs-list'), home = $('.vp-msgs-home'), chat = $('.vp-msgs-chat'), feed = $('.vp-msgs-feed');
        const input = $('.vp-msgs-bar input'), send = $('.vp-msgs-send'), search = $('.vp-msgs-search input');
        let current = null, botTimer = 0, lastJoke = -1;
        const isUrl = a => /^https?:|^\//.test(a);
        const avaHtml = a => isUrl(a) ? `<img src="${esc(a)}" alt="">` : esc(a);

        function renderList() {
            const q = search.value.trim().toLowerCase();
            const pins = msgPins();
            const rows = sortDialogs(MSG_DIALOGS).filter(d => !q || (d.name + ' ' + d.login + ' ' + d.last).toLowerCase().includes(q));
            const people = MSG_DIALOGS.filter(d => d.login).length;
            $('.vp-msgs-sub').textContent = people ? `Сервер ИТД, поддержка и ${people} ${plural(people, 'человек', 'человека', 'человек')} с ИТД X` : 'Пока никого с ИТД X — список обновится сам';
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
        function bubble(dir, text, meta) {
            const b = document.createElement('div');
            b.className = 'vp-msgs-b vp-' + dir;
            b.textContent = text;
            const i = document.createElement('i');
            i.textContent = meta || now();
            b.appendChild(i);
            feed.appendChild(b);
            feed.scrollTop = feed.scrollHeight;
            return b;
        }
        function openChat(d) {
            current = d;
            d.unread = 0;
            $('.vp-msgs-chead .vp-msgs-ava').innerHTML = avaHtml(d.ava);
            $('.vp-msgs-chead .vp-msgs-ava').classList.toggle('vp-online', !!d.online);
            $('.vp-msgs-who b').textContent = d.name;
            $('.vp-msgs-who small').textContent = d.bot ? 'бот · всегда в сети' : d.support ? 'поддержка · на связи' : '@' + d.login + ' · с ИТД X';
            feed.innerHTML = '<div class="vp-msgs-note">🧪 Прототип: сообщения пока никуда не отправляются и не сохраняются</div>'
                + (d.msgs.length ? '<div class="vp-msgs-note">Сегодня</div>' : `<div class="vp-msgs-note">Это начало переписки с ${esc(d.name)}</div>`);
            d.msgs.forEach(([dir, text]) => bubble(dir, text, dir === 'out' ? now() + ' ✓✓' : now()));
            home.hidden = true; chat.hidden = false;
            input.value = ''; send.disabled = true;
        }
        function closeChat() {
            clearTimeout(botTimer);
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

        // Закрепить / открепить чат — долгое нажатие (телефон) или правый клик (компьютер), как в Telegram
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
                GM_setValue('msgPins', pins);
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
            if (!r || e.button > 0) return;
            held = false; holdAt = [e.clientX, e.clientY];
            clearTimeout(holdT);
            holdT = setTimeout(() => { held = true; if (navigator.vibrate) navigator.vibrate(12); showCtx(r, holdAt[0], holdAt[1]); }, 450);
        });
        list.addEventListener('pointermove', e => { if (holdAt && Math.hypot(e.clientX - holdAt[0], e.clientY - holdAt[1]) > 8) clearTimeout(holdT); });
        ['pointerup', 'pointercancel'].forEach(t => list.addEventListener(t, () => { clearTimeout(holdT); holdAt = null; }));
        list.addEventListener('contextmenu', e => {
            const r = e.target.closest('.vp-msgs-row');
            if (!r) return;
            e.preventDefault();
            clearTimeout(holdT);
            if (!held) showCtx(r, e.clientX, e.clientY);
            held = true;
        });
        root.addEventListener('pointerdown', e => { if (!ctx.contains(e.target)) hideCtx(); }, true);
        list.addEventListener('scroll', hideCtx, { passive: true });

        list.addEventListener('click', e => {
            const r = e.target.closest('.vp-msgs-row');
            if (held) { held = false; return; }                  // это было долгое нажатие — чат не открываем
            if (r) openChat(MSG_DIALOGS.find(d => d.id === r.dataset.id));
        });
        // шапка чата: имя или аватар — в профиль человека
        root.querySelectorAll('.vp-msgs-who, .vp-msgs-chead .vp-msgs-ava').forEach(el => el.onclick = () => {
            if (!current || !current.login) return;
            const login = current.login;
            close(true);
            openProfile(login);
        });
        search.addEventListener('input', renderList);
        $('.vp-msgs-back').onclick = closeChat;
        input.addEventListener('input', () => { send.disabled = !input.value.trim(); });
        $('.vp-msgs-bar').addEventListener('submit', e => {
            e.preventDefault();
            const text = input.value.trim();
            if (!text || !current) return;
            input.value = ''; send.disabled = true;
            current.msgs.push(['out', text]);
            current.last = 'Ты: ' + text; current.time = now();
            if (current.bot) { bubble('out', text, now() + ' ✓'); botReply(); }
            else if (current.support) { bubble('out', text, now() + ' ✓'); supportReply(); }
            else bubble('out', text, now() + ' · не отправлено (прототип)').classList.add('vp-fail');
        });

        // место окна: телефон — весь экран, панель поднимаем над окном; компьютер — колонка ленты
        function place() {
            const nav = document.querySelector('.' + SELECTORS.nav);
            // нижняя панель телефона — меню в строку внизу экрана (не левое меню компьютера)
            const row = nav && navIsRow(nav) && nav.getBoundingClientRect().top > innerHeight / 2;
            document.querySelectorAll('.vp-msgs-navwrap').forEach(w => w.classList.remove('vp-msgs-navwrap'));
            if (row) {
                if (nav.parentElement) nav.parentElement.classList.add('vp-msgs-navwrap');
                const bottom = innerHeight - nav.getBoundingClientRect().top + BUMP_H + 8;
                Object.assign(root.style, { left: '0px', right: '0px', top: '0px', bottom: '0px', width: '', borderRadius: '', paddingBottom: bottom + 'px' });
            } else {
                const cb = contentBox() || lastCb;
                const left = cb ? cb.left : Math.max(0, innerWidth / 2 - 300), width = cb ? cb.right - cb.left : Math.min(600, innerWidth);
                Object.assign(root.style, { left: left + 'px', width: width + 'px', right: '', top: '12px', bottom: '12px', borderRadius: '', paddingBottom: '0px' });
            }
            root.classList.toggle('vp-card', !row);
            under.classList.toggle('vp-on', !row);
            if (!row) Object.assign(under.style, { left: root.style.left, width: root.style.width });
        }
        let pushed = false, openPath = '';
        function onKey(e) { if (e.key === 'Escape' && root.classList.contains('vp-open')) { e.stopPropagation(); current ? closeChat() : close(); } }
        function close(fromHistory) {
            if (!root.classList.contains('vp-open')) return;
            clearTimeout(botTimer);
            root.classList.remove('vp-open');
            document.documentElement.classList.remove('vp-msgs-open');
            document.querySelectorAll('.vp-msgs-navwrap').forEach(w => w.classList.remove('vp-msgs-navwrap'));
            document.removeEventListener('keydown', onKey, true);
            removeEventListener('resize', place);
            msgsOpen = false;
            markActiveNav(); moveNavBlob();
            if (pushed && !fromHistory) { pushed = false; history.back(); }
            pushed = false;
        }
        addEventListener('popstate', () => { if (root.classList.contains('vp-open')) close(true); });
        // нажали другой пункт меню той же страницы (открыли личку на ленте и жмут «Ленту») — сайт никуда
        // не переходит, а личку закрыть надо; на другую страницу — закроет msgsLeft ниже
        document.addEventListener('click', e => {
            if (!root.classList.contains('vp-open')) return;
            const a = e.target.closest && e.target.closest('a.' + SELECTORS.navLink);
            // тот же пункт — только закрыть личку: иначе сайт считает это повторным нажатием и обновляет страницу
            if (a && a.getAttribute('href') !== '#' && a.getAttribute('href') === location.pathname) { e.preventDefault(); e.stopPropagation(); close(); }
        }, true);
        // перешли на другую страницу (пункт меню, ссылка) — «страница» лички закрывается
        onDom(function msgsLeft() { if (root.classList.contains('vp-open') && location.pathname !== openPath) close(true); });
        root.open = () => {
            if (root.classList.contains('vp-open')) { if (current) closeChat(); return; }
            openPath = location.pathname;
            msgsOpen = true;
            closeChat();
            loadMsgPeople(() => { if (!current) renderList(); });
            place();
            root.classList.add('vp-open');
            document.documentElement.classList.add('vp-msgs-open');
            document.addEventListener('keydown', onKey, true);
            addEventListener('resize', place);
            history.pushState({ vpMsgs: 1 }, '', location.href);
            pushed = true;
            markActiveNav(); moveNavBlob();
        };
        root.close = close;
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

        messagesLink = document.createElement('a');
        messagesLink.href = '#';
        const siteLinks = [...nav.querySelectorAll(':scope > a')]
            .filter(a => a.getAttribute('href') !== '#' && a.querySelector(':scope > span svg'));
        messagesLink.className = (commonClasses(siteLinks) + ' ' + SELECTORS.navLink).trim();

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
    // Нажатие на «Личку» — один обработчик на всю страницу: кнопку сайт перерисовывает вместе с меню
    // (и она может остаться от прошлой копии скрипта), а окно создаём при первом открытии
    document.addEventListener('click', e => {
        const a = e.target.closest && e.target.closest('nav a[href="#"]');
        if (!a || !a.closest('.' + SELECTORS.nav)) return;
        e.preventDefault();
        if (!messagesOverlay) messagesOverlay = buildMessagesOverlay();
        messagesOverlay.open();
    }, true);
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
    // Бугорок — одна плавная кривая-«колокол» шириной BUMP_W и высотой BUMP_H над краем панели:
    // касательные горизонтальны у краёв и на вершине, без стыков разных дуг — без резкого пика.
    // «+» (BUMP px) — по центру, чуть над краем панели (BUMP_UP): пункты панели не задевает.
    const BUMP = 40, BUMP_UP = 5, BUMP_W = 160, BUMP_H = 21, BUMP_LIFT = BUMP_H;
    // контур «скруглённая панель + бугорок»: w×h панели, её верх — на y = top
    function bumpPath(w, h, top) {
        const r = h / 2, cx = w / 2, half = BUMP_W / 2, peak = top - BUMP_H, n = v => +v.toFixed(2);
        return `M${r} ${top}H${n(cx - half)}`
            + `C${n(cx - half * .45)} ${top} ${n(cx - half * .42)} ${peak} ${cx} ${peak}`
            + `C${n(cx + half * .42)} ${peak} ${n(cx + half * .45)} ${top} ${n(cx + half)} ${top}`
            + `H${w - r}A${r} ${r} 0 0 1 ${w - r} ${top + h}H${r}A${r} ${r} 0 0 1 ${r} ${top}Z`;
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
            position: relative;
            border: none !important;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2) !important;
            animation: postAppear 0.3s ease-out forwards !important;
            --vp-edge-a: rgba(255, 255, 255, .08); --vp-edge-b: rgba(255, 255, 255, .08);   /* без наведения — как было: ровная 1px */
        }
        /* Обводка — линия в 1 px слоем поверх края (маска оставляет только кромку), а не border: так ей можно
           дать градиент при наведении (сверху светлее, книзу тает — как у стекла ИТД), и ничего не сдвигается */
        article.vp-post::before {
            content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none; z-index: 1;
            background: linear-gradient(to bottom, var(--vp-edge-a), var(--vp-edge-b));
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor;
            mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
            transition: opacity .25s ease;
        }

        /* наведение — только где есть мышь (на телефоне :hover «залипает» после касания): та же обводка, того же
           цвета, что у поста уже есть, только ярче сверху (книзу — как обычно), та же толщина; цвет стиля не берём.
           Включается переключателем «Подсветка постов» (класс vp-post-hl на <html>, ставит paint) */
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
        /* наведение — только там, где есть мышь: на телефоне касание «залипало» подсветкой кнопки */
        @media (hover: hover) {
        .vp-post-action:hover {
            background: rgba(0, 128, 255, 0.15) !important;
            transform: translateY(-2px) !important;
        }
        .vp-avatar-link:hover {
            transform: scale(1.05) !important;
        }
        }
        /* телефон: подсветку наведения сайта у лайка/коммента/репоста тоже снимаем, отклик — только при нажатии */
        @media (hover: none) {
            .vp-post-action:hover { background: transparent !important; transform: none !important; }
            /* цвет при касании — тот же, что при наведении на компьютере, пока палец на кнопке */
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
        /* значки: свой (voronoi) и «пользуется модом» (verify); размер — --vp-badge у значка */
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
        /* прозрачность до появления задаёт сама анимация (both), а не opacity: 0 у пункта: иначе при
           «меньше движения» (анимация выключена ниже) пункты оставались невидимыми — пустые уведомления */
        .vp-notif {
            animation: notificationAppear 0.3s ease-out both !important;
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

    // Размытый фон поста: под карточкой с картинкой — её размытая копия ровно на месте картинки
    // и тёмная вуаль поверх. Слои — .itd-blur-container > .vp-blur-img + .vp-blur-dim, вид — в CSS;
    // в style.* только то, что считается: адрес картинки и место слоя.
    // Место пересчитывает один общий ResizeObserver на все карточки (был свой на каждую пересборку
    // и не отключался — копились на длинной ленте).
    const blurCards = new Map();                            // карточка → { img, layer }
    const blurRO = new ResizeObserver(entries => {
        const todo = new Set(entries.map(e => blurCards.has(e.target) ? e.target : e.target._vpBlurCard));
        todo.forEach(card => card && placeBlur(card));
    });
    function placeBlur(card) {
        const b = blurCards.get(card);
        if (!b) return;
        // карточка ушла со страницы: снимаем, а метку картинки сбрасываем — вернётся, фон соберётся заново
        if (!b.img.isConnected || !card.isConnected) { b.img._vpBlurDone = null; dropBlur(card); return; }
        const ar = card.getBoundingClientRect(), ir = b.img.getBoundingClientRect();
        if (!ar.width || !ir.width) return;
        const k = card.offsetWidth / ar.width;              // сцена ленты чуть масштабирует пост
        Object.assign(b.layer.style, {
            left: ((ir.left - ar.left) * k - card.clientLeft) + 'px', top: ((ir.top - ar.top) * k - card.clientTop) + 'px',
            width: ir.width * k + 'px', height: ir.height * k + 'px'
        });
    }
    // снять фон с карточки целиком (пост без картинки, выключили настройку, карточка ушла со страницы)
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
        // только свой слой: у поста с репостом внутри querySelector без :scope находил слой репоста
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
        // Идём от картинок, а не от всех постов: посты без картинки иначе перебирались на каждую правку страницы
        const cards = new Set();
        // метка — адрес картинки: сайт переиспользует карточки и картинки, и фон от прошлого поста оставался
        // (фон карточки берётся с её ПЕРВОЙ картинки — с ней и сравниваем: в посте с несколькими картинками
        // сравнение с каждой давало вечную пересборку фона)
        document.querySelectorAll('img.' + SELECTORS.postMedia).forEach(img => {
            if (img._vpBlurDone === img.src) return;      // её карточки уже с фоном от неё
            let pending = false;
            for (const card of [img.closest('.' + SELECTORS.repost), img.closest('article.' + SELECTORS.post)]) {
                const first = card && card.querySelector('img.' + SELECTORS.postMedia);
                if (card && first && card.getAttribute('data-blur-bg') !== first.src) { cards.add(card); pending = true; }
            }
            if (!pending) img._vpBlurDone = img.src;
        });
        // в карточку пришёл пост без картинки — старое размытие убираем
        document.querySelectorAll('[data-blur-bg]').forEach(card => {
            if (!card.querySelector('img.' + SELECTORS.postMedia)) dropBlur(card);
        });
        cards.forEach(card => {
            const img = card.querySelector('img.' + SELECTORS.postMedia);
            if (!img || !img.src || img.src.includes('avatar')) return;
            // пост, у которого картинка только в репосте, тоже получает свой слой от неё: без слоя карточка
            // была прозрачной насквозь (просвечивал фон страницы)
            buildBlur(card, img);
        });
    }

    const styleBlurPosts = document.createElement('style');
    styleBlurPosts.textContent = `
        .vp-post.itd-blur-active, .vp-repost.itd-blur-active {
            background: transparent !important;
            backdrop-filter: none !important;
        }
        .vp-blur-rel { position: relative; }
        .itd-blur-container {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: inherit; overflow: hidden;
            z-index: -1; pointer-events: none; background: var(--block-bg, #1c1c1c);
        }
        /* свечение — ровно на месте картинки и её размера (место ставит placeBlur) */
        .vp-blur-img {
            position: absolute; left: 0; top: 0; width: 0; height: 0;
            background: center / cover no-repeat;
            filter: blur(34px) brightness(1.3) saturate(1.6); transform: scale(1.3);
        }
        .vp-blur-dim { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.45); }
        .itd-blur-active .vp-repost {
            background: rgba(0, 0, 0, 0.3) !important;
        }
        /* светлая тема: вуаль светлая — тёмная делала карточку серой на светлой странице */
        html.vp-light .vp-blur-dim { background: rgba(255, 255, 255, 0.55); }
        html.vp-light .itd-blur-active .vp-repost { background: rgba(255, 255, 255, 0.35) !important; }
        .vp-post .blur-bg-layer, .vp-post .blur-overlay,
        .vp-repost .blur-bg-layer, .vp-repost .blur-overlay {
            display: none !important;
        }
    `;
    document.head.appendChild(styleBlurPosts);

    onDom(function postBlur() { if (postBlurEnabled) addBlurBackground(); });

    // ==== анти цензура
    // Картинка уходит на сайт как .gif: меняются имя и тип файла, содержимое то же.
    // Подмена одна — gifFile; выбор файла, перетаскивание и отправка через XHR зовут её
    // и смотрят выключатель в момент срабатывания, поэтому вкл/выкл действует без перезагрузки.
    function gifFile(file) {
        if (!(file instanceof File) || !file.type.startsWith('image/') || file.type === 'image/gif') return file;
        return new File([file], file.name.replace(/\.[^.]+$/, '') + '.gif', { type: 'image/gif' });
    }
    // список файлов с подменой; null — подменять нечего
    function gifTransfer(files) {
        if (!antiCensorshipEnabled || !files || ![...files].some(f => gifFile(f) !== f)) return null;
        const dt = new DataTransfer();
        for (const f of files) dt.items.add(gifFile(f));
        return dt;
    }
    // поле выбора картинок: подменяем выбранное до обработчиков сайта (перехват на document)
    function gifOnPick(e) {
        const input = e.target;
        if (!(input instanceof HTMLInputElement) || input.type !== 'file') return;
        if (!/\.(jpe?g|png|gif|webp)|image\//i.test(input.accept || '')) return;
        const dt = gifTransfer(input.files);
        if (dt) input.files = dt.files;
    }
    // браузер шлёт сначала input, потом change — сайт может слушать любое
    document.addEventListener('input', gifOnPick, true);
    document.addEventListener('change', gifOnPick, true);
    // перетаскивание: гасим настоящий drop и повторяем его с подменёнными файлами
    // там же, куда бросили; в повторе подменять уже нечего, он проходит к сайту
    document.addEventListener('drop', function (e) {
        const dt = gifTransfer(e.dataTransfer && e.dataTransfer.files);
        if (!dt) return;
        e.preventDefault();
        e.stopPropagation();
        e.target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY }));
    }, true);
    // без этого картинка, брошенная мимо поля, открывается вместо страницы
    document.addEventListener('dragover', function (e) { if (antiCensorshipEnabled) e.preventDefault(); }, true);
    // отправка через XHR — на случай, если файл дошёл до сайта мимо поля выбора
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

    // ==== подмена текстов ошибок
    // Только сообщения об ошибках — всплывашки сайта (role=alert/status, aria-live) с текстом
    // про ошибку: текст меняется на случайную фразу. В 2.9.x подмена ошибочно шла по тексту
    // уведомлений — маты стояли у всех у ника. Личка и окна мода не трогаются.
    // Метка — сама подставленная фраза: сайт переиспользует всплывашку, и новая ошибка в том же
    // элементе раньше оставалась как есть (метка data-replaced висела навсегда).
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

    // ==== цвет эмодзи
    // Оттенок карточки по эмодзи-аватарке: рисуем эмодзи на белом холсте 64×64 и берём средний
    // цвет всего холста (белый фон входит в среднее — отсюда мягкость), затем поднимаем яркость
    // и насыщенность, иначе тёмные и серые эмодзи давали мутно-бурую заливку.
    // Результат — строка «r, g, b» для --vp-emoji или null (эмодзи не нарисовалась);
    // считается один раз на эмодзи, холст один на все.
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
    // средний цвет холста с эмодзи: [r, g, b] 0–255
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
    // Сайт переиспользует карточки: в тот же элемент приходит другой пост (новые сверху, подгрузка,
    // пришли уведомления). Поэтому метка — не «покрашено», а чем покрашено; сменилось — красим заново.
    function colorizePosts() {
        document.querySelectorAll('article.' + SELECTORS.post).forEach(post => {
            const avatar = post.querySelector('.' + SELECTORS.avatarLink + ' .' + SELECTORS.avatar);
            const emoji = avatar ? avatar.textContent.trim() : '';
            const withBlur = postBlurEnabled && !!post.querySelector('.' + SELECTORS.postMedia);
            const key = emoji ? emoji + (withBlur ? '|blur' : '') : '';
            // сайт сам переставляет className карточки (прочитано, обновилось) и стирает наш класс, а метка
            // остаётся — поэтому «уже покрашено» = метка совпала И класс на месте
            const tinted = !key || withBlur || post.classList.contains('vp-emoji-tint');
            if ((post.getAttribute('data-post-colored') || '') === key && tinted) return;
            untintCard(post);
            if (!key) { post.removeAttribute('data-post-colored'); return; }
            post.setAttribute('data-post-colored', key);
            if (!withBlur) tintCard(post, emoji);                // с картинкой фон даёт её размытие
        });
        // репосты могли дорисоваться позже самой карточки
        document.querySelectorAll('article.' + SELECTORS.post + '[data-post-colored] .' + SELECTORS.repost + ':not([data-vp-soft])').forEach(rp => softenRepost(rp.closest('article')));
    }
    // Репост внутри подкрашенной карточки: у сайта он и плашки в нём залиты сплошным тёмным —
    // на цветной карточке это чёрная дыра. Сплошные фоны в репосте делаем полупрозрачными.
    function softenRepost(post) {
        post.querySelectorAll('.' + SELECTORS.repost + ':not([data-vp-soft])').forEach(rp => {
            rp.setAttribute('data-vp-soft', '');
            [rp, ...rp.querySelectorAll('div, p, section')].forEach(el => {
                if (el.closest('button, a, video') || el.querySelector(':scope > img, :scope > video')) return;
                const m = getComputedStyle(el).backgroundColor.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
                if (!m || (m[4] !== undefined && +m[4] < .5)) return;           // прозрачный — не трогаем
                el.classList.add('vp-soft-bg');
            });
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
            const emoji = emojiAvatarOf(el) || '';
            // сайт переиспользует пункты списка — перекрашиваем, если эмодзи сменилась (или пропала:
            // тогда снимаем старый цвет, а не оставляем чужой)
            // …и если сайт переставил className (новое уведомление пришло, пока открыт список) — класс пропал
            if ((el.getAttribute('data-colored') || '') === emoji && (!emoji || el.classList.contains('vp-emoji-tint'))) return;
            untintCard(el);
            if (emoji) el.setAttribute('data-colored', emoji); else el.removeAttribute('data-colored');
            if (emoji) tintCard(el, emoji);
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
            --vp-edge-a: rgba(var(--vp-emoji), .22); --vp-edge-b: rgba(var(--vp-emoji), .22);   /* как было */
            transition: --vp-tint 0.25s ease !important;
        }
        .vp-emoji-tint:not(article) { border: 1px solid rgba(var(--vp-emoji), 0.22) !important; }   /* уведомления — не article, у них своя рамка */
        @media (hover: hover) {
            .vp-emoji-tint:hover { --vp-tint: 0.42; }
            .vp-emoji-tint:not(article):hover { border-color: rgba(var(--vp-emoji), 0.4) !important; }
            html.vp-post-hl article.vp-emoji-tint:hover { --vp-edge-a: rgba(var(--vp-emoji), .55); --vp-edge-b: rgba(var(--vp-emoji), .22); }
        }
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
            cursor: pointer; position: relative; transition: color .15s ease, background-color .15s ease;
        }
        .vp-version-chip:hover { color: var(--text-primary, #fff); background: var(--block-bg-secondary, rgba(255, 255, 255, 0.14)); }
        /* новая версия, «Что нового» ещё не открывали — точка на плашке */
        .vp-version-chip.vp-news::after { content: ""; position: absolute; top: -3px; right: -3px; width: 7px; height: 7px;
            border-radius: 50%; background: #2a8cff; box-shadow: 0 0 0 2px var(--bg-primary, #000); }
        .vp-logo-top { display: flex; align-items: flex-start; gap: 10px; }
        .vp-logo-col { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .vp-logo-col > a { height: 36px; }
        /* «Обновить» — справа от плашки, не участвует в центровке: плашка остаётся ровно под иконкой */
        .vp-logo-col .vp-version-row { position: relative; }
        .vp-logo-col .itd-update-sidebar-btn { position: absolute; left: calc(100% + 6px); top: 50%; translate: 0 -50%; }
        .vp-logo-top > :not(.vp-logo-col) { height: 36px; display: inline-flex; align-items: center; }

        /* «Что нового в ИТД X» — как окно «Что нового» сайта */
        .vp-news-back { position: fixed; inset: 0; z-index: 10050; background: rgba(0, 0, 0, .5); display: flex;
            align-items: center; justify-content: center; padding: 16px; animation: vpNewsFade .18s ease; }
        .vp-news-box { width: min(780px, 100%); max-height: min(82vh, 900px); display: flex; flex-direction: column; overflow: hidden;
            background: var(--modal-bg, var(--block-bg, #1c1c1c)); color: var(--text-primary, #fff); border-radius: 28px;
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
        .vp-news-tag { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; color: var(--text-secondary, #8a8a8a); font-size: 15px; }
        .vp-news-tag span { padding: 5px 12px; border-radius: 8px; font-weight: 600; color: #2a8cff; background: rgba(42, 140, 255, .14); }
        .vp-news-ver ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .vp-news-ver li { position: relative; padding-left: 24px; font-size: 16px; line-height: 1.45; }
        .vp-news-ver li::before { content: ""; position: absolute; left: 2px; top: .6em; width: 6px; height: 6px; border-radius: 50%; background: #2a8cff; }
        @keyframes vpNewsFade { from { opacity: 0; } }
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
    let msgsOpen = false;                               // открыта «страница» лички — активный пункт «Личка»
    let galOpen = false;                                // открыта галерея — активный пункт «Галерея»
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
    // Пока открыта личка: какой пункт сайт считает текущим и как у него выглядят текущий и обычный пункты
    // (цвет, прозрачность, фон — считываем до своих правил и кладём в переменные у меню)
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

        /* «Жидкая» подложка активного пункта меню: перетекает к новому пункту */
        .vp-nav-has-blob { position: relative; }
        .vp-nav-has-blob > .vp-nav-link { position: relative; z-index: 1; transition: background-color .2s ease, opacity .2s ease !important; }
        .vp-nav-has-blob > .vp-nav-link .vp-nav-icon { transition: none; }
        .vp-nav-has-blob > .vp-nav-link.vp-active { background: transparent !important; }
        /* своя подложка сайта (нижняя панель телефона) — прячем: вместо неё наша, той же формы */
        .vp-nav-has-blob > div:not(.vp-nav-blob) { opacity: 0 !important; }
        /* между постами у сайта полоса (нижняя граница обёртки в ленте) — у карточек свои края, она лишняя */
        .vp-post-slot { border-bottom: none !important; }
        /* «+» (Создать пост) — бугорок по центру нижней панели (newPostBump) */
        .vp-new-post { position: absolute !important; width: ${BUMP}px !important; height: ${BUMP}px !important; z-index: 2; margin: 0 !important;
            background: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; }
        .vp-new-post::before { display: none !important; }
        /* цвет — как у неактивных пунктов панели (у сайта «+» был белым); нажали — белый, как выбранный пункт */
        .vp-new-post { color: var(--text-secondary) !important; transition: color .2s; }
        .vp-new-post:active { color: var(--text-primary) !important; }
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
        /* нижняя панель: подложка — три части, двигаются transform'ом (см. blobFlow) */
        .vp-nav-blob > i { display: none; }
        .vp-nav-blob.vp-blob-row { width: 0 !important; height: 0 !important; background: none !important; box-shadow: none !important; }
        .vp-nav-blob.vp-blob-row > i { display: block; position: absolute; left: 0; top: 0; box-sizing: border-box; transform-origin: 0 50%; will-change: transform;
            background: color-mix(in srgb, var(--vp-accent, #0080ff) 14%, #242426);
            border: 1px solid color-mix(in srgb, var(--vp-accent, #0080ff) 32%, #3c3c40); transition: background-color .4s ease; }
        html.vp-light .vp-nav-blob.vp-blob-row > i { background: color-mix(in srgb, var(--vp-accent, #0080ff) 14%, #f0f0f2);
            border-color: color-mix(in srgb, var(--vp-accent, #0080ff) 32%, #d6d6da); }
        .vp-nav-blob .vp-bl { border-right: 0 !important; border-radius: 999px 0 0 999px; }
        .vp-nav-blob .vp-bm { border-left: 0 !important; border-right: 0 !important; }
        .vp-nav-blob .vp-br { border-left: 0 !important; border-radius: 0 999px 999px 0; }
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
            try { walk(sh.cssRules); } catch (e) { /* чужой домен — пропускаем */ }
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
    // Всплывающее поверх страницы (уведомления-тосты, выпадашки, окно эмодзи) со стеклом становилось
    // кашей: сквозь полупрозрачный фон читался текст под ним. Такие слои — плотнее (класс vp-float,
    // те же переменные, что у шторки комментариев). Всплывающее = блок или его предок до 5 уровней
    // стоит fixed или absolute поверх (z-index ≥ 5): просто absolute — это посты в ленте, сайт так
    // раскладывает длинный список. Навигация и сами посты — не всплывающее. Каждый элемент — один раз.
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
            // Блок того же фона внутри такого же блока (форма ответа в карточке поста): без стекла цвет
            // сплошной и сливается, а два полупрозрачных слоя дают тёмный прямоугольник — внутренний прозрачный
            const outer = el.parentElement && el.parentElement.closest(`:is(${glassSel})`);
            const bg = getComputedStyle(el).backgroundColor;
            if (outer && !outer.classList.contains('vp-float') && getComputedStyle(outer).backgroundColor === bg && !/^rgba\(0, 0, 0, 0\)$/.test(bg)) el.classList.add('vp-nested');
        });
    });
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

    // Длинный пост, свёрнутый под «Читать далее»: сайт гасит низ текста полосой цвета обычной карточки
    // (::after с градиентом в --block-bg). На карточке, подкрашенной под эмодзи или картинку, это тёмная
    // плашка поверх текста. Вместо полосы — прозрачность самого текста (mask): низ тает в любой фон.
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

    // Телефон: цвет кнопки поста, пока палец на ней (класс — надёжнее :active, который не во всех браузерах
    // срабатывает при касании); отпустил — через мгновение гаснет
    document.addEventListener('pointerdown', e => {
        if (e.pointerType !== 'touch') return;
        const b = e.target.closest && e.target.closest('.vp-post-action');
        if (!b) return;
        b.classList.add('vp-pressed');
        const off = () => { setTimeout(() => b.classList.remove('vp-pressed'), 180); removeEventListener('pointerup', off, true); removeEventListener('pointercancel', off, true); };
        addEventListener('pointerup', off, true);
        addEventListener('pointercancel', off, true);
    }, true);

    // Кнопка «назад» на телефоне закрывает окна сайта (комментарии, создание поста и т.п.), а не уводит
    // на прошлую страницу. Сайт сам таких записей в историю не кладёт: открылось окно — кладём запись
    // с тем же адресом, «назад» снимает её, а мы закрываем окно (Escape → клик по затемнению → кнопка
    // «Закрыть»). Окно закрыли сами — снимаем запись, чтобы лишнего шага «назад» не осталось.
    // Затемнения сайта узнаём по его же стилям: fixed на весь экран, z-index от 1000, тёмный фон.
    // Стили сайта подгружаются кусками (просмотр картинок — отдельный кусок), поэтому список
    // пересобираем, когда число таблиц стилей меняется.
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
        // верхнее окно — последнее в разметке
        // окно — только крупное (больше полэкрана): закреплённое поле комментария внизу страницы — не окно
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
            // клик по самому затемнению (мимо окна)
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
        if (history.state && history.state.vpOverlay) return;          // сняли запись нашего меню поверх окна — окно не трогаем
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
                // запись наша и сверху (сайт никуда не перешёл) — снимаем
                if (history.state && history.state.vpOverlay) history.back();
            }
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
                if (navIsRow(nav)) rowPlace(was); else Object.assign(blob.style, blobBox(was), { borderRadius: blobRadius });
                blob.style.opacity = '1';
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
        // Левое меню компьютера — как было: скругление самого пункта сайта
        blob.style.borderRadius = blobRadius = !row ? rad
            : siteInd && parseFloat(getComputedStyle(siteInd).borderRadius) ? getComputedStyle(siteInd).borderRadius
            : `${to.width / 2}px / ${to.height / 2}px`;
        const from = blobAt && !calm && blob.style.opacity === '1' ? blobAt : null;
        if (from && row) {
            // Нижняя панель телефона: перетекание — анимация браузера, без кода на каждый кадр и без замеров
            // по пути (они и тормозили: сайт в этот момент рисует новую страницу)
            blobAnim = null;
            rowPlace(to);
            blobFlow(from, to);
        } else if (from) {
            // Левое меню компьютера: считаем по кадрам (proxFrame) — подложка по пути сдвигается так же,
            // как кнопки-«док», мимо которых идёт
            blobAnim = { from, to, t0: performance.now() };
        } else { blobAnim = null; if (row) rowPlace(to); else Object.assign(blob.style, blobBox(to)); }
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
    // Нижняя панель телефона: подложка из трёх частей — левый полукруг, середина, правый полукруг.
    // Двигаются и тянутся они только transform'ом — его считает видеокарта, без пересчёта раскладки
    // на каждом кадре. Раньше анимировались left/width: кадры считал процессор, а он в этот момент
    // занят — сайт рисует новую страницу, — отсюда рывки.
    function blobParts() {
        // порядок: середина снизу, полукруги поверх — стыки прячутся под полукругами. Цвета сплошные,
        // поэтому там, где части заходят друг на друга, ничего не темнеет и не светлеет.
        if (!blob.firstElementChild) blob.innerHTML = '<i class="vp-bm"></i><i class="vp-bl"></i><i class="vp-br"></i>';
        const [m, l, r] = blob.children;
        return [l, m, r];
    }
    const BM_W = 100;                                     // ширина середины до растяжки: крупная — края не мылятся
    function rowTransforms(r, sy = 1) {
        // середина: от полукруга до полукруга и на 1,5 px под каждый — стык закрыт, а за скругление не вылезает
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
        document.querySelectorAll('article.' + SELECTORS.post).forEach(a => {
            if (!a._vpScene) { a._vpScene = true; sceneIO.observe(a); }
            // обёртка поста в ленте (у сайта — полоса-граница снизу, на телефоне видна между карточками)
            const slot = a.parentElement;
            if (slot && !slot.classList.contains('vp-post-slot')) slot.classList.add('vp-post-slot');
        });
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
        // новый кадр ложится поверх прошлого полупрозрачно: свечение перетекает за ~секунду,
        // а не скачет на каждой смене сцены (первый кадр — целиком)
        a.g.globalAlpha = a.cv.classList.contains('vp-on') ? .2 : 1;
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
    // Профили кешируются и между перезагрузками (sessionStorage, 10 мин): карточки при наведении,
    // личка и счётчик постов не ходят за теми же данными заново после каждого обновления страницы
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
            const stored = waitMs ? null : hcStored(key);        // счётчик в профиле (ждёт сайт) — всегда свежий
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
    // нажали ник — сайт уводит в профиль и убирает ссылку, pointerout не приходит: карточка оставалась
    // висеть уже в профиле. Закрываем по нажатию и когда ссылка, к которой она привязана, пропала
    document.addEventListener('click', e => { if (e.target.closest && e.target.closest(PROFILE_LINK)) { clearTimeout(hcTimer); hcClose(); } }, true);
    onDom(function hcLinkGone() { if (hc && !(hcLink && hcLink.isConnected)) hcClose(); });

    // --- Галерея (как Пинтерест): картинки и видео из ленты сеткой в 2–4 колонки. Кнопка — рядом с поиском
    // в полосе ленты, тем же видом, что у сайта. Лента — тем же запросом, что у сайта (/api/posts?tab=…&cursor=…),
    // страницами по 20; каждая картинка ложится в самую короткую колонку (сетка не перетасовывается при
    // подгрузке). Видео — без звука и играют, только пока их видно. Нажатие — открыть пост; «назад» закрывает.
    // иконка — залитая, как у пунктов меню сайта (контурная выбивалась)
    const galIcon = size => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="3" y="3" width="8" height="10" rx="2.5"/><rect x="13" y="3" width="8" height="6" rx="2.5"/><rect x="3" y="15" width="8" height="6" rx="2.5"/><rect x="13" y="11" width="8" height="10" rx="2.5"/></svg>`;
    const GAL_TABS = [['popular', 'Популярное'], ['clan', 'Кланы'], ['following', 'Подписки']];   // порядок — как у ленты
    const gal = { el: null, tab: 'popular', cursor: null, loading: false, done: false, cols: [], heights: [], seen: new Set(), hist: false };
    const galStyle = document.createElement('style');
    galStyle.textContent = `
        /* как лента: таблетка вкладок отдельно сверху (ПК — 36 от верха, высота 45), под ней через 16 —
           карточка с картинками (скругление 36, стекло, как у постов); телефон — таблетка в полосе высотой 63 */
        .vp-gal { position: fixed; z-index: 30; display: flex; flex-direction: column; box-sizing: border-box; color: var(--text-primary, #fff); }
        .vp-gal-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; overflow: hidden; margin-top: 16px;
            border-radius: 36px; background: var(--block-bg, #1c1c1c);
            backdrop-filter: var(--vp-glass-filter, none); -webkit-backdrop-filter: var(--vp-glass-filter, none); }
        .vp-gal.vp-card .vp-gal-card { border: 1px solid var(--border-color, rgba(255, 255, 255, .15)); }
        html.vp-light .vp-gal.vp-card .vp-gal-card { box-shadow: 0 16px 48px rgba(0, 0, 0, .12); }
        .vp-gal-top { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }
        .vp-gal-top > .vp-gal-tabs { flex: 1 1 auto; min-width: 0; }
        .vp-gal.vp-card .vp-gal-logo { display: none !important; }       /* ПК: логотип и так слева, в меню */
        .vp-gal-logo { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
        .vp-gal:not(.vp-card) .vp-gal-top { margin: 9px 12px 0 6px; }
        .vp-gal:not(.vp-card) .vp-gal-card { margin-top: 9px; border-radius: 36px 36px 0 0; }
        /* пока открыта галерея — лента под ней спрятана (иначе просвечивала сквозь стекло и в скруглённых углах) */
        html.vp-gal-open .vp-gal-hidden { visibility: hidden !important; }
        .vp-gal-body { padding: 12px 12px var(--vp-gal-pb, 24px) !important; }
        html.vp-gal-open .vp-gal-navwrap { z-index: 40 !important; }
        html.vp-gal-open .vp-nav-link.vp-site-cur { color: var(--vp-off-c) !important; opacity: var(--vp-off-o) !important; background-color: var(--vp-off-b) !important; }
        html.vp-gal-open .vp-gal-nav { color: var(--vp-on-c) !important; opacity: var(--vp-on-o) !important; background-color: var(--vp-on-b) !important; }
        /* вкладки — 1 в 1 как у ленты («Для вас / Кланы / Подписки»; значения сняты с вкладок сайта):
           таблетка с отступом 4, кнопки поровну, под выбранной — бегунок с обводкой цвета ника.
           Бегунок — в долях ширины (треть и сдвиг на свою ширину): совпадает с кнопкой при любой ширине окна */
        .vp-gal-tabs { position: relative; display: flex; flex: 0 0 auto; box-sizing: border-box; height: 45px; padding: 4px; margin: 0; border-radius: 9999px;
            background: var(--glass-bg, rgba(35, 35, 35, .5)); }
        html.vp-light .vp-gal-tabs { background: rgba(0, 0, 0, .06); }
        .vp-gal-ind { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc((100% - 8px) / 3); border-radius: 9999px; pointer-events: none;
            background: rgba(255, 255, 255, .08); box-shadow: inset 0 0 0 1px var(--vp-accent, #fff), 0 0 14px -4px var(--vp-accent, #fff);
            transition: transform .3s cubic-bezier(.2,.8,.2,1); }
        html.vp-light .vp-gal-ind { background: #fff; }
        .vp-gal-tab { position: relative; flex: 1 1 0; min-width: 0; border: 0; border-radius: 9999px; padding: 8px 0; margin: 0;
            font: inherit; font-size: 14px; font-weight: 500; line-height: 21px; cursor: pointer; background: transparent;
            color: rgba(255, 255, 255, .5); white-space: nowrap; transition: color .2s; }
        html.vp-light .vp-gal-tab { color: rgba(0, 0, 0, .5); }
        .vp-gal-tab.vp-on { color: var(--text-primary, #f5f5f5); }
        .vp-gal-body { flex: 1 1 auto; overflow-y: auto; overscroll-behavior: contain; padding: 0 8px 24px; }
        .vp-gal-grid { display: flex; gap: 8px; align-items: flex-start; max-width: 1400px; margin: 0 auto; }
        .vp-gal-col { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
        .vp-gal-tile { position: relative; border-radius: 16px; overflow: hidden; background: rgba(128,128,128,.15); cursor: pointer; }
        .vp-gal-tile > img, .vp-gal-tile > video { display: block; width: 100%; height: 100%; object-fit: cover; }
        /* картинка не ловит наведение — браузер не вешает на неё свою панель (Яндекс: Алиса, лупа…); нажатие — у плитки.
           Правая кнопка — картинка на миг снова ловит мышь (vp-ctx): обычное меню «Сохранить / Копировать картинку» */
        .vp-gal-tile > img { pointer-events: none; -webkit-user-drag: none; user-select: none; }
        .vp-gal-tile.vp-ctx > img { pointer-events: auto; }
        /* кнопки поверх, как на постах: лайк, коммент, репост — контуры без фона; ПК — при наведении, телефон — всегда */
        .vp-gal-acts { position: absolute; left: 6px; bottom: 6px; display: flex; gap: 2px; transition: opacity .15s; }
        .vp-gal-act { width: 36px; height: 36px; padding: 0; border: 0; background: none; color: #fff; cursor: pointer;
            display: inline-flex; align-items: center; justify-content: center; filter: drop-shadow(0 1px 2px rgba(0,0,0,.7)) drop-shadow(0 0 6px rgba(0,0,0,.35)); }
        .vp-gal-act svg { width: 24px; height: 24px; }
        .vp-gal-act.vp-on { color: var(--accent-liked, #f91880); }
        .vp-gal-act.vp-on[data-act="like"] path { fill: currentColor; }
        .vp-gal-act.vp-busy { opacity: .5; pointer-events: none; }
        @media (hover: hover) and (pointer: fine) {
            .vp-gal-acts { opacity: 0; }
            .vp-gal-tile:hover .vp-gal-acts, .vp-gal-acts:focus-within { opacity: 1; }
        }
        .vp-gal-badge { position: absolute; left: 8px; top: 8px; padding: 3px 8px; border-radius: 10px; font-size: 12px; font-weight: 600;
            background: rgba(0,0,0,.55); color: #fff; pointer-events: none; }
        .vp-gal-more { text-align: center; padding: 18px; color: var(--text-secondary, #8a8a8a); font-size: 14px; }
        .vp-gal-btn svg { pointer-events: none; }
        /* ПК: поиск — в боковом меню, в полосе ленты его нет — там и «Галерея»; телефон — кнопка в полосе ленты */
        @media (min-width: 1173px) { .vp-gal-btn { display: none !important; } }
        @media (max-width: 1172px) { .vp-gal-nav { display: none !important; } }
    `;
    document.head.appendChild(galStyle);
    const galColsCount = () => innerWidth >= 1100 ? 4 : innerWidth >= 700 ? 3 : 2;
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
    // Кнопки поверх плитки: иконки — те же, что у сайта на постах (контуры 20x20), своё состояние у каждой
    const GAL_ICONS = {
        like: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 4.6a3.7 3.7 0 0 0-5.2-.9C3.2 5 2.4 7.6 3.6 10.2 4.8 12.7 10 17 10 17s5.3-4.3 6.5-6.8c1.2-2.6 0-5.2-1.6-6.5s-4-.8-4.9.9"/>',
        comment: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 17a7 7 0 1 0-6.2-3.7L3 17l3.7-.8a7 7 0 0 0 3.3.8"/>',
        repost: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 9V8a3 3 0 0 1 3-3h9m-3 3 3-3-3-3M16 11v1a3 3 0 0 1-3 3H4m3-3-3 3 3 3"/>'
    };
    function galOpenPost(post) {
        const user = post.author && post.author.username;
        if (!user) return;
        const hadHist = gal.hist;
        gal.hist = false;
        closeGallery(true);
        history[hadHist ? 'replaceState' : 'pushState']({}, '', `/@${user}/post/${post.id}`);
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
        const like = btn('like', 'Нравится', post.isLiked === true);
        const comment = btn('comment', 'Комментарии');
        const repost = btn('repost', 'Репост', post.isReposted === true);
        // лайк и репост — тем же запросом, что у сайта; состояние меняем сразу, не вышло — возвращаем
        const toggle = async (b, path, confirmText) => {
            const on = b.classList.contains('vp-on');
            if (confirmText && !on && !confirm(confirmText)) return;
            b.classList.add('vp-busy');
            b.classList.toggle('vp-on', !on);
            try {
                const res = await api(path, on ? { method: 'DELETE' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                if (!res.ok) throw new Error(path + ': ' + res.status);
            } catch (e) {
                b.classList.toggle('vp-on', on);
                logErr('галерея: ' + b.dataset.act, e);
            } finally { b.classList.remove('vp-busy'); }
        };
        like.addEventListener('click', e => { e.stopPropagation(); toggle(like, `/api/posts/${post.id}/like`); });
        repost.addEventListener('click', e => { e.stopPropagation(); toggle(repost, `/api/posts/${post.id}/repost`, 'Сделать репост этого поста?'); });
        comment.addEventListener('click', e => { e.stopPropagation(); galOpenPost(post); });
        return row;
    }
    let galN = 0;
    function galTile(post, att) {
        const tile = document.createElement('div');
        tile.className = 'vp-gal-tile';
        const w = +att.width || 1, h = +att.height || 1;
        tile._vpRatio = Math.min(2.2, Math.max(.45, h / w));        // очень длинные/широкие — в разумных пределах
        tile._vpN = galN++;
        tile.style.aspectRatio = `1 / ${tile._vpRatio}`;
        if (att.type === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(att.url || '')) {
            const v = document.createElement('video');
            Object.assign(v, { src: att.url, muted: true, loop: true, playsInline: true, preload: 'metadata' });
            v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
            const poster = pick(att.thumbnailUrl, att.thumbnail, att.previewUrl, att.preview);
            if (poster) v.poster = poster.url || poster;
            tile.appendChild(v);
            galVideoIO.observe(v);
            const badge = document.createElement('span');
            badge.className = 'vp-gal-badge';
            const sec = Math.round(+att.duration || 0);
            badge.textContent = sec ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : '▶';
            tile.appendChild(badge);
        } else {
            const img = document.createElement('img');
            img.loading = 'lazy'; img.decoding = 'async'; img.alt = '';
            img.src = att.url;
            tile.appendChild(img);
        }
        const user = post.author && post.author.username;
        // правая кнопка по картинке — меню самой картинки (сохранить, копировать)
        tile.addEventListener('mousedown', e => { if (e.button === 2) tile.classList.add('vp-ctx'); });
        tile.addEventListener('contextmenu', () => setTimeout(() => tile.classList.remove('vp-ctx'), 300));
        tile.addEventListener('mouseleave', () => tile.classList.remove('vp-ctx'));
        tile.appendChild(galActions(post));
        tile.addEventListener('click', () => {
            if (!user) return;
            // запись галереи в истории заменяем постом: «назад» из поста — в ленту, а не в пустую галерею
            const hadHist = gal.hist;
            gal.hist = false;
            closeGallery(true);
            history[hadHist ? 'replaceState' : 'pushState']({}, '', `/@${user}/post/${post.id}`);
            dispatchEvent(new PopStateEvent('popstate'));
        });
        return tile;
    }
    async function galLoad() {
        if (!gal.el || gal.loading || gal.done) return;
        gal.loading = true;
        const more = gal.el.querySelector('.vp-gal-more');
        more.textContent = 'Загрузка…';
        const tab = gal.tab;
        try {
            const res = await api(`/api/posts?limit=20&tab=${tab}` + (gal.cursor ? '&cursor=' + encodeURIComponent(gal.cursor) : ''));
            if (!res.ok) throw new Error('лента: ' + res.status);
            const j = await res.json(), d = j.data || j;
            if (!gal.el || tab !== gal.tab) return;                                    // пока грузили — переключили
            const posts = d.posts || [];
            keepSitePosts(j);
            let added = 0;
            for (const post of posts) {
                if (gal.seen.has(post.id)) continue;
                gal.seen.add(post.id);
                for (const att of (post.attachments || []).slice(0, 4)) {
                    if (!att || !att.url || (att.type && !/image|video/.test(att.type))) continue;
                    galPlace(galTile(post, att));
                    added++;
                }
            }
            gal.cursor = (d.pagination && d.pagination.nextCursor) || d.nextCursor || d.cursor || null;
            gal.done = !gal.cursor || !posts.length;
            more.textContent = gal.done ? (gal.seen.size ? 'Это всё' : 'Пусто') : '';
            gal.loading = false;
            // страница без картинок (одни тексты) — сразу следующая
            if (!gal.done && added < 4) galLoad();
        } catch (e) {
            logErr('галерея', e);
            more.textContent = 'Не загрузилось — нажми, чтобы повторить';
            more.onclick = () => { more.onclick = null; galLoad(); };
            gal.loading = false;
        }
    }
    // бегунок — под выбранной вкладкой (и после смены ширины окна)
    function galInd() {
        const ind = gal.el && gal.el.querySelector('.vp-gal-ind');
        const i = GAL_TABS.findIndex(([id]) => id === gal.tab);
        if (ind && i >= 0) ind.style.transform = `translateX(${i * 100}%)`;
    }
    function galSwitch(tab) {
        gal.tab = tab; gal.cursor = null; gal.done = false; gal.seen.clear(); galN = 0;
        gal.el.querySelectorAll('.vp-gal-tab').forEach(b => b.classList.toggle('vp-on', b.dataset.tab === tab));
        galInd();
        gal.cols.forEach(c => c.querySelectorAll('video').forEach(v => galVideoIO.unobserve(v)));
        gal.cols = [];
        galLayout();
        gal.el.querySelector('.vp-gal-body').scrollTop = 0;
        galLoad();
    }
    // место окна, как у «Сообщений»: телефон (меню — панель внизу) — от верха до панели;
    // компьютер — карточка от левого меню до правого края экрана (ширина — под экран)
    function galPosition() {
        if (!gal.el) return;
        const nav = document.querySelector('.' + SELECTORS.nav);
        const nr = nav && nav.getBoundingClientRect();
        const row = nav && navIsRow(nav) && nr.top > innerHeight / 2;
        requestAnimationFrame(galInd);
        // телефон: окно до низа экрана, нижняя панель — поверх (иначе между ними просвечивала лента)
        document.querySelectorAll('.vp-gal-navwrap').forEach(w => w.classList.remove('vp-gal-navwrap'));
        if (row) {
            if (nav.parentElement) nav.parentElement.classList.add('vp-gal-navwrap');
            // карточка — до низа экрана (под панелью), а последние картинки не прячутся под ней: отступ — у ленты картинок
            Object.assign(gal.el.style, { left: '0px', right: '0px', top: '0px', bottom: '0px', width: '', paddingBottom: '0px' });
            gal.el.style.setProperty('--vp-gal-pb', Math.max(24, innerHeight - nr.top + BUMP_H + 8) + 'px');
        } else {
            // ПК — три колонки на всю ширину: меню у левого края (как ставит сайт), панель «Статистика/клуб»
            // у правого, галерея — между ними с зазорами 24; панели нет — до правого края с отступом, как у меню
            placeSidebar(); placeRail();
            const side = document.querySelector('.' + SELECTORS.sidebar) || (nav && nav.closest('aside')) || nav;
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
    function galHideFeed(on) {
        document.querySelectorAll('.vp-gal-hidden').forEach(e => { if (!on) e.classList.remove('vp-gal-hidden'); });
        if (!on) return;
        const side = '.' + SELECTORS.sidebar + ', .' + SELECTORS.sidebarRight + ', .vp-rail, nav, .vp-gal';
        const up = el => {
            let top = el;
            for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
                if (p.querySelector(side) || p.getBoundingClientRect().width >= innerWidth * 0.72) break;
                top = p;
            }
            return top;
        };
        document.querySelectorAll('.' + [SELECTORS.tabs, SELECTORS.feedBar, SELECTORS.banner, SELECTORS.post, SELECTORS.notification].join(', .'))
            .forEach(e => { const t = up(e); if (!t.closest('.vp-gal, nav')) t.classList.add('vp-gal-hidden'); });
    }
    onDom(function galFeedHidden() { if (gal.el) galHideFeed(true); });
    // Открыть: окно, закрытое раньше, возвращается как было (картинки, вкладка, место прокрутки) — без
    // новой загрузки; обновить — повторное нажатие на «Галерею», как у ленты (galRefresh)
    function openGallery() {
        if (gal.el) return;
        const msgs = document.querySelector('.vp-msgs.vp-open');
        if (msgs && msgs.close) msgs.close();
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
        galOpen = true;
        gal.path = location.pathname;
        galPosition();
        addEventListener('resize', galPosition);
        document.documentElement.classList.add('vp-gal-open');
        galOpen = true;
        galHideFeed(true);
        markActiveNav(); moveNavBlob();
        if (!gal.hist) { history.pushState(Object.assign({}, history.state, { vpGal: true }), '', location.href); gal.hist = true; }
        const logo = document.querySelector('.' + SELECTORS.feedBar + ' .my-nav-block');
        const top = el.querySelector('.vp-gal-top'), old = top.querySelector('.my-nav-block');
        if (logo && !old) {
            const copy = logo.cloneNode(true);
            copy.classList.add('vp-gal-logo');
            copy.style.cssText = '';
            top.prepend(copy);
        }
        const body = el.querySelector('.vp-gal-body');
        if (kept) {                                                  // как было: место прокрутки и видео
            body.scrollTop = gal.scroll || 0;
            galInd();
            return;
        }
        el.querySelectorAll('.vp-gal-tab').forEach(b => b.onclick = () => { if (b.dataset.tab !== gal.tab || !gal.seen.size) galSwitch(b.dataset.tab); });
        body.addEventListener('scroll', () => { if (body.scrollTop + body.clientHeight > body.scrollHeight - 1200) galLoad(); }, { passive: true });
        for (const t of ['wheel', 'touchmove']) el.addEventListener(t, e => e.stopPropagation(), { passive: true });
        galSwitch(gal.tab);
    }
    // обновить (повторное нажатие на «Галерею»): та же вкладка заново, наверх
    function galRefresh() {
        if (!gal.el) return openGallery();
        galSwitch(gal.tab);
    }
    // закрыть: окно убираем со страницы, но держим (gal.kept) — следующее открытие покажет его как было
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
        if (gal.hist) { gal.hist = false; if (!fromBack && history.state && history.state.vpGal) history.back(); }
    }
    addEventListener('popstate', () => { if (gal.el) { gal.hist = false; closeGallery(true); } });
    onDom(function galLeft() { if (gal.el && location.pathname !== gal.path) { closeGallery(true); } });
    // пункт меню: другая страница — закрыть и перейти; пункт той же страницы (галерею открыли с ленты
    // и жмут «Ленту») — только закрыть: адрес при галерее не менялся, и сайт считал это повторным
    // нажатием на текущий пункт — прокручивал и обновлял ленту
    document.addEventListener('click', e => {
        if (!gal.el) return;
        const a = e.target.closest && e.target.closest('a.' + SELECTORS.navLink);
        if (!a || a.classList.contains('vp-gal-nav')) return;
        if (a.getAttribute('href') === gal.path) { e.preventDefault(); e.stopPropagation(); }
        closeGallery();
    }, true);
    addEventListener('keydown', e => { if (e.key === 'Escape' && gal.el) closeGallery(); });
    let galCols = galColsCount();
    addEventListener('resize', () => { if (gal.el && galColsCount() !== galCols) { galCols = galColsCount(); galLayout(); } });
    // кнопка — в полосе ленты, перед поиском (круглая кнопка с иконкой у сайта), с её же классами
    onDom(function galleryButton() {
        const bar = document.querySelector('.' + SELECTORS.feedBar);
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
    // ПК: пункт «Галерея» в боковом меню, после «Поиска» — копия его разметки со своей иконкой и подписью
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
        search.after(a);
    });

    // --- Обновить пост: на своих постах слева от «…» — один запрос счётчиков (как у сайта, POST /api/posts/stats),
    // лайки, комменты, репосты и просмотры меняются на месте, без перезагрузки; изменившиеся — вспыхивают
    function postIdOf(card) {
        if (!card.matches('article')) { const m = location.pathname.match(/\/post\/([0-9a-f-]{36})/); if (m) return m[1]; }
        for (const img of card.querySelectorAll('img')) { const id = postIndex.byMedia.get(img.currentSrc || img.src); if (id) return id; }
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
    // числа в подвале карточки: лайки, комменты, репосты, просмотры — элементы с числом
    function postCounters(card) {
        const foot = card.querySelector('footer');
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
            const res = await api('/api/posts/stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [id] }) });
            const j = res.ok ? await res.json() : null;
            const st = j && ((j.posts || (j.data && j.data.posts) || [])[0]);
            if (!st) throw new Error('счётчики: ' + res.status);
            const els = postCounters(card) || {};
            let changed = 0;
            for (const k of ['likesCount', 'commentsCount', 'repostsCount', 'viewsCount']) {
                const el = els[k];
                if (!el || typeof st[k] !== 'number' || el.textContent.trim() === String(st[k])) continue;
                el.textContent = String(st[k]);
                el.classList.remove('vp-bump'); void el.offsetWidth; el.classList.add('vp-bump');
                changed++;
            }
            btn.title = changed ? 'Обновлено' : 'Ничего нового';
        } catch (e) {
            logErr('обновить пост', e);
            btn.title = 'Не вышло обновить';
        } finally {
            setTimeout(() => btn.classList.remove('vp-spin'), 400);
        }
    }
    const styleRefresh = document.createElement('style');
    styleRefresh.textContent = `
        .vp-post-refresh { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; margin-right: 2px;
            border: 0; border-radius: 50%; background: none; color: var(--text-secondary, #8a8a8a); cursor: pointer; flex: 0 0 auto; }
        .vp-post-refresh:hover { background: var(--block-hover-bg, rgba(128,128,128,.15)); color: var(--text-primary, #fff); }
        .vp-post-refresh.vp-spin svg { animation: vp-refresh-spin .6s linear infinite; }
        @keyframes vp-refresh-spin { to { transform: rotate(360deg); } }
        .vp-bump { animation: vp-bump .7s ease-out; display: inline-block; }
        @keyframes vp-bump { 30% { transform: scale(1.35); color: var(--accent-primary, #3b9eff); } }
    `;
    document.head.appendChild(styleRefresh);
    // «…» у сайта на ПК стоит поверх в углу карточки, на телефоне — в строке; кнопку ставим в карточку
    // по месту самого «…»: вплотную слева, по его центру (отступ — от правого края карточки). Место
    // пересчитываем на каждом проходе и при смене размера: карточка меняется (пометка «(ред.)», картинки,
    // шрифт) — раньше кнопка оставалась там, где встала сначала, и съезжала до перезагрузки
    function placeRefresh(b) {
        const card = b.parentElement, menu = b._vpMenu;
        if (!card || !menu || !menu.isConnected) return;
        const cr = card.getBoundingClientRect(), mr = menu.getBoundingClientRect();
        if (!mr.width) return;
        const top = Math.round(mr.top - cr.top + (mr.height - 32) / 2) + 'px', right = Math.round(cr.right - mr.left + 2) + 'px';
        if (b.style.top !== top || b.style.right !== right) Object.assign(b.style, { position: 'absolute', zIndex: '2', top, right });
    }
    addEventListener('resize', () => document.querySelectorAll('.vp-post-refresh').forEach(placeRefresh));
    onDom(function postRefreshButtons() {
        if (!myUsername) return;
        document.querySelectorAll('.vp-post-refresh').forEach(b => {
            if (b._vpMenu && !b._vpMenu.isConnected) {                  // сайт перерисовал шапку — найти «…» заново
                const row = b.parentElement && b.parentElement.querySelector('header > :first-child');
                b._vpMenu = row && [...row.children].reverse().find(c => c.querySelector('svg') && !c.matches('.' + SELECTORS.nickRow + ', a, .vp-post-refresh'));
            }
            placeRefresh(b);
        });
        const me = myUsername.toLowerCase();
        document.querySelectorAll('header').forEach(h => {
            const row = h.firstElementChild;
            if (!row) return;
            const card = h.closest('article') || h.closest('div:has(> footer)') || (h.parentElement && h.parentElement.closest('div:has(footer)'));
            if (!card || card.querySelector(':scope > .vp-post-refresh') || !card.querySelector('footer') || card.closest('.vp-msgs')) return;
            const link = h.querySelector(PROFILE_LINK) || card.querySelector(PROFILE_LINK);
            if (!link || (loginOf(link.getAttribute('href')) || '').toLowerCase() !== me) return;
            const menu = [...row.children].reverse().find(c => c.querySelector('svg') && !c.matches('.' + SELECTORS.nickRow + ', a'));
            if (!menu || !postIdOf(card)) return;
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'vp-post-refresh';
            b.title = 'Обновить лайки и комменты';
            b.innerHTML = svgIcon('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>', 18);
            b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); refreshPost(card, b); });
            if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
            b._vpMenu = menu;
            card.appendChild(b);
            placeRefresh(b);
        });
    });

    // --- Ссылки в тексте: сайт показывает t.me/…, https://… простым текстом. Текст сайта не трогаем
    // (вставить свой <a> в текст React — он потом падает на обновлении поста): места ссылок держим
    // диапазонами, подсвечиваем их CSS-подсветкой (::highlight), нажатие ловим по точке под пальцем.
    const LINK_RE = /(?:https?:\/\/|www\.)[^\s<>"'«»]+|(?<![\w@.\/-])(?:[a-z0-9-]+\.)+(?:com|ru|me|org|net|io|gg|tv|app|dev|xyz|su|ly|co|be|link|site|store|online|info|pro|рф)(?:\/[^\s<>"'«»]*)?(?![\w-])|(?<![\w@.\/-])[а-яё0-9-]+\.(?:com|рф|ru)(?![\w-])/giu;
    const linkNodes = new Map();                        // текстовый узел → { text, links: [{ start, end, url }] }
    const linkHl = window.Highlight && CSS.highlights ? new Highlight() : null;
    if (linkHl) CSS.highlights.set('vp-link', linkHl);
    const styleLinks = document.createElement('style');
    styleLinks.textContent = `::highlight(vp-link) { color: var(--accent-primary, #3b9eff); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 2px; }`;
    document.head.appendChild(styleLinks);
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
    // ссылка под точкой экрана (мышь или палец)
    function linkAt(x, y) {
        const pos = document.caretPositionFromPoint ? document.caretPositionFromPoint(x, y) : document.caretRangeFromPoint && document.caretRangeFromPoint(x, y);
        if (!pos) return null;
        const node = pos.offsetNode || pos.startContainer, off = pos.offset ?? pos.startOffset;
        const info = node && linkNodes.get(node);
        if (!info || info.text !== node.nodeValue) return null;
        const l = info.links.find(l => off >= l.start && off <= l.end);
        if (!l) return null;
        // точка правее конца строки тоже даёт «последний символ» — проверяем, что палец на самих буквах
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

    // --- 13. Баннер с глубиной
    // Сдвиг считаем по месту самого баннера на экране (один замер на кадр), а не по прокрутке блока,
    // запомненного раньше: после перехода с прокрученной ленты тот хранил старую прокрутку —
    // баннер в профиле оставался бледным и сдвинутым
    let bannerQueued = false;
    function bannerDepth() {
        bannerQueued = false;
        const banner = document.querySelector('.' + SELECTORS.banner);
        const img = banner && banner.querySelector(':scope > img[alt="Banner"]');
        if (!img || bannerEdit.img) return;                                // пока баннер двигают в редакторе — не мешаем
        banner.classList.add('vp-depth');
        const r = banner.getBoundingClientRect();
        if (r.bottom < -40 || r.top > innerHeight) return;               // за экраном
        const past = Math.max(0, -r.top);                                  // на сколько баннер ушёл за верх экрана
        // пишем стиль, только если сдвиг заметно изменился: на прокрутке это каждый кадр
        const y = Math.round(past * .35);
        if (img._vpY === y && !calm) return;
        img._vpY = y;
        img.style.transform = calm ? '' : `translateY(${y}px) scale(1.15)`;
        img.style.opacity = String(Math.max(.25, 1 - past / (r.height * 1.4)).toFixed(2));
    }
    addEventListener('scroll', () => { if (!bannerQueued) { bannerQueued = true; requestAnimationFrame(bannerDepth); } }, { capture: true, passive: true });
    onDom(function bannerDepthDom() { bannerDepth(); });

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
        // уже есть на этой странице — не перебираем все span-ы заново на каждом проходе
        const done = document.querySelector('.vp-posts-stat');
        if (done && done.isConnected && done.parentElement && done.parentElement.dataset.vpPosts === login) return;
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
            const countUpOnce = (n, total) => {
                if (calm) return;
                n.style.setProperty('--vp-to', String(total));
                n.style.setProperty('--vp-count-color', getComputedStyle(n).color);
                n.classList.add('vp-count');
                setTimeout(() => n.classList.remove('vp-count'), 1400);
            };
            if (!postsCounted.has(login)) countUpOnce(n, total);   // накрутка, как у соседних счётчиков, — раз на профиль
            // свой профиль: справа от постов — лайки за всё время (сумма по всем своим постам)
            if (myUsername && login.toLowerCase() === myUsername.toLowerCase()) myLikesTotal().then(likes => {
                if (typeof likes !== 'number' || !row.isConnected || row.querySelector('.vp-likes-stat') || loginOf(location.pathname) !== login) return;
                const lk = mine.cloneNode(true);
                lk.classList.remove('vp-posts-stat');
                lk.classList.add('vp-likes-stat');
                const [ln, llabel] = lk.querySelectorAll('span');
                ln.classList.remove('vp-count');
                ln.textContent = likes;
                llabel.textContent = 'лайков';                 // всегда «лайков» (так попросил владелец: «5371 лайк» читается странно)
                mine.after(lk);
                if (!postsCounted.has(login + '|likes')) { postsCounted.add(login + '|likes'); countUpOnce(ln, likes); }
            });
            postsCounted.add(login);
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
        // открыта галерея — панель у правого края экрана, с тем же отступом, что меню у левого
        const sideEl = document.querySelector('.' + SELECTORS.sidebar);
        if (on && galOpen && sideEl && innerWidth >= 1173) {
            const margin = Math.max(12, Math.round(sideEl.getBoundingClientRect().left)), width = 300;
            box = { left: innerWidth - margin - width, width, maxH: innerHeight - RAIL_TOP - 24 };
        } else if (on && edge > 0 && gap >= 240) {
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
        if (box && edge > 0 && gap >= 240 && !galOpen) box.maxH = innerHeight - RAIL_TOP - 24;
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
        // открыта галерея — меню на своём месте у сайта (у левого края): галерея растягивается до него
        if (galOpen) { document.documentElement.classList.remove('vp-side-moved'); return; }
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
    // Лайки за всё время — сумма лайков всех своих постов: стена листается страницами по 50 (как у сайта,
    // курсором), ~12 запросов на 500 постов. Поэтому не чаще раза в 3 часа (GM vp_likes_total), в промежутке — число из памяти
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
        // счётчики — из /users/me, если он их отдаёт; иначе ответ сайта про мой профиль / свой запрос
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
        const rows = [['followers', 'подписчиков'], ['following', 'подписок'], ['posts', 'постов'], ['likes', 'лайков']].filter(([k]) => typeof statsNow[k] === 'number');
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
        const names = verifiedNames();
        if (myUsername && !names.some(n => n.toLowerCase() === myUsername.toLowerCase())) names.push(myUsername);
        const key = names.sort().join();
        if (key === clubShown) return;
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
