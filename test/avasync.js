// Синхронизация своей мод-аватарки между устройствами (серверный look.a).
// Случай 1: локальной vp_ava нет, на сервере look.a есть -> ава показывается (URL из look.a).
// Случай 2: локальная vp_ava есть -> она приоритетнее серверной.
// Запуск:  node test/avasync.js снимок-профиля.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const REF_SERVER = '0' + 'ab12cd34'.repeat(4);
const REF_LOCAL = '1' + 'ffffffff'.repeat(4);
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };

async function runCase(b, localRef) {
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (t === 'image') return r.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64') });
    if (['stylesheet', 'font'].includes(t)) return r.fulfill({ status: 404, body: '' });
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: 'me-id', displayName: 'NeuroSFW', avatar: '🍑' }) });
    if (u.pathname.startsWith('/api/users/')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: 'me-id', displayName: 'NeuroSFW', avatar: '🍑' }) });
    if (u.pathname.startsWith('/api/')) return r.fulfill({ contentType: 'application/json', body: '{}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m, ref, localRef]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, vp_ver_at: Date.now() + 36e5, showLooks: true };
    window.GM_getValue = (k, d) => {
      if (k in s) return s[k];
      if (/vp_ava/.test(k)) return localRef ? { ref: localRef, at: Date.now() } : null;
      return d;
    };
    window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m };
    window.unsafeWindow = window;
    window.__seed = () => localStorage.setItem('itd_verified_users', JSON.stringify({
      NeuroSFW: { code: 'x', hasMod: true, flags: '1', state: 'approved', id: 'me-id', displayName: 'NeuroSFW', look: { n: 'white', b: '-', g: '11', a: ref } }
    }));
  }, [src.slice(0, src.indexOf('==/UserScript==')), REF_SERVER, localRef]);
  await p.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => document.querySelectorAll('.vp-fab, .vp-nav-blob, .vp-rail').forEach(e => e.remove()));
  await p.evaluate(() => window.__seed());
  await p.addScriptTag({ content: src });
  await p.evaluate(() => window.__seed());
  await p.waitForTimeout(3500);
  await p.evaluate(() => window.__seed());
  await p.waitForTimeout(1500);
  const found = await p.evaluate(() => [...document.querySelectorAll('[data-vp-ava]')].map(e => ({ ref: e.getAttribute('data-vp-ava'), url: (e.style.getPropertyValue('--vp-ava-url') || '') })));
  const dbg = await p.evaluate(() => { let vu = {}; try { vu = JSON.parse(localStorage.getItem('itd_verified_users')) || {}; } catch (e) { } const lk = (vu.NeuroSFW && vu.NeuroSFW.look) || null; return { vuKeys: Object.keys(vu), myLook: lk, glowCount: document.querySelectorAll('.my-avatar-glow').length, profilesCount: document.querySelectorAll('a[href=\"/@NeuroSFW\"]').length, imgEmoji: document.querySelectorAll('img[alt=\"\"]').length }; });
  console.log('  dbg:', JSON.stringify(dbg));
  const errs = errors.length;
  await p.close();
  return { found, errs };
}

(async () => {
  const b = await chromium.launch();
  const a = await runCase(b, '');
  check(a.found.length > 0, 'второе устройство (vp_ava пуст): своя ава взята из серверного look.a, помечено элементов: ' + a.found.length);
  check(a.found.some(x => x.ref === REF_SERVER), 'второе устройство: ref = серверный look.a (' + REF_SERVER.slice(0, 10) + '...)');
  check(a.found.some(x => /ab12cd34-ab12-cd34-ab12-cd34ab12cd34/.test(x.url)), 'второе устройство: картинка по URL из look.a');
  check(a.errs === 0, 'нет ошибок страницы (case 1)');
  const c = await runCase(b, REF_LOCAL);
  check(c.found.some(x => x.ref === REF_LOCAL), 'локальная vp_ava приоритетнее серверной (ref = local)');
  check(c.found.some(x => /ffffffff-ffff-ffff-ffff-ffffffffffff/.test(x.url)), 'локальная: картинка по локальному URL');
  check(c.errs === 0, 'нет ошибок страницы (case 2)');
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();