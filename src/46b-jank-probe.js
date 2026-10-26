        pageWindow.itdvp.jank = function (sec = 20) {
            if (pageWindow.itdvp._jankOn) return 'замер уже идёт';
            pageWindow.itdvp._jankOn = true;
            const posts = () => [...document.querySelectorAll('article.' + SELECTORS.post)].filter(a => !a.parentElement.closest('article.' + SELECTORS.post));
            const rows = [];
            let prev = null, frames = 0, jumps = 0;
            const t0 = performance.now(), end = t0 + sec * 1000;
            const snap = () => {
                const a = posts().find(p => p.getBoundingClientRect().bottom > 120);
                if (!a) return null;
                const slot = a.parentElement, r = a.getBoundingClientRect(), s = slot.getBoundingClientRect();
                return { a, y: scrollY, art: r.top, slot: s.top, lay: a.offsetHeight, rect: r.height, sh: document.documentElement.scrollHeight, so: a.style.getPropertyValue('--vp-so'), sy: a.style.getPropertyValue('--vp-sy'), ss: a.style.getPropertyValue('--vp-ss') };
            };
            const step = () => {
                const now = performance.now();
                if (now > end) {
                    pageWindow.itdvp._jankOn = false;
                    pageWindow.itdvp._jankRows = rows;
                    const slotN = rows.filter(r => r.причина === 'список сайта').length, postN = rows.filter(r => r.причина === 'сам пост').length;
                    console.info('[ITD VP] замер закончен: кадров ' + frames + ', рывков ' + jumps + ' (список сайта ' + slotN + ', сам пост ' + postN + '), сцена ленты ' + (sceneEnabled && !sceneAutoOff ? 'включена' : 'выключена'));
                    if (rows.length) console.table(rows.slice(0, 40));
                    console.info('[ITD VP] скопируй вот это и пришли:', JSON.stringify(rows.slice(0, 40)));
                    return;
                }
                const c = snap();
                frames++;
                if (c && prev && c.a === prev.a) {
                    const jump = (c.art - prev.art) + (c.y - prev.y), slotJump = (c.slot - prev.slot) + (c.y - prev.y);
                    if (Math.abs(jump) > 1.5) {
                        jumps++;
                        rows.push({
                            мс: Math.round(now - t0), рывок: +jump.toFixed(1), причина: Math.abs(slotJump) > Math.abs(jump - slotJump) ? 'список сайта' : 'сам пост',
                            прокрутка: +(c.y - prev.y).toFixed(1), высотаПоста: c.lay - prev.lay, высотаСтраницы: c.sh - prev.sh,
                            так: [prev.so, prev.sy, prev.ss].join('/') + ' > ' + [c.so, c.sy, c.ss].join('/'),
                            пост: (c.a.querySelector('.' + SELECTORS.postText) || c.a).textContent.trim().slice(0, 24)
                        });
                    }
                }
                prev = c;
                requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
            return 'идёт замер ' + sec + ' с: листай ленту вверх, как обычно, потом смотри консоль';
        };

        pageWindow.itdvp.slots = function (sec = 20) {
            if (pageWindow.itdvp._slotsOn) return 'замер уже идёт';
            pageWindow.itdvp._slotsOn = true;
            const t0 = performance.now(), end = t0 + sec * 1000, recent = new WeakMap(), last = new WeakMap(), rows = [];
            const desc = n => n.nodeType === 1 ? n.tagName.toLowerCase() + (typeof n.className === 'string' && n.className.trim() ? '.' + n.className.trim().split(/\s+/).slice(0, 3).join('.') : '') : '#text';
            const slotOf = n => { const e = n.nodeType === 1 ? n : n.parentElement; return e && e.closest('.vp-post-slot'); };
            const mo = new MutationObserver(ms => {
                const t = performance.now();
                for (const m of ms) {
                    const slot = slotOf(m.target);
                    if (!slot) continue;
                    if (m.type === 'attributes' && m.attributeName === 'style' && m.target.matches('article')) continue;
                    let arr = recent.get(slot);
                    if (!arr) recent.set(slot, arr = []);
                    arr.push([t, m.type === 'attributes' ? m.attributeName + ' @' + desc(m.target) : '+' + [...m.addedNodes].map(desc).join(',') + ' -' + [...m.removedNodes].map(desc).join(',') + ' @' + desc(m.target)]);
                    if (arr.length > 12) arr.shift();
                }
            });
            mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'width', 'height'] });
            const ro = new ResizeObserver(es => es.forEach(e => {
                const h = e.borderBoxSize && e.borderBoxSize[0] ? e.borderBoxSize[0].blockSize : e.contentRect.height, prev = last.get(e.target), now = performance.now();
                last.set(e.target, h);
                if (prev === undefined || Math.abs(h - prev) < 0.5) return;
                const art = e.target.querySelector('article');
                rows.push({
                    мс: Math.round(now - t0), было: Math.round(prev * 10) / 10, стало: Math.round(h * 10) / 10, разница: Math.round((h - prev) * 10) / 10,
                    пост: ((art && art.textContent) || '').trim().slice(0, 22),
                    перед: (recent.get(e.target) || []).filter(x => now - x[0] < 200).map(x => x[1]).slice(-5)
                });
            }));
            const scan = () => {
                document.querySelectorAll('.vp-post-slot').forEach(sl => ro.observe(sl));
                if (performance.now() < end) return requestAnimationFrame(scan);
                mo.disconnect(); ro.disconnect();
                pageWindow.itdvp._slotsOn = false;
                pageWindow.itdvp._slotRows = rows;
                const withMod = rows.filter(r => r.перед.some(x => /vp-/.test(x))).length;
                console.info('[ITD VP] замер высот закончен: изменений высоты постов ' + rows.length + ', из них после правок мода ' + withMod);
                if (rows.length) console.table(rows.slice(0, 40));
                console.info('[ITD VP] скопируй вот это и пришли:', JSON.stringify(rows.slice(0, 30)));
            };
            requestAnimationFrame(scan);
            return 'идёт замер высот ' + sec + ' с: листай ленту вверх, потом смотри консоль';
        };

