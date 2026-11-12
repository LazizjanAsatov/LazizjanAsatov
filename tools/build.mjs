// Builds the full GitHub profile README ("Made of rain") : assets/*.svg and README.md.
//   python tools/prep.py <picture> [crop]     (only when the picture changes; writes tools/prep.json)
//   node tools/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(fs.readFileSync(path.join(HERE, 'prep.json'), 'utf8'));
const OUT = path.join(HERE, '..', 'assets');
fs.mkdirSync(OUT, { recursive: true });

/* ---------- content (all wording is a draft for the owner to review) ---------- */
const ME = {
  name: 'Lazizjon Asatov',
  role: 'software engineer',
  tags: 'automation · desktop · mobile · web',
  now: ['I automate the work nobody wants to do, and build the apps around it.', 'Right now: payment tooling in Rust and Python, and an iOS app in Swift.'],
  stack: ['RUST', 'PYTHON', 'SWIFT', 'TYPESCRIPT'],
  place: 'Riga, Latvia',
  account: 'LazizjanAsatov',
  // what I build: [long key, short key (phone), tools, note]
  build: [
    ['automation + bots', 'automation', 'Python · Django · Jira · Telegram', ''],
    ['desktop apps', 'desktop', 'Rust', ''],
    ['mobile apps', 'mobile', 'Swift', ''],
    ['web', 'web', 'TypeScript · Django', ''],
    ['games', 'games', 'TypeScript', ''],
    ['data + analysis', 'data', 'Python · R · MATLAB', '# where I started'],
  ],
  links: [
    ['linkedin', 'https://www.linkedin.com/in/lazizjon-asatov/'],
    ['telegram', 'https://t.me/IamLazizjon'],
    ['youtube', 'https://www.youtube.com/@Lazizjon.Asatov'],
    ['x', 'https://x.com/LazizjonAsatov'],
    ['instagram', 'https://www.instagram.com/iamlazizjon/'],
  ],
};
const LABEL = `${ME.name}, ${ME.role} in ${ME.place}. Automation, desktop, mobile and web. Rust, Python, Swift, TypeScript.`;

