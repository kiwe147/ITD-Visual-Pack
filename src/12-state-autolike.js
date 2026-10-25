        const SECRET_SALT = 'ITD_MOD_2026_SECRET_SALT_NEUROSFW';
        const VERIFICATION_STORAGE_KEY = 'itd_verified_users';
        const readVerified = () => { try { return JSON.parse(localStorage.getItem(VERIFICATION_STORAGE_KEY) || '{}') || {}; } catch (e) { return {}; } };
        let isVerifying = false;

        const QUARANTINE_MS = 3 * 24 * 60 * 60 * 1000;
        const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
        const GONE_MS = 90 * 24 * 60 * 60 * 1000;
        const GONE_FROM = Date.UTC(2026, 9, 1);

        let approvedIds = new Set();
        function isApprovedId(id) {
            if (!id) return false;
            const key = String(id).toLowerCase();
            if (key === OWNER_ID.toLowerCase()) return true;
            return approvedIds.has(key);
        }
        function isApprovedAuthor(author) {
            return !!(author && isApprovedId(author.id));
        }
        function acctKey(base) {
            const id = (meData && meData.id) || (siteAuth.me && siteAuth.me.id) || '';
            if (!id) return base;
            const k = base + '@' + id;
            if (GM_getValue(k, undefined) === undefined) {
                const owner = GM_getValue('vp_acct_owner', null);
                if (!owner) GM_setValue('vp_acct_owner', id);
                const legacy = GM_getValue(base, undefined);
                if ((!owner || owner === id) && legacy !== undefined) GM_setValue(k, legacy);
            }
            return k;
        }
        function loadApprovedIds() {
            let all = {};
            try { all = readVerified(); } catch (e) { }
            const s = new Set();
            for (const info of Object.values(all)) if (info && info.state === 'approved' && info.id) s.add(String(info.id).toLowerCase());
            approvedIds = s;
            return s;
        }
        async function ensureApproved() {
            for (let i = 0; i < 40 && isVerifying; i++) await new Promise(r => setTimeout(r, 250));
            if (!localStorage.getItem(VERIFICATION_STORAGE_KEY)) await checkAllComments();
            loadApprovedIds();
        }

        let globalHue = 0;
        let colorDirection = 1;
        let myUsername = null;
        let meData = null;
        let myDisplayName = null;
        let postBorderEnabled = GM_getValue('postBorderEnabled', true);
        let postBlurEnabled = GM_getValue('postBlurEnabled', true);
        let currentStyle = GM_getValue('nickStyle', 'white');
        let backgroundEnabled = GM_getValue('backgroundEnabled', true);
        let backgroundStyle = GM_getValue('backgroundStyle', 'matrix');
        let neonEnabled = GM_getValue('neonEnabled', true);
        document.documentElement.classList.toggle('vp-no-neon', !neonEnabled);
        let nickGlowEnabled = GM_getValue('nickGlowEnabled', true);
        let avatarGlowEnabled = GM_getValue('avatarGlowEnabled', true);
        let antiCensorshipEnabled = GM_getValue('antiCensorshipEnabled', true);
        let showLooks = GM_getValue('showLooks', true);
        document.documentElement.classList.toggle('vp-looks', showLooks);
        let autoLikeUsers = (() => { try { return JSON.parse(GM_getValue('itd_auto_like_users', '{}')) || {}; } catch (e) { return {}; } })();
        let autoLikeEnabled = GM_getValue('autoLikeEnabled', true);

        function myAvatarEl() {
            if (!myUsername) return null;
            const link = document.querySelector(`a[href="/@${myUsername}" i]`);
            if (!link) return null;
            const container = link.querySelector(':scope > div');
            if (container && container.querySelector('span')) return container;
            return link.firstElementChild || link.querySelector('span');
        }
        const AUTO_LIKE_CACHE_KEY = 'itd_auto_like_full_cache';
        const AUTO_LIKE_CACHE_TTL = 10 * 60 * 1000;
        const LIKE_INTERVAL_MIN = 15 * 60 * 1000;
        const LIKE_INTERVAL_MAX = 30 * 60 * 1000;
        const LIKE_DELAY_MIN = 3 * 60 * 1000;
        const LIKE_DELAY_MAX = 10 * 60 * 1000;
        const DAY = 24 * 60 * 60 * 1000;

        function saveAutoLikeUsers() {
            GM_setValue(acctKey('itd_auto_like_users'), JSON.stringify(autoLikeUsers));
        }

        const autoLikeIds = JSON.parse(GM_getValue(AUTO_LIKE_KEY, '{}') || '{}');
        const autoLikeGone = new Set();
        function reloadAutoLike() {
            try { autoLikeUsers = JSON.parse(GM_getValue(acctKey('itd_auto_like_users'), '{}')) || {}; } catch (e) { autoLikeUsers = {}; }
            let ids = {};
            try { ids = JSON.parse(GM_getValue(acctKey(AUTO_LIKE_KEY), '{}') || '{}') || {}; } catch (e) { }
            Object.keys(autoLikeIds).forEach(k => delete autoLikeIds[k]);
            Object.assign(autoLikeIds, ids);
        }
        function rememberAutoLikeId(username) {
            const id = (verifiedInfo(username) || {}).id;
            if (id && autoLikeIds[username] !== id) { autoLikeIds[username] = id; GM_setValue(acctKey(AUTO_LIKE_KEY), JSON.stringify(autoLikeIds)); }
        }
        function renamedAutoLike(username) {
            const id = autoLikeIds[username];
            if (!id) return null;
            let all = {};
            try { all = readVerified(); } catch (e) { }
            const now = Object.keys(all).find(n => all[n] && all[n].id === id && n !== username);
            if (!now) return null;
            autoLikeUsers[now] = true;
            delete autoLikeUsers[username];
            autoLikeIds[now] = id;
            delete autoLikeIds[username];
            saveAutoLikeUsers();
            GM_setValue(acctKey(AUTO_LIKE_KEY), JSON.stringify(autoLikeIds));
            return now;
        }
        async function autoLikeLook(username) {
            if (autoLikeGone.has(username)) return [];
            rememberAutoLikeId(username);
            const res = await api(`/api/posts/user/${username}?limit=7`);
            if (res.status === 404) {
                const now = renamedAutoLike(username);
                if (now) return autoLikeLook(now);
                autoLikeGone.add(username);
                return [];
            }
            if (!res.ok) return [];
            const data = await res.json();
            return (data.data?.posts || data.posts || [])
                .filter(p => p.isLiked === false && Date.now() - new Date(p.createdAt).getTime() <= DAY);
        }

        let autoLikeBusy = false;
        const rndBetween = (a, b) => a + Math.random() * (b - a);
        async function autoLikeTick() {
            if (!autoLikeEnabled || autoLikeBusy || apiPaused() || !leadTab()) return;
            const users = Object.keys(autoLikeUsers).filter(u => autoLikeUsers[u] === true);
            const now = Date.now(), next = GM_getValue('vp_like_next', {}) || {};
            let queue = (GM_getValue('vp_like_queue', []) || []).filter(q => autoLikeUsers[q.u] === true && now - q.at < DAY);
            autoLikeBusy = true;
            try {
                const due = queue.filter(q => q.at <= now).sort((x, y) => x.at - y.at)[0];
                if (due) {
                    const like = await api(`/api/posts/${due.id}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                    if (like.status !== 429) queue = queue.filter(q => q !== due);
                } else {
                    users.forEach(u => { if (!next[u]) next[u] = now + rndBetween(30e3, 5 * 60e3); });
                    const u = users.filter(x => next[x] <= now).sort((x, y) => next[x] - next[y])[0];
                    if (u) next[u] = now + rndBetween(LIKE_INTERVAL_MIN, LIKE_INTERVAL_MAX);
                    GM_setValue('vp_like_next', Object.fromEntries(users.map(x => [x, next[x]])));
                    if (u) {
                        for (const p of await autoLikeLook(u)) if (!queue.some(q => q.id === p.id)) queue.push({ id: p.id, u, at: Date.now() + rndBetween(LIKE_DELAY_MIN, LIKE_DELAY_MAX) });
                    }
                }
            } catch (e) { console.warn('[ITD VP] автолайк', e); logErr('автолайк', e); } finally {
                GM_setValue('vp_like_queue', queue);
                autoLikeBusy = false;
            }
        }
        function scheduleAutoLike() {
            sched.add('autolike', autoLikeTick, { every: 20000, net: true });
        }

        async function fetchAutoLikeUsers() {
            try {
                const c = JSON.parse(localStorage.getItem(AUTO_LIKE_CACHE_KEY) || 'null');
                if (c && Date.now() - c.timestamp <= AUTO_LIKE_CACHE_TTL) return c.usersData;
            } catch (e) { }

            const usernames = verifiedNames();
            if (!usernames.includes('NeuroSFW')) usernames.push('NeuroSFW');

            const usersData = {};
            await Promise.all(usernames.map(async username => {
                const v = verifiedInfo(username);
                if (v && (v.displayName || v.avatar)) { usersData[username] = { username, displayName: v.displayName, avatar: v.avatar }; return; }
                try {
                    const res = await api(`/api/users/${username}`);
                    if (res.ok) usersData[username] = await res.json();
                } catch (e) { }
            }));
            if (Object.keys(usersData).length) {
                try { localStorage.setItem(AUTO_LIKE_CACHE_KEY, JSON.stringify({ usersData, timestamp: Date.now() })); } catch (e) { }
            }
            return usersData;
        }

