"use client";

// Sheet 06's weight instrument. Toolsplex Display ships one weight, Black; the slider
// fakes the rest with a stroke over the letters, paper-coloured to erode and ink-coloured to thicken. The
// stroke is 2|v|/1000 em wide and centred on the outline, so v eats or adds exactly |v| font units a side
// and the 170-unit stem reads 170 + 2v. Scroll (sheets-b, via driveWeight) moves it until someone touches it.

import { useEffect, useRef } from "react";

const MIN = -80;
const MAX = 40;
const STEM = 170; // glyphs.json facts.stem
const DETENT = 3; // a drag this close to the real weight lands on it
const PHRASE = "Varshith ships.";

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
.wt-v{padding-top:15px;min-width:calc(25ch + 1.5em);text-align:right;font:500 var(--fs-label)/1 var(--f-mono);font-stretch:75%;letter-spacing:.06em;text-transform:uppercase;font-variant-numeric:tabular-nums;color:var(--ink);white-space:nowrap}
/* stroke width is |--stroke| x 2 units; max() is abs() for browsers without it */
.specimen{--stroke:0;font-family:var(--f-display);font-weight:900;line-height:1;letter-spacing:0;color:var(--ink);
-webkit-text-stroke:calc(max(var(--stroke),-1 * var(--stroke)) * 2em / 1000) var(--ink)}
.specimen[data-dir="erode"]{-webkit-text-stroke-color:var(--wt-paper,var(--paper))}
.weight .specimen{font-size:min(calc(100cqi / 8.2),128px);height:1em;white-space:nowrap;overflow:visible}
.wt-note{font:400 var(--fs-label)/1.4 var(--f-mono);font-stretch:87.5%;color:var(--ink-2)}
@container (max-width:420px){
.wt-row{grid-template-columns:minmax(0,1fr)}
.wt-v{padding-top:8px;text-align:left}
}
`;

// React hoists this into <head> once
const Style = () => (
  <style href="tqt-weight" precedence="default">
    {CSS}
  </style>
);

// ---------- components ----------

export default function Weight() {
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
        {PHRASE}
      </p>
      <p className="wt-note" id="wt-note">
        A stroke drawn over the letters, not a real weight axis.
      </p>
    </div>
  );
}
