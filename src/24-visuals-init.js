        const styleScrollTop = addCss(`
        .itd-scroll-top-btn {
            position: fixed !important; bottom: 16px !important; right: 16px !important;
            width: 64px !important; height: 64px !important;
            display: flex !important; align-items: center !important; justify-content: center !important;
            background: var(--glass-bg) !important;
            -webkit-backdrop-filter: blur(16px) !important; backdrop-filter: blur(16px) !important;
            border: none !important; border-radius: 32px !important; cursor: pointer !important;
            pointer-events: auto !important; color: var(--text-primary) !important;
            box-shadow: var(--shadow-elevated) !important;
            transition: opacity 0.2s ease, visibility 0.2s ease !important;
            margin: 0 !important; padding: 0 !important;
            opacity: 0 !important; visibility: hidden !important;
        }
        .itd-scroll-top-btn.vp-shown { opacity: 1 !important; visibility: visible !important; }
        .itd-scroll-top-btn::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 1px;
            background: linear-gradient(to bottom, #ffffff40, #ffffff0d);
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
        }
        @media (max-width: ${PHONE_MAX}px) {
            .itd-scroll-top-btn { z-index: 1 !important; bottom: 100px !important; }
            html.vp-has-up, html.vp-has-up body { overscroll-behavior: none !important; }
            html.vp-has-up ::-webkit-scrollbar { display: none !important; }
            html.vp-has-up .vp-nick-large { display: flex; flex-direction: column; align-items: center; gap: 4px; }
            .nick-wrapper { display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 4px !important; }
        }
    `);

        let scrollTopButton = null;
        function createScrollTopButton() {
            if (scrollTopButton) return;
            scrollTopButton = document.createElement('button');
            scrollTopButton.className = 'itd-scroll-top-btn';
            scrollTopButton.innerHTML = ICONS.SCROLL_TOP;
            scrollTopButton.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
            document.body.appendChild(scrollTopButton);
            document.documentElement.classList.add('vp-has-up');
            const toggle = () => scrollTopButton.classList.toggle('vp-shown', window.scrollY > 300);
            window.addEventListener('scroll', toggle, { passive: true });
            toggle();
            placeNickWrapper();
        }

        const narrowScreen = matchMedia(`(max-width: ${PHONE_MAX}px)`);
        function placeNickWrapper() {
            const nick = siteEl('nickLarge');
            if (!nick) return;
            const wrapper = nick.querySelector(':scope > .nick-wrapper');
            if (narrowScreen.matches && scrollTopButton) {
                if (wrapper) return;
                const w = document.createElement('span');
                w.className = 'nick-wrapper';
                const parts = [...nick.children];
                nick.prepend(w);
                w.append(...parts);
            } else if (wrapper) {
                wrapper.replaceWith(...wrapper.children);
            }
        }
        narrowScreen.addEventListener('change', placeNickWrapper);
        onDom(placeNickWrapper);

        let visualsTry = 0;
        async function initVisuals() {
            try {
                const me = siteAuth.me || await new Promise(done => { siteAuth.meWait.push(done); setTimeout(() => done(null), 1500); })
                    || await api('/api/users/me').then(r => r.json()).catch(() => null);
                if (!me || !me.username) { if (visualsTry++ < 6) setTimeout(initVisuals, 4000 * visualsTry); return; }
                meData = me;
                myUsername = me.username;
                reloadAutoLike();
                myDisplayName = me.displayName || me.username;
                tagAll();
                try { placeRail(); } catch (e) { }

                createScrollTopButton();

                checkAllComments().then(() => { markVerifiedUsers(); return verifyMyself(); }).then(verifyRequestAgain).catch(e => logErr('проверка', e)).then(publishLook);
                sched.add('verify', () => checkAllComments(), { every: 10 * 60 * 1000, net: true, visible: true });

                lbSyncFromServer();

                function findAllMyAvatars() {
                    const primaryAvatar = myAvatarEl();
                    if (primaryAvatar) glowMyAvatar(primaryAvatar);
                    const me = myUsername.toLowerCase();
                    const isMe = href => ((href || '').split('/@')[1] || '').split(/[/?#]/)[0].toLowerCase() === me;
                    document.querySelectorAll('.' + SELECTORS.avatar).forEach(avatar => {
                        const link = avatar.closest(PROFILE_LINK);
                        if (link) { if (isMe(link.getAttribute('href'))) glowMyAvatar(avatar); return; }
                        if (avatar.closest('.' + SELECTORS.post)) return;
                        const inComposer = avatar.parentElement && avatar.parentElement.querySelector('[contenteditable="true"]');
                        if (inComposer || (isMe(location.pathname) && nearLargeNick(avatar))) glowMyAvatar(avatar);
                    });
                }
                function nearLargeNick(el) {
                    for (let p = el, i = 0; p && i < 5; p = p.parentElement, i++) {
                        if (p.querySelector('.' + SELECTORS.nickLarge)) return true;
                    }
                    return false;
                }

                function findAllMyNicks() {
                    const myUsernameLower = myUsername.toLowerCase();
                    const myDisplayNameLower = myDisplayName.toLowerCase();

                    document.querySelectorAll('.' + SELECTORS.nickText).forEach(nickSpan => {
                        const nickText = nickSpan.textContent.trim();
                        const nickTextLower = nickText.toLowerCase();
                        if (nickTextLower !== myUsernameLower && nickTextLower !== myDisplayNameLower) return;

                        let container = nickSpan.closest('.' + SELECTORS.nickRow);
                        if (!container) container = nickSpan.closest('.' + SELECTORS.nickContainer);
                        if (!container) container = nickSpan.closest('header');
                        if (!container) return;

                        markMyNick(nickSpan);

                        const isLarge = !!nickSpan.closest('.' + SELECTORS.nickLarge);
                        if (!container.querySelector('.' + SELECTORS.badgeVoronoi)) {
                            const size = isLarge ? 18 : 16;
                            const badgeSVG = ICONS.badge(size);
                            const badge = document.createElement('span');
                            badge.className = SELECTORS.badgeVoronoi;
                            badge.innerHTML = badgeSVG;
                            badge.style.setProperty('--vp-badge', size + 'px');
                            nickSpan.parentNode.insertBefore(badge, nickSpan.nextSibling);
                        }

                        if (isLarge) {
                            const ru5n = container.closest('.' + SELECTORS.nickRow) || container;
                            addToggleButtonToNick(ru5n);
                        }
                    });
                }

                const userOf = href => ((href || '').split('/@')[1] || '').split(/[/?#]/)[0].toLowerCase();
                function nickLeaf(root) {
                    const tagged = root.querySelector('.' + SELECTORS.nickText);
                    if (tagged) return tagged;
                    return [...root.querySelectorAll('span, p, div')].find(e => {
                        if (e.children.length) return false;
                        const t = e.textContent.trim();
                        return t && !t.startsWith('@') && /[\p{L}\p{N}]/u.test(t)
                            && !e.closest('.' + SELECTORS.avatar + ', .' + SELECTORS.badgeVerify + ', .' + SELECTORS.badgeVoronoi + ', time');
                    }) || null;
                }
                function addVerifyBadge(nick, size, state) {
                    if (!nick) return; const vpR = nick.closest('.' + SELECTORS.nickContainer); const vpN = nick.nextElementSibling; const vpOk = vpN && vpN.classList.contains(SELECTORS.badgeVerify) ? vpN : null; if (vpR) vpR.querySelectorAll('.' + SELECTORS.badgeVerify).forEach(function (x) { if (x !== vpOk) x.remove(); }); if (vpOk) return;
                    const badge = document.createElement('span');
                    badge.className = SELECTORS.badgeVerify + (state === 'quarantine' ? ' vp-badge-quarantine' : '');
                    badge.innerHTML = ICONS.badge(size);
                    badge.style.setProperty('--vp-badge', size + 'px');
                    if (state === 'quarantine') {
                        const p = badge.querySelector('path[fill^="url"]');
                        if (p) p.setAttribute('fill', '#7a7a82');
                    }
                    nick.insertAdjacentElement('afterend', badge);
                }
                let verifiedRaw = null, verifiedSet = new Set(), verifiedPendingSet = new Set(), verifiedById = new Map();
                const loneNicks = () => [...document.querySelectorAll('[data-user-name]')].filter(el => !el.closest(PROFILE_LINK))
                    .map(el => ({ el, u: verifiedById.get(String(el.getAttribute('data-user-name')).toLowerCase()) })).filter(x => x.u);
                function markVerifiedUsers() {
                    const raw = localStorage.getItem(VERIFICATION_STORAGE_KEY) || '{}';
                    if (raw !== verifiedRaw) {
                        verifiedRaw = raw;
                        verifiedSet = new Set();
                        verifiedPendingSet = new Set();
                        let parsed;
                        try { parsed = JSON.parse(raw) || {}; } catch (e) { parsed = {}; }
                        approvedIds = new Set();
                        verifiedById = new Map();
                        for (const [name, info] of Object.entries(parsed)) {
                            if (!info || !info.state) continue;
                            if (info.id) verifiedById.set(String(info.id).toLowerCase(), name.toLowerCase());
                            if (info.state === 'approved') {
                                verifiedSet.add(name.toLowerCase());
                                if (info.id) approvedIds.add(String(info.id).toLowerCase());
                            } else if (info.state === 'quarantine') verifiedPendingSet.add(name.toLowerCase());
                        }
                    }
                    const allNames = new Set([...verifiedSet, ...verifiedPendingSet]);
                    allNames.delete((myUsername || '').toLowerCase());
                    if (!allNames.size) return;
                    const stateOf = u => verifiedSet.has(u) ? 'approved' : 'quarantine';
                    document.querySelectorAll(PROFILE_LINK).forEach(link => {
                        const u = userOf(link.getAttribute('href'));
                        if (allNames.has(u)) addVerifyBadge(nickLeaf(link), 16, stateOf(u));
                    });
                    document.querySelectorAll('.' + SELECTORS.nickContainer).forEach(c => {
                        if (c.closest(PROFILE_LINK)) return;
                        const login = atLoginOf(c);
                        if (login && allNames.has(login.toLowerCase()))
                            addVerifyBadge(nickLeaf(c), c.matches('.' + SELECTORS.nickLarge) ? 18 : 16, stateOf(login.toLowerCase()));
                    });
                    loneNicks().forEach(({ el, u }) => { if (allNames.has(u)) addVerifyBadge(nickLeaf(el), el.closest('.' + SELECTORS.repost) ? 14 : 16, stateOf(u)); });
                }

                let lookRaw = null, lookBy = new Map();
                function avaPut(el, ref, vid) {
                    if ((el.getAttribute('data-vp-ava') || '') !== ref) {
                        if (ref) { el.setAttribute('data-vp-ava', ref); el.style.setProperty('--vp-ava-url', `url("${lookImgUrl(ref)}")`); }
                        else { el.removeAttribute('data-vp-ava'); el.style.removeProperty('--vp-ava-url'); }
                    }
                    let v = el.querySelector(':scope > .vp-ava-vid');
                    const want = ref && vid && el.getBoundingClientRect().width >= 60 ? vid : '';
                    if (!want) { if (v) v.remove(); return; }
                    const src = 'https://cdn.xn--d1ah4a.com/' + want;
                    if (!v) {
                        v = document.createElement('video');
                        v.className = 'vp-ava-vid';
                        v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
                        v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
                        v.addEventListener('playing', () => v.classList.add('vp-live'));
                        el.prepend(v);
                    }
                    if (v.getAttribute('src') !== src) { v.classList.remove('vp-live'); v.src = src; v.play().catch(() => { }); }
                }
                avaLookOf = u => {
                    const own = (GM_getValue(acctKey('vp_ava'), null) || {}).ref || '';
                    if (u === (myUsername || '').toLowerCase()) return own ? lookImgUrl(own) : '';
                    const r = showLooks && lookBy.get(u);
                    return r && r.a ? lookImgUrl(r.a) : '';
                };
                function markAvatars(me, pu, others) {
                    const own = GM_getValue(acctKey('vp_ava'), null) || {};
                    const refOf = u => u === me ? { a: own.ref || '', va: own.vid || '' } : others && lookBy.get(u) || {};
                    const put = (av, u) => { const r = refOf(u); avaPut(av, r.a || '', r.va || ''); };
                    document.querySelectorAll(PROFILE_LINK).forEach(link => {
                        const av = link.querySelector('.' + SELECTORS.avatar);
                        if (av) put(av, userOf(link.getAttribute('href')));
                    });
                    loneNicks().forEach(({ el, u }) => {
                        const av = [...(el.parentElement || el).children].find(x => x.matches('.' + SELECTORS.avatar));
                        if (av) put(av, u);
                    });
                    if (pu) document.querySelectorAll('.' + SELECTORS.avatar).forEach(av => {
                        if (!av.closest(PROFILE_LINK) && !av.closest('.' + SELECTORS.post) && nearLargeNick(av)) put(av, pu);
                    });
                    document.querySelectorAll('.' + SELECTORS.avatar + '.my-avatar-glow').forEach(av => { if (!av.closest(PROFILE_LINK) && !(pu && nearLargeNick(av))) put(av, me); });
                }
                function markLooks() {
                    const me = (myUsername || '').toLowerCase();
                    const pm = location.pathname.match(/^\/@([\w.]+)(\/.*)?$/), pu = pm && !/\/post\//.test(pm[2] || '') ? pm[1].toLowerCase() : '';
                    if (!showLooks) { setBgGuest(null); markAvatars(me, pu, false); return; }
                    const raw = localStorage.getItem(VERIFICATION_STORAGE_KEY) || '{}';
                    if (raw !== lookRaw) {
                        lookRaw = raw;
                        lookBy = new Map();
                        let parsed = {};
                        try { parsed = JSON.parse(raw) || {}; } catch (e) { }
                        for (const [name, info] of Object.entries(parsed)) if (info && info.look) lookBy.set(name.toLowerCase(), info.look);
                    }
                    setBgGuest(pu && pu !== me ? lookBy.get(pu) : null);
                    markAvatars(me, pu, true);
                    if (!lookBy.size) return;
                    const put = (el, attr, val) => {
                        if (!el) return;
                        if (val) { if (el.getAttribute(attr) !== val) el.setAttribute(attr, val); }
                        else if (el.hasAttribute(attr)) el.removeAttribute(attr);
                    };
                    const apply = (nick, avatar, look) => {
                        if (nick) {
                            put(nick, 'data-vp-look', look.n);
                            const box = nick.closest('.' + SELECTORS.nickContainer) || nick.parentElement;
                            put(box, 'data-vp-look-glow', look.g[0] === '1' ? look.n : '');
                            if (box && look.g[0] === '1') glowRoom(box);
                        }
                        if (avatar) put(avatar, 'data-vp-look-av', look.g[1] === '1' ? look.n : '');
                    };
                    document.querySelectorAll(PROFILE_LINK).forEach(link => {
                        const u = userOf(link.getAttribute('href'));
                        const look = u !== me && lookBy.get(u);
                        if (!look) return;
                        const av = link.querySelector('.' + SELECTORS.avatar);
                        if (av) apply(null, av, look); else apply(nickLeaf(link), null, look);
                    });
                    loneNicks().forEach(({ el, u }) => {
                        const look = u !== me && lookBy.get(u);
                        if (!look) return;
                        apply(nickLeaf(el), [...(el.parentElement || el).children].find(x => x.matches('.' + SELECTORS.avatar)) || null, look);
                    });
                    const look = pu && pu !== me && lookBy.get(pu);
                    if (look) {
                        const large = siteEl('nickLarge');
                        if (large) apply(nickLeaf(large), null, look);
                        document.querySelectorAll('.' + SELECTORS.avatar).forEach(av => {
                            if (!av.closest(PROFILE_LINK) && !av.closest('.' + SELECTORS.post) && nearLargeNick(av)) apply(null, av, look);
                        });
                    }
                }

                findAllMyAvatars();
                findAllMyNicks();

                markVerifiedUsers();
                avatarRefresh = markLooks;
                markLooks();
                onDom(function myNickAndAvatar() {
                    findAllMyAvatars();
                    findAllMyNicks();
                    markVerifiedUsers();
                    markLooks();
                });

                function replaceIcon() {
                    let container = siteEl('logoContainer');
                    if (!container) return;
                    const customLink = container.querySelector(`a[href="${TG_URL}"]`);
                    if (customLink) return;
                    const oldSvg = container.querySelector('svg');
                    if (!oldSvg) return;
                    const logo = scriptLogo(36);
                    if (!logo) return;
                    const link = document.createElement('a');
                    link.href = TG_URL;
                    link.target = '_blank';
                    link.style.cursor = 'pointer';
                    link.style.display = 'inline-flex';
                    link.style.alignItems = 'center';
                    link.appendChild(logo);
                    const versionBtn = container.querySelector('.' + SELECTORS.versionBtn);
                    let bottomBlock = container.querySelector('.vp-version-row');
                    container.innerHTML = '';
                    container.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start; gap: 4px;';
                    const topRow = document.createElement('div');
                    topRow.className = 'vp-logo-top';
                    const iconCol = document.createElement('div');
                    iconCol.className = 'vp-logo-col';
                    iconCol.appendChild(link);
                    topRow.appendChild(iconCol);
                    const siteVer = versionBtn || document.createElement('button');
                    if (!versionBtn) { siteVer.className = SELECTORS.versionBtn; siteVer.textContent = 'v1.1.1'; }
                    siteVer.style.margin = '0';
                    siteVer.style.padding = '0';
                    topRow.appendChild(siteVer);
                    container.appendChild(topRow);
                    const container0 = container;
                    container = iconCol;
                    if (bottomBlock) {
                        bottomBlock.style.margin = '0';
                        bottomBlock.style.justifyContent = 'center';
                        container.appendChild(bottomBlock);
                    } else {
                        const newBottom = document.createElement('div');
                        newBottom.className = 'vp-version-row';
                        const versionSpan = document.createElement('span');
                        versionSpan.className = 'vp-version-chip';
                        versionSpan.title = 'ИТД X';
                        versionSpan.textContent = 'v' + GM_info.script.version;
                        newBottom.appendChild(versionSpan);
                        container.appendChild(newBottom);
                        container0._bottomBlock = newBottom;
                    }
                    markChangelogChips();
                }

                replaceIcon();

                onDom(function logoIcon() { replaceIcon(); });

                let resizeTimer;
                window.addEventListener('resize', () => {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(() => {
                        replaceIcon();
                        updateNavIcon();
                    }, 300);
                });

                const updateUrl = 'https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/main/ITD-Visual-Pack.user.js?t=' + Date.now();
                const UPDATE_EVERY = 5 * 60 * 1000;
                let updateAskedAt = 0;
                function latestVersion(fresh) {
                    let cached = null;
                    try { cached = JSON.parse(GM_getValue('vp_latest', 'null')); } catch (e) { }
                    if (cached && (versionCompare(cached.v, GM_info.script.version) > 0 || !fresh && Date.now() - cached.at < UPDATE_EVERY)) {
                        return Promise.resolve(cached.v);
                    }
                    updateAskedAt = Date.now();
                    GM_setValue('vp_upd_ask', updateAskedAt);
                    return new Promise(resolve => GM_xmlhttpRequest({
                        method: 'GET',
                        url: updateUrl.replace(/t=\d+$/, 't=' + Date.now()),
                        headers: { Range: 'bytes=0-2047' },
                        onload: res => {
                            const m = (res.status === 200 || res.status === 206) && res.responseText.match(/\/\/\s*@version\s+([\d.]+)/);
                            if (m) GM_setValue('vp_latest', JSON.stringify({ v: m[1], at: Date.now() }));
                            resolve(m ? m[1] : null);
                        },
                        onerror: e => { console.warn('[ITD VP] обновление: GitHub не ответил', e); resolve(null); }
                    }));
                }

                function versionCompare(v1, v2) {
                    const a = v1.split('.').map(Number);
                    const b = v2.split('.').map(Number);
                    for (let i = 0; i < Math.max(a.length, b.length); i++) {
                        const na = a[i] || 0, nb = b[i] || 0;
                        if (na > nb) return 1;
                        if (na < nb) return -1;
                    }
                    return 0;
                }

                function createUpdateButton() {
                    const container = siteEl('logoContainer');
                    if (!container) return;
                    if (container.querySelector('.itd-update-sidebar-btn')) return;
                    const row = container.querySelector('.vp-version-row');
                    if (!row) return;
                    const btn = document.createElement('button');
                    btn.className = 'itd-update-sidebar-btn';
                    btn.title = 'Доступна новая версия';
                    btn.innerHTML = ICONS.UPDATE + ' <span>Обновить</span>';
                    btn.onclick = function () { window.open(updateUrl, '_blank'); this.remove(); };
                    row.appendChild(btn);
                }

                let updateAvailable = false;
                const updateCheck = latestVersion().then(v => {
                    updateAvailable = !!v && versionCompare(v, GM_info.script.version) > 0;
                    console.log(`[ITD VP] обновление: на GitHub ${v || '?'}, у тебя ${GM_info.script.version}${updateAvailable ? ' — есть новее' : ''}`);
                    return updateAvailable;
                });
                updateCheck.then(yes => { if (yes) setTimeout(createUpdateButton, 1000); });
                let updateTimer = 0;
                function updatePoll() {
                    if (updateAvailable) { clearInterval(updateTimer); return; }
                    if (document.hidden || Date.now() - Math.max(updateAskedAt, +GM_getValue('vp_upd_ask', 0) || 0) < UPDATE_EVERY - 5000) return;
                    latestVersion(true).then(v => {
                        if (updateAvailable || !v || versionCompare(v, GM_info.script.version) <= 0) return;
                        updateAvailable = true;
                        clearInterval(updateTimer);
                        document.removeEventListener('visibilitychange', updatePoll);
                        console.log(`[ITD VP] обновление: вышла ${v}, у тебя ${GM_info.script.version}`);
                        createUpdateButton();
                    });
                }
                updateCheck.then(yes => {
                    if (yes) return;
                    updateAskedAt = updateAskedAt || Date.now();
                    updateTimer = setInterval(updatePoll, 60 * 1000);
                    document.addEventListener('visibilitychange', updatePoll);
                });

                const originalReplaceIcon = replaceIcon;
                replaceIcon = function () {
                    originalReplaceIcon();
                    if (updateAvailable) createUpdateButton();
                };

                function createNavIcon() {
                    const nav = siteEl('feedBar');
                    if (!nav) return;
                    if (nav.querySelector('.my-nav-block')) return;

                    const block = document.createElement('div');
                    block.className = 'my-nav-block';
                    block.style.cssText = 'display: flex; align-items: center; gap: 12px; flex-shrink: 0;';

                    const wrapper = document.createElement('div');
                    wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 2px;';

                    const logo = scriptLogo(28);
                    if (!logo) return;
                    const link = document.createElement('a');
                    link.href = TG_URL;
                    link.target = '_blank';
                    link.style.cursor = 'pointer';
                    link.style.display = 'inline-flex';
                    link.style.alignItems = 'center';
                    link.appendChild(logo);
                    wrapper.appendChild(link);

                    const bottomRow = document.createElement('div');
                    bottomRow.className = 'vp-version-row vp-version-col';

                    const versionSpan = document.createElement('span');
                    versionSpan.className = 'vp-version-chip';
                    versionSpan.textContent = 'v' + GM_info.script.version;
                    bottomRow.appendChild(versionSpan);

                    const updateBtn = document.createElement('button');
                    updateBtn.className = 'itd-update-sidebar-btn';
                    updateBtn.title = 'Доступна новая версия';
                    updateBtn.innerHTML = ICONS.UPDATE + ' <span>Обновить</span>';
                    updateBtn.style.display = 'none';
                    updateBtn.onclick = function () {
                        window.open(updateUrl, '_blank');
                        this.remove();
                    };
                    bottomRow.appendChild(updateBtn);

                    wrapper.appendChild(bottomRow);
                    block.appendChild(wrapper);
                    markChangelogChips();

                    nav.prepend(block);
                    fixNavLayout();

                    updateCheck.then(yes => { if (yes) updateBtn.style.display = 'inline-flex'; });
                }

                function fixNavLayout() {
                    const nav = siteEl('feedBar');
                    if (!nav) return;
                    const block = nav.querySelector('.my-nav-block');
                    const tabs = nav.querySelector('.' + SELECTORS.tabs);
                    if (block && tabs) {
                        tabs.style.flex = '1 1 auto';
                        tabs.style.minWidth = '0';
                        tabs.style.width = 'auto';
                        block.style.flex = '0 0 auto';
                        nav.style.display = 'flex';
                        nav.style.width = '100%';
                        const logo = block.querySelector('img.vp-app-logo'), chip = block.querySelector('.vp-version-row');
                        const h = tabs.getBoundingClientRect().height;
                        if (logo && chip && h) {
                            const size = Math.round(Math.max(28, Math.min(48, h - chip.offsetHeight - 4)));
                            if (logo.width !== size) {
                                logo.width = logo.height = size;
                                logo.style.width = logo.style.height = size + 'px';
                                logo.style.borderRadius = Math.round(size * 0.25) + 'px';
                            }
                            block.style.alignSelf = 'center';
                            block.style.height = h + 'px';
                            block.firstElementChild.style.justifyContent = 'space-between';
                            block.firstElementChild.style.height = '100%';
                        }
                    }
                }

                function updateNavIcon() {
                    const nav = siteEl('feedBar');
                    if (!nav) return;
                    const isMobile = window.innerWidth <= PHONE_MAX;
                    const block = nav.querySelector('.my-nav-block');
                    const tabs = nav.querySelector('.' + SELECTORS.tabs);

                    if (isMobile) {
                        if (!block) {
                            createNavIcon();
                        } else {
                            fixNavLayout();
                        }
                    } else {
                        if (block) block.remove();
                        if (tabs) {
                            tabs.style.flex = '';
                            tabs.style.minWidth = '';
                            tabs.style.width = '';
                        }
                        nav.style.width = '';
                        nav.style.display = '';
                    }
                }

                setTimeout(updateNavIcon, 500);

                onDom(function clanTabName() {
                    document.querySelectorAll('.' + SELECTORS.feedBar + ' button').forEach(b => {
                        const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
                        for (let t; (t = walker.nextNode());) if (t.nodeValue.trim() === 'Лента кланов') t.nodeValue = t.nodeValue.replace('Лента кланов', 'Кланы');
                    });
                });

                onDom(function feedBarIcon() {
                    if (siteEl('feedBar')) updateNavIcon();
                });
                scheduleAutoLike();
            } catch (e) { console.warn('[ITD VP] запуск мода', e); logErr('запуск мода', e); }
        }

        let lastFrame = 0, bestGap = 1000, slow = 0, halfRate = false, odd = false, halfSince = 0, retryMs = 15000;
        function frame(t) {
            requestAnimationFrame(frame);
            if (halfRate && t - halfSince > retryMs) { halfRate = false; slow = 0; retryMs = Math.min(retryMs * 2, 240000); }
            if (halfRate && (odd = !odd)) return;
            const gap = lastFrame ? t - lastFrame : 16.7;
            lastFrame = t;
            if (gap > 0 && gap < 100) {
                const base = halfRate ? gap / 2 : gap;
                bestGap = Math.min(bestGap, base);
                slow = base > bestGap * 1.7 ? slow + 1 : Math.max(0, slow - 2);
                if (!halfRate && slow > 45) {
                    halfRate = true; halfSince = t; slow = 0;
                    document.documentElement.classList.add('vp-glass-lite');
                }
            }
            const dt = Math.min(3, gap / 50);
            if (currentStyle === 'rainbow') { stepHue(dt); paint(); }
            bgFrame(dt);
        }
        paint();
        requestAnimationFrame(frame);

        var canvasRO = new ResizeObserver(resizeCanvas);
        canvasRO.observe(canvas);
        resizeCanvas();
        initVisuals();
        sched.add('look', publishLook, { every: 60000, net: true });
        initBanner();

        (function () {
            const STORAGE_KEY = 'user_sticker_packs_v1';
            const RECENT_STORAGE_KEY = 'recent_stickers_v1';
            const MAX_NAME_LENGTH = 20;
            const DEFAULT_PACK_NAME = 'Новый пакет';
            const PANEL_WIDTH = 320;

            const readList = key => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; } };
            const writeList = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } };
            let userPacks = readList(STORAGE_KEY);
            let recentStickers = readList(RECENT_STORAGE_KEY);
            const saveUserPacks = () => { writeList(STORAGE_KEY, userPacks); packsChanged(); };
            const saveRecent = () => writeList(RECENT_STORAGE_KEY, recentStickers);
            const packStickers = key => key === 'recent' ? recentStickers : (userPacks.find(p => p.id === key) || { stickers: [] }).stickers;
            const packName = key => key === 'recent' ? 'Недавние' : ((userPacks.find(p => p.id === key) || {}).name || DEFAULT_PACK_NAME);
            const allPackKeys = () => ['recent', ...userPacks.map(p => p.id)];
            function savePack(key) { if (key === 'recent') saveRecent(); else saveUserPacks(); }

            const SYNC_TAG = 'ITDXS';
            const PACKS_AT_KEY = 'user_sticker_packs_at';
            const EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
            const CDN_IMG = /^https:\/\/cdn\.xn--d1ah4a\.com\/images\/([0-9a-f-]{36})\.(\w+)$/i;
            let packsAt = +(localStorage.getItem(PACKS_AT_KEY) || 0), syncTimer = 0, syncing = false, applyingRemote = false;
            const hexToBytes = h => Uint8Array.from(h.replace(/-/g, '').match(/../g), x => parseInt(x, 16));
            const bytesToUuid = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
            const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            function encodePacks(packs, at) {
                const out = [1], put = (...b) => out.push(...b), str = t => { const u = new TextEncoder().encode(t).slice(0, 255); put(u.length, ...u); };
                const sec = Math.floor(at / 1000);
                put((sec >>> 24) & 255, (sec >>> 16) & 255, (sec >>> 8) & 255, sec & 255, packs.length);
                for (const pk of packs) {
                    str(pk.id || ''); str(pk.name || '');
                    const list = pk.stickers.slice(0, 65535);
                    put(list.length >> 8, list.length & 255);
                    for (const st of list) {
                        const m = String(st.url || '').match(CDN_IMG), ext = m ? EXT.indexOf(m[2].toLowerCase()) : -1;
                        if (m && ext >= 0 && UUID.test(st.id || '')) { put(ext, ...hexToBytes(st.id), ...hexToBytes(m[1])); }
                        else { put(255); str(st.id || ''); str(st.url || ''); }
                    }
                }
                out[0] = 2;
                for (let i = 1; i < out.length; i++) out[i] ^= OBF_KEY[i % OBF_KEY.length];
                let bin = '';
                out.forEach(b => { bin += String.fromCharCode(b); });
                return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            }
            function decodePacks(b64) {
                const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
                const b = Uint8Array.from(bin, c => c.charCodeAt(0));
                if (b[0] === 2) { for (let i = 1; i < b.length; i++) b[i] ^= OBF_KEY[i % OBF_KEY.length]; b[0] = 1; }
                let i = 0;
                const byte = () => { if (i >= b.length) throw new Error('обрыв данных'); return b[i++]; };
                const str = () => { const n = byte(), t = new TextDecoder().decode(b.slice(i, i + n)); i += n; return t; };
                if (byte() !== 1) throw new Error('версия паков');
                const at = ((byte() << 24) >>> 0) + (byte() << 16) + (byte() << 8) + byte();
                const packs = [];
                for (let n = byte(); n > 0; n--) {
                    const pk = { id: str(), name: str(), stickers: [] };
                    for (let k = (byte() << 8) + byte(); k > 0; k--) {
                        const ext = byte();
                        if (ext === 255) { const id = str(), url = str(); pk.stickers.push({ id, url }); continue; }
                        const id = bytesToUuid(b.slice(i, i + 16)), img = bytesToUuid(b.slice(i + 16, i + 32));
                        i += 32;
                        pk.stickers.push({ id, url: `https://cdn.xn--d1ah4a.com/images/${img}.${EXT[ext] || 'png'}` });
                    }
                    packs.push(pk);
                }
                return { at: at * 1000, packs };
            }
            const myAccountId = () => (meData && meData.id) || (verifiedInfo(myUsername || '') || {}).id || null;
            const partsKey = () => 'vp_sticker_parts_' + myAccountId();
            const remotePacksAt = () => { const f = String((verifiedInfo(myUsername || '') || {}).flags || ''); return f.length > 1 ? +f.slice(1) * 1000 : 0; };
            async function packParts(scan) {
                if (!scan) { const saved = GM_getValue(partsKey(), null); if (saved) return saved; }
                const me = myAccountId();
                const list = (await allComments(STICKER_POST_ID)).filter(c => c.author && c.author.id === me && /^ITDXS \d+\/\d+ /.test(c.content || ''))
                    .map(c => { const m = c.content.match(/^ITDXS (\d+)\/(\d+) (\S*)/); return { id: c.id, i: +m[1], n: +m[2], d: m[3] }; });
                GM_setValue(partsKey(), list.map(({ id, i, n }) => ({ id, i, n })));
                return list;
            }
            function applyRemotePacks(remote) {
                applyingRemote = true;
                userPacks = remote.packs;
                writeList(STORAGE_KEY, userPacks);
                packsAt = remote.at;
                localStorage.setItem(PACKS_AT_KEY, String(packsAt));
                applyingRemote = false;
                if (scrollContainer) { updateTabButtons(); refreshAllPackGrids(); }
            }
            const patchComment = (id, content) => editComment(id, content);
            async function pullPacks() {
                const at = remotePacksAt();
                if (!at || at <= packsAt + 999) return;
                const parts = (await packParts(true)).filter(p => p.n).sort((a, b) => a.i - b.i);
                const n = parts.length && parts[0].n;
                if (!n || parts.length < n || !parts.slice(0, n).every((p, k) => p.i === k + 1 && p.n === n)) return;
                const remote = decodePacks(parts.slice(0, n).map(p => p.d).join(''));
                if (remote.at <= packsAt + 999) return;
                const legacy = !packsAt && userPacks.length ? userPacks.filter(pk => !remote.packs.some(r => r.id === pk.id)) : [];
                applyRemotePacks({ at: remote.at, packs: [...remote.packs, ...legacy] });
                if (legacy.length) { packsAt = Date.now(); localStorage.setItem(PACKS_AT_KEY, String(packsAt)); return 'push'; }
            }
            async function pushPacks() {
                const mine = verifiedInfo(myUsername || '');
                if (!mine || !mine.commentId) return;
                let parts = await packParts(false);
                if (!parts.length) parts = await packParts(true);
                if (!packsAt) { packsAt = Date.now(); localStorage.setItem(PACKS_AT_KEY, String(packsAt)); }
                const data = encodePacks(userPacks, packsAt), CH = 1900, chunks = [];
                for (let k = 0; k < data.length || !chunks.length; k += CH) chunks.push(data.slice(k, k + CH));
                const slots = parts.map(p => p.id), saved = [];
                for (let k = 0; k < Math.max(chunks.length, slots.length); k++) {
                    const content = k < chunks.length ? `${SYNC_TAG} ${k + 1}/${chunks.length} ${chunks[k]}` : `${SYNC_TAG} 0/0 -`;
                    if (slots[k]) {
                        const res = await patchComment(slots[k], content);
                        if (!res.ok) throw new Error('паки: правка ' + res.status);
                        saved.push({ id: slots[k], i: k < chunks.length ? k + 1 : 0, n: k < chunks.length ? chunks.length : 0 });
                    } else {
                        const res = await sendComment(STICKER_POST_ID, content);
                        if (!res.ok) throw new Error('паки: запись ' + res.status);
                        const j = await res.json();
                        saved.push({ id: (j.data || j).id, i: k + 1, n: chunks.length });
                    }
                }
                GM_setValue(partsKey(), saved);
                const code = String(mine.code) + '1' + Math.floor(packsAt / 1000);
                const res = await patchComment(mine.commentId, code);
                if (res.ok) await checkAllComments(true);
            }
            async function syncPacks(up) {
                if (!STICKER_POST_ID || syncing || !myUsername || !myAccountId()) return;
                syncing = true;
                try {
                    if (up) await pushPacks();
                    else {
                        const merged = await pullPacks();
                        const at = remotePacksAt();
                        if (merged === 'push' || (userPacks.length && (!packsAt || packsAt > at + 999))) await pushPacks();
                    }
                } catch (e) {
                    logErr('паки: синхронизация', e);
                } finally {
                    syncing = false;
                }
            }
            function packsChanged() {
                if (applyingRemote) return;
                packsAt = Date.now();
                localStorage.setItem(PACKS_AT_KEY, String(packsAt));
                clearTimeout(syncTimer);
                syncTimer = setTimeout(() => syncPacks(true), 4000);
            }
            (function syncLoop() {
                if (!STICKER_POST_ID) return;
                const tick = () => myUsername && myAccountId() && verifiedInfo(myUsername) ? syncPacks(false) : setTimeout(tick, 3000);
                setTimeout(tick, 6000);
                sched.add('packs', () => syncPacks(false), { every: 10 * 60 * 1000, net: true, visible: true });
            })();

            const ZIP_IMG = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };
            const ZIP_LIMITS = { packs: 20, perPack: 120, total: 300, bytes: 5 * 1024 * 1024 };
            async function readZip(file) {
                const buf = new Uint8Array(await file.arrayBuffer()), dv = new DataView(buf.buffer);
                let eocd = -1;
                for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
                if (eocd < 0) throw new Error('это не zip-архив');
                const count = dv.getUint16(eocd + 10, true);
                let at = dv.getUint32(eocd + 16, true);
                const utf8 = new TextDecoder('utf-8', { fatal: true }), dos = new TextDecoder('ibm866');
                const entries = [];
                for (let k = 0; k < count; k++) {
                    if (dv.getUint32(at, true) !== 0x02014b50) throw new Error('архив повреждён');
                    const flags = dv.getUint16(at + 8, true), method = dv.getUint16(at + 10, true);
                    const csize = dv.getUint32(at + 20, true), size = dv.getUint32(at + 24, true);
                    const nlen = dv.getUint16(at + 28, true), xlen = dv.getUint16(at + 30, true), clen = dv.getUint16(at + 32, true);
                    const local = dv.getUint32(at + 42, true), raw = buf.subarray(at + 46, at + 46 + nlen);
                    let name;
                    try { name = flags & 0x800 ? new TextDecoder().decode(raw) : utf8.decode(raw); } catch (e) { name = dos.decode(raw); }
                    entries.push({ name: name.replace(/\\/g, '/'), method, csize, size, local });
                    at += 46 + nlen + xlen + clen;
                }
                entries.data = async e => {
                    const start = e.local + 30 + dv.getUint16(e.local + 26, true) + dv.getUint16(e.local + 28, true);
                    const bytes = buf.slice(start, start + e.csize);
                    if (e.method === 0) return bytes;
                    if (e.method !== 8) throw new Error('неизвестное сжатие');
                    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
                };
                return entries;
            }
            function zipPacks(entries, zipName) {
                const imgs = entries.filter(e => {
                    const parts = e.name.split('/');
                    return !e.name.endsWith('/') && !parts.some(p => p.startsWith('.') || p === '__MACOSX') && ZIP_IMG[(parts.pop().split('.').pop() || '').toLowerCase()];
                });
                let paths = imgs.map(e => e.name.split('/'));
                while (paths.length && paths.every(p => p.length > 2 && p[0] === paths[0][0])) paths = paths.map(p => p.slice(1));
                const groups = new Map();
                imgs.forEach((e, i) => {
                    const p = paths[i], pack = p.length > 1 ? p[0] : zipName.replace(/\.zip$/i, '');
                    if (!groups.has(pack)) groups.set(pack, []);
                    groups.get(pack).push(e);
                });
                return [...groups].map(([name, files]) => ({ name: name.trim().slice(0, MAX_NAME_LENGTH) || DEFAULT_PACK_NAME, files: files.sort((a, b) => a.name.localeCompare(b.name, 'ru', { numeric: true })) }));
            }
            function openZipImport() {
                if (!stickerPanel || stickerPanel.querySelector('.vp-sp-import')) return;
                exitEditMode();
                const card = el('div', 'vp-sp-import', `<b>Паки из архива</b>
                <ul>
                    <li>Архив <b style="font-size:inherit">.zip</b></li>
                    <li>Папка в архиве = пак, имя папки = название пака</li>
                    <li>В папке — картинки png, jpg, gif, webp (до 5 МБ); встают как есть, без обрезки</li>
                    <li>Картинки прямо в архиве, без папки, — пак с именем архива</li>
                </ul>
                <pre>стикеры.zip
├ Коты/
│  ├ 1.png
│  └ 2.gif
└ Мемы/
   └ шрек.jpg</pre>
                <div class="vp-imp-status"></div>
                <div class="vp-imp-btns"><button type="button" class="vp-imp-cancel">Отмена</button><button type="button" class="vp-imp-go">Выбрать архив</button></div>`);
                stickerPanel.appendChild(card);
                const status = card.querySelector('.vp-imp-status'), go = card.querySelector('.vp-imp-go'), cancel = card.querySelector('.vp-imp-cancel');
                let busy = false, stop = false;
                cancel.onclick = () => { if (busy) { stop = true; cancel.disabled = true; status.textContent = 'Останавливаю…'; } else card.remove(); };
                go.onclick = () => {
                    const input = el('input');
                    input.type = 'file';
                    input.accept = '.zip,application/zip';
                    input.onchange = async () => {
                        const file = input.files[0];
                        if (!file) return;
                        busy = true; go.disabled = true;
                        try {
                            status.textContent = 'Читаю архив…';
                            const entries = await readZip(file);
                            const packs = zipPacks(entries, file.name).slice(0, ZIP_LIMITS.packs);
                            const total = Math.min(ZIP_LIMITS.total, packs.reduce((n, pk) => n + Math.min(pk.files.length, ZIP_LIMITS.perPack), 0));
                            if (!total) throw new Error('в архиве нет картинок по правилам');
                            let done = 0, skipped = 0;
                            for (const pk of packs) {
                                if (stop || done >= total) break;
                                const pack = { id: 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), name: pk.name, stickers: [] };
                                for (const e of pk.files.slice(0, ZIP_LIMITS.perPack)) {
                                    if (stop || done >= total) break;
                                    status.textContent = `Загружаю «${pk.name}»: ${done + 1} из ${total}…`;
                                    try {
                                        if (e.size > ZIP_LIMITS.bytes) throw new Error('больше 5 МБ');
                                        const base = e.name.split('/').pop(), type = ZIP_IMG[base.split('.').pop().toLowerCase()];
                                        const data = await uploadImageToServer(new File([await entries.data(e)], base, { type }));
                                        pack.stickers.push(data);
                                    } catch (err) { skipped++; }
                                    done++;
                                }
                                if (pack.stickers.length) { userPacks.push(pack); saveUserPacks(); }
                            }
                            rebuildPanel();
                            const left = stickerPanel.querySelector('.vp-sp-import');
                            if (left) left.remove();
                            showPanel();
                            if (skipped) alert(`Готово. Не загрузились: ${skipped} (слишком большие или битые картинки)`);
                        } catch (err) {
                            status.textContent = 'Не вышло: ' + (err && err.message || err);
                            logErr('паки из архива', err);
                            busy = false; go.disabled = false;
                        }
                    };
                    input.click();
                };
            }

            function addToRecent(sticker) {
                recentStickers = [sticker, ...recentStickers.filter(s => s.id !== sticker.id)].slice(0, 30);
                saveRecent();
            }

            const style = addCss(`
            @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
            .spin{animation:spin 1s linear infinite;transform-origin:center}
            .sticker-dragging{opacity:0.3!important;pointer-events:none!important}
            .sticker-placeholder{background:rgba(0,128,255,0.2)!important;border:2px dashed #0080FF!important}
            @keyframes stickerShake1{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(0.5px,0.5px)rotate(0.3deg)}50%{transform:translate(-0.5px,-0.3px)rotate(-0.2deg)}75%{transform:translate(-0.3px,0.4px)rotate(0.1deg)}}
            @keyframes stickerShake2{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(-0.4px,-0.5px)rotate(-0.3deg)}50%{transform:translate(0.6px,0.2px)rotate(0.2deg)}75%{transform:translate(0.2px,-0.4px)rotate(-0.1deg)}}
            @keyframes stickerShake3{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(-0.5px,0.3px)rotate(0.2deg)}50%{transform:translate(0.4px,-0.5px)rotate(-0.3deg)}75%{transform:translate(0.3px,0.3px)rotate(0.1deg)}}
            @keyframes stickerShake4{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(0.3px,-0.4px)rotate(-0.2deg)}50%{transform:translate(-0.5px,0.5px)rotate(0.3deg)}75%{transform:translate(-0.2px,-0.3px)rotate(-0.1deg)}}
            @keyframes stickerShake5{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(0.2px,-0.3px)rotate(0.25deg)}50%{transform:translate(-0.3px,0.4px)rotate(-0.15deg)}75%{transform:translate(0.4px,0.2px)rotate(0.2deg)}}
            @keyframes stickerShake6{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(-0.6px,0.1px)rotate(-0.35deg)}50%{transform:translate(0.3px,-0.3px)rotate(0.15deg)}75%{transform:translate(-0.2px,0.5px)rotate(-0.25deg)}}
            @keyframes stickerShake7{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(0.4px,-0.2px)rotate(0.2deg)}50%{transform:translate(-0.2px,0.6px)rotate(-0.3deg)}75%{transform:translate(0.3px,-0.1px)rotate(0.1deg)}}
            @keyframes stickerShake8{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(-0.3px,-0.4px)rotate(-0.25deg)}50%{transform:translate(0.5px,0.1px)rotate(0.2deg)}75%{transform:translate(-0.1px,-0.5px)rotate(-0.15deg)}}
            .sticker-editing{animation-duration:0.4s;animation-iteration-count:infinite;animation-timing-function:ease-in-out;cursor:grab}
            .sticker-shake-1{animation-name:stickerShake1}
            .sticker-shake-2{animation-name:stickerShake2}
            .sticker-shake-3{animation-name:stickerShake3}
            .sticker-shake-4{animation-name:stickerShake4}
            .sticker-shake-5{animation-name:stickerShake5}
            .sticker-shake-6{animation-name:stickerShake6}
            .sticker-shake-7{animation-name:stickerShake7}
            .sticker-shake-8{animation-name:stickerShake8}
            .sticker-editing:active{cursor:grabbing}
            .sticker-editing { touch-action: none; }
            .vp-sticker-item.vp-sticker-ghost { position: fixed; z-index: 10001; pointer-events: none; margin: 0; border-radius: 10px; overflow: hidden;
                box-shadow: 0 12px 30px rgba(0, 0, 0, .45), 0 0 0 2px var(--accent-primary); }
            .vp-sticker-ghost .vp-sticker-del { display: none; }
            .vp-sticker-item.vp-sticker-ghost { transition: none; animation: none; will-change: transform; transform-origin: 50% 50%; }
            .sticker-panel.vp-drag .sticker-editing { animation-play-state: paused; }
            .vp-sticker-item.vp-hole { opacity: .25; animation: none; box-shadow: inset 0 0 0 2px var(--accent-primary); }

            .sticker-btn { background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: 9999px;
                display: inline-flex; align-items: center; justify-content: center; color: var(--text-secondary);
                margin-right: 5px; width: 36px; height: 36px; }
            .sticker-btn:hover { background-color: var(--bg-hover, rgba(255,255,255,0.08)); }

            #temp_sticker_preview { padding: 0 0 8px; }
            .vp-sticker-attach { display: flex; gap: 8px; flex-wrap: wrap; }
            .vp-sticker-thumb { width: 80px; height: 80px; position: relative; border-radius: 8px; overflow: hidden; }
            .vp-sticker-thumb > img { width: 100%; height: 100%; object-fit: cover; }
            .vp-sticker-remove { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; background: rgba(0,0,0,0.6);
                border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; }
            .vp-sticker-hide { display: none !important; }
            .vp-sticker-sendbtn { margin: 6px !important; transform: translate(0) !important; }

            .sticker-panel { position: fixed; display: none; flex-direction: column; background: var(--block-bg);
                border-radius: 20px; border: 1px solid var(--border-color,rgba(255,255,255,0.1)); z-index: 10000;
                width: ${PANEL_WIDTH}px; height: 440px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); overflow: hidden; }
            .sticker-panel.vp-open { display: flex; }
            .vp-sp-import { position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; gap: 10px; padding: 16px;
                background: var(--block-bg); border-radius: inherit; font-size: 13px; line-height: 1.4; color: var(--text-primary,#fff); overflow: auto; }
            html.vp-glass .vp-sp-import { background: rgba(24,24,24,.96); }
            html.vp-glass.vp-light .vp-sp-import { background: rgba(255,255,255,.97); }
            .vp-sp-import b { font-size: 15px; }
            .vp-sp-import ul { margin: 0; padding-left: 18px; list-style: disc; color: var(--text-secondary); }
            .vp-sp-import li + li { margin-top: 4px; }
            .vp-sp-import pre { margin: 0; padding: 8px 10px; border-radius: 10px; background: rgba(128,128,128,.14); font-size: 12px; line-height: 1.35; white-space: pre; }
            .vp-sp-import .vp-imp-btns { display: flex; gap: 8px; margin-top: auto; }
            .vp-sp-import button { flex: 1; height: 38px; border: 0; border-radius: 12px; cursor: pointer; font: inherit; font-weight: 600;
                background: rgba(128,128,128,.18); color: inherit; }
            .vp-sp-import button.vp-imp-go { background: var(--accent-primary); color: #fff; }
            .vp-sp-import button:disabled { opacity: .5; cursor: default; }
            .vp-sp-import .vp-imp-status { min-height: 18px; color: var(--text-secondary); }
            .vp-sp-head { display: flex; align-items: center; padding: 8px; border-bottom: 1px solid var(--border-color,rgba(255,255,255,0.1));
                gap: 4px; flex-shrink: 0; }
            .vp-sp-tab { background: transparent; border: none; width: 32px; height: 32px; border-radius: 12px; cursor: pointer;
                display: flex; align-items: center; justify-content: center; padding: 0; flex-shrink: 0;
                color: var(--text-secondary); }
            .vp-sp-tab.vp-recent { color: white; }
            .vp-sp-tab.vp-on { background: var(--accent-primary); }
            .vp-sp-tab > img { width: 24px; height: 24px; object-fit: contain; border-radius: 6px; }
            .vp-sp-tabs { display: flex; gap: 4px; overflow-x: auto; overflow-y: hidden; flex: 1; padding: 0 4px; scrollbar-width: none; }
            .vp-sp-tabs > div { display: flex; gap: 4px; }
            .vp-sp-body { flex: 1; overflow-y: auto; overflow-x: hidden; scroll-behavior: smooth; scrollbar-width: thin; }
            .pack-header { padding: 16px 10px 8px; display: flex; align-items: center; gap: 6px; color: var(--text-secondary); }
            .vp-sp-name { display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-right: auto; }
            .pack-name-input { background: transparent; border: 1px solid transparent; color: inherit; font-size: 14px; font-weight: 600;
                letter-spacing: 0.5px; text-transform: uppercase; padding: 2px 4px; border-radius: 4px; outline: none; width: auto; }
            .pack-header[data-pack="recent"] .pack-name-input { pointer-events: none; }
            .vp-sp-edit { background: transparent; border: none; width: 20px; height: 20px; border-radius: 6px; cursor: pointer;
                display: flex; align-items: center; justify-content: center; padding: 0; color: inherit; }
            .delete-pack-btn, .vp-sp-done { display: none; border: none; width: 24px; height: 24px; border-radius: 6px; cursor: pointer;
                padding: 0; align-items: center; justify-content: center; }
            .delete-pack-btn { background: #ff4444; }
            .vp-sp-done { background: var(--accent-primary); }
            .pack-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 3px; padding: 0 10px 16px; position: relative; }
            .vp-sp-body.vp-editing > :not(.vp-cur) { display: none; }
            .vp-sp-body.vp-editing > .pack-header.vp-cur :is(.delete-pack-btn, .vp-sp-done) { display: flex; }
            .vp-sticker-item { aspect-ratio: 1; font-size: 34px; background: transparent; border: none; border-radius: 10px;
                transition: all 0.15s ease; display: flex; align-items: center; justify-content: center; cursor: pointer;
                padding: 0; position: relative; user-select: none; overflow: hidden; }
            .sticker-panel:not(.vp-drag) .vp-sticker-item:hover { transform: scale(1.05); box-shadow: 0 0 0 2px var(--accent-primary); }
            .vp-sticker-item > img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
            .vp-sticker-item > .vp-sticker-empty { width: 100%; height: 100%; background: rgba(128,128,128,0.1); border-radius: 8px; }
            .vp-sticker-del { position: absolute; top: 2px; right: 2px; width: 16px; height: 16px; background: rgba(0,0,0,0.6);
                border-radius: 50%; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.7);
                transition: all 0.15s; z-index: 2; pointer-events: auto; font-size: 12px; }
            .vp-sticker-del:hover { background: #ff4444; }
            .add-item-btn { aspect-ratio: 1; background: var(--bg-secondary,rgba(128,128,128,0.08));
                border: 2px dashed var(--border-color,rgba(255,255,255,0.2)); border-radius: 10px; display: flex; align-items: center;
                justify-content: center; cursor: pointer; padding: 0; color: var(--text-secondary); transition: all 0.15s; }
            .add-item-btn:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
            .add-item-btn.vp-busy { pointer-events: none; }

            .vp-crop-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8);
                display: flex; align-items: center; justify-content: center; z-index: 20000; }
            .vp-crop-editor { background: var(--block-bg); border-radius: 16px; padding: 20px; display: flex;
                flex-direction: column; gap: 16px; width: 90%; max-width: 500px; }
            .vp-crop-editor > h3 { margin: 0; color: var(--text-primary,#fff); font-size: 18px; font-weight: 600; }
            .vp-crop-view { position: relative; width: 100%; aspect-ratio: 1; overflow: hidden; border-radius: 12px; background: #000; }
            .vp-crop-view > img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
            .vp-crop-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
            .vp-crop-area { position: absolute; border: 2px solid #0080FF; box-sizing: border-box; pointer-events: auto; touch-action: none; }
            .vp-crop-area.vp-moving { cursor: move; }
            .resize-handle { position: absolute; width: 8px; height: 8px; background: #0080FF; pointer-events: auto; touch-action: none; }
            .resize-handle[data-direction="n"] { top: -4px; left: 50%; transform: translateX(-50%); width: 30px; cursor: n-resize; }
            .resize-handle[data-direction="s"] { bottom: -4px; left: 50%; transform: translateX(-50%); width: 30px; cursor: s-resize; }
            .resize-handle[data-direction="e"] { top: 50%; right: -4px; transform: translateY(-50%); height: 30px; cursor: e-resize; }
            .resize-handle[data-direction="w"] { top: 50%; left: -4px; transform: translateY(-50%); height: 30px; cursor: w-resize; }
            .resize-handle[data-direction="nw"] { top: -4px; left: -4px; cursor: nw-resize; }
            .resize-handle[data-direction="ne"] { top: -4px; right: -4px; cursor: ne-resize; }
            .resize-handle[data-direction="sw"] { bottom: -4px; left: -4px; cursor: sw-resize; }
            .resize-handle[data-direction="se"] { bottom: -4px; right: -4px; cursor: se-resize; }
            .vp-crop-ratios { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
            .aspect-ratio-btn { background: var(--bg-hover,rgba(255,255,255,0.1)); border: none; color: var(--text-primary,#fff);
                padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; }
            .aspect-ratio-btn.vp-on { background: #0080FF; }
            .vp-crop-actions { display: flex; gap: 12px; justify-content: flex-end; }
            .vp-crop-actions > button { padding: 8px 16px; border-radius: 8px; cursor: pointer; color: var(--text-primary,#fff); }
            .vp-crop-cancel { background: transparent; border: 1px solid var(--border-color,rgba(255,255,255,0.3)); }
            .vp-crop-actions > .vp-crop-ok { background: #0080FF; border: none; color: white; }
        `);

            const el = (tag, cls, html) => {
                const e = document.createElement(tag);
                if (cls) e.className = cls;
                if (html) e.innerHTML = html;
                return e;
            };

            async function uploadImageToServer(file) {
                const accessToken = await getAccessToken();
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/files/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                    body: formData,
                    credentials: 'include'
                });
                if (!res.ok) throw new Error('Upload failed');
                return await res.json();
            }

            function stickerPostId() {
                const m = location.pathname.match(/\/post\/([^\/?#]+)/);
                if (m) return m[1];
                const row = stickerBtn && stickerBtn.closest('.' + SELECTORS.stickerContainer);
                const card = row && row.closest('article');
                const link = card && card.querySelector('a[href*="/post/"]');
                const lm = link && link.getAttribute('href').match(/\/post\/([^\/?#]+)/);
                return lm ? lm[1] : card ? postIdOf(card) : null;
            }

            let attached = null;
            function detachSticker() {
                if (!attached) return;
                const { preview, send, hidden } = attached;
                attached = null;
                preview.remove();
                send.remove();
                hidden.forEach(b => b.classList.remove('vp-sticker-hide'));
            }
            function stickerFile(sticker) {
                return new Promise((resolve, reject) => GM_xmlhttpRequest({
                    method: 'GET', url: sticker.url, responseType: 'blob',
                    onload: r => r.status === 200 && r.response ? resolve(r.response) : reject(new Error('картинка стикера: ' + r.status)),
                    onerror: () => reject(new Error('картинка стикера: сеть'))
                })).then(blob => {
                    const type = blob.type || 'image/png';
                    return new File([blob], 'sticker.' + (type.split('/')[1] || 'png').replace(/\+.*/, ''), { type });
                });
            }
            function ownStickerCopy(sticker) {
                return stickerFile(sticker).then(uploadImageToServer)
                    .then(data => {
                        const oldId = sticker.id;
                        [recentStickers, ...userPacks.map(p => p.stickers)].forEach(list => list.forEach(s => { if (s.id === oldId) Object.assign(s, data); }));
                        Object.assign(sticker, data);
                        saveRecent();
                        saveUserPacks();
                        return data;
                    });
            }
            async function postStickerComment(postId, stickerId, content) {
                const accessToken = await getAccessToken();
                const response = await fetch(`/api/posts/${postId}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                    body: JSON.stringify({ content, attachmentIds: [stickerId] }),
                    credentials: 'include'
                });
                return { response, result: await response.json().catch(() => ({})) };
            }
            async function sendSticker(postId, sticker, btn) {
                btn.disabled = true;
                const icon = btn.innerHTML;
                btn.innerHTML = ICONS.LOADING;
                try {
                    const field = btn.closest('.' + SELECTORS.commentPreviewContainer)?.querySelector('[contenteditable="true"]')
                        || document.querySelector('[contenteditable="true"][data-placeholder*="комментарий"]');
                    const content = field ? (field.innerText || field.textContent || '').trim() : '';
                    let { response, result } = await postStickerComment(postId, sticker.id, content);
                    if (response.status === 403 || (result.error && result.error.code === 'FORBIDDEN')) {
                        ({ response, result } = await postStickerComment(postId, (await ownStickerCopy(sticker)).id, content));
                    }
                    if (response.ok) { location.reload(); return; }
                    alert('Ошибка: ' + JSON.stringify(result.error || response.status));
                } catch (err) {
                    alert('Ошибка: ' + err.message);
                }
                btn.disabled = false;
                btn.innerHTML = icon;
            }
            function insertStickerToComment(sticker) {
                const postId = stickerPostId();
                if (!postId) throw new Error('Post ID not found');
                detachSticker();
                const row = stickerBtn && stickerBtn.closest('.' + SELECTORS.stickerContainer);
                const box = (row && row.closest('.' + SELECTORS.commentPreviewContainer)) || siteEl('commentPreviewContainer');
                const siteSend = (row && row.querySelector('.' + SELECTORS.stickerSendBtn)) || siteEl('stickerSendBtn');
                if (!box || !siteSend) return;
                document.getElementById('temp_sticker_preview')?.remove();

                const line = box.parentElement && box.parentElement.querySelector(':scope > button') ? box.parentElement : box;
                const preview = el('div', '', `<div class="vp-sticker-attach"><div class="vp-sticker-thumb"><img><button type="button" class="vp-sticker-remove">${svgIcon(GLYPH.close, 14)}</button></div></div>`);
                preview.id = 'temp_sticker_preview';
                preview.querySelector('img').src = sticker.url;
                preview.querySelector('.vp-sticker-remove').onclick = e => { e.preventDefault(); e.stopPropagation(); detachSticker(); };
                line.before(preview);
                preview.firstChild.style.marginLeft = Math.max(0, box.getBoundingClientRect().left - preview.getBoundingClientRect().left) + 'px';

                const send = el('button', siteClasses(siteSend) + ' vp-sticker-sendbtn', siteSend.innerHTML);
                send.type = 'button';
                send.onclick = e => { e.preventDefault(); e.stopPropagation(); sendSticker(postId, sticker, send); };
                siteSend.after(send);
                const hidden = [siteSend];
                if (line !== box) [...line.querySelectorAll(':scope > button')]
                    .filter(b => box.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).forEach(b => hidden.push(b));
                else { const mic = row && row.querySelector('.' + SELECTORS.stickerMicBtn); if (mic && mic !== siteSend) hidden.push(mic); }
                hidden.forEach(b => b.classList.add('vp-sticker-hide'));
                attached = { preview, send, hidden };
            }
            document.addEventListener('keydown', e => {
                if (!attached || e.key !== 'Enter' || e.shiftKey || !e.target.isContentEditable) return;
                if (!e.target.closest('.' + SELECTORS.commentPreviewContainer)) return;
                e.preventDefault();
                e.stopPropagation();
                attached.send.click();
            }, true);

            let stickerPanel = null, scrollContainer = null, tabsRow = null, recentBtn = null;
            let stickerBtn = null, hideTimeout = null;
            let editPack = null;

            let blockWheel = null;
            function disablePageScroll() {
                const root = document.getElementById('root');
                if (blockWheel || !root) return;
                blockWheel = e => e.preventDefault();
                root.addEventListener('wheel', blockWheel, { passive: false });
            }
            function enablePageScroll() {
                const root = document.getElementById('root');
                if (!blockWheel) return;
                if (root) root.removeEventListener('wheel', blockWheel);
                blockWheel = null;
            }

            function adjustInputWidth(input) {
                const n = Math.max(1, Math.min(MAX_NAME_LENGTH, input.value.length || input.placeholder.length || DEFAULT_PACK_NAME.length));
                input.style.width = `${n * (14 - n * 0.2)}px`;
                input.style.minWidth = 'auto';
            }

            function packTab(pack) {
                const btn = el('button', 'vp-sp-tab');
                const first = pack.stickers[0];
                if (first && first.url) { const img = el('img'); img.src = first.url; btn.appendChild(img); }
                else btn.innerHTML = ICONS.EMPTY_PACK;
                btn.title = pack.name || DEFAULT_PACK_NAME;
                btn.dataset.pack = pack.id;
                btn.onclick = () => { exitEditMode(); scrollToPack(pack.id); };
                return btn;
            }
            function updateTabButtons() {
                const wrap = tabsRow && tabsRow.firstElementChild;
                if (wrap) wrap.replaceChildren(...userPacks.map(packTab));
            }

            function createStickerPanel() {
                if (stickerPanel) return;
                stickerPanel = el('div', 'sticker-panel');
                const header = el('div', 'vp-sp-head');
                recentBtn = el('button', 'vp-sp-tab vp-recent vp-on', ICONS.RECENT);
                recentBtn.title = 'Недавние';
                recentBtn.onclick = () => { exitEditMode(); scrollToPack('recent'); };
                tabsRow = el('div', 'vp-sp-tabs', '<div></div>');
                tabsRow.addEventListener('wheel', e => {
                    if (e.deltaY !== 0) { e.preventDefault(); tabsRow.scrollLeft += e.deltaY * 0.4; }
                }, { passive: false });
                updateTabButtons();
                const addPackBtn = el('button', 'vp-sp-tab', ICONS.ADD_PACK);
                addPackBtn.title = 'Создать стикерпак';
                addPackBtn.onclick = () => {
                    const pack = { id: 'user_' + Date.now(), name: '', stickers: [] };
                    userPacks.push(pack);
                    saveUserPacks();
                    rebuildPanel();
                    enterEditMode(pack.id);
                    showPanel();
                };
                const zipBtn = el('button', 'vp-sp-tab', ICONS.ZIP_PACK);
                zipBtn.title = 'Паки из архива';
                zipBtn.onclick = () => openZipImport();
                header.append(recentBtn, tabsRow, addPackBtn, zipBtn);

                scrollContainer = el('div', 'vp-sp-body');
                scrollContainer.addEventListener('wheel', e => e.stopPropagation(), { passive: true });
                scrollContainer.addEventListener('touchmove', e => e.stopPropagation(), { passive: true });
                scrollContainer.addEventListener('scroll', updateActiveTabFromScroll, { passive: true });
                stickerPanel.append(header, scrollContainer);
                stickerPanel.addEventListener('mouseenter', () => {
                    clearTimeout(hideTimeout);
                    stickerPanel.querySelectorAll('.pack-name-input').forEach(adjustInputWidth);
                });
                stickerPanel.addEventListener('mouseleave', () => hidePanel(200));
                document.body.appendChild(stickerPanel);
            }
            function rebuildPanel() {
                if (stickerPanel) stickerPanel.remove();
                stickerPanel = scrollContainer = tabsRow = recentBtn = null;
                editPack = null;
                createStickerPanel();
                renderAllContent();
            }

            function renderAllContent() {
                if (!scrollContainer) return;
                scrollContainer.replaceChildren();
                for (const key of allPackKeys()) {
                    const header = el('div', 'pack-header');
                    header.dataset.pack = key;
                    const name = el('div', 'vp-sp-name');
                    const input = el('input', 'pack-name-input');
                    input.type = 'text';
                    input.value = packName(key);
                    input.placeholder = 'Название...';
                    input.maxLength = MAX_NAME_LENGTH;
                    name.appendChild(input);
                    if (key !== 'recent') {
                        const pack = () => userPacks.find(p => p.id === key);
                        const locked = () => editPack !== key;
                        input.addEventListener('input', () => {
                            if (locked()) input.value = packName(key);
                            else {
                                input.value = input.value.slice(0, MAX_NAME_LENGTH);
                                if (pack()) { pack().name = input.value; saveUserPacks(); }
                            }
                            adjustInputWidth(input);
                        });
                        input.addEventListener('blur', () => {
                            if (locked()) input.value = packName(key);
                            else if (!input.value.trim()) {
                                input.value = DEFAULT_PACK_NAME;
                                if (pack()) { pack().name = DEFAULT_PACK_NAME; saveUserPacks(); }
                            }
                            adjustInputWidth(input);
                        });
                        const editBtn = el('button', 'vp-sp-edit', ICONS.EDIT);
                        editBtn.title = 'Редактировать';
                        editBtn.onclick = () => { if (editPack === key) exitEditMode(); else { exitEditMode(); enterEditMode(key); } };
                        const delPack = el('button', 'delete-pack-btn', ICONS.TRASH);
                        delPack.title = 'Удалить пак';
                        delPack.onclick = () => { if (confirm('Удалить пак?')) deleteStickerPack(key); };
                        const done = el('button', 'vp-sp-done', ICONS.CHECK);
                        done.title = 'Готово';
                        done.onclick = exitEditMode;
                        name.append(editBtn, delPack, done);
                    }
                    header.appendChild(name);
                    const grid = el('div', 'pack-grid');
                    grid.dataset.pack = key;
                    scrollContainer.append(header, grid);
                    refreshPackGrid(key);
                }
                markEditing();
            }

            function markEditing() {
                if (!scrollContainer) return;
                scrollContainer.classList.toggle('vp-editing', !!editPack);
                for (const e of scrollContainer.children) e.classList.toggle('vp-cur', e.dataset.pack === editPack);
            }
            function enterEditMode(key) {
                if (key === 'recent') return;
                editPack = key;
                markEditing();
                refreshAllPackGrids();
                const header = scrollContainer.querySelector(`.pack-header[data-pack="${key}"]`);
                if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            function exitEditMode() {
                editPack = null;
                if (!scrollContainer) return;
                markEditing();
                refreshAllPackGrids();
            }

            function deleteStickerPack(key) {
                userPacks = userPacks.filter(p => p.id !== key);
                saveUserPacks();
                if (stickerPanel) {
                    const open = stickerPanel.classList.contains('vp-open');
                    rebuildPanel();
                    if (open) showPanel();
                }
            }
            function deleteSticker(key, index) {
                packStickers(key).splice(index, 1);
                savePack(key);
                refreshAllPackGrids();
                updateTabButtons();
            }
            function flipGrid(grid, mutate) {
                const items = [...grid.children], before = new Map(items.map(e => [e, e.getBoundingClientRect()]));
                mutate();
                items.forEach(e => {
                    const a = before.get(e), b = e.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
                    if (dx || dy) e.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
                        { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
                });
            }
            function startStickerDrag(e, btn, key) {
                if (e.button > 0 || e.target.closest('.vp-sticker-del')) return;
                const grid = btn.parentElement, x0 = e.clientX, y0 = e.clientY;
                let ghost = null, ox = 0, oy = 0, gx = 0, gy = 0, px = x0, py = y0, raf = 0, cells = [], box = null;
                const measure = () => {
                    const gr = grid.getBoundingClientRect();
                    cells = [...grid.querySelectorAll('.vp-sticker-item')].map(el => {
                        const left = gr.left + grid.clientLeft + el.offsetLeft, top = gr.top + grid.clientTop + el.offsetTop;
                        return { el, r: { left, top, right: left + el.offsetWidth, bottom: top + el.offsetHeight } };
                    });
                    box = scrollContainer.getBoundingClientRect();
                };
                const frame = () => {
                    raf = 0;
                    ghost.style.transform = `translate3d(${px - ox - gx}px, ${py - oy - gy}px, 0) scale(1.12)`;
                    const hit = cells.find(c => px >= c.r.left && px <= c.r.right && py >= c.r.top && py <= c.r.bottom);
                    const target = hit && hit.el;
                    if (target && target !== btn) {
                        const kids = [...grid.children];
                        flipGrid(grid, () => grid.insertBefore(btn, kids.indexOf(target) > kids.indexOf(btn) ? target.nextSibling : target));
                        measure();
                    }
                    if (py < box.top + 36 || py > box.bottom - 36) {
                        scrollContainer.scrollTop += py < box.top + 36 ? -10 : 10;
                        measure();
                        raf = raf || requestAnimationFrame(frame);
                    }
                };
                const move = ev => {
                    if (ev.pointerId !== e.pointerId) return;
                    px = ev.clientX; py = ev.clientY;
                    if (!ghost) {
                        if (Math.hypot(px - x0, py - y0) < 6) return;
                        const r = btn.getBoundingClientRect();
                        ox = x0 - r.left; oy = y0 - r.top; gx = r.left; gy = r.top;
                        ghost = btn.cloneNode(true);
                        ghost.className = 'vp-sticker-item vp-sticker-ghost';
                        Object.assign(ghost.style, { width: r.width + 'px', height: r.height + 'px', left: r.left + 'px', top: r.top + 'px' });
                        domObserver.disconnect();
                        document.body.appendChild(ghost);
                        btn.classList.add('vp-hole');
                        btn._vpDragged = true;
                        stickerPanel.classList.add('vp-drag');
                        measure();
                    }
                    ev.preventDefault();
                    raf = raf || requestAnimationFrame(frame);
                };
                const up = ev => {
                    if (ev.pointerId !== e.pointerId) return;
                    document.removeEventListener('pointermove', move, true);
                    document.removeEventListener('pointerup', up, true);
                    document.removeEventListener('pointercancel', up, true);
                    if (!ghost) return;
                    if (raf) { cancelAnimationFrame(raf); frame(); cancelAnimationFrame(raf); }
                    raf = 0;
                    const r = btn.getBoundingClientRect(), g = ghost.getBoundingClientRect();
                    ghost.style.transform = '';
                    Object.assign(ghost.style, { left: r.left + 'px', top: r.top + 'px' });
                    const land = ghost.animate([
                        { transform: `translate3d(${g.left - r.left + (g.width - r.width) / 2}px, ${g.top - r.top + (g.height - r.height) / 2}px, 0) scale(1.12)` },
                        { transform: 'none' }
                    ], { duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' });
                    const finish = () => {
                        ghost.remove();
                        btn.classList.remove('vp-hole');
                        stickerPanel.classList.remove('vp-drag');
                        const list = packStickers(key);
                        const order = [...grid.querySelectorAll('.vp-sticker-item')].map(b => list[+b.dataset.stickerIndex]);
                        list.splice(0, list.length, ...order);
                        savePack(key);
                        updateTabButtons();
                        refreshPackGrid(key);
                        domObserver.observe(document.body, DOM_WATCH);
                    };
                    land.finished.then(finish, finish);
                };
                document.addEventListener('pointermove', move, true);
                document.addEventListener('pointerup', up, true);
                document.addEventListener('pointercancel', up, true);
            }

            function addStickerToPack(key) {
                const input = el('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async () => {
                    const file = input.files[0];
                    if (!file) return;
                    const addBtn = scrollContainer && scrollContainer.querySelector(`.pack-grid[data-pack="${key}"] .add-item-btn`);
                    const busy = on => { if (addBtn) { addBtn.innerHTML = on ? ICONS.LOADING : ICONS.ADD; addBtn.classList.toggle('vp-busy', on); } };
                    busy(true);
                    try {
                        const cropped = await showCropEditor(URL.createObjectURL(file));
                        if (!cropped) { busy(false); return; }
                        const data = await uploadImageToServer(cropped);
                        if (key === 'recent') {
                            recentStickers = [data, ...recentStickers].slice(0, 20);
                            saveRecent();
                        } else {
                            const pack = userPacks.find(p => p.id === key);
                            if (pack) { pack.stickers.push(data); saveUserPacks(); }
                        }
                        refreshAllPackGrids();
                        updateTabButtons();
                    } catch (err) {
                        alert('Ошибка загрузки: ' + err.message);
                        busy(false);
                    }
                };
                input.click();
            }

            function refreshPackGrid(key) {
                const grid = scrollContainer && scrollContainer.querySelector(`.pack-grid[data-pack="${key}"]`);
                if (!grid) return;
                const editing = editPack === key;
                grid.replaceChildren(...packStickers(key).map((s, i) => createStickerButton(s, key, i, editing)));
                if (editing) {
                    const addBtn = el('button', 'add-item-btn', ICONS.ADD);
                    addBtn.title = 'Добавить стикер';
                    addBtn.onclick = () => addStickerToPack(key);
                    grid.appendChild(addBtn);
                }
            }
            function refreshAllPackGrids() {
                if (scrollContainer) allPackKeys().forEach(refreshPackGrid);
            }

            async function attachAsSiteFile(sticker) {
                const row = stickerBtn && stickerBtn.closest('.' + SELECTORS.stickerContainer);
                let input = null;
                for (let e = row, i = 0; e && !input && i < 5; e = e.parentElement, i++) input = e.querySelector('input[type="file"]');
                if (!input) return false;
                const file = await stickerFile(sticker);
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
            function pickSticker(sticker) {
                if (sticker && sticker.id && sticker.url) {
                    addToRecent(sticker);
                    const fallback = e => {
                        if (e) { console.warn('[ITD VP] стикер через сайт', e); logErr('стикер через сайт', e); }
                        try { insertStickerToComment(sticker); } catch (err) { console.warn('[ITD VP] стикер', err); logErr('стикер', err); }
                    };
                    if (stickerBtn) stickerBtn.innerHTML = ICONS.LOADING;
                    attachAsSiteFile(sticker).then(ok => { if (!ok) fallback(); }, fallback)
                        .finally(() => { if (stickerBtn) stickerBtn.innerHTML = ICONS.STICKER_BUTTON; });
                }
                stickerPanel.classList.remove('vp-open');
                exitEditMode();
                enablePageScroll();
            }
            function createStickerButton(sticker, key, index, editing) {
                const btn = el('button', 'vp-sticker-item');
                btn.dataset.packKey = key;
                btn.dataset.stickerIndex = index;
                if (sticker && sticker.url) { const img = el('img'); img.src = sticker.url; btn.appendChild(img); }
                else btn.appendChild(el('div', 'vp-sticker-empty'));
                btn.onclick = () => { if (btn._vpDragged) { btn._vpDragged = false; return; } pickSticker(sticker); };
                if (!editing) return btn;

                btn.classList.add('sticker-editing', `sticker-shake-${(index % 8) + 1}`);
                btn.draggable = false;
                const del = el('div', 'vp-sticker-del', ICONS.DELETE);
                del.onmousedown = e => { e.stopPropagation(); e.preventDefault(); };
                del.onclick = e => { e.stopPropagation(); e.preventDefault(); deleteSticker(key, index); };
                btn.appendChild(del);
                btn.addEventListener('pointerdown', e => startStickerDrag(e, btn, key));
                return btn;
            }

            function scrollToPack(key) {
                const header = scrollContainer && scrollContainer.querySelector(`.pack-header[data-pack="${key}"]`);
                if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            function updateActiveTabFromScroll() {
                if (editPack || !scrollContainer) return;
                const top = scrollContainer.getBoundingClientRect().top + 50;
                let active = 'recent', min = Infinity;
                for (const h of scrollContainer.querySelectorAll(':scope > .pack-header')) {
                    const d = h.getBoundingClientRect().top - top;
                    if (d <= 0 && -d < min) { min = -d; active = h.dataset.pack; }
                }
                recentBtn.classList.toggle('vp-on', active === 'recent');
                tabsRow.querySelectorAll('.vp-sp-tab').forEach(t => t.classList.toggle('vp-on', t.dataset.pack === active));
            }

            function showPanel() {
                if (!stickerBtn || !stickerBtn.isConnected) return;
                clearTimeout(hideTimeout);
                createStickerPanel();
                if (!scrollContainer.children.length) renderAllContent();
                const rect = stickerBtn.getBoundingClientRect();
                stickerPanel.style.bottom = `${window.innerHeight - rect.top + 8}px`;
                stickerPanel.style.left = `${Math.min(rect.left, window.innerWidth - PANEL_WIDTH - 20)}px`;
                stickerPanel.classList.add('vp-open');
                disablePageScroll();
            }
            function hidePanel(delay) {
                clearTimeout(hideTimeout);
                hideTimeout = setTimeout(() => {
                    if (!stickerPanel || !stickerPanel.classList.contains('vp-open')) return;
                    if (stickerPanel.classList.contains('vp-drag')) return hidePanel(delay);
                    if (stickerPanel.querySelector('.vp-sp-import')) return hidePanel(delay);
                    stickerPanel.classList.remove('vp-open');
                    exitEditMode();
                    enablePageScroll();
                }, delay);
            }

            function showCropEditor(imageUrl) {
                return new Promise(resolve => {
                    const modal = el('div', 'vp-crop-modal');
                    modal.innerHTML = `<div class="vp-crop-editor"><h3>Обрежьте стикер</h3>
                    <div class="vp-crop-view"><img><div class="vp-crop-overlay"><div class="vp-crop-area">${['n', 'e', 's', 'w', 'nw', 'ne', 'sw', 'se'].map(d => `<div class="resize-handle" data-direction="${d}"></div>`).join('')}</div></div></div>
                    <div class="vp-crop-ratios"></div>
                    <div class="vp-crop-actions"><button class="vp-crop-cancel">Отмена</button><button class="vp-crop-ok">Готово</button></div></div>`;
                    const view = modal.querySelector('.vp-crop-view');
                    const img = view.querySelector('img');
                    const area = modal.querySelector('.vp-crop-area');
                    img.src = imageUrl;
                    let ratio = null;
                    let action = null;

                    const RATIOS = [['Свободный', null], ['1:1', 1], ['4:3', 4 / 3], ['3:4', 3 / 4], ['16:9', 16 / 9], ['9:16', 9 / 16]];
                    const ratioRow = modal.querySelector('.vp-crop-ratios');
                    RATIOS.forEach(([label, value], i) => {
                        const b = el('button', 'aspect-ratio-btn' + (i ? '' : ' vp-on'));
                        b.textContent = label;
                        b.onclick = () => {
                            ratio = value;
                            ratioRow.querySelectorAll('.aspect-ratio-btn').forEach(x => x.classList.toggle('vp-on', x === b));
                            if (value !== null) setAspectRatio(value);
                        };
                        ratioRow.appendChild(b);
                    });

                    function imageBounds() {
                        const r = view.getBoundingClientRect();
                        const k = img.naturalWidth / img.naturalHeight;
                        const w = k > r.width / r.height ? r.width : r.height * k;
                        const h = k > r.width / r.height ? r.width / k : r.height;
                        const minX = (r.width - w) / 2, minY = (r.height - h) / 2;
                        return { minX, minY, maxX: minX + w, maxY: minY + h, width: w, height: h };
                    }
                    const place = (left, top, width, height) => Object.assign(area.style, {
                        left: left + 'px', top: top + 'px',
                        ...(width !== undefined && { width: width + 'px', height: height + 'px' })
                    });
                    function constrain() {
                        const b = imageBounds();
                        const w = area.offsetWidth, h = area.offsetHeight;
                        const left = Math.max(b.minX, Math.min(parseFloat(area.style.left) || 0, b.maxX - w));
                        const top = Math.max(b.minY, Math.min(parseFloat(area.style.top) || 0, b.maxY - h));
                        place(left, top, Math.min(w, b.width), Math.min(h, b.height));
                    }
                    function snapToCenter() {
                        const b = imageBounds();
                        const left = parseFloat(area.style.left), top = parseFloat(area.style.top);
                        const cx = b.minX + (b.width - area.offsetWidth) / 2, cy = b.minY + (b.height - area.offsetHeight) / 2;
                        if (Math.abs(left - cx) < 5 || Math.abs(top - cy) < 5) place(Math.abs(left - cx) < 5 ? cx : left, Math.abs(top - cy) < 5 ? cy : top);
                    }
                    function setAspectRatio(k) {
                        const b = imageBounds();
                        let w, h;
                        if (k >= 1) { w = b.width; h = w / k; if (h > b.height) { h = b.height; w = h * k; } }
                        else { h = b.height; w = h * k; if (w > b.width) { w = b.width; h = w / k; } }
                        place(b.minX + (b.width - w) / 2, b.minY + (b.height - h) / 2, w, h);
                        constrain();
                    }
                    function fitToImage() {
                        const b = imageBounds();
                        place(b.minX, b.minY, b.width, b.height);
                    }

                    const onDown = e => {
                        const dir = e.target.classList.contains('resize-handle') ? e.target.dataset.direction : null;
                        const r = area.getBoundingClientRect();
                        action = dir
                            ? { dir, x: e.clientX, y: e.clientY, w: area.offsetWidth, h: area.offsetHeight, left: parseFloat(area.style.left), top: parseFloat(area.style.top) }
                            : { dir: null, x: e.clientX - r.left, y: e.clientY - r.top };
                        if (!dir) area.classList.add('vp-moving');
                        area.setPointerCapture(e.pointerId);
                        e.preventDefault();
                        e.stopPropagation();
                    };
                    const onMove = e => {
                        if (!action) return;
                        const vr = view.getBoundingClientRect();
                        if (!action.dir) {
                            place(e.clientX - vr.left - action.x, e.clientY - vr.top - action.y);
                            constrain();
                            snapToCenter();
                            return;
                        }
                        const b = imageBounds(), a = action, d = a.dir;
                        const dx = e.clientX - a.x, dy = e.clientY - a.y;
                        let w = a.w, h = a.h, x = a.left, y = a.top;
                        if (d.includes('n')) { h = a.h - dy; y = a.top + dy; }
                        if (d.includes('s')) h = a.h + dy;
                        if (d.includes('w')) { w = a.w - dx; x = a.left + dx; }
                        if (d.includes('e')) w = a.w + dx;
                        if (ratio !== null) {
                            if (d === 'n' || d === 's') w = h * ratio; else h = w / ratio;
                            if (w > b.width) { w = b.width; h = w / ratio; }
                            if (h > b.height) { h = b.height; w = h * ratio; }
                            x = d.includes('w') ? a.left + (a.w - w) : d.includes('e') ? a.left : a.left - (w - a.w) / 2;
                            y = d.includes('n') ? a.top + (a.h - h) : d.includes('s') ? a.top : a.top - (h - a.h) / 2;
                        }
                        w = Math.max(50, Math.min(b.width, w));
                        h = Math.max(50, Math.min(b.height, h));
                        x = Math.max(b.minX, Math.min(x, b.maxX - w));
                        y = Math.max(b.minY, Math.min(y, b.maxY - h));
                        place(x, y, w, h);
                        constrain();
                        snapToCenter();
                    };
                    const onUp = () => {
                        if (!action) return;
                        action = null;
                        constrain();
                    };
                    area.addEventListener('pointerdown', onDown);
                    area.addEventListener('pointermove', onMove);
                    area.addEventListener('pointerup', onUp);
                    area.addEventListener('pointercancel', onUp);

                    const close = result => { modal.remove(); URL.revokeObjectURL(imageUrl); resolve(result); };
                    modal.querySelector('.vp-crop-cancel').onclick = () => close(null);
                    modal.querySelector('.vp-crop-ok').onclick = () => {
                        const vr = view.getBoundingClientRect(), cr = area.getBoundingClientRect(), b = imageBounds();
                        const sx = img.naturalWidth / b.width, sy = img.naturalHeight / b.height;
                        const w = cr.width * sx, h = cr.height * sy;
                        const x = Math.max(0, Math.min((cr.left - vr.left - b.minX) * sx, img.naturalWidth - w));
                        const y = Math.max(0, Math.min((cr.top - vr.top - b.minY) * sy, img.naturalHeight - h));
                        const canvas = el('canvas');
                        canvas.width = w;
                        canvas.height = h;
                        canvas.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
                        canvas.toBlob(blob => close(new File([blob], 'sticker.png', { type: 'image/png' })), 'image/png');
                    };
                    document.body.appendChild(modal);
                    img.onload = fitToImage;
                    if (img.complete) fitToImage();
                });
            }

            onDom(function stickerButton() {
                const row = siteEl('stickerContainer');
                if (!row || row.querySelector('.sticker-btn')) return;
                const before = row.querySelector('.' + SELECTORS.stickerMicBtn) || row.querySelector('.' + SELECTORS.stickerSendBtn);
                if (!before) return;
                stickerBtn = el('button', 'sticker-btn', ICONS.STICKER_BUTTON);
                stickerBtn.onmouseenter = showPanel;
                stickerBtn.onmouseleave = () => hidePanel(300);
                row.insertBefore(stickerBtn, before);
            });
        })();

