import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash, IconEye } from "@tabler/icons-react-native";
import { Icon } from "@/components/ui/icon";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { canEditHrEntities, canDeleteHrEntities } from "@/utils/permissions/entity-permissions";

interface CustomSwipeAction {
  key: string;
  label: string;
  icon: string;
  backgroundColor: string;
  onPress: () => void;
}

interface EmployeeTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  employeeId: string;
  employeeName: string;
  onEdit?: (employeeId: string) => void;
  onDelete?: (employeeId: string) => void;
  onView?: (employeeId: string) => void;
  customActions?: CustomSwipeAction[];
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const EmployeeTableRowSwipeComponent = ({
  children,
  employeeId,
  employeeName,
  onEdit,
  onDelete,
  onView,
  customActions = [],
  style,
  disabled = false,
}: EmployeeTableRowSwipeProps) => {
  const { user } = useAuth();
  const canEdit = canEditHrEntities(user);
  const canDelete = canDeleteHrEntities(user);

  // Build actions array with consistent colors
  // View button uses blue (#3b82f6)
  // Edit button uses green (#15803d from optimal stock color)
  // Delete button uses red (#b91c1c from critical/out-of-stock color)
  const actions: GenericSwipeAction[] = [
    ...(onView
      ? [
          {
            key: "view",
            label: "Ver",
            icon: <IconEye size={20} color="white" />,
            backgroundColor: "#3b82f6", // blue-500
            onPress: () => onView(employeeId),
            closeOnPress: true,
          },
        ]
      : []),
    ...(onEdit && canEdit
      ? [
          {
            key: "edit",
            label: "Editar",
            icon: <IconEdit size={20} color="white" />,
            backgroundColor: "#15803d", // green-700 (optimal stock color)
            onPress: () => onEdit(employeeId),
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
            onPress: () => onDelete(employeeId),
            closeOnPress: false,
            confirmDelete: true,
          },
        ]
      : []),
  ];

  return (
    <GenericTableRowSwipe
      entityId={employeeId}
      entityName={employeeName}
      actions={actions}
      canPerformActions={(user) => canEditHrEntities(user) || canDeleteHrEntities(user) || !!onView}
      style={style}
      disabled={disabled}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
EmployeeTableRowSwipeComponent.displayName = "EmployeeTableRowSwipe";

export const EmployeeTableRowSwipe = React.memo(EmployeeTableRowSwipeComponent);
