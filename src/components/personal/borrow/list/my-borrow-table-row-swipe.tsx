import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { canEditBorrows, canDeleteBorrows } from "@/utils/permissions/entity-permissions";

interface MyBorrowTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  borrowId: string;
  borrowName: string;
  onEdit?: (borrowId: string) => void;
  onDelete?: (borrowId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const MyBorrowTableRowSwipeComponent = ({ children, borrowId, borrowName, onEdit, onDelete, style, disabled = false }: MyBorrowTableRowSwipeProps) => {
  const { user } = useAuth();
  const canEdit = canEditBorrows(user);
  const canDelete = canDeleteBorrows(user);

  // Build actions array with colors matching theme
  // Edit button uses green (#15803d)
  // Delete button uses red (#b91c1c)
  const actions: GenericSwipeAction[] = [];

  // Add edit action if provided and user has permission
  if (onEdit && canEdit) {
    actions.push({
      key: "edit",
      label: "Editar",
      icon: <IconEdit size={20} color="white" />,
      backgroundColor: "#15803d", // green-700
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
      backgroundColor: "#b91c1c", // red-700
      onPress: () => onDelete(borrowId),
      closeOnPress: false,
      confirmDelete: true,
    });
  }

  return (
    <GenericTableRowSwipe
      entityId={borrowId}
      entityName={borrowName}
      actions={actions}
      canPerformActions={(user) => canEditBorrows(user) || canDeleteBorrows(user)}
      style={style}
      disabled={disabled}
      confirmDeleteMessage={`Tem certeza que deseja excluir o empréstimo de "${borrowName}"?`}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
MyBorrowTableRowSwipeComponent.displayName = "MyBorrowTableRowSwipe";

export const MyBorrowTableRowSwipe = React.memo(MyBorrowTableRowSwipeComponent);
