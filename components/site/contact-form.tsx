"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState, type FormEvent } from "react";
import { submitContact, validateContactFields } from "./contact-service.mjs";
import { devProfile } from "@/data/dev";

type Fields = { name: string; email: string; subject: string; message: string; inquiryType: string; website: string };
type HCaptcha = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global { interface Window { hcaptcha?: HCaptcha; portfolioHcaptchaReady?: () => void } }
export type ContactFormHandle = { startInquiry: (subject: string) => void };
const empty: Fields = { name: "", email: "", subject: "", message: "", inquiryType: "", website: "" };
const accessKey = (process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || "").trim();
// Web3Forms' shared free-plan hCaptcha site key; no separate captcha account.
const siteKey = "50b2fe65-b00b-4b9e-ad62-3ba471098be2";
const configured = Boolean(accessKey && process.env.NEXT_PUBLIC_VERCEL_ENV !== "preview");
const fallbackContact = devProfile.links.find(link => link.label === "LinkedIn");
let challengeScript: Promise<void> | undefined;

function loadChallenge() {
  if (window.hcaptcha) return Promise.resolve();
  if (!challengeScript) challengeScript = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=off&onload=portfolioHcaptchaReady";
    script.async = true;
    const timer = window.setTimeout(() => { script.remove(); reject(new Error("timeout")); }, 12000);
    window.portfolioHcaptchaReady = () => { window.clearTimeout(timer); if (window.hcaptcha) resolve(); else reject(new Error("unavailable")); };
    script.onerror = () => { window.clearTimeout(timer); script.remove(); reject(new Error("unavailable")); };
    document.head.appendChild(script);
  }).catch(error => { challengeScript = undefined; throw error; });
  return challengeScript;
}

