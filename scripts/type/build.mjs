// Build-time type geometry (spec §2, §6.1). Re-asserts every font fact the site leans on, cuts the eight
// FRONT ∩ SIDE intersection solids with manifold-3d, proves them by rasterising their front and side
// views against the glyphs, then writes app/_data/glyphs.json and public/type/solids.bin.
// Run with `npm run type:build`. Outputs are committed; this is not part of `next build`.
// Any failed assert exits 1 and writes nothing.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import Module from "manifold-3d";
import { FRONT, SIDE } from "../../app/_data/word.ts";

const root = new URL("../../", import.meta.url);
const at = (p) => fileURLToPath(new URL(p, root));
const PATHS = {
  ttf: at("scripts/type/ToolsplexDisplay-Black.ttf"),
  woff2: at("app/_fonts/ToolsplexDisplay-Black.woff2"),
  json: at("app/_data/glyphs.json"),
  bin: at("public/type/solids.bin"),
};

// §2, measured from the TTF. Hard facts fail the build; SOFT ones only warn (they are copy, not geometry).
const EXPECT = {
  upm: 1000, cap: 700, asc: 820, desc: -180, glyphs: 72, chars: 71,
  charset: " !+,-./0123456789:?ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  adv: 650, box: [45, 0, 605, 700], stem: 170, bars: [[0, 170], [265, 435], [530, 700]], chamfer: 90,
};
const SOFT = { woff2Bytes: 1764, nodes: { VARSHITH: 96 } };
const DEPTH = EXPECT.box[2] - EXPECT.box[0]; // 560: each solid is as deep as a glyph is wide
const QUANT = 4; // solids.bin stores font units × 4 as i16
const XOR_MAX = 0.003; // raster diff budget, fraction of the glyph's ink

// ---------------------------------------------------------------- asserts

const failures = [];
const check = (ok, msg) => {
  if (!ok) failures.push(msg);
  return ok;
};
const gate = (stage) => {
  if (!failures.length) return;
  console.error(`\n✗ ${stage}: ${failures.length} failed assert${failures.length > 1 ? "s" : ""}`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
};
const warn = (msg) => console.warn(`! ${msg}`);

// ---------------------------------------------------------------- 1. parse and assert the font

const ttf = readFileSync(PATHS.ttf);
const font = opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength));
const os2 = font.tables.os2;
const hhea = font.tables.hhea;

check(font.unitsPerEm === EXPECT.upm, `UPM is ${font.unitsPerEm}, expected ${EXPECT.upm}`);
check(os2.sCapHeight === EXPECT.cap, `cap height is ${os2.sCapHeight}, expected ${EXPECT.cap}`);
// The stage puts each slot's baseline at top + .82em of its line-height:1 box; the DOM word must agree.
check(hhea.ascender === EXPECT.asc && hhea.descender === EXPECT.desc,
  `hhea ascent/descent is ${hhea.ascender}/${hhea.descender}, expected ${EXPECT.asc}/${EXPECT.desc}`);
check(os2.sTypoAscender === EXPECT.asc && os2.sTypoDescender === EXPECT.desc,
  `OS/2 typo ascent/descent is ${os2.sTypoAscender}/${os2.sTypoDescender}, expected ${EXPECT.asc}/${EXPECT.desc}`);
// Windows browsers lay out with usWin* unless USE_TYPO_METRICS (fsSelection bit 7) is set
const USE_TYPO_METRICS = 1 << 7;
if (!(os2.fsSelection & USE_TYPO_METRICS) && (os2.usWinAscent !== EXPECT.asc || os2.usWinDescent !== -EXPECT.desc)) {
  const base = (os2.usWinAscent + (EXPECT.upm - os2.usWinAscent - os2.usWinDescent) / 2) / EXPECT.upm;
  warn(`usWinAscent/usWinDescent are ${os2.usWinAscent}/${os2.usWinDescent}: on Windows the DOM baseline lands at ` +
    `${base.toFixed(3)}em, not ${EXPECT.asc / EXPECT.upm}em, unless @font-face pins ascent-override: ` +
    `${EXPECT.asc / 10}%, descent-override: ${-EXPECT.desc / 10}%, line-gap-override: 0%`);
}
check(font.numGlyphs === EXPECT.glyphs, `${font.numGlyphs} glyphs, expected ${EXPECT.glyphs}`);

