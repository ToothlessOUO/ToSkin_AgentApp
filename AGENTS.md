# AGENTS.md — 文档路由（本文件只指路，不装内容）

本仓库 = **一个皮肤、两个宿主**：DSH 端（`package/`，Cordis 插件，权威实现）
与 ZCode 端（`for_zcode/`，app.asar 注入 + 热更新，移植实现）。

## 文档地图

| 文档 | 内容 | 什么时候读 |
| --- | --- | --- |
| [docs/DESIGN.md](docs/DESIGN.md) | 设计语言基准：底盘/配色/亮板法则/光与影/透镜尾迹参数/状态色/已决策的不做 | **改任何视觉之前** —— 它是两端共同实现的目标规范 |
| [docs/SYNC.md](docs/SYNC.md) | 双端同步协议：改动类型 → 两端落点映射表；跨端共享不变量 | **改动需要跨端搬运时** |
| [docs/WORKFLOWS.md](docs/WORKFLOWS.md) | 日常流程：DSH 更新、ZCode CSS 热更、ZCode 烘焙重启、应用升级演练；调试工具索引 | **动手改东西时** |
| [docs/PITFALLS.md](docs/PITFALLS.md) | 陷阱速查（真机咬过的坑，各有指向详情的链接） | 出问题/加钩子/动传输机制时 |
| [docs/ROADMAP.md](docs/ROADMAP.md) | 两条实施路线：已落地清单、待烘焙、待办、变更记录 | 接手时与交付前 |
| [package/AGENTS.md](package/AGENTS.md) | DSH 端目录须知（打包/槽位/测试） | 动 `package/` 时 |
| [for_zcode/AGENTS.md](for_zcode/AGENTS.md) | ZCode 端目录须知（三层结构/环境事实/校验环/不变量） | 动 `for_zcode/` 时 |
| [for_zcode/NOTES.md](for_zcode/NOTES.md) | ZCode 端一手实测档案：钩子表、级联、注入模型、**调试工具与技巧** | 改 ZCode 颜色/排错前必读 |

## 按场景进门

- **改颜色 / 改视觉** → DESIGN.md 定方向 → SYNC.md 查两端落点 → 两端测试跑绿
- **调 ZCode 皮肤（不重启）** → WORKFLOWS.md「ZCode 热更」→ 深技巧在 for_zcode/NOTES.md
- **改了 ZCode 的 JS** → WORKFLOWS.md「烘焙」→ 托盘退出重启（点 ✗ 没用，见 PITFALLS.md）
- **ZCode 应用升级了** → WORKFLOWS.md「应用升级」四步
- **接手项目** → ROADMAP.md 看状态 → 各端 AGENTS.md → 对应 NOTES.md

## 硬规矩（只有三条，其余都在上面各文档里）

1. 视觉决策先落 DESIGN.md，再进两端代码；两端测试是完成定义的一部分。
2. ZCode 新增宿主钩子必须先在 bundle 搜证（`for_zcode/tools/search-bundle.mjs`），
   字面量可用，哈希类与猜测不许进 zone.css。
3. 破坏 docs/SYNC.md 里的跨端不变量 = 两端同时变丑，测试会拦，别绕。
