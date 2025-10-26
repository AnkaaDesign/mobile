import * as React from "react";
import { AccessibilityInfo, ViewStyle , StyleSheet} from "react-native";
import Animated, {  useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming  } from "react-native-reanimated";
import { useTheme } from "@/lib/theme";

export interface SkeletonProps {
  style?: ViewStyle;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

const duration = 1000;

function Skeleton({ style, width, height, borderRadius = 6, ...props }: SkeletonProps) {
  const sv = useSharedValue(1);
  const [reduceMotionEnabled, setReduceMotionEnabled] = React.useState(false);
  const { colors, isDark } = useTheme();

  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotionEnabled);

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotionEnabled);

    return () => subscription?.remove();
  }, []);

  React.useEffect(() => {
    if (!reduceMotionEnabled) {
      sv.value = withRepeat(withSequence(withTiming(0.5, { duration }), withTiming(1, { duration })), -1);
    } else {
      sv.value = 0.7; // Static opacity when motion is reduced
    }
  }, [reduceMotionEnabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: sv.value,
  }));

  const skeletonStyles: ViewStyle = {
    backgroundColor: isDark ? colors.muted : colors.muted,
    borderRadius,
    width: width as ViewStyle['width'],
    height: height as ViewStyle['height'],
    ...style,
  };

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