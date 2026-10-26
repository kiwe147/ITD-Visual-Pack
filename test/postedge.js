// Пост с размытой картинкой вместо фона: заливка обрезана ровно по скруглению поста (clip-path), поэтому обводка идёт по самому краю, а заливка не вылезает за неё в углах.
// Запуск:  node test/postedge.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (t === 'image') return r.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#8a4a2b"/></svg>' });
    if (t === 'font') return r.abort();
    if (t === 'stylesheet') return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => { document.querySelectorAll('.itd-blur-container').forEach(e => e.remove()); document.querySelectorAll('[data-blur-bg]').forEach(e => { e.removeAttribute('data-blur-bg'); e.classList.remove('itd-blur-active', 'vp-blur-rel'); }); });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelector('article.vp-post.itd-blur-active').scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(600);
  const info = await p.evaluate(() => {
    const a = document.querySelector('article.vp-post.itd-blur-active'), c = a.querySelector(':scope > .itd-blur-container');
    const ar = a.getBoundingClientRect(), cr = c.getBoundingClientRect();
    return { clip: c.style.clipPath, radius: getComputedStyle(a).borderTopLeftRadius, same: ['left', 'top', 'width', 'height'].every(k => Math.abs(ar[k] - cr[k]) < 0.6), box: [ar.left, ar.top] };
  });
  check(/round\s+24px/.test(info.clip) && info.radius === '24px', 'заливка обрезана по скруглению поста: ' + info.clip);
  check(info.same, 'заливка того же размера, что и пост');
  const shot = await p.screenshot({ clip: { x: info.box[0] - 4, y: info.box[1] - 4, width: 16, height: 16 } });
  const px = await p.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(8 + 2, 8 + 2, 1, 1).data;
    return [d[0], d[1], d[2]];
  }, shot.toString('base64'));
  check(px[0] < 40 && px[1] < 40 && px[2] < 40, 'самый угол поста пустой, заливка в нём не торчит: ' + px.join(','));
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
