# WORKFLOWS — 日常流程与工具索引

## DSH 端更新

```sh
cd package && npm run check        # token-contrast / css-coverage / chime / probe
```

改 `client.js` → 测试绿 → 宿主 profile（`link:` 活链）重启桌面应用即见。

## ZCode 端：CSS 改动（无需重启应用）

```sh
node for_zcode/testbed/serve.mjs   # 保持运行（127.0.0.1:8472）
```

改 `for_zcode/zone.css` → ≤2 秒热进应用（token 是活动变量，不刷新不丢状态）。
需要几何反馈时读服务器 stdout 的 `[report]` 行（托架落点 / 锚点普查）；
远程校准用热旋钮：`--zone-frame-strategy`（auto/frame/main/sidebar）、
`--zone-content-offset`（px）。

## ZCode 端：JS 改动（必须烘焙 + 重启）

JS 无法热进（窗口刷新被应用壳拦截，见 [PITFALLS.md](PITFALLS.md)）：

```sh
cd for_zcode/tools
cp -p out/app.asar.zone-bak "C:/Program Files/ZCode/resources/app.asar"   # 还原官方
node build.js                                                             # 从官方包重建
cp out/app.asar.zone "C:/Program Files/ZCode/resources/app.asar"          # 应用开着也能写
```

然后**托盘右键 → 退出**（点窗口 ✗ 只收托盘、进程不死）→ 重新打开。
重启后 `/report` 会自动回报真机几何，据其复核。

## ZCode 应用升级后（四步）

```sh
cd for_zcode
node tests/extract-tokens.mjs        # 1. 重提 token 清单（新 styles-<hash>.css）
node tests/css-coverage.mjs          # 2. 复核被改写 token 仍存在、var() 可解析
node tools/search-bundle.mjs --testids   # 3. 抽查关键钩子仍在（钩子表见 NOTES）
cd tools && cp -p out/app.asar.zone-bak … && node build.js && cp …        # 4. 烘焙重装
```

真机跑一次看 `/report` 普查行确认氛围层锚定正常。

## 调试工具索引

| 工具 | 用途 |
| --- | --- |
| `for_zcode/testbed/serve.mjs` | 试验台 + 热更新服务器 + `/stamp.js` `/report` + 请求日志（origin/referer 判轮询者） |
| `for_zcode/tools/search-bundle.mjs` | bundle 搜证：`--testids` / `--tokens` / 上下文搜索；新增钩子前的必经步骤 |
| `for_zcode/tools/zoom-shot.mjs` | 截图像素放大镜：对用户截图 4x+ 逐行扫边界，几何争议的终审 |
| `for_zcode/tests/extract-tokens.mjs` | 从已安装样式表重提 token 清单（`--check` 校一致性） |
| ZCode 内置浏览器 + 试验台页 | 免改应用的视觉验收（`/testbed/`），同一份皮肤文件 |

技巧细节（报告读法、心跳判断、热旋钮用法、像素取证案例）在
[for_zcode/NOTES.md](../for_zcode/NOTES.md)「调试工具与技巧」。
