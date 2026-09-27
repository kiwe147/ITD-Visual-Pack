// Окно «Сообщения»: вид (карточка на компьютере), пункты меню до и после открытия (не должны тускнеть),
// прокрутка над окном не двигает страницу. Скрин — test/out/msgs-<тема>-<метка>.png.
// Запуск:  node test/messages.js снимок.html [dark|light] [файл скрипта]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const theme = process.argv[3] || 'dark';
const srcPath = process.argv[4] || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js');
const src = fs.readFileSync(srcPath, 'utf8');
const tag = process.argv[4] ? path.basename(srcPath, '.js') : 'new';
const info = (snap.match(/<script type="application\/json" id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const URL0 = 'https://xn--d1ah4a.com' + (info ? new URL(JSON.parse(info).url).pathname : '/');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/*', r => { const u = r.request().url(), t = r.request().resourceType();
    if (u.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.endsWith('/api/users/me')) return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","displayName":"#NeuroSFW | ЧБ"}' });
    if (u === URL0) return r.fulfill({ contentType: 'text/html', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    return r.fulfill({ status: 404, body: '' }); });
  await p.addInitScript(m => { const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window; }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(URL0);
  await p.evaluate(th => {
    document.querySelectorAll('.vp-msgs, .vp-nav-blob, .vp-fab, .vp-rail').forEach(e => e.remove());
    document.querySelectorAll('nav a[href="#"]').forEach(e => e.remove());
    if (th === 'light') document.documentElement.setAttribute('data-theme', 'light'); else document.documentElement.setAttribute('data-theme', 'dark');
  }, theme);
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2000);
  const navLook = () => p.$$eval('nav .vp-nav-link', as => as.map(a => { const g = getComputedStyle(a); return (a.getAttribute('href') || '').slice(0, 10) + ' ' + g.color + ' ' + g.opacity; }).join(' | '));
  const before = await navLook();
  await p.$eval('nav a[href="#"]', a => a.click());
  await p.waitForTimeout(800);
  const after = await navLook();
  await p.screenshot({ path: path.join(__dirname, 'out', `msgs-${theme}-${tag}.png`) });
  // прокрутка колесом над шапкой окна: страница не двигается
  const sc = () => p.evaluate(() => [document.getElementById('root')?.scrollTop || 0, scrollY].join(','));
  const s0 = await sc();
  const box = await p.$eval('.vp-msgs-top', e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(box.x, box.y); await p.mouse.wheel(0, 600); await p.waitForTimeout(400);
  const s1 = await sc();
  console.log(`меню до:    ${before}\nменю после: ${after}\nпрокрутка страницы: ${s0} → ${s1}${errs.length ? '\nошибки: ' + errs.join(' | ') : ''}`);
  await b.close();
})();
