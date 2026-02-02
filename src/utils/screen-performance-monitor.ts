import { useEffect, useRef, useCallback } from 'react';

interface ScreenMetrics {
  name: string;
  mountTime?: number;
  dataFetchTime?: number;
  renderTime?: number;
  totalTime?: number;
  apiCalls: Array<{
    url: string;
    duration: number;
    size: number;
  }>;
}

class ScreenPerformanceMonitor {
  private metrics: Map<string, ScreenMetrics> = new Map();
  private activeScreens: Map<string, { startTime: number; mountTime?: number }> = new Map();
  private enabled: boolean = __DEV__;

  // Start tracking a screen
  startScreen(screenName: string) {
    if (!this.enabled) return;

    const startTime = performance.now();
    this.activeScreens.set(screenName, { startTime });

    console.log(`📱 [SCREEN START] ${screenName}`);
    console.log(`   ⏰ Start time: ${new Date().toLocaleTimeString()}`);
  }

  // Mark screen as mounted
  markMounted(screenName: string) {
    if (!this.enabled) return;

    const screen = this.activeScreens.get(screenName);
    if (!screen) return;

    const mountTime = performance.now() - screen.startTime;
    screen.mountTime = mountTime;

    console.log(`🎯 [SCREEN MOUNT] ${screenName}: ${mountTime.toFixed(0)}ms`);

    if (mountTime > 500) {
      console.warn(`   ⚠️ Slow mount: ${(mountTime / 1000).toFixed(2)}s`);
    }
  }

  // Mark data as loaded
  markDataLoaded(screenName: string, apiDetails?: { url: string; duration: number; size: number }) {
    if (!this.enabled) return;

    const screen = this.activeScreens.get(screenName);
    if (!screen) return;

    const dataFetchTime = performance.now() - screen.startTime - (screen.mountTime || 0);

    console.log(`📊 [DATA LOADED] ${screenName}: ${dataFetchTime.toFixed(0)}ms from mount`);

    if (apiDetails) {
      console.log(`   🌐 API: ${apiDetails.url}`);
      console.log(`   ⏱️ Duration: ${apiDetails.duration.toFixed(0)}ms`);
      console.log(`   📦 Size: ${this.formatBytes(apiDetails.size)}`);
    }

    if (dataFetchTime > 2000) {
      console.warn(`   ⚠️ Slow data fetch: ${(dataFetchTime / 1000).toFixed(2)}s`);
      this.analyzeDataFetchBottleneck(screenName, apiDetails);
    }
  }

  // Mark screen as fully rendered
  markRendered(screenName: string) {
    if (!this.enabled) return;

    const screen = this.activeScreens.get(screenName);
    if (!screen) return;

    const totalTime = performance.now() - screen.startTime;
    const renderTime = totalTime - (screen.mountTime || 0);

    console.log(`✅ [SCREEN RENDERED] ${screenName}:`);
    console.log(`   Total: ${totalTime.toFixed(0)}ms`);
    console.log(`   Mount: ${screen.mountTime?.toFixed(0) || '0'}ms`);
    console.log(`   Render: ${renderTime.toFixed(0)}ms`);

    // Store metrics
    this.metrics.set(screenName, {
      name: screenName,
      mountTime: screen.mountTime,
      renderTime,
      totalTime,
      apiCalls: [],
    });

    // Clean up
    this.activeScreens.delete(screenName);

    // Warn about slow screens
    if (totalTime > 3000) {
      console.error(`🔴 [SLOW SCREEN] ${screenName} took ${(totalTime / 1000).toFixed(2)}s`);
      this.analyzePerformanceIssue(screenName, totalTime, screen.mountTime || 0, renderTime);
    }
  }

