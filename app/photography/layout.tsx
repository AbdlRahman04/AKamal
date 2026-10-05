import { publicPath } from "@/components/site/public-path";
import type { Metadata } from "next";
import "../../components/photography/photography.css";

export const metadata: Metadata = {
  title: "Abdul Rahman Kamal | Photo",
  description: "A visual journal of motion, atmosphere, and place.",
  icons: {
    icon: publicPath("/assets/photo-logo.png"),
  },
  openGraph: {
    title: "Abdul Rahman Kamal | Photo",
    description: "A visual journal of motion, atmosphere, and place.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Abdul Rahman Kamal | Photo",
    description: "A visual journal of motion, atmosphere, and place.",
  },
};

export default function PhotographyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div data-theme="photography">{children}</div>;
}
