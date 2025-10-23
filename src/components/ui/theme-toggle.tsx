import React, { useRef, useEffect, useState } from "react";
import { Pressable, Animated, Easing, ActivityIndicator, View } from "react-native";
import { IconMoon, IconSun } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { cn } from "../../lib/utils";

interface ThemeToggleProps {
  size?: number;
  className?: string;
}

export function ThemeToggle({ size = 24, className }: ThemeToggleProps) {
  const { theme, isDark, setTheme } = useTheme();
  const [isChanging, setIsChanging] = useState(false);
  const [previousTheme, setPreviousTheme] = useState(isDark);

  // Animation values
  const sunScale = useRef(new Animated.Value(isDark ? 0 : 1)).current;
  const sunRotation = useRef(new Animated.Value(isDark ? 90 : 0)).current;
  const moonScale = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const moonRotation = useRef(new Animated.Value(isDark ? 0 : -90)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Detect when theme actually changes
  useEffect(() => {
    if (previousTheme !== isDark) {
      // Theme has actually changed, clear loading state
      setIsChanging(false);
      setPreviousTheme(isDark);

      // Animate opacity back to full
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isDark, previousTheme]);

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
    // Prevent multiple clicks while changing
    if (isChanging) return;

    // Set loading state and reduce opacity
    setIsChanging(true);

    // Animate opacity to show it's processing
    Animated.timing(opacity, {
      toValue: 0.5,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Toggle between light and dark (not including system for simplicity)
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);

    // Fallback timeout in case theme change doesn't trigger
    setTimeout(() => {
      setIsChanging(false);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, 3000);
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
    <Animated.View style={{ opacity }}>
      <Pressable
        onPress={toggleTheme}
        disabled={isChanging}
        style={({ pressed }) => ({
          height: 40,
          width: 40,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          backgroundColor: pressed && !isChanging ? pressedBackgroundColor : "transparent",
          // Add cursor style for web to show it's disabled
          cursor: isChanging ? "not-allowed" : "pointer",
        })}
        accessibilityRole="button"
        accessibilityLabel={isChanging ? "Mudando tema..." : (isDark ? "Mudar para tema claro" : "Mudar para tema escuro")}
        accessibilityHint={isChanging ? "Aguarde enquanto o tema é alterado" : "Alterna entre tema claro e escuro"}
        accessibilityState={{ disabled: isChanging }}
      >
        {/* Show loading indicator when changing */}
        {isChanging ? (
          <ActivityIndicator
            size="small"
            color={iconColor}
            style={{
              position: "absolute",
            }}
          />
        ) : null}

        {/* Container for overlapping icons */}
        <Animated.View
          style={{
            position: "relative",
            width: size,
            height: size,
            alignItems: "center",
            justifyContent: "center",
            opacity: isChanging ? 0.3 : 1,
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
    </Animated.View>
  );
}
