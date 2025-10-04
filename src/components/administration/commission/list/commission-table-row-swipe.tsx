import React from "react";
import type { Commission } from '../../../../types';
import { ReanimatedSwipeableRow } from "@/components/ui/reanimated-swipeable-row";

interface CommissionTableRowSwipeProps {
  commission: Commission;
  onEdit?: (commissionId: string) => void;
  onDelete?: (commissionId: string) => void;
  children: React.ReactNode;
}

export function CommissionTableRowSwipe({
  commission,
  onEdit,
  onDelete,
  children,
}: CommissionTableRowSwipeProps) {
  const swipeActions = [
    ...(onEdit
      ? [
          {
            label: "Editar",
            icon: "edit" as const,
            onPress: () => onEdit(commission.id),
            backgroundColor: "#3b82f6",
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            label: "Excluir",
            icon: "trash" as const,
            onPress: () => onDelete(commission.id),
            backgroundColor: "#ef4444",
          },
        ]
      : []),
  ];

  if (swipeActions.length === 0) {
    return <>{children}</>;
  }

  return (
    <ReanimatedSwipeableRow actions={swipeActions}>
      {children}
    </ReanimatedSwipeableRow>
  );
}
