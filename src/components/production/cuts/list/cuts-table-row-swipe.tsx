import React, { ReactNode } from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash, IconScissors } from "@tabler/icons-react-native";
import { TableRowSwipe, SwipeAction } from "@/components/common/table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { canEditCuts, canDeleteCuts } from "@/utils/permissions/entity-permissions";

interface CutsTableRowSwipeProps {
  cutId: string;
  cutName: string;
  onEdit?: (cutId: string) => void;
  onDelete?: (cutId: string) => void;
  onRequest?: (cutId: string) => void;
  children: (isActive: boolean) => ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const CutsTableRowSwipeComponent = ({
  cutId,
  cutName,
  onEdit,
  onDelete,
  onRequest,
  children,
  disabled = false,
  style,
}: CutsTableRowSwipeProps) => {
  const { user } = useAuth();
  const canEdit = canEditCuts(user);
  const canDelete = canDeleteCuts(user);

  // Build actions array
  const actions: SwipeAction[] = [
    ...(onRequest
      ? [
          {
            key: "request",
            label: "Solicitar",
            icon: <IconScissors size={20} color="white" />,
            backgroundColor: "#3b82f6", // blue-500
            onPress: () => onRequest(cutId),
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
            onPress: () => onEdit(cutId),
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
            onPress: () => onDelete(cutId),
            closeOnPress: false,
            confirmDelete: true,
          },
        ]
      : []),
  ];

  return (
    <TableRowSwipe
      entityId={cutId}
      entityName={cutName}
      actions={actions}
      canPerformActions={(user) => canEditCuts(user) || canDeleteCuts(user) || !!onRequest}
      style={style}
      disabled={disabled}
      confirmDeleteTitle="Excluir Corte"
    >
      {children}
    </TableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
CutsTableRowSwipeComponent.displayName = "CutsTableRowSwipe";

export const CutsTableRowSwipe = React.memo(CutsTableRowSwipeComponent);
