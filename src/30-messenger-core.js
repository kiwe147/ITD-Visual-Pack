        const MSG_MAX = 990, MSG_TEXT_MAX = 500;
        const MSG_IMG_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
        const MSG_IMG_RE = /\/images\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(\w+)(?:[?#]|$)/i;
        const msgImgUrl = img => `https://cdn.xn--d1ah4a.com/images/${img.id}.${MSG_IMG_EXT[img.ext] || 'png'}`;
        const msgUuidBytes = u => Uint8Array.from(u.replace(/-/g, '').match(/../g), h => parseInt(h, 16));
        const msgBytesUuid = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
        const MSG_ALBUM_MAX = 10;
        const msgBodyText = t => { const x = String(t || ''); return /^> /.test(x) ? x.replace(/^> [^\n]*\n?/, '') ||(/^> Переслано/.test(x) ? 'Пересланное сообщение' : 'Ответ') : x; };
        const msgPreview = m => { const t = msgBodyText(m.text); return m.imgs && m.imgs.length > 1 ? `${m.imgs.length} фото` + (t ? ' · ' + t : '') : m.img ? (t || 'Фото') : t; };
        const msgNet = { keys: new Map(), vols: [], me: null, pairs: new Map(), conv: new Map(), syncing: null, blocks: {} };
        const msgBlocks = () => GM_getValue(acctKey('msgBlocked'), {});
        function msgIsBlocked(uid) { const p = msgNet.blocks[uid] || msgBlocks()[uid]; return !!(p && p.length && !p[p.length - 1][1]); }
        const msgBlockedMe = uid => !!(msgNet.blockedMe && msgNet.blockedMe.get(uid) && msgNet.blockedMe.get(uid).on);
        function msgBlockedAt(uid, ts) { const p = msgNet.blocks[uid]; return !!p && p.some(([a, b]) => ts >= a && (!b || ts <= b)); }
        function msgSetBlock(uid, on) {
            const all = msgBlocks(), p = all[uid] || [], now = Math.floor(srvNow() / 1000), open = p.length && !p[p.length - 1][1];
            if (on && !open) p.push([now, 0]);
            if (!on && open) p[p.length - 1][1] = now;
            all[uid] = p.slice(-20);
            GM_setValue(acctKey('msgBlocked'), all);
        }
        const te = new TextEncoder(), td = new TextDecoder();
        const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
        const rnd = n => crypto.getRandomValues(new Uint8Array(n));
        const b64u = {
            enc: u8 => { let s = ''; for (const b of u8) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
            dec: s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0))
        };
        const cjk14 = {
            enc(u8) {
                let out = '', acc = 0, bits = 0;
                for (const b of u8) { acc = (acc << 8) | b; bits += 8; while (bits >= 14) { bits -= 14; out += String.fromCharCode(0x4E00 + ((acc >> bits) & 0x3FFF)); } acc &= (1 << bits) - 1; }
                if (bits) out += String.fromCharCode(0x4E00 + ((acc << (14 - bits)) & 0x3FFF));
                return out;
            },
            dec(s) {
                const out = [];
                let acc = 0, bits = 0;
                for (const ch of s) {
                    const v = ch.charCodeAt(0) - 0x4E00;
                    if (v < 0 || v > 0x3FFF) throw new Error('том: чужой символ');
                    acc = (acc << 14) | v; bits += 14;
                    while (bits >= 8) { bits -= 8; out.push((acc >> bits) & 255); }
                    acc &= (1 << bits) - 1;
                }
                return new Uint8Array(out);
            }
        };
        const pack = recs => cat(...recs.map(r => cat(new Uint8Array([r.length >> 8, r.length & 255]), r)));
        function unpack(u8) {
            const out = [];
            for (let i = 0; i + 2 <= u8.length;) {
                const n = (u8[i] << 8) | u8[i + 1];
                if (!n || i + 2 + n > u8.length) break;
                out.push(u8.slice(i + 2, i + 2 + n)); i += 2 + n;
            }
            return out;
        }
        const volText = (seq, mode, recs) => `ITDXM1 ${seq} ${mode}${(mode === 'c' ? cjk14 : b64u).enc(pack(recs))}`;
        const volRecs = v => unpack(v.mode === 'c' ? cjk14.dec(v.data) : b64u.dec(v.data));
        const msgIdb = (() => {
            let db = null;
            const open = () => db || (db = new Promise((ok, no) => {
                const r = indexedDB.open('itdx-msg', 1);
                r.onupgradeneeded = () => r.result.createObjectStore('keys');
                r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
            }));
            const run = (mode, fn) => open().then(d => new Promise((ok, no) => { const t = d.transaction('keys', mode), q = fn(t.objectStore('keys')); t.oncomplete = () => ok(q.result); t.onerror = () => no(t.error); }));
            return { get: k => run('readonly', s => s.get(k)), set: (k, v) => run('readwrite', s => s.put(v, k)) };
        })();
        const msgMyId = () => (meData && meData.id) || (siteAuth.me && siteAuth.me.id) || null;
        async function pwKey(pw, salt) {
            const base = await crypto.subtle.importKey('raw', te.encode(pw), 'PBKDF2', false, ['deriveKey']);
            return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 310000 }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
        }
        function msgPair(uid) {
            if (!msgNet.pairs.has(uid)) msgNet.pairs.set(uid, (async () => {
                const k = msgNet.keys.get(uid), me = msgNet.me;
                if (!k || !me) return null;
                const pub = await crypto.subtle.importKey('raw', k.pub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
                const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: pub }, me.priv, 256);
                const hk = await crypto.subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
                return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: te.encode([me.id, uid].sort().join('|')), info: te.encode('itdx-msg-v1') },
                    hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
            })().catch(() => null));
            return msgNet.pairs.get(uid);
        }
        async function msgOpenRec(key, rec) {
            try {
                const pt = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: rec.slice(0, 12) }, key, rec.slice(12)));
                const out = { ts: ((pt[0] << 24) >>> 0) + (pt[1] << 16) + (pt[2] << 8) + pt[3], sup: !!(pt[4] & 1) };
                if (pt[4] & 8) { out.svc = pt.slice(5); out.text = ''; return out; }
                if (pt[4] & ~7 || (pt[4] & 4 && !(pt[4] & 2))) { out.text = 'Сообщение из новой версии ИТД X — обнови мод, чтобы его увидеть'; return out; }
                if (pt[4] & 2 && pt.length >= 22) {
                    const imgs = [{ ext: pt[5], id: msgBytesUuid(pt.slice(6, 22)) }];
                    let o = 22;
                    if (pt[4] & 4 && pt.length > 22) {
                        const k = pt[22];
                        o = 23;
                        for (let j = 0; j < k && o + 17 <= pt.length; j++, o += 17) imgs.push({ ext: pt[o], id: msgBytesUuid(pt.slice(o + 1, o + 17)) });
                    }
                    out.img = imgs[0]; out.imgs = imgs; out.text = td.decode(pt.slice(o));
                }
                else out.text = td.decode(pt.slice(5));
                return out;
            } catch (e) { return null; }
        }
        function msgSync() {
            if (msgNet.syncing) return msgNet.again || (msgNet.again = msgNet.syncing.catch(() => { }).then(() => { msgNet.again = null; return msgSync(); }));
            msgNet.syncing = (async () => {
                const keys = new Map(), vols = [];
                let callNote = null;
                await ensureApproved();
                const meId = msgMyId(), iAmOwner = meId === OWNER_ID;
                for (const c of await allComments(MSG_POST_ID, 30)) {
                    const a = c.author, t = String(c.content || '');
                    if (!a || !a.id) continue;
                    if (a.id !== meId && !iAmOwner && !isApprovedAuthor(a)) continue;
                    let m;
                    if ((m = t.match(/^ITDXK1 ([\w-]+) ([\w-]+)$/))) {
                        if (!keys.has(a.id)) keys.set(a.id, { id: a.id, login: a.username || '', cid: c.id, pubText: m[1], pub: b64u.dec(m[1]), sealed: m[2] });
                    } else if (a.id === OWNER_ID && t.startsWith('ITDXE ')) {
                        const o = openText(t);
                        if (o.startsWith('ITDXC1 ')) callNote = { cid: c.id, list: o.slice(7).split(' ').filter(Boolean).map(x => { const [u, ts] = x.split(':'); return { u, ts: +ts || 0 }; }) };
                    } else if ((m = t.match(/^ITDXM1 (\d+) ([cb])([\s\S]*)$/))) vols.push({ cid: c.id, author: a.id, seq: +m[1], mode: m[2], data: m[3], made: Date.parse(c.createdAt || c.created_at || '') || 0 });
                }
                const changed = [...keys].some(([id, k]) => !msgNet.keys.get(id) || msgNet.keys.get(id).pubText !== k.pubText) || keys.size !== msgNet.keys.size;
                msgNet.keys = keys; msgNet.vols = vols.sort((x, y) => x.seq - y.seq); msgNet.callNote = callNote;
                if (changed) msgNet.pairs.clear();
                if (!msgNet.me) await msgLoadMe();
                await msgDecryptAll();
                try { callCheck(); } catch (e) { logErr('звонок', e); }
                document.dispatchEvent(new Event('vp-msg-synced'));
            })().finally(() => { msgNet.syncing = null; });
            return msgNet.syncing;
        }
        async function msgLoadMe() {
            const id = msgMyId(), k = id && msgNet.keys.get(id);
            if (!k) return null;
            try { const s = await msgIdb.get('me:' + id); if (s && s.pub === k.pubText) msgNet.me = { id, priv: s.priv }; } catch (e) { }
            return msgNet.me;
        }
        async function msgRemember(id, pk8, pubText) {
            const priv = await crypto.subtle.importKey('pkcs8', pk8, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
            msgNet.me = { id, priv }; msgNet.pairs.clear();
            try { await msgIdb.set('me:' + id, { priv, pub: pubText }); } catch (e) { }
        }
        async function msgCreateKey(pw) {
            const id = msgMyId();
            if (!id) throw new Error('Не вошёл в аккаунт');
            const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
            const pub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey)), pk8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', kp.privateKey));
            const salt = rnd(16), iv = rnd(12), ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await pwKey(pw, salt), pk8));
            const content = `ITDXK1 ${b64u.enc(pub)} ${b64u.enc(cat(salt, iv, ct))}`;
            const old = msgNet.keys.get(id);
            const res = old
                ? await editComment(old.cid, content)
                : await sendComment(MSG_POST_ID, content);
            if (!res.ok) throw new Error('Ключ не сохранился: ' + res.status);
            await msgRemember(id, pk8, b64u.enc(pub));
            await msgSync();
        }
        async function msgUnlock(pw) {
            const id = msgMyId(), k = id && msgNet.keys.get(id);
            if (!k) throw new Error('Ключа ещё нет');
            const raw = b64u.dec(k.sealed);
            let pk8;
            try { pk8 = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(16, 28) }, await pwKey(pw, raw.slice(0, 16)), raw.slice(28))); }
            catch (e) { throw new Error('Неверный пароль'); }
            await msgRemember(id, pk8, k.pubText);
            await msgDecryptAll();
        }
        async function msgDecryptAll() {
            const me = msgNet.me;
            if (!me) return;
            const conv = new Map(), add = (uid, dir, m, v, i) => { if (!conv.has(uid)) conv.set(uid, []); conv.get(uid).push({ dir, ...m, _v: v, _i: i }); };
            const others = [...msgNet.keys.keys()].filter(id => id !== me.id);
            for (const v of msgNet.vols) {
                let recs;
                try { recs = volRecs(v); } catch (e) { continue; }
                if (v.author === me.id) {
                    for (const [i, r] of recs.entries()) for (const uid of others) { const k = await msgPair(uid), m = k && await msgOpenRec(k, r); if (m) { add(uid, 'out', m, v, i); break; } }
                } else {
                    const k = await msgPair(v.author);
                    if (k) for (const [i, r] of recs.entries()) { const m = await msgOpenRec(k, r); if (m) add(v.author, 'in', m, v, i); }
                }
            }
            const recBlocks = {}, blockedMe = new Map(), local = msgBlocks(), blocks = Object.assign({}, local);
            conv.forEach((list, uid) => list.forEach(m => {
                if (!m.svc || m.svc[0] !== 5 || m.svc.length < 2) return;
                if (m.dir === 'out') (recBlocks[uid] || (recBlocks[uid] = [])).push([m.ts, !!m.svc[1]]);
                else { const b = blockedMe.get(uid); if (!b || b.ts <= m.ts) blockedMe.set(uid, { ts: m.ts, on: !!m.svc[1] }); }
            }));
            for (const [uid, ev] of Object.entries(recBlocks)) {
                ev.sort((a, b) => a[0] - b[0]);
                const p = [];
                for (const [ts, on] of ev) { const open = p.length && !p[p.length - 1][1]; if (on && !open) p.push([ts, 0]); if (!on && open) p[p.length - 1][1] = ts; }
                const lp = local[uid] || [], lLast = lp.length ? lp[lp.length - 1][1] || lp[lp.length - 1][0] : 0;
                if (ev[ev.length - 1][0] >= lLast) blocks[uid] = p;
            }
            msgNet.blocks = blocks; msgNet.blockedMe = blockedMe;
            conv.forEach((list, uid) => conv.set(uid, list.filter(m => !(m.dir === 'in' && msgBlockedAt(uid, m.ts)))));
            const volSkew = new Map(), authSkew = new Map();
            conv.forEach(list => list.forEach(m => { if (m._i === 0 && m._v.made) volSkew.set(m._v, m.ts - m._v.made / 1000); }));
            volSkew.forEach((k, v) => { if (!authSkew.has(v.author)) authSkew.set(v.author, []); authSkew.get(v.author).push(k); });
            const mid = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
            conv.forEach(list => list.forEach(m => {
                let k = volSkew.has(m._v) ? volSkew.get(m._v) : authSkew.has(m._v.author) ? mid(authSkew.get(m._v.author)) : 0;
                if (Math.abs(k) < 20) k = 0;
                m.at = Math.round(m.ts - k);
                delete m._v; delete m._i;
            }));
            conv.forEach(list => list.sort((x, y) => x.at - y.at || x.ts - y.ts));
            const reacts = new Map(), reads = new Map(), calls = [], sigs = [], pins = new Map();
            conv.forEach((list, uid) => {
                const keep = [], gone = new Set(), pinEv = [];
                for (const m of list) {
                    if (!m.svc || m.svc.length < 6) continue;
                    const mine = !!m.svc[5], dir = m.dir === 'out' ? (mine ? 'out' : 'in') : (mine ? 'in' : 'out');
                    if (m.svc[0] === 7 && mine) gone.add(reactKey(uid, m.dir, u32(m.svc, 1)));
                    else if (m.svc[0] === 6 && m.svc.length >= 7) pinEv.push({ key: reactKey(uid, dir, u32(m.svc, 1)), on: !!m.svc[6], at: m.at });
                }
                if (pinEv.length) {
                    const on = new Map();
                    pinEv.sort((x, y) => x.at - y.at).forEach(e => { if (e.on) on.set(e.key, e.at); else on.delete(e.key); });
                    pins.set(uid, [...on].sort((x, y) => x[1] - y[1]).map(x => x[0]));
                }
                for (const m of list) {
                    if (!m.svc) { if (!gone.has(reactKey(uid, m.dir, m.ts))) keep.push(m); continue; }
                    const who = m.dir === 'out' ? 'me' : 'them', k = m.svc[0];
                    if (k === 1 && m.svc.length >= 6) {
                        const mine = !!m.svc[5], dir = m.dir === 'out' ? (mine ? 'out' : 'in') : (mine ? 'in' : 'out');
                        const key = reactKey(uid, dir, u32(m.svc, 1)), e = reacts.get(key) || {};
                        if (!e[who] || e[who].ts <= m.ts) e[who] = { ts: m.ts, emoji: td.decode(m.svc.slice(6)) };
                        reacts.set(key, e);
                    } else if (k === 3 && m.dir === 'in' && uid === OWNER_ID) calls.push(m.ts);
                    else if (k === 4 && m.svc.length >= 6) sigs.push({ uid, dir: m.dir, ts: m.ts, type: m.svc[1], id: u32(m.svc, 2), data: m.svc.slice(6) });
                    else if (k === 2 && m.svc.length >= 5) {
                        const r = reads.get(uid) || { me: 0, them: 0 }, at = u32(m.svc, 1), th = m.svc.length >= 6 ? m.svc[5] : -1;
                        r[who] = Math.max(r[who], at);
                        if (th !== 1) r[who + '0'] = Math.max(r[who + '0'] || 0, at);
                        if (th !== 0) r[who + '1'] = Math.max(r[who + '1'] || 0, at);
                        reads.set(uid, r);
                    }
                }
                if (keep.length) conv.set(uid, keep); else conv.delete(uid);
            });
            const pend = msgNet.pendReacts || (msgNet.pendReacts = new Map());
            pend.forEach((q, key) => {
                const e = reacts.get(key) || {}, got = e.me ? e.me.emoji : '';
                if (got === q.emoji || Date.now() > q.until) { pend.delete(key); return; }
                e.me = { ts: q.ts, emoji: q.emoji };
                reacts.set(key, e);
            });
            msgNet.pins = pins; msgNet.reacts = reacts; msgNet.reads = reads; msgNet.calls = calls; msgNet.sigs = sigs;
            msgNet.conv = conv;
        }
        async function msgPrepImage(file) {
            if (file.type === 'image/gif') { if (file.size > 5 * 1024 * 1024) throw new Error('GIF больше 5 МБ'); return file; }
            const bmp = await createImageBitmap(file);
            const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)), w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            c.getContext('2d').drawImage(bmp, 0, 0, w, h);
            let blob = await new Promise(r => c.toBlob(r, 'image/webp', 0.85));
            if (!blob || blob.type !== 'image/webp') blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
            if (k === 1 && /^image\/(png|jpeg|webp)$/.test(file.type) && file.size <= blob.size) blob = file;
            if (blob.size > 5 * 1024 * 1024) throw new Error('картинка больше 5 МБ');
            return new File([blob], 'img.' + (blob.type.split('/')[1] || 'png'), { type: blob.type });
        }
        async function msgUploadImage(file, asis) {
            const fd = new FormData();
            fd.append('file', asis && /^image\/(jpeg|png)$/.test(file.type) ? file : await msgPrepImage(file));
            const res = await api('/api/files/upload', { method: 'POST', body: fd });
            const j = await res.json().catch(() => null), d = j && (j.data || j);
            if (!res.ok) console.log('[ITD VP] загрузка картинки: ответ сервера', res.status, JSON.stringify(j).slice(0, 300));
            if (!res.ok) throw new Error('загрузка картинки: ' + res.status + (j && (j.error && j.error.message || j.message) ? ', ' + (j.error && j.error.message || j.message) : ''));
            const m = String(d && d.url || '').match(MSG_IMG_RE), ext = m ? MSG_IMG_EXT.indexOf(m[2].toLowerCase()) : -1;
            if (!m || ext < 0) throw new Error('сервер вернул незнакомую ссылку');
            return { ext, id: m[1].toLowerCase() };
        }
        const be32 = n => new Uint8Array([n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255]);
        const u32 = (b, o) => ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
        const reactKey = (uid, dir, ts) => uid + '|' + dir + '|' + ts;
        const MSG_REACTS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '👎'];
        function msgReact(uid, m, emoji) {
            return msgSend(uid, '', false, null, cat(new Uint8Array([1]), be32(m.ts), new Uint8Array([m.dir === 'out' ? 1 : 0]), te.encode(emoji || '')));
        }
        function msgSendRead(uid, upTo, sup) { return msgSend(uid, '', false, null, cat(new Uint8Array([2]), be32(upTo), new Uint8Array([sup ? 1 : 0]))); }
        async function msgSend(uid, text, sup, img, svc) {
            const me = msgNet.me, key = await msgPair(uid);
            if (!me || !key) throw new Error('нет ключа');
            const ts = Math.floor(srvNow() / 1000), iv = rnd(12);
            const imgs = !img ? [] : Array.isArray(img) ? img.slice(0, MSG_ALBUM_MAX) : [img];
            const one = x => cat(new Uint8Array([x.ext]), msgUuidBytes(x.id));
            const imgBytes = !imgs.length ? new Uint8Array(0)
                : imgs.length === 1 ? one(imgs[0]) : cat(one(imgs[0]), new Uint8Array([imgs.length - 1]), ...imgs.slice(1).map(one));
            const pt = svc ? cat(be32(ts), new Uint8Array([1 | 8]), svc)
                : cat(new Uint8Array([ts >>> 24, (ts >> 16) & 255, (ts >> 8) & 255, ts & 255, (sup ? 1 : 0) | (imgs.length ? 2 : 0) | (imgs.length > 1 ? 4 : 0)]),
                    imgBytes, te.encode(text.slice(0, MSG_TEXT_MAX)));
            const rec = cat(iv, new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, pt)));
            await msgSync();
            const write = async mode => {
                const last = msgNet.vols.filter(v => v.author === me.id).pop();
                let recs = [], seq = 1, cid = null;
                if (last) { try { recs = volRecs(last); } catch (e) { recs = []; } seq = last.seq; cid = last.cid; }
                let content = volText(seq, mode, [...recs, rec]);
                if (!last || content.length > MSG_MAX) { content = volText(last ? seq + 1 : 1, mode, [rec]); cid = null; }
                const res = cid
                    ? await editComment(cid, content)
                    : await sendComment(MSG_POST_ID, content);
                if (!res.ok) throw new Error('сообщение: ' + res.status);
                const saved = await res.json().then(j => { const d = j && (j.data || j.comment || j); return d && d.content; }).catch(() => null);
                return saved == null || saved === content;
            };
            const mode = GM_getValue('msgMode', 'c');
            if (!(await write(mode)) && mode === 'c') { GM_setValue('msgMode', 'b'); await msgSync(); await write('b'); }
            await msgSync();
            return ts;
        }
        const msgKeyOf = login => [...msgNet.keys.values()].find(k => k.login.toLowerCase() === String(login).toLowerCase()) || null;
        const msgIsSupport = () => msgMyId() === OWNER_ID;
        function msgTarget(d) {
            if (d.supUid) return { uid: d.supUid, sup: true };
            if (d.support) { const k = msgNet.keys.get(OWNER_ID); return { uid: k && k.id, sup: true, missing: 'Поддержка ещё не подключила сообщения — напиши в тг @NeuroSFW' }; }
            const k = msgKeyOf(d.login);
            return { uid: k && k.id, sup: false, missing: `У ${d.name} ещё нет ключа сообщений — появится, когда откроет «Сообщения» в ИТД X 3.3.3` };
        }
        const msgHidden = () => { const o = GM_getValue(acctKey('msgHidden'), {}); return o && typeof o === 'object' ? o : {}; };
        const hideKey = (uid, m) => uid + '|' + m.dir + '|' + m.ts;
        function msgHide(uid, m) { const o = msgHidden(); o[hideKey(uid, m)] = 1; GM_setValue(acctKey('msgHidden'), o); }
        const msgThread = t => {
            if (!t.uid) return [];
            const hid = msgHidden();
            return (msgNet.conv.get(t.uid) || []).filter(m => m.sup === t.sup && !hid[hideKey(t.uid, m)]);
        };
        addCss(`
        .vp-msgs-menu { min-width: 236px; padding: 6px; }
        .vp-msgs-menu .vp-msgs-menu-i { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; border: 0; background: transparent; color: inherit; font: inherit; font-size: 14px; padding: 9px 12px; border-radius: 10px; cursor: pointer; }
        .vp-msgs-menu .vp-msgs-menu-i svg { flex: none; opacity: .85; }
        .vp-msgs-menu .vp-msgs-menu-i.vp-danger { color: #ff5a5f; }
        .vp-msgs-menu-sep { height: 1px; margin: 5px 6px; background: var(--border-color, rgba(255, 255, 255, .1)); }
        .vp-msgs-quote { display: block; margin: 0 0 5px; padding: 3px 9px; border-left: 3px solid var(--vp-accent, #f91880); border-radius: 4px 9px 9px 4px; background: rgba(127, 127, 127, .17); font-size: 12.5px; line-height: 1.32; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-msgs-quote b { display: block; font-size: 12px; color: var(--vp-accent, #f91880); }
        .vp-msgs-rest { white-space: pre-wrap; }
        .vp-msgs-reply, .vp-msgs-pinbar { display: flex; align-items: center; gap: 10px; padding: 7px 12px; border-left: 3px solid var(--vp-accent, #f91880); margin: 0 12px; background: rgba(127, 127, 127, .12); border-radius: 4px 12px 12px 4px; color: var(--text-primary, #fff); }
        .vp-msgs-pinbar { margin: 4px 12px 0; cursor: pointer; }
        .vp-msgs-reply[hidden], .vp-msgs-pinbar[hidden], .vp-msgs-sel[hidden], .vp-msgs-fwd[hidden] { display: none; }
        .vp-msgs-reply svg, .vp-msgs-pinbar > svg { flex: none; color: var(--vp-accent, #f91880); }
        .vp-msgs-reply-t, .vp-msgs-pin-t { flex: 1; min-width: 0; display: flex; flex-direction: column; font-size: 13px; line-height: 1.3; }
        .vp-msgs-reply-t b, .vp-msgs-pin-t b { font-size: 12.5px; color: var(--vp-accent, #f91880); }
        .vp-msgs-reply-t span, .vp-msgs-pin-t span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: .85; }
        .vp-msgs-sel { position: absolute; left: 0; right: 0; top: 0; bottom: 0; z-index: 3; display: flex; align-items: center; gap: 6px; padding: 0 10px; background: var(--block-bg); border-radius: inherit; }
        .vp-msgs-sel b { font-size: 15px; margin-left: 4px; }
        .vp-msgs-sel-gap { flex: 1; }
        .vp-msgs-sel button:not(.vp-msgs-ib) { display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: 16px; padding: 8px 12px; background: rgba(127, 127, 127, .16); color: inherit; font: inherit; font-size: 13px; cursor: pointer; }
        .vp-msgs-sel button.vp-danger { color: #ff5a5f; }
        .vp-msgs-sel button:not(.vp-msgs-ib):hover { background: rgba(127, 127, 127, .28); }
        .vp-selecting .vp-msgs-b { cursor: pointer; }
        .vp-selecting .vp-msgs-feed { user-select: none; -webkit-user-select: none; touch-action: none; }
        .vp-msgs-b.vp-sel { outline: 2px solid var(--vp-accent, #f91880); outline-offset: 2px; }
        .vp-msgs-b.vp-gone { opacity: .35; }
        .vp-msgs-b.vp-flash { animation: vpMsgFlash 1.4s ease; }
        @keyframes vpMsgFlash { 0%, 40% { box-shadow: 0 0 0 3px var(--vp-accent, #f91880); } 100% { box-shadow: 0 0 0 3px transparent; } }
        .vp-msgs-fwd { position: absolute; left: 0; right: 0; top: 0; bottom: 0; z-index: 6; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, .5); border-radius: inherit; }
        .vp-msgs-fwd-card { width: min(380px, calc(100% - 28px)); max-height: 70%; display: flex; flex-direction: column; border-radius: 20px; background: var(--block-bg); box-shadow: 0 16px 48px rgba(0, 0, 0, .55), 0 0 0 1px var(--border-color, rgba(255, 255, 255, .1)); overflow: hidden; }
        .vp-msgs-fwd-h { display: flex; align-items: center; justify-content: space-between; padding: 12px 12px 8px 18px; font-size: 16px; }
        .vp-msgs-fwd-l { overflow-y: auto; padding: 0 8px 10px; }
        .vp-msgs-fwd-r { display: flex; align-items: center; gap: 12px; width: 100%; border: 0; background: transparent; color: inherit; font: inherit; font-size: 14.5px; font-weight: 600; text-align: left; padding: 7px 10px; border-radius: 14px; cursor: pointer; }
        .vp-msgs-fwd-r:hover { background: rgba(127, 127, 127, .16); }
        .vp-msgs-flash { position: absolute; left: 50%; bottom: 84px; z-index: 7; transform: translateX(-50%); padding: 8px 16px; border-radius: 14px; background: rgba(20, 20, 20, .94); color: #fff; font-size: 13px; pointer-events: none; animation: vpMsgFlashNote 2.4s ease both; }
        @keyframes vpMsgFlashNote { 0% { opacity: 0; transform: translate(-50%, 8px); } 12%, 80% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; } }
        `);
        const msgSeen = () => GM_getValue(acctKey('msgSeen'), {});
        const seenKey = t => (t.sup ? 'sup:' : '') + t.uid;
        const readUpTo = (uid, sup, who) => { const r = msgNet.reads && msgNet.reads.get(uid); return r ? r[(who || 'me') + (sup ? '1' : '0')] || 0 : 0; };
        const seenAt = (seen, uid, sup) => Math.max(seen[(sup ? 'sup:' : '') + uid] || 0, readUpTo(uid, sup));
        const lastInTs = list => list.reduce((a, m) => m.dir === 'in' && m.ts > a ? m.ts : a, 0);
        function msgMarkSeen(t) { const s = msgSeen(), list = msgThread(t); s[seenKey(t)] = Math.max(s[seenKey(t)] || 0, lastInTs(list)); GM_setValue(acctKey('msgSeen'), s); }
        const msgTime = ts => { const d = new Date(ts * 1000), t = d.toTimeString().slice(0, 5); return d.toDateString() === new Date().toDateString() ? t : `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')} ${t}`; };
        function msgFillDialogs() {
            const me = msgNet.me;
            if (me) for (const [uid, list] of msgNet.conv) {
                const k = msgNet.keys.get(uid);
                if (!k) continue;
                if (list.some(m => !m.sup) && !msgPeople.has(k.login) && uid !== OWNER_ID)
                    msgPeople.set(k.login, { id: 'u:' + k.login, login: k.login, ava: '👤', name: k.login, last: '', time: '', unread: 0, msgs: [] });
                if (msgIsSupport() && list.some(m => m.sup) && !MSG_DIALOGS.some(d => d.supUid === uid))
                    MSG_DIALOGS.push({ id: 'sup:' + uid, supUid: uid, ava: '🛟', name: '🛟 ' + k.login, login: '', last: '', time: '', unread: 0, msgs: [] });
            }
            if (msgIsSupport()) MSG_DIALOGS = MSG_DIALOGS.filter(d => !d.support);
            for (const d of msgPeople.values()) if (!MSG_DIALOGS.includes(d)) MSG_DIALOGS.push(d);
            const seen = msgSeen();
            for (const d of MSG_DIALOGS) {
                const t = msgTarget(d), list = msgThread(t);
                if (!list.length) continue;
                const last = list[list.length - 1];
                d.last = (last.dir === 'out' ? 'Ты: ' : '') + msgPreview(last);
                d.lastTs = last.at || last.ts;
                d.time = msgTime(last.at || last.ts);
                d.unread = list.filter(m => m.dir === 'in' && m.ts > seenAt(seen, t.uid, t.sup)).length;
                d.tick = last.dir === 'out' ? (readUpTo(t.uid, t.sup, 'them') >= last.ts ? 2 : 1) : 0;
                const lim = (last.imgs && last.imgs[0]) || last.img;
                d.lastImg = lim ? msgImgUrl(lim) : '';
                if (!t.sup && msgIsBlocked(t.uid)) d.last = 'Заблокирован(а)';
                else if (!t.sup && msgBlockedMe(t.uid)) d.last = 'Тебя заблокировали';
            }
        }
        function msgUnread() {
            const seen = msgSeen();
            let n = 0;
            for (const [uid, list] of msgNet.conv) for (const m of list) if (m.dir === 'in' && m.ts > seenAt(seen, uid, m.sup)) n++;
            return n;
        }
        function msgBadge() {
            const n = msgUnread(), txt = n > 99 ? '99+' : String(n);
            const site = document.querySelector('a[href="/notifications"] .' + SELECTORS.navIcon + ' > span');
            const cls = (site ? site.className.split(/\s+/).filter(c => c && !c.startsWith('vp-')).join(' ') + ' ' : '') + 'vp-msg-badge';
            document.querySelectorAll('nav a[href="#"] .' + SELECTORS.navIcon).forEach(ic => {
                let b = ic.querySelector(':scope > .vp-msg-badge');
                if (!n) { if (b) b.remove(); return; }
                if (!b) { b = document.createElement('span'); ic.appendChild(b); }
                if (b.className !== cls) b.className = cls;
                if (b.textContent !== txt) b.textContent = txt;
            });
        }
        onDom(function msgBadgeKeep() { if (msgNet.me) msgBadge(); });
        let msgBase = null, msgToastEl = null;
        function msgOpenFrom(m) {
            if (!messagesOverlay) messagesOverlay = buildMessagesOverlay();
            if (!messagesOverlay.classList.contains('vp-open')) messagesOverlay.open();
            const k = msgNet.keys.get(m.uid);
            const id = m.sup ? (msgIsSupport() ? 'sup:' + m.uid : 'support') : 'u:' + (k ? k.login : '');
            setTimeout(() => messagesOverlay.openDialog && messagesOverlay.openDialog(id), 60);
        }
        function msgOpenLogin(login) {
            if (!messagesOverlay) messagesOverlay = buildMessagesOverlay();
            if (!messagesOverlay.classList.contains('vp-open')) messagesOverlay.open();
            setTimeout(() => messagesOverlay.openDialog && messagesOverlay.openDialog('u:' + login), 60);
        }
        onDom(function profileWriteBtn() {
            const m = location.pathname.match(/^\/@([^/]+)\/?$/), old = document.querySelector('.vp-write-btn');
            const login = m && verifiedNames().find(n => n.toLowerCase() === decodeURIComponent(m[1]).toLowerCase());
            const ok = login && myUsername && login.toLowerCase() !== myUsername.toLowerCase() && isApprovedId(msgMyId());
            if (!ok) { if (old) old.remove(); return; }
            if (old && old.dataset.login === login && old.isConnected) return;
            if (old) old.remove();
            const follow = [...document.querySelectorAll('button')].find(b => !b.closest('aside, nav, .vp-rail, .vp-msgs, .vp-gal, .vp-sw-stage') &&/^(вы подписаны|подписаться|подписан|отписаться|читаю)$/i.test(b.textContent.trim()));
            if (!follow) return;
            const b = document.createElement('button');
            b.type = 'button';
            b.className = follow.className + ' vp-write-btn';
            b.dataset.login = login;
            b.title = 'Написать в личку ИТД X';
            b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/></svg><span>Написать</span>';
            b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); msgOpenLogin(login); });
            follow.before(b);
        });
        addCss(`
        .vp-write-btn { display: inline-flex !important; align-items: center; justify-content: center; gap: 6px; }
        .vp-write-btn > svg { flex: none; }
        @media (max-width: ${PHONE_MAX}px) { .vp-write-btn > span { display: none; } }
        `);
