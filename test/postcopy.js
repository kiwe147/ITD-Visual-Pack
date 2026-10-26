// Быстрые кнопки поста («скопировать ссылку», у постов с картинкой ещё «скопировать картинку») есть у любого поста: и без картинки, и без текста (только видео),
// даже когда мод не знает пост по ответам сайта: номер поста берётся из атрибута data-alice-water-anchor-id самой карточки.
// Запуск:  node test/postcopy.js снимок-ленты.html
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
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (t === 'image' || t === 'font') return r.abort();
    if (t === 'stylesheet') return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
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
  await p.evaluate(() => { document.querySelectorAll('.vp-post-tools').forEach(e => e.remove()); });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  const first = await p.evaluate(() => {
    const arts = [...document.querySelectorAll('article[data-alice-water-anchor-kind="post"]')];
    return { posts: arts.length, withLink: arts.filter(a => a.querySelector(':scope > .vp-post-tools [data-act="link"]')).length };
  });
  check(first.posts >= 3 && first.withLink === first.posts, 'у каждого поста есть кнопка «скопировать ссылку» (' + first.withLink + ' из ' + first.posts + ')');
  await p.evaluate(() => {
    const a = document.querySelector('article[data-alice-water-anchor-kind="post"]');
    const c = a.cloneNode(true);
    c.querySelectorAll('.vp-post-tools, .itd-blur-container').forEach(e => e.remove());
    c.removeAttribute('data-blur-bg'); c.classList.remove('itd-blur-active');
    c.setAttribute('data-alice-water-anchor-id', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
    c.id = 'onlyvideo';
    c.querySelectorAll('img[data-post-media-image], [data-post-media-image]').forEach(e => e.remove());
    c.querySelectorAll('.' + (window.__postTextClass || 'vp-post-text')).forEach(e => e.remove());
    const v = document.createElement('video'); v.src = 'blob:x'; c.appendChild(v);
    a.parentElement.appendChild(c);
  });
  await p.waitForTimeout(1500);
  const clone = await p.evaluate(() => {
    const c = document.getElementById('onlyvideo');
    const btn = c && c.querySelector(':scope > .vp-post-tools [data-act="link"]');
    return { has: !!btn, copyImg: !!(c && c.querySelector(':scope > .vp-post-tools [data-act="copy"]')) };
  });
  check(clone.has, 'у поста без картинки и без текста (только видео) есть «скопировать ссылку»');
  check(clone.copyImg === false, 'у поста без картинки нет кнопки «скопировать картинку»');
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
