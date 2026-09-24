// Where the word stands (L), how it changes (transition), and who wins when several scrubbed timelines
// write it (compose). Every write of rot, tone, alpha, ghost, flat and drain goes through this file, so the
// S-H-I-T guard in word.ts has one writer to trust.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PEEKABLE, STATES, TRANSITIONS, type StateName, type Transition, type Vis } from "../_data/word";
import { heroLayout, store, type SlotState } from "./store";

export type Place = Pick<SlotState, "x" | "y" | "s">;
export type Layout = Partial<Record<number, Place>>;

const XYS = ["x", "y", "s"] as const;
type Key = (typeof XYS)[number];

// ---- placements ----
// Measured once per ScrollTrigger refresh (invalidateLayout runs on refreshInit), so scrub frames never read layout.

const cache = new Map<string, Layout>();
const memo = (k: string, f: () => Layout): Layout => {
  let v = cache.get(k);
  if (!v) cache.set(k, (v = f()));
  return v;
};

export function invalidateLayout(): void {
  cache.clear();
  caret = null;
}

/**
 * Glyph slots inside a <Glyphs> still, in viewport px, shifted by dy. The viewBox is the cap box (baseline at the
 * bottom) and every capital advances the same 650, so cell n starts at n·width/count. The cells' own transform
 * attributes are ignored on purpose: sheets animate them (Sheet 06 turns its I over), and a refresh mid-turn
 * must not measure the turned copy.
 */
function measure(root: Element, dy: number): Layout {
  const out: Layout = {};
  const svgs = root instanceof SVGSVGElement ? [root] : Array.from(root.querySelectorAll("svg"));
  for (const svg of svgs) {
    const vb = svg.viewBox.baseVal;
    const r = svg.getBoundingClientRect();
    const cells = svg.querySelectorAll<SVGGElement>("g[data-slot]");
    if (!vb || !vb.width || !r.width || !cells.length) continue;
    const none = svg.preserveAspectRatio.baseVal.align === SVGPreserveAspectRatio.SVG_PRESERVEASPECTRATIO_NONE;
    const kx = r.width / vb.width;
    const ky = none ? r.height / vb.height : Math.min(kx, r.height / vb.height);
    const k = none ? kx : ky;
    const ox = none ? 0 : (r.width - vb.width * k) / 2; // default xMidYMid meet
    const oy = none ? 0 : (r.height - vb.height * k) / 2;
    const cell = vb.width / cells.length;
    cells.forEach((g, n) => {
      const slot = Number(g.dataset.slot);
      if (slot >= 0 && slot < 8) out[slot] = { x: r.left + ox + n * cell * k, y: r.top + dy + oy + vb.height * ky, s: 1000 * k };
    });
  }
  return out;
}

/** A section id resolves to its [data-m=anchor]; anything else is taken as the anchor itself. */
function anchorOf(sel: string): Layout {
  let el = document.querySelector(sel);
  if (el?.matches("section")) el = el.querySelector("[data-m=anchor]") ?? el;
  const sec = el?.closest("section");
  // pinned sheets sit at the top of the viewport, so section-relative is where the word goes while pinned
  return el && sec ? measure(el, -sec.getBoundingClientRect().top) : {};
}

function stickyOf(sel: string): Layout {
  const el = document.querySelector<HTMLElement>(sel);
  if (!el) return {};
  const r = el.getBoundingClientRect();
  const top = parseFloat(getComputedStyle(el).top);
  if (Number.isFinite(top)) return measure(el, top - r.top); // where it will be once stuck
  const sec = el.closest("section");
  return measure(el, -(sec?.getBoundingClientRect().top ?? 0));
}

/** The resting row: the #turn anchor (72% wide, cap centre 46svh), re-spaced and zoomed about its centre. */
function row(spacing: number, zoom: number): Layout {
  const a = memo("turn", () => anchorOf("#turn"));
  const v = a[0], h = a[7];
  let cx: number, cap: number, s0: number;
  if (v && h && v.s > 0) {
    cx = (v.x + h.x + 0.65 * h.s) / 2;
    cap = v.y - 0.35 * v.s;
    s0 = v.s;
  } else {
    const w = document.documentElement.clientWidth;
    cx = w / 2;
    cap = 0.46 * innerHeight;
    s0 = (0.72 * w) / 5.2;
  }
  const s = s0 * zoom, u = s / 1000, width = (7 * spacing + 650) * u;
  const out: Layout = {};
  for (let i = 0; i < 8; i++) out[i] = { x: cx - width / 2 + i * spacing * u, y: cap + 350 * u, s };
  return out;
}

