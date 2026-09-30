// Возврат ленты к посту после выхода из него (3.3.14.3). Сайт изображается: открытие поста убирает ленту и меняет адрес,
// «Назад» строит ленту заново с первых постов и догружает по 4 штуки, когда прокрутка доходит до низа.
// Режимы: сразу вся лента (сайт помнит список), догрузка порциями, посты без id (узнаются по тексту и картинке),
// выход ссылкой из поста вместо «Назад», прокрутка пользователем во время возврата (мод отступает).
// Запуск:  node test/feedreturn.js снимок-с-постами.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const url = (snap.match(/"url": "([^"]+)"/) || [, ORIGIN + '/'])[1];
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };

function siteSim(o) {
  const posts = [...document.querySelectorAll('article.vp-post')].filter(a => !a.parentElement.closest('article'));
  const slots = posts.map(a => a.parentElement);
  const box = slots[0].parentElement;
  const all = [...box.children].filter(c => slots.includes(c));
  all.forEach((c, i) => c.querySelector('article').setAttribute('data-test-n', i));
  if (o.noIds) posts.forEach(a => [...a.attributes].filter(x => /^[0-9a-f]{8}-/.test(x.value)).forEach(x => a.removeAttribute(x.name)));
  const feedUrl = location.pathname;
  let shown = 0, loading = false;
  const more = n => { all.slice(shown, shown + n).forEach(s => box.appendChild(s)); shown = Math.min(all.length, shown + n); };
  window.__sim = {
    count: all.length,
    open(i) {
      const a = all[i].querySelector('article');
      a.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      history.pushState({}, '', feedUrl.replace(/\/$/, '') + '/post/00000000-0000-0000-0000-00000000000' + (i % 10));
      all.forEach(s => s.remove());
      shown = 0;
      scrollTo(0, 0);
    },
    back(viaLink) {
      if (viaLink) history.pushState({}, '', feedUrl); else history.back();
      setTimeout(() => more(o.whole ? all.length : 4), 150);
    }
  };
  addEventListener('scroll', () => {
    if (o.whole || loading || !shown || shown >= all.length) return;
    if (scrollY + innerHeight < document.documentElement.scrollHeight - 400) return;
    loading = true;
    setTimeout(() => { more(4); loading = false; }, 250);
  }, { passive: true });
}

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const cases = [
    ['ПК, вся лента сразу', { width: 1400, height: 900 }, { whole: true }],
    ['ПК, догрузка порциями', { width: 1400, height: 900 }, {}],
    ['ПК, посты без id', { width: 1400, height: 900 }, { noIds: true }],
    ['ПК, выход ссылкой', { width: 1400, height: 900 }, { viaLink: true }],
    ['телефон, догрузка порциями', { width: 412, height: 860 }, {}],
    ['ПК, пользователь крутит сам', { width: 1400, height: 900 }, { userScroll: true }],
    ['ПК, свежий заход по ссылке', { width: 1400, height: 900 }, { fresh: true }]
  ];
  for (const [name, vp, o] of cases) {
    const phone = vp.width < 700;
    const p = await b.newPage({ viewport: vp, ...(phone ? { isMobile: true, hasTouch: true } : {}) });
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
    await p.addInitScript(m => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, src.slice(0, src.indexOf('==/UserScript==')));
    await p.goto(url);
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2000);
    await p.evaluate(siteSim, o);
    const n = await p.evaluate(() => __sim.count);
    const pick = Math.min(n - 2, 9);
    await p.evaluate(i => {
      const s = document.querySelector('article[data-test-n="' + i + '"]');
      s.scrollIntoView({ block: 'start' });
      scrollBy(0, -140);
    }, pick);
    await p.waitForTimeout(400);
    const at = await p.evaluate(i => {
      const a = document.querySelector('article[data-test-n="' + i + '"]');
      return { top: Math.round(a.getBoundingClientRect().top), text: i, y: Math.round(scrollY) };
    }, pick);
    await p.evaluate(i => __sim.open(i), pick);
    await p.waitForTimeout(500);
    if (o.fresh) {
      await p.evaluate(() => { history.pushState({}, '', '/notifications'); });
    }
    await p.evaluate(v => __sim.back(v), !!(o.viaLink || o.fresh));
    if (o.userScroll) {
      await p.waitForTimeout(450);
      await p.mouse.move(700, 400);
      await p.mouse.wheel(0, -300);
    }
    await p.waitForTimeout(o.whole ? 1500 : 6000);
    const after = await p.evaluate(t => {
      const a = document.querySelector('article[data-test-n="' + t + '"]');
      return { top: a ? Math.round(a.getBoundingClientRect().top) : null, y: Math.round(scrollY), url: location.pathname };
    }, at.text);
    console.log(`—    ${name}: пост №${pick + 1} из ${n}, был на ${at.top} (scrollY ${at.y}), стал ${JSON.stringify(after)}`);
    if (o.userScroll) check(after.top === null || Math.abs(after.top - at.top) > 50, `${name}: мод не тянет ленту, когда пользователь сам крутит`);
    else if (o.fresh) check(after.y < 200, `${name}: заход в ленту не из поста — лента с начала`);
    else check(after.top !== null && Math.abs(after.top - at.top) <= 3, `${name}: пост на том же месте (${at.top} → ${after.top})`);
    await p.screenshot({ path: path.join(__dirname, 'out', `feedreturn-${name.replace(/[^\wа-яё]+/gi, '-')}.png`) });
    check(!errors.length, `${name}: ошибок нет` + (errors.length ? ': ' + [...new Set(errors)].join(' | ') : ''));
    await p.close();
  }
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
