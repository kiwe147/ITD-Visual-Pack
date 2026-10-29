// Своя модалка тыквы: открывается по клику, не закрывается сама (баг сайта — закрывалась при перерисовке).
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
    await p.waitForTimeout(500);

    // вставляем «тыкву» как на сайте: span[data-halloween-pumpkin] c svg
    await p.evaluate(() => {
        const host = document.createElement('div');
        host.id = 'vpPvHost';
        host.style.cssText = 'position:fixed;top:100px;left:100px;width:120px;height:120px;z-index:99999';
        host.innerHTML = '<span data-halloween-pumpkin role="button" tabindex="0" aria-label="Тыква: Тестовый Ник"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#f80"/></svg></span>';
        document.body.appendChild(host);
    });
    await p.waitForTimeout(300);

    await p.evaluate(() => document.querySelector('[data-halloween-pumpkin]').click());
    await p.waitForTimeout(400);
    const r1 = await p.evaluate(() => {
        const ov = document.querySelector('.vp-pv-overlay');
        if (!ov) return { open: false };
        return {
            open: ov.classList.contains('vp-pv-on'),
            hasSvg: !!ov.querySelector('.vp-pv-pic svg'),
            name: (ov.querySelector('.vp-pv-name') || {}).textContent,
            hasClose: !!ov.querySelector('.vp-pv-close')
        };
    });
    console.log('OPEN', JSON.stringify(r1));
    check(r1.open, 'модалка открылась');
    check(r1.hasSvg, 'внутри svg тыквы');
    check(r1.name === 'Тестовый Ник', `имя: «${r1.name}»`);
    check(r1.hasClose, 'есть кнопка закрытия');

    // «перерисовка»: клик по телу страницы не должен закрывать, если это не мы
    await p.evaluate(() => document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
    await p.waitForTimeout(400);
    const r2 = await p.evaluate(() => !!(document.querySelector('.vp-pv-overlay')));
    check(r2, 'модалка не закрылась сама через 0.4с');

    await p.waitForTimeout(2000);
    const r3 = await p.evaluate(() => !!(document.querySelector('.vp-pv-overlay')));
    check(r3, 'модалка не закрылась сама через 2.4с');

    await p.evaluate(() => document.querySelector('.vp-pv-close').click());
    await p.waitForTimeout(400);
    const r4 = await p.evaluate(() => !document.querySelector('.vp-pv-overlay'));
    check(r4, 'закрылась по крестику');

    // Esc
    await p.evaluate(() => document.querySelector('[data-halloween-pumpkin]').click());
    await p.waitForTimeout(300);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(400);
    const r5 = await p.evaluate(() => !document.querySelector('.vp-pv-overlay'));
    check(r5, 'закрылась по Esc');

    await p.screenshot({ path: 'test/out/pumpkinviewer.png' });
    if (errs.length) console.log('ERR:', JSON.stringify(errs.slice(0, 3)));
    check(errs.length === 0, 'нет ошибок');
    await b.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();
