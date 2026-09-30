// Версии мода у пользователей (3.4.4). Мод добавляет свою версию в стиль профиля (ITDXL1 … ver=<версия>, под постом галочек).
// Админка «Версии у пользователей»: все с модом, у кого какая версия, сколько на последней; кто ещё не прислал — «старше 3.4.4».
// Запуск:  node test/versions.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8')
  .replace('function generateCode(', 'window.__gc = (...a) => generateCode(...a); function generateCode(')
  .replace('function openText(content) {', 'window.__ot = c => openText(c); function openText(content) {');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const VER = src.match(/@version\s+(\S+)/)[1];
const VPOST = src.match(/const VERIFICATION_POST_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const U = n => ({ id: `${n}${n}${n}${n}${n}${n}${n}${n}-${n}${n}${n}${n}-4${n}${n}${n}-8${n}${n}${n}-${n.repeat(12)}`, username: 'u' + n, displayName: 'Юзер ' + n });
const users = { 2: U('2'), 3: U('3'), 4: U('4'), 5: U('5') };
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
let comments = [], sent = [];
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  await p.route('**/*', r => {
    const req = r.request(), u = new URL(req.url()), t = req.resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: OWNER, username: 'NeuroSFW', displayName: 'Нейро' }) });
    if (u.pathname === `/api/posts/${VPOST}/comments`) {
      if (req.method() === 'GET') return r.fulfill({ contentType: 'application/json', headers: { date: new Date().toUTCString() }, body: JSON.stringify({ data: { comments, hasMore: false } }) });
      sent.push(JSON.parse(req.postData()).content);
      return r.fulfill({ status: 201, contentType: 'application/json', body: '{"data":{"id":"x"}}' });
    }
    if (req.method() === 'PATCH') { sent.push(JSON.parse(req.postData()).content); return r.fulfill({ contentType: 'application/json', body: '{"data":{}}' }); }
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m, v]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, val) => { s[k] = val; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: v }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, [src.slice(0, src.indexOf('==/UserScript==')), VER]);
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => document.querySelectorAll('.vp-fab, .vp-msgs, .vp-rail, .vp-nav-blob').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(1500);
  const code = await p.evaluate(ids => ids.map(id => window.__gc(id) + '1'), Object.values(users).map(x => x.id));
  let n = 0;
  const C = (u, content) => ({ id: 'c' + (++n), author: u, content, createdAt: new Date(Date.now() - n * 3600e3).toISOString() });
  comments = [
    C(users[2], code[0]), C(users[2], `ITDXL1 n=white b=- g=11 ver=${VER}`),
    C(users[3], code[1]), C(users[3], 'ITDXL1 n=fire b=- g=11 ver=3.4.3.2'),
    C(users[4], code[2]), C(users[4], 'ITDXL1 n=white b=- g=11'),
    C(users[5], code[3]),
    C({ id: '66666666-6666-4666-8666-666666666666', username: 'random' }, 'просто комментарий')
  ];
  await p.waitForTimeout(62000);
  const looks = await p.evaluate(s => s.map(c => window.__ot(c)).filter(t => /^ITDXL1 /.test(t)), sent);
  check(looks.some(t => t.includes(' ver=' + VER)), `свой мод отправил версию в стиль (${looks.slice(-1)[0] || 'ничего'})`);
  await p.click('.vp-fab-btn');
  await p.waitForTimeout(300);
  await p.$eval('.vp-fab [data-act="versions"]', x => x.click());
  await p.waitForFunction(() => { const h = document.querySelector('.vp-vers .vp-admin-head span'); return h && !/загрузка/.test(h.textContent); }, null, { timeout: 20000 });
  const st = await p.evaluate(() => ({
    head: document.querySelector('.vp-vers .vp-admin-head span').textContent,
    chips: [...document.querySelectorAll('.vp-vers-chip')].map(x => x.textContent),
    rows: [...document.querySelectorAll('.vp-vers-row')].map(r => r.querySelector('a').textContent + ' = ' + r.querySelector('.vp-vers-v').textContent + ' ' + r.querySelector('.vp-vers-v').className.split(' ').pop())
  }));
  console.log('—    ' + st.head + ' | ' + st.chips.join(', '));
  st.rows.forEach(r => console.log('—      ' + r));
  check(st.rows.length === 4, `в списке 4 человека с модом, случайный комментатор и сам владелец не считаются (${st.rows.length})`);
  check(st.rows[0] === `Юзер 2 = ${VER} vp-new`, 'Юзер 2 на последней версии — зелёный, первым');
  check(st.rows[1] === 'Юзер 3 = 3.4.3.2 vp-old', 'Юзер 3 на старой 3.4.3.2 — жёлтый');
  check(st.rows.slice(2).every(r => /старше 3\.4\.4 vp-unk$/.test(r)), 'Юзер 4 (стиль без версии) и Юзер 5 (только код) — «старше 3.4.4»');
  check(st.head === 'с модом 4, на последней 1', `итог сверху (${st.head})`);
  await (await p.$('.vp-vers')).screenshot({ path: path.join(__dirname, 'out', 'versions.png') });
  check(!p.errors.length, 'ошибок нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
