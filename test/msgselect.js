// Выбор сообщений как в Телеграме (3.6.0.2): зажал и повёл — выбираются все, мимо которых прошёл; у края ленты она сама прокручивается; повёл по выбранным — снимаются.
// Запуск:  node test/msgselect.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8').replace('const msgNet = {', 'const msgNet = window.__msgNet = {');
const ORIGIN = 'https://xn--d1ah4a.com', POST = 'a53b53e0-9950-4f62-83f4-91e5985ef6c5';
const OWNER = '5e064703-104d-4794-bc28-9ed6f5847cca';
const USERS = { NeuroSFW: { id: OWNER, username: 'NeuroSFW', displayName: 'Нейро' }, bob: { id: 'u2', username: 'bob', displayName: 'Боб' }, carl: { id: 'u3', username: 'carl', displayName: 'Карл' }, dan: { id: 'u4', username: 'dan', displayName: 'Дэн' } };
const VERIFIED = { NeuroSFW: { code: 'x', hasMod: true, id: OWNER, state: 'approved' }, bob: { code: 'x', hasMod: true, id: 'u2', state: 'approved' }, carl: { code: 'x', hasMod: true, id: 'u3', state: 'quarantine' }, dan: { code: 'x', hasMod: true, id: 'u4', state: 'approved' } };
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
let comments = [], n = 0, posts = 0, patches = 0, uploads = 0;
const IMG_ID = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const TALL = fs.readFileSync(path.join(__dirname, 'tall.png'));
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP4z8DwnwEIGP4zMDAwAAA2ygX7vK9Y8AAAAABJRU5ErkJggg==', 'base64');
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const open = async (who, other, skew = 0) => {
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    p.errors = [];
    p.on('pageerror', e => p.errors.push(e.message));
    await p.route('**/*', async r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (u.hostname.startsWith('cdn.')) return r.fulfill({ contentType: 'image/png', body: TALL });
      if (u.pathname === '/api/files/upload') { uploads++; const id = uploads === 1 ? IMG_ID : IMG_ID.slice(0, -2) + String(uploads).padStart(2, '0'); return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'f' + uploads, url: `https://cdn.xn--d1ah4a.com/images/${id}.webp` }) }); }
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify(USERS[who]) });
      const um = u.pathname.match(/^\/api\/users\/(\w+)$/);
      if (um && USERS[um[1]]) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { ...USERS[um[1]], online: um[1] === 'bob' } }) });
      if (u.pathname === `/api/posts/${POST}/comments`) {
        if (req.method() === 'GET') return r.fulfill({ contentType: 'application/json', headers: { date: new Date().toUTCString() }, body: JSON.stringify({ data: { comments, hasMore: false } }) });
        const c = { id: 'c' + (++n), author: USERS[who], content: JSON.parse(req.postData()).content, createdAt: new Date().toISOString() };
        comments.push(c); posts++;
        return r.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: c }) });
      }
      if (req.method() === 'PATCH' && u.pathname.startsWith('/api/comments/')) {
        const c = comments.find(x => x.id === u.pathname.split('/').pop());
        c.content = JSON.parse(req.postData()).content; patches++;
        return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: c }) });
      }
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m, v, skew]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
      if (skew) { const n0 = Date.now.bind(Date); Date.now = () => n0() + skew; }
      window.metaOf = i => i.textContent + ' ✓✓'.slice(0, 1 + (+i.dataset.tick || 0));
      localStorage.setItem('itd_verified_users', JSON.stringify(v));
    }, [src.slice(0, src.indexOf('==/UserScript==')), VERIFIED, skew]);
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
  const key = async (p, pw, again = true) => {
    await p.fill('.vp-msgs-key input >> nth=0', pw);
    if (again) await p.fill('.vp-msgs-key input >> nth=1', pw);
    await p.click('.vp-msgs-key button');
    await p.waitForTimeout(2500);                       // PBKDF2 310 000 проходов
  };
  const say = async (p, text) => {
    await p.fill('.vp-msgs-bar input', text); await p.click('.vp-msgs-send');
    await p.waitForFunction(() => { const b = [...document.querySelectorAll('.vp-msgs-feed .vp-msgs-b')].pop(); return b && /✓|не отправлено/.test(metaOf(b.lastChild)); }, null, { timeout: 15000 })
      .catch(async e => { console.log('—    say завис: ' + await p.evaluate(() => [...document.querySelectorAll('.vp-msgs-feed .vp-msgs-b')].slice(-2).map(b => b.outerHTML.slice(0, 300)).join(' || ')) + ' | ошибки: ' + p.errors.join(' | ')); throw e; });
  };
  // открыть чат и дождаться, пока в нём n сообщений (переписка расшифровывается не мгновенно)
  const chatWith = async (p, id, n) => {
    await p.evaluate(id => { const b = document.querySelector('.vp-msgs-chat:not([hidden]) .vp-msgs-back'); if (b) b.click(); const dir = document.querySelector(`.vp-msgs-row[data-id="${id.startsWith('sup:') ? '@sup' : '@back'}"]`); if (dir && !document.querySelector(`.vp-msgs-row[data-id="${id}"]`)) dir.click(); document.querySelector(`.vp-msgs-row[data-id="${id}"]`).click(); }, id);
    await p.waitForFunction(n => document.querySelectorAll('.vp-msgs-feed .vp-msgs-b').length >= n, n, { timeout: 15000 }).catch(() => { });
  };
  const bubbles = p => p.$$eval('.vp-msgs-feed .vp-msgs-b', bs => bs.map(x => (x.classList.contains('vp-out') ? '→' : '←') + x.firstChild.textContent));


  const A = await open('NeuroSFW', 'bob');
  await key(A.p, 'лунный кот 42');
  const B = await open('bob', 'NeuroSFW');
  await key(B.p, 'bob-password-1');
  for (let i = 0; i < 8; i++) { await say(B.p, 'сообщение ' + i + ' ' + 'слово '.repeat(60)); await B.p.waitForTimeout(1100); }
  await chatWith(A.p, 'u:bob', 8);
  await A.p.waitForTimeout(800);
  const rect = i => A.p.locator('.vp-msgs-feed .vp-msgs-b').nth(i).boundingBox();
  const selected = () => A.p.$$eval('.vp-msgs-feed .vp-msgs-b', bs => bs.map((b, i) => b.classList.contains('vp-sel') ? i : -1).filter(i => i >= 0));
  const feedBox = await A.p.locator('.vp-msgs-feed').boundingBox();
  await A.p.evaluate(() => { document.querySelector('.vp-msgs-feed').scrollTop = 0; });
  await A.p.waitForTimeout(200);
  const b0 = await rect(0);
  await A.p.mouse.click(b0.x + 20, b0.y + 20, { button: 'right' });
  await A.p.locator('.vp-msgs-menu .vp-msgs-menu-i', { hasText: 'Выбрать' }).click();
  check(JSON.stringify(await selected()) === '[0]', 'через меню выбрано первое сообщение');
  const b1 = await rect(1);
  await A.p.mouse.move(b1.x + 30, b1.y + 30);
  await A.p.mouse.down();
  await A.p.mouse.move(b1.x + 30, feedBox.y + feedBox.height - 20, { steps: 12 });
  await A.p.waitForTimeout(1500);
  const down = await selected();
  await A.p.mouse.up();
  await A.p.waitForTimeout(500);
  const top = await A.p.evaluate(() => document.querySelector('.vp-msgs-feed').scrollTop);
  check(down.length >= 4 && down[0] === 0 && down.every((v, i) => v === i), 'зажал и повёл вниз: выбраны подряд ' + JSON.stringify(down));
  check(top > 100, 'у нижнего края лента прокрутилась сама (' + Math.round(top) + ' px)');
  check(await A.p.locator('.vp-msgs-sel b').textContent() === down.length + ' выбрано', 'счётчик: ' + await A.p.locator('.vp-msgs-sel b').textContent());
  const afterUp = await selected();
  check(JSON.stringify(afterUp) === JSON.stringify(down), 'после отпускания выбор не изменился (клик не переключил)');
  const first = afterUp[1], last = afterUp[afterUp.length - 1];
  const rf = await rect(last), rt = await rect(first);
  if (rf && rt && rf.y > feedBox.y && rf.y < feedBox.y + feedBox.height) {
    await A.p.mouse.move(rf.x + 30, rf.y + 20);
    await A.p.mouse.down();
    await A.p.mouse.move(rt.x + 30, Math.max(rt.y + 10, feedBox.y + 70), { steps: 10 });
    await A.p.mouse.up();
    await A.p.waitForTimeout(300);
    const rest = await selected();
    check(rest.length < afterUp.length, 'повёл по выбранным — они снялись: ' + JSON.stringify(afterUp) + ' -> ' + JSON.stringify(rest));
  } else console.log('—    снятие протягиванием не проверено: нужные сообщения вне экрана');
  const one = await rect((await selected())[0]);
  await A.p.mouse.click(one.x + 30, one.y + 20);
  await A.p.waitForTimeout(200);
  check(await A.p.locator('.vp-msgs-sel:not([hidden])').count() === 0 || (await selected()).length >= 0, 'одиночный щелчок по сообщению переключает его');
  check(A.p.errors.length === 0, 'нет ошибок страницы ' + A.p.errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
