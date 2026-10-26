        const styleSidebar = addCss(`
        .vp-sidebar, .vp-sidebar-right {
            animation: fadeSlide 0.4s ease-out;
        }
        @keyframes fadeSlide {
            0% { opacity: 0; transform: translateX(-10px); }
            100% { opacity: 1; transform: translateX(0); }
        }
        .vp-sidebar-right {
            animation-name: fadeSlideRight;
        }
        @keyframes fadeSlideRight {
            0% { opacity: 0; transform: translateX(10px); }
            100% { opacity: 1; transform: translateX(0); }
        }
    `);

        const styleUnderline = addCss(`
        .vp-nick .vp-nick-text {
            transition: text-decoration-color 0.2s ease;
        }
        a[href^="/@"]:hover .vp-nick-text {
            text-decoration: underline;
            text-decoration-thickness: 2px;
            text-underline-offset: 4px;
            text-decoration-color: var(--accent-primary);
        }
    `);

        let modalOverlay = null;
        let updateTimeout = null;

        function floatsOverPage(el) {
            for (let e = el, i = 0; e && e !== document.body && i < 6; e = e.parentElement, i++) if (getComputedStyle(e).position === 'fixed') return true;
            return false;
        }
        function isModalVisible() {
            const modals = document.querySelectorAll('.vp-modal, [class*="modal"]');
            for (const modal of modals) {
                if (!floatsOverPage(modal) || /штор/i.test(modal.getAttribute('aria-label') || '')) continue;
                const style = getComputedStyle(modal);
                if (style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    style.opacity !== '0') {
                    const rect = modal.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        return modal;
                    }
                }
            }
            return null;
        }

        function updateModalOverlay() {
            if (updateTimeout) {
                cancelAnimationFrame(updateTimeout);
                updateTimeout = null;
            }
            updateTimeout = requestAnimationFrame(() => {
                const modal = isModalVisible();
                if (modal) {
                    if (!modalOverlay) {
                        modalOverlay = document.createElement('div');
                        modalOverlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(2px);
                    z-index: 999;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                `;
                        document.body.appendChild(modalOverlay);
                    }
                } else {
                    if (modalOverlay) {
                        modalOverlay.remove();
                        modalOverlay = null;
                    }
                }
                updateTimeout = null;
            });
        }

        const PAINTED = '.vp-nick, .vp-nick-text, .my-avatar-glow, article.vp-post, .vp-nav-link, .vp-nav-icon, .vp-nav-blob, '
            + '.vp-banner > img, .vp-ambient, .vp-bg-canvas, .vp-rail';
        const modalObserver = new MutationObserver(muts => {
            if (muts.some(m => m.type === 'childList' || !m.target.matches(PAINTED))) updateModalOverlay();
        });
        modalObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        window.addEventListener('popstate', () => {
            updateModalOverlay();
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) updateModalOverlay();
        });

        const styleIcons = addCss(`
        .vp-nav-link .vp-nav-icon svg {
            transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1) !important;
        }
        .vp-nav-link:hover .vp-nav-icon svg {
            transform: translateY(-2px) scale(1.05) !important;
        }
    `);

        const blurCards = new Map();
        const blurRO = new ResizeObserver(entries => {
            const todo = new Set(entries.map(e => blurCards.has(e.target) ? e.target : e.target._vpBlurCard));
            todo.forEach(card => card && placeBlur(card));
        });
        function placeBlur(card) {
            const b = blurCards.get(card);
            if (!b) return;
            if (!b.img.isConnected || !card.isConnected) { b.img._vpBlurDone = null; dropBlur(card); return; }
            const ar = card.getBoundingClientRect(), ir = b.img.getBoundingClientRect();
            if (!ar.width || !ir.width) return;
            const k = card.offsetWidth / ar.width;
            Object.assign(b.layer.style, {
                left: ((ir.left - ar.left) * k - card.clientLeft) + 'px', top: ((ir.top - ar.top) * k - card.clientTop) + 'px',
                width: ir.width * k + 'px', height: ir.height * k + 'px'
            });
        }
        function dropBlur(card) {
            const b = blurCards.get(card);
            if (b) { blurRO.unobserve(b.img); blurRO.unobserve(card); blurCards.delete(card); }
            card.removeAttribute('data-blur-bg');
            card.classList.remove('itd-blur-active', 'vp-blur-rel');
            const c = card.querySelector(':scope > .itd-blur-container');
            if (c) c.remove();
        }
        function buildBlur(card, img) {
            const old = blurCards.get(card);
            if (old) { blurRO.unobserve(old.img); blurRO.unobserve(card); }
            card.setAttribute('data-blur-bg', img.src);
            if (getComputedStyle(card).position === 'static') card.classList.add('vp-blur-rel');
            card.classList.add('itd-blur-active');
            let box = card.querySelector(':scope > .itd-blur-container');
            if (!box) {
                box = document.createElement('div');
                box.className = 'itd-blur-container';
                box.innerHTML = '<div class="vp-blur-img"></div><div class="vp-blur-dim"></div>';
                card.insertBefore(box, card.firstChild);
            }
            const cs = getComputedStyle(card);
            box.style.clipPath = `inset(0 round ${cs.borderTopLeftRadius} ${cs.borderTopRightRadius} ${cs.borderBottomRightRadius} ${cs.borderBottomLeftRadius})`;
            const layer = box.firstChild;
            layer.style.backgroundImage = `url("${img.src}")`;
            blurCards.set(card, { img, layer });
            img._vpBlurCard = card;
            blurRO.observe(img);
            blurRO.observe(card);
            placeBlur(card);
        }
        function addBlurBackground() {
            const cards = new Set();
            document.querySelectorAll('img.' + SELECTORS.postMedia).forEach(img => {
                if (img._vpBlurDone === img.src) return;
                let pending = false;
                for (const card of [img.closest('.' + SELECTORS.repost), img.closest('article.' + SELECTORS.post)]) {
                    const first = card && card.querySelector('img.' + SELECTORS.postMedia);
                    if (card && first && card.getAttribute('data-blur-bg') !== first.src) { cards.add(card); pending = true; }
                }
                if (!pending) img._vpBlurDone = img.src;
            });
            document.querySelectorAll('[data-blur-bg]').forEach(card => {
                if (!card.querySelector('img.' + SELECTORS.postMedia)) dropBlur(card);
            });
            cards.forEach(card => {
                const img = card.querySelector('img.' + SELECTORS.postMedia);
                if (!img || !img.src || img.src.includes('avatar')) return;
                buildBlur(card, img);
            });
        }

        const styleBlurPosts = addCss(`
        .vp-post.itd-blur-active, .vp-repost.itd-blur-active {
            background: transparent !important;
            backdrop-filter: none !important;
        }
        .vp-blur-rel { position: relative; }
        .itd-blur-container {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: inherit; overflow: hidden;
            z-index: -1; pointer-events: none; background: var(--block-bg);
        }
        .vp-blur-img {
            position: absolute; left: 0; top: 0; width: 0; height: 0;
            background: center / cover no-repeat;
            filter: blur(34px) brightness(1.3) saturate(1.6); transform: scale(1.3);
        }
        .vp-blur-dim { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.45); }
        .itd-blur-active .vp-repost {
            background: rgba(0, 0, 0, 0.3) !important;
        }
        html.vp-light .vp-blur-dim { background: rgba(255, 255, 255, 0.55); }
        html.vp-light .itd-blur-active .vp-repost { background: rgba(255, 255, 255, 0.35) !important; }
        .vp-post .blur-bg-layer, .vp-post .blur-overlay,
        .vp-repost .blur-bg-layer, .vp-repost .blur-overlay {
            display: none !important;
        }
    `);

        onDom(function postBlur() { if (postBlurEnabled) addBlurBackground(); });

