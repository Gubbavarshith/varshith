// The manifest on the homepage, in this order. Only a `where.href` becomes a link, and a status renders
// only once Varshith confirms it ("live" or "building"); null means nothing is claimed.
export type WorkItem = {
  no: string;
  name: string;
  what: string;
  where?: { label: string; href?: string };
  /** brand colours, shown as 12px swatches and nowhere else */
  swatches?: string[];
  status: "live" | "building" | null;
};

export const work: WorkItem[] = [
  {
    no: "01",
    name: "Toolspark",
    what: "53 free browser tools in 8 categories. Everything runs in your tab: no signup, no uploads, nothing leaves the page.",
    where: { label: "toolspark.xyz", href: "https://toolspark.xyz" },
    swatches: ["#3B58E2", "#FFE066"],
    status: null,
  },
  {
    no: "02",
    name: "aiimageprompts",
    what: "Better Prompts, Better Art. A curated AI image prompt library with its own static-site generator.",
    where: { label: "aiimageprompts.xyz", href: "https://www.aiimageprompts.xyz" },
    status: null,
  },
  {
    no: "03",
    name: "StartupMaps",
    what: "373 Hyderabad startups collected for a street-level map. A Micro SaaS hackathon is planned alongside it.",
    where: { label: "startupmaps.in", href: "https://startupmaps.in" },
    status: null,
  },
  {
    no: "04",
    name: "SastrasAI",
    what: "Multi-agent blogging with RAG, for solo bloggers who don’t know what to write next. My 100xEngineers Cohort 7 capstone.",
    where: { label: "in progress" },
    status: null,
  },
  {
    no: "05",
    name: "UIZoo",
    what: "UI showcases, living under Toolspark.",
    where: { label: "toolspark.xyz" },
    status: null,
  },
];
