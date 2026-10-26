        let railEnabled = GM_getValue('railEnabled', true);
        let mobileMenuOpen = false, mobileMenuEl = null;
        const GAMES = [
            { id: 'snake', name: 'Змейка', best: 'vp_snake_best', icon: '<path d="M4 17c0-3 2-4 4-4h8a3 3 0 0 0 0-6H9"/><circle cx="7" cy="7" r="1.6"/>' },
            { id: 'mines', name: 'Сапёр', best: 'vp_mines_best', icon: '<circle cx="12" cy="13" r="6"/><path d="M12 3v4M19.5 6 17 8.5M4.5 6 7 8.5"/>' },
            { id: 'tetris', name: 'Тетрис', best: 'vp_tetris_best', icon: '<path d="M4 14h5v5H4zM9 14h5v5H9zM9 9h5v5H9zM14 14h5v5h-5z"/>' }
        ];
        const rail = document.createElement('div');
        rail.className = 'vp-rail';
        rail.innerHTML = `
        <section class="vp-rail-card" data-block="stats"><div class="vp-rail-title">${svgIcon('<path d="M4 19V10M10 19V5M16 19v-7M21 19H3"/>', 16)}<span>Статистика</span></div>
            <div class="vp-seg"><div class="vp-seg-ind"></div><button data-p="all">Всё</button><button data-p="day">День</button><button data-p="week"><span class="vp-f">Неделя</span><span class="vp-s">Нед.</span></button><button data-p="month"><span class="vp-f">Месяц</span><span class="vp-s">Мес.</span></button></div>
            <div class="vp-stats"><div class="vp-menu-note">Загрузка...</div></div><div class="vp-stats-since"></div><button type="button" class="vp-more" hidden><span>Подробнее</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button><div class="vp-more-body"><div class="vp-more-in"><div class="vp-chart" hidden></div><div class="vp-best" hidden></div></div></div></section>
        <section class="vp-rail-card" data-block="club"><div class="vp-rail-title">${svgIcon('<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.5a3 3 0 0 1 0 5.5M18 14.5a5 5 0 0 1 2.5 4.5"/>', 16)}<span>Клуб ИТД&nbsp;X</span><b class="vp-club-count"></b></div>
            <div class="vp-club"><div class="vp-menu-note">Загрузка...</div></div></section>
        <section class="vp-rail-card" data-block="games"><div class="vp-rail-title">${svgIcon('<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7.5 10.5v4M5.5 12.5h4"/><circle cx="15.5" cy="11.5" r=".8"/><circle cx="17.5" cy="13.5" r=".8"/>', 16)}<span>Игры</span></div>
            <div class="vp-games-list"></div></section>`;
        document.body.appendChild(rail);
        const RAIL_CARDS = [{ id: 'stats', name: 'Статистика' }, { id: 'club', name: 'Клуб ИТД X' }, { id: 'games', name: 'Игры' }];
        function railCards() {
            const v = GM_getValue('railCards', null) || {}, ids = RAIL_CARDS.map(c => c.id);
            const order = (Array.isArray(v.order) ? v.order : []).filter(id => ids.includes(id));
            ids.forEach(id => { if (!order.includes(id)) order.push(id); });
            return { order, off: (Array.isArray(v.off) ? v.off : []).filter(id => ids.includes(id)) };
        }
        function railCardsSave(st) {
            GM_setValue('railCards', { order: st.order, off: st.off });
            applyRailCards();
        }
        function applyRailCards(place = true) {
            const st = railCards();
            for (const id of st.order) {
                const card = rail.querySelector(`:scope > .vp-rail-card[data-block="${id}"]`);
                if (!card) continue;
                rail.appendChild(card);
                card.hidden = st.off.includes(id);
            }
            if (place) placeRail();
        }
        applyRailCards(false);
        rail.addEventListener('pointerdown', e => {
            const title = e.target.closest('.vp-rail-title'), card = title && title.parentElement;
            if (!card || e.button || e.target.closest('button, a') || mobileMenuOpen && e.pointerType !== 'mouse') return;
            const y0 = e.clientY;
            let base = y0, on = false;
            const move = ev => {
                const dy = ev.clientY - base;
                if (!on) {
                    if (Math.abs(ev.clientY - y0) < 6) return;
                    on = true;
                    card.classList.add('vp-rail-drag');
                    rail.classList.add('vp-rail-sorting');
                    try { card.setPointerCapture(e.pointerId); } catch (x) { }
                }
                ev.preventDefault();
                const shown = [...rail.querySelectorAll(':scope > .vp-rail-card:not([hidden])')], i = shown.indexOf(card);
                const prev = shown[i - 1], next = shown[i + 1];
                if (next && dy > next.offsetHeight / 2) { next.after(card); base += next.offsetHeight + 12; }
                else if (prev && dy < -prev.offsetHeight / 2) { prev.before(card); base -= prev.offsetHeight + 12; }
                card.style.transform = `translateY(${ev.clientY - base}px)`;
            };
            const up = () => {
                removeEventListener('pointermove', move, true);
                removeEventListener('pointerup', up, true);
                removeEventListener('pointercancel', up, true);
                if (!on) return;
                card.classList.remove('vp-rail-drag');
                rail.classList.remove('vp-rail-sorting');
                card.style.transform = '';
                const st = railCards();
                st.order = [...rail.querySelectorAll(':scope > .vp-rail-card')].map(c => c.dataset.block);
                railCardsSave(st);
                const stop = ev => { ev.stopPropagation(); ev.preventDefault(); };
                addEventListener('click', stop, { capture: true, once: true });
                setTimeout(() => removeEventListener('click', stop, true), 0);
            };
            addEventListener('pointermove', move, true);
            addEventListener('pointerup', up, true);
            addEventListener('pointercancel', up, true);
        });

        const railCss = addCss(`
        html.vp-side-moved aside:has(nav), html.vp-side-moved .vp-sidebar { left: var(--vp-side-left) !important; }
        html.vp-side-wide aside:has(nav), html.vp-side-wide .vp-sidebar { width: var(--vp-side-w) !important; }
        .vp-rail { position: fixed; top: 24px; z-index: 50; display: none; flex-direction: column; gap: 12px;
            max-height: calc(100vh - 48px); overflow-y: auto; overflow-x: hidden; scrollbar-width: none; }
        .vp-rail.vp-on { display: flex; animation: vpRailIn .4s ease-out; }
        .vp-rail-card { border-radius: 36px; padding: 20px 22px; color: var(--text-primary, #fff); background: var(--block-bg);
            backdrop-filter: var(--vp-glass-filter, none); -webkit-backdrop-filter: var(--vp-glass-filter, none); }
        .vp-rail-card[hidden] { display: none !important; }
        .vp-rail-card > .vp-rail-title { cursor: grab; }
        .vp-rail-card.vp-rail-drag { position: relative; z-index: 2; cursor: grabbing; box-shadow: 0 16px 40px rgba(0, 0, 0, .45); transition: none; }
        .vp-rail-sorting { -webkit-user-select: none; user-select: none; }
        .vp-rail-title { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 16px; font-weight: 600;
            color: var(--text-primary, #fff); }
        .vp-rail-title svg { color: var(--text-secondary); flex-shrink: 0; }
        .vp-rail-title b { margin-left: auto; color: var(--text-secondary); font-size: 14px; font-weight: 500; }
        .vp-seg { position: relative; display: flex; margin-bottom: 10px; padding: 3px; border-radius: 9999px; background: var(--glass-bg, rgba(35, 35, 35, .8)); }
        .vp-seg button { position: relative; z-index: 1; flex: 1; padding: 6px 0; border: 0; background: none; cursor: pointer; font: inherit;
            font-size: 13px; font-weight: 500; color: var(--text-secondary); transition: color .2s ease; }
        .vp-seg button.vp-on { color: var(--text-primary, #fff); }
        .vp-seg-ind { position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc((100% - 6px) / 4); border-radius: 9999px;
            background: var(--tab-active-bg, rgba(255, 255, 255, .08)); transition: transform .3s cubic-bezier(.5, 0, 0, 1); }
        .vp-seg-ind { transform: translateX(calc(var(--vp-i, 0) * 100%)); }
        .vp-seg .vp-f { display: none; }
        .vp-menu-body .vp-seg .vp-f { display: inline; }
        .vp-menu-body .vp-seg .vp-s { display: none; }
        .vp-stats-since { margin-top: 4px; font-size: 12px; color: var(--text-secondary); }
        .vp-stats-since:empty { display: none; }
        .vp-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 8px; padding: 12px 14px; border-radius: 20px; background: var(--glass-bg, rgba(35, 35, 35, .8)); }
        .vp-stats > .vp-menu-note { grid-column: 1 / -1; }
        .vp-stat { display: flex; flex-direction: column; min-width: 0; }
        .vp-stat-label { order: -1; font-size: 12px; color: var(--text-secondary); }
        .vp-stat-val { font-size: 17px; font-weight: 700; white-space: nowrap; }
        .vp-menu-body .vp-stat-val { font-size: 19px; }
        .vp-stat-diff { font-size: 12.5px; font-weight: 700; color: var(--text-secondary); }
        .vp-stat-diff:empty { display: none; }
        .vp-more { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; margin-top: 10px; padding: 8px 0; border: 0; border-radius: 9999px; cursor: pointer;
            font: inherit; font-size: 13px; font-weight: 600; color: var(--text-secondary); background: var(--glass-bg, rgba(35, 35, 35, .8)); transition: color .2s ease, background-color .2s ease; }
        .vp-more:hover { color: var(--text-primary, #fff); }
        .vp-more[hidden] { display: none; }
        .vp-more svg { transition: transform .3s ease; }
        [data-block="stats"].vp-more-on .vp-more svg { transform: rotate(180deg); }
        .vp-more-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .32s cubic-bezier(.5, 0, 0, 1); }
        [data-block="stats"].vp-more-on .vp-more-body { grid-template-rows: 1fr; }
        .vp-more-in { min-height: 0; overflow: hidden; }
        .vp-chart { margin-top: 12px; padding: 12px; border-radius: 22px; background: rgba(127, 127, 127, .1); }
        .vp-chart[hidden], .vp-best[hidden] { display: none; }
        .vp-chart-h { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; font-weight: 700; }
        .vp-chart-h span, .vp-best-h span { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
        .vp-chart-cap { min-height: 2.6em; margin: 0 0 8px; font-size: 12px; font-weight: 600; line-height: 1.3; color: var(--text-secondary); }
        .vp-chart svg { display: block; width: 100%; height: auto; border-radius: 14px; touch-action: pan-y; }
        .vp-chart-ax { display: flex; justify-content: space-between; margin-top: 6px; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); }
        .vp-best { margin-top: 12px; }
        .vp-best-h { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; font-size: 14px; font-weight: 700; }
        .vp-best-post { display: block; margin-bottom: 6px; padding: 10px 14px; border-radius: 18px; background: var(--glass-bg, rgba(35, 35, 35, .8)); color: inherit; text-decoration: none; cursor: pointer; }
        .vp-best-post b { display: block; overflow: hidden; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
        .vp-best-post small { font-size: 12px; color: var(--text-secondary); }
        .vp-stat-diff.vp-up { color: #3ddc84; }
        .vp-stat-diff.vp-down { color: #ff5a6a; }
        .vp-club { display: flex; flex-direction: column; gap: 2px; max-height: 260px; overflow-y: auto; overflow-x: hidden; padding: 10px 14px; margin: 0 -12px;
            scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--text-secondary) 45%, transparent) transparent;
            -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%);
            mask-image: linear-gradient(to bottom, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%); }
        .vp-club-row { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 18px; cursor: pointer; min-width: 0;
            transition: background-color .15s ease; }
        .vp-club-row:hover { background: var(--bg-hover, rgba(255, 255, 255, .08)); }
        .vp-club-ava { width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-size: 17px; background: var(--bg-hover, rgba(255, 255, 255, .08)); overflow: hidden; }
        .vp-club-ava img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .vp-club-row[data-online] .vp-club-ava { overflow: visible; position: relative; }
        .vp-club-row[data-online] .vp-club-ava::after { content: ""; position: absolute; right: -1px; bottom: -1px; width: 9px; height: 9px; border-radius: 50%;
            background: #22c55e; box-shadow: 0 0 0 2px var(--block-bg); }
        html.vp-light .vp-club-row[data-online] .vp-club-ava::after { box-shadow: 0 0 0 2px #fff; }
        .vp-club-count { white-space: nowrap; flex-shrink: 0; }
        .vp-club-count .vp-club-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #22c55e; margin-right: 6px; vertical-align: 1px; }
        .vp-club-names { min-width: 0; display: flex; flex-direction: column; }
        .vp-club-name { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-club-login { font-size: 11px; color: var(--text-secondary); }
        @keyframes vpRailIn { from { opacity: 0; transform: translateX(10px); } }
        @media (prefers-reduced-motion: reduce) { .vp-rail.vp-on { animation: none; } }
    `);

        const menuBtnCss = addCss(`.vp-menu-btn { display: none !important; }
        @media (max-width: ${PHONE_MAX}px) { .vp-menu-btn { display: inline-flex !important; }
            div:has(> div > .vp-itdx-btn) { flex-wrap: wrap; justify-content: center; align-items: center; }
            div:has(> .vp-itdx-btn) { display: contents; } }
        .vp-menu { position: fixed; inset: 0; z-index: 2147483000; display: flex; flex-direction: column; box-sizing: border-box;
            background: var(--bg-primary, #000); color: var(--text-primary, #fff); font-family: inherit; animation: vpMenuIn .22s ease-out; overflow: hidden; }
        @keyframes vpMenuIn { from { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .vp-menu { animation: none; } }
        .vp-menu-top { display: flex; align-items: center; gap: 10px; padding: calc(env(safe-area-inset-top, 0px) + 16px) 16px 10px; }
        .vp-menu-title { flex: 1; min-width: 0; font-size: 22px; font-weight: 700; }
        .vp-menu-close { width: 40px; height: 40px; flex-shrink: 0; border: 0; border-radius: 50%; padding: 0; cursor: pointer;
            display: flex; align-items: center; justify-content: center; background: var(--block-bg); color: var(--text-primary, #fff); }
        .vp-menu-close:active { transform: scale(.94); }
        .vp-menu-body { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 0 16px calc(env(safe-area-inset-bottom, 0px) + 16px); -webkit-overflow-scrolling: touch; }
        .vp-menu-body .vp-rail { position: static !important; width: auto !important; max-height: none !important; left: auto !important; top: auto !important; animation: none !important; }
        html.vp-menu-open .itd-scroll-top-btn { opacity: 0 !important; visibility: hidden !important; }`);

        const RAIL_TOP = 36;
        const baseLeft = el => el.getBoundingClientRect().left - new DOMMatrix(getComputedStyle(el).transform).m41;
        let cbCached;
        function contentBox() {
            if (cbCached === undefined) {
                cbCached = contentBoxNow();
                queueMicrotask(() => { cbCached = undefined; });
            }
            return cbCached;
        }
        function contentBoxNow() {
            const side = '.' + SELECTORS.sidebar + ', .' + SELECTORS.sidebarRight + ', .vp-rail';
            let left = Infinity, right = 0;
            const memo = new Map(), tops = new Set();
            const up = el => {
                const p = el.parentElement;
                if (!p || p === document.body) return el;
                if (!memo.has(p)) memo.set(p, !p.querySelector(side) && p.getBoundingClientRect().width < innerWidth * 0.72 ? up(p) : null);
                return memo.get(p) || el;
            };
            document.querySelectorAll('.' + [SELECTORS.tabs, SELECTORS.feedBar, SELECTORS.banner, SELECTORS.post, SELECTORS.notification].join(', .')).forEach(e => { if (!e.closest('.vp-sw-stage')) tops.add(up(e)); });
            tops.forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.width > 300) { left = Math.min(left, r.left); right = Math.max(right, r.right); }
            });
            if (right) feedCb = { left, right, w: innerWidth };
            if (!right) {
                const frame = [...document.querySelectorAll('iframe')].find(f => {
                    const r = f.getBoundingClientRect();
                    return r.width >= innerWidth * 0.72 && r.height >= innerHeight * 0.6;
                });
                if (frame) return msgsOpen ? frameColumn() : frameInner(frame) || { left: 0, right: 0 };
                const skip = side + ', nav, .vp-hc, .vp-msgs, .vpi-overlay';
                for (const y of [0.35, 0.6]) {
                    const hit = document.elementsFromPoint(innerWidth / 2, innerHeight * y).find(e => e !== document.body
                        && e !== document.documentElement && !e.closest(skip) && e.getBoundingClientRect().width < innerWidth * 0.72);
                    let el = hit;
                    while (el && el.parentElement && el.parentElement !== document.body && !el.parentElement.querySelector(side)
                        && el.parentElement.getBoundingClientRect().width < innerWidth * 0.72) el = el.parentElement;
                    const r = el && el.getBoundingClientRect();
                    if (r && r.width > 300) { left = Math.min(left, r.left); right = Math.max(right, r.right); }
                }
            }
            return right ? { left, right } : null;
        }
        function frameInner(f) {
            let d;
            try { d = f.contentDocument; } catch (e) { return null; }
            if (!d || !d.body || !d.documentElement.clientWidth) return null;
            const r = f.getBoundingClientRect(), W = d.documentElement.clientWidth, Hh = d.documentElement.clientHeight;
            let left = Infinity, right = 0;
            for (const y of [0.3, 0.5, 0.7]) {
                let el = d.elementsFromPoint(W / 2, Math.min(Hh * y, Hh - 1)).find(e => e !== d.body && e !== d.documentElement);
                while (el && el.parentElement && el.parentElement !== d.body && el.parentElement !== d.documentElement
                    && el.parentElement.getBoundingClientRect().width < W * 0.95) el = el.parentElement;
                const b = el && el.getBoundingClientRect();
                if (b && b.width > 300 && b.width < W * 0.95) { left = Math.min(left, r.left + b.left); right = Math.max(right, r.left + b.right); }
            }
            return right ? { left, right } : null;
        }
        function glidePlace() {
            if (performance.now() < 3000) { placeSidebar(); placeRail(); return; }
            const side = siteEl('sidebar'), on = rail.classList.contains('vp-on');
            const a = side && side.getBoundingClientRect().left, b = on && rail.getBoundingClientRect().left;
            placeSidebar(); placeRail();
            [[side, a], [on && rail.classList.contains('vp-on') && rail, b]].forEach(([el, was]) => {
                if (!el || typeof was !== 'number') return;
                const d = was - el.getBoundingClientRect().left;
                if (Math.abs(d) > 1) el.animate([{ transform: `translateX(${d}px)` }, { transform: 'translateX(0)' }], { duration: 360, easing: 'cubic-bezier(.25, .8, .25, 1)', composite: 'add' });
            });
        }
        let lastCb = null;
        let feedCb = null;
        function frameColumn() {
            if (feedCb && feedCb.w === innerWidth) return { left: feedCb.left, right: feedCb.right };
            const side = siteEl('sidebar');
            const sw = side ? side.getBoundingClientRect().width : 0;
            const siteLeft = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-gap')) || 36;
            const w = Math.min(650, innerWidth - 32);
            let left = Math.round(innerWidth / 2 - w / 2);
            if (sw && left - sw - 24 <= siteLeft + 8) left = Math.round(siteLeft + sw + 24);
            return { left, right: Math.min(innerWidth - 16, left + w) };
        }
        function onMenuKey(e) {
            if (e.key === 'Escape' && mobileMenuOpen) { e.stopPropagation(); closeMobileMenu(); }
        }
        function openMobileMenu(fromHistory) {
            if (mobileMenuEl) return;
            const el = document.createElement('div');
            el.className = 'vp-menu';
            el.innerHTML = `<div class="vp-menu-top"><div class="vp-menu-title">ИТД X · Меню</div><button type="button" class="vp-menu-close" aria-label="Закрыть">${svgIcon('<path d="M6 6l12 12M18 6 6 18"/>', 22)}</button></div><div class="vp-menu-body"></div>`;
            document.body.appendChild(el);
            mobileMenuEl = el;
            mobileMenuOpen = true;
            document.documentElement.classList.add('vp-menu-open');
            el.querySelector('.vp-menu-body').appendChild(rail);
            rail.classList.add('vp-on');
            rail.style.position = 'static';
            rail.style.left = 'auto';
            rail.style.top = 'auto';
            rail.style.width = 'auto';
            rail.style.maxHeight = 'none';
            el.querySelector('.vp-menu-close').addEventListener('click', () => closeMobileMenu());
            el.addEventListener('click', e => { if (e.target === el) closeMobileMenu(); });
            document.addEventListener('keydown', onMenuKey, true);
            if (fromHistory !== true) overlayEnter('vpMenu');
        }
        function closeMobileMenu(fromHistory) {
            if (!mobileMenuEl) return;
            const el = mobileMenuEl;
            mobileMenuEl = null;
            mobileMenuOpen = false;
            document.documentElement.classList.remove('vp-menu-open');
            document.removeEventListener('keydown', onMenuKey, true);
            rail.classList.remove('vp-on');
            rail.style.position = '';
            rail.style.left = '';
            rail.style.top = '';
            rail.style.width = '';
            rail.style.maxHeight = '';
            document.body.appendChild(rail);
            el.remove();
            placeRail();
            if (fromHistory !== true && overlayAt('vpMenu')) history.back();
        }
        document.addEventListener('vp-loc', () => { setTimeout(placeRail, 60); setTimeout(placeRail, 400); });
        addEventListener('popstate', () => {
            if (overlayAt('vpMenu') && !mobileMenuOpen) openMobileMenu(true);
            else if (mobileMenuOpen && !overlayAt('vpMenu')) closeMobileMenu(true);
        });
        let sideWide = 0;
        function sideSync(w) {
            const root = document.documentElement, cb = lastCb;
            let m = 0;
            if (w && cb && !galOpen && innerWidth > PHONE_MAX) {
                const siteLeft = parseFloat(getComputedStyle(root).getPropertyValue('--sidebar-gap')) || 36;
                m = Math.min(w, Math.floor(cb.left - 24 - siteLeft));
                if (m <= 204) m = 0;
            }
            if (m !== sideWide) {
                sideWide = m;
                root.classList.toggle('vp-side-wide', !!m);
                if (m) root.style.setProperty('--vp-side-w', m + 'px'); else root.style.removeProperty('--vp-side-w');
                placeSidebar();
            }
            return m || w;
        }
        function placeRail() {
            if (mobileMenuOpen) return;
            const cb = contentBox() || lastCb;
            if (cb) lastCb = cb;
            const edge = cb ? cb.right : 0;
            const side = siteEl('sidebarRight');
            const right = side ? side.getBoundingClientRect().left : innerWidth;
            const gap = right - edge;
            let box = null, adj = false, sideW = 0;
            const on = railEnabled && !!myUsername && !/^\/(login|register|signup|forgot|reset)/.test(location.pathname) && !!rail.querySelector(':scope > .vp-rail-card:not([hidden])');
            const sideEl = siteEl('sidebar');
            if (on && galOpen && sideEl && innerWidth > PHONE_MAX) {
                const margin = Math.max(12, Math.round(baseLeft(sideEl))), width = 250;
                box = { left: innerWidth - margin - width, width, maxH: innerHeight - RAIL_TOP - 24 };
            } else if (on && edge > 0 && gap >= 240) {
                const width = sideW = Math.min(250, gap - 48);
                box = { left: Math.round(edge + 24), width, maxH: innerHeight - 48 };
            } else if (on && edge > 0 && innerWidth - edge - 48 >= 240 && innerWidth > PHONE_MAX) {
                sideW = Math.min(250, innerWidth - edge - 48);
                box = { left: Math.round(edge + 24), width: sideW, maxH: innerHeight - 48 };
                adj = true;
            } else if (on && side) {
                const sr = side.getBoundingClientRect(), links = side.lastElementChild;
                const maxH = (links ? links.getBoundingClientRect().top : sr.bottom) - 24 - 24;
                if (sr.width >= 180 && maxH >= 220) box = { left: Math.round(sr.left), width: Math.round(sr.width), maxH };
            }
            const common = sideSync(box ? sideW : 0);
            if (box && sideW) box.width = common;
            rail.style.top = RAIL_TOP + 'px';
            if (box && edge > 0 && (gap >= 240 || adj) && !galOpen) box.maxH = innerHeight - RAIL_TOP - 24;
            rail.classList.toggle('vp-on', !!box);
            document.documentElement.classList.toggle('vp-rail-adj', adj && !!box);
            if (!box) return;
            rail.style.width = box.width + 'px';
            rail.style.left = box.left + 'px';
            rail.style.maxHeight = box.maxH + 'px';
        }
        addEventListener('resize', placeRail);

        function placeSidebar() {
            if (galOpen) { document.documentElement.classList.remove('vp-side-moved'); return; }
            const side = siteEl('sidebar');
            const cb = contentBox() || lastCb;
            if (!side || !cb) return;
            const siteLeft = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-gap')) || 36;
            const want = Math.round(cb.left - side.getBoundingClientRect().width - 24);
            const on = want > siteLeft + 8 && getComputedStyle(side).position === 'fixed';
            document.documentElement.classList.toggle('vp-side-moved', on);
            if (on) document.documentElement.style.setProperty('--vp-side-left', want + 'px');
        }
        addEventListener('resize', placeSidebar);
        onDom(glidePlace);
        placeSidebar();

