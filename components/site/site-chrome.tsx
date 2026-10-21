"use client";

import Link from "next/link";
import localFont from "next/font/local";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { devCertificates, devEducation, devExperience, devProfile, devProjects, devSkills, portfolioLastUpdated } from "@/data/dev";
import { hero as photographyHero, profile as photographyProfile } from "@/data/photography";

type NavItem = { label: string; href: string; visible?: boolean };
type ThemeMode = "dark" | "light";

const photographyThemeStorageKey = "photography-theme";
const footerDisplayFont = localFont({ src: "../../public/fonts/bricolage-grotesque-700.ttf", weight: "700", display: "swap", variable: "--font-footer-display" });

const devNavigation: NavItem[] = [
  { label: "Profile", href: "#top" },
  { label: "Projects", href: "#projects", visible: devProjects.length > 0 },
  { label: "Experience", href: "#experience", visible: devExperience.length > 0 || devCertificates.length > 0 || devEducation.length > 0 },
  { label: "Skills", href: "#skills", visible: devSkills.length > 0 },
  { label: "Contact", href: "#contact" },
];

const photographyNavigation: NavItem[] = [
  { label: "Home", href: "#top" },
  { label: "Selected works", href: "#work" },
  { label: "Archive", href: "#archive" },
  { label: "Approach", href: "#approach" },
  { label: "About", href: "#about" },
];

function ThemeToggle({ theme, onToggle, mobile = false }: { theme: ThemeMode; onToggle: () => void; mobile?: boolean }) {
  return <button className={`site-theme-toggle${mobile ? " is-mobile" : ""}`} type="button" aria-label="Toggle theme" aria-pressed={theme === "dark"} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={onToggle}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {theme === "dark" ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />}
    </svg>
  </button>;
}

