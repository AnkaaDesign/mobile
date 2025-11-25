import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash, IconCopy } from "@tabler/icons-react-native";
import { Icon } from "@/components/ui/icon";
import { TableRowSwipe, SwipeAction } from "@/components/common/table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { canEditOrders, canDeleteOrders } from "@/utils/permissions/entity-permissions";

interface CustomSwipeAction {
  key: string;
  label: string;
  icon: string;
  backgroundColor: string;
  onPress: () => void;
}

interface OrderTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  orderId: string;
  orderName: string;
  onEdit?: (orderId: string) => void;
  onDelete?: (orderId: string) => void;
  onDuplicate?: (orderId: string) => void;
  customActions?: CustomSwipeAction[];
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const OrderTableRowSwipeComponent = ({
  children,
  orderId,
  orderName,
  onEdit,
  onDelete,
  onDuplicate,
  customActions = [],
  style,
  disabled = false,
}: OrderTableRowSwipeProps) => {
  const { user } = useAuth();
  const canEdit = canEditOrders(user);
  const canDelete = canDeleteOrders(user);

  // Build actions array with colors matching order status
  // Edit button uses blue (#007AFF)
  // Duplicate button uses orange (#FF9500)
  // Delete button uses red (#FF3B30)
  const actions: SwipeAction[] = [
    ...(onEdit && canEdit
      ? [
          {
            key: "edit",
            label: "Editar",
            icon: <IconEdit size={20} color="white" />,
            backgroundColor: "#007AFF", // blue
            onPress: () => onEdit(orderId),
            closeOnPress: true,
          },
        ]
      : []),
    ...(onDuplicate && canEdit
      ? [
          {
            key: "duplicate",
            label: "Duplicar",
            icon: <IconCopy size={20} color="white" />,
            backgroundColor: "#FF9500", // orange
            onPress: () => onDuplicate(orderId),
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
            backgroundColor: "#FF3B30", // red
            onPress: () => onDelete(orderId),
            closeOnPress: false,
            confirmDelete: true,
          },
        ]
      : []),
  ];

  return (
    <TableRowSwipe
      entityId={orderId}
      entityName={orderName}
      actions={actions}
      canPerformActions={(user) => canEditOrders(user) || canDeleteOrders(user)}
      style={style}
      disabled={disabled}
    >
      {children}
    </TableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
OrderTableRowSwipeComponent.displayName = "OrderTableRowSwipe";

export const OrderTableRowSwipe = React.memo(OrderTableRowSwipeComponent);
