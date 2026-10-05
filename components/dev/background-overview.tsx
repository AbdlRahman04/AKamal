"use client";

import Image from "@/components/site/public-image";
import { publicPath } from "@/components/site/public-path";
import { useEffect, useId, useRef, useState } from "react";
import type { DevCertificate, DevEducation, DevExperience } from "@/data/dev";

type Selection =
  | { kind: "Experience"; item: DevExperience }
  | { kind: "Education"; item: DevEducation }
  | { kind: "Certification"; item: DevCertificate };

function CategoryIcon({ kind }: { kind: Selection["kind"] }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "Experience" ? <><rect x="4" y="7" width="16" height="14" rx="1" /><path d="M9 7V3h6v4M9 7v14M15 7v14" /></> : kind === "Education" ? <><path d="m2 9 10-5 10 5-10 5L2 9ZM6 11v6c4 3 8 3 12 0v-6M22 9v8" /></> : <><circle cx="12" cy="8" r="5" /><path d="m9 12-1 9 4-3 4 3-1-9" /></>}
  </svg>;
}

function CertificateCollection({ certificates, dialogId, headingId, onOpen }: {
  certificates: DevCertificate[];
  dialogId: string;
  headingId: string;
  onOpen: (selection: Selection, button: HTMLButtonElement) => void;
}) {
  return <div className="ds-background-certificates" aria-labelledby={headingId}>
    <ul className="ds-background-certificate-grid">
      {certificates.map(item => <li key={item.slug}>
        <button type="button" className="ds-background-card ds-background-certificate-card" aria-haspopup="dialog" aria-controls={dialogId} onClick={event => onOpen({ kind: "Certification", item }, event.currentTarget)}>
          <CategoryIcon kind="Certification" />
          <span className="ds-background-card-copy"><strong>{item.name}</strong><span>{item.issuer} &middot; {item.status === "completed" ? item.year : "In progress"}</span></span>
        </button>
      </li>)}
    </ul>
  </div>;
}

