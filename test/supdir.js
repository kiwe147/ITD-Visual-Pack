// Личка (3.4.3.2). 1) У владельца (поддержка) все обращения — в одной строке «🛟 Поддержка», как обычный чат: последнее
// сообщение, время, общий счётчик. Нажал — внутри все, кто писал в поддержку, сверху «← Все чаты»; из обращения назад — снова
// в папку. 2) Кнопка «вниз»: отлистал переписку вверх — появляется, пришло новое — на ней число, нажал — внизу, кнопка пропала.
// Запуск:  node test/supdir.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com', POST = src.match(/const MSG_POST_ID = '([^']+)'/)[1];
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const USERS = {
  NeuroSFW: { id: OWNER, username: 'NeuroSFW', displayName: 'Нейро' },
  bob: { id: '22222222-2222-4222-8222-222222222222', username: 'bob', displayName: 'Боб' },
  carl: { id: '33333333-3333-4333-8333-333333333333', username: 'carl', displayName: 'Карл' }
};
const VERIFIED = Object.fromEntries(Object.entries(USERS).map(([k, u]) => [k, { code: 'x', hasMod: true, id: u.id, state: 'approved' }]));
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
let comments = [], n = 0;
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const open = async (who, row) => {
    const ctx = await b.newContext({ viewport: { width: 1200, height: 860 } });
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
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, val) => { s[k] = val; };
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
    await p.$eval(`.vp-msgs-row[data-id="${row}"]`, r => r.click());
    await p.waitForTimeout(800);
    return p;
  };
  const key = async (p, pw) => {
    await p.fill('.vp-msgs-key input >> nth=0', pw);
    const two = await p.$('.vp-msgs-key input >> nth=1');
    if (two) await p.fill('.vp-msgs-key input >> nth=1', pw);
    await p.click('.vp-msgs-key button');
    await p.waitForTimeout(2500);
  };
  const say = async (p, text) => { await p.fill('.vp-msgs-bar input', text); await p.$eval('.vp-msgs-send', x => x.click()); await p.waitForTimeout(1800); };
  const back = p => p.evaluate(() => { const bk = document.querySelector('.vp-msgs-chat:not([hidden]) .vp-msgs-back'); if (bk) bk.click(); });
  const rows = p => p.$$eval('.vp-msgs-list .vp-msgs-row', rs => rs.map(r => r.dataset.id));

  const A = await open('NeuroSFW', 'u:bob');
  await key(A, 'лунный кот 42');
  await back(A);
  const B = await open('bob', 'support');
  await key(B, 'bob-password-1');
  await say(B, 'у меня не грузится галерея');
  const C = await open('carl', 'support');
  await key(C, 'carl-password-1');
  await say(C, 'а можно тёмную тему посветлее');
  await say(C, 'и ещё вопрос');
  await A.waitForFunction(() => { const r = document.querySelector('.vp-msgs-row[data-id="@sup"] .vp-msgs-badge'); return r && r.textContent === '3'; }, null, { timeout: 40000 }).catch(() => { });
  await A.waitForTimeout(1500);
  const main = await rows(A);
  const folder = await A.evaluate(() => { const r = document.querySelector('.vp-msgs-row[data-id="@sup"]'); return r && { name: r.querySelector('.vp-msgs-name').textContent, last: r.querySelector('.vp-msgs-last').textContent, badge: (r.querySelector('.vp-msgs-badge') || {}).textContent }; });
  console.log('—    список: ' + main.join(', ') + ' | папка: ' + JSON.stringify(folder));
  check(!!folder && !main.some(id => id.startsWith('sup:')), 'у владельца обращения — одной строкой «Поддержка», по отдельности в общем списке их нет');
  check(folder && folder.name === 'Поддержка' && /Карл|carl/.test(folder.last) && folder.badge === '3', `в строке — последнее сообщение и общий счётчик (${folder && folder.last}, ${folder && folder.badge})`);
  await (await A.$('.vp-msgs-home')).screenshot({ path: path.join(__dirname, 'out', 'supdir-1-list.png') });
  await A.$eval('.vp-msgs-row[data-id="@sup"]', x => x.click());
  await A.waitForTimeout(300);
  const inside = await rows(A);
  check(inside[0] === '@back' && inside.slice(1).sort().join() === 'sup:22222222-2222-4222-8222-222222222222,sup:33333333-3333-4333-8333-333333333333', `внутри: «← Все чаты» и оба обращения (${inside.join(', ')})`);
  await (await A.$('.vp-msgs-home')).screenshot({ path: path.join(__dirname, 'out', 'supdir-2-folder.png') });
  await A.$eval('.vp-msgs-row[data-id^="sup:2222"]', x => x.click());
  await A.waitForTimeout(1200);
  const txt = await A.$$eval('.vp-msgs-feed .vp-msgs-b', bs => bs.map(x => x.firstChild.textContent).join('|'));
  check(/галерея/.test(txt), `открылось обращение bob (${txt})`);
  await back(A);
  await A.waitForTimeout(300);
  check((await rows(A))[0] === '@back', 'назад из обращения — снова в папке поддержки');
  await A.$eval('.vp-msgs-row[data-id="@back"]', x => x.click());
  await A.waitForTimeout(300);
  check((await rows(A)).includes('@sup'), '«← Все чаты» — общий список');

  await A.$eval('.vp-msgs-row[data-id="@sup"]', x => x.click());
  await A.$eval('.vp-msgs-row[data-id^="sup:2222"]', x => x.click());
  await A.waitForTimeout(1200);
  await A.evaluate(() => { const f = document.querySelector('.vp-msgs-feed'); for (let i = 0; i < 40; i++) { const d = document.createElement('div'); d.className = 'vp-msgs-note'; d.textContent = 'заполнитель ' + i; f.insertBefore(d, f.firstChild); } f.scrollTop = f.scrollHeight; });
  await A.waitForTimeout(300);
  const hid0 = await A.$eval('.vp-msgs-down', x => x.hidden);
  await A.evaluate(() => { document.querySelector('.vp-msgs-feed').scrollTop = 0; });
  await A.waitForTimeout(300);
  const hid1 = await A.$eval('.vp-msgs-down', x => x.hidden);
  check(hid0 && !hid1, `кнопка «вниз»: внизу её нет, отлистал вверх — есть (${hid0}/${hid1})`);
  await say(B, 'ещё одно');
  const cnt = await A.waitForFunction(() => document.querySelector('.vp-msgs-down span').textContent === '1', null, { timeout: 25000 }).then(() => true, () => false);
  check(cnt, 'пришло новое, пока читаешь выше, — на кнопке «1»');
  await (await A.$('.vp-msgs-chat')).screenshot({ path: path.join(__dirname, 'out', 'supdir-3-down.png') });
  await A.$eval('.vp-msgs-down', x => x.click());
  await A.waitForTimeout(900);
  const end = await A.evaluate(() => { const f = document.querySelector('.vp-msgs-feed'); return { gap: f.scrollHeight - f.scrollTop - f.clientHeight, hidden: document.querySelector('.vp-msgs-down').hidden, num: document.querySelector('.vp-msgs-down span').textContent }; });
  check(end.gap < 5 && end.hidden && !end.num, `нажал — внизу, кнопка пропала (${JSON.stringify(end)})`);
  const errs = [A, B, C].flatMap(p => p.errors);
  check(!errs.length, 'ошибок нет' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
