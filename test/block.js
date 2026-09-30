// Блокировка в личке (3.3.15.2): «•••» в шапке чата → «Заблокировать». От заблокированного не приходят новые сообщения,
// звонки и всплывашки; поле ввода и звонок выключены. Разблокировал — новое снова приходит, написанное во время блокировки — нет.
// Запуск:  node test/block.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8')
  .replace('const msgNet = {', 'const msgNet = window.__msgNet = {');
const ORIGIN = 'https://xn--d1ah4a.com', POST = 'a53b53e0-9950-4f62-83f4-91e5985ef6c5';
const OWNER = '5e064703-104d-4794-bc28-9ed6f5847cca';
const USERS = { NeuroSFW: { id: OWNER, username: 'NeuroSFW', displayName: 'Нейро' }, bob: { id: 'u2', username: 'bob', displayName: 'Боб' } };
const VERIFIED = { NeuroSFW: { code: 'x', hasMod: true, id: OWNER, state: 'approved' }, bob: { code: 'x', hasMod: true, id: 'u2', state: 'approved' } };
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
let comments = [], n = 0;
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const open = async (who, other) => {
    const ctx = await b.newContext({ viewport: { width: 1200, height: 860 } });
    await ctx.grantPermissions(['microphone'], { origin: ORIGIN });
    const p = await ctx.newPage();
    p.errors = [];
    p.on('pageerror', e => p.errors.push(e.message));
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
  const reopen = async (p, id) => {
    await p.evaluate(id => { const bk = document.querySelector('.vp-msgs-chat:not([hidden]) .vp-msgs-back'); if (bk) bk.click(); document.querySelector(`.vp-msgs-row[data-id="${id}"]`).click(); }, id);
    await p.waitForTimeout(1500);
  };
  const bubbles = p => p.$$eval('.vp-msgs-feed .vp-msgs-b', bs => bs.map(x => (x.classList.contains('vp-out') ? '→' : '←') + x.firstChild.textContent));
  const say = async (p, text) => { await p.fill('.vp-msgs-bar input', text); await p.$eval('.vp-msgs-send', x => x.click()); await p.waitForTimeout(2500); };
  const clickEl = (p, sel) => p.$eval(sel, x => x.click());

  const A = await open('NeuroSFW', 'bob');
  await key(A.p, 'лунный кот 42');
  const B = await open('bob', 'NeuroSFW');
  await key(B.p, 'bob-password-1');
  await say(B.p, 'до блокировки');
  await reopen(A.p, 'u:bob');
  check((await bubbles(A.p)).join('|') === '←до блокировки', 'до блокировки сообщение видно');
  await clickEl(A.p, '.vp-msgs-more');
  await A.p.waitForTimeout(200);
  const item = await A.p.$eval('.vp-msgs-hmenu:not([hidden]) button', x => x.textContent.trim()).catch(() => null);
  check(item === 'Заблокировать', `в «•••» пункт «Заблокировать» (${item})`);
  await A.p.screenshot({ path: path.join(__dirname, 'out', 'block-1-menu.png'), clip: { x: 300, y: 0, width: 800, height: 260 } });
  await clickEl(A.p, '.vp-msgs-hmenu button');
  await A.p.waitForTimeout(2500);
  const ui = await A.p.evaluate(() => ({ note: (document.querySelector('.vp-msgs-blocked') || {}).textContent || '', input: document.querySelector('.vp-msgs-bar input').disabled, call: document.querySelector('.vp-msgs-call').hidden }));
  check(/заблокировал/.test(ui.note) && ui.input && ui.call, `после блокировки: плашка, поле ввода и звонок выключены (${JSON.stringify(ui)})`);
  await A.p.screenshot({ path: path.join(__dirname, 'out', 'block-2-blocked.png') });
  await say(B.p, 'во время блокировки');
  await clickEl(B.p, '.vp-msgs-call');
  await A.p.waitForTimeout(16000);
  check(!(await A.p.$('.vp-call-real')), 'звонок от заблокированного не звонит');
  const aSees = await A.p.evaluate(() => [...(__msgNet.conv.get('u2') || [])].map(m => m.text).join('|'));
  check(!/во время/.test(aSees), `сообщение от заблокированного не дошло (${aSees})`);
  check(await A.p.evaluate(() => !document.querySelector('.vp-msg-toast')), 'и всплывашки о нём нет');
  await B.p.evaluate(() => { const e = document.querySelector('.vp-call-real .vp-call-end'); if (e) e.click(); });
  await B.p.waitForTimeout(2500);
  await clickEl(A.p, '.vp-msgs-blocked button');
  await A.p.waitForTimeout(3000);
  const after = await A.p.evaluate(() => ({ input: document.querySelector('.vp-msgs-bar input').disabled, note: !!document.querySelector('.vp-msgs-blocked'), call: document.querySelector('.vp-msgs-call').hidden }));
  check(!after.input && !after.note && !after.call, `разблокировал — всё снова работает (${JSON.stringify(after)})`);
  await say(B.p, 'после разблокировки');
  await A.p.waitForTimeout(3000);
  await reopen(A.p, 'u:bob');
  await A.p.waitForFunction(() => document.querySelectorAll('.vp-msgs-feed .vp-msgs-b').length >= 2, null, { timeout: 15000 }).catch(() => { });
  const fin = (await bubbles(A.p)).join('|');
  console.log('—    у NeuroSFW: ' + fin);
  check(fin === '←до блокировки|←после разблокировки', 'после разблокировки новое приходит, написанное во время блокировки — нет');
  const rows = await A.p.$$eval('.vp-msgs-callrow', r => r.map(x => x.textContent));
  check(!rows.length, `звонок во время блокировки не попал в историю (${rows.join(' | ')})`);
  check(!A.p.errors.length && !B.p.errors.length, 'ошибок нет' + (A.p.errors.length + B.p.errors.length ? ': ' + [...A.p.errors, ...B.p.errors].join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
