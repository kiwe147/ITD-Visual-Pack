        addCss(`
        .vp-evw { position: relative; flex: 0 0 auto; width: 168px; height: 168px; margin: -6px 0 2px; color: var(--vp-accent, #0080ff); pointer-events: none; }
        .vp-evw + span { display: none !important; }
        .vp-evw-glow { position: absolute; left: 50%; top: 50%; width: 120px; height: 120px; margin: -60px 0 0 -60px; border-radius: 50%;
            background: radial-gradient(circle, color-mix(in srgb, currentColor 60%, transparent) 0%, color-mix(in srgb, currentColor 22%, transparent) 40%, transparent 70%);
            animation: vpEvwGlow 2.8s ease-in-out infinite; }
        .vp-evw svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
        .vp-evw svg g, .vp-evw svg circle { transform-origin: 0 0; }
        .vp-evw .vp-evw-s1 { animation: vpEvwSpin 26s linear infinite; }
        .vp-evw .vp-evw-s2 { animation: vpEvwSpinR 20s linear infinite; }
        .vp-evw .vp-evw-s3 { animation: vpEvwSpin 7s linear infinite; }
        .vp-evw .vp-evw-orb { animation: vpEvwBreath 2.8s ease-in-out infinite; }
        .vp-evw .vp-evw-flash { opacity: 0; animation: vpEvwFlash 9s ease-out infinite; }
        .vp-evw .vp-evw-wave { opacity: 0; vector-effect: non-scaling-stroke; animation: vpEvwWave 4.8s cubic-bezier(.2, .6, .3, 1) infinite; }
        .vp-evw .vp-evw-wave.vp-evw-w2 { animation-delay: -2.4s; }
        .vp-evw .vp-evw-p1 { animation: vpEvwSpin 11s linear infinite; }
        .vp-evw .vp-evw-p2 { animation: vpEvwSpinR 15s linear -4s infinite; }
        .vp-evw .vp-evw-p3 { animation: vpEvwSpin 9s linear -2s infinite; }
        .vp-evw .vp-evw-p4 { animation: vpEvwSpinR 19s linear -9s infinite; }
        .vp-evw .vp-evw-p5 { animation: vpEvwSpin 13s linear -7s infinite; }
        .vp-evw .vp-evw-p1 circle, .vp-evw .vp-evw-p3 circle, .vp-evw .vp-evw-p5 circle { animation: vpEvwTwinkle 2.1s ease-in-out infinite; }
        .vp-evw .vp-evw-p2 circle, .vp-evw .vp-evw-p4 circle { animation: vpEvwTwinkle 3.3s ease-in-out -1s infinite; }
        @keyframes vpEvwSpin { to { transform: rotate(360deg); } }
        @keyframes vpEvwSpinR { to { transform: rotate(-360deg); } }
        @keyframes vpEvwBreath { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.22); } }
        @keyframes vpEvwGlow { 0%, 100% { opacity: .55; transform: scale(.88); } 50% { opacity: 1; transform: scale(1.12); } }
        @keyframes vpEvwTwinkle { 0%, 100% { opacity: .25; } 50% { opacity: 1; } }
        @keyframes vpEvwFlash { 0%, 84%, 100% { opacity: 0; transform: scale(1); } 90% { opacity: .85; transform: scale(2.2); } }
        @keyframes vpEvwWave { 0% { transform: scale(1); opacity: .65; } 100% { transform: scale(7.6); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .vp-evw, .vp-evw * { animation: none !important; } .vp-evw .vp-evw-wave, .vp-evw .vp-evw-flash { opacity: 0 !important; } }
        `);
        const EVW_HTML = '<i class="vp-evw-glow"></i><svg viewBox="-84 -84 168 168">'
            + '<circle class="vp-evw-wave" r="10" fill="none" stroke="currentColor" stroke-width="1.2"/>'
            + '<circle class="vp-evw-wave vp-evw-w2" r="10" fill="none" stroke="currentColor" stroke-width="1.2"/>'
            + '<g class="vp-evw-s1"><circle r="26" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="2 7" opacity=".8"/></g>'
            + '<g class="vp-evw-s2"><circle r="42" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="22 14" opacity=".55"/></g>'
            + '<g class="vp-evw-s3"><circle r="60" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="52 325" opacity=".9"/></g>'
            + '<g class="vp-evw-p1"><circle cx="34" r="1.6" fill="currentColor"/></g>'
            + '<g class="vp-evw-p2"><circle cx="50" r="1.4" fill="currentColor"/></g>'
            + '<g class="vp-evw-p3"><circle cx="26" r="1.3" fill="currentColor"/></g>'
            + '<g class="vp-evw-p4"><circle cx="58" r="1.8" fill="currentColor"/></g>'
            + '<g class="vp-evw-p5"><circle cx="44" r="1.5" fill="currentColor"/></g>'
            + '<circle class="vp-evw-flash" r="12" fill="currentColor"/>'
            + '<g class="vp-evw-orb"><circle r="7" fill="currentColor"/><circle r="3" fill="#fff" opacity=".9"/></g></svg>';
        const EVW_TITLE = /^\s*нет активного ивента\s*$/i;
        onDom(function eventWait() {
            document.querySelectorAll('.vp-evw').forEach(e => {
                const h = e.parentElement && e.parentElement.querySelector(':scope > h1');
                if (!h || !EVW_TITLE.test(h.textContent)) e.remove();
            });
            document.querySelectorAll('h1').forEach(h => {
                if (!EVW_TITLE.test(h.textContent) || h.closest('.vp-sw-stage')) return;
                const box = h.parentElement;
                if (!box || box.querySelector(':scope > .vp-evw')) return;
                const wrap = document.createElement('div');
                wrap.className = 'vp-evw';
                wrap.setAttribute('aria-hidden', 'true');
                wrap.innerHTML = EVW_HTML;
                box.insertBefore(wrap, box.firstChild);
            });
        });
