import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { accentVars, guides } from "../../_data/guides";
import { site } from "../../_data/site";
import CopyBlock from "../_ui/CopyBlock";
import Layers, { type Part } from "../_ui/Layers";
import { INBOX, INVOICES, MAIN, ROUTER, TICKETS } from "./prompts";
import "../guide.css";

const g = guides.find((x) => x.slug === "jev-claude")!;

export const metadata: Metadata = { title: g.title, description: g.summary };

const PARTS: Part[] = [
  { id: "cover", label: "Cover" },
  { id: "get-access", n: "01", label: "Get access" },
  { id: "wire-it-in", n: "02", label: "Wire it into your agent" },
  { id: "route", n: "03", label: "Level 1: route every message" },
  { id: "sort", n: "04", label: "Level 2: sort anything" },
  { id: "unlocks", n: "05", label: "Level 3: what this unlocks" },
  { id: "next", n: "06", label: "Where this goes next" },
  { id: "links", label: "Every link" },
];

const PRICES = [
  { model: "Jev", input: "$0.042", output: "free", x: 1 },
  { model: "Claude Haiku 4.5", input: "$1", output: "$5", x: 24 },
  { model: "Claude Fable 5.1", input: "$10", output: "$50", x: 238 },
];

const RUNS = [
  { model: "Jev", note: "", time: 3.6, cost: 0.0032, right: 89 },
  { model: "Claude Haiku 4.5", note: "thinking off", time: 11.1, cost: 0.061, right: 84 },
  { model: "Claude Fable 5.1", note: "effort low", time: 38.7, cost: 0.76, right: 97 },
];

function Bar({ v, max, children }: { v: number; max: number; children: ReactNode }) {
  return (
    <span className="bar">
      <span>{children}</span>
      <span className="bar-track" aria-hidden="true">
        <span className="bar-fill" style={{ width: `${Math.max((v / max) * 100, 0.8)}%` }} />
      </span>
    </span>
  );
}

