// Sheets 04 to 07 and the glyph grid (spec §7): A…I, SH, T, the 71 characters, and the cursor-and-home
// finale. Each pinned timeline is exactly 1 long, so every position below is a §7 progress mark.
// transition() is the only writer of rot, tone, alpha, ghost, flat and drain; this file moves x, y, s and lift.
// Every store write is a tween with explicit from and to values on a scroll-driven timeline, so compose()
// (layouts.ts) can replay it in page order and a frame depends only on the playheads. DOM is found by data-m.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { accentVars, guides } from "../_data/guides";
import { driveWeight } from "../_home/Weight";
import { L, slotVars, transition, type Layout } from "./layouts";
import { clearCopy, type BuildCtx } from "./sheets-a";
import { store } from "./store";

type Tl = gsap.core.Timeline;
type Offs = (() => void)[];
type Kit = { sec: HTMLElement; offs: Offs; safe: <F extends (...args: never[]) => unknown>(f: F) => F };

const T_PIN = "tqt-t"; // Sheet 06's pin: the ride into Sheet 07 starts where it ends
const ASC = 0.82; // Toolsplex ascent: in a line-height:1 box the baseline sits .82em down
const INK_L = 0.045; // left side bearing of a capital, in em
const BLINK_OFF = 0; // store.blink at rest; the V never blinks, so 0 means no caret
const TYPE_AT = 0.3; // Sheet 07 types its line from .30 to .75
const TYPE_END = 0.75;
const OUT = 110; // yPercent that takes a 1em roll clear of its clip (ink spans .12 to .82 of it)

// ---------- plumbing ----------

/** A sheet builder in its own gsap.context, nested in Motion's, so its tweens, triggers, splits and
 *  listeners (via offs) all revert with the matchMedia branch. */
function sheet(id: string, body: (k: Kit) => void) {
  const sec = document.getElementById(id);
  if (!sec) return;
  gsap.context((_self, contextSafe) => {
    const offs: Offs = [];
    const safe = <F extends (...args: never[]) => unknown>(f: F) => (contextSafe ? (contextSafe(f) as unknown as F) : f);
    body({ sec, offs, safe });
    return () => offs.forEach((off) => off());
  });
}

const hook = <T extends Element = HTMLElement>(root: ParentNode | null, name: string) =>
  root?.querySelector<T>(`[data-m="${name}"]`) ?? null;
const hooks = <T extends Element = HTMLElement>(root: ParentNode | null, name: string) =>
  root ? Array.from(root.querySelectorAll<T>(`[data-m="${name}"]`)) : [];
const all = <T extends Element = HTMLElement>(root: ParentNode | null, sel: string) =>
  root ? Array.from(root.querySelectorAll<T>(sel)) : [];

function pinned(ctx: BuildCtx, sec: Element, length: number, scrub: number, vars: ScrollTrigger.Vars = {}): Tl {
  const tl = gsap.timeline({
    immediateRender: false, // a refresh at the top must not stamp this sheet's opening state over the hero
    defaults: { ease: "none", duration: 0.06 },
    scrollTrigger: {
      trigger: sec,
      start: "top top",
      end: `+=${Math.round(length * (ctx.column ? 0.6 : 1) * 100)}%`,
      pin: true,
      scrub,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      ...vars,
    },
  });
  tl.set({}, {}, 1); // exactly 1 long, so positions read as progress
  return tl;
}

/** Entry rule: while a pinned sheet scrolls in, every slot goes from the rest placement the sheet before
 *  left it on to this sheet's own. */
function entry(ctx: BuildCtx, sec: Element, from: () => Layout, to: () => Layout) {
  if (ctx.column) return; // the column never moves
  gsap
    .timeline({
      immediateRender: false,
      scrollTrigger: { trigger: sec, start: "top bottom", end: "top top", scrub: 0.6, invalidateOnRefresh: true },
    })
    .fromTo(store.slots, slotVars(from), { ...slotVars(to), duration: 1, ease: "power1.inOut", immediateRender: false });
}

/** Spread n starts across `span` so the last one still finishes inside it. */
const fit = (n: number, span: number, dur: number, max: number) =>
  n > 1 ? Math.min(max, Math.max(0, span - dur) / (n - 1)) : 0;

