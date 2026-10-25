    function fpsMeter(box, label = '') {
        let n = 0, t0 = performance.now(), last = t0, worst = 0;
        (function tick(t) {
            if (!box.isConnected) return;
            n++; worst = Math.max(worst, t - last); last = t;
            if (t - t0 >= 1000) {
                const fps = Math.round(n * 1000 / (t - t0));
                box.textContent = `${label}${fps} FPS · рывок ${Math.round(worst)} мс`;
                box.dataset.bad = fps < 45 || worst > 50 ? '1' : '';
                box.style.color = box.dataset.bad ? '#ff6b6b' : '#6f6';
                n = 0; t0 = t; worst = 0;
            }
            requestAnimationFrame(tick);
        })(t0);
    }

    try {
        if (sessionStorage.getItem('vp-off') === '1') {
            const back = () => {
                const b = document.createElement('button');
                b.textContent = 'Включить ИТД X';
                b.style.cssText = 'position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:2147483000;padding:10px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(20,20,24,.9);color:#fff;font:600 14px system-ui,sans-serif;cursor:pointer';
                b.onclick = () => { sessionStorage.removeItem('vp-off'); location.reload(); };
                document.body.appendChild(b);
                const f = document.createElement('div');
                f.style.cssText = 'position:fixed;left:8px;top:8px;z-index:2147483000;padding:4px 8px;border-radius:8px;pointer-events:none;background:rgba(0,0,0,.75);color:#6f6;font:600 12px ui-monospace,monospace';
                f.textContent = 'без мода';
                document.body.appendChild(f);
                fpsMeter(f, 'без мода · ');
            };
            if (document.body) back(); else addEventListener('DOMContentLoaded', back);
            return;
        }
    } catch (e) { }
    function tabletViewport() {
        const meta = document.querySelector('meta[name="viewport"]');
        if (!meta) return;
        if (!meta.dataset.vpOrig) meta.dataset.vpOrig = meta.getAttribute('content') || 'width=device-width, initial-scale=1.0';
        const landscape = matchMedia('(orientation: landscape)').matches;
        const w = landscape ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
        const on = GM_getValue('tabletDesktop', true) && w >= 1024 && w <= PHONE_MAX;
        const want = on ? 'width=1180' : meta.dataset.vpOrig;
        if (meta.getAttribute('content') !== want) meta.setAttribute('content', want);
    }
    if (document.querySelector('meta[name="viewport"]')) tabletViewport();
    else document.addEventListener('DOMContentLoaded', tabletViewport);
    addEventListener('orientationchange', () => setTimeout(tabletViewport, 50));
    matchMedia('(orientation: landscape)').addEventListener('change', tabletViewport);

    const vpErrors = [];
    const logErr = (where, e) => { vpErrors.push(new Date().toTimeString().slice(0, 8) + ' ' + where + ': ' + (e && (e.message || e))); if (vpErrors.length > 30) vpErrors.shift(); };

