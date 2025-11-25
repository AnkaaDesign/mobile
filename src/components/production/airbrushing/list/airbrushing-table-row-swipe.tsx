import React, { ReactNode } from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";
import { useAuth } from "@/contexts/auth-context";
import { canEditAirbrushings, canDeleteAirbrushings } from "@/utils/permissions/entity-permissions";

interface AirbrushingTableRowSwipeProps {
  airbrushingId: string;
  airbrushingName: string;
  onEdit?: (airbrushingId: string) => void;
  onDelete?: (airbrushingId: string) => void;
  children: (isActive: boolean) => ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AirbrushingTableRowSwipeComponent = ({
  airbrushingId,
  airbrushingName,
  onEdit,
  onDelete,
  children,
  disabled = false,
  style,
}: AirbrushingTableRowSwipeProps) => {
  const { user } = useAuth();
  const canEdit = canEditAirbrushings(user);
  const canDelete = canDeleteAirbrushings(user);

  // Build actions array
  const actions: GenericSwipeAction[] = [
    ...(onEdit && canEdit
      ? [
          {
            key: "edit",
            label: "Editar",
            icon: <IconEdit size={20} color="white" />,
            backgroundColor: "#15803d", // green-700
            onPress: () => onEdit(airbrushingId),
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
            onPress: () => onDelete(airbrushingId),
            closeOnPress: false,
            confirmDelete: true,
          },
        ]
      : []),
  ];

  return (
    <GenericTableRowSwipe
      entityId={airbrushingId}
      entityName={airbrushingName}
      actions={actions}
      canPerformActions={(user) => canEditAirbrushings(user) || canDeleteAirbrushings(user)}
      style={style}
      disabled={disabled}
      confirmDeleteTitle="Excluir Airbrushing"
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
AirbrushingTableRowSwipeComponent.displayName = "AirbrushingTableRowSwipe";

export const AirbrushingTableRowSwipe = React.memo(AirbrushingTableRowSwipeComponent);
