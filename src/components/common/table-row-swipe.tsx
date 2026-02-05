import React, { useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, ViewStyle, Alert, StyleProp } from "react-native";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { ReanimatedSwipeableRow } from "@/components/ui/reanimated-swipeable-row";
import { useAuth } from "@/contexts/auth-context";
import type { User } from "@/types/user";

const ACTION_WIDTH = 80;

export interface SwipeAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  backgroundColor: string;
  onPress: () => void;
  closeOnPress?: boolean;
  confirmDelete?: boolean;
  deleteMessage?: string;
}

interface TableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  entityId: string;
  entityName: string;
  actions: SwipeAction[];
  canPerformActions?: (user: User | null) => boolean;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  confirmDeleteTitle?: string;
  confirmDeleteMessage?: string;
}

const TableRowSwipeComponent = ({
  children,
  entityId,
  entityName,
  actions,
  canPerformActions,
  style,
  disabled = false,
  confirmDeleteTitle = "Confirmar exclusão",
  confirmDeleteMessage,
}: TableRowSwipeProps) => {
  const { colors } = useTheme();
  const { activeRowId, setActiveRowId, closeActiveRow, setOpenRow, closeOpenRow } = useSwipeRow();
  const swipeableRef = useRef<SwipeableMethods>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();

  // Early return if colors are not available yet (during theme initialization)
  if (!colors || !children) {
    return <View style={style}>{typeof children === "function" ? children(false) : children}</View>;
  }

  // Return early if no permissions
  if (canPerformActions && !canPerformActions(user)) {
    return <View style={style}>{typeof children === "function" ? children(false) : children}</View>;
  }

  const isThisRowActive = activeRowId === entityId;

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
      if (activeRowId === entityId) {
        setActiveRowId(null);
      }
    };
  }, [activeRowId, entityId, setActiveRowId]);

  const createActionHandler = useCallback(
    (action: SwipeAction) => {
      if (action.confirmDelete) {
        return () => {
          const message = confirmDeleteMessage || `Tem certeza que deseja excluir "${entityName}"?`;
          Alert.alert(confirmDeleteTitle, message, [
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
                setTimeout(() => action.onPress(), 300);
              },
            },
          ]);
        };
      }
      return action.onPress;
    },
    [entityName, confirmDeleteTitle, confirmDeleteMessage]
  );

  // Map generic actions to ReanimatedSwipeableRow format
  const rightActions: SwipeAction[] = actions.map((action) => ({
    key: action.key,
    label: action.label,
    icon: action.icon,
    backgroundColor: action.backgroundColor,
    onPress: createActionHandler(action),
    closeOnPress: action.closeOnPress ?? true,
  }));

  const handleWillOpen = useCallback(
    (_direction: "left" | "right") => {
      // Clear any existing timer
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }

      // Close any other active row first
      if (activeRowId && activeRowId !== entityId) {
        closeActiveRow();
        closeOpenRow(); // Also close legacy rows
      }
    },
    [activeRowId, entityId, closeActiveRow, closeOpenRow]
  );

  const handleOpen = useCallback(
    (_direction: "left" | "right", swipeable: SwipeableMethods) => {
      setActiveRowId(entityId);

      // Register the close function for legacy compatibility
      setOpenRow(() => swipeable.close());

      // Auto-close after 5 seconds
      autoCloseTimerRef.current = setTimeout(() => {
        swipeable.close();
      }, 5000);
    },
    [entityId, setActiveRowId, setOpenRow]
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
  if (
    !children ||
    (typeof children !== "object" &&
      typeof children !== "string" &&
      typeof children !== "number" &&
      typeof children !== "function")
  ) {
    console.warn("GenericTableRowSwipe: children prop is invalid or undefined:", typeof children);
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
TableRowSwipeComponent.displayName = "TableRowSwipe";

export const TableRowSwipe = React.memo(TableRowSwipeComponent);

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  rowContainer: {
    // The row content container - no special styles needed
  },
});
