import type { CSSProperties } from "react";
import Image from "next/image";
import day from "../../public/hero/me-day.webp";
import night from "../../public/hero/me-night.webp";

// The hero portrait, behind the name: me in sunglasses by day, and after four or five days without sleep by
// night. The theme picks the face (the switch's circle wipe swaps them), and a thought cloud cycles through
// what that version of me is thinking. Decorative: the name and the lede carry the content.

const THOUGHTS = {
  day: ["Shipping three products before lunch.", "Today I close all eight tabs.", "Coffee: done. Deploy: done. Humility: loading."],
  night: ["Just one more deploy, then sleep.", "Day 5. The bugs have started talking back.", "It works on localhost:3000. That counts."],
};

export default function Portrait() {
  return (
    <div className="me" data-m="me" aria-hidden="true">
      <Image className="me-img me-day" src={day} alt="" sizes="(max-width: 640px) 72vw, 46svh" priority />
      <Image className="me-img me-night" src={night} alt="" sizes="(max-width: 640px) 72vw, 46svh" />
      {(["day", "night"] as const).map((t) => (
        <div key={t} className={`me-think me-think-${t}`}>
          <i className="me-puff me-puff-1" />
          <i className="me-puff me-puff-2" />
          <p className="me-cloud">
            {THOUGHTS[t].map((line, n) => (
              <span key={line} style={{ "--n": n } as CSSProperties}>
                {line}
              </span>
            ))}
          </p>
        </div>
      ))}
    </div>
  );
}
