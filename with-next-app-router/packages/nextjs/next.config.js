// @ts-check

// This is a pnpm workspace: `next` runs in packages/nextjs/, but the env file
// lives at the example root (with-next-app-router/.env) so it sits next to
// .env.example and matches the convention of the other examples. Next.js only
// reads .env* from its own project dir, so load the example-root env here —
// before Next inlines NEXT_PUBLIC_* — using Next's own env loader.
// Next calls loadEnvConfig(projectDir) before requiring this file and caches
// the result, so a plain re-call with a different dir is ignored — pass
// forceReload=true (4th arg) to reload from the example root.
const path = require("path");
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(path.join(__dirname, "..", ".."), process.env.NODE_ENV !== "production", console, true);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/events",
        destination: "https://events.formo.so/v0/raw_events",
      },
    ];
  },
};

module.exports = nextConfig;
