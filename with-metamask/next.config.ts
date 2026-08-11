import type { NextConfig } from "next";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const wagmiConnectorsRoot = dirname(
  require.resolve("@wagmi/connectors/package.json"),
);

const nextConfig: NextConfig = {
  webpack(config) {
    // @wagmi/connectors only exports a barrel, which makes webpack traverse
    // every optional wallet SDK. Point this app's sole connector import at the
    // package's MetaMask-only entry so mobile/QR SDK behavior is preserved
    // without bundling unrelated connectors.
    config.resolve.alias["@wagmi/connectors"] = join(
      wagmiConnectorsRoot,
      "dist/esm/metaMask.js",
    );
    return config;
  },
};

export default nextConfig;
