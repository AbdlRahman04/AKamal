import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const source = ts.createSourceFile("site-chrome.tsx", fs.readFileSync("components/site/site-chrome.tsx", "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const component = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "SiteChrome");
const handler = component.body.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "handlePortfolioNavigation");
const compiled = ts.transpileModule(handler.getText(source), {}).outputText;

function navigation({ supported = true, reduced = false, photography = true, event = {} } = {}) {
  const pushed = [];
  const timers = new Map();
  let update;
  let complete;
  let started = 0;
  const animation = { ready: Promise.resolve(), finished: new Promise(resolve => { complete = resolve; }), skipTransition() {} };
  const finishTransitionUpdate = { current: null };
  const navigationTransition = { current: null };
  const click = { button: 0, detail: 1, preventDefault() { this.defaultPrevented = true; }, ...event };
  const bindings = {
    document: { startViewTransition: supported ? callback => { started++; update = callback(); return animation; } : undefined },
    window: {
      matchMedia: () => ({ matches: reduced }),
      setTimeout: (callback, delay) => { timers.set(1, { callback, delay }); return 1; },
      clearTimeout: id => timers.delete(id),
    },
    router: { push: path => pushed.push(path) },
    setMenuOpen() {}, setMenuMounted() {},
    isPhotography: photography, finishTransitionUpdate, navigationTransition,
  };
  vm.runInNewContext(`${compiled}; handlePortfolioNavigation`, bindings)(click);
  return { click, pushed, timers, animation, finishTransitionUpdate, navigationTransition, complete, update, started };
}

test("ordinary portfolio switches wait for the route commit before completing the snapshot update", async () => {
  for (const photography of [true, false]) {
    const run = navigation({ photography });
    assert.equal(run.started, 1);
    assert.equal(run.click.defaultPrevented, true);
    assert.deepEqual(run.pushed, [photography ? "/" : "/photography"]);
    let updated = false;
    run.update.then(() => { updated = true; });
    await Promise.resolve();
    assert.equal(updated, false);
    run.finishTransitionUpdate.current();
    await run.update;
    assert.equal(run.timers.size, 0);
    run.complete();
    await run.animation.finished;
  }
});

test("reduced motion, unsupported browsers, keyboard activation, and modified clicks retain normal link navigation", () => {
  for (const options of [
    { supported: false }, { reduced: true }, { event: { detail: 0 } },
    ...["ctrlKey", "metaKey", "shiftKey", "altKey", "defaultPrevented"].map(key => ({ event: { [key]: true } })),
    { event: { button: 1 } },
  ]) {
    const run = navigation(options);
    assert.equal(run.started, 0);
    assert.equal(Boolean(run.click.defaultPrevented), Boolean(options.event?.defaultPrevented));
    assert.deepEqual(run.pushed, []);
    assert.equal(run.timers.size, 0);
  }
});

test("a stalled route releases the snapshot instead of leaving the screen frozen", async () => {
  const run = navigation();
  const timer = run.timers.get(1);
  assert.equal(timer.delay, 4000);
  timer.callback();
  await run.update;
  run.complete();
  await run.animation.finished;
});
