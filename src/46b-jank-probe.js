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

