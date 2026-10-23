import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

function moduleFrom(file, imports) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports = {};
  new Function("require", "exports", code)(name => {
    assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
    return imports[name];
  }, exports);
  return exports;
}

const react = await import("react");
const jsx = await import("react/jsx-runtime");
const nextImage = await import("next/image.js");
const dev = moduleFrom("data/dev.ts", { "./dev.json": JSON.parse(fs.readFileSync("data/dev.json", "utf8")) });
const facts = moduleFrom("data/project-case-study.ts", {});
const previews = moduleFrom("data/project-previews.ts", {});
const paths = moduleFrom("components/site/public-path.ts", {});
const images = moduleFrom("components/site/public-image.tsx", {
  "react/jsx-runtime": jsx, "next/image": nextImage.default, "./public-path": paths,
});

function render(projects = dev.devProjects) {
  const { default: Hero } = moduleFrom("components/dev/storytelling/developer-hero.tsx", {
    react, "react/jsx-runtime": jsx,
    "@/components/site/public-image": images,
    "@/components/site/public-path": paths,
    "@/data/dev": { ...dev, devProjects: projects },
    "@/data/project-case-study": facts,
    "@/data/project-previews": previews,
    "./developer-motion": { useDeveloperMotion: () => ({ reduced: true }) },
    "./developer-hero.css": {},
  });
  return renderToStaticMarkup(createElement(Hero));
}

test("static HTML exposes the selected hero, canonical totals, accessible project tabs and the live demo", () => {
  const html = render();
  assert.match(html, /class="product-studio-hero"/);
  assert.ok(html.includes(dev.devProfile.name));
  for (const fact of facts.getPortfolioFacts(dev.devProjects, dev.devExperience)) {
    assert.ok(html.includes(`<b>${fact.value}</b> ${fact.label.toLowerCase()}`));
  }
  assert.match(html, /role="tab" aria-selected="true" aria-controls="studio-project-preview"/);
  assert.match(html, /role="tab" aria-selected="false" aria-controls="studio-project-preview"/);
  assert.ok(html.includes("Example score only, not measured model accuracy."));
  const leaf = dev.devProjects.find(project => project.slug === "plant-health-monitoring-system");
  assert.ok(html.includes(paths.publicPath(leaf.liveUrl)));
});

test("removing the plant project selects the available Dine project without advertising a plant score", () => {
  const projects = dev.devProjects.filter(project => project.slug !== "plant-health-monitoring-system");
  const html = render(projects);
  assert.ok(html.includes("AURAK Dine"));
  assert.ok(html.includes("A simpler way to order."));
  assert.ok(!html.includes("studio-tab-plant-health-monitoring-system"));
  assert.ok(!html.includes("Example score only"));
  assert.ok(html.includes(`<b>${projects.length}</b> projects`));
});

test("an empty project collection still renders the introduction without empty preview controls", () => {
  const html = render([]);
  assert.ok(html.includes(dev.devProfile.name));
  assert.ok(html.includes('href="#contact"'));
  assert.ok(!html.includes('role="tablist"'));
  assert.ok(!html.includes('role="tabpanel"'));
});
