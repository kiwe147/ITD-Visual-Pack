const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const meta = src.slice(0, src.indexOf('==/UserScript=='));
const info = (snap.match(/<script type="application\/json" id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const URL0 = 'https://xn--d1ah4a.com' + (info ? new URL(JSON.parse(info).url).pathname : '/');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 900 } });
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
  const out = path.join(__dirname, 'out');
  await p.screenshot({ path: path.join(out, 'side-wide.png') });console.log(await p.evaluate(() => { const g = q => { const e = document.querySelector(q); if (!e) return null; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return Math.round(r.left) + '/' + Math.round(r.width) + ' ' + cs.display + ' ' + cs.visibility + ' op' + cs.opacity; }; const as = [...document.querySelectorAll('aside')].map(a => Math.round(a.getBoundingClientRect().left) + '/' + Math.round(a.getBoundingClientRect().width) + (getComputedStyle(a).display)); return JSON.stringify({ blob: g('.vp-nav-blob'), active: g('.vp-nav-link.vp-active'), nav: g('nav.vp-nav'), asides: as }); }));
  await b.close();
})();
