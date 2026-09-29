// Статистика «День / Месяц» (3.3.8): опорный снимок — ближайший по возрасту к периоду (не «последний старше»),
// подпись «с дд.мм, чч:мм» — всегда, когда снимок заметно не совпадает с периодом.
// Жалоба GekataNite 29.09: «за день показывает стату за месяц» — был только старый снимок, «День» брал его без подписи.
// Запуск:  node test/statsperiod.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const ORIGIN = 'https://xn--d1ah4a.com';
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const H = 3600e3, D = 24 * H;

(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const run = async hist => {
    const p = await b.newPage({ viewport: { width: 1700, height: 950 } });
    p.errors = [];
    p.on('pageerror', e => p.errors.push(e.message));
    await p.route('**/*', r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ username: 'NeuroSFW', id: 'u1', followersCount: 236, followingCount: 125, postsCount: 573 }) });
      if (u.pathname === '/api/posts/user/NeuroSFW') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { posts: [{ id: 'w1', likesCount: 220, author: { username: 'NeuroSFW' } }], pagination: { nextCursor: null } } }) });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(([m, h]) => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false, vp_stats_hist: JSON.stringify(h.map(x => ({ ...x, at: Date.now() - x.ago }))) };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, [src.slice(0, src.indexOf('==/UserScript==')), hist]);
    await p.goto(ORIGIN + '/');
    await p.evaluate(() => document.querySelectorAll('.vp-rail, .vp-fab, .vp-gal-btn, .vp-nav-blob').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(3500);
    const read = () => p.evaluate(() => ({
      rows: [...document.querySelectorAll('.vp-stat')].map(r => r.textContent.replace(/\s+/g, ' ').trim()),
      since: (document.querySelector('.vp-stats-since') || {}).textContent || ''
    }));
    const day = await read();
    await p.click('.vp-seg button[data-p="month"]'); await p.waitForTimeout(300);
    const month = await read();
    check(!p.errors.length, 'ошибок нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
    await p.close();
    return { day, month };
  };

  console.log('— обычная история: 35 дней, 20 дней, 26 часов назад');
  let r = await run([{ ago: 35 * D, followers: 200, following: 120, posts: 500, likes: 100 }, { ago: 20 * D, followers: 220, following: 122, posts: 540, likes: 150 },
    { ago: 26 * H, followers: 233, following: 125, posts: 572, likes: 210 }]);
  console.log('—    день:  ' + r.day.rows.join(' | ') + ' · ' + r.day.since);
  console.log('—    месяц: ' + r.month.rows.join(' | ') + ' · ' + r.month.since);
  check(r.day.rows.some(t => /подписчиков\s*\+3$/.test(t)) && r.day.rows.some(t => /лайков\s*\+10$/.test(t)), 'день — от снимка 26 ч назад: подписчиков +3, лайков +10');
  check(!r.day.since, 'день: снимок почти ровно сутки — без подписи «с …»');
  check(r.month.rows.some(t => /подписчиков\s*\+36$/.test(t)), 'месяц — от ближайшего к 30 дням (35 дней): подписчиков +36');
  check(/^с \d\d\.\d\d/.test(r.month.since), `месяц: 35 дней вместо 30 — подпись «${r.month.since}»`);

  console.log('— как у GekataNite: один старый снимок 20 дней назад');
  r = await run([{ ago: 20 * D, followers: 220, following: 122, posts: 540, likes: 150 }]);
  console.log('—    день:  ' + r.day.rows.join(' | ') + ' · ' + r.day.since);
  check(/^с \d\d\.\d\d/.test(r.day.since), `день: данных за сутки нет — видно, с какого числа прирост («${r.day.since}»)`);

  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
