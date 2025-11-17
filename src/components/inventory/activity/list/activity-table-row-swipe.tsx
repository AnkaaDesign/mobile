import React, { useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, ViewStyle, Alert, StyleProp } from "react-native";
import { IconTrash } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { ReanimatedSwipeableRow,} from "@/components/ui/reanimated-swipeable-row";

const ACTION_WIDTH = 80;

interface ActivityTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  activityId: string;
  activityDescription: string;
  onDelete?: (activityId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const ActivityTableRowSwipeComponent = ({ children, activityId, activityDescription, onDelete, style, disabled = false }: ActivityTableRowSwipeProps) => {
  const { colors } = useTheme();
  const { activeRowId, setActiveRowId, closeActiveRow, setOpenRow, closeOpenRow } = useSwipeRow();
  const swipeableRef = useRef<Swipeable>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Early return if colors are not available yet (during theme initialization)
  if (!colors || !children) {
    return <View style={style}>{typeof children === "function" ? children(false) : children}</View>;
  }

  const isThisRowActive = activeRowId === activityId;

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
      if (activeRowId === activityId) {
        setActiveRowId(null);
      }
    };
  }, [activeRowId, activityId, setActiveRowId]);

  const handleDeletePress = useCallback(() => {
    Alert.alert(
      "Confirmar exclusão",
      `Tem certeza que deseja excluir "${activityDescription}"? Esta ação é irreversível e afetará o estoque.`,
      [
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
            setTimeout(() => onDelete?.(activityId), 300);
          },
        },
      ]
    );
  }, [activityId, activityDescription, onDelete]);

  // Build actions array with colors matching the activity operations
  // Delete button uses critical/out-of-stock red (#ef4444)
  const rightActions: SwipeAction[] = [
    ...(onDelete
      ? [
          {
            key: "delete",
            label: "Excluir",
            icon: <IconTrash size={20} color="white" />,
            backgroundColor: "#ef4444", // red-500 (error color)
            onPress: handleDeletePress,
            closeOnPress: false, // Don't close automatically for delete confirmation
          },
        ]
      : []),
  ];

  const handleWillOpen = useCallback(
    (_direction: "left" | "right") => {
      // Clear any existing timer
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }

      // Close any other active row first
      if (activeRowId && activeRowId !== activityId) {
        closeActiveRow();
        closeOpenRow(); // Also close legacy rows
      }
    },
    [activeRowId, activityId, closeActiveRow, closeOpenRow],
  );

  const handleOpen = useCallback(
    (_direction: "left" | "right", swipeable: Swipeable) => {
      setActiveRowId(activityId);

      // Register the close function for legacy compatibility
      setOpenRow(() => swipeable.close());

      // Auto-close after 5 seconds
      autoCloseTimerRef.current = setTimeout(() => {
        swipeable.close();
      }, 5000);
    },
    [activityId, setActiveRowId, setOpenRow],
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
    console.warn("ActivityTableRowSwipe: children prop is invalid or undefined:", typeof children);
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
ActivityTableRowSwipeComponent.displayName = "ActivityTableRowSwipe";

export const ActivityTableRowSwipe = React.memo(ActivityTableRowSwipeComponent);

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  rowContainer: {
    // The row content container - no special styles needed
  },
});
