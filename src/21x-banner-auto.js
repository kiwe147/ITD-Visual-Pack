"use strict";
var __vpBannerAuto = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  var banner_api_exports = {};
  __export(banner_api_exports, {
    autoBanner: () => autoBanner,
    benchBanner: () => benchBanner
  });

  var LIN = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const v = i / 255;
    LIN[i] = v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }
  function oklabLin(lr, lg, lb) {
    const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
    const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
    const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    ];
  }
  var oklab = (r, g, b) => oklabLin(LIN[r], LIN[g], LIN[b]);
  function oklabF(r, g, b) {
    const f = (v) => {
      v = Math.min(255, Math.max(0, v)) / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return oklabLin(f(r), f(g), f(b));
  }
  function labOf(data, n) {
    const out = new Float32Array(n * 3);
    const cache =   new Map();
    for (let i = 0; i < n; i++) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], k = r << 16 | g << 8 | b;
      let p = cache.get(k);
      if (!p) {
        p = oklab(r, g, b);
        if (cache.size < 1 << 18) cache.set(k, p);
      }
      out[i * 3] = p[0];
      out[i * 3 + 1] = p[1];
      out[i * 3 + 2] = p[2];
    }
    return out;
  }
  function labToRgb(L, a, b) {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const enc = (v) => 255 * (v <= 31308e-7 ? 12.92 * v : 1.055 * Math.max(0, v) ** (1 / 2.4) - 0.055);
    return [enc(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), enc(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), enc(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)];
  }
  function fromOklab(L, a, b) {
    const ok = (c) => c[0] >= -0.5 && c[0] <= 255.5 && c[1] >= -0.5 && c[1] <= 255.5 && c[2] >= -0.5 && c[2] <= 255.5;
    let rgb = labToRgb(L, a, b);
    if (!ok(rgb)) {
      let lo = 0, hi = 1;
      for (let i = 0; i < 16; i++) {
        const k = (lo + hi) / 2;
        if (ok(labToRgb(L, a * k, b * k))) lo = k;
        else hi = k;
      }
      rgb = labToRgb(L, a * lo, b * lo);
    }
    return rgb.map((v) => Math.min(255, Math.max(0, v)));
  }
  var hex2 = (n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
  var toHex = (r, g, b) => "#" + hex2(r) + hex2(g) + hex2(b);
  function fromHex(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }

  function adjust(src, a) {
    const { width, height } = src, n = width * height;
    if (!a.brightness && !a.contrast && !a.saturation && !a.denoise) return src;
    let data = new Uint8ClampedArray(src.data);
    if (a.brightness || a.contrast || a.saturation) {
      const c = a.contrast >= 0 ? 1 + a.contrast * 2 : 1 + a.contrast, b = a.brightness * 128, s = 1 + a.saturation;
      for (let i = 0; i < n; i++) {
        const j = i * 4;
        let r = data[j], g = data[j + 1], bl = data[j + 2];
        const y = 0.299 * r + 0.587 * g + 0.114 * bl;
        r = y + (r - y) * s;
        g = y + (g - y) * s;
        bl = y + (bl - y) * s;
        data[j] = (r - 128) * c + 128 + b;
        data[j + 1] = (g - 128) * c + 128 + b;
        data[j + 2] = (bl - 128) * c + 128 + b;
      }
    }
    if (a.denoise > 0) data = denoise(data, width, height, a.denoise);
    return { width, height, data };
  }
  function denoise(data, w, h, d) {
    const R = Math.round(d * 2 * 1e3) / 1e3, r0 = Math.floor(R), f = R - r0, eps = 4e-4 * d * d * 65025;
    const lo = r0 > 0 ? guided(data, w, h, r0, eps) : data;
    return f === 0 ? lo : mix(lo, guided(data, w, h, r0 + 1, eps), f);
  }
  function mix(a, b, f) {
    const out = new Uint8ClampedArray(a.length);
    for (let i = 0; i < out.length; i++) out[i] = a[i] + (b[i] - a[i]) * f;
    return out;
  }
  function boxMean(src, w, h, r) {
    const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      let s = 0;
      const o = y * w;
      for (let x = -r; x <= r; x++) s += src[o + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        tmp[o + x] = s / (2 * r + 1);
        s += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        out[y * w + x] = s / (2 * r + 1);
        s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
      }
    }
    return out;
  }
  function guided(data, w, h, r, eps) {
    const n = w * h, out = new Uint8ClampedArray(data);
    const I = new Float32Array(n), I2 = new Float32Array(n);
    for (let ch = 0; ch < 3; ch++) {
      for (let i = 0; i < n; i++) {
        const v = data[i * 4 + ch];
        I[i] = v;
        I2[i] = v * v;
      }
      const m = boxMean(I, w, h, r), m2 = boxMean(I2, w, h, r);
      const A = new Float32Array(n), B = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const v = m2[i] - m[i] * m[i], a = v / (v + eps);
        A[i] = a;
        B[i] = m[i] - a * m[i];
      }
      const mA = boxMean(A, w, h, r), mB = boxMean(B, w, h, r);
      for (let i = 0; i < n; i++) out[i * 4 + ch] = mA[i] * I[i] + mB[i];
    }
    return out;
  }
  function downsample(src, cell) {
    if (cell === 1) return src;
    const { width: w, height: h, data } = src;
    const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell), out = new Uint8ClampedArray(cols * rows * 4);
    for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < cols; gx++) {
      let r = 0, g = 0, b = 0, c = 0;
      for (let y = gy * cell; y < Math.min(h, gy * cell + cell); y++) for (let x = gx * cell; x < Math.min(w, gx * cell + cell); x++) {
        const j = (y * w + x) * 4;
        r += data[j];
        g += data[j + 1];
        b += data[j + 2];
        c++;
      }
      const k = (gy * cols + gx) * 4;
      out[k] = r / c;
      out[k + 1] = g / c;
      out[k + 2] = b / c;
      out[k + 3] = 255;
    }
    return { width: cols, height: rows, data: out };
  }

  var W = 1100;
  var H = 380;
  var LIMITS = {
    ops: 2e3,
    points: 6e4,
    pointsPerOp: 4096,
    maxWidth: 100,
    bodyBytes: 2 << 20
  };
  function drawing(ops) {
    return { version: 1, width: W, height: H, ops };
  }
  function stats(ops) {
    let points = 0, maxPointsPerOp = 0;
    for (const o of ops) {
      points += o.points.length;
      maxPointsPerOp = Math.max(maxPointsPerOp, o.points.length);
    }
    return { ops: ops.length, points, bytes: JSON.stringify(drawing(ops)).length, maxPointsPerOp };
  }
  function splitLong(ops) {
    const out = [], n = LIMITS.pointsPerOp;
    for (const o of ops) {
      if (o.points.length <= n || o.tool !== "brush") {
        out.push(o);
        continue;
      }
      for (let i = 0; i < o.points.length - 1; i += n - 1) out.push({ ...o, points: o.points.slice(i, i + n) });
    }
    return out;
  }

  function compare(rgb, target, n) {
    const map = new Uint8Array(n), cache =   new Map();
    let sum = 0, bad = 0;
    for (let i = 0; i < n; i++) {
      const r = Math.round(rgb[i * 3]), g = Math.round(rgb[i * 3 + 1]), b = Math.round(rgb[i * 3 + 2]), k = r << 16 | g << 8 | b;
      let p = cache.get(k);
      if (!p) {
        p = oklab(r, g, b);
        cache.set(k, p);
      }
      const d = Math.hypot(p[0] - target[i * 3], p[1] - target[i * 3 + 1], p[2] - target[i * 3 + 2]) * 100;
      sum += d;
      if (d > 5) bad++;
      map[i] = d > 255 ? 255 : d;
    }
    return { dE: sum / n, bad: bad / n, map };
  }

  var N8X = [-1, 0, 1, -1, 1, -1, 0, 1];
  var N8Y = [-1, -1, -1, 0, 0, 1, 1, 1];
  function despeckle(cols, rows, label, K) {
    const out = label.slice(), cnt = new Int32Array(K);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = y * cols + x, own = label[i];
      const y0 = Math.max(0, y - 1), y1 = Math.min(rows - 1, y + 1), x0 = Math.max(0, x - 1), x1 = Math.min(cols - 1, x + 1);
      let best = own, bestN = 0;
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
        const l = label[yy * cols + xx], c = ++cnt[l];
        if (l !== own && c > bestN) {
          bestN = c;
          best = l;
        }
      }
      if (cnt[own] <= 2 && bestN >= 5) out[i] = best;
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) cnt[label[yy * cols + xx]] = 0;
    }
    return out;
  }
  function smoothLabels(cols, rows, label, K, minVotes = 0) {
    const out = label.slice(), cnt = new Int32Array(K);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const y0 = Math.max(0, y - 1), y1 = Math.min(rows - 1, y + 1), x0 = Math.max(0, x - 1), x1 = Math.min(cols - 1, x + 1);
      let best = label[i];
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
        const l = label[yy * cols + xx];
        if (++cnt[l] > cnt[best]) best = l;
      }
      if (cnt[best] >= minVotes) out[i] = best;
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) cnt[label[yy * cols + xx]] = 0;
    }
    return out;
  }
  var PX = [-1, 1, 0, 0, -1, 1, -1, 1];
  var PY = [0, 0, -1, 1, -1, -1, 1, 1];
  var PW = [1, 1, 1, 1, Math.SQRT1_2, Math.SQRT1_2, Math.SQRT1_2, Math.SQRT1_2];
  function potts(cols, rows, label, lab, pal, lambda, iters = 6) {
    if (lambda <= 0) return;
    const cand = new Int32Array(5);
    for (let it = 0; it < iters; it++) {
      let changed = 0;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const i = y * cols + x, own = label[i];
        let nc = 1;
        cand[0] = own;
        for (let k = 0; k < 4; k++) {
          const nx = x + PX[k], ny = y + PY[k];
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const l = label[ny * cols + nx];
          let j = 0;
          while (j < nc && cand[j] !== l) j++;
          if (j === nc) cand[nc++] = l;
        }
        if (nc === 1) continue;
        const L = lab[i * 3], A = lab[i * 3 + 1], B = lab[i * 3 + 2];
        let best = own, bc = Infinity;
        for (let j = 0; j < nc; j++) {
          const c = cand[j];
          let cost = (L - pal[c * 3]) ** 2 + (A - pal[c * 3 + 1]) ** 2 + (B - pal[c * 3 + 2]) ** 2;
          for (let k = 0; k < 8; k++) {
            const nx = x + PX[k], ny = y + PY[k];
            if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && label[ny * cols + nx] !== c) cost += lambda * PW[k];
          }
          if (cost < bc) {
            bc = cost;
            best = c;
          }
        }
        if (best !== own) {
          label[i] = best;
          changed++;
        }
      }
      if (!changed) break;
    }
  }
  function eachPart(cols, rows, label, cb) {
    const total = cols * rows, seen = new Uint8Array(total), queue = new Int32Array(total);
    for (let s = 0; s < total; s++) {
      if (seen[s]) continue;
      const L = label[s];
      let qh = 0, qt = 0;
      seen[s] = 1;
      queue[qt++] = s;
      while (qh < qt) {
        const c = queue[qh++], x = c % cols, y = (c - x) / cols;
        for (let k = 0; k < 8; k++) {
          const nx = x + N8X[k], ny = y + N8Y[k];
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const n = ny * cols + nx;
          if (!seen[n] && label[n] === L) {
            seen[n] = 1;
            queue[qt++] = n;
          }
        }
      }
      cb(queue, qt, L);
    }
  }
  function mergeSmall(cols, rows, label, K, minArea) {
    if (minArea <= 1) return;
    const total = cols * rows, nb = new Int32Array(K);
    for (let pass = 0; pass < 2; pass++) {
      let changed = false;
      eachPart(cols, rows, label, (queue, qt, L) => {
        if (qt >= minArea) return;
        const touchedL = [];
        for (let q = 0; q < qt; q++) {
          const c = queue[q], x = c % cols;
          for (const n of [x > 0 ? c - 1 : -1, x < cols - 1 ? c + 1 : -1, c - cols, c + cols]) {
            if (n < 0 || n >= total || label[n] === L) continue;
            if (!nb[label[n]]++) touchedL.push(label[n]);
          }
        }
        let best = -1;
        for (const l of touchedL) if (best < 0 || nb[l] > nb[best]) best = l;
        for (const l of touchedL) nb[l] = 0;
        if (best < 0) return;
        for (let q = 0; q < qt; q++) label[queue[q]] = best;
        changed = true;
      });
      if (!changed) break;
    }
  }
  function countParts(cols, rows, label, K) {
    const parts = new Array(K).fill(0);
    eachPart(cols, rows, label, (_q, _n, L) => {
      parts[L]++;
    });
    return parts;
  }

  var VIVID_HUE = 1.4;
  var VIVID_SAT = 3;
  function vividColor(L, A, B, C, n) {
    const a = A / n, b = B / n, c = Math.hypot(a, b), k = c > 1e-6 ? C / n / c : 1;
    const [r, g, bl] = fromOklab(L / n, a * k, b * k);
    return toHex(r, g, bl);
  }
  function vividLabels(keys, cnt, lab, colors) {
    const n = keys.length, X = new Float64Array(n * 3), wt = new Float64Array(n), dist = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const k = keys[i], c = cnt[k], a = lab[1][k] / c, b = lab[2][k] / c;
      X[i * 3] = lab[0][k] / c;
      X[i * 3 + 1] = a * VIVID_HUE;
      X[i * 3 + 2] = b * VIVID_HUE;
      wt[i] = c * (1 + VIVID_SAT * Math.hypot(a, b));
    }
    const d2 = (i, C2, j) => (X[i * 3] - C2[j * 3]) ** 2 + (X[i * 3 + 1] - C2[j * 3 + 1]) ** 2 + (X[i * 3 + 2] - C2[j * 3 + 2]) ** 2;
    const C = new Float64Array(colors * 3);
    let K = 0, pick = 0;
    for (let i = 1; i < n; i++) if (wt[i] > wt[pick]) pick = i;
    dist.fill(Infinity);
    while (K < colors) {
      C.set(X.subarray(pick * 3, pick * 3 + 3), K * 3);
      K++;
      let bv = 0;
      for (let i = 0; i < n; i++) {
        const d = d2(i, C, K - 1);
        if (d < dist[i]) dist[i] = d;
        if (dist[i] * wt[i] > bv) {
          bv = dist[i] * wt[i];
          pick = i;
        }
      }
      if (bv <= 0) break;
    }
    const group = new Int32Array(n), acc = new Float64Array(K * 4);
    for (let it = 0; it < 10; it++) {
      acc.fill(0);
      let moved = 0;
      for (let i = 0; i < n; i++) {
        let best = 0, bd = Infinity;
        for (let j = 0; j < K; j++) {
          const d = d2(i, C, j);
          if (d < bd) {
            bd = d;
            best = j;
          }
        }
        if (group[i] !== best) {
          group[i] = best;
          moved++;
        }
        const w = wt[i];
        acc[best * 4] += X[i * 3] * w;
        acc[best * 4 + 1] += X[i * 3 + 1] * w;
        acc[best * 4 + 2] += X[i * 3 + 2] * w;
        acc[best * 4 + 3] += w;
      }
      for (let j = 0; j < K; j++) if (acc[j * 4 + 3]) for (let a = 0; a < 3; a++) C[j * 3 + a] = acc[j * 4 + a] / acc[j * 4 + 3];
      if (it && !moved) break;
    }
    return { group, K };
  }
  function medianCut(keys, cnt, S, n) {
    const analyse = (list) => {
      let c = 0;
      const s = [0, 0, 0], q = [0, 0, 0];
      for (const k of list) {
        c += cnt[k];
        for (let a = 0; a < 3; a++) {
          s[a] += S[a][k];
          q[a] += S[a][k] * S[a][k] / cnt[k];
        }
      }
      const sse = [0, 1, 2].map((a) => q[a] - s[a] * s[a] / c);
      const axis = sse.indexOf(Math.max(...sse));
      return { list, axis, score: list.length > 1 ? sse[axis] : -1 };
    };
    const buckets = [analyse(keys)];
    while (buckets.length < n) {
      let bi = 0;
      for (let i = 1; i < buckets.length; i++) if (buckets[i].score > buckets[bi].score) bi = i;
      const b = buckets[bi];
      if (b.score <= 0) break;
      const A = S[b.axis];
      const sorted = b.list.slice().sort((x, y) => A[x] / cnt[x] - A[y] / cnt[y]);
      let total = 0;
      for (const k of sorted) total += cnt[k];
      let acc = 0, cut = 1;
      for (let i = 0; i < sorted.length - 1; i++) {
        acc += cnt[sorted[i]];
        cut = i + 1;
        if (acc >= total / 2) break;
      }
      buckets.splice(bi, 1, analyse(sorted.slice(0, cut)), analyse(sorted.slice(cut)));
    }
    return buckets.map((b) => {
      let c = 0, x = 0, y = 0, z = 0;
      for (const k of b.list) {
        c += cnt[k];
        x += S[0][k];
        y += S[1][k];
        z += S[2][k];
      }
      return [x / c, y / c, z / c];
    });
  }
  function quantize(img, colors, whiteMin = 245, mode = "classic") {
    const { data } = img, total = img.width * img.height;
    const cnt = new Float64Array(32768), sr = new Float64Array(32768), sg = new Float64Array(32768), sb = new Float64Array(32768);
    const bin = new Int32Array(total), keys = [];
    let whites = 0;
    for (let i = 0; i < total; i++) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
      if (r > whiteMin && g > whiteMin && b > whiteMin) {
        bin[i] = -1;
        whites++;
        continue;
      }
      const k = r >> 3 << 10 | g >> 3 << 5 | b >> 3;
      bin[i] = k;
      if (!cnt[k]) keys.push(k);
      cnt[k]++;
      sr[k] += r;
      sg[k] += g;
      sb[k] += b;
    }
    const lab = [new Float64Array(32768), new Float64Array(32768), new Float64Array(32768)];
    for (const k of keys) {
      const c = cnt[k], p = oklabF(sr[k] / c, sg[k] / c, sb[k] / c);
      lab[0][k] = p[0] * c;
      lab[1][k] = p[1] * c;
      lab[2][k] = p[2] * c;
    }
    const palette = [], label = new Int32Array(total), binLabel = new Int32Array(32768).fill(-1);
    if (keys.length && mode === "vivid") {
      const { group, K } = vividLabels(keys, cnt, lab, colors);
      const acc = new Float64Array(K * 5);
      keys.forEach((k, i) => {
        const c = cnt[k], g = group[i] * 5;
        acc[g] += lab[0][k];
        acc[g + 1] += lab[1][k];
        acc[g + 2] += lab[2][k];
        acc[g + 3] += Math.hypot(lab[1][k], lab[2][k]);
        acc[g + 4] += c;
      });
      const remap = Array.from({ length: K }, (_, j) => acc[j * 5 + 4] ? palette.push(vividColor(acc[j * 5], acc[j * 5 + 1], acc[j * 5 + 2], acc[j * 5 + 3], acc[j * 5 + 4])) - 1 : -1);
      keys.forEach((k, i) => {
        binLabel[k] = remap[group[i]];
      });
    } else if (keys.length) {
      let pal = medianCut(keys, cnt, lab, colors);
      for (let it = 0; it < 6; it++) {
        const acc = pal.map(() => [0, 0, 0, 0]);
        for (const k of keys) {
          const c = cnt[k], L = lab[0][k] / c, A = lab[1][k] / c, B = lab[2][k] / c;
          let best = 0, bd = Infinity;
          for (let p = 0; p < pal.length; p++) {
            const d = (L - pal[p][0]) ** 2 + (A - pal[p][1]) ** 2 + (B - pal[p][2]) ** 2;
            if (d < bd) {
              bd = d;
              best = p;
            }
          }
          binLabel[k] = best;
          const a = acc[best];
          a[0] += lab[0][k];
          a[1] += lab[1][k];
          a[2] += lab[2][k];
          a[3] += c;
        }
        pal = pal.map((p, i) => acc[i][3] ? [acc[i][0] / acc[i][3], acc[i][1] / acc[i][3], acc[i][2] / acc[i][3]] : p);
      }
      const rgb = pal.map(() => [0, 0, 0, 0]);
      for (const k of keys) {
        const a = rgb[binLabel[k]];
        a[0] += sr[k];
        a[1] += sg[k];
        a[2] += sb[k];
        a[3] += cnt[k];
      }
      const remap = rgb.map((a) => a[3] ? palette.push(toHex(a[0] / a[3], a[1] / a[3], a[2] / a[3])) - 1 : -1);
      for (const k of keys) binLabel[k] = remap[binLabel[k]];
    }
    const white = whites ? palette.push("#ffffff") - 1 : -1;
    for (let i = 0; i < total; i++) label[i] = bin[i] < 0 ? white : binLabel[bin[i]];
    return { label, palette, white };
  }
  function cohere(img, q, lambda, mode = "classic", rounds = 3) {
    const n = img.width * img.height, K = q.palette.length, { data } = img;
    const lab = labOf(data, n), label = q.label.slice(), pal = new Float32Array(K * 3);
    let palette = q.palette;
    const setPal = () => palette.forEach((h, i) => {
      const [r, g, b] = fromHex(h);
      pal.set(oklabF(r, g, b), i * 3);
    });
    setPal();
    for (let round = 0; round < rounds; round++) {
      potts(img.width, img.height, label, lab, pal, lambda);
      if (mode === "vivid") {
        const acc2 = new Float64Array(K * 5);
        for (let i = 0; i < n; i++) {
          const a = label[i] * 5, A = lab[i * 3 + 1], B = lab[i * 3 + 2];
          acc2[a] += lab[i * 3];
          acc2[a + 1] += A;
          acc2[a + 2] += B;
          acc2[a + 3] += Math.hypot(A, B);
          acc2[a + 4]++;
        }
        palette = palette.map((h, l) => l === q.white || !acc2[l * 5 + 4] ? h : vividColor(acc2[l * 5], acc2[l * 5 + 1], acc2[l * 5 + 2], acc2[l * 5 + 3], acc2[l * 5 + 4]));
        setPal();
        continue;
      }
      const acc = new Float64Array(K * 4);
      for (let i = 0; i < n; i++) {
        const a = label[i] * 4;
        acc[a] += data[i * 4];
        acc[a + 1] += data[i * 4 + 1];
        acc[a + 2] += data[i * 4 + 2];
        acc[a + 3]++;
      }
      palette = palette.map((h, l) => l === q.white || !acc[l * 4 + 3] ? h : toHex(acc[l * 4] / acc[l * 4 + 3], acc[l * 4 + 1] / acc[l * 4 + 3], acc[l * 4 + 2] / acc[l * 4 + 3]));
      setPal();
    }
    return { label, palette, white: q.white };
  }

  var Coverage = class {
    constructor(w, h) {
      __publicField(this, "w");
      __publicField(this, "h");
      __publicField(this, "cov");
      __publicField(this, "touched");
      __publicField(this, "n", 0);
      this.w = w;
      this.h = h;
      this.cov = new Float32Array(w * h);
      this.touched = new Int32Array(w * h);
    }
    clear() {
      for (let k = 0; k < this.n; k++) this.cov[this.touched[k]] = 0;
      this.n = 0;
    }
    put(i, c) {
      if (c <= this.cov[i]) return;
      if (this.cov[i] === 0) this.touched[this.n++] = i;
      this.cov[i] = c;
    }
     
    capsule(ax, ay, bx, by, r) {
      const { w, h } = this, e = r + 1;
      const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - e)), x1 = Math.min(w - 1, Math.ceil(Math.max(ax, bx) + e));
      const y0 = Math.max(0, Math.floor(Math.min(ay, by) - e)), y1 = Math.min(h - 1, Math.ceil(Math.max(ay, by) + e));
      if (x0 > x1 || y0 > y1) return;
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, inv = l2 ? 1 / l2 : 0;
      const lim = (r + 0.5) * (r + 0.5), core = r > 0.5 ? (r - 0.5) * (r - 0.5) : -1;
      for (let y = y0; y <= y1; y++) {
        const py = y + 0.5;
        for (let x = x0; x <= x1; x++) {
          const px = x + 0.5;
          let t = ((px - ax) * dx + (py - ay) * dy) * inv;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const ex = ax + t * dx - px, ey = ay + t * dy - py, d2 = ex * ex + ey * ey;
          if (d2 >= lim) continue;
          this.put(y * w + x, d2 <= core ? 1 : Math.min(1, r + 0.5 - Math.sqrt(d2)));
        }
      }
    }
     
    ring(cx, cy, R, r) {
      const { w, h } = this, e = R + r + 1;
      const x0 = Math.max(0, Math.floor(cx - e)), x1 = Math.min(w - 1, Math.ceil(cx + e));
      const y0 = Math.max(0, Math.floor(cy - e)), y1 = Math.min(h - 1, Math.ceil(cy + e));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const d = Math.abs(Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - R);
        if (d < r + 0.5) this.put(y * w + x, Math.min(1, r + 0.5 - d));
      }
    }
    op(o) {
      const r = o.width / 2, p = o.points;
      if (o.tool === "circle") {
        const a = p[0], b = p[p.length - 1];
        this.ring(a[0], a[1], Math.hypot(b[0] - a[0], b[1] - a[1]), r);
      } else if (o.tool === "rectangle") {
        const [x0, y0] = p[0], [x1, y1] = p[p.length - 1];
        this.capsule(x0, y0, x1, y0, r);
        this.capsule(x1, y0, x1, y1, r);
        this.capsule(x1, y1, x0, y1, r);
        this.capsule(x0, y1, x0, y0, r);
      } else if (p.length === 1) {
        this.capsule(p[0][0], p[0][1], p[0][0], p[0][1], r);
      } else {
        for (let i = 1; i < p.length; i++) this.capsule(p[i - 1][0], p[i - 1][1], p[i][0], p[i][1], r);
      }
    }
  };
  var opRgb = (o) => o.tool === "eraser" ? [255, 255, 255] : fromHex(o.color);
  function composite(rgb, cv, c) {
    for (let k = 0; k < cv.n; k++) {
      const i = cv.touched[k], a = cv.cov[i], j = i * 3;
      rgb[j] += (c[0] - rgb[j]) * a;
      rgb[j + 1] += (c[1] - rgb[j + 1]) * a;
      rgb[j + 2] += (c[2] - rgb[j + 2]) * a;
    }
  }
  async function renderOpsAsync(ops, w, h) {
    const rgb = new Float32Array(w * h * 3).fill(255);
    const cv = new Coverage(w, h);
    let last = Date.now();
    for (const o of ops) {
      cv.op(o);
      composite(rgb, cv, opRgb(o));
      cv.clear();
      if (Date.now() - last > 40) {
        last = Date.now();
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    return rgb;
  }

  var Aborted = class extends Error {
    constructor(ops = null) {
      super("aborted");
       
      __publicField(this, "ops");
      this.ops = ops;
    }
  };
  var INF = 1e20;
  var LEVEL_STEP = 0.35;
  var WIDE_MIN_GAIN = 3;
  var ROUTE_VISIT_PER_POINT = 4e3;
  function distanceField(ctx, forb) {
    const { cols, gy, gr, env, v, z, D, site, wx0, wx1, wy0, wy1 } = ctx;
    for (let x = wx0; x <= wx1; x++) {
      let last = -1;
      for (let y = wy0; y <= wy1; y++) {
        const i = y * cols + x;
        if (forb[i]) last = y;
        gy[i] = last < 0 ? INF : y - last;
        gr[i] = last;
      }
      last = -1;
      for (let y = wy1; y >= wy0; y--) {
        const i = y * cols + x;
        if (forb[i]) last = y;
        if (last >= 0 && last - y < gy[i]) {
          gy[i] = last - y;
          gr[i] = last;
        }
      }
    }
    let maxD = 0;
    for (let y = wy0; y <= wy1; y++) {
      const o = y * cols;
      let k = -1;
      for (let q = wx0; q <= wx1; q++) {
        const g = gy[o + q];
        if (g >= INF) continue;
        const fq = g * g + q * q;
        let s = 0;
        while (k >= 0) {
          s = (fq - env[k]) / (2 * (q - v[k]));
          if (s <= z[k]) k--;
          else break;
        }
        k++;
        v[k] = q;
        env[k] = fq;
        z[k] = k ? s : -Infinity;
      }
      if (k < 0) {
        for (let x = wx0; x <= wx1; x++) {
          D[o + x] = Infinity;
          site[o + x] = -1;
        }
        maxD = Infinity;
        continue;
      }
      let j = 0;
      for (let x = wx0; x <= wx1; x++) {
        while (j < k && z[j + 1] < x) j++;
        const p = v[j], g = gy[o + p], d = Math.sqrt((x - p) * (x - p) + g * g);
        D[o + x] = d;
        site[o + x] = gr[o + p] * cols + p;
        if (d > maxD && x >= ctx.bx0 - ctx.reach && x <= ctx.bx1 + ctx.reach && y >= ctx.by0 - ctx.reach && y <= ctx.by1 + ctx.reach) maxD = d;
      }
    }
    return maxD;
  }
  var NX = [0, 1, -1, 0, 0];
  var NY = [0, 0, 0, 1, -1];
  function forb2(ctx, px, py) {
    const { cols, rows, site } = ctx;
    const cx = Math.round(px), cy = Math.round(py);
    let best = Infinity;
    for (let k = 0; k < 5; k++) {
      const nx = cx + NX[k], ny = cy + NY[k];
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const s = site[ny * cols + nx];
      if (s < 0) continue;
      const sx = s % cols, dx = px - sx, dy = py - (s - sx) / cols;
      best = Math.min(best, dx * dx + dy * dy);
    }
    return best;
  }
  function safeSeg(ctx, ax, ay, bx, by, rr) {
    if (rr <= 0) return true;
    const { cols, D } = ctx, len = Math.hypot(bx - ax, by - ay);
    if ((D[ay * cols + ax] + D[by * cols + bx] - len) / 2 >= rr) return true;
    const n = Math.ceil(len * 2), rr2 = rr * rr - 1e-6;
    for (let i = 0; i <= n; i++) {
      const t = n ? i / n : 0;
      if (forb2(ctx, ax + (bx - ax) * t, ay + (by - ay) * t) < rr2) return false;
    }
    return true;
  }
  function segDist2(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const ex = ax + t * dx - px, ey = ay + t * dy - py;
    return ex * ex + ey * ey;
  }
  function coverSeg(ctx, ax, ay, bx, by, cov, apply, touch) {
    const { cols, rows, T, touched } = ctx;
    const c2 = cov * cov + 1e-6, t2 = touch * touch, e = Math.ceil(Math.max(cov, touch));
    const x0 = Math.max(0, Math.min(ax, bx) - e), x1 = Math.min(cols - 1, Math.max(ax, bx) + e);
    const y0 = Math.max(0, Math.min(ay, by) - e), y1 = Math.min(rows - 1, Math.max(ay, by) + e);
    let n = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * cols + x;
      if (!T[i] && !touch) continue;
      const d = segDist2(x, y, ax, ay, bx, by);
      if (T[i] && d <= c2) {
        n++;
        if (apply) {
          T[i] = 0;
          ctx.left--;
        }
      }
      if (d < t2) touched[i] = 1;
    }
    return n;
  }
  function heapPush(h, c) {
    h.push(c);
    let i = h.length - 1;
    while (i) {
      const p = i - 1 >> 1;
      if (h[p].g >= h[i].g) break;
      [h[p], h[i]] = [h[i], h[p]];
      i = p;
    }
  }
  function heapPop(h) {
    const top = h[0], last = h.pop();
    if (h.length) {
      h[0] = last;
      for (let i = 0; ; ) {
        const l = 2 * i + 1, r = l + 1;
        let b = i;
        if (l < h.length && h[l].g > h[b].g) b = l;
        if (r < h.length && h[r].g > h[b].g) b = r;
        if (b === i) break;
        [h[b], h[i]] = [h[i], h[b]];
        i = b;
      }
    }
    return top;
  }
  function levelSegments(ctx, m) {
    const { cols, rows, D, T, P, Q } = ctx;
    const B = 2 * m + 1, thr = m + 1 - ctx.tolSafe, st = Math.max(1, B >> 2), minGain = m ? WIDE_MIN_GAIN * B : 1;
    const x0 = Math.max(0, ctx.bx0 - m), x1 = Math.min(cols - 1, ctx.bx1 + m);
    const y0 = Math.max(0, ctx.by0 - m), y1 = Math.min(rows - 1, ctx.by1 + m);
    for (let x = x0; x <= x1; x++) P[x * (rows + 1) + y0] = 0;
    for (let y = y0; y <= y1; y++) Q[y * (cols + 1) + x0] = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const t = T[y * cols + x];
      P[x * (rows + 1) + y + 1] = P[x * (rows + 1) + y] + t;
      Q[y * (cols + 1) + x + 1] = Q[y * (cols + 1) + x] + t;
    }
    const heap = [];
    for (let o = 0; o < 2; o++) {
      const lines = o ? cols : rows, lineStep = o ? 1 : cols, stride = o ? cols : 1, pre = o ? Q : P;
      const l0 = o ? x0 : y0, l1 = o ? x1 : y1, a0w = o ? y0 : x0, a1w = o ? y1 : x1;
      const list = [];
      for (let l = l0; l <= l1; l += st) list.push(l);
      if (list[list.length - 1] !== l1) list.push(l1);
      for (const l of list) {
        const lo = Math.max(l0, l - m), hi = Math.min(l1 + 1, l + m + 1);
        for (let a = a0w; a <= a1w; ) {
          if (D[l * lineStep + a * stride] < thr) {
            a++;
            continue;
          }
          const a0 = a;
          let g = 0;
          while (a <= a1w && D[l * lineStep + a * stride] >= thr) {
            g += pre[a * (lines + 1) + hi] - pre[a * (lines + 1) + lo];
            a++;
          }
          if (g >= minGain) heapPush(heap, { g, o, l, a: a0, b: a - 1 });
        }
      }
    }
    const has = (o, l, a) => {
      const hi = Math.min((o ? cols : rows) - 1, l + m);
      for (let k = Math.max(0, l - m); k <= hi; k++) if (T[o ? a * cols + k : k * cols + a]) return true;
      return false;
    };
    const segs = [];
    while (heap.length) {
      const c = heapPop(heap);
      let s = c.a, e = c.b;
      while (s <= e && !has(c.o, c.l, s)) s++;
      if (s > e) continue;
      while (!has(c.o, c.l, e)) e--;
      const [ax, ay, bx, by] = c.o ? [c.l, s, c.l, e] : [s, c.l, e, c.l];
      const g = coverSeg(ctx, ax, ay, bx, by, m, false, 0);
      if (g < minGain) continue;
      if (heap.length && g < heap[0].g) {
        c.a = s;
        c.b = e;
        c.g = g;
        heapPush(heap, c);
        continue;
      }
      coverSeg(ctx, ax, ay, bx, by, m, true, 0);
      segs.push({ ax, ay, bx, by });
    }
    return segs;
  }
  function route(ctx, sx, sy, ends, used, rr) {
    const { cols, D, mark, parent, queue } = ctx;
    const stamp = ++ctx.stamp, start = sy * cols + sx;
    const rx0 = Math.max(0, ctx.bx0 - ctx.reach), rx1 = Math.min(cols - 1, ctx.bx1 + ctx.reach);
    const ry0 = Math.max(0, ctx.by0 - ctx.reach), ry1 = Math.min(ctx.rows - 1, ctx.by1 + ctx.reach);
    let qh = 0, qt = 0, hit = -1;
    mark[start] = stamp;
    parent[start] = -1;
    queue[qt++] = start;
    const visit = (n, c) => {
      if (mark[n] !== stamp && D[n] >= rr) {
        mark[n] = stamp;
        parent[n] = c;
        queue[qt++] = n;
      }
    };
    while (qh < qt && qt < ctx.routeVisit) {
      const c = queue[qh++];
      if (c !== start && ends.free(c, used)) {
        hit = c;
        break;
      }
      const x = c % cols, y = (c - x) / cols;
      if (x > rx0) visit(c - 1, c);
      if (x < rx1) visit(c + 1, c);
      if (y > ry0) visit(c - cols, c);
      if (y < ry1) visit(c + cols, c);
    }
    if (hit < 0) return null;
    const cells = [];
    for (let c = hit; c >= 0; c = parent[c]) cells.push([c % cols, (c - c % cols) / cols]);
    cells.reverse();
    const via = [];
    for (let i = 0; i < cells.length - 1; ) {
      let j = i + 1;
      for (let k = i + 2; k < cells.length; k++) if (safeSeg(ctx, cells[i][0], cells[i][1], cells[k][0], cells[k][1], rr)) j = k;
      if (j < cells.length - 1) via.push(cells[j]);
      if (via.length > ctx.routePoints) return null;
      i = j;
    }
    return { cell: hit, via };
  }
  var Ends = class {
    constructor(head) {
      __publicField(this, "head");
      __publicField(this, "id", []);
      __publicField(this, "next", []);
      __publicField(this, "cells", []);
      this.head = head;
    }
    add(cell, id) {
      if (this.head[cell] < 0) this.cells.push(cell);
      this.id.push(id);
      this.next.push(this.head[cell]);
      this.head[cell] = this.id.length - 1;
    }
     
    first(cell, used) {
      for (let k = this.head[cell]; k >= 0; k = this.next[k]) if (!used[this.id[k]]) return this.id[k];
      return -1;
    }
    free(cell, used) {
      return this.head[cell] >= 0 && this.first(cell, used) >= 0;
    }
    reset() {
      for (const c of this.cells) this.head[c] = -1;
    }
  };
  function chainSegments(ctx, segs, rr, B) {
    const bs = Math.max(8, 2 * B), gx = Math.ceil(ctx.cols / bs) + 1, grid =   new Map(), ends = new Ends(ctx.endHead);
    segs.forEach((s, id) => {
      ends.add(s.ay * ctx.cols + s.ax, id);
      ends.add(s.by * ctx.cols + s.bx, id);
    });
    const put = (x, y, id) => {
      const k = Math.floor(y / bs) * gx + Math.floor(x / bs);
      let a = grid.get(k);
      if (!a) grid.set(k, a = []);
      a.push(id);
    };
    segs.forEach((s, id) => {
      put(s.ax, s.ay, id);
      put(s.bx, s.by, id);
    });
    const used = new Uint8Array(segs.length);
    const order = segs.map((_, i) => i).sort((a, b) => segs[a].ay - segs[b].ay || segs[a].ax - segs[b].ax);
    const extend = (path) => {
      for (; ; ) {
        const [cx, cy] = path[path.length - 1];
        const bx0 = Math.floor(cx / bs), by0 = Math.floor(cy / bs), cand = [];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const a = grid.get((by0 + dy) * gx + bx0 + dx);
          if (a) {
            for (const id2 of a) if (!used[id2]) {
              const s2 = segs[id2];
              const d0 = (s2.ax - cx) ** 2 + (s2.ay - cy) ** 2, d1 = (s2.bx - cx) ** 2 + (s2.by - cy) ** 2;
              cand.push(d0 <= d1 ? [d0, id2, 0] : [d1, id2, 1]);
            }
          }
        }
        cand.sort((a, b) => a[0] - b[0]);
        let linked = false;
        for (let t = 0, tries = 0; t < cand.length && tries < 8; t++) {
          const [, id2, rev2] = cand[t];
          if (used[id2]) continue;
          tries++;
          const s2 = segs[id2];
          const p = rev2 ? [s2.bx, s2.by] : [s2.ax, s2.ay], q = rev2 ? [s2.ax, s2.ay] : [s2.bx, s2.by];
          if (!safeSeg(ctx, cx, cy, p[0], p[1], rr)) continue;
          used[id2] = 1;
          path.push(p, q);
          linked = true;
          break;
        }
        if (linked) continue;
        const r = route(ctx, cx, cy, ends, used, rr);
        if (!r) return;
        const id = ends.first(r.cell, used), s = segs[id];
        const rev = s.ax + s.ay * ctx.cols !== r.cell;
        used[id] = 1;
        path.push(...r.via, rev ? [s.bx, s.by] : [s.ax, s.ay], rev ? [s.ax, s.ay] : [s.bx, s.by]);
      }
    };
    const paths = [];
    for (const start of order) {
      if (used[start]) continue;
      used[start] = 1;
      const s = segs[start], path = [[s.ax, s.ay], [s.bx, s.by]];
      extend(path);
      path.reverse();
      extend(path);
      paths.push(path);
    }
    ends.reset();
    return paths;
  }
  function simplify(ctx, pts, rr, delta) {
    const p = [];
    for (const q of pts) {
      const l = p[p.length - 1];
      if (!l || l[0] !== q[0] || l[1] !== q[1]) p.push(q);
    }
    if (p.length <= 2) return p;
    const out = [p[0]], d2 = delta * delta + 1e-9;
    for (let i = 0; i < p.length - 1; ) {
      let j = i + 1;
      for (let k = i + 2; k < p.length && k <= i + 96; k++) {
        let ok = true;
        for (let t = i + 1; t < k && ok; t++) ok = segDist2(p[t][0], p[t][1], p[i][0], p[i][1], p[k][0], p[k][1]) <= d2;
        if (!ok || !safeSeg(ctx, p[i][0], p[i][1], p[k][0], p[k][1], rr)) break;
        j = k;
      }
      out.push(p[j]);
      i = j;
    }
    return out;
  }
  function toOp(color, m, cell, pts) {
    const px = (v) => (v + 0.5) * cell;
    const out = [];
    for (const [x, y] of pts) {
      const q = [px(x), px(y)], l = out[out.length - 1];
      if (!l || l[0] !== q[0] || l[1] !== q[1]) out.push(q);
    }
    return { tool: "brush", color, width: (2 * m + 1) * cell, points: out };
  }
  var breathe = () => new Promise((r) => setTimeout(r, 0));
  async function layers(cols, rows, label, palette, white, opt) {
    const N = cols * rows, K = palette.length, tol = opt.tol, cell = opt.cell;
    const area = new Array(K).fill(0), parts = countParts(cols, rows, label, K);
    for (let i = 0; i < N; i++) area[label[i]]++;
    const order = [...Array(K).keys()].filter((c) => area[c]).sort((a, b) => area[b] - area[a]);
    const rest = order.slice(1).sort((a, b) => area[b] * Math.sqrt(parts[b]) - area[a] * Math.sqrt(parts[a]));
    order.splice(1, rest.length, ...rest);
    const ctx = {
      cols,
      rows,
      tolSafe: 0.6 * tol,
      left: 0,
      gy: new Float64Array(N),
      gr: new Int32Array(N),
      env: new Float64Array(cols),
      v: new Int32Array(cols),
      z: new Float64Array(cols + 1),
      D: new Float32Array(N),
      site: new Int32Array(N),
      T: new Uint8Array(N),
      touched: new Uint8Array(N),
      mark: new Int32Array(N),
      parent: new Int32Array(N),
      queue: new Int32Array(N),
      stamp: 0,
      P: new Int32Array(cols * (rows + 1)),
      Q: new Int32Array(rows * (cols + 1)),
      endHead: new Int32Array(N).fill(-1),
      routePoints: opt.routePoints,
      routeVisit: Math.min(N, Math.max(6e3, opt.routePoints * ROUTE_VISIT_PER_POINT)),
      bx0: 0,
      bx1: 0,
      by0: 0,
      by1: 0,
      wx0: 0,
      wx1: 0,
      wy0: 0,
      wy1: 0,
      reach: 0
    };
    const slack = 0.8 * tol;
    const levels = [];
    for (let m = Math.floor((LIMITS.maxWidth / cell - 1) / 2); m >= 1; m = Math.floor(m * LEVEL_STEP)) levels.push(m);
    levels.push(0);
    ctx.reach = levels[0] + 1;
    const margin = 2 * ctx.reach + 2;
    const forb = new Uint8Array(N), ops = [];
    let points = 0;
    let lastYield = Date.now();
    const maybeYield = async () => {
      if (Date.now() - lastYield > 40) {
        lastYield = Date.now();
        await breathe();
      }
    };
    for (let ci = 0; ci < order.length; ci++) {
      const c = order[ci];
      await maybeYield();
      if (opt.abortAfter && Date.now() > opt.abortAfter) throw new Aborted();
      let left = 0, bx0 = cols, bx1 = -1, by0 = rows, by1 = -1;
      for (let y = 0, i = 0; y < rows; y++) for (let x = 0; x < cols; x++, i++) {
        const t = label[i] === c && (c !== white || ctx.touched[i]) ? 1 : 0;
        ctx.T[i] = t;
        if (t) {
          left++;
          if (x < bx0) bx0 = x;
          if (x > bx1) bx1 = x;
          if (y < by0) by0 = y;
          if (y > by1) by1 = y;
        }
      }
      if (left) {
        ctx.left = left;
        Object.assign(ctx, {
          bx0,
          bx1,
          by0,
          by1,
          wx0: Math.max(0, bx0 - margin),
          wx1: Math.min(cols - 1, bx1 + margin),
          wy0: Math.max(0, by0 - margin),
          wy1: Math.min(rows - 1, by1 + margin)
        });
        const maxD = distanceField(ctx, forb);
        for (const m of levels) {
          if (!ctx.left) break;
          await maybeYield();
          if (m && maxD < m + 1 - ctx.tolSafe) continue;
          const segs = levelSegments(ctx, m);
          if (!segs.length) continue;
          const thr = m + 1 - ctx.tolSafe;
          for (const path of chainSegments(ctx, segs, thr, 2 * m + 1)) {
            await maybeYield();
            const pts = simplify(ctx, path, thr, slack);
            for (let i = 0; i < pts.length; i++) {
              await maybeYield();
              const a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)];
              coverSeg(ctx, a[0], a[1], b[0], b[1], m, true, thr);
            }
            if (opt.abortOps && ops.length >= opt.abortOps || opt.abortPoints && points >= opt.abortPoints) {
              throw new Aborted(ops);
            }
            const op = toOp(palette[c], m, cell, pts);
            ops.push(op);
            points += op.points.length;
          }
          if (opt.abortOps && ops.length >= opt.abortOps || opt.abortPoints && points >= opt.abortPoints) {
            throw new Aborted(ops);
          }
        }
      }
      for (let i = 0; i < N; i++) if (label[i] === c) forb[i] = 1;
      opt.onProgress?.((ci + 1) / order.length);
    }
    return ops;
  }

  function exact(cols, rows, label, palette, white, opt) {
    const total = cols * rows, cell = opt.cell;
    const area = new Array(palette.length).fill(0);
    for (let i = 0; i < total; i++) if (label[i] !== white) area[label[i]]++;
    const order = palette.map((_, p) => p).filter((p) => area[p] > 0).sort((a, b) => area[a] - area[b]);
    const rankOf = new Int32Array(palette.length).fill(-1);
    order.forEach((p, r) => {
      rankOf[p] = r;
    });
    const rk = new Int32Array(total).fill(-1);
    for (let i = 0; i < total; i++) if (label[i] !== white) rk[i] = rankOf[label[i]];
    const vis = new Int32Array(total), parent = new Int32Array(total), queue = new Int32Array(total);
    const keep = new Uint8Array(total), head = new Int32Array(total), nextS = new Int32Array(total);
    const xy = (i) => [(i % cols + 0.5) * cell, (Math.floor(i / cols) + 0.5) * cell];
    const out = [];
    let points = 0;
    for (let L = 0; L < order.length; L++) {
      const mark = L + 1;
      let qt = 0;
      const push = (nb, c) => {
        if (rk[nb] >= L && vis[nb] !== mark) {
          vis[nb] = mark;
          parent[nb] = c;
          head[nb] = -1;
          queue[qt++] = nb;
        }
      };
      for (let s = 0; s < total; s++) {
        if (rk[s] !== L || vis[s] === mark) continue;
        qt = 0;
        let qh = 0;
        vis[s] = mark;
        parent[s] = -1;
        head[s] = -1;
        queue[qt++] = s;
        while (qh < qt) {
          const c = queue[qh++], x = c % cols;
          if (x > 0) push(c - 1, c);
          if (x < cols - 1) push(c + 1, c);
          if (c >= cols) push(c - cols, c);
          if (c + cols < total) push(c + cols, c);
        }
        for (let i = qt - 1; i >= 0; i--) {
          const c = queue[i];
          if (rk[c] === L) keep[c] = 1;
          if (keep[c] && parent[c] >= 0) keep[parent[c]] = 1;
        }
        for (let i = 1; i < qt; i++) {
          const c = queue[i];
          if (keep[c]) {
            const p = parent[c];
            nextS[c] = head[p];
            head[p] = c;
          }
        }
        const stack = [s], tour = [s];
        let lastNew = 0;
        while (stack.length) {
          const c = stack[stack.length - 1], ch = head[c];
          if (ch !== -1) {
            head[c] = nextS[ch];
            stack.push(ch);
            tour.push(ch);
            lastNew = tour.length - 1;
          } else {
            stack.pop();
            if (stack.length) tour.push(stack[stack.length - 1]);
          }
        }
        tour.length = lastNew + 1;
        for (let i = 0; i < qt; i++) keep[queue[i]] = 0;
        const pts = [];
        for (let i = 0; i < tour.length; i++) {
          if (i > 0 && i < tour.length - 1 && tour[i] - tour[i - 1] === tour[i + 1] - tour[i]) continue;
          pts.push(xy(tour[i]));
        }
        out.push({ tool: "brush", color: palette[order[L]], width: cell, points: pts });
        points += pts.length;
        if (opt.abortOps && out.length > opt.abortOps || opt.abortPoints && points > opt.abortPoints) throw new Aborted();
      }
      opt.onProgress?.((L + 1) / order.length);
    }
    return out;
  }

  var breathe2 = () => new Promise((r) => setTimeout(r, 0));
  var DEFAULTS = {
    engine: "layers",
    auto: true,
    paletteMode: "vivid",
    merge: 0,
    cell: 1,
    colors: 48,
    smooth: 0,
    minArea: 4,
    tol: 0.4,
    routePoints: 24,
    whiteMin: 245,
    adjust: { brightness: 0, contrast: 0, saturation: 0, denoise: 0 }
  };
  var mergeLambda = (v) => v > 0 ? 1e-4 * 300 ** (v / 100) : 0;
  var Session = class {
    constructor(src) {
      __publicField(this, "src");
      __publicField(this, "adjKey", "");
      __publicField(this, "target");
      __publicField(this, "targetLab");
      __publicField(this, "grids",   new Map());
      __publicField(this, "quants",   new Map());
       
      __publicField(this, "deadline", 0);
      this.src = src;
    }
    prepare(p) {
      const key = JSON.stringify(p.adjust);
      if (key === this.adjKey) return;
      this.adjKey = key;
      this.target = adjust(this.src, p.adjust);
      this.targetLab = labOf(this.target.data, this.target.width * this.target.height);
      this.grids.clear();
      this.quants.clear();
    }
    grid(cell) {
      let g = this.grids.get(cell);
      if (!g) this.grids.set(cell, g = downsample(this.target, cell));
      return g;
    }
    quant(cell, colors, whiteMin, mode = "classic", merge = 0) {
      const key = `${cell}/${colors}/${whiteMin}/${mode}/${merge}`;
      let q = this.quants.get(key);
      if (!q) {
        q = merge > 0 ? cohere(this.grid(cell), this.quant(cell, colors, whiteMin, mode), mergeLambda(merge) / cell, mode) : quantize(this.grid(cell), colors, whiteMin, mode);
        this.quants.set(key, q);
      }
      return q;
    }
     
    async build(p, d, limit, onProgress) {
      this.prepare(p);
      const g = this.grid(d.cell), q = this.quant(d.cell, d.colors, p.whiteMin, p.paletteMode, d.merge), K = q.palette.length;
      let label = q.label;
      if (K > 1) {
        if (d.smooth > 0) label = despeckle(g.width, g.height, label, K);
        const full = Math.floor(d.smooth + 1e-9), part = d.smooth - full;
        for (let i = 0; i < full; i++) label = smoothLabels(g.width, g.height, label, K);
        if (part > 0.01) label = smoothLabels(g.width, g.height, label, K, 9 - Math.round(part * 4));
        if (label === q.label) label = label.slice();
        mergeSmall(g.width, g.height, label, K, Math.max(1, Math.round(d.minArea / (d.cell * d.cell))));
      }
      const abort = limit ? { abortOps: LIMITS.ops, abortPoints: LIMITS.points } : {};
      try {
        const ops = p.engine === "exact" ? exact(g.width, g.height, label, q.palette, q.white, { cell: d.cell, ...abort, onProgress }) : await layers(g.width, g.height, label, q.palette, q.white, { cell: d.cell, tol: p.tol, routePoints: p.routePoints, ...abort, onProgress });
        const split = splitLong(ops);
        if (limit && split.length > LIMITS.ops) {
          if (split.length <= LIMITS.ops * 1.02) return { ops: split.slice(0, LIMITS.ops), palette: q.palette };
          return null;
        }
        return { ops: split, palette: q.palette };
      } catch (e) {
        if (e instanceof Aborted) {
          if (!e.ops || !e.ops.length) return null;
          const split = splitLong(e.ops);
          const s = stats(split);
          const overOps = s.ops - LIMITS.ops, overPts = s.points - LIMITS.points;
          if (overOps <= 2 && overPts <= 50) {
            return { ops: split.slice(0, LIMITS.ops), palette: q.palette };
          }
          return null;
        }
        throw e;
      }
    }
     
    approxQuality(p, d) {
      this.prepare(p);
      const g = this.grid(d.cell), q = this.quant(d.cell, d.colors, p.whiteMin, p.paletteMode, d.merge), K = q.palette.length;
      let label = q.label;
      if (K > 1 && d.minArea > 1) {
        label = label.slice();
        mergeSmall(g.width, g.height, label, K, Math.max(1, Math.round(d.minArea / (d.cell * d.cell))));
      }
      const pal = new Float32Array(K * 3);
      q.palette.forEach((h, i) => {
        const [r, gg, b] = fromHex(h);
        pal.set(oklabF(r, gg, b), i * 3);
      });
      const tw = this.target.width, th = this.target.height;
      const stepX = Math.max(1, Math.floor(tw / 550)), stepY = Math.max(1, Math.floor(th / 190));
      let sum = 0, n = 0;
      for (let y = 0; y < th; y += stepY) {
        const gy = Math.min(g.height - 1, Math.floor(y / d.cell));
        for (let x = 0; x < tw; x += stepX) {
          const gx = Math.min(g.width - 1, Math.floor(x / d.cell));
          const li = label[gy * g.width + gx];
          if (li < 0) continue;
          const j = (y * tw + x) * 3;
          const dL = pal[li * 3] - this.targetLab[j];
          const dA = pal[li * 3 + 1] - this.targetLab[j + 1];
          const dB = pal[li * 3 + 2] - this.targetLab[j + 2];
          sum += Math.sqrt(dL * dL + dA * dA + dB * dB) * 100;
          n++;
        }
      }
      return n ? sum / n : 999;
    }
     
    estimateOps(p, d) {
      this.prepare(p);
      const g = this.grid(d.cell), q = this.quant(d.cell, d.colors, p.whiteMin, p.paletteMode, d.merge), K = q.palette.length;
      const label = q.label.slice();
      if (K > 1) mergeSmall(g.width, g.height, label, K, Math.max(1, Math.round(d.minArea / (d.cell * d.cell))));
      const parts = countParts(g.width, g.height, label, K);
      let n = 0;
      for (let i = 0; i < parts.length; i++) if (i !== q.white) n += parts[i];
      return n;
    }
     
    targetImage(p) {
      this.prepare(p);
      return this.target;
    }
    async quality(ops) {
      const { width, height } = this.target;
      const rgb = await renderOpsAsync(ops, width, height);
      await breathe2();
      return compare(rgb, this.targetLab, width * height);
    }
    async run(p, onProgress = () => {
    }) {
      this.prepare(p);
      const tried = [];
      const fits = (ops2) => {
        const s = stats(ops2);
        return s.ops <= LIMITS.ops && s.points <= LIMITS.points;
      };
      let best = null;
      if (!p.auto) {
        const d = { cell: p.cell, colors: p.colors, smooth: p.smooth, minArea: p.minArea, merge: p.merge };
        const r = await this.build(p, d, false, (f) => onProgress("\u0428\u0442\u0440\u0438\u0445\u0438", f));
        best = { ...r, detail: d };
        const s = stats(r.ops);
        tried.push({ detail: d, ops: s.ops, points: s.points, fits: fits(r.ops) });
      } else {
        const PAIRS = [
          { cell: 2, colors: 64 },
          { cell: 2, colors: 32 },
          { cell: 3, colors: 48 },
          { cell: 4, colors: 32 }
        ];
        const AREAS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048, 3072, 4096];
        const t0 = Date.now();
        this.deadline = t0 + 6e4;
        let bestQ = Infinity;
        for (let pi = 0; pi < PAIRS.length; pi++) {
          if (Date.now() > this.deadline) break;
          const { cell, colors } = PAIRS[pi];
          const merge = 50;
          onProgress(`\u0412\u0430\u0440\u0438\u0430\u043D\u0442 ${pi + 1}/${PAIRS.length}: ${cell}px, ${colors} \u0446\u0432.`, pi / PAIRS.length);
          let fit = -1, built = null;
          for (let i = 4; i < AREAS.length; i++) {
            if (Date.now() > this.deadline) break;
            const d2 = { cell, colors, smooth: 0, minArea: AREAS[i], merge };
            const r2 = await this.build(p, d2, true);
            if (r2 && fits(r2.ops)) {
              fit = i;
              built = r2;
              break;
            }
          }
          if (fit < 0 || !built) continue;
          const d = { cell, colors, smooth: 0, minArea: AREAS[fit], merge };
          const r = built;
          const s = stats(r.ops);
          tried.push({ detail: d, ops: s.ops, points: s.points, fits: true });
          const q = (await this.quality(r.ops)).dE;
          if (q < bestQ) {
            bestQ = q;
            best = { ...r, detail: d };
          }
          onProgress(`\u0412\u0430\u0440\u0438\u0430\u043D\u0442 ${pi + 1}: \u0394E ${q.toFixed(2)}, ${s.ops} \u0448\u0442\u0440.`, (pi + 1) / PAIRS.length);
          if (bestQ < 1.6) break;
        }
        if (!best) {
          for (const cell of [4, 6, 8]) {
            for (const minArea of [4096, 2048, 1024]) {
              const d = { cell, colors: 16, smooth: 0, minArea, merge: 0 };
              const r = await this.build(p, d, false);
              if (r && fits(r.ops)) {
                best = { ...r, detail: d };
                break;
              }
            }
            if (best) break;
          }
        }
      }
      if (!best) throw new Error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0434\u043E\u0431\u0440\u0430\u0442\u044C \u0440\u0438\u0441\u0443\u043D\u043E\u043A");
      const ops = best.ops;
      onProgress("\u0413\u043E\u0442\u043E\u0432\u043E", 1);
      return { ops, palette: best.palette, detail: best.detail, stats: stats(ops), quality: await this.quality(ops), tried };
    }
  };

  async function autoBanner(imgData, onProgress) {
    const session = new Session(imgData);
    const base = {
      ...DEFAULTS,
      auto: true,
      engine: "layers",
      paletteMode: "vivid",
      smooth: 0,
      adjust: { ...DEFAULTS.adjust }
    };
    onProgress?.("\u041E\u0446\u0435\u043D\u043A\u0430 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u043E\u0432\u2026", 0.02);
    await new Promise((r2) => setTimeout(r2, 0));
    const r = await session.run(base, (stage, done) => onProgress?.(stage, 0.05 + 0.95 * done));
    const s = stats(r.ops);
    const fits = s.ops <= LIMITS.ops && s.points <= LIMITS.points;
    return {
      ops: r.ops,
      opsCount: s.ops,
      points: s.points,
      dE: r.quality.dE,
      cell: r.detail.cell,
      colors: r.detail.colors,
      merge: r.detail.merge,
      minArea: r.detail.minArea,
      fits
    };
  }
  async function benchBanner(imgData, p) {
    const cell = p.cell ?? 2;
    const session = new Session(imgData);
    const base = {
      ...DEFAULTS,
      auto: false,
      engine: "layers",
      paletteMode: "vivid",
      cell,
      colors: p.colors,
      merge: p.merge,
      smooth: 0,
      minArea: p.minArea,
      adjust: { ...DEFAULTS.adjust }
    };
    const d = { cell, colors: p.colors, smooth: 0, minArea: p.minArea, merge: p.merge };
    const r = await session.build(base, d, true);
    if (!r) return { ops: LIMITS.ops + 1, points: LIMITS.points + 1, dE: 999, fits: false };
    const s = stats(r.ops);
    return { ops: s.ops, points: s.points, dE: (await session.quality(r.ops)).dE, fits: s.ops <= LIMITS.ops && s.points <= LIMITS.points };
  }
  return __toCommonJS(banner_api_exports);
})();
