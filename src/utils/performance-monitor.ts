import { InteractionManager } from 'react-native';

class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private enabled: boolean = __DEV__;

  // Start a performance measurement
  mark(name: string) {
    if (!this.enabled) return;
    this.marks.set(name, performance.now());
  }

  // Measure time since mark
  measure(name: string, startMark: string): number {
    if (!this.enabled) return 0;

    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`Performance mark ${startMark} not found`);
      return 0;
    }

    const duration = performance.now() - start;

    // Log slow operations
    if (duration > 100) {
      console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Track component render time
  trackRender(componentName: string, callback: () => void) {
    if (!this.enabled) {
      callback();
      return;
    }

    const startMark = `${componentName}-render-start`;
    this.mark(startMark);

    callback();

    const duration = this.measure(`${componentName} render`, startMark);

    if (duration > 16) { // More than one frame
      console.warn(`🔴 ${componentName} render took ${duration.toFixed(2)}ms (>${Math.ceil(duration / 16)} frames)`);
    }
  }

  // Track async operation
  async trackAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    if (!this.enabled) return operation();

    const startMark = `${name}-start`;
    this.mark(startMark);

    try {
      const result = await operation();
      const duration = this.measure(name, startMark);

      if (duration > 1000) {
        console.error(`🔴 ${name} took ${(duration / 1000).toFixed(2)}s`);
      } else if (duration > 300) {
        console.warn(`⚠️ ${name} took ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = this.measure(`${name} (failed)`, startMark);
      console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  // Track navigation
  trackNavigation(from: string, to: string) {
    if (!this.enabled) return;

    const navMark = `nav-${from}-to-${to}`;
    this.mark(navMark);

    // Check after interaction completes
    InteractionManager.runAfterInteractions(() => {
      const duration = this.measure(`Navigation ${from} → ${to}`, navMark);

      if (duration > 500) {
        console.error(`🔴 Navigation took ${duration.toFixed(2)}ms`);
      }
    });
  }

  // Get performance report
  getReport(): { slowOperations: string[], averageRenderTime: number } {
    // This would collect and return performance metrics
    return {
      slowOperations: [],
      averageRenderTime: 0
    };
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Clear all marks
  clear() {
    this.marks.clear();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Hook for tracking component renders
export function useRenderTracking(componentName: string) {
  if (!__DEV__) return;

  performanceMonitor.trackRender(componentName, () => {
    // Track render
  });
}

// HOC for automatic performance tracking
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  if (!__DEV__) return Component;

  return (props: P) => {
    performanceMonitor.trackRender(componentName, () => {});
    return <Component {...props} />;
  };
}