/** Masked split. autoSplit stays off: a width change reverts and rebuilds every sheet instead. */
function split(el: Element | Element[] | null, type: "lines" | "words" | "chars") {
  const t = Array.isArray(el) ? el.filter(Boolean) : el;
  if (!t || (Array.isArray(t) && !t.length)) return null;
  return SplitText.create(t, { type, mask: type, autoSplit: false });
}

/** Masked pieces rise into place; the whole stagger fits inside `span`. */
function rise(tl: Tl, els: Element[] | undefined, at: number, span: number, dur = 0.06) {
  if (!els?.length) return;
  tl.fromTo(
    els,
    { yPercent: 110 },
    { yPercent: 0, ease: "expo.out", duration: dur, stagger: fit(els.length, span, dur, 0.02) },
    at,
  );
}

function fadeUp(tl: Tl, els: Element | Element[] | null, at: number, dur = 0.06, span = dur) {
  const list = (Array.isArray(els) ? els : [els]).filter((e): e is Element => !!e);
  if (!list.length) return;
  tl.fromTo(
    list,
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, ease: "power3.out", duration: dur, stagger: fit(list.length, span, dur, 0.03) },
    at,
  );
}

/** Running heads decode as a pin starts, scrambling through the sheet's own letters. */
function scramble(tl: Tl, el: HTMLElement | null, letters: string, at: number, dur = 0.08) {
  const text = el?.textContent;
  if (el && text) tl.to(el, { scrambleText: { text, chars: `${letters}0123456789`, speed: 0.6 }, duration: dur }, at);
}

/** Draw-on. A hairline with pathLength="1" runs its dash in path units (DrawSVG measures real lengths,
 *  which that attribute would rescale); anything without it goes through DrawSVG. */
function draw(tl: Tl, els: Element[], at: number, dur: number, stagger = 0) {
  const unit = els.filter((e) => e.getAttribute("pathLength") === "1");
  const real = els.filter((e) => e.getAttribute("pathLength") !== "1");
  if (unit.length) {
    tl.fromTo(unit, { strokeDasharray: "1 2", strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: dur, stagger }, at);
  }
  if (real.length) tl.fromTo(real, { drawSVG: "0%" }, { drawSVG: "100%", duration: dur, stagger }, at);
}

// ---------- 04 · A…I ----------

/** The token: a time-based loop A to I that dwells at each station. Measured in the pipe's own user space,
 *  so it runs across on desktop and down the column on mobile without knowing which. */
function tokenLoop(pipe: Element, stations: Element[], hair: Element[]): Tl | undefined {
  const token = hook<SVGGraphicsElement>(pipe, "token");
  const space = token?.parentNode as SVGGraphicsElement | null;
  const ctm = space?.getScreenCTM?.();
  if (!token || !ctm) return;
  const inv = ctm.inverse();
  gsap.set(token, { x: 0, y: 0 });
  const local = (x: number, y: number) => new DOMPoint(x, y).matrixTransform(inv);
  const mid = (el: Element) => {
    const r = el.getBoundingClientRect();
    return local(r.left + r.width / 2, r.top + r.height / 2);
  };
  const home = mid(token);
  const stops = stations.map(mid);
  const r = hair
    .map((h) => h.getBoundingClientRect())
    .sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height))[0];
  if (r) {
    // the hairline's ends (its longest stroke), along whichever axis it runs
    const across = r.width >= r.height;
    stops.unshift(across ? local(r.left, r.top + r.height / 2) : local(r.left + r.width / 2, r.top));
    stops.push(across ? local(r.right, r.top + r.height / 2) : local(r.left + r.width / 2, r.bottom));
  }
  if (stops.length < 2) return;
  const pts = stops.map((p) => ({ x: p.x - home.x, y: p.y - home.y }));
  const legs = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const total = legs.reduce((a, b) => a + b, 0) || 1;
  const loop = gsap.timeline({ repeat: -1, paused: true });
  loop.set(token, pts[0]);
  pts.slice(1).forEach((p, i) => {
    loop.to(token, { ...p, duration: Math.max(0.18, (2.2 * legs[i]) / total), ease: "power2.inOut" });
    loop.to({}, { duration: i < pts.length - 2 ? 0.3 : 0.5 }); // dwell; a little longer on the I
  });
  return loop; // about 4s round
}

