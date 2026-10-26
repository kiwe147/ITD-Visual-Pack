// Профиль через клуб: открыл свой профиль строкой клуба — вкладка «Профиль» в боковом меню подсвечена, чужой — нет.
// Запуск:  node test/clubnav.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const ME = 'NeuroSFW';
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
    if (['image', 'stylesheet', 'font'].includes(t)) return r.fulfill({ status: 404, body: '' });
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: ME, id: 'me-id', displayName: ME }) });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, vp_ver_at: Date.now() + 36e5 };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    window.__seed = () => localStorage.setItem('itd_verified_users', JSON.stringify({ [window.__verName || 'neurosfw']: { code: 'x', hasMod: true, flags: '1', state: 'approved', id: 'me-id', displayName: 'NeuroSFW' }, alice: { code: 'x', hasMod: true, flags: '1', state: 'approved', id: 'id-a', displayName: 'Alice' } }));
    window.__seed();
  }, [src.slice(0, src.indexOf('==/UserScript=='))]);
  await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
  await p.goto(ORIGIN + '/');
  await p.waitForTimeout(1500);
  await p.evaluate(() => window.__seed());
  await p.waitForTimeout(500);
  const active = () => p.evaluate(() => [...document.querySelectorAll('.vp-nav-link.vp-active')].map(a => a.getAttribute('href')));
  const rows = await p.evaluate(() => [...document.querySelectorAll('.vp-club-row')].map(r => r.dataset.login).filter(x => /^(alice|NeuroSFW)$/.test(x)));
  console.log('—    строки клуба:', rows.join(', '), '· вкладки в меню:', await p.evaluate(() => [...document.querySelectorAll('.vp-nav-link')].map(a => a.getAttribute('href')).join(' ')));
  check(rows.length > 0, 'клуб построился');
  const click = login => p.evaluate(l => [...document.querySelectorAll('.vp-club-row')].filter(r => r.dataset.login.toLowerCase() === l.toLowerCase()).pop().click(), login);
  await p.evaluate(() => { history.pushState({}, '', '/@alice'); dispatchEvent(new PopStateEvent('popstate')); }); await p.waitForTimeout(700);
  let a = await active();
  console.log('—    после клика по alice: path', await p.evaluate(() => location.pathname), 'подсвечено', JSON.stringify(a));
  check(!a.some(h => h.toLowerCase() === '/@' + ME.toLowerCase()), 'чужой профиль через клуб: «Профиль» не подсвечен');
  await click(ME); await p.waitForTimeout(700);
  a = await active();
  console.log('—    после клика по себе: path', await p.evaluate(() => location.pathname), 'подсвечено', JSON.stringify(a));
  check(a.some(h => h.toLowerCase() === '/@' + ME.toLowerCase()), 'свой профиль через клуб: «Профиль» в меню подсвечен');
  check(!errors.length, 'ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
