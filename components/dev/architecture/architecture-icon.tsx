import type { ArchitectureNode } from "@/data/dev";

const shapes = {
  database: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0"/></>,
  card: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20M6 15h3M12 15h2"/></>,
  user: <><circle cx="12" cy="7" r="4"/><path d="M5 22v-3a7 7 0 0 1 14 0v3"/></>,
  browser: <><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 8h20M6 5.5h.01M10 5.5h.01M6 12h5M6 16h12"/></>,
  server: <><rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6"/></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m3 18 6-6 4 4 4-5 4 5"/></>,
  model: <><path d="m5 5 14 7L5 19M5 5v14M5 5l14 14M5 19 19 5M19 5v14"/><circle cx="5" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="19" cy="19" r="2"/></>,
  check: <><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z"/><path d="m7 12 3 3 7-7"/></>,
  results: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m7 9 2 2 4-4M7 16h10M15 9h2"/></>,
  book: <><path d="M12 5v17M12 5C8 2 4 2 2 3v16c4-1 7 0 10 3 3-3 6-4 10-3V3c-2-1-6-1-10 2Z"/></>,
  file: <><path d="M14 2H5v20h14V7l-5-5ZM14 2v5h5M9 11l-2 3 2 3M15 11l2 3-2 3"/></>,
  chat: <path d="M21 11a9 9 0 0 1-9 9H4l-3 3V11a10 10 0 0 1 20 0ZM6 11h.01M11 11h.01M16 11h.01"/>,
  report: <><path d="M14 2H4v20h16V8l-6-6ZM14 2v6h6M8 12h8M8 16h8"/></>,
  chart: <><path d="M3 3v18h18M7 17v-4M12 17V7M17 17v-7"/></>,
};

export default function ArchitectureIcon({ name }: { name: ArchitectureNode["icon"] }) {
  return <svg className="av-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}
