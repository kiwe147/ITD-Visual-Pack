        let holdEl = null, holdTop = 0, holdQueued = false;
        function holdPick() {
            for (const s of document.querySelectorAll('.vp-post-slot')) {
                if (s.closest('article')) continue;
                const r = s.getBoundingClientRect();
                if (r.height > 0 && r.bottom > 1) { holdEl = s; holdTop = r.top + scrollY; return; }
            }
            holdEl = null;
        }
        function holdKeep() {
            if (feedJob || document.hidden) { holdEl = null; return; }
            if (!holdEl || !holdEl.isConnected) { holdPick(); return; }
            const top = holdEl.getBoundingClientRect().top + scrollY, d = top - holdTop;
            holdTop = top;
            if (Math.abs(d) > 0.5 && Math.abs(d) < 3000) scrollBy({ top: d, behavior: 'instant' });
        }
        const loopW = { hits: [], y0: 0, snaps: null, quiet: 0 };
        let loopUid = 0;
        function loopLabel(e) {
            const cls = String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).split(/\s+/).filter(Boolean).slice(0, 3).join('.');
            let mod = '';
            for (let n = e; n && n !== document.body; n = n.parentElement) { if (/(^|\s)vp-/.test(String(n.className && n.className.baseVal !== undefined ? n.className.baseVal : n.className))) { mod = n === e ? '' : ' (внутри ' + String(n.className).split(/\s+/).find(c => c.startsWith('vp-')) + ')'; break; } }
            return e.tagName.toLowerCase() + (cls ? '.' + cls : '') + mod + ' «' + (e.children.length ? '' : (e.textContent || '').trim().slice(0, 16)) + '»';
        }
        function loopSnap() {
            const snap = new Map();
            for (const s of document.querySelectorAll('.vp-post-slot')) {
                if (s.closest('article')) continue;
                for (const e of [s, ...s.querySelectorAll('*')]) {
                    const h = e.getBoundingClientRect().height;
                    if (h < 1 && e !== s) continue;
                    if (!e._vpLw) e._vpLw = ++loopUid;
                    snap.set(e._vpLw, [h, e]);
                }
            }
            return snap;
        }
        function loopReport() {
            const sn = loopW.snaps, ids = new Set();
            sn.forEach(m => m.forEach((v, k) => ids.add(k)));
            const rows = [];
            ids.forEach(k => {
                const series = sn.map(m => m.has(k) ? m.get(k)[0] : null), el = (sn.find(m => m.has(k)) || new Map()).get(k)[1];
                const vals = series.filter(v => v !== null), dist = new Set(vals.map(v => Math.round(v * 10))).size;
                if (dist > 1 || series.some(v => v === null)) rows.push({ k, el, series, dist, miss: series.filter(v => v === null).length });
            });
            rows.sort((a, b) => (b.miss + b.dist) - (a.miss + a.dist));
            const lines = rows.slice(0, 14).map(r => loopLabel(r.el) + ': ' + r.series.map(v => v === null ? '–' : v.toFixed(1)).join(' '));
            const text = 'кадров ' + sn.length + ', меняются: ' + rows.length + '\n' + lines.join('\n');
            try { console.warn('[ITD VP] посты в ленте дёргаются без остановки (петля пересчёта высот)\n' + text); } catch (e) { }
            try { logErr('петля высот', text.split('\n')[1] || text); } catch (e) { }
            window.__vpLoop = text;
        }
        function loopNote() {
            const now = performance.now(), h = loopW.hits;
            if (loopW.snaps) {
                loopW.snaps.push(loopSnap());
                if (loopW.snaps.length >= 8) { try { loopReport(); } catch (e) { } loopW.snaps = null; loopW.quiet = now + 60000; h.length = 0; }
                return;
            }
            if (now < loopW.quiet) return;
            if (!h.length) loopW.y0 = scrollY;
            h.push(now);
            while (h.length && now - h[0] > 3000) { h.shift(); if (h.length) loopW.y0 = scrollY; }
            if (h.length > 40 && Math.abs(scrollY - loopW.y0) < 2 && !document.hidden) loopW.snaps = [loopSnap()];
        }
        new MutationObserver(muts => {
            for (const m of muts) if (m.target.classList && m.target.classList.contains('vp-post-slot')) { loopNote(); return holdKeep(); }
        }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['style'] });
        addEventListener('scroll', () => {
            if (holdQueued) return;
            holdQueued = true;
            requestAnimationFrame(() => { holdQueued = false; holdKeep(); if (!feedJob) holdPick(); });
        }, { passive: true });
        addEventListener('resize', () => { holdEl = null; });
