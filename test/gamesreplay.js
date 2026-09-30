// Повторы рекордов и чистка «Топа задротов» (3.4.3). Игрок (bob) ставит рекорды в змейке, сапёре и тетрисе — вместе с рекордом
// под пост игр уходит запись партии (ITDXP1). Владелец в админке «Рекорды и повторы» смотрит повтор: мод переигрывает партию и
// сверяет счёт («Совпадает»). Подделанный рекорд — «Не сходится». «Убрать из топа» — рекорд пропадает из таблицы у всех, а у
// самого игрока обнуляется на устройстве и больше не уходит на сервер; «Вернуть в топ» — снова виден.
// Накрутчик в тесте правит рекорд и на сервере, и у себя на устройстве (как через «Хранилище» Tampermonkey).
// Запуск:  node test/gamesreplay.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8')
  .replace('const lbText = o => {', 'window.__lbText = o => lbText(o); const lbText = o => {');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const GAMES = src.match(/const GAMES_POST_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const BOB = '22222222-2222-4222-8222-222222222222';
const USERS = { NeuroSFW: { id: OWNER, username: 'NeuroSFW', displayName: 'Нейро' }, bob: { id: BOB, username: 'bob', displayName: 'Боб' } };
const VERIFIED = { NeuroSFW: { code: 'x', hasMod: true, id: OWNER, state: 'approved' }, bob: { code: 'x', hasMod: true, id: BOB, state: 'approved' } };
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const wait = ms => new Promise(r => setTimeout(r, ms));
let comments = [], n = 0;
const GM = { NeuroSFW: {}, bob: {} };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const open = async who => {
    const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
    p.errors = [];
    p.on('pageerror', e => p.errors.push(e.message));
    p.on('dialog', d => d.accept());
    await p.route('**/*', async r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify(USERS[who]) });
      if (u.pathname === `/api/posts/${GAMES}/comments`) {
        if (req.method() === 'GET') return r.fulfill({ contentType: 'application/json', headers: { date: new Date().toUTCString() }, body: JSON.stringify({ data: { comments, hasMore: false } }) });
        const c = { id: 'c' + (++n), author: USERS[who], content: JSON.parse(req.postData()).content, createdAt: new Date().toISOString() };
        comments.push(c);
        return r.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: c }) });
      }
      if (req.method() === 'PATCH' && u.pathname.startsWith('/api/comments/')) {
        const c = comments.find(x => x.id === u.pathname.split('/').pop());
        if (c) c.content = JSON.parse(req.postData()).content;
        return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: c || {} }) });
      }
      return r.fulfill({ status: 404, body: '' });
    });
    await p.exposeFunction('__gmSave', (k, v) => { GM[who][k] = v; });
    await p.addInitScript(([m, v, s]) => {
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, val) => { s[k] = val; window.__gmSave(k, val); };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
      localStorage.setItem('itd_verified_users', JSON.stringify(v));
    }, [src.slice(0, src.indexOf('==/UserScript==')), VERIFIED, Object.assign({ introEnabled: false, introMobile: 'off', backgroundEnabled: false }, GM[who])]);
    await p.goto(ORIGIN + '/');
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-msgs, .vp-nav-blob').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    return p;
  };
  const gm = (who, base) => { const k = Object.keys(GM[who]).find(x => x.startsWith(base + '@')); return k ? GM[who][k] : undefined; };
  const st = p => p.evaluate(() => document.querySelector('.vp-games-body > div')._vpTest());

  let p = await open('bob');
  await p.$eval('.vp-game-row', x => x.click());
  await p.waitForTimeout(500);
  await p.$eval('.vp-games-tab[data-g="snake"]', x => x.click());
  await p.waitForTimeout(300);
  await p.keyboard.press('ArrowUp');
  const DIR = { '0,-1': 'ArrowUp', '1,0': 'ArrowRight', '0,1': 'ArrowDown', '-1,0': 'ArrowLeft' };
  for (let i = 0; i < 600; i++) {
    const s = await st(p);
    if (s.dead) break;
    if (s.len >= 5) {
      const d = [s.dir.x, s.dir.y], cw = ([x, y]) => [-y, x];
      let c = d;
      for (let j = 0; j < 3; j++) { c = cw(c); await p.keyboard.press(DIR[c.join()]); }
      await wait(1200);
      continue;
    }
    const dx = s.food.x - s.head.x, dy = s.food.y - s.head.y;
    let want = dx ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
    if (want[0] === -s.dir.x && want[1] === -s.dir.y) want = [s.dir.y, s.dir.x];
    if (want[0] !== s.dir.x || want[1] !== s.dir.y) await p.keyboard.press(DIR[want.join()]);
    await wait(60);
  }
  const snake = await st(p);
  check(snake.dead && snake.score >= 2, `змейка: бот доиграл до конца, счёт ${snake.score}`);

  await p.$eval('.vp-games-tab[data-g="tetris"]', x => x.click());
  await p.waitForTimeout(300);
  await p.keyboard.press('ArrowLeft');
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Space'];
  for (let i = 0; i < 400; i++) {
    const s = await st(p);
    if (s.over) break;
    await p.keyboard.press(keys[i % keys.length]);
    await wait(i % 9 === 0 ? 900 : 40);
  }
  const tet = await st(p);
  check(tet.over && tet.score > 0, `тетрис: игра до конца, счёт ${tet.score}`);

  await p.$eval('.vp-games-tab[data-g="mines"]', x => x.click());
  await p.waitForTimeout(300);
  await p.$eval('.vp-mine[data-i="55"]', x => x.click());
  await wait(700);
  let ms = await st(p);
  const mine = ms.cells.findIndex(c => c.mine && !c.flag);
  await p.$eval(`.vp-mine[data-i="${mine}"]`, x => x.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true })));
  await wait(700);
  ms = await st(p);
  for (let i = 0; i < 100; i++) if (!ms.cells[i].mine && !ms.cells[i].open) { await p.$eval(`.vp-mine[data-i="${i}"]`, x => x.click()); ms = await st(p); if (ms.over) break; await wait(15); }
  await wait(1100);
  ms = await st(p);
  check(ms.over && ms.cells.every(c => c.mine || c.open), 'сапёр: разминировано');
  await p.waitForTimeout(4500);
  const best = { s: gm('bob', 'vp_snake_best'), m: gm('bob', 'vp_mines_best'), t: gm('bob', 'vp_tetris_best') };
  console.log('—    рекорды bob: ' + JSON.stringify(best));
  const reps = comments.filter(c => c.author.id === BOB && /^ITDXP1 /.test(c.content));
  check(['s', 'm', 't'].every(g => reps.some(c => c.content.startsWith(`ITDXP1 ${g} 1/`))), `повторы всех трёх игр ушли под пост игр (${reps.map(c => c.content.slice(0, 14)).join(', ')})`);
  check(!reps.some(c => c.content.length > 990), 'каждый кусок повтора влезает в комментарий');
  const errBob = p.errors;
  await p.close();

  const o = await open('NeuroSFW');
  const openAdm = async () => {
    await o.click('.vp-fab-btn');
    await o.waitForTimeout(300);
    await o.$eval('.vp-fab [data-act="records"]', x => x.click());
    await o.waitForFunction(() => { const h = document.querySelector('.vp-lbadm .vp-admin-head span'); return h && !/загрузка/.test(h.textContent); }, null, { timeout: 20000 });
  };
  await openAdm();
  const rows = () => o.$$eval('.vp-lbadm-row', rs => rs.map(r => r.querySelector('a').textContent + ' ' + r.querySelector('.vp-lbadm-v').textContent + ' ' + r.querySelector('.vp-junk-meta').textContent));
  console.log('—    ' + (await rows()).join(' | '));
  check((await rows()).filter(x => /Боб .* есть повтор/.test(x)).length === 3, 'в админке у всех трёх рекордов bob «есть повтор»');
  await (await o.$('.vp-lbadm')).screenshot({ path: path.join(__dirname, 'out', 'gamesreplay-admin.png') });
  const verdicts = [];
  for (let i = 0; i < 3; i++) {
    await o.$$eval('.vp-lbadm-row', (rs, i) => [...rs[i].querySelectorAll('button')].find(x => /повтор/.test(x.textContent)).click(), i);
    await o.waitForSelector('.vp-rep');
    verdicts.push(await o.$eval('.vp-rep-verdict', x => x.textContent));
    if (i === 2) { await o.$eval('.vp-rep [data-s="4"]', x => x.click()); await o.waitForTimeout(1500); await (await o.$('.vp-rep-win')).screenshot({ path: path.join(__dirname, 'out', 'gamesreplay-view.png') }); }
    await o.$eval('.vp-rep .vp-admin-head button', x => x.click());
  }
  console.log('—    ' + verdicts.join(' | '));
  check(verdicts.every(v => /^Совпадает/.test(v)), 'повтор каждой игры переигрывается в тот же счёт — «Совпадает»');

  const rec = comments.find(c => c.author.id === BOB && /^ITDXG2 /.test(c.content));
  rec.content = await o.evaluate(v => window.__lbText(v), { s: 200, m: best.m, t: best.t });
  GM.bob[Object.keys(GM.bob).find(x => x.startsWith('vp_snake_best@'))] = 200;
  await o.$eval('.vp-lbadm .vp-admin-head button', x => x.click());
  await openAdm();
  await o.$$eval('.vp-lbadm-row', rs => [...rs.find(r => /200/.test(r.textContent)).querySelectorAll('button')].find(x => /повтор/.test(x.textContent)).click());
  await o.waitForSelector('.vp-rep');
  const fake = await o.$eval('.vp-rep-verdict', x => x.textContent);
  check(/^Не сходится: в топе 200/.test(fake), `подделанный рекорд змейки: «${fake}»`);
  await o.$eval('.vp-rep .vp-admin-head button', x => x.click());
  await o.$$eval('.vp-lbadm-row', rs => [...rs.find(r => /200/.test(r.textContent)).querySelectorAll('button')].find(x => /Убрать/.test(x.textContent)).click());
  await o.waitForTimeout(1500);
  check((await rows()).some(x => /Боб 200 убран из топа/.test(x)), 'после «Убрать из топа» строка помечена «убран из топа»');
  check(comments.some(c => c.author.id === OWNER && !/^ITDX/.test(c.content.replace(/^ITDXE /, 'x'))), 'метка владельца — в шифре');
  const errOwner = o.errors;
  await o.close();

  p = await open('bob');
  await p.waitForTimeout(3500);
  check(!gm('bob', 'vp_snake_best'), `у bob рекорд змейки на устройстве обнулился (${gm('bob', 'vp_snake_best')})`);
  check(gm('bob', 'vp_tetris_best') === best.t && gm('bob', 'vp_mines_best') === best.m, 'остальные его рекорды не тронуты');
  await p.$eval('.vp-game-row', x => x.click());
  await p.waitForTimeout(400);
  await p.$eval('.vp-games-tab[data-g="lead"]', x => x.click());
  await p.waitForTimeout(1500);
  const lead = await p.$eval('[data-lead="snake"]', x => x.textContent);
  check(!/200/.test(lead), `в «Топе задротов» змейки подделки нет (${lead.slice(0, 60)})`);
  await p.waitForTimeout(3000);
  const clean = await p.evaluate(v => window.__lbText(v), { m: best.m, t: best.t });
  check(rec.content === clean, 'у bob на сервере рекорд переписан без подделки (змейки нет, остальное как было)');
  const errBob2 = p.errors;
  await p.close();
  check(![...errBob, ...errOwner, ...errBob2].length, 'ошибок нет' + ([...errBob, ...errOwner, ...errBob2].length ? ': ' + [...errBob, ...errOwner, ...errBob2].join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
