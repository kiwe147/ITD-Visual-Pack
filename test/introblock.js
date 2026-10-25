// Заставка при подвисании страницы: через 350 мс после старта главный поток блокируется на BLOCK мс (по умолчанию 900).
// Проверка: первая буква не «долетела» разом, а падение растянулось (время анимации откатилось).
// Запуск:  SRC=файл.js node test/introblock.js снимок.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.SRC || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const meta = src.slice(0, src.indexOf('==/UserScript=='));
const BLOCK = +process.env.BLOCK || 900;
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await p.route('**/*', r => { const q = r.request(), u = new URL(q.url()); if (u.origin === 'https://xn--d1ah4a.com' && q.resourceType() === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap }); if (['image', 'stylesheet', 'font'].includes(q.resourceType())) return r.continue(); return r.fulfill({ status: 404, body: '' }); });
  await p.addInitScript(m => { const s = { backgroundEnabled: false }; window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; }; window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0); window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window; }, meta);
  await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
  await p.goto('https://xn--d1ah4a.com/', { waitUntil: 'commit' });
  await p.waitForFunction(() => { const a = document.getAnimations().find(x => x.effect && x.effect.target && x.effect.target.classList && x.effect.target.classList.contains('vpi-letter')); return a && a.currentTime > 350; }, null, { timeout: 15000 });
  const r = await p.evaluate(async blk => {
    const letter = () => document.getAnimations().filter(x => x.effect && x.effect.target && x.effect.target.classList && x.effect.target.classList.contains('vpi-letter'));
    const before = letter()[0].currentTime;
    const t = performance.now(); while (performance.now() - t < blk);
    await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
    const after = letter().map(a => Math.round(a.currentTime));
    return { before: Math.round(before), after };
  }, BLOCK);
  console.log('блок ' + BLOCK + ' мс; время анимации буквы до блока ' + r.before + ', после: ' + r.after.join(','));
  const ok = r.after[0] < 700;
  console.log(ok ? 'ок   первая буква ещё летит (' + r.after[0] + ' < 620+)' : 'ОШИБКА первая буква уже «долетела» разом (' + r.after[0] + ')');
  await b.close();
  process.exit(ok ? 0 : 1);
})();
