import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig = (phase: string): NextConfig => ({
  // A production build must not overwrite a running dev server's modules.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  trailingSlash: Boolean(process.env.NEXT_PUBLIC_BASE_PATH),
  outputFileTracingRoot: __dirname,
  images: { unoptimized: true },
});

export default nextConfig;
