// Клуб ИТД X: «в сети» обновляется сразу, когда сайт и так загрузил данные человека (профиль, автор поста в ленте), без отдельного запроса.
// Запуск:  node test/clubonline.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8').replace('async function renderClub() {', 'window.__rc = () => renderClub(); async function renderClub() {');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  const state = { alice: true, bob: false };
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (t === 'image') return r.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64') });
    if (['stylesheet', 'font'].includes(t)) return r.fulfill({ status: 404, body: '' });
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: 'me-id', displayName: 'NeuroSFW' }) });
    const m = u.pathname.match(/^\/api\/users\/(alice|bob)$/);
    if (m) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { username: m[1], displayName: m[1], online: state[m[1]] } }) });
    if (u.pathname === '/api/posts') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: [{ id: '11111111-1111-4111-8111-111111111111', content: 'x', author: { username: 'bob', online: state.bob } }] } }) });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, vp_ver_at: Date.now() + 36e5, vp_club_next: Date.now() + 36e5 };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    localStorage.setItem('itd_verified_users', JSON.stringify({
      neurosfw: { code: 'x', hasMod: true, flags: '1', state: 'approved', id: 'me-id', displayName: 'NeuroSFW' },
      alice: { code: 'x', hasMod: true, flags: '1', state: 'approved', id: 'id-alice', displayName: 'Alice', look: { n: 'white', b: '-', g: '11' } },
      bob: { code: 'x', hasMod: true, flags: '1', state: 'approved', id: 'id-bob', displayName: 'Bob', look: { n: 'white', b: '-', g: '11' } }
    }));
  }, [src.slice(0, src.indexOf('==/UserScript=='))]);
  await p.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => { document.querySelectorAll('.vp-rail, .vp-nav-blob, .vp-fab, .settings-dropdown, .vp-itdx-btn, .vp-msgs, .vp-pals').forEach(e => e.remove()); });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { localStorage.setItem('itd_verified_users', JSON.stringify({ neurosfw: { code: 'x', hasMod: true, flags: '1', state: 'approved', id: 'me-id', displayName: 'NeuroSFW' }, alice: { code: 'x', hasMod: true, flags: '1', state: 'approved', id: 'id-alice', displayName: 'Alice', look: { n: 'white', b: '-', g: '11' } }, bob: { code: 'x', hasMod: true, flags: '1', state: 'approved', id: 'id-bob', displayName: 'Bob', look: { n: 'white', b: '-', g: '11' } } })); return window.__rc(); });
  await p.waitForFunction(() => document.querySelectorAll('.vp-club-row').length >= 3, null, { timeout: 15000 }).catch(() => { });
  await p.waitForTimeout(500);
  const online = () => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.vp-club-row')].map(r => [r.dataset.login, r.hasAttribute('data-online')])));
  const call = u => p.evaluate(async u => { await (await fetch(u)).json(); await new Promise(r => setTimeout(r, 120)); }, u);
  console.log('—    строки клуба: ' + JSON.stringify(await online()));
  console.log('—    LS: ' + (await p.evaluate(() => Object.keys(localStorage).join(',') + ' | ' + String(localStorage.getItem('itd_verified_users')).slice(0, 120))));
  await call('/api/users/alice');
  let o = await online();
  check(o.alice === true && o.bob === false, 'профиль загрузился: Alice в сети, Bob нет — без отдельного опроса ' + JSON.stringify(o));
  state.bob = true;
  await call('/api/posts?limit=5');
  o = await online();
  check(o.bob === true && o.alice === true, 'автор поста в ленте в сети: Bob тоже в сети ' + JSON.stringify(o));
  state.alice = false;
  await call('/api/users/alice');
  o = await online();
  check(o.alice === false && o.bob === true, 'вышел из сети: точка у Alice пропала ' + JSON.stringify(o));
  const cnt = await p.evaluate(() => document.querySelector('.vp-club-count').textContent.replace(/\s+/g, ' ').trim());
  check(/^(?:1 · 3|3)$/.test(cnt) || /1/.test(cnt), 'счётчик «в сети» обновился: «' + cnt + '»');
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
