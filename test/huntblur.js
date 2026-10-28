// Окно охоты не должно быть прозрачным/размытым, даже если тема сайта стеклянная.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, w) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + w); if (!ok) fails.push(w); };

// Стеклянная тема: --block-bg полупрозрачный, --vp-glass-filter с блюром, --bg-primary прозрачный
const GLASS = `
:root {
  --block-bg: rgba(28, 28, 28, .52);
  --glass-bg: rgba(35, 35, 35, .5);
  --text-primary: #f5f5f5;
  --text-secondary: rgba(255,255,255,.5);
  --border-color: rgba(255,255,255,.15);
  --vp-accent: #ff2d75;
  --vp-glass-filter: blur(14px);
  --bg-primary: transparent;
}
`;
const mkPage = () => [{ id: 'p-0-1', author: { username: 'u1' }, attachments: [] }];

(async () => {
    const b = await chromium.launch();
    const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
    const p = await ctx.newPage();
    await p.route('**/*', async r => {
        const u = new URL(r.request().url()), t = r.request().resourceType();
        if (u.pathname.startsWith('/public/events/halloween')) {
            return r.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><head><style>' + GLASS + 'body{margin:0;background:#221133}.room-stage{position:relative;width:100%;height:80vh;background:#2a1a3a}</style></head><body><div class="room-stage"></div></body></html>' });
        }
        if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
        if (t === 'image' || t === 'font') return r.abort();
        if (t === 'stylesheet') return r.continue();
        if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
        if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
        if (u.pathname === '/api/posts') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: mkPage(), pagination: { nextCursor: null } } }) });
        if (u.pathname === '/api/v1/halloween/feed-state') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ serverNow: new Date().toISOString(), night: false, posts: { 'p-0-1': { possession: { id: 'g', stage: 'calm', resolved: null } } } }) });
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
    await p.evaluate(() => {
        const st = document.createElement('style');
        st.textContent = ':root{--block-bg:rgba(28,28,28,.52);--glass-bg:rgba(35,35,35,.5);--text-primary:#f5f5f5;--text-secondary:rgba(255,255,255,.5);--border-color:rgba(255,255,255,.15);--vp-accent:#ff2d75;--vp-glass-filter:blur(14px);--bg-primary:transparent}';
        document.head.appendChild(st);
    });
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    const fr = p.frames().find(f => f.url().includes('/public/events/halloween'));
    check(!!fr, 'iframe ивента найден');
    if (!fr) { await b.close(); process.exit(1); }
    await fr.evaluate(() => { const d = document.querySelector('.vp-hunt-dev'); if (d) d.click(); });
    await p.waitForTimeout(1500);

    const st = await fr.evaluate(() => {
        const w = document.querySelector('.vp-hunt');
        const sh = document.querySelector('.vp-hunt-shell');
        if (!w) return { noWin: true };
        const cw = getComputedStyle(w), cs = getComputedStyle(sh);
        return {
            open: w.classList.contains('vp-open'),
            winBg: cw.backgroundColor, winBf: cw.backdropFilter,
            shellBg: cs.backgroundImage.slice(0, 80), shellBgColor: cs.backgroundColor, shellBf: cs.backdropFilter,
            blockBg: cw.getPropertyValue('--block-bg'), bgPrimary: cw.getPropertyValue('--bg-primary')
        };
    });
    console.log('WIN', JSON.stringify(st));
    check(!!st.open, 'окно открылось');
    // Проверяем реальный пиксель: центр экрана должен быть НЕ прозрачным и НЕ фоном сцены
    const px = await fr.evaluate(() => {
        const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
        return el ? (el.className || el.tagName).toString().slice(0, 60) : null;
    });
    console.log('CENTER ELEMENT', px);
    await b.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();
