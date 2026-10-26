// Мемные тексты ошибок: красные плашки сайта получают шуточный текст; такой же текст в обычном месте страницы не трогается.
// Запуск:  node test/memeerrors.js любой-снимок.html
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
  const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (t === 'image' || t === 'font') return r.abort();
    if (t === 'stylesheet') return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(1500);
  const out = await p.evaluate(async () => {
    const toast = t => '<div class="CswP"><span class="S5zh"><svg width="20" height="20"></svg></span><span class="h5QT">' + t + '</span><button class="NHS1"><svg width="14" height="14"></svg></button></div>';
    const box = document.createElement('div');
    document.body.appendChild(box);
    const plain = document.createElement('p');
    plain.innerHTML = '<span>Доступ запрещён</span>';
    document.body.appendChild(plain);
    box.insertAdjacentHTML('beforeend', toast('Превышено время ожидания'));
    box.insertAdjacentHTML('beforeend', toast('Превышено время ожидания'));
    box.insertAdjacentHTML('beforeend', toast('Файл слишком большой'));
    box.insertAdjacentHTML('beforeend', toast('Какая-то другая ошибка'));
    await new Promise(r => setTimeout(r, 200));
    return { toasts: [...box.querySelectorAll('.h5QT')].map(s => s.textContent), plain: plain.textContent };
  });
  console.log('—    ' + JSON.stringify(out.toasts));
  check(out.toasts[0] === 'Нет.' && out.toasts[1] === 'Нет.', 'плашки с таймаутом получили мемный текст');
  check(out.toasts[2] === 'Файл слишком жирный', 'другая ошибка тоже заменена');
  check(out.toasts[3] === 'Какая-то другая ошибка', 'незнакомый текст ошибки не трогается');
  check(out.plain === 'Доступ запрещён', 'такой же текст не в плашке (нет иконки и кнопки) не трогается');
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
