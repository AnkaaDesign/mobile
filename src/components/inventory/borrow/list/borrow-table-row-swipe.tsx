import React, { useCallback } from "react";
import { ViewStyle, StyleProp, Alert } from "react-native";
import { IconEdit, IconTrash, IconCheck, IconAlertTriangle } from "@tabler/icons-react-native";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";
import { BORROW_STATUS } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import { canEditBorrows, canDeleteBorrows } from "@/utils/permissions/entity-permissions";

interface BorrowTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  borrowId: string;
  borrowDescription: string;
  status: string;
  onEdit?: (borrowId: string) => void;
  onDelete?: (borrowId: string) => void;
  onReturn?: (borrowId: string) => void;
  onMarkAsLost?: (borrowId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const BorrowTableRowSwipeComponent = ({
  children,
  borrowId,
  borrowDescription,
  status,
  onEdit,
  onDelete,
  onReturn,
  onMarkAsLost,
  style,
  disabled = false,
}: BorrowTableRowSwipeProps) => {
  const { user } = useAuth();
  const canEdit = canEditBorrows(user);
  const canDelete = canDeleteBorrows(user);

  const handleReturnPress = useCallback(() => {
    Alert.alert(
      "Devolver Item",
      `Confirma a devolução de "${borrowDescription}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Devolver",
          style: "default",
          onPress: () => setTimeout(() => onReturn?.(borrowId), 300),
        },
      ]
    );
  }, [borrowId, borrowDescription, onReturn]);

  const handleMarkAsLostPress = useCallback(() => {
    Alert.alert(
      "Marcar como Perdido",
      `Deseja marcar "${borrowDescription}" como perdido? Esta ação é irreversível.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Marcar como Perdido",
          style: "destructive",
          onPress: () => setTimeout(() => onMarkAsLost?.(borrowId), 300),
        },
      ]
    );
  }, [borrowId, borrowDescription, onMarkAsLost]);

  // Build actions array with colors matching borrow status
  // Return button uses success green (#10b981)
  // Lost button uses warning amber (#f59e0b)
  // Edit button uses optimal stock green (#15803d from items)
  // Delete button uses critical/out-of-stock red (#b91c1c from items)
  const actions: GenericSwipeAction[] = [];

  // Add return and mark as lost actions only for active borrows
  if (status === BORROW_STATUS.ACTIVE) {
    if (onReturn) {
      actions.push({
        key: "return",
        label: "Devolver",
        icon: <IconCheck size={20} color="white" />,
        backgroundColor: "#10b981", // green-500 (success)
        onPress: handleReturnPress,
        closeOnPress: false, // Don't close automatically for confirmation
      });
    }
    if (onMarkAsLost) {
      actions.push({
        key: "lost",
        label: "Perdido",
        icon: <IconAlertTriangle size={20} color="white" />,
        backgroundColor: "#f59e0b", // amber-500 (warning)
        onPress: handleMarkAsLostPress,
        closeOnPress: false, // Don't close automatically for confirmation
      });
    }
  }

  // Add edit action if provided and user has permission
  if (onEdit && canEdit) {
    actions.push({
      key: "edit",
      label: "Editar",
      icon: <IconEdit size={20} color="white" />,
      backgroundColor: "#15803d", // green-700 (optimal stock color)
      onPress: () => onEdit(borrowId),
      closeOnPress: true,
    });
  }

  // Add delete action if provided and user has permission
  if (onDelete && canDelete) {
    actions.push({
      key: "delete",
      label: "Excluir",
      icon: <IconTrash size={20} color="white" />,
      backgroundColor: "#b91c1c", // red-700 (out of stock/critical color)
      onPress: () => onDelete(borrowId),
      closeOnPress: false,
      confirmDelete: true,
      deleteMessage: `Tem certeza que deseja excluir o empréstimo de "${borrowDescription}"?`,
    });
  }

  return (
    <GenericTableRowSwipe
      entityId={borrowId}
      entityName={borrowDescription}
      actions={actions}
      canPerformActions={(user) => canEditBorrows(user) || canDeleteBorrows(user)}
      style={style}
      disabled={disabled}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
BorrowTableRowSwipeComponent.displayName = "BorrowTableRowSwipe";

export const BorrowTableRowSwipe = React.memo(BorrowTableRowSwipeComponent);
