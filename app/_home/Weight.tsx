"use client";

// Sheet 06's weight instrument and the glyph grid. Toolsplex Display ships one weight, Black; the slider
// fakes the rest with a stroke over the letters, paper-coloured to erode and ink-coloured to thicken. The
// stroke is 2|v|/1000 em wide and centred on the outline, so v eats or adds exactly |v| font units a side
// and the 170-unit stem reads 170 + 2v. Scroll (sheets-b, via driveWeight) moves it until someone touches it.

import { useEffect, useRef, useSyncExternalStore } from "react";

const MIN = -80;
const MAX = 40;
const STEM = 170; // glyphs.json facts.stem
const DETENT = 3; // a drag this close to the real weight lands on it
const PHRASE = "Varshith ships.";
// glyphs.json charset, which build.mjs asserts is exactly the font's; listed here so the page bundle
// doesn't carry every outline just to name the characters
const CHARSET = " !+,-./0123456789:?ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const NAMES: Record<string, string> = {
  " ": "space",
  "!": "exclamation mark",
  "+": "plus",
  ",": "comma",
  "-": "hyphen",
  ".": "full stop",
  "/": "slash",
  ":": "colon",
  "?": "question mark",
};
const nameOf = (c: string) => NAMES[c] ?? (c >= "a" && c <= "z" ? `lowercase ${c}` : c);
const codeOf = (c: string) => `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}`;

function weightName(v: number) {
  if (v === 0) return "Black (real)";
  const stem = STEM + 2 * v;
  const name =
    v > 0
      ? "Ultra"
      : stem <= 30
        ? "Hairline"
        : stem <= 60
          ? "Thin"
          : stem <= 90
            ? "Light"
            : stem <= 120
              ? "Regular"
              : stem <= 150
                ? "Bold"
                : "Heavy";
  return `${name} (fake)`;
}
const shown = (v: number) => `${weightName(v)} · stem ${STEM + 2 * v}`;
const spoken = (v: number) => (v === 0 ? "Black (real)" : `${weightName(v)}, stem ${STEM + 2 * v} units`);

// ---------- the stroke: written straight to the DOM, since scroll moves it every frame ----------

let stroke = 0;
let touched = false;
const specimens = new Set<HTMLElement>();
const sliders = new Set<{ input: HTMLInputElement; readout: HTMLElement }>();

function paint(v: number) {
  stroke = v;
  const dir = v < 0 ? "erode" : v > 0 ? "thicken" : "real";
  for (const el of specimens) {
    el.style.setProperty("--stroke", String(v));
    el.dataset.dir = dir;
  }
  for (const { input, readout } of sliders) {
    if (input.valueAsNumber !== v) input.value = String(v);
    input.setAttribute("aria-valuetext", spoken(v));
    // React owns this text node and never re-renders it (its children don't change), so edit it in place
    if (readout.firstChild) readout.firstChild.nodeValue = shown(v);
  }
}

/** Sheet 06's scrub drives the slider until the visitor first touches it; after that it's theirs. */
export function driveWeight(v: number) {
  if (!touched) paint(Math.round(Math.min(MAX, Math.max(MIN, v))));
}

function useSpecimen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    specimens.add(el);
    paint(stroke);
    return () => {
      specimens.delete(el);
    };
  }, []);
  return ref;
}

// ---------- the loaded glyph: hover or focus in the grid, or a pinned (pressed) cell ----------

let hovered: string | null = null;
let pinned: string | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};
const loaded = () => hovered ?? pinned;
const pinnedNow = () => pinned;
const nothing = () => null;
function hover(c: string | null) {
  if (c === hovered) return;
  hovered = c;
  emit();
}
function pin(c: string) {
  pinned = pinned === c ? null : c;
  emit();
}

/** A glyph as the specimen shows it. The space has no ink, so it draws its 320-unit advance as a box. */
const Face = ({ c }: { c: string }) => (c === " " ? <i className="wt-space" /> : <>{c}</>);

// ---------- styles ----------

