"use client";

import { useEffect } from "react";

export default function MotionObserver() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".ds-site");
    if (!root) return;
    const targets = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
    if (!targets.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const showAll = () => targets.forEach((target) => target.classList.add("is-visible"));

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      showAll();
      return;
    }

    document.documentElement.classList.add("reveal-ready");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: "0px 0px -24px" });

    targets.forEach((target) => observer.observe(target));
    const handleMotionChange = () => {
      if (!reduceMotion.matches) return;
      showAll();
      observer.disconnect();
    };
    const handleFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Node)) return;
      const focused = event.target;
      targets.forEach(target => {
        if (!target.contains(focused)) return;
        target.classList.add("is-visible");
        observer.unobserve(target);
      });
    };
    reduceMotion.addEventListener("change", handleMotionChange);
    root.addEventListener("focusin", handleFocus);

    return () => {
      observer.disconnect();
      reduceMotion.removeEventListener("change", handleMotionChange);
      root.removeEventListener("focusin", handleFocus);
      document.documentElement.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
