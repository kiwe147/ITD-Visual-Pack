// Шапка ленты на узких телефонах: «было» (скрипт из файла-1) и «стало» (текущий) на ширинах 360 и 320, с кнопкой «Обновить».
// Запуск:  node test/phoneshots.js снимок-ленты-ПК-свежий.html css-сайта.css скрипт-было.js папка-результата
// (разметка берётся из снимка ПК: сайт адаптивный и на узком окне рисует телефонную вёрстку, мод её достраивает)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [snapFile, cssFile, beforeFile, outDir] = process.argv.slice(2);
const snap = fs.readFileSync(snapFile, 'utf8'), css = fs.readFileSync(cssFile, 'utf8');
const now = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8'), before = fs.readFileSync(beforeFile, 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
fs.mkdirSync(outDir, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const shoot = async (src, w) => {
    const ctx = await b.newContext({ viewport: { width: w, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    await p.route('**/*', r => {
      const u = new URL(r.request().url()), t = r.request().resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap.replace('</head>', '<link rel="stylesheet" href="/assets/site.css"></head>') });
      if (u.pathname === '/assets/site.css') return r.fulfill({ contentType: 'text/css', body: css });
      if (t === 'image') { let h = 0; for (const ch of u.href) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return r.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="hsl(${h % 360},35%,${25 + h % 25}%)"/></svg>` }); }
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
      if (t === 'font' || t === 'script' || t === 'stylesheet') return r.abort();
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(m => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => (/raw\.githubusercontent/.test(o.url) && o.onload) ? o.onload({ status: 200, responseText: '// @version      9.9.9\n' }) : o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: '3.5.8.3' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, src.slice(0, src.indexOf('==/UserScript==')));
    await p.goto(ORIGIN + '/');
    await p.evaluate(() => {
      document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob, .vp-itdx-btn, .vp-msgs, .vp-gal, .vp-gal-nav, .my-nav-block').forEach(e => e.remove());
      document.querySelectorAll('style').forEach(st => { const r = st.sheet && st.sheet.cssRules; if (r) for (let i = r.length - 1; i >= 0; i--) if (/vp-|--vp|vpPal|vpMsgs|vpGal/.test(r[i].cssText)) st.sheet.deleteRule(i); });
      document.documentElement.className = [...document.documentElement.classList].filter(c => !c.startsWith('vp-')).join(' ');
      document.documentElement.removeAttribute('style');
    });
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(3500);
    const buf = await p.screenshot();
    await ctx.close();
    return buf;
  };
  const shots = [];
  for (const w of [360, 320]) for (const [name, src] of [['было', before], ['стало', now]]) shots.push([`${w} px, ${name}`, await shoot(src, w)]);
  const page = await b.newPage();
  const png = await page.evaluate(async items => {
    const cv = document.createElement('canvas'); cv.width = 4 * 660; cv.height = 1280 + 40;
    const g = cv.getContext('2d'); g.fillStyle = '#222'; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = '#fff'; g.font = '28px sans-serif';
    for (let i = 0; i < items.length; i++) {
      const im = await new Promise(r => { const x = new Image(); x.onload = () => r(x); x.src = 'data:image/png;base64,' + items[i][1]; });
      g.fillText(items[i][0], i * 660 + 20, 30);
      g.drawImage(im, i * 660 + 10, 40, im.width * 1280 / im.height, 1280);
    }
    return cv.toDataURL('image/png').split(',')[1];
  }, shots.map(([n, bf]) => [n, bf.toString('base64')]));
  fs.writeFileSync(path.join(outDir, 'phone-sheet.png'), Buffer.from(png, 'base64'));
  await b.close();
  console.log('готово');
})();
