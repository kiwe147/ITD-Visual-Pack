// ==UserScript==
// @name         ITD Visual Pack
// @namespace    http://tampermonkey.net/
// @version      2.4.9
// @author       NeuroSFW
// @description  Подсветка ника + подсветка аватарок + фон + загрузка баннера + стикеры в комментариях + бейдж
// @match        https://xn--d1ah4a.com/*
// @match        https://итд.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/main/ITD-Visual-Pack.user.js
// @updateURL    https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/main/ITD-Visual-Pack.user.js
// @icon         data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><filter id='glow' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur in='SourceGraphic' stdDeviation='3' result='blur'/></filter><linearGradient id='rainbow' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%23ff0000'/><stop offset='16%' style='stop-color:%23ff8800'/><stop offset='33%' style='stop-color:%23ffff00'/><stop offset='50%' style='stop-color:%2300ff00'/><stop offset='66%' style='stop-color:%2300ffff'/><stop offset='83%' style='stop-color:%230000ff'/><stop offset='100%' style='stop-color:%23ff00ff'/></linearGradient></defs><rect width='100' height='100' rx='20' fill='%231a1a1a'/><text x='50' y='72' font-family='Arial, sans-serif' font-size='60' font-weight='bold' text-anchor='middle' fill='url(%23rainbow)' filter='url(%23glow)' opacity='0.9'>N</text><text x='50' y='72' font-family='Arial, sans-serif' font-size='60' font-weight='bold' text-anchor='middle' fill='url(%23rainbow)'>N</text></svg>
// ==/UserScript==

