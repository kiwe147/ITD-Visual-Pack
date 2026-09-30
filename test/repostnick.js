// Ник автора внутри репоста (3.3.15.3): у сайта он без ссылки на профиль — только data-user-name с id. Мод узнаёт человека
// по id среди галочек и вешает его стиль ника, подсветку аватарки и галочку ИТД X (раньше — только у ников-ссылок).
// Разметка поста — от владельца 30.09 (ebaweff репостнул свой пост), всё, что навесил мод, из неё убрано.
// Запуск:  node test/repostnick.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const url = (snap.match(/"url": "([^"]+)"/) || [, ORIGIN + '/'])[1];
const UID = '955ac3de-e950-4038-b931-8c9d8115ede2';
const SHARE = '<span data-icon="share" aria-hidden="true" style="display:block;width:14px;height:14px;line-height:0"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" width="14" height="14"><path stroke="currentColor" d="M4 9V8a3 3 0 0 1 3-3h9"/></svg></span>';
const BTN = (l, n) => `<button aria-label="${l}" class="hIQn"><span data-icon="like" aria-hidden="true"><svg width="17" height="17"></svg></span><span>${n}</span></button>`;
const POST = `<div class="LYoK"><article data-alice-water-anchor-kind="post" data-alice-water-anchor-id="7c894560-4baf-4244-90bf-205d8569a163" class="ugSq" data-test-post="">
<div class="NHYE r7Ov"><a href="/@ebaweff" class="fPLb"><div class="AHmE Pykz"><span class="Txbz">🤠</span></div></a><div class="xS1E"><header class="YCiR"><div class="FJws"><div class="DYsh">
<a href="/@ebaweff" class="xuiI"><span data-user-name="${UID}" class="whG5 Pzl7 A66U"><span class="yXCf">ебашеф</span><span class="mGro"><span class="YdhY"><img src="https://cdn.xn--d1ah4a.com/public/pins/kirill67/2026-02/2.webp" alt="Переболел вирусом Кирилл-67" width="14" height="14" class="P8ad"></span></span></span></a><time datetime="2026-09-30T14:59:52.708Z" data-post-time="true" class="xtPE">1 ч.</time></div></div></header>
<div class="eYqB"><div class="YiUX"><div class="hXIF"><span data-post-tool-text="true" class="F3U4"><span>Предложение актуально</span></span></div></div>
<div class="j2VH" data-test-repost=""><div class="H1EQ">${SHARE}<div class="AHmE bz5w"><span class="Txbz">🤠</span></div><span data-user-name="${UID}" class="whG5 CfOg A66U"><span class="yXCf">ебашеф</span><span class="mGro"><span class="YdhY"><img src="https://cdn.xn--d1ah4a.com/public/pins/kirill67/2026-02/2.webp" alt="Переболел вирусом Кирилл-67" width="12" height="12" class="P8ad"></span></span></span><span class="uUCk">8 июн.</span></div>
<div class="GKXN"><span data-post-tool-text="true" class="F3U4"><span>Я женюсь и обеспечу беззаботное будущее</span></span></div>
<footer class="KOP0 JVbB"><div class="eEC6">${BTN('Нравится', 32)}${BTN('Комментировать', 19)}${BTN('Репост', 3)}</div></footer></div>
<footer class="KOP0"><div class="eEC6">${BTN('Нравится', 14)}${BTN('Комментировать', 6)}${BTN('Репост', 0)}</div></footer></div></div></div></article></div>`;
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: OWNER }) });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m, uid]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    try { localStorage.setItem('itd_verified_users', JSON.stringify({ ebaweff: { state: 'approved', id: uid, hasMod: true, code: 'x', look: { n: 'matrix', b: '-', g: '11' } } })); } catch (e) { }
  }, [src.slice(0, src.indexOf('==/UserScript==')), UID]);
  await p.goto(url);
  await p.evaluate(html => {
    const first = [...document.querySelectorAll('article')].find(a => !a.parentElement.closest('article'));
    const slot = first.parentElement;
    const t = document.createElement('template');
    t.innerHTML = html;
    const el = t.content.firstElementChild;
    el.style.cssText = 'position: relative; z-index: 50; transform: none; background: #111; width: 640px;';
    slot.parentElement.insertBefore(el, slot);
    slot.parentElement.querySelector('[data-test-post]').scrollIntoView({ block: 'start' });
  }, POST);
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(3000);
  const st = await p.evaluate(() => {
    const post = document.querySelector('[data-test-post]'), rp = post.querySelector('[data-test-repost]');
    const info = root => {
      const nick = root.querySelector('[data-user-name]'), text = nick && [...nick.querySelectorAll('*')].find(e => !e.children.length && e.textContent.trim() === 'ебашеф');
      const badge = nick && nick.querySelector('.mod-badge-verify'), av = root.querySelector('.AHmE');
      return { look: text && text.getAttribute('data-vp-look'), glow: nick && (nick.getAttribute('data-vp-look-glow') || (nick.parentElement && nick.parentElement.getAttribute('data-vp-look-glow'))), badge: !!badge, badgeAfterNick: !!badge && badge.previousElementSibling === text, av: av && av.getAttribute('data-vp-look-av') };
    };
    return { head: info(post.querySelector('header')), repost: info(rp) };
  });
  console.log('—    ' + JSON.stringify(st));
  check(st.head.look === 'matrix' && st.head.badge, 'в шапке поста: стиль «matrix» и галочка (как и раньше)');
  check(st.repost.look === 'matrix', `в репосте у ника стиль «matrix» (${st.repost.look})`);
  check(st.repost.badge && st.repost.badgeAfterNick, 'в репосте галочка ИТД X сразу после ника');
  check(st.repost.av === 'matrix', `в репосте подсвечена аватарка (${st.repost.av})`);
  const box = await (await p.$('[data-test-post]')).boundingBox();
  await p.screenshot({ path: path.join(__dirname, 'out', 'repostnick.png'), clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 260) } });
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
