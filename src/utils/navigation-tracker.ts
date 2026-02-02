/**
 * Navigation Tracker - Keeps track of where navigation originated from
 * This is needed because Expo Router's Drawer navigator doesn't properly maintain
 * navigation history, especially for shared routes like task edit forms
 */

class NavigationTracker {
  private navigationSource: string | null = null;

  /**
   * Store where we're navigating from
   */
  setSource(source: string) {
    console.log('[NavigationTracker] Setting source:', source);
    this.navigationSource = source;
  }

  /**
   * Get and clear the navigation source
   */
  getSource(): string | null {
    const source = this.navigationSource;
    console.log('[NavigationTracker] Getting source:', source);
    // Don't clear immediately - let the navigation complete first
    return source;
  }

  /**
   * Clear the stored source
   */
  clearSource() {
    console.log('[NavigationTracker] Clearing source');
    this.navigationSource = null;
  }

  /**
   * Check if we have a stored source
   */
  hasSource(): boolean {
    return this.navigationSource !== null;
  }
}

// Export singleton instance
export const navigationTracker = new NavigationTracker();