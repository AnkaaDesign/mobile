// Reanimated MUST be imported first before any other imports
import "react-native-reanimated";

// Import global polyfills first (before any other imports)
import "./src/lib/global-polyfills";

// Import performance optimizations early
import { initializePerformanceOptimizations } from "./src/config/performance-config";

// Initialize performance optimizations before React
initializePerformanceOptimizations();

import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
import { LogBox, Platform } from "react-native";

// Configure LogBox for production
if (__DEV__) {
  // In development, ignore specific warnings
  LogBox.ignoreLogs([
    "[Reanimated] Reading from `value` during component render",
    "Require cycle:",
    "ViewPropTypes will be removed",
    "ColorPropType will be removed",
  ]);
} else {
  // In production, disable all logs for better performance
  LogBox.ignoreAllLogs();
}

// Optimize console methods for production
if (!__DEV__) {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.warn = () => {};
  // Keep console.error for critical issues
}

// Platform-specific optimizations
if (Platform.OS === 'android') {
  // Enable layout animation on Android
  if (Platform.constants?.reactNativeVersion) {
    const { UIManager } = require('react-native');
    if (UIManager?.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }
}

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context("./src/app/");
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);