        (function pumpkinViewer() {
            const CSS = `
.vp-pv-overlay{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;background:rgba(10,8,16,.75);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .18s ease;pointer-events:auto;}
.vp-pv-overlay.vp-pv-on{opacity:1;}
.vp-pv-card{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px;padding:24px 28px 22px;border-radius:24px;background:var(--block-bg,#1a1626);border:1px solid var(--border-color,rgba(255,255,255,.14));box-shadow:0 20px 60px rgba(0,0,0,.55);transform:scale(.92);transition:transform .18s ease;}
.vp-pv-overlay.vp-pv-on .vp-pv-card{transform:scale(1);}
.vp-pv-close{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:var(--text-primary,#fff);font-size:20px;line-height:1;cursor:pointer;transition:background .15s;}
.vp-pv-close:hover{background:rgba(255,255,255,.18);}
.vp-pv-pic{width:min(70vw,min(70vh,420px));aspect-ratio:1/1;}
.vp-pv-pic svg{width:100%;height:100%;display:block;overflow:visible;filter:drop-shadow(0 8px 28px rgba(255,140,40,.35));}
.vp-pv-name{font:600 16px/1.2 inherit;color:var(--text-primary,#fff);text-align:center;max-width:420px;}
.vp-pv-hint{font:12px/1.3 inherit;color:var(--text-secondary,rgba(255,255,255,.5));text-align:center;}
`;

            let overlay = null;

            function close() {
                if (!overlay) return;
                overlay.classList.remove('vp-pv-on');
                const o = overlay;
                overlay = null;
                setTimeout(() => { if (o.parentNode) o.remove(); }, 200);
                document.removeEventListener('keydown', onKey, true);
            }
            function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }

            function open(pumpkinBtn) {
                if (overlay) return;
                const svgSrc = pumpkinBtn.querySelector('svg');
                if (!svgSrc) return;
                const name = (pumpkinBtn.getAttribute('aria-label') || '').replace(/^Тыква:\s*/i, '') || '';
                if (!document.getElementById('vp-pv-css')) {
                    const st = document.createElement('style');
                    st.id = 'vp-pv-css';
                    st.textContent = CSS;
                    document.head.appendChild(st);
                }
                const ov = document.createElement('div');
                ov.className = 'vp-pv-overlay';
                ov.addEventListener('click', e => { if (e.target === ov) close(); }, true);

                const card = document.createElement('div');
                card.className = 'vp-pv-card';

                const xb = document.createElement('button');
                xb.type = 'button';
                xb.className = 'vp-pv-close';
                xb.setAttribute('aria-label', 'Закрыть');
                xb.textContent = '\u00d7';
                xb.addEventListener('click', e => { e.preventDefault(); close(); }, true);
                card.appendChild(xb);

                const pic = document.createElement('div');
                pic.className = 'vp-pv-pic';
                pic.appendChild(svgSrc.cloneNode(true));
                card.appendChild(pic);

                if (name) {
                    const nm = document.createElement('div');
                    nm.className = 'vp-pv-name';
                    nm.textContent = name;
                    card.appendChild(nm);
                }
                const hint = document.createElement('div');
                hint.className = 'vp-pv-hint';
                hint.textContent = 'Нажми в любом месте или Esc, чтобы закрыть';
                card.appendChild(hint);

                ov.appendChild(card);
                document.body.appendChild(ov);
                overlay = ov;
                requestAnimationFrame(() => ov.classList.add('vp-pv-on'));
                document.addEventListener('keydown', onKey, true);
            }

            document.addEventListener('click', e => {
                const btn = e.target && e.target.closest && e.target.closest('[data-halloween-pumpkin]');
                if (!btn) return;
                e.preventDefault();
                e.stopImmediatePropagation();
                open(btn);
            }, true);

            document.addEventListener('keydown', e => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const btn = e.target && e.target.closest && e.target.closest('[data-halloween-pumpkin]');
                if (!btn) return;
                e.preventDefault();
                e.stopImmediatePropagation();
                open(btn);
            }, true);
        })();