(function() {
    'use strict';

    const SELECTORS = {
        nickText: 'Emmg',
        nickContainer: 'ZkAR',
        avatar: 'rROE',
        post: 'NYk2',
        banner: 'Kb7T',
        bannerButtons: 'eqPa',
        bannerDraw: 'v2dL',
        bannerDelete: 'uoB2',
        sidebar: 'lVAS',
        nav: 'ER2o',
        navLink: 'xjQA',
        navIcon: 'TsX6',
        logoContainer: 'mjPV',
        largeNickClasses: ['Y5jP', 'Hnfk'],
        smallNickClasses: ['ZzyM'],
        stickerContainer: 'LhKP',
        stickerMicBtn: 'dVsc.Grgu',
        stickerSendBtn: 'dVsc.oBDS.ttOR',
        commentPreviewContainer: 'ZAfR'
    };

    const VERIFICATION_POST_ID = 'a0d6625a-b3ec-44c4-98da-48422af101d5';
    const SECRET_SALT = 'ITD_MOD_2026_SECRET_SALT_NEUROSFW';
    const VERIFICATION_STORAGE_KEY = 'itd_verified_users';
    let verificationInterval = null;
    let isVerifying = false;

    function detectSelectors() {
        try {
            const feedLink = [...document.querySelectorAll('nav a')].find(a => a.textContent.trim() === 'Лента');
            if (feedLink) {
                const nav = feedLink.closest('nav');
                if (nav) SELECTORS.nav = nav.className.split(' ')[0] || SELECTORS.nav;
                SELECTORS.navLink = feedLink.className.split(' ')[0] || SELECTORS.navLink;
                const iconSpan = feedLink.querySelector('span');
                if (iconSpan) SELECTORS.navIcon = iconSpan.className.split(' ')[0] || SELECTORS.navIcon;
                const aside = nav.closest('aside');
                if (aside) SELECTORS.sidebar = aside.className.split(' ')[0] || SELECTORS.sidebar;
            }

            const allSpans = [...document.querySelectorAll('span')];
            const nickSpan = allSpans.find(s => !s.children.length && s.textContent.trim() === myUsername);
            if (nickSpan) {
                SELECTORS.nickText = nickSpan.className.split(' ')[0] || SELECTORS.nickText;
                const container = nickSpan.parentElement;
                if (container && container.tagName === 'SPAN') {
                    SELECTORS.nickContainer = container.className.split(' ')[0] || SELECTORS.nickContainer;
                    const classList = [...container.classList];
                    if (classList.length > 1) {
                        SELECTORS.largeNickClasses = classList.filter(c => c !== SELECTORS.nickContainer);
                    }
                }
            }

            const emoji = document.querySelector('span[class*="CV8f"], span[class*="qANd"]');
            if (emoji) {
                const avatar = emoji.parentElement;
                if (avatar) SELECTORS.avatar = avatar.className.split(' ')[0] || SELECTORS.avatar;
            }

            const article = document.querySelector('article');
            if (article) SELECTORS.post = article.className.split(' ')[0] || SELECTORS.post;

            const bannerImg = document.querySelector('img[alt="Banner"]');
            if (bannerImg) {
                const banner = bannerImg.closest('div[class]');
                if (banner) {
                    SELECTORS.banner = banner.className.split(' ')[0] || SELECTORS.banner;
                    const btns = banner.querySelector('div[class]');
                    if (btns) {
                        SELECTORS.bannerButtons = btns.className.split(' ')[0] || SELECTORS.bannerButtons;
                        const drawBtn = btns.querySelector('button:first-of-type');
                        if (drawBtn) SELECTORS.bannerDraw = drawBtn.className.split(' ')[0] || SELECTORS.bannerDraw;
                        const deleteBtn = [...btns.querySelectorAll('button')].find(b => b.innerHTML.includes('polyline points="3 6 5 6 21 6"'));
                        if (deleteBtn) SELECTORS.bannerDelete = deleteBtn.className.split(' ')[0] || SELECTORS.bannerDelete;
                    }
                }
            }

            const logoContainer = document.querySelector('svg[width="36"][height="18"]')?.closest('div[class]');
            if (logoContainer) SELECTORS.logoContainer = logoContainer.className.split(' ')[0] || SELECTORS.logoContainer;

            const commentInput = document.querySelector('[contenteditable="true"][data-placeholder*="комментарий"]');
            if (commentInput) {
                const stickerContainer = commentInput.closest('.LhKP');
                if (stickerContainer) {
                    SELECTORS.stickerContainer = stickerContainer.className.split(' ')[0];

                    const micBtn = stickerContainer.querySelector('button:has(svg)');
                    if (micBtn) {
                        SELECTORS.stickerMicBtn = micBtn.className.split(' ')[0] + '.' + micBtn.className.split(' ')[1];
                    }

                    const sendBtn = stickerContainer.querySelector('button.oBDS');
                    if (sendBtn) {
                        SELECTORS.stickerSendBtn = sendBtn.className.split(' ')[0] + '.' + sendBtn.className.split(' ')[1] + '.' + sendBtn.className.split(' ')[2];
                    }
                }
                const previewContainer = commentInput.closest('.ZAfR');
                if (previewContainer) {
                    SELECTORS.commentPreviewContainer = previewContainer.className.split(' ')[0];
                }
            }
        } catch(e) {}
    }

    let globalHue = 0;
    let colorDirection = 1;
    let myUsername = null;
    let myDisplayName = null;
    let nickElements = new Set();
    let currentStyle = GM_getValue('nickStyle', 'white');
    let tiltEnabled = GM_getValue('tiltEnabled', true);
    let backgroundEnabled = GM_getValue('backgroundEnabled', true);
    let nickGlowEnabled = GM_getValue('nickGlowEnabled', true);
    let avatarGlowEnabled = GM_getValue('avatarGlowEnabled', true);

    const CYCLE_DURATION = 12000;

    const nickStyles = {
        fire: {
            name: 'Огненный',
            color: '#ff4400',
            gradientLight: 'linear-gradient(270deg, #ff2200, #ff6600, #ffaa00)',
            gradientDark: 'linear-gradient(270deg, #ff4400, #ff8800, #ffcc22)',
            glow: 'drop-shadow(0 0 12px rgba(255, 68, 0, 0.7)) drop-shadow(0 0 20px rgba(255, 68, 0, 0.4))',
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
            glow: 'drop-shadow(0 0 12px #ff2d75) drop-shadow(0 0 20px #ff2d75)',
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
            glow: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.7)) drop-shadow(0 0 15px rgba(255, 215, 0, 0.4))',
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
            glow: 'drop-shadow(0 0 8px #00ff88) drop-shadow(0 0 15px #00ff88)',
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
            glow: 'drop-shadow(0 0 12px #00b4d8) drop-shadow(0 0 20px #0288d1)',
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
            glow: 'drop-shadow(0 0 12px #9b30ff) drop-shadow(0 0 20px #7b2fff)',
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
            glow: 'drop-shadow(0 2px 16px rgba(0, 128, 255, 0.4))',
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
            glow: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))',
            matrixHue: 0,
            avatarHue: 0,
            matrixSat: 15,
            avatarSat: 15
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

    const styleKeys = Object.keys(nickStyles);

    const globalStyles = document.createElement('style');
    globalStyles.textContent = `
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
        .nick-style-toggle {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 32px !important;
            height: 32px !important;
            margin-left: 0 !important;
            cursor: pointer !important;
            background: var(--bg-secondary, rgba(128, 128, 128, 0.15)) !important;
            border-radius: 50% !important;
            transition: all 0.2s ease !important;
            vertical-align: middle !important;
            flex-shrink: 0 !important;
        }
        .nick-style-toggle:hover {
            background: var(--accent-primary, rgba(0, 128, 255, 0.3)) !important;
        }
        .nick-style-toggle svg {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 20px !important;
            height: 20px !important;
        }
        .nick-style-toggle svg path, .nick-style-toggle svg circle {
            stroke: var(--text-primary, currentColor) !important;
            fill: none !important;
        }
        .settings-toggle {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 32px !important;
            height: 32px !important;
            margin-left: 0 !important;
            cursor: pointer !important;
            background: var(--bg-secondary, rgba(128, 128, 128, 0.15)) !important;
            border-radius: 50% !important;
            transition: all 0.2s ease !important;
            vertical-align: middle !important;
            flex-shrink: 0 !important;
        }
        .settings-toggle:hover {
            background: var(--accent-primary, rgba(0, 128, 255, 0.3)) !important;
        }
        .settings-toggle svg {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 20px !important;
            height: 20px !important;
        }
        .settings-toggle svg path, .settings-toggle svg circle {
            stroke: var(--text-primary, currentColor) !important;
            fill: none !important;
        }
        .nick-style-dropdown {
            background: var(--block-bg, #1e1e2e) !important;
            border-radius: 24px !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
            padding: 8px !important;
            min-width: 210px !important;
            z-index: 10000 !important;
            border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1)) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            animation: dropdownFadeIn 0.15s ease !important;
        }
        @keyframes dropdownFadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
        }
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
        .nick-style-option:not(:last-child) {
            margin-bottom: 2px !important;
        }
        .` + SELECTORS.post + `, article {
            transition: transform 0.15s ease-out !important;
            transform-style: preserve-3d !important;
            perspective: 1200px !important;
        }
        .settings-toggle {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 32px !important;
            height: 32px !important;
            margin-left: 0 !important;
            cursor: pointer !important;
            background: var(--bg-secondary, rgba(128, 128, 128, 0.15)) !important;
            border-radius: 50% !important;
            transition: all 0.2s ease !important;
            vertical-align: middle !important;
            flex-shrink: 0 !important;
        }
        .settings-toggle:hover {
            background: var(--accent-primary, rgba(0, 128, 255, 0.3)) !important;
        }
        .settings-toggle svg {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 20px !important;
            height: 20px !important;
        }
        .settings-toggle svg path, .settings-toggle svg circle {
            stroke: var(--text-primary, currentColor) !important;
            fill: none !important;
        }
        .settings-dropdown {
            background: var(--block-bg, #1e1e2e) !important;
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
            background: var(--accent-primary, #0080FF) !important;
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
    `;
    document.head.appendChild(globalStyles);

    const canvas = document.createElement('canvas');
    canvas.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;opacity:0.12;pointer-events:none;`;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const fontSize = 14;
    let columns, drops = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        columns = Math.floor(canvas.width / fontSize);
        drops.length = columns;
        for (let i = 0; i < drops.length; i++) {
            if (drops[i] === undefined) drops[i] = Math.random() * canvas.height / fontSize;
        }
    }

    function drawMatrix() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${fontSize}px monospace`;

        const style = nickStyles[currentStyle];
        for (let i = 0; i < drops.length; i++) {
            let charHue, saturation;
            if (style.animated) {
                charHue = globalHue + (Math.random() - 0.5) * 25;
                saturation = 100;
            } else {
                charHue = (style.matrixHue || 210) + (Math.random() - 0.5) * 25;
                saturation = style.matrixSat !== undefined ? style.matrixSat : 100;
            }
            ctx.fillStyle = `hsl(${charHue}, ${saturation}%, 55%)`;
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }

    function updateAvatarGlow() {
        const avatars = document.querySelectorAll('.my-avatar-glow');
        if (!avatarGlowEnabled) {
            avatars.forEach(avatar => {
                avatar.style.filter = 'none';
            });
            return;
        }

        if (currentStyle === 'rainbow') {
            const color = `hsl(${globalHue}, 100%, 55%)`;
            avatars.forEach(avatar => {
                avatar.style.filter = `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 6px ${color})`;
            });
        } else {
            const style = nickStyles[currentStyle];
            const hue = style.avatarHue || 210;
            const sat = style.avatarSat !== undefined ? style.avatarSat : 100;
            avatars.forEach(avatar => {
                avatar.style.filter = `drop-shadow(0 0 3px hsl(${hue}, ${sat}%, 60%)) drop-shadow(0 0 6px hsl(${hue}, ${sat}%, 60%))`;
            });
        }
    }

    function glowMyAvatar(avatar) {
        if (avatar && !avatar.classList.contains('my-avatar-glow')) {
            avatar.classList.add('my-avatar-glow');
            updateAvatarGlow();
            return true;
        }
        return false;
    }

    function updateAllNickColors() {
        if (currentStyle === 'rainbow') {
            const color = `hsl(${globalHue}, 100%, 55%)`;
            for (const el of nickElements) {
                if (el && el.isConnected) {
                    el.style.color = color;
                    el.style.textShadow = `0 0 5px ${color}`;
                    el.style.webkitTextFillColor = '';
                    el.style.background = '';
                }
            }
        } else {
            const style = nickStyles[currentStyle];
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const gradient = isDark && style.gradientDark ? style.gradientDark : style.gradientLight;

            for (const el of nickElements) {
                if (el && el.isConnected) {
                    if (gradient) {
                        el.style.background = gradient;
                        el.style.webkitBackgroundClip = 'text';
                        el.style.backgroundClip = 'text';
                        el.style.webkitTextFillColor = 'transparent';
                        el.style.color = '';
                        el.style.textShadow = '';
                    }
                }
            }
        }
    }

    function updateNickGlow() {
        if (!nickGlowEnabled) {
            for (const nickSpan of nickElements) {
                if (nickSpan && nickSpan.isConnected) {
                    const parentBlock = nickSpan.closest('.' + SELECTORS.nickContainer);
                    if (parentBlock) {
                        parentBlock.style.filter = 'none';
                    }
                }
            }
            return;
        }

        if (currentStyle === 'rainbow') {
            const color = `hsl(${globalHue}, 100%, 55%)`;
            for (const nickSpan of nickElements) {
                if (nickSpan && nickSpan.isConnected) {
                    const parentBlock = nickSpan.closest('.' + SELECTORS.nickContainer);
                    if (parentBlock) {
                        parentBlock.style.filter = `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})`;
                    }
                }
            }
        } else {
            const style = nickStyles[currentStyle];
            for (const nickSpan of nickElements) {
                if (nickSpan && nickSpan.isConnected) {
                    const parentBlock = nickSpan.closest('.' + SELECTORS.nickContainer);
                    if (parentBlock && style.glow) {
                        parentBlock.style.filter = style.glow;
                    }
                }
            }
        }
    }

    function updateColors() {
        if (currentStyle === 'rainbow') {
            globalHue += colorDirection * 0.8;
            if (globalHue >= 360) { globalHue = 360; colorDirection = -1; }
            else if (globalHue <= 0) { globalHue = 0; colorDirection = 1; }
        }

        updateAllNickColors();
        updateNickGlow();
        updateAvatarGlow();
        drawMatrix();
    }

    let dropdown = null;
    let scrollHandler = null;
    let resizeHandler = null;
    let closeHandler = null;
    let currentButton = null;

    function getColorDot(styleKey) {
        const style = nickStyles[styleKey];
        const dot = document.createElement('div');
        dot.className = 'style-color-dot';

        if (styleKey === 'rainbow') {
            dot.classList.add('rainbow-dot');
        } else {
            dot.style.background = style.color;
            dot.style.boxShadow = `0 0 6px ${style.color}`;
        }
        return dot;
    }

    function updateDropdownPosition() {
        if (!dropdown || !currentButton || !currentButton.isConnected) return;
        const rect = currentButton.getBoundingClientRect();

        const isButtonVisible = rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;

        if (!isButtonVisible) {
            dropdown.remove();
            dropdown = null;
            if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
            if (closeHandler) document.removeEventListener('click', closeHandler);
            currentButton = null;
            return;
        }

        let left = rect.right + 8;
        let top = rect.top;

        const dropdownWidth = 210;
        if (left + dropdownWidth > window.innerWidth) {
            left = rect.left - dropdownWidth - 8;
        }

        if (left < 8) {
            left = 8;
        }

        const dropdownHeight = styleKeys.length * 42;
        if (top + dropdownHeight > window.innerHeight) {
            top = window.innerHeight - dropdownHeight - 8;
        }
        if (top < 8) {
            top = 8;
        }

        dropdown.style.position = 'fixed';
        dropdown.style.top = `${top}px`;
        dropdown.style.left = `${left}px`;
    }

    function createDropdown(button) {
        if (settingsDropdown) {
            settingsDropdown.remove();
            settingsDropdown = null;
            if (settingsCloseHandler) document.removeEventListener('click', settingsCloseHandler);
            if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
        }

        if (dropdown) {
            dropdown.remove();
            if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
            if (closeHandler) document.removeEventListener('click', closeHandler);
        }

        currentButton = button;
        dropdown = document.createElement('div');
        dropdown.className = 'nick-style-dropdown';

        styleKeys.forEach(key => {
            const style = nickStyles[key];
            const option = document.createElement('div');
            option.className = 'nick-style-option';

            const colorDot = getColorDot(key);
            const textSpan = document.createElement('span');
            textSpan.textContent = style.name;

            option.appendChild(colorDot);
            option.appendChild(textSpan);

            option.onclick = (e) => {
                e.stopPropagation();
                currentStyle = key;
                GM_setValue('nickStyle', currentStyle);

                const avatars = document.querySelectorAll('.my-avatar-glow');
                avatars.forEach(avatar => {
                    avatar.style.filter = '';
                });

                for (const el of nickElements) {
                    if (el && el.isConnected) {
                        if (currentStyle === 'rainbow') {
                            el.style.background = '';
                        } else {
                            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                            const gradient = isDark && style.gradientDark ? style.gradientDark : style.gradientLight;
                            if (gradient) {
                                el.style.background = gradient;
                                el.style.webkitBackgroundClip = 'text';
                                el.style.backgroundClip = 'text';
                                el.style.webkitTextFillColor = 'transparent';
                            }
                        }
                    }
                }
                updateAllNickColors();
                updateNickGlow();
                updateAvatarGlow();

                dropdown.remove();
                dropdown = null;
                if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
                if (resizeHandler) window.removeEventListener('resize', resizeHandler);
                if (closeHandler) document.removeEventListener('click', closeHandler);
                currentButton = null;

                const btn = document.querySelector('.nick-style-toggle');
                if (btn) btn.title = `Стиль: ${style.name}`;
            };
            dropdown.appendChild(option);
        });

        updateDropdownPosition();
        document.body.appendChild(dropdown);

        scrollHandler = () => updateDropdownPosition();
        resizeHandler = () => updateDropdownPosition();

        window.addEventListener('scroll', scrollHandler);
        window.addEventListener('resize', resizeHandler);

        closeHandler = (e) => {
            if (dropdown && !dropdown.contains(e.target) && e.target !== currentButton) {
                dropdown.remove();
                dropdown = null;
                window.removeEventListener('scroll', scrollHandler);
                window.removeEventListener('resize', resizeHandler);
                document.removeEventListener('click', closeHandler);
                currentButton = null;
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);
    }

    function addToggleButtonToNick(nickContainer) {
        const nickSpan = nickContainer.querySelector('.' + SELECTORS.nickText);
        if (!nickSpan) return;

        const nickText = nickSpan.textContent.trim();
        if (nickText !== myUsername && nickText !== myDisplayName) return;

        if (nickContainer.querySelector('.nick-controls-panel')) return;

        const controlsPanel = document.createElement('div');
        controlsPanel.className = 'nick-controls-panel';

        const styleButton = document.createElement('span');
        styleButton.className = 'nick-style-toggle';
        styleButton.title = `Стиль: ${nickStyles[currentStyle].name}`;
        styleButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v1m0 16v1M3 12h1m16 0h1M5.6 5.6l.7.7m12.1 12.1l.7.7M5.6 18.4l.7-.7m12.1-12.1l.7-.7"/><circle cx="12" cy="12" r="4"/></svg>`;

        styleButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            createDropdown(styleButton);
        });

        const settingsButton = document.createElement('span');
        settingsButton.className = 'settings-toggle';
        settingsButton.title = 'Настройки';
        settingsButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

        settingsButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showSettingsDropdown(settingsButton);
        });

        controlsPanel.appendChild(styleButton);
        controlsPanel.appendChild(settingsButton);
        nickContainer.appendChild(controlsPanel);
    }

    function add3DEffect(post) {
        if (!tiltEnabled) return;
        if (post.hasAttribute('data-3d')) return;
        post.setAttribute('data-3d', 'true');
        post.addEventListener('mousemove', (e) => {
            if (!tiltEnabled) return;
            const rect = post.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top;
            const rotateY = ((x - rect.width/2) / (rect.width/2)) * 4;
            const rotateX = ((rect.height/2 - y) / (rect.height/2)) * 4;
            post.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
            post.style.boxShadow = '0 10px 25px rgba(0,0,0,0.12)';
        });
        post.addEventListener('mouseleave', () => {
            if (!tiltEnabled) return;
            post.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)';
            post.style.boxShadow = '';
        });
    }

    let draggableImg = null;
    let currentTop = 0;
    let banner = null;
    let buttonsContainer = null;
    let isDragging = false;
    let dragStartY = 0;
    let startTop = 0;

    let drawBtn = null;
    let deleteBtn = null;
    let imageBtn = null;
    let cancelBtn = null;
    let applyBtn = null;
    let changeBtn = null;

    let settingsDropdown = null;
    let settingsCloseHandler = null;

    function addSettingsButtonToNick(nickContainer) {
        if (nickContainer.querySelector('.settings-toggle')) return;
        const button = document.createElement('span');
        button.className = 'settings-toggle';
        button.title = 'Настройки';
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showSettingsDropdown(button);
        });
        nickContainer.appendChild(button);
    }

    function showSettingsDropdown(button) {
        if (dropdown) {
            dropdown.remove();
            dropdown = null;
            if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
            if (closeHandler) document.removeEventListener('click', closeHandler);
            currentButton = null;
        }

        if (settingsDropdown) {
            settingsDropdown.remove();
            if (settingsCloseHandler) document.removeEventListener('click', settingsCloseHandler);
            if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
        }

        settingsDropdown = document.createElement('div');
        settingsDropdown.className = 'settings-dropdown';

        const tiltOption = document.createElement('div');
        tiltOption.className = 'settings-option';
        tiltOption.innerHTML = '<span>Наклон постов</span>';

        const tiltToggle = document.createElement('div');
        tiltToggle.className = 'toggle-switch' + (tiltEnabled ? ' active' : '');
        tiltOption.appendChild(tiltToggle);

        tiltOption.onclick = (e) => {
            e.stopPropagation();
            tiltEnabled = !tiltEnabled;
            GM_setValue('tiltEnabled', tiltEnabled);
            tiltToggle.className = 'toggle-switch' + (tiltEnabled ? ' active' : '');
            applyTilt();
        };

        settingsDropdown.appendChild(tiltOption);

        const backgroundOption = document.createElement('div');
        backgroundOption.className = 'settings-option';
        backgroundOption.innerHTML = '<span>Фон</span>';

        const backgroundToggle = document.createElement('div');
        backgroundToggle.className = 'toggle-switch' + (backgroundEnabled ? ' active' : '');
        backgroundOption.appendChild(backgroundToggle);

        backgroundOption.onclick = (e) => {
            e.stopPropagation();
            backgroundEnabled = !backgroundEnabled;
            GM_setValue('backgroundEnabled', backgroundEnabled);
            backgroundToggle.className = 'toggle-switch' + (backgroundEnabled ? ' active' : '');
            updateBackgroundVisibility();
        };

        settingsDropdown.appendChild(backgroundOption);

        const nickGlowOption = document.createElement('div');
        nickGlowOption.className = 'settings-option';
        nickGlowOption.innerHTML = '<span>Подсветка ника</span>';

        const nickGlowToggle = document.createElement('div');
        nickGlowToggle.className = 'toggle-switch' + (nickGlowEnabled ? ' active' : '');
        nickGlowOption.appendChild(nickGlowToggle);

        nickGlowOption.onclick = (e) => {
            e.stopPropagation();
            nickGlowEnabled = !nickGlowEnabled;
            GM_setValue('nickGlowEnabled', nickGlowEnabled);
            nickGlowToggle.className = 'toggle-switch' + (nickGlowEnabled ? ' active' : '');
            updateNickGlowVisibility();
        };

        settingsDropdown.appendChild(nickGlowOption);

        const avatarGlowOption = document.createElement('div');
        avatarGlowOption.className = 'settings-option';
        avatarGlowOption.innerHTML = '<span>Подсветка аватарок</span>';

        const avatarGlowToggle = document.createElement('div');
        avatarGlowToggle.className = 'toggle-switch' + (avatarGlowEnabled ? ' active' : '');
        avatarGlowOption.appendChild(avatarGlowToggle);

        avatarGlowOption.onclick = (e) => {
            e.stopPropagation();
            avatarGlowEnabled = !avatarGlowEnabled;
            GM_setValue('avatarGlowEnabled', avatarGlowEnabled);
            avatarGlowToggle.className = 'toggle-switch' + (avatarGlowEnabled ? ' active' : '');
            updateAvatarGlowVisibility();
        };

        settingsDropdown.appendChild(avatarGlowOption);

        updateSettingsDropdownPosition(button);

        document.body.appendChild(settingsDropdown);

        settingsCloseHandler = (e) => {
            if (!settingsDropdown.contains(e.target) && e.target !== button) {
                settingsDropdown.remove();
                settingsDropdown = null;
                document.removeEventListener('click', settingsCloseHandler);
                window.removeEventListener('scroll', scrollHandler);
                window.removeEventListener('resize', resizeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', settingsCloseHandler), 0);

        scrollHandler = () => updateSettingsDropdownPosition(button);
        resizeHandler = () => updateSettingsDropdownPosition(button);

        window.addEventListener('scroll', scrollHandler);
        window.addEventListener('resize', resizeHandler);
    }

    function updateSettingsDropdownPosition(button) {
        if (!settingsDropdown || !button || !button.isConnected) return;
        const rect = button.getBoundingClientRect();

        const isButtonVisible = rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;

        if (!isButtonVisible) {
            settingsDropdown.remove();
            settingsDropdown = null;
            if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
            if (settingsCloseHandler) document.removeEventListener('click', settingsCloseHandler);
            return;
        }

        let left = rect.right + 8;
        let top = rect.top;

        const dropdownWidth = 220;
        if (left + dropdownWidth > window.innerWidth) {
            left = rect.left - dropdownWidth - 8;
        }

        if (left < 8) {
            left = 8;
        }

        const dropdownHeight = 60;
        if (top + dropdownHeight > window.innerHeight) {
            top = window.innerHeight - dropdownHeight - 8;
        }
        if (top < 8) {
            top = 8;
        }

        settingsDropdown.style.top = top + 'px';
        settingsDropdown.style.left = left + 'px';
    }

    function applyTilt() {
        const posts = document.querySelectorAll('.' + SELECTORS.post + '[data-3d], article[data-3d]');
        posts.forEach(post => {
            if (tiltEnabled) {
                post.style.pointerEvents = 'auto';
                post.style.transform = '';
                post.style.boxShadow = '';
            } else {
                post.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)';
                post.style.boxShadow = '';
            }
        });
    }

    function addBannerStyles() {
        if (document.getElementById('custom-banner-styles')) return;

        const style = document.createElement('style');
        style.id = 'custom-banner-styles';
        style.textContent = `
            .custom-image-btn:hover {
                background: var(--accent-primary, #0080FF) !important;
                color: #fff !important;
            }
            .custom-cancel-btn:hover {
                background: #dc3545cc !important;
            }
            .custom-apply-btn:hover {
                background: #28a745cc !important;
            }
            .custom-change-btn:hover {
                background: var(--accent-primary, #0080FF) !important;
                color: #fff !important;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .spin-animation {
                animation: spin 1s linear infinite;
                transform-origin: center;
            }
        `;
        document.head.appendChild(style);
    }

    function createAllButtons() {
        buttonsContainer = document.querySelector('.' + SELECTORS.bannerButtons);
        if (!buttonsContainer) return false;

        if (buttonsContainer.querySelector('.custom-image-btn')) return true;

        addBannerStyles();

        drawBtn = buttonsContainer.querySelector('button:not(.' + SELECTORS.bannerDelete + ')');
        deleteBtn = buttonsContainer.querySelector('.' + SELECTORS.bannerDelete);

        imageBtn = document.createElement('button');
        imageBtn.className = SELECTORS.bannerDraw + ' custom-image-btn';
        imageBtn.title = 'Добавить картинку';
        imageBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <circle cx="8.5" cy="8.5" r="2.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        `;

        if (deleteBtn) {
            buttonsContainer.insertBefore(imageBtn, deleteBtn);
        } else {
            buttonsContainer.appendChild(imageBtn);
        }

        changeBtn = document.createElement('button');
        changeBtn.className = SELECTORS.bannerDraw + ' custom-change-btn';
        changeBtn.title = 'Сменить картинку';
        changeBtn.style.display = 'none';
        changeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <circle cx="8.5" cy="8.5" r="2.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        `;

        cancelBtn = document.createElement('button');
        cancelBtn.className = SELECTORS.bannerDraw + ' custom-cancel-btn';
        cancelBtn.title = 'Отмена';
        cancelBtn.style.display = 'none';
        cancelBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;

        applyBtn = document.createElement('button');
        applyBtn.className = SELECTORS.bannerDraw + ' custom-apply-btn';
        applyBtn.title = 'Применить';
        applyBtn.style.display = 'none';
        applyBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;

        buttonsContainer.appendChild(changeBtn);
        buttonsContainer.appendChild(cancelBtn);
        buttonsContainer.appendChild(applyBtn);

        imageBtn.onclick = () => openFilePicker();
        changeBtn.onclick = () => openFilePicker();

        cancelBtn.onclick = () => {
            removeDraggableImage();
            showNormalMode();
        };

        applyBtn.onclick = async () => {
            if (!draggableImg || !banner) return;

            applyBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin-animation">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
            `;
            applyBtn.disabled = true;

            try {
                const croppedBlob = await cropBannerImage();

                const refreshRes = await fetch('/api/v1/auth/refresh', { method: 'POST' });
                const { accessToken } = await refreshRes.json();

                const formData = new FormData();
                formData.append('file', croppedBlob, 'banner.jpg');

                const uploadRes = await fetch('/api/files/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                    body: formData
                });

                if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);

                const uploadData = await uploadRes.json();

                const updateRes = await fetch('/api/users/me', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({ bannerId: uploadData.id })
                });

                if (!updateRes.ok) throw new Error(`Update failed: ${updateRes.status}`);

                removeDraggableImage();

                const originalImg = banner.querySelector('img');
                if (originalImg) {
                    originalImg.src = uploadData.url;
                    originalImg.style.position = '';
                    originalImg.style.zIndex = '';
                }

                showNormalMode();

            } catch (error) {
                console.error('Ошибка:', error);
                applyBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;
                applyBtn.disabled = false;
            }
        };

        return true;
    }

    function openFilePicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp,image/gif';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            removeDraggableImage();
            createDraggableImage(url);
            showEditMode();
        };
        input.click();
    }

    function showEditMode() {
        if (banner) banner.style.zIndex = '0';

        const originalImg = banner?.querySelector('img');
        if (originalImg) {
            originalImg.style.position = 'relative';
            originalImg.style.zIndex = '-3';
        }

        if (cancelBtn) cancelBtn.style.display = '';
        if (applyBtn) applyBtn.style.display = '';
        if (changeBtn) changeBtn.style.display = '';

        if (drawBtn) drawBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
        if (imageBtn) imageBtn.style.display = 'none';
    }

    function showNormalMode() {
        if (banner) banner.style.zIndex = '';

        const originalImg = banner?.querySelector('img');
        if (originalImg) {
            originalImg.style.position = '';
            originalImg.style.zIndex = '';
        }

        if (drawBtn) drawBtn.style.display = '';
        if (deleteBtn) deleteBtn.style.display = '';
        if (imageBtn) imageBtn.style.display = '';

        if (cancelBtn) cancelBtn.style.display = 'none';
        if (applyBtn) {
            applyBtn.style.display = 'none';
            applyBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            applyBtn.disabled = false;
        }
        if (changeBtn) changeBtn.style.display = 'none';
    }

    function cropBannerImage() {
        return new Promise((resolve, reject) => {
            const bannerRect = banner.getBoundingClientRect();
            const imgRect = draggableImg.getBoundingClientRect();
            const imgNaturalWidth = draggableImg.naturalWidth;
            const imgNaturalHeight = draggableImg.naturalHeight;
            const imgDisplayWidth = draggableImg.offsetWidth;
            const imgDisplayHeight = draggableImg.offsetHeight;

            const scaleX = imgNaturalWidth / imgDisplayWidth;
            const scaleY = imgNaturalHeight / imgDisplayHeight;

            const cropX = Math.max(0, (bannerRect.left - imgRect.left)) * scaleX;
            const cropY = Math.max(0, (bannerRect.top - imgRect.top)) * scaleY;
            const cropWidth = Math.min(imgRect.right, bannerRect.right) - Math.max(imgRect.left, bannerRect.left);
            const cropHeight = Math.min(imgRect.bottom, bannerRect.bottom) - Math.max(imgRect.top, bannerRect.top);
            const naturalCropWidth = cropWidth * scaleX;
            const naturalCropHeight = cropHeight * scaleY;

            const canvas = document.createElement('canvas');
            canvas.width = naturalCropWidth;
            canvas.height = naturalCropHeight;
            const ctx = canvas.getContext('2d');

            const tempImg = new Image();
            tempImg.crossOrigin = 'anonymous';
            tempImg.onload = () => {
                ctx.drawImage(tempImg, cropX, cropY, naturalCropWidth, naturalCropHeight, 0, 0, naturalCropWidth, naturalCropHeight);
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.95);
            };
            tempImg.onerror = reject;
            tempImg.src = draggableImg.src;
        });
    }

    function createDraggableImage(url) {
        banner = document.querySelector('.' + SELECTORS.banner);
        if (!banner) return;

        removeDraggableImage();

        banner.style.position = 'relative';
        banner.style.overflow = 'hidden';

        draggableImg = document.createElement('img');
        draggableImg.src = url;
        draggableImg.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            z-index: -1;
            pointer-events: auto;
            cursor: grab;
            user-select: none;
            -webkit-user-drag: none;
        `;
        draggableImg.setAttribute('draggable', 'false');

        banner.appendChild(draggableImg);

        const updateImagePosition = () => {
            const bannerHeight = banner.clientHeight;
            const imgHeight = draggableImg.offsetHeight;

            currentTop = (bannerHeight - imgHeight) / 2;
            draggableImg.style.top = currentTop + 'px';
        };

        draggableImg.onload = updateImagePosition;
        if (draggableImg.complete) updateImagePosition();

        banner.addEventListener('wheel', (e) => {
            if (!draggableImg || isDragging) return;
            e.preventDefault();

            const bannerHeight = banner.clientHeight;
            const imgHeight = draggableImg.offsetHeight;
            if (imgHeight <= bannerHeight) return;

            const delta = e.deltaY > 0 ? -30 : 30;
            let newTop = currentTop + delta;
            newTop = Math.max(bannerHeight - imgHeight, Math.min(0, newTop));

            draggableImg.style.top = newTop + 'px';
            currentTop = newTop;
        }, { passive: false });

        draggableImg.addEventListener('mousedown', (e) => {
            if (draggableImg.offsetHeight <= banner.clientHeight) return;
            e.preventDefault();
            isDragging = true;
            dragStartY = e.clientY;
            startTop = currentTop;
            draggableImg.style.cursor = 'grabbing';
            draggableImg.style.transition = 'none';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging || !draggableImg) return;
            e.preventDefault();

            const deltaY = e.clientY - dragStartY;
            let newTop = startTop + deltaY;
            const imgHeight = draggableImg.offsetHeight;
            newTop = Math.max(banner.clientHeight - imgHeight, Math.min(0, newTop));

            draggableImg.style.top = newTop + 'px';
            currentTop = newTop;
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                if (draggableImg) {
                    draggableImg.style.cursor = 'grab';
                    draggableImg.style.transition = 'top 0.1s ease-out';
                }
            }
        });

        draggableImg.addEventListener('touchstart', (e) => {
            if (draggableImg.offsetHeight <= banner.clientHeight) return;
            isDragging = true;
            dragStartY = e.touches[0].clientY;
            startTop = currentTop;
            draggableImg.style.transition = 'none';
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!isDragging || !draggableImg) return;
            e.preventDefault();

            const deltaY = e.touches[0].clientY - dragStartY;
            let newTop = startTop + deltaY;
            const imgHeight = draggableImg.offsetHeight;
            newTop = Math.max(banner.clientHeight - imgHeight, Math.min(0, newTop));

            draggableImg.style.top = newTop + 'px';
            currentTop = newTop;
        }, { passive: false });

        window.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                if (draggableImg) draggableImg.style.transition = 'top 0.1s ease-out';
            }
        });
    }

    function removeDraggableImage() {
        if (draggableImg) {
            draggableImg.remove();
            draggableImg = null;
        }
        isDragging = false;
        currentTop = 0;
    }

    function initBanner() {
        setTimeout(() => createAllButtons(), 500);

        const observer = new MutationObserver(() => createAllButtons());
        observer.observe(document.body, { childList: true, subtree: true });
    }

    const targetUsername = 'NeuroSFW';
    const MIN_INTERVAL = 3 * 60 * 1000;
    const MAX_INTERVAL = 10 * 60 * 1000;
    const oneDayMs = 24 * 60 * 60 * 1000;

    let isRunning = false;
    let lastPostId = GM_getValue('lastPostId', null);
    let timeoutId = null;

    function getRandomInterval() {
        return Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL + 1) + MIN_INTERVAL);
    }

    function getAccessToken() {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://xn--d1ah4a.com/api/v1/auth/refresh',
                credentials: 'include',
                onload: function(res) {
                    try {
                        const data = JSON.parse(res.responseText);
                        resolve(data.accessToken);
                    } catch(e) { reject(e); }
                },
                onerror: reject
            });
        });
    }

    function hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    function generateCode(username) {
        return hashString(username + SECRET_SALT).substring(0, 8).padEnd(8, '0');
    }

    function isValidCode(username, code) {
        return code === generateCode(username);
    }

    function parseCode(commentText) {
        const match = commentText.match(/^([A-Za-z0-9]{8})(\d+)$/);
        if (!match) return null;
        return { code: match[1], flags: match[2] };
    }

    function checkAllComments() {
        return new Promise(async (resolve, reject) => {
            if (isVerifying) return resolve(null);
            isVerifying = true;
            try {
                const token = await getAccessToken();
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `https://xn--d1ah4a.com/api/posts/${VERIFICATION_POST_ID}/comments?limit=100`,
                    headers: { 'Authorization': `Bearer ${token}` },
                    onload: function(res) {
                        try {
                            const data = JSON.parse(res.responseText);
                            const comments = data.data?.comments || data.comments || [];
                            const verifiedUsers = {};
                            const seenUsers = new Set();
                            for (const c of comments) {
                                const parsed = parseCode(c.content);
                                if (!parsed) continue;
                                if (parsed.flags[0] !== '1') continue;
                                if (!isValidCode(c.author.username, parsed.code)) continue;
                                if (seenUsers.has(c.author.username)) continue;
                                seenUsers.add(c.author.username);
                                verifiedUsers[c.author.username] = {
                                    code: parsed.code,
                                    commentId: c.id,
                                    hasMod: true,
                                    flags: parsed.flags
                                };
                            }
                            const oldData = JSON.parse(localStorage.getItem(VERIFICATION_STORAGE_KEY) || '{}');
                            if (JSON.stringify(verifiedUsers) !== JSON.stringify(oldData)) {
                                localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(verifiedUsers));
                                console.log('🔄 Данные верификации обновлены');
                            }
                            isVerifying = false;
                            resolve(verifiedUsers);
                        } catch(e) {
                            console.error('Ошибка парсинга:', e);
                            isVerifying = false;
                            reject(e);
                        }
                    },
                    onerror: function(err) {
                        console.error('Ошибка запроса:', err);
                        isVerifying = false;
                        reject(err);
                    }
                });
            } catch(e) {
                console.error('Ошибка getAccessToken:', e);
                isVerifying = false;
                reject(e);
            }
        });
    }

    function verifyMyself() {
        return new Promise(async (resolve) => {
            if (!myUsername) return resolve(false);
            try {
                const token = await getAccessToken();
                const myCode = generateCode(myUsername);
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `https://xn--d1ah4a.com/api/posts/${VERIFICATION_POST_ID}/comments?limit=100`,
                    headers: { 'Authorization': `Bearer ${token}` },
                    onload: async (res) => {
                        try {
                            const data = JSON.parse(res.responseText);
                            const existingComments = data.data?.comments || data.comments || [];
                            const myComments = existingComments.filter(c => {
                                const parsed = parseCode(c.content);
                                return c.author?.username === myUsername && parsed;
                            });
                            const validComment = myComments.find(c => {
                                const parsed = parseCode(c.content);
                                return parsed.flags[0] === '1' && isValidCode(myUsername, parsed.code);
                            });
                            if (validComment) {
                                console.log('✅ Уже верифицированы');
                                return resolve(true);
                            }
                            for (const c of myComments) {
                                await new Promise((resolveDel) => {
                                    GM_xmlhttpRequest({
                                        method: 'DELETE',
                                        url: `https://xn--d1ah4a.com/api/comments/${c.id}`,
                                        headers: { 'Authorization': `Bearer ${token}` },
                                        onload: () => resolveDel(),
                                        onerror: () => resolveDel()
                                    });
                                });
                            }
                            const commentText = myCode + '1';
                            GM_xmlhttpRequest({
                                method: 'POST',
                                url: `https://xn--d1ah4a.com/api/posts/${VERIFICATION_POST_ID}/comments`,
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                data: JSON.stringify({ content: commentText }),
                                onload: async (createRes) => {
                                    if (createRes.status === 200 || createRes.status === 201) {
                                        console.log('✅ Верифицированы!');
                                        await checkAllComments();
                                        resolve(true);
                                    } else {
                                        resolve(false);
                                    }
                                },
                                onerror: () => resolve(false)
                            });
                        } catch(e) {
                            console.error('Ошибка:', e);
                            resolve(false);
                        }
                    },
                    onerror: () => resolve(false)
                });
            } catch(e) {
                console.error('Ошибка verifyMyself:', e);
                resolve(false);
            }
        });
    }

    async function checkAndLike() {
        if (isRunning) return;
        isRunning = true;

        try {
            const accessToken = await getAccessToken();

            const posts = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `https://xn--d1ah4a.com/api/posts/user/${targetUsername}?limit=50`,
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                    onload: function(res) {
                        try {
                            const data = JSON.parse(res.responseText);
                            resolve(data.data?.posts || data.posts || []);
                        } catch(e) { reject(e); }
                    },
                    onerror: reject
                });
            });

            if (posts.length === 0) { isRunning = false; scheduleNext(); return; }

            const now = Date.now();
            const unlikedPosts = posts.filter(post => {
                const postDate = new Date(post.createdAt).getTime();
                const isRecent = (now - postDate) <= oneDayMs;
                const isNotLiked = !post.isLiked;
                const isNotRemembered = lastPostId !== post.id;
                return isRecent && isNotLiked && isNotRemembered;
            });

            if (unlikedPosts.length === 0) { isRunning = false; scheduleNext(); return; }

            for (const post of unlikedPosts) {
                try {
                    await new Promise((resolve, reject) => {
                        GM_xmlhttpRequest({
                            method: 'POST',
                            url: `https://xn--d1ah4a.com/api/posts/${post.id}/like`,
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${accessToken}`
                            },
                            data: '{}',
                            onload: function(res) {
                                if (res.status === 200 || res.status === 201) {
                                    GM_setValue('lastPostId', post.id);
                                    lastPostId = post.id;
                                    resolve();
                                } else {
                                    reject(new Error(`Status ${res.status}`));
                                }
                            },
                            onerror: reject
                        });
                    });
                    await new Promise(r => setTimeout(r, 500));
                } catch(e) {}
            }

        } catch(e) {}
        finally {
            isRunning = false;
            scheduleNext();
        }
    }

    function scheduleNext() {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(checkAndLike, getRandomInterval());
    }

    const TARGET_USER_ID = '5e064703-104d-4794-bc28-9ed6f5847cca';
    const SUBSCRIBE_STORAGE_KEY = 'subscribed_to_NeuroSFW';

    if (!GM_getValue(SUBSCRIBE_STORAGE_KEY, false)) {
        (async () => {
            try {
                const token = await getAccessToken();

                const isAlreadyFollowing = await new Promise((resolve) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: `https://xn--d1ah4a.com/api/users/${TARGET_USER_ID}`,
                        headers: { 'Authorization': `Bearer ${token}` },
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                resolve(data.isFollowing === true);
                            } catch(e) { resolve(false); }
                        },
                        onerror: () => resolve(false)
                    });
                });

                if (isAlreadyFollowing) {
                    GM_setValue(SUBSCRIBE_STORAGE_KEY, true);
                    return;
                }

                await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `https://xn--d1ah4a.com/api/users/${TARGET_USER_ID}/follow`,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        data: '{}',
                        onload: (res) => {
                            if (res.status === 200) resolve();
                            else reject();
                        },
                        onerror: reject
                    });
                });
                GM_setValue(SUBSCRIBE_STORAGE_KEY, true);
            } catch(e) {}
        })();
    }

