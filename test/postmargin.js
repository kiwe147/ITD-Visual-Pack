// Отступ под постом (16px) действует с первого мгновения, до того как мод успел пометить пост классом vp-post: иначе список сайта замеряет пост без отступа, а через миг высота вырастает на 16 и лента дёргается.
// Запуск:  node test/postmargin.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const q = r.request(), u = new URL(q.url()), t = q.resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (t === 'stylesheet') return r.continue();
    if (t === 'image' || t === 'font') return r.abort();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1","displayName":"NeuroSFW"}' });
    return r.fulfill({ contentType: 'application/json', body: '{}' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(500);
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2000);
  const r = await p.evaluate(() => {
    const art = document.querySelector('article[data-alice-water-anchor-kind="post"]');
    const slot = art.parentElement, clone = slot.cloneNode(true), a = clone.querySelector('article');
    a.classList.remove('vp-post');
    slot.after(clone);
    return { margin: getComputedStyle(a).marginBottom, hasClass: a.classList.contains('vp-post') };
  });
  check(!r.hasClass && r.margin === '16px', 'у нового поста без класса мода отступ уже 16px: ' + JSON.stringify(r));
  check(!errors.length, 'ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
