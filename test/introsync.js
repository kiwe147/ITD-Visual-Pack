// Заставка на компьютере: звук в такт картинке. Первый кадр анимации может запоздать (сайт на входе
// грузится), поэтому звук обязан считать от реального старта анимаций (startTime), а не от вызова.
// Меряем: первый звук (когда звуковая карта начнёт его играть) минус старт анимаций — без нагрузки и с
// нагрузкой 600 мс на старте. Первый звук — удар первой буквы (620 мс; раньше на задержку вывода звука),
// и с нагрузкой так же. Было: звук на ~0,3 с раньше картинки даже без нагрузки.
// Запуск:  node test/introsync.js снимок.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const URL0 = 'https://xn--d1ah4a.com/';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
async function measure(b, busy) {
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => r.request().url() === URL0 ? r.fulfill({ contentType: 'text/html', body: snap }) : r.fulfill({ status: 404, body: '' }));
  await p.addInitScript(m => {
    const s = { introEnabled: true, backgroundEnabled: false, introPreview: '' };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    Math.random = () => 0.99;                                  // классическая заставка, не редкая
    // каждый звук: когда звуковая карта начнёт его играть, по часам страницы (performance.now)
    window.__snd = [];
    const st = AudioScheduledSourceNode.prototype.start;
    AudioScheduledSourceNode.prototype.start = function (t = 0, ...r) {
      const c = this.context;
      window.__snd.push(performance.now() + (Math.max(t, c.currentTime) - c.currentTime) * 1000);
      return st.call(this, t, ...r);
    };
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(URL0);
  await p.evaluate(() => document.querySelectorAll('.vpi-overlay').forEach(e => e.remove()));
  // нагрузка — сразу после запуска заставки, до первого кадра (как сайт, который в этот момент грузится)
  await p.addScriptTag({ content: src + (busy ? ';\n{ const e = performance.now() + 600; while (performance.now() < e); }' : '') });
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const a = document.getAnimations().find(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.vpi-overlay'));
    return { start: a ? a.startTime : null, first: window.__snd.length ? Math.min(...window.__snd) : null, n: window.__snd.length };
  });
  r.errors = errors;
  await p.close();
  return r;
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--autoplay-policy=no-user-gesture-required'] });
  const calm = await measure(b, false), busy = await measure(b, true);
  const d0 = calm.first - calm.start, d1 = busy.first - busy.start;
  console.log(`—    спокойно: звуков ${calm.n}, первый через ${d0.toFixed(0)} мс от старта картинки; с нагрузкой: звуков ${busy.n}, через ${d1.toFixed(0)} мс`);
  check(calm.n > 0 && busy.n > 0, 'звук запущен в обоих случаях');
  check(d0 > 450 && d0 < 640, `первый звук — на ударе первой буквы (${d0.toFixed(0)} мс, по плану 620 минус задержка вывода)`);
  check(Math.abs(d1 - d0) < 60, `с нагрузкой на старте звук не опережает картинку (разница ${(d1 - d0).toFixed(0)} мс)`);
  const errs = calm.errors.concat(busy.errors);
  check(!errs.length, 'ошибок нет' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
