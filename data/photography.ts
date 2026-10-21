import data from "./photography.json";
import approach from "./photography-approach.json";
import overview from "./photography-overview.json";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

export type TechniqueTag =
  | "Panning"
  | "Motion Blur"
  | "Shutter Speed"
  | "Environmental Texture"
  | "Golden Hour"
  | "Exposure Balance"
  | "Color Grading"
  | "Atmospheric Light"
  | "Rule of Thirds"
  | "Leading Lines"
  | "Environmental Framing"
  | "Depth"
  | "Visual Balance"
  | "Staging"
  | "Window Light"
  | "Reflection Control"
  | "Symmetry"
  | "Detail Macro"
  | "Lifestyle"
  | "Candid"
  | "Day-to-Dusk";

export type Photo = {
  id: string;
  featuredRank?: 1 | 2 | 3;
  title: string;
  src: string;
  thumbnailSrc: string;
  alt: string;
  story: string;
  process?: string;
  location?: string;
  tags: TechniqueTag[];
  isPlaceholder?: boolean;
  aspectRatio?: string;
  orientation?: "landscape" | "portrait" | "square";
  focalPoint?: { x: number; y: number };
};

export type CollectionSection = "primary" | "archive";

export type Collection = {
  slug: string;
  title: string;
  theme: string;
  intro: string;
  skillsDemonstrated: string;
  coverImage: string;
  section: CollectionSection;
  photos: Photo[];
};

export type SiteProfile = {
  name: string;
  role: string;
  intro: string;
  about: string;
  /** Optional portrait for the about section (root-relative URL under public/). */
  portraitSrc?: string;
  socialLinks: { label: string; href: string }[];
};

export type HeroImage = {
  src: string;
  alt: string;
  label: string;
  meta: string;
  collectionSlug?: string;
  photoId?: string;
};

export type HeroConfig = {
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  yearLabel: string;
  locationLabel: string;
  images: HeroImage[];
};

export type NavigationItem = {
  label: string;
  href: string;
};

/* ─────────────────────────────────────────────
   Data from JSON
   ───────────────────────────────────────────── */

export const profile: SiteProfile = data.profile as SiteProfile;
export const hero: HeroConfig | undefined = data.hero as HeroConfig | undefined;

export const siteNavigation: NavigationItem[] = [
  { label: "Work", href: "#work" },
  { label: "Archive", href: "#archive" },
  { label: "Approach", href: "#approach" },
  { label: "About", href: "#about" },
];

const primaryCollectionData: Collection[] = data.primaryCollections as Collection[];
const archiveCollectionData: Collection[] = data.archiveCollections as Collection[];

/* ─────────────────────────────────────────────
   Combined + filtered exports
   ───────────────────────────────────────────── */

export const collections: Collection[] = [...primaryCollectionData, ...archiveCollectionData];
export const primaryCollections: Collection[] = primaryCollectionData;
export const archiveCollections: Collection[] = archiveCollectionData;

export type ApproachPrinciple = {
  number: string;
  title: string;
  description: string;
  detail: string;
  demo: "composition" | "light" | "grading" | "motion" | "storytelling";
  previewLabel: string;
  techniques: TechniqueTag[];
};

export const toolkit = approach as ApproachPrinciple[];

export const photographyOverview: { subjects: string[]; cities: number; years: number } = overview;
