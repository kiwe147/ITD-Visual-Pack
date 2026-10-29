// Модалка маленькой тыквы: кнопки Поделиться/Скопировать/Закрыть + строка «спасибо».
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
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
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

    // вставляем маленькую тыкву (24px) с thanks и именем
    await p.evaluate(() => {
        const host = document.createElement('div');
        host.id = 'vpPvHost';
        host.style.cssText = 'position:fixed;top:100px;left:100px;z-index:99999';
        host.innerHTML = '<span data-halloween-pumpkin role="button" tabindex="0" aria-label="Тыква: #NeuroSFW | ИТД X" style="display:inline-block;width:24px;height:24px"><svg viewBox="0 0 100 100"><title>спасибо от 65 человек</title><circle cx="50" cy="50" r="40" fill="#f80"/></svg></span>';
        document.body.appendChild(host);
    });
    await p.waitForTimeout(300);
    const size = await p.evaluate(() => { const el = document.querySelector('[data-halloween-pumpkin]'); const r = el.getBoundingClientRect(); return { w: r.width, h: r.height }; });
    console.log('SIZE', JSON.stringify(size));
    check(size.w < 40, `тыква маленькая (${size.w}px)`);

    await p.evaluate(() => document.querySelector('[data-halloween-pumpkin]').click());
    await p.waitForTimeout(400);
    const r1 = await p.evaluate(() => {
        const ov = document.querySelector('.vp-pv-overlay');
        if (!ov) return { open: false };
        return {
            open: ov.classList.contains('vp-pv-on'),
            name: (ov.querySelector('.vp-pv-name') || {}).textContent,
            thanks: (ov.querySelectorAll('.vp-pv-hint')[0] || {}).textContent || '',
            buttons: [...ov.querySelectorAll('.vp-pv-btn')].map(b => b.textContent.trim())
        };
    });
    console.log('MODAL', JSON.stringify(r1));
    check(r1.open, 'модалка открылась');
    check(r1.name === '#NeuroSFW | ИТД X', `имя: «${r1.name}»`);
    check(/Фонарь светит/i.test(r1.thanks) && /спасибо от 65 человек/.test(r1.thanks), `строка thanks: «${r1.thanks}»`);
    check(r1.buttons.includes('Поделиться') && r1.buttons.includes('Скопировать') && r1.buttons.includes('Закрыть'), `3 кнопки: ${JSON.stringify(r1.buttons)}`);

    // Скопировать — в буфер должен попасть URL
    await p.evaluate(() => { const b = [...document.querySelectorAll('.vp-pv-btn')].find(x => x.textContent.trim() === 'Скопировать'); if (b) b.click(); });
    await p.waitForTimeout(400);
    const clip = await p.evaluate(async () => { try { return await navigator.clipboard.readText(); } catch (e) { return 'ERR ' + e.message; } });
    console.log('CLIP', JSON.stringify(clip));
    check(clip && clip.includes(ORIGIN), `URL в буфере: ${clip.slice(0, 60)}`);

    // Закрыть — модалка исчезает
    await p.evaluate(() => { const b = [...document.querySelectorAll('.vp-pv-btn')].find(x => x.textContent.trim() === 'Закрыть'); if (b) b.click(); });
    await p.waitForTimeout(400);
    const closed = await p.evaluate(() => !document.querySelector('.vp-pv-overlay'));
    check(closed, 'закрылась по кнопке «Закрыть»');

    // Большая тыква (120px) — моя модалка НЕ должна перехватывать
    await p.evaluate(() => {
        const big = document.createElement('span');
        big.id = 'vpBig';
        big.setAttribute('data-halloween-pumpkin', 'true');
        big.style.cssText = 'position:fixed;top:300px;left:100px;display:inline-block;width:120px;height:120px';
        big.innerHTML = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#0f0"/></svg>';
        document.body.appendChild(big);
    });
    await p.waitForTimeout(300);
    await p.evaluate(() => document.getElementById('vpBig').click());
    await p.waitForTimeout(400);
    const bigRes = await p.evaluate(() => ({ hasModal: !!document.querySelector('.vp-pv-overlay') }));
    check(!bigRes.hasModal, 'на большой тыкве моя модалка не открылась (сайт сам разберётся)');

    await p.screenshot({ path: 'test/out/pumpkinviewer2.png' });
    if (errs.length) console.log('ERR:', JSON.stringify(errs.slice(0, 3)));
    check(errs.length === 0, 'нет ошибок');
    await b.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();
