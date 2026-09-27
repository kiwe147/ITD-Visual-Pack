// Плавность перетаскивания стикера: процессор замедлен в 4 раза (как телефон), тащим стикер 1.5 с
// по кругу над сеткой; печатает кадры в секунду и самый длинный кадр.
// Запуск:  node test/dragperf.js снимок-поста.html [файл скрипта]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.argv[3] || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const URL0 = 'https://xn--d1ah4a.com/@tester/post/p123';
const square = c => 'data:image/svg+xml;base64,' + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="14" fill="${c}"/></svg>`).toString('base64');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage({ viewport: { width: 900, height: 700 } });
  await p.route('**/*', r => { const u = r.request().url(), t = r.request().resourceType();
    if (u.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.endsWith('/api/users/me')) return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW"}' });
    if (u === URL0) return r.fulfill({ contentType: 'text/html', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    return r.fulfill({ status: 404, body: '' }); });
  const cols = ['#f44336', '#ff9800', '#ffc107', '#4caf50', '#2196f3', '#9c27b0', '#00bcd4', '#e91e63', '#8bc34a', '#795548', '#607d8b', '#3f51b5'];
  const packs = [{ id: 'user_1', name: 'Коты', stickers: cols.map((c, i) => ({ id: 's' + i, url: square(c) })) }];
  await p.addInitScript(([m, packs]) => { const s = { introEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    localStorage.setItem('user_sticker_packs_v1', JSON.stringify(packs)); localStorage.setItem('recent_stickers_v1', '[]'); }, [src.slice(0, src.indexOf('==/UserScript==')), packs]);
  await p.goto(URL0);
  await p.evaluate(() => document.querySelectorAll('.sticker-btn, .sticker-panel, .vp-fab').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(1500);
  await p.hover('.sticker-btn'); await p.waitForTimeout(500);
  await p.$$eval('.pack-header', hs => hs.find(h => h.dataset.pack === 'user_1').querySelector('button').click());
  await p.waitForTimeout(900);
  const cells = await p.$$eval('.pack-grid[data-pack="user_1"] .vp-sticker-item', bs => bs.map(b => { const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }));
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Performance.enable');
  const metric = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
  await p.evaluate(() => { window.__f = []; const loop = t => { window.__f.push(t); if (window.__f.length < 5000) requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
  await p.mouse.move(cells[0].x, cells[0].y); await p.mouse.down();
  const cx = (cells[0].x + cells[cells.length - 1].x) / 2, cy = (cells[0].y + cells[cells.length - 1].y) / 2, R = Math.abs(cells[cells.length - 1].x - cells[0].x) / 2;
  const t0 = Date.now();
  await p.evaluate(() => { window.__f = []; });
  const m0 = await metric();
  const lags = [];
  for (let k = 0; Date.now() - t0 < 1500; k++) {
    const x = cx + Math.cos(k / 8) * R, y = cy + Math.sin(k / 8) * R * .6;
    await p.mouse.move(x, y);
    // на сколько «призрак» отстаёт от пальца: середина «призрака» против точки, где сейчас палец
    // (у точки захвата — середина первой ячейки, так что должны совпадать)
    if (k % 5 === 4) lags.push(await p.evaluate(([x, y]) => { const g = document.querySelector('.vp-sticker-ghost'); if (!g) return -1;
      const r = g.getBoundingClientRect(); return Math.round(Math.hypot(r.x + r.width / 2 - x, r.y + r.height / 2 - y)); }, [x, y]));
  }
  const frames = await p.evaluate(() => window.__f.slice());
  const m1 = await metric();
  const d = k => Math.round((m1[k] - m0[k]) * 1000);
  await p.mouse.up();
  await b.close();
  const gaps = frames.slice(1).map((t, i) => t - frames[i]);
  const secs = (frames[frames.length - 1] - frames[0]) / 1000;
  console.log(`кадров в секунду: ${(gaps.length / secs).toFixed(0)}, самый длинный кадр: ${Math.round(Math.max(...gaps))} мс, кадров дольше 50 мс: ${gaps.filter(g => g > 50).length}`);
  console.log(`отставание «призрака» от пальца: среднее ${Math.round(lags.reduce((a, b) => a + b, 0) / lags.length)} px, наибольшее ${Math.max(...lags)} px`);
  console.log(`за ${secs.toFixed(1)} с: раскладка ${d('LayoutDuration')} мс (${m1.LayoutCount - m0.LayoutCount} раз), стили ${d('RecalcStyleDuration')} мс, скрипты ${d('ScriptDuration')} мс, всего задач ${d('TaskDuration')} мс`);
})();
