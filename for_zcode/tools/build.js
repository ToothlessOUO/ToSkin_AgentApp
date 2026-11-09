/* ZONE skin for ZCode — build script (Z1).
 *
 * Unpack the official app.asar → inject zone.css + zone-boot.js → patch
 * out/renderer/index.html → repack (native binaries stay unpacked) → verify.
 * The artifact lands in tools/out/app.asar.zone and is NOT installed;
 * installation is apply.cmd (admin), rollback is restore.cmd.
 *
 * Everything here works off facts verified against the installed build —
 * see ../NOTES.md. The two load-bearing ones:
 *
 *   - the app stylesheet link is `<link rel="stylesheet" crossorigin
 *     href="./assets/styles-<hash>.css">`, last <link> before </head>; the
 *     hash changes every release, so it must be regex-matched, never copied;
 *   - @electron/asar 4.x is ESM-only (dynamic import, never require()) and
 *     its extractFile wants OS-separator paths without a leading slash.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const HERE = __dirname;
const SKIN = path.dirname(HERE);
const ZONE_CSS = path.join(SKIN, 'zone.css');
const ZONE_BOOT = path.join(SKIN, 'zone-boot.js');
const WORK = path.join(HERE, 'unpacked');
const OUT_DIR = path.join(HERE, 'out');
const OUT = path.join(OUT_DIR, 'app.asar.zone');
/* Injected file names: identical to the sources, unique in the assets dir. */
const CSS_NAME = 'zone.css';
const BOOT_NAME = 'zone-boot.js';

function die(message) { console.error('[FAIL] ' + message); process.exit(1); }
function log(step, message) { console.log('[' + step + '] ' + message); }

/** @electron/asar 4.x is ESM-only. Resolve it from this directory's
 *  node_modules first; ~/.zcode/custom-ui/node_modules is a documented
 *  fallback for machines that already have it installed there. */
function loadAsar() {
  const candidates = [
    path.join(HERE, 'node_modules', '@electron', 'asar'),
    path.join(os.homedir(), '.zcode', 'custom-ui', 'node_modules', '@electron', 'asar'),
  ];
  for (const dir of candidates) {
    const entry = path.join(dir, 'lib', 'asar.js');
    if (fs.existsSync(entry)) {
      return import('file://' + entry.split(path.sep).join('/'));
    }
  }
  return Promise.reject(new Error(
    '未找到 @electron/asar —— 先在 tools/ 下运行 npm install，'
    + '或确认 ~/.zcode/custom-ui/node_modules 存在。'));
}

function findResourcesDir() {
  const override = process.env.ZCODE_RESOURCES;
  if (override) return override;
  const def = 'C:/Program Files/ZCode/resources';
  if (fs.existsSync(path.join(def, 'app.asar'))) return def;
  die('未找到 ZCode 安装目录（' + def + '）。可用环境变量 ZCODE_RESOURCES 指定 resources 目录。');
}

/** The source archive to patch. Default: the installed resources/app.asar.
 *  When the skin is already applied, the installed package carries the
 *  injection and the guard refuses — iterate from the clean official backup
 *  instead:  set ZCODE_SOURCE=tools/out/app.asar.zone-bak  (or any official
 *  asar) and build from that. */
function findSource(resources) {
  const override = process.env.ZCODE_SOURCE;
  if (override) {
    if (!fs.existsSync(override)) die('ZCODE_SOURCE 指向的文件不存在: ' + override);
    return override;
  }
  return path.join(resources, 'app.asar');
}

