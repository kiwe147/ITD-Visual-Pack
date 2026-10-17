// Перетаскивание картинок при создании поста (3.6.0): две ветки — через состояние сайта (подделанная запись React) и запасная (картинки убираются и добавляются заново по порядку).
// Запуск:  node test/thumbs.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
let src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
if (process.env.DBG) src = src.replace('const logErr = (where, e) => {', "const logErr = (where, e) => { console.log('VPERR', where, e && (e.message || e));");
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    p.errors = [];
    p.on('pageerror', e => p.errors.push(e.message));
    await p.route('**/*', r => {
      const u = new URL(r.request().url()), t = r.request().resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (t === 'image' || t === 'font') return r.abort();
      if (t === 'stylesheet') return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(m => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, src.slice(0, src.indexOf('==/UserScript==')));
    await p.goto(ORIGIN + '/');
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(1800);
    return { p, ctx };
  };
  const build = (p, withFiber) => p.evaluate(withFiber => {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:200px;top:120px;z-index:99999;width:600px;background:#222;padding:20px';
    const names = ['A', 'B', 'C'], colors = ['#c0392b', '#27ae60', '#2980b9'];
    const urls = names.map((n, i) => {
      const c = document.createElement('canvas'); c.width = 120; c.height = 90;
      const g = c.getContext('2d'); g.fillStyle = colors[i]; g.fillRect(0, 0, 120, 90); g.fillStyle = '#fff'; g.font = '40px sans-serif'; g.fillText(n, 40, 60);
      return new Promise(r => c.toBlob(bl => r(URL.createObjectURL(bl)), 'image/png'));
    });
    return Promise.all(urls).then(list => {
      const box = document.createElement('div');
      box.id = 'tbox'; box.style.cssText = 'display:flex;gap:10px';
      const add = (url, name) => {
        const th = document.createElement('div');
        th.className = 'tt'; th.dataset.n = name; th.style.cssText = 'position:relative;width:120px;height:90px';
        th.innerHTML = '<img style="width:120px;height:90px" src="' + url + '"><button type="button" class="rm">x</button>';
        th.querySelector('.rm').onclick = () => th.remove();
        box.appendChild(th);
      };
      list.forEach((u, i) => add(u, names[i]));
      host.appendChild(box);
      const input = document.createElement('input');
      input.type = 'file'; input.style.display = 'none'; host.appendChild(input);
      input.addEventListener('change', () => { const f = input.files[0]; const u = URL.createObjectURL(f); setTimeout(() => add(u, f.name), 60); });
      document.body.appendChild(host);
      window.__got = null;
      if (withFiber) box['__reactFiber$x'] = { memoizedState: null, return: { memoizedState: { memoizedState: names.map(n => ({ mediaId: n })), queue: { dispatch: arr => { window.__got = [...arr].map(x => x.mediaId); } }, next: null } } };
    });
  }, withFiber);
  const drag = async (p, from, to) => {
    const a = await p.locator('#tbox > .tt').nth(from).boundingBox(), t = await p.locator('#tbox > .tt').nth(to).boundingBox();
    await p.mouse.move(a.x + 40, a.y + 40); await p.mouse.down();
    await p.mouse.move(a.x + 60, a.y + 44, { steps: 3 });
    await p.mouse.move(t.x + 50, t.y + 45, { steps: 8 });
    const during = await p.evaluate(() => ({ lift: !!document.querySelector('.vp-thumb-lift'), over: !!document.querySelector('.vp-thumb-over') }));
    await p.mouse.up();
    return during;
  };

  let A = await open();
  await build(A.p, true);
  await A.p.waitForTimeout(500);
  check(await A.p.locator('#tbox.vp-thumbs > .vp-thumb').count() === 3, 'три картинки распознаны как миниатюры');
  const d = await drag(A.p, 0, 2);
  check(d.lift && d.over, 'во время перетаскивания миниатюра приподнята, цель подсвечена');
  await A.p.waitForTimeout(200);
  const got = JSON.stringify(await A.p.evaluate(() => window.__got));
  check(got === '["B","C","A"]', 'первая перетащена на третье место: ' + got);
  check(await A.p.locator('.vp-thumb-lift, .vp-thumb-over').count() === 0, 'подсветка снята');
  await A.p.evaluate(() => { window.__got = null; });
  const a1 = await A.p.locator('#tbox > .tt').nth(1).boundingBox();
  await A.p.mouse.move(a1.x + 40, a1.y + 40); await A.p.mouse.down(); await A.p.mouse.up();
  check(await A.p.evaluate(() => window.__got) === null && await A.p.locator('#tbox > .tt').count() === 3, 'простое нажатие ничего не меняет');
  check(A.p.errors.length === 0, 'нет ошибок страницы ' + A.p.errors.join('|'));
  await A.ctx.close();

  A = await open();
  A.p.on('console', m => { if (process.env.DBG) console.log('CONSOLE', m.text().slice(0, 200)); });
  await build(A.p, false);
  await A.p.waitForTimeout(500);
  await drag(A.p, 0, 2);
  await A.p.waitForFunction(() => [...document.querySelectorAll('#tbox > .tt')].filter(t => /^photo-/.test(t.dataset.n)).length === 3 && !document.querySelector('.vp-thumbs-busy'), null, { timeout: 15000 }).catch(() => { });
  const order = await A.p.evaluate(() => [...document.querySelectorAll('#tbox > .tt')].map(t => t.dataset.n));
  check(/^photo-1.(png|jpg),photo-2.(png|jpg),photo-3.(png|jpg)$/.test(order.join(',')), 'запасная ветка: картинки добавлены заново по порядку: ' + order.join(','));
  const px = await A.p.evaluate(async () => {
    const out = [];
    for (const im of document.querySelectorAll('#tbox > .tt img')) {
      await im.decode();
      const c = document.createElement('canvas'); c.width = 2; c.height = 2;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0, 2, 2);
      const d = g.getImageData(0, 0, 1, 1).data; out.push([d[0], d[1], d[2]].join(','));
    }
    return out;
  });
  const near = (a, b) => a.split(',').every((v, i) => Math.abs(v - b.split(',')[i]) < 14);
  check(px.length === 3 && near(px[0], '39,174,96') && near(px[1], '41,128,185') && near(px[2], '192,57,43'), 'порядок картинок B, C, A по цвету: ' + px.join('|'));
  check(A.p.errors.length === 0, 'нет ошибок страницы ' + A.p.errors.join('|'));
  await A.ctx.close();
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
