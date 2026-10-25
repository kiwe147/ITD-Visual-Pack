// Фон мода рисуется в отдельном потоке (воркер + OffscreenCanvas), без воркера — как раньше в странице.
// Проверка: холст передан воркеру, каждый стиль рисует и анимируется без ошибок, запасной путь работает,
// и сколько времени основной поток тратит на задачи с воркером и без него.
// Запуск:  node test/bgworker.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snapCsp = fs.readFileSync(process.argv[2], 'utf8');
const snap = snapCsp.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/i, '');
let SNAPNOW = snap;
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const meta = src.slice(0, src.indexOf('==/UserScript=='));
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const STYLES = ['matrix', 'stars', 'particles', 'waves', 'aurora', 'bokeh', 'grid', 'snow'];
async function open(b, style, noWorker) {
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage();
  p.errors = []; p.logs = [];
  p.on('pageerror', e => p.errors.push(e.message));
  p.on('console', m => { if (/не запустился/.test(m.text())) p.logs.push(m.text()); });
  await p.route('**/*', r => {
    const req = r.request(), u = new URL(req.url()), t = req.resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: SNAPNOW });
    if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m, st, nw]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: true, backgroundStyle: st, palsEnabled: false, sceneEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    if (nw) delete window.OffscreenCanvas;
  }, [meta, style, !!noWorker]);
  await p.addInitScript('(function () { const run = () => {' + src + String.fromCharCode(10) + '}; if (document.documentElement) run(); else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); run(); } }); mo.observe(document, { childList: true }); } })();');
  await p.goto(ORIGIN + '/');
  await p.waitForTimeout(2500);
  return { p, ctx };
}
const drawsNow = async p => {
  const a = await p.screenshot({ clip: { x: 0, y: 0, width: 1400, height: 900 } });
  await p.waitForTimeout(450);
  const b = await p.screenshot({ clip: { x: 0, y: 0, width: 1400, height: 900 } });
  return !a.equals(b);
};
const taskSec = async p => {
  if (!p._cdp) { p._cdp = await p.context().newCDPSession(p); await p._cdp.send('Performance.enable'); }
  const m = (await p._cdp.send('Performance.getMetrics')).metrics;
  const g = n => (m.find(x => x.name === n) || {}).value || 0;
  return { task: g('TaskDuration'), script: g('ScriptDuration') };
};
(async () => {
  const b = await chromium.launch();
  for (const st of STYLES) {
    const { p, ctx } = await open(b, st, false);
    const transferred = await p.evaluate(() => { try { document.querySelector('.vp-bg-canvas').getContext('2d'); return false; } catch (e) { return true; } });
    const op = await p.evaluate(() => document.querySelector('.vp-bg-canvas').style.opacity);
    const anim = await drawsNow(p);
    check(transferred, st + ': холст передан воркеру');
    check(await p.evaluate(() => window.itdvp && itdvp.bg().режим) === 'отдельный поток', st + ': диагностика itdvp.bg() — отдельный поток');
    check(!!op && +op > 0, st + ': прозрачность стиля пришла из воркера (' + op + ')');
    check(anim, st + ': фон рисуется и меняется');
    check(!p.errors.length && !p.logs.length, st + ': ошибок нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : '') + (p.logs.length ? ' ' + p.logs.join(' | ') : ''));
    await ctx.close();
  }
  {
    const { p, ctx } = await open(b, 'aurora', true);
    const transferred = await p.evaluate(() => { try { document.querySelector('.vp-bg-canvas').getContext('2d'); return false; } catch (e) { return true; } });
    check(!transferred, 'без воркеров: холст остаётся у страницы');
    check(await drawsNow(p), 'без воркеров: фон всё равно рисуется (запасной путь)');
    check(!p.errors.length, 'без воркеров: ошибок нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
    await ctx.close();
  }
  {
    SNAPNOW = snapCsp;
    const { p, ctx } = await open(b, 'aurora', false);
    const info = await p.evaluate(() => window.itdvp && itdvp.bg());
    check(info && info.режим === 'в странице', 'политика сайта запрещает воркер из блоба: фон переходит в страницу (' + (info && info.причина) + ')');
    check(await drawsNow(p), 'с политикой сайта: фон рисуется после запасного перехода');
    check(!p.errors.length, 'с политикой сайта: ошибок страницы нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
    await ctx.close();
    SNAPNOW = snap;
  }
  for (const [name, nw] of [['в воркере', false], ['в странице', true]]) {
    const { p, ctx } = await open(b, 'aurora', nw);
    const m0 = await taskSec(p);
    await p.waitForTimeout(5000);
    const m1 = await taskSec(p);
    console.log('—    основной поток, 5 с, ' + name + ': задачи ' + ((m1.task - m0.task) * 1000).toFixed(0) + ' мс, скрипты ' + ((m1.script - m0.script) * 1000).toFixed(0) + ' мс');
    if (!nw) check((m1.task - m0.task) < 0.5, 'основной поток почти свободен (задачи за 5 с меньше 500 мс)');
    await ctx.close();
  }
  {
    const { p, ctx } = await open(b, 'matrix', false);
    await p.evaluate(() => { document.documentElement.dataset.t = '1'; });
    await p.evaluate(() => { const cb = document.querySelector('.vp-bg-canvas'); cb.classList.add('vp-bg-off'); });
    await p.waitForTimeout(500);
    check(!p.errors.length, 'скрытие холста: ошибок нет');
    await ctx.close();
  }
  await b.close();
  console.log(fails.length ? '\nОШИБОК: ' + fails.length : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
