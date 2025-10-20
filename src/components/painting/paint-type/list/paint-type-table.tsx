import React, { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { IconCheck, IconX } from "@tabler/icons-react-native";
import type { PaintType } from "../../../../types";
import { useTheme } from "@/lib/theme";
import { DataTable, DataColumn } from "@/components/ui/data-table";
import { formatDate } from "../../../../utils";

export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}

interface PaintTypeTableProps {
  paintTypes: PaintType[];
  onPaintTypePress: (paintTypeId: string) => void;
  onPaintTypeEdit: (paintTypeId: string) => void;
  onPaintTypeDelete: (paintTypeId: string) => void;
  onRefresh?: () => void;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedPaintTypes?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

export function createColumnDefinitions(): DataColumn<PaintType>[] {
  return [
    {
      key: "name",
      header: "NOME",
      sortable: true,
      width: 180,
      render: (paintType) => paintType.name,
    },
    {
      key: "needGround",
      header: "PRECISA FUNDO",
      sortable: true,
      width: 120,
      align: "center",
      render: (paintType) => ({
        type: "badge" as const,
        text: paintType.needGround ? "Sim" : "Não",
        variant: paintType.needGround ? "default" : "secondary",
        icon: paintType.needGround ? IconCheck : IconX,
      }),
    },
    {
      key: "_count.paints",
      header: "TINTAS",
      sortable: false,
      width: 90,
      align: "center",
      render: (paintType) => ({
        type: "number" as const,
        value: paintType._count?.paints || 0,
      }),
    },
    {
      key: "createdAt",
      header: "CRIADO EM",
      sortable: true,
      width: 110,
      render: (paintType) => formatDate(paintType.createdAt),
    },
  ];
}

export function PaintTypeTable({
  paintTypes,
  onPaintTypePress,
  onPaintTypeEdit,
  onPaintTypeDelete,
  onRefresh,
  onEndReached,
  refreshing = false,
  loading = false,
  loadingMore = false,
  showSelection = false,
  selectedPaintTypes = new Set(),
  onSelectionChange,
  sortConfigs = [],
  onSort,
  visibleColumnKeys,
  enableSwipeActions = true,
}: PaintTypeTableProps) {
  const { colors } = useTheme();

  const columns = useMemo(() => createColumnDefinitions(), []);

  const handleDelete = useCallback(
    (paintType: PaintType) => {
      Alert.alert(
        "Confirmar exclusão",
        `Tem certeza que deseja deletar o tipo "${paintType.name}"?`,
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Deletar",
            style: "destructive",
            onPress: () => onPaintTypeDelete(paintType.id),
          },
        ]
      );
    },
    [onPaintTypeDelete]
  );

  const swipeActions = useMemo(
    () => [
      {
        label: "Editar",
        onPress: (item: PaintType) => onPaintTypeEdit(item.id),
        backgroundColor: colors.primary,
      },
      {
        label: "Deletar",
        onPress: handleDelete,
        backgroundColor: colors.destructive,
      },
    ],
    [onPaintTypeEdit, handleDelete, colors]
  );

  return (
    <DataTable
      data={paintTypes}
      columns={columns}
      visibleColumns={visibleColumnKeys}
      onRowPress={(item) => onPaintTypePress(item.id)}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      refreshing={refreshing}
      loading={loading}
      loadingMore={loadingMore}
      showSelection={showSelection}
      selectedItems={selectedPaintTypes}
      onSelectionChange={onSelectionChange}
      sortConfigs={sortConfigs}
      onSort={onSort}
      swipeActions={enableSwipeActions ? swipeActions : undefined}
      getItemId={(item) => item.id}
    />
  );
}
