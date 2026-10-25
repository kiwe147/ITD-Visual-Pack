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
        const PSORT_TRY = { old: ['old', 'oldest', 'asc'], popular: ['popular'] };
        async function profSortProbe(login, mode) {
            const get = async sort => {
                const r = await api(`/api/posts/user/${encodeURIComponent(login)}?limit=10&sort=${sort}`);
                if (!r.ok) return null;
                const j = await r.json(), d = j.data || j;
                return Array.isArray(d.posts) ? d.posts.filter(p => p && !p.isPinned) : null;
            };
            const base = await get('new');
            if (!base) return null;
            for (const v of PSORT_TRY[mode]) {
                const list = await get(v);
                if (!list) continue;
                if (base.length < 2 || list.length < 2) return v;
                if (mode === 'old') {
                    if (list.every((p, i) => !i || Date.parse(p.createdAt) >= Date.parse(list[i - 1].createdAt)) && list[0].id !== base[0].id) return v;
                } else if (list.map(p => p.id).join() !== base.map(p => p.id).join()) return v;
            }
            return null;
        }
        function psortAnchor() {
            const tabs = [...document.querySelectorAll('.vp-tabs')].find(t => /Лайки/.test(t.textContent) && /Посты/.test(t.textContent));
            if (!tabs) return null;
            const ind = tabs.querySelector('.vp-tab-ind'), first = tabs.querySelector('button');
            if (ind && first && Math.abs(ind.getBoundingClientRect().left - first.getBoundingClientRect().left) > 8) return null;
            let t = tabs;
            for (let i = 0; i < 2 && t.parentElement && t.parentElement.children.length === 1; i++) t = t.parentElement;
            return t;
        }
        onDom(function profileSort() {
            const m = location.pathname.match(/^\/@([\w.]+)\/?$/), old = document.querySelector('.vp-psort');
            const anchor = m && psortAnchor();
            if (!anchor) { if (old) old.remove(); return; }
            const login = m[1], o = profSortMode(), cur = o && o.u.toLowerCase() === login.toLowerCase() ? o.s : 'new';
            if (old && old.dataset.login === login && old.dataset.cur === cur && old.previousElementSibling === anchor) return;
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
                            const v = await profSortProbe(login, s);
                            if (!v) { vpNote('Сайт не отдаёт такую сортировку'); box.classList.remove('vp-busy'); return; }
                            sessionStorage.setItem(PROF_SORT_KEY, JSON.stringify({ u: login, s, v }));
                        }
                        sessionStorage.setItem('vp-soft', String(Date.now()));
                        sessionStorage.setItem('vp-intro-at', String(Date.now()));
                        location.reload();
                    } catch (e) { logErr('сортировка профиля', e); vpNote('Не вышло переключить сортировку'); box.classList.remove('vp-busy'); }
                });
                box.appendChild(b);
            });
            anchor.after(box);
        });
