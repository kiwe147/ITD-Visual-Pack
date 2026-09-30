// Ссылки в личке (3.4.0): адреса в тексте сообщения нажимаются. Ссылка на ИТД открывается в той же вкладке переходом сайта
// (личка закрывается), чужой сайт — в новой вкладке. javascript: и разметка в тексте остаются просто текстом.
// Запуск:  node test/msglinks.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com', POST = 'a53b53e0-9950-4f62-83f4-91e5985ef6c5';
const OWNER = '5e064703-104d-4794-bc28-9ed6f5847cca';
const USERS = { NeuroSFW: { id: OWNER, username: 'NeuroSFW', displayName: 'Нейро' }, bob: { id: 'u2', username: 'bob', displayName: 'Боб' } };
const VERIFIED = { NeuroSFW: { code: 'x', hasMod: true, id: OWNER, state: 'approved' }, bob: { code: 'x', hasMod: true, id: 'u2', state: 'approved' } };
const MSG = 'глянь https://xn--d1ah4a.com/@l1kaa11/post/929f83fe-7170-4ca0-98df-7fc411207f51, и ещё https://example.com/a?b=1. javascript:alert(1) <img src=x onerror=alert(2)> итд.com/@bob';
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
  const A = await open('NeuroSFW', 'bob');
  await key(A.p, 'лунный кот 42');
  const B = await open('bob', 'NeuroSFW');
  await key(B.p, 'bob-password-1');
  await B.p.fill('.vp-msgs-bar input', MSG);
  await B.p.$eval('.vp-msgs-send', x => x.click());
  await B.p.waitForTimeout(2500);
  await A.p.evaluate(() => { const bk = document.querySelector('.vp-msgs-chat:not([hidden]) .vp-msgs-back'); if (bk) bk.click(); document.querySelector('.vp-msgs-row[data-id="u:bob"]').click(); });
  await A.p.waitForFunction(() => document.querySelector('.vp-msgs-feed .vp-msgs-b.vp-in'), null, { timeout: 15000 }).catch(() => { });
  const got = await A.p.evaluate(() => {
    const bb = document.querySelector('.vp-msgs-feed .vp-msgs-b.vp-in');
    const cs = getComputedStyle(bb.querySelector('a'));
    return { text: bb.firstChild.textContent, links: [...bb.querySelectorAll('a')].map(a => ({ href: a.href, text: a.textContent, target: a.target, rel: a.rel })), img: !!bb.querySelector('img'), deco: cs.textDecorationLine };
  });
  console.log("—    " + JSON.stringify(got.links));
  check(got.text === MSG.replace('https://xn--d1ah4a.com', 'итд.com'), 'текст сообщения целиком, адрес ИТД показан как итд.com');
  check(got.links.length === 3, `нажимаются 3 ссылки (${got.links.length})`);
  const [l1, l2, l3] = got.links;
  check(l1 && l1.href === 'https://xn--d1ah4a.com/@l1kaa11/post/929f83fe-7170-4ca0-98df-7fc411207f51' && l1.text.startsWith('итд.com/@l1kaa11') && !l1.target, 'ссылка на пост ИТД: без запятой в конце, показана как итд.com, в этой же вкладке');
  check(l2 && l2.href === 'https://example.com/a?b=1' && l2.target === '_blank' && /noopener/.test(l2.rel), 'чужой сайт: без точки в конце, новая вкладка, noopener');
  check(l3 && new URL(l3.href).pathname === '/@bob' && !l3.target, 'итд.com/@bob без https тоже ссылка');
  check(!got.img, 'разметка из текста не стала картинкой');
  check(got.deco === 'underline', `ссылку видно: подчёркнута (${got.deco})`);
  await (await A.p.$('.vp-msgs-feed .vp-msgs-b.vp-in')).screenshot({ path: path.join(__dirname, 'out', 'msglinks.png') });
  await A.p.click('.vp-msgs-feed .vp-msgs-b.vp-in a >> nth=0');
  await A.p.waitForTimeout(600);
  const nav = await A.p.evaluate(() => ({ path: location.pathname, open: document.querySelector('.vp-msgs').classList.contains('vp-open') }));
  check(nav.path === '/@l1kaa11/post/929f83fe-7170-4ca0-98df-7fc411207f51' && !nav.open, `нажал ссылку на пост — личка закрылась, адрес поста (${JSON.stringify(nav)})`);
  check(!A.p.errors.length && !B.p.errors.length, 'ошибок нет' + (A.p.errors.length + B.p.errors.length ? ': ' + [...A.p.errors, ...B.p.errors].join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
