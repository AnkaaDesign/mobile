import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash, IconPlayerPlay, IconCheck } from "@tabler/icons-react-native";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";
import { CUT_STATUS } from "@/constants";

interface CuttingPlanTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  cutId: string;
  cutStatus: CUT_STATUS;
  onEdit?: (cutId: string) => void;
  onDelete?: (cutId: string) => void;
  onStatusChange?: (cutId: string, status: CUT_STATUS) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const CuttingPlanTableRowSwipeComponent = ({
  children,
  cutId,
  cutStatus,
  onEdit,
  onDelete,
  onStatusChange,
  style,
  disabled = false,
}: CuttingPlanTableRowSwipeProps) => {
  // Build actions array based on cut status and available handlers
  const actions: GenericSwipeAction[] = [];

  // Status change actions based on current status
  if (onStatusChange) {
    switch (cutStatus) {
      case CUT_STATUS.PENDING:
        actions.push({
          key: "start",
          label: "Iniciar",
          icon: <IconPlayerPlay size={20} color="white" />,
          backgroundColor: "#15803d", // green-700
          onPress: () => onStatusChange(cutId, CUT_STATUS.CUTTING),
          closeOnPress: true,
        });
        break;
      case CUT_STATUS.CUTTING:
        actions.push({
          key: "complete",
          label: "Concluir",
          icon: <IconCheck size={20} color="white" />,
          backgroundColor: "#15803d", // green-700
          onPress: () => onStatusChange(cutId, CUT_STATUS.COMPLETED),
          closeOnPress: true,
        });
        break;
      default:
        break;
    }
  }

  // Edit action
  if (onEdit) {
    actions.push({
      key: "edit",
      label: "Editar",
      icon: <IconEdit size={20} color="white" />,
      backgroundColor: "#3b82f6", // blue-500
      onPress: () => onEdit(cutId),
      closeOnPress: true,
    });
  }

  // Delete action
  if (onDelete) {
    actions.push({
      key: "delete",
      label: "Excluir",
      icon: <IconTrash size={20} color="white" />,
      backgroundColor: "#b91c1c", // red-700
      onPress: () => onDelete(cutId),
      closeOnPress: false,
      confirmDelete: true,
    });
  }

  return (
    <GenericTableRowSwipe
      entityId={cutId}
      entityName="este corte"
      actions={actions}
      style={style}
      disabled={disabled}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
CuttingPlanTableRowSwipeComponent.displayName = "CuttingPlanTableRowSwipe";

export const CuttingPlanTableRowSwipe = React.memo(CuttingPlanTableRowSwipeComponent);
