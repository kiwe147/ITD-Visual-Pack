        const COUNT_LABEL = /подпис|пост|лайк|друз/i;
        const counted = new Set();
        const countKey = () => loginOf(location.pathname) || location.pathname;
        function countUp() {
            if (counted.has(countKey())) return;
            const spans = [...document.querySelectorAll('span')].filter(sp => {
                const next = sp.nextElementSibling;
                return next && !sp.children.length && /^\d{1,7}$/.test(sp.textContent.trim()) && COUNT_LABEL.test(next.textContent)
                    && !sp.closest('.' + SELECTORS.post + ', .' + SELECTORS.notification + ', nav, .vp-rail');
            });
            if (!spans.length) return;
            counted.add(countKey());
            if (calm) return;
            spans.forEach(sp => {
                sp.style.setProperty('--vp-to', sp.textContent.trim());
                sp.style.setProperty('--vp-count-color', getComputedStyle(sp).color);
                sp.classList.add('vp-count');
                sp.addEventListener('animationend', () => sp.classList.remove('vp-count'), { once: true });
                setTimeout(() => sp.classList.remove('vp-count'), 1400);
            });
        }
        onDom(countUp);

        const plural = (n, one, few, many) => n % 10 === 1 && n % 100 !== 11 ? one
            : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many;
        const postsCounted = new Set();
        function profilePostsRow() {
            const login = loginOf(location.pathname);
            if (!login) return;
            const done = document.querySelector('.vp-posts-stat');
            if (done && done.isConnected && done.parentElement && done.parentElement.dataset.vpPosts === login) return;
            const num = [...document.querySelectorAll('span')].find(sp => sp.nextElementSibling && !sp.children.length && /^\d[\d\s]*$/.test(sp.textContent.trim())
                && /подпис/i.test(sp.nextElementSibling.textContent) && !sp.closest('.' + SELECTORS.post + ', nav, .vp-rail'));
            const item = num && num.parentElement, row = item && item.parentElement;
            if (!row || row.querySelector('.vp-posts-stat')) return;
            if (row.dataset.vpPosts === login) return;
            row.dataset.vpPosts = login;
            hcData(login, 2500).then(d => {
                const total = d && d.postsCount;
                if (typeof total !== 'number' || !row.isConnected || row.querySelector('.vp-posts-stat') || loginOf(location.pathname) !== login) return;
                const last = [...row.children].filter(c => c.querySelector('span')).pop() || item;
                const mine = last.cloneNode(true);
                mine.classList.add('vp-posts-stat');
                mine.querySelectorAll('.vp-count').forEach(e => { e.classList.remove('vp-count');['--vp-to', '--vp-count-color'].forEach(v => e.style.removeProperty(v)); });
                const [n, label] = mine.querySelectorAll('span');
                n.textContent = total;
                label.textContent = plural(total, 'пост', 'поста', 'постов');
                row.appendChild(mine);
                const countUpOnce = (n, total) => {
                    if (calm) return;
                    n.style.setProperty('--vp-to', String(total));
                    n.style.setProperty('--vp-count-color', getComputedStyle(n).color);
                    n.classList.add('vp-count');
                    setTimeout(() => n.classList.remove('vp-count'), 1400);
                };
                if (!postsCounted.has(login)) countUpOnce(n, total);
                if (myUsername && login.toLowerCase() === myUsername.toLowerCase()) myLikesTotal().then(likes => {
                    if (typeof likes !== 'number' || !row.isConnected || row.querySelector('.vp-likes-stat') || loginOf(location.pathname) !== login) return;
                    const lk = mine.cloneNode(true);
                    lk.classList.remove('vp-posts-stat');
                    lk.classList.add('vp-likes-stat');
                    const [ln, llabel] = lk.querySelectorAll('span');
                    ln.classList.remove('vp-count');
                    ln.textContent = likes;
                    llabel.textContent = 'лайков';
                    mine.after(lk);
                    if (!postsCounted.has(login + '|likes')) { postsCounted.add(login + '|likes'); countUpOnce(ln, likes); }
                });
                postsCounted.add(login);
            });
        }
        onDom(profilePostsRow);
        function profileStatsFit() {
            const st = document.querySelector('.vp-posts-stat'), row = st && st.parentElement;
            if (!row || !row.isConnected) return;
            let g = row.parentElement;
            for (let k = 0; g && k < 4 && getComputedStyle(g).display !== 'grid'; k++) g = g.parentElement;
            if (!g || g.hasAttribute('data-vp-stack') || getComputedStyle(g).display !== 'grid') return;
            if (getComputedStyle(g).gridTemplateColumns.trim().split(/\s+/).length < 2) return;
            const col = [...g.children].find(c => c.contains(row));
            if (!col || g.children.length < 2) return;
            const edge = col.getBoundingClientRect().right + 1;
            if ([...row.children].some(c => c.getBoundingClientRect().right > edge)) g.setAttribute('data-vp-stack', '');
        }
        onDom(profileStatsFit);
        onDom(function nickTails() {
            document.querySelectorAll('.vp-nick-text').forEach(sp => {
                const hash = [...sp.classList].find(c => !/^(vp-|my-|mod-)/.test(c));
                if (!hash) return;
                const badges = '.mod-badge-voronoi, .mod-badge-verify';
                const up = sp.parentElement, hops = [sp];
                if (up && !up.matches('.vp-nick') && [...up.children].every(c => c === sp || c.matches(badges))) hops.push(up);
                let tail = null;
                for (const from of hops) {
                    for (let n = from.nextElementSibling; n && !tail; n = n.nextElementSibling) {
                        if (n.matches(badges)) continue;
                        tail = n.matches('span.' + hash) ? n : n.querySelector('span.' + hash);
                        if (!tail) break;
                    }
                    if (tail) break;
                }
                if (!tail || tail === sp) return;
                const txt = tail.textContent;
                if (!txt.trim()) return;
                let node = sp._vpTail;
                const last = sp.lastChild, was = sp.dataset.vpTail;
                if (!node && was && last && last.nodeType === 3 && last.nodeValue.endsWith(was)) {
                    node = last.nodeValue.length > was.length ? last.splitText(last.nodeValue.length - was.length) : last !== sp.firstChild ? last : null;
                    if (node) sp._vpTail = node;
                }
                if (!node || node.parentNode !== sp) { node = document.createTextNode(''); sp.appendChild(node); sp._vpTail = node; }
                if (node.nodeValue !== txt) node.nodeValue = txt;
                if (sp.dataset.vpTail !== txt) sp.dataset.vpTail = txt;
                if (!tail.classList.contains('vp-nick-tail-moved')) tail.classList.add('vp-nick-tail-moved');
            });
        });
        onDom(function hideServiceNotifs() {
            document.querySelectorAll('.' + SELECTORS.notification).forEach(n => {
                if (n.dataset.vpSvc || !/(^|[^A-Za-z0-9])ITDX[A-Z0-9-]*(?: \S{1,12}){0,3} [\w\-/+=]{8,}/.test(n.textContent)) return;
                n.dataset.vpSvc = '1'; n.style.display = 'none';
            });
        });

        let uiSoundEnabled = GM_getValue('uiSoundEnabled', false);
        let uiCtx = null;
        const UI_GAIN = IS_PHONE ? 5 : 1;
        function uiAudio() {
            uiCtx = uiCtx || new (window.AudioContext || window.webkitAudioContext)();
            if (uiCtx.state !== 'running') uiCtx.resume().catch(() => { });
            return uiCtx;
        }
        function uiUnlock() {
            if (!uiSoundEnabled || (uiCtx && uiCtx.state === 'running')) return;
            try {
                const c = uiAudio(), b = c.createBufferSource();
                b.buffer = c.createBuffer(1, 1, c.sampleRate);
                b.connect(c.destination);
                b.start(0);
            } catch (e) { }
        }
        ['pointerdown', 'touchend', 'keydown'].forEach(ev => addEventListener(ev, uiUnlock, { capture: true, passive: true }));
        function uiSound(kind) {
            if (!uiSoundEnabled) return;
            try {
                uiAudio();
                const t = uiCtx.currentTime;
                const tone = (f0, f1, dur, vol, type = 'sine', at = 0) => {
                    const o = uiCtx.createOscillator(), g = uiCtx.createGain();
                    o.type = type;
                    o.frequency.setValueAtTime(f0, t + at);
                    o.frequency.exponentialRampToValueAtTime(f1, t + at + dur);
                    g.gain.setValueAtTime(0.0001, t + at);
                    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * UI_GAIN * soundVolume()), t + at + 0.006);
                    g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
                    o.connect(g).connect(uiCtx.destination);
                    o.start(t + at);
                    o.stop(t + at + dur + 0.02);
                };
                if (kind === 'like') { tone(520, 880, 0.09, 0.015); tone(880, 1320, 0.12, 0.0113, 'sine', 0.06); }
                else if (kind === 'toggle') tone(1400, 900, 0.05, 0.01, 'triangle');
                else if (kind === 'nav') tone(300, 220, 0.07, 0.0125);
                else tone(900, 700, 0.04, 0.0075, 'triangle');
            } catch (e) { }
        }
        document.addEventListener('click', e => {
            if (!uiSoundEnabled || !e.isTrusted) return;
            const t = e.target;
            if (t.closest('button[aria-label="Нравится"]')) uiSound('like');
            else if (t.closest('.settings-option, .toggle-switch')) uiSound('toggle');
            else if (t.closest('.' + SELECTORS.navLink)) uiSound('nav');
            else if (t.closest('.vp-pill-btn, .nick-style-option, .vp-msg-again, button')) uiSound('click');
        }, true);

