// Плавность прокрутки ленты на «слабом устройстве»: процессор замедлен (CDP Emulation.setCPUThrottlingRate),
// лента ~80 постов, стили сайта из ITD/CSS. Плавная прокрутка вниз, потом вверх (как пальцем/колесом с инерцией),
// кадры меряются requestAnimationFrame. Сравнение: сцена ленты вкл/выкл, стекло вкл/выкл.
// Запуск:  node test/scrollperf.js снимок-ленты.html [замедление=6] [phone|desktop]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [snapPath, rateArg = '6', mode = 'phone'] = process.argv.slice(2);
let snap = fs.readFileSync(snapPath, 'utf8');
const cssDir = path.join(__dirname, '..', '..', 'ITD', 'CSS');
if (fs.existsSync(cssDir)) snap = snap.replace('</head>', fs.readdirSync(cssDir).filter(f => f.endsWith('.css')).map(f => '<style>' + fs.readFileSync(path.join(cssDir, f), 'utf8') + '</style>').join('') + '</head>');
let src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
src = src.replace('function sceneFrame() {\n            sceneQueued = false;', 'function sceneFrame() {\n            const __t0 = performance.now(); queueMicrotask(() => (window.__scene || (window.__scene = [])).push(performance.now() - __t0));\n            sceneQueued = false;');
const ORIGIN = 'https://xn--d1ah4a.com';

const run = async (b, opts) => {
  const ctx = await b.newContext(mode === 'phone' ? { viewport: { width: 392, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1500, height: 900 } });
  const p = await ctx.newPage();
  p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  p.autoOff = false;
  p.on('console', m => { if (/сцена ленты выключена/.test(m.text())) p.autoOff = true; });
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (['stylesheet', 'font'].includes(t)) return r.continue();
    if (t === 'image') return r.fulfill({ status: 404, body: '' });
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(([m, o]) => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, sceneEnabled: o.scene, glassEnabled: o.glass, siteTheme: 'dark' };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o2 => setTimeout(() => o2.onerror && o2.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, [src.slice(0, src.indexOf('==/UserScript==')), opts]);
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.querySelectorAll('[class*="vp-"]').forEach(e => [...e.classList].filter(c => c.startsWith('vp-')).forEach(c => e.classList.remove(c)));
    document.querySelectorAll('.vp-rail, .vp-fab, .vp-post-tools, .vp-post-refresh, .vp-gal-btn').forEach(e => e.remove());
    const arts = [...document.querySelectorAll('article')], host = arts[0] && arts[0].parentElement;
    for (let k = 0; k < 6 && host; k++) arts.slice(0, 14).forEach(a => host.appendChild(a.cloneNode(true)));
  });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  if (opts.css) await p.addStyleTag({ content: opts.css });
  if (opts.probe) console.log('    пост: ' + JSON.stringify(await p.evaluate(() => { const a = document.querySelectorAll('article')[3], cs = getComputedStyle(a); return { transition: cs.transition, willChange: cs.willChange, backdrop: cs.backdropFilter, contain: cs.contain, cls: a.className.slice(0, 60), inner: [...a.querySelectorAll('*')].filter(e => { const c = getComputedStyle(e); return c.transitionDuration !== '0s' || c.backdropFilter !== 'none' || c.filter !== 'none'; }).slice(0, 6).map(e => e.tagName + '.' + String(e.className).slice(0, 30) + ' t=' + getComputedStyle(e).transitionProperty + ' bf=' + getComputedStyle(e).backdropFilter + ' f=' + getComputedStyle(e).filter) }; })));
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: +rateArg });
  const measure = dir => p.evaluate(dir => new Promise(done => {
    window.__scene = [];
    const frames = [];
    let last = performance.now(), v = 0, t = 0;
    const H = document.documentElement.scrollHeight - innerHeight;
    if (dir < 0) window.scrollTo(0, Math.min(H, 9000));
    else window.scrollTo(0, 0);
    const start = performance.now();
    const f = now => {
      frames.push(now - last); last = now;
      const e = (now - start) / 1000;
      v = e < 3.5 ? 1800 : 0;
      window.scrollBy(0, dir * v * Math.min(0.05, frames[frames.length - 1] / 1000));
      if (e < 3.6) requestAnimationFrame(f);
      else done({ frames: frames.slice(3), scene: window.__scene.slice() });
    };
    requestAnimationFrame(f);
  }), dir);
  const out = {};
  await cdp.send('Performance.enable');
  const met = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
  for (const [name, dir] of [['вниз', 1], ['вверх', -1]]) {
    const m0 = await met();
    const r = await measure(dir);
    const m1 = await met(), d = k => ((m1[k] - m0[k]) * 1000).toFixed(0);
    out[name + ' (мс)'] = `стили ${d('RecalcStyleDuration')}, раскладка ${d('LayoutDuration')}, скрипты ${d('ScriptDuration')}, всего задач ${d('TaskDuration')}`;
    const fr = r.frames, med = [...fr].sort((a, b) => a - b)[fr.length >> 1];
    const jank = fr.filter(x => x > 34).length, sc = r.scene.length ? r.scene.reduce((a, b) => a + b, 0) / r.scene.length : 0;
    out[name] = `кадров ${fr.length}, медиана ${med.toFixed(1)} мс, рывков >34 мс: ${jank} (${Math.round(jank / fr.length * 100)}%), худший ${Math.max(...fr).toFixed(0)} мс, сцена ${sc.toFixed(2)} мс/кадр`;
  }
  if (opts.scene) out['сцена сама выключилась'] = p.autoOff ? 'да' : 'нет';
  if (p.errors.length) out.ошибки = p.errors.slice(0, 3).join(' | ');
  await ctx.close();
  return out;
};

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const V = process.env.VARIANTS === '1' ? [
    ['сцена ВЫКЛ', { scene: false, glass: true }],
    ['сцена ВКЛ', { scene: true, glass: true }],
    ['сцена ВКЛ, без размытого фона поста', { scene: true, glass: true, css: '.vp-blur-img{display:none!important} .itd-blur-container{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}' }],
    ['сцена ВКЛ, will-change', { scene: true, glass: true, css: 'html.vp-scene article.vp-post{will-change:transform,opacity}' }],
    ['сцена ВКЛ, только прозрачность', { scene: true, glass: true, css: 'html.vp-scene article.vp-post{transform:none!important}' }],
    ['сцена ВКЛ, только сдвиг/масштаб', { scene: true, glass: true, css: 'html.vp-scene article.vp-post{opacity:1!important}' }],
  ] : [['сцена ВЫКЛ, стекло вкл', { scene: false, glass: true }], ['сцена ВКЛ, стекло вкл', { scene: true, glass: true }],
    ['сцена ВЫКЛ, стекло выкл', { scene: false, glass: false }], ['сцена ВКЛ, стекло выкл', { scene: true, glass: false }]];
  for (const [label, o] of V) {
    const r = await run(b, o);
    console.log(`— ${label}`);
    Object.entries(r).forEach(([k, v]) => console.log(`    ${k}: ${v}`));
  }
  await b.close();
})();
