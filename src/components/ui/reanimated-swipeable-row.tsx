import React, { useRef, useCallback } from "react";
import { Platform, Text, View, ViewStyle, StyleSheet, Pressable } from "react-native";
import ReanimatedSwipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// Type alias for backwards compatibility
type Swipeable = SwipeableMethods;
import * as Haptics from "expo-haptics";
import { useTheme } from "@/lib/theme";

export interface SwipeAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  backgroundColor?: string;
  color?: string;
  onPress: () => void;
  closeOnPress?: boolean;
}

export interface ReanimatedSwipeableRowProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  enabled?: boolean;
  friction?: number;
  leftThreshold?: number;
  rightThreshold?: number;
  overshootLeft?: boolean;
  overshootRight?: boolean;
  onWillOpen?: (direction: "left" | "right") => void;
  onWillClose?: () => void;
  onOpen?: (direction: "left" | "right", swipeable: Swipeable) => void;
  onClose?: () => void;
  containerStyle?: ViewStyle;
  childrenContainerStyle?: ViewStyle;
  actionWidth?: number;
  enableTrackpadTwoFingerGesture?: boolean;
  renderOverlay?: (progress: SharedValue<number>, side: "left" | "right") => React.ReactNode;
  /** Override the snap spring config. Defaults are heavily overdamped (mass=2,
   *  damping=1000, stiffness=700) which feels slow. Use this to get a snappier
   *  open/close. Recommended: { mass: 1, damping: 40, stiffness: 400 }. */
  animationOptions?: Record<string, unknown>;
  /** Pixels of rightward drag before the gesture activates. Set to a very large
   *  number (e.g. 999) when only right actions exist, so rightward gestures
   *  (table horizontal scroll) never accidentally trigger the swipeable. */
  dragOffsetFromLeftEdge?: number;
  /** Pixels of leftward drag before the gesture activates. Default is 10. */
  dragOffsetFromRightEdge?: number;
  /** Fires on the JS thread the moment RNGH recognises a drag-to-open gesture
   *  has started (before the finger lifts). Use for timing diagnostics. */
  onDragStart?: (direction: "left" | "right") => void;
}

