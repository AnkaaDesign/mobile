import React, { useRef, useEffect } from "react";
import { Pressable, Animated, Easing } from "react-native";
import { IconMoon, IconSun } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { cn } from "../../lib/utils";

interface ThemeToggleProps {
  size?: number;
  className?: string;
}

export function ThemeToggle({ size = 24, className }: ThemeToggleProps) {
  const { theme, isDark, setTheme } = useTheme();

  // Animation values
  const sunScale = useRef(new Animated.Value(isDark ? 0 : 1)).current;
  const sunRotation = useRef(new Animated.Value(isDark ? 90 : 0)).current;
  const moonScale = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const moonRotation = useRef(new Animated.Value(isDark ? 0 : -90)).current;

  // Animate when theme changes
  useEffect(() => {
    const duration = 300;
    const easing = Easing.bezier(0.4, 0, 0.2, 1);

    Animated.parallel([
      // Sun animations
      Animated.timing(sunScale, {
        toValue: isDark ? 0 : 1,
        duration,
        easing,
        useNativeDriver: true,
      }),
      Animated.timing(sunRotation, {
        toValue: isDark ? 90 : 0,
        duration,
        easing,
        useNativeDriver: true,
      }),
      // Moon animations
      Animated.timing(moonScale, {
        toValue: isDark ? 1 : 0,
        duration,
        easing,
        useNativeDriver: true,
      }),
      Animated.timing(moonRotation, {
        toValue: isDark ? 0 : -90,
        duration,
        easing,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isDark]);

  const toggleTheme = () => {
    // Toggle between light and dark (not including system for simplicity)
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);
  };

  // Use appropriate colors for React Native
  const iconColor = isDark ? "#f5f5f5" : "#0a0a0a"; // neutral-100 : neutral-950
  const pressedBackgroundColor = isDark ? "#262626" : "#f5f5f5"; // neutral-800 : neutral-100

  const sunRotationDegrees = sunRotation.interpolate({
    inputRange: [0, 90],
    outputRange: ["0deg", "90deg"],
  });

  const moonRotationDegrees = moonRotation.interpolate({
    inputRange: [-90, 0],
    outputRange: ["-90deg", "0deg"],
  });

  return (
    <Pressable
      onPress={toggleTheme}
      style={({ pressed }) => ({
        height: 40,
        width: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        backgroundColor: pressed ? pressedBackgroundColor : "transparent",
      })}
      accessibilityRole="button"
      accessibilityLabel={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      accessibilityHint="Alterna entre tema claro e escuro"
    >
      {/* Container for overlapping icons */}
      <Animated.View
        style={{
          position: "relative",
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Sun Icon */}
        <Animated.View
          style={{
            position: "absolute",
            transform: [{ scale: sunScale }, { rotate: sunRotationDegrees }],
          }}
        >
          <IconSun size={size} color={iconColor} />
        </Animated.View>

        {/* Moon Icon */}
        <Animated.View
          style={{
            position: "absolute",
            transform: [{ scale: moonScale }, { rotate: moonRotationDegrees }],
          }}
        >
          <IconMoon size={size} color={iconColor} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
