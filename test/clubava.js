// Аватарки в клубе ИТД X: картинка не застревает эмодзи, если «внешность» подгрузилась позже; последняя найденная картинка запоминается.
// Запуск:  node test/clubava.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8').replace('async function renderClub() {', 'window.__rc = () => renderClub(); async function renderClub() {');
const ORIGIN = 'https://xn--d1ah4a.com';
const REF = '0' + 'ab12cd34'.repeat(4);
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (t === 'image') return r.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64') });
    if (['stylesheet', 'font'].includes(t)) return r.fulfill({ status: 404, body: '' });
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: 'me-id', displayName: 'NeuroSFW' }) });
    if (u.pathname.startsWith('/api/users/')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'alice', displayName: 'Alice', avatar: '🦊' }) });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, vp_ver_at: Date.now() + 36e5 };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; window.__gm = s; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    window.__seed = a => localStorage.setItem('itd_verified_users', JSON.stringify({
      neurosfw: { code: 'x', hasMod: true, flags: '1', state: 'approved', id: 'me-id', displayName: 'NeuroSFW' },
      alice: { code: 'x', hasMod: true, flags: '1', state: 'approved', id: 'id-alice', displayName: 'Alice', look: a ? { n: 'white', b: '-', g: '11', a } : { n: 'white', b: '-', g: '11' } }
    }));
    window.__seed('');
  }, [src.slice(0, src.indexOf('==/UserScript=='))]);
  await p.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => { document.querySelectorAll('.vp-rail, .vp-nav-blob, .vp-fab, .settings-dropdown, .vp-itdx-btn, .vp-msgs, .vp-pals').forEach(e => e.remove()); document.querySelectorAll('.vp-nuksta-hidden').forEach(e => e.classList.remove('vp-nuksta-hidden')); });
  await p.addScriptTag({ content: src });
  await p.waitForFunction(() => [...document.querySelectorAll('.vp-club-row')].some(x => x.dataset.login === 'alice'), null, { timeout: 15000 }).catch(() => { });
  await p.waitForTimeout(500);
  const ava = () => p.evaluate(() => { const r = [...document.querySelectorAll('.vp-club-row')].filter(x => x.dataset.login === 'alice').pop(); const a = r && r.querySelector('.vp-club-ava'); return r ? { img: a.querySelector('img') ? a.querySelector('img').getAttribute('src') : '', text: a.textContent } : null; });
  await p.evaluate(() => window.__rc());
  await p.waitForTimeout(800);
  let a = await ava();
  await p.evaluate(ref => { window.__seed(ref); return window.__rc(); }, REF);
  await p.waitForTimeout(1500);
  await p.evaluate(() => window.__rc());
  await p.waitForTimeout(500);
  a = await ava();
  check(a && /cdn\./.test(a.img || '') && a.text === '', 'картинка подгрузилась позже: эмодзи заменилось картинкой без перестройки списка: ' + JSON.stringify(a));
  const cached = await p.evaluate(() => (window.__gm && window.__gm['vp_club_ava']) || null);
  check(cached && cached.alice && /cdn\./.test(cached.alice), 'картинка запомнена для быстрой отрисовки: ' + JSON.stringify(cached));
  await p.evaluate(() => { window.__seed(''); const d = document.createElement('div'); document.body.appendChild(d); setTimeout(() => d.remove(), 50); return window.__rc(); });
  await p.waitForTimeout(2500);
  await p.evaluate(() => window.__rc());
  await p.waitForTimeout(400);
  a = await ava();
  check(a && !a.img, 'если картинку убрали, запомненная не залипает: ' + JSON.stringify(a));
  check(!errors.length, 'ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
