"use client";

import { useId, useRef, useState, type ReactNode, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { useDeveloperMotion, motionEase, motionTiming } from "./developer-motion";

export default function KnowledgeTabs({ labels, panels, label }: { labels: string[]; panels: ReactNode[]; label: string }) {
  const [active, setActive] = useState(0);
  const [animate, setAnimate] = useState(false);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const { reduced } = useDeveloperMotion();
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" || event.key === "ArrowDown" ? (index + 1) % labels.length : event.key === "ArrowLeft" || event.key === "ArrowUp" ? (index + labels.length - 1) % labels.length : event.key === "Home" ? 0 : event.key === "End" ? labels.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); setAnimate(false); setActive(next); buttons.current[next]?.focus();
  }
  return <div className="ds-knowledge-tabs">
    <div className="ds-knowledge-tablist" role="tablist" aria-label={label}>{labels.map((title, index) => <button key={title} ref={element => { buttons.current[index] = element; }} type="button" role="tab" id={`${id}-tab-${index}`} aria-selected={active === index} aria-controls={`${id}-panel-${index}`} tabIndex={active === index ? 0 : -1} onKeyDown={event => navigate(event, index)} onClick={event => { setAnimate(event.detail > 0); setActive(index); }}>
      {active === index && <motion.span className="ds-knowledge-highlight" aria-hidden="true" layoutId={`${id}-highlight`} transition={{ duration: reduced || !animate ? 0 : motionTiming.panel, ease: motionEase }} />}
      <span className="ds-knowledge-tab-number">{String(index + 1).padStart(2, "0")}</span><span>{title}</span><span aria-hidden="true">↗</span>
    </button>)}</div>
    {panels.map((panel, index) => <div className="ds-knowledge-panel" role="tabpanel" hidden={active !== index} key={labels[index]} id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} tabIndex={0}>
      {active === index ? <motion.div key={labels[index]} initial={animate && !reduced ? { opacity: 0.4, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced || !animate ? 0 : motionTiming.panel, ease: motionEase }}>{panel}</motion.div> : <div>{panel}</div>}
    </div>)}
    <noscript><style>{`.ds-knowledge-tabs{display:block}.ds-knowledge-tablist{display:none}.ds-knowledge-tabs .ds-knowledge-panel[hidden]{display:block}.ds-knowledge-panel{margin-bottom:36px}`}</style></noscript>
  </div>;
}
