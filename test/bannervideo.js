// Видео в баннере (3.4.0; 3.4.1 — углы как у картинки). Сайт показывает баннер картинкой, поэтому видео — для пользователей мода: кнопка в шторке баннера →
// файл → /api/files/upload → ссылка CDN в стиле профиля (ITDXL1 … v=<путь>). Хозяин и гости с модом видят видео поверх баннера,
// нажал ещё раз — видео убрано. Плюс: GIF/WebP баннером уходят на сайт как есть (не в JPEG) — проверка, оживёт ли у всех.
// Запуск:  node test/bannervideo.js снимок-своего-профиля.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8')
  .replace('function openText(content) {', 'window.__ot = c => openText(c); function openText(content) {');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const url = (snap.match(/"url": "([^"]+)"/) || [, ORIGIN + '/@NeuroSFW'])[1];
const VIDEO = process.env.VIDEO || 'C:/Code/ITD/ITD/video/itdx.mp4';
const VPATH = 'videos/0a1b2c3d-1111-4222-8333-444455556666.mp4';
const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const USERS = { NeuroSFW: { username: 'NeuroSFW', displayName: '#NeuroSFW | ИТД X', id: OWNER }, bob: { username: 'bob', displayName: 'Боб', id: '22222222-2222-4222-8222-222222222222' } };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const open = async (who, verified) => {
    const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
    p.errors = []; p.sent = []; p.uploads = []; p.put = [];
    p.on('pageerror', e => p.errors.push(e.message));
    p.on('dialog', d => d.accept());
    await p.route('**/*', async r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (u.hostname === 'cdn.xn--d1ah4a.com' && u.pathname === '/' + VPATH) return r.fulfill({ contentType: 'video/mp4', body: fs.readFileSync(VIDEO) });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me' && req.method() === 'GET') return r.fulfill({ contentType: 'application/json', body: JSON.stringify(USERS[who]) });
      if (u.pathname === '/api/users/me') { p.put.push(req.postData()); return r.fulfill({ contentType: 'application/json', body: '{}' }); }
      if (u.pathname === '/api/files/upload') {
        const body = req.postDataBuffer() || Buffer.alloc(0), gif = body.includes(Buffer.from('GIF89a'));
        p.uploads.push({ gif, name: (body.toString('latin1').match(/filename="([^"]*)"/) || [])[1] });
        const url = gif ? 'https://cdn.xn--d1ah4a.com/images/0a1b2c3d-1111-4222-8333-444455556667.gif' : 'https://cdn.xn--d1ah4a.com/' + VPATH;
        return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'f1', url }) });
      }
      if (/\/comments$/.test(u.pathname) && req.method() === 'GET' && who === 'NeuroSFW') return r.fulfill({ contentType: 'application/json', headers: { date: new Date().toUTCString() }, body: JSON.stringify({ data: { comments: p.sent.map((c, i) => ({ id: 'c' + i, author: USERS[who], content: c })).slice(-1), hasMore: false } }) });
      if (/\/comments$/.test(u.pathname) && req.method() === 'POST') { p.sent.push(JSON.parse(req.postData()).content); return r.fulfill({ status: 201, contentType: 'application/json', body: '{"data":{"id":"c1"}}' }); }
      if (/^\/api\/comments\//.test(u.pathname) && req.method() === 'PATCH') { p.sent.push(JSON.parse(req.postData()).content); return r.fulfill({ contentType: 'application/json', body: '{"data":{}}' }); }
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m, v]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, val) => { s[k] = val; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
      window.__gm = s;
      if (v) localStorage.setItem('itd_verified_users', JSON.stringify(v));
    }, [src.slice(0, src.indexOf('==/UserScript==')), verified || null]);
    await p.goto(url);
    await p.evaluate(() => document.querySelectorAll('.vp-banner-fx, .custom-image-btn, .custom-change-btn, .custom-cancel-btn, .custom-apply-btn, .vp-banner-video').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    return p;
  };

  let p = await open('NeuroSFW');
  const vb = await p.$('.vp-banner-vid');
  check(!!vb && /Видео в баннер/.test(await vb.getAttribute('title')), 'в шторке своего баннера есть кнопка «Видео в баннер»');
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.$eval('.vp-banner-vid', x => x.click())]);
  await fc.setFiles(VIDEO);
  const live = await p.waitForSelector('.vp-banner .vp-banner-video.vp-live', { timeout: 20000 }).then(() => true, () => false);
  const st = await p.evaluate(() => {
    const v = document.querySelector('.vp-banner-video'), img = document.querySelector('.vp-banner img[alt="Banner"]');
    const a = v.getBoundingClientRect(), c = img.getBoundingClientRect();
    return { rad: [getComputedStyle(img).borderRadius, getComputedStyle(v).borderRadius], gm: Object.entries(window.__gm).find(([k]) => k.startsWith('vp_banner_video')), src: v.src, muted: v.muted, loop: v.loop, dx: Math.abs(a.left - c.left) + Math.abs(a.width - c.width) + Math.abs(a.height - c.height) };
  });
  check(live && st.src.endsWith(VPATH) && st.muted && st.loop, `видео играет в баннере, без звука, по кругу (${st.src.slice(-50)})`);
  check(st.dx < 2, `видео ровно поверх картинки баннера (расхождение ${st.dx.toFixed(1)} px)`);
  check(st.gm && st.gm[1] === VPATH, 'путь видео сохранён по аккаунту');
  check(st.rad[0] === st.rad[1] && st.rad[0] !== '0px', `углы видео скруглены как у картинки (${st.rad.join(' / ')})`);
  await p.waitForTimeout(1500);
  const looks = await p.evaluate(sent => sent.map(c => window.__ot(c)).filter(t => /^ITDXL1 /.test(t)), p.sent);
  check(looks.some(t => t.includes(' v=' + VPATH)), `в стиль профиля ушло v=<видео> (${looks.slice(-1)[0] || 'ничего'})`);
  await p.evaluate(() => scrollTo(0, 80));
  await p.waitForTimeout(300);
  await p.mouse.move(700, 150);
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(__dirname, 'out', 'bannervideo-own.png'), clip: { x: 350, y: 0, width: 700, height: 330 } });
  const tf = await p.evaluate(() => [document.querySelector('.vp-banner img[alt="Banner"]').style.transform, document.querySelector('.vp-banner-video').style.transform]);
  check(tf[0] === tf[1], `при прокрутке видео двигается вместе с картинкой (${tf.join(' / ')})`);
  await p.$eval('.vp-banner-vid', x => x.click());
  await p.waitForTimeout(1500);
  const gone = await p.evaluate(() => !document.querySelector('.vp-banner-video'));
  const looks2 = await p.evaluate(sent => sent.map(c => window.__ot(c)).filter(t => /^ITDXL1 /.test(t)), p.sent);
  check(gone && !!looks2.length && !looks2[looks2.length - 1].includes(' v='), 'нажал ещё раз — видео убрано и из стиля тоже');
  await p.evaluate(() => scrollTo(0, 0));
  const pick = await p.$('.custom-image-btn');
  if (pick) {
    const [fc2] = await Promise.all([p.waitForEvent('filechooser'), p.$eval('.custom-image-btn', x => x.click())]);
    await fc2.setFiles({ name: 'anim.gif', mimeType: 'image/gif', buffer: GIF });
    await p.waitForTimeout(500);
    await p.$eval('.custom-apply-btn', x => x.click());
    await p.waitForTimeout(1500);
    const up = p.uploads.find(x => x.gif);
    check(!!up && up.name === 'anim.gif' && p.put.some(x => /bannerId/.test(x)), `GIF баннером ушёл на сайт как есть, не JPEG (${JSON.stringify(p.uploads)})`);
  } else check(false, 'кнопка смены баннера мода не найдена');
  const errs = p.errors;
  await p.close();

  const look = { n: 'white', b: '-', g: '11', v: VPATH };
  p = await open('bob', { NeuroSFW: { state: 'approved', id: OWNER, hasMod: true, code: 'x', look } });
  const guest = await p.waitForSelector('.vp-banner .vp-banner-video.vp-live', { timeout: 20000 }).then(() => true, () => false);
  check(guest, 'гость с модом видит видео в чужом баннере');
  check(!(await p.$('.vp-banner-vid')), 'у гостя кнопки видео нет');
  await p.screenshot({ path: path.join(__dirname, 'out', 'bannervideo-guest.png'), clip: { x: 350, y: 0, width: 700, height: 330 } });
  check(!errs.length && !p.errors.length, 'ошибок нет' + (errs.length + p.errors.length ? ': ' + [...errs, ...p.errors].join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
