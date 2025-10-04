import React from "react";
import { View, FlatList, Pressable } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { useTheme } from "@/lib/theme";

export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}

interface OrderScheduleTableProps {
  schedules?: any[];
  onSchedulePress?: (scheduleId: string) => void;
  onScheduleEdit?: (scheduleId: string) => void;
  onScheduleDelete?: (scheduleId: string) => void;
  onScheduleToggleActive?: (scheduleId: string, currentActive: boolean) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  showSelection?: boolean;
  selectedSchedules?: Set<string>;
  onSelectionChange?: (selection: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

export function OrderScheduleTable({
  schedules = [],
  onSchedulePress,
  onScheduleEdit,
  onScheduleDelete,
  onScheduleToggleActive,
  onRefresh,
  refreshing,
  loading,
  showSelection,
  selectedSchedules,
  onSelectionChange,
  sortConfigs,
  onSort,
  visibleColumnKeys,
  enableSwipeActions,
}: OrderScheduleTableProps) {
  const { spacing, colors } = useTheme();

  if (loading) {
    return <LoadingScreen />;
  }

  if (schedules.length === 0) {
    return <EmptyState title="Nenhum agendamento encontrado" />;
  }

  return (
    <FlatList
      data={schedules}
      keyExtractor={(item) => item.id}
      refreshing={refreshing}
      onRefresh={onRefresh}
      renderItem={({ item }) => (
        <Pressable onPress={() => onSchedulePress?.(item.id)}>
          <Card style={{ marginBottom: spacing.sm, padding: spacing.md }}>
            <ThemedText>{item.name || item.id}</ThemedText>
            {item.supplier && (
              <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                Fornecedor: {item.supplier.name}
              </ThemedText>
            )}
            <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
              Status: {item.isActive ? "Ativo" : "Inativo"}
            </ThemedText>
          </Card>
        </Pressable>
      )}
    />
  );
}