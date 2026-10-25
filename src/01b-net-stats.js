    const netLog = [];
    const netMod = { skip: false };
    function netNote(url, method, mod) {
        try {
            const u = new URL(String(url), location.origin);
            if (!/\/api\//.test(u.pathname)) return;
            const p = u.pathname.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
                .replace(/\/users\/(?!me\b)[^/]+/, '/users/:name').replace(/\/posts\/user\/[^/]+/, '/posts/user/:name').replace(/\/\d{4,}/g, '/:n');
            netLog.push([Date.now(), String(method || 'GET').toUpperCase() + ' ' + p, mod ? 1 : 0]);
            if (netLog.length > 3000) netLog.splice(0, 500);
        } catch (e) { }
    }
    function netTable(minutes = 5) {
        const from = Date.now() - minutes * 60000, by = new Map(), perMin = {};
        for (const [t, k, m] of netLog) {
            if (t < from) continue;
            const o = by.get(k) || { запрос: k, мод: 0, сайт: 0 };
            o[m ? 'мод' : 'сайт']++;
            by.set(k, o);
            const mm = new Date(t).toTimeString().slice(0, 5), r = perMin[mm] || (perMin[mm] = { мод: 0, сайт: 0 });
            r[m ? 'мод' : 'сайт']++;
        }
        return { запросы: [...by.values()].sort((a, b) => b.мод + b.сайт - a.мод - a.сайт), по_минутам: perMin };
    }
