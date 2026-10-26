// Настройки мода — модалка: открытие кнопкой «ИТД X», разделы слева, поиск, закрытие крестиком, фоном, Esc и кнопкой «назад»; переключатель меняет значение; на телефоне во весь экран.
// Запуск:  node test/settingsmodal.js снимок-своего-профиля.html [снимок-телефона-своего-профиля.html]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const OUT = process.env.OUT || 'C:/Code/Kwork/build/';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
(async () => {
  const b = await chromium.launch();
  for (const [file, phone] of [[process.argv[2], false], [process.argv[3], true]]) {
    if (!file) continue;
    const snap = fs.readFileSync(file, 'utf8');
    console.log('\n== ' + (phone ? 'телефон' : 'компьютер'));
    const ctx = await b.newContext(phone ? { viewport: { width: 412, height: 860 }, isMobile: true, hasTouch: true } : { viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.route('**/*', r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: '#NeuroSFW | ИТД X', id: OWNER }) });
      if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      try { const st = JSON.parse(localStorage.getItem('__gm') || 'null'); if (st) Object.assign(s, st); } catch (e) { }
      window.GM_getValue = (k, d) => k in s ? s[k] : d;
      window.GM_setValue = (k, v) => { s[k] = v; try { localStorage.setItem('__gm', JSON.stringify(s)); } catch (e) { } };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, [src.slice(0, src.indexOf('==/UserScript=='))]);
    await p.goto(ORIGIN + new URL(snap.match(/"url": "([^"]+)"/)[1]).pathname, { waitUntil: 'domcontentloaded' });
    await p.evaluate(() => { document.querySelectorAll('.vp-rail, .vp-nav-blob, .vp-fab, .settings-dropdown, .vp-itdx-btn, .vp-msgs, .vp-pals, .nick-controls-panel').forEach(e => e.remove()); document.querySelectorAll('.vp-nuksta-hidden').forEach(e => e.classList.remove('vp-nuksta-hidden')); document.querySelectorAll('style').forEach(e => { if (/\.vp-settings-tabs|\.vp-stab/.test(e.textContent)) e.remove(); }); });
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(3500);
    const stored = k => p.evaluate(k => { const st = JSON.parse(localStorage.getItem('__gm') || '{}'), key = Object.keys(st).find(x => x === k || x.startsWith(k + '@')); return key === undefined ? undefined : st[key]; }, k);
    const isOpen = () => p.evaluate(() => { const e = document.querySelector('.vp-sm'); return !!e && !e.classList.contains('vp-sm-out'); });
    const btn = await p.$('.vp-itdx-btn');
    check(!!btn, 'кнопка «ИТД X» на месте');
    if (!btn) { await ctx.close(); continue; }
    await p.evaluate(() => document.querySelector('.vp-itdx-btn').scrollIntoView({ block: 'center' }));
    await p.evaluate(() => document.querySelector('.vp-itdx-btn').click());
    await p.waitForTimeout(500);
    check(await isOpen(), 'нажатие открывает модальное окно настроек');
    const geo = await p.evaluate(() => { const r = document.querySelector('.vp-sm-box').getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: innerWidth, h: innerHeight }; });
    check(geo.l >= 0 && geo.t >= 0 && geo.r <= geo.w && geo.b <= geo.h, 'окно целиком на экране: ' + JSON.stringify(geo));
    check(phone ? geo.r - geo.l >= geo.w - 1 : geo.r - geo.l > 600, phone ? 'на телефоне окно во всю ширину' : 'на компьютере окно широкое (' + Math.round(geo.r - geo.l) + 'px)');
    const tabs = await p.$$eval('.vp-sm .vp-stab', t => t.map(x => x.dataset.tab + ':' + x.textContent.trim()));
    check(tabs.length === 7, 'семь разделов: ' + tabs.join(', '));
    await p.screenshot({ path: OUT + 'sm-' + (phone ? 'phone' : 'pc') + '-nick.png' });
    await p.click('.vp-sm .vp-stab[data-tab="look"]'); await p.waitForTimeout(250);
    const rows = await p.$$eval('.vp-tab-body .settings-option', r => r.map(x => x.textContent.trim()));
    check(rows.includes('Карточка профиля при наведении') && rows.includes('Стекло'), 'раздел «Вид»: ' + rows.join(' | '));
    check(await p.evaluate(() => { const l = document.querySelector('.vp-tab-body .vp-setting-label > span[data-hint]'); return !!l && getComputedStyle(l, '::after').content.length > 3; }), 'у переключателей видны пояснения');
    await p.screenshot({ path: OUT + 'sm-' + (phone ? 'phone' : 'pc') + '-look.png' });
    const before = await stored('hoverCard');
    await p.evaluate(() => [...document.querySelectorAll('.vp-tab-body .settings-option')].find(r => /Карточка профиля/.test(r.textContent)).click());
    await p.waitForTimeout(200);
    check((await stored('hoverCard')) === (before === undefined ? false : !before), 'переключатель меняет сохранённое значение');
    await p.fill('.vp-sm-search input', 'свеч'); await p.waitForTimeout(300);
    const found = await p.$$eval('.vp-tab-body .settings-option, .vp-tab-body .vp-sec-title', r => r.map(x => x.textContent.trim()));
    check(found.some(t => /Подсветка ника/.test(t)) && found.some(t => /Свечение видео/.test(t)) && !found.some(t => /^Стекло/.test(t)), 'поиск «свеч» находит свечение и подсветку, но не стекло: ' + found.join(' | '));
    await p.screenshot({ path: OUT + 'sm-' + (phone ? 'phone' : 'pc') + '-search.png' });
    await p.fill('.vp-sm-search input', 'яяяя'); await p.waitForTimeout(250);
    check(await p.evaluate(() => /Ничего не найдено/.test(document.querySelector('.vp-tab-body').textContent)), 'пустой поиск пишет «Ничего не найдено»');
    await p.fill('.vp-sm-search input', ''); await p.waitForTimeout(250);
    check(await p.evaluate(() => document.querySelector('.vp-stab.vp-active') && document.querySelector('.vp-stab.vp-active').dataset.tab === 'look'), 'очистка поиска возвращает раздел');
    for (const tab of ['bg', 'likes', 'pals', 'misc', 'icon']) {
      await p.click('.vp-sm .vp-stab[data-tab="' + tab + '"]'); await p.waitForTimeout(250);
      const ok = await p.evaluate(() => document.querySelector('.vp-tab-body').children.length > 0);
      check(ok, 'раздел «' + tab + '» открывается и не пустой');
      if (tab === 'pals') await p.screenshot({ path: OUT + 'sm-' + (phone ? 'phone' : 'pc') + '-pals.png' });
    }
    await p.click('.vp-sm-x'); await p.waitForTimeout(300);
    check(!(await p.$('.vp-sm')), 'крестик закрывает окно');
    await p.evaluate(() => document.querySelector('.vp-itdx-btn').click()); await p.waitForTimeout(300);
    check(await isOpen() && (await stored('settingsTab')) === 'icon', 'окно открывается снова на последнем разделе');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    check(!(await p.$('.vp-sm')), 'Esc закрывает окно');
    await p.evaluate(() => document.querySelector('.vp-itdx-btn').click()); await p.waitForTimeout(300);
    await p.mouse.click(phone ? 5 : 5, 5); await p.waitForTimeout(300);
    check(phone ? await isOpen() : !(await p.$('.vp-sm')), phone ? 'на телефоне окно на весь экран (фона для клика нет)' : 'клик по затемнению закрывает окно');
    if (await isOpen()) { await p.goBack().catch(() => { }); await p.waitForTimeout(400); check(!(await p.$('.vp-sm')), 'кнопка «назад» закрывает окно'); }
    else { await p.evaluate(() => document.querySelector('.vp-itdx-btn').click()); await p.waitForTimeout(300); await p.goBack().catch(() => { }); await p.waitForTimeout(400); check(!(await p.$('.vp-sm')), 'кнопка «назад» закрывает окно'); }
    check(!errors.length, 'ошибок страницы нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
    await ctx.close();
  }
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
