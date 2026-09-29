// Звонок-розыгрыш (3.3.13, только админка): затемнённый экран, карточка «Смерть в итдолизме», звонит Илья Новки, обе кнопки — «Принять».
// Запуск:  node test/call.js снимок-ленты.html
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
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ['--autoplay-policy=no-user-gesture-required'] });
  for (const [name, vp] of [['pc', { width: 1400, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    const p = await b.newPage({ viewport: vp, ...(name === 'phone' ? { isMobile: true, hasTouch: true } : {}) });
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
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
      window.__osc = 0;
      const AC = window.AudioContext;
      window.AudioContext = function () { const c = new AC(); const mk = c.createOscillator.bind(c); c.createOscillator = () => { window.__osc++; return mk(); }; return c; };
    }, src.slice(0, src.indexOf('==/UserScript==')));
    await p.goto(ORIGIN + '/');
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    const has = await p.$('.vp-fab [data-act="call"]');
    check(!!has, `${name}: в админке есть «Звонок-розыгрыш»`);
    if (!has) { await p.close(); continue; }
    await p.$eval('.vp-fab [data-act="call"]', x => x.click());
    await p.waitForTimeout(700);
    const st = await p.evaluate(() => {
      const el = document.querySelector('.vp-call'), card = el && el.querySelector('.vp-call-card'), r = card && card.getBoundingClientRect();
      const hit = r && document.elementFromPoint(8, 8);
      return el && { name: el.querySelector('.vp-call-name').textContent, sub: el.querySelector('.vp-call-sub').textContent,
        btns: [...el.querySelectorAll('.vp-call-btns button')].map(x => x.textContent.trim()), green: [...el.querySelectorAll('.vp-call-btns button')].every(x => getComputedStyle(x).backgroundColor === 'rgb(36, 128, 70)'), inWin: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight,
        cover: !!hit && el.contains(hit), osc: window.__osc };
    });
    console.log(`—    ${name}: ` + JSON.stringify(st));
    check(st && st.name === 'Смерть в итдолизме' && st.sub === 'Илья Новки звонит…' && st.btns.join('|') === 'Принять|Принять' && st.green, `${name}: карточка звонка, обе кнопки «Принять» и обе зелёные`);
    check(st && st.inWin && st.cover, `${name}: карточка целиком на экране, экран закрыт затемнением`);
    check(st && st.osc >= 4, `${name}: звонок звучит (генераторов звука: ${st && st.osc})`);
    await p.screenshot({ path: path.join(__dirname, 'out', `call-${name}.png`) });
    await p.click('.vp-call-no');
    await p.waitForTimeout(2000);
    const talk = await p.$eval('.vp-call-sub', e => e.textContent).catch(() => '');
    check(/^00:0\d$/.test(talk), `${name}: левая «Принять» тоже принимает — идёт разговор (${talk})`);
    await p.waitForTimeout(3000);
    const drop = await p.$eval('.vp-call-sub', e => e.textContent).catch(() => '');
    check(/сервер ИТД упал/.test(drop), `${name}: «${drop}»`);
    await p.waitForTimeout(2800);
    check(!(await p.$('.vp-call')), `${name}: окно само закрылось`);
    check(!errors.length, `${name}: ошибок нет` + (errors.length ? ': ' + errors.join(' | ') : ''));
    await p.close();
  }
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