const charset = Object.keys(font.tables.cmap.glyphIndexMap)
  .map(Number)
  .sort((a, b) => a - b)
  .map((u) => String.fromCodePoint(u))
  .join("");
check([...charset].length === EXPECT.chars, `${[...charset].length} characters, expected ${EXPECT.chars}`);
check(charset === EXPECT.charset, `charset is "${charset}"`);

// Contours straight from the glyf points: with no off-curve points, every point is a node.
let offCurve = 0;
const commandTypes = new Set();
for (let i = 0; i < font.glyphs.length; i++) {
  const g = font.glyphs.get(i);
  for (const c of g.path.commands) commandTypes.add(c.type);
  for (const p of g.points ?? []) if (!p.onCurve) offCurve++;
}
check([...commandTypes].every((t) => "MLZ".includes(t)), `path commands ${[...commandTypes].join("")}: curves found`);
check(offCurve === 0, `${offCurve} off-curve points, expected 0`);

const glyphs = {};
for (const ch of charset) {
  const g = font.charToGlyph(ch);
  const { commands } = g.path; // opentype builds the glyf points lazily, along with the path
  const contours = [];
  let cur = [];
  for (const p of g.points ?? []) {
    cur.push(p.x, p.y);
    if (p.lastPointOfContour) {
      contours.push(cur);
      cur = [];
    }
  }
  check(commands.filter((c) => c.type === "M").length === contours.length, `${ch}: path and glyf points disagree`);
  const xs = contours.flatMap((c) => c.filter((_, k) => k % 2 === 0));
  const ys = contours.flatMap((c) => c.filter((_, k) => k % 2 === 1));
  const box = xs.length ? [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] : [0, 0, 0, 0];
  glyphs[ch] = { adv: g.advanceWidth, box, contours };
}
const nodesOf = (word) => [...word].reduce((n, ch) => n + glyphs[ch].contours.reduce((m, c) => m + c.length / 2, 0), 0);

for (const ch of charset) {
  if (/[A-Z0-9]/.test(ch)) check(glyphs[ch].adv === EXPECT.adv, `${ch}: advance ${glyphs[ch].adv}, expected ${EXPECT.adv}`);
}
// the solids are cut from a 560-unit box; Q's tail (x to 695) is why this is per word, not per capital
const boxed = (ch) => glyphs[ch]?.box.join() === EXPECT.box.join();

check(FRONT.length === 8 && SIDE.length === 8, `FRONT "${FRONT}" and SIDE "${SIDE}" must be 8 letters`);
for (const ch of FRONT + SIDE) {
  if (check(charset.includes(ch) && /[A-Z]/.test(ch), `"${ch}" is not a capital in the font`))
    check(boxed(ch), `${ch}: ink box ${glyphs[ch].box}, expected ${EXPECT.box}`);
}
check(FRONT[5] === SIDE[5], `FRONT[5] "${FRONT[5]}" !== SIDE[5] "${SIDE[5]}": the I must be an I from both sides`);
gate("font facts");

// ---------------------------------------------------------------- raster helpers (1 font unit per pixel)

const PW = EXPECT.adv; // one cell: x 0..650
const PH = EXPECT.cap; // y 0..700, row 0 at the baseline (y up)
// Sample a hair off the pixel centre so no sample lands exactly on a 45° chamfer through integer corners.
const SX = 0.5 + 1.1e-4;
const SY = 0.5 + 2.3e-4;

