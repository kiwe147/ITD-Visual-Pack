// Галерея на телефоне: кнопки (лайк, комментарии, репост, копирование) стоят под картинкой и не закрывают её; на компьютере остаются поверх.
// Запуск:  node test/galbar.js снимок-ленты-телефон.html   (SHOT=путь.png — сохранить кадр)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const COL = ['#c0392b', '#27ae60', '#2980b9'];
const SIZES = [[600, 700], [600, 340], [600, 1000], [600, 600], [600, 800], [600, 450]];
const posts = SIZES.map(([w, h], i) => ({ id: 'p' + i, author: { username: 'a' }, isLiked: i === 1,
  attachments: (i % 2 ? [0] : [0, 1, 2]).map(k => ({ type: 'image', url: `https://cdn.xn--d1ah4a.com/images/vpph-${i}-${k}-${w}-${h}.png`, width: w, height: h })) }));
posts.push({ id: 'pv', author: { username: 'a' }, attachments: [{ type: 'video', url: 'https://cdn.xn--d1ah4a.com/videos/vpv.mp4', width: 600, height: 400, duration: 5 }] });
async function run(b, phone) {
  const ctx = await b.newContext(phone ? { viewport: { width: 392, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1300, height: 800 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    const m = u.pathname.match(/vpph-\d+-(\d)-(\d+)-(\d+)/);
    if (m) return r.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="${m[2]}" height="${m[3]}"><rect width="100%" height="100%" fill="${COL[+m[1]]}"/><text x="50%" y="40%" fill="#fff" font-size="60" text-anchor="middle">картинка</text></svg>` });
    if (t === 'image' || t === 'font') return r.abort();
    if (t === 'stylesheet') return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.pathname === '/api/posts') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts, pagination: { nextCursor: null } } }) });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => {
    document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob, .vp-itdx-btn, .vp-msgs, .vp-gal, .vp-gal-nav').forEach(e => e.remove());
    document.querySelectorAll('style').forEach(st => { if (/vp-msgs|vp-gal/.test(st.textContent)) st.remove(); });
    const st = document.createElement('style');
    st.textContent = '.vp-gal { left: 0 !important; right: 0 !important; top: 36px !important; bottom: 0 !important; z-index: 99999 !important }';
    document.head.appendChild(st);
  });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2000);
  if (phone) await p.evaluate(() => document.querySelector('.vp-gal-btn').click());
  else await p.evaluate(() => { const o = [...document.querySelectorAll('*')].find(e => e.classList && e.classList.contains('vp-gal-nav')); (o || document.querySelector('.vp-gal-btn') || {}).click && (o || document.querySelector('.vp-gal-btn')).click(); });
  await p.waitForSelector('.vp-gal-tile', { state: 'attached', timeout: 8000 }).catch(() => { });
  await p.waitForTimeout(1200);
  const info = await p.evaluate(() => [...document.querySelectorAll('.vp-gal-tile')].map(t => {
    const r = t.getBoundingClientRect(), s = t.querySelector('.vp-gal-strip').getBoundingClientRect(), bar = t.querySelector('.vp-gal-bar'), acts = [...t.querySelectorAll('.vp-gal-acts')].map(a => a.getBoundingClientRect());
    return { tileH: r.height, tileW: r.width, strip: [s.top - r.top, s.height], acts: acts.map(a => [a.top - r.top, a.height, a.width]), pos: getComputedStyle(t.querySelector('.vp-gal-acts')).position, video: !!t.querySelector('video'), bgx: !!bar && bar.classList.contains('vp-bgx'), bgImg: (t.querySelector('.vp-gal-bgx') || {}).style && t.querySelector('.vp-gal-bgx').style.backgroundImage, barDisp: bar && getComputedStyle(bar).display };
  }));
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT.replace('.png', phone ? '-phone.png' : '-desk.png') });
  await ctx.close();
  return { info, errors };
}
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const P = await run(b, true);
  check(P.info.length >= 4, 'на телефоне плитки есть: ' + P.info.length);
  check(P.info.every(t => t.pos !== 'absolute'), 'телефон: ряды кнопок не лежат поверх картинки');
  check(P.info.every(t => t.acts.every(a => a[0] >= t.strip[0] + t.strip[1] - 0.5)), 'телефон: кнопки целиком ниже картинки');
  check(P.info.every(t => t.tileH > t.strip[1] + 20), 'телефон: плитка выше картинки на высоту ряда кнопок');
  const imgs = P.info.filter(t => !t.video), vids = P.info.filter(t => t.video);
  check(imgs.length >= 4 && imgs.every(t => t.bgx && /url\(/.test(t.bgImg)), 'телефон: под кнопками картинок растянут кусок низа картинки (' + imgs.filter(t => t.bgx).length + ' из ' + imgs.length + ')');
  check(vids.length >= 1 && vids.every(t => !t.bgx && !t.bgImg), 'телефон: у видео подложки из картинки нет (' + vids.length + ')');
  if (process.env.DBG) console.log(JSON.stringify(P.info));
  check(P.errors.length === 0, 'телефон: нет ошибок страницы ' + P.errors.join('|'));
  const D = await run(b, false);
  if (D.info.length) {
    check(D.info.every(t => t.pos === 'absolute'), 'компьютер: кнопки по-прежнему поверх картинки');
    check(D.info.every(t => Math.abs(t.tileH - t.strip[1]) < 1), 'компьютер: плитка равна картинке');
  } else console.log('—    на компьютере плиток нет (кнопка галереи в этом снимке недоступна), проверка пропущена');
  check(D.errors.length === 0, 'компьютер: нет ошибок страницы ' + D.errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
