// Автолайки: через 5 минут после входа лайкнуты свежие нелайкнутые посты отмеченного
// пользователя — и только они (старше суток и уже лайкнутые — нет).
// Запуск:  node test/autolike.js путь/к/снимку.html   (часы страницы проматываются, ждать не нужно)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.argv[3] || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const info = (snap.match(/<script type="application\/json" id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const URL0 = 'https://xn--d1ah4a.com' + (info ? new URL(JSON.parse(info).url).pathname : '/');

(async () => {
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errors = [], likes = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.clock.install();
  const now = Date.now();
  const posts = [
    { id: 'fresh', isLiked: false, createdAt: new Date(now - 3600e3).toISOString() },
    { id: 'liked', isLiked: true, createdAt: new Date(now - 3600e3).toISOString() },
    { id: 'old', isLiked: false, createdAt: new Date(now - 2 * 86400e3).toISOString() }
  ];
  await p.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.endsWith('/api/users/me')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: 'NeuroSFW' }) });
    if (u.includes('/api/posts/user/tester')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts } }) });
    const m = u.match(/\/api\/posts\/([^/]+)\/like$/);
    if (m && r.request().method() === 'POST') { likes.push(m[1]); return r.fulfill({ contentType: 'application/json', body: '{}' }); }
    if (u === URL0) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, itd_auto_like_users: '{"tester":true}' };
    window.GM_getValue = (k, d) => k in s ? s[k] : d;
    window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('offline'), 0);
    window.GM_info = { script: { version: 'test' }, scriptMetaStr: m };
    window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(URL0);
  await p.addScriptTag({ content: src });
  // ответы заглушек идут в настоящем времени, таймеры скрипта — в часах страницы: после каждой
  // промотки даём запросам дойти и докручиваем паузы между лайками (300 мс)
  const settle = async () => { for (let i = 0; i < 4; i++) { await p.waitForTimeout(400); await p.clock.runFor(500); } };
  await settle();                                        // вход: /api/users/me → расписание
  await p.clock.fastForward(5 * 60 * 1000 + 1000);       // первый проход — не позже чем через 5 минут
  await settle();
  const first = likes.join();
  await p.clock.fastForward(5 * 60 * 1000 + 3000);       // и дальше по расписанию
  await settle();
  const second = likes.join();
  await browser.close();
  const ok = first === 'fresh' && second === 'fresh,fresh' && !errors.length;
  console.log((ok ? 'ок   ' : 'ОШИБКА ') + `автолайк: первый проход [${first}], после второго [${second}]` + (errors.length ? ' | ошибки: ' + errors.join(' | ') : ''));
  process.exit(ok ? 0 : 1);
})();
