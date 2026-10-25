    const sched = (() => {
        const tasks = new Map(), NET_GAP = 600;
        let timer = 0, lastNet = -1e9;
        const period = k => (typeof k.every === 'function' ? k.every() : k.every) || 0;
        function arm(ms) {
            if (timer) return;
            timer = setTimeout(tick, Math.max(250, Math.min(5000, ms)));
        }
        function run(k, t) {
            k.last = t;
            k.busy = true;
            k.runs++;
            Promise.resolve().then(k.fn)
                .catch(e => { k.errors++; try { logErr('планировщик: ' + k.id, e); } catch (x) { } })
                .finally(() => { k.busy = false; k.ms += performance.now() - t; });
        }
        function tick() {
            timer = 0;
            const t = performance.now();
            let wait = 5000;
            try {
            for (const k of tasks.values()) {
                if (k.busy && t - k.last > 90000) k.busy = false;
                if (k.busy) continue;
                const ev = period(k);
                if (!ev) { wait = Math.min(wait, 1000); continue; }
                const due = k.last + ev;
                if (t < due) { wait = Math.min(wait, due - t); continue; }
                if (k.visible && document.hidden) { wait = Math.min(wait, 1000); continue; }
                if (k.net) {
                    if (apiPaused()) { wait = Math.min(wait, 1000); continue; }
                    if (t - lastNet < NET_GAP) { wait = Math.min(wait, NET_GAP - (t - lastNet)); continue; }
                    lastNet = t;
                }
                run(k, t);
                wait = Math.min(wait, ev);
            }
            } catch (e) { try { logErr('планировщик', e); } catch (x) { } console.warn('[ITD VP] планировщик', e); }
            arm(wait);
        }
        return {
            add(id, fn, o = {}) {
                const k = { id, fn, every: o.every, net: !!o.net, visible: !!o.visible, last: performance.now(), busy: false, runs: 0, errors: 0, ms: 0 };
                if (o.first !== undefined) k.last += o.first - period(k);
                tasks.set(id, k);
                arm(250);
                return { id, remove: () => tasks.delete(id), kick: () => { k.last = -1e9; arm(250); } };
            },
            table() {
                return [...tasks.values()].map(k => ({ задача: k.id, период: typeof k.every === 'function' ? 'динамический' : k.every, сеть: k.net, запусков: k.runs, ошибок: k.errors, мс_всего: Math.round(k.ms) }));
            }
        };
    })();
