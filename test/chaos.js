// Живучесть к выкладкам сайта: снимок очищается от мода, затем (1) как есть, (2) все классы сайта переименованы,
// (3) переименованы + лишние обёртки в разметке. Сравнивается, сколько элементов мод узнал и поставил своего.
// Запуск:  node test/chaos.js снимок1.html [снимок2.html ...]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';
const ROLES = ['vp-post', 'vp-repost', 'vp-post-media', 'vp-post-action', 'vp-post-text', 'vp-avatar-link', 'vp-avatar', 'vp-nick', 'vp-nick-text',
  'vp-nick-badges', 'vp-nick-row', 'vp-nick-large', 'vp-banner', 'vp-nav', 'vp-nav-link', 'vp-nav-icon', 'vp-sidebar', 'vp-sidebar-right', 'vp-logo',
  'vp-version', 'vp-tabs', 'vp-feed-bar', 'vp-notif', 'vp-notif-text', 'mod-badge-verify', 'vp-itdx-btn', 'vp-menu-btn', 'vp-version-chip'];

function cleanSite() {
  const own = c => /^(vp-|mod-|my-|itd-|nick-|sticker-|custom-)/.test(c);
  document.querySelectorAll('.vp-rail, .vp-post-tools, .mod-badge-verify, .mod-badge-voronoi, .vp-fab, .itd-blur-container, .vp-itdx-btn, .vp-menu-btn, .vp-admin-toast, .vp-ambient, .vp-bg-canvas, .vp-bg-media, .vp-posts-stat, .vp-likes-stat, .vp-nick-tail-moved, .vp-version-chip, canvas').forEach(e => e.remove());
  for (const el of [...document.querySelectorAll('body *')]) {
    if (!el.isConnected) continue;
    const cls = [...el.classList];
    if (cls.length && cls.every(own) && !/^(ARTICLE|NAV|ASIDE|HEADER|FOOTER|MAIN|BUTTON|A|IMG|VIDEO|TIME)$/.test(el.tagName)) {
      if (el.querySelector('*') || el.textContent.trim()) el.replaceWith(...el.childNodes); else el.remove();
      continue;
    }
    cls.filter(own).forEach(c => el.classList.remove(c));
    [...el.attributes].filter(a => a.name.startsWith('data-vp')).forEach(a => el.removeAttribute(a.name));
  }
  document.querySelectorAll('style#vp-snapshot-info, script#vp-snapshot-info').forEach(e => e.remove());
}

function renameClasses(seed) {
  let x = seed;
  const rnd = () => (x = (x * 16807) % 2147483647);
  const abc = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const map = new Map(), used = new Set();
  const fresh = () => { let n; do { n = 'q' + [0, 1, 2, 3].map(() => abc[rnd() % abc.length]).join(''); } while (used.has(n)); used.add(n); return n; };
  for (const el of document.querySelectorAll('*')) for (const c of [...el.classList]) {
    if (!map.has(c)) map.set(c, fresh());
    el.classList.replace(c, map.get(c));
  }
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const keys = [...map.keys()].sort((a, b) => b.length - a.length);
  const re = new RegExp('\\.(' + keys.map(esc).join('|') + ')(?![\\w-])', 'g');
  for (const st of document.querySelectorAll('style')) st.textContent = st.textContent.replace(re, (m, c) => '.' + map.get(c));
  return map.size;
}

function addWrappers() {
  let n = 0;
  const wrap = (el, tag) => { const w = document.createElement(tag); el.replaceWith(w); w.appendChild(el); n++; };
  document.querySelectorAll('header a[href^="/@"] > span > span').forEach(s => { if (!s.children.length && s.textContent.trim()) wrap(s, 'span'); });
  document.querySelectorAll('header a[href^="/@"] > span').forEach(s => wrap(s, 'div'));
  document.querySelectorAll('footer').forEach(f => { const btn = f.querySelector('button'); if (btn) wrap(btn, 'div'); });
  document.querySelectorAll('nav > a').forEach(a => { if (n % 2) wrap(a, 'div'); });
  return n;
}

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const table = [];
  for (const file of process.argv.slice(2)) {
    const snap = fs.readFileSync(file, 'utf8');
    const info = JSON.parse((snap.match(/id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [, '{}'])[1]);
    const url = info.url || ORIGIN + '/';
    const vp = info.width && info.width < 700 ? { width: 412, height: 900 } : { width: 1400, height: 900 };
    const res = {};
    for (const mode of ['как есть', 'классы', 'классы+обёртки']) {
      const p = await b.newPage({ viewport: vp, ...(vp.width < 700 ? { isMobile: true, hasTouch: true } : {}) });
      const errors = [];
      p.on('pageerror', e => errors.push(e.message));
      await p.route('**/*', r => {
        const u = new URL(r.request().url()), t = r.request().resourceType();
        if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
        if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
        if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
        if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: '#NeuroSFW | ИТД X', id: OWNER }) });
        return r.fulfill({ status: 404, body: '' });
      });
      await p.addInitScript(m => {
        const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
        window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
        window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
        window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
        try {
          const v = {}; ['potato151', 'kalinka_malinka', 'lm_pho', 'anonym777', 'ebaweff', 'stardust'].forEach(u => v[u] = { state: 'approved' });
          localStorage.setItem('itd_verified_users', JSON.stringify(v));
        } catch (e) { }
      }, src.slice(0, src.indexOf('==/UserScript==')));
      await p.goto(url);
      await p.evaluate(cleanSite);
      if (mode !== 'как есть') await p.evaluate(renameClasses, 4242);
      if (mode === 'классы+обёртки') await p.evaluate(addWrappers);
      await p.addScriptTag({ content: src });
      await p.waitForTimeout(3000);
      res[mode] = await p.evaluate(roles => Object.fromEntries(roles.map(r => [r, document.getElementsByClassName(r).length])), ROLES);
      if (process.env.NAV) console.log(mode, await p.evaluate(() => [...document.querySelectorAll('nav a')].map(a => a.textContent.trim() + (a.getBoundingClientRect().width ? '' : '(скрыт)') + (a.parentElement.tagName === 'NAV' ? '' : '[в ' + a.parentElement.tagName + ']')).join(' | ')));
      res[mode].errors = errors.length ? [...new Set(errors)].slice(0, 3).join(' | ') : '';
      await p.screenshot({ path: path.join(__dirname, 'out', `chaos-${path.basename(file).replace(/^itd-snapshot-/, '').replace(/\W+/g, '').slice(0, 16)}-${mode.replace(/\W+/g, '') || mode.length}.png`) });
      await p.close();
    }
    const name = path.basename(file).replace(/^itd-snapshot-/, '').slice(0, 28);
    console.log(`\n=== ${name}`);
    for (const r of ROLES) {
      const a = res['как есть'][r], c = res['классы'][r], w = res['классы+обёртки'][r];
      if (!a && !c && !w) continue;
      const flag = c < a || w < a ? '  <— ПОТЕРЯ' : c > a || w > a ? '  (больше)' : '';
      console.log(`  ${r.padEnd(18)} ${String(a).padStart(4)} ${String(c).padStart(6)} ${String(w).padStart(8)}${flag}`);
      table.push({ name, r, a, c, w });
    }
    for (const m of Object.keys(res)) if (res[m].errors) console.log(`  ОШИБКИ (${m}): ${res[m].errors}`);
  }
  const lost = table.filter(t => t.c < t.a || t.w < t.a);
  console.log(`\nстолбцы: как есть · классы переименованы · + обёртки\nролей с потерей: ${lost.length} из ${table.length}`);
  await b.close();
})();
