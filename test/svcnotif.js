// Уведомления (3.3.13.11): служебные комментарии мода «ITDXE …», «ITDXK1 …» скрыты, хотя текст карточки склеен без пробела.
// На снимке 30.09 служебных 8: ITDXK1, 6 × ITDXE, ITDXS 1/1 (кусок пака стикеров).
// Запуск:  node test/svcnotif.js снимок-уведомлений.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: OWNER }) });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/notifications');
  const total = await p.$$eval('.vp-notif', n => n.length);
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  const st = await p.evaluate(() => {
    const all = [...document.querySelectorAll('.vp-notif')];
    const shown = all.filter(n => getComputedStyle(n).display !== 'none');
    return { all: all.length, shown: shown.length, svcShown: shown.filter(n => /ITDX[A-Z0-9-]*(?: \S{1,12}){0,3} [\w\-/+=]{8,}/.test(n.textContent)).map(n => n.textContent.slice(0, 60)), hidden: all.filter(n => n.dataset.vpSvc).length };
  });
  console.log('—    ' + JSON.stringify(st));
  check(st.svcShown.length === 0, 'служебных «ITDX…» среди видимых уведомлений нет');
  check(st.hidden === 8 && st.shown === st.all - 8, `скрыты только служебные (${st.hidden} из ${st.all}), обычные на месте`);
  await p.evaluate(() => { const n = [...document.querySelectorAll('.vp-notif')].find(x => x.dataset.vpSvc); const prev = n && n.previousElementSibling; if (prev) prev.scrollIntoView({ block: 'start' }); });
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(__dirname, 'out', 'svcnotif.png') });
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
