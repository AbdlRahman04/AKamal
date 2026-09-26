"use client";

import { useState, type CSSProperties } from "react";
import { devProfile, devSkills } from "@/data/dev";

const buildSkill = devSkills.find((skill) => skill.slug === "build");
const technologies = (buildSkill?.items ?? devSkills.flatMap((skill) => skill.items)).slice(0, 5);

function TechnologyIcon({ technology }: { technology: string }) {
  const common = { className: "ds-tech-icon", "aria-hidden": true as const, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (technology) {
    case "Python":
      return <svg {...common}><path d="M12 3.5c-4.6 0-4.8 2.2-4.8 4.1v2.1h5.1v1.2H5.8C3.8 10.9 3 12.3 3 15s1.1 4.5 3.2 4.5h2v-2.3c0-2.1 1.7-3.7 3.8-3.7h4.1c1.8 0 3-1.2 3-3V6.8c0-2-1.7-3.3-3.9-3.3H12Z" /><path d="M12 20.5c4.6 0 4.8-2.2 4.8-4.1v-2.1h-5.1v-1.2h6.5c2 0 2.8-1.4 2.8-4.1s-1.1-4.5-3.2-4.5h-2v2.3c0 2.1-1.7 3.7-3.8 3.7H7.9c-1.8 0-3 1.2-3 3v3.7c0 2 1.7 3.3 3.9 3.3H12Z" /><circle cx="9.5" cy="6.8" r=".7" fill="currentColor" stroke="none" /><circle cx="14.5" cy="17.2" r=".7" fill="currentColor" stroke="none" /></svg>;
    case "Java":
      return <svg {...common}><path d="M8 14.5h8l-.8 4.1H8.8L8 14.5Z" /><path d="M7 20h10M9 12c-1.3-1.3 1.3-1.6 0-3m3 3c-1.3-1.3 1.3-1.6 0-3m3 3c-1.3-1.3 1.3-1.6 0-3" /><path d="M17 15.5c1.4.1 2.2.6 2.2 1.2 0 .9-2.7 1.6-6 1.6" /></svg>;
    case "React":
      return <svg {...common}><ellipse cx="12" cy="12" rx="9.5" ry="3.7" /><ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(120 12 12)" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></svg>;
    case "Node.js":
      return <svg {...common}><path d="m12 2.8 8 4.6v9.2l-8 4.6-8-4.6V7.4l8-4.6Z" /><path d="M9.2 15.4V9.1l5.6 6.3V9.1" /></svg>;
    case "Flask":
      return <svg {...common}><path d="M9 3.5h6M10 3.5v6L5.2 18a1.7 1.7 0 0 0 1.5 2.5h10.6a1.7 1.7 0 0 0 1.5-2.5L14 9.5v-6" /><path d="M7.2 16h9.6M9.2 13h5.6" /></svg>;
    default:
      return null;
  }
}

export default function HeroCodeCard() {
  const [activeTechnology, setActiveTechnology] = useState(technologies[0] ?? "Software");

  return (
    <div className="ds-hero-visual" data-reveal style={{ "--reveal-delay": "90ms" } as CSSProperties}>
      <div className="ds-code-window">
        <div className="ds-code-header"><svg className="ds-code-file-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M7 4H4.5v12H7M13 4h2.5v12H13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg><span>profile.ts</span><span className="ds-code-header-state">LIVE PROFILE</span></div>
        <div className="ds-code-lines" aria-label="Profile code sample">
          <div className="ds-code-line"><span>1</span><code><b>const</b> profile = &#123;</code></div>
          <div className="ds-code-line"><span>2</span><code>name: <i>&quot;{devProfile.name}&quot;</i>,</code></div>
          <div className="ds-code-line"><span>3</span><code>role: <i>&quot;{devProfile.role}&quot;</i>,</code></div>
          <div className={`ds-code-line${technologies.includes(activeTechnology) ? " is-active" : ""}`} aria-live="polite"><span>4</span><code>stack: [<i>{activeTechnology}</i>],</code></div>
          <div className="ds-code-line"><span>5</span><code>focus: <i>&quot;AI + Data&quot;</i>,</code></div>
          <div className="ds-code-line"><span>6</span><code>status: <i>&quot;Open to opportunities&quot;</i>,</code></div>
          <div className="ds-code-line"><span>7</span><code>&#125;</code></div>
          <div className="ds-code-line ds-code-cursor"><span>8</span><code><i aria-hidden="true" /></code></div>
        </div>
      </div>
      <div className="ds-tech-orbit" role="group" aria-label="Select a technology to highlight it in the code sample">
        {technologies.map((technology, index) => (
          <button
            className={`ds-tech-tag ds-tech-tag-${index + 1}${activeTechnology === technology ? " is-active" : ""}`}
            type="button"
            key={technology}
            aria-pressed={activeTechnology === technology}
            onMouseEnter={() => setActiveTechnology(technology)}
            onFocus={() => setActiveTechnology(technology)}
            onClick={() => setActiveTechnology(technology)}
          >
            <TechnologyIcon technology={technology} />{technology}
          </button>
        ))}
      </div>
    </div>
  );
}
