"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode, type PointerEvent } from "react";
import { useDeveloperMotion } from "./developer-motion";

const desktopQuery = "(min-width: 1024px) and (min-height: 700px)";
function subscribeDesktop(listener: () => void) {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
const getDesktop = () => window.matchMedia(desktopQuery).matches;
const getServerDesktop = () => false;

export default function HeroMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const entered = useRef(false);
  const { reduced } = useDeveloperMotion();
  const desktop = useSyncExternalStore(subscribeDesktop, getDesktop, getServerDesktop);

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

  useEffect(() => {
    if (reduced || !desktop || !root.current) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ default: gsap }, { ScrollTrigger }]) => {
      if (cancelled || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      const context = gsap.context(() => {
        media.add(desktopQuery, () => {
          gsap.to("[data-hero-layer]", { y: (index: number) => index === 0 ? -48 : 32, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
        });
      }, root);
      cleanup = () => { media.revert(); context.revert(); };
    });
    return () => { cancelled = true; cleanup?.(); };
  }, [reduced, desktop]);

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