type Caret = { x: number[]; y: number[]; fs: number };
let caret: Caret | null = null;

/** Right edge and baseline after each non-space character of the Sheet 07 line, relative to #i's top. */
function measureCaret(): Caret | null {
  const sec = document.getElementById("i");
  const line = sec?.querySelector<HTMLElement>("[data-m=typed]");
  if (!sec || !line) return null;
  const top = sec.getBoundingClientRect().top;
  const fs = parseFloat(getComputedStyle(line).fontSize);
  const walk = document.createTreeWalker(line, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest(".still") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const range = document.createRange();
  const rights: number[] = [], tops: number[] = [];
  let first: Text | null = null, left = 0;
  for (let n = walk.nextNode() as Text | null; n; n = walk.nextNode() as Text | null) {
    for (let k = 0; k < n.data.length; k++) {
      if (/\s/.test(n.data[k])) continue;
      range.setStart(n, k);
      range.setEnd(n, k + 1);
      const r = range.getBoundingClientRect();
      if (!first) {
        first = n;
        left = r.left;
      }
      rights.push(r.right);
      tops.push(r.top);
    }
  }
  if (!first || !first.parentNode) return null;
  // a zero-size inline-block beside the first character sits on its baseline; the offset is the same on every line
  const probe = document.createElement("i");
  probe.style.cssText = "display:inline-block;width:0;height:0;margin:0;padding:0;border:0;vertical-align:baseline";
  first.parentNode.insertBefore(probe, first);
  const base = probe.getBoundingClientRect().top - tops[0];
  probe.remove();
  return {
    x: [left, ...rights],
    y: [tops[0], ...tops].map((t) => t + base - top),
    fs,
  };
}

export const L = {
  /** The DOM word at scrollY 0. */
  hero: (): Layout => memo("hero", () => ({ ...heroLayout() })),
  /** Mobile: the hero column is the one placement the word ever takes. */
  column: (): Layout => L.hero(),
  center: (o: { spacing?: number; zoom?: number } = {}): Layout =>
    store.column ? L.column() : memo(`row${o.spacing ?? 650}:${o.zoom ?? 1}`, () => row(o.spacing ?? 650, o.zoom ?? 1)),
  anchor: (sel: string): Layout => (store.column ? L.column() : memo(`a:${sel}`, () => anchorOf(sel))),
  sticky: (sel: string): Layout => (store.column ? L.column() : memo(`k:${sel}`, () => stickyOf(sel))),
  /**
   * The I (slot 5) as a text caret after `i` revealed non-space characters of `#i [data-m=typed]`: cap height .85 of
   * the line's font-size, ink starting a hair after the last glyph, on that glyph's baseline. Reveal the characters
   * with clip or opacity, not transforms, or the measured edges move with them.
   */
  caretAt: (i: number): Layout => {
    if (store.column) return { 5: L.column()[5] };
    caret ??= measureCaret();
    if (!caret) return {};
    const k = Math.max(0, Math.min(caret.x.length - 1, Math.round(i)));
    const s = (0.85 * caret.fs) / 0.7;
    return { 5: { x: caret.x[k] + 0.05 * caret.fs - 0.045 * s, y: caret.y[k], s } };
  },
};

const slotOf = (t: unknown) => store.slots.indexOf(t as SlotState);

/** Function-based tween vars that read a placement lazily (on init, so after each refresh), per target slot. */
export function slotVars(f: () => Layout, keys: readonly Key[] = XYS): gsap.TweenVars {
  const v: gsap.TweenVars = {};
  for (const k of keys) v[k] = (_: number, t: SlotState) => f()[slotOf(t)]?.[k] ?? t[k];
  return v;
}

// ---- looks ----

type Look = { rot: number; flat: number; tone: number; alpha: number; ghost: number; drain: number };
const REST: Look = { rot: 0, flat: 1, tone: 0, alpha: 1, ghost: 0, drain: 0 };

// OUTLINE hands the word to the DOM outline on Sheet 06, so its solids end transparent
const lookOf = (v: Vis, state: StateName): Look => ({
  rot: v.face === "side" ? 90 : 0,
  flat: 1,
  tone: v.tone === "signal" ? 1 : 0,
  alpha: v.presence === "hidden" || state === "OUTLINE" ? 0 : 1,
  ghost: v.presence === "ghost" ? 1 : 0,
  drain: 0,
});

let baseAlpha = typeof document !== "undefined" && document.documentElement.classList.contains("intro") ? 0 : 1;

/** The intro is over: the letters are set. */
export function reveal(): void {
  baseAlpha = 1;
  for (const st of store.slots) st.alpha = 1;
}

/** Back to REST in place (after reduced motion is switched off again). */
export function rest(): void {
  baseAlpha = 1;
  for (const st of store.slots) Object.assign(st, REST, { lift: 0 });
}

/** Reduced motion switched on mid-visit: the stills take over, the stage goes blank (and stays so on recompose). */
export function hideWord(): void {
  baseAlpha = 0;
  for (const st of store.slots) st.alpha = 0;
}

// ---- transitions ----

const put = (tl: gsap.core.Timeline, st: SlotState, from: gsap.TweenVars, to: gsap.TweenVars, at: number, dur: number, ease: string) =>
  tl.fromTo(st, from, { ...to, duration: dur, ease, immediateRender: false }, at);

// the sheet's resting placement, found from the timeline's trigger: Sheet 06 rests on its outline
function homeOf(tl: gsap.core.Timeline): () => Layout {
  return () => {
    for (let a: gsap.core.Animation | null = tl; a; a = a.parent) {
      const trig = a.scrollTrigger?.trigger;
      if (trig) return trig.id === "t" ? L.anchor("#t") : L.center();
    }
    return L.center();
  };
}

// where each slot was last sent on a timeline, so a return trip starts from there
const sent = new WeakMap<gsap.core.Timeline, Map<number, () => Partial<Place> | undefined>>();

/**
 * Change the word from one STATES entry to the next on a scrubbed timeline. Each slot gets the same `dur`, and
 * the slots start in `order` at even steps across `span` (all at once for "together"). Equal durations with
 * monotonic starts keep the slots in flight consecutive in `order`, which is what the guard test proves safe,
 * so continuous overlapping tweens can never show S-H-I-T on its own.
 *
 * Every slot's rot/flat/tone/alpha/ghost/drain (and lift) is written from its own step start, with explicit
 * from and to values, so a scrubbed or replayed frame depends only on the timeline's playhead.
 *
 * `place` may move a slot: from its step start to the end of the transition, starting where this timeline last
 * sent it (or the sheet's resting placement). It is read lazily, so measured placements stay fresh.
 */
export function transition(
  tl: gsap.core.Timeline,
  name: keyof typeof TRANSITIONS,
  at: number,
  span: number,
  dur: number,
  place?: (slot: number) => Partial<{ x: number; y: number; s: number }> | undefined,
): void {
  const t: Transition = TRANSITIONS[name];
  const from = STATES[t.from], to = STATES[t.to];
  const d = Math.max(1e-4, Math.min(dur, span));
  const step = t.kind === "together" ? 0 : (span - d) / (t.order.length - 1);
  const home = homeOf(tl);
  const last = sent.get(tl) ?? new Map<number, () => Partial<Place> | undefined>();
  sent.set(tl, last);

  t.order.forEach((slot, k) => {
    const st = store.slots[slot];
    const t0 = at + k * step;
    const a = lookOf(from[slot], t.from), b = lookOf(to[slot], t.to);
    const em = () => home()[slot]?.s ?? st.s;

    if (t.kind === "turn") {
      // flat colour → three face tones → flat colour, the tone swapping while it is hidden by the faces
      const keep = { alpha: b.alpha, ghost: b.ghost, drain: 0, lift: 0 };
      put(tl, st, { rot: a.rot, ...keep }, { rot: b.rot, ...keep }, t0, d, "power2.inOut");
      put(tl, st, { flat: 1, tone: a.tone }, { flat: 0, tone: a.tone }, t0, 0.2 * d, "power1.in");
      put(tl, st, { flat: 0, tone: a.tone }, { flat: 0, tone: b.tone }, t0 + 0.2 * d, 0.6 * d, "power1.inOut");
      put(tl, st, { flat: 0, tone: b.tone }, { flat: 1, tone: b.tone }, t0 + 0.8 * d, 0.2 * d, "power1.out");
    } else if (t.kind === "step") {
      // leaving letters drop .12em as they fade; returning ones rise back into the line
      const lift = (on: boolean) => (on ? () => 0.12 * em() : 0);
      put(tl, st, { ...a, lift: lift(a.alpha < b.alpha) }, { ...b, lift: lift(a.alpha > b.alpha) }, t0, d, "power1.inOut");
    } else if (t.kind === "together") {
      // through all-ghost: hairlines come up before the fill goes, and the fill returns before they go
      const keep = { rot: a.rot, flat: 1, tone: a.tone, drain: 0, lift: 0 };
      const mid = { alpha: 1, ghost: 1 };
      put(tl, st, { ...keep, alpha: a.alpha, ghost: a.ghost }, { ...keep, ...mid }, t0, d / 2, "power1.inOut");
      put(tl, st, { ...keep, ...mid }, { ...keep, alpha: b.alpha, ghost: b.ghost }, t0 + d / 2, d / 2, "power1.inOut");
    } else if (to[slot].presence === "hidden") {
      // drain: the solid goes at the step start and its grains fall (the shader applies gravity)
      const keep = { rot: a.rot, flat: 1, tone: a.tone, ghost: 0, lift: 0 };
      put(tl, st, { ...keep, alpha: a.alpha }, { ...keep, alpha: 0 }, t0, Math.min(0.001, d / 50), "none");
      put(tl, st, { drain: 0 }, { drain: 1 }, t0, d, "none");
    } else {
      put(tl, st, { ...a, lift: 0 }, { ...b, lift: 0 }, t0, d, "none"); // stays: held while it travels
    }

    const probe = place?.(slot);
    if (!place || !probe) return;
    const keys = XYS.filter((key) => typeof probe[key] === "number");
    if (!keys.length) return;
    const prev = last.get(slot) ?? (() => home()[slot]);
    const next = () => place(slot);
    const fromV: gsap.TweenVars = {}, toV: gsap.TweenVars = {};
    for (const key of keys) {
      fromV[key] = () => prev()?.[key] ?? st[key];
      toV[key] = () => next()?.[key] ?? st[key];
    }
    put(tl, st, fromV, toV, t0, Math.max(d, at + span - t0), "power1.inOut");
    last.set(slot, () => ({ ...prev(), ...next() }));
  });
}

// ---- hero peeks ----

const peeking = new Map<number, gsap.core.Timeline>();

/**
 * Turn one hero letter to its side and spring back (.35s snap in, .7s back.out out). Only PEEKABLE slots:
 * a turning R or last H would leave S-H-I-T-H or V-A-R-S-H-I-T reading on its own.
 */
export function peek(slot: number): gsap.core.Timeline | null {
  if (!PEEKABLE.includes(slot) || peeking.has(slot)) return null;
  const st = store.slots[slot];
  const tl = gsap.timeline({ onComplete: () => void peeking.delete(slot) });
  tl.to(st, { rot: 90, duration: 0.35, ease: "power3.out", overwrite: "auto" }, 0)
    .to(st, { flat: 0, duration: 0.1, ease: "power1.in" }, 0)
    .to(st, { tone: 1, duration: 0.15, ease: "none" }, 0.1)
    .to(st, { flat: 1, duration: 0.1, ease: "power1.out" }, 0.25)
    .to(st, { rot: 0, duration: 0.7, ease: "back.out(1.6)" }, 0.35)
    .to(st, { flat: 0, duration: 0.12, ease: "power1.in" }, 0.35)
    .to(st, { tone: 0, duration: 0.2, ease: "none" }, 0.47)
    .to(st, { flat: 1, duration: 0.25, ease: "power1.out" }, 0.67);
  peeking.set(slot, tl);
  return tl;
}

/** Scrolling cancels every peek and returns those letters to rest. */
export function unpeek(): void {
  peeking.forEach((tl, slot) => {
    tl.kill();
    gsap.to(store.slots[slot], { rot: 0, flat: 1, tone: 0, duration: 0.3, ease: "power3.out", overwrite: "auto" });
  });
  peeking.clear();
}

// ---- composition ----
// Scrubbed timelines lag their scroll position, so near a boundary, or during a jump, several of them move in
// one tick, and whichever renders last would win. compose() makes the page order win instead: from the hero
// baseline it re-renders the word tweens of every timeline that has moved, in page order, at each one's own
// playhead. The latest sheet decides, and each sheet starts from the state the sheet before it left.

type Entry = { st: ScrollTrigger; anim: gsap.core.Animation; tweens: [gsap.core.Tween, gsap.core.Animation[]][]; t: number };
let entries: Entry[] = [];

/** Find every ScrollTrigger whose animation writes the store. Runs after each refresh. */
export function scanWord(): void {
  const owned = new Set<unknown>([store, ...store.slots]);
  entries = ScrollTrigger.getAll()
    .map((st, n) => {
      const anim = st.animation;
      if (!anim) return null;
      const all = anim instanceof gsap.core.Timeline ? anim.getChildren(true, true, false) : [anim];
      const tweens = (all as gsap.core.Tween[])
        .filter((tw) => tw.targets().some((x) => owned.has(x)))
        .map((tw): [gsap.core.Tween, gsap.core.Animation[]] => {
          const chain: gsap.core.Animation[] = [];
          for (let p = tw === anim ? null : tw.parent; p && p !== anim; p = p.parent) chain.unshift(p);
          return [tw, chain];
        });
      return tweens.length ? { st, anim, tweens, t: -1, n } : null;
    })
    .filter((e): e is Entry & { n: number } => !!e)
    .sort((a, b) => a.st.start - b.st.start || a.n - b.n);
}

function replay(e: Entry): void {
  const T = e.anim.totalTime();
  for (const [tw, chain] of e.tweens) {
    let t = T;
    if (tw !== e.anim) {
      for (const p of chain) {
        t = (t - p.startTime()) * p.timeScale();
        if (t < 0) break;
        t = Math.min(t, p.totalDuration());
      }
      if (t < 0) continue;
      t = (t - tw.startTime()) * tw.timeScale();
      if (t < 0) continue;
    }
    tw.render(Math.min(t, tw.totalDuration()), true, true);
  }
}

function baseline(): void {
  const hero = L.hero();
  store.slots.forEach((st, i) => {
    Object.assign(st, REST, { alpha: baseAlpha, lift: 0 });
    const h = hero[i];
    if (h) Object.assign(st, h);
  });
  store.pitch = 0;
}

/** Call once per tick, after the timelines render. `force` recomposes even if nothing moved (after a refresh). */
export function compose(force = false): void {
  let moved = 0, lastMoved = -1, top = -1;
  for (let k = 0; k < entries.length; k++) {
    const e = entries[k], t = e.anim.totalTime();
    if (t !== e.t) {
      e.t = t;
      moved++;
      lastMoved = k;
    }
    if (t > 0) top = k;
  }
  // one timeline moving on top of the stack already rendered last: nothing to fix
  if (!force && (moved === 0 || (moved === 1 && lastMoved === top))) return;
  baseline();
  for (let k = 0; k <= top; k++) if (entries[k].t > 0) replay(entries[k]);
}

/** After a jump (hash, resize restore): finish every scrub so no timeline is still catching up, then recompose. */
export function settle(): void {
  for (const st of ScrollTrigger.getAll()) {
    const scrub = st.getTween() as gsap.core.Tween | 0; // 0, not undefined, when the trigger has no scrub
    if (scrub) scrub.progress(1);
  }
  compose(true);
}

/** The runtime is going away: forget timelines and running peeks. */
export function resetWord(): void {
  entries = [];
  peeking.forEach((tl) => tl.kill());
  peeking.clear();
  invalidateLayout();
}
