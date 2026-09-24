"use client";

// Mounts the word's stage on "/" in motion mode. The GPU engine gets 2.5s to load three, init and
// compile; anything slower, or any failure, gets the CSS stage instead. Reduced motion and no-JS never
// mount a stage: the server-rendered stills are the visual there.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal, preload } from "react-dom";
import CSSWord from "./CSSWord";
import { setStage, store } from "../_motion/store";

type Path = "off" | "gpu" | "css";
const BUDGET = 2500; // ms: three chunk + renderer init + shader compile

const noSubscribe = () => () => {};
const serverPath = (): Path => "off";
function clientPath(): Path {
  if (!document.documentElement.classList.contains("motion")) return "off";
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  return typeof WebGL2RenderingContext === "undefined" || nav.connection?.saveData ? "css" : "gpu";
}

// probed before three is imported: touch-first or small machines get the low tier on either backend
function lowTier(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return matchMedia("(pointer: coarse)").matches || (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
}

export default function Stage() {
  // server and hydration render "off"; the client snapshot then picks the path without an effect
  const path = useSyncExternalStore(noSubscribe, clientPath, serverPath);
  const [failed, setFailed] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const mode: Path = path === "gpu" && failed ? "css" : path;

  useEffect(() => {
    // reduced motion: nothing will mount, so the intro stops waiting for a stage
    if (!document.documentElement.classList.contains("motion")) setStage("none");
  }, []);

  useEffect(() => {
    if (mode !== "css") return;
    store.tier = "css";
    setStage("css");
  }, [mode]);

  useEffect(() => {
    const el = canvas.current;
    if (mode !== "gpu" || !el) return;
    let alive = true;
    let handle: { dispose(): void } | null = null;
    let timer = 0;

    preload("/type/solids.bin", { as: "fetch", crossOrigin: "anonymous" }); // in parallel with the chunk
    const tier = lowTier() ? "low" : "high"; // the engine resolves "high" to "mid" on the WebGL2 backend
    const boot = import("./engine").then((m) => {
      // Strict Mode's throwaway mount must not start a second renderer on this canvas
      if (!alive) throw new Error("stage unmounted");
      return m.start(el, tier, {
        onLost: () => {
          if (alive) setFailed(true);
        },
      });
    });
    const late = new Promise<never>((_, reject) => {
      timer = window.setTimeout(() => reject(new Error("stage over budget")), BUDGET);
    });
    Promise.race([boot, late]).then(
      (h) => {
        clearTimeout(timer);
        if (alive) handle = h;
        else h.dispose();
      },
      () => {
        clearTimeout(timer);
        boot.then((h) => h.dispose(), () => {}); // a late engine must not keep drawing under the CSS stage
        if (alive) setFailed(true);
      },
    );

    return () => {
      alive = false;
      clearTimeout(timer);
      handle?.dispose();
    };
  }, [mode]);

  // on <body>, so the fixed canvas sits under main (z-index 1) wherever <Stage/> is placed
  if (mode === "gpu") return createPortal(<canvas ref={canvas} className="stage" aria-hidden="true" />, document.body);
  if (mode === "css") return <CSSWord mode="live" />;
  return null;
}
