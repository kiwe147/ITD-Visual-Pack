// Оборотень: клик = лайк (POST /api/posts/:id/like), без перехода на пост.
// Призрак: клик = переход (как было).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, w) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + w); if (!ok) fails.push(w); };

const WOLF = 'p-0-2';
const GHOST = 'p-0-1';
const mkPage = () => Array.from({ length: 20 }, (_, i) => ({ id: 'p-0-' + i, author: { username: 'u' + i }, attachments: [] }));

(async () => {
    const b = await chromium.launch();
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    const errs = [];
    const likeReqs = [];
    let navCount = 0;
    p.on('pageerror', e => errs.push(e.message));
    await p.route('**/*', async r => {
        const u = new URL(r.request().url()), t = r.request().resourceType();
        if (u.pathname.startsWith('/public/events/halloween')) {
            return r.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><body style="margin:0;background:#221133"><div class="room-stage" style="position:relative;width:100%;height:80vh;background:#2a1a3a"></div></body></html>' });
        }
        if (u.origin === ORIGIN && t === 'document') {
            navCount++;
            return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
        }
        if (/\/like$/.test(u.pathname) && r.request().method() === 'POST') {
            likeReqs.push(u.pathname);
            return r.fulfill({ contentType: 'application/json', body: '{"ok":true}' });
        }
        if (t === 'image' || t === 'font') return r.abort();
        if (t === 'stylesheet') return r.continue();
        if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
        if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
        if (u.pathname === '/api/posts') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: mkPage(), pagination: { nextCursor: null } } }) });
        if (u.pathname === '/api/v1/halloween/feed-state') {
            const ids = (u.searchParams.get('posts') || '').split(',');
            const posts = {};
            for (const id of ids) {
                if (id === GHOST) posts[id] = { possession: { id: 'g', stage: 'calm', resolved: null } };
                else if (id === WOLF) posts[id] = { werewolf: { night: true } };
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
    await fr.click('.vp-hunt-dev');
    await p.waitForTimeout(9000);

    const found = await fr.evaluate(() => [...document.querySelectorAll('.vp-hunt-tgt')].map(t => ({
        cls: t.className, title: t.title
    })));
    console.log('TARGETS', JSON.stringify(found));
    check(found.some(t => t.cls.includes('vp-wolf')), 'волк на поле');
    check(found.some(t => t.cls.includes('vp-wolf') && /лайк/i.test(t.title)), 'у волка подсказка «лайк»');
    check(found.some(t => t.cls.includes('vp-poss') && /открыть пост/i.test(t.title)), 'у призрака подсказка «открыть пост»');

    const navBefore = navCount;
    const likesBefore = likeReqs.length;
    await fr.evaluate(() => {
        const t = [...document.querySelectorAll('.vp-hunt-tgt')].find(x => x.className.includes('vp-wolf'));
        if (t) t.click();
    });
    await p.waitForTimeout(1200);
    check(likeReqs.length === likesBefore + 1, `лайк ушёл (${likesBefore} -> ${likeReqs.length})`);
    check(likeReqs[likeReqs.length - 1] && likeReqs[likeReqs.length - 1].includes('/posts/' + WOLF + '/like'), 'лайк именно этого поста');
    check(navCount === navBefore, 'перехода на пост НЕ было');
    const wolfGone = await fr.evaluate(() => ![...document.querySelectorAll('.vp-hunt-tgt')].some(x => x.className.includes('vp-wolf') && !x.classList.contains('vp-caught')));
    check(wolfGone, 'волк убран с поля');

    const navBefore2 = navCount;
    const likesBefore2 = likeReqs.length;
    await fr.evaluate(() => {
        const t = [...document.querySelectorAll('.vp-hunt-tgt')].find(x => x.className.includes('vp-poss') && !x.classList.contains('vp-caught'));
        if (t) t.click();
    });
    await p.waitForTimeout(1200);
    check(likeReqs.length === likesBefore2, 'по призраку лайк не ставится');
    check(navCount > navBefore2, 'призрак ведёт на пост (переход был)');

    if (errs.length) console.log('ERR:', JSON.stringify(errs.slice(0, 3)));
    check(errs.length === 0, 'нет ошибок');
    await b.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();
