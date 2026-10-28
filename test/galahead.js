// Галерея: следующая страница грузится заранее и ждёт в запасе, а не когда уже упёрся в низ; плитки добавляются пачками
// и мягко проявляются; запас не больше одной страницы; смена вкладки сбрасывает запас.
// Запуск:  node test/galahead.js снимок-ленты-телефон.html   (любой снимок страницы сайта, как для galbar.js)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const PAGES = 6, PER = 50, LAT = +(process.env.LAT || 1500);
const mkPage = (tab, n) => Array.from({ length: PER }, (_, i) => {
  const id = tab + '-' + n + '-' + i, h = 400 + ((i * 97 + n * 31) % 5) * 120;
  return { id, author: { username: 'a' }, attachments: [{ type: 'image', url: `https://cdn.xn--d1ah4a.com/images/vpph-${i}-0-600-${h}.png`, width: 600, height: h }] };
});
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1300, height: 800 } });
  const p = await ctx.newPage();
  const errors = [], reqs = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', async r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    const m = u.pathname.match(/vpph-\d+-(\d)-(\d+)-(\d+)/);
    if (m) return r.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="${m[2]}" height="${m[3]}"><rect width="100%" height="100%" fill="#456"/></svg>` });
    if (t === 'image' || t === 'font') return r.abort();
    if (t === 'stylesheet') return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.pathname === '/api/posts') {
      const tab = u.searchParams.get('tab') || 'popular', cur = u.searchParams.get('cursor'), n = cur ? +cur.slice(1) : 0;
      reqs.push({ t: Date.now(), tab, n });
      await new Promise(res => setTimeout(res, n === 0 ? 150 : LAT));
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: mkPage(tab, n), pagination: { nextCursor: n + 1 < PAGES ? 'c' + (n + 1) : null } } }) });
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
  await p.evaluate(() => {
    document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob, .vp-itdx-btn, .vp-msgs, .vp-gal, .vp-gal-nav').forEach(e => e.remove());
    document.querySelectorAll('style').forEach(st => { if (/vp-msgs|vp-gal/.test(st.textContent)) st.remove(); });
    const st = document.createElement('style');
    st.textContent = '.vp-gal { left: 0 !important; right: 0 !important; top: 36px !important; bottom: 0 !important; z-index: 99999 !important }';
    document.head.appendChild(st);
  });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2000);
  await p.evaluate(() => { const o = [...document.querySelectorAll('*')].find(e => e.classList && e.classList.contains('vp-gal-nav')); (o || document.querySelector('.vp-gal-btn')).click(); });
  await p.waitForSelector('.vp-gal-tile', { state: 'attached', timeout: 8000 });
  await p.waitForTimeout(LAT + 1500);
  const tiles = () => p.evaluate(() => document.querySelectorAll('.vp-gal-tile').length);
  const geo = () => p.evaluate(() => { const b = document.querySelector('.vp-gal-body'); return { top: b.scrollTop, h: b.clientHeight, all: b.scrollHeight }; });
  let g = await geo();
  console.log('—    после открытия: плиток ' + await tiles() + ', высота ' + g.all + ', окно ' + g.h + ', запросов ' + reqs.length + ' (' + reqs.map(r => r.n).join(',') + ')');
  check(reqs.length >= 2 && reqs[1].n === 1, 'следующая страница запрошена сама, ещё до прокрутки (' + reqs.map(r => r.n).join(',') + ')');
  check(await tiles() === PER, 'на экране пока только первая страница (запас не вставлен): ' + await tiles());
  // подходим на «2500 px до низа»: запас должен вставиться сразу, не дожидаясь сети (сервер отвечает за LAT мс)
  g = await geo();
  const t0 = Date.now();
  await p.evaluate(() => { const b = document.querySelector('.vp-gal-body'); b.scrollTop = b.scrollHeight - b.clientHeight - 2500; });
  let n1 = PER;
  while (Date.now() - t0 < LAT && (n1 = await tiles()) <= PER) await p.waitForTimeout(30);
  const dt = Date.now() - t0;
  console.log('—    вставка запаса: ' + dt + ' мс, плиток ' + n1);
  check(n1 > PER, 'запас вставлен после ответа сети (' + dt + ' мс при задержке сервера ' + LAT + ' мс)');
  const fresh = await p.evaluate(() => document.querySelectorAll('.vp-gal-tile.vp-gal-new').length);
  check(fresh > 0, 'новые плитки проявляются мягко (класс есть у ' + fresh + ')');
  await p.waitForTimeout(1500);
  check(await p.evaluate(() => document.querySelectorAll('.vp-gal-tile.vp-gal-new').length) === 0, 'после проявления класс снимается (иначе анимация повторится при пересборке)');
  await p.waitForTimeout(LAT + 1500);
  const total1 = reqs.length;
  await p.waitForTimeout(2500);
  check(reqs.length === total1, 'в покое запросы не идут, запас не больше одной страницы (' + reqs.map(r => r.n).join(',') + ')');
  check(Math.max(...reqs.map(r => r.n)) <= 2 + 1, 'всего запрошено не дальше следующей за запасом (макс. страница ' + Math.max(...reqs.map(r => r.n)) + ')');
  // смена вкладки сбрасывает запас и грузит заново
  const before = reqs.length;
  await p.evaluate(() => document.querySelector('.vp-gal-tab[data-tab="clan"]').click());
  await p.waitForTimeout(LAT + 1500);
  check(reqs.slice(before).some(r => r.tab === 'clan' && r.n === 0), 'вкладка «Кланы»: загрузка с первой страницы');
  check(reqs.slice(before).every(r => r.tab === 'clan'), 'после смены вкладки запросов старой вкладки нет');
  check(await tiles() === PER, 'в новой вкладке плитки только её (' + await tiles() + ')');
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
