// Видео и звук страницы под окнами мода: открыли галерею или «Сообщения» — видео сайта на паузе; пока окно
// открыто — страница сама не заиграет; своё (видео галереи, фон мода) играет дальше.
// Запуск:  node test/mediapause.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const mp4 = fs.readFileSync(path.join(__dirname, 'out', 'bg-test.mp4'));
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const posts = { data: { posts: [
  { id: 'v1', author: { username: 'a' }, attachments: [{ type: 'video', url: 'https://cdn.xn--d1ah4a.com/videos/vp-v1.mp4', width: 640, height: 360, duration: 3 }] },
  { id: 'i1', author: { username: 'b' }, attachments: [{ type: 'image', url: 'https://cdn.xn--d1ah4a.com/images/vp-i1.png', width: 600, height: 600 }] }
], pagination: { nextCursor: null } } };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.route('**/*', r => {
    const u = new URL(r.request().url()), t = r.request().resourceType();
    if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
    if (u.pathname.endsWith('.mp4')) return r.fulfill({ contentType: 'video/mp4', body: mp4 });
    if (u.pathname.startsWith('/images/')) return r.fulfill({ contentType: 'image/png', body: fs.readFileSync(path.join(__dirname, 'out', 'tone-white.png')) });
    if (['stylesheet', 'font'].includes(t)) return r.continue();
    if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
    if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
    if (u.pathname === '/api/posts') return r.fulfill({ contentType: 'application/json', body: JSON.stringify(posts) });
    return r.fulfill({ status: 404, body: '' });
  });
  await p.addInitScript(m => {
    const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
    window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
    window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
    window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
  }, src.slice(0, src.indexOf('==/UserScript==')));
  await p.goto(ORIGIN + '/');
  await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob, .vp-gal-nav, .vp-msgs').forEach(e => e.remove()));
  await p.addScriptTag({ content: src });
  await p.waitForTimeout(2000);
  // «видео сайта со звуком» — в посте; «фон мода» — видео в слое фона
  await p.evaluate(() => {
    const v = document.createElement('video');
    Object.assign(v, { src: 'https://cdn.xn--d1ah4a.com/videos/site.mp4', loop: true, muted: false, id: 'site-video' });
    document.querySelector('.vp-post').appendChild(v);
    const bg = document.createElement('video');
    Object.assign(bg, { src: 'https://cdn.xn--d1ah4a.com/videos/bg.mp4', loop: true, muted: true, id: 'bg-video' });
    document.querySelector('.vp-bg-media').appendChild(bg);
    return Promise.all([v.play(), bg.play()]);
  });
  const state = () => p.evaluate(() => ({ site: !document.getElementById('site-video').paused, bg: !document.getElementById('bg-video').paused,
    gal: [...document.querySelectorAll('.vp-gal video')].map(v => !v.paused) }));
  check((await state()).site, 'видео сайта со звуком играет');
  // 1) открыли галерею
  await p.$eval('.vp-gal-nav', a => a.click());
  await p.waitForTimeout(1500);
  let s1 = await state();
  check(!s1.site, 'открыли галерею — видео сайта на паузе');
  check(s1.bg, 'фон мода (видео) играет дальше');
  check(s1.gal.length && s1.gal.every(Boolean), `видео в галерее играет (${JSON.stringify(s1.gal)})`);
  // 2) пока галерея открыта — страница сама не заиграет
  await p.evaluate(() => document.getElementById('site-video').play().catch(() => {}));
  await p.waitForTimeout(400);
  check(!(await state()).site, 'пока открыта галерея, видео сайта само не запускается');
  // 3) закрыли галерею (пункт «Лента») — видео сайта можно запустить; открыли «Сообщения» — снова пауза
  await p.$eval('nav a[href="/"]', a => a.click());
  await p.waitForTimeout(700);
  await p.evaluate(() => document.getElementById('site-video').play());
  await p.waitForTimeout(300);
  const s3 = await state();
  check(s3.site && !(await p.$('.vp-gal')), 'галерею закрыли — видео сайта снова играет по нажатию');
  await p.$eval('nav a[href="#"]', a => a.click());
  await p.waitForTimeout(800);
  const s4 = await state();
  check(!s4.site && s4.bg, 'открыли «Сообщения» — видео сайта на паузе, фон играет');
  check(!errors.length, 'ошибок нет' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
