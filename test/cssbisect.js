// Какой из блоков CSS (addCss) сильнее всего замедляет старт: по очереди выключаем каждый и мерим start().
// Запуск:  CPU=1 node test/cssbisect.js снимок.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const CPU = +process.env.CPU || 1;
const order = fs.readFileSync(path.join(root, 'src', 'order.txt'), 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const mark = n => "(window.__vpMarks = window.__vpMarks || []).push(['" + n + "', performance.now()]);\n";
const files = order.map(f => ({ f, t: fs.readFileSync(path.join(root, 'src', f), 'utf8').replace(/\r\n/g, '\n') }));
const build = skip => {
  let k = -1, src = '';
  files.forEach(({ f, t }) => {
    let x = t;
    if (skip === 999) x = x.replace(/addCss\(`([\s\S]*?)`\)/g, 'addCss(``)');
    else if (skip >= 0) x = x.replace(/addCss\(`([\s\S]*?)`\)/g, (m, body) => (++k === skip ? 'addCss(``)' : m));
    else k += (t.match(/addCss\(`[\s\S]*?`\)/g) || []).length;
    const n = f.replace('.js', '');
    if (n === '10-core-dom') x = x.replace('const start = () => {\n', 'const start = () => {\n' + mark('s'));
    if (n === '90-boot-tail') x = x.replace("console.log('🟢 ИТД X');", mark('e') + "console.log('🟢 ИТД X');");
    src += x;
  });
  return src;
};
(async () => {
  const b = await chromium.launch();
  const run = async skip => {
    const src = build(skip), meta = src.slice(0, src.indexOf('==/UserScript=='));
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    await p.route('**/*', r => { const q = r.request(), u = new URL(q.url()); if (u.origin === 'https://xn--d1ah4a.com' && q.resourceType() === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap }); if (['image', 'stylesheet', 'font'].includes(q.resourceType())) return r.continue(); if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: 'u1', followersCount: 236, followingCount: 125, postsCount: 573 }) }); return r.fulfill({ status: 404, body: '' }); });
    await p.addInitScript(m => { const s = { backgroundEnabled: false, introEnabled: false }; window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; }; window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0); window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window; }, meta);
    await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
    await p.goto('https://xn--d1ah4a.com/', { waitUntil: 'commit' });
    await p.waitForFunction(() => (window.__vpMarks || []).length >= 2, null, { timeout: 30000 });
    const m = await p.evaluate(() => window.__vpMarks);
    await ctx.close();
    return Math.round(m[1][1] - m[0][1]);
  };
  const N = (build(-1).match(/addCss\(`/g) || []).length;
  const base = [await run(-1), await run(-1), await run(-1)].sort((a, c) => a - c)[1];
  console.log('ЦП ×' + CPU + ', блоков addCss: ' + N + ', start() с полным CSS: ' + base + ' мс (медиана из 3)');
  console.log("без ВСЕГО css мода: " + await run(999) + " мс");
  const rows = [];
  for (let i = 0; i < (process.env.ONLYALL ? 0 : N); i++) rows.push([i, await run(i)]);
  rows.sort((a, c) => a[1] - c[1]).slice(0, 10).forEach(([i, ms]) => console.log('без блока #' + i + ': ' + ms + ' мс (выигрыш ' + (base - ms) + ')'));
  await b.close();
})();
