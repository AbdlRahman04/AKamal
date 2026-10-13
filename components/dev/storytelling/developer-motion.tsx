"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

export const motionTiming = { feedback: 0.16, panel: 0.24, story: 0.45, hero: 0.8 };
export const motionEase = [0.16, 1, 0.3, 1] as const;

function subscribePreference(listener: () => void) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", listener);
  return () => preference.removeEventListener("change", listener);
}
const getPreference = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getServerPreference = () => true;
const MotionContext = createContext({ reduced: true, systemReduced: false });

export function useDeveloperMotion() {
  return useContext(MotionContext);
}

export default function DeveloperMotionProvider({ children }: { children: ReactNode }) {
  const systemReduced = useSyncExternalStore(subscribePreference, getPreference, getServerPreference);
  const reduced = systemReduced;
  return <MotionContext.Provider value={{ reduced, systemReduced }}>
    <div className="ds-motion-root" data-reduced-motion={reduced ? "true" : "false"}>
      {children}
    </div>
  </MotionContext.Provider>;
}
