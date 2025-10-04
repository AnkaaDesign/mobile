import React, { useCallback } from "react";
import { FlatList, View, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import type { Sector } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SectorTableRowSwipe } from "./sector-table-row-swipe";
import { SECTOR_PRIVILEGES_LABELS } from '../../../../constants';
import { EmptyState } from "@/components/ui/empty-state";

interface SectorTableProps {
  sectors: Sector[];
  onSectorPress?: (sectorId: string) => void;
  onSectorEdit?: (sectorId: string) => void;
  onSectorDelete?: (sectorId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  enableSwipeActions?: boolean;
}

export function SectorTable({
  sectors,
  onSectorPress,
  onSectorEdit,
  onSectorDelete,
  onRefresh,
  onEndReached,
  refreshing = false,
  loading = false,
  loadingMore = false,
  enableSwipeActions = true,
}: SectorTableProps) {
  const { colors } = useTheme();

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh();
    }
  }, [onRefresh]);

  const renderSectorRow = useCallback(
    ({ item: sector }: { item: Sector }) => {
      const userCount = sector._count?.users || 0;
      const taskCount = sector._count?.tasks || 0;

      const content = (
        <TouchableOpacity
          onPress={() => onSectorPress?.(sector.id)}
          activeOpacity={0.7}
          style={[styles.rowContainer, { backgroundColor: colors.card }]}
        >
          <Card style={styles.card}>
            {/* Header: Sector name and privilege badge */}
            <View style={styles.header}>
              <View style={styles.nameContainer}>
                <ThemedText style={styles.sectorName} numberOfLines={2}>
                  {sector.name}
                </ThemedText>
              </View>
              <Badge variant="outline" style={styles.privilegeBadge}>
                <ThemedText style={styles.privilegeText}>
                  {SECTOR_PRIVILEGES_LABELS[sector.privileges]}
                </ThemedText>
              </Badge>
            </View>

            {/* Details: User and task counts */}
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Funcionários:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {userCount} {userCount === 1 ? "funcionário" : "funcionários"}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Tarefas:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {taskCount} {taskCount === 1 ? "tarefa" : "tarefas"}
                </ThemedText>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      );

      if (enableSwipeActions) {
        return (
          <SectorTableRowSwipe
            sectorId={sector.id}
            sectorName={sector.name}
            onEdit={onSectorEdit}
            onDelete={onSectorDelete}
          >
            {content}
          </SectorTableRowSwipe>
        );
      }

      return content;
    },
    [colors.card, onSectorPress, onSectorEdit, onSectorDelete, enableSwipeActions],
  );

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <ThemedText style={styles.footerText}>Carregando mais setores...</ThemedText>
      </View>
    );
  }, [loadingMore, colors.primary]);

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon="building"
          title="Nenhum setor encontrado"
          description="Não há setores cadastrados ou que correspondam aos filtros aplicados"
        />
      </View>
    );
  }, [loading]);

  return (
    <FlatList
      data={sectors}
      keyExtractor={(item) => item.id}
      renderItem={renderSectorRow}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={[
        styles.listContent,
        sectors.length === 0 && styles.emptyListContent,
      ]}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={15}
      windowSize={10}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  rowContainer: {
    marginBottom: spacing.sm,
    borderRadius: 8,
    overflow: "hidden",
  },
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  nameContainer: {
    flex: 1,
  },
  sectorName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  privilegeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  privilegeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  details: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  footerText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xl * 2,
  },
});
