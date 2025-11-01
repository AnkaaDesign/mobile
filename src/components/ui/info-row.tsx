import React from "react";
import { View, Text, ViewStyle, TextStyle , StyleSheet} from "react-native";

interface InfoRowProps {
  label: string;
  value: string | number | React.ReactNode;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
  orientation?: "horizontal" | "vertical";
}

export function InfoRow({
  label,
  value,
  style,
  labelStyle,
  valueStyle,
  orientation = "horizontal",
}: InfoRowProps) {

  const isVertical = orientation === "vertical";

  return (
    <View
      style={StyleSheet.flatten([
        isVertical ? styles.containerVertical : styles.containerHorizontal,
        style,
      ])}
    >
      <Text style={StyleSheet.flatten([styles.label, labelStyle])}>{label}</Text>
      {typeof value === "string" || typeof value === "number" ? (
        <Text style={StyleSheet.flatten([styles.value, valueStyle])}>{value}</Text>
      ) : (
        <View style={styles.valueContainer}>{value}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  containerHorizontal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  containerVertical: {
    flexDirection: "column",
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: "#6B7280", // colors.mutedForeground
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    color: "#000000", // colors.foreground
    fontWeight: "400",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  valueContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
});