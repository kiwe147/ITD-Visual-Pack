// Карточка профиля при наведении: выключается переключателем «Карточка профиля при наведении».
// Запуск:  node test/hovercard.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const req = r.request(), u = new URL(req.url()), t = req.resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname.startsWith('/api/users/') && u.pathname !== '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { username: 'someone', displayName: 'Кто-то', bio: 'о себе', followersCount: 5, followingCount: 2 } }) });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    try { const st = JSON.parse(localStorage.getItem('__gm') || 'null'); if (st) Object.assign(s, st); } catch (e) { }
    window.GM_getValue = (k, d) => k in s ? s[k] : d;
    window.GM_setValue = (k, v) => { s[k] = v; try { localStorage.setItem('__gm', JSON.stringify(s)); } catch (e) { } };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, [src.slice(0, src.indexOf('==/UserScript=='))]);
  await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
  await p.goto(ORIGIN + new URL(snap.match(/"url": "([^"]+)"/)[1]).pathname);
  await p.waitForTimeout(3500);
  const link = () => p.evaluateHandle(() => [...document.querySelectorAll('a[href^="/@"]')].find(a => !a.closest('nav, .vp-rail, .vp-hc') && a.getBoundingClientRect().width > 10 && a.getBoundingClientRect().top > 60 && a.getBoundingClientRect().bottom < innerHeight - 40));
  const hover = async () => { await p.mouse.move(5, 5); await p.waitForTimeout(150); const h = await link(); const el = h.asElement(); check(!!el, 'нашлась ссылка на профиль в ленте'); if (!el) return false; await el.scrollIntoViewIfNeeded(); await el.hover(); return true; };
  if (await hover()) {
    await p.waitForTimeout(1200);
    check(await p.evaluate(() => !!document.querySelector('.vp-hc')), 'карточка появляется при наведении');
  }
  await p.mouse.move(5, 5); await p.waitForTimeout(500);
  check(await p.evaluate(() => !document.querySelector('.vp-hc')), 'карточка убирается, когда курсор ушёл');
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('__gm') || '{}'); s.hoverCard = false; localStorage.setItem('__gm', JSON.stringify(s)); });
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3500);
  if (await hover()) {
    await p.waitForTimeout(900);
    check(await p.evaluate(() => !document.querySelector('.vp-hc')), 'при выключенной настройке карточка не появляется');
  }
  check(!errors.length, 'ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
