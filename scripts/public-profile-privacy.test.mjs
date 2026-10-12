import test from "node:test";
import assert from "node:assert/strict";
import { assertPublicProfile } from "./public-profile-privacy.mjs";
import { readDevData, writeDevData } from "../api/routes/dev.mjs";
import { readData, writeData } from "../api/routes/photography.mjs";

test("public profiles reject private fields even when empty", () => {
  for (const profile of [{ email: "private@example.com" }, { phone: "" }, { links: [{ href: " MAILTO:person@example.com" }] }, { socialLinks: [{ href: "tel:123" }] }]) assert.throws(() => assertPublicProfile(profile), /Public profile/);
});
test("ordinary public profile information is allowed", () => {
  assert.doesNotThrow(() => assertPublicProfile({ name: "Ada", links: [{ label: "GitHub", href: "https://github.com/ada" }] }));
});
test("both canonical writers reject legacy imports without changing files", async () => {
  for (const [read, write] of [[readDevData, writeDevData], [readData, writeData]]) {
    const before = await read();
    for (const profile of [{ ...before.profile, email: "private@example.com" }, { ...before.profile, phone: "123" }, { ...before.profile, socialLinks: [{ href: "tel:123" }] }]) await assert.rejects(write({ ...before, profile }), /Public profile/);
    assert.deepEqual(await read(), before);
  }
});
