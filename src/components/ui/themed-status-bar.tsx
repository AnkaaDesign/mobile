
import { StatusBar, StatusBarProps } from "react-native";
import { useTheme } from "@/lib/theme";

export interface ThemedStatusBarProps extends StatusBarProps {
  // Override barStyle to make it optional since we handle it based on theme
  barStyle?: "default" | "light-content" | "dark-content";
}

export function ThemedStatusBar({ barStyle, backgroundColor, ...props }: ThemedStatusBarProps) {
  const { isDark, colors } = useTheme();

  // Determine the bar style based on the theme
  // In dark mode, we want light content (white text)
  // In light mode, we want dark content (black text)
  const themedBarStyle = barStyle || (isDark ? "light-content" : "dark-content");

  // Use theme-appropriate background color if not provided
  const themedBackgroundColor = backgroundColor || colors.background;

  return <StatusBar barStyle={themedBarStyle} backgroundColor={themedBackgroundColor} {...props} />;
}