const fillSpan = (px, row, x0, x1) => {
  const c0 = Math.max(0, Math.ceil(x0 - SX));
  const c1 = Math.min(PW - 1, Math.floor(x1 - SX));
  if (c0 <= c1) px.fill(1, row * PW + c0, row * PW + c1 + 1);
};

// x where the flat-array polygon edges cross y (half-open, so shared vertices count once)
function crossings(contours, y) {
  const xs = [];
  for (const c of contours) {
    for (let k = 0, n = c.length; k < n; k += 2) {
      const x0 = c[k], y0 = c[k + 1], x1 = c[(k + 2) % n], y1 = c[(k + 3) % n];
      if (y0 <= y !== y1 <= y) xs.push(x0 + ((y - y0) / (y1 - y0)) * (x1 - x0));
    }
  }
  return xs.sort((a, b) => a - b);
}

// even-odd point in polygon
const inside = (contours, x, y) => crossings(contours, y).filter((cx) => cx < x).length % 2 === 1;

function rasterGlyph(contours) {
  const px = new Uint8Array(PW * PH);
  for (let row = 0; row < PH; row++) {
    const xs = crossings(contours, row + SY);
    for (let k = 0; k + 1 < xs.length; k += 2) fillSpan(px, row, xs[k], xs[k + 1]);
  }
  return px;
}

// silhouette of a triangle mesh: union of every triangle's projection; project(i) → [u, v] for vertex i
function rasterMesh(triCount, index, project) {
  const px = new Uint8Array(PW * PH);
  const u = [0, 0, 0], v = [0, 0, 0];
  for (let t = 0; t < triCount; t++) {
    for (let j = 0; j < 3; j++) [u[j], v[j]] = project(index[t * 3 + j]);
    const r0 = Math.max(0, Math.ceil(Math.min(...v) - SY));
    const r1 = Math.min(PH - 1, Math.floor(Math.max(...v) - SY));
    for (let row = r0; row <= r1; row++) {
      const y = row + SY;
      let lo = Infinity, hi = -Infinity;
      for (let j = 0; j < 3; j++) {
        const a = j, b = (j + 1) % 3;
        if (v[a] <= y !== v[b] <= y) {
          const x = u[a] + ((y - v[a]) / (v[b] - v[a])) * (u[b] - u[a]);
          lo = Math.min(lo, x);
          hi = Math.max(hi, x);
        }
      }
      if (lo <= hi) fillSpan(px, row, lo, hi);
    }
  }
  return px;
}

const ink = (px) => px.reduce((n, p) => n + p, 0);
const xor = (a, b) => a.reduce((n, p, i) => n + (p ^ b[i]), 0);
const mirror = (px) => {
  const out = new Uint8Array(px.length);
  for (let row = 0; row < PH; row++) for (let c = 0; c < PW; c++) out[row * PW + c] = px[row * PW + PW - 1 - c];
  return out;
};
const rotate180 = (px) => px.slice().reverse();
const runs = (bits) => {
  const out = [];
  for (let k = 0, start = -1; k <= bits.length; k++) {
    if (bits[k] && start < 0) start = k;
    if (!bits[k] && start >= 0) {
      out.push([start, k]);
      start = -1;
    }
  }
  return out;
};
const rowOf = (px, y) => Array.from(px.subarray(y * PW, y * PW + PW));
const colOf = (px, x) => Array.from({ length: PH }, (_, y) => px[y * PW + x]);

// ---------------------------------------------------------------- the letters the solids are cut from

const rasters = {};
for (const ch of new Set(FRONT + SIDE + "HEI")) rasters[ch] = rasterGlyph(glyphs[ch].contours);

