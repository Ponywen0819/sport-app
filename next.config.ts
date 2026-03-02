import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default process.env.NODE_ENV === "production"
  ? withSerwistInit({ swSrc: "src/app/sw.ts", swDest: "public/sw.js" })(nextConfig)
  : nextConfig;
