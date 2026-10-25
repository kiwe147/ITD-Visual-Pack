        function framePages() {
            document.querySelectorAll('iframe').forEach(f => {
                const r = f.getBoundingClientRect();
                const big = r.width >= innerWidth * 0.6 && r.height >= innerHeight * 0.6;
                f.classList.toggle('vp-page-frame', big);
                if (!big || f._vpClear) return;
                const clear = () => {
                    try {
                        const d = f.contentDocument;
                        if (!d || !d.head || d.getElementById('vp-frame-clear')) return;
                        const st = d.createElement('style');
                        st.id = 'vp-frame-clear';
                        st.textContent = ':root, html, body, #root, #root > div { --bg-primary: transparent !important; background: transparent !important; }';
                        d.head.appendChild(st);
                        f._vpClear = true;
                        if (d.URL !== 'about:blank') f.classList.add('vp-frame-ok');
                    } catch (e) { }
                    try {
                        const d = f.contentDocument;
                        if (d && d.documentElement && f._vpWatch !== d) {
                            f._vpWatch = d;
                            let t;
                            new MutationObserver(() => { clearTimeout(t); t = setTimeout(glidePlace, 250); }).observe(d.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
                            t = setTimeout(glidePlace, 250);
                        }
                    } catch (e) { }
                };
                if (!f._vpHooked) {
                    f._vpHooked = true;
                    f.addEventListener('load', () => { f._vpClear = false; clear(); f.classList.add('vp-frame-ok'); });
                    const t0 = performance.now();
                    const early = () => {
                        try {
                            const d = f.contentDocument;
                            if (d && d.head && d.URL !== 'about:blank' && !d.getElementById('vp-frame-clear')) clear();
                        } catch (e) { }
                        if (!f.isConnected) return;
                        if (performance.now() - t0 > 3000) f.classList.add('vp-frame-ok');
                        else if (!f.classList.contains('vp-frame-ok')) requestAnimationFrame(early);
                    };
                    early();
                }
                clear();
            });
        }
        onDom(framePages);

        const TAB_ICONS = [
            [/для вас/i, '<path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z"/>'],
            [/клан/i, '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.5 0 4.5 2 4.5 4.5"/>'],
            [/подпис/i, '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>']
        ];
        onDom(function feedTabIcons() {
            document.querySelectorAll('.vp-feed-bar .vp-tabs > button').forEach(b => {
                if (b.querySelector('.vp-tab-ico')) return;
                const t = b.textContent.trim(), hit = TAB_ICONS.find(([re]) => re.test(t));
                if (!hit) return;
                b.title = t;
                b.insertAdjacentHTML('afterbegin', '<span class="vp-tab-ico">' + svgIcon(hit[1], 22) + '</span>');
            });
        });

        function postMediaWait() {
            document.querySelectorAll('img[data-post-media-image]:not([data-vp-wait])').forEach(img => {
                const box = img.parentElement;
                if (!box) return;
                img.dataset.vpWait = '1';
                if (getComputedStyle(box).position === 'static') box.classList.add('vp-media-rel');
                const done = () => box.classList.remove('vp-media-wait', 'vp-media-fail');
                const fail = () => { box.classList.remove('vp-media-wait'); box.classList.add('vp-media-fail'); };
                img.addEventListener('load', done);
                img.addEventListener('error', fail);
                if (!img.complete) box.classList.add('vp-media-wait');
                else if (!img.naturalWidth && img.getAttribute('src')) fail();
                box.addEventListener('click', e => {
                    if (!box.classList.contains('vp-media-fail')) return;
                    e.stopPropagation(); e.preventDefault();
                    box.classList.replace('vp-media-fail', 'vp-media-wait');
                    const src = img.src;
                    img.removeAttribute('src');
                    img.src = src;
                }, true);
            });
        }
        onDom(postMediaWait);

        function postIdOf(card) {
            if (!card.matches('article')) { const m = location.pathname.match(/\/post\/([0-9a-f-]{36})/); if (m) return m[1]; }
            const rp = card.querySelector('.' + SELECTORS.repost);
            if (rp) {
                const own = normText([...card.querySelectorAll('.' + SELECTORS.postText)].filter(t => !t.closest('.' + SELECTORS.repost)).map(t => t.textContent).join(' '));
                const hl = card.querySelector('header ' + PROFILE_LINK) || card.querySelector(PROFILE_LINK);
                const who = hl && (loginOf(hl.getAttribute('href')) || '').toLowerCase();
                if (!own && who) {
                    for (const img of rp.querySelectorAll('img')) { const id = postIndex.byRepost.get(who + '|' + (img.currentSrc || img.src)); if (id) return id; }
                    const ot = normText([...rp.querySelectorAll('.' + SELECTORS.postText)].map(t => t.textContent).join(' '));
                    if (ot) for (const [k, id] of postIndex.byRepost) {
                        if (!k.startsWith(who + '|')) continue;
                        const t = k.slice(who.length + 1);
                        if (t === ot || ot.startsWith(t) || t.startsWith(ot)) return id;
                    }
                    return null;
                }
            }
            for (const img of card.querySelectorAll('img')) {
                if (rp && rp.contains(img)) continue;
                const id = postIndex.byMedia.get(img.currentSrc || img.src); if (id) return id;
            }
            const bg = card.dataset.blurBg && postIndex.byMedia.get(card.dataset.blurBg);
            if (bg) return bg;
            const link = card.querySelector('header ' + PROFILE_LINK) || card.querySelector(PROFILE_LINK);
            const user = link && loginOf(link.getAttribute('href'));
            const posts = user && postIndex.byUser.get(user.toLowerCase());
            if (!posts) return null;
            const text = normText([...card.querySelectorAll('.' + SELECTORS.postText)].filter(t => !t.closest('.' + SELECTORS.repost)).map(t => t.textContent).join(' '));
            if (!text) return null;
            for (const [id, t] of posts) if (t === text || text.startsWith(t) || t.startsWith(text)) return id;
            return null;
        }
        function postFooters(card) {
            const all = [...card.querySelectorAll('footer')];
            const own = all.filter(f => !f.closest('.' + SELECTORS.repost)).pop() || all.pop();
            return { own, repost: all.find(f => f !== own) };
        }
        function postCounters(foot) {
            if (!foot) return null;
            const num = el => el && [...el.querySelectorAll('span')].reverse().find(sp => !sp.children.length && /^\d[\d\s.,KkКк]*$/.test(sp.textContent.trim()));
            const btn = label => num(foot.querySelector(`button[aria-label="${label}"]`));
            const views = [...foot.querySelectorAll('span')].filter(sp => !sp.closest('button') && sp.querySelector('svg')).map(num).filter(Boolean).pop();
            return { likesCount: btn('Нравится'), commentsCount: btn('Комментировать'), repostsCount: btn('Репост'), viewsCount: views };
        }
        async function refreshPost(card, btn) {
            const id = postIdOf(card);
            if (!id || btn.classList.contains('vp-spin')) return;
            btn.classList.add('vp-spin');
            try {
                const foots = postFooters(card), orig = foots.repost && postIndex.original.get(id);
                const ids = orig ? [id, orig] : [id];
                const res = await api('/api/posts/stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
                const j = res.ok ? await res.json() : null;
                const list = j ? (j.posts || (j.data && j.data.posts) || []) : [];
                const pick = (pid, i) => list.find(x => x && x.id === pid) || (list.every(x => !x || !x.id) ? list[i] : null);
                const st = pick(id, 0);
                if (!st) throw new Error('счётчики: ' + res.status);
                let changed = 0;
                const put = (foot, st) => {
                    const els = postCounters(foot) || {};
                    for (const k of ['likesCount', 'commentsCount', 'repostsCount', 'viewsCount']) {
                        const el = els[k];
                        if (!el || typeof st[k] !== 'number' || el.textContent.trim() === String(st[k])) continue;
                        el.textContent = String(st[k]);
                        el.classList.remove('vp-bump'); void el.offsetWidth; el.classList.add('vp-bump');
                        changed++;
                    }
                };
                put(foots.own, st);
                const ost = orig && pick(orig, 1);
                if (ost) put(foots.repost, ost);
                const sort = card.matches('article') ? null : document.querySelector('[data-comments-section] select');
                if (sort) {
                    const setSort = v => { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(sort, v); sort.dispatchEvent(new Event('change', { bubbles: true })); };
                    const cur = sort.value;
                    setSort(cur === 'new' ? 'old' : 'new');
                    setTimeout(() => setSort(cur), 150);
                    changed++;
                }
                btn.title = changed ? 'Обновлено' : 'Ничего нового';
            } catch (e) {
                logErr('обновить пост', e);
                btn.title = 'Не вышло обновить';
            } finally {
                setTimeout(() => btn.classList.remove('vp-spin'), 400);
            }
        }
        const styleRefresh = addCss(`
        .vp-post-tools { display: flex; align-items: center; gap: 0; }
        .vp-post-tool { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; margin-right: 2px;
            border: 0; border-radius: 50%; background: none; color: var(--text-secondary); cursor: pointer; flex: 0 0 auto; }
        .vp-post-tool:hover { background: var(--block-hover-bg, rgba(128,128,128,.15)); color: var(--text-primary, #fff); }
        .vp-post-tool.vp-busy { opacity: .5; pointer-events: none; }
        .vp-post-refresh.vp-spin svg { animation: vp-refresh-spin .6s linear infinite; }
        @keyframes vp-refresh-spin { to { transform: rotate(360deg); } }
        .vp-bump { animation: vp-bump .7s ease-out; display: inline-block; }
        @keyframes vp-bump { 30% { transform: scale(1.35); color: var(--accent-primary); } }
    `);
        function placeRefresh(b) {
            const card = b.parentElement, menu = b._vpMenu;
            if (!card || !menu || !menu.isConnected) return;
            const cr = card.getBoundingClientRect(), mr = menu.getBoundingClientRect();
            if (!mr.width) return;
            const top = Math.round(mr.top - cr.top + (mr.height - 32) / 2) + 'px', right = Math.round(cr.right - mr.left + 2) + 'px';
            if (b.style.top !== top || b.style.right !== right) Object.assign(b.style, { position: 'absolute', zIndex: '2', top, right });
            const row = menu.parentElement && menu.parentElement.querySelector(':scope > .' + SELECTORS.nickRow);
            if (!row) return;
            const need = Math.max(0, Math.round(row.getBoundingClientRect().right - (cr.right - parseFloat(right) - b.offsetWidth) + 8)) + 'px';
            if (row.style.paddingRight !== need) row.style.paddingRight = need;
        }
        addEventListener('resize', () => document.querySelectorAll('.vp-post-tools').forEach(placeRefresh));
        function postShownImage(card) {
            const cr = card.getBoundingClientRect();
            const imgs = [...card.querySelectorAll('.' + SELECTORS.postMedia + ' img, img[data-post-media-image]')]
                .filter(i => !i.closest('header') && (i.currentSrc || i.src));
            return imgs.find(i => { const r = i.getBoundingClientRect(), cx = r.left + r.width / 2; return r.width > 0 && cx > cr.left && cx < cr.right; }) || imgs[0] || null;
        }
        const postHeadRow = h => [...h.children].find(c => c.querySelector(PROFILE_LINK)) || h.firstElementChild;
        onDom(function postToolButtons() {
            if (!myUsername) return;
            document.querySelectorAll('.vp-post-tools').forEach(b => {
                if (b._vpMenu && !b._vpMenu.isConnected) {
                    const h = b.parentElement && b.parentElement.querySelector('header'), row = h && postHeadRow(h);
                    b._vpMenu = row && [...row.children].reverse().find(c => c.querySelector('svg') && !c.matches('.' + SELECTORS.nickRow + ', a, .vp-post-tools'));
                }
                placeRefresh(b);
            });
            const me = myUsername.toLowerCase();
            document.querySelectorAll('header').forEach(h => {
                const row = postHeadRow(h);
                if (!row) return;
                const card = h.closest('article') || h.closest('div:has(> footer)') || (h.parentElement && h.parentElement.closest('div:has(footer)'));
                if (!card || card.querySelector(':scope > .vp-post-tools') || !card.querySelector('footer') || card.closest('.vp-msgs, .vp-gal')) return;
                const link = h.querySelector(PROFILE_LINK) || card.querySelector(PROFILE_LINK);
                const user = link && loginOf(link.getAttribute('href'));
                if (!user) return;
                const menu = [...row.children].reverse().find(c => c.querySelector('svg') && !c.matches('.' + SELECTORS.nickRow + ', a'));
                const id = menu && postIdOf(card);
                if (!id) return;
                const box = document.createElement('div');
                box.className = 'vp-post-tools';
                const tool = (cls, title, html) => {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'vp-post-tool ' + cls;
                    b.title = title;
                    b.innerHTML = html;
                    box.appendChild(b);
                    return b;
                };
                if (user.toLowerCase() === me) {
                    const b = tool('vp-post-refresh', 'Обновить лайки и комменты', svgIcon('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>', 18));
                    b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); refreshPost(card, b); });
                }
                const icon = k => `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">${GAL_ICONS[k]}</svg>`;
                const copyTool = (act, title, run) => {
                    const b = tool('vp-post-copy', title, icon(act));
                    b.dataset.act = act;
                    b.addEventListener('click', e => {
                        e.preventDefault(); e.stopPropagation();
                        if (b.classList.contains('vp-busy')) return;
                        b.classList.add('vp-busy');
                        Promise.resolve(run()).then(ok => {
                            b.classList.remove('vp-busy');
                            b.innerHTML = icon(ok ? 'done' : act);
                            b.title = ok ? 'Скопировано' : 'Не вышло скопировать';
                            clearTimeout(b._vpT);
                            b._vpT = setTimeout(() => { b.innerHTML = icon(act); b.title = title; }, 1400);
                        });
                    });
                };
                if (postShownImage(card)) copyTool('copy', 'Скопировать картинку', () => { const img = postShownImage(card); return img ? galCopyImage(img.currentSrc || img.src) : false; });
                copyTool('link', 'Скопировать ссылку', () => copyText(`${location.origin}/@${user}/post/${id}`));
                if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
                box._vpMenu = menu;
                card.appendChild(box);
                placeRefresh(box);
            });
        });

