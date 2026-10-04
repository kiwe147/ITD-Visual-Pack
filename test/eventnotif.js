// Уведомление от сайта без ссылки на профиль (ивент: «Кто напердел?», аватар 🔔) красится как остальные (3.5.2.2).
// Раньше уведомлением считалась только карточка со ссылкой на профиль, у ивента её нет — фона не было.
// Запуск:  node test/eventnotif.js снимок-уведомлений.html [файл скрипта]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.argv[3] || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1808, height: 1000 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: 'u1' }) });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/notifications');
  await p.evaluate(() => {
    document.querySelectorAll('.vp-notif, .vp-emoji-tint, [data-colored]').forEach(e => {
      e.classList.remove('vp-notif', 'vp-emoji-tint'); e.removeAttribute('data-colored'); e.style.removeProperty('--vp-emoji');
    });
    document.querySelectorAll('.vp-rail, .vp-fab, .vp-nav-blob').forEach(e => e.remove());
  });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('[role="button"]')].filter(b => /Кто напердел/.test(b.textContent) && !b.parentElement.closest('[role="button"]'));
    const ev = cards[0];
    const notifs = [...document.querySelectorAll('.vp-notif')];
    return {
      found: !!ev, notif: !!ev && ev.classList.contains('vp-notif'), tint: !!ev && ev.classList.contains('vp-emoji-tint'),
      color: ev && ev.style.getPropertyValue('--vp-emoji'), total: notifs.length,
      stray: notifs.filter(n => n.closest('nav, aside, article') || n.parentElement !== notifs[0].parentElement).length,
      tinted: notifs.filter(n => n.classList.contains('vp-emoji-tint')).length,
    };
  });
  console.log('  уведомлений: ' + r.total + ', с фоном: ' + r.tinted + ', цвет ивента: ' + (r.color || '—'));
  check(r.found, 'карточка ивента есть в снимке');
  check(r.notif, 'карточка ивента считается уведомлением');
  check(r.tint, 'у карточки ивента цветной фон');
  check(r.stray === 0, 'уведомлениями помечены только карточки из списка');
  check(!errors.length, 'без ошибок на странице' + (errors.length ? ': ' + errors[0] : ''));
  await b.close();
  process.exit(fails.length ? 1 : 0);
})();
