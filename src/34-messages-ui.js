        const MSG_SUPPORT = {
            id: 'support', ava: '🛟', name: 'Поддержка ИТД X', login: '', last: 'Нашёл баг или есть идея — пиши сюда', time: '', unread: 0, online: true, support: true,
            msgs: [['in', 'Привет! Это поддержка ИТД X 👋'], ['in', 'Нашёл баг или есть идея — опиши здесь, ответ придёт в этот чат']]
        };
        let supportTicket = 0;
        let MSG_DIALOGS = [MSG_SUPPORT];
        const msgPins = () => GM_getValue(acctKey('msgPins'), []);
        const msgOpened = () => { const o = GM_getValue(acctKey('msgOpened'), {}); return o && typeof o === 'object' ? o : {}; };
        function msgMarkOpened(id) { const o = msgOpened(); o[id] = Math.floor(Date.now() / 1000); GM_setValue(acctKey('msgOpened'), o); }
        function sortDialogs(list) {
            const pins = msgPins(), opened = msgOpened();
            const act = d => Math.max(d.lastTs || 0, opened[d.id] || 0);
            const rest = list.filter(d => !pins.includes(d.id)).map((d, i) => [d, i]).sort(([a, i], [b, j]) => act(b) - act(a) || i - j).map(([d]) => d);
            return [...list.filter(d => pins.includes(d.id)).sort((a, b) => pins.indexOf(a.id) - pins.indexOf(b.id)), ...rest];
        }
        const msgPeople = new Map();
        async function loadMsgPeople(onUpdate) {
            const names = verifiedNames().filter(n => !myUsername || n.toLowerCase() !== myUsername.toLowerCase()).sort((a, b) => a.localeCompare(b));
            names.forEach(n => { if (!msgPeople.has(n)) msgPeople.set(n, { id: 'u:' + n, login: n, ava: '👤', name: n, last: 'Тоже с ИТД X · напиши первым', time: '', unread: 0, msgs: [] }); });
            MSG_DIALOGS = [MSG_SUPPORT, ...names.map(n => msgPeople.get(n))];
            onUpdate();
            await Promise.all(names.map(async n => {
                const d = await hcData(n).catch(() => null), p = msgPeople.get(n);
                if (!d || !p) return;
                p.name = pick(d.displayName, d.display_name, n);
                p.ava = pick(d.avatar && (d.avatar.url || d.avatar), d.avatarUrl, d.emoji, '👤');
                p.online = !!d.online; p.lastSeen = d.lastSeen || null;
            }));
            onUpdate();
        }
        const MSG_ICON = {
            back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
            edit: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z"/><path d="M13.5 6.5l4 4"/></svg>',
            search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
            call: svgIcon(GLYPH.phone, 21),
            more: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
            clip: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5 12.5 19a5 5 0 0 1-7-7L13 4.5a3.3 3.3 0 0 1 4.7 4.7l-7.4 7.4a1.7 1.7 0 0 1-2.4-2.4l6.7-6.7"/></svg>',
            smile: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01" stroke-width="2.6"/></svg>',
            send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>',
            tick1: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
            tick2: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m1.5 12.5 4.5 4.5L15.5 7.5"/><path d="m10 15.5 1.5 1.5L21 7.5"/></svg>',
            pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15 3l6 6-3 1-4 4 .5 4.5-1.5 1.5-4-4-5 5-1-1 5-5-4-4L5.5 9.5 10 10l4-4Z"/></svg>'
        };

        const EMOJI_SETS = [
            ['😀', 'Смайлы', '😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 🫠 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 🥲 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🫢 🫣 🤫 🤔 🫡 🤐 🤨 😐 😑 😶 🫥 😏 😒 🙄 😬 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🤠 🥳 🥸 😎 🤓 🧐 😕 🫤 😟 🙁 😮 😯 😲 😳 🥺 🥹 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 ☠️ 💩 🤡 👹 👺 👻 👽 👾 🤖 😺 😸 😹 😻 😼 😽 🙀 😿 😾'],
            ['👍', 'Жесты и люди', '👋 🤚 🖐️ ✋ 🖖 🫱 🫲 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 🫵 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 🫶 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾 🦵 🦶 👂 👃 🧠 🫀 👀 👁️ 👅 👄 🫦 👶 🧒 👦 👧 🧑 👱 👨 🧔 👩 🧓 👴 👵 🙍 🙎 🙅 🙆 💁 🙋 🧏 🙇 🤦 🤷 👮 🕵️ 💂 🥷 👷 🤴 👸 👳 🤵 👰 🤰 👼 🎅 🦸 🦹 🧙 🧚 🧛 🧜 🧝 🧞 🧟 💆 💇 🚶 🧍 🧎 🏃 💃 🕺 👯 🧖 🧗 🤺 🏇 ⛷️ 🏂 🏄 🚣 🏊 🚴 🤸 🤼 🤽 🤾 🤹 🧘 🛀 🛌 👭 👫 👬 💏 💑 👪'],
            ['🐱', 'Животные и природа', '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐒 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🪱 🐛 🦋 🐌 🐞 🐜 🪰 🕷️ 🦂 🐢 🐍 🦎 🦖 🦕 🐙 🦑 🦐 🦞 🦀 🐡 🐠 🐟 🐬 🐳 🐋 🦈 🐊 🐅 🐆 🦓 🦍 🦧 🐘 🦛 🦏 🐪 🐫 🦒 🦘 🐃 🐂 🐄 🐎 🐖 🐏 🐑 🦙 🐐 🦌 🐕 🐩 🐈 🐓 🦃 🦚 🦜 🦢 🦩 🕊️ 🐇 🦝 🦨 🦡 🦫 🦦 🦥 🐁 🐀 🐿️ 🦔 🐾 🐉 🐲 🌵 🎄 🌲 🌳 🌴 🌱 🌿 ☘️ 🍀 🍃 🍂 🍁 🍄 🌾 💐 🌷 🌹 🥀 🌺 🌸 🌼 🌻 🌞 🌝 🌚 🌙 🌎 🪐 ⭐ 🌟 ✨ ⚡ ☄️ 💥 🔥 🌪️ 🌈 ☀️ 🌤️ ⛅ ☁️ 🌧️ ⛈️ 🌩️ ❄️ ☃️ ⛄ 💨 💧 💦 🌊'],
            ['🍔', 'Еда и напитки', '🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒 🌶️ 🫑 🌽 🥕 🧄 🧅 🥔 🍠 🥐 🥯 🍞 🥖 🥨 🧀 🥚 🍳 🧈 🥞 🧇 🥓 🥩 🍗 🍖 🌭 🍔 🍟 🍕 🫓 🥪 🥙 🧆 🌮 🌯 🫔 🥗 🥘 🫕 🥫 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🦪 🍤 🍙 🍚 🍘 🍥 🥠 🥮 🍢 🍡 🍧 🍨 🍦 🥧 🧁 🍰 🎂 🍮 🍭 🍬 🍫 🍿 🍩 🍪 🌰 🥜 🍯 🥛 🍼 ☕ 🍵 🧃 🥤 🧋 🍶 🍺 🍻 🥂 🍷 🥃 🍸 🍹 🧉 🍾 🧊 🥄 🍴 🍽️'],
            ['⚽', 'Занятия', '⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🥏 🎱 🪀 🏓 🏸 🏒 🏑 🥍 🏏 🪃 🥅 ⛳ 🪁 🏹 🎣 🤿 🥊 🥋 🎽 🛹 🛼 🛷 ⛸️ 🥌 🎿 🏋️ 🏆 🥇 🥈 🥉 🏅 🎖️ 🎗️ 🎫 🎟️ 🎪 🎭 🩰 🎨 🎬 🎤 🎧 🎼 🎹 🥁 🪘 🎷 🎺 🪗 🎸 🪕 🎻 🎲 ♟️ 🎯 🎳 🎮 🕹️ 🎰 🧩'],
            ['🚗', 'Поездки и места', '🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚐 🛻 🚚 🚛 🚜 🛴 🚲 🛵 🏍️ 🛺 🚨 🚔 🚍 🚘 🚖 🚡 🚠 🚟 🚃 🚋 🚞 🚝 🚄 🚅 🚈 🚂 🚆 🚇 🚊 🚉 ✈️ 🛫 🛬 🛩️ 💺 🛰️ 🚀 🛸 🚁 🛶 ⛵ 🚤 🛥️ 🛳️ ⛴️ 🚢 ⚓ ⛽ 🚧 🚦 🚥 🗺️ 🗿 🗽 🗼 🏰 🏯 🏟️ 🎡 🎢 🎠 ⛲ ⛱️ 🏖️ 🏝️ 🏜️ 🌋 ⛰️ 🏔️ 🗻 🏕️ ⛺ 🏠 🏡 🏘️ 🏚️ 🏗️ 🏭 🏢 🏬 🏣 🏤 🏥 🏦 🏨 🏪 🏫 🏩 💒 🏛️ ⛪ 🕌 🕍 🛕 🕋 ⛩️ 🌅 🌄 🌠 🎇 🎆 🌇 🌆 🏙️ 🌃 🌌 🌉 🌁'],
            ['💡', 'Предметы', '⌚ 📱 📲 💻 ⌨️ 🖥️ 🖨️ 🖱️ 💽 💾 💿 📀 📼 📷 📸 📹 🎥 📽️ 🎞️ 📞 ☎️ 📟 📠 📺 📻 🎙️ ⏱️ ⏰ 🕰️ ⌛ ⏳ 📡 🔋 🔌 💡 🔦 🕯️ 🧯 💸 💵 💴 💶 💷 🪙 💰 💳 💎 ⚖️ 🧰 🔧 🔨 ⚒️ 🛠️ ⛏️ 🔩 ⚙️ 🧱 ⛓️ 🧲 🔫 💣 🧨 🪓 🔪 🗡️ ⚔️ 🛡️ 🚬 ⚰️ 🔮 📿 🧿 💈 ⚗️ 🔭 🔬 🕳️ 🩹 🩺 💊 💉 🩸 🧬 🦠 🧫 🧪 🌡️ 🧹 🧺 🧻 🚽 🚿 🛁 🧼 🪥 🪒 🧽 🧴 🛎️ 🔑 🗝️ 🚪 🪑 🛋️ 🛏️ 🧸 🪆 🖼️ 🪞 🪟 🛍️ 🛒 🎁 🎈 🎏 🎀 🪄 🪅 🎊 🎉 🎎 🏮 🎐 🧧 ✉️ 📩 📨 📧 💌 📥 📤 📦 🏷️ 📪 📬 📭 📮 📯 📜 📃 📄 📑 🧾 📊 📈 📉 🗒️ 🗓️ 📆 📅 🗑️ 📇 🗃️ 🗳️ 🗄️ 📋 📁 📂 🗂️ 🗞️ 📰 📓 📔 📒 📕 📗 📘 📙 📚 📖 🔖 🧷 🔗 📎 🖇️ 📐 📏 🧮 📌 📍 ✂️ 🖊️ 🖋️ ✒️ 🖌️ 🖍️ 📝 ✏️ 🔍 🔎 🔏 🔐 🔒 🔓'],
            ['❤️', 'Символы', '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❤️‍🔥 ❤️‍🩹 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ☮️ ✝️ ☪️ 🕉️ ☸️ ✡️ 🔯 ☯️ ☦️ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ ⚛️ ☢️ ☣️ 📴 📳 ✴️ 🆚 💮 🅰️ 🅱️ 🆎 🆑 🅾️ 🆘 ❌ ⭕ 🛑 ⛔ 📛 🚫 💯 💢 ♨️ 🔞 📵 🚭 ❗ ❕ ❓ ❔ ‼️ ⁉️ 🔅 🔆 ⚠️ 🚸 🔱 ⚜️ 🔰 ♻️ ✅ 💹 ❇️ ✳️ ❎ 🌐 💠 🌀 💤 🚾 ♿ 🅿️ 🚹 🚺 🚼 ⚧️ 🚻 🎦 📶 🔣 ℹ️ 🔤 🆖 🆗 🆙 🆒 🆕 🆓 🔟 🔢 ▶️ ⏸️ ⏹️ ⏺️ ⏭️ ⏮️ ⏩ ⏪ ◀️ 🔼 🔽 ➡️ ⬅️ ⬆️ ⬇️ ↗️ ↘️ ↙️ ↖️ ↕️ ↔️ ↪️ ↩️ ⤴️ ⤵️ 🔀 🔁 🔂 🔄 🔃 🎵 🎶 ➕ ➖ ➗ ✖️ ♾️ 💲 💱 ™️ ©️ ®️ 〰️ ➰ ➿ 🔚 🔙 🔛 🔝 🔜 ✔️ ☑️ 🔘 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🟤 🔺 🔻 🔸 🔹 🔶 🔷 🔳 🔲 ▪️ ▫️ ◾ ◽ ◼️ ◻️ 🟥 🟧 🟨 🟩 🟦 🟪 ⬛ ⬜ 🟫 🔈 🔇 🔉 🔊 🔔 🔕 📣 📢 💬 💭 🗯️ ♠️ ♣️ ♥️ ♦️ 🃏 🎴 🀄'],
            ['🏳️', 'Флаги', '🏳️ 🏴 🏁 🚩 🏳️‍🌈 🏳️‍⚧️ 🏴‍☠️ 🇷🇺 🇺🇦 🇧🇾 🇰🇿 🇺🇸 🇬🇧 🇩🇪 🇫🇷 🇮🇹 🇪🇸 🇵🇱 🇹🇷 🇯🇵 🇰🇷 🇨🇳 🇮🇳 🇧🇷 🇨🇦 🇦🇺 🇦🇲 🇬🇪 🇦🇿 🇺🇿 🇰🇬 🇹🇯 🇲🇩 🇱🇻 🇱🇹 🇪🇪 🇫🇮 🇸🇪 🇳🇴 🇩🇰 🇳🇱 🇧🇪 🇨🇭 🇦🇹 🇨🇿 🇸🇰 🇭🇺 🇷🇴 🇧🇬 🇷🇸 🇬🇷 🇮🇱 🇦🇪 🇪🇬 🇲🇽 🇦🇷 🇹🇭 🇻🇳 🇮🇩']
        ];
        const EMOJI_RECENT_MAX = 24;
        const emojiRecent = () => { const r = GM_getValue(acctKey('vp_emoji_recent'), []); return Array.isArray(r) ? r : []; };
        function emojiRemember(e) { GM_setValue(acctKey('vp_emoji_recent'), [e, ...emojiRecent().filter(x => x !== e)].slice(0, EMOJI_RECENT_MAX)); }
        const vpEmojiCss = addCss(`
        .vp-emoji { position: fixed; z-index: 2147483600; width: 280px; height: 380px; display: flex; flex-direction: column; border-radius: 18px; overflow: hidden;
            background: var(--block-bg); color: var(--text-primary, #fff); box-shadow: 0 12px 40px rgba(0, 0, 0, .45), 0 0 0 1px var(--border-color, rgba(255, 255, 255, .08));
            animation: vp-emoji-in .15s ease-out both; }
        .vp-emoji.vp-closing { animation: vp-emoji-out .15s ease-in both; }
        @keyframes vp-emoji-in { from { opacity: 0; transform: scale(.94); } }
        @keyframes vp-emoji-out { to { opacity: 0; transform: scale(.94); } }
        .vp-emoji-tabs { display: flex; gap: 2px; padding: 6px 6px 4px; border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, .08)); flex-shrink: 0; }
        .vp-emoji-tabs button { flex: 1; min-width: 0; height: 30px; border: 0; padding: 0; border-radius: 8px; background: transparent; font-size: 17px; line-height: 1; cursor: pointer;
            filter: grayscale(1); opacity: .6; transition: opacity .15s, filter .15s, background-color .15s; }
        .vp-emoji-tabs button:hover, .vp-emoji-tabs button.vp-on { filter: none; opacity: 1; background: var(--block-hover-bg, rgba(255, 255, 255, .06)); }
        .vp-emoji-body { flex: 1; overflow-y: auto; padding: 0 6px 8px; overscroll-behavior: contain; scrollbar-width: thin; }
        .vp-emoji-sec b { display: block; position: sticky; top: 0; padding: 8px 4px 4px; font-size: 12px; font-weight: 600; color: var(--text-secondary);
            background-color: var(--block-bg); z-index: 1; }
        .vp-emoji-grid { display: grid; grid-template-columns: repeat(8, 1fr); }
        .vp-emoji-grid button { aspect-ratio: 1; border: 0; padding: 0; border-radius: 8px; background: transparent; font-size: 22px; line-height: 1; cursor: pointer;
            font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif; transition: transform .1s, background-color .1s; }
        .vp-emoji-grid button:hover { background: var(--block-hover-bg, rgba(255, 255, 255, .08)); transform: scale(1.15); }
        .vp-emoji-empty { padding: 6px 4px; font-size: 12px; color: var(--text-secondary); }`);
        function attachEmojiPicker(btn, onPick) {
            let el = null, openT = 0, closeT = 0;
            const hover = matchMedia('(hover: hover) and (pointer: fine)').matches;
            const place = () => {
                const r = btn.getBoundingClientRect(), W = 280, H = 380, gap = 8;
                const top = innerHeight - r.bottom >= H + gap ? r.bottom + gap : Math.max(gap, r.top - H - gap);
                const left = innerWidth - r.left >= W || innerWidth - r.left > r.right ? Math.min(r.left, innerWidth - W - gap) : Math.max(gap, r.right - W);
                el.style.top = top + 'px';
                el.style.left = Math.max(gap, left) + 'px';
                el.style.transformOrigin = `${top < r.top ? 'bottom' : 'top'} ${left <= r.left ? 'left' : 'right'}`;
            };
            const outside = e => { if (el && !el.contains(e.target) && !btn.contains(e.target)) close(); };
            const onKey = e => { if (e.key === 'Escape' && el) { e.stopPropagation(); close(); } };
            function close() {
                clearTimeout(openT); clearTimeout(closeT);
                if (!el) return;
                const old = el;
                el = null;
                old.classList.add('vp-closing');
                setTimeout(() => old.remove(), 150);
                document.removeEventListener('pointerdown', outside, true);
                removeEventListener('keydown', onKey, true);
                removeEventListener('resize', close);
            }
            function later() { clearTimeout(closeT); closeT = setTimeout(close, 250); }
            function build() {
                el = document.createElement('div');
                el.className = 'vp-emoji';
                const recent = emojiRecent();
                const secs = [['🕘', 'Недавние', recent], ...EMOJI_SETS.map(([i, n, e]) => [i, n, e.split(' ')])];
                el.innerHTML = `<div class="vp-emoji-tabs">${secs.map(([i, n], k) => `<button type="button" title="${n}" data-k="${k}">${i}</button>`).join('')}</div><div class="vp-emoji-body"></div>`;
                const body = el.querySelector('.vp-emoji-body');
                secs.forEach(([, n, list], k) => {
                    const sec = document.createElement('section');
                    sec.className = 'vp-emoji-sec';
                    sec.dataset.k = k;
                    sec.innerHTML = '<b></b><div class="vp-emoji-grid"></div>';
                    sec.firstChild.textContent = n;
                    if (!list.length) sec.lastChild.outerHTML = '<div class="vp-emoji-empty">Здесь появятся эмодзи, которые ты выбирал</div>';
                    else sec.lastChild.innerHTML = list.map(e => `<button type="button">${e}</button>`).join('');
                    body.appendChild(sec);
                });
                const tabs = [...el.querySelectorAll('.vp-emoji-tabs button')];
                const mark = () => {
                    const y = body.scrollTop + 4;
                    let cur = 0;
                    body.querySelectorAll('.vp-emoji-sec').forEach(sc => { if (sc.offsetTop <= y) cur = +sc.dataset.k; });
                    tabs.forEach(t => t.classList.toggle('vp-on', +t.dataset.k === cur));
                };
                body.addEventListener('scroll', mark, { passive: true });
                el.querySelector('.vp-emoji-tabs').addEventListener('click', e => {
                    const t = e.target.closest('button');
                    if (!t) return;
                    const sc = body.querySelector(`.vp-emoji-sec[data-k="${t.dataset.k}"]`);
                    if (sc) body.scrollTo({ top: sc.offsetTop, behavior: 'smooth' });
                });
                body.addEventListener('click', e => {
                    const b = e.target.closest('.vp-emoji-grid button');
                    if (!b) return;
                    const em = b.textContent;
                    if (onPick(em) !== false) emojiRemember(em);
                });
                el.addEventListener('mousedown', e => e.preventDefault());
                if (hover) { el.addEventListener('mouseenter', () => clearTimeout(closeT)); el.addEventListener('mouseleave', later); }
                document.body.appendChild(el);
                place();
                if (!recent.length) body.scrollTop = body.querySelector('.vp-emoji-sec[data-k="1"]').offsetTop;
                mark();
                document.addEventListener('pointerdown', outside, true);
                addEventListener('keydown', onKey, true);
                addEventListener('resize', close);
            }
            btn.addEventListener('click', e => { e.preventDefault(); if (el) close(); else build(); });
            if (hover) {
                btn.addEventListener('mouseenter', () => { clearTimeout(closeT); if (!el) { clearTimeout(openT); openT = setTimeout(() => { if (!el) build(); }, 100); } });
                btn.addEventListener('mouseleave', () => { clearTimeout(openT); if (el) later(); });
            }
            return { close };
        }
        function buildMessagesOverlay() {
            const style = addCss(`
        .vp-msgs { position: fixed; z-index: 5; display: none; flex-direction: column; box-sizing: border-box; overflow: hidden;
            background: var(--block-bg); color: var(--text-primary, #fff); font-family: inherit;
            backdrop-filter: var(--vp-glass-filter, none); -webkit-backdrop-filter: var(--vp-glass-filter, none); }
        .vp-msgs.vp-open { display: flex; animation: vpMsgsIn .22s cubic-bezier(.2, .8, .2, 1); }
        html.vp-msgs-open .vp-msgs-navwrap { z-index: 10 !important; }
        html.vp-msgs-open .itd-scroll-top-btn { opacity: 0 !important; visibility: hidden !important; }
        html.vp-msgs-open .vp-comments-sheet { visibility: hidden !important; }
        html.vp-msgs-open .vp-nav-link.vp-site-cur { color: var(--vp-off-c) !important; opacity: var(--vp-off-o) !important; background-color: var(--vp-off-b) !important; }
        html.vp-msgs-open .vp-nav-link[href="#"] { color: var(--vp-on-c) !important; opacity: var(--vp-on-o) !important; background-color: var(--vp-on-b) !important; }
        .vp-msgs.vp-card { border-radius: 36px; border: 1px solid var(--border-color, rgba(255, 255, 255, .15));
            box-shadow: 0 16px 48px rgba(0, 0, 0, .45); }
        html.vp-light .vp-msgs.vp-card { box-shadow: 0 16px 48px rgba(0, 0, 0, .12); }
        .vp-msgs-under { position: fixed; top: 0; bottom: 0; z-index: 4; display: none; background: var(--bg-primary, #000); pointer-events: none; }
        html.vp-msgs-open .vp-msgs-under.vp-on { display: block; }
        .vp-msgs-view { display: flex; flex-direction: column; min-height: 0; flex: 1; }
        .vp-msgs-view[hidden] { display: none; }
        .vp-msgs-call[hidden], .vp-msgs-more[hidden] { display: none; }
        .vp-msgs-chead { position: relative; }
        .vp-msgs-hmenu { position: absolute; top: calc(100% - 4px); right: 12px; z-index: 5; min-width: 190px; padding: 6px; border-radius: 14px;
            background: #202024; box-shadow: 0 12px 34px rgba(0, 0, 0, .45), inset 0 0 0 1px rgba(128, 128, 128, .2); }
        .vp-msgs-hmenu[hidden] { display: none; }
        html.vp-light .vp-msgs-hmenu { background: #fff; }
        .vp-msgs-hmenu button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border: 0; border-radius: 10px; background: none;
            color: var(--text-primary, #fff); font: inherit; font-size: 14px; cursor: pointer; text-align: left; }
        .vp-msgs-hmenu button:hover { background: rgba(128, 128, 128, .16); }
        .vp-msgs-hmenu button.vp-danger { color: #f23f43; }
        .vp-msgs-blocked { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .vp-msgs-blocked button { padding: 6px 14px; border: 0; border-radius: 999px; background: rgba(128, 128, 128, .2); color: var(--text-primary, #fff);
            font: inherit; font-size: 13px; cursor: pointer; }
        .vp-msgs-blocked button:hover { background: rgba(128, 128, 128, .3); }
        .vp-msgs-callrow { align-self: center; display: flex; align-items: center; gap: 7px; width: fit-content; margin: 8px auto; padding: 6px 12px; border-radius: 14px;
            background: rgba(128, 128, 128, .14); color: var(--text-secondary, #b5bac1); font-size: 13px; cursor: pointer; }
        .vp-msgs-callrow:hover { background: rgba(128, 128, 128, .22); }
        .vp-msgs-callrow.vp-miss { color: #f23f43; }
        .vp-msgs-callrow time { opacity: .65; font-size: 12px; }
        .vp-msgs-top { display: flex; align-items: center; gap: 10px; padding: 18px 16px 10px; }
        .vp-msgs-title { font-size: 24px; font-weight: 700; margin-right: auto; }
        .vp-msgs-ib { width: 40px; height: 40px; border-radius: 50%; border: 0; padding: 0; display: flex; align-items: center; justify-content: center;
            cursor: pointer; background: var(--block-bg); color: var(--text-primary, #fff); flex-shrink: 0; }
        .vp-msgs-ib:active { transform: scale(.94); }
        .vp-msgs-search { margin: 0 16px 10px; display: flex; align-items: center; gap: 8px; padding: 0 14px; height: 42px; border-radius: 999px;
            background: var(--block-bg); color: var(--text-secondary); }
        .vp-msgs-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--text-primary, #fff); font: inherit; font-size: 15px; }
        .vp-msgs-sub { padding: 2px 20px 8px; font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .vp-msgs-ava img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .vp-msgs-who, .vp-msgs-chead .vp-msgs-ava { cursor: pointer; }
        .vp-msgs-list { flex: 1; overflow-y: auto; padding: 0 8px 12px; overscroll-behavior: contain; }
        .vp-msgs-row { display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: 18px; cursor: pointer; }
        .vp-msgs-row:hover, .vp-msgs-row:active { background: var(--block-bg); }
        .vp-msgs-ava { position: relative; width: 50px; height: 50px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
            font-size: 26px; background: var(--block-bg); }
        .vp-msgs-ava.vp-sm { width: 38px; height: 38px; font-size: 20px; }
        .vp-msgs-ava.vp-sup { color: #fff; background: linear-gradient(145deg, #ff5a5f, #d0202a); box-shadow: 0 0 0 2px rgba(255, 90, 95, .28), 0 4px 14px rgba(208, 32, 42, .4); }
        .vp-msgs-ava.vp-sup svg { width: 58%; height: 58%; stroke-width: 2.1; }
        .vp-msgs-row.vp-sup { background: linear-gradient(90deg, rgba(255, 70, 76, .2), rgba(255, 70, 76, .06)); box-shadow: inset 0 0 0 1px rgba(255, 90, 95, .32); }
        .vp-msgs-row.vp-sup:hover, .vp-msgs-row.vp-sup:active { background: linear-gradient(90deg, rgba(255, 70, 76, .3), rgba(255, 70, 76, .1)); }
        .vp-msgs-row.vp-sup + .vp-msgs-row { margin-top: 6px; }
        .vp-msgs-ava.vp-online::after { content: ""; position: absolute; right: 1px; bottom: 1px; width: 11px; height: 11px; border-radius: 50%;
            background: #22c55e; box-shadow: 0 0 0 2.5px var(--bg-primary, #000); }
        .vp-msgs-mid { flex: 1; min-width: 0; }
        .vp-msgs-name { display: flex; align-items: center; gap: 5px; font-weight: 600; font-size: 15px; }
        .vp-msgs-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-msgs-last { margin-top: 3px; font-size: 14px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-msgs-side > span:first-child { display: inline-flex; align-items: center; gap: 3px; }
        .vp-msgs-tick { display: inline-flex; font-style: normal; color: var(--text-secondary); }
        .vp-msgs-tick.vp-read { color: #4aa3ff; }
        .vp-msgs-lthumb { width: 18px; height: 18px; border-radius: 4px; object-fit: cover; vertical-align: -4px; margin-right: 6px; }
        .vp-msgs-side { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; font-size: 12px; color: var(--text-secondary); }
        .vp-msgs-badge { min-width: 20px; height: 20px; padding: 0 6px; box-sizing: border-box; border-radius: 999px; display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: 700; background: var(--vp-accent); color: var(--vp-on-accent, #fff); }
        .vp-msgs-pin { display: flex; color: var(--text-secondary); }
        .vp-msgs-row.vp-pinned { background: color-mix(in srgb, var(--text-primary, #fff) 4%, transparent); }
        .vp-msgs-row.vp-pinned + .vp-msgs-row:not(.vp-pinned) { margin-top: 6px; }
        .vp-msgs-row { -webkit-touch-callout: none; user-select: none; transition: transform .15s; }
        .vp-msgs-row.vp-held { transform: scale(.97); }
        .vp-msgs-ctx { position: absolute; z-index: 3; display: none; padding: 5px; border-radius: 16px; min-width: 170px;
            background: var(--block-bg); border: 1px solid var(--border-color, rgba(255, 255, 255, .1)); box-shadow: 0 10px 30px rgba(0, 0, 0, .45); }
        .vp-msgs-ctx.vp-open { display: block; animation: vpMsgsCtx .14s ease-out; }
        @keyframes vpMsgsCtx { from { opacity: 0; transform: scale(.94); } }
        .vp-msgs-ctx button { display: flex; align-items: center; gap: 10px; width: 100%; border: 0; background: none; color: var(--text-primary, #fff);
            font: inherit; font-size: 15px; padding: 10px 12px; border-radius: 12px; cursor: pointer; }
        .vp-msgs-ctx button:hover, .vp-msgs-ctx button:active { background: var(--bg-hover, rgba(255, 255, 255, .08)); }
        .vp-msgs-ctx svg { width: 16px; height: 16px; }
        .vp-msgs-empty { padding: 40px 16px; text-align: center; color: var(--text-secondary); font-size: 14px; }
        .vp-msgs-chead { display: flex; align-items: center; gap: 10px; padding: 12px 12px 10px;
            border-bottom: 1px solid color-mix(in srgb, var(--text-primary, #fff) 8%, transparent); }
        .vp-msgs-who { display: flex; flex-direction: column; min-width: 0; margin-right: auto; }
        .vp-msgs-who b { font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-msgs-who small { font-size: 12px; color: var(--text-secondary); }
        .vp-msgs-chat { position: relative; }
        .vp-msgs-down { position: absolute; right: 14px; bottom: 78px; z-index: 3; width: 42px; height: 42px; padding: 0; border: 0; border-radius: 50%; cursor: pointer;
            display: grid; place-items: center; color: var(--text-primary, #fff); background: var(--block-bg, #1f1f23);
            box-shadow: 0 6px 18px rgba(0, 0, 0, .35), inset 0 0 0 1px rgba(127, 127, 127, .25); transition: opacity .18s, transform .18s; }
        .vp-msgs-down[hidden] { display: grid !important; opacity: 0; transform: translateY(10px) scale(.9); pointer-events: none; }
        .vp-msgs-down span { position: absolute; top: -6px; right: -4px; min-width: 18px; height: 18px; padding: 0 5px; box-sizing: border-box; border-radius: 9px;
            font: 600 11px/18px system-ui, sans-serif; text-align: center; color: var(--vp-on-accent, #fff); background: var(--vp-accent, #3b82f6); }
        .vp-msgs-down span:empty { display: none; }
        .vp-msgs-feed { flex: 1; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; overscroll-behavior: contain; }
        .vp-msgs-note { align-self: center; margin: 2px 0 8px; padding: 6px 12px; border-radius: 999px; font-size: 12px;
            background: var(--block-bg); color: var(--text-secondary); text-align: center; }
        .vp-msgs-b { max-width: 78%; padding: 9px 13px 7px; border-radius: 20px; font-size: 15px; line-height: 1.35; overflow-wrap: anywhere;
            animation: vpMsgsPop .2s ease-out; }
        .vp-msgs-b.vp-in { align-self: flex-start; background: var(--block-bg); border-bottom-left-radius: 6px; }
        .vp-msgs-b.vp-out { align-self: flex-end; background: color-mix(in srgb, var(--vp-accent) 26%, var(--block-bg)); color: var(--text-primary, #fff);
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 45%, transparent); border-bottom-right-radius: 6px; }
        .vp-msgs-b a.vp-msgs-link { color: inherit; font-weight: inherit; text-decoration: underline !important; text-decoration-thickness: 1px !important; text-underline-offset: 3px; word-break: break-all; }
        .vp-msgs-b a.vp-msgs-link:hover { text-decoration-thickness: 2px !important; }
        .vp-msgs-b i { display: block; margin-top: 2px; font-style: normal; font-size: 11px; opacity: .6; text-align: right; white-space: nowrap; }
        .vp-msgs-b i[data-tick]::after { content: ""; display: inline-block; width: 16px; height: 11px; margin-left: 3px; vertical-align: -1px; background: currentColor;
            -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 11' fill='none' stroke='%23000' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 6 5.6 9.1 12.5 2.2'/%3E%3C/svg%3E") center / contain no-repeat;
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 11' fill='none' stroke='%23000' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 6 5.6 9.1 12.5 2.2'/%3E%3C/svg%3E") center / contain no-repeat; }
        .vp-msgs-b i[data-tick="2"]::after {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 11' fill='none' stroke='%23000' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M.8 6 3.9 9.1 10.8 2.2M7.4 8.1l1 1 6.9-6.9'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 11' fill='none' stroke='%23000' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M.8 6 3.9 9.1 10.8 2.2M7.4 8.1l1 1 6.9-6.9'/%3E%3C/svg%3E"); }
        .vp-msgs-b.vp-fail i { opacity: .85; }
        .vp-msgs-typing { display: flex; gap: 5px; padding: 14px 16px; }
        .vp-msgs-typing span { width: 7px; height: 7px; border-radius: 50%; background: var(--text-secondary); animation: vpMsgsDot 1s infinite; }
        .vp-msgs-typing span:nth-child(2) { animation-delay: .15s; } .vp-msgs-typing span:nth-child(3) { animation-delay: .3s; }
        .vp-msgs-bar { display: flex; align-items: flex-end; gap: 8px; padding: 10px 12px 12px; }
        .vp-msgs-field { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; padding: 0 6px 0 14px; min-height: 44px; border-radius: 22px;
            background: var(--block-bg); }
        .vp-msgs-field input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--text-primary, #fff); font: inherit; font-size: 15px; }
        .vp-msgs-b.vp-has-img { width: min-content; max-width: 78%; padding: 4px 4px 6px; }
        .vp-msgs-imgw { position: relative; display: block; margin: 0 0 6px; cursor: zoom-in; }
        .vp-msgs-imgw::after, .vp-msgs-lb-body::after { content: ''; position: absolute; inset: 0; }
        .vp-msgs-img { display: block; width: auto; height: auto; max-width: min(330px, 66vw); max-height: 420px; min-width: 120px; min-height: 60px;
            border-radius: 16px; background: rgba(127, 127, 127, .15); pointer-events: none; user-select: none; }
        .vp-msgs-lb { position: absolute; inset: 0; z-index: 30; display: flex; flex-direction: column; background: rgba(0, 0, 0, .92); border-radius: inherit;
            animation: vp-emoji-in .15s ease-out both; }
        .vp-msgs-lb-top { display: flex; align-items: center; gap: 8px; padding: 10px; flex-shrink: 0; }
        .vp-msgs-lb-top .vp-msgs-ib { color: #fff; background: rgba(255, 255, 255, .1); }
        .vp-msgs-lb-top span { color: rgba(255, 255, 255, .8); font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-msgs-lb-body { position: relative; flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 10px 14px; }
        .vp-msgs-lb-body img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 10px; pointer-events: none; user-select: none; }
        .vp-msgs-lb-top a { margin-left: auto; flex-shrink: 0; padding: 7px 12px; border-radius: 9999px; background: rgba(255, 255, 255, .1); color: #fff; font-size: 13px; text-decoration: none; }
        .vp-msgs-pend { display: flex; align-items: center; gap: 10px; padding: 6px 8px; margin: 0 0 6px; border-radius: 16px; background: var(--block-bg); }
        .vp-msgs-pend[hidden] { display: none; }
        .vp-msgs-pend-list { display: flex; gap: 8px; overflow-x: auto; flex: 0 1 auto; max-width: 62%; padding: 4px 4px 2px; scrollbar-width: thin; }
        .vp-msgs-pend .vp-msgs-pend-t { position: relative; flex-shrink: 0; }
        .vp-msgs-pend .vp-msgs-pend-t button { position: absolute; top: -5px; right: -5px; width: 20px; height: 20px; font-size: 10px; line-height: 20px; padding: 0;
            background: rgba(0, 0, 0, .7); color: #fff; }
        .vp-msgs-album { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; width: min(330px, 66vw); margin: 0 0 6px; border-radius: 16px; overflow: hidden; }
        .vp-msgs-album[data-n="2"], .vp-msgs-album[data-n="3"], .vp-msgs-album[data-n="4"] { grid-template-columns: repeat(2, 1fr); }
        .vp-msgs-album .vp-msgs-imgw { margin: 0; aspect-ratio: 1; }
        .vp-msgs-album .vp-wide2 { grid-column: span 2; aspect-ratio: 2 / 1; }
        .vp-msgs-album .vp-wide3 { grid-column: span 3; aspect-ratio: 3 / 1; }
        .vp-msgs-album[data-n] { grid-template-columns: repeat(6, 1fr); }
        .vp-msgs-album[data-n="2"], .vp-msgs-album[data-n="3"], .vp-msgs-album[data-n="4"] { grid-template-columns: repeat(2, 1fr); }
        .vp-msgs-album:not([data-n="2"]):not([data-n="3"]):not([data-n="4"]) > .vp-msgs-imgw { grid-column: span 2; }
        .vp-msgs-album:not([data-n="2"]):not([data-n="3"]):not([data-n="4"]) > .vp-half { grid-column: span 3; aspect-ratio: 3 / 2; }
        .vp-msgs-album:not([data-n="2"]):not([data-n="3"]):not([data-n="4"]) > .vp-wide3 { grid-column: span 6; }
        .vp-msgs-album .vp-msgs-img { width: 100%; height: 100%; max-width: none; max-height: none; min-width: 0; min-height: 0; object-fit: cover; border-radius: 0; }
        @media (hover: none) { .vp-msgs-feed .vp-msgs-b { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; } }
        .vp-msgs-reacts { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0 0; }
        .vp-msgs-reacts button { border: 0; border-radius: 9999px; padding: 2px 9px; font-size: 13px; line-height: 20px; cursor: pointer; color: inherit;
            background: rgba(127, 127, 127, .22); }
        .vp-msgs-reacts button.vp-mine-r { background: color-mix(in srgb, var(--vp-accent) 24%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 70%, transparent); }
        .vp-msgs-menu { position: fixed; z-index: 2147483600; min-width: 210px; padding: 6px; border-radius: 16px; background: var(--block-bg);
            color: var(--text-primary, #fff); box-shadow: 0 12px 40px rgba(0, 0, 0, .45), 0 0 0 1px var(--border-color, rgba(255, 255, 255, .08)); animation: vp-emoji-in .12s ease-out both; }
        .vp-msgs-menu-r { display: flex; gap: 2px; padding: 2px 2px 6px; margin-bottom: 4px; border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, .08)); }
        .vp-msgs-menu-r button { width: 36px; height: 36px; border: 0; padding: 0; border-radius: 50%; background: transparent; font-size: 21px; cursor: pointer; transition: transform .1s; }
        .vp-msgs-menu-r button:hover { transform: scale(1.2); background: rgba(127, 127, 127, .15); }
        .vp-msgs-menu-i { display: block; width: 100%; text-align: left; border: 0; background: transparent; color: inherit; font: inherit; font-size: 14px; padding: 9px 12px; border-radius: 10px; cursor: pointer; }
        .vp-msgs-menu-i:hover { background: rgba(127, 127, 127, .15); }
        .vp-msgs-lb-n { color: rgba(255, 255, 255, .8); font-size: 13px; font-weight: 600; margin-left: auto; flex-shrink: 0; }
        .vp-msgs-lb-n:empty { display: none; }
        .vp-msgs-lb-n:not(:empty) + a { margin-left: 8px; }
        .vp-msgs-lb-nav { position: absolute; top: 50%; z-index: 1; width: 44px; height: 44px; margin-top: -22px; border: 0; border-radius: 50%; cursor: pointer;
            background: rgba(255, 255, 255, .14); color: #fff; font-size: 26px; line-height: 40px; padding: 0; }
        .vp-msgs-lb-nav[hidden] { display: none; }
        .vp-msgs-lb-nav.vp-prev { left: 12px; } .vp-msgs-lb-nav.vp-next { right: 12px; }
        .vp-msgs-lb-nav { top: 0; bottom: 0; width: 20%; max-width: 180px; height: auto; margin: 0; border-radius: 0; background: none; font-size: 0; transition: background .2s; -webkit-tap-highlight-color: transparent; }
        .vp-msgs-lb-nav.vp-prev { left: 0; }
        .vp-msgs-lb-nav.vp-next { right: 0; }
        .vp-msgs-lb-nav.vp-prev:active { background: linear-gradient(90deg, rgba(255, 255, 255, .16), transparent); }
        .vp-msgs-lb-nav.vp-next:active { background: linear-gradient(270deg, rgba(255, 255, 255, .16), transparent); }
        @media (hover: hover) and (pointer: fine) {
            .vp-msgs-lb-nav.vp-prev:hover { background: linear-gradient(90deg, rgba(255, 255, 255, .12), transparent); }
            .vp-msgs-lb-nav.vp-next:hover { background: linear-gradient(270deg, rgba(255, 255, 255, .12), transparent); }
        }
        .vp-msgs-pend img { width: 52px; height: 52px; object-fit: cover; border-radius: 10px; flex-shrink: 0; }
        .vp-msgs-pend span { flex: 1; min-width: 0; font-size: 13px; color: var(--text-secondary); }
        .vp-msgs-pend button { width: 30px; height: 30px; border: 0; border-radius: 50%; background: rgba(127, 127, 127, .2); color: var(--text-primary, #fff); cursor: pointer; flex-shrink: 0; }
        .vp-msgs-b.vp-has-img { overflow-wrap: anywhere; }
        .vp-msgs-b.vp-has-img > i { margin-right: 6px; }
        .vp-msgs-cap { display: block; padding: 0 8px; }
        .vp-msgs-count { font-size: 12px; color: var(--text-secondary); white-space: nowrap; font-variant-numeric: tabular-nums; flex-shrink: 0; }
        .vp-msgs-count.vp-warn { color: #ff5c5c; }
        .vp-msgs-ghost { width: 36px; height: 36px; border: 0; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            background: transparent; color: var(--text-secondary); cursor: pointer; flex-shrink: 0; }
        .vp-msgs-send { width: 44px; height: 44px; border: 0; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;
            flex-shrink: 0; background: var(--vp-accent); color: var(--vp-on-accent, #fff); transition: opacity .15s, transform .15s; }
        .vp-msgs-send:disabled { opacity: .4; cursor: default; }
        .vp-msgs-send:not(:disabled):active { transform: scale(.92); }
        @keyframes vpMsgsIn { from { opacity: 0; transform: translateY(10px); } }
        @keyframes vpMsgsPop { from { opacity: 0; transform: translateY(6px) scale(.98); } }
        @keyframes vpMsgsDot { 0%, 60%, 100% { opacity: .35; transform: none; } 30% { opacity: 1; transform: translateY(-3px); } }
        @media (prefers-reduced-motion: reduce) { .vp-msgs, .vp-msgs * { animation: none !important; } }
        html.vp-msgs-open video { visibility: hidden !important; }`);

            const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
            const root = document.createElement('div');
            root.className = 'vp-msgs';
            const blockOuterScroll = e => {
                const area = e.target.closest && e.target.closest('.vp-msgs-list, .vp-msgs-feed, textarea');
                if (!area || area.scrollHeight <= area.clientHeight) e.preventDefault();
            };
            root.addEventListener('wheel', blockOuterScroll, { passive: false });
            root.addEventListener('touchmove', blockOuterScroll, { passive: false });
            root.setAttribute('role', 'region');
            root.setAttribute('aria-label', 'Сообщения');
            root.innerHTML = `
            <section class="vp-msgs-view vp-msgs-home">
                <div class="vp-msgs-top"><div class="vp-msgs-title">Сообщения <span class="vp-msgs-beta" title="Сообщения в бета-версии: возможны сбои — пиши в «Поддержку»">Beta</span></div>
                    <button class="vp-msgs-ib vp-msgs-new" title="Новый чат (пока не работает)">${MSG_ICON.edit}</button></div>
                <label class="vp-msgs-search">${MSG_ICON.search}<input type="search" placeholder="Поиск"></label>
                <div class="vp-msgs-sub"></div>
                <div class="vp-msgs-list"></div>
            </section>
            <section class="vp-msgs-view vp-msgs-chat" hidden>
                <div class="vp-msgs-chead"><button class="vp-msgs-ib vp-msgs-back" title="Назад">${MSG_ICON.back}</button>
                    <div class="vp-msgs-ava vp-sm"></div><div class="vp-msgs-who"><b></b><small></small></div>
                    <button class="vp-msgs-ib vp-msgs-call" title="Позвонить">${MSG_ICON.call}</button><button class="vp-msgs-ib vp-msgs-more" title="Ещё">${MSG_ICON.more}</button>
                    <div class="vp-msgs-hmenu" hidden></div></div>
                <div class="vp-msgs-feed" aria-live="polite"></div>
                <button type="button" class="vp-msgs-down" title="Вниз" hidden>${svgIcon('<path d="m6 9 6 6 6-6"/>', 22)}<span></span></button>
                <form class="vp-msgs-bar"><div class="vp-msgs-field"><button type="button" class="vp-msgs-ghost vp-msgs-attach" title="Картинка">${MSG_ICON.clip}</button>
                    <input type="text" placeholder="Сообщение" enterkeyhint="send" autocomplete="off"><span class="vp-msgs-count" hidden></span>
                    <button type="button" class="vp-msgs-ghost vp-msgs-emoji" title="Эмодзи">${MSG_ICON.smile}</button></div>
                    <button type="submit" class="vp-msgs-send" title="Отправить" disabled>${MSG_ICON.send}</button><input type="file" class="vp-msgs-file" accept="image/png,image/jpeg,image/webp,image/gif" hidden></form>
            </section>`;
            document.body.appendChild(root);
            const under = document.createElement('div');
            under.className = 'vp-msgs-under';
            document.body.appendChild(under);

            const $ = s => root.querySelector(s);
            const downBtn = root.querySelector('.vp-msgs-down'), downNum = downBtn.lastElementChild;
            let downNew = 0;
            const feedEl = root.querySelector('.vp-msgs-feed');
            const downSync = () => {
                const far = feedEl.scrollHeight - feedEl.scrollTop - feedEl.clientHeight > 320;
                if (!far) downNew = 0;
                downBtn.hidden = !far;
                downNum.textContent = downNew ? (downNew > 99 ? '99+' : String(downNew)) : '';
            };
            feedEl.addEventListener('scroll', downSync, { passive: true });
            downBtn.addEventListener('click', () => { downNew = 0; feedEl.scrollTo({ top: feedEl.scrollHeight, behavior: 'smooth' }); });
            const list = $('.vp-msgs-list'), home = $('.vp-msgs-home'), chat = $('.vp-msgs-chat'), feed = $('.vp-msgs-feed');
            const input = $('.vp-msgs-bar input'), send = $('.vp-msgs-send'), search = $('.vp-msgs-search input');
            const countEl = $('.vp-msgs-count');
            const msgCount = () => {
                const n = input.value.length, max = input.maxLength > 0 ? input.maxLength : MSG_TEXT_MAX;
                countEl.hidden = !n;
                countEl.textContent = `${n} / ${max}`;
                countEl.classList.toggle('vp-warn', n >= max * 0.9);
            };
            let current = null, botTimer = 0;
            const SUP_AVA = svgIcon('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.6"/><path d="m5.6 5.6 3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9"/>', 28);
            const avaHtml = a => a === '🛟' ? SUP_AVA : isUrl(a) ? `<img src="${esc(a)}" alt="">` : esc(a);

            let supDir = false;
            function renderList() {
                const q = search.value.trim().toLowerCase();
                const pins = msgPins();
                let rows = sortDialogs(MSG_DIALOGS).filter(d => !q || (d.name + ' ' + d.login + ' ' + d.last).toLowerCase().includes(q));
                const people = MSG_DIALOGS.filter(d => d.login).length;
                const sups = msgIsSupport() ? sortDialogs(MSG_DIALOGS.filter(d => d.supUid)) : [];
                if (sups.length && !q) {
                    if (supDir) rows = [{ id: '@back', ava: '←', name: 'Все чаты', last: `Обращения в поддержку: ${sups.length}`, time: '', unread: 0 }, ...sups.map(d => Object.assign({}, d, { name: d.name.replace(/^🛟\s*/, '') }))];
                    else {
                        const top = sups.reduce((a, d) => (d.lastTs || 0) > (a.lastTs || 0) ? d : a, sups[0]);
                        const opened = msgOpened(), act = d => Math.max(d.lastTs || 0, opened[d.id] || 0), fAct = Math.max(...sups.map(act));
                        const folder = { id: '@sup', ava: '🛟', name: 'Поддержка', last: top.last ? top.name.replace(/^🛟\s*/, '') + ': ' + top.last : `обращений: ${sups.length}`,
                            time: top.time || '', lastTs: top.lastTs || 0, unread: sups.reduce((n, d) => n + (d.unread || 0), 0) };
                        rows = rows.filter(d => !d.supUid);
                        const at = rows.findIndex(d => !pins.includes(d.id) && act(d) < fAct);
                        rows.splice(at < 0 ? rows.length : at, 0, folder);
                    }
                }
                if (!sups.length) supDir = false;
                $('.vp-msgs-sub').textContent = supDir && sups.length && !q ? 'Все, кто писал в поддержку' : people ? `Поддержка и ${people} ${plural(people, 'человек', 'человека', 'человек')} с ИТД X` : 'Пока никого с ИТД X — список обновится сам';
                list.innerHTML = rows.length ? rows.map(d => `
                <div class="vp-msgs-row${pins.includes(d.id) ? ' vp-pinned' : ''}${d.ava === '🛟' ? ' vp-sup' : ''}" data-id="${d.id}">
                    <div class="vp-msgs-ava${d.online ? ' vp-online' : ''}${d.ava === '🛟' ? ' vp-sup' : ''}">${avaHtml(d.ava)}</div>
                    <div class="vp-msgs-mid"><div class="vp-msgs-name"><span>${esc(d.name)}</span></div>
                        <div class="vp-msgs-last">${d.lastImg ? `<img class="vp-msgs-lthumb" src="${esc(d.lastImg)}" alt="" loading="lazy">` : ''}${esc(d.last)}</div></div>
                    <div class="vp-msgs-side"><span>${d.tick ? `<i class="vp-msgs-tick${d.tick === 2 ? ' vp-read' : ''}" title="${d.tick === 2 ? 'Прочитано' : 'Доставлено'}">${d.tick === 2 ? MSG_ICON.tick2 : MSG_ICON.tick1}</i>` : ''}${esc(d.time)}</span>${d.unread ? `<span class="vp-msgs-badge">${d.unread}</span>`
                        : pins.includes(d.id) ? `<span class="vp-msgs-pin" title="Закреплён">${MSG_ICON.pin}</span>` : ''}</div>
                </div>`).join('') : '<div class="vp-msgs-empty">Ничего не нашлось</div>';
            }
            const now = () => new Date().toTimeString().slice(0, 5);
            function setMeta(i, str) {
                const m = String(str).match(/^(.*?)\s*(✓✓|✓)$/), txt = m ? m[1] : String(str);
                if (i.textContent !== txt) i.textContent = txt;
                if (m) { if (i.dataset.tick !== String(m[2].length)) i.dataset.tick = m[2].length; } else if (i.hasAttribute('data-tick')) i.removeAttribute('data-tick');
            }
            const MSG_LINK_RE = /(?:https?:\/\/|(?<![\w.\/@-])(?:xn--d1ah4a\.com|итд\.com)\/)[^\s<>"'«»]+/gi;
            function msgText(el, text) {
                const str = String(text || '');
                let at = 0, box = null;
                for (const m of str.matchAll(MSG_LINK_RE)) {
                    const raw = m[0].replace(/[.,!?:;)\]]+$/, ''), end = m.index + raw.length;
                    let u;
                    try { u = new URL(/^https?:/i.test(raw) ? raw : 'https://' + raw); } catch (e) { continue; }
                    if (!/^https?:$/.test(u.protocol)) continue;
                    if (!box) { box = document.createElement('span'); box.className = 'vp-msgs-t'; }
                    if (m.index > at) box.append(str.slice(at, m.index));
                    const a = document.createElement('a'), own = u.hostname === location.hostname || u.hostname === 'xn--d1ah4a.com';
                    a.href = u.href;
                    a.textContent = raw.replace(/^(https?:\/\/)?xn--d1ah4a\.com/i, 'итд.com');
                    a.className = 'vp-msgs-link';
                    if (own) a.addEventListener('click', e => {
                        if (e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                        e.preventDefault();
                        e.stopPropagation();
                        close(true);
                        history.pushState({}, '', u.pathname + u.search + u.hash);
                        dispatchEvent(new PopStateEvent('popstate'));
                    });
                    else { a.target = '_blank'; a.rel = 'noopener noreferrer nofollow'; a.addEventListener('click', e => e.stopPropagation()); }
                    box.appendChild(a);
                    at = end;
                }
                if (!box) { el.append(str); return; }
                if (at < str.length) box.append(str.slice(at));
                el.appendChild(box);
            }
            function msgBody(el, text) {
                const m = String(text || '').match(/^> ([^\n]*)(?:\n([\s\S]*))?$/);
                if (!m) { msgText(el, text); return; }
                const q = document.createElement('span');
                q.className = 'vp-msgs-quote';
                const i = m[1].indexOf(': ');
                if (i > 0 && i < 40) { const n = document.createElement('b'); n.textContent = m[1].slice(0, i); q.append(n, m[1].slice(i + 2)); } else q.textContent = m[1];
                el.appendChild(q);
                if (m[2]) { const r = document.createElement('span'); r.className = 'vp-msgs-rest'; msgText(r, m[2]); el.appendChild(r); }
            }
            function bubble(dir, text, meta, imgUrl) {
                const urls = !imgUrl ? [] : Array.isArray(imgUrl) ? imgUrl : [imgUrl];
                const b = document.createElement('div');
                b.className = 'vp-msgs-b vp-' + dir + (urls.length ? ' vp-has-img' : '');
                if (!urls.length) msgBody(b, text);
                if (urls.length) {
                    const cell = (u, i) => {
                        const wrap = document.createElement('span');
                        wrap.className = 'vp-msgs-imgw';
                        const im = document.createElement('img');
                        im.className = 'vp-msgs-img';
                        im.src = u; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.draggable = false;
                        im.addEventListener('load', () => { if (feed.scrollHeight - feed.scrollTop - feed.clientHeight < 400) feed.scrollTop = feed.scrollHeight; }, { once: true });
                        wrap.appendChild(im);
                        wrap.addEventListener('click', () => openImg(urls, i, text, [...wrap.closest('.vp-msgs-b').querySelectorAll('.vp-msgs-img')]));
                        return wrap;
                    };
                    let box;
                    if (urls.length === 1) box = cell(urls[0], 0);
                    else {
                        box = document.createElement('div');
                        box.className = 'vp-msgs-album';
                        box.dataset.n = urls.length;
                        urls.forEach((u, i) => box.appendChild(cell(u, i)));
                        const n = urls.length, cols = n === 2 || n === 4 || n === 3 ? 2 : 3;
                        if (n === 3) box.firstChild.classList.add('vp-wide2');
                        else if (cols === 3 && n % 3 === 1) box.lastChild.classList.add('vp-wide3');
                        else if (cols === 3 && n % 3 === 2) { box.lastChild.classList.add('vp-half'); box.lastChild.previousSibling.classList.add('vp-half'); }
                    }
                    b.prepend(box);
                    if (text) { const cap = document.createElement('span'); cap.className = 'vp-msgs-cap'; msgBody(cap, text); box.after(cap); }
                }
                const i = document.createElement('i');
                setMeta(i, meta || now());
                b.appendChild(i);
                feed.appendChild(b);
                feed.scrollTop = feed.scrollHeight;
                return b;
            }
            let chatBackPending = false;
            function openChat(d, fromHistory) {
                if (fromHistory !== true && !chatBackPending && root.classList.contains('vp-open')) {
                    const st = Object.assign({}, history.state, { vpChat: d.id });
                    history[overlayAt('vpChat') ? 'replaceState' : 'pushState'](st, '', location.href);
                }
                if (current !== d) clearPending();
                blockUi(null);
                $('.vp-msgs-hmenu').hidden = true;
                $('.vp-msgs-more').hidden = !d.login || !!d.support || !!d.supUid;
                current = d;
                downNew = 0;
                selEnd(); clearReply(); closeFwd(); pinEl.hidden = true; pinIdx = 0;
                d.unread = 0;
                msgMarkOpened(d.id);
                $('.vp-msgs-chead .vp-msgs-ava').innerHTML = avaHtml(d.ava);
                $('.vp-msgs-chead .vp-msgs-ava').classList.toggle('vp-online', !!d.online);
                $('.vp-msgs-chead .vp-msgs-ava').classList.toggle('vp-sup', d.ava === '🛟');
                $('.vp-msgs-who b').textContent = d.name;
                const seenAgo = t => {
                    const d0 = new Date(t); if (isNaN(d0)) return ''; const h = d0.toTimeString().slice(0, 5);
                    return d0.toDateString() === new Date().toDateString() ? 'в ' + h : `${d0.getDate()}.${String(d0.getMonth() + 1).padStart(2, '0')} в ${h}`;
                };
                $('.vp-msgs-who small').textContent = d.support ? 'поддержка · на связи' : d.supUid ? 'обращение в поддержку'
                    : '@' + d.login + ' · ' + (d.online ? 'в сети' : d.lastSeen && seenAgo(d.lastSeen) ? 'был(а) в сети ' + seenAgo(d.lastSeen) : 'с ИТД X');
                $('.vp-msgs-call').hidden = !d.login || !!d.support || !!d.supUid;
                if (d.login || d.support || d.supUid) { home.hidden = true; chat.hidden = false; input.value = ''; send.disabled = true; msgCount(); msgOpenPerson(d); return; }
                feed.innerHTML = (d.msgs.length ? '<div class="vp-msgs-note">Сегодня</div>' : `<div class="vp-msgs-note">Это начало переписки с ${esc(d.name)}</div>`);
                d.msgs.forEach(([dir, text]) => bubble(dir, text, dir === 'out' ? now() + ' ✓✓' : now()));
                home.hidden = true; chat.hidden = false;
                input.value = ''; send.disabled = true; msgCount();
            }
            const note = (t, ico) => { const n = document.createElement('div'); n.className = 'vp-msgs-note'; if (ico) n.insertAdjacentHTML('afterbegin', uiIcon(ico, 14)); n.appendChild(document.createTextNode(t)); feed.appendChild(n); return n; };
            let stickUntil = 0;
            const stickEnd = () => {
                stickUntil = Date.now() + 2500;
                feed.scrollTop = feed.scrollHeight;
                requestAnimationFrame(() => { if (Date.now() < stickUntil) feed.scrollTop = feed.scrollHeight; });
            };
            feed.addEventListener('load', () => { if (Date.now() < stickUntil) feed.scrollTop = feed.scrollHeight; }, true);
            ['wheel', 'touchstart', 'keydown'].forEach(t => feed.addEventListener(t, () => { stickUntil = 0; }, { passive: true }));
            let renderN = 0;
            async function msgOpenPerson(d) {
                const my = ++renderN;
                feed.textContent = ''; input.disabled = true; input.maxLength = MSG_TEXT_MAX;
                const wait = note('Загрузка переписки…', 'lock');
                try { await msgSync(); } catch (e) { if (my === renderN) wait.textContent = 'Не загрузилось — открой чат ещё раз'; logErr('сообщения', e); return; }
                if (current !== d || my !== renderN) return;
                if (d.login && !d.support && !isApprovedId(msgMyId())) {
                    feed.textContent = '';
                    note('Переписка с людьми откроется, когда разработчик подтвердит твою галочку ИТД X. Поддержка работает уже сейчас.', 'lock');
                    return;
                }
                if (!msgNet.me) return msgKeyForm(d);
                feed.textContent = '';
                note('Сквозное шифрование: переписку можете прочитать только вы двое', 'lock');
                const t = msgTarget(d);
                if (!t.uid) { note(t.missing); return; }
                const list = msgThread(t);
                if (!list.length) note(d.support ? 'Опиши проблему или идею — ответ придёт сюда' : `Это начало переписки с ${d.name}`).classList.add('vp-msgs-first');
                list.forEach(m => {
                    const b = bubble(m.dir, m.text, msgMetaText(t, m), (m.imgs || (m.img ? [m.img] : [])).map(msgImgUrl));
                    b._m = m; b.dataset.ts = m.ts; b.dataset.dir = m.dir;
                    paintReacts(b, t.uid);
                });
                paintCalls(t);
                paintPin(t);
                d.shown = list.length; d.sig = chatSig(t.uid);
                input.disabled = false; input.focus();
                stickEnd();
                msgReadNow(d, t, list);
                blockUi(d, t);
            }
            const msgMetaText = (t, m) => msgTime(m.at || m.ts) + (m.dir === 'out' ? (readUpTo(t.uid, t.sup, 'them') >= m.ts ? ' ✓✓' : ' ✓') : '');
            function msgRefreshChat(d) {
                const t = msgTarget(d);
                if (input.dataset.vpBlocked && t.uid) blockUi(d, t);
                if (!t.uid || !msgNet.me || input.disabled) return;
                blockUi(d, t);
                if (input.disabled) return;
                const list = msgThread(t), have = new Map();
                feed.querySelectorAll(':scope > .vp-msgs-b[data-ts]').forEach(b => { const k = b.dataset.dir + '|' + b.dataset.ts; if (!have.has(k)) have.set(k, []); have.get(k).push(b); });
                const nearEnd = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 80, keep = feed.scrollTop;
                let prev = null, added = 0;
                for (const m of list) {
                    let b = (have.get(m.dir + '|' + m.ts) || []).shift();
                    if (b) setMeta(b.lastChild, msgMetaText(t, m));
                    else {
                        b = bubble(m.dir, m.text, msgMetaText(t, m), (m.imgs || (m.img ? [m.img] : [])).map(msgImgUrl));
                        b.dataset.ts = m.ts; b.dataset.dir = m.dir; added++;
                    }
                    b._m = m;
                    const sig = JSON.stringify(msgNet.reacts && msgNet.reacts.get(reactKey(t.uid, m.dir, m.ts)) || null);
                    if (b._rs !== sig) { b._rs = sig; paintReacts(b, t.uid); }
                    const want = prev ? prev.nextElementSibling : feed.querySelector(':scope > .vp-msgs-b');
                    if (want !== b) { if (prev) prev.after(b); else feed.insertBefore(b, want); }
                    prev = b;
                }
                have.forEach(arr => arr.forEach(x => x.remove()));
                if (added) feed.querySelectorAll(':scope > .vp-msgs-note.vp-msgs-first').forEach(n => n.remove());
                feed.scrollTop = nearEnd ? feed.scrollHeight : keep;
                if (added && !nearEnd && d.shown) downNew += list.slice(-added).filter(m => m.dir === 'in').length;
                downSync();
                paintCalls(t);
                paintPin(t);
                d.shown = list.length; d.sig = chatSig(t.uid);
                msgReadNow(d, t, list);
            }
            function msgReadNow(d, t, list) {
                if (document.hidden) return;
                msgMarkSeen(t); d.unread = 0; msgBadge();
                const inTs = lastInTs(list);
                if (inTs && inTs > readUpTo(t.uid, t.sup)) {
                    const r = msgNet.reads.get(t.uid) || { me: 0, them: 0 };
                    r.me = Math.max(r.me, inTs); r[t.sup ? 'me1' : 'me0'] = inTs; msgNet.reads.set(t.uid, r);
                    msgSendRead(t.uid, inTs, t.sup).catch(e => logErr('прочитано', e));
                }
            }
            function msgKeyForm(d) {
                const has = !!msgNet.keys.get(msgMyId());
                feed.innerHTML = `<form class="vp-msgs-key"><div class="vp-msgs-note"></div><input type="password" minlength="8" required>`
                    + (has ? '' : '<input type="password" minlength="8" required>') + `<button type="submit"></button><div class="vp-msgs-keyerr"></div></form>`;
                const f = feed.firstChild, [p1, p2] = f.querySelectorAll('input'), err = f.querySelector('.vp-msgs-keyerr'), btn = f.querySelector('button');
                f.firstChild.insertAdjacentHTML('afterbegin', uiIcon('lock', 14));
                f.firstChild.appendChild(document.createTextNode(has ? 'Введи пароль сообщений — он откроет твой ключ на этом устройстве'
                    : 'Придумай пароль для сообщений: им шифруется твой ключ, с ним переписка откроется на любом устройстве. Лучше несколько слов или 10+ символов — простой пароль можно подобрать. Забудешь — старые сообщения не прочитать'));
                p1.placeholder = 'Пароль'; p1.autocomplete = has ? 'current-password' : 'new-password';
                if (p2) { p2.placeholder = 'Ещё раз'; p2.autocomplete = 'new-password'; }
                btn.textContent = has ? 'Открыть' : 'Создать ключ';
                f.addEventListener('submit', async e => {
                    e.preventDefault();
                    if (p2 && p1.value !== p2.value) { err.textContent = 'Пароли не совпадают'; return; }
                    btn.disabled = true; err.textContent = has ? 'Открываю…' : 'Создаю ключ…';
                    try { has ? await msgUnlock(p1.value) : await msgCreateKey(p1.value); msgOpenPerson(d); }
                    catch (x) { err.textContent = x.message || 'Не вышло'; btn.disabled = false; }
                });
                p1.focus();
            }
            const msgPoll = sched.add('msgPoll', async () => {
                if (!root.isConnected) return msgPoll.remove();
                if (!msgsOpen || !msgNet.me || apiPaused()) return;
                if (Date.now() - callNet.lastSync > 12000) { callNet.lastSync = Date.now(); try { await msgSync(); } catch (e) { return; } }
                msgFillDialogs();
                if (!current) return renderList();
                const tt = msgTarget(current), list = msgThread(tt);
                if (list.length !== current.shown || chatSig(tt.uid) !== current.sig) msgRefreshChat(current);
            }, { every: 20000, net: true });
            root.refreshList = () => { if (!current) { msgFillDialogs(); renderList(); } };
            const onSynced = () => {
                if (!root.isConnected) return document.removeEventListener('vp-msg-synced', onSynced);
                if (!msgsOpen || !current || !msgNet.me) return;
                msgFillDialogs();
                const tt = msgTarget(current);
                if (!tt.uid) return;
                if (msgThread(tt).length !== current.shown || chatSig(tt.uid) !== current.sig) msgRefreshChat(current);
            };
            document.addEventListener('vp-msg-synced', onSynced);
            document.addEventListener('visibilitychange', () => {
                if (document.hidden || !root.isConnected || !msgsOpen || !current || !msgNet.me) return;
                const tt = msgTarget(current);
                if (tt.uid) msgReadNow(current, tt, msgThread(tt));
            });
            root.refreshCalls = () => {
                if (!current || current.support || current.supUid || !msgNet.me) return;
                const t = msgTarget(current);
                if (!t.uid) return;
                blockUi(current, t);
                if (input.disabled) return;
                const near = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 80;
                const n = feed.querySelectorAll(':scope > .vp-msgs-callrow').length;
                paintCalls(t);
                if (near && feed.querySelectorAll(':scope > .vp-msgs-callrow').length !== n) feed.scrollTop = feed.scrollHeight;
            };
            root.openDialog = (id, fromHistory) => {
                msgFillDialogs();
                const d = MSG_DIALOGS.find(x => x.id === id) || (id.startsWith('u:') && msgPeople.get(id.slice(2)));
                if (d) openChat(d, fromHistory);
            };
            root.currentTarget = () => current ? msgTarget(current) : null;
            function closeChat(fromHistory) {
                clearPending();
                closeImg(true, true);
                closeMenu();
                selEnd(); clearReply(); closeFwd(); pinEl.hidden = true;
                if (fromHistory !== true && current && overlayAt('vpChat')) { chatBackPending = true; history.back(); }
                clearTimeout(botTimer);
                if (current && msgNet.me) msgSync().then(() => { msgFillDialogs(); msgBadge(); if (!current) renderList(); }).catch(() => { });
                current = null;
                chat.hidden = true; home.hidden = false;
                renderList();
            }
            function supportReply() {
                const typing = document.createElement('div');
                typing.className = 'vp-msgs-b vp-in vp-msgs-typing';
                typing.innerHTML = '<span></span><span></span><span></span>';
                feed.appendChild(typing);
                feed.scrollTop = feed.scrollHeight;
                botTimer = setTimeout(() => {
                    typing.remove();
                    supportTicket = supportTicket || 1000 + (Math.random() * 9000 | 0);
                    bubble('in', `Приняли, обращение №${supportTicket++}. Ответим, как только личка заработает — а по-настоящему сейчас быстрее в тг @NeuroSFW`);
                }, 900 + Math.random() * 700);
            }

            const ctx = document.createElement('div');
            ctx.className = 'vp-msgs-ctx';
            root.appendChild(ctx);
            const hideCtx = () => ctx.classList.remove('vp-open');
            function showCtx(row, x, y) {
                const id = row.dataset.id, pinned = msgPins().includes(id);
                ctx.innerHTML = `<button type="button">${MSG_ICON.pin}<span>${pinned ? 'Открепить' : 'Закрепить'}</span></button>`;
                ctx.firstChild.onclick = (e) => {
                    e.stopPropagation();
                    const pins = msgPins().filter(p => p !== id);
                    if (!pinned) pins.push(id);
                    GM_setValue(acctKey('msgPins'), pins);
                    hideCtx();
                    renderList();
                };
                const rr = root.getBoundingClientRect();
                ctx.classList.add('vp-open');
                ctx.style.left = Math.max(8, Math.min(x - rr.left, rr.width - ctx.offsetWidth - 8)) + 'px';
                ctx.style.top = Math.max(8, Math.min(y - rr.top, rr.height - ctx.offsetHeight - 8)) + 'px';
                row.classList.add('vp-held');
                setTimeout(() => row.classList.remove('vp-held'), 250);
            }
            let holdT = 0, held = false, holdAt = null;
            list.addEventListener('pointerdown', e => {
                const r = e.target.closest('.vp-msgs-row');
                if (!r || e.button > 0 || r.dataset.id[0] === '@') return;
                held = false; holdAt = [e.clientX, e.clientY];
                clearTimeout(holdT);
                holdT = setTimeout(() => { held = true; if (navigator.vibrate) navigator.vibrate(12); showCtx(r, holdAt[0], holdAt[1]); }, 450);
            });
            list.addEventListener('pointermove', e => { if (holdAt && Math.hypot(e.clientX - holdAt[0], e.clientY - holdAt[1]) > 8) clearTimeout(holdT); });
            ['pointerup', 'pointercancel'].forEach(t => list.addEventListener(t, () => { clearTimeout(holdT); holdAt = null; }));
            list.addEventListener('contextmenu', e => {
                const r = e.target.closest('.vp-msgs-row');
                if (!r || r.dataset.id[0] === '@') return;
                e.preventDefault();
                clearTimeout(holdT);
                if (!held) showCtx(r, e.clientX, e.clientY);
                held = true;
            });
            root.addEventListener('pointerdown', e => { if (!ctx.contains(e.target)) hideCtx(); }, true);
            list.addEventListener('scroll', hideCtx, { passive: true });

            list.addEventListener('click', e => {
                const r = e.target.closest('.vp-msgs-row');
                if (held) { held = false; return; }
                if (r && r.dataset.id[0] === '@') { supDir = r.dataset.id === '@sup'; list.scrollTop = 0; renderList(); return; }
                if (r) openChat(MSG_DIALOGS.find(d => d.id === r.dataset.id));
            });
            root.querySelectorAll('.vp-msgs-who, .vp-msgs-chead .vp-msgs-ava').forEach(el => el.onclick = () => {
                if (!current || !current.login) return;
                const login = current.login;
                close(true);
                openProfile(login);
            });
            function blockUi(d, t) {
                const ok = !!(d && t && t.uid && !t.sup), mine = ok && msgIsBlocked(t.uid), them = ok && !mine && msgBlockedMe(t.uid);
                const kind = mine ? 'mine' : them ? 'them' : '', old = feed.querySelector(':scope > .vp-msgs-blocked');
                if (d) $('.vp-msgs-call').hidden = !!kind || !d.login || !!d.support || !!d.supUid;
                if (old && old.dataset.kind === kind && old === feed.lastElementChild) return;
                feed.querySelectorAll(':scope > .vp-msgs-blocked').forEach(x => x.remove());
                if (!kind) {
                    if (input.dataset.vpBlocked) { delete input.dataset.vpBlocked; input.placeholder = input.dataset.vpPh || ''; input.disabled = false; }
                    return;
                }
                const n = note(mine ? `Ты заблокировал(а) ${d.name}: новые сообщения и звонки от этого человека к тебе не приходят`
                    : `${d.name} заблокировал(а) тебя: твои сообщения и звонки сюда не доходят`, 'ban');
                n.classList.add('vp-msgs-blocked');
                n.dataset.kind = kind;
                if (mine) {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.textContent = 'Разблокировать';
                    b.onclick = () => msgBlockToggle(d, t, false);
                    n.appendChild(b);
                }
                if (!input.dataset.vpBlocked) { input.dataset.vpBlocked = '1'; input.dataset.vpPh = input.placeholder; }
                input.placeholder = mine ? 'Сначала разблокируй' : 'Тебя заблокировали';
                input.value = '';
                input.disabled = true;
                send.disabled = true;
                feed.scrollTop = feed.scrollHeight;
            }
            async function msgBlockToggle(d, t, on) {
                msgSetBlock(t.uid, on);
                if (on && callNet.cur && callNet.cur.uid === t.uid) callEnd(callNet.cur, 'Звонок завершён', 0);
                await msgDecryptAll();
                msgFillDialogs();
                msgBadge();
                if (current === d) msgOpenPerson(d);
                try { await msgSend(t.uid, '', false, null, new Uint8Array([5, on ? 1 : 0])); }
                catch (e) { logErr('блокировка', e); }
            }
            const blockMenu = $('.vp-msgs-hmenu');
            $('.vp-msgs-more').onclick = e => {
                e.stopPropagation();
                if (!blockMenu.hidden) { blockMenu.hidden = true; return; }
                if (!current || !current.login || current.support || current.supUid) return;
                const t = msgTarget(current), d = current;
                if (!t.uid) return note(t.missing);
                const on = msgIsBlocked(t.uid);
                blockMenu.innerHTML = '<button type="button"></button>';
                const b = blockMenu.firstChild;
                b.innerHTML = svgIcon(on ? '<path d="m5 12.5 4.5 4.5L19 7.5"/>' : '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>', 18) + '<span></span>';
                b.querySelector('span').textContent = on ? 'Разблокировать' : 'Заблокировать';
                b.classList.toggle('vp-danger', !on);
                b.onclick = () => { blockMenu.hidden = true; msgBlockToggle(d, t, !on); };
                blockMenu.hidden = false;
            };
            root.addEventListener('click', e => { if (!blockMenu.hidden && !e.target.closest('.vp-msgs-hmenu, .vp-msgs-more')) blockMenu.hidden = true; });
            $('.vp-msgs-call').onclick = () => {
                if (!current || !current.login || current.support) return;
                const t = msgTarget(current);
                if (!msgNet.me || !isApprovedId(msgMyId())) return note('Звонки откроются вместе с перепиской', 'phone');
                if (!t.uid) return note(t.missing);
                callStart(t.uid, current.name, current.ava);
            };
            search.addEventListener('input', renderList);
            $('.vp-msgs-back').onclick = closeChat;
            input.addEventListener('input', () => { send.disabled = !input.value.trim() && !pendingImg; msgCount(); });
            attachEmojiPicker($('.vp-msgs-emoji'), em => {
                if (input.disabled) return false;
                const max = input.maxLength > 0 ? input.maxLength : MSG_TEXT_MAX;
                if (input.value.length + em.length > max) return false;
                const a = input.selectionStart ?? input.value.length, z = input.selectionEnd ?? a;
                input.setRangeText(em, a, z, 'end');
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            let lb = null;
            const chatSig = uid => {
                let sg = '';
                if (msgNet.reacts) msgNet.reacts.forEach((v, k) => { if (k.startsWith(uid + '|')) sg += k + (v.me ? v.me.emoji : '') + '/' + (v.them ? v.them.emoji : '') + ';'; });
                const r = msgNet.reads && msgNet.reads.get(uid);
                return sg + ((msgNet.pins && msgNet.pins.get(uid)) || []).join(',') + '|' + (r ? (r.them0 || 0) + '/' + (r.them1 || 0) : 0) + '|' + (msgNet.sigs || []).filter(x => x.uid === uid).length + '|' + (msgIsBlocked(uid) ? 1 : 0) + (msgBlockedMe(uid) ? 1 : 0);
            };
            function paintCalls(t) {
                feed.querySelectorAll(':scope > .vp-msgs-callrow').forEach(x => x.remove());
                if (!t.uid || t.sup) return;
                const bs = [...feed.querySelectorAll(':scope > .vp-msgs-b[data-ts]')];
                for (const e of callHistory(t.uid)) {
                    const { text, miss } = callChip(e), row = document.createElement('div');
                    row.className = 'vp-msgs-callrow' + (miss ? ' vp-miss' : '');
                    row.title = 'Позвонить';
                    row.innerHTML = svgIcon(GLYPH.phone, 15) + '<span></span><time></time>';
                    row.querySelector('span').textContent = text;
                    row.querySelector('time').textContent = msgTime(e.ts);
                    row.onclick = () => { if (current) callStart(t.uid, current.name, current.ava); };
                    const next = bs.find(b => +b.dataset.ts > e.ts);
                    if (next) feed.insertBefore(row, next); else feed.appendChild(row);
                }
                if (feed.querySelector(':scope > .vp-msgs-callrow')) feed.querySelectorAll(':scope > .vp-msgs-note.vp-msgs-first').forEach(n => n.remove());
            }
            function paintReacts(b, uid) {
                const old = b.querySelector('.vp-msgs-reacts');
                if (old) old.remove();
                const m = b._m, e = m && msgNet.reacts && msgNet.reacts.get(reactKey(uid, m.dir, m.ts));
                if (!e) return;
                const counts = new Map();
                for (const who of ['them', 'me']) if (e[who] && e[who].emoji) counts.set(e[who].emoji, (counts.get(e[who].emoji) || 0) + 1);
                if (!counts.size) return;
                const box = document.createElement('div');
                box.className = 'vp-msgs-reacts';
                counts.forEach((n, em) => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.textContent = em + (n > 1 ? ' ' + n : '');
                    if (e.me && e.me.emoji === em) btn.classList.add('vp-mine-r');
                    btn.addEventListener('click', ev => { ev.stopPropagation(); toggleReact(b, em); });
                    box.appendChild(btn);
                });
                b.insertBefore(box, b.lastChild);
            }
            function toggleReact(b, emoji) {
                const m = b._m, t = current && msgTarget(current);
                if (!m || !t || !t.uid) return;
                const key = reactKey(t.uid, m.dir, m.ts), e = msgNet.reacts.get(key) || {};
                const next = e.me && e.me.emoji === emoji ? '' : emoji;
                e.me = { ts: Math.floor(srvNow() / 1000), emoji: next };
                msgNet.reacts.set(key, e);
                const pend = msgNet.pendReacts || (msgNet.pendReacts = new Map());
                pend.set(key, { emoji: next, ts: e.me.ts, until: Date.now() + 60e3 });
                const nearEnd = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 80;
                paintReacts(b, t.uid);
                if (nearEnd) feed.scrollTop = feed.scrollHeight;
                current.sig = chatSig(t.uid);
                const d = current;
                msgReact(t.uid, m, next).then(() => { if (current === d) msgRefreshChat(d); })
                    .catch(err => { pend.delete(key); logErr('реакция', err); if (current === d) msgRefreshChat(d); note('Реакция не сохранилась — попробуй ещё раз'); });
            }
            const plainText = t => String(t || '').replace(/^> [^\n]*\n?/, '');
            const flashNote = text => {
                chat.querySelectorAll(':scope > .vp-msgs-flash').forEach(x => x.remove());
                const n = document.createElement('div');
                n.className = 'vp-msgs-flash';
                n.textContent = text;
                chat.appendChild(n);
                setTimeout(() => n.remove(), 2400);
            };
            const copyText = t => { if (t && navigator.clipboard) navigator.clipboard.writeText(t).catch(() => { }); flashNote('Скопировано'); };
            let reply = null;
            const replyEl = document.createElement('div');
            replyEl.className = 'vp-msgs-reply';
            replyEl.hidden = true;
            replyEl.innerHTML = uiIcon('reply', 18) + '<span class="vp-msgs-reply-t"><b></b><span></span></span><button type="button" class="vp-msgs-ib" title="Отмена">' + uiIcon('close', 16) + '</button>';
            $('.vp-msgs-bar').before(replyEl);
            function clearReply() { reply = null; replyEl.hidden = true; }
            function setReply(b) {
                const m = b._m;
                if (!m) return;
                const body = plainText(m.text).replace(/\s+/g, ' ').trim();
                reply = { name: m.dir === 'out' ? 'Ты' : current.name, text: body ? body.slice(0, 70) : 'Картинка' };
                replyEl.querySelector('b').textContent = reply.name;
                replyEl.querySelector('.vp-msgs-reply-t span').textContent = reply.text;
                replyEl.hidden = false;
                input.focus();
            }
            replyEl.querySelector('button').addEventListener('click', clearReply);
            function takeReply(text) {
                if (!reply) return text;
                const q = '> ' + reply.name + ': ' + reply.text;
                clearReply();
                return text ? q + '\n' + text : q;
            }
            const pinEl = document.createElement('div');
            pinEl.className = 'vp-msgs-pinbar';
            pinEl.hidden = true;
            pinEl.innerHTML = uiIcon('pin', 18) + '<span class="vp-msgs-pin-t"><b>Закреплённое сообщение</b><span></span></span><button type="button" class="vp-msgs-ib" title="Открепить">' + uiIcon('close', 16) + '</button>';
            $('.vp-msgs-chead').after(pinEl);
            let pinIdx = 0, pinCur = null, pinCount = 0;
            function paintPin(t) {
                const keys = (msgNet.pins && t && t.uid && msgNet.pins.get(t.uid)) || [], list = t && t.uid ? msgThread(t) : [];
                const items = keys.map(k => list.find(m => reactKey(t.uid, m.dir, m.ts) === k)).filter(Boolean);
                pinCount = items.length;
                if (!items.length) { pinEl.hidden = true; pinCur = null; return; }
                pinIdx = pinIdx % items.length;
                pinCur = items[items.length - 1 - pinIdx];
                pinEl.querySelector('b').textContent = items.length > 1 ? `Закреплённое сообщение ${items.length - pinIdx} из ${items.length}` : 'Закреплённое сообщение';
                pinEl.querySelector('.vp-msgs-pin-t span').textContent = plainText(pinCur.text).replace(/\s+/g, ' ').trim().slice(0, 90) || 'Картинка';
                pinEl.hidden = false;
            }
            const bubbleOf = m => feed.querySelector(`:scope > .vp-msgs-b[data-dir="${m.dir}"][data-ts="${m.ts}"]`);
            pinEl.addEventListener('click', e => {
                if (!pinCur || e.target.closest('button')) return;
                const b = bubbleOf(pinCur);
                if (b) { b.scrollIntoView({ block: 'center', behavior: 'smooth' }); b.classList.remove('vp-flash'); void b.offsetWidth; b.classList.add('vp-flash'); setTimeout(() => b.classList.remove('vp-flash'), 1500); }
                if (pinCount > 1) { pinIdx++; paintPin(msgTarget(current)); }
            });
            pinEl.querySelector('button').addEventListener('click', () => { if (pinCur) togglePin(pinCur, false); });
            async function togglePin(m, on) {
                const t = current && msgTarget(current);
                if (!t || !t.uid) return;
                const d = current;
                try { await msgSend(t.uid, '', false, null, cat(new Uint8Array([6]), be32(m.ts), new Uint8Array([m.dir === 'out' ? 1 : 0, on ? 1 : 0]))); }
                catch (e) { logErr('закрепление', e); flashNote('Не получилось — попробуй ещё раз'); return; }
                await msgSync().catch(() => { });
                if (current === d) { msgRefreshChat(d); flashNote(on ? 'Сообщение закреплено' : 'Сообщение откреплено'); }
            }
            let sel = null;
            const selEl = document.createElement('div');
            selEl.className = 'vp-msgs-sel';
            selEl.hidden = true;
            selEl.innerHTML = '<button type="button" class="vp-msgs-ib" title="Отмена">' + uiIcon('close', 18) + '</button><b></b><span class="vp-msgs-sel-gap"></span>'
                + '<button type="button" data-a="copy">' + uiIcon('copy', 16) + 'Копировать</button><button type="button" data-a="fwd">' + uiIcon('fwd', 16) + 'Переслать</button><button type="button" data-a="del" class="vp-danger">' + uiIcon('trash', 16) + 'Удалить</button>';
            $('.vp-msgs-chead').appendChild(selEl);
            function selEnd() { if (sel) sel.forEach(b => b.classList.remove('vp-sel')); sel = null; chat.classList.remove('vp-selecting'); selEl.hidden = true; }
            function selSet(b, on) {
                if (!sel || !b._m) return;
                const has = sel.has(b);
                if (on && !has) { sel.add(b); b.classList.add('vp-sel'); }
                else if (!on && has) { sel.delete(b); b.classList.remove('vp-sel'); }
                if (!sel.size) selEnd(); else selEl.querySelector('b').textContent = sel.size + ' выбрано';
            }
            const selToggle = b => { if (sel && b._m) selSet(b, !sel.has(b)); };
            function selStart(b) { selEnd(); sel = new Set(); chat.classList.add('vp-selecting'); selEl.hidden = false; selToggle(b); }
            const selList = () => sel ? [...feed.querySelectorAll(':scope > .vp-msgs-b')].filter(b => sel.has(b)) : [];
            selEl.addEventListener('click', e => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const bs = selList(), a = btn.dataset.a;
                if (!a) selEnd();
                else if (a === 'copy') { copyText(bs.map(b => plainText(b._m.text)).filter(Boolean).join('\n')); selEnd(); }
                else if (a === 'fwd') openFwd(bs.map(b => b._m));
                else if (a === 'del') msgDelete(bs).then(selEnd);
            });
            let dsel = null, selMute = 0;
            const bubbleUnder = (x, y) => { const b = bubbleAt(y); return b && b._m ? b : null; };
            const hitBubble = e => { const b = e.target.closest ? e.target.closest('.vp-msgs-b') : null; return b || (e.target === feed ? bubbleAt(e.clientY) : null); };
            function selRange(b) {
                if (!dsel) return;
                const all = [...feed.querySelectorAll(':scope > .vp-msgs-b')], i = all.indexOf(b), a = all.indexOf(dsel.b);
                if (i < 0 || a < 0) return;
                const lo = Math.min(i, a), hi = Math.max(i, a);
                all.forEach((x, k) => { if (!x._m) return; if (k >= lo && k <= hi) selSet(x, true); else if (!dsel.before.has(x)) selSet(x, false); });
            }
            function selScroll() {
                if (!dsel) return;
                dsel.raf = 0;
                if (!dsel.v) return;
                feed.scrollTop += Math.max(-26, Math.min(26, dsel.v));
                const b = bubbleUnder(dsel.x, dsel.y);
                if (b) selRange(b);
                dsel.raf = requestAnimationFrame(selScroll);
            }
            feed.addEventListener('pointerdown', e => {
                if (!sel || e.button) return;
                const b = hitBubble(e);
                if (!b || !b._m) return;
                dsel = { was: sel.has(b), b, before: new Set(sel), moved: false, x0: e.clientX, y0: e.clientY, id: e.pointerId, v: 0, x: e.clientX, y: e.clientY, raf: 0 };
                selRange(b);
                try { feed.setPointerCapture(e.pointerId); } catch (x) { }
                e.preventDefault();
            }, true);
            let selHoldT = 0;
            feed.addEventListener('pointerdown', e => {
                if (sel || e.pointerType !== 'mouse' || e.button) return;
                const b = hitBubble(e);
                if (!b || !b._m || e.target.closest('a, button')) return;
                const id = e.pointerId, x0 = e.clientX, y0 = e.clientY;
                clearTimeout(selHoldT);
                const cancel = () => { clearTimeout(selHoldT); feed.removeEventListener('pointermove', mv); feed.removeEventListener('pointerup', cancel); feed.removeEventListener('pointercancel', cancel); };
                const mv = ev => { if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 5) cancel(); };
                selHoldT = setTimeout(() => {
                    cancel();
                    if (!b.isConnected || sel) return;
                    if (window.getSelection) window.getSelection().removeAllRanges();
                    selStart(b);
                    dsel = { was: false, b, before: new Set(sel), moved: false, x0, y0, id, v: 0, x: x0, y: y0, raf: 0 };
                    try { feed.setPointerCapture(id); } catch (x) { }
                }, 450);
                feed.addEventListener('pointermove', mv);
                feed.addEventListener('pointerup', cancel);
                feed.addEventListener('pointercancel', cancel);
            }, true);
            feed.addEventListener('pointermove', e => {
                if (!dsel || e.pointerId !== dsel.id) return;
                dsel.x = e.clientX; dsel.y = e.clientY;
                if (Math.hypot(e.clientX - dsel.x0, e.clientY - dsel.y0) > 5) dsel.moved = true;
                const b = bubbleUnder(e.clientX, e.clientY);
                if (b) selRange(b);
                const r = feed.getBoundingClientRect(), edge = 54;
                dsel.v = e.clientY < r.top + edge ? -(r.top + edge - e.clientY) / 3 : e.clientY > r.bottom - edge ? (e.clientY - (r.bottom - edge)) / 3 : 0;
                if (dsel.v && !dsel.raf) dsel.raf = requestAnimationFrame(selScroll);
            });
            const selDragEnd = e => {
                if (!dsel || e.pointerId !== dsel.id) return;
                if (dsel.raf) cancelAnimationFrame(dsel.raf);
                if (!dsel.moved && dsel.was && e.type === 'pointerup') selSet(dsel.b, false);
                dsel = null; selMute = Date.now() + 350;
            };
            feed.addEventListener('pointerup', selDragEnd);
            feed.addEventListener('pointercancel', selDragEnd);
            feed.addEventListener('click', e => {
                if (!sel && Date.now() > selMute) return;
                if (Date.now() < selMute) { e.preventDefault(); e.stopPropagation(); return; }
                const b = hitBubble(e);
                e.preventDefault(); e.stopPropagation();
                if (b) selToggle(b);
            }, true);
            async function msgDelete(bs) {
                const t = current && msgTarget(current);
                bs = bs.filter(b => b._m);
                if (!t || !t.uid || !bs.length) return;
                const own = bs.filter(b => b._m.dir === 'out'), theirs = bs.filter(b => b._m.dir === 'in');
                const ask = own.length && !theirs.length ? (own.length === 1 ? 'Удалить сообщение у обоих?' : `Удалить ${own.length} сообщ. у обоих?`)
                    : !own.length ? (theirs.length === 1 ? 'Удалить сообщение у себя? У собеседника оно останется.' : `Удалить ${theirs.length} сообщ. у себя? У собеседника они останутся.`)
                        : `Удалить ${bs.length} сообщ.? Свои пропадут у обоих, чужие только у тебя.`;
                if (!confirm(ask)) return;
                const d = current;
                theirs.forEach(b => { msgHide(t.uid, b._m); b.remove(); });
                for (const b of own) {
                    b.classList.add('vp-gone');
                    try { await msgSend(t.uid, '', false, null, cat(new Uint8Array([7]), be32(b._m.ts), new Uint8Array([1]))); b.remove(); }
                    catch (e) { b.classList.remove('vp-gone'); logErr('удаление', e); flashNote('Не удалилось — попробуй ещё раз'); break; }
                }
                await msgSync().catch(() => { });
                if (current === d) msgRefreshChat(d);
            }
            let fwdEl = null;
            function closeFwd() { if (fwdEl) { fwdEl.remove(); fwdEl = null; } }
            function openFwd(ms) {
                closeFwd();
                msgFillDialogs();
                const targets = sortDialogs(MSG_DIALOGS.filter(x => !x.supUid && (x.login || x.support)));
                fwdEl = document.createElement('div');
                fwdEl.className = 'vp-msgs-fwd';
                fwdEl.innerHTML = '<div class="vp-msgs-fwd-card"><div class="vp-msgs-fwd-h"><b>Переслать</b><button type="button" class="vp-msgs-ib" title="Закрыть">' + uiIcon('close', 18) + '</button></div><div class="vp-msgs-fwd-l"></div></div>';
                const box = fwdEl.querySelector('.vp-msgs-fwd-l');
                targets.forEach(x => {
                    const row = document.createElement('button');
                    row.type = 'button';
                    row.className = 'vp-msgs-fwd-r';
                    row.innerHTML = '<span class="vp-msgs-ava vp-sm">' + avaHtml(x.ava) + '</span><span></span>';
                    row.lastChild.textContent = x.name;
                    row.addEventListener('click', () => forwardTo(x, ms));
                    box.appendChild(row);
                });
                fwdEl.addEventListener('click', e => { if (e.target === fwdEl || e.target.closest('.vp-msgs-fwd-h button')) closeFwd(); });
                chat.appendChild(fwdEl);
            }
            async function forwardTo(x, ms) {
                const t = msgTarget(x), me = current;
                if (!t.uid) { flashNote('Этому человеку пока нельзя написать'); return; }
                closeFwd(); selEnd();
                try {
                    for (const m of ms) {
                        const who = m.dir === 'out' ? (myDisplayName || myUsername || 'меня') : (me && me.name) || '';
                        const imgs = m.imgs || (m.img ? [m.img] : []), body = plainText(m.text);
                        await msgSend(t.uid, '> Переслано от ' + who + (body ? '\n' + body : ''), t.sup, imgs.length ? imgs : null);
                    }
                    flashNote('Переслано: ' + x.name);
                } catch (e) { logErr('пересылка', e); flashNote('Не отправилось — попробуй ещё раз'); }
                await msgSync().catch(() => { });
                msgFillDialogs();
                if (current) { const c = msgTarget(current); if (c.uid === t.uid && c.sup === t.sup) msgRefreshChat(current); }
            }
            async function saveImage(url) {
                const name = decodeURIComponent(url.split('?')[0].split('/').pop() || 'image');
                const save = href => { const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
                if (/^(blob|data):/.test(url)) { save(url); return; }
                try {
                    const bl = await new Promise((ok, no) => GM_xmlhttpRequest({ method: 'GET', url, responseType: 'blob', timeout: 60000,
                        onload: r => r.status === 200 && r.response ? ok(r.response) : no(new Error('HTTP ' + r.status)), onerror: no, ontimeout: no }));
                    const href = URL.createObjectURL(bl);
                    save(href);
                    setTimeout(() => URL.revokeObjectURL(href), 4000);
                } catch (e) { logErr('сохранение картинки', e); window.open(url, '_blank', 'noopener'); }
            }
            let menu = null, pressT = 0;
            function closeMenu() {
                if (!menu) return;
                menu.remove(); menu = null;
                document.removeEventListener('pointerdown', menuOutside, true);
            }
            const menuOutside = e => { if (menu && !menu.contains(e.target)) closeMenu(); };
            function openSelMenu(x, y) {
                closeMenu();
                menu = document.createElement('div');
                menu.className = 'vp-msgs-menu';
                const item = (label, fn, ico, cls) => {
                    const btn = document.createElement('button');
                    btn.type = 'button'; btn.className = 'vp-msgs-menu-i' + (cls ? ' ' + cls : '');
                    btn.insertAdjacentHTML('afterbegin', uiIcon(ico, 18));
                    btn.appendChild(document.createTextNode(label));
                    btn.addEventListener('click', () => { closeMenu(); fn(); });
                    menu.appendChild(btn);
                };
                item('Удалить выбранное', () => msgDelete(selList()).then(selEnd), 'trash', 'vp-danger');
                item('Отменить выбор', selEnd, 'close');
                const sp = document.createElement('div');
                sp.className = 'vp-msgs-menu-sep';
                menu.appendChild(sp);
                item('Копировать выбранное как текст', () => { copyText(selList().map(b => plainText(b._m.text)).filter(Boolean).join('\n')); selEnd(); }, 'copy');
                document.body.appendChild(menu);
                const w = menu.offsetWidth, h = menu.offsetHeight;
                menu.style.left = Math.max(8, Math.min(x, innerWidth - w - 8)) + 'px';
                menu.style.top = Math.max(8, Math.min(y, innerHeight - h - 8)) + 'px';
                setTimeout(() => document.addEventListener('pointerdown', menuOutside, true), 0);
            }
            function openMenu(b, x, y) {
                if (sel) { openSelMenu(x, y); return; }
                closeMenu();
                const m = b._m, real = m && current && msgNet.me && msgTarget(current).uid;
                const text = m ? plainText(m.text) : (b.querySelector('.vp-msgs-cap') || b.firstChild || {}).textContent || '';
                const imgs = [...b.querySelectorAll('.vp-msgs-img')].map(i => i.src);
                const under = document.elementFromPoint(x, y), hit = under && under.closest ? under.closest('.vp-msgs-img') : null;
                menu = document.createElement('div');
                menu.className = 'vp-msgs-menu';
                if (real) {
                    const row = document.createElement('div');
                    row.className = 'vp-msgs-menu-r';
                    MSG_REACTS.forEach(em => {
                        const btn = document.createElement('button');
                        btn.type = 'button'; btn.textContent = em;
                        btn.addEventListener('click', () => { closeMenu(); toggleReact(b, em); });
                        row.appendChild(btn);
                    });
                    menu.appendChild(row);
                }
                const item = (label, fn, ico, cls) => {
                    const btn = document.createElement('button');
                    btn.type = 'button'; btn.className = 'vp-msgs-menu-i' + (cls ? ' ' + cls : '');
                    if (ico) btn.insertAdjacentHTML('afterbegin', uiIcon(ico, 18));
                    btn.appendChild(document.createTextNode(label));
                    btn.addEventListener('click', () => { closeMenu(); fn(); });
                    menu.appendChild(btn);
                };
                const sep = () => { const s = document.createElement('div'); s.className = 'vp-msgs-menu-sep'; menu.appendChild(s); };
                if (real) {
                    const t = msgTarget(current), pinned = ((msgNet.pins && msgNet.pins.get(t.uid)) || []).includes(reactKey(t.uid, m.dir, m.ts));
                    item('Ответить', () => setReply(b), 'reply');
                    item(pinned ? 'Открепить' : 'Закрепить', () => togglePin(m, !pinned), 'pin');
                    item('Переслать', () => openFwd([m]), 'fwd');
                    item(m.dir === 'out' ? 'Удалить' : 'Удалить у себя', () => msgDelete([b]), 'trash', 'vp-danger');
                    item('Выбрать', () => selStart(b), 'check');
                    sep();
                }
                if (text) item('Копировать текст', () => copyText(text), 'copy');
                if (imgs.length) {
                    item('Сохранить', () => saveImage(hit ? hit.src : imgs[0]), 'save');
                    item(imgs.length > 1 ? 'Открыть альбом' : 'Открыть картинку', () => openImg(imgs, 0, text, [...b.querySelectorAll('.vp-msgs-img')]), 'image');
                }
                if (menu.lastChild && menu.lastChild.classList.contains('vp-msgs-menu-sep')) menu.lastChild.remove();
                if (!menu.querySelector('.vp-msgs-menu-i')) { menu = null; return; }
                document.body.appendChild(menu);
                const w = menu.offsetWidth, h = menu.offsetHeight;
                menu.style.left = Math.max(8, Math.min(x, innerWidth - w - 8)) + 'px';
                menu.style.top = Math.max(8, Math.min(y, innerHeight - h - 8)) + 'px';
                setTimeout(() => document.addEventListener('pointerdown', menuOutside, true), 0);
            }
            const bubbleAt = y => [...feed.querySelectorAll('.vp-msgs-b:not(.vp-msgs-typing)')].find(x => { const r = x.getBoundingClientRect(); return y >= r.top - 3 && y <= r.bottom + 3; });
            feed.addEventListener('contextmenu', e => {
                const b = bubbleAt(e.clientY);
                if (!b) return;
                e.preventDefault();
                if (sel) { openSelMenu(e.clientX, e.clientY); return; }
                openMenu(b, e.clientX, e.clientY);
            });
            feed.addEventListener('pointerdown', e => {
                if (e.pointerType === 'mouse' || sel) return;
                const b = bubbleAt(e.clientY), x = e.clientX, y = e.clientY;
                if (!b) return;
                clearTimeout(pressT);
                pressT = setTimeout(() => { pressT = 0; openMenu(b, x, y); }, 480);
            });
            ['pointerup', 'pointercancel'].forEach(t => feed.addEventListener(t, () => clearTimeout(pressT)));
            feed.addEventListener('pointermove', e => { if (pressT && e.pointerType !== 'mouse') clearTimeout(pressT); });
            feed.addEventListener('scroll', () => closeMenu(), { passive: true });
            let lbKey = null;
            function openImg(list, idx, cap, thumbs) {
                if (typeof list === 'string') list = [list];
                idx = idx || 0;
                if (lb) closeImg(true, true);
                lb = document.createElement('div');
                lb.className = 'vp-msgs-lb';
                lb._thumbs = thumbs || [];
                lb._idx = () => idx;
                lb.innerHTML = `<div class="vp-msgs-lb-top"><button type="button" class="vp-msgs-ib" title="Назад">${MSG_ICON.back}</button><span class="vp-msgs-lb-cap"></span>`
                    + `<b class="vp-msgs-lb-n"></b><a target="_blank" rel="noopener">Открыть оригинал ${uiIcon('out', 14, 'vp-solo')}</a></div>`
                    + `<div class="vp-msgs-lb-body"><button type="button" class="vp-msgs-lb-nav vp-prev" title="Назад">‹</button><img alt="" draggable="false"><button type="button" class="vp-msgs-lb-nav vp-next" title="Дальше">›</button></div>`;
                const orig = lb.querySelector('a'), img = lb.querySelector('img'), num = lb.querySelector('.vp-msgs-lb-n');
                const prev = lb.querySelector('.vp-prev'), next = lb.querySelector('.vp-next');
                const show = i => {
                    idx = (i + list.length) % list.length;
                    img.src = list[idx];
                    if (/^https:\/\/cdn\./.test(list[idx])) { orig.href = list[idx]; orig.hidden = false; } else orig.hidden = true;
                    num.textContent = list.length > 1 ? `${idx + 1} / ${list.length}` : '';
                    if (lb && lb._flown) lb._thumbs.forEach((t, k) => { if (t) t.style.visibility = k === idx ? 'hidden' : ''; });
                };
                prev.hidden = next.hidden = list.length < 2;
                prev.addEventListener('click', e => { if (downX != null && Math.abs(e.clientX - downX) > 40) return; e.stopPropagation(); show(idx - 1); });
                next.addEventListener('click', e => { if (downX != null && Math.abs(e.clientX - downX) > 40) return; e.stopPropagation(); show(idx + 1); });
                lb.querySelector('.vp-msgs-lb-cap').textContent = cap || '';
                show(idx);
                lb.querySelector('.vp-msgs-ib').addEventListener('click', () => closeImg());
                let downX = null;
                lb.addEventListener('pointerdown', e => { downX = e.clientX; });
                lb.addEventListener('click', e => {
                    const dx = downX == null ? 0 : e.clientX - downX;
                    downX = null;
                    if (list.length > 1 && Math.abs(dx) > 40) { show(idx + (dx < 0 ? 1 : -1)); return; }
                    if (e.target === lb || e.target.classList.contains('vp-msgs-lb-body')) closeImg();
                });
                lbKey = e => {
                    if (e.key === 'ArrowLeft' && list.length > 1) { e.preventDefault(); e.stopPropagation(); show(idx - 1); }
                    else if (e.key === 'ArrowRight' && list.length > 1) { e.preventDefault(); e.stopPropagation(); show(idx + 1); }
                };
                document.addEventListener('keydown', lbKey, true);
                root.appendChild(lb);
                history.pushState(Object.assign({}, history.state, { vpImg: 1 }), '', location.href);
                const el = lb, from = lb._thumbs[idx];
                if (from && from.isConnected) {
                    el.style.animation = 'none';
                    el.animate([{ backgroundColor: 'rgba(0, 0, 0, 0)' }, { backgroundColor: 'rgba(0, 0, 0, .92)' }], { duration: 260, easing: 'ease-out' });
                    el.querySelector('.vp-msgs-lb-top').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: 90, fill: 'backwards' });
                    img.style.visibility = 'hidden';
                    const go = () => {
                        if (!img.isConnected) return;
                        const f = from.getBoundingClientRect(), t = img.getBoundingClientRect();
                        img.style.visibility = '';
                        if (!f.width || !t.width) return;
                        el._flown = true;
                        from.style.visibility = 'hidden';
                        img.style.transformOrigin = '0 0';
                        img.animate([{ transform: `translate(${f.left - t.left}px, ${f.top - t.top}px) scale(${f.width / t.width}, ${f.height / t.height})`, borderRadius: '16px' }, { transform: 'none', borderRadius: '10px' }], { duration: 320, easing: 'cubic-bezier(.2, .8, .2, 1)' });
                    };
                    (img.decode ? img.decode() : Promise.reject()).then(go, go);
                }
            }
            function closeImg(fromHistory, instant) {
                if (!lb) return;
                const el = lb, thumbs = el._thumbs || [], src = thumbs[el._idx()], img = el.querySelector('.vp-msgs-lb-body img');
                lb = null;
                if (lbKey) { document.removeEventListener('keydown', lbKey, true); lbKey = null; }
                const done = () => { thumbs.forEach(t => { if (t) t.style.visibility = ''; }); el.remove(); };
                let fly = false;
                if (!instant && el._flown && img && src && src.isConnected) {
                    const f = src.getBoundingClientRect(), t = img.getBoundingClientRect(), fr = feed.getBoundingClientRect();
                    if (f.width && t.width && f.bottom > fr.top && f.top < fr.bottom) {
                        fly = true;
                        el.style.pointerEvents = 'none';
                        el.animate([{ backgroundColor: 'rgba(0, 0, 0, .92)' }, { backgroundColor: 'rgba(0, 0, 0, 0)' }], { duration: 260, easing: 'ease-in', fill: 'forwards' });
                        el.querySelector('.vp-msgs-lb-top').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' });
                        img.style.transformOrigin = '0 0';
                        const a = img.animate([{ transform: 'none', borderRadius: '10px' }, { transform: `translate(${f.left - t.left}px, ${f.top - t.top}px) scale(${f.width / t.width}, ${f.height / t.height})`, borderRadius: '16px' }], { duration: 280, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' });
                        a.onfinish = done;
                        setTimeout(done, 450);
                    }
                }
                if (!fly) done();
                if (fromHistory !== true && overlayAt('vpImg')) history.back();
            }
            root.imgOpen = () => !!lb;
            let pendingImg = null;
            const pendEl = document.createElement('div');
            pendEl.className = 'vp-msgs-pend';
            pendEl.hidden = true;
            pendEl.innerHTML = '<div class="vp-msgs-pend-list"></div><span></span><button type="button" class="vp-msgs-pend-all" title="Убрать все">' + uiIcon('close', 14, 'vp-solo') + '</button>';
            const pendList = pendEl.querySelector('.vp-msgs-pend-list');
            function renderPending() {
                pendList.textContent = '';
                (pendingImg || []).forEach((p, i) => {
                    const t = document.createElement('span');
                    t.className = 'vp-msgs-pend-t';
                    t.innerHTML = '<img alt=""><button type="button" title="Убрать">' + uiIcon('close', 12, 'vp-solo') + '</button>';
                    t.firstChild.src = p.url;
                    t.lastChild.addEventListener('click', () => removePending(i));
                    pendList.appendChild(t);
                });
                const n = pendingImg ? pendingImg.length : 0;
                pendEl.querySelector('span:not(.vp-msgs-pend-t)').textContent = n > 1 ? `${n} ${plural(n, 'картинка', 'картинки', 'картинок')} из ${MSG_ALBUM_MAX} · можно добавить подпись` : 'Картинка · можно добавить подпись';
                pendEl.hidden = !n;
                send.disabled = !n && !input.value.trim();
            }
            function setPending(files) {
                files = (Array.isArray(files) ? files : [files]).filter(f => f && /^image\//.test(f.type));
                if (!files.length) return;
                const t = current && msgNet.me ? msgTarget(current) : null;
                if (!t || !t.uid) { note('Картинки можно отправлять в переписке с людьми и поддержкой'); return; }
                pendingImg = pendingImg || [];
                const room = MSG_ALBUM_MAX - pendingImg.length;
                if (files.length > room) note(`В одном сообщении — не больше ${MSG_ALBUM_MAX} картинок`);
                files.slice(0, Math.max(0, room)).forEach(file => pendingImg.push({ file, url: URL.createObjectURL(file) }));
                renderPending();
                input.focus();
            }
            function removePending(i) {
                if (!pendingImg) return;
                const [p] = pendingImg.splice(i, 1);
                if (p) URL.revokeObjectURL(p.url);
                if (!pendingImg.length) pendingImg = null;
                renderPending();
            }
            function clearPending() {
                (pendingImg || []).forEach(p => URL.revokeObjectURL(p.url));
                pendingImg = null;
                renderPending();
            }
            pendEl.querySelector('.vp-msgs-pend-all').addEventListener('click', clearPending);
            function msgSentOk(b, d, ts) {
                setMeta(b.lastChild, now() + ' ✓');
                if (ts && feed.querySelector(`:scope > .vp-msgs-b[data-dir="out"][data-ts="${ts}"]`)) b.remove();
                else if (ts) { b.dataset.ts = ts; b.dataset.dir = 'out'; }
                msgFillDialogs();
                if (current === d) msgRefreshChat(d);
            }
            function sendImages(files) {
                if (!files.length || !current) return;
                const t = msgNet.me ? msgTarget(current) : null;
                if (!t || !t.uid) { note('Картинки можно отправлять в переписке с людьми и поддержкой'); return; }
                const caption = takeReply(input.value.trim()), d = current, locals = files.map(f => URL.createObjectURL(f));
                input.value = ''; send.disabled = true; msgCount();
                const b = bubble('out', caption, now() + ' · загрузка…', locals);
                (async () => {
                    const imgs = [];
                    for (const f of files) {
                        if (files.length > 1) setMeta(b.lastChild, now() + ` · загрузка ${imgs.length + 1} из ${files.length}…`);
                        imgs.push(await msgUploadImage(f));
                    }
                    setMeta(b.lastChild, now() + ' · отправка…');
                    return msgSend(t.uid, caption, t.sup, imgs);
                })().then(ts => msgSentOk(b, d, ts),
                    e => { setMeta(b.lastChild, now() + ' · не отправлено: ' + (e.message || e)); b.classList.add('vp-fail'); logErr('картинка', e); });
            }
            const fileIn = $('.vp-msgs-file');
            fileIn.multiple = true;
            $('.vp-msgs-attach').addEventListener('click', () => { if (!input.disabled) fileIn.click(); });
            fileIn.addEventListener('change', () => { const f = [...(fileIn.files || [])]; fileIn.value = ''; setPending(f); });
            input.addEventListener('paste', e => {
                const f = [...(e.clipboardData && e.clipboardData.files || [])].filter(x => /^image\//.test(x.type));
                if (f.length) { e.preventDefault(); setPending(f); }
            });
            $('.vp-msgs-bar').before(pendEl);
            $('.vp-msgs-bar').addEventListener('submit', e => {
                e.preventDefault();
                if (pendingImg && current) { const f = pendingImg.map(p => p.file); clearPending(); sendImages(f); return; }
                const text = input.value.trim();
                if (!text || !current) return;
                input.value = ''; send.disabled = true; msgCount();
                current.msgs.push(['out', text]);
                current.last = 'Ты: ' + text; current.time = now();
                if (current.support && !(msgNet.me && msgTarget(current).uid)) { bubble('out', text, now() + ' ✓'); supportReply(); }
                else if (msgNet.me && msgTarget(current).uid) {
                    const full = takeReply(text), b = bubble('out', full, now() + ' · отправка…'), d = current, t = msgTarget(d);
                    msgSend(t.uid, full, t.sup).then(ts => msgSentOk(b, d, ts),
                        e => { setMeta(b.lastChild, now() + ' · не отправлено'); b.classList.add('vp-fail'); logErr('сообщения', e); });
                }
                else bubble('out', text, now() + ' · не отправлено').classList.add('vp-fail');
            });

            function place() {
                const nav = siteEl('nav');
                const row = nav && navIsRow(nav) && nav.getBoundingClientRect().top > innerHeight / 2;
                document.querySelectorAll('.vp-msgs-navwrap').forEach(w => w.classList.remove('vp-msgs-navwrap'));
                if (row) {
                    if (nav.parentElement) nav.parentElement.classList.add('vp-msgs-navwrap');
                    const bottom = innerHeight - nav.getBoundingClientRect().top + BUMP_H + 8;
                    Object.assign(root.style, { left: '0px', right: '0px', top: '0px', bottom: '0px', width: '', borderRadius: '', paddingBottom: bottom + 'px' });
                } else {
                    let cb = contentBox() || lastCb;
                    if (!cb || cb.right - cb.left < 300) {
                        const side = siteEl('sidebar'), sr = side && side.getBoundingClientRect();
                        const w = Math.min(650, innerWidth - 32), l = Math.max(sr ? sr.right + 24 : 16, Math.round(innerWidth / 2 - w / 2));
                        cb = { left: l, right: Math.min(innerWidth - 16, l + w) };
                    }
                    const left = cb ? cb.left : Math.max(0, innerWidth / 2 - 300), width = cb ? cb.right - cb.left : Math.min(600, innerWidth);
                    Object.assign(root.style, { left: left + 'px', width: width + 'px', right: '', top: '12px', bottom: '12px', borderRadius: '', paddingBottom: '0px' });
                }
                root.classList.toggle('vp-card', !row);
                under.classList.remove('vp-on');
                if (!row) Object.assign(under.style, { left: root.style.left, width: root.style.width });
            }
            let openPath = '';
            function onKey(e) { if (e.key === 'Escape' && root.classList.contains('vp-open')) { e.stopPropagation(); lb ? closeImg() : menu ? closeMenu() : fwdEl ? closeFwd() : sel ? selEnd() : reply ? clearReply() : current ? closeChat() : close(); } }
            function close(fromHistory) {
                if (!root.classList.contains('vp-open')) return;
                clearTimeout(botTimer);
                root.classList.remove('vp-open');
                document.documentElement.classList.remove('vp-msgs-open');
                document.querySelectorAll('.vp-msgs-navwrap').forEach(w => w.classList.remove('vp-msgs-navwrap'));
                document.removeEventListener('keydown', onKey, true);
                removeEventListener('resize', place);
                msgsOpen = false;
                placeSidebar(); placeRail();
                if (!galOpen) galHideFeed(false);
                markActiveNav(); moveNavBlob();
                if (lb) { lb.remove(); lb = null; if (!fromHistory && overlayAt('vpImg')) { history.go(overlayAt('vpChat') ? -3 : -2); return; } }
                if (!fromHistory) {
                    if (overlayAt('vpChat')) history.go(-2);
                    else if (overlayAt('vpMsgs')) history.back();
                }
            }
            addEventListener('popstate', () => {
                const open = root.classList.contains('vp-open');
                if (lb && !overlayAt('vpImg')) { closeImg(true); return; }
                if (chatBackPending) {
                    chatBackPending = false;
                    if (current && overlayAt('vpMsgs') && !overlayAt('vpChat')) history.pushState(Object.assign({}, history.state, { vpChat: current.id }), '', location.href);
                    return;
                }
                if (overlayAt('vpMsgs')) {
                    if (!open) root.open(true);
                    const cid = history.state && history.state.vpChat;
                    if (!cid && current) closeChat(true);
                    else if (cid && (!current || current.id !== cid)) root.openDialog(cid, true);
                }
                else if (open) close(true);
            });
            document.addEventListener('click', e => {
                if (!root.classList.contains('vp-open')) return;
                const a = e.target.closest && e.target.closest('a.' + SELECTORS.navLink);
                if (a && a.getAttribute('href') !== '#' && a.getAttribute('href') === location.pathname) { e.preventDefault(); e.stopPropagation(); close(); }
            }, true);
            const msgsLeft = () => { if (root.classList.contains('vp-open') && location.pathname !== openPath) close(true); };
            onDom(msgsLeft);
            document.addEventListener('vp-loc', msgsLeft);
            root.open = fromHistory => {
                if (root.classList.contains('vp-open')) { if (current) closeChat(); return; }
                const lead = fromHistory === true ? null : tabSlide.lead('msg');
                openNow(fromHistory);
                tabSlide.arrive(lead, root);
            };
            const openNow = fromHistory => {
                if (galOpen) closeGallery(true);
                openPath = location.pathname;
                msgsOpen = true;
                closeChat();
                loadMsgPeople(() => { if (!current) renderList(); });
                msgSync().then(() => { msgFillDialogs(); if (!current) renderList(); }).catch(() => { });
                place();
                placeSidebar(); placeRail();
                root.classList.add('vp-open');
                document.documentElement.classList.add('vp-msgs-open');
                document.addEventListener('keydown', onKey, true);
                addEventListener('resize', place);
                if (fromHistory !== true) overlayEnter('vpMsgs');
                galHideFeed(true);
                markActiveNav(); moveNavBlob();
            };
            root.close = close;
            return root;
        }

