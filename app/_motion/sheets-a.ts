// Sheets 01–03: the rain intro, the hero exit and peeks, the Quarter Turn, the manifest and VAR.
// Positions in the pinned timelines are fractions of a 0..1 timeline (spec §7). Word writes are fromTo with
// lazy placements; DOM reveals are fromTo so their hidden state is set at build, before the sheet arrives.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type Lenis from "lenis";
import type { SheetId } from "../_data/word";
import { L, compose, peek, reveal, slotVars, transition, unpeek, type Layout } from "./layouts";
import { probeLow, stageReady, store, type StageKind } from "./store";

export type BuildCtx = {
  reduced: boolean;
  column: boolean; // ≤ 640px: the word is a fixed column, pins ×0.6, no x/y moves, no breathe, no snap
  kind: StageKind; // live: reads the stage that is drawing right now
  lenis: Lenis | null;
  scrollToSheet: (id: SheetId, o?: { at?: number; duration?: number }) => void;
  TUNE: typeof TUNE;
};

/** The screenshot frame's knobs. */
export const TUNE = { pitchPeak: 16, spacingPeak: 830, turnDur: 0.3, waveStart: 0.1 };

type El = HTMLElement;
const hooks = (root: Element) => (k: string) => root.querySelector<El>(`[data-m="${k}"]`);
const lines = (el: El | null, type = "lines") => (el ? SplitText.create(el, { type, mask: "lines", autoSplit: false }) : null);
// registers a cleanup with the gsap.context the builder runs in (the runtime's matchMedia), so rebuilds undo it
const onRevert = (fn: () => void) => gsap.context(() => fn);
const plainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
// per-item stagger that still lands the last item inside its window
const fit = (n: number, room: number, each: number) => (n > 1 ? Math.min(each, room / (n - 1)) : 0);
const pinEnd = (pct: number, column: boolean) => `+=${Math.round(pct * (column ? 0.6 : 1))}%`;

function pinned(sec: El, pct: number, scrub: number, ctx: BuildCtx, snap?: ScrollTrigger.SnapVars) {
  const tl = gsap.timeline({
    immediateRender: false, // the word tweens at 0 must not stamp their from-state while the hero is showing
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: sec, start: "top top", end: pinEnd(pct, ctx.column), pin: true, scrub,
      anticipatePin: 1, invalidateOnRefresh: true, snap: ctx.column ? undefined : snap,
    },
  });
  return tl.to({}, { duration: 1 }, 0); // positions are fractions of the pin
}

/** Every pinned sheet slides the word to its resting placement while the sheet scrolls in. */
function entry(sec: El, from: () => Layout, to: () => Layout) {
  gsap
    .timeline({ immediateRender: false, scrollTrigger: { trigger: sec, start: "top bottom", end: "top top", scrub: 0.6, invalidateOnRefresh: true } })
    .fromTo(store.slots, slotVars(from), { ...slotVars(to), duration: 1, ease: "power1.inOut", immediateRender: false }, 0);
}

// ---- intro ----

const intro = {
  run: 0,
  done: false,
  calm: false, // the visitor already touched the page: no V nudge
  tl: null as gsap.core.Timeline | null,
  nudge: null as gsap.core.Animation | null,
  off: null as (() => void) | null,
};
let runs = 0;

function killNudge() {
  intro.calm = true;
  if (!intro.nudge) return;
  intro.nudge.kill();
  intro.nudge = null;
  gsap.to(store.slots[0], { lift: 0, duration: 0.2, ease: "power2.out", overwrite: "auto" });
}

function inked() {
  store.sand = 0;
  reveal();
  document.documentElement.classList.add("inked");
  intro.done = true;
  compose(true);
}

/**
 * The type case fills with rain (GPU only, at the top of the page), then the letters set crisp and the V nods
 * down. Anything else simply sets the letters. Runs once per visit; rebuilds on resize leave it alone.
 */
export function buildIntro(ctx: BuildCtx): void {
  if (intro.run) return;
  const run = (intro.run = ++runs);
  const html = document.documentElement;

  const input = () => {
    if (intro.tl?.isActive()) intro.tl.timeScale(6); // hurry, never block: scroll stays live
    killNudge();
  };
  const opts = { passive: true };
  addEventListener("wheel", input, opts);
  addEventListener("touchstart", input, opts);
  addEventListener("keydown", input);
  intro.off = () => {
    removeEventListener("wheel", input);
    removeEventListener("touchstart", input);
    removeEventListener("keydown", input);
  };

  void Promise.race([stageReady, wait(1200).then(() => "late" as const)]).then((kind) => {
    if (intro.run !== run) return;
    const fresh = window.scrollY < 2 && !location.hash; // rain only into the hero, never onto a sheet mid-state
    if (kind !== "gpu" || !html.classList.contains("intro") || !fresh) {
      html.classList.remove("intro");
      inked();
      return;
    }
    const delay = Math.max(0, 0.4 - performance.now() / 1000);
    intro.tl = gsap
      .timeline({ delay })
      .set(store, { sand: 1, rain: 0 })
      .to(store, { rain: 1, duration: ctx.column ? 1.2 : 1.9, ease: "none" }) // grain easing lives in the shader
      .call(inked) // same tick: the grain fill turns into solids
      .call(() => {
        if (intro.calm) return;
        const st = store.slots[0];
        intro.nudge = gsap.to(st, {
          lift: 0.018 * st.s, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 3, repeatDelay: 1.2,
          onComplete: () => void (intro.nudge = null),
        });
      }, [], "+=0.6");
  });
}

