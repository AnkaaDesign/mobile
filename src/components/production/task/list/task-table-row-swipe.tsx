import React, { useState, useCallback } from "react";
import { ViewStyle, StyleProp, Alert, ActionSheetIOS, Platform } from "react-native";
import { IconEdit, IconPlayerPlay, IconCheck, IconRuler, IconDotsVertical, IconPhotoPlus, IconClipboardCopy, IconRocket } from "@tabler/icons-react-native";
import { TableRowSwipe, SwipeAction } from "@/components/common/table-row-swipe";
import { TASK_STATUS, SECTOR_PRIVILEGES } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import { canEditTasks, canLeaderManageTask, canEditLayoutsOnly } from "@/utils/permissions/entity-permissions";
import { isTeamLeader, hasAnyPrivilege } from "@/utils";

interface TaskTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  taskId: string;
  taskName: string;
  taskStatus: TASK_STATUS;
  taskSectorId: string;
  hasLayout?: boolean;
  onEdit?: (taskId: string) => void;
  onStart?: (taskId: string) => void;
  onFinish?: (taskId: string) => void;
  onEditLayout?: (taskId: string) => void;
  // New actions matching web context menu
  onRelease?: (taskId: string) => void;
  onAddArtworks?: (taskId: string) => void;
  onCopyFromTask?: (taskId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

// Permission helpers matching web task context menu
const canRelease = (user: any) => {
  // Liberar: ADMIN, LOGISTIC, COMMERCIAL (matches web canLiberar)
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.LOGISTIC,
    SECTOR_PRIVILEGES.COMMERCIAL,
  ]);
};

const canAccessAdvancedMenu = (user: any) => {
  // Advanced menu: ADMIN, COMMERCIAL, FINANCIAL, LOGISTIC (matches web canAccessAdvancedMenu)
  return hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.LOGISTIC,
  ]);
};

const canViewLayout = (user: any) => {
  // Layout: ADMIN, LOGISTIC, or Team Leaders
  const privilege = user?.sector?.privileges;
  return privilege === SECTOR_PRIVILEGES.ADMIN ||
         privilege === SECTOR_PRIVILEGES.LOGISTIC ||
         isTeamLeader(user);
};

const TaskTableRowSwipeComponent = ({
  children,
  taskId,
  taskName,
  taskStatus,
  taskSectorId,
  hasLayout = false,
  onEdit,
  onStart,
  onFinish,
  onEditLayout,
  onRelease,
  onAddArtworks,
  onCopyFromTask,
  style,
  disabled = false,
}: TaskTableRowSwipeProps) => {
  const { user } = useAuth();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Permission checks
  const userIsTeamLeader = isTeamLeader(user);
  const canEdit = canEditTasks(user); // ADMIN, COMMERCIAL, DESIGNER, FINANCIAL, LOGISTIC
  const canLeaderManage = userIsTeamLeader && canLeaderManageTask(user, taskSectorId);
  const canEditLayoutOnly = canEditLayoutsOnly(user); // Team leaders, LOGISTIC only (not ADMIN)
  const userCanRelease = canRelease(user);
  const userCanAccessAdvanced = canAccessAdvancedMenu(user);
  const userCanViewLayout = canViewLayout(user);

  // Check if there are any secondary actions available
  const hasSecondaryActions = (
    (onEditLayout && userCanViewLayout) ||
    (onAddArtworks && userCanAccessAdvanced) ||
    (onCopyFromTask && userCanAccessAdvanced)
  );

  // Handle "More" menu using ActionSheet (iOS) or Alert (Android)
  const showMoreMenu = useCallback(() => {
    const options: { label: string; action: () => void; destructive?: boolean }[] = [];

    // Layout option - ADMIN, LOGISTIC, or Team Leaders
    if (onEditLayout && userCanViewLayout) {
      options.push({
        label: hasLayout ? "Editar Layout" : "Adicionar Layout",
        action: () => onEditLayout(taskId),
      });
    }

    // Artworks option - ADMIN, COMMERCIAL, FINANCIAL, LOGISTIC
    if (onAddArtworks && userCanAccessAdvanced) {
      options.push({
        label: "Adicionar Artes",
        action: () => onAddArtworks(taskId),
      });
    }

    // Copy from Task option - ADMIN, COMMERCIAL, FINANCIAL, LOGISTIC
    if (onCopyFromTask && userCanAccessAdvanced) {
      options.push({
        label: "Copiar de Outra Tarefa",
        action: () => onCopyFromTask(taskId),
      });
    }

    if (options.length === 0) return;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options.map(o => o.label), "Cancelar"],
          cancelButtonIndex: options.length,
          title: taskName,
          message: "Ações avançadas",
        },
        (buttonIndex) => {
          if (buttonIndex < options.length) {
            options[buttonIndex].action();
          }
        }
      );
    } else {
      // Android: Use Alert with buttons
      Alert.alert(
        taskName,
        "Ações avançadas",
        [
          ...options.map(option => ({
            text: option.label,
            onPress: option.action,
          })),
          { text: "Cancelar", style: "cancel" as const },
        ],
        { cancelable: true }
      );
    }
  }, [taskId, taskName, hasLayout, onEditLayout, onAddArtworks, onCopyFromTask, userCanViewLayout, userCanAccessAdvanced]);

  // Build actions array based on user role and task status
  const actions: SwipeAction[] = [];

  // 1. LIBERAR (Release) - Only for PREPARATION tasks
  // Available to: ADMIN, LOGISTIC, COMMERCIAL
  if (onRelease && userCanRelease && taskStatus === TASK_STATUS.PREPARATION) {
    actions.push({
      key: "release",
      label: "Liberar",
      icon: <IconRocket size={20} color="white" />,
      backgroundColor: "#0891b2", // cyan-600
      onPress: () => onRelease(taskId),
      closeOnPress: true,
    });
  }

  // 2. START - For WAITING_PRODUCTION tasks (Team Leaders / ADMIN)
  if (canLeaderManage && taskStatus === TASK_STATUS.WAITING_PRODUCTION && onStart) {
    actions.push({
      key: "start",
      label: "Iniciar",
      icon: <IconPlayerPlay size={20} color="white" />,
      backgroundColor: "#059669", // emerald-600
      onPress: () => onStart(taskId),
      closeOnPress: true,
    });
  }

  // 3. FINISH - For IN_PRODUCTION tasks (Team Leaders / ADMIN)
  if (canLeaderManage && taskStatus === TASK_STATUS.IN_PRODUCTION && onFinish) {
    actions.push({
      key: "finish",
      label: "Finalizar",
      icon: <IconCheck size={20} color="white" />,
      backgroundColor: "#16a34a", // green-600
      onPress: () => onFinish(taskId),
      closeOnPress: true,
    });
  }

  // 4. EDIT - Available to ADMIN, COMMERCIAL, DESIGNER, FINANCIAL, LOGISTIC
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

  // 5. MORE - Shows secondary actions in ActionSheet
  // Available if user has access to any advanced features
  if (hasSecondaryActions) {
    actions.push({
      key: "more",
      label: "Mais",
      icon: <IconDotsVertical size={20} color="white" />,
      backgroundColor: "#6b7280", // gray-500
      onPress: showMoreMenu,
      closeOnPress: true,
    });
  }

  return (
    <TableRowSwipe
      entityId={taskId}
      entityName={taskName}
      actions={actions}
      canPerformActions={(user) =>
        canEditTasks(user) ||
        canEditLayoutsOnly(user) ||
        canRelease(user) ||
        canAccessAdvancedMenu(user) ||
        (isTeamLeader(user) && canLeaderManageTask(user, taskSectorId))
      }
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
