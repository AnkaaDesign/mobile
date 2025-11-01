
import type { ColumnDefinition as CuttingPlanColumn } from "./cutting-plan-table";
import { ColumnVisibilityDrawer, type ColumnDefinition } from "@/components/ui/column-visibility-drawer";

interface CuttingPlanColumnVisibilityDrawerProps {
  columns: CuttingPlanColumn[];
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
  // Map cutting plan columns to generic column definition
  const mappedColumns: ColumnDefinition[] = columns.map(col => ({
    key: col.key,
    header: col.label,
    sortable: col.sortable,
  }));

  return (
    <ColumnVisibilityDrawer
      columns={mappedColumns}
      visibleColumns={visibleColumns}
      onVisibilityChange={onVisibilityChange}
      open={open}
      onOpenChange={onOpenChange}
      title="Colunas Visíveis"
      description="Selecione as colunas que deseja exibir na lista"
    />
  );
}
