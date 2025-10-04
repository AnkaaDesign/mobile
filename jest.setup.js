// Mock React Native modules
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo modules if needed
jest.mock("expo-status-bar", () => ({
  StatusBar: "StatusBar",
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");

// Global test configuration
global.__DEV__ = true;

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
