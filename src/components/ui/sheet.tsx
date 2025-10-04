import * as React from "react";
import { BackHandler, Dimensions, Modal, Platform, Pressable,
  StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  PanGestureHandler,
  GestureHandlerRootView,
  PanGestureHandlerGestureEvent,
  State
} from "react-native-gesture-handler";
import { useTheme } from "@/lib/theme";
import { borderRadius, shadow, spacing, transitions } from "@/constants/design-system";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnapIndex?: number;
  backdropOpacity?: number;
  closeOnBackdropPress?: boolean;
  dragIndicator?: boolean;
  style?: ViewStyle;
}

interface SheetContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface SheetHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface SheetFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const Sheet: React.FC<SheetProps> = ({
  open,
  onOpenChange,
  children,
  snapPoints = [50, 85],
  initialSnapIndex = 0,
  backdropOpacity = 0.5,
  closeOnBackdropPress = true,
  dragIndicator = true,
  style,
}) => {
  const { colors } = useTheme();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const [currentSnapIndex, setCurrentSnapIndex] = React.useState(initialSnapIndex);

  // Convert snap points to actual heights
  const snapHeights = React.useMemo(
    () => snapPoints.map((point) => SCREEN_HEIGHT * (point / 100)),
    [snapPoints]
  );

  // Handle Android back button
  React.useEffect(() => {
    if (Platform.OS === "android" && open) {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        onOpenChange(false);
        return true;
      });

      return () => backHandler.remove();
    }
  }, [open, onOpenChange]);

  // Animate in/out when open changes
  React.useEffect(() => {
    if (open) {
      opacity.value = withTiming(1, { duration: transitions.fast });
      translateY.value = withSpring(
        SCREEN_HEIGHT - snapHeights[currentSnapIndex],
        {
          damping: 20,
          stiffness: 200,
        }
      );
    } else {
      opacity.value = withTiming(0, { duration: transitions.fast });
      translateY.value = withSpring(SCREEN_HEIGHT, {
        damping: 20,
        stiffness: 200,
      });
    }
  }, [open, currentSnapIndex, snapHeights, opacity, translateY]);

  const close = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const snapToIndex = React.useCallback(
    (index: number) => {
      if (index < 0 || index >= snapHeights.length) return;

      setCurrentSnapIndex(index);
      translateY.value = withSpring(
        SCREEN_HEIGHT - snapHeights[index],
        {
          damping: 20,
          stiffness: 200,
        }
      );
    },
    [snapHeights, translateY]
  );

  const handleGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    "worklet";
    const { translationY, velocityY, state } = event.nativeEvent;

    if (state === State.ACTIVE) {
      const newY = SCREEN_HEIGHT - snapHeights[currentSnapIndex] + translationY;
      const minY = SCREEN_HEIGHT - snapHeights[snapHeights.length - 1];
      const maxY = SCREEN_HEIGHT;

      translateY.value = Math.min(Math.max(newY, minY), maxY);
    } else if (state === State.END || state === State.CANCELLED) {
      const currentY = translateY.value;

      // Find closest snap point
      let closestIndex = 0;
      let closestDistance = Math.abs(currentY - (SCREEN_HEIGHT - snapHeights[0]));

      for (let i = 1; i < snapHeights.length; i++) {
        const distance = Math.abs(currentY - (SCREEN_HEIGHT - snapHeights[i]));
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }

      // Consider velocity for gesture intent
      if (velocityY > 500 && closestIndex > 0) {
        // Fast downward swipe - go to smaller snap point or close
        if (closestIndex === 0) {
          runOnJS(close)();
          return;
        } else {
          closestIndex = closestIndex - 1;
        }
      } else if (velocityY < -500 && closestIndex < snapHeights.length - 1) {
        // Fast upward swipe - go to larger snap point
        closestIndex = closestIndex + 1;
      }

      // If dragged past close threshold, close the sheet
      if (currentY > SCREEN_HEIGHT - snapHeights[0] * 0.5) {
        runOnJS(close)();
        return;
      }

      runOnJS(snapToIndex)(closestIndex);
    }
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * backdropOpacity,
  }));

  const sheetContentStyle: ViewStyle = {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    minHeight: snapHeights[0],
    maxHeight: snapHeights[snapHeights.length - 1],
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    ...shadow.lg,
    ...style,
  };

  const dragIndicatorStyle: ViewStyle = {
    width: 40,
    height: 4,
    backgroundColor: colors.muted,
    borderRadius: borderRadius.full,
    alignSelf: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  };

  if (!open) return null;

  return (
    <Modal visible={open} transparent statusBarTranslucent onRequestClose={close}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {/* Backdrop */}
          <Animated.View
            style={StyleSheet.flatten([
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "black",
              },
              backdropStyle,
            ])}
          />

          {/* Backdrop Pressable */}
          <Pressable
            style={{ flex: 1 }}
            onPress={closeOnBackdropPress ? close : undefined}
          />

          {/* Sheet Content */}
          <PanGestureHandler onGestureEvent={handleGestureEvent}>
            <Animated.View style={StyleSheet.flatten([sheetContentStyle, sheetStyle])}>
              {dragIndicator && <View style={dragIndicatorStyle} />}
              {children}
            </Animated.View>
          </PanGestureHandler>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const SheetContent: React.FC<SheetContentProps> = ({ children, style }) => {
  const contentStyle: ViewStyle = {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    ...style,
  };

  return <View style={contentStyle}>{children}</View>;
};

const SheetHeader: React.FC<SheetHeaderProps> = ({ children, style }) => {
  const headerStyle: ViewStyle = {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
    ...style,
  };

  return <View style={headerStyle}>{children}</View>;
};

const SheetFooter: React.FC<SheetFooterProps> = ({ children, style }) => {
  const footerStyle: ViewStyle = {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    ...style,
  };

  return <View style={footerStyle}>{children}</View>;
};

export { Sheet, SheetContent, SheetHeader, SheetFooter };
