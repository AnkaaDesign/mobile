import React, { memo, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { IconHistory, IconEye } from "@tabler/icons-react-native";
import { ReanimatedSwipeableRow } from "@/components/ui/reanimated-swipeable-row";
import { ChangeLogListSkeleton } from "../skeleton/change-log-list-skeleton";
import { ErrorScreen } from "@/components/ui/error-screen";
import { spacing } from "@/constants/design-system";
import {
  CHANGE_LOG_ACTION_LABELS,
  CHANGE_LOG_ENTITY_TYPE_LABELS,
  CHANGE_LOG_ACTION
} from '../../../../constants';
import { formatDateTime } from '../../../../utils';
import type { ChangeLog } from '../../../../types';

interface ChangeLogTableProps {
  changeLogs: ChangeLog[];
  isLoading: boolean;
  error: any;
  onChangeLogPress: (changeLogId: string) => void;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  onEndReach: () => void;
  canLoadMore: boolean;
  loadingMore: boolean;
}

const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (action) {
    case CHANGE_LOG_ACTION.CREATE:
    case CHANGE_LOG_ACTION.BATCH_CREATE:
      return "default";
    case CHANGE_LOG_ACTION.UPDATE:
    case CHANGE_LOG_ACTION.BATCH_UPDATE:
      return "secondary";
    case CHANGE_LOG_ACTION.DELETE:
    case CHANGE_LOG_ACTION.BATCH_DELETE:
      return "destructive";
    default:
      return "outline";
  }
};

const getActionColor = (action: string): string => {
  switch (action) {
    case CHANGE_LOG_ACTION.CREATE:
    case CHANGE_LOG_ACTION.BATCH_CREATE:
      return "#10b981"; // green
    case CHANGE_LOG_ACTION.UPDATE:
    case CHANGE_LOG_ACTION.BATCH_UPDATE:
      return "#3b82f6"; // blue
    case CHANGE_LOG_ACTION.DELETE:
    case CHANGE_LOG_ACTION.BATCH_DELETE:
      return "#ef4444"; // red
    case CHANGE_LOG_ACTION.APPROVE:
      return "#8b5cf6"; // purple
    case CHANGE_LOG_ACTION.REJECT:
    case CHANGE_LOG_ACTION.CANCEL:
      return "#f59e0b"; // orange
    default:
      return "#6b7280"; // gray
  }
};

export const ChangeLogTable = memo(({
  changeLogs,
  isLoading,
  error,
  onChangeLogPress,
  onRefresh,
  refreshing,
  onEndReach,
  canLoadMore,
  loadingMore,
}: ChangeLogTableProps) => {
  const { colors, isDark } = useTheme();

  const renderItem = useCallback(({ item: changeLog }: { item: ChangeLog }) => (
    <ReanimatedSwipeableRow
      key={changeLog.id}
      rightActions={[
        {
          label: "Ver Detalhes",
          icon: IconEye,
          backgroundColor: colors.primary,
          onPress: () => onChangeLogPress(changeLog.id),
        },
      ]}
    >
      <TouchableOpacity
        style={StyleSheet.flatten([
          styles.row,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ])}
        onPress={() => onChangeLogPress(changeLog.id)}
        activeOpacity={0.7}
      >
        <View style={styles.rowContent}>
          {/* Left Section - Action Badge */}
          <View style={styles.leftSection}>
            <View
              style={StyleSheet.flatten([
                styles.actionIndicator,
                { backgroundColor: getActionColor(changeLog.action) }
              ])}
            />
            <View style={styles.mainInfo}>
              <View style={styles.headerRow}>
                <Badge
                  variant={getActionBadgeVariant(changeLog.action)}
                  style={styles.actionBadge}
                >
                  <ThemedText style={styles.actionText} numberOfLines={1}>
                    {CHANGE_LOG_ACTION_LABELS[changeLog.action] || changeLog.action}
                  </ThemedText>
                </Badge>
                <Badge variant="outline" style={styles.entityBadge}>
                  <ThemedText style={styles.entityText} numberOfLines={1}>
                    {CHANGE_LOG_ENTITY_TYPE_LABELS[changeLog.entityType] || changeLog.entityType}
                  </ThemedText>
                </Badge>
              </View>

              {changeLog.field && (
                <ThemedText style={styles.fieldText} numberOfLines={1}>
                  Campo: {changeLog.field}
                </ThemedText>
              )}

              {changeLog.reason && (
                <ThemedText style={styles.reasonText} numberOfLines={2}>
                  {changeLog.reason}
                </ThemedText>
              )}
            </View>
          </View>

          {/* Right Section - User and Date */}
          <View style={styles.rightSection}>
            {changeLog.user ? (
              <View style={styles.userInfo}>
                <Avatar
                  size="sm"
                  name={changeLog.user.name}
                  imageUrl={changeLog.user.imageUrl}
                  style={styles.avatar}
                />
                <View style={styles.userDetails}>
                  <ThemedText style={styles.userName} numberOfLines={1}>
                    {changeLog.user.name}
                  </ThemedText>
                  <ThemedText style={styles.date} numberOfLines={1}>
                    {formatDateTime(changeLog.createdAt)}
                  </ThemedText>
                </View>
              </View>
            ) : (
              <View style={styles.userDetails}>
                <ThemedText style={styles.systemText}>Sistema</ThemedText>
                <ThemedText style={styles.date} numberOfLines={1}>
                  {formatDateTime(changeLog.createdAt)}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </ReanimatedSwipeableRow>
  ), [colors, onChangeLogPress]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return <ChangeLogListSkeleton />;

    return (
      <View style={styles.emptyContainer}>
        <IconHistory size={48} color={colors.mutedForeground} />
        <ThemedText style={styles.emptyTitle}>Nenhum registro encontrado</ThemedText>
        <ThemedText style={styles.emptyText}>
          Ajuste os filtros ou faça uma nova busca
        </ThemedText>
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

  if (error && !changeLogs.length) {
    return <ErrorScreen message="Erro ao carregar registros" detail={error.message} />;
  }

  return (
    <FlatList
      data={changeLogs}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={canLoadMore ? onEndReach : undefined}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      contentContainerStyle={changeLogs.length === 0 ? styles.emptyList : undefined}
      showsVerticalScrollIndicator={true}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={15}
      windowSize={10}
    />
  );
});

ChangeLogTable.displayName = "ChangeLogTable";

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  actionIndicator: {
    width: 4,
    height: "100%",
    minHeight: 60,
    borderRadius: 2,
  },
  mainInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  actionBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "600",
  },
  entityBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  entityText: {
    fontSize: 11,
    fontWeight: "500",
  },
  fieldText: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: "italic",
  },
  reasonText: {
    fontSize: 13,
    opacity: 0.8,
    lineHeight: 18,
  },
  rightSection: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
    minWidth: 100,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  avatar: {
    marginBottom: spacing.xs,
  },
  userDetails: {
    alignItems: "flex-end",
    gap: 2,
  },
  userName: {
    fontSize: 12,
    fontWeight: "500",
  },
  systemText: {
    fontSize: 12,
    fontWeight: "500",
    fontStyle: "italic",
    opacity: 0.7,
  },
  date: {
    fontSize: 11,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xl * 2,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyList: {
    flexGrow: 1,
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  footerText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
