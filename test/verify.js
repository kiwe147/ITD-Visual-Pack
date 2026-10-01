// Проверка системы верификации: как распределяются состояния approved/quarantine/none
// в зависимости от комментариев владельца (ITDX-V, ITDX-SEEN, ITDX-C) под VERIFICATION_POST_ID
// и запросов самих людей (ITDX-R, 3.3.7.2). С 3.3.10.4 всё пишется в шифре «ITDXE …» (test/seal.js), старое открытое читается.
// Схема владельца: таймер 3 дня — с момента, как владелец открыл очередь (SEEN); не решил — перерыв 7 дней;
// «Отклонить» — перерыв 7 дней; после перерыва мод человека сам шлёт ITDX-R — снова в очереди.
// Запуск: node test/verify.js путь/к/снимку.html
// Нужен Playwright с Chromium (как в smoke.js). Сайт по сети не нужен — API замокан.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { openText, sealText } = require('./seal');

const snapPath = process.argv[2];
if (!snapPath) { console.error('укажи снимок: node test/verify.js снимок.html'); process.exit(2); }
const snap = fs.readFileSync(snapPath, 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const meta = src.slice(0, src.indexOf('==/UserScript=='));
const info = (snap.match(/<script type="application\/json" id="vp-snapshot-info">([\s\S]*?)<\/script>/) || [])[1];
const pagePath = info ? new URL(JSON.parse(info).url).pathname : '/';
const URL0 = 'https://xn--d1ah4a.com' + pagePath;

const fails = [];
const check = (ok, what) => { console.log((ok ? 'ок   ' : 'ОШИБКА ') + what); if (!ok) fails.push(what); };
const sentRequests = [];

const SECRET_SALT = 'ITD_MOD_2026_SECRET_SALT_NEUROSFW';
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash = hash & hash; }
    return Math.abs(hash).toString(36);
}
const genCode = id => hashString(id + SECRET_SALT).substring(0, 8).padEnd(8, '0');

const OWNER_ID = '5e064703-104d-4794-bc28-9ed6f5847cca';
const ALICE_ID = '11111111-1111-1111-1111-111111111111';
const BOB_ID = '22222222-2222-2222-2222-222222222222';
const CARL_ID = '33333333-3333-3333-3333-333333333333';
const DAVE_ID = '44444444-4444-4444-4444-444444444444';
const EVE_ID = '55555555-5555-5555-5555-555555555555';
const ATTACKER_ID = '66666666-6666-6666-6666-666666666666';
const FRANK_ID = '77777777-7777-7777-7777-777777777777';
const GINA_ID = '88888888-8888-8888-8888-888888888888';
const HANK_ID = '99999999-9999-9999-9999-999999999999';
const IVAN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const D = 24 * 60 * 60;
const nowSec = Math.floor(Date.now() / 1000);
const seenFresh = nowSec - 60 * 60;
const seenOld = nowSec - 5 * D;
const cdFuture = nowSec + 5 * D;
const seenLong = nowSec - 12 * D;
const cdPast = nowSec - 1 * D, seenBeforeReject = nowSec - 9 * D;

const user = (id, username, extra) => ({ id, username, displayName: username, ...extra });
const comments = [
    { id: 'c0', content: genCode(OWNER_ID) + '1', author: user(OWNER_ID, 'NeuroSFW') },
    { id: 'c1', content: genCode(ALICE_ID) + '1', author: user(ALICE_ID, 'Alice', { avatar: '🅰️' }) },
    { id: 'c2', content: genCode(BOB_ID) + '1', author: user(BOB_ID, 'Bob', { avatar: '🅱️' }) },
    { id: 'c3', content: genCode(CARL_ID) + '1', author: user(CARL_ID, 'Carl', { avatar: '🇨' }) },
    { id: 'c4', content: genCode(DAVE_ID) + '1', author: user(DAVE_ID, 'Dave', { avatar: '🅳' }) },
    { id: 'c5', content: genCode(EVE_ID) + '1', author: user(EVE_ID, 'Eve', { avatar: '🇪' }) },
    { id: 'c6', content: genCode(ATTACKER_ID) + '1', author: user(ATTACKER_ID, 'Attacker', { avatar: '😈' }) },
    { id: 'c7', content: genCode(FRANK_ID) + '1', author: user(FRANK_ID, 'Frank') },
    { id: 'c8', content: genCode(GINA_ID) + '1', author: user(GINA_ID, 'Gina') },
    { id: 'c9', content: genCode(HANK_ID) + '1', author: user(HANK_ID, 'Hank') },
    { id: 'c10', content: genCode(IVAN_ID) + '1', author: user(IVAN_ID, 'Ivan') },
    { id: 'm1', content: sealText('ITDX-V ' + ALICE_ID, src), author: { id: OWNER_ID, username: 'NeuroSFW' } },
    {
        id: 'm2', author: { id: OWNER_ID, username: 'NeuroSFW' },
        content: 'ITDX-SEEN ' + [[BOB_ID, seenOld], [CARL_ID, seenFresh], [FRANK_ID, seenLong], [GINA_ID, seenLong],
            [HANK_ID, seenBeforeReject], [IVAN_ID, seenBeforeReject]].map(([i, t]) => i + ':' + t).join(' ')
    },
    { id: 'm3', content: 'ITDX-C ' + [[DAVE_ID, cdFuture], [HANK_ID, cdPast], [IVAN_ID, cdPast]].map(([i, t]) => i + ':' + t).join(' '), author: { id: OWNER_ID, username: 'NeuroSFW' } },
    { id: 'r1', content: 'ITDX-R ' + (nowSec - 1 * D), author: { id: GINA_ID, username: 'Gina' } },
    { id: 'r2', content: 'ITDX-R ' + (nowSec - 12 * 60 * 60), author: { id: HANK_ID, username: 'Hank' } },
    { id: 'f1', content: 'ITDX-V ' + ATTACKER_ID, author: { id: ATTACKER_ID, username: 'Attacker' } },
    { id: 'f2', content: 'ITDX-R ' + nowSec, author: { id: ATTACKER_ID, username: 'Attacker' } },
];

