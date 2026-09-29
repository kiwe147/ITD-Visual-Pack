// Лайки: за всё время — сумма лайков всех своих постов (стена страницами по 50, курсором); в строке
// своего профиля — справа от числа постов; в «Статистике» — строка «лайков» с разницей за день/месяц.
// Второй заход в пределах 3 часов — без запросов стены (число из памяти).
// Старый снимок истории — без лайков (их добавили в статистику позже): разница лайков — от первого снимка,
// где лайки есть, а не «0» (баг до 3.3.7.3).
// Запуск:  node test/likes.js снимок-своего-профиля.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const info = (snap.match(/id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const URL0 = 'https://xn--d1ah4a.com' + (info ? new URL(JSON.parse(info).url).pathname : '/');
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
// 60 постов: страница 1 — 50 (по 3 лайка), страница 2 — 10 (по 7) → 220
const wall = cursor => ({ data: { posts: Array.from({ length: cursor ? 10 : 50 }, (_, i) => ({ id: `w${cursor ? 50 + i : i}`, likesCount: cursor ? 7 : 3, author: { username: 'NeuroSFW' }, content: '' })), pagination: { nextCursor: cursor ? null : 'p2' } } });
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ viewport: { width: 392, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errors = [], wallHits = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (r.request().url() === URL0) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: '#NeuroSFW | ЧБ', id: 'u1', followersCount: 236, followingCount: 125, postsCount: 573 }) });
    if (u.pathname === '/api/users/NeuroSFW') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', postsCount: 573, followersCount: 236, followingCount: 125 }) });
    if (u.pathname === '/api/posts/user/NeuroSFW' && u.searchParams.get('limit') === '50') {
      wallHits.push(u.searchParams.get('cursor') || '1');
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify(wall(u.searchParams.get('cursor'))) });
    }
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    let s = {};
    try { s = JSON.parse(sessionStorage.getItem('gm') || '{}'); } catch (e) { }
    s = Object.assign({ introEnabled: false, introMobile: 'off', backgroundEnabled: false,
      // вчера было 200 лайков — разница за день +20
      vp_stats_hist: JSON.stringify([{ at: Date.now() - 30 * 3600e3, followers: 230, following: 125, posts: 570 }, { at: Date.now() - 20 * 3600e3, followers: 230, following: 125, posts: 570, likes: 200 }]) }, s);
    window.GM_getValue = (k, d) => k in s ? s[k] : d;
    window.GM_setValue = (k, v) => { s[k] = v; sessionStorage.setItem('gm', JSON.stringify(s)); };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  const load = async () => {
    await p.goto(URL0);
    await p.evaluate(() => {
      document.querySelectorAll('.vp-rail, .vp-fab, .vp-itdx-btn, .vp-posts-stat, .vp-likes-stat').forEach(e => e.remove());
      document.querySelectorAll('[data-vp-posts]').forEach(e => e.removeAttribute('data-vp-posts'));   // след мода в снимке
    });
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(5000);
    await p.evaluate(() => document.body.appendChild(document.createElement('i')));
    await p.waitForTimeout(800);
  };
  await load();
  const row = await p.evaluate(() => {
    const lk = document.querySelector('.vp-likes-stat'), ps = document.querySelector('.vp-posts-stat');
    return { likes: lk && lk.textContent.replace(/\s+/g, ' ').trim(), afterPosts: !!lk && lk.previousElementSibling === ps };
  });
  check(/^220\s*лайков$/.test(row.likes || '') && row.afterPosts, `в профиле справа от постов: «${row.likes}»`);
  check(wallHits.join() === '1,p2', `стена пролистана курсором: ${wallHits.join(' ')}`);
  const stat = await p.evaluate(() => [...document.querySelectorAll('.vp-stat')].map(r => r.textContent.replace(/\s+/g, ' ').trim()));
  check(stat.some(t => /^220\s*лайков\s*\+20$/.test(t)), `в «Статистике»: ${stat.join(' | ')}`);
  await p.screenshot({ path: path.join(__dirname, 'out', 'likes-profile.png') });
  await load();
  check(wallHits.length === 2, `второй заход — без запросов стены (всего ${wallHits.length})`);
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
