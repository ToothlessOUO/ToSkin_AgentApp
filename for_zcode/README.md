# ZONE skin for ZCode

黑橙硬件风 [ZCode](https://zcode.z.ai) 桌面端皮肤 —— DSH ZONE 皮肤（`../package/`，client R8）的
ZCode 同款移植：石墨机身、热橙强调、奶油键帽纸、模切贴纸几何、警戒条纹与 LED 设备条，
四套配色（zone / ember / hazard / cobalt）× 两块画布（blacksite / cream）。

ZCode 没有客户端插件槽位，所以载体是 **app.asar 注入**：`tools/build.js` 解包官方
`resources/app.asar`，注入 `zone.css` + `zone-boot.js`，修补 `index.html`，重打包校验；
`apply.cmd`（管理员）安装、`restore.cmd` 一键还原。全程不改任何应用逻辑。

本移植的每一个宿主事实（token 清单、主题模型、结构钩子、级联层级）都是 2026-11-05 从
本机安装包一手实测的 —— 全部证据与推理见 [NOTES.md](NOTES.md)。

## 它改了什么

- **颜色（token 层）** —— ZCode 是 Tailwind v4 + shadcn，整个 UI 从 `<html>` 上的语义变量
  取色。皮肤在 `html[data-zone-skin]` 上重写 `--color-*`：blacksite 是暖石墨 `#2c2927`
  （卡片 `#373330`、浮层 `#423d3a`），cream 是键帽米白 `#e8e1d1`（卡片 `#f5efe4`），
  正文墨水恒为奶油白 / 深墨。侧栏、菜单、弹层、输入、tab、tooltip、toast、终端底盘、
  图表色板、workflow 轨迹、"highspeed" 模式的紫色强调全部随画布与配色联动。
  派生色用 `color-mix()` 运行时算，改色只需动 "palette inputs" 一处。
- **用户消息板** —— 聊天里用户消息的容器（`[data-v4-user-input-bubble]`）由应用自己的
  规则从 `--color-user-message-bubble` 上色；皮肤把这个 token 指到配色强调色本身，
  板内墨水靠局部重定义 `--color-foreground` 系列翻白 —— 没有第二张手挑板色表，
  也没有 `!important` 链。亮板上只有一种白。
- **选中任务行** —— 侧栏任务行的激活态是 `group/task-row` 命名组 + `bg-selected` 工具类；
  皮肤在同一行上局部重定义变量，把它变成实心强调板 + 白墨 + 行辉光。
- **氛围层** —— 固定层锚定到会话框 `[data-workspace-conversation-frame]`（运行时测量）：
  7.5px 侧栏 / 标题栏接缝投影、7px 半调网点、四只配色托架角、以及跟随指针的方形网点
  透镜 —— 亮头精确贴着光标（不做缓动跟随），身后是一块 canvas 尾迹：沿路径采样、
  每帧从样本重绘、每格取最新一次覆盖的亮度，寿命一到就精确归零（不会留下 1/255 残影）。
- **控制台** —— 左下角 `ZONE/0n` 芯片，点开是向上弹出的面板（永远避开输入卡）：
  奶油贴纸（ZONE + 警戒带 + 四色样块）、配色 / 画布 / 动效按钮行、半调开关、
  LED 设备条（脉冲灯 + 警戒带 + 编号 + 图纸号）。快捷键：`Ctrl+Alt+Z` 换配色、
  `Ctrl+Alt+X` 换画布、`Ctrl+Alt+H` 隐藏 / 唤出控制台。
- **光标** —— 24px SVG 自绘指针集（石墨箭头 + 配色描边、奶油描边线稿字形，
  含 text/pointer/forbidden/col/row-resize/zoom），随配色与画布切换；
  `wait`/`help` 等系统态保持原生。
- **滚动条** —— 三个工作区框（侧栏 / 会话 / 侧面板）的 thumb 从
  `--zcode-scrollbar-thumb` 取色，皮肤把它压成机刻线色。

## 两块画布 × 四套配色

| 画布 | 底面 | 文字 |
| --- | --- | --- |
| Blacksite（夜，跟随应用暗色主题） | 石墨 `#2c2927` / 卡片 `#373330` | 奶油 `#f8f3e8` |
| Cream（昼，跟随应用亮色主题） | 键帽米白 `#e8e1d1` / 卡片 `#f5efe4` | 深墨 `#171310` |

| 配色 | 夜 · 强调 | 昼 · 强调 |
| --- | --- | --- |
| Zone orange | `#ff6f1a` | `#e2560d` |
| Ember | `#ff4632` | `#c62c1b` |
| Hazard | `#ffc61a` | `#a8770a` |
| Cobalt | `#4d94ff` | `#1f5fd6` |

机身永远不随配色变化 —— 只有强调色动，和硬件配色一个道理。画布三挡：`auto`（跟随
应用主题，`<html>` 的 `dark` 类翻转时实时跟随）/ `day` / `night`；强制一挡会把应用的
亮暗两种主题都映射到同一块画布（六格矩阵已实测，见 NOTES.md）。

偏好存渲染进程 `localStorage` 的 `zcode-zone-skin:prefs`（多窗口经 storage 事件同步）；
`prefers-reduced-motion` 永远优先于皮肤动效设置。

## 安装（Windows）

0. **中文字体**（每台机器一次，包里不带这 31.8 MB 的 OTF；DSH 版同一前提）：

   ```powershell
   powershell -ExecutionPolicy Bypass -File ..\font-lab\install-fonts.ps1
   ```

   装完**重启 ZCode** —— 渲染进程只在启动时枚举系统字体。

1. 构建（解包 → 注入 → 校验，产物不出 `tools/out/`）：

   ```sh
   cd for_zcode/tools
   npm install        # 或者：~/.zcode/custom-ui/node_modules 里已有 @electron/asar 时可跳过
   node build.js
   ```

2. 应用：双击 `tools/apply.cmd`（管理员），然后**完全退出 ZCode（托盘右键退出）再打开**。
   首次 apply 会把当前官方包备份为 `tools/out/app.asar.zone-bak`。
3. 还原：双击 `tools/restore.cmd`。

ZCode 升级会覆盖 `app.asar`：重跑 `node tests/extract-tokens.mjs` 更新 token 清单、
`node tests/css-coverage.mjs` 复核钩子仍然成立，再 `node build.js` + `apply.cmd`。
构建脚本用正则找 `styles-<hash>.css` 锚点（hash 每版都变），结构大变时会拒绝注入
而不是打坏包。

**皮肤已在安装中时迭代**：构建默认从安装包解包，会因已含注入而拒绝。先
`restore.cmd` 还原官方包再 build + apply；或设 `ZCODE_SOURCE` 指向一份干净官方
asar（注意它需要配套的 `.unpacked` 同级目录）。

## 热更新（免重启迭代）

皮肤文件打进 asar 后每次改动都要重启应用，太慢。皮肤自带**本地热更新**：

```sh
node for_zcode/testbed/serve.mjs     # 跑着别关（默认 127.0.0.1:8472）
```

服务器在跑时，已安装应用里的 boot 每 2 秒轮询一次它：

- **`zone.css` 改了** → 新样式直接换进页面。token 都是活动 CSS 变量，
  改色/改选择器**立即生效，不刷新、不丢状态**；
- **`zone-boot.js` 改了** → 应用窗口自动重载（秒级，不用重启应用）。

服务器没跑 → 轮询立刻失败、零开销，包内皮肤原样运行；一切只走 127.0.0.1，
不出本机。注意：热更新看到的是**磁盘上的实时文件**，满意后仍需重新
build + apply 才算"烤进"安装包（离线也在）。试验台页面同样吃到热更新。

## 离线试验台

`testbed/` 用最少的假结构（主题 token 块 + 皮肤选中的结构钩子）加载**未修改的**
`zone.css` + `zone-boot.js`，配合右上角按钮切换主题 / 配色 / 画布 / 动效：

```sh
node testbed/serve.mjs 8472
# 打开 http://127.0.0.1:8472/testbed/
```

## 检查

```sh
cd for_zcode
node --check zone-boot.js           # boot 语法
node tests/token-contrast.mjs       # 色板完整性 + rgb 三元组对账 + 对比度地板 + 画布矩阵不变量
node tests/css-coverage.mjs         # 大括号；boot 渲染的类都有样式；var() 全部可解析；被改写的 token 都存在
node tests/extract-tokens.mjs --check  # token 清单与已安装样式表一致（升级后先跑不带 --check 的重提取）
```

## 与 DSH 版的差异

| DSH 版 | ZCode 版 | 原因 |
| --- | --- | --- |
| Cordis 插件（host/client 双半、五个槽位） | app.asar 注入（CSS + boot 脚本） | ZCode 无插件 UI 槽位 |
| token 层跑在 `ctx.theme.overrideTokens()` | token 层是纯 CSS（`color-mix()` 运行时推导） | 免构建即可改色 |
| 设置页在 Settings → General | 控制台抽屉（左下芯片，向上弹出）+ 快捷键 | 无设置页注入口 |
| 完成提示音（api-session 投影） | 无 | 渲染进程无等价事件桥；见 NOTES.md |
| 氛围层锚定会话面板（`shell.overlay` 槽位） | 氛围层锚定 `[data-workspace-conversation-frame]`（运行时测量） | 无槽位，但该框是字面量钩子 |
| 选中会话行 = 实心配色板（`_sessionRow` 哈希类） | 选中任务行 = `group/task-row` + 变量局部重定义 | ZCode 是 Tailwind 命名组 |
| 尾迹：canvas 样本重绘（同款算法、同参数） | 同 | 移植自 client R8 |

## 文件

| 文件 | 作用 |
| --- | --- |
| `zone.css` | 皮肤本体：色板输入 → 画布解析 → 派生 token → 语义映射 → 样式层 → 皮肤 chrome |
| `zone-boot.js` | 客户端半：偏好、根属性、光标、氛围层（透镜 + 尾迹）、控制台、探测器 |
| `tools/build.js` | 解包 → 注入 → 修补 index.html → 重打包 → 校验（不安装） |
| `tools/apply.cmd` / `restore.cmd` | 安装（管理员）/ 还原 |
| `tests/extract-tokens.mjs` | 从已安装样式表重提取 token 清单（升级后跑） |
| `tests/token-contrast.mjs` | 色板 + 对比度地板 + rgb 三元组 + 强制画布不变量 |
| `tests/css-coverage.mjs` | 覆盖率 + var() 可解析性 + 被改写 token 的存在性 |
| `testbed/` | 离线视觉验收台 |
| `NOTES.md` | 一手实测档案 —— 改颜色 / 排错前先读 |
| `AGENTS.md` | 接手本目录的 agent 须知 |

## 许可

皮肤代码 MIT（同 DSH 版）。中文字体不在本目录内，遵守其上游许可
（`../font-lab/` 内 Noto 为 SIL OFL 1.1）。
