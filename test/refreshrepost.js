// Кнопка «Обновить» у поста с репостом (3.3.14.3): свои счётчики получает и сам пост, и репост внутри него,
// ничего не перепутано местами. Репост вкладывается в пост снимка вручную, ответы сервера подменяются.
// Запуск:  node test/refreshrepost.js снимок-с-постами.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const url = (snap.match(/"url": "([^"]+)"/) || [, ORIGIN + '/'])[1];
const P = '11111111-1111-4111-8111-111111111111', O = '22222222-2222-4222-8222-222222222222';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  let posts = [], asked = null;
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: OWNER }) });
    if (u.pathname === '/api/posts/user/test') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts } }) });
    if (u.pathname === '/api/posts/stats') {
      asked = JSON.parse(r.request().postData()).ids;
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ posts: [
        { id: O, likesCount: 9, commentsCount: 3, repostsCount: 1, viewsCount: 73 },
        { id: P, likesCount: 5, commentsCount: 0, repostsCount: 0, viewsCount: 2 }
      ].filter(x => asked.includes(x.id)) }) });
    }
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(url);
  const info = await p.evaluate(() => {
    document.querySelectorAll('.vp-post-tools, .vp-rail').forEach(e => e.remove());
    const a = [...document.querySelectorAll('article')].find(x => x.querySelector('footer') && x.querySelector('img[data-post-media-image]') && !x.parentElement.closest('article'));
    const foot = a.querySelector('footer');
    const media = a.querySelector('img[data-post-media-image]');
    const rp = document.createElement('div');
    rp.setAttribute('data-test-repost', '');
    rp.innerHTML = '<div><span data-icon="share"><svg></svg></span><a href="/@abdul">Абдул</a></div>';
    rp.appendChild(media.parentElement);
    const rf = foot.cloneNode(true);
    rf.setAttribute('data-test-foot', 'repost');
    rp.appendChild(rf);
    foot.setAttribute('data-test-foot', 'own');
    foot.before(rp);
    a.setAttribute('data-test-card', '');
    const text = [...a.querySelectorAll('[class*="vp-post-text"]')].map(t => t.textContent).join(' ').replace(/\s+/g, ' ').trim();
    const user = a.querySelector('header a[href^="/@"]').getAttribute('href').slice(2);
    return { img: media.getAttribute('src'), text, user };
  });
  posts = [{ id: P, author: { username: info.user }, content: info.text || 'x', attachments: [], originalPost: { id: O, author: { username: 'abdul' }, content: '', attachments: [{ url: info.img }] } }];
  await p.addScriptTag({ content: src });
  await p.evaluate(() => fetch('/api/posts/user/test').then(r => r.text()));
  await p.waitForTimeout(2500);
  const nums = () => p.evaluate(() => Object.fromEntries(['own', 'repost'].map(k => {
    const f = document.querySelector(`[data-test-foot="${k}"]`);
    const n = l => { const bt = f.querySelector(`button[aria-label="${l}"]`); const sp = bt && [...bt.querySelectorAll('span')].reverse().find(s => !s.children.length && /^\d/.test(s.textContent.trim())); return sp ? sp.textContent.trim() : null; };
    return [k, [n('Нравится'), n('Комментировать'), n('Репост')].join('/')];
  })));
  console.log('—    до:', JSON.stringify(await nums()), 'репост узнан:', await p.evaluate(() => !!document.querySelector('[data-test-card] .vp-repost')));
  const btn = await p.$('[data-test-card] .vp-post-refresh');
  check(!!btn, 'у поста есть кнопка «Обновить»');
  if (btn) await btn.click();
  await p.waitForTimeout(1200);
  const after = await nums();
  console.log('—    после:', JSON.stringify(after), 'запрос ids:', JSON.stringify(asked));
  check(asked && asked.includes(P) && asked.includes(O), 'в одном запросе спрошены и пост, и репост');
  check(after.own === '5/0/0', `счётчики поста — свои (${after.own})`);
  check(after.repost === '9/3/1', `счётчики репоста — свои (${after.repost})`);
  const card = await p.$('[data-test-card]');
  if (card) await card.screenshot({ path: path.join(__dirname, 'out', 'refreshrepost.png') });
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + [...new Set(errors)].join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
