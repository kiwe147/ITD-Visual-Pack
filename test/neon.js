// Неоновая подсветка (3.4.0): одна галка в «Ник» гасит всё свечение мода — свой ник и аватарку, рамку постов, значок
// навигации и вкладки, ники и аватарки других пользователей мода. Цвет/градиент ника остаётся.
// Запуск:  node test/neon.js снимок-своего-профиля.html
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
  const run = async neon => {
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
    await p.addInitScript(([m, neon]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, nickStyle: 'rainbow', neonEnabled: neon };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, [src.slice(0, src.indexOf('==/UserScript==')), neon]);
    await p.goto(url);
    await p.evaluate(() => document.querySelectorAll('style').forEach(s => {
      const t = s.textContent.replace(/[^{}]*(\.vp-my-nick|\.my-avatar-glow|\.vp-nav-icon|data-vp-look|vp-post-hl)[^{}]*\{[^{}]*\}/g, '');
      if (t !== s.textContent) s.textContent = t;
    }));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    const st = await p.evaluate(() => {
      const probe = document.createElement('div');
      probe.innerHTML = '<span data-vp-look-glow="neon"><span data-vp-look="neon">чужой</span></span><div data-vp-look-av="neon"></div>';
      document.body.appendChild(probe);
      const f = sel => { const e = document.querySelector(sel); return e ? getComputedStyle(e).filter : 'нет'; };
      const ts = sel => { const e = document.querySelector(sel); return e ? getComputedStyle(e).textShadow : 'нет'; };
      return {
        nickBox: f('.vp-my-nick-box'), nickShadow: ts('.vp-my-nick'), avatar: f('.my-avatar-glow'), nav: f('.vp-nav-link.vp-active .vp-nav-icon'),
        otherGlow: f('[data-vp-look-glow]'), otherAv: f('[data-vp-look-av]'), postHl: document.documentElement.classList.contains('vp-post-hl'),
        nickColor: (() => { const e = document.querySelector('.vp-my-nick'); return e ? getComputedStyle(e).color : 'нет'; })()
      };
    });
    await p.evaluate(() => { const e = document.querySelector('.vp-my-nick'); if (e) e.scrollIntoView({ block: 'center' }); });
    await p.screenshot({ path: path.join(__dirname, 'out', `neon-${neon ? 'on' : 'off'}.png`), clip: { x: 0, y: 0, width: 1400, height: 900 } });
    const errs = p.errors;
    await p.close();
    return { st, errs };
  };
  const on = await run(true), off = await run(false);
  console.log('—    вкл:  ' + JSON.stringify(on.st));
  console.log('—    выкл: ' + JSON.stringify(off.st));
  const glows = x => /drop-shadow/.test(x);
  check(glows(on.st.otherGlow) && glows(on.st.otherAv), 'включено: у чужих ника и аватарки свечение есть');
  check(on.st.postHl, 'включено: рамка постов есть');
  check(on.st.nickBox === 'нет' || glows(on.st.nickBox), `включено: свой ник светится (${on.st.nickBox})`);
  check(!glows(off.st.otherGlow) && !glows(off.st.otherAv), 'выключено: у чужих ника и аватарки свечения нет');
  check(!off.st.postHl, 'выключено: рамки постов нет');
  check(!glows(off.st.nickBox) && !glows(off.st.avatar) && !glows(off.st.nav), `выключено: свой ник, аватарка и значок навигации без свечения (${off.st.nickBox} / ${off.st.avatar} / ${off.st.nav})`);
  check(off.st.nickShadow === 'none' || off.st.nickShadow === 'нет', `выключено: у радужного ника нет тени-свечения (${off.st.nickShadow})`);
  check(off.st.nickColor === 'нет' || off.st.nickColor === on.st.nickColor || /hsl|rgb/.test(off.st.nickColor), 'цвет ника остаётся');
  check(!on.errs.length && !off.errs.length, 'ошибок нет' + (on.errs.length + off.errs.length ? ': ' + [...on.errs, ...off.errs].join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
