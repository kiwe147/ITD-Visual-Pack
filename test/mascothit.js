// Маскот: (1) сам кликабелен (по альфе), (2) не мешает окну охоты.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const MAS_B64 = fs.readFileSync(path.join(__dirname, '..', 'assets', 'mascot3.webp')).toString('base64');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, w) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + w); if (!ok) fails.push(w); };

const ROOM = '<!doctype html><html><head><style>body{margin:0;background:#221133}.room-stage{position:relative;width:100%;height:80vh;background:#2a1a3a}</style></head><body><div class="room-stage"></div></body></html>';

(async () => {
    const b = await chromium.launch();
    const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.route('**/*', async r => {
        const u = new URL(r.request().url()), t = r.request().resourceType();
        if (u.pathname.startsWith('/public/events/halloween')) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: ROOM });
        if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
        if (t === 'image' || t === 'font') return r.abort();
        if (t === 'stylesheet') return r.continue();
        if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
        if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
        if (u.pathname === '/api/posts') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: [], pagination: { nextCursor: null } } }) });
        if (u.pathname === '/api/v1/halloween/feed-state') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ serverNow: new Date().toISOString(), night: false, posts: {} }) });
        return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([b64]) => {
        const st = { palMiku: false, palTeto: false, palsEnabled: false, introEnabled: false, backgroundEnabled: false, mascotOn: true };
        window.GM_getValue = (k, d) => (k in st ? st[k] : d);
        window.GM_setValue = (k, v) => { st[k] = v; };
        window.GM_registerMenuCommand = () => { };
        window.GM_xmlhttpRequest = o => {
            if (/assets\/(mascot3\.webp)/.test(o.url)) {
                const bin = atob(b64), u8 = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
                const blob = new Blob([u8], { type: 'image/webp' });
                setTimeout(() => o.onload && o.onload({ status: 200, response: blob }), 10);
                return;
            }
            setTimeout(() => o.onerror && o.onerror('x'), 0);
        };
        window.GM_info = { script: { version: 't' } };
        window.unsafeWindow = window;
    }, [MAS_B64]);
    await p.goto(ORIGIN + '/event/halloween');
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-msgs, .vp-pals, .vp-itdx-btn').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(4000);
    const fr = p.frames().find(f => f.url().includes('/public/events/halloween'));
    check(!!fr, 'iframe найден');

    const mas = await fr.evaluate(() => {
        const m = document.querySelector('.vp-mas');
        const pic = m && m.querySelector('.vp-mas-pic');
        if (!pic) return null;
        const r = pic.getBoundingClientRect();
        return { cx: Math.round(r.left + r.width * 0.5), cy: Math.round(r.top + r.height * 0.55), w: Math.round(r.width), h: Math.round(r.height) };
    });
    console.log('MAS', JSON.stringify(mas));
    check(!!mas && mas.w > 50, 'маскот вставлен и виден');
    if (!mas) { await b.close(); process.exit(1); }

    // 1) клик по маскоту вне охоты — должен «мяукнуть»
    await fr.evaluate(({ cx, cy }) => {
        const pic = document.querySelector('.vp-mas-pic');
        if (!pic) return;
        pic.dispatchEvent(new MouseEvent('click', { clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
    }, mas);
    await p.waitForTimeout(500);
    const said = await fr.evaluate(() => (document.querySelector('.vp-mas-say') || {}).textContent || '');
    console.log('SAID', JSON.stringify(said));
    check(!!said, `маскот кликается (сказал: «${said}»)`);

    // 2) открываем охоту — тот же клик не должен «мяукать»
    await fr.evaluate(() => { const d = document.querySelector('.vp-hunt-dev'); if (d) d.click(); });
    await p.waitForTimeout(1200);
    const opened = await fr.evaluate(() => !!document.querySelector('.vp-hunt.vp-open'));
    check(opened, 'окно охоты открылось');
    if (opened) {
        await fr.evaluate(() => { const s = document.querySelector('.vp-mas-say'); if (s) s.textContent = ''; });
        await fr.evaluate(({ cx, cy }) => {
            const w = document.querySelector('.vp-hunt');
            const el = (w && w.contains(document.elementFromPoint(cx, cy))) ? document.elementFromPoint(cx, cy) : document.querySelector('.vp-hunt');
            if (el) el.dispatchEvent(new MouseEvent('click', { clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
        }, mas);
        await p.waitForTimeout(500);
        const said2 = await fr.evaluate(() => (document.querySelector('.vp-mas-say') || {}).textContent || '');
        console.log('SAID2', JSON.stringify(said2));
        check(!said2, `при открытой охоте маскот не реагирует («${said2}»)`);
        const winStill = await fr.evaluate(() => !!document.querySelector('.vp-hunt.vp-open'));
        check(winStill, 'окно охоты не закрылось от клика');
    }

    if (errs.length) console.log('ERR:', JSON.stringify(errs.slice(0, 3)));
    check(errs.length === 0, 'нет ошибок страницы');
    await b.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();
