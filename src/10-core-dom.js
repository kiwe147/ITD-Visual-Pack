    const start = () => {

        const SELECTORS = {
            post: 'vp-post',
            repost: 'vp-repost',
            postText: 'vp-post-text',
            postMedia: 'vp-post-media',
            postAction: 'vp-post-action',
            avatarLink: 'vp-avatar-link',
            avatar: 'vp-avatar',
            nickContainer: 'vp-nick',
            nickText: 'vp-nick-text',
            nickBadges: 'vp-nick-badges',
            nickRow: 'vp-nick-row',
            nickLarge: 'vp-nick-large',
            banner: 'vp-banner',
            bannerButtons: 'vp-banner-buttons',
            bannerDraw: 'vp-banner-draw',
            bannerDelete: 'vp-banner-delete',
            sidebar: 'vp-sidebar',
            sidebarRight: 'vp-sidebar-right',
            nav: 'vp-nav',
            navLink: 'vp-nav-link',
            navIcon: 'vp-nav-icon',
            logoContainer: 'vp-logo',
            versionBtn: 'vp-version',
            tabs: 'vp-tabs',
            feedBar: 'vp-feed-bar',
            commentBox: 'vp-comment-box',
            stickerContainer: 'vp-comment-row',
            stickerMicBtn: 'vp-comment-mic',
            stickerSendBtn: 'vp-comment-send',
            modal: 'vp-modal',
            notification: 'vp-notif',
            notificationText: 'vp-notif-text',
            badgeVerify: 'mod-badge-verify',
            badgeVoronoi: 'mod-badge-voronoi'
        };
        const siteEl = k => document.querySelector('.' + SELECTORS[k]);
        SELECTORS.commentPreviewContainer = SELECTORS.commentBox;
        SELECTORS.nickParent = SELECTORS.nickContainer;

        const PROFILE_LINK = 'a[href^="/@"]';
        const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
        const ownText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());

        function siteClasses(el) {
            return el ? [...el.classList].filter(c => !c.startsWith('vp-')).join(' ') : '';
        }
        function commonClasses(els) {
            if (!els.length) return '';
            return [...els[0].classList].filter(c => !c.startsWith('vp-') && els.every(e => e.classList.contains(c))).join(' ');
        }

        const learned = JSON.parse(GM_getValue('vp_learned', '{}'));
        function learn(role, el) {
            const cls = el && [...el.classList].find(c => !c.startsWith('vp-'));
            if (cls && learned[role] !== cls) {
                learned[role] = cls;
                GM_setValue('vp_learned', JSON.stringify(learned));
            }
        }
        const byLearned = role => learned[role] ? [...document.getElementsByClassName(learned[role])].filter(inScope) : [];

        function nickTextOf(container) {
            if (!container.children.length) return container;
            return $$('span', container).find(s => !s.children.length && s.textContent.trim()
                && !s.closest('.' + SELECTORS.badgeVoronoi + ', .' + SELECTORS.badgeVerify)) || null;
        }

        const FIND = {
            post: () => [...new Set([...$$('article'), ...$$('footer')
                .filter(f => !f.closest('article') && f.querySelector('button[aria-label="Нравится"]'))
                .map(f => { let el = f.parentElement; for (let i = 0; el && i < 4 && !el.querySelector(':scope > header'); i++) el = el.parentElement; return el; })
                .filter(el => el && el.querySelector(':scope > header'))])],
            repost: () => F('post').flatMap(p => $$('span[data-icon="share"]', p))
                .filter(s => !s.closest('footer, button'))
                .map(s => s.parentElement && s.parentElement.parentElement).filter(Boolean),
            postMedia: () => [...$$('img[data-post-media-image]'), ...F('post').flatMap(p => $$('video', p))],
            postAction: () => F('post').flatMap(p => $$('button[aria-label]', p)).filter(b => b.querySelector('[data-icon]')),
            postText: () => F('post').flatMap(p => $$('div', p)).filter(d => ownText(d) && !d.closest('header, footer, a, button, time')),
            avatarLink: () => F('post').flatMap(p => $$(PROFILE_LINK, p)).filter(a => a.firstElementChild && a.firstElementChild.tagName === 'DIV' && !a.querySelector('[data-user-name]')),
            avatar: () => {
                const sample = F('avatarLink').map(a => a.firstElementChild);
                if (sample[0]) learn('avatar', sample[0]);
                const all = new Set(sample);
                byLearned('avatar').forEach(el => { if (el.querySelector('span, img')) all.add(el); });
                return [...all];
            },
            nickContainer: () => {
                const sample = [...new Set(F('post').flatMap(p => $$('header ' + PROFILE_LINK + ' > span, header ' + PROFILE_LINK + ' [data-user-name]', p)))];
                if (sample[0]) learn('nick', sample[0]);
                const all = new Set(sample);
                byLearned('nick').forEach(el => { if (el.textContent.trim()) all.add(el); });
                return [...all];
            },
            nickText: () => F('nickContainer').map(nickTextOf).filter(Boolean),
            nickBadges: () => F('nickContainer').flatMap(c => [...c.children]
                .filter(s => !s.matches('.' + SELECTORS.badgeVoronoi + ', .' + SELECTORS.badgeVerify) && !s.querySelector('.' + SELECTORS.nickText)
                    && $$('img, svg', s).some(x => !x.closest('.' + SELECTORS.badgeVoronoi + ', .' + SELECTORS.badgeVerify)))),
            nickRow: () => F('nickContainer').map(c => (c.closest(PROFILE_LINK) || c).parentElement).filter(Boolean),
            nickLarge: () => F('nickContainer').filter(c => !c.closest('a, article, .' + SELECTORS.post) && atLoginOf(c) && isProfileHeader(c)),
            banner: () => {
                const byImg = $$('img[alt="Banner"]').map(i => i.parentElement).filter(Boolean);
                if (byImg.length) return byImg;
                const header = document.querySelector('[data-alice-water-anchor-kind="profile_header"]');
                if (!header) return [];
                const btn = [...header.querySelectorAll('button')].find(b => /баннер/i.test(b.title || ''));
                if (!btn) return [];
                let el = btn.parentElement;
                for (let i = 0; el && i < 5; i++) {
                    if (el.querySelector('img[alt="Banner"]') || el.querySelector('button[title*="баннер" i]')) return [el.parentElement || el];
                    el = el.parentElement;
                }
                return [];
            },
            bannerButtons: () => F('banner').map(b => [...b.children].find(c => c.querySelector('button') && !c.querySelector('section'))).filter(Boolean),
            bannerDelete: () => F('bannerButtons').flatMap(c => $$('button', c))
                .filter(b => /удал/i.test(b.title || '') || b.innerHTML.includes('points="3 6 5 6 21 6"')),
            bannerDraw: () => F('bannerButtons').map(c => $$('button', c)
                .find(b => !/custom-/.test(b.className) && !/удал/i.test(b.title || '') && !b.innerHTML.includes('points="3 6 5 6 21 6"'))).filter(Boolean),
            nav: () => $$('nav').filter(n => n.querySelector('a[href="/"], a[href="/notifications"]')),
            navLink: () => F('nav').flatMap(n => $$('a[href]', n).filter(a => a.parentElement === n || a.parentElement.parentElement === n)),
            navIcon: () => F('navLink').map(a => a.firstElementChild).filter(s => s && s.tagName === 'SPAN' && s.querySelector('svg')),
            sidebar: () => $$('aside').filter(a => a.querySelector('nav')),
            sidebarRight: () => $$('aside').filter(a => !a.querySelector('nav')),
            logoContainer: () => F('nav').map(n => n.previousElementSibling)
                .filter(d => d && (d.querySelector('svg, button') || d.querySelector(`a[href="${TG_URL}"]`))),
            versionBtn: () => F('logoContainer').flatMap(c => $$('button', c))
                .filter(b => /^v\d/.test(b.textContent.trim()) && !b.classList.contains('itd-update-sidebar-btn')),
            tabs: () => [...new Set($$('button')
                .filter(b => ['Для вас', 'Подписки', 'Лента кланов', 'Кланы', 'Посты', 'Лайки'].includes(b.textContent.trim()))
                .map(b => b.parentElement))],
            feedBar: () => F('tabs').filter(t => /Для вас/.test(t.textContent)).map(t => t.parentElement).filter(Boolean),
            stickerContainer: () => commentInputs().map(commentRow).filter(Boolean),
            stickerMicBtn: () => F('stickerContainer').map(r => siteButtons(r)).filter(bs => bs.length > 1).map(bs => bs[0]),
            stickerSendBtn: () => F('stickerContainer').map(r => siteButtons(r).pop()).filter(Boolean),
            commentBox: () => commentInputs().map(i => i.closest('form') || (commentRow(i) || i).parentElement).filter(Boolean),
            modal: () => $$('[role="dialog"], [aria-modal="true"], dialog[open]').filter(e => !e.closest('.vp-call')),
            notification: () => {
                if (!location.pathname.startsWith('/notifications')) return [];
                const top = b => !b.closest('article') && !b.parentElement.closest('[role="button"]');
                const lists = new Set($$('[role="button"]').filter(b => b.querySelector(PROFILE_LINK) && top(b)).map(b => b.parentElement));
                return [...lists].flatMap(l => [...l.children].filter(c => c.matches('[role="button"]') && top(c)));
            },
            notificationText: () => F('notification').map(n => {
                const nickLink = $$(PROFILE_LINK, n).filter(a => a.textContent.trim() && !a.querySelector('.' + SELECTORS.avatar)).pop();
                const el = nickLink && nickLink.nextElementSibling;
                return el && ownText(el) ? el : null;
            }).filter(Boolean)
        };

        function atLoginOf(c) {
            const row = c.parentElement;
            const at = row && [...row.children].find(s => /^@[\w.]+$/.test(s.textContent.trim()));
            return at ? at.textContent.trim().slice(1) : null;
        }
        function isProfileHeader(c) {
            for (let el = c, i = 0; el && i < 7; el = el.parentElement, i++) {
                if (el.querySelector('img[alt="Banner"]')) return true;
            }
            if (document.querySelector('img[alt="Banner"]')) return false;
            const item = c.parentElement && c.parentElement.parentElement;
            return !(item && item.parentElement && [...item.parentElement.children]
                .filter(x => x !== item && x.querySelector('.' + SELECTORS.nickContainer)).length);
        }

        function commentInputs() {
            return $$('[contenteditable="true"][data-placeholder]').filter(i => /коммент/i.test(i.getAttribute('data-placeholder')) && !i.closest('.vp-sw-stage'));
        }
        function commentRow(input) {
            let el = input.parentElement;
            for (let i = 0; el && i < 6; i++, el = el.parentElement) {
                if (siteButtons(el).length) return el;
            }
            return null;
        }
        const siteButtons = root => $$('button', root).filter(b => !b.classList.contains('sticker-btn') && !b.classList.contains('vp-sticker-sendbtn'));

        const ROLE_ORDER = ['post', 'repost', 'postMedia', 'postAction', 'postText', 'avatarLink', 'avatar',
            'nickContainer', 'nickText', 'nickBadges', 'nickRow', 'nickLarge',
            'banner', 'bannerButtons', 'bannerDelete', 'bannerDraw',
            'nav', 'navLink', 'navIcon', 'sidebar', 'sidebarRight', 'logoContainer', 'versionBtn',
            'tabs', 'feedBar', 'commentBox', 'stickerContainer', 'stickerMicBtn', 'stickerSendBtn',
            'modal', 'notification', 'notificationText'];
        const roleCount = {};
        let tickCache = null;
        const F = role => (tickCache && tickCache[role]) || FIND[role]();

        let scope = null;
        const dirtyPosts = new Set();
        let lastFullTag = 0;
        function inScope(el) {
            if (!scope) return true;
            const p = el.closest('.' + SELECTORS.post);
            return !p || scope.has(p);
        }

        function tagAll(full = true) {
            tickCache = {};
            scope = null;
            const now = performance.now();
            if (full || now - lastFullTag > 5000) { full = true; lastFullTag = now; }
            for (const role of ROLE_ORDER) {
                let els = [];
                try { els = FIND[role](); } catch (e) { console.warn('[ITD VP] поиск сломался:', role, e); }
                const cls = SELECTORS[role];
                if (role === 'post' && !full) {
                    scope = new Set(els.filter(el => !el.classList.contains(cls) || dirtyPosts.has(el)));
                }
                tickCache[role] = role === 'post' && scope ? [...scope] : els;
                if (full) roleCount[role] = els.length;
                for (const el of els) if (!el.classList.contains(cls)) el.classList.add(cls);
            }
            dirtyPosts.clear();
            tickCache = null;
            scope = null;
        }

        const domHandlers = [];
        function onDom(fn) { domHandlers.push(fn); }
        let domQueued = false;
        const DOM_WATCH = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true };
        let lastTick = 0, domProf = null;
        function domTick() {
            domQueued = false;
            lastTick = performance.now();
            domRecords(domObserver.takeRecords());
            domObserver.disconnect();
            try {
                tagAll(false);
                for (const fn of domHandlers) {
                    const t0 = domProf ? performance.now() : 0;
                    try { fn(); } catch (e) { console.warn('[ITD VP]', fn.name || 'обработчик', e); logErr(fn.name || 'обработчик', e); }
                    if (domProf) { const k = fn.name || ('#' + domHandlers.indexOf(fn)), o = domProf[k] || (domProf[k] = { мс: 0, вызовов: 0, максимум: 0 }), d = performance.now() - t0; o.мс += d; o.вызовов++; if (d > o.максимум) o.максимум = d; }
                }
            } finally {
                domObserver.observe(document.body, DOM_WATCH);
            }
        }
        const lostVp = m => {
            const old = m.oldValue || '';
            if (!old.includes('vp-')) return false;
            const cl = m.target.classList;
            return old.split(/\s+/).some(c => c.startsWith('vp-') && !cl.contains(c));
        };
        function domRecords(muts) {
            let any = false;
            for (const m of muts) {
                if (m.type === 'childList' && ![...m.addedNodes, ...m.removedNodes].some(n => !(n.classList && n.classList.contains('vp-sw-stage')))) continue;
                if (m.type === 'attributes' && !lostVp(m)) continue;
                if (m.type === 'characterData' && !/\p{Extended_Pictographic}/u.test(m.target.nodeValue || '')) continue;
                any = true;
                const el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
                const p = el && el.closest('.' + SELECTORS.post);
                if (p) dirtyPosts.add(p);
            }
            return any;
        }
        const domObserver = new MutationObserver(muts => {
            if (domRecords(muts) && !domQueued) {
                domQueued = true;
                const wait = IS_PHONE ? Math.max(0, lastTick + 50 - performance.now()) : 0;
                if (wait) setTimeout(() => requestAnimationFrame(domTick), wait); else requestAnimationFrame(domTick);
            }
        });
        tagAll();
        domObserver.observe(document.body, DOM_WATCH);

        const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        pageWindow.itdvp = {
            diag() {
                tagAll();
                console.table(ROLE_ORDER.map(r => ({ роль: r, найдено: roleCount[r], класс: SELECTORS[r] })));
                return roleCount;
            },
            learned,
            nav() {
                const nav = siteEl('nav'), b = nav && nav.querySelector('.vp-nav-blob');
                const rows = [...document.querySelectorAll('.' + SELECTORS.navLink)].map(a => ({ ссылка: a.getAttribute('href'), классы: a.className, сверху: a.offsetTop }));
                console.table(rows);
                console.log('путь', location.pathname, '· капля', b ? { opacity: b.style.opacity, top: b.style.top, left: b.style.left, width: b.style.width } : 'нет');
                return rows;
            },
            domCost: seconds => {
                domProf = {};
                return new Promise(done => setTimeout(() => {
                    const rows = Object.entries(domProf).map(([k, o]) => ({ обработчик: k, мс: +o.мс.toFixed(1), вызовов: o.вызовов, максимум: +o.максимум.toFixed(1) })).sort((x, y) => y.мс - x.мс);
                    domProf = null;
                    console.table(rows.slice(0, 15));
                    done(rows);
                }, (seconds || 10) * 1000));
            },
            sched: () => { const t = sched.table(); console.table(t); return t; },
            bg: () => { const r = { стиль: effBg(), включён: backgroundEnabled, размер: W + 'x' + H, масштаб: bgK }; console.table(r); return r; },
            net: minutes => { const r = netTable(minutes); console.table(r.запросы); console.table(r.по_минутам); return r; }
        };
        setTimeout(() => {
            tagAll();
            const must = ['nav', 'sidebar', 'logoContainer'];
            if (roleCount.post) must.push('avatar', 'nickContainer', 'nickText');
            const lost = must.filter(r => !roleCount[r]);
            if (lost.length) console.warn('[ITD VP] не нашёл на странице:', lost.join(', '), '— похоже, сайт поменял разметку. Подробно: itdvp.diag()');
        }, 4000);

