import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const source = ts.createSourceFile("site-chrome.tsx", fs.readFileSync("components/site/site-chrome.tsx", "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const component = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "SiteChrome");
const effect = component.body.statements.find(node => ts.isExpressionStatement(node) && node.expression.expression?.getText(source) === "useLayoutEffect" && node.getText(source).includes("header.animate(")).expression.arguments[0];
const compiled = ts.transpileModule(`const mount = ${effect.getText(source)};`, {}).outputText;

function mount({ loaded = false, reduced = false } = {}) {
  const calls = [];
  const frames = new Map();
  const events = new Map();
  const observers = [];
  let nextFrame = 0;
  let focused = false;
  let cancelled = 0;
  const preference = { matches: reduced, addEventListener() {}, removeEventListener() {} };
  const header = {
    dataset: { scrolled: "false" },
    contains: () => focused,
    getAnimations: () => [],
    animate: (keyframes, options) => { calls.push({ keyframes, options }); return { cancel: () => cancelled++ }; },
    addEventListener: (name, callback) => events.set(`header:${name}`, callback),
    removeEventListener: name => events.delete(`header:${name}`),
  };
  const bindings = {
    headerRef: { current: header },
    document: { readyState: loaded ? "complete" : "loading", fonts: { ready: Promise.resolve() }, activeElement: null },
    window: {
      matchMedia: () => preference,
      addEventListener: (name, callback) => events.set(name, callback),
      removeEventListener: name => events.delete(name),
    },
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
    MutationObserver: class {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe() { this.observing = true; }
      disconnect() { this.observing = false; }
    },
  };
  const cleanup = vm.runInNewContext(`${compiled}; mount`, bindings)();
  const scroll = value => {
    header.dataset.scrolled = String(value);
    observers.filter(observer => observer.observing).forEach(observer => observer.callback());
  };
  const ready = async () => {
    events.get("load")?.();
    await Promise.resolve();
    while (frames.size) {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach(callback => callback());
    }
  };
  return { calls, scroll, ready, cleanup, focus: () => { focused = true; events.get("header:focusin")?.(); }, cancellations: () => cancelled };
}

test("hydration and restored scrolling never restart the already rendered header fade", async () => {
  const run = mount();
  assert.equal(run.calls.length, 0);
  run.scroll(true);
  await run.ready();
  assert.equal(run.calls.length, 0);
  run.scroll(true);
  assert.equal(run.calls.length, 0);
  run.scroll(false);
  assert.equal(run.calls.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(run.calls[0].keyframes)), [{ opacity: 0 }, { opacity: 1 }]);
  run.cleanup();
});

test("reduced motion and keyboard focus keep the header visible", async () => {
  const reduced = mount({ loaded: true, reduced: true });
  await reduced.ready();
  reduced.scroll(true);
  assert.equal(reduced.calls.length, 0);
  reduced.cleanup();
  const run = mount({ loaded: true });
  await run.ready();
  run.scroll(true);
  run.focus();
  assert.ok(run.cancellations() > 0);
  run.scroll(false);
  assert.equal(run.calls.length, 1);
  run.cleanup();
});

test("unmounting before loading finishes does not attach a late scroll observer", async () => {
  const run = mount({ loaded: true });
  run.cleanup();
  await run.ready();
  run.scroll(true);
  assert.equal(run.calls.length, 0);
});

test("the inline startup tracker restores the header surface before hydration, then hands off", () => {
  const layout = ts.createSourceFile("layout.tsx", fs.readFileSync("app/layout.tsx", "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let startup;
  function find(node) {
    if (ts.isNoSubstitutionTemplateLiteral(node) && node.text.includes("portfolio-header-ready")) startup = node.text;
    ts.forEachChild(node, find);
  }
  find(layout);
  assert.ok(startup);
  const header = { dataset: {} };
  const events = new Map();
  const window = { scrollY: 750, addEventListener: (name, callback) => events.set(name, callback), removeEventListener: name => events.delete(name) };
  const document = { querySelector: () => header, addEventListener: (name, callback) => events.set(name, callback), removeEventListener: name => events.delete(name) };
  vm.runInNewContext(startup, { window, document });
  assert.equal(header.dataset.scrolled, "true");
  window.scrollY = 0;
  events.get("scroll")();
  assert.equal(header.dataset.scrolled, "false");
  window.scrollY = 750;
  events.get("pageshow")();
  assert.equal(header.dataset.scrolled, "true");
  events.get("portfolio-header-ready")();
  assert.equal(events.has("scroll"), false);
  assert.equal(events.has("pageshow"), false);
  assert.equal(events.has("DOMContentLoaded"), false);
});
