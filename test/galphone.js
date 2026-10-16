// Галерея на телефоне: стрелки заменены зонами по краям на всю высоту карточки. Нажатие у правого края — следующая картинка,
// у левого — предыдущая, у крайней — ничего и пост не открывается, середина открывает пост; свайп по краю листает как раньше.
// Запуск:  node test/galphone.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const near = (a, b, d) => Math.abs(a - b) <= d;
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
    window.__push = 0;
    const ps = history.pushState; history.pushState = function () { window.__push++; return ps.apply(this, arguments); };
  });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2000);
  const nav = await p.evaluate(() => !!document.querySelector('.vp-gal-btn'));
  check(nav, 'в шапке есть кнопка галереи');
  await p.evaluate(() => document.querySelector('.vp-gal-btn').click());
  await p.waitForSelector('.vp-gal-tile.vp-multi', { state: 'attached', timeout: 8000 });
  await p.waitForTimeout(800);
  const R = () => p.evaluate(() => {
    const t = document.querySelector('.vp-gal-tile.vp-multi'), s = t.querySelector('.vp-gal-strip'), r = t.getBoundingClientRect();
    const n = t.querySelector('.vp-gal-arrow.vp-next'), pv = t.querySelector('.vp-gal-arrow.vp-prev');
    const nr = n.getBoundingClientRect(), pr = pv.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, i: Math.round(s.scrollLeft / s.clientWidth), pe: getComputedStyle(n).pointerEvents, nw: nr.width, nh: nr.height, pw: pr.width, edgePrev: pv.classList.contains('vp-edge'), svg: getComputedStyle(n.querySelector('svg')).display, push: window.__push };
  });
  let t = await R();
  check(near(t.nh, t.h, 1) && near(t.nw, Math.min(96, t.w * 0.22), 1.5), `телефон: зона на всю высоту карточки (${Math.round(t.nw)}x${Math.round(t.nh)} из ${Math.round(t.w)}x${Math.round(t.h)})`);
  check(t.svg === 'none', 'телефон: стрелки-значка нет');
  check(t.pe === 'none', 'телефон: зона сама нажатий не ловит (свайп по краю идёт мимо неё)');
  const base = t.push;
  const tapAt = async (fx, fy) => { const q = await R(); await p.touchscreen.tap(q.x + q.w * fx, q.y + q.h * fy); await p.waitForTimeout(600); return R(); };
  t = await tapAt(0.04, 0.5);
  check(t.i === 0 && t.push === base, 'нажатие у левого края первой картинки: ничего, пост не открылся');
  t = await tapAt(0.96, 0.5);
  check(t.i === 1 && t.push === base, `нажатие у правого края: вторая картинка (${t.i}), пост не открылся`);
  t = await tapAt(0.96, 0.15);
  check(t.i === 2 && t.push === base, `у правого края вверху: третья картинка (${t.i})`);
  t = await tapAt(0.96, 0.5);
  check(t.i === 2 && t.push === base, 'у правого края последней: ничего, пост не открылся');
  t = await tapAt(0.03, 0.85);
  check(t.i === 1 && t.push === base, `у левого края внизу: назад на ${t.i + 1}-ю`);
  const before = (await R()).push;
  await p.evaluate(() => { document.querySelector('.vp-gal-tile.vp-multi').scrollIntoView({ block: 'center' }); });
  const q = await R();
  await p.touchscreen.tap(q.x + q.w * 0.5, q.y + q.h * 0.5);
  await p.waitForTimeout(700);
  const after = await p.evaluate(() => ({ push: window.__push, path: location.pathname + location.hash, modal: !!document.querySelector('[role="dialog"]') }));
  check(after.push > before || after.path !== '/' || after.modal, 'нажатие по середине открывает пост ' + JSON.stringify(after));
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
