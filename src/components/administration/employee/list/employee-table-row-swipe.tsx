import React, { useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, ViewStyle, Alert, StyleProp } from "react-native";
import { IconEdit, IconTrash, IconEye } from "@tabler/icons-react-native";
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

interface EmployeeTableRowSwipeProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  employeeId: string;
  employeeName: string;
  onEdit?: (employeeId: string) => void;
  onDelete?: (employeeId: string) => void;
  onView?: (employeeId: string) => void;
  customActions?: CustomSwipeAction[];
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const EmployeeTableRowSwipeComponent = ({
  children,
  employeeId,
  employeeName,
  onEdit,
  onDelete,
  onView,
  customActions = [],
  style,
  disabled = false
}: EmployeeTableRowSwipeProps) => {
  const { colors } = useTheme();
  const { activeRowId, setActiveRowId, closeActiveRow, setOpenRow, closeOpenRow } = useSwipeRow();
  const swipeableRef = useRef<Swipeable>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Early return if colors are not available yet (during theme initialization)
  if (!colors || !children) {
    return <View style={style}>{typeof children === "function" ? children(false) : children}</View>;
  }

  const isThisRowActive = activeRowId === employeeId;

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
      if (activeRowId === employeeId) {
        setActiveRowId(null);
      }
    };
  }, [activeRowId, employeeId, setActiveRowId]);

  const handleDeletePress = useCallback(() => {
    Alert.alert("Confirmar exclusão", `Tem certeza que deseja excluir "${employeeName}"?`, [
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
          setTimeout(() => onDelete?.(employeeId), 300);
        },
      },
    ]);
  }, [employeeId, employeeName, onDelete]);

  // Build actions array with consistent colors
  // View button uses blue (#3b82f6)
  // Edit button uses green (#15803d from optimal stock color)
  // Delete button uses red (#b91c1c from critical/out-of-stock color)
  const rightActions: SwipeAction[] = [
    ...(onView
      ? [
          {
            key: "view",
            label: "Ver",
            icon: <IconEye size={20} color="white" />,
            backgroundColor: "#3b82f6", // blue-500
            onPress: () => onView(employeeId),
            closeOnPress: true,
          },
        ]
      : []),
    ...(onEdit
      ? [
          {
            key: "edit",
            label: "Editar",
            icon: <IconEdit size={20} color="white" />,
            backgroundColor: "#15803d", // green-700 (optimal stock color)
            onPress: () => onEdit(employeeId),
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
            backgroundColor: "#b91c1c", // red-700 (out of stock/critical color)
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
      if (activeRowId && activeRowId !== employeeId) {
        closeActiveRow();
        closeOpenRow(); // Also close legacy rows
      }
    },
    [activeRowId, employeeId, closeActiveRow, closeOpenRow],
  );

  const handleOpen = useCallback(
    (_direction: "left" | "right", swipeable: Swipeable) => {
      setActiveRowId(employeeId);

      // Register the close function for legacy compatibility
      setOpenRow(() => swipeable.close());

      // Auto-close after 5 seconds
      autoCloseTimerRef.current = setTimeout(() => {
        swipeable.close();
      }, 5000);
    },
    [employeeId, setActiveRowId, setOpenRow],
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
    console.warn("EmployeeTableRowSwipe: children prop is invalid or undefined:", typeof children);
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
EmployeeTableRowSwipeComponent.displayName = "EmployeeTableRowSwipe";

export const EmployeeTableRowSwipe = React.memo(EmployeeTableRowSwipeComponent);

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  rowContainer: {
    // The row content container - no special styles needed
  },
});
