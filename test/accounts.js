// Быстрая смена аккаунта: кнопка над «Выйти», список сохранённых входов, смена подменяет куки сайта и перезагружает страницу.
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
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    const soon = Math.floor(Date.now() / 1000) + 86400 * 30;
    await ctx.addCookies([
      { name: 'refresh_token', value: 'AAA-OWNER', domain: 'xn--d1ah4a.com', path: '/api/v1/auth', httpOnly: true, secure: true, sameSite: 'Lax', expires: soon },
      { name: 'cf_clearance', value: 'CF-KEEP', domain: 'xn--d1ah4a.com', path: '/', httpOnly: true, secure: true, sameSite: 'None', expires: soon },
      { name: 'theme', value: 'dark', domain: 'xn--d1ah4a.com', path: '/', secure: true, sameSite: 'Lax', expires: soon }
    ]);
    const toTm = c => ({ name: c.name, value: c.value, domain: c.domain, hostOnly: !String(c.domain).startsWith('.'), path: c.path, secure: c.secure, httpOnly: c.httpOnly, sameSite: String(c.sameSite).toLowerCase(), session: c.expires <= 0, expirationDate: c.expires > 0 ? c.expires : undefined });
    await p.exposeFunction('__ckList', async d => (await ctx.cookies()).filter(c => !(process.env.HIDDEN && c.httpOnly)).filter(c => !d.domain || c.domain.replace(/^\./, '') === d.domain.replace(/^\./, '')).map(toTm));
    await p.exposeFunction('__ckSet', async d => {
      await ctx.addCookies([{ name: d.name, value: d.value, domain: (d.domain || new URL(d.url).hostname).replace(/^\./, ''), path: d.path || '/', httpOnly: !!d.httpOnly, secure: !!d.secure, sameSite: ({ lax: 'Lax', strict: 'Strict', no_restriction: 'None' })[d.sameSite] || 'Lax', expires: d.expirationDate || soon }]);
      return true;
    });
    await p.exposeFunction('__ckDel', async d => { await ctx.clearCookies({ name: d.name }); return true; });
    await p.route('**/*', async r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh') && process.env.FAILB && (await ctx.cookies()).some(c => c.value === 'BBB-SECOND')) return r.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me' && req.method() === 'GET') { const b2 = (await ctx.cookies()).some(c => c.value === 'BBB-SECOND'); return r.fulfill({ contentType: 'application/json', body: JSON.stringify(b2 ? { username: 'second_acc', displayName: 'Второй', id: IDB } : { username: 'NeuroSFW', displayName: 'NeuroSFW', id: OWNER }) }); }
      if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m, idb, hidden]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      try { const st = JSON.parse(sessionStorage.getItem('__gm') || 'null'); if (st) Object.assign(s, st); } catch (e) { }
      if (!('vp_accounts' in s)) {
        s.vp_accounts = { [idb]: { id: idb, username: 'second_acc', name: 'Второй', ava: '🦊', at: 1, cookies: [{ name: 'refresh_token', value: 'BBB-SECOND', domain: 'xn--d1ah4a.com', hostOnly: true, path: '/api/v1/auth', secure: true, httpOnly: true, sameSite: 'lax', session: false, expirationDate: Math.floor(Date.now() / 1000) + 86400 * 30 }] } };
      }
      if (hidden && s.vp_accounts) for (const v of Object.values(s.vp_accounts)) v.cookies = [{ name: 'is_auth', value: 'true', domain: 'xn--d1ah4a.com', hostOnly: true, path: '/', secure: true, httpOnly: false, sameSite: 'lax', session: false, expirationDate: Math.floor(Date.now() / 1000) + 86400 }];
      window.GM_getValue = (k, d) => k in s ? s[k] : d;
      window.GM_setValue = (k, v) => { s[k] = v; try { sessionStorage.setItem('__gm', JSON.stringify(s)); } catch (e) { } };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_cookie = { list: (d, cb) => window.__ckList(d).then(r => cb(r)), set: (d, cb) => window.__ckSet(d).then(() => cb()), delete: (d, cb) => window.__ckDel(d).then(() => cb()) };
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, [src.slice(0, src.indexOf('==/UserScript==')), IDB, !!process.env.HIDDEN]);
    await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
    await p.goto(ORIGIN + new URL(snap.match(/"url": "([^"]+)"/)[1]).pathname);
    await p.waitForTimeout(3500);
    const btn = await p.$('.vp-acc-btn');
    check(!!btn, 'кнопка «Сменить аккаунт» появилась рядом с «Выйти»' + (btn ? ': ' + (await btn.innerText()).trim() : ''));
    if (!btn) { await ctx.close(); continue; }
    await p.evaluate(() => { document.querySelector('.vp-acc-btn').scrollIntoView({ block: 'center' }); });
    await p.waitForTimeout(300);
    await btn.click(); await p.waitForTimeout(400);
    check(await p.evaluate(() => !!document.querySelector('.vp-acc-pop')), 'окно со списком открылось');
    check(await p.evaluate(() => /Включить/.test(document.querySelector('.vp-acc-pop').innerText)), 'без согласия показывается пояснение и кнопка «Включить»');
    await p.click('.vp-acc-pop .vp-acc-go'); await p.waitForTimeout(800);
    const slots = await p.evaluate(() => JSON.parse(sessionStorage.getItem('__gm')).vp_accounts);
    const ownSlot = Object.values(slots).find(s => s.username === 'NeuroSFW');
    if (!process.env.HIDDEN) check(!!ownSlot && ownSlot.cookies.some(c => c.name === 'refresh_token' && c.value === 'AAA-OWNER' && c.httpOnly && c.path === '/api/v1/auth'), 'после согласия текущий аккаунт сохранён вместе с закрытой кукой: ' + (ownSlot ? ownSlot.cookies.map(c => c.name).join(',') : '-'));
    const rows = await p.evaluate(() => [...document.querySelectorAll('.vp-acc-pop .vp-acc-row')].map(r => r.innerText.replace(/\s+/g, ' ').trim()));
    check(rows.length === 2 && /NeuroSFW/.test(rows[0]) && /second_acc/.test(rows[1]), 'в списке два аккаунта, текущий первый: ' + JSON.stringify(rows));
    const pos = await p.evaluate(() => { const r = document.querySelector('.vp-acc-pop').getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; });
    check(pos, 'окно целиком на экране');
    await p.screenshot({ path: 'C:/Code/Kwork/build/acc-' + (phone ? 'phone' : 'pc') + '.png' });
    if (process.env.FAILB || process.env.HIDDEN) {
      await p.click('.vp-acc-pop .vp-acc-row:not(.vp-cur)');
      await p.waitForTimeout(2500);
      const ck = await ctx.cookies();
      check(ck.some(c => c.name === 'refresh_token' && c.value === 'AAA-OWNER') && !ck.some(c => c.value === 'BBB-SECOND'), (process.env.HIDDEN ? 'закрытая кука не видна скрипту: ' : '') + 'вход второго аккаунта не подошёл: прежняя кука вернулась, смены нет: ' + ck.map(c => c.name + '=' + c.value).join(', '));
      check(await p.evaluate(src => new RegExp(src).test((document.querySelector('.vp-acc-note') || {}).textContent || ''), process.env.HIDDEN ? 'закрытую куку' : 'не подошёл'), 'мод сообщил, что смена не вышла');
    } else {
      await Promise.all([p.waitForNavigation({ timeout: 15000 }).catch(() => null), p.click('.vp-acc-pop .vp-acc-row:not(.vp-cur)')]);
      await p.waitForTimeout(1500);
      const ck = await ctx.cookies();
      check(ck.some(c => c.name === 'refresh_token' && c.value === 'BBB-SECOND') && !ck.some(c => c.value === 'AAA-OWNER'), 'куки подменены на второй аккаунт, старая убрана: ' + ck.map(c => c.name + '=' + c.value).join(', '));
      const slots2 = await p.evaluate(() => JSON.parse(sessionStorage.getItem('__gm')).vp_accounts);
      check(ck.some(c => c.name === 'cf_clearance' && c.value === 'CF-KEEP'), 'кука Cloudflare не тронута (иначе на входе просят «подтвердите, что вы человек»)');
      check(Object.values(slots2).find(s => s.username === 'NeuroSFW').cookies.some(c => c.value === 'AAA-OWNER'), 'вход первого аккаунта остался в списке на потом');
      check(await p.evaluate(() => !!JSON.parse(sessionStorage.getItem('__gm')).vp_acc_pending), 'отмечено, что смена идёт (для проверки после перезагрузки)');
      check(await p.evaluate(() => /проверка входа: 200/.test(JSON.parse(sessionStorage.getItem('__gm')).vp_acc_log.map(l => l.text).join('|'))), 'в журнале есть успешная проверка входа');
    }
    check(!errors.length, 'ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
    if (!phone) {
      const q = await ctx.newPage();
      await q.route('**/*', r => { const t = r.request().resourceType(); if (t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap }); return r.fulfill({ status: 404, body: '' }); });
    }
    await ctx.close();
  }
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
