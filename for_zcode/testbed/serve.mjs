/* Dev server for the ZONE skin on ZCode.
 *
 *   node testbed/serve.mjs [port]     → http://127.0.0.1:<port>/testbed/
 *
 * Two jobs:
 *   1. testbed — serves for_zcode/ so testbed/index.html loads the UNMODIFIED
 *      ../zone.css + ../zone-boot.js against a fake app shell;
 *   2. live skin — while this server runs, the INSTALLED app's boot polls
 *      GET /stamp (default port 8472, see zone-boot.js watchLiveSkin) and hot
 *      -swaps zone.css on change (tokens are live custom properties), or
 *      reloads the window when zone-boot.js changed. Every response carries
 *      CORS headers because the renderer page is file:// (origin null).
 *      Server down → the packaged skin keeps running untouched.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)); // .../for_zcode/testbed
const SKIN = path.dirname(ROOT);                            // .../for_zcode
const PORT = Number(process.argv[2]) || 8472;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const fingerprint = (file) => {
  const stat = fs.statSync(file);
  return stat.size + '-' + Math.round(stat.mtimeMs);
};

const server = http.createServer((req, res) => {
  const send = (status, body, type) => {
    res.writeHead(status, {
      'content-type': type || 'application/octet-stream',
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
    });
    res.end(body);
  };
  const url = new URL(req.url, 'http://127.0.0.1');
  /* request log: who polls (Origin null = the app's file:// renderer,
     http origin = the testbed browser) — the lifeline of the hot-update path */
  console.log(new Date().toISOString().slice(11, 19) + ' '
    + req.method + ' ' + url.pathname
    + '  origin=' + (req.headers.origin || '-')
    + '  referer=' + ((req.headers.referer || '-').slice(0, 44)));
  if (url.pathname === '/stamp') {
    const css = fingerprint(path.join(SKIN, 'zone.css'));
    const js = fingerprint(path.join(SKIN, 'zone-boot.js'));
    send(200, JSON.stringify({ css, js, stamp: css + '/' + js }), TYPES['.json']);
    return;
  }
  if (url.pathname === '/stamp.js') {
    /* script-tag transport: the renderer is file://, where fetch/XHR to http
       is blocked outright — a <script> that sets a global is the channel.
       The trailing ping reports the client's internal state each poll
       (diagnostic: which boot runs, whether the live link was applied). */
    const css = fingerprint(path.join(SKIN, 'zone.css'));
    const js = fingerprint(path.join(SKIN, 'zone-boot.js'));
    send(200, 'window.__zoneStampInfo={css:"' + css + '",js:"' + js + '",stamp:"' + css + '/' + js + '"};'
      + 'new Image().src="' + 'http://127.0.0.1:' + PORT + '/ping?r=' + '"+(window.ZONE_SKIN?window.ZONE_SKIN.rev:"noboot")'
      + '+(" live="+(window.ZONE_SKIN&&window.ZONE_SKIN.live?String(window.ZONE_SKIN.live).slice(0,30):"unset"))'
      + '+(" link="+(document.querySelector(\'link[href*="zone.css?v="]\')?"yes":"no"))'
      + '+(" tick="+(document.querySelector(".zone-tick-tl")?Math.round(document.querySelector(".zone-tick-tl").getBoundingClientRect().top):"none"))'
      + '+(" ct="+(getComputedStyle(document.documentElement).getPropertyValue("--zone-content-top")||"-").trim())'
      + '+(" class="+document.documentElement.className.replace(/\\s+/g,".").slice(0,40))'
      + '+(" canvas="+(document.documentElement.getAttribute("data-zone-canvas")||"-"))'
      + '+(" pre="+(function(){var p=document.querySelector("[data-streamdown=\\"code-block-body\\"] pre");if(!p)return "none";var s=getComputedStyle(p);return s.backgroundColor+"|"+s.color;})());',
      TYPES['.js']);
    return;
  }
  if (url.pathname === '/ping') {
    console.log('[ping] ' + decodeURIComponent(url.search.slice(1)));
    send(200, Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'), 'image/gif');
    return;
  }
  if (url.pathname === '/report') {
    /* diagnostic beacon from the installed app: decode and log it */
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try {
        const data = url.searchParams.get('d') ? JSON.parse(decodeURIComponent(url.searchParams.get('d'))) : {};
        console.log('[report] ' + JSON.stringify(data));
      } catch (e) {
        console.log('[report] undecodable');
      }
      res.writeHead(200, {
        'content-type': 'image/gif',
        'access-control-allow-origin': '*',
        'cache-control': 'no-store',
      });
      res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    });
    return;
  }
  let file = path.normalize(path.join(SKIN, url.pathname));
  if (!file.startsWith(SKIN)) { send(403, 'forbidden'); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    send(404, 'not found: ' + url.pathname);
    return;
  }
  send(200, fs.readFileSync(file), TYPES[path.extname(file)]);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('ZONE testbed  → http://127.0.0.1:' + PORT + '/testbed/');
  console.log('ZONE live-skin → the installed app hot-swaps zone.css while this');
  console.log('                server runs (poll /stamp every 2s; JS changes reload).');
});
