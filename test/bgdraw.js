// Фон мода: каждый из 8 стилей рисуется и меняется, мягкие стили рисуются в уменьшенном разрешении (60 кадров не режем),
// разбор чужого стиля профиля знает имена фонов (раньше падало: «BACKGROUNDS is not defined»).
// Запуск:  node test/bgdraw.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8').replace('function parseLook(', 'window.__pl = (...a) => parseLook(...a); function parseLook(');
const meta = src.slice(0, src.indexOf('==/UserScript=='));
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const STYLES = ['matrix', 'stars', 'particles', 'waves', 'aurora', 'bokeh', 'grid', 'snow'];
const RES = { aurora: 0.5, bokeh: 0.5, waves: 0.6, grid: 0.75, snow: 0.75 };
(async () => {
  const b = await chromium.launch();
  for (const st of STYLES) {
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (!/Failed to load resource/.test(m.text()) && (m.type() === 'error' || /Error/.test(m.text()))) errors.push(m.text().slice(0, 140)); });
    await p.route('**/*', r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m, s]) => {
      const o = { introEnabled: false, introMobile: 'off', backgroundEnabled: true, backgroundStyle: s, palsEnabled: false, sceneEnabled: false };
      window.GM_getValue = (k, d) => k in o ? o[k] : d; window.GM_setValue = (k, v) => { o[k] = v; };
      window.GM_xmlhttpRequest = x => setTimeout(() => x.onerror && x.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, [meta, st]);
    await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
    await p.goto(ORIGIN + '/');
    await p.waitForTimeout(2500);
    const info = await p.evaluate(() => { const c = document.querySelector('.vp-bg-canvas'); return { w: c.width, h: c.height, op: c.style.opacity, bg: window.itdvp && itdvp.bg() }; });
    const a = await p.screenshot();
    await p.waitForTimeout(450);
    const b2 = await p.screenshot();
    const k = RES[st] || 1;
    check(Math.abs(info.w - 1400 * k) <= 2 && Math.abs(info.h - 900 * k) <= 2, st + ': размер холста ' + info.w + 'x' + info.h + ' (масштаб ' + k + ')');
    check(!!info.op && +info.op > 0, st + ': прозрачность стиля (' + info.op + ')');
    check(!a.equals(b2), st + ': фон рисуется и меняется');
    check(info.bg && info.bg.стиль === st, st + ': диагностика itdvp.bg()');
    if (st === 'aurora') {
      const look = await p.evaluate(() => window.__pl && window.__pl('ITDXL1 n=white b=aurora g=11'));
      check(look && look.b === 'aurora', 'чужой стиль профиля с фоном aurora разбирается (раньше падало)');
      const bad = await p.evaluate(() => window.__pl && window.__pl('ITDXL1 n=white b=nonexist g=11'));
      check(!bad || !bad.b || bad.b === '-', 'неизвестный фон отбрасывается');
    }
    check(!errors.length, st + ': ошибок нет' + (errors.length ? ': ' + errors.slice(0, 2).join(' | ') : ''));
    await ctx.close();
  }
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
