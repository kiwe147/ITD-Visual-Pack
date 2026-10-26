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
    else if (vQ.y < 1.5) a = d < 0.35 ? mix(1.0, 0.4, d / 0.35) : d < 0.7 ? mix(0.4, 0.08, (d - 0.35) / 0.35) : mix(0.08, 0.0, clamp((d - 0.7) / 0.3, 0.0, 1.0));
    else a = clamp(vQ.x - 1.0 - d * vQ.x + 0.5, 0.0, 1.0);
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
            opacity: 0.5,
            create(gl, K) {
                const sp = glSprites(gl, K, 520);
                let W = 0, H = 0, f = [], windT = 0;
                const spawn = y => {
                    const d = Math.random() ** 1.5;
                    return { x: glRand(0, W), y, d, r: 0.8 + d * 2.6, ph: glRand(0, 6.3) };
                };
                return {
                    enter(w, h) {
                        W = w; H = h;
                        const n = Math.min(260, Math.floor(W * H / 6000));
                        f = Array.from({ length: n }, () => spawn(glRand(0, H)));
                        windT = glRand(0, 100);
                    },
                    draw(c) {
                        windT += 0.004 * c.dt;
                        const wind = Math.sin(windT) * 0.6 + Math.sin(windT * 2.7) * 0.3;
                        const S = c.th.s * 0.4, glow = glHsl(K, c.th.h, S, 85), dot = glHsl(K, c.th.h, S, 90);
                        const packs = [[], [], [], []];
                        sp.begin();
                        f.forEach((p, i) => {
                            p.ph += 0.03 * c.dt;
                            p.y += (0.35 + p.d * 1.4) * c.dt;
                            p.x += (wind * (0.4 + p.d) + Math.sin(p.ph) * 0.3) * c.dt;
                            if (p.y > H + 5) { f[i] = spawn(-5); return; }
                            if (p.x > W + 5) p.x = -5; else if (p.x < -5) p.x = W + 5;
                            if (p.d > 0.6) sp.quad(p.x, p.y, p.r * 3.5, 1, glow, 0.45);
                            packs[Math.min(3, p.d * 4 | 0)].push(p);
                        });
                        packs.forEach((pack, i) => pack.forEach(p => sp.quad(p.x, p.y, p.r + 1, 2, dot, 0.45 + (i + 0.5) / 4 * 0.55)));
                        sp.flush(c.W, c.H, false);
                    }
                };
            }
        };
