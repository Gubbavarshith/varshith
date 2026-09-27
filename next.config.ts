import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every route is static: `next build` writes plain files to out/, which Cloudflare Pages serves
  // (deployed by .github/workflows/deploy.yml).
  output: "export",
  // No image server on a static host. The only raster images (the hero portraits) ship pre-sized as WebP.
  images: { unoptimized: true },
  // Lets the dev server serve its assets through an ngrok tunnel.
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app"],
};

export default nextConfig;
