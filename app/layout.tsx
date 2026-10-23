import { basePath, publicPath } from "@/components/site/public-path";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../components/site/contact.css";
import "../components/dev/dev.css";
import "../components/dev/bento.css";
import SiteChrome from "@/components/site/site-chrome";
import { portfolioSeo } from "@/data/dev";

export const metadata: Metadata = {
  metadataBase: new URL(portfolioSeo.url),
  alternates: { canonical: publicPath("/") },
  title: "Abdulrahman Kamal — Software / Data / AI",
  description: "Computer Science graduate focused on software engineering, AI applications, and data integration.",
  icons: {
    icon: publicPath("/assets/dev-logo.png"),
  },
  openGraph: {
    title: "Abdulrahman Kamal — Software / Data / AI",
    images: [publicPath(portfolioSeo.image)],
    description: "Computer Science graduate focused on software engineering, AI applications, and data integration.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Abdulrahman Kamal — Software / Data / AI",
    images: [publicPath(portfolioSeo.image)],
    description: "Computer Science graduate focused on software engineering, AI applications, and data integration.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body data-theme="dev" data-dev-mode="light" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.location.pathname.indexOf(${JSON.stringify(`${basePath}/photography`)})===0){var mode=window.localStorage.getItem("photography-theme");document.body.dataset.photographyMode=mode==="light"?"light":"dark";}else{document.body.dataset.devMode=window.localStorage.getItem("dev-theme")==="dark"?"dark":"light";}}catch(_){document.body.dataset.photographyMode="dark";document.body.dataset.devMode="light";}})();`,
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: `(function(){
          function update(){
            var header=document.querySelector('.shared-site-header');
            if(header)header.dataset.scrolled=String(window.scrollY>24);
          }
          function cleanup(){
            window.removeEventListener('scroll',update);
            window.removeEventListener('pageshow',update);
            document.removeEventListener('DOMContentLoaded',update);
          }
          window.addEventListener('scroll',update,{passive:true});
          window.addEventListener('pageshow',update);
          document.addEventListener('DOMContentLoaded',update);
          window.addEventListener('portfolio-header-ready',cleanup,{once:true});
          update();
        })();` }} />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
