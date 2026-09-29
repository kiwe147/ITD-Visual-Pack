// Паки стикеров между устройствами одного аккаунта: два «устройства» (отдельные браузерные профили)
// и выдуманный сервер со служебными постами. Устройство A с паками выгружает их, пустое B — получает,
// правка на B доезжает до сервера. Под служебными постами — только новые комментарии и правка:
// ответов и удалений быть не должно (они шлют уведомления / владельцу так не нужно).
// Запуск:  node test/packsync.js снимок.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
let src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const STICKER_POST = '11111111-2222-4333-8444-555555555555';
src = src.replace(/const STICKER_POST_ID = '[^']*';/, `const STICKER_POST_ID = '${STICKER_POST}';`);
const VERIFY_POST = src.match(/VERIFICATION_POST_ID = '([^']+)'/)[1];
const info = (snap.match(/id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const URL0 = 'https://xn--d1ah4a.com' + (info ? new URL(JSON.parse(info).url).pathname : '/');
const ME = { id: '5e064703-104d-4794-bc28-9ed6f5847cca', username: 'NeuroSFW', displayName: '#NeuroSFW' };
const uuid = n => `${String(n).padStart(8, '0')}-aaaa-4bbb-8ccc-${String(n).padStart(12, '0')}`;
const PACKS = [
  { id: 'user_1', name: 'Коты 🐱', stickers: Array.from({ length: 60 }, (_, i) => ({ id: uuid(i + 1), url: `https://cdn.xn--d1ah4a.com/images/${uuid(1000 + i)}.png` })) },
  { id: 'user_2', name: 'Мемы', stickers: [{ id: uuid(7), url: `https://cdn.xn--d1ah4a.com/images/${uuid(77)}.webp` }, { id: 'x1', url: 'data:image/png;base64,AAAA' }] }
];

// сервер: комментарии двух постов, все запросы — в журнал
const server = { [VERIFY_POST]: [], [STICKER_POST]: [] }, log = [];
let seq = 0;
async function route(r) {
  const req = r.request(), u = new URL(req.url()), m = req.method();
  if (req.url() === URL0) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
  if (['image', 'stylesheet', 'font'].includes(req.resourceType())) return r.continue();
  const json = (b, status = 200) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(b) });
  if (u.pathname.includes('/auth/refresh')) return json({ accessToken: 't' });
  if (u.pathname === '/api/users/me') return json(ME);
  let mm = u.pathname.match(/^\/api\/posts\/([^/]+)\/comments$/);
  if (mm && server[mm[1]]) {
    const list = server[mm[1]];
    if (m === 'GET') {
      log.push('GET ' + (mm[1] === STICKER_POST ? 'посты паков' : 'галочки') + (u.searchParams.get('cursor') ? ' cursor' : ''));
      const from = +(u.searchParams.get('cursor') || 0), lim = +(u.searchParams.get('limit') || 20), page = list.slice(from, from + lim);
      const more = from + lim < list.length;
      return json({ data: { comments: page, total: list.length, hasMore: more, nextCursor: more ? String(from + lim) : null } });
    }
    if (m === 'POST') {
      const c = { id: 'c' + (++seq), content: JSON.parse(req.postData()).content, author: ME, replies: [] };
      list.push(c);
      log.push('POST ' + (mm[1] === STICKER_POST ? 'посты паков' : 'галочки'));
      return json({ data: c }, 201);
    }
  }
  mm = u.pathname.match(/^\/api\/comments\/([^/]+)(\/.*)?$/);
  if (mm) {
    log.push(m + ' /comments/…' + (mm[2] || ''));
    if (m === 'PATCH' && !mm[2]) {
      const c = [...server[VERIFY_POST], ...server[STICKER_POST]].find(c => c.id === mm[1]);
      if (!c) return json({ error: 'нет' }, 404);
      c.content = JSON.parse(req.postData()).content;
      return json({ data: c });
    }
    return json({ error: 'не ждали' }, 400);
  }
  return r.fulfill({ status: 404, body: '' });
}

