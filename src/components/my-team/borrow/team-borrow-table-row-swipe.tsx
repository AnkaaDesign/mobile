import React, { useCallback, useRef } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, Alert } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Icon } from "@/components/ui/icon";
import { ThemedText } from "@/components/ui/themed-text";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { useTheme } from "@/lib/theme";

interface TeamBorrowTableRowSwipeProps {
  borrowId: string;
  borrowName: string;
  onEdit?: (borrowId: string) => void;
  onDelete?: (borrowId: string) => void;
  disabled?: boolean;
  children: (isActive: boolean) => React.ReactNode;
}

export const TeamBorrowTableRowSwipe = React.memo<TeamBorrowTableRowSwipeProps>(
  ({ borrowId, borrowName, onEdit, onDelete, disabled = false, children }) => {
    const { colors } = useTheme();
    const swipeableRef = useRef<Swipeable>(null);
    const { activeRowId, setActiveRowId } = useSwipeRow();
    const isActive = activeRowId === borrowId;

    // Close this row when another row is opened
    React.useEffect(() => {
      if (activeRowId !== borrowId && swipeableRef.current) {
        swipeableRef.current.close();
      }
    }, [activeRowId, borrowId]);

    const handleSwipeOpen = useCallback(() => {
      setActiveRowId(borrowId);
    }, [borrowId, setActiveRowId]);

    const handleEdit = useCallback(() => {
      swipeableRef.current?.close();
      onEdit?.(borrowId);
    }, [borrowId, onEdit]);

    const handleDelete = useCallback(() => {
      Alert.alert(
        "Confirmar Exclusão",
        `Deseja realmente excluir o empréstimo de "${borrowName}"?`,
        [
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => {
              swipeableRef.current?.close();
            },
          },
          {
            text: "Excluir",
            style: "destructive",
            onPress: () => {
              swipeableRef.current?.close();
              onDelete?.(borrowId);
            },
          },
        ],
        { cancelable: true }
      );
    }, [borrowId, borrowName, onDelete]);

    const renderRightActions = useCallback(
      (progress: Animated.AnimatedInterpolation<number>, _dragX: Animated.AnimatedInterpolation<number>) => {
        const trans = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [100, 0],
        });

        return (
          <Animated.View
            style={[
              styles.actionsContainer,
              {
                transform: [{ translateX: trans }],
              },
            ]}
          >
            {onEdit && (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleEdit} activeOpacity={0.7}>
                <Icon name="edit" size="sm" color="#FFFFFF" />
                <ThemedText style={styles.actionText}>Editar</ThemedText>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.destructive }]} onPress={handleDelete} activeOpacity={0.7}>
                <Icon name="trash" size="sm" color="#FFFFFF" />
                <ThemedText style={styles.actionText}>Excluir</ThemedText>
              </TouchableOpacity>
            )}
          </Animated.View>
        );
      },
      [colors, onEdit, onDelete, handleEdit, handleDelete]
    );

    if (disabled || (!onEdit && !onDelete)) {
      return <>{children(false)}</>;
    }

    return (
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        onSwipeableOpen={handleSwipeOpen}
        overshootRight={false}
        friction={2}
        rightThreshold={40}
      >
        {children(isActive)}
      </Swipeable>
    );
  }
);

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  actionButton: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});

TeamBorrowTableRowSwipe.displayName = "TeamBorrowTableRowSwipe";
