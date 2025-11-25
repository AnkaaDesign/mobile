import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";

interface TeamBorrowTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  borrowId: string;
  borrowName: string;
  onEdit?: (borrowId: string) => void;
  onDelete?: (borrowId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const TeamBorrowTableRowSwipeComponent = ({
  children,
  borrowId,
  borrowName,
  onEdit,
  onDelete,
  style,
  disabled = false,
}: TeamBorrowTableRowSwipeProps) => {
  // Build actions array with colors matching theme
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
            onPress: () => onEdit(borrowId),
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
            onPress: () => onDelete(borrowId),
            closeOnPress: false,
            confirmDelete: true,
            confirmDeleteMessage: `Deseja realmente excluir o empréstimo de "${borrowName}"?`,
          },
        ]
      : []),
  ];

  return (
    <GenericTableRowSwipe
      entityId={borrowId}
      entityName={borrowName}
      actions={actions}
      style={style}
      disabled={disabled}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
TeamBorrowTableRowSwipeComponent.displayName = "TeamBorrowTableRowSwipe";

export const TeamBorrowTableRowSwipe = React.memo(TeamBorrowTableRowSwipeComponent);
