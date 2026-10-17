// Картинка в сообщении открывается плавным увеличением из своего места и так же уезжает обратно (3.6.1.3).
// Запуск:  node test/imganim.js снимок-ленты.html
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
  await B.p.fill('.vp-msgs-bar input', 'котик');
  await B.p.setInputFiles('.vp-msgs-file', { name: 'cat.png', mimeType: 'image/png', buffer: TALL });
  await B.p.waitForTimeout(300);
  await B.p.click('.vp-msgs-send');
  await B.p.waitForFunction(() => { const b = [...document.querySelectorAll('.vp-msgs-feed .vp-msgs-b')].pop(); return b && /✓|не отправлено/.test(metaOf(b.lastChild)); }, null, { timeout: 15000 }).catch(() => { });
  await chatWith(A.p, 'u:bob', 1);
  await A.p.waitForTimeout(1200);
  const th = await A.p.locator('.vp-msgs-feed .vp-msgs-img').last().boundingBox();
  await A.p.click('.vp-msgs-feed .vp-msgs-imgw >> nth=-1');
  await A.p.waitForTimeout(90);
  const mid = await A.p.evaluate(() => {
    const im = document.querySelector('.vp-msgs-lb-body img'), an = im.getAnimations().find(a => a.effect && a.effect.getKeyframes().some(k => k.transform && k.transform !== 'none'));
    const r = im.getBoundingClientRect(), th = [...document.querySelectorAll('.vp-msgs-feed .vp-msgs-img')].pop();
    return { has: !!an, w: Math.round(r.width), x: Math.round(r.left), thumbHidden: getComputedStyle(th).visibility === 'hidden' };
  });
  await A.p.waitForTimeout(700);
  const end = await A.p.evaluate(() => { const im = document.querySelector('.vp-msgs-lb-body img'), r = im.getBoundingClientRect(); return { w: Math.round(r.width), x: Math.round(r.left), anim: im.getAnimations().length }; });
  check(mid.has, 'при открытии у картинки идёт анимация из своего места: ' + JSON.stringify(mid));
  check(mid.w < end.w && mid.w >= Math.round(th.width) - 3, `в начале хода картинка размером с миниатюру и растёт (${Math.round(th.width)} → ${mid.w} → ${end.w})`);
  check(mid.thumbHidden, 'пока картинка крупно, миниатюра в ленте скрыта');
  check(end.anim === 0, 'после хода анимаций нет');
  await A.p.screenshot({ path: path.join(__dirname, 'out', 'imganim-open.png') });
  await A.p.click('.vp-msgs-lb-top .vp-msgs-ib');
  await A.p.waitForTimeout(100);
  const back = await A.p.evaluate(() => { const im = document.querySelector('.vp-msgs-lb-body img'); return { still: !!im, w: im ? Math.round(im.getBoundingClientRect().width) : 0, anim: im ? im.getAnimations().length : 0 }; });
  check(back.still && back.anim > 0, 'при закрытии картинка уезжает обратно (анимация идёт): ' + JSON.stringify(back));
  await A.p.waitForTimeout(700);
  const gone = await A.p.evaluate(() => ({ lb: !!document.querySelector('.vp-msgs-lb'), vis: getComputedStyle([...document.querySelectorAll('.vp-msgs-feed .vp-msgs-img')].pop()).visibility, chat: !!document.querySelector('.vp-msgs.vp-open .vp-msgs-chat:not([hidden])') }));
  check(!gone.lb && gone.vis === 'visible' && gone.chat, 'после хода просмотр убран, миниатюра на месте, чат открыт: ' + JSON.stringify(gone));
  await A.p.click('.vp-msgs-feed .vp-msgs-imgw >> nth=-1');
  await A.p.waitForTimeout(700);
  await A.p.keyboard.press('Escape');
  await A.p.waitForTimeout(800);
  check(!(await A.p.locator('.vp-msgs-lb').count()) && await A.p.locator('.vp-msgs.vp-open .vp-msgs-chat:not([hidden])').count() === 1, 'Esc закрывает просмотр и оставляет чат');
  check(A.p.errors.length === 0, 'нет ошибок страницы ' + A.p.errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
