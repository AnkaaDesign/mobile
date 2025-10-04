// Import global polyfills first (before any other imports)
import "./src/lib/global-polyfills";

import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
import { LogBox } from "react-native";

// Ignore specific warnings
LogBox.ignoreLogs(["[Reanimated] Reading from `value` during component render"]);
LogBox.ignoreLogs(["Require cycle:"]);

// Filter console warnings without modifying the console object
// This avoids "property is not configurable" errors in Hermes
const originalWarn = console.warn;
console.warn = function (...args) {
  if (typeof args[0] === "string" && args[0].includes("[Reanimated]")) {
    return;
  }
  return originalWarn.apply(console, args);
};

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context("./src/app/");
  return <ExpoRoot context={ctx} />;
}
registerRootComponent(App);
