const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

// Get default config
const config = getDefaultConfig(projectRoot);

// 1. Watch all relevant folders
config.watchFolders = [workspaceRoot];

// 1.5. Configure watcher to ignore .claude and other problematic directories
config.watcher = {
  ...config.watcher,
  watchman: {
    ...config.watcher?.watchman,
  },
  additionalExts: config.watcher?.additionalExts || [],
  healthCheck: {
    enabled: true,
  },
};

// Add blocklist to ignore .claude directory and other hidden folders
config.resolver.blockList = [
  /\.claude/,
  /\/\.git\//,
  /\/\.cache\//,
];

// 2. Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules"), path.resolve(workspaceRoot, "node_modules")];

// 3. Ensure workspace packages are resolved correctly
const workspacePackages = ["constants", "types", "utils", "schemas", "services", "api-client", "hooks"];

config.resolver.extraNodeModules = workspacePackages.reduce((acc, packageName) => {
  acc[`@ankaa/${packageName}`] = path.resolve(workspaceRoot, "packages", packageName);
  return acc;
}, {});

// 4. Add react-hook-form to extraNodeModules to ensure it's resolved correctly
config.resolver.extraNodeModules["react-hook-form"] = path.resolve(workspaceRoot, "node_modules", "react-hook-form");

// 5. Disable strict exports resolution to fix "Must have a default export" warnings
config.resolver.unstable_enablePackageExports = false;

// 6. Add .cjs to source extensions
config.resolver.sourceExts.push("cjs");

// 7. Apply nativewind with minimal config first
const { withNativeWind } = require("nativewind/metro");

// Add reset cache option (disable for production builds)
config.resetCache = process.env.EAS_BUILD ? false : true;

// Add max workers to help with bundling (increase for production)
config.maxWorkers = process.env.EAS_BUILD ? 4 : 2;

// Try the simplest possible configuration
module.exports = withNativeWind(config, {
  input: "./global.css",
});
