import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { ThemedText } from "@/components/ui/themed-text";

interface TeamPpeDeliveryTableRowSwipeProps {
  deliveryId: string;
  deliveryName: string;
  children: (isActive: boolean) => React.ReactNode;
  onEdit?: (deliveryId: string) => void;
  onDelete?: (deliveryId: string) => void;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 70;

export const TeamPpeDeliveryTableRowSwipe: React.FC<TeamPpeDeliveryTableRowSwipeProps> = ({
  deliveryId,
  deliveryName,
  children,
  onEdit,
  onDelete,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const { activeRowId, setActiveRowId, closeActiveRow } = useSwipeRow();
  const translateX = useSharedValue(0);
  const isActive = activeRowId === deliveryId;

  // Close this row if another row is opened
  React.useEffect(() => {
    if (activeRowId !== deliveryId && translateX.value !== 0) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
    }
  }, [activeRowId, deliveryId, translateX]);

  const handleEdit = useCallback(() => {
    closeActiveRow();
    if (onEdit) {
      onEdit(deliveryId);
    }
  }, [deliveryId, onEdit, closeActiveRow]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Confirmar Exclusão",
      `Deseja realmente excluir a entrega para ${deliveryName}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => closeActiveRow(),
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            closeActiveRow();
            if (onDelete) {
              onDelete(deliveryId);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [deliveryId, deliveryName, onDelete, closeActiveRow]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .activeOffsetX([-10, 10])
        .onUpdate((event) => {
          // Only allow swiping left (negative values)
          if (event.translationX < 0) {
            const maxSwipe = -(ACTION_WIDTH * 2);
            translateX.value = Math.max(maxSwipe, event.translationX);
          } else if (translateX.value < 0) {
            // Allow closing swipe by swiping right
            translateX.value = Math.min(0, translateX.value + event.translationX);
          }
        })
        .onEnd((event) => {
          if (event.translationX < -SWIPE_THRESHOLD) {
            // Swipe left to open
            translateX.value = withSpring(-(ACTION_WIDTH * 2), {
              damping: 20,
              stiffness: 300,
            });
            runOnJS(setActiveRowId)(deliveryId);
          } else {
            // Close
            translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
            runOnJS(closeActiveRow)();
          }
        }),
    [disabled, deliveryId, translateX, setActiveRowId, closeActiveRow]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureHandlerRootView style={styles.gestureContainer}>
      <View style={styles.container}>
        {/* Actions background */}
        <View style={styles.actionsContainer}>
          {onEdit && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <IconEdit size={20} color="white" />
              <ThemedText style={styles.actionText}>Editar</ThemedText>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.destructive }]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <IconTrash size={20} color="white" />
              <ThemedText style={styles.actionText}>Excluir</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Main content */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.contentContainer, animatedStyle]}>
            {children(isActive)}
          </Animated.View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  gestureContainer: {
    flex: 1,
  },
  container: {
    position: "relative",
  },
  actionsContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "stretch",
  },
  actionButton: {
    width: ACTION_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  contentContainer: {
    backgroundColor: "white",
  },
});
