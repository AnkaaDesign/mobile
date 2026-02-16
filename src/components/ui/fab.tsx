import { TouchableOpacity, Text, ViewStyle, StyleSheet } from "react-native";
import { Icon } from "./icon";
import { useTheme } from "@/lib/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as React from "react";
import { useCallback } from "react";
import { impactHaptic } from "@/utils/haptics";

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

  const handlePress = useCallback(() => {
    if (disabled) return;

    // Haptic feedback (don't await for instant response)
    if (enableHaptic) {
      impactHaptic();
    }

    // Execute action — the overlay blocks touches during navigation,
    // and pushWithLoading has its own ref-based double-click guard
    onPress();
  }, [disabled, enableHaptic, onPress]);

  const defaultStyle: ViewStyle = {
    position: "absolute",
    bottom: Math.max(24, insets.bottom + 32),
    right: 16,
    backgroundColor: disabled ? colors.muted : colors.primary,
    borderRadius: 28,
    paddingHorizontal: label ? 20 : 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: disabled ? 0.1 : 0.2,
    shadowRadius: 8,
    elevation: disabled ? 4 : 8,
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={StyleSheet.flatten([defaultStyle, style])}
      disabled={disabled}
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
