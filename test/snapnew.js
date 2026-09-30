// Админка (3.3.13.8): «Только новое» — сохраняет лишь то, что появилось после прошлого снимка.
// Запуск:  node test/snapnew.js снимок.html
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
  const p = await b.newPage({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  const files = [];
  p.on('download', async d => { const f = path.join(__dirname, 'out', '_sn-' + d.suggestedFilename()); await d.saveAs(f); files.push({ name: d.suggestedFilename(), html: fs.readFileSync(f, 'utf8') }); fs.unlinkSync(f); });
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
  await p.goto(ORIGIN + '/');
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  check(!!(await p.$('.vp-fab [data-act="snapNew"]')), 'в админке есть «Только новое»');
  const toast = () => p.$$eval('.vp-admin-toast', t => t.map(x => x.textContent).pop() || '');
  const key = async k => { const n = files.length; await p.keyboard.press('Control+Shift+' + k); await p.waitForTimeout(1500); return files.length > n ? files[files.length - 1] : null; };

  let f = await key('E');
  check(!f && /Сначала/.test(await toast()), 'без основы «Только новое» не сохраняет и подсказывает');
  const full = await key('S');
  check(full && /^itd-snapshot-.*\d{6}\.html$/.test(full.name), `полный снимок: ${full && full.name}, ${full && Math.round(full.html.length / 1024)} КБ`);
  f = await key('E');
  if (f) console.log('—    лишнее: ' + f.html.slice(f.html.indexOf('<body')).slice(0, 600));
  check(!f && /нет/.test(await toast()), 'сразу после основы нового нет');

  await p.evaluate(() => {
    const host = [...document.body.querySelectorAll('div')].filter(d => d.children.length && !d.closest('.vp-fab')).pop();
    const m = document.createElement('div');
    m.className = 'vp-test-modal'; m.innerHTML = '<p>МОДАЛКА-1</p><input value="x">';
    host.appendChild(m);
    m.querySelector('input').value = 'введено';
    const st = document.createElement('style'); st.textContent = '.vp-test-modal{position:fixed;color:rgb(1,2,3)}'; document.head.appendChild(st);
  });
  f = await key('E');
  const info = f && JSON.parse(f.html.match(/id="vp-snapshot-info">([\s\S]*?)<\/script>/)[1]);
  console.log('—    ' + (f && `${f.name}, ${Math.round(f.html.length / 1024)} КБ, parts: ${JSON.stringify(info.parts)}`));
  if (f) console.log('—    ' + f.html.slice(f.html.indexOf('<body')).replace(/\s+/g, ' ').slice(0, 700));
  check(f && /^itd-new-/.test(f.name) && f.html.includes('МОДАЛКА-1') && f.html.includes('data-vp-new'), 'модалка сохранена отдельным файлом');
  check(f && f.html.includes('value="введено"'), 'значение поля в модалке сохранено');
  check(f && f.html.includes('rgb(1, 2, 3)') && f.html.length < full.html.length / 4, 'новые стили есть, старых нет (файл в разы меньше полного)');
  check(info && info.prev === full.name && info.kind === 'new' && info.parts.length === 1, 'в файле ссылка на прошлый снимок и одна новая часть');
  check(f && !f.html.includes('vp-admin-toast') && !f.html.includes('vp-fab'), 'всплывашки и кнопка админки не попали');
  const n2 = await p.evaluate(() => {
    const d = document.createElement('section'); d.textContent = 'МОДАЛКА-2'; document.body.appendChild(d);
  });
  const f2 = await key('E');
  check(f2 && f2.html.includes('МОДАЛКА-2') && !f2.html.includes('МОДАЛКА-1'), 'следующий — только от прошлого «нового», первая модалка не повторяется');
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
