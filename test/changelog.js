// Плашка версии мода: на компьютере — по центру под иконкой; по клику — «Что нового» (закрывается крестиком,
// Esc и кликом мимо), точка «есть новое» пропадает после открытия. Скрины — test/out/news-<режим>-*.png.
// Запуск:  node test/changelog.js снимок.html [desktop|phone]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const mode = process.argv[3] || 'desktop';
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const info = (snap.match(/<script type="application\/json" id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const URL0 = 'https://xn--d1ah4a.com' + (info ? new URL(JSON.parse(info).url).pathname : '/');
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage(mode === 'desktop' ? { viewport: { width: 1400, height: 900 } } : { viewport: { width: 392, height: 812 }, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/*', r => { const u = r.request().url(), t = r.request().resourceType();
    if (u.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.endsWith('/api/users/me')) return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","displayName":"NeuroSFW"}' });
    if (u === URL0) return r.fulfill({ contentType: 'text/html', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    return r.fulfill({ status: 404, body: '' }); });
  await p.addInitScript(([m, upd]) => { const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    // UPDATE=1 — на GitHub версия новее: появляется «Обновить»
    window.GM_xmlhttpRequest = o => setTimeout(() => upd ? o.onload({ status: 200, responseText: '// @version      9.9.9' }) : o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: '3.2.6' }, scriptMetaStr: m }; window.unsafeWindow = window; }, [src.slice(0, src.indexOf('==/UserScript==')), !!process.env.UPDATE]);
  await p.goto(URL0);
  // в снимке логотип уже перестроен модом — возвращаем вид сайта: значок + кнопка версии сайта
  await p.evaluate(() => {
    const a = document.querySelector('a[href="https://t.me/NeuroSFW"]');
    const box = a && a.closest('div:has(> div > a[href="https://t.me/NeuroSFW"]), div:has(> a[href="https://t.me/NeuroSFW"])');
    if (box) {
      const ver = box.querySelector('button');
      box.removeAttribute('style');
      box.innerHTML = '<svg width="36" height="36" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#888"/></svg>';
      if (ver) { ver.removeAttribute('style'); box.appendChild(ver); }
    }
    document.querySelectorAll('.my-nav-block').forEach(e => e.remove());
  });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(1800);
  // живая страница всё время меняется — шевельнём и эту, чтобы прошёл обычный проход мода
  await p.evaluate(() => document.body.appendChild(document.createElement('i'))); await p.waitForTimeout(400);
  if (process.env.UPDATE) await p.waitForTimeout(1500);                     // «Обновить» ставится через секунду
  const chip = await p.$('.vp-version-chip');
  check(!!chip, 'плашка версии есть');
  if (!chip) { await b.close(); process.exit(1); }
  if (mode === 'desktop') {
    const d = await p.evaluate(() => {
      const c = document.querySelector('.vp-version-chip').getBoundingClientRect();
      const ic = document.querySelector('a[href="https://t.me/NeuroSFW"]').getBoundingClientRect();
      return Math.round((c.left + c.width / 2) - (ic.left + ic.width / 2));
    });
    check(Math.abs(d) <= 1, `плашка по центру под иконкой (сдвиг ${d}px)`);
    const box = await p.evaluate(() => { const r = document.querySelector('a[href="https://t.me/NeuroSFW"]').closest('.vp-logo-top').getBoundingClientRect(); return { x: r.x - 20, y: r.y - 20, width: r.width + 40, height: r.height + 50 }; });
    await p.screenshot({ path: path.join(__dirname, 'out', `news-${mode}-logo.png`), clip: box });
  }
  check(await chip.evaluate(c => c.classList.contains('vp-news')), 'точка «есть новое» до открытия');
  await chip.click();
  await p.waitForTimeout(400);
  const n = await p.$$eval('.vp-news-ver', s => s.length);
  check(n >= 3, `«Что нового» открылось, записей ${n}`);
  await p.screenshot({ path: path.join(__dirname, 'out', `news-${mode}-open.png`) });
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  check(!(await p.$('.vp-news-back')), 'Esc закрывает');
  check(!(await chip.evaluate(c => c.classList.contains('vp-news'))), 'точка пропала после открытия');
  await chip.click(); await p.waitForTimeout(300);
  await p.mouse.click(5, 5); await p.waitForTimeout(200);
  check(!(await p.$('.vp-news-back')), 'клик мимо закрывает');
  check(errs.length === 0, 'ошибок нет' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  process.exit(fails.length ? 1 : 0);
})();
