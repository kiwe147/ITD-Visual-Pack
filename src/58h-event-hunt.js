        (function eventHunt() {
            const HUNT_KEY = 'vpHuntMode';
            const MODE_LIST = [['ghosts', 'Призраки'], ['wolves', 'Оборотни'], ['both', 'Оба']];
            const huntMode = () => { const v = GM_getValue(HUNT_KEY, 'both'); return MODE_LIST.some(m => m[0] === v) ? v : 'both'; };
            const huntOn = () => GM_getValue('huntOn', true);

            const HUNT_CSS = `
.vp-hunt-dev{position:absolute;left:8%;bottom:9%;width:15%;max-width:230px;min-width:110px;aspect-ratio:1/1;cursor:pointer;z-index:6;pointer-events:auto;
  display:flex;align-items:flex-end;justify-content:center;transition:transform .2s ease,filter .25s ease;}
.vp-hunt-dev:hover{transform:translateY(-4px) scale(1.03);filter:brightness(1.15) drop-shadow(0 0 14px rgba(160,120,255,.55));}
.vp-hunt-dev:active{transform:translateY(-1px) scale(.98);}
.vp-hunt-dev img{width:100%;height:auto;display:block;pointer-events:none;filter:drop-shadow(0 6px 18px rgba(0,0,0,.55));}
.vp-hunt-dev.vp-hunt-loading{opacity:.4;}
.vp-hunt-dev .vp-hunt-hint{position:absolute;left:50%;bottom:-6px;transform:translate(-50%,100%);padding:5px 11px;border-radius:11px;background:rgba(20,14,30,.86);color:#eee;font:600 12px/1.2 system-ui,sans-serif;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .2s;}
.vp-hunt-dev:hover .vp-hunt-hint{opacity:1;}

.vp-hunt{position:fixed;inset:0;z-index:99998;display:none;background:radial-gradient(120% 90% at 50% 0%,#1a1030 0%,#0b0714 70%);color:#f2eeff;font:400 14px/1.4 system-ui,sans-serif;overflow:hidden;}
.vp-hunt.vp-open{display:block;}
.vp-hunt-top{position:absolute;top:0;left:0;right:0;height:58px;display:flex;align-items:center;gap:10px;padding:0 16px;background:linear-gradient(180deg,rgba(15,9,26,.95),rgba(15,9,26,0));z-index:3;}
.vp-hunt-back{border:0;background:rgba(255,255,255,.08);color:#fff;font:inherit;font-weight:600;padding:9px 16px;border-radius:12px;cursor:pointer;transition:background .15s;}
.vp-hunt-back:hover{background:rgba(255,255,255,.16);}
.vp-hunt-title{flex:1 1 auto;font-weight:700;letter-spacing:.02em;font-size:16px;opacity:.9;}
.vp-hunt-modes{display:flex;gap:6px;}
.vp-hunt-modes button{border:0;background:rgba(255,255,255,.06);color:rgba(255,255,255,.6);font:inherit;font-size:13px;font-weight:600;padding:7px 12px;border-radius:10px;cursor:pointer;transition:all .15s;}
.vp-hunt-modes button.vp-on{background:rgba(150,105,255,.28);color:#fff;box-shadow:inset 0 0 0 1px rgba(150,105,255,.55);}
.vp-hunt-bar{position:absolute;top:58px;left:0;right:0;height:3px;background:rgba(255,255,255,.06);z-index:3;}
.vp-hunt-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#7cffb0,#5bd6ff,#8a5bff);transition:width .4s ease;box-shadow:0 0 12px rgba(140,150,255,.7);}
.vp-hunt-stats{position:absolute;top:66px;left:16px;right:16px;display:flex;gap:8px;z-index:5;pointer-events:none;}
.vp-hunt-stat{padding:7px 13px;border-radius:12px;background:rgba(15,9,26,.78);border:1px solid rgba(255,255,255,.09);font-size:12.5px;color:rgba(255,255,255,.6);white-space:nowrap;}
.vp-hunt-stat b{color:#fff;font-size:14px;margin-left:5px;font-variant-numeric:tabular-nums;}
.vp-hunt-stat.vp-gold b{color:#ffd46a;}
.vp-hunt-stage{position:absolute;inset:104px 0 0;overflow:hidden;}
.vp-hunt-tgt{position:absolute;width:78px;height:78px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:36px;
  background:rgba(20,14,40,.7);backdrop-filter:blur(6px);transition:transform .12s ease,filter .12s;will-change:transform;}
.vp-hunt-tgt:hover{transform:scale(1.08);filter:brightness(1.2);}
.vp-hunt-tgt.vp-poss{box-shadow:0 0 0 3px transparent,0 0 26px rgba(150,105,255,.55);border:3px solid transparent;
  background-image:linear-gradient(rgba(20,14,40,.85),rgba(20,14,40,.85)),linear-gradient(115deg,#ff5b5b,#ffb15b,#f8ff5b,#5bff8a,#5bd6ff,#8a5bff,#ff5bd0,#ff5b5b);
  background-origin:border-box;background-clip:padding-box,border-box;background-size:100% 100%,400% 400%;animation:vpHRainbow 4s linear infinite;}
.vp-hunt-tgt.vp-wolf{box-shadow:0 0 0 2px rgba(150,105,255,.65),0 0 22px rgba(150,105,255,.4);}
@keyframes vpHRainbow{0%{background-position:0 0,0% 50%;}100%{background-position:0 0,400% 50%;}}
.vp-hunt-tgt.vp-caught{animation:vpCaught .5s ease forwards;pointer-events:none;}
@keyframes vpCaught{to{transform:scale(1.9);opacity:0;}}
.vp-hunt-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.4);font-size:15px;}
.vp-hunt-status{position:absolute;left:16px;bottom:16px;padding:9px 14px;border-radius:12px;background:rgba(15,9,26,.85);border:1px solid rgba(255,255,255,.09);font-size:13px;color:rgba(255,255,255,.7);z-index:4;}
@media (prefers-reduced-motion:reduce){.vp-hunt-tgt,.vp-hunt-tgt.vp-caught{animation:none!important;transition:none!important;}}
`;

            const DEV_FILE = 'hunt-dev2.webp', DEV_CACHE = 'hunt-dev2@1';
            let devUrl = '';

            let huntFrame = null, huntDoc = null, huntOpen = false, huntWin = null;
            let huntBusy = false, huntDone = false, huntCursor = null, huntSeen = new Set(), huntSeq = 0;
            let huntFound = 0, huntScanned = 0;
            const huntTargets = new Map();
            const HUNT_MAX_TARGETS = 4, HUNT_MAX_PAGES = 40, HUNT_GAP = 1200;

            const HUNT_SAVE = 'vpHuntState';
            function huntStatsUpdate() {
                if (!huntDoc) return;
                const s = huntDoc.querySelector('.vp-hunt-scanned'), f = huntDoc.querySelector('.vp-hunt-found');
                if (s) s.textContent = String(huntScanned);
                if (f) f.textContent = String(huntFound);
            }
            function huntSave() {
                try {
                    const targets = [];
                    huntTargets.forEach((v, id) => { targets.push({ id: id, kind: v.kind, user: v.user, label: v.label, x: v.x, y: v.y }); });
                    sessionStorage.setItem(HUNT_SAVE, JSON.stringify({
                        at: Date.now(), found: huntFound, scanned: huntScanned,
                        cursor: huntCursor, seen: [...huntSeen], targets: targets
                    }));
                } catch (e) { }
            }
            function huntSaveClear() {
                try { sessionStorage.removeItem(HUNT_SAVE); } catch (e) { }
            }
            function huntLoadSave() {
                try {
                    const raw = sessionStorage.getItem(HUNT_SAVE);
                    if (!raw) return null;
                    const st = JSON.parse(raw);
                    if (!st || !st.at || Date.now() - st.at > 30 * 60 * 1000) return null;
                    return st;
                } catch (e) { return null; }
            }
            function huntStatus(text) {
                const s = huntDoc && huntDoc.querySelector('.vp-hunt-status');
                if (s && text != null) s.textContent = text;
            }
            function huntBar(pct) {
                const b = huntDoc && huntDoc.querySelector('.vp-hunt-bar i');
                if (b) b.style.width = Math.max(0, Math.min(100, pct)) + '%';
            }
            function huntSpawn(kind, postId, user, label, at) {
                if (!huntDoc || huntTargets.size >= HUNT_MAX_TARGETS) return;
                if (huntTargets.has(postId)) return;
                const stage = huntDoc.querySelector('.vp-hunt-stage');
                if (!stage) return;
                const W = stage.clientWidth || 800, H = stage.clientHeight || 600;
                const el = huntDoc.createElement('div');
                el.className = 'vp-hunt-tgt vp-' + kind;
                el.textContent = kind === 'wolf' ? '\u{1F43A}' : '\u{1F47B}';
                el.title = label + ' — нажми, чтобы открыть пост';
                const x = at ? at.x : 40 + Math.random() * Math.max(40, W - 160);
                const y = at ? at.y : 40 + Math.random() * Math.max(40, H - 160);
                el.style.left = x + 'px';
                el.style.top = y + 'px';
                const phase = Math.random() * Math.PI * 2, sx = 0.9 + Math.random() * 0.8, sy = 0.7 + Math.random() * 0.6;
                let raf = 0, t0 = performance.now();
                const move = now => {
                    if (!el.isConnected) return;
                    const t = (now - t0) / 1000;
                    const dx = Math.sin(t * sx + phase) * 46, dy = Math.cos(t * sy + phase * 1.3) * 34;
                    el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
                    raf = requestAnimationFrame(move);
                };
                raf = requestAnimationFrame(move);
                el.addEventListener('click', e => {
                    e.preventDefault(); e.stopPropagation();
                    el.classList.add('vp-caught');
                    cancelAnimationFrame(raf);
                    const id = postId, u = user;
                    // цель считается отработанной: убираем из карты и из DOM сразу
                    huntTargets.delete(postId);
                    huntFound = Math.max(0, huntFound - 1);
                    huntStatsUpdate();
                    setTimeout(() => { if (el.parentNode) el.remove(); }, 500);
                    setTimeout(() => {
                        huntSave();
                        try { const st = huntLoadSave() || {}; st.wasOpen = true; st.at = Date.now(); sessionStorage.setItem(HUNT_SAVE, JSON.stringify(st)); } catch (x) { }
                        huntBack(true);
                        try { parent.postMessage({ vpHunt: 'open', postId: id, user: u }, '*'); } catch (x) { }
                    }, 260);
                }, true);
                stage.appendChild(el);
                huntTargets.set(postId, { el, raf, kind, user, label, x, y });
                huntFound++;
                huntStatsUpdate();
                huntSave();
                huntStatus('Найдено: ' + huntFound + ' · проанализировано постов: ' + huntScanned);
            }
            function huntClear() {
                if (!huntDoc) return;
                huntDoc.querySelectorAll('.vp-hunt-tgt').forEach(t => t.remove());
                huntTargets.forEach(v => cancelAnimationFrame(v.raf));
                huntTargets.clear();
                huntFound = 0;
                huntStatsUpdate();
            }

            function huntParse(v) {
                if (!v) return null;
                const p = v.possession, w = v.werewolf;
                if (p) { if (p.resolved) return null; return { kind: 'poss', label: p.stage === 'taken' ? 'Пост захвачен' : 'Призрак' }; }
                if (w && w.night) return { kind: 'wolf', label: 'Оборотень (ночь)' };
                return null;
            }

            let huntLastNet = 0;
            async function huntNet(url) {
                const wait = huntLastNet + HUNT_GAP - Date.now();
                if (wait > 0) await new Promise(r => setTimeout(r, wait));
                huntLastNet = Date.now();
                return api(url);
            }
            function huntModeOk(kind) {
                const m = huntMode();
                if (m === 'both') return true;
                if (m === 'ghosts') return kind === 'poss';
                return kind === 'wolf';
            }
            async function huntLoop() {
                if (huntBusy || huntDone || !huntFrame || !huntOpen) return;
                huntBusy = true;
                const seq = huntSeq;
                try {
                    const lim = 50;
                    let url = '/api/posts?limit=' + lim + '&tab=popular' + (huntCursor ? '&cursor=' + encodeURIComponent(huntCursor) : '');
                    const res = await huntNet(url);
                    if (seq !== huntSeq) return;
                    if (!res || !res.ok) { huntDone = true; huntStatus('Поиск остановлен (ошибка сети)'); huntBusy = false; return; }
                    const j = await res.json(), d = j.data || j;
                    let posts = d.posts || [], next = (d.pagination && d.pagination.nextCursor) || d.nextCursor || d.cursor || null;
                    huntScanned += posts.length;
                    huntBar(Math.min(100, (huntFound / Math.max(6, HUNT_MAX_TARGETS)) * 100));
                    huntStatsUpdate();
                    huntStatus('Ищем… проанализировано ' + huntScanned + ' постов, найдено ' + huntFound);
                    if (posts.length) {
                        const ids = posts.map(p => p.id).filter(Boolean);
                        if (ids.length) {
                            const chunk = ids.slice(0, 40);
                            const url2 = '/api/v1/halloween/feed-state?posts=' + chunk.map(encodeURIComponent).join(',');
                            let r2 = null;
                            try { r2 = await huntNet(url2); } catch (e) { }
                            if (seq !== huntSeq) return;
                            if (r2 && r2.ok) {
                                let d2 = null;
                                try { d2 = await r2.json(); } catch (e) { }
                                const map = (d2 && ((d2.data && d2.data.posts) || d2.posts)) || {};
                                for (const p of posts) {
                                    const tag = huntParse(map[p.id]);
                                    if (!tag || !huntModeOk(tag.kind)) continue;
                                    if (huntSeen.has(p.id)) continue;
                                    huntSeen.add(p.id);
                                    const au = (p.author && (p.author.username || p.author.id)) || '';
                                    try { huntFrame.contentWindow.postMessage({ vpHunt: 'found', kind: tag.kind === 'wolf' ? 'wolf' : 'poss', postId: p.id, user: au, label: tag.label }, '*'); } catch (x) { }
                                    if (huntFound >= HUNT_MAX_TARGETS) break;
                                }
                            }
                        }
                    }
                    huntCursor = next;
                    huntSave();
                    if (!next || huntScanned >= HUNT_MAX_PAGES * lim) { huntDone = true; huntStatus(huntFound ? 'Проанализировано ' + huntScanned + ' постов, найдено ' + huntFound : 'Сейчас никого не нашли — попробуй позже'); }
                } catch (e) { logErr('охота', e); huntDone = true; }
                finally { huntBusy = false; }
            }

            function huntWindow() {
                if (huntWin && huntWin.isConnected) return huntWin;
                const w = huntDoc.createElement('div');
                w.className = 'vp-hunt';
                w.innerHTML = '<div class="vp-hunt-top">'
                    + '<button type="button" class="vp-hunt-back">\u2190 Назад</button>'
                    + '<div class="vp-hunt-title">Поиск призраков</div>'
                    + '<div class="vp-hunt-modes">' + MODE_LIST.map(m => '<button type="button" data-m="' + m[0] + '">' + m[1] + '</button>').join('') + '</div>'
                    + '</div>'
                    + '<div class="vp-hunt-bar"><i></i></div>'
                    + '<div class="vp-hunt-stats">'
                    + '<div class="vp-hunt-stat">Проанализировано<b class="vp-hunt-scanned">0</b></div>'
                    + '<div class="vp-hunt-stat vp-gold">Найдено<b class="vp-hunt-found">0</b></div>'
                    + '</div>'
                    + '<div class="vp-hunt-stage"><div class="vp-hunt-empty">Ищем…</div></div>'
                    + '<div class="vp-hunt-status">Готов</div>';
                w.querySelector('.vp-hunt-back').addEventListener('click', huntBack, true);
                w.querySelectorAll('.vp-hunt-modes button').forEach(b => {
                    b.classList.toggle('vp-on', b.dataset.m === huntMode());
                    b.addEventListener('click', e => {
                        e.preventDefault(); e.stopPropagation();
                        GM_setValue(HUNT_KEY, b.dataset.m);
                        w.querySelectorAll('.vp-hunt-modes button').forEach(x => x.classList.toggle('vp-on', x.dataset.m === b.dataset.m));
                        huntSaveClear();
                        huntRestart(false);
                    }, true);
                });
                huntDoc.body.appendChild(w);
                huntWin = w;
                return w;
            }

            function huntRestart(resume) {
                huntSeq++;
                const em0 = huntDoc && huntDoc.querySelector('.vp-hunt-empty');
                if (resume) {
                    const st = huntLoadSave();
                    if (st) {
                        huntCursor = st.cursor || null;
                        huntSeen = new Set(st.seen || []);
                        huntFound = 0; huntScanned = st.scanned || 0;
                        huntClear();
                        huntFound = 0;
                        for (const t of (st.targets || [])) huntSpawn(t.kind, t.id, t.user, t.label, { x: t.x, y: t.y });
                        if ((st.targets || []).length && em0) em0.style.display = 'none';
                        huntDone = false; huntBusy = false;
                        huntBar(Math.min(100, (huntFound / Math.max(6, HUNT_MAX_TARGETS)) * 100));
                        huntStatsUpdate();
                        huntStatus('Продолжаем: проанализировано ' + huntScanned + ', найдено ' + huntFound);
                        setTimeout(huntLoop, 800);
                        return;
                    }
                }
                huntCursor = null; huntSeen.clear(); huntFound = 0; huntScanned = 0;
                huntDone = false; huntBusy = false;
                huntClear();
                huntBar(0);
                huntStatsUpdate();
                huntStatus('Готов');
                if (em0) em0.style.display = '';
                setTimeout(huntLoop, 300);
            }

            let huntAutoChecked = false;
            function huntAutoOpen() {
                if (huntAutoChecked || !huntDoc) return;
                const st = huntLoadSave();
                if (!st || !st.targets || !st.targets.length) return;
                if (st.wasOpen === false) return;
                if (huntDoc.querySelector('.vp-hunt.vp-open')) { huntAutoChecked = true; return; }
                huntAutoChecked = true;
                huntOpenWin();
            }
            function huntOpenWin() {
                if (!huntDoc) return;
                huntOpen = true;
                try { const st = huntLoadSave() || {}; st.wasOpen = true; st.at = Date.now(); sessionStorage.setItem(HUNT_SAVE, JSON.stringify(st)); } catch (e) { }
                const w = huntWindow();
                w.classList.add('vp-open');
                const sc = huntDoc.querySelector('.room-stage');
                if (sc) sc.style.visibility = 'hidden';
                huntRestart(true);
            }

            function huntBack(silent) {
                huntOpen = false;
                if (!silent) { try { const st = huntLoadSave() || {}; st.wasOpen = false; st.at = Date.now(); sessionStorage.setItem(HUNT_SAVE, JSON.stringify(st)); } catch (e) { } }
                if (huntWin) huntWin.classList.remove('vp-open');
                if (huntDoc) {
                    const sc = huntDoc.querySelector('.room-stage');
                    if (sc) sc.style.visibility = '';
                }
            }

            let devLoading = false;
            function huntDevLoad() {
                if (devUrl || devLoading) return;
                devLoading = true;
                palBlobKey(DEV_FILE, DEV_CACHE).then(b => { if (b) devUrl = URL.createObjectURL(b); }).catch(e => logErr('охота: устройство', e)).finally(() => { devLoading = false; });
            }
            function palBlobKey(file, key) {
                return palStore(key).then(have => {
                    if (have) return have;
                    return palFetch('https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/claude/github-script-access-ihd9ne/assets/' + file).then(b => {
                        if (b) palStore(key, b).catch(() => { });
                        return b;
                    }).catch(() => palFetch('https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/main/assets/' + file).catch(() => null));
                });
            }

            function huntInstall(fr) {
                let d = null;
                try { d = fr.contentDocument; } catch (e) { return; }
                if (!d || !d.body) return;
                if (!huntOn()) return;
                const stage = d.querySelector('.room-stage');
                if (!stage) return;
                if (!d.getElementById('vp-hunt-css')) {
                    const st = d.createElement('style'); st.id = 'vp-hunt-css'; st.textContent = HUNT_CSS; d.head.appendChild(st);
                }
                if (!stage.querySelector(':scope > .vp-hunt-dev')) {
                    const dev = d.createElement('div');
                    dev.className = 'vp-hunt-dev' + (devUrl ? '' : ' vp-hunt-loading');
                    const img = d.createElement('img');
                    img.alt = '';
                    img.draggable = false;
                    if (devUrl) img.src = devUrl;
                    dev.appendChild(img);
                    const hint = d.createElement('div');
                    hint.className = 'vp-hunt-hint';
                    hint.textContent = 'Охота на нечисть';
                    dev.appendChild(hint);
                    dev.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); huntOpenWin(); }, true);
                    stage.appendChild(dev);
                    huntDevLoad();
                }
                const devImg = stage.querySelector(':scope > .vp-hunt-dev img');
                if (devUrl && devImg && devImg.getAttribute('src') !== devUrl) {
                    devImg.src = devUrl;
                    const dv = stage.querySelector(':scope > .vp-hunt-dev');
                    if (dv) dv.classList.remove('vp-hunt-loading');
                }
                huntFrame = fr; huntDoc = d;
                setTimeout(huntAutoOpen, 600);
                if (!d._vpHuntMsg) {
                    d._vpHuntMsg = true;
                    d.defaultView.addEventListener('message', ev => {
                        const m = ev.data;
                        if (!m || !m.vpHunt || !huntOpen) return;
                        if (m.vpHunt === 'found') {
                            const em = huntDoc.querySelector('.vp-hunt-empty');
                            if (em) em.style.display = 'none';
                            huntSpawn(m.kind, m.postId, m.user, m.label);
                        }
                    });
                }
                const open = huntDoc.querySelector('.vp-hunt.vp-open');
                if (open && !open.isConnected) huntWin = null;
            }

            function huntTick() {
                if (!huntOn() || !/^\/event\/[^/]/.test(location.pathname)) {
                    if (huntDoc) { try { const dev = huntDoc.querySelector('.vp-hunt-dev'); if (dev) dev.remove(); } catch (e) { } }
                    return;
                }
                for (const fr of document.querySelectorAll('iframe')) {
                    let d = null;
                    try { d = fr.contentDocument; } catch (e) { continue; }
                    if (d && d.querySelector && d.querySelector('.room-stage')) { huntInstall(fr); break; }
                }
            }
            setInterval(huntTick, 1000);
            onDom(huntTick);
            document.addEventListener('vp-loc', huntTick);

            window.addEventListener('message', ev => {
                const m = ev.data;
                if (!m || m.vpHunt !== 'open' || !m.postId) return;
                const go = m.user
                    ? '/@' + encodeURIComponent(m.user) + '/post/' + encodeURIComponent(m.postId)
                    : '/post/' + encodeURIComponent(m.postId);
                const a = document.createElement('a');
                a.href = go; a.click();
            });
        })();
