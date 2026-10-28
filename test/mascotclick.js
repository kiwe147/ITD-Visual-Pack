// Маскот не должен съедать клики по чужим элементам (окно охоты лежит поверх).
// Маскот вставляем вручную (в тесте нет blob с GitHub), маску подменяем.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, w) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + w); if (!ok) fails.push(w); };

(async () => {
    const b = await chromium.launch();
    const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
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
        if (u.pathname === '/api/posts') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: [], pagination: { nextCursor: null } } }) });
        return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(() => {
        const st = { palMiku: false, palTeto: false, palsEnabled: false, introEnabled: false, backgroundEnabled: false, mascotOn: true };
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
    if (!fr) { await b.close(); process.exit(1); }

    // вставляем маскот вручную + включаем «клик по нему»
    const res = await fr.evaluate(() => {
        const d = document;
        if (!d.querySelector('.vp-mas')) {
            const m = d.createElement('div');
            m.className = 'vp-mas';
            m.style.cssText = 'position:fixed;left:40%;top:40%;width:200px;height:200px;z-index:9000;pointer-events:auto;background:transparent;';
            m.innerHTML = '<div class="vp-mas-pic" style="width:200px;height:200px;background:#000;"></div><div class="vp-mas-say"></div>';
            d.body.appendChild(m);
        }
        const mas = d.querySelector('.vp-mas');
        const r = mas.getBoundingClientRect();
        // чужая «цель» ровно в центре маскота
        const btn = d.createElement('div');
        btn.id = 'vpTestTarget';
        btn.style.cssText = 'position:fixed;z-index:99999;width:80px;height:80px;border-radius:50%;background:#f0f;left:' + (r.left + r.width / 2 - 40) + 'px;top:' + (r.top + r.height / 2 - 40) + 'px;';
        d.body.appendChild(btn);
        let hits = 0;
        btn.addEventListener('click', () => hits++, true);
        const say = mas.querySelector('.vp-mas-say');
        const before = say ? say.textContent : '';
        btn.click();
        return new Promise(ok => setTimeout(() => ok({ hits, sayBefore: before, sayAfter: say ? say.textContent : '', hasMas: true }), 400));
    });
    console.log('RES', JSON.stringify(res));
    check(res.hits === 1, `клик по чужому элементу поверх маскота дошёл до цели (${res.hits})`);
    check(res.sayAfter === res.sayBefore, `маскот не сказал ничего на чужой клик (было: «${res.sayBefore}», стало: «${res.sayAfter}»)`);

    if (errs.length) console.log('ERR:', JSON.stringify(errs.slice(0, 3)));
    check(errs.length === 0, 'нет ошибок');
    await b.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();
