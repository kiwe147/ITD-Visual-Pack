// Сортировка постов в профиле (3.7.3): кнопки «Новые / Старые / Популярные» под вкладками, проверка сортировки сервера,
// подмена sort=new в запросах сайта, обновление списка на месте (через функцию сайта с invalidateWallCache) или мягкая перезагрузка,
// сброс сортировки при обновлении страницы.
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
  for (const variant of ['inplace', 'reload', 'client', 'bad']) {
    const good = variant !== 'bad', MODE = variant === 'reload' || variant === 'client' ? 'old' : 'popular', WANT = variant === 'reload' ? 'oldest' : 'popular';
    console.log(variant === 'client' ? '— сервер не умеет «старые»: мод грузит посты страницами и отдаёт сайту в обратном порядке, без закрепа' : variant === 'inplace' ? '— сервер умеет «популярные», список обновляется на месте' : variant === 'reload' ? '— «старые» только как sort=oldest, функции сайта для обновления нет: мягкая перезагрузка' : '— сервер игнорирует sort (всегда как «новые»)');
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
        if (variant === 'client') { const second = u.searchParams.get('cursor') === 'c1'; return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: second ? NEW.slice(2) : NEW.slice(0, 2), pagination: { hasMore: !second, nextCursor: second ? null : 'c1' } } }) }); }
        const posts = good ? (s === 'oldest' ? OLD : s === 'popular' ? POP : NEW) : NEW;
        return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts, pagination: { hasMore: false } } }) });
      }
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(m => { const s = { backgroundEnabled: false, introEnabled: false }; window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; }; window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0); window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window; }, meta);
    await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
    await p.goto('https://xn--d1ah4a.com' + PATH);
    await p.waitForSelector('.vp-psort', { timeout: 15000 }).catch(() => { });
    if (variant === 'inplace' || variant === 'client') {
      await p.evaluate(() => {
        const fn = async function () { window.__wall = (window.__wall || 0) + 1; var k = 'invalidateWallCache'; await 0; };
        const root = document.getElementById('root') || document.body;
        window.__list = [{ id: 'a' }, { id: 'pin' }, { id: 'b' }];
        window.__memo = { __: [{ id: 'pin' }, { id: 'a' }, { id: 'b' }], __H: [window.__list, 'pin', 'posts'], __h: function () { } };
        window.__prof = { username: 'voplex', pinnedPostId: 'pin' };
        root.__k = { __k: [{ __k: null, props: { profile: window.__prof }, __c: { forceUpdate() { window.__fu = (window.__fu || 0) + 1; }, __H: { __: [{ __: function () { }, __H: [] }, { __: fn, __H: [], __h: function () { } }, window.__memo] } } }] };
      });
    }
    const ui = await p.evaluate(() => { const b = document.querySelector('.vp-psort'); return b && { labels: [...b.querySelectorAll('button')].map(x => x.textContent), on: (b.querySelector('.vp-on') || {}).textContent, beforePost: !!b.nextElementSibling && b.nextElementSibling.tagName === 'ARTICLE' }; });
    check(ui && ui.labels.join() === 'Новые,Старые,Популярные', 'кнопки «Новые, Старые, Популярные» на странице профиля');
    check(ui && ui.on === 'Новые' && ui.beforePost, 'по умолчанию «Новые», кнопки стоят прямо над первым постом');
    if (variant === 'inplace') { const el = await p.$('.vp-psort'); await el.scrollIntoViewIfNeeded(); await p.screenshot({ path: path.join(__dirname, 'out', 'profsort.png') }); }
    const before = reloads;
    seen.length = 0;
    await p.click('.vp-psort button[data-s="' + MODE + '"]');
    await p.waitForTimeout(1800);
    const st = await p.evaluate(() => sessionStorage.getItem('vp_prof_sort'));
    console.log('—    запросы проверки: ' + seen.join(',') + '; перезагрузок: ' + (reloads - before) + '; режим: ' + st);
    if (variant === 'inplace') {
      check(seen.includes('new') && seen.includes(WANT), 'перед переключением мод проверил сортировку сервера');
      check(reloads === before && !!st, 'страница не перезагружалась, сортировка включена');
      check(await p.evaluate(() => window.__wall === 1), 'список сайта обновлён на месте (вызвана функция сброса кэша стены)');
      check(await p.evaluate(() => (document.querySelector('.vp-psort .vp-on') || {}).textContent) === 'Популярные', 'активной стала «Популярные»');
      await p.waitForTimeout(600);
      check(await p.evaluate(() => window.__prof.pinnedPostId === null), 'в режиме сортировки у профиля нет закрепа, сайт не поднимает пост наверх');
      check(await p.evaluate(() => window.__memo.__ === window.__list && window.__fu >= 1), 'закреплённый пост не поднят наверх: список сайта возвращён в порядок сервера');
      check(await p.evaluate(() => { const i = document.querySelector('.vp-psort-ind'), b = document.querySelector('.vp-psort button.vp-on'); return !!i && Math.abs(i.getBoundingClientRect().left - b.getBoundingClientRect().left) < 1.5 && Math.abs(i.getBoundingClientRect().width - b.getBoundingClientRect().width) < 1.5; }), 'подсветка под активной кнопкой (перетекла на «Популярные»)');
      const url = await p.evaluate(async login => { const r = await fetch('/api/posts/user/' + login + '?limit=20&sort=new&pinnedPostId=x'); return r.url; }, LOGIN);
      check(url.includes('sort=' + WANT) && !/pinnedPostId/.test(url), 'запрос сайта подменён на sort=' + WANT + ', закреп не запрашивается');
      const lk = await p.evaluate(async login => { const r = await fetch('/api/posts/user/' + login + '/liked?limit=20'); return r.url; }, LOGIN);
      check(!/sort=(popular|oldest)/.test(lk), 'вкладка «Лайки» не затронута');
      await p.click('.vp-psort button[data-s="new"]');
      await p.waitForTimeout(80);
      await p.evaluate(() => { const b = document.querySelector('.vp-psort'); const sp = document.createElement('i'); b.after(sp); });
      await p.waitForTimeout(250);
      check(await p.evaluate(() => { const i = document.querySelector('.vp-psort-ind'); return !!i && i.getAnimations().length > 0; }), 'если плашку пересоздали во время перетекания, подсветка продолжает перетекать');
      await p.evaluate(() => document.querySelectorAll('article.vp-post').forEach(a => a.previousElementSibling && a.previousElementSibling.tagName === 'I' && a.previousElementSibling.remove()));
      await p.waitForTimeout(800);
      await p.evaluate(() => { const arts = [...document.querySelectorAll('article.vp-post')]; window.__gone = arts.map(x => [x, x.parentElement, x.nextSibling]); arts.forEach(x => x.remove()); });
      await p.waitForTimeout(500);
      check(await p.evaluate(() => !!document.querySelector('.vp-psort')), 'плашка не пропадает, пока сайт на мгновение перерисовывает ленту');
      await p.evaluate(() => { const b = document.querySelector('.vp-psort'); window.__gone.forEach(([x]) => b.after(x)); });
      await p.waitForTimeout(400);
      check(await p.evaluate(() => document.querySelectorAll('.vp-psort').length === 1), 'после возврата постов плашка одна');
      check(await p.evaluate(() => window.__prof.pinnedPostId) === 'pin', '«Новые» возвращают закреп профилю');
      check(await p.evaluate(() => sessionStorage.getItem('vp_prof_sort')) === null && await p.evaluate(() => window.__wall) === 2 && reloads === before, '«Новые» снимает сортировку и тоже обновляет список на месте');
      await p.click('.vp-psort button[data-s="popular"]');
      await p.waitForTimeout(1500);
      await p.reload();
      await p.waitForSelector('.vp-psort', { timeout: 15000 }).catch(() => { });
      check(await p.evaluate(() => sessionStorage.getItem('vp_prof_sort')) === null && await p.evaluate(() => (document.querySelector('.vp-psort .vp-on') || {}).textContent) === 'Новые', 'после обновления страницы сортировка сбрасывается на «Новые»');
    } else if (variant === 'client') {
      check(reloads === before && !!st && JSON.parse(st).v === 'client', 'страница не перезагружалась, сортировка включена своими силами');
      check(await p.evaluate(() => window.__wall === 1), 'список сайта обновлён на месте');
      const got = await p.evaluate(async login => { const r = await fetch('/api/posts/user/' + login + '?limit=3&sort=new&pinnedPostId=x'); const j = await r.json(); const r2 = await fetch('/api/posts/user/' + login + '?limit=3&sort=new&cursor=' + encodeURIComponent(j.data.pagination.nextCursor)); const j2 = await r2.json(); return { a: j.data.posts.map(x => x.id).join(), cur: j.data.pagination.nextCursor, b: j2.data.posts.map(x => x.id).join(), end: j2.data.pagination.nextCursor }; }, LOGIN);
      check(got.a === 'n4,n3,n2' && got.b === 'n1' && got.end === null, 'сайт получает посты от старых к новым постранично: ' + got.a + ' / ' + got.b);
      check(await p.evaluate(() => (document.querySelector('.vp-psort .vp-on') || {}).textContent) === 'Старые', 'активной стала «Старые»');
      await p.click('.vp-psort button[data-s="new"]');
      await p.waitForTimeout(1000);
      seen.length = 0;
      await p.click('.vp-psort button[data-s="old"]');
      await p.waitForTimeout(1500);
      check(seen.join() === 'new,old,oldest,asc', 'повторные «Старые» берут список из памяти, постов заново не грузят: ' + seen.join());
    } else if (variant === 'reload') {
      check(seen.includes('new') && seen.includes('old') && seen.includes('oldest'), 'мод перебрал варианты названия сортировки: ' + seen.join());
      check(!!st && reloads > before && JSON.parse(st).v === 'oldest', 'функции сайта нет — мягкая перезагрузка, сортировка запомнена как oldest');
      await p.waitForSelector('.vp-psort', { timeout: 15000 }).catch(() => { });
      check(await p.evaluate(() => document.documentElement.classList.contains('vp-soft') && Date.now() - +sessionStorage.getItem('vp-intro-at') < 15000), 'перезагрузка мягкая: без заставки, анимации отключены');
      check(await p.evaluate(() => (document.querySelector('.vp-psort .vp-on') || {}).textContent) === 'Старые', 'после мягкой перезагрузки сортировка сохранилась');
      const url = await p.evaluate(async login => { const r = await fetch('/api/posts/user/' + login + '?limit=20&sort=new'); return r.url; }, LOGIN);
      check(url.includes('sort=oldest'), 'запрос сайта подменён на sort=oldest');
      await p.reload();
      await p.waitForSelector('.vp-psort', { timeout: 15000 }).catch(() => { });
      check(await p.evaluate(() => sessionStorage.getItem('vp_prof_sort')) === null, 'обычное обновление страницы сбрасывает сортировку');
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
