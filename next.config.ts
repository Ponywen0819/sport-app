import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  webpack: (config, { isServer }) => {
    // sql.js references Node.js built-ins that don't exist in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default process.env.NODE_ENV === "production"
  ? withSerwistInit({ swSrc: "src/app/sw.ts", swDest: "public/sw.js" })(nextConfig)
  : nextConfig;
