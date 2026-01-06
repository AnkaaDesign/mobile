import * as React from "react";
import { View, Pressable, ViewStyle, Animated, StyleSheet} from "react-native";
import { IconCheck } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";

export interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
  className?: string;
  label?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const Checkbox = React.forwardRef<View, CheckboxProps>(({ checked = false, indeterminate = false, onCheckedChange, disabled = false, style, className, label, accessibilityLabel, accessibilityHint, testID, ...props }, ref) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = React.useState(false);
  const [_isPressed, _setIsPressed] = React.useState(false);

  // Generate accessibility label
  const getAccessibilityLabel = () => {
    if (accessibilityLabel) return accessibilityLabel;
    if (label) return label;
    return "Checkbox";
  };

  // Animation values
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const backgroundAnim = React.useRef(new Animated.Value(checked ? 1 : 0)).current;
  const checkAnim = React.useRef(new Animated.Value(checked ? 1 : 0)).current;

  // Handle checked state animation
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(backgroundAnim, {
        toValue: checked ? 1 : 0,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.spring(checkAnim, {
        toValue: checked ? 1 : 0,
        friction: 4,
        tension: 40,
        useNativeDriver: false,
      }),
    ]).start();
  }, [checked]);

  // Handle press animation
  const handlePressIn = () => {
    _setIsPressed(true);
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    _setIsPressed(false);
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const backgroundColor = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, colors.primary],
  });

  const borderColor = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  const checkboxStyles: ViewStyle = {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    ...(disabled && {
      opacity: 0.5,
    }),
    ...style,
  };

  const animatedCheckboxStyle = {
    ...checkboxStyles,
    backgroundColor: disabled ? (checked ? colors.muted : colors.background) : backgroundColor,
    borderColor: disabled ? colors.muted : borderColor,
    transform: [{ scale: scaleAnim }],
  };

  const focusStyle: ViewStyle =
    isFocused && !disabled
      ? {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 4,
        }
      : {};

  return (
    <Pressable
      ref={ref}
      onPress={disabled ? undefined : () => onCheckedChange?.(!checked)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      disabled={disabled}
      accessible={true}
      accessibilityRole="checkbox"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ checked, disabled }}
      testID={testID}
      {...props}
    >
      <Animated.View style={StyleSheet.flatten([animatedCheckboxStyle, focusStyle])}>
        <Animated.View
          style={{
            opacity: checkAnim,
            transform: [
              {
                scale: checkAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ],
          }}
        >
          <IconCheck size={12} strokeWidth={3} color={colors.primaryForeground} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };

