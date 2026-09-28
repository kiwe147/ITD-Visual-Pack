// Проверка системы верификации: как распределяются состояния approved/quarantine/none
// в зависимости от комментариев владельца (ITDX-V, ITDX-SEEN, ITDX-C) под VERIFICATION_POST_ID.
// Запуск: node test/verify.js путь/к/снимку.html
// Нужен Playwright с Chromium (как в smoke.js). Сайт по сети не нужен — API замокан.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

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

const nowSec = Math.floor(Date.now() / 1000);
const seenFresh = nowSec - 60 * 60;
const seenOld = nowSec - 5 * 24 * 60 * 60;
const cdFuture = nowSec + 5 * 24 * 60 * 60;

const comments = [
    { id: 'c0', content: genCode(OWNER_ID) + '1', author: { id: OWNER_ID, username: 'NeuroSFW', displayName: 'NeuroSFW' } },
    { id: 'c1', content: genCode(ALICE_ID) + '1', author: { id: ALICE_ID, username: 'Alice', displayName: 'Alice', avatar: '🅰️' } },
    { id: 'c2', content: genCode(BOB_ID) + '1', author: { id: BOB_ID, username: 'Bob', displayName: 'Bob', avatar: '🅱️' } },
    { id: 'c3', content: genCode(CARL_ID) + '1', author: { id: CARL_ID, username: 'Carl', displayName: 'Carl', avatar: '🇨' } },
    { id: 'c4', content: genCode(DAVE_ID) + '1', author: { id: DAVE_ID, username: 'Dave', displayName: 'Dave', avatar: '🅳' } },
    { id: 'c5', content: genCode(EVE_ID) + '1', author: { id: EVE_ID, username: 'Eve', displayName: 'Eve', avatar: '🇪' } },
    { id: 'c6', content: genCode(ATTACKER_ID) + '1', author: { id: ATTACKER_ID, username: 'Attacker', displayName: 'Attacker', avatar: '😈' } },
    { id: 'm1', content: 'ITDX-V ' + ALICE_ID, author: { id: OWNER_ID, username: 'NeuroSFW' } },
    { id: 'm2', content: 'ITDX-SEEN ' + BOB_ID + ':' + seenOld + ' ' + CARL_ID + ':' + seenFresh, author: { id: OWNER_ID, username: 'NeuroSFW' } },
    { id: 'm3', content: 'ITDX-C ' + DAVE_ID + ':' + cdFuture, author: { id: OWNER_ID, username: 'NeuroSFW' } },
    { id: 'f1', content: 'ITDX-V ' + ATTACKER_ID, author: { id: ATTACKER_ID, username: 'Attacker' } },
];

