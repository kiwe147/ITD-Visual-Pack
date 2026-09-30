// Ник в шапке поста, разметка сайта с 30.09 (3.3.14.2): текст ника и галочка ИТД X в одной строке, галочка сразу после ника.
// Запуск:  node test/postnick.js снимок-с-постами-potato151.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const url = (snap.match(/"url": "([^"]+)"/) || [, ORIGIN + '/'])[1];
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  for (const [name, vp] of [['pc', { width: 1400, height: 900 }], ['phone', { width: 412, height: 900 }]]) {
    const p = await b.newPage({ viewport: vp, ...(name === 'phone' ? { isMobile: true, hasTouch: true } : {}) });
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.route('**/*', r => {
      const u = new URL(r.request().url()), t = r.request().resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: OWNER }) });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(m => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
      try { localStorage.setItem('itd_verified_users', JSON.stringify({ potato151: { state: 'approved', id: '46e9efb3-a219-451e-85f8-89a89788774a' } })); } catch (e) { }
    }, src.slice(0, src.indexOf('==/UserScript==')));
    await p.goto(url);
    await p.evaluate(() => {
      document.querySelectorAll('.mod-badge-verify, .vp-post-tools, .vp-rail').forEach(e => e.remove());
      document.querySelectorAll('.vp-nick-badges').forEach(e => e.classList.remove('vp-nick-badges'));
    });
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    const rows = await p.evaluate(() => [...document.querySelectorAll('article header .vp-nick')].map(n => {
      const t = n.querySelector('.vp-nick-text'), bd = n.querySelector('.mod-badge-verify');
      if (!t || !bd) return null;
      const tr = t.getBoundingClientRect(), br = bd.getBoundingClientRect();
      const wrap = t.parentElement;
      return { nick: t.textContent, same: Math.abs((tr.top + tr.bottom) / 2 - (br.top + br.bottom) / 2) < 5, gap: Math.round(br.left - tr.right), wrapBadges: wrap !== n && wrap.classList.contains('vp-nick-badges'), wrapDisplay: getComputedStyle(wrap).display };
    }).filter(Boolean));
    console.log(`—    ${name}: ${rows.length} ников с галочкой; первый ${JSON.stringify(rows[0])}`);
    check(rows.length >= 3, `${name}: галочка ИТД X есть у постов potatik (${rows.length})`);
    check(rows.every(r => r.same && r.gap >= 0 && r.gap <= 10), `${name}: галочка сразу после ника на той же строке`);
    check(rows.every(r => !r.wrapBadges), `${name}: обёртка текста ника не принята за «значки»`);
    const h = await p.$('article header');
    if (h) await h.screenshot({ path: path.join(__dirname, 'out', `postnick-${name}.png`) });
    check(!errors.length, `${name}: ошибок нет` + (errors.length ? ': ' + errors.join(' | ') : ''));
    await p.close();
  }
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
