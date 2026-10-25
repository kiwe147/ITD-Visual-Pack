// Нагрузка во время стартовой заставки: длинные задачи главного потока, разрывы кадров, что тормозит (профиль ЦП).
// Скрипт грузится как в Tampermonkey (document-start), ЦП можно замедлить: CPU=4 (в 4 раза).
// Запуск:  CPU=4 node test/introload.js снимок.html [мс_окна=3500]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const WIN = +process.argv[3] || 3500, CPU = +process.env.CPU || 1;
let src = fs.readFileSync(process.env.SRC || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
if (process.env.NOSTART) {
  const tail = "if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });\n    else start();";
  const tail2 = tail.replace(/\n/g, '\r\n');
  if (src.includes(tail)) src = src.replace(tail, 'void 0;');
  else if (src.includes(tail2)) src = src.replace(tail2, 'void 0;');
  else throw new Error('не нашёл запуск start');
}
if (process.env.TIMESTART) src = src.replace('const start = () => {', 'const start = () => { const __s = performance.now(); setTimeout(() => console.log("START_MS", Math.round(performance.now() - __s)), 0); ');
const meta = src.slice(0, src.indexOf('==/UserScript=='));
const ORIGIN = 'https://xn--d1ah4a.com';
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  p.on('console', m => { if (/START_MS/.test(m.text())) console.log(m.text()); });
  const cdp = await ctx.newCDPSession(p);
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
  await p.route('**/*', r => {
    const req = r.request(), u = new URL(req.url()), t = req.resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: 'u1', followersCount: 236, followingCount: 125, postsCount: 573 }) });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m, code]) => {
    const s = { backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    window.__lt = []; window.__fr = []; window.__t0 = performance.now(); window.__playAt = 0; window.__jump = [];
    const op = Animation.prototype.play; Animation.prototype.play = function () { if (!window.__playAt) window.__playAt = Math.round(performance.now()); return op.apply(this, arguments); };
    const track = () => { const L = document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('vpi-letter')); const now = performance.now(); L.forEach((a, i) => { const k = 'p' + i; const prev = window['__' + k]; const ct = a.currentTime; if (prev && ct !== null && ct - prev.ct > 110 && now - prev.t < ct - prev.ct - 60) window.__jump.push([Math.round(now), Math.round(ct - prev.ct), Math.round(now - prev.t)]); window['__' + k] = { ct, t: now }; }); requestAnimationFrame(track); }; requestAnimationFrame(track);
    try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true }); } catch (e) { }
    let last = performance.now();
    const tick = t => { window.__fr.push([Math.round(t), Math.round(t - last)]); last = t; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);

  }, [meta, 0]);
  await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
  await cdp.send('Profiler.start');
  await p.goto(ORIGIN + '/', { waitUntil: 'commit' });
  await p.waitForTimeout(WIN);
  const prof = (await cdp.send('Profiler.stop')).profile;
  const data = await p.evaluate(() => ({ lt: window.__lt, fr: window.__fr, ov: !!document.querySelector('.vpi-overlay'), anims: document.getAnimations().length, playAt: window.__playAt, jump: window.__jump }));
  console.log(`ЦП ×${CPU}, окно ${WIN} мс, заставка идёт: ${data.ov}, анимаций: ${data.anims}`);
  console.log('длинные задачи (старт мс, длительность мс):', JSON.stringify(data.lt.slice(0, 20)));
  console.log('анимации заставки стартовали на', data.playAt, 'мс; скачки времени буквы (момент, на сколько ушла анимация, сколько прошло реально):', JSON.stringify(data.jump.slice(0, 8)));
  const after = data.fr.filter(f => f[0] >= data.playAt);
  console.log('после старта анимаций: самый длинный кадр', Math.max(0, ...after.map(f => f[1])), 'мс');
  const gaps = data.fr.filter(f => f[1] > 50);
  console.log('кадры длиннее 50 мс (момент, длина):', JSON.stringify(gaps.slice(0, 20)), ' всего кадров', data.fr.length);
  const total = data.lt.reduce((a, x) => a + x[1], 0);
  console.log('суммарно заблокировано длинными задачами:', total, 'мс из', WIN);
  const byId = new Map(prof.nodes.map(n => [n.id, n]));
  const self = new Map();
  const dt = prof.timeDeltas;
  prof.samples.forEach((id, i) => { const n = byId.get(id), key = (n.callFrame.functionName || '(анонимная)') + ' ' + (n.callFrame.url || '').slice(-30) + ':' + n.callFrame.lineNumber; self.set(key, (self.get(key) || 0) + (dt[i] || 0)); });
  console.log('самые тяжёлые функции (мс собственного времени):');
  [...self].sort((a, c) => c[1] - a[1]).slice(0, 14).forEach(([k, v]) => console.log('  ' + String(Math.round(v / 1000)).padStart(5), k));
  await b.close();
})();
