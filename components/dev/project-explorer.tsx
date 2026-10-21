"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { DevProject } from "@/data/dev";
import { getProjectCaseStudy, getProjectStory } from "@/data/project-case-study";
import { useMotionVisibility } from "./feature-motion";
import { publicPath } from "@/components/site/public-path";
import ProjectCaseStudyDialog from "./project-case-study-dialog";
import { ProjectArtwork, ProjectModelCoverage } from "./project-card";
import CountUp from "./count-up";
import { useScrollSteps } from "./storytelling/use-scroll-steps";

const STEP_TIME = 4500;
const INTERACTION_PAUSE = 3000;

export default function ProjectExplorer({ projects }: { projects: DevProject[] }) {
  const entries = useMemo(() => projects.flatMap(project => {
    const story = getProjectStory(project);
    const study = getProjectCaseStudy(project);
    const order = story ? [...new Set(story.steps.flatMap(step => step.nodeIds))] : [];
    return story && study ? [{ project, story, nodes: order.flatMap(nodeId => {
      const node = study.architecture.nodes.find(item => item.id === nodeId);
      return node ? [node] : [];
    }) }] : [];
  }), [projects]);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const { visible, reduced } = useMotionVisibility(root);
  const [selected, setSelected] = useState(0);
  const [step, setStep] = useState(0);
  const [lastInteraction, setLastInteraction] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const active = entries[selected];
  const running = visible && !reduced && !lastInteraction && !transcriptOpen;
  const pauseScrollSync = useScrollSteps(root, `[data-project-index="${selected}"] [data-scroll-step]`, index => {
    setStep(index);
    setLastInteraction(0);
  }, enhanced && transcriptOpen);

  useEffect(() => {
    setEnhanced(true);
    let frame = 0;
    function revealLinkedProject() {
      const anchor = window.location.hash.slice(1);
      const index = entries.findIndex(({ project }) => anchor === `project-${project.slug}` || anchor === `story-${project.slug}`);
      if (index < 0) return;
      setSelected(index); setStep(0); setLastInteraction(0);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ block: "start", behavior: "instant" }));
    }
    revealLinkedProject();
    window.addEventListener("hashchange", revealLinkedProject);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", revealLinkedProject); };
  }, [entries]);

  useEffect(() => {
    if (!visible || reduced || !active || transcriptOpen) return;
    const delay = lastInteraction ? Math.max(0, lastInteraction + INTERACTION_PAUSE - Date.now()) : STEP_TIME;
    const timer = window.setTimeout(() => {
      setStep(previous => (previous + 1) % active.story.steps.length);
      setLastInteraction(0);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [visible, reduced, step, active, lastInteraction, transcriptOpen]);

  function selectProject(index: number, focus = false) {
    setSelected(index); setStep(0); setLastInteraction(Date.now()); setTranscriptOpen(false);
    window.history.replaceState(window.history.state, "", `#project-${entries[index].project.slug}`);
    if (focus) tabs.current[index]?.focus();
  }
  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index + 1) % entries.length
      : event.key === "ArrowLeft" ? (index - 1 + entries.length) % entries.length
      : event.key === "Home" ? 0 : event.key === "End" ? entries.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); selectProject(next, true);
  }
  function selectStep(index: number) {
    pauseScrollSync();
    setLastInteraction(Date.now());
    setStep((index + active.story.steps.length) % active.story.steps.length);
  }
  if (!active) return null;

  return <div ref={root} className="ds-project-explorer" data-enhanced={enhanced}>
    <div className="ds-explorer-tabs" role="tablist" aria-label="Selected projects" hidden={!enhanced}>{entries.map(({ project, story }, index) => <button
      key={project.slug} ref={element => { tabs.current[index] = element; }} type="button" role="tab"
      id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1}
      onClick={() => selectProject(index)} onKeyDown={event => navigateTabs(event, index)}
    >{story.kind === "leafai" ? "LeafAI" : "AURAK Dine"}</button>)}</div>
    <div className="ds-explorer-panels">
      {entries.map(({ project, story, nodes }, index) => {
        const current = story.steps[index === selected ? step : 0];
        return <div key={project.slug} id={`${id}-panel-${index}`} data-project-index={index} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} hidden={enhanced && selected !== index} tabIndex={0}>
          <article className="ds-explorer-card" id={`project-${project.slug}`}>
            <span className="ds-anchor" id={`story-${project.slug}`} aria-hidden="true" />
            <div className="ds-explorer-layout">
              <div className="ds-explorer-artwork"><ProjectArtwork project={project} /></div>
              <div className="ds-explorer-project">
                <div className="ds-explorer-meta"><span>{project.year}{project.teamSize ? <> · Team of <CountUp value={project.teamSize} /></> : ""}</span><span>{project.status}</span></div>
                <h3>{project.title}</h3><p>{project.summary}</p>
                <ProjectModelCoverage project={project} />
                <div className="ds-project-actions">
                  <ProjectCaseStudyDialog project={project} initialTab="Overview" triggerLabel="Explore case study" />
                  {project.liveUrl && <a className="ds-project-action ds-project-action-live" href={publicPath(project.liveUrl)} target={project.liveUrl.startsWith("http") ? "_blank" : undefined} rel={project.liveUrl.startsWith("http") ? "noopener noreferrer" : undefined}>Live demo{project.liveUrl.startsWith("http") && <span className="ds-project-sr-only"> (opens in a new tab)</span>}</a>}
                  {project.githubUrl && <a className="ds-project-action" href={publicPath(project.githubUrl)} target={project.githubUrl.startsWith("http") ? "_blank" : undefined} rel={project.githubUrl.startsWith("http") ? "noopener noreferrer" : undefined}>View source{project.githubUrl.startsWith("http") && <span className="ds-project-sr-only"> (opens in a new tab)</span>}</a>}
                </div>
                {project.contribution && <div className="ds-explorer-contribution"><h4>My contribution</h4><p>{project.contribution}</p></div>}
                <ul className="ds-simple-tags" aria-label="Technologies used">{project.technologies.map(technology => <li key={technology}>{technology}</li>)}</ul>
              </div>
            </div>
            <div className="ds-explorer-stage">
              <ol className="ds-explorer-flow" aria-label="Components in this request">{nodes.map(node => <li key={node.id} data-active={current.nodeIds.includes(node.id)}>{node.title}</li>)}</ol>
              <div className="ds-explorer-step-row">
                <div className="ds-explorer-step" aria-live={lastInteraction || reduced ? "polite" : "off"} aria-atomic="true"><p>Step {(index === selected ? step : 0) + 1} of {story.steps.length}</p><h4>{current.title}</h4><p>{current.description}</p></div>
                <div className="ds-explorer-controls" hidden={!enhanced}>
                <button type="button" aria-label="Previous walkthrough step" onClick={() => selectStep(step - 1)}>←</button>
                <div className="ds-explorer-dots" aria-label="Choose a walkthrough step">{story.steps.map((item, position) => <button type="button" key={item.id} aria-label={`Go to step ${position + 1}: ${item.title}`} aria-current={step === position ? "step" : undefined} onClick={() => selectStep(position)}>
                  <span aria-hidden="true" />{index === selected && step === position && running && <i key={`${selected}-${step}`} aria-hidden="true" style={{ animationDuration: `${STEP_TIME}ms` }} />}
                </button>)}</div>
                <button type="button" aria-label="Next walkthrough step" onClick={() => selectStep(step + 1)}>→</button>
                </div>
              </div>
              <details className="ds-explorer-transcript" open={enhanced ? transcriptOpen && selected === index : undefined} onToggle={event => { if (selected === index) setTranscriptOpen(event.currentTarget.open); }}><summary>Steps & project highlights</summary><ol>{story.steps.map((item, position) => <li key={item.id} data-scroll-step={position} className={selected === index && step === position ? "is-current" : undefined}><strong>{item.title}</strong><p>{item.description}</p></li>)}</ol>
                {project.highlights.length > 0 && <><h4>Project accomplishments</h4><ul>{project.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul></>}
              </details>
            </div>
          </article>
        </div>;
      })}
    </div>
    <noscript><p>Both projects are shown above. Expand “Steps & project highlights” to read their full workflows.</p></noscript>
  </div>;
}
