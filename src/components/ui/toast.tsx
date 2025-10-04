import * as React from "react";
import { Dimensions, Pressable, StyleSheet,
  Text, TextStyle, View, ViewStyle } from "react-native";
import Animated, { 
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
 } from "react-native-reanimated";
import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, shadow, spacing, fontSize, fontWeight, transitions } from "@/constants/design-system";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ToastType = "success" | "error" | "warning" | "info";

interface ToastOptions {
  message: string;
  type?: ToastType;
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  position?: "top" | "bottom";
}

interface ToastItemProps {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  position: "top" | "bottom";
  onDismiss: (id: string) => void;
}

// Toast manager state
interface ToastState {
  toasts: ToastItemProps[];
}

let toastState: ToastState = { toasts: [] };
let listeners: ((state: ToastState) => void)[] = [];

// Toast manager functions
const addToast = (toast: Omit<ToastItemProps, "id" | "onDismiss">) => {
  const id = `toast-${Date.now()}-${Math.random()}`;
  const newToast: ToastItemProps = {
    ...toast,
    id,
    onDismiss: removeToast,
  };

  toastState.toasts.push(newToast);
  listeners.forEach((listener) => listener(toastState));

  // Auto dismiss after duration
  if (toast.duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, toast.duration);
  }
};

const removeToast = (id: string) => {
  toastState.toasts = toastState.toasts.filter((toast) => toast.id !== id);
  listeners.forEach((listener) => listener(toastState));
};

const clearAllToasts = () => {
  toastState.toasts = [];
  listeners.forEach((listener) => listener(toastState));
};

// Simple toast function for backward compatibility
export function showToast({
  message,
  type = "info",
  title,
  duration = 4000,
  action,
  position = "top"
}: ToastOptions) {
  // Set default title based on type if not provided
  const defaultTitles: Record<ToastType, string> = {
    success: "Sucesso",
    error: "Erro",
    warning: "Aviso",
    info: "Informação",
  };

  const toastTitle = title || defaultTitles[type as keyof typeof defaultTitles];

  addToast({
    message,
    type,
    title: toastTitle,
    duration,
    action,
    position,
  });
}

