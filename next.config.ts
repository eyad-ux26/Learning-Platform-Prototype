import type { NextConfig } from "next";

/**
 * STATIC_EXPORT=1 builds a static site for GitHub Pages (see .github/workflows/pages.yml).
 * NEXT_PUBLIC_BASE_PATH is the sub-path the site is served from, e.g. /Learning-Platform-Prototype.
 */
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(staticExport && { output: "export", trailingSlash: true, images: { unoptimized: true } }),
  ...(basePath && { basePath }),
};

export default nextConfig;
