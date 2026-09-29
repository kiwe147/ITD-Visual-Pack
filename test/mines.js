// Сапёр (3.3.9.1): наведение мышью на клетку подсвечивает её квадрат 3х3 (зона цифры), угол — 2х2; ушёл с поля — снято.
// Вкладка лидеров называется «Топ задротов». Снимок → test/out/mines.png.
// Запуск:  node test/mines.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  await p.route('**/*', r => {
    const req = r.request(), u = new URL(req.url()), t = req.resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.pathname.endsWith('/comments') && req.method() === 'GET') return r.fulfill({ contentType: 'application/json', body: '{"data":{"comments":[],"hasMore":false}}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, vp_game_last: 'mines' };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  await p.click('.vp-game-row >> nth=0'); await p.waitForTimeout(500);
  await p.click('.vp-games-tab[data-g="mines"]'); await p.waitForTimeout(400);
  const lead = await p.$eval('.vp-games-tab[data-g="lead"]', e => e.textContent.trim());
  check(lead === '🏆 Топ задротов', `вкладка лидеров: «${lead}»`);
  await p.hover('.vp-mine[data-i="44"]'); await p.waitForTimeout(150);
  let near = await p.$$eval('.vp-mine.vp-near', bs => bs.map(x => +x.dataset.i).sort((a, b) => a - b));
  check(near.join() === '33,34,35,43,44,45,53,54,55', `середина — 3х3: ${near.join(' ')}`);
  await p.screenshot({ path: path.join(__dirname, 'out', 'mines.png'), clip: await p.$eval('.vp-games-win', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }) });
  await p.hover('.vp-mine[data-i="0"]'); await p.waitForTimeout(150);
  near = await p.$$eval('.vp-mine.vp-near', bs => bs.map(x => +x.dataset.i).sort((a, b) => a - b));
  check(near.join() === '0,1,10,11', `угол — 2х2: ${near.join(' ')}`);
  await p.mouse.move(5, 5); await p.waitForTimeout(150);
  check(!(await p.$('.vp-mine.vp-near')), 'ушёл с поля — подсветка снята');
  check(!p.errors.length, 'ошибок нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
