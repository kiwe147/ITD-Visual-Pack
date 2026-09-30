// Правая панель мода (статистика, клуб) целиком на экране на разных ширинах ПК.
// Запуск:  node test/railfit.js снимок.html
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
  for (const w of (process.env.WIDTHS || '1200,1280,1400,1600,1920,2048').split(',').map(Number)) {
    const p = await b.newPage({ viewport: { width: w, height: 1000 } });
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
    }, src.slice(0, src.indexOf('==/UserScript==')));
    await p.goto(ORIGIN + '/');
    await p.evaluate(() => document.querySelectorAll('.vp-rail').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    const st = await p.evaluate(() => {
      const rails = [...document.querySelectorAll('.vp-rail')];
      const r = rails.find(x => getComputedStyle(x).display !== 'none');
      const q = r && r.getBoundingClientRect();
      return { rails: rails.length, shown: !!r, left: q && Math.round(q.left), right: q && Math.round(q.right), inline: r && r.getAttribute('style') };
    });
    console.log(`—    ${w}: ${JSON.stringify(st)}`);
    check(!st.shown || (st.left >= 0 && st.right <= w), `${w}: панель ${st.shown ? `${st.left}–${st.right}` : 'скрыта'} в пределах экрана`);
    check(st.rails <= 1, `${w}: панель одна (${st.rails})`);
    await p.screenshot({ path: path.join(__dirname, 'out', `railfit-${w}.png`) });
    await p.close();
  }
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
