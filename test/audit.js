// Обход снимков: ошибки, прокрутка вбок, наложения, обрезанный текст, горячие функции мода при прокрутке.
// Запуск:  node test/audit.js снимок1.html [снимок2.html ...]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const ORIGIN = 'https://xn--d1ah4a.com';

function pageLayout() {
  const vis = e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 2 && r.height > 2 && c.visibility !== 'hidden' && c.display !== 'none' && +c.opacity > 0.05; };
  const lab = e => {
    const cls = typeof e.className === 'string' ? e.className.split(' ').filter(c => c.startsWith('vp-') || c.startsWith('mod-')).slice(0, 2) : [];
    return e.tagName.toLowerCase() + (cls.length ? '.' + cls.join('.') : '');
  };
  const out = { wide: [], overlap: [], clipped: [] };
  if (document.documentElement.scrollWidth > innerWidth + 1) out.wide.push('страница ' + document.documentElement.scrollWidth);
  for (const e of document.querySelectorAll('body *')) {
    if (e.children.length || !vis(e) || getComputedStyle(e).position === 'fixed') continue;
    const r = e.getBoundingClientRect();
    if (r.right <= innerWidth + 2) continue;
    let clip = false;
    for (let a = e.parentElement; a; a = a.parentElement) {
      if (getComputedStyle(a).overflowX !== 'visible') { clip = a.getBoundingClientRect().right <= innerWidth + 2; break; }
    }
    if (!clip) out.wide.push(lab(e) + ' ' + Math.round(r.right));
  }
  const seen = new Set();
  for (const s of document.querySelectorAll('article header, .vp-notif, .vp-rail-card, footer')) {
    const items = [...s.querySelectorAll('button, a, time, img, .vp-nick-text, .vp-nick-badges, [class*="mod-badge"], span:not(:has(*))')].filter(vis);
    const art = s.matches('article header') && s.closest('article');
    const tools = art && art.querySelector(':scope > .vp-post-tools');
    if (tools) items.push(...[...tools.children].filter(vis));
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const a = items[i], c = items[j];
      if (a.contains(c) || c.contains(a)) continue;
      const A = a.getBoundingClientRect(), C = c.getBoundingClientRect();
      const w = Math.min(A.right, C.right) - Math.max(A.left, C.left), h = Math.min(A.bottom, C.bottom) - Math.max(A.top, C.top);
      if (w > 3 && h > 3) {
        const k = lab(a) + ' × ' + lab(c) + ' в ' + lab(s);
        if (!seen.has(k)) { seen.add(k); out.overlap.push(k + ` (${Math.round(w)}x${Math.round(h)}) «${(a.textContent || '').trim().slice(0, 14)}»/«${(c.textContent || '').trim().slice(0, 14)}»`); }
      }
    }
  }
  for (const e of document.querySelectorAll('body *')) {
    if (e.children.length || !e.textContent.trim() || !vis(e)) continue;
    const c = getComputedStyle(e);
    if (e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 2 && c.overflowX !== 'visible' && c.textOverflow !== 'ellipsis') out.clipped.push(lab(e) + ' «' + e.textContent.trim().slice(0, 24) + '» ' + e.clientWidth + '/' + e.scrollWidth);
  }
  out.wide = [...new Set(out.wide)].slice(0, 8); out.clipped = [...new Set(out.clipped)].slice(0, 10); out.overlap = out.overlap.slice(0, 15);
  return out;
}

