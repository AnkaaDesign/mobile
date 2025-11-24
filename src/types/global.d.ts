// Global type declarations for React Native internals

/**
 * ErrorUtils is a React Native internal for global error handling.
 * It's not officially documented but is used to intercept JavaScript errors
 * before they trigger the red screen.
 */
declare const ErrorUtils: {
  setGlobalHandler: (handler: (error: Error, isFatal: boolean) => void) => void;
  getGlobalHandler: () => ((error: Error, isFatal: boolean) => void) | null;
  reportError: (error: Error) => void;
  reportFatalError: (error: Error) => void;
};

// Ensure __DEV__ is recognized
declare const __DEV__: boolean;
