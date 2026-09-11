import type { NextConfig } from "next";
import path from "node:path";
const nextConfig: NextConfig = {
  output: "export",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  images: { unoptimized: true },
  poweredByHeader: false,
  experimental: { cpus: 1, webpackBuildWorker: false },
};
export default nextConfig;
