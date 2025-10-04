import { TouchableOpacity, Text, View, ViewStyle , StyleSheet} from "react-native";
import { Icon } from "./icon";
import { useTheme } from "@/contexts/theme-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as React from "react";

interface FABProps {
  icon?: string;
  onPress: () => void;
  label?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
}

export function FAB({ icon, onPress, label, children, style, disabled = false }: FABProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const defaultStyle: ViewStyle = {
    position: "absolute",
    bottom: Math.max(24, insets.bottom + 32), // Ensure FAB is above the safe area
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
      onPress={disabled ? undefined : onPress}
      style={StyleSheet.flatten([defaultStyle, style])}
      activeOpacity={disabled ? 1 : 0.8}
      disabled={disabled}
    >
      {children ? (
        children
      ) : icon ? (
        <Icon name={icon} size={24} color={colors.background} />
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
