// The contract between the motion timelines (writers) and the stage (reader). No GSAP here: the header's
// MiniIndex imports this on every page, and guide pages must stay light.

export type SlotState = {
  x: number; y: number; s: number; // CSS px, viewport: advance-box left, baseline, font-size (1em = 1000 units)
  lift: number; // px, additive y (V nudge, letters dropping out)
  rot: number; // deg about own vertical axis: 0 = FRONT letter, 90 = SIDE letter
  flat: number; // 1 = one flat colour (reading), 0 = three face tones + edges
  tone: number; // 0 ink → 1 signal (the flat colour)
  alpha: number; ghost: number; // presence; ghost 1 = hairline edges + 6% fill
  drain: number; // 0..1 sand drain (solid hidden while > 0)
};
export type StageKind = "gpu" | "css" | "none";
export type Tier = "high" | "mid" | "low" | "css";

// Before the rain the letters are not there yet; without the intro they are simply set.
const intro = typeof document !== "undefined" && document.documentElement.classList.contains("intro");
const blank = (): SlotState => ({ x: 0, y: 0, s: 0, lift: 0, rot: 0, flat: 1, tone: 0, alpha: intro ? 0 : 1, ghost: 0, drain: 0 });

export const store: {
  slots: SlotState[]; pitch: number; slant: number; rain: number; sand: number;
  blink: number; sheet: number; direction: 1 | -1; column: boolean; tier: Tier;
} = {
  slots: Array.from({ length: 8 }, blank), // identities never change: the stage holds these objects
  pitch: 0, // deg, the view tipping forward
  slant: 0, // deg, speed italic about the baseline
  rain: 0,
  sand: 0,
  blink: 0,
  sheet: -1,
  direction: 1,
  column: false,
  tier: "high",
};

// ---- stage readiness ----

let settle!: (kind: StageKind) => void;
let stage: StageKind | null = null;
/** Resolves with the first stage that mounts. Replaced after the stage unmounts, so a remount can resolve it again. */
export let stageReady: Promise<StageKind> = new Promise((r) => (settle = r));

export function setStage(kind: StageKind): void {
  const cl = document.documentElement.classList;
  cl.toggle("stage-gpu", kind === "gpu");
  cl.toggle("stage-css", kind === "css");
  if (kind !== "none") {
    stage = kind;
    settle(kind);
  } else if (stage) {
    stage = null;
    stageReady = new Promise((r) => (settle = r));
  }
}

/** The stage drawing the word right now ("none" until one mounts). */
export const stageKind = (): StageKind => stage ?? "none";

/** The same low-tier probe Stage runs, synchronous, so timelines can pick peaks before the stage exists. */
export const probeLow = (): boolean =>
  matchMedia("(pointer: coarse)").matches ||
  (navigator.hardwareConcurrency || 8) <= 4 ||
  ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;

// ---- sheet tracking ----

const subs = new Set<(i: number) => void>();

/** -1 = none, 0..6 = SHEETS[i], 7 (SHEETS.length) = the end state of the mini index. */
export function setSheet(i: number): void {
  if (i === store.sheet) return;
  store.sheet = i;
  subs.forEach((cb) => cb(i));
}

export function onSheet(cb: (i: number) => void): () => void {
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}

// ---- the hero word ----

// fixed ancestors do not scroll, so their viewport position already is the scrollY 0 position
function fixedIn(el: Element | null): boolean {
  for (; el && el !== document.body; el = el.parentElement) if (getComputedStyle(el).position === "fixed") return true;
  return false;
}

/**
 * Where the DOM word sits at scrollY 0, one entry per slot: x = slot left, y = baseline, s = font-size.
 * The baseline is measured, not assumed at .82em: Windows reads the font's win metrics and puts it
 * about 1% higher, which is 2px at hero sizes and would break the invisible hand-off to the stage.
 */
export function heroLayout(): Pick<SlotState, "x" | "y" | "s">[] {
  const out = Array.from({ length: 8 }, () => ({ x: 0, y: 0, s: 0 }));
  const spans = document.querySelectorAll<HTMLElement>("#v .slot[data-slot]");
  if (!spans.length) return out;

  // one zero-size inline-block sits exactly on the baseline of the line it joins
  const first = spans[0];
  const probe = document.createElement("i");
  probe.style.cssText = "display:inline-block;width:0;height:0;margin:0;padding:0;border:0;vertical-align:baseline";
  first.appendChild(probe);
  const fs0 = parseFloat(getComputedStyle(first).fontSize);
  const ratio = (probe.getBoundingClientRect().top - first.getBoundingClientRect().top) / fs0;
  probe.remove();
  const base = ratio > 0.6 && ratio < 1 ? ratio : 0.82;

  const dy = fixedIn(first) ? 0 : window.scrollY;
  spans.forEach((el) => {
    const i = Number(el.dataset.slot);
    if (!(i >= 0 && i < 8)) return;
    const r = el.getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(el).fontSize);
    out[i] = { x: r.left, y: r.top + dy + base * fs, s: fs };
  });
  return out;
}
