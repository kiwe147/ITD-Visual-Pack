        function navIsRow(nav) {
            const links = nav.querySelectorAll(':scope > .' + SELECTORS.navLink);
            return links.length > 1 && Math.abs(links[0].offsetTop - links[1].offsetTop) < 4;
        }
        let blob = null, blobAt = null;
        function moveNavBlob() {
            const nav = siteEl('nav');
            const active = nav && nav.querySelector(':scope > .' + SELECTORS.navLink + '.vp-active');
            if (!nav) return;
            if (!blob || !nav.contains(blob)) {
                const was = blob && blobAt && blob.style.opacity === '1' ? blobAt : null;
                blob = document.createElement('div');
                blob.className = 'vp-nav-blob';
                nav.classList.add('vp-nav-has-blob');
                nav.prepend(blob);
                blobAt = null;
                if (was && !calm) {
                    blob.style.transition = 'none';
                    if (navIsRow(nav)) rowPlace(was); else Object.assign(blob.style, blobBox(was), { borderRadius: blobRadius });
                    blob.style.opacity = '1';
                    blob.offsetWidth;
                    blob.style.transition = '';
                    blobAt = was;
                    if (flow && performance.now() - flow.t0 < BLOB_MS) blobFlow(flow.f, flow.t, flow.t0);
                }
            }
            if (!active) { blob.style.opacity = '0'; blobAt = null; return; }
            const row = navIsRow(nav);
            let to = { top: active.offsetTop, left: active.offsetLeft, width: active.offsetWidth, height: active.offsetHeight };
            const siteInd = row && [...nav.children].find(c => c.tagName === 'DIV' && c !== blob);
            if (siteInd && siteInd.offsetHeight) {
                const w = parseFloat(siteInd.style.width) || siteInd.offsetWidth;
                to = { top: siteInd.offsetTop, height: siteInd.offsetHeight, width: w, left: to.left + (to.width - w) / 2 };
            } else if (row) { const extra = Math.round(to.width * .18); to = { ...to, left: to.left - extra / 2, width: to.width + extra }; }
            if (blobAt && to.top === blobAt.top && to.left === blobAt.left && to.width === blobAt.width && to.height === blobAt.height) return;
            const rad = getComputedStyle(active).borderRadius;
            blob.style.borderRadius = blobRadius = !row ? rad
                : siteInd && parseFloat(getComputedStyle(siteInd).borderRadius) ? getComputedStyle(siteInd).borderRadius
                    : `${to.width / 2}px / ${to.height / 2}px`;
            const from = blobAt && !calm && blob.style.opacity === '1' ? blobAt : null;
            if (from && row) {
                blobAnim = null;
                rowPlace(to);
                blobFlow(from, to);
            } else if (from) {
                blobAnim = { from, to, t0: performance.now() };
            } else { blobAnim = null; if (row) rowPlace(to); else Object.assign(blob.style, blobBox(to)); }
            blob.style.opacity = '1';
            blobAt = to;
            if (!row) proxKick();
        }
        let blobAnim = null, flow = null, blobRadius = '';
        const BLOB_MS = 460;
        const blobBox = r => ({ top: r.top + 'px', left: r.left + 'px', width: r.width + 'px', height: r.height + 'px' });
        const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const lerp = (a, b, t) => a + (b - a) * t;
        function blobMid(f, t, row) {
            if (row) {
                const lo = Math.min(f.left, t.left), hi = Math.max(f.left + f.width, t.left + t.width);
                return { left: lo, top: t.top + t.height * .04, height: t.height * .92, width: hi - lo };
            }
            const lo = Math.min(f.top, t.top), hi = Math.max(f.top + f.height, t.top + t.height);
            return { top: lo, left: t.left + t.width * .04, width: t.width * .92, height: hi - lo };
        }
        function blobGeom(an, now) {
            const p = Math.min(1, (now - an.t0) / BLOB_MS), f = an.from, t = an.to, mid = blobMid(f, t, false);
            const [a, b, q] = p < .45 ? [f, mid, easeIO(p / .45)] : [mid, t, easeIO((p - .45) / .55)];
            return { g: { top: lerp(a.top, b.top, q), left: lerp(a.left, b.left, q), width: lerp(a.width, b.width, q), height: lerp(a.height, b.height, q) }, done: p >= 1 };
        }
        function blobParts() {
            if (!blob.firstElementChild) blob.innerHTML = '<i class="vp-bm"></i><i class="vp-bl"></i><i class="vp-br"></i>';
            const [m, l, r] = blob.children;
            return [l, m, r];
        }
        const BM_W = 100;
        function rowTransforms(r, sy = 1) {
            const R = r.height / 2, mid = Math.max(1, r.width - 2 * R + 3);
            return [`translate(${r.left}px, ${r.top}px) scale(1, ${sy})`,
            `translate(${r.left + R - 1.5}px, ${r.top}px) scale(${mid / BM_W}, ${sy})`,
            `translate(${r.left + r.width - R}px, ${r.top}px) scale(1, ${sy})`];
        }
        function rowPlace(r) {
            blob.classList.add('vp-blob-row');
            const tr = rowTransforms(r);
            blobParts().forEach((el, i) => {
                el.style.width = i === 1 ? BM_W + 'px' : r.height / 2 + 'px';
                el.style.height = r.height + 'px';
                el.style.transform = tr[i];
            });
        }
        function blobFlow(f, t, t0 = performance.now()) {
            flow = { f, t, t0 };
            const e = 'cubic-bezier(.65, 0, .35, 1)';
            const m = blobMid(f, t, true);
            const a = rowTransforms({ ...f, top: t.top, height: t.height }), b = rowTransforms({ ...m, top: t.top, height: t.height }, .92), c = rowTransforms(t);
            blobParts().forEach((el, i) => {
                const an = el.animate([{ transform: a[i], easing: e }, { transform: b[i], offset: .45, easing: e }, { transform: c[i] }], { duration: BLOB_MS });
                an.currentTime = Math.max(0, performance.now() - t0);
            });
        }
        onDom(moveNavBlob);
        const navLater = () => [60, 250, 700].forEach(ms => setTimeout(() => { markActiveNav(); moveNavBlob(); }, ms));
        addEventListener('popstate', navLater);
        document.addEventListener('vp-loc', navLater);
        addEventListener('resize', () => { blobAt = null; moveNavBlob(); });

        const PROX_MAX = 14, PROX_SIGMA = 46;
        let proxY = null, proxRaf = 0, blobK = 0;
        const proxNow = new WeakMap();
        function proxFrame() {
            proxRaf = 0;
            const nav = siteEl('nav');
            if (!nav) return;
            let moving = false, activeK = 0;
            const rows = [];
            nav.querySelectorAll(':scope > .' + SELECTORS.navLink).forEach(a => {
                const r = a.getBoundingClientRect();
                const d = proxY === null ? Infinity : proxY - (r.top + r.height / 2);
                const want = proxY === null ? 0 : Math.exp(-(d * d) / (2 * PROX_SIGMA * PROX_SIGMA));
                const was = proxNow.get(a) || 0;
                const k = Math.abs(want - was) < 0.004 ? want : was + (want - was) * 0.22;
                if (k !== want) moving = true;
                proxNow.set(a, k);
                const x = (k * PROX_MAX).toFixed(2);
                a.style.transform = k ? `translateX(${x}px)` : '';
                a.style.opacity = k && !a.classList.contains('vp-active') ? String((0.5 + 0.5 * k).toFixed(3)) : '';
                const icon = a.querySelector('.' + SELECTORS.navIcon);
                if (icon) icon.style.transform = k ? `scale(${(1 + 0.12 * k).toFixed(3)})` : '';
                if (a.classList.contains('vp-active')) activeK = k;
                rows.push([a.offsetTop + a.offsetHeight / 2, k]);
            });
            if (blob && blobAnim) {
                const { g, done } = blobGeom(blobAnim, performance.now());
                const y = g.top + g.height / 2;
                let k = rows.length ? rows[0][1] : 0;
                for (let i = 0; i < rows.length; i++) {
                    if (y <= rows[i][0]) { k = i ? lerp(rows[i - 1][1], rows[i][1], (y - rows[i - 1][0]) / (rows[i][0] - rows[i - 1][0])) : rows[0][1]; break; }
                    k = rows[i][1];
                }
                blobK = k;
                Object.assign(blob.style, { top: g.top + 'px', left: g.left + 'px', width: g.width + 'px', height: g.height + 'px' });
                blob.style.transform = blobK ? `translateX(${(blobK * PROX_MAX).toFixed(2)}px)` : '';
                if (done) blobAnim = null;
                moving = true;
            } else if (blob) {
                blobK = Math.abs(activeK - blobK) < 0.004 ? activeK : blobK + (activeK - blobK) * 0.22;
                if (blobK !== activeK) moving = true;
                blob.style.transform = blobK ? `translateX(${(blobK * PROX_MAX).toFixed(2)}px)` : '';
            }
            if (moving) proxRaf = requestAnimationFrame(proxFrame);
        }
        function proxKick() { if (!proxRaf) proxRaf = requestAnimationFrame(proxFrame); }
        if (!calm) {
            document.addEventListener('pointermove', e => {
                if (e.pointerType !== 'mouse') return;
                const nav = siteEl('nav');
                if (!nav || navIsRow(nav)) return;
                const r = nav.getBoundingClientRect();
                const inside = e.clientX >= r.left - 24 && e.clientX <= r.right + 40 && e.clientY >= r.top - 60 && e.clientY <= r.bottom + 60;
                const y = inside ? e.clientY : null;
                if (y !== proxY) { proxY = y; proxKick(); }
            }, { passive: true });
            document.addEventListener('pointerleave', () => { proxY = null; proxKick(); });
        }

        let sceneEnabled = GM_getValue('sceneEnabled', true) && !calm;
        document.documentElement.classList.toggle('vp-scene', sceneEnabled);
        const sceneSeen = new Set();
        const sceneIO = new IntersectionObserver(es => es.forEach(e => {
            if (e.isIntersecting) { sceneLive(e.target); sceneKick(); }
            else sceneDrop(e.target);
        }), { rootMargin: '150px 0px' });
        function sceneLive(a) {
            if (sceneSeen.has(a)) return;
            sceneSeen.add(a);
            if (sceneEnabled && !sceneAutoOff) a.style.willChange = 'transform, opacity';
        }
        function sceneDrop(a) {
            sceneSeen.delete(a);
            a._vpSceneKey = null;
            ['--vp-so', '--vp-sy', '--vp-ss', 'will-change'].forEach(v => a.style.removeProperty(v));
        }
        const ease = t => t * t * (3 - 2 * t);
        let sceneQueued = false, sceneAutoOff = false, sceneLast = 0, sceneGaps = [];
        function sceneTurnOff() {
            sceneAutoOff = true;
            document.documentElement.classList.remove('vp-scene');
            [...sceneSeen].forEach(a => { a._vpSceneKey = null;['--vp-so', '--vp-sy', '--vp-ss', 'will-change'].forEach(v => a.style.removeProperty(v)); });
            console.info('[ITD VP] сцена ленты выключена до перезагрузки: устройство не успевает рисовать её при прокрутке');
        }
        function sceneFrame(t) {
            sceneQueued = false;
            if (!sceneEnabled || sceneAutoOff) return;
            if (sceneLast && t - sceneLast < 100) {
                sceneGaps.push(t - sceneLast);
                if (sceneGaps.length >= 40) {
                    const med = sceneGaps.sort((x, y) => x - y)[20];
                    sceneGaps = [];
                    if (med > 28) { sceneLast = 0; return sceneTurnOff(); }
                }
            }
            sceneLast = t;
            const H = innerHeight;
            const rects = [...sceneSeen].map(a => [a, a.getBoundingClientRect()]);
            for (const [a, r] of rects) {
                const out = ease(Math.max(0, Math.min(1, (-r.top - r.height * 0.25) / Math.max(1, r.height * 0.75))));
                const inn = ease(Math.max(0, Math.min(1, (H - r.top) / 220)));
                const so = (1 - 0.45 * out).toFixed(3), ss = (1 - 0.04 * out).toFixed(4), sy = (14 * (1 - inn)).toFixed(1) + 'px';
                const key = so + ss + sy;
                if (a._vpSceneKey === key) continue;
                a._vpSceneKey = key;
                a.style.setProperty('--vp-so', so);
                a.style.setProperty('--vp-ss', ss);
                a.style.setProperty('--vp-sy', sy);
            }
        }
        const sceneKick = () => { if (!sceneQueued) { sceneQueued = true; requestAnimationFrame(sceneFrame); } };
        addEventListener('scroll', sceneKick, { capture: true, passive: true });
        addEventListener('resize', sceneKick);
        onDom(function sceneWatch() {
            document.querySelectorAll('article.' + SELECTORS.post).forEach(a => {
                if (!a._vpScene) {
                    a._vpScene = true;
                    sceneIO.observe(a);
                    const r = a.getBoundingClientRect();
                    if (r.bottom > -150 && r.top < innerHeight + 150) sceneLive(a);
                }
                const slot = a.parentElement;
                if (slot && !slot.classList.contains('vp-post-slot')) slot.classList.add('vp-post-slot');
            });
            sceneKick();
        });

        const feedSaved = new Map();
        let feedLoc = location.pathname + location.search, feedAt = feedPath(), feedJob = null, feedSaveTimer = 0;
        function feedPath() { return location.pathname.includes('/post/') ? null : location.pathname + location.search; }
        function feedPosts() { return [...document.querySelectorAll('article.' + SELECTORS.post)].filter(a => !a.parentElement.closest('article.' + SELECTORS.post)); }
        function feedTop(el) { let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; return y; }
        function feedId(a) {
            try { const id = postIdOf(a); if (id) return id; } catch (e) { }
            for (const at of a.attributes) if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(at.value)) return at.value;
            return null;
        }
        function feedFp(a) {
            const link = a.querySelector('header ' + PROFILE_LINK);
            const text = [...a.querySelectorAll('.' + SELECTORS.postText)].map(t => t.textContent).join(' ').replace(/\s+/g, ' ').trim().slice(0, 120);
            const img = [...a.querySelectorAll('img')].find(i => !i.closest('header'));
            return (link ? link.getAttribute('href') : '') + '|' + text + '|' + (img ? img.getAttribute('src') : '');
        }
        function feedSave(anchor) {
            const k = feedPath();
            if (!k || k !== feedAt || (feedJob && feedJob.k === k)) return;
            const posts = feedPosts();
            const edge = Math.min(120, innerHeight * 0.15);
            const a = anchor || posts.find(p => p.getBoundingClientRect().bottom > edge);
            if (!a) return;
            feedSaved.delete(k);
            feedSaved.set(k, { id: feedId(a), fp: feedFp(a), off: feedTop(a) - scrollY, y: scrollY, idx: posts.indexOf(a) });
            if (feedSaved.size > 30) feedSaved.delete(feedSaved.keys().next().value);
        }
        function feedRestore(k, s) {
            const job = { k }, t0 = performance.now(), stops = ['wheel', 'touchstart', 'keydown', 'mousedown'];
            feedJob = job;
            let calm = 0, jumps = 0, hunts = 0, tried = false;
            const quit = () => { if (feedJob === job) feedJob = null; };
            stops.forEach(t => addEventListener(t, quit, { capture: true, passive: true }));
            const go = y => { jumps++; scrollTo({ top: y, behavior: 'instant' }); };
            const step = () => {
                const now = performance.now();
                if (feedJob !== job || feedPath() !== k || now - t0 > 6000 || jumps > 30) {
                    if (feedJob === job) feedJob = null;
                    return stops.forEach(t => removeEventListener(t, quit, true));
                }
                const posts = feedPosts();
                const a = posts.find(p => (s.id && feedId(p) === s.id) || feedFp(p) === s.fp);
                if (a) {
                    const y = Math.max(0, feedTop(a) - s.off);
                    if (Math.abs(scrollY - y) > 1) { go(y); calm = now; } else if (!calm) calm = now;
                    if (now - calm > 800) feedJob = null;
                } else if (posts.length) {
                    if (!tried) { tried = true; go(s.y); }
                    else if (now - t0 > 600) {
                        if (hunts < 6) { hunts++; go(document.documentElement.scrollHeight); }
                        else { go(s.y); feedJob = null; }
                    }
                }
                setTimeout(step, 100);
            };
            step();
        }
        function feedNav(pop) {
            const was = feedLoc;
            feedLoc = location.pathname + location.search;
            if (feedLoc === was) return;
            feedAt = feedPath();
            feedJob = null;
            const s = feedAt && feedSaved.get(feedAt);
            if (s && (pop || was.includes('/post/'))) feedRestore(feedAt, s);
        }
        addEventListener('popstate', () => feedNav(true));
        document.addEventListener('vp-loc', () => feedNav(false));
        addEventListener('scroll', () => { clearTimeout(feedSaveTimer); feedSaveTimer = setTimeout(() => feedSave(), 150); }, { passive: true });
        document.addEventListener('click', e => {
            const a = e.target.closest && e.target.closest('article.' + SELECTORS.post);
            if (!a) return;
            clearTimeout(feedSaveTimer);
            feedSave(feedPosts().find(p => p.contains(a)));
        }, true);

        let ambientEnabled = GM_getValue('ambientEnabled', true);
        const ambient = new Map();
        const ambientSeen = new Set();
        const ambientIO = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? ambientSeen.add(e.target) : ambientSeen.delete(e.target)));
        function ambientScan() {
            if (!ambientEnabled || calm) return;
            document.querySelectorAll('.' + SELECTORS.post + ' video').forEach(v => {
                if (ambient.has(v)) return;
                const host = v.closest('.' + SELECTORS.post);
                const cv = document.createElement('canvas');
                cv.className = 'vp-ambient';
                cv.width = 48; cv.height = 27;
                host.classList.add('vp-ambient-host');
                const under = host.querySelector(':scope > .itd-blur-container');
                if (under) under.after(cv); else host.prepend(cv);
                ambient.set(v, { cv, g: cv.getContext('2d'), host });
                ambientIO.observe(v);
                v.addEventListener('loadeddata', () => ambientDraw(v));
                v.addEventListener('seeked', () => ambientDraw(v));
            });
        }
        function ambientDraw(v) {
            const a = ambient.get(v);
            if (!a || !v.isConnected || v.readyState < 2) return;
            const vr = v.getBoundingClientRect(), hr = a.host.getBoundingClientRect(), pad = 26;
            Object.assign(a.cv.style, {
                left: (vr.left - hr.left - pad) + 'px', top: (vr.top - hr.top - pad) + 'px',
                width: (vr.width + pad * 2) + 'px', height: (vr.height + pad * 2) + 'px'
            });
            a.g.globalAlpha = a.cv.classList.contains('vp-on') ? .2 : 1;
            try { a.g.drawImage(v, 0, 0, 48, 27); a.cv.classList.add('vp-on'); } catch (e) { }
        }
        setInterval(() => {
            if (!ambientEnabled || document.hidden) return;
            for (const v of ambientSeen) if (!v.paused || !ambient.get(v)?.cv.classList.contains('vp-on')) ambientDraw(v);
            for (const [v, a] of ambient) if (!v.isConnected) { a.cv.remove(); ambient.delete(v); ambientSeen.delete(v); }
        }, 150);
        function applyAmbient() {
            if (ambientEnabled) ambientScan();
            else { for (const [v, a] of ambient) { a.cv.remove(); ambientIO.unobserve(v); } ambient.clear(); ambientSeen.clear(); }
        }
        onDom(ambientScan);

        const tabObs = new MutationObserver(muts => muts.forEach(m => liquidTab(m.target, m.oldValue || '')));
        const num = (str, re) => { const m = str.match(re); return m ? parseFloat(m[1]) : null; };
        function liquidTab(ind, old) {
            const now = ind.getAttribute('style') || '';
            const x0 = num(old, /translateX\((-?[\d.]+)px/), x1 = num(now, /translateX\((-?[\d.]+)px/);
            const w0 = num(old, /width:\s*([\d.]+)px/), w1 = num(now, /width:\s*([\d.]+)px/);
            if (x0 === null || x1 === null || w0 === null || w1 === null || x0 === x1) return;
            if (calm) return;
            const lo = Math.min(x0, x1), span = Math.abs(x1 - x0) + Math.max(w0, w1);
            ind.animate([
                { transform: `translateX(${x0}px)`, width: w0 + 'px' },
                { transform: `translateX(${lo}px)`, width: span + 'px', offset: .45 },
                { transform: `translateX(${x1}px)`, width: w1 + 'px' }
            ], { duration: 440, easing: 'cubic-bezier(.65, 0, .25, 1)' });
        }
        onDom(function hookTabs() {
            document.querySelectorAll('.' + SELECTORS.tabs + ' > div:empty').forEach(ind => {
                if (ind._vpTab) return;
                ind._vpTab = true;
                ind.classList.add('vp-tab-ind');
                tabObs.observe(ind, { attributes: true, attributeFilter: ['style'], attributeOldValue: true });
            });
        });

