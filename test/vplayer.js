// Плеер видео в ленте (3.6.0): своя панель поверх видео — перемотка, время, скорость, звук, клавиатура; кнопки сайта (пауза, звук, во весь экран) остаются рабочими под ней.
// Видео в снимке не играет, поэтому вместо него подставляется звуковой файл на 6 секунд (длительность известна), а кнопки сайта оживляются заглушками.
// Запуск:  node test/vplayer.js снимок-ленты-с-видео.html   (скрины — в test/out/vplayer-*.png)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const wav = (() => {
  const rate = 8000, n = rate * 6, b = Buffer.alloc(44 + n);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate, 28); b.writeUInt16LE(1, 32); b.writeUInt16LE(8, 34); b.write('data', 36); b.writeUInt32LE(n, 40); b.fill(128, 44);
  return b;
})();
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (u.pathname === '/vp-test.wav') {
      const m = (r.request().headers().range || '').match(/bytes=(d+)-(d*)/);
      if (!m) return r.fulfill({ contentType: 'audio/wav', headers: { 'accept-ranges': 'bytes' }, body: wav });
      const a = +m[1], z = m[2] ? +m[2] : wav.length - 1;
      return r.fulfill({ status: 206, contentType: 'audio/wav', headers: { 'accept-ranges': 'bytes', 'content-range': `bytes ${a}-${z}/${wav.length}` }, body: wav.subarray(a, z + 1) });
    }
    if (t === 'image' || t === 'font') return r.abort();
    if (t === 'stylesheet') return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; window.__gm = s; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => {
    const v = document.querySelector('video');
    v.scrollIntoView({ block: 'center' });
    v.src = '/vp-test.wav';
    v.removeAttribute('loop');
    const box = v.parentElement;
    window.__fs = 0;
    box.querySelector('[aria-label="Pause"]').onclick = e => { e.stopPropagation(); v.paused ? v.play() : v.pause(); };
    box.querySelector('[aria-label="Unmute"]').onclick = e => { e.stopPropagation(); v.muted = !v.muted; };
    box.querySelector('[aria-label="Fullscreen"]').onclick = e => { e.stopPropagation(); window.__fs++; };
    box.addEventListener('click', () => { if (!window.__skipBox) v.paused ? v.play() : v.pause(); });
  });
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2500);
  const info = () => p.evaluate(() => { const v = document.querySelector('video'); return { t: v.currentTime, d: v.duration, paused: v.paused, muted: v.muted, vol: v.volume, rate: v.playbackRate }; });

  check(await p.locator('.vp-vbar').count() === 1, 'у видео появилась своя панель');
  check(await p.evaluate(() => getComputedStyle(document.querySelector('.vp-site-ctl')).display === 'none'), 'панель сайта спрятана');
  await p.evaluate(() => { document.querySelector('video').load(); });
  await p.waitForFunction(() => document.querySelector('video').duration > 5, null, { timeout: 8000 });
  await p.waitForTimeout(300);
  check(await p.evaluate(() => document.querySelector('.vp-vtime i').textContent) === '0:06', 'общее время 0:06: ' + await p.evaluate(() => document.querySelector('.vp-vtime i').textContent));
  const vb = await p.locator('video').boundingBox();
  await p.mouse.move(vb.x + vb.width / 2, vb.y + vb.height / 2);
  await p.waitForTimeout(400);
  check(await p.evaluate(() => getComputedStyle(document.querySelector('.vp-vbar')).opacity) === '1', 'на паузе панель видна');
  await p.screenshot({ path: path.join(out, 'vplayer-1-pause.png'), clip: { x: vb.x, y: Math.max(0, vb.y + vb.height - 160), width: vb.width, height: 170 } });

  await p.click('.vp-vplay');
  await p.waitForTimeout(500);
  let s = await info();
  check(!s.paused, 'кнопка «играть» запустила видео через кнопку сайта, время ' + s.t.toFixed(2));
  await p.mouse.move(vb.x + vb.width / 2, vb.y + 40);
  await p.waitForTimeout(3200);
  check(await p.evaluate(() => getComputedStyle(document.querySelector('.vp-vbar')).opacity) === '0', 'во время игры панель прячется сама');
  await p.mouse.move(vb.x + vb.width / 2 + 30, vb.y + vb.height / 2 + 10);
  await p.waitForTimeout(350);
  check(await p.evaluate(() => getComputedStyle(document.querySelector('.vp-vbar')).opacity) === '1', 'шевельнул мышью — панель вернулась');

  const pr = await p.locator('.vp-vprog').boundingBox();
  await p.mouse.move(pr.x + pr.width * 0.75, pr.y + pr.height / 2);
  await p.waitForTimeout(250);
  check(await p.evaluate(() => document.querySelector('.vp-vtip').textContent) === '0:04', 'над полосой подсказка времени: ' + await p.evaluate(() => document.querySelector('.vp-vtip').textContent));
  await p.screenshot({ path: path.join(out, 'vplayer-2-hover.png'), clip: { x: vb.x, y: Math.max(0, vb.y + vb.height - 160), width: vb.width, height: 170 } });
  await p.mouse.click(pr.x + pr.width * 0.5, pr.y + pr.height / 2);
  await p.waitForTimeout(250);
  s = await info();
  check(Math.abs(s.t - 3) < 0.5, 'щелчок на середине полосы перемотал к 3 секундам: ' + s.t.toFixed(2));
  await p.mouse.move(pr.x + pr.width * 0.1, pr.y + pr.height / 2);
  await p.mouse.down(); await p.mouse.move(pr.x + pr.width * 0.9, pr.y + pr.height / 2, { steps: 6 }); await p.mouse.up();
  await p.waitForTimeout(200);
  s = await info();
  check(s.t > 4.8, 'протягивание по полосе: ' + s.t.toFixed(2));
  check(s.d > 5, 'щелчок по панели не переключил паузу (играет: ' + !s.paused + ')');

  await p.click('.vp-vskip[data-s="-10"]');
  s = await info();
  check(s.t < 0.5, 'назад на 10 секунд — в начало: ' + s.t.toFixed(2));
  await p.mouse.move(vb.x + vb.width / 2, vb.y + vb.height / 2);
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(100);
  s = await info();
  check(s.t > 4.5 && s.t < 6, 'стрелка вправо: +5 секунд (' + s.t.toFixed(2) + ')');
  await p.keyboard.press('m');
  await p.waitForTimeout(100);
  check((await info()).muted === true, 'клавиша M выключила звук через кнопку сайта');
  await p.keyboard.press('f');
  check(await p.evaluate(() => window.__fs) === 1, 'клавиша F нажала «во весь экран» сайта');
  await p.keyboard.press(' ');
  await p.waitForTimeout(150);
  check((await info()).paused === true, 'пробел — пауза');

  await p.click('.vp-vrate');
  await p.click('.vp-vmenu button[data-r="1.5"]');
  await p.waitForTimeout(100);
  s = await info();
  check(s.rate === 1.5 && await p.evaluate(() => document.querySelector('.vp-vrate').textContent) === '1.5×', 'скорость 1.5×: ' + s.rate);
  check(await p.evaluate(() => window.__gm && window.__gm.vpPlayerRate) === 1.5, 'скорость запомнилась');

  await p.evaluate(() => { document.querySelector('video').muted = false; });
  await p.hover('.vp-vvol');
  await p.waitForTimeout(350);
  const rg = await p.locator('.vp-vrange').boundingBox();
  check(rg.width > 50, 'при наведении на звук выезжает ползунок (' + Math.round(rg.width) + ' px)');
  await p.mouse.click(rg.x + rg.width * 0.3, rg.y + rg.height / 2);
  await p.waitForTimeout(150);
  s = await info();
  check(s.vol > 0.15 && s.vol < 0.45, 'ползунок поставил громкость ' + s.vol.toFixed(2));
  await p.screenshot({ path: path.join(out, 'vplayer-3-volume.png'), clip: { x: vb.x, y: Math.max(0, vb.y + vb.height - 160), width: vb.width, height: 170 } });
  check(errors.length === 0, 'нет ошибок страницы ' + errors.join('|'));
  await b.close();
  console.log(fails.length ? '\nПРОВАЛЕНО: ' + fails.length : '\nвсё ок');
  process.exit(fails.length ? 1 : 0);
})();
