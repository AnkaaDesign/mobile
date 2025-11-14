import React from "react";
import type { Commission } from '../../../../types';
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { ReanimatedSwipeableRow} from "@/components/ui/reanimated-swipeable-row";

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
  const rightActions: SwipeAction[] = [
    ...(onEdit
      ? [
          {
            key: "edit",
            label: "Editar",
            icon: <IconEdit size={20} color="white" />,
            onPress: () => onEdit(commission.id),
            backgroundColor: "#3b82f6",
            closeOnPress: true,
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            key: "delete",
            label: "Excluir",
            icon: <IconTrash size={20} color="white" />,
            onPress: () => onDelete(commission.id),
            backgroundColor: "#ef4444",
            closeOnPress: true,
          },
        ]
      : []),
  ];

  if (rightActions.length === 0) {
    return <>{children}</>;
  }

  return (
    <ReanimatedSwipeableRow rightActions={rightActions}>
      {children}
    </ReanimatedSwipeableRow>
  );
}
