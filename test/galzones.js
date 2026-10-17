// Стрелки галереи и просмотра картинок в сообщениях заменены зонами по краям на всю высоту (на ПК и на телефоне).
// Плитка и окно просмотра собираются руками с теми же классами, что делает мод (само окно галереи в стенде не открывается).
// Запуск:  node test/galzones.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const near = (a, b, d) => Math.abs(a - b) <= d;
const TILE = `<div id="zt" class="vp-gal-tile vp-multi" style="position:relative;width:320px;height:420px;margin:20px">
  <div class="vp-gal-strip"><div class="vp-gal-slide"></div><div class="vp-gal-slide"></div></div>
  <span class="vp-gal-count">1/2</span><div class="vp-gal-dots"><i class="vp-on"></i><i></i></div>
  <button type="button" class="vp-gal-arrow vp-prev vp-edge"><svg viewBox="0 0 24 24" width="28" height="28"><path d="m14.5 6-6 6 6 6"/></svg></button>
  <button type="button" class="vp-gal-arrow vp-next"><svg viewBox="0 0 24 24" width="28" height="28"><path d="m9.5 6 6 6-6 6"/></svg></button>
  <div class="vp-gal-acts"><button type="button" class="vp-gal-act" data-act="like">L</button></div>
  <div class="vp-gal-acts vp-gal-acts-r"><button type="button" class="vp-gal-act" data-act="link">K</button></div></div>`;
