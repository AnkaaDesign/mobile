
import { ActivityIndicator, Text, TextStyle, View, ViewStyle } from "react-native";
import { cn } from "@/lib/cn";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  message?: string;
  fullScreen?: boolean;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function LoadingSpinner({
  size = "lg",
  color,
  message,
  fullScreen = false,
  className,
  style,
  textStyle,
}: LoadingSpinnerProps) {
  // Map our size to ActivityIndicator size
  const activityIndicatorSize = size === "sm" ? "small" : "large";

  const spinner = (
    <View
      className={cn(
        "flex items-center justify-center",
        fullScreen && "flex-1",
        className
      )}
      style={style}
    >
      <ActivityIndicator
        size={activityIndicatorSize}
        color={color || "#3B82F6"} // Default to blue-500
      />
      {message && (
        <Text
          className="mt-4 text-center text-muted-foreground"
          style={textStyle}
        >
          {message}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 bg-background">
        {spinner}
      </View>
    );
  }

  return spinner;
}

// Preset loading states for common use cases
export const PageLoadingSpinner = () => (
  <LoadingSpinner
    fullScreen
    message="Carregando..."
  />
);

export const InlineLoadingSpinner = ({ message }: { message?: string }) => (
  <LoadingSpinner
    size="sm"
    message={message}
    className="py-4"
  />
);

export const ButtonLoadingSpinner = () => (
  <ActivityIndicator size="small" color="#FFFFFF" />
);