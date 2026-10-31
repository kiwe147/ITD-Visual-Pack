        const MASCOT = { file: 'mascot3.webp', cache: 'mascot-3@1', ratio: 800 / 737 };
        const MASCOT_SAYS = ['Арра-Ара~', 'Миу', 'Мяу', 'Мь?', 'Мя', 'Мур'];
        const MASCOT_CSS = `
        .vp-mas { position: absolute; left: 62%; bottom: 3%; width: 36%; aspect-ratio: ${MASCOT.ratio}; z-index: 6; pointer-events: none; user-select: none; -webkit-tap-highlight-color: transparent; animation: vpMasIn .9s cubic-bezier(.2, .9, .3, 1.1) both; }
        .vp-mas-shadow { position: absolute; left: 4%; right: -4%; bottom: -2%; height: 13%; border-radius: 50%; background: radial-gradient(closest-side, rgba(12, 4, 24, .6), rgba(12, 4, 24, 0)); pointer-events: none; }
        .vp-mas-pic { position: relative; width: 100%; height: 100%; background: var(--vp-mas-img) center / 100% 100% no-repeat; filter: brightness(.84) saturate(.8) contrast(1.05); transform-origin: 55% 100%; }
        .vp-mas-tint { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: soft-light; animation: vpMasFlick 3.4s ease-in-out infinite alternate;
            -webkit-mask: var(--vp-mas-img) center / 100% 100% no-repeat; mask: var(--vp-mas-img) center / 100% 100% no-repeat;
            background: linear-gradient(90deg, rgba(255, 150, 55, .75), rgba(255, 150, 55, 0) 62%), linear-gradient(180deg, rgba(125, 80, 200, .35), rgba(70, 35, 120, .5)); }
        html.vp-mas-hover, html.vp-mas-hover * { cursor: pointer !important; }
        .vp-mas-say { position: absolute; left: 76%; bottom: 97%; translate: -50% 0; padding: .45cqw 1.1cqw; border: max(1.5px, .16cqw) solid #2a170f; border-radius: 1.2cqw; background: #fff1d6; color: #3a2210; font-weight: 700; font-size: max(12px, 1.7cqw); line-height: 1.2; white-space: nowrap; pointer-events: none;
            box-shadow: 0 .3cqw .8cqw rgba(0, 0, 0, .35); opacity: 0; transform: translateY(30%) scale(.7); transform-origin: 50% 100%; transition: opacity .35s ease, transform .5s cubic-bezier(.2, .9, .3, 1.15); }
        .vp-mas-say::after { content: ""; position: absolute; left: 50%; top: 100%; width: .9cqw; height: .9cqw; translate: -50% -55%; rotate: 45deg; background: #fff1d6; border: max(1.5px, .16cqw) solid #2a170f; border-top: 0; border-left: 0; }
        .vp-mas-say.vp-on { opacity: 1; transform: none; }
        .vp-mas.vp-hop .vp-mas-pic { animation: vpMasHop .8s ease-in-out; }
        @keyframes vpMasIn { from { opacity: 0; translate: 0 8%; } }
        @keyframes vpMasHop { 0%, 100% { transform: none; } 30% { transform: translateY(-4%) scale(.985, 1.015); } 62% { transform: translateY(0) scale(1.015, .985); } 82% { transform: scale(.998, 1.004); } }
        @keyframes vpMasFlick { from { opacity: .8; } to { opacity: 1; } }
        @media (orientation: portrait), (prefers-reduced-motion: reduce) { .vp-mas { animation: none; } .vp-mas-tint { animation: none; } }
        @media (orientation: portrait) { .vp-mas { display: none; } }`;
        let mascotUrl = '', mascotLoading = false, mascotLast = -1, mascotMask = null;
        function mascotMaskBuild(url) {
            const im = new Image();
            im.onload = () => {
                const w = 200, h = Math.round(w / MASCOT.ratio), c = document.createElement('canvas');
                c.width = w; c.height = h;
                const g = c.getContext('2d', { willReadFrequently: true });
                g.drawImage(im, 0, 0, w, h);
                try { mascotMask = { w, h, a: g.getImageData(0, 0, w, h).data }; } catch (e) { logErr('маскот', e); }
            };
            im.src = url;
        }
        function mascotHit(d, e) {
            const pic = mascotMask && d.querySelector('.vp-mas-pic');
            if (!pic) return false;
            const r = pic.getBoundingClientRect();
            if (e.clientX < r.left || e.clientX >= r.right || e.clientY < r.top || e.clientY >= r.bottom) return false;
            const x = Math.floor((e.clientX - r.left) / r.width * mascotMask.w), y = Math.floor((e.clientY - r.top) / r.height * mascotMask.h);
            return mascotMask.a[(y * mascotMask.w + x) * 4 + 3] > 60;
        }
        async function mascotBlob() {
            const have = await palStore(MASCOT.cache).catch(() => null);
            if (have) return have;
            for (const branch of ['claude/github-script-access-ihd9ne', 'main']) {
                const b = await palFetch(`https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/${branch}/assets/${MASCOT.file}`).catch(() => null);
                if (b) { await palStore(MASCOT.cache, b).catch(() => { }); return b; }
            }
            return null;
        }
        function mascotSay(el) {
            let i;
            do i = Math.floor(Math.random() * MASCOT_SAYS.length); while (i === mascotLast && MASCOT_SAYS.length > 1);
            mascotLast = i;
            const say = el.querySelector('.vp-mas-say');
            say.textContent = MASCOT_SAYS[i];
            say.classList.add('vp-on');
            el.classList.remove('vp-hop'); el.offsetWidth; el.classList.add('vp-hop');
            clearTimeout(say._t);
            say._t = setTimeout(() => say.classList.remove('vp-on'), 2300);
        }
        function mascotInjectToggle(d) {
            let dlg = null;
            for (const x of d.querySelectorAll('dialog.dialog')) {
                const label = (x.getAttribute('aria-label') || '').trim();
                const h2 = x.querySelector('h2');
                const title = h2 ? h2.textContent.trim() : '';
                if (label === 'Звук и эффекты' || title === 'Звук и эффекты') { dlg = x; break; }
            }
            if (!dlg) return;
            const content = dlg.querySelector('.dialog-content');
            if (!content || content.querySelector('.vp-mas-toggle')) return;
            const label = d.createElement('label');
            label.className = 'toggle-line vp-mas-toggle';
            const span = d.createElement('span');
            const strong = d.createElement('strong');
            strong.textContent = 'Фурри поняшка';
            const small = d.createElement('small');
            small.textContent = 'Маскот ИТД X у камина на сцене ивента';
            span.appendChild(strong); span.appendChild(small);
            const input = d.createElement('input');
            input.type = 'checkbox';
            input.checked = !!GM_getValue('mascotOn', true);
            input.addEventListener('change', () => {
                const on = !!input.checked;
                GM_setValue('mascotOn', on);
                for (const fr of document.querySelectorAll('iframe')) {
                    let dd = null;
                    try { dd = fr.contentDocument; } catch (e) { }
                    const m = dd && dd.querySelector('.vp-mas');
                    if (!on && m) m.remove();
                }
                if (on) mascotPlace();
            });
            label.appendChild(span); label.appendChild(input);
            content.appendChild(label);
        }
        function mascotPlace() {
            for (const fr of document.querySelectorAll('iframe')) {
                let d = null;
                try { d = fr.contentDocument; } catch (e) { }
                if (d) mascotInjectToggle(d);
            }
            if (!GM_getValue('mascotOn', true) || !/^\/event\/[^/]/.test(location.pathname)) return;
            for (const fr of document.querySelectorAll('iframe')) {
                let d = null;
                try { d = fr.contentDocument; } catch (e) { }
                const stage = d && d.querySelector('.room-stage');
                if (!stage || stage.querySelector(':scope > .vp-mas')) continue;
                if (!mascotUrl) {
                    if (mascotLoading) return;
                    mascotLoading = true;
                    mascotBlob().then(b => { if (b) { mascotUrl = URL.createObjectURL(b); mascotMaskBuild(mascotUrl); } }).catch(e => logErr('маскот', e)).finally(() => { mascotLoading = false; });
                    return;
                }
                if (!d.getElementById('vp-mas-css')) { const st = d.createElement('style'); st.id = 'vp-mas-css'; st.textContent = MASCOT_CSS; d.head.appendChild(st); }
                const el = d.createElement('div');
                el.className = 'vp-mas';
                el.style.setProperty('--vp-mas-img', `url("${mascotUrl}")`);
                el.innerHTML = '<div class="vp-mas-shadow"></div><div class="vp-mas-pic"></div><div class="vp-mas-tint"></div><div class="vp-mas-say"></div>';
                stage.appendChild(el);
                if (!d._vpMas) {
                    d._vpMas = true;
                    const masHit = (doc, ev) => {
                        const m = doc.querySelector('.vp-mas');
                        if (!m || !m.isConnected) return null;
                        if (doc.querySelector('.vp-hunt.vp-open')) return null;
                        const t = ev.target;
                        if (t && t.closest && t.closest('.vp-hunt')) return null;
                        return mascotHit(doc, ev) ? m : null;
                    };
                    d.addEventListener('click', e => { const m = masHit(d, e); if (m) { e.stopPropagation(); e.preventDefault(); mascotSay(m); } }, true);
                    d.addEventListener('pointermove', e => { const on = !!masHit(d, e); if (on !== d.documentElement.classList.contains('vp-mas-hover')) d.documentElement.classList.toggle('vp-mas-hover', on); }, true);
                }
            }
        }
        setInterval(mascotPlace, 900);
