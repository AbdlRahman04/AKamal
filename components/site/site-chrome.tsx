"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { devCertificates, devExperience, devProfile, devProjects, devSkills } from "@/data/dev";
import { profile as photographyProfile } from "@/data/photography";

type NavItem = { label: string; href: string; visible?: boolean };
type PhotographyTheme = "dark" | "light";

const photographyThemeStorageKey = "photography-theme";

function PhotographyThemeSwitch({ theme, onToggle, ready }: { theme: PhotographyTheme; onToggle: () => void; ready: boolean }) {
  return (
    <label className={`theme-switch${ready ? "" : " theme-switch--loading"}`}>
      <input
        className="theme-switch__checkbox"
        type="checkbox"
        checked={theme === "dark"}
        onChange={onToggle}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      />
      <span className="theme-switch__container" aria-hidden="true">
        <span className="theme-switch__clouds" />
        <span className="theme-switch__stars-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 55" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M135.831 3.00688C135.055 3.85027 134.111 4.29946 133 4.35447C134.111 4.40947 135.055 4.85867 135.831 5.71123C136.607 6.55462 136.996 7.56303 136.996 8.72727C136.996 7.95722 137.172 7.25134 137.525 6.59129C137.886 5.93124 138.372 5.39954 138.98 5.00535C139.598 4.60199 140.268 4.39114 141 4.35447C139.88 4.2903 138.936 3.85027 138.16 3.00688C137.384 2.16348 136.996 1.16425 136.996 0C136.996 1.16425 136.607 2.16348 135.831 3.00688ZM31 23.3545C32.1114 23.2995 33.0551 22.8503 33.8313 22.0069C34.6075 21.1635 34.9956 20.1642 34.9956 19C34.9956 20.1642 35.3837 21.1635 36.1599 22.0069C36.9361 22.8503 37.8798 23.2903 39 23.3545C38.2679 23.3911 37.5976 23.602 36.9802 24.0053C36.3716 24.3995 35.8864 24.9312 35.5248 25.5913C35.172 26.2513 34.9956 26.9572 34.9956 27.7273C34.9956 26.563 34.6075 25.5546 33.8313 24.7112C33.0551 23.8587 32.1114 23.4095 31 23.3545ZM0 36.3545C1.11136 36.2995 2.05513 35.8503 2.83131 35.0069C3.6075 34.1635 3.99559 33.1642 3.99559 32C3.99559 33.1642 4.38368 34.1635 5.15987 35.0069C5.93605 35.8503 6.87982 36.2903 8 36.3545C7.26792 36.3911 6.59757 36.602 5.98015 37.0053C5.37155 37.3995 4.88644 37.9312 4.52481 38.5913C4.172 39.2513 3.99559 39.9572 3.99559 40.7273C3.99559 39.563 3.6075 38.5546 2.83131 37.7112C2.05513 36.8587 1.11136 36.4095 0 36.3545ZM56.8313 24.0069C56.0551 24.8503 55.1114 25.2995 54 25.3545C55.1114 25.4095 56.0551 25.8587 56.8313 26.7112C57.6075 27.5546 57.9956 28.563 57.9956 29.7273C57.9956 28.9572 58.172 28.2513 58.5248 27.5913C58.8864 26.9312 59.3716 26.3995 59.9802 26.0053C60.5976 25.602 61.2679 25.3911 62 25.3545C60.8798 25.2903 59.9361 24.8503 59.1599 24.0069C58.3837 23.1635 57.9956 22.1642 57.9956 21C57.9956 22.1642 57.6075 23.1635 56.8313 24.0069ZM81 25.3545C82.1114 25.2995 83.0551 24.8503 83.8313 24.0069C84.6075 23.1635 84.9956 22.1642 84.9956 21C84.9956 22.1642 85.3837 23.1635 86.1599 24.0069C86.9361 24.8503 87.8798 25.2903 89 25.3545C88.2679 25.3911 87.5976 25.602 86.9802 26.0053C86.3716 26.3995 85.8864 26.9312 85.5248 27.5913C85.172 28.2513 84.9956 28.9572 84.9956 29.7273C84.9956 28.563 84.6075 27.5546 83.8313 26.7112C83.0551 25.8587 82.1114 25.4095 81 25.3545ZM136 36.3545C137.111 36.2995 138.055 35.8503 138.831 35.0069C139.607 34.1635 139.996 33.1642 139.996 32C139.996 33.1642 140.384 34.1635 141.16 35.0069C141.936 35.8503 142.88 36.2903 144 36.3545C143.268 36.3911 142.598 36.602 141.98 37.0053C141.372 37.3995 140.886 37.9312 140.525 38.5913C140.172 39.2513 139.996 39.9572 139.996 40.7273C139.996 39.563 139.607 38.5546 138.831 37.7112C138.055 36.8587 137.111 36.4095 136 36.3545ZM101.831 49.0069C101.055 49.8503 100.111 50.2995 99 50.3545C100.111 50.4095 101.055 50.8587 101.831 51.7112C102.607 52.5546 102.996 53.563 102.996 54.7273C102.996 53.9572 103.172 53.2513 103.525 52.5913C103.886 51.9312 104.372 51.3995 104.98 51.0053C105.598 50.602 106.268 50.3911 107 50.3545C105.88 50.2903 104.936 49.8503 104.16 49.0069C103.384 48.1635 102.996 47.1642 102.996 46C102.996 47.1642 102.607 48.1635 101.831 49.0069Z" fill="currentColor" />
          </svg>
        </span>
        <span className="theme-switch__circle-container">
          <span className="theme-switch__sun-moon-container">
            <span className="theme-switch__moon">
              <span className="theme-switch__spot" />
              <span className="theme-switch__spot" />
              <span className="theme-switch__spot" />
            </span>
          </span>
        </span>
      </span>
    </label>
  );
}

