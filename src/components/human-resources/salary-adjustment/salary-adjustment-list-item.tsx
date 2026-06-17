import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { IconChevronRight } from "@tabler/icons-react-native";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatDate } from "@/utils/formatters";
import { formatPercentage } from "@/utils";
import { SALARY_ADJUSTMENT_TYPE_LABELS } from "@/constants/enum-labels";
import type { SalaryAdjustment } from "@/types";

interface Props {
  adjustment: SalaryAdjustment;
  onPress: (adjustment: SalaryAdjustment) => void;
}

export function SalaryAdjustmentListItem({ adjustment, onPress }: Props) {
  const { colors } = useTheme();
  const itemsCount = adjustment.items?.length ?? (adjustment as any)._count?.items ?? 0;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => onPress(adjustment)}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.left}>
            <View style={styles.titleRow}>
              <Badge variant="secondary">{SALARY_ADJUSTMENT_TYPE_LABELS[adjustment.type] || adjustment.type}</Badge>
              {adjustment.percentage !== null && adjustment.percentage !== undefined ? (
                <ThemedText style={styles.percentage}>{formatPercentage(adjustment.percentage)}</ThemedText>
              ) : (
                <Badge variant="outline">Personalizado</Badge>
              )}
            </View>
            <ThemedText style={[styles.meta, { color: colors.mutedForeground }]}>
              Vigência: {formatDate(adjustment.effectiveDate)}
            </ThemedText>
            <ThemedText style={[styles.meta, { color: colors.mutedForeground }]}>
              {itemsCount} {itemsCount === 1 ? "cargo afetado" : "cargos afetados"}
            </ThemedText>
          </View>
          <IconChevronRight size={20} color={colors.mutedForeground} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  left: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  percentage: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  meta: { fontSize: fontSize.sm },
});
