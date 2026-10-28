// Маркер «кружок со стрелкой» на постах с активным призраком (article[data-haunt]).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, w) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + w); if (!ok) fails.push(w); };

// Пост с призраком: article[data-haunt] + кнопка «Изгнать призрака» (как у сайта)
const HAUNT_POST = `
<div class="vp-post-slot" style="position:relative">
  <article data-haunt="calm" style="position:relative;width:600px;height:420px;background:#222;margin:12px" data-alice-water-anchor-kind="post">
    <div style="padding:16px;color:#fff;font:14px system-ui">Текст поста с призраком</div>
    <div class="hw-layer" style="position:absolute;right:20px;top:180px;width:120px;height:120px">
      <button type="button" aria-label="Изгнать призрака" style="width:80px;height:80px;background:#444;border-radius:50%;border:0;cursor:pointer"></button>
    </div>
  </article>
</div>`;
const TAKEN_POST = `
<div class="vp-post-slot" style="position:relative">
  <article data-haunt="taken" style="position:relative;width:600px;height:420px;background:#222;margin:12px">
    <div style="padding:16px;color:#fff;font:14px system-ui">Захваченный пост</div>
    <div class="hw-layer" style="position:absolute;right:20px;top:180px;width:120px;height:120px">
      <button type="button" aria-label="Изгнать призрака" style="width:80px;height:80px;background:#444;border-radius:50%;border:0;cursor:pointer"></button>
    </div>
  </article>
</div>`;
const NORMAL_POST = `
<div class="vp-post-slot" style="position:relative">
  <article style="position:relative;width:600px;height:300px;background:#222;margin:12px">
    <div style="padding:16px;color:#fff;font:14px system-ui">Обычный пост</div>
  </article>
</div>`;

(async () => {
    const b = await chromium.launch();
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.route('**/*', async r => {
        const u = new URL(r.request().url()), t = r.request().resourceType();
        if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
        if (t === 'image' || t === 'font') return r.abort();
        if (t === 'stylesheet') return r.continue();
        if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
        if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
        return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(() => {
        const st = { palMiku: false, palTeto: false, palsEnabled: false, introEnabled: false, backgroundEnabled: false };
        window.GM_getValue = (k, d) => (k in st ? st[k] : d);
        window.GM_setValue = (k, v) => { st[k] = v; };
        window.GM_registerMenuCommand = () => { };
        window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
        window.GM_info = { script: { version: 't' } };
        window.unsafeWindow = window;
    });
    await p.goto(ORIGIN + '/');
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-msgs, .vp-pals, .vp-itdx-btn').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(1200);

    // вставляем три поста в ленту
    await p.evaluate(([a, b2, c]) => {
        const host = document.querySelector('.vp-post-slot')?.parentElement || document.querySelector('main') || document.body;
        const w = document.createElement('div');
        w.id = 'vpHMHost';
        w.innerHTML = a + b2 + c;
        host.prepend(w);
    }, [HAUNT_POST, TAKEN_POST, NORMAL_POST]);
    await p.waitForTimeout(1500);

    const res = await p.evaluate(() => {
        const arts = [...document.querySelectorAll('article[data-haunt]')];
        return arts.map(art => {
            const m = art.querySelector(':scope > .vp-haunt-mark');
            const btn = art.querySelector('button[aria-label*="призрак" i]');
            let info = { kind: art.getAttribute('data-haunt'), has: !!m };
            if (m && btn) {
                const mr = m.getBoundingClientRect(), br = btn.getBoundingClientRect();
                info.dx = Math.round((mr.left + mr.width / 2) - (br.left + br.width / 2));
                info.dy = Math.round((mr.top + mr.height / 2) - (br.top + br.height / 2));
                info.color = getComputedStyle(m).color;
                info.cls = m.className;
            }
            return info;
        });
    });
    console.log('POSTS', JSON.stringify(res));
    check(res.length === 2, `маркер только на постах с data-haunt (${res.length})`);
    const calm = res.find(r => r.kind === 'calm');
    const taken = res.find(r => r.kind === 'taken');
    check(!!calm && calm.has, 'на обычном призраке маркер есть');
    check(!!taken && taken.has, 'на захваченном маркере есть');
    check(!!calm && Math.abs(calm.dx) < 60 && Math.abs(calm.dy) < 60, `маркер рядом с кнопкой (dx=${calm && calm.dx}, dy=${calm && calm.dy})`);
    check(!!taken && taken.cls.includes('vp-haunt-taken'), 'захваченный — фиолетовый класс');

    // обычный пост без призрака: маркера нет
    const normal = await p.evaluate(() => {
        const arts = [...document.querySelectorAll('article')];
        const plain = arts.find(a => !a.hasAttribute('data-haunt') && a.textContent.includes('Обычный пост'));
        return plain ? !!plain.querySelector('.vp-haunt-mark') : null;
    });
    check(normal === false, 'на обычном посте маркера нет');

    // убираем data-haunt (как «поймали») — маркер должен исчезнуть
    await p.evaluate(() => { const a = document.querySelector('article[data-haunt="calm"]'); if (a) a.removeAttribute('data-haunt'); });
    await p.waitForTimeout(1600);
    const gone = await p.evaluate(() => document.querySelectorAll('.vp-haunt-mark').length);
    check(gone === 1, `при снятии data-haunt маркер исчез (осталось ${gone})`);

    await p.screenshot({ path: 'test/out/hauntmark.png', clip: { x: 0, y: 0, width: 1400, height: 900 } });
    if (errs.length) console.log('ERR:', JSON.stringify(errs.slice(0, 3)));
    check(errs.length === 0, 'нет ошибок страницы');
    await b.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();
