import type { CSSProperties } from "react";
import Image from "@/components/site/public-image";
import ContactForm from "@/components/site/contact-form";
import BackgroundOverview from "./background-overview";
import MotionObserver from "./motion-observer";
import PortfolioSection from "./portfolio-section";
import ProjectCard from "./project-card";
import DeveloperMotionProvider from "./storytelling/developer-motion";
import DeveloperHero from "./storytelling/developer-hero";
import ProjectStory from "./storytelling/project-story";
import SkillsExplorer from "./storytelling/skills-explorer";
import EngineeringProcess from "./storytelling/engineering-process";
import { getProjectStory } from "@/data/project-case-study";
import { primaryCollections } from "@/data/photography";
import { devCertificates, devEducation, devExperience, devProfile, devProjects, devSkills } from "@/data/dev";
import "./storytelling/storytelling.css";

export default function DevHome() {
  const portfolioPhotos = primaryCollections.flatMap(collection => collection.photos.filter(photo => !photo.isPlaceholder && photo.src).slice(0, 2))
    .slice(0, 4).map(photo => ({ src: photo.thumbnailSrc || photo.src, alt: photo.alt }));
  const allCertificates = [...devCertificates.filter(item => item.status === "completed"), ...devCertificates.filter(item => item.status === "in-progress")];
  const stories = devProjects.map(project => ({ project, story: getProjectStory(project) }));
  const hasStories = stories.some(item => item.story);

  return <main className="ds-site ds-cinematic">
    <DeveloperMotionProvider>
      <MotionObserver />
      <DeveloperHero />
      <PortfolioSection id="projects" index="02 / Selected work" title={<>The interface.<br /><span>The thinking behind it.</span></>} intro="Explore the work, then follow the path from an input to an outcome." className="ds-cinematic-projects">
        {stories.map(({ project, story }, index) => story
          ? <ProjectStory key={project.slug} project={project} story={story} nextAnchor={index + 1 < stories.length ? stories[index + 1].story ? `#story-${stories[index + 1].project.slug}` : `#project-${stories[index + 1].project.slug}` : "#experience"} />
          : <div id={`project-${project.slug}`} className="ds-retained-project" key={project.slug}><ProjectCard project={project} delay={0} index={index} previewPhotos={project.slug === "portfolio-platform" ? portfolioPhotos : undefined} /></div>)}
      </PortfolioSection>
      {!!(devExperience.length || allCertificates.length || devEducation.length) && <PortfolioSection id="experience" index="03 / Background" title="Experience & Education" intro="Work experience, credentials, and education that support my technical practice." className="ds-background">
        <BackgroundOverview experience={devExperience} education={devEducation} certificates={allCertificates} />
      </PortfolioSection>}
      {!!devSkills.length && <PortfolioSection id="skills" index="04 / The capabilities" title={<>What I work with.<br /><span>And where it shows.</span></>} intro="Tools and techniques, connected to the work they make possible." className="ds-skills">
        <SkillsExplorer />
      </PortfolioSection>}
      {hasStories && <PortfolioSection id="process" index="05 / Behind the decisions" title="How I approach a project" intro="A closer look at the problems, contributions, and tradeoffs in these projects." className="ds-process"><EngineeringProcess /></PortfolioSection>}
      <section className="ds-contact portfolio-contact" id="contact" aria-labelledby="contact-title">
        <p className="ds-index" data-reveal>06 / Contact</p>
        <div className="ds-contact-grid">
          <div data-reveal>{devProfile.portraitUrl && <Image className="ds-cinematic-contact-portrait" src={devProfile.portraitUrl} alt={`${devProfile.name} portrait`} width={64} height={64} unoptimized />}<h2 id="contact-title">{devProfile.contactHeading || "Let's build something useful."}</h2><p>{devProfile.contactIntro || devProfile.availability}</p></div>
          <div className="ds-contact-form-reveal" data-reveal style={{ "--reveal-delay": "70ms" } as CSSProperties}><ContactForm source="dev" /></div>
        </div>
      </section>
    </DeveloperMotionProvider>
  </main>;
}
