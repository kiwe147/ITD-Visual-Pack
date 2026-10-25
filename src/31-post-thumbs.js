        function thumbBoxes() {
            const seen = new Set(), out = [];
            document.querySelectorAll('img[src^="blob:"]').forEach(img => {
                const th = img.parentElement, box = th && th.parentElement;
                if (!box || seen.has(box) || box.closest('.vp-msgs, .vp-gal, .vp-sw-stage, nav, aside')) return;
                if (!th.querySelector(':scope > button')) return;
                seen.add(box); out.push(box);
            });
            return out;
        }
        const isThumb = c => !!c.querySelector(':scope > img[src^="blob:"]') && !!c.querySelector(':scope > button');
        onDom(function thumbMark() {
            thumbBoxes().forEach(box => {
                box.classList.add('vp-thumbs');
                const kids = [...box.children].filter(isThumb);
                [...box.children].forEach(c => { const on = kids.includes(c); c.classList.toggle('vp-thumb', on); if (on && kids.length > 1) { if (!c.title) c.title = 'Потяни, чтобы поменять порядок'; } else if (c.title === 'Потяни, чтобы поменять порядок') c.removeAttribute('title'); });
            });
        });
        function thumbHook(box) {
            const el = box.wrappedJSObject || box, key = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
            if (!key) return null;
            for (let f = el[key]; f; f = f.return) {
                for (let h = f.memoizedState; h && typeof h === 'object'; h = h.next) {
                    const v = h.memoizedState;
                    if (Array.isArray(v) && v.length && v[0] && typeof v[0] === 'object' && 'mediaId' in v[0] && h.queue && typeof h.queue.dispatch === 'function') return h;
                }
            }
            return null;
        }
        function thumbBridge() {
            if (document.documentElement.dataset.vpThumbBridge) return;
            document.documentElement.dataset.vpThumbBridge = '1';
            const s = document.createElement('script');
            s.textContent = '(' + function () {
                addEventListener('vp-thumbs', function () {
                    var box = document.querySelector('[data-vp-box="1"]');
                    if (!box) return;
                    var order = (box.getAttribute('data-vp-order') || '').split(',').map(Number), res = 'nofiber';
                    var key = Object.keys(box).filter(function (k) { return k.indexOf('__reactFiber$') === 0; })[0];
                    if (key) {
                        for (var f = box[key]; f && res !== 'ok'; f = f.return) {
                            for (var h = f.memoizedState; h && typeof h === 'object'; h = h.next) {
                                var v = h.memoizedState;
                                if (Array.isArray(v) && v.length === order.length && v[0] && typeof v[0] === 'object' && 'mediaId' in v[0] && h.queue && typeof h.queue.dispatch === 'function') {
                                    h.queue.dispatch(order.map(function (i) { return v[i]; }));
                                    res = 'ok';
                                    break;
                                }
                            }
                        }
                    }
                    box.setAttribute('data-vp-res', res);
                });
            } + ')();';
            document.documentElement.appendChild(s);
            s.remove();
        }
        function vpNote(text) {
            document.querySelectorAll('.vp-note').forEach(n => n.remove());
            const n = document.createElement('div');
            n.className = 'vp-note';
            n.textContent = text;
            document.body.appendChild(n);
            setTimeout(() => n.remove(), 3400);
        }
        function thumbsReorder(box, from, to) {
            const items = [...box.querySelectorAll(':scope > .vp-thumb')], a = items.indexOf(from), b = items.indexOf(to);
            if (a < 0 || b < 0 || a === b) return;
            const order = items.map((_, i) => i);
            order.splice(a, 1); order.splice(b, 0, a);
            const hook = thumbHook(box);
            if (hook && hook.memoizedState.length === items.length) {
                const next = new pageWindow.Array();
                order.forEach(i => next.push(hook.memoizedState[i]));
                hook.queue.dispatch(next);
                return;
            }
            thumbBridge();
            document.querySelectorAll('[data-vp-box]').forEach(x => x.removeAttribute('data-vp-box'));
            box.setAttribute('data-vp-box', '1');
            box.setAttribute('data-vp-order', order.join(','));
            box.removeAttribute('data-vp-res');
            dispatchEvent(new Event('vp-thumbs'));
            const res = box.getAttribute('data-vp-res');
            box.removeAttribute('data-vp-box'); box.removeAttribute('data-vp-order'); box.removeAttribute('data-vp-res');
            if (res !== 'ok') vpNote('Не получилось поменять порядок картинок. Подожди, пока всё загрузится, и попробуй ещё раз');
        }
        const thumbDrag = { cur: null, mute: 0 };
        function thumbAt(d, x, y) {
            const list = [...d.box.querySelectorAll(':scope > .vp-thumb')].filter(t => t !== d.th);
            let best = null, dist = 1e9;
            for (const t of list) {
                const r = t.getBoundingClientRect();
                if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return t;
                const k = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
                if (k < dist) { dist = k; best = t; }
            }
            return best && dist < 90 ? best : null;
        }
        document.addEventListener('pointerdown', e => {
            if (e.button || !e.target.closest || e.target.closest('button')) return;
            const th = e.target.closest('.vp-thumbs > .vp-thumb');
            if (!th || th.parentElement.querySelectorAll(':scope > .vp-thumb').length < 2 || th.parentElement.classList.contains('vp-thumbs-busy')) return;
            thumbDrag.cur = { th, box: th.parentElement, x: e.clientX, y: e.clientY, on: false, id: e.pointerId };
        }, true);
        document.addEventListener('pointermove', e => {
            const d = thumbDrag.cur;
            if (!d || e.pointerId !== d.id) return;
            const dx = e.clientX - d.x, dy = e.clientY - d.y;
            if (!d.on) {
                if (Math.hypot(dx, dy) < 6) return;
                d.on = true;
                d.th.classList.add('vp-thumb-lift');
                try { d.th.setPointerCapture(e.pointerId); } catch (x) { }
            }
            d.th.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(1.06)';
            const over = thumbAt(d, e.clientX, e.clientY);
            d.box.querySelectorAll('.vp-thumb-over').forEach(t => { if (t !== over) t.classList.remove('vp-thumb-over'); });
            if (over) over.classList.add('vp-thumb-over');
            e.preventDefault();
        }, true);
        const thumbEnd = ok => e => {
            const d = thumbDrag.cur;
            if (!d || e.pointerId !== d.id) return;
            thumbDrag.cur = null;
            if (!d.on) return;
            const over = ok ? thumbAt(d, e.clientX, e.clientY) : null;
            d.th.classList.remove('vp-thumb-lift');
            d.th.style.transform = '';
            d.box.querySelectorAll('.vp-thumb-over').forEach(t => t.classList.remove('vp-thumb-over'));
            thumbDrag.mute = Date.now() + 250;
            if (over) thumbsReorder(d.box, d.th, over);
        };
        document.addEventListener('pointerup', thumbEnd(true), true);
        document.addEventListener('pointercancel', thumbEnd(false), true);
        document.addEventListener('click', e => { if (e.isTrusted && Date.now() < thumbDrag.mute && e.target.closest && e.target.closest('.vp-thumbs')) { e.preventDefault(); e.stopPropagation(); } }, true);
        addCss(`
        .vp-thumbs > .vp-thumb { touch-action: none; cursor: grab; user-select: none; -webkit-user-select: none; transition: box-shadow .18s ease, outline-color .15s ease; }
        .vp-thumbs > .vp-thumb img { -webkit-user-drag: none; user-select: none; }
        .vp-thumbs > .vp-thumb-lift { position: relative; z-index: 6; cursor: grabbing; transition: none; box-shadow: 0 14px 34px rgba(0, 0, 0, .5); }
        .vp-thumbs > .vp-thumb-over { outline: 2px solid var(--vp-accent, #f91880); outline-offset: 2px; }
        .vp-note { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 2147483000; max-width: min(460px, calc(100vw - 32px)); padding: 10px 18px; border-radius: 14px; background: rgba(20, 20, 20, .95); color: #fff; font-size: 14px; line-height: 1.35; text-align: center; box-shadow: 0 10px 30px rgba(0, 0, 0, .5); animation: vpNoteIn .22s ease-out both; }
        @keyframes vpNoteIn { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
        `);
