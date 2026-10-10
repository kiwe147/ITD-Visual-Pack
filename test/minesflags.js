// Сапёр: при проигрыше флажки подсвечиваются — зелёным те, что на мине, красным те, что не на мине; мины без флажка показаны бомбой.
// Всего мин 15: бомб на поле + зелёных флажков = 15, а красных + зелёных = поставленных флажков. Снимок → test/out/mines-lose.png.
// Запуск:  node test/minesflags.js снимок-ленты.html
// (проигрыш получается кликами по клеткам подряд, поэтому тест перебирает до взрыва)
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
  for (const i of [0, 7, 22, 35, 48, 61, 74, 87, 93, 99]) await p.click(`.vp-mine[data-i="${i}"]`, { button: 'right' });
  await p.click('.vp-mine[data-i="44"]'); await p.waitForTimeout(300);
  for (let k = 0; k < 120; k++) {
    if (await p.$eval('.vp-mines-msg', e => e.textContent.trim())) break;
    const cell = await p.evaluateHandle(() => [...document.querySelectorAll('.vp-mine:not(.vp-open)')].find(x => x.textContent === ''));
    if (!cell || !cell.asElement()) break;
    await cell.asElement().click().catch(() => { });
    await p.waitForTimeout(40);
  }
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const all = [...document.querySelectorAll('.vp-mine')];
    const flagged = all.filter(b => b.textContent === '🚩');
    return {
      msg: document.querySelector('.vp-mines-msg').textContent.trim(),
      bombs: all.filter(b => b.classList.contains('vp-open') && b.textContent === '💣').length,
      ok: all.filter(b => b.classList.contains('vp-flag-ok')).length,
      bad: all.filter(b => b.classList.contains('vp-flag-bad')).length,
      flagged: flagged.length,
      okBg: all.filter(b => b.classList.contains('vp-flag-ok')).every(b => getComputedStyle(b).backgroundColor.startsWith('rgba(46, 204, 113')),
      badBg: all.filter(b => b.classList.contains('vp-flag-bad')).every(b => getComputedStyle(b).backgroundColor.startsWith('rgba(231, 76, 60')),
      stray: all.filter(b => (b.classList.contains('vp-flag-ok') || b.classList.contains('vp-flag-bad')) && b.textContent !== '🚩').length,
    };
  });
  console.log(JSON.stringify(r));
  check(/Бум/.test(r.msg), 'игра проиграна');
  check(r.ok + r.bad === r.flagged, `подсвечены все флажки: зелёных ${r.ok} + красных ${r.bad} = ${r.flagged}`);
  check(r.bombs + r.ok === 15, `бомб без флажка ${r.bombs} + флажков на мине ${r.ok} = 15`);
  check(r.bad >= 1 && r.ok >= 0, `красные флажки есть (${r.bad})`);
  check(r.okBg && r.badBg, 'цвета подсветки: зелёный и красный');
  check(r.stray === 0, 'подсвечены только клетки с флажком');
  await p.screenshot({ path: path.join(__dirname, 'out', 'mines-lose.png'), clip: await p.$eval('.vp-games-win', e => { const q = e.getBoundingClientRect(); return { x: q.x, y: q.y, width: q.width, height: q.height }; }) });
  check(!p.errors.length, 'ошибок нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