export const ReanimatedSwipeableRow = React.forwardRef<Swipeable, ReanimatedSwipeableRowProps>(
  (
    {
      children,
      leftActions = [],
      rightActions = [],
      enabled = true,
      friction = 1,
      leftThreshold = 40,
      rightThreshold = 40,
      overshootLeft = false,
      overshootRight = false,
      onWillOpen,
      onWillClose,
      onOpen,
      onClose,
      containerStyle,
      childrenContainerStyle,
      actionWidth = 80,
      enableTrackpadTwoFingerGesture = false,
      renderOverlay: _renderOverlay,
      animationOptions,
      dragOffsetFromLeftEdge,
      dragOffsetFromRightEdge,
      onDragStart,
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const internalRef = useRef<Swipeable>(null);
    const swipeableRef = (ref as React.RefObject<Swipeable>) || internalRef;

    const handleWillOpen = useCallback(
      (direction: "left" | "right") => {
        if (Platform.OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onWillOpen?.(direction);
      },
      [onWillOpen],
    );

    const handleOpen = useCallback(
      (direction: "left" | "right") => {
        if (onOpen && swipeableRef && 'current' in swipeableRef && swipeableRef.current) {
          onOpen(direction, swipeableRef.current);
        }
      },
      [onOpen, swipeableRef],
    );

    const renderLeftActions = useCallback(
      (progress: SharedValue<number>, _drag: SharedValue<number>) => {
        if (leftActions.length === 0) return null;

        return (
          <View style={StyleSheet.flatten([styles.actionsContainer, { width: actionWidth * leftActions.length }])}>
            {leftActions.map((action, index) => {
              const backgroundColor = action.backgroundColor || colors.primary;
              const textColor = action.color || "#FFFFFF";

              return (
                <ActionItem
                  key={action.key}
                  action={action}
                  progress={progress}
                  backgroundColor={backgroundColor}
                  textColor={textColor}
                  width={actionWidth}
                  index={index}
                  swipeableRef={swipeableRef}
                />
              );
            })}
          </View>
        );
      },
      [leftActions, actionWidth, colors.primary],
    );

    const renderRightActions = useCallback(
      (progress: SharedValue<number>, _drag: SharedValue<number>) => {
        if (rightActions.length === 0) return null;

        return (
          <View style={StyleSheet.flatten([styles.actionsContainer, { width: actionWidth * rightActions.length }])}>
            {rightActions.map((action, index) => {
              const backgroundColor = action.backgroundColor || colors.primary;
              const textColor = action.color || "#FFFFFF";

              return (
                <ActionItem
                  key={action.key}
                  action={action}
                  progress={progress}
                  backgroundColor={backgroundColor}
                  textColor={textColor}
                  width={actionWidth}
                  index={index}
                  swipeableRef={swipeableRef}
                />
              );
            })}
          </View>
        );
      },
      [rightActions, actionWidth, colors.primary],
    );

    if (!enabled || (leftActions.length === 0 && rightActions.length === 0)) {
      return (
        <View style={containerStyle}>
          <View style={childrenContainerStyle}>{children}</View>
        </View>
      );
    }

    return (
      <ReanimatedSwipeable
        ref={'current' in swipeableRef ? swipeableRef : undefined}
        friction={friction}
        leftThreshold={leftThreshold}
        rightThreshold={rightThreshold}
        overshootLeft={overshootLeft}
        overshootRight={overshootRight}
        onSwipeableWillOpen={handleWillOpen}
        onSwipeableWillClose={onWillClose}
        onSwipeableOpen={handleOpen}
        onSwipeableClose={onClose}
        renderLeftActions={leftActions.length > 0 ? renderLeftActions : undefined}
        renderRightActions={rightActions.length > 0 ? renderRightActions : undefined}
        containerStyle={containerStyle}
        childrenContainerStyle={childrenContainerStyle}
        enableTrackpadTwoFingerGesture={enableTrackpadTwoFingerGesture}
        animationOptions={animationOptions}
        dragOffsetFromLeftEdge={dragOffsetFromLeftEdge}
        dragOffsetFromRightEdge={dragOffsetFromRightEdge}
        onSwipeableOpenStartDrag={onDragStart}
      >
        {children}
      </ReanimatedSwipeable>
    );
  },
);

// Add display name for debugging
ReanimatedSwipeableRow.displayName = "ReanimatedSwipeableRow";

// Separate component for action items to properly use hooks
interface ActionItemProps {
  action: SwipeAction;
  progress: SharedValue<number>;
  backgroundColor: string;
  textColor: string;
  width: number;
  index: number;
  swipeableRef: React.RefObject<Swipeable> | React.Ref<Swipeable>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ActionItem: React.FC<ActionItemProps> = ({ action, progress, backgroundColor, textColor, width, swipeableRef }) => {
  const isPressed = useSharedValue(0);

  const executePress = useCallback(() => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (action.closeOnPress !== false) {
      if (swipeableRef && 'current' in swipeableRef && swipeableRef.current) {
        swipeableRef.current.close();
      }
    }

    action.onPress();
  }, [action, swipeableRef]);

  const handlePressIn = useCallback(() => {
    isPressed.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [isPressed]);

  const handlePressOut = useCallback(() => {
    isPressed.value = withSpring(0, { damping: 15, stiffness: 400 });
  }, [isPressed]);

  const handlePress = useCallback(() => {
    executePress();
  }, [executePress]);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    const progressScale = interpolate(progress.value, [0, 1], [0.8, 1]);
    const pressScale = interpolate(isPressed.value, [0, 1], [1, 0.92]);
    const pressOpacity = interpolate(isPressed.value, [0, 1], [1, 0.7]);

    return {
      transform: [{ scale: progressScale * pressScale }],
      opacity: pressOpacity,
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    "worklet";
    const overlayOpacity = interpolate(isPressed.value, [0, 1], [0, 0.15]);

    return {
      opacity: overlayOpacity,
    };
  });

  return (
    <View style={StyleSheet.flatten([styles.actionContainer, { width, backgroundColor }])}>
      <AnimatedPressable
        style={StyleSheet.flatten([styles.actionButtonAnimated, animatedStyle])}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <View style={styles.actionButton}>
          <View style={styles.actionContent}>
            {action.icon}
            <Text style={StyleSheet.flatten([styles.actionText, { color: textColor }])} numberOfLines={1}>
              {action.label}
            </Text>
          </View>
        </View>
        <Animated.View style={[styles.pressOverlay, overlayStyle]} pointerEvents="none" />
      </AnimatedPressable>
    </View>
  );
};

// Hook for programmatic control
export const useReanimatedSwipeableRow = () => {
  const swipeableRef = useRef<Swipeable>(null);

  const close = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  const openLeft = useCallback(() => {
    swipeableRef.current?.openLeft();
  }, []);

  const openRight = useCallback(() => {
    swipeableRef.current?.openRight();
  }, []);

  const reset = useCallback(() => {
    swipeableRef.current?.reset();
  }, []);

  return {
    swipeableRef,
    close,
    openLeft,
    openRight,
    reset,
  };
};

// Preset action creators for common use cases
export const createEditAction = (onPress: () => void, colors: { primary: string; destructive?: string; accent?: string; muted?: string; warning?: string; info?: string }): SwipeAction => ({
  key: "edit",
  label: "Editar",
  icon: <Text style={{ fontSize: 20 }}>✏️</Text>,
  backgroundColor: colors.primary,
  onPress,
});

export const createDeleteAction = (onPress: () => void, colors: { primary: string; destructive?: string; accent?: string; muted?: string; warning?: string; info?: string }): SwipeAction => ({
  key: "delete",
  label: "Excluir",
  icon: <Text style={{ fontSize: 20 }}>🗑️</Text>,
  backgroundColor: colors.destructive || "#FF3B30",
  onPress,
});

export const createDuplicateAction = (onPress: () => void, colors: { primary: string; destructive?: string; accent?: string; muted?: string; warning?: string; info?: string }): SwipeAction => ({
  key: "duplicate",
  label: "Duplicar",
  icon: <Text style={{ fontSize: 20 }}>📋</Text>,
  backgroundColor: colors.accent || "#5AC8FA",
  onPress,
});

export const createArchiveAction = (onPress: () => void, colors: { primary: string; destructive?: string; accent?: string; muted?: string; warning?: string; info?: string }): SwipeAction => ({
  key: "archive",
  label: "Arquivar",
  icon: <Text style={{ fontSize: 20 }}>📦</Text>,
  backgroundColor: colors.muted || "#8E8E93",
  onPress,
});

export const createFavoriteAction = (onPress: () => void, colors: { primary: string; destructive?: string; accent?: string; muted?: string; warning?: string; info?: string }): SwipeAction => ({
  key: "favorite",
  label: "Favoritar",
  icon: <Text style={{ fontSize: 20 }}>⭐</Text>,
  backgroundColor: colors.warning || "#FF9500",
  onPress,
});

export const createShareAction = (onPress: () => void, colors: { primary: string; destructive?: string; accent?: string; muted?: string; warning?: string; info?: string }): SwipeAction => ({
  key: "share",
  label: "Compartilhar",
  icon: <Text style={{ fontSize: 20 }}>📤</Text>,
  backgroundColor: colors.info || "#007AFF",
  onPress,
});

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: "row",
    height: "100%",
  },
  actionContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    overflow: "hidden",
  },
  actionButtonAnimated: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  actionButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  actionContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  pressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
});

// Re-export types for convenience
export type { Swipeable } from "react-native-gesture-handler";
