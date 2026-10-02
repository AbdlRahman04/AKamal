import data from "./dev.json";

export type DevLink = {
  label: string;
  href: string;
};

export type DevProfile = {
  name: string;
  role: string;
  title: string;
  intro: string;
  location: string;
  email: string;
  availability: string;
  portraitUrl?: string;
  phone?: string;
  contactHeading?: string;
  contactIntro?: string;
  links: DevLink[];
};

export type DevSkill = {
  slug: string;
  number: string;
  name: string;
  description: string;
  items: string[];
};

export type DevProject = {
  slug: string;
  number: string;
  title: string;
  type: string;
  year: string;
  status: string;
  summary: string;
  problem: string;
  solution: string;
  technologies: string[];
  role?: string;
  teamSize?: number;
  frontend?: string;
  backend?: string;
  database?: string;
  deployment?: string;
  contribution?: string;
  keyFeature?: string;
  technicalChallenge?: string;
  stackBreakdown: string[];
  highlights: string[];
  githubUrl: string;
  liveUrl: string;
  featured: boolean;
  coverImageUrl?: string;
  accent?: string;
  caseStudy?: DevCaseStudy;
  architecture?: DevArchitecture;
};

export type ArchitectureNode = {
  id: string;
  title: string;
  subtitle: string;
  category: "runtime" | "support";
  icon: "user" | "browser" | "server" | "image" | "model" | "check" | "results" | "book" | "file" | "chat" | "report" | "chart" | "database" | "card";
  column: number;
  row: number;
  technology: string;
  responsibilities: string[];
  endpoints?: string[];
  notes?: string[];
};

export type DevArchitecture = {
  title: string;
  subtitle: string;
  description: string;
  defaultNode: string;
  nodes: ArchitectureNode[];
  edges: { from: string; to: string; label?: string; kind: "runtime" | "support" | "response" }[];
  requestPath: { title: string; description: string }[];
  decisions: { title: string; description: string }[];
  technologies?: { logo: string; title: string; description: string }[];
};

export type DevCaseStudy = {
  description: string;
  architectureDescription: string;
  techStackDescription: string;
  flowDescription: string;
  deploymentLabel: string;
  nodes: Record<"customer" | "staff" | "frontend" | "backend" | "database" | "payment", { title: string; lines: string[]; icon: string }>;
  connectionLabels: { frontendBackend: string; backendDatabase: string; backendPayment: string };
  technologies: { logo: string; title: string; description: string }[];
  features: string[];
  flow: { title: string; description: string; icon: string }[];
};

export type JourneyItem = {
  slug: string;
  period: string;
  title: string;
  description: string;
};

export type DevExperience = {
  slug: string;
  number: string;
  company: string;
  role: string;
  period: string;
  summary: string;
  technologies: string[];
  current: boolean;
};

export type DevCertificate = {
  slug: string;
  number: string;
  name: string;
  issuer: string;
  year: string;
  description: string;
  status: "completed" | "in-progress";
  credentialUrl: string;
  imageUrl: string;
};

export type DevToolkit = {
  slug: string;
  number: string;
  name: string;
  category: string;
  description: string;
  url: string;
};

export type DevEducation = {
  slug: string;
  number: string;
  degree: string;
  institution: string;
  period: string;
  description: string;
  focus: string[];
  imageUrl?: string;
};

export const devProfile = data.profile as DevProfile;
export const devSkills = data.skills as DevSkill[];
export const devProjects = data.projects as DevProject[];
export const devJourney = data.journey as JourneyItem[];
export const devExperience = (data.experience ?? []) as DevExperience[];
export const devCertificates = (data.certificates ?? []) as DevCertificate[];
export const devToolkits = (data.toolkits ?? []) as DevToolkit[];
export const devEducation = (data.education ?? []) as DevEducation[];
