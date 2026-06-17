import React from "react";
import { View, StyleSheet } from "react-native";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconArrowDownRight,
  IconUserPlus,
  IconPencil,
} from "@tabler/icons-react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { POSITION_CHANGE_REASON } from "@/constants";
import type { UserPositionHistory } from "@/types";

/**
 * Semantic rendering of a position change, per reason — mirrors web's
 * PositionChangeSummary:
 * - ADMISSION → "Admitido como <Cargo>" (no arrow)
 * - PROMOTION → "<Anterior> ↗ <Novo>" (green)
 * - DEMOTION  → Reversão (CLT art.468 §único): "<Anterior> ↘ <Novo>" NEUTRO
 *   (não vermelho — é movimento lícito, não rebaixamento punitivo).
 * - TRANSFER/ADJUSTMENT/CORRECTION → neutral arrow.
 * A null previousPosition never renders a dangling "— →".
 */
export function PositionChangeSummary({ history }: { history: UserPositionHistory }) {
  const { colors } = useTheme();
  const positionName = history.position?.name || "Sem cargo";
  const previousName = history.previousPosition?.name;

  const green = "#15803d";

  if (history.reason === POSITION_CHANGE_REASON.ADMISSION || !previousName) {
    const isAdmission = history.reason === POSITION_CHANGE_REASON.ADMISSION;
    return (
      <View style={styles.row}>
        {isAdmission ? (
          <IconUserPlus size={16} color="#1d4ed8" />
        ) : (
          <IconPencil size={16} color={colors.mutedForeground} />
        )}
        {isAdmission ? (
          <ThemedText style={[styles.muted, { color: colors.mutedForeground }]}>Admitido como</ThemedText>
        ) : null}
        <ThemedText style={styles.name}>{positionName}</ThemedText>
      </View>
    );
  }

  let arrow = <IconArrowRight size={16} color={colors.mutedForeground} />;
  let nameColor: string | undefined;
  if (history.reason === POSITION_CHANGE_REASON.PROMOTION) {
    arrow = <IconArrowUpRight size={16} color={green} />;
    nameColor = green;
  } else if (history.reason === POSITION_CHANGE_REASON.DEMOTION) {
    // Reversão (lícita) — seta para baixo neutra, sem cor punitiva.
    arrow = <IconArrowDownRight size={16} color={colors.mutedForeground} />;
  }

  return (
    <View style={styles.row}>
      <ThemedText style={[styles.muted, { color: colors.mutedForeground }]}>{previousName}</ThemedText>
      {arrow}
      <ThemedText style={[styles.name, nameColor ? { color: nameColor } : undefined]}>{positionName}</ThemedText>
    </View>
  );
}

export function reasonBadgeVariant(reason: string): string {
  switch (reason) {
    case "ADMISSION":
      return "blue";
    case "PROMOTION":
      return "active";
    case "TRANSFER":
      return "secondary";
    case "DEMOTION": // Reversão (lícita) — variante neutra, não "cancelled".
      return "secondary";
    case "ADJUSTMENT":
      return "muted";
    case "CORRECTION":
      return "outline";
    default:
      return "default";
  }
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexShrink: 1, flexWrap: "wrap" },
  muted: { fontSize: fontSize.sm },
  name: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