export function buildAI(ctx: BuildCtx) {
  sheet("ai", ({ sec, safe }) => {
    if (ctx.reduced) return;

    const center = () => L.center();
    entry(ctx, sec, center, center);

    const pipe = hook(sec, "pipe");
    const stations = all(pipe, "[data-glyphs] [data-slot]");
    // the hairline is whatever stroke in the pipe isn't a station glyph or the token
    const hair = all(pipe, "line, path, polyline").filter((e) => !e.closest("[data-glyphs]") && !e.closest('[data-m="token"]'));
    let loop: Tl | undefined;
    const rebuild = safe((active: boolean) => {
      loop?.kill();
      loop = pipe ? tokenLoop(pipe, stations, hair) : undefined;
      if (active) loop?.play();
    });

    const tl = pinned(ctx, sec, 1.6, 0.8, {
      onToggle: (st) => (st.isActive ? loop?.play() : loop?.pause()),
      onRefresh: (st) => rebuild(st.isActive),
    });

    // .00–.14 the word steps out, T first; A and I travel to their stations
    const out = (i: number) =>
      i === 1 ? L.anchor('#ai [data-m="anchor-a"]')[1] : i === 5 ? L.anchor('#ai [data-m="anchor-i"]')[5] : undefined;
    transition(tl, "toAI", 0, 0.14, 0.05, ctx.column ? undefined : out);

    scramble(tl, hook(sec, "kicker"), "AI", 0);
    rise(tl, split(hook(sec, "h2"), "words")?.words, 0.08, 0.08);
    fadeUp(tl, hook(sec, "sub"), 0.12);

    // .18–.30 the hairline; .24–.50 each station draws, fills, and its label rises. The sheet colours the
    // stations and, in motion, zeroes their fill-opacity; only the opacity tweens, so the colour stays a live
    // token through theme switches.
    draw(tl, hair, 0.18, 0.12);
    const labels = all(hook(sec, "stations"), "li").map((li) => split(li, "lines")?.lines);
    const gap = fit(stations.length, 0.26, 0.1, 0.04);
    stations.forEach((st, k) => {
      const t0 = 0.24 + k * gap;
      const paths = all<SVGElement>(st, "path");
      draw(tl, paths, t0, 0.06);
      tl.fromTo(paths, { fillOpacity: 0 }, { fillOpacity: 1, duration: 0.03 }, t0 + 0.06);
      rise(tl, labels[k], t0 + 0.03, 0.05, 0.05);
    });
    const token = hook(pipe, "token");
    if (token) tl.fromTo(token, { opacity: 0 }, { opacity: 1, duration: 0.02 }, 0.3);

    // cards share one grid cell: .30 the first rises in; .56 it leaves and the next comes up
    const cards = hooks(sec, "card");
    const lines = cards.map((c) => split(all(c, "h3, p"), "lines")?.lines);
    const IN = [0.3, 0.62, 0.78];
    const LEAVE = [0.56, 0.76];
    cards.forEach((card, k) => {
      const at = IN[Math.min(k, IN.length - 1)];
      if (k > 0) tl.fromTo(card, { opacity: 0 }, { opacity: 1, duration: 0.001 }, at);
      rise(tl, lines[k], at, 0.08);
      const leave = LEAVE[k];
      if (leave !== undefined && k < cards.length - 1) {
        const ls = lines[k] ?? [];
        tl.to(ls, { yPercent: -110, ease: "power2.in", duration: 0.04, stagger: fit(ls.length, 0.05, 0.04, 0.01) }, leave);
        tl.to(card, { opacity: 0, duration: 0.001 }, leave + 0.05);
      }
    });

    // .86–1.00 A and I come home, then the word steps back in, T last
    const home = (i: number) => (i === 1 || i === 5 ? center()[i] : undefined);
    clearCopy(tl, sec, 0.8, ctx);
    transition(tl, "fromAI", 0.86, 0.14, 0.05, ctx.column ? undefined : home);
  });
}

