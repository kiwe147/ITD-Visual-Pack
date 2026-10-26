        const LOOK_RE = /^ITDXL1 (.+)$/;
        const VER_RE = /^\d{1,3}(\.\d{1,4}){1,4}$/;
        const MOD_VER = (() => { try { const v = GM_info.script.version; return VER_RE.test(v) ? v : ''; } catch (e) { return ''; } })();
        const verCmp = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };
        function parseLook(t) {
            const m = openText(t).match(LOOK_RE);
            if (!m) return null;
            const o = {};
            for (const tok of m[1].split(/\s+/)) { const i = tok.indexOf('='); if (i > 0) o[tok.slice(0, i)] = tok.slice(i + 1); }
            if (!nickStyles[o.n]) return null;
            const look = { n: o.n, b: '-', g: /^[01]{2}$/.test(o.g || '') ? o.g : '11' };
            if (o.b === 'custom' ? /^[0-4][0-9a-f]{32}$/.test(o.i || '') : BG_KEYS.includes(o.b)) look.b = o.b;
            if (look.b === 'custom') look.i = o.i;
            if (look.b === 'custom' && BANNER_VIDEO_RE.test(o.bv || '')) look.bv = o.bv;
            if (BANNER_VIDEO_RE.test(o.v || '')) look.v = o.v;
            if (/^[0-4][0-9a-f]{32}$/.test(o.a || '')) look.a = o.a;
            if (BANNER_VIDEO_RE.test(o.va || '')) look.va = o.va;
            if (VER_RE.test(o.ver || '')) look.ver = o.ver;
            if (/^\d{5,6}$/.test(o.t || '')) look.t = +o.t;
            return look;
        }
        let avaLookOf = () => '', avaReady = false;
        const avaUrlOf = login => avaLookOf(String(login || '').toLowerCase());
        function lookImgUrl(ref) {
            const h = ref.slice(1);
            return `https://cdn.xn--d1ah4a.com/images/${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}.${MSG_IMG_EXT[+ref[0]] || 'png'}`;
        }
        function videoFrame(blob) {
            return new Promise((ok, no) => {
                const v = document.createElement('video'), u = URL.createObjectURL(blob);
                v.muted = true; v.preload = 'auto'; v.src = u;
                v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 2) / 2); };
                v.onseeked = () => {
                    const c = document.createElement('canvas');
                    c.width = v.videoWidth; c.height = v.videoHeight;
                    c.getContext('2d').drawImage(v, 0, 0);
                    URL.revokeObjectURL(u);
                    c.toBlob(b => b ? ok(new File([b], 'bg.jpg', { type: 'image/jpeg' })) : no(new Error('кадр видео')), 'image/jpeg', 0.85);
                };
                v.onerror = () => { URL.revokeObjectURL(u); no(new Error('видео фона')); };
            });
        }
        async function customBgCdn() {
            const blob = await bgFile().catch(() => null);
            if (!blob) return '';
            const sig = blob.size + ':' + blob.type;
            const saved = GM_getValue(acctKey('vp_bg_cdn'), null);
            const video = /^video\//.test(blob.type);
            if (saved && saved.sig === sig && saved.ref && (!video || 'vid' in saved || Date.now() - (saved.vidFail || 0) < 36e5)) return saved;
            let ref = saved && saved.sig === sig && saved.ref;
            if (!ref) {
                const img = await msgUploadImage(video ? await videoFrame(blob) : new File([blob], 'bg', { type: blob.type }));
                ref = img.ext + img.id.replace(/-/g, '');
            }
            let vid = '';
            if (video && blob.size <= VIDEO_UP_MAX) vid = await uploadVideo(new File([blob], 'bg.' + (blob.type.split('/')[1] || 'mp4').replace('quicktime', 'mov'), { type: blob.type })).catch(e => { logErr('видео фона на сервер', e); return null; });
            const out = vid === null ? { sig, ref, vidFail: Date.now() } : { sig, ref, vid };
            GM_setValue(acctKey('vp_bg_cdn'), out);
            return out;
        }
        const VIDEO_UP_MAX = 30 * 1024 * 1024;
        async function uploadVideo(f) {
            const fd = new FormData();
            fd.append('file', f, f.name || 'video.mp4');
            const res = await api('/api/files/upload', { method: 'POST', body: fd });
            const j = await res.json().catch(() => null), d = j && (j.data || j);
            if (!res.ok) throw new Error((d && (d.error && d.error.message || d.message)) || 'сайт ответил ' + res.status);
            const m = String(d && d.url || '').match(/^https:\/\/cdn\.xn--d1ah4a\.com\/(.+)$/);
            if (!m || !BANNER_VIDEO_RE.test(m[1])) throw new Error('сайт вернул не видео: ' + String(d && d.url || '—').slice(0, 90));
            return m[1];
        }
        let lookBusy = false, lookSent = '', lookRetryAt = 0, lookFails = 0;
        const LOOK_RETRY = [60000, 120000, 300000, 600000];
        const lookLater = () => { lookRetryAt = Date.now() + LOOK_RETRY[Math.min(lookFails++, LOOK_RETRY.length - 1)]; };
        async function lookVer() {
            if (!MOD_VER) return '';
            const c = GM_getValue('vp_vx', null);
            if (c && c.v === MOD_VER && c.x) return c.x;
            try { const x = await ownerSeal(new TextEncoder().encode(MOD_VER)); GM_setValue('vp_vx', { v: MOD_VER, x }); return x; }
            catch (e) { logErr('версия', e); return ''; }
        }
        async function publishLook() {
            const myId = meData && meData.id;
            if (!myId || lookBusy || Date.now() < lookRetryAt) return;
            lookBusy = true;
            try {
                const b = backgroundEnabled ? backgroundStyle : '-';
                const today = Math.floor(srvNow() / 864e5), was = GM_getValue(acctKey('vp_look_day'), 0), day = today - was < 7 && today >= was ? was : today;
                const own = GM_getValue(acctKey('vp_ava'), null) || {}, ownAva = own.ref || '', ownVid = ownAva && own.vid || '';
                let img = '', bv = '';
                if (b === 'custom') ({ ref: img = '', vid: bv = '' } = await customBgCdn().then(x => x || {}).catch(e => { logErr('свой фон на сервер', e); return {}; }));
                let text = `ITDXL1 n=${currentStyle} b=${b === 'custom' && !img ? '-' : b} g=${nickGlowEnabled ? 1 : 0}${avatarGlowEnabled ? 1 : 0}` + (img ? ' i=' + img : '') + (img && bv ? ' bv=' + bv : '') + (bannerVideoOwn() ? ' v=' + bannerVideoOwn() : '') + (ownAva ? ' a=' + ownAva : '') + (ownVid ? ' va=' + ownVid : '') + await lookVer().then(x => x ? ' vx=' + x : '') + ' t=' + day;
                for (const k of ['va', 'bv', 'v', 'a']) { if (sealText(text).length <= 990) break; text = text.split(' ').filter(t => !t.startsWith(k + '=')).join(' '); }
                if (text === lookSent) return;
                const all = await loadVerificationComments();
                const mine = all.find(c => c.author && c.author.id === myId && LOOK_RE.test(openText(c.content)));
                if (mine && openText(mine.content) === text && String(mine.content).startsWith('ITDXE ')) { lookSent = text; GM_setValue(acctKey('vp_look_day'), day); return; }
                const content = sealText(text);
                const res = mine
                    ? await editComment(mine.id, content)
                    : await sendComment(VERIFICATION_POST_ID, content);
                if (res.ok) { lookSent = text; lookFails = 0; GM_setValue(acctKey('vp_look_day'), day); if (day !== was) checkAllComments(true); }
                else lookLater();
            } catch (e) { lookLater(); logErr('стиль', e); } finally { lookBusy = false; }
        }
        let accentProbe = null;
        function onAccentFor(color, dark) {
            try {
                if (!accentProbe) { accentProbe = document.createElement('i'); accentProbe.style.display = 'none'; }
                if (!accentProbe.isConnected) (document.body || document.documentElement).appendChild(accentProbe);
                accentProbe.style.color = '';
                accentProbe.style.color = color;
                const c = getComputedStyle(accentProbe).color, n = (c.match(/[\d.]+/g) || []).map(Number);
                if (n.length < 3) return dark ? '#0b0b0f' : '#fff';
                const k = /^color\(/.test(c) ? 1 : 1 / 255;
                const lin = v => { v *= k; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
                const L = 0.2126 * lin(n[0]) + 0.7152 * lin(n[1]) + 0.0722 * lin(n[2]);
                return (L + 0.05) / 0.05 >= 1.05 / (L + 0.05) ? '#0b0b0f' : '#fff';
            } catch (e) { return dark ? '#0b0b0f' : '#fff'; }
        }
        function accentOf(style) {
            if (style.color && style.color.startsWith('#')) return style.color;
            return `hsl(${style.avatarHue || 210}, ${style.avatarSat ?? 100}%, 62%)`;
        }
        function isDarkTheme() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
        function applySiteTheme() {
            document.documentElement.classList.toggle('vp-light', !isDarkTheme());
            rememberSiteTheme();
            paint();
        }
        function rememberSiteTheme() {
            const t = document.documentElement.getAttribute('data-theme');
            if (t && GM_getValue('siteTheme', '') !== (t === 'dark' ? 'dark' : 'light')) GM_setValue('siteTheme', t === 'dark' ? 'dark' : 'light');
        }
        rememberSiteTheme();
        document.documentElement.classList.toggle('vp-light', !isDarkTheme());
        new MutationObserver(applySiteTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        function stepHue(dt = 1) {
            globalHue += colorDirection * 0.8 * dt;
            if (globalHue >= 360) { globalHue = 360; colorDirection = -1; }
            else if (globalHue <= 0) { globalHue = 0; colorDirection = 1; }
        }

        function glowMyAvatar(avatar) {
            if (avatar && avatar.isConnected) avatar.classList.add('my-avatar-glow');
        }
        function markMyNick(nickSpan) {
            nickSpan.classList.add('vp-my-nick');
            const box = nickSpan.closest('.' + SELECTORS.nickContainer);
            if (box) box.classList.add('vp-my-nick-box');
            glowRoom(box || nickSpan);
        }
        const GLOW_ROOM = 60, CLIP_MARGIN = typeof CSS !== 'undefined' && CSS.supports('overflow-clip-margin', '1px');
        function glowRoom(el) {
            for (let p = el, i = 0; p && i < 4 && p !== document.body; p = p.parentElement, i++) {
                if (p.matches('article, .' + SELECTORS.post)) return;
                if (p._vpGlowRoom) continue;
                const cs = getComputedStyle(p);
                if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
                if (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowY === 'auto' || cs.overflowY === 'scroll') continue;
                p._vpGlowRoom = true;
                if (CLIP_MARGIN) {
                    p.style.setProperty('overflow', 'clip', 'important');
                    p.style.setProperty('overflow-clip-margin', GLOW_ROOM + 'px', 'important');
                    continue;
                }
                const px = v => parseFloat(v) || 0, r = 8;
                p.style.setProperty('padding', `${px(cs.paddingTop) + r}px ${px(cs.paddingRight) + r}px ${px(cs.paddingBottom) + r}px ${px(cs.paddingLeft) + r}px`, 'important');
                p.style.setProperty('margin', `${px(cs.marginTop) - r}px ${px(cs.marginRight) - r}px ${px(cs.marginBottom) - r}px ${px(cs.marginLeft) - r}px`, 'important');
            }
        }

        let popup = null;

        let popupHist = false;
        function closePopup(keepHist) {
            if (!popup) return;
            popup.el.remove();
            window.removeEventListener('scroll', placePopup, true);
            window.removeEventListener('resize', placePopup);
            document.removeEventListener('click', clickOutsidePopup, true);
            popup = null;
            if (popupHist && !keepHist) {
                popupHist = false;
                if (history.state && history.state.vpPopup) history.back();
            }
        }
        window.addEventListener('popstate', () => {
            if (!popupHist) return;
            popupHist = false;
            closePopup();
        });
        function placePopup() {
            if (!popup) return;
            const r = popup.btn.getBoundingClientRect();
            if (!popup.btn.isConnected || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) {
                closePopup();
                return;
            }
            const w = popup.el.offsetWidth, h = popup.el.offsetHeight;
            if (popup.el.classList.contains('vp-settings-tabs')) {
                const cx = innerWidth < 600 ? innerWidth / 2 : r.left + r.width / 2;
                popup.el.style.left = Math.max(8, Math.min(cx - w / 2, innerWidth - w - 8)) + 'px';
                const vh = window.visualViewport ? Math.min(innerHeight, visualViewport.height) : innerHeight;
                const fixedH = Math.min(vh - 16, 580);
                popup.el.style.height = popup.el.style.maxHeight = fixedH + 'px';
                popup.el.style.top = Math.max(8, Math.min(r.bottom + 8, vh - fixedH - 8)) + 'px';
                return;
            }
            let left = r.right + 8;
            if (left + w > innerWidth) left = r.left - w - 8;
            popup.el.style.left = Math.max(8, left) + 'px';
            popup.el.style.top = Math.max(8, Math.min(r.top, innerHeight - h - 8)) + 'px';
        }
        function clickOutsidePopup(e) {
            if (popup && !popup.el.contains(e.target) && !popup.btn.contains(e.target)) closePopup();
        }
        function openPopup(btn, el) {
            const same = popup && popup.btn === btn;
            closePopup(!same);
            if (same) return false;
            popup = { el, btn };
            if (!popupHist) {
                history.pushState(Object.assign({}, history.state, { vpPopup: true }), '', location.href);
                popupHist = true;
            }
            el.style.position = 'fixed';
            document.body.appendChild(el);
            placePopup();
            window.addEventListener('scroll', placePopup, true);
            window.addEventListener('resize', placePopup);
            document.addEventListener('click', clickOutsidePopup, true);
            return true;
        }

        function menuOption(icon, label, onPick, active) {
            const option = document.createElement('div');
            option.className = 'nick-style-option' + (active ? ' vp-active' : '');
            const text = document.createElement('span');
            text.textContent = label;
            option.append(icon, text);
            if (active) {
                option.setAttribute('aria-checked', 'true');
                const mark = document.createElement('span');
                mark.className = 'vp-opt-check';
                mark.innerHTML = svgIcon(GLYPH.check, 16);
                option.appendChild(mark);
            }
            option.onclick = (e) => { e.stopPropagation(); onPick(); closePopup(); };
            return option;
        }

        const LOGO_LINKS = [
            ['ТГК', TG_URL, '<path d="M21 4 3 11l6 2m12-9-3 16-9-7m12-9L9 13m0 0v6l3-4"/>'],
            ['ТГ Чат', TG_CHAT_URL, '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>'],
            ['Донат', 'https://donatex.gg/donate/kiwe147', '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>']
        ];
        document.addEventListener('click', e => {
            const a = e.target.closest && e.target.closest(`a[href="${TG_URL}"]`);
            if (!a || !a.querySelector('img, svg')) return;
            e.preventDefault(); e.stopPropagation();
            const menu = document.createElement('div');
            menu.className = 'settings-dropdown vp-logo-menu';
            for (const [label, url, icon] of LOGO_LINKS) {
                const ic = document.createElement('span');
                ic.className = 'vp-opt-icon';
                ic.innerHTML = svgIcon(icon, 18);
                menu.appendChild(menuOption(ic, label, () => window.open(url, '_blank', 'noopener')));
            }
            openPopup(a, menu);
        }, true);

        function getColorDot(styleKey) {
            const style = nickStyles[styleKey];
            const dot = document.createElement('div');
            dot.className = 'style-color-dot';
            if (styleKey === 'rainbow') {
                dot.classList.add('rainbow-dot');
            } else {
                dot.style.background = style.color;
                dot.style.boxShadow = `0 0 6px ${style.color}`;
            }
            return dot;
        }
        const BG_STYLES = {
            matrix: { name: 'Матрица', icon: svgIcon('<path d="M6 3v3M6 9.5v5M6 18v3M12 3v6M12 12.5v2M12 18v3M18 3v2M18 8.5v6M18 18v3"/>') },
            stars: { name: 'Звёзды', icon: svgIcon('<path d="M10 3.5l1.6 3.9 3.9 1.6-3.9 1.6L10 14.5l-1.6-3.9L4.5 9l3.9-1.6z"/><path d="M17.5 13.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>') },
            waves: { name: 'Волны', icon: svgIcon('<path d="M3 8c2.5-3 5-3 7.5 0s5 3 7.5 0M3 13c2.5-3 5-3 7.5 0s5 3 7.5 0M3 18c2.5-3 5-3 7.5 0s5 3 7.5 0"/>') },
            particles: { name: 'Частицы', icon: svgIcon('<circle cx="5" cy="7" r="1.8"/><circle cx="18" cy="5" r="1.8"/><circle cx="12" cy="13" r="1.8"/><circle cx="6" cy="19" r="1.8"/><circle cx="19" cy="17" r="1.8"/><path d="m6.6 8.1 3.9 3.8M16.6 6.2l-3.5 5.2M10.7 14.4l-3.4 3.4M13.6 13.8l3.8 2.4"/>') },
            aurora: { name: 'Сияние', icon: svgIcon('<path d="M3 14c3-5 6-7 9-7s6 2 9 7"/><path d="M6 17c2-3 4-4.5 6-4.5s4 1.5 6 4.5"/><path d="M3 21h18"/>') },
            bokeh: { name: 'Боке', icon: svgIcon('<circle cx="8" cy="9" r="4"/><circle cx="16.5" cy="15.5" r="4.5"/><circle cx="17" cy="6" r="1.5"/>') },
            grid: { name: 'Неон-сетка', icon: svgIcon('<path d="M8 8a4 4 0 0 1 8 0"/><path d="M2 12h20"/><path d="M12 12v9M12 12l-8 9M12 12l8 9M5 17h14"/>') },
            snow: { name: 'Снегопад', icon: svgIcon('<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/>') },
            custom: { name: 'Своя картинка', icon: svgIcon('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>') }
        };
