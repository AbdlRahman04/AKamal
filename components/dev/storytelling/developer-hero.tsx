import localFont from "next/font/local";
import Image from "@/components/site/public-image";
import { publicPath } from "@/components/site/public-path";
import { devProfile } from "@/data/dev";
import ProjectPreview from "../project-preview";
import HeroMotion from "./hero-motion";

const nameFont = localFont({ src: "../../../public/fonts/sora-latin-600.woff2", weight: "600", display: "swap", variable: "--font-dev-name" });

export default function DeveloperHero() {
  return <HeroMotion>
    <div className="ds-hero-eyebrow" data-hero-enter><span>01 / A curious mind, building useful things</span><span>{devProfile.location}</span></div>
    <h1 id="dev-hero-title" className={`ds-cinematic-name ${nameFont.variable}`} data-hero-enter>{devProfile.name}<span className="ds-name-period">.</span></h1>
    <div className="ds-hero-composition">
      <div className="ds-hero-editorial-copy" data-hero-enter>
        <p className="ds-cinematic-role">{devProfile.role}</p>
        <h2>{devProfile.title}</h2>
        <p className="ds-hero-description">{devProfile.intro}</p>
        <div className="ds-hero-actions"><a className="ds-button ds-button-primary" href="#projects">View projects <span aria-hidden="true">↗</span></a><a className="ds-button ds-button-quiet" href="#contact">Get in touch <span aria-hidden="true">→</span></a></div>
        <div className="ds-hero-person">
          {devProfile.portraitUrl && <Image src={devProfile.portraitUrl} alt={`${devProfile.name} portrait`} width={64} height={64} priority unoptimized />}
          <div><span>{devProfile.availability}</span><div className="ds-hero-profile-links">{devProfile.links.map(link => <a key={link.label} href={publicPath(link.href)} target="_blank" rel="noreferrer">{link.label} <span aria-hidden="true">↗</span></a>)}</div></div>
        </div>
      </div>
      <div className="ds-hero-collage" data-hero-enter>
        <svg className="ds-hero-signals" viewBox="0 0 600 480" fill="none" aria-hidden="true" focusable="false">
          <path className="ds-hero-signal-track" d="M22 218V58H554V410H330" />
          <path className="ds-hero-signal-track" d="M82 442H576V108H370" />
          <g className="ds-hero-signal ds-hero-signal-one"><circle r="4" /><circle r="10" className="ds-hero-signal-ring" /></g>
          <g className="ds-hero-signal ds-hero-signal-two"><circle r="3" /><circle r="8" className="ds-hero-signal-ring" /></g>
          <g className="ds-hero-signal-mark"><path d="M18 42V54M12 48H24M566 430V442M560 436H572" /></g>
        </svg>
        <div className="ds-hero-preview-layer ds-hero-preview-leaf" data-hero-layer><div className="ds-hero-preview-paper"><ProjectPreview kind="plant" priority /><span className="ds-hero-paper-caption">01 / Computer vision, brought to the screen.</span></div></div>
        <div className="ds-hero-preview-layer ds-hero-preview-dine" data-hero-layer><div className="ds-hero-preview-paper"><ProjectPreview kind="dine" /><span className="ds-hero-paper-caption">02 / A connected ordering experience.</span></div></div>
        <span className="ds-hero-collage-note">Ideas become interfaces.<br />Explore the decisions underneath.</span>
      </div>
    </div>
    <div className="ds-hero-bottom"><a href="#projects">Scroll into the work <span aria-hidden="true">↓</span></a><span>Software / Data / AI</span></div>
  </HeroMotion>;
}
