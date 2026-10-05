"use client";

import Image from "@/components/site/public-image";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { DevProject } from "@/data/dev";
import { getProjectCaseStudy } from "@/data/project-case-study";
import ArchitectureViewer from "./architecture/architecture-viewer";
import RequestPath from "./architecture/request-path";
import "./architecture/architecture.css";

const tabs = ["Overview", "System Design", "Data Flow", "Decisions"];
const panelTransition = { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const };

export default function ProjectCaseStudyDialog({ project }: { project: DevProject }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(1);
  const [open, setOpen] = useState(false);
  const [animateActivePanel, setAnimateActivePanel] = useState(false);
  const reduceMotion = useReducedMotion();
  const id = useId();
  const content = useMemo(() => getProjectCaseStudy(project), [project]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  useEffect(() => () => { if (closeTimer.current !== null) window.clearTimeout(closeTimer.current); }, []);
  if (!content) return null;
  const { architecture } = content;
  const shouldAnimatePanel = animateActivePanel && reduceMotion === false;
  function selectTab(index: number, animate: boolean) {
    setActive(index);
    setAnimateActivePanel(animate);
  }
  function openDialog(event: ReactMouseEvent<HTMLButtonElement>) {
    const element = dialog.current;
    if (!element) return;
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
    const source = event.currentTarget.closest(".ds-project-card")?.getBoundingClientRect();
    const narrow = window.matchMedia("(max-width: 767px)").matches;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const dialogWidth = narrow ? viewportWidth - 16 : Math.min(1320, viewportWidth - 64);
    const dialogHeight = narrow ? viewportHeight - 16 : Math.min(780, viewportHeight - 64);
    if (source) {
      const scale = Math.max(.72, Math.min(source.width / dialogWidth, source.height / dialogHeight, 1));
      element.style.setProperty("--av-origin-x", `${source.left + source.width / 2 - viewportWidth / 2}px`);
      element.style.setProperty("--av-origin-y", `${source.top + source.height / 2 - viewportHeight / 2}px`);
      element.style.setProperty("--av-origin-scale", `${scale}`);
    }
    const animate = event.detail > 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animate) element.dataset.motion = "true";
    else element.removeAttribute("data-motion");
    setActive(1);
    setAnimateActivePanel(false);
    element.showModal();
    setOpen(true);
  }
  function closeDialog(animate: boolean) {
    const element = dialog.current;
    if (!element?.open) return;
    if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) element.dataset.motion = "true";
    else element.removeAttribute("data-motion");
    element.close();
  }
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "Enter" || event.key === " ") setAnimateActivePanel(false);
    const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); selectTab(next, false); tabRefs.current[next]?.focus();
  }
  return <>
    <button ref={trigger} className="ds-project-action ds-project-action-case-study" type="button" aria-haspopup="dialog" aria-controls={id} onClick={openDialog}>Explore case study <span aria-hidden="true">↗</span></button>
    <dialog className="av-dialog" ref={dialog} id={id} aria-labelledby={`${id}-title`} onClose={() => {
      if (dialog.current?.open) return;
      trigger.current?.focus();
      if (dialog.current?.dataset.motion === "true") {
        if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => {
          setOpen(false);
          setAnimateActivePanel(false);
          closeTimer.current = null;
        }, 300);
        return;
      }
      setOpen(false);
      setAnimateActivePanel(false);
    }} onCancel={event => { event.currentTarget.removeAttribute("data-motion"); }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(event.detail > 0);
    }}>
      <header className="av-header"><div><h2 id={`${id}-title`}>{architecture.title}</h2><p>{architecture.subtitle}</p></div><button type="button" aria-label="Close project case study" onClick={event => closeDialog(event.detail > 0)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19"/></svg></button></header>
      <div className="av-tabs av-motion-tabs" role="tablist" aria-label="Case study sections">{tabs.map((label, index) => <button key={label} ref={element => { tabRefs.current[index] = element; }} type="button" role="tab" id={`${id}-tab-${index}`} aria-selected={active === index} aria-controls={`${id}-panel-${index}`} tabIndex={active === index ? 0 : -1} onKeyDown={event => navigate(event, index)} onClick={event => selectTab(index, event.detail > 0)}>
        {open && active === index && <motion.span className="av-tab-highlight" aria-hidden="true" layoutId={`${id}-active-tab`} transition={shouldAnimatePanel ? { duration: 0.24, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }} />}
        <span className="av-tab-label">{label}</span>
      </button>)}</div>
      {open && tabs.map((label, index) => <div key={label} className="av-panel" id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} hidden={active !== index} tabIndex={0}>
        {active === index && <motion.div key={label} initial={shouldAnimatePanel ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={shouldAnimatePanel ? panelTransition : { duration: 0 }}>
          {index === 1 ? <>
          <ArchitectureViewer architecture={architecture}/>
          {(content.technologies.length > 0 || content.features.length > 0) && <div className="av-project-context">
            {content.technologies.length > 0 && <section className="av-tech-stack" aria-labelledby={`${id}-tech`}><h3 id={`${id}-tech`}>Tech stack</h3><ul>{content.technologies.map(technology => <li key={technology.logo}><Image className={`av-logo av-logo-${technology.logo}`} src={`/case-study/${technology.logo}.svg`} alt="" width={40} height={40}/><div><h4>{technology.title}</h4><p>{technology.description}</p></div></li>)}</ul></section>}
            {content.features.length > 0 && <section className="av-features" aria-labelledby={`${id}-features`}><h3 id={`${id}-features`}>Key features</h3><ul>{content.features.map(feature => <li key={feature}>{feature}</li>)}</ul></section>}
          </div>}
          </> : index === 2 ? <RequestPath steps={architecture.requestPath} description={content.flowDescription} detailed/> : <section className="av-prose"><h3>{index === 0 ? "Project overview" : "Engineering decisions"}</h3>{index === 0 && <p>{project.summary}</p>}<dl>{(index === 0 ? content.overview : architecture.decisions).map(item => <div key={item.title}><dt>{item.title}</dt><dd>{item.description}</dd></div>)}</dl></section>}
        </motion.div>}
      </div>)}
    </dialog>
  </>;
}
