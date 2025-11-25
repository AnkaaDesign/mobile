import React from "react";
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

interface ServiceOrderTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  serviceOrderId: string;
  serviceOrderDescription: string;
  onEdit?: (serviceOrderId: string) => void;
  onDelete?: (serviceOrderId: string) => void;
  customActions?: CustomSwipeAction[];
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const ServiceOrderTableRowSwipeComponent = ({
  children,
  serviceOrderId,
  serviceOrderDescription,
  onEdit,
  onDelete,
  customActions = [],
  style,
  disabled = false,
}: ServiceOrderTableRowSwipeProps) => {
  // Build actions array with colors
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
            onPress: () => onEdit(serviceOrderId),
            closeOnPress: true,
          },
        ]
      : []),
    ...customActions.map((action) => ({
      ...action,
      icon: <Icon name={action.icon} size={20} color="white" />,
      closeOnPress: true,
    })),
    ...(onDelete
      ? [
          {
            key: "delete",
            label: "Excluir",
            icon: <IconTrash size={20} color="white" />,
            backgroundColor: "#b91c1c", // red-700
            onPress: () => onDelete(serviceOrderId),
            closeOnPress: false,
            confirmDelete: true,
          },
        ]
      : []),
  ];

  return (
    <GenericTableRowSwipe
      entityId={serviceOrderId}
      entityName={serviceOrderDescription}
      actions={actions}
      style={style}
      disabled={disabled}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
ServiceOrderTableRowSwipeComponent.displayName = "ServiceOrderTableRowSwipe";

export const ServiceOrderTableRowSwipe = React.memo(ServiceOrderTableRowSwipeComponent);
