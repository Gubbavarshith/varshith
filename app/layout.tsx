import type { Metadata, Viewport } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { Martian_Mono, Newsreader, Noto_Sans_Telugu } from "next/font/google";
import MiniIndex from "./_ui/MiniIndex";
import ThemeToggle from "./_ui/ThemeToggle";
import { site } from "./_data/site";
import "./globals.css";

// His own face. 1,764 bytes, so blocking on it costs nothing and never flashes a width-shifting fallback.
// The overrides pin the line box to the hhea metrics (820 / -180): the TTF's usWin metrics are 820 / 200 and
// Windows browsers use those, which would put the DOM baseline at .810em instead of the .82em the stage and
// heroLayout assume, and the GPU word would land about 2px off the DOM word.
const display = localFont({
  src: "./_fonts/ToolsplexDisplay-Black.woff2",
  weight: "900",
  style: "normal",
  variable: "--font-toolsplex",
  display: "block",
  preload: true,
  fallback: ["Impact", "Arial Black", "sans-serif"],
  adjustFontFallback: false,
  declarations: [
    { prop: "ascent-override", value: "82%" },
    { prop: "descent-override", value: "18%" },
    { prop: "line-gap-override", value: "0%" },
  ],
});
// latin-ext carries the ṣ in varṣa
const text = Newsreader({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-news",
});
const mono = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--font-martian" });
// one word on one sheet; not worth a preload
const telugu = Noto_Sans_Telugu({ subsets: ["telugu"], weight: "500", variable: "--font-telugu", preload: false });

export const metadata: Metadata = {
  title: { default: `${site.name} · web developer and UI/UX designer`, template: `%s · ${site.name}` },
  description: site.description,
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F1EEE6" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F0D" },
  ],
};

// Before paint: the theme the visitor picked (none = follow the OS), then the mode classes every stylesheet
// keys off. `motion` hides the stills and turns on pins and the stage; `intro` runs the CSS half of the load
// sequence on the homepage only. Without JS none of these exist and every sheet renders as its still.
const boot = `var d=document.documentElement;try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")d.dataset.theme=t}catch(e){}
d.classList.add("js");
if(matchMedia("(prefers-reduced-motion: no-preference)").matches){d.classList.add("motion");if(location.pathname==="/")d.classList.add("intro")}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${text.variable} ${mono.variable} ${telugu.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <header className="top" data-m="header">
          {/* V points down; scrolling up turns it over and it reads Λ */}
          <Link className="vmark" href="/#v" aria-label="Gubba Varshith, home">
            <span aria-hidden="true">V</span>
          </Link>
          <MiniIndex />
          <nav className="nav" aria-label="Main">
            <Link href="/guides">Guides</Link>
          </nav>
          <ThemeToggle />
          {/* shown on the homepage only (CSS), and only from 900px */}
          <p className="folio" data-m="folio" aria-hidden="true">
            Sheet 01/07
          </p>
        </header>
        {children}
        <footer className="foot">
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
          {site.links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
          <a className="foot-up" href="#main">
            Back to top ↑
          </a>
        </footer>
      </body>
    </html>
  );
}
