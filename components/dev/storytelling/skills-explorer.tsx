import { devProjects, devSkills } from "@/data/dev";
import { getProjectStory } from "@/data/project-case-study";
import KnowledgeTabs from "./knowledge-tabs";
import StoryVisual from "./story-visual";

const evidence: Record<string, { slug: string; stage: number; heading: string; text: string }> = {
  "software-development": { slug: "smart-cafeteria-ordering-system", stage: 2, heading: "Interfaces connected to a real system.", text: "React, a Node.js API, and a shared ordering workflow." },
  "data-integration": { slug: "smart-cafeteria-ordering-system", stage: 4, heading: "The connections behind the interface.", text: "The API, payment provider, and PostgreSQL database in AURAK Dine." },
  "ai-machine-learning": { slug: "plant-health-monitoring-system", stage: 2, heading: "From a trained model to a usable application.", text: "Image preprocessing and MobileNetV2 inference inside the LeafAI API." },
};

export default function SkillsExplorer() {
  return <KnowledgeTabs label="Technical capabilities" labels={devSkills.map(skill => skill.name)} panels={devSkills.map(skill => {
    const proof = evidence[skill.slug];
    const project = devProjects.find(item => item.slug === proof?.slug);
    const story = project ? getProjectStory(project) : null;
    return <div className="ds-skills-explorer-panel" key={skill.slug}>
      <div><span className="ds-story-label">The capability</span><h3>{skill.name}</h3><p>{skill.description}</p><ul className="ds-capability-list" aria-label={`${skill.name} skills`}>{skill.items.map(item => <li key={item}>{item}</li>)}</ul></div>
      {project && story && proof && <div className="ds-skill-proof"><span className="ds-story-label">In practice / {project.title}</span><h4>{proof.heading}</h4><p>{proof.text}</p><StoryVisual project={project} story={story} active={proof.stage} compact animate={false} /><p className="ds-skill-contribution">{project.contribution}</p><a className="ds-evidence-link" href={`#story-${project.slug}`}>Explore the project story <span aria-hidden="true">↗</span></a></div>}
    </div>;
  })} />;
}
