// Дождь на видеокарте (WebGL) и дождь на холсте дают похожую картину: сравниваем долю закрашенных пикселей и проверяем режимы.
// У дождя у каждой струи свой случайный путь, поэтому кадры не равны попиксельно (как у «Сияния»), сравнивается плотность.
// Запуск:  node test/rainparity.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const meta = src.slice(0, src.indexOf('==/UserScript=='));
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
async function shot(b, noGl, soft, w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (!/Failed to load resource/.test(m.text()) && m.type() === 'error') errors.push(m.text().slice(0, 140)); });
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html data-theme="dark"><head></head><body style="margin:0;background:#000"></body></html>' });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m, ng, sf]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: true, backgroundStyle: 'rain', nickStyle: 'pinkNeon', palsEnabled: false, sceneEnabled: false, bgGlForce: !sf };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = x => setTimeout(() => x.onerror && x.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    if (ng) { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); }; }
  }, [meta, noGl, !!soft]);
  await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
  await p.goto(ORIGIN + '/');
  await p.waitForTimeout(2500);
  const info = await p.evaluate(() => [...document.querySelectorAll('.vp-bg-canvas')].map(c => (c.classList.contains('vp-bg-off') ? 'off' : 'on') + ':' + c.width + 'x' + c.height + ':' + c.style.opacity).join(' | '));
  const raw = await p.screenshot();
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'out', 'rain-' + (noGl ? '2d' : soft ? 'soft' : 'gl') + '.png'), raw);
  const lit = await p.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0, sum = 0;
    for (let i = 0; i < d.length; i += 4) { const v = d[i] + d[i + 1] + d[i + 2]; if (v > 18) n++; sum += v; }
    return { frac: n / (d.length / 4), mean: sum / (d.length / 4) };
  }, raw.toString('base64'));
  await ctx.close();
  return { info, lit, errors };
}
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[1200, 800], [800, 1000]]) {
    console.log('=== ' + w + 'x' + h);
    const A = await shot(b, false, false, w, h), B = await shot(b, true, false, w, h), C = await shot(b, false, true, w, h);
    console.log('—    видеокарта:', A.info, JSON.stringify(A.lit));
    console.log('—    обычное рисование:', B.info, JSON.stringify(B.lit));
    check((A.info.split('|')[1] || '').trim() === 'on:' + w + 'x' + h + ':0.85', 'в режиме видеокарты показан холст WebGL (прозрачность 0.85): ' + A.info);
    check(B.info.split('|')[0].trim().startsWith('on:') && /off/.test(B.info.split('|')[1] || ''), 'без WebGL запасной путь: показан обычный холст');
    check(C.info.split('|')[0].trim().startsWith('on:') && /off/.test(C.info.split('|')[1] || ''), 'программный WebGL отвергается: фон рисуется обычным холстом');
    check(A.lit.frac > 0.005 && B.lit.frac > 0.005, 'струи видны в обоих режимах');
    const r = A.lit.frac / B.lit.frac;
    check(r > 0.6 && r < 1.6, 'плотность струй близка: на видеокарте / на холсте = ' + r.toFixed(2));
    const m = A.lit.mean / B.lit.mean;
    check(m > 0.6 && m < 1.6, 'яркость близка: ' + m.toFixed(2));
    check(!A.errors.length && !B.errors.length && !C.errors.length, 'ошибок нет' + [...A.errors, ...B.errors, ...C.errors].slice(0, 2).join(' | '));
  }
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
