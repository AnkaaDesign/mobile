import React, { useCallback, useRef } from "react";
import { View, StyleSheet, Animated, PanResponder, TouchableOpacity, Dimensions, Alert } from "react-native";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing } from "@/constants/design-system";

interface TeamVacationTableRowSwipeProps {
  vacationId: string;
  vacationUserName: string;
  onEdit?: (vacationId: string) => void;
  onDelete?: (vacationId: string) => void;
  children: (isActive: boolean) => React.ReactNode;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = -80;
const ACTION_WIDTH = 70;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const TeamVacationTableRowSwipe: React.FC<TeamVacationTableRowSwipeProps> = ({
  vacationId,
  vacationUserName,
  onEdit,
  onDelete,
  children,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const { activeRowId, setActiveRowId } = useSwipeRow();
  const translateX = useRef(new Animated.Value(0)).current;
  const isActive = activeRowId === vacationId;

  const closeRow = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  }, [translateX]);

  const openRow = useCallback(() => {
    const actionsCount = (onEdit ? 1 : 0) + (onDelete ? 1 : 0);
    const targetValue = -(ACTION_WIDTH * actionsCount);

    Animated.spring(translateX, {
      toValue: targetValue,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  }, [translateX, onEdit, onDelete]);

  React.useEffect(() => {
    if (activeRowId !== vacationId && activeRowId !== null) {
      closeRow();
    }
  }, [activeRowId, vacationId, closeRow]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !disabled && (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5);
      },
      onPanResponderGrant: () => {
        if (!disabled) {
          translateX.setOffset((translateX as any)._value);
          translateX.setValue(0);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (!disabled) {
          const actionsCount = (onEdit ? 1 : 0) + (onDelete ? 1 : 0);
          const maxSwipe = -(ACTION_WIDTH * actionsCount);
          const newValue = Math.max(maxSwipe, Math.min(0, gestureState.dx));
          translateX.setValue(newValue);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (disabled) return;

        translateX.flattenOffset();

        const actionsCount = (onEdit ? 1 : 0) + (onDelete ? 1 : 0);
        const maxSwipe = -(ACTION_WIDTH * actionsCount);

        if (gestureState.dx < SWIPE_THRESHOLD) {
          setActiveRowId(vacationId);
          openRow();
        } else if (gestureState.dx > -SWIPE_THRESHOLD && isActive) {
          setActiveRowId(null);
          closeRow();
        } else {
          Animated.spring(translateX, {
            toValue: isActive ? maxSwipe : 0,
            useNativeDriver: true,
            speed: 20,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  const handleEdit = useCallback(() => {
    closeRow();
    setTimeout(() => {
      onEdit?.(vacationId);
    }, 250);
  }, [closeRow, onEdit, vacationId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Excluir Férias",
      `Tem certeza que deseja excluir as férias de ${vacationUserName}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            closeRow();
            setTimeout(() => {
              onDelete?.(vacationId);
            }, 250);
          },
        },
      ]
    );
  }, [closeRow, onDelete, vacationId, vacationUserName]);

  return (
    <View style={styles.container}>
      {/* Action buttons behind */}
      <View style={[styles.actionsContainer, { backgroundColor: colors.muted }]}>
        {onEdit && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <Icon name="pencil" size="md" color={colors.primaryForeground} />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.destructive }]}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Icon name="trash" size="md" color={colors.destructiveForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Swipeable content */}
      <Animated.View
        style={[
          styles.swipeableContent,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children(isActive)}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  actionsContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  actionButton: {
    width: ACTION_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  swipeableContent: {
    backgroundColor: "transparent",
  },
});
