"use client";

import Image from "next/image";
import { type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type SyntheticEvent, type TouchEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  primaryCollections,
  archiveCollections,
  collections,
  hero,
  profile,
  toolkit,
  type Collection,
  type HeroImage,
  type Photo,
} from "@/data/photography";

type SelectedPhoto = { collection: Collection; photo: Photo; index: number };

function resolveHeroImage(image: HeroImage): HeroImage {
  if (!image.collectionSlug || !image.photoId) return image;

  const collection = collections.find((item) => item.slug === image.collectionSlug);
  const photo = collection?.photos.find((item) => item.id === image.photoId);
  if (!photo || photo.isPlaceholder || !photo.src) return image;

  return {
    ...image,
    src: photo.src,
    alt: photo.alt || image.alt,
  };
}

function resolveHeroPhotoTarget(image: HeroImage): SelectedPhoto | null {
  if (!image.collectionSlug || !image.photoId) return null;
  const collection = collections.find((item) => item.slug === image.collectionSlug);
  if (!collection) return null;
  const index = collection.photos.findIndex((item) => item.id === image.photoId);
  if (index < 0) return null;
  const photo = collection.photos[index];
  if (photo.isPlaceholder || !photo.src) return null;
  return { collection, photo, index };
}

const fallbackHero = {
  eyebrow: "Visual journal / UAE",
  title: "The world,",
  titleAccent: "through my lens.",
  description: profile.intro,
  primaryCta: "Explore selected work",
  secondaryCta: "About the photographer",
  yearLabel: "2024-2026",
  locationLabel: "United Arab Emirates",
  images: [],
};

function Arrow({ direction }: { direction: "left" | "right" }) {
  return <span aria-hidden="true">{direction === "left" ? "\u2190" : "\u2192"}</span>;
}

const TAG_SEP = " \u00B7 ";

const blockPhotoAction = (event: SyntheticEvent<HTMLElement>) => {
  event.preventDefault();
};

/* Shared collection renderer used by both primary and archive sections */
function CollectionCard({
  collection,
  collectionIndex,
  openViewer,
  isArchive,
  isFocused,
  startProject,
}: {
  collection: Collection;
  collectionIndex: number;
  openViewer: (c: Collection, p: Photo, i: number, el: HTMLButtonElement) => void;
  isArchive?: boolean;
  isFocused?: boolean;
  startProject?: (collection: Collection) => void;
}) {
  const rankedPhotos = collection.photos
    .filter((photo) => photo.featuredRank)
    .sort((a, b) => (a.featuredRank ?? 99) - (b.featuredRank ?? 99));
  const featuredPhotos = (rankedPhotos.length > 0 ? rankedPhotos : collection.photos.slice(0, 3)).slice(0, 3);
  const featuredIds = new Set(featuredPhotos.map((photo) => photo.id));

  return (
    <article
      className={`collection reveal${isArchive ? " archive-collection" : ""}${isFocused ? " focused-collection" : ""}`}
      key={collection.slug}
      id={collection.slug}
      data-reveal
      style={{ "--reveal-delay": `${Math.min(collectionIndex, 3) * 70}ms` } as CSSProperties}
    >
        <div className="collection-header">
          <div>
            <p className="collection-count">Collection {String(collectionIndex + 1).padStart(2, "0")}</p>
            <h3>{collection.title}</h3>
          </div>
          <p className="collection-theme">{collection.theme}</p>
          {isFocused && (
            <button className="project-cta" type="button" onClick={() => startProject?.(collection)}>
              Start a project <Arrow direction="right" />
            </button>
          )}
        </div>
      <div className={`photo-grid feature-count-${featuredPhotos.length}`}>
        {collection.photos.map((photo, index) => (
          <button
            className={[
              "photo-card reveal",
              featuredIds.has(photo.id) ? `photo-feature photo-feature-${featuredPhotos.findIndex((item) => item.id === photo.id) + 1}` : "photo-compact",
              photo.aspectRatio && "photo-has-ratio",
              photo.orientation && `photo-orient-${photo.orientation}`,
            ].filter(Boolean).join(" ")}
            key={photo.id}
            onClick={(event) => openViewer(collection, photo, index, event.currentTarget)}
            onContextMenu={blockPhotoAction}
            onDragStart={blockPhotoAction}
            aria-label={`View ${photo.title}: ${photo.story}`}
            data-reveal
            style={{
              "--reveal-delay": `${Math.min(index, 4) * 55}ms`,
              ...(photo.aspectRatio && !featuredIds.has(photo.id) && { aspectRatio: photo.aspectRatio }),
              ...(photo.focalPoint && {
                "--photo-position": `${photo.focalPoint.x}% ${photo.focalPoint.y}%`,
              }),
            } as CSSProperties}
          >
            {photo.isPlaceholder ? (
              <div className={`placeholder placeholder-${(collectionIndex % 3) + 1}`} aria-hidden="true">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>Replace with<br />your photograph</p>
              </div>
            ) : (
              <Image
                src={photo.thumbnailSrc}
                alt={photo.alt}
                fill
                draggable={false}
                loading="lazy"
                sizes={featuredIds.has(photo.id)
                  ? "(max-width: 900px) 100vw, 58vw"
                  : "(max-width: 560px) 50vw, (max-width: 900px) 33vw, 25vw"}
              />
            )}
            <span className="card-shade" aria-hidden="true" />
            <span className="photo-meta"><strong>{photo.title}</strong><small>{photo.tags.slice(0, 2).join(TAG_SEP)}</small></span>
            <span className="view-mark" aria-hidden="true">{"\u2197"}</span>
          </button>
        ))}
      </div>
      <div className="collection-footer">
        <p>{collection.intro}</p>
        <p><span>Process</span>{collection.skillsDemonstrated}</p>
      </div>
    </article>
  );
}

