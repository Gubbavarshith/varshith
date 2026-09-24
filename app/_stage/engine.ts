// The GPU stage (spec §6.2): eight intersection solids with hairline edges and floor shadows, plus the
// rain/drain grains. It reads store.ts on every gsap tick and draws only when something visible changed,
// so an idle page renders nothing. Every node graph here is plain TSL, so the same code runs on WebGPU and
// on three's automatic WebGL2 fallback.

import { gsap } from "gsap";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  EdgesGeometry,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LineBasicNodeMaterial,
  LineSegments,
  LinearSRGBColorSpace,
  Mesh,
  MeshBasicNodeMaterial,
  NoToneMapping,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  Vector2,
  Vector3,
  Vector4,
  WebGPURenderer,
} from "three/webgpu";
import {
  abs,
  attribute,
  clamp,
  cos,
  float,
  Fn,
  hash,
  instanceIndex,
  max,
  mix,
  normalLocal,
  positionGeometry,
  select,
  sin,
  smoothstep,
  step,
  uniform,
  uniformArray,
  vec2,
  vec3,
} from "three/tsl";
import glyphData from "../_data/glyphs.json";
import { FRONT, SIDE } from "../_data/word";
import { setStage, store } from "../_motion/store";

export type Tier = "high" | "mid" | "low";
export type Backend = "webgpu" | "webgl2";
export type StageHandle = { backend: Backend; dispose(): void };

const DEG = Math.PI / 180;
const TIERS = {
  high: { dpr: 2, grains: 24576 },
  mid: { dpr: 1.5, grains: 16384 },
  low: { dpr: 1.5, grains: 8192 },
} as const;
const MIN_GRAINS = 4096;
const LOW_PITCH = 8; // the low tier never pitches past 8°
const BLINK = 0.53; // caret half-period, s
const SLOW_MS = 22; // live downgrade: mean frame time over a window
const WINDOW = 90; // frames per downgrade window
const HITCH_MS = 100; // a longer frame is a hitch (tab switch, GC), not sustained load

// ---------- geometry: public/type/solids.bin (format in spec §6.1) ----------

function parseSolids(buf: ArrayBuffer): BufferGeometry[] {
  const dv = new DataView(buf);
  const ascii = (at: number, n: number) => String.fromCharCode(...new Uint8Array(buf, at, n));
  if (ascii(0, 4) !== "TQT1") throw new Error("solids.bin: not a TQT1 file");
  const quant = dv.getUint16(6, true);
  // a bin built for other words would turn the wrong letters: fail over to the CSS stage instead
  if (dv.getUint16(4, true) !== 8 || ascii(8, 8) !== FRONT || ascii(16, 8) !== SIDE)
    throw new Error("solids.bin does not match word.ts: run `npm run type:build`");

  const out: BufferGeometry[] = [];
  let at = 24;
  for (let i = 0; i < 8; i++) {
    const nv = dv.getUint16(at, true);
    const nt = dv.getUint16(at + 2, true);
    at += 4;
    const pos = new Float32Array(nv * 3);
    for (let k = 0; k < pos.length; k++, at += 2) pos[k] = dv.getInt16(at, true) / quant;
    const idx = new Uint16Array(nt * 3);
    for (let k = 0; k < idx.length; k++, at += 2) idx[k] = dv.getUint16(at, true);
    at = (at + 3) & ~3;
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setIndex(new BufferAttribute(idx, 1));
    out.push(g);
  }
  return out;
}

// ---------- grains: a jittered lattice inside the FRONT glyphs, from glyphs.json ----------

type GlyphRec = { adv: number; box: number[]; contours: number[][] };
const GLYPHS = glyphData.glyphs as Record<string, GlyphRec>;

// contours keep TrueType winding (outer CW, holes CCW), so |Σ signed area| is the ink area
function inkArea(cs: number[][]): number {
  let a = 0;
  for (const p of cs) for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) a += p[j] * p[i + 1] - p[i] * p[j + 1];
  return Math.abs(a / 2);
}

function inside(cs: number[][], x: number, y: number): boolean {
  let hit = false; // even-odd, the rule the build verified the solids against
  for (const p of cs) {
    for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
      const yi = p[i + 1];
      const yj = p[j + 1];
      if (yi > y !== yj > y && x < p[i] + ((y - yi) * (p[j] - p[i])) / (yj - yi)) hit = !hit;
    }
  }
  return hit;
}

