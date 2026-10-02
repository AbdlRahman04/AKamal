"use client";

import { useId, useState, type CSSProperties, type PointerEvent } from "react";
import Image from "next/image";
import type { DevProject } from "@/data/dev";
import ProjectCaseStudyDialog from "@/components/dev/project-case-study-dialog";
import ProjectPreview, { type PreviewPhoto } from "@/components/dev/project-preview";

function ProjectArtwork({ project, previewPhotos }: { project: DevProject; previewPhotos?: PreviewPhoto[] }) {
  if (project.coverImageUrl) {
    return <Image src={project.coverImageUrl} alt={`${project.title} project preview`} fill sizes="(max-width: 820px) 100vw, 50vw" unoptimized />;
  }

  if (project.slug === "portfolio-platform" && previewPhotos?.length) {
    return <ProjectPreview kind="portfolio" photos={previewPhotos} />;
  }

  if (project.slug === "plant-health-monitoring-system") {
    return <ProjectPreview kind="plant" />;
  }

  if (project.slug === "smart-cafeteria-ordering-system") {
    return <ProjectPreview kind="dine" />;
  }

  return (
    <div className="ds-project-art ds-project-art--portfolio" aria-hidden="true">
      <div className="ds-art-window-bar"><i /><i /><i /><span>PORTFOLIO / CONTENT STUDIO</span><b>PREVIEW</b></div>
      <div className="ds-portfolio-layout">
        <div className="ds-portfolio-nav"><strong>CONTENT</strong><span className="is-current">Projects <i>03</i></span><span>Photography <i>24</i></span><span>Profile</span><b>+ New entry</b></div>
        <div className="ds-portfolio-canvas"><div className="ds-portfolio-preview"><span>SELECTED WORK / 2026</span><strong>Thoughtful<br />work, made<br /><i>to last.</i></strong><div><i /><i /><i /></div></div><div className="ds-portfolio-side"><span>PAGE SETTINGS</span><b>Projects index</b><i /><i /><i /><small>Published <em>↗</em></small></div></div>
      </div>
      <div className="ds-art-caption"><span>03</span><b>Editorial · Static · Flexible</b><span>03 / 03</span></div>
    </div>
  );
}