/** Motion unmounted: stop the intro. A visit that already saw the rain does not get it again on return. */
export function disposeIntro(): void {
  intro.tl?.kill();
  intro.nudge?.kill();
  intro.off?.();
  if (intro.done) document.documentElement.classList.remove("intro");
  Object.assign(intro, { run: 0, done: false, calm: false, tl: null, nudge: null, off: null });
}

// ---- Sheet 01: V, the hero leaving ----

let vExit: ScrollTrigger | null = null;

export function buildV(ctx: BuildCtx): void {
  const sec = document.getElementById("v");
  if (!sec) return;
  const m = hooks(sec);
  const etym = lines(m("etym"));
  const plain = [m("spec"), m("vnote"), ...[".lede", ".ctas", ".folio-b", ".place"].map((s) => sec.querySelector<El>(s))].filter(
    (el): el is El => !!el,
  );

  const tl = gsap.timeline({
    immediateRender: false,
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: sec, start: "top top", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (self.progress > 0) killNudge();
        if (self.progress >= 0.02) unpeek();
      },
    },
  });
  tl.to({}, { duration: 1 }, 0);
  if (etym) tl.to(etym.lines, { yPercent: -100, duration: 0.3, stagger: 0.03, ease: "power2.in" }, 0);
  if (plain.length) tl.to(plain, { yPercent: -40, autoAlpha: 0, duration: 0.45, stagger: 0.03, ease: "power1.in" }, 0);
  // the word leaves the type case for the middle of the screen (in place on mobile), and any nudge is cleared
  tl.fromTo(
    store.slots,
    { ...slotVars(L.hero), lift: 0 },
    { ...slotVars(() => L.center()), lift: 0, duration: 1, ease: "power1.inOut", immediateRender: false },
    0,
  );
  vExit = tl.scrollTrigger ?? null;

  const turn = m("cta-turn"), guides = m("cta-guides");
  const toTurn = (e: MouseEvent) => {
    if (!plainClick(e)) return;
    e.preventDefault();
    ctx.scrollToSheet("turn", { at: 0.8, duration: 2.4 });
  };
  const toGuides = (e: MouseEvent) => {
    if (!plainClick(e)) return;
    e.preventDefault();
    ctx.scrollToSheet("sh", { duration: 1.6 });
  };
  turn?.addEventListener("click", toTurn);
  guides?.addEventListener("click", toGuides);
  onRevert(() => {
    turn?.removeEventListener("click", toTurn);
    guides?.removeEventListener("click", toGuides);
    vExit = null;
  });
}

// ---- hero peeks ----

export function buildPeeks(ctx: BuildCtx): void {
  const sec = document.getElementById("v");
  if (!sec) return;
  const slots = Array.from(sec.querySelectorAll<El>(".slot[data-slot]"));

  const chip = document.createElement("span");
  chip.className = "peek-chip";
  chip.setAttribute("aria-hidden", "true");
  chip.textContent = "same both ways";
  chip.style.cssText =
    "position:fixed;left:0;top:0;z-index:5;pointer-events:none;white-space:nowrap;visibility:hidden;opacity:0;" +
    "padding:6px 8px;border:1px solid var(--rule);background:var(--paper-hi);color:var(--ink-2);" +
    "font:500 12px/1 var(--f-mono);font-stretch:87.5%;letter-spacing:.06em;text-transform:uppercase";
  sec.appendChild(chip);

  // the I turns into an I: say so, just above its cap
  let shown = false;
  const explain = (el: El) => {
    const r = el.getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const y = r.top + 0.12 * fs - 10;
    gsap.killTweensOf(chip);
    gsap.set(chip, { x: r.left + r.width / 2, xPercent: -50, yPercent: -100 });
    shown = true;
    gsap.timeline()
      .fromTo(chip, { autoAlpha: 0, y: y + 6 }, { autoAlpha: 1, y, duration: 0.3, ease: "power3.out" })
      .to(chip, { autoAlpha: 0, duration: 0.3, ease: "power1.in", onComplete: () => void (shown = false) }, 1.6);
  };

  const fire = (el: El) => {
    if (!intro.done || (vExit?.progress ?? 0) >= 0.02 || ctx.kind === "none") return;
    const i = Number(el.dataset.slot);
    if (peek(i) && i === 5) explain(el);
  };
  const hover = (e: PointerEvent) => {
    if (e.pointerType !== "touch") fire(e.currentTarget as El);
  };
  const tap = (e: PointerEvent) => {
    if (e.pointerType === "touch") fire(e.currentTarget as El); // a pan cancels the pointer, so this is a real tap
  };
  for (const el of slots) {
    el.addEventListener("pointerenter", hover);
    el.addEventListener("pointerup", tap);
  }
  const off = ctx.lenis?.on("scroll", (l) => {
    if (Math.abs(l.velocity) < 0.5) return;
    unpeek();
    if (!shown) return;
    shown = false;
    gsap.killTweensOf(chip);
    gsap.to(chip, { autoAlpha: 0, duration: 0.15 });
  });
  onRevert(() => {
    for (const el of slots) {
      el.removeEventListener("pointerenter", hover);
      el.removeEventListener("pointerup", tap);
    }
    off?.();
    unpeek();
    chip.remove();
  });
}

