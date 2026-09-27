// Галерея: кнопки поверх картинок — белые на тёмной подложке на любой картинке; картинки — обычной ссылкой
// сайта (правой кнопкой копируются); «Скопировать картинку» (через «Tampermonkey» — заглушка GM_xmlhttpRequest
// через fetch) и «Скопировать ссылку»; заготовка «грузится» / «не загрузилась»; листание мышью.
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
  { id: 'black', author: { username: 'c' }, attachments: [{ type: 'image', url: 'https://cdn.xn--d1ah4a.com/images/vptone-black.png', width: 600, height: 600 }] },
  { id: 'multi', author: { username: 'd' }, attachments: ['white', 'black', 'split'].map(k => ({ type: 'image', url: `https://cdn.xn--d1ah4a.com/images/vptone-${k}.png`, width: 600, height: 600 })) },
  { id: 'broken', author: { username: 'e' }, attachments: [{ type: 'image', url: 'https://cdn.xn--d1ah4a.com/images/vpbroken.png', width: 600, height: 600 }] }
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
    if (u.pathname.endsWith('/vpbroken.png')) return r.fulfill({ status: 404, body: '' });
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
    window.__copied = [];
    Object.defineProperty(navigator, 'clipboard', { value: {
      writeText: t => { window.__copied.push(t); return Promise.resolve(); },
      write: async items => { const b = await items[0].getType('image/png'); window.__copied.push('картинка ' + b.type + ' ' + b.size); }
    } });
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
    return [id, { site: img.src.startsWith('https://cdn.'), bg: getComputedStyle(row).backgroundColor, acts: [...row.querySelectorAll('.vp-gal-act')].map(b => white(b) ? 'свет' : 'тёмн').join(',') }];
  })));
  console.log('—    ' + JSON.stringify(tones));
  check(tones.split.site && tones.white.site, 'картинки — обычной ссылкой сайта (копирование правой кнопкой работает сразу)');
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
  // правая кнопка — у картинки снова обычная ссылка сайта (копирование и «Сохранить как» из меню браузера)
  const box = await p.$eval('.vp-gal-acts[data-post="white"]', r => { const b = r.closest('.vp-gal-tile').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + 30 }; });
  await p.mouse.move(box.x, box.y); await p.mouse.down({ button: 'right' }); await p.mouse.up({ button: 'right' });
  const rsrc = await p.$eval('.vp-gal-acts[data-post="white"]', r => r.closest('.vp-gal-tile').querySelector('img').src);
  check(/^https:\/\/cdn\./.test(rsrc), `после правой кнопки у картинки ссылка сайта (${rsrc.slice(0, 50)})`);
  // «Скопировать картинку»: в буфер — PNG текущей картинки
  await p.$eval('.vp-gal-acts[data-post="white"] ~ .vp-gal-acts-r .vp-gal-act[data-act="copy"]', b => b.click());
  await p.waitForTimeout(800);
  const img = await p.evaluate(() => ({ copied: window.__copied.splice(0), title: document.querySelector('.vp-gal-acts[data-post="white"] ~ .vp-gal-acts-r .vp-gal-act[data-act="copy"]').title }));
  check(img.copied.length === 1 && /^картинка image\/png [1-9]/.test(img.copied[0]) && img.title === 'Скопировано', `картинка скопирована в буфер: ${img.copied.join(', ')} (${img.title})`);
  // заготовки: битая картинка — значок и повтор по нажатию (пост не открывается); загруженные — без заготовки
  const slides = await p.evaluate(() => ({ broken: document.querySelector('.vp-gal-acts[data-post="broken"]').closest('.vp-gal-tile').querySelector('.vp-gal-slide').className,
    white: document.querySelector('.vp-gal-acts[data-post="white"]').closest('.vp-gal-tile').querySelector('.vp-gal-slide').className }));
  check(/vp-fail/.test(slides.broken) && !/vp-wait|vp-fail/.test(slides.white), `заготовки: битая — «${slides.broken}», загруженная — «${slides.white}»`);
  await p.$eval('.vp-gal-acts[data-post="broken"]', r => r.closest('.vp-gal-tile').querySelector('.vp-gal-slide').click());
  check(await p.$('.vp-gal-grid') && /\/$/.test(new URL(p.url()).pathname), 'нажатие по битой — повтор загрузки, пост не открылся');
  // листание мышью: потянул влево — вторая картинка, пост не открылся
  const mb = await p.$eval('.vp-gal-acts[data-post="multi"]', r => { const b = r.closest('.vp-gal-tile').getBoundingClientRect(); return { x: b.x + b.width * .7, y: b.y + b.height / 2 }; });
  await p.mouse.move(mb.x, mb.y); await p.mouse.down();
  for (let k = 1; k <= 6; k++) await p.mouse.move(mb.x - k * 20, mb.y);
  await p.mouse.up(); await p.waitForTimeout(700);
  const cnt = await p.$eval('.vp-gal-acts[data-post="multi"]', r => r.closest('.vp-gal-tile').querySelector('.vp-gal-count').textContent);
  check(cnt === '2/3' && await p.$('.vp-gal-grid'), `потянул мышью — листнулось (${cnt}), пост не открылся`);
  // ушли в пост со 2-й картинки и вернулись «назад» — плитка на той же картинке (раньше прокрутка сбрасывалась на 1-ю,
  // а счётчик и стрелки оставались от 2-й)
  await p.$eval('.vp-gal-acts[data-post="multi"]', r => r.closest('.vp-gal-tile').click());
  await p.waitForTimeout(500);
  const inPost = new URL(p.url()).pathname;
  // в посте лайкнули кнопкой сайта (его запрос) — после «назад» лайк виден на плитке
  const liked = await p.evaluate(() => fetch('/api/posts/multi/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(r => r.ok));
  await p.goBack(); await p.waitForTimeout(900);
  const likeOn = await p.$eval('.vp-gal-acts[data-post="multi"] .vp-gal-act[data-act="like"]', b => b.classList.contains('vp-on'));
  check(liked && likeOn, 'лайк, поставленный в посте, виден на плитке галереи');
  const back = await p.$eval('.vp-gal-acts[data-post="multi"]', r => { const t = r.closest('.vp-gal-tile'), st = t.querySelector('.vp-gal-strip');
    return { cnt: t.querySelector('.vp-gal-count').textContent, at: Math.round(st.scrollLeft / st.clientWidth) + 1 }; });
  check(/\/post\/multi$/.test(inPost) && back.cnt === '2/3' && back.at === 2, `назад из поста: плитка на 2-й картинке (счётчик ${back.cnt}, на экране ${back.at}-я)`);
  // первая картинка: у левого края — невидимая стрелка ловит нажатие, пост не открывается
  await p.$eval('.vp-gal-acts[data-post="multi"]', r => { const st = r.closest('.vp-gal-tile').querySelector('.vp-gal-strip'); st.scrollLeft = 0; });
  await p.waitForTimeout(300);
  const edge = await p.$eval('.vp-gal-acts[data-post="multi"]', r => { const a = r.closest('.vp-gal-tile').querySelector('.vp-gal-arrow.vp-prev'), b = a.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, edge: a.classList.contains('vp-edge'), op: getComputedStyle(a).opacity }; });
  await p.mouse.click(edge.x, edge.y); await p.waitForTimeout(400);
  check(edge.edge && edge.op === '0' && await p.$('.vp-gal-grid') && !/\/post\//.test(p.url()), `нажатие у края первой картинки — пост не открылся (стрелка невидима: ${edge.op})`);
  // справа внизу — «Скопировать ссылку»: в буфер ссылка на пост, на кнопке галочка, пост не открылся
  const url0 = p.url();
  await p.$eval('.vp-gal-acts[data-post="split"] ~ .vp-gal-acts-r .vp-gal-act[data-act="link"]', b => b.click());
  await p.waitForTimeout(200);
  const cp = await p.evaluate(() => ({ copied: window.__copied, done: document.querySelector('.vp-gal-acts[data-post="split"] ~ .vp-gal-acts-r .vp-gal-act[data-act="link"]').title }));
  check(cp.copied.length === 1 && /\/@a\/post\/split$/.test(cp.copied[0]), `ссылка скопирована: ${cp.copied.join(', ')}`);
  check(cp.done === 'Скопировано', 'на кнопке отметка «скопировано»');
  check(p.url() === url0 && await p.$('.vp-gal-grid'), 'нажатие не открыло пост');
  await p.screenshot({ path: path.join(__dirname, 'out', 'galtone.png'), clip: await p.$eval('.vp-gal-grid', g => { const r = g.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 500) }; }) });
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
