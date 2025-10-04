import React, { useRef, useContext, useEffect } from "react";
import { Animated, StyleSheet, View, I18nManager } from "react-native";
import { PanGestureHandler, RectButton } from "react-native-gesture-handler";
import { IconEdit, IconTrash, IconCopy } from "@tabler/icons-react-native";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { ThemedText } from "@/components/ui/themed-text";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";

interface OrderTableRowSwipeProps {
  children: React.ReactNode;
  orderId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  disabled?: boolean;
}

export const OrderTableRowSwipe: React.FC<OrderTableRowSwipeProps> = ({
  children,
  orderId,
  onEdit,
  onDelete,
  onDuplicate,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const { activeRowId, openRowId, closeActiveRow } = useSwipeRow();
  const swipeableRow = useRef<any>(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const { selection } = useHapticFeedback();

  // Close row if another row is opened
  useEffect(() => {
    if (activeRowId && activeRowId !== orderId) {
      swipeableRow.current?.close();
    }
  }, [activeRowId, orderId]);

  // Handle when row becomes active
  const handleSwipeableOpen = () => {
    // openRowId(orderId);
    // selection( "impactLight");
  };

  // Handle when row is closed
  const handleSwipeableClose = () => {
    if (activeRowId === orderId) {
      closeActiveRow();
    }
  };

  const handleEdit = () => {
    swipeableRow.current?.close();
    // selection( "selection");
    onEdit?.();
  };

  const handleDelete = () => {
    swipeableRow.current?.close();
    // selection( "notificationWarning");
    onDelete?.();
  };

  const handleDuplicate = () => {
    swipeableRow.current?.close();
    // selection( "selection");
    onDuplicate?.();
  };

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-200, -100, 0],
      outputRange: [1, 0.9, 0],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.actionsContainer}>
        {onEdit && (
          <Animated.View style={{ transform: [{ scale }] }}>
            <RectButton style={StyleSheet.flatten([styles.actionButton, styles.editButton])} onPress={handleEdit}>
              <IconEdit size={20} color="#fff" />
              <ThemedText style={styles.actionText}>Editar</ThemedText>
            </RectButton>
          </Animated.View>
        )}
        {onDuplicate && (
          <Animated.View style={{ transform: [{ scale }] }}>
            <RectButton style={StyleSheet.flatten([styles.actionButton, styles.duplicateButton])} onPress={handleDuplicate}>
              <IconCopy size={20} color="#fff" />
              <ThemedText style={styles.actionText}>Duplicar</ThemedText>
            </RectButton>
          </Animated.View>
        )}
        {onDelete && (
          <Animated.View style={{ transform: [{ scale }] }}>
            <RectButton style={StyleSheet.flatten([styles.actionButton, styles.deleteButton])} onPress={handleDelete}>
              <IconTrash size={20} color="#fff" />
              <ThemedText style={styles.actionText}>Excluir</ThemedText>
            </RectButton>
          </Animated.View>
        )}
      </View>
    );
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <PanGestureHandler
      onGestureEvent={Animated.event([{ nativeEvent: { translationX: translateX } }], { useNativeDriver: false })}
      onHandlerStateChange={(e) => {
        if (e.nativeEvent.oldState === 4) {
          // Gesture ended
          const { translationX } = e.nativeEvent;
          if (translationX < -80) {
            handleSwipeableOpen();
          } else {
            handleSwipeableClose();
          }
          Animated.spring(translateX, {
            toValue: translationX < -80 ? -200 : 0,
            useNativeDriver: false,
            tension: 100,
            friction: 10,
          }).start();
        }
      }}
    >
      <Animated.View style={{ transform: [{ translateX }] }}>
        {children}
        <Animated.View
          style={[
            styles.rightActionsContainer,
            {
              transform: [
                {
                  translateX: translateX.interpolate({
                    inputRange: [-200, 0],
                    outputRange: [0, 200],
                  }),
                },
              ],
            },
          ]}
        >
          {renderRightActions(
            translateX.interpolate({
              inputRange: [-200, 0],
              outputRange: [1, 0],
            }),
            translateX,
          )}
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingRight: spacing.md,
  },
  rightActionsContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 200,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 64,
    height: "100%",
    paddingHorizontal: spacing.sm,
  },
  editButton: {
    backgroundColor: "#007AFF",
  },
  duplicateButton: {
    backgroundColor: "#FF9500",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  actionText: {
    color: "#fff",
    fontSize: 10,
    marginTop: 4,
  },
});