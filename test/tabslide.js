// Листание вкладок на ПК: переход по пункту левого меню — старая страница уезжает, новая выезжает как продолжение.
// Сайт имитируется: ссылка меню → pushState и через 140 мс центр заменяется другой страницей.
// Запуск:  node test/tabslide.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const near = (a, b, d) => Math.abs(a - b) <= d;
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  async function fresh(opts = {}) {
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, reducedMotion: opts.reduce ? 'reduce' : 'no-preference' });
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
      if (u.pathname === '/api/posts') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: [], pagination: { nextCursor: null } } }) });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m, off]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      if (off) s.tabSlide = false;
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
      window.__block = false;
      const center = () => { const a = document.querySelector('aside.vp-sidebar'); return a && [...a.parentElement.children].find(c => c.tagName !== 'ASIDE' && c.getBoundingClientRect().width > 300); };
      document.addEventListener('click', e => {
        const a = e.target.closest && e.target.closest('a[href^="/"]');
        if (!a || e.defaultPrevented) return;
        e.preventDefault();
        if (window.__block) return;
        const href = a.getAttribute('href');
        if (href === location.pathname) return;
        history.pushState({ site: href }, '', href);
        setTimeout(() => {
          const c = center();
          if (!c) return;
          const h = href === '/' ? 2400 : href.startsWith('/@') ? 3200 : 1500;
          c.innerHTML = '<div id="fakepage" data-page="' + href + '" style="height:' + h + 'px;background:' + (href === '/' ? 'linear-gradient(#27ae60,#2d9d6a)' : 'linear-gradient(#c0392b,#d35400)') + ';color:#fff;font:700 40px sans-serif;padding:40px">PAGE ' + href + '</div>';
        }, 140);
      });
    }, [src.slice(0, src.indexOf('==/UserScript==')), !!opts.off]);
    await p.goto(ORIGIN + '/');
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob, .vp-itdx-btn, .vp-msgs').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2200);
    await p.evaluate(() => {
      history.replaceState({ site: '/@NeuroSFW' }, '', '/@NeuroSFW');
      window.__lt = 0;
      new PerformanceObserver(l => l.getEntries().forEach(e => { window.__lt = Math.max(window.__lt, e.duration); })).observe({ entryTypes: ['longtask'] });
    });
    return { p, errors, ctx };
  }
  const link = (p, href) => p.locator('nav a[href="' + href + '"]').first();
  const probe = p => p.evaluate(() => {
    const out = { stage: !!document.querySelector('.vp-sw-stage'), sw: document.documentElement.classList.contains('vp-sw'), path: location.pathname, sh: document.documentElement.scrollHeight };
    const anims = document.getAnimations().filter(a => a.effect && a.effect.target);
    const ty = el => new DOMMatrix(getComputedStyle(el).transform).m42;
    const g = anims.find(a => a.effect.target.classList.contains('vp-sw-ghost')), f = anims.find(a => { const fp = document.getElementById('fakepage'); return fp && !a.effect.target.classList.contains('vp-sw-ghost') && a.effect.target.contains(fp); });
    out.ghost = g ? ty(g.effect.target) : null;
    out.fresh = f ? ty(f.effect.target) : null;
    return out;
  });
  async function slide(p, href) {
    await link(p, href).click();
    await p.waitForFunction(() => document.getAnimations().some(a => a.effect && a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('vp-sw-ghost')), null, { timeout: 3000 });
    await p.waitForTimeout(230);
    return probe(p);
  }
  const pixel = async (p, x, y) => {
    const buf = await p.screenshot({ clip: { x, y, width: 1, height: 1 } });
    return p.evaluate(async b64 => {
      const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
      const c = document.createElement('canvas'); c.width = c.height = 1; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      return [...g.getImageData(0, 0, 1, 1).data].slice(0, 3);
    }, buf.toString('base64'));
  };
  const green = ([r, g, b]) => g > 120 && r < 90 && g > b;
  const red = ([r, g, b]) => r > 150 && g < 110;
  const layers = async (p, yTop, yBot, topIs, botIs) => {
    const x = await p.evaluate(() => document.querySelector('.vp-sw-stage').getBoundingClientRect().right - 90);
    return topIs(await pixel(p, x, yTop)) && botIs(await pixel(p, x, yBot));
  };
  const rest = async p => { await p.waitForTimeout(900); return probe(p); };

  let A = await fresh();
  check(await A.p.locator('aside.vp-sidebar').count() === 1, 'меню размечено модом');
  const H = 900;
  let mid = await slide(A.p, '/');
  check(mid.stage && mid.sw === false, 'Профиль → Лента: окно анимации есть, центр открыт ' + JSON.stringify(mid));
  check(mid.ghost > 0 && mid.fresh < 0, 'Профиль → Лента: старая страница вниз, новая сверху (' + Math.round(mid.ghost) + ' / ' + Math.round(mid.fresh) + ')');
  check(near(mid.ghost - mid.fresh, H, 2), 'Профиль → Лента: страницы вплотную, расстояние ' + Math.round(mid.ghost - mid.fresh));
  check(await layers(A.p, 120, 880, green, c => !green(c) && !red(c)), 'Профиль → Лента: сверху новая страница, снизу старая');
  let end = await rest(A.p);
  check(!end.stage && !end.sw && end.path === '/', 'после анимации окно убрано, адрес /');
  check(near(mid.sh, end.sh, 2), 'высота документа не прыгала: ' + mid.sh + ' → ' + end.sh);
  check(await A.p.evaluate(() => [...document.querySelectorAll('#root, #root *')].filter(e => e.style.overflowY === 'clip').length) === 0, 'обрезка предков снята');
  check(await A.p.evaluate(() => !!document.getElementById('fakepage') && document.getElementById('fakepage').getBoundingClientRect().height > 100), 'новая страница на месте');

  mid = await slide(A.p, '/@NeuroSFW');
  check(mid.ghost < 0 && mid.fresh > 0, 'Лента → Профиль: старая вверх, новая снизу (' + Math.round(mid.ghost) + ' / ' + Math.round(mid.fresh) + ')');
  check(near(mid.fresh - mid.ghost, H, 2), 'Лента → Профиль: страницы вплотную, расстояние ' + Math.round(mid.fresh - mid.ghost));
  check(await layers(A.p, 25, 880, green, red), 'Лента → Профиль: сверху старая страница, снизу новая');
  end = await rest(A.p);
  check(near(mid.sh, end.sh, 2) && !end.stage, 'Лента → Профиль: высота не прыгала ' + mid.sh + ' → ' + end.sh);

  await link(A.p, '/').click(); await A.p.waitForTimeout(60);
  await link(A.p, '/@NeuroSFW').click();
  end = await rest(A.p);
  check(!end.stage && !end.sw, 'два быстрых нажатия подряд: всё убрано');

  await A.p.evaluate(() => { window.__block = true; });
  await link(A.p, '/').click();
  await A.p.waitForTimeout(1300);
  end = await probe(A.p);
  check(!end.stage && !end.sw, 'ссылка, по которой сайт не перешёл: окно анимации убрано и центр виден');
  await A.p.evaluate(() => { window.__block = false; });

  await A.p.evaluate(() => { const g = document.createElement('div'); g.className = 'vp-gal'; document.body.appendChild(g); });
  await link(A.p, '/').click();
  await A.p.waitForTimeout(120);
  check(!(await probe(A.p)).stage, 'пока открыта галерея, листания нет');
  await A.p.evaluate(() => document.querySelector('.vp-gal').remove());
  check(A.errors.length === 0, 'нет ошибок страницы ' + A.errors.join('|'));
  const lt = await A.p.evaluate(() => window.__lt);
  console.log('самая долгая задача: ' + Math.round(lt) + ' мс');
  await A.ctx.close();

  A = await fresh();
  await A.p.evaluate(() => window.scrollTo(0, 3000));
  await A.p.waitForTimeout(200);
  await link(A.p, '/').click();
  await A.p.waitForFunction(() => document.getAnimations().some(a => a.effect && a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('vp-sw-ghost')), null, { timeout: 3000 });
  await A.p.evaluate(() => window.scrollTo(0, 0));
  await A.p.waitForTimeout(80);
  check(await layers(A.p, 120, 880, green, c => !green(c) && !red(c)), 'прокрутка сбросилась посреди анимации: слои на месте');
  end = await rest(A.p);
  check(!end.stage && !end.sw, 'после сброса прокрутки всё убрано');
  await A.ctx.close();

  A = await fresh({ off: true });
  await link(A.p, '/').click();
  await A.p.waitForTimeout(500);
  check(!(await probe(A.p)).stage && (await probe(A.p)).path === '/', 'настройка выключена: переход без анимации');
  await A.ctx.close();

  A = await fresh({ reduce: true });
  await link(A.p, '/').click();
  await A.p.waitForTimeout(500);
  check(!(await probe(A.p)).stage, 'у системы «меньше движения»: без анимации');
  await A.ctx.close();

  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
