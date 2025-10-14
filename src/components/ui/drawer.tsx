import * as React from "react";
import { BackHandler, Dimensions, Modal, Platform, Pressable, View, ViewStyle , StyleSheet} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
 } from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { borderRadius, shadow, spacing, transitions } from "@/constants/design-system";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "left" | "right";
  width?: number | string;
  backdropOpacity?: number;
  closeOnBackdropPress?: boolean;
  closeOnSwipe?: boolean;
  style?: ViewStyle;
}

interface DrawerContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface DrawerHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface DrawerFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const Drawer: React.FC<DrawerProps> = ({
  open,
  onOpenChange,
  children,
  side = "left",
  width = "80%",
  backdropOpacity = 0.5,
  closeOnBackdropPress = true,
  closeOnSwipe = true,
  style,
}) => {
  const { colors } = useTheme();
  const translateX = useSharedValue(side === "left" ? -SCREEN_WIDTH : SCREEN_WIDTH);
  const opacity = useSharedValue(0);

  // Calculate drawer width
  const drawerWidth = React.useMemo(() => {
    if (typeof width === "string") {
      if (width.endsWith("%")) {
        const percentage = parseInt(width.replace("%", ""));
        return (SCREEN_WIDTH * percentage) / 100;
      }
      return parseInt(width);
    }
    return width;
  }, [width]);

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
      opacity.value = withTiming(1, { duration: 200 });
      translateX.value = withSpring(0, {
        damping: 30,
        stiffness: 300,
        mass: 0.8,
      });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateX.value = withSpring(side === "left" ? -drawerWidth : drawerWidth, {
        damping: 30,
        stiffness: 300,
        mass: 0.8,
      });
    }
  }, [open, side, drawerWidth, opacity, translateX]);

  const close = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const startX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .enabled(closeOnSwipe)
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const newX = startX.value + event.translationX;

      if (side === "left") {
        // Left drawer can only be swiped to the left to close
        if (event.translationX < 0) {
          translateX.value = Math.max(newX, -drawerWidth);
        }
      } else {
        // Right drawer can only be swiped to the right to close
        if (event.translationX > 0) {
          translateX.value = Math.min(newX, drawerWidth);
        }
      }
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const threshold = drawerWidth * 0.3;

      const shouldClose =
        side === "left"
          ? translateX.value < -threshold || velocity < -500
          : translateX.value > threshold || velocity > 500;

      if (shouldClose) {
        runOnJS(close)();
      } else {
        translateX.value = withSpring(0, {
          damping: 30,
          stiffness: 300,
          mass: 0.8,
        });
      }
    });

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * backdropOpacity,
  }));

  if (!open) return null;

  const drawerPositionStyle: ViewStyle = side === "left"
    ? { left: 0 }
    : { right: 0 };

  return (
    <Modal visible={open} transparent statusBarTranslucent onRequestClose={close}>
      <GestureHandlerRootView style={styles.modalContainer}>
        <View style={styles.container}>
          {/* Backdrop */}
          <Animated.View
            style={[
              styles.backdrop,
              backdropStyle,
            ]}
          >
            <Pressable
              style={styles.backdropPress}
              onPress={closeOnBackdropPress ? close : undefined}
            />
          </Animated.View>

          {/* Drawer Content */}
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.drawerContent,
                drawerPositionStyle,
                {
                  width: drawerWidth,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
                side === "left" && styles.drawerLeft,
                side === "right" && styles.drawerRight,
                drawerStyle,
                style,
              ]}
            >
              {children}
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const DrawerContent: React.FC<DrawerContentProps> = ({ children, style }) => {
  const contentStyle: ViewStyle = {
    flex: 1,
    padding: spacing.lg,
    ...style,
  };

  return <View style={contentStyle}>{children}</View>;
};

const DrawerHeader: React.FC<DrawerHeaderProps> = ({ children, style }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const headerStyle: ViewStyle = {
    paddingTop: Math.max(insets.top, spacing.lg),
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...style,
  };

  return <View style={headerStyle}>{children}</View>;
};

const DrawerFooter: React.FC<DrawerFooterProps> = ({ children, style }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const footerStyle: ViewStyle = {
    paddingTop: spacing.md,
    paddingBottom: Math.max(insets.bottom + spacing.sm, spacing.lg),
    paddingHorizontal: Math.max(insets.left + spacing.lg, spacing.lg),
    paddingRight: Math.max(insets.right + spacing.lg, spacing.lg),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...style,
  };

  return <View style={footerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropPress: {
    flex: 1,
  },
  drawerContent: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  drawerLeft: {
    borderLeftWidth: 0,
    borderTopRightRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  drawerRight: {
    borderRightWidth: 0,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
});

export { Drawer, DrawerContent, DrawerHeader, DrawerFooter };
