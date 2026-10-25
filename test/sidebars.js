// Ширина левой панели сайта и правой панели мода («Клуб», игры и т. д.) на разных ширинах окна.
// Запуск:  node test/sidebars.js снимок.html [ширина,ширина,...]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const widths = (process.argv[3] || '1100,1280,1440,1600,1920,2048').split(',').map(Number);
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const meta = src.slice(0, src.indexOf('==/UserScript=='));
const info = (snap.match(/<script type="application\/json" id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const URL0 = 'https://xn--d1ah4a.com' + (info ? new URL(JSON.parse(info).url).pathname : '/');
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  for (const w of widths) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.route('**/*', r => {
      const u = r.request().url();
      if (u.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.endsWith('/api/users/me')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: 'N', id: '5e064703-104d-4794-bc28-9ed6f5847cca' }) });
      if (u === URL0) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (/\.(png|jpe?g|webp|css|woff2?)(\?|$)/.test(u)) return r.continue();
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(m => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, meta);
    await p.goto(URL0);
    await p.evaluate(() => document.querySelectorAll('.vp-msgs, .vp-nav-blob, .vp-fab, .vp-rail').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(3500);
    const r = await p.evaluate(() => {
      const rect = e => { if (!e) return null; const q = e.getBoundingClientRect(); return { l: Math.round(q.left), w: Math.round(q.width), r: Math.round(q.right) }; };
      const asides = [...document.querySelectorAll('aside')];
      const left = asides.find(a => a.querySelector('nav')), right = asides.find(a => !a.querySelector('nav'));
      const rail = document.querySelector('.vp-rail.vp-on'), card = rail && rail.querySelector('.vp-rail-card:not([hidden])');
      const main = document.querySelector('main');
      const navInner = left && left.querySelector('nav');
      return { left: rect(left), leftNav: rect(navInner), right: rect(right), rail: rect(rail), card: rect(card), main: rect(main), cls: document.documentElement.className.match(/vp-[\w-]+/g) };
    });
    console.log(w, JSON.stringify(r));
    await p.close();
  }
  await b.close();
})();
