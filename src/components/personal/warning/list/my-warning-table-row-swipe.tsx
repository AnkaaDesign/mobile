import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { canEditHrEntities, canDeleteHrEntities } from "@/utils/permissions/entity-permissions";

interface MyWarningTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  warningId: string;
  warningReason: string;
  onEdit?: (warningId: string) => void;
  onDelete?: (warningId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const MyWarningTableRowSwipeComponent = ({ children, warningId, warningReason, onEdit, onDelete, style, disabled = false }: MyWarningTableRowSwipeProps) => {
  const { user } = useAuth();
  const canEdit = canEditHrEntities(user);
  const canDelete = canDeleteHrEntities(user);

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
      onPress: () => onEdit(warningId),
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
      onPress: () => onDelete(warningId),
      closeOnPress: false,
      confirmDelete: true,
    });
  }

  return (
    <GenericTableRowSwipe
      entityId={warningId}
      entityName={warningReason}
      actions={actions}
      canPerformActions={(user) => canEditHrEntities(user) || canDeleteHrEntities(user)}
      style={style}
      disabled={disabled}
      confirmDeleteMessage={`Tem certeza que deseja excluir a advertência "${warningReason}"?`}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
MyWarningTableRowSwipeComponent.displayName = "MyWarningTableRowSwipe";

export const MyWarningTableRowSwipe = React.memo(MyWarningTableRowSwipeComponent);