/* ---------- shared pieces ---------- */
const C = { bg: '#020805', panel: '#04100a', line: '#11472a', dim: '#27935a', mid: '#6fdca0', green: '#19f07a', hi: '#dcffea' };
const MONO = "Consolas,'SFMono-Regular',Menlo,'DejaVu Sans Mono','Liberation Mono',monospace";
// No XML-special characters here (< > &): the glyphs are written into the SVG as they are.
const GLYPHS = Array.from('ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ0123456789:=*+-|');
const rng = (seed) => { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const n1 = (v) => String(Math.round(v * 10) / 10);
const svg = (w, h, label, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>`;

// Falling glyph columns. Each head starts at the top of its region and travels far enough that the loop
// restart happens out of sight. Negative delays put every column mid-flight on the first frame.
function rain({ x0, x1, y0 = 0, gap, size, step = size * 1.15, len = [8, 20], dur = [6, 14], seed, cls = 'c', tail = 0.85 }) {
  const r = rng(seed);
  let out = '';
  for (let x = x0 + gap / 2; x < x1; x += gap) {
    const L = len[0] + Math.floor(r() * (len[1] - len[0]));
    const d = dur[0] + r() * (dur[1] - dur[0]);
    const delay = -r() * d;
    let t = '';
    for (let i = 0; i < L; i++) {
      const ch = GLYPHS[Math.floor(r() * GLYPHS.length)];
      const o = i === 0 ? 1 : Math.max(0.06, (1 - i / L) * tail);
      t += `<tspan x="${n1(x)}" y="${n1(y0 - i * step)}"${i === 0 ? ` fill="${C.hi}"` : ''} fill-opacity="${o.toFixed(2)}">${ch}</tspan>`;
    }
    out += `<g class="${cls}" style="animation-duration:${d.toFixed(1)}s;animation-delay:${delay.toFixed(1)}s"><text font-size="${size}" text-anchor="middle">${t}</text></g>`;
  }
  return out;
}
const travel = (regionH, maxLen, step) => Math.ceil(regionH + maxLen * step + 16);

// The picture as a brightness mask made of vector strokes (no bitmap inside the SVG).
function lumaPaths(grid, x, y, cell, gamma) {
  const n = grid.length, LV = 15;
  const q = (v) => Math.round(Math.pow(v / 255, gamma) * LV);
  const d = Array.from({ length: LV + 1 }, () => '');
  for (let row = 0; row < n; row++) {
    const cy = n1(y + row * cell + cell / 2);
    let col = 0;
    while (col < n) {
      const level = q(grid[row][col]);
      let end = col + 1;
      while (end < n && q(grid[row][end]) === level) end++;
      if (level > 0) d[level] += `M${n1(x + col * cell)} ${cy}h${n1((end - col) * cell)}`;
      col = end;
    }
  }
  let out = '';
  for (let L = 1; L <= LV; L++) {
    if (!d[L]) continue;
    const g = Math.round((L / LV) * 255).toString(16).padStart(2, '0');
    out += `<path stroke="#${g}${g}${g}" d="${d[L]}"/>`;
  }
  return `<g fill="none" stroke-width="${n1(cell + 0.5)}">${out}</g>`;
}

// Portrait made of code: a green phosphor image plus bright rain that only shows where the picture is bright.
function portrait({ id, grid, x, y, size, seed, rainCls, gamma = 0.9 }) {
  const cell = size / grid.length;
  const box = `x="${x}" y="${y}" width="${size}" height="${size}"`;
  const defs = `<mask id="${id}m" maskUnits="userSpaceOnUse" ${box}><rect ${box} fill="#000"/>${lumaPaths(grid, x, y, cell, gamma)}</mask>
<pattern id="${id}s" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="1" fill="#000" fill-opacity=".38"/></pattern>`;
  const body = `<rect ${box} fill="#010402"/>
<rect ${box} fill="${C.green}" mask="url(#${id}m)" opacity=".8"/>
<g mask="url(#${id}m)" fill="${C.hi}" font-weight="700">${rain({ x0: x, x1: x + size, y0: y, gap: 10, size: 11, len: [14, 30], dur: [5, 11], seed, cls: rainCls, tail: 1 })}</g>
<rect ${box} fill="url(#${id}s)"/>`;
  return { defs, body, rainTravel: travel(size, 30, 11 * 1.15) };
}

function brackets(x, y, w, h, arm = 14, pad = 6) {
  const a = x - pad, b = y - pad, c = x + w + pad, d = y + h + pad;
  return `<path d="M${a} ${b + arm}V${b}H${a + arm}M${c - arm} ${b}H${c}V${b + arm}M${c} ${d - arm}V${d}H${c - arm}M${a + arm} ${d}H${a}V${d - arm}" fill="none" stroke="${C.green}" stroke-width="1.5"/>`;
}

// Text converted to outlines: identical on every device. y is the baseline.
const outlined = (o, x, y, width, attrs) =>
  `<path transform="translate(${n1(x)} ${n1(y)}) scale(${(width / o.w).toFixed(4)})" d="${o.d}" ${attrs}/>`;
const HALO = `fill="none" stroke="${C.green}" stroke-opacity=".22" stroke-width="9" stroke-linejoin="round"`;

// Label chips with a forced text width, so they keep their size whatever monospace font the visitor has.
function chips(items, x, y, { size = 12, h = 26, gap = 10, cw = 7.8, pad = 13 } = {}) {
  let cx = x, out = '';
  for (const t of items) {
    const w = Math.round(t.length * cw + pad * 2);
    out += `<rect x="${cx + 0.5}" y="${y + 0.5}" width="${w}" height="${h}" fill="${C.bg}" fill-opacity=".6" stroke="${C.green}" stroke-opacity=".85"/><text x="${cx + w / 2}" y="${n1(y + h / 2 + size * 0.36)}" text-anchor="middle" font-size="${size}" fill="${C.green}" textLength="${Math.round(t.length * cw - 1.5)}" lengthAdjust="spacingAndGlyphs">${t}</text>`;
    cx += w + gap;
  }
  return out;
}

const style = (travels) => `<style>
text{font-family:${MONO}}
${Object.entries(travels).map(([cls, t]) => `@keyframes k${cls}{from{transform:translateY(-14px)}to{transform:translateY(${t}px)}}.${cls}{animation:k${cls} linear infinite}`).join('\n')}
@keyframes blink{50%{opacity:0}}
.cur{animation:blink 1.1s steps(1) infinite}
@media (prefers-reduced-motion:reduce){${Object.keys(travels).map((c) => '.' + c).concat('.x').join(',')}{animation-play-state:paused}.cur{animation:none}}
</style>`;

/* ---------- hero, desktop (840 x 360) ---------- */
function heroDesktop() {
  const W = 840, H = 360, tx = 392, nw = 392;
  const pt = portrait({ id: 'p', grid: P.grid['100'], x: 44, y: 30, size: 300, seed: 21, rainCls: 'd' });
  const o1 = P.outline.mono.LAZIZJON, o2 = P.outline.mono.ASATOV;
  const w2 = (o2.w * nw) / o1.w;
  return svg(W, H, LABEL, `
<defs><clipPath id="r"><rect width="${W}" height="${H}" rx="14"/></clipPath>
<linearGradient id="sc" x1="0" x2="1"><stop offset="0" stop-color="${C.bg}" stop-opacity="0"/><stop offset=".14" stop-color="${C.bg}" stop-opacity=".78"/><stop offset=".9" stop-color="${C.bg}" stop-opacity=".78"/><stop offset="1" stop-color="${C.bg}" stop-opacity=".55"/></linearGradient>
<radialGradient id="v" cx="50%" cy="50%" r="75%"><stop offset=".55" stop-color="${C.bg}" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient>
${pt.defs}</defs>
${style({ c: travel(H, 20, 15), d: pt.rainTravel })}
<g clip-path="url(#r)">
<rect width="${W}" height="${H}" fill="${C.bg}"/>
<g fill="${C.green}" opacity=".34">${rain({ x0: 0, x1: W, gap: 21, size: 13, len: [8, 20], dur: [7, 15], seed: 5 })}</g>
<g fill="${C.green}" opacity=".5">${rain({ x0: 8, x1: W, gap: 97, size: 17, step: 20, len: [5, 10], dur: [4, 7], seed: 9 })}</g>
<rect x="340" y="0" width="500" height="${H}" fill="url(#sc)"/>
<rect width="${W}" height="${H}" fill="url(#v)"/>
${pt.body}
${brackets(44, 30, 300, 300)}
<text x="${tx}" y="62" font-size="12.5" fill="${C.dim}">// github.com/${ME.account}</text>
<text x="800" y="62" font-size="12.5" fill="${C.dim}" text-anchor="end">${ME.place}</text>
${outlined(o1, tx, 132, nw, HALO)}${outlined(o2, tx, 198, w2, HALO)}
${outlined(o1, tx, 132, nw, `fill="${C.hi}"`)}${outlined(o2, tx, 198, w2, `fill="${C.hi}"`)}
<text x="${tx}" y="240" font-size="20" fill="${C.green}">&gt; ${ME.role}<tspan class="cur" dx="4">█</tspan></text>
<text x="${tx}" y="267" font-size="13.5" fill="${C.mid}">${ME.tags}</text>
${chips(ME.stack, tx, 286)}
</g>`);
}

/* ---------- hero, phone (420 x 612, shown about 309 px wide) ---------- */
function heroMobile() {
  const W = 420, H = 612, x = 40, nw = 340;
  const pt = portrait({ id: 'p', grid: P.grid['100'], x, y: 28, size: 340, seed: 21, rainCls: 'd' });
  const o1 = P.outline.mono.LAZIZJON, o2 = P.outline.mono.ASATOV;
  const w2 = (o2.w * nw) / o1.w;
  return svg(W, H, LABEL, `
<defs><clipPath id="r"><rect width="${W}" height="${H}" rx="16"/></clipPath>
<linearGradient id="sc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.bg}" stop-opacity="0"/><stop offset=".12" stop-color="${C.bg}" stop-opacity=".8"/><stop offset="1" stop-color="${C.bg}" stop-opacity=".8"/></linearGradient>
${pt.defs}</defs>
${style({ c: travel(H, 20, 15), d: pt.rainTravel })}
<g clip-path="url(#r)">
<rect width="${W}" height="${H}" fill="${C.bg}"/>
<g fill="${C.green}" opacity=".34">${rain({ x0: 0, x1: W, gap: 21, size: 13, len: [10, 24], dur: [9, 18], seed: 5 })}</g>
<rect x="0" y="360" width="${W}" height="${H - 360}" fill="url(#sc)"/>
${pt.body}
${brackets(x, 28, 340, 340)}
<text x="${x}" y="402" font-size="13" fill="${C.dim}">// github.com/${ME.account}</text>
<text x="${x + nw}" y="402" font-size="13" fill="${C.dim}" text-anchor="end">${ME.place}</text>
${outlined(o1, x, 462, nw, HALO)}${outlined(o2, x, 520, w2, HALO)}
${outlined(o1, x, 462, nw, `fill="${C.hi}"`)}${outlined(o2, x, 520, w2, `fill="${C.hi}"`)}
<text x="${x}" y="556" font-size="21" fill="${C.green}">&gt; ${ME.role}<tspan class="cur" dx="4">█</tspan></text>
${chips(ME.stack, x, 572, { size: 12.5, h: 27, cw: 7.9, pad: 13 })}
</g>`);
}

/* ---------- terminal block ---------- */
function terminal(lines, { W, fs: size, lh, px, vx, alt }) {
  const H = 62 + (lines.length - 1) * lh + 20;
  let t = '';
  lines.forEach((l, i) => {
    const y = 62 + i * lh;
    if ('cmd' in l) t += `<text x="${px}" y="${y}" font-size="${size}"><tspan fill="${C.green}">$ </tspan><tspan fill="${C.hi}">${l.cmd}</tspan>${l.cursor ? `<tspan class="cur" fill="${C.green}">█</tspan>` : ''}</text>`;
    else if ('kv' in l) t += `<text x="${px}" y="${y}" font-size="${size}" fill="${C.mid}">${l.kv[0]}</text><text x="${vx}" y="${y}" font-size="${size}" fill="${C.hi}">${l.kv[1]}${l.kv[2] ? `<tspan fill="${C.dim}" dx="${size}">${l.kv[2]}</tspan>` : ''}</text>`;
    else t += `<text x="${px}" y="${y}" font-size="${size}" fill="${C.mid}">${l.out}</text>`;
  });
  return svg(W, H, alt, `
<style>text{font-family:${MONO}}@keyframes blink{50%{opacity:0}}.cur{animation:blink 1.1s steps(1) infinite}@media (prefers-reduced-motion:reduce){.cur{animation:none}}</style>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="${C.panel}" stroke="${C.line}"/>
<line x1="0" y1="32.5" x2="${W}" y2="32.5" stroke="${C.line}"/>
<circle cx="20" cy="16" r="4" fill="${C.green}" fill-opacity=".85"/><circle cx="34" cy="16" r="4" fill="${C.green}" fill-opacity=".5"/><circle cx="48" cy="16" r="4" fill="${C.green}" fill-opacity=".28"/>
<text x="${W / 2}" y="20" text-anchor="middle" font-size="11" fill="${C.dim}">laziz@riga: ~</text>
${t}`);
}
const ABOUT_ALT = `About. ${ME.name}, ${ME.role} in ${ME.place}. ${ME.now.join(' ')} What I build:${ME.build.map((b) => `${b[0]} (${b[2].replace(/ · /g, ', ')})`).join('; ')}.`;
const aboutDesktop = () => terminal([
  { cmd: 'whoami' },
  { out: `${ME.name}. Software engineer in ${ME.place}.` },
  { cmd: 'cat now.txt' },
  { out: ME.now[0] },
  { out: ME.now[1] },
  { cmd: 'cat stack.txt' },
  ...ME.build.map((b) => ({ kv: [b[0], b[2], b[3]] })),
  { cmd: '', cursor: true },
], { W: 840, fs: 14, lh: 23, px: 24, vx: 214, alt: ABOUT_ALT });
const aboutMobile = () => terminal([
  { cmd: 'whoami' },
  { out: `${ME.name}. Software engineer` },
  { out: `in ${ME.place}.` },
  { cmd: 'cat now.txt' },
  { out: 'I automate the work nobody wants to do,' },
  { out: 'and build the apps around it.' },
  { out: 'Right now: payment tooling in Rust and' },
  { out: 'Python, and an iOS app in Swift.' },
  { cmd: 'cat stack.txt' },
  ...ME.build.map((b) => ({ kv: [b[1], b[2], ''] })),
  { cmd: '', cursor: true },
], { W: 420, fs: 13.5, lh: 22, px: 16, vx: 112, alt: ABOUT_ALT });

/* ---------- link chips ---------- */
const linkChip = (label) => {
  const tw = Math.round(label.length * 8.2), w = tw + 60;
  return svg(w, 34, label, `
<style>text{font-family:${MONO}}</style>
<rect x=".5" y=".5" width="${w - 1}" height="33" rx="6" fill="${C.panel}" stroke="${C.line}"/>
<text x="14" y="22" font-size="14" fill="${C.dim}">[</text><text x="${w - 14}" y="22" font-size="14" fill="${C.dim}" text-anchor="end">]</text>
<text x="${w / 2}" y="22" font-size="14" fill="${C.green}" text-anchor="middle" textLength="${tw}" lengthAdjust="spacingAndGlyphs">${label}</text>`);
};

/* ---------- write assets ---------- */
const files = {
  'header.svg': heroDesktop(),
  'header-mobile.svg': heroMobile(),
  'about.svg': aboutDesktop(),
  'about-mobile.svg': aboutMobile(),
};
for (const [label] of ME.links) files[`link-${label}.svg`] = linkChip(label);
for (const [n, s] of Object.entries(files)) fs.writeFileSync(path.join(OUT, n), s);

/* ---------- README ---------- */
// Each <picture> sits inside our own link. Without it GitHub wraps the <img> in a link of its own, the <img>
// stops being a direct child of <picture>, and browsers then ignore the phone <source>.
const HOME = `https://github.com/${ME.account}`;
const readme = `<p align="center">
  <a href="${HOME}">
    <picture>
      <source media="(max-width: 600px)" srcset="assets/header-mobile.svg">
      <img src="assets/header.svg" width="840" alt="${LABEL}">
    </picture>
  </a>
</p>

<p align="center">
  <a href="${HOME}?tab=repositories">
    <picture>
      <source media="(max-width: 600px)" srcset="assets/about-mobile.svg">
      <img src="assets/about.svg" width="840" alt="${ABOUT_ALT}">
    </picture>
  </a>
</p>

<p align="center">
${ME.links.map(([label, url]) => `  <a href="${url}"><img src="assets/link-${label}.svg" height="34" alt="${label}"></a>`).join('\n')}
</p>
`;
fs.writeFileSync(path.join(HERE, '..', 'README.md'), readme);
console.log(Object.entries(files).map(([n, s]) => `${n} ${(s.length / 1024).toFixed(1)}KB`).join('\n'));
