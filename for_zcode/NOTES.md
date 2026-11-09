# NOTES — ZCode 版皮肤的一手实测档案

本移植不依赖任何二手结论：以下每条事实都是 2026-11-05 直接从本机安装的
`C:\Program Files\ZCode\resources\app.asar`（renderer 样式表 `styles-NK68EN_n.css`、
入口 `index-CbMOaeRT.js`、主 bundle `styles-Dv5E6Odo.js`）解包验证的。
改颜色之前、排错之前、升级之后，先过这份；DSH 版
[../package/NOTES.md](../package/NOTES.md) 里 `var()` 静默失效、`!important` 陷阱、
探针优先三条在这里同样成立。

## 主题模型（入口 bundle 逐字验证）

```js
let e = localStorage.getItem('zcode-theme') || 'zai-dark';
// system → matchMedia 跟随；dark|zai-dark → dark；light|zai-light → light
// n = zai 主题类：zai-dark | zai-light
t === 'dark' && document.documentElement.classList.add('dark');
document.documentElement.classList.toggle('theme-zai-light', n === 'zai-light');
document.documentElement.classList.toggle('theme-zai-dark', n === 'zai-dark');
```

- `localStorage['zcode-theme']`：`system|dark|light|zai-dark|zai-light`，默认 `zai-dark`；
- `<html>` 类：`dark` + `theme-zai-dark` / `theme-zai-light`。皮肤 watch 类表即可实时跟随。

## 级联架构（为什么 token 层能赢）

已安装样式表的分块（字节偏移实测）：

| 块 | 位置 | 特异性 | 层 |
| --- | --- | --- | --- |
| `:root,:host`（Tailwind 调色板 + `--font-sans/mono`） | @6.1k | (0,1,0) | `@layer theme`（18 KB） |
| `@layer utilities`（工具类） | @28.7k | 各自 | `@layer utilities`（325 KB） |
| `:root{…}`（highspeed 默认值） | @394.6k | (0,1,0) | 无层 |
| `.dark,.theme-zai-dark{…}`（highspeed 暗色） | @395.2k | (0,1,0) | 无层 |
| `.theme-zai-light{…}`（亮色语义） | @429.6k | (0,1,0) | 无层 |
| `.theme-zai-dark{…}`（暗色语义，最全） | @437.3k | (0,1,0) | 无层 |

要点：

1. **语义 token 全部无层**，四块全 (0,1,0)，应用内靠源顺序决胜（`.theme-zai-dark` 最后）。
2. 皮肤注入在样式表**之后**且无层：`html[data-zone-skin]` (0,1,1) 靠特异性压过全部四块；
   画布规则 (0,2,1) 压过应用的任何组合。**不需要对应用用 `!important`。**
3. `@layer utilities` 里的 `bg-*`/`text-*` 只是 `var(--color-*)` 的读者 —— 祖先（html）上
   改变量即全局生效；要局部改（用户板、选中行），在元素上重定义变量即可，
   工具类规则一条不用动。

## 画布六格矩阵与强制画布的重映射（测试台抓出来过 bug）

皮肤的四条画布规则靠**源顺序**决胜：day 默认 → `.dark`/强制夜 → 强制昼。
强制的重映射必须**成对**：

- 夜块选择器是 `html[data-zone-skin].dark, html[data-zone-skin][data-zone-canvas="night"]`
  —— 暗色应用与强制夜都从这块取底盘与夜侧语义值；
- 所以**强制昼**必须在夜块**之后**、同特异性 (0,2,1) 地重述：整个 day 底盘 +
  全部夜侧语义值（状态三色、workflow 轨迹、终端底、图表色板、context-breakdown）。

初版只重映射了 brand 族 —— 暗色应用 + 强制昼得到石墨底盘配昼日强调（裂皮）。
试验台六格矩阵（亮/暗应用 × auto/强制昼/强制夜）现在 6/6 通过，
`tests/token-contrast.mjs` 把"强制昼重映射完整性"写成了不变量。

## 结构钩子清单（全部为字面量，逐个在 bundle 里验证过）

