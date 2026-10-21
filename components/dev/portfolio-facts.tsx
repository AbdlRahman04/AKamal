import type { PortfolioFact } from "@/data/project-case-study";
import CountUp from "./count-up";

export default function PortfolioFacts({ facts }: { facts: PortfolioFact[] }) {
  if (!facts.length) return null;
  return <ul className="ds-portfolio-facts" aria-label="Portfolio at a glance">{facts.map(fact => <li key={fact.label}><a href={fact.href}>
    <b><CountUp value={fact.value} /></b>
    <span>{fact.label}</span><small>{fact.detail}</small>
  </a></li>)}</ul>;
}
