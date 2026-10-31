        function pillButton(cls, title, icon, open) {
            const b = document.createElement('span');
            b.className = 'vp-pill-btn ' + cls;
            b.title = title;
            b.innerHTML = icon;
            b.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                open(b);
            });
            return b;
        }
        function findNukstaButton(from) {
            for (let el = from, i = 0; el && i < 6; el = el.parentElement, i++) {
                const b = [...el.querySelectorAll('button')].find(x => !x.classList.contains('vp-itdx-btn') && /нукста/i.test(x.textContent));
                if (b) return b;
            }
            return null;
        }
        function addToggleButtonToNick(ru5n) {
            const nickSpan = ru5n.querySelector('.' + SELECTORS.nickText);
            if (!nickSpan) return;
            const nickText = nickSpan.textContent.trim();
            if (nickText !== myUsername && nickText !== myDisplayName) return;

            const nuksta = findNukstaButton(ru5n);
            if (nuksta) {
                nuksta.classList.add('vp-nuksta-hidden');
                const next = nuksta.nextElementSibling;
                if (!next || !next.classList.contains('vp-itdx-btn')) {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.className = nuksta.className.replace('vp-nuksta-hidden', '').trim() + ' vp-itdx-btn';
                    b.innerHTML = ICONS.SLIDERS + '<span>ИТД X</span>';
                    b.title = 'Настройки ИТД X';
                    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openSettingsMenu(b); });
                    nuksta.after(b);
                    if (innerWidth <= PHONE_MAX && !nuksta.parentElement.querySelector('.vp-menu-btn')) {
                        const m = document.createElement('button');
                        m.type = 'button';
                        m.className = b.className.replace('vp-itdx-btn', '').trim() + ' vp-menu-btn';
                        m.textContent = 'Меню';
                        m.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openMobileMenu(); });
                        b.after(m);
                    }
                }
                document.querySelectorAll('.nick-controls-panel').forEach(p => p.remove());
                return;
            }
            if (document.querySelector('.vp-itdx-btn') || ru5n.querySelector('.nick-controls-panel')) return;
            const panel = document.createElement('div');
            panel.className = 'nick-controls-panel';
            panel.append(pillButton('settings-toggle', 'ИТД X', ICONS.SLIDERS, openSettingsMenu));
            const nick = ru5n.querySelector('.' + SELECTORS.nickContainer);
            if (nick) nick.after(panel);
            else ru5n.appendChild(panel);
        }

        const bannerEdit = { banner: null, img: null, url: null, top: 0, drag: null };
        const bannerBtns = { row: null, draw: null, del: null, image: null, change: null, cancel: null, apply: null };

        const styleBanner = addCss(`
        .custom-image-btn:hover, .custom-change-btn:hover {
            background: var(--accent-primary) !important;
            color: #fff !important;
        }
        .custom-cancel-btn:hover { background: #dc3545cc !important; }
        .custom-apply-btn:hover { background: #28a745cc !important; }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .vp-banner-buttons:not(.vp-banner-editing) :is(.custom-change-btn, .custom-cancel-btn, .custom-apply-btn),
        .vp-banner-buttons.vp-banner-editing > :not(.custom-change-btn, .custom-cancel-btn, .custom-apply-btn) { display: none !important; }
        .vp-banner.vp-banner-editing { position: relative; overflow: hidden; z-index: 0; }
        .vp-banner-buttons.vp-banner-editing { pointer-events: none; }
        .vp-banner-buttons.vp-banner-editing > button { pointer-events: auto; }
        .vp-banner.vp-banner-editing > img:not(.vp-banner-drag) { position: relative; z-index: -3; }
        .vp-banner > img.vp-banner-drag {
            position: absolute; left: 0; top: 0; width: 100%; height: auto; z-index: -1;
            cursor: grab; user-select: none; -webkit-user-drag: none; touch-action: none;
            transition: top 0.1s ease-out;
        }
        .vp-banner > img.vp-banner-drag.vp-dragging { cursor: grabbing; transition: none; }
    `);

        function bannerButton(cls, title, icon) {
            const b = document.createElement('button');
            b.className = siteClasses(bannerBtns.draw) + ' ' + cls;
            b.title = title;
            b.innerHTML = icon;
            return b;
        }
        function createAllButtons() {
            const row = siteEl('bannerButtons');
            if (!row || row.querySelector('.custom-image-btn')) return;
            const B = bannerBtns;
            B.row = row;
            B.draw = row.querySelector('button:not(.' + SELECTORS.bannerDelete + ')');
            B.del = row.querySelector('.' + SELECTORS.bannerDelete);
            B.image = bannerButton('custom-image-btn', 'Добавить картинку', ICONS.BANNER_IMAGE);
            B.change = bannerButton('custom-change-btn', 'Сменить картинку', ICONS.BANNER_CHANGE);
            B.cancel = bannerButton('custom-cancel-btn', 'Отмена', ICONS.BANNER_CANCEL);
            B.apply = bannerButton('custom-apply-btn', 'Применить', ICONS.BANNER_APPLY);
            row.insertBefore(B.image, B.del);
            row.append(B.change, B.cancel, B.apply);
            B.image.onclick = B.change.onclick = pickBannerFile;
            B.cancel.onclick = () => setBannerEditing(false);
            B.apply.onclick = applyBanner;
        }

        function pickBannerFile() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/jpeg,image/png,image/webp,image/gif';
            input.onchange = () => {
                const file = input.files[0];
                if (file) putBannerImage(URL.createObjectURL(file));
            };
            input.click();
        }

        function setBannerEditing(on) {
            const E = bannerEdit;
            if (!on) {
                if (E.img) E.img.remove();
                if (E.url) URL.revokeObjectURL(E.url);
                E.img = E.url = E.drag = null;
                E.top = 0;
            }
            if (E.banner) E.banner.classList.toggle('vp-banner-editing', on);
            if (bannerBtns.row) bannerBtns.row.classList.toggle('vp-banner-editing', on);
            if (bannerBtns.apply && !on) { bannerBtns.apply.innerHTML = ICONS.BANNER_APPLY; bannerBtns.apply.disabled = false; }
        }

        function putBannerImage(url) {
            const banner = siteEl('banner');
            if (!banner) return;
            setBannerEditing(false);
            const E = bannerEdit;
            E.banner = banner;
            E.url = url;
            E.img = document.createElement('img');
            E.img.className = 'vp-banner-drag';
            E.img.draggable = false;
            E.img.src = url;
            banner.appendChild(E.img);
            const center = () => moveBannerImage((banner.clientHeight - E.img.offsetHeight) / 2, true);
            E.img.onload = center;
            if (E.img.complete) center();
            setBannerEditing(true);
        }

        function moveBannerImage(top, free) {
            const E = bannerEdit;
            if (!E.img) return;
            E.top = free ? top : Math.max(E.banner.clientHeight - E.img.offsetHeight, Math.min(0, top));
            E.img.style.top = E.top + 'px';
        }
        const bannerMovable = () => bannerEdit.img && bannerEdit.img.offsetHeight > bannerEdit.banner.clientHeight;

        document.addEventListener('pointerdown', e => {
            const E = bannerEdit;
            if (e.target !== E.img || !bannerMovable()) return;
            e.preventDefault();
            E.drag = { y: e.clientY, top: E.top };
            E.img.classList.add('vp-dragging');
            E.img.setPointerCapture(e.pointerId);
        });
        document.addEventListener('pointermove', e => {
            const E = bannerEdit;
            if (!E.drag) return;
            e.preventDefault();
            moveBannerImage(E.drag.top + e.clientY - E.drag.y);
        });
        const endBannerDrag = () => {
            const E = bannerEdit;
            if (!E.drag) return;
            E.drag = null;
            if (E.img) E.img.classList.remove('vp-dragging');
        };
        document.addEventListener('pointerup', endBannerDrag);
        document.addEventListener('pointercancel', endBannerDrag);
        document.addEventListener('wheel', e => {
            const E = bannerEdit;
            if (!E.img || E.drag || !E.banner.contains(e.target)) return;
            e.preventDefault();
            if (bannerMovable()) moveBannerImage(E.top + (e.deltaY > 0 ? -30 : 30));
        }, { passive: false });

        function cropBannerImage() {
            return new Promise((resolve, reject) => {
                const img = bannerEdit.img;
                const br = bannerEdit.banner.getBoundingClientRect(), ir = img.getBoundingClientRect();
                const sx = img.naturalWidth / img.offsetWidth, sy = img.naturalHeight / img.offsetHeight;
                const x = Math.max(0, br.left - ir.left) * sx, y = Math.max(0, br.top - ir.top) * sy;
                const w = (Math.min(ir.right, br.right) - Math.max(ir.left, br.left)) * sx;
                const h = (Math.min(ir.bottom, br.bottom) - Math.max(ir.top, br.top)) * sy;
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const src = new Image();
                src.crossOrigin = 'anonymous';
                src.onload = () => {
                    canvas.getContext('2d').drawImage(src, x, y, w, h, 0, 0, w, h);
                    canvas.toBlob(resolve, 'image/jpeg', 0.95);
                };
                src.onerror = reject;
                src.src = img.src;
            });
        }

        function bannerImageData() {
            return new Promise((resolve, reject) => {
                const img = bannerEdit.img;
                const br = bannerEdit.banner.getBoundingClientRect(), ir = img.getBoundingClientRect();
                const sx = img.naturalWidth / img.offsetWidth, sy = img.naturalHeight / img.offsetHeight;
                const x = Math.max(0, br.left - ir.left) * sx, y = Math.max(0, br.top - ir.top) * sy;
                const w = (Math.min(ir.right, br.right) - Math.max(ir.left, br.left)) * sx;
                const h = (Math.min(ir.bottom, br.bottom) - Math.max(ir.top, br.top)) * sy;
                const W = 1100, H = 380;
                const canvas = document.createElement('canvas');
                canvas.width = W; canvas.height = H;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, W, H);
                const src = new Image();
                src.crossOrigin = 'anonymous';
                src.onload = () => {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(src, x, y, w, h, 0, 0, W, H);
                    resolve(ctx.getImageData(0, 0, W, H));
                };
                src.onerror = reject;
                src.src = img.src;
            });
        }

        function bannerQuantStep(colors) {
            const n = Math.max(2, Math.min(16, Math.round(Math.cbrt(colors))));
            return Math.round(255 / (n - 1));
        }

        const BANNER_MAX_OPS = 1990, BANNER_MAX_POINTS = 55000;
        function bannerBlocksToOps(imgData, bw, bh, thr, skipLight, useAnchor) {
            const W = imgData.width, H = imgData.height, d = imgData.data;
            const hex = (r, g, b) => '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
            const th2 = thr * thr;
            const ops = [];
            const nCols = Math.ceil(W / bw);
            const SK = skipLight || 0;
            for (let y = 0; y < H; y += bh) {
                const y1 = Math.min(y + bh, H);
                const yc = Math.min(y + (bh >> 1), H - 1);
                const cols = new Array(nCols);
                for (let c = 0; c < nCols; c++) {
                    const x0 = c * bw, x1 = Math.min(x0 + bw, W);
                    let sr = 0, sg = 0, sb = 0, n = 0;
                    for (let yy = y; yy < y1; yy++) {
                        let o = (yy * W + x0) * 4;
                        for (let xx = x0; xx < x1; xx++, o += 4) { sr += d[o]; sg += d[o + 1]; sb += d[o + 2]; n++; }
                    }
                    const ar = sr / n, ag = sg / n, ab = sb / n;
                    cols[c] = (SK && ar > SK && ag > SK && ab > SK) ? null : [ar, ag, ab];
                }
                let start = -1, csr = 0, csg = 0, csb = 0, cnt = 0, aR = 0, aG = 0, aB = 0;
                const flush = (endCol) => {
                    if (start < 0) return;
                    if (endCol <= start) return;
                    const rr = Math.round(csr / cnt), gg = Math.round(csg / cnt), bb = Math.round(csb / cnt);
                    ops.push({ tool: 'brush', color: hex(rr, gg, bb), width: bh,
                               points: [[start * bw, yc], [endCol * bw - 1, yc]] });
                };
                for (let c = 0; c < nCols; c++) {
                    if (cols[c] === null) { flush(c); start = -1; continue; }
                    if (start < 0) {
                        start = c; csr = cols[c][0]; csg = cols[c][1]; csb = cols[c][2]; cnt = 1;
                        aR = csr; aG = csg; aB = csb; continue;
                    }
                    const refR = useAnchor ? aR : csr / cnt;
                    const refG = useAnchor ? aG : csg / cnt;
                    const refB = useAnchor ? aB : csb / cnt;
                    const dr = cols[c][0] - refR, dg = cols[c][1] - refG, db = cols[c][2] - refB;
                    if (dr * dr + dg * dg + db * db < th2) {
                        csr += cols[c][0]; csg += cols[c][1]; csb += cols[c][2]; cnt++;
                    } else {
                        flush(c);
                        start = c; csr = cols[c][0]; csg = cols[c][1]; csb = cols[c][2]; cnt = 1;
                        aR = csr; aG = csg; aB = csb;
                    }
                }
                flush(nCols);
            }
            return { version: 1, width: W, height: H, ops: ops, _points: ops.length * 2 };
        }

        function bannerScore(imgData, body) {
            const W = imgData.width, H = imgData.height;
            const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
            const cx = cv.getContext('2d', { willReadFrequently: true });
            cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, W, H);   
            for (const op of body.ops) {
                cx.strokeStyle = op.color;
                cx.fillStyle = op.color;
                cx.lineWidth = op.width;
                cx.lineCap = 'round';
                const p = op.points;
                cx.beginPath();
                cx.moveTo(p[0][0] + 0.5, p[0][1] + 0.5);
                cx.lineTo(p[1][0] + 0.5, p[1][1] + 0.5);
                cx.stroke();
            }
            const rd = cx.getImageData(0, 0, W, H).data;
            const od = imgData.data;
            let sum = 0, n = 0;
            for (let i = 0; i < od.length; i += 16) {  
                const dr = od[i] - rd[i], dg = od[i+1] - rd[i+1], db = od[i+2] - rd[i+2];
                sum += dr*dr + dg*dg + db*db; n += 3;
            }
            return Math.sqrt(sum / n);
        }

        function bannerPixelToOps(imgData, brush, thr) {
            const W = imgData.width, H = imgData.height, d = imgData.data;
            const hex = (r, g, b) => '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
            const ops = [];
            const th2 = thr * thr;
            for (let y = 0; y < H; y += brush) {
                const yc = Math.min(y + (brush >> 1), H - 1);
                const rowOff = yc * W * 4;
                let start = 0, sr = 0, sg = 0, sb = 0, cnt = 0;
                for (let x = 0; x < W; x++) {
                    const o = rowOff + x * 4;
                    const r = d[o], g = d[o + 1], b = d[o + 2];
                    if (cnt === 0) { sr = r; sg = g; sb = b; cnt = 1; continue; }
                    const ar = sr / cnt, ag = sg / cnt, ab = sb / cnt;
                    const dr = r - ar, dg = g - ag, db = b - ab;
                    if (dr * dr + dg * dg + db * db < th2) { sr += r; sg += g; sb += b; cnt++; }
                    else {
                        ops.push({ tool: 'brush', color: hex(Math.round(sr / cnt), Math.round(sg / cnt), Math.round(sb / cnt)), width: brush, points: [[start, yc], [x - 1, yc]] });
                        start = x; sr = r; sg = g; sb = b; cnt = 1;
                    }
                }
                ops.push({ tool: 'brush', color: hex(Math.round(sr / cnt), Math.round(sg / cnt), Math.round(sb / cnt)), width: brush, points: [[start, yc], [W - 1, yc]] });
            }
            const merged = [];
            for (const op of ops) {
                const last = merged[merged.length - 1];
                if (last && last.color === op.color && last.points[0][1] === op.points[0][1] && last.points[1][0] + 1 === op.points[0][0]) {
                    last.points[1] = op.points[1];
                } else merged.push(op);
            }
            return { version: 1, width: W, height: H, ops: merged, _points: merged.length * 2 };
        }

        async function uploadBannerDrawing(body, token) {
            const payload = { version: 1, width: body.width, height: body.height, ops: body.ops };
            const res = await fetch('/api/files/banner-drawing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            let data = null;
            try { data = await res.json(); } catch (e) { }
            if (!res.ok) {
                const msg = (data && data.error && data.error.message) || (data && data.message) || `Ошибка ${res.status}`;
                const err = new Error(msg);
                err.status = res.status;
                throw err;
            }
            return data;
        }

        async function uploadBannerFile(blob, token) {
            return new Promise((resolve, reject) => {
                const form = new FormData();
                form.append('file', blob, blob.name || 'banner.jpg');
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/files/upload');
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.onload = () => {
                    let data = null;
                    try { data = JSON.parse(xhr.responseText); } catch (e) { }
                    if (xhr.status >= 200 && xhr.status < 300) return data ? resolve(data) : reject(new Error('Ошибка загрузки: ответ не JSON'));
                    reject(new Error(data ? (data.error?.message || data.message || `Ошибка ${xhr.status}`) : `Ошибка загрузки: ${xhr.status}`));
                };
                xhr.onerror = () => reject(new Error('Ошибка сети'));
                xhr.send(form);
            });
        }

        async function applyBanner() {
            const E = bannerEdit, apply = bannerBtns.apply;
            if (!E.img || !E.banner) return;
            apply.innerHTML = ICONS.LOADING;
            apply.disabled = true;
            try {
                const token = await getAccessToken();
                const imgData = await bannerImageData();
                const onProg = (msg) => {
                    if (!apply.isConnected) return;
                    apply.title = msg;
                };
                const auto = await __vpBannerAuto.autoBanner(
                    { width: imgData.width, height: imgData.height, data: imgData.data },
                    onProg
                );
                const body = { version: 1, width: 1100, height: 380, ops: auto.ops };
                const label = auto.cell + 'px, ' + auto.colors + ' цв., связн. ' + auto.merge + ', пятна ' + auto.minArea + ' px²';
                console.log('[ITD VP] баннер-рисунок:', label, auto.opsCount, 'штрихов, ΔE', auto.dE.toFixed(2));
                if (apply.isConnected) apply.title = label + ' · ' + auto.opsCount + ' штрихов · ΔE ' + auto.dE.toFixed(2);
                if (!auto.fits) {
                    console.warn('[ITD VP] баннер не влез в лимиты:', auto.opsCount, 'штрихов');
                    alert('Рисунок получился слишком сложным для сайта (' + auto.opsCount + ' штрихов, можно 2000).\nПопробуй другую картинку или кадрируй её проще.');
                    if (apply.isConnected) { apply.innerHTML = ICONS.BANNER_APPLY; apply.disabled = false; }
                    return;
                }
                if (apply.isConnected) apply.title = 'Отправка: ' + auto.opsCount + ' штрихов…';
                const file = await uploadBannerDrawing(body, token);
                const res = await fetch('/api/users/me', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ bannerId: file.id })
                });
                if (!res.ok) {
                    let msg = `Ошибка обновления профиля: ${res.status}`;
                    try { msg = (await res.json()).error?.message || msg; } catch (e) { }
                    throw new Error(msg);
                }
                const site = E.banner.querySelector('img:not(.vp-banner-drag)');
                setBannerEditing(false);
                if (site) site.src = file.url;
                alert('Баннер успешно обновлён!');
            } catch (error) {
                console.error('Ошибка:', error);
                const message = error.message || 'Неизвестная ошибка';
                if (message.includes('запрещённый контент') || message.includes('CONTENT_MODERATION')) {
                    alert('Изображение не прошло модерацию.\nПожалуйста, выберите другое изображение.');
                } else if (message.includes('сети') || message.includes('network') || message.includes('Failed to fetch')) {
                    alert('Ошибка сети. Проверьте подключение к интернету.');
                } else if (error.status === 429 || message.includes('Слишком много') || message.includes('Too many')) {
                    alert('Сайт просит подождать: слишком частые загрузки баннера.\nПопробуй через минуту.');
                } else if (error.status === 401 || error.status === 403 || message.includes('401') || message.includes('403')) {
                    alert('Сессия истекла. Обнови страницу и попробуй снова.');
                } else {
                    alert(`Не удалось нарисовать баннер: ${message}`);
                }
                apply.innerHTML = ICONS.BANNER_APPLY;
                apply.disabled = false;
            }
        }

        (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window).__vpBannerProbe = async function (brush, thr, blockW, blockH) {
            const W = 1100, H = 380;
            const pick = document.createElement('input');
            pick.type = 'file'; pick.accept = 'image/*';
            const file = await new Promise(ok => { pick.onchange = () => ok(pick.files[0]); pick.click(); });
            if (!file) return 'no file';
            const url = URL.createObjectURL(file);
            const img = new Image();
            await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = url; });
            const c = document.createElement('canvas'); c.width = W; c.height = H;
            const ctx = c.getContext('2d', { willReadFrequently: true });
            ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
            const s = Math.max(W / img.width, H / img.height);
            ctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
            URL.revokeObjectURL(url);
            const data = ctx.getImageData(0, 0, W, H);
            let body;
            if (blockW && blockH) {
                if (!thr || thr < 1) thr = 20;   
                const ops = [];
                const hex = (r, g, b) => '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
                const d = data.data;
                for (let y = 0; y < H; y += blockH) {
                    const yc = Math.min(y + blockH - 1, H - 1);
                    const cols = [];
                    for (let x = 0; x < W; x += blockW) {
                        const x1 = Math.min(x + blockW, W);
                        let sr = 0, sg = 0, sb = 0, n = 0;
                        for (let yy = y; yy < Math.min(y + blockH, H); yy++) {
                            for (let xx = x; xx < x1; xx++) {
                                const o = (yy * W + xx) * 4;
                                sr += d[o]; sg += d[o + 1]; sb += d[o + 2]; n++;
                            }
                        }
                        cols.push([sr / n, sg / n, sb / n]);
                    }
                    let start = 0, csr = cols[0][0], csg = cols[0][1], csb = cols[0][2], cnt = 1;
                    for (let ci = 1; ci < cols.length; ci++) {
                        const ar = csr / cnt, ag = csg / cnt, ab = csb / cnt;
                        const dr = cols[ci][0] - ar, dg = cols[ci][1] - ag, db = cols[ci][2] - ab;
                        if (dr * dr + dg * dg + db * db < thr * thr) {
                            csr += cols[ci][0]; csg += cols[ci][1]; csb += cols[ci][2]; cnt++;
                        } else {
                            ops.push({ tool: 'brush', color: hex(Math.round(csr / cnt), Math.round(csg / cnt), Math.round(csb / cnt)), width: blockH, points: [[start * blockW, yc], [ci * blockW - 1, yc]] });
                            start = ci; csr = cols[ci][0]; csg = cols[ci][1]; csb = cols[ci][2]; cnt = 1;
                        }
                    }
                    ops.push({ tool: 'brush', color: hex(Math.round(csr / cnt), Math.round(csg / cnt), Math.round(csb / cnt)), width: blockH, points: [[start * blockW, yc], [W - 1, yc]] });
                }
                body = { version: 1, width: W, height: H, ops: ops };
            } else {
                body = bannerPixelToOps(data, brush || 5, thr || 20);
            }
            const js = JSON.stringify(body);
            console.log('[probe] ops=' + body.ops.length + ', точек=' + (body.ops.length * 2) + ', тело=' + Math.round(js.length / 1024) + 'КБ');
            const token = await getAccessToken();
            const t0 = performance.now();
            const res = await fetch('/api/files/banner-drawing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: js
            });
            const ms = Math.round(performance.now() - t0);
            let data2 = null; try { data2 = await res.json(); } catch (e) { }
            console.log('[probe] HTTP ' + res.status + ' за ' + ms + 'мс', data2);
            return { status: res.status, ms: ms, ops: body.ops.length, kb: Math.round(js.length / 1024), data: data2 };
        };
        (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window).__vpBannerSend = async function (brush, thr, bw, bh) {
            const W = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);
            const r = await W.__vpBannerProbe(brush, thr, bw, bh);
            if (!r || r.status !== 201) { console.warn('[probe] рисунок не принят'); return r; }
            const token = await getAccessToken();
            const res = await fetch('/api/users/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ bannerId: r.data.id })
            });
            console.log('[probe] PUT /me -> ' + res.status);
            if (res.ok) setTimeout(() => location.reload(), 800);
            return r;
        };

        function initBanner() {
            onDom(function bannerButtons() { createAllButtons(); });
        }

