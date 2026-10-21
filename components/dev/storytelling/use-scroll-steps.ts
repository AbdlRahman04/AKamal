"use client";

import { useEffect, useRef, type RefObject } from "react";

/** Keep scroll selection separate from manual selection's three-second grace period. */
export function useScrollSteps(root: RefObject<HTMLElement | null>, selector: string, onStep: (index: number) => void, enabled = true) {
  const callback = useRef(onStep);
  const manualUntil = useRef(0);
  const resume = useRef<(() => void) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { callback.current = onStep; }, [onStep]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => {
    if (!enabled || !root.current || !("IntersectionObserver" in window)) return;
    const visible = new Set<HTMLElement>();
    const sync = () => {
      if (performance.now() < manualUntil.current) return;
      const nearest = [...visible].filter(element => element.getClientRects().length).sort((a, b) => {
        const distance = (element: HTMLElement) => {
          const rect = element.getBoundingClientRect();
          return Math.abs((rect.top + rect.bottom) / 2 - window.innerHeight / 2);
        };
        return distance(a) - distance(b);
      })[0];
      if (nearest) callback.current(Number(nearest.dataset.scrollStep));
    };
    resume.current = sync;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const element = entry.target as HTMLElement;
        if (entry.isIntersecting) visible.add(element);
        else visible.delete(element);
      });
      sync();
    }, { rootMargin: "-40% 0px -40% 0px", threshold: [0, .25, .5, .75, 1] });
    root.current.querySelectorAll<HTMLElement>(selector).forEach(element => observer.observe(element));
    return () => {
      observer.disconnect();
      resume.current = null;
    };
  }, [root, selector, enabled]);

  return function pauseScrollSync() {
    manualUntil.current = performance.now() + 3000;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => resume.current?.(), 3000);
  };
}
