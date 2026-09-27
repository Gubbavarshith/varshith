"use client";

import { useRef, useState } from "react";

// noun names what gets copied: a prompt for the agent, or a command for the terminal
export default function CopyBlock({
  label,
  file,
  text,
  noun = "prompt",
}: {
  label: string;
  file: string;
  text: string;
  noun?: "prompt" | "command";
}) {
  const pre = useRef<HTMLPreElement>(null);
  const [state, setState] = useState<"idle" | "copied" | "selected">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      // no clipboard access (plain http, old browser): select it so the keyboard shortcut works
      getSelection()?.selectAllChildren(pre.current!);
      setState("selected");
    }
    setTimeout(() => setState("idle"), 2400);
  }

  return (
    <figure className="prompt">
      <figcaption className="prompt-bar">
        <span className="prompt-file">{file}</span>
        <span className="prompt-label">{label}</span>
        <button type="button" className="prompt-copy" onClick={copy}>
          {state === "copied" ? "Copied" : state === "selected" ? "Selected, copy it" : `Copy ${noun}`}
        </button>
      </figcaption>
      <pre ref={pre} className="prompt-body">
        {text}
      </pre>
      <span className="sr-only" role="status">
        {state === "copied" ? `${noun === "prompt" ? "Prompt" : "Command"} copied` : ""}
      </span>
    </figure>
  );
}
