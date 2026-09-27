import type { Metadata } from "next";
import Link from "next/link";
import { accentVars, guides } from "../../_data/guides";
import { site } from "../../_data/site";
import CopyBlock from "../_ui/CopyBlock";
import Layers, { type Part } from "../_ui/Layers";
import { PLUGIN, RUN, SKILLS_CLI, SLIM, STEER } from "./commands";
import "../guide.css";

const g = guides.find((x) => x.slug === "brag")!;

export const metadata: Metadata = { title: g.title, description: g.summary };

const PARTS: Part[] = [
  { id: "cover", label: "Cover" },
  { id: "output", n: "01", label: "What you get" },
  { id: "install", n: "02", label: "Install it" },
  { id: "run", n: "03", label: "Run it" },
  { id: "tones", n: "04", label: "Pick a tone" },
  { id: "inside", n: "05", label: "What happens inside" },
  { id: "better", n: "06", label: "Get a better brag" },
  { id: "links", label: "Every link" },
];

const FLAGS = [
  { flag: "--tone", does: "A preset from part 04, or your own direction in quotes", def: "picked for your project" },
  { flag: "--format", does: "landscape, vertical or square", def: "landscape" },
  { flag: "--duration", does: "Length in seconds", def: "auto, 15 to 25 s" },
  { flag: "--title", does: "The name shown on screen", def: "taken from the project" },
  { flag: "--no-music", does: "Leave the music out", def: "music on" },
  { flag: "--no-sfx", does: "Leave the sound effects out", def: "effects on" },
  { flag: "--voice", does: "Add a voiceover (Kokoro, through Hyperframes)", def: "off" },
];

const TONES = [
  { tone: "default", feel: "Punchy, playful, clean", pace: "4 to 5 scenes, soft transitions" },
  { tone: "polished", feel: "Serious, elegant, restrained", pace: "3 to 4 scenes, long holds, soft fades" },
  { tone: "yc-parody", feel: "A deadpan startup launch, played straight", pace: "4 to 5 scenes, one claim each, hard cuts" },
  { tone: "chaotic", feel: "Fast, loud, all caps", pace: "6 to 8 scenes, some under 2 s, flash and zoom cuts" },
  { tone: "deadpan", feel: "Calm and dry, nothing is a joke", pace: "3 to 4 scenes, big empty space, slow fades" },
  { tone: "cinematic", feel: "Trailer-scale, epic claims", pace: "4 to 5 scenes, big type, dramatic wipes" },
  { tone: "app-store", feel: "Clean feature cards", pace: "4 to 6 scenes, smooth slides" },
];

