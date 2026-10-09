// Aura card in the banner (3.5.2.8): the site's own block must stay vanilla, our buttons live only in the real button row.
// Run: node test/auracard.js profile-snapshot.html
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

const AURA = '<div class="DFxT AURATEST"><section aria-label="Аура аккаунта: 8 из 100, Тлеет" class="PX19 OjED" style="--aura-color: #f26b6b;"><span aria-hidden="true" class="BPvq">✦</span><span class="KaOC"><span class="nOKK">Аура аккаунта <button type="button" aria-label="Открыть анализатор ауры в магазине" title="Оценку выдаёт анализатор ауры из ивент-магазина." class="jn97">?</button></span><span class="Nqnq"><span class="cJON">8<small>/100</small></span><span class="FtVT">Тлеет ✦</span></span></span></section></div>';
const AURA_CSS = '<style>.DFxT { position: absolute; top: 14px; right: 14px; z-index: 4; width: min(220px, 100% - 28px); border-radius: 16px; } .jn97 { display: inline-grid; place-items: center; width: 14px; height: 14px; border: 1px solid; border-radius: 50%; background: transparent; padding: 0; }</style>';

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  for (const withRow of [true, false]) {
    const name = withRow ? 'аура и обычная строка кнопок' : 'только аура';
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
    await p.addInitScript(([m]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, [src.slice(0, src.indexOf('==/UserScript==')), false]);
    await p.goto(url);
    await p.evaluate(([aura, css, keep]) => {
      document.querySelectorAll('.vp-banner-fx, .custom-image-btn, .custom-change-btn, .custom-cancel-btn, .custom-apply-btn').forEach(e => e.remove());
      document.querySelectorAll('.vp-banner-buttons').forEach(e => e.classList.remove('vp-banner-buttons'));
      const banner = document.querySelector('img[alt="Banner"]').parentElement;
      if (!keep) [...banner.children].filter(c => c.querySelector('button')).forEach(c => c.remove());
      document.head.insertAdjacentHTML('beforeend', css);
      banner.insertAdjacentHTML('afterbegin', aura);
    }, [AURA, AURA_CSS, withRow]);
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    const r = await p.evaluate(() => {
      const aura = document.querySelector('.AURATEST'), cs = getComputedStyle(aura), box = aura.getBoundingClientRect();
      const bn = document.querySelector('.vp-banner'), bar = bn && bn.querySelector('.vp-banner-buttons');
      return {
        auraTagged: aura.classList.contains('vp-banner-buttons'),
        auraOurs: aura.querySelectorAll('.custom-image-btn, .custom-change-btn, .vp-banner-fx, .vp-banner-draw').length,
        help: !!aura.querySelector('button.jn97') && aura.querySelector('button.jn97').className,
        pos: cs.position, top: cs.top, right: cs.right, width: Math.round(box.width), transform: cs.transform, bg: cs.backgroundColor, filter: cs.backdropFilter,
        bar: !!bar, barIsAura: bar === aura, barBtns: bar ? bar.querySelectorAll('.custom-image-btn').length : 0,
        barCenter: bar ? Math.round(bar.getBoundingClientRect().left + bar.getBoundingClientRect().width / 2) : 0, bannerCenter: bn ? Math.round(bn.getBoundingClientRect().left + bn.getBoundingClientRect().width / 2) : 0,
      };
    });
    check(!r.auraTagged, `${name}: блок ауры не получил класс строки кнопок`);
    check(r.auraOurs === 0, `${name}: в ауре нет наших кнопок`);
    check(r.help === 'jn97', `${name}: кнопка «?» осталась с классами сайта (${r.help})`);
    check(r.pos === 'absolute' && r.top === '14px' && r.right === '14px' && r.width <= 220, `${name}: аура на своём месте как на сайте (${r.pos} ${r.top} ${r.right} ${r.width}px)`);
    check(r.transform === 'none' && r.filter === 'none', `${name}: у ауры нет нашего сдвига и размытия`);
    if (withRow) {
      check(r.bar && !r.barIsAura && r.barBtns === 1, `${name}: наша челка с кнопками в обычной строке`);
      check(Math.abs(r.barCenter - r.bannerCenter) <= 2, `${name}: челка по центру баннера (${r.barCenter} и ${r.bannerCenter})`);
    } else {
      check(!r.bar, `${name}: без обычной строки наших кнопок нигде нет`);
    }
    check(errors.length === 0, `${name}: ошибок страницы нет ${errors.join('; ')}`);
    await p.close();
  }
  await b.close();
  console.log(fails.length ? `\nПровалено: ${fails.length}` : '\nвсе проверки прошли');
  process.exit(fails.length ? 1 : 0);
})();
