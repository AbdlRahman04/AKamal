import DevHome from "@/components/dev/dev-home";
import type { Metadata, Viewport } from "next";
import { devEducation, devProfile, portfolioSeo } from "@/data/dev";
import { publicPath } from "@/components/site/public-path";

const title = `${devProfile.name} — Software / Data / AI`;
export const metadata: Metadata = {
  title, description: devProfile.intro, authors: [{ name: devProfile.name }],
  openGraph: { title, description: devProfile.intro, type: "website", images: [publicPath(portfolioSeo.image)] },
  twitter: { card: "summary", title, description: devProfile.intro, images: [publicPath(portfolioSeo.image)] },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f2f6f7" }, { media: "(prefers-color-scheme: dark)", color: "#111d22" }],
};

export default function DevPage() {
  const person = {
    "@context": "https://schema.org", "@type": "Person", name: devProfile.name,
    jobTitle: devProfile.role, homeLocation: { "@type": "Place", name: devProfile.location },
    ...(devEducation.length ? { alumniOf: devEducation.map(item => ({ "@type": "CollegeOrUniversity", name: item.institution })) } : {}),
    sameAs: devProfile.links.filter(link => /^https?:\/\//.test(link.href)).map(link => link.href),
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replace(/</g, "\\u003c") }} /><DevHome /></>;
}
