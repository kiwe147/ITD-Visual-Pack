// Статистика запросов мода к сайту: что, когда и как часто уходит на сервер.
// Время виртуальное (page.clock): 1 секунда = runFor(1000). Сервер поддельный, с постраничными комментариями.
// Запуск: node test/reqstat.js снимок.html [сценарий] [минут] [комментариев_проверки] [комментариев_лички] [людей]
//   сценарий: feed (лента, сообщения закрыты) | msgs (окно сообщений открыто) | hidden (вкладка скрыта) | two (две вкладки)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [, , snapFile, scen = 'feed', MIN = '10', VCOM = '600', MCOM = '300', PEOPLE = '40'] = process.argv;
const snap = fs.readFileSync(snapFile, 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const VER = 'a0d6625a-b3ec-44c4-98da-48422af101d5', MSG = 'a53b53e0-9950-4f62-83f4-91e5985ef6c5';
const OWNER = '5e064703-104d-4794-bc28-9ed6f5847cca';
const SALT = src.match(/SECRET_SALT = '([^']+)'/)[1];
const hashString = str => { let h = 0; for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h = h & h; } return Math.abs(h).toString(36); };
const code = u => hashString(u + SALT).substring(0, 8).padEnd(8, '0');
const uid = i => '00000000-0000-4000-8000-' + String(i).padStart(12, '0');
const people = Array.from({ length: +PEOPLE }, (_, i) => ({ id: uid(i + 1), username: 'user' + (i + 1), displayName: 'Юзер ' + (i + 1) }));
const ME = people[0];
const mk = (i, a, content) => ({ id: 'c' + i, author: a, content, createdAt: new Date(Date.now() - (5000 - i) * 60000).toISOString() });
const ver = [mk(0, { id: OWNER, username: 'NeuroSFW' }, 'ITDX-V ' + people.map(p => p.id).join(' '))];
people.forEach((p, i) => ver.push(mk(i + 1, p, code(p.id) + '1')));
for (let i = ver.length; i < +VCOM; i++) ver.push(mk(i, people[i % people.length], 'комментарий ' + i));
const msgs = [];
for (let i = 0; i < +MCOM; i++) msgs.push(mk(i, people[i % people.length], 'ITDXM1 ' + i + ' cAAAA'));

const log = [];
let vt = 0;
const cls = (u, m) => {
  let p = u.pathname.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, ':id').replace(/\/users\/(?!me\b)[^/]+$/, '/users/:name');
  if (u.pathname.includes(VER) && u.pathname.endsWith('/comments')) p = 'комментарии ПРОВЕРКИ';
  else if (u.pathname.includes(MSG) && u.pathname.endsWith('/comments')) p = 'комментарии ЛИЧКИ';
  return m + ' ' + p;
};

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  const open = async (hidden) => {
    const p = await ctx.newPage();
    p.errors = [];
    p.on('pageerror', e => p.errors.push(e.message));
    await p.route('**/*', async r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font', 'media'].includes(t) || u.hostname.startsWith('cdn.')) return r.fulfill({ status: 204, body: '' });
      if (u.origin !== ORIGIN) return r.fulfill({ status: 204, body: '' });
      log.push({ t: vt, k: cls(u, req.method()), tab: p.tag });
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify(ME) });
      const um = u.pathname.match(/^\/api\/users\/([\w]+)$/);
      if (um) { const pp = people.find(x => x.username === um[1]); return pp ? r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { ...pp, online: false, lastSeen: new Date().toISOString() } }) }) : r.fulfill({ status: 404, body: '' }); }
      const cm = u.pathname.match(/^\/api\/posts\/([\w-]+)\/comments$/);
      if (cm && req.method() === 'GET') {
        const all = cm[1] === VER ? ver : cm[1] === MSG ? msgs : [];
        const from = +(u.searchParams.get('cursor') || 0), lim = +(u.searchParams.get('limit') || 20), page = all.slice(from, from + lim);
        const more = from + lim < all.length;
        return r.fulfill({ contentType: 'application/json', headers: { date: new Date().toUTCString() }, body: JSON.stringify({ data: { comments: page, hasMore: more, nextCursor: more ? String(from + lim) : null } }) });
      }
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m, hid]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
      if (hid) { Object.defineProperty(document, 'hidden', { get: () => true }); Object.defineProperty(document, 'visibilityState', { get: () => 'hidden' }); }
    }, [src.slice(0, src.indexOf('==/UserScript==')), !!hidden]);
    return p;
  };
  await ctx.clock.install({ time: Date.now() });
  const tabs = [];
  const start = async (hidden, tag) => {
    const p = await open(hidden); p.tag = tag;
    await p.goto(ORIGIN + '/');
    await p.evaluate(() => document.querySelectorAll('.vp-msgs, .vp-nav-blob, .vp-fab, .vp-rail').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    tabs.push(p);
    return p;
  };
  const A = await start(scen === 'hidden', 'A');
  if (scen === 'two') await start(false, 'B');
  const T = +MIN * 60;
  for (let s = 0; s < T; s++) {
    vt = s;
    if (scen === 'msgs' && s === 5) { await A.evaluate(() => { const a = document.querySelector('nav a[href="#"]'); if (a) a.click(); }); }
    await ctx.clock.runFor(1000);
    await A.waitForTimeout(20);
  }
  const sc = await A.evaluate(() => { try { return window.itdvp.sched(); } catch (e) { return String(e); } });
  console.log('планировщик:', JSON.stringify(sc));
  const nt = await A.evaluate(() => { try { return window.itdvp.net(10).запросы; } catch (e) { return String(e); } });
  console.log('учёт запросов в моде (itdvp.net):', JSON.stringify(nt).slice(0, 600));
  const by = {};
  log.forEach(l => { by[l.k] = (by[l.k] || 0) + 1; });
  console.log(`\nСЦЕНАРИЙ ${scen}: ${MIN} мин, людей ${PEOPLE}, комментариев проверки ${VCOM}, лички ${MCOM}; страница: ${path.basename(snapFile)}`);
  console.log('ВСЕГО запросов:', log.length, ' = ', (log.length / +MIN * 60).toFixed(0), 'в час при такой частоте');
  Object.entries(by).sort((a, c) => c[1] - a[1]).forEach(([k, n]) => console.log('  ' + String(n).padStart(5), k));
  const perMin = Array.from({ length: +MIN }, () => 0);
  log.forEach(l => { perMin[Math.min(+MIN - 1, l.t / 60 | 0)]++; });
  console.log('по минутам:', perMin.join(' '));
  let mx = 0, at = 0;
  for (let s = 0; s + 10 <= T; s++) { const n = log.filter(l => l.t >= s && l.t < s + 10).length; if (n > mx) { mx = n; at = s; } }
  console.log(`пик: ${mx} запросов за 10 секунд (с ${at}-й секунды)`);
  const first = log.filter(l => l.t < 30), fb = {};
  first.forEach(l => { fb[l.k] = (fb[l.k] || 0) + 1; });
  console.log('первые 30 секунд после загрузки:', first.length, JSON.stringify(fb));
  console.log('ошибки страницы:', A.errors.slice(0, 3).join(' | ') || 'нет');
  fs.writeFileSync(path.join(__dirname, 'out', `reqstat-${scen}.json`), JSON.stringify(log));
  await b.close();
})();
