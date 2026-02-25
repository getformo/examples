const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Handle linked SDK package
const sdkPath = path.resolve(__dirname, "../sdk-react-native");
const projectRoot = __dirname;
const projectNodeModules = path.resolve(projectRoot, "node_modules");

// Watch the SDK directory for changes
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
  // Block MetaMask SDK which has Node.js crypto dependencies that break React Native
  // WalletConnect is used instead for mobile wallet connections
  if (moduleName === "@metamask/sdk" || moduleName.startsWith("@metamask/sdk/")) {
    return {
      type: "empty",
    };
  }

  // On web, don't redirect react-native (it's handled by react-native-web alias)
  // Only redirect react and ethereum-cryptography to prevent duplicates
  const redirectModules = ["react", "react-dom", "ethereum-cryptography"];

  // Also redirect react-native and react-native-web on native platforms only
  if (platform !== "web") {
    redirectModules.push("react-native", "react-native-web");
  }

  for (const mod of redirectModules) {
    if (moduleName === mod || moduleName.startsWith(mod + "/")) {
      try {
        return {
          filePath: require.resolve(moduleName, { paths: [projectNodeModules] }),
          type: "sourceFile",
        };
      } catch (e) {
        // Fall through to default resolution
      }
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