async function device(browser, name, packs) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', route);
  const gm = {};
  await p.exposeFunction('__gmSet', (k, v) => { gm[k] = v; });
  await p.addInitScript(([m, packs]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    if (packs && !localStorage.getItem('user_sticker_packs_v1')) localStorage.setItem('user_sticker_packs_v1', JSON.stringify(packs));
  }, [src.slice(0, src.indexOf('==/UserScript==')), packs]);
  await p.goto(URL0);
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-itdx-btn, .sticker-btn, .sticker-panel').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  return { p, ctx, errors, name };
}
const packsOf = d => d.p.evaluate(() => JSON.parse(localStorage.getItem('user_sticker_packs_v1') || '[]'));
const same = (a, b) => JSON.stringify(a.map(p => [p.id, p.name, p.stickers.map(s => [s.id, s.url])])) === JSON.stringify(b.map(p => [p.id, p.name, p.stickers.map(s => [s.id, s.url])]));

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = [];
  const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
  // A: паки есть — выгружает
  const A = await device(b, 'A', PACKS);
  await A.p.waitForTimeout(9000);
  const parts = server[STICKER_POST].filter(c => /^ITDXS \d+\/\d+ /.test(c.content));
  const code = server[VERIFY_POST].map(c => c.content).filter(x => !/^ITDXL1 /.test(x));
  const looks = server[VERIFY_POST].filter(c => /^ITDXL1 /.test(c.content));
  check(parts.length >= 2, `A выгрузил паки: кусков ${parts.length}, длины ${parts.map(c => c.content.length).join(',')}`);
  check(parts.every(c => c.content.length <= 2000), 'каждый кусок ≤ 2000 знаков');
  check(code.length === 1 && /^[A-Za-z0-9]{8}1\d{9,}$/.test(code[0]), `код галочки со временем паков: ${code.join(' | ')}`);
  check(looks.length <= 1, `строка стиля (3.3.10) — не больше одной: ${looks.length}`);
  // B: пусто — получает
  const B = await device(b, 'B', null);
  await B.p.waitForTimeout(9000);
  const got = await packsOf(B);
  check(same(got, PACKS), `B получил паки (${got.length} паков, стикеров ${got.map(p => p.stickers.length).join('+')})`);
  // правка на B → на сервер
  const before = server[VERIFY_POST][0].content;
  await B.p.evaluate(() => {
    const packs = JSON.parse(localStorage.getItem('user_sticker_packs_v1'));
    packs[1].name = 'Мемы 2'; packs[1].stickers.pop();
    localStorage.setItem('user_sticker_packs_v1', JSON.stringify(packs));
  });
  // правка через саму панель недоступна без поста — вызываем выгрузку, как после сохранения пака
  await B.p.reload();
  await B.p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-itdx-btn').forEach(e => e.remove()));
  await B.p.evaluate(() => localStorage.setItem('user_sticker_packs_at', String(Date.now() + 5000)));
  await B.p.addScriptTag({ content: src });
  await B.p.waitForTimeout(9000);
  check(server[VERIFY_POST][0].content !== before, 'время паков в коде галочки обновилось правкой');
  // A снова заходит — получает правку
  await A.p.reload();
  await A.p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-itdx-btn').forEach(e => e.remove()));
  await A.p.addScriptTag({ content: src });
  await A.p.waitForTimeout(9000);
  const a2 = await packsOf(A);
  check(a2[1] && a2[1].name === 'Мемы 2' && a2[1].stickers.length === 1, `A получил правку с B (${a2[1] && a2[1].name}, ${a2[1] && a2[1].stickers.length} стикер)`);
  const bad = log.filter(l => /replies|DELETE/.test(l));
  check(!bad.length, 'ни ответов, ни удалений' + (bad.length ? ': ' + bad.join(', ') : ''));
  const posts = log.filter(l => l.startsWith('POST'));
  console.log('—    запросы: ' + [...new Set(log)].map(l => `${l} ×${log.filter(x => x === l).length}`).join(' | '));
  check(posts.length === 2 + parts.length, `новых комментариев: ${posts.length} (галочка + строка стиля + куски паков), дальше только правка`);
  const errs = [...A.errors, ...B.errors];
  check(!errs.length, 'ошибок нет' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
