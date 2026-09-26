import type { Metadata } from "next";
import "./globals.css";
import "../components/dev/dev.css";
import SiteChrome from "@/components/site/site-chrome";

export const metadata: Metadata = {
  title: "Abdulrahman — Software / Data / AI",
  description: "Computer Science graduate focused on software engineering, AI applications, and data integration.",
  icons: {
    icon: "/assets/dev-logo.png",
  },
  openGraph: {
    title: "Abdulrahman — Software / Data / AI",
    description: "Computer Science graduate focused on software engineering, AI applications, and data integration.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Abdulrahman — Software / Data / AI",
    description: "Computer Science graduate focused on software engineering, AI applications, and data integration.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body data-theme="dev" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.location.pathname.indexOf("/photography")===0){var mode=window.localStorage.getItem("photography-theme");document.body.dataset.photographyMode=mode==="light"?"light":"dark";}}catch(_){document.body.dataset.photographyMode="dark";}})();`,
          }}
        />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
