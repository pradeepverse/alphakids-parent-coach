import type { NextConfig } from "next";

// GitHub Pages serves the site from /<repo-name>; the deploy workflow sets this.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export", // fully static: no server, deployable to GitHub Pages
  basePath,
  images: { unoptimized: true },
  turbopack: {
    // Browser stand-ins for Node-only imports pulled in by deepagents / langsmith.
    resolveAlias: {
      ws: "./src/stubs/empty.js",
      "node:async_hooks": "./src/stubs/async-hooks.js",
    },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
