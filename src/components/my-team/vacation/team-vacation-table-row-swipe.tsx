import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { TableRowSwipe, SwipeAction } from "@/components/common/table-row-swipe";

interface TeamVacationTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  vacationId: string;
  vacationUserName: string;
  onEdit?: (vacationId: string) => void;
  onDelete?: (vacationId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const TeamVacationTableRowSwipeComponent = ({
  children,
  vacationId,
  vacationUserName,
  onEdit,
  onDelete,
  style,
  disabled = false,
}: TeamVacationTableRowSwipeProps) => {
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
            onPress: () => onEdit(vacationId),
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
            onPress: () => onDelete(vacationId),
            closeOnPress: false,
            confirmDelete: true,
            deleteMessage: `Tem certeza que deseja excluir as férias de ${vacationUserName}?`,
          },
        ]
      : []),
  ];

  return (
    <TableRowSwipe
      entityId={vacationId}
      entityName={vacationUserName}
      actions={actions}
      style={style}
      disabled={disabled}
    >
      {children}
    </TableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
TeamVacationTableRowSwipeComponent.displayName = "TeamVacationTableRowSwipe";

export const TeamVacationTableRowSwipe = React.memo(TeamVacationTableRowSwipeComponent);
