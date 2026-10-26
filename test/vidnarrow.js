// Узкое (вертикальное) видео в посте: панель плеера растягивается на всю ширину колонки поста, все кнопки на месте и влезают; само видео не меняется.
// Запуск:  node test/vidnarrow.js снимок-ленты.html   (скрин — C:/Code/Kwork/build/vid-now.png)
const { chromium } = require('playwright');
const fs = require('fs');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || 'C:/Code/ITD/ITD-repo/ITD-Visual-Pack.user.js', 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const W = +process.env.W || 1400;
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: W, height: 1000 } })).newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.route('**/*', r => { const req = r.request(), u = new URL(req.url()), t = req.resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (u.pathname === '/vid.svg') return r.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280"><rect width="720" height="1280" fill="#2a6"/></svg>' });
    if (t === 'image' || t === 'font') return r.abort();
    if (t === 'stylesheet') return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    return r.fulfill({ status: 404, body: '' }); });
  await p.addInitScript(m => { const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window; }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(800);
  await p.evaluate(() => {
    document.querySelectorAll('.vp-rail, .vp-nav-blob, .vp-fab, .settings-dropdown, .vp-itdx-btn, .vp-msgs, .vp-pals, .nick-controls-panel, .vp-vbar, .vp-vflash').forEach(e => e.remove());
    const x = document.querySelector('article .xfcs');
    x.querySelectorAll('[data-count]').forEach(e => e.remove());
    x.insertAdjacentHTML('beforeend', '<div data-count="1" class="RQNZ DE55"><div class="w6EH"><div class="Tk7p"><video preload="metadata" playsinline="" loop="" width="' + (window.VW || 720) + '" height="' + (window.VH || 1280) + '" class="vrxE vp-post-media"></video><div class="toyG"><button type="button" aria-label="Pause" class="vIdE ZNxu">p</button><button type="button" aria-label="Fullscreen" class="vIdE ZiaF">f</button><button type="button" aria-label="Mute" class="pbWr">m</button></div></div></div></div>');
    x.closest('article').scrollIntoView({ block: 'center' });
  });
  await p.addScriptTag({ content: src }); await p.waitForTimeout(1500);
  const m = () => p.evaluate(() => { const v = document.querySelector('.vrxE'), q = s => { const e = v.closest(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.width), Math.round(r.height)]; }; const bar = document.querySelector('.vp-vbar'); const br = bar && bar.getBoundingClientRect(); const row = document.querySelector('.vp-vrow'); return { video: [Math.round(v.getBoundingClientRect().left), Math.round(v.getBoundingClientRect().width), Math.round(v.getBoundingClientRect().height)], box: q('.Tk7p'), w6EH: q('.w6EH'), RQNZ: q('.RQNZ'), bar: br && [Math.round(br.left), Math.round(br.width)], rowScroll: row && [row.scrollWidth, row.clientWidth] }; });
  const fails = [];
  const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
  const box = await p.$('.Tk7p'); await box.hover(); await p.waitForTimeout(400);
  const r = await m();
  check(r.box[1] === r.video[1] && r.box[1] < r.RQNZ[1] - 100, 'само видео узкое и не растянулось (' + r.box[1] + ' из ' + r.RQNZ[1] + ')');
  check(Math.abs((r.box[0] + r.box[1] / 2) - (r.RQNZ[0] + r.RQNZ[1] / 2)) <= 2, 'видео по центру колонки поста (центр видео ' + Math.round(r.box[0] + r.box[1] / 2) + ', центр колонки ' + Math.round(r.RQNZ[0] + r.RQNZ[1] / 2) + ')');
  check(r.bar[0] === r.RQNZ[0] && r.bar[1] === r.RQNZ[1], 'панель во всю ширину колонки поста: ' + r.bar[1] + ' из ' + r.RQNZ[1]);
  check(r.rowScroll[0] <= r.rowScroll[1] + 1, 'кнопки панели влезают в одну строку');
  check(await p.evaluate(() => [...document.querySelectorAll('.vp-vfull, .vp-vpip:not([hidden]), .vp-vrate')].every(b => b.getBoundingClientRect().right <= document.querySelector('.vp-vbar').getBoundingClientRect().right && b.innerHTML.length > 3 || b.classList.contains('vp-vrate'))), 'у кнопок «во весь экран» и «картинка в картинке» есть значки');
  const art = await p.$('article:has(.Tk7p)'); await art.screenshot({ path: process.env.SHOT || 'C:/Code/Kwork/build/vid-now.png' });
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
