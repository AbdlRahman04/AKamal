import { randomUUID } from "node:crypto";

const MAX_BODY_BYTES = 32 * 1024;
const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
const controls = /[\x00-\x1f\x7f]/;
const inquiryLabels = { role: "A role", project: "A project", other: "Something else" };

function validate(input) {
  const fieldErrors = {};
  const value = {};
  for (const [field, max, required] of [["name", 100, true], ["email", 254, true], ["subject", 160, false], ["message", 5000, true]]) {
    const raw = input[field] === undefined ? (required ? null : "") : input[field];
    if (typeof raw !== "string" || raw.length > max || (required && !raw.trim())) fieldErrors[field] = `${required ? "Enter" : "Check"} your ${field} (${max} characters maximum).`;
    else if (field !== "message" && controls.test(raw)) fieldErrors[field] = "Use a single line without control characters.";
    value[field] = typeof raw === "string" ? raw.trim() : "";
  }
  if (!emailPattern.test(value.email)) fieldErrors.email = "Enter a valid email address.";
  if (!["dev", "photography"].includes(input.source)) fieldErrors.source = "Choose a valid portfolio section.";
  if (input.inquiryType !== undefined && (typeof input.inquiryType !== "string" || (input.inquiryType !== "" && !Object.hasOwn(inquiryLabels, input.inquiryType)))) fieldErrors.inquiryType = "Choose a valid inquiry type.";
  value.source = input.source;
  value.inquiryType = input.inquiryType || "";
  return { value, fieldErrors };
}

async function readJson(request) {
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) throw Object.assign(new Error(), { status: 413 });
  const reader = request.body?.getReader();
  if (!reader) throw Object.assign(new Error(), { status: 400 });
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); throw Object.assign(new Error(), { status: 413 }); }
      chunks.push(Buffer.from(value));
    }
    const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error();
    return input;
  } catch (error) { throw Object.assign(error, { status: error.status || 400 }); }
  finally { reader.releaseLock(); }
}

export function createContactHandler({ env, createTransport, fetchImpl = fetch, logger = entry => console.log(JSON.stringify(entry)), smtpDeadlineMs = 20000 }) {
  return async function contact(request) {
    const requestId = randomUUID();
    const origin = request.headers.get("origin");
    const origins = (env.ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);
    const headers = { "Cache-Control": "no-store", Vary: "Origin" };
    const finish = (status, code, message, fieldErrors) => {
      logger({ requestId, outcome: code || "accepted" });
      return Response.json(status === 200 ? { ok: true } : { ok: false, code, message, ...(fieldErrors ? { fieldErrors } : {}) }, { status, headers });
    };
    if (!origin || !origins.includes(origin) || origin === "null") return finish(403, "origin", "This website is not allowed to submit inquiries.");
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") { headers.Allow = "POST, OPTIONS"; return finish(405, "method", "Use the contact form to send an inquiry."); }
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return finish(415, "content_type", "Submit the form as JSON.");
    let input;
    try { input = await readJson(request); }
    catch (error) { return finish(error.status, "body", error.status === 413 ? "Your inquiry is too large." : "The inquiry could not be read."); }
    const { value, fieldErrors } = validate(input);
    if (Object.keys(fieldErrors).length) return finish(400, "validation", "Please check the highlighted fields.", fieldErrors);
    if ((input.website !== undefined && input.website !== "") || typeof input.turnstileToken !== "string" || !input.turnstileToken || input.turnstileToken.length > 2048) return finish(403, "challenge", "Please complete the security check again.");
    if (!env.GMAIL_USER || !emailPattern.test(env.GMAIL_USER) || !env.GMAIL_APP_PASSWORD || !env.TURNSTILE_SECRET_KEY) return finish(503, "unavailable", "Contact is temporarily unavailable. Please try again later.");
    try {
      const verification = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST", body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: input.turnstileToken }), signal: AbortSignal.timeout(5000)
      });
      if (!verification.ok) throw new Error();
      const challenge = await verification.json();
      if (!challenge.success || challenge.hostname !== new URL(origin).hostname || challenge.action !== "contact") return finish(403, "challenge", "Please complete the security check again.");
    } catch { return finish(503, "verification_unavailable", "The security check is unavailable. Please try again."); }
    const subject = value.subject || inquiryLabels[value.inquiryType] || "New inquiry";
    let transport;
    let deadline;
    try {
      transport = createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000, disableFileAccess: true, disableUrlAccess: true });
      const result = await Promise.race([
        transport.sendMail({ from: { name: "Portfolio inquiries", address: env.GMAIL_USER }, to: env.GMAIL_USER, replyTo: { address: value.email, name: value.name }, subject: `[Portfolio] [${value.source === "dev" ? "Dev" : "Photography"}] ${subject}`, priority: "high", text: `Portfolio inquiry\n\nName: ${value.name}\nEmail: ${value.email}\nSubject: ${subject}\nInquiry type: ${inquiryLabels[value.inquiryType] || "Not specified"}\nSection: ${value.source}\nSubmitted: ${new Date().toISOString()}\n\n${value.message}` }),
        new Promise((_, reject) => { deadline = setTimeout(() => { transport.close(); reject(new Error("deadline")); }, smtpDeadlineMs); })
      ]);
      if (!result.accepted?.includes(env.GMAIL_USER) || result.rejected?.length) throw new Error();
      return finish(200);
    } catch { return finish(503, "delivery_uncertain", "We could not confirm delivery. Your message may have been sent; please wait before trying again."); }
    finally { clearTimeout(deadline); transport?.close(); }
  };
}
