import React, { useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, ViewStyle, Alert, StyleProp } from "react-native";
import { IconEdit, IconTrash, IconBuildingFactory2, IconProgressCheck } from "@tabler/icons-react-native";

import { useTheme } from "@/contexts/theme-context";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { ReanimatedSwipeableRow,} from "@/components/ui/reanimated-swipeable-row";
import { TASK_STATUS } from "@/constants";

const ACTION_WIDTH = 80;

interface TaskTableRowSwipeProps {
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

const TaskTableRowSwipeComponent = ({
  children,
  taskId,
  taskName,
  taskStatus,
  onEdit,
  onDelete,
  onSetSector,
  onSetStatus,
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

  // Build actions array based on available handlers
  const rightActions: SwipeAction[] = [];

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

  // Set Sector action
  if (onSetSector) {
    rightActions.push({
      key: "setSector",
      label: "Setor",
      icon: <IconBuildingFactory2 size={20} color="white" />,
      backgroundColor: "#7c3aed", // purple-600
      onPress: () => {
        swipeableRef.current?.close();
        setTimeout(() => onSetSector(taskId), 300);
      },
      closeOnPress: true,
    });
  }

  // Set Status action
  if (onSetStatus) {
    rightActions.push({
      key: "setStatus",
      label: "Status",
      icon: <IconProgressCheck size={20} color="white" />,
      backgroundColor: "#059669", // emerald-600
      onPress: () => {
        swipeableRef.current?.close();
        setTimeout(() => onSetStatus(taskId), 300);
      },
      closeOnPress: true,
    });
  }

  const handleWillOpen = useCallback(
    (_direction: "left" | "right") => {
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
    (_direction: "left" | "right", swipeable: Swipeable) => {
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
      containerStyle={StyleSheet.flatten([styles.container, style])}
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
