"use client";

import { useEffect, useState, type RefObject } from "react";
import { useDeveloperMotion } from "./storytelling/developer-motion";

/** Suspend enhancement timers when their content cannot be seen. */
export function useMotionVisibility<T extends Element>(ref: RefObject<T | null>) {
  const { reduced } = useDeveloperMotion();
  const [intersecting, setIntersecting] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const updatePage = () => setPageVisible(document.visibilityState === "visible");
    updatePage();
    document.addEventListener("visibilitychange", updatePage);
    const observer = typeof IntersectionObserver === "undefined" ? null
      : new IntersectionObserver(entries => {
        // Resizes can queue multiple records for this element in a single delivery.
        const latest = entries[entries.length - 1];
        if (latest) setIntersecting(latest.isIntersecting);
      }, { threshold: 0.15 });
    if (observer) observer.observe(element);
    else setIntersecting(true);
    return () => { observer?.disconnect(); document.removeEventListener("visibilitychange", updatePage); };
  }, [ref]);

  return { visible: intersecting && pageVisible, reduced };
}
