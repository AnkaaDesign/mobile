import { TouchableOpacity, Text, ViewStyle, StyleSheet } from "react-native";
import { Icon } from "./icon";
import { useTheme } from "@/lib/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as React from "react";
import { useCallback } from "react";
import { impactHaptic } from "@/utils/haptics";
import { useNavigationLoading } from "@/contexts/navigation-loading-context";

interface FABProps {
  icon?: string;
  onPress: () => void;
  label?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
  enableHaptic?: boolean;
  loadingMessage?: string;
}

export function FAB({
  icon,
  onPress,
  label,
  children,
  style,
  disabled = false,
  enableHaptic = true,
  loadingMessage
}: FABProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { startNavigation, isNavigating } = useNavigationLoading();

  const handlePress = useCallback(() => {
    console.log('[FAB] handlePress called:', {
      disabled,
      isNavigating,
      hasLoadingMessage: !!loadingMessage
    });

    if (disabled || isNavigating) {
      console.log('[FAB] Press blocked:', { disabled, isNavigating });
      return;
    }

    // Haptic feedback (don't await for instant response)
    if (enableHaptic) {
      impactHaptic();
    }

    // Show loading overlay INSTANTLY if loadingMessage is provided
    if (loadingMessage) {
      console.log('[FAB] Starting navigation with message:', loadingMessage);
      startNavigation(loadingMessage);
    }

    // Execute action immediately
    console.log('[FAB] Executing onPress callback');
    onPress();
  }, [disabled, isNavigating, enableHaptic, loadingMessage, startNavigation, onPress]);

  const defaultStyle: ViewStyle = {
    position: "absolute",
    bottom: Math.max(24, insets.bottom + 32),
    right: 16,
    backgroundColor: disabled || isNavigating ? colors.muted : colors.primary,
    borderRadius: 28,
    paddingHorizontal: label ? 20 : 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: disabled || isNavigating ? 0.1 : 0.2,
    shadowRadius: 8,
    elevation: disabled || isNavigating ? 4 : 8,
    opacity: disabled || isNavigating ? 0.6 : 1,
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={StyleSheet.flatten([defaultStyle, style])}
      disabled={disabled || isNavigating}
      activeOpacity={0.7}
    >
      {children ? (
        children
      ) : icon ? (
        <Icon name={icon} size={24} color="#FFFFFF" />
      ) : null}
      {label && (
        <Text
          style={{
            color: colors.background,
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}