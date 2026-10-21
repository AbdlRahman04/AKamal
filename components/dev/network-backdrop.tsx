"use client";

import { useEffect, useRef } from "react";
import { useMotionVisibility } from "./feature-motion";

export default function NetworkBackdrop() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { visible, reduced } = useMotionVisibility(root);
  useEffect(() => {
    const element = canvas.current;
    const container = root.current;
    const context = element?.getContext("2d");
    if (!element || !container || !context) return;
    let width = 0, height = 0, frame = 0, pointerFrame = 0;
    let points: { x: number; y: number; vx: number; vy: number }[] = [];
    let accent = getComputedStyle(container).getPropertyValue("--ds-blue").trim();
    let mouse = { x: -1000, y: -1000 };
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const started = performance.now();
    function draw(move = false) {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      context.fillStyle = accent; context.strokeStyle = accent;
      for (const point of points) {
        if (move) {
          point.x += point.vx; point.y += point.vy;
          if (point.x < 0 || point.x > width) point.vx *= -1;
          if (point.y < 0 || point.y > height) point.vy *= -1;
        }
        context.globalAlpha = .45;
        context.beginPath(); context.arc(point.x, point.y, 1.5, 0, Math.PI * 2); context.fill();
      }
      for (let index = 0; index < points.length; index++) {
        const point = points[index];
        for (const next of points.slice(index + 1)) {
          const distance = (point.x - next.x) ** 2 + (point.y - next.y) ** 2;
          if (distance >= 18000) continue;
          context.globalAlpha = .2 * (1 - distance / 18000);
          context.beginPath(); context.moveTo(point.x, point.y); context.lineTo(next.x, next.y); context.stroke();
        }
        const distance = (point.x - mouse.x) ** 2 + (point.y - mouse.y) ** 2;
        if (!reduced && distance < 28000) {
          context.globalAlpha = .32 * (1 - distance / 28000);
          context.beginPath(); context.moveTo(point.x, point.y); context.lineTo(mouse.x, mouse.y); context.stroke();
        }
      }
    }
    function resize() {
      if (!element || !context) return;
      const changedWidth = width !== innerWidth;
      width = innerWidth; height = innerHeight;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      element.width = Math.round(width * ratio); element.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (changedWidth || !points.length) points = Array.from({ length: Math.min(45, Math.max(16, Math.round(width * height / 24000))) }, () => ({
        x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
      }));
      else points.forEach(point => { point.y = Math.min(point.y, height); });
      draw();
    }
    function tick(now: number) {
      draw(true);
      // A short entrance settles into a static network; pointer feedback remains.
      if (now - started < 4000) frame = requestAnimationFrame(tick);
    }
    function pointer(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      mouse = { x: event.clientX, y: event.clientY };
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        container?.style.setProperty("--feature-x", mouse.x + "px");
        container?.style.setProperty("--feature-y", mouse.y + "px");
        if (container) container.dataset.pointerActive = "true";
        draw(); pointerFrame = 0;
      });
    }
    function pointerOut(event: PointerEvent) {
      if (!event.relatedTarget) resetPointer();
    }
    function resetPointer() {
      cancelAnimationFrame(pointerFrame); pointerFrame = 0;
      mouse = { x: -1000, y: -1000 };
      if (container) container.dataset.pointerActive = "false";
      draw();
    }
    const observer = new MutationObserver(() => { accent = getComputedStyle(container).getPropertyValue("--ds-blue").trim(); draw(); });
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-dev-mode"] });
    resize();
    if (visible && !reduced && finePointer) {
      frame = requestAnimationFrame(tick);
      window.addEventListener("pointermove", pointer, { passive: true });
      window.addEventListener("pointerout", pointerOut, { passive: true });
      window.addEventListener("blur", resetPointer);
    }
    window.addEventListener("resize", resize, { passive: true });
    return () => {
      cancelAnimationFrame(frame); cancelAnimationFrame(pointerFrame); observer.disconnect();
      window.removeEventListener("resize", resize); window.removeEventListener("pointermove", pointer);
      window.removeEventListener("pointerout", pointerOut); window.removeEventListener("blur", resetPointer);
      container.dataset.pointerActive = "false";
    };
  }, [visible, reduced]);
  return <div ref={root} className="ds-feature-backdrop" aria-hidden="true"><canvas ref={canvas} /><div className="ds-feature-glow" /></div>;
}
