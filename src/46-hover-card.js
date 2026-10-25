        const hcCache = new Map();
        let hc = null, hcTimer = 0, hcHide = 0, hcUser = null, hcLink = null;
        const loginOf = href => ((href || '').match(/^\/@([\w.]+)/) || [])[1] || null;
        const HC_TTL = 10 * 60 * 1000;
        function hcStored(key) {
            try { const v = JSON.parse(sessionStorage.getItem('vp-hc:' + key) || 'null'); return v && Date.now() - v.at < HC_TTL ? v.d : null; } catch (e) { return null; }
        }
        function hcStore(key, d) {
            try { if (d) sessionStorage.setItem('vp-hc:' + key, JSON.stringify({ at: Date.now(), d })); } catch (e) { }
            return d;
        }
        function hcData(user, waitMs = 0) {
            const key = user.toLowerCase();
            if (siteUsers.has(key)) return Promise.resolve(siteUsers.get(key));
            if (!hcCache.has(key)) {
                const stored = waitMs ? null : hcStored(key);
                hcCache.set(key, stored ? Promise.resolve(stored) : siteUser(user, waitMs).then(site => site || api('/api/users/' + encodeURIComponent(user))
                    .then(r => r.ok ? r.json() : null)
                    .then(j => j && (j.data || j.user || j))).then(d => hcStore(key, d)).catch(() => null));
            }
            return hcCache.get(key);
        }
        const pick = (...vals) => vals.find(v => v !== undefined && v !== null && v !== '');
        function hcBuild(user, d) {
            const el = document.createElement('div');
            el.className = 'vp-hc';
            const banner = pick(d.banner && (d.banner.url || d.banner), d.bannerUrl, d.banner_url, d.cover && (d.cover.url || d.cover));
            const ava = pick(d.avatar && (d.avatar.url || d.avatar), d.avatarUrl, d.emoji, '👤');
            const followers = pick(d.followersCount, d.followers_count, d.stats && d.stats.followers, typeof d.followers === 'number' ? d.followers : undefined);
            const following = pick(d.followingCount, d.following_count, d.stats && d.stats.following, typeof d.following === 'number' ? d.following : undefined);
            const bio = pick(d.bio, d.description, d.about, '');
            const tint = typeof ava === 'string' && !isUrl(ava) ? emojiTint(ava) : null;
            el.innerHTML = `<div class="vp-hc-banner"></div><div class="vp-hc-body"><div class="vp-hc-ava"></div>
            <div class="vp-hc-name"></div><div class="vp-hc-login"></div><div class="vp-hc-bio"></div><div class="vp-hc-stats"></div></div>`;
            const bn = el.querySelector('.vp-hc-banner');
            if (typeof banner === 'string' && banner) bn.style.backgroundImage = `url("${banner.replace(/"/g, '')}")`;
            else bn.style.background = tint ? `linear-gradient(120deg, rgb(${tint}), rgba(${tint}, .25))` : 'linear-gradient(120deg, var(--vp-accent), transparent)';
            const av = el.querySelector('.vp-hc-ava');
            if (isUrl(ava)) { const img = document.createElement('img'); img.src = ava; av.appendChild(img); } else av.textContent = ava;
            el.querySelector('.vp-hc-name').textContent = pick(d.displayName, d.display_name, d.name, user);
            el.querySelector('.vp-hc-login').textContent = '@' + pick(d.username, user);
            el.querySelector('.vp-hc-bio').textContent = bio;
            const st = el.querySelector('.vp-hc-stats');
            [[followers, 'подписчиков'], [following, 'подписок']].forEach(([n, label]) => {
                if (n === undefined) return;
                const b = document.createElement('span');
                b.innerHTML = '<b></b> ';
                b.firstChild.textContent = n;
                b.append(label);
                st.appendChild(b);
            });
            el.addEventListener('pointerenter', () => clearTimeout(hcHide));
            el.addEventListener('pointerleave', hcScheduleHide);
            el.addEventListener('click', () => { if (hcLink && hcLink.isConnected) hcLink.click(); hcClose(); });
            return el;
        }
        function hcPlace(el, link) {
            const r = link.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
            let top = r.bottom + 10;
            if (top + h > innerHeight - 8) top = Math.max(8, r.top - h - 10);
            el.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
            el.style.top = top + 'px';
        }
        async function hcShow(link, user) {
            const d = await hcData(user);
            if (!d || !link.isConnected || !link.matches(':hover')) return;
            hcClose();
            hc = hcBuild(user, d);
            hcUser = user; hcLink = link;
            document.body.appendChild(hc);
            hcPlace(hc, link);
        }
        function hcClose() { if (hc) { hc.remove(); hc = null; hcUser = null; } }
        function hcScheduleHide() { clearTimeout(hcHide); hcHide = setTimeout(hcClose, 220); }
        document.addEventListener('pointerover', e => {
            const a = e.target.closest && e.target.closest(PROFILE_LINK);
            if (!a || a.closest('nav, .' + SELECTORS.sidebar + ', .vp-hc, .nick-controls-panel')) return;
            const user = loginOf(a.getAttribute('href'));
            if (!user) return;
            clearTimeout(hcHide);
            if (hc && hcUser === user) return;
            clearTimeout(hcTimer);
            hcTimer = setTimeout(() => hcShow(a, user), 450);
        }, true);
        document.addEventListener('pointerout', e => {
            const a = e.target.closest && e.target.closest(PROFILE_LINK);
            if (a && !a.contains(e.relatedTarget)) { clearTimeout(hcTimer); hcScheduleHide(); }
        }, true);
        addEventListener('scroll', () => { clearTimeout(hcTimer); hcClose(); }, { capture: true, passive: true });
        document.addEventListener('click', e => { if (e.target.closest && e.target.closest(PROFILE_LINK)) { clearTimeout(hcTimer); hcClose(); } }, true);
        onDom(function hcLinkGone() { if (hc && !(hcLink && hcLink.isConnected)) hcClose(); });

