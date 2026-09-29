// ПК: навёл мышь на видео — звук включается, увёл — выключается. Лента (видео в посте) и галерея (плитка с видео).
// Видео — test/out/bg-test.mp4 (подставляется вместо файлов сайта).
// Запуск:  node test/hoversound.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const mp4 = fs.readFileSync(path.join(__dirname, 'out', 'bg-test.mp4'));
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (/\.mp4(\?|$)/.test(u.pathname) || t === 'media') return r.fulfill({ contentType: 'video/mp4', body: mp4 });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.pathname === '/api/posts') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: [
      { id: 'v1', author: { username: 'a' }, attachments: [{ type: 'video', url: 'https://cdn.xn--d1ah4a.com/videos/v1.mp4', width: 640, height: 360 }] }],
      pagination: { nextCursor: null } } }) });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob, .vp-post-tools, .vp-post-refresh').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);

  // лента: видео в посте (на снимке одно; нет — ставим своё в медиа первого поста)
  const has = await p.evaluate(() => {
    let v = document.querySelector('article video');
    if (!v) {
      const box = document.querySelector('.vp-post-media') || document.querySelector('article');
      v = document.createElement('video'); v.style.cssText = 'display:block;width:400px;height:225px'; box.prepend(v);
    }
    v.src = 'https://cdn.xn--d1ah4a.com/videos/feed.mp4'; v.muted = true; v.loop = true; v.play().catch(() => { });
    v.scrollIntoView({ block: 'center' });
    return true;
  });
  await p.waitForTimeout(800);
  const box = await p.$eval('article video', v => { const r = v.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.move(5, 5);
  await p.mouse.move(box.x, box.y, { steps: 4 });
  await p.waitForTimeout(300);
  let st = await p.$eval('article video', v => ({ muted: v.muted, paused: v.paused }));
  check(has && !st.muted && !st.paused, `лента: навёл — звук включён, видео играет (${JSON.stringify(st)})`);
  await p.mouse.move(5, 5, { steps: 4 });
  await p.waitForTimeout(300);
  st = await p.$eval('article video', v => ({ muted: v.muted }));
  check(st.muted, 'лента: увёл — снова без звука');

  // галерея: плитка с видео
  await p.$eval('.vp-gal-nav', a => a.click());
  await p.waitForTimeout(2000);
  const t = await p.$eval('.vp-gal-tile', el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 3 }; });
  await p.mouse.move(t.x, t.y, { steps: 4 });
  await p.waitForTimeout(300);
  st = await p.$eval('.vp-gal-tile video', v => ({ muted: v.muted }));
  check(!st.muted, 'галерея: навёл на плитку с видео — звук включён');
  await p.mouse.move(t.x, 5, { steps: 4 });
  await p.waitForTimeout(300);
  st = await p.$eval('.vp-gal-tile video', v => ({ muted: v.muted }));
  check(st.muted, 'галерея: увёл — снова без звука');

  // громкость галереи (3.3.10.5): кнопка справа от вкладок, ползунок при наведении
  const vb = await p.$eval('.vp-gal-vol-b', e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; }).catch(() => null);
  check(vb && vb.w === 45, `галерея: кнопка громкости есть (${JSON.stringify(vb)})`);
  await p.mouse.move(vb.x, vb.y, { steps: 3 }); await p.waitForTimeout(300);
  const pop = await p.$eval('.vp-gal-vol-p', e => { const r = e.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { vis: getComputedStyle(e).visibility, op: +getComputedStyle(e).opacity, inWin: r.left >= 0 && r.right <= innerWidth, top: !!hit && e.contains(hit), label: e.querySelector('span').textContent }; });
  check(pop.vis === 'visible' && pop.op === 1 && pop.inWin && pop.top && pop.label === '100%', `наведение — ползунок виден, поверх всего, 100% (${JSON.stringify(pop)})`);
  await p.screenshot({ path: path.join(__dirname, 'out', 'galvol.png'), clip: { x: Math.max(0, vb.x - 260), y: Math.max(0, vb.y - 40), width: 320, height: 130 } });
  await p.$eval('.vp-gal-vol-p input', r => { r.value = 30; r.dispatchEvent(new Event('input', { bubbles: true })); });
  const saved = await p.evaluate(() => GM_getValue('galVol'));
  check(saved === 0.3, `ползунок на 30% — сохранилось ${saved}`);
  await p.mouse.move(t.x, t.y, { steps: 4 }); await p.waitForTimeout(300);
  st = await p.$eval('.vp-gal-tile video', v => ({ muted: v.muted, vol: v.volume }));
  check(!st.muted && Math.abs(st.vol - .3) < .01, `навёл на видео — звук на 30% (${JSON.stringify(st)})`);
  await p.mouse.move(vb.x, vb.y, { steps: 3 }); await p.waitForTimeout(200);
  await p.mouse.click(vb.x, vb.y); await p.waitForTimeout(200);
  const off = await p.evaluate(() => ({ v: GM_getValue('galVol'), label: document.querySelector('.vp-gal-vol-p span').textContent, cross: document.querySelectorAll('.vp-gal-vol-b svg path').length }));
  await p.mouse.move(t.x, t.y, { steps: 4 }); await p.waitForTimeout(300);
  st = await p.$eval('.vp-gal-tile video', v => ({ muted: v.muted }));
  check(off.v === 0 && off.label === '0%' && st.muted, `щелчок по кнопке — без звука, наведение звук не включает (${JSON.stringify(off)}, ${JSON.stringify(st)})`);
  await p.mouse.move(vb.x, vb.y, { steps: 3 }); await p.waitForTimeout(200);
  await p.mouse.click(vb.x, vb.y); await p.waitForTimeout(200);
  check(await p.evaluate(() => GM_getValue('galVol')) === 0.3, 'второй щелчок — вернулось прежние 30%');
  await p.mouse.wheel(0, -100); await p.waitForTimeout(200);
  check(await p.evaluate(() => GM_getValue('galVol')) === 0.35, 'колёсико вверх над кнопкой — громче на 5%');
  const scrolled = await p.$eval('.vp-gal-body', b => b.scrollTop);
  check(scrolled === 0, `колёсико над кнопкой не листает галерею (${scrolled})`);
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
