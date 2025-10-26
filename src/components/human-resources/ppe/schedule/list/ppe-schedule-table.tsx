// apps/mobile/src/components/human-resources/ppe/schedule/list/ppe-schedule-table.tsx

import React, { useCallback } from "react";
import { FlatList, View, Pressable, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { badgeColors } from "@/lib/theme/extended-colors";
import { SCHEDULE_FREQUENCY_LABELS, ASSIGNMENT_TYPE_LABELS, PPE_TYPE_LABELS } from '../../../../../constants';
import { formatDate } from '../../../../../utils';
import { routes } from '../../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import type { PpeDeliverySchedule } from '../../../../../types';
import { differenceInDays } from "date-fns";
import type { SortConfig } from "@/lib/sort-utils";


interface PpeScheduleTableProps {
  schedules: PpeDeliverySchedule[];
  onSchedulePress?: (scheduleId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
}

export const PpeScheduleTable = React.memo<PpeScheduleTableProps>(({
  schedules,
  onSchedulePress,
  onRefresh,
  onEndReached,
  refreshing = false,
  loading = false,
  loadingMore = false,
  sortConfigs = [],
  onSort,
}) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  // Get status badge variant and text based on schedule status
  const getStatusInfo = useCallback((schedule: PpeDeliverySchedule) => {
    if (!schedule.isActive) {
      return {
        variant: "secondary" as const,
        text: "Inativo",
        color: badgeColors.muted.background,
        textColor: badgeColors.muted.text,
      };
    }

    if (!schedule.nextRun) {
      return {
        variant: "default" as const,
        text: "Sem Próxima",
        color: badgeColors.warning.background,
        textColor: badgeColors.warning.text,
      };
    }

    const daysUntilNext = differenceInDays(new Date(schedule.nextRun), new Date());

    if (daysUntilNext < 0) {
      return {
        variant: "destructive" as const,
        text: "Atrasado",
        color: badgeColors.error.background,
        textColor: badgeColors.error.text,
      };
    }

    if (daysUntilNext <= 7) {
      return {
        variant: "default" as const,
        text: "Em Breve",
        color: badgeColors.warning.background,
        textColor: badgeColors.warning.text,
      };
    }

    return {
      variant: "default" as const,
      text: "Ativo",
      color: badgeColors.success.background,
      textColor: badgeColors.success.text,
    };
  }, []);

  // Render individual schedule row
  const renderScheduleRow = useCallback(
    ({ item, index }: { item: PpeDeliverySchedule; index: number }) => {
      const isEven = index % 2 === 0;
      const statusInfo = getStatusInfo(item);

      // Extract user or category for display
      const assignmentDisplay = item.user?.name || item.category?.name || ASSIGNMENT_TYPE_LABELS[item.assignmentType as keyof typeof ASSIGNMENT_TYPE_LABELS];

      // Get PPE items summary
      const ppeItemsCount = item.ppeItems?.length || 0;
      const ppeItemsSummary = item.ppeItems
        ?.slice(0, 2)
        .map(ppeItem => PPE_TYPE_LABELS[ppeItem.ppeType as keyof typeof PPE_TYPE_LABELS])
        .join(", ") || "N/A";

      return (
        <Pressable
          style={[
            styles.row,
            {
              backgroundColor: isEven ? colors.background : isDark ? "#18181b" : "#fafafa",
            },
          ]}
          onPress={() => onSchedulePress?.(item.id)}
        >
          {/* Header row with assignment and status */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Icon name="user" size="sm" color={colors.mutedForeground} />
              <ThemedText style={styles.assignmentText} numberOfLines={1}>
                {assignmentDisplay}
              </ThemedText>
            </View>
            <Badge
              variant={statusInfo.variant}
              size="sm"
              style={{
                backgroundColor: statusInfo.color,
                borderWidth: 0,
              }}
            >
              <ThemedText
                style={{
                  color: statusInfo.textColor,
                  fontSize: fontSize.xs,
                  fontWeight: fontWeight.medium,
                }}
              >
                {statusInfo.text}
              </ThemedText>
            </Badge>
          </View>

          {/* PPE Items row */}
          <View style={styles.infoRow}>
            <Icon name="package" size="sm" color={colors.mutedForeground} />
            <ThemedText style={styles.infoText} numberOfLines={1}>
              {ppeItemsCount > 2 ? `${ppeItemsSummary} +${ppeItemsCount - 2} mais` : ppeItemsSummary}
            </ThemedText>
          </View>

          {/* Frequency row */}
          <View style={styles.infoRow}>
            <Icon name="calendar-repeat" size="sm" color={colors.mutedForeground} />
            <ThemedText style={styles.infoText}>
              {SCHEDULE_FREQUENCY_LABELS[item.frequency as keyof typeof SCHEDULE_FREQUENCY_LABELS]}
              {item.frequencyCount > 1 && ` (${item.frequencyCount}x)`}
            </ThemedText>
          </View>

          {/* Dates row */}
          <View style={styles.datesRow}>
            {item.lastRun && (
              <View style={styles.dateColumn}>
                <ThemedText style={styles.dateLabel}>Última Entrega</ThemedText>
                <ThemedText style={styles.dateValue}>{formatDate(item.lastRun)}</ThemedText>
              </View>
            )}
            {item.nextRun && (
              <View style={styles.dateColumn}>
                <ThemedText style={styles.dateLabel}>Próxima Entrega</ThemedText>
                <ThemedText style={styles.dateValue}>{formatDate(item.nextRun)}</ThemedText>
              </View>
            )}
          </View>
        </Pressable>
      );
    },
    [colors, isDark, getStatusInfo, onSchedulePress],
  );

  // Loading footer component
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando mais...</ThemedText>
      </View>
    );
  }, [loadingMore, colors.primary]);

  // Empty state component
  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Icon name="calendar-off" size="xl" variant="muted" />
        <ThemedText style={styles.emptyTitle}>Nenhum agendamento encontrado</ThemedText>
        <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou adicione um novo agendamento</ThemedText>
      </View>
    ),
    [],
  );

  // Main loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando agendamentos...</ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={schedules}
        renderItem={renderScheduleRow}
        keyExtractor={(item) => item.id}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.2}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={15}
        updateCellsBatchingPeriod={50}
        style={styles.flatList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={schedules.length === 0 ? styles.emptyContentContainer : styles.contentContainer}
      />
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyContentContainer: {
    flexGrow: 1,
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  assignmentText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  datesRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  dateColumn: {
    flex: 1,
    gap: 4,
  },
  dateLabel: {
    fontSize: fontSize.xs,
    opacity: 0.7,
  },
  dateValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});

PpeScheduleTable.displayName = "PpeScheduleTable";
