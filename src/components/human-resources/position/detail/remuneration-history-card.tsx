import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconHistory, IconCurrencyReal, IconTrendingUp, IconTrendingDown, IconMinus } from "@tabler/icons-react-native";
import type { Position, PositionRemuneration } from '../../../../types';
import { formatCurrency, formatDateTime } from '../../../../utils';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

interface RemunerationHistoryCardProps {
  position: Position;
}

export function RemunerationHistoryCard({ position }: RemunerationHistoryCardProps) {
  const { colors, isDark } = useTheme();

  if (!position.remunerations || position.remunerations.length === 0) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <IconHistory size={20} color={colors.primary} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Histórico de Remunerações
          </ThemedText>
        </View>

        <View style={styles.content}>
          <View style={[styles.emptyState, { backgroundColor: colors.muted + "30" }]}>
            <IconCurrencyReal size={48} color={colors.mutedForeground} />
            <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nenhum histórico de remuneração encontrado
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  const sortedRemunerations = [...position.remunerations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getChangeInfo = (current: PositionRemuneration, previous?: PositionRemuneration) => {
    if (!previous) return null;

    const difference = current.value - previous.value;
    const percentage = ((difference / previous.value) * 100).toFixed(1);

    if (difference > 0) {
      return {
        icon: IconTrendingUp,
        color: isDark ? extendedColors.green[400] : extendedColors.green[600],
        badge: "success" as const,
        text: `+${formatCurrency(difference)} (${percentage}%)`,
      };
    } else if (difference < 0) {
      return {
        icon: IconTrendingDown,
        color: isDark ? extendedColors.red[400] : extendedColors.red[600],
        badge: "destructive" as const,
        text: `${formatCurrency(difference)} (${percentage}%)`,
      };
    } else {
      return {
        icon: IconMinus,
        color: colors.mutedForeground,
        badge: "secondary" as const,
        text: "Sem alteração",
      };
    }
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconHistory size={20} color={colors.primary} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Histórico de Remunerações
          </ThemedText>
        </View>
        <Badge variant="secondary">
          <ThemedText style={[styles.badgeText, { color: colors.foreground }]}>
            {sortedRemunerations.length} registro{sortedRemunerations.length !== 1 ? 's' : ''}
          </ThemedText>
        </Badge>
      </View>

      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          <View style={styles.remunerationsList}>
            {sortedRemunerations.map((remuneration, index) => {
              const previous = sortedRemunerations[index + 1];
              const changeInfo = getChangeInfo(remuneration, previous);
              const isLatest = index === 0;
              const isFirst = index === sortedRemunerations.length - 1;

              return (
                <View
                  key={remuneration.id}
                  style={[
                    styles.remunerationItem,
                    {
                      backgroundColor: isLatest ? colors.primary + "10" : colors.card,
                      borderColor: isLatest ? colors.primary : colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <View style={styles.remunerationHeader}>
                    <View style={styles.valueContainer}>
                      <ThemedText style={[styles.remunerationValue, { color: colors.foreground }]}>
                        {formatCurrency(remuneration.value)}
                      </ThemedText>
                      {isLatest && (
                        <Badge variant="default" style={styles.currentBadge}>
                          <ThemedText style={[styles.currentBadgeText, { color: colors.primaryForeground }]}>
                            Atual
                          </ThemedText>
                        </Badge>
                      )}
                    </View>

                    {changeInfo && (
                      <View style={styles.changeContainer}>
                        <changeInfo.icon size={16} color={changeInfo.color} />
                        <Badge variant={changeInfo.badge}>
                          <ThemedText style={[styles.changeText, { color: colors.primaryForeground }]}>
                            {changeInfo.text}
                          </ThemedText>
                        </Badge>
                      </View>
                    )}
                  </View>

                  <View style={styles.dateContainer}>
                    <ThemedText style={[styles.dateText, { color: colors.mutedForeground }]}>
                      Registrado em {formatDateTime(remuneration.createdAt)}
                    </ThemedText>
                  </View>

                  {isFirst && (
                    <View style={[styles.initialBadgeContainer, { borderTopColor: colors.border }]}>
                      <ThemedText style={[styles.initialBadgeText, { color: colors.mutedForeground }]}>
                        Remuneração inicial do cargo
                      </ThemedText>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
  content: {
    padding: spacing.md,
  },
  scrollView: {
    maxHeight: 400,
  },
  emptyState: {
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  remunerationsList: {
    gap: spacing.md,
  },
  remunerationItem: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  remunerationHeader: {
    gap: spacing.sm,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  remunerationValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  currentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  currentBadgeText: {
    fontSize: fontSize.xs,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  changeText: {
    fontSize: fontSize.xs,
  },
  dateContainer: {
    marginTop: spacing.xs,
  },
  dateText: {
    fontSize: fontSize.sm,
  },
  initialBadgeContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  initialBadgeText: {
    fontSize: fontSize.xs,
  },
});
