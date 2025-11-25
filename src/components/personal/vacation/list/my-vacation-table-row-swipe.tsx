import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { canEditHrEntities, canDeleteHrEntities } from "@/utils/permissions/entity-permissions";

interface MyVacationTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  vacationId: string;
  vacationPeriod: string;
  onEdit?: (vacationId: string) => void;
  onDelete?: (vacationId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const MyVacationTableRowSwipeComponent = ({ children, vacationId, vacationPeriod, onEdit, onDelete, style, disabled = false }: MyVacationTableRowSwipeProps) => {
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
      onPress: () => onEdit(vacationId),
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
      onPress: () => onDelete(vacationId),
      closeOnPress: false,
      confirmDelete: true,
    });
  }

  return (
    <GenericTableRowSwipe
      entityId={vacationId}
      entityName={vacationPeriod}
      actions={actions}
      canPerformActions={(user) => canEditHrEntities(user) || canDeleteHrEntities(user)}
      style={style}
      disabled={disabled}
      confirmDeleteMessage={`Tem certeza que deseja excluir as férias do período "${vacationPeriod}"?`}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
MyVacationTableRowSwipeComponent.displayName = "MyVacationTableRowSwipe";

export const MyVacationTableRowSwipe = React.memo(MyVacationTableRowSwipeComponent);
