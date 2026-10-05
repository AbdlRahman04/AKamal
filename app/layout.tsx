import { basePath, publicPath } from "@/components/site/public-path";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../components/dev/dev.css";
import "../components/dev/bento.css";
import SiteChrome from "@/components/site/site-chrome";

export const metadata: Metadata = {
  title: "Abdul Rahman Kamal — Software / Data / AI",
  description: "Computer Science graduate focused on software engineering, AI applications, and data integration.",
  icons: {
    icon: publicPath("/assets/dev-logo.png"),
  },
  openGraph: {
    title: "Abdul Rahman Kamal — Software / Data / AI",
    description: "Computer Science graduate focused on software engineering, AI applications, and data integration.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Abdul Rahman Kamal — Software / Data / AI",
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
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
