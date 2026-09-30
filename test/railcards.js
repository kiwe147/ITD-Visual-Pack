// Карточки правой панели (3.4.0): Статистика, Клуб ИТД X, Игры можно менять местами — перетаскиванием за заголовок на самой
// панели или стрелками в «ИТД X → Вид → Карточки панели», там же прятать и возвращать (игры убираются так же). Порядок
// и скрытые карточки сохраняются. Все спрятаны — панели нет.
// Запуск:  node test/railcards.js снимок-своего-профиля.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const url = (snap.match(/"url": "([^"]+)"/) || [, ORIGIN + '/'])[1];
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const store = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
  const open = async () => {
    const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
    p.errors = [];
    p.on('pageerror', e => p.errors.push(e.message));
    await p.route('**/*', r => {
      const u = new URL(r.request().url()), t = r.request().resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: '#NeuroSFW | ИТД X', id: OWNER }) });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.exposeFunction('__save', (k, v) => { store[k] = v; });
    await p.addInitScript(([m, s]) => {
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; window.__save(k, v); };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, [src.slice(0, src.indexOf('==/UserScript==')), store]);
    await p.goto(url);
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-nav-blob, .vp-fab, .settings-dropdown, .vp-itdx-btn, .vp-msgs').forEach(e => e.remove()) || document.querySelectorAll('.vp-nuksta-hidden').forEach(e => e.classList.remove('vp-nuksta-hidden')));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    return p;
  };
  const order = p => p.$$eval('.vp-rail > .vp-rail-card', cs => cs.map(c => c.dataset.block + (c.hidden ? '-' : '')).join(','));
  let p = await open();
  check(await order(p) === 'stats,club,games', `сначала: статистика, клуб, игры (${await order(p)})`);
  const t = await (await p.$('.vp-rail-card[data-block="stats"] .vp-rail-title')).boundingBox();
  const g = await (await p.$('.vp-rail-card[data-block="games"]')).boundingBox();
  await p.mouse.move(t.x + 60, t.y + t.height / 2);
  await p.mouse.down();
  for (let i = 1; i <= 20; i++) await p.mouse.move(t.x + 60, t.y + t.height / 2 + (g.y + g.height / 2 - t.y - t.height / 2) * i / 20);
  await p.screenshot({ path: path.join(__dirname, 'out', 'railcards-drag.png'), clip: { x: 1100, y: 0, width: 300, height: 900 } });
  await p.mouse.up();
  await p.waitForTimeout(300);
  check(await order(p) === 'club,games,stats', `перетащил статистику вниз — она последняя (${await order(p)})`);
  check(await p.evaluate(() => !document.querySelector('.vp-rail-drag') && !document.querySelector('.vp-rail-card[style*="transform"]')), 'после отпускания карточка на месте, без сдвига');
  await p.click('.vp-itdx-btn');
  await p.waitForTimeout(300);
  await p.$eval('.vp-stab[data-tab="look"]', x => x.click());
  await p.waitForTimeout(200);
  const rows = () => p.$$eval('.vp-rcard', rs => rs.map(r => r.dataset.card + (r.querySelector('.toggle-switch.active') ? '' : '-')).join(','));
  check(await rows() === 'club,games,stats', `в настройках тот же порядок (${await rows()})`);
  await p.$eval('.vp-rcard[data-card="games"] .toggle-switch', x => x.click());
  await p.waitForTimeout(200);
  check(await order(p) === 'club,games-,stats', `выключил «Игры» — карточка игр спрятана (${await order(p)})`);
  await p.$eval('.vp-rcard[data-card="stats"] [data-d="-1"]', x => x.click());
  await p.waitForTimeout(200);
  check(await rows() === 'club,stats,games-', `стрелка «выше» у статистики (${await rows()})`);
  await (await p.$('.vp-settings-tabs')).screenshot({ path: path.join(__dirname, 'out', 'railcards-settings.png') });
  const errs1 = p.errors;
  await p.close();
  p = await open();
  check(await order(p) === 'club,stats,games-', `после перезагрузки порядок и скрытые сохранились (${await order(p)})`);
  await p.click('.vp-itdx-btn');
  await p.waitForTimeout(300);
  await p.$eval('.vp-stab[data-tab="look"]', x => x.click());
  await p.waitForTimeout(200);
  for (const id of ['club', 'stats']) { await p.$eval(`.vp-rcard[data-card="${id}"] .toggle-switch`, x => x.click()); await p.waitForTimeout(150); }
  check(await p.evaluate(() => !document.querySelector('.vp-rail').classList.contains('vp-on')), 'все карточки спрятаны — панели нет');
  for (const id of ['club', 'stats', 'games']) { await p.$eval(`.vp-rcard[data-card="${id}"] .toggle-switch`, x => x.click()); await p.waitForTimeout(150); }
  check(await p.evaluate(() => document.querySelector('.vp-rail').classList.contains('vp-on')) && await order(p) === 'club,stats,games', `вернул все — панель снова есть (${await order(p)})`);
  check(!errs1.length && !p.errors.length, 'ошибок нет' + (errs1.length + p.errors.length ? ': ' + [...errs1, ...p.errors].join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
