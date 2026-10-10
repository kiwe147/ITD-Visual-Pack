// Сапёр (3.3.10): щелчок колёсиком мыши по клетке оставляет рамку её квадрата 3х3 (зона цифры), угол — 2х2;
// щелчок колёсиком по другой клетке — рамка переезжает, по той же — убирается. Наведение — без рамки.
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
  check(!(await p.$('.vp-mine.vp-near')), 'просто наведение — без подсветки');
  await p.mouse.down({ button: 'middle' }); await p.mouse.up({ button: 'middle' }); await p.waitForTimeout(150);
  await p.mouse.move(5, 5); await p.waitForTimeout(150);
  let near = await p.$$eval('.vp-mine.vp-near', bs => bs.map(x => +x.dataset.i).sort((a, b) => a - b));
  check(near.join() === '33,34,35,43,44,45,53,54,55', `щелчок колёсиком в середине — рамка 3х3 и остаётся, когда увёл мышь: ${near.join(' ')}`);
  await p.screenshot({ path: path.join(__dirname, 'out', 'mines.png'), clip: await p.$eval('.vp-games-win', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }) });
  await p.hover('.vp-mine[data-i="0"]'); await p.mouse.down({ button: 'middle' }); await p.mouse.up({ button: 'middle' }); await p.waitForTimeout(150);
  near = await p.$$eval('.vp-mine.vp-near', bs => bs.map(x => +x.dataset.i).sort((a, b) => a - b));
  check(near.join() === '0,1,10,11', `щелчок колёсиком в углу — рамка переехала, 2х2: ${near.join(' ')}`);
  await p.mouse.down({ button: 'middle' }); await p.mouse.up({ button: 'middle' }); await p.waitForTimeout(150);
  check(!(await p.$('.vp-mine.vp-near')), 'ещё щелчок колёсиком по той же — рамка убрана');
  await p.click('.vp-mines-bar [data-a="help"]'); await p.waitForTimeout(200);
  const help = await p.$eval('.vp-mines-help', e => ({ shown: getComputedStyle(e).display !== 'none', text: e.textContent }));
  check(help.shown && /15 мин/.test(help.text) && /флажок/.test(help.text), '«❓ Как играть» — правила открылись');
  await p.screenshot({ path: path.join(__dirname, 'out', 'mines-help.png'), clip: await p.$eval('.vp-games-win', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }) });
  await p.click('.vp-mines-help'); await p.waitForTimeout(150);
  check(await p.$eval('.vp-mines-help', e => getComputedStyle(e).display === 'none'), 'нажатие по правилам — закрылись');
  check(!p.errors.length, 'ошибок нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
