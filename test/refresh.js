// Кнопка «обновить пост» на своих постах: есть только на своих, по нажатию один запрос счётчиков
// (POST /api/posts/stats), числа в подвале меняются на месте.
// Запуск:  node test/refresh.js снимок.html [phone|desktop] [ответ-со-списком-постов.json]
// Номера постов в ленте/профиле мод берёт из ответов сайта — третий аргумент: такой ответ
// (например, из записи запросов владельца); страница «сама» его запросит, как сайт.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [snapPath, mode = 'desktop', postsFile] = process.argv.slice(2);
const snap = fs.readFileSync(snapPath, 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const info = (snap.match(/id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const URL0 = 'https://xn--d1ah4a.com' + (info ? new URL(JSON.parse(info).url).pathname : '/');
let postsBody = postsFile && postsFile !== 'auto' ? fs.readFileSync(postsFile, 'utf8') : null;
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage(mode === 'desktop' ? { viewport: { width: 1280, height: 860 } } : { viewport: { width: 392, height: 812 }, isMobile: true, hasTouch: true });
  const errors = [], stats = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = r.request().url(), t = r.request().resourceType();
    if (u === URL0) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (/\/api\/users\/me$/.test(u)) return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","displayName":"#NeuroSFW"}' });
    if (u.endsWith('/api/posts/stats')) {
      const ids = JSON.parse(r.request().postData()).ids;
      stats.push(ids.join());
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ posts: ids.map(id => ({ id, likesCount: 99, commentsCount: 5, repostsCount: 1, viewsCount: 500 })) }) });
    }
    if (u.includes('vp-test-posts') && postsBody) return r.fulfill({ contentType: 'application/json', body: postsBody });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(URL0);
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-itdx-btn, .vp-post-tools, .vp-post-refresh').forEach(e => e.remove()));
  // auto — ответ «сайта» собираем из самого снимка: свои карточки, их картинки и текст (как в настоящем ответе)
  if (postsFile === 'auto') postsBody = await p.evaluate(() => JSON.stringify({ data: { posts: [...document.querySelectorAll('article')].map((a, i) => {
    const link = a.querySelector('header a[href^="/@"]') || a.querySelector('a[href^="/@"]');
    const user = link && link.getAttribute('href').slice(2).split(/[/?#]/)[0];
    // репост (карточка .vp-repost внутри) — как у сайта: свой текст отдельно, оригинал — в originalPost
    const rp = a.querySelector('.vp-repost');
    const txt = (root, skip) => [...root.querySelectorAll('div')].filter(d => [...d.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && !d.closest('header, footer, a, button, time') && !(skip && skip.contains(d))).map(d => d.textContent).join(' ');
    const pics = (root, skip) => [...root.querySelectorAll('img')].filter(i => !(skip && skip.contains(i))).map(i => i.src).filter(s => /\/images\//.test(s));
    const post = { id: '00000000-0000-4000-8000-' + String(i).padStart(12, '0'), content: txt(a, rp), author: { username: user }, attachments: pics(a, rp).map(url => ({ url })) };
    if (rp) post.originalPost = { id: 'orig-' + i, content: txt(rp), attachments: pics(rp).map(url => ({ url })), author: { username: 'someone' } };
    return post;
  }).filter(p => p.author.username) } }));
  await p.addScriptTag({ content: src });
  // «сайт» запрашивает список постов (адрес — как у профиля, ответ — подложенный)
  if (postsBody) await p.evaluate(() => fetch('/api/posts/user/NeuroSFW?limit=20&sort=new&vp-test-posts=1'));
  await p.waitForTimeout(3000);
  await p.evaluate(() => document.body.appendChild(document.createElement('i')));
  await p.waitForTimeout(800);
  const found = await p.evaluate(() => {
    const btns = [...document.querySelectorAll('.vp-post-refresh')];
    const own = btns.every(b => /NeuroSFW/i.test(b.closest('.vp-post-tools').parentElement.innerHTML));
    const boxes = [...document.querySelectorAll('.vp-post-tools')];
    const links = boxes.filter(x => x.querySelector('.vp-post-copy[data-act="link"]')).length;
    const order = boxes.every(x => [...x.children].map(c => c.dataset.act || 'refresh').join(',').replace(/^refresh,?/, '').match(/^(copy,)?link$/));
    return { count: btns.length, own, boxes: boxes.length, links, order };
  });
  console.log(`кнопок «обновить»: ${found.count}, все на своих постах: ${found.own}; групп кнопок: ${found.boxes}, со ссылкой: ${found.links}, порядок верный: ${found.order}`);
  const cards = await p.evaluate(() => document.querySelectorAll('article').length);
  console.log(`карточек: ${cards}`);
  let ok = found.count > 0 && found.own && found.boxes > 0 && found.links === found.boxes && found.order && (!process.env.ALL || found.boxes === cards);
  if (found.count) {
    // карточка меняется после появления кнопки (сайт дописал «(ред.)», выросла шапка) — кнопка едет за «…»
    const align = () => p.$eval('.vp-post-tools', b => {
      const m = b._vpMenu.getBoundingClientRect(), r = b.getBoundingClientRect();
      return { dy: Math.round((r.top + r.height / 2) - (m.top + m.height / 2)), gap: Math.round(m.left - r.right) };
    });
    const a0 = await align();
    await p.$eval('.vp-post-tools', b => {
      const card = b.parentElement, h = card.querySelector('header');
      b._vpMenu.style.transform = 'translateY(23px)'; b._vpMenu.style.marginRight = '17px';
      document.body.appendChild(document.createElement('i'));
    });
    await p.waitForTimeout(600);
    const a1 = await align();
    console.log(`кнопка у «…»: до ${JSON.stringify(a0)}, после сдвига шапки ${JSON.stringify(a1)}`);
    ok = ok && Math.abs(a0.dy) <= 1 && Math.abs(a1.dy) <= 1 && a1.gap >= 0 && a1.gap <= 4;
    const btn = await p.$('.vp-post-refresh');
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await p.waitForTimeout(800);
    const nums = await btn.evaluate(b => {
      const card = b.closest('article') || b.closest('div:has(> footer)') || b.parentElement.closest('div:has(footer)');
      const f = card.querySelector('footer');
      return [...f.querySelectorAll('span')].filter(s => !s.children.length && /^\d+$/.test(s.textContent.trim())).map(s => s.textContent.trim());
    });
    console.log(`запрос счётчиков: ${stats.length} (${stats.join(' | ')}), числа в подвале: ${nums.join(' ')}`);
    ok = ok && stats.length === 1 && ['99', '5', '1', '500'].every(n => nums.includes(n));
    await p.screenshot({ path: path.join(__dirname, 'out', `refresh-${mode}.png`) });
  }
  if (errors.length) console.log('ошибки: ' + errors.join(' | '));
  console.log(ok && !errors.length ? 'Всё прошло' : 'ОШИБКА');
  await b.close();
  process.exit(ok && !errors.length ? 0 : 1);
})();
