import { LogBox } from 'react-native';
import { enableScreens } from 'react-native-screens';

export function configurePerformance() {
  enableScreens(true);

  if (!__DEV__) {
    LogBox.ignoreAllLogs();
  }
}

export function initializePerformanceOptimizations() {
  configurePerformance();
}
