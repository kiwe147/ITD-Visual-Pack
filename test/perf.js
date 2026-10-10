// Замер: сколько времени занимает каждый обработчик изменений страницы (onDom) на длинной ленте.
// Лента из снимка размножается до ~250 постов, страницу прокручивают вниз и обратно; каждый проход — изменение DOM.
// Печатает самые тяжёлые обработчики и долгие проходы (> 50 мс — заметная заминка).
// Запуск:  node test/perf.js снимок-ленты.html [desktop|phone]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const mode = process.argv[3] || 'desktop';
let src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8').replace(/\r\n/g, '\n');
// замер каждого обработчика и всего прохода — только в копии для теста
const a = 'for (const fn of domHandlers) { try { fn(); }';
if (!src.includes(a)) { console.log('ОШИБКА: не нашёл цикл обработчиков'); process.exit(1); }
src = src.replace(a, 'for (const fn of domHandlers) { try { const __t = performance.now(); try { fn(); } finally { const __p = window.__prof || (window.__prof = {}); const __k = fn.name || "?"; __p[__k] = (__p[__k] || 0) + performance.now() - __t; } }')
  .replace('tagAll(false);', 'const __tg = performance.now(); tagAll(false); (window.__prof || (window.__prof = {})).tagAll = ((window.__prof || {}).tagAll || 0) + performance.now() - __tg;');
src = src.replace("        } finally {\n            domObserver.observe(document.body, DOM_WATCH);",
  "        } finally {\n            (window.__ticks || (window.__ticks = [])).push(performance.now() - lastTick);\n            domObserver.observe(document.body, DOM_WATCH);");
const ORIGIN = 'https://xn--d1ah4a.com';
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage(mode === 'phone' ? { viewport: { width: 392, height: 812 }, isMobile: true, hasTouch: true } : { viewport: { width: 1500, height: 900 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['stylesheet', 'font'].includes(t)) return r.continue();
    if (t === 'image') return r.fulfill({ status: 404, body: '' });
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off' };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  // лента подлиннее: размножаем посты снимка, пока сайт «подгружает» (как бесконечная лента)
  await p.evaluate(() => {
    document.querySelectorAll('[class*="vp-"]').forEach(e => [...e.classList].filter(c => c.startsWith('vp-')).forEach(c => e.classList.remove(c)));
    document.querySelectorAll('.vp-rail, .vp-fab, .vp-post-tools, .vp-post-refresh, .vp-gal-btn').forEach(e => e.remove());
  });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  await p.evaluate(() => {
    window.__prof = {}; window.__ticks = []; window.__long = []; window.__frames = [];
    new PerformanceObserver(l => l.getEntries().forEach(e => window.__long.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: false });
    let last = performance.now();
    const f = now => { window.__frames.push(now - last); last = now; requestAnimationFrame(f); };
    requestAnimationFrame(f);
  });
  const t0 = Date.now();
  for (let round = 0; round < 12; round++) {
    await p.evaluate(() => {
      const arts = [...document.querySelectorAll('article')].slice(0, 20), host = arts[0] && arts[0].parentElement;
      arts.forEach(a => host.appendChild(a.cloneNode(true)));
    });
    for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 900); await p.waitForTimeout(60); }
  }
  for (let i = 0; i < 20; i++) { await p.mouse.wheel(0, -2500); await p.waitForTimeout(40); }
  const r = await p.evaluate(() => ({ long: window.__long, frames: window.__frames, prof: window.__prof, ticks: window.__ticks, posts: document.querySelectorAll('article').length, nodes: document.getElementsByTagName('*').length }));
  const total = Object.values(r.prof).reduce((x, y) => x + y, 0);
  const top = Object.entries(r.prof).sort((x, y) => y[1] - x[1]).slice(0, 12);
  const long = r.ticks.filter(t => t > 50);
  console.log(`${mode}: постов ${r.posts}, узлов ${r.nodes}, проходов ${r.ticks.length}, всего ${Math.round(total)} мс за ${Math.round((Date.now() - t0) / 1000)} с; самый долгий проход ${Math.round(Math.max(0, ...r.ticks))} мс, дольше 50 мс: ${long.length}`);
  const fr = r.frames.slice(5).sort((x, y) => x - y), med = fr[fr.length >> 1] || 0, p95 = fr[Math.floor(fr.length * .95)] || 0;
  console.log(`  кадры: медиана ${med.toFixed(1)} мс, 95% ${p95.toFixed(1)} мс, дольше 100 мс: ${fr.filter(x => x > 100).length}; долгих задач: ${r.long.length}, сумма ${r.long.reduce((x, y) => x + y, 0)} мс, самая ${Math.max(0, ...r.long)} мс`);
  top.forEach(([k, v]) => console.log(`  ${String(Math.round(v)).padStart(6)} мс  ${k}`));
  if (errors.length) console.log('ошибки: ' + [...new Set(errors)].slice(0, 5).join(' | '));
  await b.close();
})();
