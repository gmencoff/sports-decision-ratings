import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Set the correct workspace root to avoid lockfile detection issues
  outputFileTracingRoot: path.join(__dirname, "./"),
  // Enable source maps for debugging
  serverExternalPackages: [],
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'source-map';
    }
    return config;
  },
};

export default nextConfig;
