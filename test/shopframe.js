// Магазин внутри рамки: боковые панели встают по краям содержимого рамки, а не по краям экрана, и плавно съезжают, когда содержимое появилось.
// Рамку имитируем: большой iframe в центре с узкой колонкой внутри.
// Запуск:  node test/shopframe.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const near = (a, b, d) => Math.abs(a - b) <= d;
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ viewport: { width: 2048, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (t === 'image' || t === 'font') return r.abort();
    if (t === 'stylesheet') return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => {
    document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob, .vp-itdx-btn, .vp-msgs, .vp-gal, .vp-gal-nav').forEach(e => e.remove());
    document.querySelectorAll('style').forEach(st => { if (/vp-msgs|vp-gal/.test(st.textContent)) st.remove(); });
    const st = document.createElement('style');
    st.textContent = 'aside.vp-sidebar { position: fixed !important; top: 60px !important; width: 240px !important; height: 500px !important; left: 36px }';
    document.head.appendChild(st);
  });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    const a = document.querySelector('aside.vp-sidebar');
    const c = [...a.parentElement.children].find(x => x.tagName !== 'ASIDE' && x.getBoundingClientRect().width > 300);
    c.innerHTML = '<iframe id="fr" style="display:block;width:100%;height:860px;border:0"></iframe>';
    const fr = c.firstChild;
    fr.srcdoc = '<html><body style="margin:0"><div id="wrap" style="width:100%;display:flex;justify-content:center"><div id="col" style="width:900px;height:1400px;background:#345"></div></div></body></html>';
  });
  await p.waitForTimeout(1500);
  const geo = () => p.evaluate(() => {
    const f = document.getElementById('fr'), r = f.getBoundingClientRect();
    const col = f.contentDocument.getElementById('col').getBoundingClientRect();
    const a = document.querySelector('aside.vp-sidebar').getBoundingClientRect();
    return { frame: f.classList.contains('vp-page-frame'), colL: r.left + col.left, colR: r.left + col.right, sideR: a.right, moved: document.documentElement.classList.contains('vp-side-moved') };
  });
  const g = await geo();
  check(g.frame, 'рамка помечена как страница');
  check(g.moved && near(g.sideR, g.colL - 24, 3), 'левое меню встало у левого края колонки внутри рамки (колонка с ' + Math.round(g.colL) + ', меню до ' + Math.round(g.sideR) + ')');
  const railL = await p.evaluate(() => { const r = document.querySelector('.vp-rail.vp-on'); return r ? r.getBoundingClientRect().left : null; });
  console.log('правая колонка: ' + railL + ' (правый край колонки ' + Math.round(g.colR) + ')');
  if (railL !== null) check(near(railL, g.colR + 24, 3), 'правая колонка встала у правого края колонки');
  await p.evaluate(() => { document.getElementById('fr').contentDocument.getElementById('col').style.width = '1300px'; });
  await p.waitForTimeout(900);
  const g2 = await geo();
  check(g2.moved && near(g2.sideR, g2.colL - 24, 3) && g2.colL < g.colL - 100, 'колонка стала шире: меню уехало вслед (колонка с ' + Math.round(g2.colL) + ', меню до ' + Math.round(g2.sideR) + ')');
  await p.evaluate(() => history.replaceState({}, '', '/shop'));
  await p.evaluate(() => { document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href]'); if (a) e.preventDefault(); }); });
  await p.dispatchEvent('nav a[href="/"]', 'click');
  await p.waitForTimeout(150);
  const ghost = await p.evaluate(() => { const g = document.querySelector('.vp-sw-old'); return g && { frames: g.querySelectorAll('iframe').length, box: g.querySelector('.vp-page-frame') && Math.round(g.querySelector('.vp-page-frame').getBoundingClientRect().height) }; });
  check(ghost && ghost.frames === 0 && ghost.box === 860, 'листание из магазина: в копии вместо рамки пустое место того же размера ' + JSON.stringify(ghost));
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
