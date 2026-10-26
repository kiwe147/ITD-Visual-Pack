// Листание вкладок на телефоне: переход по пункту нижнего меню — страницы смещаются влево или вправо (по порядку пунктов), а не вверх-вниз как на ПК.
// Сайт имитируется как в tabslide.js: ссылка меню → pushState и через 140 мс центр заменяется другой страницей.
// Запуск:  node test/tabslidephone.js снимок-ленты-телефон.html   (SHOT=папка — сохранить кадры середины перехода)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const COLORS = { '/': '#27ae60', '/shop': '#2980b9', '/event': '#c0392b', '/notifications': '#d35400', '/@NeuroSFW': '#8e44ad' };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  async function fresh(off) {
    const ctx = await b.newContext({ viewport: { width: 392, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
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
      if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: [], pagination: { nextCursor: null } } }) });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m, off, colors]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, tabSlide: !off };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
      const center = () => { const nav = document.querySelector('nav.vp-nav'); const root = nav && nav.parentElement.parentElement; return root && [...root.children].find(c => !c.contains(nav) && c.getBoundingClientRect().width > 300); };
      document.addEventListener('click', e => {
        const a = e.target.closest && e.target.closest('a[href^="/"]');
        if (!a || e.defaultPrevented) return;
        e.preventDefault();
        const href = a.getAttribute('href');
        if (href === location.pathname) return;
        history.pushState({ site: href }, '', href);
        setTimeout(() => {
          const c = center();
          if (!c) return;
          c.innerHTML = '<div id="fakepage" data-page="' + href + '" style="height:1800px;background:' + colors[href] + ';color:#fff;font:700 34px sans-serif;padding:40px">PAGE ' + href + '</div>';
          window.scrollTo(0, 0);
        }, 140);
      });
    }, [src.slice(0, src.indexOf('==/UserScript==')), !!off, COLORS]);
    await p.goto(ORIGIN + '/');
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-itdx-btn, .vp-msgs').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2200);
    await p.evaluate(() => {
      const nav = document.querySelector('nav.vp-nav'), root = nav.parentElement.parentElement;
      const c = [...root.children].find(x => !x.contains(nav));
      c.innerHTML = '<div id="fakepage" data-page="/" style="height:1800px;background:#27ae60;color:#fff;font:700 34px sans-serif;padding:40px">PAGE /</div>';
      window.scrollTo(0, 300);
    });
    await p.waitForTimeout(300);
    return { p, ctx, errors };
  }
  const probe = p => p.evaluate(() => {
    const an = document.getAnimations().filter(a => a.effect && a.effect.target);
    const m = el => { const t = new DOMMatrix(getComputedStyle(el).transform); return [t.m41, t.m42]; };
    const g = an.find(a => a.effect.target.classList.contains('vp-sw-old')), f = an.find(a => a.effect.target.classList.contains('vp-sw-new'));
    const live = [...document.querySelectorAll('[data-vp-sw]')];
    return { stage: !!document.querySelector('.vp-sw-stage'), sw: document.documentElement.classList.contains('vp-sw'), path: location.pathname,
      ghost: g ? m(g.effect.target) : null, inc: f ? m(f.effect.target) : null, live: live.length, liveHidden: live.length ? getComputedStyle(live[0]).visibility : null,
      ghostText: (document.querySelector('.vp-sw-old') || {}).textContent ? document.querySelector('.vp-sw-old').textContent.trim().slice(0, 12) : '' };
  });
  const running = p => p.waitForFunction(() => document.getAnimations().some(a => a.effect && a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('vp-sw-ghost')), null, { timeout: 4000 });
  const calm = async p => { await p.waitForFunction(() => !document.querySelector('.vp-sw-stage'), null, { timeout: 4000 }); await p.waitForTimeout(150); return probe(p); };
  const shot = async (p, name) => { if (process.env.SHOT) await p.screenshot({ path: path.join(process.env.SHOT, name + '.png') }); };

  const { p, ctx, errors } = await fresh(false);
  check(await p.locator('nav a[href="/event"]').count() === 1, 'в нижнем меню есть пункты');
  await p.evaluate(() => history.replaceState({ site: '/' }, '', '/'));

  await p.dispatchEvent('nav a[href="/event"]', 'click');
  await running(p); await p.waitForTimeout(170);
  let m = await probe(p);
  await shot(p, 'to-event');
  check(m.stage && m.sw, 'Лента → Ивент: окно анимации есть ' + JSON.stringify(m));
  check(m.ghost && m.ghost[0] < -10 && Math.abs(m.ghost[1]) < 1, 'Лента → Ивент: старая страница уезжает влево (' + (m.ghost && Math.round(m.ghost[0])) + ', ' + (m.ghost && Math.round(m.ghost[1])) + ')');
  check(m.inc && m.inc[0] > 10 && Math.abs(m.inc[1]) < 1, 'Лента → Ивент: новая страница приезжает справа (' + (m.inc && Math.round(m.inc[0])) + ')');
  check(m.live >= 1 && m.liveHidden === 'hidden', 'Лента → Ивент: настоящая страница под анимацией скрыта');
  let e = await calm(p);
  check(e.path === '/event' && !e.sw && e.live === 0, 'Лента → Ивент: пришли на /event, всё убрано ' + JSON.stringify(e));
  check(await p.evaluate(() => document.querySelector('#fakepage').dataset.page === '/event' && getComputedStyle(document.querySelector('#fakepage')).visibility === 'visible'), 'Лента → Ивент: настоящая страница снова видна');

  await p.dispatchEvent('nav a[href="/shop"]', 'click');
  await running(p); await p.waitForTimeout(170);
  m = await probe(p);
  await shot(p, 'to-shop');
  check(m.ghost && m.ghost[0] > 10 && m.inc && m.inc[0] < -10, 'Ивент → Магаз: старая вправо, новая слева (' + (m.ghost && Math.round(m.ghost[0])) + ' / ' + (m.inc && Math.round(m.inc[0])) + ')');
  await p.evaluate(() => dispatchEvent(new Event('resize')));
  await p.waitForTimeout(60);
  check((await probe(p)).stage, 'пересчёт размера окна без смены ширины (панель адреса) переход не обрывает');
  e = await calm(p);
  check(e.path === '/shop' && !e.sw && e.live === 0, 'Ивент → Магаз: пришли на /shop, всё убрано');

  await p.dispatchEvent('nav a[href="/@NeuroSFW"]', 'click');
  await running(p); await p.waitForTimeout(170);
  m = await probe(p);
  check(m.ghost && m.ghost[0] < -10 && m.inc && m.inc[0] > 10, 'Магаз → Акк: старая влево, новая справа');
  await calm(p);

  const dur = await p.evaluate(() => 0);
  await p.dispatchEvent('nav a[href="/notifications"]', 'click');
  const t0 = Date.now();
  await running(p);
  await p.waitForFunction(() => !document.querySelector('.vp-sw-stage'), null, { timeout: 4000 });
  const took = Date.now() - t0;
  check(took < 1200, 'весь переход короче 1,2 с (' + took + ' мс)');

  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await ctx.close();

  const off = await fresh(true);
  await off.p.evaluate(() => history.replaceState({ site: '/' }, '', '/'));
  await off.p.dispatchEvent('nav a[href="/event"]', 'click');
  await off.p.waitForTimeout(500);
  check(!(await probe(off.p)).stage, 'настройка «Листание вкладок» выключена — анимации нет');
  await off.ctx.close();

  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
