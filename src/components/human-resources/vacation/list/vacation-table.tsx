import { memo, useCallback } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconCalendarEvent, IconUser } from "@tabler/icons-react-native";
import { VacationListSkeleton } from "../skeleton/vacation-list-skeleton";
import { ErrorScreen } from "@/components/ui/error-screen";
import { spacing } from "@/constants/design-system";
import { VACATION_STATUS, VACATION_STATUS_LABELS, VACATION_TYPE_LABELS } from "@/constants";
import { formatDate, getDifferenceInDays } from "@/utils";

import type { Vacation } from '../../../../types';

interface VacationTableProps {
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

export const VacationTable = memo(
  ({ vacations, isLoading, error, onVacationPress, onRefresh, refreshing, onEndReach, canLoadMore, loadingMore }: VacationTableProps) => {
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

    const renderItem = useCallback(
      ({ item: vacation }: { item: Vacation }) => {
        const days = calculateDays(vacation.startAt, vacation.endAt);
        const statusVariant = getStatusVariant(vacation.status);

        return (
          <TouchableOpacity
            style={StyleSheet.flatten([styles.row, { backgroundColor: colors.card, borderColor: colors.border }])}
            onPress={() => onVacationPress(vacation.id)}
            activeOpacity={0.7}
          >
            <View style={styles.rowContent}>
              {/* Left Section - User Info */}
              <View style={styles.leftSection}>
                <View style={StyleSheet.flatten([styles.iconContainer, { backgroundColor: colors.primary + "20" }])}>
                  <IconUser size={20} color={colors.primary} />
                </View>
                <View style={styles.userInfo}>
                  <ThemedText style={styles.userName} numberOfLines={1}>
                    {vacation.user?.name || "Usuário não encontrado"}
                  </ThemedText>
                  <ThemedText style={styles.vacationType} numberOfLines={1}>
                    {VACATION_TYPE_LABELS[vacation.type] || vacation.type}
                  </ThemedText>
                </View>
              </View>

              {/* Middle Section - Date Range */}
              <View style={styles.middleSection}>
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

              {/* Right Section - Days and Status */}
              <View style={styles.rightSection}>
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
      [colors, onVacationPress],
    );

    const renderEmpty = useCallback(() => {
      if (isLoading) return <VacationListSkeleton />;

      return (
        <View style={styles.emptyContainer}>
          <IconCalendarEvent size={48} color={colors.mutedForeground} />
          <ThemedText style={styles.emptyTitle}>Nenhuma férias encontrada</ThemedText>
          <ThemedText style={styles.emptyText}>Ajuste os filtros ou faça uma nova busca</ThemedText>
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

VacationTable.displayName = "VacationTable";

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  row: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  rowContent: {
    flexDirection: "column",
    padding: spacing.md,
    gap: spacing.sm,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  middleSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingLeft: 44, // Align with user info
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
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 44, // Align with user info
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
