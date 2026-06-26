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
 * Compact labeled stat chip used across the Fechamento screens. The value bubble
 * is tinted only when the value is non-zero (matching the web, where a count of 0
 * reads as muted/secondary rather than a loud colored badge).
 */
export function StatChip({ label, value, tone, colors }: { label: string; value: number; tone: StatTone; colors: any }) {
  const active = value > 0 && tone !== "neutral";
  const accent = tone === "neutral" ? colors.foreground : PALETTE[tone];
  return (
    <View style={styles.wrap}>
      <View style={[styles.bubble, { backgroundColor: active ? `${accent}1f` : colors.muted }]}>
        <ThemedText style={[styles.value, { color: active ? accent : colors.foreground }]}>{value}</ThemedText>
      </View>
      <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", gap: 4 },
  bubble: { minWidth: 40, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignItems: "center" },
  value: { fontSize: 15, fontWeight: "700" },
  label: { fontSize: 10, fontWeight: "500" },
});
