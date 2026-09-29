// Стили других (3.3.10): свой стиль публикуется одной строкой «ITDXL1 n=… b=… g=…» под постом галочек (один коммент,
// дальше правка); чужие строки читаются вместе с галочками — ник и аватарка автора поста красятся его стилем,
// на его профиле — его фон (свой фон — картинка с сервера ИТД). Настройка «Стили других» выключает показ.
// Запуск:  node test/looks.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { openText, sealText } = require('./seal');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com', VPOST = 'a0d6625a-b3ec-44c4-98da-48422af101d5';
const SALT = src.match(/SECRET_SALT = '([^']+)'/)[1];
const hash = str => { let h = 0; for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h = h & h; } return Math.abs(h).toString(36); };
const code = id => hash(id + SALT).substring(0, 8).padEnd(8, '0') + '1';
const IMG = '4' + '0a1b2c3d4e5f4a6b8c7d9e0f1a2b3c4d';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [], sent = [];
  let who = null, comments = [], hisOnline = true;
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const req = r.request(), u = new URL(req.url()), t = req.resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (u.hostname.startsWith('cdn.')) return r.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64') });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.pathname === `/api/posts/${VPOST}/comments` && req.method() === 'GET') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ comments, hasMore: false }) });
    if (req.method() === 'POST' || req.method() === 'PATCH') { { const raw = JSON.parse(req.postData() || '{}').content || ''; sent.push({ m: req.method(), raw, body: openText(raw, src) }); } return r.fulfill({ contentType: 'application/json', body: '{}' }); }
    const um = u.pathname.match(/^\/api\/users\/([^/]+)$/);
    if (um && um[1] !== 'me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { username: decodeURIComponent(um[1]), online: hisOnline, lastSeen: hisOnline ? null : new Date(Date.now() - 20 * 60e3).toISOString() } }) });
    if (u.pathname.endsWith('/comments')) return r.fulfill({ contentType: 'application/json', body: '{"data":{"comments":[],"hasMore":false}}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: true, backgroundStyle: 'matrix', nickStyle: 'white' };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  who = await p.evaluate(() => {
    const a = [...document.querySelectorAll('article a[href^="/@"]')].find(x => !/NeuroSFW/i.test(x.getAttribute('href')));
    return a && a.getAttribute('href').split('/@')[1].split(/[/?#]/)[0];
  });
  console.log('—    автор поста из снимка: ' + who);
  comments = [
    { id: 'c1', content: code('12345678-1234-4234-8234-123456789abc'), author: { id: '12345678-1234-4234-8234-123456789abc', username: who, displayName: who } },
    { id: 'l1', content: sealText(`ITDXL1 n=fire b=custom g=11 i=${IMG}`, src), author: { id: '12345678-1234-4234-8234-123456789abc', username: who } },
    { id: 'l2', content: 'ITDXL1 n=gold b=snow g=11', author: { id: 'x9', username: 'nomod' } },
    { id: 'v1', content: 'ITDX-V 12345678-1234-4234-8234-123456789abc', author: { id: '5e064703-104d-4794-bc28-9ed6f5847cca', username: 'NeuroSFW' } }
  ];
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(3500);
  await p.evaluate(() => document.body.appendChild(document.createElement('i')));
  await p.waitForTimeout(600);

  const mark = await p.evaluate(u => {
    const nick = document.querySelector('[data-vp-look="fire"]'), av = document.querySelector('[data-vp-look-av="fire"]');
    return {
      nick: nick && nick.textContent.trim(), fill: nick && getComputedStyle(nick).webkitTextFillColor,
      glow: !!document.querySelector('[data-vp-look-glow="fire"]'), av: !!av, avFilter: av && getComputedStyle(av).filter,
      nomod: !!document.querySelector('[data-vp-look="gold"]')
    };
  }, who);
  console.log('—    ' + JSON.stringify(mark));
  check(!!mark.nick && mark.fill === 'rgba(0, 0, 0, 0)', 'ник автора — его стиль «Огненный» (градиент по тексту)');
  check(mark.glow && mark.av && /drop-shadow/.test(mark.avFilter || ''), 'свечение ника и аватарки — его');
  check(!mark.nomod, 'строка стиля без кода мода — не показывается');

  await p.waitForFunction(u => [...document.querySelectorAll('.vp-club-row')].some(r => r.dataset.login.toLowerCase() === u.toLowerCase()), who, { timeout: 8000 }).catch(() => { });
  const club = await p.evaluate(u => {
    const rows = [...document.querySelectorAll('.vp-club-row')];
    const his = rows.find(r => r.dataset.login.toLowerCase() === u.toLowerCase()), mine = rows.find(r => r.dataset.login === 'NeuroSFW');
    return { his: his && his.querySelector('.vp-club-name').getAttribute('data-vp-look'), hisAv: his && his.querySelector('.vp-club-ava').getAttribute('data-vp-look-av'),
      mine: !!mine && mine.querySelector('.vp-club-name').classList.contains('vp-my-nick') && mine.querySelector('.vp-club-ava').classList.contains('my-avatar-glow') };
  }, who);
  check(club.his === 'fire' && club.hisAv === 'fire', `клуб ИТД X: у него ник и аватарка в его стиле ${JSON.stringify(club)}`);
  check(club.mine, 'клуб ИТД X: моя строка — в моём стиле');
  const onl = () => p.evaluate(u => {
    const rows = [...document.querySelectorAll('.vp-club-row')], his = rows.find(r => r.dataset.login.toLowerCase() === u.toLowerCase());
    return { order: rows.map(r => r.dataset.login), on: his && his.hasAttribute('data-online'), tip: his && his.title,
      dot: his && getComputedStyle(his.querySelector('.vp-club-ava'), '::after').backgroundColor, head: document.querySelector('.vp-club-count').textContent };
  }, who);
  await p.waitForFunction(() => document.querySelector('.vp-club-row[data-online]:not([data-login="NeuroSFW"])'), null, { timeout: 15000 }).catch(() => { });
  let o = await onl();
  console.log('—    в сети: ' + JSON.stringify(o));
  check(o.on && o.tip === 'в сети' && o.dot === 'rgb(34, 197, 94)' && o.order[0] === 'NeuroSFW' && o.head === '2 · 2', 'клуб: кто в сети — зелёная точка, подсказка «в сети», в заголовке «● 2 · 2»');
  await p.screenshot({ path: path.join(__dirname, 'out', 'club-online.png'), clip: await p.$eval('[data-block="club"]', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }) });
  await p.setViewportSize({ width: 1920, height: 1000 }); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(__dirname, 'out', 'club-online-1920.png'), clip: await p.$eval('[data-block="club"]', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }) });
  hisOnline = false;
  await p.waitForTimeout(15500);
  await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await p.waitForTimeout(1200);
  o = await onl();
  console.log('—    вышел: ' + JSON.stringify(o));
  check(!o.on && /^был\(а\) в сети в \d\d:\d\d$/.test(o.tip || '') && o.head === '2', 'вышел — без точки, подсказка «был(а) в сети в чч:мм», в заголовке просто число');
  const pub = sent.filter(x => /^ITDXL1 /.test(x.body));
  check(pub.length === 1 && /^ITDXE /.test(pub[0].raw), 'стиль уходит на сервер в шифре (ITDXE)');
  check(pub.length === 1 && pub[0].m === 'POST' && /^ITDXL1 n=white b=matrix g=11$/.test(pub[0].body), `свой стиль опубликован одной строкой: ${pub.map(x => x.m + ' ' + x.body).join(' | ')}`);

  await p.evaluate(u => { history.pushState({}, '', '/@' + u); document.body.appendChild(document.createElement('i')); }, who);
  await p.waitForTimeout(800);
  const guest = await p.evaluate(() => { const im = document.querySelector('.vp-bg-media img'); return { src: im && im.src, shown: !document.querySelector('.vp-bg-media').classList.contains('vp-bg-off') }; });
  check(guest.shown && /cdn\.xn--d1ah4a\.com\/images\/0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d\.webp$/.test(guest.src || ''), `на его профиле — его фон с сервера ИТД ${JSON.stringify(guest)}`);
  await p.evaluate(() => { history.pushState({}, '', '/'); document.body.appendChild(document.createElement('i')); });
  await p.waitForTimeout(800);
  const back = await p.evaluate(() => ({ media: document.querySelector('.vp-bg-media').classList.contains('vp-bg-off'), canvas: !document.querySelector('.vp-bg-canvas').classList.contains('vp-bg-off') }));
  check(back.media && back.canvas, `ушёл с профиля — снова свой фон (матрица) ${JSON.stringify(back)}`);

  await p.evaluate(() => { document.documentElement.classList.remove('vp-looks'); });
  const off = await p.evaluate(() => { const n = document.querySelector('[data-vp-look="fire"]'); return n && getComputedStyle(n).webkitTextFillColor; });
  check(off !== 'rgba(0, 0, 0, 0)', 'без «Стили других» чужой ник обычный');
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
