import React, { useRef } from "react";
import { Dimensions, Text, View, ViewStyle, Animated as RNAnimated, StyleSheet } from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, interpolate, runOnJS, Extrapolate } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { IconTrash, IconPencil } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";

const { width: _SCREEN_WIDTH } = Dimensions.get("window");

const ACTION_WIDTH = 80;

export interface SwipeActionsProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  enabled?: boolean;
  deleteLabel?: string;
  editLabel?: string;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
}

interface ActionButtonProps {
  onPress: () => void;
  backgroundColor: string;
  icon: React.ReactNode;
  label: string;
  x: number;
  progress: { value: number };
}

const ActionButton: React.FC<ActionButtonProps> = ({ onPress, backgroundColor, icon, label, x, progress }) => {
  const { colors } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const trans = interpolate(progress.value, [0, 1], [x, 0], Extrapolate.CLAMP);
    return {
      transform: [{ translateX: trans }],
    };
  });

  const pressHandler = () => {
    "worklet";
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    runOnJS(onPress)();
  };

  return (
    <Animated.View style={StyleSheet.flatten([styles.actionButtonContainer, animatedStyle])}>
      <RectButton style={StyleSheet.flatten([styles.actionButton, { backgroundColor }])} onPress={pressHandler}>
        <View style={styles.actionContent}>
          {icon}
          <Text style={StyleSheet.flatten([styles.actionText, { color: colors.background }])}>{label}</Text>
        </View>
      </RectButton>
    </Animated.View>
  );
};

export const SwipeActions: React.FC<SwipeActionsProps> = ({ children, onDelete, onEdit, enabled = true, deleteLabel = "Excluir", editLabel = "Editar", style, containerStyle }) => {
  const { colors } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const dragX = useSharedValue(0);
  const actionProgress = useSharedValue(0);

  const handleDelete = () => {
    swipeableRef.current?.close();
    onDelete?.();
  };

  const handleEdit = () => {
    swipeableRef.current?.close();
    onEdit?.();
  };

  const renderRightActions = (
    progress: RNAnimated.AnimatedInterpolation<number>,
    dragAnimatedX: RNAnimated.AnimatedInterpolation<number>
  ) => {
    // Convert to shared values for reanimated 2
    React.useEffect(() => {
      const progressValue = progress as unknown as RNAnimated.Value;
      const dragValue = dragAnimatedX as unknown as RNAnimated.Value;

      const progressListener = progressValue.addListener(({ value }: { value: number }) => {
        actionProgress.value = value;
      });
      const dragListener = dragValue.addListener(({ value }: { value: number }) => {
        dragX.value = value;
      });

      return () => {
        progressValue.removeListener(progressListener);
        dragValue.removeListener(dragListener);
      };
    }, [progress, dragAnimatedX]);

    return (
      <View style={styles.actionsContainer}>
        {onEdit && (
          <ActionButton
            onPress={handleEdit}
            backgroundColor={colors.primary}
            icon={<IconPencil size={24} color={colors.background} />}
            label={editLabel}
            x={ACTION_WIDTH * 2}
            progress={actionProgress}
          />
        )}
        {onDelete && (
          <ActionButton
            onPress={handleDelete}
            backgroundColor={colors.destructive}
            icon={<IconTrash size={24} color={colors.background} />}
            label={deleteLabel}
            x={ACTION_WIDTH}
            progress={actionProgress}
          />
        )}
      </View>
    );
  };

  const handleSwipeOpen = (direction: "left" | "right") => {
    if (direction === "left") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  if (!enabled || (!onDelete && !onEdit)) {
    return <View style={containerStyle}>{children}</View>;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      friction={2}
      overshootRight={false}
      onSwipeableOpen={handleSwipeOpen}
      containerStyle={containerStyle}
    >
      <View style={StyleSheet.flatten([styles.container, style])}>{children}</View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonContainer: {
    width: ACTION_WIDTH,
    height: "100%",
  },
  actionButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  actionContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
});

// Export a hook for programmatic control
export const useSwipeActions = () => {
  const swipeableRef = useRef<Swipeable>(null);

  const close = () => {
    swipeableRef.current?.close();
  };

  const openLeft = () => {
    swipeableRef.current?.openLeft();
  };

  const openRight = () => {
    swipeableRef.current?.openRight();
  };

  return {
    swipeableRef,
    close,
    openLeft,
    openRight,
  };
};
