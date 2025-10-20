import React from "react";
import { ColumnVisibilityDrawer } from "@/components/ui/column-visibility-drawer";
import type { DataColumn } from "@/components/ui/data-table";
import type { PaintType } from "../../../../types";

interface PaintTypeColumnVisibilityDrawerProps {
  columns: DataColumn<PaintType>[];
  visibleColumns: Set<string>;
  onVisibilityChange: (visible: Set<string>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaintTypeColumnVisibilityDrawer({
  columns,
  visibleColumns,
  onVisibilityChange,
  open,
  onOpenChange,
}: PaintTypeColumnVisibilityDrawerProps) {
  return (
    <ColumnVisibilityDrawer
      columns={columns}
      visibleColumns={visibleColumns}
      onVisibilityChange={onVisibilityChange}
      open={open}
      onOpenChange={onOpenChange}
      title="Colunas Visíveis"
      description="Selecione as colunas que deseja visualizar na tabela"
    />
  );
}
