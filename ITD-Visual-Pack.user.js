// ==UserScript==
// @name         ITD Visual Pack
// @namespace    http://tampermonkey.net/
// @version      2.5.16
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

(function () {
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

    const ICONS = {
        settings: {
            'Фон': `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6.75 1C6.33579 1 6 1.33579 6 1.75V3.50559C5.96824 3.53358 5.93715 3.56276 5.9068 3.59311L1.66416 7.83575C0.883107 8.6168 0.883107 9.88313 1.66416 10.6642L5.19969 14.1997C5.98074 14.9808 7.24707 14.9808 8.02812 14.1997L12.2708 9.95707C13.0518 9.17602 13.0518 7.90969 12.2708 7.12864L8.73522 3.59311C8.39027 3.24816 7.95066 3.05555 7.5 3.0153V1.75C7.5 1.33579 7.16421 1 6.75 1ZM6 5.62123V6.25C6 6.66421 6.33579 7 6.75 7C7.16421 7 7.5 6.66421 7.5 6.25V4.54033C7.56363 4.56467 7.62328 4.60249 7.67456 4.65377L11.2101 8.1893C11.2995 8.27875 11.348 8.39366 11.3555 8.51071H3.11052L6 5.62123ZM6.26035 13.1391L3.132 10.0107H10.0958L6.96746 13.1391C6.77219 13.3343 6.45561 13.3343 6.26035 13.1391Z" fill="currentColor"/><path d="M2 17.5V12.4143L3.5 13.9143V17.5C3.5 18.0523 3.94772 18.5 4.5 18.5H19.5C20.0523 18.5 20.5 18.0523 20.5 17.5V6.5C20.5 5.94771 20.0523 5.5 19.5 5.5H12.0563L10.5563 4H19.5C20.8807 4 22 5.11929 22 6.5V17.5C22 18.8807 20.8807 20 19.5 20H4.5C3.11929 20 2 18.8807 2 17.5Z" fill="currentColor"/><path d="M11 14.375C11 13.8816 11.1541 13.4027 11.3418 12.9938C11.5325 12.5784 11.7798 12.1881 12.0158 11.8595C12.2531 11.5289 12.4888 11.247 12.6647 11.0481C12.7502 10.9515 12.9062 10.7867 12.9642 10.7254L12.9697 10.7197C13.2626 10.4268 13.7374 10.4268 14.0303 10.7197L14.3353 11.0481C14.5112 11.247 14.7469 11.5289 14.9842 11.8595C15.2202 12.1881 15.4675 12.5784 15.6582 12.9938C15.8459 13.4027 16 13.8816 16 14.375C16 15.7654 14.9711 17 13.5 17C12.0289 17 11 15.7654 11 14.375ZM13.7658 12.7343C13.676 12.6092 13.5858 12.4916 13.5 12.3844C13.4142 12.4916 13.324 12.6092 13.2342 12.7343C13.0327 13.015 12.8425 13.32 12.7051 13.6195C12.5647 13.9253 12.5 14.1808 12.5 14.375C12.5 15.0663 12.9809 15.5 13.5 15.5C14.0191 15.5 14.5 15.0663 14.5 14.375C14.5 14.1808 14.4353 13.9253 14.2949 13.6195C14.1575 13.32 13.9673 13.015 13.7658 12.7343Z" fill="currentColor"/></svg>`,
            'Подсветка ника': `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M4.93 4.93l2.83 2.83M2 12h4M4.93 19.07l2.83-2.83M12 22v-4M19.07 19.07l-2.83-2.83M22 12h-4M19.07 4.93l-2.83 2.83"/><circle cx="12" cy="12" r="4"/></svg>`,
            'Подсветка аватарок': `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M5 20v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><circle cx="12" cy="12" r="10"/></svg>`,
            'Подсветка постов': `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>`,
            'Размытый фон постов': `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="4"/><path d="M12 8a4 4 0 0 1 0 8" stroke-dasharray="2 2"/></svg>`,
            'Анти цензура': `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="60 60 180 180" fill="none"><circle cx="150" cy="150" r="130" fill="#ff575b" stroke="currentColor" stroke-width="8"/><path d="M217 158h-21v-15h21v-21h15v21h21.087l-0.004 14.889L232 158.07V178h-15z" fill="white"/><path d="M79 111.104l-9.865-0.604L79.144 94H98v117H79z" fill="white"/><path d="M143.132 211.922c-10.358-2.035-20.433-9.815-25.153-19.422-2.108-4.291-2.458-6.418-2.468-15-0.009-8.103 0.389-10.853 2.099-14.5 2.215-4.721 5.274-8.42 9.277-11.214l2.387-1.667-4.083-4.639c-5.574-6.333-7.558-12.699-6.967-22.353 1.098-17.924 13.383-29.856 31.84-30.924 14.316-0.829 25.744 5.1 32.294 16.753 2.661 4.733 3.12 6.667 3.467 14.601 0.464 10.612-1.113 15.435-7.278 22.259l-3.678 4.071 4.036 3.646c13.714 12.39 13.054 37.638-1.314 50.253-8.882 7.798-21.282 10.726-34.459 8.136zm19.1-19.532c10.596-7.486 10.882-22.949 0.562-30.425-9.655-6.994-22.955-3.424-27.914 7.493-7.693 16.935 12.215 33.626 27.352 22.931zm-0.966-52.924c4.342-2.951 7.744-8.983 7.713-13.676-0.032-4.761-3.25-11.135-6.953-13.772-3.431-2.443-10.265-3.677-14.491-2.616-1.422 0.357-4.369 2.261-6.55 4.231-6.552 5.92-7.462 13.744-2.494 21.443 4.598 7.126 15.621 9.25 22.774 4.39z" fill="white"/></svg>`,
            'Стиль фона': `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20z"/><circle cx="12" cy="12" r="4"/></svg>`,
            'Автолайки': `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`
        },

        PALETTE: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v1m0 16v1M3 12h1m16 0h1M5.6 5.6l.7.7m12.1 12.1l.7.7M5.6 18.4l.7-.7m12.1-12.1l.7-.7"/><circle cx="12" cy="12" r="4"/></svg>`,
        GEAR: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
        MESSAGES: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M5 3a3 3 0 00-3 3v10a3 3 0 003 3h1v2.47a.5.5 0 00.85.36L11.12 19H19a3 3 0 003-3V6a3 3 0 00-3-3H5zm2 5a1 1 0 000 2h10a1 1 0 100-2H7zm0 4a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>`,
        SCROLL_TOP: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`,
        BANNER_IMAGE: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><circle cx="8.5" cy="8.5" r="2.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
        BANNER_CANCEL: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
        BANNER_APPLY: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        YOUR_LOGO: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='36' height='36'><defs><filter id='glow' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur in='SourceGraphic' stdDeviation='3' result='blur'/></filter><linearGradient id='rainbow' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:#ff0000'/><stop offset='16%' style='stop-color:#ff8800'/><stop offset='33%' style='stop-color:#ffff00'/><stop offset='50%' style='stop-color:#00ff00'/><stop offset='66%' style='stop-color:#00ffff'/><stop offset='83%' style='stop-color:#0000ff'/><stop offset='100%' style='stop-color:#ff00ff'/></linearGradient></defs><rect width='100' height='100' rx='20' fill='#1a1a1a'/><text x='50' y='72' font-family='Arial, sans-serif' font-size='60' font-weight='bold' text-anchor='middle' fill='url(#rainbow)' filter='url(#glow)' opacity='0.9'>N</text><text x='50' y='72' font-family='Arial, sans-serif' font-size='60' font-weight='bold' text-anchor='middle' fill='url(#rainbow)'>N</text></svg>`,
        STICKER_BUTTON: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 16C9.85038 16.6303 10.8846 17 12 17C13.1154 17 14.1496 16.6303 15 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><ellipse cx="15" cy="10.5" rx="1" ry="1.5" fill="currentColor"/><ellipse cx="9" cy="10.5" rx="1" ry="1.5" fill="currentColor"/><path d="M15 22H12C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12V15M15 22C18.866 22 22 18.866 22 15M15 22C15 20.1387 15 19.2081 15.2447 18.4549C15.7393 16.9327 16.9327 15.7393 18.4549 15.2447C19.2081 15 20.1387 15 22 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
        LOADING: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>`,
        RECENT: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        ADD_PACK: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" ry="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
        ADD: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        EDIT: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
        DELETE: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        CHECK: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        TRASH: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
        EMPTY_PACK: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="3" opacity="0.3"/></svg>`,
        UPDATE: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
        badge: function (size) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="1.8 1.8 20.4 20.4" fill="none">
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
        }
    };

    function getBackgroundIcon(style) {
        const icons = {
            matrix: 'M',
            stars: '★',
            waves: '≈',
            particles: '•'
        };
        return icons[style] || 'M';
    }

    const VERIFICATION_POST_ID = 'a0d6625a-b3ec-44c4-98da-48422af101d5';
    const SECRET_SALT = 'ITD_MOD_2026_SECRET_SALT_NEUROSFW';
    const VERIFICATION_STORAGE_KEY = 'itd_verified_users';
    let verificationInterval = null;
    let isVerifying = false;

    function fixOverflowForGlowingNicks() {
        const nickContainers = document.querySelectorAll('.ZkAR.ZzyM');
        const containersLength = nickContainers.length;
        if (containersLength === 0) return;

        for (let i = 0; i < containersLength; i++) {
            const nickContainer = nickContainers[i];
            let parent = nickContainer.parentElement;
            let fixed = false;
            while (parent && parent !== document.body) {
                const overflow = getComputedStyle(parent).overflow;
                if (overflow === 'hidden' || overflow === 'auto') {
                    parent.style.setProperty('overflow', 'visible', 'important');
                    fixed = true;
                }
                parent = parent.parentElement;
            }
            if (fixed) {
                const nickSpan = nickContainer.querySelector('.Emmg');
                if (nickSpan && nickSpan.isConnected && nickSpan.style.filter) {
                    const currentFilter = nickSpan.style.filter;
                    nickSpan.style.filter = 'none';
                    setTimeout(() => { nickSpan.style.filter = currentFilter; }, 10);
                }
            }
        }
    }

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
        } catch (e) { }
    }

    let globalHue = 0;
    let colorDirection = 1;
    let myUsername = null;
    let myDisplayName = null;
    let nickElements = new Set();
    let currentStyle = GM_getValue('nickStyle', 'white');
    let backgroundEnabled = GM_getValue('backgroundEnabled', true);
    let backgroundStyle = GM_getValue('backgroundStyle', 'matrix');
    let nickGlowEnabled = GM_getValue('nickGlowEnabled', true);
    let avatarGlowEnabled = GM_getValue('avatarGlowEnabled', true);
    let antiCensorshipEnabled = GM_getValue('antiCensorshipEnabled', true);
    let autoLikeUsers = JSON.parse(GM_getValue('itd_auto_like_users', '{}'));
    let autoLikeEnabled = GM_getValue('autoLikeEnabled', true);

    const domCache = {
        nickContainers: new Map(),
        avatarElements: new Map(),
        postElements: new Map(),
        bannerElements: new Map()
    };
    const AUTO_LIKE_CACHE_KEY = 'itd_auto_like_full_cache';
    const CACHE_TTL = 10 * 60 * 1000;

    let autoLikeTimers = {};
    const LIKE_INTERVAL_MIN = 2 * 60 * 1000;
    const LIKE_INTERVAL_MAX = 5 * 60 * 1000;

    async function likePostsForUser(username) {
        try {
            let token = await getAccessToken();
            let response = await fetch(`/api/posts/user/${username}?limit=7`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401) {
                token = await getAccessToken();
                response = await fetch(`/api/posts/user/${username}?limit=7`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            if (!response.ok) return;
            const data = await response.json();
            const posts = data.data?.posts || data.posts || [];
            if (!posts.length) return;

            const lastId = GM_getValue(`lastPostId_${username}`, null);
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            const candidates = posts
                .filter(p => p.isLiked === false && (now - new Date(p.createdAt).getTime()) <= oneDay && p.id !== lastId)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            for (const post of candidates) {
                let likeRes = await fetch(`/api/posts/${post.id}/like`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: '{}'
                });

                if (likeRes.status === 401) {
                    token = await getAccessToken();
                    likeRes = await fetch(`/api/posts/${post.id}/like`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: '{}'
                    });
                }

                if (likeRes.ok) {
                    GM_setValue(`lastPostId_${username}`, post.id);
                    await new Promise(r => setTimeout(r, 300));
                }
            }
        } catch (e) {
        }
    }

    async function processAllAutoLikes() {
        if (!autoLikeEnabled) return;
        const activeUsers = Object.keys(autoLikeUsers).filter(u => autoLikeUsers[u] === true);
        if (!activeUsers.length) return;

        await Promise.all(activeUsers.map(username => likePostsForUser(username)));
    }

    function scheduleAutoLike() {
        const delay = Math.floor(Math.random() * (LIKE_INTERVAL_MAX - LIKE_INTERVAL_MIN + 1) + LIKE_INTERVAL_MIN);
        setTimeout(() => {
            processAllAutoLikes().finally(() => scheduleAutoLike());
        }, delay);
    }

    const CYCLE_DURATION = 12000;

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
    canvas.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;opacity:0.18;pointer-events:none;`;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const fontSize = 14;
    let columns, drops = [];
    let bgState = {
        stars: [],
        particles: [],
        time: 0
    };

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
            ctx.fillStyle = `hsl(${charHue}, ${saturation}%, 40%)`;
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }

    function initStars() {
        bgState.stars = [];
        for (let i = 0; i < 150; i++) {
            bgState.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 2 + 0.5,
                alpha: Math.random(),
                speed: 0.005 + Math.random() * 0.02
            });
        }
    }

    function drawStars() {
        const currentArea = canvas.width * canvas.height;
        const expectedCount = Math.min(2000, Math.floor(currentArea * 0.0003));

        if (bgState.stars.length === 0 ||
            bgState.stars.length !== expectedCount ||
            bgState._lastWidth !== canvas.width ||
            bgState._lastHeight !== canvas.height) {

            bgState.stars = [];
            bgState._lastWidth = canvas.width;
            bgState._lastHeight = canvas.height;

            const count = expectedCount;

            for (let i = 0; i < count; i++) {
                bgState.stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    r: Math.random() * 2.5 + 0.5,
                    alpha: Math.random(),
                    speed: 0.02 + Math.random() * 0.06,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const style = nickStyles[currentStyle];
        let hue, sat, light = 60;
        if (currentStyle === 'rainbow') {
            hue = globalHue;
            sat = 100;
        } else {
            hue = style.matrixHue || 210;
            sat = style.matrixSat !== undefined ? style.matrixSat : 100;
        }

        const finalSat = Math.min(100, sat * 1.2);

        bgState.stars.forEach(s => {
            s.phase += s.speed;
            const alpha = 0.1 + 0.9 * (0.5 + 0.5 * Math.sin(s.phase));
            const flash = Math.random() > 0.99 ? 1.5 : 1.0;
            const finalAlpha = Math.min(1, alpha * flash);

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue}, ${finalSat}%, ${light}%, ${finalAlpha})`;
            ctx.fill();

            if (s.r > 1.5) {
                ctx.shadowColor = `hsla(${hue}, ${finalSat}%, ${light}%, ${finalAlpha * 0.8})`;
                ctx.shadowBlur = 20 + s.r * 5;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });
    }

    function initParticles() {
        bgState.particles = [];
        for (let i = 0; i < 80; i++) {
            bgState.particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                r: Math.random() * 2 + 1,
                alpha: Math.random() * 0.5 + 0.2
            });
        }
    }

    function drawParticles() {
        const area = canvas.width * canvas.height;
        const targetCount = Math.min(200, Math.floor(area * 0.0003));

        if (bgState.particles.length === 0 ||
            bgState.particles.length !== targetCount ||
            bgState._lastWidth !== canvas.width ||
            bgState._lastHeight !== canvas.height) {

            bgState.particles = [];
            bgState._lastWidth = canvas.width;
            bgState._lastHeight = canvas.height;

            for (let i = 0; i < targetCount; i++) {
                bgState.particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 1.2,
                    vy: (Math.random() - 0.5) * 1.2,
                    r: Math.random() * 3 + 1,
                    alpha: Math.random() * 0.5 + 0.5,
                    phase: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.02 + Math.random() * 0.04
                });
            }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const style = nickStyles[currentStyle];
        let hue, sat, light = 85;
        if (currentStyle === 'rainbow') {
            hue = globalHue;
            sat = 100;
        } else {
            hue = style.matrixHue || 210;
            sat = style.matrixSat !== undefined ? style.matrixSat : 100;
        }

        const finalSat = Math.min(100, sat * 1.5);
        const finalLight = Math.min(80, light + 15);
        const maxDist = Math.min(200, Math.max(100, Math.min(canvas.width, canvas.height) * 0.1));
        const maxDistSq = maxDist * maxDist;

        bgState.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            p.phase += p.pulseSpeed;
            const pulse = 0.8 + 0.2 * Math.sin(p.phase);
            const currentR = p.r * pulse;

            const flicker = 0.85 + 0.15 * Math.sin(p.phase * 1.5 + 1.2);
            const currentAlpha = Math.min(1, p.alpha * flicker * 1.2);

            ctx.beginPath();
            ctx.arc(p.x, p.y, currentR, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue}, ${finalSat}%, ${finalLight}%, ${currentAlpha})`;
            ctx.fill();

            ctx.shadowColor = `hsla(${hue}, ${finalSat}%, ${finalLight}%, ${currentAlpha * 0.8})`;
            ctx.shadowBlur = 15 + currentR * 5;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        for (let i = 0; i < bgState.particles.length; i++) {
            const p1 = bgState.particles[i];
            for (let j = i + 1; j < bgState.particles.length; j++) {
                const p2 = bgState.particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < maxDistSq) {
                    const dist = Math.sqrt(distSq);
                    const alpha1 = Math.min(1, p1.alpha * (0.8 + 0.2 * Math.sin(p1.phase)));
                    const alpha2 = Math.min(1, p2.alpha * (0.8 + 0.2 * Math.sin(p2.phase)));
                    const avgAlpha = (alpha1 + alpha2) * 0.5;
                    const distFactor = 1 - dist / maxDist;
                    const lineAlpha = 0.35 * distFactor * avgAlpha;

                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `hsla(${hue}, ${finalSat}%, ${finalLight}%, ${lineAlpha})`;
                    ctx.lineWidth = 0.5 + 2.5 * distFactor;
                    ctx.stroke();
                }
            }
        }
    }

    function drawWaves() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        bgState.time += 0.01;

        const style = nickStyles[currentStyle];
        let hue, sat, light = 60;
        if (currentStyle === 'rainbow') {
            hue = globalHue;
            sat = 100;
        } else {
            hue = style.matrixHue || 210;
            sat = style.matrixSat !== undefined ? style.matrixSat : 100;
        }

        const finalSat = Math.min(100, sat * 1.3);
        const finalLight = Math.min(80, light + 15);

        const waveConfigs = [
            { amp1: 100, freq1: 0.008, speed1: 0.4, amp2: 50, freq2: 0.018, speed2: 0.7, amp3: 70, freq3: 0.004, speed3: 0.25, alpha: 0.45, offset: 0 },
            { amp1: 80, freq1: 0.009, speed1: 0.5, amp2: 40, freq2: 0.020, speed2: 0.8, amp3: 60, freq3: 0.005, speed3: 0.3, alpha: 0.35, offset: 1.5 },
            { amp1: 60, freq1: 0.010, speed1: 0.6, amp2: 30, freq2: 0.022, speed2: 0.9, amp3: 50, freq3: 0.006, speed3: 0.35, alpha: 0.28, offset: 3.0 },
            { amp1: 40, freq1: 0.011, speed1: 0.7, amp2: 20, freq2: 0.025, speed2: 1.0, amp3: 30, freq3: 0.007, speed3: 0.4, alpha: 0.20, offset: 4.5 }
        ];

        const colors = [
            `hsla(${hue}, ${finalSat}%, ${finalLight + 15}%, ${waveConfigs[0].alpha})`,
            `hsla(${hue + 15}, ${finalSat}%, ${finalLight + 10}%, ${waveConfigs[1].alpha})`,
            `hsla(${hue - 15}, ${finalSat}%, ${finalLight + 5}%, ${waveConfigs[2].alpha})`,
            `hsla(${hue + 30}, ${finalSat}%, ${finalLight}%, ${waveConfigs[3].alpha})`
        ];

        const waveHeight = Math.min(200, Math.max(80, canvas.height * 0.15));
        const waveOffset = canvas.height * 0.5;

        waveConfigs.forEach((cfg, w) => {
            ctx.beginPath();
            for (let x = 0; x < canvas.width; x += 1.5) {
                const y = waveOffset +
                    Math.sin(x * cfg.freq1 + bgState.time * cfg.speed1 + cfg.offset) * cfg.amp1 * (waveHeight / 100) +
                    Math.sin(x * cfg.freq2 + bgState.time * cfg.speed2 + cfg.offset * 0.7) * cfg.amp2 * (waveHeight / 100) +
                    Math.sin(x * cfg.freq3 + bgState.time * cfg.speed3 + cfg.offset * 2) * cfg.amp3 * (waveHeight / 100);
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }

            ctx.strokeStyle = colors[w];
            ctx.lineWidth = 2 + w * 0.5;
            ctx.shadowColor = colors[w];
            ctx.shadowBlur = 15 + w * 5;
            ctx.stroke();
            ctx.shadowBlur = 0;
        });
    }

    function drawBackground() {
        if (!backgroundEnabled) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        switch (backgroundStyle) {
            case 'stars':
                drawStars();
                break;
            case 'waves':
                drawWaves();
                break;
            case 'particles':
                drawParticles();
                break;
            case 'matrix':
            default:
                drawMatrix();
                break;
        }
    }

    function updateAvatarGlow() {
        const avatars = document.querySelectorAll('.my-avatar-glow');
        const avatarsLength = avatars.length;
        if (avatarsLength === 0) return;

        if (!avatarGlowEnabled) {
            for (let i = 0; i < avatarsLength; i++) {
                avatars[i].style.filter = 'none';
            }
            return;
        }

        const isRainbow = currentStyle === 'rainbow';
        const style = nickStyles[currentStyle];
        const hue = isRainbow ? globalHue : (style.avatarHue || 210);
        const sat = style.avatarSat !== undefined ? style.avatarSat : 100;
        const filterValue = isRainbow
            ? `drop-shadow(0 0 5px hsl(${hue}, 100%, 55%)) drop-shadow(0 0 12px hsl(${hue}, 100%, 55%))`
            : `drop-shadow(0 0 3px hsl(${hue}, ${sat}%, 60%)) drop-shadow(0 0 6px hsl(${hue}, ${sat}%, 60%))`;

        for (let i = 0; i < avatarsLength; i++) {
            avatars[i].style.filter = filterValue;
        }
    }

    function glowMyAvatar(avatar) {
        if (!avatar || !avatar.isConnected || avatar.classList.contains('my-avatar-glow')) {
            return false;
        }
        avatar.classList.add('my-avatar-glow');
        updateAvatarGlow();
        return true;
    }

    function updateAllNickColors() {
        const style = nickStyles[currentStyle];
        const isRainbow = currentStyle === 'rainbow';
        const color = isRainbow ? `hsl(${globalHue}, 100%, 55%)` : null;
        const isDark = !isRainbow && document.documentElement.getAttribute('data-theme') === 'dark';
        const gradient = isRainbow ? null : (isDark && style.gradientDark ? style.gradientDark : style.gradientLight);

        const nickElementsArray = Array.from(nickElements);
        const nickElementsLength = nickElementsArray.length;

        if (nickElementsLength === 0) return;

        if (isRainbow) {
            const textShadow = `0 0 5px ${color}`;
            for (let i = 0; i < nickElementsLength; i++) {
                const el = nickElementsArray[i];
                if (el && el.isConnected) {
                    el.style.color = color;
                    el.style.textShadow = textShadow;
                    el.style.webkitTextFillColor = '';
                    el.style.background = '';
                }
            }
        } else if (gradient) {
            for (let i = 0; i < nickElementsLength; i++) {
                const el = nickElementsArray[i];
                if (el && el.isConnected) {
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

    function updateNickGlow() {
        if (!nickGlowEnabled) {
            const nickElementsArray = Array.from(nickElements);
            const nickElementsLength = nickElementsArray.length;
            if (nickElementsLength === 0) return;

            for (let i = 0; i < nickElementsLength; i++) {
                const nickSpan = nickElementsArray[i];
                if (nickSpan && nickSpan.isConnected) {
                    const parentBlock = nickSpan.closest('.' + SELECTORS.nickContainer);
                    if (parentBlock) {
                        parentBlock.style.filter = 'none';
                    }
                }
            }
            return;
        }

        const isRainbow = currentStyle === 'rainbow';
        const color = isRainbow ? `hsl(${globalHue}, 100%, 55%)` : null;
        const style = nickStyles[currentStyle];
        const glow = isRainbow ? color : style.glow;

        const nickElementsArray = Array.from(nickElements);
        const nickElementsLength = nickElementsArray.length;
        if (nickElementsLength === 0) return;

        const glowValue = isRainbow ? `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})` : glow;

        for (let i = 0; i < nickElementsLength; i++) {
            const nickSpan = nickElementsArray[i];
            if (nickSpan && nickSpan.isConnected) {
                const parentBlock = nickSpan.closest('.' + SELECTORS.nickContainer);
                if (parentBlock) {
                    parentBlock.style.filter = glowValue;
                }
            }
        }
    }

    function updateColors() {
        if (currentStyle === 'rainbow') {
            globalHue += colorDirection * 0.8;
            if (globalHue >= 360) {
                globalHue = 360;
                colorDirection = -1;
            } else if (globalHue <= 0) {
                globalHue = 0;
                colorDirection = 1;
            }
        }

        updateAllNickColors();
        updateNickGlow();
        updateAvatarGlow();
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

    let bgDropdown = null;
    let bgScrollHandler = null;
    let bgResizeHandler = null;
    let bgCloseHandler = null;
    let currentBgButton = null;

    function getBgIconDot(styleKey) {
        const icons = {
            matrix: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><text x="12" y="16" font-size="14" text-anchor="middle" fill="currentColor" stroke="none">01</text></svg>`,
            stars: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
            waves: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12c2.5-3 5-3 7.5 0s5 3 7.5 0"/><path d="M3 18c2.5-3 5-3 7.5 0s5 3 7.5 0"/><path d="M3 6c2.5-3 5-3 7.5 0s5 3 7.5 0"/></svg>`,
            particles: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><circle cx="12" cy="12" r="2"/><line x1="6" y1="6" x2="18" y2="6"/><line x1="6" y1="6" x2="6" y2="18"/><line x1="18" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="18"/><line x1="6" y1="6" x2="12" y2="12"/><line x1="18" y1="6" x2="12" y2="12"/></svg>`
        };
        const dot = document.createElement('div');
        dot.style.cssText = `
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: var(--text-primary, currentColor);
    `;
        dot.innerHTML = icons[styleKey] || icons.matrix;
        return dot;
    }

    function updateBgDropdownPosition() {
        if (!bgDropdown || !currentBgButton || !currentBgButton.isConnected) return;
        const rect = currentBgButton.getBoundingClientRect();

        const isButtonVisible = rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;

        if (!isButtonVisible) {
            bgDropdown.remove();
            bgDropdown = null;
            if (bgScrollHandler) window.removeEventListener('scroll', bgScrollHandler);
            if (bgResizeHandler) window.removeEventListener('resize', bgResizeHandler);
            if (bgCloseHandler) document.removeEventListener('click', bgCloseHandler);
            currentBgButton = null;
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

        const dropdownHeight = 4 * 42;
        if (top + dropdownHeight > window.innerHeight) {
            top = window.innerHeight - dropdownHeight - 8;
        }
        if (top < 8) {
            top = 8;
        }

        bgDropdown.style.position = 'fixed';
        bgDropdown.style.top = `${top}px`;
        bgDropdown.style.left = `${left}px`;
    }

    function createBgDropdown(button) {
        if (autoLikeDropdown) {
            autoLikeDropdown.remove();
            autoLikeDropdown = null;
            cleanupAutoLikeHandlers();
            currentAutoLikeButton = null;
        }

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
            settingsDropdown = null;
            if (settingsCloseHandler) document.removeEventListener('click', settingsCloseHandler);
            if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
        }

        if (bgDropdown) {
            bgDropdown.remove();
            if (bgScrollHandler) window.removeEventListener('scroll', bgScrollHandler);
            if (bgResizeHandler) window.removeEventListener('resize', bgResizeHandler);
            if (bgCloseHandler) document.removeEventListener('click', bgCloseHandler);
        }

        currentBgButton = button;
        bgDropdown = document.createElement('div');
        bgDropdown.className = 'nick-style-dropdown';
        bgDropdown.style.minWidth = '210px';

        const bgStyles = ['matrix', 'stars', 'waves', 'particles'];
        const styleNames = {
            matrix: 'Матрица',
            stars: 'Звёзды',
            waves: 'Волны',
            particles: 'Частицы'
        };

        bgStyles.forEach(key => {
            const option = document.createElement('div');
            option.className = 'nick-style-option';

            const iconDot = getBgIconDot(key);
            const textSpan = document.createElement('span');
            textSpan.textContent = styleNames[key];

            option.appendChild(iconDot);
            option.appendChild(textSpan);

            option.onclick = (e) => {
                e.stopPropagation();
                backgroundStyle = key;
                GM_setValue('backgroundStyle', backgroundStyle);

                if (currentBgButton) {
                    currentBgButton.title = 'Стиль фона: ' + styleNames[backgroundStyle];
                }

                updateBackgroundToggleButtons();

                drawBackground();

                bgDropdown.remove();
                bgDropdown = null;
                if (bgScrollHandler) window.removeEventListener('scroll', bgScrollHandler);
                if (bgResizeHandler) window.removeEventListener('resize', bgResizeHandler);
                if (bgCloseHandler) document.removeEventListener('click', bgCloseHandler);
                currentBgButton = null;
            };
            bgDropdown.appendChild(option);
        });

        updateBgDropdownPosition();
        document.body.appendChild(bgDropdown);

        bgScrollHandler = () => updateBgDropdownPosition();
        bgResizeHandler = () => updateBgDropdownPosition();

        window.addEventListener('scroll', bgScrollHandler);
        window.addEventListener('resize', bgResizeHandler);

        bgCloseHandler = (e) => {
            if (bgDropdown && !bgDropdown.contains(e.target) && e.target !== currentBgButton) {
                bgDropdown.remove();
                bgDropdown = null;
                window.removeEventListener('scroll', bgScrollHandler);
                window.removeEventListener('resize', bgResizeHandler);
                document.removeEventListener('click', bgCloseHandler);
                currentBgButton = null;
            }
        };
        setTimeout(() => document.addEventListener('click', bgCloseHandler), 0);
    }

    let autoLikeDropdown = null;
    let autoLikeScrollHandler = null;
    let autoLikeResizeHandler = null;
    let autoLikeCloseHandler = null;
    let currentAutoLikeButton = null;

    function updateAutoLikeDropdownPosition() {
        if (!autoLikeDropdown || !currentAutoLikeButton || !currentAutoLikeButton.isConnected) return;
        const rect = currentAutoLikeButton.getBoundingClientRect();

        const isButtonVisible = rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;

        if (!isButtonVisible) {
            autoLikeDropdown.remove();
            autoLikeDropdown = null;
            cleanupAutoLikeHandlers();
            return;
        }

        let left = rect.right + 8;
        let top = rect.top;

        const dropdownWidth = 240;
        if (left + dropdownWidth > window.innerWidth) {
            left = rect.left - dropdownWidth - 8;
        }
        if (left < 8) left = 8;

        const dropdownHeight = 400;
        if (top + dropdownHeight > window.innerHeight) {
            top = window.innerHeight - dropdownHeight - 8;
        }
        if (top < 8) top = 8;

        autoLikeDropdown.style.top = top + 'px';
        autoLikeDropdown.style.left = left + 'px';
    }

    function cleanupAutoLikeHandlers() {
        if (autoLikeScrollHandler) window.removeEventListener('scroll', autoLikeScrollHandler);
        if (autoLikeResizeHandler) window.removeEventListener('resize', autoLikeResizeHandler);
        if (autoLikeCloseHandler) document.removeEventListener('click', autoLikeCloseHandler);
        autoLikeScrollHandler = autoLikeResizeHandler = autoLikeCloseHandler = null;
    }

    function renderAutoLikeUsers(container, footer, usersData) {
        const users = Object.keys(usersData).sort((a, b) => a === 'NeuroSFW' ? -1 : b === 'NeuroSFW' ? 1 : a.localeCompare(b));

        if (!users.length) {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-secondary);">Нет пользователей</div>';
            footer.textContent = 'Активно: 0';
            return;
        }

        container.innerHTML = '';
        for (const username of users) {
            const data = usersData[username];
            if (!data) continue;
            const displayName = (data.displayName || username).slice(0, 20);
            const avatar = data.avatar || '👤';
            const isActive = autoLikeUsers[username] || false;

            const row = document.createElement('div');
            row.className = 'auto-like-option-fixed';
            row.style.cssText = 'padding:8px 12px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;border-radius:16px;transition:all 0.15s;';
            row.onmouseenter = () => row.style.background = 'var(--bg-hover, rgba(0,128,255,0.15))';
            row.onmouseleave = () => row.style.background = 'transparent';

            const left = document.createElement('div');
            left.style.cssText = 'display:flex;align-items:center;gap:10px;flex:1;min-width:0;';
            const av = document.createElement('div');
            av.textContent = avatar;
            av.style.cssText = 'width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(0,0,0,0.2);flex-shrink:0;';
            left.appendChild(av);
            const names = document.createElement('div');
            names.style.cssText = 'display:flex;flex-direction:column;min-width:0;';
            const nameSpan = document.createElement('span');
            nameSpan.textContent = displayName;
            nameSpan.style.cssText = 'font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
            names.appendChild(nameSpan);
            const unameSpan = document.createElement('span');
            unameSpan.textContent = `@${username}`;
            unameSpan.style.cssText = 'font-size:11px;color:var(--text-secondary);';
            names.appendChild(unameSpan);
            left.appendChild(names);
            row.appendChild(left);

            const toggle = document.createElement('div');
            toggle.className = 'toggle-switch' + (isActive ? ' active' : '');
            toggle.style.cssText = 'width:40px;height:22px;background:rgba(0,0,0,0.5);border-radius:11px;position:relative;transition:all 0.2s ease;flex-shrink:0;cursor:pointer;';
            toggle.style.background = isActive ? 'var(--accent-primary, #0080FF)' : 'rgba(0,0,0,0.5)';
            row.appendChild(toggle);

            row.addEventListener('click', () => {
                const nowActive = toggle.classList.toggle('active');
                if (nowActive) {
                    autoLikeUsers[username] = true;
                    toggle.style.background = 'var(--accent-primary, #0080FF)';
                } else {
                    delete autoLikeUsers[username];
                    toggle.style.background = 'rgba(0,0,0,0.5)';
                }
                saveAutoLikeUsers();
                const count = Object.keys(autoLikeUsers).length;
                footer.textContent = count > 0 ? `Активно: ${count}` : 'Активно: 0';

                if (currentAutoLikeButton) {
                    currentAutoLikeButton.style.color = count > 0 ? 'var(--accent-primary, #0080FF)' : 'var(--text-primary, currentColor)';
                }
            });

            container.appendChild(row);
        }
        const activeCount = Object.keys(autoLikeUsers).length;
        footer.textContent = activeCount > 0 ? `Активно: ${activeCount}` : 'Активно: 0';
    }

    function createAutoLikeDropdown(button) {
        if (dropdown) {
            dropdown.remove();
            dropdown = null;
            if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
            if (closeHandler) document.removeEventListener('click', closeHandler);
            scrollHandler = resizeHandler = closeHandler = null;
            currentButton = null;
        }
        if (bgDropdown) {
            bgDropdown.remove();
            bgDropdown = null;
            if (bgScrollHandler) window.removeEventListener('scroll', bgScrollHandler);
            if (bgResizeHandler) window.removeEventListener('resize', bgResizeHandler);
            if (bgCloseHandler) document.removeEventListener('click', bgCloseHandler);
            bgScrollHandler = bgResizeHandler = bgCloseHandler = null;
            currentBgButton = null;
        }
        if (settingsDropdown) {
            settingsDropdown.remove();
            settingsDropdown = null;
            if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
            if (settingsCloseHandler) document.removeEventListener('click', settingsCloseHandler);
            scrollHandler = resizeHandler = settingsCloseHandler = null;
        }
        if (autoLikeDropdown) { autoLikeDropdown.remove(); cleanupAutoLikeHandlers(); }

        currentAutoLikeButton = button;
        autoLikeDropdown = document.createElement('div');
        autoLikeDropdown.className = 'nick-style-dropdown';
        autoLikeDropdown.style.cssText = `
        min-width: 240px;
        max-height: 400px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        position: fixed;
        background: var(--block-bg, #1e1e2e);
        border-radius: 24px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        border: 1px solid var(--border-color, rgba(255,255,255,0.1));
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        z-index: 10002;
        animation: dropdownFadeIn 0.15s ease;
    `;

        const container = document.createElement('div');
        container.style.cssText = 'overflow-y:auto;flex:1;padding:4px 0;display:flex;flex-direction:column;gap:2px;max-height:350px;';
        autoLikeDropdown.appendChild(container);

        const footer = document.createElement('div');
        footer.style.cssText = 'padding:8px 12px;text-align:center;font-size:12px;color:var(--text-secondary);border-top:1px solid var(--border-color);flex-shrink:0;';
        autoLikeDropdown.appendChild(footer);

        container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-secondary);">Загрузка...</div>';
        footer.textContent = 'Активно: 0';

        document.body.appendChild(autoLikeDropdown);
        updateAutoLikeDropdownPosition();

        autoLikeScrollHandler = () => updateAutoLikeDropdownPosition();
        autoLikeResizeHandler = () => updateAutoLikeDropdownPosition();
        window.addEventListener('scroll', autoLikeScrollHandler);
        window.addEventListener('resize', autoLikeResizeHandler);

        autoLikeCloseHandler = (e) => {
            if (autoLikeDropdown && !autoLikeDropdown.contains(e.target) && e.target !== currentAutoLikeButton) {
                autoLikeDropdown.remove();
                autoLikeDropdown = null;
                cleanupAutoLikeHandlers();
                currentAutoLikeButton = null;
            }
        };
        setTimeout(() => document.addEventListener('click', autoLikeCloseHandler), 0);

        fetchAutoLikeUsers().then(usersData => {
            if (Object.keys(usersData).length) {
                setAutoLikeCache(usersData);
            }
            renderAutoLikeUsers(container, footer, usersData);
            updateAutoLikeDropdownPosition();
        }).catch(() => {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-secondary);">Ошибка загрузки</div>';
            footer.textContent = 'Активно: 0';
        });
    }

    function createDropdown(button) {
        if (autoLikeDropdown) {
            autoLikeDropdown.remove();
            autoLikeDropdown = null;
            cleanupAutoLikeHandlers();
            currentAutoLikeButton = null;
        }

        if (settingsDropdown) {
            settingsDropdown.remove();
            settingsDropdown = null;
            if (settingsCloseHandler) document.removeEventListener('click', settingsCloseHandler);
            if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
        }

        if (bgDropdown) {
            bgDropdown.remove();
            bgDropdown = null;
            if (bgScrollHandler) window.removeEventListener('scroll', bgScrollHandler);
            if (bgResizeHandler) window.removeEventListener('resize', bgResizeHandler);
            if (bgCloseHandler) document.removeEventListener('click', bgCloseHandler);
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
                initPostBorderSync();

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
        if (!nickSpan || !nickSpan.isConnected) return;

        const nickText = nickSpan.textContent.trim();
        if (nickText !== myUsername && nickText !== myDisplayName) return;

        if (nickContainer.querySelector('.nick-controls-panel')) return;

        const controlsPanel = document.createElement('div');
        controlsPanel.className = 'nick-controls-panel';

        const styleButton = document.createElement('span');
        styleButton.className = 'nick-style-toggle';
        styleButton.title = `Стиль: ${nickStyles[currentStyle].name}`;
        styleButton.innerHTML = ICONS.PALETTE;

        styleButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            createDropdown(styleButton);
        });

        controlsPanel.appendChild(styleButton);

        const likeBtn = document.createElement('span');
        likeBtn.className = 'auto-like-toggle';
        likeBtn.title = 'Автолайки';
        const hasActive = Object.keys(autoLikeUsers).length > 0;
        likeBtn.innerHTML = ICONS.settings['Автолайки'];

        likeBtn.style.cssText = `
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 32px !important;
    height: 32px !important;
    cursor: pointer !important;
    background: var(--bg-secondary, rgba(128, 128, 128, 0.15)) !important;
    border-radius: 50% !important;
    transition: all 0.2s ease !important;
    color: ${hasActive ? 'var(--accent-primary, #0080FF)' : 'var(--text-primary, currentColor)'} !important;
    user-select: none !important;
    flex-shrink: 0 !important;
`;
        likeBtn.onmouseenter = () => {
            likeBtn.style.background = 'var(--accent-primary, rgba(0, 128, 255, 0.3))';
            if (likeBtn.style.color === 'var(--accent-primary, #0080FF)') {
                likeBtn.style.color = 'white';
            }
        };
        likeBtn.onmouseleave = () => {
            likeBtn.style.background = 'var(--bg-secondary, rgba(128, 128, 128, 0.15))';
            const hasActive = Object.keys(autoLikeUsers).length > 0;
            likeBtn.style.color = hasActive ? 'var(--accent-primary, #0080FF)' : 'var(--text-primary, currentColor)';
        };
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (autoLikeDropdown) {
                autoLikeDropdown.remove();
                autoLikeDropdown = null;
                cleanupAutoLikeHandlers();
                currentAutoLikeButton = null;
                return;
            }
            createAutoLikeDropdown(likeBtn);
        });
        controlsPanel.appendChild(likeBtn);

        const bgToggle = document.createElement('span');
        bgToggle.className = 'bg-style-toggle';
        bgToggle.title = 'Стиль фона';

        bgToggle.innerHTML = ICONS.settings['Фон'];

        bgToggle.style.cssText = `
        display: ${backgroundEnabled ? 'inline-flex' : 'none'};
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        margin-left: 0;
        cursor: pointer;
        background: var(--bg-secondary, rgba(128, 128, 128, 0.15));
        border-radius: 50%;
        transition: all 0.2s ease;
        vertical-align: middle;
        flex-shrink: 0;
        color: var(--text-primary, currentColor);
        user-select: none;
        `;
        bgToggle.onmouseenter = () => { bgToggle.style.background = 'var(--accent-primary, rgba(0, 128, 255, 0.3))'; };
        bgToggle.onmouseleave = () => { bgToggle.style.background = 'var(--bg-secondary, rgba(128, 128, 128, 0.15))'; };
        bgToggle.onclick = function (e) {
            e.stopPropagation();
            e.preventDefault();
            createBgDropdown(this);
        };
        controlsPanel.appendChild(bgToggle);

        const settingsButton = document.createElement('span');
        settingsButton.className = 'settings-toggle';
        settingsButton.title = 'Настройки';
        settingsButton.innerHTML = ICONS.GEAR;

        settingsButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showSettingsDropdown(settingsButton);
        });

        controlsPanel.appendChild(settingsButton);

        nickContainer.appendChild(controlsPanel);
    }

    function updateBackgroundToggleButtons() {
        const toggles = document.querySelectorAll('.bg-style-toggle');
        toggles.forEach(toggle => {
            if (backgroundEnabled) {
                toggle.style.display = 'inline-flex';
            } else {
                toggle.style.display = 'none';
            }
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
        if (!nickContainer || !nickContainer.isConnected || nickContainer.querySelector('.settings-toggle')) return;
        const button = document.createElement('span');
        button.className = 'settings-toggle';
        button.title = 'Настройки';
        button.innerHTML = ICONS.GEAR;
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showSettingsDropdown(button);
        });
        nickContainer.appendChild(button);
    }

    function addIconsToMenu(menu) {
        if (!menu || menu.hasAttribute('data-icons-added')) return;
        const options = menu.querySelectorAll('.settings-option');
        options.forEach(opt => {
            const span = opt.querySelector('span:first-child');
            if (!span) return;
            const text = span.innerText.trim();
            if (ICONS.settings[text]) {
                if (span.querySelector('svg')) return;
                span.innerHTML = `${ICONS.settings[text]} <span style="margin-left: 8px;">${text}</span>`;
                span.style.display = 'flex';
                span.style.alignItems = 'center';
                span.style.gap = '8px';
            }
        });
        menu.setAttribute('data-icons-added', 'true');
    }

    function showSettingsDropdown(button) {
        if (autoLikeDropdown) {
            autoLikeDropdown.remove();
            autoLikeDropdown = null;
            cleanupAutoLikeHandlers();
            currentAutoLikeButton = null;
        }

        if (dropdown) {
            dropdown.remove();
            dropdown = null;
            if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
            if (closeHandler) document.removeEventListener('click', closeHandler);
            currentButton = null;
        }

        if (bgDropdown) {
            bgDropdown.remove();
            bgDropdown = null;
            if (bgScrollHandler) window.removeEventListener('scroll', bgScrollHandler);
            if (bgResizeHandler) window.removeEventListener('resize', bgResizeHandler);
            if (bgCloseHandler) document.removeEventListener('click', bgCloseHandler);
        }

        if (settingsDropdown) {
            settingsDropdown.remove();
            if (settingsCloseHandler) document.removeEventListener('click', settingsCloseHandler);
            if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
        }

        settingsDropdown = document.createElement('div');
        settingsDropdown.className = 'settings-dropdown';

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
            updateBackgroundToggleButtons();
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

        const postBorderOption = document.createElement('div');
        postBorderOption.className = 'settings-option';
        postBorderOption.innerHTML = '<span>Подсветка постов</span>';
        const postBorderToggle = document.createElement('div');
        postBorderToggle.className = 'toggle-switch' + (postBorderEnabled ? ' active' : '');
        postBorderOption.appendChild(postBorderToggle);
        postBorderOption.onclick = (e) => {
            e.stopPropagation();
            postBorderEnabled = !postBorderEnabled;
            GM_setValue('postBorderEnabled', postBorderEnabled);
            postBorderToggle.className = 'toggle-switch' + (postBorderEnabled ? ' active' : '');
            if (postBorderEnabled) {
                initPostBorderSync();
            } else {
                if (postBorderSyncStyle) postBorderSyncStyle.remove();
            }
        };
        settingsDropdown.appendChild(postBorderOption);

        const postBlurOption = document.createElement('div');
        postBlurOption.className = 'settings-option';
        postBlurOption.innerHTML = '<span>Размытый фон постов</span>';
        const postBlurToggle = document.createElement('div');
        postBlurToggle.className = 'toggle-switch' + (postBlurEnabled ? ' active' : '');
        postBlurOption.appendChild(postBlurToggle);
        postBlurOption.onclick = (e) => {
            e.stopPropagation();
            postBlurEnabled = !postBlurEnabled;
            GM_setValue('postBlurEnabled', postBlurEnabled);
            postBlurToggle.className = 'toggle-switch' + (postBlurEnabled ? ' active' : '');

            if (postBlurEnabled) {
                addBlurBackground();
                if (window._blurObserver) window._blurObserver.disconnect();
                window._blurObserver = new MutationObserver(() => addBlurBackground());
                window._blurObserver.observe(document.body, { childList: true, subtree: true });
            } else {
                if (window._blurObserver) window._blurObserver.disconnect();
                document.querySelectorAll('.itd-blur-container').forEach(el => el.remove());
                document.querySelectorAll('.NYk2, article, .KdXP').forEach(el => {
                    el.removeAttribute('data-blur-bg');
                    el.classList.remove('itd-blur-active');
                });
            }
        };
        settingsDropdown.appendChild(postBlurOption);

        const antiCensorshipOption = document.createElement('div');
        antiCensorshipOption.className = 'settings-option';
        antiCensorshipOption.innerHTML = '<span>Анти цензура</span>';
        const antiCensorshipToggle = document.createElement('div');
        antiCensorshipToggle.className = 'toggle-switch' + (antiCensorshipEnabled ? ' active' : '');
        antiCensorshipOption.appendChild(antiCensorshipToggle);
        antiCensorshipOption.onclick = (e) => {
            e.stopPropagation();
            antiCensorshipEnabled = !antiCensorshipEnabled;
            GM_setValue('antiCensorshipEnabled', antiCensorshipEnabled);
            antiCensorshipToggle.className = 'toggle-switch' + (antiCensorshipEnabled ? ' active' : '');

            if (antiCensorshipEnabled) {
                document.querySelectorAll('input[type="file"][data-overridden]').forEach(input => {
                    input.removeAttribute('data-overridden');
                    if (input._originalClick) {
                        input.click = input._originalClick;
                    }
                });
                overrideFilePicker();
                if (window._fileObserver) window._fileObserver.disconnect();
                window._fileObserver = new MutationObserver(overrideFilePicker);
                window._fileObserver.observe(document.body, { childList: true, subtree: true });
            } else {
                if (window._fileObserver) window._fileObserver.disconnect();
                document.querySelectorAll('input[type="file"][data-overridden]').forEach(input => {
                    input.removeAttribute('data-overridden');
                    if (input._originalClick) {
                        input.click = input._originalClick;
                    }
                });
            }
        };
        settingsDropdown.appendChild(antiCensorshipOption);

        const autoLikeOption = document.createElement('div');
        autoLikeOption.className = 'settings-option';
        autoLikeOption.innerHTML = '<span>Автолайки</span>';
        const autoLikeToggle = document.createElement('div');
        autoLikeToggle.className = 'toggle-switch' + (autoLikeEnabled ? ' active' : '');
        autoLikeOption.appendChild(autoLikeToggle);
        autoLikeOption.onclick = (e) => {
            e.stopPropagation();
            autoLikeEnabled = !autoLikeEnabled;
            GM_setValue('autoLikeEnabled', autoLikeEnabled);
            autoLikeToggle.className = 'toggle-switch' + (autoLikeEnabled ? ' active' : '');
            document.querySelectorAll('.auto-like-toggle').forEach(el => {
                el.style.display = autoLikeEnabled ? 'inline-flex' : 'none';
            });
            if (!autoLikeEnabled && autoLikeDropdown) {
                autoLikeDropdown.remove();
                autoLikeDropdown = null;
                cleanupAutoLikeHandlers();
                currentAutoLikeButton = null;
            }
        };
        settingsDropdown.appendChild(autoLikeOption);

        updateSettingsDropdownPosition(button);

        addIconsToMenu(settingsDropdown);

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
        imageBtn.innerHTML = ICONS.BANNER_IMAGE;

        if (deleteBtn) {
            buttonsContainer.insertBefore(imageBtn, deleteBtn);
        } else {
            buttonsContainer.appendChild(imageBtn);
        }

        changeBtn = document.createElement('button');
        changeBtn.className = SELECTORS.bannerDraw + ' custom-change-btn';
        changeBtn.title = 'Сменить картинку';
        changeBtn.style.display = 'none';
        changeBtn.innerHTML = ICONS.BANNER_IMAGE;

        cancelBtn = document.createElement('button');
        cancelBtn.className = SELECTORS.bannerDraw + ' custom-cancel-btn';
        cancelBtn.title = 'Отмена';
        cancelBtn.style.display = 'none';
        cancelBtn.innerHTML = ICONS.BANNER_CANCEL;

        applyBtn = document.createElement('button');
        applyBtn.className = SELECTORS.bannerDraw + ' custom-apply-btn';
        applyBtn.title = 'Применить';
        applyBtn.style.display = 'none';
        applyBtn.innerHTML = ICONS.BANNER_APPLY;

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

            applyBtn.innerHTML = ICONS.LOADING;
            applyBtn.disabled = true;

            try {
                const croppedBlob = await cropBannerImage();

                const token = await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: '/api/v1/auth/refresh',
                        credentials: 'include',
                        onload: (res) => {
                            try {
                                const data = JSON.parse(res.responseText);
                                resolve(data.accessToken);
                            } catch (e) { reject(e); }
                        },
                        onerror: reject
                    });
                });

                const formData = new FormData();
                formData.append('file', croppedBlob, 'banner.jpg');

                const uploadData = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', '/api/files/upload');
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try { resolve(JSON.parse(xhr.responseText)); }
                            catch (e) { reject(e); }
                        } else {
                            try {
                                const error = JSON.parse(xhr.responseText);
                                const message = error.error?.message || error.message || `Ошибка ${xhr.status}`;
                                reject(new Error(message));
                            } catch (e) {
                                reject(new Error(`Ошибка загрузки: ${xhr.status}`));
                            }
                        }
                    };
                    xhr.onerror = () => reject(new Error('Ошибка сети'));
                    xhr.send(formData);
                });

                const updateRes = await fetch('/api/users/me', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ bannerId: uploadData.id })
                });

                if (!updateRes.ok) {
                    let errorMsg = `Ошибка обновления профиля: ${updateRes.status}`;
                    try {
                        const errorData = await updateRes.json();
                        if (errorData.error?.message) errorMsg = errorData.error.message;
                    } catch (e) { }
                    throw new Error(errorMsg);
                }

                removeDraggableImage();

                const originalImg = banner.querySelector('img');
                if (originalImg) {
                    originalImg.src = uploadData.url;
                    originalImg.style.position = '';
                    originalImg.style.zIndex = '';
                }

                showNormalMode();
                alert('✅ Баннер успешно обновлён!');

            } catch (error) {
                console.error('Ошибка:', error);

                let message = error.message || 'Неизвестная ошибка';

                if (message.includes('запрещённый контент') || message.includes('CONTENT_MODERATION')) {
                    alert('❌ Изображение не прошло модерацию.\nПожалуйста, выберите другое изображение.');
                } else if (message.includes('сети') || message.includes('network')) {
                    alert('❌ Ошибка сети. Проверьте подключение к интернету.');
                } else {
                    alert(`❌ Ошибка: ${message}`);
                }

                applyBtn.innerHTML = ICONS.BANNER_APPLY;
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
            applyBtn.innerHTML = ICONS.BANNER_APPLY;
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

    let mouseMoveHandler = null;
    let mouseUpHandler = null;
    let touchMoveHandler = null;
    let touchEndHandler = null;

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

        mouseMoveHandler = (e) => {
            if (!isDragging || !draggableImg) return;
            e.preventDefault();
            const deltaY = e.clientY - dragStartY;
            let newTop = startTop + deltaY;
            const imgHeight = draggableImg.offsetHeight;
            newTop = Math.max(banner.clientHeight - imgHeight, Math.min(0, newTop));
            draggableImg.style.top = newTop + 'px';
            currentTop = newTop;
        };

        mouseUpHandler = () => {
            if (isDragging) {
                isDragging = false;
                if (draggableImg) {
                    draggableImg.style.cursor = 'grab';
                    draggableImg.style.transition = 'top 0.1s ease-out';
                }
            }
        };

        touchMoveHandler = (e) => {
            if (!isDragging || !draggableImg) return;
            e.preventDefault();
            const deltaY = e.touches[0].clientY - dragStartY;
            let newTop = startTop + deltaY;
            const imgHeight = draggableImg.offsetHeight;
            newTop = Math.max(banner.clientHeight - imgHeight, Math.min(0, newTop));
            draggableImg.style.top = newTop + 'px';
            currentTop = newTop;
        };

        touchEndHandler = () => {
            if (isDragging) {
                isDragging = false;
                if (draggableImg) draggableImg.style.transition = 'top 0.1s ease-out';
            }
        };

        window.addEventListener('mousemove', mouseMoveHandler);
        window.addEventListener('mouseup', mouseUpHandler);
        window.addEventListener('touchmove', touchMoveHandler, { passive: false });
        window.addEventListener('touchend', touchEndHandler);
    }

    function removeDraggableImage() {
        if (draggableImg) {
            draggableImg.remove();
            draggableImg = null;
        }
        isDragging = false;
        currentTop = 0;

        if (mouseMoveHandler) {
            window.removeEventListener('mousemove', mouseMoveHandler);
            mouseMoveHandler = null;
        }
        if (mouseUpHandler) {
            window.removeEventListener('mouseup', mouseUpHandler);
            mouseUpHandler = null;
        }
        if (touchMoveHandler) {
            window.removeEventListener('touchmove', touchMoveHandler);
            touchMoveHandler = null;
        }
        if (touchEndHandler) {
            window.removeEventListener('touchend', touchEndHandler);
            touchEndHandler = null;
        }
    }

    function initBanner() {
        setTimeout(() => createAllButtons(), 500);

        const observer = new MutationObserver(() => createAllButtons());
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function getAccessToken() {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://xn--d1ah4a.com/api/v1/auth/refresh',
                credentials: 'include',
                onload: function (res) {
                    try {
                        const data = JSON.parse(res.responseText);
                        resolve(data.accessToken);
                    } catch (e) { reject(e); }
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
                    onload: function (res) {
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
                        } catch (e) {
                            console.error('Ошибка парсинга:', e);
                            isVerifying = false;
                            reject(e);
                        }
                    },
                    onerror: function (err) {
                        console.error('Ошибка запроса:', err);
                        isVerifying = false;
                        reject(err);
                    }
                });
            } catch (e) {
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
                        } catch (e) {
                            console.error('Ошибка:', e);
                            resolve(false);
                        }
                    },
                    onerror: () => resolve(false)
                });
            } catch (e) {
                console.error('Ошибка verifyMyself:', e);
                resolve(false);
            }
        });
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
                            } catch (e) { resolve(false); }
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
            } catch (e) { }
        })();
    }

    let scrollTopButton = null;

    function createScrollTopButton() {
        if (scrollTopButton) return;

        scrollTopButton = document.createElement('button');
        scrollTopButton.className = 'itd-scroll-top-btn';
        scrollTopButton.innerHTML = ICONS.SCROLL_TOP;

        scrollTopButton.style.cssText = `
        position: fixed;
        bottom: 16px;
        right: 16px;
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--glass-bg);
        -webkit-backdrop-filter: blur(16px);
        backdrop-filter: blur(16px);
        border: none;
        border-radius: 32px;
        cursor: pointer;
        pointer-events: auto;
        color: var(--text-primary);
        box-shadow: var(--shadow-elevated);
        transition: all 0.2s ease;
        z-index: 99999;
        margin: 0;
        padding: 0;
        opacity: 0;
        visibility: hidden;
    `;

        const styleId = 'itd-scroll-top-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
            .itd-scroll-top-btn::before {
                content: "";
                position: absolute;
                inset: 0;
                border-radius: inherit;
                padding: 1px;
                background: linear-gradient(to bottom, #ffffff40, #ffffff0d);
                -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
                -webkit-mask-composite: xor;
                mask-composite: exclude;
                pointer-events: none;
            }
            .itd-scroll-top-btn:hover {
                transform: scale(1.05);
                opacity: 0.9;
            }
        `;
            document.head.appendChild(style);
        }

        scrollTopButton.onclick = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        document.body.appendChild(scrollTopButton);

        function toggleScrollButton() {
            if (!scrollTopButton) return;
            if (window.scrollY > 300) {
                scrollTopButton.style.opacity = '1';
                scrollTopButton.style.visibility = 'visible';
            } else {
                scrollTopButton.style.opacity = '0';
                scrollTopButton.style.visibility = 'hidden';
            }
        }

        window.addEventListener('scroll', toggleScrollButton);
        toggleScrollButton();
    }

    function saveAutoLikeUsers() {
        GM_setValue('itd_auto_like_users', JSON.stringify(autoLikeUsers));
    }

    function getAutoLikeCache() {
        try {
            const raw = localStorage.getItem(AUTO_LIKE_CACHE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (Date.now() - data.timestamp > CACHE_TTL) return null;
            return data.usersData;
        } catch { return null; }
    }

    function setAutoLikeCache(usersData) {
        try {
            localStorage.setItem(AUTO_LIKE_CACHE_KEY, JSON.stringify({
                usersData,
                timestamp: Date.now()
            }));
        } catch { }
    }

    async function fetchAutoLikeUsers() {
        const cached = getAutoLikeCache();
        if (cached) return cached;

        const verified = JSON.parse(localStorage.getItem('itd_verified_users') || '{}');
        const usernames = Object.keys(verified);
        if (!usernames.includes('NeuroSFW')) usernames.push('NeuroSFW');
        if (!usernames.length) return {};

        const token = await getAccessToken();
        const usersData = {};
        for (const username of usernames) {
            try {
                const res = await fetch(`/api/users/${username}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) usersData[username] = await res.json();
            } catch { }
        }
        if (Object.keys(usersData).length) setAutoLikeCache(usersData);
        return usersData;
    }

    async function initVisuals() {
        try {
            const refresh = await fetch('/api/v1/auth/refresh', { method: 'POST' });
            const { accessToken } = await refresh.json();
            const meRes = await fetch('/api/users/me', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const me = await meRes.json();
            myUsername = me.username;
            myDisplayName = me.displayName;
            detectSelectors();

            document.querySelectorAll('.auto-like-toggle').forEach(el => {
                el.style.display = autoLikeEnabled ? 'inline-flex' : 'none';
            });

            createScrollTopButton();

            checkAllComments().then(() => verifyMyself());
            if (verificationInterval) clearInterval(verificationInterval);
            verificationInterval = setInterval(() => {
                checkAllComments();
            }, 10 * 60 * 1000);

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
                const nickContainers = document.querySelectorAll('.' + SELECTORS.nickContainer);
                const containersLength = nickContainers.length;
                if (containersLength === 0) return;

                const myUsernameLower = myUsername.toLowerCase();
                const myDisplayNameLower = myDisplayName.toLowerCase();

                for (let i = 0; i < containersLength; i++) {
                    const container = nickContainers[i];
                    const nickSpan = container.querySelector('.' + SELECTORS.nickText);
                    if (!nickSpan) continue;

                    const nickText = nickSpan.textContent.trim();
                    const nickTextLower = nickText.toLowerCase();
                    let username = null;
                    const isInsidePostOrNotification = !!(container.closest('article, .' + SELECTORS.post) || container.closest('.nC4O') || container.closest('.jWwe, .QAQH') || container.closest('.l8Uc') || container.closest('.aLWf, .bs4a'));

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

                    if (username && verifiedUsers[username] && username !== myUsername && nickTextLower !== myUsernameLower && nickTextLower !== myDisplayNameLower) {
                        if (!container.querySelector('.mod-badge-verify')) {
                            const isLarge = container.classList.contains(SELECTORS.largeNickClasses[0]) && container.classList.contains(SELECTORS.largeNickClasses[1]);
                            const size = isLarge ? 18 : 16;
                            const badge = document.createElement('span');
                            badge.className = 'mod-badge-verify';
                            badge.innerHTML = ICONS.badge(size);
                            badge.style.cssText = `display:inline-flex!important;align-items:center!important;width:${size}px!important;height:${size}px!important;flex-shrink:0!important;vertical-align:middle!important;margin-left:4px!important;`;
                            const voronoi = container.querySelector('.mod-badge-voronoi');
                            if (voronoi) container.insertBefore(badge, voronoi);
                            else nickSpan.insertAdjacentElement('afterend', badge);
                        }
                    }

                    if (nickTextLower !== myUsernameLower && nickTextLower !== myDisplayNameLower) continue;
                    if (!nickElements.has(nickSpan)) nickElements.add(nickSpan);

                    const isLarge = container.classList.contains(SELECTORS.largeNickClasses[0]) && container.classList.contains(SELECTORS.largeNickClasses[1]);
                    if (!container.querySelector('.mod-badge-voronoi')) {
                        const size = isLarge ? 18 : 16;
                        const badgeSVG = ICONS.badge(size);
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
                }
            }

            findAllMyAvatars();
            findAllMyNicks();
            updateAllNickColors();
            updateNickGlow();
            updateAvatarGlow();
            fixOverflowForGlowingNicks();

            const observer = new MutationObserver(() => {
                findAllMyAvatars();
                findAllMyNicks();
                fixOverflowForGlowingNicks();
            });
            observer.observe(document.body, { childList: true, subtree: true });

            function replaceIcon() {
                const container = document.querySelector('.' + SELECTORS.logoContainer);
                if (!container) return;
                const customLink = container.querySelector('a[href="https://t.me/NeuroSFW"]');
                if (customLink) return;
                const oldSvg = container.querySelector('svg');
                if (!oldSvg) return;
                const YOUR_ICON = ICONS.YOUR_LOGO;
                const link = document.createElement('a');
                link.href = 'https://t.me/NeuroSFW';
                link.target = '_blank';
                link.style.cursor = 'pointer';
                link.style.display = 'inline-flex';
                link.style.alignItems = 'center';
                const temp = document.createElement('div');
                temp.innerHTML = YOUR_ICON;
                const newSvg = temp.firstElementChild;
                newSvg.setAttribute('width', '36');
                newSvg.setAttribute('height', '36');
                link.appendChild(newSvg);
                const versionBtn = container.querySelector('.jR4T');
                let bottomBlock = container.querySelector('div[style*="font-size: 8px;"]');
                container.innerHTML = '';
                container.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start; gap: 4px;';
                const topRow = document.createElement('div');
                topRow.style.cssText = 'display: flex; flex-direction: row; align-items: center; gap: 10px;';
                topRow.appendChild(link);
                if (versionBtn) {
                    versionBtn.style.margin = '0';
                    versionBtn.style.padding = '0';
                    topRow.appendChild(versionBtn);
                } else {
                    const fallbackBtn = document.createElement('button');
                    fallbackBtn.className = 'jR4T';
                    fallbackBtn.textContent = 'v1.1.1';
                    fallbackBtn.style.margin = '0';
                    fallbackBtn.style.padding = '0';
                    topRow.appendChild(fallbackBtn);
                }
                container.appendChild(topRow);
                if (bottomBlock) {
                    bottomBlock.style.margin = '0';
                    bottomBlock.style.justifyContent = 'flex-start';
                    container.appendChild(bottomBlock);
                } else {
                    const newBottom = document.createElement('div');
                    newBottom.style.cssText = 'display: flex; align-items: center; justify-content: flex-start; font-size: 8px; color: #888; text-align: center; font-family: monospace; white-space: nowrap; gap: 4px; margin: 0;';
                    const versionSpan = document.createElement('span');
                    versionSpan.textContent = 'v' + GM_info.script.version;
                    versionSpan.style.display = 'inline-block';
                    newBottom.appendChild(versionSpan);
                    container.appendChild(newBottom);
                    container._bottomBlock = newBottom;
                }
            }

            replaceIcon();

            const iconObserver = new MutationObserver(() => replaceIcon());
            iconObserver.observe(document.body, { childList: true, subtree: true });

            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    replaceIcon();
                    updateNavIcon();
                }, 300);
            });

            let updateAvailable = false;
            const updateUrl = 'https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/main/ITD-Visual-Pack.user.js?t=' + Date.now();

            function versionCompare(v1, v2) {
                const a = v1.split('.').map(Number);
                const b = v2.split('.').map(Number);
                for (let i = 0; i < Math.max(a.length, b.length); i++) {
                    const na = a[i] || 0, nb = b[i] || 0;
                    if (na > nb) return 1;
                    if (na < nb) return -1;
                }
                return 0;
            }

            function createUpdateButton() {
                const container = document.querySelector('.' + SELECTORS.logoContainer);
                if (!container) return;
                if (container.querySelector('.itd-update-sidebar-btn')) return;
                let bottomBlock = container.querySelector('div[style*="font-size: 8px;"]');
                if (!bottomBlock) {
                    const allDivs = container.querySelectorAll('div');
                    for (const div of allDivs) {
                        if (div.textContent.includes('v' + GM_info.script.version)) {
                            bottomBlock = div;
                            break;
                        }
                    }
                }
                if (!bottomBlock) return;
                let versionSpan = bottomBlock.querySelector('span');
                if (!versionSpan) {
                    versionSpan = document.createElement('span');
                    versionSpan.textContent = 'v' + GM_info.script.version;
                    versionSpan.style.display = 'inline-block';
                    bottomBlock.prepend(versionSpan);
                }
                const btn = document.createElement('button');
                btn.className = 'itd-update-sidebar-btn';
                btn.title = 'Доступна новая версия';
                btn.innerHTML = ICONS.UPDATE + ' <span>Обновить</span>';
                btn.style.cssText = 'background: var(--accent-primary, #0080FF); color: #fff; border: none; border-radius: 4px; padding: 2px 6px; font-size: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 3px; white-space: nowrap; height: 16px; line-height: 1; flex-shrink: 0;';
                btn.onmouseenter = function () { this.style.transform = 'scale(1.05)'; this.style.background = '#0066cc'; };
                btn.onmouseleave = function () { this.style.transform = 'scale(1)'; this.style.background = 'var(--accent-primary, #0080FF)'; };
                btn.onclick = function () { window.open(updateUrl, '_blank'); this.remove(); };
                versionSpan.after(btn);
            }

            function checkForUpdate() {
                const currentVersion = GM_info.script.version;
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: updateUrl,
                    onload: function (res) {
                        if (res.status !== 200) return;
                        const scriptText = res.responseText;
                        const versionMatch = scriptText.match(/\/\/\s*@version\s+([\d.]+)/);
                        if (!versionMatch) return;
                        const latestVersion = versionMatch[1];
                        console.log('📊 Текущая версия:', currentVersion);
                        console.log('📊 Последняя версия:', latestVersion);
                        if (versionCompare(latestVersion, currentVersion) > 0) {
                            updateAvailable = true;
                            console.log('✅ Доступно обновление!');
                            setTimeout(createUpdateButton, 1000);
                        }
                    },
                    onerror: function () { }
                });
            }

            setTimeout(checkForUpdate, 1000);

            const originalReplaceIcon = replaceIcon;
            replaceIcon = function () {
                originalReplaceIcon();
                if (updateAvailable) {
                    setTimeout(createUpdateButton, 500);
                }
            };
            function checkNavUpdateButton() {
                const nav = document.querySelector('.MtNy');
                if (!nav) return;
                const block = nav.querySelector('.my-nav-block');
                if (!block) return;
                const updateBtn = block.querySelector('.itd-update-sidebar-btn');
                if (!updateBtn) return;

                GM_xmlhttpRequest({
                    method: 'GET',
                    url: updateUrl,
                    onload: function (res) {
                        if (res.status !== 200) return;
                        const scriptText = res.responseText;
                        const versionMatch = scriptText.match(/\/\/\s*@version\s+([\d.]+)/);
                        if (!versionMatch) return;
                        const latestVersion = versionMatch[1];
                        const currentVersion = GM_info.script.version;
                        if (versionCompare(latestVersion, currentVersion) > 0) {
                            updateBtn.style.display = 'inline-flex';
                        }
                    },
                    onerror: function () { }
                });
            }

            function createNavIcon() {
                const nav = document.querySelector('.MtNy');
                if (!nav) return;
                if (nav.querySelector('.my-nav-block')) return;

                const block = document.createElement('div');
                block.className = 'my-nav-block';
                block.style.cssText = 'display: flex; align-items: center; gap: 12px; flex-shrink: 0;';

                const wrapper = document.createElement('div');
                wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 2px;';

                const YOUR_ICON = ICONS.YOUR_LOGO;
                const link = document.createElement('a');
                link.href = 'https://t.me/NeuroSFW';
                link.target = '_blank';
                link.style.cursor = 'pointer';
                link.style.display = 'inline-flex';
                link.style.alignItems = 'center';
                const temp = document.createElement('div');
                temp.innerHTML = YOUR_ICON;
                const newSvg = temp.firstElementChild;
                newSvg.setAttribute('width', '28');
                newSvg.setAttribute('height', '28');
                link.appendChild(newSvg);
                wrapper.appendChild(link);

                const bottomRow = document.createElement('div');
                bottomRow.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 2px;';

                const versionSpan = document.createElement('span');
                versionSpan.textContent = 'v' + GM_info.script.version;
                versionSpan.style.cssText = 'font-size: 8px; color: #888; font-family: monospace; line-height: 1;';
                bottomRow.appendChild(versionSpan);

                const updateBtn = document.createElement('button');
                updateBtn.className = 'itd-update-sidebar-btn';
                updateBtn.title = 'Доступна новая версия';
                updateBtn.innerHTML = ICONS.UPDATE + ' <span>Обновить</span>';
                updateBtn.style.cssText = 'background: var(--accent-primary, #0080FF); color: #fff; border: none; border-radius: 4px; padding: 2px 6px; font-size: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; display: none; align-items: center; justify-content: center; gap: 3px; white-space: nowrap; height: 16px; line-height: 1; flex-shrink: 0; margin-top: 1px;';
                updateBtn.onclick = function () {
                    window.open(updateUrl, '_blank');
                    this.remove();
                };
                bottomRow.appendChild(updateBtn);

                wrapper.appendChild(bottomRow);
                block.appendChild(wrapper);

                nav.prepend(block);
                fixNavLayout();

                checkNavUpdateButton();
            }

            function fixNavLayout() {
                const nav = document.querySelector('.MtNy');
                if (!nav) return;
                const block = nav.querySelector('.my-nav-block');
                const tabs = nav.querySelector('.TqjP');
                if (block && tabs) {
                    tabs.style.flex = '1 1 auto';
                    tabs.style.minWidth = '0';
                    tabs.style.width = 'auto';
                    block.style.flex = '0 0 auto';
                    nav.style.display = 'flex';
                    nav.style.width = '100%';
                }
            }

            function updateNavIcon() {
                const nav = document.querySelector('.MtNy');
                if (!nav) return;
                const isMobile = window.innerWidth <= 1172;
                const block = nav.querySelector('.my-nav-block');
                const tabs = nav.querySelector('.TqjP');

                if (isMobile) {
                    if (!block) {
                        createNavIcon();
                    } else {
                        fixNavLayout();
                    }
                } else {
                    if (block) block.remove();
                    if (tabs) {
                        tabs.style.flex = '';
                        tabs.style.minWidth = '';
                        tabs.style.width = '';
                    }
                    nav.style.width = '';
                    nav.style.display = '';
                }
            }

            setTimeout(updateNavIcon, 500);

            const navObserver = new MutationObserver(() => {
                const nav = document.querySelector('.MtNy');
                if (nav) {
                    updateNavIcon();
                }
            });
            navObserver.observe(document.body, { childList: true, subtree: true });
            scheduleAutoLike();
        } catch (e) { }
    }

    let interval = setInterval(() => { updateColors(); drawBackground(); }, 50);

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    initVisuals();
    initBanner();

    window.addEventListener('beforeunload', () => {
        if (verificationInterval) clearInterval(verificationInterval);
    });

    function updateBackgroundVisibility() {
        canvas.style.display = backgroundEnabled ? 'block' : 'none';
    }

    function updateNickGlowVisibility() {
        const isRainbow = currentStyle === 'rainbow';
        const glowColor = isRainbow ? `drop-shadow(0 0 6px hsl(${globalHue}, 100%, 55%)) drop-shadow(0 0 12px hsl(${globalHue}, 100%, 55%))` : (nickStyles[currentStyle].glow || '');
        const nickElementsArray = Array.from(nickElements);
        const nickElementsLength = nickElementsArray.length;
        if (nickElementsLength === 0) return;

        for (let i = 0; i < nickElementsLength; i++) {
            const nickSpan = nickElementsArray[i];
            if (nickSpan && nickSpan.isConnected) {
                const parentBlock = nickSpan.closest('.' + SELECTORS.nickContainer);
                if (parentBlock) {
                    parentBlock.style.filter = nickGlowEnabled ? glowColor : 'none';
                }
            }
        }
    }

    function updateAvatarGlowVisibility() {
        const isRainbow = currentStyle === 'rainbow';
        const rainbowFilter = `drop-shadow(0 0 5px hsl(${globalHue}, 100%, 55%)) drop-shadow(0 0 12px hsl(${globalHue}, 100%, 55%))`;
        const style = nickStyles[currentStyle];
        const hue = style.avatarHue || 210;
        const sat = style.avatarSat !== undefined ? style.avatarSat : 100;
        const standardFilter = `drop-shadow(0 0 5px hsl(${hue}, ${sat}%, 60%)) drop-shadow(0 0 12px hsl(${hue}, ${sat}%, 60%))`;
        const filterValue = avatarGlowEnabled ? (isRainbow ? rainbowFilter : standardFilter) : 'none';

        const avatars = document.querySelectorAll('.my-avatar-glow');
        const avatarsLength = avatars.length;
        if (avatarsLength === 0) return;

        for (let i = 0; i < avatarsLength; i++) {
            avatars[i].style.filter = filterValue;
        }
    }

    updateBackgroundVisibility();
    updateNickGlowVisibility();
    updateAvatarGlowVisibility();

    (function () {
        'use strict';

        const STORAGE_KEY = 'user_sticker_packs_v1';
        const RECENT_STORAGE_KEY = 'recent_stickers_v1';

        function loadUserPacks() {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
            catch (e) { return []; }
        }
        function saveUserPacks(packs) {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(packs)); } catch (e) { }
        }
        function loadRecentStickers() {
            try { return JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY)) || []; }
            catch (e) { return []; }
        }
        function saveRecentStickers(recent) {
            try { localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recent)); } catch (e) { }
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

            let postId = currentPostId;

            if (!postId) {
                postId = window.location.pathname.split('/post/')[1];
                if (!postId) {
                    const match = window.location.pathname.match(/\/post\/([^\/?#]+)/);
                    if (match) postId = match[1];
                }
            }

            if (!postId) throw new Error('Post ID not found');

            if (stickerBtn) {
                stickerBtn.innerHTML = ICONS.LOADING;
                stickerBtn.style.opacity = '0.6';
                stickerBtn.style.pointerEvents = 'none';
            }

            const previewContainer = document.querySelector('.' + SELECTORS.commentPreviewContainer);
            const sendBtn = document.querySelector('.' + SELECTORS.stickerSendBtn);
            const micBtn = document.querySelector('.' + SELECTORS.stickerMicBtn);

            if (!previewContainer || !sendBtn) {
                if (stickerBtn) {
                    stickerBtn.innerHTML = ICONS.STICKER_BUTTON;
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
                    stickerBtn.innerHTML = ICONS.STICKER_BUTTON;
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
                sendBtn.innerHTML = ICONS.LOADING;

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
                } catch (e) {
                    alert('Ошибка: ' + e.message);
                    sendBtn.disabled = false;
                    sendBtn.innerHTML = '';
                }
            };

            previewContainer.insertBefore(previewDiv, previewContainer.firstChild);
        }


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
                    addBtn.innerHTML = ICONS.LOADING;
                    addBtn.style.pointerEvents = 'none';
                }

                try {
                    const imageUrl = URL.createObjectURL(file);
                    const croppedImage = await showCropEditor(imageUrl);
                    if (!croppedImage) {
                        if (addBtn) {
                            addBtn.innerHTML = ICONS.ADD;
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
                } catch (err) {
                    alert('Ошибка загрузки: ' + err.message);
                    if (addBtn) {
                        addBtn.innerHTML = ICONS.ADD;
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
                    { label: '4:3', value: 4 / 3 },
                    { label: '3:4', value: 3 / 4 },
                    { label: '16:9', value: 16 / 9 },
                    { label: '9:16', value: 9 / 16 }
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
                addBtn.innerHTML = ICONS.ADD;
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
                deleteBtn.innerHTML = ICONS.DELETE;
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
                        btn.innerHTML = ICONS.EMPTY_PACK;
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
            recentBtn.innerHTML = ICONS.RECENT;
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
                    btn.innerHTML = ICONS.EMPTY_PACK;
                    btn.style.color = 'rgba(128,128,128,0.5)';
                }
                btn.title = pack.name || DEFAULT_PACK_NAME;
                btn.style.cssText = 'background:transparent;border:none;width:32px;height:32px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;color:var(--text-secondary,rgba(255,255,255,0.5));';
                btn.onclick = () => { exitEditMode(); scrollToPack(pack.id); };
                tabsWrapper.appendChild(btn);
                tabButtons.push({ button: btn, key: pack.id });
            });

            const addPackBtn = document.createElement('button');
            addPackBtn.innerHTML = ICONS.ADD_PACK;
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
            const allKeysLength = allKeys.length;
            for (let i = 0; i < allKeysLength; i++) {
                const key = allKeys[i];
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
                    editBtn.innerHTML = ICONS.EDIT;
                    editBtn.title = 'Редактировать';
                    editBtn.style.cssText = 'background:transparent;border:none;width:20px;height:20px;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;color:inherit;';
                    editBtn.onclick = () => {
                        if (editMode && currentEditPack === key) exitEditMode();
                        else { exitEditMode(); enterEditMode(key); }
                    };
                    nameContainer.appendChild(editBtn);

                    const deletePackBtn = document.createElement('button');
                    deletePackBtn.className = 'delete-pack-btn';
                    deletePackBtn.innerHTML = ICONS.TRASH;
                    deletePackBtn.title = 'Удалить пак';
                    deletePackBtn.style.cssText = 'display:none;background:#ff4444;border:none;width:24px;height:24px;border-radius:6px;cursor:pointer;padding:0;align-items:center;justify-content:center;';
                    deletePackBtn.onclick = () => { if (confirm('Удалить пак?')) deleteStickerPack(key); };
                    nameContainer.appendChild(deletePackBtn);

                    const exitBtn = document.createElement('button');
                    exitBtn.innerHTML = ICONS.CHECK;
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
                const stickersLength = stickers.length;
                for (let j = 0; j < stickersLength; j++) {
                    const s = stickers[j];
                    grid.appendChild(createStickerButton(s, key, j, false));
                }
                scrollContainer.appendChild(grid);
            }
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
            if (editMode || !scrollContainer) return;
            const top = scrollContainer.getBoundingClientRect().top + 50;
            let active = 'recent', min = Infinity;
            const packHeadersLength = packHeaders.length;
            for (let i = 0; i < packHeadersLength; i++) {
                const { element, key } = packHeaders[i];
                const d = element.getBoundingClientRect().top - top;
                if (d <= 0 && Math.abs(d) < min) { min = Math.abs(d); active = key; }
            }
            if (recentBtn) recentBtn.style.background = active === 'recent' ? 'var(--accent-primary,#0080FF)' : 'transparent';
            const tabButtonsLength = tabButtons.length;
            for (let i = 0; i < tabButtonsLength; i++) {
                const t = tabButtons[i];
                t.button.style.background = t.key === active ? 'var(--accent-primary,#0080FF)' : 'transparent';
            }
        }

        function showPanel() {
            if (!stickerBtn || !stickerBtn.isConnected) return;
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
            stickerBtn.innerHTML = ICONS.STICKER_BUTTON;
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
        iconSpan.innerHTML = ICONS.MESSAGES;
        const textSpan = document.createElement('span');
        textSpan.textContent = 'Сообщения';
        messagesLink.appendChild(iconSpan);
        messagesLink.appendChild(textSpan);

        nav.insertBefore(messagesLink, notificationsLink);
    }

    addMessagesButton();
    new MutationObserver(() => addMessagesButton()).observe(document.body, { childList: true, subtree: true });

    const postDesignStyle = document.createElement('style');
    postDesignStyle.textContent = `
        .NYk2, article {
            background: var(--block-bg, rgba(30, 30, 46, 0.8)) !important;
            backdrop-filter: blur(4px) !important;
            border-radius: 24px !important;
            margin-bottom: 16px !important;
            transition: all 0.25s ease !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2) !important;
            animation: postAppear 0.3s ease-out forwards !important;
        }
        @keyframes postAppear {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .FTmF, .e2Ri > div:not(.KdXP) {
            font-size: 15px !important;
            line-height: 1.5 !important;
            color: var(--text-primary, #e0e0e0) !important;
            background: rgba(0, 0, 0, 0.5) !important;
            padding: 8px 12px !important;
            border-radius: 16px !important;
            margin: 8px 0 !important;
        }
        .RYKM {
            transition: all 0.2s ease !important;
            border-radius: 40px !important;
            padding: 6px 10px !important;
        }
        .RYKM:hover {
            background: rgba(0, 128, 255, 0.15) !important;
            transform: translateY(-2px) !important;
        }
        .rROE:hover {
            transform: scale(1.05) !important;
        }
        .onjE {
            background: rgba(0, 0, 0, 0.5) !important;
            border-left: none !important;
            border-radius: 40px !important;
            padding: 4px 12px !important;
            font-size: 12px !important;
        }
        a[href*="/hashtag/"], a[href*="/tag/"], a:not([href^="/@"]):not([href*="/@"]):not([href^="#"]) {
            font-weight: 600 !important;
            text-decoration: none !important;
            transition: all 0.15s ease !important;
        }
        a[href*="/hashtag/"]:hover, a[href*="/tag/"]:hover, a:not([href^="/@"]):not([href*="/@"]):not([href^="#"]):hover {
            filter: brightness(1.25) !important;
        }
        a[href^="/@"], a[href*="/@"] { text-decoration: none !important; }
        a[href^="/@"] .Emmg, a[href*="/@"] .Emmg { font-weight: 600 !important; }
        a[href^="/@"]:hover .Emmg, a[href*="/@"]:hover .Emmg { filter: brightness(0.85) !important; }
        a[href^="/@"] svg, a[href*="/@"] svg, a[href^="/@"] img, a[href*="/@"] img,
        a[href^="/@"] .mod-badge-voronoi, a[href*="/@"] .mod-badge-voronoi,
        a[href^="/@"] .aUUF, a[href*="/@"] .aUUF {
            filter: none !important;
            transform: none !important;
        }
        @keyframes likePop {
            0% { transform: scale(1); }
            50% { transform: scale(1.3); color: #ff3366 !important; }
            100% { transform: scale(1); }
        }
        .RYKM:active svg {
            animation: likePop 0.2s ease-out !important;
        }
        .RYKM[aria-label="Нравится"]:hover {
            background: rgba(249, 24, 128, 0.2) !important;
            color: #f91880 !important;
        }
        .RYKM[aria-label="Комментировать"]:hover {
            background: rgba(0, 186, 124, 0.2) !important;
            color: #00ba7c !important;
        }
        .RYKM[aria-label="Репост"]:hover {
            background: rgba(0, 128, 255, 0.2) !important;
            color: #0080FF !important;
        }
        .bs4a {
            animation: notificationAppear 0.3s ease-out forwards !important;
            opacity: 0;
        }
        @keyframes notificationAppear {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(postDesignStyle);

    let postBorderEnabled = GM_getValue('postBorderEnabled', true);
    let postBorderSyncStyle = null;

    function initPostBorderSync() {
        if (!postBorderEnabled) return;
        let borderColor;
        if (currentStyle === 'rainbow') {
            borderColor = `hsla(${globalHue}, 100%, 55%, 0.3)`;
        } else {
            const style = nickStyles[currentStyle];
            if (style.color && style.color !== 'rainbow') {
                borderColor = style.color;
            } else {
                const hue = style.avatarHue || 210;
                const sat = style.avatarSat !== undefined ? style.avatarSat : 100;
                borderColor = `hsl(${hue}, ${sat}%, 60%)`;
            }
            if (borderColor && borderColor.startsWith('#')) {
                const r = parseInt(borderColor.slice(1, 3), 16);
                const g = parseInt(borderColor.slice(3, 5), 16);
                const b = parseInt(borderColor.slice(5, 7), 16);
                borderColor = `rgba(${r}, ${g}, ${b}, 0.6)`;
            } else if (borderColor && borderColor.startsWith('rgb')) {
                borderColor = borderColor.replace('rgb', 'rgba').replace(')', ', 0.3)');
            } else if (borderColor && borderColor.startsWith('hsl')) {
                borderColor = borderColor.replace('hsl', 'hsla').replace(')', ', 0.3)');
            }
        }
        if (postBorderSyncStyle) postBorderSyncStyle.remove();
        postBorderSyncStyle = document.createElement('style');
        postBorderSyncStyle.textContent = `
            .NYk2:hover, article:hover {
                border-color: ${borderColor} !important;
                box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3), 0 0 0 2px ${borderColor} !important;
            }
        `;
        document.head.appendChild(postBorderSyncStyle);
    }

    const originalUpdateColors = updateColors;
    updateColors = function () {
        originalUpdateColors();
        if (currentStyle === 'rainbow') initPostBorderSync();
    };
    let _currentStyle = currentStyle;
    Object.defineProperty(window, 'currentStyle', {
        get: () => _currentStyle,
        set: (val) => {
            _currentStyle = val;
            initPostBorderSync();
        }
    });
    currentStyle = _currentStyle;

    initPostBorderSync();

    const styleSidebar = document.createElement('style');
    styleSidebar.textContent = `
        .lVAS, .oJit {
            animation: fadeSlide 0.4s ease-out;
        }
        @keyframes fadeSlide {
            0% { opacity: 0; transform: translateX(-10px); }
            100% { opacity: 1; transform: translateX(0); }
        }
        .oJit {
            animation-name: fadeSlideRight;
        }
        @keyframes fadeSlideRight {
            0% { opacity: 0; transform: translateX(10px); }
            100% { opacity: 1; transform: translateX(0); }
        }
    `;
    document.head.appendChild(styleSidebar);

    const styleUnderline = document.createElement('style');
    styleUnderline.textContent = `
        .ZkAR .Emmg {
            transition: all 0.2s ease;
        }
        a[href*="/@"]:hover .Emmg {
            text-decoration: underline;
            text-decoration-thickness: 2px;
            text-underline-offset: 4px;
            text-decoration-color: var(--accent-primary, #0080FF);
        }
    `;
    document.head.appendChild(styleUnderline);

    let modalOverlay = null;
    let updateTimeout = null;

    function isModalVisible() {
        const modals = document.querySelectorAll('.GYYZ, .Fy9C, [class*="modal"]');
        for (const modal of modals) {
            const style = getComputedStyle(modal);
            if (style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                style.opacity !== '0') {
                const rect = modal.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    return modal;
                }
            }
        }
        return null;
    }

    function updateModalOverlay() {
        if (updateTimeout) {
            cancelAnimationFrame(updateTimeout);
            updateTimeout = null;
        }
        updateTimeout = requestAnimationFrame(() => {
            const modal = isModalVisible();
            if (modal) {
                if (!modalOverlay) {
                    modalOverlay = document.createElement('div');
                    modalOverlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(2px);
                    z-index: 999;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                `;
                    document.body.appendChild(modalOverlay);
                }
            } else {
                if (modalOverlay) {
                    modalOverlay.remove();
                    modalOverlay = null;
                }
            }
            updateTimeout = null;
        });
    }

    const modalObserver = new MutationObserver(() => {
        updateModalOverlay();
    });
    modalObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });

    window.addEventListener('popstate', () => {
        updateModalOverlay();
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) updateModalOverlay();
    });

    const styleIcons = document.createElement('style');
    styleIcons.textContent = `
        .xjQA .TsX6 svg,
        .xjQA.VyJc .TsX6 svg,
        a.xjQA .TsX6 svg {
            transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1) !important;
        }
        .xjQA:hover .TsX6 svg,
        .xjQA.VyJc:hover .TsX6 svg {
            transform: translateY(-2px) scale(1.05) !important;
        }
    `;
    document.head.appendChild(styleIcons);

    function addBlurBackground() {
        document.querySelectorAll('.NYk2, article, .KdXP').forEach(article => {
            if (article.hasAttribute('data-blur-bg')) return;

            const img = article.querySelector('.UTvc img, .z3wG, .r94T img');
            if (!img || !img.src || img.src.includes('avatar')) return;

            article.setAttribute('data-blur-bg', 'true');

            if (getComputedStyle(article).position === 'static') {
                article.style.position = 'relative';
            }

            article.classList.add('itd-blur-active');

            let bgContainer = article.querySelector('.itd-blur-container');
            if (!bgContainer) {
                bgContainer = document.createElement('div');
                bgContainer.className = 'itd-blur-container';
                bgContainer.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border-radius: inherit;
                    overflow: hidden;
                    z-index: -1;
                    pointer-events: none;
                `;
                article.insertBefore(bgContainer, article.firstChild);
            } else {
                bgContainer.innerHTML = '';
            }

            const blurLayer = document.createElement('div');
            blurLayer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image: url(${img.src});
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                filter: blur(20px) brightness(1.2) saturate(1.3);
                transform: scale(1.1);
            `;

            const styleKdXP = document.createElement('style');
            styleKdXP.textContent = `
                    .itd-blur-active .KdXP {
                        background: rgba(0, 0, 0, 0.3) !important;
                    }
                `;
            document.head.appendChild(styleKdXP);

            const darkOverlay = document.createElement('div');
            darkOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.45);
            `;

            bgContainer.appendChild(blurLayer);
            bgContainer.appendChild(darkOverlay);
        });
    }

    const styleBlurPosts = document.createElement('style');
    styleBlurPosts.textContent = `
        .NYk2.itd-blur-active, article.itd-blur-active, .KdXP.itd-blur-active {
            background: transparent !important;
            backdrop-filter: none !important;
        }
        .NYk2 .blur-bg-layer, .NYk2 .blur-overlay,
        article .blur-bg-layer, article .blur-overlay,
        .KdXP .blur-bg-layer, .KdXP .blur-overlay {
            display: none !important;
        }
    `;
    document.head.appendChild(styleBlurPosts);

    let postBlurEnabled = GM_getValue('postBlurEnabled', true);

    if (postBlurEnabled) {
        setTimeout(addBlurBackground, 500);
        addBlurBackground();
        window._blurObserver = new MutationObserver(() => addBlurBackground());
        window._blurObserver.observe(document.body, { childList: true, subtree: true });
    }

    function overrideFilePicker() {
        document.querySelectorAll('input[type="file"]').forEach(input => {
            if (input.hasAttribute('data-overridden')) return;

            const accept = (input.accept || '').toLowerCase();
            const isImageInput = accept.includes('.jpg') ||
                accept.includes('.png') ||
                accept.includes('.gif') ||
                accept.includes('.webp') ||
                accept.includes('image/');

            if (!isImageInput) return;

            input.setAttribute('data-overridden', 'true');

            const originalClick = input.click;
            input.click = function () {
                const tempInput = document.createElement('input');
                tempInput.type = 'file';
                tempInput.accept = input.accept;
                tempInput.multiple = input.multiple;
                tempInput.style.display = 'none';
                document.body.appendChild(tempInput);

                let handled = false;

                tempInput.addEventListener('change', function (e) {
                    if (handled) return;
                    if (!this.files || !this.files.length) {
                        document.body.removeChild(tempInput);
                        return;
                    }

                    const dt = new DataTransfer();
                    for (const file of this.files) {
                        if (file.type !== 'image/gif' && file.type.startsWith('image/')) {
                            const newFileName = file.name.replace(/\.[^.]+$/, '') + '.gif';
                            const newFile = new File([file], newFileName, { type: 'image/gif' });
                            dt.items.add(newFile);
                        } else {
                            dt.items.add(file);
                        }
                    }
                    input.files = dt.files;
                    const changeEvent = new Event('change', { bubbles: true });
                    input.dispatchEvent(changeEvent);
                    document.body.removeChild(tempInput);
                    handled = true;
                });

                tempInput.click();
            };
        });
    }

    /* function overridePasteHandler() {
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function (type, listener, options) {
            if (type === 'paste') {
                const wrappedListener = function (e) {
                    const items = e.clipboardData?.items;
                    if (!items) return;

                    let hasImage = false;
                    const imageFiles = [];

                    for (const item of items) {
                        if (item.type.startsWith('image/')) {
                            hasImage = true;
                            const file = item.getAsFile();
                            if (file) {
                                imageFiles.push(file);
                            }
                        }
                    }

                    if (!hasImage || !imageFiles.length) {
                        return listener.call(this, e);
                    }

                    e.preventDefault();
                    e.stopPropagation();

                    const dt = new DataTransfer();
                    for (const file of imageFiles) {
                        let finalFile = file;
                        if (file.type !== 'image/gif') {
                            const newFileName = (file.name || 'pasted_image').replace(/\.[^.]+$/, '') + '.gif';
                            finalFile = new File([file], newFileName, { type: 'image/gif' });
                        }
                        dt.items.add(finalFile);
                    }

                    const pasteEvent = new ClipboardEvent('paste', {
                        clipboardData: dt,
                        bubbles: true,
                        cancelable: true
                    });

                    this.dispatchEvent(pasteEvent);
                };
                return originalAddEventListener.call(this, type, wrappedListener, options);
            }
            return originalAddEventListener.call(this, type, listener, options);
        };
    } */

    function overrideDragAndDrop() {
        document.addEventListener('drop', function (e) {
            const files = e.dataTransfer?.files;
            if (!files || !files.length) return;

            const dt = new DataTransfer();
            let modified = false;
            for (const file of files) {
                if (file.type !== 'image/gif' && file.type.startsWith('image/')) {
                    const newFileName = file.name.replace(/\.[^.]+$/, '') + '.gif';
                    const newFile = new File([file], newFileName, { type: 'image/gif' });
                    dt.items.add(newFile);
                    modified = true;
                } else {
                    dt.items.add(file);
                }
            }

            if (modified) {
                e.preventDefault();
                e.stopPropagation();

                const target = e.target.closest('[contenteditable="true"], input, textarea');
                if (target) {
                    const dropEvent = new DragEvent('drop', {
                        dataTransfer: dt,
                        bubbles: true,
                        cancelable: true
                    });
                    target.dispatchEvent(dropEvent);
                }
            }
        }, true);

        document.addEventListener('dragover', function (e) {
            e.preventDefault();
        }, true);
    }

    function overrideFetchAndXHR() {
        const originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function (body) {
            if (body instanceof FormData) {
                const newFormData = new FormData();
                for (const [key, value] of body.entries()) {
                    if (value instanceof File && value.type !== 'image/gif' && value.type.startsWith('image/')) {
                        const newFileName = value.name.replace(/\.[^.]+$/, '') + '.gif';
                        const newFile = new File([value], newFileName, { type: 'image/gif' });
                        newFormData.append(key, newFile);
                    } else {
                        newFormData.append(key, value);
                    }
                }
                return originalSend.call(this, newFormData);
            }
            return originalSend.call(this, body);
        };

        const originalFetch = window.fetch;
        window.fetch = function (input, init) {
            if (init?.body instanceof FormData) {
                const newFormData = new FormData();
                for (const [key, value] of init.body.entries()) {
                    if (value instanceof File && value.type !== 'image/gif' && value.type.startsWith('image/')) {
                        const newFileName = value.name.replace(/\.[^.]+$/, '') + '.gif';
                        const newFile = new File([value], newFileName, { type: 'image/gif' });
                        newFormData.append(key, newFile);
                    } else {
                        newFormData.append(key, value);
                    }
                }
                init.body = newFormData;
            }
            return originalFetch.call(this, input, init);
        };
    }

    function overrideFileReader() {
        const originalReadAsDataURL = FileReader.prototype.readAsDataURL;
        FileReader.prototype.readAsDataURL = function (blob) {
            if (blob instanceof File && blob.type !== 'image/gif' && blob.type.startsWith('image/')) {
                const newFileName = blob.name.replace(/\.[^.]+$/, '') + '.gif';
                const newFile = new File([blob], newFileName, { type: 'image/gif' });
                return originalReadAsDataURL.call(this, newFile);
            }
            return originalReadAsDataURL.call(this, blob);
        };
    }

    if (antiCensorshipEnabled) {
        setTimeout(overrideFilePicker, 500);
        /* setTimeout(overridePasteHandler, 500); */
        setTimeout(overrideDragAndDrop, 500);
        setTimeout(overrideFetchAndXHR, 500);

        window._fileObserver = new MutationObserver(() => {
            overrideFilePicker();
        });
        window._fileObserver.observe(document.body, { childList: true, subtree: true });
    }

    (function () {
        function applyFixes() {
            const isMobile = window.innerWidth <= 1172;
            const container = document.querySelector('.yYHA');
            const createBtn = document.querySelector('.JHRx');
            const scrollBtn = document.querySelector('.itd-scroll-top-btn');
            const uDYwElements = document.querySelectorAll('.uDYw');
            const eqPa = document.querySelector('.eqPa');
            const nickContainer = document.querySelector('.ZkAR.Y5jP.Hnfk');

            if (!scrollBtn) return;

            if (isMobile) {
                uDYwElements.forEach(el => {
                    el.style.setProperty('border-bottom', 'none', 'important');
                });

                if (!document.querySelector('#itd-mobile-fixes')) {
                    const style = document.createElement('style');
                    style.id = 'itd-mobile-fixes';
                    style.textContent = `
                        html, body { overscroll-behavior: none !important; }
                        ::-webkit-scrollbar { display: none !important; }
                    `;
                    document.head.appendChild(style);
                }

                scrollBtn.style.zIndex = '1';
                scrollBtn.style.bottom = '100px';
                scrollBtn.style.right = '16px';

                if (container) {
                    container.style.paddingTop = '0';
                }

                if (createBtn) {
                    createBtn.style.position = 'absolute';
                    createBtn.style.bottom = 'calc(100% - 1px)';
                    createBtn.style.left = '50%';
                    createBtn.style.transform = 'translateX(-50%)';
                    createBtn.style.width = '120px';
                    createBtn.style.height = '36px';
                    createBtn.style.borderRadius = '24px 24px 0 0';
                }

                if (eqPa) {
                    eqPa.style.bottom = 'auto';
                    eqPa.style.top = '16px';
                }

                if (nickContainer) {
                    let wrapper = nickContainer.querySelector('.nick-wrapper');

                    if (!wrapper) {
                        wrapper = document.createElement('span');
                        wrapper.className = 'nick-wrapper';
                        wrapper.style.cssText = `
                            display: flex !important;
                            align-items: center !important;
                            flex-wrap: wrap !important;
                            gap: 4px !important;
                        `;

                        const controls = nickContainer.querySelector('.nick-controls-panel');
                        const children = [];

                        for (const child of nickContainer.children) {
                            if (child === controls) continue;
                            children.push(child);
                        }

                        nickContainer.insertBefore(wrapper, nickContainer.firstChild);

                        for (const child of children) {
                            wrapper.appendChild(child);
                        }
                    }

                    nickContainer.style.display = 'flex';
                    nickContainer.style.flexDirection = 'column';
                    nickContainer.style.alignItems = 'center';
                    nickContainer.style.gap = '4px';
                    nickContainer.style.width = '';

                    const controls = nickContainer.querySelector('.nick-controls-panel');
                    if (controls) {
                        controls.style.display = 'flex';
                        controls.style.flexWrap = 'wrap';
                        controls.style.gap = '4px';
                        controls.style.marginTop = '0';
                        controls.style.marginLeft = '0';
                        controls.style.marginRight = '0';
                        controls.style.justifyContent = 'center';
                        controls.style.width = '';
                    }
                }

            } else {
                uDYwElements.forEach(el => {
                    el.style.removeProperty('border-bottom');
                });

                scrollBtn.style.zIndex = '';
                scrollBtn.style.bottom = '16px';
                scrollBtn.style.right = '16px';

                if (container) {
                    container.style.paddingTop = '';
                }

                if (createBtn) {
                    createBtn.style.position = '';
                    createBtn.style.bottom = '';
                    createBtn.style.left = '';
                    createBtn.style.transform = '';
                    createBtn.style.width = '';
                    createBtn.style.height = '';
                    createBtn.style.borderRadius = '';
                }

                if (eqPa) {
                    eqPa.style.bottom = '';
                    eqPa.style.top = '';
                }

                if (nickContainer) {
                    const wrapper = nickContainer.querySelector('.nick-wrapper');
                    if (wrapper) {
                        const children = [...wrapper.children];
                        for (const child of children) {
                            nickContainer.insertBefore(child, wrapper);
                        }
                        wrapper.remove();
                    }

                    nickContainer.style.display = '';
                    nickContainer.style.flexDirection = '';
                    nickContainer.style.alignItems = '';
                    nickContainer.style.gap = '';
                    nickContainer.style.width = '';
                }

                const controls = document.querySelector('.nick-controls-panel');
                if (controls) {
                    controls.style.display = '';
                    controls.style.flexWrap = '';
                    controls.style.gap = '';
                    controls.style.marginTop = '';
                    controls.style.marginLeft = '';
                    controls.style.marginRight = '';
                    controls.style.justifyContent = '';
                    controls.style.width = '';
                }

                const fixStyle = document.querySelector('#itd-mobile-fixes');
                if (fixStyle) fixStyle.remove();
            }
        }

        applyFixes();

        const observer = new MutationObserver(() => {
            if (!window._fixing) {
                window._fixing = true;
                applyFixes();
                setTimeout(() => { window._fixing = false; }, 100);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                window._fixing = true;
                applyFixes();
                setTimeout(() => { window._fixing = false; }, 100);
            }, 200);
        });
    })();

    let currentPostId = null;

    (function () {
        const originalFetch = window.fetch;
        window.fetch = function (...args) {
            const url = args[0];
            if (typeof url === 'string' && url.includes('/api/posts/') && url.includes('/comments')) {
                const match = url.match(/\/api\/posts\/([^\/]+)\/comments/);
                if (match) {
                    currentPostId = match[1];
                    console.log('📌 Post ID сохранён:', currentPostId);
                }
            }
            return originalFetch.apply(this, args);
        };
    })();

    function replaceNotificationTexts() {
        const messages = [
            'Нет, иди нахуй',
            'Пошёл нахуй',
            'Иди нахуй',
            'Нахуй иди',
            'А не пошёл бы ты нахуй',
            'Вали нахуй',
            'Отвали',
            'Хуй тебе',
            'Ты заебал, отвали',
            'Соси хуй'
        ];

        document.querySelectorAll('.iytG:not([data-replaced])').forEach(el => {
            if (el.textContent && el.textContent.trim()) {
                el.textContent = messages[Math.floor(Math.random() * messages.length)];
                el.setAttribute('data-replaced', 'true');
            }
        });
    }

    if (window._notificationInterval) {
        clearInterval(window._notificationInterval);
    }

    if (window._notificationObserver) {
        window._notificationObserver.disconnect();
    }

    window._notificationObserver = new MutationObserver(() => {
        replaceNotificationTexts();
    });

    window._notificationObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    window._notificationInterval = setInterval(replaceNotificationTexts, 1000);

    setTimeout(replaceNotificationTexts, 100);

    console.log('🟢 ITD Visual Pack');
})();
