// Галерея: у поста несколько картинок — плиток несколько, а лайк и репост у поста один. Лайк с любой
// плитки меняет все плитки поста, запрос — один; второе нажатие (с другой плитки) — снять лайк.
// Запуск:  node test/galacts.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const img = (h, hue) => ({ type: 'image', url: `https://cdn.xn--d1ah4a.com/images/vptest-400-${h}-${hue}.svg`, width: 400, height: h });
const posts = { data: { posts: [
  { id: 'multi', author: { username: 'artist' }, isLiked: false, attachments: [img(600, 10), img(500, 120), img(700, 240)] },
  { id: 'single', author: { username: 'other' }, isLiked: true, attachments: [img(400, 300)] }
], pagination: { nextCursor: null } } };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [], reqs = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (u.pathname.includes('/images/vptest-')) {
      const [w, h, hue] = u.pathname.split('vptest-').pop().replace('.svg', '').split('-').map(Number);
      return r.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="hsl(${hue},60%,45%)"/></svg>` });
    }
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.pathname === '/api/posts') return r.fulfill({ contentType: 'application/json', body: JSON.stringify(posts) });
    if (/\/like$|\/repost$/.test(u.pathname)) { reqs.push(r.request().method() + ' ' + u.pathname); return r.fulfill({ contentType: 'application/json', body: '{}' }); }
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    window.confirm = () => true;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  await p.$eval('.vp-gal-nav', a => a.click());
  await p.waitForTimeout(1000);
  // одна плитка на пост; картинки листаются внутри: счётчик, стрелка, точки
  const multi = await p.$$eval('.vp-gal-acts[data-post="multi"]', r => r.length);
  const c0 = await p.$eval('.vp-gal-acts[data-post="multi"]', r => r.parentElement.querySelector('.vp-gal-count').textContent);
  await p.hover('.vp-gal-tile.vp-multi');
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(__dirname, 'out', 'galmulti-pc.png'), clip: await (await p.$('.vp-gal-tile.vp-multi')).boundingBox() });
  await p.click('.vp-gal-tile.vp-multi .vp-gal-arrow.vp-next');
  await p.waitForTimeout(700);
  const c1 = await p.$eval('.vp-gal-tile.vp-multi .vp-gal-count', c => c.textContent);
  await p.screenshot({ path: path.join(__dirname, 'out', 'galmulti-pc-2.png'), clip: await (await p.$('.vp-gal-tile.vp-multi')).boundingBox() });
  check(multi === 1 && c0 === '1/3' && c1 === '2/3' && (await p.evaluate(() => !!document.querySelector('.vp-gal'))), `пост с тремя картинками — одна плитка (${multi}), ${c0} → стрелка → ${c1}, галерея не закрылась`);
  await p.screenshot({ path: path.join(__dirname, 'out', 'galmulti-pc-page.png') });
  const likes = () => p.$$eval('.vp-gal-acts[data-post="multi"] .vp-gal-act[data-act="like"]', bs => bs.map(b => b.classList.contains('vp-on') ? '♥' : '♡').join(''));
  check((await likes()) === '♡', `лайка нет (${await likes()})`);
  await p.$$eval('.vp-gal-acts[data-post="multi"] .vp-gal-act[data-act="like"]', bs => bs[0].click());
  await p.waitForTimeout(500);
  check((await likes()) === '♥' && reqs.join() === 'POST /api/posts/multi/like', `лайк — залит, запрос один (${await likes()}; ${reqs.join(', ')})`);
  await p.$$eval('.vp-gal-acts[data-post="multi"] .vp-gal-act[data-act="like"]', bs => bs[0].click());
  await p.waitForTimeout(500);
  check((await likes()) === '♡' && reqs[1] === 'DELETE /api/posts/multi/like', `второе нажатие — лайк снят (${await likes()}; ${reqs[1]})`);
  const single = await p.$eval('.vp-gal-acts[data-post="single"] .vp-gal-act[data-act="like"]', b => b.classList.contains('vp-on'));
  check(single, 'у другого поста своё состояние (лайкнут с сервера)');
  await p.$$eval('.vp-gal-acts[data-post="multi"] .vp-gal-act[data-act="repost"]', bs => bs[0].click());
  await p.waitForTimeout(500);
  const rp = await p.$$eval('.vp-gal-acts[data-post="multi"] .vp-gal-act[data-act="repost"]', bs => bs.map(b => b.classList.contains('vp-on') ? 'R' : '-').join(''));
  check(rp === 'R' && reqs[2] === 'POST /api/posts/multi/repost', `репост (${rp}; ${reqs[2]})`);
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
