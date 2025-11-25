import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";

interface TeamPpeDeliveryTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  deliveryId: string;
  deliveryName: string;
  onEdit?: (deliveryId: string) => void;
  onDelete?: (deliveryId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const TeamPpeDeliveryTableRowSwipeComponent = ({
  children,
  deliveryId,
  deliveryName,
  onEdit,
  onDelete,
  style,
  disabled = false,
}: TeamPpeDeliveryTableRowSwipeProps) => {
  // Build actions array with colors matching theme
  // Edit button uses green (#15803d)
  // Delete button uses red (#b91c1c)
  const actions: GenericSwipeAction[] = [
    ...(onEdit
      ? [
          {
            key: "edit",
            label: "Editar",
            icon: <IconEdit size={20} color="white" />,
            backgroundColor: "#15803d", // green-700
            onPress: () => onEdit(deliveryId),
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
            backgroundColor: "#b91c1c", // red-700
            onPress: () => onDelete(deliveryId),
            closeOnPress: false,
            confirmDelete: true,
            confirmDeleteMessage: `Deseja realmente excluir a entrega para ${deliveryName}?`,
          },
        ]
      : []),
  ];

  return (
    <GenericTableRowSwipe
      entityId={deliveryId}
      entityName={deliveryName}
      actions={actions}
      style={style}
      disabled={disabled}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
TeamPpeDeliveryTableRowSwipeComponent.displayName = "TeamPpeDeliveryTableRowSwipe";

export const TeamPpeDeliveryTableRowSwipe = React.memo(TeamPpeDeliveryTableRowSwipeComponent);
