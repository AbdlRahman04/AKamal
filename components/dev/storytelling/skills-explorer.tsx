"use client";

import type { PointerEvent } from "react";
import { devProjects, devSkills } from "@/data/dev";

function tilt(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--skill-x", ((event.clientX - box.left) / box.width - .5) * 4 + "deg");
  event.currentTarget.style.setProperty("--skill-y", -((event.clientY - box.top) / box.height - .5) * 4 + "deg");
}
function reset(element: HTMLElement) {
  element.style.removeProperty("--skill-x"); element.style.removeProperty("--skill-y");
}

const evidence: Record<string, { slug: string; text: string }> = {
  "software-development": { slug: "smart-cafeteria-ordering-system", text: "Built menu management interfaces and connected the application to its backend." },
  "data-integration": { slug: "smart-cafeteria-ordering-system", text: "Connected application workflows with backend services and PostgreSQL." },
  "ai-machine-learning": { slug: "plant-health-monitoring-system", text: "Connected leaf-image input, model inference, and the prediction shown to the user." },
};

export default function SkillsExplorer() {
  return <div className="ds-practical-skills">{devSkills.map(skill => {
    const proof = evidence[skill.slug];
    const project = devProjects.find(item => item.slug === proof?.slug);
    return <article key={skill.slug} onPointerMove={tilt} onPointerLeave={event => reset(event.currentTarget)} onFocusCapture={event => reset(event.currentTarget)}>
      <h3>{skill.name}</h3>
      <p>{skill.description}</p>
      <ul className="ds-simple-tags" aria-label={`${skill.name} skills`}>{skill.items.map(item => <li key={item}>{item}</li>)}</ul>
      {project && proof && <div className="ds-practical-proof"><p>{proof.text}</p><a href={`#project-${project.slug}`}>See {project.title}</a></div>}
    </article>;
  })}</div>;
}
