// Видео заставки: кадры по времени анимаций (30 к/с) + звук тем же кодом (OfflineAudioContext) → mp4.
// Запуск:  node test/intro-video.js снимок.html [normal|rare|assemble] [dark|light] [выход.mp4]
// Нужен ffmpeg (FFMPEG=путь). Кадры и звук — во временной папке test/out/_vid.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const [snapPath, kind = 'rare', theme = 'dark', outFile] = process.argv.slice(2);
const snap = fs.readFileSync(snapPath, 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const dir = path.join(__dirname, 'out', '_vid');
fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const out = outFile || path.join(__dirname, 'out', `intro-${kind}-${theme}.mp4`);
const URL0 = 'https://xn--d1ah4a.com/';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.route('**/*', r => r.request().url() === URL0 ? r.fulfill({ contentType: 'text/html', body: snap }) : r.fulfill({ status: 404, body: '' }));
  await p.addInitScript(([m, rare]) => {
    const s = { introEnabled: true, backgroundEnabled: false, introPreview: rare };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, [src.slice(0, src.indexOf('==/UserScript==')), kind === 'normal' ? '' : kind]);
  await p.goto(URL0);
  await p.evaluate(th => { document.documentElement.setAttribute('data-theme', th); document.querySelectorAll('.vpi-overlay').forEach(e => e.remove()); }, theme);
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(150);
  // длина ролика — по самой длинной анимации заставки
  const total = await p.evaluate(() => Math.max(...document.getAnimations().filter(a => a.effect?.target?.closest?.('.vpi-overlay'))
    .map(a => { const t = a.effect.getComputedTiming(); return (t.delay || 0) + (t.activeDuration || 0); })) + 300);
  const n = Math.ceil(total / 1000 * 30);
  for (let i = 0; i < n; i++) {
    const t = i * 1000 / 30;
    await p.evaluate(t => document.getAnimations().forEach(a => { if (a.effect?.target?.closest?.('.vpi-overlay')) { a.pause(); a.currentTime = t; } }), t);
    await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));   // холст «сборки» рисует в кадре
    await p.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.png`) });
  }
  // звук: тот же introSound, отрисованный заранее
  const code = src.slice(src.indexOf('    // ==== заставка:начало'), src.indexOf('    // Тема сайта для заставки'));
  const wav = await p.evaluate(async ([code, rare, secs]) => {
    const f = new Function('GM_getValue', code + '; return introSound;');
    const introSound = f((k, d) => d);
    const ctx = new OfflineAudioContext(2, Math.ceil(44100 * secs), 44100);
    introSound(ctx, ms => Math.max(0, ms / 1000), rare === 'rare' ? true : rare || false);
    const buf = await ctx.startRendering();
    const ch = [buf.getChannelData(0), buf.getChannelData(1)], len = buf.length;
    const dv = new DataView(new ArrayBuffer(44 + len * 4));
    const w = (o, str) => [...str].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); dv.setUint32(4, 36 + len * 4, true); w(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true);
    dv.setUint16(22, 2, true); dv.setUint32(24, 44100, true); dv.setUint32(28, 44100 * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true);
    w(36, 'data'); dv.setUint32(40, len * 4, true);
    for (let i = 0; i < len; i++) for (let c = 0; c < 2; c++) dv.setInt16(44 + i * 4 + c * 2, Math.max(-1, Math.min(1, ch[c][i] * 6)) * 32767, true);
    let bin = ''; const u8 = new Uint8Array(dv.buffer); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
    return btoa(bin);
  }, [code, kind === 'normal' ? '' : kind, total / 1000 + 1.8]);
  fs.writeFileSync(path.join(dir, 'a.wav'), Buffer.from(wav, 'base64'));
  await b.close();
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-framerate', '30', '-i', path.join(dir, 'f%04d.png'), '-i', path.join(dir, 'a.wav'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', '-shortest', out]);
  console.log(`${out}: ${n} кадров, ${(total / 1000).toFixed(2)} с`);
})();
