// Аватарки-картинки в «Сообщениях»: в списке чатов и в шапке открытого чата показывается картинка собеседника (а не пустой кружок), даже если сведения о ней подгрузились позже.
// Запуск:  node test/msgava.js снимок-ленты.html   (SHOT=путь.png — снимок окна)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const REF = '0' + 'ab12cd34'.repeat(4);
const IMG = 'https://cdn.xn--d1ah4a.com/images/ab12cd34-ab12-cd34-ab12-cd34ab12cd34.png';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', async r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (t === 'image') return r.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#2a8cff"/><circle cx="32" cy="32" r="14" fill="#fff"/></svg>' });
    if (['stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"me-id"}' });
    if (u.pathname.startsWith('/api/users/')) { await new Promise(ok => setTimeout(ok, 1200)); return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { username: 'sunmen', displayName: 'Sunman', avatar: '🦊', online: true } }) }); }
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m, ref]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, vp_ver_at: Date.now() + 36e5 };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    window.__seed = a => localStorage.setItem('itd_verified_users', JSON.stringify({
      neurosfw: { code: 'x', hasMod: true, flags: '1', state: 'approved', id: 'me-id', displayName: 'NeuroSFW' },
      sunmen: { code: 'x', hasMod: true, flags: '1', state: 'approved', id: 'id-sun', displayName: 'Sunman', look: { n: 'white', b: '-', g: '11', a } }
    }));
    window.__seed(ref);
  }, [src.slice(0, src.indexOf('==/UserScript==')), REF]);
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => document.querySelectorAll('.vp-msgs, .vp-nav-blob, .vp-fab, .vp-rail').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  await p.evaluate(ref => window.__seed(ref), REF);
  await p.$eval('nav a[href="#"]', a => a.click());
  await p.waitForTimeout(400);
  const row = () => p.evaluate(() => { const r = [...document.querySelectorAll('.vp-msgs-row')].find(x => /Sunman|sunmen/i.test(x.textContent)); const a = r && r.querySelector('.vp-msgs-ava'); return a ? { img: !!a.querySelector('img'), src: (a.querySelector('img') || {}).src || '', text: a.textContent.trim() } : null; });
  console.log('ROWS', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.vp-msgs-row')].map(x => x.textContent.trim().slice(0, 40)))), await p.evaluate(() => localStorage.getItem('itd_verified_users') && Object.keys(JSON.parse(localStorage.getItem('itd_verified_users')))));
  const early = await row();
  await p.evaluate(() => [...document.querySelectorAll('.vp-msgs-row')].find(x => /Sunman|sunmen/i.test(x.textContent)).click());
  await p.waitForTimeout(150);
  const headEarly = await p.evaluate(() => { const a = document.querySelector('.vp-msgs-chead .vp-msgs-ava'); return a ? a.textContent.trim() + (a.querySelector('img') ? '[img]' : '') : null; });
  await p.waitForTimeout(2600);
  const late = await p.evaluate(() => null);
  const head = await p.evaluate(() => { const a = document.querySelector('.vp-msgs-chead .vp-msgs-ava'); return { img: !!(a && a.querySelector('img')), src: ((a && a.querySelector('img')) || {}).src || '', text: a ? a.textContent.trim() : null }; });
  check(head.img && /ab12cd34/.test(head.src), 'чат открыт до загрузки профиля, потом в шапке картинка, а не тёмный кружок 👤 (сразу было: ' + headEarly + ', стало: ' + JSON.stringify(head) + ')');
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT });
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  console.log('—    сразу после открытия: ' + JSON.stringify(early));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
