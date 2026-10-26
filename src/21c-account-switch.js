        const ACC_KEY = 'vp_logins', ACC_ON = 'vp_acc_on', ACC_TS_KEY = '0x4AAAAAACHhxczw6fJGwPBg';
        const accSlots = () => { try { const o = GM_getValue(ACC_KEY, null); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } };
        const accSave = o => GM_setValue(ACC_KEY, o);
        const accOn = () => GM_getValue(ACC_ON, false) === true;
        const accMe = () => meData && meData.id ? { id: String(meData.id), username: meData.username || myUsername || '', name: meData.displayName || meData.username || '' } : null;
        function accLog(text) {
            const l = GM_getValue('vp_acc_log', []);
            l.push({ at: Date.now(), text });
            GM_setValue('vp_acc_log', l.slice(-40));
        }
        const accHeaders = () => {
            const h = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
            try { const d = localStorage.getItem('device_id'); if (d) h['X-Device-Id'] = d; } catch (e) { }
            return h;
        };
        function accTsApi() {
            return new Promise((ok, no) => {
                const have = () => pageWindow.turnstile && pageWindow.turnstile.render;
                if (have()) return ok(pageWindow.turnstile);
                if (!document.getElementById('cf-turnstile-script')) {
                    const s = document.createElement('script');
                    s.id = 'cf-turnstile-script';
                    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
                    s.async = true;
                    s.onerror = () => no(new Error('Cloudflare не загрузился'));
                    document.head.appendChild(s);
                }
                const t0 = Date.now();
                const wait = setInterval(() => {
                    if (have()) { clearInterval(wait); ok(pageWindow.turnstile); }
                    else if (Date.now() - t0 > 15000) { clearInterval(wait); no(new Error('Cloudflare не загрузился')); }
                }, 150);
            });
        }
        async function accToken(box) {
            const ts = await accTsApi();
            return new Promise((ok, no) => {
                let wid = null;
                const done = (f, v) => { try { if (wid !== null) ts.remove(wid); } catch (e) { } f(v); };
                wid = ts.render(box, {
                    sitekey: ACC_TS_KEY, theme: 'dark',
                    callback: t => done(ok, t),
                    'error-callback': () => done(no, new Error('Cloudflare не пропустил, попробуй ещё раз')),
                    'expired-callback': () => done(no, new Error('Проверка Cloudflare истекла'))
                });
            });
        }
        let accBusy = false;
        async function accLogin(cred, ui) {
            if (accBusy) return;
            accBusy = true;
            try {
                ui.say('Проверка Cloudflare…');
                const token = await accToken(ui.box);
                ui.box.textContent = '';
                ui.say('Выхожу из аккаунта…');
                await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include', headers: accHeaders() }).catch(() => { });
                ui.say('Вхожу…');
                const r = await fetch('/api/v1/auth/sign-in', { method: 'POST', credentials: 'include', headers: accHeaders(), body: JSON.stringify({ email: cred.email, password: cred.password, turnstileToken: token }) });
                accLog('вход: ответ ' + r.status);
                const j = await r.json().catch(() => null);
                const d = j && (j.accessToken ? j : j.data);
                if (!r.ok || !d || !d.accessToken) {
                    const why = !r.ok ? ((j && (j.message || (j.error && j.error.message))) || ('код ' + r.status)) : 'сайт просит код из почты';
                    accBusy = false;
                    ui.fail('Не вошёл: ' + why + '. Ты сейчас вышел из аккаунта, войди обычным способом.');
                    return;
                }
                let me = null;
                try { const m = await fetch('/api/users/me', { credentials: 'include', headers: { Authorization: 'Bearer ' + d.accessToken } }); me = m.ok ? await m.json() : null; } catch (e) { }
                if (me && me.id && cred.remember !== false) {
                    const s = accSlots();
                    s[String(me.id)] = { id: String(me.id), username: me.username, name: me.displayName || me.username, ava: typeof me.avatar === 'string' && me.avatar.length <= 8 ? me.avatar : '', email: cred.email, password: cred.password, at: Date.now() };
                    accSave(s);
                }
                accLog('вошёл как ' + (me && me.username || '?'));
                if (me && me.id) GM_set0('vp_last_acct', String(me.id));
                location.assign('/');
            } catch (e) {
                accBusy = false;
                accLog('ошибка: ' + (e && e.message || e));
                ui.fail(e && e.message || 'Не получилось');
            }
        }
        function accForget(id) {
            const s = accSlots();
            delete s[id];
            accSave(s);
        }

        const ACC_ICON_USERS = 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z';
        const ACC_ICON_OUT = 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z';
        const accMask = d => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${d}"/></svg>`)}")`;
        addCss(`
        .vp-acc-btn { position: relative; }
        .vp-side-bottom > button.vp-side-out > svg { display: none !important; }
        .vp-side-bottom > button.vp-side-out::before { content: ''; flex: none; width: 24px; height: 24px; background: currentColor; -webkit-mask: ${accMask(ACC_ICON_OUT)} center / contain no-repeat; mask: ${accMask(ACC_ICON_OUT)} center / contain no-repeat; }
        .vp-side-bottom { gap: 0 !important; }
        .vp-side-bottom > button { min-height: 56px; padding: 16px !important; gap: 18px !important; border-radius: 18px !important; font-size: 16px !important; font-weight: 600 !important; }
        .vp-side-bottom > button svg { width: 24px !important; height: 24px !important; flex: none; }
        .vp-acc-wrap .vp-acc-btn { color: var(--text-primary, #fff) !important; border-color: var(--border-color, rgba(255, 255, 255, .22)) !important; }
        .vp-acc-pop { position: fixed; z-index: 99990; width: min(330px, calc(100vw - 24px)); box-sizing: border-box; padding: 10px; border-radius: 22px; display: flex; flex-direction: column; gap: 4px;
            background: var(--block-bg, #15151b); color: var(--text-primary, #fff); border: 1px solid var(--border-color, rgba(255, 255, 255, .12)); box-shadow: 0 18px 50px rgba(0, 0, 0, .55);
            backdrop-filter: var(--vp-glass-filter, blur(18px)); -webkit-backdrop-filter: var(--vp-glass-filter, blur(18px)); animation: vp-acc-in .14s ease-out; }
        @keyframes vp-acc-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .vp-acc-head { padding: 6px 8px 8px; font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .vp-acc-back { all: unset; cursor: pointer; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: var(--text-secondary, #9aa0b4); }
        .vp-acc-back:hover { background: rgba(128, 128, 128, .25); }
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
        .vp-acc-text.vp-bad { color: #ff6b81; }
        .vp-acc-btns { display: flex; gap: 8px; }
        .vp-acc-btns .vp-acc-add { flex: 1; margin: 0; }
        .vp-acc-go { background: var(--vp-accent, #f91880) !important; color: var(--vp-on-accent, #fff) !important; }
        .vp-acc-form { display: flex; flex-direction: column; gap: 8px; padding: 2px 4px; }
        .vp-acc-form input[type=email], .vp-acc-form input[type=password] { all: unset; box-sizing: border-box; width: 100%; padding: 11px 14px; border-radius: 14px; font-size: 15px;
            background: rgba(128, 128, 128, .18); color: var(--text-primary, #fff); border: 1px solid transparent; }
        .vp-acc-form input:focus { border-color: var(--vp-accent, #f91880); }
        .vp-acc-chk { display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; line-height: 1.4; color: var(--text-secondary, #9aa0b4); }
        .vp-acc-chk input { margin-top: 2px; accent-color: var(--vp-accent, #f91880); }
        .vp-acc-ts { min-height: 65px; display: flex; justify-content: center; }
        `);

        let accPop = null, accAnchor = null;
        function accClose() {
            if (accBusy) return;
            if (accPop) accPop.remove();
            accPop = null;
            document.removeEventListener('pointerdown', accOutside, true);
            document.removeEventListener('keydown', accKey, true);
        }
        const accOutside = e => { if (accPop && !accPop.contains(e.target) && !e.target.closest('.vp-acc-btn')) accClose(); };
        const accKey = e => { if (e.key === 'Escape') accClose(); };
        const accEl = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
        function accPlace() {
            if (!accPop || !accAnchor) return;
            const r = accAnchor.getBoundingClientRect(), h = accPop.offsetHeight, w = accPop.offsetWidth;
            const left = Math.max(12, Math.min(r.left, innerWidth - w - 12));
            const top = r.top - h - 8 >= 8 ? r.top - h - 8 : Math.min(innerHeight - h - 8, r.bottom + 8);
            accPop.style.left = left + 'px';
            accPop.style.top = Math.max(8, top) + 'px';
        }
        function accHead(title, back) {
            const head = accEl('div', 'vp-acc-head');
            if (back) { const b = accEl('button', 'vp-acc-back'); b.type = 'button'; b.innerHTML = svgIcon('<path d="M15 5l-7 7 7 7"/>', 18); b.onclick = back; head.appendChild(b); }
            head.appendChild(accEl('span', '', title));
            accPop.appendChild(head);
        }
        function accRow(s, cur) {
            const row = accEl(cur ? 'div' : 'button', 'vp-acc-row' + (cur ? ' vp-cur' : ''));
            const ava = accEl('span', 'vp-acc-ava');
            const url = avaUrlOf(s.username);
            if (url) { const im = document.createElement('img'); im.src = url; ava.appendChild(im); } else ava.textContent = s.ava || (s.username || '?').charAt(0).toUpperCase();
            const who = accEl('span', 'vp-acc-who');
            who.append(accEl('b', '', s.name || s.username), accEl('i', '', '@' + s.username));
            row.append(ava, who);
            if (cur) {
                const mark = accEl('span', 'vp-acc-mark');
                mark.innerHTML = svgIcon('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 20);
                row.appendChild(mark);
            } else {
                const x = accEl('button', 'vp-acc-x', '×');
                x.type = 'button';
                x.title = 'Забыть аккаунт';
                x.onclick = e => { e.stopPropagation(); e.preventDefault(); accForget(s.id); accList(); };
                row.append(x);
                row.onclick = () => accRunView(s, s.username);
            }
            return row;
        }
        function accRunView(cred, title) {
            accPop.textContent = '';
            accHead(title ? 'Вход в @' + title : 'Вход');
            const status = accEl('div', 'vp-acc-text', 'Подготовка…');
            const box = accEl('div', 'vp-acc-ts');
            accPop.append(status, box);
            const ui = {
                box,
                say: t => { status.textContent = t; status.classList.remove('vp-bad'); accPlace(); },
                fail: t => {
                    status.textContent = t; status.classList.add('vp-bad');
                    const btns = accEl('div', 'vp-acc-btns');
                    const back = accEl('button', 'vp-acc-add', 'Назад'); back.onclick = accList;
                    const login = accEl('button', 'vp-acc-add vp-acc-go', 'Открыть вход'); login.onclick = () => location.assign('/login');
                    btns.append(back, login);
                    accPop.appendChild(btns);
                    accPlace();
                }
            };
            accPlace();
            accLogin(cred, ui);
        }
        function accForm() {
            accPop.textContent = '';
            accHead('Добавить аккаунт', accList);
            const form = accEl('form', 'vp-acc-form');
            form.autocomplete = 'on';
            const mail = accEl('input'); mail.type = 'email'; mail.name = 'email'; mail.autocomplete = 'username'; mail.placeholder = 'Почта';
            const pass = accEl('input'); pass.type = 'password'; pass.name = 'password'; pass.autocomplete = 'current-password'; pass.placeholder = 'Пароль';
            const chk = accEl('label', 'vp-acc-chk');
            const cb = accEl('input'); cb.type = 'checkbox'; cb.checked = true;
            chk.append(cb, accEl('span', '', 'Запомнить на этом устройстве, чтобы менять аккаунт одним нажатием'));
            const go = accEl('button', 'vp-acc-add vp-acc-go', 'Войти'); go.type = 'submit';
            form.append(mail, pass, chk, go);
            form.onsubmit = e => {
                e.preventDefault();
                if (!mail.value.trim() || !pass.value) return;
                accRunView({ email: mail.value.trim(), password: pass.value, remember: cb.checked }, '');
            };
            accPop.appendChild(form);
            accPlace();
            mail.focus();
        }
        function accList() {
            if (!accPop) return;
            accPop.textContent = '';
            accHead('Аккаунты');
            const text = t => accPop.appendChild(accEl('div', 'vp-acc-text', t));
            if (!accOn()) {
                text('Мод запомнит почту и пароль аккаунтов прямо в этом браузере, в менеджере скриптов, и отправит их только на сайт ИТД при входе. Тогда аккаунт меняется одним нажатием: выход, вход и проверка Cloudflare идут сами. Не включай, если за этим компьютером сидят другие.');
                const btns = accEl('div', 'vp-acc-btns');
                const no = accEl('button', 'vp-acc-add', 'Не сейчас'); no.onclick = accClose;
                const go = accEl('button', 'vp-acc-add vp-acc-go', 'Включить'); go.onclick = () => { GM_setValue(ACC_ON, true); accList(); };
                btns.append(no, go);
                accPop.appendChild(btns);
                accPlace();
                return;
            }
            const me = accMe(), slots = accSlots();
            if (me) accPop.appendChild(accRow({ id: me.id, username: me.username, name: me.name, ava: (slots[me.id] || {}).ava }, true));
            for (const s of Object.values(slots).sort((a, b) => (b.at || 0) - (a.at || 0))) if (!me || s.id !== me.id) accPop.appendChild(accRow(s, false));
            if (me && !slots[me.id]) {
                const keep = accEl('button', 'vp-acc-add', 'Запомнить этот аккаунт');
                keep.onclick = accForm;
                accPop.appendChild(keep);
            }
            const add = accEl('button', 'vp-acc-add');
            add.innerHTML = svgIcon('<path d="M12 5v14M5 12h14"/>', 18) + '<span>Добавить аккаунт</span>';
            add.onclick = accForm;
            accPop.appendChild(add);
            if (Object.keys(slots).length < 2) text('Добавь второй аккаунт: введи его почту и пароль один раз, дальше мод входит сам.');
            accPlace();
        }
        function accOpen(btn) {
            accClose();
            accAnchor = btn;
            accPop = accEl('div', 'vp-acc-pop');
            document.body.appendChild(accPop);
            accList();
            document.addEventListener('pointerdown', accOutside, true);
            document.addEventListener('keydown', accKey, true);
        }
        const LOGOUT_RE = /^Выйти( из аккаунта)?$/;
        onDom(function accMount() {
            const lo = [...document.querySelectorAll('button')].find(b => !b.closest('.vp-acc-pop') && !b.classList.contains('vp-acc-btn') && LOGOUT_RE.test(b.textContent.trim()));
            if (!lo || !lo.parentElement) return;
            const box = lo.parentElement, alone = box.children.length === 1;
            if (!alone && box.closest('aside')) {
                box.classList.add('vp-side-bottom');
                lo.classList.add('vp-side-out');
            }
            const mine = document.querySelectorAll('.vp-acc-btn');
            if (mine.length === 1 && (alone ? mine[0].parentElement.nextElementSibling === box : mine[0].nextElementSibling === lo)) return;
            document.querySelectorAll('.vp-acc-btn, .vp-acc-wrap').forEach(x => x.remove());
            const b = document.createElement('button');
            b.className = lo.className.split(' ').filter(c => c !== 'vp-side-out').join(' ') + ' vp-acc-btn';
            b.type = 'button';
            b.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="${ACC_ICON_USERS}"/></svg><span>Сменить аккаунт</span>`;
            b.onclick = e => { e.preventDefault(); e.stopPropagation(); accPop ? accClose() : accOpen(b); };
            if (alone) {
                const wrap = document.createElement('div');
                wrap.className = box.className + ' vp-acc-wrap';
                wrap.appendChild(b);
                box.parentElement.insertBefore(wrap, box);
            } else box.insertBefore(b, lo);
        });
        pageWindow.itdvp.acc = function () {
            console.log('запоминание включено:', accOn(), ' текущий:', (accMe() || {}).username);
            console.table(Object.values(accSlots()).map(s => ({ ник: s.username, id: s.id, почта_сохранена: !!s.email, пароль_сохранён: !!s.password, сохранено: new Date(s.at).toLocaleString() })));
            console.table(GM_getValue('vp_acc_log', []).map(l => ({ когда: new Date(l.at).toLocaleTimeString(), что: l.text })));
        };
