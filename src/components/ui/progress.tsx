import * as React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {  Extrapolation, interpolate, useAnimatedStyle, useDerivedValue, withSpring  } from "react-native-reanimated";
import { useTheme } from "@/lib/theme";

export interface ProgressProps {
  value?: number;
  max?: number;
  style?: ViewStyle;
  indicatorStyle?: ViewStyle;
}

const Progress = React.forwardRef<View, ProgressProps>(({ value = 0, max = 100, style, indicatorStyle, ...props }, ref) => {
  const { colors } = useTheme();
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const containerStyles: ViewStyle = {
    position: "relative",
    height: 8,
    width: "100%",
    overflow: "hidden",
    borderRadius: 9999,
    backgroundColor: colors.muted,
    ...style,
  };

  return (
    <View ref={ref} style={containerStyles} {...props}>
      <Indicator value={percentage} style={indicatorStyle} colors={colors} />
    </View>
  );
});

Progress.displayName = "Progress";

function Indicator({ value, style, colors }: { value: number; style?: ViewStyle; colors: any }) {
  const progress = useDerivedValue(() => value ?? 0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(`${interpolate(progress.value, [0, 100], [0, 100], Extrapolation.CLAMP)}%`, { overshootClamping: true }),
    };
  });

  const indicatorStyles: ViewStyle = {
    height: "100%",
    backgroundColor: colors.success,
    borderRadius: 9999,
    ...style,
  };

  return <Animated.View style={StyleSheet.flatten([indicatorStyles, animatedStyle])} />;
}

export { Progress };

