// Эмодзи в «Сообщениях» (3.3.8): окно по кнопке 🙂 — категории, «Недавние»; выбор вставляет в поле по месту
// курсора, счётчик обновляется, эмодзи попадает в «Недавние». Снимок → test/out/emoji-<тема>.png.
// Запуск:  node test/emoji.js снимок-ленты.html [стиль] [light]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [snapPath, list = 'default', theme = 'dark'] = process.argv.slice(2);
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
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
    await p.fill('.vp-msgs-bar input', 'Привет ');
    await p.click('.vp-msgs-emoji');
    await p.waitForTimeout(400);
    check(!!(await p.$('.vp-emoji')), 'кнопка 🙂 открыла окно эмодзи');
    const tabs = await p.$$eval('.vp-emoji-tabs button', bs => bs.length);
    check(tabs === 10, `вкладок категорий: ${tabs} (Недавние + 9)`);
    await p.screenshot({ path: path.join(__dirname, 'out', `emoji-${theme}.png`) });
    await p.click('.vp-emoji-grid button >> text=😂');
    await p.waitForTimeout(200);
    const v = await p.$eval('.vp-msgs-bar input', i => i.value);
    check(v === 'Привет 😂', `в поле: «${v}»`);
    const cnt = await p.$eval('.vp-msgs-count', e => e.textContent);
    check(cnt === `${v.length} / 500`, `счётчик: ${cnt}`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    check(!(await p.$('.vp-emoji')), 'Esc закрыл окно');
    await p.click('.vp-msgs-emoji'); await p.waitForTimeout(400);
    const rec = await p.$$eval('.vp-emoji-sec[data-k="0"] .vp-emoji-grid button', bs => bs.map(b => b.textContent));
    check(rec[0] === '😂', `в «Недавних»: ${rec.join(' ')}`);
    await p.mouse.click(5, 5); await p.waitForTimeout(300);
    check(!(await p.$('.vp-emoji')), 'нажатие мимо закрыло окно');
    await p.close();
  }
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
