import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { TableRowSwipe, SwipeAction } from "@/components/common/table-row-swipe";

interface TeamWarningTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  warningId: string;
  warningLabel: string;
  onEdit?: (warningId: string) => void;
  onDelete?: (warningId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const TeamWarningTableRowSwipeComponent = ({
  children,
  warningId,
  warningLabel,
  onEdit,
  onDelete,
  style,
  disabled = false,
}: TeamWarningTableRowSwipeProps) => {
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
            onPress: () => onEdit(warningId),
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
            onPress: () => onDelete(warningId),
            closeOnPress: false,
            confirmDelete: true,
            deleteMessage: "Tem certeza que deseja excluir esta advertência?",
          },
        ]
      : []),
  ];

  return (
    <TableRowSwipe
      entityId={warningId}
      entityName={warningLabel}
      actions={actions}
      style={style}
      disabled={disabled}
    >
      {children}
    </TableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
TeamWarningTableRowSwipeComponent.displayName = "TeamWarningTableRowSwipe";

export const TeamWarningTableRowSwipe = React.memo(TeamWarningTableRowSwipeComponent);
