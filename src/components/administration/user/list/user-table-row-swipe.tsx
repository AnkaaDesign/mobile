import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash, IconEye } from "@tabler/icons-react-native";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { canEditUsers, canDeleteUsers } from "@/utils/permissions/entity-permissions";

interface UserTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  userId: string;
  userName: string;
  onEdit?: (userId: string) => void;
  onDelete?: (userId: string) => void;
  onView?: (userId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const UserTableRowSwipeComponent = ({
  children,
  userId,
  userName,
  onEdit,
  onDelete,
  onView,
  style,
  disabled = false,
}: UserTableRowSwipeProps) => {
  const { user } = useAuth();
  const canEdit = canEditUsers(user);
  const canDelete = canDeleteUsers(user);

  // Build actions array with consistent colors
  // View button uses primary color (blue)
  // Edit button uses blue (#3b82f6)
  // Delete button uses red (#ef4444)
  const actions: GenericSwipeAction[] = [
    ...(onView
      ? [
          {
            key: "view",
            label: "Ver",
            icon: <IconEye size={20} color="white" />,
            backgroundColor: "#3b82f6", // blue-500
            onPress: () => onView(userId),
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
            backgroundColor: "#15803d", // green-700
            onPress: () => onEdit(userId),
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
            onPress: () => onDelete(userId),
            closeOnPress: false,
            confirmDelete: true,
          },
        ]
      : []),
  ];

  return (
    <GenericTableRowSwipe
      entityId={userId}
      entityName={userName}
      actions={actions}
      canPerformActions={(user) => canEditUsers(user) || canDeleteUsers(user) || !!onView}
      style={style}
      disabled={disabled}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
UserTableRowSwipeComponent.displayName = "UserTableRowSwipe";

export const UserTableRowSwipe = React.memo(UserTableRowSwipeComponent);
