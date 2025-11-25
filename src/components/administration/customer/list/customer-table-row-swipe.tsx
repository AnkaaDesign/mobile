import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { canEditCustomers, canDeleteCustomers } from "@/utils/permissions/entity-permissions";

interface CustomerTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  customerId: string;
  customerName: string;
  onEdit?: (customerId: string) => void;
  onDelete?: (customerId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const CustomerTableRowSwipeComponent = ({
  children,
  customerId,
  customerName,
  onEdit,
  onDelete,
  style,
  disabled = false,
}: CustomerTableRowSwipeProps) => {
  const { user } = useAuth();
  const canEdit = canEditCustomers(user);
  const canDelete = canDeleteCustomers(user);

  // Build actions array with colors matching theme
  // Edit button uses green (#15803d)
  // Delete button uses red (#b91c1c)
  const actions: GenericSwipeAction[] = [
    ...(onEdit && canEdit
      ? [
          {
            key: "edit",
            label: "Editar",
            icon: <IconEdit size={20} color="white" />,
            backgroundColor: "#15803d", // green-700
            onPress: () => onEdit(customerId),
            closeOnPress: true,
          },
        ]
      : []),
    ...(onDelete && canDelete
      ? [
          {
            key: "delete",
            label: "Excluir",
            icon: <IconTrash size={20} color="white" />,
            backgroundColor: "#b91c1c", // red-700
            onPress: () => onDelete(customerId),
            closeOnPress: false,
            confirmDelete: true,
          },
        ]
      : []),
  ];

  return (
    <GenericTableRowSwipe
      entityId={customerId}
      entityName={customerName}
      actions={actions}
      canPerformActions={(user) => canEditCustomers(user) || canDeleteCustomers(user)}
      style={style}
      disabled={disabled}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
CustomerTableRowSwipeComponent.displayName = "CustomerTableRowSwipe";

export const CustomerTableRowSwipe = React.memo(CustomerTableRowSwipeComponent);
