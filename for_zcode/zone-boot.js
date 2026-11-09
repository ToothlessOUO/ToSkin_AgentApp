/* ZONE skin for ZCode — runtime half (Z1).
 *
 * Injected by tools/build.js as <script defer> right after zone.css.
 * ZCode has no plugin slots, so everything the DSH original did through
 * React components and ctx.theme.overrideTokens() happens here against the
 * live document, outside #root (React never rewrites what it does not own):
 *
 *   - preferences in localStorage, normalised, multi-window synced
 *   - the html[data-zone-*] attributes zone.css reads
 *   - the 24px SVG cursor set, published as --zone-cursor* variables
 *   - the atmosphere: sidebar/titlebar seams, halftone screen, the pointer
 *     lens head and its canvas wake, four taped corner brackets — anchored
 *     to [data-workspace-conversation-frame], measured at runtime
 *   - the console: a chip docked bottom-left that opens the colorway /
 *     canvas / motion / halftone panel, the cream sticker and the LED bar
 *   - the opt-in DOM probe (localStorage['zcode-zone-skin:probe'] = '1')
 *
 * No dependencies, no framework. Keyboard: Ctrl+Alt+Z colorway,
 * Ctrl+Alt+X canvas, Ctrl+Alt+H hide/show the console.
 *
 * The theme model (verified in the installed build): localStorage['zcode-theme']
 * is system|dark|light|zai-dark|zai-light (default zai-dark) and the app puts
 * `dark` + `theme-zai-dark`|`theme-zai-light` on <html>. The skin watches the
 * class list and follows.
 */
