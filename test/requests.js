// Сколько запросов к API делает мод сверх сайта: сайт сам берёт токен и «кто я» — мод должен
// подхватить их, служебный пост прочитать один раз, клуб собрать без запроса профиля на каждого.
// Запуск:  node test/requests.js снимок.html [файл скрипта]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.argv[3] || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const info = (snap.match(/id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const URL0 = 'https://xn--d1ah4a.com' + (info ? new URL(JSON.parse(info).url).pathname : '/');
// коды участников — той же формулой, что в скрипте
const salt = src.match(/SECRET_SALT\s*=\s*['"]([^'"]+)['"]/)[1];
const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; } return Math.abs(h).toString(36); };
const code = u => hash(u + salt).substring(0, 8).padEnd(8, '0') + '1';
const MEMBERS = ['NeuroSFW', ...Array.from({ length: 30 }, (_, i) => 'member' + i)];
const comments = MEMBERS.map((u, i) => ({ id: 'c' + i, content: code(u), author: { id: 'u' + i, username: u, displayName: u + ' ник', avatar: '🦊' } }));
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  const hits = {};
  const count = k => { hits[k] = (hits[k] || 0) + 1; };
  p.on('pageerror', e => console.log('ошибка: ' + e.message));
  await p.route('**/*', r => {
    const u = r.request().url(), t = r.request().resourceType();
    if (u === URL0) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.includes('/auth/refresh')) { count('refresh'); return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' }); }
    if (/\/api\/users\/me$/.test(u)) { count('me'); return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","displayName":"#NeuroSFW"}' }); }
    if (/\/comments\?limit=100/.test(u)) { count('служебный пост'); return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { comments } }) }); }
    if (/\/api\/users\/[\w.]+$/.test(u)) { count(/\/NeuroSFW$/.test(u) ? 'свой профиль (статистика)' : 'профиль участника: ' + u.split('/').pop()); return r.fulfill({ contentType: 'application/json', body: '{"username":"x"}' }); }
    if (u.includes('/api/')) count('прочее API: ' + new URL(u).pathname);
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(URL0);
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-itdx-btn').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  // сайт при загрузке сам берёт токен и спрашивает «кто я»
  await p.evaluate(async () => {
    await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' });
    await fetch('/api/users/me', { credentials: 'include' });
  });
  await p.waitForTimeout(6000);
  const club = await p.$$eval('.vp-club-row', rows => rows.length);
  const names = await p.$$eval('.vp-club-name', els => els.slice(0, 3).map(e => e.textContent));
  await b.close();
  console.log('запросы (вместе с двумя сайта):', JSON.stringify(hits));
  console.log(`клуб: ${club} строк, ${names.join(' | ')}`);
  const ok = hits.refresh === 1 && hits.me === 1 && hits['служебный пост'] === 1 && !Object.keys(hits).some(k => k.startsWith('профиль участника')) && (hits['свой профиль (статистика)'] || 0) <= 1 && (hits['свой профиль (статистика)'] || 0) <= 1 && club === MEMBERS.length;
  console.log(ok ? 'ок: мод не повторяет запросы сайта, клуб — без запросов профилей' : 'ОШИБКА: лишние запросы');
  process.exit(ok ? 0 : 1);
})();
