        const MEME_ERR = new Map([
            ['Превышено время ожидания', 'Нет.'],
            ['Ошибка сети. Проверьте подключение', 'Бро, проверь интернет'],
            ['Слишком много запросов. Попробуйте позже', 'ПРИТОРМОЗИ'],
            ['Файл слишком большой', 'Файл слишком жирный'],
            ['Видео — только для верифицированных пользователей', 'Сначала купи подписку']
        ]);
        function memeFix(root) {
            if (root.nodeType !== 1 || root.childElementCount > 20) return;
            const spans = root.tagName === 'SPAN' ? [root] : root.querySelectorAll('span');
            for (const s of spans) {
                if (s.childElementCount) continue;
                const m = MEME_ERR.get(s.textContent.trim());
                if (!m) continue;
                const icon = s.previousElementSibling, close = s.nextElementSibling;
                if (icon && icon.querySelector('svg') && close && close.tagName === 'BUTTON') s.textContent = m;
            }
        }
        new MutationObserver(muts => { for (const m of muts) m.addedNodes.forEach(memeFix); }).observe(document.documentElement, { childList: true, subtree: true });