// Individual Toast Item component
const ToastItem: React.FC<ToastItemProps> = ({
  id,
  message,
  type,
  title,
  action,
  position,
  onDismiss,
}) => {
  const { colors, isDark } = useTheme();
  const progress = useSharedValue(1);

  React.useEffect(() => {
    // Start progress animation
    progress.value = withTiming(0, { duration: 4000 });
  }, [progress]);

  const handleDismiss = () => {
    onDismiss(id);
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const getIcon = () => {
    const iconSize = 20;
    const iconColor = getIconColor();

    switch (type) {
      case "success":
        return <IconCheck size={iconSize} color={iconColor} />;
      case "error":
        return <IconX size={iconSize} color={iconColor} />;
      case "warning":
        return <IconAlertTriangle size={iconSize} color={iconColor} />;
      case "info":
      default:
        return <IconInfoCircle size={iconSize} color={iconColor} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return isDark ? "#15803d" : "#dcfce7";
      case "error":
        return isDark ? "#dc2626" : "#fef2f2";
      case "warning":
        return isDark ? "#ea580c" : "#fefbeb";
      case "info":
      default:
        return isDark ? "#2563eb" : "#eff6ff";
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "success":
        return isDark ? "#22c55e" : "#16a34a";
      case "error":
        return isDark ? "#ef4444" : "#dc2626";
      case "warning":
        return isDark ? "#f97316" : "#ea580c";
      case "info":
      default:
        return isDark ? "#3b82f6" : "#2563eb";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return isDark ? "#22c55e" : "#16a34a";
      case "error":
        return isDark ? "#ef4444" : "#dc2626";
      case "warning":
        return isDark ? "#f97316" : "#ea580c";
      case "info":
      default:
        return isDark ? "#3b82f6" : "#2563eb";
    }
  };

  const getTextColor = () => {
    return isDark ? "#ffffff" : "#000000";
  };

  const containerStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: getBorderColor(),
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    overflow: "hidden",
    ...shadow.md,
  };

  const contentStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    gap: spacing.sm,
  };

  const textContentStyle: ViewStyle = {
    flex: 1,
    gap: 2,
  };

  const titleStyle: TextStyle = {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold as any,
    color: getTextColor(),
  };

  const messageStyle: TextStyle = {
    fontSize: fontSize.sm,
    color: getTextColor(),
    opacity: 0.9,
  };

  const progressBarStyle: ViewStyle = {
    height: 2,
    backgroundColor: getBorderColor(),
    opacity: 0.3,
  };

  const progressFillStyle: ViewStyle = {
    height: "100%",
    backgroundColor: getBorderColor(),
  };

  const actionStyle: ViewStyle = {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: getBorderColor(),
  };

  const actionTextStyle: TextStyle = {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium as any,
    color: isDark ? "#ffffff" : "#ffffff",
  };

  const closeButtonStyle: ViewStyle = {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  };

  return (
    <Animated.View
      entering={position === "top" ? SlideInUp.duration(transitions.normal) : SlideInUp.duration(transitions.normal)}
      exiting={position === "top" ? SlideOutUp.duration(transitions.normal) : SlideOutUp.duration(transitions.normal)}
      style={containerStyle}
    >
      <View style={contentStyle}>
        <View>{getIcon()}</View>
        <View style={textContentStyle}>
          {title && <Text style={titleStyle}>{title}</Text>}
          <Text style={messageStyle}>{message}</Text>
        </View>
        {action && (
          <Pressable style={actionStyle} onPress={action.onPress}>
            <Text style={actionTextStyle}>{action.label}</Text>
          </Pressable>
        )}
        <Pressable style={closeButtonStyle} onPress={handleDismiss}>
          <IconX size={14} color={getTextColor()} />
        </Pressable>
      </View>
      <View style={progressBarStyle}>
        <Animated.View style={StyleSheet.flatten([progressFillStyle, progressStyle])} />
      </View>
    </Animated.View>
  );
};

// Toast Container component
const ToastContainer: React.FC = () => {
  const [state, setState] = React.useState<ToastState>(toastState);

  React.useEffect(() => {
    const listener = (newState: ToastState) => {
      setState({ ...newState });
    };

    listeners.push(listener);

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const topToasts = state.toasts.filter((toast) => toast.position === "top");
  const bottomToasts = state.toasts.filter((toast) => toast.position === "bottom");

  const topContainerStyle: ViewStyle = {
    position: "absolute",
    top: 60, // Account for status bar and safe area
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: "box-none",
  };

  const bottomContainerStyle: ViewStyle = {
    position: "absolute",
    bottom: 60, // Account for safe area
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: "box-none",
  };

  return (
    <>
      {topToasts.length > 0 && (
        <View style={topContainerStyle}>
          {topToasts.map((toast) => (
            <ToastItem key={toast.id} {...toast} />
          ))}
        </View>
      )}
      {bottomToasts.length > 0 && (
        <View style={bottomContainerStyle}>
          {bottomToasts.map((toast) => (
            <ToastItem key={toast.id} {...toast} />
          ))}
        </View>
      )}
    </>
  );
};

// Export additional functions
export { ToastContainer, addToast, removeToast, clearAllToasts };

// Convenience functions
export const toast = {
  success: (message: string, options?: Omit<ToastOptions, "message" | "type">) =>
    showToast({ ...options, message, type: "success" }),
  error: (message: string, options?: Omit<ToastOptions, "message" | "type">) =>
    showToast({ ...options, message, type: "error" }),
  warning: (message: string, options?: Omit<ToastOptions, "message" | "type">) =>
    showToast({ ...options, message, type: "warning" }),
  info: (message: string, options?: Omit<ToastOptions, "message" | "type">) =>
    showToast({ ...options, message, type: "info" }),
};
