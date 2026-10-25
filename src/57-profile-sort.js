        const PSORT = [['new', 'Новые'], ['old', 'Старые'], ['popular', 'Популярные']];
        const psortCss = addCss(`
        .vp-psort { display: flex; gap: 4px; margin: 0 0 12px; padding: 4px; border-radius: 9999px; background: var(--glass-bg, rgba(35, 35, 35, .8)); }
        .vp-psort button { flex: 1; padding: 7px 10px; border: 0; border-radius: 9999px; background: none; cursor: pointer; font: inherit; font-size: 13px; font-weight: 600;
            color: var(--text-secondary); transition: color .2s ease, background-color .2s ease; }
        .vp-psort button:hover { color: var(--text-primary, #fff); }
        .vp-psort button.vp-on { color: var(--text-primary, #fff); background: var(--tab-active-bg, rgba(255, 255, 255, .1));
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent, #4aa3ff) 55%, transparent); }
        .vp-psort.vp-busy { opacity: .6; pointer-events: none; }
        `);
        async function profSortProbe(login, mode) {
            const get = async sort => {
                const r = await api(`/api/posts/user/${encodeURIComponent(login)}?limit=10&sort=${sort}`);
                if (!r.ok) return null;
                const j = await r.json(), d = j.data || j;
                return Array.isArray(d.posts) ? d.posts.filter(p => p && !p.isPinned) : null;
            };
            const base = await get('new'), list = await get(mode);
            if (!base || !list) return false;
            if (base.length < 2 || list.length < 2) return true;
            if (mode === 'old') {
                for (let i = 1; i < list.length; i++) if (Date.parse(list[i].createdAt) < Date.parse(list[i - 1].createdAt)) return false;
                return list[0].id !== base[0].id;
            }
            return list.map(p => p.id).join() !== base.map(p => p.id).join();
        }
        onDom(function profileSort() {
            const path = location.pathname, m = path.match(/^\/@([\w.]+)\/?$/);
            const old = document.querySelector('.vp-psort');
            const art = m && document.querySelector('article.' + SELECTORS.post);
            if (!art || !art.querySelector('a[href="/@' + m[1] + '"]')) { if (old) old.remove(); return; }
            const login = m[1], o = profSortMode(), cur = o && o.u.toLowerCase() === login.toLowerCase() ? o.s : 'new';
            if (old && old.dataset.login === login && old.dataset.cur === cur && old.isConnected && old.nextElementSibling === art) return;
            if (old) old.remove();
            const box = document.createElement('div');
            box.className = 'vp-psort';
            box.dataset.login = login;
            box.dataset.cur = cur;
            PSORT.forEach(([s, label]) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.dataset.s = s;
                b.textContent = label;
                b.classList.toggle('vp-on', s === cur);
                b.addEventListener('click', async () => {
                    if (s === cur) return;
                    box.classList.add('vp-busy');
                    try {
                        if (s === 'new') sessionStorage.removeItem(PROF_SORT_KEY);
                        else {
                            if (!await profSortProbe(login, s)) { vpNote('Сайт не отдаёт такую сортировку'); box.classList.remove('vp-busy'); return; }
                            sessionStorage.setItem(PROF_SORT_KEY, JSON.stringify({ u: login, s }));
                        }
                        location.reload();
                    } catch (e) { logErr('сортировка профиля', e); vpNote('Не вышло переключить сортировку'); box.classList.remove('vp-busy'); }
                });
                box.appendChild(b);
            });
            art.parentElement.insertBefore(box, art);
        });
