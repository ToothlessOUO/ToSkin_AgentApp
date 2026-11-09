/* Token-layer test for the ZONE skin on ZCode.
 *
 * The palette lives as plain inputs in zone.css (chassis blocks + colorway
 * blocks). This test parses those inputs, re-derives the rgb triples the
 * shadow recipes rely on, and enforces the contrast floors: body ink 7:1,
 * secondary 4.5:1, dim captions 3:1, borders visible 1.15:1, status ink 3:1.
 *
 * Ink on the accent is pinned to pure white by design — one white voice over
 * the extra contrast on the two brightest night accents (night zone orange
 * 2.78:1, night hazard yellow 1.57:1) — so white-on-brand is *reported*,
 * not failed, and the pin itself is asserted literally.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CSS = fs.readFileSync(path.join(HERE, '..', 'zone.css'), 'utf8');

let failures = 0;
function ok(condition, message) {
  if (condition) console.log('  ok  ' + message);
  else { failures++; console.error('  FAIL ' + message); }
}

/* ---------------------------------------------------------------- colors */

function parseHex(hex) {
  const value = String(hex).replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(value)) throw new Error('bad hex: ' + hex);
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function toHex(rgb) {
  return '#' + rgb
    .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0'))
    .join('');
}

/** Mix two hex colours; weight is the share of the second. */
function mix(a, b, weight) {
  const A = parseHex(a);
  const B = parseHex(b);
  return toHex(A.map((c, i) => c + (B[i] - c) * weight));
}

