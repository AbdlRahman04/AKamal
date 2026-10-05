"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import Image from "@/components/site/public-image";
import gsap from "gsap";
import "./depth-carousel.css";

export type DepthCarouselItem = {
  image: string;
  alt?: string;
};

type DepthCarouselProps = {
  items: DepthCarouselItem[];
  cardWidth?: number;
  cardHeight?: number;
  radius?: number;
  tint?: string;
  depth?: number;
  spread?: number;
  tilt?: number;
  tiltDirection?: "left" | "right";
  perspective?: number;
  visibleCards?: number;
  falloff?: number;
  blur?: number;
  duration?: number;
  ease?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  onChange?: (index: number, item: DepthCarouselItem) => void;
  className?: string;
  label?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function DepthCarousel({
  items,
  cardWidth = 300,
  cardHeight = 380,
  radius = 18,
  tint = "#05060a",
  depth = 220,
  spread = 90,
  tilt = 22,
  tiltDirection = "right",
  perspective = 1400,
  visibleCards = 4,
  falloff = 0.2,
  blur = 6,
  duration = 700,
  ease = "power3.out",
  autoplay = false,
  autoplayDelay = 3200,
  loop = true,
  showControls = true,
  showIndicators = true,
  onChange,
  className = "",
  label = "Depth carousel",
}: DepthCarouselProps) {
  const count = items.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const overlayRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const positionRef = useRef(0);
  const focusRef = useRef(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const scaleRef = useRef(1);
  const configRef = useRef({});
  const onChangeRef = useRef(onChange);
  const dragRef = useRef<{ x: number; startPosition: number; lastX: number; lastTime: number; velocity: number; moved: boolean; pointerId: number } | null>(null);
  const autoTimerRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const [active, setActive] = useState(0);

  onChangeRef.current = onChange;
  configRef.current = { count, depth, spread, tilt, tiltDirection, visibleCards, falloff, blur, duration, ease, loop, cardWidth, autoplayDelay };

  const layout = useCallback((position: number) => {
    const config = configRef.current as typeof configRef.current & {
      count: number; depth: number; spread: number; tilt: number; tiltDirection: "left" | "right"; visibleCards: number; falloff: number; blur: number; loop: boolean;
    };
    const direction = config.tiltDirection === "left" ? -1 : 1;

    for (let index = 0; index < config.count; index++) {
      const card = cardRefs.current[index];
      if (!card) continue;

      let distance = index - position;
      if (config.loop && config.count > 1) {
        distance = ((distance % config.count) + config.count) % config.count;
        if (distance > config.count / 2) distance -= config.count;
      }

      const back = Math.max(0, distance);
      const absoluteDistance = Math.abs(distance);
      const shown = absoluteDistance <= config.visibleCards + 0.5;
      const translateZ = -config.depth * distance;
      const translateX = direction * config.spread * distance;
      const rotateY = direction * config.tilt * clamp(distance, 0, 1);
      const opacity = shown ? (distance < 0 ? Math.max(0, 1 + distance) : 1) : 0;
      const brightness = Math.max(0.15, 1 - back * config.falloff);
      const blurPx = config.blur > 0 ? Math.min(config.blur, (back / Math.max(1, config.visibleCards)) * config.blur) : 0;

      card.style.transform = `translate(-50%, -50%) scale(${scaleRef.current}) translateX(${translateX.toFixed(2)}px) translateZ(${translateZ.toFixed(2)}px) rotateY(${rotateY.toFixed(3)}deg)`;
      card.style.opacity = opacity.toFixed(3);
      card.style.filter = `brightness(${brightness.toFixed(3)}) blur(${blurPx.toFixed(2)}px)`;
      card.style.zIndex = String(Math.round(2000 - distance * 20));
      card.style.pointerEvents = shown && opacity > 0.05 ? "auto" : "none";

      const overlay = overlayRefs.current[index];
      if (overlay) overlay.style.opacity = clamp(back * config.falloff * 1.25, 0, 0.86).toFixed(3);
    }
  }, []);

  const notify = useCallback((index: number) => {
    setActive(index);
    onChangeRef.current?.(index, items[index]);
  }, [items]);

  const tweenTo = useCallback((target: number, animate: boolean) => {
    tweenRef.current?.kill();
    const config = configRef.current as typeof configRef.current & { duration: number; ease: string; count: number };
    const proxy = { position: positionRef.current };
    tweenRef.current = gsap.to(proxy, {
      position: target,
      duration: animate && !reducedMotionRef.current ? config.duration / 1000 : 0,
      ease: config.ease,
      onUpdate: () => {
        positionRef.current = proxy.position;
        layout(proxy.position);
      },
      onComplete: () => {
        if (config.count > 0) positionRef.current = ((positionRef.current % config.count) + config.count) % config.count;
        layout(positionRef.current);
      },
    });
  }, [layout]);

  const setFocus = useCallback((rawIndex: number, animate = true) => {
    const config = configRef.current as typeof configRef.current & { count: number; loop: boolean };
    if (!config.count) return;
    const index = config.loop ? ((rawIndex % config.count) + config.count) % config.count : clamp(rawIndex, 0, config.count - 1);
    let delta = index - positionRef.current;
    if (config.loop && config.count > 1) {
      delta = ((delta % config.count) + config.count) % config.count;
      if (delta > config.count / 2) delta -= config.count;
    }
    tweenTo(positionRef.current + delta, animate);
    if (index !== focusRef.current) {
      focusRef.current = index;
      notify(index);
    }
  }, [notify, tweenTo]);

  const navigateBy = useCallback((step: number) => setFocus(focusRef.current + step, true), [setFocus]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(([entry]) => {
      const config = configRef.current as typeof configRef.current & { cardWidth: number; spread: number };
      const requiredWidth = config.cardWidth + Math.abs(config.spread) * 2 + 120;
      scaleRef.current = clamp(entry.contentRect.width / requiredWidth, 0.4, 1);
      layout(positionRef.current);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [layout]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (count < 2) return;
    tweenRef.current?.kill();
    dragRef.current = { x: event.clientX, startPosition: positionRef.current, lastX: event.clientX, lastTime: performance.now(), velocity: 0, moved: false, pointerId: event.pointerId };
  }, [count]);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const config = configRef.current as typeof configRef.current & { cardWidth: number };
    const stepPixels = Math.max(config.cardWidth * 0.55 * scaleRef.current, 40);
    const deltaX = event.clientX - drag.x;
    if (!drag.moved && Math.abs(deltaX) > 4) {
      drag.moved = true;
      rootRef.current?.setPointerCapture(drag.pointerId);
    }
    if (!drag.moved) return;
    const now = performance.now();
    drag.velocity = (event.clientX - drag.lastX) / Math.max(now - drag.lastTime, 1);
    drag.lastX = event.clientX;
    drag.lastTime = now;
    positionRef.current = drag.startPosition - deltaX / stepPixels;
    layout(positionRef.current);
  }, [layout]);

  const onPointerEnd = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (!drag.moved) return;
    const config = configRef.current as typeof configRef.current & { cardWidth: number };
    const stepPixels = Math.max(config.cardWidth * 0.55 * scaleRef.current, 40);
    setFocus(Math.round(positionRef.current - (drag.velocity * 180) / stepPixels), true);
  }, [setFocus]);

  const onKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigateBy(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateBy(1);
    }
  }, [navigateBy]);

  const onCardClick = useCallback((index: number) => {
    if (dragRef.current?.moved) return;
    setFocus(index, true);
  }, [setFocus]);

  useEffect(() => {
    const root = rootRef.current;
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!autoplay || reducedMotionRef.current || count < 2) return;
    let hovered = false;
    let focused = false;
    const stop = () => {
      if (autoTimerRef.current) window.clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    };
    const start = () => {
      stop();
      autoTimerRef.current = window.setInterval(() => {
        if (!hovered && !focused) navigateBy(1);
      }, Math.max(autoplayDelay, 600));
    };
    const onEnter = () => { hovered = true; };
    const onLeave = () => { hovered = false; };
    const onFocusIn = () => { focused = true; };
    const onFocusOut = (event: FocusEvent) => {
      if (!root?.contains(event.relatedTarget as Node | null)) focused = false;
    };
    root?.addEventListener("mouseenter", onEnter);
    root?.addEventListener("mouseleave", onLeave);
    root?.addEventListener("focusin", onFocusIn);
    root?.addEventListener("focusout", onFocusOut);
    start();
    return () => {
      stop();
      root?.removeEventListener("mouseenter", onEnter);
      root?.removeEventListener("mouseleave", onLeave);
      root?.removeEventListener("focusin", onFocusIn);
      root?.removeEventListener("focusout", onFocusOut);
    };
  }, [autoplay, autoplayDelay, count, navigateBy]);

  useEffect(() => {
    layout(positionRef.current);
  }, [layout, depth, spread, tilt, tiltDirection, visibleCards, falloff, blur, cardWidth, cardHeight, radius, count]);

  useEffect(() => () => {
    tweenRef.current?.kill();
    if (autoTimerRef.current) window.clearInterval(autoTimerRef.current);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`depth-carousel ${className}`.trim()}
      style={{ "--dc-perspective": `${perspective}px` } as CSSProperties}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
    >
      <div className="depth-carousel__stage">
        {items.map((item, index) => (
          <div
            key={`${item.image}-${index}`}
            className="depth-carousel__card"
            ref={(element) => { cardRefs.current[index] = element; }}
            style={{ width: cardWidth, height: cardHeight, borderRadius: radius }}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}: ${item.alt || "Certificate"}`}
            aria-hidden={active !== index}
            onClick={() => onCardClick(index)}
          >
            <Image className="depth-carousel__img" src={item.image} alt={item.alt || ""} width={cardWidth} height={cardHeight} unoptimized draggable={false} />
            <span className="depth-carousel__tint" ref={(element) => { overlayRefs.current[index] = element; }} style={{ background: tint }} />
          </div>
        ))}
      </div>

      {showControls && count > 1 && (
        <>
          <button type="button" className="depth-carousel__arrow depth-carousel__arrow--prev" aria-label="Previous certificate" onClick={() => navigateBy(-1)}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" className="depth-carousel__arrow depth-carousel__arrow--next" aria-label="Next certificate" onClick={() => navigateBy(1)}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </>
      )}

      {showIndicators && count > 1 && (
        <div className="depth-carousel__dots" role="group" aria-label="Choose certificate">
          <span className="depth-carousel__count" aria-live="polite" aria-atomic="true">
            {String(active + 1).padStart(2, "0")} <span aria-hidden="true">/</span> {String(count).padStart(2, "0")}
          </span>
          {items.map((item, index) => (
            <button key={`${item.image}-dot-${index}`} type="button" aria-current={active === index ? "step" : undefined} aria-label={`Show certificate ${index + 1}: ${item.alt || "Certificate"}`} className={`depth-carousel__dot${active === index ? " is-active" : ""}`} onClick={() => setFocus(index, true)} />
          ))}
        </div>
      )}
    </div>
  );
}
