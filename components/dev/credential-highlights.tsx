"use client";

import { useRef, useState } from "react";
import type { DevCertificate } from "@/data/dev";
import { useMotionVisibility } from "./feature-motion";

export default function CredentialHighlights({ certificates }: { certificates: DevCertificate[] }) {
  const root = useRef<HTMLDivElement>(null);
  const { visible, reduced } = useMotionVisibility(root);
  const [hovered, setHovered] = useState(false);
  const issuers = [...new Set(certificates.filter(item => item.status === "completed").map(item => item.issuer).filter(Boolean))];
  const running = visible && !reduced && !hovered;
  if (issuers.length < 3) return null;
  return <div ref={root} className="ds-learning-band">
    <div className="ds-learning-band-heading"><p>Learning from</p></div>
    <div className="ds-learning-viewport" onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }} onPointerLeave={() => setHovered(false)}>
      <div className="ds-learning-track" data-running={running}>
        <ul aria-label="Completed course providers">{issuers.map(issuer => <li key={issuer}>{issuer}</li>)}</ul>
        <ul aria-hidden="true">{issuers.map(issuer => <li key={issuer}>{issuer}</li>)}</ul>
      </div>
    </div>
  </div>;
}