// Every scanline of the cap band must hit ink, or an intersection solid would lose rows in one of its views.
// Probe each crossing interval's midpoint with the even-odd test, rather than trusting pair order.
const covered = (ch) => {
  const { contours } = glyphs[ch];
  for (let y = 0.5; y < PH; y++) {
    const xs = crossings(contours, y);
    if (!xs.some((x, k) => k + 1 < xs.length && inside(contours, (x + xs[k + 1]) / 2, y))) return y;
  }
  return -1;
};
for (const ch of new Set(FRONT + SIDE)) {
  const gap = covered(ch);
  check(gap < 0, `${ch}: scanline y=${gap} has no ink, so ${ch} cannot be a face of an intersection solid`);
}
const sideReady = [...charset].filter((ch) => /[A-Z]/.test(ch) && boxed(ch) && covered(ch) < 0).join("");

// stems and bars, measured on H and E
const H = rasters.H;
const E = rasters.E;
const stem = runs(rowOf(H, 100))[0]; // below the bar, where the H is two stems
const stemW = stem ? stem[1] - stem[0] : 0;
check(stemW === EXPECT.stem, `H stem is ${stemW} units, expected ${EXPECT.stem}`);
check(runs(colOf(H, 325)).join() === [EXPECT.bars[1]].join(), `H bar is ${runs(colOf(H, 325))}, expected ${EXPECT.bars[1]}`);
check(runs(colOf(E, 400)).join() === EXPECT.bars.join(), `E bars are ${runs(colOf(E, 400))}, expected ${EXPECT.bars}`);

// The I: 90-unit chamfers at 45°, top-right and bottom-left. It maps onto itself turned 180° but not
// mirrored, which is what lets the side-view raster below catch a mirrored solid.
const I = rasters.I;
const iChamfers = [];
for (const c of glyphs.I.contours) {
  for (let k = 0; k < c.length; k += 2) {
    const dx = c[(k + 2) % c.length] - c[k], dy = c[(k + 3) % c.length] - c[k + 1];
    if (dx && dy) iChamfers.push([Math.abs(dx), Math.abs(dy)]);
  }
}
check(iChamfers.length === 2 && iChamfers.every(([dx, dy]) => dx === EXPECT.chamfer && dy === EXPECT.chamfer),
  `I chamfers are ${JSON.stringify(iChamfers)}, expected two ${EXPECT.chamfer}×${EXPECT.chamfer}`);
const PROBE = { tl: [50, 695], tr: [600, 695], bl: [50, 5], br: [600, 5] }; // 5 units in from each ink corner
const corners = (px) => Object.fromEntries(Object.entries(PROBE).map(([k, [x, y]]) => [k, px[y * PW + x] === 1]));
const chamfersTRBL = (px) => {
  const c = corners(px);
  return c.tl && !c.tr && !c.bl && c.br;
};
check(chamfersTRBL(I), `I corners ${JSON.stringify(corners(I))}: expected chamfers top-right and bottom-left`);
check(xor(I, rotate180(I)) <= XOR_MAX * ink(I), "I is not 180° rotationally symmetric");
check(xor(I, mirror(I)) > 0.01 * ink(I), "I is mirror-symmetric, so a mirrored side face would go unnoticed");

// the woff2 the DOM sets must be the same build as the TTF the solids are cut from
const woff2 = readFileSync(PATHS.woff2);
const w2 = woff2Tables(woff2);
if (check(w2, "app/_fonts woff2 has no wOF2 signature")) {
  const t = sfntTables(ttf);
  for (const tag of ["cmap", "hhea", "maxp", "hmtx"]) {
    if (!w2[tag]) continue; // transformed in the woff2 (hmtx may be), so not byte-comparable
    check(w2[tag].equals(t[tag]), `woff2 "${tag}" differs from the TTF: copy both from the same font build`);
  }
  // head: skip checksum (8..12) and flags (16..18), which the woff2 encoder rewrites
  check(w2.head?.subarray(18).equals(t.head.subarray(18)), `woff2 "head" differs from the TTF`);
}
const nodes = { [FRONT]: nodesOf(FRONT), [SIDE]: nodesOf(SIDE) };
if (woff2.length !== SOFT.woff2Bytes) warn(`woff2 is ${woff2.length} bytes; the page copy says ${SOFT.woff2Bytes}`);
if (FRONT === "VARSHITH" && nodes.VARSHITH !== SOFT.nodes.VARSHITH)
  warn(`VARSHITH has ${nodes.VARSHITH} nodes; the page counts to ${SOFT.nodes.VARSHITH}`);
