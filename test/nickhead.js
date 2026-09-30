// Большой ник в профиле, разметка сайта с 30.09 (3.3.14.1): голова ника в своей обёртке, хвост — рядом с обёрткой.
// Ник из одного слова (голова пустая) и из нескольких: ник целиком в голове, галочка ИТД X — после ника, хвост скрыт.
// Запуск:  node test/nickhead.js снимок-профиля-potato151.html
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
  for (const [name, head, tail] of [['одно слово', '', null], ['несколько слов', 'Ник из нескольких ', 'слов']]) {
    const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
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
      try { localStorage.setItem('itd_verified_users', JSON.stringify({ potato151: { state: 'approved', id: '46e9efb3-a219-451e-85f8-89a89788774a' } })); } catch (e) { }
    }, src.slice(0, src.indexOf('==/UserScript==')));
    await p.goto(url);
    const ok = await p.evaluate(([head, tail]) => {
      const texts = [...document.querySelectorAll('.vp-nick-large .vp-nick-text')];
      if (texts.length < 2) return false;
      texts.forEach(t => { t.classList.remove('vp-nick-tail-moved'); delete t.dataset.vpTail; });
      texts[0].textContent = head;
      if (tail !== null) texts[1].textContent = tail;
      document.querySelectorAll('.vp-nick-large .mod-badge-verify').forEach(x => x.remove());
      return true;
    }, [head, tail]);
    check(ok, `${name}: в снимке ник разбит на голову и хвост`);
    if (!ok) { await p.close(); continue; }
    const whole = head + (tail === null ? await p.evaluate(() => document.querySelectorAll('.vp-nick-large .vp-nick-text')[1].textContent) : tail);
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    const st = await p.evaluate(() => {
      const [h, t] = document.querySelectorAll('.vp-nick-large .vp-nick-text');
      const badge = document.querySelector('.vp-nick-large .mod-badge-verify');
      const hr = h.getBoundingClientRect(), br = badge && badge.getBoundingClientRect();
      return { head: h.textContent, tailHidden: getComputedStyle(t).display === 'none', badge: !!badge, after: !!br && br.left >= hr.right - 1, sameLine: !!br && Math.abs((br.top + br.bottom) / 2 - (hr.top + hr.bottom) / 2) < 8 };
    });
    console.log(`—    ${name}: ${JSON.stringify(st)}`);
    check(st.head === whole && st.tailHidden, `${name}: ник целиком в одном месте («${st.head}»), хвост скрыт`);
    check(st.badge && st.after && st.sameLine, `${name}: галочка после ника на той же строке`);
    const box = await p.$('.vp-nick-large');
    if (box) await (await box.evaluateHandle(e => e.closest('.vp-nick-row') || e)).asElement().screenshot({ path: path.join(__dirname, 'out', `nickhead-${tail === null ? 1 : 2}.png`) });
    check(!errors.length, `${name}: ошибок нет` + (errors.length ? ': ' + errors.join(' | ') : ''));
    await p.close();
  }
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