export default function Brag() {
  return (
    <main id="main" className="doc" style={accentVars(g)}>
      <header className="frame" id="cover">
        <p className="frame-label" aria-hidden="true">
          <span>Guide {g.no} / Cover</span>
          <span>{site.name}</span>
        </p>
        <div className="sheet cover">
          <p className="kicker">A Varshith guide</p>
          <h1 className="cover-title">
            /brag <span className="dot">LAUNCH</span>
            <span className="cover-sub">your project as a video</span>
          </h1>
          <p className="promise">
            You built it. Now show it. /brag reads your project’s code and cuts a 15 to 25 second launch video from it,
            with music, motion, a poster frame and a caption you can post as it is. One command, inside the coding agent you
            already use.
          </p>
          <div className="cover-actions">
            <a className="btn btn-solid" href="#output">
              Start with part 01
            </a>
          </div>

          <h2 className="mini-h">/brag in four lines</h2>
          <table className="t four">
            <tbody>
              <tr>
                <td className="t-n">1</td>
                <th scope="row">A skill, not an app</th>
                <td>
                  It runs inside your coding agent (Claude Code, Codex, Cursor, opencode and more) and works from your code.
                  No live URL or screenshots needed.
                </td>
              </tr>
              <tr>
                <td className="t-n">2</td>
                <th scope="row">One command</th>
                <td>
                  Type <code>{"let's /brag"}</code> in any project. Flags or plain words steer the tone, format and length.
                </td>
              </tr>
              <tr>
                <td className="t-n">3</td>
                <th scope="row">Ready to post</th>
                <td>A video, its poster frame, the plan behind it and share copy, all in one folder.</td>
              </tr>
              <tr>
                <td className="t-n">4</td>
                <th scope="row">Free and open</th>
                <td>MIT licensed. You need Node.js 22+ and FFmpeg; the full version also uses the Hyperframes CLI.</td>
              </tr>
            </tbody>
          </table>
          <p className="fine">
            /brag is an open-source skill by Shunit Haviv Hakimi (latent-spaces on GitHub). This guide covers version 0.4.0.
          </p>
        </div>
      </header>

      <div className="doc-body">
        <Layers title="/brag" parts={PARTS} />

        <article className="sheet doc-sheet">
          <aside className="readme" aria-label="Readme">
            <p className="label">Readme</p>
            <p>
              <b>What this is.</b> A setup guide for /brag: install it, run it, steer it, and end up with a launch video
              worth posting.
            </p>
            <p>
              <b>How to use it.</b> Part 01 shows what you get. Part 02 installs it, whichever agent you use. Parts 03 and 04
              are how you drive it. Part 05 explains what it does behind the scenes, and part 06 is how to get a better
              result on the first try.
            </p>
            <p>
              <b>What you need.</b> A project with a front end, an AI coding agent, Node.js 22 or newer, and FFmpeg.
            </p>
          </aside>

          {/* ---------- 01 ---------- */}
          <section id="output" className="part" aria-labelledby="output-h">
            <h2 id="output-h" className="part-h">
              <span className="part-no">01</span> What you get
            </h2>
            <p className="part-intro">
              Run /brag in a project folder and it writes everything into a new <code>brag-output/</code> folder. If one is
              already there, it makes a timestamped one instead, so earlier runs are never overwritten.
            </p>
            <figure className="showcase">
              <video
                src="/guides/brag/brag-about-brag.mp4"
                poster="/guides/brag/brag-about-brag.webp"
                width={1080}
                height={1920}
                controls
                playsInline
                preload="none"
              />
              <figcaption>
                <p className="label">Showcase</p>
                <p className="card-t">/brag, bragging about itself</p>
                <p className="card-b">
                  Made by running /brag on its own repo: 22 seconds, vertical, with music and sound effects. It’s the video on
                  the /brag launch page. Press play, and turn your sound on.
                </p>
              </figcaption>
            </figure>
            <div className="specs">
              <div className="card is-accent">
                <p className="label">brag.mp4</p>
                <p className="card-t">The video</p>
                <p className="card-b">15 to 25 seconds, 1920×1080 by default, with music and sound effects mixed in.</p>
              </div>
              <div className="card">
                <p className="label">brag.jpg</p>
                <p className="card-t">The poster</p>
                <p className="card-b">
                  The strongest settled frame, also baked in as the video’s first frame, so every platform’s thumbnail shows
                  it.
                </p>
              </div>
              <div className="card">
                <p className="label">share-copy.txt</p>
                <p className="card-t">The caption</p>
                <p className="card-b">One to three sentences you can post as they are. No “excited to share”.</p>
              </div>
              <div className="card">
                <p className="label">brag-plan.md</p>
                <p className="card-t">The plan</p>
                <p className="card-b">
                  The angle, the hook and a scene-by-scene storyboard, so you can see why the video looks the way it does.
                </p>
              </div>
            </div>

            <h3 className="mini-h">The shape of every brag</h3>
            <ol className="flow flow-4">
              <li className="card is-accent">
                <p className="label">2 to 3 s</p>
                <p className="card-t">Hook</p>
                <p className="card-b">The first 2 seconds decide whether anyone keeps watching, so this is planned first.</p>
              </li>
              <li className="card">
                <p className="label">2 to 4 s</p>
                <p className="card-t">Reveal</p>
                <p className="card-b">What it is, shown rather than described.</p>
              </li>
              <li className="card">
                <p className="label">5 to 12 s</p>
                <p className="card-t">Highlights</p>
                <p className="card-b">Two or three sharp moments of the real product in use.</p>
              </li>
              <li className="card">
                <p className="label">2 to 4 s</p>
                <p className="card-t">Punchline</p>
                <p className="card-b">The outro that earns the share.</p>
              </li>
            </ol>
            <p className="fine">A starting shape, not a template. /brag changes the number of highlights to suit the project.</p>
          </section>

          {/* ---------- 02 ---------- */}
          <section id="install" className="part" aria-labelledby="install-h">
            <h2 id="install-h" className="part-h">
              <span className="part-no">02</span> Install it
            </h2>
            <p className="part-intro">
              Pick the one that matches your agent. In Claude Code, the plugin is the easiest route, and it includes both
              /brag and /brag-slim.
            </p>

            <h3 className="mini-h">Claude Code</h3>
            <CopyBlock file="claude-code" label="Install the plugin" text={PLUGIN} noun="command" />
            <p className="fine">
              Type these into Claude Code, one after the other. Already have it? <code>claude plugin update brag</code> gets
              you the latest version.
            </p>

            <h3 className="mini-h">Any other agent</h3>
            <CopyBlock file="terminal" label="Install with the skills CLI" text={SKILLS_CLI} noun="command" />
            <p className="fine">
              Works with Cursor, Codex, Copilot, Gemini CLI, opencode and more. Add <code>-g</code> to install it for every
              project, or leave it off to install it for the current one only.
            </p>

            <h3 className="mini-h">Just /brag-slim</h3>
            <CopyBlock file="terminal" label="Install only the lean version" text={SLIM} noun="command" />
            <p className="fine">The lean version, built for Claude Opus 5.5: no Hyperframes and no bundled assets.</p>

            <h3 className="mini-h">What your machine needs</h3>
            <div className="scroll-x" role="region" aria-label="What your machine needs" tabIndex={0}>
              <table className="t">
                <thead>
                  <tr>
                    <th scope="col">Tool</th>
                    <th scope="col">Why</th>
                    <th scope="col">Check it with</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Node.js 22+</th>
                    <td>Runs the tooling</td>
                    <td>
                      <code>node -v</code>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">FFmpeg</th>
                    <td>Renders and finishes the video. It must be on your PATH</td>
                    <td>
                      <code>ffmpeg -version</code>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Hyperframes CLI</th>
                    <td>Builds and renders the full /brag. Not needed for /brag-slim</td>
                    <td>
                      <code>npx hyperframes doctor</code>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="note">
              <b>On Windows, if you clone the repo.</b> It uses symlinks so each agent finds the skill in its usual folder.
              Turn symlinks on first (<code>git clone -c core.symlinks=true</code>, with Developer Mode on or an admin shell), or
              copy <code>skills/brag/</code> into your agent’s skills folder by hand.
            </p>
          </section>

          {/* ---------- 03 ---------- */}
          <section id="run" className="part" aria-labelledby="run-h">
            <h2 id="run-h" className="part-h">
              <span className="part-no">03</span> Run it
            </h2>
            <p className="part-intro">
              Open your agent in the project you want to show off, and ask for it in plain words. That is the whole command.
            </p>
            <CopyBlock file="agent" label="Make the video" text={RUN} />

            <h3 className="mini-h">Options</h3>
            <div className="scroll-x" role="region" aria-label="Options" tabIndex={0}>
              <table className="t">
                <thead>
                  <tr>
                    <th scope="col">Flag</th>
                    <th scope="col">What it does</th>
                    <th scope="col">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {FLAGS.map((f) => (
                    <tr key={f.flag}>
                      <th scope="row">
                        <code>{f.flag}</code>
                      </th>
                      <td>{f.does}</td>
                      <td>{f.def}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CopyBlock file="agent" label="Steer it" text={STEER} />
            <p className="fine">
              Flags and plain language both work. Voiceover is opt-in and only in the full /brag; /brag-slim doesn’t do
              voice.
            </p>
            <p className="aside">
              <b>Brag about a website, too.</b> /brag-slim also takes a URL (“brag about example.com”). It loads the live
              site in a headless browser, takes its copy, colours, fonts and images, and builds the video from those.
            </p>
          </section>

          {/* ---------- 04 ---------- */}
          <section id="tones" className="part" aria-labelledby="tones-h">
            <h2 id="tones-h" className="part-h">
              <span className="part-no">04</span> Pick a tone
            </h2>
            <p className="part-intro">
              Seven presets ship with /brag. Each one changes the script’s energy, the pacing, the type and the transitions.
              Or skip them and describe the feel you want.
            </p>
            <div className="scroll-x" role="region" aria-label="The seven tones" tabIndex={0}>
              <table className="t">
                <thead>
                  <tr>
                    <th scope="col">Tone</th>
                    <th scope="col">Feel</th>
                    <th scope="col">Pacing</th>
                  </tr>
                </thead>
                <tbody>
                  {TONES.map((t, i) => (
                    <tr key={t.tone} className={i ? undefined : "is-key"}>
                      <th scope="row">
                        <code>{t.tone}</code>
                      </th>
                      <td>{t.feel}</td>
                      <td>{t.pace}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="fine">
              Your own direction works too: “museum exhibit” or “overproduced mobile game ad”. /brag borrows the pacing of
              the nearest preset and keeps your words in the plan.
            </p>
          </section>

          {/* ---------- 05 ---------- */}
          <section id="inside" className="part" aria-labelledby="inside-h">
            <h2 id="inside-h" className="part-h">
              <span className="part-no">05</span> What happens inside
            </h2>
            <p className="part-intro">
              /brag doesn’t screen-record your page. It works like a small video team, and each step has to pass a check
              before the next one starts.
            </p>
            <ol className="flow flow-4">
              <li className="card">
                <p className="label">Step 1</p>
                <p className="card-t">Inspect</p>
                <p className="card-b">
                  Reads your pages, styles, README and routes, then answers a 9-question brief: what it is, the best claim,
                  the visual hook, the real UI to show.
                </p>
              </li>
              <li className="card">
                <p className="label">Step 2</p>
                <p className="card-t">Plan</p>
                <p className="card-b">
                  Writes <code>brag-plan.md</code>: one angle, the hook, 2 or 3 highlights, the punchline, and a storyboard
                  that adds up to 15 to 25 s.
                </p>
              </li>
              <li className="card is-accent">
                <p className="label">Step 3</p>
                <p className="card-t">Compose</p>
                <p className="card-b">
                  Hands a focused brief to Hyperframes, which builds and times the video. <code>npx hyperframes check</code>{" "}
                  must pass with zero errors, contrast included.
                </p>
              </li>
              <li className="card">
                <p className="label">Step 4</p>
                <p className="card-t">Deliver</p>
                <p className="card-b">
                  Renders the video, picks the poster frame, bakes it in as frame 0 and writes the share copy.
                </p>
              </li>
            </ol>
            <p className="note">
              <b>On Opus 5.5, it goes slim.</b> Run /brag on Claude Opus 5.5 and it switches to /brag-slim and tells you in
              one line. The model then builds the whole video itself with the tools already on your machine: no Hyperframes,
              no bundled music, same creative rules. Say “use the full brag” or add <code>--full</code> to keep the classic
              workflow. <code>--voice</code> always uses the full one.
            </p>
            <p className="fine">
              The music and sound effects bundled with the full skill are from ende.app (“Happy Beats / Business Moves”)
              and Kenney.
            </p>
          </section>

          {/* ---------- 06 ---------- */}
          <section id="better" className="part" aria-labelledby="better-h">
            <h2 id="better-h" className="part-h">
              <span className="part-no">06</span> Get a better brag
            </h2>
            <p className="part-intro">The rules /brag follows are also the best guide to helping it.</p>
            <div className="box">
              <p className="label">Its rules, in 6 lines</p>
              <ul className="squares">
                <li>Short: 15 to 25 seconds, and 18 to 22 is the sweet spot.</li>
                <li>Readable: every line stays on screen long enough to read, about 0.3 s per word.</li>
                <li>Show the thing: at least one scene shows your real UI, copy or visuals. No abstract filler.</li>
                <li>Specific: your own copy and claims. “Streamline your workflow” is banned.</li>
                <li>Hook first: the first 2 seconds are planned before anything else.</li>
                <li>Funny earns its place: the humour comes from the project, not from trying.</li>
              </ul>
            </div>
            <h3 className="mini-h">Your part</h3>
            <ol className="steps">
              <li>
                <b>Run it where the product lives.</b> The best material is the product in use: entry, key action, result.
                Make sure those screens exist in your code, not only a landing page describing them.
              </li>
              <li>
                <b>Give it one focus.</b> Shipped a new feature or a new version? Say so when you run it, and the video centres
                on that.
              </li>
              <li>
                <b>Look before it renders.</b> The full /brag opens a preview (<code>npx hyperframes preview</code>) and waits
                for your go-ahead before the final render.
              </li>
              <li>
                <b>Re-roll what’s off.</b> Not quite right? Ask it to redo one scene or try another tone, instead of starting
                over.
              </li>
            </ol>
            <p className="join">
              <span className="label">More guides like this</span>
              <span>follow along at</span>
              <a href="https://www.instagram.com/devdrop.ai/">@devdrop.ai</a>
            </p>
          </section>

          <section id="links" className="part" aria-labelledby="links-h">
            <h2 id="links-h" className="mini-h">
              Every link in this guide
            </h2>
            <ul className="links">
              <li>
                <a href="https://github.com/latent-spaces/brag">github.com/latent-spaces/brag</a> · the skill
              </li>
              <li>
                <a href="https://latent-spaces.github.io/brag/">latent-spaces.github.io/brag</a> · example videos
              </li>
              <li>
                <a href="https://hyperframes.heygen.com/">hyperframes.heygen.com</a> · Hyperframes
              </li>
              <li>
                <a href="https://www.skills.sh/latent-spaces/brag/brag">skills.sh/latent-spaces/brag</a> · on skills.sh
              </li>
              <li>
                <a href="https://ffmpeg.org/download.html">ffmpeg.org</a> · FFmpeg
              </li>
              <li>
                <a href="https://www.instagram.com/devdrop.ai/">instagram.com/devdrop.ai</a> · more guides
              </li>
            </ul>
            <div className="doc-end">
              <Link className="btn btn-solid" href="/guides">
                All guides
              </Link>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
