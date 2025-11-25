import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconTrash } from "@tabler/icons-react-native";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";

interface NotificationTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  notificationId: string;
  notificationTitle: string;
  onDelete?: (notificationId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const NotificationTableRowSwipeComponent = ({
  children,
  notificationId,
  notificationTitle,
  onDelete,
  style,
  disabled = false,
}: NotificationTableRowSwipeProps) => {
  // Build actions array - notifications typically only have delete action
  // Delete button uses red (#b91c1c)
  const actions: GenericSwipeAction[] = [
    ...(onDelete
      ? [
          {
            key: "delete",
            label: "Excluir",
            icon: <IconTrash size={20} color="white" />,
            backgroundColor: "#b91c1c", // red-700
            onPress: () => onDelete(notificationId),
            closeOnPress: false,
            confirmDelete: true,
          },
        ]
      : []),
  ];

  return (
    <GenericTableRowSwipe
      entityId={notificationId}
      entityName={notificationTitle}
      actions={actions}
      confirmDeleteTitle="Excluir notificação"
      confirmDeleteMessage={`Tem certeza que deseja excluir a notificação "${notificationTitle}"?`}
      style={style}
      disabled={disabled}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
NotificationTableRowSwipeComponent.displayName = "NotificationTableRowSwipe";

export const NotificationTableRowSwipe = React.memo(NotificationTableRowSwipeComponent);
