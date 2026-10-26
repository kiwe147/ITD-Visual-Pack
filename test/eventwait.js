// Страница «Нет активного ивента»: по центру живая анимация ожидания; как только ивент начался (текст другой) — анимация убирается, страница сайта не тронута.
// Запуск:  node test/eventwait.js снимок-ивента.html   (SHOT=путь.png — сохранить кадр)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  for (const [name, vp, reduce] of [['ПК', { width: 1400, height: 900 }, false], ['ПК, без анимации', { width: 1400, height: 900 }, true]]) {
    const ctx = await b.newContext({ viewport: vp, reducedMotion: reduce ? 'reduce' : 'no-preference' });
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.route('**/*', r => {
      const u = new URL(r.request().url()), t = r.request().resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (t === 'image' || t === 'font') return r.abort();
      if (t === 'stylesheet') return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(m => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, src.slice(0, src.indexOf('==/UserScript==')));
    await p.goto(ORIGIN + '/event');
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-itdx-btn, .vp-msgs').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2200);
    const st = await p.evaluate(() => {
      const e = document.querySelector('.vp-evw'), h = document.querySelector('h1'), box = h && h.parentElement;
      if (!e) return null;
      const r = e.getBoundingClientRect(), br = box.getBoundingClientRect(), emo = box.querySelector('.FGGi');
      return { w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.left + r.width / 2), boxCx: Math.round(br.left + br.width / 2), above: r.bottom <= h.getBoundingClientRect().top + 1, emoHidden: emo ? getComputedStyle(emo).display === 'none' : null, anims: e.getAnimations({ subtree: true }).length, title: h.textContent.trim() };
    });
    check(!!st, name + ': анимация на месте');
    if (st) {
      check(st.w === 168 && Math.abs(st.cx - st.boxCx) <= 1, name + ': по центру блока (' + st.cx + ' и ' + st.boxCx + ')');
      check(st.above, name + ': над заголовком');
      check(st.emoHidden === true, name + ': ✨ сайта спрятана, чтобы не двоилось');
      check(reduce ? st.anims === 0 : st.anims >= 15, name + ': ' + (reduce ? 'без движения при «уменьшить анимацию»' : 'идёт много анимаций (' + st.anims + ')'));
      check(st.title === 'Нет активного ивента', name + ': заголовок сайта не тронут');
    }
    if (!reduce) {
      const a = await p.screenshot({ clip: { x: 520, y: 250, width: 360, height: 360 } });
      await p.waitForTimeout(900);
      const c = await p.screenshot({ clip: { x: 520, y: 250, width: 360, height: 360 } });
      check(!a.equals(c), name + ': картинка меняется со временем');
      if (process.env.SHOT) fs.writeFileSync(process.env.SHOT, a);
    }
    await p.evaluate(() => { const h = document.querySelector('h1'); h.textContent = 'Ивент: «Осень»'; });
    await p.waitForTimeout(500);
    const after = await p.evaluate(() => { const box = document.querySelector('h1').parentElement, emo = box.querySelector('.FGGi'); return { evw: document.querySelectorAll('.vp-evw').length, emoShown: emo ? getComputedStyle(emo).display !== 'none' : null }; });
    check(after.evw === 0 && after.emoShown === true, name + ': ивент начался — анимации нет, страница сайта целая');
    await p.evaluate(() => { document.querySelector('h1').textContent = 'Нет активного ивента'; });
    await p.waitForTimeout(500);
    check(await p.evaluate(() => document.querySelectorAll('.vp-evw').length) === 1, name + ': ивент закончился — анимация вернулась, одна');
    check(errors.length === 0, name + ': нет ошибок страницы ' + errors.join('|'));
    await ctx.close();
  }
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