export default function PhotographyHome() {
  const visiblePrimaryCollections = primaryCollections.filter((collection) => collection.photos.length > 0);
  const visibleArchiveCollections = archiveCollections.filter((collection) => collection.photos.length > 0);
  const heroContent = hero ?? fallbackHero;
  const heroImages = heroContent.images.map(resolveHeroImage);
  const [selected, setSelected] = useState<SelectedPhoto | null>(null);
  const [viewerDirection, setViewerDirection] = useState<"next" | "previous">("next");
  const [selectedProject, setSelectedProject] = useState<Collection | null>(null);
  const [revealReady, setRevealReady] = useState(false);
  const [activeWorkSlug, setActiveWorkSlug] = useState(visiblePrimaryCollections[0]?.slug ?? "");
  const openerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const projectCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const viewerHistoryEntry = useRef(false);
  const projectHistoryEntry = useRef(false);

  const closeViewer = useCallback(() => {
    if (viewerHistoryEntry.current) {
      window.history.back();
      return;
    }
    setSelected(null);
    window.setTimeout(() => openerRef.current?.focus(), 0);
  }, []);

  const closeProject = useCallback(() => {
    if (projectHistoryEntry.current) {
      window.history.back();
      return;
    }
    setSelectedProject(null);
    window.setTimeout(() => projectCloseButtonRef.current?.blur(), 0);
  }, []);

  const movePhoto = useCallback((step: number) => {
    if (!selected) return;
    const photos = selected.collection.photos;
    const nextIndex = (selected.index + step + photos.length) % photos.length;
    setViewerDirection(step > 0 ? "next" : "previous");
    setSelected({ collection: selected.collection, photo: photos[nextIndex], index: nextIndex });
  }, [selected]);

  const handleViewerTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }, []);

  const handleViewerTouchEnd = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0]?.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    movePhoto(delta > 0 ? -1 : 1);
  }, [movePhoto]);

  useEffect(() => {
    if (!selected) return;

    const photos = selected.collection.photos;
    [-1, 1].forEach((step) => {
      const photo = photos[(selected.index + step + photos.length) % photos.length];
      if (photo?.isPlaceholder) return;
      const image = new window.Image();
      image.src = photo.src;
    });
  }, [selected]);

  useEffect(() => {
    if (!selectedProject) return;
    const onPopState = () => {
      if (!projectHistoryEntry.current || window.history.state?.photographyProject) return;
      projectHistoryEntry.current = false;
      setSelectedProject(null);
      window.setTimeout(() => projectCloseButtonRef.current?.blur(), 0);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [selectedProject]);

  useEffect(() => {
    if (!selected) return;
    const onPopState = () => {
      if (!viewerHistoryEntry.current) return;
      viewerHistoryEntry.current = false;
      setSelected(null);
      window.setTimeout(() => openerRef.current?.focus(), 0);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowLeft") movePhoto(-1);
      if (event.key === "ArrowRight") movePhoto(1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selected, closeViewer, movePhoto]);

  useEffect(() => {
    if (!selectedProject || selected) return;
    projectCloseButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeProject();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedProject, selected, closeProject]);

  useEffect(() => {
    if (!selected && !selectedProject) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selected, selectedProject]);

  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    const revealAll = () => {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    };

    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        revealAll();
        return;
      }

      if (!("IntersectionObserver" in window)) {
        revealAll();
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.05, rootMargin: "0px 0px -8% 0px" },
      );

      revealItems.forEach((item) => observer.observe(item));
      setRevealReady(true);

      return () => {
        observer.disconnect();
      };
    } catch {
      revealAll();
    }
  }, [activeWorkSlug]);

  const openViewer = (collection: Collection, photo: Photo, index: number, opener: HTMLButtonElement) => {
    openerRef.current = opener;
    if (!viewerHistoryEntry.current) {
      window.history.pushState({ ...window.history.state, photographyViewer: true }, "");
      viewerHistoryEntry.current = true;
    }
    setViewerDirection("next");
    setSelected({ collection, photo, index });
  };

  const openProject = (collection: Collection) => {
    if (!projectHistoryEntry.current) {
      window.history.pushState({ ...window.history.state, photographyProject: true }, "");
      projectHistoryEntry.current = true;
    }
    setSelectedProject(collection);
  };

  const getArchiveCover = (collection: Collection) => {
    const coverPhoto = collection.photos.find((photo) => photo.src === collection.coverImage);
    return coverPhoto?.thumbnailSrc ?? collection.photos[0]?.thumbnailSrc ?? collection.coverImage;
  };

  const activeWork = visiblePrimaryCollections.find((collection) => collection.slug === activeWorkSlug) ?? visiblePrimaryCollections[0];

  const startProject = useCallback((collection: Collection) => {
    const subject = encodeURIComponent(`Commission inquiry \u2014 ${collection.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nI'm interested in work similar to your "${collection.title}" collection (${collection.theme}).\n\n`,
    );
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
  }, []);

  const handleWorkTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const key = event.key;
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(key)) return;
    event.preventDefault();
    const nextIndex = key === "Home"
      ? 0
      : key === "End"
        ? visiblePrimaryCollections.length - 1
        : (index + (key === "ArrowRight" ? 1 : -1) + visiblePrimaryCollections.length) % visiblePrimaryCollections.length;
    const nextCollection = visiblePrimaryCollections[nextIndex];
    if (!nextCollection) return;
    setActiveWorkSlug(nextCollection.slug);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]")[nextIndex]?.focus();
  };

  return (
    <main className={revealReady ? "reveal-ready" : ""}>

      <section className="hero redesigned-hero" id="top" aria-labelledby="hero-title">
        <div className="hero-manifest" aria-label="Archive classification">
          <span>Catalogue // {heroContent.yearLabel}</span>
          <span>{profile.role}</span>
          <span>{heroContent.locationLabel}</span>
        </div>
        <div className="hero-shell">
          <div className="hero-copy">
            <div className="hero-kicker"><span /> {profile.name} / {heroContent.eyebrow}</div>
            <div className="hero-heading-wrap">
              <p className="hero-index">01 / Introduction</p>
              <h1 id="hero-title">{heroContent.title}<br /><em>{heroContent.titleAccent}</em></h1>
            </div>
            <div className="hero-copy-bottom">
              <p>{profile.intro || heroContent.description}</p>
              <div className="hero-actions">
                <a className="hero-button hero-button-primary" href="#work">{heroContent.primaryCta} <Arrow direction="right" /></a>
                <a className="hero-button hero-button-secondary" href="#about">{heroContent.secondaryCta}</a>
              </div>
            </div>
          </div>

          <div className="hero-visual" aria-label="Selected photographs">
            {heroImages.map((image, index) => {
              const target = resolveHeroPhotoTarget(image);
              const frameClass = `hero-frame hero-frame-${index + 1}`;
              const frameImage = (
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  draggable={false}
                  priority={index === 0}
                  sizes={index === 0 ? "(max-width: 850px) 86vw, 43vw" : "(max-width: 850px) 43vw, 17vw"}
                />
              );
              if (!target) {
                return (
                  <figure className={frameClass} key={image.src} onContextMenu={blockPhotoAction} onDragStart={blockPhotoAction}>
                    {frameImage}
                  </figure>
                );
              }
              return (
                <button
                  type="button"
                  className={`${frameClass} hero-frame-button`}
                  key={image.src}
                  onClick={(event) => openViewer(target.collection, target.photo, target.index, event.currentTarget)}
                  onContextMenu={blockPhotoAction}
                  onDragStart={blockPhotoAction}
                  aria-label={`View photograph: ${image.alt}`}
                >
                  {frameImage}
                </button>
              );
            })}
          </div>
        </div>
        <div className="hero-footer">
          <span>Selected work</span>
          <span>{heroContent.locationLabel}</span>
          <span className="hero-rights-notice">© {profile.name} / All rights reserved</span>
        </div>
      </section>

      {/* Legacy hero markup is intentionally kept unreachable for compatibility with older authored content. */}
      {false && <section className="hero legacy-reference" id="legacy-hero" aria-labelledby="legacy-hero-title">
        <div className="hero-kicker"><span /> Visual journal{TAG_SEP}UAE</div>
        <h1 id="hero-title">The world,<br /><em>through my lens.</em></h1>
        <div className="hero-bottom">
          <p>{profile.intro}</p>
          <a className="scroll-link" href="#work" aria-label="Explore selected work">Scroll to explore</a>
        </div>
      </section>}

      {/* â”€â”€ Primary: Job-ready project themes â”€â”€ */}
      <section className="work-section" id="work" aria-labelledby="work-title">
        <div className="section-heading work-heading reveal" data-reveal>
          <p className="eyebrow">
            <span className="section-number">01</span>
            <span className="section-name">Selected works</span>
            <span className="section-count">({String(visiblePrimaryCollections.length).padStart(2, "0")})</span>
          </p>
          <h2 id="work-title">An index of<br /><em>light and place.</em></h2>
          <p className="section-intro">Each collection is structured around a real client brief{" \u2014 "}the shot list, the deliverables, and the technical skills that prove you can do the work.</p>
        </div>

        <div className="work-tabs reveal" role="tablist" aria-label="Photography services" data-reveal>
          {visiblePrimaryCollections.map((collection, collectionIndex) => {
            const isActive = activeWork?.slug === collection.slug;
            return (
              <button
                className="work-tab"
                key={collection.slug}
                id={`work-tab-${collection.slug}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="work-panel"
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  setActiveWorkSlug(collection.slug);
                }}
                onKeyDown={(event) => handleWorkTabKeyDown(event, collectionIndex)}
              >
                <span>0{collectionIndex + 1}</span>
                {collection.title}
              </button>
            );
          })}
        </div>

        {activeWork && (
          <div
            className="work-tabpanel"
            id="work-panel"
            role="tabpanel"
            aria-labelledby={`work-tab-${activeWork.slug}`}
            tabIndex={0}
          >
            <div className="collections work-collections">
              <CollectionCard
                key={activeWork.slug}
                collection={activeWork}
                collectionIndex={visiblePrimaryCollections.findIndex((collection) => collection.slug === activeWork.slug)}
                openViewer={openViewer}
                isFocused
                startProject={startProject}
              />
            </div>
          </div>
        )}

        {/* â”€â”€ Section divider â”€â”€ */}
      </section>

        <div className="section-divider reveal" data-reveal aria-hidden="true">
          <span />
          <p>Personal archive</p>
          <span />
        </div>

        {/* â”€â”€ Archive: Earlier personal explorations â”€â”€ */}
        <div className="archive-section" id="archive" aria-labelledby="archive-title">
          <div className="section-heading archive-heading reveal" data-reveal>
            <p className="eyebrow">
              <span className="section-number">02</span>
              <span className="section-name">Personal archive</span>
              <span className="section-count">({String(visibleArchiveCollections.length).padStart(2, "0")})</span>
            </p>
            <h2 id="archive-title">Earlier frames,<br /><em>still speaking.</em></h2>
            <p className="section-intro">A quieter index of experiments in light, motion, and atmosphere from the archive.</p>
          </div>

          <div className="archive-projects" aria-label="Archive projects">
            {visibleArchiveCollections.map((collection, collectionIndex) => (
              <article
                className="archive-project"
                key={collection.slug}
                data-reveal
                style={{ "--reveal-delay": `${Math.min(collectionIndex, 5) * 80}ms` } as CSSProperties}
              >
                <button
                  className="archive-project-trigger"
                  type="button"
                  onClick={() => openProject(collection)}
                  onContextMenu={blockPhotoAction}
                  onDragStart={blockPhotoAction}
                  aria-label={`Open ${collection.title} project`}
                >
                  <span className="archive-project-number">{String(collectionIndex + 1).padStart(2, "0")}</span>
                  <span className="archive-project-cover">
                    <Image
                      src={getArchiveCover(collection)}
                      alt=""
                      fill
                      draggable={false}
                      sizes="(max-width: 560px) 100vw, 180px"
                    />
                  </span>
                  <span className="archive-project-copy">
                    <span className="archive-project-title">{collection.title}</span>
                    <span className="archive-project-theme">{collection.theme}</span>
                  </span>
                  <span className="archive-project-meta">
                    <span>{String(collection.photos.length).padStart(2, "0")} frames</span>
                    <span>View project <Arrow direction="right" /></span>
                  </span>
                </button>
              </article>
            ))}
          </div>
        </div>

      <section className="toolkit-section" id="approach" aria-labelledby="approach-title">
        <div className="toolkit-title reveal" data-reveal>
          <p className="eyebrow">03 / Approach</p>
          <h2 id="approach-title">The craft<br />behind <em>the frame.</em></h2>
        </div>
        <div className="toolkit-list reveal" data-reveal>
          {toolkit.map((item) => (
            <article
              className="toolkit-item reveal"
              key={item.number}
              data-reveal
              style={{ "--reveal-delay": `${(Number(item.number) - 1) * 70}ms` } as CSSProperties}
            >
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section reveal" id="about" aria-labelledby="about-title" data-reveal>
        <div className="about-aside">
          <p className="eyebrow">04 / Behind the lens</p>
          {profile.portraitSrc && (
            <figure className="about-portrait reveal" data-reveal onContextMenu={blockPhotoAction} onDragStart={blockPhotoAction}>
              <Image
                src={profile.portraitSrc}
                alt={`Portrait of ${profile.name}`}
                fill
                draggable={false}
                sizes="(max-width: 900px) 72vw, 280px"
              />
              <span className="about-portrait-frame" aria-hidden="true" />
            </figure>
          )}
        </div>
        <div className="about-copy">
          <h2 id="about-title">Everyday moments,<br /><em>seen differently.</em></h2>
          <div className="about-body">
            {profile.about.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 16)}`}>{paragraph}</p>
            ))}
          </div>
          <a className="text-link" href={`mailto:${profile.email}`}>Start a conversation <Arrow direction="right" /></a>
        </div>
      </section>


      {selectedProject && (
        <div
          className="project-backdrop"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeProject(); }}
        >
          <section className="project-modal" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
            <div className="project-modal-header">
              <div>
                <p className="eyebrow">Archive / Project</p>
                <h2 id="project-modal-title">{selectedProject.title}</h2>
                <p className="project-modal-theme">{selectedProject.theme}</p>
              </div>
              <button
                className="project-modal-close"
                ref={projectCloseButtonRef}
                type="button"
                onClick={closeProject}
                aria-label="Close project"
              >
                Close
              </button>
            </div>
            <div className="project-modal-meta">
              <span>{String(selectedProject.photos.length).padStart(2, "0")} photographs</span>
              <span>Click any frame to inspect it</span>
            </div>
            <div className="project-gallery">
              {selectedProject.photos.map((photo, index) => (
                <button
                  className="project-gallery-card"
                  type="button"
                  key={photo.id}
                  onClick={(event) => openViewer(selectedProject, photo, index, event.currentTarget)}
                  onContextMenu={blockPhotoAction}
                  onDragStart={blockPhotoAction}
                  aria-label={`View ${photo.title}: ${photo.story}`}
                >
                  <Image
                    src={photo.thumbnailSrc}
                    alt={photo.alt}
                    fill
                    draggable={false}
                    sizes="(max-width: 700px) 100vw, 33vw"
                    style={{ objectPosition: photo.focalPoint ? `${photo.focalPoint.x}% ${photo.focalPoint.y}%` : undefined }}
                  />
                  <span className="project-gallery-shade" aria-hidden="true" />
                  <span className="project-gallery-label"><strong>{photo.title}</strong><small>{String(index + 1).padStart(2, "0")}</small></span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {selected && (
        <div className="viewer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeViewer(); }}>
          <section className="viewer" role="dialog" aria-modal="true" aria-labelledby="viewer-title" aria-describedby="viewer-story">
            <button className="viewer-close" ref={closeButtonRef} onClick={closeViewer} aria-label="Close photo viewer">Close</button>
            <div
              className={`viewer-image viewer-image-${viewerDirection}${selected.photo.isPlaceholder ? ` placeholder placeholder-${(collections.indexOf(selected.collection) % 3) + 1}` : ""}`}
              key={`image-${selected.photo.id}`}
              onTouchStart={handleViewerTouchStart}
              onTouchEnd={handleViewerTouchEnd}
              onContextMenu={blockPhotoAction}
              onDragStart={blockPhotoAction}
            >
              {selected.photo.isPlaceholder ? <><span>{String(selected.index + 1).padStart(2, "0")}</span><p>Replace with<br />your photograph</p></> : <Image src={selected.photo.src} alt={selected.photo.alt} fill sizes="90vw" priority draggable={false} />}
            </div>
            <div className="viewer-details" key={`details-${selected.photo.id}`}>
              {selected.photo.location && <p className="viewer-location">{selected.photo.location}</p>}
              <p className="viewer-collection">{selected.collection.title}{TAG_SEP}{String(selected.index + 1).padStart(2, "0")} / {String(selected.collection.photos.length).padStart(2, "0")}</p>
              <h2 id="viewer-title">{selected.photo.title}</h2>
              <p id="viewer-story">{selected.photo.story}</p>
              {selected.photo.process?.trim() && (
                <p className="viewer-process"><span>Process</span>{selected.photo.process}</p>
              )}
              <ul aria-label="Photography techniques">{selected.photo.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
            </div>
            <div className="viewer-nav">
              <button onClick={() => movePhoto(-1)} aria-label="Previous photo"><Arrow direction="left" /></button>
              <button onClick={() => movePhoto(1)} aria-label="Next photo"><Arrow direction="right" /></button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
