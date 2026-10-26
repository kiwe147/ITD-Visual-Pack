// Значок подтверждения не прилипает к пункту «Профиль» в боковом меню при первой загрузке (когда мод ещё не знает свой ник), а боковая карточная панель не показывается на странице входа.
// Запуск:  node test/navbadge.js снимок-своего-профиля.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', async r => {
    const req = r.request(), u = new URL(req.url()), t = req.resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me' && req.method() === 'GET') { await new Promise(x => setTimeout(x, 6000)); return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: 'NeuroSFW', id: OWNER }) }); }
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    localStorage.setItem('itd_verified_users', JSON.stringify({ neurosfw: { code: 'x', hasMod: true, flags: '1', state: 'approved', id: 'id-n', displayName: 'NeuroSFW', look: { n: 'white', b: '-', g: '11' } } }));
  }, [src.slice(0, src.indexOf('==/UserScript=='))]);
  await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
  await p.goto(ORIGIN + new URL(snap.match(/"url": "([^"]+)"/)[1]).pathname);
  await p.waitForTimeout(3000);
  const early = await p.evaluate(() => ({ nav: document.querySelectorAll('nav a[href^="/@"] .mod-badge-verify').length, anyNav: !!document.querySelector('nav a[href^="/@"]') }));
  check(early.anyNav, 'пункт «Профиль» в боковом меню найден');
  check(early.nav === 0, 'пока мод не знает свой ник, значок не прилип к пункту «Профиль» (' + early.nav + ')');
  await p.waitForTimeout(5000);
  const later = await p.evaluate(() => document.querySelectorAll('nav a[href^="/@"] .mod-badge-verify').length);
  check(later === 0, 'и после загрузки ника значка в меню нет (' + later + ')');
  await p.evaluate(() => { history.pushState({}, '', '/login'); dispatchEvent(new PopStateEvent('popstate')); document.body.appendChild(document.createElement('i')); });
  await p.waitForTimeout(1500);
  await p.evaluate(() => dispatchEvent(new Event('resize')));
  await p.waitForTimeout(500);
  await p.evaluate(() => dispatchEvent(new Event('resize')));
  await p.waitForTimeout(500);
  const rail = await p.evaluate(() => { const all = document.querySelectorAll('.vp-rail'), r = all[all.length - 1]; return r ? r.classList.contains('vp-on') : null; });
  check(rail !== true, 'на странице входа панель «Статистика / Клуб / Игры» скрыта (vp-on=' + rail + ')');
  check(!errors.length, 'ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
