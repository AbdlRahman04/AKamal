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
