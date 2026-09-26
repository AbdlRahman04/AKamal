"use client";

import { useEffect } from "react";

export default function MotionObserver() {
  useEffect(() => {
    const targets = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    if (!targets.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const showAll = () => targets.forEach((target) => target.classList.add("is-visible"));

    if (reduceMotion.matches) {
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
    }, { threshold: 0.14, rootMargin: "0px 0px -7%" });

    targets.forEach((target) => observer.observe(target));
    const handleMotionChange = () => { if (reduceMotion.matches) showAll(); };
    reduceMotion.addEventListener("change", handleMotionChange);

    return () => {
      observer.disconnect();
      reduceMotion.removeEventListener("change", handleMotionChange);
      document.documentElement.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
