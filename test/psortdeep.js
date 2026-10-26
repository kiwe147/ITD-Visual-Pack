// Плашка сортировки профиля ставится только перед самым первым постом списка (слот со сдвигом 0).
// Если пост из середины виртуального списка оказался «первым прорисованным», плашка в него не переезжает
// (раньше она прыгала между слотами, меняла их высоту и список дёргался на каждом кадре).
// Запуск:  node test/psortdeep.js снимок-своего-профиля.html
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
  const p = await (await b.newContext({ viewport: { width: 1500, height: 900 } })).newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (t === 'image') return r.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#556"/></svg>' });
    if (t === 'font') return r.abort();
    if (t === 'stylesheet') return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/@NeuroSFW');
  await p.evaluate(() => document.querySelectorAll('.vp-psort').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForSelector('.vp-psort', { timeout: 8000 }).catch(() => { });
  const top = await p.evaluate(() => { const b = document.querySelector('.vp-psort'); return !!b && b.nextElementSibling && b.nextElementSibling.tagName === 'ARTICLE' && /translateY\(0/.test(b.parentElement.style.transform); });
  check(top, 'у первого поста списка плашка есть');
  const deep = await p.evaluate(async () => {
    document.querySelectorAll('.vp-psort').forEach(e => e.remove());
    const slot = document.querySelector('article').parentElement;
    slot.style.transform = 'translateY(4000px)';
    const seen = [];
    for (let i = 0; i < 12; i++) { await new Promise(r => setTimeout(r, 100)); seen.push(document.querySelectorAll('.vp-psort').length); }
    return seen;
  });
  check(deep.every(n => n === 0), 'пост из середины списка плашку не получает: ' + deep.join(''));
  const back = await p.evaluate(async () => {
    document.querySelector('article').parentElement.style.transform = 'translateY(0px)';
    await new Promise(r => setTimeout(r, 800));
    return document.querySelectorAll('.vp-psort').length;
  });
  check(back === 1, 'вернулись к началу списка, плашка снова на месте (' + back + ')');
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
