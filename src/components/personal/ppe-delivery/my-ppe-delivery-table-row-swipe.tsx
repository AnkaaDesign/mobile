import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { TableRowSwipe, SwipeAction } from "@/components/common/table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { canEditPpeDeliveries, canDeletePpeDeliveries } from "@/utils/permissions/entity-permissions";

interface MyPpeDeliveryTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  deliveryId: string;
  deliveryName: string;
  onEdit?: (deliveryId: string) => void;
  onDelete?: (deliveryId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const MyPpeDeliveryTableRowSwipeComponent = ({ children, deliveryId, deliveryName, onEdit, onDelete, style, disabled = false }: MyPpeDeliveryTableRowSwipeProps) => {
  const { user } = useAuth();
  const canEdit = canEditPpeDeliveries(user);
  const canDelete = canDeletePpeDeliveries(user);

  // Build actions array with colors matching theme
  // Edit button uses green (#15803d)
  // Delete button uses red (#b91c1c)
  const actions: SwipeAction[] = [];

  // Add edit action if provided and user has permission
  if (onEdit && canEdit) {
    actions.push({
      key: "edit",
      label: "Editar",
      icon: <IconEdit size={20} color="white" />,
      backgroundColor: "#15803d", // green-700
      onPress: () => onEdit(deliveryId),
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
      onPress: () => onDelete(deliveryId),
      closeOnPress: false,
      confirmDelete: true,
    });
  }

  return (
    <TableRowSwipe
      entityId={deliveryId}
      entityName={deliveryName}
      actions={actions}
      canPerformActions={(user) => canEditPpeDeliveries(user) || canDeletePpeDeliveries(user)}
      style={style}
      disabled={disabled}
      confirmDeleteTitle="Excluir entrega"
      confirmDeleteMessage={`Tem certeza que deseja excluir a entrega "${deliveryName}"?`}
    >
      {children}
    </TableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
MyPpeDeliveryTableRowSwipeComponent.displayName = "MyPpeDeliveryTableRowSwipe";

export const MyPpeDeliveryTableRowSwipe = React.memo(MyPpeDeliveryTableRowSwipeComponent);