export default function BackgroundOverview({ experience, education, certificates }: {
  experience: DevExperience[];
  education: DevEducation[];
  certificates: DevCertificate[];
}) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const id = useId();

  const isOpen = selection !== null;
  const slides: Selection[] = selection?.kind === "Experience" ? experience.map(item => ({ kind: "Experience", item }))
    : selection?.kind === "Education" ? education.map(item => ({ kind: "Education", item }))
    : certificates.map(item => ({ kind: "Certification", item }));
  const activeIndex = slides.findIndex(slide => slide.item.slug === selection?.item.slug);

  function navigate(index: number) {
    if (!slides.length) return;
    setSelection(slides[(index + slides.length) % slides.length]);
    const body = dialog.current?.querySelector(".ds-background-dialog-body");
    body?.scrollTo({ top: 0, behavior: "instant" });
  }

  useEffect(() => {
    if (!isOpen) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);

  function open(next: Selection, button: HTMLButtonElement) {
    trigger.current = button;
    setSelection(next);
  }

  const title = selection?.kind === "Experience" ? selection.item.role : selection?.kind === "Education" ? selection.item.degree : selection?.item.name;
  const organization = selection?.kind === "Experience" ? selection.item.company : selection?.kind === "Education" ? selection.item.institution : selection?.item.issuer;
  const period = selection?.kind === "Certification" ? selection.item.year : selection?.item.period;
  const description = selection?.kind === "Experience" ? selection.item.summary : selection?.item.description;
  const image = selection && selection.kind !== "Experience" ? selection.item.imageUrl : undefined;
  const tags = selection?.kind === "Experience" ? selection.item.technologies : selection?.kind === "Education" ? selection.item.focus : [];
  const credential = selection?.kind === "Certification" ? selection.item.credentialUrl : "";

  return <>
    <div className={`ds-background-grid${experience.length ? "" : " ds-background-grid-single"}`}>
      {experience.length > 0 && <div className="ds-background-group" aria-labelledby={`${id}-experience`}>
        <h3 id={`${id}-experience`}><CategoryIcon kind="Experience" />Experience</h3>
        <ul className="ds-background-cards">{experience.map(item => <li key={item.slug}>
          <button type="button" className="ds-background-card" aria-haspopup="dialog" aria-controls={id} onClick={event => open({ kind: "Experience", item }, event.currentTarget)}>
            <span className="ds-background-card-copy"><strong>{item.role}</strong><span>{item.company}</span></span>
            <span className="ds-background-period">{item.period}</span>
          </button>
        </li>)}</ul>
      </div>}
      <div id="learning" className="ds-background-learning">
        {education.length > 0 && <div className="ds-background-group" aria-labelledby={`${id}-education`}>
          <h3 id={`${id}-education`}><CategoryIcon kind="Education" />Education</h3>
          <ul className="ds-background-cards">{education.map(item => <li key={item.slug}>
            <button type="button" className="ds-background-card ds-background-education-card" aria-haspopup="dialog" aria-controls={id} onClick={event => open({ kind: "Education", item }, event.currentTarget)}>
              <span className="ds-background-card-copy"><strong>{item.degree}</strong><span>{item.institution}</span><span className="ds-background-period">{item.period}</span></span>
            </button>
          </li>)}</ul>
        </div>}
        {certificates.length > 0 && <div className="ds-background-group" aria-labelledby={`${id}-certificates`}>
          <h3 id={`${id}-certificates`}><CategoryIcon kind="Certification" />Certifications</h3>
          <CertificateCollection certificates={certificates} dialogId={id} headingId={`${id}-certificates`} onOpen={open} />
        </div>}
      </div>
    </div>
    <dialog ref={dialog} id={id} className="ds-background-dialog" aria-labelledby={`${id}-title`} onKeyDown={event => {
      if (slides.length < 2 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      navigate(event.key === "Home" ? 0 : event.key === "End" ? slides.length - 1 : activeIndex + (event.key === "ArrowRight" ? 1 : -1));
    }} onClose={() => {
      setSelection(null);
      trigger.current?.focus();
    }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.current?.close();
    }}>
      {selection && <>
        <header className="ds-background-dialog-header">
          <div><p>{selection.kind}</p><h2 id={`${id}-title`}>{title}</h2></div>
          <button type="button" className="ds-background-dialog-dismiss" aria-label="Close details" autoFocus onClick={() => dialog.current?.close()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
        </header>
        <div className="ds-background-dialog-body" id={`${id}-slide`} tabIndex={0} role="group" aria-roledescription="slide" aria-label={`${activeIndex + 1} of ${slides.length}: ${title}`}>
          <div className="ds-background-dialog-meta"><p>{organization}</p><span>{period}</span>
            {selection.kind === "Experience" && selection.item.current && <span className="ds-background-status">Current role</span>}
            {selection.kind === "Certification" && <span className="ds-background-status">{selection.item.status === "completed" ? "Completed" : "In progress"}</span>}
          </div>
          {image && <Image className="ds-background-detail-image" src={image} alt={selection.kind === "Certification" ? `${title} certificate` : `${title} at ${organization}`} width={960} height={740} unoptimized loading="eager" />}
          {description && <p className="ds-background-description">{description}</p>}
          {tags.length > 0 && <section className="ds-background-detail-tags"><h3>{selection.kind === "Experience" ? "Technologies & skills" : "Areas of study"}</h3><ul>{tags.map(tag => <li key={tag}>{tag}</li>)}</ul></section>}
        </div>
        <div className="ds-background-dialog-controls">
          {slides.length > 1 && <nav className="ds-background-dialog-carousel" aria-label={`${selection.kind} carousel`}>
            <button type="button" className="ds-background-dialog-arrow" aria-label={`Previous ${selection.kind.toLowerCase()}`} aria-controls={`${id}-slide`} onClick={() => navigate(activeIndex - 1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg></button>
            <span className="ds-background-carousel-position" aria-live="polite" aria-atomic="true">{activeIndex + 1} / {slides.length}</span>
            <button type="button" className="ds-background-dialog-arrow" aria-label={`Next ${selection.kind.toLowerCase()}`} aria-controls={`${id}-slide`} onClick={() => navigate(activeIndex + 1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg></button>
            <div className="ds-background-dialog-dots">{slides.map((slide, index) => <button key={slide.item.slug} type="button" aria-label={`Show ${slide.kind.toLowerCase()} ${index + 1}`} aria-current={index === activeIndex ? "step" : undefined} aria-controls={`${id}-slide`} onClick={() => navigate(index)}><span /></button>)}</div>
          </nav>}
          <footer className="ds-background-dialog-footer">
            {credential && <a href={publicPath(credential)} {...(credential.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>Verify credential <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg></a>}
            <button type="button" onClick={() => dialog.current?.close()}>Close</button>
          </footer>
        </div>
      </>}
    </dialog>
  </>;
}
