"use client";

import { useEffect } from "react";
import type { SplitText } from "gsap/SplitText";

const staggerGroups = [
  ".ds-simple-timeline", ".ds-certificates-list", ".ds-simple-tags", ".ds-capability-list",
  ".ds-process-panel", ".ds-process-examples", ".ds-portfolio-facts",
  ".dev-footer-navigation", ".dev-footer-socials", ".ds-contact-links",
].join(",");

export default function MotionObserver() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".ds-site");
    if (!root) return;
    const footer = document.querySelector<HTMLElement>(".dev-footer");
    const scopes = footer ? [root, footer] : [root];
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reveals = new Set<HTMLElement>();
    const counted = new WeakSet<HTMLElement>();
    const counts = new Map<HTMLElement, { value: number; start: number }>();
    const splits: SplitText[] = [];
    let disposed = false;
    let frame = 0;
    let observer: IntersectionObserver | undefined;
    let mutations: MutationObserver | undefined;

    const finishCounts = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      counts.forEach(({ value }, element) => { element.textContent = String(value); });
      counts.clear();
    };
    const tick = (now: number) => {
      frame = 0;
      counts.forEach(({ value, start }, element) => {
        const progress = Math.min(1, (now - start) / 800);
        element.textContent = String(Math.round(value * (1 - (1 - progress) ** 3)));
        if (progress === 1 || !element.isConnected) counts.delete(element);
      });
      if (counts.size) frame = requestAnimationFrame(tick);
    };
    const show = (element: HTMLElement) => {
      element.classList.add("is-visible");
      observer?.unobserve(element);
      if (!element.hasAttribute("data-count-to") || counted.has(element)) return;
      counted.add(element);
      if (preference.matches || !observer) return;
      counts.set(element, { value: Number(element.dataset.countTo), start: performance.now() });
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const register = () => {
      scopes.forEach(scope => {
        scope.querySelectorAll<HTMLElement>(staggerGroups).forEach(group => {
          [...group.children].forEach((child, index) => {
            if (!(child instanceof HTMLElement) || child.matches(".ds-certificates-empty")) return;
            child.dataset.reveal = "stagger";
            child.style.setProperty("--i", String(index));
          });
        });
        scope.querySelectorAll<HTMLElement>("[data-reveal], [data-count-to]").forEach(element => {
          if (reveals.has(element)) return;
          reveals.add(element);
          if (preference.matches || !observer || element.classList.contains("is-visible")) show(element);
          else observer.observe(element);
        });
      });
    };
    const motionChanged = () => {
      if (!preference.matches) return;
      finishCounts();
      reveals.forEach(show);
    };
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof Node)) return;
      const target = event.target;
      reveals.forEach(element => {
        if (!element.contains(target)) return;
        element.dataset.revealInstant = "true";
        show(element);
      });
    };

    async function initialize() {
      if (!preference.matches) {
        try {
          const [{ default: gsap }, { SplitText }] = await Promise.all([import("gsap"), import("gsap/SplitText")]);
          if (disposed) return;
          gsap.registerPlugin(SplitText);
          root!.querySelectorAll<HTMLElement>(".ds-section-heading h2").forEach(heading => {
            splits.push(SplitText.create(heading, {
              type: "lines", mask: "lines", linesClass: "ds-heading-line", autoSplit: true,
              onSplit: split => split.lines.forEach((line, index) => (line as HTMLElement).style.setProperty("--i", String(index))),
            }));
          });
        } catch { /* A failed optional chunk leaves the ordinary heading reveal available. */ }
      }
      if (disposed) return;
      root!.querySelectorAll<HTMLElement>(".ds-section-heading").forEach(group => {
        group.dataset.reveal = "group";
        group.querySelectorAll<HTMLElement>("h2, .ds-index, h2 + p").forEach(element => {
          element.dataset.reveal = element.matches("h2") ? "heading" : element.matches(".ds-index") ? "label" : "intro";
        });
      });
      root!.querySelectorAll<HTMLElement>(".ds-background-group[data-reveal]").forEach(group => { group.dataset.reveal = "group"; });
      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(entries => {
          const indices = new Map<Element, number>();
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const element = entry.target as HTMLElement;
            // Stagger newly visible siblings, so long lists never accumulate seconds of delay.
            if (element.dataset.reveal === "stagger" && element.parentElement) {
              const index = indices.get(element.parentElement) ?? 0;
              element.style.setProperty("--i", String(index));
              indices.set(element.parentElement, index + 1);
            }
            show(element);
          });
        }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
      }
      register();
      // Never hide server HTML before observers and all their targets are ready.
      scopes.forEach(scope => scope.classList.add("reveal-ready"));
      mutations = new MutationObserver(records => {
        if (records.some(record => [...record.addedNodes].some(node => node instanceof Element))) register();
      });
      scopes.forEach(scope => mutations!.observe(scope, { childList: true, subtree: true }));
    }
    void initialize();
    preference.addEventListener("change", motionChanged);
    scopes.forEach(scope => scope.addEventListener("focusin", focus));
    return () => {
      disposed = true;
      observer?.disconnect();
      mutations?.disconnect();
      finishCounts();
      scopes.forEach(scope => { scope.classList.remove("reveal-ready"); scope.removeEventListener("focusin", focus); });
      splits.forEach(split => split.revert());
      preference.removeEventListener("change", motionChanged);
    };
  }, []);
  return null;
}
