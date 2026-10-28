// Тоггл «Фурри поняшка» в диалоге «Звук и эффекты» на странице ивента.
// Проверяем: тоггл появился, по умолчанию включён, клик выключает/включает маскота и GM-ключ mascotOn.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const url = (snap.match(/"url": "([^"]+)"/) || [, ORIGIN + '/'])[1];
const ASSET = n => fs.readFileSync(path.join(__dirname, '..', 'assets', n)).toString('base64');
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  const store = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, palsEnabled: false };
  await ctx.exposeFunction('__save', (k, v) => { store[k] = v; });
  await ctx.exposeFunction('__keys', () => Object.keys(store));
  await ctx.exposeFunction('__asset', u => { const m = u.match(/\/main\/assets\/([\w-]+\.webp)$/); return m ? ASSET(m[1]) : ''; });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t) && !u.protocol.startsWith('blob')) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: 'X', id: OWNER }) });
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
    window.__storeKeys = () => window.__keys();
  }, [src.slice(0, src.indexOf('==/UserScript==')), store]);
  await p.goto(url);
  await p.waitForTimeout(500);
  // Один свой iframe с .room-stage и dialog
  await p.evaluate(() => {
    document.querySelectorAll('iframe').forEach(f => f.remove());
    const f = document.createElement('iframe');
    f.id = '__vpTestFrame';
    document.body.appendChild(f);
    f.srcdoc = `<!doctype html><html><head><style>
      body { margin: 0; font-family: sans-serif; background: #1a1020; color: #fff; }
      .dialog { display: block; position: absolute; inset: 20px; background: rgba(0,0,0,.85); padding: 20px; }
      .dialog-content { padding: 10px; }
      .toggle-line { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 8px 0; }
      .room-stage { position: relative; width: 600px; height: 400px; background: #333; }
    </style></head><body>
      <div class="room-stage"></div>
      <dialog class="dialog" open><div class="dialog-content"><label class="toggle-line"><span><strong>Хеллоуинские звуки</strong><small>Скрипы...</small></span><input type="checkbox"></label></div></dialog>
    </body></html>`;
    history.replaceState({}, '', '/event/halloween');
  });
  await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-nav-blob, .vp-fab, .settings-dropdown, .vp-itdx-btn, .vp-msgs, .vp-pals').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(3000);
  const d = () => p.evaluate(() => document.getElementById('__vpTestFrame').contentDocument);
  const t1 = await p.evaluate(() => {
    const d = document.getElementById('__vpTestFrame').contentDocument;
    const label = d.querySelector('.vp-mas-toggle');
    if (!label) return { no: 'no toggle' };
    return { text: label.querySelector('strong')?.textContent, hint: label.querySelector('small')?.textContent, checked: label.querySelector('input')?.checked };
  });
  check(t1.text === 'Фурри поняшка', 'тоггл «Фурри поняшка» появился в .dialog-content (' + JSON.stringify(t1) + ')');
  check(t1.checked === true, 'по умолчанию включён (checked=' + t1.checked + ')');
  const m1 = await p.evaluate(() => !!document.getElementById('__vpTestFrame').contentDocument.querySelector('.vp-mas'));
  check(m1, 'маскот в .room-stage (mascotOn по умолчанию true)');
  await p.evaluate(() => { const cb = document.getElementById('__vpTestFrame').contentDocument.querySelector('.vp-mas-toggle input'); cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(3000);
  const m2 = await p.evaluate(() => !!document.getElementById('__vpTestFrame').contentDocument.querySelector('.vp-mas'));
  const hasMascotOnKey = await p.evaluate(() => Object.keys(window).length >= 0 && (function(){ for (const k of Object.keys(window)) { if (k.includes('mascotOn')) return true; } return false; })());
  check(!m2, 'после клика маскот удалился из .room-stage и не вернулся через 3с');
  const storeKeys = await p.evaluate(() => window.__storeKeys ? window.__storeKeys() : []);
  const offStored = storeKeys.some(k => k.startsWith('mascotOn') && store[k] === false);
  check(offStored, 'GM-ключ mascotOn = false (по аккаунту, store keys: ' + storeKeys.filter(k => k.includes('mascotOn')).join(',') + ')');
  await p.evaluate(() => { const cb = document.getElementById('__vpTestFrame').contentDocument.querySelector('.vp-mas-toggle input'); cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(2500);
  const m3 = await p.evaluate(() => !!document.getElementById('__vpTestFrame').contentDocument.querySelector('.vp-mas'));
  check(m3, 'после клика обратно маскот вернулся');
  await b.close();
  console.log(fails.length ? '\nНе прошло: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();