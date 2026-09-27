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
    if (/\/api\/posts\/[^/]+\/comments$/.test(u) && r.request().method() === 'POST') { comments.push(u.split('/api/posts/')[1].split('/')[0] + ' ' + r.request().postData()); return r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"test"}' }); }
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
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('offline'), 0);
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

  // выбрать стикер: превью над полем, микрофон спрятан; крестик снимает; «Отправить» после — не уносит стикер
  if (!(await p.$eval('.sticker-panel', e => getComputedStyle(e).display === 'flex'))) { await p.hover('.sticker-btn'); await p.waitForTimeout(400); }
  await p.$$eval('.pack-grid[data-pack="user_1"] button', bs => bs[1].click());
  await p.waitForTimeout(400);
  check(!!(await p.$('#temp_sticker_preview')), 'стикер прикреплён: превью над полем');
  await shot('attached', '#temp_sticker_preview');
  const wheelBlocked = await p.evaluate(() => { const r = document.getElementById('root'); if (!r) return 'нет #root'; const e = new WheelEvent('wheel', { deltaY: 50, cancelable: true, bubbles: true }); r.dispatchEvent(e); return e.defaultPrevented; });
  console.log('—    колесо страницы после выбора стикера заблокировано: ' + wheelBlocked);
  await p.click('.vp-sticker-remove, #temp_sticker_preview button', { force: true });
  await p.waitForTimeout(300);
  check(!(await p.$('#temp_sticker_preview')), 'крестик снимает стикер');
  // сайт включает «Отправить», когда в поле есть текст — как будто написали обычный комментарий
  await p.$eval('.vp-comment-send', b => { b.disabled = false; b.click(); });
  await p.waitForTimeout(500);
  check(comments.length === 0, `после крестика «Отправить» не уносит стикер (${comments.join(' | ') || 'запросов нет'})`);
  comments.length = 0;
  // снова прикрепить и отправить: запрос в пост из адреса, со стикером вложением
  await p.hover('.sticker-btn'); await p.waitForTimeout(400);
  await p.$$eval('.pack-grid[data-pack="user_1"] button', bs => bs[2].click());
  await p.waitForTimeout(300);
  await p.$eval('.vp-comment-send', b => b.click());
  await p.waitForTimeout(600);
  check(comments.length === 1 && comments[0].startsWith('p123 ') && comments[0].includes('"attachmentIds":["s2"]'), `отправка: ${comments.join(' | ')}`);

  check(errors.length === 0, 'ошибок на странице нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  console.log(`—    кнопок в панели: ${tabs}`);
  await browser.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
