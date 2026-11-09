# ROADMAP — 两条实施路线与状态

维护规则：每完成一项就勾掉并注日期；跨端搬运按 [../AGENTS.md](../AGENTS.md)
的同步协议执行；设计基准以 [DESIGN.md](DESIGN.md) 为准。

## DSH 端（package/，权威实现）

**载体**：Cordis 客户端插件 `@local/dsh-zone-skin`。宿主提供五槽位 + 
`ctx.theme.overrideTokens()` token 覆盖 + `api-session/*` 事件投影。

### 已落地（client R8，2026-10）

- [x] token 层：`schemeFor/tokensFor` 双画布成对覆盖（含反转标签对绑定底盘）
- [x] 样式层：选区钉子、用户板、composer 背光与主键、会话行实心板、
      项目头染色、新会话键、turn rail（激活刻度 = 配色 + 板辉光）
- [x] 氛围层：面板锚定测量、7px 半调、双接缝（7.5px 共享曲线）、四托架、
      **精确亮头 + canvas 尾迹**（样本重绘，1100ms 精确归零）
- [x] 控制台 / 设备条 / 设置页 / 双语字典 / 24px 光标集
- [x] 完成提示音（api-session 投影，子会话静默）+ 三挡音量
- [x] 测试：token-contrast / css-coverage / chime-behavior / probe-read

### 待办 / 方向

- [ ] 会话面板锚定在多窗格（split pane）下的测量复核
- [ ] 探针的 TEMPORARY 强制开关移除（client.js probeOnce 里还硬开着）
- [ ] R8 之后的设计演进：先改 [DESIGN.md](DESIGN.md) 再落这里

## ZCode 端（for_zcode/，移植实现）

**载体**：app.asar 注入（`zone.css` + `zone-boot.js` + build/apply/restore 工具链）
+ 本地热更新（dev server：CSS ≤2s 热换、诊断信标、热旋钮）。

### 已落地（Z1 包 + 热更增量，2026-11-06）

- [x] token 层：`html[data-zone-skin]` (0,1,1) 无层注入全赢宿主四块 (0,1,0)；
      强制画布成对重映射（曾裂皮，矩阵 + 不变量守着）
- [x] 样式层：选区钉子、用户板（`--color-user-message-bubble` → brand）、
      选中任务行实心板（task-item + task-row 两代）、项目头按 DSH 淡染
      （**仅活跃项目**：boot 文档序扫描打 `data-zone-active`）、
      composer 背光（`[data-composer-layout]`，方壳上会直角 —— 教训在 NOTES）、
      代码块、光标集、滚动条染色、跳转列表荧光刻度（testid 前缀限定作用域）
- [x] 氛围层：会话框锚定、半调、双接缝、四托架、精确亮头 + canvas 尾迹
      （与 DSH 同参数）
- [x] 控制台（芯片 + 向上弹出面板，底边钳在输入卡顶上）、设备条、双语标签
- [x] 热更新管线：script/link/img 资源标签传输（file:// 下 fetch 全灭）、
      /stamp.js 版本戳、/report 诊断信标（锚点普查）、`--zone-frame-strategy`
      / `--zone-content-offset` 热旋钮、请求日志（origin/referer 判轮询者）
- [x] 工具：build/apply/restore、extract-tokens（升级后重提清单）、
      search-bundle（钩子搜证）、zoom-shot（截图像素取证）、离线试验台
- [x] 真机调参两案存档：输入卡直角辉光（像素实锤）、托架落点
      （/report 普查 → offset 49px 热推）

### 待烘焙（下一次"托盘退出 → 重启"周期进包）

- [ ] 代码块井随**应用主题**而非画布（亮应用=奶油井配深字、暗应用=深井配亮字；
      修"亮应用+强制夜画布 → 深蓝字配深井看不清"）—— 已热推生效
- [ ] 强制画布牵引应用主题（`syncAppTheme`：黑场→zai-dark、米白→zai-light、
      auto 不动应用；自愈：应用回写类名后观察器重压）—— 包 f2b6c9fa 已含
- [ ] **控制台撤出主界面，搬进 设置→外观 当最后一栏**（悬浮芯片与侧栏底部
      用户信息撞位；注入锚点 = 外观页 `space-y-3` 容器含 h3+select-trigger+bg-card，
      800ms 扫描自愈重挂；快捷键 Z/X 保留、H 移除）—— 包 c2bfe09e 已含，待真机验收

### 烘焙记录（2026-11-06 第二次重启周期，包 e9b6fb67）

- [x] `main.top` JS 级内容锚点（标题行高度自适应；普查证实该 build 无
      scroll-area viewport / role=tab，main 即消息列）+ offset 旋钮归零留作微调
- [x] 代码块 `pre` 机刻底色（`[data-streamdown="code-block-body"] pre` →
      `--zone-code`，压掉高亮器内联的中性黑；真机截图验证含 3px 主题色左边框）
- [x] `--zone-content-offset: 49px` 热更历史使命完成，由 main 锚点取代

### 待办 / 方向

- [ ] ZCode 应用升级演练一次：extract-tokens → css-coverage → /report 普查
      → 重建（流程都写好了，没跑过实战）
- [ ] 完成提示音：待出现稳定运行时信号再议（无事件桥，明确不硬做）
- [ ] 设置页等价物：目前只有控制台面板 + 快捷键，够用，暂不加
- [ ] 试验台补：project 头 / task-item 的包容器结构已仿真实，
      跳转列表已仿；split pane（右侧 side frame 展开时氛围层）未仿

## 变更记录

- 2026-10-26 DSH ZONE v1.0.0 → R8（尾迹重绘两次返修：从零起步的 ramp、按头定尺寸）
- 2026-10-26 ZCode 首次移植（后被否决删除）
- 2026-11-05 ZCode 全新重写 Z1：一手实测档案、六格画布矩阵、试验台全项验收
- 2026-11-06 Z1 真机两轮返修（输入卡直角辉光、侧栏两代行 + 项目头淡染）；
      热更新通道重写（file:// fetch 禁 → 资源标签传输）；报告信标 + 热旋钮；
      跳转列表荧光刻度；托架落点按 /report 实测校准（offset 49px 热推）
