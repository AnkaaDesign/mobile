import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { Icon } from "@/components/ui/icon";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { canEditSuppliers, canDeleteSuppliers } from "@/utils/permissions/entity-permissions";

interface CustomSwipeAction {
  key: string;
  label: string;
  icon: string;
  backgroundColor: string;
  onPress: () => void;
}

interface SupplierTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  supplierId: string;
  supplierName: string;
  onEdit?: (supplierId: string) => void;
  onDelete?: (supplierId: string) => void;
  customActions?: CustomSwipeAction[];
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const SupplierTableRowSwipeComponent = ({
  children,
  supplierId,
  supplierName,
  onEdit,
  onDelete,
  customActions = [],
  style,
  disabled = false,
}: SupplierTableRowSwipeProps) => {
  const { user } = useAuth();
  const canEdit = canEditSuppliers(user);
  const canDelete = canDeleteSuppliers(user);

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
            onPress: () => onEdit(supplierId),
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
            onPress: () => onDelete(supplierId),
            closeOnPress: false,
            confirmDelete: true,
          },
        ]
      : []),
  ];

  return (
    <GenericTableRowSwipe
      entityId={supplierId}
      entityName={supplierName}
      actions={actions}
      canPerformActions={(user) => canEditSuppliers(user) || canDeleteSuppliers(user)}
      style={style}
      disabled={disabled}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
SupplierTableRowSwipeComponent.displayName = "SupplierTableRowSwipe";

export const SupplierTableRowSwipe = React.memo(SupplierTableRowSwipeComponent);
