import { memo, useCallback } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconCalendarEvent, IconUser, IconAlertTriangle } from "@tabler/icons-react-native";
import { spacing } from "@/constants/design-system";
import { VACATION_STATUS, VACATION_STATUS_LABELS, VACATION_TYPE_LABELS } from '../../../constants';
import { formatDate, getDifferenceInDays, isDateInRange } from '../../../utils';
import type { Vacation } from '../../../types';

interface TeamVacationTableProps {
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

export const TeamVacationTable = memo(
  ({ vacations, isLoading, error, onVacationPress, onRefresh, refreshing, onEndReach, canLoadMore, loadingMore }: TeamVacationTableProps) => {
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

    const isCurrentlyOnVacation = (startAt: Date, endAt: Date): boolean => {
      const now = new Date();
      return isDateInRange(now, new Date(startAt), new Date(endAt));
    };

    const detectOverlap = (vacation: Vacation, allVacations: Vacation[]): boolean => {
      return allVacations.some((other) => {
        if (other.id === vacation.id) return false;
        if (other.status === VACATION_STATUS.CANCELLED || other.status === VACATION_STATUS.REJECTED) return false;
        if (vacation.status === VACATION_STATUS.CANCELLED || vacation.status === VACATION_STATUS.REJECTED) return false;

        const vacStart = new Date(vacation.startAt);
        const vacEnd = new Date(vacation.endAt);
        const otherStart = new Date(other.startAt);
        const otherEnd = new Date(other.endAt);

        return (
          (vacStart >= otherStart && vacStart <= otherEnd) ||
          (vacEnd >= otherStart && vacEnd <= otherEnd) ||
          (otherStart >= vacStart && otherStart <= vacEnd) ||
          (otherEnd >= vacStart && otherEnd <= vacEnd)
        );
      });
    };

    const renderItem = useCallback(
      ({ item: vacation }: { item: Vacation }) => {
        const days = calculateDays(vacation.startAt, vacation.endAt);
        const statusVariant = getStatusVariant(vacation.status);
        const isOnVacation = isCurrentlyOnVacation(vacation.startAt, vacation.endAt);
        const hasOverlap = detectOverlap(vacation, vacations);

        return (
          <TouchableOpacity
            style={StyleSheet.flatten([
              styles.row,
              { backgroundColor: colors.card, borderColor: colors.border },
              hasOverlap && styles.overlapRow,
              isOnVacation && styles.activeRow,
            ])}
            onPress={() => onVacationPress(vacation.id)}
            activeOpacity={0.7}
          >
            <View style={styles.rowContent}>
              {/* Header Section - User Info */}
              <View style={styles.headerSection}>
                <View style={styles.leftSection}>
                  <View style={StyleSheet.flatten([styles.iconContainer, { backgroundColor: isOnVacation ? colors.success + "20" : colors.primary + "20" }])}>
                    <IconUser size={20} color={isOnVacation ? colors.success : colors.primary} />
                  </View>
                  <View style={styles.userInfo}>
                    <ThemedText style={styles.userName} numberOfLines={1}>
                      {vacation.user?.name || "Colaborador não encontrado"}
                    </ThemedText>
                    <ThemedText style={styles.vacationType} numberOfLines={1}>
                      {VACATION_TYPE_LABELS[vacation.type] || vacation.type}
                    </ThemedText>
                  </View>
                </View>

                {/* Overlap indicator */}
                {hasOverlap && (
                  <View style={StyleSheet.flatten([styles.overlapBadge, { backgroundColor: colors.destructive + "20" }])}>
                    <IconAlertTriangle size={14} color={colors.destructive} />
                    <ThemedText style={StyleSheet.flatten([styles.overlapText, { color: colors.destructive }])}>Conflito</ThemedText>
                  </View>
                )}
              </View>

              {/* Date Section */}
              <View style={styles.dateSection}>
                <View style={styles.dateRow}>
                  <IconCalendarEvent size={14} color={colors.mutedForeground} />
                  <ThemedText style={styles.dateText} numberOfLines={1}>
                    {formatDate(vacation.startAt)}
                  </ThemedText>
                </View>
                <ThemedText style={styles.datesSeparator}>até</ThemedText>
                <View style={styles.dateRow}>
                  <IconCalendarEvent size={14} color={colors.mutedForeground} />
                  <ThemedText style={styles.dateText} numberOfLines={1}>
                    {formatDate(vacation.endAt)}
                  </ThemedText>
                </View>
              </View>

              {/* Bottom Section - Days and Status */}
              <View style={styles.bottomSection}>
                <View style={StyleSheet.flatten([styles.daysContainer, { backgroundColor: colors.muted }])}>
                  <ThemedText style={styles.daysCount}>{days}</ThemedText>
                  <ThemedText style={styles.daysLabel}>dia{days !== 1 ? "s" : ""}</ThemedText>
                </View>
                <Badge variant={statusVariant} style={styles.statusBadge}>
                  <ThemedText style={styles.statusText} numberOfLines={1}>
                    {VACATION_STATUS_LABELS[vacation.status]}
                  </ThemedText>
                </Badge>
              </View>
            </View>
          </TouchableOpacity>
        );
      },
      [colors, onVacationPress, vacations],
    );

    const renderEmpty = useCallback(() => {
      if (isLoading) {
        return (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.emptyText}>Carregando férias da equipe...</ThemedText>
          </View>
        );
      }

      return (
        <View style={styles.emptyContainer}>
          <IconCalendarEvent size={48} color={colors.mutedForeground} />
          <ThemedText style={styles.emptyTitle}>Nenhuma férias encontrada</ThemedText>
          <ThemedText style={styles.emptyText}>Não há férias registradas para sua equipe no momento</ThemedText>
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
      return (
        <View style={styles.errorContainer}>
          <IconAlertTriangle size={48} color={colors.destructive} />
          <ThemedText style={styles.errorTitle}>Erro ao carregar férias</ThemedText>
          <ThemedText style={styles.errorText}>{error.message || "Tente novamente mais tarde"}</ThemedText>
        </View>
      );
    }

    return (
      <FlatList
        data={vacations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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

TeamVacationTable.displayName = "TeamVacationTable";

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  row: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  overlapRow: {
    borderWidth: 2,
    borderColor: "#ef4444",
  },
  activeRow: {
    backgroundColor: "#10b98120",
  },
  rowContent: {
    flexDirection: "column",
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
  },
  vacationType: {
    fontSize: 12,
    opacity: 0.7,
  },
  overlapBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  overlapText: {
    fontSize: 11,
    fontWeight: "700",
  },
  dateSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingLeft: 48,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 13,
    opacity: 0.8,
  },
  datesSeparator: {
    fontSize: 12,
    opacity: 0.6,
  },
  bottomSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 48,
    gap: spacing.sm,
  },
  daysContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  daysCount: {
    fontSize: 14,
    fontWeight: "700",
  },
  daysLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  statusBadge: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
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
    minHeight: 300,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.sm,
    minHeight: 300,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  errorText: {
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
