        const styleBgCanvas = addCss(`
        .vp-bg-canvas {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;
            opacity: 0.2; pointer-events: none; transition: opacity .4s ease;
        }
        .vp-bg-canvas.vp-bg-off { display: none; }
    `);
        const canvas = document.createElement('canvas');
        canvas.className = 'vp-bg-canvas';
        document.body.appendChild(canvas);
        const canvasGL = document.createElement('canvas');
        canvasGL.className = 'vp-bg-canvas vp-bg-off';
        document.body.appendChild(canvasGL);
        let bgGlShown = false;
        function bgSurface() {
            const hide = !backgroundEnabled || effBg() === 'custom';
            canvas.classList.toggle('vp-bg-off', hide || bgGlShown);
            canvasGL.classList.toggle('vp-bg-off', hide || !bgGlShown);
        }
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
                canvasGL.classList.add('vp-bg-off');
                return;
            }
            bgSurface();
            bgMedia.classList.toggle('vp-bg-off', !backgroundEnabled || !custom);
            const v = bgMedia.querySelector('video');
            if (v) { if (backgroundEnabled && custom) v.play().catch(() => { }); else v.pause(); }
            if (backgroundEnabled && custom && !bgMedia.firstChild) showBgMedia();
        }
        updateBackgroundVisibility();
        const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        const BG_KEYS = ['matrix', 'stars', 'particles', 'waves', 'aurora', 'bokeh', 'grid', 'snow'];
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
                        : kind === 'haze' ? [[0, 1], [0.35, 0.55], [1, 0]] : [[0, 1], [0.35, 0.4], [0.7, 0.08], [1, 0]];
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
                    opacity: 0.6,
                    init() {
                        const k = Math.min(2.2, Math.max(0.5, Math.sqrt(W * H / 196000)));
                        const mk = (n, rmin, rmax, vmin, vmax, amax) => Array.from({ length: Math.round(n * k) }, () => {
                            const g = Math.random() * 4 | 0;
                            return { x: rand(0, W), y: rand(0, H), r: rand(rmin, rmax), v: rand(vmin, vmax), g, a: amax * (0.6 + g * 0.4 / 3), ph: rand(0, 6.3) };
                        });
                        const far = mk(150, 0.5, 1.1, 0.5, 0.9, 0.5), mid = mk(70, 1.2, 2.1, 1.1, 1.8, 0.7), near = mk(10, 9, 26, 2.2, 3.6, 0.2);
                        const cr = Array.from({ length: Math.round(12 * k) }, () => {
                            const r = rand(5, 14);
                            return { x: rand(0, W), y: rand(0, H), r, v: 0.5 + r * 0.07, ph: rand(0, 6.3), rot: rand(0, Math.PI * 2), rs: rand(-0.02, 0.02) };
                        });
                        return { t: rand(0, 100), far, mid, near, cr };
                    },
                    draw(s, dt, { h, s: sat }) {
                        ctx.clearRect(0, 0, W, H);
                        const u = dt * 3, S = sat * 0.4;
                        s.t += 0.016 * u;
                        const gust = Math.max(0, Math.sin(s.t * 0.7)) ** 3, wind = 1.1 + Math.sin(s.t * 0.4) * 0.6 + gust * 3.2;
                        ctx.fillStyle = hsla(h, S, 92, 1);
                        for (const [arr, k] of [[s.far, 0.5], [s.mid, 1]]) {
                            const packs = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
                            for (const p of arr) {
                                const vx = wind * k * (0.7 + p.r * 0.2);
                                p.ph += 0.02 * u;
                                p.x += (vx + Math.sin(p.ph) * 0.2) * u; p.y += p.v * u;
                                if (p.y > H + 4) { p.y = -4; p.x = rand(0, W); }
                                if (p.x > W + 6) p.x = -6;
                                packs[p.g].moveTo(p.x + p.r * 0.8, p.y);
                                packs[p.g].arc(p.x, p.y, p.r * 0.8, 0, Math.PI * 2);
                            }
                            const am = arr === s.far ? 0.5 : 0.7;
                            packs.forEach((pack, g) => { ctx.globalAlpha = am * (0.6 + g * 0.4 / 3); ctx.fill(pack); });
                        }
                        ctx.lineCap = 'round';
                        ctx.strokeStyle = hsla(h, S, 94, 1);
                        for (const p of s.cr) {
                            p.ph += 0.02 * u; p.rot += p.rs * u * (1 + gust * 2);
                            p.x += (wind * 0.9 + Math.sin(p.ph) * 0.3) * u; p.y += p.v * u;
                            if (p.y > H + 20) { p.y = -20; p.x = rand(-20, W); }
                            if (p.x > W + 20) p.x = -20;
                            ctx.globalAlpha = 0.6 + p.r / 14 * 0.35;
                            ctx.lineWidth = p.r > 9 ? 1.3 : 1;
                            ctx.beginPath();
                            for (let i = 0; i < 6; i++) {
                                const an = p.rot + i * Math.PI / 3, c = Math.cos(an), sn = Math.sin(an);
                                ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + c * p.r, p.y + sn * p.r);
                                const bx = p.x + c * p.r * 0.55, by = p.y + sn * p.r * 0.55;
                                for (const d of [-1, 1]) { const bb = an + d * 1.05; ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(bb) * p.r * 0.34, by + Math.sin(bb) * p.r * 0.34); }
                            }
                            ctx.stroke();
                        }
                        for (const p of s.near) {
                            p.ph += 0.01 * u;
                            p.x += (wind * 1.6 + Math.sin(p.ph) * 0.4) * u; p.y += p.v * u;
                            if (p.y > H + 30) { p.y = -30; p.x = rand(-20, W); }
                            if (p.x > W + 30) p.x = -30;
                            drawSprite('haze', p.x, p.y, p.r, h, S, 90, p.a);
                        }
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
        const BG_RES = { aurora: 0.5, bokeh: 0.5, waves: 0.6, grid: 0.75, snow: 0.75 };
        let W = 0, H = 0, bgK = 1, bgOn = false;
        const bgMain = bgEngine(() => document.createElement('canvas'));
        const bgCtx = canvas.getContext('2d');
        bgMain.attach(bgCtx);
        const mouse = { x: -1e4, y: -1e4 };
        let canvasRect = { left: 0, top: 0, width: 1, height: 1 };
        addEventListener('pointermove', e => {
            mouse.x = (e.clientX - canvasRect.left) * W / canvasRect.width;
            mouse.y = (e.clientY - canvasRect.top) * H / canvasRect.height;
        }, { passive: true });
        document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
        function bgFit() {
            canvas.width = Math.max(1, Math.round(W * bgK));
            canvas.height = Math.max(1, Math.round(H * bgK));
            bgCtx.setTransform(bgK, 0, 0, bgK, 0, 0);
            bgMain.size(W, H);
        }
        function resizeCanvas() {
            const r = canvas.getBoundingClientRect();
            const w = Math.round(r.width) || innerWidth, h = Math.round(r.height) || innerHeight;
            canvasRect = { left: r.left, top: r.top, width: r.width || w, height: r.height || h };
            if (w === W && h === H) return;
            W = w;
            H = h;
            bgFit();
        }
        const GL_STYLES = {};
        let bgGl = null, bgGlFail = false, glName = '', glSize = '', glLast = 0, glSlow = 0, glFrames = 0;
        function hslRgb(h, s, l) {
            h = (((h % 360) + 360) % 360) / 360; s /= 100; l /= 100;
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
            const f = t => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
            return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
        }
        const GLK = {
            hslRgb,
            vs: 'attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }',
            program(gl, vs, fs) {
                const sh = (type, text) => { const o = gl.createShader(type); gl.shaderSource(o, text); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
                const pr = gl.createProgram();
                gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs));
                gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
                gl.linkProgram(pr);
                if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
                return pr;
            },
            bindFull(gl, pr) {
                if (!gl.__full) { gl.__full = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, gl.__full); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); }
                gl.bindBuffer(gl.ARRAY_BUFFER, gl.__full);
                const at = gl.getAttribLocation(pr, 'aPos');
                gl.enableVertexAttribArray(at);
                gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
            }
        };
        function bgGlInit() {
            if (bgGlFail) return null;
            if (bgGl) return bgGl;
            try {
                const gl = canvasGL.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: !GM_getValue('bgGlForce', false) });
                if (!gl) throw new Error('нет WebGL');
                const di = gl.getExtension('WEBGL_debug_renderer_info'), rn = di ? String(gl.getParameter(di.UNMASKED_RENDERER_WEBGL)) : '';
                if (!GM_getValue('bgGlForce', false) && /swiftshader|llvmpipe|software|basic render/i.test(rn)) throw new Error('видеокарта программная: ' + rn);
                gl.clearColor(0, 0, 0, 0);
                canvasGL.addEventListener('webglcontextlost', e => { e.preventDefault(); bgGlFail = true; bgGl = null; bgGlShown = false; bgSurface(); });
                bgGl = { gl, insts: {} };
                return bgGl;
            } catch (e) {
                bgGlFail = true;
                console.warn('[ITD VP] фон на видеокарте не запустился, рисую обычным способом', e && e.message || e);
                return null;
            }
        }
        function bgGlDraw(name, dt) {
            const def = GL_STYLES[name];
            if (!def || def.broken) return false;
            const g = bgGlInit();
            if (!g) return false;
            const gl = g.gl;
            const now = performance.now(), gap = glLast ? now - glLast : 16;
            glLast = now;
            if (glFrames < 400 && gap < 400) {
                glFrames++;
                glSlow = gap > 45 ? glSlow + 1 : Math.max(0, glSlow - 1);
                if (glSlow > 40) {
                    bgGlFail = true;
                    bgGl = null;
                    bgGlShown = false;
                    bgSurface();
                    console.warn('[ITD VP] видеокарта не тянет фон, возвращаю обычное рисование');
                    return false;
                }
            }
            if (canvasGL.width !== W || canvasGL.height !== H) { canvasGL.width = W; canvasGL.height = H; gl.viewport(0, 0, W, H); }
            let inst = g.insts[name];
            if (!inst) {
                try { inst = g.insts[name] = def.create(gl, GLK); } catch (e) { def.broken = true; console.warn('[ITD VP] фон «' + name + '» на видеокарте не запустился, рисую обычным способом', e && e.message || e); return false; }
            }
            const size = W + 'x' + H;
            if (glName !== name || glSize !== size) {
                glName = name;
                glSize = size;
                canvasGL.style.opacity = def.opacity;
                inst.enter(W, H);
            }
            gl.disable(gl.BLEND);
            gl.clear(gl.COLOR_BUFFER_BIT);
            inst.draw({ gl, dt, W, H, th: theme(), mouse });
            if (!bgGlShown) { bgGlShown = true; bgSurface(); }
            return true;
        }
        function bgReset() { bgMain.reset(); glName = ''; }
        function bgFrame(dt) {
            const name = effBg();
            if (!backgroundEnabled || introOn || name === 'custom' || !W) return;
            if (GL_STYLES[name] && bgGlDraw(name, dt)) return;
            if (bgGlShown) { bgGlShown = false; bgSurface(); }
            const k = BG_RES[name] || 1;
            if (k !== bgK) { bgK = k; bgFit(); }
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
            const hslA = al => `hsl(${h} 100% ${dark ? 55 : 42}% / ${al})`;
            if (rainbow) {
                nick.cssText = `color: ${hsl} !important;${neonEnabled ? ` text-shadow: 0 0 5px ${hsl} !important;` : ''}`;
            } else if (style.nickCss) {
                nick.cssText = style.nickCss(dark);
            } else {
                const gradient = dark ? style.gradientDark || style.gradientLight
                    : currentStyle === 'white' ? 'linear-gradient(270deg, #1a1a1a, #4a4a4a, #262626)' : style.gradientLight;
                nick.cssText = `background: ${gradient} !important; -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important;`;
            }
            const glow = rainbow ? `drop-shadow(0 0 3px ${hslA(.6)}) drop-shadow(0 0 6px ${hslA(.3)})`
                : dark ? style.glow
                    : currentStyle === 'white' ? 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.25))'
                        : `brightness(0.8) saturate(1.3) drop-shadow(0 0 5px color-mix(in srgb, ${accentOf(style)} 55%, transparent))`;
            nickBox.cssText = !nickGlowOn ? (dark || rainbow ? '' : 'filter: brightness(0.8) saturate(1.3) !important;')
                : `filter: ${glow} !important;`;
            const ah = style.avatarHue || 210, as = style.avatarSat ?? 100;
            avatar.cssText = !avatarGlowOn ? '' : `filter: ${rainbow
                ? `drop-shadow(0 0 3px ${hslA(.6)}) drop-shadow(0 0 6px ${hslA(.3)})`
                : `drop-shadow(0 0 3px hsl(${ah} ${as}% 60% / .6)) drop-shadow(0 0 6px hsl(${ah} ${as}% 60% / .3))`} !important;`;
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
                        glow = 'drop-shadow(0 0 3px hsl(300 100% 60% / .6)) drop-shadow(0 0 5px hsl(200 100% 60% / .3))';
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
                    ? `html.vp-looks [data-vp-look-av="${key}"] { filter: drop-shadow(0 0 3px hsl(300 100% 60% / .6)) drop-shadow(0 0 5px hsl(190 100% 55% / .3)) !important; }`
                    : `html.vp-looks [data-vp-look-av="${key}"] { filter: drop-shadow(0 0 3px hsl(${ah} ${as}% 60% / .6)) drop-shadow(0 0 6px hsl(${ah} ${as}% 60% / .3)) !important; }`);
            }
            out.push('html.vp-no-neon .vp-my-nick, html.vp-no-neon [data-vp-look], html.vp-no-neon [data-vp-look] * { text-shadow: none !important; }',
                'html.vp-no-neon.vp-no-neon [data-vp-look-glow], html.vp-no-neon.vp-no-neon [data-vp-look-av] { filter: none !important; }',
                'html.vp-no-neon .vp-gal-ind { box-shadow: inset 0 0 0 1px var(--vp-accent) !important; }',
                'html.vp-no-neon .vp-nav-blob { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 32%, transparent) !important; }',
                'html.vp-no-neon .vp-portal { animation: none !important; filter: none !important; }');
            lookStyleEl.textContent = out.join('\n');
            document.head.appendChild(lookStyleEl);
        })();
