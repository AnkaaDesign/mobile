/**
 * NetworkService - Centralized network connectivity management
 *
 * This service monitors internet connectivity and manages the API base URL:
 * - Online: Uses the cloud API (https://api.ankaadesign.com.br)
 * - Offline (local network): Uses the local server (http://192.168.10.163:3030)
 *
 * The service automatically switches between URLs based on connectivity.
 */

import NetInfo, {
  NetInfoState,
  NetInfoSubscription,
} from "@react-native-community/netinfo";
import Constants from "expo-constants";
import { updateApiUrl, getCurrentApiUrl } from "../../api-client";

// Network mode types
export type NetworkMode = "online" | "offline" | "checking";

// Listener callback type
export type NetworkStateListener = (state: NetworkServiceState) => void;

// Network service state interface
export interface NetworkServiceState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  mode: NetworkMode;
  currentApiUrl: string;
  lastChecked: Date;
}

// Configuration for network service
interface NetworkServiceConfig {
  primaryApiUrl: string;
  fallbackApiUrl: string;
  checkInterval: number; // milliseconds
  reachabilityTimeout: number; // milliseconds
}

class NetworkService {
  private static instance: NetworkService | null = null;

  private config: NetworkServiceConfig;
  private currentState: NetworkServiceState;
  private listeners: Set<NetworkStateListener> = new Set();
  private netInfoSubscription: NetInfoSubscription | null = null;
  private reachabilityCheckInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    // Get URLs from configuration
    const primaryUrl = this.getPrimaryApiUrl();
    const fallbackUrl = this.getFallbackApiUrl();

    this.config = {
      primaryApiUrl: primaryUrl,
      fallbackApiUrl: fallbackUrl,
      checkInterval: 30000, // Check every 30 seconds
      reachabilityTimeout: 5000, // 5 second timeout for reachability tests
    };

    // Initialize state
    this.currentState = {
      isConnected: true, // Assume connected until proven otherwise
      isInternetReachable: null,
      mode: "checking",
      currentApiUrl: primaryUrl,
      lastChecked: new Date(),
    };
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  /**
   * Get primary API URL from configuration
   */
  private getPrimaryApiUrl(): string {
    // Priority 1: Check expo config (from app.json extra.apiUrl)
    if (
      typeof Constants !== "undefined" &&
      Constants.expoConfig?.extra?.apiUrl
    ) {
      return Constants.expoConfig.extra.apiUrl;
    }

    // Priority 2: Check environment variable
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
    }