gate("glyph metrics");

// ---------------------------------------------------------------- 3. the solids

const wasm = await Module();
wasm.setup();
const { CrossSection } = wasm;
const polys = (contours) => contours.map((c) => Array.from({ length: c.length / 2 }, (_, k) => [c[2 * k], c[2 * k + 1]]));

// Side prism: extrude the side glyph along z, then stand it so local z = side-glyph x and x spans the box.
// SIDE_ALT is the mirror, used only if the raster says the first reads backwards from three's Ry(+90°).
const SIDE_CFG = { rot: [0, -90, 0], move: [EXPECT.box[2], 0, 0] };
const SIDE_ALT = { rot: [0, 90, 0], move: [EXPECT.box[0], 0, EXPECT.adv] };

function cut(cfg) {
  const slots = [];
  for (let i = 0; i < 8; i++) {
    const F = new CrossSection(polys(glyphs[FRONT[i]].contours), "EvenOdd").extrude(DEPTH).translate([0, 0, EXPECT.box[0]]);
    const S = new CrossSection(polys(glyphs[SIDE[i]].contours), "EvenOdd").extrude(DEPTH).rotate(cfg.rot).translate(cfg.move);
    const solid = F.intersect(S).translate([-EXPECT.adv / 2, 0, -EXPECT.adv / 2]); // centred on the turning axis
    const status = solid.status();
    check(status === "NoError" && !solid.isEmpty(), `slot ${i} ${FRONT[i]}∩${SIDE[i]}: manifold ${status}`);
    const mesh = solid.getMesh();
    slots.push(quantize(mesh.vertProperties, mesh.numProp, mesh.triVerts));
    for (const m of [F, S, solid]) m.delete();
  }
  return slots;
}

// i16 positions at font units × QUANT; coincident vertices merge and collapsed triangles drop
function quantize(props, numProp, tris) {
  const ids = new Map();
  const pos = [];
  const remap = [];
  for (let v = 0; v < props.length / numProp; v++) {
    const q = [0, 1, 2].map((a) => Math.round(props[v * numProp + a] * QUANT));
    check(q.every((n) => Math.abs(n) <= 32767), `vertex ${q} overflows i16`);
    const k = q.join();
    if (!ids.has(k)) ids.set(k, pos.push(q) - 1);
    remap.push(ids.get(k));
  }
  const index = [];
  for (let t = 0; t < tris.length; t += 3) {
    const [a, b, c] = [tris[t], tris[t + 1], tris[t + 2]].map((v) => remap[v]);
    if (a !== b && b !== c && a !== c) index.push(a, b, c);
  }
  return { pos: pos.flat(), index };
}

// "TQT1", u16 slots, u16 quant, char[8] FRONT, char[8] SIDE; per slot u16 verts, u16 tris,
// i16[verts*3], u16[tris*3], padded to 4 bytes. Little-endian.
function encode(slots) {
  const pad4 = (n) => (n + 3) & ~3;
  const size = slots.reduce((n, s) => n + pad4(4 + 2 * s.pos.length + 2 * s.index.length), 24);
  const buf = Buffer.alloc(size);
  buf.write("TQT1", 0, "latin1");
  buf.writeUInt16LE(8, 4);
  buf.writeUInt16LE(QUANT, 6);
  buf.write(FRONT, 8, "latin1");
  buf.write(SIDE, 16, "latin1");
  let o = 24;
  for (const s of slots) {
    const verts = s.pos.length / 3, tris = s.index.length / 3;
    check(verts <= 0xffff && tris <= 0xffff, `slot has ${verts} verts / ${tris} tris, over u16`);
    o = buf.writeUInt16LE(verts, o);
    o = buf.writeUInt16LE(tris, o);
    for (const q of s.pos) o = buf.writeInt16LE(q, o);
    for (const v of s.index) o = buf.writeUInt16LE(v, o);
    o = pad4(o);
  }
  return buf;
}

