        const railStats = rail.querySelector('.vp-stats'), railSince = rail.querySelector('.vp-stats-since');
        const seg = rail.querySelector('.vp-seg');
        const fmtNum = n => n >= 10000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace('.0', '') + 'к' : String(n);
        let statsPeriod = GM_getValue('vp_stats_tab', 'all'), statsNow = null;
        const DAY_MS = 864e5;
        function statsHistory() { try { return JSON.parse(GM_getValue(acctKey('vp_stats_hist'), '[]')); } catch (e) { return []; } }
        const STATS_TAG = 'ITDXT1 ', STATS_F = ['followers', 'following', 'posts', 'likes'];
        function statsPack(hist) {
            const a = [], put = n => { n = Math.max(0, Math.round(n)); while (n > 127) { a.push((n & 127) | 128); n = Math.floor(n / 128); } a.push(n); };
            let hr0 = 0;
            const prev = {};
            for (const h of hist) {
                const hr = Math.round(h.at / 36e5);
                put(hr - hr0); hr0 = hr;
                let mask = 0;
                STATS_F.forEach((f, i) => { if (typeof h[f] === 'number') mask |= 1 << i; });
                a.push(mask);
                STATS_F.forEach((f, i) => { if (!(mask & 1 << i)) return; const d = h[f] - (prev[f] || 0); put(d >= 0 ? d * 2 : -d * 2 - 1); prev[f] = h[f]; });
            }
            return sealB64(new Uint8Array(a));
        }
        function statsUnpack(t) {
            const b = openB64(t), out = [], prev = {};
            let o = 0, hr = 0;
            const get = () => { let n = 0, k = 1; while (o < b.length) { const x = b[o++]; n += (x & 127) * k; if (x < 128) return n; k *= 128; } throw new Error('обрыв'); };
            while (o < b.length) {
                hr += get();
                const mask = b[o++], h = { at: hr * 36e5 };
                STATS_F.forEach((f, i) => { if (!(mask & 1 << i)) return; const z = get(); prev[f] = (prev[f] || 0) + (z % 2 ? -(z + 1) / 2 : z / 2); h[f] = prev[f]; });
                out.push(h);
            }
            return out;
        }
        function statsMerge(a, b) {
            const out = [];
            [...a, ...b].filter(h => h && h.at && Date.now() - h.at < 40 * DAY_MS).sort((x, y) => x.at - y.at).forEach(h => {
                const l = out[out.length - 1];
                if (l && h.at - l.at < 36e5) STATS_F.forEach(f => { if (typeof l[f] !== 'number' && typeof h[f] === 'number') l[f] = h[f]; });
                else out.push({ ...h });
            });
            return out;
        }
        function statsForUpload(hist) {
            const days = new Set(), last = hist[hist.length - 1];
            return hist.filter(h => {
                const d = new Date(h.at).toDateString(), first = !days.has(d);
                days.add(d);
                return first || h === last || Date.now() - h.at < 3 * DAY_MS;
            });
        }
        async function statsSync(hist) {
            const me = (meData && meData.id) || (siteAuth.me && siteAuth.me.id);
            if (!me || Date.now() - (+GM_getValue(acctKey('vp_stats_sync_at'), 0) || 0) < 30 * 60e3) return hist;
            GM_setValue(acctKey('vp_stats_sync_at'), Date.now());
            const mine = (await allComments(STICKER_POST_ID)).filter(c => c.author && c.author.id === me && openText(c.content).startsWith(STATS_TAG));
            const cur = mine[0];
            let remote = [];
            if (cur) try { remote = statsUnpack(openText(cur.content).slice(STATS_TAG.length)); } catch (e) { remote = []; }
            const merged = statsMerge(hist, remote);
            const up = statsForUpload(merged);
            let text = STATS_TAG + statsPack(up);
            while (sealText(text).length > 990 && up.length > 2) { up.splice(1, 1); text = STATS_TAG + statsPack(up); }
            if (!cur || openText(cur.content) !== text) {
                const content = sealText(text);
                const res = cur
                    ? await editComment(cur.id, content)
                    : await sendComment(STICKER_POST_ID, content);
                if (!res.ok) throw new Error('статистика: запись ' + res.status);
            }
            return merged;
        }
        const PERIODS = ['all', 'day', 'week', 'month'], SPAN_D = { day: 1, week: 7, month: 30 };
        const MON = ['янв', 'февр', 'март', 'апр', 'май', 'июнь', 'июль', 'авг', 'сент', 'окт', 'нояб', 'дек'];
        const MONF = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
        var postsPending = null, statsList = null, statsBusy = '';
        function postsCache() { const c = GM_getValue('vp_posts_list', null); return c && c.user === myUsername && Array.isArray(c.list) ? c : null; }
        function postRow(p) { return [p.id, Date.parse(p.createdAt) || 0, +p.likesCount || 0, String(p.content || '').replace(/\s+/g, ' ').trim().slice(0, 48), p.originalPost ? 1 : 0]; }
        function postsLikes(c) { return c ? c.list.reduce((a, r) => a + r[2], 0) : null; }
        function myPostsLoad() {
            const c = postsCache(), now = Date.now();
            if (c && now - c.at < 3 * 3600e3) return Promise.resolve(c);
            if (postsPending) return postsPending;
            if (c && now - (+GM_getValue('vp_posts_lock', 0) || 0) < 3 * 60e3) return Promise.resolve(c);
            GM_setValue('vp_posts_lock', now);
            const deep = !c || now - (c.full || 0) > 24 * 3600e3, stop = now - 30 * 864e5;
            postsPending = (async () => {
                const byId = new Map(deep ? [] : c.list.map(r => [r[0], r]));
                let cursor = null, pages = 0;
                for (;;) {
                    const res = await api(`/api/posts/user/${encodeURIComponent(myUsername)}?limit=50&sort=new` + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
                    if (!res.ok) throw new Error('посты: ' + res.status);
                    const j = await res.json(), d = j.data || j, posts = d.posts || [];
                    keepSitePosts(j);
                    posts.forEach(p => { if (p && p.id) byId.set(p.id, postRow(p)); });
                    cursor = (d.pagination && d.pagination.nextCursor) || d.nextCursor || d.cursor || null;
                    pages++;
                    if (!posts.length || !cursor || pages >= 80) break;
                    if (!deep && Date.parse(posts[posts.length - 1].createdAt) < stop) break;
                    statsBusy = 'Считаю посты… ' + pages * 50;
                    renderStats();
                    await new Promise(r => setTimeout(r, 1200));
                    if (apiPaused()) throw new Error('пауза сайта');
                }
                const out = { user: myUsername, at: Date.now(), full: deep ? Date.now() : c.full, list: [...byId.values()] };
                GM_setValue('vp_posts_list', out);
                return out;
            })().catch(e => { logErr('посты для статистики', e); return c; })
                .finally(() => { postsPending = null; statsBusy = ''; });
            return postsPending;
        }
        function myLikesTotal() { return myPostsLoad().then(postsLikes); }
        async function loadStats() {
            if (!myUsername) return setTimeout(loadStats, 1500);
            const d = meData && typeof meData.followersCount === 'number' ? meData : await hcData(myUsername, 2500);
            const now = {
                followers: pick(d && d.followersCount, d && d.followers_count, d && d.stats && d.stats.followers, d && typeof d.followers === 'number' ? d.followers : undefined),
                following: pick(d && d.followingCount, d && d.following_count, d && d.stats && d.stats.following, d && typeof d.following === 'number' ? d.following : undefined)
            };
            if (d && typeof d.postsCount === 'number') now.posts = d.postsCount;
            const first = postsCache();
            if (first) { statsList = first.list; now.likes = postsLikes(first); statsNow = Object.assign({}, now); renderStats(); }
            const fresh = await myPostsLoad();
            if (fresh) { statsList = fresh.list; now.likes = postsLikes(fresh); }
            const hist = statsHistory().filter(h => Date.now() - h.at < 40 * DAY_MS);
            if (!hist.length || Date.now() - hist[hist.length - 1].at > 6 * 3600e3) hist.push({ at: Date.now(), ...now });
            GM_setValue(acctKey('vp_stats_hist'), JSON.stringify(hist));
            statsNow = now;
            renderStats();
            statsSync(hist).then(m => { if (m !== hist) { GM_setValue(acctKey('vp_stats_hist'), JSON.stringify(m)); renderStats(); } }).catch(e => logErr('статистика: синхронизация', e));
        }
        const fmtStat = n => {
            const a = Math.abs(Math.round(n)), k = (v, u) => v.toFixed(v >= 100 ? 0 : 1).replace('.', ',').replace(/,0$/, '') + ' ' + u;
            return a >= 1e6 ? k(a / 1e6, 'млн') : a >= 10000 ? k(a / 1000, 'тыс.') : String(a).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        };
        const fmtDiff = n => n > 0 ? '+' + fmtStat(n) : n < 0 ? '−' + fmtStat(n) : '0';
        const likesWord = n => { const a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? 'лайков' : b === 1 ? 'лайк' : b > 1 && b < 5 ? 'лайка' : 'лайков'; };
        const railChart = rail.querySelector('.vp-chart'), railBest = rail.querySelector('.vp-best'), railMore = rail.querySelector('.vp-more'), statsCard = rail.querySelector('[data-block="stats"]');
        const paintMore = () => {
            const on = !!GM_getValue('vp_stats_more', false);
            statsCard.classList.toggle('vp-more-on', on);
            railMore.querySelector('span').textContent = on ? 'Свернуть' : 'Подробнее';
            railMore.setAttribute('aria-expanded', on ? 'true' : 'false');
        };
        railMore.addEventListener('click', () => { GM_setValue('vp_stats_more', !GM_getValue('vp_stats_more', false)); paintMore(); });
        paintMore();
        function statsBuckets() {
            const list = statsList || [], now = new Date(), out = [];
            const add = (from, to, label, long) => out.push({ from: from.getTime(), to: to.getTime(), label, long, likes: 0, posts: 0 });
            if (statsPeriod === 'all') {
                const times = list.map(r => r[1]).filter(Boolean);
                if (!times.length) return out;
                const a = new Date(Math.min(...times)), total = (now.getFullYear() - a.getFullYear()) * 12 + now.getMonth() - a.getMonth() + 1;
                for (let i = Math.min(total, 24) - 1; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    add(d, new Date(d.getFullYear(), d.getMonth() + 1, 1), MON[d.getMonth()] + ' ' + d.getFullYear(), MONF[d.getMonth()] + ' ' + d.getFullYear());
                }
            } else if (SPAN_D[statsPeriod] > 1) {
                for (let i = SPAN_D[statsPeriod] - 1; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i), l = d.getDate() + ' ' + MON[d.getMonth()];
                    add(d, new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1), l, l);
                }
            }
            list.forEach(r => { const b = out.find(x => r[1] >= x.from && r[1] < x.to); if (b) { b.likes += r[2]; b.posts++; } });
            return out;
        }
        function paintChart() {
            const b = statsBuckets(), has = b.some(x => x.posts);
            railChart.hidden = !has;
            if (has) {
                const n = b.length, max = Math.max(...b.map(x => x.likes), 1), px = i => n === 1 ? 150 : 18 + i * 264 / (n - 1), py = x => 100 - x.likes / max * 76;
                const pts = b.map((x, i) => px(i).toFixed(1) + ',' + py(x).toFixed(1)).join(' '), dot = n > 14 ? 2.6 : 4;
                const best = b.reduce((m, x) => x.likes > m.likes ? x : m, b[0]), bestText = (statsPeriod === 'all' ? 'Лучший месяц: ' : 'Лучший день: ') + best.long + ', ' + fmtStat(best.likes) + ' ' + likesWord(best.likes);
                railChart.innerHTML = '<div class="vp-chart-h"><b>Лайки</b><span>' + (statsPeriod === 'all' ? 'по месяцам' : 'по дням') + '</span></div><p class="vp-chart-cap"></p>'
                    + '<svg viewBox="0 0 300 130"><defs><linearGradient id="vpChartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--vp-accent, #4aa3ff)" stop-opacity=".35"/><stop offset="1" stop-color="var(--vp-accent, #4aa3ff)" stop-opacity="0"/></linearGradient></defs>'
                    + '<g style="stroke: var(--text-secondary, #888); opacity: .35" stroke-dasharray="3 4"><line x1="10" y1="30" x2="290" y2="30"/><line x1="10" y1="64" x2="290" y2="64"/></g>'
                    + (n > 1 ? '<polygon points="' + px(0).toFixed(1) + ',108 ' + pts + ' ' + px(n - 1).toFixed(1) + ',108" fill="url(#vpChartFill)"/>' : '')
                    + '<line class="vp-chart-hair" y1="10" y2="112" style="stroke: var(--text-secondary, #888)" stroke-dasharray="3 3" visibility="hidden"/>'
                    + '<polyline fill="none" style="stroke: var(--vp-accent, #4aa3ff)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="' + pts + '"/>'
                    + b.map((x, i) => '<circle cx="' + px(i).toFixed(1) + '" cy="' + py(x).toFixed(1) + '" r="' + dot + '" stroke-width="2" style="fill: var(--block-bg, #111); stroke: var(--text-primary, #fff)"/>').join('')
                    + b.map((x, i) => x.posts ? '<circle cx="' + px(i).toFixed(1) + '" cy="122" r="2.6" fill="#3ddc84"/>' : '').join('')
                    + '<rect width="300" height="130" fill="transparent"/></svg><div class="vp-chart-ax"><span></span><span></span></div>';
                const cap = railChart.querySelector('.vp-chart-cap'), svg = railChart.querySelector('svg'), hair = railChart.querySelector('.vp-chart-hair'), ax = railChart.querySelectorAll('.vp-chart-ax span');
                cap.textContent = bestText; ax[0].textContent = b[0].label; ax[1].textContent = b[n - 1].label;
                const at = e => { const r = svg.getBoundingClientRect(), i = n === 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width * 300 - 18) / 264 * (n - 1)))); return i; };
                svg.addEventListener('pointermove', e => {
                    const i = at(e), x = b[i];
                    hair.setAttribute('x1', px(i)); hair.setAttribute('x2', px(i)); hair.setAttribute('visibility', 'visible');
                    cap.textContent = x.long + ': ' + fmtStat(x.likes) + ' ' + likesWord(x.likes) + ', постов ' + x.posts;
                });
                svg.addEventListener('pointerleave', () => { hair.setAttribute('visibility', 'hidden'); cap.textContent = bestText; });
            }
            const from = statsPeriod === 'all' ? 0 : Date.now() - SPAN_D[statsPeriod] * DAY_MS;
            const top = (statsList || []).filter(r => !r[4] && r[1] >= from && r[2] > 0).sort((x, y) => y[2] - x[2]).slice(0, 2);
            railBest.hidden = !top.length;
            railBest.innerHTML = '<div class="vp-best-h"><b>Лучшие посты</b><span>по лайкам</span></div>';
            top.forEach(r => {
                const a = document.createElement('a');
                const path = '/@' + myUsername + '/post/' + r[0];
                a.className = 'vp-best-post'; a.href = path;
                a.innerHTML = '<b></b><small></small>';
                a.firstChild.textContent = r[3] || 'Пост без текста';
                a.lastChild.textContent = fmtStat(r[2]) + ' ' + likesWord(r[2]);
                a.addEventListener('click', e => { e.preventDefault(); history.pushState({}, '', path); dispatchEvent(new PopStateEvent('popstate')); });
                railBest.appendChild(a);
            });
            railMore.hidden = railChart.hidden && railBest.hidden;
        }
        function renderStats() {
            seg.style.setProperty('--vp-i', Math.max(0, PERIODS.indexOf(statsPeriod)));
            seg.querySelectorAll('button').forEach(b => b.classList.toggle('vp-on', b.dataset.p === statsPeriod));
            if (!statsNow) return;
            const all = statsPeriod === 'all', span = (SPAN_D[statsPeriod] || 1) * DAY_MS;
            const hist = statsHistory();
            const now = Date.now();
            const pickBase = list => {
                const old = list.filter(h => now - h.at >= 3600e3);
                if (!old.length) return list[0] || null;
                return old.reduce((b, h) => Math.abs(now - h.at - span) < Math.abs(now - b.at - span) ? h : b);
            };
            const base = all ? statsNow : pickBase(hist) || statsNow;
            const off = !all && base.at && Math.abs(now - base.at - span) > span * 0.1;
            railSince.textContent = statsBusy || (off ? 'с ' + new Date(base.at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
                + ', ' + new Date(base.at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '');
            const rows = [['followers', 'Подписчики'], ['following', 'Подписки'], ['posts', 'Посты'], ['likes', 'Лайки']].filter(([k]) => typeof statsNow[k] === 'number');
            if (!rows.length) { railStats.innerHTML = '<div class="vp-menu-note">Сайт не отдал числа</div>'; return; }
            railStats.innerHTML = '';
            const baseFor = k => typeof base[k] === 'number' ? base : pickBase(hist.filter(h => typeof h[k] === 'number'));
            rows.forEach(([k, label]) => {
                const b = all ? null : baseFor(k);
                const diff = b ? statsNow[k] - b[k] : 0;
                const row = document.createElement('div');
                if (b && b !== base && b.at) row.title = 'изменение с ' + new Date(b.at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
                    + ', ' + new Date(b.at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                row.className = 'vp-stat';
                row.innerHTML = '<span class="vp-stat-val"></span><span class="vp-stat-label"></span><span class="vp-stat-diff"></span>';
                row.children[0].textContent = fmtStat(statsNow[k]);
                row.children[1].textContent = label;
                const df = row.children[2];
                if (!all) {
                    df.textContent = fmtDiff(diff);
                    df.classList.add(diff > 0 ? 'vp-up' : diff < 0 ? 'vp-down' : 'vp-same');
                }
                railStats.appendChild(row);
            });
            paintChart();
        }
        seg.addEventListener('click', e => {
            const b = e.target.closest('button');
            if (!b || b.dataset.p === statsPeriod) return;
            statsPeriod = b.dataset.p;
            GM_setValue('vp_stats_tab', statsPeriod);
            renderStats();
        });
        renderStats();
        loadStats();