async function scrollRun() {
  const lt = [];
  const po = new PerformanceObserver(l => l.getEntries().forEach(e => lt.push(Math.round(e.duration))));
  po.observe({ type: 'longtask', buffered: false });
  let worst = 0, last = performance.now();
  const max = document.documentElement.scrollHeight - innerHeight;
  const step = async y => { scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); const n = performance.now(); worst = Math.max(worst, n - last); last = n; };
  for (let i = 0; i < 90; i++) await step(max * i / 89);
  for (let i = 89; i >= 0; i -= 3) await step(max * i / 89);
  await new Promise(r => setTimeout(r, 300));
  po.disconnect();
  return { height: max, worstFrame: Math.round(worst), longTasks: lt };
}

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const hot = new Map();
  for (const file of process.argv.slice(2)) {
    const snap = fs.readFileSync(file, 'utf8');
    const url = (snap.match(/"url": "([^"]+)"/) || [, ORIGIN + '/'])[1];
    for (const [name, vp] of [['phone', { width: 412, height: 900 }], ['pc', { width: 1400, height: 900 }]]) {
      const p = await b.newPage({ viewport: vp, ...(name === 'phone' ? { isMobile: true, hasTouch: true } : {}) });
      const errors = [];
      p.on('pageerror', e => errors.push(e.message));
      let posts = [];
      await p.route('**/*', r => {
        const u = new URL(r.request().url()), t = r.request().resourceType();
        if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
        if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
        if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
        if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: OWNER }) });
        if (u.pathname === '/api/posts/user/audit') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts } }) });
        return r.fulfill({ status: 404, body: '' });
      });
      await p.addInitScript(m => {
        const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
        window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
        window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
        window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
      }, src.slice(0, src.indexOf('==/UserScript==')));
      await p.goto(url.startsWith(ORIGIN) ? url : ORIGIN + '/');
      posts = await p.evaluate(() => {
        document.querySelectorAll('.vp-post-tools').forEach(e => e.remove());
        return [...document.querySelectorAll('article[data-alice-water-anchor-id]')].map(a => {
          const l = a.querySelector('header a[href^="/@"]');
          const own = [...a.querySelectorAll('[data-post-tool-text]')].filter(t => !t.closest('.vp-repost')).map(t => t.textContent).join(' ');
          return l && { id: a.dataset.aliceWaterAnchorId, author: { username: l.getAttribute('href').slice(2) }, content: own, attachments: a.dataset.blurBg ? [{ url: a.dataset.blurBg }] : [] };
        }).filter(Boolean);
      });
      const cdp = await p.context().newCDPSession(p);
      await cdp.send('Profiler.enable');
      await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
      await p.addScriptTag({ content: src + '\n//# sourceURL=itdx.user.js' });
      await p.waitForTimeout(800);
      await p.evaluate(() => fetch('/api/posts/user/audit').then(r => r.text()));
      await p.waitForTimeout(2200);
      await cdp.send('Profiler.start');
      const t0 = Date.now();
      const scroll = await p.evaluate(scrollRun);
      const ms = Date.now() - t0;
      const { profile } = await cdp.send('Profiler.stop');
      const byId = new Map(profile.nodes.map(n => [n.id, n])), dt = profile.timeDeltas, self = new Map();
      profile.samples.forEach((id, i) => {
        const f = byId.get(id).callFrame;
        if (!/itdx/.test(f.url)) return;
        const k = `${f.functionName || '(anon)'}:${f.lineNumber + 1}`;
        self.set(k, (self.get(k) || 0) + (dt[i] || 0) / 1000);
      });
      const modMs = [...self.values()].reduce((a, c) => a + c, 0);
      for (const [k, v] of self) hot.set(k, (hot.get(k) || 0) + v);
      const layout = await p.evaluate(pageLayout);
      console.log(`\n=== ${path.basename(file)} · ${name} · прокрутка ${scroll.height}px за ${ms} мс, мод ${Math.round(modMs)} мс, худший кадр ${scroll.worstFrame} мс, long tasks [${scroll.longTasks.join(',')}], постов с id ${posts.length}`);
      if (errors.length) console.log('ОШИБКИ: ' + [...new Set(errors)].slice(0, 5).join(' | '));
      if (layout.wide.length) console.log('ВБОК: ' + layout.wide.join('; '));
      if (layout.overlap.length) console.log('НАЛОЖЕНИЯ:\n  ' + layout.overlap.join('\n  '));
      if (layout.clipped.length) console.log('ОБРЕЗАНО:\n  ' + layout.clipped.join('\n  '));
      await p.evaluate(() => scrollTo(0, 0));
      await p.screenshot({ path: path.join(__dirname, 'out', `audit-${path.basename(file).replace(/\W+/g, '').slice(11, 26)}-${name}.png`) });
      await p.close();
    }
  }
  console.log('\n=== горячие функции мода (сумма по всем прогонам, мс)');
  [...hot].sort((a, c) => c[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log(`  ${Math.round(v)}\t${k}`));
  await b.close();
})();
