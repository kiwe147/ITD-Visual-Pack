// Было/стало: один и тот же снимок страницы со скриптом из main и с рабочим файлом.
// Запуск:  node test/compare.js путь/к/снимку.html [phone|desktop] [ветка=main] [настройка=значение ...]
// Кладёт в test/out/ скрины cmp-<режим>-old.png, -new.png и -diff.png (отличия — красным)
// и печатает долю отличающихся точек. Фон и заставка выключены — они анимированы и шумят.
// Картинки и стили грузятся с сайта по сети, запросы к API — заглушки, как в smoke.js.
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [snapPath, mode = 'phone', ref = 'main', ...opts] = process.argv.slice(2);
if (!snapPath) { console.error('укажи снимок: node test/compare.js снимок.html [phone|desktop] [ветка] [настройка=значение]'); process.exit(2); }
const snap = fs.readFileSync(snapPath, 'utf8');
const root = path.join(__dirname, '..');
const srcNew = fs.readFileSync(path.join(root, 'ITD-Visual-Pack.user.js'), 'utf8');
const srcOld = execSync(`git show ${ref}:ITD-Visual-Pack.user.js`, { cwd: root, maxBuffer: 64 << 20 }).toString();
const info = (snap.match(/<script type="application\/json" id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const URL0 = 'https://xn--d1ah4a.com' + (info ? new URL(JSON.parse(info).url).pathname : '/');
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const settings = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
for (const o of opts) { const [k, v] = o.split('='); settings[k] = v === 'true' ? true : v === 'false' ? false : isNaN(v) ? v : +v; }

async function shoot(browser, src, name) {
  const p = await browser.newPage(mode === 'desktop'
    ? { viewport: { width: 1280, height: 860 } }
    : { viewport: { width: 392, height: 812 }, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = r.request().url(), t = r.request().resourceType();
    if (u.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.endsWith('/api/users/me')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: '#NeuroSFW | ЧБ' }) });
    if (u === URL0) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m, s]) => {
    window.GM_getValue = (k, d) => k in s ? s[k] : d;
    window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('offline'), 0);
    window.GM_info = { script: { version: 'test' }, scriptMetaStr: m };
    window.unsafeWindow = window;
    Math.random = () => 0.5;                         // случайные узоры и значки — одинаковые в обоих прогонах
  }, [src.slice(0, src.indexOf('==/UserScript==')), settings]);
  await p.goto(URL0);
  await p.evaluate(() => document.querySelectorAll('.vp-nav-blob, .vp-fab, .vp-fps, .settings-dropdown, .nick-controls-panel, .vp-itdx-btn, .vp-msgs, .itd-blur-container').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForLoadState('networkidle').catch(() => { });
  await p.waitForTimeout(2500);
  // анимации — на конечный кадр, мигающий курсор — прочь; правая колонка (клуб, змейка) и значки мода
  // догружаются в разное время и шумят в любом сравнении — прячем, место остаётся
  await p.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused!important;caret-color:transparent!important} .vp-rail,.mod-badge-voronoi{visibility:hidden!important}' });
  await p.waitForTimeout(300);
  // места карточек и слоёв мода — точнее пикселей: видно, сдвинулось ли что-то и на сколько
  const rects = await p.evaluate(() => [...document.querySelectorAll('article, .itd-blur-container > *, .vp-emoji-tint')].map(e => {
    const r = e.getBoundingClientRect();
    return (e.className.baseVal ?? e.className).toString().split(' ').filter(c => /^(vp|itd)-/.test(c)).join('.') + ' ' + [r.x, r.y + scrollY, r.width, r.height].map(Math.round).join(',');
  }));
  const file = path.join(out, `cmp-${mode}-${name}.png`);
  await p.screenshot({ path: file, fullPage: true });
  await p.close();
  return { file, errors, rects };
}

(async () => {
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const a = await shoot(browser, srcOld, 'old');
  const b = await shoot(browser, srcNew, 'new');
  // сравниваем в браузере на холсте: разные точки — красным поверх бледной новой картинки
  const p = await browser.newPage();
  const res = await p.evaluate(async ([A, B]) => {
    const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; });
    const [ia, ib] = await Promise.all([load(A), load(B)]);
    const w = Math.max(ia.width, ib.width), h = Math.max(ia.height, ib.height);
    const px = img => { const c = new OffscreenCanvas(w, h), g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, w, h).data; };
    const da = px(ia), db = px(ib);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'), out = g.createImageData(w, h);
    let diff = 0;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
      if (d > 24) { diff++; out.data.set([255, 0, 0, 255], i); }
      else { const v = (db[i] + db[i + 1] + db[i + 2]) / 9 + 170; out.data.set([v, v, v, 255], i); }
    }
    g.putImageData(out, 0, 0);
    return { diff, total: w * h, sizes: `${ia.width}x${ia.height} / ${ib.width}x${ib.height}`, png: c.toDataURL('image/png') };
  }, [a.file, b.file].map(f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64')));
  fs.writeFileSync(path.join(out, `cmp-${mode}-diff.png`), Buffer.from(res.png.split(',')[1], 'base64'));
  await browser.close();
  const pct = (100 * res.diff / res.total).toFixed(3);
  console.log(`${mode}: отличаются ${res.diff} точек из ${res.total} (${pct}%), размеры ${res.sizes}`);
  const at = r => r && r.split(' ').pop();          // сравниваем только место: классы старого кода другие
  const moved = a.rects.map((r, i) => at(r) === at(b.rects[i]) ? null : `  было ${r}\n  стало ${b.rects[i]}`).filter(Boolean);
  console.log(`элементов: было ${a.rects.length}, стало ${b.rects.length}; не на месте: ${moved.length}`);
  if (moved.length) console.log(moved.slice(0, 8).join('\n'));
  if (a.errors.length) console.log('ошибки было: ' + a.errors.join(' | '));
  if (b.errors.length) console.log('ошибки стало: ' + b.errors.join(' | '));
  process.exit(b.errors.length ? 1 : 0);
})();
