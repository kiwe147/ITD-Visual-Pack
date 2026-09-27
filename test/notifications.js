// Уведомления видны и при «меньше движения» (prefers-reduced-motion): пункты появляются анимацией,
// и если прозрачность держит не она, при выключенной анимации список пустой (так было в 3.2.0 на телефоне).
// Запуск:  node test/notifications.js снимок-уведомлений.html [файл скрипта]
const { chromium } = require('playwright');
const fs = require('fs');
const snap = fs.readFileSync(process.argv[2], 'utf8'), src = fs.readFileSync(process.argv[3] || require('path').join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const URL0 = 'https://xn--d1ah4a.com/notifications';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  for (const rm of ['no-preference', 'reduce']) {
    const p = await b.newPage({ viewport: { width: 392, height: 724 }, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true, reducedMotion: rm });
    await p.route('**/*', r => { const u = r.request().url();
      if (u.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.endsWith('/api/users/me')) return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW"}' });
      if (u === URL0) return r.fulfill({ contentType: 'text/html', body: snap }); return r.fulfill({ status: 404, body: '' }); });
    await p.addInitScript(m => { const s = { introEnabled: false, introMobile: 'off' };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window; }, src.slice(0, src.indexOf('==/UserScript==')));
    await p.goto(URL0);
    // стили мода из снимка убираем — пусть их поставит проверяемая версия
    await p.evaluate(() => document.querySelectorAll('style').forEach(s => { if (/vp-notif|vp-post/.test(s.textContent)) s.remove(); }));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(1500);
    const ops = await p.$$eval('.vp-notif', ns => ns.map(n => getComputedStyle(n).opacity));
    console.log(`меньше движения: ${rm === 'reduce' ? 'вкл ' : 'выкл'} → пунктов ${ops.length}, видимых ${ops.filter(o => +o > 0.9).length}`);
    await p.close();
  }
  await b.close();
})();
