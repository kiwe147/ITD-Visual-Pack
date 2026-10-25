        const railClub = rail.querySelector('.vp-club');
        let clubShown = '';
        function openProfile(login) {
            history.pushState({}, '', '/@' + login);
            dispatchEvent(new PopStateEvent('popstate'));
        }
        function paintClub() {
            railClub.querySelectorAll('.vp-club-row').forEach(row => {
                const n = row.dataset.login, name = row.querySelector('.vp-club-name'), av = row.querySelector('.vp-club-ava');
                if (n === myUsername) { name.classList.add('vp-my-nick', 'vp-my-nick-box'); av.classList.add('my-avatar-glow'); return; }
                const look = (verifiedInfo(n) || {}).look;
                const put = (el, attr, val) => { if (val) { if (el.getAttribute(attr) !== val) el.setAttribute(attr, val); } else el.removeAttribute(attr); };
                put(name, 'data-vp-look', look && look.n);
                put(name, 'data-vp-look-glow', look && look.g[0] === '1' && look.n);
                put(av, 'data-vp-look-av', look && look.g[1] === '1' && look.n);
            });
        }
        async function renderClub() {
            const names = verifiedNames();
            if (myUsername && !names.some(n => n.toLowerCase() === myUsername.toLowerCase())) names.push(myUsername);
            const key = names.sort().join();
            if (key === clubShown) { paintClub(); return; }
            clubShown = key;
            rail.querySelector('.vp-club-count').textContent = names.length || '';
            if (!names.length) { railClub.innerHTML = '<div class="vp-menu-note">Пока никого</div>'; return; }
            const people = await Promise.all(names.map(async n => {
                const v = verifiedInfo(n);
                return { n, d: v && (v.displayName || v.avatar) ? v : n === myUsername && meData ? meData : await hcData(n) };
            }));
            railClub.innerHTML = '';
            people.sort((a, b) => (a.n === myUsername ? -1 : b.n === myUsername ? 1 : a.n.localeCompare(b.n))).forEach(({ n, d }) => {
                const row = document.createElement('div');
                row.className = 'vp-club-row';
                row.dataset.login = n;
                row.innerHTML = '<div class="vp-club-ava"></div><div class="vp-club-names"><span class="vp-club-name"></span><span class="vp-club-login"></span></div>';
                const ava = pick(d && d.avatar && (d.avatar.url || d.avatar), d && d.avatarUrl, '👤');
                const av = row.firstChild;
                if (isUrl(ava)) { const img = document.createElement('img'); img.src = ava; av.appendChild(img); } else av.textContent = ava;
                row.querySelector('.vp-club-name').textContent = pick(d && d.displayName, d && d.display_name, n) + (n === myUsername ? ' (ты)' : '');
                row.querySelector('.vp-club-login').textContent = '@' + n;
                row.onclick = () => openProfile(n);
                railClub.appendChild(row);
            });
            paintClub();
            paintOnline();
        }
        const CLUB_TTL = 5 * 60 * 1000, CLUB_OFF_TTL = 20 * 60 * 1000, CLUB_GAP = 30e3, CLUB_LIVE = 30 * 60e3;
        const clubOnline = new Map();
        function clubOnlineLoad() {
            const s = GM_getValue('vp_club_online', {}) || {};
            for (const n in s) if (s[n] && (!clubOnline.has(n) || clubOnline.get(n).at < s[n].at)) clubOnline.set(n, s[n]);
        }
        clubOnlineLoad();
        const clubSeenText = t => {
            const d = new Date(t);
            if (!t || isNaN(d)) return '';
            const h = d.toTimeString().slice(0, 5);
            return 'был(а) в сети ' + (d.toDateString() === new Date().toDateString() ? 'в ' + h : `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')} в ${h}`);
        };
        function paintOnline() {
            const rows = [...railClub.querySelectorAll('.vp-club-row')];
            if (!rows.length) return;
            let on = 0;
            rows.forEach(row => {
                const n = row.dataset.login, st = n === myUsername ? { on: true } : clubOnline.get(n);
                const live = !!(st && st.on && (n === myUsername || Date.now() - (st.at || 0) < CLUB_LIVE)), tip = st ? (live ? 'в сети' : clubSeenText(st.seen)) : '';
                if (live) on++;
                if (live !== row.hasAttribute('data-online')) row.toggleAttribute('data-online', live);
                if (row.title !== tip) row.title = tip;
            });
            const me = r => r.dataset.login === myUsername, live = r => r.hasAttribute('data-online');
            const order = rows.slice().sort((a, b) => me(b) - me(a) || live(b) - live(a) || a.dataset.login.localeCompare(b.dataset.login));
            if (order.some((r, i) => r !== rows[i])) order.forEach(r => railClub.appendChild(r));
            const cnt = rail.querySelector('.vp-club-count'), total = rows.length;
            const others = on - (rows.some(me) ? 1 : 0);
            const html = others > 0 ? `<span class="vp-club-dot"></span>${on} · ${total}` : String(total), tip = others > 0 ? `В сети: ${on} из ${total}` : '';
            if (cnt.innerHTML !== html) cnt.innerHTML = html;
            if (cnt.title !== tip) cnt.title = tip;
        }
        let clubPolling = false, clubPolledAt = 0, clubFirst = true;
        async function clubCheck(n) {
            const r = await api('/api/users/' + encodeURIComponent(n)).catch(() => null);
            if (!r || !r.ok) return;
            const j = await r.json().catch(() => null), d = j && (j.data || j.user || j);
            if (d && typeof d === 'object') clubOnline.set(n, { on: !!d.online, seen: d.lastSeen || null, at: Date.now() });
        }
        async function clubPollOnline() {
            if (clubPolling || document.hidden || apiPaused() || !railClub.isConnected || !railClub.getClientRects().length) return;
            clubOnlineLoad();
            const box = railClub.getBoundingClientRect(), now = Date.now();
            const seen = r => { const q = r.getBoundingClientRect(); return q.bottom > box.top && q.top < box.bottom; };
            const age = n => now - ((clubOnline.get(n) || {}).at || 0), late = n => age(n) - ((clubOnline.get(n) || {}).on === false ? CLUB_OFF_TTL : CLUB_TTL);
            const due = [...railClub.querySelectorAll('.vp-club-row')].filter(r => r.dataset.login !== myUsername)
                .map(r => ({ n: r.dataset.login, v: seen(r) })).filter(x => late(x.n) > 0).sort((a, b) => b.v - a.v || late(b.n) - late(a.n));
            if (!due.length) return;
            const fast = due.filter(x => x.v).slice(0, 8).map(x => x.n);
            if (!fast.length && now < (+GM_getValue('vp_club_next', 0) || 0)) return;
            clubPolling = true; clubPolledAt = now; clubFirst = false;
            try {
                for (let i = 0; i < fast.length; i += 4) {
                    if (i) { paintOnline(); await new Promise(r => setTimeout(r, 2000)); if (document.hidden || apiPaused()) break; }
                    await Promise.all(fast.slice(i, i + 4).map(clubCheck));
                }
                if (!fast.length) await clubCheck(due[0].n);
                GM_setValue('vp_club_next', Date.now() + CLUB_GAP);
            } finally {
                paintOnline();
                clubPolling = false;
                const keep = {};
                for (const [n, v] of clubOnline) if (Date.now() - v.at < 24 * 3600e3) keep[n] = v;
                GM_setValue('vp_club_online', keep);
            }
        }
        const clubTick = () => Promise.resolve(renderClub()).then(() => clubPollOnline()).catch(e => logErr('клуб: в сети', e));
        setTimeout(() => Promise.resolve(renderClub()).catch(e => logErr('клуб', e)), 2500);
        setTimeout(() => clubPollOnline(), 14000);
        sched.add('clubRender', clubTick, { every: 60 * 1000, net: true });
        sched.add('clubPoll', () => clubPollOnline(), { every: 5000, net: true });
        let clubScrollT = 0;
        railClub.addEventListener('scroll', () => { clearTimeout(clubScrollT); clubScrollT = setTimeout(() => clubPollOnline(), 400); }, { passive: true });
        document.addEventListener('visibilitychange', () => { if (!document.hidden) clubPollOnline(); });
        new IntersectionObserver(es => { if (es.some(e => e.isIntersecting) && Date.now() - clubPolledAt > 30e3) clubPollOnline(); }).observe(railClub);