export default function ProjectCard({ project, delay, index, technologyLimit, previewPhotos }: { project: DevProject; delay: number; index: number; technologyLimit?: number; previewPhotos?: PreviewPhoto[] }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const facts = [
    ["Role", project.role],
    ["Team", project.teamSize ? `${project.teamSize} members` : undefined],
    ["Frontend", project.frontend],
    ["Backend", project.backend],
    ["Database", project.database],
    ["Deployment", project.deployment],
  ].filter(([, value]) => value?.trim());
  const narratives = [
    ["Problem", project.problem],
    ["Solution", project.solution],
    ["My Contribution", project.contribution],
    ["Key Feature", project.keyFeature],
    ["Technical Challenge", project.technicalChallenge],
  ].filter(([, value]) => value?.trim());
  const hasStructuredDetails = facts.length > 0 || narratives.length > 0;
  const legacyStack = project.stackBreakdown.filter((line) => line.trim());
  const legacyHighlight = project.highlights.find((line) => line.trim());
  const hasDetails = hasStructuredDetails || legacyStack.length > 0 || Boolean(legacyHighlight);
  const metadata = [project.role?.trim() ? `Role: ${project.role.trim()}` : "", project.teamSize ? `Team of ${project.teamSize}` : ""].filter(Boolean).join(" \u00b7 ");
  const visibleTechnologies = technologyLimit !== undefined && Number.isInteger(technologyLimit) && technologyLimit > 0
    ? project.technologies.slice(0, technologyLimit) : project.technologies;
  const hiddenTechnologies = project.technologies.slice(visibleTechnologies.length);
  const projectAccents = ["#4f8cff", "#8b5cf6", "#059669", "#dc2626"];
  const style = { "--project-accent": project.accent || projectAccents[index % projectAccents.length], "--reveal-delay": `${delay}ms` } as CSSProperties;
  const category = project.type.split("/")[0].trim();
  const hasCaseStudyDialog = Boolean(project.caseStudy || project.architecture);

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const offsetX = ((x / rect.width) - 0.5) * -6;
    const offsetY = ((y / rect.height) - 0.5) * -6;
    const style = event.currentTarget.style;
    style.setProperty("--pointer-x", `${x}px`);
    style.setProperty("--pointer-y", `${y}px`);
    style.setProperty("--parallax-x", `${offsetX}px`);
    style.setProperty("--parallax-y", `${offsetY}px`);
  }

  function handlePointerLeave(event: PointerEvent<HTMLElement>) {
    const style = event.currentTarget.style;
    style.setProperty("--pointer-x", "50%");
    style.setProperty("--pointer-y", "50%");
    style.setProperty("--parallax-x", "0px");
    style.setProperty("--parallax-y", "0px");
  }

  return (
    <article className={`ds-project-card${project.featured ? " is-featured" : ""}`} style={style} data-reveal onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
      <div className="ds-project-content">
        <div className="ds-project-meta"><span>{project.number} <i>/</i> {project.year}</span><span className={project.status.toLowerCase() === "completed" ? "is-complete" : "is-progress"}><i />{project.status}</span></div>
        <h3>{project.title}</h3>
        <span className="ds-project-category">{category}</span>
        <div className="ds-project-visual">
          <ProjectArtwork project={project} previewPhotos={previewPhotos} />
        </div>
        <p className="ds-project-summary">{project.summary}</p>
        {metadata && <p className="ds-project-role">{metadata}</p>}
        <div className="ds-chip-list" aria-label="Technologies used">{visibleTechnologies.map((item) => <span key={item}>{item}</span>)}{hiddenTechnologies.length > 0 && <span title={hiddenTechnologies.join(", ")}><span aria-hidden="true">+{hiddenTechnologies.length}</span><span className="ds-project-sr-only">Additional technologies: {hiddenTechnologies.join(", ")}</span></span>}</div>
        {(project.githubUrl || project.liveUrl || hasCaseStudyDialog) && <div className="ds-project-actions">
          {hasCaseStudyDialog && <ProjectCaseStudyDialog project={project} />}
          {project.githubUrl && <a className="ds-project-action ds-project-action-source" href={project.githubUrl} aria-label={project.githubUrl.startsWith("http") ? `View source for ${project.title} (opens in a new tab)` : undefined} target={project.githubUrl.startsWith("http") ? "_blank" : undefined} rel={project.githubUrl.startsWith("http") ? "noopener noreferrer" : undefined}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>View source <span aria-hidden="true">↗</span></a>}
          {project.liveUrl && <a className="ds-project-action ds-project-action-live" href={project.liveUrl} aria-label={project.liveUrl.startsWith("http") ? `Live demo for ${project.title} (opens in a new tab)` : undefined} target={project.liveUrl.startsWith("http") ? "_blank" : undefined} rel={project.liveUrl.startsWith("http") ? "noopener noreferrer" : undefined}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M14 3h7v7m-1-6-9 9"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>Live demo <span aria-hidden="true">↗</span></a>}
        </div>}
        {hasDetails && !hasCaseStudyDialog && <div className="ds-project-details">
          <button className="ds-project-toggle" type="button" aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded((value) => !value)}>
            Project details
            <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m5 7.5 5 5 5-5" /></svg>
          </button>
          <div id={detailsId} className={`ds-project-panel${expanded ? " is-expanded" : ""}`} aria-hidden={!expanded} inert={!expanded}>
            <div className="ds-project-panel-inner">
              <div className="ds-project-case-study">
                {hasStructuredDetails ? <>
                  {facts.length > 0 && <dl className="ds-project-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
                  {narratives.length > 0 && <dl className="ds-project-narratives">{narratives.map(([label, value]) => <div key={label} className={label === "My Contribution" ? "ds-project-contribution" : undefined}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
                </> : <div className="ds-project-notes">
                  {legacyStack.length > 0 && <ul aria-label="Technical breakdown">{legacyStack.map((item) => <li key={item}>{item}</li>)}</ul>}
                  {legacyHighlight && <p><b>Highlight</b>{legacyHighlight}</p>}
                </div>}
              </div>
            </div>
          </div>
        </div>}
      </div>
    </article>
  );
}
