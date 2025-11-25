import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { Icon } from "@/components/ui/icon";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { canEditItems, canDeleteItems } from "@/utils/permissions/entity-permissions";

interface CustomSwipeAction {
  key: string;
  label: string;
  icon: string;
  backgroundColor: string;
  onPress: () => void;
}

interface ItemTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  itemId: string;
  itemName: string;
  onEdit?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
  customActions?: CustomSwipeAction[];
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const ItemTableRowSwipeComponent = ({
  children,
  itemId,
  itemName,
  onEdit,
  onDelete,
  customActions = [],
  style,
  disabled = false,
}: ItemTableRowSwipeProps) => {
  const { user } = useAuth();
  const canEdit = canEditItems(user);
  const canDelete = canDeleteItems(user);

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
            onPress: () => onEdit(itemId),
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
            onPress: () => onDelete(itemId),
            closeOnPress: false,
            confirmDelete: true,
          },
        ]
      : []),
  ];

  return (
    <GenericTableRowSwipe
      entityId={itemId}
      entityName={itemName}
      actions={actions}
      canPerformActions={(user) => canEditItems(user) || canDeleteItems(user)}
      style={style}
      disabled={disabled}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
ItemTableRowSwipeComponent.displayName = "ItemTableRowSwipe";

export const ItemTableRowSwipe = React.memo(ItemTableRowSwipeComponent);
