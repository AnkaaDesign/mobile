
import { ActivityIndicator as RNActivityIndicator, View, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/lib/theme";

interface ActivityIndicatorProps {
  size?: "small" | "large" | number;
  color?: string;
  style?: ViewStyle | ViewStyle[];
  centered?: boolean;
}

export function ActivityIndicator({
  size = "small",
  color,
  style,
  centered = false,
}: ActivityIndicatorProps) {
  const { colors } = useTheme();
  const indicatorColor = color || colors.primary;

  const indicator = (
    <RNActivityIndicator
      size={size}
      color={indicatorColor}
      style={style}
    />
  );

  if (centered) {
    return (
      <View style={styles.centeredContainer}>
        {indicator}
      </View>
    );
  }

  return indicator;
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
