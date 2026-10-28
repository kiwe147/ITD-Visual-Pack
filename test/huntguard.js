// Сторож: если окно пропало из DOM, сцена ивента не остаётся скрытой (иначе «блюр без окна»).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, w) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + w); if (!ok) fails.push(w); };

(async () => {
    const b = await chromium.launch();
    const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.route('**/*', async r => {
        const u = new URL(r.request().url()), t = r.request().resourceType();
        if (u.pathname.startsWith('/public/events/halloween')) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><head><style>body{margin:0;background:#221133}.room-stage{position:relative;width:100%;height:80vh;background:#2a1a3a}</style></head><body><div class="room-stage"></div></body></html>' });
        if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
        if (t === 'image' || t === 'font') return r.abort();
        if (t === 'stylesheet') return r.continue();
        if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
        if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
        if (u.pathname === '/api/posts') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: [], pagination: { nextCursor: null } } }) });
        return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(() => {
        const st = { palMiku: false, palTeto: false, palsEnabled: false, introEnabled: false, backgroundEnabled: false };
        window.GM_getValue = (k, d) => (k in st ? st[k] : d);
        window.GM_setValue = (k, v) => { st[k] = v; };
        window.GM_registerMenuCommand = () => { };
        window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
        window.GM_info = { script: { version: 't' } };
        window.unsafeWindow = window;
    });
    await p.goto(ORIGIN + '/event/halloween');
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-msgs, .vp-pals, .vp-itdx-btn').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    const fr = p.frames().find(f => f.url().includes('/public/events/halloween'));
    check(!!fr, 'iframe найден');

    await fr.evaluate(() => { const d = document.querySelector('.vp-hunt-dev'); if (d) d.click(); });
    await p.waitForTimeout(900);
    const opened = await fr.evaluate(() => {
        const w = document.querySelector('.vp-hunt');
        const sc = document.querySelector('.room-stage');
        return { win: !!(w && w.isConnected), open: !!(w && w.classList.contains('vp-open')), scene: sc ? sc.style.visibility : '?' };
    });
    console.log('OPENED', JSON.stringify(opened));
    check(opened.win && opened.open, 'окно в документе и открыто');
    check(opened.scene === 'hidden', 'сцена скрыта');

    // имитируем баг: ивент перерисовался и снёс окно
    await fr.evaluate(() => { const w = document.querySelector('.vp-hunt'); if (w) w.remove(); });
    await p.waitForTimeout(2000);
    const after = await fr.evaluate(() => {
        const w = document.querySelector('.vp-hunt');
        const sc = document.querySelector('.room-stage');
        return { win: !!(w && w.isConnected), scene: sc ? sc.style.visibility : '?' };
    });
    console.log('AFTER', JSON.stringify(after));
    check(!after.win, 'окна по-прежнему нет');
    check(after.scene !== 'hidden', 'сцена ВЕРНУЛАСЬ (сторож сработал, блюр-экрана нет)');

    // повторное открытие должно снова работать
    await fr.evaluate(() => { const d = document.querySelector('.vp-hunt-dev'); if (d) d.click(); });
    await p.waitForTimeout(900);
    const again = await fr.evaluate(() => {
        const w = document.querySelector('.vp-hunt');
        const sc = document.querySelector('.room-stage');
        return { win: !!(w && w.isConnected), open: !!(w && w.classList.contains('vp-open')), scene: sc ? sc.style.visibility : '?' };
    });
    console.log('AGAIN', JSON.stringify(again));
    check(again.win && again.open, 'после сброса окно снова открывается');
    check(again.scene === 'hidden', 'сцена снова скрыта');

    if (errs.length) console.log('ERR:', JSON.stringify(errs.slice(0, 3)));
    check(errs.length === 0, 'нет ошибок страницы');
    await b.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();
