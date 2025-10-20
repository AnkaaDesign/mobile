import React from "react";
import type { ColumnDefinition } from "./cutting-plan-table";
import { ColumnVisibilityDrawer } from "@/components/ui/column-visibility-drawer";

interface CuttingPlanColumnVisibilityDrawerProps {
  columns: ColumnDefinition[];
  visibleColumns: Set<string>;
  onVisibilityChange: (visibleColumns: Set<string>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CuttingPlanColumnVisibilityDrawer({
  columns,
  visibleColumns,
  onVisibilityChange,
  open,
  onOpenChange,
}: CuttingPlanColumnVisibilityDrawerProps) {
  return (
    <ColumnVisibilityDrawer
      columns={columns}
      visibleColumns={visibleColumns}
      onVisibilityChange={onVisibilityChange}
      open={open}
      onOpenChange={onOpenChange}
      title="Colunas Visíveis"
      description="Selecione as colunas que deseja exibir na lista"
    />
  );
}
