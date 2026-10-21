"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import { publicPath } from "@/components/site/public-path";
import type { DevCertificate } from "@/data/dev";
import "./certificate-collection.css";

const collapsedCount = 8;
const topicColors: Record<string, string> = { AI: "#9b8cf8", Data: "#58a6ff", Software: "#58b889", Photography: "#d6a23f", Cloud: "#ef7d9c" };

export default function CertificateCollection({ certificates, dialogId, headingId, onOpen }: {
  certificates: DevCertificate[];
  dialogId: string;
  headingId: string;
  onOpen: (certificate: DevCertificate, button: HTMLButtonElement) => void;
}) {
  const [topic, setTopic] = useState("");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const getTopic = (item: DevCertificate) => item.topic?.trim() || "Other";
  const topics = [...new Set(certificates.map(getTopic))];
  const completed = certificates.filter(item => item.status === "completed").length;
  const search = query.trim().toLowerCase();
  const filtered = certificates.filter(item => (!topic || getTopic(item) === topic) && `${item.name} ${item.issuer}`.toLowerCase().includes(search))
    .sort((a, b) => Number(b.status === "in-progress") - Number(a.status === "in-progress") || (Number.parseInt(b.year, 10) || 0) - (Number.parseInt(a.year, 10) || 0));
  const shown = expanded ? filtered : filtered.slice(0, collapsedCount);
  const scrollable = expanded && filtered.length > collapsedCount;

  function resetList() {
    setExpanded(false);
    list.current?.scrollTo({ top: 0 });
  }

  return <div className="ds-certificates" aria-labelledby={headingId}>
    <div className="ds-certificates-top">
      <p className="ds-certificates-summary">{certificates.length} total <span aria-hidden="true">·</span> {completed} completed <span aria-hidden="true">·</span> {certificates.length - completed} in progress</p>
      <label className="ds-certificates-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
        <input type="search" aria-label="Search certificates" placeholder="Search" value={query} onChange={event => { setQuery(event.target.value); resetList(); }} />
      </label>
    </div>
    <div className="ds-certificates-topics" role="group" aria-label="Filter certificates by topic">
      {["", ...topics].map(value => <button type="button" key={value} aria-pressed={topic === value} aria-controls={`${id}-list`} onClick={() => { setTopic(value); resetList(); }} style={{ "--certificate-color": topicColors[value] || "var(--ds-blue)" } as CSSProperties}>
        {value && <i aria-hidden="true" />}{value || "All"}<span>{value ? certificates.filter(item => getTopic(item) === value).length : certificates.length}</span>
      </button>)}
    </div>
    <ul ref={list} id={`${id}-list`} className="ds-certificates-list" data-expanded={scrollable} aria-label="Certificates" tabIndex={scrollable ? 0 : undefined}>
      {shown.map(item => <li key={item.slug} style={{ "--certificate-color": topicColors[getTopic(item)] || "var(--ds-blue)" } as CSSProperties}>
        <button type="button" className="ds-certificate-row" aria-label={`Preview ${item.name}`} aria-haspopup="dialog" aria-controls={dialogId} onClick={event => onOpen(item, event.currentTarget)}>
          <span className="ds-certificate-initials" aria-hidden="true">{item.issuer.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join("").toUpperCase()}</span>
          <span className="ds-certificate-copy"><strong title={item.name}>{item.name}</strong><span>{item.issuer} · {item.year}</span></span>
          {item.status === "in-progress" && <span className="ds-certificate-progress">In progress</span>}
        </button>
        {item.credentialUrl ? <a className="ds-certificate-verify-icon" href={publicPath(item.credentialUrl)} {...(item.credentialUrl.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})} aria-label={`Verify ${item.name}`} title="Verify credential"><span aria-hidden="true">↗</span></a>
          : <span className="ds-certificate-verify-icon is-unavailable" aria-hidden="true">↗</span>}
      </li>)}
      {!shown.length && <li className="ds-certificates-empty">No certificates match.</li>}
    </ul>
    <div className="ds-certificates-footer">
      <span role="status" aria-live="polite" aria-atomic="true">{!expanded && filtered.length > collapsedCount ? `Showing ${shown.length} of ${filtered.length}` : `${filtered.length} certificate${filtered.length === 1 ? "" : "s"}`}</span>
      {filtered.length > collapsedCount && <button type="button" aria-expanded={expanded} aria-controls={`${id}-list`} onClick={() => { setExpanded(value => !value); list.current?.scrollTo({ top: 0 }); }}>{expanded ? "Show fewer" : `Show all ${filtered.length}`}</button>}
    </div>
  </div>;
}
