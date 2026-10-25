// Сколько времени съедают обработчики onDom (по имени/номеру) за N срабатываний после загрузки страницы.
// Запуск:  CPU=1 node test/domcost.js снимок.html [число_срабатываний]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const N = +process.argv[3] || 30, CPU = +process.env.CPU || 1;
let src = fs.readFileSync(path.join(root, 'ITD-Visual-Pack.user.js'), 'utf8').replace(/\r\n/g, '\n');
const a = "for (const fn of domHandlers) { try { fn(); }";
if (!src.includes(a)) throw new Error('не нашёл цикл обработчиков');
src = src.replace(a, "for (const fn of domHandlers) { try { const __t = performance.now(); fn(); const __d = performance.now() - __t; const __k = fn.name || ('#' + domHandlers.indexOf(fn)); const __o = (window.__dc = window.__dc || {})[__k] || (window.__dc[__k] = { n: 0, ms: 0, max: 0 }); __o.n++; __o.ms += __d; if (__d > __o.max) __o.max = __d; }");
src = src.replace('function domTick() {', 'function domTick() { window.__ticks = (window.__ticks || 0) + 1; const __tt = performance.now(); setTimeout(() => { window.__tickMs = (window.__tickMs || 0) + (performance.now() - __tt); }, 0);');
const meta = src.slice(0, src.indexOf('==/UserScript=='));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  await p.route('**/*', r => { const q = r.request(), u = new URL(q.url()); if (u.origin === 'https://xn--d1ah4a.com' && q.resourceType() === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap }); if (['image', 'stylesheet', 'font'].includes(q.resourceType())) return r.continue(); if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: 'u1', followersCount: 236, followingCount: 125, postsCount: 573 }) }); return r.fulfill({ status: 404, body: '' }); });
  await p.addInitScript(m => { const s = { backgroundEnabled: false, introEnabled: false }; window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; }; window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0); window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window; }, meta);
  await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
  await p.goto('https://xn--d1ah4a.com/', { waitUntil: 'commit' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { window.__dc = {}; window.__ticks = 0; window.__tickMs = 0; });
  for (let i = 0; i < N; i++) {
    await p.evaluate(i => { const d = document.createElement('div'); d.className = 'x' + i; d.textContent = 'тест ' + i; const post = document.querySelector('article') || document.body; (post.parentElement || document.body).appendChild(d); setTimeout(() => d.remove(), 30); }, i);
    await p.waitForTimeout(80);
  }
  const r = await p.evaluate(() => ({ dc: window.__dc, ticks: window.__ticks }));
  const rows = Object.entries(r.dc).map(([k, o]) => [k, o.ms, o.n, o.max]).sort((x, y) => y[1] - x[1]);
  const total = rows.reduce((s, x) => s + x[1], 0);
  console.log('ЦП ×' + CPU + ': срабатываний домовых проходов ' + r.ticks + ', обработчиков ' + rows.length + ', всего ' + total.toFixed(1) + ' мс (' + (total / Math.max(1, r.ticks)).toFixed(2) + ' мс за проход)');
  rows.slice(0, 12).forEach(([k, ms, n, mx]) => console.log(ms.toFixed(1).padStart(7) + ' мс  вызовов ' + String(n).padStart(3) + '  макс ' + mx.toFixed(1).padStart(5) + '  ' + k));
  await b.close();
})();
