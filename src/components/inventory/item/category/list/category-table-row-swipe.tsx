import React, { useCallback, useRef, useEffect } from "react";
import { Alert, View} from "react-native";
import { IconEdit, IconCopy, IconTrash } from "@tabler/icons-react-native";
import type { ItemCategory } from '../../../../../types';
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { ReanimatedSwipeableRow,} from "@/components/ui/reanimated-swipeable-row";

interface CustomSwipeAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  backgroundColor?: string;
  color?: string;
  onPress: () => void;
  closeOnPress?: boolean;
}

interface CategoryTableRowSwipeProps {
  category: ItemCategory;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  customActions?: CustomSwipeAction[];
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  childrenContainerStyle?: ViewStyle;
  actionWidth?: number;
  disabled?: boolean;
}

function CategoryTableRowSwipeComponent({
  category,
  onEdit,
  onDelete,
  onDuplicate,
  customActions = [],
  children,
  style,
  containerStyle,
  childrenContainerStyle,
  actionWidth,
  disabled = false,
}: CategoryTableRowSwipeProps) {
  const { colors } = useTheme();
  const { activeRowId, setActiveRowId, closeActiveRow, setOpenRow, closeOpenRow } = useSwipeRow();
  const swipeableRef = useRef<Swipeable | null>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const categoryId = category.id;

  // Prevent rendering issues during theme initialization
  if (!colors) {
    return <>{children}</>;
  }

  const handleDelete = useCallback(() => {
    Alert.alert("Confirmar exclusão", `Tem certeza que deseja excluir a categoria "${category.name}"?`, [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: onDelete,
      },
    ]);
  }, [category.name, onDelete]);

  // Track if this row is the active one
  const isThisRowActive = activeRowId === categoryId;

  // Close this row when another row becomes active
  useEffect(() => {
    if (!isThisRowActive && activeRowId !== null && swipeableRef.current) {
      swipeableRef.current.close();
    }
  }, [activeRowId, isThisRowActive]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  // Define swipe actions
  const rightActions: SwipeAction[] = [];

  if (onEdit) {
    rightActions.push({
      key: "edit",
      label: "Editar",
      icon: <IconEdit size={20} color={colors.onPrimary} />,
      backgroundColor: colors.primary,
      color: colors.onPrimary,
      onPress: onEdit,
      closeOnPress: true,
    });
  }

  // Add custom actions in the middle
  if (customActions && customActions.length > 0) {
    customActions.forEach((action) => {
      rightActions.push({
        key: action.key,
        label: action.label,
        icon: action.icon,
        backgroundColor: action.backgroundColor || colors.secondary,
        color: action.color || colors.secondaryForeground,
        onPress: action.onPress,
        closeOnPress: action.closeOnPress !== false,
      });
    });
  }

  if (onDuplicate) {
    rightActions.push({
      key: "duplicate",
      label: "Duplicar",
      icon: <IconCopy size={20} color={colors.secondaryForeground} />,
      backgroundColor: colors.secondary,
      color: colors.secondaryForeground,
      onPress: onDuplicate,
      closeOnPress: true,
    });
  }

  if (onDelete) {
    rightActions.push({
      key: "delete",
      label: "Excluir",
      icon: <IconTrash size={20} color={colors.onError} />,
      backgroundColor: colors.error,
      color: colors.onError,
      onPress: handleDelete,
      closeOnPress: true,
    });
  }

  const handleWillOpen = useCallback(
    (_direction: "left" | "right") => {
      // Close any other open rows
      if (activeRowId && activeRowId !== categoryId) {
        closeActiveRow();
        closeOpenRow(); // Also close legacy rows
      }
      // Set this row as the active one
      setActiveRowId(categoryId);
    },
    [categoryId, activeRowId, setActiveRowId, closeActiveRow, closeOpenRow],
  );

  const handleClose = useCallback(() => {
    // Clear active row if it's this one
    if (activeRowId === categoryId) {
      setActiveRowId(null);
    }
    // Clear auto-close timer
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, [activeRowId, categoryId, setActiveRowId]);

  const handleOpen = useCallback(
    (_direction: "left" | "right", swipeable: Swipeable) => {
      // Store reference to the swipeable
      swipeableRef.current = swipeable;
      // Store the close function for legacy compatibility
      setOpenRow(() => swipeable.close());

      // Auto-close after 5 seconds
      autoCloseTimerRef.current = setTimeout(() => {
        swipeable.close();
      }, 5000);
    },
    [setOpenRow],
  );

  // Don't render swipeable if disabled or no actions
  if (disabled || rightActions.length === 0) {
    return <View style={style}>{children as React.ReactNode}</View>;
  }

  // Early return if children is null or undefined
  if (!children) {
    return null;
  }

  return (
    <ReanimatedSwipeableRow
      ref={swipeableRef}
      rightActions={rightActions}
      onWillOpen={handleWillOpen}
      onClose={handleClose}
      onOpen={handleOpen}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      enableTrackpadTwoFingerGesture={false}
      containerStyle={containerStyle}
      childrenContainerStyle={childrenContainerStyle}
      actionWidth={actionWidth}
      enabled={!disabled}
    >
      <View style={{ flex: 1 }}>{typeof children === "function" ? children(isThisRowActive) : children}</View>
    </ReanimatedSwipeableRow>
  );
}

export const CategoryTableRowSwipe = React.memo(CategoryTableRowSwipeComponent);
