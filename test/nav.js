// Переходы и кнопка «назад» с окнами мода (галерея, «Сообщения»): цепочки, как их нажимает человек.
// Роутер сайта заменён маленьким своим: ссылка по меню → pushState (как React Router), нажатие на пункт
// текущей страницы — «обновить» (сайт так и делает). Каждая цепочка — с чистой загрузки.
// Запуск:  node test/nav.js снимок-ленты.html [desktop|phone]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [snapPath, mode = 'desktop'] = process.argv.slice(2);
const snap = fs.readFileSync(snapPath, 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const posts = { data: { posts: Array.from({ length: 12 }, (_, i) => ({ id: 'p' + i, author: { username: 'u' + i }, attachments: [{ type: 'image', url: `https://cdn.xn--d1ah4a.com/images/vptest-${400}-${300 + i * 20}-${i * 30}.svg`, width: 400, height: 300 + i * 20 }] })), pagination: { nextCursor: null } } };

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  async function fresh() {
    const p = await b.newPage(mode === 'desktop' ? { viewport: { width: 1400, height: 900 } } : { viewport: { width: 392, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.route('**/*', r => {
      const u = new URL(r.request().url()), t = r.request().resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (u.pathname.includes('/images/vptest-')) {
        const [w, h, hue] = u.pathname.split('vptest-').pop().replace('.svg', '').split('-').map(Number);
        return r.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="hsl(${hue},60%,45%)"/></svg>` });
      }
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1","displayName":"#NeuroSFW | ЧБ"}' });
      if (u.pathname === '/api/posts') return r.fulfill({ contentType: 'application/json', body: JSON.stringify(posts) });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(m => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
      // роутер «сайта»: ссылки меню — pushState; пункт текущей страницы — «обновление» (считаем)
      window.__refresh = 0;
      document.addEventListener('click', e => {
        const a = e.target.closest && e.target.closest('a[href^="/"]');
        if (!a || e.defaultPrevented) return;
        e.preventDefault();
        const href = a.getAttribute('href');
        if (href === location.pathname) { window.__refresh++; return; }
        history.pushState({ site: href }, '', href);
      });
    }, src.slice(0, src.indexOf('==/UserScript==')));
    // начальная история: /@NeuroSFW → / (чтобы «назад» с ленты было куда)
    await p.goto(ORIGIN + '/');
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob, .vp-itdx-btn, .vp-msgs').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    await p.evaluate(() => { history.replaceState({ site: '/@NeuroSFW' }, '', '/@NeuroSFW'); history.pushState({ site: '/' }, '', '/'); });
    return { p, errors };
  }
  const st = p => p.evaluate(() => ({ path: location.pathname, gal: !!document.querySelector('.vp-gal'), msgs: !!document.querySelector('.vp-msgs.vp-open'), len: history.length, refresh: window.__refresh }));
  const galBtn = mode === 'desktop' ? '.vp-gal-nav' : '.vp-gal-btn';
  const openGal = async p => { await p.$eval(galBtn, b => b.click()); await p.waitForTimeout(500); };
  const nav = async (p, href) => { await p.$eval(`nav a[href="${href}"]`, a => a.click()); await p.waitForTimeout(500); };
  const openMsgs = async p => { await p.$eval('nav a[href="#"]', a => a.click()); await p.waitForTimeout(500); };
  const back = async p => { await p.goBack(); await p.waitForTimeout(500); };
  const show = s => JSON.stringify({ path: s.path, gal: s.gal, msgs: s.msgs, обновлений: s.refresh });
  const run = async (name, fn) => {
    const { p, errors } = await fresh();
    try { await fn(p); } catch (e) { check(false, `${name}: ${e.message.split('\n')[0]}`); }
    if (errors.length) check(false, `${name}: ошибки ${errors.join(' | ')}`);
    await p.close();
  };

  await run('1', async p => {
    await openGal(p); await back(p);
    const s = await st(p);
    check(s.path === '/' && !s.gal, `галерея → «назад»: закрыта, на ленте ${show(s)}`);
    await back(p);
    const s2 = await st(p);
    check(s2.path === '/@NeuroSFW', `…ещё «назад» — на страницу до ленты (${s2.path})`);
  });
  await run('2', async p => {
    await openGal(p); await nav(p, '/notifications');
    const s = await st(p);
    check(s.path === '/notifications' && !s.gal, `галерея → «Уведомления»: перешли, галерея закрыта ${show(s)}`);
    await back(p);
    const s2 = await st(p);
    check(s2.path === '/' && s2.gal, `…«назад» — обратно в галерею ${show(s2)}`);
    await back(p);
    const s3 = await st(p);
    check(s3.path === '/' && !s3.gal, `…ещё «назад» — лента без галереи ${show(s3)}`);
  });
  await run('3', async p => {
    await openGal(p); await nav(p, '/');
    const s = await st(p);
    check(s.path === '/' && !s.gal && s.refresh === 0, `галерея → «Лента»: закрыта, лента не обновлялась ${show(s)}`);
    await back(p);
    const s2 = await st(p);
    check(s2.path === '/@NeuroSFW', `…«назад» — на страницу до ленты, а не снова галерея (${s2.path}, галерея ${s2.gal})`);
  });
  await run('4', async p => {
    await openGal(p);
    await p.$eval('.vp-gal-tile', t => t.click()); await p.waitForTimeout(500);
    const s = await st(p);
    check(/\/post\/p\d+$/.test(s.path) && !s.gal, `галерея → картинка: открыт пост ${show(s)}`);
    await back(p);
    const s2 = await st(p);
    check(s2.path === '/' && s2.gal, `…«назад» из поста — обратно в галерею ${show(s2)}`);
  });
  await run('5', async p => {
    await openMsgs(p); await openGal(p);
    const s = await st(p);
    check(s.gal && !s.msgs, `личка → галерея: галерея, личка закрыта ${show(s)}`);
    await back(p);
    const s2 = await st(p);
    check(s2.path === '/' && !s2.gal && !s2.msgs, `…«назад» — лента, ничего не открыто ${show(s2)}`);
    await back(p);
    const s3 = await st(p);
    check(s3.path === '/@NeuroSFW', `…ещё «назад» — страница до ленты (${s3.path})`);
  });
  await run('6', async p => {
    await openGal(p); await openMsgs(p);
    const s = await st(p);
    check(s.msgs && !s.gal, `галерея → личка: личка, галерея закрыта ${show(s)}`);
    await back(p);
    const s2 = await st(p);
    check(s2.path === '/' && !s2.gal && !s2.msgs, `…«назад» — лента, ничего не открыто ${show(s2)}`);
  });
  await run('7', async p => {
    await openMsgs(p); await nav(p, '/notifications');
    const s = await st(p);
    check(s.path === '/notifications' && !s.msgs, `личка → «Уведомления»: перешли, личка закрыта ${show(s)}`);
    await back(p);
    const s2 = await st(p);
    check(s2.path === '/', `…«назад» — лента (${show(s2)})`);
  });
  await run('8', async p => {
    await openMsgs(p); await nav(p, '/');
    const s = await st(p);
    check(s.path === '/' && !s.msgs && s.refresh === 0, `личка → «Лента»: закрыта, лента не обновлялась ${show(s)}`);
    await back(p);
    const s2 = await st(p);
    check(s2.path === '/@NeuroSFW', `…«назад» — страница до ленты (${s2.path}, личка ${s2.msgs})`);
  });
  await run('9', async p => {
    await openGal(p); await openGal(p); await back(p);
    const s = await st(p);
    check(s.path === '/' && !s.gal, `галерея, повторное нажатие (обновить), «назад» — закрыта одним нажатием ${show(s)}`);
  });
  await run('10', async p => {
    await openGal(p); await back(p); await p.goForward(); await p.waitForTimeout(500);
    const s = await st(p);
    check(s.path === '/' && s.gal, `галерея → «назад» → «вперёд»: галерея снова открыта ${show(s)}`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    const s2 = await st(p);
    check(!s2.gal, `…Esc закрывает ${show(s2)}`);
    await back(p);
    const s3 = await st(p);
    check(s3.path === '/@NeuroSFW', `…после Esc «назад» — страница до ленты, без лишнего нажатия (${s3.path})`);
  });
  await run('11', async p => {
    await openMsgs(p); await back(p); await p.goForward(); await p.waitForTimeout(500);
    const s = await st(p);
    check(s.msgs, `личка → «назад» → «вперёд»: личка снова открыта ${show(s)}`);
  });
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
