import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Workers deployment via @opennextjs/cloudflare
};

export default nextConfig;

// Enable Cloudflare bindings in local dev
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
