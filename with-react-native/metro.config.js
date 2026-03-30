const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Handle linked SDK package
const sdkPath = path.resolve(__dirname, "../../sdk-react-native");
const projectRoot = __dirname;
const projectNodeModules = path.resolve(projectRoot, "node_modules");

// Watch the SDK directory for changes
// Note: sdk-react-native/.watchmanconfig excludes node_modules and lib
config.watchFolders = [sdkPath];

// Enable symlinks
config.resolver.unstable_enableSymlinks = true;

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
