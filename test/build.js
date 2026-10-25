// Скрипт в корне должен совпадать со сборкой из src/ (иначе забыли node build.js).
// Запуск:  node test/build.js
const { spawnSync } = require('child_process');
const r = spawnSync(process.execPath, [require('path').join(__dirname, '..', 'build.js'), '--check'], { encoding: 'utf8' });
process.stdout.write(r.stdout);
process.exit(r.status);
