// Прочитанное в личке общее для устройств (3.4.0, проверка п.11): у NeuroSFW два устройства; bob пишет — непрочитанное видно на
// обоих; прочитал на одном — на втором значок пропадает сам (прочитанное хранится в служебной записи на сервере, не на устройстве).
// Запуск:  node test/readsync.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com', POST = 'a53b53e0-9950-4f62-83f4-91e5985ef6c5';
const OWNER = '5e064703-104d-4794-bc28-9ed6f5847cca';
const USERS = { NeuroSFW: { id: OWNER, username: 'NeuroSFW', displayName: 'Нейро' }, bob: { id: 'u2', username: 'bob', displayName: 'Боб' } };
const VERIFIED = { NeuroSFW: { code: 'x', hasMod: true, id: OWNER, state: 'approved' }, bob: { code: 'x', hasMod: true, id: 'u2', state: 'approved' } };
const MSG0 = 'глянь https://xn--d1ah4a.com/@l1kaa11/post/929f83fe-7170-4ca0-98df-7fc411207f51, и ещё https://example.com/a?b=1. javascript:alert(1) <img src=x onerror=alert(2)> итд.com/@bob';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
let comments = [], n = 0;
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const open = async (who, other) => {
    const ctx = await b.newContext({ viewport: { width: 1200, height: 860 } });
    const p = await ctx.newPage();
    p.errors = [];
    p.on('pageerror', e => p.errors.push(e.message));
    p.on('dialog', d => { p.errors.push('alert: ' + d.message()); d.dismiss(); });
    await p.route('**/*', async r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify(USERS[who]) });
      const um = u.pathname.match(/^\/api\/users\/(\w+)$/);
      if (um && USERS[um[1]]) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { ...USERS[um[1]], online: true } }) });
      if (u.pathname === `/api/posts/${POST}/comments`) {
        if (req.method() === 'GET') return r.fulfill({ contentType: 'application/json', headers: { date: new Date().toUTCString() }, body: JSON.stringify({ data: { comments, hasMore: false } }) });
        const c = { id: 'c' + (++n), author: USERS[who], content: JSON.parse(req.postData()).content, createdAt: new Date().toISOString() };
        comments.push(c);
        return r.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: c }) });
      }
      if (req.method() === 'PATCH' && u.pathname.startsWith('/api/comments/')) {
        const c = comments.find(x => x.id === u.pathname.split('/').pop());
        c.content = JSON.parse(req.postData()).content;
        return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: c }) });
      }
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m, v]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
      localStorage.setItem('itd_verified_users', JSON.stringify(v));
    }, [src.slice(0, src.indexOf('==/UserScript==')), VERIFIED]);
    await p.goto(ORIGIN + '/');
    await p.evaluate(() => document.querySelectorAll('.vp-msgs, .vp-nav-blob, .vp-fab, .vp-rail').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    await p.$eval('nav a[href="#"]', a => a.click());
    await p.waitForTimeout(800);
    await p.$eval(`.vp-msgs-row[data-id="u:${other}"]`, r => r.click());
    await p.waitForTimeout(800);
    return { p, ctx };
  };
  const key = async (p, pw) => {
    await p.fill('.vp-msgs-key input >> nth=0', pw);
    await p.fill('.vp-msgs-key input >> nth=1', pw);
    await p.click('.vp-msgs-key button');
    await p.waitForTimeout(2500);
  };
  const badge = p => p.evaluate(() => { const r = document.querySelector('.vp-msgs-row[data-id="u:bob"] .vp-msgs-badge'); return r ? +r.textContent : 0; });
  const A = await open('NeuroSFW', 'bob');
  await key(A.p, 'лунный кот 42');
  await A.p.evaluate(() => { const bk = document.querySelector('.vp-msgs-chat:not([hidden]) .vp-msgs-back'); if (bk) bk.click(); });
  const B = await open('bob', 'NeuroSFW');
  await key(B.p, 'bob-password-1');
  const A2 = await open('NeuroSFW', 'bob');
  await A2.p.fill('.vp-msgs-key input >> nth=0', 'лунный кот 42');
  await A2.p.click('.vp-msgs-key button');
  await A2.p.waitForTimeout(3000);
  await A2.p.evaluate(() => { const bk = document.querySelector('.vp-msgs-chat:not([hidden]) .vp-msgs-back'); if (bk) bk.click(); });
  for (const t of ['раз', 'два']) { await B.p.fill('.vp-msgs-bar input', t); await B.p.$eval('.vp-msgs-send', x => x.click()); await B.p.waitForTimeout(1500); }
  const both = await Promise.all([A.p, A2.p].map(p => p.waitForFunction(() => { const r = document.querySelector('.vp-msgs-row[data-id="u:bob"] .vp-msgs-badge'); return r && +r.textContent === 2; }, null, { timeout: 25000 }).then(() => true, () => false)));
  check(both[0] && both[1], `непрочитанные 2 видны на обоих устройствах (${await badge(A.p)} / ${await badge(A2.p)})`);
  await A.p.$eval('.vp-msgs-row[data-id="u:bob"]', r => r.click());
  await A.p.waitForTimeout(2500);
  await A.p.evaluate(() => { const bk = document.querySelector('.vp-msgs-chat:not([hidden]) .vp-msgs-back'); if (bk) bk.click(); });
  await A.p.waitForTimeout(500);
  check(await badge(A.p) === 0, 'на первом устройстве открыл чат — прочитано');
  const gone = await A2.p.waitForFunction(() => !document.querySelector('.vp-msgs-row[data-id="u:bob"] .vp-msgs-badge'), null, { timeout: 30000 }).then(() => true, () => false);
  check(gone, `на втором устройстве значок пропал сам (${await badge(A2.p)})`);
  check(!A.p.errors.length && !A2.p.errors.length && !B.p.errors.length, 'ошибок нет' + ([...A.p.errors, ...A2.p.errors, ...B.p.errors].length ? ': ' + [...A.p.errors, ...A2.p.errors, ...B.p.errors].join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
