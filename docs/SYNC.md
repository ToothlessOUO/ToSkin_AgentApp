# SYNC — 双端同步协议

一端改完如何落到另一端。设计基准在 [DESIGN.md](DESIGN.md)；本文件只管搬运。

## 搬运映射表

| 改动类型 | DSH 端落点（package/） | ZCode 端落点（for_zcode/） | 搬运注意 |
| --- | --- | --- | --- |
| 色板（CHASSIS / COLORWAYS） | `client.js` colors 段 | `zone.css` "palette inputs" 块 | ZCode 侧同步 8 组 rgb 三元组（brand/shade/lift × day/night）+ 2 组 ink-rgb；`tests/token-contrast.mjs` 按公式逐组对账 |
| 派生 token / 阴影配方 | `client.js` `schemeFor()` | `zone.css` derived 段 + 语义映射 | 阴影只许 `rgb(var(--*-rgb) / α)`；color-mix 不进 box-shadow 列表 |
| 透镜 / 尾迹参数 | `ZoneAtmosphere`（React effect） | `zone-boot.js` `trackPointer` | 常量必须两端一致：PITCH 7 / BRUSH 100 / STEP 16 / LIFE 1100 / CORE .085 / LEVELS 32 / JUMP 160 / KEEP 640 |
| 氛围层几何 / 锚点 | `ZoneAtmosphere` 面板测量 | `zone-boot.js` `trackFrame` | ZCode 锚点以真机 `/report` 普查为准（for_zcode/NOTES.md 调试章节），不照抄 DSH 的槽位假设 |
| 新的宿主表面样式 | `client.js` CSS 模板 + 对应槽位 | `zone.css` 样式层 + bundle 搜证过的字面量钩子 | ZCode 禁止哈希类 / `[class*=_…]` / 猜测的 testid |
| 字典 / 文案 | `DICT_EN` / `DICT_ZH` | `zone-boot.js` `*_LABEL` 表 | ZCode 端按 `navigator.language` 判中文 |
| 偏好 schema | `normalizePrefs` | `normalizePrefs` | 存储 key 不同（`dsh-zone-skin:prefs` / `zcode-zone-skin:prefs`），字段同名同义 |
| 光标集 | `cursorSet()` | `cursorSet()` | 两份实现当前逐字一致，改动需双向同步 |

## 跨端共享不变量（破坏任何一条两端同时变丑）

1. **亮板墨水是字面量白** `#ffffff`（one white voice）。夜 zone 橙 2.78:1、
   夜 hazard 黄 1.57:1 是接受过的取舍 —— 测试作为 note 报告，不修。
2. **用户消息板 = 配色强调色本身**，没有第二张板色表；板内上墨走变量作用域，
   板内选区反白才用 `!important`。
3. **画布解析四规则源顺序**：day 默认 → 暗色翻夜 → 强制夜 → 强制昼成对重映射
   （强制昼 = 整个 day 底盘 + 全部夜侧语义值，在夜块之后同特异性重述）。
4. **对比度地板**：正文 7:1 / 次级 4.5:1 / 弱化 3:1 / 边线 1.15:1 / 功能墨水 3:1。
5. **尾迹从样本表每帧重绘**；位图自衰减方案（8-bit alpha 到不了零）明确否决。
6. **透镜亮头精确贴指针**，不做缓动跟随。
7. **`prefers-reduced-motion` 永远压过皮肤动效设置**。

## 完成定义（DoD）

- [ ] 两端各自测试全绿（`package/ npm run check`；`for_zcode/` 三件套 + `node --check`）
- [ ] 涉及视觉的改动在 [DESIGN.md](DESIGN.md) 里仍成立（不成立就先改基准）
- [ ] ZCode 侧涉及新钩子的，搜证记录更新进 for_zcode/NOTES.md 钩子表
- [ ] [ROADMAP.md](ROADMAP.md) 勾掉对应项并注日期；ZCode 端注明"包内"还是"热更增量"
