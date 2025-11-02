import * as React from "react";
import { Pressable, Text, View, ViewStyle, TextStyle, Animated, StyleSheet} from "react-native";

import { useTheme } from "@/lib/theme";
import { borderRadius, shadow, fontSize, fontWeight, transitions, componentSizes } from "@/constants/design-system";
import type { ThemeColors } from "@/types/theme";

export interface ButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  icon?: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

const getButtonStyles = (variant: ButtonProps["variant"] = "default", size: ButtonProps["size"] = "default", colors: ThemeColors, isDark?: boolean): ViewStyle => {
  const baseStyles: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: borderRadius.md,
    flexShrink: 0,
    // Matching web transition-all duration-200
  };

  const sizeStyles: Record<string, ViewStyle> = {
    default: {
      height: componentSizes.button.default.height,
      paddingHorizontal: componentSizes.button.default.paddingHorizontal,
    },
    sm: {
      height: componentSizes.button.sm.height,
      paddingHorizontal: componentSizes.button.sm.paddingHorizontal,
      gap: 6,
    },
    lg: {
      height: componentSizes.button.lg.height,
      paddingHorizontal: componentSizes.button.lg.paddingHorizontal,
    },
    icon: {
      width: componentSizes.button.icon.width,
      height: componentSizes.button.icon.height,
      padding: 0,
    },
  };

  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: colors.primary,
      borderWidth: 0,
      ...shadow.sm,
    },
    destructive: {
      backgroundColor: colors.destructive,
      borderWidth: 0,
      ...shadow.sm,
    },
    outline: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: isDark ? colors.border : `${colors.foreground}20`, // 20 is hex for ~12% opacity
    },
    secondary: {
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ghost: {
      backgroundColor: "transparent",
      borderWidth: 0,
    },
    link: {
      backgroundColor: "transparent",
      borderWidth: 0,
      padding: 0,
      height: "auto",
    },
  };

  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

const getTextStyles = (variant: ButtonProps["variant"] = "default", size: ButtonProps["size"] = "default", colors: ThemeColors): TextStyle => {
  const baseStyles: TextStyle = {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as any,
    textAlign: "center",
  };

  const sizeStyles: Record<string, TextStyle> = {
    default: {
      fontSize: fontSize.sm,
    },
    sm: {
      fontSize: fontSize.xs,
    },
    lg: {
      fontSize: fontSize.base,
    },
    icon: {},
  };

  const variantStyles: Record<string, TextStyle> = {
    default: {
      color: colors.primaryForeground,
    },
    destructive: {
      color: colors.destructiveForeground,
    },
    outline: {
      color: colors.foreground,
    },
    secondary: {
      color: colors.secondaryForeground,
    },
    ghost: {
      color: colors.foreground,
    },
    link: {
      color: colors.primary,
      textDecorationLine: "underline",
      textDecorationStyle: "solid",
    },
  };

  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

const getPressedStyles = (variant: ButtonProps["variant"] = "default", colors: ThemeColors): ViewStyle => {
  const pressedStyles: Record<string, ViewStyle> = {
    default: {
      opacity: 0.9,
    },
    destructive: {
      opacity: 0.9,
    },
    outline: {
      backgroundColor: colors.accent,
    },
    secondary: {
      opacity: 0.8,
    },
    ghost: {
      backgroundColor: colors.accent,
    },
    link: {
      opacity: 0.8,
    },
  };

  return pressedStyles[variant as keyof typeof pressedStyles];
};

const Button = React.forwardRef<View, ButtonProps>(({ variant = "default", size = "default", disabled, children, icon, style, className, onPress, ...props }, ref) => {
  const { colors, isDark } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const opacityValue = React.useRef(new Animated.Value(1)).current;

  const buttonStyles = getButtonStyles(variant, size, colors, isDark);
  const textStyles = getTextStyles(variant, size, colors);
  const pressedStyles = getPressedStyles(variant, colors);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.9,
        duration: transitions.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: transitions.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderChildren = () => {
    if (typeof children === "string" || typeof children === "number") {
      return (
        <Text style={StyleSheet.flatten([textStyles, { flexShrink: 1 }])} numberOfLines={1} adjustsFontSizeToFit>
          {children}
        </Text>
      );
    }

    // For non-text children, wrap in a context that provides text styles
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        // Check if it's a Text component or any component with text-like name
        const childType = child.type as React.ComponentType<{ displayName?: string; name?: string }> | typeof Text;
        if (
          childType === Text ||
          (typeof childType === "function" && 'displayName' in childType && childType.displayName && childType.displayName.includes("Text")) ||
          (typeof childType === "function" && 'name' in childType && childType.name && childType.name.includes("Text"))
        ) {
          const element = child as React.ReactElement<{ style?: TextStyle }>;
          return React.cloneElement(element, {
            style: StyleSheet.flatten([textStyles, { flexShrink: 1 }, element.props.style]),
            numberOfLines: element.props.numberOfLines || 1,
            adjustsFontSizeToFit: true
          });
        }
      }
      return child;
    });
  };

  return (
    <Pressable ref={ref} onPress={disabled ? undefined : onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled} {...props}>
      {({ pressed }) => (
        <Animated.View
          style={StyleSheet.flatten([
            buttonStyles,
            pressed && pressedStyles,
            disabled && {
              opacity: 0.5,
            },
            style,
            {
              transform: [{ scale: scaleValue }],
              opacity: disabled ? 0.5 : opacityValue,
            },
          ])}
        >
          {icon}
          {renderChildren()}
        </Animated.View>
      )}
    </Pressable>
  );
});

Button.displayName = "Button";

export { Button, getButtonStyles };