  // Analyze why a screen is slow
  private analyzePerformanceIssue(
    screenName: string,
    totalTime: number,
    mountTime: number,
    renderTime: number
  ) {
    console.log('📊 [PERFORMANCE ANALYSIS]');

    const mountPercent = (mountTime / totalTime) * 100;
    const renderPercent = (renderTime / totalTime) * 100;

    console.log(`   Mount: ${mountPercent.toFixed(0)}% of total time`);
    console.log(`   Render: ${renderPercent.toFixed(0)}% of total time`);

    if (mountPercent > 50) {
      console.log(`   💡 Mount is the bottleneck - check component initialization`);
    }

    if (renderPercent > 50) {
      console.log(`   💡 Rendering is the bottleneck - check data processing or heavy computations`);
    }

    // Screen-specific recommendations
    if (screenName.includes('Detail') || screenName.includes('detalhes')) {
      console.log(`   💡 Detail screens: Consider reducing API includes or using progressive loading`);
    }

    if (screenName.includes('List') || screenName.includes('Table')) {
      console.log(`   💡 List screens: Consider virtualization or pagination`);
    }
  }

  // Analyze data fetch bottlenecks
  private analyzeDataFetchBottleneck(screenName: string, apiDetails?: any) {
    console.log('🔍 [DATA FETCH ANALYSIS]');

    if (!apiDetails) {
      console.log('   No API details available');
      return;
    }

    // Check if it's a large payload
    if (apiDetails.size > 100000) { // 100KB
      console.log(`   📦 Large payload detected: ${this.formatBytes(apiDetails.size)}`);
      console.log(`   💡 Consider:`);
      console.log(`      - Pagination or limiting results`);
      console.log(`      - Reducing includes/relations`);
      console.log(`      - Field selection (only fetch needed fields)`);
    }

    // Check if it's a complex query
    if (apiDetails.url.includes('include=')) {
      const includes = apiDetails.url.match(/include=([^&]*)/)?.[1]?.split(',') || [];
      if (includes.length > 3) {
        console.log(`   🔗 Many includes detected: ${includes.length}`);
        console.log(`   💡 Consider reducing to essential includes only`);
      }
    }

    // Calculate transfer rate
    const bytesPerSecond = apiDetails.size / (apiDetails.duration / 1000);
    console.log(`   ⚡ Transfer rate: ${this.formatBytes(bytesPerSecond)}/s`);
  }

  // Format bytes
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  // Get metrics summary
  getSummary(): { slowScreens: string[]; averageTimes: any } {
    const slowScreens = Array.from(this.metrics.entries())
      .filter(([, metrics]) => (metrics.totalTime || 0) > 3000)
      .map(([name]) => name);

    const times = Array.from(this.metrics.values());
    const averageTimes = {
      mount: times.reduce((sum, m) => sum + (m.mountTime || 0), 0) / times.length,
      render: times.reduce((sum, m) => sum + (m.renderTime || 0), 0) / times.length,
      total: times.reduce((sum, m) => sum + (m.totalTime || 0), 0) / times.length,
    };

    return { slowScreens, averageTimes };
  }

  // Clear metrics
  clear() {
    this.metrics.clear();
    this.activeScreens.clear();
  }
}

// Singleton instance
export const screenPerformanceMonitor = new ScreenPerformanceMonitor();

// React hook for tracking screen performance
export function useScreenPerformance(screenName: string) {
  const startTimeRef = useRef<number>(0);
  const hasMountedRef = useRef(false);
  const hasRenderedRef = useRef(false);

  // Track mount
  useEffect(() => {
    if (!hasMountedRef.current) {
      startTimeRef.current = performance.now();
      screenPerformanceMonitor.startScreen(screenName);
      screenPerformanceMonitor.markMounted(screenName);
      hasMountedRef.current = true;
    }
  }, [screenName]);

  // Track data load
  const trackDataLoaded = useCallback((apiDetails?: any) => {
    screenPerformanceMonitor.markDataLoaded(screenName, apiDetails);
  }, [screenName]);

  // Track render complete
  const trackRenderComplete = useCallback(() => {
    if (!hasRenderedRef.current) {
      screenPerformanceMonitor.markRendered(screenName);
      hasRenderedRef.current = true;
    }
  }, [screenName]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // If not rendered yet, mark as rendered on unmount
      if (!hasRenderedRef.current) {
        screenPerformanceMonitor.markRendered(screenName);
      }
    };
  }, [screenName]);

  return {
    trackDataLoaded,
    trackRenderComplete,
    getElapsedTime: () => performance.now() - startTimeRef.current,
  };
}