// Быстрая смена аккаунта: кнопка над «Выйти», список сохранённых аккаунтов, смена = проверка Cloudflare, выход, вход по сохранённым почте и паролю, перезагрузка.
// Запуск:  node test/accounts.js снимок-своего-профиля.html [снимок-телефона-с-«Выйти из аккаунта».html]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const IDB = '99999999-2222-4333-8444-555555555555';
(async () => {
  const b = await chromium.launch();
  for (const [file, phone] of [[process.argv[2], false], [process.argv[3], true]]) {
    if (!file) continue;
    const snap = fs.readFileSync(file, 'utf8');
    console.log('\n== ' + (phone ? 'телефон' : 'компьютер'));
    const ctx = await b.newContext(phone ? { viewport: { width: 412, height: 860 }, isMobile: true, hasTouch: true } : { viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    const errors = [], calls = [];
    let who = 'owner';
    p.on('pageerror', e => errors.push(e.message));
    await p.route('**/*', async r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname === '/api/v1/auth/logout') { calls.push('logout'); return r.fulfill({ status: 204, body: '' }); }
      if (u.pathname === '/api/v1/auth/sign-in') {
        const body = JSON.parse(req.postData() || '{}'), h = req.headers();
        calls.push('sign-in ' + body.email + '/' + body.password + '/' + body.turnstileToken + '/' + h['x-device-id'] + '/' + h['x-requested-with']);
        if (body.password === 'bad') return r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Неверный пароль' }) });
        who = body.email === 'b@x.ru' ? 'second' : 'owner';
        return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ accessToken: 'at-' + who }) });
      }
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me' && req.method() === 'GET') return r.fulfill({ contentType: 'application/json', body: JSON.stringify(who === 'second' ? { username: 'second_acc', displayName: 'Второй', id: IDB, avatar: '🦊' } : { username: 'NeuroSFW', displayName: 'NeuroSFW', id: OWNER }) });
      if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      try { const st = JSON.parse(sessionStorage.getItem('__gm') || 'null'); if (st) Object.assign(s, st); } catch (e) { }
      window.GM_getValue = (k, d) => k in s ? s[k] : d;
      window.GM_setValue = (k, v) => { s[k] = v; try { sessionStorage.setItem('__gm', JSON.stringify(s)); } catch (e) { } };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
      try { localStorage.setItem('device_id', 'DEV-1'); } catch (e) { }
      window.turnstile = { render: (el, o) => { el.textContent = '[cloudflare]'; setTimeout(() => o.callback('TOKEN-1'), 120); return 'w1'; }, remove() { } };
    }, [src.slice(0, src.indexOf('==/UserScript=='))]);
    await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
    await p.goto(ORIGIN + new URL(snap.match(/"url": "([^"]+)"/)[1]).pathname);
    await p.waitForTimeout(3500);
    const btn = await p.$('.vp-acc-btn');
    check(!!btn, 'кнопка «Сменить аккаунт» появилась рядом с «Выйти»');
    if (!btn) { await ctx.close(); continue; }
    await p.evaluate(() => document.querySelector('.vp-acc-btn').scrollIntoView({ block: 'center' }));
    await p.waitForTimeout(300);
    await btn.click(); await p.waitForTimeout(300);
    check(await p.evaluate(() => /Включить/.test((document.querySelector('.vp-acc-pop') || {}).innerText || '')), 'без согласия показывается пояснение про хранение и кнопка «Включить»');
    await p.click('.vp-acc-pop .vp-acc-go'); await p.waitForTimeout(300);
    check(await p.evaluate(() => /Добавить аккаунт/.test(document.querySelector('.vp-acc-pop').innerText) && /Запомнить этот аккаунт/.test(document.querySelector('.vp-acc-pop').innerText)), 'после согласия виден список, «Запомнить этот аккаунт» и «Добавить аккаунт»');
    await p.screenshot({ path: 'C:/Code/Kwork/build/acc-' + (phone ? 'phone' : 'pc') + '.png' });
    await p.evaluate(() => [...document.querySelectorAll('.vp-acc-pop .vp-acc-add')].find(x => /Добавить аккаунт/.test(x.textContent)).click());
    await p.waitForTimeout(200);
    await p.fill('.vp-acc-form input[name=email]', 'b@x.ru');
    await p.fill('.vp-acc-form input[name=password]', 'pw-b');
    await Promise.all([p.waitForNavigation({ timeout: 15000 }).catch(() => null), p.click('.vp-acc-form button[type=submit]')]);
    await p.waitForTimeout(2500);
    check(calls[0] === 'logout' && calls[1] === 'sign-in b@x.ru/pw-b/TOKEN-1/DEV-1/XMLHttpRequest', 'порядок и содержимое запросов: выход, потом вход с почтой, паролем, токеном Cloudflare и заголовками сайта: ' + JSON.stringify(calls));
    const slots = await p.evaluate(() => JSON.parse(sessionStorage.getItem('__gm')).vp_logins);
    check(slots && slots[IDB] && slots[IDB].email === 'b@x.ru' && slots[IDB].password === 'pw-b' && slots[IDB].username === 'second_acc', 'вошедший аккаунт опознан по /users/me и сохранён с почтой и паролем');
    await p.evaluate(([own]) => {
      const st = JSON.parse(sessionStorage.getItem('__gm')); st.vp_logins[own] = { id: own, username: 'NeuroSFW', name: 'NeuroSFW', email: 'a@x.ru', password: 'pw-a', at: 1 };
      sessionStorage.setItem('__gm', JSON.stringify(st));
    }, [OWNER]);
    await p.reload(); await p.waitForTimeout(3500);
    calls.length = 0;
    await p.evaluate(() => document.querySelector('.vp-acc-btn').scrollIntoView({ block: 'center' }));
    await p.click('.vp-acc-btn'); await p.waitForTimeout(300);
    const rows = await p.evaluate(() => [...document.querySelectorAll('.vp-acc-pop .vp-acc-row')].map(r => r.innerText.replace(/\s+/g, ' ').trim()));
    check(rows.length === 2 && /second_acc/.test(rows[0]) && /NeuroSFW/.test(rows[1]), 'в списке два аккаунта, текущий первый: ' + JSON.stringify(rows));
    check(await p.evaluate(() => { const r = document.querySelector('.vp-acc-pop').getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; }), 'окно целиком на экране');
    await Promise.all([p.waitForNavigation({ timeout: 15000 }).catch(() => null), p.click('.vp-acc-pop .vp-acc-row:not(.vp-cur)')]);
    await p.waitForTimeout(2500);
    check(calls[0] === 'logout' && calls[1] === 'sign-in a@x.ru/pw-a/TOKEN-1/DEV-1/XMLHttpRequest', 'смена одним нажатием: выход и вход по сохранённым данным: ' + JSON.stringify(calls));
    await p.evaluate(([own]) => {
      const st = JSON.parse(sessionStorage.getItem('__gm')); st.vp_logins[own].password = 'bad';
      sessionStorage.setItem('__gm', JSON.stringify(st));
    }, [IDB]);
    await p.reload(); await p.waitForTimeout(3500);
    await p.evaluate(() => document.querySelector('.vp-acc-btn').scrollIntoView({ block: 'center' }));
    await p.click('.vp-acc-btn'); await p.waitForTimeout(300);
    await p.click('.vp-acc-pop .vp-acc-row:not(.vp-cur)'); await p.waitForTimeout(1800);
    const txt = await p.evaluate(() => document.querySelector('.vp-acc-pop').innerText.replace(/\s+/g, ' '));
    check(/Не вошёл: Неверный пароль/.test(txt) && /Открыть вход/.test(txt), 'при неверном пароле мод пишет причину и предлагает открыть вход: ' + txt.slice(0, 120));
    check(!errors.length, 'ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
    await ctx.close();
  }
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
