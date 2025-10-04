import * as React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {  Extrapolation, interpolate, useAnimatedStyle, useDerivedValue, withSpring  } from "react-native-reanimated";
import { ThemedText } from "./themed-text";
import { useTheme } from "@/lib/theme";
import { fontSize } from "@/constants/design-system";

export interface ProgressWithMarkersProps {
  value?: number;
  max?: number;
  minValue?: number;
  reorderPoint?: number;
  style?: ViewStyle;
  indicatorStyle?: ViewStyle;
  showLabels?: boolean;
}

const ProgressWithMarkers = React.forwardRef<View, ProgressWithMarkersProps>(
  ({ value = 0, max = 100, minValue, reorderPoint, style, indicatorStyle, showLabels = false, ...props }, ref) => {
    const { colors } = useTheme();
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const containerStyles: ViewStyle = {
      position: "relative",
      height: 8,
      width: "100%",
      overflow: "visible",
      borderRadius: 9999,
      backgroundColor: colors.muted,
      ...style,
    };

    // Calculate marker positions
    const minMarkerPosition = minValue ? (minValue / max) * 100 : null;
    const reorderMarkerPosition = reorderPoint ? (reorderPoint / max) * 100 : null;

    return (
      <View style={{ marginTop: showLabels ? 10 : 0, marginBottom: showLabels ? 20 : 0 }}>
        <View ref={ref} style={containerStyles} {...props}>
          <Indicator value={percentage} style={indicatorStyle} />

          {/* Minimum marker */}
          {minMarkerPosition !== null && (
            <View style={StyleSheet.flatten([styles.marker, { left: `${minMarkerPosition}%`, backgroundColor: colors.destructive }])}>
              {showLabels && <ThemedText style={StyleSheet.flatten([styles.markerLabel, { color: colors.destructive }])}>Min</ThemedText>}
            </View>
          )}

          {/* Reorder point marker */}
          {reorderMarkerPosition !== null && (
            <View style={StyleSheet.flatten([styles.marker, { left: `${reorderMarkerPosition}%`, backgroundColor: colors.warning }])}>
              {showLabels && <ThemedText style={StyleSheet.flatten([styles.markerLabel, { color: colors.warning }])}>Reposição</ThemedText>}
            </View>
          )}
        </View>
      </View>
    );
  },
);

ProgressWithMarkers.displayName = "ProgressWithMarkers";

function Indicator({ value, style }: { value: number; style?: ViewStyle }) {
  const progress = useDerivedValue(() => value ?? 0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(`${interpolate(progress.value, [0, 100], [0, 100], Extrapolation.CLAMP)}%`, { overshootClamping: true }),
    };
  });

  const indicatorStyles: ViewStyle = {
    height: "100%",
    backgroundColor: "#16a34a",
    borderRadius: 9999,
    ...style,
  };

  return <Animated.View style={StyleSheet.flatten([indicatorStyles, animatedStyle])} />;
}

const styles = {
  marker: {
    position: "absolute" as const,
    width: 2,
    height: 16,
    top: -4,
    transform: [{ translateX: -1 }],
  },
  markerLabel: {
    position: "absolute" as const,
    top: -20,
    fontSize: fontSize.xs,
    fontWeight: "600" as const,
    transform: [{ translateX: -12 }],
    width: 50,
  },
};

export { ProgressWithMarkers };

