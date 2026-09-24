// The home page's motion runtime: Lenis on the GSAP ticker, matchMedia build contexts that rebuild on width
// changes, sheet tracking for the mini index, navigation, and the per-tick scroll readings (direction, slant,
// squash) that the header and the stage use.

import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { SHEETS, type SheetId } from "../_data/word";
import { compose, hideWord, invalidateLayout, resetWord, rest, scanWord, settle } from "./layouts";
import { TUNE, type BuildCtx } from "./sheets-a";
import { onSheet, setSheet, stageKind, store } from "./store";

export type ScrollToSheet = (id: SheetId, o?: { at?: number; duration?: number; immediate?: boolean }) => void;

export type Runtime = {
  lenis: Lenis | null;
  /** The live build context set; replaced on every rebuild. */
  readonly mm: gsap.MatchMedia;
  scrollToSheet: ScrollToSheet;
  TUNE: typeof TUNE;
  /** Run the sheet builders under matchMedia now, and again after every width change. */
  mount(build: (ctx: BuildCtx) => void): void;
  dispose(): void;
};

// spec §3.4, so builders can say ease: "turn"
const EASES = { turn: "power2.inOut", reveal: "expo.out", snap: "power3.out", peek: "back.out(1.6)", layout: "power1.inOut" };
const QUERIES = { desktop: "(min-width: 641px)", mobile: "(max-width: 640px)", reduce: "(prefers-reduced-motion: reduce)" };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const isSheet = (id: unknown): id is SheetId => SHEETS.some((s) => s.id === id);

// each top-level section's scroll region (its pin spacer when pinned), to find the same spot after a rebuild
type Region = { id: string; top: number; height: number };
type Mark = { id: string; f: number };

