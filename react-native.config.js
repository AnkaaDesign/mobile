module.exports = {
  project: {
    android: {
      unstable_reactLegacyComponentNames: [],
      buildTypes: {
        debug: {
          // Enable Hermes debugging in debug mode
          hermesEnabled: true,
        },
        release: {
          // Enable Hermes and ProGuard in release
          hermesEnabled: true,
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    },
    ios: {
      // iOS specific configurations
      unstable_reactLegacyComponentNames: [],
    },
  },
  // Dependencies configuration for auto-linking
  dependencies: {
    // Force certain packages to use specific configurations
    'react-native-reanimated': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-reanimated/android',
        },
        ios: {
          configurations: ['Debug', 'Release'],
        },
      },
    },
  },
};