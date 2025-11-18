import React, { useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, ViewStyle, StyleProp, Alert } from "react-native";
import { IconCheck, IconX, IconTrash } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { ReanimatedSwipeableRow,} from "@/components/ui/reanimated-swipeable-row";
import { useAuth } from "@/contexts/auth-context";
import { canDeleteUsers } from "@/utils/permissions/entity-permissions";

const ACTION_WIDTH = 80;

interface NotificationTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  notificationId: string;
  notificationTitle: string;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAsUnread?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const NotificationTableRowSwipeComponent = ({
  children,
  notificationId,
  notificationTitle,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  style,
  disabled = false,
}: NotificationTableRowSwipeProps) => {
  const { colors } = useTheme();
  const { activeRowId, setActiveRowId, closeActiveRow, setOpenRow, closeOpenRow } = useSwipeRow();
  const swipeableRef = useRef<Swipeable>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  // Early return if colors are not available yet (during theme initialization)
  if (!colors || !children) {
    return <View style={style}>{typeof children === "function" ? children(false) : children}</View>;
  }

  const canDelete = canDeleteUsers(user);

  // Note: Mark as read/unread are always available for personal notifications

  const isThisRowActive = activeRowId === notificationId;

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
      if (activeRowId === notificationId) {
        setActiveRowId(null);
      }
    };
  }, [activeRowId, notificationId, setActiveRowId]);

  const handleDeletePress = useCallback(() => {
    Alert.alert("Confirmar exclusão", `Tem certeza que deseja excluir a notificação "${notificationTitle}"?`, [
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
          setTimeout(() => onDelete?.(notificationId), 300);
        },
      },
    ]);
  }, [notificationId, notificationTitle, onDelete]);

  // Build actions array with colors matching theme
  const rightActions: SwipeAction[] = [
    ...(onMarkAsRead
      ? [
          {
            key: "markAsRead",
            label: "Lida",
            icon: <IconCheck size={20} color="white" />,
            backgroundColor: "#15803d", // green-700
            onPress: () => onMarkAsRead(notificationId),
            closeOnPress: true,
          },
        ]
      : []),
    ...(onMarkAsUnread
      ? [
          {
            key: "markAsUnread",
            label: "Não lida",
            icon: <IconX size={20} color="white" />,
            backgroundColor: "#ca8a04", // yellow-700
            onPress: () => onMarkAsUnread(notificationId),
            closeOnPress: true,
          },
        ]
      : []),
    ...(canDelete && onDelete
      ? [
          {
            key: "delete",
            label: "Excluir",
            icon: <IconTrash size={20} color="white" />,
            backgroundColor: "#b91c1c", // red-700
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
      if (activeRowId && activeRowId !== notificationId) {
        closeActiveRow();
        closeOpenRow(); // Also close legacy rows
      }
    },
    [activeRowId, notificationId, closeActiveRow, closeOpenRow],
  );

  const handleOpen = useCallback(
    (_direction: "left" | "right", swipeable: Swipeable) => {
      setActiveRowId(notificationId);

      // Register the close function for legacy compatibility
      setOpenRow(() => swipeable.close());

      // Auto-close after 5 seconds
      autoCloseTimerRef.current = setTimeout(() => {
        swipeable.close();
      }, 5000);
    },
    [notificationId, setActiveRowId, setOpenRow],
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
    console.warn("NotificationTableRowSwipe: children prop is invalid or undefined:", typeof children);
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
NotificationTableRowSwipeComponent.displayName = "NotificationTableRowSwipe";

export const NotificationTableRowSwipe = React.memo(NotificationTableRowSwipeComponent);

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  rowContainer: {
    // The row content container - no special styles needed
  },
});
