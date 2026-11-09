/* Extract the custom-property inventory from the INSTALLED ZCode stylesheet.
 *
 * ZCode upgrades replace assets/styles-<hash>.css wholesale; every --color-*
 * (and friends) the skin overrides must still exist there, or the override
 * silently restyles nothing (an unknown custom property is not an error).
 * css-coverage.mjs checks that; this script refreshes its source of truth:
 *
 *   node tests/extract-tokens.mjs            → writes tests/app-tokens.json
 *   node tests/extract-tokens.mjs --check    → exit 1 if the list changed
 *
 * The stylesheet is read straight out of resources/app.asar — no unpacking.
 * The asar library resolution mirrors tools/build.js (local node_modules,
 * then ~/.zcode/custom-ui/node_modules; ESM-only, dynamic import).
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'app-tokens.json');

async function loadAsar() {
  const candidates = [
    path.join(HERE, '..', 'tools', 'node_modules', '@electron', 'asar'),
    path.join(os.homedir(), '.zcode', 'custom-ui', 'node_modules', '@electron', 'asar'),
  ];
  for (const dir of candidates) {
    const entry = path.join(dir, 'lib', 'asar.js');
    if (fs.existsSync(entry)) return import('file://' + entry.split(path.sep).join('/'));
  }
  throw new Error('未找到 @electron/asar —— 先在 tools/ 下 npm install。');
}

function findResourcesDir() {
  if (process.env.ZCODE_RESOURCES) return process.env.ZCODE_RESOURCES;
  const def = 'C:/Program Files/ZCode/resources';
  if (fs.existsSync(path.join(def, 'app.asar'))) return def;
  throw new Error('未找到 ZCode 安装目录（' + def + '）。可用 ZCODE_RESOURCES 指定。');
}

const asar = await loadAsar();
const resources = findResourcesDir();
const list = (await asar.listPackage(path.join(resources, 'app.asar')))
  .map((s) => s.split('\\').join('/'));
const cssName = list.filter((n) => /^\/out\/renderer\/assets\/styles-[A-Za-z0-9_-]+\.css$/.exec(n))[0];
if (!cssName) throw new Error('包里没有 styles-*.css —— 应用结构变了。');
const css = (await asar.extractFile(path.join(resources, 'app.asar'), cssName.slice(1).split('/').join('\\'))).toString('utf8');

/* Every custom property the stylesheet defines, anywhere (theme blocks,
   utilities, @property registrations excluded — they declare syntax, not
   paint, but the names coincide anyway so include them harmlessly). */
const names = new Set();
for (const m of css.matchAll(/(--[a-zA-Z][a-zA-Z0-9-]*)\s*:/g)) names.add(m[1]);
const sorted = [...names].sort();

const check = process.argv.includes('--check');
if (check) {
  const previous = fs.readFileSync(OUT, 'utf8');
  if (previous.trim() !== JSON.stringify(sorted, null, 2)) {
    console.error('[FAIL] app-tokens.json 与已安装样式表不一致 —— 应用升级过。');
    console.error('       重跑 node tests/extract-tokens.mjs 更新清单，再跑 node tests/css-coverage.mjs 复核。');
    process.exit(1);
  }
  console.log('ok  app-tokens.json matches ' + cssName + ' (' + sorted.length + ' tokens)');
} else {
  fs.writeFileSync(OUT, JSON.stringify(sorted, null, 2) + '\n');
  console.log('wrote ' + OUT + ' — ' + sorted.length + ' tokens from ' + cssName);
}
