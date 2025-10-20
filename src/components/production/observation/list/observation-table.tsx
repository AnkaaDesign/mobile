import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { IconPaperclip, IconChevronRight } from "@tabler/icons-react-native";
import { formatDate, formatRelativeTime } from "@/utils";
import { useTheme } from "@/lib/theme";
import type { Observation } from "@/types";
import { BaseTable } from "@/components/ui/base-table";
import type { BaseTableColumn } from "@/components/ui/base-table";

export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}

export interface ObservationColumn extends BaseTableColumn<Observation> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: number;
}

export function createColumnDefinitions(): ObservationColumn[] {
  return [
    {
      key: "task.name",
      header: "Tarefa",
      sortable: true,
      width: 200,
      renderCell: (observation) => ({
        primary: observation.task?.name || "-",
        secondary: undefined,
      }),
    },
    {
      key: "description",
      header: "Descrição",
      sortable: true,
      width: 300,
      renderCell: (observation) => ({
        primary: observation.description,
        secondary: undefined,
      }),
    },
    {
      key: "filesCount",
      header: "Arquivos",
      sortable: false,
      width: 120,
      renderCell: (observation) => ({
        primary: observation.files && observation.files.length > 0
          ? `${observation.files.length} arquivo${observation.files.length > 1 ? 's' : ''}`
          : "-",
        secondary: undefined,
      }),
    },
    {
      key: "createdAt",
      header: "Criado em",
      sortable: true,
      width: 160,
      renderCell: (observation) => ({
        primary: formatDate(observation.createdAt),
        secondary: formatRelativeTime(observation.createdAt),
      }),
    },
    {
      key: "updatedAt",
      header: "Atualizado em",
      sortable: true,
      width: 160,
      renderCell: (observation) => ({
        primary: formatDate(observation.updatedAt),
        secondary: formatRelativeTime(observation.updatedAt),
      }),
    },
  ];
}

export interface ObservationTableProps {
  observations: Observation[];
  onObservationPress?: (observationId: string) => void;
  onObservationEdit?: (observationId: string) => void;
  onObservationDelete?: (observationId: string) => void;
  onRefresh?: () => void;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedObservations?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

export function ObservationTable({
  observations,
  onObservationPress,
  onObservationEdit,
  onObservationDelete,
  onRefresh,
  onEndReached,
  refreshing = false,
  loading = false,
  loadingMore = false,
  showSelection = false,
  selectedObservations = new Set(),
  onSelectionChange,
  sortConfigs = [],
  onSort,
  visibleColumnKeys,
  enableSwipeActions = true,
}: ObservationTableProps) {
  const { colors } = useTheme();

  const allColumns = createColumnDefinitions();
  const visibleColumns = visibleColumnKeys
    ? allColumns.filter((col) => visibleColumnKeys.includes(col.key))
    : allColumns;

  const handlePress = (observation: Observation) => {
    if (onObservationPress) {
      onObservationPress(observation.id);
    }
  };

  const handleEdit = (observation: Observation) => {
    if (onObservationEdit) {
      onObservationEdit(observation.id);
    }
  };

  const handleDelete = (observation: Observation) => {
    if (onObservationDelete) {
      onObservationDelete(observation.id);
    }
  };

  const handleSort = (columnKey: string) => {
    if (!onSort) return;

    const existingSort = sortConfigs.find((s) => s.columnKey === columnKey);
    if (existingSort) {
      const newDirection = existingSort.direction === "asc" ? "desc" : "asc";
      onSort([{ columnKey, direction: newDirection }]);
    } else {
      onSort([{ columnKey, direction: "asc" }]);
    }
  };

  return (
    <BaseTable
      data={observations}
      columns={visibleColumns}
      keyExtractor={(item) => item.id}
      onRowPress={handlePress}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      refreshing={refreshing}
      loading={loading}
      loadingMore={loadingMore}
      showSelection={showSelection}
      selectedItems={selectedObservations}
      onSelectionChange={onSelectionChange}
      sortConfigs={sortConfigs}
      onSort={handleSort}
      swipeActions={enableSwipeActions ? [
        {
          key: "edit",
          label: "Editar",
          backgroundColor: colors.primary,
          onPress: handleEdit,
        },
        {
          key: "delete",
          label: "Excluir",
          backgroundColor: colors.destructive,
          onPress: handleDelete,
        },
      ] : undefined}
    />
  );
}
