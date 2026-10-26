        const GLP_VS = `attribute vec2 aPos;
attribute vec2 aLoc;
attribute vec4 aCol;
attribute vec4 aPar;
uniform vec2 uRes;
varying vec2 vL;
varying vec4 vC;
varying vec4 vP;
void main() {
    gl_Position = vec4(aPos.x / uRes.x * 2.0 - 1.0, 1.0 - aPos.y / uRes.y * 2.0, 0.0, 1.0);
    vL = aLoc;
    vC = aCol;
    vP = aPar;
}`;
        const GLP_FS = `precision highp float;
uniform vec4 uHead;
uniform vec4 uTail;
varying vec2 vL;
varying vec4 vC;
varying vec4 vP;
float glow(float d) {
    if (d >= 1.0) return 0.0;
    if (d < 0.35) return mix(1.0, 0.4, d / 0.35);
    if (d < 0.7) return mix(0.4, 0.08, (d - 0.35) / 0.35);
    return mix(0.08, 0.0, (d - 0.7) / 0.3);
}
float cdf(float x, float a, float b) {
    float p = (a + b) * 0.5, q = (a - b) * 0.5, ax = abs(x), r;
    if (ax >= p) r = 1.0;
    else if (ax > q) r = 1.0 - (p - ax) * (p - ax) / (2.0 * a * b);
    else r = 0.5 + ax / a;
    return x < 0.0 ? 1.0 - r : r;
}
float disc(vec2 l, float r) {
    float s = 0.0;
    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 4; j++) {
            vec2 o = vec2(float(i), float(j)) * 0.25 - 0.375;
            s += step(length(l + o), r);
        }
    }
    return s / 16.0;
}
void main() {
    float a0 = vP.w, b0 = max(0.001, sqrt(max(0.0, 1.0 - a0 * a0)));
    vec4 c = vC;
    float a;
    if (vP.x < 0.5) {
        a = glow(length(vL));
    } else if (vP.x < 1.5) {
        a = disc(vL, vP.y * 0.97);
    } else if (vP.x < 2.5) {
        float d = length(vec2(vL.x - clamp(vL.x, 0.0, vP.y), vL.y));
        a = cdf(d + vP.z, a0, b0) - cdf(d - vP.z, a0, b0);
        c = mix(uHead, uTail, clamp(vL.x / vP.y, 0.0, 1.0));
    } else {
        a = clamp(1.0 - abs(vL.y) / a0, 0.0, 1.0) * clamp(vL.x * a0 + 0.5, 0.0, 1.0) * clamp((vP.y - vL.x) * a0 + 0.5, 0.0, 1.0);
    }
    a *= c.a;
    gl_FragColor = vec4(c.rgb * a, a);
}`;
        const glRgb = (K, h, s, l) => K.hslRgb(Math.round(h), Math.round(s), Math.round(l));
        function glPtsKit(gl, K) {
            const pr = K.program(gl, GLP_VS, GLP_FS);
            const buf = gl.createBuffer();
            const at = ['aPos', 'aLoc', 'aCol', 'aPar'].map(n => gl.getAttribLocation(pr, n));
            const sizes = [2, 2, 4, 4];
            const uRes = gl.getUniformLocation(pr, 'uRes'), uHead = gl.getUniformLocation(pr, 'uHead'), uTail = gl.getUniformLocation(pr, 'uTail');
            let data = new Float32Array(12 * 6 * 2048), n = 0, gpu = 0;
            const put = (x, y, lx, ly, col, a, p0, p1, p2, p3) => {
                if (n + 12 > data.length) { const bigger = new Float32Array(data.length * 2); bigger.set(data); data = bigger; }
                data[n] = x; data[n + 1] = y; data[n + 2] = lx; data[n + 3] = ly;
                data[n + 4] = col[0]; data[n + 5] = col[1]; data[n + 6] = col[2]; data[n + 7] = a;
                data[n + 8] = p0; data[n + 9] = p1; data[n + 10] = p2; data[n + 11] = p3;
                n += 12;
            };
            const rect = (cx, cy, e, l, col, a, p0, p1, p2, p3) => {
                put(cx - e, cy - e, -l, -l, col, a, p0, p1, p2, p3);
                put(cx + e, cy - e, l, -l, col, a, p0, p1, p2, p3);
                put(cx + e, cy + e, l, l, col, a, p0, p1, p2, p3);
                put(cx - e, cy - e, -l, -l, col, a, p0, p1, p2, p3);
                put(cx + e, cy + e, l, l, col, a, p0, p1, p2, p3);
                put(cx - e, cy + e, -l, l, col, a, p0, p1, p2, p3);
            };
            return {
                glow(x, y, r, col, a) { rect(x, y, r, 1, col, Math.max(0, Math.min(1, a)), 0, 0, 0, 1); },
                disc(x, y, r, col, a) { rect(x, y, r + 1, r + 1, col, a, 1, r, 0, 1); },
                seg(kind, x1, y1, x2, y2, hw, ext, col, a) {
                    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
                    if (len < 0.001) return;
                    const ux = dx / len, uy = dy / len, nx = -uy, ny = ux, k = Math.max(Math.abs(ux), Math.abs(uy)), m = hw + 1.5, s0 = -ext, s1 = len + ext;
                    const v = (s, t) => put(x1 + ux * s + nx * t, y1 + uy * s + ny * t, s, t, col, a, kind, len, hw, k);
                    v(s0, -m); v(s0, m); v(s1, m);
                    v(s0, -m); v(s1, m); v(s1, -m);
                },
                flush(W, H, head, tail) {
                    if (n) {
                        gl.useProgram(pr);
                        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                        if (data.length > gpu) { gpu = data.length; gl.bufferData(gl.ARRAY_BUFFER, gpu * 4, gl.DYNAMIC_DRAW); }
                        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, n));
                        let off = 0;
                        at.forEach((loc, i) => {
                            gl.enableVertexAttribArray(loc);
                            gl.vertexAttribPointer(loc, sizes[i], gl.FLOAT, false, 48, off);
                            off += sizes[i] * 4;
                        });
                        gl.uniform2f(uRes, W, H);
                        gl.uniform4fv(uHead, head || [0, 0, 0, 0]);
                        gl.uniform4fv(uTail, tail || [0, 0, 0, 0]);
                        gl.enable(gl.BLEND);
                        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                        gl.drawArrays(gl.TRIANGLES, 0, n / 12);
                        gl.disable(gl.BLEND);
                        at.forEach(loc => gl.disableVertexAttribArray(loc));
                    }
                    n = 0;
                }
            };
        }
        GL_STYLES.stars = {
            opacity: 0.4,
            create(gl, K) {
                const kit = glPtsKit(gl, K);
                const packs = Array.from({ length: 8 }, () => []);
                let stars = [], shoot = null, wait = 0;
                return {
                    enter(W, H) {
                        const n = Math.min(600, Math.floor(W * H / 3500));
                        stars = Array.from({ length: n }, () => {
                            const d = Math.random() ** 2;
                            return { x: glRand(0, W), y: glRand(0, H), d, r: 0.5 + d * 1.8, ph: glRand(0, 6.3), sp: glRand(0.03, 0.1) };
                        });
                        shoot = null;
                        wait = glRand(40, 120);
                    },
                    draw(c) {
                        const { W, H, dt } = c, h = c.th.h, S = Math.min(100, c.th.s * 1.2);
                        const glowCol = glRgb(K, h, S, 70), dotCol = glRgb(K, h, S, 82);
                        packs.forEach(p => { p.length = 0; });
                        for (const st of stars) {
                            st.ph += st.sp * dt;
                            st.x -= (0.03 + st.d * 0.3) * dt;
                            if (st.x < -5) { st.x = W + 5; st.y = glRand(0, H); }
                            const a = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(st.ph));
                            if (st.r > 1.4) kit.glow(st.x, st.y, st.r * 7, glowCol, a * 0.3);
                            packs[Math.min(7, a * 8 | 0)].push(st.x, st.y, st.r);
                        }
                        packs.forEach((p, i) => {
                            for (let j = 0; j < p.length; j += 3) kit.disc(p[j], p[j + 1], p[j + 2], dotCol, (i + 0.5) / 8);
                        });
                        wait -= dt;
                        if (!shoot && wait <= 0) {
                            shoot = { x: glRand(W * 0.3, W * 1.05), y: glRand(-20, H * 0.35), vx: -glRand(16, 24), vy: glRand(6, 10), life: 1 };
                            wait = glRand(80, 220);
                        }
                        let head = null, tail = null;
                        const p = shoot;
                        if (p) {
                            p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.035 * dt;
                            const tx = p.x - p.vx * 7, ty = p.y - p.vy * 7, life = Math.max(0, p.life);
                            head = [...glRgb(K, h, S * 0.5, 95), life];
                            tail = [...glRgb(K, h, S, 70), 0];
                            kit.seg(2, p.x, p.y, tx, ty, 1, 2.5, glowCol, 1);
                            kit.glow(p.x, p.y, 10, glRgb(K, h, S * 0.5, 90), p.life * 0.8);
                            if (p.life <= 0 || p.x < -200 || p.y > H + 200) shoot = null;
                        }
                        kit.flush(W, H, head, tail);
                    }
                };
            }
        };
        GL_STYLES.particles = {
            opacity: 0.35,
            create(gl, K) {
                const kit = glPtsKit(gl, K);
                const lines = Array.from({ length: 6 }, () => []);
                let ps = [];
                return {
                    enter(W, H) {
                        const n = Math.min(130, Math.floor(W * H / 14000));
                        ps = Array.from({ length: n }, () => ({ x: glRand(0, W), y: glRand(0, H), vx: glRand(-0.6, 0.6), vy: glRand(-0.6, 0.6), r: glRand(1.2, 3), ph: glRand(0, 6.3) }));
                    },
                    draw(c) {
                        const { W, H, dt, mouse } = c, h = c.th.h;
                        const S = Math.min(100, c.th.s * 1.4), link = Math.max(110, Math.min(170, Math.min(W, H) * 0.14)), link2 = link * link;
                        for (const p of ps) {
                            const dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
                            if (d2 < 48000 && d2 > 1) {
                                const d = Math.sqrt(d2), f = (d < 90 ? -1.2 : 0.3) / d;
                                p.vx += dx * f * 0.05 * dt; p.vy += dy * f * 0.05 * dt;
                            }
                            const sp = Math.hypot(p.vx, p.vy);
                            if (sp > 1.3) { p.vx *= 1.3 / sp; p.vy *= 1.3 / sp; }
                            if (sp < 0.15) { p.vx += glRand(-0.05, 0.05); p.vy += glRand(-0.05, 0.05); }
                            p.x += p.vx * dt; p.y += p.vy * dt; p.ph += 0.05 * dt;
                            if (p.x < 0 || p.x > W) { p.vx *= -1; p.x = Math.max(0, Math.min(W, p.x)); }
                            if (p.y < 0 || p.y > H) { p.vy *= -1; p.y = Math.max(0, Math.min(H, p.y)); }
                        }
                        lines.forEach(l => { l.length = 0; });
                        const add = (a, x1, y1, x2, y2) => { lines[Math.min(5, a * 6 | 0)].push(x1, y1, x2, y2); };
                        for (let i = 0; i < ps.length; i++) {
                            const a = ps[i];
                            for (let j = i + 1; j < ps.length; j++) {
                                const b = ps[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
                                if (d2 < link2) add(0.45 * (1 - Math.sqrt(d2) / link) / 0.7, a.x, a.y, b.x, b.y);
                            }
                            const mx = mouse.x - a.x, my = mouse.y - a.y, m2 = mx * mx + my * my;
                            if (m2 < link2 * 1.7) add(1 - Math.sqrt(m2 / (link2 * 1.7)), a.x, a.y, mouse.x, mouse.y);
                        }
                        const lineCol = glRgb(K, h, S, 75), glowCol = glRgb(K, h, S, 70), dotCol = glRgb(K, h, S, 85);
                        lines.forEach((l, i) => {
                            for (let j = 0; j < l.length; j += 4) kit.seg(3, l[j], l[j + 1], l[j + 2], l[j + 3], 0.5, 1.5, lineCol, 0.7 * (i + 0.5) / 6);
                        });
                        for (const p of ps) kit.glow(p.x, p.y, p.r * (0.85 + 0.15 * Math.sin(p.ph)) * 5, glowCol, 0.4);
                        for (const p of ps) kit.disc(p.x, p.y, p.r * (0.85 + 0.15 * Math.sin(p.ph)), dotCol, 1);
                        kit.flush(W, H);
                    }
                };
            }
        };
        const GLM_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        GL_STYLES.matrix = {
            opacity: 0.2,
            create(gl, K) {
                const probe = gl.createTexture(), probeFb = gl.createFramebuffer();
                gl.bindTexture(gl.TEXTURE_2D, probe);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                gl.bindFramebuffer(gl.FRAMEBUFFER, probeFb);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, probe, 0);
                const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.bindTexture(gl.TEXTURE_2D, null);
                gl.deleteFramebuffer(probeFb);
                gl.deleteTexture(probe);
                if (!complete) throw new Error('нет рендера в текстуру');
                if (Math.max(innerWidth, innerHeight) > gl.getParameter(gl.MAX_TEXTURE_SIZE)) throw new Error('экран больше предела текстуры');
                const size = 15, cell = 24, pad = 4, per = 16, rows = Math.ceil(GLM_CHARS.length / per), tones = 8;
                const art = document.createElement('canvas');
                art.width = per * cell;
                art.height = tones * rows * cell;
                const ag = art.getContext('2d');
                ag.font = `${size}px monospace`;
                ag.textBaseline = 'top';
                for (let k = 0; k < tones; k++) {
                    const v = 16 + k * 32;
                    ag.fillStyle = `rgb(${v}, ${v}, ${v})`;
                    for (let i = 0; i < GLM_CHARS.length; i++) ag.fillText(GLM_CHARS[i], (i % per) * cell + pad, (k * rows + Math.floor(i / per)) * cell + pad);
                }
                const probe2 = document.createElement('canvas');
                probe2.width = probe2.height = cell;
                const pg = probe2.getContext('2d', { willReadFrequently: true });
                pg.font = `${size}px monospace`;
                pg.textBaseline = 'top';
                const weight = style => {
                    pg.clearRect(0, 0, cell, cell);
                    pg.fillStyle = style;
                    pg.fillText('ヨ', pad, pad);
                    const d = pg.getImageData(0, 0, cell, cell).data;
                    let t = 0;
                    for (let i = 3; i < d.length; i += 4) t += d[i];
                    return t;
                };
                const refs = Array.from({ length: tones }, (_, k) => weight(`rgb(${16 + k * 32}, ${16 + k * 32}, ${16 + k * 32})`));
                const toneCache = new Map();
                const toneOf = (h, s, l) => {
                    const q = Math.round((((h % 360) + 360) % 360) / 6), key = q + ',' + s + ',' + l;
                    let k = toneCache.get(key);
                    if (k !== undefined) return k;
                    if (toneCache.size > 600) toneCache.clear();
                    const w = weight(`hsl(${q * 6}, ${s}%, ${l}%)`);
                    k = 0;
                    refs.forEach((r, i) => { if (Math.abs(r - w) < Math.abs(refs[k] - w)) k = i; });
                    toneCache.set(key, k);
                    return k;
                };
                const filter = () => [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v));
                const atlas = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, atlas);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, art);
                filter();
                const tex = gl.createTexture(), fb = gl.createFramebuffer();
                const prGlyph = K.program(gl, `attribute vec2 aPos;
attribute vec2 aUv;
attribute vec3 aCol;
uniform vec2 uRes;
varying vec2 vUv;
varying vec3 vCol;
void main() {
    gl_Position = vec4(aPos.x / uRes.x * 2.0 - 1.0, 1.0 - aPos.y / uRes.y * 2.0, 0.0, 1.0);
    vUv = aUv;
    vCol = aCol;
}`, `precision highp float;
uniform sampler2D uTex;
varying vec2 vUv;
varying vec3 vCol;
void main() {
    float a = texture2D(uTex, vUv).a;
    gl_FragColor = vec4(vCol * a, a);
}`);
                const prFade = K.program(gl, K.vs, `precision highp float;
uniform float uA;
void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, uA); }`);
                const prShow = K.program(gl, K.vs, `precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
void main() { gl_FragColor = texture2D(uTex, gl_FragCoord.xy / uRes); }`);
                const gAt = ['aPos', 'aUv', 'aCol'].map(n => gl.getAttribLocation(prGlyph, n)), gSizes = [2, 2, 3];
                const gRes = gl.getUniformLocation(prGlyph, 'uRes'), gTex = gl.getUniformLocation(prGlyph, 'uTex');
                const fA = gl.getUniformLocation(prFade, 'uA');
                const sTex = gl.getUniformLocation(prShow, 'uTex'), sRes = gl.getUniformLocation(prShow, 'uRes');
                const buf = gl.createBuffer();
                const clr = [], gly = [];
                let cols = [], fadeAcc = 0, ok = false;
                const quad = (out, x, y, w, h, idx, tone, c) => {
                    const u = (idx % per) * cell / art.width, v = (tone * rows + Math.floor(idx / per)) * cell / art.height, u1 = u + cell / art.width, v1 = v + cell / art.height;
                    const x1 = x + w, y1 = y + h;
                    [[x, y, u, v], [x1, y, u1, v], [x1, y1, u1, v1], [x, y, u, v], [x1, y1, u1, v1], [x, y1, u, v1]].forEach(q => out.push(q[0], q[1], q[2], q[3], c[0], c[1], c[2]));
                };
                const drawList = list => {
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(list), gl.DYNAMIC_DRAW);
                    let off = 0;
                    gAt.forEach((loc, i) => {
                        gl.enableVertexAttribArray(loc);
                        gl.vertexAttribPointer(loc, gSizes[i], gl.FLOAT, false, 28, off);
                        off += gSizes[i] * 4;
                    });
                    gl.drawArrays(gl.TRIANGLES, 0, list.length / 7);
                };
                return {
                    enter(W, H) {
                        gl.bindTexture(gl.TEXTURE_2D, tex);
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                        filter();
                        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
                        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
                        ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
                        if (ok) gl.clear(gl.COLOR_BUFFER_BIT);
                        else GL_STYLES.matrix.broken = true;
                        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                        gl.bindTexture(gl.TEXTURE_2D, null);
                        cols = Array.from({ length: Math.ceil(W / size) }, () => ({ y: glRand(-H / size, H / size), v: glRand(0.35, 1), prev: null }));
                        fadeAcc = 0;
                    },
                    draw(c) {
                        if (!ok) return;
                        const { W, H, dt } = c, h = c.th.h, sat = c.th.s;
                        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
                        gl.enable(gl.BLEND);
                        fadeAcc += dt;
                        const fa = 1 - Math.pow(1 - 0.06, fadeAcc);
                        if (fa >= 0.08) {
                            fadeAcc = 0;
                            gl.useProgram(prFade);
                            K.bindFull(gl, prFade);
                            gl.uniform1f(fA, fa);
                            gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
                            gl.drawArrays(gl.TRIANGLES, 0, 3);
                        }
                        clr.length = 0;
                        gly.length = 0;
                        const headH = Math.round(h), headS = Math.round(Math.min(sat, 50)), headCol = K.hslRgb(headH, headS, 88), headTone = toneOf(headH, headS, 88), none = [0, 0, 0];
                        cols.forEach((col, i) => {
                            const cellY = Math.floor(col.y);
                            col.y += col.v * dt;
                            const next = Math.floor(col.y);
                            if (next !== cellY) {
                                const x = i * size;
                                if (col.prev) {
                                    const py = col.prev.y * size;
                                    quad(clr, x, py, size, size, 0, 0, none);
                                    const th = Math.round(h + glRand(-12, 12)), ts = Math.round(sat);
                                    quad(gly, x - pad, py - pad, cell, cell, col.prev.ch, toneOf(th, ts, 45), K.hslRgb(th, ts, 45));
                                }
                                const ch = Math.random() * GLM_CHARS.length | 0;
                                quad(gly, x - pad, next * size - pad, cell, cell, ch, headTone, headCol);
                                col.prev = { ch, y: next };
                            }
                            if (col.y * size > H && Math.random() < 0.03 * dt) Object.assign(col, { y: glRand(-15, 0), v: glRand(0.35, 1), prev: null });
                        });
                        if (clr.length || gly.length) {
                            gl.useProgram(prGlyph);
                            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                            gl.uniform2f(gRes, W, H);
                            gl.activeTexture(gl.TEXTURE0);
                            gl.bindTexture(gl.TEXTURE_2D, atlas);
                            gl.uniform1i(gTex, 0);
                            if (clr.length) {
                                gl.blendFunc(gl.ZERO, gl.ZERO);
                                drawList(clr);
                            }
                            if (gly.length) {
                                gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                                drawList(gly);
                            }
                            gAt.forEach(loc => gl.disableVertexAttribArray(loc));
                        }
                        gl.disable(gl.BLEND);
                        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                        gl.useProgram(prShow);
                        K.bindFull(gl, prShow);
                        gl.bindTexture(gl.TEXTURE_2D, tex);
                        gl.uniform1i(sTex, 0);
                        gl.uniform2f(sRes, W, H);
                        gl.drawArrays(gl.TRIANGLES, 0, 3);
                        gl.bindTexture(gl.TEXTURE_2D, null);
                    }
                };
            }
        };
