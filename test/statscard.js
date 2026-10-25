// Карточка «Статистика» (3.6.3): вкладки Всё/День/Неделя/Месяц, плитки, график лайков, лучшие посты, число запросов.
// Запуск:  node test/statscard.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const H = 3600e3, D = 24 * H;
const STICKER_POST = '92f2913c-18be-499a-bc03-97aed0947b34';

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const NOW = Date.now(), posts = [];
  for (let i = 0; i < 240; i++) posts.push({ id: 'p' + i, content: i === 7 ? '' : i === 3 ? 'доброе утро, господи я проснулся' : 'пост номер ' + i, likesCount: i === 3 ? 634 : i === 7 ? 1167 : (i * 37) % 90, originalPost: i % 25 === 0 ? { id: 'o' + i } : null, createdAt: new Date(NOW - i * 0.9 * D - i * 1000).toISOString(), author: { username: 'NeuroSFW' } });
  let postReq = 0;
  const p = await b.newPage({ viewport: { width: 1920, height: 1100 } });
  p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  await p.route('**/*', r => {
    const req = r.request(), u = new URL(req.url()), t2 = req.resourceType();
    if (u.origin === ORIGIN && t2 === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t2)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: 'u1', followersCount: 2410, followingCount: 318, postsCount: 240 }) });
    if (u.pathname === '/api/posts/user/NeuroSFW') {
      postReq++;
      const from = +(u.searchParams.get('cursor') || 0), page = posts.slice(from, from + 50), more = from + 50 < posts.length;
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: page, pagination: { limit: 50, nextCursor: more ? String(from + 50) : null, hasMore: more } } }) });
    }
    if (u.pathname === '/api/posts/' + STICKER_POST + '/comments') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { comments: [], hasMore: false } }) });
    return r.fulfill({ status: 404, body: '' });
  });
  const hist = [{ ago: 35 * D, followers: 2300, following: 320, posts: 200, likes: 6000 }, { ago: 8 * D, followers: 2380, following: 320, posts: 230, likes: 6900 }, { ago: 26 * H, followers: 2405, following: 318, posts: 239, likes: 7000 }];
  await p.addInitScript(([m, h]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, vp_stats_hist: JSON.stringify(h.map(x => ({ ...x, at: Date.now() - x.ago }))) };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, [src.slice(0, src.indexOf('==/UserScript==')), hist]);
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForFunction(() => document.querySelectorAll('.vp-best-post').length > 0, null, { timeout: 40000 }).catch(() => { });
  const shot = async name => { const el = await p.$('.vp-rail-card[data-block="stats"]'); if (el) await el.screenshot({ path: path.join(__dirname, 'out', 'statscard-' + name + '.png') }); };
  const read = () => p.evaluate(() => ({
    rows: [...document.querySelectorAll('.vp-stat')].map(r => r.textContent.replace(/\s+/g, ' ').trim()),
    chart: !document.querySelector('.vp-chart').hidden, dots: document.querySelectorAll('.vp-chart svg circle').length, cap: (document.querySelector('.vp-chart-cap') || {}).textContent || '',
    ax: [...document.querySelectorAll('.vp-chart-ax span')].map(x => x.textContent).join(' … '), best: [...document.querySelectorAll('.vp-best-post')].map(x => x.textContent), tab: ((document.querySelector('.vp-seg .vp-on') || {}).dataset || {}).p
  }));
  let r = await read();
  console.log('— Всё ' + JSON.stringify(r));
  check(postReq === 5, 'посты перебраны за 5 запросов (240 по 50): ' + postReq);
  check(r.tab === 'all' && r.rows.length === 4, 'по умолчанию «Всё», четыре плитки');
  check(r.rows.some(x => /2\s?410/.test(x)) && r.rows.some(x => /Посты/.test(x)), 'в плитках подписчики 2 410 и посты');
  check(r.rows.every(x => !/[+−]/.test(x)), '«Всё»: без прироста');
  check(r.chart && r.dots >= 8, 'график по месяцам есть, точек ' + r.dots);
  check(/Лучший месяц/.test(r.cap), 'подпись: ' + r.cap);
  check(r.best.length === 2 && /Пост без текста/.test(r.best[0]) && /доброе утро/.test(r.best[1]), 'лучшие посты: ' + r.best.join(' | '));
  const bodyH = () => p.$eval('.vp-more-body', e => Math.round(e.getBoundingClientRect().height));
  check(await bodyH() === 0, 'по умолчанию график и лучшие посты свёрнуты');
  check(await p.$eval('.vp-more', e => !e.hidden && /Подробнее/.test(e.textContent)), 'кнопка «Подробнее» на месте');
  await shot('closed');
  await p.click('.vp-more'); await p.waitForTimeout(600);
  check(await bodyH() > 100, 'после нажатия блок раскрылся: ' + await bodyH());
  check(await p.$eval('.vp-more', e => /Свернуть/.test(e.textContent)), 'надпись стала «Свернуть»');
  await shot('all');
  await p.click('.vp-seg button[data-p="week"]'); await p.waitForTimeout(300);
  r = await read(); console.log('— Неделя ' + JSON.stringify(r));
  check(r.chart && r.dots > 7, 'неделя: график по дням (кругов ' + r.dots + ')');
  check(r.rows.some(x => /Подписчики.*\+\d/.test(x)), 'неделя: есть прирост подписчиков');
  check(/Лучший день/.test(r.cap), 'неделя: подпись про лучший день: ' + r.cap);
  await shot('week');
  await p.click('.vp-seg button[data-p="day"]'); await p.waitForTimeout(300);
  r = await read(); console.log('— День ' + JSON.stringify(r));
  check(!r.chart, 'день: графика нет');
  await shot('day');
  await p.click('.vp-seg button[data-p="month"]'); await p.waitForTimeout(300);
  r = await read(); console.log('— Месяц ' + JSON.stringify(r));
  check(r.chart && r.dots > 30, 'месяц: график по дням (кругов ' + r.dots + ')');
  await shot('month');
  await p.hover('.vp-chart svg', { position: { x: 100, y: 60 } }); await p.waitForTimeout(200);
  console.log('— наведение: ' + await p.$eval('.vp-chart-cap', e => e.textContent));
  await p.click('.vp-best-post >> nth=0'); await p.waitForTimeout(300);
  check(await p.evaluate(() => location.pathname.startsWith('/post/')), 'клик по лучшему посту ведёт на /post/…');
  check(!p.errors.length, 'ошибок нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
