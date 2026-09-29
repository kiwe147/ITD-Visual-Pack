// Рекорды на двух устройствах одного человека (ПК и телефон, у каждого своё хранилище GM, сервер общий).
// А: ПК 40 → телефон 65 → ПК зашёл снова — у ПК 65. Б: телефон 65 → ПК 40 — сервер не понижается, у ПК 65.
// В: сапёр (меньше — лучше): ПК 0:50, телефон 0:40 — везде 0:40.
// Запуск:  node test/lbdevices.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com', POST = 'd5f8b7c0-b97d-40cd-bdd4-3c07b3ea0611';
const LB_KEY = src.match(/const LB_KEY = '([^']+)'/)[1];
const xor = buf => { const k = Buffer.from(LB_KEY); return Buffer.from(buf.map((b, i) => b ^ k[i % k.length])); };
const dec = t => t && t.startsWith('ITDXG2 ') ? xor(Buffer.from(t.slice(7).replace(/-/g, '+').replace(/_/g, '/'), 'base64')).toString() : t;
const me = { id: 'u1', username: 'NeuroSFW' };
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
let server = [];

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const device = async (store, openGames) => {
    const p = await b.newPage({ viewport: { width: 1700, height: 950 } });
    p.errors = [];
    p.on('pageerror', e => p.errors.push(e.message));
    await p.route('**/*', r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify(me) });
      if (u.pathname === `/api/posts/${POST}/comments` && req.method() === 'GET') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { comments: server, hasMore: false } }) });
      if (req.method() === 'PATCH' || (req.method() === 'POST' && u.pathname.endsWith('/comments'))) {
        const text = JSON.parse(req.postData() || '{}').content;
        if (req.method() === 'PATCH') server = server.map(c => c.id === u.pathname.split('/').pop() ? { ...c, content: text } : c);
        else server = [...server, { id: 'c' + server.length, author: me, content: text }];
        return r.fulfill({ contentType: 'application/json', body: '{}' });
      }
      return r.fulfill({ status: 404, body: '' });
    });
    await p.exposeFunction('__gmSave', (k, v) => { store[k] = v; });
    await p.addInitScript(([m, s0]) => {
      const s = Object.assign({ introEnabled: false, introMobile: 'off', backgroundEnabled: false }, s0);
      window.GM_getValue = (k, d) => k in s ? s[k] : d;
      window.GM_setValue = (k, v) => { s[k] = v; window.__gmSave(k, v); };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, [src.slice(0, src.indexOf('==/UserScript==')), store]);
    await p.goto(ORIGIN + '/');
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    if (openGames) { await p.click('.vp-game-row >> nth=0'); await p.waitForTimeout(3500); }
    check(!p.errors.length, 'ошибок нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
    await p.close();
  };
  const onServer = () => dec((server.find(c => c.author.id === me.id) || {}).content || '');

  console.log('— А: ПК 40, потом телефон 65, потом ПК заходит снова');
  server = [];
  const pcA = { vp_snake_best: 40 }, phA = { vp_snake_best: 65 };
  await device(pcA, true);
  check(onServer() === 'ITDXG s40', `ПК отправил 40 — на сервере «${onServer()}»`);
  await device(phA, true);
  check(onServer() === 'ITDXG s65', `телефон отправил 65 — на сервере «${onServer()}»`);
  await device(pcA, false);
  check(pcA.vp_snake_best === 65, `ПК зашёл снова — рекорд на ПК ${pcA.vp_snake_best} (ждём 65)`);
  check(phA.vp_snake_best === 65, `на телефоне ${phA.vp_snake_best} (ждём 65)`);

  console.log('— Б: телефон 65, потом ПК 40');
  server = [];
  const pcB = { vp_snake_best: 40 }, phB = { vp_snake_best: 65 };
  await device(phB, true);
  await device(pcB, true);
  check(onServer() === 'ITDXG s65', `ПК с 40 не понизил сервер — на сервере «${onServer()}»`);
  check(pcB.vp_snake_best === 65, `на ПК стало ${pcB.vp_snake_best} (ждём 65)`);

  console.log('— В: сапёр, меньше — лучше: ПК 0:50, телефон 0:40');
  server = [];
  const pcC = { vp_mines_best: 50 }, phC = { vp_mines_best: 40 };
  await device(pcC, true);
  await device(phC, true);
  await device(pcC, false);
  check(onServer() === 'ITDXG m40', `на сервере «${onServer()}» (ждём m40)`);
  check(pcC.vp_mines_best === 40, `на ПК ${pcC.vp_mines_best} с (ждём 40)`);

  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
