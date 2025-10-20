import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { IconHistory, IconTrendingUp, IconTrendingDown, IconMinus, IconChevronRight } from "@tabler/icons-react-native";
import type { Position } from '../../../../types';
import { formatCurrency, formatDate } from '../../../../utils';
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

interface RemunerationsCardProps {
  position: Position;
}

export function RemunerationsCard({ position }: RemunerationsCardProps) {
  const { colors, isDark } = useTheme();

  // Use monetaryValues (new) or fallback to remunerations (deprecated)
  const monetaryValues = position.monetaryValues || [];
  const remunerations = position.remunerations || [];
  const values = monetaryValues.length > 0 ? monetaryValues : remunerations;
  const hasRemunerations = values.length > 0;

  const handleViewRemunerations = () => {
    router.push(routeToMobilePath(routes.humanResources.positions.remunerations(position.id)) as any);
  };

  // Calculate trend
  const getTrend = (current: number, previous: number | null) => {
    if (!previous) return "new";
    if (current > previous) return "up";
    if (current < previous) return "down";
    return "same";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconHistory size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
              Histórico de Remunerações
            </ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasRemunerations ? (
          <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "30" }])}>
            <IconHistory size={32} color={colors.mutedForeground} />
            <ThemedText style={StyleSheet.flatten([styles.emptyStateText, { color: colors.mutedForeground }])}>
              Nenhum histórico de remuneração registrado
            </ThemedText>
          </View>
        ) : (
          <View style={styles.remunerationsContent}>
            <View style={styles.remunerationsList}>
              {values.slice(0, 5).map((remuneration, index) => {
                const previousValue = index < values.length - 1 ? values[index + 1].value : null;
                const trend = getTrend(remuneration.value, previousValue);

                const getTrendColor = () => {
                  switch (trend) {
                    case "up":
                      return isDark ? extendedColors.green[400] : extendedColors.green[600 as keyof typeof green];
                    case "down":
                      return isDark ? extendedColors.red[400] : extendedColors.red[600 as keyof typeof red];
                    default:
                      return colors.mutedForeground;
                  }
                };

                const getTrendIcon = () => {
                  switch (trend) {
                    case "up":
                      return <IconTrendingUp size={16} color={getTrendColor()} />;
                    case "down":
                      return <IconTrendingDown size={16} color={getTrendColor()} />;
                    default:
                      return <IconMinus size={16} color={getTrendColor()} />;
                  }
                };

                const getChangePercentage = () => {
                  if (!previousValue || trend === "new" || trend === "same") return null;
                  const change = ((remuneration.value - previousValue) / previousValue) * 100;
                  return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
                };

                return (
                  <View
                    key={remuneration.id}
                    style={StyleSheet.flatten([
                      styles.remunerationItem,
                      {
                        backgroundColor: colors.muted + "20",
                        borderBottomWidth: index < Math.min(values.length, 5) - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                      },
                    ])}
                  >
                    <View style={styles.remunerationContent}>
                      <View style={styles.remunerationInfo}>
                        <ThemedText style={StyleSheet.flatten([styles.remunerationValue, { color: colors.foreground }])}>
                          {formatCurrency(remuneration.value)}
                        </ThemedText>
                        <ThemedText style={StyleSheet.flatten([styles.remunerationDate, { color: colors.mutedForeground }])}>
                          {formatDate(new Date(remuneration.createdAt))}
                        </ThemedText>
                      </View>
                      {previousValue && (
                        <View style={styles.trendContainer}>
                          {getTrendIcon()}
                          {getChangePercentage() && (
                            <ThemedText style={StyleSheet.flatten([styles.trendText, { color: getTrendColor() }])}>
                              {getChangePercentage()}
                            </ThemedText>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {values.length > 5 && (
              <TouchableOpacity
                onPress={handleViewRemunerations}
                style={StyleSheet.flatten([styles.viewAllButton, { backgroundColor: colors.primary + "10" }])}
                activeOpacity={0.7}
              >
                <ThemedText style={StyleSheet.flatten([styles.viewAllText, { color: colors.primary }])}>
                  Ver todos os {values.length} registros
                </ThemedText>
                <IconChevronRight size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
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
  emptyState: {
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyStateText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  remunerationsContent: {
    gap: spacing.md,
  },
  remunerationsList: {
    gap: 0,
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  remunerationItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  remunerationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  remunerationInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  remunerationValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  remunerationDate: {
    fontSize: fontSize.xs,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  trendText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
