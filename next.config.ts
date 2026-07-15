import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // YouTube thumbnails are loaded with plain <img> tags (lite-embed pattern),
  // so no remote image domains need to be configured here.
};

export default nextConfig;
