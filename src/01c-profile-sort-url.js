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
        q.set('sort', o.s);
        return m[1] + '?' + q.toString();
    }
