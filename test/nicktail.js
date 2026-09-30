// Ник одним куском (3.3.13.11): хвост ника («ВСЁ!» в отдельном теге сайта) приклеивается один раз — и живьём,
// и после сохранения страницы в HTML (снимок), и после того, как сайт перерисовал ник.
// Запуск:  node test/nicktail.js снимок-профиля-с-длинным-ником.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 412, height: 900 }, isMobile: true, hasTouch: true });
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
  await p.goto(ORIGIN + '/@kalinka_malinka');
  const setup = await p.evaluate(() => {
    const sp = document.querySelector('.vp-nick-large .vp-nick-text'), tail = document.querySelector('.vp-nick-large .vp-nick-tail-moved');
    if (!sp || !tail) return null;
    const t = tail.textContent;
    sp.textContent = sp.textContent.slice(0, -t.length);
    delete sp.dataset.vpTail;
    tail.classList.remove('vp-nick-tail-moved');
    return { head: sp.textContent, tail: t };
  });
  check(!!setup, 'в снимке есть ник с хвостом в отдельном теге');
  if (!setup) { await b.close(); process.exit(1); }
  const full = setup.head + setup.tail;
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  const nick = () => p.$eval('.vp-nick-large .vp-nick-text', e => e.textContent);
  check(await nick() === full, `живьём: «${await nick()}»`);
  await p.evaluate(() => { const sp = document.querySelector('.vp-nick-large .vp-nick-text'); sp.outerHTML = sp.outerHTML; document.body.appendChild(document.createElement('i')); });
  await p.waitForTimeout(1200);
  check(await nick() === full, `после сохранения в HTML и загрузки: «${await nick()}»`);
  await p.evaluate(h => { const sp = document.querySelector('.vp-nick-large .vp-nick-text'); sp.textContent = h; document.body.appendChild(document.createElement('i')); }, setup.head);
  await p.waitForTimeout(1200);
  check(await nick() === full, `после перерисовки ника сайтом: «${await nick()}»`);
  const hdr = await p.$('.vp-nick-large');
  if (hdr) await (await hdr.evaluateHandle(e => e.closest('div').parentElement)).asElement().screenshot({ path: path.join(__dirname, 'out', 'nicktail.png') });
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
