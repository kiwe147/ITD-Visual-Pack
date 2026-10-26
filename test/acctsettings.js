// Настройки мода привязаны к аккаунту: у первого аккаунта остаются старые, у второго свои (по умолчанию), смена аккаунта подхватывает нужные; служебные ключи общие.
// Запуск:  node test/acctsettings.js снимок-своего-профиля.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const IDB = '99999999-2222-4333-8444-555555555555';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage();
  const errors = []; let navs = 0, who = 'owner';
  p.on('pageerror', e => errors.push(e.message));
  p.on('framenavigated', f => { if (f === p.mainFrame()) navs++; });
  await p.route('**/*', r => {
    const req = r.request(), u = new URL(req.url()), t = req.resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me' && req.method() === 'GET') return r.fulfill({ contentType: 'application/json', body: JSON.stringify(who === 'second' ? { username: 'second_acc', displayName: 'Второй', id: IDB } : { username: 'NeuroSFW', displayName: 'NeuroSFW', id: OWNER }) });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, neonEnabled: false };
    try { const st = JSON.parse(localStorage.getItem('__gm') || 'null'); if (st) Object.assign(s, st); } catch (e) { }
    window.GM_getValue = (k, d) => k in s ? s[k] : d;
    window.GM_setValue = (k, v) => { s[k] = v; try { localStorage.setItem('__gm', JSON.stringify(s)); } catch (e) { } };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, [src.slice(0, src.indexOf('==/UserScript=='))]);
  await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
  const url = ORIGIN + new URL(snap.match(/"url": "([^"]+)"/)[1]).pathname;
  const store = () => p.evaluate(() => JSON.parse(localStorage.getItem('__gm') || '{}'));

  await p.goto(url); await p.waitForTimeout(3500);
  check(await p.evaluate(() => document.documentElement.classList.contains('vp-no-neon')), 'первый аккаунт: старая настройка (неон выключен) сохранилась');
  await p.goto(url); await p.waitForTimeout(3000);
  let st = await store();
  check(st.vp_acct_owner === OWNER && st.vp_last_acct === OWNER && st['neonEnabled@' + OWNER] === false, 'настройка перенесена на ключ аккаунта: neonEnabled@id = false, владелец и последний аккаунт записаны');

  who = 'second'; navs = 0;
  await p.goto(url); await p.waitForTimeout(5500);
  st = await store();
  check(navs <= 3, 'смена аккаунта вызывает одну дополнительную перезагрузку, не зацикливается (переходов: ' + navs + ')');
  check(st.vp_last_acct === IDB, 'последний аккаунт теперь второй');
  check(await p.evaluate(() => !document.documentElement.classList.contains('vp-no-neon')), 'второй аккаунт: свои настройки по умолчанию (неон включён), чужая настройка не применилась');
  check(st['neonEnabled@' + IDB] === undefined && st['neonEnabled@' + OWNER] === false, 'настройки первого аккаунта не тронуты и не скопированы второму');

  await p.evaluate(([idb]) => { const s = JSON.parse(localStorage.getItem('__gm')); s['neonEnabled@' + idb] = true; s['vp_logins'] = { x: 1 }; localStorage.setItem('__gm', JSON.stringify(s)); }, [IDB]);
  who = 'owner'; navs = 0;
  await p.goto(url); await p.waitForTimeout(5500);
  check(await p.evaluate(() => document.documentElement.classList.contains('vp-no-neon')), 'возврат в первый аккаунт: его настройка (неон выключен) снова на месте');
  st = await store();
  check(st.vp_logins && st.vp_logins.x === 1 && !Object.keys(st).some(k => /^vp_(logins|acc_on|acc_log)@/.test(k)), 'служебные ключи (сохранённые входы, согласие) общие для всех аккаунтов');
  check(!errors.length, 'ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
