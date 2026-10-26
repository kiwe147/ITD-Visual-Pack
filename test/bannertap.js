// Шторка с кнопками на баннере на телефоне: закрыта, пока не нажмёшь на баннер; нажатие открывает и закрывает; нажатие кнопки её закрывает.
// Запуск:  node test/bannertap.js снимок-своего-профиля.html
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
  for (const phone of [true, false]) {
    const ctx = await b.newContext(phone ? { viewport: { width: 412, height: 860 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.route('**/*', r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me' && req.method() === 'GET') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: 'NeuroSFW', id: OWNER }) });
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
    await p.goto(ORIGIN + '/@NeuroSFW');
    await p.waitForTimeout(2500);
    const st = () => p.evaluate(() => { const bar = document.querySelector('.vp-banner-buttons'), ban = document.querySelector('.vp-banner'); if (!bar || !ban) return null; const cs = getComputedStyle(bar); return { vis: cs.visibility, op: cs.opacity, open: ban.classList.contains('vp-bar-open') }; });
    const tag = phone ? 'телефон' : 'компьютер';
    let s = await st();
    check(!!s, tag + ': шторка и баннер есть на странице');
    if (!s) continue;
    if (phone) {
      check(s.vis === 'hidden' && !s.open, tag + ': шторка закрыта до нажатия (' + JSON.stringify(s) + ')');
      const box = await p.evaluate(() => { const r = document.querySelector('.vp-banner').getBoundingClientRect(); for (let fy = 0.9; fy > 0.1; fy -= 0.1) for (let fx = 0.15; fx < 0.9; fx += 0.1) { const x = r.x + r.width * fx, y = r.y + r.height * fy, e = document.elementFromPoint(x, y); if (e && e.closest('.vp-banner') && !e.closest('.vp-banner-buttons')) return { x, y }; } return null; });
      if (!box) { check(false, tag + ': нет свободной точки на баннере для нажатия'); continue; }
      await p.touchscreen.tap(box.x, box.y); await p.waitForTimeout(500);
      s = await st();
      check(s.vis === 'visible' && s.open, tag + ': нажатие на баннер открывает шторку (' + JSON.stringify(s) + ')');
      await p.touchscreen.tap(box.x, box.y); await p.waitForTimeout(500);
      s = await st();
      check(s.vis === 'hidden' && !s.open, tag + ': повторное нажатие закрывает (' + JSON.stringify(s) + ')');
      await p.touchscreen.tap(box.x, box.y); await p.waitForTimeout(500);
      const btn = await p.evaluate(() => { const r = document.querySelector('.vp-banner-buttons > button')?.getBoundingClientRect(); return r && { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      if (btn) { await p.touchscreen.tap(btn.x, btn.y); await p.waitForTimeout(500); s = await st(); check(s.vis === 'hidden' && !s.open, tag + ': нажатие кнопки шторки закрывает её (' + JSON.stringify(s) + ')'); }
      else check(false, tag + ': в шторке нет кнопок эффектов для проверки');
    } else {
      check(!s.open, tag + ': на компьютере класс открытия не ставится сам');
      await p.mouse.click(700, 120); await p.waitForTimeout(300);
      s = await st();
      check(!s.open, tag + ': клик по баннеру на компьютере шторку не переключает (' + JSON.stringify(s) + ')');
    }
    check(!errors.length, tag + ': ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
    await ctx.close();
  }
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
