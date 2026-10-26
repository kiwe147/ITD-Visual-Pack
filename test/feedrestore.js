// Восстановление места в ленте при возврате на страницу: если сохранённого поста не нашлось (список виртуальный, пост не прорисован или список всё растёт),
// мод не крутит страницу вниз бесконечно, а делает несколько попыток, возвращается на сохранённую высоту и останавливается.
// Запуск:  node test/feedrestore.js снимок-профиля.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8').replace('function feedRestore(k, s) {', 'function feedRestore(k, s) { window.__fr = (window.__fr || 0) + 1; window.__fr0 = JSON.stringify(s);').replace('function feedNav(pop) {', 'window.__fs = () => [feedSaved.size, feedPosts().length, feedAt, feedLoc]; function feedNav(pop) {');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
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
    window.__calls = []; window.__grow = false;
    const orig = window.scrollTo.bind(window);
    window.scrollTo = (...a) => {
      window.__calls.push(Math.round(performance.now()));
      if (window.__grow) {
        const list = [...document.querySelectorAll('article.vp-post')], last = list[list.length - 1];
        if (last) {
          const c = last.cloneNode(true), id = 'aaaaaaaa-bbbb-4ccc-8ddd-' + String(window.__calls.length).padStart(12, '0');
          c.setAttribute('data-alice-water-anchor-id', id);
          c.querySelectorAll('*').forEach(e => { if (e.children.length === 0 && e.textContent.trim().length > 3) e.textContent = 'новый пост ' + id; });
          last.after(c);
        }
      }
      return orig(...a);
    };
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/@l1kaa11');
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  await p.evaluate(() => window.scrollTo(0, 900));
  await p.waitForTimeout(700);
  console.log('—    после прокрутки: ' + JSON.stringify(await p.evaluate(() => window.__fs && window.__fs())));
  await p.evaluate(() => {
    document.querySelectorAll('article').forEach(a => { a.setAttribute('data-alice-water-anchor-id', 'dead' + Math.random().toString(16).slice(2, 10) + '-0000-4000-8000-000000000000'); a.querySelectorAll('a[href^="/@"]').forEach(l => l.setAttribute('href', '/@somebody' + Math.floor(Math.random() * 1e6))); });
    history.pushState({}, '', '/other'); document.dispatchEvent(new Event('vp-loc'));
  });
  await p.waitForTimeout(300);
  await p.evaluate(() => { window.__calls = []; window.__grow = true; history.back(); window.__t0 = Math.round(performance.now()); });
  await p.waitForTimeout(500);
  console.log('—    сразу после возврата: ' + JSON.stringify(await p.evaluate(() => [window.__fs && window.__fs(), window.__fr, window.__fr0])));
  await p.waitForTimeout(7500);
  const r = await p.evaluate(() => ({ n: window.__calls.length, last: window.__calls.length ? window.__calls[window.__calls.length - 1] - window.__t0 : 0 }));
  console.log('—    прокруток мода после возврата: ' + r.n + ', последняя через ' + r.last + ' мс');
  check(r.n <= 12, 'прокруток немного (' + r.n + ', раньше десятки)');
  check(r.last < 3000, 'мод перестаёт крутить за 3 секунды (' + r.last + ' мс)');
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
