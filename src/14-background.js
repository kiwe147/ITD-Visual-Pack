        const styleBgCanvas = addCss(`
        .vp-bg-canvas {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;
            opacity: 0.2; pointer-events: none; transition: opacity .4s ease;
        }
        .vp-bg-canvas.vp-bg-off { display: none; }
    `);
        let canvas = document.createElement('canvas');
        canvas.className = 'vp-bg-canvas';
        document.body.appendChild(canvas);
        const bgMedia = document.createElement('div');
        bgMedia.className = 'vp-bg-media vp-bg-off';
        document.body.appendChild(bgMedia);
        styleBgCanvas.textContent += `
        .vp-bg-media { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
        .vp-bg-media.vp-bg-off { display: none; }
        .vp-bg-media > img, .vp-bg-media > video { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(.5) saturate(1.1); }
        html.vp-light .vp-bg-media > img, html.vp-light .vp-bg-media > video { filter: none; opacity: .45; }
    `;
        const bgDb = () => new Promise((ok, no) => {
            const r = indexedDB.open('itdx', 1);
            r.onupgradeneeded = () => r.result.createObjectStore('files');
            r.onsuccess = () => ok(r.result);
            r.onerror = () => no(r.error);
        });
        async function bgFile(blob) {
            const db = await bgDb();
            return new Promise((ok, no) => {
                const tx = db.transaction('files', blob ? 'readwrite' : 'readonly'), st = tx.objectStore('files');
                const r = blob ? st.put(blob, 'background') : st.get('background');
                r.onsuccess = () => ok(blob || r.result || null);
                r.onerror = () => no(r.error);
            });
        }
        let bgMediaUrl = '';
        async function showBgMedia(blob) {
            const fresh = !!blob;
            if (!blob) blob = await bgFile().catch(() => null);
            if (bgMediaUrl) URL.revokeObjectURL(bgMediaUrl);
            bgMediaUrl = blob ? URL.createObjectURL(blob) : '';
            bgMedia.replaceChildren();
            if (!blob) return;
            if (/^video\//.test(blob.type)) {
                const v = document.createElement('video');
                Object.assign(v, { src: bgMediaUrl, muted: true, loop: true, autoplay: true, playsInline: true });
                v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
                v.addEventListener('error', () => { if (fresh) alert('Браузер не умеет показывать это видео. Сохрани его как mp4 (H.264) или webm и выбери снова'); }, { once: true });
                bgMedia.appendChild(v);
                v.play().catch(() => { });
            } else {
                const img = document.createElement('img');
                img.src = bgMediaUrl;
                img.alt = '';
                bgMedia.appendChild(img);
            }
        }
        function pickBgFile(done) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,video/*';
            input.onchange = async () => {
                const f = input.files[0];
                if (!f) return;
                if (f.size > 150 * 1024 * 1024) { alert('Файл больше 150 МБ — возьми поменьше'); return; }
                if (/^video\//.test(f.type) && f.size > VIDEO_UP_MAX) alert('Видео больше 30 МБ: у тебя оно будет играть, а другие увидят только первый кадр. Чтобы видели видео — сожми его до 30 МБ');
                try { await bgFile(f); } catch (e) { alert('Не вышло сохранить файл: ' + (e && e.message || e)); return; }
                backgroundStyle = 'custom';
                GM_setValue('backgroundStyle', 'custom');
                await showBgMedia(f);
                updateBackgroundVisibility();
                if (done) done();
            };
            input.click();
        }
        let bgGuest = null, bannerVideoGuest = '', bannerVideoBusy = false;
        const BANNER_VIDEO_RE = /^[\w-]+(\/[\w-]+)*\.(mp4|webm|mov)$/i;
        const bannerVideoOwn = () => { const v = GM_getValue(acctKey('vp_banner_video'), ''); return BANNER_VIDEO_RE.test(v) ? v : ''; };
        const effBg = () => bgGuest ? bgGuest.b : backgroundStyle;
        function setBgGuest(look) {
            const gv = showLooks && look && look.v || '';
            if (gv !== bannerVideoGuest) { bannerVideoGuest = gv; bannerVideoSync(); }
            const g = showLooks && look && look.b && look.b !== '-' && (look.b !== 'custom' || look.i)
                ? { b: look.b, n: look.n, img: look.b === 'custom' ? lookImgUrl(look.i) : '', vid: look.b === 'custom' && look.bv ? 'https://cdn.xn--d1ah4a.com/' + look.bv : '' } : null;
            const key = g ? g.b + '|' + g.n + '|' + g.img + '|' + g.vid : '';
            if (key === (bgGuest ? bgGuest.key : '')) return;
            bgGuest = g && Object.assign(g, { key });
            bgReset();
            if (bgGuest && bgGuest.b === 'custom') {
                const im = document.createElement('img');
                im.src = bgGuest.img; im.alt = '';
                bgMedia.replaceChildren(im);
                if (bgGuest.vid) {
                    const v = document.createElement('video');
                    Object.assign(v, { muted: true, loop: true, autoplay: true, playsInline: true, poster: bgGuest.img });
                    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
                    v.addEventListener('error', () => { if (v.isConnected) v.replaceWith(im); }, { once: true });
                    v.src = bgGuest.vid;
                    bgMedia.replaceChildren(v);
                }
                bgMedia._guest = true;
            } else if (bgMedia._guest) { bgMedia._guest = false; bgMedia.replaceChildren(); }
            updateBackgroundVisibility();
        }
        function updateBackgroundVisibility() {
            const custom = effBg() === 'custom';
            if (custom && backgroundEnabled && introOn) {
                if (!updateBackgroundVisibility._wait) {
                    updateBackgroundVisibility._wait = true;
                    document.addEventListener('vp-intro-done', () => { updateBackgroundVisibility._wait = false; updateBackgroundVisibility(); }, { once: true });
                }
                canvas.classList.add('vp-bg-off');
                return;
            }
            canvas.classList.toggle('vp-bg-off', !backgroundEnabled || custom);
            bgMedia.classList.toggle('vp-bg-off', !backgroundEnabled || !custom);
            const v = bgMedia.querySelector('video');
            if (v) { if (backgroundEnabled && custom) v.play().catch(() => { }); else v.pause(); }
            if (backgroundEnabled && custom && !bgMedia.firstChild) showBgMedia();
        }
        updateBackgroundVisibility();
        function bgEngine(mkCanvas) {
            let ctx = null, W = 0, H = 0, bg = null, bgName = '';
            const mouse = { x: -1e4, y: -1e4 };
            const rand = (a, b) => a + Math.random() * (b - a);
            const hsla = (h, s, l, a) => `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
            const spriteCache = new Map();
            function sprite(kind, h, s, l) {
                const key = kind + Math.round(h) + ',' + Math.round(s) + ',' + Math.round(l);
                let c = spriteCache.get(key);
                if (c) return c;
                if (spriteCache.size > 400) spriteCache.clear();
                c = mkCanvas();
                const g = c.getContext('2d');
                if (kind === 'curtain') {
                    c.width = 1; c.height = 128;
                    const grad = g.createLinearGradient(0, 0, 0, 128);
                    grad.addColorStop(0, hsla(h, s, l, 0));
                    grad.addColorStop(0.55, hsla(h, s, l, 0.3));
                    grad.addColorStop(0.9, hsla(h, s, l + 10, 1));
                    grad.addColorStop(1, hsla(h, s, l, 0));
                    g.fillStyle = grad;
                    g.fillRect(0, 0, 1, 128);
                } else {
                    c.width = c.height = 64;
                    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
                    const stops = kind === 'disc'
                        ? [[0, 0.5], [0.72, 0.6], [0.86, 0.3], [1, 0]]
                        : [[0, 1], [0.35, 0.4], [0.7, 0.08], [1, 0]];
                    stops.forEach(([o, a]) => grad.addColorStop(o, hsla(h, s, l, a)));
                    g.fillStyle = grad;
                    g.fillRect(0, 0, 64, 64);
                }
                spriteCache.set(key, c);
                return c;
            }
            function drawSprite(kind, x, y, r, h, s, l, a) {
                ctx.globalAlpha = Math.max(0, Math.min(1, a));
                ctx.drawImage(sprite(kind, h, s, l), x - r, y - r, r * 2, r * 2);
                ctx.globalAlpha = 1;
            }
            let fadeAcc = 0;
            function fadeOut(k, dt) {
                fadeAcc += dt;
                const a = 1 - Math.pow(1 - k, fadeAcc);
                if (a < 0.08) return;
                fadeAcc = 0;
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fillStyle = `rgba(0, 0, 0, ${a})`;
                ctx.fillRect(0, 0, W, H);
                ctx.globalCompositeOperation = 'source-over';
            }

            const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
            const WAVES = [
                { amp1: 100, freq1: 0.008, speed1: 0.4, amp2: 50, freq2: 0.018, speed2: 0.7, amp3: 70, freq3: 0.004, speed3: 0.25, alpha: 0.45, offset: 0, dh: 0, dl: 15 },
                { amp1: 80, freq1: 0.009, speed1: 0.5, amp2: 40, freq2: 0.020, speed2: 0.8, amp3: 60, freq3: 0.005, speed3: 0.3, alpha: 0.35, offset: 1.5, dh: 15, dl: 10 },
                { amp1: 60, freq1: 0.010, speed1: 0.6, amp2: 30, freq2: 0.022, speed2: 0.9, amp3: 50, freq3: 0.006, speed3: 0.35, alpha: 0.28, offset: 3.0, dh: -15, dl: 5 },
                { amp1: 40, freq1: 0.011, speed1: 0.7, amp2: 20, freq2: 0.025, speed2: 1.0, amp3: 30, freq3: 0.007, speed3: 0.4, alpha: 0.20, offset: 4.5, dh: 30, dl: 0 }
            ];

            const BACKGROUNDS = {
                matrix: {
                    opacity: 0.2,
                    init() {
                        const size = 15;
                        return { size, cols: Array.from({ length: Math.ceil(W / size) }, () => ({ y: rand(-H / size, H / size), v: rand(0.35, 1), prev: null })) };
                    },
                    draw(s, dt, { h, s: sat }) {
                        fadeOut(0.06, dt);
                        ctx.font = `${s.size}px monospace`;
                        ctx.textBaseline = 'top';
                        s.cols.forEach((c, i) => {
                            const cell = Math.floor(c.y);
                            c.y += c.v * dt;
                            const next = Math.floor(c.y);
                            if (next !== cell) {
                                const x = i * s.size;
                                if (c.prev) {
                                    ctx.clearRect(x, c.prev.y * s.size, s.size, s.size);
                                    ctx.fillStyle = hsla(h + rand(-12, 12), sat, 45, 1);
                                    ctx.fillText(c.prev.ch, x, c.prev.y * s.size);
                                }
                                const ch = MATRIX_CHARS[Math.random() * MATRIX_CHARS.length | 0];
                                ctx.fillStyle = hsla(h, Math.min(sat, 50), 88, 1);
                                ctx.fillText(ch, x, next * s.size);
                                c.prev = { ch, y: next };
                            }
                            if (c.y * s.size > H && Math.random() < 0.03 * dt) Object.assign(c, { y: rand(-15, 0), v: rand(0.35, 1), prev: null });
                        });
                    }
                },
                stars: {
                    opacity: 0.4,
                    init() {
                        const n = Math.min(600, Math.floor(W * H / 3500));
                        return {
                            stars: Array.from({ length: n }, () => {
                                const d = Math.random() ** 2;
                                return { x: rand(0, W), y: rand(0, H), d, r: 0.5 + d * 1.8, ph: rand(0, 6.3), sp: rand(0.03, 0.1) };
                            }),
                            shoot: null, wait: rand(40, 120)
                        };
                    },
                    draw(s, dt, { h, s: sat }) {
                        ctx.clearRect(0, 0, W, H);
                        const S = Math.min(100, sat * 1.2);
                        const packs = Array.from({ length: 8 }, () => new Path2D());
                        for (const st of s.stars) {
                            st.ph += st.sp * dt;
                            st.x -= (0.03 + st.d * 0.3) * dt;
                            if (st.x < -5) { st.x = W + 5; st.y = rand(0, H); }
                            const a = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(st.ph));
                            if (st.r > 1.4) drawSprite('glow', st.x, st.y, st.r * 7, h, S, 70, a * 0.3);
                            const pack = packs[Math.min(7, a * 8 | 0)];
                            pack.moveTo(st.x + st.r, st.y);
                            pack.arc(st.x, st.y, st.r, 0, Math.PI * 2);
                        }
                        ctx.fillStyle = hsla(h, S, 82, 1);
                        packs.forEach((pack, i) => { ctx.globalAlpha = (i + 0.5) / 8; ctx.fill(pack); });
                        ctx.globalAlpha = 1;
                        s.wait -= dt;
                        if (!s.shoot && s.wait <= 0) {
                            s.shoot = { x: rand(W * 0.3, W * 1.05), y: rand(-20, H * 0.35), vx: -rand(16, 24), vy: rand(6, 10), life: 1 };
                            s.wait = rand(80, 220);
                        }
                        const p = s.shoot;
                        if (p) {
                            p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.035 * dt;
                            const tx = p.x - p.vx * 7, ty = p.y - p.vy * 7;
                            const tail = ctx.createLinearGradient(p.x, p.y, tx, ty);
                            tail.addColorStop(0, hsla(h, S * 0.5, 95, Math.max(0, p.life)));
                            tail.addColorStop(1, hsla(h, S, 70, 0));
                            ctx.strokeStyle = tail;
                            ctx.lineWidth = 2;
                            ctx.lineCap = 'round';
                            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(tx, ty); ctx.stroke();
                            drawSprite('glow', p.x, p.y, 10, h, S * 0.5, 90, p.life * 0.8);
                            if (p.life <= 0 || p.x < -200 || p.y > H + 200) s.shoot = null;
                        }
                    }
                },
                particles: {
                    opacity: 0.35,
                    init() {
                        const n = Math.min(130, Math.floor(W * H / 14000));
                        return { ps: Array.from({ length: n }, () => ({ x: rand(0, W), y: rand(0, H), vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.6), r: rand(1.2, 3), ph: rand(0, 6.3) })) };
                    },
                    draw(s, dt, { h, s: sat }) {
                        ctx.clearRect(0, 0, W, H);
                        const S = Math.min(100, sat * 1.4), link = Math.max(110, Math.min(170, Math.min(W, H) * 0.14)), link2 = link * link;
                        const ps = s.ps;
                        for (const p of ps) {
                            const dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
                            if (d2 < 48000 && d2 > 1) {
                                const d = Math.sqrt(d2), f = (d < 90 ? -1.2 : 0.3) / d;
                                p.vx += dx * f * 0.05 * dt; p.vy += dy * f * 0.05 * dt;
                            }
                            const sp = Math.hypot(p.vx, p.vy);
                            if (sp > 1.3) { p.vx *= 1.3 / sp; p.vy *= 1.3 / sp; }
                            if (sp < 0.15) { p.vx += rand(-0.05, 0.05); p.vy += rand(-0.05, 0.05); }
                            p.x += p.vx * dt; p.y += p.vy * dt; p.ph += 0.05 * dt;
                            if (p.x < 0 || p.x > W) { p.vx *= -1; p.x = Math.max(0, Math.min(W, p.x)); }
                            if (p.y < 0 || p.y > H) { p.vy *= -1; p.y = Math.max(0, Math.min(H, p.y)); }
                        }
                        const lines = Array.from({ length: 6 }, () => new Path2D());
                        const add = (a, x1, y1, x2, y2) => { const l = lines[Math.min(5, a * 6 | 0)]; l.moveTo(x1, y1); l.lineTo(x2, y2); };
                        for (let i = 0; i < ps.length; i++) {
                            const a = ps[i];
                            for (let j = i + 1; j < ps.length; j++) {
                                const b = ps[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
                                if (d2 < link2) add(0.45 * (1 - Math.sqrt(d2) / link) / 0.7, a.x, a.y, b.x, b.y);
                            }
                            const mx = mouse.x - a.x, my = mouse.y - a.y, m2 = mx * mx + my * my;
                            if (m2 < link2 * 1.7) add(1 - Math.sqrt(m2 / (link2 * 1.7)), a.x, a.y, mouse.x, mouse.y);
                        }
                        ctx.strokeStyle = hsla(h, S, 75, 1);
                        ctx.lineWidth = 1;
                        lines.forEach((l, i) => { ctx.globalAlpha = 0.7 * (i + 0.5) / 6; ctx.stroke(l); });
                        ctx.globalAlpha = 1;
                        const dots = new Path2D();
                        for (const p of ps) {
                            const r = p.r * (0.85 + 0.15 * Math.sin(p.ph));
                            drawSprite('glow', p.x, p.y, r * 5, h, S, 70, 0.4);
                            dots.moveTo(p.x + r, p.y);
                            dots.arc(p.x, p.y, r, 0, Math.PI * 2);
                        }
                        ctx.fillStyle = hsla(h, S, 85, 1);
                        ctx.fill(dots);
                    }
                },
                waves: {
                    opacity: 0.3,
                    init() { return { time: rand(0, 50) }; },
                    draw(s, dt, { h, s: sat }) {
                        ctx.clearRect(0, 0, W, H);
                        s.time += 0.01 * dt;
                        const S = Math.min(100, sat * 1.3), L = 75;
                        const k = Math.min(200, Math.max(80, H * 0.15)) / 100, mid = H * 0.5;
                        WAVES.forEach((c, w) => {
                            ctx.beginPath();
                            for (let x = 0; x <= W; x += 3) {
                                const y = mid + (Math.sin(x * c.freq1 + s.time * c.speed1 + c.offset) * c.amp1
                                    + Math.sin(x * c.freq2 + s.time * c.speed2 + c.offset * 0.7) * c.amp2
                                    + Math.sin(x * c.freq3 + s.time * c.speed3 + c.offset * 2) * c.amp3) * k;
                                x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
                            }
                            const color = hsla(h + c.dh, S, L + c.dl, 1);
                            const width = 2 + w * 0.5;
                            ctx.strokeStyle = color;
                            ctx.globalAlpha = c.alpha * 0.14;
                            ctx.lineWidth = width + 10 + w * 3;
                            ctx.stroke();
                            ctx.globalAlpha = c.alpha;
                            ctx.lineWidth = width;
                            ctx.stroke();
                            ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
                            const fill = ctx.createLinearGradient(0, mid - 150 * k, 0, H);
                            fill.addColorStop(0, hsla(h + c.dh, S, L, 0.06));
                            fill.addColorStop(1, hsla(h + c.dh, S, L, 0));
                            ctx.globalAlpha = 1;
                            ctx.fillStyle = fill;
                            ctx.fill();
                        });
                    }
                },
                aurora: {
                    opacity: 0.45,
                    init() { return { t: rand(0, 100) }; },
                    draw(s, dt, { h, s: sat }) {
                        ctx.clearRect(0, 0, W, H);
                        s.t += 0.012 * dt;
                        const S = Math.min(100, sat * 1.15), step = 6;
                        ctx.globalCompositeOperation = 'lighter';
                        [
                            { base: 0.64, amp: 0.08, len: 0.3, dh: 0, a: 0.45, f: 0.0021, sp: 1 },
                            { base: 0.72, amp: 0.06, len: 0.24, dh: 45, a: 0.3, f: 0.0016, sp: -0.7 },
                            { base: 0.58, amp: 0.05, len: 0.2, dh: -40, a: 0.28, f: 0.0027, sp: 0.55 }
                        ].forEach(b => {
                            const img = sprite('curtain', h + b.dh, S, 60);
                            for (let x = 0; x < W; x += step) {
                                const y = H * (b.base + b.amp * Math.sin(x * b.f + s.t * b.sp) + 0.025 * Math.sin(x * b.f * 3.1 - s.t * 1.7 * b.sp));
                                const len = H * b.len * (0.6 + 0.4 * Math.sin(x * 0.011 + s.t * 2.3 * b.sp));
                                ctx.globalAlpha = b.a * (0.5 + 0.5 * Math.sin(x * 0.004 - s.t * 1.3 + b.dh));
                                ctx.drawImage(img, x, y - len, step + 1, len);
                            }
                        });
                        ctx.globalAlpha = 1;
                        ctx.globalCompositeOperation = 'source-over';
                    }
                },
                bokeh: {
                    opacity: 0.4,
                    init() {
                        const n = Math.min(45, Math.floor(W * H / 38000));
                        return { b: Array.from({ length: n }, () => this.spawn(rand(0, H))) };
                    },
                    spawn(y) {
                        const d = Math.random();
                        return { x: rand(0, W), y, d, r: 12 + d * 80, vy: -(0.12 + d * 0.45), ph: rand(0, 6.3), dh: rand(-30, 30), a: 0.5 - d * 0.28 };
                    },
                    draw(s, dt, { h, s: sat }) {
                        ctx.clearRect(0, 0, W, H);
                        const S = Math.min(100, sat * 1.2);
                        ctx.globalCompositeOperation = 'lighter';
                        s.b.forEach((p, i) => {
                            p.y += p.vy * dt;
                            p.ph += 0.02 * dt;
                            p.x += Math.sin(p.ph) * 0.25 * dt;
                            if (p.y < -p.r) s.b[i] = this.spawn(H + p.r);
                            drawSprite('disc', p.x, p.y, p.r, h + p.dh, S, 62, p.a * (0.75 + 0.25 * Math.sin(p.ph * 1.7)));
                        });
                        ctx.globalCompositeOperation = 'source-over';
                    }
                },
                grid: {
                    opacity: 0.4,
                    init() { return { z: 0 }; },
                    draw(s, dt, { h, s: sat }) {
                        ctx.clearRect(0, 0, W, H);
                        s.z = (s.z + 0.012 * dt) % 1;
                        const hor = H * 0.6, S = Math.min(100, Math.max(sat, 25) * 1.1), cx = W / 2;
                        const R = Math.min(W, H) * 0.18, cy = hor - R * 0.6;
                        drawSprite('glow', cx, cy, R * 2.4, h + 20, S, 60, 0.35);
                        const sun = ctx.createLinearGradient(0, cy - R, 0, cy + R);
                        sun.addColorStop(0, hsla(h + 45, S, 72, 0.95));
                        sun.addColorStop(1, hsla(h - 25, S, 55, 0.95));
                        ctx.fillStyle = sun;
                        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
                        ctx.globalCompositeOperation = 'destination-out';
                        for (let i = 0; i < 6; i++) ctx.fillRect(cx - R, cy + R * (0.02 + i * 0.105), 2 * R, 1.5 + i * 1.2);
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.clearRect(0, hor, W, H - hor);
                        const floor = ctx.createLinearGradient(0, hor, 0, H);
                        floor.addColorStop(0, hsla(h, S, 45, 0.22));
                        floor.addColorStop(1, hsla(h, S, 30, 0));
                        ctx.fillStyle = floor;
                        ctx.fillRect(0, hor, W, H - hor);
                        ctx.strokeStyle = hsla(h, S, 68, 1);
                        ctx.lineWidth = 1.2;
                        const n = 18;
                        for (let i = -n; i <= n; i++) {
                            ctx.globalAlpha = 0.55;
                            ctx.beginPath(); ctx.moveTo(cx + i * 6, hor); ctx.lineTo(cx + i * (W / n) * 1.4, H); ctx.stroke();
                        }
                        for (let i = 0; i < 18; i++) {
                            const d = i + 1 - s.z, y = hor + (H - hor) * 0.9 / d;
                            if (y > H) continue;
                            ctx.globalAlpha = Math.min(0.8, 1.2 / d);
                            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
                        }
                        ctx.globalAlpha = 1;
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = hsla(h + 20, S, 75, 0.9);
                        ctx.beginPath(); ctx.moveTo(0, hor); ctx.lineTo(W, hor); ctx.stroke();
                        const haze = ctx.createLinearGradient(0, hor, 0, hor + (H - hor) * 0.3);
                        haze.addColorStop(0, 'rgba(0, 0, 0, 1)');
                        haze.addColorStop(1, 'rgba(0, 0, 0, 0)');
                        ctx.globalCompositeOperation = 'destination-out';
                        ctx.fillStyle = haze;
                        ctx.fillRect(0, hor + 1, W, (H - hor) * 0.3);
                        ctx.globalCompositeOperation = 'source-over';
                    }
                },
                snow: {
                    opacity: 0.5,
                    init() {
                        const n = Math.min(260, Math.floor(W * H / 6000));
                        return { f: Array.from({ length: n }, () => this.spawn(rand(0, H))), windT: rand(0, 100) };
                    },
                    spawn(y) {
                        const d = Math.random() ** 1.5;
                        return { x: rand(0, W), y, d, r: 0.8 + d * 2.6, ph: rand(0, 6.3) };
                    },
                    draw(s, dt, { h, s: sat }) {
                        ctx.clearRect(0, 0, W, H);
                        s.windT += 0.004 * dt;
                        const wind = Math.sin(s.windT) * 0.6 + Math.sin(s.windT * 2.7) * 0.3;
                        const S = sat * 0.4;
                        const packs = Array.from({ length: 4 }, () => new Path2D());
                        s.f.forEach((p, i) => {
                            p.ph += 0.03 * dt;
                            p.y += (0.35 + p.d * 1.4) * dt;
                            p.x += (wind * (0.4 + p.d) + Math.sin(p.ph) * 0.3) * dt;
                            if (p.y > H + 5) { s.f[i] = this.spawn(-5); return; }
                            if (p.x > W + 5) p.x = -5; else if (p.x < -5) p.x = W + 5;
                            if (p.d > 0.6) drawSprite('glow', p.x, p.y, p.r * 3.5, h, S, 85, 0.45);
                            const pack = packs[Math.min(3, p.d * 4 | 0)];
                            pack.moveTo(p.x + p.r, p.y);
                            pack.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                        });
                        ctx.fillStyle = hsla(h, S, 90, 1);
                        packs.forEach((pack, i) => { ctx.globalAlpha = 0.45 + (i + 0.5) / 4 * 0.55; ctx.fill(pack); });
                        ctx.globalAlpha = 1;
                    }
                }
            };

            function draw(cur, dt, th) {
                const def = BACKGROUNDS[cur] || BACKGROUNDS.matrix;
                let op;
                if (bgName !== cur) {
                    bgName = cur;
                    ctx.clearRect(0, 0, W, H);
                    bg = def.init();
                    op = def.opacity;
                }
                def.draw(bg, dt, th);
                return op;
            }
            return {
                attach(c) { ctx = c; },
                size(w, h) { W = w; H = h; bgName = ''; },
                mouse(x, y) { mouse.x = x; mouse.y = y; },
                reset() { bgName = ''; },
                draw
            };
        }
        function bgWorkerMain() {
            let eng = null, canvas = null, cfg = { run: false, name: 'matrix', h: 210, s: 100 }, last = 0;
            const raf = self.requestAnimationFrame ? f => self.requestAnimationFrame(f) : f => setTimeout(() => f(performance.now()), 16);
            const loop = t => {
                raf(loop);
                const gap = last ? t - last : 16.7;
                last = t;
                if (!cfg.run || !eng) return;
                const op = eng.draw(cfg.name, Math.min(3, gap / 50), { h: cfg.h, s: cfg.s });
                if (op != null) postMessage({ t: 'op', v: op });
            };
            onmessage = e => {
                const m = e.data;
                if (m.t === 'init') {
                    canvas = m.canvas;
                    canvas.width = m.w;
                    canvas.height = m.h;
                    eng = bgEngine((w, h) => new OffscreenCanvas(w || 1, h || 1));
                    eng.attach(canvas.getContext('2d'));
                    eng.size(m.w, m.h);
                    raf(loop);
                } else if (m.t === 'size') {
                    canvas.width = m.w;
                    canvas.height = m.h;
                    eng.size(m.w, m.h);
                } else if (m.t === 'cfg') cfg = m;
                else if (m.t === 'mouse') eng.mouse(m.x, m.y);
                else if (m.t === 'reset') eng.reset();
            };
        }
        let W = 0, H = 0, bgW = null, bgStarted = false, bgReady = false, bgSent = '', bgMouseSent = '', bgWhy = 'ещё не запускали';
        const bgMain = bgEngine(() => document.createElement('canvas'));
        const mouse = { x: -1e4, y: -1e4 };
        let canvasRect = { left: 0, top: 0, width: 1, height: 1 };
        addEventListener('pointermove', e => {
            mouse.x = (e.clientX - canvasRect.left) * W / canvasRect.width;
            mouse.y = (e.clientY - canvasRect.top) * H / canvasRect.height;
        }, { passive: true });
        document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
        function bgFallback() {
            if (!bgW) return;
            bgWhy = 'воркер не запустился (политика сайта или браузер)';
            try { bgW.terminate(); } catch (e) { }
            bgW = null;
            const fresh = document.createElement('canvas');
            fresh.className = canvas.className;
            fresh.style.opacity = canvas.style.opacity;
            canvas.replaceWith(fresh);
            canvas = fresh;
            if (typeof canvasRO !== 'undefined') canvasRO.observe(canvas);
            canvas.width = W;
            canvas.height = H;
            bgMain.attach(canvas.getContext('2d'));
            bgMain.size(W, H);
            bgSent = '';
        }
        function bgStart() {
            const w = W, h = H;
            bgReady = true;
            try {
                if (typeof Worker !== 'function' || typeof OffscreenCanvas !== 'function' || !canvas.transferControlToOffscreen) throw new Error('нет воркеров');
                const off = canvas.transferControlToOffscreen();
                const url = URL.createObjectURL(new Blob(['const bgEngine = ' + bgEngine.toString() + ';\n(' + bgWorkerMain.toString() + ')();'], { type: 'text/javascript' }));
                const wk = new Worker(url);
                setTimeout(() => URL.revokeObjectURL(url), 10000);
                wk.onmessage = e => { if (e.data && e.data.t === 'op') canvas.style.opacity = e.data.v; };
                wk.onerror = e => { if (e && e.preventDefault) e.preventDefault(); console.warn('[ITD VP] фон в воркере не запустился, рисую в странице', e && e.message); bgFallback(); };
                wk.postMessage({ t: 'init', canvas: off, w, h }, [off]);
                bgW = wk;
                bgWhy = 'воркер запущен';
            } catch (e) {
                bgW = null;
                bgWhy = 'воркеры недоступны: ' + (e && e.message || e);
                canvas.width = w;
                canvas.height = h;
                bgMain.attach(canvas.getContext('2d'));
                bgMain.size(w, h);
            }
        }
        function resizeCanvas() {
            const r = canvas.getBoundingClientRect();
            const w = Math.round(r.width) || innerWidth, h = Math.round(r.height) || innerHeight;
            canvasRect = { left: r.left, top: r.top, width: r.width || w, height: r.height || h };
            if (w === W && h === H) return;
            W = w;
            H = h;
            if (!bgStarted) { bgStarted = true; setTimeout(bgStart, 900); return; }
            if (!bgReady) return;
            if (bgW) bgW.postMessage({ t: 'size', w, h });
            else { canvas.width = w; canvas.height = h; bgMain.size(w, h); }
        }
        function bgReset() {
            if (bgW) bgW.postMessage({ t: 'reset' });
            else bgMain.reset();
        }
        function bgFrame(dt) {
            if (!bgReady) return;
            const want = backgroundEnabled && !introOn, name = effBg();
            if (bgW) {
                const th = theme(), run = want && name !== 'custom';
                const key = run + '|' + name + '|' + Math.round(th.h * 4) + '|' + Math.round(th.s);
                if (key !== bgSent) { bgSent = key; bgW.postMessage({ t: 'cfg', run, name, h: th.h, s: th.s }); }
                const mk = Math.round(mouse.x) + ',' + Math.round(mouse.y);
                if (run && mk !== bgMouseSent) { bgMouseSent = mk; bgW.postMessage({ t: 'mouse', x: mouse.x, y: mouse.y }); }
                return;
            }
            if (!want || name === 'custom') return;
            bgMain.mouse(mouse.x, mouse.y);
            const op = bgMain.draw(name, dt, theme());
            if (op != null) canvas.style.opacity = op;
        }
        function theme() {
            const key = bgGuest ? bgGuest.n : currentStyle;
            if (key === 'rainbow') return { h: globalHue, s: 100 };
            const st = nickStyles[key] || nickStyles[currentStyle];
            return { h: st.matrixHue || 210, s: st.matrixSat ?? 100 };
        }

        const paintStyle = document.createElement('style');
        paintStyle.textContent = '.vp-my-nick {} .vp-my-nick-box {} .my-avatar-glow {} article.vp-post:hover {} '
            + '.vp-nav-link.vp-active .vp-nav-icon {} .vp-tabs > div:empty {} :root {} ::selection {}';
        document.head.appendChild(paintStyle);
        let paintKey = '', paintRootKey = '';


        function paint() {
            const style = nickStyles[currentStyle];
            const rainbow = currentStyle === 'rainbow';
            const dark = isDarkTheme();
            const h = Math.round(globalHue);
            const key = [currentStyle, rainbow ? h : '', dark, nickGlowEnabled, avatarGlowEnabled, postBorderEnabled, neonEnabled].join();
            const nickGlowOn = neonEnabled && nickGlowEnabled, avatarGlowOn = neonEnabled && avatarGlowEnabled;
            if (key === paintKey) return;
            paintKey = key;
            const [nick, nickBox, avatar, post, navIcon, tab, root, selection] = [...paintStyle.sheet.cssRules].map(r => r.style);
            const hsl = `hsl(${h}, 100%, ${dark ? 55 : 42}%)`;
            if (rainbow) {
                nick.cssText = `color: ${hsl} !important;${neonEnabled ? ` text-shadow: 0 0 5px ${hsl} !important;` : ''}`;
            } else if (style.nickCss) {
                nick.cssText = style.nickCss(dark);
            } else {
                const gradient = dark ? style.gradientDark || style.gradientLight
                    : currentStyle === 'white' ? 'linear-gradient(270deg, #1a1a1a, #4a4a4a, #262626)' : style.gradientLight;
                nick.cssText = `background: ${gradient} !important; -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important;`;
            }
            const glow = rainbow ? `drop-shadow(0 0 6px ${hsl}) drop-shadow(0 0 12px ${hsl})`
                : dark ? style.glow
                    : currentStyle === 'white' ? 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.25))'
                        : `brightness(0.8) saturate(1.3) drop-shadow(0 0 5px color-mix(in srgb, ${accentOf(style)} 55%, transparent))`;
            nickBox.cssText = !nickGlowOn ? (dark || rainbow ? '' : 'filter: brightness(0.8) saturate(1.3) !important;')
                : `filter: ${glow} !important;`;
            const ah = style.avatarHue || 210, as = style.avatarSat ?? 100;
            avatar.cssText = !avatarGlowOn ? '' : `filter: ${rainbow
                ? `drop-shadow(0 0 5px ${hsl}) drop-shadow(0 0 12px ${hsl})`
                : `drop-shadow(0 0 3px hsl(${ah}, ${as}%, 60%)) drop-shadow(0 0 6px hsl(${ah}, ${as}%, 60%))`} !important;`;
            post.cssText = '';
            document.documentElement.classList.toggle('vp-post-hl', neonEnabled && postBorderEnabled);

            const accent = rainbow ? `hsl(${h}, 100%, ${dark ? 62 : 45}%)`
                : dark ? accentOf(style)
                    : currentStyle === 'white' ? '#1a1a1a' : `color-mix(in srgb, ${accentOf(style)} 78%, #000)`;
            navIcon.cssText = `color: ${accent} !important;${neonEnabled ? ` filter: drop-shadow(0 0 6px ${accent}) !important;` : ''}`;
            tab.cssText = `box-shadow: inset 0 0 0 1px ${accent}${neonEnabled ? `, 0 0 14px -4px ${accent}` : ''} !important;`;
            const rootKey = (rainbow ? 'r' + Math.round(h / 30) : accent) + dark;
            if (rootKey !== paintRootKey) {
                paintRootKey = rootKey;
                const slow = rainbow ? `hsl(${Math.round(h / 30) * 30}, 100%, ${dark ? 62 : 45}%)` : accent;
                root.cssText = `--vp-accent: ${slow}; --vp-on-accent: ${onAccentFor(slow, dark)}; scrollbar-color: color-mix(in srgb, ${slow} 55%, transparent) transparent;`;
                selection.cssText = `background: color-mix(in srgb, ${slow} 45%, transparent) !important;`;
            }
        }
        const lookStyleEl = document.createElement('style');
        (function buildLookCss() {
            const out = ['@keyframes vp-look-rb { 0%, 100% { color: hsl(0, 100%, 58%); } 17% { color: hsl(60, 100%, 50%); } 33% { color: hsl(120, 100%, 45%); }'
                + ' 50% { color: hsl(180, 100%, 45%); } 67% { color: hsl(240, 100%, 66%); } 83% { color: hsl(300, 100%, 62%); } }'];
            for (const [key, st] of Object.entries(nickStyles)) {
                for (const dark of [true, false]) {
                    const th = dark ? 'html.vp-looks:not(.vp-light) ' : 'html.vp-looks.vp-light ';
                    let nick, glow;
                    if (key === 'rainbow') {
                        nick = 'animation: vp-look-rb 8s linear infinite !important; background: none !important; -webkit-text-fill-color: currentColor !important;';
                        glow = 'drop-shadow(0 0 6px hsl(300, 100%, 60%)) drop-shadow(0 0 10px hsl(200, 100%, 60%))';
                    } else {
                        if (st.nickCss) nick = st.nickCss(dark);
                        else {
                            const g = dark ? st.gradientDark || st.gradientLight : key === 'white' ? 'linear-gradient(270deg, #1a1a1a, #4a4a4a, #262626)' : st.gradientLight;
                            nick = `background: ${g} !important; -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important;`;
                        }
                        glow = dark ? st.glow : key === 'white' ? 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.25))'
                            : `brightness(0.8) saturate(1.3) drop-shadow(0 0 5px color-mix(in srgb, ${accentOf(st)} 55%, transparent))`;
                    }
                    out.push(`${th}[data-vp-look="${key}"] { ${nick} }`);
                    if (glow) out.push(`${th}[data-vp-look-glow="${key}"] { filter: ${glow} !important; }`);
                }
                const ah = st.avatarHue || 210, as = st.avatarSat ?? 100;
                out.push(key === 'rainbow'
                    ? `html.vp-looks [data-vp-look-av="${key}"] { filter: drop-shadow(0 0 5px hsl(300, 100%, 60%)) drop-shadow(0 0 10px hsl(190, 100%, 55%)) !important; }`
                    : `html.vp-looks [data-vp-look-av="${key}"] { filter: drop-shadow(0 0 3px hsl(${ah}, ${as}%, 60%)) drop-shadow(0 0 6px hsl(${ah}, ${as}%, 60%)) !important; }`);
            }
            out.push('html.vp-no-neon .vp-my-nick, html.vp-no-neon [data-vp-look], html.vp-no-neon [data-vp-look] * { text-shadow: none !important; }',
                'html.vp-no-neon.vp-no-neon [data-vp-look-glow], html.vp-no-neon.vp-no-neon [data-vp-look-av] { filter: none !important; }',
                'html.vp-no-neon .vp-gal-ind { box-shadow: inset 0 0 0 1px var(--vp-accent) !important; }',
                'html.vp-no-neon .vp-nav-blob { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 32%, transparent) !important; }',
                'html.vp-no-neon .vp-portal { animation: none !important; filter: none !important; }');
            lookStyleEl.textContent = out.join('\n');
            document.head.appendChild(lookStyleEl);
        })();