// ---- Sheet 02: the Quarter Turn ----

export function buildTurn(ctx: BuildCtx): void {
  const sec = document.getElementById("turn");
  if (!sec) return;
  const m = hooks(sec);
  const col = ctx.column;
  // desktop snaps to the three reads: front, sculpture, side (and lets go at the end). No inertia: a smooth-scroll
  // arrival still carries velocity, which would throw a landing at .80 on to the end
  const tl = pinned(sec, 150, 0.8, ctx, {
    snapTo: [0, 0.36, 0.8, 1], duration: { min: 0.3, max: 0.8 }, delay: 0.15, directional: true, inertia: false, ease: "power2.inOut",
  });

  // word: breathe apart, the wave from the I, pitch down to show the solids, level, close up
  const peak = col || probeLow() ? 8 : TUNE.pitchPeak;
  if (!col) {
    const wide = () => L.center({ spacing: TUNE.spacingPeak, zoom: 0.9 });
    tl.fromTo(store.slots, slotVars(() => L.center()), { ...slotVars(wide), duration: 0.18, ease: "power2.inOut", immediateRender: false }, 0.06);
    tl.fromTo(store.slots, slotVars(wide), { ...slotVars(() => L.center()), duration: 0.1, ease: "power2.inOut", immediateRender: false }, 0.62);
  }
  transition(tl, "quarterTurn", TUNE.waveStart, 0.525, TUNE.turnDur);
  tl.fromTo(store, { pitch: 0 }, { pitch: peak, duration: 0.2, ease: "power2.inOut", immediateRender: false }, 0.16);
  tl.fromTo(store, { pitch: peak }, { pitch: 0, duration: 0.14, ease: "power2.inOut", immediateRender: false }, 0.5);

  // copy: the kicker decodes, line one rises in; at the side read line two replaces it and the I gets its note
  const kicker = m("kicker");
  if (kicker) {
    const text = kicker.textContent ?? "";
    tl.to(kicker, { scrambleText: { text, chars: "VARSHITHSHIPPING", speed: 0.6 }, duration: 0.08 }, 0);
  }
  const a = lines(m("h2a"), "lines,chars");
  if (a) {
    tl.fromTo(a.chars, { yPercent: 100 }, { yPercent: 0, duration: 0.04, ease: "expo.out", stagger: fit(a.chars.length, 0.04, 0.012) }, 0);
    tl.to(a.lines, { yPercent: -100, duration: 0.06, ease: "power2.in", stagger: 0.01 }, 0.7);
  }
  const b = lines(m("h2b"), "lines,chars");
  if (b) tl.fromTo(b.chars, { yPercent: 100 }, { yPercent: 0, duration: 0.04, ease: "expo.out", stagger: fit(b.chars.length, 0.04, 0.012) }, 0.72);
  const leader = m("leader"), callout = m("icallout");
  if (callout) tl.fromTo(callout, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.72);
  if (leader) tl.fromTo(leader, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.08, ease: "power2.inOut" }, 0.72);
  const cap = lines(m("caption"));
  if (cap) tl.fromTo(cap.lines, { yPercent: 100 }, { yPercent: 0, duration: 0.05, ease: "expo.out", stagger: 0.01 }, 0.74);
}

// ---- the manifest: the word stands as SHIPPING beside the list ----

