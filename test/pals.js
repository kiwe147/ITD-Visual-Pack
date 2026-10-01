// Мику и Тето (3.5.0): вкладка «Мику» в настройках. Включил — Мику держится за экран справа, Тето (отзеркаленная) слева: рука
// уходит за край, низ утоплен за нижний край. Можно оставить одну и поменять размер. Картинки качаются один раз и лежат в браузере.
// Запуск:  node test/pals.js снимок-своего-профиля.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
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
    const r = i.getBoundingClientRect(), m = new DOMMatrix(getComputedStyle(i).transform);
    return { id: i.className.match(/vp-pal-(\w+)/)[1], loaded: i.complete && i.naturalWidth > 0, l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height), flip: m.a < 0, pe: getComputedStyle(i).pointerEvents };
  }));
  const waitLoaded = p => p.waitForFunction(() => [...document.querySelectorAll('.vp-pal')].every(i => i.complete && i.naturalWidth > 0), null, { timeout: 20000 }).catch(() => { });
  let p = await open();
  check((await pals(p)).length === 0, 'по умолчанию выключено — персонажей нет');
  await p.click('.vp-itdx-btn');
  await p.waitForTimeout(300);
  await p.$eval('.vp-stab[data-tab="pals"]', x => x.click());
  await p.waitForTimeout(200);
  const tab = await p.$$eval('.vp-tab-body .settings-option', rs => rs.map(r => r.textContent.trim() + (r.classList.contains('vp-dim') ? '(серое)' : '')));
  console.log('—    вкладка: ' + tab.join(' | '));
  check(tab.length === 4 && /Мику и Тето/.test(tab[0]) && tab.slice(1).every(x => /серое/.test(x)), 'вкладка «Мику»: главный выключатель, остальное серое, пока выключено');
  await p.$eval('.vp-tab-body .settings-option', r => r.click());
  await p.waitForTimeout(400);
  await waitLoaded(p);
  await p.evaluate(() => document.querySelectorAll('.settings-dropdown').forEach(e => e.remove()));
  await p.waitForTimeout(900);
  let s = await pals(p);
  console.log('—    ' + JSON.stringify(s));
  const mk = s.find(x => x.id === 'miku'), tt = s.find(x => x.id === 'teto');
  check(mk && tt && mk.loaded && tt.loaded, 'включил — обе на экране, картинки загрузились');
  check(mk && mk.r > 1400 && mk.l > 700 && mk.b > 900 && !mk.flip, 'Мику справа: рука уходит за правый край, низ утоплен за нижний');
  check(tt && tt.l < 0 && tt.r < 700 && tt.b > 900 && tt.flip, 'Тето слева, отзеркалена: рука за левым краем, низ утоплен');
  check(mk && Math.abs(mk.h - 405) < 6, `высота по умолчанию — 45% экрана (${mk && mk.h} из 900)`);
  check(s.every(x => x.pe === 'none'), 'сквозь них можно кликать');
  const layer = await p.evaluate(() => { const box = document.querySelector('.vp-pals'), z = +getComputedStyle(box).zIndex; return { z, rail: +getComputedStyle(document.querySelector('.vp-rail') || document.body).zIndex || 0 }; });
  check(layer.z > layer.rail && layer.z < 10001, `персонажи над страницей и правой панелью, но под меню настроек и окнами сайта (слой ${layer.z})`);
  await p.screenshot({ path: path.join(__dirname, 'out', 'pals-screen.png') });
  const sync = await p.evaluate(async () => {
    const box = document.querySelector('.vp-pals'), batches = [];
    const mo = new MutationObserver(rs => batches.push(rs.filter(r => r.attributeName === 'src').map(r => r.target.className.match(/vp-pal-(\w+)/)[1]).join(',')));
    mo.observe(box, { attributes: true, subtree: true, attributeFilter: ['src'] });
    const out = {};
    document.querySelector('.vp-pal-teto').remove();
    window.__palsApply && window.__palsApply();
    await new Promise(r => setTimeout(r, 1500));
    mo.disconnect();
    return { out, batches };
  });
  const pace = n => { const b = fs.readFileSync(path.join(__dirname, '..', 'assets', n)); let i = 12, k = 0, d = 0;
    while (i < b.length) { const L = b.readUInt32LE(i + 4); if (b.toString('latin1', i, i + 4) === 'ANMF') { k++; d += b.readUIntLE(i + 20, 3); } i += 8 + L + (L & 1); } return { n: k, d }; };
  sync.out = { miku: pace('miku.webp'), teto: pace('teto.webp') };
  console.log('—    ' + JSON.stringify(sync));
  check(sync.out.miku.n === 221 && sync.out.teto.n === 221 && sync.out.miku.d === 8500 && sync.out.teto.d === 8500, `обе по 221 кадру, круг 8,5 с — прыжок (13 кадров) ровно 0,5 с, 120 в минуту (${JSON.stringify(sync.out)})`);
  check(sync.batches.length === 1 && sync.batches[0] === 'miku,teto', `вернул Тето — обе перезапустились в один момент (${JSON.stringify(sync.batches)})`);
  const edge = await p.evaluate(() => ({ cw: document.documentElement.clientWidth, iw: innerWidth }));
  check(edge.cw === edge.iw, `полосы прокрутки справа нет — Мику прижата к самому краю экрана (${edge.cw} из ${edge.iw})`);
  const shot = await p.screenshot({ clip: { x: 1392, y: 620, width: 8, height: 200 } });
  const col = await p.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(img.width - 1, 0, 1, img.height).data; let lit = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 120) lit++;
    return lit / img.height;
  }, shot.toString('base64'));
  check(col > 0.6, `рука доходит до последнего столбца пикселей экрана (закрашено ${Math.round(col * 100)}% столбца у края)`);
  for (let i = 0; i < 2 && !(await p.$('.vp-stab[data-tab="pals"]')); i++) { await p.click('.vp-itdx-btn'); await p.waitForTimeout(300); }
  await p.$eval('.vp-stab[data-tab="pals"]', x => x.click());
  await p.waitForTimeout(200);
  await p.$$eval('.vp-tab-body .settings-option', rs => rs.find(r => /Тето слева/.test(r.textContent)).click());
  await p.$eval('.vp-tab-body input[type="range"]', i => { i.value = 60; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.waitForTimeout(300);
  s = await pals(p);
  check(s.length === 1 && s[0].id === 'miku' && Math.abs(s[0].h - 540) < 6 && await p.evaluate(() => document.documentElement.classList.contains('vp-pals-r')), `Тето выключил, размер 60% — осталась Мику высотой ${s[0] && s[0].h}`);
  const fx = {};
  for (const name of ['Неон', 'Под тему', 'Как есть']) {
    if (!(await p.$('.vp-stab[data-tab="pals"]'))) { await p.click('.vp-itdx-btn'); await p.waitForTimeout(300); await p.$eval('.vp-stab[data-tab="pals"]', x => x.click()); await p.waitForTimeout(200); }
    await p.$$eval('.vp-tab-body .nick-style-option', (rs, n) => rs.find(r => r.textContent.trim() === n).click(), name);
    await p.waitForTimeout(200);
    fx[name] = await p.evaluate(() => ({ f: getComputedStyle(document.querySelector('.vp-pal-miku')).filter, on: [...document.querySelectorAll('.vp-tab-body .nick-style-option.vp-active')].map(r => r.textContent.trim()).join() }));
    if (name === 'Неон') await p.screenshot({ path: path.join(__dirname, 'out', 'pals-neon.png'), clip: { x: 900, y: 400, width: 500, height: 500 } });
    if (name === 'Неон') { const m = await p.$('.settings-dropdown'); if (m) await m.screenshot({ path: path.join(__dirname, 'out', 'pals-tab.png') }); }
  }
  console.log('—    вид: ' + JSON.stringify(fx));
  check(/drop-shadow/.test(fx['Неон'].f) && /rgba\(120, 255, 245/.test(fx['Неон'].f) && fx['Неон'].on === 'Неон', 'вид «Неон»: светящийся контур в её цвете, отмечен в настройках');
  check(/brightness\(0\.82\)/.test(fx['Под тему'].f) && fx['Под тему'].on === 'Под тему', 'вид «Под тему»: приглушена и с тенью');
  check(fx['Как есть'].f === 'none' && store.palLook === 'plain', 'вид «Как есть»: без эффектов, выбор сохранён');
  const n = asked.length;
  await p.close();
  p = await open();
  await waitLoaded(p);
  s = await pals(p);
  check(s.length === 1 && s[0].loaded && asked.length === n, `после перезагрузки Мику на месте, повторно не качалась (запросов было ${n}, стало ${asked.length})`);
  check(asked.every(u => /\/main\/assets\//.test(u)), 'качается из папки assets репозитория');
  check(!p.errors.length, 'ошибок нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
