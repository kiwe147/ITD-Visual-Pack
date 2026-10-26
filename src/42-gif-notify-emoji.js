        function gifFile(file) {
            if (!(file instanceof File) || !file.type.startsWith('image/') || file.type === 'image/gif') return file;
            return new File([file], file.name.replace(/\.[^.]+$/, '') + '.gif', { type: 'image/gif' });
        }
        function gifTransfer(files) {
            if (!antiCensorshipEnabled || !files || ![...files].some(f => gifFile(f) !== f)) return null;
            const dt = new DataTransfer();
            for (const f of files) dt.items.add(gifFile(f));
            return dt;
        }
        function gifOnPick(e) {
            const input = e.target;
            if (!(input instanceof HTMLInputElement) || input.type !== 'file' || input.closest('.vp-ave')) return;
            if (!/\.(jpe?g|png|gif|webp)|image\//i.test(input.accept || '')) return;
            const dt = gifTransfer(input.files);
            if (dt) input.files = dt.files;
        }
        document.addEventListener('input', gifOnPick, true);
        document.addEventListener('change', gifOnPick, true);
        document.addEventListener('drop', function (e) {
            if (e.target.closest && e.target.closest('.vp-ave')) return;
            const dt = gifTransfer(e.dataTransfer && e.dataTransfer.files);
            if (!dt) return;
            e.preventDefault();
            e.stopPropagation();
            e.target.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY }));
        }, true);
        document.addEventListener('dragover', function (e) { if (antiCensorshipEnabled) e.preventDefault(); }, true);
        function gifForm(body) {
            if (!antiCensorshipEnabled || !(body instanceof FormData) || body.vpRaw) return body;
            const form = new FormData();
            let changed = false;
            for (const [key, value] of body.entries()) {
                const v = gifFile(value);
                if (v !== value) changed = true;
                form.append(key, v);
            }
            return changed ? form : body;
        }
        (function gifOnSend() {
            const X = pageWindow.XMLHttpRequest.prototype, origSend = X.send;
            X.send = function (body) { return origSend.call(this, gifForm(body)); };
            const origFetch = pageWindow.fetch;
            pageWindow.fetch = function (input, init) {
                if (init && init.body instanceof FormData) init = Object.assign({}, init, { body: gifForm(init.body) });
                return origFetch.call(this, input, init);
            };
        })();

        const ERROR_TEXT = /ошибк|не удалось|не получилось|попробуйте|что-то пошло не так|error|failed/i;
        const ERROR_REPLIES = [
            'Нет, иди нахуй',
            'Пошёл нахуй',
            'Иди нахуй',
            'Нахуй иди',
            'А не пошёл бы ты нахуй',
            'Вали нахуй',
            'Отвали',
            'Хуй тебе',
            'Ты заебал, отвали',
            'Соси хуй'
        ];
        function replaceNotificationTexts() {
            document.querySelectorAll('[role="alert"], [role="status"], [aria-live]').forEach(box => {
                if (box.closest('.vp-msgs, .vpi-overlay')) return;
                [box, ...box.querySelectorAll('*')].forEach(el => {
                    if (el.childElementCount || el.textContent === el._vpReplaced) return;
                    if (!ERROR_TEXT.test(el.textContent)) return;
                    el.textContent = el._vpReplaced = ERROR_REPLIES[Math.floor(Math.random() * ERROR_REPLIES.length)];
                });
            });
        }

        onDom(replaceNotificationTexts);

        const emojiTints = new Map();
        let emojiCanvas = null;
        function emojiTint(emoji) {
            if (emojiTints.has(emoji)) return emojiTints.get(emoji);
            const c = measureEmojiColor(emoji);
            let tint = null;
            if (c) {
                const [r, g, b] = c.map(v => v / 255);
                const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
                let hue = 0;
                if (d) hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
                const sat = d ? Math.min(1, d / (1 - Math.abs(2 * l - 1)) * 1.25) : 0;
                const L = 0.55, C = (1 - Math.abs(2 * L - 1)) * sat, X = C * (1 - Math.abs((hue % 2 + 2) % 2 - 1)), m = L - C / 2;
                const [R, G, B] = [[C, X, 0], [X, C, 0], [0, C, X], [0, X, C], [X, 0, C], [C, 0, X]][Math.floor((hue + 6) % 6)];
                tint = [R, G, B].map(v => Math.round((v + m) * 255)).join(', ');
            }
            emojiTints.set(emoji, tint);
            return tint;
        }
        function measureEmojiColor(emoji) {
            if (!emojiCanvas) {
                emojiCanvas = document.createElement('canvas');
                emojiCanvas.width = emojiCanvas.height = 64;
            }
            const ctx = emojiCanvas.getContext('2d', { willReadFrequently: true });
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, 64, 64);
            ctx.font = '48px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, 32, 34);
            const data = ctx.getImageData(0, 0, 64, 64).data;
            const sum = [0, 0, 0];
            let count = 0;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] <= 128) continue;
                sum[0] += data[i]; sum[1] += data[i + 1]; sum[2] += data[i + 2];
                count++;
            }
            return count ? sum.map(v => Math.round(v / count)) : null;
        }
        function tintCard(el, emoji) {
            const tint = emoji && emojiTint(emoji);
            if (!tint) return false;
            el.style.setProperty('--vp-emoji', tint);
            el.classList.add('vp-emoji-tint');
            return true;
        }

        function untintCard(el) {
            el.classList.remove('vp-emoji-tint');
            el.style.removeProperty('--vp-emoji');
        }
        function colorizePosts() {
            document.querySelectorAll('article.' + SELECTORS.post).forEach(post => {
                const avatar = post.querySelector('.' + SELECTORS.avatarLink + ' .' + SELECTORS.avatar);
                const emoji = avatar ? avatar.textContent.trim() : '';
                const withBlur = postBlurEnabled && !!post.querySelector('.' + SELECTORS.postMedia);
                const key = emoji ? emoji + (withBlur ? '|blur' : '') : '';
                const tinted = !key || withBlur || post.classList.contains('vp-emoji-tint');
                if ((post.getAttribute('data-post-colored') || '') === key && tinted) return;
                untintCard(post);
                if (!key) { post.removeAttribute('data-post-colored'); return; }
                post.setAttribute('data-post-colored', key);
                if (!withBlur) tintCard(post, emoji);
            });
            document.querySelectorAll('article.' + SELECTORS.post + '[data-post-colored] .' + SELECTORS.repost + ':not([data-vp-soft])').forEach(rp => softenRepost(rp.closest('article')));
        }
        function softenRepost(post) {
            post.querySelectorAll('.' + SELECTORS.repost + ':not([data-vp-soft])').forEach(rp => {
                rp.setAttribute('data-vp-soft', '');
                [rp, ...rp.querySelectorAll('div, p, section')].forEach(el => {
                    if (el.closest('button, a, video') || el.querySelector(':scope > img, :scope > video')) return;
                    const m = getComputedStyle(el).backgroundColor.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
                    if (!m || (m[4] !== undefined && +m[4] < .5)) return;
                    el.classList.add('vp-soft-bg');
                });
            });
        }

        onDom(function postColors() {
            if (!location.pathname.includes('/notifications')) colorizePosts();
        });

        const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[\u200d\ufe0f\u{1F3FB}-\u{1F3FF}])+$/u;
        function emojiAvatarOf(item) {
            const tagged = item.querySelector('.' + SELECTORS.avatar);
            if (tagged && tagged.textContent.trim()) return tagged.textContent.trim();
            const leaves = [...item.querySelectorAll('span, div')].filter(e => !e.children.length && EMOJI_ONLY.test(e.textContent.trim()));
            const leaf = leaves.find(e => e.closest(PROFILE_LINK)) || leaves[0];
            return leaf ? leaf.textContent.trim() : null;
        }

        function avaTint(el, src) {
            let box = el.querySelector(':scope > .vp-ava-tint-bg');
            if (!box) {
                box = document.createElement('div');
                box.className = 'vp-ava-tint-bg';
                box.appendChild(document.createElement('div'));
                el.insertBefore(box, el.firstChild);
            }
            box.firstChild.style.backgroundImage = `url("${src}")`;
            el.classList.add('vp-ava-tint');
        }
        function untintAva(el) {
            el.classList.remove('vp-ava-tint');
            const box = el.querySelector(':scope > .vp-ava-tint-bg');
            if (box) box.remove();
        }
        function colorizeNotifications() {
            document.querySelectorAll('.' + SELECTORS.notification).forEach(el => {
                const emoji = emojiAvatarOf(el) || '';
                const img = emoji ? null : el.querySelector('.' + SELECTORS.avatar + ' img[src]');
                const key = emoji || (img ? img.src : '');
                if ((el.getAttribute('data-colored') || '') === key && (!key || el.classList.contains(emoji ? 'vp-emoji-tint' : 'vp-ava-tint'))) return;
                untintCard(el);
                untintAva(el);
                if (key) el.setAttribute('data-colored', key); else el.removeAttribute('data-colored');
                if (emoji) tintCard(el, emoji);
                else if (img) avaTint(el, img.src);
            });
        }

        onDom(function notificationColors() {
            if (location.pathname.includes('/notifications')) colorizeNotifications();
        });



