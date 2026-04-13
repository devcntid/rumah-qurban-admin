import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Paksa root Turbopack = folder repo ini (hindari lockfile induk yang membuat /dashboard 404). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
