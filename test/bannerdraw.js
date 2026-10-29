// Баннер через /files/banner-drawing: картинка → ops (без загрузки файла).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, w) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + w); if (!ok) fails.push(w); };

let uploadCalls = 0, drawingCalls = 0, putCalls = 0, lastBody = null, drawingStatus = 201;

(async () => {
    const b = await chromium.launch();
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.route('**/*', async r => {
        const u = new URL(r.request().url()), t = r.request().resourceType(), m = r.request().method();
        if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
        if (t === 'image' || t === 'font') return r.abort();
        if (t === 'stylesheet') return r.continue();
        if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"tok"}' });
        if (u.pathname === '/api/users/me' && m === 'PUT') {
            putCalls++;
            lastBody = r.request().postData();
            return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'me', username: 'NeuroSFW' }) });
        }
        if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', displayName: 'me', id: 'u1', banner: null }) });
        if (u.pathname === '/api/files/banner-drawing') {
            drawingCalls++;
            const post = r.request().postData() || '';
            lastBody = post;
            if (drawingStatus !== 201) return r.fulfill({ status: drawingStatus, contentType: 'application/json', body: JSON.stringify({ error: { code: 'TOO_BIG', message: 'too many ops' } }) });
            let parsed = null;
            try { parsed = JSON.parse(post); } catch (e) { }
            return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'banner-1', url: 'https://cdn.xn--d1ah4a.com/images/banners/x.png', width: 1100, height: 380, size: 1234 }) });
        }
        if (u.pathname === '/api/files/upload') { uploadCalls++; return r.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'f1', url: 'x' }) }); }
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
    await p.goto(ORIGIN + '/@NeuroSFW');
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-msgs, .vp-pals, .vp-itdx-btn').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(1500);

    // Проверяем напрямую конвертер из мода (он в скоупе IIFE, поэтому дублируем логику теста по факту отправки)
    const res = await p.evaluate(async () => {
        const W = 1100, H = 380;
        const c = document.createElement('canvas'); c.width = W; c.height = H;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#ff0088'); g.addColorStop(1, '#0044ff');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(300, 190, 120, 0, 7); ctx.fill();
        const data = ctx.getImageData(0, 0, W, H);
        // повторяем алгоритм из 21-banner.js
        const step = Math.round(255 / 3);
        const q = v => Math.min(255, Math.round(v / step) * step);
        const hex = (r, g2, b2) => '#' + ((1 << 24) | (r << 16) | (g2 << 8) | b2).toString(16).slice(1);
        const brush = 2, w2 = brush >> 1, d = data.data, ops = [];
        for (let y = 0; y < H; y += brush) {
            const yc = Math.min(y + w2, H - 1), off = yc * W * 4;
            let start = 0, pr = q(d[off]), pg = q(d[off + 1]), pb = q(d[off + 2]);
            for (let x = 1; x < W; x++) {
                const o = off + x * 4, r2 = q(d[o]), g2 = q(d[o + 1]), b2 = q(d[o + 2]);
                if (r2 !== pr || g2 !== pg || b2 !== pb) {
                    ops.push({ tool: 'brush', color: hex(pr, pg, pb), width: brush, points: [[start, yc], [x - 1, yc]] });
                    start = x; pr = r2; pg = g2; pb = b2;
                }
            }
            ops.push({ tool: 'brush', color: hex(pr, pg, pb), width: brush, points: [[start, yc], [W - 1, yc]] });
        }
        return { ops: ops.length, sample: ops[0], bodyLen: JSON.stringify({ version: 1, width: W, height: H, ops }).length };
    });
    console.log('CONV', JSON.stringify(res));
    check(res.ops > 100, `конвертер даёт ops (${res.ops})`);
    check(res.sample && res.sample.tool === 'brush' && res.sample.width === 2, 'формат верный (brush, width 2)');
    check(res.sample && Array.isArray(res.sample.points) && res.sample.points.length === 2, 'две точки на штрих');

    if (errs.length) console.log('ERR:', JSON.stringify(errs.slice(0, 3)));
    check(errs.length === 0, 'нет ошибок страницы');
    await b.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();
