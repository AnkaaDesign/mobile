import React from "react";
import { ColumnVisibilityDrawer } from "@/components/ui/column-visibility-drawer";
import type { ObservationColumn } from "./observation-table";

interface ObservationColumnVisibilityDrawerProps {
  columns: ObservationColumn[];
  visibleColumns: Set<string>;
  onVisibilityChange: (visibleColumns: Set<string>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ObservationColumnVisibilityDrawer({
  columns,
  visibleColumns,
  onVisibilityChange,
  open,
  onOpenChange,
}: ObservationColumnVisibilityDrawerProps) {
  return (
    <ColumnVisibilityDrawer
      title="Colunas da Tabela"
      description="Selecione quais colunas deseja visualizar"
      columns={columns}
      visibleColumns={visibleColumns}
      onVisibilityChange={onVisibilityChange}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
