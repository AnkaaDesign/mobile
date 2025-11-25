import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash, IconEye } from "@tabler/icons-react-native";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";

interface TeamMemberTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  memberId: string;
  memberName: string;
  onEdit?: (memberId: string) => void;
  onDelete?: (memberId: string) => void;
  onView?: (memberId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const TeamMemberTableRowSwipeComponent = ({
  children,
  memberId,
  memberName,
  onEdit,
  onDelete,
  onView,
  style,
  disabled = false,
}: TeamMemberTableRowSwipeProps) => {
  // Build actions array with colors matching theme
  // View button uses blue (#1d4ed8)
  // Edit button uses green (#15803d)
  // Delete button uses red (#b91c1c)
  const actions: GenericSwipeAction[] = [
    ...(onView
      ? [
          {
            key: "view",
            label: "Ver",
            icon: <IconEye size={20} color="white" />,
            backgroundColor: "#1d4ed8", // blue-700
            onPress: () => onView(memberId),
            closeOnPress: true,
          },
        ]
      : []),
    ...(onEdit
      ? [
          {
            key: "edit",
            label: "Editar",
            icon: <IconEdit size={20} color="white" />,
            backgroundColor: "#15803d", // green-700
            onPress: () => onEdit(memberId),
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
            onPress: () => onDelete(memberId),
            closeOnPress: false,
            confirmDelete: true,
          },
        ]
      : []),
  ];

  return (
    <GenericTableRowSwipe
      entityId={memberId}
      entityName={memberName}
      actions={actions}
      style={style}
      disabled={disabled}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
TeamMemberTableRowSwipeComponent.displayName = "TeamMemberTableRowSwipe";

export const TeamMemberTableRowSwipe = React.memo(TeamMemberTableRowSwipeComponent);