export function buildManifest(ctx: BuildCtx): void {
  const sec = document.getElementById("manifest");
  if (!sec) return;
  if (!ctx.column) entry(sec, () => L.center(), () => L.sticky("#manifest [data-m=ship]"));

  const rows = Array.from(sec.querySelectorAll<El>("[data-m=row]"));
  if (!rows.length) return;
  // table rows do not clip reliably, so their cells do (a shared left-to-right wipe per row)
  const parts = (row: El) => (getComputedStyle(row).display === "table-row" ? Array.from(row.children) : [row]);
  gsap.set(rows.flatMap(parts), { clipPath: "inset(0 100% 0 0)" });
  ScrollTrigger.batch(rows, {
    start: "top 85%",
    once: true,
    onEnter: (batch) =>
      batch.forEach((row, i) => {
        const delay = i * 0.06;
        gsap.to(parts(row as El), { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "power3.out", delay });
        const no = row.firstElementChild;
        const text = no?.textContent?.trim();
        if (no && text) gsap.to(no, { scrambleText: { text, chars: "0123456789", speed: 0.5 }, duration: 0.6, delay });
      }),
  });
}

// ---- Sheet 03: VAR ----

export function buildVar(ctx: BuildCtx): void {
  const sec = document.getElementById("var");
  if (!sec) return;
  const m = hooks(sec);
  const col = ctx.column;
  if (!col) entry(sec, () => L.sticky("#manifest [data-m=ship]"), () => L.center());
  const tl = pinned(sec, 150, 0.8, ctx);

  // word: turn back to VARSHITH (the row breathes so the blocks clear), keep V A R, forward-delete S H I T H
  transition(tl, "turnBack", 0, 0.28, 0.12);
  const vr = store.slots.slice(0, 3);
  if (!col) {
    const wide = () => L.center({ spacing: TUNE.spacingPeak });
    tl.fromTo(store.slots, slotVars(() => L.center()), { ...slotVars(wide), duration: 0.06, ease: "power2.inOut", immediateRender: false }, 0);
    tl.fromTo(store.slots, slotVars(wide), { ...slotVars(() => L.center()), duration: 0.06, ease: "power2.inOut", immediateRender: false }, 0.22);
  }
  transition(tl, "toVar", 0.28, 0.18, 0.05);
  if (!col) {
    tl.fromTo(vr, slotVars(() => L.center()), { ...slotVars(() => L.anchor("#var")), duration: 0.12, ease: "power1.inOut", immediateRender: false }, 0.4);
    tl.fromTo(vr, slotVars(() => L.anchor("#var")), { ...slotVars(() => L.center()), duration: 0.08, ease: "power1.inOut", immediateRender: false }, 0.82);
  }
  transition(tl, "fromVar", 0.9, 0.1, 0.04);

  // copy
  const kicker = m("kicker");
  if (kicker) {
    const text = kicker.textContent ?? "";
    tl.fromTo(kicker, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0.3);
    tl.to(kicker, { scrambleText: { text, chars: "VAR0123456789", speed: 0.6 }, duration: 0.06 }, 0.3);
  }
  const h2 = lines(m("h2"), "words,lines");
  if (h2) tl.fromTo(h2.words, { yPercent: 100 }, { yPercent: 0, duration: 0.05, ease: "expo.out", stagger: fit(h2.words.length, 0.04, 0.008) }, 0.31);
  const sub = lines(m("sub"));
  if (sub) tl.fromTo(sub.lines, { yPercent: 100 }, { yPercent: 0, duration: 0.05, ease: "expo.out", stagger: 0.01 }, 0.35);
  const code = m("code");
  if (code) tl.fromTo(code, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.4);

  // three declarations, each typed on its own line while its numeral rolls into the shared cell
  const decl = Array.from(sec.querySelectorAll<El>("[data-m=code] [data-m=line]"));
  const nums = Array.from(sec.querySelectorAll<El>("[data-m=num]")).map((n) => ({
    num: lines(n.querySelector<El>("dt")),
    note: lines(n.querySelector<El>("dd")),
  }));
  [0.44, 0.56, 0.7].forEach((t, k) => {
    const line = decl[k];
    if (line) {
      const n = Math.max(1, (line.textContent ?? "").length);
      tl.fromTo(line, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.08, ease: `steps(${n})` }, t);
    }
    const cur = nums[k], prev = nums[k - 1];
    if (cur?.num) tl.fromTo(cur.num.lines, { yPercent: 100 }, { yPercent: 0, duration: 0.06, ease: "expo.out" }, t);
    if (cur?.note) tl.fromTo(cur.note.lines, { yPercent: 100 }, { yPercent: 0, duration: 0.05, ease: "expo.out", stagger: 0.008 }, t + 0.02);
    if (prev?.num) tl.to(prev.num.lines, { yPercent: -100, duration: 0.05, ease: "power2.in" }, t);
    if (prev?.note) tl.to(prev.note.lines, { yPercent: -100, duration: 0.04, ease: "power2.in" }, t);
  });
}