| 钩子 | 用途 | 证据 |
| --- | --- | --- |
| `[data-workspace-conversation-frame]` | 会话框：氛围层锚定、`--zone-frame-*` 测量 | 主 bundle 选择器规则 + 滚动条规则 |
| `[data-project-sidebar-panel]` `[data-workspace-side-frame]` | 另两个滚动框：`--zcode-scrollbar-thumb` 染色 | 同上 `:is(...)` 规则 |
| `.chat-composer-input-surface` | 输入区的**方形全宽壳**：只用于镜头下界、面板下界（`--zone-composer-top`）。**绝不能**把背光/阴影打在它上面 —— 壳无圆角，辉光会成直角 | bundle className（无 radius 类） |
| `[data-composer-layout]` | **可见输入卡**：rounded-2xl/squircle 32px、0.5px 描边、应用自己的 `shadow-(--shadow-composer-soft)`。背光打这里 | bundle `data-composer-layout` div + 应用样式表 `@supports` 块 |
| `[data-v4-user-input-bubble="true"]` | 用户消息板：板内变量重定义上白墨 | bundle JSX + 应用样式表 `background-color: var(--color-user-message-bubble)` |
| `--color-user-message-bubble` | 用户板填充 token（皮肤指到 brand） | 样式表定义 + 上述规则 |
| `.group/task-item` 与 `.group/task-row`（两代变体）+ `bg-selected` | 侧栏会话行激活态：实心强调板（两种都要命中） | bundle `Z(...)` className（命名组，无哈希） |
| `.group/project-row` | 项目头行：DSH 式淡色 brand 染色 | bundle `virtual-project-row` 组件 |
| `[data-slot="scroll-area-viewport"]` | 会话滚动体：`--zone-content-top` 测量 | shadcn 原语 |
| `[data-streamdown="code-block"|-header|-body]` | Markdown 代码块 | streamdown chunk 全套字面量 |
| `[data-testid^="v4-turn-navigator-item"]` + `data-active` / `aria-current` | 对话跳转列表（turn navigator）：激活刻度 = 主题色 + 板辉光，悬停 = brand 静染。**data-active 单独不是安全作用域**（side-pane tabs 也在用），必须用 testid 前缀限定 | bundle `I_n` 组件：button 上 `data-active=true/false` + `aria-current=location`，tick 是内层 span（bg-foreground 系 + 内联 scaleX） |
| `[role="separator"][aria-orientation]` | 分栏拖柄光标 | 通用 ARIA |

**`data-testid="chat-input"` 在当前版本是死的**：只作为焦点还原选择器出现
（`restoreFocusSelector` 默认值 ×3、`document.querySelector` ×1），全 bundle **没有任何
元素被赋上它**。不要把它当地理钩子用 —— 这类"看着稳其实死"的钩子只有逐 bundle 搜证
才能分辨。

## 注入模型（build.js 对 index.html 做三件事）

1. 在**最后一个** `<link rel="stylesheet" … styles-<hash>.css>` 之后插入
   `<link … zone.css>`（同特异性时后写的赢，位置就是级联）；
2. 紧随其后插入 `<script src="… zone-boot.js" defer>`；
3. `<html>` 标签写入 `data-zone-skin` 等默认属性 —— boot 因任何原因没跑时，
   token 层仍然生效（默认 zone / auto / full / dots on）。boot 起来后接管这些属性。

样式表锚点必须**正则**匹配（hash 每版变）；注入前检查 `zone.css` / `zone-boot.js` /
`data-zone-skin` 三标记，目标包已打过补丁就拒绝。没有 CSP meta，文件级注入畅通。

## 阴影与 rgb 三元组

box-shadow 列表里只许 `rgb(var(--*-rgb) / α)`，不许 `color-mix()` —— 一个坏 mix 会作废
整条 shadow 列表。每个配色 8 组三元组（brand/shade/lift × day/night）+ 底盘 2 组
（ink-rgb），`tests/token-contrast.mjs` 逐组按公式对账：

- `shade = mix(brand, black, night .58 / day .45)` —— 物理按键的侧面，不是光；
- `lift = mix(brand, white, .22)` —— 输入卡背光的热核。

## 尾迹为什么必须从样本重绘

自衰减 canvas 做不到"精确归零"：8-bit alpha 的下限是 1/255，残影永远去不干净，
而且二次经过同一格会往上叠。本皮肤每帧 clear 后从样本表重绘：每格取**最新一次**
覆盖它的样本的亮度，样本过寿命就干脆不画 —— 试验台实测：新鲜扫过 14,890 个着色像素
（峰值 α 19/255 ≈ 7.5%，压在亮头 10% 之下），1400ms 后**零像素**。寿命 1100ms。
算法与参数（PITCH 7 / BRUSH 100 / STEP 16 / LIFE 1100 / CORE .085 / LEVELS 32，
按层计数排序后一层一条路径批量填充）与 DSH client R8 一致。

## 折衷与未移植项（都有原因，别"顺手补"）

- **完成提示音没移植。** DSH 版骑在宿主转发的 `api-session/*` 投影上；ZCode 渲染进程
  没有等价事件桥（`ZCODE_E2E_STORE_BRIDGE` 是 E2E 测试门，不是扩展面）。
  想加得先找到稳定的运行时信号，别往 boot 里塞轮询。
- **toast 保持中性表面。** `--color-toast` 只有表面一个变量，墨水走全局前景；
  染橙会在昼画布做出橙底深墨的奇怪组合。
- **终端只动底盘 / 光标 / 选区。** 16 色 ANSI 是可读性语义，保持原样；
  DSH 版没有终端 token，无从对齐。
- **`--color-ring` 是唯一"补上"的 token。** 应用工具类引用它但样式表从未定义
  （那些声明今天就被静默丢弃）；皮肤定义它点亮配色焦点环。
  css-coverage 的白名单只有它一个，别加第二个。

## 调试工具与技巧（2026-11 两轮真机调参沉淀）

调 ZCode 皮肤不要猜，四件工具构成闭环，全部在本目录：

### 1. bundle 搜证 —— `tools/search-bundle.mjs`