const CSS = `
.weight{container-type:inline-size;display:grid;gap:12px;min-width:0}
.weight p{margin:0}
.wt-l{font:italic 400 20px/1.3 var(--f-text);color:var(--ink-2)}
.wt-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:4px 20px}
.wt-track{position:relative;padding-bottom:18px;--thumb:12px}
.wt-in{-webkit-appearance:none;appearance:none;display:block;width:100%;height:44px;margin:0;background:none;cursor:ew-resize;touch-action:pan-y}
.wt-in::-webkit-slider-runnable-track{height:1px;background:var(--ink)}
.wt-in::-moz-range-track{height:1px;background:var(--ink)}
.wt-in::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:var(--thumb);height:24px;margin-top:-11.5px;border:0;border-radius:0;background:var(--signal)}
.wt-in::-moz-range-thumb{width:var(--thumb);height:24px;border:0;border-radius:0;background:var(--signal)}
.wt-in:focus-visible{outline:2px solid var(--signal);outline-offset:3px}
/* the thumb's centre travels thumb/2 .. 100% - thumb/2, and 0 sits 80/120 of the way */
.wt-tick{position:absolute;top:14px;left:calc(var(--thumb) / 2 + (100% - var(--thumb)) * 2 / 3);width:1px;height:16px;background:var(--ink-3);pointer-events:none}
.wt-scale{position:absolute;inset:auto 0 0;height:14px;font:500 var(--fs-run)/1 var(--f-mono);font-stretch:75%;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-2);pointer-events:none}
.wt-scale>span{position:absolute;bottom:0}
.wt-scale>:nth-child(2){left:calc(var(--thumb) / 2 + (100% - var(--thumb)) * 2 / 3);transform:translateX(-50%)}
.wt-scale>:last-child{right:0}
.wt-v{padding-top:15px;min-width:21ch;text-align:right;font:500 var(--fs-label)/1 var(--f-mono);font-stretch:75%;letter-spacing:.06em;text-transform:uppercase;font-variant-numeric:tabular-nums;color:var(--ink);white-space:nowrap}
/* stroke width is |--stroke| x 2 units; max() is abs() for browsers without it */
.specimen{--stroke:0;font-family:var(--f-display);font-weight:900;line-height:1;letter-spacing:0;color:var(--ink);
-webkit-text-stroke:calc(max(var(--stroke),-1 * var(--stroke)) * 2em / 1000) var(--ink)}
.specimen[data-dir="erode"]{-webkit-text-stroke-color:var(--wt-paper,var(--paper))}
.weight .specimen{font-size:min(calc(100cqi / 8.2),128px);height:1em;white-space:nowrap;overflow:visible}
.wt-note{font:400 var(--fs-label)/1.4 var(--f-mono);font-stretch:87.5%;color:var(--ink-2)}
.wt-space{display:inline-block;width:.32em;height:.7em;vertical-align:baseline;outline:1px dashed var(--ink-3);outline-offset:-1px}

.glyph-grid{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:var(--gutter,24px);align-items:start}
.gg-view{--wt-paper:var(--paper-hi);position:sticky;top:calc(var(--header,56px) + 24px);display:grid;place-items:center;aspect-ratio:1;overflow:clip;container-type:inline-size;background:var(--paper-hi);box-shadow:inset 0 0 0 1px var(--rule)}
.gg-big{position:relative;font-size:62cqi}
/* cap height and baseline, the two lines every capital here touches */
.gg-big::before,.gg-big::after{content:"";position:absolute;left:-60cqi;right:-60cqi;height:1px;background:var(--ink-3)}
.gg-big::before{top:.12em}
.gg-big::after{top:.82em}
.gg-cap{position:absolute;left:14px;bottom:12px;font:500 var(--fs-label)/1 var(--f-mono);font-stretch:75%;letter-spacing:.06em;color:var(--ink-2)}
/* hairline grid: the box draws the top and left rules, each cell its right and bottom */
.gg-cells{display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));border-top:1px solid var(--rule);border-left:1px solid var(--rule)}
.gg-cell{display:grid;place-items:center;aspect-ratio:1;min-height:48px;padding:0;border:0;border-radius:0;background:var(--paper);box-shadow:1px 0 0 var(--rule),0 1px 0 var(--rule);color:var(--ink);
font:900 clamp(20px,2.4vw,32px)/1 var(--f-display);cursor:pointer;transition:background-color .15s,color .15s}
.gg-cell:hover,.gg-cell:focus-visible,.gg-cell[aria-pressed="true"]{background:var(--ink);color:var(--paper)}
.gg-cell:focus-visible{outline:2px solid var(--signal);outline-offset:-2px}
.gg-sp{font:500 10px/1 var(--f-mono);font-stretch:75%;letter-spacing:.06em;text-transform:uppercase;color:inherit}
@media (max-width:640px){
.wt-row{grid-template-columns:1fr}
.wt-v{padding-top:0;text-align:left}
.glyph-grid{grid-template-columns:1fr}
.gg-view{position:relative;top:0;aspect-ratio:2/1}
.gg-big{font-size:31cqi}
.gg-cells{grid-template-columns:repeat(auto-fill,minmax(48px,1fr))}
}
@media (prefers-reduced-motion:reduce){.gg-cell{transition:none}}
`;

