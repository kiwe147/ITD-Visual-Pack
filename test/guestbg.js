// Фон чужого профиля не должен оставаться, когда поверх профиля открыта галерея или сообщения (оверлеи мода не меняют адрес).
// Запуск:  node test/guestbg.js снимок-ленты.html
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
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob, .vp-itdx-btn, .vp-msgs, .vp-gal, .vp-gal-nav').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(3500);
  await p.evaluate(() => document.body.appendChild(document.createElement('i')));
  await p.waitForTimeout(600);

  const bgState = () => p.evaluate(() => { const m = document.querySelector('.vp-bg-media'), im = m && m.querySelector('img'); return { img: !!im, off: m && m.classList.contains('vp-bg-off'), own: !document.querySelector('.vp-bg-canvas').classList.contains('vp-bg-off') }; });
  await p.waitForFunction(() => document.querySelector('[data-vp-look="fire"]'), null, { timeout: 20000 }).catch(() => { });
  await p.waitForFunction(() => document.querySelector('.vp-gal-nav'), null, { timeout: 8000 }).catch(() => { });
  console.log('—    стиль на ленте: ' + await p.evaluate(() => JSON.stringify({ fire: !!document.querySelector('[data-vp-look="fire"]'), gal: !!document.querySelector('.vp-gal-nav'), look: JSON.stringify(((JSON.parse(localStorage.getItem('itd_verified_users') || '{}'))[document.querySelector('article a[href^="/@"]') && 'vivvishka'] || {}).look) })));
  const has = c => p.evaluate(k => document.documentElement.classList.contains(k), c);
  await p.evaluate(u => { history.pushState({}, '', '/@' + u); document.body.appendChild(document.createElement('i')); }, who);
  await p.waitForTimeout(900);
  const on = await bgState();
  console.log('—    профиль: ' + JSON.stringify(on));
  check(!on.own, 'на профиле с фоном — свой фон убран, стоит его');
  await p.locator('nav a.vp-gal-nav').first().click({ force: true });
  await p.waitForTimeout(1500);
  const gal = await bgState();
  console.log('—    галерея: ' + JSON.stringify(gal));
  check(await has('vp-gal-open'), 'галерея открылась');
  check(gal.own, 'поверх профиля открыта галерея — снова свой фон, чужого нет');
  await p.locator('nav a.vp-gal-nav').first().click({ force: true });
  await p.waitForTimeout(300);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(900);
  console.log('—    галерея закрыта: ' + JSON.stringify(await bgState()) + ' открыта=' + await has('vp-gal-open'));
  await p.evaluate(() => document.querySelector('.vp-nav-link[href="#"]').click());
  await p.waitForTimeout(1200);
  const msg = await bgState();
  console.log('—    сообщения: ' + JSON.stringify(msg));
  check(await has('vp-msgs-open'), 'сообщения открылись');
  check(msg.own, 'поверх профиля открыты сообщения — снова свой фон, чужого нет');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(1200);
  const after = await bgState();
  console.log('—    сообщения закрыты: ' + JSON.stringify(after) + ' открыты=' + await has('vp-msgs-open'));
  check(!(await has('vp-msgs-open')) && !after.own, 'закрыл сообщения — фон профиля снова на месте');
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
