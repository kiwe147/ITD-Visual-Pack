// Какие анимации заставки НЕ идут на видеокарте (compositeFailed в трассе Chrome).
// Запуск:  node test/introtrace.js снимок.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const meta = src.slice(0, src.indexOf('==/UserScript=='));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await p.route('**/*', r => { const q = r.request(), u = new URL(q.url()); if (u.origin === 'https://xn--d1ah4a.com' && q.resourceType() === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap }); if (['image', 'stylesheet', 'font'].includes(q.resourceType())) return r.continue(); return r.fulfill({ status: 404, body: '' }); });
  await p.addInitScript(m => { const s = { backgroundEnabled: false }; window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; }; window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0); window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window; }, meta);
  await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
  const events = [];
  cdp.on('Tracing.dataCollected', d => events.push(...d.value));
  await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['blink.animations', 'devtools.timeline', 'cc', 'disabled-by-default-devtools.timeline'] }, transferMode: 'ReportEvents' });
  await p.goto('https://xn--d1ah4a.com/', { waitUntil: 'commit' });
  await p.waitForTimeout(4000);
  const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.end'); await done;
  const an = events.filter(e => e.name === 'Animation' && e.args && e.args.data);
  console.log('событий Animation:', an.length);
  const seen = new Map();
  an.forEach(e => { const d = e.args.data; const k = [d.state, d.nodeName || '', d.displayName || '', d.compositeFailed, JSON.stringify(d.unsupportedProperties || [])].join(' | '); seen.set(k, (seen.get(k) || 0) + 1); });
  [...seen].sort((a, c) => c[1] - a[1]).slice(0, 25).forEach(([k, n]) => console.log(String(n).padStart(4), k));
  await b.close();
})();
