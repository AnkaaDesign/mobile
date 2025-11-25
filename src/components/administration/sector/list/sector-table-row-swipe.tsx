import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { TableRowSwipe, SwipeAction } from "@/components/common/table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasAnyPrivilege } from "@/utils";

interface SectorTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  sectorId: string;
  sectorName: string;
  onEdit?: (sectorId: string) => void;
  onDelete?: (sectorId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const SectorTableRowSwipeComponent = ({
  children,
  sectorId,
  sectorName,
  onEdit,
  onDelete,
  style,
  disabled = false,
}: SectorTableRowSwipeProps) => {
  const { user } = useAuth();
  const canEdit = user ? hasAnyPrivilege(user, [SECTOR_PRIVILEGES.ADMIN]) : false;
  const canDelete = canEdit; // Only admins can edit/delete sectors

  // Build actions array with colors matching item table pattern
  // Edit button uses optimal stock green (#15803d from STOCK_LEVEL.OPTIMAL)
  // Delete button uses critical/out-of-stock red (#b91c1c from STOCK_LEVEL.OUT_OF_STOCK)
  const actions: SwipeAction[] = [
    ...(onEdit && canEdit
      ? [
          {
            key: "edit",
            label: "Editar",
            icon: <IconEdit size={20} color="white" />,
            backgroundColor: "#15803d", // green-700 (optimal stock color)
            onPress: () => onEdit(sectorId),
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
            backgroundColor: "#b91c1c", // red-700 (out of stock/critical color)
            onPress: () => onDelete(sectorId),
            closeOnPress: false,
            confirmDelete: true,
          },
        ]
      : []),
  ];

  return (
    <TableRowSwipe
      entityId={sectorId}
      entityName={sectorName}
      actions={actions}
      canPerformActions={(user) => (user ? hasAnyPrivilege(user, [SECTOR_PRIVILEGES.ADMIN]) : false)}
      confirmDeleteMessage={`Tem certeza que deseja excluir o setor "${sectorName}"?`}
      style={style}
      disabled={disabled}
    >
      {children}
    </TableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
SectorTableRowSwipeComponent.displayName = "SectorTableRowSwipe";

export const SectorTableRowSwipe = React.memo(SectorTableRowSwipeComponent);
