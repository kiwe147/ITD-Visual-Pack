// Интеграция на НАСТОЯЩЕМ коде сайта: страницы и скрипты берутся с сайта, ответы API — из HAR владельца (читаются в памяти, на диск не пишутся,
// заголовки и токены не используются; auth/refresh отвечает поддельным токеном).
// Запуск:  HAR="C:/Users/sasha/Downloads/xn--d1ah4a.com.har" node test/realsite.js [логин=NeuroSFW]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const HAR = process.env.HAR;
const LOGIN = process.argv[2] || 'NeuroSFW';
if (!HAR) { console.error('укажи HAR=путь'); process.exit(2); }
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const meta = src.slice(0, src.indexOf('==/UserScript=='));
const entries = JSON.parse(fs.readFileSync(HAR, 'utf8')).log.entries;
const store = new Map();
for (const e of entries) {
  const u = new URL(e.request.url);
  if (!u.pathname.startsWith('/api/') || !e.response.content || e.response.content.text === undefined) continue;
  let body = e.response.content.text;
  if (e.response.content.encoding === 'base64') body = Buffer.from(body, 'base64').toString('utf8');
  const cur = u.searchParams.get('cursor') || '';
  const key = e.request.method + ' ' + u.pathname + (/posts\/user\//.test(u.pathname) ? '?c=' + cur : '');
  if (!store.has(key)) store.set(key, { status: e.response.status, type: e.response.content.mimeType || 'application/json', body });
}
console.log('ответов API в HAR:', store.size);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 } });
  const p = await ctx.newPage();
  const log = [], errors = [];
  let navs = 0;
  p.on('pageerror', e => errors.push(e.message));
  p.on('framenavigated', f => { if (f === p.mainFrame()) navs++; });
  p.on('console', m => { if (/ITD VP|планиров|сортиров/.test(m.text())) log.push(m.text().slice(0, 160)); });
  await p.route('**/api/**', r => {
    const req = r.request(), u = new URL(req.url());
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MSIsInVzZXJJZCI6InUxIiwiaWQiOiJ1MSIsImV4cCI6NDEwMjQ0NDgwMCwiaWF0IjoxNzYwMDAwMDAwfQ.sig' }) });
    if (u.pathname.includes('/notifications/stream')) return r.fulfill({ status: 204, body: '' });
    const sort = u.searchParams.get('sort');
    const isWall = /^\/api\/posts\/user\/[^/]+$/.test(u.pathname);
    const key = req.method() + ' ' + u.pathname + (isWall ? '?c=' + (u.searchParams.get('cursor') || '') : '');
    let hit = store.get(key) || (isWall ? store.get(req.method() + ' /api/posts/user/' + LOGIN + '?c=' + (u.searchParams.get('cursor') || '')) : null);
    log.push('API ' + req.method() + ' ' + u.pathname + u.search.slice(0, 70) + (hit ? '' : '  (нет в HAR)'));
    if (!hit) return r.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"нет в HAR"}' });
    let body = hit.body;
    if (isWall && (sort === 'popular' || sort === 'oldest' || sort === 'old')) {
      try { const j = JSON.parse(body), d = j.data || j; d.posts = d.posts.slice().sort((x, y) => sort === 'popular' ? (y.likesCount || 0) - (x.likesCount || 0) : Date.parse(x.createdAt) - Date.parse(y.createdAt)); body = JSON.stringify(j); } catch (e) { }
    }
    return r.fulfill({ status: hit.status, contentType: hit.type, body });
  });
  await p.addInitScript(m => { const s = { backgroundEnabled: false, introEnabled: false }; window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; }; window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0); window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window; }, meta);
  await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
  await p.goto('https://xn--d1ah4a.com/@' + LOGIN, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('article', { timeout: 30000 }).catch(() => { });
  await p.waitForTimeout(3000);
  const state = () => p.evaluate(() => ({ pill: !!document.querySelector('.vp-psort'), articles: document.querySelectorAll('article').length, first: ((document.querySelector('article .vp-post-text, article') || {}).textContent || '').replace(/\s+/g, ' ').slice(0, 60), body: document.body.innerText.slice(0, 80).replace(/\s+/g, ' ') }));
  console.log('после загрузки:', JSON.stringify(await state()));
  if (process.env.SHOT) await p.screenshot({ path: path.join(__dirname, 'out', 'realsite.png') });
  const navs0 = navs;
  const res = await p.evaluate(() => { const a = document.querySelector('article'); if (!a) return 'нет article'; const key = Object.keys(a).find(k => k.startsWith('__reactFiber$')); return key ? 'fiber есть' : 'fiber нет'; });
  console.log('React-узел у article:', res);
  if (await p.$('.vp-psort')) {
    log.length = 0;
    await p.click('.vp-psort button[data-s="popular"]');
    await p.waitForTimeout(4000);
    console.log('после клика «Популярные»: перезагрузок страницы', navs - navs0, '; режим', await p.evaluate(() => sessionStorage.getItem('vp_prof_sort')));
    console.log('состояние:', JSON.stringify(await state()));
    console.log('результат моста:', await p.evaluate(() => (document.querySelector('[data-vp-wall]') || {}).getAttribute && document.querySelector('[data-vp-wall]').getAttribute('data-vp-res')));
  }
  console.log(log.slice(-25).join('\n'));
  console.log('ошибки страницы:', errors.slice(0, 3).join(' | ') || 'нет');
  await b.close();
})();
