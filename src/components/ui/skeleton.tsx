import * as React from "react";
import { AccessibilityInfo, ViewStyle, StyleSheet, Platform, AppState, AppStateStatus } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/lib/theme";

export interface SkeletonProps {
  style?: ViewStyle;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

// Optimized duration - faster animation uses less resources on Android
// iOS can handle longer animations smoothly, Android benefits from shorter cycles
const duration = Platform.OS === 'android' ? 600 : 800;

// Cache to track active skeletons - helps prevent too many concurrent animations
let activeSkeletonCount = 0;
const MAX_ANIMATED_SKELETONS = Platform.OS === 'android' ? 8 : 15;

function Skeleton({ style, width, height, borderRadius = 6, ...props }: SkeletonProps) {
  const sv = useSharedValue(1);
  const [reduceMotionEnabled, setReduceMotionEnabled] = React.useState(false);
  const [shouldAnimate, setShouldAnimate] = React.useState(true);
  const { colors, isDark } = useTheme();
  const isAnimatingRef = React.useRef(false);

  // Check reduce motion preference
  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotionEnabled);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotionEnabled);
    return () => subscription?.remove();
  }, []);

  // Pause animations when app is in background (saves battery and CPU)
  React.useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      setShouldAnimate(state === 'active');
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Manage animation based on active skeleton count and visibility
  React.useEffect(() => {
    // Don't animate if motion is reduced
    if (reduceMotionEnabled) {
      sv.value = 0.7;
      return;
    }

    // Don't animate if app is backgrounded
    if (!shouldAnimate) {
      cancelAnimation(sv);
      sv.value = 0.7;
      return;
    }

    // Limit concurrent animations on Android for better performance
    if (Platform.OS === 'android' && activeSkeletonCount >= MAX_ANIMATED_SKELETONS) {
      sv.value = 0.7; // Static fallback when too many skeletons
      return;
    }

    // Track this skeleton as actively animating
    activeSkeletonCount++;
    isAnimatingRef.current = true;

    // Use easing for smoother animation that's gentler on the CPU
    sv.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );

    return () => {
      if (isAnimatingRef.current) {
        activeSkeletonCount = Math.max(0, activeSkeletonCount - 1);
        isAnimatingRef.current = false;
      }
      cancelAnimation(sv);
    };
  }, [reduceMotionEnabled, shouldAnimate, sv]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: sv.value,
  }));

  // Memoize skeleton styles to prevent recreation on every render
  const skeletonStyles = React.useMemo<ViewStyle>(() => ({
    backgroundColor: colors.muted,
    borderRadius,
    width: width as ViewStyle['width'],
    height: height as ViewStyle['height'],
    ...style,
  }), [colors.muted, borderRadius, width, height, style]);

  return (
    <Animated.View
      style={StyleSheet.flatten([skeletonStyles, animatedStyle])}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando..."
      accessibilityState={{ busy: true }}
      {...props}
    />
  );
}

export { Skeleton, duration };