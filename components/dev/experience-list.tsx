"use client";

import { useState } from "react";
import type { DevExperience } from "@/data/dev";

export default function ExperienceList({ items }: { items: DevExperience[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <div className="ds-experience-list">
      {items.map((item) => (
        <details
          className="ds-experience-row"
          key={item.slug}
          open={openSlug === item.slug}
          onToggle={(event) => setOpenSlug(event.currentTarget.open ? item.slug : null)}
        >
          <summary>
            <span className="ds-row-number">{item.number}</span>
            <span><b>{item.role}</b><small>{item.company}</small></span>
            <span className="ds-row-period">{item.period}{item.current && <i>Current</i>}</span>
            <span className="ds-row-toggle" aria-hidden="true">+</span>
          </summary>
          <div className="ds-experience-detail">
            <div className="ds-experience-detail-inner">
              <p>{item.summary}</p>
              <div className="ds-chip-list">{item.technologies.map((technology) => <span key={technology}>{technology}</span>)}</div>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
