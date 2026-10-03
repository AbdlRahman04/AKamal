"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { devCertificates, devEducation, devExperience, devProfile, devProjects, devSkills } from "@/data/dev";
import { profile as photographyProfile } from "@/data/photography";
import DevThemeSwitch from "@/components/dev/theme-switch";

type NavItem = { label: string; href: string; visible?: boolean };
type PhotographyTheme = "dark" | "light";

const photographyThemeStorageKey = "photography-theme";

const devNavigation: NavItem[] = [
  { label: "Profile", href: "#top" },
  { label: "Projects", href: "#projects", visible: devProjects.length > 0 },
  { label: "Experience", href: "#experience", visible: devExperience.length > 0 || devCertificates.length > 0 || devEducation.length > 0 },
  { label: "Skills", href: "#skills", visible: devSkills.length > 0 },
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
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuTop, setMenuTop] = useState(96);
  const [activeHref, setActiveHref] = useState("#top");
  const [photographyTheme, setPhotographyTheme] = useState<PhotographyTheme>("dark");
  const [photographyThemeReady, setPhotographyThemeReady] = useState(false);
  const [devDark, setDevDark] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const mobileCloseRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const isLightPhotography = isPhotography && photographyTheme === "light";

  useEffect(() => {
    if (isPhotography) return;
    let dark = false;
    try { dark = window.localStorage.getItem("dev-theme") === "dark"; } catch { /* Use light when storage is unavailable. */ }
    document.body.dataset.devMode = dark ? "dark" : "light";
    setDevDark(dark);
  }, [isPhotography]);

  function toggleDevTheme() {
    const next = document.body.dataset.devMode !== "dark";
    document.body.dataset.devMode = next ? "dark" : "light";
    setDevDark(next);
    try { window.localStorage.setItem("dev-theme", next ? "dark" : "light"); } catch { /* Theme changes still work for this session. */ }
  }

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const updateMenuTop = () => setMenuTop(header.getBoundingClientRect().bottom + 8);
    const observer = new ResizeObserver(updateMenuTop);
    observer.observe(header);
    window.addEventListener("resize", updateMenuTop);
    updateMenuTop();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateMenuTop);
    };
  }, [isPhotography]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1121px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (menuOpen || !menuMounted) return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 280;
    const timeout = window.setTimeout(() => setMenuMounted(false), delay);
    return () => window.clearTimeout(timeout);
  }, [menuOpen, menuMounted]);

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
    if (!menuMounted) return;
    const opener = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    const background = Array.from(document.querySelectorAll<HTMLElement>(".shared-site-header, .site-section, .shared-site-footer"));
    const previousInert = background.map((element) => element.inert);
    background.forEach((element) => { element.inert = true; });
    document.body.style.overflow = "hidden";
    mobileCloseRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = mobileMenuRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])');
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
      background.forEach((element, index) => { element.inert = previousInert[index]; });
      if (opener?.isConnected && opener.getClientRects().length) opener.focus({ preventScroll: true });
    };
  }, [menuMounted]);

  useEffect(() => {
    if (!isPhotography) return;

    const footer = document.querySelector<HTMLElement>(".photography-footer[data-reveal]");
    if (!footer) return;

    const revealFooter = () => footer.classList.add("is-visible");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      revealFooter();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealFooter();
          observer.disconnect();
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" },
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, [isPhotography]);

  useEffect(() => {
    const defaultHref = navigation[0]?.href || "#top";
    const sections = navigation
      .map((item) => ({ href: item.href, element: document.querySelector(item.href) }))
      .filter((item): item is { href: string; element: Element } => item.element !== null);
    setActiveHref(window.location.hash || defaultHref);

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

    return () => {
      observer.disconnect();
    };
  }, [navigation]);

  return (
    <>
      <header ref={headerRef} className={`shared-site-header ${isPhotography ? "is-photography" : "is-dev"}${isLightPhotography ? " is-light" : ""}${isPhotography && photographyThemeReady ? " is-theme-ready" : ""}`}>
        <div className="shared-header-inner">
          <Link className="shared-wordmark" href={isPhotography ? "/photography#top" : "/#top"} aria-label={isPhotography ? undefined : `${devProfile.name} — Back to top`}>
            {isPhotography ? <>
              <img src="/assets/photo-logo.png" alt="" aria-hidden="true" />
              <span>Abdul Rahman Kamal</span>
            </> : <span className="dev-monogram" aria-hidden="true"><span>A</span><span>K</span></span>}
          </Link>
          <nav className="shared-desktop-nav" aria-label="Primary navigation">
            {navigation.map((item) => {
              const isActive = activeHref === item.href;
              return <a key={item.href} href={item.href} className={isActive ? "is-active" : undefined} aria-current={isActive ? "location" : undefined} onClick={() => setActiveHref(item.href)}>{item.label}</a>;
            })}
          </nav>
          <div className="shared-header-actions">
            {!isPhotography && <DevThemeSwitch dark={devDark} onToggle={toggleDevTheme} />}
            {isPhotography && (
              <DevThemeSwitch dark={photographyTheme === "dark"} onToggle={togglePhotographyTheme} section="photography" />
            )}
            <Link href={isPhotography ? "/" : "/photography"}>
              {isPhotography ? "Dev" : "Photography"}
            </Link>
            <a href="#contact">{isPhotography ? "Commission" : "Contact me"} <span aria-hidden="true">→</span></a>
          </div>
          <button
            className="shared-menu-toggle"
            ref={menuButtonRef}
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="shared-mobile-navigation"
            onClick={() => {
              if (headerRef.current) setMenuTop(headerRef.current.getBoundingClientRect().bottom + 8);
              setMenuMounted(true);
              setMenuOpen(true);
            }}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      {menuMounted && (
        <div className="shared-mobile-backdrop" data-state={menuOpen ? "open" : "closing"} style={{ "--menu-top": `${menuTop}px` } as CSSProperties} role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
          <div className="shared-mobile-menu" id="shared-mobile-navigation" ref={mobileMenuRef} role="dialog" aria-label="Mobile navigation" aria-modal="true">
            <div className="shared-mobile-topline">
              <span>Navigate</span>
              <div className="shared-mobile-controls">
                {!isPhotography && <DevThemeSwitch dark={devDark} onToggle={toggleDevTheme} />}
                {isPhotography && <DevThemeSwitch dark={photographyTheme === "dark"} onToggle={togglePhotographyTheme} section="photography" />}
                <button ref={mobileCloseRef} type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu">Close <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
              </div>
            </div>
            <nav aria-label="Mobile primary navigation">
              {navigation.map((item) => (
                <a key={item.href} href={item.href} className={activeHref === item.href ? "is-active" : undefined} aria-current={activeHref === item.href ? "location" : undefined} onClick={() => { setActiveHref(item.href); setMenuOpen(false); }}>
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="shared-mobile-actions">
              <Link href={isPhotography ? "/" : "/photography"} onClick={() => setMenuOpen(false)}>
                {isPhotography ? "Developer portfolio" : "Photography"}
              </Link>
              <a className="shared-mobile-contact" href="#contact" onClick={() => setMenuOpen(false)}>{isPhotography ? "Commission" : "Contact"}</a>
            </div>
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
