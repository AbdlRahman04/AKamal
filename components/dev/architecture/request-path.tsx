import type { DevArchitecture } from "@/data/dev";

export default function RequestPath({ steps, description, detailed = false }: { steps: DevArchitecture["requestPath"]; description?: string; detailed?: boolean }) {
  return <section className={`av-request${detailed ? " av-request-detailed" : ""}`} aria-label="Request flow"><h3>Request flow</h3>{description && <p className="av-flow-description">{description}</p>}<ol>{steps.map((step, index) => <li key={step.title}><span className="av-step-number">{index + 1}</span><div><h4>{step.title}</h4><p>{step.description}</p></div></li>)}</ol></section>;
}