(async () => {
    const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
    const p = await browser.newPage({ viewport: { width: 1280, height: 860 } });
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));

    await p.route('**/*', r => {
        const u = r.request().url();
        const m = r.request().method();
        if (u.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
        if (u.endsWith('/api/users/me')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: OWNER_ID, username: 'NeuroSFW', displayName: 'NeuroSFW' }) });
        if (m === 'PATCH' && /\/api\/comments\/[^/?#]+/.test(u)) {
            sentRequests.push({ m, u, body: r.request().postData() || '' });
            return r.fulfill({ contentType: 'application/json', body: '{}' });
        }
        if (m === 'POST' && u.includes('/api/posts/a0d6625a-b3ec-44c4-98da-48422af101d5/comments')) {
            sentRequests.push({ m, u, body: r.request().postData() || '' });
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

    const state = await p.evaluate(() => {
        try {
            const data = JSON.parse(localStorage.getItem('itd_verified_users') || '{}');
            const o = {};
            for (const [k, v] of Object.entries(data)) o[k] = v && v.state;
            return o;
        } catch (e) { return { __error: String(e) }; }
    });

    console.log('Состояния:', JSON.stringify(state, null, 2));
    console.log('');

    check(state.Alice === 'approved', 'Alice в ITDX-V → approved          (получено: ' + state.Alice + ')');
    check(state.Bob === 'none', 'Bob в SEEN, ts просрочен → none    (получено: ' + state.Bob + ')');
    check(state.Carl === 'quarantine', 'Carl в SEEN, ts свежий → quarantine(получено: ' + state.Carl + ')');
    check(state.Dave === 'none', 'Dave в CD, ts в будущем → none     (получено: ' + state.Dave + ')');
    check(state.Eve === 'quarantine', 'Eve без меток → quarantine         (получено: ' + state.Eve + ')');
    check(state.Attacker === 'quarantine', 'Attacker подделал ITDX-V → quarantine (получено: ' + state.Attacker + ')');

    await p.click('.vp-fab-btn');
    await p.waitForTimeout(300);
    await p.click('[data-act="verify"]');
    await p.waitForTimeout(2500);

    const queue = await p.$$eval('.vp-verify-row .vp-verify-name', els => els.map(e => e.textContent));
    check(queue.length === 3, 'в очереди 3 человека (Carl, Eve, Attacker) — получено: ' + queue.length + ' [' + queue.join(', ') + ']');
    check(queue.some(n => n === '@Carl'), 'Carl в очереди');
    check(queue.some(n => n === '@Eve'), 'Eve в очереди');
    check(queue.some(n => n === '@Attacker'), 'Attacker в очереди');
    check(!queue.some(n => n === '@Alice'), 'Alice (approved) в очереди нет');
    check(!queue.some(n => n === '@Bob'), 'Bob (cooldown истёк) в очереди нет');
    check(!queue.some(n => n === '@NeuroSFW'), 'владелец сам себя в очередь не ставит');

    const seenReqs = sentRequests.filter(r => /ITDX-SEEN/.test(r.body));
    check(seenReqs.length >= 2, 'ITDX-SEEN отправлен для Eve и Attacker (получено: ' + seenReqs.length + ')');
    check(!seenReqs.some(r => r.body.includes(ALICE_ID)), 'SEEN для Alice не отправлен (в SEEN уже есть)');

    const beforeCount = sentRequests.length;
    const rowCarl = await p.$$eval('.vp-verify-row', rows => rows.findIndex(r => r.textContent.includes('@Carl')));
    await p.$$eval('.vp-verify-row', (rows, i) => rows[i].querySelector('.vp-verify-ok').click(), rowCarl);
    await p.waitForTimeout(800);

    const vReq = sentRequests.slice(beforeCount).find(r => /ITDX-V/.test(r.body));
    check(!!vReq, 'при «Подтвердить» отправлен ITDX-V');
    check(vReq && vReq.body.includes(CARL_ID), 'ITDX-V содержит ID Carl');

    const beforeCount2 = sentRequests.length;
    const rowEve = await p.$$eval('.vp-verify-row', rows => rows.findIndex(r => r.textContent.includes('@Eve')));
    await p.$$eval('.vp-verify-row', (rows, i) => rows[i].querySelector('.vp-verify-no').click(), rowEve);
    await p.waitForTimeout(800);

    const cReq = sentRequests.slice(beforeCount2).find(r => /ITDX-C/.test(r.body));
    check(!!cReq, 'при «Отклонить» отправлен ITDX-C');
    check(cReq && cReq.body.includes(EVE_ID), 'ITDX-C содержит ID Eve');
    const eveTsMatch = cReq && cReq.body.match(new RegExp(EVE_ID + ':(\\d+)'));
    check(!!eveTsMatch && +eveTsMatch[1] > Math.floor(Date.now() / 1000), 'ITDX-C содержит будущий timestamp (кулдаун)');

    check(errors.length === 0, 'ошибок на странице нет' + (errors.length ? ': ' + errors.join(' | ') : ''));

    await browser.close();
    console.log(fails.length ? `\nНе прошло: ${fails.length}` : '\nВсё прошло');
    process.exit(fails.length ? 1 : 0);
})();