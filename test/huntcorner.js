// Цель в углу: кликается (не под доком), не выходит за пределы сцены.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, w) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + w); if (!ok) fails.push(w); };
const mkPage = () => Array.from({ length: 20 }, (_, i) => ({ id: 'p-0-' + i, author: { username: 'u' + i }, attachments: [] }));
const GHOSTS = ['p-0-1', 'p-0-2', 'p-0-3', 'p-0-4'];

(async () => {
    const b = await chromium.launch();
    const ctx = await b.newContext({ viewport: { width: 1000, height: 700 } });
    const p = await ctx.newPage();
    await p.route('**/*', async r => {
        const u = new URL(r.request().url()), t = r.request().resourceType();
        if (u.pathname.startsWith('/public/events/halloween')) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><body style="margin:0;background:#221133"><div class="room-stage" style="position:relative;width:100%;height:80vh;background:#2a1a3a"></div></body></html>' });
        if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
        if (t === 'image' || t === 'font') return r.abort();
        if (t === 'stylesheet') return r.continue();
        if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
        if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
        if (u.pathname === '/api/posts') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: mkPage(), pagination: { nextCursor: null } } }) });
        if (u.pathname === '/api/v1/halloween/feed-state') {
            const ids = (u.searchParams.get('posts') || '').split(',');
            const posts = {};
            for (const id of ids) if (GHOSTS.includes(id)) posts[id] = { possession: { id: 'g', stage: 'calm', resolved: null } };
            return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ serverNow: new Date().toISOString(), night: true, posts }) });
        }
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
    await p.goto(ORIGIN + '/event/halloween');
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-msgs, .vp-pals, .vp-itdx-btn').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    const fr = p.frames().find(f => f.url().includes('/public/events/halloween'));
    await fr.evaluate(() => { const d = document.querySelector('.vp-hunt-dev'); if (d) d.click(); });
    await p.waitForTimeout(9000);

    const geo = await fr.evaluate(() => {
        const stage = document.querySelector('.vp-hunt-stage');
        const sr = stage.getBoundingClientRect();
        return [...document.querySelectorAll('.vp-hunt-tgt')].map(t => {
            const r = t.getBoundingClientRect();
            return {
                inside: r.left >= sr.left - 1 && r.top >= sr.top - 1 && r.right <= sr.right + 1 && r.bottom <= sr.bottom + 1,
                z: getComputedStyle(t).zIndex,
                w: Math.round(r.width)
            };
        });
    });
    console.log('GEO', JSON.stringify(geo));
    check(geo.length > 0, `цели есть (${geo.length})`);
    check(geo.every(g => g.inside), 'все цели внутри сцены (не под доком, не за краем)');
    check(geo.every(g => +g.z >= 10), 'z-index целей выше дока');

    // клик по самой нижней цели: должен сработать (не перехвачен доком)
    const clicked = await fr.evaluate(() => {
        const targets = [...document.querySelectorAll('.vp-hunt-tgt')];
        if (!targets.length) return null;
        targets.sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom);
        const t = targets[0];
        const r = t.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const top = document.elementFromPoint(cx, cy);
        const hitSelf = !!(top && (top === t || t.contains(top)));
        return { hitSelf, x: Math.round(cx), y: Math.round(cy), topTag: top ? top.className || top.tagName : null };
    });
    console.log('CLICK', JSON.stringify(clicked));
    check(!!clicked && clicked.hitSelf, `самая нижняя цель кликабельна (попали в: ${clicked && clicked.topTag})`);

    await b.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();
