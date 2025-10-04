import React from "react";
import { ScrollView, ScrollViewProps, StyleSheet} from "react-native";
import { useTheme } from "@/contexts/theme-context";

interface ThemedScrollViewProps extends ScrollViewProps {
  variant?: "default" | "card" | "secondary";
}

export function ThemedScrollView({ children, style, contentContainerStyle, variant = "default", ...props }: ThemedScrollViewProps) {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case "card":
        return colors.card;
      case "secondary":
        return colors.secondary;
      default:
        return colors.background;
    }
  };

  return (
    <ScrollView
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: getBackgroundColor() }, style])}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});
