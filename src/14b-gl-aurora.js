        GL_STYLES.aurora = {
            opacity: 0.45,
            create(gl, K) {
                const pr = K.program(gl, K.vs, `precision highp float;
uniform vec2 uRes;
uniform float uT;
uniform vec3 uC0[3];
uniform vec3 uC1[3];
vec4 grad(float v, vec3 c0, vec3 c1) {
    if (v <= 0.0 || v >= 1.0) return vec4(0.0);
    if (v < 0.55) return vec4(c0, mix(0.0, 0.3, v / 0.55));
    if (v < 0.9) { float k = (v - 0.55) / 0.35; return vec4(mix(c0, c1, k), mix(0.3, 1.0, k)); }
    float k = (v - 0.9) / 0.1;
    return vec4(mix(c1, c0, k), mix(1.0, 0.0, k));
}
vec4 col(float cc, float py, float base, float amp, float len, float dh, float a, float f, float sp, vec3 c0, vec3 c1) {
    float y = uRes.y * (base + amp * sin(cc * f + uT * sp) + 0.025 * sin(cc * f * 3.1 - uT * 1.7 * sp));
    float L = uRes.y * len * (0.6 + 0.4 * sin(cc * 0.011 + uT * 2.3 * sp));
    float ga = a * (0.5 + 0.5 * sin(cc * 0.004 - uT * 1.3 + dh));
    vec4 g = grad((py - (y - L)) / L, c0, c1);
    return vec4(g.rgb * g.a * ga, g.a * ga);
}
vec4 band(float x, float py, float base, float amp, float len, float dh, float a, float f, float sp, vec3 c0, vec3 c1) {
    float cx = floor(x / 6.0) * 6.0;
    vec4 r = col(cx, py, base, amp, len, dh, a, f, sp, c0, c1);
    if (x - cx < 1.0 && cx >= 6.0) r += col(cx - 6.0, py, base, amp, len, dh, a, f, sp, c0, c1);
    return r;
}
void main() {
    float x = floor(gl_FragCoord.x);
    float py = uRes.y - gl_FragCoord.y;
    vec4 r = band(x, py, 0.64, 0.08, 0.30, 0.0, 0.45, 0.0021, 1.0, uC0[0], uC1[0]);
    r += band(x, py, 0.72, 0.06, 0.24, 45.0, 0.30, 0.0016, -0.7, uC0[1], uC1[1]);
    r += band(x, py, 0.58, 0.05, 0.20, -40.0, 0.28, 0.0027, 0.55, uC0[2], uC1[2]);
    gl_FragColor = min(r, vec4(1.0));
}`);
                const uRes = gl.getUniformLocation(pr, 'uRes'), uT = gl.getUniformLocation(pr, 'uT'), uC0 = gl.getUniformLocation(pr, 'uC0'), uC1 = gl.getUniformLocation(pr, 'uC1');
                const DH = [0, 45, -40];
                let t = 0;
                return {
                    enter() { t = Math.random() * 100; },
                    draw(c) {
                        const gl = c.gl;
                        gl.useProgram(pr);
                        K.bindFull(gl, pr);
                        t += 0.012 * c.dt;
                        const S = Math.min(100, c.th.s * 1.15), c0 = [], c1 = [];
                        for (const dh of DH) { c0.push(...K.hslRgb(c.th.h + dh, S, 60)); c1.push(...K.hslRgb(c.th.h + dh, S, 70)); }
                        gl.uniform2f(uRes, c.W, c.H);
                        gl.uniform1f(uT, t);
                        gl.uniform3fv(uC0, c0);
                        gl.uniform3fv(uC1, c1);
                        gl.drawArrays(gl.TRIANGLES, 0, 3);
                    }
                };
            }
        };
