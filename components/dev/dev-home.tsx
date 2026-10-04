import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import localFont from "next/font/local";
import CopyEmailButton from "@/components/dev/copy-email-button";
import BackgroundOverview from "@/components/dev/background-overview";
import MotionObserver from "@/components/dev/motion-observer";
import PortfolioSection from "@/components/dev/portfolio-section";
import ProjectCard from "@/components/dev/project-card";
import { primaryCollections } from "@/data/photography";
import {
  devCertificates,
  devEducation,
  devExperience,
  devProfile,
  devProjects,
  devSkills,
} from "@/data/dev";

const nameFont = localFont({
  src: "../../public/fonts/sora-latin-600.woff2",
  weight: "600",
  display: "swap",
  variable: "--font-dev-name",
});

// Small reusable helpers used by the sections below.
function Arrow() {
  return <span aria-hidden="true">&rarr;</span>;
}

// Passes a delay to the CSS reveal animation. CSSProperties lets TypeScript
// accept the custom CSS variable --reveal-delay.
function revealStyle(delay = 0) {
  return { "--reveal-delay": `${delay}ms` } as CSSProperties;
}

// Renders a normal link and opens web addresses in a new tab. Email and
// on-page links stay in the current tab.
function ExternalLink({ href, children, className = "ds-text-link", showArrow = true }: { href: string; children: ReactNode; className?: string; showArrow?: boolean }) {
  if (!href) return null;
  const external = href.startsWith("http");
  return <a className={className} href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>{children}{showArrow && !href.startsWith("mailto:") && <> <span aria-hidden="true">{external ? "↗" : "→"}</span></>}</a>;
}

