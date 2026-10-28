// Охота на нечисть: устройство в iframe ивента, окно поиска, режимы, сущности.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, w) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + w); if (!ok) fails.push(w); };

const GHOST = ['p-0-1', 'p-0-3'], WOLF = ['p-0-2'], EX = ['p-0-0'];
const mkPage = (n) => Array.from({ length: 20 }, (_, i) => ({ id: 'p-' + n + '-' + i, author: { username: 'u' + i }, attachments: [{ type: 'image', url: 'https://cdn.xn--d1ah4a.com/images/x.png', width: 600, height: 400 }] }));

(async () => {
    const b = await chromium.launch();
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.route('**/*', async r => {
        const u = new URL(r.request().url()), t = r.request().resourceType();
        if (u.pathname.startsWith('/public/events/halloween')) {
            return r.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><head><style>body{margin:0;background:#221133}.room-stage{position:relative;width:100%;height:80vh;background:#2a1a3a}</style></head><body><div class="room-stage"></div></body></html>' });
        }
        if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
        if (t === 'image' || t === 'font') return r.abort();
        if (t === 'stylesheet') return r.continue();
        if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
        if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
        if (u.pathname === '/api/posts') {
            const cur = u.searchParams.get('cursor'), n = cur ? +cur.slice(1) : 0;
            return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: mkPage(n), pagination: { nextCursor: n + 1 < 2 ? 'c' + (n + 1) : null } } }) });
        }
        if (u.pathname === '/api/v1/halloween/feed-state') {
            const ids = (u.searchParams.get('posts') || '').split(',');
            const posts = {};
            for (const id of ids) {
                if (GHOST.includes(id)) posts[id] = { possession: { id: 'g', stage: 'calm', resolved: null } };
                else if (WOLF.includes(id)) posts[id] = { werewolf: { night: true } };
                else if (EX.includes(id)) posts[id] = { possession: { id: 'e', stage: 'calm', resolved: 'exorcised' } };
            }
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
    check(!!fr, 'iframe ивента найден');
    if (fr) {
        const dev = await fr.evaluate(() => {
            const d = document.querySelector('.vp-hunt-dev');
            if (!d) return null;
            const r = d.getBoundingClientRect();
            return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y), css: !!document.getElementById('vp-hunt-css') };
        });
        check(!!dev, 'устройство вставлено в iframe ивента');
        if (dev) {
            check(dev.w > 60 && dev.h > 60, `устройство видимого размера (${dev.w}×${dev.h})`);
            check(dev.css, 'CSS применился');
        }
        await fr.click('.vp-hunt-dev');
        await p.waitForTimeout(500);
        const win = await fr.evaluate(() => {
            const w = document.querySelector('.vp-hunt');
            if (!w) return null;
            const st = w.querySelector('.vp-hunt-stage');
            const modes = [...w.querySelectorAll('.vp-hunt-modes button')].map(b => ({ m: b.dataset.m, on: b.classList.contains('vp-on') }));
            const sceneHidden = document.querySelector('.room-stage').style.visibility === 'hidden';
            return { open: w.classList.contains('vp-open'), modes, sceneHidden, bar: !!w.querySelector('.vp-hunt-bar i, .vp-hunt-rings, .vp-hunt-radar, .vp-hunt-slots'), status: (w.querySelector('.vp-hunt-status') || {}).textContent };
        });
        check(!!win && win.open, 'окно поиска открылось');
        check(!!win && win.sceneHidden, 'сцена ивента спрятана');
        check(!!win && win.modes.length === 3, '3 режима (призраки/оборотни/оба)');
        check(!!win && win.modes.find(m => m.on && m.m === 'both'), 'по умолчанию «Оба»');
        check(!!win && win.bar, 'полоска есть');
        // ждём, пока поиск найдёт посты
        await p.waitForTimeout(6000);
        const tgts = await fr.evaluate(() => [...document.querySelectorAll('.vp-hunt-tgt')].map(t => ({ kind: t.className.replace(/.*vp-(poss|wolf).*/, '$1'), x: Math.round(t.getBoundingClientRect().x), y: Math.round(t.getBoundingClientRect().y) })));
        const stats = await fr.evaluate(() => ({
            scanned: (document.querySelector('.vp-hunt-scanned') || {}).textContent,
            found: (document.querySelector('.vp-hunt-found') || {}).textContent
        }));
        check(+stats.scanned > 0, `счётчик «проанализировано» растёт (${stats.scanned})`);
        check(+stats.found === tgts.length, `счётчик «найдено» совпадает (${stats.found} / ${tgts.length})`);
        check(tgts.length > 0, `сущности появились (${tgts.length})`);
        check(tgts.some(t => t.kind === 'poss'), 'есть призрак (радужная)');
        check(tgts.some(t => t.kind === 'wolf'), 'есть оборотень (фиолетовая)');
        // клик по цели: должна исчезнуть и из DOM, и из счётчика, и из сохранения
        // изгнанных среди целей нет
        const exTargets = tgts.filter(t => EX.includes(t.id));
        check(exTargets.length === 0, 'изгнанных среди целей нет');
        // «Назад» — до клика по цели, иначе iframe уедет на страницу поста
        await fr.click('.vp-hunt-back');
        await p.waitForTimeout(300);
        const closed = await fr.evaluate(() => ({
            open: (document.querySelector('.vp-hunt') || {}).classList ? document.querySelector('.vp-hunt').classList.contains('vp-open') : false,
            scene: document.querySelector('.room-stage').style.visibility
        }));
        check(!closed.open, 'окно закрылось по «Назад»');
        check(closed.scene !== 'hidden', 'сцена ивента вернулась');
        // снова открываем и кликаем по цели (последнее действие, iframe уедет)
        await fr.click('.vp-hunt-dev');
        await p.waitForTimeout(500);
        const beforeClick = await fr.evaluate(() => document.querySelectorAll('.vp-hunt-tgt:not(.vp-caught)').length);
        if (beforeClick > 0) {
            const clickRes = await fr.evaluate(() => {
                const t = document.querySelector('.vp-hunt-tgt:not(.vp-caught)');
                if (!t) return { ok: false };
                t.click();
                const caught = t.classList.contains('vp-caught');
                const foundNow = +(document.querySelector('.vp-hunt-found') || {}).textContent;
                const domNow = document.querySelectorAll('.vp-hunt-tgt:not(.vp-caught)').length;
                return { ok: true, caught, foundNow, domNow };
            });
            check(clickRes.ok && clickRes.caught, 'цель помечена «поймана» сразу при клике');
            check(clickRes.domNow === beforeClick - 1, `в поле осталось на одну меньше (${beforeClick} -> ${clickRes.domNow})`);
        }
    }
    if (errs.length) console.log('ERR:', JSON.stringify(errs.slice(0, 3)));
    check(errs.length === 0, 'нет ошибок страницы');
    await b.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();
