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
        new MutationObserver(muts => {
            for (const m of muts) if (m.target.classList && m.target.classList.contains('vp-post-slot')) return holdKeep();
        }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['style'] });
        addEventListener('scroll', () => {
            if (holdQueued) return;
            holdQueued = true;
            requestAnimationFrame(() => { holdQueued = false; holdKeep(); if (!feedJob) holdPick(); });
        }, { passive: true });
        addEventListener('resize', () => { holdEl = null; });
