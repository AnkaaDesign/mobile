import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { TableRowSwipe, SwipeAction } from "@/components/common/table-row-swipe";

interface TeamActivityTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  activityId: string;
  activityDescription: string;
  onEdit?: (activityId: string) => void;
  onDelete?: (activityId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const TeamActivityTableRowSwipeComponent = ({
  children,
  activityId,
  activityDescription,
  onEdit,
  onDelete,
  style,
  disabled = false,
}: TeamActivityTableRowSwipeProps) => {
  // Build actions array with colors matching theme
  // Edit button uses green (#15803d)
  // Delete button uses red (#b91c1c)
  const actions: SwipeAction[] = [
    ...(onEdit
      ? [
          {
            key: "edit",
            label: "Editar",
            icon: <IconEdit size={20} color="white" />,
            backgroundColor: "#15803d", // green-700
            onPress: () => onEdit(activityId),
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
            onPress: () => onDelete(activityId),
            closeOnPress: false,
            confirmDelete: true,
          },
        ]
      : []),
  ];

  return (
    <TableRowSwipe
      entityId={activityId}
      entityName={activityDescription}
      actions={actions}
      style={style}
      disabled={disabled}
    >
      {children}
    </TableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
TeamActivityTableRowSwipeComponent.displayName = "TeamActivityTableRowSwipe";

export const TeamActivityTableRowSwipe = React.memo(TeamActivityTableRowSwipeComponent);
