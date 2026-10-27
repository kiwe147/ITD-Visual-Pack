        const designStyle = addCss(`
        @property --vp-tint { syntax: '<number>'; inherits: false; initial-value: 0.3; }
        .vp-emoji-tint {
            background-image: linear-gradient(105deg,
                rgba(var(--vp-emoji), var(--vp-tint)) 0%,
                rgba(var(--vp-emoji), calc(var(--vp-tint) * 0.4)) 45%,
                rgba(var(--vp-emoji), calc(var(--vp-tint) * 0.1)) 100%) !important;
            --vp-edge-a: rgba(var(--vp-emoji), .22); --vp-edge-b: rgba(var(--vp-emoji), .22);
            transition: --vp-tint 0.25s ease !important;
        }
        .vp-emoji-tint:not(article) { border: 1px solid rgba(var(--vp-emoji), 0.22) !important; }
        .vp-ava-tint { position: relative; isolation: isolate; }
        .vp-ava-tint-bg { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; z-index: -1; pointer-events: none; }
        .vp-ava-tint-bg > div {
            position: absolute; inset: -30%; background: left center / cover no-repeat; filter: blur(40px) saturate(1.8) brightness(.75);
            opacity: .35; transition: opacity 0.25s ease;
            -webkit-mask-image: linear-gradient(105deg, #000 20%, rgba(0, 0, 0, .4) 50%, rgba(0, 0, 0, .1) 80%);
            mask-image: linear-gradient(105deg, #000 20%, rgba(0, 0, 0, .4) 50%, rgba(0, 0, 0, .1) 80%);
        }
        @media (hover: hover) {
            .vp-emoji-tint:hover { --vp-tint: 0.42; }
            .vp-emoji-tint:not(article):hover { border-color: rgba(var(--vp-emoji), 0.4) !important; }
            .vp-ava-tint:hover .vp-ava-tint-bg > div { opacity: .5; }
            html.vp-post-hl article.vp-emoji-tint:hover { --vp-edge-a: rgba(var(--vp-emoji), .55); --vp-edge-b: rgba(var(--vp-emoji), .22); }
        }
        @media (max-width: ${PHONE_MAX}px) {
            .vp-notif { border-radius: 24px !important; margin: 6px 10px !important; }
        }

        .vp-version-row { display: flex; align-items: center; gap: 6px; margin: 2px 0 0; }
        .vp-version-col { flex-direction: column; gap: 3px; margin: 0; }
        .vp-version-chip {
            font: 600 10px/1 ui-monospace, SFMono-Regular, Consolas, monospace;
            color: var(--text-secondary); letter-spacing: 0.02em;
            padding: 3px 6px; border-radius: 6px; background: var(--bg-hover, rgba(255, 255, 255, 0.08));
            cursor: pointer; position: relative; transition: color .15s ease, background-color .15s ease;
        }
        .vp-version-chip:hover { color: var(--text-primary, #fff); background: var(--block-bg-secondary, rgba(255, 255, 255, 0.14)); }
        .vp-version-chip.vp-news::after { content: ""; position: absolute; top: -3px; right: -3px; width: 7px; height: 7px;
            border-radius: 50%; background: #2a8cff; box-shadow: 0 0 0 2px var(--bg-primary, #000); }
        .vp-logo-top { display: flex; align-items: flex-start; gap: 10px; }
        .vp-logo-col { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .vp-logo-col > a { height: 36px; }
        .vp-logo-col .vp-version-row { position: relative; }
        .vp-logo-col .itd-update-sidebar-btn { position: absolute; left: calc(100% + 6px); top: 50%; translate: 0 -50%; }
        .vp-tab-ico { display: none; }
        @media (max-width: 430px) {
            .vp-feed-bar .vp-tabs { min-width: 0; }
            .vp-feed-bar .vp-tabs > button { font-size: 0 !important; display: inline-flex; align-items: center; justify-content: center; }
            .vp-feed-bar .vp-tabs > button .vp-tab-ico { display: inline-flex; }
            .vp-feed-bar .vp-tabs > button .vp-tab-ico svg { width: 22px; height: 22px; }
        }
        .vp-logo-top > :not(.vp-logo-col) { height: 36px; display: inline-flex; align-items: center; }

        .vp-news-back { position: fixed; inset: 0; z-index: 10050; background: rgba(0, 0, 0, .5); display: flex;
            align-items: center; justify-content: center; padding: 16px; animation: vpNewsFade .18s ease;
            backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
        html.vp-light .vp-news-back { background: rgba(0, 0, 0, .25); }
        .vp-news-box { width: min(780px, 100%); max-height: min(82vh, 900px); display: flex; flex-direction: column; overflow: hidden;
            background: var(--modal-bg, var(--block-bg)); color: var(--text-primary, #fff); border-radius: 28px;
            border: 1px solid var(--border-color, rgba(255, 255, 255, .12)); box-shadow: 0 24px 64px rgba(0, 0, 0, .45);
            backdrop-filter: var(--vp-glass-filter, none); -webkit-backdrop-filter: var(--vp-glass-filter, none);
            animation: vpNewsIn .22s cubic-bezier(.2, .8, .2, 1); }
        .vp-news-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 16px 24px;
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, .1)); }
        .vp-news-head b { font-size: 20px; font-weight: 700; }
        .vp-news-x { width: 40px; height: 40px; border-radius: 50%; border: 0; cursor: pointer; display: flex; align-items: center;
            justify-content: center; background: var(--block-bg-secondary, rgba(255, 255, 255, .1)); color: var(--text-primary, #fff); }
        .vp-news-list { overflow-y: auto; padding: 8px 28px 20px; overscroll-behavior: contain; }
        .vp-news-ver { padding: 18px 0; border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, .1)); }
        .vp-news-ver:last-child { border-bottom: 0; }
        .vp-news-tag { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; color: var(--text-secondary); font-size: 15px; }
        .vp-news-tag span { padding: 5px 12px; border-radius: 8px; font-weight: 600; color: #2a8cff; background: rgba(42, 140, 255, .14); }
        .vp-news-ver ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .vp-news-ver li { position: relative; padding-left: 24px; font-size: 16px; line-height: 1.45; }
        .vp-news-ver li::before { content: ""; position: absolute; left: 2px; top: .6em; width: 6px; height: 6px; border-radius: 50%; background: #2a8cff; }
        @keyframes vpNewsFade { from { opacity: 0; backdrop-filter: blur(0); -webkit-backdrop-filter: blur(0); } }
        @keyframes vpNewsIn { from { opacity: 0; transform: translateY(12px) scale(.98); } }
        @media (prefers-reduced-motion: reduce) { .vp-news-back, .vp-news-box { animation: none; } }
        .itd-update-sidebar-btn {
            display: inline-flex; align-items: center; gap: 4px; border: 0; cursor: pointer;
            font-family: inherit; font-size: 10px; font-weight: 700; line-height: 1; color: #fff; white-space: nowrap;
            padding: 4px 8px; border-radius: 999px;
            background: linear-gradient(135deg, #2a8cff, #6a5bff);
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.14) inset, 0 4px 14px rgba(60, 120, 255, 0.35);
            transition: transform 0.15s ease, filter 0.15s ease;
            animation: vpUpdatePulse 2.6s ease-in-out infinite;
        }
        .itd-update-sidebar-btn:hover { transform: translateY(-1px); filter: brightness(1.12); }
        .itd-update-sidebar-btn svg { width: 11px; height: 11px; }
        @keyframes vpUpdatePulse {
            0%, 100% { box-shadow: 0 0 0 1px rgba(255,255,255,.14) inset, 0 4px 14px rgba(60,120,255,.35); }
            50% { box-shadow: 0 0 0 1px rgba(255,255,255,.14) inset, 0 4px 22px rgba(60,120,255,.6); }
        }

        .vp-nav-link:focus-visible, .vp-post-action:focus-visible, .vp-pill-btn:focus-visible,
        .nick-style-option:focus-visible, .settings-option:focus-visible {
            outline: 2px solid var(--vp-accent) !important; outline-offset: 2px !important;
        }
        .vp-nav-link .vp-nav-icon { transition: color 0.2s ease, filter 0.2s ease; }

        @media (prefers-reduced-motion: reduce) {
            .vp-post, .vp-sidebar, .vp-sidebar-right, .vp-notif, .itd-update-sidebar-btn { animation: none !important; }
            .vp-emoji-tint { transition: none !important; }
        }
    `);

        let msgsOpen = false;
        let galOpen = false;
        const navPath = s => { try { return decodeURIComponent(s).toLowerCase(); } catch (e) { return String(s).toLowerCase(); } };
        function markActiveNav() {
            const path = navPath(location.pathname);
            document.querySelectorAll('.' + SELECTORS.navLink).forEach(a => {
                const href = a.getAttribute('href') || '', hl = navPath(href);
                const active = msgsOpen ? href === '#' : galOpen ? href === '#gallery'
                    : href.startsWith('/') && (hl === path || (hl !== '/' && path.startsWith(hl + '/')));
                a.classList.toggle('vp-active', active);
            });
            msgsNavLook();
        }
        function msgsNavLook() {
            const links = [...document.querySelectorAll('.' + SELECTORS.navLink)];
            if (!msgsOpen && !galOpen) { links.forEach(a => { if (a.classList.contains('vp-site-cur')) a.classList.remove('vp-site-cur'); }); return; }
            const path = navPath(location.pathname);
            const cur = links.find(a => { const h = navPath(a.getAttribute('href') || ''); return h.startsWith('/') && (h === path || (h !== '/' && path.startsWith(h + '/'))); });
            const other = links.find(a => a !== cur && !/^#/.test(a.getAttribute('href') || '') && navPath(a.getAttribute('href')) !== path);
            const nav = (cur || other) && (cur || other).closest('nav');
            if (!nav || !other || (cur && cur.classList.contains('vp-site-cur'))) return;
            const look = (a, k) => { const g = getComputedStyle(a); nav.style.setProperty(`--vp-${k}-c`, g.color); nav.style.setProperty(`--vp-${k}-o`, g.opacity); nav.style.setProperty(`--vp-${k}-b`, g.backgroundColor); };
            look(other, 'off');
            look(cur || other, 'on');
            if (!cur) { nav.style.setProperty('--vp-on-c', getComputedStyle(document.body).color); nav.style.setProperty('--vp-on-o', '1'); }
            if (cur) cur.classList.add('vp-site-cur');
        }
        markActiveNav();
        onDom(markActiveNav);
        addEventListener('popstate', markActiveNav);

        const tabSlide = (() => {
            const MS = 560, PHONE_MS = 400, EASE = 'cubic-bezier(.25, .8, .25, 1)', MAX_WAIT = 900, SETTLE = 90;
            addCss(`
            html.vp-sw .${SELECTORS.sidebar} ~ :not(aside):not(.vp-sw-stage), html.vp-sw [data-vp-sw] { visibility: hidden !important; }
            html.vp-sw .vp-msgs.vp-open, html.vp-sw .vp-gal { animation-duration: 1ms !important; }
            html.vp-sw .vp-msgs, html.vp-sw .vp-gal-card { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
            html.vp-sw-pin aside.${SELECTORS.sidebar} { left: var(--vp-pin-side) !important; }
            html.vp-sw-pin .vp-rail { left: var(--vp-pin-rail) !important; width: var(--vp-pin-railw) !important; }
            .vp-sw-stage { position: fixed; z-index: 3; overflow: hidden; pointer-events: none; contain: layout paint; }
            .vp-sw-ghost { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: hidden; will-change: transform; }`);
            const phone = () => innerWidth <= PHONE_MAX;
            const enabled = () => GM_getValue('tabSlide', true) && !matchMedia('(prefers-reduced-motion: reduce)').matches
                && (phone() || matchMedia('(hover: hover) and (pointer: fine)').matches);
            const hrefOf = a => a.getAttribute('href') || '';
            const isRoute = a => /^\/(?!\/)/.test(hrefOf(a));
            const curLink = () => F('navLink').find(a => {
                const h = hrefOf(a);
                return isRoute(a) && (h === location.pathname || (h !== '/' && location.pathname.startsWith(h + '/')));
            });
            const centerOf = () => {
                if (phone()) {
                    const nav = F('nav')[0], root = nav && nav.parentElement && nav.parentElement.parentElement;
                    return root && [...root.children].find(c => !c.contains(nav) && !c.classList.contains('vp-sw-stage') && c.getBoundingClientRect().width > 300) || null;
                }
                const side = document.querySelector('aside.' + SELECTORS.sidebar);
                const box = side && side.parentElement;
                return box && [...box.children].find(c => c.tagName !== 'ASIDE' && !c.classList.contains('vp-sw-stage') && c.getBoundingClientRect().width > 300) || null;
            };
            const modalUp = () => F('modal').some(m => { const r = m.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(m).visibility !== 'hidden'; });
            const sceneNow = () => {
                const g = document.querySelector('.vp-gal:not(.vp-sw-stage *)'), m = document.querySelector('.vp-msgs.vp-open:not(.vp-sw-stage *)');
                if (g) return { el: g, kind: 'gal' };
                if (m) return { el: m, kind: 'msg' };
                const c = centerOf();
                return c && { el: c, kind: 'route' };
            };
            const linkOf = kind => kind === 'gal' ? F('navLink').find(a => a.classList.contains('vp-gal-nav'))
                : kind === 'msg' ? F('navLink').find(a => hrefOf(a) === '#') : curLink();
            const panels = () => {
                const side = document.querySelector('aside.' + SELECTORS.sidebar), rail = document.querySelector('.vp-rail.vp-on');
                const sr = side && side.getBoundingClientRect(), rr = rail && rail.getBoundingClientRect();
                return { side: sr && sr.width ? side : null, sl: sr ? sr.left : 0, rail: rr && rr.width ? rail : null, rl: rr ? rr.left : 0, rw: rr ? rr.width : 0 };
            };
            const trim = (src, dst, hi) => {
                const s = src.children, d = dst.children;
                for (let i = 0; i < s.length; i++) {
                    const r = s[i].getBoundingClientRect();
                    if (r.bottom >= -80 && r.top <= hi + 80) {
                        if (r.height > 500) trim(s[i], d[i], hi);
                        continue;
                    }
                    if (r.height < 120 || ['fixed', 'absolute'].includes(getComputedStyle(s[i]).position)) continue;
                    d[i].replaceChildren();
                    d[i].style.cssText += `;height:${r.height}px;min-height:${r.height}px;box-sizing:border-box;overflow:hidden;visibility:hidden`;
                }
            };
            const freeze = (el, scrolls) => {
                const g = el.cloneNode(true);
                g.removeAttribute('data-vp-sw');
                if (phone()) {
                    const all = el.querySelectorAll('*'), copy = g.querySelectorAll('*');
                    all.forEach((n, i) => {
                        const p1 = n.parentElement, p2 = p1 && p1.parentElement, p3 = p2 && p2.parentElement;
                        if ((p1 !== el && p2 !== el && p3 !== el) || getComputedStyle(n).position !== 'sticky') return;
                        const r = n.getBoundingClientRect(), was = n.style.position;
                        n.style.position = 'static';
                        const home = n.getBoundingClientRect().top;
                        n.style.position = was;
                        if (Math.abs(r.top - home) > 0.5) copy[i].style.cssText += `;position:relative;top:${r.top - home}px`;
                    });
                }
                const vs = el.querySelectorAll('video'), gs = g.querySelectorAll('video');
                vs.forEach((v, i) => {
                    gs[i].removeAttribute('autoplay');
                    if (v.readyState < 2 || !v.videoWidth) return;
                    try {
                        const c = document.createElement('canvas');
                        c.width = v.videoWidth; c.height = v.videoHeight;
                        c.getContext('2d').drawImage(v, 0, 0);
                        c.className = v.className; c.style.cssText = v.style.cssText;
                        c.style.objectFit = getComputedStyle(v).objectFit;
                        gs[i].replaceWith(c);
                    } catch (e) { }
                });
                const cs = el.querySelectorAll('canvas'), gc = g.querySelectorAll('canvas');
                cs.forEach((c, i) => { try { gc[i].getContext('2d').drawImage(c, 0, 0); } catch (e) { } });
                const run = el.getAnimations ? el.getAnimations({ subtree: true }).filter(a => a.animationName && a.effect && a.effect.target && !a.effect.pseudoElement) : [];
                if (run.length) {
                    const targets = new Set(run.map(a => a.effect.target)), found = new Map(), B = g.querySelectorAll('*');
                    el.querySelectorAll('*').forEach((n, i) => { if (targets.has(n)) found.set(n, B[i]); });
                    found.set(el, g);
                    const per = new Map();
                    run.forEach(a => { const n = a.effect.target; per.set(n, (per.get(n) || []).concat(a)); });
                    per.forEach((list, n) => {
                        const c = found.get(n);
                        if (!c) return;
                        const names = getComputedStyle(n).animationName.split(',').map(s => s.trim());
                        const delays = names.map(() => '0s');
                        list.forEach(a => { const k = names.indexOf(a.animationName); if (k >= 0) delays[k] = (a.effect.getTiming().delay - (a.currentTime || 0)) + 'ms'; });
                        c.style.animationDelay = delays.join(', ');
                        c.style.animationPlayState = 'paused';
                    });
                }
                const fr = el.querySelectorAll('iframe'), gf = g.querySelectorAll('iframe');
                fr.forEach((f, i) => {
                    const r = f.getBoundingClientRect(), s = document.createElement('div');
                    s.className = f.className;
                    s.style.cssText = `display:block;overflow:hidden;background:transparent !important;width:${r.width}px;height:${r.height}px`;
                    try {
                        const d = f.contentDocument;
                        if (d && d.body && d.body.innerText.trim().length > 20) {
                            const sh = s.attachShadow({ mode: 'open' }), css = document.createElement('style');
                            const bs = getComputedStyle(d.body);
                            css.textContent = [...d.styleSheets].map(sheet => { try { return [...sheet.cssRules].map(x => x.cssText).join(' '); } catch (e) { return ''; } }).join(' ');
                            const box = document.createElement('div');
                            box.className = d.body.className;
                            box.style.cssText = `width:100%;color:${bs.color};font:${bs.font};background:transparent`;
                            const inner = document.createElement('div');
                            inner.style.transform = `translateY(${-d.documentElement.scrollTop}px)`;
                            inner.innerHTML = d.body.innerHTML;
                            inner.querySelectorAll('script').forEach(x => x.remove());
                            box.appendChild(inner);
                            sh.append(css, box);
                        }
                    } catch (e) { }
                    gf[i].replaceWith(s);
                });
                if (scrolls) {
                    const a = el.querySelectorAll('.vp-gal-body, .vp-msgs-list, .vp-msgs-feed'), b = g.querySelectorAll('.vp-gal-body, .vp-msgs-list, .vp-msgs-feed');
                    g._sc = [...a].map((n, i) => [b[i], n.scrollTop]).filter(p => p[1] > 0);
                }
                trim(el, g, innerHeight);
                g.querySelectorAll('img').forEach(i => { i.loading = 'eager'; i.decoding = 'sync'; });
                g.setAttribute('inert', '');
                return g;
            };
            const layer = (el, cls) => {
                const r = el.getBoundingClientRect();
                const fixed = getComputedStyle(el).position === 'fixed';
                const copy = freeze(el, fixed);
                copy.style.cssText += fixed
                    ? `;position:absolute;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;right:auto;bottom:auto;margin:0;transform:none;animation:none;z-index:auto`
                    : `;position:absolute;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;margin:0;transform:none`;
                const wrap = document.createElement('div');
                wrap.className = 'vp-sw-ghost ' + cls;
                wrap.appendChild(copy);
                wrap._sc = copy._sc;
                return wrap;
            };
            const unpin = () => document.documentElement.classList.remove('vp-sw-pin');
            let cur = null;
            const end = () => {
                if (!cur) return;
                const c = cur;
                cur = null;
                clearTimeout(c.guard);
                cancelAnimationFrame(c.raf);
                if (c.mo) c.mo.disconnect();
                c.anims.forEach(a => { try { a.cancel(); } catch (e) { } });
                (c.moves || []).forEach(([e, , t]) => { e.style.transform = t; });
                if (c.hold) c.hold.el.style.opacity = c.hold.opacity;
                c.stage.remove();
                unpin();
                document.documentElement.classList.remove('vp-sw');
                document.querySelectorAll('[data-vp-sw]').forEach(e => e.removeAttribute('data-vp-sw'));
            };
            const safe = fn => { try { fn(); } catch (e) { end(); } };
            const frames = (n, fn) => { const step = k => { cur && (k ? requestAnimationFrame(() => step(k - 1)) : fn()); }; step(n); };
            const prepare = c => {
                unpin();
                (c.moves || []).forEach(([e, , t]) => { e.style.transform = t; });
                const now = panels();
                c.moves = [];
                if (c.pre.side && now.side && Math.abs(c.pre.sl - now.sl) > 1) c.moves.push([now.side, c.pre.sl - now.sl, now.side.style.transform]);
                if (c.pre.rail && now.rail && Math.abs(c.pre.rl - now.rl) > 1) c.moves.push([now.rail, c.pre.rl - now.rl, now.rail.style.transform]);
                c.moves.forEach(([e, d]) => { e.style.transform = `translateX(${d}px)`; });
            };
            const glide = c => c.moves.forEach(([e, d, t]) => {
                e.style.transform = t;
                c.anims.push(e.animate([{ transform: `translateX(${d}px)` }, { transform: 'translateX(0)' }], { duration: MS, easing: EASE }));
            });
            const run = (c, incoming) => {
                const H = c.phone ? innerWidth : innerHeight, sign = c.down ? 1 : -1, ax = c.phone ? 'X' : 'Y', ms = c.phone ? PHONE_MS : MS;
                glide(c);
                incoming.style.opacity = c.hold ? c.hold.opacity : '';
                c.anims.push(
                    c.ghost.animate([{ transform: `translate${ax}(0)` }, { transform: `translate${ax}(${sign * H}px)` }], { duration: ms, easing: EASE, fill: 'forwards' }),
                    incoming.animate([{ transform: `translate${ax}(${-sign * H}px)` }, { transform: `translate${ax}(0)` }], { duration: ms, easing: EASE, fill: c.hold ? 'none' : 'forwards' })
                );
                Promise.all(c.anims.map(x => x.finished)).then(() => {
                    if (cur !== c) return;
                    document.documentElement.classList.remove('vp-sw');
                    if (c.hold) return frames(2, () => end());
                    frames(2, () => {
                        const fade = c.stage.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-out', fill: 'forwards' });
                        c.anims.push(fade);
                        fade.finished.then(() => { if (cur === c) end(); }, () => { if (cur === c) end(); });
                    });
                }, () => { if (cur === c) end(); });
            };
            const go = c => {
                const fresh = centerOf();
                if (c.mo) c.mo.disconnect();
                if (!fresh) return end();
                const t1 = performance.now();
                const framesReady = () => [...fresh.querySelectorAll('iframe')].filter(f => { const r = f.getBoundingClientRect(); return r.width > 300 && r.height > 200; }).every(f => { try { return f.contentDocument && f.contentDocument.body && f.contentDocument.body.innerText.trim().length > 20; } catch (e) { return true; } });
                const build = () => {
                    if (cur !== c) return;
                    if (!framesReady() && performance.now() - t1 < 1200) { c.raf = requestAnimationFrame(() => safe(build)); return; }
                    place(c, fresh);
                };
                build();
            };
            const place = (c, fresh) => {
                prepare(c);
                const wrap = layer(fresh, 'vp-sw-new');
                wrap.style.opacity = '.01';
                c.stage.insertBefore(wrap, c.ghost);
                const imgs = [...wrap.querySelectorAll('img')].map(i => i.decode ? i.decode().catch(() => { }) : null);
                Promise.race([Promise.all(imgs), new Promise(r => setTimeout(r, 300))]).then(() => frames(2, () => safe(() => run(c, wrap))));
            };
            const arrive = (c, el) => {
                if (!c || cur !== c) return;
                safe(() => {
                    if (!el || !el.isConnected) return end();
                    c.hold = { el, opacity: el.style.opacity };
                    el.style.opacity = '.01';
                    const settle = (k, last) => {
                        if (cur !== c) return;
                        prepare(c);
                        const key = c.moves.map(m => Math.round(m[1])).join(',') + '|' + panels().sl;
                        if (key === last || k >= 8) return frames(2, () => safe(() => run(c, el)));
                        c.raf = requestAnimationFrame(() => safe(() => settle(k + 1, key)));
                    };
                    settle(0, null);
                });
            };
            const start = (down, scene, mode) => {
                end();
                const stage = document.createElement('div');
                stage.className = 'vp-sw-stage';
                stage.style.cssText = `left:0;right:0;top:0;height:${innerHeight}px`;
                const ghost = layer(scene.el, 'vp-sw-old');
                stage.appendChild(ghost);
                const host = document.querySelector('aside.' + SELECTORS.sidebar);
                (host && host.parentElement || document.body).appendChild(stage);
                (ghost._sc || []).forEach(([n, v]) => { n.scrollTop = v; });
                const pre = panels();
                if (mode !== 'lead' && scene.kind === 'route') {
                    const root = document.documentElement;
                    if (pre.side) root.style.setProperty('--vp-pin-side', pre.sl + 'px');
                    if (pre.rail) { root.style.setProperty('--vp-pin-rail', pre.rl + 'px'); root.style.setProperty('--vp-pin-railw', pre.rw + 'px'); }
                    root.classList.add('vp-sw-pin');
                }
                document.documentElement.classList.add('vp-sw');
                const t0 = performance.now(), path = location.pathname + location.search;
                let last = t0;
                const c = cur = { stage, ghost, down, pre, anims: [], raf: 0, guard: setTimeout(end, 4000), ov: scene.kind !== 'route', t0, phone: phone(), w: innerWidth };
                const hideLive = () => { if (!c.phone) return; const ce = centerOf(); if (ce && !ce.hasAttribute('data-vp-sw')) ce.setAttribute('data-vp-sw', ''); };
                hideLive();
                if (mode === 'lead') return c;
                c.glide = scene.kind !== 'route';
                const mo = new MutationObserver(ms => {
                    if (ms.every(m => [...m.addedNodes, ...m.removedNodes].every(n => n.classList && n.classList.contains('vp-sw-stage')))) return;
                    last = performance.now();
                    if (location.pathname + location.search !== path) c.mut = true;
                });
                mo.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
                c.mo = mo;
                const tick = () => {
                    if (cur !== c) return;
                    hideLive();
                    const now = performance.now(), moved = location.pathname + location.search !== path;
                    if (c.glide && !c.glided && !document.querySelector('.vp-gal:not(.vp-sw-stage *), .vp-msgs.vp-open:not(.vp-sw-stage *)')) {
                        c.glided = true;
                        safe(() => { prepare(c); glide(c); c.pre = panels(); c.moves = []; });
                    }
                    if (moved && c.mut && now - last > SETTLE && now - t0 > 160) return safe(() => go(c));
                    if (mode === 'now' && now - last > SETTLE && now - t0 > 120) return safe(() => go(c));
                    if (now - t0 > MAX_WAIT) return moved ? safe(() => go(c)) : end();
                    c.raf = requestAnimationFrame(tick);
                };
                c.raf = requestAnimationFrame(tick);
                return c;
            };
            const lead = kind => {
                if (!enabled() || modalUp()) return null;
                const s = sceneNow();
                if (!s || s.kind === kind) return null;
                const links = F('navLink'), to = links.indexOf(linkOf(kind)), from = links.indexOf(linkOf(s.kind));
                if (to < 0 || from < 0 || to === from) return null;
                return start(to < from, s, 'lead');
            };
            document.addEventListener('click', e => {
                if (e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || !enabled()) return;
                const a = e.target.closest && e.target.closest('a[href]');
                if (!a || a.target === '_blank' || !isRoute(a) || !a.closest('nav') || modalUp()) return;
                const s = sceneNow();
                if (!s) return;
                const links = F('navLink'), to = links.indexOf(a), from = links.indexOf(linkOf(s.kind));
                if (to < 0 || from < 0 || to === from) return;
                start(to < from, s, s.kind !== 'route' && hrefOf(a) === location.pathname ? 'now' : 'wait');
            }, true);
            addEventListener('popstate', () => { if (cur && cur.ov && performance.now() - cur.t0 < 500) return; end(); });
            addEventListener('resize', () => { if (cur && cur.phone && innerWidth === cur.w) return; end(); });
            return { end, lead, arrive };
        })();

        const fx = addCss(`
        html.vp-glass { --vp-glass-filter: blur(18px) saturate(1.5); }
        html.vp-glass[data-theme="dark"] {
            --block-bg: rgba(28, 28, 28, .52); --block-bg-secondary: rgba(42, 42, 44, .55); --block-hover-bg: rgba(44, 44, 47, .6);
            --modal-bg: rgba(17, 17, 17, .8); --glass-bg: rgba(35, 35, 35, .5);
        }
        html.vp-glass.vp-light {
            --block-bg: rgba(255, 255, 255, .6); --block-bg-secondary: rgba(240, 240, 240, .6); --block-hover-bg: rgba(245, 245, 245, .65);
            --modal-bg: rgba(255, 255, 255, .82); --glass-bg: rgba(255, 255, 255, .55);
        }
        html.vp-glass.vp-glass-lite { --vp-glass-filter: none; }
        html.vp-glass.vp-glass-lite[data-theme="dark"] { --block-bg: rgba(28, 28, 28, .82); --block-bg-secondary: rgba(42, 42, 44, .85); }
        html.vp-glass.vp-glass-lite.vp-light { --block-bg: rgba(255, 255, 255, .85); }
        html.vp-glass[data-theme="dark"] :is(.vp-comments-sheet, .vp-float) {
            --block-bg: rgba(24, 24, 24, .9); --block-bg-secondary: rgba(38, 38, 40, .9); --block-hover-bg: rgba(44, 44, 47, .92);
            --modal-bg: rgba(17, 17, 17, .94); --glass-bg: rgba(30, 30, 30, .9);
        }
        html.vp-glass.vp-light :is(.vp-comments-sheet, .vp-float) {
            --block-bg: rgba(255, 255, 255, .92); --block-bg-secondary: rgba(240, 240, 240, .92); --block-hover-bg: rgba(245, 245, 245, .94);
            --modal-bg: rgba(255, 255, 255, .95); --glass-bg: rgba(255, 255, 255, .9);
        }
        html.vp-glass .vp-nested { background-color: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; border-radius: 18px; }
        html.vp-glass .settings-dropdown {
            backdrop-filter: var(--vp-glass-filter) !important; -webkit-backdrop-filter: var(--vp-glass-filter) !important;
        }

        .vp-nav-has-blob { position: relative; }
        .vp-nav-has-blob .vp-nav-link { position: relative; z-index: 1; transition: background-color .2s ease, opacity .2s ease !important; }
        .vp-nav-has-blob .vp-nav-link .vp-nav-icon { transition: none; }
        .vp-nav-has-blob .vp-nav-link.vp-active { background: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
        .vp-nav-has-blob > div:not(.vp-nav-blob):not(:has(a)) { opacity: 0 !important; }
        .vp-post-slot { border-bottom: none !important; }
        .vp-new-post { position: absolute !important; width: ${BUMP}px !important; height: ${BUMP}px !important; z-index: 2; margin: 0 !important;
            background: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; }
        .vp-new-post::before { display: none !important; }
        .vp-new-post { color: var(--text-secondary) !important; transition: color .2s; }
        .vp-new-post:active { color: var(--text-primary) !important; }
        nav.vp-has-bump { background: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; }
        nav.vp-has-bump::before { display: none !important; }
        .vp-bump-bg { position: absolute; left: 0; z-index: -1; pointer-events: none; overflow: visible;
            backdrop-filter: var(--vp-glass-filter, blur(16px)); -webkit-backdrop-filter: var(--vp-glass-filter, blur(16px)); }
        .vp-bump-bg .vp-bump-fill { fill: var(--glass-bg); }
        a[href^="/event"] img[src*="/portal/"], img.vp-portal-img { display: none !important; }
        .vp-nav-has-blob .vp-nav-link:has(> svg.vp-portal[data-state="live"]) { border-radius: 18px !important; background: color-mix(in srgb, #9a63ff 11%, transparent) !important; box-shadow: inset 0 0 0 1px color-mix(in srgb, #9a63ff 30%, transparent); }
        .vp-itdx-btn { background: color-mix(in srgb, var(--vp-accent) 16%, var(--block-bg)) !important;
            color: color-mix(in srgb, var(--vp-accent) 75%, #fff) !important; border-color: transparent !important;
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 40%, transparent) !important; transition: background-color .15s ease; }
        .vp-itdx-btn { display: inline-flex !important; align-items: center; justify-content: center; gap: 6px; }
        .vp-itdx-btn > svg { flex: none; }
        .vp-itdx-btn:hover { background: color-mix(in srgb, var(--vp-accent) 24%, var(--block-bg)) !important; }
        html.vp-light .vp-itdx-btn { background: color-mix(in srgb, var(--vp-accent) 12%, #fff) !important; color: color-mix(in srgb, var(--vp-accent) 80%, #000) !important; }
        .vp-nick-tail-moved { display: none !important; }
        .vp-nick-large .vp-nick-text + .mod-badge-voronoi { margin-left: 5px !important; }
        .vp-nick-large .mod-badge-voronoi, .vp-nick-large .mod-badge-verify { vertical-align: -0.08em !important; }
        :has(> .mod-badge-verify), :has(> .mod-badge-voronoi) { flex-wrap: nowrap !important; }
        [data-vp-stack] { grid-template-columns: minmax(0, 1fr) !important; row-gap: 14px !important; }
        [data-vp-stack] > * { grid-area: auto !important; grid-column: 1 / -1 !important; }
        @media (prefers-reduced-motion: reduce) { .vp-portal { animation: none !important; } }
        .vp-portal[data-state="live"] { animation: vpPortalPulse 2s ease-in-out infinite; }
        @keyframes vpPortalPulse {
            0%, 100% { filter: drop-shadow(0 0 4px rgba(144, 162, 255, .2)); }
            50% { filter: drop-shadow(0 0 16px rgb(144, 162, 255)); }
        }
        .vp-nav-blob > i { display: none; }
        .vp-nav-blob.vp-blob-row { width: 0 !important; height: 0 !important; background: none !important; box-shadow: none !important; }
        .vp-nav-blob.vp-blob-row > i { display: block; position: absolute; left: 0; top: 0; box-sizing: border-box; transform-origin: 0 50%; will-change: transform;
            background: color-mix(in srgb, var(--vp-accent) 14%, #242426);
            border: 1px solid color-mix(in srgb, var(--vp-accent) 32%, #3c3c40); transition: background-color .4s ease; }
        html.vp-light .vp-nav-blob.vp-blob-row > i { background: color-mix(in srgb, var(--vp-accent) 14%, #f0f0f2);
            border-color: color-mix(in srgb, var(--vp-accent) 32%, #d6d6da); }
        .vp-nav-blob .vp-bl { border-right: 0 !important; border-radius: 999px 0 0 999px; }
        .vp-nav-blob .vp-bm { border-left: 0 !important; border-right: 0 !important; }
        .vp-nav-blob .vp-br { border-left: 0 !important; border-radius: 0 999px 999px 0; }
        .vp-nav-blob { position: absolute; left: 0; top: 0; z-index: 0; pointer-events: none; opacity: 0;
            background: color-mix(in srgb, var(--vp-accent) 14%, var(--block-bg));
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 32%, transparent),
                0 8px 24px -10px color-mix(in srgb, var(--vp-accent) 70%, transparent);
            transition: opacity .25s ease, background-color .4s ease; }

        .vp-banner.vp-depth { background: transparent !important; overflow: hidden !important; }
        .vp-banner { isolation: isolate; }
        .vp-banner.vp-depth > img[alt="Banner"], .vp-banner.vp-depth > .vp-banner-video, .vp-banner.vp-depth > [aria-label="Стекло"], .vp-banner.vp-depth > [aria-label="Разбитое стекло"] { will-change: transform; transform-origin: 50% 50%;
            -webkit-mask-image: linear-gradient(to bottom, #000 58%, transparent); mask-image: linear-gradient(to bottom, #000 58%, transparent); }

        @property --vp-n { syntax: '<integer>'; inherits: false; initial-value: 0; }
        .vp-count { position: relative; color: transparent !important; }
        .vp-count::after { content: counter(vpn); counter-reset: vpn var(--vp-n); position: absolute; left: 0; top: 0;
            color: var(--vp-count-color); animation: vpCount .9s cubic-bezier(.2, .8, .2, 1) forwards; }
        @keyframes vpCount { from { --vp-n: 0; } to { --vp-n: var(--vp-to); } }

        @keyframes vpShimmer { 0% { background-position: 100% 0; } 55%, 100% { background-position: 0% 0; } }
        @keyframes vpGlitch {
            0%, 100% { text-shadow: 1.5px 0 rgba(255, 0, 200, .75), -1.5px 0 rgba(0, 255, 240, .75); clip-path: none; transform: none; }
            60% { text-shadow: 3px 0 rgba(255, 0, 200, .9), -3px 0 rgba(0, 255, 240, .9); transform: translateX(1px) skewX(-8deg); }
            62% { text-shadow: -3px 1px rgba(255, 0, 200, .9), 3px -1px rgba(0, 255, 240, .9); clip-path: inset(38% 0 28% 0); transform: translateX(-2px); }
            64% { text-shadow: 2px 0 rgba(255, 0, 200, .9), -2px 0 rgba(0, 255, 240, .9); clip-path: inset(0 0 55% 0); transform: translateX(2px); }
            66% { text-shadow: 1.5px 0 rgba(255, 0, 200, .75), -1.5px 0 rgba(0, 255, 240, .75); clip-path: none; transform: none; }
            88% { text-shadow: -2px 0 rgba(255, 0, 200, .85), 2px 0 rgba(0, 255, 240, .85); transform: translateX(-1px); }
            89% { text-shadow: 1.5px 0 rgba(255, 0, 200, .75), -1.5px 0 rgba(0, 255, 240, .75); transform: none; }
        }
        @property --vp-so { syntax: '<number>'; inherits: false; initial-value: 1; }
        @property --vp-ss { syntax: '<number>'; inherits: false; initial-value: 1; }
        @property --vp-sy { syntax: '<length>'; inherits: false; initial-value: 0px; }
        html.vp-scene article.vp-post {
            animation: none !important; transform-origin: 50% 0; backface-visibility: hidden;
            opacity: var(--vp-so, 1); transform: translateY(var(--vp-sy, 0px)) scale(var(--vp-ss, 1));
            transition: background-color .25s ease, border-color .25s ease, box-shadow .25s ease, color .25s ease !important;
        }

        .vp-ambient-host { isolation: isolate; }
        .vp-ambient { position: absolute; z-index: -1; pointer-events: none; border-radius: 40px; opacity: 0;
            filter: blur(26px) saturate(1.7); transition: opacity .8s ease; }
        .vp-ambient.vp-on { opacity: .8; }

        .vp-tab-ind { transition: background-color .2s ease !important; }

        .vp-hc { --vp-hc-bg: rgba(22, 22, 24, .94); position: fixed; z-index: 10005; width: 300px; border-radius: 22px; overflow: hidden; cursor: pointer;
            background: var(--vp-hc-bg); color: var(--text-primary, #fff);
            border: 1px solid color-mix(in srgb, var(--text-primary, #fff) 10%, transparent);
            box-shadow: 0 18px 50px rgba(0, 0, 0, .5); backdrop-filter: blur(24px) saturate(1.3);
            -webkit-backdrop-filter: blur(24px) saturate(1.3); animation: vpHcIn .22s cubic-bezier(.2, 1.2, .4, 1); }
        html.vp-light .vp-hc { --vp-hc-bg: rgba(255, 255, 255, .95); box-shadow: 0 18px 50px rgba(0, 0, 0, .18); }
        .vp-hc-banner { height: 84px; background-size: cover; background-position: center; }
        .vp-hc-body { padding: 0 16px 14px; }
        .vp-hc-ava { width: 60px; height: 60px; margin-top: -30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-size: 30px; background: var(--vp-hc-bg); border: 3px solid var(--vp-hc-bg); overflow: hidden; position: relative; }
        .vp-hc-ava img { width: 100%; height: 100%; object-fit: cover; }
        .vp-hc-name { margin-top: 6px; font-weight: 700; font-size: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-hc-login { font-size: 13px; color: var(--text-secondary); }
        .vp-hc-bio { margin-top: 8px; font-size: 13px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .vp-hc-bio:empty { display: none; }
        .vp-hc-stats { display: flex; gap: 14px; margin-top: 10px; font-size: 13px; color: var(--text-secondary); }
        .vp-hc-stats:empty { display: none; }
        .vp-hc-stats b { color: var(--text-primary, #fff); }
        @keyframes vpHcIn { from { opacity: 0; transform: translateY(6px) scale(.97); } }

        @media (prefers-reduced-motion: reduce) {
            .vp-hc { animation: none; }
            .vp-count::after { animation: none; counter-reset: vpn var(--vp-to); }
            .vp-nav-blob { transition: none; }
        }
    `);
