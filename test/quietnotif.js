// Уведомления о служебных постах (галочки, стикеры, личка, лидерборд): из живого потока сайта
// (/api/notifications/stream) выкидываются — нет всплывашки и звука; остальные проходят как есть.
// Запуск:  node test/quietnotif.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const ev = (id, post, text) => `event: notification\ndata: ${JSON.stringify({ id, type: 'comment', entityId: 'c-' + id, parentEntityId: post, sound: true, payload: { actors: [{ username: 'bob' }], preview: text } })}\n\n`;
const STREAM = ': ping\n\n' + ev('n1', 'a0d6625a-b3ec-44c4-98da-48422af101d5', 'код галочки') + ev('n2', '11111111-2222-4333-8444-555555555555', 'обычный коммент')
  + ev('n3', 'd5f8b7c0-b97d-40cd-bdd4-3c07b3ea0611', 'ITDXG s26');
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage();
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (u.pathname === '/api/notifications/stream') return r.fulfill({ contentType: 'text/event-stream', body: STREAM });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(1000);
  // сайт читает поток так же: fetch → body.getReader() → текст
  const got = await p.evaluate(async () => {
    const r = await fetch('/api/notifications/stream', { headers: { Accept: 'text/event-stream' } });
    const rd = r.body.getReader(), dec = new TextDecoder();
    let t = '';
    for (;;) { const { done, value } = await rd.read(); if (done) break; t += dec.decode(value, { stream: true }); }
    return t;
  });
  const ids = [...got.matchAll(/"id":"(n\d)"/g)].map(m => m[1]);
  console.log('—    прошли: ' + ids.join(', '));
  const ok = ids.join(',') === 'n2' && got.includes(': ping');
  console.log((ok ? 'ок   ' : 'ОШИБКА ') + 'служебные (галочки, лидерборд) выкинуты, обычное и пинг прошли');
  await b.close();
  console.log(ok ? '\nВсё прошло' : '\nНе прошло: 1');
  process.exit(ok ? 0 : 1);
})();
