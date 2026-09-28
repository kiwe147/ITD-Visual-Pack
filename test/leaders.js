// Лидерборд игр: таблица из комментариев служебного поста; свой рекорд лучше, чем на сервере, — правка своего
// комментария (не новый: новый шлёт уведомление); своего нет — один новый. Сервер не понижаем.
// Запуск:  node test/leaders.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com', POST = 'd5f8b7c0-b97d-40cd-bdd4-3c07b3ea0611';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  for (const [name, comments, expect] of [
    ['свой есть', [{ id: 'c1', author: { id: 'u2', username: 'bob', displayName: 'Боб' }, content: 'ITDXG s40 t900' }, { id: 'c2', author: { id: 'u1', username: 'NeuroSFW' }, content: 'ITDXG s10 t5000' }], { method: 'PATCH', path: '/api/comments/c2', text: 'ITDXG s26 t5000' }],
    ['своего нет', [{ id: 'c1', author: { id: 'u2', username: 'bob', displayName: 'Боб' }, content: 'ITDXG s40' }], { method: 'POST', path: `/api/posts/${POST}/comments`, text: 'ITDXG s26' }]]) {
    const p = await b.newPage({ viewport: { width: 1700, height: 950 } });
    const errors = [], writes = [];
    let list = comments.map(c => ({ ...c }));
    p.on('pageerror', e => errors.push(e.message));
    await p.route('**/*', r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
      if (u.pathname === `/api/posts/${POST}/comments` && req.method() === 'GET') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { comments: list, hasMore: false } }) });
      if (req.method() === 'PATCH' || (req.method() === 'POST' && u.pathname.endsWith('/comments'))) {
        const text = JSON.parse(req.postData() || '{}').content;
        writes.push({ method: req.method(), path: u.pathname, text });
        if (req.method() === 'PATCH') list = list.map(c => c.id === u.pathname.split('/').pop() ? { ...c, content: text } : c);
        else list = [...list, { id: 'new', author: { id: 'u1', username: 'NeuroSFW' }, content: text }];
        return r.fulfill({ contentType: 'application/json', body: '{}' });
      }
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(m => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, vp_snake_best: 26 };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, src.slice(0, src.indexOf('==/UserScript==')));
    await p.goto(ORIGIN + '/');
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    await p.click('.vp-game-row >> nth=0');
    await p.waitForTimeout(3500);
    await p.click('.vp-games-tab[data-g="lead"]');
    await p.waitForTimeout(800);
    console.log(`—    ${name}: запись ${JSON.stringify(writes)}`);
    check(writes.length === 1 && writes[0].method === expect.method && writes[0].path === expect.path && writes[0].text === expect.text,
      `${name}: ${expect.method === 'PATCH' ? 'правка своего комментария' : 'один новый комментарий'} «${expect.text}»`);
    const rows = await p.$$eval('[data-lead="snake"] .vp-games-lead-row', rs => rs.map(r => r.textContent + (r.classList.contains('vp-me') ? ' ←ты' : '')));
    console.log(`—    таблица: ${rows.join(' | ')}`);
    check(rows.length === 2 && /Боб40/.test(rows[0]) && /26 ←ты/.test(rows[1]), `${name}: таблица — Боб 40 первый, ты 26 вторым и подсвечен`);
    check(!errors.length, `${name}: ошибок нет` + (errors.length ? ': ' + errors.join(' | ') : ''));
    await p.close();
  }
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