const devNavigation: NavItem[] = [
  { label: "Profile", href: "#top" },
  { label: "Skills", href: "#skills", visible: devSkills.length > 0 },
  { label: "Projects", href: "#projects", visible: devProjects.length > 0 },
  { label: "Experience", href: "#experience", visible: devExperience.length > 0 },
  { label: "Learning", href: "#learning", visible: devCertificates.length > 0 },
  { label: "Contact", href: "#contact" },
];

const photographyNavigation: NavItem[] = [
  { label: "Introduction", href: "#top" },
  { label: "Selected works", href: "#work" },
  { label: "Archive", href: "#archive" },
  { label: "Approach", href: "#approach" },
  { label: "About", href: "#about" },
];

export default function SiteChrome({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isPhotography = pathname.startsWith("/photography");
  const navigation = useMemo(
    () => (isPhotography ? photographyNavigation : devNavigation).filter((item) => item.visible !== false),
    [isPhotography],
  );
  const currentProfile = isPhotography ? photographyProfile : devProfile;
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState("#top");
  const [photographyTheme, setPhotographyTheme] = useState<PhotographyTheme>("dark");
  const [photographyThemeReady, setPhotographyThemeReady] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileCloseRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const isLightPhotography = isPhotography && photographyTheme === "light";

  useEffect(() => {
    if (!isPhotography) {
      setPhotographyThemeReady(false);
      return;
    }
    try {
      const savedTheme = window.localStorage.getItem(photographyThemeStorageKey);
      const initialTheme: PhotographyTheme = savedTheme === "light" ? "light" : "dark";
      document.body.dataset.photographyMode = initialTheme;
      setPhotographyTheme(initialTheme);
      window.requestAnimationFrame(() => setPhotographyThemeReady(true));
    } catch {
      document.body.dataset.photographyMode = "dark";
      setPhotographyTheme("dark");
      window.requestAnimationFrame(() => setPhotographyThemeReady(true));
    }
  }, [isPhotography]);

  useEffect(() => {
    if (!isPhotography) {
      delete document.body.dataset.photographyMode;
      return;
    }

    return () => {
      delete document.body.dataset.photographyMode;
    };
  }, [isPhotography]);

  const togglePhotographyTheme = () => {
    setPhotographyTheme((current) => {
      const nextTheme = current === "dark" ? "light" : "dark";
      document.body.dataset.photographyMode = nextTheme;
      try {
        window.localStorage.setItem(photographyThemeStorageKey, nextTheme);
      } catch {
        // The mode still works for the current session when storage is unavailable.
      }
      return nextTheme;
    });
  };

  useEffect(() => {
    if (!menuOpen) return;
    const opener = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobileCloseRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = mobileMenuRef.current?.querySelectorAll<HTMLElement>("a, button");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.setTimeout(() => opener?.focus(), 0);
    };
  }, [menuOpen]);

  useEffect(() => {
    const defaultHref = navigation[0]?.href || "#top";
    setActiveHref(window.location.hash || defaultHref);
    const sections = navigation
      .map((item) => ({ href: item.href, element: document.querySelector(item.href) }))
      .filter((item): item is { href: string; element: Element } => item.element !== null);
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
      if (!visible) return;
      const match = sections.find((section) => section.element === visible.target);
      if (match) setActiveHref(match.href);
    }, { rootMargin: "-18% 0px -68%", threshold: [0, 0.15, 0.45] });

    sections.forEach((section) => observer.observe(section.element));
    return () => observer.disconnect();
  }, [navigation]);

  return (
    <>
      <header className={`shared-site-header${isPhotography ? " is-photography" : " is-dev"}${isLightPhotography ? " is-light" : ""}${isPhotography && photographyThemeReady ? " is-theme-ready" : ""}`}>
        <div className="shared-header-inner">
          <Link className="shared-wordmark" href={isPhotography ? "/photography#top" : "/#top"}>
            <img
              src={isPhotography ? "/assets/photo-logo.png" : "/assets/dev-logo.png"}
              alt=""
              aria-hidden="true"
            />
            <span>Abdul Rahman Kamal</span>
          </Link>
          <nav className="shared-desktop-nav" aria-label="Primary navigation">
            {navigation.map((item) => <a key={item.href} href={item.href} className={activeHref === item.href ? "is-active" : undefined} aria-current={activeHref === item.href ? "page" : undefined}>{item.label}</a>)}
          </nav>
          <div className="shared-header-actions">
            {isPhotography && (
              <PhotographyThemeSwitch theme={photographyTheme} onToggle={togglePhotographyTheme} ready={photographyThemeReady} />
            )}
            <Link href={isPhotography ? "/" : "/photography"}>
              {isPhotography ? "Dev" : "Photography"}
            </Link>
            <a href="#contact">Let&apos;s talk</a>
          </div>
          <button
            className="shared-menu-toggle"
            ref={menuButtonRef}
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="shared-mobile-navigation"
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="shared-mobile-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
          <div className="shared-mobile-menu" id="shared-mobile-navigation" ref={mobileMenuRef} role="dialog" aria-label="Mobile navigation" aria-modal="true">
            <div className="shared-mobile-topline">
              <span>Navigate</span>
              <button ref={mobileCloseRef} type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu">Close</button>
            </div>
            <nav aria-label="Mobile primary navigation">
              {navigation.map((item, index) => (
                <a key={item.href} href={item.href} className={activeHref === item.href ? "is-active" : undefined} aria-current={activeHref === item.href ? "page" : undefined} onClick={() => setMenuOpen(false)}>
                  <span>0{index + 1}</span>{item.label}
                </a>
              ))}
            </nav>
            {isPhotography && (
              <PhotographyThemeSwitch theme={photographyTheme} onToggle={togglePhotographyTheme} ready={photographyThemeReady} />
            )}
            <a href={isPhotography ? "/" : "/photography"} onClick={() => setMenuOpen(false)}>
              {isPhotography ? "Dev" : "Photography"}
            </a>
          </div>
        </div>
      )}

      <div className={`site-section${isPhotography ? " photography-section" : " dev-section"}${isLightPhotography ? " is-light" : ""}`} data-theme={isPhotography ? "photography" : "dev"}>
        {children}
      </div>

      <footer className={`shared-site-footer${isPhotography ? " photography-footer" : " dev-footer"}${isLightPhotography ? " is-light" : ""}`} id={isPhotography ? "contact" : undefined} data-reveal={isPhotography ? true : undefined}>
        <div className="shared-footer-inner">
          <p className="shared-footer-kicker">{isPhotography ? "Now booking selected commissions" : devProfile.availability}</p>
          <a className="shared-footer-email" href={`mailto:${currentProfile.email}`}>{currentProfile.email}</a>
          <div className="shared-footer-bottom">
            <span>© {new Date().getFullYear()} {currentProfile.name}</span>
            <div>
              {(isPhotography ? photographyProfile.socialLinks : devProfile.links).map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
              ))}
            </div>
            <a href="#top">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </>
  );
}
