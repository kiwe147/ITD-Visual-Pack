// Листание вкладок: снимок страницы тянется на ту же высоту, что и настоящая страница (вкладка «Ивент» с надписью по центру не «прыгает» сверху к центру).
// Сайт имитируется как в tabslide.js. Запуск:  node test/tabslideheight.js снимок-ивента.html [ширина высота]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const W = +process.argv[3] || 1400, H = +process.argv[4] || 900;
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch();
  const phone = W < 800;
  const ctx = await b.newContext(phone ? { viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: W, height: H } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (t === 'image' || t === 'font') return r.abort();
    if (t === 'stylesheet') return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{"data":{"posts":[]}}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, tabSlide: true };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    window.__EV = null;
    const center = () => { const n = document.querySelector('nav.vp-nav'); const root = n && (document.querySelector('aside.vp-sidebar') ? document.querySelector('aside.vp-sidebar').parentElement : n.parentElement.parentElement); return root && [...root.children].find(c => c.tagName !== 'ASIDE' && !c.contains(n) && !c.classList.contains('vp-sw-stage') && c.getBoundingClientRect().width > 300); };
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href^="/"]');
      if (!a || e.defaultPrevented) return;
      e.preventDefault();
      const href = a.getAttribute('href');
      if (href === location.pathname) return;
      history.pushState({ site: href }, '', href);
      setTimeout(() => {
        const c = center();
        if (!c) return;
        c.innerHTML = href === '/event' ? window.__EV : '<div id="fakepage" style="height:1800px;background:#27ae60;color:#fff;font:700 34px sans-serif;padding:40px">PAGE ' + href + '</div>';
      }, 140);
    });
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-itdx-btn, .vp-msgs').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2200);
  if (phone) await p.addStyleTag({ content: '.sH2I { height: 100dvh; display: flex; flex-direction: column; padding: 0 } .iie7 { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; flex: 1 1 0%; gap: 16px } .FGGi { font-size: 48px }' });
  await p.evaluate(() => {
    const ev = document.querySelector('.iie7');
    window.__EV = ev ? ev.outerHTML : '<div class="iie7"><span class="FGGi">E</span><h1>Нет активного ивента</h1></div>';
    if (!ev) { const n = document.querySelector('nav.vp-nav'); const root = n.parentElement.parentElement; const c = [...root.children].find(x => !x.contains(n)); c.innerHTML = window.__EV; }
    history.replaceState({ site: '/event' }, '', '/event');
  });
  await p.waitForTimeout(300);
  const rel = (sel, rootSel) => p.evaluate(([sel, rootSel]) => {
    const r = document.querySelector(rootSel), e = r && r.querySelector(sel);
    if (!r || !e) return null;
    const a = r.getBoundingClientRect(), c = e.getBoundingClientRect();
    return { h: Math.round(a.height), top: Math.round(c.top - a.top) };
  }, [sel, rootSel]);
  const centerSel = '.sH2I';
  const live0 = await rel('.iie7', centerSel);
  await p.dispatchEvent('nav a[href="/"]', 'click');
  await p.waitForFunction(() => document.querySelector('.vp-sw-old'), null, { timeout: 4000 });
  await p.waitForTimeout(60);
  const gh = await rel('.iie7', '.vp-sw-old > *');
  check(live0 && gh && gh.h === live0.h && gh.top === live0.top, 'уходящий снимок «Ивента» той же высоты, что и страница: ' + JSON.stringify(gh) + ' и ' + JSON.stringify(live0));
  await p.waitForFunction(() => !document.querySelector('.vp-sw-stage'), null, { timeout: 5000 });
  await p.waitForTimeout(200);
  await p.dispatchEvent('nav a[href="/event"]', 'click');
  for (const d of [330, 100, 100, 100]) {
    await p.waitForTimeout(d);
    const nw = await rel('.iie7', '.vp-sw-new > *');
    if (nw) check(nw.h === live0.h && nw.top === live0.top, 'приходящий снимок «Ивента» той же высоты, что и страница: ' + JSON.stringify(nw));
  }
  await p.waitForFunction(() => !document.querySelector('.vp-sw-stage'), null, { timeout: 5000 });
  check(errs.length === 0, 'нет ошибок страницы ' + errs.join('|'));
  await b.close();
  console.log(fails.length ? String.fromCharCode(10) + 'ПРОВАЛЕНО: ' + fails.length : String.fromCharCode(10) + 'всё ок');
  process.exit(fails.length ? 1 : 0);
})();
