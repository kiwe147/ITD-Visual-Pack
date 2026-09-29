// Сколько запросов к API делает мод сверх сайта: сайт сам берёт токен и «кто я» — мод должен
// подхватить их, каждый служебный пост (галочки, игры) прочитать один раз — и стиль (ITDXL1) публикуется без
// повторного чтения галочек, клуб собрать без запроса профиля на каждого.
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
// с 3.3.4 в клубе только подтверждённые: владелец подтверждает всех меткой ITDX-V (id — uuid, владелец — OWNER_ID)
const OWNER = '5e064703-104d-4794-bc28-9ed6f5847cca';
const uid = i => i ? `00000000-0000-4000-8000-${String(i).padStart(12, '0')}` : OWNER;
const comments = MEMBERS.map((u, i) => ({ id: 'c' + i, content: code(u), author: { id: uid(i), username: u, displayName: u + ' ник', avatar: '🦊' } }));
comments.push({ id: 'v', content: 'ITDX-V ' + MEMBERS.map((u, i) => uid(i)).join(' '), author: { id: OWNER, username: 'NeuroSFW' } });
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
    if (/\/api\/users\/me$/.test(u)) { count('me'); return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: '#NeuroSFW', id: OWNER }) }); }
    if (/\/comments\?limit=100/.test(u)) { const id = (u.match(/posts\/([0-9a-f-]{36})/) || [])[1] || '?'; count('служебный пост ' + ({ 'a0d6625a-b3ec-44c4-98da-48422af101d5': 'галочки', 'd5f8b7c0-b97d-40cd-bdd4-3c07b3ea0611': 'игры', 'a53b53e0-9950-4f62-83f4-91e5985ef6c5': 'личка' }[id] || id)); return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { comments } }) }); }
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
  const at6 = JSON.parse(JSON.stringify(hits));
  await p.waitForTimeout(6500);
  const prof = Object.keys(hits).filter(k => k.startsWith('профиль участника')).length;
  const dots = await p.$$eval('.vp-club-row[data-online]', r => r.length);
  await b.close();
  const onlineOk = prof > 0 && prof <= 16 && dots > 0;
  console.log((onlineOk ? 'ок: ' : 'ОШИБКА: ') + `«в сети» (3.3.12): опрос размазан: за первые 6,5 с спрошено ${prof} из ${club - 1} (по 4 раз в 2 с), точек ${dots}`);
  console.log('запросы (вместе с двумя сайта):', JSON.stringify(at6));
  console.log(`клуб: ${club} строк, ${names.join(' | ')}`);
  const ok = onlineOk && at6.refresh === 1 && at6.me === 1 && Object.keys(at6).filter(k => k.startsWith('служебный пост')).every(k => at6[k] === 1) && !Object.keys(at6).some(k => k.startsWith('профиль участника')) && (at6['свой профиль (статистика)'] || 0) <= 1 && (at6['свой профиль (статистика)'] || 0) <= 1 && club === MEMBERS.length;
  console.log(ok ? 'ок: мод не повторяет запросы сайта, клуб — без запросов профилей' : 'ОШИБКА: лишние запросы');
  process.exit(ok ? 0 : 1);
})();
