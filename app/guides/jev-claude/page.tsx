import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { accentVars, guides } from "../../_data/guides";
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
          <span>{g.credit}</span>
        </p>
        <div className="sheet cover">
          <p className="kicker">A RoboNuggets guide</p>
          <h1 className="cover-title">
            Jev + <span className="dot">CLAUDE</span>
            <span className="cover-sub">the setup guide</span>
          </h1>
          <p className="promise">
            The promise: pair Jev with Claude and get 10x the power at 100x less cost. Jev makes the fast calls for a
            fraction of a cent. Claude keeps the thinking and the writing.
          </p>
          <div className="cover-actions">
            <a className="btn btn-solid" href="#get-access">
              Start with part 01
            </a>
            {g.pdf && (
              <a className="btn" href={g.pdf} download>
                Download the PDF
              </a>
            )}
          </div>

          <h2 className="mini-h">What Jev is, in 4 lines</h2>
          <table className="t four">
            <tbody>
              <tr>
                <td className="t-n">1</td>
                <th scope="row">Not an LLM</th>
                <td>It never writes text. You send it a state (any text or data) plus typed questions, and it sends back decisions.</td>
              </tr>
              <tr>
                <td className="t-n">2</td>
                <th scope="row">3 answer shapes</th>
                <td>
                  <code>choice</code> picks one of your options. <code>score</code> places it on your scale. <code>noul</code> gives
                  the chance a statement is true.
                </td>
              </tr>
              <tr>
                <td className="t-n">3</td>
                <th scope="row">Output is free</th>
                <td>You pay $0.042 per 1M input tokens and nothing at all for the answers.</td>
              </tr>
              <tr>
                <td className="t-n">4</td>
                <th scope="row">About 0.3 s</th>
                <td>It answers every question in one parallel pass, in 70 to 500 ms.</td>
              </tr>
            </tbody>
          </table>
          <p className="fine">Jev is the first “System One” model from TypeSafe AI, launched 15 September 2026.</p>
          <p className="credit">
            Original guide and kit by RoboNuggets (<a href="https://www.skool.com/robonuggets">skool.com/robonuggets</a>).
            Web edition shared by Gubba Varshith.
          </p>
        </div>
      </header>

      <div className="doc-body">
        <Layers title="Jev + Claude" parts={PARTS} />

        <article className="sheet doc-sheet">
          <aside className="readme" aria-label="Readme">
            <p className="label">Readme</p>
            <p>
              <b>What this is.</b> The setup guide for the “Jev + Claude” lesson. It shows how to wire Jev, a fast decision
              model, into Claude Code, then three levels of things to do with it.
            </p>
            <p>
              <b>How to set it up.</b> Work through the parts in order. Part 01 gets your key. Part 02 is the one prompt that
              wires Jev in. Parts 03 and 04 are the builds on top: the routers, then sorting any pile of text. Parts 05 and 06
              show where this goes next. Every prompt block is copy-paste ready.
            </p>
            <p>
              <b>Two ways to get this.</b> Build it yourself with the prompts in this guide, free. Or install the pre-built kit
              from the video: the router hook, the four helper agents and the <code>/jev</code> command. That comes with the
              RoboNuggets community at <a href="https://www.skool.com/robonuggets">skool.com/robonuggets</a>.
            </p>
          </aside>

          {/* ---------- 01 ---------- */}
          <section id="get-access" className="part" aria-labelledby="get-access-h">
            <h2 id="get-access-h" className="part-h">
              <span className="part-no">01</span> Get access
            </h2>
            <p className="part-intro">
              Jev is open to everyone. The simplest way in is OpenRouter: one account and one key that reaches many AI models,
              Jev included.
            </p>
            <ol className="steps">
              <li>
                <b>Make an OpenRouter account</b> at <a href="https://openrouter.ai">openrouter.ai</a>.
              </li>
              <li>
                <b>Add a little credit.</b> Jev is a paid model, but a tiny one. Our whole 100-email test in part 04 cost{" "}
                <b>$0.0032</b>.
              </li>
              <li>
                <b>Create an API key</b> at <a href="https://openrouter.ai/keys">openrouter.ai/keys</a> and copy it. An API
                key is a password that lets Claude call Jev for you. Treat it like one.
              </li>
              <li>
                <b>Keep it handy for part 02.</b> The prompt asks for it and keeps it somewhere safe on your computer. You set
                nothing up by hand.
              </li>
            </ol>
            <div className="specs">
              <div className="card">
                <p className="label">Model ID</p>
                <code className="spec-code">typesafe/jev-1.13</code>
                <p className="card-b">The name Claude uses when it calls Jev through OpenRouter.</p>
              </div>
              <div className="card">
                <p className="label">Limits</p>
                <p className="card-b">64K tokens per request, with 32K of that for your data. Text only. English works best.</p>
              </div>
            </div>

            <h3 className="mini-h">What it costs</h3>
            <div className="scroll-x" role="region" aria-label="What it costs" tabIndex={0}>
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
              <figcaption className="fine">Input price to scale. One square is Jev’s $0.042 per 1M tokens.</figcaption>
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
              List prices in USD, checked 21 September 2026. Prices move, so check the provider’s own page before you rely on
              them.
            </p>
            <p className="fine">
              Other ways in, if you already use them: Vercel AI Gateway (<code>typesafe-ai/jev</code>), Cloudflare Workers AI (
              <code>typesafe/jev</code>), or TypeSafe direct (keys at <a href="https://console.typesafe.ai">console.typesafe.ai</a>
              ). This guide uses OpenRouter throughout.
            </p>

            <h3 className="mini-h">What one Jev call looks like</h3>
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
              A real call through OpenRouter, recorded 21 September 2026: 0.26 s (the middle of 3 runs) for $0.00002. The
              prompt in part 02 runs this same test for you.
            </p>
          </section>

          {/* ---------- 02 ---------- */}
          <section id="wire-it-in" className="part" aria-labelledby="wire-it-in-h">
            <h2 id="wire-it-in-h" className="part-h">
              <span className="part-no">02</span> Wire it into your agent
            </h2>
            <p className="part-intro">
              Open your AI agent in an empty folder or in your existing workspace and paste this whole prompt. We use Claude
              Code in the video, and the prompt works in any agent that can run things on your computer. Your agent asks for
              your key, makes one real test call so you can watch Jev answer, then saves it all as a reusable skill. Jev
              launched after every model’s training data, which is why the prompt points at the public docs instead.
            </p>
            <CopyBlock file="main-prompt.txt" label="The main prompt" text={MAIN} />
            <p className="fine">When your agent finishes, try it on any pile of text: “use Jev to sort these”.</p>
          </section>

          {/* ---------- 03 ---------- */}
          <section id="route" className="part" aria-labelledby="route-h">
            <h2 id="route-h" className="part-h">
              <span className="part-no">03</span> Level 1: route every message
            </h2>
            <p className="part-intro">
              Most messages do not need the biggest model. Jev reads each one and names the smallest Claude model that can do
              it.
            </p>
            <ol className="flow flow-4">
              <li className="card">
                <p className="label">Step 1</p>
                <p className="card-t">You send a message</p>
                <p className="card-b">Any normal message. Short replies and slash commands skip the router.</p>
              </li>
              <li className="card is-accent">
                <p className="label">Step 2</p>
                <p className="card-t">Jev sizes it</p>
                <p className="card-b">A hook runs Jev first. About 0.3 s. Jev names a tier: haiku, sonnet, opus or fable.</p>
              </li>
              <li className="card">
                <p className="label">Step 3</p>
                <p className="card-t">Claude gets a note</p>
                <p className="card-b">The hook hands over the verdict: “Jev sized this as SONNET, confidence 0.97”.</p>
              </li>
              <li className="card">
                <p className="label">Step 4</p>
                <p className="card-t">A pinned helper works</p>
                <p className="card-b">Claude passes self-contained work to a helper agent pinned to that model.</p>
              </li>
            </ol>
            <p className="note">
              <b>The honest constraint.</b> Claude Code has no built-in per-message model switch, and a hook cannot change the
              model. A hook can only add a note. So the router is a note plus four helper agents, each pinned to one model by
              the <code>model:</code> line in its file. The prompt asks your agent to be honest about this, which stops it
              inventing a setting that does not exist.
            </p>
            <ul className="cmds">
              <li className="card is-accent">
                <code className="cmd">/jev on</code>
                <p className="card-b">Turns the router on. Every message goes to Jev first.</p>
              </li>
              <li className="card">
                <code className="cmd">/jev off</code>
                <p className="card-b">Turns it off. It is OFF by default. Use this for private work.</p>
              </li>
              <li className="card">
                <code className="cmd">/jev status</code>
                <p className="card-b">Says ON or OFF, how many messages went to each tier, and the Jev cost so far.</p>
              </li>
            </ul>
            <p className="fine">
              It never blocks a message, and it goes silent if Jev is slow or the key is missing. While it is on, your message
              text goes to TypeSafe through OpenRouter. It works in the Claude Code VS Code extension, the terminal, and the
              Code tab of the Claude desktop app.
            </p>
            <CopyBlock file="model-router.txt" label="The model router prompt" text={ROUTER} />
            <p className="aside">
              <b>The skill router, same idea.</b> Jev reads the name and first line of every skill and returns the one to
              load, with its confidence. Under 0.6, Claude picks. In our recorded run Jev chose the right skill 12 times out
              of 14, from a list of 145. TypeSafe’s own cookbook test reports wrong-skill loads falling from 17% to 7.3% (182
              skills, agent on Haiku 4.5). That is their number, not an independent one.
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
                  A person opens every email, ticket or invoice, one at a time. Or you pay a big chat model to read the whole
                  pile.
                </p>
              </div>
              <div className="card is-accent">
                <p className="label">After</p>
                <p className="card-b">Jev sorts the whole pile in seconds. Claude only writes the replies that matter.</p>
              </div>
            </div>

            <h3 className="mini-h">What we measured: the same 100 emails, three models</h3>
            <div className="scroll-x" role="region" aria-label="The same 100 emails, three models" tabIndex={0}>
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
            <p className="lead-line">Fable was the most accurate, Jev beat Haiku, and all three found all 15 hot leads.</p>
            <p className="fine">
              100 made-up emails for a fictional agency. Same questions, 10 at a time, real calls through OpenRouter, recorded
              21 September 2026. Cost is what OpenRouter billed. Also from the video: 27 questions about one support ticket,
              answered in one pass in about 0.25 s for $0.00008.
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
              Once a decision costs almost nothing and takes a third of a second, you can put one in places where a chat model
              was always too slow. One real example is already out.
            </p>
            <div className="box">
              <p className="label">Unclutter, in 5 lines</p>
              <ul className="squares">
                <li>
                  A free, open-source browser extension by Kitze that cleans up web pages:{" "}
                  <a href="https://github.com/kitze/unclutter">github.com/kitze/unclutter</a>
                </li>
                <li>
                  Jev judges up to 60 page elements in one pass: keep it, or is it an ad, a promo, a newsletter box, a social
                  widget or a cookie banner?
                </li>
                <li>It only hides what Jev is at least 0.9 sure about. Anything uncertain stays on the page.</li>
                <li>It saves the rule per page type, so the next article on that site is cleaned with no new call.</li>
                <li>It takes a Vercel AI Gateway key or a TypeSafe key, not an OpenRouter key.</li>
              </ul>
            </div>
            <h3 className="mini-h">When NOT to use Jev</h3>
            <ul className="chips">
              {["Writing", "Chat", "Reasoning", "Counting", "Maths", "Dates"].map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <p className="fine">
              This is TypeSafe’s own list of weak spots, plus long input full of irrelevant text. Give those jobs to Claude. The
              rule from part 02 holds everywhere: Jev decides, Claude writes.
            </p>
          </section>

          {/* ---------- 06 ---------- */}
          <section id="next" className="part" aria-labelledby="next-h">
            <h2 id="next-h" className="part-h">
              <span className="part-no">06</span> Where this goes next
            </h2>
            <p className="part-intro">
              The easy part is wiring Jev in. One prompt does it. The skill that pays is spotting which decisions in a business
              are worth handing to a fast, cheap model, then building the system around them.
            </p>
            <p className="part-intro">
              That is what we practise every week: building AI systems you can sell, and mastering Claude Code + Claude Design
              along the way. The pre-built Jev kit from the video lives there too, ready to install.
            </p>
            <p className="join">
              <span className="label">The RoboNuggets community</span>
              <span>join us at</span>
              <a href="https://www.skool.com/robonuggets">skool.com/robonuggets</a>
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
                <a href="https://www.skool.com/robonuggets">skool.com/robonuggets</a> · the kit and the community
              </li>
              <li>
                Model id: <code>typesafe/jev-1.13</code>
              </li>
            </ul>
            <div className="doc-end">
              <Link className="btn btn-solid" href="/guides">
                All guides
              </Link>
              {g.pdf && (
                <a className="btn" href={g.pdf} download>
                  Download the PDF
                </a>
              )}
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