// ---------- 05 · SH ----------

/** Sheet 05's number as an odometer. The paragraph clips vertically (to its cap box where the sheet trims
 *  it, its line box elsewhere); inside, a roll the scrub raises into view holds the number and a cover layer
 *  (the hovered guide's two cover lines) that swap. The roll is an inline-block with line-height 1, so the
 *  line box is unchanged and the baseline is .82em down whatever the sheet sets. Cover lines are .46em, so
 *  CLAUDE (3.9em of advances) fits under 001's 1.95em: line 1's caps top out with the number's and line 2
 *  sits on its baseline. The server's text nodes move in, and back out on revert. */
function rigNumber(el: HTMLElement, offs: Offs) {
  const kids = Array.from(el.childNodes);
  const served = el.style.cssText;
  const span = (css: string) => {
    const s = document.createElement("span");
    s.style.cssText = css;
    return s;
  };
  const C = 0.46;
  const roll = span("display:inline-block;position:relative;line-height:1;vertical-align:baseline");
  const num = span("display:inline-block");
  const cover = span(`position:absolute;inset:0;font-size:${C}em;white-space:nowrap;pointer-events:none`);
  const line = (top: number, color: string) =>
    span(`position:absolute;left:${(INK_L / C - INK_L).toFixed(4)}em;top:${top.toFixed(4)}em;color:${color}`);
  const l1 = line((ASC - 0.7) / C - (ASC - 0.7), "var(--ink)");
  const l2 = line(ASC / C - ASC, "var(--g-ink)");
  num.append(...kids);
  cover.append(l1, l2);
  roll.append(num, cover);
  el.append(roll);
  el.style.overflowX = "visible";
  el.style.overflowY = "clip";
  el.style.setProperty("overflow-clip-margin", ".04em"); // antialiasing on the cap line survives the clip
  offs.push(() => {
    roll.remove();
    el.append(...kids);
    el.style.cssText = served;
  });
  return { roll, num, cover, l1, l2 };
}

