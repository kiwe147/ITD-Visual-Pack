// Где на страницах остаются аватарки без подмены: все пользователи на странице получают аватарку мода, считаем авы сайта и мода, на которые подмена не легла.
// Запуск:  node test/avascan.js снимок1.html [снимок2.html ...]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const REF = '1' + 'abcdef01234567890abcdef012345678'.slice(0, 32);
(async () => {
  const b = await chromium.launch();
  for (const file of process.argv.slice(2)) {
    const snap = fs.readFileSync(file, 'utf8');
    const url = (snap.match(/"url": "([^"]+)"/) || [, ORIGIN + '/'])[1];
    const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.route('**/*', async r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.fulfill({ status: 404, body: '' });
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"scanner","id":"scanner-id","displayName":"S"}' });
      if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m, ref]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, vp_ver_at: Date.now() + 36e5 };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
      const fill = () => {
        const names = new Set();
        document.querySelectorAll('a[href^="/@"]').forEach(a => { const n = (a.getAttribute('href').split('/@')[1] || '').split(/[/?#]/)[0].toLowerCase(); if (n) names.add(n); });
        if (!names.size) return;
        const o = {};
        names.forEach(n => { o[n] = { code: 'x', hasMod: true, flags: '1', state: 'approved', id: 'id-' + n, displayName: n, look: { n: 'white', b: '-', g: '11', a: ref } }; });
        localStorage.setItem('itd_verified_users', JSON.stringify(o));
      };
      window.__fill = fill;
      document.addEventListener('DOMContentLoaded', fill);
    }, [src.slice(0, src.indexOf('==/UserScript==')), REF]);
    await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
    await p.goto(ORIGIN + new URL(url).pathname);
    await p.waitForTimeout(2500);
    await p.evaluate(() => { window.__fill(); document.body.appendChild(document.createElement('i')); });
    await p.waitForTimeout(2500);
    const club = await p.evaluate(() => [...document.querySelectorAll('.vp-club-row')].map(r => { const i = r.querySelector('.vp-club-ava img'); return i ? i.getAttribute('src') : (r.querySelector('.vp-club-ava') || {}).textContent; }));
    console.log('клуб:', club.length, 'строк, с картинкой мода', club.filter(x => /abcdef0123456789/.test(x || '')).length, club.slice(0, 2).join(' | ').slice(0, 160));
    const res = await p.evaluate(() => {
      const all = [...document.querySelectorAll('.vp-avatar')].filter(a => a.getBoundingClientRect().width > 0);
      const miss = all.filter(a => !a.hasAttribute('data-vp-ava'));
      const desc = a => { const chain = []; for (let e = a, i = 0; e && i < 4; e = e.parentElement, i++) chain.push(e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(/\s+/).slice(0, 2).join('.') : '')); return chain.join(' < '); };
      const groups = {};
      miss.forEach(a => { const k = desc(a); groups[k] = (groups[k] || 0) + 1; });
      return { total: all.length, covered: all.length - miss.length, groups };
    });
    console.log(path.basename(file), '→ всего авы сайта', res.total, 'с подменой', res.covered, errors.length ? 'ОШИБКИ ' + errors.join('|') : '');
    for (const [k, n] of Object.entries(res.groups)) console.log('   без подмены ' + n + ': ' + k);
    await ctx.close();
  }
  await b.close();
})();
