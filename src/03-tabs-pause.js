    const TAB_ID = Math.random().toString(36).slice(2);
    const apiPaused = () => Date.now() < (+GM_getValue('vp_api_pause', 0) || 0);
    function apiPause(res) {
        if (!res || res.status !== 429) return;
        const s = Math.max(60, +(res.headers && res.headers.get('Retry-After')) || 0);
        GM_setValue('vp_api_pause', Math.max(+GM_getValue('vp_api_pause', 0) || 0, Date.now() + s * 1000));
    }
    function leadTab() {
        const l = GM_getValue('vp_lead_tab', null), now = Date.now();
        if (l && l.id !== TAB_ID && now - l.at < 20000 && (document.hidden || !l.hidden)) return false;
        GM_setValue('vp_lead_tab', { id: TAB_ID, at: now, hidden: document.hidden });
        return true;
    }
    setInterval(() => { const l = GM_getValue('vp_lead_tab', null); if (l && l.id === TAB_ID) GM_setValue('vp_lead_tab', { id: TAB_ID, at: Date.now(), hidden: document.hidden }); }, 5000);
    const soundVolume = () => Math.max(0, Math.min(100, +GM_getValue('soundVolume', 100))) / 100;
