"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { DevProject } from "@/data/dev";
import { getProjectCaseStudy } from "@/data/project-case-study";
import ArchitectureViewer from "./architecture/architecture-viewer";
import RequestPath from "./architecture/request-path";
import "./architecture/architecture.css";

const tabs = ["Overview", "System Design", "Data Flow", "Decisions"];

export default function ProjectCaseStudyDialog({ project }: { project: DevProject }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(1);
  const [open, setOpen] = useState(false);
  const id = useId();
  const content = useMemo(() => getProjectCaseStudy(project), [project]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  if (!content) return null;
  const { architecture } = content;
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); setActive(next); tabRefs.current[next]?.focus();
  }
  return <>
    <button ref={trigger} className="ds-project-action ds-project-action-case-study" type="button" aria-haspopup="dialog" aria-controls={id} onClick={() => { setActive(1); dialog.current?.showModal(); setOpen(true); }}>Explore case study <span aria-hidden="true">↗</span></button>
    <dialog className="av-dialog" ref={dialog} id={id} aria-labelledby={`${id}-title`} onClose={() => { setOpen(false); trigger.current?.focus(); }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.current?.close();
    }}>
      <header className="av-header"><div><h2 id={`${id}-title`}>{architecture.title}</h2><p>{architecture.subtitle}</p></div><button type="button" aria-label="Close project case study" onClick={() => dialog.current?.close()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19"/></svg></button></header>
      <div className="av-tabs" role="tablist" aria-label="Case study sections">{tabs.map((label, index) => <button key={label} ref={element => { tabRefs.current[index] = element; }} type="button" role="tab" id={`${id}-tab-${index}`} aria-selected={active === index} aria-controls={`${id}-panel-${index}`} tabIndex={active === index ? 0 : -1} onKeyDown={event => navigate(event, index)} onClick={() => setActive(index)}>{label}</button>)}</div>
      {open && tabs.map((label, index) => <div key={label} className="av-panel" id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} hidden={active !== index} tabIndex={0}>
        {active === index && (index === 1 ? <>
          <ArchitectureViewer architecture={architecture}/>
          {(content.technologies.length > 0 || content.features.length > 0) && <div className="av-project-context">
            {content.technologies.length > 0 && <section className="av-tech-stack" aria-labelledby={`${id}-tech`}><h3 id={`${id}-tech`}>Tech stack</h3><ul>{content.technologies.map(technology => <li key={technology.logo}><Image className={`av-logo av-logo-${technology.logo}`} src={`/case-study/${technology.logo}.svg`} alt="" width={40} height={40}/><div><h4>{technology.title}</h4><p>{technology.description}</p></div></li>)}</ul></section>}
            {content.features.length > 0 && <section className="av-features" aria-labelledby={`${id}-features`}><h3 id={`${id}-features`}>Key features</h3><ul>{content.features.map(feature => <li key={feature}>{feature}</li>)}</ul></section>}
          </div>}
        </> : index === 2 ? <RequestPath steps={architecture.requestPath} description={content.flowDescription} detailed/> : <section className="av-prose"><h3>{index === 0 ? "Project overview" : "Engineering decisions"}</h3>{index === 0 && <p>{project.summary}</p>}<dl>{(index === 0 ? content.overview : architecture.decisions).map(item => <div key={item.title}><dt>{item.title}</dt><dd>{item.description}</dd></div>)}</dl></section>)}
      </div>)}
    </dialog>
  </>;
}
