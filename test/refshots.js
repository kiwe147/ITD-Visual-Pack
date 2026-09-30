// Эталонные скриншоты для перестроек кода: снять набор экранов и сравнить с прошлым набором попиксельно.
// Снять:     node test/refshots.js save <метка> снимок1.html [снимок2.html ...]
// Сравнить:  node test/refshots.js diff <метка-было> <метка-стало>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ORIGIN = 'https://xn--d1ah4a.com';
const [mode, a, b2, ...files] = process.argv.slice(2);
const dirOf = t => path.join(__dirname, 'out', 'ref', t);

async function save(tag, snaps) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
  const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
  fs.mkdirSync(dirOf(tag), { recursive: true });
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const errors = [];
  for (const file of snaps) {
    const snap = fs.readFileSync(file, 'utf8'), url = (snap.match(/"url": "([^"]+)"/) || [, ORIGIN + '/'])[1];
    const base = path.basename(file).replace(/^itd-snapshot-/, '').replace(/\W+/g, '').slice(0, 18);
    for (const [name, vp] of [['phone', { width: 412, height: 900 }], ['pc', { width: 1400, height: 900 }], ['edge', { width: 1173, height: 900 }]]) {
      const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce', ...(name === 'phone' ? { isMobile: true, hasTouch: true } : {}) });
      p.on('pageerror', e => errors.push(`${base}/${name}: ${e.message}`));
      await p.route('**/*', r => {
        const u = new URL(r.request().url()), t = r.request().resourceType();
        if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
        if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
        if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
        if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: OWNER }) });
        return r.fulfill({ status: 404, body: '' });
      });
      await p.addInitScript(m => {
        const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, sceneEnabled: false };
        window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
        window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
        window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
        Date.now = () => 1790000000000; Math.random = (() => { let x = 7; return () => (x = (x * 16807) % 2147483647) / 2147483647; })();
      }, src.slice(0, src.indexOf('==/UserScript==')));
      await p.goto(url.startsWith(ORIGIN) ? url : ORIGIN + '/');
      await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-post-tools, .vp-fab').forEach(e => e.remove()));
      await p.addScriptTag({ content: src });
      await p.waitForTimeout(2500);
      await p.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; } video { visibility: hidden !important; }' });
      await p.waitForTimeout(300);
      const shot = async n => p.screenshot({ path: path.join(dirOf(tag), `${base}-${name}-${n}.png`) });
      await shot('top');
      await p.evaluate(() => scrollTo(0, 1400)); await p.waitForTimeout(300); await shot('mid');
      await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200);
      if (await p.$('.vp-fab-btn')) {
        await p.evaluate(() => { const f = document.querySelector('.vp-fab'); f.classList.add('vp-open'); });
        await p.waitForTimeout(200); await shot('fab');
        await p.evaluate(() => document.querySelector('.vp-fab').classList.remove('vp-open'));
      }
      const itdx = await p.$('.vp-itdx-btn');
      if (itdx) { await p.evaluate(() => document.querySelector('.vp-itdx-btn').click()); await p.waitForTimeout(600); await shot('itdx'); }
      await p.close();
    }
  }
  await b.close();
  console.log(`снято в ${dirOf(tag)}: ${fs.readdirSync(dirOf(tag)).length} шт.` + (errors.length ? '\nОШИБКИ СТРАНИЦЫ:\n' + errors.join('\n') : ''));
}

async function diff(t1, t2) {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage();
  const names = fs.readdirSync(dirOf(t1)).filter(f => f.endsWith('.png'));
  let bad = 0;
  fs.mkdirSync(dirOf(t2 + '-diff'), { recursive: true });
  for (const n of names) {
    const f2 = path.join(dirOf(t2), n);
    if (!fs.existsSync(f2)) { console.log('НЕТ В НОВОМ  ' + n); bad++; continue; }
    const r = await p.evaluate(async ([x, y]) => {
      const load = s => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = s; });
      const [A, B] = await Promise.all([load(x), load(y)]);
      if (A.width !== B.width || A.height !== B.height) return { size: `${A.width}x${A.height} → ${B.width}x${B.height}` };
      const c = document.createElement('canvas'); c.width = A.width; c.height = A.height;
      const g = c.getContext('2d');
      g.drawImage(A, 0, 0); const da = g.getImageData(0, 0, c.width, c.height).data;
      g.drawImage(B, 0, 0); const db = g.getImageData(0, 0, c.width, c.height);
      let n = 0, minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.abs(da[i] - db.data[i]) + Math.abs(da[i + 1] - db.data[i + 1]) + Math.abs(da[i + 2] - db.data[i + 2]);
        if (d > 24) { n++; const px = (i / 4) % c.width, py = (i / 4 / c.width) | 0; minX = Math.min(minX, px); minY = Math.min(minY, py); maxX = Math.max(maxX, px); maxY = Math.max(maxY, py); db.data[i] = 255; db.data[i + 1] = 0; db.data[i + 2] = 255; }
      }
      g.putImageData(db, 0, 0);
      return { n, pct: +(n / (c.width * c.height) * 100).toFixed(3), box: n ? [minX, minY, maxX, maxY] : null, img: n ? c.toDataURL('image/png') : null };
    }, ['data:image/png;base64,' + fs.readFileSync(path.join(dirOf(t1), n)).toString('base64'), 'data:image/png;base64,' + fs.readFileSync(f2).toString('base64')]);
    if (r.size) { console.log('РАЗМЕР       ' + n + ' ' + r.size); bad++; continue; }
    if (r.n) { bad++; fs.writeFileSync(path.join(dirOf(t2 + '-diff'), n), Buffer.from(r.img.split(',')[1], 'base64')); }
    console.log((r.n ? 'ОТЛИЧИЕ      ' : 'одинаково    ') + n + (r.n ? `  ${r.n} пикс. (${r.pct}%) в области ${r.box.join(',')}` : ''));
  }
  await b.close();
  console.log(bad ? `\nОтличаются: ${bad} из ${names.length} (разница — в out/ref/${t2}-diff)` : `\nВсе ${names.length} одинаковы`);
  process.exit(bad ? 1 : 0);
}

(mode === 'save' ? save(a, [b2, ...files]) : diff(a, b2)).catch(e => { console.error(e); process.exit(2); });
