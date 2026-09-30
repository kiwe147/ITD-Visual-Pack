// Проверка обновлений на открытом сайте (3.4.4.2): при загрузке — как раньше; дальше, пока вкладка открыта, раз в 10 минут мод
// спрашивает GitHub. Вышла новая версия — кнопка «Обновить» у логотипа, и больше не спрашивает. В скрытой вкладке не спрашивает.
// Часы страницы проматываются (page.clock).
// Запуск:  node test/updpoll.js снимок-своего-профиля.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const VER = src.match(/@version\s+(\S+)/)[1];
const NEXT = VER.replace(/\d+$/, d => +d + 1);
const ORIGIN = 'https://xn--d1ah4a.com';
const url = (snap.match(/"url": "([^"]+)"/) || [, ORIGIN + '/'])[1];
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: OWNER }) });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.clock.install();
  await p.addInitScript(([m, ver]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.__gh = { ver, asks: 0 };
    window.GM_xmlhttpRequest = o => {
      if (/raw\.githubusercontent/.test(o.url)) { window.__gh.asks++; setTimeout(() => o.onload({ status: 206, responseText: `// ==UserScript==\n// @version      ${window.__gh.ver}\n` }), 10); return; }
      setTimeout(() => o.onerror && o.onerror('x'), 0);
    };
    window.GM_info = { script: { version: ver }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, [src.slice(0, src.indexOf('==/UserScript==')), VER]);
  await p.goto(url);
  await p.evaluate(() => document.querySelectorAll('.itd-update-sidebar-btn').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.clock.runFor(3000);
  const gh = () => p.evaluate(() => ({ asks: window.__gh.asks, btn: !!document.querySelector('.itd-update-sidebar-btn') }));
  let s = await gh();
  check(s.asks === 1 && !s.btn, `при загрузке один вопрос к GitHub, новой версии нет — кнопки нет (${JSON.stringify(s)})`);
  await p.clock.runFor(5 * 60e3);
  s = await gh();
  check(s.asks === 1, `через 5 минут ещё не спрашивал (${s.asks})`);
  await p.clock.runFor(6 * 60e3);
  s = await gh();
  check(s.asks === 2 && !s.btn, `через 10 минут спросил снова, всё ещё нет новой (${JSON.stringify(s)})`);
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); });
  await p.clock.runFor(11 * 60e3);
  s = await gh();
  check(s.asks === 2, `вкладка скрыта — 11 минут не спрашивал (${s.asks})`);
  await p.evaluate(v => { window.__gh.ver = v; Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); }, NEXT);
  await p.clock.runFor(2000);
  s = await gh();
  check(s.asks === 3 && s.btn, `вернулся во вкладку — сразу спросил, вышла ${NEXT} — кнопка «Обновить» (${JSON.stringify(s)})`);
  await p.clock.runFor(11 * 60e3);
  s = await gh();
  check(s.asks === 3, `после кнопки больше не спрашивает (11 минут спустя вопросов ${s.asks})`);
  const box = await p.evaluate(() => { const r = document.querySelector('.itd-update-sidebar-btn').closest('div').parentElement.getBoundingClientRect(); return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: r.width + 160, height: r.height + 20 }; });
  await p.screenshot({ path: path.join(__dirname, 'out', 'updpoll.png'), clip: box });
  check(!p.errors.length, 'ошибок нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
