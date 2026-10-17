// Галерея на телефоне: стрелок и зон нет, листание только пальцем (лента картинок прокручивается по горизонтали с прилипанием).
// Запуск:  node test/galphone.js снимок-ленты-телефон.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const COL = ['#c0392b', '#27ae60', '#2980b9'];
const posts = Array.from({ length: 4 }, (_, i) => ({ id: 'p' + i, author: { username: 'a' },
  attachments: COL.map((_, k) => ({ type: 'image', url: `https://cdn.xn--d1ah4a.com/images/vpph-${i}-${k}.png`, width: 600, height: 700 })) }));
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ viewport: { width: 392, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    const m = u.pathname.match(/vpph-\d+-(\d)/);
    if (m) return r.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700"><rect width="600" height="700" fill="${COL[+m[1]]}"/></svg>` });
    if (t === 'image' || t === 'font') return r.abort();
    if (t === 'stylesheet') return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.pathname === '/api/posts') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts, pagination: { nextCursor: null } } }) });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => {
    document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob, .vp-itdx-btn, .vp-msgs, .vp-gal, .vp-gal-nav').forEach(e => e.remove());
    document.querySelectorAll('style').forEach(st => { if (/vp-msgs|vp-gal/.test(st.textContent)) st.remove(); });
    const st = document.createElement('style');
    st.textContent = '.vp-gal { left: 0 !important; right: 0 !important; top: 36px !important; bottom: 0 !important; z-index: 99999 !important }';
    document.head.appendChild(st);
  });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelector('.vp-gal-btn').click());
  await p.waitForSelector('.vp-gal-tile.vp-multi', { state: 'attached', timeout: 8000 });
  await p.waitForTimeout(800);
  const t = await p.evaluate(() => {
    const tile = document.querySelector('.vp-gal-tile.vp-multi'), s = tile.querySelector('.vp-gal-strip');
    return { prev: getComputedStyle(tile.querySelector('.vp-prev')).display, next: getComputedStyle(tile.querySelector('.vp-next')).display, scroll: s.scrollWidth > s.clientWidth, snap: getComputedStyle(s).scrollSnapType };
  });
  check(t.prev === 'none' && t.next === 'none', 'телефон: стрелок и зон нет');
  check(t.scroll && /x/.test(t.snap), `телефон: лента листается пальцем (прокрутка есть, прилипание ${t.snap})`);
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
