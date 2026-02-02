const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

// Get default config
const config = getDefaultConfig(projectRoot);

// === AGGRESSIVE PERFORMANCE OPTIMIZATIONS ===

// 1. Optimize transformer for maximum performance
config.transformer = {
  ...config.transformer,
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    keep_fnames: false,
    mangle: true,
    compress: {
      drop_console: false, // Keep for now since we handle in babel
      drop_debugger: true,
    },
  },
  // Critical performance setting - inline requires
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: true,
      inlineRequires: true, // CRITICAL for startup performance
    },
  }),
};

// 2. Optimize resolver for faster module resolution
config.resolver = {
  ...config.resolver,
  // Use faster resolution algorithm
  resolverMainFields: ['react-native', 'browser', 'main'],
  // Disable slow features
  unstable_enablePackageExports: false,
  unstable_enableSymlinks: false,
  // Add source extensions
  sourceExts: [...(config.resolver?.sourceExts || []), 'cjs'],
  // Block unnecessary files from being processed
  blockList: [
    /\.claude/,
    /\.claude-backup/,
    /\/\.git\//,
    /node_modules\/.*\/__(tests|mocks|fixtures)__\/.*/,
    /node_modules\/.*\/__tests__\/.*/,
    /node_modules\/.*\/\.(storybook|stories)\/.*/,
    /node_modules\/.*\/.*(spec|test)\.(js|jsx|ts|tsx)$/,
    /node_modules\/.*\/tests?\//,
    /node_modules\/.*\/e2e\//,
    /node_modules\/.*\/examples?\//,
    /node_modules\/.*\/docs?\//,
  ],
  // Asset extensions to process
  assetExts: config.resolver?.assetExts?.filter(ext =>
    !['db', 'mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)
  ),
  // Resolve workspace packages
  extraNodeModules: {
    'react-hook-form': path.resolve(workspaceRoot, 'node_modules', 'react-hook-form'),
    '@ankaa/constants': path.resolve(workspaceRoot, 'packages', 'constants'),
    '@ankaa/types': path.resolve(workspaceRoot, 'packages', 'types'),
    '@ankaa/utils': path.resolve(workspaceRoot, 'packages', 'utils'),
    '@ankaa/schemas': path.resolve(workspaceRoot, 'packages', 'schemas'),
    '@ankaa/services': path.resolve(workspaceRoot, 'packages', 'services'),
    '@ankaa/api-client': path.resolve(workspaceRoot, 'packages', 'api-client'),
    '@ankaa/hooks': path.resolve(workspaceRoot, 'packages', 'hooks'),
  },
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ],
};

// 3. Optimize serializer for faster bundle generation
config.serializer = {
  ...config.serializer,
  // Process fewer modules
  processModuleFilter: (module) => {
    if (
      module.path.includes('__tests__') ||
      module.path.includes('.test.') ||
      module.path.includes('.spec.') ||
      module.path.includes('/test/') ||
      module.path.includes('/tests/') ||
      module.path.includes('/e2e/') ||
      module.path.includes('/examples/') ||
      module.path.includes('/docs/')
    ) {
      return false;
    }
    return true;
  },
};

// 4. Configure server for better performance
config.server = {
  ...config.server,
  // Increase server performance
  port: 8081,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add aggressive caching headers for bundles
      if (req.url?.includes('.bundle') || req.url?.includes('.js')) {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
      }
      return middleware(req, res, next);
    };
  },
};

// 5. Watcher configuration for better performance
config.watcher = {
  ...config.watcher,
  // Reduce file watching overhead
  additionalExts: [],
  // Health check settings
  healthCheck: {
    enabled: true,
    interval: 10000, // Check less frequently
    timeout: 30000,
    filePrefix: '.metro-health-check',
  },
};

// 6. Watch folders
config.watchFolders = [workspaceRoot];

// 7. Critical performance settings
config.resetCache = false; // NEVER reset cache automatically
config.maxWorkers = Math.max(4, require('os').cpus().length - 1); // Use maximum workers

// 8. Cache configuration
config.cacheVersion = '1.0.0'; // Bump this to clear cache when needed
config.projectRoot = projectRoot;

// 9. Symlink handling - disable for performance
config.resolver.followSymlinks = false;

// Apply nativewind
const { withNativeWind } = require("nativewind/metro");

module.exports = withNativeWind(config, {
  input: "./global.css",
});