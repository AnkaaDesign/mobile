import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailRow } from "@/components/ui/detail-row";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { IconBox, IconPackage, IconCurrencyDollar, IconArrowRight, IconAlertTriangle } from "@tabler/icons-react-native";
import { routes, MEASURE_UNIT_LABELS } from '../../../../constants';
import { formatCurrency, itemUtils } from '../../../../utils';
import { routeToMobilePath } from "@/lib/route-mapper";
import type { Item } from '../../../../types';

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const { colors, isDark } = useTheme();

  const getStockStatus = () => {
    const quantity = item.quantity || 0;

    if (quantity === 0) {
      return { label: "Sem Estoque", color: "destructive" as const };
    }

    if (item.reorderPoint && quantity <= item.reorderPoint) {
      return { label: "Estoque Baixo", color: "warning" as const };
    }

    return { label: "Estoque Normal", color: "success" as const };
  };

  const stockStatus = getStockStatus();
  const currentPrice = item.prices?.[0]?.value;

  const handleNavigateToItem = () => {
    router.push(routeToMobilePath(routes.inventory.products.details(item.id)) as any);
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconBox size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>Item de Estoque</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <TouchableOpacity onPress={handleNavigateToItem} activeOpacity={0.7}>
          <View style={StyleSheet.flatten([styles.itemCard, { backgroundColor: colors.muted + "30", borderColor: colors.border }])}>
            <View style={styles.itemHeader}>
              <View style={styles.itemInfo}>
                <ThemedText style={StyleSheet.flatten([styles.itemName, { color: colors.foreground }])}>{item.name}</ThemedText>
                {item.uniCode && (
                  <ThemedText style={StyleSheet.flatten([styles.itemCode, { color: colors.mutedForeground }])}>
                    Código: {item.uniCode}
                  </ThemedText>
                )}
              </View>
              <IconArrowRight size={20} color={colors.mutedForeground} />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View
                  style={[
                    styles.statIcon,
                    {
                      backgroundColor:
                        stockStatus.color === "destructive"
                          ? extendedColors.red[100]
                          : stockStatus.color === "warning"
                            ? extendedColors.yellow[100]
                            : extendedColors.green[100],
                    },
                  ]}
                >
                  <IconPackage
                    size={16}
                    color={
                      stockStatus.color === "destructive"
                        ? extendedColors.red[600]
                        : stockStatus.color === "warning"
                          ? extendedColors.yellow[600]
                          : extendedColors.green[600]
                    }
                  />
                </View>
                <View>
                  <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>
                    {itemUtils.formatItemQuantity(item)}
                  </ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>
                    {item.measures?.[0]?.unit ? MEASURE_UNIT_LABELS[item.measures[0].unit] : "em estoque"}
                  </ThemedText>
                </View>
              </View>

              {currentPrice && (
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: extendedColors.green[100] }]}>
                    <IconCurrencyDollar size={16} color={extendedColors.green[600]} />
                  </View>
                  <View>
                    <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>
                      {formatCurrency(currentPrice)}
                    </ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>preço unitário</ThemedText>
                  </View>
                </View>
              )}
            </View>

            {item.reorderPoint && item.quantity <= item.reorderPoint && (
              <View style={StyleSheet.flatten([styles.warningBox, { backgroundColor: extendedColors.yellow[100], borderColor: extendedColors.yellow[600] }])}>
                <IconAlertTriangle size={16} color={extendedColors.yellow[700]} />
                <ThemedText style={StyleSheet.flatten([styles.warningText, { color: extendedColors.yellow[700] }])}>
                  Estoque abaixo do ponto de reposição ({item.reorderPoint} unidades)
                </ThemedText>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    gap: spacing.md,
  },
  itemCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  itemCode: {
    fontSize: fontSize.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  statLabel: {
    fontSize: fontSize.xs,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
