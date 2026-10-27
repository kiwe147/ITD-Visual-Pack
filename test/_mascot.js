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
  const B64 = fs.readFileSync(path.join(__dirname, 'out', 'scene_b64.txt'), 'utf8');
  await p.evaluate(b64 => { const f = document.querySelector('iframe'); f.removeAttribute('src'); f.srcdoc = '<!doctype html><body style="margin:0;background:#15121c;font-family:sans-serif"><style>html,body{height:100%}.rs{position:absolute;left:50%;top:50%;translate:-50% -50%;width:min(max(100cqw,175cqh),108cqw,210cqh);aspect-ratio:7/4;container-type:inline-size;background:url(data:image/jpeg;base64,' + b64 + ') center/100% 100%}body{container-type:size;position:relative}</style><div class="rs room-stage"></div></body>'; }, B64);
  await p.waitForTimeout(500);
  await p.evaluate(() => history.replaceState({}, '', '/event/halloween'));
  await p.waitForTimeout(4500);
  const info = await p.evaluate(() => { const d = document.querySelector('iframe').contentDocument; const m = d.querySelector('.vp-mas'); if (!m) return 'нет маскота'; const r = m.getBoundingClientRect(), s = d.querySelector('.room-stage').getBoundingClientRect(); return { mas: [r.left, r.top, r.width, r.height].map(Math.round), stage: [s.left, s.top, s.width, s.height].map(Math.round), img: m.querySelector('img').naturalWidth }; });
  console.log(JSON.stringify(info));
  const fr = await p.$('iframe'); const box = await fr.boundingBox();
  await p.screenshot({ path: 'test/out/mascot0.png', clip: box });
  await p.mouse.click(box.x + box.width * 0.88, box.y + box.height * 0.78); await p.waitForTimeout(450);
  console.log('фраза:', await p.evaluate(() => { const s = document.querySelector('iframe').contentDocument.querySelector('.vp-mas-say'); return s.textContent + ' on=' + s.classList.contains('vp-on'); }));
  await p.screenshot({ path: 'test/out/mascot1.png', clip: box });
  await b.close();
})();
