import { useCallback } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { IconChevronRight, IconScissors, IconEdit, IconTrash } from "@tabler/icons-react-native";
import type { Cut } from "../../../../types";
import { useTheme } from "@/lib/theme";
import { TableCard, TableCardRow, TableCardCell, TableCardHeader } from "@/components/ui/table-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityIndicator } from "@/components/ui/activity-indicator";
import { ReanimatedSwipeableRow, type SwipeAction } from "@/components/ui/reanimated-swipeable-row";
import { CUT_STATUS_LABELS, CUT_TYPE_LABELS, CUT_ORIGIN_LABELS } from "../../../../constants";
import { getBadgeVariant } from "../../../../constants/badge-colors";
import type { SortConfig } from "@/lib/sort-utils";

export interface ColumnDefinition {
  key: string;
  label: string;
  sortable?: boolean;
  width?: number;
}

export function createColumnDefinitions(): ColumnDefinition[] {
  return [
    { key: "status", label: "Status", sortable: true },
    { key: "type", label: "Tipo", sortable: true },
    { key: "task", label: "Tarefa", sortable: false },
    { key: "origin", label: "Origem", sortable: true },
    { key: "startedAt", label: "Início", sortable: true },
    { key: "completedAt", label: "Conclusão", sortable: true },
    { key: "createdAt", label: "Criado em", sortable: true },
  ];
}

interface CuttingPlanTableProps {
  cuts: Cut[];
  onCutPress: (cutId: string) => void;
  onCutEdit?: (cutId: string) => void;
  onCutDelete?: (cutId: string) => void;
  onRefresh?: () => void;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedCuts?: Set<string>;
  onSelectionChange?: (selection: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

export function CuttingPlanTable({
  cuts,
  onCutPress,
  onCutEdit,
  onCutDelete,
  onRefresh,
  onEndReached,
  refreshing = false,
  loading = false,
  loadingMore = false,
  showSelection = false,
  selectedCuts = new Set(),
  onSelectionChange,
  sortConfigs: _sortConfigs = [],
  // onSort removed
  visibleColumnKeys = ["status", "type", "task"],
  enableSwipeActions = true,
}: CuttingPlanTableProps) {
  const { colors } = useTheme();

  const handleCutPress = useCallback(
    (cutId: string) => {
      if (showSelection && onSelectionChange) {
        const newSelection = new Set(selectedCuts);
        if (newSelection.has(cutId)) {
          newSelection.delete(cutId);
        } else {
          newSelection.add(cutId);
        }
        onSelectionChange(newSelection);
      } else {
        onCutPress(cutId);
      }
    },
    [showSelection, selectedCuts, onSelectionChange, onCutPress],
  );

  const renderCutCard = useCallback(
    ({ item: cut }: { item: Cut }) => {
      const isSelected = selectedCuts.has(cut.id);

      const rightActions: SwipeAction[] = enableSwipeActions
        ? [
            ...(onCutEdit
              ? [
                  {
                    key: "edit",
                    label: "Editar",
                    icon: <IconEdit size={20} color="white" />,
                    onPress: () => onCutEdit(cut.id),
                    backgroundColor: colors.primary,
                    closeOnPress: true,
                  },
                ]
              : []),
            ...(onCutDelete
              ? [
                  {
                    key: "delete",
                    label: "Excluir",
                    icon: <IconTrash size={20} color="white" />,
                    onPress: () => onCutDelete(cut.id),
                    backgroundColor: colors.destructive,
                    closeOnPress: true,
                  },
                ]
              : []),
          ]
        : [];

      const cardContent = (
        <TableCard
          onPress={() => handleCutPress(cut.id)}
          selected={isSelected}
          style={isSelected ? { backgroundColor: colors.accent } : undefined}
        >
          <TableCardHeader>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <IconScissors size={20} color={colors.mutedForeground} />
                <Text style={[styles.taskText, { color: colors.foreground }]}>
                  {cut.task?.name || `Corte #${cut.id.slice(0, 8)}`}
                </Text>
              </View>
              <IconChevronRight size={20} color={colors.mutedForeground} />
            </View>
          </TableCardHeader>

          {visibleColumnKeys.includes("status") && (
            <TableCardRow>
              <TableCardCell label="Status">
                <Badge variant={getBadgeVariant(cut.status, "CUT")}>
                  {CUT_STATUS_LABELS[cut.status]}
                </Badge>
              </TableCardCell>
            </TableCardRow>
          )}

          {visibleColumnKeys.includes("type") && (
            <TableCardRow>
              <TableCardCell label="Tipo">
                <Text style={{ color: colors.foreground }}>{CUT_TYPE_LABELS[cut.type]}</Text>
              </TableCardCell>
            </TableCardRow>
          )}

          {visibleColumnKeys.includes("task") && cut.task && (
            <TableCardRow>
              <TableCardCell label="Cliente">
                <Text style={{ color: colors.foreground }}>
                  {cut.task.customer?.fantasyName || "Sem cliente"}
                </Text>
              </TableCardCell>
            </TableCardRow>
          )}

          {visibleColumnKeys.includes("origin") && (
            <TableCardRow>
              <TableCardCell label="Origem">
                <Text style={{ color: colors.foreground }}>{CUT_ORIGIN_LABELS[cut.origin]}</Text>
              </TableCardCell>
            </TableCardRow>
          )}

          {visibleColumnKeys.includes("startedAt") && cut.startedAt && (
            <TableCardRow>
              <TableCardCell label="Início">
                <Text style={{ color: colors.mutedForeground }}>
                  {format(new Date(cut.startedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </Text>
              </TableCardCell>
            </TableCardRow>
          )}

          {visibleColumnKeys.includes("completedAt") && cut.completedAt && (
            <TableCardRow>
              <TableCardCell label="Conclusão">
                <Text style={{ color: colors.mutedForeground }}>
                  {format(new Date(cut.completedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </Text>
              </TableCardCell>
            </TableCardRow>
          )}

          {visibleColumnKeys.includes("createdAt") && (
            <TableCardRow>
              <TableCardCell label="Criado em">
                <Text style={{ color: colors.mutedForeground }}>
                  {format(new Date(cut.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </Text>
              </TableCardCell>
            </TableCardRow>
          )}
        </TableCard>
      );

      if (enableSwipeActions && rightActions.length > 0) {
        return <ReanimatedSwipeableRow rightActions={rightActions}>{cardContent}</ReanimatedSwipeableRow>;
      }

      return cardContent;
    },
    [
      selectedCuts,
      enableSwipeActions,
      onCutEdit,
      onCutDelete,
      colors,
      handleCutPress,
      visibleColumnKeys,
    ],
  );

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [loadingMore, colors.primary]);

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon="scissors"
          title="Nenhum corte encontrado"
          description="Não há cortes para exibir no momento"
        />
      </View>
    );
  }, [loading]);

  if (loading && cuts.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={cuts}
      renderItem={renderCutCard}
      keyExtractor={(item) => item.id}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={[
        styles.listContent,
        cuts.length === 0 && styles.emptyList,
      ]}
      style={{ backgroundColor: colors.background }}
    />
  );
}

const styles = StyleSheet.create({
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  listContent: {
    padding: 8,
    gap: 8,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
// Re-export SortConfig for consumer components
export type { SortConfig } from "@/lib/sort-utils";
