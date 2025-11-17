import * as React from "react";
import { View, Text, ViewStyle, TextStyle, ViewProps, TouchableOpacity, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, shadow, fontSize, fontWeight } from "@/constants/design-system";

import { IconChevronLeft } from "@tabler/icons-react-native";

export interface HeaderProps extends ViewProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  variant?: "default" | "transparent" | "elevated";
  size?: "default" | "large" | "small";
  centered?: boolean;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  className?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const getHeaderStyles = (variant: HeaderProps["variant"] = "default", size: HeaderProps["size"] = "default", colors: any): ViewStyle => {
  const baseStyles: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 56,
  };

  const sizeStyles: Record<string, ViewStyle> = {
    default: {
      minHeight: 56,
      paddingVertical: 8,
    },
    large: {
      minHeight: 80,
      paddingVertical: 16,
    },
    small: {
      minHeight: 48,
      paddingVertical: 4,
    },
  };

  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    transparent: {
      backgroundColor: "transparent",
    },
    elevated: {
      backgroundColor: colors.card,
      ...shadow.md,
    },
  };

  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

const getTitleStyles = (size: HeaderProps["size"] = "default", colors: any): TextStyle => {
  const sizeStyles: Record<string, TextStyle> = {
    default: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      lineHeight: 24,
    },
    large: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      lineHeight: 28,
    },
    small: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.medium,
      lineHeight: 20,
    },
  };

  return {
    ...sizeStyles[size],
    color: colors.foreground,
  };
};

const getSubtitleStyles = (colors: any): TextStyle => {
  return {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    color: colors.mutedForeground,
    lineHeight: 20,
    marginTop: 2,
  };
};

export function Header({
  title,
  subtitle,
  children,
  leftAction,
  rightAction,
  variant = "default",
  size = "default",
  centered = false,
  style,
  titleStyle,
  subtitleStyle,
  className,
  showBackButton = false,
  onBackPress,
  ...props
}: HeaderProps) {
  const { colors } = useTheme();

  const headerStyles = React.useMemo(() => getHeaderStyles(variant, size, colors), [variant, size, colors]);

  const titleTextStyles = React.useMemo(() => getTitleStyles(size, colors), [size, colors]);

  const subtitleTextStyles = React.useMemo(() => getSubtitleStyles(colors), [colors]);

  const contentContainerStyle: ViewStyle = {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: centered ? "center" : "flex-start",
    paddingHorizontal: leftAction || rightAction ? 8 : 0,
  };

  const renderLeftAction = () => {
    if (showBackButton && onBackPress) {
      return (
        <TouchableOpacity
          onPress={onBackPress}
          style={{
            padding: 8,
            marginLeft: -8,
            borderRadius: borderRadius.full,
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
      );
    }
    return leftAction;
  };

  const leftContent = renderLeftAction();

  return (
    <View className={className} style={StyleSheet.flatten([headerStyles, style])} {...props}>
      {leftContent && <View style={{ marginRight: 8 }}>{leftContent}</View>}

      <View style={contentContainerStyle}>
        {title && <Text style={StyleSheet.flatten([titleTextStyles, titleStyle])}>{title}</Text>}
        {subtitle && <Text style={StyleSheet.flatten([subtitleTextStyles, subtitleStyle])}>{subtitle}</Text>}
        {children}
      </View>

      {rightAction && <View style={{ marginLeft: 8 }}>{rightAction}</View>}
    </View>
  );
}

Header.displayName = "Header";
