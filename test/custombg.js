// Свой фон: «ИТД X» → «Фон» → «Своя картинка» → файл; картинка/видео встаёт вместо холста фона,
// переживает перезагрузку (IndexedDB), видео играет без звука по кругу, «Сменить…» меняет файл.
// Запуск:  node test/custombg.js снимок-своего-профиля.html   (файлы — test/out/bg-test.png и bg-test.mp4)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const info = (snap.match(/id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const URL0 = 'https://xn--d1ah4a.com' + (info ? new URL(JSON.parse(info).url).pathname : '/');
const out = path.join(__dirname, 'out');
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext(process.argv[3] === 'desktop' ? { viewport: { width: 1280, height: 860 } } : { viewport: { width: 392, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = r.request().url(), t = r.request().resourceType();
    if (u === URL0) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.endsWith('/api/users/me')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: ((snap.match(/vp-nick-large[\s\S]*?vp-nick-text[^>]*>([^<]+)</) || [])[1] || '#NeuroSFW | ИТД X').trim(), id: 'u1' }) });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    let s = {};
    try { s = JSON.parse(sessionStorage.getItem('gm') || '{}'); } catch (e) { }
    s = Object.assign({ introEnabled: false, introMobile: 'off', backgroundEnabled: true }, s);
    window.GM_getValue = (k, d) => k in s ? s[k] : d;
    window.GM_setValue = (k, v) => { s[k] = v; sessionStorage.setItem('gm', JSON.stringify(s)); };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  const load = async () => {
    await p.goto(URL0);
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-itdx-btn, .vp-bg-canvas, .vp-bg-media, .settings-dropdown').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(4000);
    await p.evaluate(() => document.body.appendChild(document.createElement('i')));
    await p.waitForTimeout(500);
  };
  const state = () => p.evaluate(() => {
    const m = document.querySelector('.vp-bg-media'), c = document.querySelector('.vp-bg-canvas');
    const media = m && m.firstElementChild;
    return { media: media ? media.tagName : '', shown: !!m && getComputedStyle(m).display !== 'none', canvas: !!c && getComputedStyle(c).display !== 'none',
      playing: media && media.tagName === 'VIDEO' ? !media.paused && media.muted && media.loop : null };
  });
  const openBg = async () => {
    const opener = await p.$('.vp-itdx-btn') || await p.$('.settings-toggle');
    await opener.evaluate(b => { b.scrollIntoView({ block: 'center' }); b.click(); });
    await p.waitForTimeout(300);
    await p.$eval('.vp-stab[data-tab="bg"]', b => b.click());
    await p.waitForTimeout(300);
  };
  await load();
  console.log('—    после загрузки: кнопка ИТД X ' + !!(await p.$('.vp-itdx-btn')) + ', ошибки: ' + (errors.join(' | ') || 'нет') + ' | ' + await p.evaluate(() => [!!document.querySelector('.settings-toggle'), [...document.querySelectorAll('button')].filter(b => /Редакт|ИТД X/.test(b.textContent)).map(b => b.className + ':' + b.textContent.trim()).join(', '), location.pathname].join(' ; ')));
  await openBg();
  const [ch1] = await Promise.all([p.waitForEvent('filechooser'), p.$$eval('.nick-style-option', rows => rows.find(r => r.textContent.includes('Своя картинка')).click())]);
  await ch1.setFiles(path.join(out, 'bg-test.png'));
  await p.waitForTimeout(800);
  let st = await state();
  check(st.media === 'IMG' && st.shown && !st.canvas, `картинка вместо холста (${JSON.stringify(st)})`);
  await p.keyboard.press('Escape'); await p.mouse.click(5, 5);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, 'custombg-img.png') });
  await load();
  st = await state();
  check(st.media === 'IMG' && st.shown, `после перезагрузки картинка на месте (${JSON.stringify(st)})`);
  await openBg();
  const [ch2] = await Promise.all([p.waitForEvent('filechooser'), p.$$eval('.nick-style-option', rows => rows.find(r => r.textContent.includes('Сменить картинку')).click())]);
  await ch2.setFiles(path.join(out, 'bg-test.mp4'));
  await p.waitForTimeout(1500);
  st = await state();
  check(st.media === 'VIDEO' && st.playing, `видео: играет, без звука, по кругу (${JSON.stringify(st)})`);
  await p.$$eval('.nick-style-option', rows => rows.find(r => r.textContent.trim().startsWith('Матрица')).click());
  await p.waitForTimeout(300);
  st = await state();
  check(!st.shown && st.canvas, `обычный фон вернулся (${JSON.stringify(st)})`);
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
