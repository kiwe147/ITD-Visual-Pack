        function copyText(text) {
            if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(() => true, () => fallback());
            return Promise.resolve(fallback());
            function fallback() {
                const ta = document.createElement('textarea');
                ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
                document.body.appendChild(ta); ta.select();
                let ok = false; try { ok = document.execCommand('copy'); } catch (e) { }
                ta.remove(); return ok;
            }
        }
        const callCss = () => { if (!document.getElementById('vp-call-css')) addCss(CALL_CSS).id = 'vp-call-css'; };
        const CALL_CSS = `
        .vp-call { position: fixed; inset: 0; z-index: 2147483600; display: flex; align-items: center; justify-content: center; padding: 16px;
            background: rgba(0, 0, 0, .9); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); animation: vpCallIn .25s ease; font-family: inherit; }
        .vp-call-card { width: min(300px, 100%); box-sizing: border-box; padding: 34px 22px 24px; border-radius: 22px; background: #2b2d31; color: #f2f3f5; text-align: center;
            box-shadow: 0 24px 70px rgba(0, 0, 0, .6), inset 0 0 0 1px rgba(255, 255, 255, .06); }
        .vp-call-ava { position: relative; width: 132px; height: 132px; margin: 0 auto 22px; border-radius: 50%; background: #fff; display: grid; place-items: center; }
        .vp-call-ava::before, .vp-call-ava::after { content: ""; position: absolute; inset: -6px; border-radius: 50%; border: 3px solid rgba(255, 255, 255, .5); animation: vpCallRing 1.6s ease-out infinite; }
        .vp-call-ava::after { animation-delay: .8s; }
        .vp-call.vp-talk .vp-call-ava::before, .vp-call.vp-talk .vp-call-ava::after { animation: none; opacity: 0; }
        .vp-call-ava img { position: relative; z-index: 1; width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; }
        .vp-call-name { font-size: 19px; font-weight: 800; letter-spacing: .02em; text-transform: uppercase; line-height: 1.2; }
        .vp-call-sub { margin-top: 6px; font-size: 15px; color: #b5bac1; min-height: 0; font-variant-numeric: tabular-nums; }
        .vp-call-btns { display: flex; gap: 14px; justify-content: center; margin-top: 26px; }
        .vp-call-btns button { flex: 1 1 0; max-width: 118px; height: 48px; border: 0; border-radius: 12px; color: #fff; font: 700 15px/1 inherit; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 7px; transition: filter .15s, transform .15s; }
        .vp-call-btns button:hover { filter: brightness(1.12); }
        .vp-call-btns button:active { transform: scale(.96); }
        .vp-call-btns svg { width: 18px; height: 18px; }
        .vp-call-no { background: #248046; }
        .vp-call-yes { background: #248046; }
        .vp-call.vp-talk .vp-call-btns { visibility: hidden; }
        .vp-call.vp-out { animation: vpCallOut .3s ease forwards; }
        @keyframes vpCallIn { from { opacity: 0; } }
        @keyframes vpCallOut { to { opacity: 0; } }
        @keyframes vpCallRing { from { transform: scale(1); opacity: .8; } to { transform: scale(1.35); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .vp-call-ava::before, .vp-call-ava::after { animation: none; opacity: .4; } }
        .vp-call-real .vp-call-card { position: relative; }
        .vp-call-min { position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 50%; background: rgba(255, 255, 255, .08);
            color: #b5bac1; cursor: pointer; display: grid; place-items: center; }
        .vp-call-min:hover { background: rgba(255, 255, 255, .16); color: #fff; }
        .vp-call-emoji { position: relative; z-index: 1; font-size: 64px; line-height: 1; }
        .vp-call-real .vp-call-btns button span { white-space: nowrap; }
        .vp-call-end { background: #da373c; }
        .vp-call-end svg { transform: rotate(135deg); }
        .vp-call-mute { background: #4e5058; }
        .vp-call-mute.vp-on { background: #f2f3f5; color: #111; }
        .vp-call-note { margin-top: 16px; font-size: 11.5px; line-height: 1.35; color: #80848e; }
        .vp-call-audio { display: none; }
        .vp-call-tag { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 18px; font-size: 12.5px; font-weight: 600; color: #23a55a; }
        .vp-call-mini .vp-call-tag { display: none; }
        .vp-call-lv { display: none; gap: 14px; justify-content: center; margin-top: 12px; font-size: 12px; color: #b5bac1; }
        .vp-call-real.vp-live:not(.vp-call-mini) .vp-call-lv { display: flex; }
        .vp-call-lv span { display: flex; align-items: center; gap: 6px; min-width: 0; }
        .vp-call-lv em { font-style: normal; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-call-lv b { display: block; width: 44px; height: 6px; border-radius: 3px; background: rgba(255, 255, 255, .12); overflow: hidden; }
        .vp-call-lv i { display: block; height: 100%; background: #23a55a; transform-origin: 0 50%; transform: scaleX(.04); transition: transform .1s linear; }
        .vp-call-info { margin-top: 8px; padding: 4px 8px; border: 0; background: none; color: #80848e; font: inherit; font-size: 11.5px; text-decoration: underline; cursor: pointer; }
        .vp-call-info:hover { color: #b5bac1; }
        .vp-call-mini .vp-call-info { display: none; }
        .vp-call-real.vp-live .vp-call-ava::before, .vp-call-real.vp-live .vp-call-ava::after { animation: none; opacity: 0; }
        .vp-call.vp-call-mini { inset: auto 16px 16px auto; padding: 0; background: none; backdrop-filter: none; -webkit-backdrop-filter: none; }
        .vp-call-mini .vp-call-card { width: auto; max-width: calc(100vw - 32px); padding: 8px 8px 8px 16px; display: flex; align-items: center; gap: 12px; text-align: left; cursor: pointer; }
        .vp-call-mini .vp-call-ava, .vp-call-mini .vp-call-note, .vp-call-mini .vp-call-min { display: none; }
        .vp-call-mini .vp-call-name { font-size: 14px; text-transform: none; letter-spacing: 0; }
        .vp-call-mini .vp-call-sub { margin: 0; font-size: 13px; }
        .vp-call-mini .vp-call-btns { margin: 0; gap: 6px; }
        .vp-call-mini .vp-call-btns button { width: 40px; height: 40px; flex: 0 0 auto; padding: 0; border-radius: 50%; }
        .vp-call-mini .vp-call-btns button span { display: none; }`;
        function callTone(kind) {
            let ac, t = 0;
            try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return () => { }; }
            if (ac.state === 'suspended') ac.resume().catch(() => { });
            const beep = (at, freqs, len, vol, rise, trill) => {
                const g = ac.createGain();
                g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + rise); g.gain.setValueAtTime(vol, at + len - .04); g.gain.linearRampToValueAtTime(0, at + len);
                if (trill) { const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = trill; lg.gain.value = .5; lfo.connect(lg).connect(g.gain); lfo.start(at); lfo.stop(at + len + .03); }
                freqs.forEach(fr => { const o = ac.createOscillator(); o.frequency.value = fr; o.connect(g); o.start(at); o.stop(at + len + .03); });
                g.connect(ac.destination);
            };
            const stop = () => { clearInterval(t); t = 0; if (ac) { const c = ac; ac = null; c.close().catch(() => { }); } };
            const loop = (fn, ms) => { fn(); t = setInterval(() => ac && fn(), ms); };
            if (kind === 'ring') loop(() => { const t0 = ac.currentTime + .05; beep(t0, [440, 480], .42, .16, .02, 22); beep(t0 + .6, [440, 480], .42, .16, .02, 22); }, 3000);
            else if (kind === 'back') loop(() => beep(ac.currentTime + .05, [425], 1, .1, .02), 4000);
            else { const t0 = ac.currentTime + .05; for (let i = 0; i < 3; i++) beep(t0 + i * .5, [425], .32, .18, .015); setTimeout(stop, 1800); }
            return stop;
        }
        function fakeCall() {
            if (document.querySelector('.vp-call')) return;
            callCss();
            const phone = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + GLYPH.phone + '</svg>';
            const el = document.createElement('div');
            el.className = 'vp-call';
            el.innerHTML = `<div class="vp-call-card" role="dialog" aria-label="Входящий звонок"><div class="vp-call-ava"><img alt="" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAAAAAAbPrZOAAACyklEQVR42u3dQU8TQRjG8XmbnrjJx9RIwKCCgigGjV50EcJn9OTBcCAQx0sTw9Ju7c7sMO88/7ltMm32t8+zs9tNm1oMWmMWAAMGDBgwYMCAAQMGDBgwYMCAAQMGDBgwYMCAAQMGDBgwYMCAAQMGDBgwYMCAAQMGDBgwYMCAAQOuDGz3x+Dc/ftz9+sE2/DvlnrEuMHcEBuvtImdwxbEwGqrtImBTS5hMbCJgU0uYTGwiYFfuEo4w730qoBbvZc2sXP4pbNFK7nSqwNus9LOCp0MPnJ3HU6s9FDALVbaXaETwScOby2TKj0ccHuVdljoJPDhZDt1UWelJwx4p6sQ/MAbMx6BWF+lP/lYo/KB3/a2PzZ+WbIlAbdc6TOnhR4NPip2iaqj0rY04HYr/dVtoUeCX6/Zbq3StiLgViv93XGhR4H3etvv8+/VXk2VtpUBu6j0fNMXnBfZN5vuEMXB8XBy//XHQ5PXvV8IIbz6v2lpjn9jlnroT1PDvK160eryF9qqBu/2tt8Fb2OWlsaHxsGubzkygHeCGLgTA7v8xwS+ttR4wAngKJewGDiKgYt6l33qOVCr9HZZ8OMX+q4ouIIT2NQqXXTRimLgKJewGDiKgaNcwmLgEgH/qAhcpNA3apX+VQ+4zIp1XQ240Ao95dPQeUahiwsWlyXAgAEDThzf1MA/1cBfOIcBA/YMNhIG3BT4sxr4DZVuG2xi4FO1hE/EwCZwDts479hHpPNHB9+Ni3fLLfhJCCF0v4+HShC72eKILBoZn+325lz+WUx9vqZQVTw9v3qa8c2iA3DWxSpypwUYMGDAgAEDBgwYMOD0Ma9yrzb7CGckDBgwYMCAAQMGDBgwYMCAAQMGLDUskjBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwBOPv+gU+qgZ1lnIAAAAAElFTkSuQmCC"></div>
                <div class="vp-call-name">Илья Новки</div><div class="vp-call-sub"></div>
                <div class="vp-call-btns"><button type="button" class="vp-call-no">${phone}Принять</button><button type="button" class="vp-call-yes">${phone}Принять</button></div></div>`;
            document.body.appendChild(el);
            const sub = el.querySelector('.vp-call-sub'), timers = [];
            const stopRing = callTone('ring'), hangup = () => callTone('hang');
            const later = (fn, ms) => timers.push(setTimeout(fn, ms));
            const close = () => { stopRing(); timers.forEach(clearTimeout); el.classList.add('vp-out'); setTimeout(() => el.remove(), 320); };
            const answer = () => {
                if (el.classList.contains('vp-talk')) return;
                stopRing(); timers.forEach(clearTimeout); timers.length = 0;
                el.classList.add('vp-talk');
                sub.textContent = 'Соединение…';
                later(() => {
                    let sec = 0;
                    sub.textContent = '00:00';
                    const tick = setInterval(() => { sec++; sub.textContent = '00:0' + sec; }, 1000);
                    later(() => { clearInterval(tick); sub.textContent = 'Звонок сброшен: сервер ИТД упал'; hangup(); later(close, 1700); }, 3200);
                }, 1300);
            };
            el.querySelectorAll('.vp-call-btns button').forEach(b => b.addEventListener('click', answer));
            later(() => { stopRing(); el.classList.add('vp-talk'); sub.textContent = 'Пропущенный звонок'; hangup(); later(close, 1700); }, 30000);
        }
        const CALL_ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: 'stun:stun.cloudflare.com:3478' }];
        const CALL_RING_S = 60;
        const CALL_MIC = '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>';
        const callNet = { cur: null, done: null, lastSync: 0, title: null };
        function callDone() { if (!callNet.done) callNet.done = new Set(GM_getValue(acctKey('callDone'), [])); return callNet.done; }
        function callMarkDone(key) { const d = callDone(); d.add(key); GM_setValue(acctKey('callDone'), [...d].slice(-60)); }
        function callSig(uid, type, id, data) { return msgSend(uid, '', false, null, cat(new Uint8Array([4, type]), be32(id), data || new Uint8Array(0))); }
        function sdpSlim(sdp, drop) {
            const lines = sdp.split(/\r?\n/).filter(Boolean), opus = new Set(), bundle = lines.some(l => l.startsWith('a=group:BUNDLE'));
            lines.forEach(l => { const m = l.match(/^a=rtpmap:(\d+) opus\//i); if (m) opus.add(m[1]); });
            const out = [];
            let sec = -1;
            for (let l of lines) {
                if (l.startsWith('m=')) sec++;
                if ((/^a=extmap:/.test(l) && !/sdes:mid/.test(l)) || /^a=(rtcp-fb|extmap-allow-mixed)/.test(l)) continue;
                if (/^a=candidate:/.test(l) && (/^a=candidate:\S+ \d+ tcp /i.test(l) || (bundle && sec > 0) || (drop && drop(l)))) continue;
                const pt = l.match(/^a=(?:rtpmap|fmtp):(\d+)/);
                if (opus.size && pt && !opus.has(pt[1])) continue;
                if (opus.size && /^m=audio /.test(l)) l = l.split(' ').filter((x, i) => i < 3 || opus.has(x)).join(' ');
                out.push(l);
            }
            return out.join('\r\n') + '\r\n';
        }
        async function callPack(sdp, drop) {
            const raw = te.encode(sdpSlim(sdp, drop));
            try {
                const z = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
                if (z.length < raw.length) return cat(new Uint8Array([1]), z);
            } catch (e) { }
            return cat(new Uint8Array([0]), raw);
        }
        async function callPackFit(sdp) {
            const drops = [null, l => /^a=candidate:.* typ host/.test(l) && /:[0-9a-f]*:/i.test(l.split(' ')[4]), l => /^a=candidate:.* typ (host|relay)/.test(l)];
            let out = null;
            const max = GM_getValue('msgMode', 'c') === 'b' ? 640 : 1400;
            for (const d of drops) { out = await callPack(sdp, d); if (out.length <= max) break; }
            return out;
        }
        async function callUnpack(b) {
            const body = b.slice(1);
            return td.decode(b[0] === 1 ? new Uint8Array(await new Response(new Blob([body]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()) : body);
        }
        function callGather(pc) {
            if (pc.iceGatheringState === 'complete') return Promise.resolve();
            return new Promise(ok => {
                const t = setTimeout(ok, 2500);
                pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); ok(); } });
            });
        }
        async function callMedia(c) {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Браузер не даёт микрофон');
            const hint = setTimeout(() => c.state !== 'end' && callSub(c, 'Разреши микрофон — значок в адресной строке'), 6000);
            try { c.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
            catch (e) {
                clearTimeout(hint);
                logErr('звонок: микрофон', e);
                throw new Error(e && e.name === 'NotAllowedError' ? 'Нет доступа к микрофону — разреши его для итд.com'
                    : e && e.name === 'NotFoundError' ? 'Микрофон не найден' : 'Микрофон не включился');
            }
            clearTimeout(hint);
            if (c.state === 'end') { c.stream.getTracks().forEach(t => t.stop()); return false; }
            callMeter(c, 'me', c.stream);
            return true;
        }
        function callAudioPrep(c) {
            const a = document.createElement('audio');
            a.className = 'vp-call-audio';
            a.autoplay = true;
            a.setAttribute('playsinline', '');
            document.body.appendChild(a);
            c.audio = a;
            try { c.ac = new (window.AudioContext || window.webkitAudioContext)(); if (c.ac.state === 'suspended') c.ac.resume().catch(() => { }); } catch (e) { c.ac = null; }
        }
        function callPlay(c) {
            const a = c.audio;
            if (!a || c.state === 'end') return;
            if (c.ac && c.ac.state === 'suspended') c.ac.resume().catch(() => { });
            if (!a.srcObject) return;
            const p = a.play();
            if (p) p.then(() => { if (c.blocked) { c.blocked = false; callPaint(c); } }, e => {
                if (!e || e.name !== 'NotAllowedError' || c.blocked) return;
                c.blocked = true;
                logErr('звонок: браузер не дал включить звук', e);
                callPaint(c);
            });
        }
        function callMeter(c, who, stream) {
            if (!c.ac || (c.meters && c.meters[who])) return;
            try {
                const an = c.ac.createAnalyser();
                an.fftSize = 256;
                c.ac.createMediaStreamSource(stream).connect(an);
                (c.meters || (c.meters = {}))[who] = an;
            } catch (e) { logErr('звонок: индикатор', e); }
        }
        function callLevels(c) {
            const lv = c.el && c.el.querySelector('.vp-call-lv');
            if (!lv || !c.meters) return;
            const buf = new Uint8Array(128);
            for (const who of ['me', 'them']) {
                const an = c.meters[who], bar = lv.querySelector(`[data-who="${who}"] i`);
                if (!an || !bar) continue;
                an.getByteTimeDomainData(buf);
                let sum = 0;
                for (const v of buf) sum += (v - 128) * (v - 128);
                const lvl = Math.min(1, Math.sqrt(sum / buf.length) / 40);
                bar.style.transform = `scaleX(${Math.max(.04, lvl).toFixed(2)})`;
                if (lvl > .06) c.heard = Object.assign(c.heard || {}, { [who]: true });
            }
        }
        async function callInfo(c) {
            const out = [`ИТД X ${GM_info.script.version} · ${navigator.userAgent}`, `звонок: ${c.dir === 'out' ? 'исходящий' : 'входящий'}, ${c.state}`];
            try {
                const pc = c.pc;
                if (pc) {
                    out.push(`соединение: ${pc.connectionState}, ice: ${pc.iceConnectionState}, сбор: ${pc.iceGatheringState}`);
                    const cand = d => d ? (d.sdp.match(/^a=candidate:.*$/gm) || []).map(l => (l.match(/typ (\w+)/) || [])[1]).join(',') : '—';
                    out.push(`кандидаты: наши ${cand(pc.localDescription)}; их ${cand(pc.remoteDescription)}`);
                    const st = await pc.getStats(), by = {};
                    st.forEach(r => { by[r.id] = r; });
                    st.forEach(r => {
                        if (r.type === 'candidate-pair' && (r.nominated || r.selected) && r.state === 'succeeded') {
                            const l = by[r.localCandidateId], rm = by[r.remoteCandidateId];
                            out.push(`путь: ${l && l.candidateType}/${l && l.protocol} → ${rm && rm.candidateType}`);
                        }
                        if (r.type === 'inbound-rtp' && r.kind === 'audio') out.push(`пришло: ${r.bytesReceived} байт, пакетов ${r.packetsReceived}, потеряно ${r.packetsLost}`);
                        if (r.type === 'outbound-rtp' && r.kind === 'audio') out.push(`ушло: ${r.bytesSent} байт`);
                    });
                }
            } catch (e) { out.push('статистика: ' + (e.message || e)); }
            const a = c.audio;
            out.push(`звук: ${a ? (a.paused ? 'на паузе' : 'играет') + ', дорожек ' + (c.remote ? c.remote.getAudioTracks().length : 0) : 'нет элемента'}${c.blocked ? ', заблокирован браузером' : ''}; микрофон: ${c.stream ? c.stream.getAudioTracks().map(t => t.label || 'без имени').join(', ') + (c.muted ? ' (выкл)' : '') : 'нет'}; слышно: ${JSON.stringify(c.heard || {})}`);
            out.push('журнал: ' + vpErrors.filter(x => /звон/.test(x)).slice(-6).join(' | '));
            return out.join('\n');
        }
        function callPeer(c) {
            const pc = new RTCPeerConnection({ iceServers: CALL_ICE });
            pc.ontrack = e => {
                if (!c.audio) callAudioPrep(c);
                c.remote = e.streams[0] || new MediaStream([e.track]);
                if (c.audio.srcObject !== c.remote) c.audio.srcObject = c.remote;
                callPlay(c);
                callMeter(c, 'them', c.remote);
            };
            pc.onconnectionstatechange = () => {
                const st = pc.connectionState;
                if (c.state === 'end') return;
                if (st === 'connected') { clearTimeout(c.lostT); callLive(c); }
                else if (st === 'failed') { callInfo(c).then(t => logErr('звонок: не соединились', new Error(t.split('\n').slice(2, 4).join('; ')))); callEnd(c, 'Не удалось соединиться напрямую — обычно мешает мобильный интернет. Попробуйте, чтобы хотя бы у одного был Wi-Fi', 0); }
                else if (st === 'disconnected' && c.state === 'talk') {
                    callSub(c, 'Связь прерывается…');
                    clearTimeout(c.lostT);
                    c.lostT = setTimeout(() => pc.connectionState !== 'connected' && callEnd(c, 'Связь потеряна', 0), 10000);
                }
            };
            return pc;
        }
        function callDc(c, dc) {
            c.dc = dc;
            dc.onmessage = e => {
                if (e.data === 'bye') callEnd(c, 'Собеседник положил трубку', null);
                else if (/^mute:[01]$/.test(e.data)) { c.peerMuted = e.data === 'mute:1'; callSub(c); }
            };
            dc.onopen = () => { if (c.muted) try { dc.send('mute:1'); } catch (e) { } };
        }
        function callWho(uid) {
            const k = msgNet.keys.get(uid), login = k ? k.login : '', p = login && msgPeople.get(login);
            return { name: (p && p.name) || login || 'ИТД X', ava: (p && p.ava) || '👤' };
        }
        function callTitle(text) {
            if (text && callNet.title === null) callNet.title = document.title;
            if (text) document.title = text;
            else if (callNet.title !== null) { document.title = callNet.title; callNet.title = null; }
        }
        const callBtn = (cls, label, glyph) => `<button type="button" class="${cls}">${svgIcon(glyph, 18)}<span>${label}</span></button>`;
        function callUi(c) {
            callCss();
            const el = document.createElement('div');
            el.className = 'vp-call vp-call-real';
            el.innerHTML = `<div class="vp-call-card" role="dialog" aria-label="Звонок"><button type="button" class="vp-call-min" title="Свернуть">${svgIcon('<path d="M6 9l6 6 6-6"/>', 18)}</button>
                <div class="vp-call-ava"></div><div class="vp-call-name"></div><div class="vp-call-sub"></div>
                <div class="vp-call-lv"><span data-who="me">ты<b><i></i></b></span><span data-who="them"></span></div><div class="vp-call-btns"></div>
                <div class="vp-call-tag">${svgIcon('<path d="M4 20v-3M9 20v-7M14 20v-11M19 20V4"/>', 14)}Ловит даже на парковке</div>
                <div class="vp-call-note">Звук идёт напрямую между вами, мимо серверов ИТД. Собеседнику виден твой IP-адрес</div>
                <button type="button" class="vp-call-info">Скопировать сведения о звонке</button></div>`;
            el.querySelector('[data-who="them"]').innerHTML = '<em></em><b><i></i></b>';
            el.querySelector('[data-who="them"] em').textContent = c.name;
            el.querySelector('.vp-call-info').onclick = async e => {
                const b = e.currentTarget;
                try { await navigator.clipboard.writeText(await callInfo(c)); b.textContent = 'Скопировано — отправь разработчику'; }
                catch (er) { b.textContent = 'Не скопировалось'; }
            };
            const ava = el.querySelector('.vp-call-ava');
            if (isUrl(c.ava)) { const im = document.createElement('img'); im.src = c.ava; im.alt = ''; ava.appendChild(im); }
            else { const sp = document.createElement('span'); sp.className = 'vp-call-emoji'; sp.textContent = c.ava; ava.appendChild(sp); }
            el.querySelector('.vp-call-name').textContent = c.name;
            el.querySelector('.vp-call-min').onclick = e => { e.stopPropagation(); el.classList.add('vp-call-mini'); };
            el.querySelector('.vp-call-card').addEventListener('click', e => { if (el.classList.contains('vp-call-mini') && !e.target.closest('button')) el.classList.remove('vp-call-mini'); });
            document.body.appendChild(el);
            c.el = el;
            callPaint(c);
        }
        function callPaint(c) {
            const el = c.el;
            if (!el) return;
            const ring = c.dir === 'in' && c.state === 'ringing', key = c.state + (c.muted ? 1 : 0) + (c.missed ? 1 : 0) + (c.blocked ? 1 : 0);
            el.classList.toggle('vp-live', c.state === 'talk' || c.state === 'end');
            if (el.dataset.k !== key) {
                el.dataset.k = key;
                const btns = el.querySelector('.vp-call-btns');
                btns.innerHTML = c.state === 'end' ? (c.missed ? callBtn('vp-call-mute vp-call-close', 'Закрыть', GLYPH.close) + callBtn('vp-call-yes vp-call-again', 'Перезвонить', GLYPH.phone) : '')
                    : ring ? callBtn('vp-call-end', 'Отклонить', GLYPH.phone) + callBtn('vp-call-yes', 'Принять', GLYPH.phone)
                        : callBtn('vp-call-mute' + (c.muted ? ' vp-on' : ''), c.muted ? 'Включить' : 'Микрофон', CALL_MIC + (c.muted ? '<path d="M4 4l16 16"/>' : ''))
                        + callBtn('vp-call-end', 'Завершить', GLYPH.phone)
                        + (c.blocked ? callBtn('vp-call-yes vp-call-sound', 'Включить звук', '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/>') : '');
                const b = cls => btns.querySelector('.' + cls);
                if (b('vp-call-sound')) b('vp-call-sound').onclick = () => callPlay(c);
                if (b('vp-call-close')) b('vp-call-close').onclick = () => callClose(c, 0);
                else if (b('vp-call-again')) b('vp-call-again').onclick = () => { callClose(c, 0); callStart(c.uid, c.name, c.ava); };
                if (c.state !== 'end') {
                    if (b('vp-call-yes')) b('vp-call-yes').onclick = () => callAccept(c);
                    if (b('vp-call-mute')) b('vp-call-mute').onclick = () => callMute(c);
                    if (b('vp-call-end')) b('vp-call-end').onclick = () => ring ? callEnd(c, 'Звонок отклонён', 1)
                        : callEnd(c, c.state === 'talk' ? 'Звонок завершён' : 'Звонок отменён', c.offered || c.dir === 'in' ? 0 : null);
                }
            }
            callSub(c);
        }
        function callSub(c, text) {
            if (text !== undefined) c.subText = text;
            const sub = c.el && c.el.querySelector('.vp-call-sub');
            if (sub) sub.textContent = (c.subText || '') + (c.state === 'talk' && c.peerMuted ? ' · у собеседника выключен микрофон' : c.state === 'talk' && c.warn ? ' · ' + c.warn : '');
        }
        function callClose(c, wait) {
            const el = c.el;
            if (!el || el.dataset.closing) return;
            el.dataset.closing = '1';
            setTimeout(() => { el.classList.add('vp-out'); setTimeout(() => el.remove(), 320); }, wait);
        }
        function callLive(c) {
            if (c.state === 'talk' || c.state === 'end') return;
            c.state = 'talk';
            c.stops.splice(0).forEach(f => f());
            clearTimeout(c.connT);
            const t0 = c.t0 = Date.now();
            try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(w => { if (c.state === 'end') w.release().catch(() => { }); else c.wake = w; }, () => { }); } catch (e) { }
            callSub(c, '00:00');
            c.tick = setInterval(() => callSub(c, callMmss(Math.floor((Date.now() - t0) / 1000))), 1000);
            c.lvT = setInterval(() => callLevels(c), 120);
            callPlay(c);
            c.timers.push(setTimeout(async () => {
                if (c.state !== 'talk' || !c.pc) return;
                let got = 0;
                try { (await c.pc.getStats()).forEach(r => { if (r.type === 'inbound-rtp' && r.kind === 'audio') got += r.bytesReceived || 0; }); } catch (e) { }
                if (got) return;
                c.warn = 'звук от собеседника не приходит';
                callSub(c);
                callInfo(c).then(t => logErr('звонок: звук не приходит', new Error(t.split('\n').slice(2, 5).join('; '))));
            }, 6000));
            callPaint(c);
        }
        function callMute(c) {
            c.muted = !c.muted;
            if (c.stream) c.stream.getAudioTracks().forEach(t => { t.enabled = !c.muted; });
            if (c.dc && c.dc.readyState === 'open') try { c.dc.send(c.muted ? 'mute:1' : 'mute:0'); } catch (e) { }
            callPaint(c);
        }
        function callEnd(c, text, reason) {
            if (c.state === 'end') return;
            const was = c.state;
            c.state = 'end';
            c.missed = c.dir === 'in' && was === 'ringing' && reason === null;
            if (reason !== null && c.dc && c.dc.readyState === 'open') try { c.dc.send('bye'); } catch (e) { }
            const dur = was === 'talk' && c.t0 ? Math.max(1, Math.round((Date.now() - c.t0) / 1000)) : 0;
            if (reason !== null) callSig(c.uid, 3, c.id, dur ? cat(new Uint8Array([reason]), be32(dur)) : new Uint8Array([reason])).catch(e => logErr('звонок: отбой', e));
            c.stops.splice(0).forEach(f => f());
            c.timers.forEach(clearTimeout);
            clearInterval(c.tick); clearInterval(c.lvT); clearTimeout(c.lostT); clearTimeout(c.connT);
            if (c.wake) { c.wake.release().catch(() => { }); c.wake = null; }
            if (c.pc) try { c.pc.close(); } catch (e) { }
            if (c.stream) c.stream.getTracks().forEach(t => t.stop());
            if (c.audio) { c.audio.srcObject = null; c.audio.remove(); }
            if (c.ac) { c.ac.close().catch(() => { }); c.ac = null; }
            callMarkDone(c.uid + '|' + c.id);
            if (callNet.cur === c) callNet.cur = null;
            if (!(c.dir === 'in' && was === 'ringing')) callTone('hang');
            if (c.missed) callTitle('📞 Пропущенный звонок'); else callTitle(null);
            callSub(c, text);
            callPaint(c);
            if (c.el) c.el.classList.remove('vp-call-mini');
            if (!c.missed) callClose(c, 1800);
            else if (c.el) c.el.addEventListener('click', () => callTitle(null), { once: true });
        }
        async function callStart(uid, name, ava) {
            if (callNet.cur) { if (callNet.cur.el) callNet.cur.el.classList.remove('vp-call-mini'); return; }
            const c = { uid, dir: 'out', id: crypto.getRandomValues(new Uint32Array(1))[0], name, ava, state: 'calling', stops: [], timers: [] };
            callNet.cur = c;
            callAudioPrep(c);
            callUi(c);
            callSub(c, 'Включаю микрофон…');
            try {
                if (!(await callMedia(c))) return;
                c.pc = callPeer(c);
                callDc(c, c.pc.createDataChannel('itdx'));
                c.stream.getTracks().forEach(t => c.pc.addTrack(t, c.stream));
                await c.pc.setLocalDescription(await c.pc.createOffer());
                callSub(c, 'Соединяю…');
                await callGather(c.pc);
                if (c.state === 'end') return;
                const offer = await callPackFit(c.pc.localDescription.sdp);
                c.offered = true;
                await callSig(uid, 1, c.id, offer);
                if (c.state === 'end') return;
                callSub(c, 'Вызываю…');
                c.stops.push(callTone('back'));
                c.timers.push(setTimeout(() => callEnd(c, 'Не отвечает', 3), (CALL_RING_S + 15) * 1000));
                callNet.lastSync = 0;
            } catch (e) { logErr('звонок', e); callEnd(c, e.message || 'Не вышло позвонить', c.offered ? 0 : null); }
        }
        async function callAnswered(c, data) {
            if (c.answering) return;
            c.answering = true;
            c.stops.splice(0).forEach(f => f());
            c.timers.forEach(clearTimeout);
            c.state = 'connecting';
            callPaint(c);
            callSub(c, 'Соединяю…');
            try { await c.pc.setRemoteDescription({ type: 'answer', sdp: await callUnpack(data) }); }
            catch (e) { logErr('звонок: ответ', e); return callEnd(c, 'Не удалось соединиться', 0); }
            c.connT = setTimeout(() => c.state !== 'talk' && callEnd(c, 'Не удалось соединиться: мешает сеть', 0), 25000);
        }
        function callIncoming(s) {
            const w = callWho(s.uid);
            const c = { uid: s.uid, dir: 'in', id: s.id, offer: s.data, name: w.name, ava: w.ava, state: 'ringing', stops: [callTone('ring')], timers: [] };
            callNet.cur = c;
            callUi(c);
            callSub(c, 'Звонит тебе…');
            callTitle('📞 ' + c.name + ' звонит');
            const left = Math.max(5, CALL_RING_S + 15 - (srvNow() / 1000 - s.ts));
            c.timers.push(setTimeout(() => callEnd(c, 'Пропущенный звонок', null), left * 1000));
        }
        async function callAccept(c) {
            if (c.state !== 'ringing') return;
            callAudioPrep(c);
            c.stops.splice(0).forEach(f => f());
            c.timers.forEach(clearTimeout);
            c.state = 'connecting';
            callPaint(c);
            callSub(c, 'Включаю микрофон…');
            callTitle(null);
            try {
                if (!(await callMedia(c))) return;
                c.pc = callPeer(c);
                c.pc.ondatachannel = e => callDc(c, e.channel);
                c.stream.getTracks().forEach(t => c.pc.addTrack(t, c.stream));
                await c.pc.setRemoteDescription({ type: 'offer', sdp: await callUnpack(c.offer) });
                await c.pc.setLocalDescription(await c.pc.createAnswer());
                callSub(c, 'Соединяю…');
                await callGather(c.pc);
                if (c.state === 'end') return;
                await callSig(c.uid, 2, c.id, await callPackFit(c.pc.localDescription.sdp));
                if (c.state !== 'talk') c.connT = setTimeout(() => c.state !== 'talk' && callEnd(c, 'Не удалось соединиться: мешает сеть', 0), 30000);
            } catch (e) { logErr('звонок: принять', e); callEnd(c, e.message || 'Не вышло ответить', 0); }
        }
        const callMmss = sec => String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
        function callHistory(uid) {
            const by = new Map(), live = callNet.cur;
            for (const s of msgNet.sigs || []) {
                if (s.uid !== uid) continue;
                const e = by.get(s.id) || { id: s.id };
                if (s.type === 1) { e.dir = s.dir; e.ts = s.ts; }
                else if (s.type === 2) e.ok = s.ts;
                else if (s.type === 3 && (!e.end || s.data.length > e.end.data.length)) e.end = s;
                by.set(s.id, e);
            }
            const now = srvNow() / 1000;
            return [...by.values()].filter(e => e.ts && !(live && live.id === e.id) && (e.end || now - e.ts > CALL_RING_S + 20)).sort((a, b) => a.ts - b.ts);
        }
        function callChip(e) {
            const r = e.end ? e.end.data[0] || 0 : -1, dur = e.end && e.end.data.length >= 5 ? u32(e.end.data, 1) : 0, out = e.dir === 'out';
            if (e.ok) return { text: (out ? 'Исходящий звонок' : 'Входящий звонок') + (dur ? ' · ' + callMmss(dur) : ''), miss: false };
            if (!out) return r === 1 ? { text: 'Входящий звонок · отклонён', miss: false } : { text: 'Пропущенный звонок' + (r === 2 ? ' · было занято' : ''), miss: true };
            return { text: 'Исходящий звонок · ' + (r === 1 ? 'отклонён' : r === 2 ? 'занято' : r === 0 ? 'отменён' : 'не ответил'), miss: false };
        }
        function callCheck() {
            const sigs = msgNet.sigs || [], now = srvNow() / 1000, c = callNet.cur;
            const ended = new Map(sigs.filter(s => s.type === 3).map(s => [s.uid + '|' + s.id, s.data[0] || 0]));
            if (c && c.state !== 'end') {
                const key = c.uid + '|' + c.id;
                const ans = c.dir === 'out' && c.state === 'calling' && sigs.find(s => s.dir === 'in' && s.type === 2 && s.uid === c.uid && s.id === c.id);
                const endIn = sigs.find(s => s.dir === 'in' && s.type === 3 && s.uid === c.uid && s.id === c.id);
                if (endIn) {
                    const r = ended.get(key);
                    if (c.dir === 'in' && c.state === 'ringing') callEnd(c, 'Пропущенный звонок', null);
                    else callEnd(c, r === 1 ? 'Звонок отклонён' : r === 2 ? 'Занято: у собеседника другой звонок' : r === 3 ? 'Не отвечает'
                        : c.state === 'talk' ? 'Собеседник положил трубку' : c.dir === 'out' ? 'Звонок сброшен' : 'Звонок отменён', null);
                } else if (ans) callAnswered(c, ans.data);
            }
            for (const s of sigs) {
                if (s.dir !== 'in' || s.type !== 1) continue;
                const key = s.uid + '|' + s.id;
                if (callDone().has(key) || ended.has(key) || now - s.ts > CALL_RING_S + 10 || (callNet.cur && callNet.cur.id === s.id)) continue;
                callMarkDone(key);
                if (callNet.cur) { callSig(s.uid, 3, s.id, new Uint8Array([2])).catch(e => logErr('звонок: занято', e)); continue; }
                callIncoming(s);
            }
            if (messagesOverlay && messagesOverlay.refreshCalls) messagesOverlay.refreshCalls();
        }

