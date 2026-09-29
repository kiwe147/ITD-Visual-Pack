// Личные сообщения со сквозным шифрованием: два браузера (NeuroSFW и bob), общий «сервер» комментариев.
// Оба создают ключ (пароль) → bob пишет → NeuroSFW видит и отвечает → bob видит ответ. На «сервере» — только
// «ITDXK1 …» и «ITDXM1 …» без открытого текста; второе сообщение дописано в тот же том правкой (не новый коммент).
// Новое устройство: ключ на устройстве забыт — пароль открывает ту же переписку; неверный — «Неверный пароль».
// С 3.3.5 личка — только подтверждённые (itd_verified_users, state approved); NeuroSFW здесь — с id владельца.
// 3.3.7.2: неподтверждённый (carl) — чат с людьми закрыт, поддержка работает, свой ключ не пересоздаётся.
// 3.3.9: картинка — на сервер ИТД (files/upload), в зашифрованной записи только 17 байт ссылки + подпись; порядок диалогов.
// Запуск:  node test/dm.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8').replace('const msgNet = {', 'const msgNet = window.__msgNet = {').replace('setInterval(msgBackground, 60000)', 'setInterval(msgBackground, 2500)');
const ORIGIN = 'https://xn--d1ah4a.com', POST = 'a53b53e0-9950-4f62-83f4-91e5985ef6c5';
const OWNER = '5e064703-104d-4794-bc28-9ed6f5847cca';
const USERS = { NeuroSFW: { id: OWNER, username: 'NeuroSFW', displayName: 'Нейро' }, bob: { id: 'u2', username: 'bob', displayName: 'Боб' }, carl: { id: 'u3', username: 'carl', displayName: 'Карл' } };
const VERIFIED = { NeuroSFW: { code: 'x', hasMod: true, id: OWNER, state: 'approved' }, bob: { code: 'x', hasMod: true, id: 'u2', state: 'approved' }, carl: { code: 'x', hasMod: true, id: 'u3', state: 'quarantine' } };
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
let comments = [], n = 0, posts = 0, patches = 0, uploads = 0;
const IMG_ID = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const TALL = fs.readFileSync(path.join(__dirname, 'tall.png'));
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP4z8DwnwEIGP4zMDAwAAA2ygX7vK9Y8AAAAABJRU5ErkJggg==', 'base64');
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
      if (u.hostname.startsWith('cdn.')) return r.fulfill({ contentType: 'image/png', body: TALL });
      if (u.pathname === '/api/files/upload') { uploads++; const id = uploads === 1 ? IMG_ID : IMG_ID.slice(0, -2) + String(uploads).padStart(2, '0'); return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'f' + uploads, url: `https://cdn.xn--d1ah4a.com/images/${id}.webp` }) }); }
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
  // неподтверждённый carl: чат с человеком закрыт, поддержка работает, второе устройство — только пароль
  const C = await open('carl', 'NeuroSFW');
  const gate = await C.p.$eval('.vp-msgs-feed', e => e.textContent);
  check(/откроется/.test(gate) && !(await C.p.$('.vp-msgs-key')), 'carl без подтверждения: чат с человеком закрыт, пароль не спрашивает');
  await chatWith(C.p, 'support', 0);
  await C.p.waitForSelector('.vp-msgs-key', { timeout: 10000 }).catch(() => { });
  check((await C.p.$$('.vp-msgs-key input')).length === 2, 'carl: в поддержке — создать ключ (пароль дважды)');
  await key(C.p, 'carl-password-1');
  await say(C.p, 'Хочу галочку');
  const carlKeys = () => comments.filter(c => c.author.id === 'u3' && c.content.startsWith('ITDXK1')).length;
  check(carlKeys() === 1, 'carl: на сервере один его ключ');
  await C.ctx.close();
  const C2 = await open('carl', 'NeuroSFW');
  await chatWith(C2.p, 'support', 0);
  await C2.p.waitForSelector('.vp-msgs-key', { timeout: 10000 }).catch(() => { });
  check((await C2.p.$$('.vp-msgs-key input')).length === 1, 'carl, второе устройство: свой ключ виден — просит только пароль, не «придумай»');
  await key(C2.p, 'carl-password-1', false);
  await C2.p.waitForTimeout(1500);
  check((await bubbles(C2.p)).join('|') === '→Хочу галочку' && carlKeys() === 1, 'carl: переписка с поддержкой на месте, новый ключ не создан');
  await A.p.$eval('.vp-msgs-back', b => b.click()).catch(() => { }); await A.p.waitForTimeout(3000);
  await chatWith(A.p, 'sup:u3', 1);
  check((await bubbles(A.p)).join('|') === '←Хочу галочку', 'владелец читает обращение неподтверждённого carl');
  // картинка: bob → NeuroSFW, с подписью
  await chatWith(B2.p, 'u:NeuroSFW', 1);
  await B2.p.fill('.vp-msgs-bar input', 'котик');
  await B2.p.setInputFiles('.vp-msgs-file', { name: 'cat.png', mimeType: 'image/png', buffer: TALL });
  await B2.p.waitForTimeout(300);
  const pend = await B2.p.evaluate(() => ({ shown: getComputedStyle(document.querySelector('.vp-msgs-pend')).display !== 'none', sendOn: !document.querySelector('.vp-msgs-send').disabled, bubbles: document.querySelectorAll('.vp-msgs-feed .vp-msgs-b').length }));
  check(pend.shown && pend.sendOn && uploads === 0, `после выбора — превью над полем, ещё не отправлено ${JSON.stringify(pend)}`);
  await B2.p.click('.vp-msgs-send');
  await B2.p.waitForFunction(() => { const b = [...document.querySelectorAll('.vp-msgs-feed .vp-msgs-b')].pop(); return b && /✓|не отправлено/.test(b.lastChild.textContent); }, null, { timeout: 15000 }).catch(() => { });
  const sentB = await B2.p.evaluate(() => { const b = [...document.querySelectorAll('.vp-msgs-feed .vp-msgs-b')].pop(); return { meta: b.lastChild.textContent, img: !!b.querySelector('img') }; });
  check(uploads === 1 && sentB.img && /✓/.test(sentB.meta), `bob: картинка загружена и отправлена (${sentB.meta})`);
  const rawAll = comments.map(c => c.content).join('\n');
  check(!rawAll.includes(IMG_ID) && !/cdn|котик/.test(rawAll), 'на сервере нет ни ссылки на картинку, ни подписи — только шифр');
  await A.p.$eval('.vp-msgs-back', b => b.click()).catch(() => { }); await A.p.waitForTimeout(3000);
  const preview = await A.p.$eval('.vp-msgs-row[data-id="u:bob"] .vp-msgs-last', e => e.textContent).catch(() => '');
  check(preview === '🖼 котик', `в списке у NeuroSFW: «${preview}»`);
  await chatWith(A.p, 'u:bob', 1);
  await A.p.waitForTimeout(800);
  const gotImg = await A.p.evaluate(() => { const b = [...document.querySelectorAll('.vp-msgs-feed .vp-msgs-b')].pop(); const im = b && b.querySelector('img'); return { src: im && im.src, text: b && b.firstChild && b.childNodes[1] && b.childNodes[1].textContent, loaded: !!(im && im.complete && im.naturalWidth) }; });
  check(gotImg.src === `https://cdn.xn--d1ah4a.com/images/${IMG_ID}.webp` && gotImg.text === 'котик' && gotImg.loaded, `NeuroSFW видит картинку с сервера ИТД и подпись ${JSON.stringify(gotImg)}`);
  const size = await A.p.evaluate(() => { const im = [...document.querySelectorAll('.vp-msgs-feed .vp-msgs-img')].pop(); const b = im.closest('.vp-msgs-b'); return { w: Math.round(im.getBoundingClientRect().width), h: Math.round(im.getBoundingClientRect().height), bw: Math.round(b.getBoundingClientRect().width) }; });
  check(Math.abs(size.h / size.w - 1.5) < 0.03 && size.bw - size.w < 20, `картинка 600х900 в своих пропорциях, пузырь по ней ${JSON.stringify(size)}`);
  await A.p.screenshot({ path: path.join(__dirname, 'out', 'dm-image.png') });
  await A.p.click('.vp-msgs-feed .vp-msgs-imgw >> nth=-1'); await A.p.waitForTimeout(400);
  const lbOpen = await A.p.evaluate(() => !!document.querySelector('.vp-msgs .vp-msgs-lb img'));
  check(lbOpen, 'нажатие по картинке — крупно внутри окна сообщений');
  const hit = await A.p.evaluate(() => { const im = [...document.querySelectorAll('.vp-msgs-feed .vp-msgs-img')].pop(), r = im.getBoundingClientRect(); const lbImg = document.querySelector('.vp-msgs-lb img'), q = lbImg.getBoundingClientRect(); return { chat: document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === im, lb: document.elementFromPoint(q.x + q.width / 2, q.y + q.height / 2) === lbImg, orig: (document.querySelector('.vp-msgs-lb-top a') || {}).href || '' }; });
  check(!hit.chat && !hit.lb, 'курсор над картинкой попадает не в <img> — панели браузера (Яндекс) не на что вылезать');
  check(/cdn\.xn--d1ah4a\.com\/images\//.test(hit.orig), 'в просмотре — «Открыть оригинал»');
  await A.p.screenshot({ path: path.join(__dirname, 'out', 'dm-lightbox.png') });
  await A.p.goBack({ waitUntil: 'commit' }).catch(() => { }); await A.p.waitForTimeout(500);
  const afterBack = await A.p.evaluate(() => ({ lb: !!document.querySelector('.vp-msgs-lb'), chat: !!document.querySelector('.vp-msgs.vp-open .vp-msgs-chat:not([hidden])') }));
  check(await A.p.evaluate(() => getComputedStyle(document.querySelector('.vp-msgs-pend')).display === 'none'), 'у получателя полосы превью нет');
  check(!afterBack.lb && afterBack.chat, `«назад» — просмотр закрыт, чат на месте ${JSON.stringify(afterBack)}`);
  await A.p.click('.vp-msgs-feed .vp-msgs-imgw >> nth=-1'); await A.p.waitForTimeout(300);
  await A.p.keyboard.press('Escape'); await A.p.waitForTimeout(300);
  const afterEsc = await A.p.evaluate(() => ({ lb: !!document.querySelector('.vp-msgs-lb'), chat: !!document.querySelector('.vp-msgs.vp-open .vp-msgs-chat:not([hidden])') }));
  check(!afterEsc.lb && afterEsc.chat, `Esc — просмотр закрыт, чат на месте ${JSON.stringify(afterEsc)}`);
  await A.p.$eval('.vp-msgs-back', b => b.click()); await A.p.waitForTimeout(500);
  const order = await A.p.$$eval('.vp-msgs-row', rs => rs.map(r => r.dataset.id));
  console.log('—    порядок у NeuroSFW: ' + order.join(', '));
  check(order[0] === 'u:bob', 'последний открытый чат (и последнее сообщение) — наверху');
  await chatWith(A.p, 'bot', 1); await A.p.$eval('.vp-msgs-back', b => b.click()); await A.p.waitForTimeout(500);
  const order2 = await A.p.$$eval('.vp-msgs-row', rs => rs.map(r => r.dataset.id));
  check(order2[0] === 'bot', `зашёл к боту — бот поднялся наверх (${order2.slice(0, 3).join(', ')})`);
  // альбом: bob выбирает 3 картинки разом
  await chatWith(B2.p, 'u:NeuroSFW', 1);
  const up0 = uploads;
  await B2.p.setInputFiles('.vp-msgs-file', [1, 2, 3].map(i => ({ name: `a${i}.png`, mimeType: 'image/png', buffer: TALL })));
  await B2.p.waitForTimeout(300);
  const thumbs = await B2.p.$$eval('.vp-msgs-pend-t', t => t.length);
  check(thumbs === 3 && uploads === up0, `альбом: в превью 3 миниатюры, ещё не отправлено (${thumbs})`);
  await B2.p.click('.vp-msgs-send');
  await B2.p.waitForFunction(() => { const b = [...document.querySelectorAll('.vp-msgs-feed .vp-msgs-b')].pop(); return b && /✓|не отправлено/.test(b.lastChild.textContent); }, null, { timeout: 20000 }).catch(() => { });
  const aSent = await B2.p.evaluate(() => { const b = [...document.querySelectorAll('.vp-msgs-feed .vp-msgs-b')].pop(); return { meta: b.lastChild.textContent, cells: b.querySelectorAll('.vp-msgs-album .vp-msgs-imgw').length }; });
  check(uploads - up0 === 3 && aSent.cells === 3 && /✓/.test(aSent.meta), `альбом отправлен одним сообщением: загрузок ${uploads - up0}, ${JSON.stringify(aSent)}`);
  await A.p.$eval('.vp-msgs-back', b => b.click()).catch(() => { }); await A.p.waitForTimeout(3000);
  const aPrev = await A.p.$eval('.vp-msgs-row[data-id="u:bob"] .vp-msgs-last', e => e.textContent).catch(() => '');
  check(aPrev === '🖼 3 фото', `в списке у NeuroSFW: «${aPrev}»`);
  await chatWith(A.p, 'u:bob', 1); await A.p.waitForTimeout(800);
  const aGot = await A.p.evaluate(() => { const b = [...document.querySelectorAll('.vp-msgs-feed .vp-msgs-b')].pop(); return [...b.querySelectorAll('.vp-msgs-album img')].map(i => i.src.slice(-8)); });
  check(aGot.length === 3 && new Set(aGot).size === 3, `NeuroSFW видит альбом из 3 разных картинок ${JSON.stringify(aGot)}`);
  await A.p.screenshot({ path: path.join(__dirname, 'out', 'dm-album.png') });
  await A.p.click('.vp-msgs-feed .vp-msgs-album .vp-msgs-imgw >> nth=0'); await A.p.waitForTimeout(300);
  await A.p.click('.vp-msgs-lb .vp-next'); await A.p.waitForTimeout(150);
  const n2 = await A.p.$eval('.vp-msgs-lb-n', e => e.textContent);
  await A.p.keyboard.press('ArrowRight'); await A.p.waitForTimeout(150);
  const n3 = await A.p.$eval('.vp-msgs-lb-n', e => e.textContent);
  await A.p.keyboard.press('ArrowRight'); await A.p.waitForTimeout(150);
  const n1 = await A.p.$eval('.vp-msgs-lb-n', e => e.textContent);
  check(n2 === '2 / 3' && n3 === '3 / 3' && n1 === '1 / 3', `просмотр листается: ${n2}, ${n3}, по кругу ${n1}`);
  await A.p.keyboard.press('Escape'); await A.p.waitForTimeout(300);
  // меню по правой кнопке, реакция, «прочитано»
  await chatWith(A.p, 'u:bob', 1); await A.p.waitForTimeout(600);
  const before = await A.p.$$eval('.vp-msgs-feed .vp-msgs-b', bs => bs.length);
  const spot = await A.p.evaluate(() => { const b = [...document.querySelectorAll('.vp-msgs-feed .vp-msgs-b.vp-in')].pop(), f = document.querySelector('.vp-msgs-feed').getBoundingClientRect(), r = b.getBoundingClientRect(); return { x: f.right - 30, y: r.top + r.height / 2, ts: b.dataset.ts }; });
  await A.p.mouse.click(spot.x, spot.y, { button: 'right' }); await A.p.waitForTimeout(300);
  const menuOk = await A.p.evaluate(() => { const m = document.querySelector('.vp-msgs-menu'); return m && m.querySelectorAll('.vp-msgs-menu-r button').length; });
  check(menuOk === 7, `правая кнопка по пустому месту строки — меню с реакциями (${menuOk})`);
  const menuSeen = await A.p.evaluate(() => { const m = document.querySelector('.vp-msgs-menu'), r = m.getBoundingClientRect(); const hit = document.elementFromPoint(r.x + r.width / 2, r.y + 18); return r.width > 100 && r.x >= 0 && r.right <= innerWidth && r.y >= 0 && r.bottom <= innerHeight && !!hit && m.contains(hit); });
  check(menuSeen, 'меню видно на экране у курсора (не уехало за край окна)');
  await A.p.screenshot({ path: path.join(__dirname, 'out', 'dm-menu.png') });
  await A.p.click('.vp-msgs-menu-r button >> nth=0'); await A.p.waitForTimeout(400);
  await A.p.screenshot({ path: path.join(__dirname, 'out', 'dm-react.png') });
  const mineR = await A.p.evaluate(ts => { const b = document.querySelector(`.vp-msgs-feed .vp-msgs-b[data-ts="${ts}"]`); const r = b && b.querySelector('.vp-msgs-reacts button'); return r && { t: r.textContent, mine: r.classList.contains('vp-mine-r') }; }, spot.ts);
  check(mineR && mineR.t === '❤️' && mineR.mine, `❤️ под сообщением, моя ${JSON.stringify(mineR)}`);
  await A.p.waitForTimeout(3000);
  await chatWith(B2.p, 'u:NeuroSFW', 1); await B2.p.waitForTimeout(1500);
  const atBob = await B2.p.evaluate(ts => { const b = document.querySelector(`.vp-msgs-feed .vp-msgs-b[data-ts="${ts}"]`); const r = b && b.querySelector('.vp-msgs-reacts button'); const outs = [...document.querySelectorAll('.vp-msgs-feed .vp-msgs-b.vp-out')]; return { r: r && r.textContent, mine: r && r.classList.contains('vp-mine-r'), lastTick: outs.length && outs[outs.length - 1].lastChild.textContent, bubbles: document.querySelectorAll('.vp-msgs-feed .vp-msgs-b').length }; }, spot.ts);
  console.log('—    у bob: ' + JSON.stringify(atBob));
  check(atBob.r === '❤️' && !atBob.mine, 'bob видит ❤️ от NeuroSFW под своим сообщением');
  check(/✓✓$/.test(atBob.lastTick || ''), 'у bob отправленное — ✓✓ (NeuroSFW прочитал)');
  const after = await A.p.$$eval('.vp-msgs-feed .vp-msgs-b', bs => bs.length);
  check(after === before, `реакции и «прочитано» не становятся пузырями (${before} → ${after})`);
  await A.p.click(`.vp-msgs-feed .vp-msgs-b[data-ts="${spot.ts}"] .vp-msgs-reacts button`); await A.p.waitForTimeout(400);
  check(!(await A.p.$(`.vp-msgs-feed .vp-msgs-b[data-ts="${spot.ts}"] .vp-msgs-reacts`)), 'нажатие по своей реакции — снята');
  for (const x of [A.p, B2.p, C2.p]) check(!x.errors.length, 'ошибок нет' + (x.errors.length ? ': ' + x.errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
