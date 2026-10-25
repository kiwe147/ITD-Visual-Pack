// ==UserScript==
// @name         ITD Visual Pack
// @name:ru      ИТД X
// @name:en      ITD X
// @namespace    http://tampermonkey.net/
// @version      3.7.1
// @author       NeuroSFW
// @description  Подсветка ника + подсветка аватарок + фон + загрузка баннера + стикеры в комментариях + бейдж
// @match        https://xn--d1ah4a.com/*
// @match        https://итд.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @connect      raw.githubusercontent.com
// @connect      cdn.xn--d1ah4a.com
// @run-at       document-start
// @noframes
// @downloadURL  https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/main/ITD-Visual-Pack.user.js
// @updateURL    https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/main/ITD-Visual-Pack.user.js
// @icon         data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='n' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%2300e5ff'/><stop offset='.5' stop-color='%237c4dff'/><stop offset='1' stop-color='%23ff3d9a'/></linearGradient><linearGradient id='d' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%230a3d62'/><stop offset='.5' stop-color='%233b1a7a'/><stop offset='1' stop-color='%237a1450'/></linearGradient><linearGradient id='m' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%231565c0'/><stop offset='.5' stop-color='%235e35b1'/><stop offset='1' stop-color='%23ad1457'/></linearGradient><filter id='b' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='2.2'/></filter><filter id='s' x='-20%' y='-20%' width='140%' height='140%'><feDropShadow dx='0' dy='1.5' stdDeviation='1.5' flood-opacity='.5'/></filter></defs><rect width='64' height='64' rx='16' fill='%230b0d13'/><g fill='none'><path d='M17 17L47 47M47 17L17 47' stroke='url(%23n)' stroke-opacity='1' stroke-width='12' stroke-linecap='round'/><path d='M17 17L47 47M47 17L17 47' stroke='%230b0d13' stroke-opacity='1' stroke-width='7' stroke-linecap='round'/></g><text x='32' y='40' font-family='Arial Black, Arial, sans-serif' font-weight='900' text-anchor='middle' font-size='21' fill='%23fff' filter='url(%23s)'>ИТД</text></svg>
// ==/UserScript==

(function () {
    'use strict';
    if (window.top !== window.self) return;
    const PHONE_MAX = 1173;
    const VERIFICATION_POST_ID = 'a0d6625a-b3ec-44c4-98da-48422af101d5';
    const STICKER_POST_ID = '92f2913c-18be-499a-bc03-97aed0947b34';
    const MSG_POST_ID = 'a53b53e0-9950-4f62-83f4-91e5985ef6c5';
    const GAMES_POST_ID = 'd5f8b7c0-b97d-40cd-bdd4-3c07b3ea0611';
    const OWNER_ID = '5e064703-104d-4794-bc28-9ed6f5847cca';
    const OWNER_PUB = 'BLrLT8O1H3uwudBCiyDf7xEWqFo-5AQCAInPIe_rP3Jn-Ws1gjwZJ5RvN0nNWNMY9cfHt2w32qVTBc3HwtwJ-tc';
    const TG_URL = 'https://t.me/NeuroSFW';
    const TG_CHAT_URL = 'https://t.me/+P7NeR_AEc35lYjEy';
    const AUTO_LIKE_KEY = 'itd_auto_like_ids';
    const isUrl = a => /^https?:|^\//.test(a);
    const addCss = css => {
        const st = document.createElement('style');
        st.textContent = css;
        document.head.appendChild(st);
        return st;
    };
    const GLYPH = {
        close: '<path d="M18 6 6 18M6 6l12 12"/>',
        check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
        phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
        camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/>'
    };
