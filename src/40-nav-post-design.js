        function messagesLabel(notificationsLink) {
            return /уведомления/i.test(notificationsLink.textContent) ? 'Сообщения' : 'Личка';
        }
        function addMessagesButton() {
            const nav = document.querySelector('.' + SELECTORS.sidebar + ' .' + SELECTORS.nav)
                || siteEl('nav')
                || [...document.querySelectorAll('nav a')].find(a => a.textContent.trim() === 'Лента')?.closest('nav');
            if (!nav) return;

            const notificationsLink = nav.querySelector('a[href="/notifications"]');
            if (!notificationsLink) return;

            let messagesLink = nav.querySelector('a[href="#"]');
            if (messagesLink) {
                if (messagesLink.nextElementSibling !== notificationsLink) {
                    nav.insertBefore(messagesLink, notificationsLink);
                }
                const label = messagesLink.children[1], text = messagesLabel(notificationsLink);
                if (label && label.textContent !== text) label.textContent = text;
                return;
            }

            messagesLink = document.createElement('a');
            messagesLink.href = '#';
            const siteLinks = [...nav.querySelectorAll('a')].filter(a => a.parentElement === nav || a.parentElement.parentElement === nav)
                .filter(a => a.getAttribute('href') !== '#' && a.querySelector(':scope > span svg'));
            messagesLink.className = (commonClasses(siteLinks) + ' ' + SELECTORS.navLink).trim();

            const iconSpan = document.createElement('span');
            iconSpan.className = (commonClasses(siteLinks.map(a => a.firstElementChild)) + ' ' + SELECTORS.navIcon).trim();
            iconSpan.innerHTML = ICONS.MESSAGES;
            const textSpan = document.createElement('span');
            textSpan.className = commonClasses(siteLinks.map(a => a.children[1]).filter(Boolean));
            textSpan.textContent = messagesLabel(notificationsLink);
            messagesLink.appendChild(iconSpan);
            messagesLink.appendChild(textSpan);

            nav.insertBefore(messagesLink, notificationsLink);
        }

        addMessagesButton();
        onDom(addMessagesButton);
        document.addEventListener('click', e => {
            const a = e.target.closest && e.target.closest('nav a[href="#"]');
            if (!a || !a.closest('.' + SELECTORS.nav)) return;
            e.preventDefault();
            if (!messagesOverlay) messagesOverlay = buildMessagesOverlay();
            messagesOverlay.open();
        }, true);
        const PROFILE_SHORT = 'Акк';
        onDom(function shortProfileLabel() {
            const nav = siteEl('nav');
            const notif = nav && nav.querySelector(':scope > a[href="/notifications"]');
            if (!notif || /уведомления/i.test(notif.textContent)) return;
            nav.querySelectorAll(':scope > a[href^="/@"]').forEach(a => {
                const label = a.children[1];
                if (label && label.textContent.trim() === 'Профиль') label.textContent = PROFILE_SHORT;
            });
        });

        const PORTAL_ICON = {
            idle: { mask: '<path d="M12 4.17L14.35 9.82L20.45 10.31L15.8 14.28L17.22 20.23L12 17.05L6.78 20.23L8.2 14.28L3.55 10.31L9.65 9.82Z" stroke="currentColor" stroke-width="4.4" stroke-linejoin="round"/>', hole: '<path d="M12 11.13L12.59 12.54L14.11 12.66L12.95 13.66L13.3 15.15L12 14.35L10.7 15.15L11.05 13.66L9.89 12.66L11.41 12.54Z" stroke="currentColor" stroke-width="1.9800000000000002" stroke-linejoin="round"/>' },
            live: { mask: '<path d="M12 4.17L14.35 9.82L20.45 10.31L15.8 14.28L17.22 20.23L12 17.05L6.78 20.23L8.2 14.28L3.55 10.31L9.65 9.82Z" stroke="currentColor" stroke-width="4.4" stroke-linejoin="round"/><path d="M20.5 0.8C21.2 2.6 21.2 2.6 23 3.3C21.2 4 21.2 4 20.5 5.8C19.8 4 19.8 4 18 3.3C19.8 2.6 19.8 2.6 20.5 0.8Z"/><path d="M21.7 15C22.09 16.01 22.09 16.01 23.1 16.4C22.09 16.79 22.09 16.79 21.7 17.8C21.31 16.79 21.31 16.79 20.3 16.4C21.31 16.01 21.31 16.01 21.7 15Z"/><path d="M15.9 0.2C16.26 1.14 16.26 1.14 17.2 1.5C16.26 1.86 16.26 1.86 15.9 2.8C15.54 1.86 15.54 1.86 14.6 1.5C15.54 1.14 15.54 1.14 15.9 0.2Z"/>', over: '<path d="M12 9.18L13.1 11.83L15.97 12.06L13.79 13.93L14.45 16.73L12 15.23L9.55 16.73L10.21 13.93L8.03 12.06L10.9 11.83Z" fill="#5cc8ff" stroke="#5cc8ff" stroke-width="2.64" stroke-linejoin="round"/>' }
        };
        const BUMP = 40, BUMP_UP = 5, BUMP_W = 160, BUMP_H = 21, BUMP_LIFT = BUMP_H;
        function bumpPath(w, h, top) {
            const r = h / 2, cx = w / 2, half = BUMP_W / 2, peak = top - BUMP_H, n = v => +v.toFixed(2);
            return `M${r} ${top}H${n(cx - half)}`
                + `C${n(cx - half * .45)} ${top} ${n(cx - half * .42)} ${peak} ${cx} ${peak}`
                + `C${n(cx + half * .42)} ${peak} ${n(cx + half * .45)} ${top} ${n(cx + half)} ${top}`
                + `H${w - r}A${r} ${r} 0 0 1 ${w - r} ${top + h}H${r}A${r} ${r} 0 0 1 ${r} ${top}Z`;
        }
        let bumpPlus = null;
        onDom(function newPostBump() {
            const nav = siteEl('nav');
            if (!bumpPlus || !bumpPlus.isConnected) bumpPlus = document.querySelector('button[aria-label="Создать пост"]');
            const plus = bumpPlus, up = scrollTopButton;
            if (plus && up) {
                const cls = siteClasses(plus);
                if (cls && !cls.split(' ').every(c => up.classList.contains(c))) cls.split(' ').forEach(c => up.classList.add(c));
            }
            const row = !!(nav && navIsRow(nav) && plus && plus.parentElement === nav.parentElement);
            if (nav) nav.classList.toggle('vp-has-bump', row);
            let bg = nav && nav.querySelector(':scope > svg.vp-bump-bg');
            if (!row) {
                if (bg) bg.remove();
                if (plus) { plus.classList.remove('vp-new-post'); plus.style.removeProperty('top'); plus.style.removeProperty('left'); }
                return;
            }
            plus.classList.add('vp-new-post');
            const w = nav.offsetWidth, h = nav.offsetHeight, key = w + 'x' + h;
            if (!bg) {
                bg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                bg.setAttribute('class', 'vp-bump-bg');
                bg.innerHTML = '<defs><linearGradient id="vp-bump-edge" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1">'
                    + '<stop offset="0" stop-color="rgba(255,255,255,.25)"/><stop offset="1" stop-color="rgba(255,255,255,.05)"/></linearGradient></defs>'
                    + '<path class="vp-bump-fill"/><path class="vp-bump-edge" fill="none" stroke="url(#vp-bump-edge)" stroke-width="2"/>';
                nav.prepend(bg);
            }
            if (bg.dataset.key !== key) {
                bg.dataset.key = key;
                const top = BUMP_LIFT + 2, H = h + top, d = bumpPath(w, h, top);
                bg.setAttribute('width', w); bg.setAttribute('height', H); bg.setAttribute('viewBox', `0 0 ${w} ${H}`);
                bg.style.top = -top + 'px';
                bg.style.clipPath = `path('${d}')`;
                bg.querySelector('.vp-bump-fill').setAttribute('d', d);
                bg.querySelector('.vp-bump-edge').setAttribute('d', d);
                bg.querySelector('linearGradient').setAttribute('y2', H);
            }
            const top = Math.round(nav.offsetTop - BUMP_UP - BUMP / 2) + 'px', left = Math.round(nav.offsetLeft + nav.offsetWidth / 2 - BUMP / 2) + 'px';
            if (plus.style.top !== top) plus.style.top = top;
            if (plus.style.left !== left) plus.style.left = left;
        });
        let eventMaskN = 0;
        onDom(function eventIcon() {
            document.querySelectorAll('a[href^="/event"] img').forEach(img => {
                const own = [...img.classList].filter(c => !c.startsWith('vp-'));
                const state = own.length > 1 || (/portal/.test(img.src) && !/inactive/.test(img.src)) ? 'live' : 'idle';
                if (!img.classList.contains('vp-portal-img')) img.classList.add('vp-portal-img');
                let svg = img.parentElement.querySelector(':scope > svg.vp-portal');
                if (!svg) {
                    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('class', 'vp-portal');
                    svg.setAttribute('width', '24'); svg.setAttribute('height', '24');
                    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'currentColor');
                    img.after(svg);
                }
                if (svg.dataset.state !== state) {
                    svg.dataset.state = state;
                    const id = 'vp-ev-' + (++eventMaskN);
                    const ic = PORTAL_ICON[state];
                    svg.innerHTML = `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">`
                        + `<g fill="#fff" style="color:#fff">${ic.mask}</g>`
                        + (ic.hole ? `<g fill="#000" style="color:#000">${ic.hole}</g>` : '') + `</mask></defs>`
                        + `<rect width="24" height="24" fill="currentColor" mask="url(#${id})"/>` + (ic.over || '');
                }
            });
        });

        const postDesignStyle = addCss(`
        html:has(article[data-alice-water-anchor-kind="post"]) { overflow-anchor: none; }
        article[data-alice-water-anchor-kind="post"] { margin-bottom: 16px !important; }
        article.vp-post {
            background: var(--block-bg);
            backdrop-filter: var(--vp-glass-filter, blur(4px)) !important;
            border-radius: 24px !important;
            margin-bottom: 16px !important;
            transition: all 0.25s ease !important;
            position: relative;
            border: none !important;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2) !important;
            animation: postAppear 0.3s ease-out forwards !important;
            --vp-edge-a: rgba(255, 255, 255, .08); --vp-edge-b: rgba(255, 255, 255, .08);
        }
        article.vp-post::before {
            content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none; z-index: 1;
            background: linear-gradient(to bottom, var(--vp-edge-a), var(--vp-edge-b));
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor;
            mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
            transition: opacity .25s ease;
        }

        @media (hover: hover) {
            html.vp-post-hl article.vp-post:hover { --vp-edge-a: rgba(255, 255, 255, .24); box-shadow: 0 12px 32px rgba(0, 0, 0, .32) !important; }
        }
        @keyframes postAppear {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .vp-post-text {
            font-size: 15px !important;
            line-height: 1.5 !important;
            color: var(--text-primary, #e0e0e0) !important;
            background: rgba(0, 0, 0, 0.5) !important;
            padding: 8px 12px !important;
            border-radius: 16px !important;
            margin: 8px 0 !important;
        }
        .vp-post-action {
            transition: all 0.2s ease !important;
            border-radius: 40px !important;
            padding: 6px 10px !important;
        }
        @media (hover: hover) {
        .vp-post-action:hover {
            background: rgba(0, 128, 255, 0.15) !important;
            transform: translateY(-2px) !important;
        }
        .vp-avatar-link:hover {
            transform: scale(1.05) !important;
        }
        }
        @media (hover: none) {
            .vp-post-action:hover { background: transparent !important; transform: none !important; }
            .vp-post-action[aria-label="Нравится"]:active, .vp-post-action[aria-label="Нравится"].vp-pressed { background: rgba(249, 24, 128, 0.2) !important; color: #f91880 !important; }
            .vp-post-action[aria-label="Комментировать"]:active, .vp-post-action[aria-label="Комментировать"].vp-pressed { background: rgba(0, 186, 124, 0.2) !important; color: #00ba7c !important; }
            .vp-post-action[aria-label="Репост"]:active, .vp-post-action[aria-label="Репост"].vp-pressed { background: rgba(0, 128, 255, 0.2) !important; color: #0080FF !important; }
        }
        a[href*="/hashtag/"], a[href*="/tag/"], a:not([href^="/@"]):not([href*="/@"]):not([href^="#"]) {
            font-weight: 600 !important;
            text-decoration: none !important;
            transition: all 0.15s ease !important;
        }
        a[href*="/hashtag/"]:hover, a[href*="/tag/"]:hover, a:not([href^="/@"]):not([href*="/@"]):not([href^="#"]):hover {
            filter: brightness(1.25) !important;
        }
        a[href^="/@"], a[href*="/@"] { text-decoration: none !important; }
        a[href^="/@"] .vp-nick-text { font-weight: 600 !important; }
        a[href^="/@"]:hover .vp-nick-text { filter: brightness(0.85) !important; }
        a[href^="/@"] svg, a[href*="/@"] svg, a[href^="/@"] img, a[href*="/@"] img,
        a[href^="/@"] .mod-badge-voronoi, a[href*="/@"] .mod-badge-voronoi,
        a[href^="/@"] .vp-nick-badges {
            filter: none !important;
            transform: none !important;
        }
        .mod-badge-voronoi, .mod-badge-verify {
            display: inline-flex !important; align-items: center !important; flex-shrink: 0 !important;
            vertical-align: middle !important; width: var(--vp-badge) !important; height: var(--vp-badge) !important;
        }
        .mod-badge-voronoi {
            justify-content: center !important; overflow: hidden !important;
            min-width: var(--vp-badge) !important; min-height: var(--vp-badge) !important;
            max-width: var(--vp-badge) !important; max-height: var(--vp-badge) !important;
        }
        .mod-badge-voronoi > svg {
            display: block !important; width: var(--vp-badge) !important; height: var(--vp-badge) !important;
            min-width: var(--vp-badge) !important; min-height: var(--vp-badge) !important; max-width: none !important; max-height: none !important;
        }
        .mod-badge-verify { margin-left: 4px !important; }
        @keyframes likePop {
            0% { transform: scale(1); }
            50% { transform: scale(1.3); color: #ff3366 !important; }
            100% { transform: scale(1); }
        }
        .vp-post-action:active svg {
            animation: likePop 0.2s ease-out !important;
        }
        @media (hover: hover) {
        .vp-post-action[aria-label="Нравится"]:hover {
            background: rgba(249, 24, 128, 0.2) !important;
            color: #f91880 !important;
        }
        .vp-post-action[aria-label="Комментировать"]:hover {
            background: rgba(0, 186, 124, 0.2) !important;
            color: #00ba7c !important;
        }
        .vp-post-action[aria-label="Репост"]:hover {
            background: rgba(0, 128, 255, 0.2) !important;
            color: #0080FF !important;
        }
        }
        .vp-notif {
            animation: notificationAppear 0.3s ease-out both !important;
        }
        @keyframes notificationAppear {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `);


