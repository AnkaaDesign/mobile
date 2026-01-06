import React from "react";
import { ViewStyle, StyleProp } from "react-native";
import { IconEdit, IconTrash, IconPlayerPlay, IconCheck, IconRuler } from "@tabler/icons-react-native";
import { TableRowSwipe, SwipeAction } from "@/components/common/table-row-swipe";
import { TASK_STATUS } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import { canEditTasks, canDeleteTasks, canLeaderManageTask, canEditLayoutsOnly } from "@/utils/permissions/entity-permissions";
import { isTeamLeader } from "@/utils/user";

interface TaskTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  taskId: string;
  taskName: string;
  taskStatus: TASK_STATUS;
  taskSectorId: string;
  hasLayout?: boolean;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onStart?: (taskId: string) => void;
  onFinish?: (taskId: string) => void;
  onEditLayout?: (taskId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const TaskTableRowSwipeComponent = ({
  children,
  taskId,
  taskName,
  taskStatus,
  taskSectorId,
  hasLayout = false,
  onEdit,
  onDelete,
  onStart,
  onFinish,
  onEditLayout,
  style,
  disabled = false,
}: TaskTableRowSwipeProps) => {
  const { user } = useAuth();

  // Permission checks
  // Note: Team leadership is now determined by managedSector relationship (user.managedSector?.id)
  const userIsTeamLeader = isTeamLeader(user);
  const canEdit = canEditTasks(user); // ADMIN, DESIGNER, FINANCIAL, LOGISTIC
  const canDelete = canDeleteTasks(user); // ADMIN only
  const canLeaderManage = userIsTeamLeader && canLeaderManageTask(user, taskSectorId);
  const canEditLayoutOnly = canEditLayoutsOnly(user); // Team leaders, LOGISTIC only (not ADMIN)

  // Build actions array based on user role and task status
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

  // Layout Edit action - available to team leaders and LOGISTIC only
  // ADMIN can edit layouts via the regular edit page, so they don't need this action
  if (onEditLayout && canEditLayoutOnly) {
    actions.push({
      key: "layout",
      label: hasLayout ? "Editar Layout" : "Add Layout",
      icon: <IconRuler size={20} color="white" />,
      backgroundColor: "#8b5cf6", // violet-500
      onPress: () => onEditLayout(taskId),
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

  // Team leaders: Can start/finish tasks in their managed sector OR tasks without sector
  if (canLeaderManage) {
    // Show "Start" button if task is WAITING_PRODUCTION
    if (taskStatus === TASK_STATUS.WAITING_PRODUCTION && onStart) {
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
    <TableRowSwipe
      entityId={taskId}
      entityName={taskName}
      actions={actions}
      canPerformActions={(user) => canEditTasks(user) || canDeleteTasks(user) || canEditLayoutsOnly(user) || (isTeamLeader(user) && canLeaderManageTask(user, taskSectorId))}
      style={style}
      disabled={disabled}
    >
      {children}
    </TableRowSwipe>
  );
};

// Set displayName before memoization for React 19 compatibility
TaskTableRowSwipeComponent.displayName = "TaskTableRowSwipe";

export const TaskTableRowSwipe = React.memo(TaskTableRowSwipeComponent);