改任何宿主钩子前先搜证（`--testids` / `--tokens` / 上下文搜索）。
"看着稳其实死"的钩子只有它能分辨：`chat-input` 只有选择器引用、零赋值；
`group/task-item` 与 `group/task-row` 两代并存；`data-active` 被 tabs 共用。
规矩：字面量可用，哈希类与猜的 testid 不许进 zone.css。

### 2. 开发服务器日志 —— `testbed/serve.mjs` 的 stdout

每行请求日志带 `origin=` 与 `referer=`，是判断"谁在说话"的唯一可靠手段：

- `referer=-` → **应用**（file:// 页不发 referer）；`referer=http://…/testbed/` → 试验台；
- 心跳断没断 = 应用有没有真重启（点窗口 ✗ 进程不死，心跳不断 —— 托盘右键退出才算）；
- `GET /zone.css` 只出现在"新 boot 首次接触或 stamp 变化"时 —— 没有它 = 窗口没重载。

### 3. 诊断信标 —— `/report`（boot 内 `reportBeacon()`）

应用启动 3s、之后每 15s、且**每次几何变化**都把真实 DOM 测量发回日志：
托架落点、氛围层矩形、锚点普查（frames/main/sidebarPanel/sideFrame/composer/
layoutCard/viewports/tabs 全部实测）。两个教训：

- **首报太早**：会话挂载前发出（title 还是 ZCode），此时 frame 缺失、
  氛围层回退全窗口 —— 读数要取挂载后的行；
- 读法：`viewports:[] tabs:[]` 这类空数组本身就是结论（某锚点在该 build 不存在），
  据此切 `--zone-frame-strategy`（auto/frame/main/sidebar，热旋钮）或设
  `--zone-content-offset`（px，热旋钮）远程校准，**不用重启**。

### 4. 截图像素放大镜 —— `tools/zoom-shot.mjs <截图.png>`

用户反馈截图别只用视觉模型看（口头描述会骗人），放大 4x 逐行扫边界：
输入卡直角辉光一案，卡片填充边界在角上弯走（43→64px）而辉光边界钉死（x=35），
方角实锤；托架落点一案同理。方向键平移、1/2/4/8 直达倍率。

### 通道事实（热更新的边界）

- 应用渲染页是 `file://`：fetch/XHR 到 http **全灭**（请求出不了渲染进程），
  热通道只能走 `<script src>`（版本戳）、`<link>`（样式）、`<img>`（信标）；
- `location.reload()` 被应用壳拦截 → **JS 改动必须烘焙 + 托盘退出重启**；
  CSS 改动全程热更（≤2s，token 是活动变量）；
- 往 `resources/app.asar` 拷文件**应用开着也能成功**（无需先退），
  但新包要重启才加载。

## 排错清单（"皮肤坏了"先过这七条）

1. `html` 上有没有 `data-zone-skin`？（boot 死了也有安装时的默认属性兜底）
2. `zone.css` / `zone-boot.js` 在不在包里？
   （devtools: `document.querySelector('link[href$="zone.css"]')`）
3. boot 活着吗？（console: `window.__zoneSkinBooted` / `window.ZONE_SKIN.rev`）
4. `<html>` 的主题类是什么？auto 画布跟着 `dark` 类走 —— 应用切主题皮肤必须实时跟着翻。
5. 那个元素读的变量真的解析了吗？（css-coverage 的 token 清单就是干这个的）
6. 强制昼/夜下应用又切了主题？—— 六格矩阵；`token-contrast` 的强制昼不变量守着。
7. 应用升级过？—— 先 `extract-tokens.mjs` 重提清单、`css-coverage.mjs` 复核钩子，
   再 build；hash 锚点变了 build 会拒绝注入，别手动改包。

## 探针

devtools console：

```js
localStorage['zcode-zone-skin:probe'] = '1';   // 然后完全重启 ZCode
```

2.5 秒后 `localStorage['zcode-zone-skin:diag']` 是一次性体检报告：boot 版本、html 类、
`--zone-brand` / `--color-user-message-bubble` / `--color-background` 实算值、氛围层 /
控制台 / 会话框 / 输入卡矩形、用户板实算背景与文字色、`--zone-frame-*` 测量值、
光标变量、当前偏好。读完 `removeItem` 关掉。它只写这一个键，不动文档。

## 构建管线备忘

- `@electron/asar` 4.x 是 ESM-only：`import('file://…/lib/asar.js')`，别 `require()`。
- `extractFile` 要 OS 分隔符路径且不带前导斜杠（`out\renderer\index.html`）。
- 重打包默认按内容去重：包小 30+ MiB 正常，build 的校验按文件列表逐一对账，
  另抽查打包后 index.html 的三处注入。
- `unpack: '*.{node,dll,exe}'` 保持原生二进制外置，unpacked 清单三方一致才放行。
- 旧的毛玻璃皮肤（`~/.zcode/custom-ui/`）与本皮肤共用注入机制但互不知晓：
  若它还在应用中，先用它的 restore 还原官方包再 apply 本皮肤
  （备份名不同：`app.asar.bak` vs `app.asar.zone-bak`，不要混用）。
