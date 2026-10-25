        let token = null, tokenTime = 0, tokenPending = null;
        function getAccessToken(force) {
            if (!force && siteAuth.token && siteAuth.at > tokenTime && Date.now() - siteAuth.at < 4 * 60 * 1000) { token = siteAuth.token; tokenTime = siteAuth.at; }
            if (!force && token && Date.now() - tokenTime < 4 * 60 * 1000) return Promise.resolve(token);
            if (!tokenPending) {
                tokenPending = fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
                    .then(r => r.json())
                    .then(d => { token = d.accessToken; tokenTime = Date.now(); return token; })
                    .finally(() => { tokenPending = null; });
            }
            return tokenPending;
        }
        function noteServerTime(res, t0, t1) {
            const d = Date.parse((res && res.headers && res.headers.get('date')) || '');
            if (!d) return;
            const s = noteServerTime.s || (noteServerTime.s = []);
            s.push(d + 500 - (t0 + t1) / 2);
            if (s.length > 9) s.shift();
            const o = s.slice().sort((a, b) => a - b);
            noteServerTime.v = o[o.length >> 1];
        }
        function srvNow() { const v = noteServerTime.v || 0; return Date.now() + (Math.abs(v) > 1500 ? v : 0); }
        function sendComment(postId, content) { return api(`/api/posts/${postId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }); }
        function editComment(id, content) { return api(`/api/comments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }); }
        async function api(path, opts = {}) {
            const call = async t => {
                const t0 = Date.now();
                netNote(path, opts.method, true);
                netMod.skip = true;
                let pr;
                try { pr = fetch(path, { credentials: 'include', ...opts, headers: { ...opts.headers, Authorization: `Bearer ${t}` } }); } finally { netMod.skip = false; }
                const r = await pr;
                noteServerTime(r, t0, Date.now());
                return r;
            };
            let res = await call(await getAccessToken());
            if (res.status === 401) res = await call(await getAccessToken(true));
            apiPause(res);
            return res;
        }

        function hashString(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash = hash & hash;
            }
            return Math.abs(hash).toString(36);
        }
        function generateCode(username) {
            return hashString(username + SECRET_SALT).substring(0, 8).padEnd(8, '0');
        }
        function parseCode(commentText) {
            const match = (commentText || '').match(/^([A-Za-z0-9]{8})(\d+)$/);
            return match ? { code: match[1], flags: match[2] } : null;
        }
        const isModCode = (username, parsed) => parsed && parsed.flags[0] === '1' && parsed.code === generateCode(username);
        const isAuthorCode = (author, parsed) => !!author && !!parsed && parsed.flags[0] === '1'
            && ((author.id && parsed.code === generateCode(author.id)) || (author.username && parsed.code === generateCode(author.username)));

        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const OBF_KEY = new TextEncoder().encode('ITDX|2026|комменты от рандомов|NeuroSFW');
        const obfBytes = (u8, salt) => { const o = new Uint8Array(u8.length); for (let i = 0; i < u8.length; i++) o[i] = u8[i] ^ OBF_KEY[(i + salt) % OBF_KEY.length] ^ ((salt * 31 + i * 7) & 255); return o; };
        const sealB64 = u8 => { let t = ''; for (const x of u8) t += String.fromCharCode(x); return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
        const openB64 = t => Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - t.length % 4) % 4)), c => c.charCodeAt(0));
        function sealText(t) {
            const salt = (Math.random() * 256) | 0, body = obfBytes(new TextEncoder().encode(t), salt), out = new Uint8Array(body.length + 1);
            out[0] = salt; out.set(body, 1);
            return 'ITDXE ' + sealB64(out);
        }
        function openText(content) {
            const t = String(content || '').trim();
            if (!t.startsWith('ITDXE ')) return t;
            try { const b = openB64(t.slice(6)); return new TextDecoder().decode(obfBytes(b.slice(1), b[0])); } catch (e) { return ''; }
        }

        function parseOwnerList(comments, prefix) {
            const map = new Map();
            for (const c of comments) {
                const a = c.author;
                if (!a || a.id !== OWNER_ID) continue;
                const text = openText(c.content);
                if (text !== prefix && !text.startsWith(prefix + ' ')) continue;
                const rest = text.slice(prefix.length).trim();
                if (!rest) continue;
                for (const tok of rest.split(/\s+/)) {
                    const m = tok.match(/^([0-9a-f-]{36})(?::(\d+))?$/i);
                    if (!m || !UUID_RE.test(m[1])) continue;
                    const k = m[1].toLowerCase(), v = m[2] ? +m[2] : 0;
                    map.set(k, Math.max(map.get(k) || 0, v));
                }
            }
            return map;
        }

        function parseRequests(comments) {
            const map = new Map();
            for (const c of comments) {
                const a = c.author, m = openText(c.content).match(/^ITDX-R (\d+)$/);
                if (!a || !a.id || !m) continue;
                const k = String(a.id).toLowerCase();
                map.set(k, Math.max(map.get(k) || 0, +m[1]));
            }
            return map;
        }

        function parseAllOwnerLists(comments) {
            return {
                approved: parseOwnerList(comments, 'ITDX-V'),
                seen: parseOwnerList(comments, 'ITDX-SEEN'),
                cooldown: parseOwnerList(comments, 'ITDX-C'),
                request: parseRequests(comments),
            };
        }

        function verifyTimeline(id, lists, now) {
            const out = (state, extra) => Object.assign({ state, seenCur: 0, needRequest: false, until: 0 }, extra);
            if (!id) return out('quarantine');
            const key = String(id).toLowerCase();
            if (lists.approved.has(key)) return out('approved');
            const cd = (lists.cooldown.get(key) || 0) * 1000;
            const seen = (lists.seen.get(key) || 0) * 1000;
            const req = ((lists.request && lists.request.get(key)) || 0) * 1000;
            const sCur = seen && (!cd || seen > cd - COOLDOWN_MS) ? seen : 0;
            if (cd > now) return out('none', { until: cd });
            let cdEnd = cd;
            if (sCur) {
                if (now < sCur + QUARANTINE_MS) return out('quarantine', { seenCur: sCur, until: sCur + QUARANTINE_MS });
                if (now < sCur + QUARANTINE_MS + COOLDOWN_MS) return out('none', { until: sCur + QUARANTINE_MS + COOLDOWN_MS });
                cdEnd = Math.max(cdEnd, sCur + QUARANTINE_MS + COOLDOWN_MS);
            }
            if (cdEnd && req < cdEnd) return out('none', { needRequest: true });
            return out('quarantine');
        }

        function resolveVerifyState(id, lists, now) {
            return verifyTimeline(id, lists, now).state;
        }

        function verifiedNames() {
            try {
                const all = readVerified();
                return Object.keys(all).filter(n => all[n] && all[n].state === 'approved');
            } catch (e) { return []; }
        }


        let verifyLoad = null, verifyLoadAt = 0;
        async function allComments(postId, maxPages = 30) {
            const all = [];
            let cursor = null;
            for (let page = 0; page < maxPages; page++) {
                const res = await api(`/api/posts/${postId}/comments?limit=100` + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
                if (!res.ok) throw new Error('комментарии: ' + res.status);
                const j = await res.json(), d = j.data || j;
                const list = d.comments || [];
                if (page && list.length && all.some(c => c.id === list[0].id)) break;
                all.push(...list);
                cursor = d.nextCursor || null;
                if (!cursor || !d.hasMore && d.hasMore !== undefined || !list.length) break;
            }
            return all;
        }
        function loadVerificationComments(fresh) {
            if (!fresh && verifyLoad && Date.now() - verifyLoadAt < 90000) return verifyLoad;
            verifyLoadAt = Date.now();
            verifyLoad = allComments(VERIFICATION_POST_ID);
            verifyLoad.catch(() => { verifyLoad = null; });
            return verifyLoad;
        }
        function verifiedInfo(name) {
            try { return readVerified()[name] || null; } catch (e) { return null; }
        }

        async function checkAllComments(fresh) {
            if (isVerifying) return null;
            if (!fresh && Date.now() - (+GM_getValue('vp_ver_at', 0) || 0) < 4 * 60 * 1000) {
                try { const kept = JSON.parse(localStorage.getItem(VERIFICATION_STORAGE_KEY) || 'null'); if (kept) return kept; } catch (e) { }
            }
            isVerifying = true;
            try {
                const comments = await loadVerificationComments(fresh);
                const lists = parseAllOwnerLists(comments);
                const now = Date.now();
                const verifiedUsers = {}, looks = new Map(), lookAt = new Map(), myId = (meData && meData.id) || (siteAuth.me && siteAuth.me.id) || '';
                for (const c of comments) {
                    const a = c.author;
                    if (!a || !a.id || looks.has(a.id)) continue;
                    const l = parseLook(c.content);
                    if (l) { looks.set(a.id, l); if (l.t) lookAt.set(a.id, l.t * 864e5); }
                }
                for (const c of comments) {
                    const name = c.author?.username;
                    const parsed = parseCode(c.content);
                    if (!name || verifiedUsers[name] || !isAuthorCode(c.author, parsed)) continue;
                    const a = c.author, ava = a.avatar && (a.avatar.url || a.avatar) || a.avatarUrl || a.emoji;
                    const seen = Math.max(lookAt.get(a.id) || 0, GONE_FROM);
                    const gone = a.id !== OWNER_ID && a.id !== myId && !(myUsername && name === myUsername) && now - seen > GONE_MS;
                    verifiedUsers[name] = {
                        code: parsed.code, commentId: c.id, hasMod: true, flags: parsed.flags,
                        id: a.id || undefined,
                        displayName: a.displayName || a.display_name || undefined,
                        avatar: typeof ava === 'string' ? ava : undefined,
                        state: a.id === OWNER_ID ? 'approved' : gone ? 'gone' : resolveVerifyState(a.id, lists, now),
                        look: gone ? undefined : looks.get(a.id) || undefined
                    };
                }
                if (JSON.stringify(verifiedUsers) !== localStorage.getItem(VERIFICATION_STORAGE_KEY)) {
                    localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(verifiedUsers));
                }
                GM_setValue('vp_ver_at', Date.now());
                return verifiedUsers;
            } catch (e) {
                console.warn('[ITD VP] верификация:', e);
                logErr('верификация', e);
                return null;
            } finally {
                isVerifying = false;
            }
        }

        async function verifyRequestAgain() {
            const myId = meData && meData.id;
            if (!myId || myId === OWNER_ID) return;
            try {
                const all = await loadVerificationComments();
                if (!verifyTimeline(myId, parseAllOwnerLists(all), Date.now()).needRequest) return;
                const content = sealText('ITDX-R ' + Math.floor(Date.now() / 1000));
                const mine = all.find(c => c.author && c.author.id === myId && /^ITDX-R \d+$/.test(openText(c.content)));
                const res = mine
                    ? await editComment(mine.id, content)
                    : await sendComment(VERIFICATION_POST_ID, content);
                if (res.ok) await checkAllComments(true);
            } catch (e) { logErr('запрос галочки', e); }
        }

        async function verifyMyself() {
            if (!myUsername) return false;
            try {
                const all = await loadVerificationComments();
                const myId = (meData && meData.id) || (all.find(c => c.author?.username === myUsername) || {}).author?.id;
                const mine = all.filter(c => (myId ? c.author?.id === myId : c.author?.username === myUsername) && parseCode(c.content));
                const byId = c => myId && parseCode(c.content).code === generateCode(myId);
                if (!myId && mine.some(c => isModCode(myUsername, parseCode(c.content)))) return true;
                if (mine.some(byId)) return true;
                const code = generateCode(myId || myUsername) + '1';
                const stale = mine.find(c => !isAuthorCode(c.author, parseCode(c.content)));
                const res = stale
                    ? await api(`/api/comments/${stale.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: code }) })
                    : await api(`/api/posts/${VERIFICATION_POST_ID}/comments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: code })
                    });
                if (!res.ok) return false;
                await checkAllComments(true);
                return true;
            } catch (e) {
                console.warn('[ITD VP] верификация себя:', e);
                logErr('верификация себя', e);
                return false;
            }
        }

