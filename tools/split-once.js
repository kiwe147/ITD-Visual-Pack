// Разовая нарезка ITD-Visual-Pack.user.js на файлы src/*.js (границы — начала верхнеуровневых объявлений).
// Запуск (один раз, из корня репозитория):  node tools/split-once.js
// Потом работаем только в src/, а скрипт собираем:  node build.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const text = fs.readFileSync(path.join(root, 'ITD-Visual-Pack.user.js'), 'utf8');
const lines = text.split('\n');
const PARTS = [
  [1, '00-header'], [50, '01-util-fps'], [102, '02-site-hooks'], [250, '03-tabs-pause'], [265, '04-intro'],
  [956, '10-core-dom'], [1225, '11-icons-brand'], [1492, '12-state-autolike'], [1677, '13-nick-styles'], [2125, '14-background'],
  [2728, '15-look-theme-popup'], [3016, '16-settings'], [3530, '20-calls'], [4056, '21-banner'], [4327, '22-changelog'],
  [4687, '23-api-verification'], [4942, '24-visuals-init'], [6591, '30-messenger-core'], [7054, '31-post-thumbs'],
  [7198, '32-video-player'], [7400, '33-messages-background'], [7527, '34-messages-ui'], [9099, '40-nav-post-design'],
  [9358, '41-sidebar-modal-blur'], [9570, '42-gif-notify-emoji'], [9773, '43-design-nav-tabs'], [10337, '44-glass-overlay'],
  [10510, '45-nav-blob-scene-feed'], [10881, '46-hover-card'], [10973, '50-gallery'], [11742, '51-post-tools'],
  [12009, '52-toasts-links-banner-fx'], [12318, '53-profile-counts-sound'], [12491, '54-rail-menu'], [12871, '55-stats-card'],
  [13127, '56-club'], [13250, '60-games'], [13752, '61-leaderboard'], [14037, '90-boot-tail']
];
const dir = path.join(root, 'src');
fs.mkdirSync(dir, { recursive: true });
const order = [];
PARTS.forEach(([from, name], i) => {
  const to = i + 1 < PARTS.length ? PARTS[i + 1][0] - 1 : lines.length;
  const first = lines[from - 1].trim().slice(0, 70);
  const prev = from > 1 ? lines[from - 2].trim().slice(-30) : '';
  console.log(String(from).padStart(6), name.padEnd(28), '|', first, ' <- ', prev);
  const body = lines.slice(from - 1, to).join('\n') + (i + 1 < PARTS.length ? '\n' : '');
  fs.writeFileSync(path.join(dir, name + '.js'), body.replace(/\r\n/g, '\n'));
  order.push(name + '.js');
});
fs.writeFileSync(path.join(dir, 'order.txt'), order.join('\n') + '\n');
console.log('готово, файлов', order.length);
