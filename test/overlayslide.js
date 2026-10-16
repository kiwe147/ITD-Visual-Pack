// Листание из «Сообщений» и «Галереи» и в них: старое уезжает, новое выезжает, боковые панели плавно сдвигаются.
// Сайт имитируется как в tabslide.js: ссылка меню → pushState и через 140 мс центр заменяется другой страницей.
// Запуск:  node test/overlayslide.js снимок-ленты.html
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
  const ctx = await b.newContext({ viewport: { width: 2048, height: 900 } });
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
  await p.addInitScript(m => {
    const s = { tabSlide: true, introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    const center = () => { const a = document.querySelector('aside.vp-sidebar'); return a && [...a.parentElement.children].find(c => c.tagName !== 'ASIDE' && c.getBoundingClientRect().width > 300); };
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
        c.innerHTML = '<div id="fakepage" data-page="' + href + '" style="height:1500px;background:linear-gradient(#27ae60,#2d9d6a);color:#fff;font:700 40px sans-serif;padding:40px">PAGE ' + href + '</div>';
      }, 140);
    });
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => {
    document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob, .vp-itdx-btn, .vp-msgs, .vp-gal, .vp-gal-nav').forEach(e => e.remove());
    document.querySelectorAll('style').forEach(st => { if (/vp-msgs|vp-gal/.test(st.textContent)) st.remove(); });
  });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2200);
  await p.evaluate(() => {
    history.replaceState({ site: '/@NeuroSFW' }, '', '/@NeuroSFW');
    const st = document.createElement('style');
    st.textContent = 'aside.vp-sidebar { position: fixed !important; top: 60px !important; width: 240px !important; height: 500px !important } html:not(.vp-gal-open) aside.vp-sidebar { left: 300px !important } html.vp-gal-open aside.vp-sidebar { left: 40px !important }';
    document.head.appendChild(st);
  });

  const probe = () => p.evaluate(() => {
    const out = { stage: !!document.querySelector('.vp-sw-stage'), sw: document.documentElement.classList.contains('vp-sw'), pin: document.documentElement.classList.contains('vp-sw-pin'), path: location.pathname };
    const an = document.getAnimations().filter(a => a.effect && a.effect.target);
    const ty = el => new DOMMatrix(getComputedStyle(el).transform).m42, tx = el => new DOMMatrix(getComputedStyle(el).transform).m41;
    const g = an.find(a => a.effect.target.classList.contains('vp-sw-old'));
    const f = an.find(a => a.effect.target.classList.contains('vp-sw-new') || a.effect.target.classList.contains('vp-msgs') || a.effect.target.classList.contains('vp-gal'));
    out.ghost = g ? ty(g.effect.target) : null;
    out.inc = f ? ty(f.effect.target) : null;
    out.incCls = f ? f.effect.target.className.split(' ').slice(0, 2).join('.') : null;
    out.moves = an.filter(a => a.effect.target.tagName === 'ASIDE' || a.effect.target.classList.contains('vp-rail')).map(a => (a.effect.target.tagName === 'ASIDE' ? 'side' : 'rail') + ':' + Math.round(tx(a.effect.target)));
    out.ghostHas = document.querySelector('.vp-sw-old .vp-msgs') ? 'msgs' : document.querySelector('.vp-sw-old .vp-gal, .vp-sw-old.vp-gal') ? 'gal' : document.querySelector('.vp-sw-old #fakepage') ? 'page' : '';
    return out;
  });
  const running = () => p.waitForFunction(() => document.getAnimations().some(a => a.effect && a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('vp-sw-ghost')), null, { timeout: 4000 });
  const calm = async () => { await p.waitForFunction(() => !document.querySelector('.vp-sw-stage'), null, { timeout: 4000 }); await p.waitForTimeout(150); return probe(); };
  const mid = async (act) => { await act(); await running(); await p.waitForTimeout(230); return probe(); };
  const msgsLink = 'nav a[href="#"]', galLink = 'nav a.vp-gal-nav';

  check(await p.locator(galLink).count() === 1 && await p.locator(msgsLink).count() === 1, 'в меню есть «Галерея» и «Сообщения»');

  let m = await mid(() => p.dispatchEvent(msgsLink, 'click'));
  check(m.stage && m.sw && !m.pin, 'Профиль → Сообщения: окно анимации есть ' + JSON.stringify(m));
  check(m.ghost > 0 && m.inc < 0 && m.incCls === 'vp-msgs.vp-card', 'Профиль → Сообщения: страница вниз, окно сообщений сверху (' + Math.round(m.ghost) + ' / ' + Math.round(m.inc) + ')');
  check(await p.evaluate(() => document.querySelector('.vp-sw-old').firstElementChild.getBoundingClientRect().height > 300), 'Профиль → Сообщения: уходит снимок страницы');
  let e = await calm();
  check(await p.evaluate(() => document.querySelector('.vp-msgs').classList.contains('vp-open') && getComputedStyle(document.querySelector('.vp-msgs')).opacity === '1' && document.querySelector('.vp-msgs').style.opacity === ''), 'Сообщения открыты, прозрачность вернулась');

  m = await mid(() => p.dispatchEvent('nav a[href="/"]', 'click'));
  check(m.stage && m.pin !== undefined, 'Сообщения → Лента: окно анимации есть');
  check(m.ghost > 0 && m.inc < 0 && /vp-sw-new/.test(m.incCls), 'Сообщения → Лента: сообщения вниз, новая страница сверху (' + Math.round(m.ghost) + ' / ' + Math.round(m.inc) + ')');
  check(m.ghostHas === 'msgs', 'Сообщения → Лента: уходит снимок окна сообщений');
  e = await calm();
  check(e.path === '/' && !e.sw && await p.evaluate(() => !document.querySelector('.vp-msgs.vp-open')), 'Сообщения → Лента: адрес /, сообщения закрыты');

  m = await mid(() => p.click(galLink));
  check(m.stage && m.ghost < 0 && m.inc > 0 && /^vp-gal/.test(m.incCls), 'Лента → Галерея: страница вверх, галерея снизу (' + Math.round(m.ghost) + ' / ' + Math.round(m.inc) + ') ' + m.incCls);
  check(m.moves.some(x => /^side:(?!-)/.test(x) && +x.slice(5) > 0 && +x.slice(5) < 260), 'Лента → Галерея: левое меню плавно едет влево, сейчас ' + m.moves.join(' '));
  e = await calm();
  check(await p.evaluate(() => !!document.querySelector('.vp-gal') && document.querySelector('.vp-gal').style.opacity === ''), 'Галерея открыта, прозрачность вернулась');
  check(e.moves.length === 0, 'панели после движения без смещения');

  m = await mid(() => p.dispatchEvent(msgsLink, 'click'));
  check(m.stage && m.ghost < 0 && m.inc > 0 && m.incCls === 'vp-msgs.vp-card', 'Галерея → Сообщения: галерея вверх, сообщения снизу (' + Math.round(m.ghost) + ' / ' + Math.round(m.inc) + ') ' + m.incCls);
  check(m.ghostHas === 'gal', 'Галерея → Сообщения: уходит снимок галереи');
  e = await calm();
  check(await p.evaluate(() => !document.querySelector('.vp-gal') && !!document.querySelector('.vp-msgs.vp-open')), 'Сообщения открыты, галерея закрыта');

  m = await mid(() => p.dispatchEvent(galLink, 'click'));
  check(m.stage && m.ghost > 0 && m.inc < 0, 'Сообщения → Галерея: сообщения вниз, галерея сверху (' + Math.round(m.ghost) + ' / ' + Math.round(m.inc) + ')');
  e = await calm();

  m = await mid(() => p.dispatchEvent('nav a[href="/@NeuroSFW"]', 'click'));
  check(m.stage && m.ghost < 0 && m.inc > 0 && /vp-sw-new/.test(m.incCls) && m.ghostHas === 'gal', 'Галерея → Профиль: галерея вверх, страница снизу (' + Math.round(m.ghost) + ' / ' + Math.round(m.inc) + ')');
  check(m.moves.some(x => /^side:-/.test(x) && +x.slice(5) > -260), 'Галерея → Профиль: левое меню плавно едет вправо, сейчас ' + m.moves.join(' '));
  e = await calm();
  check(e.path === '/@NeuroSFW' && !e.sw && !e.pin && await p.evaluate(() => !document.querySelector('.vp-gal')), 'Галерея → Профиль: адрес профиля, всё убрано');

  m = await mid(() => p.dispatchEvent(galLink, 'click'));
  e = await calm();
  await p.dispatchEvent('nav a[href="/@NeuroSFW"]', 'click');
  await p.waitForTimeout(200);
  check(await p.evaluate(() => !document.querySelector('.vp-gal:not(.vp-sw-stage *)')), 'нажатие на текущий пункт при открытой галерее закрывает её');
  e = await calm();
  check(!e.sw && !e.pin, 'после закрытия по текущему пункту всё убрано');

  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
