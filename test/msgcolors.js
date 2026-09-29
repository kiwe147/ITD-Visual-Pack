// Цвета «Сообщений» на разных стилях ника: свой пузырь (подкрашен стилем), чужой, кнопка «Отправить»
// (текст на акценте — тёмный или белый по яркости акцента). Снимки → test/out/msgcolors-<стиль>.png.
// Запуск:  node test/msgcolors.js снимок-ленты.html [стиль,стиль…] [light]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [snapPath, list = 'fire,gold,purpleMystic,default,white,matrix', theme = 'dark'] = process.argv.slice(2);
let snap = fs.readFileSync(snapPath, 'utf8');
if (theme === 'light') snap = snap.replace(/data-theme="dark"/g, '');
else if (!/<html[^>]*data-theme="dark"/.test(snap)) snap = snap.replace(/<html/, '<html data-theme="dark"');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const cssDir = path.join(__dirname, '..', '..', 'ITD', 'CSS');
if (fs.existsSync(cssDir)) snap = snap.replace('</head>', fs.readdirSync(cssDir).filter(f => f.endsWith('.css')).map(f => '<style>' + fs.readFileSync(path.join(cssDir, f), 'utf8') + '</style>').join('') + '</head>');
const ORIGIN = 'https://xn--d1ah4a.com';
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  for (const style of list.split(',')) {
    const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
    await p.route('**/*', r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m, st, th]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, nickStyle: st, siteTheme: th };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, [src.slice(0, src.indexOf('==/UserScript==')), style, theme]);
    await p.goto(ORIGIN + '/');
    await p.evaluate(th => { document.documentElement.setAttribute('data-theme', th); try { localStorage.setItem('theme', th); } catch (e) { } }, theme);
    await p.evaluate(() => document.querySelectorAll('.vp-msgs, .vp-nav-blob, .vp-fab, .vp-rail').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    await p.$eval('nav a[href="#"]', a => a.click());
    await p.waitForTimeout(700);
    await p.evaluate(() => document.querySelector('.vp-msgs-row').click());
    await p.waitForTimeout(700);
    await p.evaluate(() => {
      const feed = document.querySelector('.vp-msgs-feed');
      feed.innerHTML = '';
      const add = (dir, t, meta) => { const d = document.createElement('div'); d.className = 'vp-msgs-b vp-' + dir; d.textContent = t; const i = document.createElement('i'); i.textContent = meta; d.appendChild(i); feed.appendChild(d); };
      add('in', 'Привет! Как дела?', '19:25');
      add('out', 'Нормально, делаю мод', '19:27 ✓');
      add('in', 'Покажешь?', '19:32');
      add('out', 'Как дела? Вот так выглядит длинное сообщение в две строки, чтобы проверить перенос', '15:09 ✓');
      const inp = document.querySelector('.vp-msgs-bar input'); inp.disabled = false; inp.value = 'Черновик';
      document.querySelector('.vp-msgs-send').disabled = false;
    });
    await p.waitForTimeout(300);
    const box = await p.$('.vp-msgs');
    const out = path.join(__dirname, 'out', `msgcolors-${theme}-${style}.png`);
    await (box || p).screenshot({ path: out });
    const onAcc = await p.evaluate(() => { const cs = getComputedStyle(document.documentElement); return cs.getPropertyValue('--vp-on-accent') + ' | акцент ' + cs.getPropertyValue('--vp-accent') + ' | тема ' + document.documentElement.getAttribute('data-theme') + ' | light-класс ' + document.documentElement.classList.contains('vp-light') + ' | фон ' + getComputedStyle(document.body).backgroundColor; });
    console.log(style, theme, 'текст на акценте:', onAcc.trim(), '→', out);
    await p.close();
  }
  await b.close();
})();
