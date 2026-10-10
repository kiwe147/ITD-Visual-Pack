// Прогон всех тестов параллельно и запись итогов в JSON: node test/_runall.js <папка репо> <снимок.html> <итог.json> [сколько сразу, по умолчанию 10] [тест1,тест2]
// Чтобы сравнить две версии, прогнать обе и сравнить поля code и bad у одноимённых тестов.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const [repo, snap, outFile, conc = '10', only = ''] = process.argv.slice(2);
const skip = new Set(['perf.js', 'dragperf.js', 'scrollperf.js', 'refshots.js', 'intro-video.js']);
let tests = fs.readdirSync(path.join(repo, 'test')).filter(f => f.endsWith('.js') && !f.startsWith('_') && !skip.has(f));
if (only) tests = tests.filter(t => only.split(',').includes(t.replace('.js', '')));
const res = {};
let i = 0, running = 0;
function next() {
  while (running < +conc && i < tests.length) {
    const t = tests[i++];
    running++;
    const t0 = Date.now();
    const p = spawn('node', [path.join('test', t), snap], { cwd: repo, windowsHide: true });
    let out = '';
    p.stdout.on('data', d => out += d);
    p.stderr.on('data', d => out += d);
    const timer = setTimeout(() => p.kill(), 170000);
    p.on('close', code => {
      clearTimeout(timer);
      const lines = out.split(/\r?\n/);
      const ok = lines.filter(l => /^ок\b/.test(l)).length;
      const bad = lines.filter(l => /^(ОШИБКА|FAIL|не ок)/i.test(l)).map(l => l.slice(0, 160));
      res[t] = { code, ok, bad, sec: Math.round((Date.now() - t0) / 1000), tail: out.slice(-200).replace(/\s+/g, ' ') };
      running--;
      fs.writeFileSync(outFile, JSON.stringify(res, null, 1));
      if (i >= tests.length && running === 0) console.log('done', Object.keys(res).length);
      else next();
    });
  }
}
next();
