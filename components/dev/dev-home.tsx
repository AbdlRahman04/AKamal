import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import CopyEmailButton from "@/components/dev/copy-email-button";
import CertificateGrid from "@/components/dev/certificate-grid";
import ExperienceList from "@/components/dev/experience-list";
import MotionObserver from "@/components/dev/motion-observer";
import ProjectCard from "@/components/dev/project-card";
import {
  devCertificates,
  devExperience,
  devProfile,
  devProjects,
  devSkills,
} from "@/data/dev";

function Arrow() {
  return <span aria-hidden="true">&rarr;</span>;
}

function revealStyle(delay = 0) {
  return { "--reveal-delay": `${delay}ms` } as CSSProperties;
}

function ExternalLink({ href, children, className = "ds-text-link", showArrow = true }: { href: string; children: ReactNode; className?: string; showArrow?: boolean }) {
  if (!href) return null;
  const external = href.startsWith("http");
  return <a className={className} href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>{children}{showArrow && <> <Arrow /></>}</a>;
}

function Portrait({ className = "" }: { className?: string }) {
  const initials = devProfile.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("");
  return <div className={`ds-portrait ${className}`}>{devProfile.portraitUrl ? <Image src={devProfile.portraitUrl} alt={`${devProfile.name} portrait`} width={256} height={256} unoptimized /> : <span>{initials}</span>}<i aria-hidden="true" /></div>;
}

function SectionHeading({ index, title, intro, id, variant }: { index: string; title: ReactNode; intro: string; id: string; variant?: string }) {
  return <div className={`ds-section-heading${variant ? ` ${variant}` : ""}`} data-reveal><p className="ds-index">{index}</p><div><h2 id={id}>{title}</h2><p>{intro}</p></div></div>;
}

export default function DevHome() {
  const profileSkills = devSkills.map((skill) => skill.items[0]).filter(Boolean).slice(0, 3);
  const showcasedProjects = devProjects;

  return (
    <main className="ds-site">
      <MotionObserver />
      <section className="ds-hero" id="top" aria-labelledby="dev-hero-title">
        <div className="ds-hero-grid" aria-hidden="true" />
        <div className="ds-profile-wrap" data-reveal>
          <p className="ds-presence"><svg className="ds-presence-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path className="ds-presence-waveform" d="M1 12h4.5L8 7l3.5 10 3.2-8 2.2 3H23" /><path className="ds-presence-waveform ds-presence-waveform-live" d="M1 12h4.5L8 7l3.5 10 3.2-8 2.2 3H23" /></svg> Available for opportunities <span>&middot;</span> {devProfile.location}</p>
          <article className="ds-profile-card">
            <div className="ds-profile-copy">
              <p className="ds-index">01 / Profile</p>
              <h1 id="dev-hero-title">{devProfile.name}</h1>
              <p className="ds-hero-role">{devProfile.role}</p>
              <p className="ds-lede">{devProfile.intro}</p>
              <div className="ds-profile-skills" aria-label="Key skills">{profileSkills.map((skill) => <span key={skill}>{skill}</span>)}</div>
              <div className="ds-hero-actions">
                <a className="ds-button ds-button-primary" href="#projects">View projects <Arrow /></a>
                <a className="ds-button ds-button-quiet" href="/resume.pdf" download>Download CV <span aria-hidden="true">&darr;</span></a>
              </div>
              <div className="ds-profile-links">
                <a href={`mailto:${devProfile.email}`}>Email <Arrow /></a>
                {devProfile.links.map((link) => <ExternalLink key={link.label} href={link.href} showArrow>{link.label}</ExternalLink>)}
              </div>
            </div>
            <aside className="ds-profile-aside" aria-label="Profile summary">
              <Portrait className="ds-profile-portrait" />
              <span className="ds-profile-aside-label">Based in</span>
              <strong>{devProfile.location}</strong>
              <span className="ds-profile-aside-label">Professional focus</span>
              <p>{devProfile.title}</p>
              <span className="ds-profile-availability"><i aria-hidden="true" />{devProfile.availability}</span>
            </aside>
          </article>
        </div>
      </section>

      <section className="ds-section ds-skills" id="skills" aria-labelledby="skills-title">
        <SectionHeading index="02 / Skills" id="skills-title" title="Skills for useful work." intro="Grouped technical capabilities across software development, data, and applied AI." />
        <div className="ds-skill-groups">{devSkills.map((skill, index) => <article className="ds-skill-card" key={skill.slug} data-reveal style={revealStyle(index * 65)}><span>{skill.number} / Capability</span><h3>{skill.name}</h3><p>{skill.description}</p><div className="ds-chip-list" aria-label={`${skill.name} skills`}>{skill.items.map((item) => <span key={item}>{item}</span>)}</div></article>)}</div>
      </section>

      <section className="ds-section ds-projects" id="projects" aria-labelledby="projects-title">
        <SectionHeading variant="ds-project-heading" index="03 / Projects" id="projects-title" title={<>Projects I&apos;ve <span>built.</span></>} intro="Selected application projects showing how I apply software engineering, AI, and data." />
        <div className="ds-project-grid">{showcasedProjects.map((project, index) => <ProjectCard key={project.slug} project={project} delay={index * 70} index={index} />)}</div>
      </section>

      {!!devExperience.length && <section className="ds-section ds-experience" id="experience" aria-labelledby="experience-title"><SectionHeading index="04 / Experience" id="experience-title" title="Experience in practice." intro="A concise record of teams, roles, and the work I contributed." /><div data-reveal style={revealStyle(70)}><ExperienceList items={devExperience} /></div></section>}

      {!!devCertificates.length && <section className="ds-section ds-certificates" id="learning" aria-labelledby="learning-title"><SectionHeading index="05 / Learning" id="learning-title" title="Learning with receipts." intro="Relevant credentials that support the work behind the screen." /><CertificateGrid certificates={devCertificates} /></section>}

      <section className="ds-contact" id="contact" aria-labelledby="contact-title">
        <p className="ds-index" data-reveal>06 / Contact</p>
        <div className="ds-contact-grid">
          <div data-reveal><Portrait className="ds-contact-portrait" /><h2 id="contact-title">{devProfile.contactHeading || "Let's build something useful."}</h2><p>{devProfile.contactIntro || devProfile.availability}</p></div>
          <div className="ds-contact-panel" data-reveal style={revealStyle(100)}><span>Available for</span><strong>{devProfile.availability}</strong><a className="ds-email" href={`mailto:${devProfile.email}`}>{devProfile.email}</a><CopyEmailButton email={devProfile.email} />{devProfile.phone && <a className="ds-phone" href={`tel:${devProfile.phone}`}>{devProfile.phone}</a>}<div className="ds-social-links">{devProfile.links.map((link) => <ExternalLink key={link.label} href={link.href}>{link.label}</ExternalLink>)}</div></div>
        </div>
      </section>
    </main>
  );
}
