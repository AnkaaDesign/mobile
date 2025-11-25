import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconTrash } from "@tabler/icons-react-native";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";

interface ActivityTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  activityId: string;
  activityDescription: string;
  onDelete?: (activityId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const ActivityTableRowSwipeComponent = ({
  children,
  activityId,
  activityDescription,
  onDelete,
  style,
  disabled = false,
}: ActivityTableRowSwipeProps) => {
  // Build actions array with colors matching the activity operations
  // Delete button uses critical/out-of-stock red (#ef4444)
  const actions: GenericSwipeAction[] = [
    ...(onDelete
      ? [
          {
            key: "delete",
            label: "Excluir",
            icon: <IconTrash size={20} color="white" />,
            backgroundColor: "#ef4444", // red-500 (error color)
            onPress: () => onDelete(activityId),
            closeOnPress: false,
            confirmDelete: true,
            deleteMessage: `Tem certeza que deseja excluir "${activityDescription}"? Esta ação é irreversível e afetará o estoque.`,
          },
        ]
      : []),
  ];

  return (
    <GenericTableRowSwipe
      entityId={activityId}
      entityName={activityDescription}
      actions={actions}
      style={style}
      disabled={disabled}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
ActivityTableRowSwipeComponent.displayName = "ActivityTableRowSwipe";

export const ActivityTableRowSwipe = React.memo(ActivityTableRowSwipeComponent);
