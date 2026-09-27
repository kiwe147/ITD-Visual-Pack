// Кнопка «наверх» и крупный ник на телефоне/компьютере: вид вверху, после прокрутки и после смены
// ширины на лету. Печатает положения — сравнить две версии: запустить с каждой и сравнить вывод.
// Запуск:  node test/mobile.js снимок-своего-профиля.html [файл скрипта]
// (со снимка снимаются следы старого мода: кнопка, обёртка ника и inline-стили ника)
const { chromium } = require('playwright');
const fs = require('fs');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.argv[3] || require('path').join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const info = (snap.match(/<script type="application\/json" id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const URL0 = 'https://xn--d1ah4a.com' + (info ? new URL(JSON.parse(info).url).pathname : '/');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  for (const mode of ['phone', 'desktop']) {
    const p = await b.newPage(mode === 'desktop' ? { viewport: { width: 1280, height: 860 } } : { viewport: { width: 392, height: 812 }, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true });
    await p.route('**/*', r => { const u = r.request().url();
      if (u.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.endsWith('/api/users/me')) return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","displayName":"#NeuroSFW | ЧБ"}' });
      if (u === URL0) return r.fulfill({ contentType: 'text/html', body: snap });
      return r.fulfill({ status: 404, body: '' }); });
    await p.addInitScript(m => { const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window; }, src.slice(0, src.indexOf('==/UserScript==')));
    await p.goto(URL0);
    await p.evaluate(() => { document.querySelectorAll('.itd-scroll-top-btn, #itd-mobile-fixes, #itd-scroll-top-styles, .vp-itdx-btn').forEach(e => e.remove());
      document.querySelectorAll('.nick-wrapper').forEach(w => w.replaceWith(...w.children)); document.documentElement.classList.remove('vp-has-up'); document.querySelectorAll('.vp-nick-large, .nick-controls-panel').forEach(e => e.removeAttribute('style')); });
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(1500);
    const st = async tag => {
      const r = await p.evaluate(() => {
        const btn = document.querySelector('.itd-scroll-top-btn'), g = btn && getComputedStyle(btn);
        const nick = document.querySelector('.vp-nick-large'), gn = nick && getComputedStyle(nick);
        const sb = getComputedStyle(document.documentElement, '::-webkit-scrollbar').display;
        const r = btn && btn.getBoundingClientRect();
        return { btn: g ? [g.position, g.bottom, g.right, g.zIndex, g.opacity, g.visibility, g.width, Math.round(r.x) + ',' + Math.round(r.y)].join(' ') : 'нет',
          nick: gn ? [gn.display, gn.flexDirection, gn.alignItems, gn.gap, nick.querySelector(':scope > .nick-wrapper') ? 'обёртка' : 'без обёртки', Math.round(nick.getBoundingClientRect().height)].join(' ') : 'нет',
          overscroll: getComputedStyle(document.body).overscrollBehaviorY };
      });
      console.log(`${mode} ${tag}: кнопка [${r.btn}] ник [${r.nick}] overscroll ${r.overscroll}`);
    };
    await st('вверху');
    await p.evaluate(() => { document.body.style.minHeight = '5000px'; window.scrollTo(0, 800); });
    await p.waitForTimeout(500);
    await st('прокрутка 800');
    await p.setViewportSize(mode === 'desktop' ? { width: 800, height: 860 } : { width: 1280, height: 812 });
    await p.waitForTimeout(800);
    await st('ширина сменилась');
    await p.close();
  }
  await b.close();
})();
