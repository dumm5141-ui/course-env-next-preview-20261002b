import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the platform proxy to serve the app
  output: "standalone",
};

export default nextConfig;
