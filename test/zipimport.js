// Паки из архива: кнопка в панели стикеров → карточка с правилами → архив → паки по папкам.
// Архивы — test/out/pack-utf8.zip (имена UTF-8, общая папка сверху, мусор macOS) и pack-dos.zip
// (как «Сжатая ZIP-папка» Windows: кириллица в DOS-кодировке, картинка в корне). Загрузка — заглушка.
// Запуск:  node test/zipimport.js снимок-поста.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const URL0 = 'https://xn--d1ah4a.com/@tester/post/p123';
const out = path.join(__dirname, 'out');
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const errors = [];
  let uploads = 0;
  p.on('pageerror', e => errors.push(e.message));
  p.on('dialog', d => d.accept());
  await p.route('**/*', r => {
    const u = r.request().url();
    if (u === URL0) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (u.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.endsWith('/api/users/me')) return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.endsWith('/api/files/upload')) { uploads++; return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: `f${uploads}`, url: `https://cdn.xn--d1ah4a.com/images/x${uploads}.png` }) }); }
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    localStorage.setItem('user_sticker_packs_v1', '[]');
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(URL0);
  await p.evaluate(() => document.querySelectorAll('.sticker-btn, .sticker-panel, #temp_sticker_preview, .vp-itdx-btn, .vp-fab').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(1500);
  await p.hover('.sticker-btn');
  await p.waitForTimeout(400);
  await p.click('.sticker-panel .vp-sp-tab[title="Паки из архива"]');
  await p.waitForTimeout(300);
  const card = await p.$('.vp-sp-import');
  check(!!card && /Папка в архиве = пак/.test(await card.textContent()), 'карточка с правилами открылась');
  await p.screenshot({ path: path.join(out, 'zip-card.png'), clip: await (await p.$('.sticker-panel')).boundingBox() });
  for (const f of ['pack-utf8.zip', 'pack-dos.zip']) {
    if (!(await p.$('.vp-sp-import'))) { await p.hover('.sticker-btn'); await p.waitForTimeout(300); await p.click('.sticker-panel .vp-sp-tab[title="Паки из архива"]'); }
    const [chooser] = await Promise.all([p.waitForEvent('filechooser'), p.click('.vp-sp-import .vp-imp-go')]);
    await chooser.setFiles(path.join(out, f));
    await p.waitForFunction(() => !document.querySelector('.vp-sp-import'), null, { timeout: 15000 }).catch(() => { });
  }
  const packs = await p.evaluate(() => JSON.parse(localStorage.getItem('user_sticker_packs_v1')).map(pk => pk.name + ':' + pk.stickers.length));
  console.log('—    паки: ' + packs.join(' | ') + `, загрузок ${uploads}`);
  check(JSON.stringify(packs) === JSON.stringify(['Коты:3', 'Мемы:1', 'Котики:2', 'pack-dos:1']), 'паки по папкам, общая папка и мусор пропущены, кириллица из архива Windows читается, корень — пак с именем архива');
  check(uploads === 7, `загружено картинок: ${uploads} (txt и файлы macOS не грузятся)`);
  await p.hover('.sticker-btn'); await p.waitForTimeout(400);
  const tabs = await p.$$eval('.sticker-panel .vp-sp-tabs button', bs => bs.length);
  check(tabs === 4, `вкладок паков в панели: ${tabs}`);
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
