"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import type { DevProject } from "@/data/dev";
import type { ProjectStoryModel } from "@/data/project-case-study";
import { publicPath } from "@/components/site/public-path";
import ProjectCaseStudyDialog from "../project-case-study-dialog";
import StoryVisual from "./story-visual";
import { useDeveloperMotion } from "./developer-motion";

const desktopQuery = "(min-width: 1024px) and (min-height: 700px)";
function subscribeDesktop(listener: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
const getDesktop = () => window.matchMedia(desktopQuery).matches;
const getServerDesktop = () => false;

export default function ProjectStory({ project, story, nextAnchor }: { project: DevProject; story: ProjectStoryModel; nextAnchor: string }) {
  const root = useRef<HTMLElement>(null);
  const steps = useRef<(HTMLElement | null)[]>([]);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const manualUntil = useRef(0);
  const [active, setActive] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const { reduced } = useDeveloperMotion();
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktop, getServerDesktop);
  const cinematic = isDesktop && !reduced;
  const anchor = `story-${story.projectSlug}`;

  useEffect(() => {
    if (!cinematic || !root.current) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ default: gsap }, { ScrollTrigger }]) => {
      if (cancelled || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add(desktopQuery, () => {
        steps.current.forEach((element, index) => {
          if (!element) return;
          ScrollTrigger.create({ trigger: element, start: "top center", end: "bottom center", onToggle: self => {
            if (!self.isActive || performance.now() < manualUntil.current) return;
            setAnimate(true);
            setActive(previous => previous === index ? previous : index);
          } });
        });
      }, root);
      const interrupt = () => { manualUntil.current = 0; };
      window.addEventListener("wheel", interrupt, { passive: true });
      window.addEventListener("touchstart", interrupt, { passive: true });
      cleanup = () => { media.revert(); window.removeEventListener("wheel", interrupt); window.removeEventListener("touchstart", interrupt); };
    });
    return () => { cancelled = true; cleanup?.(); };
  }, [cinematic]);

  function select(index: number, shouldAnimate: boolean) {
    const next = Math.max(0, Math.min(story.steps.length - 1, index));
    setAnimate(shouldAnimate);
    setActive(next);
    setAnnouncement(`Step ${next + 1} of ${story.steps.length}: ${story.steps[next].title}`);
    if (cinematic) {
      manualUntil.current = performance.now() + 850;
      steps.current[next]?.scrollIntoView({ behavior: shouldAnimate ? "smooth" : "instant", block: "center" });
    }
  }
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index + 1) % story.steps.length : event.key === "ArrowLeft" ? (index + story.steps.length - 1) % story.steps.length : event.key === "Home" ? 0 : event.key === "End" ? story.steps.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); select(next, false); buttons.current[next]?.focus({ preventScroll: true });
  }

  return <article className={`ds-project-story ds-project-story-${story.kind}`} id={anchor} ref={root} data-cinematic={cinematic ? "true" : "false"} aria-labelledby={`${anchor}-title`}>
    <header className="ds-story-heading">
      <div className="ds-story-meta"><span>{project.number} / {project.year}</span><span>{project.type}</span><span>{project.status}</span></div>
      <h3 id={`${anchor}-title`}>{project.title}</h3>
      <div className="ds-story-introduction"><p>{project.summary}</p><div><span className="ds-story-label">My part / {project.teamSize ? `Team of ${project.teamSize}` : project.role}</span><p>{project.contribution || project.role}</p></div></div>
      <div className="ds-story-actions">
        <ProjectCaseStudyDialog project={project} initialTab="Data Flow" triggerLabel="Explore the full case study" />
        {project.githubUrl && <a href={publicPath(project.githubUrl)} target="_blank" rel="noreferrer">View source <span aria-hidden="true">↗</span></a>}
        {project.liveUrl && <a href={publicPath(project.liveUrl)} target="_blank" rel="noreferrer">Live demo <span aria-hidden="true">↗</span></a>}
        <a className="ds-story-skip" href={nextAnchor}>Skip walkthrough <span aria-hidden="true">↓</span></a>
      </div>
    </header>
    <div className="ds-story-layout">
      <div className="ds-story-stage">
        <StoryVisual project={project} story={story} active={active} animate={animate} />
        <div className="ds-story-stage-controls">
          <nav aria-label={`${project.title} steps`} className="ds-story-step-nav">{story.steps.map((step, index) => <button ref={element => { buttons.current[index] = element; }} key={step.id} type="button" aria-label={`Step ${index + 1}: ${step.title}`} aria-current={active === index ? "step" : undefined} tabIndex={active === index ? 0 : -1} onClick={event => select(index, event.detail > 0)} onKeyDown={event => navigate(event, index)}>{String(index + 1).padStart(2, "0")}</button>)}</nav>
          <div className="ds-story-sequence"><button type="button" disabled={active === 0} onClick={event => select(active - 1, event.detail > 0)}>Previous</button><span>{active + 1} / {story.steps.length}</span><button type="button" disabled={active === story.steps.length - 1} onClick={event => select(active + 1, event.detail > 0)}>Next</button></div>
        </div>
      </div>
      <ol className="ds-story-copy">{story.steps.map((step, index) => <li ref={element => { steps.current[index] = element; }} id={`${anchor}-${step.id}`} key={step.id} className={active === index ? "is-current" : ""}>
        <span className="ds-story-step-number">{String(index + 1).padStart(2, "0")} / THE WORKFLOW</span><h4>{step.title}</h4><p>{step.description}</p><button type="button" onClick={event => select(index, event.detail > 0)} aria-pressed={active === index}>Show this step <span aria-hidden="true">↗</span></button>
      </li>)}</ol>
    </div>
    <p className="ds-story-footnote">A guided illustration of the project. Source code and the full case study provide the implementation detail.</p>
    <span className="ds-sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>
  </article>;
}
