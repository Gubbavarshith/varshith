import type { Metadata } from "next";
import GuideList from "../_ui/GuideList";
import Glyphs from "../_ui/Glyphs";

export const metadata: Metadata = {
  title: "Guides",
  description: "Step-by-step guides on building with AI and the web, with prompts you can copy.",
};

// The hub is Sheet 05 in reading mode: no stage, no Lenis, no three.js.
export default function Guides() {
  return (
    <main id="main" className="hub">
      <section className="frame" aria-labelledby="guides-h">
        <p className="kicker">sh · $ ls guides/</p>
        <Glyphs text="SH" className="sh-mark" title="SH" />
        <div className="sec-head">
          <h1 id="guides-h" className="sec-title">
            Guides
          </h1>
          <p className="sec-lede">Step-by-step setups with prompts you can copy.</p>
        </div>
        <GuideList h="h2" />
      </section>
    </main>
  );
}
