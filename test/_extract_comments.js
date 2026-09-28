#!/usr/bin/env node
/**
 * Извлекает все комментарии из ITD-Visual-Pack.user.js через acorn.
 *
 * Установка acorn (один раз):
 *     npm install --no-save acorn
 *
 * Запуск:
 *     node test/_extract_comments.js
 *
 * Результат:
 *     COMMENTS.md
 */
const fs = require('fs');
const path = require('path');

let acorn;
try { acorn = require('acorn'); }
catch (e) {
  console.error('Не найден acorn.');
  console.error('Установи один раз в папке ITD-repo:');
  console.error('    npm install --no-save acorn');
  process.exit(1);
}

const root = path.join(__dirname, '..');
const SRC = path.join(root, 'ITD-Visual-Pack.user.js');
const OUT = path.join(root, 'COMMENTS.md');

if (!fs.existsSync(SRC)) {
  console.error('Не найден ' + SRC);
  process.exit(1);
}

const src = fs.readFileSync(SRC, 'utf8');
const lines = src.split('\n');

// --- 1. Собираем все комментарии через acorn ---
const raw = [];
try {
  acorn.parse(src, {
    ecmaVersion: 'latest',
    sourceType: 'script',
    locations: true,
    allowHashBang: true,
    onComment: (isBlock, text, start, end, startLoc, endLoc) => {
      raw.push({
        isBlock,
        text,
        start,
        end,
        startLine: startLoc.line,
        endLine: endLoc.line,
      });
    },
  });
} catch (e) {
  console.error('acorn не смог разобрать файл:');
  console.error('  ' + e.message);
  process.exit(2);
}

// --- 2. Размечаем тип каждого комментария ---
for (const c of raw) {
  if (c.isBlock) {
    c.kind = 'block';
  } else {
    const lineStart = src.lastIndexOf('\n', c.start - 1) + 1;
    const before = src.slice(lineStart, c.start);
    c.kind = before.trim() === '' ? 'line' : 'inline';
  }
}

// --- 3. Группируем подряд идущие //-комментарии на своих строках ---
const grouped = [];
let i = 0;
while (i < raw.length) {
  const c = raw[i];
  if (c.kind !== 'line') {
    grouped.push({
      kind: c.kind,
      startLine: c.startLine,
      endLine: c.endLine,
      text: (c.isBlock ? '/*' : '//') + c.text + (c.isBlock ? ' */' : ''),
    });
    i++;
    continue;
  }
  let j = i + 1;
  let lastLine = c.endLine;
  let lastEnd = c.end;
  while (j < raw.length) {
    const n = raw[j];
    if (n.kind !== 'line') break;
    if (n.startLine !== lastLine + 1) break;
    if (src.slice(lastEnd, n.start).trim() !== '') break;
    lastLine = n.endLine;
    lastEnd = n.end;
    j++;
  }
  const texts = [];
  for (let k = i; k < j; k++) texts.push('//' + raw[k].text);
  grouped.push({
    kind: 'line',
    startLine: c.startLine,
    endLine: lastLine,
    text: texts.join('\n'),
  });
  i = j;
}

// --- 4. Помечаем шапку UserScript как meta ---
for (const g of grouped) {
  if (g.kind === 'line' && /^\/\/\s*==UserScript==/.test(g.text)) {
    g.kind = 'meta';
    break;
  }
}

// --- 5. Индекс объявлений ---
const DECL_PATTERNS = [
  /^\s*(?:async\s+)?function\s+[\w$]+/,
  /^\s*const\s+[\w$]+\s*=/,
  /^\s*let\s+[\w$]+\s*=/,
  /^\s*var\s+[\w$]+\s*=/,
  /^\s*class\s+[\w$]+/,
  /^\s*onDom\s*\(/,
  /^\s*[\w$]+\s*:\s*(?:async\s+)?function/,
  /^\s*[\w$]+\s*:\s*\([^)]*\)\s*=>/,
  /^\s*[\w$]+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/,
];
const decls = [];
for (let n = 0; n < lines.length; n++) {
  if (DECL_PATTERNS.some(p => p.test(lines[n]))) {
    decls.push({ line: n + 1, text: lines[n].trim() });
  }
}
function declAfter(n) { for (const d of decls) if (d.line > n) return d; return null; }
function declBefore(n) { let b = null; for (const d of decls) if (d.line < n) b = d; return b; }

// --- 6. Формируем отчёт ---
const out = [];
out.push('# Комментарии в ITD-Visual-Pack.user.js');
out.push('');
out.push('- Строк в файле: **' + lines.length + '**');
out.push('- Комментариев: **' + grouped.length + '**');
out.push('');
out.push('| # | Строки | Тип | Комментарий | Относится к |');
out.push('|---|--------|-----|-------------|-------------|');

grouped.forEach((g, idx) => {
  const linesStr = g.startLine === g.endLine
    ? String(g.startLine)
    : g.startLine + '-' + g.endLine;
  let ref;
  if (g.kind === 'meta') {
    ref = '⚠️ ШАПКА USERSCRIPT — не удалять';
  } else if (g.kind === 'inline') {
    ref = 'строка кода ' + g.startLine;
  } else {
    const after = declAfter(g.endLine);
    const before = declBefore(g.startLine);
    if (after && after.line - g.endLine <= 5) {
      ref = 'перед `' + after.text.slice(0, 80) + '` (стр. ' + after.line + ')';
    } else if (before) {
      ref = 'внутри `' + before.text.slice(0, 80) + '` (стр. ' + before.line + ')';
    } else {
      ref = '—';
    }
  }
  const text = g.text.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
  out.push('| ' + (idx + 1) + ' | ' + linesStr + ' | ' + g.kind + ' | `' + text + '` | ' + ref + ' |');
});

fs.writeFileSync(OUT, out.join('\n'), 'utf8');

// --- 7. Статистика ---
const kinds = {};
for (const g of grouped) kinds[g.kind] = (kinds[g.kind] || 0) + 1;
console.log('OK: ' + OUT);
console.log('  строк: ' + lines.length);
console.log('  всего комментариев: ' + grouped.length);
for (const k of ['line', 'inline', 'block', 'meta']) {
  console.log('    ' + k + ': ' + (kinds[k] || 0));
}