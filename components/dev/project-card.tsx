"use client";

import Image from "@/components/site/public-image";
import { publicPath } from "@/components/site/public-path";
import type { DevProject } from "@/data/dev";
import { getProjectModelCoverage } from "@/data/project-case-study";
import ProjectCaseStudyDialog from "./project-case-study-dialog";
import ProjectPreview, { type PreviewPhoto } from "./project-preview";
import CountUp from "./count-up";

export function ProjectModelCoverage({ project }: { project: DevProject }) {
  const coverage = getProjectModelCoverage(project);
  if (!coverage) return null;
  return <p className="ds-project-model-coverage">Model coverage: <strong><CountUp value={coverage.classes} /> plant-health classes</strong> across <strong><CountUp value={coverage.species} /> species</strong>.</p>;
}

export function ProjectArtwork({ project, previewPhotos }: { project: DevProject; previewPhotos?: PreviewPhoto[] }) {
  if (project.coverImageUrl) {
    return <Image src={project.coverImageUrl} alt={`${project.title} project preview`} fill sizes="(max-width: 820px) 100vw, 45vw" unoptimized />;
  }
  if (project.slug === "portfolio-platform" && previewPhotos?.length) return <ProjectPreview kind="portfolio" photos={previewPhotos} />;
  if (project.slug === "plant-health-monitoring-system") return <ProjectPreview kind="plant" />;
  if (project.slug === "smart-cafeteria-ordering-system") return <ProjectPreview kind="dine" />;
  return <div className="ds-simple-project-fallback"><strong>{project.title}</strong><span>{project.type}</span></div>;
}

export default function ProjectCard({ project, previewPhotos }: { project: DevProject; previewPhotos?: PreviewPhoto[] }) {
  const isPhotography = project.slug === "portfolio-platform";
  const hasCaseStudy = Boolean(project.caseStudy || project.architecture);

  return <article className="ds-project-card ds-simple-project">
    <div className="ds-project-visual"><ProjectArtwork project={project} previewPhotos={previewPhotos} /></div>
    <div className="ds-project-content">
      <div className="ds-project-meta"><span>{project.year} · {project.type}</span>{hasCaseStudy && <span>{project.status}</span>}</div>
      <h3>{project.title}</h3>
      <p className="ds-project-summary">{project.summary}</p>
      {hasCaseStudy && <>
        {(project.role || project.teamSize) && <p className="ds-project-role">{project.role}{project.role && project.teamSize ? " · " : ""}{project.teamSize ? <>Team of <CountUp value={project.teamSize} /></> : ""}</p>}
        <ProjectModelCoverage project={project} />
        {project.contribution && <div className="ds-project-personal"><h4>My contribution</h4><p>{project.contribution}</p></div>}
        {project.highlights.length > 0 && <div className="ds-project-outcomes"><h4>{isPhotography ? "Collection highlights" : "Project accomplishments"}</h4><ul>{project.highlights.map(item => <li key={item}>{item}</li>)}</ul></div>}
        <ul className="ds-simple-tags" aria-label={isPhotography ? "Photography skills" : "Technologies used"}>{project.technologies.map(item => <li key={item}>{item}</li>)}</ul>
      </>}
      <div className="ds-project-actions">
        {hasCaseStudy && <ProjectCaseStudyDialog project={project} initialTab="Overview" triggerLabel="Explore case study" />}
        {project.liveUrl && <a className="ds-project-action ds-project-action-live" href={publicPath(project.liveUrl)} target={project.liveUrl.startsWith("http") ? "_blank" : undefined} rel={project.liveUrl.startsWith("http") ? "noopener noreferrer" : undefined}>{isPhotography ? "View photography" : "Live demo"}{project.liveUrl.startsWith("http") && <span className="ds-project-sr-only"> (opens in a new tab)</span>}</a>}
        {project.githubUrl && <a className="ds-project-action" href={publicPath(project.githubUrl)} target={project.githubUrl.startsWith("http") ? "_blank" : undefined} rel={project.githubUrl.startsWith("http") ? "noopener noreferrer" : undefined}>View source{project.githubUrl.startsWith("http") && <span className="ds-project-sr-only"> (opens in a new tab)</span>}</a>}
      </div>
    </div>
  </article>;
}
