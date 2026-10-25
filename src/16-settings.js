        function renderAutoLikeUsers(list, footer, usersData) {
            const own = n => (usersData[n] && usersData[n].id) === OWNER_ID;
            const users = Object.keys(usersData).sort((a, b) => own(a) ? -1 : own(b) ? 1 : a.localeCompare(b));
            const count = () => { footer.textContent = `Активно: ${Object.keys(autoLikeUsers).length}`; };
            count();
            if (!users.length) {
                list.innerHTML = '<div class="vp-menu-note">Нет пользователей</div>';
                return;
            }
            list.innerHTML = '';
            for (const username of users) {
                const data = usersData[username];
                if (!data) continue;
                const row = document.createElement('div');
                row.className = 'nick-style-option vp-like-row';
                row.innerHTML = `<div class="vp-like-user"><div class="vp-like-avatar"></div><div class="vp-like-names"><span class="vp-like-name"></span><span class="vp-like-login"></span></div></div><div class="toggle-switch"></div>`;
                const av = row.querySelector('.vp-like-avatar'), ava = (data.avatar && (data.avatar.url || data.avatar)) || '👤';
                if (isUrl(ava)) { const img = document.createElement('img'); img.alt = ''; img.onerror = () => { av.textContent = '👤'; }; img.src = ava; av.appendChild(img); } else av.textContent = ava;
                row.querySelector('.vp-like-name').textContent = (data.displayName || username).slice(0, 20);
                row.querySelector('.vp-like-login').textContent = '@' + username;
                const toggle = row.querySelector('.toggle-switch');
                toggle.classList.toggle('active', !!autoLikeUsers[username]);
                row.onclick = (e) => {
                    e.stopPropagation();
                    if (toggle.classList.toggle('active')) autoLikeUsers[username] = true;
                    else delete autoLikeUsers[username];
                    saveAutoLikeUsers();
                    count();
                };
                list.appendChild(row);
            }
        }
        function applyPostBlurSetting() {
            document.querySelectorAll('.' + SELECTORS.post + '[data-post-colored]').forEach(post => {
                post.removeAttribute('data-post-colored');
                post.classList.remove('vp-emoji-tint');
            });
            if (postBlurEnabled) {
                addBlurBackground();
            } else {
                document.querySelectorAll('[data-blur-bg]').forEach(dropBlur);
            }
            colorizePosts();
        }
        let palsOn = GM_getValue('palsEnabled', false);
        const PALS = { miku: { key: 'palMiku', file: 'miku.webp', r: 800 / 790 }, teto: { key: 'palTeto', file: 'teto.webp', r: 776 / 734 } };
        const PAL_VER = 8;
        const PAL_LOOKS = [
            ['plain', 'Как есть', '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="12" cy="11" r="3"/><path d="M7 20c.8-2.6 2.8-4 5-4s4.2 1.4 5 4"/>'],
            ['neon', 'Неон', '<circle cx="12" cy="10" r="3.5"/><path d="M5.5 20c1-3.3 3.5-5 6.5-5s5.5 1.7 6.5 5"/><path d="M12 2.5v2M4.6 5.6l1.4 1.4M19.4 5.6 18 7"/>'],
            ['dim', 'Под тему', '<circle cx="12" cy="10" r="3.5"/><path d="M5.5 20c1-3.3 3.5-5 6.5-5s5.5 1.7 6.5 5"/><path d="M18 3.5a3 3 0 1 0 2.5 4.5 3.5 3.5 0 0 1-2.5-4.5z"/>']
        ];
        let palsBox = null;
        function palStore(key, blob) {
            return bgDb().then(db => new Promise((ok, no) => {
                const st = db.transaction('files', blob ? 'readwrite' : 'readonly').objectStore('files'), r = blob ? st.put(blob, key) : st.get(key);
                r.onsuccess = () => ok(blob || r.result || null);
                r.onerror = () => no(r.error);
            }));
        }
        function palFetch(url) {
            return new Promise((ok, no) => GM_xmlhttpRequest({
                method: 'GET', url, responseType: 'blob', timeout: 60000,
                onload: r => r.status === 200 && r.response && r.response.size > 1000 ? ok(new Blob([r.response], { type: 'image/webp' })) : no(new Error('персонаж: ' + r.status)),
                onerror: no, ontimeout: no
            }));
        }
        async function palBlob(id) {
            const key = `pal-${id}@${PAL_VER}`;
            const have = await palStore(key).catch(() => null);
            if (have) return have;
            for (const branch of ['claude/github-script-access-ihd9ne', 'main']) {
                const b = await palFetch(`https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/${branch}/assets/${PALS[id].file}`).catch(() => null);
                if (b) { await palStore(key, b).catch(() => { }); return b; }
            }
            return null;
        }
        function palsApply() {
            if (!palsBox) { palsBox = document.createElement('div'); palsBox.className = 'vp-pals'; }
            if (!palsBox.isConnected) document.body.appendChild(palsBox);
            palsNav();
            palsBox.dataset.look = GM_getValue('palLook', 'plain');
            document.documentElement.classList.toggle('vp-pals-r', palsOn && GM_getValue('palMiku', true));
            const imgs = [];
            let fresh = false;
            for (const [id, pal] of Object.entries(PALS)) {
                const want = palsOn && GM_getValue(pal.key, true);
                let img = palsBox.querySelector('.vp-pal-' + id);
                if (!want) { if (img) { URL.revokeObjectURL(img.src); img.remove(); } continue; }
                if (!img) {
                    img = document.createElement('img');
                    img.className = 'vp-pal vp-pal-' + id;
                    img.alt = '';
                    img.style.setProperty('--vp-pal-r', pal.r);
                    palsBox.appendChild(img);
                    fresh = true;
                }
                imgs.push([id, img]);
            }
            if (!fresh) return;
            const gen = palsApply.gen = (palsApply.gen || 0) + 1;
            Promise.all(imgs.map(([id]) => palBlob(id))).then(blobs => {
                if (gen !== palsApply.gen) return;
                imgs.forEach(([, img], i) => {
                    if (!blobs[i] || !img.isConnected) return;
                    if (img.src) URL.revokeObjectURL(img.src);
                    img.src = URL.createObjectURL(blobs[i]);
                });
            }).catch(e => logErr('персонаж', e));
        }
        let palNavEl = null, palNavAt = -1e9;
        function palsNav() {
            if (!palsBox || !palsOn) return;
            if (palNavEl && (!palNavEl.isConnected || palNavEl.getBoundingClientRect().bottom < innerHeight - 200)) palNavEl = null;
            if (!palNavEl && performance.now() - palNavAt > 800) {
                palNavAt = performance.now();
                const nav = document.querySelector('nav.' + SELECTORS.nav) || [...document.querySelectorAll('nav a')].find(a => a.textContent.trim() === 'Лента')?.closest('nav');
                for (let e = nav; e && e !== document.body; e = e.parentElement) {
                    if (getComputedStyle(e).position !== 'fixed') continue;
                    const r = e.getBoundingClientRect();
                    if (r.width >= innerWidth * 0.8 && r.bottom >= innerHeight - 200) palNavEl = e;
                    break;
                }
                if (!palNavEl) for (const d of [3, 24, 48, 80, 120]) {
                    for (let e of document.elementsFromPoint(innerWidth / 2, innerHeight - d)) {
                        for (; e && e !== document.body; e = e.parentElement) {
                            if (getComputedStyle(e).position !== 'fixed') continue;
                            const r = e.getBoundingClientRect();
                            if (r.width >= innerWidth * 0.8 && r.height < 200 && r.bottom >= innerHeight - 4) palNavEl = e;
                            break;
                        }
                        if (palNavEl) break;
                    }
                    if (palNavEl) break;
                }
            }
            const mob = !!palNavEl, size = GM_getValue('palSize', 45), ph = mob ? size * 0.8 + 'vw' : size + 'vh';
            palsBox.classList.toggle('vp-pals-phone', mob);
            if (palsBox.style.getPropertyValue('--vp-pal-h') !== ph) palsBox.style.setProperty('--vp-pal-h', ph);
            const pill = palNavEl && (palNavEl.matches('nav') ? palNavEl : palNavEl.querySelector('nav')) || palNavEl, top = pill ? pill.getBoundingClientRect().top : innerHeight, z = palNavEl ? parseInt(getComputedStyle(palNavEl).zIndex) : NaN;
            const nav = Math.max(0, Math.round(innerHeight - top)) + 'px', zi = z > 1 ? String(Math.min(z - 1, 9000)) : '';
            if (palsBox.style.getPropertyValue('--vp-pal-nav') !== nav) palsBox.style.setProperty('--vp-pal-nav', nav);
            if (palsBox.style.zIndex !== zi) palsBox.style.zIndex = zi;
        }
        onDom(palsNav);
        addEventListener('resize', palsNav);
        function palSizeRow() {
            const row = document.createElement('div');
            row.className = 'settings-option vp-vol-row';
            row.innerHTML = `<span class="vp-setting-label">${ICONS.settings['Мику и Тето'] || ''}<span>Размер</span></span>`
                + `<span class="vp-vol"><input type="range" min="25" max="70" step="5" aria-label="Размер"><b></b></span>`;
            const inp = row.querySelector('input'), out = row.querySelector('b');
            inp.value = GM_getValue('palSize', 45);
            const show = () => { out.textContent = inp.value + '%'; inp.style.setProperty('--vp-vol', ((inp.value - 25) / 45 * 100) + '%'); };
            show();
            inp.addEventListener('input', () => { GM_setValue('palSize', +inp.value); show(); palsApply(); });
            row.onclick = e => e.stopPropagation();
            return row;
        }
        const SETTINGS = [
            { label: 'Фон', get: () => backgroundEnabled, set: v => { backgroundEnabled = v; updateBackgroundVisibility(); }, key: 'backgroundEnabled' },
            { label: 'Неоновая подсветка', get: () => neonEnabled, set: v => { neonEnabled = v; document.documentElement.classList.toggle('vp-no-neon', !v); paint(); }, key: 'neonEnabled' },
            { label: 'Подсветка ника', get: () => nickGlowEnabled, set: v => { nickGlowEnabled = v; paint(); }, key: 'nickGlowEnabled' },
            { label: 'Подсветка аватарок', get: () => avatarGlowEnabled, set: v => { avatarGlowEnabled = v; paint(); }, key: 'avatarGlowEnabled' },
            { label: 'Подсветка постов', get: () => postBorderEnabled, set: v => { postBorderEnabled = v; paint(); }, key: 'postBorderEnabled' },
            { label: 'Заставка при входе', get: () => GM_getValue('introEnabled', true), set: () => { }, key: 'introEnabled' },
            { label: 'Размытый фон постов', get: () => postBlurEnabled, set: v => { postBlurEnabled = v; applyPostBlurSetting(); }, key: 'postBlurEnabled' },
            { label: 'Анти цензура', get: () => antiCensorshipEnabled, set: v => { antiCensorshipEnabled = v; }, key: 'antiCensorshipEnabled' },
            {
                label: 'Автолайки', get: () => autoLikeEnabled, key: 'autoLikeEnabled',
                set: v => { autoLikeEnabled = v; }
            },
            { label: 'Стекло', get: () => glassEnabled, set: v => { glassEnabled = v; applyGlass(); }, key: 'glassEnabled' },
            { label: 'Звуки интерфейса', get: () => uiSoundEnabled, set: v => { uiSoundEnabled = v; if (v) uiSound('toggle'); }, key: 'uiSoundEnabled' },
            { label: 'Стили других', get: () => showLooks, set: v => { showLooks = v; document.documentElement.classList.toggle('vp-looks', v); if (!v) setBgGuest(null); }, key: 'showLooks' },
            { label: 'Листание вкладок', get: () => GM_getValue('tabSlide', true), set: v => { if (!v) tabSlide.end(); }, key: 'tabSlide' },
            { label: 'Сцена ленты', get: () => sceneEnabled, set: v => { sceneEnabled = v; sceneAutoOff = false; document.documentElement.classList.toggle('vp-scene', v); sceneKick(); }, key: 'sceneEnabled' },
            { label: 'Свечение видео', get: () => ambientEnabled, set: v => { ambientEnabled = v; applyAmbient(); }, key: 'ambientEnabled' },
            { label: 'Боковая панель', get: () => railEnabled, set: v => { railEnabled = v; placeRail(); }, key: 'railEnabled' },
            { label: 'Версия для ПК на планшете', get: () => GM_getValue('tabletDesktop', true), set: () => tabletViewport(), key: 'tabletDesktop' },
            { label: 'Мику и Тето', get: () => palsOn, set: v => { palsOn = v; palsApply(); }, key: 'palsEnabled' },
            { label: 'Мику справа', get: () => GM_getValue('palMiku', true), set: () => palsApply(), key: 'palMiku' },
            { label: 'Тето слева', get: () => GM_getValue('palTeto', true), set: () => palsApply(), key: 'palTeto' }
        ];
        const SETTINGS_TABS = [
            { id: 'nick', name: 'Ник', items: ['Неоновая подсветка', 'Подсветка ника', 'Подсветка аватарок', 'Подсветка постов'] },
            { id: 'bg', name: 'Фон', items: ['Фон'] },
            { id: 'look', name: 'Вид', items: ['Стекло', 'Листание вкладок', 'Сцена ленты', 'Свечение видео', 'Размытый фон постов', 'Боковая панель', 'Карточки панели', 'Версия для ПК на планшете'] },
            { id: 'likes', name: 'Лайки', items: ['Автолайки'] },
            { id: 'pals', name: 'Мику', items: ['Мику и Тето', 'Мику справа', 'Тето слева', 'Размер персонажей'] },
            { id: 'misc', name: 'Ещё', items: ['Анти цензура', 'Звуки интерфейса', 'Громкость', 'Заставка при входе'] },
            { id: 'icon', name: 'Иконка' }
        ];
        function settingRow(opt, after) {
            const row = document.createElement('div');
            row.className = 'settings-option';
            row.innerHTML = `<span class="vp-setting-label">${ICONS.settings[opt.label] || ''}<span></span></span><div class="toggle-switch"></div>`;
            row.querySelector('.vp-setting-label > span').textContent = opt.label;
            const toggle = row.lastElementChild;
            toggle.classList.toggle('active', !!opt.get());
            row.onclick = (e) => {
                e.stopPropagation();
                const v = !opt.get();
                GM_setValue(opt.key, v);
                opt.set(v);
                toggle.classList.toggle('active', v);
                if (after) after();
            };
            return row;
        }
        function railCardsBox(redraw) {
            const box = document.createElement('div');
            box.className = 'vp-rcards';
            box.appendChild(secTitle('Карточки панели'));
            const st = railCards();
            st.order.forEach((id, i) => {
                const c = RAIL_CARDS.find(x => x.id === id), on = !st.off.includes(id);
                const row = document.createElement('div');
                row.className = 'settings-option vp-rcard';
                row.dataset.card = id;
                row.innerHTML = `<span class="vp-setting-label"><span></span></span><span class="vp-rcard-move"><button type="button" data-d="-1" aria-label="Выше">${svgIcon('<path d="m6 15 6-6 6 6"/>', 16)}</button><button type="button" data-d="1" aria-label="Ниже">${svgIcon('<path d="m6 9 6 6 6-6"/>', 16)}</button></span><div class="toggle-switch"></div>`;
                row.querySelector('.vp-setting-label > span').textContent = c.name;
                const ico = rail.querySelector(`.vp-rail-card[data-block="${id}"] .vp-rail-title svg`);
                if (ico) row.querySelector('.vp-setting-label').prepend(ico.cloneNode(true));
                row.querySelector('[data-d="-1"]').disabled = i === 0;
                row.querySelector('[data-d="1"]').disabled = i === st.order.length - 1;
                row.querySelector('.toggle-switch').classList.toggle('active', on);
                row.onclick = e => {
                    e.stopPropagation();
                    const mv = e.target.closest('[data-d]'), cur = railCards();
                    if (mv) {
                        const j = cur.order.indexOf(id), k = j + +mv.dataset.d;
                        if (k < 0 || k >= cur.order.length) return;
                        [cur.order[j], cur.order[k]] = [cur.order[k], cur.order[j]];
                    } else {
                        cur.off = cur.off.filter(x => x !== id);
                        if (on) cur.off.push(id);
                    }
                    railCardsSave(cur);
                    redraw();
                };
                box.appendChild(row);
            });
            const hint = document.createElement('div');
            hint.className = 'vp-rcards-hint';
            hint.textContent = 'На самой панели карточки тоже можно перетаскивать за заголовок';
            box.appendChild(hint);
            return box;
        }
        function introModeRow() {
            const STEPS = [['off', 'Выкл'], ['silent', 'Вкл'], ['tap', 'Вкл + звук · коснись при входе']];
            const row = document.createElement('div');
            row.className = 'settings-option';
            row.innerHTML = `<span class="vp-setting-label">${ICONS.settings['Заставка при входе'] || ''}<span class="vp-tri-text"><span>Заставка при входе</span><small></small></span></span><div class="toggle-switch vp-tri"></div>`;
            const sw = row.querySelector('.vp-tri'), sub = row.querySelector('small');
            let idx = Math.max(0, STEPS.findIndex(st => st[0] === introMode()));
            const show = () => { sw.dataset.s = idx; sw.classList.toggle('active', idx > 0); sub.textContent = STEPS[idx][1]; };
            show();
            row.onclick = (e) => {
                e.stopPropagation();
                idx = (idx + 1) % STEPS.length;
                GM_setValue('introMobile', STEPS[idx][0]);
                show();
            };
            return row;
        }
        function volumeRow() {
            const row = document.createElement('div');
            row.className = 'settings-option vp-vol-row';
            row.innerHTML = `<span class="vp-setting-label">${ICONS.settings['Звуки интерфейса'] || ''}<span>Громкость</span></span>`
                + `<span class="vp-vol"><input type="range" min="0" max="100" step="5" aria-label="Громкость"><b></b></span>`;
            const inp = row.querySelector('input'), out = row.querySelector('b');
            inp.value = Math.round(soundVolume() * 100);
            const show = () => { out.textContent = inp.value + '%'; inp.style.setProperty('--vp-vol', inp.value + '%'); };
            show();
            inp.addEventListener('input', () => { GM_setValue('soundVolume', +inp.value); show(); });
            inp.addEventListener('change', () => { const was = uiSoundEnabled; uiSoundEnabled = true; uiSound('toggle'); uiSoundEnabled = was; });
            row.onclick = e => e.stopPropagation();
            return row;
        }
        const secTitle = (text) => {
            const t = document.createElement('div');
            t.className = 'vp-sec-title';
            t.textContent = text;
            return t;
        };
        function pickRow(icon, label, active, onPick, redraw) {
            const o = menuOption(icon, label, onPick, active);
            o.onclick = (e) => { e.stopPropagation(); onPick(); redraw(); };
            return o;
        }
        function openSettingsMenu(btn) {
            const menu = document.createElement('div');
            menu.className = 'settings-dropdown vp-settings-tabs';
            const tabs = document.createElement('div');
            tabs.className = 'vp-stabs';
            const body = document.createElement('div');
            body.className = 'vp-tab-body';
            menu.append(tabs, body);
            let current = GM_getValue('settingsTab', 'nick');
            if (!SETTINGS_TABS.some(t => t.id === current)) current = 'nick';
            const show = (id) => {
                current = id;
                GM_setValue('settingsTab', id);
                tabs.querySelectorAll('.vp-stab').forEach(t => t.classList.toggle('vp-active', t.dataset.tab === id));
                const keep = body.dataset.tab === id ? body.scrollTop : 0;
                body.dataset.tab = id;
                body.textContent = '';
                const redraw = () => show(id);
                const tab = SETTINGS_TABS.find(t => t.id === id);
                if (id === 'icon') body.appendChild(iconPicker());
                else for (const label of tab.items) {
                    if (label === 'Заставка при входе' && IS_PHONE) { body.appendChild(introModeRow()); continue; }
                    if (label === 'Громкость') { body.appendChild(volumeRow()); continue; }
                    if (label === 'Карточки панели') { body.appendChild(railCardsBox(redraw)); continue; }
                    if (label === 'Размер персонажей') { const r = palSizeRow(); if (!palsOn) r.classList.add('vp-dim'); body.appendChild(r); continue; }
                    const row = settingRow(SETTINGS.find(o => o.label === label), id === 'bg' || id === 'nick' || id === 'pals' ? redraw : null);
                    if (!neonEnabled && label.startsWith('Подсветка ')) row.classList.add('vp-dim');
                    if (!palsOn && (label === 'Мику справа' || label === 'Тето слева')) row.classList.add('vp-dim');
                    body.appendChild(row);
                }
                if (id === 'pals') {
                    body.appendChild(secTitle('Вид'));
                    const grid = document.createElement('div');
                    grid.className = 'vp-pick-grid' + (palsOn ? '' : ' vp-dim');
                    const look = GM_getValue('palLook', 'plain');
                    PAL_LOOKS.forEach(([key, name, glyph]) => {
                        const icon = document.createElement('div');
                        icon.className = 'vp-menu-icon';
                        icon.innerHTML = svgIcon(glyph);
                        grid.appendChild(pickRow(icon, name, key === look, () => { GM_setValue('palLook', key); palsApply(); }, redraw));
                    });
                    grid.style.gridTemplateRows = `repeat(${Math.ceil(grid.children.length / 2)}, auto)`;
                    body.appendChild(grid);
                }
                if (id === 'nick') {
                    body.appendChild(secTitle('Стиль ника'));
                    const grid = document.createElement('div');
                    grid.className = 'vp-pick-grid';
                    styleKeys.forEach(key => grid.appendChild(pickRow(getColorDot(key), nickStyles[key].name, key === currentStyle, () => {
                        currentStyle = key;
                        GM_setValue('nickStyle', key);
                        paint();
                    }, redraw)));
                    grid.style.gridTemplateRows = `repeat(${Math.ceil(grid.children.length / 2)}, auto)`;
                    body.appendChild(grid);
                }
                if (id === 'bg' && backgroundEnabled) {
                    body.appendChild(secTitle('Стиль фона'));
                    const grid = document.createElement('div');
                    grid.className = 'vp-pick-grid';
                    Object.entries(BG_STYLES).forEach(([key, bg]) => {
                        const icon = document.createElement('div');
                        icon.className = 'vp-menu-icon';
                        icon.innerHTML = bg.icon;
                        grid.appendChild(pickRow(icon, bg.name, key === backgroundStyle, () => {
                            if (key === 'custom') {
                                bgFile().then(f => {
                                    if (!f) return pickBgFile(redraw);
                                    backgroundStyle = 'custom'; GM_setValue('backgroundStyle', 'custom');
                                    updateBackgroundVisibility(); redraw();
                                }).catch(() => pickBgFile(redraw));
                                return;
                            }
                            backgroundStyle = key;
                            GM_setValue('backgroundStyle', key);
                            updateBackgroundVisibility();
                        }, redraw));
                    });
                    grid.style.gridTemplateRows = `repeat(${Math.ceil(grid.children.length / 2)}, auto)`;
                    body.appendChild(grid);
                    if (backgroundStyle === 'custom') {
                        const icon = document.createElement('div');
                        icon.className = 'vp-menu-icon';
                        icon.innerHTML = svgIcon('<path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/><path d="M12 4v11M7.5 8.5 12 4l4.5 4.5"/>');
                        const row = menuOption(icon, 'Сменить картинку или видео', () => { });
                        row.onclick = e => { e.stopPropagation(); pickBgFile(redraw); };
                        body.appendChild(row);
                    }
                }
                if (id === 'likes') {
                    body.appendChild(secTitle('Кого лайкать'));
                    const box = document.createElement('div');
                    box.className = 'vp-like-menu vp-like-inline';
                    box.innerHTML = '<div class="vp-like-list"><div class="vp-menu-note">Загрузка...</div></div><div class="vp-like-footer">Активно: 0</div>';
                    body.appendChild(box);
                    const list = box.firstElementChild, footer = box.lastElementChild;
                    fetchAutoLikeUsers().then(usersData => {
                        if (!list.isConnected) return;
                        renderAutoLikeUsers(list, footer, usersData);
                        if (popup && popup.el === menu) placePopup();
                    }).catch(() => { list.innerHTML = '<div class="vp-menu-note">Ошибка загрузки</div>'; });
                }
                if (popup && popup.el === menu) placePopup();
                body.scrollTop = keep;
            };
            for (const t of SETTINGS_TABS) {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'vp-stab';
                b.dataset.tab = t.id;
                b.textContent = t.name;
                b.onclick = (e) => { e.stopPropagation(); if (current !== t.id) show(t.id); };
                tabs.appendChild(b);
            }
            for (const t of ['touchstart', 'touchmove']) menu.addEventListener(t, e => e.stopPropagation(), { passive: true });
            show(current);
            openPopup(btn, menu);
        }

        function iconPicker() {
            const wrap = document.createElement('div');
            wrap.className = 'vp-icon-picker';
            const grid = document.createElement('div');
            grid.className = 'vp-icon-grid';
            const tile = (id, name, src) => {
                const t = document.createElement('button');
                t.type = 'button';
                t.className = 'vp-icon-tile' + (appIcon === id ? ' vp-active' : '');
                t.dataset.icon = id;
                t.title = name;
                t.innerHTML = '<img alt=""><span></span>';
                t.firstChild.src = src;
                t.lastChild.textContent = name;
                t.onclick = (e) => { e.stopPropagation(); pick(id); };
                return t;
            };
            const pick = (id) => {
                setAppIcon(id);
                wrap.querySelectorAll('.vp-icon-tile').forEach(t => t.classList.toggle('vp-active', t.dataset.icon === id));
            };
            for (const it of APP_ICONS) grid.appendChild(tile(it.id, it.name, iconSrcById(it.id)));
            const customTile = tile('custom', 'Своя', iconSrcById('custom'));
            grid.appendChild(customTile);
            let imageTile = null;
            const addImageTile = () => {
                if (imageTile) { imageTile.firstChild.src = iconSrcById('image'); return; }
                imageTile = tile('image', 'Картинка', iconSrcById('image'));
                grid.appendChild(imageTile);
            };
            if (GM_getValue('appIconImage', '')) addImageTile();
            wrap.appendChild(grid);

            const own = document.createElement('div');
            own.className = 'vp-icon-own';
            own.innerHTML = '<div class="vp-icon-own-title">Своя иконка</div><div class="vp-icon-own-row"><input class="vp-icon-emoji" type="text" maxlength="16" placeholder="🦊" aria-label="Эмодзи"><div class="vp-icon-bgs"></div></div>';
            const input = own.querySelector('input');
            const bgs = own.querySelector('.vp-icon-bgs');
            const cur = iconCustom();
            input.value = cur.emoji;
            const saveCustom = (patch) => {
                const c = Object.assign(iconCustom(), patch);
                GM_setValue('appIconCustom', c);
                customTile.firstChild.src = iconSrcById('custom');
                bgs.querySelectorAll('.vp-icon-bg').forEach(d => d.classList.toggle('vp-active', d.dataset.bg === c.bg));
                pick('custom');
            };
            for (const b of iconBgs()) {
                const d = document.createElement('button');
                d.type = 'button';
                d.className = 'vp-icon-bg' + (cur.bg === b.id ? ' vp-active' : '');
                d.dataset.bg = b.id;
                d.title = b.name;
                d.style.background = b.c.length > 1 ? `linear-gradient(135deg, ${b.c.join(', ')})` : b.c[0];
                d.onclick = (e) => { e.stopPropagation(); saveCustom({ bg: b.id }); };
                bgs.appendChild(d);
            }
            input.addEventListener('click', e => e.stopPropagation());
            input.addEventListener('input', () => {
                const g = firstGrapheme(input.value);
                if (!g) return;
                saveCustom({ emoji: g });
            });
            input.addEventListener('blur', () => { input.value = iconCustom().emoji; });
            wrap.appendChild(own);

            const up = document.createElement('button');
            up.type = 'button';
            up.className = 'vp-icon-upload';
            up.textContent = 'Загрузить свою картинку';
            up.onclick = (e) => {
                e.stopPropagation();
                const f = document.createElement('input');
                f.type = 'file';
                f.accept = 'image/*';
                f.onchange = () => {
                    const file = f.files && f.files[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    const img = new Image();
                    img.onload = () => {
                        const s = Math.min(img.naturalWidth, img.naturalHeight);
                        const c = document.createElement('canvas');
                        const side = Math.min(512, s);
                        c.width = c.height = side;
                        c.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, side, side);
                        URL.revokeObjectURL(url);
                        GM_setValue('appIconImage', c.toDataURL('image/png'));
                        pngFor = null;
                        addImageTile();
                        pick('image');
                    };
                    img.onerror = () => URL.revokeObjectURL(url);
                    img.src = url;
                };
                f.click();
            };
            wrap.appendChild(up);
            const note = document.createElement('div');
            note.className = 'vp-icon-note';
            note.textContent = 'Иконка меняется на вкладке и в логотипе. Ярлык на главном экране телефона добавь заново — старый сам не обновится.';
            wrap.appendChild(note);
            return wrap;
        }
