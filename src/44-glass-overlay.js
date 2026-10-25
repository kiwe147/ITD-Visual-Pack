        const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || softLoad;

        let glassEnabled = GM_getValue('glassEnabled', true);
        const glassCss = document.createElement('style');
        document.head.appendChild(glassCss);
        let glassSheets = -1, glassSel = '';
        function collectGlass() {
            if (document.styleSheets.length === glassSheets) return;
            glassSheets = document.styleSheets.length;
            const sels = new Set();
            const walk = rules => {
                for (const r of rules) {
                    if (r.cssRules && !r.selectorText) { walk(r.cssRules); continue; }
                    if (!r.selectorText || r.selectorText.includes('::')) continue;
                    if (/var\(--(block-bg|modal-bg|block-bg-secondary|glass-bg)/.test(r.style.background + r.style.backgroundColor)) sels.add(r.selectorText);
                }
            };
            for (const sh of document.styleSheets) {
                if (sh.ownerNode === glassCss || sh.ownerNode === fx) continue;
                try { walk(sh.cssRules); } catch (e) { }
            }
            glassSel = [...sels].join(', ');
            glassCss.textContent = [...sels].map(sel => `html.vp-glass :is(${sel}) { backdrop-filter: var(--vp-glass-filter); -webkit-backdrop-filter: var(--vp-glass-filter); }`).join('\n');
        }
        function applyGlass() {
            document.documentElement.classList.toggle('vp-glass', glassEnabled);
            if (glassEnabled) collectGlass();
        }
        applyGlass();
        onDom(function glassSheetsCheck() { if (glassEnabled) collectGlass(); });
        const floatSeen = new WeakSet();
        let floatAt = 0;
        onDom(function glassFloating() {
            if (!glassEnabled || !glassSel || performance.now() - floatAt < 250) return;
            floatAt = performance.now();
            document.querySelectorAll(`:is(${glassSel}), [style*="--block-bg"], [style*="--modal-bg"], [style*="--glass-bg"]`).forEach(el => {
                if (floatSeen.has(el)) return;
                floatSeen.add(el);
                if (el.matches('article, .' + SELECTORS.post + ', .' + SELECTORS.avatar) || el.closest('nav, aside, .vp-rail, .vp-msgs, .vp-comments-sheet, .vp-sw-stage')) return;
                for (let n = el, i = 0; n && n !== document.body && i < 6; n = n.parentElement, i++) {
                    const cs = getComputedStyle(n);
                    if (cs.position === 'fixed' || (cs.position === 'absolute' && +cs.zIndex >= 5)) { el.classList.add('vp-float'); return; }
                }
                const outer = el.parentElement && el.parentElement.closest(`:is(${glassSel})`);
                const bg = getComputedStyle(el).backgroundColor;
                if (outer && !outer.classList.contains('vp-float') && getComputedStyle(outer).backgroundColor === bg && !/^rgba\(0, 0, 0, 0\)$/.test(bg)) el.classList.add('vp-nested');
            });
        });
        onDom(function commentsSheet() {
            for (const input of commentInputs()) {
                let sheet = null;
                for (let p = input.parentElement; p && p !== document.body; p = p.parentElement) {
                    if (getComputedStyle(p).position === 'fixed') sheet = p;
                }
                if (sheet && !sheet.classList.contains('vp-comments-sheet')) sheet.classList.add('vp-comments-sheet');
            }
        });

        onDom(function clampFade() {
            document.querySelectorAll('.vp-clamp').forEach(el => {
                const b = el.nextElementSibling;
                if (!b || b.tagName !== 'BUTTON' || !/Читать далее/i.test(b.textContent)) el.classList.remove('vp-clamp');
            });
            document.querySelectorAll('.' + SELECTORS.post + ' button').forEach(b => {
                if (!/^\s*Читать далее\s*$/i.test(b.textContent)) return;
                const box = b.previousElementSibling;
                if (box && !box.classList.contains('vp-clamp')) box.classList.add('vp-clamp');
            });
        });

        document.addEventListener('pointerdown', e => {
            if (e.pointerType !== 'touch') return;
            const b = e.target.closest && e.target.closest('.vp-post-action');
            if (!b) return;
            b.classList.add('vp-pressed');
            const off = () => { setTimeout(() => b.classList.remove('vp-pressed'), 180); removeEventListener('pointerup', off, true); removeEventListener('pointercancel', off, true); };
            addEventListener('pointerup', off, true);
            addEventListener('pointercancel', off, true);
        }, true);

        let backdropSel = '', backdropSheets = -1;
        function siteBackdropSelector() {
            if (document.styleSheets.length === backdropSheets) return backdropSel;
            backdropSheets = document.styleSheets.length;
            const found = new Set();
            const zero = v => v === '0px' || v === '0';
            for (const sh of document.styleSheets) {
                let rules;
                try { rules = sh.cssRules; } catch (e) { continue; }
                for (const r of rules || []) {
                    const st = r.style;
                    if (!st || !r.selectorText || /vpi?-/.test(r.selectorText)) continue;
                    if (st.position !== 'fixed' || !(parseInt(st.zIndex) >= 100)) continue;
                    const full = zero(st.inset) || (zero(st.top) && zero(st.left) && (zero(st.right) || /^100(%|vw)$/.test(st.width))
                        && (zero(st.bottom) || /^100(%|vh|dvh)$/.test(st.height)));
                    if (full) r.selectorText.split(',').forEach(x => { if (/^\.[\w-]+$/.test(x.trim())) found.add(x.trim()); });
                }
            }
            backdropSel = [...found].join(', ');
            return backdropSel;
        }
        const shown = el => { if (!el.isConnected || !el.getClientRects().length) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.pointerEvents !== 'none'; };
        function siteOverlay() {
            const sel = siteBackdropSelector();
            const list = [...document.querySelectorAll(['[data-comments-modal]', '.vp-comments-sheet', '[role="dialog"]:not(.vp-modal)',
                '[aria-modal="true"]:not(.vp-modal)', sel].filter(Boolean).join(', '))].filter(e => !e.closest('.vp-msg-backdrop, .settings-dropdown'));
            for (let i = list.length - 1; i >= 0; i--) if (shown(list[i]) && list[i].getBoundingClientRect().height > innerHeight * 0.5) return list[i];
            return null;
        }
        let overlayEl = null, overlayHist = false;
        function closeSiteOverlay(el) {
            const gone = () => !shown(el) || siteOverlay() !== el;
            const esc = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true });
            (document.activeElement || document.body).dispatchEvent(esc);
            setTimeout(() => {
                if (gone()) return;
                const back = (sel => sel && el.matches(sel) ? el : el.closest(sel || 'body'))(siteBackdropSelector()) || el;
                for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'])
                    back.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window }));
                setTimeout(() => {
                    if (gone()) return;
                    const x = el.querySelector('button[aria-label*="акры" i], button[aria-label*="close" i], [aria-label*="Назад" i], button[title*="акры" i]');
                    if (x) x.click();
                }, 90);
            }, 90);
        }
        window.addEventListener('popstate', () => {
            if (!overlayHist) return;
            if (history.state && history.state.vpOverlay) return;
            overlayHist = false;
            const el = overlayEl;
            overlayEl = null;
            if (el && shown(el)) closeSiteOverlay(el);
        });
        onDom(function overlayBack() {
            const el = siteOverlay();
            if (el && el !== overlayEl) {
                overlayEl = el;
                if (!overlayHist) {
                    history.pushState(Object.assign({}, history.state, { vpOverlay: true }), '', location.href);
                    overlayHist = true;
                }
            } else if (!el && overlayEl) {
                overlayEl = null;
                if (overlayHist) {
                    overlayHist = false;
                    if (history.state && history.state.vpOverlay) history.back();
                }
            }
        });

        let lastPath = location.pathname;
        function pageColumn() {
            let el = document.querySelector('.' + [SELECTORS.feedBar, SELECTORS.tabs, SELECTORS.banner, SELECTORS.post, SELECTORS.notification].join(', .'));
            if (!el) return null;
            const side = '.' + SELECTORS.sidebar + ', .' + SELECTORS.sidebarRight + ', .' + SELECTORS.nav;
            while (el.parentElement && el.parentElement !== document.body && el.parentElement.getBoundingClientRect().width < 760
                && !el.parentElement.querySelector(side)) el = el.parentElement;
            return el.querySelector(side) ? null : el;
        }
        onDom(function pageTransition() {
            if (location.pathname === lastPath) return;
            lastPath = location.pathname;
            if (calm) return;
            const col = pageColumn();
            if (!col) return;
            const lite = document.documentElement.classList.contains('vp-glass-lite');
            col.animate([
                { opacity: 0, transform: 'translateY(14px)', filter: lite ? 'none' : 'blur(5px)' },
                { opacity: 1, transform: 'none', filter: 'none' }
            ], { duration: 340, easing: 'cubic-bezier(.2, .8, .2, 1)' });
        });

