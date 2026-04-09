import React, { useRef, useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ViewStyle, Alert, StyleProp } from "react-native";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { useTheme } from "@/lib/theme";
import { useSwipeRowActions } from "@/contexts/swipe-row-context";
import { ReanimatedSwipeableRow } from "@/components/ui/reanimated-swipeable-row";
import { useAuth } from "@/contexts/auth-context";
import type { User } from "@/types/user";

const ACTION_WIDTH = 80;

// Snappy spring config — critically damped (ζ≈1), snaps in ~200ms.
const SNAP_ANIMATION: Record<string, unknown> = {
  mass: 1,
  damping: 40,
  stiffness: 400,
  overshootClamping: true,
};


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
  const { notifyRowOpened, notifyRowClosed } = useSwipeRowActions();
  const swipeableRef = useRef<SwipeableMethods>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();

  // Local open state — only THIS row re-renders when it opens/closes.
  const [isOpen, setIsOpen] = useState(false);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

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

  // Memoize to prevent renderRightActions from being recreated on every render.
  // Without this, ReanimatedSwipeable gets a new renderRightActions prop on
  // every context update, causing it to remount the actions panel.
  const rightActions = useMemo(
    () =>
      actions.map((action) => ({
        key: action.key,
        label: action.label,
        icon: action.icon,
        backgroundColor: action.backgroundColor,
        onPress: createActionHandler(action),
        closeOnPress: action.closeOnPress ?? true,
      })),
    [actions, createActionHandler]
  );

  const handleWillOpen = useCallback(
    (_direction: "left" | "right") => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
      notifyRowOpened(entityId, () => swipeableRef.current?.close());
    },
    [entityId, notifyRowOpened]
  );

  const handleOpen = useCallback(
    (_direction: "left" | "right", swipeable: SwipeableMethods) => {
      setIsOpen(true);
      autoCloseTimerRef.current = setTimeout(() => {
        swipeable.close();
      }, 5000);
    },
    []
  );

  const handleClose = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    setIsOpen(false);
    notifyRowClosed(entityId);
  }, [entityId, notifyRowClosed]);

  // ── Early returns (all hooks are above this line) ─────────────────────────

  if (!colors || !children) {
    return <View style={style}>{typeof children === "function" ? children(false) : children}</View>;
  }

  if (canPerformActions && !canPerformActions(user)) {
    return <View style={style}>{typeof children === "function" ? children(false) : children}</View>;
  }

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
      friction={1}
      rightThreshold={40}
      overshootRight={false}
      onWillOpen={handleWillOpen}
      onOpen={handleOpen}
      onClose={handleClose}
      containerStyle={StyleSheet.flatten([styles.container, style])}
      childrenContainerStyle={styles.rowContainer}
      actionWidth={ACTION_WIDTH}
      animationOptions={SNAP_ANIMATION}
      dragOffsetFromLeftEdge={999}
      dragOffsetFromRightEdge={10}
    >
      <View style={{ flex: 1 }}>{typeof children === "function" ? children(isOpen) : children}</View>
    </ReanimatedSwipeableRow>
  );
};

TableRowSwipeComponent.displayName = "TableRowSwipe";

export const TableRowSwipe = React.memo(TableRowSwipeComponent);

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  rowContainer: {},
});