function PortfolioFooterContent({ isPhotography }: { isPhotography: boolean }) {
  const [localTime, setLocalTime] = useState<{ label: string; dateTime: string } | null>(null);
  const profile = isPhotography ? { ...photographyProfile, links: photographyProfile.socialLinks } : devProfile;
  const location = isPhotography ? photographyHero?.locationLabel ?? "UAE" : devProfile.location.split(",")[0];
  const socialLinks = [
    { label: "Instagram", path: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.5-3.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" },
    { label: "LinkedIn", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.119 20.452H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" },
    { label: "GitHub", path: "M12 .297C5.37.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.304-5.467-1.334-5.467-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.595 24 12.297c0-6.627-5.373-12-12-12Z" },
  ];
  const footerNavigation: NavItem[] = isPhotography ? [
    ...photographyNavigation.filter(item => item.href !== "#top"),
    { label: "Contact", href: "#contact" },
  ] : [
    { label: "Projects", href: "#projects", visible: devProjects.length > 0 },
    { label: "Experience", href: "#experience", visible: devExperience.length > 0 || devEducation.length > 0 },
    { label: "Certifications", href: "#certifications", visible: devCertificates.length > 0 },
    { label: "Skills", href: "#skills", visible: devSkills.length > 0 },
    { label: "Contact", href: "#contact" },
  ];

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit" });
    const update = () => {
      const now = new Date();
      setLocalTime({ label: formatter.format(now), dateTime: now.toISOString() });
    };
    update();
    const interval = window.setInterval(update, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return <div className={`dev-footer-content ${footerDisplayFont.variable}`}>
    <div className="dev-footer-top">
      <div>
        <a className="dev-footer-name" href="#top">{profile.name}</a>
        <p className="dev-footer-role">{profile.role}</p>
      </div>
      <nav className="dev-footer-socials" aria-label="Social profiles">
        {socialLinks.filter(social => isPhotography ? social.label === "Instagram" : social.label !== "Instagram").map(social => {
          const link = profile.links.find(item => item.label.toLowerCase() === social.label.toLowerCase());
          const icon = <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={social.path} /></svg>;
          return link?.href
            ? <a key={social.label} href={link.href} target="_blank" rel="noreferrer" aria-label={social.label} title={social.label}>{icon}</a>
            : <span key={social.label} role="link" aria-disabled="true" aria-label={`${social.label} (link coming soon)`} title={`${social.label} link coming soon`}>{icon}</span>;
        })}
      </nav>
    </div>
    <nav className="dev-footer-navigation" aria-label="Footer navigation">
      {footerNavigation.filter(item => item.visible !== false).map(item => <a key={item.href} href={item.href}>{item.label}</a>)}
      <Link className="dev-footer-photography" href={isPhotography ? "/" : "/photography"}>{isPhotography ? "See my development work" : "See my photography"} <span aria-hidden="true">↗</span></Link>
    </nav>
    <div className="dev-footer-bottom">
      <div className="dev-footer-meta">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span>{location}, <time dateTime={localTime?.dateTime}>{localTime?.label ?? "UAE time"}</time></span>
        <span>Updated <time dateTime={portfolioLastUpdated}>{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(portfolioLastUpdated))}</time></span>
      </div>
      <button className="dev-footer-up" type="button" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}>Back to top <span aria-hidden="true">↑</span></button>
    </div>
  </div>;
}

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
  const [photographyTheme, setPhotographyTheme] = useState<ThemeMode>("dark");
  const [photographyThemeReady, setPhotographyThemeReady] = useState(false);
  const [devDark, setDevDark] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const mobileCloseRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const isLightPhotography = isPhotography && photographyTheme === "light";

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const site = !isPhotography ? document.querySelector<HTMLElement>(".ds-site") : null;
    if (site) {
      const tokens = getComputedStyle(site);
      header.style.setProperty("--ds-blue", tokens.getPropertyValue("--ds-blue"));
      header.style.setProperty("--ds-cyan", tokens.getPropertyValue("--ds-cyan"));
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      const progress = distance > 0 ? Math.max(0, Math.min(1, window.scrollY / distance)) : 0;
      header.style.setProperty("--header-progress", String(progress));
      header.dataset.scrolled = String(window.scrollY > 24);
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.documentElement);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.cancelAnimationFrame(frame);
    };
  }, [pathname, isPhotography, devDark]);

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
    const updateMenuTop = () => setMenuTop(header.getBoundingClientRect().bottom + (isPhotography ? 0 : 8));
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
    const closeOnHashChange = () => setMenuOpen(false);
    window.addEventListener("hashchange", closeOnHashChange);
    return () => window.removeEventListener("hashchange", closeOnHashChange);
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia(isPhotography ? "(min-width: 1024px)" : "(min-width: 1121px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [isPhotography]);

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
      const initialTheme: ThemeMode = savedTheme === "light" ? "light" : "dark";
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
    const background = Array.from(document.querySelectorAll<HTMLElement>(isPhotography ? ".site-section, .shared-site-footer" : ".shared-site-header, .site-section, .shared-site-footer"));
    const previousInert = background.map((element) => element.inert);
    background.forEach((element) => { element.inert = true; });
    document.body.style.overflow = "hidden";
    mobileCloseRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const selector = 'a[href], button:not([disabled]), input:not([disabled])';
      const focusable = [
        ...(isPhotography ? Array.from(headerRef.current?.querySelectorAll<HTMLElement>(selector) ?? []) : []),
        ...Array.from(mobileMenuRef.current?.querySelectorAll<HTMLElement>(selector) ?? []),
      ].filter(element => element.getClientRects().length > 0);
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const isOutside = !focusable.includes(document.activeElement as HTMLElement);
      if (event.shiftKey && (document.activeElement === first || isOutside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || isOutside)) {
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
  }, [menuMounted, isPhotography]);

  useEffect(() => {
    const defaultHref = navigation[0]?.href || "#top";
    const sections = navigation
      .map((item) => ({ href: item.href, element: document.querySelector(item.href) }))
      .filter((item): item is { href: string; element: Element } => item.element !== null);
    setActiveHref(window.location.hash || defaultHref);

    if (!sections.length) return;

    if (!("IntersectionObserver" in window)) return;
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      const match = sections.filter(section => visible.has(section.element))
        .sort((a, b) => Math.abs(a.element.getBoundingClientRect().top) - Math.abs(b.element.getBoundingClientRect().top))[0];
      if (match) setActiveHref(match.href);
    }, { rootMargin: "-18% 0px -68%", threshold: [0, 0.15, 0.45] });

    sections.forEach((section) => observer.observe(section.element));

    return () => {
      observer.disconnect();
    };
  }, [navigation]);

  return (
    <>
      {!isPhotography && <a className="ds-feature-skip" href="#main-content">Skip to content</a>}
      {/* A new header prevents color and border transitions from carrying across portfolios. */}
      <header key={isPhotography ? "photography" : "dev"} ref={headerRef} className={`shared-site-header ${isPhotography ? "is-photography" : "is-dev"}${isLightPhotography ? " is-light" : ""}${isPhotography && photographyThemeReady ? " is-theme-ready" : ""}`}>
        {!isPhotography && <span className="shared-header-progress" aria-hidden="true" />}
        <div className={`shared-header-inner${isPhotography ? " photo-banner-inner" : ""}`}>
          <Link className="shared-wordmark" href={isPhotography ? "/photography#top" : "/#top"} aria-label={`${currentProfile.name}${isPhotography ? " Photography" : ""} — Back to top`}>
            {!isPhotography && <svg className="shared-header-graphic is-circuit" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
                <path className="shared-graphic-outline" d="M6 34H18V14H42M6 14H10M30 34H42" />
                <circle cx="6" cy="34" r="2" /><circle cx="42" cy="14" r="2" />
                <g className="shared-graphic-token"><rect x="-3" y="-3" width="6" height="6" rx="1" /></g>
            </svg>}
            {isPhotography ? <span className="photo-brand" aria-hidden="true">
              <svg className="photo-monogram" viewBox="0 0 80 48" fill="none" focusable="false">
                <path fill="currentColor" fillRule="evenodd" d="M4 42 18 6h8l14 36h-9l-3-8H16l-3 8H4ZM29.5 24a7.5 7.5 0 1 0-15 0 7.5 7.5 0 0 0 15 0Z" />
                <g className="photo-monogram-aperture">
                  <path className="photo-monogram-blades" d="m25 24-1.5 2.6h-3L19 24l1.5-2.6h3L25 24v-6.9m-1.5 9.5 6-3.5m-9 3.5 6 3.5M19 24v6.9m1.5-9.5-6 3.5m9-3.5-6-3.5" stroke="currentColor" strokeWidth=".9" />
                </g>
                <path className="photo-monogram-k" fill="currentColor" d="M40 6h8v15L62 6h11L56 23l18 19H63L48 26v16h-8V6Z" />
                <g className="photo-monogram-frame" stroke="currentColor" strokeWidth="1.5">
                  <path className="photo-monogram-corner-start" d="M1 13V1h12" />
                  <path className="photo-monogram-corner-end" d="M67 47h12V35" />
                </g>
              </svg>
              <span className="photo-brand-label">Photography</span>
            </span> : <span className="dev-monogram" aria-hidden="true"><span>A</span><span>K</span></span>}
          </Link>
          <nav className="shared-desktop-nav" aria-label="Primary navigation">
            {navigation.map((item) => {
              const isActive = activeHref === item.href;
              return <a key={item.href} href={item.href} className={isActive ? "is-active" : undefined} aria-current={isActive ? (isPhotography ? "page" : "location") : undefined} onClick={() => setActiveHref(item.href)}>{item.label}</a>;
            })}
          </nav>
          <div className="shared-header-actions">
            <ThemeToggle theme={isPhotography ? photographyTheme : devDark ? "dark" : "light"} onToggle={isPhotography ? togglePhotographyTheme : toggleDevTheme} />
            <Link href={isPhotography ? "/" : "/photography"}>
              {isPhotography ? "Developer ↗" : "Photography"}
            </Link>
            <a href="#contact">{isPhotography ? "Commission" : "Contact me"} <span aria-hidden="true">→</span></a>
          </div>
          {isPhotography && <ThemeToggle theme={photographyTheme} onToggle={togglePhotographyTheme} mobile />}
          <button
            className="shared-menu-toggle"
            ref={menuButtonRef}
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls={menuMounted ? "shared-mobile-navigation" : undefined}
            onClick={() => {
              if (headerRef.current) setMenuTop(headerRef.current.getBoundingClientRect().bottom + (isPhotography ? 0 : 8));
              if (!menuOpen) setMenuMounted(true);
              setMenuOpen(!menuOpen);
            }}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      {menuMounted && (
        <div className="shared-mobile-backdrop" data-state={menuOpen ? "open" : "closing"} style={{ "--menu-top": `${menuTop}px` } as CSSProperties} role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
          <div className="shared-mobile-menu" id="shared-mobile-navigation" ref={mobileMenuRef} role={isPhotography ? "region" : "dialog"} aria-label="Mobile navigation" aria-modal={isPhotography ? undefined : true}>
            <div className="shared-mobile-topline">
              <span>Navigate</span>
              <div className="shared-mobile-controls">
                {!isPhotography && <ThemeToggle theme={devDark ? "dark" : "light"} onToggle={toggleDevTheme} />}
                <button ref={mobileCloseRef} type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu">Close <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
              </div>
            </div>
            <nav aria-label="Mobile primary navigation">
              {navigation.map((item) => (
                <a key={item.href} href={item.href} className={activeHref === item.href ? "is-active" : undefined} aria-current={activeHref === item.href ? (isPhotography ? "page" : "location") : undefined} onClick={() => { setActiveHref(item.href); setMenuOpen(false); }}>
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="shared-mobile-actions">
              <Link href={isPhotography ? "/" : "/photography"} onClick={() => setMenuOpen(false)}>
                {isPhotography ? "Developer ↗" : "Photography"}
              </Link>
              <a className="shared-mobile-contact" href="#contact" onClick={() => setMenuOpen(false)}>{isPhotography ? "Commission →" : "Contact"}</a>
            </div>
          </div>
        </div>
      )}

      <div className={`site-section${isPhotography ? " photography-section" : " dev-section"}${isLightPhotography ? " is-light" : ""}`} data-theme={isPhotography ? "photography" : "dev"}>
        {children}
      </div>

      <footer className={`shared-site-footer${isPhotography ? " photography-footer" : " dev-footer"}${isLightPhotography ? " is-light" : ""}`}>
        <div className="shared-footer-inner">
          <PortfolioFooterContent isPhotography={isPhotography} />
        </div>
      </footer>
    </>
  );
}