const LB = `<div id="zl" class="vp-msgs-lb"><div class="vp-msgs-lb-top"></div>
  <div class="vp-msgs-lb-body"><button type="button" class="vp-msgs-lb-nav vp-prev">‹</button><img alt="" width="200" height="200"><button type="button" class="vp-msgs-lb-nav vp-next">›</button></div></div>`;
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  async function open(mobile, lbMode) {
    const ctx = await b.newContext(mobile ? { viewport: { width: 392, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
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
    await p.evaluate(() => {
      document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob, .vp-itdx-btn, .vp-msgs, .vp-gal').forEach(e => e.remove());
      document.querySelectorAll('style').forEach(st => { if (/vp-gal-arrow|vp-msgs-lb-nav/.test(st.textContent)) st.remove(); });
    });
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(1500);
    if (lbMode) {
      await p.click('nav a[href="#"]');
      await p.waitForSelector('.vp-msgs.vp-open', { timeout: 5000 });
      await p.evaluate(lb => document.querySelector('.vp-msgs').insertAdjacentHTML('beforeend', lb), LB);
    } else {
      await p.evaluate(tile => {
        const box = document.createElement('div');
        box.className = 'vp-gal';
        box.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:99998;overflow:auto';
        box.innerHTML = '<div class="vp-gal-body"><div class="vp-gal-grid">' + tile + '</div></div>';
        document.body.appendChild(box);
      }, TILE);
    }
    return { p, ctx, errors };
  }
  const R = (p, sel) => p.$eval(sel, e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, op: getComputedStyle(e).opacity, rad: getComputedStyle(e).borderRadius, svg: e.querySelector('svg') ? getComputedStyle(e.querySelector('svg')).display : null }; });

  let A = await open(false);
  const t = await R(A.p, '#zt'), pv = await R(A.p, '#zt .vp-prev'), nx = await R(A.p, '#zt .vp-next');
  check(near(pv.y, t.y, 1) && near(pv.h, t.h, 1) && near(nx.y, t.y, 1) && near(nx.h, t.h, 1), `ПК: зоны на всю высоту плитки (${Math.round(pv.h)} и ${Math.round(nx.h)} из ${Math.round(t.h)})`);
  check(near(pv.x, t.x, 1) && near(nx.x + nx.w, t.x + t.w, 1), 'ПК: левая зона у левого края, правая у правого');
  check(near(nx.w, Math.min(96, t.w * 0.22), 1.5), `ПК: ширина зоны ${Math.round(nx.w)} (22% плитки, не больше 96)`);
  check(nx.rad === '0px', 'ПК: зона без скругления');
  check(nx.svg === 'block' || nx.svg === 'none', 'ПК: значок стрелки есть в зоне');
  check(pv.op === '0' && nx.op === '1', `ПК: у первой картинки левая зона невидима (${pv.op}), правая на месте (${nx.op})`);
  const hit = (x, y) => A.p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e && (e.closest('.vp-gal-arrow') ? (e.closest('.vp-prev') ? 'prev' : 'next') : e.closest('.vp-gal-act') ? 'act' : e.closest('.vp-gal-strip') ? 'strip' : e.className); }, [x, y]);
  check(await hit(nx.x + nx.w / 2, t.y + t.h / 2) === 'next', 'ПК: нажатие у правого края посередине — «дальше»');
  check(await hit(nx.x + nx.w / 2, t.y + 6) === 'next' && await hit(nx.x + nx.w / 2, t.y + t.h - 6) === 'next', 'ПК: зона достаёт и до верха, и до низа карточки');
  check(await hit(pv.x + pv.w / 2, t.y + t.h / 2) === 'prev', 'ПК: левый край у первой картинки зона есть (ловит нажатие, пост не откроется)');
  check(await hit(t.x + t.w / 2, t.y + t.h / 2) === 'strip', 'ПК: середина карточки — не зона');
  const act = await R(A.p, '#zt .vp-gal-act[data-act="like"]');
  check(await hit(act.x + act.w / 2, act.y + act.h / 2) === 'act', 'ПК: кнопка лайка внизу слева выше зоны');
  const actR = await R(A.p, '#zt .vp-gal-act[data-act="link"]');
  check(await hit(actR.x + actR.w / 2, actR.y + actR.h / 2) === 'act', 'ПК: кнопка справа внизу выше зоны');
  await A.p.mouse.move(nx.x + nx.w / 2, t.y + t.h / 2);
  await A.p.waitForTimeout(400);
  const bg = await A.p.$eval('#zt .vp-next', e => getComputedStyle(e).backgroundImage);
  check(/linear-gradient/.test(bg), 'ПК: при наведении на зону лёгкий градиент');
  await A.p.mouse.move(5, 5);
  await A.p.waitForTimeout(400);
  const bg2 = await A.p.$eval('#zt .vp-next', e => getComputedStyle(e).backgroundImage);
  check(bg2 === 'none', 'ПК: без наведения зона прозрачная');

  await A.ctx.close();
  A = await open(false, true);
  const lb = await R(A.p, '#zl .vp-msgs-lb-body'), lp = await R(A.p, '#zl .vp-prev'), ln = await R(A.p, '#zl .vp-next');
  check(near(lp.h, lb.h, 1) && near(ln.h, lb.h, 1) && near(lp.y, lb.y, 1), `ПК, просмотр картинок: зоны на всю высоту (${Math.round(lp.h)} из ${Math.round(lb.h)})`);
  check(near(lp.x, lb.x, 1) && near(ln.x + ln.w, lb.x + lb.w, 1), 'ПК, просмотр картинок: зоны у краёв окна');
  check(ln.w <= 181 && ln.w > 60, `ПК, просмотр картинок: ширина зоны ${Math.round(ln.w)}`);
  check(A.errors.length === 0, 'нет ошибок страницы ' + A.errors.join('|'));
  await A.ctx.close();

  A = await open(true);
  const mp = await R(A.p, '#zt .vp-next'), mt = await R(A.p, '#zt');
  check(await A.p.$eval('#zt .vp-next', e => getComputedStyle(e).display) === 'none' && await A.p.$eval('#zt .vp-prev', e => getComputedStyle(e).display) === 'none', 'телефон: ни стрелок, ни зон, листание только пальцем');
  await A.ctx.close();

  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