(() => {
  'use strict';

  if (window.__zoneSkinBooted) return;
  window.__zoneSkinBooted = true;

  const REV = 'Z1';
  const PREF_KEY = 'zcode-zone-skin:prefs';
  const PROBE_FLAG = 'zcode-zone-skin:probe';
  const PROBE_KEY = 'zcode-zone-skin:diag';

  const COLORWAY_ORDER = ['zone', 'ember', 'hazard', 'cobalt'];
  const CANVAS_ORDER = ['auto', 'day', 'night'];
  const MOTION_ORDER = ['full', 'quiet', 'off'];
  const CONSOLE_ORDER = ['visible', 'hidden'];

  const COLORWAY_LABEL = {
    zone: { en: 'Zone orange', zh: 'ZONE 橙' },
    ember: { en: 'Ember', zh: '余烬红' },
    hazard: { en: 'Hazard', zh: '警戒黄' },
    cobalt: { en: 'Cobalt', zh: '钴蓝' },
  };
  const CANVAS_LABEL = {
    auto: { en: 'Follow app', zh: '跟随应用' },
    day: { en: 'Cream', zh: '米白' },
    night: { en: 'Blacksite', zh: '黑场' },
  };
  const MOTION_LABEL = {
    full: { en: 'Full', zh: '完整' },
    quiet: { en: 'Quiet', zh: '克制' },
    off: { en: 'Off', zh: '停止' },
  };

  /* The app's UI language (navigator.language is zh-* when the user runs the
     Chinese build); label lookups fall back to English. */
  const zh = typeof navigator !== 'undefined' && /^zh\b|[-_]zh\b/i.test(navigator.language || '');
  const label = (table, key) => (table[key] ? table[key][zh ? 'zh' : 'en'] : key);

  /* ------------------------------------------------------------ palettes */
  /* Must stay in lockstep with the colorway blocks in zone.css; the wake
     canvas needs the brand as channels and no CSS variable can cross into a
     canvas 2d context. */

  const COLORWAYS = {
    zone: { night: '#ff6f1a', day: '#e2560d' },
    ember: { night: '#ff4632', day: '#c62c1b' },
    hazard: { night: '#ffc61a', day: '#a8770a' },
    cobalt: { night: '#4d94ff', day: '#1f5fd6' },
  };

  const brandOf = (colorway, mode) => COLORWAYS[colorway][mode];

  function rgba(hex, alpha) {
    const value = String(hex).replace('#', '');
    return 'rgba(' + parseInt(value.slice(0, 2), 16) + ', '
      + parseInt(value.slice(2, 4), 16) + ', '
      + parseInt(value.slice(4, 6), 16) + ', ' + alpha + ')';
  }

  /* ------------------------------------------------------------- cursors */

  const CURSOR_CREAM = '#f8f3e8';
  const CURSOR_GRAPHITE = '#2c2927';

  /** Wrap SVG markup into a CSS url() the renderer accepts. */
  function cursorImage(body) {
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>"
      + body + '</svg>';
    const encoded = svg.replaceAll('<', '%3C').replaceAll('>', '%3E').replaceAll('#', '%23');
    return 'url("data:image/svg+xml,' + encoded + '")';
  }

  /** A haloed line-art glyph: the cream underlay keeps it visible on the dark
   *  canvas, the brand core keeps it visible on the cream one. */
  function cursorGlyph(brand, paths) {
    const halo = "<g stroke='" + CURSOR_CREAM + "' stroke-width='4.2' stroke-linecap='round'"
      + " stroke-linejoin='round' fill='none'>" + paths + '</g>';
    const core = "<g stroke='" + brand + "' stroke-width='1.8' stroke-linecap='round'"
      + " stroke-linejoin='round' fill='none'>" + paths + '</g>';
    return halo + core;
  }

  /** The full pointer set for one colorway/canvas. `default` is the tailless
   *  arrow; line-art states share the cream halo + brand core. wait/progress/
   *  help/crosshair/grabbing/move/nwse-resize stay native: CSS cursor images
   *  cannot animate, and those affordances read better as system glyphs. */
  function cursorSet(colorway, mode) {
    const brand = brandOf(colorway, mode);
    const arrow = 'M4 2.2 L4 19.0 L9.0 14.4 L17.0 13.2 Z';
    return {
      '--zone-cursor': cursorImage("<path d='" + arrow + "' fill='" + CURSOR_GRAPHITE
        + "' stroke='" + brand + "' stroke-width='1.6' stroke-linejoin='miter' stroke-miterlimit='4'/>")
        + ' 4 2, default',
      '--zone-cursor-text': cursorImage(cursorGlyph(brand,
        "<path d='M12 4.8 V19.2'/><path d='M8.8 4.8 H15.2'/><path d='M8.8 19.2 H15.2'/>")) + ' 12 5, text',
      /* The pointer is the arrow itself, shifted to make room for a small
         brand cross at its upper-left — one family, not a hand. */
      '--zone-cursor-pointer': cursorImage("<path d='M8.4 6.8 L8.4 20.2 L12.4 16.6 L18.8 15.6 Z' fill='"
        + CURSOR_GRAPHITE + "' stroke='" + brand + "' stroke-width='1.5'"
        + " stroke-linejoin='miter' stroke-miterlimit='4'/>"
        + "<g stroke='" + brand + "' stroke-width='2.2' stroke-linecap='round' fill='none'>"
        + "<path d='M2.6 4.2 H7.8'/><path d='M5.2 1.6 V6.8'/></g>")
        + ' 8 7, pointer',
      '--zone-cursor-not-allowed': cursorImage(cursorGlyph(brand,
        "<circle cx='12' cy='12' r='7.4'/><path d='M7.2 7.2 L16.8 16.8'/>")) + ' 12 12, not-allowed',
      '--zone-cursor-col-resize': cursorImage(cursorGlyph(brand,
        "<path d='M4 12 H20'/><path d='M7.2 8.8 L4 12 L7.2 15.2'/><path d='M16.8 8.8 L20 12 L16.8 15.2'/>"))
        + ' 12 12, col-resize',
      '--zone-cursor-row-resize': cursorImage(cursorGlyph(brand,
        "<path d='M12 4 V20'/><path d='M8.8 7.2 L12 4 L15.2 7.2'/><path d='M8.8 16.8 L12 20 L15.2 16.8'/>"))
        + ' 12 12, row-resize',
      '--zone-cursor-zoom-in': cursorImage(cursorGlyph(brand,
        "<circle cx='10.4' cy='10.4' r='5.6'/><path d='M14.6 14.6 L20 20'/><path d='M7.6 10.4 H13.2'/>"
        + "<path d='M10.4 7.6 V13.2'/>")) + ' 10 10, zoom-in',
    };
  }

  const CURSOR_VARS = ['--zone-cursor', '--zone-cursor-text', '--zone-cursor-pointer',
    '--zone-cursor-not-allowed', '--zone-cursor-col-resize', '--zone-cursor-row-resize',
    '--zone-cursor-zoom-in'];

  /* ---------------------------------------------------------------- prefs */

  function normalizePrefs(input) {
    const raw = input && typeof input === 'object' ? input : {};
    return {
      colorway: COLORWAY_ORDER.includes(raw.colorway) ? raw.colorway : 'zone',
      canvas: CANVAS_ORDER.includes(raw.canvas) ? raw.canvas : 'auto',
      motion: MOTION_ORDER.includes(raw.motion) ? raw.motion : 'full',
      dots: raw.dots !== false,
      console: CONSOLE_ORDER.includes(raw.console) ? raw.console : 'visible',
    };
  }

  function readStored() {
    try {
      const raw = window.localStorage.getItem(PREF_KEY);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  function writeStored(prefs) {
    try {
      window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    } catch {
      /* private mode can refuse storage; the session keeps working */
    }
  }

  const step = (order, value) => order[(order.indexOf(value) + 1) % order.length];

  /* ---------------------------------------------------------------- state */

  const reduce = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  let prefs = normalizePrefs(readStored());
  let systemNight = document.documentElement.classList.contains('dark');

  const modeOf = () => (prefs.canvas === 'auto' ? (systemNight ? 'night' : 'day') : prefs.canvas);
  const effectiveMotion = () => (reduce && reduce.matches ? 'off' : prefs.motion);

  const listeners = new Set();
  const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  const publish = () => { for (const fn of [...listeners]) fn(); };

  function applyRoot() {
    const root = document.documentElement;
    const mode = modeOf();
    root.setAttribute('data-zone-skin', '');
    root.setAttribute('data-zone-colorway', prefs.colorway);
    root.setAttribute('data-zone-canvas', prefs.canvas);
    root.setAttribute('data-zone-motion', effectiveMotion());
    root.setAttribute('data-zone-dots', prefs.dots ? 'on' : 'off');
    const set = cursorSet(prefs.colorway, mode);
    for (const name of CURSOR_VARS) root.style.setProperty(name, set[name]);
    syncAppTheme();
  }

  /* A forced canvas coerces the APP's own theme: the code highlighter and
   * every app-native light/dark surface follow the app theme (html classes +
   * localStorage['zcode-theme']), not the skin — a night canvas over a light
   * app put light-palette (dark-blue) code on a dark well. So blacksite
   * rides zai-dark and cream rides zai-light; 'auto' never touches the app
   * (the skin follows it instead). Self-healing: if the app later re-applies
   * its own classes, the theme observer re-runs applyRoot and re-coerces. */
  function syncAppTheme() {
    if (prefs.canvas === 'auto') return;
    const dark = prefs.canvas === 'night';
    const key = dark ? 'zai-dark' : 'zai-light';
    try {
      if (window.localStorage.getItem('zcode-theme') !== key) {
        window.localStorage.setItem('zcode-theme', key);
      }
    } catch {
      /* storage refused: the class flip below still applies for this session */
    }
    const root = document.documentElement;
    if (root.classList.contains('dark') !== dark) {
      root.classList.toggle('dark', dark);
      root.classList.toggle('theme-zai-dark', dark);
      root.classList.toggle('theme-zai-light', !dark);
    }
  }

  function update(patch) {
    const next = normalizePrefs({ ...prefs, ...patch });
    if (JSON.stringify(next) === JSON.stringify(prefs)) return;
    prefs = next;
    writeStored(prefs);
    applyRoot();
    renderSettings();
    publish();
  }

  /* The app flips theme classes on <html> at runtime; the auto canvas follows. */
  const themeObserver = new MutationObserver(() => {
    const night = document.documentElement.classList.contains('dark');
    if (night !== systemNight) {
      systemNight = night;
      applyRoot();
      renderSettings();
      publish();
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  if (reduce) reduce.addEventListener('change', () => { applyRoot(); publish(); });

  window.addEventListener('storage', (event) => {
    if (event.key !== PREF_KEY && event.key !== null) return;
    const next = normalizePrefs(readStored());
    if (JSON.stringify(next) === JSON.stringify(prefs)) return;
    prefs = next;
    applyRoot();
    renderSettings();
    publish();
  });

  window.addEventListener('keydown', (event) => {
    if (!(event.ctrlKey && event.altKey) || event.shiftKey || event.metaKey) return;
    const tag = (event.target && event.target.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    const key = event.key.toLowerCase();
    if (key === 'z') { update({ colorway: step(COLORWAY_ORDER, prefs.colorway) }); event.preventDefault(); }
    else if (key === 'x') { update({ canvas: step(CANVAS_ORDER, prefs.canvas) }); event.preventDefault(); }
  });

  /* ------------------------------------------------------------ dom build */

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  /* ------------------------------------------------------ settings section */
  /* The skin lives INSIDE Settings → Appearance as its last section — no
   * floating chip on the main UI (it collided with the sidebar's account
   * block). React owns the settings DOM, so the section is rebuilt once,
   * parked, and re-attached by a cheap scan whenever the appearance page is
   * open and the node is missing (re-renders drop it; the scan re-appends).
   * The anchor: the appearance page's title+card container is the div whose
   * first child is an h3 AND which contains a select-trigger (the app's own
   * theme picker — the most stable literal on that page). Styling borrows the
   * app's own utility classes so the section reads as native settings UI. */
  let settingsSection = null;

  function findAppearanceContainer() {
    for (const trigger of document.querySelectorAll('[data-slot="select-trigger"]')) {
      /* the appearance page's section stack (verified in the bundle):
         div.min-w-0.space-y-3 > [div>h3+p, Card(bg-card)>rows…, div>h3, Card…]
         — climb from the theme select to that stack, then confirm its shape */
      const container = trigger.closest('[class*="space-y-3"]');
      if (container && container.querySelector('h3')
        && container.contains(trigger)
        && container.querySelector('[class*="bg-card"]')) {
        return container;
      }
    }
    return null;
  }

  function buildSettingsSection() {
    settingsSection = el('section', 'zone-settings');
    settingsSection.setAttribute('data-zone-settings', '');
    settingsSection.setAttribute('aria-label', zh ? 'ZONE 皮肤' : 'ZONE skin');

    const head = el('div');
    head.appendChild(el('h3', 'text-ui-lg font-semibold text-foreground', zh ? 'ZONE 皮肤' : 'ZONE skin'));
    head.appendChild(el('p', 'mt-1 text-ui-base leading-6 text-foreground-subtle',
      zh ? '黑橙硬件风：石墨机身、四套配色、半调网点与指针透镜。快捷键 Ctrl+Alt+Z 换配色、Ctrl+Alt+X 换画布。'
        : 'Black-and-orange hardware styling: four colorways, halftone sheet, pointer lens. Ctrl+Alt+Z colorway, Ctrl+Alt+X canvas.'));
    settingsSection.appendChild(head);

    const card = el('div', 'zone-settings-card');
    card.appendChild(buildSettingRow(zh ? '配色' : 'Colorway',
      rowOf(COLORWAY_ORDER, (key) => ({
        swatch: brandOf(key, modeOf()),
        label: label(COLORWAY_LABEL, key),
      }), (key) => update({ colorway: key }), () => prefs.colorway)));
    card.appendChild(buildSettingRow(zh ? '画布' : 'Canvas',
      rowOf(CANVAS_ORDER, (key) => ({ swatch: null, label: label(CANVAS_LABEL, key) }),
        (key) => update({ canvas: key }), () => prefs.canvas)));
    card.appendChild(buildSettingRow(zh ? '动效' : 'Motion',
      rowOf(MOTION_ORDER, (key) => ({ swatch: null, label: label(MOTION_LABEL, key) }),
        (key) => update({ motion: key }), () => prefs.motion)));
    card.appendChild(buildSwitchRow());
    settingsSection.appendChild(card);

    settingsSection.appendChild(buildDeviceBar());
  }

  function rowOf(order, describe, onPick, getActive) {
    const group = el('div', 'zone-settings-control');
    group.setAttribute('role', 'group');
    const refs = { order, describe, onPick, getActive, group, buttons: new Map() };
    settingRowRefs.push(refs);
    return group;
  }

  function buildSettingRow(labelText, control) {
    const row = el('div', 'zone-settings-row');
    row.appendChild(el('span', 'zone-settings-label', labelText));
    row.appendChild(control);
    return row;
  }

  function buildSwitchRow() {
    const row = el('div', 'zone-settings-row');
    row.appendChild(el('span', 'zone-settings-label', zh ? '半调网点' : 'Halftone'));
    const switchButton = el('button', 'zone-switch');
    switchButton.type = 'button';
    switchButton.setAttribute('role', 'switch');
    switchButton.setAttribute('aria-label', zh ? '半调网点' : 'Halftone texture');
    switchButton.appendChild(el('span', 'zone-toggle-track'));
    switchButton.addEventListener('click', () => update({ dots: !prefs.dots }));
    row.appendChild(switchButton);
    settingRowRefs.push({ key: 'dots', switchButton });
    return row;
  }

  function buildDeviceBar() {
    const bar = el('div', 'zone-bar');
    bar.setAttribute('aria-hidden', 'true');
    const live = el('span', 'zone-live');
    live.appendChild(el('span', 'zone-led'));
    live.appendChild(document.createTextNode(zh ? '在线' : 'Live'));
    bar.appendChild(live);
    bar.appendChild(el('span', 'zone-tape'));
    bar.appendChild(el('span', 'zone-id', 'ZONE/01 ' + REV));
    bar.appendChild(el('span', 'zone-sheet', sheetId()));
    return bar;
  }

  /* The device bar's sheet id: the window title's first six characters, so a
     glance tells which conversation the skin is riding on. */
  function sheetId() {
    const title = String(document.title || '').trim();
    const cleaned = title === 'ZCode' || title === '' ? '' : title;
    return cleaned.slice(0, 6).toUpperCase() || '------';
  }

  /* Scan loop: attach the section when the appearance page is open and the
     node is detached (first open, or after a React re-render dropped it). */
  function trackSettingsSection() {
    window.setInterval(() => {
      if (!settingsSection || settingsSection.isConnected) return;
      const container = findAppearanceContainer();
      if (container) container.appendChild(settingsSection);
    }, 800);
    window.setTimeout(() => { /* first attempt after settings could be open */
      const container = findAppearanceContainer();
      if (container && settingsSection && !settingsSection.isConnected) container.appendChild(settingsSection);
    }, 500);
  }

  const settingRowRefs = [];

  function renderSettings() {
    if (!settingsSection) return;
    for (const refs of settingRowRefs) {
      if (refs.group) {
        for (const key of refs.order) {
          let button = refs.buttons.get(key);
          const info = refs.describe(key);
          if (!button) {
            button = el('button', 'zone-btn');
            button.type = 'button';
            if (info.swatch) button.appendChild(el('span', 'zone-dot'));
            button.appendChild(document.createTextNode(''));
            button.addEventListener('click', () => refs.onPick(key));
            refs.group.appendChild(button);
            refs.buttons.set(key, button);
          }
          button.lastChild.textContent = info.label;
          const dot = button.querySelector('.zone-dot');
          if (dot) dot.style.setProperty('--zone-swatch', info.swatch);
          if (refs.getActive() === key) button.setAttribute('aria-pressed', 'true');
          else button.removeAttribute('aria-pressed');
        }
      }
      if (refs.switchButton) refs.switchButton.setAttribute('aria-checked', String(prefs.dots));
    }
    const sheet = settingsSection.querySelector('.zone-sheet');
    if (sheet) sheet.textContent = sheetId();
  }

  /* ----------------------------------------------------------- atmosphere */

  let atmosphere = null;

  /* The conversation frame is the skin's anchor: the app marks it with a
     literal data attribute. Measured on resize, on frame resize and on a slow
     poll (a sidebar toggle moves the frame without resizing it). A signature
     check keeps the layout reads down. */
  function buildAtmosphere() {
    atmosphere = el('div', 'zone-atmosphere');
    atmosphere.setAttribute('aria-hidden', 'true');
    atmosphere.appendChild(el('div', 'zone-cast'));
    atmosphere.appendChild(el('div', 'zone-cast-top'));
    atmosphere.appendChild(el('div', 'zone-halftone'));
    const trail = document.createElement('canvas');
    trail.className = 'zone-trail';
    atmosphere.appendChild(trail);
    const hot = el('div', 'zone-halftone-hot zone-lens');
    atmosphere.appendChild(hot);
    for (const corner of ['tl', 'tr', 'bl', 'br']) {
      atmosphere.appendChild(el('span', 'zone-tick zone-tick-' + corner));
    }
    (document.body || document.documentElement).appendChild(atmosphere);

    /* intro: the brackets fade in once per load */
    if (effectiveMotion() === 'full') {
      atmosphere.setAttribute('data-zone-intro', 'yes');
      window.setTimeout(() => atmosphere.removeAttribute('data-zone-intro'), 1500);
    }

    trackFrame();
    trackPointer(atmosphere, trail, hot);
  }

  function trackFrame() {
    const root = document.documentElement;
    const names = ['--zone-frame-left', '--zone-frame-top', '--zone-frame-width',
      '--zone-frame-height', '--zone-frame-radius', '--zone-content-top',
      '--zone-composer-top'];
    let frame = null;
    let observer = null;
    let frameRequest = 0;
    let signature = '';

    /* The frame anchor is hot-tunable from zone.css: the live sheet may set
       --zone-frame-strategy to pick one, so a wrong anchor costs a CSS edit,
       never another app restart.
         auto    [data-workspace-conversation-frame] || main || body
         frame   [data-workspace-conversation-frame] only
         main    main only
         sidebar synthesize from the sidebar panel's right edge (full height)
       --zone-content-offset adds px to the measured content top. */
    const strategyOf = () => {
      const value = (getComputedStyle(root).getPropertyValue('--zone-frame-strategy') || '').trim();
      return ['auto', 'frame', 'main', 'sidebar'].includes(value) ? value : 'auto';
    };

    const findFrame = () => {
      const strategy = strategyOf();
      if (strategy === 'frame') {
        return document.querySelector('[data-workspace-conversation-frame]') || null;
      }
      if (strategy === 'main') {
        return document.querySelector('main') || null;
      }
      if (strategy === 'sidebar') {
        const sidebar = document.querySelector('[data-project-sidebar-panel]');
        if (!sidebar) return null;
        return { synthetic: true, right: sidebar.getBoundingClientRect().right };
      }
      return document.querySelector('[data-workspace-conversation-frame]')
        || document.querySelector('main')
        || document.body;
    };

    const apply = () => {
      frameRequest = 0;
      const next = findFrame();
      if (next !== frame) {
        frame = next;
        if (observer) observer.disconnect();
        if (observer && frame && frame.getBoundingClientRect) observer.observe(frame);
      }
      if (!frame) return;
      let rect;
      let scope;
      let radius;
      if (frame.synthetic) {
        const sidebar = document.querySelector('[data-project-sidebar-panel]');
        if (!sidebar) return;
        const edge = sidebar.getBoundingClientRect().right;
        rect = { left: edge, top: 0, width: window.innerWidth - edge, height: window.innerHeight };
        scope = document;
        radius = '0px';
      } else {
        rect = frame.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        scope = frame;
        radius = getComputedStyle(frame).borderTopLeftRadius || '0px';
      }
      /* Where the sheet's content starts: below the title row and the tab
         strip. Two anchors, take the deeper:
         - the TALL [data-slot="scroll-area-viewport"] in scope = the message
           scroller. The FIRST viewport found may be the tab strip's own
           horizontal scroller at the top (v3 measured that one and the
           brackets landed on the title chrome);
         - the frame-scoped [role="tab"] pills' lowest bottom = literally
           "below the top tabs".
         --zone-content-offset (live CSS) shifts the line on top of both. */
      const anchors = [];
      let tallViewport = null;
      for (const viewport of scope.querySelectorAll('[data-slot="scroll-area-viewport"]')) {
        const box = viewport.getBoundingClientRect();
        if (box.height > 120 && (!tallViewport || box.height > tallViewport.height)) {
          tallViewport = { top: box.top, height: box.height };
        }
      }
      if (tallViewport) anchors.push(tallViewport.top);
      let tabBottom = null;
      for (const tab of scope.querySelectorAll('[role="tab"]')) {
        const box = tab.getBoundingClientRect();
        if (tabBottom === null || box.bottom > tabBottom) tabBottom = box.bottom;
      }
      if (tabBottom !== null) anchors.push(tabBottom);
      /* main's top edge: the live census (2026-11-06) showed the app has
         neither scroll-area viewports nor role=tab — main IS the message
         column, its top sits 49px under the frame top (the title row). This
         anchor self-adapts when the title row height changes. Height-guarded
         so a stray small <main> cannot drag the line up; when main IS the
         frame (testbed) it contributes 0 and the other anchors win. */
      const mainEl = (scope === document ? document : frame).querySelector('main');
      if (mainEl) {
        const mainBox = mainEl.getBoundingClientRect();
        if (mainBox.height > 120) anchors.push(mainBox.top);
      }
      const contentOffset = parseFloat(getComputedStyle(root).getPropertyValue('--zone-content-offset')) || 0;
      const contentTop = (anchors.length
        ? Math.max(0, Math.round(Math.max(...anchors) - rect.top))
        : 0) + Math.round(contentOffset);
      /* The composer card's top edge, viewport-relative: the console panel
         opens upward and clamps its bottom above this line (see zone.css), so
         the drawer never covers the input card's first characters. Falls back
         to the viewport height — i.e. no clamp — when no composer is mounted. */
      const composer = document.querySelector('.chat-composer-input-surface');
      const composerTop = composer ? Math.round(composer.getBoundingClientRect().top) : window.innerHeight;
      const current = rect.left + ',' + rect.top + ',' + rect.width + ',' + rect.height
        + ',' + radius + ',' + contentTop + ',' + composerTop;
      if (current === signature) return;
      signature = current;
      /* geometry changed (session mounted, pane toggled, strategy flipped):
         tell the dev server what the atmosphere landed on */
      reportBeacon('geometry');
      root.style.setProperty(names[0], Math.round(rect.left) + 'px');
      root.style.setProperty(names[1], Math.round(rect.top) + 'px');
      root.style.setProperty(names[2], Math.round(rect.width) + 'px');
      root.style.setProperty(names[3], Math.round(rect.height) + 'px');
      root.style.setProperty(names[4], radius);
      root.style.setProperty(names[5], contentTop + 'px');
      root.style.setProperty(names[6], composerTop + 'px');
    };

    const queue = () => { if (!frameRequest) frameRequest = window.requestAnimationFrame(apply); };

    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(queue);
      frame = findFrame();
      if (frame && frame.getBoundingClientRect) observer.observe(frame);
    }
    apply();
    window.addEventListener('resize', queue);
    window.setInterval(queue, 1000);
    /* The frame mounts long after the document on a cold start. */
    window.setTimeout(apply, 300);
    window.setTimeout(apply, 1500);
    window.setTimeout(apply, 4000);
  }

  /* Pointer lens + wake. The head is written from the pointer event itself —
     no follower easing — so the mask circle is under the cursor at the next
     paint. The wake is a canvas: the same 4px squares on the same 7px grid,
     stamped wherever the pointer crosses a cell and faded every frame, so a
     sweep keeps drawing a dotted line behind the cursor and that line then
     dissolves over about a second. The lens lights the sheet's chat band
     only: below the frame's content top and above the composer surface.
     Motion "off" (and the system reduced-motion preference, which maps to
     it) leaves both parked. The binding restarts whenever the palette flips
     so the wake colour follows the colorway/canvas. */
  function trackPointer(layer, canvas, head) {
    const context = canvas.getContext && canvas.getContext('2d');
    let binding = '';
    let teardown = null;

    const PITCH = 7;      // the halftone tile, in CSS px
    const INSET = 1.5;    // square offset inside the tile
    const DOT = 4;        // square side
    const BRUSH = 100;    // the head's mask radius: wake and head are one size
    const STEP = 16;      // px between samples along a segment
    const LIFE = 1100;    // ms a dot stays lit, then it is exactly gone
    const CORE = 0.085;   // peak alpha, held under the head's 10%
    const LEVELS = 32;    // alpha steps from the brush centre to nothing
    const JUMP = 160;     // a longer gap between samples is not a line
    const KEEP = 640;     // samples retained, so a flick cannot grow it

    const bind = () => {
      const key = effectiveMotion() + '|' + prefs.dots + '|' + prefs.colorway + '|' + modeOf();
      if (key === binding) return;
      if (teardown) { teardown(); teardown = null; }
      binding = key;
      if (effectiveMotion() === 'off' || !prefs.dots) {
        layer.setAttribute('data-zone-lens', 'off');
        head.style.removeProperty('--zone-pointer-x');
        head.style.removeProperty('--zone-pointer-y');
        if (context) context.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      /* The wake is re-drawn from the sample list every frame instead of being
         accumulated into the bitmap and faded. That is what lets it reach the
         background exactly: a cell takes the level of the freshest sample over
         it, and once that sample is older than LIFE the cell is simply not
         painted. A self-fading canvas cannot do this — 8-bit alpha bottoms out
         at 1/255, so the ghost never leaves. */
      const WAKE = brandOf(prefs.colorway, modeOf());
      /* The ramp starts at zero. A floor on the first step paints the brush's
         faint rim at a third of full strength, which draws a hard ring at the
         edge of the wake and walks it inward as the cells fade. Linear steps
         dim the whole cross-section together instead. */
      const RAMP = Array.from({ length: LEVELS }, (_, index) => rgba(
        WAKE,
        ((CORE * index) / (LEVELS - 1)).toFixed(4),
      ));
      /* The head's own mask curve, tabulated once: opaque at the centre, 55%
         at 46% of the radius, nothing at the rim. Reusing it keeps the wake
         and the head the same object — same size, same soft edge — and the
         peak sits below the head's 10% so the wake can never out-shine what
         draws it. */
      const CURVE = new Float32Array(65);
      for (let index = 0; index <= 64; index += 1) {
        const d = Math.sqrt(1 - index / 64);
        CURVE[index] = d <= 0.46
          ? 1 - (0.45 / 0.46) * d
          : 0.55 * (1 - (d - 0.46) / 0.54);
      }

      let rect = layer.getBoundingClientRect();
      let dpr = 0;
      let cols = 0;
      let rows = 0;
      let levels = new Uint8Array(0);
      let touched = new Int32Array(0);
      let ordered = new Int32Array(0);
      const counts = new Int32Array(LEVELS);
      const starts = new Int32Array(LEVELS);
      const filled = new Int32Array(LEVELS);
      let frame = 0;
      let fromX = null;
      let fromY = null;
      let active = false;
      const samples = [];

      const size = () => {
        rect = layer.getBoundingClientRect();
        const next = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.round(rect.width * next));
        const height = Math.max(1, Math.round(rect.height * next));
        if (next === dpr && canvas.width === width && canvas.height === height) return;
        dpr = next;
        canvas.width = width;
        canvas.height = height;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        /* New bitmap, new grid: the old samples belong to the old geometry. */
        cols = Math.ceil(rect.width / PITCH) + 1;
        rows = Math.ceil(rect.height / PITCH) + 1;
        levels = new Uint8Array(cols * rows);
        touched = new Int32Array(cols * rows);
        ordered = new Int32Array(cols * rows);
        samples.length = 0;
        context.clearRect(0, 0, rect.width, rect.height);
      };
      size();

      const push = (x, y, at) => {
        samples.push({ x, y, at });
        if (samples.length > KEEP) samples.splice(0, samples.length - KEEP);
      };

      /* Clear, drop the expired samples, then paint every grid cell once at
         the level of the freshest sample covering it — a cell crossed twice is
         not brighter than one crossed once, and an expired cell is left at
         background. Cells are grouped by level and filled one path per level:
         a 100px brush covers ~640 cells and ~40k fillRect calls per second
         would cost more than the picture is worth. */
      const draw = () => {
        context.clearRect(0, 0, rect.width, rect.height);
        const now = performance.now();
        let expired = 0;
        while (expired < samples.length && now - samples[expired].at >= LIFE) expired += 1;
        if (expired) samples.splice(0, expired);
        if (!samples.length) return;
        const limit = BRUSH * BRUSH;
        let count = 0;
        for (let index = 0; index < samples.length; index += 1) {
          const sample = samples[index];
          const age = 1 - (now - sample.at) / LIFE;
          if (age <= 0) continue;
          /* Age 1 → 0 over LIFE; the 0.6 exponent keeps the near tail from
             washing out at once, then still lands on 0 at LIFE. */
          const fade = Math.pow(age, 0.6);
          const first = Math.floor((sample.x - BRUSH) / PITCH);
          const last = Math.floor((sample.x + BRUSH) / PITCH);
          const topRow = Math.floor((sample.y - BRUSH) / PITCH);
          const bottomRow = Math.floor((sample.y + BRUSH) / PITCH);
          for (let col = first; col <= last; col += 1) {
            for (let row = topRow; row <= bottomRow; row += 1) {
              const cx = col * PITCH + INSET + DOT / 2;
              const cy = row * PITCH + INSET + DOT / 2;
              const dx = cx - sample.x;
              const dy = cy - sample.y;
              const d2 = dx * dx + dy * dy;
              if (d2 > limit) continue;
              const curve = CURVE[Math.min(64, Math.floor((1 - d2 / limit) * 64))];
              const level = Math.round(curve * fade * (LEVELS - 1));
              if (level <= 0) continue;
              const cell = row * cols + col;
              if (levels[cell] >= level) continue;
              if (levels[cell] === 0) touched[count++] = cell;
              levels[cell] = level;
            }
          }
        }
        if (!count) return;
        /* Counting sort by level so each level paints as a single path. */
        counts.fill(0);
        for (let index = 0; index < count; index += 1) counts[levels[touched[index]]] += 1;
        let offset = 0;
        for (let level = 1; level < LEVELS; level += 1) {
          starts[level] = offset;
          offset += counts[level];
        }
        filled.fill(0);
        for (let index = 0; index < count; index += 1) {
          const cell = touched[index];
          const level = levels[cell];
          ordered[starts[level] + filled[level]] = cell;
          filled[level] += 1;
          levels[cell] = 0;
        }
        for (let level = 1; level < LEVELS; level += 1) {
          const sizeAtLevel = counts[level];
          if (!sizeAtLevel) continue;
          context.beginPath();
          for (let index = starts[level]; index < starts[level] + sizeAtLevel; index += 1) {
            const cell = ordered[index];
            const col = cell % cols;
            const row = (cell - col) / cols;
            context.rect(col * PITCH + INSET, row * PITCH + INSET, DOT, DOT);
          }
          context.fillStyle = RAMP[level];
          context.fill();
        }
      };

      const tick = () => {
        frame = 0;
        draw();
        if (samples.length) frame = window.requestAnimationFrame(tick);
      };

      /* The chat band: inside the frame, below the content top, above the
         composer card. Above the composer the sheet ends and the device deck
         begins, so the lens fades out where it stands. */
      const inChat = (x, y) => {
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return false;
        const contentTop = readContentTop();
        if (y < rect.top + contentTop) return false;
        const composer = document.querySelector('.chat-composer-input-surface');
        const bottom = composer ? composer.getBoundingClientRect().top : rect.bottom;
        return y < bottom;
      };
      const readContentTop = () => {
        const value = getComputedStyle(document.documentElement)
          .getPropertyValue('--zone-content-top');
        return parseFloat(value) || 0;
      };

      const onMove = (event) => {
        if (!inChat(event.clientX, event.clientY)) {
          if (active) {
            active = false;
            fromX = null;
            layer.setAttribute('data-zone-lens', 'off');
          }
          return;
        }
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        /* The head is exact: written where the pointer is, not eased toward
           it, so the lit dots never lag the mouse. */
        head.style.setProperty('--zone-pointer-x', Math.round(x) + 'px');
        head.style.setProperty('--zone-pointer-y', Math.round(y) + 'px');
        if (!active) {
          /* Entering the chat: start the wake at the cursor so the jump-in
             does not rule a line across the sheet. */
          active = true;
          fromX = x;
          fromY = y;
          layer.removeAttribute('data-zone-lens');
        }
        if (fromX === null) {
          fromX = x;
          fromY = y;
        }
        const dx = x - fromX;
        const dy = y - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 1) return;
        const at = performance.now();
        if (distance > JUMP) {
          push(x, y, at);
        } else {
          const steps = Math.max(1, Math.ceil(distance / STEP));
          for (let index = 1; index <= steps; index += 1) {
            push(fromX + (dx * index) / steps, fromY + (dy * index) / steps, at);
          }
        }
        fromX = x;
        fromY = y;
        if (!frame) frame = window.requestAnimationFrame(tick);
      };

      const observer = typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => size())
        : null;
      if (observer) observer.observe(layer);
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('resize', size);
      const poll = window.setInterval(size, 1000);

      teardown = () => {
        window.clearInterval(poll);
        window.removeEventListener('resize', size);
        window.removeEventListener('pointermove', onMove);
        if (observer) observer.disconnect();
        if (frame) window.cancelAnimationFrame(frame);
        layer.removeAttribute('data-zone-lens');
        head.style.removeProperty('--zone-pointer-x');
        head.style.removeProperty('--zone-pointer-y');
        if (context) context.clearRect(0, 0, canvas.width, canvas.height);
      };
    };

    bind();
    subscribe(bind);
  }

  /* The active project: the selected session belongs to the LAST project
     header that precedes it in DOCUMENT order. querySelectorAll returns
     nodes in document order regardless of nesting — the virtualized sidebar
     wraps rows freely, so sibling walks are not reliable (v2 learned this on
     the real DOM: a wrapper between the header and the row breaks the chain).
     CSS cannot walk previous siblings at all, so the boot tags the owner with
     data-zone-active and zone.css tints only the tag. The scan is one
     querySelectorAll over a handful of nodes; it writes only on change, and a
     capture-phase click listener re-runs it right after any sidebar click. */
  function trackActiveProject() {
    const MARK = 'data-zone-active';
    const ALL = '[class~="group/project-row"],'
      + '[class~="group/task-item"].bg-selected,'
      + '[class~="group/task-row"].bg-selected';
    let owner = null;
    const scan = () => {
      let header = null;
      let next = null;
      for (const node of document.querySelectorAll(ALL)) {
        if ((node.getAttribute('class') || '').split(/\s+/).includes('group/project-row')) {
          header = node;
        } else {
          next = header;
          break;
        }
      }
      if (next === owner) return;
      for (const marked of document.querySelectorAll('[' + MARK + ']')) marked.removeAttribute(MARK);
      if (next) next.setAttribute(MARK, '');
      owner = next;
    };
    window.setInterval(scan, 400);
    document.addEventListener('click', () => { window.setTimeout(scan, 60); }, true);
    window.setTimeout(scan, 300);
    window.setTimeout(scan, 1500);
    window.setTimeout(scan, 4000);
  }

  /* ----------------------------------------------------------- live skin */
  /* Hot-reload loop for development. The packaged zone.css/zone-boot.js ride
   *  inside app.asar and a full app restart costs minutes — so while the dev
   *  server (testbed/serve.mjs, default port 8472) is running, the boot polls
   *  it every 2s:
   *    - CSS changed  → a cache-busted <link> swaps the stylesheet; tokens
   *      are live custom properties, so recolouring applies instantly with
   *      no reload and no state loss.
   *    - JS changed   → the window reloads itself (seconds, not an app
   *      restart). Only ever happens while the dev server is up.
   *  TRANSPORT: the renderer page is file://, and Chromium blocks fetch/XHR
   *  from file: documents to http URLs outright (the request never leaves the
   *  process — learned on the real app: the fetch-based v1 watcher was
   *  silently dead). So everything rides on resource tags, which file://
   *  pages may load cross-origin without CORS:
   *    /stamp.js → a <script> that sets window.__zoneStampInfo
   *    /zone.css → a <link rel=stylesheet> with a cache-busting ?v=
   *    /report   → an <img> beacon carrying diagnostics for the server log
   *  Server down → every probe errors immediately (connection refused), the
   *  packaged skin keeps running untouched; nothing leaves the machine. */
  const LIVE_BASE = 'http://127.0.0.1:8472';

  function watchLiveSkin() {
    let stamp = null;
    let jsSeen = null;
    let linkEl = null;
    const probe = () => {
      const node = document.createElement('script');
      node.src = LIVE_BASE + '/stamp.js?r=' + Date.now();
      node.onload = () => {
        node.remove();
        const info = window.__zoneStampInfo;
        if (!info || !info.stamp || info.stamp === stamp) return;
        const first = stamp === null;
        stamp = info.stamp;
        if (!linkEl) {
          linkEl = document.createElement('link');
          linkEl.rel = 'stylesheet';
          document.head.appendChild(linkEl);
        }
        linkEl.href = LIVE_BASE + '/zone.css?v=' + encodeURIComponent(info.css);
        if (window.ZONE_SKIN) window.ZONE_SKIN.live = stamp;
        if (!first && info.js !== jsSeen) {
          /* the boot script itself changed — swapping it needs a reload */
          window.location.reload();
          return;
        }
        jsSeen = info.js;
      };
      node.onerror = () => node.remove();
      document.head.appendChild(node);
    };
    probe();
    window.setInterval(probe, 2000);
  }

  /** Diagnostic beacon: sends the atmosphere's real measurements to the dev
   *  server's log (/report), so the skin can be tuned against the live app's
   *  DOM without a devtools round-trip. Fired at boot, every 15s, and on
   *  geometry changes; throttled to one per 5s. Only fires when the dev
   *  server is up (the <img> errors silently otherwise). */
  let lastBeaconAt = 0;
  function reportBeacon(extra) {
    const now = Date.now();
    if (now - lastBeaconAt < 5000) return;
    lastBeaconAt = now;
    const root = document.documentElement;
    const read = (name) => (getComputedStyle(root).getPropertyValue(name) || '').trim();
    const rectOf = (node) => {
      if (!node) return null;
      const box = node.getBoundingClientRect();
      return [Math.round(box.left), Math.round(box.top), Math.round(box.width), Math.round(box.height)];
    };
    const payload = {
      rev: REV,
      title: String(document.title || '').slice(0, 24),
      frameVars: ['--zone-frame-left', '--zone-frame-top', '--zone-frame-width', '--zone-frame-height',
        '--zone-content-top', '--zone-composer-top'].map(read),
      atmosphere: rectOf(document.querySelector('.zone-atmosphere')),
      tickTL: rectOf(document.querySelector('.zone-tick-tl')),
      /* anchor census: which candidate hooks actually exist in the live DOM */
      frames: [...document.querySelectorAll('[data-workspace-conversation-frame]')].slice(0, 3).map(rectOf),
      main: rectOf(document.querySelector('main')),
      sidebarPanel: rectOf(document.querySelector('[data-project-sidebar-panel]')),
      sideFrame: rectOf(document.querySelector('[data-workspace-side-frame]')),
      composer: rectOf(document.querySelector('.chat-composer-input-surface')),
      layoutCard: rectOf(document.querySelector('[data-composer-layout]')),
      viewports: [...document.querySelectorAll('[data-slot="scroll-area-viewport"]')]
        .slice(0, 6).map((v) => rectOf(v)),
      tabs: [...document.querySelectorAll('[data-workspace-conversation-frame] [role="tab"]')]
        .slice(0, 8).map((t) => rectOf(t)),
      extra: extra || null,
    };
    const img = document.createElement('img');
    img.src = LIVE_BASE + '/report?d=' + encodeURIComponent(JSON.stringify(payload));
    img.onload = () => img.remove();
    img.onerror = () => img.remove();
  }

  /* ---------------------------------------------------------------- probe */

  /** Opt-in DOM probe: localStorage['zcode-zone-skin:probe'] = '1', then
   *  restart. 2.5s later 'zcode-zone-skin:diag' holds a one-shot health
   *  report: boot rev, html classes, resolved tokens, the atmosphere/console
   *  rects, the composer surface, the user plate's computed colours, the
   *  frame measurement and the current prefs. It writes only that key and
   *  never mutates the document. */
  function probeOnce() {
    let enabled = false;
    try { enabled = window.localStorage.getItem(PROBE_FLAG) === '1'; } catch { /* off */ }
    if (!enabled) return;
    window.setTimeout(() => {
      const read = (target, name) => {
        try { return getComputedStyle(target).getPropertyValue(name).trim(); } catch { return null; }
      };
      const rectOf = (node) => {
        if (!node) return null;
        const box = node.getBoundingClientRect();
        return [Math.round(box.left), Math.round(box.top),
          Math.round(box.width), Math.round(box.height)];
      };
      const plate = document.querySelector('[data-v4-user-input-bubble]');
      const payload = {
        when: new Date().toISOString(),
        rev: REV,
        htmlClass: document.documentElement.className,
        attrs: {
          skin: document.documentElement.getAttribute('data-zone-skin'),
          colorway: document.documentElement.getAttribute('data-zone-colorway'),
          canvas: document.documentElement.getAttribute('data-zone-canvas'),
          motion: document.documentElement.getAttribute('data-zone-motion'),
          dots: document.documentElement.getAttribute('data-zone-dots'),
        },
        brandOnHtml: read(document.documentElement, '--zone-brand'),
        brandOnBody: read(document.body, '--zone-brand'),
        bubbleFill: read(document.documentElement, '--color-user-message-bubble'),
        background: read(document.documentElement, '--color-background'),
        prefs,
        atmosphere: rectOf(document.querySelector('.zone-atmosphere')),
        settingsSection: rectOf(document.querySelector('[data-zone-settings]')),
        frame: rectOf(document.querySelector('[data-workspace-conversation-frame]')),
        composer: rectOf(document.querySelector('.chat-composer-input-surface')),
        plate: plate ? { background: getComputedStyle(plate).backgroundColor, color: getComputedStyle(plate).color } : null,
        frameVars: ['--zone-frame-left', '--zone-frame-top', '--zone-frame-width',
          '--zone-frame-height', '--zone-content-top'].map((name) => read(document.documentElement, name)),
        cursorOnHtml: read(document.documentElement, '--zone-cursor'),
        viewport: [window.innerWidth, window.innerHeight],
        title: document.title,
      };
      try { window.localStorage.setItem(PROBE_KEY, JSON.stringify(payload)); } catch { /* full */ }
    }, 2500);
  }

  /* ----------------------------------------------------------------- boot */

  const start = () => {
    applyRoot();
    buildAtmosphere();
    buildSettingsSection();
    renderSettings();
    trackSettingsSection();
    trackActiveProject();
    watchLiveSkin();
    probeOnce();

    /* the title settles after boot; keep the device bar's sheet id honest */
    window.setInterval(() => { if (settingsSection && settingsSection.isConnected) renderSettings(); }, 4000);

    window.ZONE_SKIN = {
      rev: REV,
      getPrefs: () => ({ ...prefs }),
      update,
      subscribe,
      colorways: COLORWAY_ORDER,
      canvases: CANVAS_ORDER,
      motions: MOTION_ORDER,
    };

    /* recurring diagnostic beacons: the conversation view mounts seconds
       after boot (session restore), so one early shot catches nothing —
       report at 3s, then every 15s for ~4 minutes. No-op without the dev
       server. */
    let beacons = 0;
    const beaconTimer = window.setInterval(() => {
      beacons += 1;
      reportBeacon();
      if (beacons >= 17) window.clearInterval(beaconTimer);
    }, 15000);
    window.setTimeout(() => reportBeacon(), 3000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
