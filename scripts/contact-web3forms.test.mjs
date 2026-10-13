import test from "node:test";
import assert from "node:assert/strict";
import { submitContact, validateContactFields } from "../components/site/contact-service.mjs";

const fields = { name: "Ada", email: "ada@example.com", subject: "Hello", message: "A project inquiry", inquiryType: "project", website: "" };
test("Web3Forms receives only intended fields, labeled subject and captcha", async () => {
  let sent;
  const result = await submitContact({ ...fields, to: "private@example.com" }, "photography", "public-form-key", "captcha-token", undefined, async (url, options) => {
    assert.equal(url, "https://api.web3forms.com/submit"); sent = JSON.parse(options.body);
    return Response.json({ success: true });
  });
  assert.equal(result.ok, true); assert.equal(sent.access_key, "public-form-key"); assert.equal(sent.subject, "[Portfolio] [Photography] Hello"); assert.equal(sent.from_name, "Portfolio inquiries"); assert.equal(sent.email, fields.email); assert.equal(sent.replyto, fields.email); assert.equal(sent["h-captcha-response"], "captcha-token"); assert.equal(sent.botcheck, false); assert.equal(sent.to, undefined); assert.equal(JSON.stringify(sent).includes("private@example.com"), false);
});
test("optional subject falls back to type or new inquiry", async () => {
  for (const [inquiryType, expected] of [["role", "A role"], ["", "New inquiry"]]) {
    await submitContact({ ...fields, subject: "", inquiryType }, "dev", "key", "token", undefined, async (_, options) => {
      assert.equal(JSON.parse(options.body).subject, `[Portfolio] [Dev] ${expected}`); return Response.json({ success: true });
    });
  }
});
test("invalid fields, honeypot, missing key or captcha never reach the API", async () => {
  const fetchImpl = () => { assert.fail("Unexpected API call"); };
  for (const [input, key, token] of [[{ ...fields, name: "" }, "key", "token"], [{ ...fields, email: "a@example.com,b@example.com" }, "key", "token"], [{ ...fields, subject: "Hi\nBcc: bad" }, "key", "token"], [{ ...fields, message: "x".repeat(5001) }, "key", "token"], [{ ...fields, website: "spam" }, "key", "token"], [fields, "", "token"], [fields, "key", ""]]) {
    assert.equal((await submitContact(input, "dev", key, token, undefined, fetchImpl)).ok, false);
  }
  assert.equal(Object.keys(validateContactFields(fields)).length, 0);
});
test("HTTP errors and provider rejection never report success", async () => {
  for (const response of [Response.json({ success: false, message: "provider detail" }), Response.json({ success: true }, { status: 429 })]) {
    const result = await submitContact(fields, "dev", "key", "token", undefined, async () => response); assert.equal(result.ok, false); assert.equal(result.message.includes("provider detail"), false);
  }
});
test("network failure makes one request and never retries automatically", async () => {
  let calls = 0;
  const result = await submitContact(fields, "dev", "key", "token", undefined, async () => { calls++; throw new Error("network"); });
  assert.equal(calls, 1); assert.equal(result.ok, false); assert.match(result.message, /could not confirm delivery/);
});
