        const AVE_OUT = 512;
        const AVE_PREVIEWS = [96, 56, 32];
        addCss(`
        .vp-ava-edit { cursor: pointer; }
        html.vp-ave-lock, html.vp-ave-lock body { overflow: hidden !important; }
        .vp-ave { position: fixed; inset: 0; z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 16px;
            background: rgba(0, 0, 0, .62); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); animation: vp-ave-in .18s ease-out; }
        @keyframes vp-ave-in { from { opacity: 0; } to { opacity: 1; } }
        .vp-ave-card { width: min(380px, 100%); max-height: 100%; overflow-y: auto; box-sizing: border-box; padding: 16px; border-radius: 24px;
            background: var(--block-bg, #15151b); color: var(--text-primary, #fff); border: 1px solid var(--border-color, rgba(255, 255, 255, .12));
            box-shadow: 0 24px 60px rgba(0, 0, 0, .55); display: flex; flex-direction: column; gap: 14px; }
        .vp-ave-head { display: flex; align-items: center; justify-content: space-between; font-size: 17px; font-weight: 700; }
        .vp-ave-x { all: unset; cursor: pointer; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 24px; line-height: 1; color: var(--text-secondary, #9aa0b4); }
        .vp-ave-x:hover { background: rgba(128, 128, 128, .2); }
        .vp-ave-stage { position: relative; width: min(320px, 100%); aspect-ratio: 1; margin: 0 auto; border-radius: 16px; overflow: hidden; background: #0b0b10; touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; }
        .vp-ave-stage.vp-ave-drag { cursor: grabbing; }
        .vp-ave-stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        .vp-ave-mask { position: absolute; inset: 0; pointer-events: none;
            background: radial-gradient(circle at 50% 50%, transparent 0, transparent calc(50% - 1px), rgba(255, 255, 255, .85) calc(50% - 1px), rgba(255, 255, 255, .85) 50%, rgba(0, 0, 0, .58) 50%); }
        .vp-ave-zoom { display: flex; align-items: center; gap: 10px; color: var(--text-secondary, #9aa0b4); font-size: 13px; }
        .vp-ave-zoom input { flex: 1; accent-color: var(--accent-primary, #4f8cff); }
        .vp-ave-prev { display: flex; align-items: flex-end; justify-content: center; gap: 18px; padding: 4px 0; }
        .vp-ave-prev canvas { border-radius: 50%; display: block; background: #0b0b10; box-shadow: 0 0 0 1px rgba(128, 128, 128, .35); }
        .vp-ave-msg { min-height: 18px; text-align: center; font-size: 13px; color: var(--text-secondary, #9aa0b4); }
        .vp-ave-msg.vp-bad { color: #ff6b81; }
        .vp-ave-btns { display: flex; gap: 10px; }
        .vp-ave-btns button { all: unset; box-sizing: border-box; flex: 1; text-align: center; cursor: pointer; padding: 12px 10px; border-radius: 14px; font-weight: 600; font-size: 15px;
            background: rgba(128, 128, 128, .2); color: var(--text-primary, #fff); }
        .vp-ave-btns button:hover { background: rgba(128, 128, 128, .32); }
        .vp-ave-btns .vp-ave-ok { background: var(--accent-primary, #4f8cff); color: #fff; }
        .vp-ave-btns .vp-ave-ok:hover { filter: brightness(1.1); }
        .vp-ave-btns button:disabled { opacity: .45; cursor: default; pointer-events: none; }
        @media (prefers-reduced-motion: reduce) { .vp-ave { animation: none; } }
    `);

        const aveOwnPage = () => {
            const m = location.pathname.match(/^\/@([^/]+)\/?$/);
            return !!(m && myUsername && decodeURIComponent(m[1]).toLowerCase() === myUsername.toLowerCase());
        };
        function aveBigOwn(t) {
            const av = t && t.closest && t.closest('.' + SELECTORS.avatar);
            if (!av || !aveOwnPage() || av.closest('article, .' + SELECTORS.post + ', nav, aside, .vp-msgs, .vp-ave')) return null;
            return av.getBoundingClientRect().width >= 60 ? av : null;
        }
        onDom(function avatarEditMark() {
            if (!aveOwnPage()) { document.querySelectorAll('.vp-ava-edit').forEach(e => e.classList.remove('vp-ava-edit')); return; }
            document.querySelectorAll('.' + SELECTORS.avatar).forEach(av => { if (av.classList.contains('vp-ava-edit') !== !!aveBigOwn(av)) av.classList.toggle('vp-ava-edit'); });
        });

        function avatarEditor(startSrc) {
            if (document.querySelector('.vp-ave')) return;
            const root = document.createElement('div');
            root.className = 'vp-ave';
            root.setAttribute('role', 'dialog');
            root.setAttribute('aria-label', 'Аватарка');
            root.innerHTML = `<div class="vp-ave-card">
                <div class="vp-ave-head"><span>Аватарка</span><button type="button" class="vp-ave-x" aria-label="Закрыть">×</button></div>
                <div class="vp-ave-stage"><canvas></canvas><div class="vp-ave-mask"></div></div>
                <label class="vp-ave-zoom"><span>Масштаб</span><input type="range" min="100" max="500" value="100" disabled></label>
                <div class="vp-ave-prev">${AVE_PREVIEWS.map(s => `<canvas data-s="${s}"></canvas>`).join('')}</div>
                <div class="vp-ave-msg">Выбери картинку, подвинь и приблизь её внутри кружка</div>
                <div class="vp-ave-btns"><button type="button" class="vp-ave-pick">Выбрать картинку</button><button type="button" class="vp-ave-ok" disabled>Применить</button></div>
                <input type="file" accept="image/*" hidden>
            </div>`;
            document.body.appendChild(root);
            document.documentElement.classList.add('vp-ave-lock');
            const $ = s => root.querySelector(s);
            const stage = $('.vp-ave-stage'), cv = stage.querySelector('canvas'), zoom = $('.vp-ave-zoom input'), msg = $('.vp-ave-msg'), ok = $('.vp-ave-ok'), pick = $('.vp-ave-pick'), file = $('input[type=file]');
            const prevs = [...root.querySelectorAll('.vp-ave-prev canvas')];
            const st = { img: null, iw: 0, ih: 0, z: 1, cx: 0, cy: 0, picked: false, busy: false };
            const say = (t, bad) => { msg.textContent = t; msg.classList.toggle('vp-bad', !!bad); };
            const close = () => {
                document.removeEventListener('keydown', onKey, true);
                document.documentElement.classList.remove('vp-ave-lock');
                if (st.url) URL.revokeObjectURL(st.url);
                root.remove();
            };
            const onKey = e => { if (e.key === 'Escape' && !st.busy) { e.stopPropagation(); close(); } };
            document.addEventListener('keydown', onKey, true);
            const side = () => Math.min(st.iw, st.ih) / st.z;
            const clamp = () => {
                const sw = side();
                st.cx = Math.min(st.iw - sw / 2, Math.max(sw / 2, st.cx));
                st.cy = Math.min(st.ih - sw / 2, Math.max(sw / 2, st.cy));
            };
            const paint = c => {
                const g = c.getContext('2d');
                g.clearRect(0, 0, c.width, c.height);
                if (!st.img) return;
                const sw = side();
                g.imageSmoothingQuality = 'high';
                g.drawImage(st.img, st.cx - sw / 2, st.cy - sw / 2, sw, sw, 0, 0, c.width, c.height);
            };
            const render = () => {
                const dpr = Math.min(2, devicePixelRatio || 1), w = Math.round(stage.clientWidth * dpr);
                if (w && cv.width !== w) { cv.width = cv.height = w; }
                clamp();
                paint(cv);
                prevs.forEach(c => {
                    const s = +c.dataset.s, px = Math.round(s * Math.min(2, devicePixelRatio || 1));
                    if (c.width !== px) { c.width = c.height = px; c.style.width = c.style.height = s + 'px'; }
                    paint(c);
                });
            };
            const setImage = (img, url, picked) => {
                if (st.url) URL.revokeObjectURL(st.url);
                st.img = img; st.url = url; st.iw = img.naturalWidth; st.ih = img.naturalHeight;
                st.z = 1; st.cx = st.iw / 2; st.cy = st.ih / 2; st.picked = picked;
                zoom.value = 100; zoom.disabled = !picked; ok.disabled = !picked;
                render();
            };
            const loadFile = f => {
                if (!f || !/^image\//.test(f.type)) { say('Это не картинка', true); return; }
                const url = URL.createObjectURL(f), img = new Image();
                img.onload = () => { if (!img.naturalWidth) { say('Картинка не открылась', true); return; } setImage(img, url, true); say('Двигай картинку пальцем или мышью, колесо или ползунок — масштаб'); };
                img.onerror = () => { URL.revokeObjectURL(url); say('Картинка не открылась', true); };
                img.src = url;
            };
            if (startSrc) {
                const img = new Image();
                img.onload = () => { if (!st.picked && img.naturalWidth) { st.img = img; st.iw = img.naturalWidth; st.ih = img.naturalHeight; st.cx = st.iw / 2; st.cy = st.ih / 2; render(); } };
                img.src = startSrc;
            }
            requestAnimationFrame(render);
            addEventListener('resize', render);
            const pointers = new Map();
            let pinch = null;
            stage.addEventListener('pointerdown', e => {
                if (!st.picked) return;
                stage.setPointerCapture(e.pointerId);
                pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
                stage.classList.add('vp-ave-drag');
                if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: st.z }; }
            });
            stage.addEventListener('pointermove', e => {
                const p = pointers.get(e.pointerId);
                if (!p) return;
                const k = side() / stage.clientWidth;
                if (pointers.size === 2 && pinch) {
                    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
                    const [a, b] = [...pointers.values()];
                    st.z = Math.min(5, Math.max(1, pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d));
                    zoom.value = Math.round(st.z * 100);
                } else {
                    st.cx -= (e.clientX - p.x) * k; st.cy -= (e.clientY - p.y) * k;
                    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
                }
                render();
            });
            const up = e => {
                pointers.delete(e.pointerId);
                if (pointers.size < 2) pinch = null;
                if (!pointers.size) stage.classList.remove('vp-ave-drag');
            };
            stage.addEventListener('pointerup', up);
            stage.addEventListener('pointercancel', up);
            stage.addEventListener('wheel', e => {
                if (!st.picked) return;
                e.preventDefault();
                st.z = Math.min(5, Math.max(1, st.z * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
                zoom.value = Math.round(st.z * 100);
                render();
            }, { passive: false });
            zoom.addEventListener('input', () => { st.z = zoom.value / 100; render(); });
            stage.addEventListener('dragover', e => e.preventDefault());
            stage.addEventListener('drop', e => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); });
            pick.addEventListener('click', () => file.click());
            stage.addEventListener('click', () => { if (!st.picked) file.click(); });
            file.addEventListener('change', () => { loadFile(file.files[0]); file.value = ''; });
            $('.vp-ave-x').addEventListener('click', () => { if (!st.busy) close(); });
            root.addEventListener('pointerdown', e => { if (e.target === root && !st.busy) close(); });
            ok.addEventListener('click', async () => {
                if (!st.picked || st.busy) return;
                st.busy = true; ok.disabled = true; pick.disabled = true;
                say('Загружаю…');
                try {
                    const out = document.createElement('canvas');
                    out.width = out.height = AVE_OUT;
                    const g = out.getContext('2d');
                    g.fillStyle = '#101014';
                    g.fillRect(0, 0, AVE_OUT, AVE_OUT);
                    paint(out);
                    const blob = await new Promise(r => out.toBlob(r, 'image/jpeg', 0.92));
                    if (!blob) throw new Error('не удалось подготовить картинку');
                    const fd = new FormData();
                    fd.append('file', blob, 'avatar.jpg');
                    const res = await api('/api/files/avatar', { method: 'POST', body: fd });
                    const text = await res.text();
                    let j = null;
                    try { j = JSON.parse(text); } catch (e) { }
                    console.log('[ITD VP] аватарка: ответ сервера', res.status, text.slice(0, 400));
                    if (!res.ok) throw new Error((j && (j.error && j.error.message || j.message)) || 'сайт ответил ' + res.status);
                    const d = j && (j.data || j), url = d && (typeof d.url === 'string' ? d.url : typeof d.avatar === 'string' ? d.avatar : d.avatar && d.avatar.url) || '';
                    const mine = await api('/api/users/me').then(r => r.json()).catch(() => null), md = mine && (mine.data || mine), now = md && (md.avatar && md.avatar.url || md.avatar);
                    if (url && String(now || '') !== url) {
                        const r2 = await api('/api/users/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar: url }) });
                        console.log('[ITD VP] аватарка: привязка к профилю', r2.status);
                    }
                    say('Готово, обновляю страницу…');
                    setTimeout(() => location.reload(), 700);
                } catch (error) {
                    const m = String(error && error.message || error);
                    say(/модерац|MODERATION|запрещ/i.test(m) ? 'Картинка не прошла модерацию — возьми другую' : /сети|network|fetch/i.test(m) ? 'Нет связи с сайтом, попробуй ещё раз' : 'Не вышло: ' + m, true);
                    logErr('аватарка', error);
                    st.busy = false; ok.disabled = false; pick.disabled = false;
                }
            });
        }
        document.addEventListener('click', e => {
            const av = aveBigOwn(e.target);
            if (!av) return;
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            const img = av.querySelector('img');
            avatarEditor(img && img.src);
        }, true);
