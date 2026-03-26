import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable Turbopack to avoid Windows-specific crashes
  reactStrictMode: true,
};

export default nextConfig;
