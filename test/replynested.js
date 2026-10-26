// Плашка ответа на комментарий: стиль «вложенной» плашки (vp-nested) не слетает, когда сайт перерисовывает её класс (прикрепили миниатюру и сняли).
// Запуск:  node test/replynested.js снимок-с-открытым-ответом-без-миниатюры.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8').replace(/ vp-nested/g, '');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const req = r.request(), u = new URL(req.url()), t = req.resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me' && req.method() === 'GET') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: 'NeuroSFW', id: OWNER }) });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, [src.slice(0, src.indexOf('==/UserScript=='))]);
  await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
  await p.goto(ORIGIN + new URL(snap.match(/"url": "([^"]+)"/) ? snap.match(/"url": "([^"]+)"/)[1] : ORIGIN + '/').pathname);
  await p.waitForTimeout(3000);
  const st = () => p.evaluate(() => { const e = document.querySelector('.pkqD') && document.querySelector('.pkqD').parentElement; return e ? { cls: e.className, nested: e.classList.contains('vp-nested'), rad: getComputedStyle(e).borderRadius, bg: getComputedStyle(e).backgroundColor } : null; });
  let s0 = await st();
  check(s0 && s0.nested, 'плашка ответа получила стиль vp-nested: ' + JSON.stringify(s0));
  const sync = await p.evaluate(async () => { const e = document.querySelector('.pkqD').parentElement; e.className = 'wSFu k1D7 d67y'; await Promise.resolve(); return e.classList.contains('vp-nested'); });
  check(sync, 'класс возвращается сразу, до отрисовки кадра (без мигания старого стиля)');
  await p.waitForTimeout(900);
  const s1 = await st();
  check(s1 && s1.nested && s1.rad === '18px', 'после того как сайт сбросил класс (миниатюра) стиль вернулся: ' + JSON.stringify(s1));
  await p.evaluate(() => { const e = document.querySelector('.pkqD').parentElement; e.className = 'wSFu d67y'; });
  await p.waitForTimeout(900);
  const s2 = await st();
  check(s2 && s2.nested, 'после снятия миниатюры стиль на месте: ' + JSON.stringify(s2));
  check(!errors.length, 'ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
