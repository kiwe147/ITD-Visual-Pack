// Подложка для тыквы: блок вставляется после «Сохранить тыкву» в iframe ивента.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, w) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + w); if (!ok) fails.push(w); };

const PUMPKIN_HTML = `<!doctype html><html><head><style>body{font:14px system-ui;background:#1a1a2a;color:#fff;padding:20px}.panel{max-width:400px}</style></head><body>
<div class="panel">
  <div class="carve-side">
    <button type="button" class="btn-secondary">Как это видно</button>
    <label>Показывать в профиле <input type="checkbox" checked></label>
    <div>Вырезов 14 из 24</div>
    <button type="button" class="btn-save">Сохранить тыкву</button>
    <div class="empty-block" style="height:120px;border:1px dashed #555;margin-top:8px"></div>
  </div>
</div>
<script>console.log('pumpkin iframe ready');</script>
</body></html>`;

(async () => {
    const b = await chromium.launch();
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.route('**/*', async r => {
        const u = new URL(r.request().url()), t = r.request().resourceType();
        if (u.pathname === '/public/events/halloween/pumpkin') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: PUMPKIN_HTML });
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
    await p.goto(ORIGIN + '/event/halloween/pumpkin');
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-msgs, .vp-pals, .vp-itdx-btn').forEach(e => e.remove()));

    // вставляем iframe с кнопкой «Сохранить тыкву»
    await p.evaluate(() => {
        const f = document.createElement('iframe');
        f.src = '/public/events/halloween/pumpkin';
        f.style.cssText = 'width:800px;height:600px;border:1px solid #444';
        document.body.appendChild(f);
    });
    await p.waitForTimeout(800);
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2000);

    const fr = p.frames().find(f => f.url().includes('/public/events/halloween/pumpkin'));
    check(!!fr, 'iframe с тыквой найден');
    if (!fr) { await b.close(); process.exit(1); }

    const r1 = await fr.evaluate(() => {
        const bl = document.querySelector('.vp-ps-block');
        const save = [...document.querySelectorAll('button')].find(b => /Сохранить тыкву/.test(b.textContent));
        if (!bl) return { hasBlock: false, hasSave: !!save };
        const prev = bl.previousElementSibling;
        return {
            hasBlock: true, hasSave: !!save,
            afterSave: prev === save,
            title: (bl.querySelector('.vp-ps-title') || {}).textContent || '',
            btns: [...bl.querySelectorAll('.vp-ps-btn')].map(b => b.textContent.trim())
        };
    });
    console.log('BLOCK', JSON.stringify(r1));
    check(r1.hasBlock, 'блок вставлен');
    check(r1.afterSave, 'блок стоит после «Сохранить тыкву»');
    check(/Подложка/.test(r1.title), `заголовок: «${r1.title.trim()}»`);
    check(r1.btns.length === 3, `3 кнопки: ${JSON.stringify(r1.btns)}`);
    check(r1.btns.includes('Загрузить картинку') && r1.btns.includes('Настроить') && r1.btns.includes('Убрать'), 'все нужные кнопки');

    // «Настроить» раскрывает слайдеры
    await fr.evaluate(() => { const b = [...document.querySelectorAll('.vp-ps-btn')].find(x => x.textContent.trim() === 'Настроить'); if (b) b.click(); });
    await p.waitForTimeout(200);
    const r2 = await fr.evaluate(() => {
        const rows = document.querySelector('.vp-ps-rows');
        return { visible: rows ? rows.classList.contains('vp-ps-show') : false, n: rows ? rows.querySelectorAll('.vp-ps-row').length : 0,
                 labels: rows ? [...rows.querySelectorAll('label')].map(l => l.textContent) : [] };
    });
    console.log('ROWS', JSON.stringify(r2));
    check(r2.visible, 'слайдеры раскрыты по «Настроить»');
    check(r2.n === 4, `4 слайдера: ${JSON.stringify(r2.labels)}`);
    check(r2.labels.join(',') === 'X,Y,Размер,Прозрачность', 'подписи слайдеров');

    // «Загрузить картинку» — file chooser
    let chooserOpened = false;
    p.once('filechooser', async (fc) => { chooserOpened = true; await fc.setFiles({ name: 't.png', mimeType: 'image/png', buffer: Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,6,0,0,0,31,21,196,137,0,0,0,13,73,68,65,84,120,156,99,0,1,0,0,5,0,1,13,10,45,180,0,0,0,0,73,69,78,68,174,66,96,130]) }); });
    await fr.evaluate(() => { const b = [...document.querySelectorAll('.vp-ps-btn')].find(x => x.textContent.trim() === 'Загрузить картинку'); if (b) b.click(); });
    await p.waitForTimeout(600);
    check(chooserOpened, 'по клику «Загрузить картинку» открылся диалог выбора файла');

    const r3 = await fr.evaluate(() => {
        const im = document.querySelector('.vp-ps-img');
        if (!im) return { hasImg: false };
        const s = getComputedStyle(im);
        return { hasImg: true, pe: s.pointerEvents, pos: s.position, left: s.left, top: s.top, width: s.width, opacity: s.opacity };
    });
    console.log('IMG', JSON.stringify(r3));
    check(r3.hasImg, 'картинка вставлена в iframe');
    check(r3.pe === 'none', 'клики проходят сквозь картинку');

    // меняем «Размер» — картинка должна вырасти
    if (r3.hasImg) {
        const before = r3.width;
        await fr.evaluate(() => {
            const rows = [...document.querySelectorAll('.vp-ps-row')];
            const sizeRow = rows.find(r => /Размер/.test(r.querySelector('label').textContent));
            const inp = sizeRow.querySelector('input');
            inp.value = 800;
            inp.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await p.waitForTimeout(200);
        const after = await fr.evaluate(() => { const im = document.querySelector('.vp-ps-img'); return im ? getComputedStyle(im).width : ''; });
        console.log('SIZE', before, '->', after);
        check(parseInt(after) > parseInt(before), `размер меняется (${before} → ${after})`);
    }

    await p.screenshot({ path: 'test/out/pumpkinstencil.png', clip: { x: 0, y: 0, width: 1400, height: 900 } });
    if (errs.length) console.log('ERR:', JSON.stringify(errs.slice(0, 3)));
    check(errs.length === 0, 'нет ошибок');
    await b.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();
