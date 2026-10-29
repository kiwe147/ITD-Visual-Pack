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
.vp-pv-actions{display:flex;gap:8px;margin-top:4px;flex-wrap:wrap;justify-content:center;}
.vp-pv-btn{border:1px solid var(--border-color,rgba(255,255,255,.15));border-radius:10px;padding:8px 14px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;background:var(--glass-bg,rgba(128,128,128,.2));color:var(--text-primary,#fff);transition:background .15s;}
.vp-pv-btn:hover{background:rgba(128,128,128,.32);}
.vp-pv-share{background:var(--vp-accent,#ff7b3a);border-color:transparent;}
.vp-pv-share:hover{filter:brightness(1.1);}
.vp-pv-toast{position:fixed;left:50%;bottom:32px;transform:translateX(-50%) translateY(20px);z-index:2147483647;display:flex;flex-direction:column;gap:3px;padding:12px 18px;border-radius:14px;background:var(--block-bg,rgba(20,20,30,.94));border:1px solid var(--border-color,rgba(255,255,255,.14));color:var(--text-primary,#fff);box-shadow:0 8px 28px rgba(0,0,0,.5);font:inherit;opacity:0;transition:opacity .25s ease,transform .25s ease;pointer-events:none;max-width:min(420px,calc(100vw - 40px));}
.vp-pv-toast.vp-pv-toast-on{opacity:1;transform:translateX(-50%) translateY(0);}
.vp-pv-toast b{font-size:14px;font-weight:600;}
.vp-pv-toast span{font-size:12.5px;color:var(--text-secondary,rgba(255,255,255,.55));}
`;

            let overlay = null;

            function showToast(title, sub) {
                const t = document.createElement('div');
                t.className = 'vp-pv-toast';
                t.innerHTML = '<b>' + title + '</b>' + (sub ? '<span>' + sub + '</span>' : '');
                document.body.appendChild(t);
                requestAnimationFrame(() => t.classList.add('vp-pv-toast-on'));
                setTimeout(() => {
                    t.classList.remove('vp-pv-toast-on');
                    setTimeout(() => { if (t.parentNode) t.remove(); }, 300);
                }, 2400);
            }

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
                const thanks = (svgSrc.querySelector('title') || {}).textContent || '';
                if (/спасибо от/i.test(thanks)) {
                    const tn = document.createElement('div');
                    tn.className = 'vp-pv-hint';
                    tn.textContent = 'Фонарь светит: ' + thanks.trim();
                    card.appendChild(tn);
                }
                const actions = document.createElement('div');
                actions.className = 'vp-pv-actions';
                const share = document.createElement('button');
                share.type = 'button'; share.className = 'vp-pv-btn vp-pv-share'; share.textContent = 'Поделиться';
                share.addEventListener('click', async e => {
                    e.preventDefault(); e.stopPropagation();
                    const url = location.href;
                    if (navigator.share) { try { await navigator.share({ title: name || 'Тыква', url: url }); } catch (er) { } }
                    else { try { await navigator.clipboard.writeText(url); } catch (er) { } }
                }, true);
                const copy = document.createElement('button');
                copy.type = 'button'; copy.className = 'vp-pv-btn'; copy.textContent = 'Скопировать';
                copy.addEventListener('click', async e => {
                    e.preventDefault(); e.stopPropagation();
                    try {
                        // 1. Открываем нативную модалку сайта (одноразовый «пропуск» для capture-перехватчика)
                        window.__vpPvPass = true;
                        const btn = document.querySelector('[data-halloween-pumpkin]');
                        if (btn) btn.click();
                        window.__vpPvPass = false;

                        // 2. Ждём, пока нативная модалка появится, ищем «Скопировать»
                        const findNative = () => {
                            const dialogs = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')];
                            for (const d of dialogs) {
                                const lab = (d.getAttribute('aria-label') || '');
                                if (!/^Тыква:/i.test(lab)) continue;
                                const btns = [...d.querySelectorAll('button')];
                                const copyB = btns.find(b => /^Скопировать$/i.test((b.textContent || '').trim()));
                                const closeB = btns.find(b => /^Закрыть$/i.test((b.textContent || '').trim()));
                                return { d, copyB, closeB };
                            }
                            return null;
                        };
                        let nat = null;
                        for (let n = 0; n < 40 && !nat; n++) {
                            await new Promise(r => setTimeout(r, 50));
                            nat = findNative();
                        }
                        if (!nat || !nat.copyB) {
                            showToast('Не удалось найти кнопку', 'Попробуй ещё раз');
                            if (nat && nat.closeB) nat.closeB.click();
                            return;
                        }

                        // 3. Жмём нативную «Скопировать» — сайт сам делает композит и пишет в буфер
                        nat.copyB.click();

                        // 4. Ждём немножко, чтобы сайт успел сделать свою работу
                        await new Promise(r => setTimeout(r, 400));

                        // 5. Закрываем нативную модалку (не мешая сайту)
                        if (nat.closeB) nat.closeB.click();

                        // 6. Наш тост
                        showToast('Картинка скопирована', 'Вставь её в пост или в чат');
                        copy.textContent = 'Готово';
                        setTimeout(() => copy.textContent = 'Скопировать', 1200);
                    } catch (er) {
                        logErr('охота: копия тыквы', er);
                        showToast('Ошибка', 'Не удалось скопировать');
                    }
                }, true);
                const cl = document.createElement('button');
                cl.type = 'button'; cl.className = 'vp-pv-btn'; cl.textContent = 'Закрыть';
                cl.addEventListener('click', e => { e.preventDefault(); close(); }, true);
                actions.append(share, copy, cl);
                card.appendChild(actions);
                const hint = document.createElement('div');
                hint.className = 'vp-pv-hint';
                hint.textContent = 'Или нажми в любом месте или Esc, чтобы закрыть';
                card.appendChild(hint);

                ov.appendChild(card);
                document.body.appendChild(ov);
                overlay = ov;
                requestAnimationFrame(() => ov.classList.add('vp-pv-on'));
                document.addEventListener('keydown', onKey, true);
            }

            function isSmall(btn) {
                const r = btn.getBoundingClientRect();
                return r.width > 0 && r.width < 40;
            }
            document.addEventListener('click', e => {
                const btn = e.target && e.target.closest && e.target.closest('[data-halloween-pumpkin]');
                if (!btn || !isSmall(btn)) return;
                if (window.__vpPvPass) return;
                e.preventDefault();
                e.stopImmediatePropagation();
                open(btn);
            }, true);

            document.addEventListener('keydown', e => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const btn = e.target && e.target.closest && e.target.closest('[data-halloween-pumpkin]');
                if (!btn || !isSmall(btn)) return;
                e.preventDefault();
                e.stopImmediatePropagation();
                open(btn);
            }, true);
        })();
