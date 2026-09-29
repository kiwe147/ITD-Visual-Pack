// «Назад» закрывает окна мода «Игры» и «Что нового» (3.3.8), страница остаётся та же; крестик — тоже
// убирает запись из истории (второе «назад» уводит на прошлую страницу, а не открывает окно).
// «Сообщения» (3.3.8): профиль → Сообщения → чат → «назад» — список диалогов → «назад» — профиль.
// Запуск:  node test/navmod.js снимок-ленты.html
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
  const fresh = async () => {
    const p = await b.newPage({ viewport: { width: 1700, height: 950 } });
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
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, src.slice(0, src.indexOf('==/UserScript==')));
    await p.goto(ORIGIN + '/@NeuroSFW');
    await p.evaluate(() => history.pushState({}, '', '/'));
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    return p;
  };
  const st = p => p.evaluate(() => ({ path: location.pathname, games: !!document.querySelector('.vp-games'), news: !!document.querySelector('.vp-news-back'),
    msgs: !!document.querySelector('.vp-msgs.vp-open'), chat: !!document.querySelector('.vp-msgs.vp-open .vp-msgs-chat:not([hidden])') }));
  const back = async p => { await p.goBack({ waitUntil: 'commit' }).catch(() => { }); await p.waitForTimeout(500); return st(p); };
  const fwd = async p => { await p.goForward({ waitUntil: 'commit' }).catch(() => { }); await p.waitForTimeout(500); return st(p); };
  const openNews = p => p.evaluate(() => { const c = document.querySelector('.vp-version-chip'); if (c) c.click(); return !!c; });

  let p = await fresh();
  await p.click('.vp-game-row >> nth=0'); await p.waitForTimeout(600);
  check((await st(p)).games, 'игры открыты');
  await p.goBack({ waitUntil: 'commit' }).catch(() => { }); await p.waitForTimeout(500);
  let s = await st(p);
  check(!s.games && s.path === '/', `«назад» — игры закрыты, страница та же ${JSON.stringify(s)}`);
  await p.goBack({ waitUntil: 'commit' }).catch(() => { }); await p.waitForTimeout(500);
  check((await st(p)).path === '/@NeuroSFW', 'ещё «назад» — прошлая страница');
  check(!p.errors.length, 'ошибок нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
  await p.close();

  p = await fresh();
  await p.click('.vp-game-row >> nth=0'); await p.waitForTimeout(600);
  await p.click('.vp-games-x'); await p.waitForTimeout(500);
  s = await st(p);
  check(!s.games && s.path === '/', 'крестик закрыл игры');
  await p.goBack({ waitUntil: 'commit' }).catch(() => { }); await p.waitForTimeout(500);
  s = await st(p);
  check(s.path === '/@NeuroSFW' && !s.games, `после крестика «назад» — сразу прошлая страница, игры не открылись ${JSON.stringify(s)}`);
  await p.close();

  p = await fresh();
  const hasChip = await openNews(p);
  await p.waitForTimeout(500);
  if (!hasChip) console.log('—    плашки версии на снимке нет — «Что нового» открываю напрямую не могу, пропуск');
  else {
    check((await st(p)).news, '«Что нового» открыто');
    await p.goBack({ waitUntil: 'commit' }).catch(() => { }); await p.waitForTimeout(500);
    s = await st(p);
    check(!s.news && s.path === '/', `«назад» — «Что нового» закрыто, страница та же ${JSON.stringify(s)}`);
    await openNews(p); await p.waitForTimeout(400);
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    await p.goBack({ waitUntil: 'commit' }).catch(() => { }); await p.waitForTimeout(500);
    s = await st(p);
    check(s.path === '/@NeuroSFW' && !s.news, `после Esc «назад» — сразу прошлая страница ${JSON.stringify(s)}`);
  }
  check(!p.errors.length, 'ошибок нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
  await p.close();

  console.log('— Сообщения: профиль → Сообщения → чат');
  p = await fresh();
  await p.evaluate(() => history.pushState({}, '', '/@NeuroSFW'));
  await p.$eval('nav a[href="#"]', a => a.click()); await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('.vp-msgs-row').click()); await p.waitForTimeout(500);
  s = await st(p);
  check(s.msgs && s.chat, `открыт чат ${JSON.stringify(s)}`);
  s = await back(p);
  check(s.msgs && !s.chat && s.path === '/@NeuroSFW', `«назад» из чата — список диалогов ${JSON.stringify(s)}`);
  s = await fwd(p);
  check(s.msgs && s.chat, `«вперёд» — снова тот же чат ${JSON.stringify(s)}`);
  s = await back(p);
  s = await back(p);
  check(!s.msgs && s.path === '/@NeuroSFW', `ещё «назад» — профиль, сообщения закрыты ${JSON.stringify(s)}`);
  s = await back(p);
  check(s.path === '/' && !s.msgs, `ещё «назад» — страница до профиля ${JSON.stringify(s)}`);
  check(!p.errors.length, 'ошибок нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
  await p.close();

  console.log('— Сообщения: чат → Esc → «назад»');
  p = await fresh();
  await p.$eval('nav a[href="#"]', a => a.click()); await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('.vp-msgs-row').click()); await p.waitForTimeout(500);
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  s = await st(p);
  check(s.msgs && !s.chat, `Esc — список диалогов ${JSON.stringify(s)}`);
  s = await back(p);
  check(!s.msgs && s.path === '/', `«назад» — сообщения закрыты, без лишнего нажатия ${JSON.stringify(s)}`);
  s = await back(p);
  check(s.path === '/@NeuroSFW', 'ещё «назад» — прошлая страница');
  await p.close();

  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
