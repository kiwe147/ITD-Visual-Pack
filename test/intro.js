// Заставка по кадрам: тёмная/светлая тема, обычная/редкая. Кадры — test/out/intro-<тема>-<вид>.png
// (полоса из моментов: удар первой буквы, все буквы, X, подпись, уход).
// Запуск:  node test/intro.js снимок.html [dark|light] [normal|rare] [phone|desktop]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [snapPath, theme = 'dark', kind = 'normal', mode = 'desktop'] = process.argv.slice(2);
const snap = fs.readFileSync(snapPath, 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const URL0 = 'https://xn--d1ah4a.com/';
const TIMES = (process.env.TIMES || "650,1500,1900,2500,3050").split(",").map(Number);
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage(mode === 'desktop' ? { viewport: { width: 1280, height: 800 } } : { viewport: { width: 392, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/*', r => { const u = r.request().url();
    if (u === URL0) return r.fulfill({ contentType: 'text/html', body: snap });
    return r.fulfill({ status: 404, body: '' }); });
  await p.addInitScript(([m, th, rare]) => {
    const s = { introEnabled: true, introMobile: 'silent', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    if (rare) Math.random = () => 0.005;                 // шанс 1% — выпал
    document.addEventListener('DOMContentLoaded', () => document.documentElement.setAttribute('data-theme', th));
  }, [src.slice(0, src.indexOf('==/UserScript==')), theme, kind === 'rare']);
  await p.goto(URL0);
  await p.evaluate(th => { document.documentElement.setAttribute('data-theme', th); document.querySelectorAll('.vpi-overlay').forEach(e => e.remove()); }, theme);
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(100);
  const shots = [];
  for (const t of TIMES) {
    await p.evaluate(t => document.getAnimations().forEach(a => { if (a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.vpi-overlay')) { a.pause(); a.currentTime = t; } }), t);
    await p.waitForTimeout(80);
    const f = path.join(__dirname, 'out', `_intro-${t}.png`);
    await p.screenshot({ path: f });
    shots.push(f);
  }
  const info = await p.evaluate(() => { const o = document.querySelector('.vpi-overlay'); return o ? o.className : 'нет'; });
  console.log(`${theme} ${kind} ${mode}: ${info}${errs.length ? ' | ошибки: ' + errs.join(' | ') : ''}`);
  // склейка кадров в полосу — средствами браузера
  const strip = await p.evaluate(async fs => {
    const imgs = await Promise.all(fs.map(s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; })));
    const w = imgs[0].width / 2, h = imgs[0].height / 2, c = document.createElement('canvas');
    c.width = w * imgs.length + 8 * (imgs.length - 1); c.height = h;
    const g = c.getContext('2d'); g.fillStyle = '#f00'; g.fillRect(0, 0, c.width, c.height);
    imgs.forEach((im, i) => g.drawImage(im, i * (w + 8), 0, w, h));
    return c.toDataURL('image/png');
  }, shots.map(f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64')));
  fs.writeFileSync(path.join(__dirname, 'out', `intro-${theme}-${kind}-${mode}.png`), Buffer.from(strip.split(',')[1], 'base64'));
  shots.forEach(f => fs.unlinkSync(f));
  await b.close();
})();
