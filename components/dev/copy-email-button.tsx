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
    <button className="ds-copy-button" type="button" onClick={copyEmail}>
      {copied ? "Email copied" : "Copy email"} <span aria-hidden="true">↗</span>
    </button>
  );
}
