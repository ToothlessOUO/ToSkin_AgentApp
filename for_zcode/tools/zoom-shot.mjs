/* 截图像素放大镜 —— 对用户反馈的截图做逐像素几何取证。
 *
 * 用法：
 *   node zoom-shot.mjs <截图.png> [端口]     → http://127.0.0.1:<端口>/
 *
 * 打开后：方向键平移（Shift 加速），+/- 缩放，1/2/4/8 直达倍率。
 * 配合 ZCode 内置浏览器或任意浏览器看角点是圆是方、辉光边界贴合与否。
 *
 * 为什么需要它：视觉模型的口头描述会骗人（“看起来是蓝的”），但像素不会 ——
 * 输入卡直角辉光、托架落点两案都是靠 4x 逐行扫边界定的案：
 * 卡片填充边界弯了（43→64px）而辉光边界钉死（x=35），方角实锤。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const shot = process.argv[2];
if (!shot || !fs.existsSync(shot)) {
  console.error('用法: node zoom-shot.mjs <截图.png> [端口]');
  process.exit(1);
}
const PORT = Number(process.argv[3]) || 8474;
const PNG = fs.readFileSync(shot);

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; background: #000; overflow: hidden; }
  img { position: absolute; transform-origin: 0 0; image-rendering: pixelated; }
  #hud { position: fixed; left: 8px; top: 8px; color: #0f0; font: 12px monospace; }
</style></head><body>
<img id="pic" src="shot.png"><div id="hud"></div><script>
  const pic = document.getElementById('pic'), hud = document.getElementById('hud');
  let Z = 4, cx = 0, cy = 0;
  function paint() {
    pic.style.width = pic.naturalWidth + 'px';
    pic.style.transform = 'scale(' + Z + ') translate(' + (innerWidth / 2 / Z - cx) + 'px,' + (innerHeight / 2 / Z - cy) + 'px)';
    hud.textContent = Z + 'x  中心 (' + Math.round(cx) + ',' + Math.round(cy) + ')  方向键平移 Shift加速 +/-/1/2/4/8 缩放';
  }
  pic.onload = paint;
  addEventListener('keydown', (e) => {
    const s = e.shiftKey ? 40 : 10;
    if (e.key === 'ArrowLeft') cx -= s; if (e.key === 'ArrowRight') cx += s;
    if (e.key === 'ArrowUp') cy -= s; if (e.key === 'ArrowDown') cy += s;
    if (e.key === '+' || e.key === '=') Z = Math.min(16, Z * 1.5);
    if (e.key === '-') Z = Math.max(1, Z / 1.5);
    if ('1248'.includes(e.key)) Z = Number(e.key);
    paint();
  });
  addEventListener('resize', paint);
</script></body></html>`;

http.createServer((req, res) => {
  if (req.url.includes('shot.png')) {
    res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store' });
    res.end(PNG);
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(PAGE);
}).listen(PORT, '127.0.0.1', () => {
  console.log('像素放大镜 → http://127.0.0.1:' + PORT + '/  (' + path.basename(shot) + ')');
});
