// Картинки постов в ленте: пока грузится — заготовка (vp-media-wait: мерцание и кольцо), загрузилась — без неё;
// не загрузилась — vp-media-fail (значок и «нажми»), нажатие — загрузить заново, пост не открывается.
// Картинки снимка: первая отдаёт 404 (пока не нажали), вторая грузится 6 с, остальные сразу.
// Запуск:  node test/mediawait.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const png = fs.readFileSync(path.join(__dirname, 'out', 'tone-white.png'));
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const urls = [...new Set([...snap.matchAll(/<img src="(https:\/\/cdn\.xn--d1ah4a\.com\/images\/[^"]+)"[^>]*data-post-media-image/g)].map(m => m[1]))];
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [], asked = {};
  let broken = true;
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', async r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (u.pathname.startsWith('/images/')) {
      asked[u.href] = (asked[u.href] || 0) + 1;
      if (u.href === urls[0] && broken) return r.fulfill({ status: 404, body: '' });
      if (u.href === urls[1]) await new Promise(res => setTimeout(res, 6000));
      return r.fulfill({ contentType: 'image/png', body: png });
    }
    if (['stylesheet', 'font'].includes(t)) return r.continue();
    if (t === 'image') return r.fulfill({ status: 404, body: '' });
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/', { waitUntil: 'commit' });
  await p.addScriptTag({ content: src });                     // мод — пока картинки ещё грузятся
  // ленивые картинки ждут стилей страницы — ждём, пока обычная загрузится (медленная грузится 6 с)
  // картинки далеко внизу — прокручиваем к каждой, как живой человек (ленивые грузятся у экрана)
  for (const u of urls) { await p.evaluate(u => [...document.querySelectorAll('img[data-post-media-image]')].find(i => i.src === u).scrollIntoView({ block: 'center' }), u); await p.waitForTimeout(300); }
  await p.waitForFunction(u => { const i = [...document.querySelectorAll('img[data-post-media-image]')].find(i => i.src === u); return i && i.complete && i.naturalWidth; }, urls[2], { timeout: 20000 });
  await p.waitForTimeout(200);
  const box = u => p.evaluate(u => { const i = [...document.querySelectorAll('img[data-post-media-image]')].find(i => i.src === u); return i ? i.parentElement.className : 'нет'; }, u);
  const slow1 = await box(urls[1]);
  const bad = await box(urls[0]);
  const fine = await box(urls[2]);
  console.log(`—    картинок постов в снимке: ${urls.length}; битая: «${bad}», медленная: «${slow1}», обычная: «${fine}»`);
  check(/vp-media-fail/.test(bad), 'не загрузилась — значок «нажми» (vp-media-fail)');
  check(/vp-media-wait/.test(slow1), 'грузится — заготовка (vp-media-wait)');
  check(!/vp-media-(wait|fail)/.test(fine), 'загрузилась — без заготовки');
  await p.evaluate(u => [...document.querySelectorAll('img[data-post-media-image]')].find(i => i.src === u).scrollIntoView({ block: 'center' }), urls[0]);
  await p.screenshot({ path: path.join(__dirname, 'out', 'mediawait.png') });
  await p.waitForTimeout(6000);
  check(!/vp-media-(wait|fail)/.test(await box(urls[1])), 'медленная догрузилась — заготовка ушла');
  // нажали по битой — грузится заново, пост не открылся
  broken = false;
  const url0 = p.url();
  await p.evaluate(u => [...document.querySelectorAll('img[data-post-media-image]')].find(i => i.src === u).parentElement.click(), urls[0]);
  await p.waitForTimeout(800);
  check(asked[urls[0]] >= 2 && !/vp-media-(wait|fail)/.test(await box(urls[0])), `нажатие — загрузилась заново (запросов ${asked[urls[0]]})`);
  check(p.url() === url0 && !(await p.$('.vp-lightbox, [role="dialog"]')), 'пост и просмотр картинки не открылись');
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
