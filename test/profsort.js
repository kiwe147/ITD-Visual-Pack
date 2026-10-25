// Сортировка постов в профиле (3.7.1): кнопки «Новые / Старые / Популярные», проверка сортировки сервера перед переключением,
// подмена sort=new на выбранную сортировку в запросах сайта после перезагрузки.
// Запуск:  node test/profsort.js снимок-чужого-профиля.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const meta = src.slice(0, src.indexOf('==/UserScript=='));
const info = (snap.match(/id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const PATH = info ? new URL(JSON.parse(info).url).pathname : '/';
const LOGIN = (PATH.match(/^\/@([\w.]+)/) || [])[1];
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const mk = (id, likes, day) => ({ id, likesCount: likes, createdAt: new Date(Date.UTC(2026, 5, day)).toISOString(), isPinned: false });
const NEW = [mk('n1', 5, 20), mk('n2', 50, 15), mk('n3', 9, 10), mk('n4', 70, 5)];
const OLD = NEW.slice().reverse(), POP = NEW.slice().sort((a, b) => b.likesCount - a.likesCount);
(async () => {
  const b = await chromium.launch();
  for (const good of [true, false]) {
    console.log(good ? '— сервер умеет сортировку' : '— сервер игнорирует sort (всегда как «новые»)');
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    const errors = [], seen = [];
    let reloads = 0;
    p.on('pageerror', e => errors.push(e.message));
    p.on('framenavigated', f => { if (f === p.mainFrame()) reloads++; });
    await p.route('**/*', r => {
      const req = r.request(), u = new URL(req.url());
      if (u.origin === 'https://xn--d1ah4a.com' && req.resourceType() === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: 'u1' }) });
      if (u.pathname.startsWith('/api/posts/user/' + LOGIN)) {
        const s = u.searchParams.get('sort');
        seen.push(s);
        const posts = good ? (s === 'old' ? OLD : s === 'popular' ? POP : NEW) : NEW;
        return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts, pagination: { hasMore: false } } }) });
      }
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(m => { const s = { backgroundEnabled: false, introEnabled: false }; window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; }; window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0); window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window; }, meta);
    await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
    await p.goto('https://xn--d1ah4a.com' + PATH);
    await p.waitForSelector('.vp-psort', { timeout: 15000 }).catch(() => { });
    const ui = await p.evaluate(() => { const b = document.querySelector('.vp-psort'); return b && { labels: [...b.querySelectorAll('button')].map(x => x.textContent), on: (b.querySelector('.vp-on') || {}).textContent, beforeArticle: !!b.nextElementSibling && b.nextElementSibling.tagName === 'ARTICLE' }; });
    check(ui && ui.labels.join() === 'Новые,Старые,Популярные', 'кнопки «Новые, Старые, Популярные» на странице профиля');
    check(ui && ui.on === 'Новые' && ui.beforeArticle, 'по умолчанию «Новые», кнопки стоят над первым постом');
    if (good) { const el = await p.$('.vp-psort'); if (el) { await el.scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(__dirname, 'out', 'profsort.png') }); } }
    const before = reloads;
    seen.length = 0;
    await p.click('.vp-psort button[data-s="popular"]');
    await p.waitForTimeout(1800);
    const st = await p.evaluate(() => sessionStorage.getItem('vp_prof_sort'));
    console.log('—    запросы проверки: ' + seen.join(',') + '; перезагрузок: ' + (reloads - before) + '; режим: ' + st);
    if (good) {
      check(seen.includes('new') && seen.includes('popular'), 'перед переключением мод проверил сортировку сервера');
      check(!!st && reloads > before, 'сортировка включена и страница перезагружена');
      await p.waitForSelector('.vp-psort', { timeout: 15000 }).catch(() => { });
      check(await p.evaluate(() => (document.querySelector('.vp-psort .vp-on') || {}).textContent) === 'Популярные', 'после перезагрузки активна «Популярные»');
      const url = await p.evaluate(async login => { const r = await fetch('/api/posts/user/' + login + '?limit=20&sort=new&pinnedPostId=x'); return r.url; }, LOGIN);
      check(/sort=popular/.test(url) && /pinnedPostId=x/.test(url), 'запрос сайта подменён на sort=popular: ' + url.replace(/^.*\/api/, '/api'));
      const lk = await p.evaluate(async login => { const r = await fetch('/api/posts/user/' + login + '/liked?limit=20'); return r.url; }, LOGIN);
      check(!/sort=popular/.test(lk), 'вкладка «Лайки» не затронута');
      await p.click('.vp-psort button[data-s="new"]');
      await p.waitForTimeout(1500);
      check(await p.evaluate(() => sessionStorage.getItem('vp_prof_sort')) === null, '«Новые» снимает сортировку');
    } else {
      check(!st && reloads === before, 'сервер не умеет сортировку: режим не включён, страница не перезагружалась');
      check(await p.evaluate(() => !!document.querySelector('.vp-note')), 'показано сообщение, что сайт не отдаёт такую сортировку');
    }
    check(!errors.length, 'ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
    await ctx.close();
  }
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