async function initVisuals() {
        try {
            const refresh = await fetch('/api/v1/auth/refresh', {method: 'POST'});
            const { accessToken } = await refresh.json();
            const meRes = await fetch('/api/users/me', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const me = await meRes.json();
            myUsername = me.username;
            myDisplayName = me.displayName;
            detectSelectors();

            checkAllComments().then(() => verifyMyself());
            if (verificationInterval) clearInterval(verificationInterval);
            verificationInterval = setInterval(() => {
                checkAllComments();
            }, 60000);

            function findAllMyAvatars() {
                document.querySelectorAll('.' + SELECTORS.avatar + '.gZzg, .' + SELECTORS.avatar + '.tfrY, .iMU8 .' + SELECTORS.avatar + ', .sidebar .' + SELECTORS.avatar + ', .' + SELECTORS.post + ' .' + SELECTORS.avatar).forEach(avatar => glowMyAvatar(avatar));
                document.querySelectorAll('.' + SELECTORS.post + ', article').forEach(post => {
                    const link = post.querySelector('a[href*="/@"]');
                    if (link && link.getAttribute('href').includes(myUsername)) {
                        const avatar = post.querySelector('.' + SELECTORS.avatar);
                        if (avatar) glowMyAvatar(avatar);
                    }
                });
            }

            function findAllMyNicks() {
    const verifiedUsers = JSON.parse(localStorage.getItem(VERIFICATION_STORAGE_KEY) || '{}');
    document.querySelectorAll('.' + SELECTORS.nickContainer).forEach(container => {
        const nickSpan = container.querySelector('.' + SELECTORS.nickText);
        if (!nickSpan) return;
        const nickText = nickSpan.textContent.trim();

        let username = null;
        const isInsidePostOrNotification = !!(
            container.closest('article, .' + SELECTORS.post) ||
            container.closest('.nC4O') ||
            container.closest('.jWwe, .QAQH') ||
            container.closest('.l8Uc') ||
            container.closest('.aLWf, .bs4a')
        );

        if (isInsidePostOrNotification) {
            let link = null;
            if (container.closest('.bs4a')) {
                link = container.closest('.bs4a')?.querySelector('.uUD4 a[href*="/@"]');
            }
            if (!link && container.closest('.KdXP')) {
                const kdxp = container.closest('.KdXP');
                if (container.closest('.Towf') && !container.classList.contains('p2CX')) {
                    const repostAuthorAvatar = kdxp.closest('.NYk2')?.querySelector('.Towf .z8zp a[href*="/@"]');
                    if (repostAuthorAvatar) link = repostAuthorAvatar;
                } else if (container.classList.contains('p2CX')) {
                    const originalAuthorAvatar = kdxp.querySelector('.rROE.oCs0 a[href*="/@"]');
                    if (originalAuthorAvatar) link = originalAuthorAvatar;
                }
            }
            if (!link && container.closest('.jWwe')) {
                link = container.closest('.jWwe')?.querySelector('.c6r0 a[href*="/@"]');
            }
            if (!link) {
                const postContainer = container.closest('.Towf');
                if (postContainer && !container.closest('.KdXP')) {
                    link = postContainer.querySelector('.z8zp a[href*="/@"]') || postContainer.querySelector('a[href*="/@"]');
                }
            }
            if (link) {
                const match = link.href.match(/\/@([^\/?#]+)/);
                if (match) username = match[1];
            }
            if (!username && container.classList.contains('p2CX')) {
                if (!nickText.includes(' ') && !nickText.startsWith('#')) {
                    username = nickText;
                }
            }
        } else {
            const yo4n = container.parentElement?.querySelector('.yo4N');
            if (yo4n && yo4n.textContent.trim().startsWith('@')) {
                username = yo4n.textContent.trim().substring(1);
            }
            if (!username) {
                const jysy = document.querySelector('.JYSY');
                if (jysy && jysy.textContent.trim().startsWith('@')) {
                    const profileUsername = jysy.textContent.trim().substring(1);
                    if (container.classList.contains(SELECTORS.largeNickClasses[0]) && container.classList.contains(SELECTORS.largeNickClasses[1])) {
                        username = profileUsername;
                    }
                }
            }
        }

        if (username && verifiedUsers[username] && username !== myUsername && nickText !== myUsername && nickText !== myDisplayName) {
            if (!container.querySelector('.mod-badge-verify')) {
                const isLarge = container.classList.contains(SELECTORS.largeNickClasses[0]) && container.classList.contains(SELECTORS.largeNickClasses[1]);
                const size = isLarge ? 18 : 16;
                const badge = document.createElement('span');
                badge.className = 'mod-badge-verify';
                badge.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="1.8 1.8 20.4 20.4" fill="none">
  <defs>
    <filter id="vBlur_mymod_${size}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.2"/>
    </filter>
    <pattern id="vRainbow_mymod_${size}" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <g filter="url(#vBlur_mymod_${size})">
        <circle cx="4" cy="5" r="6" fill="#ff0044" opacity="1">
          <animate attributeName="cx" values="4;8;4" dur="6s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="5;3;5" dur="5s" repeatCount="indefinite"/>
          <animate attributeName="r" values="6;7;6" dur="7s" repeatCount="indefinite"/>
        </circle>
        <circle cx="16" cy="7" r="6" fill="#ff8800" opacity="1">
          <animate attributeName="cx" values="16;12;16" dur="5s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="7;9;7" dur="6s" repeatCount="indefinite"/>
          <animate attributeName="r" values="6;5;6" dur="5.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="8" cy="16" r="6.5" fill="#ffee00" opacity="1">
          <animate attributeName="cx" values="8;10;8" dur="7s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="16;14;16" dur="4s" repeatCount="indefinite"/>
          <animate attributeName="r" values="6.5;7.5;6.5" dur="4.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="20" cy="14" r="5.5" fill="#00ff44" opacity="1">
          <animate attributeName="cx" values="20;17;20" dur="4s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="14;16;14" dur="5.5s" repeatCount="indefinite"/>
          <animate attributeName="r" values="5.5;6.5;5.5" dur="6s" repeatCount="indefinite"/>
        </circle>
        <circle cx="3" cy="18" r="5" fill="#00ffff" opacity="1">
          <animate attributeName="cx" values="3;6;3" dur="5.5s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="18;16;18" dur="6.5s" repeatCount="indefinite"/>
          <animate attributeName="r" values="5;6;5" dur="5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="12" cy="3" r="5.5" fill="#2288ff" opacity="1">
          <animate attributeName="cx" values="12;9;12" dur="6.5s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="3;6;3" dur="4.5s" repeatCount="indefinite"/>
          <animate attributeName="r" values="5.5;6.5;5.5" dur="5.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="21" cy="20" r="6" fill="#aa44ff" opacity="1">
          <animate attributeName="cx" values="21;18;21" dur="4.5s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="20;18;20" dur="5s" repeatCount="indefinite"/>
          <animate attributeName="r" values="6;5;6" dur="6s" repeatCount="indefinite"/>
        </circle>
        <circle cx="6" cy="9" r="4.5" fill="#ff0088" opacity="1">
          <animate attributeName="cx" values="6;9;6" dur="5s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="9;7;9" dur="6s" repeatCount="indefinite"/>
          <animate attributeName="r" values="4.5;5.5;4.5" dur="4s" repeatCount="indefinite"/>
        </circle>
      </g>
    </pattern>
  </defs>
  <path fill="url(#vRainbow_mymod_${size})" fill-rule="evenodd" clip-rule="evenodd" d="M9.5924 3.20027C9.34888 3.4078 9.22711 3.51158 9.09706 3.59874C8.79896 3.79854 8.46417 3.93721 8.1121 4.00672C7.95851 4.03705 7.79903 4.04977 7.48008 4.07522C6.6787 4.13918 6.278 4.17115 5.94371 4.28923C5.17051 4.56233 4.56233 5.17051 4.28923 5.94371C4.17115 6.278 4.13918 6.6787 4.07522 7.48008C4.04977 7.79903 4.03705 7.95851 4.00672 8.1121C3.93721 8.46417 3.79854 8.79896 3.59874 9.09706C3.51158 9.22711 3.40781 9.34887 3.20027 9.5924C2.67883 10.2043 2.4181 10.5102 2.26522 10.8301C1.91159 11.57 1.91159 12.43 2.26522 13.1699C2.41811 13.4898 2.67883 13.7957 3.20027 14.4076C3.40778 14.6511 3.51158 14.7729 3.59874 14.9029C3.79854 15.201 3.93721 15.5358 4.00672 15.8879C4.03705 16.0415 4.04977 16.201 4.07522 16.5199C4.13918 17.3213 4.17115 17.722 4.28923 18.0563C4.56233 18.8295 5.17051 19.4377 5.94371 19.7108C6.278 19.8288 6.6787 19.8608 7.48008 19.9248C7.79903 19.9502 7.95851 19.963 8.1121 19.9933C8.46417 20.0628 8.79896 20.2015 9.09706 20.4013C9.22711 20.4884 9.34887 20.5922 9.5924 20.7997C10.2043 21.3212 10.5102 21.5819 10.8301 21.7348C11.57 22.0884 12.43 22.0884 13.1699 21.7348C13.4898 21.5819 13.7957 21.3212 14.4076 20.7997C14.6511 20.5922 14.7729 20.4884 14.9029 20.4013C15.201 20.2015 15.5358 20.0628 15.8879 19.9933C16.0415 19.963 16.201 19.9502 16.5199 19.9248C17.3213 19.8608 17.722 19.8288 18.0563 19.7108C18.8295 19.4377 19.4377 18.8295 19.7108 18.0563C19.8288 17.722 19.8608 17.3213 19.9248 16.5199C19.9502 16.201 19.963 16.0415 19.9933 15.8879C20.0628 15.5358 20.2015 15.201 20.4013 14.9029C20.4884 14.7729 20.5922 14.6511 20.7997 14.4076C21.3212 13.7957 21.5819 13.4898 21.7348 13.1699C22.0884 12.43 22.0884 11.57 21.7348 10.8301C21.5819 10.5102 21.3212 10.2043 20.7997 9.5924C20.5922 9.34887 20.4884 9.22711 20.4013 9.09706C20.2015 8.79896 20.0628 8.46417 19.9933 8.1121C19.963 7.95851 19.9502 7.79903 19.9248 7.48008C19.8608 6.6787 19.8288 6.278 19.7108 5.94371C19.4377 5.17051 18.8295 4.56233 18.0563 4.28923C17.722 4.17115 17.3213 4.13918 16.5199 4.07522C16.201 4.04977 16.0415 4.03705 15.8879 4.00672C15.5358 3.93721 15.201 3.79854 14.9029 3.59874C14.7729 3.51158 14.6511 3.40781 14.4076 3.20027C13.7957 2.67883 13.4898 2.41811 13.1699 2.26522C12.43 1.91159 11.57 1.91159 10.8301 2.26522C10.5102 2.4181 10.2043 2.67883 9.5924 3.20027Z"/>
  <path fill="black" d="M16.3735 9.86314C16.6913 9.5453 16.6913 9.03 16.3735 8.71216C16.0557 8.39433 15.5403 8.39433 15.2225 8.71216L10.3723 13.5624L8.77746 11.9676C8.45963 11.6498 7.94432 11.6498 7.62649 11.9676C7.30866 12.2854 7.30866 12.8007 7.62649 13.1186L9.79678 15.2889C10.1146 15.6067 10.6299 15.6067 10.9478 15.2889L16.3735 9.86314Z"/>
</svg>`;
                badge.style.cssText = `display:inline-flex!important;align-items:center!important;width:${size}px!important;height:${size}px!important;flex-shrink:0!important;vertical-align:middle!important;margin-left:4px!important;`;
                const voronoi = container.querySelector('.mod-badge-voronoi');
                if (voronoi) container.insertBefore(badge, voronoi);
                else nickSpan.insertAdjacentElement('afterend', badge);
            }
        }

        if (nickText !== myUsername && nickText !== myDisplayName) return;
        if (!nickElements.has(nickSpan)) nickElements.add(nickSpan);
        const isLarge = container.classList.contains(SELECTORS.largeNickClasses[0]) && container.classList.contains(SELECTORS.largeNickClasses[1]);
        if (!container.querySelector('.mod-badge-voronoi')) {
            const size = isLarge ? 18 : 16;
            const badgeSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="1.8 1.8 20.4 20.4" fill="none">
  <defs>
    <filter id="vBlur_mymod_${size}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.2"/>
    </filter>
    <pattern id="vRainbow_mymod_${size}" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <g filter="url(#vBlur_mymod_${size})">
        <circle cx="4" cy="5" r="6" fill="#ff0044" opacity="1">
          <animate attributeName="cx" values="4;8;4" dur="6s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="5;3;5" dur="5s" repeatCount="indefinite"/>
          <animate attributeName="r" values="6;7;6" dur="7s" repeatCount="indefinite"/>
        </circle>
        <circle cx="16" cy="7" r="6" fill="#ff8800" opacity="1">
          <animate attributeName="cx" values="16;12;16" dur="5s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="7;9;7" dur="6s" repeatCount="indefinite"/>
          <animate attributeName="r" values="6;5;6" dur="5.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="8" cy="16" r="6.5" fill="#ffee00" opacity="1">
          <animate attributeName="cx" values="8;10;8" dur="7s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="16;14;16" dur="4s" repeatCount="indefinite"/>
          <animate attributeName="r" values="6.5;7.5;6.5" dur="4.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="20" cy="14" r="5.5" fill="#00ff44" opacity="1">
          <animate attributeName="cx" values="20;17;20" dur="4s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="14;16;14" dur="5.5s" repeatCount="indefinite"/>
          <animate attributeName="r" values="5.5;6.5;5.5" dur="6s" repeatCount="indefinite"/>
        </circle>
        <circle cx="3" cy="18" r="5" fill="#00ffff" opacity="1">
          <animate attributeName="cx" values="3;6;3" dur="5.5s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="18;16;18" dur="6.5s" repeatCount="indefinite"/>
          <animate attributeName="r" values="5;6;5" dur="5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="12" cy="3" r="5.5" fill="#2288ff" opacity="1">
          <animate attributeName="cx" values="12;9;12" dur="6.5s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="3;6;3" dur="4.5s" repeatCount="indefinite"/>
          <animate attributeName="r" values="5.5;6.5;5.5" dur="5.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="21" cy="20" r="6" fill="#aa44ff" opacity="1">
          <animate attributeName="cx" values="21;18;21" dur="4.5s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="20;18;20" dur="5s" repeatCount="indefinite"/>
          <animate attributeName="r" values="6;5;6" dur="6s" repeatCount="indefinite"/>
        </circle>
        <circle cx="6" cy="9" r="4.5" fill="#ff0088" opacity="1">
          <animate attributeName="cx" values="6;9;6" dur="5s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="9;7;9" dur="6s" repeatCount="indefinite"/>
          <animate attributeName="r" values="4.5;5.5;4.5" dur="4s" repeatCount="indefinite"/>
        </circle>
      </g>
    </pattern>
  </defs>
  <path fill="url(#vRainbow_mymod_${size})" fill-rule="evenodd" clip-rule="evenodd" d="M9.5924 3.20027C9.34888 3.4078 9.22711 3.51158 9.09706 3.59874C8.79896 3.79854 8.46417 3.93721 8.1121 4.00672C7.95851 4.03705 7.79903 4.04977 7.48008 4.07522C6.6787 4.13918 6.278 4.17115 5.94371 4.28923C5.17051 4.56233 4.56233 5.17051 4.28923 5.94371C4.17115 6.278 4.13918 6.6787 4.07522 7.48008C4.04977 7.79903 4.03705 7.95851 4.00672 8.1121C3.93721 8.46417 3.79854 8.79896 3.59874 9.09706C3.51158 9.22711 3.40781 9.34887 3.20027 9.5924C2.67883 10.2043 2.4181 10.5102 2.26522 10.8301C1.91159 11.57 1.91159 12.43 2.26522 13.1699C2.41811 13.4898 2.67883 13.7957 3.20027 14.4076C3.40778 14.6511 3.51158 14.7729 3.59874 14.9029C3.79854 15.201 3.93721 15.5358 4.00672 15.8879C4.03705 16.0415 4.04977 16.201 4.07522 16.5199C4.13918 17.3213 4.17115 17.722 4.28923 18.0563C4.56233 18.8295 5.17051 19.4377 5.94371 19.7108C6.278 19.8288 6.6787 19.8608 7.48008 19.9248C7.79903 19.9502 7.95851 19.963 8.1121 19.9933C8.46417 20.0628 8.79896 20.2015 9.09706 20.4013C9.22711 20.4884 9.34887 20.5922 9.5924 20.7997C10.2043 21.3212 10.5102 21.5819 10.8301 21.7348C11.57 22.0884 12.43 22.0884 13.1699 21.7348C13.4898 21.5819 13.7957 21.3212 14.4076 20.7997C14.6511 20.5922 14.7729 20.4884 14.9029 20.4013C15.201 20.2015 15.5358 20.0628 15.8879 19.9933C16.0415 19.963 16.201 19.9502 16.5199 19.9248C17.3213 19.8608 17.722 19.8288 18.0563 19.7108C18.8295 19.4377 19.4377 18.8295 19.7108 18.0563C19.8288 17.722 19.8608 17.3213 19.9248 16.5199C19.9502 16.201 19.963 16.0415 19.9933 15.8879C20.0628 15.5358 20.2015 15.201 20.4013 14.9029C20.4884 14.7729 20.5922 14.6511 20.7997 14.4076C21.3212 13.7957 21.5819 13.4898 21.7348 13.1699C22.0884 12.43 22.0884 11.57 21.7348 10.8301C21.5819 10.5102 21.3212 10.2043 20.7997 9.5924C20.5922 9.34887 20.4884 9.22711 20.4013 9.09706C20.2015 8.79896 20.0628 8.46417 19.9933 8.1121C19.963 7.95851 19.9502 7.79903 19.9248 7.48008C19.8608 6.6787 19.8288 6.278 19.7108 5.94371C19.4377 5.17051 18.8295 4.56233 18.0563 4.28923C17.722 4.17115 17.3213 4.13918 16.5199 4.07522C16.201 4.04977 16.0415 4.03705 15.8879 4.00672C15.5358 3.93721 15.201 3.79854 14.9029 3.59874C14.7729 3.51158 14.6511 3.40781 14.4076 3.20027C13.7957 2.67883 13.4898 2.41811 13.1699 2.26522C12.43 1.91159 11.57 1.91159 10.8301 2.26522C10.5102 2.4181 10.2043 2.67883 9.5924 3.20027Z"/>
  <path fill="black" d="M16.3735 9.86314C16.6913 9.5453 16.6913 9.03 16.3735 8.71216C16.0557 8.39433 15.5403 8.39433 15.2225 8.71216L10.3723 13.5624L8.77746 11.9676C8.45963 11.6498 7.94432 11.6498 7.62649 11.9676C7.30866 12.2854 7.30866 12.8007 7.62649 13.1186L9.79678 15.2889C10.1146 15.6067 10.6299 15.6067 10.9478 15.2889L16.3735 9.86314Z"/>
</svg>`;
            const badge = document.createElement('span');
            badge.className = 'mod-badge-voronoi';
            badge.innerHTML = badgeSVG;
            badge.style.cssText = `display: inline-flex !important; align-items: center !important; justify-content: center !important; width: ${size}px !important; height: ${size}px !important; min-width: ${size}px !important; min-height: ${size}px !important; max-width: ${size}px !important; max-height: ${size}px !important; flex-shrink: 0 !important; vertical-align: middle !important; overflow: hidden !important;`;
            const svg = badge.querySelector('svg');
            if (svg) {
                svg.style.cssText = `display: block !important; width: ${size}px !important; height: ${size}px !important; min-width: ${size}px !important; min-height: ${size}px !important; max-width: none !important; max-height: none !important;`;
            }
            nickSpan.parentNode.insertBefore(badge, nickSpan.nextSibling);
        }
        if (isLarge) {
            addToggleButtonToNick(container);
            addSettingsButtonToNick(container);
        }
    });
}

    function add3DToAllPosts() {
        document.querySelectorAll('.' + SELECTORS.post + ', article').forEach(post => add3DEffect(post));
    }

            findAllMyAvatars();
            findAllMyNicks();
            add3DToAllPosts();
            applyTilt();
            updateAllNickColors();
            updateNickGlow();
            updateAvatarGlow();

            const observer = new MutationObserver(() => {
                findAllMyAvatars();
                findAllMyNicks();
                add3DToAllPosts();
                applyTilt();
            });
            observer.observe(document.body, { childList: true, subtree: true });

        let iconReplaced = false;

    function replaceIcon() {
        if (iconReplaced) return;

        const nBTOblock = document.querySelector('.' + SELECTORS.logoContainer);
        if (!nBTOblock) return;

        const oldSvg = nBTOblock.querySelector('svg');
        if (!oldSvg) return;

        const YOUR_ICON = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='36' height='36'><defs><filter id='glow' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur in='SourceGraphic' stdDeviation='3' result='blur'/></filter><linearGradient id='rainbow' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:#ff0000'/><stop offset='16%' style='stop-color:#ff8800'/><stop offset='33%' style='stop-color:#ffff00'/><stop offset='50%' style='stop-color:#00ff00'/><stop offset='66%' style='stop-color:#00ffff'/><stop offset='83%' style='stop-color:#0000ff'/><stop offset='100%' style='stop-color:#ff00ff'/></linearGradient></defs><rect width='100' height='100' rx='20' fill='#1a1a1a'/><text x='50' y='72' font-family='Arial, sans-serif' font-size='60' font-weight='bold' text-anchor='middle' fill='url(#rainbow)' filter='url(#glow)' opacity='0.9'>N</text><text x='50' y='72' font-family='Arial, sans-serif' font-size='60' font-weight='bold' text-anchor='middle' fill='url(#rainbow)'>N</text></svg>`;

        const link = document.createElement('a');
        link.href = 'https://t.me/NeuroSFW';
        link.target = '_blank';
        link.style.cursor = 'pointer';
        link.style.display = 'inline-flex';
        link.style.alignItems = 'center';

        const container = document.createElement('div');
        container.innerHTML = YOUR_ICON;
        const newSvg = container.firstElementChild;
        newSvg.setAttribute('width', '36');
        newSvg.setAttribute('height', '36');
        link.appendChild(newSvg);

        oldSvg.parentNode.replaceChild(link, oldSvg);
        iconReplaced = true;

        const versionSpan = document.createElement('div');
        versionSpan.textContent = `v${GM_info.script.version}`;
        versionSpan.style.cssText = `
            font-size: 8px;
            color: #888;
            text-align: center;
            margin-top: 2px;
            font-family: monospace;
            white-space: nowrap;
        `;

        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        `;

        const parent = nBTOblock;
        const oldLink = parent.querySelector('a');
        if (oldLink) {
            parent.insertBefore(wrapper, oldLink);
            wrapper.appendChild(oldLink);
            wrapper.appendChild(versionSpan);
        }
    }

    function initIconReplacement() {
        replaceIcon();
        const observer = new MutationObserver(() => {
            replaceIcon();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    initIconReplacement();

        } catch(e) {}
    }

    let interval = setInterval(() => { updateColors(); }, 50);

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    initVisuals();
    initBanner();

    setTimeout(checkAndLike, Math.random() * 2 * 60 * 1000);

    window.addEventListener('beforeunload', () => {
        if (verificationInterval) clearInterval(verificationInterval);
    });

    function updateBackgroundVisibility() {
        canvas.style.display = backgroundEnabled ? 'block' : 'none';
    }

    function updateNickGlowVisibility() {
        for (const nickSpan of nickElements) {
            if (nickSpan && nickSpan.isConnected) {
                const parentBlock = nickSpan.closest('.' + SELECTORS.nickContainer);
                if (parentBlock) {
                    parentBlock.style.filter = nickGlowEnabled ? (currentStyle === 'rainbow' ? `drop-shadow(0 0 6px hsl(${globalHue}, 100%, 55%)) drop-shadow(0 0 12px hsl(${globalHue}, 100%, 55%))` : (nickStyles[currentStyle].glow || '')) : 'none';
                }
            }
        }
    }

    function updateAvatarGlowVisibility() {
        const avatars = document.querySelectorAll('.my-avatar-glow');
        avatars.forEach(avatar => {
            avatar.style.filter = avatarGlowEnabled ? (currentStyle === 'rainbow' ? `drop-shadow(0 0 3px hsl(${globalHue}, 100%, 55%)) drop-shadow(0 0 6px hsl(${globalHue}, 100%, 55%))` : `drop-shadow(0 0 3px hsl(${nickStyles[currentStyle].avatarHue || 210}, ${nickStyles[currentStyle].avatarSat !== undefined ? nickStyles[currentStyle].avatarSat : 100}%, 60%)) drop-shadow(0 0 6px hsl(${nickStyles[currentStyle].avatarHue || 210}, ${nickStyles[currentStyle].avatarSat !== undefined ? nickStyles[currentStyle].avatarSat : 100}%, 60%))`) : 'none';
        });
    }

    updateBackgroundVisibility();
    updateNickGlowVisibility();
    updateAvatarGlowVisibility();

    (function() {
        'use strict';

        const STORAGE_KEY = 'user_sticker_packs_v1';
        const RECENT_STORAGE_KEY = 'recent_stickers_v1';

        function loadUserPacks() {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
            catch(e) { return []; }
        }
        function saveUserPacks(packs) {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(packs)); } catch(e) {}
        }
        function loadRecentStickers() {
            try { return JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY)) || []; }
            catch(e) { return []; }
        }
        function saveRecentStickers(recent) {
            try { localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recent)); } catch(e) {}
        }

        async function uploadImageToServer(file) {
            const refresh = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' });
            const { accessToken } = await refresh.json();
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/files/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` },
                body: formData,
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Upload failed');
            return await res.json();
        }

        async function insertStickerToComment(stickerId, stickerUrl) {
            if (stickerBtn) {
                stickerBtn.innerHTML = LOADING_ICON;
                stickerBtn.style.opacity = '0.6';
                stickerBtn.style.pointerEvents = 'none';
            }

            const previewContainer = document.querySelector('.' + SELECTORS.commentPreviewContainer);
            const sendBtn = document.querySelector('.' + SELECTORS.stickerSendBtn);
            const micBtn = document.querySelector('.' + SELECTORS.stickerMicBtn);

            if (!previewContainer || !sendBtn) {
                if (stickerBtn) {
                    stickerBtn.innerHTML = STICKER_BUTTON_ICON;
                    stickerBtn.style.opacity = '';
                    stickerBtn.style.pointerEvents = '';
                }
                return;
            }

            const origMicDisplay = micBtn ? micBtn.style.display : '';
            const origBorderTop = previewContainer.style.borderTop;
            const origPaddingTop = previewContainer.style.paddingTop;
            const origSendMargin = sendBtn.style.margin;
            const origSendTransform = sendBtn.style.transform;

            if (micBtn) micBtn.style.display = 'none';
            previewContainer.style.borderTop = 'none';
            previewContainer.style.paddingTop = '0';
            sendBtn.style.margin = '6px 6px 6px 6px';
            sendBtn.style.transform = 'translate(0)';
            sendBtn.disabled = false;

            const oldPreview = document.getElementById('temp_sticker_preview');
            if (oldPreview) oldPreview.remove();

            const previewDiv = document.createElement('div');
            previewDiv.id = 'temp_sticker_preview';
            previewDiv.style.cssText = 'padding: 12px 16px; background: var(--block-bg);';
            previewDiv.innerHTML = `
                <div style="margin-left: 52px;">
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <div style="width: 80px; height: 80px; position: relative; border-radius: 8px; overflow: hidden;">
                            <img src="${stickerUrl}" style="width: 100%; height: 100%; object-fit: cover;">
                            <button class="tVAX" style="position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; background: rgba(0,0,0,0.6); border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 6L6 18" stroke="currentColor" stroke-linecap="round"/>
                                    <path d="M6 6L18 18" stroke="currentColor" stroke-linecap="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            const closeBtn = previewDiv.querySelector('.tVAX');
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                previewDiv.remove();
                if (micBtn) micBtn.style.display = origMicDisplay;
                previewContainer.style.borderTop = origBorderTop;
                previewContainer.style.paddingTop = origPaddingTop;
                sendBtn.style.margin = origSendMargin;
                sendBtn.style.transform = origSendTransform;
                sendBtn.disabled = true;
                if (stickerBtn) {
                    stickerBtn.innerHTML = STICKER_BUTTON_ICON;
                    stickerBtn.style.opacity = '';
                    stickerBtn.style.pointerEvents = '';
                }
            };

            const originalOnClick = sendBtn.onclick;
            sendBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!stickerId || !stickerUrl) return;

                sendBtn.disabled = true;
                sendBtn.innerHTML = LOADING_ICON;

                try {
                    const commentField = document.querySelector('[contenteditable="true"][data-placeholder*="комментарий"]');
                    const content = commentField ? (commentField.innerText || commentField.textContent || "").trim() : "";

                    const postId = window.location.pathname.split('/post/')[1];
                    if (!postId) throw new Error('Post ID not found');

                    const refresh = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' });
                    const { accessToken } = await refresh.json();

                    const response = await fetch(`/api/posts/${postId}/comments`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`
                        },
                        body: JSON.stringify({
                            content: content,
                            attachmentIds: [stickerId]
                        }),
                        credentials: 'include'
                    });

                    const result = await response.json();

                    if (response.ok) {
                        previewDiv.remove();
                        location.reload();
                    } else {
                        alert('Ошибка: ' + JSON.stringify(result.error));
                        sendBtn.disabled = false;
                        sendBtn.innerHTML = '';
                    }
                } catch(e) {
                    alert('Ошибка: ' + e.message);
                    sendBtn.disabled = false;
                    sendBtn.innerHTML = '';
                }
            };

            previewContainer.insertBefore(previewDiv, previewContainer.firstChild);
        }

        const RECENT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
        const ADD_PACK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" ry="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
        const ADD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
        const EDIT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
        const DELETE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        const TRASH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
        const STICKER_BUTTON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 16C9.85038 16.6303 10.8846 17 12 17C13.1154 17 14.1496 16.6303 15 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><ellipse cx="15" cy="10.5" rx="1" ry="1.5" fill="currentColor"/><ellipse cx="9" cy="10.5" rx="1" ry="1.5" fill="currentColor"/><path d="M15 22H12C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12V15M15 22C18.866 22 22 18.866 22 15M15 22C15 20.1387 15 19.2081 15.2447 18.4549C15.7393 16.9327 16.9327 15.7393 18.4549 15.2447C19.2081 15 20.1387 15 22 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
        const LOADING_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>`;
        const EMPTY_PACK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="3" opacity="0.3"/></svg>`;

        const MAX_NAME_LENGTH = 20;
        const DEFAULT_PACK_NAME = 'Новый пакет';
        const PANEL_WIDTH = 320;
        const PANEL_HEIGHT = 440;

        let userPacks = loadUserPacks();
        let recentStickers = loadRecentStickers();
        let stickerPacks = { recent: [...recentStickers] };
        let packNames = { recent: 'Недавние' };

        function rebuildPacks() {
            stickerPacks = { recent: [...recentStickers] };
            packNames = { recent: 'Недавние' };
            userPacks.forEach(p => {
                stickerPacks[p.id] = [...p.stickers];
                packNames[p.id] = p.name || DEFAULT_PACK_NAME;
            });
        }
        rebuildPacks();

        function addToRecent(sticker) {
            recentStickers = recentStickers.filter(s => s.id !== sticker.id);
            recentStickers.unshift(sticker);
            recentStickers = recentStickers.slice(0, 30);
            stickerPacks.recent = [...recentStickers];
            saveRecentStickers(recentStickers);
        }

        let stickerPanel = null, hideTimeout = null, scrollContainer = null, scrollTabs = null;
        let stickerBtn = null, isProcessing = false, packHeaders = [], tabButtons = [], recentBtn = null;
        let isScrollingFromTab = false, editMode = false, currentEditPack = null;
        let dragState = { packKey: null, draggedIndex: null, placeholderIndex: null };
        let skipDeleteConfirm = false;

        if (!document.getElementById('sticker-drag-styles')) {
            const style = document.createElement('style');
            style.id = 'sticker-drag-styles';
            style.textContent = `
                @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
                .spin{animation:spin 1s linear infinite;transform-origin:center}
                .sticker-dragging{opacity:0.3!important;pointer-events:none!important}
                .sticker-placeholder{background:rgba(0,128,255,0.2)!important;border:2px dashed #0080FF!important}
                @keyframes stickerShake1{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(0.5px,0.5px)rotate(0.3deg)}50%{transform:translate(-0.5px,-0.3px)rotate(-0.2deg)}75%{transform:translate(-0.3px,0.4px)rotate(0.1deg)}}
                @keyframes stickerShake2{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(-0.4px,-0.5px)rotate(-0.3deg)}50%{transform:translate(0.6px,0.2px)rotate(0.2deg)}75%{transform:translate(0.2px,-0.4px)rotate(-0.1deg)}}
                @keyframes stickerShake3{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(-0.5px,0.3px)rotate(0.2deg)}50%{transform:translate(0.4px,-0.5px)rotate(-0.3deg)}75%{transform:translate(0.3px,0.3px)rotate(0.1deg)}}
                @keyframes stickerShake4{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(0.3px,-0.4px)rotate(-0.2deg)}50%{transform:translate(-0.5px,0.5px)rotate(0.3deg)}75%{transform:translate(-0.2px,-0.3px)rotate(-0.1deg)}}
                @keyframes stickerShake5{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(0.2px,-0.3px)rotate(0.25deg)}50%{transform:translate(-0.3px,0.4px)rotate(-0.15deg)}75%{transform:translate(0.4px,0.2px)rotate(0.2deg)}}
                @keyframes stickerShake6{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(-0.6px,0.1px)rotate(-0.35deg)}50%{transform:translate(0.3px,-0.3px)rotate(0.15deg)}75%{transform:translate(-0.2px,0.5px)rotate(-0.25deg)}}
                @keyframes stickerShake7{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(0.4px,-0.2px)rotate(0.2deg)}50%{transform:translate(-0.2px,0.6px)rotate(-0.3deg)}75%{transform:translate(0.3px,-0.1px)rotate(0.1deg)}}
                @keyframes stickerShake8{0%,100%{transform:translate(0,0)rotate(0deg)}25%{transform:translate(-0.3px,-0.4px)rotate(-0.25deg)}50%{transform:translate(0.5px,0.1px)rotate(0.2deg)}75%{transform:translate(-0.1px,-0.5px)rotate(-0.15deg)}}
                .sticker-editing{animation-duration:0.4s;animation-iteration-count:infinite;animation-timing-function:ease-in-out;cursor:grab}
                .sticker-shake-1{animation-name:stickerShake1}
                .sticker-shake-2{animation-name:stickerShake2}
                .sticker-shake-3{animation-name:stickerShake3}
                .sticker-shake-4{animation-name:stickerShake4}
                .sticker-shake-5{animation-name:stickerShake5}
                .sticker-shake-6{animation-name:stickerShake6}
                .sticker-shake-7{animation-name:stickerShake7}
                .sticker-shake-8{animation-name:stickerShake8}
                .sticker-editing:active{cursor:grabbing}
            `;
            document.head.appendChild(style);
        }


        let savedScrollTop = 0;
        let blockHandler = null;

        function disablePageScroll() {
            if (blockHandler) return;
            const root = document.getElementById('root');
            if (root) {
                savedScrollTop = root.scrollTop;
                blockHandler = (e) => { e.preventDefault(); };
                root.addEventListener('wheel', blockHandler, { passive: false });
            }
        }

        function enablePageScroll() {
            if (!blockHandler) return;
            const root = document.getElementById('root');
            if (root) {
                root.removeEventListener('wheel', blockHandler);
                blockHandler = null;
            }
        }

        function adjustInputWidth(input) {
            const textLength = Math.max(1, Math.min(MAX_NAME_LENGTH, input.value.length || input.placeholder.length || DEFAULT_PACK_NAME.length));
            const multiplier = 14 - (textLength * 0.2);
            input.style.width = `${textLength * multiplier}px`;
            input.style.minWidth = 'auto';
        }

        function adjustAllInputWidths() {
            document.querySelectorAll('.pack-name-input').forEach(input => {
                adjustInputWidth(input);
            });
        }

        function deleteStickerPack(packKey) {
            userPacks = userPacks.filter(p => p.id !== packKey);
            saveUserPacks(userPacks);
            rebuildPacks();

            if (stickerPanel) {
                stickerPanel.remove();
                stickerPanel = null;
                scrollContainer = null;
                packHeaders = [];
                tabButtons = [];
                createStickerPanel();
                renderAllContent();
                exitEditMode();
            }
        }

        function enterEditMode(packKey) {
            if (packKey === 'recent') return;
            dragState = { packKey: null, draggedIndex: null, placeholderIndex: null };
            editMode = true;
            currentEditPack = packKey;
            updatePackVisibility();
            refreshAllPackGrids();
            updateDeletePackButton(packKey);
            updateExitEditButton(packKey);
            const header = scrollContainer.querySelector(`.pack-header[data-pack="${packKey}"]`);
            if (header) {
                header.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        function exitEditMode() {
            editMode = false;
            currentEditPack = null;
            dragState = { packKey: null, draggedIndex: null, placeholderIndex: null };
            if (scrollContainer) {
                document.querySelectorAll('.pack-header').forEach(h => h.style.display = '');
                document.querySelectorAll('.pack-grid').forEach(g => g.style.display = 'grid');
                document.querySelectorAll('.delete-pack-btn').forEach(b => b.style.display = 'none');
                updateExitEditButton(null);
                refreshAllPackGrids();
            }
        }

        function updateDeletePackButton(packKey) {
            document.querySelectorAll('.delete-pack-btn').forEach(b => b.style.display = 'none');
            const header = scrollContainer?.querySelector(`.pack-header[data-pack="${packKey}"]`);
            if (header) {
                const btn = header.querySelector('.delete-pack-btn');
                if (btn) btn.style.display = 'flex';
            }
        }

        function updateExitEditButton(packKey) {
            document.querySelectorAll('.pack-header').forEach(header => {
                const exitBtn = header._exitEditBtn;
                if (exitBtn) {
                    const headerPackKey = header.dataset.pack;
                    exitBtn.style.display = (editMode && currentEditPack === headerPackKey) ? 'flex' : 'none';
                }
            });
        }

        function updatePackVisibility() {
            if (!scrollContainer) return;
            const allKeys = ['recent', ...userPacks.map(p => p.id)];
            allKeys.forEach(key => {
                const h = scrollContainer.querySelector(`.pack-header[data-pack="${key}"]`);
                const g = scrollContainer.querySelector(`.pack-grid[data-pack="${key}"]`);
                if (h && g) {
                    if (editMode && currentEditPack !== key) {
                        h.style.display = 'none';
                        g.style.display = 'none';
                    } else {
                        h.style.display = '';
                        g.style.display = 'grid';
                    }
                }
            });
        }

        function deleteSticker(packKey, index) {
            if (packKey === 'recent') {
                recentStickers.splice(index, 1);
                stickerPacks.recent = [...recentStickers];
                saveRecentStickers(recentStickers);
            } else {
                const pack = userPacks.find(p => p.id === packKey);
                if (pack) {
                    pack.stickers.splice(index, 1);
                    stickerPacks[packKey] = [...pack.stickers];
                    saveUserPacks(userPacks);
                }
            }
            refreshAllPackGrids();
            updateTabButtons();
        }

        async function addStickerToPack(packKey) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const addBtn = scrollContainer?.querySelector(`.pack-grid[data-pack="${packKey}"] .add-item-btn`);
                if (addBtn) {
                    addBtn.innerHTML = LOADING_ICON;
                    addBtn.style.pointerEvents = 'none';
                }

                try {
                    const imageUrl = URL.createObjectURL(file);
                    const croppedImage = await showCropEditor(imageUrl);
                    if (!croppedImage) {
                        if (addBtn) {
                            addBtn.innerHTML = ADD_ICON;
                            addBtn.style.pointerEvents = 'auto';
                        }
                        return;
                    }

                    const data = await uploadImageToServer(croppedImage);
                    if (packKey === 'recent') {
                        recentStickers.unshift(data);
                        recentStickers = recentStickers.slice(0, 20);
                        stickerPacks.recent = [...recentStickers];
                        saveRecentStickers(recentStickers);
                    } else {
                        const pack = userPacks.find(p => p.id === packKey);
                        if (pack) {
                            pack.stickers.push(data);
                            stickerPacks[packKey] = [...pack.stickers];
                            saveUserPacks(userPacks);
                        }
                    }
                    refreshAllPackGrids();
                    updateTabButtons();
                } catch(err) {
                    alert('Ошибка загрузки: ' + err.message);
                    if (addBtn) {
                        addBtn.innerHTML = ADD_ICON;
                        addBtn.style.pointerEvents = 'auto';
                    }
                }
            };
            input.click();
        }

        function showCropEditor(imageUrl) {
            return new Promise((resolve) => {
                let isDragging = false;
                let isResizing = false;
                let resizeDirection = null;
                let offsetX, offsetY;
                let originalWidth, originalHeight;
                let originalX, originalY;
                let currentAspectRatio = null;
                let snapTimeout = null;
                let activeRatioBtn = null;

                const modal = document.createElement('div');
                modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:20000;';

                const editor = document.createElement('div');
                editor.style.cssText = 'background:var(--block-bg,#1e1e2e);border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:16px;width:90%;max-width:500px;';

                const title = document.createElement('h3');
                title.textContent = 'Обрежьте стикер';
                title.style.cssText = 'margin:0;color:white;font-size:18px;font-weight:600;';

                const previewContainer = document.createElement('div');
                previewContainer.style.cssText = 'position:relative;width:100%;aspect-ratio:1;overflow:hidden;border-radius:12px;background:#000;';

                const img = document.createElement('img');
                img.src = imageUrl;
                img.style.cssText = 'width:100%;height:100%;object-fit:contain;pointer-events:none;';
                previewContainer.appendChild(img);

                const overlay = document.createElement('div');
                overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';

                const cropArea = document.createElement('div');
                cropArea.style.cssText = 'position:absolute;border:2px solid #0080FF;box-sizing:border-box;';
                overlay.appendChild(cropArea);
                previewContainer.appendChild(overlay);

                const resizeHandles = {};
                ['n', 'e', 's', 'w', 'nw', 'ne', 'sw', 'se'].forEach(dir => {
                    resizeHandles[dir] = document.createElement('div');
                    resizeHandles[dir].style.cssText = `position:absolute;width:8px;height:8px;background:#0080FF;pointer-events:auto;`;
                    resizeHandles[dir].className = 'resize-handle';
                    resizeHandles[dir].dataset.direction = dir;
                });

                resizeHandles.n.style.top = '-4px';
                resizeHandles.n.style.left = '50%';
                resizeHandles.n.style.transform = 'translateX(-50%)';
                resizeHandles.n.style.width = '30px';
                resizeHandles.n.style.height = '8px';
                resizeHandles.n.style.cursor = 'n-resize';

                resizeHandles.e.style.top = '50%';
                resizeHandles.e.style.right = '-4px';
                resizeHandles.e.style.transform = 'translateY(-50%)';
                resizeHandles.e.style.width = '8px';
                resizeHandles.e.style.height = '30px';
                resizeHandles.e.style.cursor = 'e-resize';

                resizeHandles.s.style.bottom = '-4px';
                resizeHandles.s.style.left = '50%';
                resizeHandles.s.style.transform = 'translateX(-50%)';
                resizeHandles.s.style.width = '30px';
                resizeHandles.s.style.height = '8px';
                resizeHandles.s.style.cursor = 's-resize';

                resizeHandles.w.style.top = '50%';
                resizeHandles.w.style.left = '-4px';
                resizeHandles.w.style.transform = 'translateY(-50%)';
                resizeHandles.w.style.width = '8px';
                resizeHandles.w.style.height = '30px';
                resizeHandles.w.style.cursor = 'w-resize';

                resizeHandles.nw.style.top = '-4px';
                resizeHandles.nw.style.left = '-4px';
                resizeHandles.nw.style.cursor = 'nw-resize';

                resizeHandles.ne.style.top = '-4px';
                resizeHandles.ne.style.right = '-4px';
                resizeHandles.ne.style.cursor = 'ne-resize';

                resizeHandles.sw.style.bottom = '-4px';
                resizeHandles.sw.style.left = '-4px';
                resizeHandles.sw.style.cursor = 'sw-resize';

                resizeHandles.se.style.bottom = '-4px';
                resizeHandles.se.style.right = '-4px';
                resizeHandles.se.style.cursor = 'se-resize';

                Object.values(resizeHandles).forEach(handle => cropArea.appendChild(handle));

                const aspectRatioControls = document.createElement('div');
                aspectRatioControls.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;';

                const ratios = [
                    { label: 'Свободный', value: null },
                    { label: '1:1', value: 1 },
                    { label: '4:3', value: 4/3 },
                    { label: '3:4', value: 3/4 },
                    { label: '16:9', value: 16/9 },
                    { label: '9:16', value: 9/16 }
                ];

                ratios.forEach(ratio => {
                    const btn = document.createElement('button');
                    btn.textContent = ratio.label;
                    btn.style.cssText = 'background:rgba(255,255,255,0.1);border:none;color:white;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;';
                    btn.onclick = () => {
                        currentAspectRatio = ratio.value;
                        document.querySelectorAll('.aspect-ratio-btn').forEach(b => b.style.background = 'rgba(255,255,255,0.1)');
                        btn.style.background = '#0080FF';
                        activeRatioBtn = btn;

                        if (ratio.value !== null) {
                            setAspectRatio(ratio.value);
                        }
                    };
                    btn.className = 'aspect-ratio-btn';
                    aspectRatioControls.appendChild(btn);
                });

                if (aspectRatioControls.children[0]) {
                    aspectRatioControls.children[0].style.background = '#0080FF';
                    activeRatioBtn = aspectRatioControls.children[0];
                }

                const controls = document.createElement('div');
                controls.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;';

                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = 'Отмена';
                cancelBtn.style.cssText = 'background:transparent;border:1px solid rgba(255,255,255,0.3);color:white;padding:8px 16px;border-radius:8px;cursor:pointer;';
                cancelBtn.onclick = () => {
                    document.body.removeChild(modal);
                    resolve(null);
                };

                const confirmBtn = document.createElement('button');
                confirmBtn.textContent = 'Готово';
                confirmBtn.style.cssText = 'background:#0080FF;border:none;color:white;padding:8px 16px;border-radius:8px;cursor:pointer;';
                confirmBtn.onclick = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const containerRect = previewContainer.getBoundingClientRect();
                    const bounds = getImageBounds();
                    const imgDisplayWidth = bounds.width;
                    const imgDisplayHeight = bounds.height;
                    const imgOffsetX = bounds.minX;
                    const imgOffsetY = bounds.minY;

                    const scaleX = img.naturalWidth / imgDisplayWidth;
                    const scaleY = img.naturalHeight / imgDisplayHeight;

                    const cropRect = cropArea.getBoundingClientRect();
                    const cropX = (cropRect.left - containerRect.left - imgOffsetX) * scaleX;
                    const cropY = (cropRect.top - containerRect.top - imgOffsetY) * scaleY;
                    const cropWidth = cropRect.width * scaleX;
                    const cropHeight = cropRect.height * scaleY;

                    const finalCropX = Math.max(0, Math.min(cropX, img.naturalWidth - cropWidth));
                    const finalCropY = Math.max(0, Math.min(cropY, img.naturalHeight - cropHeight));

                    canvas.width = cropWidth;
                    canvas.height = cropHeight;

                    ctx.drawImage(img, finalCropX, finalCropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

                    canvas.toBlob((blob) => {
                        const croppedFile = new File([blob], 'sticker.png', { type: 'image/png' });
                        document.body.removeChild(modal);
                        resolve(croppedFile);
                    }, 'image/png');
                };

                controls.appendChild(cancelBtn);
                controls.appendChild(confirmBtn);

                editor.appendChild(title);
                editor.appendChild(previewContainer);
                editor.appendChild(aspectRatioControls);
                editor.appendChild(controls);
                modal.appendChild(editor);
                document.body.appendChild(modal);

                function getImageBounds() {
                    const containerRect = previewContainer.getBoundingClientRect();

                    const imgAspectRatio = img.naturalWidth / img.naturalHeight;
                    const containerAspectRatio = containerRect.width / containerRect.height;

                    let imgDisplayWidth, imgDisplayHeight;

                    if (imgAspectRatio > containerAspectRatio) {
                        imgDisplayWidth = containerRect.width;
                        imgDisplayHeight = containerRect.width / imgAspectRatio;
                    } else {
                        imgDisplayHeight = containerRect.height;
                        imgDisplayWidth = containerRect.height * imgAspectRatio;
                    }

                    const imgOffsetX = (containerRect.width - imgDisplayWidth) / 2;
                    const imgOffsetY = (containerRect.height - imgDisplayHeight) / 2;

                    return {
                        minX: imgOffsetX,
                        minY: imgOffsetY,
                        maxX: imgOffsetX + imgDisplayWidth,
                        maxY: imgOffsetY + imgDisplayHeight,
                        width: imgDisplayWidth,
                        height: imgDisplayHeight,
                        offsetX: imgOffsetX,
                        offsetY: imgOffsetY
                    };
                }

                function constrainCropArea() {
                    const bounds = getImageBounds();

                    let left = parseFloat(cropArea.style.left);
                    let top = parseFloat(cropArea.style.top);
                    let width = cropArea.offsetWidth;
                    let height = cropArea.offsetHeight;

                    if (isNaN(left)) left = 0;
                    if (isNaN(top)) top = 0;

                    left = Math.max(bounds.minX, Math.min(left, bounds.maxX - width));
                    top = Math.max(bounds.minY, Math.min(top, bounds.maxY - height));

                    width = Math.min(width, bounds.width);
                    height = Math.min(height, bounds.height);

                    cropArea.style.left = left + 'px';
                    cropArea.style.top = top + 'px';
                    cropArea.style.width = width + 'px';
                    cropArea.style.height = height + 'px';
                }

                function checkSnapToCenter() {
                    const bounds = getImageBounds();
                    let left = parseFloat(cropArea.style.left);
                    let top = parseFloat(cropArea.style.top);
                    const width = cropArea.offsetWidth;
                    const height = cropArea.offsetHeight;

                    const centerX = bounds.minX + (bounds.width - width) / 2;
                    const centerY = bounds.minY + (bounds.height - height) / 2;

                    const threshold = 5;

                    let newLeft = left;
                    let newTop = top;
                    let snapped = false;

                    if (Math.abs(left - centerX) < threshold) {
                        newLeft = centerX;
                        snapped = true;
                    }

                    if (Math.abs(top - centerY) < threshold) {
                        newTop = centerY;
                        snapped = true;
                    }

                    if (snapped) {
                        cropArea.style.left = newLeft + 'px';
                        cropArea.style.top = newTop + 'px';
                    }
                }

                function setAspectRatio(ratio) {
                    if (ratio === null) return;

                    const bounds = getImageBounds();
                    const containerRect = previewContainer.getBoundingClientRect();

                    let newWidth, newHeight;

                    if (ratio >= 1) {
                        newWidth = bounds.width;
                        newHeight = newWidth / ratio;
                        if (newHeight > bounds.height) {
                            newHeight = bounds.height;
                            newWidth = newHeight * ratio;
                        }
                    } else {
                        newHeight = bounds.height;
                        newWidth = newHeight * ratio;
                        if (newWidth > bounds.width) {
                            newWidth = bounds.width;
                            newHeight = newWidth / ratio;
                        }
                    }

                    const newX = bounds.minX + (bounds.width - newWidth) / 2;
                    const newY = bounds.minY + (bounds.height - newHeight) / 2;

                    cropArea.style.width = newWidth + 'px';
                    cropArea.style.height = newHeight + 'px';
                    cropArea.style.left = newX + 'px';
                    cropArea.style.top = newY + 'px';

                    constrainCropArea();

                    if (activeRatioBtn) {
                        document.querySelectorAll('.aspect-ratio-btn').forEach(b => b.style.background = 'rgba(255,255,255,0.1)');
                        activeRatioBtn.style.background = '#0080FF';
                    }
                }

                cropArea.addEventListener('mousedown', (e) => {
                    if (e.target.classList.contains('resize-handle')) {
                        isResizing = true;
                        resizeDirection = e.target.dataset.direction;
                        originalWidth = cropArea.offsetWidth;
                        originalHeight = cropArea.offsetHeight;
                        originalX = parseFloat(cropArea.style.left);
                        originalY = parseFloat(cropArea.style.top);
                        offsetX = e.clientX;
                        offsetY = e.clientY;
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }

                    isDragging = true;
                    const cropRect = cropArea.getBoundingClientRect();
                    offsetX = e.clientX - cropRect.left;
                    offsetY = e.clientY - cropRect.top;
                    e.preventDefault();
                    e.stopPropagation();
                    cropArea.style.cursor = 'move';
                });

                cropArea.style.pointerEvents = 'auto';

                document.addEventListener('mousemove', (e) => {
                    if (isDragging) {
                        const containerRect = previewContainer.getBoundingClientRect();

                        let newX = e.clientX - containerRect.left - offsetX;
                        let newY = e.clientY - containerRect.top - offsetY;

                        cropArea.style.left = newX + 'px';
                        cropArea.style.top = newY + 'px';

                        constrainCropArea();

                        checkSnapToCenter();

                    } else if (isResizing) {
                        const bounds = getImageBounds();
                        const deltaX = e.clientX - offsetX;
                        const deltaY = e.clientY - offsetY;

                        let newWidth = originalWidth;
                        let newHeight = originalHeight;
                        let newX = originalX;
                        let newY = originalY;

                        switch (resizeDirection) {
                            case 'n': newHeight = originalHeight - deltaY; newY = originalY + deltaY; break;
                            case 'e': newWidth = originalWidth + deltaX; break;
                            case 's': newHeight = originalHeight + deltaY; break;
                            case 'w': newWidth = originalWidth - deltaX; newX = originalX + deltaX; break;
                            case 'nw': newWidth = originalWidth - deltaX; newHeight = originalHeight - deltaY; newX = originalX + deltaX; newY = originalY + deltaY; break;
                            case 'ne': newWidth = originalWidth + deltaX; newHeight = originalHeight - deltaY; newY = originalY + deltaY; break;
                            case 'sw': newWidth = originalWidth - deltaX; newHeight = originalHeight + deltaY; newX = originalX + deltaX; break;
                            case 'se': newWidth = originalWidth + deltaX; newHeight = originalHeight + deltaY; break;
                        }

                        if (currentAspectRatio !== null && currentAspectRatio !== undefined) {
                            let idealWidth = newWidth;
                            let idealHeight = newHeight;

                            if (resizeDirection === 'n' || resizeDirection === 's') {
                                idealWidth = newHeight * currentAspectRatio;
                                idealHeight = newHeight;
                            } else {
                                idealWidth = newWidth;
                                idealHeight = newWidth / currentAspectRatio;
                            }

                            if (idealWidth > bounds.width) {
                                idealWidth = bounds.width;
                                idealHeight = idealWidth / currentAspectRatio;
                            }
                            if (idealHeight > bounds.height) {
                                idealHeight = bounds.height;
                                idealWidth = idealHeight * currentAspectRatio;
                            }

                            newWidth = idealWidth;
                            newHeight = idealHeight;

                            switch (resizeDirection) {
                                case 'e':
                                    newX = originalX;
                                    newY = originalY - (newHeight - originalHeight) / 2;
                                    break;
                                case 'w':
                                    newX = originalX + (originalWidth - newWidth);
                                    newY = originalY - (newHeight - originalHeight) / 2;
                                    break;
                                case 'n':
                                    newX = originalX - (newWidth - originalWidth) / 2;
                                    newY = originalY + (originalHeight - newHeight);
                                    break;
                                case 's':
                                    newX = originalX - (newWidth - originalWidth) / 2;
                                    newY = originalY;
                                    break;
                                case 'nw':
                                    newX = originalX + (originalWidth - newWidth);
                                    newY = originalY + (originalHeight - newHeight);
                                    break;
                                case 'ne':
                                    newX = originalX;
                                    newY = originalY + (originalHeight - newHeight);
                                    break;
                                case 'sw':
                                    newX = originalX + (originalWidth - newWidth);
                                    newY = originalY;
                                    break;
                                case 'se':
                                    newX = originalX;
                                    newY = originalY;
                                    break;
                            }
                        }

                        const minSize = 50;
                        newWidth = Math.max(minSize, Math.min(bounds.width, newWidth));
                        newHeight = Math.max(minSize, Math.min(bounds.height, newHeight));

                        newX = Math.max(bounds.minX, Math.min(newX, bounds.maxX - newWidth));
                        newY = Math.max(bounds.minY, Math.min(newY, bounds.maxY - newHeight));

                        cropArea.style.width = newWidth + 'px';
                        cropArea.style.height = newHeight + 'px';
                        cropArea.style.left = newX + 'px';
                        cropArea.style.top = newY + 'px';

                        constrainCropArea();
                        checkSnapToCenter();
                    }
                });

                document.addEventListener('mouseup', () => {
                    isDragging = false;
                    isResizing = false;

                    constrainCropArea();
                });

                img.onload = () => {
                    const bounds = getImageBounds();
                    cropArea.style.width = bounds.width + 'px';
                    cropArea.style.height = bounds.height + 'px';
                    cropArea.style.left = bounds.minX + 'px';
                    cropArea.style.top = bounds.minY + 'px';
                };

                if (img.complete) {
                    const bounds = getImageBounds();
                    cropArea.style.width = bounds.width + 'px';
                    cropArea.style.height = bounds.height + 'px';
                    cropArea.style.left = bounds.minX + 'px';
                    cropArea.style.top = bounds.minY + 'px';
                }
            });
        }

        function moveSticker(packKey, from, to) {
            if (packKey === 'recent') {
                const item = recentStickers[from];
                recentStickers.splice(from, 1);
                recentStickers.splice(to, 0, item);
                stickerPacks.recent = [...recentStickers];
                saveRecentStickers(recentStickers);
            } else {
                const pack = userPacks.find(p => p.id === packKey);
                if (pack) {
                    const item = pack.stickers[from];
                    pack.stickers.splice(from, 1);
                    pack.stickers.splice(to, 0, item);
                    stickerPacks[packKey] = [...pack.stickers];
                    saveUserPacks(userPacks);
                }
            }
            updateTabButtons();
        }

        function refreshPackGrid(packKey) {
            if (!scrollContainer) return;
            const grid = scrollContainer.querySelector(`.pack-grid[data-pack="${packKey}"]`);
            if (!grid) return;
            grid.innerHTML = '';
            const stickers = stickerPacks[packKey] || [];
            const isEditingThisPack = editMode && currentEditPack === packKey;
            stickers.forEach((sticker, index) => {
                const btn = createStickerButton(sticker, packKey, index, isEditingThisPack);
                grid.appendChild(btn);
            });
            if (isEditingThisPack) {
                const addBtn = document.createElement('button');
                addBtn.className = 'add-item-btn';
                addBtn.innerHTML = ADD_ICON;
                addBtn.title = 'Добавить стикер';
                addBtn.style.cssText = 'aspect-ratio:1;background:var(--bg-secondary,rgba(128,128,128,0.08));border:2px dashed var(--border-color,rgba(255,255,255,0.2));border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;color:var(--text-secondary,rgba(255,255,255,0.5));transition:all 0.15s';
                addBtn.onmouseenter = () => { addBtn.style.borderColor = 'var(--accent-primary,#0080FF)'; addBtn.style.color = 'var(--accent-primary,#0080FF)'; };
                addBtn.onmouseleave = () => { addBtn.style.borderColor = 'var(--border-color,rgba(255,255,255,0.2))'; addBtn.style.color = 'var(--text-secondary,rgba(255,255,255,0.5))'; };
                addBtn.onclick = () => addStickerToPack(packKey);
                grid.appendChild(addBtn);
            }
        }

        function refreshAllPackGrids() {
            if (!scrollContainer) return;
            ['recent', ...userPacks.map(p => p.id)].forEach(key => refreshPackGrid(key));
        }

        function createStickerButton(sticker, packKey, index, isEditing) {
            const btn = document.createElement('button');
            btn.dataset.packKey = packKey;
            btn.dataset.stickerIndex = index;
            btn.style.cssText = 'aspect-ratio:1;font-size:34px;background:transparent;border:none;border-radius:10px;transition:all 0.15s ease;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;position:relative;user-select:none;overflow:hidden;';

            if (sticker && sticker.url) {
                const img = document.createElement('img');
                img.src = sticker.url;
                img.style.cssText = 'width:100%;height:100%;object-fit:contain;pointer-events:none;';
                btn.appendChild(img);
            } else {
                const placeholder = document.createElement('div');
                placeholder.style.cssText = 'width:100%;height:100%;background:rgba(128,128,128,0.1);border-radius:8px;';
                btn.appendChild(placeholder);
            }

            if (isEditing) {
                btn.classList.add('sticker-editing', `sticker-shake-${(index % 8) + 1}`);
                btn.draggable = true;

                btn.onclick = () => {
                    if (sticker && sticker.id && sticker.url) {
                        addToRecent(sticker);
                        insertStickerToComment(sticker.id, sticker.url);
                    }
                    stickerPanel.style.display = 'none';

                    exitEditMode();
                };
                btn.onmouseenter = (e) => {
                    if (!dragState.packKey) {
                        btn.style.transform = 'scale(1.05)';
                        btn.style.boxShadow = '0 0 0 2px var(--accent-primary,#0080FF)';
                    }
                };
                btn.onmouseleave = (e) => {
                    if (!dragState.packKey) {
                        btn.style.transform = 'scale(1)';
                        btn.style.boxShadow = 'none';
                    }
                };

                if (dragState.packKey === packKey) {
                    if (index === dragState.draggedIndex) btn.classList.add('sticker-dragging');
                    else if (index === dragState.placeholderIndex) btn.classList.add('sticker-placeholder');
                }

                const deleteBtn = document.createElement('div');
                deleteBtn.innerHTML = DELETE_ICON;
                deleteBtn.style.cssText = 'position:absolute;top:2px;right:2px;width:16px;height:16px;background:rgba(0,0,0,0.6);border-radius:50%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.7);transition:all 0.15s;z-index:2;pointer-events:auto;font-size:12px;';
                deleteBtn.onmouseenter = (e) => { e.stopPropagation(); deleteBtn.style.background = '#ff4444'; };
                deleteBtn.onmouseleave = (e) => { e.stopPropagation(); deleteBtn.style.background = 'rgba(0,0,0,0.6)'; };
                deleteBtn.onmousedown = (e) => { e.stopPropagation(); e.preventDefault(); };
                deleteBtn.onclick = (e) => { e.stopPropagation(); e.preventDefault(); deleteSticker(packKey, index); };
                btn.appendChild(deleteBtn);

                btn.addEventListener('dragstart', (e) => {
                    if (!editMode || dragState.packKey) return;
                    dragState = { packKey, draggedIndex: index, placeholderIndex: index };
                    e.dataTransfer.setData('text/plain', '');
                    e.dataTransfer.effectAllowed = 'move';
                    setTimeout(() => { if (dragState.packKey === packKey) refreshPackGrid(packKey); }, 0);
                });
                btn.addEventListener('dragend', () => {
                    if (dragState.packKey === packKey) {
                        dragState = { packKey: null, draggedIndex: null, placeholderIndex: null };
                        refreshPackGrid(packKey);
                    }
                });
                btn.addEventListener('dragover', (e) => {
                    if (!dragState.packKey || dragState.packKey !== packKey) return;
                    e.preventDefault();
                });
                btn.addEventListener('dragenter', (e) => {
                    if (!dragState.packKey || dragState.packKey !== packKey) return;
                    e.preventDefault();
                    const targetIdx = parseInt(btn.dataset.stickerIndex);
                    if (targetIdx !== dragState.placeholderIndex) {
                        moveSticker(packKey, dragState.draggedIndex, targetIdx);
                        dragState.draggedIndex = targetIdx;
                        dragState.placeholderIndex = targetIdx;
                        refreshPackGrid(packKey);
                    }
                });
                btn.addEventListener('drop', (e) => {
                    if (!dragState.packKey || dragState.packKey !== packKey) return;
                    e.preventDefault();
                    dragState = { packKey: null, draggedIndex: null, placeholderIndex: null };
                    refreshPackGrid(packKey);
                    updateTabButtons();
                });
            } else {
                btn.onclick = () => {
                    if (sticker && sticker.id && sticker.url) {
                        addToRecent(sticker);
                        insertStickerToComment(sticker.id, sticker.url);
                    }
                    stickerPanel.style.display = 'none';

                    exitEditMode();
                };
                btn.onmouseenter = () => {
                    btn.style.transform = 'scale(1.05)';
                    btn.style.boxShadow = '0 0 0 2px var(--accent-primary,#0080FF)';
                };
                btn.onmouseleave = () => {
                    btn.style.transform = 'scale(1)';
                    btn.style.boxShadow = 'none';
                };
            }

        return btn;
        }

        function updateTabButtons() {
            tabButtons = [];

            const tabsWrapper = scrollTabs?.querySelector('div');
            if (tabsWrapper) {
                tabsWrapper.innerHTML = '';
                userPacks.forEach(pack => {
                    const btn = document.createElement('button');
                    const first = pack.stickers[0];
                    if (first && first.url) {
                        const img = document.createElement('img');
                        img.src = first.url;
                        img.style.cssText = 'width:24px;height:24px;object-fit:contain;border-radius:6px;';
                        btn.appendChild(img);
                    } else {
                        btn.innerHTML = EMPTY_PACK_ICON;
                        btn.style.color = 'rgba(128,128,128,0.5)';
                    }
                    btn.title = pack.name || DEFAULT_PACK_NAME;
                    btn.style.cssText = 'background:transparent;border:none;width:32px;height:32px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;color:var(--text-secondary,rgba(255,255,255,0.5));';
                    btn.onclick = () => { exitEditMode(); scrollToPack(pack.id); };
                    tabsWrapper.appendChild(btn);
                    tabButtons.push({ button: btn, key: pack.id });
                });
            }
        }

        function createStickerPanel() {
            if (stickerPanel) return stickerPanel;

            stickerPanel = document.createElement('div');
            stickerPanel.className = 'sticker-panel';
            stickerPanel.style.cssText = `position:fixed;display:none;flex-direction:column;background:var(--block-bg,#1e1e2e);border-radius:20px;border:1px solid var(--border-color,rgba(255,255,255,0.1));z-index:10000;width:${PANEL_WIDTH}px;height:${PANEL_HEIGHT}px;box-shadow:0 8px 24px rgba(0,0,0,0.3);overflow:hidden;`;

            const header = document.createElement('div');
            header.style.cssText = 'display:flex;align-items:center;padding:8px;border-bottom:1px solid var(--border-color,rgba(255,255,255,0.1));gap:4px;flex-shrink:0;';

            recentBtn = document.createElement('button');
            recentBtn.innerHTML = RECENT_ICON;
            recentBtn.title = 'Недавние';
            recentBtn.style.cssText = 'background:var(--accent-primary,#0080FF);border:none;width:32px;height:32px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;color:white;';
            recentBtn.onclick = () => { exitEditMode(); scrollToPack('recent'); };

            scrollTabs = document.createElement('div');
            scrollTabs.style.cssText = 'display:flex;gap:4px;overflow-x:auto;overflow-y:hidden;flex:1;padding:0 4px;scrollbar-width:none;';
            scrollTabs.addEventListener('wheel', (e) => {
                if (e.deltaY !== 0) { e.preventDefault(); scrollTabs.scrollLeft += e.deltaY * 0.4; }
            }, { passive: false });

            const tabsWrapper = document.createElement('div');
            tabsWrapper.style.cssText = 'display:flex;gap:4px;';
            scrollTabs.appendChild(tabsWrapper);

            tabButtons = [];
            userPacks.forEach(pack => {
                const btn = document.createElement('button');
                const first = pack.stickers[0];
                if (first) {
                    const img = document.createElement('img');
                    img.src = first.url;
                    img.style.cssText = 'width:24px;height:24px;object-fit:contain;border-radius:6px;';
                    btn.appendChild(img);
                } else {
                    btn.innerHTML = EMPTY_PACK_ICON;
                    btn.style.color = 'rgba(128,128,128,0.5)';
                }
                btn.title = pack.name || DEFAULT_PACK_NAME;
                btn.style.cssText = 'background:transparent;border:none;width:32px;height:32px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;color:var(--text-secondary,rgba(255,255,255,0.5));';
                btn.onclick = () => { exitEditMode(); scrollToPack(pack.id); };
                tabsWrapper.appendChild(btn);
                tabButtons.push({ button: btn, key: pack.id });
            });

            const addPackBtn = document.createElement('button');
            addPackBtn.innerHTML = ADD_PACK_ICON;
            addPackBtn.title = 'Создать стикерпак';
            addPackBtn.style.cssText = 'background:transparent;border:none;width:32px;height:32px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;color:var(--text-secondary,rgba(255,255,255,0.5));';
            addPackBtn.onclick = () => {
                const pack = { id: 'user_' + Date.now(), name: '', stickers: [] };
                userPacks.push(pack);
                saveUserPacks(userPacks);
                rebuildPacks();
                stickerPanel.remove();
                stickerPanel = null;
                scrollContainer = null;
                packHeaders = [];
                tabButtons = [];
                createStickerPanel();
                renderAllContent();
                enterEditMode(pack.id);
                showPanel();
            };

            header.appendChild(recentBtn);
            header.appendChild(scrollTabs);
            header.appendChild(addPackBtn);

            scrollContainer = document.createElement('div');
            scrollContainer.style.cssText = 'flex:1;overflow-y:auto;overflow-x:hidden;scroll-behavior:smooth;scrollbar-width:thin;';
            scrollContainer.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
            scrollContainer.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
            scrollContainer.addEventListener('scroll', updateActiveTabFromScroll, { passive: true });

            stickerPanel.appendChild(header);
            stickerPanel.appendChild(scrollContainer);

            stickerPanel.addEventListener('mouseenter', () => {
                if (hideTimeout) clearTimeout(hideTimeout);
                adjustAllInputWidths();
            });
            stickerPanel.addEventListener('mouseleave', () => {
                hideTimeout = setTimeout(() => {
                    if (stickerPanel && stickerPanel.style.display === 'flex') {
                        stickerPanel.style.display = 'none';
                        exitEditMode();
                        enablePageScroll();
                    }
                }, 200);
            });

            document.body.appendChild(stickerPanel);
            return stickerPanel;
        }

        function renderAllContent() {
            if (!scrollContainer) return;
            scrollContainer.innerHTML = '';
            packHeaders = [];

            const allKeys = ['recent', ...userPacks.map(p => p.id)];
            allKeys.forEach(key => {
                const header = document.createElement('div');
                header.className = 'pack-header';
                header.dataset.pack = key;
                header.style.cssText = 'padding:16px 10px 8px;display:flex;align-items:center;gap:6px;color:var(--text-secondary,rgba(255,255,255,0.5));';

                const nameContainer = document.createElement('div');
                nameContainer.style.cssText = 'display:flex;align-items:center;gap:4px;flex-shrink:0;';

                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.className = 'pack-name-input';
                nameInput.value = packNames[key] || '';
                nameInput.placeholder = 'Название...';
                nameInput.maxLength = MAX_NAME_LENGTH;
                nameInput.style.cssText = 'background:transparent;border:1px solid transparent;color:inherit;font-size:14px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;padding:2px 4px;border-radius:4px;outline:none;width:auto;';

                if (key !== 'recent') {
                    nameInput.addEventListener('input', () => {
                        if (!editMode || currentEditPack !== key) {
                            nameInput.value = packNames[key] || '';
                            adjustInputWidth(nameInput);
                            return;
                        }
                        nameInput.value = nameInput.value.slice(0, MAX_NAME_LENGTH);
                        packNames[key] = nameInput.value;
                        const pack = userPacks.find(p => p.id === key);
                        if (pack) { pack.name = nameInput.value; saveUserPacks(userPacks); }
                        adjustInputWidth(nameInput);
                    });
                    nameInput.addEventListener('blur', () => {
                        if (!editMode || currentEditPack !== key) {
                            nameInput.value = packNames[key] || '';
                            adjustInputWidth(nameInput);
                            return;
                        }
                        if (!nameInput.value.trim()) {
                            nameInput.value = DEFAULT_PACK_NAME;
                            packNames[key] = DEFAULT_PACK_NAME;
                            const pack = userPacks.find(p => p.id === key);
                            if (pack) { pack.name = DEFAULT_PACK_NAME; saveUserPacks(userPacks); }
                        }
                        adjustInputWidth(nameInput);
                    });
                } else {
                    nameInput.style.pointerEvents = 'none';
                }

                nameContainer.appendChild(nameInput);

                if (key !== 'recent') {
                    const editBtn = document.createElement('button');
                    editBtn.innerHTML = EDIT_ICON;
                    editBtn.title = 'Редактировать';
                    editBtn.style.cssText = 'background:transparent;border:none;width:20px;height:20px;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;color:inherit;';
                    editBtn.onclick = () => {
                        if (editMode && currentEditPack === key) exitEditMode();
                        else { exitEditMode(); enterEditMode(key); }
                    };
                    nameContainer.appendChild(editBtn);

                    const deletePackBtn = document.createElement('button');
                    deletePackBtn.className = 'delete-pack-btn';
                    deletePackBtn.innerHTML = TRASH_ICON;
                    deletePackBtn.title = 'Удалить пак';
                    deletePackBtn.style.cssText = 'display:none;background:#ff4444;border:none;width:24px;height:24px;border-radius:6px;cursor:pointer;padding:0;align-items:center;justify-content:center;';
                    deletePackBtn.onclick = () => { if (confirm('Удалить пак?')) deleteStickerPack(key); };
                    nameContainer.appendChild(deletePackBtn);

                    const exitBtn = document.createElement('button');
                    exitBtn.innerHTML = CHECK_ICON;
                    exitBtn.title = 'Готово';
                    exitBtn.style.cssText = 'display:none;background:var(--accent-primary,#0080FF);border:none;width:24px;height:24px;border-radius:6px;cursor:pointer;padding:0;align-items:center;justify-content:center;';
                    exitBtn.onclick = exitEditMode;
                    nameContainer.appendChild(exitBtn);
                    header._exitEditBtn = exitBtn;
                    exitBtn.style.display = (editMode && currentEditPack === key) ? 'flex' : 'none';
                }

                header.appendChild(nameContainer);
                const spacer = document.createElement('div');
                spacer.style.flex = '1';
                header.appendChild(spacer);
                scrollContainer.appendChild(header);
                packHeaders.push({ element: header, key });

            const grid = document.createElement('div');
            grid.className = 'pack-grid';
            grid.dataset.pack = key;
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:3px;padding:0 10px 16px;';
            const stickers = stickerPacks[key] || [];
            stickers.forEach((s, i) => grid.appendChild(createStickerButton(s, key, i, false)));
            scrollContainer.appendChild(grid);
            });
        }

        function scrollToPack(packKey) {
            const header = scrollContainer.querySelector(`.pack-header[data-pack="${packKey}"]`);
            if (header) {
                isScrollingFromTab = true;
                header.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(() => { isScrollingFromTab = false; }, 500);
            }
        }

        function updateActiveTabFromScroll() {
            if (editMode) return;
            const top = scrollContainer.getBoundingClientRect().top + 50;
            let active = 'recent', min = Infinity;
            packHeaders.forEach(({ element, key }) => {
                const d = element.getBoundingClientRect().top - top;
                if (d <= 0 && Math.abs(d) < min) { min = Math.abs(d); active = key; }
            });
            if (recentBtn) recentBtn.style.background = active === 'recent' ? 'var(--accent-primary,#0080FF)' : 'transparent';
            tabButtons.forEach(t => {
                t.button.style.background = t.key === active ? 'var(--accent-primary,#0080FF)' : 'transparent';
            });
        }

        function showPanel() {
            if (!stickerBtn) return;
            if (hideTimeout) clearTimeout(hideTimeout);
            createStickerPanel();
            if (!scrollContainer || !scrollContainer.children.length) renderAllContent();
            const rect = stickerBtn.getBoundingClientRect();
            stickerPanel.style.bottom = `${window.innerHeight - rect.top + 8}px`;
            stickerPanel.style.left = `${Math.min(rect.left, window.innerWidth - PANEL_WIDTH - 20)}px`;
            stickerPanel.style.display = 'flex';
            disablePageScroll();
        }

        function hidePanel() {
            hideTimeout = setTimeout(() => {
                if (stickerPanel && stickerPanel.style.display === 'flex') {
                    stickerPanel.style.display = 'none';
                    exitEditMode();
                    enablePageScroll();
                }
            }, 300);
        }

        function addStickerButton() {
            if (isProcessing) return;
            isProcessing = true;
            const container = document.querySelector('.' + SELECTORS.stickerContainer);
            if (!container || container.querySelector('.sticker-btn')) { isProcessing = false; return; }
            const micBtn = container.querySelector('.' + SELECTORS.stickerMicBtn);
            if (!micBtn) { isProcessing = false; return; }

            stickerBtn = document.createElement('button');
            stickerBtn.className = 'sticker-btn';
            stickerBtn.innerHTML = STICKER_BUTTON_ICON;
            stickerBtn.style.cssText = 'background:transparent;border:none;cursor:pointer;padding:8px;border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;color:var(--text-secondary);margin-right:5px;width:36px;height:36px;';
            stickerBtn.onmouseenter = () => { stickerBtn.style.backgroundColor = 'var(--bg-hover,rgba(255,255,255,0.08))'; showPanel(); };
            stickerBtn.onmouseleave = () => { stickerBtn.style.backgroundColor = 'transparent'; hidePanel(); };
            container.insertBefore(stickerBtn, micBtn);
            isProcessing = false;
        }

        const observer = new MutationObserver(() => {
            const c = document.querySelector('.' + SELECTORS.stickerContainer);
            if (c && !c.querySelector('.sticker-btn')) addStickerButton();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        window.addEventListener('focus', () => {
            const c = document.querySelector('.' + SELECTORS.stickerContainer);
            if (c && !c.querySelector('.sticker-btn')) addStickerButton();
        });

        let lastUrl = location.href;
        new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                setTimeout(() => {
                    const c = document.querySelector('.' + SELECTORS.stickerContainer);
                    if (c && !c.querySelector('.sticker-btn')) addStickerButton();
                }, 1000);
            }
        }).observe(document, { subtree: true, childList: true });

        setTimeout(addStickerButton, 1000);

    })();

    let messagesButtonAdded = false;
    let lastMemeIndex = -1;
