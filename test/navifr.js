// Мику и Тето (3.5.0): вкладка «Мику» в настройках. Включил — Мику держится за экран справа, Тето (отзеркаленная) слева: рука
// уходит за край, низ утоплен за нижний край. Можно оставить одну и поменять размер. Картинки качаются один раз и лежат в браузере.
// Запуск:  node test/pals.js снимок-своего-профиля.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
let snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8').replace('function palsApply() {', 'window.__palsApply = () => palsApply(); function palsApply() {');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const url = (snap.match(/"url": "([^"]+)"/) || [, ORIGIN + '/'])[1];
const ASSET = n => fs.readFileSync(path.join(__dirname, '..', 'assets', n)).toString('base64');
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  const store = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
  if (process.env.PALSKIN) store.palSkin = process.env.PALSKIN;
  const asked = [];
  await ctx.exposeFunction('__save', (k, v) => { store[k] = v; });
  await ctx.exposeFunction('__asset', u => { asked.push(u); const m = u.match(/\/main\/assets\/(\w+\.webp)$/); return m ? ASSET(m[1]) : ''; });
  const open = async () => {
    const p = await ctx.newPage();
    p.errors = [];
    p.on('pageerror', e => p.errors.push(e.message));
    await p.route('**/*', r => {
      const u = new URL(r.request().url()), t = r.request().resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t) && !u.protocol.startsWith('blob')) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: '#NeuroSFW | ИТД X', id: OWNER }) });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m, s]) => {
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; window.__save(k, v); };
      window.GM_xmlhttpRequest = o => {
        if (/raw\.githubusercontent\.com\/.*\/assets\//.test(o.url)) {
          window.__asset(o.url).then(b64 => {
            if (!b64) return o.onload({ status: 404, response: null });
            const bin = atob(b64), u8 = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
            o.onload({ status: 200, response: new Blob([u8]) });
          });
          return;
        }
        setTimeout(() => o.onerror && o.onerror('x'), 0);
      };
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, [src.slice(0, src.indexOf('==/UserScript==')), store]);
    await p.goto(url);
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-nav-blob, .vp-fab, .settings-dropdown, .vp-itdx-btn, .vp-msgs, .vp-pals').forEach(e => e.remove()) || document.querySelectorAll('.vp-nuksta-hidden').forEach(e => e.classList.remove('vp-nuksta-hidden')));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    return p;
  };
  const pals = p => p.evaluate(() => [...document.querySelectorAll('.vp-pal')].map(i => {
    const r = (e => { const q = e.getBoundingClientRect(), d = parseFloat(getComputedStyle(e).paddingLeft) || 0; return { left: q.left + d, right: q.right - d, top: q.top + d, bottom: q.bottom - d, height: q.height - 2 * d }; })(i), m = new DOMMatrix(getComputedStyle(i).transform);
    return { id: i.className.match(/vp-pal-(\w+)/)[1], loaded: i.complete && i.naturalWidth > 0, l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height), flip: m.a < 0, pe: getComputedStyle(i).pointerEvents };
  }));
  const waitLoaded = p => p.waitForFunction(() => [...document.querySelectorAll('.vp-pal')].every(i => i.complete && i.naturalWidth > 0), null, { timeout: 20000 }).catch(() => { });
  const p = await open();
  await p.addStyleTag({ content: 'iframe.vp-page-frame, iframe { pointer-events: auto !important; }' });
  const info = await p.evaluate(() => { const f = document.querySelector('iframe'); const r = f && f.getBoundingClientRect(); return f ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null; });
  console.log('iframe', JSON.stringify(info));
  await p.evaluate(() => { window.__ov = []; document.addEventListener('pointerover', e => window.__ov.push(e.target.tagName + '.' + (e.target.className || '').toString().slice(0, 20)), true); document.addEventListener('pointermove', e => { window.__pm = (window.__pm || 0) + 1; }, true); });
  const navs = () => p.evaluate(() => [...document.querySelectorAll('nav .vp-nav-link')].map(a => a.style.transform || ''));
  const link = await p.evaluate(() => { const a = [...document.querySelectorAll('nav .vp-nav-link')][3]; const r = a.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, r.right]; });
  await p.mouse.move(link[0] - 40, link[1] - 30); await p.mouse.move(link[0] - 40, link[1], { steps: 6 });
  await p.waitForTimeout(500);
  const near = await navs();
  check(near.some(t => t), 'мышь у меню — кнопки притянуты: ' + JSON.stringify(near.filter(Boolean)));
  const fx = info ? info[0] + info[2] / 2 : 900, fy = info ? info[1] + 200 : 400;
  await p.mouse.move(link[2] + 20, link[1], { steps: 4 });
  await p.mouse.move(fx, fy, { steps: 12 });
  await p.waitForTimeout(900);
  const far = await navs();
  console.log('over:', JSON.stringify(await p.evaluate(() => [window.__ov.slice(-6), window.__pm])));
  check(far.every(t => !t), 'мышь ушла во вложенное окно — кнопки отпущены: ' + JSON.stringify(far.filter(Boolean)));
  // кнопка «Ивент»: анимация при наведении
  const ev = await p.evaluate(() => { const a = document.querySelector('nav a.vp-nav-link:has(> svg.vp-portal)'); if (!a) return null; const r = a.getBoundingClientRect(); return [r.x + 60, r.y + r.height / 2]; });
  if (ev) {
    await p.mouse.move(ev[0] + 30, ev[1] - 40); await p.mouse.move(ev[0], ev[1], { steps: 8 }); await p.waitForTimeout(600);
    const hov = await p.evaluate(() => { const a = document.querySelector('nav a.vp-nav-link:has(> svg.vp-portal)'); const sv = a.querySelector(':scope > svg.vp-portal'); return [a.style.getPropertyValue('--vp-k'), sv.style.transform, a.style.transform]; });
    check(parseFloat(hov[0]) > 0.5 && /scale/.test(hov[1]) && /translateX/.test(hov[2]), 'кнопка «Ивент» при наведении: подсветка, увеличение, притяжение ' + JSON.stringify(hov));
    // портал сайта на время не ответил: кнопка теряет href, мод держит её живой
    await p.mouse.move(900, 400, { steps: 4 });
    await p.evaluate(() => { const a = document.querySelector('nav a.vp-nav-link:has(> svg.vp-portal)'); a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); a.className = 'OfVj'; const i = a.querySelector('img'); i.className = 'R2HN'; i.src = '/assets/portal/portal-inactive.png'; });
    await p.waitForTimeout(900);
    const kept = await p.evaluate(() => { const a = document.querySelector('nav a:has(> svg.vp-portal)'); return [a.getAttribute('href'), a.getAttribute('aria-disabled'), a.querySelector(':scope > svg.vp-portal').dataset.state]; });
    check(kept[0] && kept[1] !== 'true' && kept[2] === 'live', 'кнопка «Ивент» остаётся нажимаемой, когда сайт на время её отключил ' + JSON.stringify(kept));
  } else check(false, 'на странице нет кнопки «Ивент»');
  console.log(fails.length ? 'Не прошло: ' + fails.length : 'Всё прошло');
  await b.close();
})();
