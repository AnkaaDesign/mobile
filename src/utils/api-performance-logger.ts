import { performanceMonitor } from './performance-monitor';

interface ApiCallMetrics {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  error?: string;
  payloadSize?: number;
  responseSize?: number;
}

class ApiPerformanceLogger {
  private activeRequests: Map<string, ApiCallMetrics> = new Map();
  private requestHistory: ApiCallMetrics[] = [];
  private enabled: boolean = true;

  // Start tracking an API call
  startRequest(requestId: string, url: string, method: string, payload?: any) {
    if (!this.enabled) return;

    const payloadSize = payload ? JSON.stringify(payload).length : 0;
    const startTime = performance.now();

    const metrics: ApiCallMetrics = {
      url,
      method,
      startTime,
      payloadSize,
    };

    this.activeRequests.set(requestId, metrics);

    console.log(`🌐 [API START] ${method} ${url}`);
    if (payloadSize > 0) {
      console.log(`   📦 Payload size: ${this.formatBytes(payloadSize)}`);
    }
  }

  // End tracking an API call
  endRequest(requestId: string, status: number, response?: any, error?: any) {
    if (!this.enabled) return;

    const metrics = this.activeRequests.get(requestId);
    if (!metrics) return;

    const endTime = performance.now();
    const duration = endTime - metrics.startTime;
    const responseSize = response ? JSON.stringify(response).length : 0;

    metrics.endTime = endTime;
    metrics.duration = duration;
    metrics.status = status;
    metrics.responseSize = responseSize;
    if (error) metrics.error = error.message || String(error);

    this.activeRequests.delete(requestId);
    this.requestHistory.push(metrics);

    // Keep only last 50 requests in history
    if (this.requestHistory.length > 50) {
      this.requestHistory.shift();
    }

    // Log result with color coding
    const emoji = status >= 200 && status < 300 ? '✅' : '❌';
    const color = duration > 2000 ? '🔴' : duration > 1000 ? '🟡' : '🟢';

    console.log(`${emoji} [API END] ${metrics.method} ${metrics.url}`);
    console.log(`   ${color} Duration: ${duration.toFixed(0)}ms`);
    console.log(`   📥 Response size: ${this.formatBytes(responseSize)}`);
    console.log(`   📊 Status: ${status}`);

    // Warn about slow APIs
    if (duration > 3000) {
      console.warn(`⚠️ SLOW API: ${metrics.url} took ${(duration / 1000).toFixed(2)}s`);
      this.logApiBottleneckAnalysis(metrics);
    }

    // Warn about large payloads
    if (responseSize > 100000) { // 100KB
      console.warn(`⚠️ LARGE RESPONSE: ${this.formatBytes(responseSize)} from ${metrics.url}`);
    }
  }

  // Analyze why an API call might be slow
  private logApiBottleneckAnalysis(metrics: ApiCallMetrics) {
    console.log('📊 [API BOTTLENECK ANALYSIS]');

    // Check if it's a detail endpoint with includes
    if (metrics.url.includes('?include=') || metrics.url.includes('&include=')) {
      const includes = this.extractIncludes(metrics.url);
      console.log(`   🔍 Includes detected: ${includes.join(', ')}`);
      console.log(`   💡 Consider reducing includes or using separate lighter calls`);
    }

    // Check response size
    if (metrics.responseSize && metrics.responseSize > 50000) {
      console.log(`   📦 Large response (${this.formatBytes(metrics.responseSize)})`);
      console.log(`   💡 Consider pagination or selective field fetching`);
    }

    // Log endpoint type
    if (metrics.url.includes('/tasks/') && metrics.method === 'GET') {
      console.log(`   📋 Task detail endpoint - check if all includes are necessary`);
    }

    // Calculate data transfer rate
    if (metrics.duration && metrics.responseSize) {
      const bytesPerSecond = (metrics.responseSize / metrics.duration) * 1000;
      console.log(`   ⚡ Transfer rate: ${this.formatBytes(bytesPerSecond)}/s`);
    }
  }

  // Extract include parameters from URL
  private extractIncludes(url: string): string[] {
    const match = url.match(/[?&]include=([^&]*)/);
    if (!match) return [];
    return match[1].split(',').map(s => s.trim());
  }

  // Format bytes to human readable
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  // Get summary of recent API calls
  getSummary(): {
    totalCalls: number;
    averageDuration: number;
    slowestCall?: ApiCallMetrics;
    largestResponse?: ApiCallMetrics;
    failedCalls: number;
  } {
    const durations = this.requestHistory
      .filter(r => r.duration)
      .map(r => r.duration!);

    const averageDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    const slowestCall = this.requestHistory
      .filter(r => r.duration)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))[0];

    const largestResponse = this.requestHistory
      .filter(r => r.responseSize)
      .sort((a, b) => (b.responseSize || 0) - (a.responseSize || 0))[0];

    const failedCalls = this.requestHistory
      .filter(r => !r.status || r.status >= 400).length;

    return {
      totalCalls: this.requestHistory.length,
      averageDuration,
      slowestCall,
      largestResponse,
      failedCalls,
    };
  }

  // Log current API performance summary
  logSummary() {
    const summary = this.getSummary();
    console.log('📊 [API PERFORMANCE SUMMARY]');
    console.log(`   Total calls: ${summary.totalCalls}`);
    console.log(`   Average duration: ${summary.averageDuration.toFixed(0)}ms`);
    console.log(`   Failed calls: ${summary.failedCalls}`);

    if (summary.slowestCall) {
      console.log(`   Slowest: ${summary.slowestCall.url} (${summary.slowestCall.duration?.toFixed(0)}ms)`);
    }

    if (summary.largestResponse) {
      console.log(`   Largest: ${summary.largestResponse.url} (${this.formatBytes(summary.largestResponse.responseSize || 0)})`);
    }
  }

  // Clear history
  clear() {
    this.activeRequests.clear();
    this.requestHistory = [];
  }

  // Enable/disable logging
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

// Export singleton instance
export const apiPerformanceLogger = new ApiPerformanceLogger();

// Interceptor to automatically log API calls
export function createApiInterceptor() {
  let requestCounter = 0;

  return {
    request: (config: any) => {
      const requestId = `req-${++requestCounter}`;
      config.metadata = { ...config.metadata, requestId, startTime: performance.now() };

      apiPerformanceLogger.startRequest(
        requestId,
        config.url,
        config.method?.toUpperCase() || 'GET',
        config.data
      );

      return config;
    },

    response: (response: any) => {
      const config = response.config;
      if (config?.metadata?.requestId) {
        apiPerformanceLogger.endRequest(
          config.metadata.requestId,
          response.status,
          response.data
        );
      }
      return response;
    },

    error: (error: any) => {
      const config = error.config;
      if (config?.metadata?.requestId) {
        apiPerformanceLogger.endRequest(
          config.metadata.requestId,
          error.response?.status || 0,
          error.response?.data,
          error
        );
      }
      throw error;
    }
  };
}