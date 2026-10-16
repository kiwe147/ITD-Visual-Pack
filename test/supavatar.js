// Поддержка в списке чатов: красная аватарка со спасательным кругом и заметная карточка; в шапке чата аватарка та же.
// Запуск:  node test/supavatar.js снимок-ленты.html [светлая]   Снимок окна — test/out/supavatar.png
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const light = process.argv[3] === 'светлая';
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (t === 'image' || t === 'font') return r.abort();
    if (t === 'stylesheet') return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
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
    document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob, .vp-itdx-btn, .vp-msgs, .vp-gal').forEach(e => e.remove());
    document.querySelectorAll('style').forEach(st => { if (/vp-msgs-ava/.test(st.textContent)) st.remove(); });
  });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(1500);
  if (light) await p.evaluate(() => { document.documentElement.setAttribute('data-theme', 'light'); document.documentElement.classList.add('vp-light'); });
  await p.click('nav a[href="#"]');
  await p.waitForSelector('.vp-msgs.vp-open', { timeout: 5000 });
  await p.waitForTimeout(600);
  const row = await p.evaluate(() => {
    const r = document.querySelector('.vp-msgs-row.vp-sup');
    if (!r) return null;
    const a = r.querySelector('.vp-msgs-ava'), g = getComputedStyle(a), rg = getComputedStyle(r);
    return { ava: a.classList.contains('vp-sup'), svg: !!a.querySelector('svg'), bgA: g.backgroundImage, bgR: rg.backgroundImage, shadow: rg.boxShadow, name: r.querySelector('.vp-msgs-name').textContent.trim(), emoji: /🛟/.test(a.textContent) };
  });
  check(!!row, 'карточка поддержки есть в списке');
  check(row && row.ava && row.svg && !row.emoji, 'аватарка поддержки — белый спасательный круг вместо эмодзи');
  check(row && /255, 9\d, 9\d|ff5a5f/i.test(row.bgA) && /208, 32, 42/.test(row.bgA), 'фон аватарки красный (' + (row && row.bgA.slice(0, 60)) + ')');
  check(row && /rgba\(255, 70, 76/.test(row.bgR) && row.shadow !== 'none', 'у карточки заметный красноватый фон и тонкая рамка');
  const others = await p.evaluate(() => [...document.querySelectorAll('.vp-msgs-row:not(.vp-sup)')].length);
  console.log('остальных чатов в списке: ' + others);
  await p.screenshot({ path: path.join(__dirname, 'out', 'supavatar' + (light ? '-light' : '') + '.png'), clip: await (await p.$('.vp-msgs')).boundingBox() });
  await p.click('.vp-msgs-row.vp-sup');
  await p.waitForTimeout(500);
  const head = await p.evaluate(() => { const a = document.querySelector('.vp-msgs-chead .vp-msgs-ava'); return a && { sup: a.classList.contains('vp-sup'), svg: !!a.querySelector('svg') }; });
  check(head && head.sup && head.svg, 'в шапке чата поддержки та же красная аватарка');
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