const ContactForm = forwardRef<ContactFormHandle, { source: "dev" | "photography" }>(function ContactForm({ source }, ref) {
  const id = useId();
  const [fields, setFields] = useState<Fields>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [token, setToken] = useState("");
  const [challengeError, setChallengeError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [sent, setSent] = useState(false);
  const successPanel = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const subjectInput = useRef<HTMLInputElement>(null);
  const widget = useRef<string | null>(null);
  const submitting = useRef(false);
  const activeRequest = useRef<AbortController | null>(null);
  useImperativeHandle(ref, () => ({ startInquiry(subject) {
    setSent(false); setStatus("");
    setFields(previous => ({ ...previous, subject: subject.slice(0, 160), inquiryType: "project" }));
    subjectInput.current?.focus({ preventScroll: true });
  } }), []);
  useEffect(() => () => activeRequest.current?.abort(), []);
  useEffect(() => { if (sent) successPanel.current?.focus(); }, [sent]);
  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    setToken(""); setChallengeError(false);
    loadChallenge().then(() => {
      if (cancelled || !container.current || !window.hcaptcha) return;
      widget.current = window.hcaptcha.render(container.current, {
        sitekey: siteKey, theme: "light", size: "compact",
        callback: (value: string) => { if (!cancelled) { setToken(value); setChallengeError(false); } },
        "expired-callback": () => { if (!cancelled) setToken(""); },
        "error-callback": () => { if (!cancelled) { setToken(""); setChallengeError(true); } return true; }
      });
    }).catch(() => { if (!cancelled) setChallengeError(true); });
    return () => { cancelled = true; if (widget.current !== null) window.hcaptcha?.remove(widget.current); widget.current = null; };
  }, [attempt]);

  function change(field: keyof Fields, value: string) {
    setFields(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
    setStatus("");
    setSent(false);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !configured || !token || challengeError) return;
    setSent(false);
    const fieldErrors = validateContactFields(fields);
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors); setStatus("Please check the highlighted fields.");
      event.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(fieldErrors)[0]}"]`)?.focus();
      setToken(""); if (widget.current !== null) window.hcaptcha?.reset(widget.current);
      return;
    }
    submitting.current = true; setSending(true); setStatus("Sending your message…");
    const controller = new AbortController(); activeRequest.current = controller;
    const timer = window.setTimeout(() => controller.abort(), 35000);
    try {
      const result = await submitContact(fields, source, accessKey, token, controller.signal);
      setSent(result.ok);
      if (result.ok) { setFields(empty); setErrors({}); }
      else setErrors(result.fieldErrors || {});
      setStatus(result.message);
    } catch { setStatus("We could not confirm delivery. Your message may have been sent; please wait before trying again."); }
    finally {
      window.clearTimeout(timer); activeRequest.current = null; submitting.current = false; setSending(false); setToken("");
      if (widget.current !== null) window.hcaptcha?.reset(widget.current);
    }
  }
  function field(name: "name" | "email" | "subject", label: string, placeholder: string, maxLength: number) {
    return <label className="contact-field" htmlFor={`${id}-${name}`}><span>{label}</span><input ref={name === "subject" ? subjectInput : undefined} id={`${id}-${name}`} name={name} type={name === "email" ? "email" : "text"} autoComplete={name === "subject" ? "off" : name} required={name !== "subject"} maxLength={maxLength} value={fields[name]} onChange={event => change(name, event.target.value)} placeholder={placeholder} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${id}-${name}-error` : undefined} />{errors[name] && <small className="contact-error" id={`${id}-${name}-error`}>{errors[name]}</small>}</label>;
  }
  return <form className="contact-form" onSubmit={submit} noValidate aria-labelledby={`${id}-heading`} aria-busy={sending}>
    <div className="contact-form-heading"><p>A note, directly to me</p><span aria-hidden="true">↗</span></div>
    <h3 id={`${id}-heading`}>What do you have in mind?</h3>
    <fieldset className="contact-fields" disabled={sending}>
      <div className="contact-field-row">{field("name", "Your name", "How should I call you?", 100)}{field("email", "Your email", "you@company.com", 254)}</div>
      <fieldset className="contact-reasons"><legend>I’m reaching out about <span>(optional)</span></legend><div>{[["role", "A role"], ["project", "A project"], ["other", "Something else"]].map(([value, label]) => <label key={value}><input type="radio" name="inquiryType" value={value} checked={fields.inquiryType === value} onChange={() => change("inquiryType", value)} /><span>{label}</span></label>)}</div></fieldset>
      {field("subject", "Subject (optional)", "A little context", 160)}
      <label className="contact-field" htmlFor={`${id}-message`}><span>Your message</span><textarea id={`${id}-message`} name="message" rows={5} required maxLength={5000} placeholder="What should I know before I reply?" value={fields.message} onChange={event => change("message", event.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? `${id}-message-error` : undefined} />{errors.message && <small className="contact-error" id={`${id}-message-error`}>{errors.message}</small>}</label>
      <div className="contact-honeypot" aria-hidden="true"><label>Website<input name="website" value={fields.website} onChange={event => change("website", event.target.value)} tabIndex={-1} autoComplete="off" /></label></div>
    </fieldset>
    <div ref={container} className="contact-challenge" />
    <div role="status" aria-live="polite" aria-atomic="true">
      {!configured && <p className="contact-status">Contact is temporarily unavailable. Please try again later.{fallbackContact?.href && <> You can also <a href={fallbackContact.href} target="_blank" rel="noreferrer">contact me on LinkedIn</a>.</>}</p>}
      {configured && !token && !challengeError && !sent && !status && <p className="contact-status">Please complete the security check before sending.</p>}
      {challengeError && <p className="contact-status">The security check could not load. <button className="contact-retry" type="button" disabled={sending} onClick={() => setAttempt(previous => previous + 1)}>Try again</button>{fallbackContact?.href && <> Or <a href={fallbackContact.href} target="_blank" rel="noreferrer">contact me on LinkedIn</a>.</>}</p>}
      {sent ? <div className="contact-success" ref={successPanel} tabIndex={-1} aria-labelledby={`${id}-success-title`} aria-describedby={`${id}-success-detail`}>
        <span className="contact-success-check" aria-hidden="true">✓</span>
        <div><strong id={`${id}-success-title`}>Message sent successfully</strong><p id={`${id}-success-detail`}>Thank you for getting in touch.</p></div>
      </div> : <p className="contact-status">{status}</p>}
    </div>
    <div className="contact-form-bottom"><button className="contact-submit" type="submit" disabled={sending || !configured || !token || challengeError}>{sending ? "Sending…" : "Send message"}<span aria-hidden="true">↗</span></button></div>
  </form>;
});

export default ContactForm;
