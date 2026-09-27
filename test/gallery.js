// Галерея: кнопка в полосе ленты → окно с сеткой картинок/видео (2 колонки на телефоне, 4 на ПК),
// подгрузка второй страницы при прокрутке, видео без звука, нажатие — переход в пост, «назад» — закрыть.
// Лента — выдуманная (2 страницы по 20 постов, картинки разной высоты, одно видео).
// Запуск:  node test/gallery.js снимок-ленты.html [phone|desktop]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [snapPath, mode = 'phone'] = process.argv.slice(2);
const snap = fs.readFileSync(snapPath, 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const info = (snap.match(/id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const URL0 = 'https://xn--d1ah4a.com' + (info ? new URL(JSON.parse(info).url).pathname : '/');
const out = path.join(__dirname, 'out');
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const svg = (w, h, hue) => 'https://cdn.xn--d1ah4a.com/images/vptest-' + [w, h, hue].join('-') + '.svg';
const page = n => ({ data: { posts: Array.from({ length: 20 }, (_, i) => {
  const k = n * 20 + i, w = 400 + (k % 3) * 200, h = 300 + (k * 137) % 700;
  const att = k === 3 ? [{ type: 'video', url: 'https://cdn.xn--d1ah4a.com/images/vptest-v.mp4', width: 640, height: 400, duration: 25 }]
    : k % 5 === 4 ? [] : [{ type: 'image', url: svg(w, h, (k * 47) % 360), width: w, height: h }];
  return { id: `p-${k}`, content: 'пост ' + k, author: { username: 'user' + (k % 4) }, attachments: att };
}), pagination: { nextCursor: n === 0 ? 'c1' : null } } });
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage(mode === 'desktop' ? { viewport: { width: 1400, height: 900 } } : { viewport: { width: 392, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [], feed = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (r.request().url() === URL0) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (u.pathname.includes('/images/vptest-')) {
      if (u.pathname.endsWith('.mp4')) return r.fulfill({ contentType: 'video/mp4', body: fs.readFileSync(path.join(out, 'bg-test.mp4')) });
      const [w, h, hue] = u.pathname.split('vptest-').pop().replace('.svg', '').split('-').map(Number);
      return r.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="hsl(${hue},60%,45%)"/><text x="50%" y="50%" font-size="60" fill="#fff" text-anchor="middle">${w}×${h}</text></svg>` });
    }
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.pathname === '/api/posts') {
      feed.push(u.searchParams.get('tab') + (u.searchParams.get('cursor') ? '+' + u.searchParams.get('cursor') : ''));
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify(page(u.searchParams.get('cursor') ? 1 : 0)) });
    }
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(URL0);
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  const sel = mode === 'desktop' ? '.vp-gal-nav' : '.vp-gal-btn';
  const btn = await p.$(sel);
  check(!!btn && await btn.isVisible(), mode === 'desktop' ? 'пункт «Галерея» в боковом меню' : 'кнопка «Галерея» в полосе ленты');
  if (btn && mode !== 'desktop') await p.screenshot({ path: path.join(out, `gal-${mode}-bar.png`), clip: await p.$eval('.vp-gal-btn', b => { const r = b.closest('.vp-feed-bar').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }) });
  await btn.click();
  await p.waitForTimeout(1500);
  const cols = await p.$$eval('.vp-gal-col', c => c.length);
  check(cols === (mode === 'desktop' ? 4 : 3 - 1), `колонок: ${cols}`);
  let tiles = await p.$$eval('.vp-gal-tile', t => t.length);
  check(tiles === 16, `первая страница: ${tiles} плиток (посты без картинок пропущены)`);
  const heights = await p.$$eval('.vp-gal-col', cs => cs.map(c => Math.round(c.getBoundingClientRect().height)));
  check(Math.max(...heights) - Math.min(...heights) < 450, `колонки ровные по высоте: ${heights.join(', ')}`);
  await p.screenshot({ path: path.join(out, `gal-${mode}.png`) });
  const vid = await p.$eval('.vp-gal-tile video', v => ({ muted: v.muted, loop: v.loop, badge: v.parentElement.querySelector('.vp-gal-badge').textContent }));
  check(vid.muted && vid.loop && vid.badge === '0:25', `видео без звука, по кругу, длительность ${vid.badge}`);
  await p.$eval('.vp-gal-body', b => { b.scrollTop = b.scrollHeight; b.dispatchEvent(new Event('scroll')); });
  await p.waitForTimeout(1200);
  tiles = await p.$$eval('.vp-gal-tile', t => t.length);
  check(tiles === 32 && feed.join() === 'popular,popular+c1', `вторая страница подгрузилась: ${tiles} плиток, запросы ${feed.join(' ')}`);
  const more = await p.$eval('.vp-gal-more', m => m.textContent);
  check(more === 'Это всё', `в конце: «${more}»`);
  await p.click('.vp-gal-tab[data-tab="following"]');
  await p.waitForTimeout(800);
  check(feed[feed.length - 1] === 'following', `вкладка «Подписки» грузит свою ленту (${feed.join(' ')})`);
  const url0 = await p.evaluate(() => location.pathname);
  await p.click('.vp-gal-tile img');
  await p.waitForTimeout(400);
  const after = await p.evaluate(() => ({ path: location.pathname, open: !!document.querySelector('.vp-gal') }));
  check(/^\/@user\d\/post\/p-\d+$/.test(after.path) && !after.open, `нажатие открывает пост (${after.path}), галерея закрыта`);
  await p.evaluate(u => { history.pushState({}, '', u); dispatchEvent(new PopStateEvent('popstate')); }, url0);
  await p.click(sel);
  await p.waitForTimeout(500);
  await p.goBack();
  await p.waitForTimeout(500);
  check(!(await p.$('.vp-gal')) && (await p.evaluate(() => location.pathname)) === url0, '«назад» закрывает галерею и не уводит со страницы');
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
