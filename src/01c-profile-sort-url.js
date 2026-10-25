    const PROF_SORT_KEY = 'vp_prof_sort';
    function profSortMode() {
        try {
            const o = JSON.parse(sessionStorage.getItem(PROF_SORT_KEY) || 'null');
            return o && o.u && /^(old|popular)$/.test(o.s) ? o : null;
        } catch (e) { return null; }
    }
    function profSortUrl(url) {
        const o = profSortMode();
        if (!o || !url) return null;
        const m = String(url).match(/^((?:https?:\/\/[^/]+)?\/api\/posts\/user\/([^/?#]+))\?(.*)$/);
        if (!m || decodeURIComponent(m[2]).toLowerCase() !== o.u.toLowerCase()) return null;
        const q = new URLSearchParams(m[3]);
        if (q.get('sort') !== 'new') return null;
        q.set('sort', o.v || o.s);
        return m[1] + '?' + q.toString();
    }
    const softLoad = (() => {
        try {
            const v = sessionStorage.getItem('vp-soft');
            sessionStorage.removeItem('vp-soft');
            if (!v || Date.now() - +v > 15000) return false;
            const st = document.createElement('style');
            st.textContent = 'html.vp-soft *, html.vp-soft *::before, html.vp-soft *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition: none !important; }';
            document.documentElement.appendChild(st);
            document.documentElement.classList.add('vp-soft');
            setTimeout(() => { document.documentElement.classList.remove('vp-soft'); st.remove(); }, 3500);
            return true;
        } catch (e) { return false; }
    })();
