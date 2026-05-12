import { TouchableOpacity, Text, View, ViewStyle, StyleSheet } from "react-native";
import { Icon } from "./icon";
import { useTheme } from "@/lib/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as React from "react";
import { useCallback } from "react";
import { impactHaptic } from "@/utils/haptics";
import { useTutorialTarget } from "@/components/tutorial";

interface FABProps {
  icon?: string;
  onPress: () => void;
  label?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
  enableHaptic?: boolean;
  loadingMessage?: string;
  tutorialTargetId?: string;
}

export function FAB({
  icon,
  onPress,
  label,
  children,
  style,
  disabled = false,
  enableHaptic = true,
  loadingMessage,
  tutorialTargetId,
}: FABProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tutorialTarget = useTutorialTarget(tutorialTargetId ?? "__fab_unused__", {
    onAction: () => {
      if (disabled) return;
      if (enableHaptic) impactHaptic();
      onPress();
    },
  });

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

  const button = (
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

  if (tutorialTargetId) {
    return (
      <View
        ref={tutorialTarget.ref}
        onLayout={tutorialTarget.onLayout}
        collapsable={false}
        style={{
          position: "absolute",
          bottom: Math.max(24, insets.bottom + 32),
          right: 16,
        }}
      >
        <TouchableOpacity
          onPress={handlePress}
          style={StyleSheet.flatten([
            { ...defaultStyle, position: "relative", bottom: undefined as any, right: undefined as any },
            style,
          ])}
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
      </View>
    );
  }

  return button;
}
