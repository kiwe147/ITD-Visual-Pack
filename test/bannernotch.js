// Шторка баннера (3.3.15.2): при наведении выезжает из-под верхнего края баннера и ни в один момент анимации
// не видна выше баннера (раньше выезжала из-за верха страницы и проходила над баннером).
// Запуск:  node test/bannernotch.js снимок-своего-профиля.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const url = (snap.match(/"url": "([^"]+)"/) || [, ORIGIN + '/'])[1];
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: OWNER }) });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(url);
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  await p.mouse.move(5, 880);
  await p.waitForTimeout(500);
  const box = await (await p.$('.vp-banner')).boundingBox();
  const probe = () => p.evaluate(() => {
    const bn = document.querySelector('.vp-banner'), bar = bn.querySelector('.vp-banner-buttons');
    const r = bar.getBoundingClientRect(), cs = getComputedStyle(bar), m = cs.clipPath.match(/inset\(([\d.]+)(%|px)/);
    const cut = m ? (m[2] === '%' ? r.height * +m[1] / 100 : +m[1]) : 0;
    return { visTop: r.top + cut, visH: Math.max(0, r.height - cut), bannerTop: bn.getBoundingClientRect().top, op: +cs.opacity };
  });
  const hidden = await probe();
  check(hidden.visH < 1 || hidden.op < .01, `без наведения шторки не видно (видимая высота ${hidden.visH.toFixed(1)}, прозрачность ${hidden.op})`);
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const frames = [];
  for (let i = 0; i < 12; i++) {
    const f = await probe();
    frames.push(f);
    if (i === 2) await p.screenshot({ path: path.join(__dirname, 'out', 'bannernotch-mid.png'), clip: { x: box.x, y: 0, width: box.width, height: box.y + 120 } });
    await p.waitForTimeout(25);
  }
  const worst = Math.min(...frames.filter(f => f.visH > .5 && f.op > .02).map(f => f.visTop - f.bannerTop));
  console.log('—    кадры (видимый верх − верх баннера):', frames.map(f => (f.visTop - f.bannerTop).toFixed(1) + '/' + f.visH.toFixed(0)).join(' '));
  check(worst >= -0.5, `в анимации шторка не видна выше баннера (худший кадр ${worst.toFixed(1)} px)`);
  await p.waitForTimeout(400);
  const shown = await probe();
  check(shown.visH > 30 && Math.abs(shown.visTop - shown.bannerTop) <= 1 && shown.op > .95, `после анимации шторка целиком висит от верха баннера (${JSON.stringify(shown)})`);
  await p.screenshot({ path: path.join(__dirname, 'out', 'bannernotch-end.png'), clip: { x: box.x, y: 0, width: box.width, height: box.y + 120 } });
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
