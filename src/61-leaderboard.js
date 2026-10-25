        const LB_KEYS = { snake: 's', mines: 'm', tetris: 't' };
        const LB_KEY = 'ITDX-LB-KEY-2026-Kiwe-NSFW-Visual-Pack-games';
        function lbEncode(text) {
            const b = new TextEncoder().encode(text), k = new TextEncoder().encode(LB_KEY);
            const o = new Uint8Array(b.length);
            for (let i = 0; i < b.length; i++) o[i] = b[i] ^ k[i % k.length];
            let s = '';
            for (const byte of o) s += String.fromCharCode(byte);
            return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }
        function lbDecode(b64) {
            try {
                const s = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - b64.length % 4) % 4));
                const b = Uint8Array.from(s, c => c.charCodeAt(0));
                const k = new TextEncoder().encode(LB_KEY);
                const o = new Uint8Array(b.length);
                for (let i = 0; i < b.length; i++) o[i] = b[i] ^ k[i % k.length];
                return new TextDecoder().decode(o);
            } catch (e) { return null; }
        }
        const parseLB = (t, legacy) => {
            const s = String(t || '').trim();
            let body = s;
            if (s.startsWith('ITDXG2 ')) {
                const d = lbDecode(s.slice(7));
                if (!d) return null;
                body = d;
            } else if (!legacy) return null;
            const m = body.match(/^ITDXG((?:\s+[smt]\d+)*)$/);
            if (!m) return null;
            const o = {};
            for (const [, k, v] of m[1].matchAll(/([smt])(\d+)/g)) o[k] = +v;
            return o;
        };
        const lbText = o => {
            const parts = ['s', 'm', 't'].filter(k => o[k]).map(k => ` ${k}${o[k]}`);
            if (!parts.length) return null;
            return 'ITDXG2 ' + lbEncode('ITDXG' + parts.join(''));
        };
        const LB_VOID = 'ITDX-LBX';
        function lbVoids(all) {
            const out = new Set();
            for (const c of all || []) {
                if (!c.author || c.author.id !== OWNER_ID) continue;
                const t = openText(c.content);
                if (!t.startsWith(LB_VOID + ' ')) continue;
                for (const tok of t.slice(LB_VOID.length + 1).split(/\s+/)) { const m = tok.match(/^([0-9a-f-]{36}):([smt]):(\d+)(?::([\w-]{1,12}))?$/i); if (m) out.add(`${m[1].toLowerCase()}:${m[2]}:${m[3]}:${m[4] || '-'}`); }
            }
            return out;
        }
        const lbIsVoid = (voids, uid, k, v, tag) => !!(uid && v && voids.has(`${String(uid).toLowerCase()}:${k}:${v}:${tag || '-'}`));
        const repTag = (rp, v) => rp && rp.n && rp.parts[0] && rp.score === v ? rp.parts[0].slice(0, 10) : '-';
        function lbDropVoid(voids, o, all) {
            const me = meData && meData.id, r = Object.assign({}, o), mine = lbReplays(all).get(me) || {};
            for (const k of ['s', 'm', 't']) if (lbIsVoid(voids, me, k, r[k], repTag(mine[k], r[k]))) r[k] = 0;
            return r;
        }
        function lbResetVoidLocal(voids) {
            const me = meData && meData.id, loc = lbLocal();
            let hit = false;
            for (const k of ['s', 'm', 't']) if (lbIsVoid(voids, me, k, loc[k], (r => r && r.tag && r.score === loc[k] ? r.tag : '-')(GM_getValue(acctKey('vp_rep_' + k), null)))) { GM_setValue(acctKey(LB_LOCAL_KEYS[k]), 0); GM_setValue(acctKey('vp_rep_' + k), null); hit = true; }
            if (hit) renderGamesMenu();
            return hit;
        }
        async function repZip(u8, back) {
            const st = new Blob([u8]).stream().pipeThrough(back ? new DecompressionStream('deflate-raw') : new CompressionStream('deflate-raw'));
            return new Uint8Array(await new Response(st).arrayBuffer());
        }
        function repPack(g, r) {
            const out = [], vi = n => { n = Math.max(0, Math.round(n)); while (n > 127) { out.push((n % 128) | 128); n = Math.floor(n / 128); } out.push(n); };
            out.push(1, 'smt'.indexOf(g)); vi(r.score); vi(r.seed); vi(r.ev.length);
            let p = 0;
            for (const e of r.ev) {
                const d = Math.max(0, e[0] - p);
                p = Math.max(p, e[0]);
                if (g === 's') vi(d * 4 + e[1]); else if (g === 'm') { vi(d); out.push(e[1] * 128 + e[2]); } else vi(d * 8 + e[1]);
            }
            return new Uint8Array(out);
        }
        async function ownerSeal(u8) {
            const S = crypto.subtle, pub = await S.importKey('raw', openB64(OWNER_PUB), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
            const eph = await S.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
            const bits = await S.deriveBits({ name: 'ECDH', public: pub }, eph.privateKey, 256);
            const hk = await S.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
            const aes = await S.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: new TextEncoder().encode('ITDX owner') }, hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
            const iv = crypto.getRandomValues(new Uint8Array(12)), ct = new Uint8Array(await S.encrypt({ name: 'AES-GCM', iv }, aes, u8));
            const raw = new Uint8Array(await S.exportKey('raw', eph.publicKey)), out = new Uint8Array(raw.length + 12 + ct.length);
            out.set(raw); out.set(iv, raw.length); out.set(ct, raw.length + 12);
            return sealB64(out);
        }
        async function repEncode(g, r) {
            return ownerSeal(await repZip(repPack(g, r)));
        }
        const REP_RE = /^ITDXP[12] ([smt]) (\d+)\/(\d+) (?:(\d+) )?(\S+)$/;
        function lbReplays(all) {
            const out = new Map();
            for (const c of all || []) {
                const x = String(c.content || '').trim().match(REP_RE);
                if (!x || !c.author || !+x[3]) continue;
                const u = out.get(c.author.id) || {};
                out.set(c.author.id, u);
                const r = u[x[1]] || (u[x[1]] = { n: +x[3], parts: [], score: x[4] ? +x[4] : null, p: +String(c.content).trim()[5] });
                if (r.n === +x[3]) r.parts[+x[2] - 1] = x[5];
            }
            return out;
        }
        async function lbRepUpload(all) {
            for (const g of ['s', 'm', 't']) {
                const r = GM_getValue(acctKey('vp_rep_' + g), null), best = lbLocal()[g];
                if (!r || r.up || r.score !== best || !Array.isArray(r.ev)) continue;
                const b64 = await repEncode(g, r), parts = [];
                for (let i = 0; i < b64.length; i += 900) parts.push(b64.slice(i, i + 900));
                if (parts.length <= 12) {
                    const mine = all.filter(c => lbIsMe(c.author) && new RegExp(`^ITDXP[12] ${g} `).test(String(c.content || '').trim()));
                    for (let i = 0; i < Math.max(parts.length, mine.length); i++) {
                        const text = i < parts.length ? `ITDXP2 ${g} ${i + 1}/${parts.length} ${r.score} ${parts[i]}` : `ITDXP2 ${g} 0/0 -`, c = mine[i];
                        if (c && String(c.content).trim() === text) continue;
                        const res = c ? await editComment(c.id, text) : await sendComment(GAMES_POST_ID, text);
                        if (!res.ok) throw new Error('повтор: ' + res.status);
                    }
                }
                r.up = true;
                if (parts.length <= 12) r.tag = parts[0].slice(0, 10);
                GM_setValue(acctKey('vp_rep_' + g), r);
            }
        }
        const lbBetter = (k, a, b) => !a ? b : !b ? a : k === 'm' ? Math.min(a, b) : Math.max(a, b);
        const lbLocal = () => ({ s: +GM_getValue(acctKey('vp_snake_best'), 0) || 0, m: +GM_getValue(acctKey('vp_mines_best'), 0) || 0, t: +GM_getValue(acctKey('vp_tetris_best'), 0) || 0 });
        const LB_LOCAL_KEYS = { s: 'vp_snake_best', m: 'vp_mines_best', t: 'vp_tetris_best' };
        function lbMergeIntoLocal(remote) {
            if (!remote) return;
            for (const k of ['s', 'm', 't']) {
                const rv = +remote[k] || 0;
                if (!rv) continue;
                const lv = +GM_getValue(acctKey(LB_LOCAL_KEYS[k]), 0) || 0;
                const best = lbBetter(k, rv, lv);
                if (best && best !== lv) GM_setValue(acctKey(LB_LOCAL_KEYS[k]), best);
            }
        }
        async function lbSyncFromServer() {
            if (!myUsername) return;
            try {
                const all = await lbComments();
                const voids = lbVoids(all), hit = lbResetVoidLocal(voids);
                const mine = all.find(c => lbIsMe(c.author) && parseLB(c.content, true));
                const raw = mine && parseLB(mine.content, true), remote = raw && lbDropVoid(voids, raw, all);
                if (mine) lbMergeIntoLocal(remote);
                if (mine && (hit || !String(mine.content).trim().startsWith('ITDXG2 ') || ['s', 'm', 't'].some(k => (raw[k] || 0) !== (remote[k] || 0)))) gamesRecord();
                renderGamesMenu();
            } catch (e) { }
        }
        const lbIsMe = a => !!a && ((meData && meData.id && a.id === meData.id) || (!!myUsername && a.username === myUsername));
        let lbLoad = null, lbAt = 0, lbBusy = false, lbT = 0;
        function lbComments(fresh) {
            if (!fresh && lbLoad && Date.now() - lbAt < 60000) return lbLoad;
            lbAt = Date.now();
            lbLoad = allComments(GAMES_POST_ID, 5);
            lbLoad.catch(() => { lbLoad = null; });
            return lbLoad;
        }
        async function lbSubmit() {
            if (!myUsername || lbBusy) return;
            lbBusy = true;
            try {
                const all = await lbComments(true);
                const voids = lbVoids(all);
                lbResetVoidLocal(voids);
                const mine = all.find(c => lbIsMe(c.author) && parseLB(c.content, true));
                const was = mine ? lbDropVoid(voids, parseLB(mine.content, true), all) : {}, loc = lbLocal(), now = {};
                for (const k of ['s', 'm', 't']) {
                    now[k] = lbBetter(k, was[k], loc[k]);
                    if (now[k] && now[k] !== loc[k]) GM_setValue(acctKey(LB_LOCAL_KEYS[k]), now[k]);
                }
                const text = lbText(now);
                if (text && !(mine && String(mine.content).trim() === text)) {
                    const res = mine
                        ? await api(`/api/comments/${mine.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }) })
                        : await api(`/api/posts/${GAMES_POST_ID}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }) });
                    if (!res.ok) throw new Error('лидерборд: ' + res.status);
                }
                await lbRepUpload(all);
                lbLoad = null;
                if (gw.el) lbRender();
            } catch (e) { logErr('лидерборд', e); } finally { lbBusy = false; }
        }
        function gamesRecord() { clearTimeout(lbT); lbT = setTimeout(lbSubmit, 2000); }
        function lbRender() {
            const view = gw.el && gw.el.querySelector('.vp-games-leads');
            if (view) GAMES.forEach(g => lbRenderInto(view.querySelector(`[data-lead="${g.id}"]`), g.id));
        }
        async function lbRenderInto(box, id) {
            if (!box) return;
            const k = LB_KEYS[id];
            box.innerHTML = `<div class="vp-games-lead-t"></div><div class="vp-games-hint">Загрузка…</div>`;
            box.firstChild.textContent = GAMES.find(g => g.id === id).name;
            let all;
            try { all = await lbComments(); } catch (e) { box.lastElementChild.textContent = 'Не загрузилось'; return; }
            if (!box.isConnected) return;
            loadApprovedIds();
            const best = new Map(), voids = lbVoids(all), reps = lbReplays(all);
            for (const c of all) {
                const a = c.author, o = a && parseLB(c.content, lbIsMe(a));
                if (!o || !o[k] || lbIsVoid(voids, a.id, k, o[k], repTag((reps.get(a && a.id) || {})[k], o[k]))) continue;
                if (!lbIsMe(a) && !isApprovedAuthor(a)) continue;
                const key = a.id || a.username, cur = best.get(key);
                if (!cur || lbBetter(k, cur.v, o[k]) !== cur.v) best.set(key, { v: o[k], name: a.displayName || a.username || '?', me: lbIsMe(a) });
            }
            const list = [...best.values()].sort((x, y) => k === 'm' ? x.v - y.v : y.v - x.v);
            const fmt = v => k === 'm' ? `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` : String(v);
            const body = box.lastElementChild;
            if (!list.length) { body.textContent = 'Пока пусто — стань первым'; return; }
            body.className = 'vp-games-lead-list';
            body.textContent = '';
            list.forEach((r, i) => {
                const row = document.createElement('div');
                row.className = 'vp-games-lead-row' + (r.me ? ' vp-me' : '');
                row.innerHTML = '<span></span><span></span><b></b>';
                row.children[0].textContent = i + 1; row.children[1].textContent = r.name; row.children[2].textContent = fmt(r.v);
                body.appendChild(row);
            });
        }

        function leadersView() {
            const el = document.createElement('div');
            el.className = 'vp-games-leads';
            el.innerHTML = GAMES.map(g => `<section data-lead="${g.id}"></section>`).join('');
            return { el, key() { }, pause() { }, resize() { }, destroy() { } };
        }
        const GAME_MAKERS = { snake: snakeGame, mines: minesGame, tetris: tetrisGame, lead: leadersView };
        function showGame(id) {
            if (!gw.el) return;
            if (gw.cur) gw.cur.destroy();
            gw.id = id; GM_setValue('vp_game_last', id);
            gw.el.querySelectorAll('.vp-games-tab').forEach(t => t.classList.toggle('vp-on', t.dataset.g === id));
            const score = gw.el.querySelector('.vp-games-score'), body = gw.el.querySelector('.vp-games-body');
            score.textContent = '';
            gw.cur = GAME_MAKERS[id](text => { score.textContent = text; });
            body.replaceChildren(gw.cur.el);
            gw.cur.resize();
            if (id === 'lead') lbRender();
            const f = gw.cur.el.querySelector('[tabindex]');
            if (f) f.focus({ preventScroll: true });
        }
        function openGames(id) {
            if (gw.el) return showGame(id);
            const el = document.createElement('div');
            el.className = 'vp-games';
            el.innerHTML = `<div class="vp-games-win" role="dialog" aria-label="Игры"><div class="vp-games-head"><div class="vp-games-tabs">${GAMES.map(g => `<button type="button" class="vp-games-tab" data-g="${g.id}">${g.name}</button>`).join('')}<button type="button" class="vp-games-tab" data-g="lead">🏆 Топ задротов</button></div>
            <span class="vp-games-score"></span><button type="button" class="vp-games-x" aria-label="Закрыть">${svgIcon('<path d="M6 6l12 12M18 6 6 18"/>', 18)}</button></div><div class="vp-games-body"></div></div>`;
            el.addEventListener('click', e => { if (e.target === el) closeGames(); });
            const still = e => {
                const area = e.target.closest && e.target.closest('.vp-games-lead-list, .vp-games-leads');
                if (!area || area.scrollHeight <= area.clientHeight) e.preventDefault();
            };
            el.addEventListener('wheel', still, { passive: false });
            el.addEventListener('touchmove', still, { passive: false });
            el.querySelector('.vp-games-x').addEventListener('click', closeGames);
            el.querySelectorAll('.vp-games-tab').forEach(t => t.addEventListener('click', () => showGame(t.dataset.g)));
            document.body.appendChild(el);
            gw.el = el;
            showGame(id || gw.id);
            if (!gw.synced) { gw.synced = true; gamesRecord(); }
            stackEnter('vpGames');
        }
        function closeGames(fromHistory) {
            if (!gw.el) return;
            if (gw.cur) { gw.cur.pause(); gw.cur.destroy(); gw.cur = null; }
            gw.el.remove(); gw.el = null;
            if (fromHistory !== true) stackLeave('vpGames');
        }
        addEventListener('popstate', () => { if (gw.el && !overlayAt('vpGames')) closeGames(true); });
        addEventListener('keydown', e => {
            if (!gw.el || !gw.cur) return;
            if (e.key === 'Escape') { e.preventDefault(); closeGames(); return; }
            if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
            gw.cur.key(e);
            if (['PageUp', 'PageDown', 'Home', 'End', ' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
        }, true);
        addEventListener('resize', () => { if (gw.cur) gw.cur.resize(); });
        document.addEventListener('visibilitychange', () => { if (document.hidden && gw.cur) gw.cur.pause(); });
        renderGamesMenu();

        placeRail();
        if (palsOn) palsApply();

