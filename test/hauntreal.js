// Реальный фрагмент поста с призраком (прислан владельцем): [data-haunt] на div, кнопка в [data-tool].
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const real = fs.readFileSync(path.join(__dirname, '_haunt_real.html'), 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, w) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + w); if (!ok) fails.push(w); };

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
    await p.evaluate(h => {
        const host = document.querySelector('.vp-post-slot')?.parentElement || document.querySelector('main') || document.body;
        const w = document.createElement('div');
        w.id = 'vpHMReal';
        w.style.cssText = 'position:relative;width:700px;margin:20px auto;padding:20px;background:#111;';
        w.innerHTML = h;
        host.prepend(w);
    }, real);
    await p.waitForTimeout(1600);

    const r1 = await p.evaluate(() => {
        const host = document.querySelector('[data-haunt]');
        const mark = host && host.querySelector(':scope > .vp-haunt-mark');
        const btn = host && host.querySelector('button[aria-label*="Изгнать"]');
        if (!mark) return { ok: false };
        const mr = mark.getBoundingClientRect(), br = btn.getBoundingClientRect();
        const hostCS = getComputedStyle(host);
        return {
            ok: true,
            dx: Math.round((mr.left + mr.width / 2) - (br.left + br.width / 2)),
            dy: Math.round((mr.top + mr.height / 2) - (br.top + br.height / 2)),
            w: Math.round(mr.width), h: Math.round(mr.height),
            z: getComputedStyle(mark).zIndex,
            pe: getComputedStyle(mark).pointerEvents,
            color: getComputedStyle(mark).color,
            hostPos: hostCS.position,
            hostOverflow: hostCS.overflow
        };
    });
    console.log('REAL', JSON.stringify(r1));
    check(r1.ok, 'маркер появился на реальной разметке');
    check(r1.ok && Math.abs(r1.dx) < 60 && Math.abs(r1.dy) < 60, `маркер у кнопки (dx=${r1.dx}, dy=${r1.dy})`);
    check(r1.ok && r1.pe === 'none', 'не перехватывает клики');
    check(r1.ok && r1.color === 'rgb(255, 31, 31)', 'красный цвет');

    // хост не сломал вёрстку: высота до/после
    const layout = await p.evaluate(() => {
        const host = document.querySelector('[data-haunt]');
        const btn = host.querySelector('button[aria-label*="Изгнать"]');
        const hR = host.getBoundingClientRect(), bR = btn.getBoundingClientRect();
        return { hostH: Math.round(hR.height), hostW: Math.round(hR.width), btnInHost: bR.top >= hR.top - 2 && bR.bottom <= hR.bottom + 2 };
    });
    check(layout.hostH > 100, `хост сохранил высоту (${layout.hostH})`);

    await p.screenshot({ path: 'test/out/hauntreal.png', clip: { x: 0, y: 0, width: 1400, height: 900 } });
    if (errs.length) console.log('ERR:', JSON.stringify(errs.slice(0, 3)));
    check(errs.length === 0, 'нет ошибок');
    await b.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();
