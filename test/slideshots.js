// Листание вкладок кадрами: настоящая вёрстка сайта (CSS сайта + свежие снимки страниц), анимации ставятся на паузу в долях хода,
// начало хода сравнивается с неподвижной страницей «до», конец — с неподвижной страницей «после»; кадры складываются в картинку.
// Запуск:  node test/slideshots.js папка-со-снимками [css-сайта]
//   в папке нужны снимки ПК 2048: itd-snapshot-feed-2048px-*, -NeuroSFW-2048px-*, -notifications-2048px-*, -search-2048px-*, -shop-2048px-*
//   CSS сайта: файл (вторым аргументом) или скачивается со страницы https://xn--d1ah4a.com/
// Результат: test/out/slide/ (кадры и сводная картинка sheet.png)
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
  const ctx = await b.newContext({ viewport: { width: 2048, height: 1010 } });
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
    window.__pages = pages;
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

  const go = async href => {
    await p.evaluate(h => { document.querySelectorAll('.vp-msgs.vp-open').forEach(m => m.close && m.close(true)); history.pushState({ site: h }, '', h); window.__setPage(h); dispatchEvent(new PopStateEvent('popstate')); }, href);
    await p.waitForTimeout(1500);
  };
  const shot = () => p.screenshot();
  const diff = (a, c, band, thr) => p.evaluate(async ([x, y, band, thr]) => {
    const load = s => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/png;base64,' + s; });
    const A = await load(x), B = await load(y);
    const cv = document.createElement('canvas'); cv.width = A.width; cv.height = A.height;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(A, 0, 0); const da = g.getImageData(0, 0, cv.width, cv.height).data;
    g.drawImage(B, 0, 0); const db = g.getImageData(0, 0, cv.width, cv.height).data;
    const BX0 = band ? band[0] : 0, BX1 = band ? band[1] : cv.width;
    let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let i = 0; i < da.length; i += 4) if ((i / 4) % cv.width >= BX0 && (i / 4) % cv.width < BX1 && Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > thr) { n++; const k = i / 4, x = k % cv.width, y = (k / cv.width) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    window.__bb = n ? [x0, y0, x1, y1] : null;
    const cells = {}; for (let i = 0; i < da.length; i += 4) if ((i / 4) % cv.width >= BX0 && (i / 4) % cv.width < BX1 && Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > thr) { const k = i / 4, key = ((k % cv.width) / 50 | 0) * 50 + ',' + (((k / cv.width) | 0) / 50 | 0) * 50; cells[key] = (cells[key] || 0) + 1; }
    window.__hot = Object.entries(cells).sort((u, v) => v[1] - u[1]).slice(0, 4);
    return n / ((BX1 - BX0) * cv.height);
  }, [a.toString('base64'), c.toString('base64'), band || null, thr || 150]);
  const FR = [0, 0.2, 0.4, 0.6, 0.8, 0.985];
  const MS = 560;
  const sheet = [];
  const scene = async (name, from, act) => {
    if (process.env.ONLY && !process.env.ONLY.split(',').some(k => name.startsWith(k))) return;
    if (typeof from === 'string') await go(from);
    else await from();
    const before = await shot();
    await act();
    await p.waitForFunction(() => document.getAnimations().some(a => a.effect && a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('vp-sw-ghost') && a.playState === 'running'), null, { timeout: 8000 });
    const n = await p.evaluate(() => {
      window.__pa = document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.nodeType === 1 && (a.effect.target.classList.contains('vp-sw-ghost') || a.effect.target.tagName === 'ASIDE' || a.effect.target.classList.contains('vp-rail') || a.effect.target.classList.contains('vp-msgs') || a.effect.target.classList.contains('vp-gal')) && a.playState === 'running' && a.effect.getTiming().iterations === 1);
      window.__pa.forEach(a => a.pause());
      return window.__pa.length;
    });
    const blackFrames = await p.evaluate(() => [...document.querySelectorAll('.vp-sw-stage .vp-page-frame')].map(e => getComputedStyle(e).backgroundColor).filter(c => c !== 'rgba(0, 0, 0, 0)'));
    check(!blackFrames.length, `${name}: в копиях рамки магазина нет чёрной заливки ${JSON.stringify(blackFrames)}`);
    const frames = [], pos = [];
    const where = () => p.evaluate(() => { const s = document.querySelector('aside.vp-sidebar'), r = document.querySelector('.vp-rail.vp-on'); return [Math.round(s.getBoundingClientRect().left), r ? Math.round(r.getBoundingClientRect().left) : null]; });
    const pre = await (async () => { const s = await where(); return s; })();
    for (const f of FR) {
      await p.evaluate(([t]) => window.__pa.forEach(a => { a.currentTime = t; }), [Math.min(f * MS, MS - 4)]);
      await p.waitForTimeout(60);
      frames.push(await shot());
      pos.push(await where());
    }
    console.log(`—    ${name}: панели (меню/колонка) по кадрам ${JSON.stringify(pos)}`);
    await p.evaluate(() => window.__pa.forEach(a => { a.currentTime = 560; a.play(); }));
    await p.waitForFunction(() => !document.querySelector('.vp-sw-stage'), null, { timeout: 5000 });
    await p.waitForTimeout(1200);
    const after = await shot();
    const bands = [[0, 690], [690, 1360], [1360, 2048]];
    const bd0 = [], bd1 = [];
    for (const bnd of bands) { bd0.push((await diff(before, frames[0], bnd) * 100).toFixed(2)); bd1.push((await diff(after, frames[frames.length - 1], bnd) * 100).toFixed(2)); }
    console.log(`—    ${name}: слева/центр/справа, начало ${bd0.join(' / ')}%, конец ${bd1.join(' / ')}%`);
    const hotd = async (a, c) => { await diff(a, c, [690, 1360]); return p.evaluate(() => window.__hot.map(([k, v]) => k + ':' + v)); };
    console.log('—    горячие клетки начала ' + JSON.stringify(await hotd(before, frames[0])) + ', конца ' + JSON.stringify(await hotd(after, frames[frames.length - 1])));
    const d0 = await diff(before, frames[0], [690, 2048]); const bb0 = await p.evaluate(() => window.__bb); const d1 = await diff(after, frames[frames.length - 1]); const bb1 = await p.evaluate(() => window.__bb);
    console.log(`—    ${name}: область различий в начале ${JSON.stringify(bb0)}, в конце ${JSON.stringify(bb1)}`);
    const dm = await diff(before, frames[3], [690, 2048], 40);
    fs.writeFileSync(path.join(OUT, name + '-0-before.png'), before);
    frames.forEach((fr, i) => fs.writeFileSync(path.join(OUT, `${name}-${i + 1}.png`), fr));
    fs.writeFileSync(path.join(OUT, name + '-9-after.png'), after);
    sheet.push({ name, imgs: [before, ...frames, after] });
    check(n >= 2, `${name}: анимаций на паузе ${n}`);
    check(d0 < 0.015, `${name}: начало хода совпадает со страницей «до» (различие ${(d0 * 100).toFixed(2)}%)`);
    check(d1 < 0.03, `${name}: конец хода совпадает со страницей «после» (различие ${(d1 * 100).toFixed(2)}%)`);
    check(dm > 0.05, `${name}: в середине хода картинка действительно другая (${(dm * 100).toFixed(1)}%)`);
  };
  const link = h => 'nav a[href="' + h + '"]';
  const click = sel => () => p.dispatchEvent(sel, 'click');
  const msgsLink = 'nav a[href="#"]', galLink = 'nav a.vp-gal-nav';
  const closeOv = async () => { await p.evaluate(() => { document.querySelectorAll('.vp-msgs.vp-open').forEach(m => m.close && m.close(true)); }); await p.waitForTimeout(600); };

  await scene('01-лента-профиль', '/', click(link('/@NeuroSFW')));
  await scene('02-профиль-уведомления', '/@NeuroSFW', click(link('/notifications')));
  await scene('03-уведомления-лента', '/notifications', click(link('/')));
  await scene('04-лента-магазин', '/', click(link('/shop')));
  await scene('05-магазин-лента', '/shop', click(link('/')));
  await scene('06-лента-сообщения', '/', click(msgsLink));
  await scene('07-сообщения-лента', async () => { await go('/'); await p.dispatchEvent(msgsLink, 'click'); await p.waitForTimeout(1800); }, click(link('/')));
  await scene('08-лента-галерея', '/', click(galLink));
  await scene('09-галерея-профиль', async () => { await go('/'); await p.dispatchEvent(galLink, 'click'); await p.waitForTimeout(2500); }, click(link('/@NeuroSFW')));
  await scene('10-галерея-сообщения', async () => { await go('/'); await p.dispatchEvent(galLink, 'click'); await p.waitForTimeout(2500); }, click(msgsLink));

  const png = await p.evaluate(async items => {
    const W = 410, H = 202, L = 7;
    const cv = document.createElement('canvas'); cv.width = W * L; cv.height = (H + 22) * items.length;
    const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = '#fff'; g.font = '16px sans-serif';
    for (let r = 0; r < items.length; r++) {
      g.fillText(items[r].name, 6, r * (H + 22) + 16);
      for (let i = 0; i < items[r].imgs.length; i++) {
        const im = await new Promise(res => { const x = new Image(); x.onload = () => res(x); x.src = 'data:image/png;base64,' + items[r].imgs[i]; });
        g.drawImage(im, i * W, r * (H + 22) + 22, W - 4, H);
      }
    }
    return cv.toDataURL('image/png').split(',')[1];
  }, sheet.map(s => ({ name: s.name, imgs: s.imgs.map(x => x.toString('base64')) })));
  fs.writeFileSync(path.join(OUT, 'sheet.png'), Buffer.from(png, 'base64'));
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
