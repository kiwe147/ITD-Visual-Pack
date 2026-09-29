// Ивент «Алиса AI» (29.09): пункт «Ивент» ведёт на /event/alice-ai — иконка мода всё равно ставится; виджет «Сбор на шторы»
// не наезжает на статистику профиля (посты и лайки мода); «стекло» ивента на баннере мода спрятано.
// Запуск:  node test/event.js "../ITD/itd-snapshot-NeuroSFW-2048px (1).html"
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const info = (snap.match(/id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const URL0 = 'https://xn--d1ah4a.com' + (info ? new URL(JSON.parse(info).url).pathname : '/@NeuroSFW');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1808, height: 1000 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: 'u1', followersCount: 239, followingCount: 127, postsCount: 584 }) });
    if (u.pathname === '/api/users/NeuroSFW') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { username: 'NeuroSFW', id: 'u1', postsCount: 584 } }) });
    if (u.pathname === '/api/posts/user/NeuroSFW') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: [{ id: 'w1', likesCount: 5471 }], pagination: { nextCursor: null } } }) });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(URL0);
  await p.evaluate(() => {
    document.querySelectorAll('.vp-posts-stat, .vp-likes-stat').forEach(e => e.remove());
    document.querySelectorAll('[data-vp-posts]').forEach(e => e.removeAttribute('data-vp-posts'));
    document.querySelectorAll('.vp-rail, .vp-fab, .vp-nav-blob, .vp-portal').forEach(e => e.remove());
    document.querySelectorAll('.vp-portal-img').forEach(e => e.classList.remove('vp-portal-img'));
  });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(4000);
  const r = await p.evaluate(() => {
    const a = document.querySelector('a[href^="/event"]'), img = a && a.querySelector('img'), svg = a && a.querySelector('svg.vp-portal');
    const bar = document.querySelector('[role="progressbar"]'), w = bar && bar.parentElement.getBoundingClientRect();
    const stats = [...document.querySelectorAll('.vp-posts-stat, .vp-likes-stat')].map(e => e.getBoundingClientRect());
    const hit = (x, y) => x.left < y.right && y.left < x.right && x.top < y.bottom && y.top < x.bottom;
    const glass = document.querySelector('.vp-banner > [aria-label="Стекло"]');
    return { href: a && a.getAttribute('href'), imgHidden: !!img && getComputedStyle(img).display === 'none', icon: !!svg,
      stats: stats.length, overlap: !!w && stats.some(s => hit(s, w)), stacked: !!document.querySelector('[data-vp-stack]'),
      glass: glass ? getComputedStyle(glass).display : 'нет' };
  });
  console.log('—    ' + JSON.stringify(r));
  check(r.href === '/event/alice-ai' && r.imgHidden && r.icon, 'пункт «Ивент» (/event/alice-ai): иконка мода вместо картинки сайта');
  check(r.stats === 2 && !r.overlap && r.stacked, 'посты и лайки в статистике, виджет «Сбор на шторы» под ней, не наезжает');
  check(r.glass === 'none', `«стекло» ивента на баннере мода спрятано (${r.glass})`);
  const card = await p.$eval('.vp-banner', e => { const r = e.getBoundingClientRect(); return { x: Math.max(0, r.x - 20), y: Math.max(0, r.y - 20), width: r.width + 40, height: 760 }; });
  await p.screenshot({ path: path.join(__dirname, 'out', 'event-profile.png'), clip: card });
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
