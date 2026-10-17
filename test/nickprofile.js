// Нажатие на ник в шапке чата: окно сообщений закрывается, открывается профиль, боковые панели встают на место (3.5.11).
// Запуск:  node test/nickprofile.js папка-со-снимками css-сайта
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const dir = process.argv[2];
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const OUT = path.join(__dirname, 'out', 'slide');
fs.mkdirSync(OUT, { recursive: true });
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const pick = key => {
  const f = fs.readdirSync(dir).filter(n => n.startsWith('itd-snapshot-' + key + '-2048px-')).sort().pop();
  if (!f) throw new Error('нет снимка ' + key);
  return fs.readFileSync(path.join(dir, f), 'utf8');
};
const get = u => new Promise((res, rej) => https.get(u, { headers: { 'user-agent': 'Mozilla/5.0' } }, r => { let s = ''; r.on('data', d => s += d); r.on('end', () => res(s)); }).on('error', rej));
const PAGES = { '/': 'feed', '/@NeuroSFW': 'NeuroSFW', '/notifications': 'notifications', '/search': 'search', '/shop': 'shop' };
const COL = ['#c0392b', '#27ae60', '#2980b9'];
const gposts = Array.from({ length: 24 }, (_, i) => ({ id: 'g' + i, author: { username: 'a' + (i % 5) },
  attachments: Array.from({ length: 1 + (i % 3) }, (_, k) => ({ type: 'image', url: `${ORIGIN.replace('//', '//cdn.')}/images/vpgal-${i}-${(i + k) % 3}.png`, width: 600, height: 500 + ((i * 97) % 5) * 120 })) }));
