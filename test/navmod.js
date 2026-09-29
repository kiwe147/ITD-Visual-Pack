// «Назад» закрывает окна мода «Игры» и «Что нового» (3.3.7.3), страница остаётся та же; крестик — тоже
// убирает запись из истории (второе «назад» уводит на прошлую страницу, а не открывает окно).
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
  const st = p => p.evaluate(() => ({ path: location.pathname, games: !!document.querySelector('.vp-games'), news: !!document.querySelector('.vp-news-back') }));
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

  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
