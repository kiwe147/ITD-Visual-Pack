// Всплывашки уведомлений сайта: видна одна (самая новая), сверху по центру, «Скрыть все» спрятана;
// пришла новая — старая закрыта сразу (её крестиком); через 7 секунд закрывается и последняя.
// Снимок — с двумя всплывашками (ITD/itd-snapshot-feed-2048px (1).html). ПК и телефон.
// Запуск:  node test/toasts.js снимок-ленты-со-всплывашками.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  for (const [mode, vp] of [['ПК', { width: 1400, height: 900 }], ['телефон', { width: 392, height: 812 }]]) {
    const p = await b.newPage({ viewport: vp });
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.route('**/*', r => {
      const u = new URL(r.request().url()), t = r.request().resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(m => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, src.slice(0, src.indexOf('==/UserScript==')));
    await p.goto(ORIGIN + '/');
    // крестик на снимке без приложения ничего не делает — считаем нажатия
    await p.evaluate(() => { window.__closed = []; document.querySelectorAll('#root > div:last-child button').forEach(x => x.addEventListener('click', () => window.__closed.push(x.closest('div').textContent.slice(0, 20)))); });
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(1500);
    const look = () => p.evaluate(() => {
      const box = document.querySelector('.vp-toasts');
      if (!box) return null;
      const shown = [...box.querySelectorAll(':scope > div > *')].filter(e => getComputedStyle(e).display !== 'none');
      const r = shown[0] && shown[0].getBoundingClientRect();
      const all = box.querySelector(':scope > button');
      return { shown: shown.length, text: shown[0] ? shown[0].querySelector('p').textContent : '', cx: r ? Math.round(r.left + r.width / 2) : 0, top: r ? Math.round(r.top) : 0,
        w: document.documentElement.clientWidth, boxCx: Math.round((box.getBoundingClientRect().left + box.getBoundingClientRect().right) / 2), listPad: getComputedStyle(box.firstElementChild).padding, css: (c => [c.marginLeft, c.marginRight, c.transform, c.left, c.width, c.boxSizing, c.paddingLeft, c.paddingRight, c.borderLeftWidth].join(' '))(getComputedStyle(box)), hideAll: all ? getComputedStyle(all).display : 'нет', closed: window.__closed.length };
    });
    let s = await look();
    console.log(`—    ${mode}: ${JSON.stringify(s)}`);
    check(s && s.shown === 1, `${mode}: видна одна всплывашка из двух`);
    check(s && Math.abs(s.cx - s.w / 2) <= 2 && s.top <= 60, `${mode}: сверху по центру (центр ${s && s.cx} из ${s && s.w}, сверху ${s && s.top})`);
    check(s && s.hideAll === 'none', `${mode}: «Скрыть все» спрятана`);
    check(await p.evaluate(() => { const it = [...document.querySelectorAll('.vp-toasts > div > *')].find(e => getComputedStyle(e).display !== 'none'); return !!it && it.classList.contains('vp-emoji-tint') && getComputedStyle(it).borderTopLeftRadius === '24px'; }), `${mode}: оформлена как во вкладке уведомлений (оттенок по эмодзи, скругление)`);
    check(s && s.closed === 1, `${mode}: старая закрыта своим крестиком`);
    // пришла новая — прошлая закрывается сразу
    await p.evaluate(() => {
      const list = document.querySelector('.vp-toasts > div'), it = list.children[0].cloneNode(true);
      it.className = list.children[0].className.replace('vp-toast-old', '');
      it.querySelector('p').textContent = 'Новая оценил(а) ваш пост';
      it.querySelector('button').addEventListener('click', () => window.__closed.push('новая'));
      list.appendChild(it);
    });
    await p.waitForTimeout(400);
    s = await look();
    check(s.shown === 1 && /Новая/.test(s.text) && s.closed === 2, `${mode}: новая сразу заменила старую («${s.text}», закрыто ${s.closed})`);
    await p.waitForTimeout(7200);
    s = await look();
    check(s.shown === 0 && s.closed === 3, `${mode}: через 7 с закрылась и последняя (видно ${s.shown}, закрыто ${s.closed})`);
    check(!errors.length, `${mode}: ошибок нет` + (errors.length ? ': ' + errors.join(' | ') : ''));
    await p.close();
  }
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
