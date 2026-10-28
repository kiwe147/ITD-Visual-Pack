        (function hauntMark() {
            const MARK_SVG = '<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
                + '<circle cx="38" cy="68" r="22" stroke="currentColor" stroke-width="6"/>'
                + '<path d="M88 18 L70.7 34.3" stroke="currentColor" stroke-width="7"/>'
                + '<polygon points="58,47 63.6,27.2 77.8,41.4" fill="currentColor"/>'
                + '</svg>';

            addCss(`
.vp-haunt-mark{position:absolute;width:64px;height:64px;pointer-events:none;z-index:6;color:#ff1f1f;
  filter:drop-shadow(0 2px 8px rgba(255,31,31,.6));animation:vpHMarkPulse 1.6s ease-in-out infinite;transform-origin:59% 47%;}
.vp-haunt-mark svg{width:100%;height:100%;display:block;}
.vp-haunt-mark.vp-haunt-taken{color:#b25bff;filter:drop-shadow(0 2px 8px rgba(178,91,255,.65));}
.vp-haunt-mark.vp-haunt-taken svg polygon,.vp-haunt-mark.vp-haunt-taken svg path,.vp-haunt-mark.vp-haunt-taken svg circle{stroke:currentColor;}
.vp-haunt-mark.vp-haunt-taken svg polygon{fill:currentColor;}
@keyframes vpHMarkPulse{0%,100%{opacity:1;scale:1;}50%{opacity:.8;scale:1.1;}}
@media (prefers-reduced-motion:reduce){.vp-haunt-mark{animation:none;}}
`);

            function findBtn(art) {
                return art.querySelector('button[aria-label*="призрак" i],button[aria-label*="изгнать" i],button[aria-label*="освобод" i],button[aria-label*="фонар" i],.hw-peek,[data-paws] button,[data-tool] button');
            }

            function markAll() {
                document.querySelectorAll('article[data-haunt]').forEach(art => {
                    const btn = findBtn(art);
                    let mark = art.querySelector(':scope > .vp-haunt-mark');
                    if (!btn) { if (mark) mark.remove(); return; }
                    const taken = art.getAttribute('data-haunt') === 'taken';
                    if (mark) { mark.classList.toggle('vp-haunt-taken', taken); return; }
                    if (getComputedStyle(art).position === 'static') art.style.position = 'relative';
                    const ar = art.getBoundingClientRect(), br = btn.getBoundingClientRect();
                    if (!ar.width || !br.width) return;
                    mark = document.createElement('span');
                    mark.className = 'vp-haunt-mark' + (taken ? ' vp-haunt-taken' : '');
                    mark.innerHTML = MARK_SVG;
                    const W = 64;
                    const left = (br.left - ar.left) + br.width / 2 - W * 0.58;
                    const top = (br.top - ar.top) + br.height / 2 - W * 0.47;
                    mark.style.left = Math.round(left) + 'px';
                    mark.style.top = Math.round(top) + 'px';
                    art.appendChild(mark);
                });
                document.querySelectorAll('.vp-haunt-mark').forEach(m => {
                    const art = m.closest('article[data-haunt]');
                    if (!art || !findBtn(art)) m.remove();
                });
            }

            onDom(markAll);
            document.addEventListener('vp-loc', markAll);
            setInterval(markAll, 900);
        })();
