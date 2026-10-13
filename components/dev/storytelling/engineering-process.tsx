import { devProjects } from "@/data/dev";
import { getProjectCaseStudy, getProjectStory } from "@/data/project-case-study";
import KnowledgeTabs from "./knowledge-tabs";

const stages = [
  { label: "Understand", headline: "Start with the problem.", note: "What should become easier for the person using it?", field: "problem" },
  { label: "Design", headline: "Connect the pieces.", note: "Make the path from input to outcome understandable.", field: "solution" },
  { label: "Build", headline: "Bring the idea into use.", note: "My contribution, within the work of the team.", field: "contribution" },
  { label: "Evaluate tradeoffs", headline: "Make the decisions visible.", note: "The challenges and choices behind the finished interface.", field: "technicalChallenge" },
] as const;

export default function EngineeringProcess() {
  const projects = devProjects.filter(project => getProjectStory(project));
  return <KnowledgeTabs label="Engineering process stages" labels={stages.map(stage => stage.label)} panels={stages.map((stage, index) => <div className="ds-process-panel" key={stage.label}>
    <div className="ds-process-intro"><span className="ds-process-index">0{index + 1}<span>/ 04</span></span><h3>{stage.headline}</h3><p>{stage.note}</p></div>
    <div className="ds-process-examples">{projects.map(project => {
      const study = getProjectCaseStudy(project);
      const decision = index === 3 ? study?.architecture.decisions?.find(item => item.title !== "My contribution" && item.title !== "Technical challenge") : undefined;
      return <article key={project.slug}><span className="ds-story-label">{project.title}</span><p>{project[stage.field] || project.solution}</p>{decision && <details><summary>{decision.title}</summary><p>{decision.description}</p></details>}<a className="ds-evidence-link" href={`#story-${project.slug}`}>Explore the evidence <span aria-hidden="true">↗</span></a></article>;
    })}</div>
  </div>)} />;
}
