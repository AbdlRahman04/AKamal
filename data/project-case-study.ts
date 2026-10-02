import type { ArchitectureNode, DevArchitecture, DevProject } from "./dev";

export type ProjectCaseStudy = {
  architecture: DevArchitecture;
  technologies: NonNullable<DevArchitecture["technologies"]>;
  features: string[];
  flowDescription?: string;
  deploymentLabel?: string;
  overview: { title: string; description: string }[];
};

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
