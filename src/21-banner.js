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

        function uploadBannerFile(blob, token) {
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
                const file = await uploadBannerFile(await cropBannerImage(), token);
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
                } else if (message.includes('сети') || message.includes('network')) {
                    alert('Ошибка сети. Проверьте подключение к интернету.');
                } else {
                    alert(`Ошибка: ${message}`);
                }
                apply.innerHTML = ICONS.BANNER_APPLY;
                apply.disabled = false;
            }
        }

        function initBanner() {
            onDom(function bannerButtons() { createAllButtons(); });
        }

