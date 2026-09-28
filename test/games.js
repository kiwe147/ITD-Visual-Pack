// Игры: в правой панели — меню (Змейка, Сапёр, Тетрис) с рекордами; нажатие — большое окно с игрой.
// Змейка: два быстрых нажатия подряд срабатывают оба (очередь), скорость не растёт. Сапёр: первый ход безопасный,
// правая кнопка — флажок. Тетрис: пробел сбрасывает фигуру. Esc — закрыть, игра не играет дальше.
// Запуск:  node test/games.js снимок-ленты.html
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
  const p = await b.newPage({ viewport: { width: 1700, height: 950 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, vp_snake_best: 26 };
    window.__s = s;
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob, .vp-post-tools, .vp-post-refresh').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);

  const menu = await p.evaluate(() => [...document.querySelectorAll('.vp-rail.vp-on .vp-game-row')].map(r => r.textContent.trim()));
  console.log('—    меню: ' + menu.join(' | '));
  check(menu.length === 3 && /Змейка.*рекорд 26/.test(menu[0]) && /Сапёр/.test(menu[1]) && /Тетрис/.test(menu[2]), 'в панели — меню игр с рекордом змейки');
  check(!(await p.$('.vp-snake')), 'маленькой змейки в панели больше нет');

  // змейка: окно, очередь нажатий
  await p.click('.vp-game-row >> nth=0');
  await p.waitForTimeout(400);
  check(!!(await p.$('.vp-games .vp-g-canvas')), 'нажал «Змейка» — большое окно с полем');
  const st = () => p.evaluate(() => document.querySelector('.vp-games-body > div')._vpTest());
  const s0 = await st();
  await p.keyboard.press('ArrowUp');
  await p.keyboard.press('ArrowLeft');                 // сразу второе — раньше затирало первое
  const s1 = await st();
  await p.waitForTimeout(330);                         // ~3 шага по 115 мс
  const s2 = await st();
  console.log(`—    змейка: ${JSON.stringify(s0.head)} → очередь ${s1.queue} → ${JSON.stringify(s2.head)}, ход ${JSON.stringify(s2.dir)}`);
  check(s1.queue === 2 && s1.on, 'два быстрых нажатия — оба в очереди, игра пошла');
  check(s2.dir.x === -1 && s2.dir.y === 0 && s2.head.y < s0.head.y && s2.head.x < s0.head.x + 1, 'сработали оба: сначала вверх, потом влево');
  const t0 = await st();
  await p.waitForTimeout(1150);
  const t1 = await st();
  const moved = (t0.head.x - t1.head.x + 16) % 16;
  check(moved >= 9 && moved <= 11, `скорость постоянная: за 1,15 с — ${moved} клеток (шаг 115 мс)`);
  // Esc — окно закрыто, змейка не бежит дальше
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  check(!(await p.$('.vp-games')), 'Esc — окно закрыто');

  // сапёр
  await p.click('.vp-game-row >> nth=1');
  await p.waitForTimeout(300);
  const cells = await p.$$('.vp-mine');
  check(cells.length === 100, `сапёр: поле 10х10 (${cells.length})`);
  await cells[44].click();
  await p.waitForTimeout(200);
  const opened = await p.$$eval('.vp-mine.vp-open', x => x.length);
  const boom = await p.$('.vp-mine.vp-boom');
  check(opened >= 9 && !boom, `первый ход безопасный и открыл область (${opened} клеток)`);
  const closed = await p.$$('.vp-mine:not(.vp-open)');
  await closed[0].click({ button: 'right' });
  check(await closed[0].evaluate(b => b.textContent === '🚩'), 'правая кнопка — флажок');
  check(/💣 14/.test(await p.$eval('.vp-games-score', e => e.textContent)), 'счётчик мин уменьшился');

  // тетрис: вкладка в окне, пробел — фигура упала
  await p.click('.vp-games-tab[data-g="tetris"]');
  await p.waitForTimeout(300);
  await p.keyboard.press('ArrowLeft');                 // старт
  await p.waitForTimeout(150);
  await p.keyboard.press('Space');
  await p.waitForTimeout(150);
  const sc = await p.$eval('.vp-g-side [data-v="score"]', e => +e.textContent);
  check(sc > 0, `тетрис: пробел сбросил фигуру (очки ${sc})`);
  check(await p.evaluate(() => window.__s.vp_game_last) === 'tetris', 'окно помнит последнюю игру');
  await p.click('.vp-games', { position: { x: 5, y: 5 } });
  await p.waitForTimeout(200);
  check(!(await p.$('.vp-games')), 'клик мимо окна — закрыто');
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await p.screenshot({ path: path.join(__dirname, 'out', 'games-rail.png') });
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
