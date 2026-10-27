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
  const ctx = await b.newContext({ viewport: { width: 2000, height: 1250 } });
  const store = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, palsEnabled: true };
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
  await p.evaluate(() => { const f = document.querySelector('iframe'); if (f) f.removeAttribute('src'); if (f) f.srcdoc = '<body style="margin:0"><div style="width:72%;margin:0 auto;height:100vh;background:linear-gradient(#406,#a50)"></div></body>'; });
  await p.waitForTimeout(1500);
  const probe = async tag => console.log(tag, JSON.stringify(await p.evaluate(() => {
    const links = [...document.querySelectorAll('nav .vp-nav-link')];
    const ev = links.find(a => a.querySelector('svg.vp-portal')), c = getComputedStyle(ev), s = getComputedStyle(ev.querySelector('svg.vp-portal'));
    const oth = links.find(a => a !== ev && !a.classList.contains('vp-active') && a.getAttribute('href') !== '#');
    const bl = document.querySelector('.vp-nav-blob'), bs = bl && getComputedStyle(bl);
    return { cls: ev.className.replace(/\S*Z\S*/g, '').slice(0, 60), op: c.opacity, col: c.color, svgOp: s.opacity, svgFilter: s.filter.slice(0, 50), svgAnim: s.animationName, state: ev.querySelector('svg.vp-portal').dataset.state, othOp: oth && getComputedStyle(oth).opacity, blobOp: bs && bs.opacity, pals: (q => q ? [getComputedStyle(q).display, getComputedStyle(q).visibility, getComputedStyle(q).opacity, q.children.length, [...q.children].map(i => { const r = i.getBoundingClientRect(); return [i.complete, Math.round(r.left), Math.round(r.top), Math.round(r.width), getComputedStyle(i).opacity].join(`/`); })].join(' ') : 'нет')(document.querySelector('.vp-pals')), path: location.pathname, html: [...document.documentElement.classList].filter(x => /vp-(msgs|gal|ev)/.test(x)).join(' ') };
  })));
  const click = async txt => { for (const l of await p.$$('nav .vp-nav-link')) { if ((await l.textContent()).trim().startsWith(txt)) { await l.click({ timeout: 4000 }).catch(e => console.log('клик не прошёл', txt, e.message.slice(0, 80))); return; } } };
  const shot = async n => { const r = await p.evaluate(() => { const b = document.querySelector('nav').getBoundingClientRect(); return { x: Math.max(0, b.x - 20), y: Math.max(0, b.y - 20), width: b.width + 40, height: b.height + 40 }; }); await p.screenshot({ path: 'test/out/dim_' + n + '.png', clip: r }); };
  await p.evaluate(() => document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('nav a[href^="/"]'); if (!a || e.defaultPrevented) return; e.preventDefault(); history.pushState({}, '', a.getAttribute('href')); dispatchEvent(new PopStateEvent('popstate')); }, false));
  await p.evaluate(() => history.replaceState({}, '', '/event/halloween'));
  await probe('старт');
  await p.evaluate(() => document.documentElement.style.setProperty('--vp-accent', '#ff3d8b'));
  const crop = async n => { const r = await p.evaluate(() => { const b = document.querySelector('aside').getBoundingClientRect(); return { x: Math.max(0, b.x - 10), y: 330, width: 330, height: 330 }; }); await p.screenshot({ path: 'test/out/glow_' + n + '.png', clip: r }); };
  await click('Сообщения'); await p.waitForTimeout(2000); await crop('msgs');
  console.log(JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('nav .vp-nav-link')].map(a => { const c = getComputedStyle(a); return [a.textContent.trim().slice(0, 8), a.className.replace(/\S*[A-Z]\S*/g, '').trim(), c.backdropFilter.slice(0, 30), c.backgroundColor, c.boxShadow.slice(0, 30), c.borderTopStyle]; }))));
  await b.close();
})();
