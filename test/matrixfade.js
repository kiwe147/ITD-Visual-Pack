// Фон «Матрица» (3.3.13.11): символы гаснут до конца на любой частоте экрана, экран не забивается.
// Запуск:  node test/matrixfade.js снимок.html
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
  for (const hz of [60, 144]) {
    const p = await b.newPage({ viewport: { width: 1000, height: 700 } });
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.route('**/*', r => {
      const u = new URL(r.request().url()), t = r.request().resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: OWNER }) });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m, hz]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: true, backgroundStyle: 'matrix' };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
      let t = 0;
      window.requestAnimationFrame = cb => setTimeout(() => { t += 1000 / hz; cb(t); }, 2);
    }, [src.slice(0, src.indexOf('==/UserScript==')), hz]);
    await p.goto(ORIGIN + '/');
    await p.addScriptTag({ content: src });
    await p.waitForFunction(hz => { const c = document.querySelector('.vp-bg-canvas'); return c && c.width > 0; }, hz, { timeout: 10000 }).catch(() => { });
    const frames = hz * 25;
    await p.waitForTimeout(Math.round(frames * 2.6));
    const st = await p.evaluate(() => {
      const c = document.querySelector('.vp-bg-canvas');
      if (!c || !c.width) return null;
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let lit = 0, faint = 0, n = d.length / 4;
      for (let i = 3; i < d.length; i += 4) { if (d[i] > 8) lit++; if (d[i] > 0 && d[i] <= 40) faint++; }
      return { lit: +(lit / n * 100).toFixed(1), faint: +(faint / n * 100).toFixed(1), w: c.width };
    });
    console.log(`—    ${hz} Гц (~25 с экранного времени): ${JSON.stringify(st)}`);
    check(st && st.lit < 12, `${hz} Гц: закрашено заметно меньше 12% экрана (${st && st.lit}%) — дождик, а не сплошная стена`);
    await p.evaluate(() => { const c = document.querySelector('.vp-bg-canvas'); if (c) { c.style.opacity = '1'; c.style.zIndex = '99999'; c.style.background = '#000'; } });
    await p.screenshot({ path: path.join(__dirname, 'out', `matrix-${hz}${process.env.TAG || ''}.png`) });
    check(!errors.length, `${hz} Гц: ошибок нет` + (errors.length ? ': ' + errors.join(' | ') : ''));
    await p.close();
  }
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
