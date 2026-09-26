"use client";

import { useEffect } from "react";
import { L } from "./layouts";
import { startRuntime } from "./runtime";
import { buildIntro, buildManifest, buildTurn, buildV, buildVar, disposeIntro } from "./sheets-a";
import { buildAI, buildI, buildSH, buildT } from "./sheets-b";
import { store } from "./store";

// Home only. Starts the runtime, then builds every sheet once the display face has loaded (the hero word is
// measured from it). Renders nothing: the stage and the server-rendered page are the visuals.
export default function Motion() {
  useEffect(() => {
    const rt = startRuntime();
    let live = true;
    document.fonts.ready.then(() => {
      if (!live) return;
      const hero = L.hero();
      store.slots.forEach((st, i) => Object.assign(st, hero[i]));
      // page order: pins must be created top to bottom so each one measures past the spacers above it
      rt.mount((ctx) => {
        buildIntro(ctx);
        buildV(ctx);
        buildTurn(ctx);
        buildManifest(ctx);
        buildVar(ctx);
        buildAI(ctx);
        buildSH(ctx);
        buildT(ctx);
        buildI(ctx);
      });
    });
    return () => {
      live = false;
      disposeIntro();
      rt.dispose();
    };
  }, []);
  return null;
}
