        (function pumpkinStencil() {
            const CSS = `
.vp-ps-block{margin:12px 0 0;padding:10px 12px;border-radius:12px;background:var(--block-bg,rgba(30,26,40,.9));border:1px solid var(--border-color,rgba(255,255,255,.14));color:var(--text-primary,#fff);font:13px/1.4 inherit;}
.vp-ps-title{display:flex;align-items:center;gap:8px;font-weight:600;margin-bottom:8px;}
.vp-ps-title svg{width:16px;height:16px;flex:0 0 auto;opacity:.8;}
.vp-ps-btns{display:flex;gap:6px;flex-wrap:wrap;}
.vp-ps-btn{border:0;border-radius:8px;padding:7px 12px;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;background:var(--glass-bg,rgba(128,128,128,.2));color:var(--text-primary,#fff);transition:background .15s;}
.vp-ps-btn:hover{background:rgba(128,128,128,.35);}
.vp-ps-btn.vp-ps-on{background:var(--vp-accent,#8a5bff);color:#fff;}
.vp-ps-rows{margin-top:8px;display:none;}
.vp-ps-rows.vp-ps-show{display:block;}
.vp-ps-row{display:flex;align-items:center;gap:8px;margin-top:6px;}
.vp-ps-row label{flex:0 0 auto;min-width:86px;font-size:12px;color:var(--text-secondary,rgba(255,255,255,.6));}
.vp-ps-row input[type=range]{flex:1 1 auto;min-width:0;}
.vp-ps-row b{flex:0 0 auto;min-width:34px;text-align:right;font-variant-numeric:tabular-nums;font-size:12px;}
.vp-ps-hint{margin-top:6px;font-size:11.5px;line-height:1.3;color:var(--text-secondary,rgba(255,255,255,.55));}
.vp-ps-img{position:absolute;pointer-events:none;user-select:none;z-index:5;display:none;}
`;

            const ICON_IMG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';

            let fr = null, doc = null, img = null, cfg = { x: 0, y: 0, w: 400, o: 50 };
            let block = null;

            function store(k, v) { try { GM_setValue('vpStencil_' + k, v); } catch (e) { } }
            function load(k, d) { try { const v = GM_getValue('vpStencil_' + k, d); return v === undefined ? d : v; } catch (e) { return d; } }

            function applyImg() {
                if (!img) return;
                img.style.left = cfg.x + 'px';
                img.style.top = cfg.y + 'px';
                img.style.width = cfg.w + 'px';
                img.style.opacity = cfg.o / 100;
            }

            function saveCfg() {
                ['x', 'y', 'w', 'o'].forEach(k => store(k, cfg[k]));
            }

            function makeRow(label, key, min, max, step, unit) {
                const row = doc.createElement('div');
                row.className = 'vp-ps-row';
                row.innerHTML = '<label>' + label + '</label><input type="range" min="' + min + '" max="' + max + '" step="' + step + '"><b></b>';
                const inp = row.querySelector('input'), out = row.querySelector('b');
                inp.value = cfg[key];
                out.textContent = cfg[key] + (unit || '');
                inp.addEventListener('input', () => {
                    cfg[key] = +inp.value;
                    out.textContent = inp.value + (unit || '');
                    applyImg(); saveCfg();
                });
                return row;
            }

            function buildBlock() {
                block = doc.createElement('div');
                block.className = 'vp-ps-block';
                block.innerHTML = '<div class="vp-ps-title">' + ICON_IMG + '<span>Подложка для обводки</span></div>'
                    + '<div class="vp-ps-btns">'
                    + '<button type="button" class="vp-ps-btn vp-ps-pick">Загрузить картинку</button>'
                    + '<button type="button" class="vp-ps-btn vp-ps-show">Настроить</button>'
                    + '<button type="button" class="vp-ps-btn vp-ps-clear">Убрать</button>'
                    + '</div>'
                    + '<div class="vp-ps-rows"></div>'
                    + '<div class="vp-ps-hint">Наложи картинку на тыкву и обводи по ней. Клики проходят сквозь подложку.</div>';
                const rows = block.querySelector('.vp-ps-rows');
                rows.appendChild(makeRow('X', 'x', -500, 2000, 1, 'px'));
                rows.appendChild(makeRow('Y', 'y', -500, 1500, 1, 'px'));
                rows.appendChild(makeRow('Размер', 'w', 40, 2000, 5, 'px'));
                rows.appendChild(makeRow('Прозрачность', 'o', 0, 100, 5, '%'));

                block.querySelector('.vp-ps-pick').addEventListener('click', pickFile, true);
                block.querySelector('.vp-ps-show').addEventListener('click', () => {
                    rows.classList.toggle('vp-ps-show');
                    block.querySelector('.vp-ps-show').classList.toggle('vp-ps-on', rows.classList.contains('vp-ps-show'));
                }, true);
                block.querySelector('.vp-ps-clear').addEventListener('click', clearImg, true);
                return block;
            }

            function pickFile() {
                const inp = doc.createElement('input');
                inp.type = 'file';
                inp.accept = 'image/*';
                inp.onchange = () => {
                    const f = inp.files[0];
                    if (!f) return;
                    setImage(URL.createObjectURL(f));
                };
                inp.click();
            }

            function setImage(src) {
                if (!doc || !doc.body) return;
                if (img && img.parentNode) { try { URL.revokeObjectURL(img.src); } catch (e) { } img.remove(); }
                img = doc.createElement('img');
                img.className = 'vp-ps-img';
                img.src = src;
                img.draggable = false;
                img.style.display = 'block';
                doc.body.appendChild(img);
                applyImg();
            }

            function clearImg() {
                if (img) { try { URL.revokeObjectURL(img.src); } catch (e) { } img.remove(); img = null; }
            }

            function findSaveButton(d) {
                const btns = d.querySelectorAll('button');
                for (const b of btns) {
                    const t = (b.textContent || '').trim();
                    if (/^\s*сохранить\s+тыкву/i.test(t)) return b;
                }
                return null;
            }

            function modalOpen() {
                // если поверх открыта любая модалка — не мешаем ей
                const d = document;
                const list = d.querySelectorAll('[role="dialog"], [aria-modal="true"]');
                for (const m of list) {
                    const cs = getComputedStyle(m);
                    if (cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity || '1') > 0.05) {
                        const r = m.getBoundingClientRect();
                        if (r.width > 60 && r.height > 60) return m;
                    }
                }
                return null;
            }

            function install() {
                if (!/\/event\//.test(location.pathname)) return;
                if (block && modalOpen()) { block.style.display = 'none'; return; }
                if (block) block.style.display = '';
                for (const f of document.querySelectorAll('iframe')) {
                    let d = null;
                    try { d = f.contentDocument; } catch (e) { continue; }
                    if (!d || !d.body) continue;
                    const save = findSaveButton(d);
                    if (!save) continue;
                    fr = f; doc = d;
                    if (!d.getElementById('vp-ps-css')) {
                        const st = d.createElement('style');
                        st.id = 'vp-ps-css';
                        st.textContent = CSS;
                        d.head.appendChild(st);
                    }
                    const old = d.querySelector('.vp-ps-block');
                    if (old) {
                        // уже стоит — обновляем позицию, если перерисовалось
                        const anchor2 = save.parentNode;
                        if (old.previousElementSibling !== anchor2) anchor2.parentNode.insertBefore(old, anchor2.nextSibling);
                        return;
                    }
                    cfg.x = +load('x', 100); cfg.y = +load('y', 100);
                    cfg.w = +load('w', 400); cfg.o = +load('o', 50);
                    const bl = buildBlock();
                    // вставляем ПОСЛЕ контейнера кнопок, не внутрь — иначе ломаем flex-раскладку сайта
                    const anchor = save.parentNode;
                    anchor.parentNode.insertBefore(bl, anchor.nextSibling);
                    return;
                }
            }

            setInterval(install, 1200);
            onDom(install);
        })();
