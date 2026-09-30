// Мусор под служебными постами (3.4.0): админка «Мусор под постами» находит то, что мод не читает (обычные комментарии, метки
// владельца от чужих, чужой код галочки, записи лички от неодобренных, дубли), у каждой строки — причина. Сама ничего не
// удаляет: «Удалить», «Всё от автора», «Удалить выбранные» — только по нажатию; «Не мусор» прячет строку навсегда.
// Настоящие записи мода в список не попадают. Кнопки админки нет ни у кого, кроме аккаунта владельца (по id, не по нику).
// Запуск:  node test/junk.js снимок-ленты.html
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8')
  .replace('function generateCode(', 'window.__gc = (...a) => generateCode(...a); function generateCode(');
const OWNER = src.match(/const OWNER_ID = '([^']+)'/)[1];
const post = n => src.match(new RegExp(`const ${n} = '([^']+)'`))[1];
const [VER, MSG, STK, GAMES] = ['VERIFICATION_POST_ID', 'MSG_POST_ID', 'STICKER_POST_ID', 'GAMES_POST_ID'].map(post);
const ORIGIN = 'https://xn--d1ah4a.com';
const U = { owner: { id: OWNER, username: 'NeuroSFW' }, u2: { id: '22222222-2222-4222-8222-222222222222', username: 'bob' }, u3: { id: '33333333-3333-4333-8333-333333333333', username: 'spammer' } };
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
let n = 0;
const C = (author, content) => ({ id: 'c' + (++n), author: U[author], content, createdAt: new Date(Date.now() - n * 60000).toISOString() });
const DB = {}, deleted = [];
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const open = async who => {
    const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
    p.errors = [];
    p.on('pageerror', e => p.errors.push(e.message));
    p.on('dialog', d => d.accept());
    await p.route('**/*', r => {
      const req = r.request(), u = new URL(req.url()), t = req.resourceType();
      if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
      if (['image', 'stylesheet', 'font'].includes(t)) return r.continue();
      if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
      if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: JSON.stringify(U[who]) });
      const pm = u.pathname.match(/^\/api\/posts\/([\w-]+)\/comments$/);
      if (pm && req.method() === 'GET') return r.fulfill({ contentType: 'application/json', headers: { date: new Date().toUTCString() }, body: JSON.stringify({ data: { comments: DB[pm[1]] || [], hasMore: false } }) });
      const dm = u.pathname.match(/^\/api\/comments\/([\w-]+)$/);
      if (dm && req.method() === 'DELETE') {
        deleted.push(dm[1]);
        for (const k in DB) DB[k] = DB[k].filter(c => c.id !== dm[1]);
        return r.fulfill({ status: 204, body: '' });
      }
      if (pm) return r.fulfill({ status: 201, contentType: 'application/json', body: '{"data":{"id":"x"}}' });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(m => {
      const s = { introEnabled: false, introMobile: 'off', backgroundEnabled: false };
      window.GM_getValue = (k, d) => k in s ? s[k] : d; window.GM_setValue = (k, v) => { s[k] = v; };
      window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
      window.GM_info = { script: { version: 't' }, scriptMetaStr: m }; window.unsafeWindow = window;
    }, src.slice(0, src.indexOf('==/UserScript==')));
    await p.goto(ORIGIN + '/');
    await p.evaluate(() => document.querySelectorAll('.vp-fab, .vp-msgs, .vp-rail, .vp-nav-blob').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    return p;
  };
  const S = await open('u3');
  check(!(await S.$('.vp-fab')), 'у чужого аккаунта кнопки админки нет');
  await S.close();
  const Sn = await open('u3');
  await Sn.close();
  const p = await open('owner');
  check(!!(await p.$('.vp-fab')), 'у владельца кнопка админки есть');
  const code2 = await p.evaluate(() => window.__gc('22222222-2222-4222-8222-222222222222') + '1');
  DB[VER] = [C('owner', 'ITDX-V 22222222-2222-4222-8222-222222222222'), C('u2', code2), C('u2', 'ITDXL1 n=white b=- g=11'), C('u2', 'ITDXL1 n=fire b=- g=11'),
    C('u3', 'привет всем, классный мод'), C('u3', 'ITDX-V 33333333-3333-4333-8333-333333333333'), C('u3', 'abcdefgh1')];
  DB[MSG] = [C('u2', 'ITDXK1 aaaa bbbb'), C('u3', 'ITDXK1 cccc dddd'), C('u2', 'ITDXM1 1 bzzzz'), C('owner', 'ITDXK1 eeee ffff')];
  DB[STK] = [C('u2', 'ITDXS 1/1 qqqq'), C('u3', 'спам спам')];
  DB[GAMES] = [C('u2', 'ITDXG2 aaaa'), C('u2', 'ITDXG2 bbbb')];
  await p.click('.vp-fab-btn');
  await p.waitForTimeout(300);
  await p.$eval('.vp-fab [data-act="junk"]', x => x.click());
  await p.waitForFunction(() => { const h = document.querySelector('.vp-junk-panel .vp-admin-head span'); return h && !/ищу/.test(h.textContent); }, null, { timeout: 20000 });
  const rows = await p.$$eval('.vp-junk-row', rs => rs.map(r => ({ id: r.dataset.id, who: r.querySelector('a').textContent, why: r.querySelector('.vp-junk-why').textContent, text: r.querySelector('.vp-junk-text').textContent })));
  rows.forEach(r => console.log(`—    ${r.who}: ${r.why} | ${r.text}`));
  const has = (who, re, text) => rows.some(r => r.who === who && re.test(r.why) && (!text || r.text.includes(text)));
  check(rows.length === 7, `найдено 7 подозрительных (${rows.length})`);
  check(has('@spammer', /Не запись мода/, 'привет всем') && has('@spammer', /Не запись мода/, 'спам спам'), 'обычные комментарии — «не запись мода»');
  check(has('@spammer', /Метка владельца от чужого/), 'метка владельца от чужого');
  check(has('@spammer', /Код галочки не от этого аккаунта/), 'поддельный код галочки');
  check(has('@spammer', /без одобренной галочки/, 'ITDXK1 cccc'), 'ключ лички от неодобренного');
  check(has('@bob', /Дубль/, 'n=fire') && has('@bob', /Дубль/, 'ITDXG2 bbbb'), 'дубли стиля и рекорда');
  check(!rows.some(r => /ITDX-V 2222|ITDXM1|ITDXS 1\/1|eeee|ITDXG2 aaaa|n=white/.test(r.text)) && !rows.some(r => r.text === code2), 'настоящие записи мода в список не попали');
  check(!deleted.length, 'сама ничего не удалила');
  await (await p.$('.vp-junk-panel')).screenshot({ path: path.join(__dirname, 'out', 'junk.png') });
  const gameDup = rows.find(r => r.text.includes('ITDXG2 bbbb')).id, look = rows.find(r => r.text.includes('n=fire')).id;
  await p.$eval(`.vp-junk-row[data-id="${gameDup}"] [data-a="ok"]`, x => x.click());
  await p.$eval(`.vp-junk-row[data-id="${look}"] [data-a="del"]`, x => x.click());
  await p.waitForTimeout(800);
  check(deleted.join() === look, `«Удалить» удалил одну запись (${deleted.join()})`);
  const spam = rows.find(r => r.who === '@spammer').id;
  await p.$eval(`.vp-junk-row[data-id="${spam}"] [data-a="author"]`, x => x.click());
  await p.waitForTimeout(4000);
  check(deleted.length === 6 && rows.filter(r => r.who === '@spammer').every(r => deleted.includes(r.id)), `«Всё от автора» удалил 5 записей spammer (${deleted.length - 1})`);
  check(!deleted.includes(gameDup), '«Не мусор» не удалён');
  await p.$eval('.vp-junk-panel .vp-admin-head button', x => x.click());
  await p.click('.vp-fab-btn');
  await p.waitForTimeout(300);
  await p.$eval('.vp-fab [data-act="junk"]', x => x.click());
  await p.waitForFunction(() => { const h = document.querySelector('.vp-junk-panel .vp-admin-head span'); return h && !/ищу/.test(h.textContent); }, null, { timeout: 20000 });
  const again = await p.$$eval('.vp-junk-row', rs => rs.length);
  check(again === 0, `после уборки и «Не мусор» список пуст (${again})`);
  check(!p.errors.length, 'ошибок нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
  process.exit(fails.length ? 1 : 0);
})();
