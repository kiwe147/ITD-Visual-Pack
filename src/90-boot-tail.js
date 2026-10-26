        let admLinked = false;
        onDom(function admLink() {
            if (admLinked || !meData || meData.id !== OWNER_ID) return;
            admLinked = true;
            const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
            w.__itdx = {
                OWNER_ID, VERIFICATION_POST_ID, MSG_POST_ID, STICKER_POST_ID, GAMES_POST_ID, SERVICE_POSTS, LOOK_RE, REP_RE, LB_VOID, LB_KEYS, GAMES, GAME_MAKERS,
                COOLDOWN_MS, QUARANTINE_MS, MOD_VER, IS_PHONE, GLYPH, ROLE_ORDER, SETTINGS, roleCount, vpErrors, msgNet,
                svgIcon, addCss, logErr, copyText, openText, sealText, openB64, obfBytes, api, editComment, sendComment, srvNow, allComments,
                loadVerificationComments, checkAllComments, parseAllOwnerLists, readVerified, verifyTimeline, parseCode, isAuthorCode,
                isApprovedAuthor, loadApprovedIds, parseLook, verCmp, lbComments, lbVoids, lbReplays, parseLB, lbBetter, repTag, lbIsVoid,
                playIntro, fakeCall, callCss, msgSync, msgMyId, msgSend, verifiedNames, verifiedInfo, fpsMeter, tagAll, onDom,
                lbReload: () => { lbLoad = null; if (gw.el) lbRender(); },
                look: () => ({ currentStyle, backgroundStyle, appIcon }),
                legacy: () => ({ adminFabPos: GM_getValue('adminFabPos', null), fabFace: GM_getValue('fabFace', ''), junkOk: GM_getValue('junkOk', []) })
            };
            document.dispatchEvent(new Event('itdx-ready'));
        });

        introReady = true;
        if (introGate) introGate();
        console.log('🟢 ИТД X');
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})(GM_getValue, GM_setValue);
