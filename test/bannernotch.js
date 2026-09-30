// Шторка баннера (3.3.15.2, 3.3.15.4, 3.3.15.5 — раскрывается на месте сверху вниз, спрятанная невидима целиком): при наведении выезжает из-под верхнего края картинки баннера и ни в один момент не
// видна выше неё; что закрывает баннер (закреплённая полоса сайта сверху), закрывает и шторку; после нажатия кнопки в шторке
// и ухода мыши шторка задвигается. Всё — со стеклом ивента и без него, без прокрутки и с прокруткой.
// Запуск:  node test/bannernotch.js снимок-своего-профиля.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const url = (snap.match(/"url": "([^"]+)"/) || [, ORIGIN + '/'])[1];
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  for (const [name, glassOff, scroll] of [['стекло', false, 0], ['стекло, прокрутка', false, 60], ['без стекла, прокрутка', true, 60]]) {
    const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.route('**/*', r => {
      const u = new URL(r.request().url()), t = r.request().resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: OWNER }) });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m, off]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, bannerGlassOff: off };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, [src.slice(0, src.indexOf('==/UserScript==')), glassOff]);
    await p.goto(url);
    await p.evaluate(() => document.querySelectorAll('.vp-banner-fx, .custom-image-btn, .custom-change-btn, .custom-cancel-btn, .custom-apply-btn').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    if (scroll) { await p.evaluate(y => scrollTo(0, y), scroll); await p.waitForTimeout(300); }
    await p.mouse.move(5, 880);
    await p.waitForTimeout(500);
    const box = await (await p.$('.vp-banner')).boundingBox();
    const probe = () => p.evaluate(() => {
      const bn = document.querySelector('.vp-banner'), bar = bn.querySelector('.vp-banner-buttons'), img = bn.querySelector('img[alt="Banner"]');
      const g = bn.querySelector('[aria-label="Стекло"]'), gOn = g && getComputedStyle(g).display !== 'none';
      const r = bar.getBoundingClientRect(), cs = getComputedStyle(bar);
      const v = (cs.clipPath.match(/inset\(([^)]*)\)/) || [, '0'])[1].split(/\s+/).map(x => x.endsWith('%') ? r.height * parseFloat(x) / 100 : parseFloat(x) || 0);
      const cut = v[0], cutB = v.length > 2 ? v[2] : v[0];
      const top = Math.max(img.getBoundingClientRect().top, gOn ? g.getBoundingClientRect().top : -1e9);
      return { visTop: r.top + cut, visH: cs.visibility === 'hidden' ? 0 : Math.max(0, r.height - cut - cutB), picTop: top, op: +cs.opacity };
    });
    const hidden = await probe();
    check(hidden.visH < 1 || hidden.op < .01, `${name}: без наведения шторки не видно`);
    await p.mouse.move(box.x + box.width / 2, Math.max(5, box.y + box.height / 2));
    const frames = [];
    for (let i = 0; i < 12; i++) { frames.push(await probe()); await p.waitForTimeout(25); }
    const worst = Math.min(...frames.filter(f => f.visH > .5 && f.op > .02).map(f => f.visTop - f.picTop));
    check(worst >= -0.5, `${name}: в анимации шторка не выше картинки баннера (худший кадр ${worst.toFixed(1)} px)`);
    await p.waitForTimeout(400);
    const shown = await probe();
    check(shown.visH > 30 && Math.abs(shown.visTop - shown.picTop) <= 1 && shown.op > .95, `${name}: шторка висит от верха картинки (${(shown.visTop - shown.picTop).toFixed(1)} px)`);
    await p.screenshot({ path: path.join(__dirname, 'out', `bannernotch-${name.replace(/\W+/g, '-') || glassOff}.png`), clip: { x: box.x, y: 0, width: box.width, height: 200 } });
    const covered = await p.evaluate(() => {
      const bar = document.querySelector('.vp-banner-buttons'), r = bar.getBoundingClientRect();
      const cover = document.createElement('div');
      cover.style.cssText = `position: fixed; left: 0; right: 0; top: 0; height: ${Math.round(r.top + 20)}px; background: #000; z-index: 2;`;
      const main = document.querySelector('.vp-banner').parentElement;
      main.appendChild(cover);
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + 10);
      cover.remove();
      return r.top + 10 < 0 ? true : !!hit && !hit.closest('.vp-banner-buttons');
    });
    check(covered, `${name}: полоса сайта поверх баннера закрывает и шторку`);
    const btn = await p.$('.vp-banner-glass');
    if (btn) {
      await btn.click();
      await p.waitForTimeout(200);
      await btn.click();
      await p.mouse.move(5, 880);
      await p.waitForTimeout(700);
      const after = await probe();
      check(after.visH < 1 || after.op < .01, `${name}: нажал кнопку стекла, увёл мышь — шторка задвинулась (видно ${after.visH.toFixed(0)} px)`);
    }
    check(!errors.length, `${name}: ошибок нет` + (errors.length ? ': ' + errors.join(' | ') : ''));
    await p.close();
  }
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
