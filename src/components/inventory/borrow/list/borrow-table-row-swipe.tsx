import React, { useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, ViewStyle, Alert, StyleProp } from "react-native";
import { IconEdit, IconTrash, IconCheck, IconAlertTriangle } from "@tabler/icons-react-native";
import { useTheme } from "@/contexts/theme-context";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { ReanimatedSwipeableRow,} from "@/components/ui/reanimated-swipeable-row";
import { BORROW_STATUS } from "@/constants";

const ACTION_WIDTH = 80;

interface BorrowTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  borrowId: string;
  borrowDescription: string;
  status: string;
  onEdit?: (borrowId: string) => void;
  onDelete?: (borrowId: string) => void;
  onReturn?: (borrowId: string) => void;
  onMarkAsLost?: (borrowId: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const BorrowTableRowSwipeComponent = ({
  children,
  borrowId,
  borrowDescription,
  status,
  onEdit,
  onDelete,
  onReturn,
  onMarkAsLost,
  style,
  disabled = false
}: BorrowTableRowSwipeProps) => {
  const { colors } = useTheme();
  const { activeRowId, setActiveRowId, closeActiveRow, setOpenRow, closeOpenRow } = useSwipeRow();
  const swipeableRef = useRef<Swipeable>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Early return if colors are not available yet (during theme initialization)
  if (!colors || !children) {
    return <View style={style}>{typeof children === "function" ? children(false) : children}</View>;
  }

  const isThisRowActive = activeRowId === borrowId;

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
      if (activeRowId === borrowId) {
        setActiveRowId(null);
      }
    };
  }, [activeRowId, borrowId, setActiveRowId]);

  const handleReturnPress = useCallback(() => {
    Alert.alert(
      "Devolver Item",
      `Confirma a devolução de "${borrowDescription}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => swipeableRef.current?.close(),
        },
        {
          text: "Devolver",
          style: "default",
          onPress: () => {
            swipeableRef.current?.close();
            setTimeout(() => onReturn?.(borrowId), 300);
          },
        },
      ]
    );
  }, [borrowId, borrowDescription, onReturn]);

  const handleMarkAsLostPress = useCallback(() => {
    Alert.alert(
      "Marcar como Perdido",
      `Deseja marcar "${borrowDescription}" como perdido? Esta ação é irreversível.`,
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => swipeableRef.current?.close(),
        },
        {
          text: "Marcar como Perdido",
          style: "destructive",
          onPress: () => {
            swipeableRef.current?.close();
            setTimeout(() => onMarkAsLost?.(borrowId), 300);
          },
        },
      ]
    );
  }, [borrowId, borrowDescription, onMarkAsLost]);

  const handleDeletePress = useCallback(() => {
    Alert.alert(
      "Confirmar exclusão",
      `Tem certeza que deseja excluir o empréstimo de "${borrowDescription}"?`,
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
            setTimeout(() => onDelete?.(borrowId), 300);
          },
        },
      ]
    );
  }, [borrowId, borrowDescription, onDelete]);

  // Build actions array with colors matching borrow status
  // Return button uses success green (#10b981)
  // Lost button uses warning amber (#f59e0b)
  // Edit button uses optimal stock green (#15803d from items)
  // Delete button uses critical/out-of-stock red (#b91c1c from items)
  const rightActions: SwipeAction[] = [];

  // Add return and mark as lost actions only for active borrows
  if (status === BORROW_STATUS.ACTIVE) {
    if (onReturn) {
      rightActions.push({
        key: "return",
        label: "Devolver",
        icon: <IconCheck size={20} color="white" />,
        backgroundColor: "#10b981", // green-500 (success)
        onPress: handleReturnPress,
        closeOnPress: false, // Don't close automatically for confirmation
      });
    }
    if (onMarkAsLost) {
      rightActions.push({
        key: "lost",
        label: "Perdido",
        icon: <IconAlertTriangle size={20} color="white" />,
        backgroundColor: "#f59e0b", // amber-500 (warning)
        onPress: handleMarkAsLostPress,
        closeOnPress: false, // Don't close automatically for confirmation
      });
    }
  }

  // Add edit action if provided
  if (onEdit) {
    rightActions.push({
      key: "edit",
      label: "Editar",
      icon: <IconEdit size={20} color="white" />,
      backgroundColor: "#15803d", // green-700 (optimal stock color)
      onPress: () => onEdit(borrowId),
      closeOnPress: true,
    });
  }

  // Add delete action if provided
  if (onDelete) {
    rightActions.push({
      key: "delete",
      label: "Excluir",
      icon: <IconTrash size={20} color="white" />,
      backgroundColor: "#b91c1c", // red-700 (out of stock/critical color)
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
      if (activeRowId && activeRowId !== borrowId) {
        closeActiveRow();
        closeOpenRow(); // Also close legacy rows
      }
    },
    [activeRowId, borrowId, closeActiveRow, closeOpenRow],
  );

  const handleOpen = useCallback(
    (_direction: "left" | "right", swipeable: Swipeable) => {
      setActiveRowId(borrowId);

      // Register the close function for legacy compatibility
      setOpenRow(() => swipeable.close());

      // Auto-close after 5 seconds
      autoCloseTimerRef.current = setTimeout(() => {
        swipeable.close();
      }, 5000);
    },
    [borrowId, setActiveRowId, setOpenRow],
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
    console.warn("BorrowTableRowSwipe: children prop is invalid or undefined:", typeof children);
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
BorrowTableRowSwipeComponent.displayName = "BorrowTableRowSwipe";

export const BorrowTableRowSwipe = React.memo(BorrowTableRowSwipeComponent);

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  rowContainer: {
    // The row content container - no special styles needed
  },
});
