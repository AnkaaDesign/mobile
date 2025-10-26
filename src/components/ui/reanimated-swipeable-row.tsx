import React, { useRef, useCallback } from "react";
import { Platform, Text, View, ViewStyle, StyleSheet } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { RectButton, type Swipeable } from "react-native-gesture-handler";
import Animated, { SharedValue, useAnimatedStyle, interpolate } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/theme-context";

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
}

export const ReanimatedSwipeableRow = React.forwardRef<Swipeable, ReanimatedSwipeableRowProps>(
  (
    {
      children,
      leftActions = [],
      rightActions = [],
      enabled = true,
      friction = 2,
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
      renderOverlay,
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
      (progress: SharedValue<number>, drag: SharedValue<number>) => {
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
      (progress: SharedValue<number>, drag: SharedValue<number>) => {
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

const ActionItem: React.FC<ActionItemProps> = ({ action, progress, backgroundColor, textColor, width, index, swipeableRef }) => {
  const handlePress = useCallback(() => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (action.closeOnPress !== false) {
      if ('current' in swipeableRef && swipeableRef.current) {
        swipeableRef.current.close();
      }
    }

    action.onPress();
  }, [action, swipeableRef]);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    const scale = interpolate(progress.value, [0, 1], [0.8, 1]);

    return {
      transform: [{ scale }],
    };
  });

  return (
    <View style={StyleSheet.flatten([styles.actionContainer, { width, backgroundColor }])}>
      <Animated.View style={StyleSheet.flatten([styles.actionButtonAnimated, animatedStyle])}>
        <RectButton style={styles.actionButton} onPress={handlePress}>
          <View style={styles.actionContent}>
            {action.icon}
            <Text style={StyleSheet.flatten([styles.actionText, { color: textColor }])} numberOfLines={1}>
              {action.label}
            </Text>
          </View>
        </RectButton>
      </Animated.View>
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
});

// Re-export types for convenience
export type { Swipeable } from "react-native-gesture-handler";
