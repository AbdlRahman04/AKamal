"use client";

import { useEffect, useRef } from "react";
import Image from "@/components/site/public-image";
import type { DevProject } from "@/data/dev";
import type { ProjectStoryModel } from "@/data/project-case-study";
import { getProjectCaseStudy } from "@/data/project-case-study";
import { projectPreviews } from "@/data/project-previews";
import ArchitectureIcon from "../architecture/architecture-icon";
import { useDeveloperMotion, motionTiming } from "./developer-motion";

export default function StoryVisual({ project, story, active, animate = true, compact = false }: { project: DevProject; story: ProjectStoryModel; active: number; animate?: boolean; compact?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const { reduced } = useDeveloperMotion();
  const study = getProjectCaseStudy(project)!;
  const ids = new Set(story.steps.flatMap(step => step.nodeIds));
  const nodes = study.architecture.nodes.filter(node => ids.has(node.id));
  const step = story.steps[active];
  const image = story.kind === "leafai" ? projectPreviews.plant.image : projectPreviews.dine.image;

  useEffect(() => {
    if (reduced || !animate || !root.current) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void import("gsap").then(({ default: gsap }) => {
      if (cancelled || !root.current) return;
      const context = gsap.context(() => {
        gsap.fromTo("[data-scene-detail]", { y: 10, opacity: 0.35 }, { y: 0, opacity: 1, duration: motionTiming.story, ease: "power3.out", clearProps: "opacity,transform" });
        gsap.fromTo(".ds-flow-node.is-active", { y: 8 }, { y: 0, duration: motionTiming.story, ease: "power3.out", clearProps: "transform" });
        gsap.fromTo("[data-scene-token]", { x: 0, opacity: 0.35 }, { x: 24, opacity: 1, duration: motionTiming.story, ease: "power3.out" });
      }, root);
      cleanup = () => context.revert();
    });
    return () => { cancelled = true; cleanup?.(); };
  }, [active, reduced, animate]);

  return <div ref={root} className={`ds-story-visual ds-story-${story.kind}${compact ? " is-compact" : ""}`} data-story-visual data-active-step={active}>
    <div className="ds-scene-top"><span>{story.kind === "leafai" ? "LeafAI / image to insight" : "AURAK Dine / order to checkout"}</span><span>Illustrative workflow</span></div>
    {!compact && <div className="ds-scene-display">
      <div className="ds-scene-photo"><Image src={image} alt={story.kind === "leafai" ? "Leaf used to illustrate the image analysis workflow" : "Menu imagery used to illustrate the ordering workflow"} width={600} height={400} unoptimized />
        {active === 4 && <div className="ds-scene-outcome" data-scene-detail>
          <ArchitectureIcon name={story.kind === "leafai" ? "results" : "database"} />
          <strong>{story.kind === "leafai" ? "Analysis summary" : "Order record"}</strong>
          <ul>{(story.kind === "leafai" ? ["Likely condition", "Alternatives", "Warnings"] : ["Payment verified", "Saved to PostgreSQL"]).map(label => <li key={label}>{label}</li>)}</ul>
        </div>}
        <span>{active === 4 ? "ILLUSTRATIVE RESULT" : story.kind === "leafai" ? "IMAGE INPUT" : "MENU INTERFACE"}</span>
      </div>
      <div className="ds-scene-detail" data-scene-detail>
        <span className="ds-scene-step">{String(active + 1).padStart(2, "0")} / 05</span>
        <h4>{step.title}</h4>
        <p>{step.description}</p>
        <div className="ds-scene-transfer" aria-hidden="true"><span>{story.kind === "leafai" ? "IMAGE" : "ORDER"}</span><div className="ds-transfer-track"><i data-scene-token><ArchitectureIcon name={story.kind === "leafai" ? "image" : "card"} /></i></div><span>{active === 4 ? "RESULT" : "SYSTEM"}</span></div>
      </div>
    </div>}
    <div className="ds-flow-map" aria-label={`${project.title} workflow components`}>
      {nodes.map(node => <div className={`ds-flow-node${step.nodeIds.includes(node.id) ? " is-active" : ""}`} key={node.id} data-node-id={node.id}>
        <ArchitectureIcon name={node.icon} /><span>{node.title}</span><small>{node.subtitle}</small>
      </div>)}
    </div>
    <div className="ds-scene-bottom"><span>{compact ? step.title : "A closer look at how the parts connect."}</span><span className="ds-scene-progress" aria-hidden="true">{story.steps.map((item, index) => <i className={index <= active ? "is-complete" : ""} key={item.id} />)}</span></div>
  </div>;
}
