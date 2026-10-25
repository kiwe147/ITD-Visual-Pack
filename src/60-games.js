        const gamesList = rail.querySelector('.vp-games-list');
        const bestText = g => {
            const v = GM_getValue(acctKey(g.best), 0);
            if (!v) return 'не играл';
            return g.id === 'mines' ? `лучшее ${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` : `рекорд ${v}`;
        };
        function renderGamesMenu() {
            gamesList.textContent = '';
            for (const g of GAMES) {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'vp-game-row';
                b.innerHTML = `<span class="vp-game-ico">${svgIcon(g.icon, 18)}</span><span class="vp-game-name"></span><span class="vp-game-best"></span>`;
                b.querySelector('.vp-game-name').textContent = g.name;
                b.querySelector('.vp-game-best').textContent = bestText(g);
                b.addEventListener('click', () => openGames(g.id));
                gamesList.appendChild(b);
            }
        }
        const gw = { el: null, cur: null, id: GM_getValue('vp_game_last', 'snake') };
        const gamesCss = addCss(`
        .vp-games-list { display: flex; flex-direction: column; gap: 4px; }
        .vp-game-row { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border: 0; border-radius: 18px; cursor: pointer;
            background: none; color: var(--text-primary, #fff); font: inherit; font-size: 15px; font-weight: 600; text-align: left; transition: background-color .15s; }
        .vp-game-row:hover { background: var(--bg-hover, rgba(255, 255, 255, .08)); }
        .vp-game-ico { width: 34px; height: 34px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px;
            background: var(--bg-hover, rgba(255, 255, 255, .08)); color: var(--vp-accent); }
        .vp-game-name { flex: 1 1 auto; }
        .vp-game-best { font-size: 12px; font-weight: 500; color: var(--text-secondary); white-space: nowrap; }
        .vp-games { position: fixed; inset: 0; z-index: 2147483050; display: flex; align-items: center; justify-content: center; padding: 12px;
            background: rgba(0, 0, 0, .55); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); animation: vpGamesIn .18s ease-out; }
        @keyframes vpGamesIn { from { opacity: 0; } }
        .vp-games-win { display: flex; flex-direction: column; gap: 12px; width: min(760px, 100%); height: min(900px, 100%); max-height: 100%; padding: 16px; border-radius: 32px; box-sizing: border-box;
            background: var(--block-bg); color: var(--text-primary, #fff); border: 1px solid var(--border-color, rgba(255, 255, 255, .12));
            box-shadow: 0 24px 64px rgba(0, 0, 0, .5); overflow: auto; }
        .vp-games-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        @media (max-width: 520px) { .vp-games-win { padding: 12px; border-radius: 26px; } .vp-games-tab { padding: 7px 10px; }
            .vp-games-score { order: 3; flex: 1 0 100%; margin: 0; text-align: center; } .vp-g-side { min-width: 70px; font-size: 13px; } }
        .vp-games-tabs { display: flex; gap: 4px; padding: 4px; border-radius: 9999px; background: var(--glass-bg, rgba(35, 35, 35, .6)); }
        .vp-games-tab { border: 0; border-radius: 9999px; padding: 7px 14px; cursor: pointer; background: none; font: inherit; font-size: 14px; font-weight: 500;
            color: var(--text-secondary); }
        .vp-games-tab.vp-on { color: var(--text-primary, #fff); background: rgba(255, 255, 255, .1); box-shadow: inset 0 0 0 1px var(--vp-accent); }
        .vp-games-score { margin-left: auto; font-size: 14px; font-weight: 600; color: var(--text-secondary); white-space: nowrap; }
        .vp-games-x { width: 36px; height: 36px; border: 0; border-radius: 50%; cursor: pointer; background: rgba(255, 255, 255, .08); color: inherit;
            display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }
        .vp-games-body { display: flex; justify-content: center; align-items: flex-start; gap: 16px; min-height: 0; flex: 1 1 auto; overflow: hidden; }
        .vp-games-body > .vp-games-leads { max-height: 100%; overflow-y: auto; }
        .vp-games-hint { font-size: 12px; text-align: center; color: var(--text-secondary); }
        .vp-g-canvas { display: block; border-radius: 20px; background: var(--bg-primary, #000); touch-action: none; outline: none; cursor: pointer; }
        .vp-g-side { display: flex; flex-direction: column; gap: 10px; min-width: 110px; font-size: 14px; }
        .vp-g-side b { font-size: 20px; }
        .vp-g-pad { display: none; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .vp-g-pad button { width: 56px; height: 48px; border: 0; border-radius: 14px; font-size: 20px; cursor: pointer; background: rgba(255, 255, 255, .1); color: inherit;
            touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
        .vp-g-pad button:active { background: rgba(255, 255, 255, .22); }
        @media (pointer: coarse) { .vp-g-pad { display: flex; } }
        .vp-mines { display: grid; gap: 3px; user-select: none; -webkit-user-select: none; touch-action: manipulation; }
        .vp-mine { width: var(--vp-mc, 36px); height: var(--vp-mc, 36px); border: 0; border-radius: 8px; padding: 0; cursor: pointer; font: 700 calc(var(--vp-mc, 36px) * .5)/1 system-ui, sans-serif;
            background: rgba(255, 255, 255, .12); color: #fff; -webkit-tap-highlight-color: transparent; }
        .vp-mine:hover { background: rgba(255, 255, 255, .2); }
        .vp-mine.vp-open { background: rgba(255, 255, 255, .04); cursor: default; }
        .vp-mine.vp-near { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 35%, transparent); }
        .vp-mine.vp-open.vp-near { background-color: color-mix(in srgb, var(--vp-accent) 5%, rgba(255, 255, 255, .04)); }
        .vp-mine.vp-boom { background: #c0392b; }
        .vp-mine.vp-flag-ok { background: rgba(46, 204, 113, .55); }
        .vp-mine.vp-flag-bad { background: rgba(231, 76, 60, .5); }
        .vp-mine[data-n="1"] { color: #5dade2; } .vp-mine[data-n="2"] { color: #58d68d; } .vp-mine[data-n="3"] { color: #ec7063; }
        .vp-mine[data-n="4"] { color: #af7ac5; } .vp-mine[data-n="5"] { color: #f5b041; } .vp-mine[data-n="6"] { color: #48c9b0; }
        .vp-mine[data-n="7"] { color: #fff; } .vp-mine[data-n="8"] { color: #aab7b8; }
        .vp-mines-bar { display: flex; gap: 8px; justify-content: center; align-items: center; margin-bottom: 10px; font-size: 14px; }
        .vp-mines-bar button { border: 0; border-radius: 9999px; padding: 7px 14px; cursor: pointer; font: inherit; background: rgba(255, 255, 255, .1); color: inherit; }
        .vp-mines-bar button.vp-on { box-shadow: inset 0 0 0 1px var(--vp-accent); }
        .vp-mines-msg { text-align: center; margin-top: 10px; font-weight: 600; min-height: 20px; }
        .vp-mines-wrap { position: relative; }
        .vp-mines-help { position: absolute; inset: 0; z-index: 2; overflow-y: auto; padding: 16px 18px; border-radius: 14px; font-size: 14px; line-height: 1.45;
            background: color-mix(in srgb, var(--block-bg) 96%, transparent); color: var(--text-primary, #fff); }
        .vp-mines-help[hidden] { display: none; }
        .vp-mines-help b { display: block; font-size: 16px; margin-bottom: 8px; }
        .vp-mines-help ul { margin: 0; padding-left: 20px; list-style: disc; }
        .vp-mines-help li { margin: 0 0 7px; }
        .vp-mines-help .vp-n { font-weight: 700; color: #5dade2; }
        .vp-games-leads { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; width: 100%; }
        .vp-games-leads section { padding: 12px; border-radius: 20px; background: rgba(255, 255, 255, .04); min-width: 0; }
        .vp-games-lead-t { font-weight: 600; font-size: 14px; margin-bottom: 6px; }
        .vp-games-lead-list { display: grid; gap: 2px; max-height: min(52vh, 420px); overflow-y: auto; scrollbar-width: thin; }
        .vp-games-lead-row { display: grid; grid-template-columns: 26px 1fr auto; gap: 8px; padding: 4px 10px; border-radius: 10px; font-size: 14px; }
        .vp-games-lead-row > span:first-child { color: var(--text-secondary); }
        .vp-games-lead-row > span:nth-child(2) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-games-lead-row.vp-me { background: rgba(255, 255, 255, .08); box-shadow: inset 0 0 0 1px var(--vp-accent); }
        @media (prefers-reduced-motion: reduce) { .vp-games { animation: none; } }
    `);
        const gameCtx = () => ({ accent: getComputedStyle(document.documentElement).getPropertyValue('--vp-accent').trim() || '#00ff88' });
        function fitCanvas(cv, cols, rows, sideW = 0, extraH = 0) {
            const body = gw.el && gw.el.querySelector('.vp-games-body');
            const winW = (body ? body.clientWidth : Math.min(760, innerWidth - 24) - 32) - sideW, winH = (body ? body.clientHeight : innerHeight - 140) - extraH;
            const cell = Math.max(10, Math.floor(Math.min(winW / cols, winH / rows)));
            const dpr = devicePixelRatio || 1;
            cv.style.width = cols * cell + 'px'; cv.style.height = rows * cell + 'px';
            cv.width = Math.round(cols * cell * dpr); cv.height = Math.round(rows * cell * dpr);
            return cell * dpr;
        }

        const repRng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
        const repNew = g => ({ g, seed: (Math.random() * 4294967296) >>> 0, ev: [] });
        function repSave(rec, score) {
            if (!rec || rec.ev.length > 30000) return;
            GM_setValue(acctKey('vp_rep_' + rec.g), { score, seed: rec.seed, ev: rec.ev.slice(), at: Date.now(), up: false });
        }
        function snakeGame(setScore, rp) {
            const el = document.createElement('div');
            const cv = document.createElement('canvas');
            cv.className = 'vp-g-canvas'; cv.tabIndex = 0;
            const hint = document.createElement('div');
            hint.className = 'vp-games-hint'; hint.style.marginTop = '10px';
            hint.textContent = IS_PHONE ? 'Свайп — поворот · нажми — пауза' : 'Стрелки или WASD · пробел — пауза';
            el.append(cv, hint);
            const g = cv.getContext('2d'), CELLS = 16, STEP = 115;
            let snake, prev, dir, queue, food, on = false, dead = false, score = 0, last = 0, raf = 0, msg = 'Змейка\nнажми или стрелку', cell = 0;
            let best = GM_getValue(acctKey('vp_snake_best'), 0);
            const show = () => setScore(rp ? `счёт ${score}` : `${score} · рекорд ${best}`);
            let rng = Math.random, rec = null, steps = 0, ei = 0;
            const DIRV = [[0, -1], [1, 0], [0, 1], [-1, 0]];
            const rnd = () => ({ x: rng() * CELLS | 0, y: rng() * CELLS | 0, ch: MATRIX_CHARS[rng() * MATRIX_CHARS.length | 0] });
            function reset() {
                rng = repRng(rp ? rp.seed : (rec = repNew('s')).seed); steps = 0; ei = 0;
                snake = [{ x: 7, y: 11 }, { x: 6, y: 11 }, { x: 5, y: 11 }];
                prev = snake.map(p => ({ ...p }));
                dir = { x: 1, y: 0 }; queue = []; score = 0;
                do food = rnd(); while (snake.some(p => p.x === food.x && p.y === food.y));
                show();
            }
            function draw(now = performance.now()) {
                const { accent } = gameCtx(), px = cell * CELLS;
                const t = on ? Math.min(1, (now - last) / STEP) : 1;
                g.clearRect(0, 0, px, px);
                g.fillStyle = 'rgba(255, 255, 255, .035)';
                for (let i = 0; i < CELLS; i++) for (let j = 0; j < CELLS; j++) if ((i + j) % 2) g.fillRect(i * cell, j * cell, cell, cell);
                g.textAlign = 'center'; g.textBaseline = 'middle';
                const pulse = 0.85 + 0.15 * Math.sin(now / 180);
                g.shadowColor = accent; g.shadowBlur = cell * 0.6; g.fillStyle = '#fff';
                g.font = `bold ${Math.round(cell * 0.72 * pulse)}px monospace`;
                g.fillText(food.ch, (food.x + .5) * cell, (food.y + .5) * cell);
                g.font = `bold ${Math.round(cell * 0.6)}px monospace`;
                for (let i = snake.length - 1; i >= 0; i--) {
                    const a = prev[i] || snake[i], b = snake[i];
                    const wrap = Math.abs(a.x - b.x) > 1 || Math.abs(a.y - b.y) > 1;
                    const x = (wrap ? b.x : a.x + (b.x - a.x) * t) * cell, y = (wrap ? b.y : a.y + (b.y - a.y) * t) * cell;
                    const k = i / Math.max(1, snake.length - 1);
                    g.globalAlpha = 1 - k * 0.55; g.shadowBlur = i ? 0 : cell * 0.5; g.fillStyle = i ? accent : '#fff';
                    const pad = cell * (i ? 0.1 + k * 0.06 : 0.06);
                    g.beginPath(); g.roundRect(x + pad, y + pad, cell - pad * 2, cell - pad * 2, cell * 0.28); g.fill();
                    if (i) { g.fillStyle = 'rgba(0, 0, 0, .55)'; g.fillText(MATRIX_CHARS[(b.x * 7 + b.y * 13 + i) % MATRIX_CHARS.length], x + cell / 2, y + cell / 2); }
                }
                g.globalAlpha = 1; g.shadowBlur = 0;
                if (msg) {
                    g.fillStyle = 'rgba(0, 0, 0, .55)'; g.fillRect(0, 0, px, px);
                    g.fillStyle = '#fff'; g.font = `600 ${Math.round(px * 0.06)}px system-ui, sans-serif`;
                    msg.split('\n').forEach((line, i, all) => g.fillText(line, px / 2, px / 2 + (i - (all.length - 1) / 2) * px * 0.09));
                }
            }
            function step() {
                steps++;
                if (queue.length) dir = queue.shift();
                const head = { x: (snake[0].x + dir.x + CELLS) % CELLS, y: (snake[0].y + dir.y + CELLS) % CELLS };
                if (snake.slice(0, -1).some(p => p.x === head.x && p.y === head.y)) {
                    on = false;
                    if (!rp && score > best) { best = score; GM_setValue(acctKey('vp_snake_best'), best); repSave(rec, score); renderGamesMenu(); gamesRecord(); }
                    msg = rp ? `Съел себя · ${score}` : `Съел себя · ${score}\nнажми — ещё раз`;
                    show(); draw(); dead = true;
                    return;
                }
                prev = snake.map(p => ({ ...p }));
                snake.unshift(head);
                if (head.x === food.x && head.y === food.y) {
                    score++; if (!rp) uiSound('click'); show();
                    do food = rnd(); while (snake.some(p => p.x === food.x && p.y === food.y));
                } else snake.pop();
            }
            function loop(now) {
                raf = 0;
                if (!on) return;
                while (on && now - last >= STEP) { last += STEP; step(); if (now - last > STEP * 3) last = now; }
                if (on) { draw(now); raf = requestAnimationFrame(loop); }
            }
            function start() {
                if (!snake || dead) { dead = false; reset(); }
                on = true; msg = '';
                last = performance.now();
                if (!raf) raf = requestAnimationFrame(loop);
            }
            function pause() { if (!on) return; on = false; msg = 'Пауза\nнажми — дальше'; draw(); }
            function turn(x, y) {
                const tail = queue.length ? queue[queue.length - 1] : dir;
                if (rp || (x === -tail.x && y === -tail.y) || (x === tail.x && y === tail.y)) return;
                if (queue.length < 3) { queue.push({ x, y }); if (rec && rec.ev.length < 30000) rec.ev.push([steps, DIRV.findIndex(d => d[0] === x && d[1] === y)]); }
                if (!on) start();
            }
            const TURN = {
                arrowup: [0, -1], w: [0, -1], ц: [0, -1], arrowdown: [0, 1], s: [0, 1], ы: [0, 1],
                arrowleft: [-1, 0], a: [-1, 0], ф: [-1, 0], arrowright: [1, 0], d: [1, 0], в: [1, 0]
            };
            function key(e) {
                const k = e.key.toLowerCase();
                if (k === ' ' || k === 'p' || k === 'з') { e.preventDefault(); on ? pause() : start(); return; }
                const t = TURN[k];
                if (!t) return;
                e.preventDefault();
                if (e.repeat) return;
                turn(t[0], t[1]);
            }
            let sx = 0, sy = 0, swiped = false;
            cv.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; swiped = false; cv.setPointerCapture(e.pointerId); });
            cv.addEventListener('pointermove', e => {
                if (swiped || e.buttons === 0 && e.pointerType === 'mouse') return;
                const dx = e.clientX - sx, dy = e.clientY - sy;
                if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
                swiped = true;
                Math.abs(dx) > Math.abs(dy) ? turn(Math.sign(dx), 0) : turn(0, Math.sign(dy));
            });
            cv.addEventListener('pointerup', () => { if (!swiped && !rp) (on ? pause() : start()); });
            function resize() { cell = fitCanvas(cv, CELLS, CELLS, 0, 34); draw(); }
            function repTo(vt) {
                if (!on && !dead) { on = true; msg = ''; }
                const target = Math.min(Math.floor(vt / STEP), 500000);
                while (!dead && steps < target) {
                    while (ei < rp.ev.length && rp.ev[ei][0] <= steps) { const d = DIRV[rp.ev[ei++][1]] || DIRV[1]; if (queue.length < 3) queue.push({ x: d[0], y: d[1] }); }
                    step();
                }
                if (!rp.instant) { last = performance.now() - STEP; draw(); }
            }
            reset(); msg = rp ? '' : 'Змейка\nнажми или стрелку';
            el._vpTest = () => ({ head: snake[0], dir, queue: queue.length, on, score, food, len: snake.length, dead });
            return { el, key: e => { if (!rp) key(e); }, pause, resize, repTo, repRes: () => ({ score, done: dead }), destroy() { on = false; cancelAnimationFrame(raf); } };
        }

        function minesGame(setScore, rp) {
            const W = 10, H = 10, M = 15;
            const el = document.createElement('div');
            el.innerHTML = `<div class="vp-mines-bar"><button type="button" data-a="new">Новая игра</button><button type="button" data-a="flag">🚩 флажки</button><button type="button" data-a="help">❓ Как играть</button></div>
            <div class="vp-mines-wrap"><div class="vp-mines"></div><div class="vp-mines-help" hidden><b>Как играть в сапёра</b><ul>
            <li>На поле 10×10 спрятано 15 мин. Цель — открыть все клетки без мин.</li>
            <li>Нажми на клетку, чтобы открыть её. Первый ход всегда безопасный.</li>
            <li>Цифра — сколько мин в 8 клетках вокруг неё. Щёлкни по клетке колёсиком мыши — вокруг неё останется рамка 3×3, так видно зону цифры (ещё щелчок колёсиком — убрать). Например, <span class="vp-n">1</span> — ровно одна мина где-то рядом.</li>
            <li>Пустая клетка — мин вокруг нет, соседи откроются сами.</li>
            <li>Уверен, что тут мина, — поставь флажок: правая кнопка мыши, долгое нажатие на телефоне или режим «🚩 флажки».</li>
            <li>Вокруг цифры уже столько флажков, сколько она показывает, — нажми на цифру, и откроются остальные соседи.</li>
            <li>Открыл мину — проигрыш. Открыл всё без мин — победа, время уходит в «Топ задротов». Чем быстрее, тем выше.</li>
            <li>Новая игра — кнопка сверху или клавиша R.</li></ul></div></div><div class="vp-mines-msg"></div>`;
            const grid = el.querySelector('.vp-mines'), msgEl = el.querySelector('.vp-mines-msg'), flagBtn = el.querySelector('[data-a="flag"]');
            grid.style.gridTemplateColumns = `repeat(${W}, auto)`;
            let cells, first, over, opened, flags, t0 = 0, timer = 0, flagMode = false, rec = null, rng = Math.random, repNow = 0, nowT = null, ei = 0, won = false;
            const nb = i => { const x = i % W, y = i / W | 0, out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if ((dx || dy) && nx >= 0 && ny >= 0 && nx < W && ny < H) out.push(ny * W + nx); } return out; };
            const secs = () => rp ? Math.floor(repNow / 1000) : nowT !== null ? Math.floor(nowT / 1000) : t0 ? Math.floor((performance.now() - t0) / 1000) : 0;
            const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
            const show = () => { const b = rp ? 0 : GM_getValue(acctKey('vp_mines_best'), 0); setScore(`💣 ${M - flags} · ${fmt(secs())}` + (b ? ` · лучшее ${fmt(b)}` : '')); };
            function userAct(i, fl) {
                if (rp || over) return;
                const t = t0 ? Math.round(performance.now() - t0) : 0;
                if (fl && cells[i].open) return;
                if (rec && rec.ev.length < 30000) rec.ev.push([t, fl ? 1 : 0, i]);
                nowT = t0 ? t : null;
                fl ? flag(i) : open(i);
                nowT = null;
            }
            function reset() {
                rng = repRng(rp ? rp.seed : (rec = repNew('m')).seed); ei = 0; won = false;
                cells = Array.from({ length: W * H }, () => ({ mine: false, n: 0, open: false, flag: false }));
                first = true; over = false; opened = 0; flags = 0; t0 = 0; clearInterval(timer); msgEl.textContent = '';
                grid.textContent = '';
                cells.forEach((c, i) => {
                    const b = document.createElement('button');
                    b.type = 'button'; b.className = 'vp-mine'; b.dataset.i = i;
                    c.b = b;
                    let lp = 0, longed = false;
                    b.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { longed = false; lp = setTimeout(() => { longed = true; userAct(i, true); }, 400); } });
                    const cancel = () => clearTimeout(lp);
                    b.addEventListener('pointerup', cancel); b.addEventListener('pointerleave', cancel);
                    b.addEventListener('click', () => { if (longed) { longed = false; return; } userAct(i, flagMode); });
                    b.addEventListener('contextmenu', e => { e.preventDefault(); userAct(i, true); });
                    grid.appendChild(b);
                });
                show();
            }
            function paint(c) {
                const b = c.b;
                b.classList.toggle('vp-open', c.open);
                b.textContent = c.open ? (c.mine ? '💣' : c.n || '') : c.flag ? '🚩' : '';
                if (c.open && !c.mine && c.n) b.dataset.n = c.n; else delete b.dataset.n;
            }
            function plant(safe) {
                const ban = new Set([safe, ...nb(safe)]);
                let left = M;
                while (left) { const i = rng() * W * H | 0; if (!ban.has(i) && !cells[i].mine) { cells[i].mine = true; left--; } }
                cells.forEach((c, i) => { c.n = nb(i).filter(j => cells[j].mine).length; });
                t0 = rp ? 1 : performance.now();
                if (!rp) timer = setInterval(show, 1000);
            }
            function end(win, boom) {
                over = true; clearInterval(timer);
                cells.forEach(c => { if (c.mine && !c.flag) { c.open = !win; if (win) c.flag = true; } paint(c); });
                if (boom != null) cells[boom].b.classList.add('vp-boom');
                if (!win) cells.forEach(c => { if (c.flag) c.b.classList.add(c.mine ? 'vp-flag-ok' : 'vp-flag-bad'); });
                const s = secs();
                if (win) {
                    won = true;
                    const b = GM_getValue(acctKey('vp_mines_best'), 0);
                    if (!rp && (!b || s < b)) { GM_setValue(acctKey('vp_mines_best'), s); repSave(rec, s); renderGamesMenu(); gamesRecord(); }
                    msgEl.textContent = `Разминировано за ${fmt(s)}!`;
                } else msgEl.textContent = 'Бум! Нажми «Новая игра»';
                show();
            }
            function open(i) {
                if (over) return;
                const c = cells[i];
                if (c.flag) return;
                if (first) { first = false; plant(i); }
                if (c.open) {
                    if (c.n && nb(i).filter(j => cells[j].flag).length === c.n) nb(i).forEach(j => { if (!cells[j].open && !cells[j].flag) open(j); });
                    return;
                }
                if (c.mine) { c.open = true; paint(c); return end(false, i); }
                const stack = [i];
                while (stack.length) {
                    const j = stack.pop(), d = cells[j];
                    if (d.open || d.flag) continue;
                    d.open = true; opened++; paint(d);
                    if (!d.n) nb(j).forEach(k => { if (!cells[k].open && !cells[k].mine) stack.push(k); });
                }
                if (!rp) uiSound('click');
                if (opened === W * H - M) end(true);
            }
            function flag(i) {
                const c = cells[i];
                if (over || c.open) return;
                c.flag = !c.flag; flags += c.flag ? 1 : -1;
                paint(c); show();
            }
            let near = [];
            const unhot = () => { near.forEach(b => b.classList.remove('vp-near')); near = []; };
            let hotI = -1;
            grid.addEventListener('mousedown', e => {
                if (e.button !== 1) return;
                e.preventDefault();
                const b = e.target.closest('.vp-mine');
                const i = b ? +b.dataset.i : -1;
                unhot();
                if (i < 0 || i === hotI) { hotI = -1; return; }
                hotI = i;
                near = [i, ...nb(i)].map(j => cells[j].b);
                near.forEach(x => x.classList.add('vp-near'));
            });
            grid.addEventListener('auxclick', e => { if (e.button === 1) e.preventDefault(); });
            el.querySelector('[data-a="new"]').addEventListener('click', () => { if (rp) return; unhot(); hotI = -1; reset(); });
            const helpEl = el.querySelector('.vp-mines-help'), helpBtn = el.querySelector('[data-a="help"]');
            helpBtn.addEventListener('click', () => { helpEl.hidden = !helpEl.hidden; helpBtn.classList.toggle('vp-on', !helpEl.hidden); });
            helpEl.addEventListener('click', () => { helpEl.hidden = true; helpBtn.classList.remove('vp-on'); });
            flagBtn.addEventListener('click', () => { flagMode = !flagMode; flagBtn.classList.toggle('vp-on', flagMode); });
            function resize() {
                const body = gw.el && gw.el.querySelector('.vp-games-body');
                const side = Math.min(body ? body.clientWidth : innerWidth - 56, (body ? body.clientHeight : innerHeight - 180) - 90);
                grid.style.setProperty('--vp-mc', Math.max(24, Math.floor((side - 3 * (W - 1)) / W)) + 'px');
            }
            function repTo(vt) {
                while (!over && ei < rp.ev.length && rp.ev[ei][0] <= vt) { const [t, fl, i] = rp.ev[ei++]; repNow = t; if (fl) { if (!cells[i].open) flag(i); } else open(i); }
                if (!rp.instant) show();
            }
            reset();
            el._vpTest = () => ({ cells: cells.map(c => ({ mine: c.mine, open: c.open, flag: c.flag })), over, first });
            return { el, key: e => { if (!rp && (e.key === 'F2' || e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'к')) { e.preventDefault(); reset(); } }, pause() { }, resize, repTo,
                repRes: () => ({ score: won ? secs() : 0, win: won, done: over || ei >= rp.ev.length }), destroy() { clearInterval(timer); } };
        }

        function tetrisGame(setScore, rp) {
            const COLS = 10, ROWS = 20;
            const SHAPES = {
                I: [[1, 1, 1, 1]], O: [[1, 1], [1, 1]], T: [[0, 1, 0], [1, 1, 1]], S: [[0, 1, 1], [1, 1, 0]],
                Z: [[1, 1, 0], [0, 1, 1]], J: [[1, 0, 0], [1, 1, 1]], L: [[0, 0, 1], [1, 1, 1]]
            };
            const COLORS = { I: '#4dd0e1', O: '#ffd54f', T: '#ba68c8', S: '#81c784', Z: '#e57373', J: '#64b5f6', L: '#ffb74d' };
            const el = document.createElement('div');
            el.style.cssText = 'display:flex;flex-direction:column;gap:10px;align-items:center';
            const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:16px;align-items:flex-start';
            const cv = document.createElement('canvas'); cv.className = 'vp-g-canvas'; cv.tabIndex = 0;
            const side = document.createElement('div'); side.className = 'vp-g-side';
            side.innerHTML = `<div>Следующая</div><canvas class="vp-g-canvas" style="width:88px;height:88px"></canvas>
            <div>Очки<br><b data-v="score">0</b></div><div>Линии<br><b data-v="lines">0</b></div><div>Уровень<br><b data-v="level">1</b></div>`;
            const pad = document.createElement('div'); pad.className = 'vp-g-pad';
            pad.innerHTML = ['◀:left', '⟳:rot', '▶:right', '▼:down', '⤓:drop', 'Ⅱ:pause'].map(s => { const [t, a] = s.split(':'); return `<button type="button" data-a="${a}">${t}</button>`; }).join('');
            const hint = document.createElement('div'); hint.className = 'vp-games-hint';
            hint.textContent = '← → — двигать · ↑ или X — поворот · ↓ — быстрее · пробел — сбросить · P — пауза';
            if (IS_PHONE) hint.hidden = true;
            row.append(cv, side); el.append(row, pad, hint);
            const nx = side.querySelector('canvas'), g = cv.getContext('2d'), ng = nx.getContext('2d');
            let board, cur, next, score, lines, level, on = false, over = false, last = 0, raf = 0, cell = 0, msg = 'Тетрис\nнажми или стрелку';
            let best = GM_getValue(acctKey('vp_tetris_best'), 0);
            let acc = 0, since = 0, lastT = 0, rec = null, rng = Math.random, ei = 0;
            const bag = []; const take = () => { if (!bag.length) { const k = Object.keys(SHAPES); for (let i = k.length - 1; i > 0; i--) { const j = rng() * (i + 1) | 0; [k[i], k[j]] = [k[j], k[i]]; } bag.push(...k); } return bag.pop(); };
            const piece = t => ({ t, m: SHAPES[t].map(r => [...r]), x: 0, y: 0 });
            const speed = () => Math.max(90, 800 - (level - 1) * 70);
            const show = () => {
                side.querySelector('[data-v="score"]').textContent = score; side.querySelector('[data-v="lines"]').textContent = lines;
                side.querySelector('[data-v="level"]').textContent = level; setScore(rp ? `счёт ${score}` : `${score} · рекорд ${best}`);
            };
            const fits = (m, x, y) => m.every((r, j) => r.every((v, i) => !v || (x + i >= 0 && x + i < COLS && y + j < ROWS && (y + j < 0 || !board[y + j][x + i]))));
            const rotate = (m, dir) => dir > 0 ? m[0].map((_, i) => m.map(r => r[i]).reverse()) : m[0].map((_, i) => m.map(r => r[r.length - 1 - i]));
            function spawn() {
                cur = next || piece(take()); next = piece(take());
                cur.x = (COLS - cur.m[0].length) / 2 | 0; cur.y = -1;
                if (!fits(cur.m, cur.x, cur.y + 1)) return gameOver();
                cur.y = 0;
            }
            function reset() { rng = repRng(rp ? rp.seed : (rec = repNew('t')).seed); bag.length = 0; acc = 0; lastT = 0; ei = 0; board = Array.from({ length: ROWS }, () => Array(COLS).fill(null)); score = 0; lines = 0; level = 1; over = false; next = null; spawn(); show(); }
            function gameOver() {
                on = false; over = true;
                if (!rp && score > best) { best = score; GM_setValue(acctKey('vp_tetris_best'), best); repSave(rec, score); renderGamesMenu(); gamesRecord(); }
                msg = rp ? `Конец · ${score}` : `Конец · ${score}\nнажми — ещё раз`; show(); draw();
            }
            function lock() {
                cur.m.forEach((r, j) => r.forEach((v, i) => { if (v && cur.y + j >= 0) board[cur.y + j][cur.x + i] = cur.t; }));
                let n = 0;
                for (let y = ROWS - 1; y >= 0; y--) if (board[y].every(Boolean)) { board.splice(y, 1); board.unshift(Array(COLS).fill(null)); n++; y++; }
                if (n) { score += [0, 100, 300, 500, 800][n] * level; lines += n; level = Math.floor(lines / 10) + 1; if (!rp) uiSound('click'); }
                show(); spawn();
            }
            function move(dx, dy) { if (fits(cur.m, cur.x + dx, cur.y + dy)) { cur.x += dx; cur.y += dy; return true; } return false; }
            function turn(dir) { const m = rotate(cur.m, dir); for (const k of [0, -1, 1, -2, 2]) if (fits(m, cur.x + k, cur.y)) { cur.m = m; cur.x += k; return; } }
            function hard() { let n = 0; while (move(0, 1)) n++; score += n * 2; lock(); }
            const clock = () => Math.round(acc + (on && !rp ? performance.now() - since : 0));
            function advance(T) { let n = 0; while (on && !over && T - lastT >= speed() && n++ < 1e6) { lastT += speed(); if (!move(0, 1)) lock(); } }
            const ACTS = ['left', 'right', 'down', 'rot', 'back', 'drop'];
            function doAct(a, T) {
                ({
                    left: () => move(-1, 0), right: () => move(1, 0), down: () => { if (move(0, 1)) score++; else lock(); lastT = T; show(); },
                    rot: () => turn(1), back: () => turn(-1), drop: () => { hard(); lastT = T; }
                })[a]();
            }
            function cellAt(ctx, x, y, c, s, alpha = 1) {
                ctx.globalAlpha = alpha; ctx.fillStyle = c;
                ctx.beginPath(); ctx.roundRect(x * s + s * .06, y * s + s * .06, s * .88, s * .88, s * .2); ctx.fill(); ctx.globalAlpha = 1;
            }
            function draw() {
                g.clearRect(0, 0, cv.width, cv.height);
                g.fillStyle = 'rgba(255, 255, 255, .03)';
                for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ((x + y) % 2) g.fillRect(x * cell, y * cell, cell, cell);
                board.forEach((r, y) => r.forEach((t, x) => t && cellAt(g, x, y, COLORS[t], cell)));
                if (cur && !over) {
                    let gy = cur.y; while (fits(cur.m, cur.x, gy + 1)) gy++;
                    cur.m.forEach((r, j) => r.forEach((v, i) => v && cellAt(g, cur.x + i, gy + j, COLORS[cur.t], cell, .22)));
                    cur.m.forEach((r, j) => r.forEach((v, i) => v && cur.y + j >= 0 && cellAt(g, cur.x + i, cur.y + j, COLORS[cur.t], cell)));
                }
                const ns = nx.width / 4;
                ng.clearRect(0, 0, nx.width, nx.height);
                if (next) { const m = next.m, ox = (4 - m[0].length) / 2, oy = (4 - m.length) / 2; m.forEach((r, j) => r.forEach((v, i) => v && cellAt(ng, ox + i, oy + j, COLORS[next.t], ns))); }
                if (msg) {
                    g.fillStyle = 'rgba(0, 0, 0, .55)'; g.fillRect(0, 0, cv.width, cv.height);
                    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${Math.round(cell * .8)}px system-ui, sans-serif`;
                    msg.split('\n').forEach((line, i, all) => g.fillText(line, cv.width / 2, cv.height / 2 + (i - (all.length - 1) / 2) * cell * 1.2));
                }
            }
            function loop(now) {
                raf = 0;
                if (!on) return;
                advance(clock());
                if (on) { draw(); raf = requestAnimationFrame(loop); }
            }
            function start() { if (rp) return; if (over) reset(); on = true; msg = ''; since = performance.now(); if (!raf) raf = requestAnimationFrame(loop); }
            function pause() { if (!on || rp) return; acc += performance.now() - since; on = false; msg = 'Пауза\nнажми — дальше'; draw(); }
            const act = a => {
                if (rp) return;
                if (a === 'pause') return on ? pause() : start();
                if (!on) return start();
                const T = clock();
                advance(T);
                if (!on) return draw();
                if (rec && rec.ev.length < 30000) rec.ev.push([T, ACTS.indexOf(a)]);
                doAct(a, T);
                draw();
            };
            const KEYS = {
                arrowleft: 'left', a: 'left', ф: 'left', arrowright: 'right', d: 'right', в: 'right', arrowdown: 'down', s: 'down', ы: 'down',
                arrowup: 'rot', w: 'rot', ц: 'rot', x: 'rot', ч: 'rot', z: 'back', я: 'back', ' ': 'drop', p: 'pause', з: 'pause'
            };
            function key(e) { const a = KEYS[e.key.toLowerCase()]; if (!a) return; e.preventDefault(); if (e.repeat && (a === 'rot' || a === 'back' || a === 'drop' || a === 'pause')) return; act(a); }
            pad.addEventListener('click', e => { const b = e.target.closest('button'); if (b) act(b.dataset.a); });
            cv.addEventListener('click', () => (on ? pause() : start()));
            function resize() {
                const coarse = IS_PHONE;
                cell = fitCanvas(cv, COLS, ROWS, innerWidth < 520 ? 90 : 140, coarse ? 124 : 40);
                const dpr = devicePixelRatio || 1; nx.width = nx.height = Math.round(88 * dpr);
                draw();
            }
            function repTo(vt) {
                if (!on && !over) { on = true; msg = ''; }
                while (on && ei < rp.ev.length && rp.ev[ei][0] <= vt) { const [T, a] = rp.ev[ei++]; advance(T); if (on) doAct(ACTS[a] || 'down', T); }
                if (on) advance(ei < rp.ev.length ? Math.min(vt, rp.ev[ei][0]) : vt);
                if (!rp.instant) draw();
            }
            reset(); msg = rp ? '' : 'Тетрис\nнажми или стрелку';
            el._vpTest = () => ({ on, over, score, cur: cur && { t: cur.t, x: cur.x, y: cur.y } });
            return { el, key, pause, resize, repTo, repRes: () => ({ score, done: over }), destroy() { on = false; cancelAnimationFrame(raf); } };
        }

