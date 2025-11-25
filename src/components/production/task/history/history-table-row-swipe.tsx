import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash, IconBuildingFactory2, IconProgressCheck } from "@tabler/icons-react-native";
import { TableRowSwipe, SwipeAction } from "@/components/common/table-row-swipe";
import { TASK_STATUS, SECTOR_PRIVILEGES } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import { canEditTasks, canDeleteTasks } from "@/utils/permissions/entity-permissions";

interface HistoryTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  taskId: string;
  taskName: string;
  taskStatus: TASK_STATUS;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onSetSector?: (taskId: string) => void;
  onSetStatus?: (taskId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const HistoryTableRowSwipeComponent = ({
  children,
  taskId,
  taskName,
  taskStatus,
  onEdit,
  onDelete,
  onSetSector,
  onSetStatus,
  style,
  disabled = false,
}: HistoryTableRowSwipeProps) => {
  const { user } = useAuth();

  // Permission checks
  const isAdmin = user?.sector?.privileges === SECTOR_PRIVILEGES.ADMIN;
  const canEdit = canEditTasks(user); // ADMIN, DESIGNER, FINANCIAL, LOGISTIC
  const canDelete = canDeleteTasks(user); // ADMIN only

  // Build actions array based on user permissions
  const actions: SwipeAction[] = [];

  // Edit action - available to ADMIN, DESIGNER, FINANCIAL, LOGISTIC
  // Note: Form will filter which fields they can edit based on their role
  if (onEdit && canEdit) {
    actions.push({
      key: "edit",
      label: "Editar",
      icon: <IconEdit size={20} color="white" />,
      backgroundColor: "#3b82f6", // blue-500
      onPress: () => onEdit(taskId),
      closeOnPress: true,
    });
  }

  // ADMIN-only actions: delete, set sector, set status
  if (isAdmin) {
    // Delete action
    if (onDelete && canDelete) {
      actions.push({
        key: "delete",
        label: "Excluir",
        icon: <IconTrash size={20} color="white" />,
        backgroundColor: "#b91c1c", // red-700
        onPress: () => onDelete(taskId),
        closeOnPress: false,
        confirmDelete: true,
      });
    }

    // Set Sector action
    if (onSetSector) {
      actions.push({
        key: "setSector",
        label: "Setor",
        icon: <IconBuildingFactory2 size={20} color="white" />,
        backgroundColor: "#7c3aed", // purple-600
        onPress: () => onSetSector(taskId),
        closeOnPress: true,
      });
    }

    // Set Status action
    if (onSetStatus) {
      actions.push({
        key: "setStatus",
        label: "Status",
        icon: <IconProgressCheck size={20} color="white" />,
        backgroundColor: "#059669", // emerald-600
        onPress: () => onSetStatus(taskId),
        closeOnPress: true,
      });
    }
  }

  return (
    <TableRowSwipe
      entityId={taskId}
      entityName={taskName}
      actions={actions}
      canPerformActions={(user) => canEditTasks(user) || canDeleteTasks(user)}
      style={style}
      disabled={disabled}
    >
      {children}
    </TableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
HistoryTableRowSwipeComponent.displayName = "HistoryTableRowSwipe";

export const HistoryTableRowSwipe = React.memo(HistoryTableRowSwipeComponent);
