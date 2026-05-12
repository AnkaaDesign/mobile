module.exports = function (api) {
  api.cache(true);

  const isProduction = process.env.NODE_ENV === "production" || process.env.BABEL_ENV === "production";

  const plugins = [
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
  ];

  // Strip console.* (except .error) from production bundles. This alone has a
  // measurable impact: the app logs heavily on every navigation and refetch,
  // and console output costs main-thread time even in release. Must come
  // BEFORE the reanimated plugin.
  if (isProduction) {
    plugins.push([
      "transform-remove-console",
      { exclude: ["error", "warn"] },
    ]);
  }

  // Reanimated's plugin MUST be last — it rewrites worklets and assumes other
  // transforms have already run.
  plugins.push("react-native-reanimated/plugin");

  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins,
  };
};
