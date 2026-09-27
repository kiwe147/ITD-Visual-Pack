// Галерея: первая страница дала мало картинок (не заполнили экран) — следующая грузится сама, без прокрутки;
// экран заполнился с запасом — лишнего не грузим. Страницы: 7 постов с картинками, дальше по 20.
// Запуск:  node test/galfill.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const page = (n, from, next) => ({ data: { posts: Array.from({ length: n }, (_, i) => ({ id: 'p' + (from + i), author: { username: 'a' },
  attachments: [{ type: 'image', url: `https://cdn.xn--d1ah4a.com/images/vpfill-${from + i}.png`, width: 600, height: 600 + (i % 3) * 200 }] })),
  pagination: { nextCursor: next } } });
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [], asked = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (u.pathname.includes('/images/vpfill-')) return r.fulfill({ status: 404, body: '' });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.pathname === '/api/posts') {
      const c = u.searchParams.get('cursor') || '';
      asked.push(c || 'первая');
      const n = c ? +c.slice(1) : 0;
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify(n ? page(20, 7 + (n - 1) * 20, 'c' + (n + 1)) : page(7, 0, 'c1')) });
    }
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  await p.$eval('.vp-gal-nav', a => a.click());
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => { const bd = document.querySelector('.vp-gal-body'); return { tiles: document.querySelectorAll('.vp-gal-tile').length, gapBelow: Math.round(bd.scrollHeight - bd.scrollTop - bd.clientHeight) }; });
  console.log(`—    запросы: ${asked.join(', ')}; плиток ${r.tiles}; ниже экрана ${r.gapBelow} px`);
  check(asked.length >= 2 && r.tiles > 7, 'первая страница не заполнила экран — следующая догрузилась сама, без прокрутки');
  check(r.gapBelow >= 1200 - 1, 'экран заполнен с запасом (ниже экрана ≥ 1200 px)');
  check(asked.length <= 3, `лишнего не грузим: запросов ${asked.length}`);
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
