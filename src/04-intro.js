    const INTRO = {
        LOCK: [620, 1020, 1420],
        FLY: 520,
        SETTLE: 170,
        SHAKE: [4, 6, 9],
        VOLUME: 0.11,
        FROM: [{ ang: 200, rot: -110, sc: 1.8 }, { ang: 272, rot: 80, sc: 2.4 }, { ang: -12, rot: 130, sc: 1.6 }],
        X_DRAW: 170,
        X_GAP: 150,
        SPLIT: 380,
        IDLE: 3000,
        RARE: [[true, 0.05 / 3], ['assemble', 0.05 / 3], ['twist', 0.05 / 3]],
        RARE_HOLD: 550
    };
    INTRO.X = INTRO.LOCK[2] + 220;
    INTRO.EXIT = INTRO.X + INTRO.X_GAP + INTRO.X_DRAW + 380;
    function introPlan(rare) {
        if (rare === 'twist') {
            const LOCK = [620, 1020, 1760], FLY = [520, 520, 230];
            const BOUNCE = LOCK[1] + 250, WAVE = LOCK[2] + 330, X = WAVE + 420, STICK = X + 430;
            return { LOCK, FLY, BOUNCE, WAVE, X, STICK, X_DRAW: 0, X_GAP: 0, EXIT: STICK + 480 };
        }
        if (rare === 'assemble') {
            const LOCK = [1150, 1500, 1850], ASM = 950;
            const X = LOCK[2] + 280, X_DRAW = INTRO.X_DRAW, X_GAP = INTRO.X_GAP;
            const TICKS = [];
            let t = X + X_GAP + X_DRAW + 260, a = 0;
            [[12, 1], [6, -1], [6, 1]].forEach(([n, dir]) => {
                for (let k = 0; k < n; k++) {
                    t += 28 + 40 * Math.pow(k / (n - 1), 2);
                    a += 30 * dir;
                    TICKS.push({ t: Math.round(t), a });
                }
                t += 150;
            });
            const LOCKED = TICKS[TICKS.length - 1].t + 90;
            return { LOCK, ASM, FLY: LOCK.map(() => ASM), X, X_DRAW, X_GAP, TICKS, LOCKED, EXIT: LOCKED + 560 };
        }
        if (!rare) return { LOCK: INTRO.LOCK, FLY: INTRO.LOCK.map(() => INTRO.FLY), X: INTRO.X, X_DRAW: INTRO.X_DRAW, X_GAP: INTRO.X_GAP, EXIT: INTRO.EXIT };
        const LOCK = [620, 1020, 1960], FLY = [520, 520, 1040];
        const X = LOCK[2] + 300, X_DRAW = 300, X_GAP = 70;
        return { LOCK, FLY, X, X_DRAW, X_GAP, EXIT: X + X_GAP + X_DRAW + 380 + INTRO.RARE_HOLD };
    }

    function introSound(ctx, at, rare) {
        const out = ctx.createDynamicsCompressor();
        out.connect(ctx.destination);
        const master = ctx.createGain();
        master.gain.value = INTRO.VOLUME * soundVolume();
        master.connect(out);
        const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const nd = noise.getChannelData(0);
        for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
        const env = (param, t, peak, attack, decay) => {
            param.setValueAtTime(0.0001, t);
            param.exponentialRampToValueAtTime(peak, t + attack);
            param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
        };
        function whoosh(t, dur, low) {
            const src = ctx.createBufferSource();
            src.buffer = noise;
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.Q.value = 1.2;
            bp.frequency.setValueAtTime(low ? 140 : 300, t);
            bp.frequency.exponentialRampToValueAtTime(low ? 1500 : 3200, t + dur);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.45, t + dur * 0.95);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
            src.connect(bp).connect(g).connect(master);
            src.start(t);
            src.stop(t + dur + 0.1);
        }
        const TAIL = 1.6;
        const tailEnv = (param, t, peak, attack) => {
            param.setValueAtTime(0.0001, t);
            param.exponentialRampToValueAtTime(peak, t + attack);
            param.exponentialRampToValueAtTime(peak * 0.5, t + attack + 0.3);
            param.linearRampToValueAtTime(0, t + attack + 0.3 + TAIL);
        };
        const echo = ctx.createConvolver();
        const ir = ctx.createBuffer(2, ctx.sampleRate * 1.8, ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
            const d = ir.getChannelData(c);
            for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.5);
        }
        echo.buffer = ir;
        const echoGain = ctx.createGain();
        echoGain.gain.value = 0.35;
        echo.connect(echoGain).connect(master);

        function clank(t, heavy) {
            const end = t + (heavy ? 0.3 + TAIL + 0.1 : 1.2);
            const thump = ctx.createOscillator();
            thump.frequency.setValueAtTime(heavy ? 110 : 150, t);
            thump.frequency.exponentialRampToValueAtTime(heavy ? 45 : 48, t + (heavy ? 0.9 : 0.25));
            const tg = ctx.createGain();
            if (heavy) tailEnv(tg.gain, t, 1, 0.004);
            else env(tg.gain, t, 0.8, 0.004, 0.3);
            thump.connect(tg).connect(master);
            if (heavy) tg.connect(echo);
            thump.start(t);
            thump.stop(end);
            if (heavy) {
                const rumble = ctx.createBufferSource();
                rumble.buffer = noise;
                rumble.loop = true;
                const lp = ctx.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.value = 160;
                const rg = ctx.createGain();
                tailEnv(rg.gain, t, 0.9, 0.01);
                rumble.connect(lp).connect(rg).connect(master);
                rg.connect(echo);
                rumble.start(t);
                rumble.stop(end);
            }
            [1, 1.47, 2.09, 2.76, 3.9].forEach((k, i) => {
                const m = ctx.createOscillator();
                m.type = 'triangle';
                m.frequency.value = (heavy ? 420 : 560) * k;
                const mg = ctx.createGain();
                env(mg.gain, t, 0.16 / (i + 1), 0.002, (heavy ? 0.6 : 0.45) / (1 + i * 0.4));
                m.connect(mg).connect(master);
                m.start(t);
                m.stop(t + 1);
            });
            const click = ctx.createBufferSource();
            click.buffer = noise;
            const hp = ctx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 2000;
            const cg = ctx.createGain();
            env(cg.gain, t, 0.6, 0.001, 0.05);
            click.connect(hp).connect(cg).connect(master);
            click.start(t, Math.random() * 0.5);
            click.stop(t + 0.1);
        }
        function slash(t, dur) {
            const src = ctx.createBufferSource();
            src.buffer = noise;
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.Q.value = 2.5;
            bp.frequency.setValueAtTime(1200, t);
            bp.frequency.exponentialRampToValueAtTime(7000, t + dur);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.55, t + dur * 0.7);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
            src.connect(bp).connect(g).connect(master);
            src.start(t, Math.random() * 0.5);
            src.stop(t + dur + 0.1);
            const zing = ctx.createOscillator();
            zing.type = 'sine';
            zing.frequency.setValueAtTime(900, t + dur * 0.5);
            zing.frequency.exponentialRampToValueAtTime(2600, t + dur);
            const zg = ctx.createGain();
            env(zg.gain, t + dur * 0.5, 0.07, 0.01, 0.16);
            zing.connect(zg).connect(master);
            zg.connect(echo);
            zing.start(t + dur * 0.5);
            zing.stop(t + dur + 0.3);
        }
        function subDrop(t) {
            const o = ctx.createOscillator();
            o.frequency.setValueAtTime(70, t);
            o.frequency.exponentialRampToValueAtTime(32, t + 1.2);
            const g = ctx.createGain();
            tailEnv(g.gain, t, 0.9, 0.01);
            o.connect(g).connect(master);
            o.start(t);
            o.stop(t + 0.3 + TAIL + 0.2);
        }
        const P = introPlan(rare);
        function tick(t, gain, freq) {
            const src = ctx.createBufferSource();
            src.buffer = noise;
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.Q.value = 6;
            bp.frequency.value = freq;
            const g = ctx.createGain();
            env(g.gain, t, gain, 0.001, 0.02);
            src.connect(bp).connect(g).connect(master);
            src.start(t, Math.random() * 0.5);
            src.stop(t + 0.05);
        }
        if (rare === 'twist') {
            whoosh(at(P.LOCK[0] - P.FLY[0]), P.FLY[0] / 1000); clank(at(P.LOCK[0]), false);
            whoosh(at(P.LOCK[1] - P.FLY[1]), P.FLY[1] / 1000); clank(at(P.LOCK[1]), false);
            tick(at(P.BOUNCE), 0.5, 900); clank(at(P.BOUNCE + 10), false);
            const fall = ctx.createOscillator(), fg = ctx.createGain();
            fall.type = 'sine';
            fall.frequency.setValueAtTime(1500, at(P.LOCK[2] - P.FLY[2]));
            fall.frequency.exponentialRampToValueAtTime(260, at(P.LOCK[2]));
            fg.gain.setValueAtTime(0.0001, at(P.LOCK[2] - P.FLY[2]));
            fg.gain.exponentialRampToValueAtTime(0.18, at(P.LOCK[2] - 20));
            fg.gain.exponentialRampToValueAtTime(0.0001, at(P.LOCK[2] + 10));
            fall.connect(fg).connect(master);
            fall.start(at(P.LOCK[2] - P.FLY[2])); fall.stop(at(P.LOCK[2] + 40));
            clank(at(P.LOCK[2]), true);
            subDrop(at(P.LOCK[2]));
            [0, 80, 160].forEach(d => tick(at(P.WAVE + d + 60), 0.25, 1200));
            const whir = ctx.createBufferSource(), wbp = ctx.createBiquadFilter(), wg = ctx.createGain();
            whir.buffer = noise; whir.loop = true;
            wbp.type = 'bandpass'; wbp.Q.value = 2; wbp.frequency.value = 1800;
            wg.gain.setValueAtTime(0.0001, at(P.X));
            const dur = (P.STICK - P.X) / 1000;
            for (let k = 0, n = 26; k < n; k++) {
                const tt = at(P.X) + dur * Math.pow(k / n, 0.8);
                wg.gain.setValueAtTime(0.35 * (0.4 + 0.6 * k / n), tt);
                wg.gain.setValueAtTime(0.02, tt + 0.012);
            }
            whir.connect(wbp).connect(wg).connect(master);
            whir.start(at(P.X)); whir.stop(at(P.STICK));
            clank(at(P.STICK), false);
            const tw = ctx.createOscillator(), vib = ctx.createOscillator(), vg = ctx.createGain(), tg = ctx.createGain();
            tw.type = 'triangle'; tw.frequency.value = 190;
            vib.frequency.value = 24; vg.gain.value = 14;
            vib.connect(vg).connect(tw.frequency);
            env(tg.gain, at(P.STICK), 0.35, 0.005, 0.55);
            tw.connect(tg).connect(master); tg.connect(echo);
            tw.start(at(P.STICK)); vib.start(at(P.STICK)); tw.stop(at(P.STICK + 700)); vib.stop(at(P.STICK + 700));
            whoosh(at(P.EXIT - 200), 0.26);
            return;
        }
        if (rare === 'assemble') {
            P.LOCK.forEach((lock, i) => {
                for (let ms = lock - P.ASM + 120, k = 0; ms < lock - 30; k++) {
                    const q = (ms - (lock - P.ASM)) / P.ASM;
                    tick(at(ms), 0.08 + 0.22 * q, 2200 + Math.random() * 2600);
                    ms += 26 - 17 * q + Math.random() * 4;
                }
                clank(at(lock), i === 2);
            });
            [0, P.X_GAP].forEach(d => slash(at(P.X + d), P.X_DRAW / 1000));
            P.TICKS.forEach(tk => { tick(at(tk.t), 0.5, 1700); tick(at(tk.t + 6), 0.25, 3400); });
            clank(at(P.LOCKED), true);
            whoosh(at(P.EXIT - 200), 0.26);
            return;
        }
        P.LOCK.forEach((lock, i) => {
            whoosh(at(lock - P.FLY[i]), P.FLY[i] / 1000, rare && i === 2);
            clank(at(lock), i === 2);
        });
        if (rare) {
            subDrop(at(P.LOCK[2]));
            whoosh(at(P.X - 140), 0.3, true);
        }
        [0, P.X_GAP].forEach(d => slash(at(P.X + d), P.X_DRAW / 1000));
        whoosh(at(P.EXIT - 200), 0.26);
    }

    function introIsLight() {
        const t = document.documentElement.getAttribute('data-theme');
        return t ? t !== 'dark' : GM_getValue('siteTheme', 'dark') === 'light';
    }
    let introOn = false, introReady = false, introGate = null;
    function playIntro(mode, variant) {
        const root = document.documentElement;
        const rare = variant === true, asm = variant === 'assemble', twist = variant === 'twist';
        const light = introIsLight();
        const css = document.createElement('style');
        css.textContent = `
            .vpi-overlay { position: fixed; inset: 0; z-index: 2147483647; overflow: hidden; cursor: pointer;
                --vpi-bg: #000; --vpi-ink: #fff; --vpi-hole: #000; --vpi-hint: rgba(255, 255, 255, .38); }
            .vpi-overlay.vpi-light { --vpi-bg: #f5f5f5; --vpi-ink: #141414; --vpi-hole: #f5f5f5; --vpi-hint: rgba(0, 0, 0, .42); }
            .vpi-half { position: absolute; inset: 0; background: var(--vpi-bg); overflow: hidden; will-change: transform; }
            .vpi-half-0 { clip-path: inset(0 50% 0 0); }
            .vpi-half-1 { clip-path: inset(0 0 0 50%); }
            .vpi-world { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
            .vpi-word { position: relative; display: flex; gap: .05em; color: var(--vpi-ink); user-select: none; line-height: 1;
                font: 900 min(24vw, 36vh)/1 "Arial Black", "Segoe UI Black", "Helvetica Neue", Arial, sans-serif; }
            .vpi-letter { display: inline-block; will-change: transform, opacity, filter; }
            .vpi-fx { position: absolute; left: 0; top: 0; pointer-events: none; opacity: 0; }
            .vpi-spark { width: 2px; height: 16px; margin: -8px 0 0 -1px; border-radius: 1px;
                background: linear-gradient(var(--vpi-ink), transparent); }
            .vpi-flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; }
            .vpi-x { position: absolute; left: 50%; top: 50%; width: min(46vw, 70vh); height: min(46vw, 70vh);
                transform: translate(-50%, -50%); overflow: visible; pointer-events: none; will-change: filter; }
            .vpi-seam { position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; margin-left: -1px; opacity: 0; pointer-events: none;
                background: linear-gradient(transparent, #fff 30%, #fff 70%, transparent); box-shadow: 0 0 18px 2px #7c4dff; }
            .vpi-hole { stroke: var(--vpi-hole); }
            .vpi-ghost { position: absolute; }
            .vpi-xpulse { opacity: 0; }
            .vpi-shards { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        `;
        const el = (cls, parent, text) => {
            const e = document.createElement('div');
            e.className = cls;
            if (text) e.textContent = text;
            parent.appendChild(e);
            return e;
        };
        const ov = el('vpi-overlay' + (light ? ' vpi-light' : ''), root);
        introOn = true;
        const halves = [0, 1].map(i => el('vpi-half vpi-half-' + i, ov));
        const worlds = halves.map(h => el('vpi-world', h));
        const xMarks = worlds.map((w, n) => {
            w.insertAdjacentHTML('beforeend', `<svg class="vpi-x" viewBox="0 0 100 100">
                <defs><linearGradient id="vpiX${n}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#00e5ff"/><stop offset=".5" stop-color="#7c4dff"/><stop offset="1" stop-color="#ff3d9a"/>
                </linearGradient></defs>
                <g fill="none" stroke-linecap="round">
                    <path class="vpi-x1" d="M14 14L86 86" pathLength="1" stroke="url(#vpiX${n})" stroke-width="12"/>
                    <path class="vpi-x1 vpi-hole" d="M14 14L86 86" pathLength="1" stroke-width="7"/>
                    <path class="vpi-x2" d="M86 14L14 86" pathLength="1" stroke="url(#vpiX${n})" stroke-width="12"/>
                    <path class="vpi-x2 vpi-hole" d="M86 14L14 86" pathLength="1" stroke-width="7"/>
                </g></svg>`);
            return w.lastElementChild;
        });
        const words = worlds.map(w => el('vpi-word', w));
        const flash = el('vpi-flash', ov);
        const seam = el('vpi-seam', ov);
        root.appendChild(css);
        const prevOverflow = root.style.overflow;
        root.style.overflow = 'hidden';

        const { SETTLE, FROM, SPLIT } = INTRO;
        const PLAN = introPlan(variant);
        const { LOCK, FLY, X, X_DRAW, X_GAP, EXIT } = PLAN;
        const SHAKE = rare ? [5, 7, 16] : INTRO.SHAKE;
        const GLOW = light ? '124,77,255' : '255,255,255';
        const vmax = Math.max(innerWidth, innerHeight);
        const rnd = (a, b) => a + Math.random() * (b - a);
        const anims = [];
        const play = (target, frames, opts) => { const a = target.animate(frames, { fill: 'both', ...opts }); anims.push(a); return a; };
        const playBoth = (targets, frames, opts) => targets.map(t => play(t, frames, opts));

        function shake(at, amp) {
            const frames = [];
            for (let i = 0, n = 8; i <= n; i++) {
                const k = i === n ? 0 : amp * Math.pow(1 - i / n, 1.5) * (i % 2 ? -1 : 1);
                frames.push({ transform: `translate(${k * rnd(.6, 1)}px, ${k * rnd(-.8, .8)}px)` });
            }
            playBoth(worlds, frames, { delay: at, duration: 340, fill: 'none', composite: 'add' });
        }
        function burst(at, x, y, size, strong) {
            const big = rare && strong;
            for (let i = 0, n = strong ? (big ? 32 : 20) : 10; i < n; i++) {
                const ang = rnd(0, Math.PI * 2), r0 = size * .22, dist = size * rnd(.3, strong ? .75 : .55) * (big ? 1.35 : 1);
                const rot = ang * 180 / Math.PI + 90, c = Math.cos(ang), sn = Math.sin(ang);
                playBoth(worlds.map(w => el('vpi-fx vpi-spark', w)), [
                    { transform: `translate(${x + c * r0}px, ${y + sn * r0}px) rotate(${rot}deg)`, opacity: 1 },
                    { transform: `translate(${x + c * (r0 + dist)}px, ${y + sn * (r0 + dist)}px) rotate(${rot}deg) scaleY(.2)`, opacity: 0 }
                ], { delay: at, duration: rnd(300, 560), easing: 'cubic-bezier(.1,.8,.3,1)', fill: 'forwards' });
            }
            play(flash, [{ opacity: 0 }, { opacity: big ? .18 : strong ? .14 : .06, offset: .12 }, { opacity: 0 }],
                { delay: at, duration: strong ? 380 : 220, fill: 'none' });
        }

        const letters = words.map(w => [...'ИТД'].map(ch => el('vpi-letter', w, ch)));
        const wr = worlds[0].getBoundingClientRect();
        if (asm) letters[0].forEach((box, i) => {
            const lock = LOCK[i], lr = box.getBoundingClientRect();
            playBoth([letters[0][i], letters[1][i]], [
                { opacity: 0, transform: 'none', filter: `drop-shadow(0 0 0 rgba(${GLOW},0))` },
                { opacity: 1, transform: 'scale(1.07, .93)', filter: `drop-shadow(0 0 30px rgba(${GLOW},.9))`, offset: .25 },
                { opacity: 1, transform: 'none', filter: `drop-shadow(0 0 10px rgba(${GLOW},.3))` }
            ], { delay: lock - 25, duration: SETTLE + 120, easing: 'cubic-bezier(.2,.9,.3,1)' });
            shake(lock, SHAKE[i]);
            burst(lock, lr.left - wr.left + lr.width / 2, lr.top - wr.top + lr.height / 2, lr.height * (i === 2 ? 1.8 : 1.3), i === 2);
        });
        if (!asm) letters[0].forEach((box, i) => {
            if (twist && i === 2) return;
            const lock = LOCK[i], f = FROM[i], fly = FLY[i];
            const lr = box.getBoundingClientRect();
            const cx = lr.left - wr.left + lr.width / 2, cy = lr.top - wr.top + lr.height / 2;
            const a = f.ang * Math.PI / 180, dist = vmax * .75;
            const dx = Math.cos(a) * dist, dy = Math.sin(a) * dist;
            const hit = fly / (fly + SETTLE);
            const flyEase = 'cubic-bezier(.6,0,.9,.35)';
            const at = k => `translate(${dx * (1 - k)}px, ${dy * (1 - k)}px) rotate(${f.rot * (1 - k)}deg) scale(${1 + (f.sc - 1) * (1 - k)})`;
            const from = { transform: at(0), opacity: 0, filter: `blur(10px) drop-shadow(0 0 0 rgba(${GLOW},0))`, easing: flyEase };
            const touch = { transform: `translate(${-dx * .012}px, ${-dy * .012}px) scale(1.07, .93)`, opacity: 1, filter: `blur(0px) drop-shadow(0 0 30px rgba(${GLOW},.9))`, offset: hit, easing: 'cubic-bezier(.2,.9,.3,1)' };
            const flight = rare && i === 2 ? [
                { ...from, easing: 'cubic-bezier(.15,.7,.35,1)' },
                { transform: at(.8), opacity: 1, filter: `blur(2px) drop-shadow(0 0 12px rgba(${GLOW},.4))`, offset: hit * .3, easing: 'linear' },
                { transform: at(.88), opacity: 1, filter: `blur(0px) drop-shadow(0 0 16px rgba(${GLOW},.5))`, offset: hit * .86, easing: 'cubic-bezier(.8,0,1,.5)' },
                touch
            ] : [from, { opacity: 1, offset: hit * .25 }, touch];
            playBoth([letters[0][i], letters[1][i]], [
                ...flight,
                { transform: 'none', opacity: 1, filter: `blur(0px) drop-shadow(0 0 10px rgba(${GLOW},.3))` }
            ], { delay: lock - fly, duration: fly + SETTLE });
            if (rare) [1, 2].forEach(k => {
                const ghosts = words.map(w => el('vpi-letter vpi-ghost', w, box.textContent));
                ghosts.forEach(g => { g.style.left = box.offsetLeft + 'px'; g.style.top = box.offsetTop + 'px'; });
                const path = flight.slice(0, -1).map(fr => ({ transform: fr.transform, easing: fr.easing, offset: fr.offset === undefined ? undefined : fr.offset / hit }))
                    .filter(fr => fr.transform);
                playBoth(ghosts, [
                    ...path.map((fr, j) => ({ ...fr, opacity: j === 0 ? 0 : .42 / k, filter: 'blur(8px)' })),
                    { transform: touch.transform, opacity: 0, filter: 'blur(4px)' }
                ], { delay: lock - fly + 45 * k, duration: fly, fill: 'both' });
            });
            shake(lock, SHAKE[i]);
            burst(lock, cx, cy, lr.height * (i === 2 ? 2.2 : 1.5), i === 2);
        });

        if (twist) {
            const all = i => letters.map(l => l[i]);
            const hop = (i, at, h, dur) => playBoth(all(i), [
                { transform: 'translateY(0)' },
                { transform: `translateY(${-h}px) scale(.96, 1.05)`, offset: .45, easing: 'cubic-bezier(.3,0,.7,1)' },
                { transform: 'translateY(0) scale(1.05, .95)', offset: .85 },
                { transform: 'translateY(0)' }
            ], { delay: at, duration: dur, easing: 'cubic-bezier(.2,.7,.3,1)', composite: 'add', fill: 'none' });
            const tb = letters[0][1].getBoundingClientRect();
            playBoth(all(1), [
                { transform: 'translateY(0) rotate(0deg)' },
                { transform: `translateY(${-tb.height * .42}px) rotate(-9deg)`, offset: .5, easing: 'cubic-bezier(.3,0,.7,1)' },
                { transform: 'translateY(0) rotate(0deg) scale(1.06, .92)', offset: .9 },
                { transform: 'translateY(0) rotate(0deg)' }
            ], { delay: LOCK[1] + 30, duration: PLAN.BOUNCE - LOCK[1] + 30, easing: 'cubic-bezier(.2,.7,.3,1)', composite: 'add', fill: 'none' });
            shake(PLAN.BOUNCE, 3);
            const db = letters[0][2].getBoundingClientRect();
            playBoth(all(2), [
                { transform: `translateY(${-(db.bottom + db.height * 1.5)}px) scale(.94, 1.25)`, opacity: 0, filter: `blur(7px) drop-shadow(0 0 0 rgba(${GLOW},0))`, easing: 'cubic-bezier(.55,0,1,.45)' },
                { opacity: 1, offset: .04 },
                { transform: 'translateY(0) scale(1.18, .78)', opacity: 1, filter: `blur(0px) drop-shadow(0 0 40px rgba(${GLOW},1))`, offset: .55, easing: 'cubic-bezier(.2,.9,.3,1)' },
                { transform: 'translateY(-6px) scale(.97, 1.04)', opacity: 1, offset: .78 },
                { transform: 'none', opacity: 1, filter: `blur(0px) drop-shadow(0 0 10px rgba(${GLOW},.3))` }
            ], { delay: LOCK[2] - FLY[2], duration: FLY[2] / .55 });
            shake(LOCK[2], 20);
            burst(LOCK[2], db.left - wr.left + db.width / 2, db.bottom - wr.top - db.height * .15, db.height * 2.2, true);
            play(flash, [{ opacity: 0 }, { opacity: .2, offset: .1 }, { opacity: 0 }], { delay: LOCK[2], duration: 380, fill: 'none' });
            [0, 1].forEach(i => hop(i, LOCK[2] + 20, 30, 300));
            [0, 1, 2].forEach(i => hop(i, PLAN.WAVE + i * 80, 22, 280));
            const T = PLAN.STICK - PLAN.X;
            playBoth(xMarks, [
                { transform: `translate(calc(-50% + ${innerWidth * .75}px), -50%) rotate(1440deg) scale(.5)`, opacity: 0 },
                { opacity: 1, offset: .12 },
                { transform: 'translate(-50%, -50%) rotate(0deg) scale(1)', opacity: 1 }
            ], { delay: PLAN.X, duration: T, easing: 'cubic-bezier(.15,.6,.35,1)' });
            playBoth(xMarks, [
                { transform: 'rotate(0deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(-6deg)' },
                { transform: 'rotate(4deg)' }, { transform: 'rotate(-2deg)' }, { transform: 'rotate(1deg)' }, { transform: 'rotate(0deg)' }
            ], { delay: PLAN.STICK, duration: 460, easing: 'ease-out', composite: 'add', fill: 'none' });
            shake(PLAN.STICK, 7);
            play(flash, [{ opacity: 0 }, { opacity: .06, offset: .3 }, { opacity: 0 }], { delay: PLAN.STICK, duration: 200, fill: 'none' });
            playBoth(xMarks, [
                { filter: 'drop-shadow(0 0 6px rgba(124,77,255,.5))' },
                { filter: 'drop-shadow(0 0 28px rgba(124,77,255,1))', offset: .3 },
                { filter: 'drop-shadow(0 0 12px rgba(124,77,255,.55))' }
            ], { delay: PLAN.STICK, duration: 520 });
        }
        if (!twist) ['.vpi-x1', '.vpi-x2'].forEach((sel, i) => {
            xMarks.forEach(xm => xm.querySelectorAll(sel).forEach(path => play(path, [
                { strokeDasharray: '1 1', strokeDashoffset: 1 },
                { strokeDasharray: '1 1', strokeDashoffset: 0 }
            ], { delay: X + i * X_GAP, duration: X_DRAW, easing: 'cubic-bezier(.7,0,.3,1)' })));
            play(flash, [{ opacity: 0 }, { opacity: .05, offset: .5 }, { opacity: 0 }], { delay: X + i * X_GAP + X_DRAW * .6, duration: 160, fill: 'none' });
        });
        if (!twist) shake(X + X_GAP + X_DRAW * .8, rare ? 10 : 3);
        if (!twist) playBoth(xMarks, [
            { filter: 'drop-shadow(0 0 0 rgba(124,77,255,0))' },
            { filter: 'drop-shadow(0 0 26px rgba(124,77,255,.95))', offset: .35 },
            { filter: 'drop-shadow(0 0 12px rgba(124,77,255,.55))' }
        ], { delay: X + X_GAP + X_DRAW, duration: 520 });

        if (rare) {
            playBoth(worlds, [{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }],
                { delay: 0, duration: EXIT, easing: 'linear', composite: 'add', fill: 'forwards' });
            playBoth(worlds, [{ transform: 'scale(1)' }, { transform: 'scale(1.13)', offset: .14 }, { transform: 'scale(1)' }],
                { delay: X + X_GAP + X_DRAW * .7, duration: 560, easing: 'cubic-bezier(.2,.8,.2,1)', composite: 'add', fill: 'none' });
            playBoth(xMarks, [
                { transform: 'translate(-50%, -50%) scale(2.6) rotate(-35deg)', opacity: 0 },
                { opacity: 1, offset: .2 },
                { transform: 'translate(-50%, -50%) scale(.94) rotate(3deg)', opacity: 1, offset: .8 },
                { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 }
            ], { delay: X - 90, duration: X_DRAW + X_GAP + 150, easing: 'cubic-bezier(.3,0,.2,1)' });
            const pulses = worlds.map((w, n) => {
                const c = xMarks[n].cloneNode(true);
                c.setAttribute('class', 'vpi-x vpi-xpulse');
                c.querySelectorAll('[id]').forEach(e => e.id += 'p');
                c.querySelectorAll('[stroke^="url"]').forEach(e => e.setAttribute('stroke', `url(#vpiX${n}p)`));
                w.insertBefore(c, xMarks[n]);
                return c;
            });
            playBoth(pulses, [
                { transform: 'translate(-50%, -50%) scale(1)', opacity: .85, filter: 'blur(0px)' },
                { transform: 'translate(-50%, -50%) scale(1.75)', opacity: 0, filter: 'blur(7px)' }
            ], { delay: X + X_GAP + X_DRAW, duration: 720, easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'forwards' });
        }

        if (asm) {
            const cv = document.createElement('canvas');
            cv.className = 'vpi-shards';
            ov.insertBefore(cv, flash);
            const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
            cv.width = W * dpr; cv.height = H * dpr;
            const g = cv.getContext('2d');
            g.scale(dpr, dpr);
            const cs = getComputedStyle(letters[0][0]);
            const ink = cs.color, fontPx = parseFloat(cs.fontSize);
            const step = Math.max(3, Math.round(fontPx / 52));
            const off = document.createElement('canvas');
            off.width = W; off.height = H;
            const o = off.getContext('2d', { willReadFrequently: true });
            o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
            o.textAlign = 'center';
            o.textBaseline = 'alphabetic';
            o.fillStyle = '#fff';
            const pieces = [];
            letters[0].forEach((box, li) => {
                const r = box.getBoundingClientRect(), m = o.measureText(box.textContent);
                const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
                o.clearRect(0, 0, W, H);
                o.fillText(box.textContent, cx, cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
                const x0 = Math.max(0, Math.floor(r.left - step)), y0 = Math.max(0, Math.floor(r.top - step));
                const w = Math.min(W - x0, Math.ceil(r.width + step * 2)), h = Math.min(H - y0, Math.ceil(r.height + step * 2));
                const px = o.getImageData(x0, y0, w, h).data;
                const lock = LOCK[li];
                for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
                    if (px[(y * w + x) * 4 + 3] < 128) continue;
                    const ang = rnd(0, Math.PI * 2), dist = vmax * rnd(.3, .8);
                    const t0 = lock - PLAN.ASM + rnd(0, PLAN.ASM * .62);
                    pieces.push({
                        tx: x0 + x, ty: y0 + y, li, t0, d: Math.min(rnd(230, 430), lock - 20 - t0),
                        sx: cx + Math.cos(ang) * dist, sy: cy + Math.sin(ang) * dist * .8, spin: rnd(-3, 3)
                    });
                }
            });
            const draw = t => {
                g.clearRect(0, 0, W, H);
                g.fillStyle = ink;
                for (const p of pieces) {
                    if (t < p.t0 || t >= LOCK[p.li] + 20) continue;
                    const k = Math.min(1, (t - p.t0) / p.d), e = 1 - Math.pow(1 - k, 3);
                    const x = p.sx + (p.tx - p.sx) * e, y = p.sy + (p.ty - p.sy) * e, sz = step * (.95 + (1 - e) * 1.4);
                    g.globalAlpha = Math.min(1, k * 3);
                    if (e < .98) {
                        g.save(); g.translate(x, y); g.rotate(p.spin * (1 - e)); g.fillRect(-sz / 2, -sz / 2, sz, sz); g.restore();
                    } else g.fillRect(x - sz / 2, y - sz / 2, sz, sz);
                }
                g.globalAlpha = 1;
            };
            const clock = play(cv, [{ opacity: 1 }, { opacity: 1 }], { duration: LOCK[2] + 80, fill: 'none' });
            const frame = () => {
                if (!cv.isConnected) return;
                const t = clock.currentTime;
                if (t === null || t > LOCK[2] + 60) { cv.remove(); return; }
                draw(t);
                requestAnimationFrame(frame);
            };
            requestAnimationFrame(frame);

            const T0 = PLAN.TICKS[0].t - 60, D = PLAN.LOCKED + 260 - T0;
            const rot = (a, sc = 1) => `translate(-50%, -50%) rotate(${a}deg) scale(${sc})`;
            const frames = [{ offset: 0, transform: rot(0) }];
            let prev = 0, prevT = T0;
            PLAN.TICKS.forEach(tk => {
                const move = Math.min(40, (tk.t - prevT) * .6);
                frames.push({ offset: (tk.t - move - T0) / D, transform: rot(prev) });
                frames.push({ offset: (tk.t - T0) / D, transform: rot(tk.a) });
                prev = tk.a; prevT = tk.t;
            });
            frames.push({ offset: (PLAN.LOCKED - T0) / D, transform: rot(prev) });
            frames.push({ offset: (PLAN.LOCKED + 60 - T0) / D, transform: rot(prev + 4, 1.1) });
            frames.push({ offset: 1, transform: rot(prev) });
            playBoth(xMarks, frames, { delay: T0, duration: D, easing: 'linear' });
            shake(PLAN.LOCKED, 9);
            play(flash, [{ opacity: 0 }, { opacity: .12, offset: .15 }, { opacity: 0 }], { delay: PLAN.LOCKED, duration: 300, fill: 'none' });
            playBoth(xMarks, [
                { filter: 'drop-shadow(0 0 12px rgba(124,77,255,.55))' },
                { filter: 'drop-shadow(0 0 30px rgba(124,77,255,1))', offset: .3 },
                { filter: 'drop-shadow(0 0 12px rgba(124,77,255,.55))' }
            ], { delay: PLAN.LOCKED, duration: 520, fill: 'forwards' });
        }

        play(seam, [
            { opacity: 0, transform: 'scaleY(0)' },
            { opacity: 1, transform: 'scaleY(1)', offset: .55 },
            { opacity: 0, transform: 'scaleY(1)' }
        ], { delay: EXIT - 140, duration: 260, easing: 'ease-out', fill: 'none' });
        const doors = [-1, 1].map((dir, i) => play(halves[i], [
            { transform: 'translateX(0)' },
            { transform: `translateX(${dir * 52}%)` }
        ], { delay: EXIT, duration: SPLIT, easing: 'cubic-bezier(.7,0,.3,1)', fill: 'forwards' }));
        const out = doors[1];

        let ctx = null;
        let done = false, started = false;
        const cleanup = () => {
            if (done) return;
            done = true;
            ov.remove();
            css.remove();
            introOn = false;
            document.dispatchEvent(new CustomEvent('vp-intro-done'));
            root.style.overflow = prevOverflow;
            if (ctx) setTimeout(() => ctx.close().catch(() => { }), 3500);
        };
        out.finished.then(cleanup, cleanup);
        const skip = () => {
            if (done) return;
            removeEventListener('keydown', skip, true);
            if (ctx) ctx.close().catch(() => { });
            ctx = null;
            ov.animate([{ opacity: getComputedStyle(ov).opacity }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).finished.then(cleanup, cleanup);
        };
        function begin(withSound) {
            if (started) return;
            started = true;
            for (const a of anims) { a.currentTime = 0; a.play(); }
            afterStart();
            if (withSound) syncSound();
        }
        function syncSound() {
            let queued = false;
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
                Promise.all([ctx.resume(), anims[0].ready]).then(() => {
                    if (!ctx || done) return;
                    queued = true;
                    const start = anims[0].startTime;
                    const toCtx = perf => {
                        const ts = ctx.getOutputTimestamp ? ctx.getOutputTimestamp() : null;
                        if (ts && ts.performanceTime > 0) return ts.contextTime + (perf - ts.performanceTime) / 1000;
                        return ctx.currentTime + (perf - performance.now()) / 1000 - (ctx.outputLatency || 0);
                    };
                    introSound(ctx, ms => Math.max(ctx.currentTime + 0.01, toCtx(start + ms)), variant);
                }, () => { });
            } catch (e) { ctx = null; }
            anims[0].ready.then(() => setTimeout(() => { if (!queued && ctx) { ctx.close().catch(() => { }); ctx = null; } }, 600), () => { });
        }
        function afterStart() {
            setTimeout(cleanup, EXIT + SPLIT + 2500);
            setTimeout(() => { if (done) return; ov.addEventListener('click', skip); addEventListener('keydown', skip, true); }, 400);
        }

        if (mode !== 'tap') {
            for (const a of anims) a.pause();
            const go = () => {
                if (started) return;
                introGate = null;
                requestAnimationFrame(() => requestAnimationFrame(() => begin(mode === 'desk')));
            };
            if (introReady) go(); else { introGate = go; setTimeout(go, 1800); }
            return anims;
        }

        for (const a of anims) a.pause();
        const idle = document.createElement('div');
        idle.className = 'vpi-idle';
        idle.innerHTML = `<div class="vpi-idle-logo"><svg viewBox="0 0 100 100"><defs><linearGradient id="vpiXi" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#00e5ff"/><stop offset=".5" stop-color="#7c4dff"/><stop offset="1" stop-color="#ff3d9a"/></linearGradient></defs>
            <g fill="none" stroke-linecap="round"><path d="M14 14L86 86M86 14L14 86" stroke="url(#vpiXi)" stroke-width="12"/>
            <path class="vpi-hole" d="M14 14L86 86M86 14L14 86" stroke-width="7"/></g></svg><span>ИТД</span></div><div class="vpi-idle-hint">коснись</div>`;
        ov.appendChild(idle);
        css.textContent += `
            .vpi-idle { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; }
            .vpi-idle-logo { position: relative; width: 96px; height: 96px; display: flex; align-items: center; justify-content: center;
                animation: vpiBreath 2.6s ease-in-out infinite; }
            .vpi-idle-logo svg { position: absolute; inset: 0; width: 100%; height: 100%; }
            .vpi-idle-logo span { position: relative; color: var(--vpi-ink); font: 900 30px/1 "Arial Black", "Segoe UI Black", Arial, sans-serif; }
            .vpi-idle-hint { color: var(--vpi-hint); font: 500 13px/1 system-ui, sans-serif; letter-spacing: .28em; text-transform: lowercase;
                opacity: 0; animation: vpiHint .8s ease 1.1s forwards; }
            @keyframes vpiBreath { 0%, 100% { opacity: .55; transform: scale(.96); filter: drop-shadow(0 0 0 rgba(124,77,255,0)); }
                50% { opacity: 1; transform: scale(1.03); filter: drop-shadow(0 0 16px rgba(124,77,255,.55)); } }
            @keyframes vpiHint { to { opacity: 1; } }`;
        const auto = setTimeout(() => go(false), INTRO.IDLE);
        function go(withSound) {
            if (started) return;
            clearTimeout(auto);
            ov.removeEventListener('pointerup', tap, true);
            ov.removeEventListener('click', tap, true);
            idle.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.9)' }], { duration: 220, fill: 'forwards' })
                .finished.then(() => idle.remove(), () => idle.remove());
            begin(withSound);
        }
        function tap(e) { e.stopPropagation(); go(true); }
        ov.addEventListener('pointerup', tap, true);
        ov.addEventListener('click', tap, true);
        return anims;
    }

    const IS_PHONE = matchMedia('(pointer: coarse)').matches;
    const introMode = () => IS_PHONE ? GM_getValue('introMobile', GM_getValue('introEnabled', true) ? 'tap' : 'off')
        : GM_getValue('introEnabled', true) ? 'desk' : 'off';
    if (window.top === window.self && introMode() !== 'off'
        && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const preview = GM_getValue('introPreview', '');
        const pickIntro = () => { let r = Math.random(); for (const [v, p] of INTRO.RARE) { if (r < p) return v; r -= p; } return false; };
        let again = false;
        try { again = Date.now() - (+sessionStorage.getItem('vp-intro-at') || 0) < 60000; sessionStorage.setItem('vp-intro-at', Date.now()); } catch (e) { }
        if (!again || preview) try { playIntro(introMode(), preview ? (preview === 'rare' || preview) : pickIntro()); } catch (e) { console.warn('[ITD VP] заставка', e); }
    }

