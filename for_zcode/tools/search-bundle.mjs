/* Bundle 搜证器 —— 在解包的官方 renderer 资产里找结构钩子。
 *
 * 用法（在 for_zcode/tools/ 下，需先跑过 build.js 留下 unpacked/）：
 *   node search-bundle.mjs <pattern> [pattern...]     # 上下文搜索 JS+CSS
 *   node search-bundle.mjs --testids                  # 列出全部 data-testid 字面量
 *   node search-bundle.mjs --tokens                   # 列出样式表全部自定义属性
 *
 * 规矩（见 ../NOTES.md「结构钩子清单」）：给皮肤新增任何宿主钩子之前，
 * 必须先用本工具在 bundle 里搜证 —— 字面量（data-*、命名组类）才可用；
 * 哈希类、猜出来的 testid 一律不许进 zone.css。
 * “看着稳其实死”的钩子只有搜证能分辨（chat-input 就是反例：只有选择器
 * 引用、没有任何元素赋值）。
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'unpacked', 'out', 'renderer', 'assets');
if (!fs.existsSync(DIR)) {
  console.error('缺 ' + DIR + ' —— 先跑 node build.js（解包产物）再搜证。');
  process.exit(1);
}
const cssName = fs.readdirSync(DIR).filter((f) => /^styles-.*\.css$/.test(f))[0];
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.js') || f === cssName);

const args = process.argv.slice(2);
const read = (f) => fs.readFileSync(path.join(DIR, f), 'utf8');

if (args.includes('--testids')) {
  const ids = new Map();
  for (const f of files) {
    for (const m of read(f).matchAll(/"?data-testid"?\s*:\s*`([a-z0-9-]+)`/g)) {
      ids.set(m[1], f);
    }
  }
  console.log([...ids.keys()].sort().map((t) => t + '   (' + ids.get(t) + ')').join('\n'));
  console.log('\n共 ' + ids.size + ' 个字面量 testid');
  process.exit(0);
}

if (args.includes('--tokens')) {
  const css = read(cssName);
  const names = new Set();
  for (const m of css.matchAll(/(--[a-zA-Z][a-zA-Z0-9-]*)\s*:/g)) names.add(m[1]);
  console.log([...names].sort().join('\n'));
  console.log('\n共 ' + names.size + ' 个（与 tests/app-tokens.json 同源）');
  process.exit(0);
}

const patterns = args.filter((a) => !a.startsWith('--'));
if (!patterns.length) {
  console.error('用法: node search-bundle.mjs <pattern...> | --testids | --tokens');
  process.exit(1);
}
for (const pat of patterns) {
  let hits = 0;
  for (const f of files) {
    const src = read(f);
    let i = src.indexOf(pat);
    while (i >= 0 && hits < 6) {
      console.log('--- ' + pat + ' @ ' + f + ' +' + i + ' ---');
      console.log(src.slice(Math.max(0, i - 320), i + 360).replace(/\n/g, ' '));
      i = src.indexOf(pat, i + pat.length);
      hits++;
    }
  }
  if (!hits) console.log('(无命中: ' + pat + ')');
}
