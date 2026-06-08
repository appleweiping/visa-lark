import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The web app depends on workspace packages for TYPES + FACILITY_SEEDS only
  // (zero secrets, zero visa network). Transpile them from their built output.
  transpilePackages: ["@visa-lark/shared", "@visa-lark/adapter-usvisa-info"],
};

export default nextConfig;