const openAs = async (browser, me, sink) => {
    const p = await browser.newPage({ viewport: { width: 1280, height: 860 } });
    p.errors = [];
    p.on('pageerror', e => p.errors.push(e.message));
    await p.route('**/*', r => {
        const u = r.request().url();
        const m = r.request().method();
        if (u.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
        if (u.endsWith('/api/users/me')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify(me) });
        if (m === 'PATCH' && /\/api\/comments\/[^/?#]+/.test(u)) {
            sink.push({ m, u, raw: r.request().postData() || '', body: JSON.stringify({ content: openText(JSON.parse(r.request().postData() || '{}').content, src) }) });
            return r.fulfill({ contentType: 'application/json', body: '{}' });
        }
        if (m === 'POST' && u.includes('/api/posts/a0d6625a-b3ec-44c4-98da-48422af101d5/comments')) {
            sink.push({ m, u, raw: r.request().postData() || '', body: JSON.stringify({ content: openText(JSON.parse(r.request().postData() || '{}').content, src) }) });
            return r.fulfill({ contentType: 'application/json', body: '{}' });
        }
        if (u.includes('/api/posts/a0d6625a-b3ec-44c4-98da-48422af101d5/comments')) {
            return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ comments, nextCursor: null, hasMore: false }) });
        }
        if (u === URL0) return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
        return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(m => {
        const s = { introEnabled: false, introMobile: 'off' };
        window.GM_getValue = (k, d) => k in s ? s[k] : d;
        window.GM_setValue = (k, v) => { s[k] = v; };
        window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('offline'), 0);
        window.GM_info = { script: { version: 'test' }, scriptMetaStr: m };
        window.unsafeWindow = window;
    }, meta);
    await p.goto(URL0);
    await p.evaluate(() => document.querySelectorAll('.vp-nav-blob, .vp-fab, .vp-fps, .settings-dropdown, .nick-controls-panel, .vp-itdx-btn, .vp-msgs').forEach(e => e.remove()));
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(2500);
    return p;
};

(async () => {
    const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
    const p = await openAs(browser, user(OWNER_ID, 'NeuroSFW'), sentRequests);

    const state = await p.evaluate(() => {
        try {
            const data = JSON.parse(localStorage.getItem('itd_verified_users') || '{}');
            const o = {};
            for (const [k, v] of Object.entries(data)) o[k] = v && v.state;
            return o;
        } catch (e) { return { __error: String(e) }; }
    });
    console.log('Состояния:', JSON.stringify(state));
    console.log('');

    check(state.NeuroSFW === 'approved', 'владелец всегда approved (получено: ' + state.NeuroSFW + ')');
    check(state.Alice === 'approved', 'Alice в ITDX-V → approved (получено: ' + state.Alice + ')');
    check(state.Bob === 'none', 'Bob: увидел 5 дней назад, 3 дня прошли → перерыв 7 дней, none (получено: ' + state.Bob + ')');
    check(state.Carl === 'quarantine', 'Carl: увидел час назад → quarantine, таймер идёт (получено: ' + state.Carl + ')');
    check(state.Dave === 'none', 'Dave: отклонён, перерыв идёт → none (получено: ' + state.Dave + ')');
    check(state.Eve === 'quarantine', 'Eve без меток → quarantine (получено: ' + state.Eve + ')');
    check(state.Attacker === 'quarantine', 'Attacker подделал ITDX-V → quarantine (получено: ' + state.Attacker + ')');
    check(state.Frank === 'none', 'Frank: 3 + 7 дней прошли, запроса нет → none (получено: ' + state.Frank + ')');
    check(state.Gina === 'quarantine', 'Gina: перерыв прошёл, запрос после него → quarantine (получено: ' + state.Gina + ')');
    check(state.Hank === 'quarantine', 'Hank: отказ истёк, запрос после → quarantine (получено: ' + state.Hank + ')');
    check(state.Ivan === 'none', 'Ivan: отказ истёк, запроса нет → none (получено: ' + state.Ivan + ')');

    check(!p.errors.length, 'ошибок на странице нет' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));

    const ivanReqs = [];
    const pi = await openAs(browser, user(IVAN_ID, 'Ivan'), ivanReqs);
    await pi.waitForTimeout(2500);
    const reqs = ivanReqs.filter(x => /ITDX-R \d+/.test(x.body));
    check(reqs.length === 1 && reqs[0].m === 'POST', 'Ivan: перерыв кончился — его мод сам отправил запрос ITDX-R (' + reqs.length + ')');
    check(!pi.errors.length, 'Ivan: ошибок нет' + (pi.errors.length ? ': ' + pi.errors.join(' | ') : ''));
    const bobReqs = [];
    const pb = await openAs(browser, user(BOB_ID, 'Bob'), bobReqs);
    await pb.waitForTimeout(2500);
    check(!bobReqs.some(x => /ITDX-R/.test(x.body)), 'Bob: перерыв ещё идёт — запроса нет');

    await browser.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();
