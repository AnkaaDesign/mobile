import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import type { Commission } from "@/types";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { TableRowSwipe, SwipeAction } from "@/components/common/table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasAnyPrivilege } from "@/utils";

interface CommissionTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  commission: Commission;
  onEdit?: (commissionId: string) => void;
  onDelete?: (commissionId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const CommissionTableRowSwipeComponent = ({
  children,
  commission,
  onEdit,
  onDelete,
  style,
  disabled = false,
}: CommissionTableRowSwipeProps) => {
  const { user } = useAuth();
  const canEdit = user ? hasAnyPrivilege(user, [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.FINANCIAL]) : false;
  const canDelete = canEdit; // Same permissions for edit and delete

  // Build actions array with consistent colors
  // Edit button uses green (#15803d)
  // Delete button uses red (#b91c1c)
  const actions: SwipeAction[] = [
    ...(onEdit && canEdit
      ? [
          {
            key: "edit",
            label: "Editar",
            icon: <IconEdit size={20} color="white" />,
            backgroundColor: "#15803d", // green-700
            onPress: () => onEdit(commission.id),
            closeOnPress: true,
          },
        ]
      : []),
    ...(onDelete && canDelete
      ? [
          {
            key: "delete",
            label: "Excluir",
            icon: <IconTrash size={20} color="white" />,
            backgroundColor: "#b91c1c", // red-700
            onPress: () => onDelete(commission.id),
            closeOnPress: false,
            confirmDelete: true,
          },
        ]
      : []),
  ];

  return (
    <TableRowSwipe
      entityId={commission.id}
      entityName={`Comissão`}
      actions={actions}
      canPerformActions={(user) => (user ? hasAnyPrivilege(user, [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.FINANCIAL]) : false)}
      style={style}
      disabled={disabled}
    >
      {children}
    </TableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
CommissionTableRowSwipeComponent.displayName = "CommissionTableRowSwipe";

export const CommissionTableRowSwipe = React.memo(CommissionTableRowSwipeComponent);