// deterministic [0,1): the grain layout is identical on every visit
function rnd(a: number, b: number, c: number): number {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35) ^ Math.imul(c + 0x27d4eb2f, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

function lattice(c: number, out: number[] | null): number {
  let n = 0;
  for (let g = 0; g < 8; g++) {
    const { box, contours } = GLYPHS[FRONT[g]];
    const nx = Math.ceil((box[2] - box[0]) / c);
    const ny = Math.ceil((box[3] - box[1]) / c);
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        const x = box[0] + (ix + 0.5 + (rnd(g, ix, 2 * iy) - 0.5) * 0.4) * c; // ±0.2c jitter
        const y = box[1] + (iy + 0.5 + (rnd(g, ix, 2 * iy + 1) - 0.5) * 0.4) * c;
        if (!inside(contours, x, y)) continue;
        n++;
        out?.push(x, y, g, y / 700); // tx, ty (slot-local font units), slot, height order
      }
    }
  }
  return n;
}

// binary-search the lattice cell until the grain count is within 1% of the target
function sampleGrains(target: number, area: number) {
  let c = Math.sqrt(area / target);
  let lo = c / 2;
  let hi = c * 2;
  for (let k = 0; k < 32; k++) {
    const n = lattice(c, null);
    if (Math.abs(n - target) <= target * 0.01) break;
    if (n > target) lo = c;
    else hi = c;
    c = (lo + hi) / 2;
  }
  const pts: number[] = [];
  const count = lattice(c, pts);
  const data = new Float32Array(pts);
  // shuffle whole records so any prefix is an even subsample: the live downgrade halves the count
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rnd(i, 7, 11) * (i + 1));
    for (let k = 0; k < 4; k++) [data[i * 4 + k], data[j * 4 + k]] = [data[j * 4 + k], data[i * 4 + k]];
  }
  return { data, count, cell: c };
}

// ---------- theme: custom properties hold unresolved light-dark(), so resolve through a probe ----------

function rgba(css: string): [number, number, number, number] | null {
  const open = css.indexOf("(");
  if (open < 0) return null;
  const isColorFn = css.startsWith("color(");
  let body = css.slice(open + 1, css.lastIndexOf(")"));
  if (isColorFn) body = body.replace(/^\s*[\w-]+/, ""); // drop the colour space name
  const parts = body.split(/[\s,/]+/).filter(Boolean);
  const num = (v: string | undefined, scale: number) =>
    v === undefined ? 1 : v.endsWith("%") ? parseFloat(v) / 100 : parseFloat(v) / scale;
  const unit = isColorFn ? 1 : 255;
  const out: [number, number, number, number] = [num(parts[0], unit), num(parts[1], unit), num(parts[2], unit), num(parts[3], 1)];
  return out.every(Number.isFinite) ? out : null;
}

// ---------- the stage ----------

type View = { fill: number; edge: number; shade: number; tone: number; flat: number; rot: number };

