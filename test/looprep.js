// Самодиагностика петли высот: если посты в ленте непрерывно меняют положение при неподвижной прокрутке,
// мод пишет в консоль, какие внутренние элементы прыгают (window.__vpLoop).
// Запуск:  node test/looprep.js снимок-профиля-с-верха-списка.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1500, height: 900 } })).newPage();
  const errors = [], warns = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (/петля пересчёта/.test(m.text())) warns.push(m.text()); });
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (t === 'image') return r.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#556"/></svg>' });
    if (t === 'font') return r.abort();
    if (t === 'stylesheet') return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/@NeuroSFW');
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2000);
  // обычное изменение при прокрутке не должно считаться петлёй
  await p.evaluate(async () => { for (let i = 0; i < 30; i++) { scrollBy(0, 40); await new Promise(r => setTimeout(r, 30)); } });
  await p.waitForTimeout(500);
  check(!warns.length && !(await p.evaluate(() => window.__vpLoop)), 'при обычной прокрутке отчёта о петле нет');
  // имитация петли: слоты и вставка внутри поста дёргаются на каждом шаге, прокрутка стоит
  await p.evaluate(() => {
    const slots = [...document.querySelectorAll('.vp-post-slot')].filter(s => !s.closest('article'));
    const base = slots.map(s => parseFloat((s.style.transform.match(/translateY\((-?[\d.]+)/) || [])[1]) || 0);
    const fake = document.createElement('i');
    fake.className = 'vp-fake';
    fake.style.cssText = 'display:block;width:50px';
    slots[1].insertBefore(fake, slots[1].firstChild);
    let k = 0;
    window.__loop = setInterval(() => {
      k++;
      slots.forEach((s, i) => { s.style.transform = 'translateY(' + (base[i] + (i >= 2 ? (k % 2 ? 54 : 0) : 0)) + 'px)'; });
      fake.style.height = (k % 2 ? 54 : 0) + 'px';
    }, 20);
  });
  await p.waitForTimeout(3500);
  const rep = await p.evaluate(() => { clearInterval(window.__loop); return window.__vpLoop || ''; });
  console.log(rep.split(String.fromCharCode(10)).slice(0, 4).join(' | '));
  check(!!rep, 'мод заметил петлю и составил отчёт');
  check(/vp-fake/.test(rep), 'в отчёте назван прыгающий элемент vp-fake');
  check(warns.length === 1, 'предупреждение в консоль выведено один раз (' + warns.length + ')');
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
