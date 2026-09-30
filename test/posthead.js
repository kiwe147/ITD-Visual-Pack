// Шапка поста (3.3.13.9): время и значки у ника не заезжают под кнопки мода «Скопировать…» и «•••».
// Запуск:  node test/posthead.js снимок-с-постами.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  for (const [name, vp] of [['phone', { width: 412, height: 900 }], ['pc', { width: 1400, height: 900 }]]) {
    const p = await b.newPage({ viewport: vp, ...(name === 'phone' ? { isMobile: true, hasTouch: true } : {}) });
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.route('**/*', r => {
      const u = new URL(r.request().url()), t = r.request().resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: OWNER }) });
      if (u.pathname === '/api/posts/user/test') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: global.__posts || [] } }) });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(m => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, src.slice(0, src.indexOf('==/UserScript==')));
    await p.goto(ORIGIN + '/');
    await p.evaluate(() => {
      document.querySelectorAll('.vp-post-tools').forEach(e => e.remove());
      document.querySelectorAll('.vp-nick-row').forEach(r => r.style.removeProperty('padding-right'));
      const t = document.querySelectorAll('article header .vp-nick-text')[1];
      if (t) t.textContent = 'ОченьДлинныйНикКоторыйНеВлезаетВСтрокуНикак';
    });
    global.__posts = await p.evaluate(() => [...document.querySelectorAll('article[data-alice-water-anchor-id]')].map(a => {
      const l = a.querySelector('header a[href^="/@"]');
      const own = [...a.querySelectorAll('[data-post-tool-text]')].filter(t => !t.closest('.vp-repost')).map(t => t.textContent).join(' ');
      return { id: a.dataset.aliceWaterAnchorId, author: { username: l.getAttribute('href').slice(2) }, content: own, attachments: a.dataset.blurBg ? [{ url: a.dataset.blurBg }] : [] };
    }));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(800);
    await p.evaluate(() => fetch('/api/posts/user/test').then(r => r.text()));
    await p.waitForTimeout(3000);
    const rows = await p.evaluate(() => [...document.querySelectorAll('article')].map(a => {
      const tools = a.querySelector(':scope > .vp-post-tools'), h = a.querySelector('header'), t = h && h.querySelector('time');
      if (!tools || !t) return null;
      const tl = Math.min(...[...tools.children].map(x => x.getBoundingClientRect().left));
      const ends = [t, h.querySelector('.vp-nick-badges'), h.querySelector('.vp-nick-text')].filter(Boolean).map(x => x.getBoundingClientRect().right);
      return { nick: h.querySelector('.vp-nick-text').textContent.slice(0, 16), n: tools.children.length, end: Math.round(Math.max(...ends)), tools: Math.round(tl), sameLine: Math.abs(t.getBoundingClientRect().top - tools.getBoundingClientRect().top) < 30 };
    }).filter(Boolean));
    rows.forEach(r => console.log(`—    ${name}: ${JSON.stringify(r)}`));
    check(rows.length >= 3, `${name}: у постов есть кнопки мода (${rows.length})`);
    check(rows.every(r => r.end <= r.tools - 4), `${name}: ник, значки и время кончаются левее кнопок`);
    const shot = await p.$('article:has(> .vp-post-tools)');
    if (shot) await shot.screenshot({ path: path.join(__dirname, 'out', `posthead-${name}.png`) });
    check(!errors.length, `${name}: ошибок нет` + (errors.length ? ': ' + errors.join(' | ') : ''));
    await p.close();
  }
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
