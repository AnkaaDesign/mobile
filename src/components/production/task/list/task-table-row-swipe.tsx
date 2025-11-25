import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash, IconPlayerPlay, IconCheck } from "@tabler/icons-react-native";
import { GenericTableRowSwipe, GenericSwipeAction } from "@/components/common/generic-table-row-swipe";
import { TASK_STATUS, SECTOR_PRIVILEGES } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import { canEditTasks, canDeleteTasks, canLeaderManageTask } from "@/utils/permissions/entity-permissions";

interface TaskTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  taskId: string;
  taskName: string;
  taskStatus: TASK_STATUS;
  taskSectorId: string;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onStart?: (taskId: string) => void;
  onFinish?: (taskId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const TaskTableRowSwipeComponent = ({
  children,
  taskId,
  taskName,
  taskStatus,
  taskSectorId,
  onEdit,
  onDelete,
  onStart,
  onFinish,
  style,
  disabled = false,
}: TaskTableRowSwipeProps) => {
  const { user } = useAuth();

  // Permission checks
  const isLeader = user?.sector?.privileges === SECTOR_PRIVILEGES.LEADER;
  const canEdit = canEditTasks(user); // ADMIN, DESIGNER, FINANCIAL, LOGISTIC
  const canDelete = canDeleteTasks(user); // ADMIN only
  const canLeaderManage = isLeader && canLeaderManageTask(user, taskSectorId);

  // Build actions array based on user role and task status
  const actions: GenericSwipeAction[] = [];

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

  // Delete action - ADMIN only
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

  // LEADER: Can start/finish tasks in their sector OR tasks without sector
  if (canLeaderManage) {
    // Show "Start" button if task is PENDING
    if (taskStatus === TASK_STATUS.PENDING && onStart) {
      actions.push({
        key: "start",
        label: "Iniciar",
        icon: <IconPlayerPlay size={20} color="white" />,
        backgroundColor: "#059669", // emerald-600
        onPress: () => onStart(taskId),
        closeOnPress: true,
      });
    }

    // Show "Finish" button if task is IN_PRODUCTION
    if (taskStatus === TASK_STATUS.IN_PRODUCTION && onFinish) {
      actions.push({
        key: "finish",
        label: "Finalizar",
        icon: <IconCheck size={20} color="white" />,
        backgroundColor: "#16a34a", // green-600
        onPress: () => onFinish(taskId),
        closeOnPress: true,
      });
    }
  }

  return (
    <GenericTableRowSwipe
      entityId={taskId}
      entityName={taskName}
      actions={actions}
      canPerformActions={(user) => canEditTasks(user) || canDeleteTasks(user) || (isLeader && canLeaderManageTask(user, taskSectorId))}
      style={style}
      disabled={disabled}
    >
      {children}
    </GenericTableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
TaskTableRowSwipeComponent.displayName = "TaskTableRowSwipe";

export const TaskTableRowSwipe = React.memo(TaskTableRowSwipeComponent);