export function buildSH(ctx: BuildCtx) {
  sheet("sh", ({ sec, offs, safe }) => {
    if (ctx.reduced) return;

    const center = () => L.center();
    entry(ctx, sec, center, center);
    const tl = pinned(ctx, sec, 0.8, 0.6);

    // .00–.18 only S and H stay, and walk to the prompt
    const out = (i: number) => (i === 3 || i === 4 ? L.anchor('#sh [data-m="anchor"]')[i] : undefined);
    transition(tl, "toSH", 0, 0.18, 0.05, ctx.column ? undefined : out);

    scramble(tl, hook(sec, "kicker"), "SH", 0);
    rise(tl, split(hook(sec, "h2"), "lines")?.lines, 0.06, 0.08);
    fadeUp(tl, hook(sec, "sub"), 0.1);

    // `ls guides/` types itself: a clip that steps one monospace cell at a time
    const cmd = hook(sec, "sh-cmd");
    const n = cmd?.textContent?.length ?? 0;
    if (cmd && n) {
      tl.fromTo(
        cmd,
        { clipPath: "inset(0 100% 0 0)" },
        { clipPath: "inset(0 0% 0 0)", ease: `steps(${n})`, duration: 0.08 },
        0.1,
      );
    }

    // .18–.40 the number rolls up, the listing clips in row by row
    const big = hook(sec, "bignum");
    const rig = big ? rigNumber(big, offs) : null;
    if (rig) tl.fromTo(rig.roll, { yPercent: OUT }, { yPercent: 0, ease: "expo.out", duration: 0.1 }, 0.18);
    const rows = hooks(sec, "sh-row");
    if (rows.length) {
      tl.fromTo(
        rows,
        { clipPath: "inset(0 100% 0 0)" },
        { clipPath: "inset(0 0% 0 0)", ease: "power3.out", duration: 0.08, stagger: fit(rows.length, 0.2, 0.08, 0.08) },
        0.2,
      );
    }

    // the caret after SH blinks (CSS) from .18 until S and H leave at .86
    const caret = hook(sec, "caret");
    let on = false;
    tl.eventCallback("onUpdate", () => {
      const now = tl.time() >= 0.18 && tl.time() < 0.86;
      if (now !== on) caret?.classList.toggle("on", (on = now));
    });
    offs.push(() => caret?.classList.remove("on"));

    // .86–1.00 S and H go home and the word steps back in
    const home = (i: number) => (i === 3 || i === 4 ? center()[i] : undefined);
    clearCopy(tl, sec, 0.8, ctx);
    transition(tl, "fromSH", 0.86, 0.14, 0.05, ctx.column ? undefined : home);

    // hovering or focusing a guide row turns the number into that guide's cover (time-based, not scrubbed)
    if (!rig) return;
    const bySlug = new Map(guides.map((g) => [g.slug, g]));
    const ease = { duration: 0.45, ease: "power3.out" };
    gsap.set(rig.cover, { yPercent: OUT });
    const numTo = gsap.quickTo(rig.num, "yPercent", ease);
    const coverTo = gsap.quickTo(rig.cover, "yPercent", ease);
    let shown: string | null = null;
    const show = safe((slug: string | null) => {
      const g = slug ? bySlug.get(slug) : undefined;
      const next = g ? g.slug : null;
      if (next === shown) return;
      shown = next;
      if (g) {
        rig.l1.textContent = g.cover[0].toUpperCase();
        rig.l2.textContent = g.cover[1].toUpperCase();
        for (const [k, v] of Object.entries(accentVars(g))) rig.cover.style.setProperty(k, String(v));
      }
      numTo(g ? -OUT : 0);
      coverTo(g ? 0 : OUT);
    });
    const rowOf = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>("[data-guide]") : null);
    const over = (e: Event) => show(rowOf(e.target)?.dataset.guide ?? null);
    const leave = () => show(null);
    const blur = (e: FocusEvent) => show(rowOf(e.relatedTarget)?.dataset.guide ?? null);
    sec.addEventListener("pointerover", over);
    sec.addEventListener("pointerleave", leave);
    sec.addEventListener("focusin", over);
    sec.addEventListener("focusout", blur);
    offs.push(() => {
      sec.removeEventListener("pointerover", over);
      sec.removeEventListener("pointerleave", leave);
      sec.removeEventListener("focusin", over);
      sec.removeEventListener("focusout", blur);
    });
  });
}

// ---------- 06 · T ----------

