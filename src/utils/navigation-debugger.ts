/**
 * Navigation Debugger - Comprehensive navigation tracking and debugging
 */

interface NavigationEvent {
  timestamp: number;
  type: 'push' | 'replace' | 'back' | 'navigate';
  from: string;
  to?: string;
  params?: any;
  canGoBack?: boolean;
  historyLength?: number;
  stackSnapshot?: string[];
}

class NavigationDebugger {
  private history: NavigationEvent[] = [];
  private enabled: boolean = __DEV__;
  private maxHistorySize = 50;
  private currentPath: string = '';

  // Track navigation event
  trackNavigation(
    type: 'push' | 'replace' | 'back' | 'navigate',
    from: string,
    to?: string,
    params?: any
  ) {
    if (!this.enabled) return;

    const event: NavigationEvent = {
      timestamp: Date.now(),
      type,
      from,
      to,
      params,
    };

    this.history.push(event);

    // Keep history size manageable
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Log the navigation
    const emoji = type === 'back' ? '⬅️' : type === 'push' ? '➡️' : '🔄';
    console.log(`${emoji} [NAV ${type.toUpperCase()}] ${from}${to ? ` → ${to}` : ''}`);

    if (params && Object.keys(params).length > 0) {
      console.log(`   📝 Params:`, params);
    }
  }

  // Track back navigation attempt
  trackBackNavigation(
    currentPath: string,
    canGoBack: boolean,
    fallbackRoute?: string,
    historyStack?: string[]
  ) {
    if (!this.enabled) return;

    console.log('⬅️ [BACK NAVIGATION ATTEMPT]');
    console.log(`   📍 Current: ${currentPath}`);
    console.log(`   🎯 Can go back: ${canGoBack}`);

    if (fallbackRoute) {
      console.log(`   🔀 Fallback: ${fallbackRoute}`);
    }

    if (historyStack && historyStack.length > 0) {
      console.log(`   📚 History stack (${historyStack.length} items):`);
      historyStack.slice(-5).forEach((path, i) => {
        console.log(`      ${i === historyStack.length - 1 ? '→' : ' '} ${path}`);
      });
    }

    // Analyze the navigation pattern
    this.analyzeNavigationIssue(currentPath, canGoBack, fallbackRoute);
  }

  // Analyze why navigation might be failing
  private analyzeNavigationIssue(
    currentPath: string,
    canGoBack: boolean,
    fallbackRoute?: string
  ) {
    if (!canGoBack && !fallbackRoute) {
      console.warn('⚠️ [NAV ISSUE] Cannot go back and no fallback route defined');
    }

    // Check for common navigation patterns
    if (currentPath.includes('/detalhes/')) {
      const expectedBack = currentPath.includes('/agenda/')
        ? '/(tabs)/producao/agenda'
        : currentPath.includes('/cronograma/')
        ? '/(tabs)/producao/cronograma'
        : currentPath.includes('/historico/')
        ? '/(tabs)/producao/historico'
        : null;

      if (expectedBack) {
        console.log(`   💡 Expected back route: ${expectedBack}`);
      }
    }

    // Check recent navigation history for loops
    const recentPaths = this.history.slice(-10).map(e => e.to || e.from);
    const uniquePaths = new Set(recentPaths);

    if (uniquePaths.size < recentPaths.length / 2) {
      console.warn('⚠️ [NAV ISSUE] Possible navigation loop detected');
      console.warn('   Recent paths:', recentPaths);
    }
  }

  // Track route change
  trackRouteChange(from: string, to: string, params?: any) {
    if (!this.enabled) return;

    this.currentPath = to;

    console.log(`🔄 [ROUTE CHANGE]`);
    console.log(`   From: ${from}`);
    console.log(`   To: ${to}`);

    if (params && Object.keys(params).length > 0) {
      console.log(`   Params:`, params);
    }

    // Calculate navigation time if we have a pending navigation
    const lastNavEvent = this.history[this.history.length - 1];
    if (lastNavEvent && lastNavEvent.to === to) {
      const duration = Date.now() - lastNavEvent.timestamp;
      if (duration > 1000) {
        console.warn(`⚠️ Slow navigation: ${duration}ms`);
      }
    }
  }

  // Get navigation history summary
  getHistory(): NavigationEvent[] {
    return [...this.history];
  }

  // Get recent navigation paths
  getRecentPaths(count: number = 5): string[] {
    return this.history
      .slice(-count)
      .map(e => e.to || e.from);
  }

  // Analyze navigation patterns
  analyzePatterns() {
    if (!this.enabled) return;

    console.log('📊 [NAVIGATION ANALYSIS]');

    // Count navigation types
    const typeCounts = this.history.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('   Navigation types:', typeCounts);

    // Find most common routes
    const routeCounts = this.history.reduce((acc, event) => {
      const route = event.to || event.from;
      acc[route] = (acc[route] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topRoutes = Object.entries(routeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    console.log('   Top routes:');
    topRoutes.forEach(([route, count]) => {
      console.log(`      ${route}: ${count} visits`);
    });

    // Find failed back navigations
    const failedBacks = this.history.filter(
      e => e.type === 'back' && !e.to
    );

    if (failedBacks.length > 0) {
      console.warn(`   ⚠️ Failed back navigations: ${failedBacks.length}`);
    }
  }

  // Clear history
  clear() {
    this.history = [];
    console.log('🗑️ [NAV DEBUG] History cleared');
  }

  // Enable/disable debugging
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

// Export singleton instance
export const navigationDebugger = new NavigationDebugger();

// Helper to log navigation stack
export function logNavigationStack(stack: string[], current: string) {
  if (!__DEV__) return;

  console.log('📚 [NAVIGATION STACK]');
  console.log(`   Current: ${current}`);
  console.log(`   Stack (${stack.length} items):`);

  stack.forEach((path, index) => {
    const isCurrent = path === current;
    const prefix = isCurrent ? '→' : ' ';
    console.log(`   ${prefix} [${index}] ${path}`);
  });
}

// Helper to determine expected back route
export function getExpectedBackRoute(currentPath: string): string {
  // Production module routes
  if (currentPath.includes('/producao/')) {
    if (currentPath.includes('/cronograma/detalhes/')) {
      return '/(tabs)/producao/cronograma';
    }
    if (currentPath.includes('/agenda/detalhes/')) {
      return '/(tabs)/producao/agenda';
    }
    if (currentPath.includes('/historico/detalhes/')) {
      return '/(tabs)/producao/historico';
    }
    if (currentPath.includes('/cadastrar')) {
      return currentPath.includes('/agenda/')
        ? '/(tabs)/producao/agenda'
        : '/(tabs)/producao/cronograma';
    }
  }

  // Activity routes
  if (currentPath.includes('/atividades/')) {
    if (currentPath.includes('/detalhes/')) {
      return '/(tabs)/estoque/atividades';
    }
    if (currentPath.includes('/cadastrar')) {
      return '/(tabs)/estoque/atividades';
    }
  }

  // Borrow routes
  if (currentPath.includes('/emprestimos/')) {
    if (currentPath.includes('/detalhes/')) {
      return '/(tabs)/estoque/emprestimos';
    }
    if (currentPath.includes('/cadastrar')) {
      return '/(tabs)/estoque/emprestimos';
    }
  }

  // Default to home
  return '/(tabs)/inicio';
}