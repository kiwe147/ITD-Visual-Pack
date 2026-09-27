// Галерея: кнопки лайк/коммент/репост — всегда белые на тёмной подложке, на любой картинке (слева чёрная
// полоса и белое, белая, чёрная). Картинку грузит «Tampermonkey» (заглушка GM_xmlhttpRequest через fetch).
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
    window.__copied = []; Object.defineProperty(navigator, 'clipboard', { value: { writeText: t => { window.__copied.push(t); return Promise.resolve(); } } });
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  await p.$eval('.vp-gal-nav', a => a.click());
  await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelectorAll('.vp-gal-acts').forEach(r => r.style.opacity = 1));
  const tones = await p.evaluate(() => Object.fromEntries(['split', 'white', 'black'].map(id => {
    const row = document.querySelector(`.vp-gal-acts[data-post="${id}"]`);
    const img = row.closest('.vp-gal-tile').querySelector('img');
    const white = b => getComputedStyle(b).color === 'rgb(255, 255, 255)';
    return [id, { blob: img.src.startsWith('blob:'), bg: getComputedStyle(row).backgroundColor, acts: [...row.querySelectorAll('.vp-gal-act')].map(b => white(b) ? 'свет' : 'тёмн').join(',') }];
  })));
  console.log('—    ' + JSON.stringify(tones));
  check(tones.split.blob && tones.white.blob, 'картинки загружены через Tampermonkey (blob) — одна загрузка, пиксели читаются');
  for (const id of ['split', 'white', 'black']) {
    check(tones[id].acts === 'свет,свет,свет', `${id}: кнопки белые (${tones[id].acts})`);
    check(/rgba\(0, 0, 0, 0\.4/.test(tones[id].bg), `${id}: под кнопками тёмная подложка (${tones[id].bg})`);
  }
  // лайк мышью и увели мышь — таблетка прячется (раньше оставалась: кнопка держала фокус)
  await p.evaluate(() => document.querySelectorAll('.vp-gal-acts').forEach(r => r.style.opacity = ''));
  await p.route('**/api/posts/*/like', r => r.fulfill({ contentType: 'application/json', body: '{}' }));
  await p.hover('.vp-gal-acts[data-post="white"]');
  await p.click('.vp-gal-acts[data-post="white"] .vp-gal-act[data-act="like"]');
  await p.mouse.move(5, 5);
  await p.waitForTimeout(400);
  const hid = await p.$eval('.vp-gal-acts[data-post="white"]', r => getComputedStyle(r).opacity);
  check(hid === '0', `после лайка и ухода мыши таблетка спрятана (opacity ${hid})`);
  // то же у репоста (с окном «Сделать репост?» — соглашаемся)
  await p.route('**/api/posts/*/repost', r => r.fulfill({ contentType: 'application/json', body: '{}' }));
  p.once('dialog', d => d.accept());
  await p.hover('.vp-gal-acts[data-post="black"]');
  await p.click('.vp-gal-acts[data-post="black"] .vp-gal-act[data-act="repost"]');
  await p.mouse.move(5, 5);
  await p.waitForTimeout(400);
  const rep = await p.$eval('.vp-gal-acts[data-post="black"]', r => [getComputedStyle(r).opacity, r.querySelector('[data-act="repost"]').classList.contains('vp-on')]);
  check(rep[1] && rep[0] === '0', `после репоста и ухода мыши таблетка спрятана (репост ${rep[1] ? 'есть' : 'нет'}, opacity ${rep[0]})`);
  // справа внизу — «Скопировать ссылку»: в буфер ссылка на пост, на кнопке галочка, пост не открылся
  const url0 = p.url();
  await p.$eval('.vp-gal-acts[data-post="split"] ~ .vp-gal-acts-r .vp-gal-act[data-act="link"]', b => b.click());
  await p.waitForTimeout(200);
  const cp = await p.evaluate(() => ({ copied: window.__copied, done: document.querySelector('.vp-gal-acts[data-post="split"] ~ .vp-gal-acts-r .vp-gal-act').title }));
  check(cp.copied.length === 1 && /\/@a\/post\/split$/.test(cp.copied[0]), `ссылка скопирована: ${cp.copied.join(', ')}`);
  check(cp.done === 'Ссылка скопирована', 'на кнопке отметка «скопировано»');
  check(p.url() === url0 && await p.$('.vp-gal-grid'), 'нажатие не открыло пост');
  await p.screenshot({ path: path.join(__dirname, 'out', 'galtone.png'), clip: await p.$eval('.vp-gal-grid', g => { const r = g.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 500) }; }) });
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