(async () => {
  let css = process.argv[3] ? fs.readFileSync(process.argv[3], 'utf8') : null;
  if (!css) {
    const idx = await get(ORIGIN + '/');
    const m = idx.match(/href="(\/assets\/index-[^"]+\.css)"/);
    css = await get(ORIGIN + m[1]);
  }
  const base = pick('feed');
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ viewport: { width: +process.env.W || 2048, height: 1010 } });
  const route = async (page, html) => page.route('**/*', async r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: html.replace('</head>', '<link rel="stylesheet" href="/assets/site.css"></head>') });
    if (u.pathname === '/assets/site.css') return r.fulfill({ contentType: 'text/css', body: css });
    if (u.pathname.startsWith('/public/shop/')) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: '<html><body style="margin:0;background:#111;color:#fff;font:600 28px sans-serif"><div style="width:1100px;margin:0 auto;padding:40px"><h1>Магазин</h1>' + Array.from({ length: 12 }, (_, i) => `<div style="display:inline-block;width:340px;height:260px;margin:10px;border-radius:24px;background:hsl(${i * 30},45%,32%)"></div>`).join('') + '</div></body></html>' });
    const g = u.pathname.match(/vpgal-\d+-(\d)/);
    if (g) return r.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700"><rect width="600" height="700" fill="${COL[+g[1]]}"/></svg>` });
    if (t === 'font' || t === 'script' && u.origin === ORIGIN) return r.abort();
    if (t === 'image') { let h = 0; for (const ch of u.href) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return r.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="hsl(${h % 360},35%,${25 + h % 25}%)"/></svg>` }); }
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.pathname === '/api/posts') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: gposts, pagination: { nextCursor: null } } }) });
    if (t === 'stylesheet') return r.abort();
    return r.fulfill({ status: 404, body: '' });
  });

  const centers = {};
  for (const [href, key] of Object.entries(PAGES)) {
    const p = await ctx.newPage();
    await route(p, pick(key));
    await p.goto(ORIGIN + '/');
    centers[href] = await p.evaluate(() => {
      const a = document.querySelector('aside.vp-sidebar');
      const c = [...a.parentElement.children].find(x => x.tagName !== 'ASIDE' && x.getBoundingClientRect().width > 300);
      c.querySelectorAll('[class*="vp-"]').forEach(e => { if (/^vp-(gal|msgs|sw)/.test([...e.classList].find(x => x.startsWith('vp-')) || '')) e.remove(); });
      return c.innerHTML;
    });
    await p.close();
  }

  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await route(p, base);
  await p.addInitScript(([m, pages]) => {
    const s = { tabSlide: true, introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    window.__pages = pages; localStorage.setItem('itd_verified_users', JSON.stringify({ NeuroSFW: { code: 'x', hasMod: true, id: 'u1', state: 'approved' }, bob: { code: 'x', hasMod: true, id: 'u2', state: 'approved' } }));
    const center = () => { const a = document.querySelector('aside.vp-sidebar'); return a && [...a.parentElement.children].find(c => c.tagName !== 'ASIDE' && c.getBoundingClientRect().width > 300); };
    window.__setPage = href => { const c = center(); if (c) c.innerHTML = pages[href] || pages['/']; window.scrollTo(0, 0); };
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href^="/"]');
      if (!a || e.defaultPrevented) return;
      e.preventDefault();
      const href = a.getAttribute('href');
      if (href === location.pathname) return;
      history.pushState({ site: href }, '', href);
      setTimeout(() => window.__setPage(href), 150);
    });
  }, [src.slice(0, src.indexOf('==/UserScript==')), centers]);
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => {
    document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob, .vp-itdx-btn, .vp-msgs, .vp-gal, .vp-gal-nav, .vp-sw-stage').forEach(e => e.remove());
    document.querySelectorAll('style').forEach(st => {
      const rules = st.sheet && st.sheet.cssRules;
      if (!rules) return;
      for (let i = rules.length - 1; i >= 0; i--) if (/vp-|--vp|vpPal|vpMsgs|vpGal/.test(rules[i].cssText)) st.sheet.deleteRule(i);
    });
    document.documentElement.className = [...document.documentElement.classList].filter(c => !c.startsWith('vp-')).join(' ');
    document.documentElement.removeAttribute('style');
  });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);

  const where = () => p.evaluate(() => { const s = document.querySelector('aside.vp-sidebar'), r = document.querySelector('.vp-rail.vp-on'), h = document.documentElement; return { side: Math.round(s.getBoundingClientRect().left), rail: r ? Math.round(r.getBoundingClientRect().left) : null, cls: [...h.classList].filter(c => /^vp-(msgs|sw|gal)/.test(c)).join(' '), path: location.pathname, stage: !!document.querySelector('.vp-sw-stage'), pill: [...document.querySelectorAll('nav a')].filter(a => /vp-(site-)?cur|vp-active|active/.test(a.className)).map(a => a.getAttribute('href')).join(','), msgs: document.querySelector('.vp-msgs') ? document.querySelector('.vp-msgs').className : '' }; });
  const go = async href => {
    await p.evaluate(h => { document.querySelectorAll('.vp-msgs.vp-open').forEach(m => m.close && m.close(true)); history.pushState({ site: h }, '', h); window.__setPage(h); dispatchEvent(new PopStateEvent('popstate')); }, href);
    await p.waitForTimeout(1500);
  };
  await go('/@bob');
  const direct = await where();
  await go('/');
  const feed = await where();
  console.log('—    лента: ' + JSON.stringify(feed));
  await p.dispatchEvent('nav a[href="#"]', 'click');
  await p.waitForTimeout(2000);
  const list = await where();
  console.log('—    список сообщений: ' + JSON.stringify(list));
  await p.evaluate(() => document.querySelector('.vp-msgs-row[data-id="u:bob"]').click());
  await p.waitForTimeout(1200);
  const chat = await where();
  console.log('—    чат: ' + JSON.stringify(chat));
  await p.evaluate(() => document.querySelector('.vp-msgs-who').click());
  const t0 = Date.now(), tl = [];
  while (Date.now() - t0 < 1800) { tl.push([Date.now() - t0, await where()]); await p.waitForTimeout(90); }
  console.log('—    после нажатия на ник:');
  tl.filter((x, i) => i % 3 === 0).forEach(([t, w]) => console.log('      ' + t + ' мс ' + JSON.stringify(w)));
  const end = tl[tl.length - 1][1];
  console.log('—    профиль напрямую: ' + JSON.stringify(direct));
  check(end.path === '/@bob', 'открыт профиль ' + end.path);
  check(end.side === direct.side && end.rail === direct.rail, `панели как у профиля напрямую (меню ${end.side}/${direct.side}, колонка ${end.rail}/${direct.rail})`);
  check(!end.stage && !/msgs-open/.test(end.cls) && !/vp-open/.test(end.msgs), 'окно и анимация убраны: ' + end.cls + ' | ' + end.msgs);
  check(!errors.length, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
