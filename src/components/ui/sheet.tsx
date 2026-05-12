import * as React from "react";
import { BackHandler, Dimensions, Modal, Platform, Pressable,
  StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useTheme } from "@/lib/theme";
import { borderRadius, shadow, spacing } from "@/constants/design-system";

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
  const opacity = useSharedValue(0);
  const [currentSnapIndex, setCurrentSnapIndex] = React.useState(initialSnapIndex);

  // Convert snap points to actual heights
  const snapHeights = React.useMemo(
    () => snapPoints.map((point) => SCREEN_HEIGHT * (point / 100)),
    [snapPoints]
  );

  // Max snap height is used as the sheet's fixed height
  const maxSnapHeight = snapHeights[snapHeights.length - 1];
  const translateY = useSharedValue(maxSnapHeight);

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

  // Animate in/out when open changes. We use timing (not spring) for the
  // initial slide so the sheet lands cleanly without an overshoot — the
  // previous spring (damping 28 / stiffness 200) overshot enough to read
  // as a noticeable bounce on tall sheets like the configure modal. Drag
  // snaps below still use spring because the user has the sheet under
  // their finger and a little spring there feels alive, not janky.
  React.useEffect(() => {
    if (open) {
      opacity.value = withTiming(1, { duration: 220 });
      translateY.value = withTiming(
        maxSnapHeight - snapHeights[currentSnapIndex],
        { duration: 280, easing: Easing.out(Easing.cubic) },
      );
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(maxSnapHeight, {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [open, currentSnapIndex, snapHeights, maxSnapHeight, opacity, translateY]);

  const close = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const snapToIndex = React.useCallback(
    (index: number) => {
      if (index < 0 || index >= snapHeights.length) return;

      setCurrentSnapIndex(index);
      // Snap-from-drag uses a firmly-damped spring so the sheet feels
      // attached to the user's finger but doesn't overshoot at the
      // resting position. Damping 36 / stiffness 320 → ratio ~1.01
      // (critically damped, no visible bounce).
      translateY.value = withSpring(
        maxSnapHeight - snapHeights[index],
        {
          damping: 36,
          stiffness: 320,
        }
      );
    },
    [snapHeights, maxSnapHeight, translateY]
  );

  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const newY = maxSnapHeight - snapHeights[currentSnapIndex] + event.translationY;
      const minY = 0; // Fully expanded (max snap)
      const maxY = maxSnapHeight; // Fully hidden

      translateY.value = Math.min(Math.max(newY, minY), maxY);
    })
    .onEnd((event) => {
      const currentY = translateY.value;
      const velocityY = event.velocityY;

      // Find closest snap point
      let closestIndex = 0;
      let closestDistance = Math.abs(currentY - (maxSnapHeight - snapHeights[0]));

      for (let i = 1; i < snapHeights.length; i++) {
        const distance = Math.abs(currentY - (maxSnapHeight - snapHeights[i]));
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
      if (currentY > maxSnapHeight - snapHeights[0] * 0.5) {
        runOnJS(close)();
        return;
      }

      runOnJS(snapToIndex)(closestIndex);
    });

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
    height: maxSnapHeight,
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    overflow: "hidden",
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
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[sheetContentStyle, sheetStyle]}>
              {dragIndicator && <View style={dragIndicatorStyle} />}
              {children}
            </Animated.View>
          </GestureDetector>
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
