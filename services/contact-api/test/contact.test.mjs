import test from "node:test";
import assert from "node:assert/strict";
import { createContactHandler } from "../lib/contact.mjs";

const origin = "https://portfolio.example";
const env = { GMAIL_USER: "owner@gmail.com", GMAIL_APP_PASSWORD: "private-password", TURNSTILE_SECRET_KEY: "private-key", ALLOWED_ORIGINS: origin };
const payload = { name: "Ada", email: "ada@example.com", subject: "Hello", message: "A project inquiry.", source: "dev", turnstileToken: "token", website: "" };
function setup(options = {}) {
  const sent = []; const logs = []; let closed = false;
  const handler = createContactHandler({ env, logger: entry => logs.push(entry), fetchImpl: async () => Response.json({ success: true, hostname: "portfolio.example", action: "contact" }), createTransport: () => ({ sendMail: async mail => { sent.push(mail); return { accepted: [env.GMAIL_USER], rejected: [] }; }, close: () => { closed = true; } }), ...options });
  const request = (body = payload, headers = {}, method = "POST") => handler(new Request("https://backend.example/api/contact", { method, headers: { Origin: origin, "Content-Type": "application/json", ...headers }, ...(method === "POST" ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}) }));
  return { request, sent, logs, isClosed: () => closed };
}
test("accepted mail uses private fixed recipient, visitor reply-to and high priority", async () => {
  const s = setup(); const response = await s.request({ ...payload, to: "attacker@example.com", from: "attacker@example.com" });
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { ok: true });
  assert.equal(s.sent.length, 1); const mail = s.sent[0];
  assert.equal(mail.to, env.GMAIL_USER); assert.equal(mail.from.address, env.GMAIL_USER); assert.equal(mail.replyTo.address, payload.email); assert.equal(mail.priority, "high"); assert.equal(mail.subject, "[Portfolio] [Dev] Hello"); assert.match(mail.text, /A project inquiry/); assert.equal(mail.html, undefined);
  assert.equal(JSON.stringify(s.logs).includes(payload.email), false);
});
test("subject falls back to inquiry type and source is validated", async () => {
  const s = setup(); await s.request({ ...payload, subject: "", inquiryType: "project", source: "photography" });
  assert.equal(s.sent[0].subject, "[Portfolio] [Photography] A project");
  assert.equal((await s.request({ ...payload, source: "fake" })).status, 400);
});
test("exact origins and preflight are enforced before sending", async () => {
  const s = setup();
  for (const value of ["", "null", "https://portfolio.example.evil"]) assert.equal((await s.request(payload, { Origin: value })).status, 403);
  const preflight = await s.request(payload, {}, "OPTIONS"); assert.equal(preflight.status, 204); assert.equal(preflight.headers.get("access-control-allow-origin"), origin); assert.equal(s.sent.length, 0);
  assert.equal((await s.request(payload, {}, "GET")).status, 405);
});
test("malformed JSON, media type and streamed size limit are rejected", async () => {
  const s = setup(); assert.equal((await s.request("{")).status, 400);
  assert.equal((await s.request(payload, { "Content-Type": "text/plain" })).status, 415);
  assert.equal((await s.request(" ".repeat(32769))).status, 413); assert.equal(s.sent.length, 0);
});
test("required fields, single email address, lengths and header injection are rejected", async () => {
  const s = setup();
  for (const patch of [{ name: " " }, { email: "a@example.com,b@example.com" }, { email: "Ada <a@example.com>" }, { message: "" }, { name: "a".repeat(101) }, { subject: "a".repeat(161) }, { message: "a".repeat(5001) }, { name: "Ada\r\nBcc: evil" }, { subject: "Hi\nBcc: evil" }, { inquiryType: "bad" }, { inquiryType: ["project"] }, { subject: null }]) {
    const response = await s.request({ ...payload, ...patch }); assert.equal(response.status, 400, JSON.stringify(patch)); assert.equal((await response.json()).ok, false);
  }
  assert.equal(s.sent.length, 0);
  assert.equal((await s.request({ ...payload, name: "آدم", message: "Line one\nLine two" })).status, 200);
});
test("honeypot and missing token never send mail", async () => {
  const s = setup(); assert.equal((await s.request({ ...payload, website: "spam" })).status, 403); assert.equal((await s.request({ ...payload, turnstileToken: "" })).status, 403); assert.equal(s.sent.length, 0);
});
test("failed, expired, replayed and mismatched challenges never send mail", async () => {
  for (const challenge of [{ success: false, "error-codes": ["timeout-or-duplicate"] }, { success: true, hostname: "evil.example", action: "contact" }, { success: true, hostname: "portfolio.example", action: "login" }]) {
    const s = setup({ fetchImpl: async () => Response.json(challenge) }); assert.equal((await s.request()).status, 403); assert.equal(s.sent.length, 0);
  }
});
test("provider failures are generic and missing configuration fails closed", async () => {
  for (const options of [{ env: { ...env, GMAIL_APP_PASSWORD: "" } }, { fetchImpl: async () => { throw new Error("private-key"); } }, { createTransport: () => { throw new Error("private-password"); } }, { createTransport: () => ({ sendMail: async () => { throw new Error("private-password"); }, close() {} }) }, { createTransport: () => ({ sendMail: async () => ({ accepted: [], rejected: [env.GMAIL_USER] }), close() {} }) }]) {
    const s = setup(options); const response = await s.request(); assert.equal(response.status, 503); const text = await response.text(); assert.equal(text.includes("private"), false); assert.equal(text.includes(env.GMAIL_USER), false);
  }
});
test("SMTP deadline closes transport and reports uncertain delivery", async () => {
  let closed = false;
  const s = setup({ smtpDeadlineMs: 5, createTransport: () => ({ sendMail: () => new Promise(() => {}), close: () => { closed = true; } }) });
  const response = await s.request(); assert.equal(response.status, 503); assert.equal(closed, true);
});
