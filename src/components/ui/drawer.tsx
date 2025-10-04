import * as React from "react";
import { BackHandler, Dimensions, Modal, PanResponder, Platform, Pressable, View, ViewStyle , StyleSheet} from "react-native";
import Animated, { 
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideOutLeft,
  SlideInRight,
  SlideOutRight,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
 } from "react-native-reanimated";
import { PanGestureHandler, GestureHandlerRootView } from "react-native-gesture-handler";
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
      opacity.value = withTiming(1, { duration: transitions.fast });
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 200,
      });
    } else {
      opacity.value = withTiming(0, { duration: transitions.fast });
      translateX.value = withSpring(side === "left" ? -drawerWidth : drawerWidth, {
        damping: 20,
        stiffness: 200,
      });
    }
  }, [open, side, drawerWidth, opacity, translateX]);

  const close = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      if (!closeOnSwipe) return;

      const newX = context.startX + event.translationX;

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
    },
    onEnd: (event) => {
      if (!closeOnSwipe) return;

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
          damping: 20,
          stiffness: 200,
        });
      }
    },
  });

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * backdropOpacity,
  }));

  const drawerContentStyle: ViewStyle = {
    position: "absolute",
    top: 0,
    bottom: 0,
    [side]: 0,
    width: drawerWidth,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.lg,
    ...(side === "left" && {
      borderRightWidth: 1,
      borderLeftWidth: 0,
      borderTopRightRadius: borderRadius.lg,
      borderBottomRightRadius: borderRadius.lg,
    }),
    ...(side === "right" && {
      borderLeftWidth: 1,
      borderRightWidth: 0,
      borderTopLeftRadius: borderRadius.lg,
      borderBottomLeftRadius: borderRadius.lg,
    }),
    ...style,
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

          {/* Drawer Content */}
          <PanGestureHandler onGestureEvent={panGestureHandler}>
            <Animated.View style={StyleSheet.flatten([drawerContentStyle, drawerStyle])}>
              {children}
            </Animated.View>
          </PanGestureHandler>
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

  const headerStyle: ViewStyle = {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...style,
  };

  return <View style={headerStyle}>{children}</View>;
};

const DrawerFooter: React.FC<DrawerFooterProps> = ({ children, style }) => {
  const { colors } = useTheme();

  const footerStyle: ViewStyle = {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...style,
  };

  return <View style={footerStyle}>{children}</View>;
};

export { Drawer, DrawerContent, DrawerHeader, DrawerFooter };
