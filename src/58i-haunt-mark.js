        (function hauntMark() {
            const MARK_SVG = '<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
                + '<circle cx="50" cy="50" r="38" stroke="currentColor" stroke-width="6"/>'
                + '<path d="M112 8 L86 34" stroke="currentColor" stroke-width="9" stroke-linecap="butt"/>'
                + '<polygon points="78,24 96,30 86,42" fill="currentColor"/>'
                + '</svg>';

            addCss(`
.vp-haunt-mark{position:absolute;width:120px;height:120px;pointer-events:none;z-index:6;color:#ff1f1f;
  filter:drop-shadow(0 2px 10px rgba(255,31,31,.65));transform-origin:50% 50%;}
.vp-haunt-mark svg{animation:vpHMarkPulse 1.6s ease-in-out infinite;transform-origin:42% 42%;}
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
                document.querySelectorAll('[data-haunt]').forEach(host => {
                    const btn = findBtn(host);
                    let mark = host.querySelector(':scope > .vp-haunt-mark');
                    if (!btn) { if (mark) mark.remove(); return; }
                    const taken = host.getAttribute('data-haunt') === 'taken';
                    if (mark) { mark.classList.toggle('vp-haunt-taken', taken); return; }
                    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
                    const ghost = btn.querySelector('.hw-ghost, .hw-rig, .hw-body') || btn;
                    const hr = host.getBoundingClientRect(), br = ghost.getBoundingClientRect();
                    if (!hr.width || !br.width) return;
                    mark = document.createElement('span');
                    mark.className = 'vp-haunt-mark' + (taken ? ' vp-haunt-taken' : '');
                    mark.innerHTML = MARK_SVG;
                    const W = 120;
                    const left = (br.left - hr.left) + br.width / 2 - W * 0.5;
                    const top = (br.top - hr.top) + br.height / 2 - W * 0.5;
                    mark.style.left = Math.round(left) + 'px';
                    mark.style.top = Math.round(top) + 'px';
                    host.appendChild(mark);
                });
                document.querySelectorAll('.vp-haunt-mark').forEach(m => {
                    const host = m.closest('[data-haunt]');
                    if (!host || !findBtn(host)) m.remove();
                });
            }

            onDom(markAll);
            document.addEventListener('vp-loc', markAll);
            setInterval(markAll, 900);
        })();
