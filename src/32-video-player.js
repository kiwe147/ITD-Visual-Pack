        const VP_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
        const vpSvg = (body, w = 20) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
        const VP_ICO = {
            play: vpSvg('<path d="M8 5.6v12.8a.8.8 0 0 0 1.2.7l10.2-6.4a.8.8 0 0 0 0-1.4L9.2 4.9a.8.8 0 0 0-1.2.7Z" fill="currentColor" stroke="none"/>'),
            pause: vpSvg('<rect x="6.2" y="5" width="4" height="14" rx="1.3" fill="currentColor" stroke="none"/><rect x="13.8" y="5" width="4" height="14" rx="1.3" fill="currentColor" stroke="none"/>'),
            vol: vpSvg('<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4Z" fill="currentColor" stroke="none"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>'),
            low: vpSvg('<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4Z" fill="currentColor" stroke="none"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6"/>'),
            mute: vpSvg('<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4Z" fill="currentColor" stroke="none"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
            full: vpSvg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
            pip: vpSvg('<rect x="3" y="5" width="18" height="14" rx="3"/><rect x="12" y="11.5" width="7" height="5" rx="1.4" fill="currentColor" stroke="none"/>'),
            back: vpSvg('<path d="M4 12a8 8 0 1 0 2.6-5.9L4 8.5"/><path d="M4 4v4.5h4.5"/>', 22),
            fwd: vpSvg('<path d="M20 12a8 8 0 1 1-2.6-5.9L20 8.5"/><path d="M20 4v4.5h-4.5"/>', 22)
        };
        const vpTime = s => {
            if (!Number.isFinite(s) || s < 0) s = 0;
            const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = String(Math.floor(s % 60)).padStart(2, '0');
            return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`;
        };
        const vpSiteBtn = (box, re) => [...box.querySelectorAll('button[aria-label]')].find(b => !b.closest('.vp-vbar') && re.test(b.getAttribute('aria-label')));
        let vpActive = null, vpRate = +GM_getValue('vpPlayerRate', 1) || 1;
        function vpBuild(box, video) {
            const bar = document.createElement('div');
            bar.className = 'vp-vbar';
            bar.innerHTML = '<div class="vp-vprog"><div class="vp-vbuf"></div><div class="vp-vfill"></div><div class="vp-vknob"></div><div class="vp-vtip">0:00</div></div>'
                + '<div class="vp-vrow"><button type="button" class="vp-vb vp-vplay" title="Пауза / играть (пробел)"></button>'
                + '<button type="button" class="vp-vb vp-vskip" data-s="-10" title="Назад на 10 секунд">' + VP_ICO.back + '<i>10</i></button>'
                + '<button type="button" class="vp-vb vp-vskip" data-s="10" title="Вперёд на 10 секунд">' + VP_ICO.fwd + '<i>10</i></button>'
                + '<span class="vp-vvol"><button type="button" class="vp-vb vp-vmute" title="Звук (M)"></button><input type="range" class="vp-vrange" min="0" max="1" step="0.02" title="Громкость"></span>'
                + '<span class="vp-vtime"><b>0:00</b><u>/</u><i>0:00</i></span><span class="vp-vgap"></span>'
                + '<span class="vp-vspd"><button type="button" class="vp-vb vp-vrate" title="Скорость"></button><div class="vp-vmenu"></div></span>'
                + '<button type="button" class="vp-vb vp-vpip" title="Картинка в картинке"></button>'
                + '<button type="button" class="vp-vb vp-vfull" title="Во весь экран (F)"></button></div>';
            const flash = document.createElement('div');
            flash.className = 'vp-vflash';
            box.append(bar, flash);
            const q = s => bar.querySelector(s);
            const prog = q('.vp-vprog'), fill = q('.vp-vfill'), buf = q('.vp-vbuf'), knob = q('.vp-vknob'), tip = q('.vp-vtip'), playB = q('.vp-vplay'), muteB = q('.vp-vmute'), range = q('.vp-vrange');
            const timeNow = q('.vp-vtime b'), timeAll = q('.vp-vtime i'), rateB = q('.vp-vrate'), menu = q('.vp-vmenu'), pipB = q('.vp-vpip'), fullB = q('.vp-vfull');
            pipB.innerHTML = VP_ICO.pip;
            fullB.innerHTML = VP_ICO.full;
            let hideT = 0, scrub = false, lastTouch = 0, raf = 0;
            const dur = () => Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
            const paint = () => {
                const d = dur(), p = d ? video.currentTime / d : 0;
                fill.style.width = (p * 100) + '%';
                knob.style.left = (p * 100) + '%';
                timeNow.textContent = vpTime(video.currentTime);
                timeAll.textContent = vpTime(d);
                if (d && video.buffered.length) { let e = 0; for (let i = 0; i < video.buffered.length; i++) if (video.buffered.start(i) <= video.currentTime + 0.5) e = Math.max(e, video.buffered.end(i)); buf.style.width = Math.min(100, e / d * 100) + '%'; }
            };
            const loop = () => { raf = 0; paint(); if (!video.paused && box.classList.contains('vp-vshow') && box.isConnected) raf = requestAnimationFrame(loop); };
            const tick = () => { if (!raf) raf = requestAnimationFrame(loop); };
            const state = () => {
                playB.innerHTML = video.paused ? VP_ICO.play : VP_ICO.pause;
                playB.setAttribute('aria-label', video.paused ? 'Играть' : 'Пауза');
                const v = video.muted ? 0 : video.volume;
                muteB.innerHTML = v === 0 ? VP_ICO.mute : v < 0.5 ? VP_ICO.low : VP_ICO.vol;
                range.value = v;
                range.style.setProperty('--vp-v', (v * 100) + '%');
                rateB.textContent = (video.playbackRate === 1 ? '1' : String(video.playbackRate)) + '×';
                menu.querySelectorAll('button').forEach(b => b.classList.toggle('vp-on', +b.dataset.r === video.playbackRate));
                pipB.hidden = !(document.pictureInPictureEnabled && video.requestPictureInPicture);
                paint();
            };
            const reveal = () => {
                box.classList.add('vp-vshow');
                clearTimeout(hideT);
                tick();
                hideT = setTimeout(() => { if (!video.paused && !scrub && !menu.classList.contains('vp-open') && !bar.matches(':hover')) box.classList.remove('vp-vshow'); }, 2400);
            };
            const sync = () => { state(); if (video.paused) { box.classList.add('vp-vshow'); clearTimeout(hideT); } else reveal(); };
            ['timeupdate', 'durationchange', 'loadedmetadata', 'progress', 'play', 'pause', 'volumechange', 'ratechange', 'seeked', 'emptied'].forEach(t => video.addEventListener(t, t === 'play' || t === 'pause' ? sync : state));
            video.addEventListener('play', () => { if (Date.now() - lastTouch < 600) { flash.innerHTML = VP_ICO.pause; flash.classList.remove('vp-go'); void flash.offsetWidth; flash.classList.add('vp-go'); } });
            video.addEventListener('pause', () => { if (Date.now() - lastTouch < 600) { flash.innerHTML = VP_ICO.play; flash.classList.remove('vp-go'); void flash.offsetWidth; flash.classList.add('vp-go'); } });
            ['click', 'dblclick', 'pointerdown', 'mousedown', 'touchstart', 'contextmenu'].forEach(t => bar.addEventListener(t, e => { e.stopPropagation(); if (t === 'pointerdown') { lastTouch = Date.now(); reveal(); } }));
            bar.addEventListener('click', e => { const b = e.target.closest('button'); if (b) b.blur(); });
            box.addEventListener('pointermove', reveal);
            box.addEventListener('pointerdown', () => { vpActive = video; lastTouch = Date.now(); reveal(); }, true);
            box.addEventListener('pointerleave', () => { if (!video.paused && !scrub) { clearTimeout(hideT); hideT = setTimeout(() => { if (!bar.matches(':hover')) box.classList.remove('vp-vshow'); }, 600); } });
            const toggle = () => { lastTouch = Date.now(); const b = vpSiteBtn(box, /^(pause|play)$/i); if (b) b.click(); else if (video.paused) video.play().catch(() => { }); else video.pause(); };
            video.vpToggle = toggle;
            playB.addEventListener('click', toggle);
            bar.querySelectorAll('.vp-vskip').forEach(b => b.addEventListener('click', () => { const d = dur(); video.currentTime = Math.max(0, Math.min(d || 1e9, video.currentTime + +b.dataset.s)); paint(); }));
            muteB.addEventListener('click', () => { const b = vpSiteBtn(box, /^(mute|unmute)$/i); if (b) b.click(); else video.muted = !video.muted; setTimeout(state, 0); });
            range.addEventListener('input', () => {
                const v = +range.value;
                video.volume = v;
                try { localStorage.setItem('video-volume', String(v)); } catch (e) { }
                const b = vpSiteBtn(box, /^(mute|unmute)$/i);
                if ((v > 0 && video.muted) || (v === 0 && !video.muted)) { if (b) b.click(); else video.muted = v === 0; }
                state();
            });
            fullB.addEventListener('click', () => { const b = vpSiteBtn(box, /^fullscreen$/i); if (b) b.click(); else if (document.fullscreenElement) document.exitFullscreen(); else box.requestFullscreen && box.requestFullscreen(); });
            pipB.addEventListener('click', () => { if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => { }); else video.requestPictureInPicture().catch(() => { }); });
            VP_RATES.forEach(r => { const b = document.createElement('button'); b.type = 'button'; b.dataset.r = r; b.textContent = r + '×'; b.addEventListener('click', () => { video.playbackRate = r; vpRate = r; GM_setValue('vpPlayerRate', r); menu.classList.remove('vp-open'); }); menu.appendChild(b); });
            rateB.addEventListener('click', () => { menu.classList.toggle('vp-open'); reveal(); });
            document.addEventListener('pointerdown', e => { if (menu.classList.contains('vp-open') && !e.target.closest('.vp-vspd')) menu.classList.remove('vp-open'); }, true);
            const seekAt = x => { const r = prog.getBoundingClientRect(), d = dur(); if (!d || r.width <= 0) return; const p = Math.max(0, Math.min(1, (x - r.left) / r.width)); video.currentTime = d * p; paint(); };
            prog.addEventListener('pointerdown', e => {
                e.stopPropagation();
                scrub = true; box.classList.add('vp-vscrub');
                try { prog.setPointerCapture(e.pointerId); } catch (x) { }
                seekAt(e.clientX);
                const mv = ev => { seekAt(ev.clientX); tipAt(ev.clientX); };
                const up = () => { scrub = false; box.classList.remove('vp-vscrub'); prog.removeEventListener('pointermove', mv); prog.removeEventListener('pointerup', up); prog.removeEventListener('pointercancel', up); reveal(); };
                prog.addEventListener('pointermove', mv); prog.addEventListener('pointerup', up); prog.addEventListener('pointercancel', up);
            });
            const tipAt = x => { const r = prog.getBoundingClientRect(), d = dur(); if (!d || r.width <= 0) return; const p = Math.max(0, Math.min(1, (x - r.left) / r.width)); tip.textContent = vpTime(d * p); tip.style.left = Math.max(22, Math.min(r.width - 22, p * r.width)) + 'px'; };
            prog.addEventListener('pointermove', e => tipAt(e.clientX));
            video.playbackRate = vpRate;
            box.classList.add('vp-vp-ready');
            let touched = [], fitRaf = 0;
            const unfit = () => {
                touched.forEach(e => ['overflow', 'margin-left', 'margin-right'].forEach(k => e.style.removeProperty(k)));
                touched = [];
                box.classList.remove('vp-vwide', 'vp-vtight');
                box.style.removeProperty('--vp-bw');
                box.style.removeProperty('--vp-bl');
            };
            const overflows = () => { const row = q('.vp-vrow'); return row.scrollWidth > row.clientWidth + 1; };
            const fit = () => {
                fitRaf = 0;
                if (!box.isConnected || document.fullscreenElement === box) return;
                unfit();
                let host = box.parentElement;
                while (host && host !== document.body && host.clientWidth <= box.clientWidth + 8) host = host.parentElement;
                const wide = host && host !== document.body && host.clientWidth > box.clientWidth + 8;
                if (wide) {
                    const par = box.parentElement;
                    par.style.setProperty('margin-left', 'auto', 'important');
                    par.style.setProperty('margin-right', 'auto', 'important');
                    touched.push(par);
                }
                if (wide && overflows()) {
                    for (let e = box.parentElement; e && e !== host; e = e.parentElement) { e.style.setProperty('overflow', 'visible', 'important'); if (!touched.includes(e)) touched.push(e); }
                    const hr = host.getBoundingClientRect();
                    box.style.setProperty('--vp-bw', Math.floor(hr.width) + 'px');
                    box.style.setProperty('--vp-bl', Math.round(hr.left - box.getBoundingClientRect().left) + 'px');
                    box.classList.add('vp-vwide');
                }
                if (overflows()) box.classList.add('vp-vtight');
            };
            const refit = () => { if (!fitRaf) fitRaf = requestAnimationFrame(fit); };
            if (window.ResizeObserver) new ResizeObserver(refit).observe(box);
            video.addEventListener('loadedmetadata', refit);
            addEventListener('resize', refit);
            refit();
            state();
            if (video.paused) box.classList.add('vp-vshow');
            box.vpDestroy = () => { clearTimeout(hideT); if (raf) cancelAnimationFrame(raf); bar.remove(); flash.remove(); unfit(); removeEventListener('resize', refit); box.classList.remove('vp-vp', 'vp-vp-ready', 'vp-vshow', 'vp-vscrub', 'vp-vp-rel'); };
        }
        onDom(function videoPlayers() {
            document.querySelectorAll('.vp-vp').forEach(box => { if (!box.isConnected || !vpSiteBtn(box, /^(pause|play)$/i)) { if (box.vpDestroy) box.vpDestroy(); } });
            document.querySelectorAll('video').forEach(video => {
                const box = video.parentElement;
                if (!box || box.classList.contains('vp-vp') || video.closest('.vp-gal, .vp-msgs, .vp-sw-stage, .vpi-overlay, .vp-bg-media, .vp-call-audio, .vp-msgs-lb')) return;
                const play = vpSiteBtn(box, /^(pause|play)$/i), full = vpSiteBtn(box, /^fullscreen$/i);
                if (!play || !full) return;
                box.classList.add('vp-vp');
                if (getComputedStyle(box).position === 'static') box.classList.add('vp-vp-rel');
                play.parentElement.classList.add('vp-site-ctl');
                vpBuild(box, video);
            });
        });
        document.addEventListener('keydown', e => {
            if (e.ctrlKey || e.metaKey || e.altKey || !e.target.closest) return;
            if (e.target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]') && !e.target.closest('.vp-vrange')) return;
            const box = [...document.querySelectorAll('.vp-vp-ready')].find(b => b.matches(':hover')) || (vpActive && vpActive.parentElement && vpActive.parentElement.classList.contains('vp-vp-ready') && vpActive.isConnected ? vpActive.parentElement : null);
            if (!box) return;
            const video = box.querySelector('video');
            const k = e.key, step = n => { video.currentTime = Math.max(0, Math.min(video.duration || 1e9, video.currentTime + n)); };
            if (k === ' ' || k === 'k' || k === 'К' || k === 'л') { if (e.target.closest('button, a')) return; e.preventDefault(); video.vpToggle(); }
            else if (k === 'ArrowLeft') { e.preventDefault(); step(-5); }
            else if (k === 'ArrowRight') { e.preventDefault(); step(5); }
            else if (k === 'j' || k === 'о') step(-10);
            else if (k === 'l' || k === 'д') step(10);
            else if (k === 'ArrowUp' || k === 'ArrowDown') {
                if (e.target.closest('.vp-vrange')) return;
                e.preventDefault();
                const v = Math.max(0, Math.min(1, (video.muted ? 0 : video.volume) + (k === 'ArrowUp' ? 0.1 : -0.1)));
                video.volume = v; try { localStorage.setItem('video-volume', String(v)); } catch (x) { }
                const b = vpSiteBtn(box, /^(mute|unmute)$/i);
                if ((v > 0 && video.muted) || (v === 0 && !video.muted)) { if (b) b.click(); else video.muted = v === 0; }
            }
            else if (k === 'm' || k === 'ь') { const b = vpSiteBtn(box, /^(mute|unmute)$/i); if (b) b.click(); else video.muted = !video.muted; }
            else if (k === 'f' || k === 'а') { const b = vpSiteBtn(box, /^fullscreen$/i); if (b) b.click(); }
            else if (k === '<' || k === '>') { const i = VP_RATES.indexOf(video.playbackRate), n = VP_RATES[Math.max(0, Math.min(VP_RATES.length - 1, (i < 0 ? 2 : i) + (k === '>' ? 1 : -1)))]; video.playbackRate = n; vpRate = n; GM_setValue('vpPlayerRate', n); }
            else return;
            box.classList.add('vp-vshow');
        }, true);
        addCss(`
        .vp-vp-rel { position: relative; }
        .vp-site-ctl { display: none !important; }
        .vp-vbar { position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; padding: 34px 12px 8px; box-sizing: border-box; color: #fff; user-select: none; -webkit-user-select: none;
            background: linear-gradient(to top, rgba(0, 0, 0, .78), rgba(0, 0, 0, .42) 55%, transparent); opacity: 0; transform: translateY(6px); pointer-events: none; transition: opacity .2s ease, transform .2s ease; }
        .vp-vp.vp-vwide { overflow: visible; }
        .vp-vp.vp-vwide .vp-vbar { right: auto; left: var(--vp-bl, 0px); width: var(--vp-bw); border-radius: 0 0 12px 12px; }
        .vp-vp.vp-vwide > video { border-radius: 12px; }
        .vp-vtight .vp-vskip, .vp-vtight .vp-vpip { display: none; }
        .vp-vp.vp-vshow .vp-vbar { opacity: 1; transform: none; pointer-events: auto; }
        .vp-vp.vp-vshow { cursor: default; }
        .vp-vp:not(.vp-vshow) { cursor: none; }
        .vp-vprog { position: relative; height: 18px; display: flex; align-items: center; cursor: pointer; touch-action: none; }
        .vp-vprog::before { content: ""; position: absolute; left: 0; right: 0; height: 4px; border-radius: 4px; background: rgba(255, 255, 255, .26); transition: height .12s ease; }
        .vp-vprog:hover::before, .vp-vscrub .vp-vprog::before { height: 6px; }
        .vp-vbuf, .vp-vfill { position: absolute; left: 0; height: 4px; border-radius: 4px; pointer-events: none; transition: height .12s ease; }
        .vp-vprog:hover .vp-vbuf, .vp-vprog:hover .vp-vfill, .vp-vscrub .vp-vbuf, .vp-vscrub .vp-vfill { height: 6px; }
        .vp-vbuf { background: rgba(255, 255, 255, .34); width: 0; }
        .vp-vfill { background: var(--vp-accent, #f91880); width: 0; }
        .vp-vknob { position: absolute; width: 14px; height: 14px; margin-left: -7px; border-radius: 50%; background: #fff; box-shadow: 0 1px 6px rgba(0, 0, 0, .5); transform: scale(0); transition: transform .12s ease; pointer-events: none; left: 0; }
        .vp-vprog:hover .vp-vknob, .vp-vscrub .vp-vknob { transform: scale(1); }
        .vp-vtip { position: absolute; bottom: 22px; transform: translateX(-50%); padding: 3px 8px; border-radius: 8px; font-size: 12px; font-variant-numeric: tabular-nums; background: rgba(20, 20, 20, .92); opacity: 0; pointer-events: none; transition: opacity .1s ease; white-space: nowrap; }
        .vp-vprog:hover .vp-vtip, .vp-vscrub .vp-vtip { opacity: 1; }
        .vp-vrow { display: flex; align-items: center; gap: 2px; margin-top: 2px; }
        .vp-vb { position: relative; display: inline-flex; align-items: center; justify-content: center; min-width: 36px; height: 36px; padding: 0 6px; border: 0; border-radius: 18px; background: transparent; color: #fff; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: background-color .15s ease, transform .1s ease; }
        .vp-vb:hover { background: rgba(255, 255, 255, .18); }
        .vp-vb:active { transform: scale(.92); }
        .vp-vb[hidden] { display: none; }
        .vp-vskip i { position: absolute; font-style: normal; font-size: 8.5px; font-weight: 700; top: 50%; left: 50%; transform: translate(-50%, -42%); pointer-events: none; }
        .vp-vvol { display: inline-flex; align-items: center; }
        .vp-vrange { -webkit-appearance: none; appearance: none; width: 0; opacity: 0; height: 4px; margin: 0; border-radius: 4px; outline: none; cursor: pointer; transition: width .18s ease, opacity .18s ease, margin .18s ease;
            background: linear-gradient(to right, #fff var(--vp-v, 100%), rgba(255, 255, 255, .3) var(--vp-v, 100%)); }
        .vp-vvol:hover .vp-vrange, .vp-vrange:focus-visible { width: 74px; opacity: 1; margin: 0 8px 0 4px; }
        .vp-vrange::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #fff; border: 0; box-shadow: 0 1px 4px rgba(0, 0, 0, .5); }
        .vp-vrange::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: #fff; border: 0; }
        .vp-vtime { font-size: 12.5px; font-variant-numeric: tabular-nums; margin: 0 4px 0 8px; white-space: nowrap; opacity: .92; }
        .vp-vtime u { text-decoration: none; opacity: .6; margin: 0 4px; }
        .vp-vtime i { font-style: normal; opacity: .75; }
        .vp-vtime b { font-weight: 600; }
        .vp-vgap { flex: 1; min-width: 4px; }
        .vp-vspd { position: relative; display: inline-flex; }
        .vp-vrate { min-width: 44px; }
        .vp-vmenu { position: absolute; right: 0; bottom: 44px; display: none; flex-direction: column; padding: 5px; border-radius: 14px; background: rgba(24, 24, 24, .96); box-shadow: 0 10px 28px rgba(0, 0, 0, .55); border: 1px solid rgba(255, 255, 255, .1); }
        .vp-vmenu.vp-open { display: flex; }
        .vp-vmenu button { border: 0; background: transparent; color: #fff; font: inherit; font-size: 13px; padding: 7px 16px; border-radius: 10px; text-align: center; cursor: pointer; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .vp-vmenu button:hover { background: rgba(255, 255, 255, .14); }
        .vp-vmenu button.vp-on { color: var(--vp-accent, #f91880); font-weight: 700; }
        .vp-vflash { position: absolute; left: 50%; top: 50%; width: 68px; height: 68px; margin: -34px 0 0 -34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, .55); color: #fff; opacity: 0; pointer-events: none; z-index: 5; }
        .vp-vflash svg { width: 30px; height: 30px; }
        .vp-vflash.vp-go { animation: vpVFlash .5s ease-out; }
        @keyframes vpVFlash { 0% { opacity: .95; transform: scale(.8); } 100% { opacity: 0; transform: scale(1.35); } }
        @media (hover: none) { .vp-vvol .vp-vrange, .vp-vskip { display: none; } .vp-vb { min-width: 40px; } }
        @media (max-width: 480px) { .vp-vtime { margin-left: 2px; } .vp-vpip { display: none; } }
        `);
