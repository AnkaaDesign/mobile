import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";

/**
 * Compact time-slot box used in the daily / edit Controle de Ponto views. The
 * value (a HH:MM punch time) sits on top with its label below, wrapped in a
 * single bordered box — mirroring the Fechamento `StatChip` layout so both
 * screens read consistently. Empty punches ("—") render muted.
 */
export function TimeSlotChip({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) {
  const empty = !value || value === "—";
  return (
    <View style={[styles.box, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      <ThemedText
        style={[styles.value, { color: empty ? colors.mutedForeground : colors.foreground }]}
        numberOfLines={1}
      >
        {value || "—"}
      </ThemedText>
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
    paddingHorizontal: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  value: { fontSize: 14, fontWeight: "700" },
  label: { fontSize: 10, fontWeight: "500" },
});
