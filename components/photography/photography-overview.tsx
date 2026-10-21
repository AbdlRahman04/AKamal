"use client";

import { useEffect, useRef, useState } from "react";
import { collections, photographyOverview } from "@/data/photography";

export default function PhotographyOverview() {
  const strip = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const publishedCollections = collections.filter(collection => collection.photos.some(photo => !photo.isPlaceholder && photo.src));
  const stats = [
    { label: "Frames", value: publishedCollections.reduce((count, collection) => count + collection.photos.filter(photo => !photo.isPlaceholder && photo.src).length, 0) },
    { label: "Collections", value: publishedCollections.length },
    { label: "Cities", value: photographyOverview.cities },
    { label: "Years", value: photographyOverview.years },
  ];

  useEffect(() => {
    setReady(true);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries => {
      const latest = entries[entries.length - 1];
      if (latest) setVisible(latest.isIntersecting);
    });
    if (observer && strip.current) observer.observe(strip.current);
    else setVisible(true);
    return () => { observer?.disconnect(); document.removeEventListener("visibilitychange", updateVisibility); };
  }, []);

  return <section className="photography-overview" aria-label="Photography at a glance" data-enhanced={ready ? "true" : undefined}>
    <div className="photo-subject-strip" ref={strip}>
      <div className="photo-subject-viewport">
        <div className="photo-subject-track" data-running={visible && pageVisible ? "true" : "false"}>
          <ul aria-label="Photography subjects">{photographyOverview.subjects.map(subject => <li key={subject}>{subject}</li>)}</ul>
          <ul className="photo-subject-copy" aria-hidden="true">{photographyOverview.subjects.map(subject => <li key={subject}>{subject}</li>)}</ul>
        </div>
      </div>
    </div>
    <dl className="photo-statistics">
      {stats.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}
    </dl>
  </section>;
}
