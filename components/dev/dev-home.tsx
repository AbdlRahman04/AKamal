import localFont from "next/font/local";
import Image from "@/components/site/public-image";
import ContactForm from "@/components/site/contact-form";
import { publicPath } from "@/components/site/public-path";
import BackgroundOverview from "./background-overview";
import PortfolioSection from "./portfolio-section";
import ProjectCard from "./project-card";
import ProjectExplorer from "./project-explorer";
import PortfolioFacts from "./portfolio-facts";
import NetworkBackdrop from "./network-backdrop";
import CredentialHighlights from "./credential-highlights";
import MotionObserver from "./motion-observer";
import { getPortfolioFacts, getProjectStory } from "@/data/project-case-study";
import DeveloperMotionProvider from "./storytelling/developer-motion";
import DeveloperHero from "./storytelling/developer-hero";
import SkillsExplorer from "./storytelling/skills-explorer";
import { primaryCollections } from "@/data/photography";
import { devCertificates, devEducation, devExperience, devProfile, devProjects, devSkills } from "@/data/dev";
import "./portfolio.css";
import "./portfolio-features.css";
import "./motion.css";

const displayFont = localFont({ src: "../../public/fonts/sora-latin-600.woff2", weight: "600", display: "swap", variable: "--font-dev-display" });
const nameFont = localFont({ src: "../../public/fonts/bricolage-grotesque-700.ttf", weight: "700", display: "swap", variable: "--font-dev-name" });

export default function DevHome() {
  const portfolioPhotos = primaryCollections.flatMap(collection => collection.photos.filter(photo => !photo.isPlaceholder && photo.src).slice(0, 2))
    .slice(0, 4).map(photo => ({ src: photo.thumbnailSrc || photo.src, alt: photo.alt }));
  const certificates = [...devCertificates.filter(item => item.status === "completed"), ...devCertificates.filter(item => item.status === "in-progress")];
  const otherProjects = devProjects.filter(project => !getProjectStory(project));

  return <main id="main-content" tabIndex={-1} className={`ds-site ds-simple ${displayFont.variable} ${nameFont.variable}`}>
    <DeveloperMotionProvider>
      <MotionObserver />
      <NetworkBackdrop />
      <DeveloperHero />
      <PortfolioFacts facts={getPortfolioFacts(devProjects, devExperience)} />
      {!!devProjects.length && <PortfolioSection id="projects" title="Selected projects" intro="Choose a project to explore the work, my contribution, and how it runs.">
        <span id="process" className="ds-anchor" aria-hidden="true" />
        <ProjectExplorer projects={devProjects} />
        {!!otherProjects.length && <div className="ds-selected-projects">{otherProjects.map(project => <div id={`project-${project.slug}`} className="ds-project-anchor" key={project.slug}>
          <span id={`story-${project.slug}`} className="ds-anchor" aria-hidden="true" />
          <ProjectCard project={project} previewPhotos={project.slug === "portfolio-platform" ? portfolioPhotos : undefined} />
        </div>)}</div>}
      </PortfolioSection>}
      {!!(devExperience.length || devEducation.length) && <PortfolioSection id="experience" title="Experience & education" intro="Practical experience in AI, data analysis, and security, supported by a Computer Science degree.">
        <BackgroundOverview experience={devExperience} education={devEducation} certificates={[]} />
      </PortfolioSection>}
      {!!devSkills.length && <PortfolioSection id="skills" title="Skills in practice" intro="The tools I use, connected to the work they support.">
        <SkillsExplorer />
      </PortfolioSection>}
      {!!certificates.length && <PortfolioSection id="certifications" title="Certifications & learning" intro="Continued learning across software, data, AI, and photography.">
        <CredentialHighlights certificates={certificates} />
        <BackgroundOverview experience={[]} education={[]} certificates={certificates} />
      </PortfolioSection>}
      <section className="ds-contact portfolio-contact" id="contact" aria-labelledby="contact-title">
        <div className="ds-contact-grid">
          <div className="ds-contact-copy">
            {devProfile.portraitUrl && <Image className="ds-contact-portrait" src={devProfile.portraitUrl} alt={`${devProfile.name} portrait`} width={64} height={64} unoptimized />}
            <h2 id="contact-title">{devProfile.contactHeading || "Let's build something useful."}</h2>
            <p>{devProfile.contactIntro || devProfile.availability}</p>
            <div className="ds-contact-links">{devProfile.links.map(link => <a key={link.label} href={publicPath(link.href)} target="_blank" rel="noreferrer">Connect on {link.label}</a>)}</div>
          </div>
          <ContactForm source="dev" />
        </div>
      </section>
    </DeveloperMotionProvider>
  </main>;
}
