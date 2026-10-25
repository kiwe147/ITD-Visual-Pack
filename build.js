// Сборка ITD-Visual-Pack.user.js из src/*.js (порядок — src/order.txt).
// Правим только src/, потом:  node build.js        — пересобрать скрипт
//                              node build.js --check — проверить, что скрипт совпадает со сборкой (для тестов и перед пушем)
// Tampermonkey по-прежнему ставит один файл ITD-Visual-Pack.user.js из корня.
const fs = require('fs');
const path = require('path');
const root = __dirname;
const out = process.env.OUT ? path.resolve(process.env.OUT) : path.join(root, 'ITD-Visual-Pack.user.js');
const order = fs.readFileSync(path.join(root, 'src', 'order.txt'), 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const built = order.map(f => fs.readFileSync(path.join(root, 'src', f), 'utf8').replace(/\r\n/g, '\n')).join('');
const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
if (process.argv.includes('--check')) {
  const same = cur.replace(/\r\n/g, '\n') === built;
  console.log(same ? 'сборка совпадает со скриптом' : 'ОШИБКА: скрипт не совпадает со сборкой — запусти node build.js');
  process.exit(same ? 0 : 1);
}
const eol = cur.includes('\r\n') ? '\r\n' : '\n';
fs.writeFileSync(out, eol === '\n' ? built : built.replace(/\n/g, '\r\n'));
console.log('собрано: ' + order.length + ' файлов, ' + built.length + ' символов');