let messagesOverlay = null;

function addMessagesButton() {
    const nav = document.querySelector('aside.' + SELECTORS.sidebar + ' nav.' + SELECTORS.nav);
    if (!nav) return;

    const notificationsLink = nav.querySelector('a[href="/notifications"]');
    if (!notificationsLink) return;

    let messagesLink = nav.querySelector('a[href="#"]');
    if (messagesLink) {
        if (messagesLink.nextElementSibling !== notificationsLink) {
            nav.insertBefore(messagesLink, notificationsLink);
        }
        return;
    }

    if (!messagesOverlay) {
        const memes = [
            'But nobody came... 🖤',
            'Ошибка загрузки 😔',
            'Загрузка... шучу, ошибка 💀',
            'Твои сообщения украли цыгане 🐎',
            'Загрузка... нет 😈',
            'Ты им не нужен, брат 🤝😞',
            'Сообщения загружены на 99%... 99%... ⏳',
            'Сообщения — это ложь 🎂',
            'Иди ка ты на хуй',
            'Сервер ответил: пошёл нахуй 🖕🤖',
            'Связь заблокирована Роскомнадзором 🇷🇺🚫',
        ];

        messagesOverlay = document.createElement('div');
        messagesOverlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.85);
            z-index: 99999;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            color: #fff;
            font-size: 28px;
            font-family: sans-serif;
            text-align: center;
            padding: 40px;
            user-select: none;
        `;
        messagesOverlay.addEventListener('click', () => {
            messagesOverlay.style.display = 'none';
        });
        document.body.appendChild(messagesOverlay);

        messagesOverlay._memes = memes;
        messagesOverlay._lastMemeIndex = -1;
        messagesOverlay._showRandomMeme = function () {
            let idx;
            do {
                idx = Math.floor(Math.random() * this._memes.length);
            } while (idx === this._lastMemeIndex && this._memes.length > 1);
            this._lastMemeIndex = idx;
            this.textContent = this._memes[idx];
            this.style.display = 'flex';
        };
    }

    messagesLink = document.createElement('a');
    messagesLink.href = '#';
    messagesLink.className = SELECTORS.navLink;
    messagesLink.addEventListener('click', (e) => {
        e.preventDefault();
        messagesOverlay._showRandomMeme();
    });

    const iconSpan = document.createElement('span');
    iconSpan.className = SELECTORS.navIcon;
    iconSpan.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path fill="currentColor" fill-rule="evenodd" d="M5 3a3 3 0 00-3 3v10a3 3 0 003 3h1v2.47a.5.5 0 00.85.36L11.12 19H19a3 3 0 003-3V6a3 3 0 00-3-3H5zm2 5a1 1 0 000 2h10a1 1 0 100-2H7zm0 4a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
        </svg>
    `;
    const textSpan = document.createElement('span');
    textSpan.textContent = 'Сообщения';
    messagesLink.appendChild(iconSpan);
    messagesLink.appendChild(textSpan);

    nav.insertBefore(messagesLink, notificationsLink);
}

addMessagesButton();
new MutationObserver(() => addMessagesButton()).observe(document.body, { childList: true, subtree: true });

    console.log('🟢 ITD Visual Pack');
})();
