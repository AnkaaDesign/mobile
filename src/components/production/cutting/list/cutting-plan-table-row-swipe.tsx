import React, { useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, ViewStyle, Alert, StyleProp } from "react-native";
import { IconEdit, IconTrash, IconPlayerPlay, IconCheck } from "@tabler/icons-react-native";

import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { ReanimatedSwipeableRow,} from "@/components/ui/reanimated-swipeable-row";
import { CUT_STATUS } from "@/constants";

const ACTION_WIDTH = 80;

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
  disabled = false
}: CuttingPlanTableRowSwipeProps) => {
  const { colors } = useTheme();
  const { activeRowId, setActiveRowId, closeActiveRow, setOpenRow, closeOpenRow } = useSwipeRow();
  const swipeableRef = useRef<Swipeable>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Early return if colors are not available yet (during theme initialization)
  if (!colors || !children) {
    return <View style={style}>{typeof children === "function" ? children(false) : children}</View>;
  }

  const isThisRowActive = activeRowId === cutId;

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
      if (activeRowId === cutId) {
        setActiveRowId(null);
      }
    };
  }, [activeRowId, cutId, setActiveRowId]);

  const handleDeletePress = useCallback(() => {
    Alert.alert("Confirmar exclusão", `Tem certeza que deseja excluir este corte?`, [
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
          setTimeout(() => onDelete?.(cutId), 300);
        },
      },
    ]);
  }, [cutId, onDelete]);

  // Build actions array based on cut status and available handlers
  const rightActions: SwipeAction[] = [];

  // Status change actions based on current status
  if (onStatusChange) {
    switch (cutStatus) {
      case CUT_STATUS.PENDING:
        rightActions.push({
          key: "start",
          label: "Iniciar",
          icon: <IconPlayerPlay size={20} color="white" />,
          backgroundColor: "#15803d", // green-700
          onPress: () => onStatusChange(cutId, CUT_STATUS.CUTTING),
          closeOnPress: true,
        });
        break;
      case CUT_STATUS.CUTTING:
        rightActions.push({
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
    rightActions.push({
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
    (_direction: "left" | "right") => {
      // Clear any existing timer
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }

      // Close any other active row first
      if (activeRowId && activeRowId !== cutId) {
        closeActiveRow();
        closeOpenRow(); // Also close legacy rows
      }
    },
    [activeRowId, cutId, closeActiveRow, closeOpenRow],
  );

  const handleOpen = useCallback(
    (_direction: "left" | "right", swipeable: Swipeable) => {
      setActiveRowId(cutId);

      // Register the close function for legacy compatibility
      setOpenRow(() => swipeable.close());

      // Auto-close after 5 seconds
      autoCloseTimerRef.current = setTimeout(() => {
        swipeable.close();
      }, 5000);
    },
    [cutId, setActiveRowId, setOpenRow],
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
    console.warn("CuttingPlanTableRowSwipe: children prop is invalid or undefined:", typeof children);
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
CuttingPlanTableRowSwipeComponent.displayName = "CuttingPlanTableRowSwipe";

export const CuttingPlanTableRowSwipe = React.memo(CuttingPlanTableRowSwipeComponent);

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  rowContainer: {
    // The row content container - no special styles needed
  },
});