// React hoists this into <head> once, whichever component renders first
const Style = () => (
  <style href="tqt-weight" precedence="default">
    {CSS}
  </style>
);

// ---------- components ----------

export default function Weight() {
  const g = useSyncExternalStore(subscribe, loaded, nothing);
  const spec = useSpecimen<HTMLParagraphElement>();
  const input = useRef<HTMLInputElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const entry = { input: input.current!, readout: readout.current! };
    sliders.add(entry);
    paint(stroke);
    return () => {
      sliders.delete(entry);
    };
  }, []);

  const take = () => {
    touched = true;
  };

  return (
    <div className="weight" data-m="weight">
      <Style />
      <p className="wt-l" id="wt-l">
        It only comes in Black. Drag to fake the rest.
      </p>
      <div className="wt-row">
        <div className="wt-track">
          <input
            ref={input}
            className="wt-in"
            type="range"
            min={MIN}
            max={MAX}
            step={1}
            defaultValue={0}
            aria-label="Synthetic weight"
            aria-valuetext={spoken(0)}
            aria-describedby="wt-l wt-note"
            onPointerDown={() => {
              take();
              dragging.current = true;
            }}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
            onKeyDown={take}
            onChange={(e) => {
              take();
              const v = e.currentTarget.valueAsNumber;
              // the detent only catches drags; arrow keys must be able to step off 0
              paint(dragging.current && Math.abs(v) <= DETENT ? 0 : v);
            }}
            onDoubleClick={() => {
              take();
              paint(0);
            }}
          />
          <i className="wt-tick" aria-hidden="true" />
          <span className="wt-scale" aria-hidden="true">
            <span>Hairline</span>
            <span>Black</span>
            <span>Ultra</span>
          </span>
        </div>
        <span ref={readout} className="wt-v" aria-hidden="true">
          {shown(0)}
        </span>
      </div>
      <p ref={spec} className="specimen">
        {g === null ? PHRASE : <Face c={g} />}
      </p>
      <p className="wt-note" id="wt-note">
        A stroke drawn over the letters, not a real weight axis.
      </p>
    </div>
  );
}

/** All 71 characters. Hover or focus loads one into the specimens (the big view here, and Sheet 06's line);
 *  a click or tap pins it there until pressed again. */
export function GlyphGrid() {
  const g = useSyncExternalStore(subscribe, loaded, nothing);
  const p = useSyncExternalStore(subscribe, pinnedNow, nothing);
  const view = useSpecimen<HTMLSpanElement>();
  const c = g ?? "V";

  return (
    <div
      className="glyph-grid"
      data-m="glyphgrid"
      onPointerLeave={() => hover(null)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hover(null);
      }}
    >
      <Style />
      <div className="gg-view" aria-hidden="true">
        <span ref={view} className="specimen gg-big">
          <Face c={c} />
        </span>
        <span className="gg-cap">
          {codeOf(c)} · {nameOf(c)}
        </span>
      </div>
      <div className="gg-cells">
        {Array.from(CHARSET, (ch) => (
          <button
            key={ch}
            type="button"
            className="gg-cell"
            data-m="cell"
            aria-label={`Glyph ${nameOf(ch)}`}
            aria-pressed={p === ch}
            onPointerEnter={() => hover(ch)}
            onFocus={() => hover(ch)}
            onClick={() => pin(ch)}
          >
            {ch === " " ? <span className="gg-sp">space</span> : ch}
          </button>
        ))}
      </div>
    </div>
  );
}
