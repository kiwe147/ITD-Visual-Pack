        (function eventHunt() {
            const HUNT_KEY = 'vpHuntMode';
            const MODE_LIST = [['ghosts', 'Призраки'], ['wolves', 'Оборотни'], ['both', 'Оба']];
            const huntMode = () => { const v = GM_getValue(HUNT_KEY, 'both'); return MODE_LIST.some(m => m[0] === v) ? v : 'both'; };
            const huntOn = () => GM_getValue('huntOn', true);

            const HUNT_CSS = `
.vp-hunt-dev{position:absolute;left:8%;bottom:9%;width:15%;max-width:230px;min-width:110px;aspect-ratio:1/1;cursor:pointer;z-index:6;pointer-events:auto;
  display:flex;align-items:flex-end;justify-content:center;transition:transform .2s ease,filter .25s ease;}
.vp-hunt-dev:hover{transform:translateY(-4px) scale(1.03);filter:brightness(1.15) drop-shadow(0 0 14px rgba(160,120,255,.55));}
.vp-hunt-dev:active{transform:translateY(-1px) scale(.98);}
.vp-hunt-dev img{width:100%;height:auto;display:block;pointer-events:none;filter:drop-shadow(0 6px 18px rgba(0,0,0,.55));}
.vp-hunt-dev.vp-hunt-loading{opacity:.4;}
.vp-hunt-dev .vp-hunt-hint{position:absolute;left:50%;bottom:-6px;transform:translate(-50%,100%);padding:5px 11px;border-radius:11px;background:rgba(20,14,30,.86);color:#eee;font-family:inherit;font-weight:600;font-size:12px;line-height:1.2;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .2s;}
.vp-hunt-dev:hover .vp-hunt-hint{opacity:1;}

/* ───────── окно: те же токены и скругления, что у галереи и «Сообщений» ───────── */
.vp-hunt{--vh-bg:#14121c;--vh-chip:var(--glass-bg,rgba(35,35,35,.5));--vh-chip-h:rgba(255,255,255,.12);
  --vh-fg:var(--text-primary,#f5f5f5);--vh-fg2:var(--text-secondary,#b5bac1);--vh-bd:var(--border-color,rgba(255,255,255,.15));
  --vh-ac:var(--vp-accent,#9b6bff);--vh-card:rgba(30,28,42,.97);--vh-gold:#ffd46a;--vh-web:rgba(255,255,255,.2);
  position:fixed;inset:0;z-index:99998;display:none;box-sizing:border-box;padding:12px;overflow:hidden;
  background:var(--vh-bg);color:var(--vh-fg);font-family:inherit;font-size:14px;line-height:1.4;}
.vp-hunt.vp-light{--vh-bg:#f6f4fa;--vh-chip:rgba(0,0,0,.06);--vh-chip-h:rgba(0,0,0,.1);
  --vh-fg:var(--text-primary,#141414);--vh-fg2:var(--text-secondary,#5b5f66);--vh-bd:var(--border-color,rgba(0,0,0,.12));
  --vh-card:#fff;--vh-gold:#b7791f;--vh-web:rgba(0,0,0,.16);}
.vp-hunt.vp-open{display:block;animation:vpHIn .22s cubic-bezier(.2,.8,.2,1);}
@keyframes vpHIn{from{opacity:0;transform:scale(.985);}to{opacity:1;transform:none;}}
.vp-hunt *{box-sizing:border-box;}
.vp-hunt button{font:inherit;color:inherit;margin:0;}
.vp-hunt button:focus-visible{outline:2px solid var(--vh-ac);outline-offset:2px;}

.vp-hunt-shell{position:relative;height:100%;display:flex;flex-direction:column;overflow:hidden;border-radius:36px;border:1px solid var(--vh-bd);
  background:radial-gradient(70% 55% at 50% 112%,rgba(155,107,255,.2),transparent 70%),var(--vh-card,rgba(30,28,42,.97));
  box-shadow:0 16px 48px rgba(0,0,0,.45);}
.vp-hunt.vp-light .vp-hunt-shell{box-shadow:0 16px 48px rgba(0,0,0,.12);background:radial-gradient(70% 55% at 50% 112%,rgba(155,107,255,.14),transparent 70%),var(--vh-card,#fff);}
.vp-hunt-shell::before{content:'';position:absolute;left:0;top:0;width:190px;height:190px;pointer-events:none;opacity:.7;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='none' stroke='%23ffffff' stroke-opacity='.2' stroke-linecap='round'%3E%3Cpath d='M0 0H200M0 0L196 52M0 0L173 100M0 0L141 141M0 0L100 173M0 0L52 196M0 0V200'/%3E%3Cpath d='M45 0Q26 26 0 45M85 0Q49 49 0 85M125 0Q72 72 0 125M165 0Q96 96 0 165'/%3E%3C/svg%3E") no-repeat 0 0/100% 100%;}
.vp-hunt.vp-light .vp-hunt-shell::before{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='none' stroke='%23000000' stroke-opacity='.16' stroke-linecap='round'%3E%3Cpath d='M0 0H200M0 0L196 52M0 0L173 100M0 0L141 141M0 0L100 173M0 0L52 196M0 0V200'/%3E%3Cpath d='M45 0Q26 26 0 45M85 0Q49 49 0 85M125 0Q72 72 0 125M165 0Q96 96 0 165'/%3E%3C/svg%3E");}

/* шапка: «Назад» · заголовок · переключатель режима (как табы галереи) */
.vp-hunt-top{position:relative;z-index:3;flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:18px 16px 10px;}
.vp-hunt-back{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;height:45px;padding:0 18px 0 12px;border:0;border-radius:9999px;cursor:pointer;
  font-size:14px;font-weight:500;background:var(--vh-chip);transition:background-color .15s,transform .15s;}
.vp-hunt-back:hover{background:var(--vh-chip-h);}
.vp-hunt-back:active{transform:scale(.97);}
.vp-hunt-back svg{width:20px;height:20px;}
.vp-hunt-title{flex:1 1 auto;min-width:0;font-size:24px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vp-hunt-modes{position:relative;flex:0 0 auto;display:grid;grid-template-columns:repeat(3,1fr);height:45px;padding:4px;border-radius:9999px;background:var(--vh-chip);}
.vp-hunt-ind{position:absolute;top:4px;bottom:4px;left:4px;width:calc((100% - 8px)/3);border-radius:9999px;pointer-events:none;
  background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px var(--vh-ac),0 0 14px -4px var(--vh-ac);
  transform:translateX(calc(var(--i,0) * 100%));transition:transform .3s cubic-bezier(.2,.8,.2,1);}
.vp-hunt.vp-light .vp-hunt-ind{background:#fff;}
.vp-hunt-modes button{position:relative;display:flex;align-items:center;justify-content:center;border:0;border-radius:9999px;padding:0 16px;
  font-size:14px;font-weight:500;line-height:21px;white-space:nowrap;cursor:pointer;background:transparent;color:var(--vh-fg2);transition:color .2s;}
.vp-hunt-modes button.vp-on{color:var(--vh-fg);}

/* сцена: радар, летающие карточки, цели */
.vp-hunt-stage{position:relative;flex:1 1 auto;min-height:0;overflow:hidden;}
.vp-hunt-arena{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
.vp-hunt-radar{position:absolute;left:50%;top:50%;width:0;height:0;transition:opacity .4s;}
.vp-hunt-radar i{position:absolute;left:-130px;top:-130px;width:260px;height:260px;border-radius:50%;border:1.5px solid var(--vh-ac);opacity:0;animation:vpHRing 3.6s cubic-bezier(.2,.6,.3,1) infinite;}
.vp-hunt-radar i:nth-child(2){animation-delay:1.2s;}
.vp-hunt-radar i:nth-child(3){animation-delay:2.4s;}
@keyframes vpHRing{0%{transform:scale(.3);opacity:.55;}100%{transform:scale(2.1);opacity:0;}}
.vp-hunt-sweep{position:absolute;left:-105px;top:-105px;width:210px;height:210px;border-radius:50%;opacity:.5;
  background:conic-gradient(from 0deg,transparent 0 50%,var(--vh-ac) 100%);
  -webkit-mask:radial-gradient(circle,transparent 64%,#000 65%);mask:radial-gradient(circle,transparent 64%,#000 65%);animation:vpHSpin 2.4s linear infinite;}
@keyframes vpHSpin{to{transform:rotate(360deg);}}
.vp-hunt:not([data-state=search]) .vp-hunt-radar{opacity:.22;}
.vp-hunt:not([data-state=search]) .vp-hunt-radar i,.vp-hunt:not([data-state=search]) .vp-hunt-sweep{animation-play-state:paused;}
.vp-hunt[data-state=empty] .vp-hunt-radar,.vp-hunt[data-state=error] .vp-hunt-radar,.vp-hunt[data-state=empty] .vp-hunt-card,.vp-hunt[data-state=error] .vp-hunt-card{display:none;}
.vp-hunt[data-state=pause] .vp-hunt-card:not(.vp-hero),.vp-hunt[data-state=pause] .vp-hunt-card:not(.vp-hero) .vp-hunt-card-in{animation-play-state:paused;}

.vp-hunt-empty{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:0 24px;pointer-events:none;}
.vp-hunt[data-state=empty] .vp-hunt-empty,.vp-hunt[data-state=error] .vp-hunt-empty{display:flex;}
.vp-hunt-empty-i{font-size:44px;line-height:1;opacity:.55;filter:grayscale(.4);margin-bottom:6px;}
.vp-hunt-empty-h{font-size:20px;font-weight:700;}
.vp-hunt-empty-s{font-size:14px;color:var(--vh-fg2);}

/* карточки-миниатюры постов */
.vp-hunt-card{position:absolute;left:50%;top:50%;width:112px;height:148px;margin:-74px 0 0 -56px;z-index:1;pointer-events:none;
  translate:var(--cx,0) var(--cy,0);animation:vpHCard var(--d,3.2s) cubic-bezier(.4,.05,.3,1) both;will-change:translate,rotate,scale,opacity;}
@keyframes vpHCard{
  0%{translate:var(--sx) var(--sy);rotate:var(--r0);scale:.6;opacity:0;}
  14%{opacity:1;}
  42%{translate:var(--cx) var(--cy);rotate:var(--rc);scale:1.06;}
  62%{translate:var(--cx) var(--cy);rotate:var(--rc);scale:1.06;opacity:1;}
  100%{translate:var(--ex) var(--ey);rotate:var(--r1);scale:.72;opacity:0;}}
.vp-hunt-card-in{position:absolute;inset:0;transform-style:preserve-3d;animation:vpHFlip var(--d,3.2s) ease both;}
@keyframes vpHFlip{0%,8%{transform:perspective(700px) rotateY(180deg);}38%,100%{transform:perspective(700px) rotateY(0deg);}}
.vp-hunt-card-f,.vp-hunt-card-b{position:absolute;inset:0;border-radius:16px;overflow:hidden;-webkit-backface-visibility:hidden;backface-visibility:hidden;}
.vp-hunt-card-f{display:flex;flex-direction:column;background:var(--vh-card);border:1px solid var(--vh-bd);box-shadow:0 10px 28px rgba(0,0,0,.45);}
.vp-hunt.vp-light .vp-hunt-card-f{box-shadow:0 10px 28px rgba(0,0,0,.16);}
.vp-hunt-card-b{transform:rotateY(180deg);border:1px solid var(--vh-bd);box-shadow:0 10px 28px rgba(0,0,0,.45);
  background:linear-gradient(145deg,rgba(130,100,230,.92),rgba(30,22,60,.97));}
.vp-hunt-card-b::before{content:'?';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:700;color:rgba(255,255,255,.5);}
.vp-hunt-card-b::after{content:'';position:absolute;inset:8px;border-radius:11px;border:1px dashed rgba(255,255,255,.28);}
.vp-hunt-card-img{position:relative;flex:1 1 auto;min-height:0;overflow:hidden;background:rgba(128,128,128,.18);}
.vp-hunt-card-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;opacity:0;transition:opacity .35s;}
.vp-hunt-card-img img.ok{opacity:1;}
.vp-hunt-card-play{position:absolute;right:6px;bottom:6px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:rgba(15,10,26,.72);color:#fff;font-size:9px;padding-left:1px;}
.vp-hunt-card-img.vp-sil{padding:10px 10px 0;display:flex;flex-direction:column;gap:6px;background:transparent;}
.vp-hunt-card-img.vp-sil i{display:block;height:7px;border-radius:4px;background:rgba(128,128,128,.3);}
.vp-hunt-card-img.vp-sil p{margin:0;font-size:11px;line-height:1.35;color:var(--vh-fg);overflow:hidden;display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;word-break:break-word;}
.vp-hunt-card-meta{flex:0 0 auto;display:flex;flex-direction:column;gap:3px;padding:7px 9px 9px;border-top:1px solid var(--vh-bd);}
.vp-hunt-card-nick{font-size:10.5px;font-weight:600;color:var(--vh-fg2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vp-hunt-card-meta i{display:block;height:6px;border-radius:3px;background:rgba(128,128,128,.28);}
.vp-hunt-card-meta i:last-child{width:62%;}

/* карточка с находкой: крупнее, дрожит, подсвечивается, «бац» */
.vp-hunt-card.vp-hero{width:150px;height:198px;margin:-99px 0 0 -75px;z-index:3;animation-name:vpHHero;animation-duration:2.2s;animation-timing-function:ease-in-out;}
.vp-hunt-card.vp-hero .vp-hunt-card-in{animation-name:vpHFlipH;animation-duration:2.2s;}
@keyframes vpHFlipH{0%,6%{transform:perspective(700px) rotateY(180deg);}34%,100%{transform:perspective(700px) rotateY(0deg);}}
@keyframes vpHHero{
  0%{translate:var(--sx) var(--sy);rotate:var(--r0);scale:.6;opacity:0;}
  12%{opacity:1;}
  38%{translate:0 0;rotate:0deg;scale:1.18;}
  50%{translate:0 0;rotate:0deg;scale:1.18;}
  54%{rotate:-3deg;}58%{rotate:3deg;}62%{rotate:-3deg;}66%{rotate:2deg;}
  70%{translate:0 0;rotate:0deg;scale:1.28;opacity:1;}
  76%{scale:1.14;}
  100%{translate:0 var(--ey);rotate:8deg;scale:.7;opacity:0;}}
.vp-hunt-card.vp-hero .vp-hunt-card-f::before{content:'';position:absolute;inset:0;border-radius:16px;z-index:2;pointer-events:none;opacity:0;animation:vpHFadeIn .3s ease 1s both;}
.vp-hunt-card.vp-hero-poss .vp-hunt-card-f::before{padding:2px;background:linear-gradient(115deg,#ff5b5b,#ffb15b,#f8ff5b,#5bff8a,#5bd6ff,#8a5bff,#ff5bd0,#ff5b5b);background-size:400% 400%;
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;
  animation:vpHFadeIn .3s ease 1s both,vpHRb2 2s linear infinite;}
.vp-hunt-card.vp-hero-wolf .vp-hunt-card-f::before{box-shadow:inset 0 0 0 2px rgba(150,105,255,.85),inset 0 0 22px rgba(150,105,255,.5);}
@keyframes vpHFadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes vpHRb2{to{background-position:400% 50%;}}
.vp-hunt-burst{position:absolute;left:50%;top:50%;width:0;height:0;z-index:4;pointer-events:none;--bc:#8fd6ff;}
.vp-hunt-burst.vp-b-wolf{--bc:#a97bff;}
.vp-hunt-burst::before{content:'';position:absolute;left:-70px;top:-70px;width:140px;height:140px;border-radius:50%;border:2px solid var(--bc);box-shadow:0 0 22px var(--bc);opacity:0;animation:vpHBurst .8s ease-out 1.54s forwards;}
.vp-hunt-burst i{position:absolute;left:-3px;top:-3px;width:6px;height:6px;border-radius:50%;background:var(--bc);opacity:0;animation:vpHSpark .75s ease-out 1.54s forwards;}
@keyframes vpHBurst{0%{transform:scale(.3);opacity:.9;}100%{transform:scale(2.7);opacity:0;}}
@keyframes vpHSpark{0%{transform:rotate(var(--a)) translateX(36px) scale(1);opacity:1;}100%{transform:rotate(var(--a)) translateX(150px) scale(.2);opacity:0;}}

/* низ: состояние поиска + счётчики */
.vp-hunt-dock{position:relative;z-index:3;flex:0 0 auto;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;padding:6px 16px 20px;}
.vp-hunt-state{display:inline-flex;align-items:center;gap:12px;min-height:45px;max-width:100%;padding:6px 8px 6px 16px;border:0;border-radius:9999px;text-align:left;cursor:pointer;
  background:var(--vh-chip);transition:background-color .15s,transform .15s;}
.vp-hunt-state:hover{background:var(--vh-chip-h);}
.vp-hunt-state:active{transform:scale(.98);}
.vp-hunt-state:disabled{cursor:default;transform:none;background:var(--vh-chip);}
.vp-hunt-dot{position:relative;flex:0 0 auto;width:10px;height:10px;border-radius:50%;background:var(--vh-ac);}
.vp-hunt-dot::after{content:'';position:absolute;inset:0;border-radius:50%;background:inherit;animation:vpHPing 1.6s cubic-bezier(0,0,.2,1) infinite;}
@keyframes vpHPing{0%{transform:scale(1);opacity:.7;}100%{transform:scale(3.2);opacity:0;}}
.vp-hunt:not([data-state=search]) .vp-hunt-dot::after{animation:none;opacity:0;}
.vp-hunt[data-state=pause] .vp-hunt-dot{background:#ffb84a;}
.vp-hunt[data-state=full] .vp-hunt-dot{background:var(--vh-gold);}
.vp-hunt[data-state=done] .vp-hunt-dot{background:#5bff8a;}
.vp-hunt[data-state=empty] .vp-hunt-dot{background:rgba(128,128,128,.7);}
.vp-hunt[data-state=error] .vp-hunt-dot{background:#f23f43;}
.vp-hunt-state-t{display:flex;flex-direction:column;min-width:0;}
.vp-hunt-state-h{display:flex;align-items:baseline;gap:4px;font-size:14px;font-weight:600;line-height:1.25;white-space:nowrap;}
.vp-hunt-state-s{font-size:12.5px;line-height:1.25;color:var(--vh-fg2);}
.vp-hunt-dots{display:none;gap:3px;align-items:center;align-self:flex-end;margin-bottom:6px;}
.vp-hunt[data-state=search] .vp-hunt-dots{display:inline-flex;}
.vp-hunt-dots i{display:block;width:4px;height:4px;border-radius:50%;background:currentColor;animation:vpHDot 1.2s ease-in-out infinite;}
.vp-hunt-dots i:nth-child(2){animation-delay:.15s;}
.vp-hunt-dots i:nth-child(3){animation-delay:.3s;}
@keyframes vpHDot{0%,60%,100%{opacity:.25;transform:translateY(0);}30%{opacity:1;transform:translateY(-2px);}}
.vp-hunt-state-ic{flex:0 0 auto;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(128,128,128,.2);}
.vp-hunt-state-ic svg{display:none;width:15px;height:15px;}
.vp-hunt[data-state=search] .vp-ic-pause,.vp-hunt[data-state=pause] .vp-ic-play,.vp-hunt[data-state=empty] .vp-ic-again,.vp-hunt[data-state=error] .vp-ic-again{display:block;}
.vp-hunt[data-state=full] .vp-hunt-state-ic,.vp-hunt[data-state=done] .vp-hunt-state-ic{display:none;}
.vp-hunt[data-state=full] .vp-hunt-state,.vp-hunt[data-state=done] .vp-hunt-state{padding-right:18px;}
.vp-hunt-stat{display:inline-flex;align-items:center;gap:8px;height:45px;padding:0 16px;border-radius:9999px;background:var(--vh-chip);font-size:13px;color:var(--vh-fg2);white-space:nowrap;}
.vp-hunt-stat b{color:var(--vh-fg);font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;}
.vp-hunt-stat.vp-gold b{color:var(--vh-gold);}
.vp-hunt-slots{display:inline-flex;gap:4px;}
.vp-hunt-slots i{display:block;width:8px;height:8px;border-radius:50%;background:rgba(128,128,128,.35);transition:background-color .3s,box-shadow .3s;}
.vp-hunt-slots i.on{background:var(--vh-gold);box-shadow:0 0 8px var(--vh-gold);}

/* цели: радужное стекло у призрака, фиолетовое у оборотня — как было */
.vp-hunt-tgt{position:absolute;z-index:10;width:78px;height:78px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:36px;
  background:rgba(20,14,40,.7);backdrop-filter:blur(6px);transition:transform .12s ease,filter .12s,scale .15s ease;will-change:transform;}
.vp-hunt-tgt:hover{scale:1.08;filter:brightness(1.2);}
.vp-hunt-tgt:focus-visible{outline:2px solid #fff;outline-offset:3px;}
.vp-hunt-tgt.vp-poss{box-shadow:0 0 0 3px transparent,0 0 26px rgba(150,105,255,.55);border:3px solid transparent;
  background-image:linear-gradient(rgba(20,14,40,.85),rgba(20,14,40,.85)),linear-gradient(115deg,#ff5b5b,#ffb15b,#f8ff5b,#5bff8a,#5bd6ff,#8a5bff,#ff5bd0,#ff5b5b);
  background-origin:border-box;background-clip:padding-box,border-box;background-size:100% 100%,400% 400%;animation:vpHRainbow 4s linear infinite;}
.vp-hunt-tgt.vp-wolf{box-shadow:0 0 0 2px rgba(150,105,255,.65),0 0 22px rgba(150,105,255,.4);}
@keyframes vpHRainbow{0%{background-position:0 0,0% 50%;}100%{background-position:0 0,400% 50%;}}
.vp-hunt-tgt.vp-caught{animation:vpCaught .5s ease forwards;pointer-events:none;}
@keyframes vpCaught{to{transform:scale(1.9);opacity:0;}}
/* вылет из карточки: двигаем отдельными свойствами translate/scale, чтобы не конфликтовать с дрейфом через transform */
.vp-hunt-tgt.vp-launch{pointer-events:none;animation:vpHLaunch .85s cubic-bezier(.2,.9,.25,1.12) both;}
.vp-hunt-tgt.vp-poss.vp-launch{animation:vpHLaunch .85s cubic-bezier(.2,.9,.25,1.12) both,vpHRainbow 4s linear infinite;}
@keyframes vpHLaunch{0%{translate:var(--fx,0px) var(--fy,0px);scale:.2;opacity:0;rotate:-40deg;}14%{opacity:1;}100%{translate:0 0;scale:1;opacity:1;rotate:0deg;}}

@media (max-width:640px){
  .vp-hunt{padding:8px;}
  .vp-hunt-shell{border-radius:28px;}
  .vp-hunt-top{padding:12px 10px 8px;gap:8px;}
  .vp-hunt-title{display:none;}
  .vp-hunt-back{padding:0 12px;}
  .vp-hunt-back span{display:none;}
  .vp-hunt-modes{margin-left:auto;}
  .vp-hunt-modes button{padding:0 11px;font-size:13px;}
  .vp-hunt-dock{padding:4px 10px 14px;}
  .vp-hunt-state{width:100%;}
  .vp-hunt-state-t{flex:1 1 auto;}
  .vp-hunt-stat{height:40px;padding:0 13px;}
}
@media (prefers-reduced-motion:reduce){
  .vp-hunt-tgt,.vp-hunt-tgt.vp-caught{animation:none!important;transition:none!important;}
  .vp-hunt.vp-open{animation:none;}
  .vp-hunt-radar i,.vp-hunt-sweep,.vp-hunt-dot::after,.vp-hunt-dots i{animation:none!important;}
  .vp-hunt-radar i:first-child{opacity:.25;}
  .vp-hunt-card{animation:vpHFade 2.4s ease both!important;translate:var(--rx,0) var(--ry,0);}
  .vp-hunt-card-in{animation:none!important;transform:none;}
  .vp-hunt-card.vp-hero{animation:vpHFade 2.2s ease both!important;translate:0 0;scale:1.15;}
  .vp-hunt-card.vp-hero .vp-hunt-card-f::before{animation:none!important;opacity:1;}
  .vp-hunt-burst{display:none;}
  .vp-hunt-ind{transition:none;}
}
@keyframes vpHFade{0%{opacity:0;}20%{opacity:1;}80%{opacity:1;}100%{opacity:0;}}
`;

            const DEV_FILE = 'hunt-dev2.webp', DEV_CACHE = 'hunt-dev2@1';
            let devUrl = '';

            let huntFrame = null, huntDoc = null, huntOpen = false, huntWin = null;
            let huntBusy = false, huntDone = false, huntCursor = null, huntSeen = new Set(), huntSeq = 0;
            let huntFound = 0, huntScanned = 0;
            const huntTargets = new Map();
            const HUNT_MAX_TARGETS = 4, HUNT_MAX_PAGES = 40, HUNT_GAP = 1200;

            // — только UI-состояние: пауза пользователем, ошибка сети, находки, что ещё «вылетают» из карточек —
            let huntPaused = false, huntErr = false, huntPending = 0;
            const huntMeta = new Map(), huntCards = new Set();
            let huntCardQ = [], huntCardTimer = 0, huntRevealAt = 0;
            const HUNT_CARD_LIVE = 8, HUNT_HERO_MS = 2200, HUNT_HERO_BURST_MS = 1540;
            const HUNT_WHAT = { ghosts: 'призраков', wolves: 'оборотней', both: 'нечисть' };

            const HUNT_SAVE = 'vpHuntState';
            const huntCalm = () => { try { return !!(huntDoc && huntDoc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } };

            function huntStatsUpdate() {
                if (!huntDoc) return;
                const s = huntDoc.querySelector('.vp-hunt-scanned'), f = huntDoc.querySelector('.vp-hunt-found');
                if (s) s.textContent = String(huntScanned);
                if (f) f.textContent = String(huntFound);
                huntDoc.querySelectorAll('.vp-hunt-slots i').forEach((x, i) => x.classList.toggle('on', i < huntFound));
            }
            function huntSave() {
                try {
                    const targets = [];
                    huntTargets.forEach((v, id) => { targets.push({ id: id, kind: v.kind, user: v.user, label: v.label, x: v.x, y: v.y }); });
                    sessionStorage.setItem(HUNT_SAVE, JSON.stringify({
                        at: Date.now(), found: huntFound, scanned: huntScanned,
                        cursor: huntCursor, seen: [...huntSeen], targets: targets
                    }));
                } catch (e) { }
            }
            function huntSaveClear() {
                try { sessionStorage.removeItem(HUNT_SAVE); } catch (e) { }
            }
            function huntLoadSave() {
                try {
                    const raw = sessionStorage.getItem(HUNT_SAVE);
                    if (!raw) return null;
                    const st = JSON.parse(raw);
                    if (!st || !st.at || Date.now() - st.at > 30 * 60 * 1000) return null;
                    return st;
                } catch (e) { return null; }
            }

            // ───────── состояние поиска: одно место, где решается, что видит пользователь ─────────
            function huntState() {
                if (huntErr) return 'error';
                if (huntPaused) return 'pause';
                if (huntTargets.size + huntPending >= HUNT_MAX_TARGETS) return 'full';
                if (huntDone) return (huntFound || huntTargets.size) ? 'done' : 'empty';
                return 'search';
            }
            function huntUi() {
                const w = huntWin;
                if (!w || !huntDoc) return;
                const st = huntState();
                w.dataset.state = st;
                const T = {
                    search: ['Ищем ' + HUNT_WHAT[huntMode()], 'Нажми, чтобы поставить на паузу'],
                    pause: ['Пауза', 'Нажми, чтобы продолжить'],
                    full: ['Поле заполнено', 'Поймай кого-нибудь — и поиск продолжится'],
                    done: ['Поиск завершён', 'Выбери цель на поле'],
                    empty: ['Сейчас никого нет', 'Нажми, чтобы искать снова'],
                    error: ['Поиск остановлен', 'Ошибка сети — нажми, чтобы повторить']
                }[st];
                const set = (sel, txt) => { const n = w.querySelector(sel); if (n && n.textContent !== txt) n.textContent = txt; };
                set('.vp-hunt-state-hx', T[0]);
                set('.vp-hunt-state-s', T[1]);
                const btn = w.querySelector('.vp-hunt-state');
                if (btn) { btn.disabled = (st === 'full' || st === 'done'); btn.title = T[1]; }
                if (st === 'empty') { set('.vp-hunt-empty-h', 'Сейчас никого нет'); set('.vp-hunt-empty-s', 'Проверено постов: ' + huntScanned + '. Загляни позже — нечисть появляется не всегда.'); }
                if (st === 'error') { set('.vp-hunt-empty-h', 'Поиск остановлен'); set('.vp-hunt-empty-s', 'Не удалось загрузить ленту. Проверь соединение и нажми «повторить».'); }
                if (st === 'search') huntCardKick();
            }
            // Текст статуса теперь собирается из состояния (huntUi), поэтому аргумент не нужен.
            // Вызовы в логике оставлены как есть, чтобы её не трогать.
            function huntStatus() { huntUi(); }
            function huntBar() { /* прогресс-полоски больше нет: заполненность поля показывают точки у «Найдено» (huntStatsUpdate) */ }
            function huntToggle() {
                const st = huntState();
                if (st === 'search') { huntPaused = true; huntUi(); }
                else if (st === 'pause') { huntPaused = false; huntUi(); huntLoop(); }
                else if (st === 'empty') { huntSaveClear(); huntRestart(false); }
                else if (st === 'error') { huntErr = false; huntDone = false; huntUi(); huntLoop(); }
            }
            // Дальше поиск сам идёт страница за страницей; паузу между запросами держит huntNet.
            function huntNext(seq) {
                if (seq !== huntSeq) return;
                huntUi();
                if (huntDone || huntPaused || huntErr || !huntOpen) return;
                setTimeout(huntLoop, 0);
            }

            // ───────── тема: окно живёт в iframe, а переменные и шрифт мода — в родителе ─────────
            // Непрозрачная база: в iframe ивента мод форсит --bg-primary: transparent,
            // поэтому фон окна нельзя брать из переменной — иначе видно сцену (блюр-экран).
            function huntSolidBg(light) {
                const base = light ? [255, 255, 255] : [20, 18, 28];
                try {
                    const cs = getComputedStyle(document.documentElement);
                    const raw = (cs.getPropertyValue('--block-bg') || '').trim();
                    const m = raw.match(/rgba?\(([^)]+)\)/);
                    if (m) {
                        const p = m[1].split(',').map(s => parseFloat(s));
                        const r = p[0], g = p[1], b = p[2], a = p.length > 3 ? p[3] : 1;
                        if (isFinite(r) && isFinite(g) && isFinite(b)) {
                            if (a >= 0.95) return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
                            const mix = (c, i) => Math.round(c * a + base[i] * (1 - a));
                            return 'rgb(' + mix(r, 0) + ',' + mix(g, 1) + ',' + mix(b, 2) + ')';
                        }
                    }
                    if (/^#([0-9a-f]{6})$/i.test(raw)) return raw;
                } catch (e) { }
                return light ? '#f6f4fa' : '#14121c';
            }
            function huntTheme(w) {
                try {
                    const light = document.documentElement.classList.contains('vp-light');
                    const solid = huntSolidBg(light);
                    w.style.setProperty('--vh-bg', solid);
                    w.style.setProperty('--vh-card', light ? '#fff' : '#1e1c2a');
                    const cs = [getComputedStyle(document.documentElement), document.body ? getComputedStyle(document.body) : null];
                    ['--block-bg', '--glass-bg', '--text-primary', '--text-secondary', '--border-color', '--vp-accent', '--vp-glass-filter'].forEach(k => {
                        for (const c of cs) {
                            if (!c) continue;
                            const v = c.getPropertyValue(k).trim();
                            if (v) { w.style.setProperty(k, v); return; }
                        }
                    });
                    const ff = cs[1] ? cs[1].fontFamily : '';
                    if (ff) w.style.fontFamily = ff;
                    w.classList.toggle('vp-light', document.documentElement.classList.contains('vp-light'));
                } catch (e) { }
            }

            // ───────── карточки постов: летят, переворачиваются, из нужной вылетает цель ─────────
            function huntPostMeta(p) {
                let img = '', video = false;
                const at = Array.isArray(p.attachments) ? p.attachments : [];
                for (const a of at) {
                    if (!a) continue;
                    const u = a.thumbnailUrl || (a.type === 'image' ? a.url : '');
                    if (u && /^(https?:)?\/\/|^\//.test(u)) { img = u; video = a.type === 'video'; break; }
                }
                if (!video && at.some(a => a && a.type === 'video')) video = true;
                const txt = String(p.text || '').split('\n').map(s => s.trim()).filter(Boolean)[0] || '';
                const au = p.author && (p.author.username || p.author.displayName);
                return { img: img, video: video, text: txt.slice(0, 110), nick: au ? '@' + au : '' };
            }
            function huntCardSil(body, m) {
                body.classList.add('vp-sil');
                if (m.text) { const t = huntDoc.createElement('p'); t.textContent = m.text; body.appendChild(t); return; }
                [100, 86, 94, 64].forEach(w => { const l = huntDoc.createElement('i'); l.style.width = w + '%'; body.appendChild(l); });
            }
            function huntCardEl(m) {
                const d = huntDoc;
                const mk = (tag, cls) => { const n = d.createElement(tag); if (cls) n.className = cls; return n; };
                const c = mk('div', 'vp-hunt-card'), inn = mk('div', 'vp-hunt-card-in'), f = mk('div', 'vp-hunt-card-f'), b = mk('div', 'vp-hunt-card-b');
                const body = mk('div', 'vp-hunt-card-img');
                if (m.img) {
                    const im = d.createElement('img');
                    im.alt = ''; im.draggable = false; im.decoding = 'async';
                    im.addEventListener('load', () => im.classList.add('ok'));
                    im.addEventListener('error', () => { im.remove(); huntCardSil(body, m); });
                    im.src = m.img;
                    body.appendChild(im);
                    if (m.video) { const pl = mk('span', 'vp-hunt-card-play'); pl.textContent = '▶'; body.appendChild(pl); }
                } else huntCardSil(body, m);
                f.appendChild(body);
                const meta = mk('div', 'vp-hunt-card-meta');
                if (m.nick) { const n = mk('div', 'vp-hunt-card-nick'); n.textContent = m.nick; meta.appendChild(n); }
                else { meta.appendChild(d.createElement('i')); }
                if (m.img && m.text) { const n2 = mk('div', 'vp-hunt-card-nick'); n2.textContent = m.text; meta.appendChild(n2); }
                else if (m.img || !m.text) meta.appendChild(d.createElement('i'));
                f.appendChild(meta);
                inn.appendChild(f); inn.appendChild(b); c.appendChild(inn);
                return c;
            }
            function huntCardLaunch(m, hero, kind) {
                const arena = huntDoc.querySelector('.vp-hunt-arena'), stage = huntDoc.querySelector('.vp-hunt-stage');
                if (!arena || !stage) return null;
                const W = stage.clientWidth || 800, H = stage.clientHeight || 500;
                const R = (a, b) => a + Math.random() * (b - a), S = () => (Math.random() < 0.5 ? -1 : 1);
                const c = huntCardEl(m);
                const side = Math.random();
                let sx, sy;
                if (side < 0.38) { sx = -(W / 2 + 160); sy = R(-0.3, 0.3) * H; }
                else if (side < 0.76) { sx = W / 2 + 160; sy = R(-0.3, 0.3) * H; }
                else { sx = R(-0.3, 0.3) * W; sy = -(H / 2 + 200); }
                const cx = hero ? 0 : R(-1, 1) * Math.min(240, W * 0.28), cy = hero ? 0 : R(-1, 1) * Math.min(90, H * 0.16);
                const dur = hero ? HUNT_HERO_MS / 1000 : R(2.9, 3.8);
                const set = (k, v) => c.style.setProperty(k, v);
                set('--sx', sx.toFixed(0) + 'px'); set('--sy', sy.toFixed(0) + 'px');
                set('--cx', cx.toFixed(0) + 'px'); set('--cy', cy.toFixed(0) + 'px');
                set('--ex', (cx + R(-60, 60)).toFixed(0) + 'px'); set('--ey', (H / 2 + 220).toFixed(0) + 'px');
                set('--rx', (R(-0.32, 0.32) * W).toFixed(0) + 'px'); set('--ry', (R(-0.28, 0.28) * H).toFixed(0) + 'px');
                set('--r0', (S() * R(18, 48)).toFixed(0) + 'deg'); set('--rc', (hero ? 0 : S() * R(2, 8)).toFixed(1) + 'deg'); set('--r1', (S() * R(10, 26)).toFixed(0) + 'deg');
                set('--d', dur.toFixed(2) + 's');
                if (hero) c.classList.add('vp-hero', 'vp-hero-' + (kind === 'wolf' ? 'wolf' : 'poss'));
                arena.appendChild(c);
                huntCards.add(c);
                if (hero) setTimeout(() => { c.remove(); huntCards.delete(c); }, dur * 1000 + 250);
                else c.addEventListener('animationend', e => { if (e.target === c) { c.remove(); huntCards.delete(c); } });
                return c;
            }
            function huntCardTick() {
                if (!huntDoc || !huntOpen) { huntCardQ = []; }
                if (!huntCardQ.length) { clearInterval(huntCardTimer); huntCardTimer = 0; return; }
                if (huntState() !== 'search') return;
                let live = 0; huntCards.forEach(c => { if (!c.classList.contains('vp-hunt-burst') && !c.classList.contains('vp-hero')) live++; });
                if (live >= HUNT_CARD_LIVE) return;
                huntCardLaunch(huntCardQ.shift(), false);
            }
            function huntCardKick() {
                if (huntCardTimer || !huntDoc || !huntOpen || !huntCardQ.length) return;
                huntCardTimer = setInterval(huntCardTick, 260);
            }
            // каждый загруженный пост — кандидат на карточку; на экран попадает только часть, чтобы не было каши
            function huntCardPush(p) {
                if (!p || !p.id || !huntDoc) return;
                const m = huntPostMeta(p);
                huntMeta.set(p.id, m);
                if (huntMeta.size > 160) huntMeta.delete(huntMeta.keys().next().value);
                if (Math.random() > (m.img ? 0.34 : 0.14)) return;
                huntCardQ.push(m);
                if (huntCardQ.length > 14) huntCardQ.shift();
                huntCardKick();
            }
            function huntCardsReset() {
                huntCardQ = []; huntRevealAt = 0;
                if (huntCardTimer) { clearInterval(huntCardTimer); huntCardTimer = 0; }
                huntCards.clear();
                if (huntDoc) huntDoc.querySelectorAll('.vp-hunt-card,.vp-hunt-burst').forEach(n => n.remove());
            }
            // Находка: карточка этого поста выезжает в центр, дрожит, «бац» — и из неё вылетает цель.
            // Сама цель создаётся прежним huntSpawn, просто чуть позже и с точкой вылета.
            function huntReveal(m) {
                if (!huntDoc) return;
                const seq = huntSeq;
                huntPending++;
                huntUi();
                const now = performance.now(), startAt = Math.max(now, huntRevealAt);
                huntRevealAt = startAt + 1250;
                setTimeout(() => {
                    if (seq !== huntSeq || !huntDoc) return;
                    const stage = huntDoc.querySelector('.vp-hunt-stage'), arena = huntDoc.querySelector('.vp-hunt-arena');
                    const W = (stage && stage.clientWidth) || 800, H = (stage && stage.clientHeight) || 500;
                    const meta = huntMeta.get(m.postId) || { img: '', video: false, text: '', nick: m.user ? '@' + m.user : '' };
                    huntCardLaunch(meta, true, m.kind);
                    if (arena && !huntCalm()) {
                        const bu = huntDoc.createElement('div');
                        bu.className = 'vp-hunt-burst vp-b-' + (m.kind === 'wolf' ? 'wolf' : 'poss');
                        for (let i = 0; i < 8; i++) { const s = huntDoc.createElement('i'); s.style.setProperty('--a', (i * 45) + 'deg'); bu.appendChild(s); }
                        arena.appendChild(bu); huntCards.add(bu);
                        setTimeout(() => { bu.remove(); huntCards.delete(bu); }, 2600);
                    }
                    setTimeout(() => {
                        if (seq !== huntSeq) return;
                        huntPending = Math.max(0, huntPending - 1);
                        huntSpawn(m.kind, m.postId, m.user, m.label, null, { x: W / 2, y: H / 2 });
                        huntUi();
                    }, huntCalm() ? 600 : HUNT_HERO_BURST_MS);
                }, Math.max(0, startAt - now));
            }

            function huntSpawn(kind, postId, user, label, at, from) {
                if (!huntDoc || huntTargets.size >= HUNT_MAX_TARGETS) return;
                if (huntTargets.has(postId)) return;
                const stage = huntDoc.querySelector('.vp-hunt-stage');
                if (!stage) return;
                const W = stage.clientWidth || 800, H = stage.clientHeight || 600;
                const SZ = 78, MARG = 8;
                const el = huntDoc.createElement('div');
                el.className = 'vp-hunt-tgt vp-' + kind;
                el.textContent = kind === 'wolf' ? '\u{1F43A}' : '\u{1F47B}';
                const hint = kind === 'wolf' ? ' — нажми, чтобы поставить лайк (ночная конфета)' : ' — нажми, чтобы открыть пост';
                el.title = label + hint;
                el.tabIndex = 0;
                el.setAttribute('role', 'button');
                el.setAttribute('aria-label', label + hint);
                const clampX = v => Math.max(MARG, Math.min(W - SZ - MARG, v));
                const clampY = v => Math.max(MARG, Math.min(H - SZ - MARG, v));
                const x = at ? clampX(at.x) : MARG + Math.random() * Math.max(20, W - SZ - MARG * 2);
                const y = at ? clampY(at.y) : MARG + Math.random() * Math.max(20, H - SZ - MARG * 2);
                el.style.left = x + 'px';
                el.style.top = y + 'px';
                // вылет из карточки (или просто «всплытие» на месте, если цель восстановлена из сохранения)
                el.style.setProperty('--fx', (from ? from.x - (x + 39) : 0) + 'px');
                el.style.setProperty('--fy', (from ? from.y - (y + 39) : 0) + 'px');
                el.classList.add('vp-launch');
                setTimeout(() => el.classList.remove('vp-launch'), 950);
                const phase = Math.random() * Math.PI * 2, sx = 0.9 + Math.random() * 0.8, sy = 0.7 + Math.random() * 0.6;
                let raf = 0, t0 = performance.now();
                const move = now => {
                    if (!el.isConnected) return;
                    const t = (now - t0) / 1000;
                    let dx = Math.sin(t * sx + phase) * 46, dy = Math.cos(t * sy + phase * 1.3) * 34;
                    dx = Math.max(MARG - x, Math.min(W - SZ - MARG - x, dx));
                    dy = Math.max(MARG - y, Math.min(H - SZ - MARG - y, dy));
                    el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
                    raf = requestAnimationFrame(move);
                };
                if (!huntCalm()) raf = requestAnimationFrame(move);
                el.addEventListener('click', e => {
                    e.preventDefault(); e.stopPropagation();
                    el.classList.add('vp-caught');
                    cancelAnimationFrame(raf);
                    const id = postId, u = user, isWolf = kind === 'wolf';
                    huntTargets.delete(postId);
                    huntFound = Math.max(0, huntFound - 1);
                    huntStatsUpdate();
                    setTimeout(() => { if (el.parentNode) el.remove(); }, 500);
                    if (isWolf) {
                        // оборотень: лайк вместо перехода (за ночной лайк дают конфету)
                        huntLike(id);
                        huntSave();
                        huntStatus('Оборотень пойман — лайк поставлен', 'scan');
                        return;
                    }
                    setTimeout(() => {
                        huntSave();
                        try { const st = huntLoadSave() || {}; st.wasOpen = true; st.at = Date.now(); sessionStorage.setItem(HUNT_SAVE, JSON.stringify(st)); } catch (x) { }
                        huntBack(true);
                        try { parent.postMessage({ vpHunt: 'open', postId: id, user: u }, '*'); } catch (x) { }
                    }, 260);
                }, true);
                el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
                stage.appendChild(el);
                huntTargets.set(postId, { el, raf, kind, user, label, x, y });
                setTimeout(huntReflow, 60);
                huntFound++;
                huntStatsUpdate();
                huntSave();
                huntStatus('Найдено: ' + huntFound + ' · проанализировано постов: ' + huntScanned);
            }
            // Все цели — внутрь видимой области сцены (после реальной раскладки и при resize).
            function huntReflow() {
                const stage = huntDoc && huntDoc.querySelector('.vp-hunt-stage');
                if (!stage) return;
                const W = stage.clientWidth, H = stage.clientHeight;
                if (!W || !H) return;
                const SZ = 78, MARG = 8;
                huntTargets.forEach(t => {
                    const el = t.el;
                    if (!el || !el.isConnected) return;
                    const curX = parseFloat(el.style.left) || 0;
                    const curY = parseFloat(el.style.top) || 0;
                    const nx = Math.max(MARG, Math.min(W - SZ - MARG, curX));
                    const ny = Math.max(MARG, Math.min(H - SZ - MARG, curY));
                    if (nx !== curX) { el.style.left = nx + 'px'; t.x = nx; }
                    if (ny !== curY) { el.style.top = ny + 'px'; t.y = ny; }
                });
            }
            addEventListener('resize', () => setTimeout(huntReflow, 120));

            function huntClear() {
                if (!huntDoc) return;
                huntDoc.querySelectorAll('.vp-hunt-tgt').forEach(t => t.remove());
                huntTargets.forEach(v => cancelAnimationFrame(v.raf));
                huntTargets.clear();
                huntFound = 0;
                huntStatsUpdate();
            }

            function huntParse(v) {
                if (!v) return null;
                const p = v.possession, w = v.werewolf;
                if (p) { if (p.resolved) return null; return { kind: 'poss', label: p.stage === 'taken' ? 'Пост захвачен' : 'Призрак' }; }
                if (w && w.night) return { kind: 'wolf', label: 'Оборотень (ночь)' };
                return null;
            }

            const huntLiked = new Set();
            async function huntLike(postId) {
                if (!postId || huntLiked.has(postId)) return;
                huntLiked.add(postId);
                try {
                    const r = await api('/api/posts/' + encodeURIComponent(postId) + '/like', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
                    });
                    if (!r || (r.status !== 200 && r.status !== 201 && r.status !== 204 && r.status !== 409)) {
                        huntLiked.delete(postId);
                        huntStatus('Лайк не поставился (' + (r ? r.status : 'сеть') + ')', 'err');
                    }
                } catch (e) {
                    huntLiked.delete(postId);
                    logErr('охота: лайк', e);
                }
            }
            let huntLastNet = 0;
            async function huntNet(url) {
                const wait = huntLastNet + HUNT_GAP - Date.now();
                if (wait > 0) await new Promise(r => setTimeout(r, wait));
                huntLastNet = Date.now();
                return api(url);
            }
            function huntModeOk(kind) {
                const m = huntMode();
                if (m === 'both') return true;
                if (m === 'ghosts') return kind === 'poss';
                return kind === 'wolf';
            }
            async function huntLoop() {
                if (huntBusy || huntDone || !huntFrame || !huntOpen) return;
                if (huntPaused || huntTargets.size + huntPending >= HUNT_MAX_TARGETS) { huntUi(); return; }
                huntBusy = true;
                const seq = huntSeq;
                try {
                    const lim = 50;
                    let url = '/api/posts?limit=' + lim + '&tab=popular' + (huntCursor ? '&cursor=' + encodeURIComponent(huntCursor) : '');
                    const res = await huntNet(url);
                    if (seq !== huntSeq || huntPaused) return;
                    if (!res || !res.ok) { huntErr = true; huntDone = true; huntStatus('Поиск остановлен (ошибка сети)'); huntBusy = false; return; }
                    const j = await res.json(), d = j.data || j;
                    let posts = d.posts || [], next = (d.pagination && d.pagination.nextCursor) || d.nextCursor || d.cursor || null;
                    huntScanned += posts.length;
                    for (const p of posts) huntCardPush(p);
                    huntBar(Math.min(100, (huntFound / Math.max(6, HUNT_MAX_TARGETS)) * 100));
                    huntStatsUpdate();
                    huntStatus('Ищем… проанализировано ' + huntScanned + ' постов, найдено ' + huntFound);
                    if (posts.length) {
                        const ids = posts.map(p => p.id).filter(Boolean);
                        if (ids.length) {
                            const chunk = ids.slice(0, 40);
                            const url2 = '/api/v1/halloween/feed-state?posts=' + chunk.map(encodeURIComponent).join(',');
                            let r2 = null;
                            try { r2 = await huntNet(url2); } catch (e) { }
                            if (seq !== huntSeq) return;
                            if (r2 && r2.ok) {
                                let d2 = null;
                                try { d2 = await r2.json(); } catch (e) { }
                                const map = (d2 && ((d2.data && d2.data.posts) || d2.posts)) || {};
                                for (const p of posts) {
                                    const tag = huntParse(map[p.id]);
                                    if (!tag || !huntModeOk(tag.kind)) continue;
                                    if (huntSeen.has(p.id)) continue;
                                    huntSeen.add(p.id);
                                    const au = (p.author && (p.author.username || p.author.id)) || '';
                                    try { huntFrame.contentWindow.postMessage({ vpHunt: 'found', kind: tag.kind === 'wolf' ? 'wolf' : 'poss', postId: p.id, user: au, label: tag.label }, '*'); } catch (x) { }
                                    if (huntFound >= HUNT_MAX_TARGETS) break;
                                }
                            }
                        }
                    }
                    huntCursor = next;
                    huntSave();
                    if (!next || huntScanned >= HUNT_MAX_PAGES * lim) { huntDone = true; huntStatus(huntFound ? 'Проанализировано ' + huntScanned + ' постов, найдено ' + huntFound : 'Сейчас никого не нашли — попробуй позже'); }
                } catch (e) { logErr('охота', e); huntDone = true; }
                finally { huntBusy = false; huntNext(seq); }
            }

            const HUNT_SVG = (p, cls, extra) => '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (extra || 2.2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
            function huntWindow() {
                if (huntWin && huntWin.isConnected) return huntWin;
                const w = huntDoc.createElement('div');
                w.className = 'vp-hunt';
                w.dataset.state = 'search';
                w.innerHTML = '<div class="vp-hunt-shell">'
                    + '<div class="vp-hunt-top">'
                    + '<button type="button" class="vp-hunt-back" aria-label="Назад">' + HUNT_SVG('<path d="M15 6l-6 6 6 6"/>', '', 2) + '<span>Назад</span></button>'
                    + '<div class="vp-hunt-title">Охота на нечисть</div>'
                    + '<div class="vp-hunt-modes"><i class="vp-hunt-ind"></i>' + MODE_LIST.map(m => '<button type="button" data-m="' + m[0] + '">' + m[1] + '</button>').join('') + '</div>'
                    + '</div>'
                    + '<div class="vp-hunt-stage">'
                    + '<div class="vp-hunt-arena"><div class="vp-hunt-radar"><i></i><i></i><i></i><b class="vp-hunt-sweep"></b></div></div>'
                    + '<div class="vp-hunt-empty"><div class="vp-hunt-empty-i">\u{1F47B}</div><b class="vp-hunt-empty-h"></b><span class="vp-hunt-empty-s"></span></div>'
                    + '</div>'
                    + '<div class="vp-hunt-dock">'
                    + '<button type="button" class="vp-hunt-state"><span class="vp-hunt-dot"></span>'
                    + '<span class="vp-hunt-state-t"><b class="vp-hunt-state-h"><span class="vp-hunt-state-hx">Ищем</span><span class="vp-hunt-dots"><i></i><i></i><i></i></span></b><small class="vp-hunt-state-s"></small></span>'
                    + '<span class="vp-hunt-state-ic">'
                    + HUNT_SVG('<path d="M8 5v14M16 5v14"/>', 'vp-ic-pause', 2.6)
                    + HUNT_SVG('<path d="M8 5l11 7-11 7z" fill="currentColor"/>', 'vp-ic-play', 2)
                    + HUNT_SVG('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>', 'vp-ic-again', 2.4)
                    + '</span></button>'
                    + '<div class="vp-hunt-stat">Проверено<b class="vp-hunt-scanned">0</b></div>'
                    + '<div class="vp-hunt-stat vp-gold">Найдено<b class="vp-hunt-found">0</b><span class="vp-hunt-slots">' + '<i></i>'.repeat(HUNT_MAX_TARGETS) + '</span></div>'
                    + '</div>'
                    + '</div>';
                w.querySelector('.vp-hunt-back').addEventListener('click', huntBack, true);
                w.querySelector('.vp-hunt-state').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); huntToggle(); }, true);
                const modes = w.querySelector('.vp-hunt-modes');
                const modeIdx = () => Math.max(0, MODE_LIST.findIndex(m => m[0] === huntMode()));
                modes.style.setProperty('--i', modeIdx());
                w.querySelectorAll('.vp-hunt-modes button').forEach(b => {
                    b.classList.toggle('vp-on', b.dataset.m === huntMode());
                    b.addEventListener('click', e => {
                        e.preventDefault(); e.stopPropagation();
                        GM_setValue(HUNT_KEY, b.dataset.m);
                        w.querySelectorAll('.vp-hunt-modes button').forEach(x => x.classList.toggle('vp-on', x.dataset.m === b.dataset.m));
                        modes.style.setProperty('--i', modeIdx());
                        huntSaveClear();
                        huntRestart(false);
                    }, true);
                });
                huntDoc.body.appendChild(w);
                huntWin = w;
                huntTheme(w);
                return w;
            }

            function huntRestart(resume) {
                huntSeq++;
                huntCardsReset(); huntPaused = false; huntErr = false; huntPending = 0;
                const em0 = huntDoc && huntDoc.querySelector('.vp-hunt-empty');
                if (resume) {
                    const st = huntLoadSave();
                    if (st) {
                        huntCursor = st.cursor || null;
                        huntSeen = new Set(st.seen || []);
                        huntFound = 0; huntScanned = st.scanned || 0;
                        huntClear();
                        huntFound = 0;
                        for (const t of (st.targets || [])) huntSpawn(t.kind, t.id, t.user, t.label, { x: t.x, y: t.y });
                        if ((st.targets || []).length && em0) em0.style.display = 'none';
                        huntDone = false; huntBusy = false;
                        huntBar(Math.min(100, (huntFound / Math.max(6, HUNT_MAX_TARGETS)) * 100));
                        huntStatsUpdate();
                        huntStatus('Продолжаем: проанализировано ' + huntScanned + ', найдено ' + huntFound);
                        setTimeout(huntLoop, 800);
                        return;
                    }
                }
                huntCursor = null; huntSeen.clear(); huntFound = 0; huntScanned = 0;
                huntDone = false; huntBusy = false;
                huntClear();
                huntBar(0);
                huntStatsUpdate();
                huntStatus('Готов');
                if (em0) em0.style.display = '';
                setTimeout(huntLoop, 300);
            }

            let huntAutoChecked = false;
            function huntAutoOpen() {
                if (huntAutoChecked || !huntDoc) return;
                const st = huntLoadSave();
                if (!st || !st.targets || !st.targets.length) return;
                if (st.wasOpen === false) return;
                if (huntDoc.querySelector('.vp-hunt.vp-open')) { huntAutoChecked = true; return; }
                huntAutoChecked = true;
                huntOpenWin();
            }
            function huntShowScene() {
                if (!huntDoc) return;
                const sc = huntDoc.querySelector('.room-stage');
                if (sc && sc.style.visibility === 'hidden') sc.style.visibility = '';
            }
            function huntOpenWin() {
                if (!huntDoc) return;
                huntOpen = true;
                try { const st = huntLoadSave() || {}; st.wasOpen = true; st.at = Date.now(); sessionStorage.setItem(HUNT_SAVE, JSON.stringify(st)); } catch (e) { }
                let w = null;
                try {
                    w = huntWindow();
                    huntTheme(w);
                    w.classList.add('vp-open');
                } catch (e) {
                    logErr('охота: окно', e);
                }
                // окно должно реально быть в документе — иначе сцену не прячем (иначе «блюр без окна»)
                if (!w || !w.isConnected) {
                    huntOpen = false;
                    huntWin = null;
                    huntShowScene();
                    try { const st = huntLoadSave() || {}; st.wasOpen = false; st.at = Date.now(); sessionStorage.setItem(HUNT_SAVE, JSON.stringify(st)); } catch (e) { }
                    return;
                }
                if (w.querySelector('.vp-hunt-shell')) {
                    const sc = huntDoc.querySelector('.room-stage');
                    if (sc) sc.style.visibility = 'hidden';
                }
                try { huntRestart(true); } catch (e) { logErr('охота: старт', e); }
                setTimeout(huntReflow, 80);
                setTimeout(huntReflow, 400);
            }
            // Сторож: если окно «открыто», но его нет в документе — вернуть сцену и сбросить флаг
            function huntGuard() {
                if (!huntOpen || !huntDoc) return;
                const w = huntDoc.querySelector('.vp-hunt');
                if (w && w.isConnected) return;
                huntOpen = false;
                huntWin = null;
                huntShowScene();
                try { const st = huntLoadSave() || {}; st.wasOpen = false; st.at = Date.now(); sessionStorage.setItem(HUNT_SAVE, JSON.stringify(st)); } catch (e) { }
            }

            function huntBack(silent) {
                huntOpen = false;
                if (!silent) { try { const st = huntLoadSave() || {}; st.wasOpen = false; st.at = Date.now(); sessionStorage.setItem(HUNT_SAVE, JSON.stringify(st)); } catch (e) { } }
                if (huntWin) huntWin.classList.remove('vp-open');
                huntCardsReset();
                if (huntDoc) {
                    const sc = huntDoc.querySelector('.room-stage');
                    if (sc) sc.style.visibility = '';
                }
            }

            let devLoading = false;
            function huntDevLoad() {
                if (devUrl || devLoading) return;
                devLoading = true;
                palBlobKey(DEV_FILE, DEV_CACHE).then(b => { if (b) devUrl = URL.createObjectURL(b); }).catch(e => logErr('охота: устройство', e)).finally(() => { devLoading = false; });
            }
            function palBlobKey(file, key) {
                return palStore(key).then(have => {
                    if (have) return have;
                    return palFetch('https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/claude/github-script-access-ihd9ne/assets/' + file).then(b => {
                        if (b) palStore(key, b).catch(() => { });
                        return b;
                    }).catch(() => palFetch('https://raw.githubusercontent.com/kiwe147/ITD-Visual-Pack/main/assets/' + file).catch(() => null));
                });
            }

            function huntInstall(fr) {
                let d = null;
                try { d = fr.contentDocument; } catch (e) { return; }
                if (!d || !d.body) return;
                if (!huntOn()) return;
                const stage = d.querySelector('.room-stage');
                if (!stage) return;
                if (!d.getElementById('vp-hunt-css')) {
                    const st = d.createElement('style'); st.id = 'vp-hunt-css'; st.textContent = HUNT_CSS; d.head.appendChild(st);
                }
                if (!stage.querySelector(':scope > .vp-hunt-dev')) {
                    const dev = d.createElement('div');
                    dev.className = 'vp-hunt-dev' + (devUrl ? '' : ' vp-hunt-loading');
                    const img = d.createElement('img');
                    img.alt = '';
                    img.draggable = false;
                    if (devUrl) img.src = devUrl;
                    dev.appendChild(img);
                    const hint = d.createElement('div');
                    hint.className = 'vp-hunt-hint';
                    hint.textContent = 'Охота на нечисть';
                    dev.appendChild(hint);
                    dev.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); huntOpenWin(); }, true);
                    stage.appendChild(dev);
                    huntDevLoad();
                }
                const devImg = stage.querySelector(':scope > .vp-hunt-dev img');
                if (devUrl && devImg && devImg.getAttribute('src') !== devUrl) {
                    devImg.src = devUrl;
                    const dv = stage.querySelector(':scope > .vp-hunt-dev');
                    if (dv) dv.classList.remove('vp-hunt-loading');
                }
                huntFrame = fr; huntDoc = d;
                setTimeout(huntAutoOpen, 600);
                if (!d._vpHuntMsg) {
                    d._vpHuntMsg = true;
                    d.defaultView.addEventListener('message', ev => {
                        const m = ev.data;
                        if (!m || !m.vpHunt || !huntOpen) return;
                        if (m.vpHunt === 'found') {
                            const em = huntDoc.querySelector('.vp-hunt-empty');
                            if (em) em.style.display = 'none';
                            huntReveal(m);
                        }
                    });
                }
                const open = huntDoc.querySelector('.vp-hunt.vp-open');
                if (open && !open.isConnected) huntWin = null;
            }

            function huntTick() {
                if (!huntOn() || !/^\/event\/[^/]/.test(location.pathname)) {
                    if (huntDoc) { try { const dev = huntDoc.querySelector('.vp-hunt-dev'); if (dev) dev.remove(); } catch (e) { } }
                    return;
                }
                for (const fr of document.querySelectorAll('iframe')) {
                    let d = null;
                    try { d = fr.contentDocument; } catch (e) { continue; }
                    if (d && d.querySelector && d.querySelector('.room-stage')) { huntInstall(fr); break; }
                }
            }
            setInterval(huntTick, 1000);
            setInterval(() => { if (huntOpen) { huntGuard(); huntReflow(); } }, 900);
            onDom(huntTick);
            document.addEventListener('vp-loc', huntTick);

            window.addEventListener('message', ev => {
                const m = ev.data;
                if (!m || m.vpHunt !== 'open' || !m.postId) return;
                const go = m.user
                    ? '/@' + encodeURIComponent(m.user) + '/post/' + encodeURIComponent(m.postId)
                    : '/post/' + encodeURIComponent(m.postId);
                const a = document.createElement('a');
                a.href = go; a.click();
            });
        })();
