// Меню сообщения как в Телеграме (3.6.0): ответить цитатой, закрепить, переслать, удалить (у обоих / у себя), выбрать, копировать; второй человек видит всё само.
// Запуск:  node test/msgmenu.js снимок-ленты.html
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


  const labels = p => p.$$eval('.vp-msgs-menu .vp-msgs-menu-i', bs => bs.map(x => x.textContent));
  const until = async (fn, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await new Promise(r => setTimeout(r, 1000)); } return false; };
  const rightClick = async (p, i) => { const bb = await p.locator('.vp-msgs-feed .vp-msgs-b').nth(i).boundingBox(); await p.mouse.click(bb.x + 20, bb.y + bb.height / 2, { button: 'right' }); await p.waitForTimeout(250); };
  const clickItem = (p, label) => p.locator('.vp-msgs-menu .vp-msgs-menu-i', { hasText: label }).first().click();

  const A = await open('NeuroSFW', 'bob');
  await key(A.p, 'лунный кот 42');
  const B = await open('bob', 'NeuroSFW');
  await key(B.p, 'bob-password-1');
  await say(B.p, 'первое');
  await B.p.waitForTimeout(1300);
  await say(B.p, 'второе');
  await chatWith(A.p, 'u:bob', 2);
  A.p.on('dialog', d => d.accept());
  await rightClick(A.p, 0);
  const ls = await labels(A.p);
  check(ls.join('|') === 'Ответить|Закрепить|Переслать|Удалить|Выбрать|Копировать текст', 'меню сообщения: ' + ls.join(', '));
  await clickItem(A.p, 'Ответить');
  check(await A.p.locator('.vp-msgs-reply:not([hidden])').count() === 1, 'над полем ввода появилась полоска ответа');
  await say(A.p, 'ответ на первое');
  check((await A.p.locator('.vp-msgs-feed .vp-msgs-quote').allTextContents()).join('|').includes('первое'), 'у ответа есть цитата первого сообщения');
  check(await A.p.locator('.vp-msgs-reply:not([hidden])').count() === 0, 'полоска ответа убрана после отправки');
  check(await until(async () => (await bubbles(B.p)).length >= 3, 40000) && (await B.p.locator('.vp-msgs-feed .vp-msgs-quote').count()) === 1, 'у bob ответ пришёл с цитатой');

  await rightClick(A.p, 1);
  await clickItem(A.p, 'Закрепить');
  await A.p.waitForTimeout(2500);
  check(await A.p.locator('.vp-msgs-pin:not([hidden])').count() === 1 && /второе/.test(await A.p.locator('.vp-msgs-pin').textContent()), 'закреплённое сообщение — полоска вверху чата: ' + (await A.p.locator('.vp-msgs-pin').textContent()).slice(0, 60));
  check(await until(async () => await B.p.locator('.vp-msgs-pin:not([hidden])').count() === 1, 40000), 'bob тоже видит закреплённое');
  await A.p.locator('.vp-msgs-pin button').click();
  await A.p.waitForTimeout(2500);
  check(await A.p.locator('.vp-msgs-pin:not([hidden])').count() === 0, 'открепил — полоска ушла');

  await rightClick(A.p, 2);
  check((await labels(A.p)).includes('Удалить'), 'свою реплику можно удалить');
  await clickItem(A.p, 'Удалить');
  await A.p.waitForTimeout(3000);
  check((await bubbles(A.p)).length === 2, 'удалил своё сообщение у себя: ' + (await bubbles(A.p)).length);
  check(await until(async () => (await bubbles(B.p)).length === 2, 40000), 'у bob оно тоже пропало');

  await rightClick(A.p, 0);
  await clickItem(A.p, 'Выбрать');
  await A.p.locator('.vp-msgs-feed .vp-msgs-b').nth(1).click();
  check(await A.p.locator('.vp-msgs-sel:not([hidden]) b').textContent() === '2 выбрано', 'выбор нескольких: ' + await A.p.locator('.vp-msgs-sel b').textContent());
  await A.p.keyboard.press('Escape');
  check(await A.p.locator('.vp-msgs-sel:not([hidden])').count() === 0 && await A.p.locator('.vp-msgs-b.vp-sel').count() === 0, 'Esc снимает выбор');

  await rightClick(A.p, 1);
  await clickItem(A.p, 'Переслать');
  check(await A.p.locator('.vp-msgs-fwd .vp-msgs-fwd-r').count() >= 2, 'окно пересылки со списком чатов (' + await A.p.locator('.vp-msgs-fwd .vp-msgs-fwd-r').count() + ')');
  await A.p.locator('.vp-msgs-fwd .vp-msgs-fwd-r', { hasText: 'Боб' }).first().click();
  check(await until(async () => /Переслано от/.test((await B.p.locator('.vp-msgs-feed .vp-msgs-quote').allTextContents()).join('|')), 45000), 'bob получил пересланное с пометкой «Переслано от»');

  await rightClick(A.p, 0);
  await clickItem(A.p, 'Удалить');
  await A.p.waitForTimeout(1500);
  const left = await bubbles(A.p);
  check(!left.some(x => x.includes('первое') && !x.includes('ответ')), 'чужое «первое» удалено только у себя: ' + left.join(' / '));
  check((await bubbles(B.p)).some(x => x.includes('первое')), 'у bob «первое» осталось');
  check(A.p.errors.length === 0 && B.p.errors.length === 0, 'нет ошибок страницы ' + A.p.errors.concat(B.p.errors).join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
