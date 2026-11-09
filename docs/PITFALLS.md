# PITFALLS — 陷阱速查（每条都真咬过，附详情去向）

## ZCode 宿主

| 陷阱 | 事实 | 详情 |
| --- | --- | --- |
| `data-testid="chat-input"` | **死钩子**：只有焦点还原选择器引用，全 bundle 无元素赋值 | for_zcode/NOTES.md 钩子表 |
| 侧栏会话行有两代 | `group/task-item` 与 `group/task-row` 并存，只命中一代 = 只剩弱染色 | NOTES 钩子表 |
| `data-active` 被共用 | tabs 与跳转列表都在用，作用域必须 testid 前缀限定 | NOTES 钩子表 |
| 输入卡的圆角在里层 | `.chat-composer-input-surface` 是无圆角方壳；可见卡是 `[data-composer-layout]`，背光打错层 = 直角辉光 | NOTES「调试工具与技巧」案例 |
| 消息列表不用 scroll-area / 顶部不是 role=tab | 该 build 里 `viewports:[] tabs:[]`，锚点落空 contentTop=0 → 托架压标题行 | NOTES + ROADMAP 待烘焙（main.top 锚点） |
| 首个 /report 太早 | 会话挂载前发出（title 还是 ZCode），frame 缺失、回退全窗口；读数取挂载后的行 | NOTES 调试章节 |

## ZCode 通道与安装

| 陷阱 | 事实 | 详情 |
| --- | --- | --- |
| `file://` 下 fetch/XHR 全灭 | 请求出不了渲染进程（Chromium 限制）；热通道只能走 `<script>/<link>/<img>` 资源标签 | NOTES「通道事实」 |
| `location.reload()` 被壳拦截 | JS 改动无法热进，必须烘焙 + 重启 | NOTES「通道事实」 |
| 点窗口 ✗ ≠ 退出 | 只收托盘，进程不死：心跳不断、皮肤不换；必须托盘右键退出 | WORKFLOWS |
| 构建源不能是已打补丁的包 | build 会拒绝重复注入：先还原官方备份再 build | WORKFLOWS 烘焙流程 |
| asar 4.x 重打包去重 | 包变小 30+ MiB 正常；校验按文件列表对账，别当丢文件 | for_zcode/NOTES |
| 旧毛玻璃皮肤共存 | `~/.zcode/custom-ui/` 同机制不同备份名（app.asar.bak vs zone-bak），混用前先 restore | NOTES 构建管线备忘 |

## 级联与样式

| 陷阱 | 事实 | 详情 |
| --- | --- | --- |
| var() 静默失效 | 引用了不存在的 token → 声明作废无声无息；css-coverage 的 token 清单就是防这个 | 两端 NOTES 共同前置 |
| color-mix 进 box-shadow | 一个坏 mix 作废整条阴影列表 → 只许 rgb 三元组字面量 | DESIGN「光与影」 |
| 强制昼只重映射 brand | 夜块选择器含 `.dark`，强制昼必须成对重述整个 day 底盘 + 夜侧语义值（曾裂皮） | SYNC 不变量 3 |
| 嵌套 :has() 非法 | 该 Chromium 不接受嵌套 :has，整条规则被丢 —— "包含选中行的项目头"改由 boot 打标 | NOTES（data-zone-active） |