(async () => {
  const asar = await loadAsar();
  const RESOURCES = findResourcesDir();
  const ORIG = findSource(RESOURCES);
  log('0/6', '资源目录: ' + RESOURCES + '\n     源包: ' + ORIG);

  const css = fs.readFileSync(ZONE_CSS, 'utf8');
  const boot = fs.readFileSync(ZONE_BOOT, 'utf8');
  if (!css.includes('html[data-zone-skin]')) die('zone.css 内容异常（缺少 token 层）');
  if (!boot.includes('__zoneSkinBooted')) die('zone-boot.js 内容异常（缺少注入守卫）');

  /* ---- 1. full unpack ---- */
  log('1/6', '解包 app.asar ...');
  fs.rmSync(WORK, { recursive: true, force: true });
  await asar.extractAll(ORIG, WORK);

  /* ---- 2. inject the skin files ---- */
  log('2/6', '注入 ' + CSS_NAME + ' + ' + BOOT_NAME + ' ...');
  const assets = path.join(WORK, 'out', 'renderer', 'assets');
  if (!fs.existsSync(assets)) die('解包结果缺 out/renderer/assets —— 应用结构变了？');
  for (const name of [CSS_NAME, BOOT_NAME]) {
    if (fs.existsSync(path.join(assets, name))) {
      die('assets/' + name + ' 已存在 —— 目标包里已有同名文件，拒绝覆盖。');
    }
  }
  fs.writeFileSync(path.join(assets, CSS_NAME), css);
  fs.writeFileSync(path.join(assets, BOOT_NAME), boot);

  /* ---- 3. patch index.html ---- */
  log('3/6', '修补 index.html ...');
  const idxPath = path.join(WORK, 'out', 'renderer', 'index.html');
  let idx = fs.readFileSync(idxPath, 'utf8');
  if (idx.includes(CSS_NAME) || idx.includes(BOOT_NAME) || /data-zone-skin/.test(idx)) {
    die('index.html 已包含 ZONE 注入 —— 目标 app.asar 似乎已打过皮肤补丁。\n'
      + '     先用 restore.cmd 还原官方包（或重装 ZCode）再构建。');
  }
  /* The app stylesheet is the last <link rel="stylesheet"> before </head>;
     its hash changes every release, so match it by pattern. The skin's link
     goes right after it — same specificity wins need later source order. */
  const linkRe = /<link rel="stylesheet"[^>]*href="\.\/assets\/styles-[A-Za-z0-9_-]+\.css">/;
  const anchor = idx.match(linkRe);
  if (!anchor) die('未找到应用样式表 <link ... styles-*.css> 锚点 —— 应用更新改变了结构，先核对 NOTES.md。');
  const inject = anchor[0]
    + '\n    <link rel="stylesheet" crossorigin href="./assets/' + CSS_NAME + '">'
    + '\n    <script src="./assets/' + BOOT_NAME + '" defer></script>';
  idx = idx.replace(linkRe, inject);
  /* Default attributes on <html>: redundant insurance so the token layer is
     live even if the boot script never runs (default zone / auto / full / on).
     zone-boot.js takes these over once it boots. */
  const htmlTag = idx.match(/<html([^>]*)>/);
  if (!htmlTag) die('未找到 <html> 标签。');
  idx = idx.replace(/<html([^>]*)>/,
    '<html$1 data-zone-skin="" data-zone-colorway="zone" data-zone-canvas="auto"'
    + ' data-zone-motion="full" data-zone-dots="on">');
  fs.writeFileSync(idxPath, idx);

  /* ---- 4. repack ---- */
  log('4/6', '重打包 ...');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.rmSync(OUT + '.unpacked', { recursive: true, force: true });
  await asar.createPackageWithOptions(WORK, OUT, { unpack: '*.{node,dll,exe}' });

  /* ---- 5. verify ---- */
  log('5/6', '校验 ...');
  const list = (archive) => asar.listPackage(archive)
    .map((s) => s.split('\\').join('/')).sort();
  const origList = await list(ORIG);
  const newList = await list(OUT);
  const added = newList.filter((x) => !origList.includes(x));
  const removed = origList.filter((x) => !newList.includes(x));
  log('  ', '新增: ' + JSON.stringify(added) + '  删除: ' + JSON.stringify(removed));
  if (removed.length) die('重打包丢失了原有文件！');
  const expectedAdd = new Set([
    '/out/renderer/assets/' + CSS_NAME,
    '/out/renderer/assets/' + BOOT_NAME,
  ]);
  if (added.length !== expectedAdd.size || added.some((x) => !expectedAdd.has(x))) {
    die('新增文件不符合预期: ' + JSON.stringify(added));
  }
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name))
      : [path.join(dir, entry.name).split(path.sep).join('/')]);
  const origUnp = walk(ORIG + '.unpacked').map((s) => s.split('app.asar.unpacked/')[1]).sort();
  const newUnp = walk(OUT + '.unpacked').map((s) => s.split('app.asar.zone.unpacked/')[1]).sort();
  if (JSON.stringify(origUnp) !== JSON.stringify(newUnp)) {
    die('unpacked 文件列表不一致!\n  原: ' + JSON.stringify(origUnp) + '\n  新: ' + JSON.stringify(newUnp));
  }
  log('  ', 'unpacked 一致 (' + newUnp.length + ' 个原生文件)');
  const patchedIdx = (await asar.extractFile(OUT, 'out\\renderer\\index.html')).toString('utf8');
  const marks = [CSS_NAME, BOOT_NAME, 'data-zone-skin'].filter((m) => !patchedIdx.includes(m));
  if (marks.length) die('打包后的 index.html 缺注入标记: ' + JSON.stringify(marks));

  /* ---- 6. done ---- */
  const origMB = (fs.statSync(ORIG).size / 1048576).toFixed(1);
  const outMB = (fs.statSync(OUT).size / 1048576).toFixed(1);
  log('6/6', '构建完成 → ' + OUT + ' (' + outMB + ' MB，原包 ' + origMB + ' MB)');
  console.log('注：asar 4.x 重打包默认按内容去重，包变小是正常的；上面的文件列表已逐一对账。');
  console.log('未安装。确认无误后运行 apply.cmd（需要管理员权限写入 Program Files）。');
})().catch((error) => die(error && error.stack ? error.stack : String(error)));
