"use client";

import { useEffect, useRef, type ReactNode, type PointerEvent, type RefObject } from "react";
import { useDeveloperMotion } from "./developer-motion";

export function useHeroScroll(root: RefObject<HTMLElement | null>) {
  const { reduced } = useDeveloperMotion();
  useEffect(() => {
    if (reduced || !root.current) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ default: gsap }, { ScrollTrigger }]) => {
      if (cancelled || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const element = root.current;
      const media = gsap.matchMedia();
      media.add({ motion: "(prefers-reduced-motion: no-preference)", mobile: "(max-width: 699px)" }, context => {
        if (!context.conditions?.motion) return;
        const distance = context.conditions.mobile ? 20 : 40;
        const scrollTrigger = { trigger: element, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true };
        gsap.to(element.querySelectorAll("[data-hero-layer], .ds-simple-hero-preview"), {
          y: (index: number) => distance * (index === 0 ? 1 : .65), ease: "none", scrollTrigger,
        });
        gsap.to(element, { opacity: .88, scale: .98, ease: "none", scrollTrigger });
      }, element);
      cleanup = () => media.revert();
    }).catch(() => { /* The hero remains fully readable if its optional motion chunk fails. */ });
    return () => { cancelled = true; cleanup?.(); };
  }, [root, reduced]);
}

export default function HeroMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const entered = useRef(false);
  const { reduced } = useDeveloperMotion();
  useHeroScroll(root);

  useEffect(() => {
    const element = root.current;
    if (!element || reduced) return;
    let visible = false;
    const update = () => {
      element.dataset.ambient = visible && !document.hidden ? "running" : "paused";
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(element.querySelector(".ds-hero-collage") ?? element);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      element.dataset.ambient = "paused";
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced || entered.current || !root.current) return;
    entered.current = true;
    const element = root.current;
    element.classList.add("ds-hero-entering");
    const timer = window.setTimeout(() => element.classList.remove("ds-hero-entering"), 800);
    return () => { window.clearTimeout(timer); element.classList.remove("ds-hero-entering"); };
  }, [reduced]);

  function tilt(event: PointerEvent<HTMLElement>) {
    if (reduced || event.pointerType !== "mouse" || !window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)").matches) return;
    const artwork = event.currentTarget.querySelector<HTMLElement>(".ds-hero-collage");
    if (!artwork) return;
    const bounds = artwork.getBoundingClientRect();
    const clamp = (value: number) => Math.max(-3, Math.min(3, value));
    artwork.style.setProperty("--tilt-x", `${clamp((event.clientY - bounds.top - bounds.height / 2) / bounds.height * -6)}deg`);
    artwork.style.setProperty("--tilt-y", `${clamp((event.clientX - bounds.left - bounds.width / 2) / bounds.width * 6)}deg`);
  }
  function reset() {
    const artwork = root.current?.querySelector<HTMLElement>(".ds-hero-collage");
    artwork?.style.setProperty("--tilt-x", "0deg");
    artwork?.style.setProperty("--tilt-y", "0deg");
  }
  return <section ref={root} id="top" className="ds-cinematic-hero" data-ambient="paused" aria-labelledby="dev-hero-title" onPointerMove={tilt} onPointerLeave={reset} onFocusCapture={reset}>{children}</section>;
}
