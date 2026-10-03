"use client";

export default function DevThemeSwitch({ dark, onToggle, section = "dev" }: {
  dark: boolean;
  onToggle: () => void;
  section?: "dev" | "photography";
}) {
  return (
    <button
      className="dev-theme-switch"
      data-theme-section={section}
      type="button"
      aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
      aria-pressed={dark}
      title={`Switch to ${dark ? "light" : "dark"} mode`}
      onClick={onToggle}
    >
      <span className="dev-theme-track" aria-hidden="true">
        <span className="dev-theme-thumb" />
        <svg className="dev-theme-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg>
        <svg className="dev-theme-moon" viewBox="0 0 24 24"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" /></svg>
      </span>
    </button>
  );
}
