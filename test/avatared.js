// Редактор аватарки (3.7.5): нажатие на свою большую аву в профиле открывает окно с кружком-примеркой, картинка двигается и приближается, «Применить» отправляет квадрат на /api/files/avatar.
// Запуск:  node test/avatared.js снимок-своего-профиля.html [картинка.png]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const pic = fs.readFileSync(process.argv[3] || 'C:/Code/ITD/promo/glbuild/ava_test.png');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8')
  .replace('function openText(content) {', 'window.__ot = c => openText(c); function openText(content) {');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const UUID = '11111111-2222-4333-8444-555555555555';
const NEW = 'https://cdn.xn--d1ah4a.com/images/' + UUID + '.jpg';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch();
  for (const phone of [true, false]) {
    const ctx = await b.newContext(phone ? { viewport: { width: 412, height: 860 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    const errors = [], calls = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.route('**/*', async r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/files/upload') {
        const body = req.postDataBuffer() || Buffer.alloc(0);
        calls.push({ what: 'upload', size: body.length, jpeg: body.includes(Buffer.from([0xff, 0xd8, 0xff])) });
        return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { url: NEW } }) });
      }
      if (/\/comments$/.test(u.pathname) && req.method() === 'POST') { calls.push({ what: 'comment', text: JSON.parse(req.postData()).content }); return r.fulfill({ status: 201, contentType: 'application/json', body: '{"data":{"id":"c1"}}' }); }
      if (u.pathname === '/api/users/me' && req.method() === 'GET') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: 'NeuroSFW', id: OWNER, avatar: 'https://cdn.xn--d1ah4a.com/images/avatars/0b46cd5f-2b28-4739-8395-bb9ea544c7d2.jpg' }) });
      if (u.pathname === '/api/users/me' && req.method() === 'PUT') { calls.push({ what: 'put', body: req.postData() }); return r.fulfill({ contentType: 'application/json', body: '{}' }); }
      if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, [src.slice(0, src.indexOf('==/UserScript=='))]);
    await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
        await p.goto(ORIGIN + '/@NeuroSFW');
    await p.waitForTimeout(2500);
    const tag = phone ? 'телефон' : 'компьютер';
    const spot = await p.evaluate(() => { const av = [...document.querySelectorAll('.vp-avatar.vp-ava-edit')][0]; if (!av) return null; const r = av.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width }; });
    check(!!spot, tag + ': своя большая ава помечена для нажатия' + (spot ? ' (' + Math.round(spot.w) + ' px)' : ''));
    if (!spot) { await ctx.close(); continue; }
    const small = await p.evaluate(() => [...document.querySelectorAll('.vp-avatar')].filter(a => a.getBoundingClientRect().width < 60 && a.classList.contains('vp-ava-edit')).length);
    check(small === 0, tag + ': маленькие авы (комментарии, посты) не помечены');
    if (phone) await p.touchscreen.tap(spot.x, spot.y); else await p.mouse.click(spot.x, spot.y);
    await p.waitForTimeout(500);
    check(await p.evaluate(() => !!document.querySelector('.vp-ave')), tag + ': нажатие открывает редактор');
    check(await p.evaluate(() => document.querySelector('.vp-ave-ok').disabled), tag + ': «Применить» выключено, пока не выбрана картинка');
    await p.setInputFiles('.vp-ave input[type=file]', { name: 'me.png', mimeType: 'image/png', buffer: pic });
    await p.waitForTimeout(600);
    check(await p.evaluate(() => !document.querySelector('.vp-ave-ok').disabled && !document.querySelector('.vp-ave-zoom input').disabled), tag + ': после выбора картинки доступны масштаб и «Применить»');
    const px = async () => (await p.locator('.vp-ave-stage').screenshot()).toString('base64').length + ':' + require('crypto').createHash('md5').update(await p.locator('.vp-ave-stage').screenshot()).digest('hex');
    const before = await px();
    const box = await p.evaluate(() => { const r = document.querySelector('.vp-ave-stage').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width }; });
    await p.evaluate(() => { const i = document.querySelector('.vp-ave-zoom input'); i.value = 300; i.dispatchEvent(new Event('input', { bubbles: true })); });
    await p.mouse.move(box.x, box.y); await p.mouse.down(); await p.mouse.move(box.x - box.w / 3, box.y, { steps: 6 }); await p.mouse.up();
    const after = await px();
    check(before !== after, tag + ': масштаб и перетаскивание меняют картинку (' + before + ' → ' + after + ')');
    await p.screenshot({ path: path.join(__dirname, 'out', 'avatared-' + (phone ? 'phone' : 'desk') + '.png') });
    await p.click('.vp-ave-ok');
    await p.waitForTimeout(3500);
    check(calls.some(c => c.what === 'upload' && c.size > 2000), tag + ': на сервер ушла картинка-квадрат ' + JSON.stringify(calls.find(c => c.what === 'upload') || {}));
    const posted = await Promise.all(calls.filter(c => c.what === 'comment').map(c => p.evaluate(t => window.__ot(t), c.text)));
    check(posted.some(t => /^ITDXL1 /.test(t) && t.includes(' a=1' + UUID.replace(/-/g, ''))), tag + ': в стиле профиля записана ссылка на аватарку ' + JSON.stringify(posted.map(t => t.slice(0, 120))));
    check(await p.evaluate(() => !document.querySelector('.vp-ave')), tag + ': редактор закрылся');
    const own = await p.evaluate(() => [...document.querySelectorAll('.vp-avatar[data-vp-ava]')].length);
    check(own > 0, tag + ': своя аватарка на странице заменена (' + own + ')');
    const css = await p.evaluate(() => { const a = document.querySelector('.vp-avatar[data-vp-ava]'); return a ? getComputedStyle(a, '::before').backgroundImage.slice(0, 90) : ''; });
    check(/images\/1111/.test(css) || /UUID/.test(css) || css.includes(UUID), tag + ': картинка подставлена поверх (' + css + ')');
    const dot = await p.evaluate(() => { const d = document.querySelector('.vp-avatar[data-vp-ava] > span:not([class*="vASP"])'); if (!d) return null; const r = d.getBoundingClientRect(), e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { top: e === d, w: Math.round(r.width) }; });
    check(dot && dot.top, tag + ': точка «в сети» поверх аватарки (' + JSON.stringify(dot) + ')');
    const big = await p.evaluate(() => { const a = document.querySelector('.vp-avatar.vp-ava-edit'); const r = a.getBoundingClientRect(); return { x: Math.max(0, r.x - 20), y: Math.max(0, r.y - 20), width: r.width + 40, height: r.height + 40 }; });
    await p.screenshot({ path: path.join(__dirname, 'out', 'avatared-dot-' + (phone ? 'phone' : 'desk') + '.png'), clip: big });
    check(!errors.length, tag + ': ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
    await ctx.close();
  }
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
