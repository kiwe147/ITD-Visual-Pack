    const PROF_SORT_KEY = 'vp_prof_sort';
    function profSortMode() {
        try {
            const o = JSON.parse(sessionStorage.getItem(PROF_SORT_KEY) || 'null');
            return o && o.u && /^(old|popular)$/.test(o.s) ? o : null;
        } catch (e) { return null; }
    }
    let profOldPosts = null, profSortPause = false;
    function profSortUrl(url) {
        const o = profSortMode();
        if (!o || !url || profSortPause || o.v === 'client') return null;
        const m = String(url).match(/^((?:https?:\/\/[^/]+)?\/api\/posts\/user\/([^/?#]+))\?(.*)$/);
        if (!m || decodeURIComponent(m[2]).toLowerCase() !== o.u.toLowerCase()) return null;
        const q = new URLSearchParams(m[3]);
        if (q.get('sort') !== 'new') return null;
        q.set('sort', o.v || o.s);
        q.delete('pinnedPostId');
        return m[1] + '?' + q.toString();
    }
    function profOldAnswer(url) {
        const o = profSortMode();
        if (!o || o.v !== 'client' || !profOldPosts || profSortPause || !url || profOldPosts.u.toLowerCase() !== o.u.toLowerCase()) return null;
        const m = String(url).match(/^(?:https?:\/\/[^/]+)?\/api\/posts\/user\/([^/?#]+)\?(.*)$/);
        if (!m || decodeURIComponent(m[1]).toLowerCase() !== o.u.toLowerCase()) return null;
        const q = new URLSearchParams(m[2]), cur = q.get('cursor');
        if (q.get('sort') !== 'new' || (cur && !/^vpold:\d+$/.test(cur))) return null;
        const lim = Math.max(1, +q.get('limit') || 20), off = cur ? +cur.slice(6) : 0, all = profOldPosts.posts;
        const next = off + lim < all.length ? 'vpold:' + (off + lim) : null;
        return Promise.resolve(new Response(JSON.stringify({ data: { posts: all.slice(off, off + lim), pagination: { limit: lim, nextCursor: next, hasMore: !!next } } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    const softLoad = (() => {
        try {
            const v = sessionStorage.getItem('vp-soft');
            sessionStorage.removeItem('vp-soft');
            if (!v || Date.now() - +v > 15000) { sessionStorage.removeItem(PROF_SORT_KEY); return false; }
            const st = document.createElement('style');
            st.textContent = 'html.vp-soft *, html.vp-soft *::before, html.vp-soft *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition: none !important; }';
            document.documentElement.appendChild(st);
            document.documentElement.classList.add('vp-soft');
            setTimeout(() => { document.documentElement.classList.remove('vp-soft'); st.remove(); }, 3500);
            return true;
        } catch (e) { return false; }
    })();