export function buildT(ctx: BuildCtx) {
  sheet("t", ({ sec }) => {
    if (ctx.reduced) return;

    const stage = hook(sec, "anchor");
    entry(ctx, sec, () => L.center(), () => L.anchor("#t")); // the solids land exactly on the outline
    const tl = pinned(ctx, sec, 1.4, 0.8, { id: T_PIN });

    // .00–.12 the solids go to hairlines and hand off to the SVG, which draws on over them
    transition(tl, "toOutline", 0, 0.12, 0.12);
    scramble(tl, hook(sec, "kicker"), "T", 0);
    rise(tl, split(hook(sec, "h2"), "lines")?.lines, 0, 0.1);
    fadeUp(tl, hook(sec, "sub"), 0.04, 0.08);

    const outlines = all(stage, "[data-slot] > path"); // one per glyph, in reading order
    draw(tl, outlines, 0, 0.06, fit(outlines.length, 0.12, 0.06, 0.01));
    const nodes = all(stage, "[data-n]");
    if (nodes.length) {
      tl.fromTo(
        nodes,
        { scale: 0 },
        {
          scale: 1,
          transformOrigin: "50% 50%",
          ease: "back.out(1.6)",
          duration: 0.03,
          stagger: fit(nodes.length, 0.12, 0.03, 0.002),
        },
        0,
      );
    }
    const countn = hook(sec, "countn");
    const count = parseInt(countn?.textContent ?? "", 10);
    if (countn && count) {
      tl.fromTo(countn, { textContent: 0 }, { textContent: count, snap: { textContent: 1 }, duration: 0.12 }, 0);
    }

    // .12–.28 the metric lines open out from the word's centre; their labels follow
    const metrics = all(stage, ".metric");
    const metricLabels = all(sec, ".metric-labels li");
    const each = fit(Math.max(metrics.length, metricLabels.length), 0.16, 0.04, 0.03);
    if (metrics.length) {
      tl.fromTo(
        metrics,
        { scaleX: 0 },
        { scaleX: 1, transformOrigin: "50% 50%", ease: "power2.inOut", duration: 0.04, stagger: each },
        0.12,
      );
    }
    if (metricLabels.length) {
      tl.fromTo(
        metricLabels,
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, ease: "power3.out", duration: 0.04, stagger: each },
        0.13,
      );
    }

    // .28–.46 the I turns upside down and lands on itself; the V nods down twice
    const glyphI = stage?.querySelector('[data-slot="5"]');
    const glyphV = stage?.querySelector('[data-slot="0"]');
    if (glyphI) tl.to(glyphI, { rotation: 180, transformOrigin: "50% 50%", ease: "power2.inOut", duration: 0.12 }, 0.28);
    if (glyphV) tl.to(glyphV, { y: 18, ease: "sine.inOut", duration: 0.04, yoyo: true, repeat: 3 }, 0.3);
    fadeUp(tl, hook(sec, "callv"), 0.3);
    fadeUp(tl, hook(sec, "calli"), 0.34);

    // .46–.82 fake weights: hairline, then heavier, then back to the detent at Black (real)
    const w = { v: 0 };
    const push = () => driveWeight(w.v);
    tl.to(w, { v: -80, ease: "power1.inOut", duration: 0.14, onUpdate: push }, 0.46);
    tl.to(w, { v: 40, ease: "power1.inOut", duration: 0.12, onUpdate: push }, 0.6);
    tl.to(w, { v: 0, ease: "power2.out", duration: 0.1, onUpdate: push }, 0.72);
    fadeUp(tl, hook(sec, "facts"), 0.46, 0.08);

    // .82–1.00 the outline fades as the solids come back where it was (in the column they never left it)
    transition(tl, "fromOutline", 0.82, 0.18, 0.18);
    if (!ctx.column) {
      const svg = stage?.querySelector("[data-glyphs]");
      if (svg) tl.to(svg, { opacity: 0.3, duration: 0.06 }, 0.82).to(svg, { opacity: 0, duration: 0.12 }, 0.88);
      if (metricLabels.length) tl.to(metricLabels, { opacity: 0, duration: 0.08 }, 0.82);
    }
  });
}

// ---------- 07 · I, H ----------

/** Sheet 06 unpins with the word parked on its outline. The word rides up with that sheet (it is printed
 *  there), waits just above the viewport while the rest of Sheet 06 passes, then comes down to centre as Sheet 07
 *  arrives: this is Sheet 07's entry. Linked straight to the scroll (no scrub lag) so it stays glued to the
 *  page. x, y and s go from the outline to centre on the entry's ease; lift carries the ride and hands it
 *  back as y comes down, so y + lift runs from the ridden position to centre. */
