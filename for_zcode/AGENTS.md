# AGENTS.md — 接手 for_zcode 前必读

给冷启动接手这个目录的 agent（或人）。排错与实测证据在
[NOTES.md](NOTES.md)（一手档案，改色前先读），使用说明在 [README.md](README.md)。

## 这是什么

DSH ZONE 皮肤（`../package/`，Cordis 客户端插件，client R8）的 **ZCode 同款移植**。
ZCode 是 Electron 应用，没有插件 UI 槽位，所以载体是 app.asar 注入，三层：

1. **token 层（zone.css 前半）** —— 在 `html[data-zone-skin]` 上重写 ZCode 的
   Tailwind v4 语义变量（`--color-*`），派生色 `color-mix()` 运行时算，
   色板输入集中在 "palette inputs" 块；
2. **样式层（zone.css 后半）** —— 选区钉子、用户消息板、选中任务行、输入卡背光、
   代码块规则、光标规则、`.zone-*` 皮肤 DOM 的样式；
3. **boot 层（zone-boot.js）** —— 偏好、根属性、光标变量、氛围层
   （接缝 / 半调 / 透镜亮头 / canvas 尾迹 / 托架）、控制台、探针。
   DOM 全部挂在 body 下、`#root` 之外，React 不会碰。

`tools/build.js` 把 1+2+3 注入 `resources/app.asar`。一切视觉都出在这三层；
颜色"不生效"时先判断该归哪层管。

## 环境事实（2026-11-05，Windows，实测）

| 事实 | 值 |
| --- | --- |
| 安装目录 | `C:\Program Files\ZCode\resources\app.asar`（`ZCODE_RESOURCES` 可覆盖） |
| 渲染层入口 | `out/renderer/index.html`；样式表 `assets/styles-<hash>.css`（**hash 每版变，必须正则锚**） |
| 主题模型 | `localStorage['zcode-theme']`：`system\|dark\|light\|zai-dark\|zai-light`，默认 `zai-dark`；`<html>` 类 `dark` + `theme-zai-*` |
| 级联 | 语义 token 无层、四块全 (0,1,0)；皮肤 `html[data-zone-skin]` (0,1,1) 无层注入即可全赢 |
| asar 库 | `@electron/asar` 4.3.x，ESM-only；本目录 `tools/npm install`，回退 `~/.zcode/custom-ui/node_modules` |
| 重打包 | 默认去重（包小 30+ MiB 正常）；`unpack: '*.{node,dll,exe}'` 保持原生外置 |
| 中文字体 | 机器级安装（`../font-lab/install-fonts.ps1`），装完重启 ZCode |
| 生效方式 | apply 后**完全退出**（托盘右键）再启动；asar 不热加载 |

## 校验环

```sh
node --check zone-boot.js
node tests/token-contrast.mjs     # 色板/三元组/对比度地板/强制昼不变量
node tests/css-coverage.mjs       # 覆盖率 + var() 可解析 + 被改写 token 存在性
node tests/extract-tokens.mjs --check  # token 清单与已安装样式表一致
cd tools && node build.js         # 产出 tools/out/app.asar.zone（不安装）
node ../testbed/serve.mjs 8472    # 离线验收（不碰应用就能看）
```

测试全绿 + 六格画布矩阵 + 试验台看过（夜/昼 × 两配色 + 尾迹数值验证）再交付。
`apply.cmd`（写 Program Files）永远留给用户自己双击。

## 不变量 —— 破坏任何一条皮肤都会静默变丑

1. **亮板墨水是字面量白**。`--zone-brand-on: #ffffff` 与用户板 / 选中行上的
   `--color-foreground: #ffffff` 不许改成推导值；夜 zone 橙 2.78:1、夜 hazard 黄
   1.57:1 是 owner 接受过的取舍（DSH 版同样），token-contrast 作为 note 打出来
   而不是 FAIL。
2. **用户板 = 配色本身**，走 `--color-user-message-bubble` → `var(--zone-brand)`，
   没有第二张板色表；板内上墨靠局部重定义 `--color-foreground` 系，不靠
   `!important` 链。板内选区反白必须 `!important`（压全局强调色选区钉子）。
3. **画布四规则的源顺序 + 强制昼成对重映射**：day 默认 → `.dark`/强制夜 → 强制昼
   （底盘 + 全部夜侧语义值）。暗应用 + 强制昼曾经裂皮，矩阵不变量守着，别删。
4. **阴影只用 `rgb(var(--*-rgb) / α)`**，`color-mix()` 不进 box-shadow 列表。
   8 组配色三元组 + 2 组 ink-rgb 由 token-contrast 逐组对账。
5. **被改写的 `--color-*` 必须在 `tests/app-tokens.json` 里**（从已安装样式表提取）。
   应用升级后先 `extract-tokens.mjs` 重提、`css-coverage.mjs` 复核。唯一白名单：
   `--color-ring`（应用引用未定义，皮肤有意补上）。
6. **结构钩子只用字面量**（`data-*` 属性、`data-slot`、shadcn 命名类如
   `group/task-row`），哈希前缀和 `class*=` 子串一个都不许进本目录。
   `data-testid="chat-input"` 在当前版本**没有任何元素赋值**（只是焦点还原选择器），
   不许用。新增钩子前先在解包 bundle 里搜证。
7. **boot 的 DOM 全部挂在 `#root` 外**、氛围层 `pointer-events:none`、
   z-index 低于 2147483647（启动 splash）。控制台面板向上弹出且底边钳在
   `--zone-composer-top` 之上，不许盖住输入卡的首字符。
8. **尾迹从样本重绘**，不许改成"位图自衰减"—— 8-bit alpha 到不了零，
   会留 1/255 残影。参数（7/100/16/1100/.085/32）与 DSH client R8 一致。

## 当前状态（交接下去）

- 已验证：`node --check` + token-contrast + css-coverage 全绿；
  试验台夜/昼 × zone/cobalt 目检通过（底盘、接缝、半调、托架、板、行、
  代码块、背光、控制台全项）；尾迹数值验收（新鲜 14,890 着色像素、
  峰值 α 7.5%、1400ms 后精确归零）；六格画布矩阵 6/6；快捷键；
  面板避让输入卡。
- 未做：真机 apply（构建脚本就绪，`tools/apply.cmd` 留给用户）；
  完成提示音 / toast 染色未移植（原因见 NOTES.md）。
- 与旧毛玻璃皮肤（`~/.zcode/custom-ui/`）共用注入机制但互不知晓：若它还在应用中，
  先用它的 restore 还原官方包再 apply 本皮肤（备份名不同，不要混用）。

## 文件图

| 文件 | 角色 |
| --- | --- |
| `zone.css` | token 层 + 样式层（改色从 "palette inputs" 块进） |
| `zone-boot.js` | 客户端半：偏好/属性/光标/氛围/控制台/探针 |
| `tools/build.js` | 解包 → 注入 → 修补 → 重打包 → 校验（不安装） |
| `tools/apply.cmd` / `restore.cmd` | 用户手动的安装 / 还原（管理员） |
| `tests/extract-tokens.mjs` | 升级后重提 token 清单（--check 校一致性） |
| `tests/token-contrast.mjs` | 色板 + 三元组 + 对比度地板 + 强制昼不变量 |
| `tests/css-coverage.mjs` | 结构/类覆盖/var() 可解析/token 存在性 |
| `testbed/` | 离线验收台（serve.mjs + 假结构页） |
| `README.md` / `NOTES.md` | 使用说明 / 一手实测档案 |