    // Default: Local API for development
    return "http://192.168.0.16:3030";
  }

  /**
   * Get fallback API URL from configuration
   */
  private getFallbackApiUrl(): string {
    // Priority 1: Check expo config (from app.json extra.fallbackApiUrl)
    if (
      typeof Constants !== "undefined" &&
      Constants.expoConfig?.extra?.fallbackApiUrl
    ) {
      return Constants.expoConfig.extra.fallbackApiUrl;
    }

    // Priority 2: Check environment variable
    if (process.env.EXPO_PUBLIC_FALLBACK_API_URL) {
      return process.env.EXPO_PUBLIC_FALLBACK_API_URL;
    }

    // Default: Local network server
    return "http://192.168.0.16:3030";
  }

  /**
   * Initialize the network service
   * Call this when the app starts
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log("[NetworkService] Initializing...");
    console.log("[NetworkService] Primary API URL:", this.config.primaryApiUrl);
    console.log(
      "[NetworkService] Fallback API URL:",
      this.config.fallbackApiUrl,
    );

    // Subscribe to network state changes
    this.netInfoSubscription = NetInfo.addEventListener(
      this.handleNetInfoChange.bind(this),
    );

    // Perform initial connectivity check
    await this.checkConnectivity();

    // Start periodic reachability checks
    this.startReachabilityChecks();

    this.isInitialized = true;
    console.log(
      "[NetworkService] Initialized with mode:",
      this.currentState.mode,
    );
  }

  /**
   * Cleanup the network service
   * Call this when the app is closing
   */
  public cleanup(): void {
    if (this.netInfoSubscription) {
      this.netInfoSubscription();
      this.netInfoSubscription = null;
    }

    if (this.reachabilityCheckInterval) {
      clearInterval(this.reachabilityCheckInterval);
      this.reachabilityCheckInterval = null;
    }

    this.listeners.clear();
    this.isInitialized = false;
    console.log("[NetworkService] Cleaned up");
  }

  /**
   * Handle NetInfo state changes
   */
  private async handleNetInfoChange(state: NetInfoState): Promise<void> {
    const previousMode = this.currentState.mode;
    const isConnected = !!state.isConnected;
    const isInternetReachable = state.isInternetReachable;

    this.currentState = {
      ...this.currentState,
      isConnected,
      isInternetReachable,
      lastChecked: new Date(),
    };

    // Determine the appropriate API URL
    await this.determineApiUrl(isConnected, isInternetReachable);

    // Notify listeners if mode changed
    if (previousMode !== this.currentState.mode) {
      console.log(
        "[NetworkService] Mode changed:",
        previousMode,
        "->",
        this.currentState.mode,
      );
      this.notifyListeners();
    }
  }

  /**
   * Determine which API URL to use based on connectivity
   */
  private async determineApiUrl(
    isConnected: boolean,
    isInternetReachable: boolean | null,
  ): Promise<void> {
    // If completely disconnected, try local fallback
    if (!isConnected) {
      await this.switchToFallback();
      return;
    }

    // If internet is reachable, use primary
    if (isInternetReachable === true) {
      await this.switchToPrimary();
      return;
    }

    // If internet reachability is unknown or false, test primary first
    const primaryReachable = await this.testUrlReachability(
      this.config.primaryApiUrl,
    );

    if (primaryReachable) {
      await this.switchToPrimary();
      return;
    }

    // Primary not reachable, try fallback
    const fallbackReachable = await this.testUrlReachability(
      this.config.fallbackApiUrl,
    );

    if (fallbackReachable) {
      await this.switchToFallback();
      return;
    }

    // Neither reachable - stay on current URL and mark as offline
    this.currentState = {
      ...this.currentState,
      mode: "offline",
    };
  }

  /**
   * Switch to primary API URL (online mode)
   */
  private async switchToPrimary(): Promise<void> {
    if (
      this.currentState.currentApiUrl === this.config.primaryApiUrl &&
      this.currentState.mode === "online"
    ) {
      return; // Already on primary
    }

    this.currentState = {
      ...this.currentState,
      mode: "online",
      currentApiUrl: this.config.primaryApiUrl,
    };

    // Update the API client
    updateApiUrl(this.config.primaryApiUrl);
    console.log(
      "[NetworkService] Switched to primary API:",
      this.config.primaryApiUrl,
    );
    this.notifyListeners();
  }

  /**
   * Switch to fallback API URL (offline/local mode)
   */
  private async switchToFallback(): Promise<void> {
    if (
      this.currentState.currentApiUrl === this.config.fallbackApiUrl &&
      this.currentState.mode === "offline"
    ) {
      return; // Already on fallback
    }

    this.currentState = {
      ...this.currentState,
      mode: "offline",
      currentApiUrl: this.config.fallbackApiUrl,
    };

    // Update the API client
    updateApiUrl(this.config.fallbackApiUrl);
    console.log(
      "[NetworkService] Switched to fallback API:",
      this.config.fallbackApiUrl,
    );
    this.notifyListeners();
  }

  /**
   * Test if a URL is reachable
   */
  private async testUrlReachability(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.reachabilityTimeout,
      );

      const response = await fetch(`${url}/`, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok || response.status < 500;
    } catch {
      return false;
    }
  }

  /**
   * Perform a full connectivity check
   */
  public async checkConnectivity(): Promise<NetworkServiceState> {
    this.currentState = {
      ...this.currentState,
      mode: "checking",
    };
    this.notifyListeners();

    try {
      const netState = await NetInfo.fetch();
      await this.handleNetInfoChange(netState);
    } catch (error) {
      console.error("[NetworkService] Error checking connectivity:", error);
      // On error, try to use current URL
      this.currentState = {
        ...this.currentState,
        mode: "offline",
        lastChecked: new Date(),
      };
      this.notifyListeners();
    }

    return this.currentState;
  }

  /**
   * Start periodic reachability checks
   */
  private startReachabilityChecks(): void {
    if (this.reachabilityCheckInterval) {
      clearInterval(this.reachabilityCheckInterval);
    }

    this.reachabilityCheckInterval = setInterval(async () => {
      // Only check if we're currently offline - try to reconnect to primary
      if (this.currentState.mode === "offline") {
        const primaryReachable = await this.testUrlReachability(
          this.config.primaryApiUrl,
        );
        if (primaryReachable) {
          await this.switchToPrimary();
        }
      }
    }, this.config.checkInterval);
  }

  /**
   * Add a listener for network state changes
   */
  public addListener(listener: NetworkStateListener): () => void {
    this.listeners.add(listener);

    // Immediately notify with current state
    listener(this.currentState);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error("[NetworkService] Error notifying listener:", error);
      }
    });
  }

  /**
   * Get current network state
   */
  public getState(): NetworkServiceState {
    return { ...this.currentState };
  }

  /**
   * Get current API URL
   */
  public getCurrentApiUrl(): string {
    return this.currentState.currentApiUrl;
  }

  /**
   * Check if currently online (using primary API)
   */
  public isOnline(): boolean {
    return this.currentState.mode === "online";
  }

  /**
   * Check if currently offline (using fallback API)
   */
  public isOffline(): boolean {
    return this.currentState.mode === "offline";
  }

  /**
   * Force switch to primary API (manual override)
   */
  public async forcePrimary(): Promise<boolean> {
    const reachable = await this.testUrlReachability(this.config.primaryApiUrl);
    if (reachable) {
      await this.switchToPrimary();
      return true;
    }
    return false;
  }

  /**
   * Force switch to fallback API (manual override)
   */
  public async forceFallback(): Promise<boolean> {
    const reachable = await this.testUrlReachability(
      this.config.fallbackApiUrl,
    );
    if (reachable) {
      await this.switchToFallback();
      return true;
    }
    return false;
  }
}

// Export singleton instance getter
export const getNetworkService = (): NetworkService =>
  NetworkService.getInstance();

// Export default instance for convenience
export default NetworkService;
