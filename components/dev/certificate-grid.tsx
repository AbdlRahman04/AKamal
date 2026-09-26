import Image from "next/image";
import type { DevCertificate } from "@/data/dev";

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

function wrapTitle(value: string, maxLength = 38) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function placeholderImage(certificate: DevCertificate) {
  const titleLines = wrapTitle(certificate.name);
  const titleMarkup = titleLines.map((line, index) => `<tspan x="92" dy="${index === 0 ? 0 : 58}">${escapeXml(line)}</tspan>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="740" viewBox="0 0 960 740">
    <defs><linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8fbff"/><stop offset="1" stop-color="#e8eff8"/></linearGradient><linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#58a6ff"/><stop offset="1" stop-color="#71e5ff"/></linearGradient></defs>
    <rect width="960" height="740" fill="url(#paper)"/><rect x="22" y="22" width="916" height="696" rx="20" fill="none" stroke="#a8bbd1" stroke-width="2"/><path d="M64 80h832" stroke="url(#accent)" stroke-width="8" stroke-linecap="round"/>
    <text x="92" y="132" fill="#3173b8" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="4">ILLUSTRATIVE PREVIEW</text>
    <text x="92" y="206" fill="#68788e" font-family="Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="3">CREDENTIAL OVERVIEW</text>
    <text x="92" y="268" fill="#14243a" font-family="Arial,sans-serif" font-size="28" font-weight="600">${escapeXml(certificate.issuer)}</text>
    <path d="M92 296h776" stroke="#cfdae7" stroke-width="2"/>
    <text x="92" y="378" fill="#102037" font-family="Arial,sans-serif" font-size="43" font-weight="700">${titleMarkup}</text>
    <circle cx="820" cy="550" r="58" fill="#edf5ff" stroke="#58a6ff" stroke-width="3"/><circle cx="820" cy="550" r="43" fill="none" stroke="#a6c8ee" stroke-width="2"/><path d="M800 551l14 14 29-33" fill="none" stroke="#3173b8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="92" y="594" fill="#68788e" font-family="Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="3">ISSUER</text>
    <text x="92" y="632" fill="#14243a" font-family="Arial,sans-serif" font-size="23">${escapeXml(certificate.issuer)}</text>
    <text x="92" y="682" fill="#68788e" font-family="Arial,sans-serif" font-size="18">${escapeXml(certificate.year)} · Illustrative preview, not an official certificate scan</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function CertificateGrid({ certificates }: { certificates: DevCertificate[] }) {
  if (!certificates.length) return null;

  return (
    <div className="ds-certificate-showcase">
      <ul className="ds-certificate-grid" aria-label="Certificates">
        {certificates.map((certificate) => {
          const isPreview = !certificate.imageUrl;
          const image = certificate.imageUrl || placeholderImage(certificate);
          const externalCredential = certificate.credentialUrl.startsWith("http");

          return (
            <li className="ds-certificate-item" key={certificate.slug}>
              <article className="ds-certificate-card">
                <div className="ds-certificate-image-wrap">
                  <Image
                    className="ds-certificate-image"
                    src={image}
                    alt={isPreview ? `${certificate.name}, illustrative credential preview` : `${certificate.name} certificate scan`}
                    width={960}
                    height={740}
                    unoptimized
                  />
                  {isPreview && <span className="ds-certificate-preview-label">Illustrative preview</span>}
                </div>
                <div className="ds-certificate-card-content">
                  <div className="ds-certificate-card-meta">
                    <span>{certificate.number} <i aria-hidden="true">/</i> CERTIFICATE</span>
                    <span className="ds-certificate-card-year">{certificate.year}</span>
                  </div>
                  <h3>{certificate.name}</h3>
                  <p className="ds-certificate-card-issuer">{certificate.issuer}</p>
                  {certificate.description && <p className="ds-certificate-card-description">{certificate.description}</p>}
                  {certificate.credentialUrl && (
                    <a className="ds-certificate-verify" href={certificate.credentialUrl} {...(externalCredential ? { target: "_blank", rel: "noreferrer" } : {})}>
                      Verify credential <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
