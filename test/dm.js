// Личные сообщения со сквозным шифрованием: два браузера (NeuroSFW и bob), общий «сервер» комментариев.
// Оба создают ключ (пароль) → bob пишет → NeuroSFW видит и отвечает → bob видит ответ. На «сервере» — только
// «ITDXK1 …» и «ITDXM1 …» без открытого текста; второе сообщение дописано в тот же том правкой (не новый коммент).
// Новое устройство: ключ на устройстве забыт — пароль открывает ту же переписку; неверный — «Неверный пароль».
// Запуск:  node test/dm.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8').replace('const msgNet = {', 'const msgNet = window.__msgNet = {').replace('setInterval(msgBackground, 60000)', 'setInterval(msgBackground, 2500)');
const ORIGIN = 'https://xn--d1ah4a.com', POST = 'a53b53e0-9950-4f62-83f4-91e5985ef6c5';
const USERS = { NeuroSFW: { id: 'u1', username: 'NeuroSFW', displayName: 'Нейро' }, bob: { id: 'u2', username: 'bob', displayName: 'Боб' } };
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
let comments = [], n = 0, posts = 0, patches = 0;
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const open = async (who, other) => {
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
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
      if (um && USERS[um[1]]) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { ...USERS[um[1]], online: um[1] === 'bob' } }) });
      if (u.pathname === `/api/posts/${POST}/comments`) {
        if (req.method() === 'GET') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { comments, hasMore: false } }) });
        const c = { id: 'c' + (++n), author: USERS[who], content: JSON.parse(req.postData()).content };
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
    await p.addInitScript(([m, other]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
      localStorage.setItem('itd_verified_users', JSON.stringify({ [other]: { code: 'x', hasMod: true } }));
    }, [src.slice(0, src.indexOf('==/UserScript==')), other]);
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
    await p.waitForFunction(() => { const b = [...document.querySelectorAll('.vp-msgs-feed .vp-msgs-b')].pop(); return b && /✓|не отправлено/.test(b.lastChild.textContent); }, null, { timeout: 15000 });
  };
  // открыть чат и дождаться, пока в нём n сообщений (переписка расшифровывается не мгновенно)
  const chatWith = async (p, id, n) => {
    await p.evaluate(id => { const b = document.querySelector('.vp-msgs-chat:not([hidden]) .vp-msgs-back'); if (b) b.click(); document.querySelector(`.vp-msgs-row[data-id="${id}"]`).click(); }, id);
    await p.waitForFunction(n => document.querySelectorAll('.vp-msgs-feed .vp-msgs-b').length >= n, n, { timeout: 15000 }).catch(() => { });
  };
  const bubbles = p => p.$$eval('.vp-msgs-feed .vp-msgs-b', bs => bs.map(x => (x.classList.contains('vp-out') ? '→' : '←') + x.firstChild.textContent));

  const A = await open('NeuroSFW', 'bob');
  check(!!(await A.p.$('.vp-msgs-key')), 'нет ключа — окно просит придумать пароль');
  await key(A.p, 'лунный кот 42');
  const B = await open('bob', 'NeuroSFW');
  await key(B.p, 'bob-password-1');
  await say(B.p, 'Привет, это секрет 🤫');
  await say(B.p, 'второе');
  const raw = comments.map(c => c.content).join('\n');
  check(comments.filter(c => c.content.startsWith('ITDXK1')).length === 2, 'на сервере два ключа (ITDXK1)');
  check(!/Привет|секрет|второе/.test(raw), 'на сервере нет открытого текста');
  check(comments.filter(c => c.content.startsWith('ITDXM1')).length === 1 && patches >= 1, `два сообщения — один том, второе дописано правкой (правок ${patches})`);
  console.log('—    том: ' + comments.find(c => c.content.startsWith('ITDXM1')).content.slice(0, 60) + '…');
  // NeuroSFW: открыть чат заново — видит сообщения, отвечает
  await A.p.$eval('.vp-msgs-back', b => b.click());
  console.log('—    сразу после нажатия: ' + JSON.stringify(await A.p.evaluate(() => { document.querySelector('.vp-msgs-row[data-id="u:bob"]').click(); return { chat: document.querySelector('.vp-msgs-chat').hidden }; })));
  for (const ms of [100, 400, 1000]) { await A.p.waitForTimeout(ms); console.log('—    через ' + ms + ': ' + await A.p.evaluate(() => document.querySelector('.vp-msgs-chat').hidden)); }
  let got = await bubbles(A.p);
  console.log('—    у NeuroSFW: ' + got.join(' | '));
  check(got.join('|') === '←Привет, это секрет 🤫|←второе', 'NeuroSFW расшифровал оба сообщения bob');
  await say(A.p, 'И тебе привет');
  await chatWith(B.p, 'u:NeuroSFW', 3);
  got = await bubbles(B.p);
  console.log('—    у bob: ' + got.join(' | '));
  check(got.join('|') === '→Привет, это секрет 🤫|→второе|←И тебе привет', 'bob видит свою переписку и ответ');
  // новое устройство bob: ключа на устройстве нет — пароль
  await B.ctx.close();
  const B2 = await open('bob', 'NeuroSFW');
  check(!!(await B2.p.$('.vp-msgs-key')) && (await B2.p.$$('.vp-msgs-key input')).length === 1, 'новое устройство: ключ есть на сервере — просит только пароль');
  await key(B2.p, 'не тот пароль', false);
  check(/Неверный пароль/.test(await B2.p.$eval('.vp-msgs-keyerr', e => e.textContent)), 'неверный пароль — «Неверный пароль»');
  await key(B2.p, 'bob-password-1', false);
  got = await bubbles(B2.p);
  check(got.length === 3, `верный пароль — вся переписка на новом устройстве (${got.length})`);
  // поддержка: bob пишет в «Поддержку» → у NeuroSFW диалог «🛟 bob» → ответ приходит bob в «Поддержку», не в обычный чат
  await chatWith(B2.p, 'support', 1);
  await say(B2.p, 'Не открывается галерея');
  await A.p.$eval('.vp-msgs-back', b => b.click()); await A.p.waitForTimeout(2500);
  const rowsA = await A.p.$$eval('.vp-msgs-row', rs => rs.map(r => r.dataset.id));
  console.log('—    список у NeuroSFW: ' + rowsA.join(', '));
  check(rowsA.includes('sup:u2') && !rowsA.includes('support'), 'у поддержки — диалог «🛟 bob», своей строки «Поддержка» нет');
  await A.p.$eval('.vp-msgs-row[data-id="sup:u2"]', r => r.click()); await A.p.waitForTimeout(1500);
  check((await bubbles(A.p)).join('|') === '←Не открывается галерея', 'в «🛟 bob» — только обращение, без личной переписки');
  await say(A.p, 'Починим сегодня');
  await chatWith(B2.p, 'support', 1);
  check((await bubbles(B2.p)).join('|') === '→Не открывается галерея|←Починим сегодня', 'bob: ответ поддержки пришёл в «Поддержку»');
  await chatWith(B2.p, 'u:NeuroSFW', 1);
  check(!(await bubbles(B2.p)).some(x => /Починим|галерея/.test(x)), 'в обычном чате с NeuroSFW поддержки нет');
  // окно закрыто у bob: ответ → число на «Сообщениях» и всплывашка; нажатие — открыть чат
  await B2.p.$eval('.vp-msgs-back', b => b.click());
  await B2.p.$eval('nav a[href="#"]', a => a.click()); await B2.p.waitForTimeout(600);
  const openNow = await B2.p.evaluate(() => document.querySelector('.vp-msgs').classList.contains('vp-open'));
  if (openNow) await B2.p.$eval('nav a[href="#"]', a => a.click());
  await chatWith(A.p, 'u:bob', 1);
  await say(A.p, 'Ты тут?');
  await B2.p.waitForTimeout(6000);
  const toast = await B2.p.$eval('.vp-msg-toast', e => e.textContent).catch(() => null);
  const badge = await B2.p.$eval('nav a[href="#"] .vp-msg-badge', e => e.textContent).catch(() => null);
  console.log(`—    у bob: всплывашка «${toast}», число «${badge}»`);
  check(toast && /Ты тут\?/.test(toast) && badge === '1', 'новое сообщение при закрытом окне — всплывашка и число 1 на «Сообщениях»');
  await B2.p.click('.vp-msg-toast'); await B2.p.waitForTimeout(1500);
  check((await bubbles(B2.p)).pop() === '←Ты тут?' && !(await B2.p.$('nav a[href="#"] .vp-msg-badge')), 'нажал всплывашку — открылся чат, число пропало');
  // статус в сети — из профиля сайта
  await chatWith(A.p, 'u:bob', 1);
  const who = await A.p.$eval('.vp-msgs-who small', e => e.textContent);
  check(/в сети/.test(who), `статус собеседника: «${who}»`);
  for (const x of [A.p, B2.p]) check(!x.errors.length, 'ошибок нет' + (x.errors.length ? ': ' + x.errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
