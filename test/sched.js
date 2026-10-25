// Планировщик фоновых задач и учёт запросов мода: задачи зарегистрированы, запускаются, не падают; itdvp.net() считает запросы.
// Запуск:  node test/sched.js снимок.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const meta = src.slice(0, src.indexOf('==/UserScript=='));
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errors = [], times = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const q = r.request(), u = new URL(q.url());
    if (u.origin === 'https://xn--d1ah4a.com' && q.resourceType() === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(q.resourceType())) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: 'u1', followersCount: 236, followingCount: 125, postsCount: 573 }) });
    if (u.pathname.startsWith('/api/')) times.push(Date.now());
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => { const s = { backgroundEnabled: false, introEnabled: false }; window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; }; window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0); window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window; }, meta);
  await p.goto('https://xn--d1ah4a.com/');
  await p.evaluate(() => document.querySelectorAll('.vp-msgs, .vp-nav-blob, .vp-fab, .vp-rail').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(16000);
  const t = await p.evaluate(() => window.itdvp.sched());
  console.log(JSON.stringify(t));
  const ids = t.map(x => x.задача);
  for (const id of ['autolike', 'look', 'verify', 'packs', 'msgBackground', 'callSync', 'clubRender', 'clubPoll']) check(ids.includes(id), 'задача «' + id + '» зарегистрирована');
  check(t.every(x => x.ошибок === 0), 'ни одна задача не упала');
  check(t.find(x => x.задача === 'callSync').запусков >= 5, 'секундная задача звонков работает (запусков ' + t.find(x => x.задача === 'callSync').запусков + ')');
  const net = await p.evaluate(() => window.itdvp.net(5));
  check(Array.isArray(net.запросы) && net.запросы.some(x => x.мод > 0), 'учёт запросов мода ведётся: ' + JSON.stringify(net.запросы.slice(0, 3)));
  let minGap = 1e9; for (let i = 1; i < times.length; i++) minGap = Math.min(minGap, times[i] - times[i - 1]);
  console.log('запросов к API за 16 с:', times.length);
  check(!errors.length, 'ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
