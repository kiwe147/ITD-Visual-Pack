// Кнопки в шапке профиля на телефоне (3.3.14.1): «•••», кнопка ивента, «Редактировать», «ИТД X», «Меню» — ровными строками,
// по центру, ничего не съезжает вниз и не вылезает за экран.
// Запуск:  node test/profilebtns.js снимок-своего-профиля-с-телефона.html
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
  for (const w of [320, 360, 375, 412, 768]) {
    const p = await b.newPage({ viewport: { width: w, height: 800 }, isMobile: true, hasTouch: true });
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
    await p.goto(url);
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    const st = await p.evaluate(() => {
      const edit = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Редактировать');
      if (!edit) return null;
      let row = edit.parentElement;
      while (row && !row.querySelector(':scope > * button svg')) row = row.parentElement;
      const btns = [...row.querySelectorAll('button')].filter(x => { const r = x.getBoundingClientRect(), c = getComputedStyle(x); return r.width > 0 && c.display !== 'none' && c.visibility !== 'hidden'; });
      const rs = btns.map(x => { const r = x.getBoundingClientRect(); return { t: x.textContent.trim() || '(иконка)', l: Math.round(r.left), r: Math.round(r.right), cy: Math.round((r.top + r.bottom) / 2) }; });
      const lines = [...new Set(rs.map(r => r.cy))].sort((a, c) => a - c);
      const groups = []; rs.forEach(r => { const g = groups.find(g => Math.abs(g.cy - r.cy) <= 3); if (g) g.items.push(r); else groups.push({ cy: r.cy, items: [r] }); });
      const mid = innerWidth / 2;
      return {
        lines: groups.map(g => g.items.map(i => i.t).join(' ')),
        offCenter: Math.max(...groups.map(g => Math.abs((Math.min(...g.items.map(i => i.l)) + Math.max(...g.items.map(i => i.r))) / 2 - mid))),
        out: rs.some(r => r.l < 0 || r.r > innerWidth),
        rows: groups.length
      };
    });
    console.log(`—    ${w}: ${JSON.stringify(st)}`);
    check(st && !st.out, `${w}: кнопки в пределах экрана`);
    check(st && st.offCenter <= 12, `${w}: каждая строка кнопок по центру (сдвиг ${st && Math.round(st.offCenter)} px)`);
    check(st && st.lines.every(l => l.split(' ').length > 1 || st.rows === 1 || l === 'Меню'), `${w}: «•••» не остаётся одна на отдельной строке`);
    await p.evaluate(() => { const e = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Редактировать'); e && e.scrollIntoView({ block: 'center' }); });
    await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(__dirname, 'out', `profilebtns-${w}.png`), clip: { x: 0, y: 300, width: w, height: 260 } });
    check(!errors.length, `${w}: ошибок нет` + (errors.length ? ': ' + errors.join(' | ') : ''));
    await p.close();
  }
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