// Read the file back the way the engine will, so the raster asserts judge exactly what ships.
function decode(buf) {
  check(buf.toString("latin1", 0, 4) === "TQT1", "solids.bin magic");
  const n = buf.readUInt16LE(4), quant = buf.readUInt16LE(6);
  const words = [buf.toString("latin1", 8, 16), buf.toString("latin1", 16, 24)];
  check(n === 8 && quant === QUANT && words.join() === [FRONT, SIDE].join(), "solids.bin header");
  const slots = [];
  let o = 24;
  for (let i = 0; i < n; i++) {
    const verts = buf.readUInt16LE(o), tris = buf.readUInt16LE(o + 2);
    o += 4;
    const pos = Array.from({ length: verts * 3 }, (_, k) => buf.readInt16LE(o + 2 * k) / quant);
    o += 6 * verts;
    const index = Array.from({ length: tris * 3 }, (_, k) => buf.readUInt16LE(o + 2 * k));
    o += 6 * tris;
    o = (o + 3) & ~3;
    slots.push({ verts, tris, pos, index });
  }
  check(o === buf.length, `solids.bin has ${buf.length - o} trailing bytes`);
  return slots;
}

// Front: drop z. Side: three's Ry(+90°) takes (x,y,z) → (z,y,−x), so screen x = z + 325, read unmirrored.
const half = EXPECT.adv / 2;
const views = {
  front: (s) => (v) => [s.pos[3 * v] + half, s.pos[3 * v + 1]],
  side: (s) => (v) => [s.pos[3 * v + 2] + half, s.pos[3 * v + 1]],
};

// positive when every triangle is counter-clockwise seen from outside, three's front face
function signedVolume({ pos, index }) {
  let v6 = 0;
  for (let t = 0; t < index.length; t += 3) {
    const [a, b, c] = [0, 1, 2].map((j) => index[t + j] * 3);
    v6 += pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1])
      - pos[a + 1] * (pos[b] * pos[c + 2] - pos[b + 2] * pos[c])
      + pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c]);
  }
  return v6 / 6;
}

function prove(slots) {
  const report = [];
  let sideMirrored = 0;
  slots.forEach((s, i) => {
    const row = { slot: i, letters: `${FRONT[i]}${SIDE[i]}`, tris: s.tris };
    check(signedVolume(s) > 0, `slot ${i}: triangles wind inward, so three would cull the outside faces`);
    for (const [view, word] of [["front", FRONT], ["side", SIDE]]) {
      const want = rasters[word[i]];
      const got = rasterMesh(s.tris, s.index, views[view](s));
      const diff = xor(got, want) / ink(want);
      row[view] = diff;
      check(diff <= XOR_MAX, `slot ${i} ${view} view vs "${word[i]}": XOR ${(diff * 100).toFixed(2)}% of ink`);
      if (view === "side" && diff > XOR_MAX && xor(got, mirror(want)) <= XOR_MAX * ink(want)) sideMirrored++;
      if (i === 5) check(chamfersTRBL(got), `slot 5 ${view} view corners ${JSON.stringify(corners(got))}: the I must keep its chamfers top-right and bottom-left`);
    }
    report.push(row);
  });
  return { report, sideMirrored };
}

let bin = encode(cut(SIDE_CFG));
let proof = prove(decode(bin));
if (failures.length && proof.sideMirrored) {
  warn(`side views read mirrored in ${proof.sideMirrored} slots; flipping the side prism and re-asserting`);
  failures.length = 0;
  bin = encode(cut(SIDE_ALT));
  proof = prove(decode(bin));
}
gate("solids");

