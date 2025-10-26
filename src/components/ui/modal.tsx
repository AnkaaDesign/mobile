import * as React from "react";
import { BackHandler, Modal as RNModal, Platform,
  Pressable, View, ViewStyle } from "react-native";
import Animated, {  FadeIn, FadeOut, SlideInUp, SlideOutDown  } from "react-native-reanimated";
import { useTheme } from "@/lib/theme";
import { borderRadius, shadow, spacing, transitions } from "@/constants/design-system";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  animationType?: "fade" | "slide" | "none";
  presentationStyle?: "fullScreen" | "pageSheet" | "formSheet" | "overFullScreen";
  backdropOpacity?: number;
  closeOnBackdropPress?: boolean;
  statusBarTranslucent?: boolean;
  style?: ViewStyle;
  size?: "sm" | "md" | "lg" | "xl" | "full" | string;
}

interface ModalContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface ModalHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface ModalFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  animationType = "slide",
  presentationStyle = "overFullScreen",
  backdropOpacity = 0.5,
  closeOnBackdropPress = true,
  statusBarTranslucent = Platform.OS === "android",
  style,
}) => {
  const { colors, isDark } = useTheme();

  // Handle Android back button
  React.useEffect(() => {
    if (Platform.OS === "android" && visible) {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        onClose();
        return true;
      });

      return () => backHandler.remove();
    }
  }, [visible, onClose]);

  const backdropStyle: ViewStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
  };

  const containerStyle: ViewStyle = {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
    ...style,
  };

  const getAnimation = () => {
    switch (animationType) {
      case "slide":
        return {
          entering: SlideInUp.duration(transitions.normal),
          exiting: SlideOutDown.duration(transitions.normal),
        };
      case "fade":
        return {
          entering: FadeIn.duration(transitions.normal),
          exiting: FadeOut.duration(transitions.normal),
        };
      default:
        return {};
    }
  };

  const animation = getAnimation();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle={presentationStyle}
      statusBarTranslucent={statusBarTranslucent}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View
          style={backdropStyle}
          entering={FadeIn.duration(transitions.fast)}
          exiting={FadeOut.duration(transitions.fast)}
        />

        {/* Container */}
        <Pressable
          style={containerStyle}
          onPress={closeOnBackdropPress ? onClose : undefined}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View {...animation}>
              {children}
            </Animated.View>
          </Pressable>
        </Pressable>
      </View>
    </RNModal>
  );
};

const ModalContent: React.FC<ModalContentProps> = ({ children, style }) => {
  const { colors } = useTheme();

  const contentStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.lg,
    ...style,
  };

  return <View style={contentStyle}>{children}</View>;
};

const ModalHeader: React.FC<ModalHeaderProps> = ({ children, style }) => {
  const headerStyle: ViewStyle = {
    marginBottom: spacing.md,
    ...style,
  };

  return <View style={headerStyle}>{children}</View>;
};

const ModalFooter: React.FC<ModalFooterProps> = ({ children, style }) => {
  const footerStyle: ViewStyle = {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    ...style,
  };

  return <View style={footerStyle}>{children}</View>;
};

export { Modal, ModalContent, ModalHeader, ModalFooter };
