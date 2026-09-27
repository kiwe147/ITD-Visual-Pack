// Стикеры: панель, режим правки, прикреплённый стикер, обрезка, отправка — на снимке открытого поста.
// Запуск:  node test/stickers.js снимок-поста.html [phone|desktop] [файл скрипта]
// Паки подкладываются в localStorage (картинки — цветные квадраты), страница — по адресу /post/…,
// запросы сайта — заглушки. Скрины — test/out/st-<режим>-*.png: для «было/стало» запустить со старым
// файлом скрипта и сравнить (python не нужен: печатаются и числа).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const snap = fs.readFileSync(process.argv[2], 'utf8');
const mode = process.argv[3] || 'desktop';
const srcPath = process.argv[4] || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js');
const src = fs.readFileSync(srcPath, 'utf8');
const tag = process.argv[4] ? path.basename(srcPath, '.js') : 'new';
const URL0 = 'https://xn--d1ah4a.com/@tester/post/p123';
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const square = c => 'data:image/svg+xml;base64,' + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="12" fill="${c}"/></svg>`).toString('base64');

(async () => {
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await browser.newPage(mode === 'desktop'
    ? { viewport: { width: 1280, height: 860 } }
    : { viewport: { width: 392, height: 812 }, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true });
  const errors = [], comments = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('dialog', d => d.accept());
  await p.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.endsWith('/api/users/me')) return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","displayName":"NeuroSFW"}' });
    if (u.endsWith('/api/files/upload')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'up1', url: square('#e91e63') }) });
    if (/\/api\/posts\/[^/]+\/comments$/.test(u) && r.request().method() === 'POST') {
      const body = r.request().postData();
      comments.push(u.split('/api/posts/')[1].split('/')[0] + ' ' + body);
      // s3 — «чужой» файл: сайт пускает во вложения только свои
      if (body.includes('"s3"')) return r.fulfill({ status: 403, contentType: 'application/json', body: '{"error":{"code":"FORBIDDEN","message":"Некоторые файлы не принадлежат вам"}}' });
      return r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"test"}' });
    }
    if (u === URL0) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    return r.fulfill({ status: 404, body: '' });
  });
  const packs = [
    { id: 'user_1', name: 'Коты', stickers: ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0'].map((c, i) => ({ id: 's' + i, url: square(c) })) },
    { id: 'user_2', name: '', stickers: [] }
  ];
  await p.addInitScript(([m, packs, recent]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d;
    window.GM_setValue = (k, v) => { s[k] = v; };
    // картинки стикеров (data:) Tampermonkey «скачивает» — остальное офлайн
    window.GM_xmlhttpRequest = o => o.url.startsWith('data:')
      ? setTimeout(() => { const [h, d] = o.url.split(','); const bin = atob(d); o.onload({ status: 200, response: new Blob([Uint8Array.from(bin, c => c.charCodeAt(0))], { type: h.slice(5).split(';')[0] }) }); }, 0)
      : setTimeout(() => o.onerror && o.onerror('offline'), 0);
    window.GM_info = { script: { version: 'test' }, scriptMetaStr: m };
    window.unsafeWindow = window;
    localStorage.setItem('user_sticker_packs_v1', JSON.stringify(packs));
    localStorage.setItem('recent_stickers_v1', JSON.stringify(recent));
  }, [src.slice(0, src.indexOf('==/UserScript==')), packs, [{ id: 'r0', url: square('#00bcd4') }]]);
  await p.goto(URL0);
  await p.evaluate(() => document.querySelectorAll('.sticker-btn, .sticker-panel, #temp_sticker_preview, .vp-itdx-btn, .vp-fab').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(1500);
  // панель полупрозрачная: под ней страница, а она у сравниваемых версий разная — на время снимка
  // панели страницу прячем, остаётся ровный фон
  const shot = async (name, sel) => {
    const box = sel && await p.$(sel);
    const flat = sel === '.sticker-panel' && await p.addStyleTag({ content: 'body *:not(.sticker-panel, .sticker-panel *) { visibility: hidden !important; } body { background: #777 !important; }' });
    await p.screenshot({ path: path.join(out, `st-${mode}-${tag}-${name}.png`), ...(box ? { clip: await box.boundingBox() } : {}) });
    if (flat) await flat.evaluate(e => e.remove());
  };

  check(!!(await p.$('.sticker-btn')), 'кнопка стикеров у поля комментария');
  await p.hover('.sticker-btn');
  await p.waitForTimeout(400);
  const panelOpen = await p.$eval('.sticker-panel', e => getComputedStyle(e).display === 'flex').catch(() => false);
  check(panelOpen, 'наведение открывает панель');
  await shot('panel', '.sticker-panel');
  const tabs = await p.$$eval('.sticker-panel button', bs => bs.length);

  // режим правки первого пака
  await p.$$eval('.pack-header', hs => hs.find(h => h.dataset.pack === 'user_1').querySelector('button').click());
  await p.waitForTimeout(700);
  const visibleGrids = await p.$$eval('.pack-grid', gs => gs.filter(g => getComputedStyle(g).display !== 'none').map(g => g.dataset.pack).join());
  const shaking = await p.$$eval('.pack-grid[data-pack="user_1"] .sticker-editing', bs => bs.length);
  check(visibleGrids === 'user_1' && shaking === 6, `режим правки: виден один пак, стикеры дрожат (${visibleGrids}, ${shaking})`);
  await p.evaluate(() => document.querySelectorAll('.sticker-editing').forEach(e => e.style.animationPlayState = 'paused'));
  await shot('edit', '.sticker-panel');

  // обрезка нового стикера: окно, рамка во всю картинку, сдвиг рамки пальцем/мышью
  const big = await p.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 200;
    const g = c.getContext('2d'); g.fillStyle = '#3a6'; g.fillRect(0, 0, 400, 200); g.fillStyle = '#fff'; g.fillRect(150, 50, 100, 100);
    return c.toDataURL('image/png').split(',')[1];
  });
  const [chooser] = await Promise.all([p.waitForEvent('filechooser'), p.click('.add-item-btn', { force: true })]);
  await chooser.setFiles({ name: 'big.png', mimeType: 'image/png', buffer: Buffer.from(big, 'base64') });
  await p.waitForTimeout(600);
  const modal = await p.$('.vp-crop-modal, div[style*="z-index:20000"], div[style*="z-index: 20000"]');
  check(!!modal, 'окно обрезки открылось');
  let moved = '-';
  if (modal) {
    await shot('crop');
    // сначала пропорция 1:1 — рамке есть куда ехать
    await p.$$eval('button', bs => bs.find(b => b.textContent === '1:1').click());
    await p.waitForTimeout(200);
    const area = await p.evaluate(() => { const a = [...document.querySelectorAll('div')].find(d => /2px solid/.test(d.style.border) || d.classList.contains('vp-crop-area')); const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, left: Math.round(r.left) }; });
    if (mode === 'phone') {
      const cdp = await p.context().newCDPSession(p);
      const t = (type, x) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y: area.y }] });
      await t('touchStart', area.x); for (let i = 1; i <= 5; i++) await t('touchMove', area.x + i * 8); await t('touchEnd');
    } else {
      await p.mouse.move(area.x, area.y); await p.mouse.down(); await p.mouse.move(area.x + 40, area.y, { steps: 5 }); await p.mouse.up();
    }
    await p.waitForTimeout(200);
    const left2 = await p.evaluate(() => { const a = [...document.querySelectorAll('div')].find(d => /2px solid/.test(d.style.border) || d.classList.contains('vp-crop-area')); return Math.round(a.getBoundingClientRect().left); });
    moved = left2 - area.left;
    check(moved === 40, `рамка обрезки двигается (${mode === 'phone' ? 'пальцем' : 'мышью'}): сдвиг ${moved}, ждём 40`);
    await p.$$eval('button', bs => bs.find(b => b.textContent === 'Готово').click());
    await p.waitForTimeout(800);
    const added = await p.$$eval('.pack-grid[data-pack="user_1"] img', is => is.length);
    check(added === 7, `после «Готово» стикер добавлен в пак (${added})`);
  }

  // выбрать стикер — как картинка через скрепку: файл стикера ложится в поле выбора файла сайта
  // («Анти цензура» по умолчанию включена — файл приходит сайту .gif, как и при выборе скрепкой)
  // и сайт получает change (дальше превью и отправку делает сам сайт — на снимке его кода нет)
  const siteInput = await p.evaluate(() => {
    const row = document.querySelector('.vp-comment-row');
    let input = null;
    for (let e = row, i = 0; e && !input && i < 5; e = e.parentElement, i++) input = e.querySelector('input[type="file"]');
    if (!input) return false;
    input.classList.add('vpTestSiteInput');
    input.addEventListener('change', () => { window.__siteFile = [...input.files].map(f => f.name + ' ' + f.type + ' ' + f.size).join(); });
    return true;
  });
  if (siteInput) {
    if (!(await p.$eval('.sticker-panel', e => getComputedStyle(e).display === 'flex'))) { await p.hover('.sticker-btn'); await p.waitForTimeout(400); }
    await p.$$eval('.pack-grid[data-pack="user_1"] button', bs => bs[0].click());
    await p.waitForTimeout(600);
    const got = await p.evaluate(() => window.__siteFile || '');
    check(/^sticker\.gif image\/gif \d+$/.test(got) && !(await p.$('#temp_sticker_preview')), `стикер ушёл в поле файла сайта (${got || 'нет'}), своего превью нет`);
    // дальше — запасной путь: поля файла нет
    await p.evaluate(() => document.querySelectorAll('.vpTestSiteInput').forEach(e => e.remove()));
  } else console.log('—    поля файла сайта у комментария нет — только запасной путь');

  // выбрать стикер: превью над полем, микрофон спрятан; крестик снимает; «Отправить» после — не уносит стикер
  if (!(await p.$eval('.sticker-panel', e => getComputedStyle(e).display === 'flex'))) { await p.hover('.sticker-btn'); await p.waitForTimeout(400); }
  await p.$$eval('.pack-grid[data-pack="user_1"] button', bs => bs[1].click());
  await p.waitForTimeout(400);
  check(!!(await p.$('#temp_sticker_preview')), 'стикер прикреплён: превью есть');
  // как вложение сайта: над строкой ввода, слева вровень с полем; кнопки после поля (микрофон) спрятаны
  const lay = await p.evaluate(() => {
    const pv = document.getElementById('temp_sticker_preview'), box = document.querySelector('.vp-comment-box');
    const th = pv && pv.querySelector('.vp-sticker-thumb, img'), r = th && th.getBoundingClientRect(), b = box && box.getBoundingClientRect();
    const shown = el => el && getComputedStyle(el).display !== 'none';
    const line = box && box.parentElement;
    const after = line ? [...line.querySelectorAll(':scope > button')].filter(x => box.compareDocumentPosition(x) & 4) : [];
    return { above: !!(r && b && r.bottom <= b.top + 1), dx: r && b ? Math.round(r.left - b.left) : null,
      afterShown: after.filter(shown).length, siteSend: shown(document.querySelector('.vp-comment-send')), ourSend: shown(document.querySelector('.vp-sticker-sendbtn')) };
  });
  console.log('—    раскладка: ' + JSON.stringify(lay));
  check(lay.above && lay.dx === 0 && lay.afterShown === 0 && !lay.siteSend && lay.ourSend, 'превью над строкой вровень с полем, микрофон и кнопка сайта спрятаны, наша «Отправить» видна');
  check(!(await p.$('.sticker-btn .spin')), 'кнопка стикеров не крутится после прикрепления');
  // превью вместе со строкой ввода — чтобы видеть, как оно встало
  await p.evaluate(() => document.getElementById('temp_sticker_preview')?.parentElement.classList.add('vpTestAttachHost'));
  await shot('attached', '.vpTestAttachHost');
  const wheelBlocked = await p.evaluate(() => { const r = document.getElementById('root'); if (!r) return 'нет #root'; const e = new WheelEvent('wheel', { deltaY: 50, cancelable: true, bubbles: true }); r.dispatchEvent(e); return e.defaultPrevented; });
  console.log('—    колесо страницы после выбора стикера заблокировано: ' + wheelBlocked);
  await p.click('.vp-sticker-remove, #temp_sticker_preview button', { force: true });
  await p.waitForTimeout(300);
  check(!(await p.$('#temp_sticker_preview')) && !(await p.$('.vp-sticker-sendbtn')) && !(await p.$('.vp-sticker-hide')), 'крестик снимает стикер и возвращает кнопки сайта');
  // сайт включает «Отправить», когда в поле есть текст — как будто написали обычный комментарий
  await p.$eval('.vp-comment-send', b => { b.disabled = false; b.click(); });
  await p.waitForTimeout(500);
  check(comments.length === 0, `после крестика «Отправить» не уносит стикер (${comments.join(' | ') || 'запросов нет'})`);
  comments.length = 0;
  // снова прикрепить и отправить: запрос в пост из адреса, со стикером вложением
  await p.hover('.sticker-btn'); await p.waitForTimeout(400);
  await p.$$eval('.pack-grid[data-pack="user_1"] button', bs => bs[2].click());
  await p.waitForTimeout(300);
  await p.$eval('.vp-sticker-sendbtn', b => b.click());
  await p.waitForTimeout(600);
  check(comments.length === 1 && comments[0].startsWith('p123 ') && comments[0].includes('"attachmentIds":["s2"]'), `отправка кнопкой: ${comments.join(' | ')}`);
  // Enter в поле — тоже отправка стикера
  comments.length = 0;
  await p.focus('[contenteditable="true"][data-placeholder]');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(600);
  check(comments.length === 1 && comments[0].includes('"attachmentIds":["s2"]'), `отправка Enter: ${comments.join(' | ') || 'запросов нет'}`);
  // чужой файл (FORBIDDEN): стикер перезаливается от своего имени, отправка повторяется с новым номером,
  // новый номер — в паке
  await p.click('.vp-sticker-remove', { force: true }); await p.waitForTimeout(200);
  comments.length = 0;
  await p.hover('.sticker-btn'); await p.waitForTimeout(400);
  await p.$$eval('.pack-grid[data-pack="user_1"] button', bs => bs[3].click());
  await p.waitForTimeout(300);
  await p.$eval('.vp-sticker-sendbtn', b => b.click());
  await p.waitForTimeout(1200);
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('user_sticker_packs_v1'))[0].stickers[3].id);
  check(comments.length === 2 && comments[0].includes('"s3"') && comments[1].includes('"up1"') && saved === 'up1', `чужой файл: перезалив и повтор (${comments.map(c => c.match(/\["(\w+)"\]/)?.[1]).join(' → ')}, в паке ${saved})`);

  check(errors.length === 0, 'ошибок на странице нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  console.log(`—    кнопок в панели: ${tabs}`);
  await browser.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
