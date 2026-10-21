"use client";

import { type CSSProperties, type KeyboardEvent, type SyntheticEvent, useId, useRef, useState } from "react";
import Image from "@/components/site/public-image";
import { collections, toolkit, type Collection } from "@/data/photography";

type Props = {
  openExamples: (collection: Collection, opener: HTMLButtonElement, animate: boolean) => void;
  blockPhotoAction: (event: SyntheticEvent<HTMLElement>) => void;
};

export default function PhotographyApproach({ openExamples, blockPhotoAction }: Props) {
  const [active, setActive] = useState<number | null>(0);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const examples = toolkit.map(item => {
    const photos = collections.flatMap(collection => collection.photos).filter(photo =>
      !photo.isPlaceholder && photo.src && photo.tags.some(tag => item.techniques.includes(tag)));
    return {
      slug: `approach-${item.number}`, title: item.title, theme: item.description,
      intro: item.detail, skillsDemonstrated: item.techniques.join(" · "),
      coverImage: photos[0]?.src ?? "", section: "primary" as const, photos,
    };
  });

  const selectPrinciple = (index: number) => {
    setActive(index);
    buttons.current[index]?.focus({ preventScroll: true });
    buttons.current[index]?.scrollIntoView({
      block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const targets: Record<string, number> = {
      ArrowDown: Math.min(index + 1, toolkit.length - 1), ArrowUp: Math.max(index - 1, 0),
      Home: 0, End: toolkit.length - 1,
    };
    if (targets[event.key] === undefined) return;
    event.preventDefault();
    buttons.current[targets[event.key]]?.focus();
  };

  return <section className="toolkit-section" id="approach" aria-labelledby="approach-title">
    <div className="toolkit-title reveal" data-reveal>
      <p className="eyebrow">03 / Approach</p>
      <h2 id="approach-title"><span className="approach-heading-line">The craft</span>{" "}<span className="approach-heading-line">behind <em>the frame.</em></span></h2>
      <ol className="approach-rail" aria-label="Approach principles">
        {toolkit.map((item, index) => <li key={item.number}>
          <button type="button" aria-current={active === index ? "step" : undefined}
            aria-controls={`${id}-panel-${index}`} onClick={() => selectPrinciple(index)}>
            <span>{item.number}</span>{item.title}
          </button>
        </li>)}
      </ol>
      <p className="approach-hint">Open a principle to explore the method.<br />Use ↑ and ↓ to move between headings.</p>
    </div>
    <div className="toolkit-list">
      {toolkit.map((item, index) => {
        const isOpen = active === index;
        const collection = examples[index];
        const preview = collection.photos[0];
        return <article className="approach-item" data-reveal style={{ "--reveal-delay": `${index * 60}ms` } as CSSProperties}
          data-open={isOpen ? "true" : undefined} key={item.number}>
          <h3><button type="button" className="approach-trigger" id={`${id}-trigger-${index}`}
            ref={node => { buttons.current[index] = node; }}
            aria-expanded={isOpen} aria-controls={`${id}-panel-${index}`}
            onClick={() => setActive(isOpen ? null : index)} onKeyDown={event => handleKeyDown(event, index)}>
            <span className="approach-number">{item.number}</span><span>{item.title}</span>
            <svg className="approach-toggle" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h14" /><path className="approach-toggle-stem" d="M10 3v14" /></svg>
          </button></h3>
          <p className="approach-summary">{item.description}</p>
          <div className="approach-panel" id={`${id}-panel-${index}`} role="region"
            aria-labelledby={`${id}-trigger-${index}`} hidden={!isOpen}>
            {preview && <figure className={`approach-demo approach-demo-${item.demo}`}
              onContextMenu={blockPhotoAction} onDragStart={blockPhotoAction}>
              {item.demo === "storytelling" ? <div className="approach-sequence">
                {collection.photos.slice(0, 3).map(photo => <div key={photo.id}>
                  <Image src={photo.thumbnailSrc} alt={photo.alt} fill sizes="(max-width: 700px) 28vw, 10vw" draggable={false} />
                </div>)}
              </div> : <>
                <Image src={preview.thumbnailSrc} alt={preview.alt} fill sizes="(max-width: 700px) 90vw, 36vw" draggable={false} />
                {item.demo === "composition" && <svg className="approach-overlay" viewBox="0 0 100 75" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M33.33 0v75M66.67 0v75M0 25h100M0 50h100" /><circle cx="66.67" cy="25" r="2" />
                </svg>}
                {item.demo === "motion" && <svg className="approach-overlay" viewBox="0 0 100 75" aria-hidden="true">
                  <path d="M30 30v-8h8M62 22h8v8M70 48v8h-8M38 56h-8v-8" />
                </svg>}
                {item.demo === "grading" && <><Image className="approach-muted-preview" src={preview.thumbnailSrc} alt="" fill sizes="(max-width: 700px) 90vw, 36vw" draggable={false} /><span className="approach-grade-label">Muted</span><span className="approach-grade-label approach-grade-label-right">Finished</span></>}
              </>}
              <figcaption>{item.previewLabel}</figcaption>
            </figure>}
            <div className="approach-explanation">
              <p>{item.detail}</p>
              <ul className="approach-techniques" aria-label="Methods">{item.techniques.map(tag => <li key={tag}>{tag}</li>)}</ul>
              <div className="approach-actions">
                {collection.photos.length > 0 && <button type="button" className="text-link"
                  onClick={event => openExamples(collection, event.currentTarget, event.detail > 0)}>See it in the work <span aria-hidden="true">→</span></button>}
                <button type="button" className="text-link" onClick={() => selectPrinciple((index + 1) % toolkit.length)}>
                  Next: {toolkit[(index + 1) % toolkit.length].title} <span aria-hidden="true">↓</span>
                </button>
              </div>
            </div>
          </div>
        </article>;
      })}
    </div>
  </section>;
}
