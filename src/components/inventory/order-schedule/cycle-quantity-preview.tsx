/**
 * CycleQuantityPreview
 *
 * Shows the items that will be ordered each cycle with the estimated quantity
 * (computed from monthly consumption + lead time + safety buffer + cycle length).
 *
 * Mirrors the formula used on the web side in:
 *   web/src/components/inventory/common/item-selector/item-selector-columns.tsx → computeCyclePreviewQuantity
 *
 *   quantity = ceil( max(reorderPoint, mc/30 × (cycleDays + leadTime) × (1 + safetyBuffer)) )
 *   then snapped up to a multiple of boxQuantity when set.
 */

import { useMemo } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { IconCalculator } from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import {
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from "@/constants/design-system";
import { formatQuantity } from "@/utils";
import { useItems } from "@/hooks";
import { SCHEDULE_FREQUENCY } from "@/constants";

const BASE_DAYS_BY_FREQUENCY: Record<string, number> = {
  [SCHEDULE_FREQUENCY.DAILY]: 1,
  [SCHEDULE_FREQUENCY.WEEKLY]: 7,
  [SCHEDULE_FREQUENCY.BIWEEKLY]: 14,
  [SCHEDULE_FREQUENCY.MONTHLY]: 30,
  [SCHEDULE_FREQUENCY.BIMONTHLY]: 60,
  [SCHEDULE_FREQUENCY.QUARTERLY]: 90,
  [SCHEDULE_FREQUENCY.TRIANNUAL]: 120,
  [SCHEDULE_FREQUENCY.QUADRIMESTRAL]: 120,
  [SCHEDULE_FREQUENCY.SEMI_ANNUAL]: 180,
  [SCHEDULE_FREQUENCY.ANNUAL]: 365,
  [SCHEDULE_FREQUENCY.ONCE]: 30,
  [SCHEDULE_FREQUENCY.CUSTOM]: 30,
};

function frequencyToCycleDays(
  frequency: string | undefined | null,
  frequencyCount: number | undefined | null,
): number {
  const base = BASE_DAYS_BY_FREQUENCY[frequency ?? ""] ?? 30;
  const interval = frequencyCount && frequencyCount > 0 ? frequencyCount : 1;
  return base * interval;
}

function computeCyclePreviewQuantity(item: any, cycleDays: number): number | null {
  if (!cycleDays || cycleDays <= 0) return null;
  const monthly = item?.monthlyConsumption || 0;
  const reorderPoint = item?.reorderPoint || 0;
  if (monthly <= 0 && reorderPoint <= 0) return null;
  const dailyConsumption = monthly / 30;
  const leadTime = item?.estimatedLeadTime || 0;
  const safetyBuffer = 0.05; // 5% — matches API default
  const projected = dailyConsumption * (cycleDays + leadTime) * (1 + safetyBuffer);
  let quantity = Math.max(projected, reorderPoint);
  if (item?.boxQuantity && item.boxQuantity > 0) {
    quantity = Math.ceil(quantity / item.boxQuantity) * item.boxQuantity;
  } else {
    quantity = Math.ceil(quantity);
  }
  return quantity;
}

interface CycleQuantityPreviewProps {
  itemIds: string[];
  frequency: string;
  frequencyCount?: number | null;
}

export function CycleQuantityPreview({
  itemIds,
  frequency,
  frequencyCount,
}: CycleQuantityPreviewProps) {
  const { colors } = useTheme();

  const cycleDays = useMemo(
    () => frequencyToCycleDays(frequency, frequencyCount),
    [frequency, frequencyCount],
  );

  const { data: itemsResponse, isLoading } = useItems(
    {
      where: itemIds.length > 0 ? { id: { in: itemIds } } : undefined,
      take: itemIds.length || 1,
    } as any,
    { enabled: itemIds.length > 0 },
  );

  const items: any[] = (itemsResponse as any)?.data || [];

  if (itemIds.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconCalculator size={20} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Quantidades por Ciclo (Estimada)
          </ThemedText>
          <ThemedText
            style={[styles.subtitle, { color: colors.mutedForeground }]}
          >
            Ciclo de aproximadamente {cycleDays} dia(s)
          </ThemedText>
        </View>
      </View>

      <View style={styles.body}>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <ThemedText
              style={[styles.loadingText, { color: colors.mutedForeground }]}
            >
              Calculando previsões...
            </ThemedText>
          </View>
        ) : items.length === 0 ? (
          <ThemedText
            style={[styles.empty, { color: colors.mutedForeground }]}
          >
            Nenhum item encontrado.
          </ThemedText>
        ) : (
          items.map((item, idx) => {
            const qty = computeCyclePreviewQuantity(item, cycleDays);
            const isLast = idx === items.length - 1;
            return (
              <View
                key={item.id}
                style={[
                  styles.row,
                  !isLast && {
                    borderBottomColor: colors.border + "60",
                    borderBottomWidth: 1,
                  },
                ]}
              >
                <View style={styles.rowText}>
                  <ThemedText
                    style={[styles.itemName, { color: colors.foreground }]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </ThemedText>
                  {item.uniCode && (
                    <ThemedText
                      style={[styles.itemCode, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {item.uniCode}
                    </ThemedText>
                  )}
                </View>
                <View style={styles.rowValue}>
                  <ThemedText
                    style={[styles.quantity, { color: colors.primary }]}
                  >
                    {qty !== null ? formatQuantity(qty) : "—"}
                  </ThemedText>
                  <ThemedText
                    style={[styles.quantityLabel, { color: colors.mutedForeground }]}
                  >
                    {qty !== null ? "un/ciclo" : "Sem consumo"}
                  </ThemedText>
                </View>
              </View>
            );
          })
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  subtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  body: {
    padding: spacing.sm,
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
  empty: {
    fontSize: fontSize.sm,
    padding: spacing.md,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  rowText: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  itemCode: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  rowValue: {
    alignItems: "flex-end",
  },
  quantity: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  quantityLabel: {
    fontSize: 10,
  },
});
