import type { ArchitectureNode, DevArchitecture, DevExperience, DevProject } from "./dev";

export type PortfolioFact = { value: number; label: string; detail: string; href: string };

/** Portfolio totals include every canonical project, including smaller experiments. */
export function getPortfolioFacts(projects: DevProject[], experience: DevExperience[]): PortfolioFact[] {
  const facts: PortfolioFact[] = [];
  if (projects.length) facts.push({ value: projects.length, label: "Projects", detail: "Explore the work", href: "#projects" });
  const internships = experience.filter(item => /\bintern\b/i.test(item.role)).length;
  if (internships) facts.push({ value: internships, label: "Internships", detail: "See my experience", href: "#experience" });
  return facts;
}

/** Model coverage belongs to LeafAI, never to the portfolio as a whole. */
export function getProjectModelCoverage(project: DevProject): { classes: number; species: number } | null {
  if (project.slug !== "plant-health-monitoring-system") return null;
  const classifier = project.architecture?.nodes.find(node => node.id === "classifier");
  const coverage = classifier?.responsibilities.join(" ").match(/\b(\d+)\s+plant health classes across\s+(\d+)\s+species\b/i);
  if (coverage && Number(coverage[1]) > 0 && Number(coverage[2]) > 0) {
    return { classes: Number(coverage[1]), species: Number(coverage[2]) };
  }
  return null;
}

export type ProjectCaseStudy = {
  architecture: DevArchitecture;
  technologies: NonNullable<DevArchitecture["technologies"]>;
  features: string[];
  flowDescription?: string;
  deploymentLabel?: string;
  overview: { title: string; description: string }[];
};

export type StoryStep = {
  id: string;
  title: string;
  description: string;
  nodeIds: string[];
};

export type ProjectStoryModel = {
  projectSlug: string;
  kind: "leafai" | "dine";
  steps: StoryStep[];
};

/** Visual mappings reference canonical content; they never supply new project claims. */
export function getProjectStory(project: DevProject): ProjectStoryModel | null {
  const kind = project.slug === "plant-health-monitoring-system" ? "leafai"
    : project.slug === "smart-cafeteria-ordering-system" ? "dine" : null;
  if (!kind) return null;
  const study = getProjectCaseStudy(project);
  if (!study || study.architecture.requestPath.length !== 5) return null;
  const stages = kind === "leafai"
    ? [["input", "user", "frontend"], ["request", "frontend", "api"], ["inference", "preprocessing", "classifier"], ["interpretation", "processing", "knowledge"], ["result", "results"]]
    : [["menu", "customer", "frontend"], ["order", "frontend"], ["checkout", "backend", "payment"], ["payment", "payment"], ["saved", "backend", "database"]];
  const nodes = new Set(study.architecture.nodes.map(node => node.id));
  const steps = study.architecture.requestPath.map((step, index) => ({
    ...step, id: stages[index][0], nodeIds: stages[index].slice(1).filter(id => nodes.has(id)),
  }));
  if (steps.some(step => !step.title || !step.description || !step.nodeIds.length)) return null;
  return { projectSlug: project.slug, kind, steps };
}

/** Adapt existing authoring formats to one public case-study presentation. */
export function getProjectCaseStudy(project: DevProject): ProjectCaseStudy | null {
  const overview = [
    { title: "Challenge", description: project.problem },
    { title: "Approach", description: project.solution },
    { title: "My contribution", description: project.contribution ?? "" },
    { title: "Key feature", description: project.keyFeature ?? "" },
  ].filter(item => item.description);
  if (project.architecture) return {
    architecture: project.architecture,
    technologies: project.architecture.technologies ?? [],
    features: project.highlights, overview,
  };
  const study = project.caseStudy;
  if (!study) return null;
  const positions: Record<keyof typeof study.nodes, [number, number]> = {
    customer: [1, 1], staff: [1, 3], frontend: [2, 2], backend: [3, 2], database: [4, 1], payment: [4, 3],
  };
  const icons: Record<keyof typeof study.nodes, ArchitectureNode["icon"]> = {
    customer: "user", staff: "user", frontend: "browser", backend: "server", database: "database", payment: "card",
  };
  const nodes = (Object.keys(positions) as (keyof typeof study.nodes)[]).map(id => {
    const node = study.nodes[id];
    const [column, row] = positions[id];
    return {
      id, title: node.title, subtitle: node.lines[0] ?? node.title,
      category: "runtime" as const, icon: icons[id], column, row,
      technology: node.title, responsibilities: node.lines,
      ...(id === "frontend" ? { notes: [study.deploymentLabel] } : {}),
    };
  });
  return {
    architecture: {
      title: project.title, subtitle: study.description, description: study.architectureDescription,
      defaultNode: "frontend", nodes,
      edges: [
        { from: "customer", to: "frontend", kind: "runtime" },
        { from: "staff", to: "frontend", kind: "runtime" },
        { from: "frontend", to: "backend", kind: "runtime", label: study.connectionLabels.frontendBackend },
        { from: "backend", to: "database", kind: "runtime", label: study.connectionLabels.backendDatabase },
        { from: "backend", to: "payment", kind: "runtime", label: study.connectionLabels.backendPayment },
      ],
      requestPath: study.flow.map(({ title, description }) => ({ title, description })),
      decisions: [
        { title: "My contribution", description: project.contribution ?? "" },
        { title: "Technical challenge", description: project.technicalChallenge ?? "" },
      ].filter(item => item.description),
    },
    technologies: study.technologies, features: study.features,
    flowDescription: study.flowDescription, deploymentLabel: study.deploymentLabel, overview,
  };
}
