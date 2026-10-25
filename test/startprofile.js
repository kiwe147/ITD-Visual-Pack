// Сколько времени start() тратит на каждый файл из src/ (метки между файлами, сборка с метками во временный файл).
// Запуск:  CPU=4 node test/startprofile.js снимок.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const CPU = +process.env.CPU || 1;
const order = fs.readFileSync(path.join(root, 'src', 'order.txt'), 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const mark = n => "(window.__vpMarks = window.__vpMarks || []).push(['" + n + "', performance.now()]);\n";
let src = '';
order.forEach(f => {
  let t = fs.readFileSync(path.join(root, 'src', f), 'utf8').replace(/\r\n/g, '\n');
  const n = f.replace('.js', '');
  if (/^(1[1-9]|[2-9]\d)-/.test(n)) t = mark(n) + t;
  if (n === '90-boot-tail') t = t.replace("console.log('🟢 ИТД X');", mark('конец start') + "console.log('🟢 ИТД X');");
  if (n === '10-core-dom') t = t.replace('const start = () => {\n', 'const start = () => {\n' + mark('10-core-dom'));
  const NL = String.fromCharCode(10);
  if (process.env.DRILL && n === process.env.DRILL) t = t.split(NL).map((l, i) => i > 556 && i < 568 && /^        [a-zA-Z(`]/.test(l) ? mark(n + ':' + (i + 1) + ' ' + l.trim().slice(0, 36)) + l : l).join(NL);
  if (process.env.HACK && n === '24-visuals-init') t = t.replace('        paint();' + NL + '        requestAnimationFrame(frame);', "        { const st = document.createElement('style'); st.textContent = 'html.vp-boot, html.vp-boot * { transition: none !important; }'; document.head.appendChild(st); document.documentElement.classList.add('vp-boot'); paint(); requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('vp-boot'))); }" + NL + '        requestAnimationFrame(frame);');
  src += t;
});
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
  await p.waitForFunction(() => (window.__vpMarks || []).some(m => m[0] === 'конец start'), null, { timeout: 30000 });
  const marks = await p.evaluate(() => window.__vpMarks);
  const rows = marks.slice(0, -1).map((m, i) => [m[0], marks[i + 1][1] - m[1]]);
  const total = marks[marks.length - 1][1] - marks[0][1];
  console.log('ЦП ×' + CPU + ': start() целиком ' + Math.round(total) + ' мс');
  rows.sort((a, c) => c[1] - a[1]).slice(0, 14).forEach(([n, ms]) => console.log(String(Math.round(ms)).padStart(6) + ' мс  ' + n));
  await b.close();
})();
