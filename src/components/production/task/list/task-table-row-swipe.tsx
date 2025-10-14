import React, { useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, ViewStyle, Alert } from "react-native";
import { IconEdit, IconTrash, IconPlayerPlay, IconPlayerPause, IconCheck, IconX } from "@tabler/icons-react-native";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/contexts/theme-context";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { ReanimatedSwipeableRow, type SwipeAction, type Swipeable } from "@/components/ui/reanimated-swipeable-row";
import { TASK_STATUS } from '../../../../constants';

const ACTION_WIDTH = 80;

interface TaskTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  taskId: string;
  taskName: string;
  taskStatus: TASK_STATUS;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TASK_STATUS) => void;
  style?: ViewStyle;
  disabled?: boolean;
}

const TaskTableRowSwipeComponent = ({
  children,
  taskId,
  taskName,
  taskStatus,
  onEdit,
  onDelete,
  onStatusChange,
  style,
  disabled = false
}: TaskTableRowSwipeProps) => {
  const { colors } = useTheme();
  const { activeRowId, setActiveRowId, closeActiveRow, setOpenRow, closeOpenRow } = useSwipeRow();
  const swipeableRef = useRef<Swipeable>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Early return if colors are not available yet (during theme initialization)
  if (!colors || !children) {
    return <View style={style}>{typeof children === "function" ? children(false) : children}</View>;
  }

  const isThisRowActive = activeRowId === taskId;

  // Watch for changes in activeRowId to close this row if another row becomes active
  useEffect(() => {
    if (!isThisRowActive && activeRowId !== null) {
      // Another row became active, close this one immediately
      swipeableRef.current?.close();
    }
  }, [activeRowId, isThisRowActive]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
      // Clean up if this row was active
      if (activeRowId === taskId) {
        setActiveRowId(null);
      }
    };
  }, [activeRowId, taskId, setActiveRowId]);

  const handleDeletePress = useCallback(() => {
    Alert.alert("Confirmar exclusão", `Tem certeza que deseja excluir "${taskName}"?`, [
      {
        text: "Cancelar",
        style: "cancel",
        onPress: () => swipeableRef.current?.close(),
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          swipeableRef.current?.close();
          setTimeout(() => onDelete?.(taskId), 300);
        },
      },
    ]);
  }, [taskId, taskName, onDelete]);

  // Build actions array based on task status and available handlers
  const rightActions: SwipeAction[] = [];

  // Status change actions based on current status
  if (onStatusChange) {
    switch (taskStatus) {
      case TASK_STATUS.PENDING:
        rightActions.push({
          key: "start",
          label: "Iniciar",
          icon: <IconPlayerPlay size={20} color="white" />,
          backgroundColor: "#15803d", // green-700
          onPress: () => onStatusChange(taskId, TASK_STATUS.IN_PRODUCTION),
          closeOnPress: true,
        });
        break;
      case TASK_STATUS.IN_PRODUCTION:
        rightActions.push({
          key: "pause",
          label: "Pausar",
          icon: <IconPlayerPause size={20} color="white" />,
          backgroundColor: "#f59e0b", // amber-500
          onPress: () => onStatusChange(taskId, TASK_STATUS.ON_HOLD),
          closeOnPress: true,
        });
        rightActions.push({
          key: "complete",
          label: "Concluir",
          icon: <IconCheck size={20} color="white" />,
          backgroundColor: "#15803d", // green-700
          onPress: () => onStatusChange(taskId, TASK_STATUS.COMPLETED),
          closeOnPress: true,
        });
        break;
      case TASK_STATUS.ON_HOLD:
        rightActions.push({
          key: "resume",
          label: "Retomar",
          icon: <IconPlayerPlay size={20} color="white" />,
          backgroundColor: "#15803d", // green-700
          onPress: () => onStatusChange(taskId, TASK_STATUS.IN_PRODUCTION),
          closeOnPress: true,
        });
        break;
      default:
        break;
    }

    // Add cancel action for non-completed/cancelled tasks
    if (taskStatus !== TASK_STATUS.COMPLETED && taskStatus !== TASK_STATUS.CANCELLED) {
      rightActions.push({
        key: "cancel",
        label: "Cancelar",
        icon: <IconX size={20} color="white" />,
        backgroundColor: "#dc2626", // red-600
        onPress: () => onStatusChange(taskId, TASK_STATUS.CANCELLED),
        closeOnPress: true,
      });
    }
  }

  // Edit action
  if (onEdit) {
    rightActions.push({
      key: "edit",
      label: "Editar",
      icon: <IconEdit size={20} color="white" />,
      backgroundColor: "#3b82f6", // blue-500
      onPress: () => onEdit(taskId),
      closeOnPress: true,
    });
  }

  // Delete action
  if (onDelete) {
    rightActions.push({
      key: "delete",
      label: "Excluir",
      icon: <IconTrash size={20} color="white" />,
      backgroundColor: "#b91c1c", // red-700
      onPress: handleDeletePress,
      closeOnPress: false, // Don't close automatically for delete confirmation
    });
  }

  const handleWillOpen = useCallback(
    (direction: "left" | "right") => {
      // Clear any existing timer
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }

      // Close any other active row first
      if (activeRowId && activeRowId !== taskId) {
        closeActiveRow();
        closeOpenRow(); // Also close legacy rows
      }
    },
    [activeRowId, taskId, closeActiveRow, closeOpenRow],
  );

  const handleOpen = useCallback(
    (direction: "left" | "right", swipeable: Swipeable) => {
      setActiveRowId(taskId);

      // Register the close function for legacy compatibility
      setOpenRow(() => swipeable.close());

      // Auto-close after 5 seconds
      autoCloseTimerRef.current = setTimeout(() => {
        swipeable.close();
      }, 5000);
    },
    [taskId, setActiveRowId, setOpenRow],
  );

  const handleClose = useCallback(() => {
    // Clear any auto-close timer
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }

    // Clear active row state if this was the active row
    if (isThisRowActive) {
      setActiveRowId(null);
    }
  }, [isThisRowActive, setActiveRowId]);

  // Ensure children is always defined and is a valid React element or function
  if (!children || (typeof children !== "object" && typeof children !== "string" && typeof children !== "number" && typeof children !== "function")) {
    console.warn("TaskTableRowSwipe: children prop is invalid or undefined:", typeof children);
    return <View style={style} />;
  }

  if (disabled || rightActions.length === 0) {
    return <View style={style}>{typeof children === "function" ? children(false) : children}</View>;
  }

  return (
    <ReanimatedSwipeableRow
      ref={swipeableRef}
      rightActions={rightActions}
      enabled={!disabled}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      onWillOpen={handleWillOpen}
      onOpen={handleOpen}
      onClose={handleClose}
      containerStyle={[styles.container, style]}
      childrenContainerStyle={styles.rowContainer}
      actionWidth={ACTION_WIDTH}
    >
      <View style={{ flex: 1 }}>{typeof children === "function" ? children(isThisRowActive) : children}</View>
    </ReanimatedSwipeableRow>
  );
};

// Set displayName before memoization for React 19 compatibility
TaskTableRowSwipeComponent.displayName = "TaskTableRowSwipe";

export const TaskTableRowSwipe = React.memo(TaskTableRowSwipeComponent);

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  rowContainer: {
    // The row content container - no special styles needed
  },
});
