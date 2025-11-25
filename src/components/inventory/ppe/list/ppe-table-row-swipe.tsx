import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { Icon } from "@/components/ui/icon";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { canEditPpeDeliveries, canDeletePpeDeliveries } from "@/utils/permissions/entity-permissions";

interface CustomSwipeAction {
  key: string;
  label: string;
  icon: string;
  backgroundColor: string;
  onPress: () => void;
}

interface PpeTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  ppeId: string;
  ppeName: string;
  onEdit?: (ppeId: string) => void;
  onDelete?: (ppeId: string) => void;
  customActions?: CustomSwipeAction[];
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const PpeTableRowSwipeComponent = ({
  children,
  ppeId,
  ppeName,
  onEdit,
  onDelete,
  customActions = [],
  style,
  disabled = false,
}: PpeTableRowSwipeProps) => {
  const { user } = useAuth();
  const canEdit = canEditPpeDeliveries(user);
  const canDelete = canDeletePpeDeliveries(user);

  // Build actions array with colors matching stock status indicators
  // Edit button uses optimal stock green (#15803d from STOCK_LEVEL.OPTIMAL)
  // Delete button uses critical/out-of-stock red (#b91c1c from STOCK_LEVEL.OUT_OF_STOCK)
  const actions: GenericSwipeAction[] = [
    ...(onEdit && canEdit
      ? [
          {
            key: "edit",
            label: "Editar",
            icon: <IconEdit size={20} color="white" />,
            backgroundColor: "#15803d", // green-700 (optimal stock color)
            onPress: () => onEdit(ppeId),
            closeOnPress: true,
          },
        ]
      : []),
    ...customActions.map((action) => ({
      ...action,
      icon: <Icon name={action.icon} size={20} color="white" />,
      closeOnPress: true,
    })),
    ...(onDelete && canDelete
      ? [
          {
            key: "delete",
            label: "Excluir",
            icon: <IconTrash size={20} color="white" />,
            backgroundColor: "#b91c1c", // red-700 (out of stock/critical color)
            onPress: () => onDelete(ppeId),
            closeOnPress: false,
            confirmDelete: true,
          },
        ]
      : []),
  ];

  return (
    <GenericTableRowSwipe
      entityId={ppeId}
      entityName={ppeName}
      actions={actions}
      canPerformActions={(user) => canEditPpeDeliveries(user) || canDeletePpeDeliveries(user)}
      style={style}
      disabled={disabled}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
PpeTableRowSwipeComponent.displayName = "PpeTableRowSwipe";

export const PpeTableRowSwipe = React.memo(PpeTableRowSwipeComponent);
