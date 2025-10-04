import React, { useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, ViewStyle, Alert } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/contexts/theme-context";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { ReanimatedSwipeableRow, type SwipeAction, type Swipeable } from "@/components/ui/reanimated-swipeable-row";

const ACTION_WIDTH = 80;

interface CustomSwipeAction {
  key: string;
  label: string;
  icon: string;
  backgroundColor: string;
  onPress: () => void;
}

interface ItemTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  itemId: string;
  itemName: string;
  onEdit?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
  customActions?: CustomSwipeAction[];
  style?: ViewStyle;
  disabled?: boolean;
}

const ItemTableRowSwipeComponent = ({ children, itemId, itemName, onEdit, onDelete, customActions = [], style, disabled = false }: ItemTableRowSwipeProps) => {
  const { colors } = useTheme();
  const { activeRowId, setActiveRowId, closeActiveRow, setOpenRow, closeOpenRow } = useSwipeRow();
  const swipeableRef = useRef<Swipeable>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Early return if colors are not available yet (during theme initialization)
  if (!colors || !children) {
    return <View style={style}>{typeof children === "function" ? children(false) : children}</View>;
  }

  const isThisRowActive = activeRowId === itemId;

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
      if (activeRowId === itemId) {
        setActiveRowId(null);
      }
    };
  }, [activeRowId, itemId, setActiveRowId]);

  const handleDeletePress = useCallback(() => {
    Alert.alert("Confirmar exclusão", `Tem certeza que deseja excluir "${itemName}"?`, [
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
          setTimeout(() => onDelete?.(itemId), 300);
        },
      },
    ]);
  }, [itemId, itemName, onDelete]);

  // Build actions array with fallback colors
  const rightActions: SwipeAction[] = [
    ...(onEdit
      ? [
          {
            key: "edit",
            label: "Editar",
            icon: <IconEdit size={20} color="white" />,
            backgroundColor: colors?.primary || "#16a34a",
            onPress: () => onEdit(itemId),
            closeOnPress: true,
          },
        ]
      : []),
    ...customActions.map((action) => ({
      ...action,
      icon: <Icon name={action.icon} size={20} color="white" />,
      closeOnPress: true,
    })),
    ...(onDelete
      ? [
          {
            key: "delete",
            label: "Excluir",
            icon: <IconTrash size={20} color="white" />,
            backgroundColor: colors?.destructive || "#ef4444",
            onPress: handleDeletePress,
            closeOnPress: false, // Don't close automatically for delete confirmation
          },
        ]
      : []),
  ];

  const handleWillOpen = useCallback(
    (direction: "left" | "right") => {
      // Clear any existing timer
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }

      // Close any other active row first
      if (activeRowId && activeRowId !== itemId) {
        closeActiveRow();
        closeOpenRow(); // Also close legacy rows
      }
    },
    [activeRowId, itemId, closeActiveRow, closeOpenRow],
  );

  const handleOpen = useCallback(
    (direction: "left" | "right", swipeable: Swipeable) => {
      setActiveRowId(itemId);

      // Register the close function for legacy compatibility
      setOpenRow(() => swipeable.close());

      // Auto-close after 5 seconds
      autoCloseTimerRef.current = setTimeout(() => {
        swipeable.close();
      }, 5000);
    },
    [itemId, setActiveRowId, setOpenRow],
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
    console.warn("ItemTableRowSwipe: children prop is invalid or undefined:", typeof children);
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
ItemTableRowSwipeComponent.displayName = "ItemTableRowSwipe";

export const ItemTableRowSwipe = React.memo(ItemTableRowSwipeComponent);

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  rowContainer: {
    // The row content container - no special styles needed
  },
});
