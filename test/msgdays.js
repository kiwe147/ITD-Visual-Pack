// «Сообщения»: дата дня стоит по центру отдельной плашкой («Сегодня», «Вчера», «26 октября», с годом для прошлых лет), а у сообщения в пузыре только время.
// Запуск:  node test/msgdays.js снимок-ленты.html   (SHOT=путь.png — снимок окна)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8')
  .replace('            function paintDays(keep) {', '            window.__pd = k => paintDays(k); window.__mm = (t, m) => msgMetaText(t, m);\n            function paintDays(keep) {');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 900, height: 900 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'font'].includes(t)) return r.abort();
    if (t === 'stylesheet') return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"me-id"}' });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => document.querySelectorAll('.vp-msgs, .vp-nav-blob, .vp-fab, .vp-rail').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  await p.$eval('nav a[href="#"]', a => a.click());
  await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('.vp-msgs-row').click());
  await p.waitForTimeout(800);
  const res = await p.evaluate(() => {
    const feed = document.querySelector('.vp-msgs-feed');
    feed.innerHTML = '';
    const day = 86400, now = Math.floor(Date.now() / 1000);
    const at = (daysAgo, hh, mm) => { const d = new Date(); d.setHours(hh, mm, 0, 0); return Math.floor(d.getTime() / 1000) - daysAgo * day; };
    const add = (dir, text, ts) => { const b = document.createElement('div'); b.className = 'vp-msgs-b vp-' + dir; b.textContent = text; const i = document.createElement('i'); i.textContent = window.__mm({ uid: 'x' }, { ts, dir: 'in' }); b.appendChild(i); b._m = { ts }; b.dataset.ts = ts; b.dataset.dir = dir; feed.appendChild(b); return i.textContent; };
    const clocks = [add('in', 'давно', at(400, 11, 5)), add('out', 'ещё давно', at(400, 11, 7)), add('in', 'на неделе', at(5, 20, 44)), add('out', 'вчера', at(1, 23, 59)), add('in', 'вчера ещё', at(1, 23, 59)), add('out', 'сегодня', at(0, 0, 1))];
    const row = document.createElement('div'); row.className = 'vp-msgs-callrow'; row.dataset.cts = at(0, 0, 1) + 1; row.innerHTML = '<span>Звонок</span><time>00:01</time>'; feed.appendChild(row);
    window.__pd(true);
    const kids = [...feed.children].map(e => e.classList.contains('vp-msgs-day') ? '#' + e.textContent : e.classList.contains('vp-msgs-callrow') ? '☎' : e.firstChild.textContent);
    const day0 = feed.querySelector('.vp-msgs-day');
    return { kids, clocks, align: getComputedStyle(day0).alignSelf, w: day0.getBoundingClientRect().width, fw: feed.getBoundingClientRect().width, cx: Math.round(day0.getBoundingClientRect().left + day0.getBoundingClientRect().width / 2), fcx: Math.round(feed.getBoundingClientRect().left + feed.getBoundingClientRect().width / 2) };
  });
  const yr = new Date().getFullYear() - 1;
  const days = res.kids.filter(k => k[0] === '#');
  check(days.length === 4, 'четыре дня — четыре плашки: ' + days.join(' | '));
  check(/\d{4}$/.test(days[0]) && days[0].endsWith(String(new Date(Date.now() - 400 * 864e5).getFullYear())), 'давняя дата с годом: ' + days[0]);
  check(!/\d{4}$/.test(days[1]) && /[а-я]/.test(days[1]), 'дата этого года без года: ' + days[1]);
  check(days[2] === '#Вчера' && days[3] === '#Сегодня', 'Вчера и Сегодня: ' + days.slice(2).join(', '));
  const order = res.kids.join(' / ');
  check(res.kids[0][0] === '#' && res.kids.indexOf('#Вчера') < res.kids.indexOf('вчера') && res.kids.indexOf('#Сегодня') < res.kids.indexOf('сегодня') && res.kids.indexOf('#Сегодня') < res.kids.indexOf('☎'), 'плашка стоит перед сообщениями своего дня: ' + order);
  check(res.clocks.every(c => /^\d\d:\d\d$/.test(c)), 'у сообщения в пузыре только время, без даты: ' + res.clocks.join(' '));
  check(res.align === 'center' && Math.abs(res.cx - res.fcx) <= 2, 'плашка по центру окна (' + res.cx + ' и ' + res.fcx + ')');
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT });
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
