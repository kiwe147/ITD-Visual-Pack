// Автоподъём: ошибка поиска → отсчёт 15с на кнопке → сам продолжает.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, w) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + w); if (!ok) fails.push(w); };

let failFeed = true;   // сначала лента падает, потом оживает
let postsCalls = 0;
const mkPage = () => [{ id: 'p-0-1', author: { username: 'u1' }, attachments: [] }];

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
        if (u.pathname === '/api/posts') {
            postsCalls++;
            if (failFeed) return r.fulfill({ status: 500, body: '{"error":"boom"}' });
            return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: mkPage(), pagination: { nextCursor: null } } }) });
        }
        if (u.pathname === '/api/v1/halloween/feed-state') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ serverNow: new Date().toISOString(), night: false, posts: {} }) });
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
    await p.waitForTimeout(2200);
    const fr = p.frames().find(f => f.url().includes('/public/events/halloween'));
    await fr.evaluate(() => { const d = document.querySelector('.vp-hunt-dev'); if (d) d.click(); });
    await p.waitForTimeout(2500);

    const st1 = await fr.evaluate(() => {
        const w = document.querySelector('.vp-hunt');
        return { state: w.dataset.state, sub: (w.querySelector('.vp-hunt-state-s') || {}).textContent, head: (w.querySelector('.vp-hunt-state-hx') || {}).textContent };
    });
    console.log('AFTER FAIL', JSON.stringify(st1));
    check(st1.state === 'error', `состояние ошибки (${st1.state})`);
    check(/через \d+ с/.test(st1.sub || ''), `на кнопке таймер («${st1.sub}»)`);

    const firstLeft = (st1.sub.match(/через (\d+) с/) || [])[1];
    await p.waitForTimeout(3000);
    const st2 = await fr.evaluate(() => {
        const w = document.querySelector('.vp-hunt');
        return { state: w.dataset.state, sub: (w.querySelector('.vp-hunt-state-s') || {}).textContent };
    });
    const secondLeft = (st2.sub.match(/через (\d+) с/) || [])[1];
    console.log('AFTER 3s', JSON.stringify(st2));
    check(+secondLeft < +firstLeft, `таймер тикает (${firstLeft} -> ${secondLeft})`);

    // лента оживает, ждём автоподъём
    failFeed = false;
    const callsBefore = postsCalls;
    await p.waitForTimeout(13000);
    const st3 = await fr.evaluate(() => {
        const w = document.querySelector('.vp-hunt');
        return { state: w.dataset.state, scanned: (w.querySelector('.vp-hunt-scanned') || {}).textContent };
    });
    console.log('AFTER RETRY', JSON.stringify(st3), 'postsCalls', callsBefore, '->', postsCalls);
    check(postsCalls > callsBefore, 'запросы возобновились сами');
    check(st3.state !== 'error', `состояние уже не error (${st3.state})`);

    if (errs.length) console.log('ERR:', JSON.stringify(errs.slice(0, 3)));
    check(errs.length === 0, 'нет ошибок страницы');
    await b.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();
