// Быстрая проверка скрипта на снимке страницы (файл из «Снимок для Claude»).
// Запуск:  node test/smoke.js путь/к/снимку.html [phone|desktop]
// Нужен Playwright с Chromium (NODE_PATH на глобальные модули или npm i playwright).
// Сайт по сети не нужен: снимок отдаётся вместо страницы, запросы к API — заглушки.
// Проверяет: скрипт запускается без ошибок, окно «ИТД X» открывается на всех вкладках
// и стоит на месте, кнопка «назад» закрывает окно сайта, админ-островок и его пункты.
// Скрины кладёт в test/out/. Снимки с чужими постами в репозиторий не добавлять.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const snapPath = process.argv[2];
const mode = process.argv[3] || 'phone';
if (!snapPath) { console.error('укажи снимок: node test/smoke.js снимок.html [phone|desktop]'); process.exit(2); }
const snap = fs.readFileSync(snapPath, 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const meta = src.slice(0, src.indexOf('==/UserScript=='));
const info = (snap.match(/<script type="application\/json" id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const pagePath = info ? new URL(JSON.parse(info).url).pathname : '/';
const URL0 = 'https://xn--d1ah4a.com' + pagePath;
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });

const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };

(async () => {
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await browser.newPage(mode === 'desktop'
    ? { viewport: { width: 1280, height: 860 } }
    : { viewport: { width: 392, height: 812 }, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.endsWith('/api/users/me')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: '#NeuroSFW | ЧБ' }) });
    if (u === URL0) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off' };
    window.GM_getValue = (k, d) => k in s ? s[k] : d;
    window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('offline'), 0);
    window.GM_info = { script: { version: 'test' }, scriptMetaStr: m };
    window.unsafeWindow = window;
  }, meta);
  await p.goto(URL0);
  // в снимке уже есть следы мода (он снят с работающим скриптом) — убираем элементы, которые скрипт создаёт сам
  await p.evaluate(() => document.querySelectorAll('.vp-nav-blob, .vp-fab, .vp-fps, .settings-dropdown, .nick-controls-panel, .vp-itdx-btn, .vp-msgs').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: path.join(out, mode + '-page.png') });

  // окно «ИТД X»: все вкладки, одно место и размер
  const opener = await p.$('.vp-itdx-btn') || await p.$('.settings-toggle');
  if (opener) {
    // кнопку может закрывать открытое на снимке окно сайта (например, список подписчиков) — жмём напрямую
    await opener.evaluate(b => { b.scrollIntoView({ block: 'center' }); b.click(); });
    await p.waitForTimeout(300);
    const boxes = [];
    for (const tab of await p.$$eval('.vp-stab', els => els.map(e => e.dataset.tab))) {
      await p.$eval(`.vp-stab[data-tab="${tab}"]`, b => b.click());
      await p.waitForTimeout(200);
      boxes.push(await p.evaluate(() => { const r = document.querySelector('.vp-settings-tabs').getBoundingClientRect(); return Math.round(r.top) + '/' + Math.round(r.height); }));
      await p.screenshot({ path: path.join(out, `${mode}-menu-${tab}.png`) });
    }
    check(boxes.length > 0 && boxes.every(b => b === boxes[0]), `окно ИТД X не прыгает (${boxes.join(' ')})`);
    await p.keyboard.press('Escape');
    await p.mouse.click(5, 5);
  } else console.log('—    кнопки ИТД X на этой странице нет (не свой профиль) — окно не проверяю');

  // «Анти цензура»: картинка из поля выбора, перетаскивания и XHR уходит как .gif,
  // выключатель в окне «ИТД X» действует сразу, без перезагрузки
  const antiCensor = async () => {
    await p.evaluate(() => {
      document.querySelectorAll('.vpTestFile').forEach(e => e.remove());
      const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.className = 'vpTestFile';
      i.addEventListener('change', () => { window.__picked = [...i.files].map(f => f.name + ' ' + f.type).join(); });
      const d = document.createElement('div'); d.className = 'vpTestFile';
      d.addEventListener('drop', e => { window.__dropped = [...e.dataTransfer.files].map(f => f.name + ' ' + f.type).join(); });
      document.body.append(i, d);
    });
    await p.setInputFiles('input.vpTestFile', { name: 'a.png', mimeType: 'image/png', buffer: Buffer.from('x') });
    await p.evaluate(() => {
      const dt = new DataTransfer(); dt.items.add(new File(['x'], 'c.webp', { type: 'image/webp' }));
      document.querySelector('div.vpTestFile').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
    });
    const sent = p.waitForRequest(r => r.url().endsWith('/vp-test-upload'));
    await p.evaluate(() => {
      const f = new FormData(); f.append('file', new File(['x'], 'b.jpg', { type: 'image/jpeg' }));
      const x = new XMLHttpRequest(); x.open('POST', '/vp-test-upload'); x.send(f);
    });
    const body = (await sent).postDataBuffer().toString();
    return { pick: await p.evaluate(() => window.__picked), drop: await p.evaluate(() => window.__dropped), xhr: (body.match(/filename="([^"]+)"[\s\S]*?Content-Type: (\S+)/) || []).slice(1).join(' ') };
  };
  const ac = await antiCensor();
  check(ac.pick === 'a.gif image/gif' && ac.drop === 'c.gif image/gif' && ac.xhr === 'b.gif image/gif', `анти цензура вкл: всё уходит .gif (${ac.pick} | ${ac.drop} | ${ac.xhr})`);
  if (opener) {
    const toggleAC = async () => {
      await opener.evaluate(b => b.click()); await p.waitForTimeout(300);
      await p.$eval('.vp-stab[data-tab="misc"]', b => b.click()); await p.waitForTimeout(200);
      await p.$$eval('.settings-option', rows => rows.find(r => r.textContent.includes('Анти цензура')).click());
      await p.keyboard.press('Escape'); await p.mouse.click(5, 5); await p.waitForTimeout(200);
    };
    await toggleAC();
    const off = await antiCensor();
    check(off.pick === 'a.png image/png' && off.drop === 'c.webp image/webp' && off.xhr === 'b.jpg image/jpeg', `анти цензура выкл: файлы как есть (${off.pick} | ${off.drop} | ${off.xhr})`);
    await toggleAC();
  }
  await p.evaluate(() => document.querySelectorAll('.vpTestFile').forEach(e => e.remove()));

  // «назад» закрывает окно сайта
  await p.evaluate(() => {
    const st = document.createElement('style'); st.textContent = '.vpTestOverlay{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.4)}'; document.head.appendChild(st);
    const b = document.createElement('div'); b.className = 'vpTestOverlay'; b.id = 'vpTest';
    b.innerHTML = '<div style="height:70vh"></div>'; b.addEventListener('click', e => { if (e.target === b) b.remove(); });
    document.body.appendChild(b);
  });
  await p.waitForTimeout(400);
  await p.goBack();
  await p.waitForTimeout(600);
  check(!(await p.$('#vpTest')) && new URL(p.url()).pathname === pagePath, '«назад» закрывает окно сайта и не уходит со страницы');

  // админ-островок
  const fab = await p.$('.vp-fab');
  check(!!fab, 'админ-островок на месте');
  if (fab) {
    await p.click('.vp-fab-btn'); await p.waitForTimeout(300);
    await p.click('[data-act="diag"]'); await p.waitForTimeout(300);
    check(!!(await p.$('.vp-admin-panel')), 'диагностика открывается');
    await p.screenshot({ path: path.join(out, mode + '-diag.png') });
  }

  check(errors.length === 0, 'ошибок на странице нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
