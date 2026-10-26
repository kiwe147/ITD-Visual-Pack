// Удержание места в виртуальном списке: если пост выше видимого вырос (сайт пересчитал высоты), а пользователь не прокручивал,
// мод сам сдвигает прокрутку на ту же величину, и видимый пост остаётся на месте. Сдвиг ниже видимого поста ничего не меняет.
// Запуск:  node test/listhold.js снимок-профиля-с-верха-списка.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1500, height: 900 } })).newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (t === 'image') return r.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#556"/></svg>' });
    if (t === 'font') return r.abort();
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
  await p.goto(ORIGIN + '/@NeuroSFW');
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  const slots = () => [...document.querySelectorAll('.vp-post-slot')].filter(s => !s.closest('article'));
  const info = await p.evaluate(() => { const l = [...document.querySelectorAll('.vp-post-slot')].filter(s => !s.closest('article')); return { n: l.length, tops: l.map(s => Math.round(s.getBoundingClientRect().top + scrollY)) }; });
  console.log('—    слотов: ' + info.n + ', верхи: ' + info.tops.join(' '));
  check(info.n >= 4, 'в снимке достаточно постов для проверки');
  // прокрутка так, чтобы первым видимым был третий пост
  const y = info.tops[2] + 100;
  await p.evaluate(yy => scrollTo(0, yy), y);
  await p.waitForTimeout(500);
  const shift = (from, d) => p.evaluate(({ from, d }) => {
    const l = [...document.querySelectorAll('.vp-post-slot')].filter(s => !s.closest('article'));
    l.slice(from).forEach(s => { const m = s.style.transform.match(/translateY\((-?[\d.]+)/); s.style.transform = 'translateY(' + (parseFloat(m[1]) + d) + 'px)'; });
    return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(scrollY))));
  }, { from, d });
  const topOf = () => p.evaluate(() => { const l = [...document.querySelectorAll('.vp-post-slot')].filter(s => !s.closest('article')); const s = l[2]; return Math.round(s.getBoundingClientRect().top); });
  const t0 = await topOf(), y0 = await p.evaluate(() => scrollY);
  const y1 = await shift(1, 120);
  const t1 = await topOf();
  check(Math.abs(y1 - (y0 + 120)) <= 1, 'пост выше вырос на 120: прокрутка сдвинулась на 120 (' + y0 + ' -> ' + y1 + ')');
  check(Math.abs(t1 - t0) <= 1, 'видимый пост остался на месте на экране (' + t0 + ' -> ' + t1 + ')');
  const y2 = await shift(3, 90);
  check(Math.abs(y2 - y1) <= 1, 'сдвиг ниже видимого поста прокрутку не трогает (' + y1 + ' -> ' + y2 + ')');
  const y3 = await shift(1, -60);
  check(Math.abs(y3 - (y2 - 60)) <= 1, 'пост выше уменьшился на 60: прокрутка вернулась на 60 (' + y2 + ' -> ' + y3 + ')');
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
