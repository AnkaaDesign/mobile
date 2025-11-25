import React, { useCallback } from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { Icon } from "@/components/ui/icon";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";

interface CustomSwipeAction {
  key: string;
  label: string;
  icon: string;
  backgroundColor: string;
  onPress: () => void;
}

interface WarningTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  warningId: string;
  collaboratorName: string;
  onEdit?: (warningId: string) => void;
  onDelete?: (warningId: string) => void;
  customActions?: CustomSwipeAction[];
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const WarningTableRowSwipeComponent = ({
  children,
  warningId,
  collaboratorName,
  onEdit,
  onDelete,
  customActions = [],
  style,
  disabled = false
}: WarningTableRowSwipeProps) => {
  // Build actions array with colors matching stock status indicators
  // Edit button uses optimal stock green (#15803d from STOCK_LEVEL.OPTIMAL)
  // Delete button uses critical/out-of-stock red (#b91c1c from STOCK_LEVEL.OUT_OF_STOCK)
  const actions: GenericSwipeAction[] = [];

  // Add edit action if provided
  if (onEdit) {
    actions.push({
      key: "edit",
      label: "Editar",
      icon: <IconEdit size={20} color="white" />,
      backgroundColor: "#15803d", // green-700 (optimal stock color)
      onPress: () => onEdit(warningId),
      closeOnPress: true,
    });
  }

  // Add custom actions
  customActions.forEach((action) => {
    actions.push({
      ...action,
      icon: <Icon name={action.icon} size={20} color="white" />,
      closeOnPress: true,
    });
  });

  // Add delete action if provided
  if (onDelete) {
    actions.push({
      key: "delete",
      label: "Excluir",
      icon: <IconTrash size={20} color="white" />,
      backgroundColor: "#b91c1c", // red-700 (out of stock/critical color)
      onPress: () => onDelete(warningId),
      closeOnPress: false,
      confirmDelete: true,
    });
  }

  return (
    <GenericTableRowSwipe
      entityId={warningId}
      entityName={collaboratorName}
      actions={actions}
      style={style}
      disabled={disabled}
      confirmDeleteMessage={`Tem certeza que deseja excluir a advertência de "${collaboratorName}"?`}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
WarningTableRowSwipeComponent.displayName = "WarningTableRowSwipe";

export const WarningTableRowSwipe = React.memo(WarningTableRowSwipeComponent);
