        const galIcon = size => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="3" y="3" width="8" height="10" rx="2.5"/><rect x="13" y="3" width="8" height="6" rx="2.5"/><rect x="3" y="15" width="8" height="6" rx="2.5"/><rect x="13" y="11" width="8" height="10" rx="2.5"/></svg>`;
        const GAL_TABS = [['popular', 'Популярное'], ['clan', 'Кланы'], ['following', 'Подписки']];
        const gal = { acts: new Map(), el: null, tab: 'popular', cursor: null, loading: false, done: false, cols: [], heights: [], seen: new Set(), hist: false };
        const galStyle = addCss(`
        .vp-gal { position: fixed; z-index: 30; display: flex; flex-direction: column; box-sizing: border-box; color: var(--text-primary, #fff); }
        .vp-gal-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; overflow: hidden; margin-top: 16px;
            border-radius: 36px; background: var(--block-bg);
            backdrop-filter: var(--vp-glass-filter, none); -webkit-backdrop-filter: var(--vp-glass-filter, none); }
        .vp-gal.vp-card .vp-gal-card { border: 1px solid var(--border-color, rgba(255, 255, 255, .15)); }
        html.vp-light .vp-gal.vp-card .vp-gal-card { box-shadow: 0 16px 48px rgba(0, 0, 0, .12); }
        .vp-gal-top { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }
        .vp-gal-top > .vp-gal-tabs { flex: 1 1 auto; min-width: 0; }
        .vp-gal-vol { position: relative; flex: 0 0 auto; }
        .vp-gal-vol-b { width: 45px; height: 45px; border: 0; border-radius: 9999px; padding: 0; margin: 0; display: grid; place-items: center; cursor: pointer;
            color: var(--text-primary, #fff); background: var(--glass-bg, rgba(35, 35, 35, .5)); transition: background-color .15s; }
        .vp-gal-vol-b:hover { background: rgba(255, 255, 255, .12); }
        html.vp-light .vp-gal-vol-b { background: rgba(0, 0, 0, .06); color: var(--text-primary, #141414); }
        html.vp-light .vp-gal-vol-b:hover { background: rgba(0, 0, 0, .1); }
        .vp-gal-vol-b svg { width: 21px; height: 21px; }
        .vp-gal-vol-p { position: absolute; top: calc(100% + 8px); right: 0; z-index: 6; display: flex; align-items: center; gap: 10px; padding: 11px 16px;
            border-radius: 9999px; background: var(--block-bg); border: 1px solid var(--border-color, rgba(255, 255, 255, .15));
            backdrop-filter: var(--vp-glass-filter, blur(14px)); -webkit-backdrop-filter: var(--vp-glass-filter, blur(14px)); box-shadow: 0 12px 32px rgba(0, 0, 0, .35);
            opacity: 0; visibility: hidden; transform: translateY(-4px); transition: opacity .15s, transform .15s, visibility 0s .15s; }
        html.vp-light .vp-gal-vol-p { background: #fff; box-shadow: 0 12px 32px rgba(0, 0, 0, .14); }
        .vp-gal-vol-p::before { content: ''; position: absolute; left: 0; right: 0; top: -10px; height: 10px; }
        .vp-gal-vol:hover .vp-gal-vol-p, .vp-gal-vol:focus-within .vp-gal-vol-p { opacity: 1; visibility: visible; transform: none; transition: opacity .15s, transform .15s; }
        .vp-gal-vol-p input { width: 150px; height: 4px; margin: 0; cursor: pointer; appearance: none; -webkit-appearance: none; border-radius: 9999px;
            background: linear-gradient(to right, var(--vp-accent) var(--vp-vol, 100%), rgba(128, 128, 128, .35) var(--vp-vol, 100%)); }
        .vp-gal-vol-p input::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--vp-accent); box-shadow: 0 1px 4px rgba(0, 0, 0, .4); }
        .vp-gal-vol-p input::-moz-range-thumb { width: 14px; height: 14px; border: 0; border-radius: 50%; background: var(--vp-accent); box-shadow: 0 1px 4px rgba(0, 0, 0, .4); }
        .vp-gal-vol-p span { min-width: 36px; text-align: right; font-size: 13px; font-variant-numeric: tabular-nums; color: var(--text-secondary); }
        .vp-gal.vp-card .vp-gal-logo { display: none !important; }
        .vp-gal-logo { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
        .vp-gal:not(.vp-card) .vp-gal-top { margin: 9px 12px 0 6px; }
        .vp-gal:not(.vp-card) .vp-gal-card { margin-top: 9px; border-radius: 36px 36px 0 0; }
        html.vp-gal-open .vp-gal-hidden, html.vp-msgs-open .vp-gal-hidden { visibility: hidden !important; }
        html.vp-rail-adj aside.vp-sidebar-right { visibility: hidden !important; }
        iframe.vp-page-frame, iframe[src*="/public/shop"] { background: transparent !important; color-scheme: normal; transition: opacity .2s; }
        iframe.vp-page-frame:not(.vp-frame-ok), iframe[src*="/public/shop"]:not(.vp-frame-ok) { opacity: 0; }
        html.vp-gal-open iframe.vp-page-frame, html.vp-msgs-open iframe.vp-page-frame { visibility: hidden !important; }
        .vp-gal-body { padding: 12px 12px var(--vp-gal-pb, 24px) !important; }
        html.vp-gal-open .vp-gal-navwrap { z-index: 40 !important; }
        html.vp-gal-open .vp-nav-link.vp-site-cur { color: var(--vp-off-c) !important; opacity: var(--vp-off-o) !important; background-color: var(--vp-off-b) !important; }
        html.vp-gal-open .vp-gal-nav { color: var(--vp-on-c) !important; opacity: var(--vp-on-o) !important; background-color: var(--vp-on-b) !important; }
        .vp-gal-tabs { position: relative; display: flex; flex: 0 0 auto; box-sizing: border-box; height: 45px; padding: 4px; margin: 0; border-radius: 9999px;
            background: var(--glass-bg, rgba(35, 35, 35, .5)); }
        html.vp-light .vp-gal-tabs { background: rgba(0, 0, 0, .06); }
        .vp-gal-ind { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc((100% - 8px) / 3); border-radius: 9999px; pointer-events: none;
            background: rgba(255, 255, 255, .08); box-shadow: inset 0 0 0 1px var(--vp-accent), 0 0 14px -4px var(--vp-accent);
            transition: transform .3s cubic-bezier(.2,.8,.2,1); }
        html.vp-light .vp-gal-ind { background: #fff; }
        .vp-gal-tab { position: relative; flex: 1 1 0; min-width: 0; border: 0; border-radius: 9999px; padding: 8px 0; margin: 0;
            font: inherit; font-size: 14px; font-weight: 500; line-height: 21px; cursor: pointer; background: transparent;
            color: rgba(255, 255, 255, .5); white-space: nowrap; transition: color .2s; }
        html.vp-light .vp-gal-tab { color: rgba(0, 0, 0, .5); }
        .vp-gal-tab.vp-on { color: var(--text-primary, #f5f5f5); }
        html.vp-gal-open .itd-scroll-top-btn, html.vp-msgs-open .itd-scroll-top-btn { display: none !important; }
        html.vp-gal-open .vp-sidebar-right > :last-child { visibility: hidden !important; }
        .vp-gal-body { flex: 1 1 auto; overflow-y: auto; overscroll-behavior: contain; padding: 0 8px 24px; }
        .vp-gal-grid { display: flex; gap: 8px; align-items: flex-start; max-width: 1400px; margin: 0 auto; }
        .vp-gal-col { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
        .vp-gal-tile { position: relative; border-radius: 16px; overflow: hidden; background: rgba(128,128,128,.15); cursor: pointer; }
        .vp-gal-strip { display: flex; width: 100%; height: 100%; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory;
            scrollbar-width: none; overscroll-behavior-x: contain; }
        .vp-gal-strip::-webkit-scrollbar { display: none; }
        .vp-gal-slide { position: relative; flex: 0 0 100%; height: 100%; scroll-snap-align: start; }
        .vp-gal-slide.vp-wait, .vp-gal-slide.vp-fail, .vp-media-wait, .vp-media-fail { background: rgba(128,128,128,.14); }
        .vp-gal-slide.vp-wait > img, .vp-gal-slide.vp-fail > img, .vp-media-wait > img, .vp-media-fail > img { opacity: 0; }
        .vp-media-rel { position: relative; }
        .vp-gal-slide.vp-wait::before, .vp-media-wait::before { content: ''; position: absolute; inset: 0; pointer-events: none;
            background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,.09) 50%, transparent 70%) 0 0 / 250% 100%;
            animation: vpGalShine 1.4s linear infinite; }
        .vp-gal-slide.vp-wait::after, .vp-media-wait::after { content: ''; position: absolute; left: 50%; top: 50%; width: 26px; height: 26px; margin: -13px 0 0 -13px;
            border-radius: 50%; border: 2.5px solid rgba(255,255,255,.18); border-top-color: rgba(255,255,255,.75);
            animation: vpGalSpin .8s linear infinite; pointer-events: none; }
        .vp-gal-slide.vp-fail::after, .vp-media-fail::after { content: 'не загрузилось — нажми'; position: absolute; left: 0; right: 0; top: 50%; margin-top: -4px;
            padding-top: 38px; text-align: center; font-size: 12px; color: var(--text-secondary); pointer-events: none;
            background: no-repeat center top / 30px 30px url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238a8a8a' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='16' rx='3'/%3E%3Cpath d='m3 16 5-5 4 4'/%3E%3Cpath d='m14 13 2-2 5 5'/%3E%3Cpath d='M3 3l18 18'/%3E%3C/svg%3E");
            transform: translateY(-50%); }
        .vp-gal-slide.vp-fail, .vp-media-fail { cursor: pointer; }
        @keyframes vpGalShine { from { background-position: 125% 0; } to { background-position: -125% 0; } }
        @keyframes vpGalSpin { to { transform: rotate(360deg); } }
        .vp-gal-slide > img, .vp-gal-slide > video { display: block; width: 100%; height: 100%; object-fit: contain; background: #000; }
        .vp-gal-count { position: absolute; right: 8px; top: 8px; padding: 3px 8px; border-radius: 10px; font-size: 12px; font-weight: 600;
            color: #fff; pointer-events: none; background: rgba(0,0,0,.45); backdrop-filter: blur(10px) saturate(1.4); -webkit-backdrop-filter: blur(10px) saturate(1.4);
            box-shadow: 0 0 0 1px rgba(255,255,255,.12) inset; }
        .vp-gal-dots { position: absolute; left: 50%; top: 0; transform: translateX(-50%); display: flex; gap: 5px; padding: 6px 11px 7px;
            border-radius: 0 0 12px 12px; pointer-events: none; background: rgba(0,0,0,.45); backdrop-filter: blur(10px) saturate(1.4);
            -webkit-backdrop-filter: blur(10px) saturate(1.4);
            box-shadow: inset 0 -1px 0 rgba(255,255,255,.12), inset 1px 0 0 rgba(255,255,255,.12), inset -1px 0 0 rgba(255,255,255,.12); }
        .vp-gal-dots i { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.45); }
        .vp-gal-dots i.vp-on { background: #fff; }
        .vp-gal-arrow { position: absolute; top: 50%; width: 44px; height: 44px; margin-top: -22px; border: 0; border-radius: 50%; padding: 0;
            display: inline-flex; align-items: center; justify-content: center; cursor: pointer; -webkit-tap-highlight-color: transparent;
            color: #fff; opacity: 0; transition: opacity .15s, transform .12s ease;
            background: rgba(0,0,0,.45); backdrop-filter: blur(10px) saturate(1.4); -webkit-backdrop-filter: blur(10px) saturate(1.4);
            box-shadow: 0 0 0 1px rgba(255,255,255,.12) inset; }
        .vp-gal-arrow.vp-prev { left: 8px; } .vp-gal-arrow.vp-next { right: 8px; }
        .vp-gal-arrow svg { stroke-width: 2.2; }
        .vp-gal-arrow:active { transform: scale(.9); }
        @media (hover: hover) and (pointer: fine) { .vp-gal-tile:hover .vp-gal-arrow { opacity: 1; } }
        .vp-gal-tile .vp-gal-arrow.vp-edge { opacity: 0; cursor: default; }
        @media not ((hover: hover) and (pointer: fine)) { .vp-gal-arrow { opacity: 1; } }
        .vp-gal-tile .vp-gal-arrow { top: 0; bottom: 0; width: 22%; max-width: 96px; height: auto; margin: 0; border-radius: 0; background: none; box-shadow: none;
            backdrop-filter: none; -webkit-backdrop-filter: none; opacity: 1; transition: background .2s; }
        .vp-gal-tile .vp-gal-arrow svg { display: none; }
        .vp-gal-tile .vp-gal-arrow:active { transform: none; }
        .vp-gal-tile .vp-gal-arrow.vp-prev { left: 0; }
        .vp-gal-tile .vp-gal-arrow.vp-next { right: 0; }
        .vp-gal-tile .vp-gal-arrow.vp-edge { opacity: 0; }
        @media (hover: hover) and (pointer: fine) {
            .vp-gal-tile:hover .vp-gal-arrow.vp-prev { background: linear-gradient(90deg, rgba(255, 255, 255, .12), transparent); }
            .vp-gal-tile:hover .vp-gal-arrow.vp-next { background: linear-gradient(270deg, rgba(255, 255, 255, .12), transparent); }
            .vp-gal-tile .vp-gal-arrow.vp-prev:hover { background: linear-gradient(90deg, rgba(255, 255, 255, .34), transparent); }
            .vp-gal-tile .vp-gal-arrow.vp-next:hover { background: linear-gradient(270deg, rgba(255, 255, 255, .34), transparent); }
            .vp-gal-tile .vp-gal-arrow svg { display: block; opacity: 0; transition: opacity .2s; filter: drop-shadow(0 1px 4px rgba(0, 0, 0, .7)); }
            .vp-gal-tile:hover .vp-gal-arrow svg { opacity: .55; }
            .vp-gal-tile .vp-gal-arrow:hover svg { opacity: 1; }
            .vp-gal-tile .vp-gal-arrow.vp-prev { justify-content: flex-start; padding-left: 12px; }
            .vp-gal-tile .vp-gal-arrow.vp-next { justify-content: flex-end; padding-right: 12px; }
        }
        @media not ((hover: hover) and (pointer: fine)) {
            .vp-gal-tile .vp-gal-arrow { display: none; }
        }
        .vp-gal-slide > img { pointer-events: none; -webkit-user-drag: none; user-select: none; }
        .vp-gal-tile.vp-ctx .vp-gal-slide > img { pointer-events: auto; }
        .vp-gal-acts { position: absolute; left: 8px; bottom: 8px; display: flex; gap: 2px; padding: 2px; border-radius: 999px;
            background: rgba(0,0,0,.45); backdrop-filter: blur(10px) saturate(1.4); -webkit-backdrop-filter: blur(10px) saturate(1.4);
            box-shadow: 0 0 0 1px rgba(255,255,255,.12) inset; transition: opacity .15s; }
        .vp-gal-act { width: 38px; height: 38px; padding: 0; border: 0; border-radius: 50%; background: none; color: #fff; cursor: pointer;
            display: inline-flex; align-items: center; justify-content: center; -webkit-tap-highlight-color: transparent;
            transition: transform .12s ease, color .2s, background .2s; }
        @media (hover: hover) and (pointer: fine) { .vp-gal-act:hover { background: rgba(255,255,255,.14); } }
        .vp-gal-acts.vp-gal-acts-r { left: auto; right: 8px; }
        .vp-gal-acts-r:empty { display: none; }
        .vp-gal-tile { container-type: inline-size; }
        @container (max-width: 250px) {
            .vp-gal-acts { left: 6px; bottom: 6px; padding: 1px; gap: 0; }
            .vp-gal-acts.vp-gal-acts-r { right: 6px; }
            .vp-gal-act { width: 30px; height: 30px; }
            .vp-gal-act svg { width: 18px; height: 18px; }
            .vp-gal-arrow { width: 34px; height: 34px; margin-top: -17px; }
            .vp-gal-arrow svg { width: 22px; height: 22px; }
        }
        @container (max-width: 175px) { .vp-gal-acts.vp-gal-acts-r { display: none; } }
        .vp-gal-act:active { transform: scale(.86); }
        .vp-gal-act:focus-visible { outline: 2px solid var(--vp-accent); outline-offset: -4px; }
        .vp-gal-act.vp-on[data-act="like"] svg { animation: vpGalPop .35s cubic-bezier(.3, 1.6, .5, 1); }
        @keyframes vpGalPop { 40% { transform: scale(1.35); } }
        .vp-gal-act svg { width: 22px; height: 22px; }
        .vp-gal-act.vp-on { color: var(--accent-liked, #f91880); }
        .vp-gal-act.vp-on[data-act="like"] path { fill: currentColor; }
        .vp-gal-act.vp-busy { opacity: .5; pointer-events: none; }
        @media (hover: hover) and (pointer: fine) {
            .vp-gal-acts { opacity: 0; }
            .vp-gal-tile:hover .vp-gal-acts, .vp-gal-acts:has(:focus-visible) { opacity: 1; }
        }
        .vp-gal-bar { display: contents; }
        .vp-gal-bgx { display: none; }
        @media not ((hover: hover) and (pointer: fine)) {
            .vp-gal-tile { display: flex; flex-direction: column; aspect-ratio: auto !important; }
            .vp-gal-tile .vp-gal-strip { flex: 0 0 auto; height: calc(100cqw * var(--vp-r, 1)); }
            .vp-gal-bar { position: relative; overflow: hidden; display: flex; align-items: center; justify-content: space-between; padding: 2px 4px; }
            .vp-gal-bar .vp-gal-acts { position: relative; inset: auto; z-index: 2; padding: 0; background: none; box-shadow: none; backdrop-filter: none; -webkit-backdrop-filter: none; }
            .vp-gal-act { color: var(--text-primary, #fff); }
            .vp-gal-bar.vp-bgx .vp-gal-bgx { display: block; position: absolute; inset: -12px; background-size: 100% 1400%; background-position: center bottom; filter: blur(8px) saturate(1.3); pointer-events: none; }
            .vp-gal-bar.vp-bgx::after { content: ''; position: absolute; inset: 0; z-index: 1; background: rgba(0, 0, 0, .3); pointer-events: none; }
            .vp-gal-bar.vp-bgx .vp-gal-act:not(.vp-on) { color: #fff; }
        }
        .vp-gal-badge { position: absolute; left: 8px; top: 8px; padding: 3px 8px; border-radius: 10px; font-size: 12px; font-weight: 600;
            color: #fff; pointer-events: none; background: rgba(0,0,0,.45); backdrop-filter: blur(10px) saturate(1.4); -webkit-backdrop-filter: blur(10px) saturate(1.4);
            box-shadow: 0 0 0 1px rgba(255,255,255,.12) inset; }
        .vp-gal-more { text-align: center; padding: 18px; color: var(--text-secondary); font-size: 14px; }
        .vp-gal-tile.vp-gal-new { animation: vpGalIn .5s cubic-bezier(.2, .7, .2, 1) var(--vp-d, 0ms) backwards; }
        @keyframes vpGalIn { from { opacity: 0; transform: translateY(14px) scale(.985); } to { opacity: 1; transform: none; } }
        .vp-gal-btn svg { pointer-events: none; }
        @media (min-width: ${PHONE_MAX + 1}px) { .vp-gal-btn { display: none !important; } }
        @media (max-width: ${PHONE_MAX}px) { .vp-gal-nav { display: none !important; } }
    `);
        const galColsCount = () => {
            const g = gal.el && gal.el.querySelector('.vp-gal-grid'), w = g ? g.clientWidth : 0;
            if (!w) return innerWidth >= 1100 ? 4 : innerWidth >= 700 ? 3 : 2;
            return Math.max(2, Math.min(4, Math.floor((w + 8) / 218)));
        };
        function galVol() { const v = +GM_getValue('galVol', 1); return isFinite(v) ? Math.max(0, Math.min(1, v)) : 1; }
        function galVolIcon(v) {
            const waves = v <= 0 ? '<path d="M16 9l5 6M21 9l-5 6"/>' : v < .5 ? '<path d="M15.5 9.5a3.5 3.5 0 0 1 0 5"/>' : '<path d="M15.5 9.5a3.5 3.5 0 0 1 0 5"/><path d="M18.5 6.5a7.5 7.5 0 0 1 0 11"/>';
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/>${waves}</svg>`;
        }
        function galVolUi(top) {
            if (!matchMedia('(hover: hover) and (pointer: fine)').matches || top.querySelector('.vp-gal-vol')) return;
            const w = document.createElement('div');
            w.className = 'vp-gal-vol';
            w.innerHTML = '<button type="button" class="vp-gal-vol-b" aria-label="Громкость видео" title="Громкость видео: звук — при наведении на видео"></button><div class="vp-gal-vol-p"><input type="range" min="0" max="100" step="1" aria-label="Громкость видео"><span></span></div>';
            const b = w.querySelector('button'), r = w.querySelector('input'), lab = w.querySelector('span');
            const paint = () => { const v = galVol(); r.value = Math.round(v * 100); lab.textContent = r.value + '%'; r.style.setProperty('--vp-vol', r.value + '%'); b.innerHTML = galVolIcon(v); };
            const set = v => {
                v = Math.round(Math.max(0, Math.min(1, v)) * 100) / 100;
                GM_setValue('galVol', v);
                if (v > 0) GM_setValue('galVolLast', v);
                paint();
                document.querySelectorAll('.vp-gal video').forEach(x => { x.volume = v; if (!v && x._vpHoverSound) { x.muted = true; x._vpHoverSound = false; } });
            };
            r.addEventListener('input', () => set(r.value / 100));
            b.addEventListener('click', () => set(galVol() > 0 ? 0 : +GM_getValue('galVolLast', 1) || 1));
            w.addEventListener('wheel', e => { e.preventDefault(); set(galVol() - Math.sign(e.deltaY) * .05); }, { passive: false });
            paint();
            top.appendChild(w);
        }
        const galVideoIO = new IntersectionObserver(es => es.forEach(e => {
            const v = e.target;
            if (e.isIntersecting && e.intersectionRatio > .5) v.play().catch(() => { }); else v.pause();
        }), { threshold: [0, .5, 1] });
        function galLayout() {
            const grid = gal.el.querySelector('.vp-gal-grid');
            const tiles = gal.cols.flatMap(c => [...c.children]).sort((a, b) => a._vpN - b._vpN);
            grid.replaceChildren();
            gal.cols = Array.from({ length: galColsCount() }, () => { const c = document.createElement('div'); c.className = 'vp-gal-col'; grid.appendChild(c); return c; });
            gal.heights = gal.cols.map(() => 0);
            tiles.forEach(galPlace);
        }
        function galPlace(tile) {
            let k = 0;
            gal.heights.forEach((h, i) => { if (h < gal.heights[k]) k = i; });
            gal.cols[k].appendChild(tile);
            gal.heights[k] += tile._vpRatio + .05 + (matchMedia('(hover: hover) and (pointer: fine)').matches ? 0 : .17);
        }
        const GAL_ICONS = {
            like: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 4.6a3.7 3.7 0 0 0-5.2-.9C3.2 5 2.4 7.6 3.6 10.2 4.8 12.7 10 17 10 17s5.3-4.3 6.5-6.8c1.2-2.6 0-5.2-1.6-6.5s-4-.8-4.9.9"/>',
            comment: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 17a7 7 0 1 0-6.2-3.7L3 17l3.7-.8a7 7 0 0 0 3.3.8"/>',
            repost: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 9V8a3 3 0 0 1 3-3h9m-3 3 3-3-3-3M16 11v1a3 3 0 0 1-3 3H4m3-3-3 3 3 3"/>',
            link: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-1 1M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1-1"/>',
            done: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="m4.5 10.5 3.5 3.5 7.5-8"/>',
            copy: '<g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect x="7" y="7" width="10" height="10" rx="2.5"/><path d="M13 4.7A2 2 0 0 0 11.2 3.5H5.5a2 2 0 0 0-2 2v5.7A2 2 0 0 0 4.7 13"/></g>'
        };
        const galIsVideo = att => att.type === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(att.url || '');
        function galCopyImage(url) {
            if (!url || typeof ClipboardItem !== 'function' || !navigator.clipboard || !navigator.clipboard.write || typeof GM_xmlhttpRequest !== 'function')
                return Promise.resolve(false);
            const png = new Promise((ok, fail) => GM_xmlhttpRequest({
                method: 'GET', url, responseType: 'blob', timeout: 30000,
                onload: async r => {
                    try {
                        if (r.status !== 200 || !r.response) throw new Error('картинка: ' + r.status);
                        const bmp = await createImageBitmap(r.response);
                        const c = document.createElement('canvas');
                        c.width = bmp.width; c.height = bmp.height;
                        c.getContext('2d').drawImage(bmp, 0, 0);
                        bmp.close && bmp.close();
                        c.toBlob(b => b ? ok(b) : fail(new Error('в PNG не перегналась')), 'image/png');
                    } catch (e) { fail(e); }
                },
                onerror: () => fail(new Error('картинка: сеть')), ontimeout: () => fail(new Error('картинка: долго'))
            }));
            try {
                return navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
                    .then(() => true, e => { logErr('галерея: скопировать картинку', e); return false; });
            } catch (e) { logErr('галерея: скопировать картинку', e); return Promise.resolve(false); }
        }
        function galOpenPost(post) {
            const user = post.author && post.author.username;
            if (!user) return;
            closeGallery(true);
            history.pushState({}, '', `/@${user}/post/${post.id}`);
            dispatchEvent(new PopStateEvent('popstate'));
        }
        function galActions(post) {
            const row = document.createElement('div');
            row.className = 'vp-gal-acts';
            const btn = (act, title, on) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'vp-gal-act' + (on ? ' vp-on' : '');
                b.dataset.act = act;
                b.title = title;
                b.innerHTML = `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">${GAL_ICONS[act]}</svg>`;
                row.appendChild(b);
                return b;
            };
            if (!gal.acts.has(post.id)) gal.acts.set(post.id, { like: post.isLiked === true, repost: post.isReposted === true });
            const state = gal.acts.get(post.id);
            row.dataset.post = post.id;
            const like = btn('like', 'Нравится', state.like);
            const comment = btn('comment', 'Комментарии');
            const repost = btn('repost', 'Репост', state.repost);
            const paint = act => document.querySelectorAll(`.vp-gal-acts[data-post="${post.id}"] .vp-gal-act[data-act="${act}"]`)
                .forEach(b => b.classList.toggle('vp-on', state[act]));
            const busy = (act, on) => document.querySelectorAll(`.vp-gal-acts[data-post="${post.id}"] .vp-gal-act[data-act="${act}"]`)
                .forEach(b => b.classList.toggle('vp-busy', on));
            const toggle = async (b, path, confirmText) => {
                const act = b.dataset.act, on = state[act];
                if (state[act + 'Busy']) return;
                if (confirmText && !on && !confirm(confirmText)) return;
                state[act + 'Busy'] = true; busy(act, true);
                state[act] = !on; paint(act);
                try {
                    const res = await api(path, on ? { method: 'DELETE' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                    if (!res.ok) throw new Error(path + ': ' + res.status);
                } catch (e) {
                    state[act] = on; paint(act);
                    logErr('галерея: ' + act, e);
                } finally { state[act + 'Busy'] = false; busy(act, false); }
            };
            like.addEventListener('click', e => { e.stopPropagation(); toggle(like, `/api/posts/${post.id}/like`); });
            repost.addEventListener('click', e => { e.stopPropagation(); toggle(repost, `/api/posts/${post.id}/repost`, 'Сделать репост этого поста?'); });
            comment.addEventListener('click', e => { e.stopPropagation(); galOpenPost(post); });
            const right = document.createElement('div');
            right.className = 'vp-gal-acts vp-gal-acts-r';
            const copyBtn = (act, title, run) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'vp-gal-act';
                b.dataset.act = act;
                b.title = title;
                const icon = k => { b.innerHTML = `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">${GAL_ICONS[k]}</svg>`; };
                icon(act);
                b.addEventListener('click', e => {
                    e.stopPropagation();
                    if (b.classList.contains('vp-busy')) return;
                    b.classList.add('vp-busy');
                    run(b).then(ok => {
                        b.classList.remove('vp-busy');
                        icon(ok ? 'done' : act);
                        b.title = ok ? 'Скопировано' : 'Не вышло скопировать';
                        clearTimeout(b._vpT);
                        b._vpT = setTimeout(() => { icon(act); b.title = title; }, 1400);
                    });
                });
                right.appendChild(b);
            };
            if ((post.attachments || []).some(att => att && att.url && !galIsVideo(att)))
                copyBtn('copy', 'Скопировать картинку', b => {
                    const strip = b.closest('.vp-gal-tile').querySelector('.vp-gal-strip');
                    const slide = strip.children[Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth))] || strip.children[0];
                    const img = slide && slide.querySelector('img');
                    return img ? galCopyImage(img.dataset.src) : Promise.resolve(false);
                });
            const user = post.author && post.author.username;
            if (user) copyBtn('link', 'Скопировать ссылку', () => copyText(`${location.origin}/@${user}/post/${post.id}`));
            const bar = document.createElement('div');
            bar.className = 'vp-gal-bar';
            bar.append(row, right);
            return bar;
        }
        document.addEventListener('vp-post-act', e => {
            const { id, act, on } = e.detail || {};
            const st = gal.acts.get(id), root = gal.el || gal.kept;
            if (!st || st[act + 'Busy'] || !root) return;
            st[act] = on;
            root.querySelectorAll(`.vp-gal-acts[data-post="${id}"] .vp-gal-act[data-act="${act}"]`).forEach(b => b.classList.toggle('vp-on', on));
        });
        let galN = 0;
        function galMedia(att) {
            if (galIsVideo(att)) {
                const v = document.createElement('video');
                Object.assign(v, { src: att.url, muted: true, loop: true, playsInline: true, preload: 'metadata' });
                v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
                const poster = pick(att.thumbnailUrl, att.thumbnail, att.previewUrl, att.preview);
                if (poster) v.poster = poster.url || poster;
                galVideoIO.observe(v);
                return v;
            }
            const img = document.createElement('img');
            img.decoding = 'async'; img.alt = '';
            img.dataset.src = att.url;
            galImgObs().observe(img);
            return img;
        }
        let galImgIO = null;
        function galImgObs() {
            const body = gal.el && gal.el.querySelector('.vp-gal-body');
            if (!galImgIO || galImgIO.root !== body) {
                if (galImgIO) galImgIO.disconnect();
                galImgIO = new IntersectionObserver(es => es.forEach(e => {
                    if (!e.isIntersecting) return;
                    const tile = e.target.closest('.vp-gal-tile');
                    (tile ? [...tile.querySelectorAll('img[data-src]')] : [e.target]).forEach(i => {
                        galImgIO.unobserve(i);
                        if (!i.getAttribute('src')) i.src = i.dataset.src;
                    });
                }), { root: body || null, rootMargin: '2700px 0px' });
            }
            return galImgIO;
        }
        function galTile(post, media) {
            const tile = document.createElement('div');
            tile.className = 'vp-gal-tile';
            const first = media[0], w = +first.width || 1, h = +first.height || 1;
            tile._vpRatio = Math.min(2.2, Math.max(.45, h / w));
            tile._vpN = galN++;
            tile.style.aspectRatio = `1 / ${tile._vpRatio}`;
            tile.style.setProperty('--vp-r', tile._vpRatio);
            const strip = document.createElement('div');
            strip.className = 'vp-gal-strip';
            media.forEach(att => {
                const slide = document.createElement('div');
                slide.className = 'vp-gal-slide vp-wait';
                const m = galMedia(att);
                const done = () => slide.classList.remove('vp-wait', 'vp-fail');
                const fail = () => { slide.classList.remove('vp-wait'); slide.classList.add('vp-fail'); };
                if (m.tagName === 'IMG') { m.addEventListener('load', done); m.addEventListener('error', fail); }
                else { m.addEventListener('loadeddata', done); m.addEventListener('error', fail); if (m.poster) done(); }
                slide.addEventListener('click', e => {
                    if (!slide.classList.contains('vp-fail')) return;
                    e.stopPropagation();
                    slide.classList.replace('vp-fail', 'vp-wait');
                    if (m.tagName === 'IMG') { m.removeAttribute('src'); m.src = m.dataset.src; } else m.load();
                });
                slide.appendChild(m);
                strip.appendChild(slide);
            });
            tile.appendChild(strip);
            const vid = media.find(galIsVideo);
            if (vid && media.length === 1) {
                const badge = document.createElement('span');
                badge.className = 'vp-gal-badge';
                const sec = Math.round(+vid.duration || 0);
                badge.textContent = sec ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : '';
                if (!sec) badge.innerHTML = uiIcon('play', 14, 'vp-solo');
                tile.appendChild(badge);
            }
            if (media.length > 1) {
                tile.classList.add('vp-multi');
                const count = document.createElement('span');
                count.className = 'vp-gal-count';
                const dots = document.createElement('div');
                dots.className = 'vp-gal-dots';
                media.forEach(() => dots.appendChild(document.createElement('i')));
                const prev = document.createElement('button'), next = document.createElement('button');
                prev.type = next.type = 'button';
                prev.className = 'vp-gal-arrow vp-prev'; next.className = 'vp-gal-arrow vp-next';
                prev.innerHTML = svgIcon('<path d="m14.5 6-6 6 6 6"/>', 28); next.innerHTML = svgIcon('<path d="m9.5 6 6 6-6 6"/>', 28);
                prev.setAttribute('aria-label', 'Назад'); next.setAttribute('aria-label', 'Дальше');
                tile.append(count, dots, prev, next);
                const at = () => Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth));
                const show = () => {
                    const i = Math.min(media.length - 1, at());
                    count.textContent = `${i + 1}/${media.length}`;
                    [...dots.children].forEach((d, k) => d.classList.toggle('vp-on', k === i));
                    prev.classList.toggle('vp-edge', i === 0); next.classList.toggle('vp-edge', i === media.length - 1);
                    strip._vpI = i;
                    strip.querySelectorAll('video').forEach((v, k) => { if (v.closest('.vp-gal-slide') !== strip.children[i]) v.pause(); });
                };
                strip.addEventListener('scroll', () => requestAnimationFrame(show), { passive: true });
                const go = d => e => { e.stopPropagation(); strip.scrollTo({ left: (at() + d) * strip.clientWidth, behavior: 'smooth' }); };
                strip.addEventListener('pointerdown', e => {
                    if (e.pointerType !== 'mouse' || e.button !== 0) return;
                    const x0 = e.clientX, s0 = strip.scrollLeft, i0 = at();
                    let moved = false;
                    tile._vpDragged = false;
                    const move = ev => {
                        const dx = ev.clientX - x0;
                        if (!moved && Math.abs(dx) < 6) return;
                        if (!moved) { moved = true; tile._vpDragged = true; strip.style.scrollSnapType = 'none'; strip.setPointerCapture(e.pointerId); }
                        strip.scrollLeft = s0 - dx;
                    };
                    const up = ev => {
                        strip.removeEventListener('pointermove', move);
                        strip.removeEventListener('pointerup', up);
                        strip.removeEventListener('pointercancel', up);
                        if (!moved) return;
                        const dx = ev.clientX - x0;
                        const i = Math.max(0, Math.min(media.length - 1, i0 + (dx < -40 ? 1 : dx > 40 ? -1 : 0)));
                        strip.scrollTo({ left: i * strip.clientWidth, behavior: 'smooth' });
                        const snap = () => { strip.style.scrollSnapType = ''; };
                        strip.addEventListener('scrollend', snap, { once: true });
                        setTimeout(snap, 700);
                        setTimeout(() => { tile._vpDragged = false; }, 0);
                    };
                    strip.addEventListener('pointermove', move);
                    strip.addEventListener('pointerup', up);
                    strip.addEventListener('pointercancel', up);
                });
                prev.addEventListener('click', go(-1));
                next.addEventListener('click', go(1));
                show();
            }
            tile.addEventListener('mousedown', e => { if (e.button === 2) tile.classList.add('vp-ctx'); });
            tile.addEventListener('contextmenu', () => setTimeout(() => tile.classList.remove('vp-ctx'), 300));
            tile.addEventListener('mouseleave', () => tile.classList.remove('vp-ctx'));
            const bar = galActions(post), bgx = document.createElement('div');
            bgx.className = 'vp-gal-bgx';
            bar.prepend(bgx);
            tile.appendChild(bar);
            const barBg = () => {
                const slide = strip.children[Math.min(media.length - 1, Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth)))];
                const img = slide && slide.querySelector('img');
                const ok = !!img && img.complete && img.naturalWidth > 0 && !!img.currentSrc;
                bar.classList.toggle('vp-bgx', ok);
                bgx.style.backgroundImage = ok ? `url("${img.currentSrc}")` : '';
            };
            strip.querySelectorAll('img').forEach(i => i.addEventListener('load', barBg));
            if (media.length > 1) strip.addEventListener('scroll', () => requestAnimationFrame(barBg), { passive: true });
            barBg();
            tile.addEventListener('click', () => { if (!tile._vpDragged) galOpenPost(post); });
            return tile;
        }
        const GAL_NEED = 3, GAL_AHEAD = 6;
        function galNear(screens) {
            const b = gal.el && gal.el.querySelector('.vp-gal-body');
            return !!b && b.clientHeight > 0 && b.scrollTop + b.clientHeight > b.scrollHeight - Math.max(screens * 900, b.clientHeight * screens);
        }
        function galNeedMore() { return galNear(GAL_NEED); }
        const GAL_CHAIN = 2, GAL_CACHE_MS = 10 * 60 * 1000, GAL_GAP = 700;
        const galCacheKey = tab => 'vpGalCache:' + tab;
        function galCacheRead(tab) {
            try {
                const c = JSON.parse(sessionStorage.getItem(galCacheKey(tab)) || 'null');
                return c && Array.isArray(c.posts) && Date.now() - c.t < GAL_CACHE_MS ? c : null;
            } catch (e) { return null; }
        }
        function galCacheSave() {
            try {
                sessionStorage.setItem(galCacheKey(gal.tab), JSON.stringify({ t: gal.cacheT || Date.now(), cursor: gal.cursor, done: gal.done, posts: gal.cachePosts.slice(-400) }));
            } catch (e) { }
        }
        function galAdd(post) {
            if (!post || gal.seen.has(post.id)) return false;
            gal.seen.add(post.id);
            const media = (post.attachments || []).filter(att => att && att.url && (!att.type || /image|video/.test(att.type))).slice(0, 10);
            if (!media.length) return false;
            const tile = galTile(post, media);
            if (gal.fresh && !calm) {
                tile.classList.add('vp-gal-new');
                tile.style.setProperty('--vp-d', (galN % 8) * 40 + 'ms');
                tile.addEventListener('animationend', () => tile.classList.remove('vp-gal-new'), { once: true });
            }
            galPlace(tile);
            const st = gal.acts.get(post.id);
            gal.cachePosts.push({
                id: post.id, author: post.author && { username: post.author.username },
                attachments: media.map(({ type, url, width, height, duration, thumbnailUrl }) => ({ type, url, width, height, duration, thumbnailUrl })),
                isLiked: st ? st.like : post.isLiked, isReposted: st ? st.repost : post.isReposted
            });
            return true;
        }
        async function galFetchPage(cursor, tab) {
            const url = lim => `/api/posts?limit=${lim}&tab=${tab}` + (cursor ? '&cursor=' + encodeURIComponent(cursor) : '');
            let res = await api(url(gal.lim || 50));
            if (res.status === 400 && (gal.lim || 50) !== 20) { gal.lim = 20; res = await api(url(20)); }
            if (res.status === 429) { const e = new Error('лента: 429'); e.retry = +res.headers.get('Retry-After') || 0; throw e; }
            if (!res.ok) throw new Error('лента: ' + res.status);
            const j = await res.json(), d = j.data || j;
            keepSitePosts(j);
            const posts = d.posts || [], next = (d.pagination && d.pagination.nextCursor) || d.nextCursor || d.cursor || null;
            return { posts, cursor: next, done: !next || !posts.length };
        }
        function galApply(page, after) {
            const gen = gal.gen;
            gal.fails = 0;
            if (!gal.cacheT) gal.cacheT = Date.now();
            gal.fresh = true;
            let i = 0;
            const step = () => {
                if (!gal.el || gen !== gal.gen) return;
                const t0 = performance.now();
                while (i < page.posts.length && performance.now() - t0 < 8) galAdd(page.posts[i++]);
                if (i < page.posts.length) return requestAnimationFrame(step);
                gal.fresh = false;
                gal.cursor = page.cursor;
                gal.done = page.done;
                galCacheSave();
                gal.el.querySelector('.vp-gal-more').textContent = gal.done ? (gal.seen.size ? 'Это всё' : 'Пусто') : '';
                gal.loading = false;
                after();
            };
            step();
        }
        function galWait(e, gen) {
            gal.fails = (gal.fails || 0) + 1;
            const wait = Math.min(60, e.retry || 2 ** gal.fails * 2);
            gal.waitUntil = Date.now() + wait * 1000;
            const more = gal.el && gal.el.querySelector('.vp-gal-more');
            if (more) more.textContent = `Сайт просит подождать — ещё раз через ${wait} с`;
            clearTimeout(gal.waitT);
            gal.waitT = setTimeout(() => { gal.waitUntil = 0; if (gal.el && gen === gal.gen) galLoad(); }, wait * 1000);
        }
        function galPrefetch() {
            if (!gal.el || gal.loading || gal.done || gal.buf || gal.pre || (gal.waitUntil || 0) > Date.now() || !galNear(GAL_AHEAD)) return;
            const gen = gal.gen, gap = (gal.lastReq || 0) + GAL_GAP - Date.now();
            if (gap > 0) { clearTimeout(gal.preT); gal.preT = setTimeout(() => { if (gen === gal.gen) galPrefetch(); }, gap); return; }
            gal.lastReq = Date.now();
            const tab = gal.tab, cursor = gal.cursor;
            gal.pre = galFetchPage(cursor, tab)
                .then(page => { if (gen === gal.gen && cursor === gal.cursor) gal.buf = page; })
                .catch(e => { if (gen === gal.gen && e.retry !== undefined) galWait(e, gen); })
                .finally(() => {
                    if (gen !== gal.gen) return;
                    gal.pre = null;
                    if (gal.buf && galNeedMore()) galLoad(true);
                });
        }
        async function galLoad(auto) {
            if (!gal.el || gal.loading || gal.done || (gal.waitUntil || 0) > Date.now()) return;
            if (!auto) gal.chain = 0;
            const more = gal.el.querySelector('.vp-gal-more'), after = () => { galPrefetch(); galMore(); };
            if (gal.buf) { const page = gal.buf; gal.buf = null; gal.loading = true; galApply(page, after); return; }
            if (gal.pre) { more.textContent = 'Загрузка…'; return; }
            const gap = (gal.lastReq || 0) + GAL_GAP - Date.now();
            if (gap > 0) { clearTimeout(gal.gapT); const g0 = gal.gen; gal.gapT = setTimeout(() => { if (g0 === gal.gen) galLoad(true); }, gap); return; }
            gal.lastReq = Date.now();
            gal.loading = true;
            const gen = gal.gen, tab = gal.tab;
            more.onclick = null;
            more.textContent = 'Загрузка…';
            try {
                const page = await galFetchPage(gal.cursor, tab);
                if (!gal.el || gen !== gal.gen) return;
                galApply(page, after);
            } catch (e) {
                if (gen !== gal.gen) return;
                gal.loading = false;
                if (e.retry !== undefined) return galWait(e, gen);
                logErr('галерея', e);
                more.textContent = 'Не загрузилось — нажми, чтобы повторить';
                more.onclick = () => galLoad();
            }
        }
        function galMore() {
            if (!gal.el || gal.done || gal.loading || !galNeedMore()) return;
            if (gal.buf) return galLoad(true);
            if ((gal.chain = (gal.chain || 0) + 1) < GAL_CHAIN) return galLoad(true);
            const more = gal.el.querySelector('.vp-gal-more');
            more.textContent = 'Показать ещё';
            more.onclick = () => galLoad();
        }
        function galInd() {
            const ind = gal.el && gal.el.querySelector('.vp-gal-ind');
            const i = GAL_TABS.findIndex(([id]) => id === gal.tab);
            if (ind && i >= 0) ind.style.transform = `translateX(${i * 100}%)`;
        }
        function galSwitch(tab, fresh) {
            gal.tab = tab; gal.cursor = null; gal.done = false; gal.seen.clear(); gal.acts.clear(); galN = 0;
            gal.gen = (gal.gen || 0) + 1; gal.loading = false; gal.chain = 0; gal.cachePosts = []; gal.cacheT = 0;
            gal.buf = null; gal.pre = null; clearTimeout(gal.preT);
            clearTimeout(gal.waitT); gal.waitUntil = 0;
            gal.el.querySelectorAll('.vp-gal-tab').forEach(b => b.classList.toggle('vp-on', b.dataset.tab === tab));
            galInd();
            gal.cols.forEach(c => c.querySelectorAll('video').forEach(v => galVideoIO.unobserve(v)));
            if (galImgIO) gal.cols.forEach(c => c.querySelectorAll('img[data-src]').forEach(i => galImgIO.unobserve(i)));
            gal.cols = [];
            galLayout();
            gal.el.querySelector('.vp-gal-body').scrollTop = 0;
            const more = gal.el.querySelector('.vp-gal-more');
            more.onclick = null; more.textContent = '';
            const c = !fresh && galCacheRead(tab);
            if (!c) {
                if (fresh) try { sessionStorage.removeItem(galCacheKey(tab)); } catch (e) { }
                return galLoad();
            }
            gal.cacheT = c.t;
            c.posts.forEach(galAdd);
            gal.cursor = c.cursor; gal.done = !!c.done;
            more.textContent = gal.done ? (gal.seen.size ? 'Это всё' : 'Пусто') : '';
            gal.chain = GAL_CHAIN;
            galMore();
            galPrefetch();
        }
        function galPosition() {
            if (!gal.el) return;
            const nav = siteEl('nav');
            const nr = nav && nav.getBoundingClientRect();
            const row = nav && navIsRow(nav) && nr.top > innerHeight / 2;
            requestAnimationFrame(galInd);
            document.querySelectorAll('.vp-gal-navwrap').forEach(w => w.classList.remove('vp-gal-navwrap'));
            if (row) {
                if (nav.parentElement) nav.parentElement.classList.add('vp-gal-navwrap');
                Object.assign(gal.el.style, { left: '0px', right: '0px', top: '0px', bottom: '0px', width: '', paddingBottom: '0px' });
                gal.el.style.setProperty('--vp-gal-pb', Math.max(24, innerHeight - nr.top + BUMP_H + 8) + 'px');
            } else {
                placeSidebar(); placeRail();
                const side = siteEl('sidebar') || (nav && nav.closest('aside')) || nav;
                const sr = side && side.getBoundingClientRect(), sl = side ? baseLeft(side) : 0;
                const margin = sr ? Math.max(12, Math.round(sl)) : 20;
                const left = sr ? Math.round(sl + sr.width + 24) : 20;
                const railEl = document.querySelector('.vp-rail.vp-on');
                const rightEdge = railEl ? parseFloat(railEl.style.left) - 24 : innerWidth - margin;
                Object.assign(gal.el.style, { left: left + 'px', right: Math.max(12, Math.round(innerWidth - rightEdge)) + 'px', top: '36px', bottom: '12px', width: '', paddingBottom: '0px' });
                gal.el.style.removeProperty('--vp-gal-pb');
            }
            gal.el.classList.toggle('vp-card', !row);
        }
        const OWN_MEDIA = '.vp-gal, .vp-msgs, .vp-bg-media, .vpi-overlay, .vp-call-audio';
        function pauseSiteMedia() {
            document.querySelectorAll('video, audio').forEach(m => { if (!m.paused && !m.closest(OWN_MEDIA)) m.pause(); });
        }
        document.addEventListener('play', e => {
            const m = e.target;
            if ((galOpen || msgsOpen) && m && m.pause && !m.closest(OWN_MEDIA)) m.pause();
        }, true);
        function galHideFeed(on) {
            if (!on) { document.querySelectorAll('.vp-gal-hidden').forEach(e => e.classList.remove('vp-gal-hidden')); return; }
            pauseSiteMedia();
            const side = '.' + SELECTORS.sidebar + ', .' + SELECTORS.sidebarRight + ', .vp-rail, nav, .vp-gal, .vp-msgs';
            const stop = new Map();
            const up = el => {
                let top = el;
                for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
                    let s = stop.get(p);
                    if (s === undefined) stop.set(p, s = !!(p.querySelector(side) || p.getBoundingClientRect().width >= innerWidth * 0.72));
                    if (s) break;
                    top = p;
                }
                return top;
            };
            const hide = t => { if (!t.classList.contains('vp-gal-hidden')) t.classList.add('vp-gal-hidden'); };
            document.querySelectorAll('.' + [SELECTORS.tabs, SELECTORS.feedBar, SELECTORS.banner, SELECTORS.post, SELECTORS.notification].join(', .'))
                .forEach(e => { if (e.closest('.vp-sw-stage')) return; const t = up(e); if (!t.closest('.vp-gal, .vp-msgs, nav')) hide(t); });
            const win = gal.el || document.querySelector('.vp-msgs.vp-open:not(.vp-sw-stage *)');
            const root = document.getElementById('root');
            const r = win && win.getBoundingClientRect();
            if (!r || !r.width || !root || performance.now() - (galHideFeed.at || 0) < 400) return;
            galHideFeed.at = performance.now();
            for (const [fx, fy] of [[.5, .25], [.5, .6], [.3, .45], [.7, .45]]) {
                for (const e of document.elementsFromPoint(r.left + r.width * fx, r.top + r.height * fy)) {
                    if (!root.contains(e) || e === root || e.closest('.vp-gal, .vp-msgs, nav, ' + side)) continue;
                    if (e.querySelector(side)) break;
                    if (getComputedStyle(e).position === 'fixed') continue;
                    const t = up(e);
                    if (t !== root && !t.closest('.vp-gal, .vp-msgs, nav')) hide(t);
                    break;
                }
            }
        }
        onDom(function galFeedHidden() { if (gal.el || msgsOpen) galHideFeed(true); });
        function openGallery(fromHistory) {
            if (gal.el) return;
            const lead = fromHistory === true ? null : tabSlide.lead('gal');
            openGalleryNow(fromHistory);
            tabSlide.arrive(lead, gal.el);
        }
        function openGalleryNow(fromHistory) {
            const msgs = document.querySelector('.vp-msgs.vp-open:not(.vp-sw-stage *)');
            if (msgs && msgs.close) msgs.close(true);
            const kept = gal.kept;
            const el = kept || document.createElement('div');
            if (!kept) {
                el.className = 'vp-gal';
                el.innerHTML = `<div class="vp-gal-top"><div class="vp-gal-tabs"><div class="vp-gal-ind"></div>${GAL_TABS.map(([id, name]) => `<button type="button" class="vp-gal-tab" data-tab="${id}">${name}</button>`).join('')}</div>
            </div><div class="vp-gal-card"><div class="vp-gal-body"><div class="vp-gal-grid"></div><div class="vp-gal-more"></div></div></div>`;
            }
            document.body.appendChild(el);
            gal.el = el;
            gal.kept = null;
            galRO.observe(el.querySelector('.vp-gal-grid'));
            galOpen = true;
            gal.path = location.pathname;
            galPosition();
            addEventListener('resize', galPosition);
            document.documentElement.classList.add('vp-gal-open');
            galOpen = true;
            galHideFeed(true);
            markActiveNav(); moveNavBlob();
            if (fromHistory !== true) overlayEnter('vpGal');
            const logo = document.querySelector('.' + SELECTORS.feedBar + ' .my-nav-block');
            const top = el.querySelector('.vp-gal-top'), old = top.querySelector('.my-nav-block');
            if (logo && !old) {
                const copy = logo.cloneNode(true);
                copy.classList.add('vp-gal-logo');
                copy.style.cssText = '';
                top.prepend(copy);
            }
            const body = el.querySelector('.vp-gal-body');
            if (kept) {
                body.scrollTop = gal.scroll || 0;
                el.querySelectorAll('.vp-gal-strip').forEach(st => { if (st._vpI) st.scrollLeft = st._vpI * st.clientWidth; });
                galInd();
                return;
            }
            el.querySelectorAll('.vp-gal-tab').forEach(b => b.onclick = () => { if (b.dataset.tab !== gal.tab || !gal.seen.size) galSwitch(b.dataset.tab); });
            galVolUi(top);
            body.addEventListener('scroll', () => { if (galNeedMore()) galLoad(); else galPrefetch(); }, { passive: true });
            for (const t of ['wheel', 'touchmove']) el.addEventListener(t, e => e.stopPropagation(), { passive: true });
            galSwitch(gal.tab);
        }
        function galRefresh() {
            if (!gal.el) return openGallery();
            galSwitch(gal.tab, true);
        }
        function closeGallery(fromBack) {
            if (!gal.el) return;
            gal.el.querySelectorAll('video').forEach(v => v.pause());
            gal.scroll = gal.el.querySelector('.vp-gal-body').scrollTop;
            gal.el.remove();
            gal.kept = gal.el;
            gal.el = null;
            removeEventListener('resize', galPosition);
            document.documentElement.classList.remove('vp-gal-open');
            galOpen = false;
            galHideFeed(false);
            placeSidebar(); placeRail();
            document.querySelectorAll('.vp-gal-navwrap').forEach(w => w.classList.remove('vp-gal-navwrap'));
            markActiveNav(); moveNavBlob();
            if (!fromBack && overlayAt('vpGal')) history.back();
        }
        addEventListener('popstate', () => {
            if (overlayAt('vpGal')) { if (!gal.el) openGallery(true); }
            else if (gal.el) closeGallery(true);
        });
        const galLeft = () => { if (gal.el && location.pathname !== gal.path) closeGallery(true); };
        onDom(galLeft);
        document.addEventListener('vp-loc', galLeft);
        document.addEventListener('click', e => {
            if (!gal.el) return;
            const a = e.target.closest && e.target.closest('a.' + SELECTORS.navLink);
            if (!a || a.classList.contains('vp-gal-nav')) return;
            if (a.getAttribute('href') === gal.path) { e.preventDefault(); e.stopPropagation(); closeGallery(); }
            else closeGallery(true);
        }, true);
        addEventListener('keydown', e => { if (e.key === 'Escape' && gal.el) closeGallery(); });
        const galRO = new ResizeObserver(() => {
            if (!gal.el) return;
            if (gal.cols.length && galColsCount() !== gal.cols.length) galLayout();
            galMore();
        });
        onDom(function galleryButton() {
            const bar = siteEl('feedBar');
            if (!bar || bar.querySelector('.vp-gal-btn')) return;
            const tabs = bar.querySelector('.' + SELECTORS.tabs);
            const search = [...bar.querySelectorAll('button, a')].reverse().find(b => b.querySelector('svg') && !b.textContent.trim() && !(tabs && tabs.contains(b)) && !b.closest('.my-nav-block'));
            if (!search) return;
            const b = document.createElement('button');
            b.type = 'button';
            b.className = (search.className || '') + ' vp-gal-btn';
            b.title = 'Галерея';
            b.setAttribute('aria-label', 'Галерея');
            b.innerHTML = galIcon(22);
            b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); gal.el ? galRefresh() : openGallery(); });
            search.before(b);
        });
        onDom(function galleryNav() {
            const search = document.querySelector('nav a[href="/search"]');
            if (!search || search.parentElement.querySelector('.vp-gal-nav')) return;
            const a = search.cloneNode(true);
            a.setAttribute('href', '#gallery');
            a.classList.add('vp-gal-nav');
            a.classList.remove('vp-active');
            const icon = a.querySelector('svg'), label = [...a.querySelectorAll('span')].find(sp => !sp.children.length && sp.textContent.trim());
            if (icon) icon.outerHTML = galIcon(24);
            if (label) label.textContent = 'Галерея';
            a.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); gal.el ? galRefresh() : openGallery(); }, true);
            search.before(a);
        });

