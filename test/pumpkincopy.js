// Кнопка «Скопировать» — открывает нативную модалку и жмёт её «Скопировать».
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const PX_B64 = fs.readFileSync('C:/Code/MK2_V2/agent/_px.png').toString('base64');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, w) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + w); if (!ok) fails.push(w); };

(async () => {
    const b = await chromium.launch();
    const ctx = await b.newContext({ viewport: { width: 1200, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const p = await ctx.newPage();
    const errs = [];
    let nativeCopies = 0;
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

    // Имитируем сайт: при клике на тыкву открывает свою модалку с кнопкой «Скопировать»,
    // которая делает композит и пишет в буфер.
    await p.evaluate(([pxB64]) => {
        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;top:100px;left:100px;z-index:99999';
        host.innerHTML = '<span id="vpTiny" data-halloween-pumpkin role="button" tabindex="0" aria-label="Тыква: Тест" style="display:inline-block;width:24px;height:24px"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#f80"/></svg></span>';
        document.body.appendChild(host);

        // Обработчик, имитирующий поведение сайта: клик на тыкву = открыть модалку
        document.getElementById('vpTiny').addEventListener('click', () => {
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483500;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center';
            overlay.innerHTML = '<div role="dialog" aria-modal="true" aria-label="Тыква: Тест" style="background:#222;padding:24px;border-radius:16px;color:#fff;min-width:300px;text-align:center"><p>Нативная модалка</p><button class="natCopy">Скопировать</button> <button class="natClose">Закрыть</button></div>';
            document.body.appendChild(overlay);
            overlay.querySelector('.natCopy').addEventListener('click', async () => {
                window.__NATIVE_COPIES = (window.__NATIVE_COPIES || 0) + 1;
                const cvs = document.createElement('canvas');
                cvs.width = 1080; cvs.height = 1350;
                const cx = cvs.getContext('2d');
                cx.fillStyle = '#a34'; cx.fillRect(0, 0, 1080, 1350);
                const blob = await new Promise(ok => cvs.toBlob(ok, 'image/png'));
                try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); } catch (e) { }
            });
            overlay.querySelector('.natClose').addEventListener('click', () => overlay.remove());
        });
    }, [PX_B64]);
    await p.waitForTimeout(300);

    // Клик по маленькой тыкве — наша модалка
    await p.evaluate(() => document.getElementById('vpTiny').click());
    await p.waitForTimeout(400);
    const r0 = await p.evaluate(() => ({
        ourOpen: !!document.querySelector('.vp-pv-overlay'),
        nativeOpen: !!document.querySelector('[role="dialog"][aria-label="Тыква: Тест"]')
    }));
    console.log('AFTER OPEN', JSON.stringify(r0));
    check(r0.ourOpen, 'наша модалка открылась');
    check(!r0.nativeOpen, 'нативная модалка НЕ открылась (перехвачено нами)');

    // Жмём нашу «Скопировать»
    await p.evaluate(() => { const b = [...document.querySelectorAll('.vp-pv-btn')].find(x => x.textContent.trim() === 'Скопировать'); if (b) b.click(); });
    await p.waitForTimeout(1500);

    const r1 = await p.evaluate(() => ({
        nativeCopies: window.__NATIVE_COPIES || 0,
        nativeOpen: !!document.querySelector('[role="dialog"][aria-label="Тыква: Тест"]'),
        ourOpen: !!document.querySelector('.vp-pv-overlay'),
        toast: (document.querySelector('.vp-pv-toast b') || {}).textContent || ''
    }));
    console.log('AFTER COPY', JSON.stringify(r1));
    check(r1.nativeCopies === 1, `нативная «Скопировать» нажалась (${r1.nativeCopies})`);
    check(!r1.nativeOpen, 'нативная модалка закрылась');
    check(r1.ourOpen, 'наша модалка ещё открыта');
    check(r1.toast === 'Картинка скопирована', `тост: «${r1.toast}»`);

    // Проверяем содержимое буфера (1080×1350)
    const dims = await p.evaluate(async () => {
        try {
            const cl = await navigator.clipboard.read();
            for (const it of cl) {
                if (it.types.includes('image/png')) {
                    const blob = await it.getType('image/png');
                    const bmp = await createImageBitmap(blob);
                    return { w: bmp.width, h: bmp.height };
                }
            }
        } catch (e) { return { err: e.message }; }
        return null;
    });
    console.log('DIMS', JSON.stringify(dims));
    check(!!dims && dims.w === 1080 && dims.h === 1350, `композит 1080×1350 (${JSON.stringify(dims)})`);

    if (errs.length) console.log('ERR:', JSON.stringify(errs.slice(0, 3)));
    check(errs.length === 0, 'нет ошибок');
    await b.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();
