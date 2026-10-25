        function msgToast(m) {
            const k = msgNet.keys.get(m.uid);
            if (!k) return;
            const who = (msgPeople.get(k.login) || {}).name || k.login;
            if (msgToastEl) msgToastEl.remove();
            const tb = toastBox();
            if (tb) tb.querySelectorAll(':scope > div > *').forEach(closeToast);
            const el = document.createElement('div');
            el.className = 'vp-msg-toast';
            el.innerHTML = '<span class="vp-msg-toast-ava"></span><span class="vp-msg-toast-body"><b></b><span></span></span>';
            const ava = m.sup && !msgIsSupport() ? '🛟' : ((msgPeople.get(k.login) || {}).ava || '👤');
            const avaEl = el.firstChild;
            if (isUrl(ava)) { const im = document.createElement('img'); im.src = ava; im.alt = ''; avaEl.appendChild(im); }
            else { avaEl.textContent = ava; tintCard(el, ava); }
            el.querySelector('b').textContent = m.sup ? (msgIsSupport() ? '🛟 ' + who : 'Поддержка ИТД X') : who;
            el.querySelector('.vp-msg-toast-body span').textContent = msgPreview(m);
            el.onclick = () => { el.remove(); msgOpenFrom(m); };
            document.body.appendChild(el);
            msgToastEl = el;
            setTimeout(() => el.remove(), 7000);
        }
        async function msgBackground() {
            if (!myUsername || apiPaused() || (document.hidden && (!msgNet.me || !leadTab()))) return;
            const idle = Date.now() - msgActive.at, gap = Math.max(idle < 3 * 60e3 ? 20e3 : idle < 15 * 60e3 ? 120e3 : 300e3, !document.hidden && !leadTab() ? 120e3 : 0);
            if (Date.now() - (msgBackground.at || 0) < gap) return;
            msgBackground.at = Date.now();
            try { await msgSync(); } catch (e) { return; }
            const myId = msgMyId(), plainCalls = ((msgNet.callNote && msgNet.callNote.list) || []).filter(x => x.u === myId).map(x => x.ts);
            const callAt = Math.max(0, ...(msgNet.me ? msgNet.calls || [] : []), ...plainCalls), callSeen = +GM_getValue(acctKey('vp_call_seen'), 0) || 0;
            if (callAt > callSeen) { GM_setValue(acctKey('vp_call_seen'), callAt); if (srvNow() / 1000 - callAt < 180) fakeCall(); }
            if (!msgNet.me) return;
            const incoming = [];
            for (const [uid, list] of msgNet.conv) for (const m of list) if (m.dir === 'in') incoming.push({ uid, ...m });
            incoming.sort((a, b) => (a.at || a.ts) - (b.at || b.ts));
            const idOf = m => m.uid + '|' + m.ts + '|' + (m.sup ? 1 : 0), ids = new Set(incoming.map(idOf));
            if (msgBase !== null) {
                const fresh = incoming.filter(m => !msgBase.has(idOf(m))), last = fresh[fresh.length - 1];
                const open = messagesOverlay && messagesOverlay.classList.contains('vp-open'), cur = open && messagesOverlay.currentTarget && messagesOverlay.currentTarget();
                if (last && !(cur && cur.uid === last.uid && cur.sup === last.sup)) msgToast(last);
            }
            msgBase = ids;
            msgBadge();
            if (messagesOverlay && messagesOverlay.classList.contains('vp-open') && messagesOverlay.refreshList) messagesOverlay.refreshList();
        }
        const msgActive = { at: Date.now() };
        const msgWake = () => {
            const was = Date.now() - msgActive.at;
            msgActive.at = Date.now();
            if (was > 3 * 60e3) { msgBackground.at = 0; msgBackground(); }
        };
        ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => document.addEventListener(ev, msgWake, { capture: true, passive: true }));
        setTimeout(msgBackground, 12000);
        sched.add('msgBackground', msgBackground, { every: 60000, net: true });
        sched.add('callSync', () => {
            const c = callNet.cur, open = messagesOverlay && messagesOverlay.classList.contains('vp-open');
            const every = c && /^(calling|ringing|connecting)$/.test(c.state) ? 4000 : document.hidden ? 0 : open ? 15000 : 0;
            if (!every || Date.now() - callNet.lastSync < every || msgNet.syncing || !msgNet.me || apiPaused()) return;
            callNet.lastSync = Date.now();
            msgSync().catch(() => { });
        }, { every: 1000, net: true });
        document.addEventListener('visibilitychange', () => { if (!document.hidden) { msgBackground.at = 0; msgBackground(); } });
        const msgToastCss = addCss(`
        .vp-msg-badge { position: absolute; top: -6px; right: -10px; min-width: 18px; height: 18px; padding: 0 5px; box-sizing: border-box; font-size: 11px; font-weight: 600;
            line-height: 18px; text-align: center; color: #fff; background-color: var(--accent-like, #f91880); border-radius: 9px; pointer-events: none; }
        nav a[href="#"] .vp-nav-icon:has(> .vp-msg-badge) { position: relative; }
        .vp-msg-toast { position: fixed; top: 16px; left: 50vw; transform: translateX(-50%); z-index: 2147483000; width: min(420px, calc(100vw - 24px)); box-sizing: border-box;
            display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 24px; cursor: pointer; color: var(--text-primary, #fff);
            background: var(--block-bg); border: 1px solid var(--border-color, rgba(255, 255, 255, .12)); box-shadow: 0 14px 36px rgba(0, 0, 0, .45);
            backdrop-filter: var(--vp-glass-filter, blur(18px)); -webkit-backdrop-filter: var(--vp-glass-filter, blur(18px)); animation: vpMsgToastIn .25s ease-out; }
        .vp-msg-toast-ava { flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px;
            overflow: hidden; background: rgba(127, 127, 127, .18); }
        .vp-msg-toast-ava img { width: 100%; height: 100%; object-fit: cover; }
        .vp-msg-toast-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .vp-msg-toast b { font-size: 14px; }
        .vp-msg-toast-body span { font-size: 14px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        @keyframes vpMsgToastIn { from { opacity: 0; transform: translate(-50%, -8px); } }
        @media (max-width: ${PHONE_MAX}px) { .vp-msg-toast { top: calc(env(safe-area-inset-top, 0px) + 10px); } }
        @media (prefers-reduced-motion: reduce) { .vp-msg-toast { animation: none; } }
    `);
        const msgKeyCss = addCss(`
        .vp-msgs-beta { display: inline-block; vertical-align: middle; margin-left: 6px; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;
            letter-spacing: .03em; color: var(--vp-accent); box-shadow: inset 0 0 0 1px var(--vp-accent); }
        .vp-msgs-key { display: flex; flex-direction: column; gap: 10px; max-width: 360px; margin: 12px auto; }
        .vp-msgs-key input { padding: 11px 14px; border-radius: 14px; border: 1px solid var(--border-color, rgba(255,255,255,.14)); background: rgba(255,255,255,.06);
            color: inherit; font: inherit; font-size: 15px; outline: none; }
        .vp-msgs-key input:focus { border-color: var(--vp-accent); }
        .vp-msgs-key button { padding: 11px; border: 0; border-radius: 14px; cursor: pointer; font: inherit; font-weight: 600; background: var(--vp-accent); color: #000; }
        .vp-msgs-key button:disabled { opacity: .5; cursor: default; }
        .vp-msgs-keyerr { min-height: 18px; font-size: 13px; text-align: center; color: var(--text-secondary); }
    `);

        let messagesOverlay = null;

        const MESSAGE_JOKES = [
            ['🔥', 'Сообщение получил. Сервер тоже получил — и перегрелся'],
            ['🐹', 'Сервер работает на хомяке в колесе. Хомяк ушёл на обед'],
            ['⏳', 'Лента грузится. Не трогай — спугнёшь'],
            ['🧱', '502 Bad Gateway — это не ошибка, это стиль жизни'],
            ['🔄', 'Переподключаюсь… Переподключаюсь… О, опять ты'],
            ['❤️', 'Лайк засчитан. Наверное. Обнови страницу — узнаем вместе'],
            ['🔔', 'Уведомление о твоём сообщении придёт завтра. Или вчера. Как повезёт'],
            ['🖼️', 'Картинка не загрузилась? Она стесняется. Дай ей минутку'],
            ['🛠️', 'Ведутся технические работы. Какие — сами не знаем, но ведутся'],
            ['🎲', 'Шанс, что пост опубликуется с первого раза: сегодня 50 на 50'],
            ['🧯', 'Если сайт упал — это не баг, это он прилёг отдохнуть'],
            ['📉', 'Онлайн растёт, сервер — нет. Держимся'],
            ['🐛', 'Это не баг, это фича. Вот этот — точно фича. Наверное'],
            ['🌀', 'Крутилка крутится — значит, я жив. Логика железная'],
            ['🥔', 'Сервер у нас надёжный: картофельный, отечественный'],
            ['🔌', 'Кто-то снова задел провод. Ставим табличку «не трогать»'],
            ['🧊', 'Подморозил ленту, чтобы ты отдохнул от прокрутки. Забота'],
            ['📦', 'Твоё сообщение в очереди. Перед ним ещё 4000 лайков'],
            ['🤐', 'Отправлено в обработку. Обработка отправлена в отпуск'],
            ['🕳️', 'Комментарий исчез? Он в лучшем мире, там где старые посты'],
            ['📶', 'Сайт открылся с первого раза? Сделай скрин — никто не поверит'],
            ['⚙️', 'Обновили сайт. Что сломали — узнаем от пользователей'],
            ['🧪', 'Ты тестируешь ИТД в прямом эфире. Спасибо за вклад в науку'],
            ['🐌', 'Сервер думает. Не торопи, он в первый раз'],
            ['🔢', 'Счётчик подписчиков немного устал считать. Он не врёт, он округляет'],
            ['🕰️', 'Прочитано «только что» — по серверному времени это час назад'],
            ['👻', 'Пост висит, но его нет. Или есть, но не висит. Квантовая лента'],
            ['🎰', 'Обнови страницу — вдруг выпадет рабочая версия'],
            ['🧹', 'Кеш почистили. Вместе с частью ленты. Бывает'],
            ['🫡', 'Все системы в норме. Кроме тех, что не в норме'],
            ['🚧', 'Ошибка загрузки. Попробуйте позже. Позже тоже попробуйте'],
            ['🛸', 'Запрос улетел и не вернулся. Ждём сигнала из космоса'],
        ];
