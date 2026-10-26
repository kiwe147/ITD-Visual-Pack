// Лайки в уведомлениях: сердечко внутри розового кружка контурное, как значок ответа (в ванили оно того же цвета, что и кружок, и не видно).
// Запуск:  node test/notifheart.js снимок-уведомлений.html
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
  const p = await b.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 3 });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.fulfill({ status: 404, body: '' });
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, [src.slice(0, src.indexOf('==/UserScript=='))]);
  await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
  await p.goto(ORIGIN + '/notifications');
  await p.waitForTimeout(2500);
  const st = await p.evaluate(() => { const e = document.querySelector('.vp-notif [data-icon="liked"] svg path'), c = document.querySelector('.vp-notif [data-icon="comment"] svg path'); const g = x => x ? { fill: getComputedStyle(x).fill, stroke: getComputedStyle(x).stroke } : null; return { like: g(e), comment: g(c) }; });
  check(st.like && st.like.fill === 'none' && st.like.stroke === st.comment.stroke && st.like.stroke !== 'none', 'сердечко в лайке контурное того же цвета, что значок ответа: ' + JSON.stringify(st));
  const box = await p.evaluate(() => { const l = document.querySelector('.vp-notif [data-icon="liked"]').closest('.vp-notif'), c = document.querySelector('.vp-notif [data-icon="comment"]').closest('.vp-notif'); const a = l.getBoundingClientRect(), z = c.getBoundingClientRect(), top = Math.min(a.y, z.y), bot = Math.max(a.bottom, z.bottom); return { x: Math.max(0, a.x), y: Math.max(0, top), width: 520, height: Math.min(800, bot - top) }; });
  await p.screenshot({ path: path.join(__dirname, 'out', 'notifheart.png'), clip: box });
  const size = await p.evaluate(() => { const s = document.querySelector('.vp-notif [data-icon="liked"] svg').getBoundingClientRect(), c = document.querySelector('.vp-notif [data-icon="liked"]').closest('div').getBoundingClientRect(); return { heart: Math.round(s.width), circle: Math.round(c.width) }; });
  check(size.heart === 12 && size.heart < size.circle, 'сердечко 12 px и помещается в кружок ' + JSON.stringify(size));
  const mid = await p.evaluate(() => { const h = document.querySelector('.vp-notif [data-icon="liked"] svg').getBoundingClientRect(), c = document.querySelector('.vp-notif [data-icon="liked"]').parentElement.getBoundingClientRect(); return { dx: Math.round(Math.abs(h.x + h.width / 2 - c.x - c.width / 2) * 10) / 10, dy: Math.round(Math.abs(h.y + h.height / 2 - c.y - c.height / 2) * 10) / 10 }; });
  check(mid.dx <= 1.5 && mid.dy <= 1.5, 'сердечко по центру кружка ' + JSON.stringify(mid));
  check(!errors.length, 'ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
