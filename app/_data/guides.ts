import type { CSSProperties } from "react";

export type Guide = {
  slug: string;
  no: string;
  title: string;
  summary: string;
  tags: string[];
  parts: number;
  minutes: number;
  // cover art: both lines set in Toolsplex; second line in the guide's ink colour
  cover: [string, string];
  // fill colour, then text colour for light and dark sheets (the fill is too light for small text)
  accent: string;
  ink: [string, string];
};

// Newest first. Each guide lives at app/guides/<slug>/page.tsx.
export const guides: Guide[] = [
  {
    slug: "jev-claude",
    no: "001",
    title: "Jev + Claude: the setup guide",
    summary:
      "Wire Jev, a fast decision model, into Claude Code. Then route every message to the smallest model that can do it, and sort any pile of text in seconds.",
    tags: ["Claude Code", "Jev", "OpenRouter"],
    parts: 6,
    minutes: 10,
    cover: ["Jev +", "CLAUDE"],
    accent: "#ff5a1f",
    ink: ["#c2410c", "#ff7a45"],
  },
];

export const accentVars = (g: Guide) =>
  ({ "--g": g.accent, "--g-ink": `light-dark(${g.ink[0]}, ${g.ink[1]})` }) as CSSProperties;
