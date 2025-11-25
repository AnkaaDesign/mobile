import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconCheck, IconX, IconTrash } from "@tabler/icons-react-native";
import { TableRowSwipe, SwipeAction } from "@/components/common/table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { canDeleteUsers } from "@/utils/permissions/entity-permissions";

interface NotificationTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  notificationId: string;
  notificationTitle: string;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAsUnread?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const NotificationTableRowSwipeComponent = ({
  children,
  notificationId,
  notificationTitle,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  style,
  disabled = false,
}: NotificationTableRowSwipeProps) => {
  const { user } = useAuth();
  const canDelete = canDeleteUsers(user);

  // Build actions array with colors matching theme
  const actions: SwipeAction[] = [];

  // Add mark as read action if provided
  if (onMarkAsRead) {
    actions.push({
      key: "markAsRead",
      label: "Lida",
      icon: <IconCheck size={20} color="white" />,
      backgroundColor: "#15803d", // green-700
      onPress: () => onMarkAsRead(notificationId),
      closeOnPress: true,
    });
  }

  // Add mark as unread action if provided
  if (onMarkAsUnread) {
    actions.push({
      key: "markAsUnread",
      label: "Não lida",
      icon: <IconX size={20} color="white" />,
      backgroundColor: "#ca8a04", // yellow-700
      onPress: () => onMarkAsUnread(notificationId),
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
      onPress: () => onDelete(notificationId),
      closeOnPress: false,
      confirmDelete: true,
    });
  }

  return (
    <TableRowSwipe
      entityId={notificationId}
      entityName={notificationTitle}
      actions={actions}
      style={style}
      disabled={disabled}
      confirmDeleteMessage={`Tem certeza que deseja excluir a notificação "${notificationTitle}"?`}
    >
      {children}
    </TableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
NotificationTableRowSwipeComponent.displayName = "NotificationTableRowSwipe";

export const NotificationTableRowSwipe = React.memo(NotificationTableRowSwipeComponent);
