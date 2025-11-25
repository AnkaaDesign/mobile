import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash, IconEye } from "@tabler/icons-react-native";
import { TableRowSwipe, SwipeAction } from "@/components/common/table-row-swipe";
import { EXTERNAL_WITHDRAWAL_STATUS } from "@/constants";

interface ExternalWithdrawalTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  withdrawalId: string;
  withdrawalName: string;
  withdrawalStatus: EXTERNAL_WITHDRAWAL_STATUS;
  onView?: (withdrawalId: string) => void;
  onEdit?: (withdrawalId: string) => void;
  onDelete?: (withdrawalId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const ExternalWithdrawalTableRowSwipeComponent = ({
  children,
  withdrawalId,
  withdrawalName,
  withdrawalStatus,
  onView,
  onEdit,
  onDelete,
  style,
  disabled = false,
}: ExternalWithdrawalTableRowSwipeProps) => {
  // Only show edit action for PENDING status
  const canEdit = withdrawalStatus === EXTERNAL_WITHDRAWAL_STATUS.PENDING;

  // Build actions array with colors matching withdrawal operations
  // View button uses blue (#007AFF)
  // Edit button uses green (#34C759) - only for PENDING
  // Delete button uses red (#FF3B30)
  const actions: SwipeAction[] = [
    ...(onView
      ? [
          {
            key: "view",
            label: "Ver",
            icon: <IconEye size={20} color="white" />,
            backgroundColor: "#007AFF", // blue
            onPress: () => onView(withdrawalId),
            closeOnPress: true,
          },
        ]
      : []),
    ...(onEdit && canEdit
      ? [
          {
            key: "edit",
            label: "Editar",
            icon: <IconEdit size={20} color="white" />,
            backgroundColor: "#34C759", // green
            onPress: () => onEdit(withdrawalId),
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
            backgroundColor: "#FF3B30", // red
            onPress: () => onDelete(withdrawalId),
            closeOnPress: false,
            confirmDelete: true,
          },
        ]
      : []),
  ];

  return (
    <TableRowSwipe
      entityId={withdrawalId}
      entityName={withdrawalName}
      actions={actions}
      style={style}
      disabled={disabled}
      confirmDeleteMessage={`Tem certeza que deseja excluir a retirada de "${withdrawalName}"?`}
    >
      {children}
    </TableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
ExternalWithdrawalTableRowSwipeComponent.displayName = "ExternalWithdrawalTableRowSwipe";

export const ExternalWithdrawalTableRowSwipe = React.memo(ExternalWithdrawalTableRowSwipeComponent);
