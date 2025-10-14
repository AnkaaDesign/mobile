import React, { memo, useCallback } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconCalendarEvent, IconClock } from "@tabler/icons-react-native";
import { VacationListSkeleton } from "@/components/human-resources/vacation/skeleton/vacation-list-skeleton";
import { ErrorScreen } from "@/components/ui/error-screen";
import { spacing } from "@/constants/design-system";
import { VACATION_STATUS, VACATION_STATUS_LABELS, VACATION_TYPE_LABELS } from '../../../constants';
import { formatDate, getDifferenceInDays } from '../../../utils';
import type { Vacation } from '../../../types';

interface MyVacationListProps {
  vacations: Vacation[];
  isLoading: boolean;
  error: any;
  onVacationPress: (vacationId: string) => void;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  onEndReach: () => void;
  canLoadMore: boolean;
  loadingMore: boolean;
}

export const MyVacationList = memo(
  ({ vacations, isLoading, error, onVacationPress, onRefresh, refreshing, onEndReach, canLoadMore, loadingMore }: MyVacationListProps) => {
    const { colors } = useTheme();

    const getStatusVariant = (status: VACATION_STATUS) => {
      switch (status) {
        case VACATION_STATUS.APPROVED:
          return "success";
        case VACATION_STATUS.PENDING:
          return "pending";
        case VACATION_STATUS.IN_PROGRESS:
          return "inProgress";
        case VACATION_STATUS.COMPLETED:
          return "completed";
        case VACATION_STATUS.REJECTED:
        case VACATION_STATUS.CANCELLED:
          return "destructive";
        default:
          return "outline";
      }
    };

    const calculateDays = (startAt: Date, endAt: Date): number => {
      return getDifferenceInDays(new Date(endAt), new Date(startAt)) + 1;
    };

    const getVacationTimeStatus = (vacation: Vacation) => {
      const now = new Date();
      const start = new Date(vacation.startAt);
      const end = new Date(vacation.endAt);

      if (now >= start && now <= end) {
        return { label: "Em andamento agora", color: colors.primary };
      }
      if (start > now) {
        const daysUntil = getDifferenceInDays(start, now);
        if (daysUntil <= 7) {
          return { label: `Começa em ${daysUntil} dia${daysUntil !== 1 ? "s" : ""}`, color: "#f59e0b" };
        }
        return { label: "Futuras", color: colors.mutedForeground };
      }
      return { label: "Concluídas", color: colors.mutedForeground };
    };

    const renderItem = useCallback(
      ({ item: vacation }: { item: Vacation }) => {
        const days = calculateDays(vacation.startAt, vacation.endAt);
        const statusVariant = getStatusVariant(vacation.status);
        const timeStatus = getVacationTimeStatus(vacation);

        return (
          <TouchableOpacity
            style={StyleSheet.flatten([styles.row, { backgroundColor: colors.card, borderColor: colors.border }])}
            onPress={() => onVacationPress(vacation.id)}
            activeOpacity={0.7}
          >
            <View style={styles.rowContent}>
              {/* Header Row - Type and Status */}
              <View style={styles.headerRow}>
                <View style={styles.typeContainer}>
                  <IconCalendarEvent size={16} color={colors.primary} />
                  <ThemedText style={styles.typeText}>{VACATION_TYPE_LABELS[vacation.type]}</ThemedText>
                  {vacation.isCollective && (
                    <Badge variant="info" style={styles.collectiveBadge}>
                      <ThemedText style={styles.badgeText}>Coletivas</ThemedText>
                    </Badge>
                  )}
                </View>
                <Badge variant={statusVariant} style={styles.statusBadge}>
                  <ThemedText style={styles.badgeText}>{VACATION_STATUS_LABELS[vacation.status]}</ThemedText>
                </Badge>
              </View>

              {/* Date Range */}
              <View style={styles.dateContainer}>
                <View style={styles.dateRow}>
                  <ThemedText style={styles.dateLabel}>Início:</ThemedText>
                  <ThemedText style={styles.dateValue}>{formatDate(vacation.startAt)}</ThemedText>
                </View>
                <View style={styles.dateSeparator} />
                <View style={styles.dateRow}>
                  <ThemedText style={styles.dateLabel}>Término:</ThemedText>
                  <ThemedText style={styles.dateValue}>{formatDate(vacation.endAt)}</ThemedText>
                </View>
              </View>

              {/* Footer Row - Days and Time Status */}
              <View style={styles.footerRow}>
                <View style={StyleSheet.flatten([styles.daysContainer, { backgroundColor: colors.primary + "20" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.daysCount, { color: colors.primary }])}>{days}</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.daysLabel, { color: colors.primary }])}>
                    dia{days !== 1 ? "s" : ""}
                  </ThemedText>
                </View>
                <View style={styles.timeStatusContainer}>
                  <IconClock size={14} color={timeStatus.color} />
                  <ThemedText style={StyleSheet.flatten([styles.timeStatusText, { color: timeStatus.color }])}>
                    {timeStatus.label}
                  </ThemedText>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      },
      [colors, onVacationPress],
    );

    const renderEmpty = useCallback(() => {
      if (isLoading) return <VacationListSkeleton />;

      return (
        <View style={styles.emptyContainer}>
          <IconCalendarEvent size={48} color={colors.mutedForeground} />
          <ThemedText style={styles.emptyTitle}>Nenhuma férias encontrada</ThemedText>
          <ThemedText style={styles.emptyText}>Você ainda não possui férias registradas</ThemedText>
        </View>
      );
    }, [isLoading, colors]);

    const renderFooter = useCallback(() => {
      if (!loadingMore) return null;

      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={styles.footerText}>Carregando mais...</ThemedText>
        </View>
      );
    }, [loadingMore, colors]);

    if (error && !vacations.length) {
      return <ErrorScreen message="Erro ao carregar férias" detail={error.message} />;
    }

    return (
      <FlatList
        data={vacations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={StyleSheet.flatten([styles.separator, { backgroundColor: colors.border }])} />}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        onEndReached={canLoadMore ? onEndReach : undefined}
        onEndReachedThreshold={0.2}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={15}
        updateCellsBatchingPeriod={50}
        showsVerticalScrollIndicator={false}
      />
    );
  },
);

MyVacationList.displayName = "MyVacationList";

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  rowContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  typeText: {
    fontSize: 15,
    fontWeight: "600",
  },
  collectiveBadge: {
    marginLeft: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dateRow: {
    flex: 1,
    gap: 4,
  },
  dateLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateSeparator: {
    width: 2,
    height: 32,
    backgroundColor: "#e0e0e0",
    borderRadius: 1,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.xs,
  },
  daysContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  daysCount: {
    fontSize: 16,
    fontWeight: "700",
  },
  daysLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  timeStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  separator: {
    height: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  footerText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
