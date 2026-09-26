// The manifest on the homepage, in this order. Each build shows the hero of its preview (a static copy of the
// real page in public/previews, drawn hero-only); no preview means the coming-soon card. The domain is what the
// card's address bar reads, and only an href becomes a link. A status renders only once Varshith confirms it.
export type WorkItem = {
  name: string;
  what: string;
  domain?: string;
  href?: string;
  preview?: string;
  status: "live" | "building" | "soon" | null;
};

export const work: WorkItem[] = [
  {
    name: "Toolspark",
    what: "53 free browser tools in 8 categories. Everything runs in your tab: no signup, no uploads, nothing leaves the page.",
    domain: "toolspark.xyz",
    href: "https://toolspark.xyz",
    preview: "toolspark-preview.html",
    status: null,
  },
  {
    name: "aiimageprompts",
    what: "Better Prompts, Better Art. A curated AI image prompt library with its own static-site generator.",
    domain: "aiimageprompts.xyz",
    href: "https://www.aiimageprompts.xyz",
    preview: "aiimageprompts-preview.html",
    status: null,
  },
  {
    name: "StartupMaps",
    what: "373 Hyderabad startups on a street-level map, filterable by sector and stage. A Micro SaaS hackathon is planned alongside it.",
    domain: "startupmaps.in",
    href: "https://startupmaps.in",
    preview: "startupmaps-preview.html",
    status: null,
  },
  {
    name: "UIZoo",
    what: "A gallery of experimental UI and motion, rebuilt so you can study how each piece moves.",
    domain: "uizoo.toolspark.xyz",
    preview: "uizoo-preview.html",
    status: null,
  },
  {
    name: "AI Usage",
    what: "Every AI coding limit in your Windows tray: session windows, weekly caps, credits and spend for Claude Code, Codex, Cursor and ten more. Free and open source.",
    preview: "aiusage-preview.html",
    status: null,
  },
  {
    name: "GamesHub",
    what: "Free browser games you just drop into. No download, no sign-up, and they work on your phone.",
    preview: "gameshub-preview.html",
    status: null,
  },
  {
    name: "SVG Vault",
    what: "325,602 open-source icons from 249 sets, shelved by what they are for and filterable by licence.",
    domain: "svgvault.toolspark.xyz",
    preview: "svgvault-preview.html",
    status: null,
  },
  {
    name: "SastrasAI",
    what: "Multi-agent blogging with RAG, for solo bloggers who don’t know what to write next. My 100xEngineers Cohort 7 capstone.",
    status: "soon",
  },
];
