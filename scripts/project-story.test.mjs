import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = fs.readFileSync("data/project-case-study.ts", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
new Function("exports", compiled)(exports);
const data = JSON.parse(fs.readFileSync("data/dev.json", "utf8"));

test("both authoring formats become five factual steps with valid node references", () => {
  for (const project of data.projects.slice(0, 2)) {
    const story = exports.getProjectStory(project);
    const study = exports.getProjectCaseStudy(project);
    assert.equal(story.projectSlug, project.slug);
    assert.equal(story.steps.length, 5);
    assert.equal(new Set(story.steps.map(step => step.id)).size, 5);
    assert.deepEqual(story.steps.map(({ title, description }) => ({ title, description })), study.architecture.requestPath);
    for (const step of story.steps) {
      assert.ok(step.nodeIds.length);
      for (const id of step.nodeIds) assert.ok(study.architecture.nodes.some(node => node.id === id));
    }
  }
});

test("unsupported projects and incomplete workflows use the existing card presentation", () => {
  assert.equal(exports.getProjectStory(data.projects[2]), null);
  const project = structuredClone(data.projects[0]);
  project.architecture.requestPath = [];
  assert.equal(exports.getProjectStory(project), null);
  delete project.architecture;
  assert.equal(exports.getProjectStory(project), null);
});

test("missing optional facts and missing nodes cannot invent story content", () => {
  const project = structuredClone(data.projects[0]);
  delete project.contribution;
  delete project.architecture.technologies;
  delete project.architecture.decisions;
  project.architecture.nodes = project.architecture.nodes.filter(node => node.id !== "preprocessing");
  const story = exports.getProjectStory(project);
  assert.equal(story.steps.length, 5);
  assert.ok(story.steps.every(step => !step.nodeIds.includes("preprocessing")));
});

test("portfolio totals count every project and only internship roles", () => {
  const facts = exports.getPortfolioFacts(data.projects, data.experience);
  assert.deepEqual(facts.map(({ value, label, href }) => ({ value, label, href })), [
    { value: data.projects.length, label: "Projects", href: "#projects" },
    { value: 2, label: "Internships", href: "#experience" },
  ]);
  const solo = { ...data.projects[2], slug: "new-experiment", teamSize: 1 };
  const added = exports.getPortfolioFacts([...data.projects, solo], [...data.experience, { role: "Software engineer" }]);
  assert.deepEqual(added.map(fact => fact.value), [data.projects.length + 1, 2]);
  assert.equal(exports.getPortfolioFacts([], data.experience)[0].label, "Internships");
  assert.deepEqual(exports.getPortfolioFacts([], []), []);
});

test("model coverage stays with LeafAI and follows canonical facts", () => {
  const changed = structuredClone(data.projects);
  assert.deepEqual(exports.getProjectModelCoverage(changed[0]), { classes: 38, species: 14 });
  changed[0].architecture.nodes.find(node => node.id === "classifier").responsibilities = ["Scores 20 plant health classes across 8 species."];
  assert.deepEqual(exports.getProjectModelCoverage(changed[0]), { classes: 20, species: 8 });
  assert.deepEqual(exports.getPortfolioFacts(changed, []).map(fact => fact.value), [changed.length]);
  assert.equal(exports.getProjectModelCoverage(changed[1]), null);
  changed[0].architecture.nodes.find(node => node.id === "classifier").responsibilities = ["Scores 0 plant health classes across 8 species."];
  assert.equal(exports.getProjectModelCoverage(changed[0]), null);
  changed[0].architecture.nodes = [];
  assert.equal(exports.getProjectModelCoverage(changed[0]), null);
  delete changed[0].architecture;
  assert.equal(exports.getProjectModelCoverage(changed[0]), null);
});
