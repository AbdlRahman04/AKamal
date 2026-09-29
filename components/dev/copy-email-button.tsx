"use client";

import { useState } from "react";

export default function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }

  return (
    <button className="ds-copy-button" type="button" onClick={copyEmail} aria-live="polite">
      {copied ? "Copied" : "Copy email"} <span aria-hidden="true">{copied ? "✓" : <svg viewBox="0 0 20 20" fill="none"><rect x="6" y="6" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M4 13H3.5A1.5 1.5 0 0 1 2 11.5v-8A1.5 1.5 0 0 1 3.5 2h8A1.5 1.5 0 0 1 13 3.5V4" stroke="currentColor" strokeWidth="1.5" /></svg>}</span>
    </button>
  );
}
