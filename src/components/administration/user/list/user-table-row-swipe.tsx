import React, { useCallback, useRef, useEffect } from "react";
import { View, Animated, StyleSheet, Alert, Pressable } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Icon } from "@/components/ui/icon";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { useAuth } from "@/contexts/auth-context";
import { canEditUsers, canDeleteUsers } from "@/utils/permissions/entity-permissions";

interface UserTableRowSwipeProps {
  userId: string;
  userName: string;
  onEdit?: (userId: string) => void;
  onDelete?: (userId: string) => void;
  onView?: (userId: string) => void;
  disabled?: boolean;
  children: (isActive: boolean) => React.ReactNode;
}

export function UserTableRowSwipe({ userId, userName, onEdit, onDelete, onView, disabled = false, children }: UserTableRowSwipeProps) {
  const { colors } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const { activeRowId, setActiveRowId, closeActiveRow } = useSwipeRow();
  const isActive = activeRowId === userId;
  const { user } = useAuth();
  const canEdit = canEditUsers(user);
  const canDelete = canDeleteUsers(user);

  // Return early if no permissions
  if (!canEdit && !canDelete && !onView) {
    return <>{children(false)}</>;
  }

  // Close this row when another row becomes active
  useEffect(() => {
    if (activeRowId !== userId && swipeableRef.current) {
      swipeableRef.current.close();
    }
  }, [activeRowId, userId]);

  const handleSwipeOpen = useCallback(
    (_direction: "left" | "right") => {
      if (!disabled) {
        setActiveRowId(userId);
      }
    },
    [userId, setActiveRowId, disabled],
  );

  const handleSwipeClose = useCallback(() => {
    if (activeRowId === userId) {
      closeActiveRow();
    }
  }, [activeRowId, userId, closeActiveRow]);

  const handleEdit = useCallback(() => {
    swipeableRef.current?.close();
    setTimeout(() => onEdit?.(userId), 100);
  }, [userId, onEdit]);

  const handleView = useCallback(() => {
    swipeableRef.current?.close();
    setTimeout(() => onView?.(userId), 100);
  }, [userId, onView]);

  const handleDelete = useCallback(() => {
    Alert.alert("Confirmar exclusão", `Tem certeza que deseja excluir ${userName}?`, [
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
          setTimeout(() => onDelete?.(userId), 100);
        },
      },
    ]);
  }, [userId, userName, onDelete]);

  const renderRightActions = useCallback(
    (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      const trans = dragX.interpolate({
        inputRange: [-200, 0],
        outputRange: [0, 200],
        extrapolate: "clamp",
      });

      return (
        <View style={styles.actionsContainer}>
          {onView && (
            <Animated.View
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.primary,
                  transform: [{ translateX: trans }],
                },
              ]}
            >
              <Pressable onPress={handleView} style={styles.actionTouchable}>
                <Icon name="eye" size="md" color="white" />
                <ThemedText style={styles.actionText}>Ver</ThemedText>
              </Pressable>
            </Animated.View>
          )}
          {onEdit && canEdit && (
            <Animated.View
              style={[
                styles.actionButton,
                {
                  backgroundColor: "#3b82f6", // blue-500
                  transform: [{ translateX: trans }],
                },
              ]}
            >
              <Pressable onPress={handleEdit} style={styles.actionTouchable}>
                <Icon name="edit" size="md" color="white" />
                <ThemedText style={styles.actionText}>Editar</ThemedText>
              </Pressable>
            </Animated.View>
          )}
          {onDelete && canDelete && (
            <Animated.View
              style={[
                styles.actionButton,
                {
                  backgroundColor: "#ef4444", // red-500
                  transform: [{ translateX: trans }],
                },
              ]}
            >
              <Pressable onPress={handleDelete} style={styles.actionTouchable}>
                <Icon name="trash" size="md" color="white" />
                <ThemedText style={styles.actionText}>Excluir</ThemedText>
              </Pressable>
            </Animated.View>
          )}
        </View>
      );
    },
    [colors.primary, onEdit, onDelete, onView, handleEdit, handleDelete, handleView],
  );

  if (disabled || (!onEdit && !onDelete && !onView)) {
    return <>{children(false)}</>;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={(direction) => handleSwipeOpen(direction as "left" | "right")}
      onSwipeableClose={handleSwipeClose}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      {children(isActive)}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  actionButton: {
    width: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  actionTouchable: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});
