// Сияние на видеокарте (WebGL) должно выглядеть так же, как рисование на холсте: один и тот же момент анимации — сравнение по пикселям.
// Время замораживается: Math.random постоянный, requestAnimationFrame отдаёт ровно три кадра с одинаковыми отметками времени.
// Запуск:  node test/bgparity.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const meta = src.slice(0, src.indexOf('==/UserScript=='));
const ORIGIN = 'https://xn--d1ah4a.com';
const OPS = { aurora: 0.45, waves: 0.3, bokeh: 0.4, grid: 0.4, snow: 0.6, stars: 0.4, particles: 0.35, matrix: 0.2 };
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
function png(buf) {
  let o = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (o < buf.length) { const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8); if (type === 'IHDR') { w = buf.readUInt32BE(o + 8); h = buf.readUInt32BE(o + 12); ct = buf[o + 17]; } if (type === 'IDAT') idat.push(buf.slice(o + 8, o + 8 + len)); o += 12 + len; }
  const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = ct === 6 ? 4 : 3, stride = w * bpp, out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[y * stride + x - bpp] : 0, b = y ? out[(y - 1) * stride + x] : 0, c = x >= bpp && y ? out[(y - 1) * stride + x - bpp] : 0;
      let v = raw[y * (stride + 1) + 1 + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += (pa <= pb && pa <= pc) ? a : pb <= pc ? b : c; }
      out[y * stride + x] = v & 255;
    }
  }
  return { w, h, bpp, data: out };
}
async function shot(b, noGl, soft, style) {
  const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const req = r.request(), u = new URL(req.url()), t = req.resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html data-theme="dark"><head></head><body style="margin:0;background:#101018"></body></html>' });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m, ng, sf, st]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: true, backgroundStyle: st, nickStyle: 'pinkNeon', palsEnabled: false, sceneEnabled: false, bgGlForce: !sf };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = x => setTimeout(() => x.onerror && x.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    Math.random = () => 0.37;
    let n = 0; const real = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = f => real(() => { if (n < 40) { n++; f(n * 16.7); } });
    if (ng) { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); }; }
  }, [meta, noGl, !!soft, style]);
  await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
  await p.goto(ORIGIN + '/');
  await p.waitForTimeout(2500);
  const info = await p.evaluate(() => [...document.querySelectorAll('.vp-bg-canvas')].map(c => (c.classList.contains('vp-bg-off') ? 'off' : 'on') + ':' + c.width + 'x' + c.height + ':' + c.style.opacity).join(' | '));
  const raw = await p.screenshot();
  fs.writeFileSync(path.join(__dirname, 'out', 'parity-' + style + (noGl ? '-2d' : '-gl') + '.png'), raw);
  const img = png(raw);
  await ctx.close();
  return { img, errors, info };
}
(async () => {
  const b = await chromium.launch();
  for (const STYLE of (process.env.STYLES || 'aurora').split(',')) {
  console.log('=== ' + STYLE);
  const TOL = { mean: +(process.env.TOL_MEAN || 1.5), big: +(process.env.TOL_BIG || 0.03) };
  const A = await shot(b, false, false, STYLE), B = await shot(b, true, false, STYLE), C = await shot(b, false, true, STYLE);
  console.log('—    холсты (видеокарта):', A.info);
  console.log('—    холсты (обычное рисование):', B.info);
  check((A.info.split('|')[1] || '').trim() === 'on:1200x800:' + OPS[STYLE], 'в режиме видеокарты показан холст WebGL (прозрачность ' + OPS[STYLE] + '): ' + A.info);
  check(B.info.split('|')[0].trim().startsWith('on:') && /off/.test(B.info.split('|')[1] || ''), 'без WebGL запасной путь: показан обычный холст');
  console.log('—    без принудительного режима (на стенде видеокарта программная):', C.info);
  check(C.info.split('|')[0].trim().startsWith('on:') && /off/.test(C.info.split('|')[1] || ''), 'программный WebGL отвергается: фон рисуется обычным холстом');
  let sum = 0, max = 0, big = 0;
  const n = A.img.w * A.img.h;
  for (let i = 0; i < A.img.data.length; i++) { const d = Math.abs(A.img.data[i] - B.img.data[i]); sum += d; if (d > max) max = d; if (d > 12) big++; }
  const mean = sum / A.img.data.length;
  console.log('—    разница: средняя ' + mean.toFixed(3) + ' из 255, наибольшая ' + max + ', пикселей-каналов с разницей больше 12: ' + (big / A.img.data.length * 100).toFixed(2) + '%');
  check(mean < TOL.mean, 'картинка на видеокарте совпадает с обычной (средняя разница ' + mean.toFixed(2) + ' из 255)');
  check(big / A.img.data.length < TOL.big, 'заметно отличающихся пикселей меньше 3%');
  check(!A.errors.length && !B.errors.length, 'ошибок страницы нет' + (A.errors.concat(B.errors).length ? ': ' + A.errors.concat(B.errors).join(' | ') : ''));
  }
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
