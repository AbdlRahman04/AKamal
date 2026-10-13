"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { DevArchitecture } from "@/data/dev";

export default function RequestPath({ steps, description, detailed = false }: { steps: DevArchitecture["requestPath"]; description?: string; detailed?: boolean }) {
  const [selected, setSelected] = useState(0);
  const [hasSelected, setHasSelected] = useState(false);
  const initialReduceMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(initialReduceMotion);
  const active = Math.min(selected, Math.max(0, steps.length - 1));

  useEffect(() => {
    if (!detailed) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    function updatePreference() {
      setReduceMotion(preference.matches);
    }
    updatePreference();
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, [detailed]);

  function selectStep(index: number) {
    if (index === active) return;
    setHasSelected(true);
    setSelected(index);
  }

  return <section className={`av-request${detailed ? " av-request-detailed av-request-interactive" : ""}`} data-step-motion={hasSelected && reduceMotion === false ? "true" : undefined} aria-label="Request flow">
    <h3>Request flow</h3>
    {description && <p className="av-flow-description">{description}</p>}
    {detailed && steps.length > 1 && <nav className="av-flow-controls" aria-label="Workflow steps">
      <button type="button" disabled={active === 0} onClick={() => selectStep(active - 1)}>Previous</button>
      <span>Step {active + 1} of {steps.length}</span>
      <button type="button" disabled={active === steps.length - 1} onClick={() => selectStep(active + 1)}>Next</button>
    </nav>}
    <ol>{steps.map((step, index) => <li key={step.title} className={detailed && active === index ? "is-current" : undefined}>
      {detailed ? <button className="av-step-select" type="button" aria-current={active === index ? "step" : undefined} aria-label={`Step ${index + 1}: ${step.title}`} onClick={() => selectStep(index)}><span className="av-step-number" aria-hidden="true">{index + 1}</span><span className="av-step-title">{step.title}</span></button> : <span className="av-step-number">{index + 1}</span>}
      <div>{!detailed && <h4>{step.title}</h4>}<p>{step.description}</p></div>
    </li>)}</ol>
    {detailed && steps[active] && <p className="av-sr" aria-live="polite" aria-atomic="true">Step {active + 1} of {steps.length}: {steps[active].title}</p>}
  </section>;
}
