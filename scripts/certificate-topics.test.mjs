import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDevCollectionItem } from "../api/routes/dev.mjs";

test("certificate topics survive admin create, partial edits, and export/import normalization", () => {
  const created = normalizeDevCollectionItem("certificates", { name: "Cloud fundamentals", topic: "  Cloud  ", status: "completed", credentialUrl: "https://example.com/credential", imageUrl: "/dev/certificate.webp" });
  assert.equal(created.topic, "Cloud");
  const edited = normalizeDevCollectionItem("certificates", { description: "Updated" }, created);
  assert.equal(edited.topic, "Cloud");
  const imported = normalizeDevCollectionItem("certificates", JSON.parse(JSON.stringify(edited)));
  assert.equal(imported.topic, "Cloud");
  assert.equal(imported.imageUrl, created.imageUrl);
  assert.equal(imported.credentialUrl, created.credentialUrl);
  assert.equal(normalizeDevCollectionItem("certificates", { topic: "" }, created).topic, "");
});

test("older certificates without topics remain editable", () => {
  assert.equal(normalizeDevCollectionItem("certificates", { name: "Existing certificate" }).topic, "");
});
