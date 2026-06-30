import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";

export type StatTone = "neutral" | "success" | "danger" | "warning";

const PALETTE: Record<StatTone, string> = {
  neutral: "",
  success: "#16a34a",
  danger: "#dc2626",
  warning: "#d97706",
};

/**
 * Compact stat box used across the Fechamento screens. The value and its label
 * are wrapped together inside a single tinted, bordered box (rather than a loose
 * pill + caption). The box is tinted only when the value is non-zero (matching
 * the web, where a count of 0 reads as muted/secondary rather than a loud badge).
 */
export function StatChip({ label, value, tone, colors }: { label: string; value: number; tone: StatTone; colors: any }) {
  const active = value > 0 && tone !== "neutral";
  const accent = tone === "neutral" ? colors.foreground : PALETTE[tone];
  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: active ? `${accent}1f` : colors.muted,
          borderColor: active ? `${accent}40` : colors.border,
        },
      ]}
    >
      <ThemedText style={[styles.value, { color: active ? accent : colors.foreground }]}>{value}</ThemedText>
      <ThemedText style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  value: { fontSize: 18, fontWeight: "700" },
  label: { fontSize: 10, fontWeight: "500" },
});
