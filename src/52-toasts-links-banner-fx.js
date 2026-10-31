        const TOAST_MS = 7000;
        let toastSeq = 0;
        const styleToasts = addCss(`
        .vp-toasts { top: 16px !important; bottom: auto !important; left: 50vw !important; right: auto !important;
            transform: translateX(-50%) !important; align-items: center !important;
            width: min(420px, calc(100vw - 24px)) !important; max-width: none !important; }
        .vp-toasts > button { display: none !important; }
        .vp-toasts > div > * { width: 100%; box-sizing: border-box; border-radius: 24px !important; background-color: var(--block-bg) !important;
            border: 1px solid var(--border-color, rgba(255, 255, 255, .12)); box-shadow: 0 14px 36px rgba(0, 0, 0, .45);
            backdrop-filter: var(--vp-glass-filter, blur(18px)); -webkit-backdrop-filter: var(--vp-glass-filter, blur(18px)); }
        .vp-toast-old { display: none !important; }
        @media (max-width: ${PHONE_MAX}px) { .vp-toasts { top: calc(env(safe-area-inset-top, 0px) + 10px) !important; } }
    `);
        function toastBox() {
            const root = document.getElementById('root');
            if (!root) return null;
            for (const el of root.children) {
                if (el.classList.contains('vp-toasts')) return el;
                if (el.childElementCount > 3 || !el.querySelector(':scope > div') || getComputedStyle(el).position !== 'fixed') continue;
                if (!el.querySelector('p') && !el.querySelector(':scope > button')) continue;
                el.classList.add('vp-toasts');
                return el;
            }
            return null;
        }
        function closeToast(it) {
            if (!it.isConnected || it._vpClosed) return;
            it._vpClosed = true;
            it.classList.add('vp-toast-old');
            const x = [...it.querySelectorAll('button')].pop();
            if (x) x.click();
        }
        onDom(function toastsOne() {
            const box = toastBox(), list = box && box.querySelector(':scope > div');
            if (!list) return;
            const items = [...list.children].filter(it => !it._vpClosed);
            if (!items.length) return;
            if (msgToastEl && items.some(it => !it._vpN)) { msgToastEl.remove(); msgToastEl = null; }
            for (const it of items) if (!it._vpN) {
                it._vpN = ++toastSeq;
                setTimeout(() => closeToast(it), TOAST_MS);
            }
            const newest = items.reduce((a, b) => (b._vpN >= a._vpN ? b : a));
            items.forEach(it => { if (it !== newest) closeToast(it); });
            const emoji = emojiAvatarOf(newest) || '';
            if ((newest.getAttribute('data-colored') || '') !== emoji || (emoji && !newest.classList.contains('vp-emoji-tint'))) {
                untintCard(newest);
                if (emoji) { newest.setAttribute('data-colored', emoji); tintCard(newest, emoji); } else newest.removeAttribute('data-colored');
            }
        });

        if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
            let hoverVid = null;
            const videoAt = t => {
                if (!t || !t.closest) return null;
                const tile = t.closest('.vp-gal-tile');
                if (tile) {
                    const strip = tile.querySelector('.vp-gal-strip'), slide = strip && strip.children[strip._vpI || 0];
                    return slide ? slide.querySelector('video') : null;
                }
                if (t.tagName === 'VIDEO') return t;
                const box = t.closest('.' + SELECTORS.postMedia);
                return box ? [...box.querySelectorAll('video')].find(v => v.getBoundingClientRect().width > 0) || null : null;
            };
            const unmute = v => {
                if (!v || !v.muted) return;
                if (v.closest('.vp-gal')) { const g = galVol(); if (!g) return; v.volume = g; }
                const wasPlaying = !v.paused;
                v._vpHoverSound = true;
                v.muted = false;
                setTimeout(() => { if (wasPlaying && v.paused && !v.muted) { v.muted = true; v._vpHoverSound = false; v.play().catch(() => { }); } }, 0);
            };
            const mute = v => { if (v && v._vpHoverSound) { v.muted = true; v._vpHoverSound = false; } };
            document.addEventListener('pointerover', e => {
                if (e.pointerType !== 'mouse') return;
                const v = videoAt(e.target);
                if (v === hoverVid) return;
                mute(hoverVid);
                hoverVid = v;
                unmute(v);
            }, true);
            document.addEventListener('pointerleave', () => { mute(hoverVid); hoverVid = null; });
            document.addEventListener('scroll', e => {
                if (!hoverVid || !e.target.classList || !e.target.classList.contains('vp-gal-strip')) return;
                requestAnimationFrame(() => { const el = document.querySelectorAll(':hover'), t = el[el.length - 1], v = videoAt(t); if (v !== hoverVid) { mute(hoverVid); hoverVid = v; unmute(v); } });
            }, true);
        }

        const LINK_RE = /(?:https?:\/\/|www\.)[^\s<>"'«»]+|(?<![\w@.\/-])(?:[a-z0-9-]+\.)+(?:com|ru|me|org|net|io|gg|tv|app|dev|xyz|su|ly|co|be|link|site|store|online|info|pro|рф)(?:\/[^\s<>"'«»]*)?(?![\w-])|(?<![\w@.\/-])[а-яё0-9-]+\.(?:com|рф|ru)(?![\w-])/giu;
        const linkNodes = new Map();
        const linkHl = window.Highlight && CSS.highlights ? new Highlight() : null;
        if (linkHl) CSS.highlights.set('vp-link', linkHl);
        const styleLinks = addCss(`::highlight(vp-link) { color: var(--accent-primary); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 2px; }`);
        let linksAt = 0;
        function scanLinks() {
            const root = document.getElementById('root');
            if (!root) return;
            for (const node of linkNodes.keys()) if (!node.isConnected) linkNodes.delete(node);
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            for (let node = walker.nextNode(); node; node = walker.nextNode()) {
                const text = node.nodeValue;
                if (text.length < 5 || !text.includes('.')) { linkNodes.delete(node); continue; }
                const known = linkNodes.get(node);
                if (known && known.text === text) continue;
                const host = node.parentElement;
                if (!host || host.closest('a, button, input, textarea, [contenteditable], script, style, .vp-settings-tabs')) continue;
                const links = [];
                for (const m of text.matchAll(LINK_RE)) {
                    const raw = m[0].replace(/[.,!?:;)\]]+$/, '');
                    if (raw.length < 4) continue;
                    links.push({ start: m.index, end: m.index + raw.length, url: /^https?:\/\//i.test(raw) ? raw : 'https://' + raw });
                }
                if (links.length) linkNodes.set(node, { text, links }); else linkNodes.delete(node);
            }
            if (!linkHl) return;
            linkHl.clear();
            for (const [node, { links }] of linkNodes) for (const l of links) {
                const r = new Range();
                r.setStart(node, l.start); r.setEnd(node, l.end);
                linkHl.add(r);
            }
        }
        onDom(function linksScan() {
            if (performance.now() - linksAt < 500) return;
            linksAt = performance.now();
            scanLinks();
        });
        function linkAt(x, y) {
            const pos = document.caretPositionFromPoint ? document.caretPositionFromPoint(x, y) : document.caretRangeFromPoint && document.caretRangeFromPoint(x, y);
            if (!pos) return null;
            const node = pos.offsetNode || pos.startContainer, off = pos.offset ?? pos.startOffset;
            const info = node && linkNodes.get(node);
            if (!info || info.text !== node.nodeValue) return null;
            const l = info.links.find(l => off >= l.start && off <= l.end);
            if (!l) return null;
            const r = new Range(); r.setStart(node, l.start); r.setEnd(node, l.end);
            return [...r.getClientRects()].some(b => x >= b.left - 2 && x <= b.right + 2 && y >= b.top - 2 && y <= b.bottom + 2) ? l : null;
        }
        const JOIN_HOST_RE = /^https?:\/\/(?:xn--d1ah4a\.com|итд\.com)\/$/i;
        const JOIN_PATH_RE = /^\s*(\/[a-z]+\/[0-9a-f-]+)/i;
        function joinProfilePostLinks() {
            const root = document.getElementById('root');
            if (!root) return 0;
            let fixed = 0;
            root.querySelectorAll('a[href^="/@"]').forEach(a => {
                if (a.dataset.vpJoined) return;
                const href = a.getAttribute('href') || '';
                if (!/^\/@[\w.-]+$/i.test(href)) return;
                const wrap = a.parentElement;
                if (!wrap || wrap.closest('a, button, input, textarea')) return;
                let p = wrap.previousSibling;
                while (p && p.nodeType === 1 && !(p.textContent || '').trim()) p = p.previousSibling;
                if (!p) return;
                const hostText = (p.nodeType === 3 ? p.nodeValue : p.textContent || '').trim();
                const hm = hostText.match(/(https?:\/\/(?:xn--d1ah4a\.com|итд\.com))\/?\s*$/i);
                if (!hm) return;
                const hostURL = hm[1];
                let n = wrap.nextSibling;
                while (n && n.nodeType === 1 && !(n.textContent || '').trim()) n = n.nextSibling;
                let postPath = '';
                if (n) {
                    const postText = (n.nodeType === 3 ? n.nodeValue : n.textContent || '');
                    const pm = postText.match(JOIN_PATH_RE);
                    if (pm) postPath = pm[1];
                }
                const full = hostURL + href + postPath;
                const link = document.createElement('a');
                link.href = full;
                link.textContent = full;
                link.className = 'vp-joined-link';
                link.dataset.vpJoined = '1';
                link.target = '_blank';
                link.rel = 'noopener';
                const cutNode = (node, pattern, isLeft) => {
                    if (node.nodeType === 3) {
                        const t = node.nodeValue || '';
                        if (isLeft) {
                            const idx = t.search(pattern);
                            if (idx >= 0) node.nodeValue = t.slice(0, idx);
                        } else {
                            const mm = t.match(pattern);
                            if (mm) node.nodeValue = t.slice((mm.index || 0) + mm[0].length);
                        }
                        return node.nodeValue.trim() ? node : (node.remove(), null);
                    }
                    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
                    let tn;
                    while ((tn = walker.nextNode())) {
                        if (isLeft) {
                            const idx = tn.nodeValue.search(pattern);
                            if (idx >= 0) tn.nodeValue = tn.nodeValue.slice(0, idx);
                        } else {
                            const mm = tn.nodeValue.match(pattern);
                            if (mm) tn.nodeValue = tn.nodeValue.slice((mm.index || 0) + mm[0].length);
                        }
                    }
                    if (!node.textContent.trim()) { node.remove(); return null; }
                    return node;
                };
                cutNode(p, /https?:\/\/(?:xn--d1ah4a\.com|итд\.com)\/?\s*$/i, true);
                if (n) cutNode(n, JOIN_PATH_RE, false);
                wrap.replaceWith(link);
                fixed++;
            });
            return fixed;
        }
        addCss('.vp-joined-link { color: var(--link-color); text-decoration: none; font-weight: 500; word-break: break-all; }');
        const URL_POST_RE = /https?:\/\/(?:xn--d1ah4a\.com|итд\.com)\/@[\w.-]+(?:\/(?:post|comment)\/[0-9a-f-]+)?/gi;
        function linkifyProfilePosts() {
            const root = document.getElementById('root');
            if (!root) return 0;
            let fixed = 0;
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            const todo = [];
            let node;
            while ((node = walker.nextNode())) {
                const text = node.nodeValue;
                if (!text || text.length < 20) continue;
                if (!/(xn--d1ah4a\.com|итд\.com)\/@/.test(text)) continue;
                const host = node.parentElement;
                if (!host) continue;
                if (host.closest('a, button, input, textarea, .vp-joined-link, script, style')) continue;
                todo.push(node);
            }
            for (const tn of todo) {
                const text = tn.nodeValue;
                const frag = document.createDocumentFragment();
                let last = 0;
                URL_POST_RE.lastIndex = 0;
                let m;
                while ((m = URL_POST_RE.exec(text))) {
                    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
                    const a = document.createElement('a');
                    a.href = m[0];
                    a.textContent = m[0];
                    a.className = 'vp-joined-link';
                    a.dataset.vpJoined = '1';
                    a.target = '_blank';
                    a.rel = 'noopener';
                    frag.appendChild(a);
                    last = m.index + m[0].length;
                    fixed++;
                }
                if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
                if (fixed > 0) tn.parentNode.replaceChild(frag, tn);
            }
            return fixed;
        }
        const _origScanLinks = scanLinks;
        scanLinks = function () {
            const r = _origScanLinks.apply(this, arguments);
            joinProfilePostLinks();
            linkifyProfilePosts();
            return r;
        };
        setInterval(() => { try { joinProfilePostLinks(); linkifyProfilePosts(); } catch (e) { } }, 1500);

        document.addEventListener('click', e => {
            if (e.button || !linkNodes.size || e.target.closest('a, button, input, textarea')) return;
            const l = linkAt(e.clientX, e.clientY);
            if (!l) return;
            e.preventDefault(); e.stopPropagation();
            window.open(l.url, '_blank', 'noopener');
        }, true);
        let linkHover = null;
        document.addEventListener('mousemove', e => {
            if (!linkNodes.size) return;
            const el = linkAt(e.clientX, e.clientY) ? e.target : null;
            if (el === linkHover) return;
            if (linkHover) linkHover.style.cursor = '';
            linkHover = el;
            if (el) el.style.cursor = 'pointer';
        }, { passive: true });

        let bannerQueued = false;
        function bannerDepth() {
            bannerQueued = false;
            const banner = siteEl('banner');
            const img = banner && banner.querySelector(':scope > img[alt="Banner"]');
            if (!img || bannerEdit.img) return;
            bannerVideoSync();
            if (!banner.classList.contains('vp-depth')) banner.classList.add('vp-depth');
            const r = banner.getBoundingClientRect();
            if (r.bottom < -40 || r.top > innerHeight) return;
            const past = Math.max(0, -r.top);
            const glassEl = bannerGlassEl(banner), glass = !bannerNoGlass && glassEl;
            const tf = '', op = String(Math.max(.25, 1 - past / (r.height * 1.4)).toFixed(2));
            for (const el of [img, banner.querySelector(':scope > .vp-banner-video'), glass].filter(Boolean)) {
                if (el.style.transform !== tf) el.style.transform = tf;
                if (el.style.opacity !== op) el.style.opacity = op;
            }
            const bar = banner.querySelector(':scope > .' + SELECTORS.bannerButtons);
            if (bar) {
                const pane = glass ? [glass, glass.firstElementChild].filter(e => e && e.offsetWidth > banner.offsetWidth / 2) : [];
                const top = Math.max(img.getBoundingClientRect().top, ...pane.map(e => e.getBoundingClientRect().top));
                const off = Math.max(0, Math.round(top - r.top)) + 'px';
                if (bar.style.getPropertyValue('--vp-bar-top') !== off) bar.style.setProperty('--vp-bar-top', off);
            }
        }
        addEventListener('scroll', () => { if (!bannerQueued) { bannerQueued = true; requestAnimationFrame(bannerDepth); } }, { capture: true, passive: true });
        onDom(function bannerDepthDom() { bannerDepth(); });

        const BANNER_GLASS_SEL = ':scope > [aria-label="Стекло"], :scope > [aria-label="Разбитое стекло"]';
        const bannerGlassEls = b => [...b.querySelectorAll(BANNER_GLASS_SEL)];
        const bannerGlassEl = b => bannerGlassEls(b).find(e => e.getBoundingClientRect().width > 0) || bannerGlassEls(b)[0] || null;
        let bannerNoGlass = GM_getValue('bannerGlassOff', false), bannerNoStickers = GM_getValue('bannerStickersOff', false);
        document.documentElement.classList.toggle('vp-no-glass', bannerNoGlass);
        document.documentElement.classList.toggle('vp-no-banner-stickers', bannerNoStickers);
        const BANNER_FX = [
            { cls: 'vp-banner-glass', find: b => bannerGlassEls(b).length > 0, key: 'bannerGlassOff', html: 'vp-no-glass',
                get: () => bannerNoGlass, set: v => { bannerNoGlass = v; }, titles: ['Убрать стекло с баннера', 'Вернуть стекло на баннер'],
                icon: svgIcon('<rect x="3" y="5" width="18" height="14" rx="4"/><path d="M7.5 12.5l4-4M7.5 16l7.5-7.5"/>', 20) },
            { cls: 'vp-banner-stickers', find: b => { const d = b.querySelector(':scope > [aria-label^="Оформление профиля"]'); return d && (d.firstElementChild || bannerNoStickers) ? d : null; },
                key: 'bannerStickersOff', html: 'vp-no-banner-stickers', get: () => bannerNoStickers, set: v => { bannerNoStickers = v; },
                titles: ['Скрыть стикеры на баннере', 'Показать стикеры на баннере'],
                icon: svgIcon('<path d="M15 3H7a4 4 0 0 0-4 4v10a4 4 0 0 0 4 4h6l8-8V7a4 4 0 0 0-4-4z"/><path d="M13 21v-4a4 4 0 0 1 4-4h4"/>', 20) }
        ];
        function bannerFx() {
            const banner = siteEl('banner'), row = siteEl('bannerButtons');
            for (const fx of BANNER_FX) {
                let btn = document.querySelector('.' + fx.cls);
                const want = row && banner && bannerBtns.draw && fx.find(banner);
                if (!want) { if (btn) btn.remove(); continue; }
                if (!btn || btn.parentElement !== row) {
                    if (btn) btn.remove();
                    btn = bannerButton('vp-banner-fx ' + fx.cls, '', fx.icon);
                    btn.onclick = e => {
                        e.stopPropagation();
                        const v = !fx.get();
                        fx.set(v);
                        GM_setValue(fx.key, v);
                        document.documentElement.classList.toggle(fx.html, v);
                        bannerFx();
                        bannerDepth();
                    };
                    row.insertBefore(btn, row.querySelector('.' + SELECTORS.bannerDelete));
                }
                const off = fx.get();
                btn.classList.toggle('vp-off', off);
                if (btn.title !== fx.titles[+off]) btn.title = fx.titles[+off];
            }
            let vb = document.querySelector('.vp-banner-vid');
            const mine = myUsername && (location.pathname.match(/^\/@([\w.]+)\/?$/) || [])[1];
            if (!(row && banner && bannerBtns.draw && mine && mine.toLowerCase() === myUsername.toLowerCase())) { if (vb) vb.remove(); return; }
            if (!vb || vb.parentElement !== row) {
                if (vb) vb.remove();
                vb = bannerButton('vp-banner-fx vp-banner-vid', '', svgIcon('<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10 5-3v10l-5-3z"/>', 20));
                vb.onclick = e => { e.stopPropagation(); bannerVideoPick(); };
                row.insertBefore(vb, row.querySelector('.' + SELECTORS.bannerDelete));
            }
            const has = !!bannerVideoOwn(), t = bannerVideoBusy ? 'Видео загружается…' : has ? 'Убрать видео с баннера' : 'Видео в баннер — его видят те, у кого стоит ИТД X';
            vb.classList.toggle('vp-on', has);
            vb.classList.toggle('vp-busy', bannerVideoBusy);
            if (vb.title !== t) vb.title = t;
        }
        onDom(bannerFx);
        document.addEventListener('click', e => {
            if (matchMedia('(hover: hover) and (pointer: fine)').matches || !e.target.closest) return;
            const banner = e.target.closest('.' + SELECTORS.banner), open = document.querySelector('.vp-banner.vp-bar-open');
            if (open && open !== banner) open.classList.remove('vp-bar-open');
            if (!banner || banner.classList.contains('vp-banner-editing') || !banner.querySelector(':scope > .' + SELECTORS.bannerButtons)) return;
            if (e.target.closest('.' + SELECTORS.bannerButtons)) banner.classList.remove('vp-bar-open');
            else banner.classList.toggle('vp-bar-open');
        }, true);
        function bannerVideoWant() {
            const m = location.pathname.match(/^\/@([\w.]+)\/?$/);
            if (!m) return '';
            if (myUsername && m[1].toLowerCase() === myUsername.toLowerCase()) return bannerVideoOwn();
            return showLooks ? bannerVideoGuest : '';
        }
        function bannerVideoSync() {
            const banner = siteEl('banner'), img = banner && banner.querySelector(':scope > img[alt="Banner"]');
            let v = document.querySelector('.vp-banner-video');
            const want = img && !bannerEdit.img && bannerVideoWant();
            if (!want) { if (v) v.remove(); return; }
            const src = 'https://cdn.xn--d1ah4a.com/' + want;
            if (!v || v.parentElement !== banner) {
                if (v) v.remove();
                v = document.createElement('video');
                v.className = 'vp-banner-video';
                v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
                v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
                v.addEventListener('error', () => v.classList.add('vp-fail'));
                v.addEventListener('playing', () => v.classList.add('vp-live'));
                img.after(v);
            }
            const box = `left: ${img.offsetLeft}px; top: ${img.offsetTop}px; width: ${img.offsetWidth}px; height: ${img.offsetHeight}px; border-radius: ${getComputedStyle(img).borderRadius};`;
            if (v.dataset.box !== box) { v.dataset.box = box; v.style.cssText = box + (img.style.transform ? ` transform: ${img.style.transform};` : ''); }
            if (v.getAttribute('src') !== src) { v.classList.remove('vp-fail', 'vp-live'); v.src = src; v.play().catch(() => { }); }
        }
        onDom(bannerVideoSync);
        function bannerVideoPick() {
            if (bannerVideoBusy) return;
            if (bannerVideoOwn()) {
                GM_setValue(acctKey('vp_banner_video'), '');
                publishLook();
                bannerFx();
                bannerVideoSync();
                return;
            }
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'video/mp4,video/webm,video/quicktime';
            input.onchange = async () => {
                const f = input.files && input.files[0];
                if (!f) return;
                if (!/^video\//.test(f.type)) { alert('Нужен видеофайл: mp4, webm или mov'); return; }
                if (f.size > VIDEO_UP_MAX) { alert('Видео больше 30 МБ — возьми покороче или сожми'); return; }
                bannerVideoBusy = true;
                bannerFx();
                try {
                    const path = await uploadVideo(new File([f], f.name || 'banner.mp4', { type: f.type }));
                    GM_setValue(acctKey('vp_banner_video'), path);
                    publishLook();
                    bannerVideoSync();
                } catch (e) { logErr('видео в баннер', e); alert('Не вышло загрузить видео: ' + (e && e.message || e)); }
                finally { bannerVideoBusy = false; bannerFx(); }
            };
            input.click();
        }
        addCss(`
        html.vp-no-glass .vp-banner > [aria-label="Стекло"], html.vp-no-glass .vp-banner > [aria-label="Разбитое стекло"] { display: none !important; }
        html.vp-no-banner-stickers .vp-banner > [aria-label^="Оформление профиля"] { display: none !important; }
        .vp-banner-fx { position: relative; }
        .vp-banner-vid.vp-on { color: var(--vp-accent); }
        .vp-banner-vid.vp-busy { opacity: .5; pointer-events: none; animation: vpBvPulse 1s ease-in-out infinite alternate; }
        @keyframes vpBvPulse { to { opacity: .25; } }
        .vp-banner-video { position: absolute; object-fit: cover; pointer-events: none; opacity: 0; transition: opacity .4s; }
        .vp-banner-video.vp-live { opacity: 1; }
        .vp-banner-video.vp-fail { display: none; }
        .vp-banner-fx.vp-off { opacity: .55; }
        .vp-banner-fx.vp-off::after { content: ''; position: absolute; left: 50%; top: 50%; width: 22px; height: 2px; border-radius: 2px;
            background: currentColor; transform: translate(-50%, -50%) rotate(-45deg); pointer-events: none; }
        `);

