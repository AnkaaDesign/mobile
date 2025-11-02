// Navigation Performance Monitor
import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'expo-router';

interface PerformanceMetrics {
  navigationStart: number;
  navigationEnd: number;
  duration: number;
  routeName: string;
  timestamp: number;
}

interface NavigationPerformanceReport {
  averageNavigationTime: number;
  slowestRoute: { route: string; time: number };
  fastestRoute: { route: string; time: number };
  totalNavigations: number;
  metrics: PerformanceMetrics[];
}

class NavigationPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private navigationStartTime: number | null = null;
  private currentRoute: string = '';
  private maxMetrics = 100; // Keep last 100 navigation metrics

  startNavigation(route: string) {
    this.navigationStartTime = performance.now();
    this.currentRoute = route;
  }

  endNavigation() {
    if (!this.navigationStartTime) return;

    const navigationEnd = performance.now();
    const duration = navigationEnd - this.navigationStartTime;

    const metric: PerformanceMetrics = {
      navigationStart: this.navigationStartTime,
      navigationEnd,
      duration,
      routeName: this.currentRoute,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow navigations
    if (duration > 500) {
      console.warn(`[PERF] Slow navigation to ${this.currentRoute}: ${duration.toFixed(2)}ms`);
    } else if (__DEV__) {
      console.log(`[PERF] Navigation to ${this.currentRoute}: ${duration.toFixed(2)}ms`);
    }

    this.navigationStartTime = null;
  }

  getReport(): NavigationPerformanceReport {
    if (this.metrics.length === 0) {
      return {
        averageNavigationTime: 0,
        slowestRoute: { route: 'N/A', time: 0 },
        fastestRoute: { route: 'N/A', time: 0 },
        totalNavigations: 0,
        metrics: [],
      };
    }

    const totalTime = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageNavigationTime = totalTime / this.metrics.length;

    const sorted = [...this.metrics].sort((a, b) => a.duration - b.duration);
    const fastestRoute = {
      route: sorted[0].routeName,
      time: sorted[0].duration,
    };
    const slowestRoute = {
      route: sorted[sorted.length - 1].routeName,
      time: sorted[sorted.length - 1].duration,
    };

    return {
      averageNavigationTime,
      slowestRoute,
      fastestRoute,
      totalNavigations: this.metrics.length,
      metrics: this.metrics,
    };
  }

  clearMetrics() {
    this.metrics = [];
  }

  // Get metrics for specific route
  getRouteMetrics(routeName: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.routeName === routeName);
  }

  // Get average time for specific route
  getRouteAverageTime(routeName: string): number {
    const routeMetrics = this.getRouteMetrics(routeName);
    if (routeMetrics.length === 0) return 0;

    const total = routeMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / routeMetrics.length;
  }
}

// Singleton instance
const monitor = new NavigationPerformanceMonitor();

// Hook for monitoring navigation performance
export function useNavigationPerformance() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      // End previous navigation
      monitor.endNavigation();

      // Start new navigation
      monitor.startNavigation(pathname);

      previousPathname.current = pathname;
    }
  }, [pathname]);

  const getReport = useCallback(() => monitor.getReport(), []);
  const clearMetrics = useCallback(() => monitor.clearMetrics(), []);

  return {
    getReport,
    clearMetrics,
  };
}

// Hook for component render performance
export function useComponentPerformance(componentName: string) {
  const renderStart = useRef<number>();

  useEffect(() => {
    renderStart.current = performance.now();

    return () => {
      if (renderStart.current) {
        const renderTime = performance.now() - renderStart.current;
        if (__DEV__ && renderTime > 16) {
          // Warn if render takes more than one frame (16ms)
          console.warn(`[PERF] ${componentName} render: ${renderTime.toFixed(2)}ms`);
        }
      }
    };
  }, [componentName]);
}

// Memory usage monitor (for development)
export function useMemoryMonitor() {
  useEffect(() => {
    if (!__DEV__) return;

    const checkMemory = () => {
      // @ts-ignore - performance.memory is non-standard but useful for debugging
      if (performance.memory) {
        // @ts-ignore
        const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
        const usedMB = (usedJSHeapSize / 1048576).toFixed(2);
        const totalMB = (totalJSHeapSize / 1048576).toFixed(2);
        const limitMB = (jsHeapSizeLimit / 1048576).toFixed(2);

        const usage = (usedJSHeapSize / jsHeapSizeLimit) * 100;
        if (usage > 80) {
          console.warn(
            `[MEMORY] High memory usage: ${usedMB}MB / ${limitMB}MB (${usage.toFixed(1)}%)`
          );
        }
      }
    };

    const interval = setInterval(checkMemory, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);
}

// Export singleton monitor for external use
export { monitor as navigationMonitor };

// Utility to measure async operations
export async function measureAsync<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const start = performance.now();

  try {
    const result = await operation();
    const duration = performance.now() - start;

    if (__DEV__) {
      console.log(`[PERF] ${operationName}: ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[PERF] ${operationName} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

// Debounced performance logger to avoid console spam
let logBuffer: string[] = [];
let logTimer: NodeJS.Timeout | null = null;

export function logPerformance(message: string) {
  if (!__DEV__) return;

  logBuffer.push(message);

  if (logTimer) clearTimeout(logTimer);

  logTimer = setTimeout(() => {
    if (logBuffer.length > 0) {
      console.group('[PERF] Batch Log');
      logBuffer.forEach(msg => console.log(msg));
      console.groupEnd();
      logBuffer = [];
    }
  }, 100);
}