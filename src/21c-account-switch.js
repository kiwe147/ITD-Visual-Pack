        const ACC_KEY = 'vp_accounts', ACC_ON = 'vp_acc_on', ACC_PENDING = 'vp_acc_pending';
        const ACC_HOST = location.hostname;
        const accHas = () => typeof GM_cookie !== 'undefined' && !!GM_cookie && typeof GM_cookie.list === 'function';
        const accSlots = () => { try { const o = GM_getValue(ACC_KEY, null); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } };
        const accSave = o => GM_setValue(ACC_KEY, o);
        const accOn = () => GM_getValue(ACC_ON, false) === true;
        const accMe = () => meData && meData.id ? { id: String(meData.id), username: meData.username || myUsername || '', name: meData.displayName || meData.username || '' } : null;
        const cookieList = d => new Promise(ok => { try { GM_cookie.list(d, (r, e) => ok(e || !Array.isArray(r) ? [] : r)); } catch (e) { ok([]); } });
        const cookieSet = d => new Promise(ok => { try { GM_cookie.set(d, e => ok(!e)); } catch (e) { ok(false); } });
        const cookieDel = d => new Promise(ok => { try { GM_cookie.delete(d, () => ok(true)); } catch (e) { ok(false); } });
        async function accReadCookies() {
            const seen = new Map();
            for (const d of [{ domain: ACC_HOST }, { url: location.origin + '/' }, { url: location.origin + '/api/v1/auth/refresh' }]) {
                for (const c of await cookieList(d)) seen.set([c.name, c.domain, c.path].join('|'), c);
            }
            return [...seen.values()];
        }
        const accCookieUrl = c => 'https://' + String(c.domain || ACC_HOST).replace(/^\./, '') + (c.path || '/');
        async function accCapture() {
            const me = accMe();
            if (!me || !accHas() || !accOn()) return false;
            const cookies = (await accReadCookies()).map(c => ({ name: c.name, value: c.value, domain: c.domain, hostOnly: !!c.hostOnly, path: c.path || '/', secure: !!c.secure, httpOnly: !!c.httpOnly, sameSite: c.sameSite, session: !!c.session, expirationDate: c.expirationDate }));
            if (!cookies.length) return false;
            const slots = accSlots();
            const ava = typeof meData.avatar === 'string' && meData.avatar.length <= 8 ? meData.avatar : '';
            slots[me.id] = { id: me.id, username: me.username, name: me.name, ava, cookies, at: Date.now() };
            accSave(slots);
            return true;
        }
        async function accWipe() {
            for (const c of await accReadCookies()) await cookieDel({ url: accCookieUrl(c), name: c.name });
        }
        async function accApply(cookies) {
            for (const c of cookies) {
                const d = { url: accCookieUrl(c), name: c.name, value: c.value, path: c.path, secure: c.secure, httpOnly: c.httpOnly };
                if (!c.hostOnly && c.domain) d.domain = c.domain;
                if (!c.session && c.expirationDate) d.expirationDate = c.expirationDate;
                if (c.sameSite && c.sameSite !== 'unspecified') d.sameSite = c.sameSite;
                await cookieSet(d);
            }
        }
        let accBusy = false;
        async function accSwitch(id) {
            const slots = accSlots(), t = slots[id], me = accMe();
            if (accBusy || !t || !accHas() || (me && me.id === id)) return;
            accBusy = true;
            accSay('Меняю аккаунт…');
            try {
                await accCapture();
                await accWipe();
                await accApply(t.cookies);
                GM_setValue(ACC_PENDING, { id, at: Date.now() });
                location.assign('/');
            } catch (e) { accBusy = false; accSay('Не получилось сменить аккаунт', true); logErr('смена аккаунта', e); }
        }
        async function accAdd() {
            if (accBusy || !accHas()) return;
            accBusy = true;
            accSay('Открываю вход…');
            try {
                await accCapture();
                await accWipe();
                GM_setValue(ACC_PENDING, null);
                location.assign('/login');
            } catch (e) { accBusy = false; accSay('Не получилось', true); logErr('добавить аккаунт', e); }
        }
        function accForget(id) {
            const s = accSlots();
            delete s[id];
            accSave(s);
        }
        let accNote = null, accNoteTimer = 0;
        function accSay(text, bad) {
            if (!accNote || !accNote.isConnected) { accNote = document.createElement('div'); accNote.className = 'vp-acc-note'; document.body.appendChild(accNote); }
            accNote.textContent = text;
            accNote.classList.toggle('vp-bad', !!bad);
            clearTimeout(accNoteTimer);
            accNoteTimer = setTimeout(() => accNote && accNote.remove(), bad ? 7000 : 4000);
        }

        addCss(`
        .vp-acc-btn { position: relative; }
        .vp-acc-wrap .vp-acc-btn { color: var(--text-primary, #fff) !important; border-color: var(--border-color, rgba(255, 255, 255, .22)) !important; }
        .vp-acc-pop { position: fixed; z-index: 99990; width: min(320px, calc(100vw - 24px)); box-sizing: border-box; padding: 10px; border-radius: 22px; display: flex; flex-direction: column; gap: 4px;
            background: var(--block-bg, #15151b); color: var(--text-primary, #fff); border: 1px solid var(--border-color, rgba(255, 255, 255, .12)); box-shadow: 0 18px 50px rgba(0, 0, 0, .55);
            backdrop-filter: var(--vp-glass-filter, blur(18px)); -webkit-backdrop-filter: var(--vp-glass-filter, blur(18px)); animation: vp-acc-in .14s ease-out; }
        @keyframes vp-acc-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .vp-acc-head { padding: 6px 8px 8px; font-size: 15px; font-weight: 700; }
        .vp-acc-row { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 16px; cursor: pointer; }
        .vp-acc-row:hover { background: rgba(128, 128, 128, .16); }
        .vp-acc-row.vp-cur { cursor: default; background: color-mix(in srgb, var(--vp-accent, #f91880) 14%, transparent); }
        .vp-acc-ava { position: relative; flex: none; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; background: rgba(128, 128, 128, .22); overflow: hidden; }
        .vp-acc-ava img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .vp-acc-who { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.25; }
        .vp-acc-who b { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-acc-who i { font-style: normal; font-size: 12px; color: var(--text-secondary, #9aa0b4); }
        .vp-acc-mark { flex: none; color: var(--vp-accent, #f91880); display: flex; }
        .vp-acc-x { all: unset; flex: none; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; cursor: pointer; color: var(--text-secondary, #9aa0b4); font-size: 18px; }
        .vp-acc-x:hover { background: rgba(128, 128, 128, .28); color: var(--text-primary, #fff); }
        .vp-acc-add { all: unset; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px; padding: 11px; border-radius: 16px; cursor: pointer; font-weight: 600; font-size: 14px; background: rgba(128, 128, 128, .18); }
        .vp-acc-add:hover { background: rgba(128, 128, 128, .3); }
        .vp-acc-text { padding: 4px 8px 8px; font-size: 13px; line-height: 1.45; color: var(--text-secondary, #9aa0b4); }
        .vp-acc-btns { display: flex; gap: 8px; }
        .vp-acc-btns .vp-acc-add { flex: 1; margin: 0; }
        .vp-acc-btns .vp-acc-go { background: var(--vp-accent, #f91880); color: var(--vp-on-accent, #fff); }
        .vp-acc-note { position: fixed; left: 50%; top: 18px; transform: translateX(-50%); z-index: 99995; padding: 11px 18px; border-radius: 16px; font-size: 14px; font-weight: 600; max-width: calc(100vw - 32px);
            background: var(--block-bg, #15151b); color: var(--text-primary, #fff); border: 1px solid var(--border-color, rgba(255, 255, 255, .14)); box-shadow: 0 12px 34px rgba(0, 0, 0, .5); }
        .vp-acc-note.vp-bad { border-color: #ff6b81; }
        `);

        let accPop = null;
        function accClose() {
            if (accPop) accPop.remove();
            accPop = null;
            document.removeEventListener('pointerdown', accOutside, true);
            document.removeEventListener('keydown', accKey, true);
        }
        const accOutside = e => { if (accPop && !accPop.contains(e.target) && !e.target.closest('.vp-acc-btn')) accClose(); };
        const accKey = e => { if (e.key === 'Escape') accClose(); };
        function accRow(s, cur) {
            const row = document.createElement(cur ? 'div' : 'button');
            row.className = 'vp-acc-row' + (cur ? ' vp-cur' : '');
            const ava = document.createElement('span');
            ava.className = 'vp-acc-ava';
            const url = avaUrlOf(s.username);
            if (url) { const im = document.createElement('img'); im.src = url; ava.appendChild(im); } else ava.textContent = s.ava || (s.username || '?').charAt(0).toUpperCase();
            const who = document.createElement('span');
            who.className = 'vp-acc-who';
            const b = document.createElement('b'), i = document.createElement('i');
            b.textContent = s.name || s.username;
            i.textContent = '@' + s.username;
            who.append(b, i);
            row.append(ava, who);
            if (cur) {
                const mark = document.createElement('span');
                mark.className = 'vp-acc-mark';
                mark.innerHTML = svgIcon('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 20);
                row.appendChild(mark);
            } else {
                const x = document.createElement('button');
                x.className = 'vp-acc-x';
                x.type = 'button';
                x.title = 'Забыть аккаунт';
                x.textContent = '×';
                x.onclick = e => { e.stopPropagation(); e.preventDefault(); accForget(s.id); accRender(); };
                row.appendChild(x);
                row.onclick = () => accSwitch(s.id);
            }
            return row;
        }
        function accRender() {
            if (!accPop) return;
            accPop.textContent = '';
            const head = document.createElement('div');
            head.className = 'vp-acc-head';
            head.textContent = 'Аккаунты';
            accPop.appendChild(head);
            const text = t => { const d = document.createElement('div'); d.className = 'vp-acc-text'; d.textContent = t; accPop.appendChild(d); };
            if (!accHas()) { text('Для быстрой смены нужен Tampermonkey: в твоём менеджере скриптов нет доступа к кукам сайта.'); return; }
            if (!accOn()) {
                text('Мод сохранит вход каждого аккаунта прямо в этом браузере, внутри менеджера скриптов, и никуда его не отправит. Пароли не сохраняются. Тогда аккаунты меняются одним нажатием.');
                const btns = document.createElement('div');
                btns.className = 'vp-acc-btns';
                const no = document.createElement('button'), go = document.createElement('button');
                no.className = 'vp-acc-add'; no.textContent = 'Не сейчас'; no.onclick = accClose;
                go.className = 'vp-acc-add vp-acc-go'; go.textContent = 'Включить';
                go.onclick = async () => { GM_setValue(ACC_ON, true); await accCapture(); accRender(); };
                btns.append(no, go);
                accPop.appendChild(btns);
                return;
            }
            const me = accMe(), slots = accSlots();
            if (me) accPop.appendChild(accRow({ id: me.id, username: me.username, name: me.name, ava: (slots[me.id] || {}).ava }, true));
            for (const s of Object.values(slots).sort((a, b) => (b.at || 0) - (a.at || 0))) if (!me || s.id !== me.id) accPop.appendChild(accRow(s, false));
            const add = document.createElement('button');
            add.className = 'vp-acc-add';
            add.innerHTML = svgIcon('<path d="M12 5v14M5 12h14"/>', 18) + '<span>Добавить аккаунт</span>';
            add.onclick = accAdd;
            accPop.appendChild(add);
            if (Object.keys(slots).length < 2) text('Нажми «Добавить аккаунт», войди в другой, и он появится в этом списке.');
        }
        function accOpen(btn) {
            accClose();
            accPop = document.createElement('div');
            accPop.className = 'vp-acc-pop';
            document.body.appendChild(accPop);
            accRender();
            const r = btn.getBoundingClientRect(), h = accPop.offsetHeight, w = accPop.offsetWidth;
            const left = Math.max(12, Math.min(r.left, innerWidth - w - 12));
            const top = r.top - h - 8 >= 8 ? r.top - h - 8 : Math.min(innerHeight - h - 8, r.bottom + 8);
            accPop.style.left = left + 'px';
            accPop.style.top = Math.max(8, top) + 'px';
            document.addEventListener('pointerdown', accOutside, true);
            document.addEventListener('keydown', accKey, true);
        }
        const LOGOUT_RE = /^Выйти( из аккаунта)?$/;
        onDom(function accMount() {
            const lo = [...document.querySelectorAll('button')].find(b => !b.closest('.vp-acc-pop') && !b.classList.contains('vp-acc-btn') && LOGOUT_RE.test(b.textContent.trim()));
            if (!lo || !lo.parentElement) return;
            const box = lo.parentElement, alone = box.children.length === 1;
            const mine = document.querySelectorAll('.vp-acc-btn');
            if (mine.length === 1 && (alone ? mine[0].parentElement.nextElementSibling === box : mine[0].nextElementSibling === lo)) return;
            document.querySelectorAll('.vp-acc-btn, .vp-acc-wrap').forEach(x => x.remove());
            const b = document.createElement('button');
            b.className = lo.className + ' vp-acc-btn';
            b.type = 'button';
            b.innerHTML = svgIcon('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.4-3 2.6-4.8 5.5-4.8s5.1 1.8 5.5 4.8"/><path d="M16.5 5.2a3.2 3.2 0 0 1 0 5.6M18 14.4c1.6.6 2.8 2 3.1 4.6"/>', 20) + '<span>Сменить аккаунт</span>';
            b.onclick = e => { e.preventDefault(); e.stopPropagation(); accPop ? accClose() : accOpen(b); };
            if (alone) {
                const wrap = document.createElement('div');
                wrap.className = box.className + ' vp-acc-wrap';
                wrap.appendChild(b);
                box.parentElement.insertBefore(wrap, box);
            } else box.insertBefore(b, lo);
        });
        document.addEventListener('click', e => {
            const lo = e.target.closest && e.target.closest('button');
            if (!lo || lo.classList.contains('vp-acc-btn') || !LOGOUT_RE.test(lo.textContent.trim())) return;
            const me = accMe();
            if (me && accOn()) accForget(me.id);
        }, true);

        let accChecked = false;
        sched.add('acc', async function accTick() {
            const me = accMe(), pend = GM_getValue(ACC_PENDING, null);
            if (pend && pend.id) {
                if (me && me.id === pend.id) GM_setValue(ACC_PENDING, null);
                else if (Date.now() - (pend.at || 0) > 14000) {
                    GM_setValue(ACC_PENDING, null);
                    const s = accSlots()[pend.id];
                    if (s) { accForget(pend.id); accSay('Вход в @' + s.username + ' устарел, войди в него заново, и он снова появится в списке', true); }
                }
            }
            if (me && accOn() && (!accChecked || Date.now() % 300000 < 6000)) { accChecked = true; await accCapture(); }
        }, { every: 5000 });
        pageWindow.itdvp.acc = async function () {
            const cookies = await accReadCookies();
            console.log('GM_cookie доступен:', accHas(), ' включено:', accOn());
            console.table(cookies.map(c => ({ имя: c.name, домен: c.domain, путь: c.path, httpOnly: c.httpOnly, session: c.session, секунд_до_конца: c.expirationDate ? Math.round(c.expirationDate - Date.now() / 1000) : '' })));
            console.table(Object.values(accSlots()).map(s => ({ ник: s.username, id: s.id, кук: s.cookies.length, сохранено: new Date(s.at).toLocaleString() })));
        };
