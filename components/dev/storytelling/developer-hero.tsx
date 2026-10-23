"use client";

import { useEffect, useRef, useState } from "react";
import Image from "@/components/site/public-image";
import { publicPath } from "@/components/site/public-path";
import { devProfile, devProjects } from "@/data/dev";
import { projectPreviews } from "@/data/project-previews";
import { useMotionVisibility } from "../feature-motion";

const phrases = ["reliable software.", "AI applications.", "data-driven systems.", "thoughtful integrations."];
const phases = ["Photo", "Prepare", "Classify", "Review"];

function TypedIntroduction({ running }: { running: boolean }) {
  const [typing, setTyping] = useState({ phrase: 0, count: phrases[0].length, deleting: false });
  useEffect(() => {
    if (!running) return;
    const word = phrases[typing.phrase];
    const delay = typing.count === word.length && !typing.deleting ? 1800 : typing.count === 0 ? 350 : typing.deleting ? 40 : 75;
    const timer = window.setTimeout(() => setTyping(previous => {
      if (!previous.deleting && previous.count === phrases[previous.phrase].length) return { ...previous, deleting: true };
      if (previous.deleting && previous.count === 0) return { phrase: (previous.phrase + 1) % phrases.length, count: 0, deleting: false };
      return { ...previous, count: previous.count + (previous.deleting ? -1 : 1) };
    }), delay);
    return () => window.clearTimeout(timer);
  }, [running, typing]);
  return <p className="ds-typed-intro">
    <span className="ds-project-sr-only">I build reliable software, AI applications, data-driven systems, and thoughtful integrations.</span>
    <span aria-hidden="true">{"I build\u00a0"}<span>{running ? phrases[typing.phrase].slice(0, typing.count) : phrases[typing.phrase]}</span><i className="ds-typing-caret" data-running={running} /></span>
  </p>;
}

export default function DeveloperHero() {
  const root = useRef<HTMLElement>(null);
  const { visible, reduced } = useMotionVisibility(root);
  const [phase, setPhase] = useState(3);
  const running = visible && !reduced;
  const leafProject = devProjects.find(project => project.slug === "plant-health-monitoring-system");
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setPhase(previous => (previous + 1) % phases.length), phase === 3 ? 2600 : 1100);
    return () => window.clearTimeout(timer);
  }, [running, phase]);
  const displayedPhase = reduced || !visible ? 3 : phase;
  const complete = displayedPhase === 3;
  const nameBreak = devProfile.name.lastIndexOf(" ");

  return <section ref={root} className="ds-simple-hero" id="top" aria-labelledby="dev-hero-title">
    <div className="ds-simple-hero-copy">
      <p className="ds-simple-role">{devProfile.role}</p>
      <h1 id="dev-hero-title" aria-label={devProfile.name}>
        {nameBreak > 0 ? <><span className="ds-name-given">{devProfile.name.slice(0, nameBreak)}</span>{" "}<span className="ds-name-family">{devProfile.name.slice(nameBreak + 1)}.</span></> : devProfile.name}
      </h1>
      <TypedIntroduction running={running} />
      <p className="ds-simple-intro">{devProfile.intro}</p>
      <div className="ds-hero-actions">
        <a className="ds-button ds-button-primary" href="#projects">View projects</a>
        <a className="ds-button ds-button-quiet" href="#contact">Get in touch</a>
      </div>
      <p className="ds-simple-availability">{devProfile.availability}</p>
      <p className="ds-simple-location">{devProfile.location}</p>
    </div>
    <figure className="ds-simple-hero-preview">
      <div className="ds-simple-preview-heading"><strong>LeafAI</strong><span>Illustrative leaf analysis</span></div>
      <div className="ds-leaf-sample-photo">
        <Image src={projectPreviews.plant.image} alt="Tomato leaf used in the illustrative analysis" fill sizes="(max-width: 820px) 90vw, 40vw" priority unoptimized />
        <span className="ds-leaf-scan" aria-hidden="true" data-running={running} />
      </div>
      <ol className="ds-leaf-phases" aria-label="Illustrative analysis steps">{phases.map((label, index) => <li key={label} aria-current={index === displayedPhase ? "step" : undefined}>{label}</li>)}</ol>
      <div className="ds-leaf-sample-result" aria-live="off"><span>{complete ? "Tomato leaf · example result" : phases[displayedPhase] + " · sample analysis"}</span><strong>{complete ? projectPreviews.plant.sampleScore + "%" : "…"}</strong></div>
      <div className="ds-leaf-meter" aria-hidden="true"><span style={{ transform: `scaleX(${complete ? projectPreviews.plant.sampleScore / 100 : 0})` }} /></div>
      <figcaption>Illustrative only. The sample score is not measured model accuracy. Use the live demo to run the real model.</figcaption>
      <div className="ds-leaf-sample-actions">
        {leafProject?.liveUrl && <a href={publicPath(leafProject.liveUrl)} target="_blank" rel="noreferrer">Try LeafAI<span className="ds-project-sr-only"> (opens in a new tab)</span></a>}
      </div>
    </figure>
  </section>;
}
