        const nickStyles = {
            fire: {
                name: 'Огненный',
                color: '#ff4400',
                gradientLight: 'linear-gradient(270deg, #ff2200, #ff6600, #ffaa00)',
                gradientDark: 'linear-gradient(270deg, #ff4400, #ff8800, #ffcc22)',
                glow: 'drop-shadow(0 0 20px rgba(255, 68, 0, 0.9)) drop-shadow(0 0 35px rgba(255, 68, 0, 0.6))',
                matrixHue: 25,
                avatarHue: 25,
                matrixSat: 100,
                avatarSat: 100
            },
            pinkNeon: {
                name: 'Розовый неон',
                color: '#ff2d75',
                gradientLight: 'linear-gradient(270deg, #ff2d75, #ff69b4, #ff9eb5)',
                gradientDark: 'linear-gradient(270deg, #ff44aa, #ff77cc, #ff99dd)',
                glow: 'drop-shadow(0 0 20px #ff2d75) drop-shadow(0 0 35px #ff2d75)',
                matrixHue: 330,
                avatarHue: 330,
                matrixSat: 100,
                avatarSat: 100
            },
            gold: {
                name: 'Золотой',
                color: '#ffd700',
                gradientLight: 'linear-gradient(270deg, #ffd700, #ffb347, #ff8c00)',
                gradientDark: 'linear-gradient(270deg, #ffea00, #ffcc44, #ffaa33)',
                glow: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.9)) drop-shadow(0 0 25px rgba(255, 215, 0, 0.6))',
                matrixHue: 50,
                avatarHue: 50,
                matrixSat: 100,
                avatarSat: 100
            },
            neonPulse: {
                name: 'Неон-пульс',
                color: '#00ff88',
                gradientLight: 'linear-gradient(270deg, #00ff88, #00ffcc, #88ffcc)',
                gradientDark: 'linear-gradient(270deg, #44ffaa, #44ffdd, #aaffdd)',
                glow: 'drop-shadow(0 0 15px #00ff88) drop-shadow(0 0 25px #00ff88)',
                matrixHue: 155,
                avatarHue: 155,
                matrixSat: 100,
                avatarSat: 100
            },
            matrix: {
                name: 'Матрица',
                color: '#0f0',
                gradientLight: 'linear-gradient(270deg, #0f0, #0f8, #0f0)',
                gradientDark: 'linear-gradient(270deg, #2f2, #2fa, #2f2)',
                glow: 'drop-shadow(0 0 6px #0f0) drop-shadow(0 0 12px #0f0)',
                matrixHue: 120,
                avatarHue: 120,
                matrixSat: 100,
                avatarSat: 100
            },
            blueGlow: {
                name: 'Голубое свечение',
                color: '#00b4d8',
                gradientLight: 'linear-gradient(270deg, #0288d1, #00b4d8, #48cae4)',
                gradientDark: 'linear-gradient(270deg, #4fc3f7, #90e0ef, #caf0f8)',
                glow: 'drop-shadow(0 0 20px #00b4d8) drop-shadow(0 0 35px #0288d1)',
                matrixHue: 195,
                avatarHue: 195,
                matrixSat: 100,
                avatarSat: 100
            },
            purpleMystic: {
                name: 'Фиолетовый мистик',
                color: '#9b30ff',
                gradientLight: 'linear-gradient(270deg, #7b2fff, #9b30ff, #c55aff)',
                gradientDark: 'linear-gradient(270deg, #9b44ff, #bb66ff, #dd88ff)',
                glow: 'drop-shadow(0 0 20px #9b30ff) drop-shadow(0 0 35px #7b2fff)',
                matrixHue: 270,
                avatarHue: 270,
                matrixSat: 100,
                avatarSat: 100
            },
            default: {
                name: 'Стандартный',
                color: '#0288d1',
                gradientLight: 'linear-gradient(270deg, #0288d1, #26c6da)',
                gradientDark: 'linear-gradient(270deg, #4fc3f7, #e0f7fa)',
                glow: 'drop-shadow(0 0 20px rgba(0, 128, 255, 0.9)) drop-shadow(0 0 35px rgba(0, 128, 255, 0.6))',
                matrixHue: 210,
                avatarHue: 210,
                matrixSat: 100,
                avatarSat: 100
            },
            white: {
                name: 'Белый',
                color: '#ffffff',
                gradientLight: 'linear-gradient(270deg, #e0e0e0, #ffffff, #f0f0f0)',
                gradientDark: 'linear-gradient(270deg, #d0d0d0, #ffffff, #e8e8e8)',
                glow: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 25px rgba(255, 255, 255, 0.6))',
                matrixHue: 0,
                avatarHue: 0,
                matrixSat: 15,
                avatarSat: 15
            },
            orange: {
                name: 'Оранжевый',
                color: '#ff8c1a',
                gradientLight: 'linear-gradient(270deg, #f26b00, #ff8c1a, #ffa64d)',
                gradientDark: 'linear-gradient(270deg, #ff8c1a, #ffa64d, #ffc080)',
                glow: 'drop-shadow(0 0 15px rgba(255, 140, 26, 0.9)) drop-shadow(0 0 25px rgba(255, 140, 26, 0.6))',
                matrixHue: 30,
                avatarHue: 30,
                matrixSat: 100,
                avatarSat: 100
            },
            gray: {
                name: 'Серый',
                color: '#9a9aa2',
                gradientLight: 'linear-gradient(270deg, #55555c, #7a7a82, #606067)',
                gradientDark: 'linear-gradient(270deg, #8e8e96, #b8b8c0, #a0a0a8)',
                glow: 'drop-shadow(0 0 15px rgba(170, 170, 180, 0.8)) drop-shadow(0 0 25px rgba(170, 170, 180, 0.5))',
                matrixHue: 0,
                avatarHue: 0,
                matrixSat: 0,
                avatarSat: 0
            },
            shimmer: {
                name: 'Перелив',
                color: '#b388ff',
                nickCss: dark => `background: linear-gradient(100deg, ${dark ? '#a78bfa 0%, #a78bfa 38%, #ffffff 50%, #f0abfc 58%, #a78bfa 72%, #a78bfa 100%'
                    : '#5b21b6 0%, #5b21b6 38%, #c084fc 50%, #db2777 58%, #5b21b6 72%, #5b21b6 100%'}) 0 0 / 250% 100% !important;
                -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important;
                animation: vpShimmer 3.2s ease-in-out infinite !important;`,
                glow: 'drop-shadow(0 0 10px rgba(179, 136, 255, 0.75)) drop-shadow(0 0 22px rgba(179, 136, 255, 0.4))',
                matrixHue: 265,
                avatarHue: 265,
                matrixSat: 90,
                avatarSat: 90
            },
            glitch: {
                name: 'Глитч',
                color: '#00fff0',
                nickCss: dark => `color: ${dark ? '#eafffd' : '#111'} !important; -webkit-text-fill-color: currentColor !important; background: none !important;
                display: inline-block; text-shadow: 1.5px 0 rgba(255, 0, 200, .75), -1.5px 0 rgba(0, 255, 240, .75) !important;
                animation: vpGlitch 3.6s steps(1, end) infinite !important;`,
                glow: 'drop-shadow(0 0 8px rgba(0, 255, 240, 0.55))',
                matrixHue: 180,
                avatarHue: 180,
                matrixSat: 100,
                avatarSat: 100
            },
            rainbow: {
                name: 'Радужный',
                color: 'rainbow',
                gradientLight: null,
                gradientDark: null,
                glow: null,
                matrixHue: null,
                avatarHue: null,
                matrixSat: 100,
                avatarSat: 100,
                animated: true
            }
        };

        const GLOW_K = 0.5, GLOW_ALPHA = [0.6, 0.3];
        const glowRgb = col => {
            if (col[0] !== '#') return col.match(/[\d.]+/g).slice(0, 3).map(Number).concat(col.startsWith('rgba') ? [+col.match(/[\d.]+/g)[3]] : [1]);
            const h = col.length === 4 ? col.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : col;
            return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).concat([1]);
        };
        for (const st of Object.values(nickStyles)) {
            if (!st.glow) continue;
            let layer = 0;
            st.glow = st.glow.replace(/drop-shadow\(0 0 ([\d.]+)px (#[0-9a-fA-F]{3,6}|rgba?\([^)]*\))\)/g, (m, n, col) => {
                const [r, g, b, a] = glowRgb(col), cap = GLOW_ALPHA[Math.min(layer++, GLOW_ALPHA.length - 1)];
                return `drop-shadow(0 0 ${+n * GLOW_K}px rgba(${r}, ${g}, ${b}, ${Math.min(a, cap)}))`;
            });
        }

        const hueOf = hex => {
            const h = hex.length === 4 ? hex.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : hex;
            const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
            const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
            if (d < 0.15) return null;
            const hue = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
            return (hue * 60 + 30) % 360;
        };
        const styleKeys = Object.keys(nickStyles).sort((a, b) => {
            const rank = k => {
                const c = nickStyles[k].color; const h = c && c.startsWith('#') ? hueOf(c) : null;
                return h !== null ? h : c === 'rainbow' ? 1001 : 1000;
            };
            return rank(a) - rank(b);
        });
        brandTab();
        new MutationObserver(brandTab).observe(document.head, { childList: true, subtree: true, characterData: true });

        const globalStyles = addCss(`
        :where(:root) { --vp-accent: #0080ff; }
        .nick-controls-panel {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: var(--bg-secondary, rgba(128, 128, 128, 0.15)) !important;
            border-radius: 24px !important;
            padding: 4px !important;
            margin-left: 10px !important;
            gap: 2px !important;
            vertical-align: middle !important;
            flex-shrink: 0 !important;
        }
        .vp-pill-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 32px !important;
            height: 32px !important;
            cursor: pointer !important;
            background: var(--bg-secondary, rgba(128, 128, 128, 0.15)) !important;
            border-radius: 50% !important;
            transition: background 0.2s ease, color 0.2s ease !important;
            vertical-align: middle !important;
            flex-shrink: 0 !important;
            user-select: none !important;
            color: var(--text-primary, currentColor) !important;
        }
        .vp-pill-btn:hover { background: var(--accent-primary) !important; }
        .vp-pill-btn svg:not([width]) { width: 20px !important; height: 20px !important; }
        .vp-pill-btn svg:not([fill]) { fill: none !important; }
        .vp-menu-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--text-primary, currentColor); }
        .vp-menu-note { padding: 20px; text-align: center; color: var(--text-secondary); }
        .vp-setting-label { display: flex; align-items: center; gap: 8px; }
        .vp-like-list { overflow-y: auto; overflow-x: hidden; flex: 1; padding: 4px 0; display: flex; flex-direction: column; gap: 2px; max-height: 350px; }
        .vp-like-footer { padding: 8px 12px; text-align: center; font-size: 12px; color: var(--text-secondary); border-top: 1px solid var(--border-color); flex-shrink: 0; }
        .nick-style-option.vp-like-row { justify-content: space-between !important; }
        .nick-style-option.vp-like-row:hover { transform: none !important; }
        .vp-like-user { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
        .vp-like-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; background: rgba(0, 0, 0, 0.2); flex-shrink: 0; overflow: hidden; }
        .vp-like-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .vp-like-names { display: flex; flex-direction: column; min-width: 0; }
        .vp-like-name { font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-like-login { font-size: 11px; color: var(--text-secondary); }
        .nick-style-option {
            padding: 8px 12px !important;
            cursor: pointer !important;
            transition: all 0.15s ease !important;
            color: var(--text-primary, #ffffff) !important;
            font-size: 14px !important;
            font-family: inherit !important;
            border-radius: 16px !important;
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
        }
        .nick-style-option:hover {
            background: var(--bg-hover, rgba(0, 128, 255, 0.15)) !important;
            transform: translateX(2px) !important;
        }
        .style-color-dot {
            width: 24px !important;
            height: 24px !important;
            border-radius: 12px !important;
            flex-shrink: 0 !important;
            transition: all 0.2s ease !important;
        }
        .style-color-dot.rainbow-dot {
            background: linear-gradient(135deg, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff) !important;
            background-size: 200% 200% !important;
            animation: dotRainbow 12s ease infinite !important;
        }
        @keyframes dotRainbow {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
        }
        .nick-style-option.vp-active {
            background: color-mix(in srgb, var(--vp-accent) 16%, transparent) !important;
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 45%, transparent) !important;
            font-weight: 600 !important;
        }
        .vp-opt-check { margin-left: auto; display: flex; color: var(--vp-accent); }
        html.vp-light .vp-bg-canvas { filter: invert(1) hue-rotate(180deg); }
        html.vp-light .settings-dropdown { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important; }
        .nick-style-option:not(:last-child) {
            margin-bottom: 2px !important;
        }
        .settings-dropdown.vp-logo-menu { min-width: 170px !important; padding: 6px !important; }
        .settings-dropdown.vp-logo-menu .vp-opt-icon { display: inline-flex; width: 20px; justify-content: center; }
        .settings-dropdown {
            background: var(--block-bg) !important;
            border-radius: 24px !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
            padding: 12px !important;
            min-width: 220px !important;
            z-index: 10001 !important;
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1)) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            animation: settingsFadeIn 0.15s ease !important;
            position: fixed !important;
        }
        @keyframes settingsFadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .settings-option {
            padding: 10px 12px !important;
            cursor: pointer !important;
            transition: all 0.15s ease !important;
            color: var(--text-primary, #ffffff) !important;
            font-size: 14px !important;
            font-family: inherit !important;
            border-radius: 16px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 12px !important;
        }
        .settings-option:hover {
            background: var(--bg-hover, rgba(0, 128, 255, 0.15)) !important;
        }
        .vp-vol-row { cursor: default; }
        .vp-vol { display: inline-flex; align-items: center; gap: 8px; flex: 0 0 auto; }
        .vp-vol b { min-width: 38px; text-align: right; font-weight: 500; font-size: 13px; color: var(--text-secondary); }
        .vp-vol input { -webkit-appearance: none; appearance: none; width: 120px; height: 4px; border-radius: 4px; margin: 0; cursor: pointer;
            background: linear-gradient(to right, var(--vp-accent) var(--vp-vol, 100%), rgba(128,128,128,.35) var(--vp-vol, 100%)); }
        .vp-vol input::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.4); }
        .vp-vol input::-moz-range-thumb { width: 16px; height: 16px; border: 0; border-radius: 50%; background: #fff; }
        .toggle-switch {
            width: 40px !important;
            height: 22px !important;
            background: rgba(0, 0, 0, 0.5) !important;
            border-radius: 11px !important;
            position: relative !important;
            transition: all 0.2s ease !important;
            flex-shrink: 0 !important;
        }
        .toggle-switch.active {
            background: var(--accent-primary) !important;
        }
        .toggle-switch::after {
            content: '' !important;
            position: absolute !important;
            top: 2px !important;
            left: 2px !important;
            width: 18px !important;
            height: 18px !important;
            background: white !important;
            border-radius: 50% !important;
            transition: all 0.2s ease !important;
        }
        .toggle-switch.active::after {
            left: 20px !important;
        }
        .vp-feed-bar .vp-tabs button { white-space: nowrap !important; }
        @media (max-width: ${PHONE_MAX}px) { [data-vp-posts] > hr { display: none !important; } }
        .vp-emoji-tint .vp-soft-bg, .itd-blur-active .vp-soft-bg { background-color: rgba(0, 0, 0, .22) !important; }
        html.vp-light .vp-emoji-tint .vp-soft-bg, html.vp-light .itd-blur-active .vp-soft-bg { background-color: rgba(255, 255, 255, .35) !important; }
        .vp-nick-row > a { min-width: 0; overflow: hidden; }
        .vp-nick-row .vp-nick:not(.vp-nick-large *) { min-width: 0; max-width: 100%; }
        .vp-nick:not(.vp-nick-large) > :has(> .vp-nick-text) { display: inline-flex; align-items: center; gap: inherit; min-width: 0; }
        .vp-nick-row .vp-nick-text:not(.vp-nick-large *) { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 0 1 auto; }
        .vp-post header .vp-nick-row:not(:last-child) { padding-right: 50px; }
        @media (max-width: ${PHONE_MAX}px) { .vp-post header .vp-nick-row:not(:last-child) { padding-right: 42px; } }
        .vp-notif .vp-nick-row > a { max-width: 100%; }
        .vp-notif [data-icon="liked"] svg path { fill: none !important; stroke: currentColor !important; stroke-width: 2 !important; }
        .vp-notif .vp-nick-row .vp-nick:not(.vp-nick-large *) { display: flex; flex-wrap: nowrap; align-items: center; }
        article .vp-nick-row time { flex-shrink: 0; }
        .vp-clamp::after { display: none !important; }
        .vp-clamp { -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 60px), transparent); mask-image: linear-gradient(to bottom, #000 calc(100% - 60px), transparent); }
        .vp-ico { display: inline-block !important; width: 1.15em; height: 1.15em; flex: none; vertical-align: -.2em; margin-right: .4em; }
        .vp-ico.vp-solo { margin: 0; vertical-align: -.15em; }
        .vp-banner-buttons { inset: var(--vp-bar-top, 0px) auto auto 50% !important; width: auto !important; height: auto !important; margin: 0 !important; translate: none !important; scale: none !important; rotate: none !important;
            transform: translateX(-50%); display: flex !important; gap: 2px !important; padding: 4px 12px 7px !important;
            border-radius: 0 0 22px 22px; background: rgba(12, 12, 16, .6); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
            z-index: 3; transition: clip-path .25s cubic-bezier(.2,.8,.2,1), opacity .2s; }
        html.vp-light .vp-banner-buttons { background: rgba(255, 255, 255, .65); }
        .vp-banner-buttons > button { background: transparent !important; box-shadow: none !important; }
        .vp-banner-buttons > button:hover { background: rgba(128, 128, 128, .22) !important; }
        @media (hover: hover) and (pointer: fine) {
            .vp-banner-buttons:not(.vp-banner-editing) { opacity: 0; clip-path: inset(0 0 100% 0); visibility: hidden;
                transition: clip-path .25s cubic-bezier(.2,.8,.2,1), opacity .2s, visibility 0s linear .25s; }
            .vp-banner:hover .vp-banner-buttons, .vp-banner-buttons:has(:focus-visible) { opacity: 1; clip-path: inset(0 0 0 0); visibility: visible;
                transition: clip-path .25s cubic-bezier(.2,.8,.2,1), opacity .2s, visibility 0s; }
        }
        @media not ((hover: hover) and (pointer: fine)) {
            .vp-banner-buttons:not(.vp-banner-editing) { opacity: 0; clip-path: inset(0 0 100% 0); visibility: hidden;
                transition: clip-path .25s cubic-bezier(.2,.8,.2,1), opacity .2s, visibility 0s linear .25s; }
            .vp-banner.vp-bar-open > .vp-banner-buttons:not(.vp-banner-editing) { opacity: 1; clip-path: inset(0 0 0 0); visibility: visible;
                transition: clip-path .25s cubic-bezier(.2,.8,.2,1), opacity .2s, visibility 0s; }
        }
        .toggle-switch.vp-tri { width: 58px !important; }
        .toggle-switch.vp-tri[data-s="1"]::after { left: 20px !important; }
        .toggle-switch.vp-tri { background: rgba(0, 0, 0, 0.5) !important; }
        .toggle-switch.vp-tri::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 22px; border-radius: 11px;
            background: var(--accent-primary); opacity: 0; transition: width .2s ease, opacity .2s ease; }
        .toggle-switch.vp-tri[data-s="1"]::before { width: 40px; opacity: 1; }
        .toggle-switch.vp-tri[data-s="2"]::before { width: 58px; opacity: 1; }
        .toggle-switch.vp-tri[data-s="2"]::after { left: 38px !important;
            background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230080ff' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 9.5v5h3.5L12 18.5V5.5L7.5 9.5z'/%3E%3Cpath d='M16 9a4 4 0 0 1 0 6'/%3E%3C/svg%3E") center / 12px no-repeat !important; }
        .vp-tri-text { display: flex; flex-direction: column; gap: 1px; }
        .vp-tri-text small { font-size: 11.5px; color: var(--text-secondary); }
        .vp-nuksta-hidden { display: none !important; }
        .vp-sec-title { font-size: 12px; font-weight: 600; letter-spacing: .02em; color: var(--text-secondary);
            margin: 12px 12px 6px; }
        .vp-like-inline { max-height: none !important; }
        .vp-settings-tabs .settings-option.vp-dim { opacity: .4; pointer-events: none; }
        .vp-pals { position: fixed; inset: 0; z-index: 9000; pointer-events: none; overflow: hidden; }
        html.vp-ev-scene:not(.vp-msgs-open):not(.vp-gal-open) .vp-pals { display: none !important; }
        .vp-pals { transition: opacity .3s ease, visibility 0s; }
        html.vp-blackout .vp-pals { opacity: 0; visibility: hidden; transition: opacity .3s ease, visibility 0s .3s; }
        .vp-pal { position: absolute; bottom: 0; box-sizing: content-box; padding: 70px; margin: -70px; width: auto; height: calc(min(var(--vp-pal-h, 45vh), calc(48vw * var(--vp-pal-r, 1))) * var(--vp-pal-k, 1)); pointer-events: none;
            user-select: none; -webkit-user-drag: none; animation: vpPalIn .7s cubic-bezier(.2, .9, .3, 1.15) both; }
        .vp-pal-miku { right: 0; transform: translate(calc((100% - 92px) * var(--vp-pal-dx, .06)), calc((100% - 92px) * .05)); }
        .vp-pal-teto { left: 0; transform: scaleX(-1) translate(calc((100% - 92px) * var(--vp-pal-dx, .06)), calc((100% - 92px) * .05)); }
        .vp-pals[data-look="neon"] .vp-pal-miku { filter: drop-shadow(0 0 1.5px rgba(120, 255, 245, .9)) drop-shadow(0 0 10px rgba(57, 197, 187, .55)); }
        .vp-pals[data-look="neon"] .vp-pal-teto { filter: drop-shadow(0 0 1.5px rgba(255, 150, 170, .9)) drop-shadow(0 0 10px rgba(255, 77, 109, .55)); }
        .vp-pals[data-look="dim"] .vp-pal { filter: brightness(.82) saturate(.85) contrast(1.05) drop-shadow(0 10px 28px rgba(0, 0, 0, .65)); }
        .vp-pals-phone { -webkit-mask-image: linear-gradient(to top, transparent calc(var(--vp-pal-nav, 0px) - 6px), #000 calc(var(--vp-pal-nav, 0px) + 20px));
            mask-image: linear-gradient(to top, transparent calc(var(--vp-pal-nav, 0px) - 6px), #000 calc(var(--vp-pal-nav, 0px) + 20px)); }
        .vp-pals-phone .vp-pal { bottom: calc(var(--vp-pal-nav, 0px) - 4px); }
        html.vp-pals-r { scrollbar-width: none !important; scrollbar-gutter: auto !important; }
        html.vp-pals-r::-webkit-scrollbar { display: none !important; }
        @keyframes vpPalIn { from { translate: 0 60%; opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .vp-pal { animation: none; } }
        .vp-rcard-move { display: flex; gap: 2px; margin-left: auto; margin-right: 10px; }
        .vp-rcard-move button { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: inherit; cursor: pointer; }
        .vp-rcard-move button:hover:not(:disabled) { background: rgba(127, 127, 127, .18); }
        .vp-rcard-move button:disabled { opacity: .25; cursor: default; }
        .vp-rcards-hint { padding: 2px 12px 8px; font-size: 12px; opacity: .55; }
        .vp-tab-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none;
            touch-action: pan-y; -webkit-overflow-scrolling: touch; margin: 0 -12px -12px; padding: 0 12px 12px; }
        .vp-tab-body::-webkit-scrollbar { display: none; }
        .vp-pick-grid { display: grid; grid-template-columns: 1fr 1fr; grid-auto-flow: column; gap: 2px 4px; }
        .vp-pick-grid .nick-style-option { padding: 8px 8px !important; gap: 8px !important; font-size: 13px !important; min-width: 0; margin: 0 !important; }
        .vp-pick-grid .nick-style-option:hover { transform: none !important; }
        .vp-pick-grid .nick-style-option > span:not(.vp-opt-check) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-pick-grid .vp-opt-check { display: none; }
        .vp-pick-grid .style-color-dot { width: 18px !important; height: 18px !important; }
        .vp-stab { flex: 1 1 auto; min-width: 0; border: 0; background: none; cursor: pointer; font: inherit; font-size: 13px;
            padding: 7px 2px; white-space: nowrap; border-radius: 13px; color: var(--text-secondary); transition: background .15s ease, color .15s ease; }
        .vp-stab:hover { color: var(--text-primary, #fff); }
        .vp-stab.vp-active { color: var(--text-primary, #fff); font-weight: 600;
            background: color-mix(in srgb, var(--vp-accent) 22%, transparent);
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 45%, transparent); }
        .vp-icon-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .vp-icon-tile { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; padding: 6px 2px 5px;
            border: 0; border-radius: 14px; background: none; cursor: pointer; font: inherit; color: var(--text-secondary); }
        .vp-icon-tile img { width: 44px; height: 44px; border-radius: 11px; display: block; }
        .vp-icon-tile span { font-size: 10.5px; line-height: 1.15; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vp-icon-tile:hover { background: var(--bg-hover, rgba(0, 128, 255, 0.15)); }
        .vp-icon-tile.vp-active { color: var(--text-primary, #fff);
            background: color-mix(in srgb, var(--vp-accent) 16%, transparent);
            box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vp-accent) 45%, transparent); }
        .vp-icon-own { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.1)); }
        .vp-icon-own-title { font-size: 13px; font-weight: 600; color: var(--text-primary, #fff); margin: 0 4px 8px; }
        .vp-icon-own-row { display: flex; align-items: center; gap: 10px; padding: 0 4px; }
        .vp-icon-emoji { width: 44px; height: 44px; flex: 0 0 44px; box-sizing: border-box; text-align: center; font-size: 24px; padding: 0;
            border-radius: 12px; border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15)); outline: none;
            background: color-mix(in srgb, var(--text-primary, #fff) 6%, transparent); color: var(--text-primary, #fff); }
        .vp-icon-emoji:focus { border-color: var(--vp-accent); }
        .vp-icon-bgs { display: flex; flex-wrap: wrap; gap: 5px; }
        .vp-icon-bg { width: 20px; height: 20px; border-radius: 50%; border: 0; padding: 0; cursor: pointer;
            box-shadow: inset 0 0 0 1px rgba(127, 127, 127, .35); }
        .vp-icon-bg.vp-active { box-shadow: 0 0 0 2px var(--block-bg), 0 0 0 4px var(--vp-accent); }
        .vp-icon-upload { width: 100%; margin-top: 12px; padding: 10px 12px; border-radius: 16px; cursor: pointer; font: inherit; font-size: 14px;
            border: 1px dashed var(--border-color, rgba(255, 255, 255, 0.2)); background: none; color: var(--text-primary, #fff); }
        .vp-icon-upload:hover { background: var(--bg-hover, rgba(0, 128, 255, 0.15)); }
        .vp-icon-note { font-size: 11.5px; line-height: 1.35; margin: 8px 4px 2px; color: var(--text-secondary); }
    `);

