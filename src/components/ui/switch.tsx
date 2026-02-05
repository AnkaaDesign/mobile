import * as React from "react";
import { Pressable, View, ViewStyle , StyleSheet} from "react-native";
import Animated, {  interpolateColor, useAnimatedStyle, useDerivedValue, withSpring, withTiming, Easing  } from "react-native-reanimated";
import { useTheme } from "@/lib/theme";

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Alias for checked - for form compatibility */
  value?: boolean;
  /** Alias for onCheckedChange - for form compatibility */
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

const Switch = React.forwardRef<View, SwitchProps>(({ checked, onCheckedChange, value, onValueChange, disabled = false, style, ...props }, ref) => {
  // Support both checked/onCheckedChange and value/onValueChange APIs
  const isChecked = checked ?? value ?? false;
  const handleChange = onCheckedChange ?? onValueChange;
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = React.useState(false);

  // Use spring animation for thumb position for smooth elastic effect
  const translateX = useDerivedValue(() => {
    return withSpring(isChecked ? 20 : 0, {
      damping: 15,
      stiffness: 150,
      mass: 1,
    });
  });

  // Use timing animation for color transition
  const colorProgress = useDerivedValue(() => {
    return withTiming(isChecked ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  });

  const animatedTrackStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(colorProgress.value, [0, 1], [colors.muted, colors.primary]),
    };
  });

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    // Scale effect when switching
    scale: withTiming(isChecked ? 1.05 : 1, { duration: 150 }),
  }));

  const trackStyles: ViewStyle = {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: "center",
    // Base shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    // Focus state
    ...(isFocused && {
      shadowColor: isChecked ? colors.primary : colors.mutedForeground,
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    }),
    // Disabled state
    ...(disabled && {
      opacity: 0.5,
    }),
    ...style,
  };

  const thumbStyles: ViewStyle = {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: isChecked ? colors.primaryForeground : isDark ? colors.card : "#ffffff",
    // Enhanced thumb shadow
    shadowColor: isDark ? "#000" : "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDark ? 0.4 : 0.15,
    shadowRadius: 4,
    elevation: 3,
  };

  return (
    <Pressable
      ref={ref}
      onPress={disabled ? undefined : () => handleChange?.(!isChecked)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      accessibilityRole="switch"
      accessibilityState={{ checked: isChecked, disabled }}
      {...props}
    >
      <Animated.View style={StyleSheet.flatten([trackStyles, animatedTrackStyle])}>
        <Animated.View style={StyleSheet.flatten([thumbStyles, animatedThumbStyle])} />
      </Animated.View>
    </Pressable>
  );
});

Switch.displayName = "Switch";

export { Switch };

