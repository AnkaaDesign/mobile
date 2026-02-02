module.exports = function (api) {
  // Enable aggressive caching for faster rebuilds
  api.cache(true);

  const isProduction = process.env.NODE_ENV === 'production';

  return {
    presets: [
      ["babel-preset-expo", {
        jsxImportSource: "nativewind",
        // Enable optimizations
        lazyImports: true,
      }],
      "nativewind/babel"
    ],
    plugins: [
      // Module resolver for cleaner imports (already installed)
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@": "./src",
          },
          extensions: [".ios.js", ".android.js", ".js", ".jsx", ".ts", ".tsx", ".json"],
        },
      ],
      // Reanimated must be last
      "react-native-reanimated/plugin",
    ],
    // Environment-specific configurations
    env: {
      production: {
        // Production optimizations
        compact: true,
        minified: true,
      }
    }
  };
};