// Shows the profile photo when available; otherwise shows the person's initials.
function Portrait({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  const initials = devProfile.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("");
  return <div className={`ds-portrait ${className}`}>{devProfile.portraitUrl ? <Image src={devProfile.portraitUrl} alt={`${devProfile.name} portrait`} width={256} height={256} priority={priority} unoptimized /> : <span>{initials}</span>}<i aria-hidden="true" /></div>;
}

export default function DevHome() {
  // Prepare the data used by the page. The source content and its TypeScript
  // types are in data/dev.json and data/dev.ts.
  const professionalFocus = ["Computer Vision Integration", "Python API Development", "AI Application Engineering"];
  const showcasedProjects = devProjects;
  const portfolioPhotos = primaryCollections.flatMap((collection) => collection.photos.filter((photo) => !photo.isPlaceholder && photo.src).slice(0, 2))
    .slice(0, 4).map((photo) => ({ src: photo.thumbnailSrc || photo.src, alt: photo.alt }));
  // Put completed certificates first, followed by ones still in progress.
  const completedCertificates = devCertificates.filter((certificate) => certificate.status === "completed");
  const inProgressCertificates = devCertificates.filter((certificate) => certificate.status === "in-progress");
  const allCertificates = [...completedCertificates, ...inProgressCertificates];

  return (
    <main className="ds-site">
      {/* Watches for sections entering view and enables their reveal animation. */}
      <MotionObserver />

      {/* INTRO / PROFILE: name, role, summary, key skills, CV, and profile links. */}
      {/* Styling for this section is in components/dev/dev.css (.ds-hero, .ds-profile-*). */}
      <section className="ds-hero" id="top" aria-labelledby="dev-hero-title">
        <div className="ds-bento-hero">
          <div className="ds-intro-tile" data-reveal>
              <p className="ds-bento-presence"><i aria-hidden="true" />Available for opportunities <span>/ {devProfile.location}</span></p>
              <p className="ds-index">01 / Profile</p>
              <h1 id="dev-hero-title" className={nameFont.variable}><span className="ds-profile-name">{devProfile.name}</span></h1>
              <p className="ds-hero-role">{devProfile.role}</p>
              <p className="ds-bento-statement">{devProfile.title}</p>
              <p className="ds-lede">{devProfile.intro}</p>
              <div className="ds-hero-actions">
                <a className="ds-button ds-button-primary" href="#projects">View projects <Arrow /></a>
                <a className="ds-button ds-button-quiet" href="/Abdl%20Rahman%20Kamal%20-%20resume.pdf" download>Download CV <span aria-hidden="true">&darr;</span></a>
              </div>
              <div className="ds-profile-links">
                <a href={`mailto:${devProfile.email}`}>Email</a>
                {devProfile.links.map((link) => <ExternalLink key={link.label} href={link.href} showArrow>{link.label}</ExternalLink>)}
              </div>
          </div>
          <aside className="ds-identity-tile" aria-label="Profile summary" data-reveal style={revealStyle(70)}>
              <Portrait className="ds-bento-portrait" priority />
              <div className="ds-identity-copy">
              <span className="ds-identity-label">Based in</span>
              <strong>{devProfile.location}</strong>
              <span className="ds-identity-label">Professional focus</span>
              <div className="ds-profile-skills" aria-label="Professional scope">{professionalFocus.map((focus) => <span key={focus}>{focus}</span>)}</div>
              <span className="ds-profile-availability"><i aria-hidden="true" />{devProfile.availability}</span>
              </div>
          </aside>
        </div>
      </section>

      {/* PROJECTS: each entry is rendered by ProjectCard; that component also
          handles its expandable details and project links. */}
      {/* Styling: components/dev/dev.css (.ds-project-*). */}
      <PortfolioSection headingClassName="ds-project-heading" id="projects" index="02 / Projects" title={<>Projects I&apos;ve <span>built.</span></>} intro="Selected application projects showing how I apply software engineering, AI, and data." className="ds-projects">
        <div className="ds-project-grid">{showcasedProjects.map((project, index) => <ProjectCard key={project.slug} project={project} delay={index * 70} index={index} previewPhotos={project.slug === "portfolio-platform" ? portfolioPhotos : undefined} />)}</div>
      </PortfolioSection>

      {/* EXPERIENCE: work history, credentials, and education share one section. */}
      {!!(devExperience.length || allCertificates.length || devEducation.length) && (
        <PortfolioSection id="experience" index="03 / Background" title="Experience & Education" intro="Work experience, credentials, and education that support my technical practice." className="ds-background">
          <BackgroundOverview experience={devExperience} education={devEducation} certificates={allCertificates} />
        </PortfolioSection>
      )}

      {/* SKILLS: renders one card for each skill group from data/dev.json. */}
      {/* Styling: components/dev/dev.css (.ds-skills, .ds-skill-* and .ds-chip-list). */}
      <PortfolioSection id="skills" index="04 / Technical Skills and Tools" title="Technical Skills and Tools" intro="Grouped technical capabilities across software development, data, and applied AI." className="ds-skills">
        <div className="ds-skill-groups">{devSkills.map((skill, index) => <article className="ds-skill-card" key={skill.slug} data-reveal style={revealStyle(index * 65)}><span>{skill.number} / Capability</span><h3>{skill.name}</h3><p>{skill.description}</p><div className="ds-chip-list" aria-label={`${skill.name} skills`}>{skill.items.map((item) => <span key={item}>{item}</span>)}</div></article>)}</div>
      </PortfolioSection>

      {/* CONTACT: contact details, email-copy button, phone, and social links. */}
      {/* Styling: components/dev/dev.css (.ds-contact and .ds-contact-*). */}
      <section className="ds-contact" id="contact" aria-labelledby="contact-title">
        <p className="ds-index" data-reveal>05 / Contact</p>
        <div className="ds-contact-grid">
          <div data-reveal><Portrait className="ds-contact-portrait" /><h2 id="contact-title">{devProfile.contactHeading || "Let's build something useful."}</h2><p>{devProfile.contactIntro || devProfile.availability}</p></div>
          <div className="ds-contact-panel" data-reveal style={revealStyle(100)}><span>Available for</span><strong>{devProfile.availability}</strong><a className="ds-email" href={`mailto:${devProfile.email}`}>{devProfile.email}</a><CopyEmailButton email={devProfile.email} />{devProfile.phone && <a className="ds-phone" href={`tel:${devProfile.phone}`}>{devProfile.phone}</a>}<div className="ds-social-links">{devProfile.links.map((link) => <ExternalLink key={link.label} href={link.href}>{link.label}</ExternalLink>)}</div></div>
        </div>
      </section>
    </main>
  );
}
