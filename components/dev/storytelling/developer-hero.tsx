"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "@/components/site/public-image";
import { publicPath } from "@/components/site/public-path";
import { devExperience, devProfile, devProjects } from "@/data/dev";
import { getPortfolioFacts } from "@/data/project-case-study";
import { projectPreviews } from "@/data/project-previews";
import { useDeveloperMotion } from "./developer-motion";
import "./developer-hero.css";

const studioProjects = [
  { slug: "plant-health-monitoring-system", kind: "plant", preview: projectPreviews.plant },
  { slug: "smart-cafeteria-ordering-system", kind: "dine", preview: projectPreviews.dine },
].flatMap(entry => {
  const project = devProjects.find(project => project.slug === entry.slug);
  return project ? [{ ...entry, project }] : [];
});
const facts = getPortfolioFacts(devProjects, devExperience);

export default function DeveloperHero() {
  const { reduced } = useDeveloperMotion();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const preview = useRef<HTMLDivElement>(null);
  const animateNext = useRef(false);
  const selected = studioProjects[selectedIndex] ?? studioProjects[0];
  const isPlant = selected?.kind === "plant";
  const nameBreak = devProfile.name.lastIndexOf(" ");
  const technologies = selected?.project.technologies ?? [];
  const technology = isPlant
    ? technologies.find(item => item === "MobileNetV2") ?? technologies[0]
    : technologies.slice(0, 2).join(" + ");
  const supportingTechnologies = isPlant
    ? technologies.filter(item => ["TensorFlow", "Keras", "Flask"].includes(item))
    : technologies.slice(2, 5);

  useEffect(() => {
    if (!animateNext.current || reduced) return;
    animateNext.current = false;
    const animation = preview.current?.animate?.([{ opacity: .25 }, { opacity: 1 }], {
      duration: 220, easing: "cubic-bezier(.22,1,.36,1)",
    });
    return () => animation?.cancel();
  }, [selectedIndex, reduced]);

  function selectProject(index: number, animate = false) {
    if (index === selectedIndex) return;
    animateNext.current = animate && !reduced;
    setSelectedIndex(index);
  }

  function navigateProjects(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index + 1) % studioProjects.length
      : event.key === "ArrowLeft" ? (index - 1 + studioProjects.length) % studioProjects.length
        : event.key === "Home" ? 0 : event.key === "End" ? studioProjects.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    selectProject(next);
    tabs.current[next]?.focus();
  }

  return <section className="product-studio-hero" id="top" aria-labelledby="dev-hero-title">
    <div className={`studio-grid${selected ? "" : " is-empty"}`}>
      <div className="studio-copy">
        <p className="eyeline">{devProfile.role}</p>
        <h1 id="dev-hero-title" aria-label={devProfile.name}>
          {nameBreak > 0 ? <><span>{devProfile.name.slice(0, nameBreak)}</span><span>{devProfile.name.slice(nameBreak + 1)}.</span></> : devProfile.name}
        </h1>
        <p className="hero-specialty">{devProfile.title}{/[.!?]$/.test(devProfile.title) ? "" : "."}</p>
        <p className="lead">{devProfile.intro}</p>
        <div className="premium-actions">
          <a className="premium-btn" href="#projects">Explore my work<i aria-hidden="true">↗</i></a>
          <a className="text-action" href="#contact">Let’s talk</a>
        </div>
        <div className="quiet-meta" aria-label="Portfolio at a glance">
          {facts.map(fact => <a key={fact.label} href={fact.href}><b>{fact.value}</b> {fact.label.toLowerCase()}</a>)}
          <span>{devProfile.location}</span>
        </div>
      </div>

      {selected && <div className="studio-scene" id="studio-project-preview" role="tabpanel" aria-labelledby={`studio-tab-${selected.project.slug}`} tabIndex={0}>
        <div className="scene-grid" aria-hidden="true" />
        <div className="rear-sheet" aria-hidden="true" />
        <div className="product-window">
          <div className="product-core" ref={preview}>
            <div className="browser-rail" aria-hidden="true"><i /><i /><i /><span>{selected.preview.brand} / {isPlant ? projectPreviews.plant.heading : "Campus ordering"}</span></div>
            <div className="app-heading">
              <div className="app-logo"><b className="app-mark" aria-hidden="true">{isPlant ? "L" : "D"}</b>{selected.preview.brand}</div>
              <div className="app-nav" aria-hidden="true">{(isPlant ? projectPreviews.plant.navigation.slice(1) : projectPreviews.dine.navigation).map(label => <span key={label}>{label}</span>)}</div>
            </div>
            <div className="app-main">
              <div className="app-photo">
                <Image src={selected.preview.image} alt={isPlant ? "Tomato leaf in the illustrative LeafAI preview" : "Food featured in the illustrative AURAK Dine preview"} fill sizes="(max-width: 560px) 85vw, (max-width: 820px) 45vw, 24vw" priority={isPlant} unoptimized />
                <span className="scan-corner" aria-hidden="true" />
                <span className="image-caption">{isPlant ? `${projectPreviews.plant.subject} · sample input` : "Menu preview · sample content"}</span>
              </div>
              <div className="app-result">
                <small>{isPlant ? "Plant health analysis" : "Campus dining"}</small>
                <h2>{isPlant ? "A closer look at plant health." : "A simpler way to order."}</h2>
                <span className="sample-label">Illustrative concept</span>
                <div className="sample-score">{isPlant ? <>{projectPreviews.plant.sampleScore}<span>%</span></> : <>Dine<span>in</span></>}</div>
                {isPlant && <div className="score-bar" aria-hidden="true"><i style={{ width: `${projectPreviews.plant.sampleScore}%` }} /></div>}
                <p>{isPlant ? "Example score only, not measured model accuracy." : "Browse meals, place an order, and follow its progress."}</p>
              </div>
            </div>
            <div className="app-footer">{(isPlant ? projectPreviews.plant.features : ["Campus ordering", "Order management", "Payments"]).map(label => <span key={label}>{label}</span>)}</div>
          </div>
        </div>
        {technology && <div className="model-chip">{technology}<small>{supportingTechnologies.join(" · ")}</small></div>}
        <div className="scene-label">Selected project<a className="scene-case" href={`#project-${selected.project.slug}`}>{selected.project.title}</a>
          {selected.project.liveUrl && <a className="scene-demo" href={publicPath(selected.project.liveUrl)} target="_blank" rel="noopener noreferrer">Try {selected.preview.brand} ↗<span className="ds-project-sr-only"> (opens in a new tab)</span></a>}
        </div>
      </div>}
    </div>

    {selected && <div className="studio-workbar">
      <p className="workbar-intro"><strong>Explore the projects</strong>Switch the interface preview</p>
      <div className="workbar-tabs" role="tablist" aria-label="Project preview">
        {studioProjects.map((entry, index) => <button key={entry.project.slug} ref={element => { tabs.current[index] = element; }} id={`studio-tab-${entry.project.slug}`} className="work-tab" type="button" role="tab" aria-selected={entry.project.slug === selected.project.slug} aria-controls="studio-project-preview" tabIndex={entry.project.slug === selected.project.slug ? 0 : -1} onClick={event => selectProject(index, event.detail > 0)} onKeyDown={event => navigateProjects(event, index)}>
          <Image src={entry.preview.image} alt="" width={44} height={38} unoptimized />{entry.preview.brand}
        </button>)}
      </div>
      <span className="workbar-end">{devProfile.role}</span>
    </div>}
  </section>;
}
