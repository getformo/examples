const { getDefaultConfig } = require("expo/metro-config");
const fs = require("fs");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Handle linked SDK package
const SDK_PACKAGE_NAME = "@formo/analytics-react-native";
const sdkPath = path.resolve(__dirname, "../../sdk-react-native");
const projectRoot = __dirname;
const projectNodeModules = path.resolve(projectRoot, "node_modules");

// Is the SDK a local link rather than an npm install? A `pnpm add link:` (or
// `npm link`) leaves a symlink in node_modules; an npm install leaves a real
// directory. Only in the link case should Metro resolve the package to the
// sibling checkout's TypeScript source.
const isSdkLinked = (() => {
  try {
    const installed = path.resolve(projectNodeModules, SDK_PACKAGE_NAME);
    return (
      fs.lstatSync(installed).isSymbolicLink() &&
      fs.existsSync(path.resolve(sdkPath, "src/index.ts"))
    );
  } catch {
    return false; // not installed at all, or no sibling checkout
  }
})();

// Watch the SDK directory for changes
// Note: sdk-react-native/.watchmanconfig excludes node_modules and lib
config.watchFolders = [sdkPath];

// Only use the example app's node_modules for resolution
config.resolver.nodeModulesPaths = [projectNodeModules];

// Force resolution of core packages from example app's node_modules
config.resolver.extraNodeModules = {
  react: path.resolve(projectNodeModules, "react"),
  "react-dom": path.resolve(projectNodeModules, "react-dom"),
  "react-native": path.resolve(projectNodeModules, "react-native"),
  "react-native-web": path.resolve(projectNodeModules, "react-native-web"),
  "ethereum-cryptography": path.resolve(projectNodeModules, "ethereum-cryptography"),
};

// Custom resolver to ensure SDK imports use example app's modules
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Resolve the SDK to its TypeScript source.
  //
  // Metro honours the package's `exports` map, which points at
  // lib/commonjs/index.js — but sdk-react-native/.watchmanconfig lists "lib" in
  // ignore_dirs, so Metro's crawler never sees that file and resolution fails
  // with "none of these files exist" even when the build output is present.
  // The `react-native` field (src/index.ts) would avoid this, but `exports`
  // takes precedence over it.
  //
  // Pinning to source is also what the rest of this resolver assumes: the
  // redirect below keys on originModulePath being inside sdkPath, which only
  // happens when the SDK is consumed as source. It means edits to the SDK hot
  // reload with no rebuild — the point of linking it in the first place.
  // ONLY when the package is actually linked. Redirecting unconditionally
  // would hijack an npm-installed SDK for anyone who happens to have a sibling
  // sdk-react-native checkout — silently running unreleased local code instead
  // of the pinned version — and would resolve to a non-existent path for anyone
  // who does not. isSdkLinked is computed once at config load; swapping between
  // a link and an npm install already requires a Metro restart.
  if (moduleName === SDK_PACKAGE_NAME && isSdkLinked) {
    return {
      filePath: path.resolve(sdkPath, "src/index.ts"),
      type: "sourceFile",
    };
  }

  // Block modules that are incompatible with React Native
  const blockedModules = [
    "@metamask/sdk",       // Node.js crypto dependencies
    "react-native-device-info",  // Optional SDK peer dep, not installed
  ];
  for (const blocked of blockedModules) {
    if (moduleName === blocked || moduleName.startsWith(blocked + "/")) {
      return { type: "empty" };
    }
  }

  // When resolving external packages from the SDK source, redirect to example
  // app's node_modules. Skip relative/absolute imports (SDK-internal modules).
  if (
    context.originModulePath &&
    context.originModulePath.startsWith(sdkPath) &&
    !moduleName.startsWith(".") &&
    !moduleName.startsWith("/")
  ) {
    try {
      const resolved = require.resolve(moduleName, { paths: [projectNodeModules] });
      return { filePath: resolved, type: "sourceFile" };
    } catch (e) {
      // Fall through to default resolution
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
