import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { Icon } from "./icon";
import { cn } from "@/lib/cn";
import * as Haptics from "expo-haptics";

interface FloatingActionButtonProps {
  icon: React.ComponentProps<typeof Icon>["name"];
  onPress: () => void;
  label?: string;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  disabled?: boolean;
  className?: string;
  style?: ViewStyle;
}

export function FloatingActionButton({
  icon,
  onPress,
  label,
  variant = "primary",
  size = "md",
  position = "bottom-right",
  disabled = false,
  className,
  style,
}: FloatingActionButtonProps) {
  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-14 h-14",
    lg: "w-16 h-16",
  };

  const iconSizes = {
    sm: 20,
    md: 24,
    lg: 28,
  };

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
  };

  const variantClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    danger: "bg-destructive",
  };

  const iconColors = {
    primary: "#FFFFFF",
    secondary: "#FFFFFF",
    danger: "#FFFFFF",
  };

  return (
    <View
      className={cn(
        "absolute",
        positionClasses[position],
        className
      )}
      style={StyleSheet.flatten([styles.container, style])}
    >
      {label && (
        <View className="mr-3 bg-background px-3 py-2 rounded-lg shadow-sm">
          <Text className="text-sm font-medium">{label}</Text>
        </View>
      )}
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        className={cn(
          "items-center justify-center rounded-full shadow-lg",
          sizeClasses[size],
          variantClasses[variant],
          disabled && "opacity-50"
        )}
        style={styles.button}
        activeOpacity={0.8}
      >
        <Icon
          name={icon}
          size={iconSizes[size as keyof typeof iconSizes]}
          color={iconColors[variant as keyof typeof iconColors]}
        />
      </TouchableOpacity>
    </View>
  );
}

// Extended FAB with multiple actions
export function ExtendedFloatingActionButton({
  actions,
  mainIcon = "IconPlus",
  isOpen,
  onToggle,
  position = "bottom-right",
}: {
  actions: Array<{
    icon: React.ComponentProps<typeof Icon>["name"];
    label: string;
    onPress: () => void;
  }>;
  mainIcon?: React.ComponentProps<typeof Icon>["name"];
  isOpen: boolean;
  onToggle: () => void;
  position?: "bottom-right" | "bottom-left" | "bottom-center";
}) {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
  };

  return (
    <View
      className={cn(
        "absolute",
        positionClasses[position],
        "items-end"
      )}
    >
      {isOpen && (
        <View className="mb-4">
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                action.onPress();
                onToggle();
              }}
              className="flex-row items-center mb-3"
              activeOpacity={0.8}
            >
              <View className="mr-3 bg-background px-3 py-2 rounded-lg shadow-sm">
                <Text className="text-sm font-medium">{action.label}</Text>
              </View>
              <View className="w-12 h-12 bg-background rounded-full items-center justify-center shadow-md">
                <Icon name={action.icon} size={20} color="#3B82F6" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onToggle();
        }}
        className="w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
        activeOpacity={0.8}
      >
        <Icon
          name={isOpen ? "IconX" : mainIcon}
          size={24}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 999,
  },
  button: {
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});