export function startRuntime(): Runtime {
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, CustomEase);
  for (const [name, ease] of Object.entries(EASES)) gsap.registerEase(name, gsap.parseEase(ease));
  // resize is ours: width changes rebuild, height-only changes refresh (see onResize)
  ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: "visibilitychange,DOMContentLoaded,load" });
  ScrollTrigger.defaults({ anticipatePin: 1, invalidateOnRefresh: true });

  const html = document.documentElement;
  const motion = html.classList.contains("motion") && !matchMedia(QUERIES.reduce).matches;
  const touch = ScrollTrigger.isTouch === 1;
  const header = document.querySelector<HTMLElement>("[data-m=header]");
  const vmark = document.querySelector<HTMLElement>(".vmark");
  const folio = document.querySelector<HTMLElement>("[data-m=folio]");
  const folioText = folio?.textContent ?? "";
  const minis = Array.from(document.querySelectorAll<HTMLElement>("[data-mi]"));
  const side = minis.map(() => false);

  // ---- Lenis on the GSAP ticker ----

  let lenis: Lenis | null = null;
  const raf = (t: number) => lenis?.raf(t * 1000);
  const restoration = history.scrollRestoration;
  if (motion) {
    lenis = new Lenis({ lerp: 0.1, syncTouch: false, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    history.scrollRestoration = "manual"; // pins change the page height; a restored offset would land elsewhere
  }

  // ---- regions and bookmarks ----

  let regions: Region[] = [];
  let y0 = 0;
  let resizing = false;
  let mark: Mark | null = null;
  // sheet tracking: a sheet is current once its region's top crosses mid-screen (the manifest belongs to 02,
  // the glyph grid to 06), and the last 5% of the page is the mini index's end state. Measured per refresh,
  // read per tick, in every mode: ScrollTrigger's endTrigger misses the pin spacing above it
  let sheetTops: number[] = [];
  let endAt = Infinity;

  const measureRegions = () => {
    regions = Array.from(document.querySelectorAll<HTMLElement>("main section[id]"))
      .filter((s) => !s.parentElement?.closest("section[id]"))
      .map((s) => {
        const box = s.parentElement?.classList.contains("pin-spacer") ? s.parentElement : s;
        const r = box.getBoundingClientRect();
        return { id: s.id, top: r.top + window.scrollY, height: r.height };
      });
    sheetTops = SHEETS.map((s) => (regions.find((g) => g.id === s.id)?.top ?? Infinity) - innerHeight / 2);
    endAt = 0.95 * ScrollTrigger.maxScroll(window);
  };
  const track = (y: number) => {
    if (!regions.length) return;
    let at = 0;
    for (let k = 1; k < sheetTops.length; k++) if (sheetTops[k] <= y) at = k;
    setSheet(y >= endAt ? SHEETS.length : at);
  };
  const markAt = (y: number): Mark | null => {
    let r: Region | undefined;
    for (const g of regions) if (g.top <= y) r = g;
    return r ? { id: r.id, f: r.height ? (y - r.top) / r.height : 0 } : null;
  };
  // ScrollTrigger caches the scroll offset until the native scroll event, a frame later, so an immediate jump
  // primes that cache through a trigger's setter before updating; settle() then finishes at the new place
  const jump = (y: number) => {
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
    ScrollTrigger.getAll()[0]?.scroll(y);
    ScrollTrigger.update();
  };

  // ---- navigation ----

  const scrollToSheet: ScrollToSheet = (id, o = {}) => {
    const el = document.getElementById(id);
    if (!el) return;
    const pin = ScrollTrigger.getAll().find((st) => st.pin === el);
    const y = id === SHEETS[0].id ? 0 : pin ? pin.start + (o.at ?? 0) * (pin.end - pin.start) : el.getBoundingClientRect().top + window.scrollY;
    if (!lenis) return window.scrollTo(0, y);
    if (o.immediate) return jump(y);
    const far = Math.abs(y - lenis.scroll) / innerHeight;
    lenis.scrollTo(y, { duration: o.duration ?? clamp(0.8 + far * 0.1, 0.8, 2.4), easing: inOutCubic, force: true });
  };

  // the mini index and the Shell ask for sheets with a cancelable event; cancelling says "handled"
  const onGoto = (e: Event) => {
    const id = (e as CustomEvent<unknown>).detail;
    if (!isSheet(id)) return;
    e.preventDefault();
    scrollToSheet(id);
  };
  addEventListener("tqt:goto", onGoto);

  const jumpToHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    if (isSheet(id)) return scrollToSheet(id, { immediate: true });
    const el = document.getElementById(id);
    if (el) jump(el.getBoundingClientRect().top + window.scrollY);
  };

  // ---- per tick: scroll readings, composition, the mini index flips ----

  let squash = "100";
  const tick = () => {
    const v = lenis ? lenis.velocity : 0;
    if (v) store.direction = v > 0 ? 1 : -1;
    vmark?.classList.toggle("up", v < -0.5);

    const lean = !store.column && (store.tier === "high" || store.tier === "mid") ? clamp(v * 0.12, -8, 8) : 0;
    store.slant += (lean - store.slant) * 0.1;
    if (!lean && Math.abs(store.slant) < 0.01) store.slant = 0;

    const sq = (100 - 25 * Math.min(1, Math.abs(v) / 40)).toFixed(0);
    if (sq !== squash) header?.style.setProperty("--squash", (squash = sq));

    const y = lenis ? lenis.scroll : window.scrollY;
    if (!resizing) {
      y0 = y;
      track(y);
    }
    compose();

    // each mini letter rolls to its SIDE face once its solid has fully turned, and back once it has returned,
    // so the header repeats the wave in the same order
    for (let k = 0; k < minis.length; k++) {
      const rot = store.slots[Number(minis[k].dataset.mi)]?.rot ?? 0;
      if (side[k] ? rot > 0.5 : rot < 89.5) continue;
      side[k] = !side[k];
      gsap.to(minis[k], { rotationX: side[k] ? 90 : 0, duration: 0.35, ease: "power3.out", overwrite: true });
    }
  };
  gsap.ticker.add(tick); // after Lenis, before the stage (which adds its render once it has loaded)

  // ---- refresh and rebuild ----

  let first = true;
  const onRefresh = () => {
    scanWord();
    measureRegions();
    track(window.scrollY);
    compose(true);
  };
  ScrollTrigger.addEventListener("refreshInit", invalidateLayout);
  ScrollTrigger.addEventListener("refresh", onRefresh);

  // `final` is false for a breakpoint re-run mid-resize: the debounced rebuild still has to land on the same mark
  const refreshNow = (final = true) => {
    ScrollTrigger.refresh();
    if (first) {
      first = false;
      jumpToHash();
    } else if (mark) {
      const { id, f } = mark;
      const r = regions.find((g) => g.id === id);
      if (r) jump(r.top + f * r.height);
    }
    if (final) {
      mark = null;
      resizing = false;
    }
    settle();
  };

  let build: ((ctx: BuildCtx) => void) | null = null;
  let mm = gsap.matchMedia();
  let quiet = false;
  let sync = false;

  const ctxFor = (column: boolean): BuildCtx => ({
    reduced: false,
    column,
    get kind() {
      return stageKind();
    },
    lenis,
    scrollToSheet,
    TUNE,
  });

  const run = () => {
    mm.revert();
    mm = gsap.matchMedia();
    sync = true;
    mm.add(QUERIES, (c) => {
      const { mobile, reduce }: gsap.Conditions = c.conditions ?? {};
      const calm = !!reduce || !motion;
      store.column = !calm && !!mobile;
      invalidateLayout();
      if (calm && motion) {
        // reduced motion switched on mid-visit: the stills take over
        html.classList.remove("motion", "intro");
        hideWord();
        quiet = true;
      } else if (!calm && quiet) {
        html.classList.add("motion");
        rest();
        quiet = false;
      }
      if (!calm) build?.(ctxFor(!!mobile));
      if (!sync) queueMicrotask(() => refreshNow(false)); // a breakpoint re-run: remeasure before the next frame
    });
    sync = false;
    refreshNow();
  };

  // width changes rebuild (splits and placements depend on it); height-only changes just refresh,
  // except the mobile toolbar showing and hiding, which is ignored
  let w = innerWidth, h = innerHeight, timer = 0;
  const onResize = () => {
    if (!resizing) {
      resizing = true;
      mark = markAt(y0);
    }
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      const wide = innerWidth !== w;
      const tall = innerHeight !== h && (!touch || Math.abs(innerHeight - h) > h * 0.25);
      w = innerWidth;
      if (tall || wide) h = innerHeight;
      if (wide && build) run();
      else if (tall || wide) refreshNow();
      else resizing = false;
    }, 250);
  };
  addEventListener("resize", onResize);

  const offFolio = onSheet((i) => {
    if (folio && i >= 0) folio.textContent = `Sheet ${SHEETS[Math.min(i, SHEETS.length - 1)].no}/${SHEETS[SHEETS.length - 1].no}`;
  });

  return {
    lenis,
    get mm() {
      return mm;
    },
    scrollToSheet,
    TUNE,
    mount(fn) {
      build = fn;
      run();
    },
    dispose() {
      clearTimeout(timer);
      removeEventListener("resize", onResize);
      removeEventListener("tqt:goto", onGoto);
      ScrollTrigger.removeEventListener("refreshInit", invalidateLayout);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      mm.revert();
      gsap.ticker.remove(tick);
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis?.destroy();
      if (motion) history.scrollRestoration = restoration;
      offFolio();
      if (folio) folio.textContent = folioText;
      vmark?.classList.remove("up");
      header?.style.removeProperty("--squash");
      if (minis.length) {
        gsap.killTweensOf(minis);
        gsap.set(minis, { clearProps: "transform" });
      }
      setSheet(-1);
      store.slant = 0;
      store.column = false;
      resetWord();
    },
  };
}
