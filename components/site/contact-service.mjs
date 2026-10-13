const labels = { role: "A role", project: "A project", other: "Something else" };
const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

export function validateContactFields(fields) {
  const errors = {};
  for (const [field, max, required] of [["name", 100, true], ["email", 254, true], ["subject", 160, false], ["message", 5000, true]]) {
    if (typeof fields[field] !== "string" || (required && !fields[field].trim()) || fields[field].length > max) errors[field] = `Please enter your ${field} (${max} characters maximum).`;
    else if (field !== "message" && /[\x00-\x1f\x7f]/.test(fields[field])) errors[field] = "Use a single line without control characters.";
  }
  if (!emailPattern.test(String(fields.email || "").trim())) errors.email = "Enter a valid email address.";
  if (fields.inquiryType && !Object.hasOwn(labels, fields.inquiryType)) errors.inquiryType = "Choose a valid inquiry type.";
  return errors;
}

export async function submitContact(fields, source, accessKey, token, signal, fetchImpl = fetch) {
  const fieldErrors = validateContactFields(fields);
  if (Object.keys(fieldErrors).length) return { ok: false, message: "Please check the highlighted fields.", fieldErrors };
  if (!accessKey || !token || fields.website || !["dev", "photography"].includes(source)) return { ok: false, message: "Please complete the security check before sending." };
  const section = source === "dev" ? "Dev" : "Photography";
  try {
    const response = await fetchImpl("https://api.web3forms.com/submit", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, signal,
      body: JSON.stringify({ access_key: accessKey, name: fields.name.trim(), email: fields.email.trim(), replyto: fields.email.trim(), subject: `[Portfolio] [${section}] ${fields.subject.trim() || labels[fields.inquiryType] || "New inquiry"}`, from_name: "Portfolio inquiries", message: fields.message.trim(), inquiry_type: labels[fields.inquiryType] || "Not specified", portfolio_section: section, "h-captcha-response": token, botcheck: false })
    });
    const result = await response.json();
    if (response.ok && result.success === true) return { ok: true, message: "Your message has been sent. Thank you for getting in touch." };
    return { ok: false, message: response.status === 429 ? "Too many inquiries have been sent. Please try again later." : "Your message could not be sent. Please try again later." };
  } catch { return { ok: false, message: "We could not confirm delivery. Your message may have been sent; please wait before trying again." }; }
}