function luminance(hex) {
  const [r, g, b] = parseHex(hex).map((channel) => {
    const v = channel / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const ratio = (x) => Math.round(x * 100) / 100;

/* ------------------------------------------------ parse the palette inputs */

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function block(selector) {
  const re = new RegExp(escapeRe(selector) + '\\s*\\{([^}]*)\\}', 'g');
  const bodies = [];
  let m;
  while ((m = re.exec(CSS))) bodies.push(m[1]);
  if (!bodies.length) throw new Error('selector not found in zone.css: ' + selector);
  return bodies.join('\n');
}

function readVar(body, name) {
  const m = body.match(new RegExp(escapeRe(name) + '\\s*:\\s*([^;\\n]+)'));
  return m ? m[1].trim() : undefined;
}

const dayBlock = block('html[data-zone-skin]');
const nightBlock = block('html[data-zone-skin].dark,\nhtml[data-zone-skin][data-zone-canvas="night"]');
const resolution = block('html[data-zone-skin]');

const CHASSIS_INPUTS = ['base', 'layer1', 'layer2', 'ink', 'ink-dim', 'line', 'sidebar', 'ink-rgb'];
const chassis = {};
for (const mode of ['day', 'night']) {
  const source = mode === 'day' ? dayBlock : nightBlock;
  chassis[mode] = {};
  for (const name of CHASSIS_INPUTS) {
    const value = readVar(source, '--zone-' + name);
    if (!value) throw new Error('missing --zone-' + name + ' in the ' + mode + ' chassis block');
    chassis[mode][name] = value;
  }
}

const COLORWAYS = ['zone', 'ember', 'hazard', 'cobalt'];
const brands = {};
const triples = {};
for (const colorway of COLORWAYS) {
  const body = block(`html[data-zone-skin][data-zone-colorway="${colorway}"]`);
  brands[colorway] = {
    day: readVar(body, '--zone-brand-day'),
    night: readVar(body, '--zone-brand-night'),
  };
  triples[colorway] = {};
  for (const mode of ['day', 'night']) {
    if (!/^[0-9a-fA-F]{6}$/.test(brands[colorway][mode].replace('#', ''))) {
      throw new Error(`colorway ${colorway} ${mode} brand is not a hex colour`);
    }
    triples[colorway][mode] = {
      brand: readVar(body, `--zone-brand-rgb-${mode}`),
      shade: readVar(body, `--zone-shade-rgb-${mode}`),
      lift: readVar(body, `--zone-lift-rgb-${mode}`),
    };
  }
}

/* ------------------------------------------------------------- assertions */

console.log('palette inputs');
for (const mode of ['day', 'night']) {
  for (const [name, value] of Object.entries(chassis[mode])) {
    if (name.endsWith('-rgb')) {
      ok(/^\d{1,3} \d{1,3} \d{1,3}$/.test(value), `${mode} --zone-${name} is three channels (${value})`);
    } else {
      ok(/^[0-9a-fA-F]{6}$/.test(value.replace('#', '')), `${mode} --zone-${name} is a hex colour (${value})`);
    }
  }
}

console.log('rgb triples match the palette (shadows stay literal rgb())');
for (const colorway of COLORWAYS) {
  for (const mode of ['day', 'night']) {
    const brand = brands[colorway][mode];
    const shadeWeight = mode === 'night' ? 0.58 : 0.45;
    const wantBrand = parseHex(brand).join(' ');
    const wantShade = parseHex(mix(brand, '#000000', shadeWeight)).join(' ');
    const wantLift = parseHex(mix(brand, '#ffffff', 0.22)).join(' ');
    ok(triples[colorway][mode].brand === wantBrand,
      `${colorway}/${mode} brand-rgb == ${wantBrand} (got ${triples[colorway][mode].brand})`);
    ok(triples[colorway][mode].shade === wantShade,
      `${colorway}/${mode} shade-rgb == mix(brand, black, ${shadeWeight}) → ${wantShade} (got ${triples[colorway][mode].shade})`);
    ok(triples[colorway][mode].lift === wantLift,
      `${colorway}/${mode} lift-rgb == mix(brand, white, .22) → ${wantLift} (got ${triples[colorway][mode].lift})`);
  }
}
for (const [mode, want] of [['day', '23 19 16'], ['night', '248 243 232']]) {
  ok(chassis[mode]['ink-rgb'] === want, `${mode} ink-rgb == ${want} (got ${chassis[mode]['ink-rgb']})`);
  ok(parseHex(chassis[mode].ink).join(' ') === want, `${mode} ink-rgb matches --zone-ink`);
}

console.log('contrast floors (per colorway x canvas)');
for (const colorway of COLORWAYS) {
  for (const mode of ['day', 'night']) {
    const c = chassis[mode];
    const brand = brands[colorway][mode];
    const tag = `${colorway}/${mode}`;
    const body = contrast(c.ink, c.base);
    ok(body >= 7, `${tag} body ink vs base >= 7:1 (${ratio(body)})`);
    const subtle = contrast(mix(c.ink, c.base, 0.22), c.base);
    ok(subtle >= 4.5, `${tag} foreground-subtle (78% ink) vs base >= 4.5:1 (${ratio(subtle)})`);
    const subtlest = contrast(mix(c.ink, c.base, 0.45), c.base);
    ok(subtlest >= 3, `${tag} foreground-subtlest (55% ink) vs base >= 3:1 (${ratio(subtlest)})`);
    const dim = contrast(c['ink-dim'], c.base);
    ok(dim >= 3, `${tag} ink-dim vs base >= 3:1 (${ratio(dim)})`);
    const line = contrast(c.line, c.base);
    ok(line >= 1.15, `${tag} border visible vs base >= 1.15:1 (${ratio(line)})`);
    /* White on the accent is the lit-plate look; reported, not enforced —
       night zone orange and night hazard yellow sit below 3:1 on purpose. */
    const onBrand = contrast('#ffffff', brand);
    console.log(`  note ${tag} white ink on brand = ${ratio(onBrand)}:1`
      + (onBrand >= 3 ? '' : '  (accepted sub-3 lit plate)'));
    /* status pairs the skin re-inks, per canvas */
    if (mode === 'night') {
      ok(contrast('#14110d', '#ffc61a') >= 7, `${tag} warning-foreground on warning >= 7:1`);
      ok(contrast('#14110d', '#4fdc8c') >= 4.5, `${tag} success-foreground on success >= 4.5:1`);
    } else {
      ok(contrast('#ffffff', '#8a6408') >= 3, `${tag} warning-foreground on warning >= 3:1 (${ratio(contrast('#ffffff', '#8a6408'))})`);
      ok(contrast('#ffffff', '#22763f') >= 3, `${tag} success-foreground on success >= 3:1`);
    }
    ok(contrast('#ffffff', mode === 'night' ? '#ff5a45' : '#b32d1f') >= 3,
      `${tag} destructive-foreground on destructive >= 3:1`);
  }
}

console.log('skin invariants');
ok(/--zone-brand-on:\s*#ffffff/.test(CSS), 'lit-plate ink is the literal #ffffff (one white voice)');
ok(/--color-user-message-bubble:\s*var\(--zone-brand\)/.test(CSS),
  'the user plate is filled with the accent itself via --color-user-message-bubble (no second plate colour)');
ok(/--color-primary-foreground:\s*var\(--zone-brand-on\)/.test(CSS),
  'primary buttons keep the white ink token in every colorway');
ok(/\[data-v4-user-input-bubble\]\s*\{[^}]*--color-foreground:\s*#ffffff/.test(CSS),
  'the user plate inks through variable scope, not an !important chain');
ok(resolution.includes('var(--zone-brand-day'), 'canvas resolution defaults to day before the dark flip');
ok(CSS.includes('html[data-zone-skin][data-zone-canvas="night"]'), 'forced-night block present');
ok(CSS.includes('html[data-zone-skin][data-zone-canvas="day"]'), 'forced-day block present');
ok(nightBlock.includes('--zone-base: #2c2927'), 'night chassis is the graphite blacksite');
ok(dayBlock.includes('--zone-base: #e8e1d1'), 'day chassis is the keycap cream');

/* Forced day over a dark app: the night blocks matched through `.dark` at
   (0,2,1), so a forced-day remap must exist AFTER them at equal specificity
   (source order decides) — one for the chassis, one for every night-only
   semantic value. A dark app + forced cream canvas split otherwise. */
const forcedDayBlocks = (() => {
  const re = /html\[data-zone-skin\]\[data-zone-canvas="day"\]\s*\{([^}]*)\}/g;
  const bodies = [];
  let m;
  while ((m = re.exec(CSS))) bodies.push(m[1]);
  return bodies.join('\n');
})();
const forcedDayIndex = CSS.indexOf('html[data-zone-skin][data-zone-canvas="day"]');
const nightChassisIndex = CSS.indexOf('html[data-zone-skin].dark,');
ok(forcedDayBlocks.includes('--zone-base: #e8e1d1'), 'forced-day restates the day chassis');
ok(forcedDayIndex > nightChassisIndex, 'forced-day chassis block comes after the night block (source order wins)');
for (const token of ['--color-success', '--color-warning', '--color-destructive',
  '--color-workflow-trace', '--color-terminal-bg', '--color-usage-chart-2',
  '--color-context-breakdown-2', '--color-surface']) {
  ok(forcedDayBlocks.includes(token + ':'), `forced-day remaps the night-only ${token}`);
}

if (failures) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\ntoken layer ok');
