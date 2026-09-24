"use client";

import { useRef, useState } from "react";

export default function CopyBlock({ label, file, text }: { label: string; file: string; text: string }) {
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
          {state === "copied" ? "Copied" : state === "selected" ? "Selected, copy it" : "Copy prompt"}
        </button>
      </figcaption>
      <pre ref={pre} className="prompt-body">
        {text}
      </pre>
      <span className="sr-only" role="status">
        {state === "copied" ? "Prompt copied" : ""}
      </span>
    </figure>
  );
}
