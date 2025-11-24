import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage key for haptic preferences
const HAPTIC_SETTINGS_KEY = "@ankaa_haptic_settings";

// Haptic feedback settings interface
interface HapticSettings {
  enabled: boolean;
  intensity: "light" | "medium" | "heavy";
}

// Default settings
const DEFAULT_SETTINGS: HapticSettings = {
  enabled: true,
  intensity: "medium",
};

// Cached settings to avoid async calls on every haptic
let cachedSettings: HapticSettings = DEFAULT_SETTINGS;
let isInitialized = false;

/**
 * Initialize haptic settings from storage
 */
export const initializeHaptics = async (): Promise<void> => {
  if (isInitialized) return;

  try {
    const storedSettings = await AsyncStorage.getItem(HAPTIC_SETTINGS_KEY);
    if (storedSettings) {
      cachedSettings = JSON.parse(storedSettings);
    }
    isInitialized = true;
  } catch (error) {
    console.warn("Failed to load haptic settings:", error);
    isInitialized = true; // Mark as initialized even on error to prevent repeated attempts
  }
};

/**
 * Save haptic settings to storage
 */
export const saveHapticSettings = async (settings: HapticSettings): Promise<void> => {
  try {
    cachedSettings = settings;
    await AsyncStorage.setItem(HAPTIC_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn("Failed to save haptic settings:", error);
  }
};

/**
 * Get current haptic settings
 */
export const getHapticSettings = (): HapticSettings => {
  return cachedSettings;
};

/**
 * Toggle haptic feedback on/off
 */
export const toggleHaptics = async (enabled: boolean): Promise<void> => {
  await saveHapticSettings({ ...cachedSettings, enabled });
};

/**
 * Set haptic intensity
 */
export const setHapticIntensity = async (intensity: HapticSettings["intensity"]): Promise<void> => {
  await saveHapticSettings({ ...cachedSettings, intensity });
};

/**
 * Map intensity to Haptics.ImpactFeedbackStyle
 */
const getImpactStyle = (intensity: HapticSettings["intensity"]): Haptics.ImpactFeedbackStyle => {
  switch (intensity) {
    case "light":
      return Haptics.ImpactFeedbackStyle.Light;
    case "heavy":
      return Haptics.ImpactFeedbackStyle.Heavy;
    case "medium":
    default:
      return Haptics.ImpactFeedbackStyle.Medium;
  }
};

/**
 * Execute haptic feedback if enabled and on supported platform
 */
const executeHaptic = async (hapticFunction: () => Promise<void>, fallbackFunction?: () => Promise<void>): Promise<void> => {
  // Lazy initialization on first use
  await initializeHaptics();

  // Check if haptics are enabled
  if (!cachedSettings.enabled) {
    return;
  }

  // iOS supports all haptic types
  if (Platform.OS === "ios") {
    try {
      await hapticFunction();
    } catch (error) {
      console.warn("Haptic feedback failed:", error);
    }
    return;
  }

  // Android has limited haptic support
  if (Platform.OS === "android") {
    try {
      if (fallbackFunction) {
        await fallbackFunction();
      } else {
        // Default to impact for Android
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.warn("Haptic feedback failed:", error);
    }
    return;
  }

  // Web doesn't support haptics
  // No-op for other platforms
};

/**
 * Light impact for selections (e.g., tab selection, toggle switches)
 */
export const selectionHaptic = async (): Promise<void> => {
  await executeHaptic(
    async () => Haptics.selectionAsync(),
    async () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  );
};

/**
 * Medium impact for general actions (e.g., button presses, navigation)
 */
export const impactHaptic = async (): Promise<void> => {
  const style = getImpactStyle(cachedSettings.intensity);
  await executeHaptic(async () => Haptics.impactAsync(style));
};

/**
 * Light impact specifically (e.g., hover effects, subtle feedback)
 */
export const lightImpactHaptic = async (): Promise<void> => {
  await executeHaptic(async () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
};

/**
 * Heavy impact for important actions (e.g., deletions, confirmations)
 */
export const heavyImpactHaptic = async (): Promise<void> => {
  await executeHaptic(async () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
};

/**
 * Success haptic pattern (e.g., form submission success, task completion)
 */
export const successHaptic = async (): Promise<void> => {
  await executeHaptic(
    async () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    async () => {
      // Android fallback: two quick light impacts
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  );
};

/**
 * Warning haptic pattern (e.g., form validation warnings, confirmations)
 */
export const warningHaptic = async (): Promise<void> => {
  await executeHaptic(
    async () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    async () => {
      // Android fallback: medium impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  );
};

/**
 * Error haptic pattern (e.g., form submission errors, invalid actions)
 */
export const errorHaptic = async (): Promise<void> => {
  await executeHaptic(
    async () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    async () => {
      // Android fallback: heavy impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    },
  );
};

/**
 * Long press haptic (e.g., context menus, drag initiation)
 */
export const longPressHaptic = async (): Promise<void> => {
  await executeHaptic(
    async () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    async () => {
      // Android: medium impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  );
};

/**
 * Scroll haptic for list boundaries (e.g., pull-to-refresh, end of list)
 */
export const scrollBoundaryHaptic = async (): Promise<void> => {
  await executeHaptic(
    async () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    async () => {
      // Android: light impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  );
};

/**
 * Custom haptic pattern for special interactions
 * @param pattern Array of { type: 'impact' | 'wait', style?: ImpactFeedbackStyle, duration?: number }
 */
export const customHapticPattern = async (
  pattern: Array<{
    type: "impact" | "wait";
    style?: Haptics.ImpactFeedbackStyle;
    duration?: number;
  }>,
): Promise<void> => {
  if (!cachedSettings.enabled) {
    return;
  }

  try {
    for (const step of pattern) {
      if (step.type === "impact") {
        await Haptics.impactAsync(step.style || Haptics.ImpactFeedbackStyle.Medium);
      } else if (step.type === "wait" && step.duration) {
        await new Promise((resolve) => setTimeout(resolve, step.duration));
      }
    }
  } catch (error) {
    console.warn("Custom haptic pattern failed:", error);
  }
};

// Common haptic patterns
export const hapticPatterns = {
  doubleLight: [
    { type: "impact" as const, style: Haptics.ImpactFeedbackStyle.Light },
    { type: "wait" as const, duration: 100 },
    { type: "impact" as const, style: Haptics.ImpactFeedbackStyle.Light },
  ],
  tripleLight: [
    { type: "impact" as const, style: Haptics.ImpactFeedbackStyle.Light },
    { type: "wait" as const, duration: 100 },
    { type: "impact" as const, style: Haptics.ImpactFeedbackStyle.Light },
    { type: "wait" as const, duration: 100 },
    { type: "impact" as const, style: Haptics.ImpactFeedbackStyle.Light },
  ],
  heavyPause: [
    { type: "impact" as const, style: Haptics.ImpactFeedbackStyle.Heavy },
    { type: "wait" as const, duration: 200 },
    { type: "impact" as const, style: Haptics.ImpactFeedbackStyle.Light },
  ],
  rhythmic: [
    { type: "impact" as const, style: Haptics.ImpactFeedbackStyle.Light },
    { type: "wait" as const, duration: 150 },
    { type: "impact" as const, style: Haptics.ImpactFeedbackStyle.Medium },
    { type: "wait" as const, duration: 150 },
    { type: "impact" as const, style: Haptics.ImpactFeedbackStyle.Heavy },
  ],
};

/**
 * Hook to use haptic feedback with settings
 */
export const useHaptics = () => {
  return {
    settings: getHapticSettings(),
    toggle: toggleHaptics,
    setIntensity: setHapticIntensity,
    selection: selectionHaptic,
    impact: impactHaptic,
    lightImpact: lightImpactHaptic,
    heavyImpact: heavyImpactHaptic,
    success: successHaptic,
    warning: warningHaptic,
    error: errorHaptic,
    longPress: longPressHaptic,
    scrollBoundary: scrollBoundaryHaptic,
    customPattern: customHapticPattern,
    patterns: hapticPatterns,
  };
};

// Don't initialize at module load - let it initialize lazily on first use
// This prevents AsyncStorage errors during bundling
