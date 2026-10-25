// Технические посты (служебные посты мода: подтверждения, стикеры, личка, игры) не показываются в профиле владельца у клиентов мода.
// Запуск:  node test/hidetech.js снимок.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const meta = src.slice(0, src.indexOf('==/UserScript=='));
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const SVC = ['a0d6625a-b3ec-44c4-98da-48422af101d5', '92f2913c-18be-499a-bc03-97aed0947b34', 'a53b53e0-9950-4f62-83f4-91e5985ef6c5', 'd5f8b7c0-b97d-40cd-bdd4-3c07b3ea0611'];
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  const posts = [{ id: 'real1', likesCount: 1 }, { id: SVC[0], likesCount: 0 }, { id: 'real2', likesCount: 2 }, { id: SVC[1] }, { id: SVC[2] }, { id: SVC[3] }];
  await p.route('**/*', r => {
    const q = r.request(), u = new URL(q.url());
    if (u.origin === 'https://xn--d1ah4a.com' && q.resourceType() === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(q.resourceType())) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'Someone', id: 'u9' }) });
    if (u.pathname.startsWith('/api/posts/user/')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts, pagination: { nextCursor: 'c1', hasMore: true } } }) });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => { const s = { backgroundEnabled: false, introEnabled: false }; window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; }; window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0); window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window; }, meta);
  await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
  await p.goto('https://xn--d1ah4a.com/');
  await p.waitForTimeout(1500);
  const get = url => p.evaluate(async u => { const r = await fetch(u); const j = await r.json(); return { ids: j.data.posts.map(x => x.id), next: j.data.pagination.nextCursor, status: r.status }; }, url);
  const own = await get('/api/posts/user/NeuroSFW?limit=20&sort=new&pinnedPostId=x');
  check(own.ids.join() === 'real1,real2', 'у владельца остались только обычные посты: ' + own.ids.join());
  check(own.next === 'c1' && own.status === 200, 'пагинация и статус не тронуты');
  const lower = await get('/api/posts/user/neurosfw?limit=20&sort=new');
  check(lower.ids.join() === 'real1,real2', 'регистр ника не важен');
  const other = await get('/api/posts/user/Ivan?limit=20&sort=new');
  check(other.ids.length === 6, 'у других профилей ничего не скрывается');
  const liked = await get('/api/posts/user/NeuroSFW/liked?limit=20');
  check(liked.ids.length === 6, 'вкладка «Лайки» не тронута');
  check(!errors.length, 'ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