// ---------------------------------------------------------------- 2 + 5. write

const facts = { glyphs: font.numGlyphs, chars: [...charset].length, offCurve, woff2Bytes: woff2.length, nodes, stem: stemW };
const head = { upm: font.unitsPerEm, cap: os2.sCapHeight, adv: EXPECT.adv, asc: hhea.ascender, desc: hhea.descender, charset };
// one glyph per line so a font change reads as a clean diff
const json = [
  "{",
  ...Object.entries(head).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`),
  '  "glyphs": {',
  Object.entries(glyphs).map(([ch, g]) => `    ${JSON.stringify(ch)}: ${JSON.stringify(g)}`).join(",\n"),
  "  },",
  `  "facts": ${JSON.stringify(facts)}`,
  "}",
  "",
].join("\n");
JSON.parse(json); // hand-assembled, so prove it parses

writeFileSync(PATHS.json, json);
mkdirSync(fileURLToPath(new URL("public/type/", root)), { recursive: true });
writeFileSync(PATHS.bin, bin);

const pct = (d) => `${(d * 100).toFixed(3)}%`.padStart(7);
console.log(`Toolsplex Display Black · UPM ${head.upm} · cap ${head.cap} · ${facts.chars} chars · ${facts.offCurve} off-curve · woff2 ${facts.woff2Bytes} B`);
console.log(`${FRONT} ⟂ ${SIDE} · nodes ${FRONT} ${nodes[FRONT]}, ${SIDE} ${nodes[SIDE]} · stem ${stemW}`);
console.log(`full-coverage capitals (usable as side letters): ${sideReady}`);
console.log("slot  solid  tris   front xor  side xor");
for (const r of proof.report) console.log(`  ${r.slot}   ${r.letters}    ${String(r.tris).padStart(4)}   ${pct(r.front)}   ${pct(r.side)}`);
const tris = proof.report.reduce((n, r) => n + r.tris, 0);
console.log(`✓ ${tris} triangles · solids.bin ${bin.length} B · glyphs.json ${Buffer.byteLength(json)} B`);

// ---------------------------------------------------------------- font containers

function sfntTables(buf) {
  const tables = {};
  for (let i = 0, n = buf.readUInt16BE(4); i < n; i++) {
    const o = 12 + 16 * i, off = buf.readUInt32BE(o + 8);
    tables[buf.toString("latin1", o, o + 4)] = buf.subarray(off, off + buf.readUInt32BE(o + 12));
  }
  return tables;
}

// Untransformed tables of a WOFF2, by tag. The table data is one brotli stream, tables back to back.
function woff2Tables(buf) {
  if (buf.toString("latin1", 0, 4) !== "wOF2") return null;
  const KNOWN = ["cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm", "glyf", "loca", "prep"];
  let o = 48;
  const base128 = () => {
    let v = 0;
    for (let k = 0; k < 5; k++) {
      const b = buf[o++];
      v = v * 128 + (b & 127);
      if (!(b & 128)) return v;
    }
    throw new Error("woff2: bad UIntBase128");
  };
  const dir = [];
  for (let i = 0, n = buf.readUInt16BE(12); i < n; i++) {
    const flags = buf[o++], idx = flags & 63, version = flags >> 6;
    let tag = KNOWN[idx] ?? `#${idx}`;
    if (idx === 63) {
      tag = buf.toString("latin1", o, o + 4);
      o += 4;
    }
    const orig = base128();
    const transformed = idx === 10 || idx === 11 ? version !== 3 : version !== 0; // glyf/loca: 3 means untouched
    dir.push({ tag, transformed, length: transformed ? base128() : orig });
  }
  const data = brotliDecompressSync(buf.subarray(o, o + buf.readUInt32BE(20)));
  const tables = {};
  let p = 0;
  for (const d of dir) {
    if (!d.transformed) tables[d.tag] = data.subarray(p, p + d.length);
    p += d.length;
  }
  return tables;
}