export default function JevClaude() {
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
            Jev + <span className="dot">CLAUDE</span>
            <span className="cover-sub">the setup guide</span>
          </h1>
          <p className="promise">
            Let Jev make the quick calls and let Claude do the thinking. Jev answers pick-one, how-much and how-likely
            questions in about a third of a second for a fraction of a cent, so Claude only spends tokens on work that needs
            it.
          </p>
          <div className="cover-actions">
            <a className="btn btn-solid" href="#get-access">
              Start with part 01
            </a>
          </div>

          <h2 className="mini-h">Jev in four lines</h2>
          <table className="t four">
            <tbody>
              <tr>
                <td className="t-n">1</td>
                <th scope="row">Not an LLM</th>
                <td>It doesn’t write. You give it a state (any text or data) and typed questions, and it returns decisions.</td>
              </tr>
              <tr>
                <td className="t-n">2</td>
                <th scope="row">Three answer shapes</th>
                <td>
                  <code>choice</code> picks one of your options. <code>score</code> puts it on your scale. <code>noul</code> gives
                  the odds that a statement is true.
                </td>
              </tr>
              <tr>
                <td className="t-n">3</td>
                <th scope="row">Answers are free</th>
                <td>Input costs $0.042 per 1M tokens. The output costs nothing.</td>
              </tr>
              <tr>
                <td className="t-n">4</td>
                <th scope="row">About 0.3 s</th>
                <td>Every question comes back in one parallel pass, usually in 70 to 500 ms.</td>
              </tr>
            </tbody>
          </table>
          <p className="fine">Jev is TypeSafe AI’s first “System One” model. It launched on 15 September 2026.</p>
        </div>
      </header>

      <div className="doc-body">
        <Layers title="Jev + Claude" parts={PARTS} />

        <article className="sheet doc-sheet">
          <aside className="readme" aria-label="Readme">
            <p className="label">Readme</p>
            <p>
              <b>What this is.</b> A hands-on setup for Jev, a fast decision model, inside Claude Code: one prompt to wire it
              in, then three levels of things to build on top.
            </p>
            <p>
              <b>How to use it.</b> Go in order. Part 01 gets you a key. Part 02 is the single prompt that connects Jev. Parts
              03 and 04 build on it: a model router, then sorting any pile of text. Parts 05 and 06 are about what comes
              after. Every prompt is ready to copy and paste.
            </p>
            <p>
              <b>What you need.</b> An AI coding agent and a few cents of OpenRouter credit. Everything here is built from the
              prompts, so there is nothing else to install.
            </p>
          </aside>

          {/* ---------- 01 ---------- */}
          <section id="get-access" className="part" aria-labelledby="get-access-h">
            <h2 id="get-access-h" className="part-h">
              <span className="part-no">01</span> Get access
            </h2>
            <p className="part-intro">
              Anyone can use Jev. OpenRouter is the easiest way in: one account and one key for many AI models, Jev among
              them.
            </p>
            <ol className="steps">
              <li>
                <b>Sign up</b> at <a href="https://openrouter.ai">openrouter.ai</a>.
              </li>
              <li>
                <b>Top up a small amount.</b> Jev is paid, but only just: sorting all 100 emails in part 04 cost{" "}
                <b>$0.0032</b>.
              </li>
              <li>
                <b>Make an API key</b> at <a href="https://openrouter.ai/keys">openrouter.ai/keys</a> and copy it. The key is
                what lets Claude call Jev on your behalf, so guard it like a password.
              </li>
              <li>
                <b>Hold on to it for part 02.</b> The prompt asks you for it and stores it safely on your machine. There is no
                manual setup.
              </li>
            </ol>
            <div className="specs">
              <div className="card">
                <p className="label">Model ID</p>
                <code className="spec-code">typesafe/jev-1.13</code>
                <p className="card-b">What Claude calls Jev on OpenRouter.</p>
              </div>
              <div className="card">
                <p className="label">Limits</p>
                <p className="card-b">64K tokens per request, up to 32K of it your data. Text only, and best in English.</p>
              </div>
            </div>

            <h3 className="mini-h">Price check</h3>
            <div className="scroll-x" role="region" aria-label="Price check" tabIndex={0}>
              <table className="t">
                <thead>
                  <tr>
                    <th scope="col">Model</th>
                    <th scope="col" className="num">
                      Input, per 1M tokens
                    </th>
                    <th scope="col" className="num">
                      Output, per 1M tokens
                    </th>
                    <th scope="col" className="num">
                      Input price vs Jev
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PRICES.map((p, i) => (
                    <tr key={p.model} className={i ? undefined : "is-jev"}>
                      <th scope="row">{p.model}</th>
                      <td className="num">{p.input}</td>
                      <td className="num">{p.output}</td>
                      <td className="num">{p.x}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <figure className="units">
              <figcaption className="fine">Input price to scale. Each square is Jev’s $0.042 per 1M tokens.</figcaption>
              {PRICES.map((p, i) => (
                <div key={p.model} className={i ? "units-row" : "units-row is-jev"}>
                  <span className="units-k">{p.model}</span>
                  <span className="units-v">{p.x}x</span>
                  <span className="units-sq" aria-hidden="true">
                    {Array.from({ length: p.x }, (_, k) => (
                      <i key={k} />
                    ))}
                  </span>
                </div>
              ))}
            </figure>
            <p className="fine">
              USD list prices as of 21 September 2026. They change, so confirm on the provider’s page before you count on them.
            </p>
            <p className="fine">
              Already on another platform? Jev is also on Vercel AI Gateway (<code>typesafe-ai/jev</code>), Cloudflare Workers
              AI (<code>typesafe/jev</code>) and TypeSafe itself (keys at{" "}
              <a href="https://console.typesafe.ai">console.typesafe.ai</a>). Everything below assumes OpenRouter.
            </p>

            <h3 className="mini-h">Anatomy of one call</h3>
            <ol className="flow">
              <li className="card">
                <p className="label">You send a state</p>
                <p className="card-t">One email</p>
                <p className="card-b">
                  “Hi, we run an online skincare store and want an AI agent to answer our order emails. Budget is signed off
                  and we want to start next month. Can we book a call this week?”
                </p>
              </li>
              <li className="card">
                <p className="label">You ask</p>
                <p className="card-t">3 typed questions</p>
                <ul className="card-list">
                  <li>
                    <b>choice:</b> which team should reply?
                  </li>
                  <li>
                    <b>score:</b> how good a lead is it?
                  </li>
                  <li>
                    <b>noul:</b> does it need a personal reply today?
                  </li>
                </ul>
              </li>
              <li className="card is-accent">
                <p className="label">Jev answers</p>
                <p className="card-t">3 decisions</p>
                <ul className="card-list">
                  <li>sales, confidence 1</li>
                  <li>2.99 on a 0 to 3 scale (hot lead), confidence 0.99</li>
                  <li>0.78 chance it needs a reply today</li>
                </ul>
              </li>
            </ol>
            <p className="fine">
              A live call through OpenRouter on 21 September 2026: 0.26 s (the median of 3 runs) for $0.00002. The prompt in
              part 02 runs the same kind of test for you.
            </p>
          </section>

          {/* ---------- 02 ---------- */}
          <section id="wire-it-in" className="part" aria-labelledby="wire-it-in-h">
            <h2 id="wire-it-in-h" className="part-h">
              <span className="part-no">02</span> Wire it into your agent
            </h2>
            <p className="part-intro">
              Open your coding agent, in a fresh folder or your usual workspace, and paste the prompt below. It is written with
              Claude Code in mind, but any agent that can run commands on your machine will do. The agent asks for your key,
              makes one live test call so you can watch Jev answer, and saves the setup as a reusable skill. Jev is newer than
              every model’s training data, so the prompt sends your agent to the public docs first.
            </p>
            <CopyBlock file="main-prompt.txt" label="The main prompt" text={MAIN} />
            <p className="fine">Once it’s done, point it at any pile of text: “use Jev to sort these”.</p>
          </section>

          {/* ---------- 03 ---------- */}
          <section id="route" className="part" aria-labelledby="route-h">
            <h2 id="route-h" className="part-h">
              <span className="part-no">03</span> Level 1: route every message
            </h2>
            <p className="part-intro">
              Most of what you ask Claude doesn’t need its biggest model. Jev reads each message and names the smallest model
              that can handle it.
            </p>
            <ol className="flow flow-4">
              <li className="card">
                <p className="label">Step 1</p>
                <p className="card-t">You send a message</p>
                <p className="card-b">Anything normal. Quick replies and slash commands bypass the router.</p>
              </li>
              <li className="card is-accent">
                <p className="label">Step 2</p>
                <p className="card-t">Jev sizes it</p>
                <p className="card-b">A hook calls Jev first, in about 0.3 s, and gets back a tier: haiku, sonnet, opus or fable.</p>
              </li>
              <li className="card">
                <p className="label">Step 3</p>
                <p className="card-t">Claude gets a note</p>
                <p className="card-b">The hook passes the verdict along, something like “Jev sized this as SONNET, confidence 0.97”.</p>
              </li>
              <li className="card">
                <p className="label">Step 4</p>
                <p className="card-t">A pinned helper works</p>
                <p className="card-b">Claude hands self-contained work to a helper agent locked to that model.</p>
              </li>
            </ol>
            <p className="note">
              <b>The catch.</b> Claude Code can’t switch models per message, and a hook can’t change the model either. All a
              hook can do is add a note. So the router is that note plus four helper agents, each locked to one model by the{" "}
              <code>model:</code> line in its file. The prompt tells your agent to say this plainly instead of inventing a
              setting that doesn’t exist.
            </p>
            <p className="aside">
              You end up with three switches. Your agent chooses the exact words and tells you them at the end. They look
              something like this:
            </p>
            <ul className="cmds">
              <li className="card is-accent">
                <code className="cmd">/jev on</code>
                <p className="card-b">Router on. Jev sees every message first.</p>
              </li>
              <li className="card">
                <code className="cmd">/jev off</code>
                <p className="card-b">Router off. This is the default, and the right setting for private work.</p>
              </li>
              <li className="card">
                <code className="cmd">/jev status</code>
                <p className="card-b">ON or OFF, how many messages went to each tier, and what Jev has cost so far.</p>
              </li>
            </ul>
            <p className="fine">
              It never holds a message up: if Jev is slow or the key is missing, it quietly steps aside. While it is on, your
              messages travel through OpenRouter to TypeSafe. It works in Claude Code in the terminal, in the VS Code
              extension and in the Code tab of the Claude desktop app.
            </p>
            <CopyBlock file="model-router.txt" label="The model router prompt" text={ROUTER} />
            <p className="aside">
              <b>The same trick for skills.</b> Give Jev the name and first line of every skill, and it returns the one to
              load with a confidence. Below 0.6, Claude decides. In one recorded run it picked the right skill 12 times out of
              14, from a list of 145. TypeSafe’s cookbook reports wrong-skill loads dropping from 17% to 7.3% (182 skills,
              agent on Haiku 4.5), but that is their own test, not an independent one.
            </p>
          </section>

          {/* ---------- 04 ---------- */}
          <section id="sort" className="part" aria-labelledby="sort-h">
            <h2 id="sort-h" className="part-h">
              <span className="part-no">04</span> Level 2: sort anything
            </h2>
            <div className="pair">
              <div className="card">
                <p className="label">Before</p>
                <p className="card-b">
                  Someone reads every email, ticket or invoice by hand. Or a big chat model reads the whole pile, at big-model
                  prices.
                </p>
              </div>
              <div className="card is-accent">
                <p className="label">After</p>
                <p className="card-b">Jev sorts the pile in seconds. Claude writes only the replies worth writing.</p>
              </div>
            </div>

            <h3 className="mini-h">Same 100 emails, three models</h3>
            <div className="scroll-x" role="region" aria-label="Same 100 emails, three models" tabIndex={0}>
              <table className="t bench">
                <thead>
                  <tr>
                    <th scope="col">Model</th>
                    <th scope="col">Time</th>
                    <th scope="col">Cost</th>
                    <th scope="col">Lead score exactly right</th>
                    <th scope="col" className="num">
                      Hot leads found
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {RUNS.map((r, i) => (
                    <tr key={r.model} className={i ? undefined : "is-jev"}>
                      <th scope="row">
                        {r.model}
                        {r.note && <span className="t-note"> ({r.note})</span>}
                      </th>
                      <td>
                        <Bar v={r.time} max={38.7}>
                          {r.time} s
                        </Bar>
                      </td>
                      <td>
                        <Bar v={r.cost} max={0.76}>
                          ${r.cost}
                        </Bar>
                      </td>
                      <td>
                        <Bar v={r.right} max={100}>
                          {r.right} / 100
                        </Bar>
                      </td>
                      <td className="num">15 / 15</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="lead-line">Fable scored best, Jev beat Haiku, and every model caught all 15 hot leads.</p>
            <p className="fine">
              100 invented emails for a made-up agency. Same questions, 10 emails per batch, live calls through OpenRouter on
              21 September 2026. Cost is what OpenRouter billed. Separately, 27 questions about a single support ticket came
              back in one pass in about 0.25 s, for $0.00008.
            </p>
            <CopyBlock file="sort-inbox.txt" label="Sort my inbox export by lead quality" text={INBOX} />
            <CopyBlock file="triage-tickets.txt" label="Triage support tickets by urgency and team" text={TICKETS} />
            <CopyBlock file="check-invoices.txt" label="Check supplier invoices for fraud signs" text={INVOICES} />
          </section>

          {/* ---------- 05 ---------- */}
          <section id="unlocks" className="part" aria-labelledby="unlocks-h">
            <h2 id="unlocks-h" className="part-h">
              <span className="part-no">05</span> Level 3: what this unlocks
            </h2>
            <p className="part-intro">
              When a decision costs next to nothing and lands in a third of a second, you can put one where a chat model was
              always too slow. There is already a real example.
            </p>
            <div className="box">
              <p className="label">Unclutter, in 5 lines</p>
              <ul className="squares">
                <li>
                  Kitze’s free, open-source browser extension that tidies up web pages:{" "}
                  <a href="https://github.com/kitze/unclutter">github.com/kitze/unclutter</a>
                </li>
                <li>
                  One Jev pass judges up to 60 page elements: keep it, or is it an ad, a promo, a newsletter box, a social
                  widget or a cookie banner?
                </li>
                <li>It hides only what Jev is at least 0.9 sure of. Anything doubtful stays on the page.</li>
                <li>It remembers the rule per page type, so the next article on that site gets cleaned without a new call.</li>
                <li>It needs a Vercel AI Gateway or TypeSafe key. An OpenRouter key won’t work.</li>
              </ul>
            </div>
            <h3 className="mini-h">Where Jev is the wrong tool</h3>
            <ul className="chips">
              {["Writing", "Chat", "Reasoning", "Counting", "Maths", "Dates"].map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <p className="fine">
              TypeSafe’s own list of weak spots, plus long inputs padded with irrelevant text. Hand these to Claude. The rule
              from part 02 holds everywhere: Jev decides, Claude writes.
            </p>
          </section>

          {/* ---------- 06 ---------- */}
          <section id="next" className="part" aria-labelledby="next-h">
            <h2 id="next-h" className="part-h">
              <span className="part-no">06</span> Where this goes next
            </h2>
            <p className="part-intro">
              Wiring Jev in is the easy part. One prompt does it. The real skill is spotting which decisions in a business
              can go to a fast, cheap model, then building the system around them.
            </p>
            <p className="part-intro">
              Start small. Pick one pile you sort by hand every week, write three questions about it, and let Jev take the
              first pass.
            </p>
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
                <a href="https://openrouter.ai">openrouter.ai</a> · account and credit
              </li>
              <li>
                <a href="https://openrouter.ai/keys">openrouter.ai/keys</a> · your API key
              </li>
              <li>
                <a href="https://github.com/kitze/unclutter">github.com/kitze/unclutter</a> · Unclutter
              </li>
              <li>
                <a href="https://console.typesafe.ai">console.typesafe.ai</a> · TypeSafe direct keys
              </li>
              <li>
                <a href="https://www.instagram.com/devdrop.ai/">instagram.com/devdrop.ai</a> · more guides
              </li>
              <li>
                Model ID: <code>typesafe/jev-1.13</code>
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
