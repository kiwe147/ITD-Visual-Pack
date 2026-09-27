// Галерея: цвет кнопок поверх картинки — по яркости под КАЖДОЙ кнопкой. Картинка: слева чёрная полоса,
// дальше белое (как «чёрный круг слева, светлый фон справа»): лайк на чёрном — светлый, коммент и репост
// на белом — тёмные (vp-ink). Картинку грузит «Tampermonkey» (заглушка GM_xmlhttpRequest через fetch).
// Запуск:  node test/galtone.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const posts = { data: { posts: [
  { id: 'split', author: { username: 'a' }, attachments: [{ type: 'image', url: 'https://cdn.xn--d1ah4a.com/images/vptone-split.png', width: 600, height: 800 }] },
  { id: 'white', author: { username: 'b' }, attachments: [{ type: 'image', url: 'https://cdn.xn--d1ah4a.com/images/vptone-white.png', width: 600, height: 600 }] },
  { id: 'black', author: { username: 'c' }, attachments: [{ type: 'image', url: 'https://cdn.xn--d1ah4a.com/images/vptone-black.png', width: 600, height: 600 }] }
], pagination: { nextCursor: null } } };
const svg = kind => kind === 'split'
  ? '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#fff"/><rect width="80" height="800" fill="#000"/></svg>'
  : `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="${kind === 'white' ? '#f4f4f4' : '#0a0a0a'}"/></svg>`;
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    const m = u.pathname.match(/vptone-(\w+)\.png$/);
    if (m) return r.fulfill({ contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(path.join(__dirname, 'out', `tone-${m[1]}.png`)) });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.pathname === '/api/posts') return r.fulfill({ contentType: 'application/json', body: JSON.stringify(posts) });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    // «Tampermonkey»: скачать как blob
    window.GM_xmlhttpRequest = o => { fetch(o.url).then(r => r.blob().then(bl => o.onload({ status: r.status, response: bl }))).catch(e => o.onerror && o.onerror(e)); };
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  await p.$eval('.vp-gal-nav', a => a.click());
  await p.waitForTimeout(2000);
  const tones = await p.evaluate(() => Object.fromEntries(['split', 'white', 'black'].map(id => {
    const row = document.querySelector(`.vp-gal-acts[data-post="${id}"]`);
    const img = row.closest('.vp-gal-tile').querySelector('img');
    return [id, { blob: img.src.startsWith('blob:'), acts: [...row.querySelectorAll('.vp-gal-act')].map(b => b.classList.contains('vp-ink') ? 'тёмн' : 'свет').join(',') }];
  })));
  console.log('—    ' + JSON.stringify(tones));
  check(tones.split.blob && tones.white.blob, 'картинки загружены через Tampermonkey (blob) — одна загрузка, пиксели читаются');
  check(tones.split.acts === 'свет,тёмн,тёмн', `чёрное слева, белое справа: лайк светлый, коммент и репост тёмные (${tones.split.acts})`);
  check(tones.white.acts === 'тёмн,тёмн,тёмн', `светлая картинка — все тёмные (${tones.white.acts})`);
  check(tones.black.acts === 'свет,свет,свет', `тёмная картинка — все светлые (${tones.black.acts})`);
  await p.screenshot({ path: path.join(__dirname, 'out', 'galtone.png'), clip: await p.$eval('.vp-gal-grid', g => { const r = g.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 500) }; }) });
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
