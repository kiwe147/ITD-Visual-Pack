        function glSprites(gl, K, cap) {
            const pr = K.program(gl, `attribute vec2 aPos;
attribute vec2 aL;
attribute vec4 aC;
attribute vec2 aQ;
uniform vec2 uRes;
varying vec2 vL;
varying vec4 vC;
varying vec2 vQ;
void main() {
    gl_Position = vec4(aPos.x / uRes.x * 2.0 - 1.0, 1.0 - aPos.y / uRes.y * 2.0, 0.0, 1.0);
    vL = aL;
    vC = aC;
    vQ = aQ;
}`, `precision highp float;
varying vec2 vL;
varying vec4 vC;
varying vec2 vQ;
void main() {
    float d = length(vL);
    float a;
    if (vQ.y < 0.5) a = d < 0.72 ? mix(0.5, 0.6, d / 0.72) : d < 0.86 ? mix(0.6, 0.3, (d - 0.72) / 0.14) : mix(0.3, 0.0, clamp((d - 0.86) / 0.14, 0.0, 1.0));
    else if (vQ.y < 1.5) a = clamp(vQ.x - 1.0 - d * vQ.x + 0.5, 0.0, 1.0);
    else a = d < 0.35 ? mix(1.0, 0.55, d / 0.35) : mix(0.55, 0.0, clamp((d - 0.35) / 0.65, 0.0, 1.0));
    a *= vC.a;
    gl_FragColor = vec4(vC.rgb * a, a);
}`);
            const uRes = gl.getUniformLocation(pr, 'uRes');
            const locs = ['aPos', 'aL', 'aC', 'aQ'].map(n => gl.getAttribLocation(pr, n));
            const buf = gl.createBuffer();
            const data = new Float32Array(cap * 60);
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
            const CORNERS = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];
            let n = 0;
            return {
                begin() { n = 0; },
                quad(x, y, hs, kind, rgb, a) {
                    if (n >= cap) return;
                    for (let k = 0; k < 6; k++) {
                        const lx = CORNERS[k * 2], ly = CORNERS[k * 2 + 1], o = (n * 6 + k) * 10;
                        data[o] = x + lx * hs; data[o + 1] = y + ly * hs;
                        data[o + 2] = lx; data[o + 3] = ly;
                        data[o + 4] = rgb[0]; data[o + 5] = rgb[1]; data[o + 6] = rgb[2]; data[o + 7] = a;
                        data[o + 8] = hs; data[o + 9] = kind;
                    }
                    n++;
                },
                flush(W, H, additive) {
                    if (!n) return;
                    gl.useProgram(pr);
                    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, n * 60));
                    const sizes = [2, 2, 4, 2], offs = [0, 2, 4, 8];
                    locs.forEach((l, i) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, sizes[i], gl.FLOAT, false, 40, offs[i] * 4); });
                    gl.uniform2f(uRes, W, H);
                    gl.enable(gl.BLEND);
                    gl.blendFunc(gl.ONE, additive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
                    gl.drawArrays(gl.TRIANGLES, 0, n * 6);
                    gl.disable(gl.BLEND);
                    locs.forEach(l => gl.disableVertexAttribArray(l));
                }
            };
        }
        const glHsl = (K, h, s, l) => K.hslRgb(Math.round(h), Math.round(s), Math.round(l));
        const glRand = (a, b) => a + Math.random() * (b - a);
        GL_STYLES.waves = {
            opacity: 0.3,
            create(gl, K) {
                const pr = K.program(gl, K.vs, `precision highp float;
uniform vec2 uRes;
uniform float uT;
uniform float uK;
uniform vec3 uS[4];
uniform vec3 uF[4];
vec4 wave(vec4 dst, float px, float py, float w, float a1, float f1, float s1, float a2, float f2, float s2, float a3, float f3, float s3, float al, float off, vec3 sc, vec3 fc) {
    float mid = uRes.y * 0.5;
    float p1 = px * f1 + uT * s1 + off;
    float p2 = px * f2 + uT * s2 + off * 0.7;
    float p3 = px * f3 + uT * s3 + off * 2.0;
    float y = mid + (sin(p1) * a1 + sin(p2) * a2 + sin(p3) * a3) * uK;
    float dy = (cos(p1) * a1 * f1 + cos(p2) * a2 * f2 + cos(p3) * a3 * f3) * uK;
    float sd = (py - y) * inversesqrt(1.0 + dy * dy);
    float ad = abs(sd);
    float lw = 2.0 + w * 0.5;
    vec4 r = dst;
    float a = al * 0.14 * clamp(0.5 * (lw + 10.0 + w * 3.0) - ad + 0.5, 0.0, 1.0);
    r = vec4(sc * a, a) + r * (1.0 - a);
    a = al * clamp(0.5 * lw - ad + 0.5, 0.0, 1.0);
    r = vec4(sc * a, a) + r * (1.0 - a);
    float y0 = mid - 150.0 * uK;
    a = 0.06 * (1.0 - clamp((py - y0) / (uRes.y - y0), 0.0, 1.0)) * clamp(sd + 0.5, 0.0, 1.0);
    return vec4(fc * a, a) + r * (1.0 - a);
}
void main() {
    float px = gl_FragCoord.x;
    float py = uRes.y - gl_FragCoord.y;
    vec4 r = vec4(0.0);
    r = wave(r, px, py, 0.0, 100.0, 0.008, 0.4, 50.0, 0.018, 0.7, 70.0, 0.004, 0.25, 0.45, 0.0, uS[0], uF[0]);
    r = wave(r, px, py, 1.0, 80.0, 0.009, 0.5, 40.0, 0.020, 0.8, 60.0, 0.005, 0.3, 0.35, 1.5, uS[1], uF[1]);
    r = wave(r, px, py, 2.0, 60.0, 0.010, 0.6, 30.0, 0.022, 0.9, 50.0, 0.006, 0.35, 0.28, 3.0, uS[2], uF[2]);
    r = wave(r, px, py, 3.0, 40.0, 0.011, 0.7, 20.0, 0.025, 1.0, 30.0, 0.007, 0.4, 0.20, 4.5, uS[3], uF[3]);
    gl_FragColor = r;
}`);
                const uRes = gl.getUniformLocation(pr, 'uRes'), uT = gl.getUniformLocation(pr, 'uT'), uK = gl.getUniformLocation(pr, 'uK'), uS = gl.getUniformLocation(pr, 'uS'), uF = gl.getUniformLocation(pr, 'uF');
                const DH = [0, 15, -15, 30], DL = [15, 10, 5, 0];
                let time = 0;
                return {
                    enter() { time = glRand(0, 50); },
                    draw(c) {
                        const gl = c.gl;
                        gl.useProgram(pr);
                        K.bindFull(gl, pr);
                        time += 0.01 * c.dt;
                        const S = Math.min(100, c.th.s * 1.3), sc = [], fc = [];
                        DH.forEach((dh, i) => { sc.push(...glHsl(K, c.th.h + dh, S, 75 + DL[i])); fc.push(...glHsl(K, c.th.h + dh, S, 75)); });
                        gl.uniform2f(uRes, c.W, c.H);
                        gl.uniform1f(uT, time);
                        gl.uniform1f(uK, Math.min(200, Math.max(80, c.H * 0.15)) / 100);
                        gl.uniform3fv(uS, sc);
                        gl.uniform3fv(uF, fc);
                        gl.drawArrays(gl.TRIANGLES, 0, 3);
                    }
                };
            }
        };
        GL_STYLES.grid = {
            opacity: 0.4,
            create(gl, K) {
                const pr = K.program(gl, K.vs, `precision highp float;
uniform vec2 uRes;
uniform vec4 uG;
uniform float uM;
uniform vec2 uHL[18];
uniform vec3 uGl;
uniform vec3 uSn0;
uniform vec3 uSn1;
uniform vec3 uFl0;
uniform vec3 uFl1;
uniform vec3 uLn;
uniform vec3 uHr;
float seg(float v, float lo, float hi) {
    return clamp(min(v + 0.5, hi) - max(v - 0.5, lo), 0.0, 1.0);
}
void main() {
    float px = gl_FragCoord.x;
    float py = uRes.y - gl_FragCoord.y;
    float cx = uG.x, cy = uG.y, R = uG.z, hor = uG.w;
    float hh = uRes.y - hor;
    float dist = length(vec2(px - cx, py - cy));
    float t = dist / (R * 2.4);
    float ga = (t < 0.35 ? mix(1.0, 0.4, t / 0.35) : t < 0.7 ? mix(0.4, 0.08, (t - 0.35) / 0.35) : mix(0.08, 0.0, clamp((t - 0.7) / 0.3, 0.0, 1.0))) * 0.35;
    vec4 r = vec4(uGl * ga, ga);
    float sa = 0.95 * clamp(R - dist + 0.5, 0.0, 1.0);
    r = vec4(mix(uSn0, uSn1, clamp((py - (cy - R)) / (2.0 * R), 0.0, 1.0)) * sa, sa) + r * (1.0 - sa);
    float keep = clamp(hor - py + 0.5, 0.0, 1.0);
    float sx = seg(px, cx - R, cx + R);
    if (sx > 0.0) {
        for (int i = 0; i < 6; i++) {
            float y0 = cy + R * (0.02 + float(i) * 0.105);
            keep *= 1.0 - sx * seg(py, y0, y0 + 1.5 + float(i) * 1.2);
        }
    }
    r *= keep;
    float yy = py - hor;
    float u = clamp(yy / hh, 0.0, 1.0);
    float fa = 0.22 * (1.0 - u) * clamp(py + 0.5 - hor, 0.0, 1.0);
    r = vec4(mix(uFl0, uFl1, u) * fa, fa) + r * (1.0 - fa);
    float kl = 1.0;
    if (yy > 0.0) {
        float s = 6.0 + yy * uM;
        float i0 = floor((px - cx) / s);
        for (int k = -1; k <= 2; k++) {
            float i = i0 + float(k);
            if (abs(i) <= 18.0) {
                float sl = i * uM;
                float dd = abs(px - cx - i * s) * inversesqrt(1.0 + sl * sl);
                kl *= 1.0 - 0.55 * clamp(1.1 - dd, 0.0, 1.0);
            }
        }
    }
    for (int j = 0; j < 18; j++) kl *= 1.0 - uHL[j].y * clamp(1.1 - abs(py - uHL[j].x), 0.0, 1.0);
    float la = 1.0 - kl;
    r = vec4(uLn * la, la) + r * kl;
    float ha = 0.9 * clamp(1.5 - abs(py - hor), 0.0, 1.0);
    r = vec4(uHr * ha, ha) + r * (1.0 - ha);
    float hz = (1.0 - clamp(yy / (0.3 * hh), 0.0, 1.0)) * clamp(py + 0.5 - (hor + 1.0), 0.0, 1.0);
    gl_FragColor = r * (1.0 - hz);
}`);
                const loc = n => gl.getUniformLocation(pr, n);
                const uRes = loc('uRes'), uG = loc('uG'), uM = loc('uM'), uHL = loc('uHL'), uGl = loc('uGl'), uSn0 = loc('uSn0'), uSn1 = loc('uSn1'), uFl0 = loc('uFl0'), uFl1 = loc('uFl1'), uLn = loc('uLn'), uHr = loc('uHr');
                const hl = new Float32Array(36);
                let z = 0;
                return {
                    enter() { z = 0; },
                    draw(c) {
                        const gl = c.gl, W = c.W, H = c.H, h = c.th.h;
                        gl.useProgram(pr);
                        K.bindFull(gl, pr);
                        z = (z + 0.012 * c.dt) % 1;
                        const hor = H * 0.6, S = Math.min(100, Math.max(c.th.s, 25) * 1.1), cx = W / 2;
                        const R = Math.min(W, H) * 0.18, cy = hor - R * 0.6;
                        for (let i = 0; i < 18; i++) {
                            const d = i + 1 - z, y = hor + (H - hor) * 0.9 / d;
                            hl[i * 2] = y;
                            hl[i * 2 + 1] = y > H ? 0 : Math.min(0.8, 1.2 / d);
                        }
                        gl.uniform2f(uRes, W, H);
                        gl.uniform4f(uG, cx, cy, R, hor);
                        gl.uniform1f(uM, ((W / 18) * 1.4 - 6) / (H - hor));
                        gl.uniform2fv(uHL, hl);
                        gl.uniform3fv(uGl, glHsl(K, h + 20, S, 60));
                        gl.uniform3fv(uSn0, glHsl(K, h + 45, S, 72));
                        gl.uniform3fv(uSn1, glHsl(K, h - 25, S, 55));
                        gl.uniform3fv(uFl0, glHsl(K, h, S, 45));
                        gl.uniform3fv(uFl1, glHsl(K, h, S, 30));
                        gl.uniform3fv(uLn, glHsl(K, h, S, 68));
                        gl.uniform3fv(uHr, glHsl(K, h + 20, S, 75));
                        gl.drawArrays(gl.TRIANGLES, 0, 3);
                    }
                };
            }
        };
        GL_STYLES.bokeh = {
            opacity: 0.4,
            create(gl, K) {
                const sp = glSprites(gl, K, 45);
                let W = 0, H = 0, b = [];
                const spawn = y => {
                    const d = Math.random();
                    return { x: glRand(0, W), y, d, r: 12 + d * 80, vy: -(0.12 + d * 0.45), ph: glRand(0, 6.3), dh: glRand(-30, 30), a: 0.5 - d * 0.28 };
                };
                return {
                    enter(w, h) {
                        W = w; H = h;
                        const n = Math.min(45, Math.floor(W * H / 38000));
                        b = Array.from({ length: n }, () => spawn(glRand(0, H)));
                    },
                    draw(c) {
                        const S = Math.min(100, c.th.s * 1.2);
                        sp.begin();
                        b.forEach((p, i) => {
                            p.y += p.vy * c.dt;
                            p.ph += 0.02 * c.dt;
                            p.x += Math.sin(p.ph) * 0.25 * c.dt;
                            if (p.y < -p.r) b[i] = spawn(H + p.r);
                            sp.quad(p.x, p.y, p.r, 0, glHsl(K, c.th.h + p.dh, S, 62), Math.max(0, Math.min(1, p.a * (0.75 + 0.25 * Math.sin(p.ph * 1.7)))));
                        });
                        sp.flush(c.W, c.H, true);
                    }
                };
            }
        };
        GL_STYLES.snow = {
            opacity: 0.6,
            create(gl, K) {
                const sp = glSprites(gl, K, 600);
                const cr = K.program(gl, `attribute vec2 aPos;
attribute vec2 aL;
attribute vec4 aA;
uniform vec2 uRes;
varying vec2 vL;
varying vec4 vA;
void main() {
    gl_Position = vec4(aPos.x / uRes.x * 2.0 - 1.0, 1.0 - aPos.y / uRes.y * 2.0, 0.0, 1.0);
    vL = aL * (aA.x + 2.0);
    vA = aA;
}`, `precision highp float;
uniform vec3 uCol;
varying vec2 vL;
varying vec4 vA;
float seg(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}
void main() {
    float r = vA.x;
    float dm = 1000.0;
    for (int i = 0; i < 6; i++) {
        float an = vA.y + float(i) * 1.0471975512;
        vec2 c = vec2(cos(an), sin(an));
        vec2 b = c * r * 0.55;
        dm = min(dm, seg(vL, vec2(0.0), c * r));
        float b0 = an - 1.05, b1 = an + 1.05;
        dm = min(dm, seg(vL, b, b + vec2(cos(b0), sin(b0)) * r * 0.34));
        dm = min(dm, seg(vL, b, b + vec2(cos(b1), sin(b1)) * r * 0.34));
    }
    float a = clamp(vA.z * 0.5 - dm + 0.5, 0.0, 1.0) * vA.w;
    gl_FragColor = vec4(uCol * a, a);
}`);
                const cRes = gl.getUniformLocation(cr, 'uRes'), cCol = gl.getUniformLocation(cr, 'uCol');
                const cLocs = ['aPos', 'aL', 'aA'].map(n => gl.getAttribLocation(cr, n));
                const cBuf = gl.createBuffer();
                const CCAP = 32, cData = new Float32Array(CCAP * 48);
                gl.bindBuffer(gl.ARRAY_BUFFER, cBuf);
                gl.bufferData(gl.ARRAY_BUFFER, cData.byteLength, gl.DYNAMIC_DRAW);
                const CORNERS = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];
                let W = 0, H = 0, t = 0, far = [], mid = [], near = [], crs = [];
                return {
                    enter(w, h) {
                        W = w; H = h;
                        const k = Math.min(2.2, Math.max(0.5, Math.sqrt(W * H / 196000)));
                        const mk = (n, rmin, rmax, vmin, vmax, amax) => Array.from({ length: Math.round(n * k) }, () => {
                            const g = Math.random() * 4 | 0;
                            return { x: glRand(0, W), y: glRand(0, H), r: glRand(rmin, rmax), v: glRand(vmin, vmax), g, a: amax * (0.6 + g * 0.4 / 3), ph: glRand(0, 6.3) };
                        });
                        far = mk(150, 0.5, 1.1, 0.5, 0.9, 0.5);
                        mid = mk(70, 1.2, 2.1, 1.1, 1.8, 0.7);
                        near = mk(10, 9, 26, 2.2, 3.6, 0.2);
                        crs = Array.from({ length: Math.round(12 * k) }, () => {
                            const r = glRand(5, 14);
                            return { x: glRand(0, W), y: glRand(0, H), r, v: 0.5 + r * 0.07, ph: glRand(0, 6.3), rot: glRand(0, Math.PI * 2), rs: glRand(-0.02, 0.02) };
                        });
                        t = glRand(0, 100);
                    },
                    draw(c) {
                        const gl = c.gl, h = c.th.h;
                        const u = c.dt * 3, S = c.th.s * 0.4;
                        t += 0.016 * u;
                        const gust = Math.max(0, Math.sin(t * 0.7)) ** 3, wind = 1.1 + Math.sin(t * 0.4) * 0.6 + gust * 3.2;
                        const dot = glHsl(K, h, S, 92);
                        sp.begin();
                        for (const [arr, kk] of [[far, 0.5], [mid, 1]]) {
                            const packs = [[], [], [], []];
                            for (const p of arr) {
                                const vx = wind * kk * (0.7 + p.r * 0.2);
                                p.ph += 0.02 * u;
                                p.x += (vx + Math.sin(p.ph) * 0.2) * u; p.y += p.v * u;
                                if (p.y > H + 4) { p.y = -4; p.x = glRand(0, W); }
                                if (p.x > W + 6) p.x = -6;
                                packs[p.g].push(p);
                            }
                            const am = arr === far ? 0.5 : 0.7;
                            packs.forEach((pack, g) => pack.forEach(p => sp.quad(p.x, p.y, p.r * 0.8 + 1, 1, dot, am * (0.6 + g * 0.4 / 3))));
                        }
                        sp.flush(c.W, c.H, false);
                        let n = 0;
                        for (const p of crs) {
                            p.ph += 0.02 * u; p.rot += p.rs * u * (1 + gust * 2);
                            p.x += (wind * 0.9 + Math.sin(p.ph) * 0.3) * u; p.y += p.v * u;
                            if (p.y > H + 20) { p.y = -20; p.x = glRand(-20, W); }
                            if (p.x > W + 20) p.x = -20;
                            if (n >= CCAP) continue;
                            const hs = p.r + 2, al = 0.6 + p.r / 14 * 0.35, lw = p.r > 9 ? 1.3 : 1;
                            for (let q = 0; q < 6; q++) {
                                const lx = CORNERS[q * 2], ly = CORNERS[q * 2 + 1], o = (n * 6 + q) * 8;
                                cData[o] = p.x + lx * hs; cData[o + 1] = p.y + ly * hs;
                                cData[o + 2] = lx; cData[o + 3] = ly;
                                cData[o + 4] = p.r; cData[o + 5] = p.rot; cData[o + 6] = lw; cData[o + 7] = al;
                            }
                            n++;
                        }
                        if (n) {
                            gl.useProgram(cr);
                            gl.bindBuffer(gl.ARRAY_BUFFER, cBuf);
                            gl.bufferSubData(gl.ARRAY_BUFFER, 0, cData.subarray(0, n * 48));
                            const sizes = [2, 2, 4], offs = [0, 2, 4];
                            cLocs.forEach((l, i) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, sizes[i], gl.FLOAT, false, 32, offs[i] * 4); });
                            gl.uniform2f(cRes, c.W, c.H);
                            gl.uniform3fv(cCol, glHsl(K, h, S, 94));
                            gl.enable(gl.BLEND);
                            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                            gl.drawArrays(gl.TRIANGLES, 0, n * 6);
                            gl.disable(gl.BLEND);
                            cLocs.forEach(l => gl.disableVertexAttribArray(l));
                        }
                        const haze = glHsl(K, h, S, 90);
                        sp.begin();
                        for (const p of near) {
                            p.ph += 0.01 * u;
                            p.x += (wind * 1.6 + Math.sin(p.ph) * 0.4) * u; p.y += p.v * u;
                            if (p.y > H + 30) { p.y = -30; p.x = glRand(-20, W); }
                            if (p.x > W + 30) p.x = -30;
                            sp.quad(p.x, p.y, p.r, 2, haze, Math.max(0, Math.min(1, p.a)));
                        }
                        sp.flush(c.W, c.H, false);
                    }
                };
            }
        };
        GL_STYLES.rain = {
            opacity: 0.85,
            create(gl, K) {
                const pr = K.program(gl, `attribute vec2 aC;
attribute vec4 aP;
attribute vec2 aS;
uniform vec2 uRes;
uniform float uT;
varying float vX;
varying float vA;
varying float vW;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
    float len = aP.z;
    float per = uRes.y + len * 2.0 + 40.0;
    float s = aP.y + aP.w * uT;
    float y = mod(s, per) - len;
    float xt = hash(vec2(aP.x, mod(floor(s / per), 997.0))) * (uRes.x + 0.2 * uRes.y + 140.0) - 40.0;
    vec2 head = vec2(xt - 0.2 * (y + len), y);
    vec2 u = normalize(vec2(0.2, -1.0));
    float hw = aS.x * 0.5 + 0.75;
    vec2 p = head + u * len * 1.0198 * aC.y + vec2(u.y, -u.x) * aC.x * hw;
    gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0);
    vX = aC.x * hw;
    vA = aS.y;
    vW = aS.x * 0.5;
}`, `precision highp float;
uniform vec3 uCol;
varying float vX;
varying float vA;
varying float vW;
void main() {
    float a = clamp(vW - abs(vX) + 0.5, 0.0, 1.0) * vA;
    gl_FragColor = vec4(uCol * a, a);
}`);
                const uRes = gl.getUniformLocation(pr, 'uRes'), uT = gl.getUniformLocation(pr, 'uT'), uCol = gl.getUniformLocation(pr, 'uCol');
                const locs = ['aC', 'aP', 'aS'].map(n => gl.getAttribLocation(pr, n));
                const CORNERS = [-1, 0, 1, 0, 1, 1, -1, 0, 1, 1, -1, 1];
                let buf = null, n = 0, t = 0;
                return {
                    enter(W, H) {
                        const spread = (W + 0.2 * H + 140) / W, area = W * H;
                        const spec = [[area / 2600, 8, 16, 620, 820, 0.15, 0.8], [area / 5000, 16, 30, 950, 1200, 0.26, 1.1], [area / 24000, 50, 86, 1500, 1900, 0.2, 1.8]];
                        const counts = spec.map(s => Math.round(s[0] * spread));
                        n = counts[0] + counts[1] + counts[2];
                        const data = new Float32Array(n * 48);
                        let i = 0;
                        spec.forEach((s, li) => {
                            for (let k = 0; k < counts[li]; k++) {
                                const seed = Math.random() * 100, v = glRand(s[3], s[4]), len = glRand(s[1], s[2]), y0 = Math.random() * (H + len * 2 + 40);
                                for (let q = 0; q < 6; q++, i += 8) {
                                    data[i] = CORNERS[q * 2]; data[i + 1] = CORNERS[q * 2 + 1];
                                    data[i + 2] = seed; data[i + 3] = y0; data[i + 4] = len; data[i + 5] = v;
                                    data[i + 6] = s[6]; data[i + 7] = s[5];
                                }
                            }
                        });
                        if (buf) gl.deleteBuffer(buf);
                        buf = gl.createBuffer();
                        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
                        t = Math.random() * 100;
                    },
                    draw(c) {
                        t += c.dt * 0.05;
                        if (t > 900) t -= 900;
                        gl.useProgram(pr);
                        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                        const sizes = [2, 4, 2], offs = [0, 2, 6];
                        locs.forEach((l, i) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, sizes[i], gl.FLOAT, false, 32, offs[i] * 4); });
                        gl.uniform2f(uRes, c.W, c.H);
                        gl.uniform1f(uT, t);
                        gl.uniform3fv(uCol, glHsl(K, c.th.h, c.th.s * 0.3, 88));
                        gl.enable(gl.BLEND);
                        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                        gl.drawArrays(gl.TRIANGLES, 0, n * 6);
                        gl.disable(gl.BLEND);
                        locs.forEach(l => gl.disableVertexAttribArray(l));
                    }
                };
            }
        };
