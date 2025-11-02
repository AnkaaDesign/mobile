import { useRef, useEffect, useState } from "react";
import { Pressable, Animated, Easing } from "react-native";
import { IconMoon, IconSun } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";

interface ThemeToggleProps {
  size?: number;
  className?: string;
}

export function ThemeToggle({ size = 24}: ThemeToggleProps) {
  const themeContext = useTheme();
  console.log("ThemeToggle: Theme context:", themeContext);
  const { isDark, setTheme } = themeContext;
  const [isToggling, setIsToggling] = useState(false);

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

  const toggleTheme = async () => {
    console.log("ThemeToggle: Button pressed, current isDark:", isDark);
    if (isToggling) {
      console.log("ThemeToggle: Already toggling, skipping");
      return; // Prevent multiple simultaneous toggles
    }

    setIsToggling(true);
    try {
      // Toggle between light and dark (not including system for simplicity)
      const newTheme = isDark ? "light" : "dark";
      console.log("ThemeToggle: Setting theme to:", newTheme);
      await setTheme(newTheme);
      console.log("ThemeToggle: Theme set successfully");
    } catch (error) {
      console.error("Failed to toggle theme:", error);
    } finally {
      setIsToggling(false);
    }
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
      onPressIn={() => console.log("ThemeToggle: Press started")}
      onPressOut={() => console.log("ThemeToggle: Press ended")}
      disabled={isToggling}
      style={({ pressed }) => ({
        height: 40,
        width: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        backgroundColor: pressed ? pressedBackgroundColor : "transparent",
        opacity: isToggling ? 0.5 : 1,
        zIndex: 999, // Ensure it's on top
      })}
      accessibilityRole="button"
      accessibilityLabel={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      accessibilityHint="Alterna entre tema claro e escuro"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Increase touch area
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
