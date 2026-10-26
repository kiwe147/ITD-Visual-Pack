const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com', OWNER = '5e064703-104d-4794-bc28-9ed6f5847cca';
(async () => {
  const b = await chromium.launch();
  for (const [file, how] of [[process.argv[2], 'nav'], [process.argv[3], 'write'], [process.argv[3], 'nav']]) {
    const snap = fs.readFileSync(file, 'utf8');
    const info = (snap.match(/id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
    const pagePath = info ? new URL(JSON.parse(info).url).pathname : '/';
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    await p.route('**/*', r => {
      const u = new URL(r.request().url()), t = r.request().resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (t === 'image' || t === 'font') return r.abort();
      if (t === 'stylesheet') return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: OWNER }) });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m, v]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
      localStorage.setItem('itd_verified_users', JSON.stringify(v));
    }, [src.slice(0, src.indexOf('==/UserScript==')), { NeuroSFW: { code: 'x', hasMod: true, id: OWNER, state: 'approved' }, voplex: { code: 'x', hasMod: true, id: 'u9', state: 'approved' } }]);
    await p.goto(ORIGIN + pagePath);
    await p.evaluate(() => document.querySelectorAll('.vp-msgs, .vp-nav-blob, .vp-fab, .vp-rail, .vp-write-btn').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    if (how === 'write') await p.evaluate(() => document.querySelector('.vp-write-btn').click()); else await p.dispatchEvent('nav a[href="#"]', 'click');
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => { const a = document.querySelector('nav a[href="#"]'); const cs = e => { const g = getComputedStyle(e); return e.tagName + '.' + [...e.classList].join('.') + ' color=' + g.color + ' op=' + g.opacity + ' w=' + g.fontWeight; }; const nav = a.closest('nav'); return { a: cs(a), kids: [...a.querySelectorAll('*')].map(cs), vars: ['--vp-on-c', '--vp-on-o', '--vp-off-c', '--vp-off-o'].map(k => k + '=' + nav.style.getPropertyValue(k)), path: location.pathname, others: [...nav.querySelectorAll('a')].map(x => x.getAttribute('href') + ':' + [...x.classList].filter(c => /active|cur/.test(c)).join('.') ) }; });
    console.log(how, pagePath, JSON.stringify(r, null, 1));
    await ctx.close();
  }
  await b.close();
})();
