#!/usr/bin/env node
/**
 * Удаляет все комментарии из ITD-Visual-Pack.user.js, кроме шапки UserScript.
 *
 * Требования:
 *     npm install --no-save acorn
 *
 * Запуск:
 *     node test/_strip_comments.js --dry-run     # только показать
 *     node test/_strip_comments.js               # удалить (с бэкапом)
 *
 * Бэкап: ITD-Visual-Pack.user.js.bak (один раз, не перезаписывается)
 *
 * Защита: перед записью результат проверяется через acorn.
 * Сломанный JS не будет записан.
 */
const fs = require('fs');
const path = require('path');

let acorn;
try { acorn = require('acorn'); }
catch (e) {
    console.error('Не найден acorn. Установи: npm install --no-save acorn');
    process.exit(1);
}

const DRY = process.argv.includes('--dry-run');
const root = path.join(__dirname, '..');
const SRC = path.join(root, 'ITD-Visual-Pack.user.js');
const BAK = SRC + '.bak';

if (!fs.existsSync(SRC)) { console.error('Нет файла ' + SRC); process.exit(1); }

const src = fs.readFileSync(SRC, 'utf8');
const eol = src.includes('\r\n') ? '\r\n' : '\n';
const srcLf = src.replace(/\r\n/g, '\n');

function parse(code) {
    const comments = [];
    acorn.parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'script',
        locations: true,
        allowHashBang: true,
        onComment: (isBlock, text, start, end, startLoc, endLoc) => {
            comments.push({ isBlock, text, start, end, startLine: startLoc.line, endLine: endLoc.line });
        },
    });
    return comments;
}

// --- 1. Все комментарии через acorn ---
let comments;
try {
    comments = parse(srcLf);
} catch (e) {
    console.error('acorn не смог разобрать исходный файл:');
    console.error('  ' + e.message);
    process.exit(2);
}

// --- 2. Индекс начала строк ---
const lineStart = [0];
for (let i = 0; i < srcLf.length; i++) {
    if (srcLf[i] === '\n') lineStart.push(i + 1);
}
const totalLines = srcLf.split('\n').length;

// --- 3. Границы шапки UserScript ---
let metaStartLine = -1, metaEndLine = -1;
for (const c of comments) {
    if (!c.isBlock && /^\s*==UserScript==/.test(c.text)) metaStartLine = c.startLine;
    if (!c.isBlock && /^\s*==\/UserScript==/.test(c.text)) { metaEndLine = c.endLine; break; }
}
const inMeta = (ln) => metaStartLine !== -1 && ln >= metaStartLine && ln <= metaEndLine;

// --- 4. Решаем, что удалять ---
const ops = [];
const skippedMeta = [];

for (const c of comments) {
    if (inMeta(c.startLine)) { skippedMeta.push(c); continue; }

    if (c.isBlock) {
        // заменить блок на один пробел — безопаснее, чем удалять: не склеивает токены
        ops.push({ start: c.start, end: c.end, replaceWith: ' ' });
        continue;
    }

    const ls = srcLf.lastIndexOf('\n', c.start - 1) + 1;
    const beforeOnLine = srcLf.slice(ls, c.start);

    if (beforeOnLine.trim() === '') {
        // целая строка-комментарий — удаляем вместе с \n
        let end = srcLf.indexOf('\n', c.end);
        if (end === -1) end = srcLf.length;
        else end += 1;
        ops.push({ start: ls, end, wholeLine: true, lineNum: c.startLine });
    } else {
        // inline — от c.start до конца строки (без \n)
        let end = srcLf.indexOf('\n', c.end);
        if (end === -1) end = srcLf.length;
        ops.push({ start: c.start, end });
    }
}

// --- 5. Удаляем с конца в начало ---
ops.sort((a, b) => b.start - a.start);
let out = srcLf;
let removedRanges = 0, removedLines = 0;
let prevStart = Infinity;
for (const op of ops) {
    if (op.end > prevStart) {
        console.warn('Пересечение диапазонов: ' + op.start + '-' + op.end);
    }
    out = out.slice(0, op.start) + (op.replaceWith || '') + out.slice(op.end);
    prevStart = op.start;
    removedRanges++;
    if (op.wholeLine) removedLines++;
}

// --- 6. ПРОВЕРКА: acorn должен распарсить результат ---
let after;
try {
    after = parse(out);
} catch (e) {
    console.error('\n⚠️  ПОСЛЕ УДАЛЕНИЯ ФАЙЛ НЕ ПАРСИТСЯ. Ничего не записано.');
    console.error('   ' + e.message);
    console.error('   Файл не тронут. Пришли этот текст Claude.');
    process.exit(3);
}

// --- 7. Отчёт ---
const linesBefore = totalLines;
const linesAfter = out.split('\n').length;

console.log('Файл: ' + SRC);
console.log('EOL: ' + (eol === '\r\n' ? 'CRLF' : 'LF'));
console.log('');
console.log('Комментариев всего (acorn): ' + comments.length);
console.log('  шапка UserScript (НЕ трогаем): ' + skippedMeta.length);
console.log('  к удалению: ' + (comments.length - skippedMeta.length));
console.log('');
console.log('Диапазонов к удалению: ' + removedRanges);
console.log('  из них целых строк (с \\n): ' + removedLines);
console.log('  из них inline и block: ' + (removedRanges - removedLines));
console.log('');
console.log('Строк до: ' + linesBefore);
console.log('Строк после: ' + linesAfter);
console.log('Разница: ' + (linesBefore - linesAfter) + ' строк');
console.log('');
console.log('Проверка после удаления: acorn распарсил OK.');
console.log('Осталось комментариев (только шапка): ' + after.length);

if (DRY) {
    console.log('\n[dry-run] Ничего не изменено. Запусти без --dry-run, чтобы применить.');
    process.exit(0);
}

// --- 8. Бэкап и запись ---
if (!fs.existsSync(BAK)) {
    fs.copyFileSync(SRC, BAK);
    console.log('\nБэкап: ' + BAK);
} else {
    console.log('\nБэкап уже есть: ' + BAK + ' (не перезаписываю)');
}

const final = eol === '\r\n' ? out.replace(/\n/g, '\r\n') : out;
fs.writeFileSync(SRC, final, 'utf8');
console.log('Записано: ' + SRC);
console.log('');
console.log('Дальше:');
console.log('  node test/smoke.js ITD/itd-main.html');
console.log('Откат:');
console.log('  copy /Y ITD-Visual-Pack.user.js.bak ITD-Visual-Pack.user.js');