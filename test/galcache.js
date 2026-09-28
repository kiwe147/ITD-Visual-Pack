// Галерея бережёт запросы: в «Популярном» картинок мало — подряд сама грузит не больше 4 страниц по 50 постов,
// дальше кнопка «Показать ещё»; перезагрузка страницы — плитки из кеша, без запросов; ответ 429 — пауза
// и один повтор, а не поток запросов. Страницы: по 50 постов, из них с картинкой только первый.
// Запуск:  node test/galcache.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const page = (n, next) => ({ data: { posts: Array.from({ length: 50 }, (_, i) => ({ id: `p${n}-${i}`, author: { username: 'a' },
  attachments: i ? [] : [{ type: 'image', url: `https://cdn.xn--d1ah4a.com/images/vpc-${n}.png`, width: 600, height: 600 }] })),
  pagination: { nextCursor: next } } });
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [], asked = [];
  let busy = 0;                                           // сколько следующих ответов — 429
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (u.pathname.includes('/images/vpc-')) return r.fulfill({ status: 404, body: '' });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.pathname === '/api/posts' && u.searchParams.get('tab')) {
      asked.push({ c: u.searchParams.get('cursor') || '-', lim: u.searchParams.get('limit'), at: Date.now() });
      if (busy > 0) { busy--; return r.fulfill({ status: 429, headers: { 'Retry-After': '1' }, body: '' }); }
      const n = +(u.searchParams.get('cursor') || 'c0').slice(1);
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify(page(n, 'c' + (n + 1))) });
    }
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  const start = async () => {
    await p.goto(ORIGIN + '/');
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    await p.$eval('.vp-gal-nav', a => a.click());
    await p.waitForTimeout(2500);
  };
  const state = () => p.evaluate(() => ({ tiles: document.querySelectorAll('.vp-gal-tile').length, more: (document.querySelector('.vp-gal-more') || {}).textContent }));

  // 1. картинок мало: сама — не больше 4 страниц, дальше кнопка
  await start();
  let s = await state();
  console.log(`—    запросов ${asked.length} (limit=${asked.map(a => a.lim).join(',')}), плиток ${s.tiles}, внизу «${s.more}»`);
  check(asked.length === 2, `одно обновление — 100 постов, 2 страницы (было: десятки подряд): ${asked.length}`);
  check(asked.length < 2 || asked[1].at - asked[0].at >= 650, `потоком: между запросами ${asked.length > 1 ? asked[1].at - asked[0].at : 0} мс`);
  check(asked.every(a => a.lim === '50'), 'по 50 постов за запрос');
  check(s.more === 'Показать ещё', 'дальше — кнопка «Показать ещё»');
  await p.$eval('.vp-gal-more', m => m.click());
  await p.waitForTimeout(2500);
  check(asked.length === 4, `«Показать ещё» — ещё 2 страницы: всего ${asked.length}`);

  // 2. перезагрузка страницы — из кеша, без запросов
  const before = (await state()).tiles, n0 = asked.length;
  await start();
  s = await state();
  console.log(`—    после перезагрузки: запросов ${asked.length - n0}, плиток ${s.tiles} (было ${before}), внизу «${s.more}»`);
  check(asked.length === n0, 'перезагрузка страницы — ни одного запроса ленты');
  check(s.tiles === before, 'плитки те же, из кеша');

  // 3. повторное нажатие на «Галерею» — заново с сервера; сайт отвечает 429 — пауза и повтор, без потока
  busy = 1;
  const n1 = asked.length;
  await p.$eval('.vp-gal-nav', a => a.click());
  await p.waitForTimeout(500);
  s = await state();
  check(asked.length === n1 + 1 && /подождать/.test(s.more), `429 — «${s.more}», повторов сразу нет (запросов ${asked.length - n1})`);
  await p.waitForTimeout(3000);
  const again = asked.slice(n1);
  const pause = again.length > 1 ? again[1].at - again[0].at : 0;
  check(again.length >= 2 && pause >= 900, `повтор через паузу ${pause} мс, потом загрузилось (плиток ${(await state()).tiles})`);
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
