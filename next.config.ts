import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // @sqlite.org/sqlite-wasm's OPFS proxy worker uses `new Worker(new URL(dynamicVar, import.meta.url))`
      // which webpack can't resolve statically. We only use oo1.DB (no OPFS), so disable
      // URL analysis for that file to suppress the build error.
      config.module.rules.push({
        test: /node_modules[/\\]@sqlite\.org[/\\]sqlite-wasm[/\\]dist[/\\]sqlite3-worker1\.mjs$/,
        parser: { javascript: { url: false } },
      });
    }
    return config;
  },
};

export default process.env.NODE_ENV === "production"
  ? withSerwistInit({ swSrc: "src/app/sw.ts", swDest: "public/sw.js" })(nextConfig)
  : nextConfig;
