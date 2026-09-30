// Баннер со стеклом ивента (3.3.14.3): в шторке кнопки «Стекло» и «Стикеры», выбор помнится после перезагрузки,
// кончилось стекло — пропала кнопка; шторка не вылезает выше видимого верха баннера, даже если сайт сдвинул стекло и картинку.
// Запуск:  node test/bannerfx.js снимок-своего-профиля-со-стеклом.html
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
const STICKER = '<span aria-hidden="true" style="position:absolute; left: 20%; top: 40%; width: 12%; aspect-ratio: 1 / 1; z-index: 101; transform: translate(-50%, -50%); background: #f5a; border-radius: 30%;"></span>';

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const store = {};
  const open = async (vp, prep) => {
    const p = await b.newPage({ viewport: vp, ...(vp.width < 700 ? { isMobile: true, hasTouch: true } : {}) });
    p.errors = [];
    p.on('pageerror', e => p.errors.push(e.message));
    await p.route('**/*', r => {
      const u = new URL(r.request().url()), t = r.request().resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: OWNER }) });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.exposeFunction('__gmSave', (k, v) => { store[k] = v; });
    await p.addInitScript(([m, pre]) => {
      const s = Object.assign({ introEnabled: false, introMobile: 'off', backgroundEnabled: false }, pre);
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; window.__gmSave(k, v); };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, [src.slice(0, src.indexOf('==/UserScript==')), { ...store }]);
    await p.goto(url);
    await p.evaluate(() => document.querySelectorAll('.vp-banner-fx, .custom-image-btn, .custom-change-btn, .custom-cancel-btn, .custom-apply-btn').forEach(e => e.remove()));
    if (prep) await p.evaluate(prep, STICKER);
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2000);
    const bn = await p.$('.vp-banner');
    const box = await bn.boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await p.waitForTimeout(500);
    return p;
  };
  const state = p => p.evaluate(() => {
    const bn = document.querySelector('.vp-banner'), g = bn.querySelector('[aria-label="Стекло"]'), d = bn.querySelector('[aria-label^="Оформление профиля"]');
    const bar = bn.querySelector('.vp-banner-buttons'), gb = document.querySelector('.vp-banner-glass'), sb = document.querySelector('.vp-banner-stickers');
    const vis = e => !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
    const vt = Math.max(bn.querySelector('img[alt="Banner"]').getBoundingClientRect().top, g && vis(g) ? g.getBoundingClientRect().top : -1e9);
    return {
      glassBtn: !!gb, glassOff: !!gb && gb.classList.contains('vp-off'), glassShown: vis(g), glassTitle: gb && gb.title,
      stickBtn: !!sb, stickOff: !!sb && sb.classList.contains('vp-off'), stickShown: vis(d),
      barAbove: bar ? Math.round(vt - bar.getBoundingClientRect().top) : null,
      buttons: bar ? [...bar.querySelectorAll('button')].filter(vis).map(x => x.title || x.className.split(' ').pop()) : []
    };
  });
  const shot = async (p, name) => {
    const box = await (await p.$('.vp-banner')).boundingBox();
    await p.screenshot({ path: path.join(__dirname, 'out', `bannerfx-${name}.png`), clip: { x: 0, y: Math.max(0, box.y - 30), width: p.viewportSize().width, height: Math.min(360, box.height + 60) } });
  };
  const addSticker = st => { const d = document.querySelector('.vp-banner [aria-label^="Оформление профиля"]'); d.style.cssText += 'position:absolute; inset:0; pointer-events:none;'; d.innerHTML = st; };

  for (const [name, vp] of [['pc', { width: 1400, height: 900 }], ['phone', { width: 375, height: 800 }]]) {
    Object.keys(store).forEach(k => delete store[k]);
    let p = await open(vp, addSticker);
    let s = await state(p);
    console.log(`—    ${name} старт:`, JSON.stringify(s));
    check(s.glassBtn && !s.glassOff && s.glassShown, `${name}: в шторке кнопка стекла, стекло видно`);
    check(s.stickBtn && !s.stickOff && s.stickShown, `${name}: в шторке кнопка стикеров, стикеры видно`);
    check(s.barAbove !== null && s.barAbove <= 1, `${name}: шторка не выше видимого верха баннера (${s.barAbove})`);
    await shot(p, name + '-1-start');
    await p.click('.vp-banner-glass');
    await p.waitForTimeout(300);
    s = await state(p);
    check(s.glassOff && !s.glassShown && store.bannerGlassOff === true, `${name}: нажал «стекло» — стекло скрыто, выбор сохранён`);
    await p.click('.vp-banner-stickers');
    await p.waitForTimeout(300);
    s = await state(p);
    check(s.stickOff && !s.stickShown && store.bannerStickersOff === true, `${name}: нажал «стикеры» — стикеры скрыты, выбор сохранён`);
    await shot(p, name + '-2-off');
    check(!p.errors.length, `${name}: ошибок нет` + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
    await p.close();

    p = await open(vp, addSticker);
    s = await state(p);
    console.log(`—    ${name} после перезагрузки:`, JSON.stringify(s));
    check(s.glassOff && !s.glassShown && s.stickOff && !s.stickShown, `${name}: после перезагрузки стекло и стикеры так и скрыты`);
    await p.click('.vp-banner-glass');
    await p.waitForTimeout(300);
    s = await state(p);
    check(!s.glassOff && s.glassShown && store.bannerGlassOff === false, `${name}: второе нажатие возвращает стекло`);
    await p.evaluate(() => { document.querySelector('.vp-banner [aria-label="Стекло"]').remove(); document.querySelector('.vp-banner [aria-label^="Оформление профиля"]').remove(); });
    await p.waitForTimeout(600);
    s = await state(p);
    check(!s.glassBtn && !s.stickBtn, `${name}: ивент кончился (стекла нет) — кнопок нет (${s.buttons.join(', ')})`);
    await shot(p, name + '-3-noevent');
    await p.close();

    Object.keys(store).forEach(k => delete store[k]);
    p = await open(vp, () => {
      const bn = document.querySelector('.vp-banner'), g = bn.querySelector('[aria-label="Стекло"]'), img = bn.querySelector('img[alt="Banner"]');
      const st = document.createElement('style');
      st.textContent = '.vp-banner > [aria-label="Стекло"] { top: 15px !important; } .vp-banner > img[alt="Banner"] { margin-top: 15px; } .vp-banner-buttons { translate: 0 -15px; margin-top: -6px; }';
      document.head.appendChild(st);
    });
    s = await state(p);
    console.log(`—    ${name} сайт сдвинул стекло:`, JSON.stringify(s));
    check(s.barAbove !== null && Math.abs(s.barAbove) <= 1, `${name}: стекло сдвинуто сайтом на 15 px — шторка висит от его верха (${s.barAbove})`);
    await shot(p, name + '-4-shifted');
    await p.evaluate(() => scrollTo(0, (document.querySelector('.vp-banner').getBoundingClientRect().top + scrollY) + 70));
    await p.waitForTimeout(300);
    { const bx = await (await p.$('.vp-banner')).boundingBox(); await p.mouse.move(bx.x + bx.width / 2, Math.max(5, bx.y + bx.height / 2)); await p.waitForTimeout(500); }
    s = await state(p);
    check(s.barAbove !== null && Math.abs(s.barAbove) <= 1, `${name}: при прокрутке шторка едет вместе со стеклом (${s.barAbove})`);
    await p.close();
  }
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
