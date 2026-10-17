// Кнопка «Написать» в профиле человека с ИТД X (3.5.11): стоит рядом с «Подписаться», открывает чат с ним; на своём профиле и у чужих без ИТД X её нет.
// Запуск:  node test/profilewrite.js снимок-чужого-профиля.html   (например, GekataNite)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const info = (snap.match(/<script type="application\/json" id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const pagePath = info ? new URL(JSON.parse(info).url).pathname : '/';
const login = decodeURIComponent(pagePath.slice(2));
const ORIGIN = 'https://xn--d1ah4a.com', OWNER = '5e064703-104d-4794-bc28-9ed6f5847cca';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const run = async (verifiedList, width) => {
    const ctx = await b.newContext({ viewport: { width, height: 900 } });
    const p = await ctx.newPage();
    p.errors = [];
    p.on('pageerror', e => p.errors.push(e.message));
    await p.route('**/*', r => {
      const u = new URL(r.request().url()), t = r.request().resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (t === 'image' || t === 'font') return r.abort();
      if (t === 'stylesheet') return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: OWNER }) });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m, v]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
      localStorage.setItem('itd_verified_users', JSON.stringify(v));
    }, [src.slice(0, src.indexOf('==/UserScript==')), verifiedList]);
    await p.goto(ORIGIN + pagePath);
    await p.evaluate(() => document.querySelectorAll('.vp-msgs, .vp-nav-blob, .vp-fab, .vp-rail, .vp-write-btn').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    return { p, ctx };
  };
  const V = { NeuroSFW: { code: 'x', hasMod: true, id: OWNER, state: 'approved' }, [login]: { code: 'x', hasMod: true, id: 'u9', state: 'approved' } };
  let A = await run(V, 1400);
  const n = await A.p.locator('.vp-write-btn').count();
  check(n === 1, 'кнопка «Написать» в профиле человека с ИТД X (' + n + ')');
  if (n) {
    const pos = await A.p.evaluate(() => { const w = document.querySelector('.vp-write-btn'), f = w.nextElementSibling; return { next: f && f.textContent.trim(), same: w.parentElement === f.parentElement, h: w.getBoundingClientRect().height, fh: f.getBoundingClientRect().height }; });
    check(/подпис/i.test(pos.next) && pos.same, 'стоит рядом с кнопкой подписки: ' + pos.next);
    check(Math.abs(pos.h - pos.fh) <= 2, 'высота как у соседней кнопки (' + pos.h + ' и ' + pos.fh + ')');
    await A.p.evaluate(() => document.querySelector('.vp-write-btn').click());
    await A.p.waitForTimeout(900);
    check(await A.p.evaluate(() => document.querySelector('.vp-msgs').classList.contains('vp-open') && !document.querySelector('.vp-msgs-chat').hidden), 'нажатие открывает окно сообщений сразу в чате');
    const who = await A.p.$eval('.vp-msgs-who b', e => e.textContent).catch(() => '');
    check(who.toLowerCase().includes(login.toLowerCase()) || who.length > 0, 'в шапке чата — ' + who);
  }
  check(A.p.errors.length === 0, 'нет ошибок страницы ' + A.p.errors.join('|'));
  await A.ctx.close();
  A = await run({ NeuroSFW: V.NeuroSFW }, 1400);
  check(await A.p.locator('.vp-write-btn').count() === 0, 'у человека без ИТД X кнопки нет');
  await A.ctx.close();
  A = await run(V, 392);
  const ph = await A.p.evaluate(() => { const w = document.querySelector('.vp-write-btn'); return w && { span: getComputedStyle(w.querySelector('span')).display, w: w.getBoundingClientRect().width }; });
  check(ph && ph.span === 'none', 'на телефоне — только значок (' + JSON.stringify(ph) + ')');
  await A.ctx.close();
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
