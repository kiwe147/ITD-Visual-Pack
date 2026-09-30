// Настоящий звонок в личке (3.3.15): два браузера с поддельным микрофоном Chrome, общий «сервер» комментариев.
// NeuroSFW звонит bob из шапки чата → у bob звонит → «Принять» → звук идёт в обе стороны (getStats) → микрофон выкл →
// «Завершить» у одного — у другого сразу конец. Потом: отклонён, отменён до ответа (у bob «Пропущенный» и «Перезвонить»).
// Вызов и ответ — зашифрованные служебные записи в томах лички, каждый том не длиннее 990 знаков, в чате их не видно.
// Запуск:  node test/realcall.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8')
  .replace('const msgNet = {', 'const msgNet = window.__msgNet = {').replace('const callNet = {', 'const callNet = window.__callNet = {');
const ORIGIN = 'https://xn--d1ah4a.com', POST = 'a53b53e0-9950-4f62-83f4-91e5985ef6c5';
const OWNER = '5e064703-104d-4794-bc28-9ed6f5847cca';
const USERS = { NeuroSFW: { id: OWNER, username: 'NeuroSFW', displayName: 'Нейро' }, bob: { id: 'u2', username: 'bob', displayName: 'Боб' } };
const VERIFIED = { NeuroSFW: { code: 'x', hasMod: true, id: OWNER, state: 'approved' }, bob: { code: 'x', hasMod: true, id: 'u2', state: 'approved' } };
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
let comments = [], n = 0, longest = 0;
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
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
        const content = JSON.parse(req.postData()).content;
        longest = Math.max(longest, content.length);
        const c = { id: 'c' + (++n), author: USERS[who], content, createdAt: new Date().toISOString() };
        comments.push(c);
        return r.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: c }) });
      }
      if (req.method() === 'PATCH' && u.pathname.startsWith('/api/comments/')) {
        const c = comments.find(x => x.id === u.pathname.split('/').pop());
        c.content = JSON.parse(req.postData()).content;
        longest = Math.max(longest, c.content.length);
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
  const card = p => p.evaluate(() => { const c = [...document.querySelectorAll('.vp-call-real')].pop(); return c ? { sub: c.querySelector('.vp-call-sub').textContent, btns: [...c.querySelectorAll('.vp-call-btns button')].map(x => x.textContent.trim()), live: c.classList.contains('vp-live'), mini: c.classList.contains('vp-call-mini') } : null; });
  const waitCard = (p, re, ms = 25000) => p.waitForFunction(re => { const c = [...document.querySelectorAll('.vp-call-real')].pop(); return c && new RegExp(re).test(c.querySelector('.vp-call-sub').textContent + ' ' + c.querySelector('.vp-call-btns').textContent); }, re, { timeout: ms }).then(() => true, () => false);
  const bytes = p => p.evaluate(async () => {
    const c = __callNet.cur;
    if (!c || !c.pc) return null;
    let got = 0, sent = 0;
    (await c.pc.getStats()).forEach(r => { if (r.type === 'inbound-rtp' && r.kind === 'audio') got += r.bytesReceived || 0; if (r.type === 'outbound-rtp' && r.kind === 'audio') sent += r.bytesSent || 0; });
    return { got, sent };
  });
  const shot = (p, name) => p.screenshot({ path: path.join(__dirname, 'out', `realcall-${name}.png`) });

  const A = await open('NeuroSFW', 'bob');
  await key(A.p, 'лунный кот 42');
  const B = await open('bob', 'NeuroSFW');
  await key(B.p, 'bob-password-1');
  await reopen(A.p, 'u:bob');
  const bubblesBefore = await A.p.$$eval('.vp-msgs-feed .vp-msgs-b', x => x.length);
  check(await A.p.$eval('.vp-msgs-call', e => !e.hidden && e.getBoundingClientRect().width > 0), 'в шапке чата есть кнопка звонка');
  await A.p.screenshot({ path: path.join(__dirname, 'out', 'realcall-0-head.png'), clip: { x: 0, y: 0, width: 1200, height: 200 } });

  const t0 = Date.now();
  await A.p.click('.vp-msgs-call');
  check(await waitCard(A.p, 'Вызываю', 15000), 'у звонящего: «Вызываю…»');
  await A.p.waitForTimeout(600);
  await shot(A.p, '1-calling');
  const rang = await waitCard(B.p, 'Принять', 25000);
  check(rang, `у bob звонит, кнопки «Отклонить / Принять» (через ${((Date.now() - t0) / 1000).toFixed(1)} с)`);
  console.log('—    у bob:', JSON.stringify(await card(B.p)));
  await B.p.waitForTimeout(600);
  await shot(B.p, '2-ringing');
  check(longest <= 990, `служебные записи влезают в комментарий (самый длинный — ${longest} знаков)`);
  check(!comments.some(c => /v=0|a=candidate|opus/.test(c.content)), 'на сервере нет открытого SDP');
  await B.p.click('.vp-call-yes');
  const liveA = await waitCard(A.p, '^\\d\\d:\\d\\d', 25000), liveB = await waitCard(B.p, '^\\d\\d:\\d\\d', 25000);
  check(liveA && liveB, `соединились у обоих (через ${((Date.now() - t0) / 1000).toFixed(1)} с от вызова)`);
  await A.p.waitForTimeout(2500);
  const sa = await bytes(A.p), sb = await bytes(B.p);
  console.log('—    байты звука:', JSON.stringify({ NeuroSFW: sa, bob: sb }));
  check(sa && sb && sa.got > 2000 && sb.got > 2000, 'звук идёт в обе стороны');
  await shot(A.p, '3-talk');
  await A.p.click('.vp-call-mute');
  await B.p.waitForTimeout(800);
  const cb = await card(B.p), ca = await card(A.p);
  check(/выключен микрофон/.test(cb.sub) && ca.btns.includes('Включить'), `микрофон выкл: у bob «у собеседника выключен микрофон» (${cb.sub})`);
  check(await A.p.evaluate(() => __callNet.cur.stream.getAudioTracks().every(t => !t.enabled)), 'дорожка микрофона правда выключена');
  await A.p.click('.vp-call-min');
  await A.p.waitForTimeout(400);
  check((await card(A.p)).mini, 'свернул — плашка в углу');
  await shot(A.p, '4-mini');
  await A.p.click('.vp-call-mini .vp-call-end');
  const byeFast = await waitCard(B.p, 'положил трубку', 4000);
  check(byeFast, 'NeuroSFW положил трубку — у bob сразу «Собеседник положил трубку»');
  await A.p.waitForTimeout(2500);
  check(await A.p.evaluate(() => !__callNet.cur && !document.querySelector('.vp-call-real')) && await B.p.evaluate(() => !__callNet.cur), 'после отбоя звонков нет, окна закрылись');
  await reopen(A.p, 'u:bob');
  check(await A.p.$$eval('.vp-msgs-feed .vp-msgs-b', x => x.length) === bubblesBefore && !(await A.p.$eval('.vp-msgs-feed', f => /новой версии/.test(f.textContent))), 'служебные записи звонка не видны в чате');

  await A.p.click('.vp-msgs-call');
  check(await waitCard(B.p, 'Принять', 25000), 'второй звонок: у bob звонит');
  await B.p.click('.vp-call-real .vp-call-end');
  check(await waitCard(A.p, 'отклонён', 15000), 'bob отклонил — у NeuroSFW «Звонок отклонён»');
  await A.p.waitForTimeout(2500);

  await B.p.click('.vp-msgs-call');
  check(await waitCard(A.p, 'Принять', 25000), 'третий звонок (bob → NeuroSFW): звонит');
  await B.p.click('.vp-call-real .vp-call-end');
  const missed = await waitCard(A.p, 'Пропущенный', 15000);
  const mc = await card(A.p);
  check(missed && mc.btns.join('|') === 'Закрыть|Перезвонить', `bob отменил до ответа — у NeuroSFW «Пропущенный звонок» и «Перезвонить» (${JSON.stringify(mc)})`);
  await shot(A.p, '5-missed');
  await A.p.waitForTimeout(3000);
  check(await A.p.evaluate(() => document.querySelectorAll('.vp-call-real').length === 1), 'пропущенный не звонит повторно');

  check(!A.p.errors.length && !B.p.errors.length, 'ошибок нет' + (A.p.errors.length + B.p.errors.length ? ': ' + [...A.p.errors, ...B.p.errors].join(' | ') : ''));
  const errs = await A.p.evaluate(() => (window.vpErrors || []).join(' | '));
  if (errs) console.log('—    журнал мода:', errs);
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
