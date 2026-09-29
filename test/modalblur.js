// «Оформление поста» (ивент, 29.09) — окно role="dialog" внутри поля нового поста. Мод принимал его за всплывающее окно и мылил
// всю страницу. Затемнение с размытием — только для окон поверх страницы (position: fixed).
// Запуск:  node test/modalblur.js "../ITD/itd-snapshot-NeuroSFW-2048px (2).html"
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
  const p = await b.newPage({ viewport: { width: 1808, height: 1000 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/@NeuroSFW', { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => [...document.body.children].filter(e => e.style && /blur/.test(e.style.backdropFilter || '')).forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  const dim = () => p.evaluate(() => [...document.body.children].some(e => e.style && /blur/.test(e.style.backdropFilter || '') && getComputedStyle(e).position === 'fixed'));
  const inline = await p.evaluate(() => !!document.querySelector('[role="dialog"][aria-label="Оформление поста"]'));
  check(inline, 'на снимке открыто «Оформление поста»');
  check(!(await dim()), 'встроенное окно «Оформление поста» не размывает страницу');
  await p.evaluate(() => { const d = document.createElement('div'); d.setAttribute('role', 'dialog'); d.style.cssText = 'position:fixed;left:40%;top:30%;width:300px;height:200px;background:#222;z-index:2000'; d.id = 'fx'; document.body.appendChild(d); });
  await p.waitForTimeout(400);
  check(await dim(), 'настоящее окно поверх страницы — затемнение есть, как раньше');
  await p.evaluate(() => document.getElementById('fx').remove());
  await p.waitForTimeout(400);
  check(!(await dim()), 'окно закрыли — затемнение ушло');
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
