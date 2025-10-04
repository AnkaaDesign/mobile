import * as React from "react";
import { Alert as RNAlert, StyleSheet, Text, TextStyle,
  View, ViewStyle } from "react-native";

export interface AlertProps {
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  style?: ViewStyle;
  children?: React.ReactNode;
  icon?: React.ComponentType<{ size: number; color: string }>;
  iconSize?: number;
}

const getAlertStyles = (variant: AlertProps["variant"] = "default"): ViewStyle => {
  const baseStyles: ViewStyle = {
    position: "relative",
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    paddingLeft: 48,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  };

  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: "#f8fafc",
      borderColor: "#e2e8f0",
    },
    destructive: {
      backgroundColor: "#fef2f2",
      borderColor: "#fecaca",
    },
    success: {
      backgroundColor: "#f0fdf4",
      borderColor: "#bbf7d0",
    },
    warning: {
      backgroundColor: "#fffbeb",
      borderColor: "#fed7aa",
    },
    info: {
      backgroundColor: "#eff6ff",
      borderColor: "#bfdbfe",
    },
  };

  return {
    ...baseStyles,
    ...variantStyles[variant],
  };
};

const getIconColor = (variant: AlertProps["variant"] = "default"): string => {
  const iconColors: Record<string, string> = {
    default: "#64748b",
    destructive: "#dc2626",
    success: "#16a34a",
    warning: "#ea580c",
    info: "#2563eb",
  };
  return iconColors[variant as keyof typeof iconColors];
};

const Alert = React.forwardRef<View, AlertProps>(({ variant = "default", style, children, icon: Icon, iconSize = 20, ...props }, ref) => {
  const alertStyles = getAlertStyles(variant);
  const iconColor = getIconColor(variant);

  return (
    <View ref={ref} style={StyleSheet.flatten([alertStyles, style])} {...props}>
      {Icon && (
        <View
          style={{
            position: "absolute",
            left: 16,
            top: 18,
          }}
        >
          <Icon size={iconSize} color={iconColor} />
        </View>
      )}
      {children}
    </View>
  );
});

Alert.displayName = "Alert";

interface AlertTextProps {
  style?: TextStyle;
  children?: React.ReactNode;
  variant?: AlertProps["variant"];
}

const AlertTitle = React.forwardRef<Text, AlertTextProps>(({ style, variant, ...props }, ref) => (
  <Text
    ref={ref}
    style={StyleSheet.flatten([
      {
        fontSize: 16,
        fontWeight: "600",
        lineHeight: 24,
        letterSpacing: -0.2,
        color: "#0f172a",
        marginBottom: 2,
      },
      style,
    ])}
    {...props}
  />
));

AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<Text, AlertTextProps>(({ style, variant, ...props }, ref) => (
  <Text
    ref={ref}
    style={StyleSheet.flatten([
      {
        fontSize: 14,
        lineHeight: 20,
        color: "#475569",
        letterSpacing: -0.1,
      },
      style,
    ])}
    {...props}
  />
));

AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription, AlertTitle, getAlertStyles };