export async function start(
  canvas: HTMLCanvasElement,
  tier: Tier,
  opts: { onLost?: () => void } = {},
): Promise<StageHandle> {
  const bin = fetch("/type/solids.bin").then((r) => {
    if (!r.ok) throw new Error(`solids.bin: HTTP ${r.status}`);
    return r.arrayBuffer();
  });
  bin.catch(() => {}); // if init fails first, the fetch error is not the one worth reporting

  const renderer = new WebGPURenderer({ canvas, alpha: true, antialias: tier !== "low" });
  renderer.toneMapping = NoToneMapping;
  // No colour management: the CSS colours go in as raw sRGB and blend in sRGB, exactly as the DOM
  // composites them. It also keeps three from adding an output pass, so MSAA lands on the canvas.
  // Set before init(): the WebGL2 backend fixes the context's antialias flag there, and turns it off
  // while an output pass is still needed.
  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 0); // the page paper shows through; themes need no clear colour
  const cleanups: (() => void)[] = [];
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const f of cleanups.reverse()) {
      try {
        f();
      } catch {}
    }
    cleanups.length = 0;
    renderer.dispose();
    document.documentElement.classList.remove("stage-gpu");
  };

  try {
    await renderer.init();
    const backend: Backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? "webgpu" : "webgl2";
    const level: Tier = tier === "low" ? "low" : backend === "webgpu" ? "high" : "mid";
    store.tier = level;
    void renderer.setAnimationLoop(null); // gsap.ticker drives every frame

    let lost = false;
    const baseLost = renderer.onDeviceLost.bind(renderer);
    renderer.onDeviceLost = (info) => {
      baseLost(info);
      if (disposed) return;
      lost = true;
      opts.onLost?.();
    };

    // ---- uniforms ----
    const C = {
      ink: uniform(new Color()),
      signal: uniform(new Color()),
      stone: uniform(new Color()),
      cast: uniform(new Color()),
      edge: uniform(new Color()),
    };
    const uLight = uniform(new Vector3(0.6, -1, 0.8)); // down and toward the viewer; x swaps with the theme
    const views: View[] = Array.from({ length: 8 }, () => ({ fill: 0, edge: 0, shade: 0, tone: 0, flat: 1, rot: 0 }));
    // one shared material per layer; each object carries its slot's values and the per-object uniform
    // group gives every draw its own copy (three clones non-shared uniform groups per render object)
    const perSlot = (read: (v: View) => number) =>
      uniform(0).onObjectUpdate(({ object }) => (object ? read(object.userData.view as View) : 0));

    // ---- solids: unlit, flat. Front faces ink, side faces signal, top/bottom stone ----
    const solidMat = new MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: true,
      // pushes the faces back a hair so the coplanar edge lines win the depth test
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const n = abs(normalLocal);
    const face = select(
      n.y.greaterThanEqual(max(n.x, n.z).sub(0.01)), // 45° chamfers tie-break to stone
      C.stone,
      select(n.z.greaterThanEqual(n.x), C.ink, C.signal),
    );
    solidMat.colorNode = mix(face, mix(C.ink, C.signal, perSlot((v) => v.tone)), perSlot((v) => v.flat));
    solidMat.opacityNode = perSlot((v) => v.fill);

    const edgeMat = new LineBasicNodeMaterial({ transparent: true, depthWrite: false });
    edgeMat.colorNode = C.edge;
    edgeMat.opacityNode = perSlot((v) => v.edge);

    // ---- floor shadow: the solid turned in the shader, then flattened along the light onto the baseline
    // plane of the pitched frame. The mesh itself only carries position, scale and pitch ----
    // flattening flips half the triangles, hence DoubleSide; single pass, or three draws it twice
    const shadowMat = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: DoubleSide, forceSinglePass: true });
    const uRot = perSlot((v) => v.rot);
    shadowMat.positionNode = Fn(() => {
      const p = positionGeometry;
      const c = cos(uRot);
      const s = sin(uRot);
      const q = vec3(p.x.mul(c).add(p.z.mul(s)), p.y, p.z.mul(c).sub(p.x.mul(s))); // Ry(rot)
      const k = q.y.div(uLight.y.negate());
      return vec3(q.x.add(uLight.x.mul(k)), float(-1), q.z.add(uLight.z.mul(k)));
    })();
    shadowMat.colorNode = C.cast;
    shadowMat.opacityNode = perSlot((v) => v.shade);

    // ---- grains: N ≈ ink px / 9 at the hero size, so a grain is about 3px ----
    const hero = document.querySelector<HTMLElement>("#v [data-slot]");
    const heroFs = hero ? parseFloat(getComputedStyle(hero).fontSize) : 0;
    const fs = heroFs > 0 ? heroFs : Math.min((innerWidth * 0.88) / 5.2, innerHeight * 0.51); // --fs-display
    const area = [...FRONT].reduce((sum, ch) => sum + inkArea(GLYPHS[ch].contours), 0);
    const want = Math.round(Math.min(Math.max((area * (fs / 1000) ** 2) / 9, MIN_GRAINS), TIERS[level].grains));
    const grains = sampleGrains(want, area);

    const slotVecs = Array.from({ length: 8 }, () => new Vector4()); // x, -y, s/1000, drain
    const uSlots = uniformArray<"vec4">(slotVecs, "vec4");
    const uRain = uniform(0);
    const uSand = uniform(0);
    const uH = uniform(1);
    const uCell = uniform(grains.cell);
    const uShear = uniform(new Vector2()); // speed italic: k, world baseline
    const aT = attribute("aT", "vec4");

    const rainMat = new MeshBasicNodeMaterial({ depthTest: false, depthWrite: false }); // opaque flat squares
    rainMat.positionNode = Fn(() => {
      const S = uSlots.element(aT.z.toInt());
      const ty = S.y.add(aT.y.mul(S.z));
      const target = vec2(S.x.add(aT.x.mul(S.z)).add(uShear.x.mul(ty.sub(uShear.y))), ty);
      const r = hash(instanceIndex);
      const delay = aT.w.mul(0.5).add(aT.z.mul(0.02)).add(r.mul(0.06)); // lowest grains first, letters L→R
      // a draining letter starts from its landed grains even if the intro rain never ran (rain stays 0)
      const t = max(clamp(uRain.sub(delay).div(0.3), 0, 1), step(0.0001, S.w));
      const pos = mix(vec2(target.x, float(40).add(r.mul(uH).mul(0.35))), target, t.mul(t)).toVar(); // t² gravity
      const d = clamp(S.w.mul(1.35).sub(r.mul(0.35)), 0, 1);
      pos.y.subAssign(d.mul(d).mul(uH.add(300))); // drain: falls off the bottom
      const flying = max(float(1).sub(smoothstep(0.92, 1.0, t)), step(0.001, d));
      const size = uCell.mul(S.z).mul(1.08).mul(max(uSand, step(0.0001, S.w))); // collapsed when unused
      const cxy = positionGeometry.xy;
      return vec3(pos.x.add(cxy.x.mul(size)), pos.y.add(cxy.y.mul(size).mul(mix(float(1), float(6), flying))), 0);
    })();
    rainMat.colorNode = C.ink;

    // ---- scene ----
    const solids = parseSolids(await bin);
    const scene = new Scene();
    const camera = new OrthographicCamera(0, 1, 0, -1, -10000, 10000); // world = CSS px, y up
    const plane = new PlaneGeometry(1, 1);
    const rainGeo = new InstancedBufferGeometry();
    rainGeo.setIndex(plane.getIndex());
    rainGeo.setAttribute("position", plane.getAttribute("position"));
    rainGeo.setAttribute("normal", plane.getAttribute("normal"));
    rainGeo.setAttribute("aT", new InstancedBufferAttribute(grains.data, 4));
    rainGeo.instanceCount = grains.count;
    const rain = new Mesh(rainGeo, rainMat);
    rain.frustumCulled = false;
    scene.add(rain);

    // the word leans about its baseline (speed italic), so its group matrix is written by hand
    const word = new Group();
    word.matrixAutoUpdate = false;
    scene.add(word);

    const geos: BufferGeometry[] = [plane, rainGeo];
    const slotObjs = solids.map((indexed, i) => {
      const flat = indexed.toNonIndexed();
      flat.computeVertexNormals(); // non-indexed: one normal per face, so the three tones stay flat
      const lines = new EdgesGeometry(indexed, 20);
      geos.push(indexed, flat, lines);
      const shadow = new Mesh(flat, shadowMat);
      const solid = new Mesh(flat, solidMat);
      const edges = new LineSegments(lines, edgeMat);
      // all transparent: shadows under the solids, edges over them once every solid has written depth
      shadow.renderOrder = -1;
      solid.renderOrder = 0;
      edges.renderOrder = 1;
      for (const o of [shadow, solid, edges]) {
        o.frustumCulled = false;
        o.userData.view = views[i];
        word.add(o);
      }
      return { shadow, solid, edges };
    });
    cleanups.push(() => {
      for (const g of geos) g.dispose();
      for (const m of [solidMat, edgeMat, shadowMat, rainMat]) m.dispose();
    });

    // ---- colours ----
    const probe = document.createElement("i");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none";
    document.body.append(probe);
    cleanups.push(() => probe.remove());

    let themeVer = 0;
    let edgeAlpha = 0.5;
    const read = (token: string, into: Color): number => {
      probe.style.color = `var(${token})`;
      const c = rgba(getComputedStyle(probe).color);
      if (!c) return 1;
      into.setRGB(c[0], c[1], c[2]); // raw sRGB, see outputColorSpace above
      return c[3];
    };
    const recolour = () => {
      read("--ink", C.ink.value);
      read("--signal", C.signal.value);
      read("--stone", C.stone.value);
      read("--cast", C.cast.value);
      edgeAlpha = read("--edge", C.edge.value);
      const ink = C.ink.value;
      const dark = 0.2126 * ink.r + 0.7152 * ink.g + 0.0722 * ink.b > 0.5; // light ink = dark theme
      uLight.value.x = dark ? -0.6 : 0.6;
      themeVer++;
    };
    recolour();
    const themeObs = new MutationObserver(recolour);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const schemeMq = matchMedia("(prefers-color-scheme: dark)");
    schemeMq.addEventListener("change", recolour);
    cleanups.push(() => {
      themeObs.disconnect();
      schemeMq.removeEventListener("change", recolour);
    });

    // ---- size ----
    let W = 0;
    let H = 0;
    let ratio = 0;
    let sizeVer = 0;
    let sizeDirty = true;
    let dprCap: number = TIERS[level].dpr;
    const applySize = () => {
      sizeDirty = false;
      const w = document.documentElement.clientWidth;
      const h = innerHeight;
      const r = Math.min(devicePixelRatio || 1, dprCap);
      if (w === W && h === H && r === ratio) return;
      W = w;
      H = h;
      ratio = r;
      renderer.setPixelRatio(r);
      renderer.setSize(w, h);
      camera.right = w;
      camera.bottom = -h;
      camera.updateProjectionMatrix();
      uH.value = h;
      sizeVer++;
    };
    const markSize = () => {
      sizeDirty = true;
    };
    // a DPR change (zoom, another monitor) does not always fire resize
    let dprMq: MediaQueryList | null = null;
    const watchDpr = () => {
      dprMq?.removeEventListener("change", onDpr);
      dprMq = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
      dprMq.addEventListener("change", onDpr);
    };
    function onDpr() {
      markSize();
      watchDpr();
    }
    watchDpr();
    addEventListener("resize", markSize);
    const sizeObs = new ResizeObserver(markSize); // scrollbar appearing changes clientWidth only
    sizeObs.observe(document.documentElement);
    cleanups.push(() => {
      removeEventListener("resize", markSize);
      sizeObs.disconnect();
      dprMq?.removeEventListener("change", onDpr);
    });
    applySize();

    // some platforms drop a hidden canvas's contents: redraw on return
    let wakeVer = 0;
    const onVisible = () => {
      if (!document.hidden) wakeVer++;
    };
    document.addEventListener("visibilitychange", onVisible);
    cleanups.push(() => document.removeEventListener("visibilitychange", onVisible));

    // ---- compile every pipeline now, so the rain and the first turn never stall on a shader ----
    for (const o of word.children) o.visible = true;
    await renderer.compileAsync(scene, camera);
    if (disposed) throw new Error("stage disposed during init");

    // ---- per tick ----
    let shadowsOn = level !== "low";
    let first = true;
    let caret = -1;
    let caretT0 = 0;
    let prevFrame = -2;
    let probeStep = 0; // 0: watching at full DPR, 1: watching at DPR 1, 2: done
    let acc = 0;
    let samples = 0;

    const snap = new Float64Array(8 * 10 + 12).fill(NaN); // must fit every put() below, or idle frames redraw
    let si = 0;
    let dirty = false;
    const put = (v: number) => {
      if (snap[si] !== v) {
        snap[si] = v;
        dirty = true;
      }
      si++;
    };

    // store.blink names the slot that blinks as a caret. 0 is the store's resting default and the V
    // never blinks, so only 1..7 count.
    const caretSlot = () => {
      const b = store.blink;
      return Number.isInteger(b) && b >= 1 && b <= 7 ? b : -1;
    };

    const measure = (frame: number, dt: number) => {
      const consecutive = frame === prevFrame + 1;
      prevFrame = frame;
      if (probeStep > 1 || !consecutive || dt > HITCH_MS) return;
      acc += dt;
      if (++samples < WINDOW) return;
      const slow = acc / samples > SLOW_MS;
      acc = samples = 0;
      if (!slow) probeStep = 2;
      else if (probeStep === 0) {
        dprCap = 1;
        markSize();
        probeStep = 1;
      } else {
        rainGeo.instanceCount = Math.max(1, rainGeo.instanceCount >> 1);
        uCell.value *= Math.SQRT2; // same ink coverage from half the grains
        shadowsOn = false;
        probeStep = 2;
      }
    };

    const tick = (time: number, deltaMs: number, frame: number) => {
      if (disposed || lost || document.hidden) return;
      if (sizeDirty) applySize();
      const slots = store.slots;
      if (first && !(slots.length >= 8 && slots[0].s > 0)) return; // wait for the hero layout

      const b = caretSlot();
      if (b !== caret) {
        caret = b;
        caretT0 = time;
      }
      const phase = b < 0 ? 0 : Math.floor((time - caretT0) / BLINK) % 2;
      const pitchDeg = level === "low" ? Math.min(store.pitch, LOW_PITCH) : store.pitch;
      const slant = level === "low" ? 0 : Math.max(-8, Math.min(8, store.slant));
      let flowing = store.sand > 0 && store.rain < 1;

      si = 0;
      dirty = false;
      for (let i = 0; i < 8; i++) {
        const s = slots[i];
        put(s.x);
        put(s.y);
        put(s.s);
        put(s.lift);
        put(s.rot);
        put(s.flat);
        put(s.tone);
        put(s.alpha);
        put(s.ghost);
        put(s.drain);
        if (s.drain > 0 && s.drain < 1) flowing = true;
      }
      put(pitchDeg);
      put(slant);
      put(store.rain);
      put(store.sand);
      put(b);
      put(phase);
      put(themeVer);
      put(sizeVer);
      put(wakeVer);
      put(shadowsOn ? 1 : 0);
      put(rainGeo.instanceCount);
      const dpr = devicePixelRatio || 1; // the DOM's grid, not the (capped) canvas ratio
      put(dpr);
      if (!dirty && !flowing && !first) return;

      const pitch = pitchDeg * DEG;
      const edgeWeight = Math.min(1, edgeAlpha * Math.min(1.6, ratio)); // lines are 1 device px: keep their optical weight at high DPR
      let yb = 0;
      let nb = 0;
      let grainsOn = store.sand > 0;
      for (let i = 0; i < 8; i++) {
        const s = slots[i];
        const v = views[i];
        const o = slotObjs[i];
        const shown = s.s > 0 && s.drain <= 0 && !(i === b && phase === 1) ? s.alpha : 0; // solid hidden while draining
        v.fill = shown * (1 - 0.94 * s.ghost);
        v.edge = shown * Math.max(1 - s.flat, s.ghost) * edgeWeight;
        v.shade = shown * (1 - s.ghost);
        v.tone = s.tone;
        v.flat = s.flat;
        v.rot = s.rot * DEG;

        const x = s.x + 0.325 * s.s;
        // DOM text snaps its baseline to whole device pixels, so the layout baseline does too (the
        // animated lift stays smooth): the hero swap then lands on the same pixel rows
        const y = -(Math.round(s.y * dpr) / dpr + s.lift);
        const k = s.s / 1000;
        o.solid.position.set(x, y, 0);
        o.solid.scale.setScalar(k);
        o.solid.rotation.set(pitch, v.rot, 0); // XYZ: turn in the letter's own frame, then pitch
        o.edges.position.set(x, y, 0);
        o.edges.scale.setScalar(k);
        o.edges.rotation.set(pitch, v.rot, 0);
        o.shadow.position.set(x, y, 0);
        o.shadow.scale.setScalar(k);
        o.shadow.rotation.set(pitch, 0, 0); // rot is applied in the shader, before flattening
        o.solid.visible = v.fill > 1e-3;
        o.edges.visible = v.edge > 1e-3;
        o.shadow.visible = shadowsOn && pitchDeg > 0.5 && v.shade > 1e-3;

        slotVecs[i].set(s.x, y, k, s.drain);
        if (s.s > 0 && (s.alpha > 0 || s.drain > 0)) {
          yb += y;
          nb++;
        }
        if (s.drain > 0 && s.drain < 1) grainsOn = true;
      }

      // shear about the mean baseline of the visible slots: x' = x + k·(y − yb)
      const sh = Math.tan(slant * DEG);
      yb = nb ? yb / nb : 0;
      word.matrix.set(1, sh, 0, -sh * yb, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
      word.matrixWorldNeedsUpdate = true;
      uShear.value.set(sh, yb);
      uRain.value = store.rain;
      uSand.value = store.sand;
      rain.visible = grainsOn;

      renderer.render(scene, camera);
      if (first) {
        first = false;
        // the DOM word hides in the same frame the GPU word first appears
        document.documentElement.classList.add("stage-gpu");
        setStage("gpu");
      }
      measure(frame, deltaMs);
    };
    gsap.ticker.add(tick);
    cleanups.push(() => gsap.ticker.remove(tick));

    return { backend, dispose };
  } catch (err) {
    dispose();
    throw err;
  }
}
