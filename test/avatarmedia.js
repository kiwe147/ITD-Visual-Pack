// Аватарка гифкой и видео (3.7.5.2): GIF уходит как есть (до 3 МБ), видео (до 5 МБ) — кадр-заставка картинкой + само видео; слишком большое отклоняется; стиль профиля записывает a= и va=; у других с модом поверх аватарки играет видео.
// Запуск:  node test/avatarmedia.js снимок-своего-профиля.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const dir = 'C:/Code/ITD/promo/glbuild/';
const gif = fs.readFileSync(dir + 'ava_test.gif'), webm = fs.readFileSync(dir + 'ava_test.webm');
const big = Buffer.alloc(6 * 1024 * 1024, 1);
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8')
  .replace('function openText(content) {', 'window.__ot = c => openText(c); function openText(content) {');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const U = { gif: '21111111-2222-4333-8444-555555555555', still: '31111111-2222-4333-8444-555555555555', vid: '41111111-2222-4333-8444-555555555555' };
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage();
  const errors = [], uploads = [], posted = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', async r => {
    const req = r.request(), u = new URL(req.url()), t = req.resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/files/upload') {
      const body = (req.postDataBuffer() || Buffer.alloc(0)), txt = body.toString('latin1', 0, 600);
      const isGif = body.includes(Buffer.from('GIF89a')), isVid = /video\//.test(txt) || /\.webm/.test(txt) || body.includes(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
      uploads.push(isVid ? 'video' : isGif ? 'gif' : 'image');
      const url = isVid ? 'https://cdn.xn--d1ah4a.com/videos/' + U.vid + '.webm' : isGif ? 'https://cdn.xn--d1ah4a.com/images/' + U.gif + '.gif' : 'https://cdn.xn--d1ah4a.com/images/' + U.still + '.jpg';
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { url } }) });
    }
    if (/\/comments$/.test(u.pathname) && req.method() === 'POST') { posted.push(JSON.parse(req.postData()).content); return r.fulfill({ status: 201, contentType: 'application/json', body: '{"data":{"id":"c1"}}' }); }
    if (u.pathname === '/api/users/me' && req.method() === 'GET') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: 'NeuroSFW', id: OWNER }) });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, [src.slice(0, src.indexOf('==/UserScript=='))]);
  await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
  await p.goto(ORIGIN + '/@NeuroSFW');
  await p.waitForTimeout(2500);
  const openEd = async () => {
    const spot = await p.evaluate(() => { const av = document.querySelector('.vp-avatar.vp-ava-edit'); const r = av.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await p.mouse.click(spot.x, spot.y); await p.waitForTimeout(400);
  };
  const msg = () => p.evaluate(() => document.querySelector('.vp-ave-msg').textContent);
  const lastLook = async () => { const t = await Promise.all(posted.map(c => p.evaluate(x => window.__ot(x), c))); return t.filter(x => /^ITDXL1 /.test(x)).pop() || ''; };

  await openEd();
  await p.setInputFiles('.vp-ave input[type=file]', { name: 'big.webm', mimeType: 'video/webm', buffer: big });
  await p.waitForTimeout(400);
  check(/Видео больше 5 МБ/.test(await msg()) && await p.evaluate(() => document.querySelector('.vp-ave-ok').disabled), 'видео больше 5 МБ отклонено: ' + await msg());
  await p.setInputFiles('.vp-ave input[type=file]', { name: 'big.gif', mimeType: 'image/gif', buffer: Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(4 * 1024 * 1024, 1)]) });
  await p.waitForTimeout(400);
  check(/GIF больше 3 МБ/.test(await msg()), 'GIF больше 3 МБ отклонён: ' + await msg());

  await p.setInputFiles('.vp-ave input[type=file]', { name: 'a.gif', mimeType: 'image/gif', buffer: gif });
  await p.waitForTimeout(700);
  check(await p.evaluate(() => !document.querySelector('.vp-ave-ok').disabled && document.querySelector('.vp-ave-zoom input').disabled), 'GIF выбран: «Применить» доступно, масштаб выключен');
  await p.click('.vp-ave-ok'); await p.waitForTimeout(3500);
  let look = await lastLook();
  check(uploads.includes('gif') && look.includes(' a=3' + U.gif.replace(/-/g, '')) && !look.includes(' va='), 'GIF ушёл как есть, в стиле профиля a=3… без va: ' + look.slice(0, 140));
  check(await p.evaluate(() => !document.querySelector('.vp-ave')), 'редактор закрылся');

  uploads.length = 0;
  await openEd();
  await p.setInputFiles('.vp-ave input[type=file]', { name: 'a.webm', mimeType: 'video/webm', buffer: webm });
  await p.waitForTimeout(2500);
  const vmsg = await msg(), canApply = await p.evaluate(() => !document.querySelector('.vp-ave-ok').disabled);
  if (!canApply) console.log('—    видео не открылось в этом браузере (' + vmsg + '), проверка видео пропущена');
  else {
    await p.click('.vp-ave-ok'); await p.waitForTimeout(3500);
    look = await lastLook();
    check(uploads.includes('video') && uploads.includes('image') && look.includes(' a=1' + U.still.replace(/-/g, '')) && look.includes(' va=videos/' + U.vid + '.webm'), 'видео: заставка картинкой + видео, в стиле профиля a= и va=: ' + look.slice(0, 200));
    const vid = await p.evaluate(() => [...document.querySelectorAll('.vp-avatar > .vp-ava-vid')].map(v => v.getAttribute('src')));
    check(vid.length > 0 && vid.every(s => /videos\/4111/.test(s)), 'поверх большой ава проигрывается видео (' + vid.length + ')');
    const smallVid = await p.evaluate(() => [...document.querySelectorAll('.vp-avatar > .vp-ava-vid')].filter(v => v.parentElement.getBoundingClientRect().width < 60).length);
    check(smallVid === 0, 'на маленьких авах видео нет, только заставка');
  }
  check(!errors.length, 'ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