function rideIn(sec: HTMLElement) {
  const tl = gsap.timeline({
    immediateRender: false,
    scrollTrigger: {
      trigger: sec,
      start: () => ScrollTrigger.getById(T_PIN)?.end ?? "top bottom",
      end: "top top",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
  const inOut = gsap.parseEase("power1.inOut");
  // read live: start and end are set before a refresh re-renders the timeline, and the layout is cached per refresh
  const geo = () => {
    const st = tl.scrollTrigger;
    const total = Math.max(1, (st?.end ?? 1) - (st?.start ?? 0));
    const a = L.anchor("#t");
    let hide = 0; // how far the row must rise to clear the top edge: its baseline, and a hairline's grace
    for (let i = 0; i < 8; i++) hide = Math.max(hide, (a[i]?.y ?? 0) + 8);
    return { total, ride: Math.max(0, total - window.innerHeight), hide }; // the last viewport of it is the entry
  };
  const toCentre = (p: number) => {
    const g = geo();
    const d = p * g.total;
    return d <= g.ride ? 0 : inOut((d - g.ride) / (g.total - g.ride));
  };
  const risen = (p: number) => {
    const g = geo();
    return Math.min(p * g.total, g.ride, g.hide) * (1 - toCentre(p));
  };
  tl.fromTo(
    store.slots,
    slotVars(() => L.anchor("#t")),
    { ...slotVars(() => L.center()), ease: toCentre, duration: 1, immediateRender: false },
    0,
  );
  tl.fromTo(store.slots, { lift: 0 }, { lift: -1, ease: risen, duration: 1, immediateRender: false }, 0);
  // Sheet 06's tail is still scrolling out as the word comes down through it: it fades, so the two never
  // print over each other. A custom property (home.css), since the sheet's own tweens own their opacity
  const t = document.getElementById("t");
  if (t) {
    const out = (p: number) => Math.min(1, toCentre(p) * 3);
    tl.fromTo(t, { "--t-tail": 1 }, { "--t-tail": 0, ease: out, duration: 1, immediateRender: false }, 0);
  }
}

export function buildI(ctx: BuildCtx) {
  sheet("i", ({ sec, offs }) => {
    if (ctx.reduced) return;

    if (!ctx.column) rideIn(sec);

    const typed = hook(sec, "typed");
    const chars = typed
      ? SplitText.create(typed, { type: "words,chars", autoSplit: false, ignore: typed.querySelectorAll(".still") }).chars
      : [];
    const N = chars.length;
    const step = (TYPE_END - TYPE_AT) / Math.max(1, N);
    const tl = pinned(ctx, sec, 1, 0.8);

    // .00–.30 the word drains away, T and S first; H parks after "home", I becomes the caret
    const caret = (k: number) => L.caretAt(k)[5];
    const place = (i: number) => (i === 7 ? L.anchor('#i [data-m="park"]')[7] : i === 5 ? caret(0) : undefined);
    transition(tl, "drain", 0, 0.3, 0.08, ctx.column ? undefined : place);
    scramble(tl, hook(sec, "kicker"), "IH", 0);

    // .30–.75 the line types itself, char by char in reading order; char k-1 lands at TYPE_AT + k·step, and
    // the I glides to the right of it on that line's baseline (caretAt is measured once per refresh)
    if (N) tl.fromTo(chars, { opacity: 0 }, { opacity: 1, duration: 0.001, stagger: step }, TYPE_AT + step - 0.001);
    if (!ctx.column) {
      const slot = store.slots[5];
      for (let k = 1; k <= N; k++) {
        const a = k - 1;
        tl.fromTo(
          slot,
          { x: () => caret(a)?.x ?? slot.x, y: () => caret(a)?.y ?? slot.y },
          {
            x: () => caret(k)?.x ?? slot.x,
            y: () => caret(k)?.y ?? slot.y,
            ease: "power3.out",
            duration: 0.8 * step,
            immediateRender: false,
          },
          TYPE_AT + k * step,
        );
      }
    }

    // .75–1.00 the rest of the sheet; the caret blinks once the line is done
    rise(tl, split(hook(sec, "sub"), "lines")?.lines, 0.75, 0.08);
    fadeUp(tl, all(hook(sec, "links"), "li"), 0.8, 0.06, 0.08);
    rise(tl, split(hook(sec, "colophon"), "lines")?.lines, 0.86, 0.1);
    let blinking = false;
    tl.eventCallback("onUpdate", () => {
      const on = tl.time() >= TYPE_END;
      if (on !== blinking) store.blink = (blinking = on) ? 5 : BLINK_OFF;
    });
    offs.push(() => {
      if (blinking) store.blink = BLINK_OFF;
    });

    // after the pin the caret and the parked H ride up with the section, linked straight to the scroll
    const pin = tl.scrollTrigger;
    if (!pin) return;
    const after = gsap.timeline({
      immediateRender: false,
      scrollTrigger: { trigger: sec, start: () => pin.end, end: "max", scrub: true, invalidateOnRefresh: true },
    });
    const gone = () => {
      const st = after.scrollTrigger;
      return st ? st.end - st.start : 0;
    };
    // lift = -(scroll since the pin ended); the distance is read live because "max" settles after refresh
    after.fromTo(
      [store.slots[5], store.slots[7]],
      { lift: 0 },
      { lift: -1, ease: (p: number) => p * gone(), duration: 1, immediateRender: false },
    );
  });
}
