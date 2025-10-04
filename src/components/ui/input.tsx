import * as React from "react";
import { TextInput, View, ViewStyle, TextStyle, TextInputProps, Animated, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, shadow, fontSize, lineHeight, transitions } from "@/constants/design-system";
import { cn } from "@/lib/cn";

export interface InputProps extends Omit<TextInputProps, "style"> {
  style?: ViewStyle | ViewStyle[];
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  error?: boolean;
  withIcon?: boolean;
  className?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(({ style, containerStyle, inputStyle, error, editable = true, withIcon, className, ...props }, ref) => {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = React.useState(false);
  const borderColorAnim = React.useRef(new Animated.Value(0)).current;
  const shadowAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(borderColorAnim, {
        toValue: isFocused ? 1 : 0,
        duration: transitions.fast,
        useNativeDriver: false,
      }),
      Animated.timing(shadowAnim, {
        toValue: isFocused ? 1 : 0,
        duration: transitions.fast,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isFocused, borderColorAnim, shadowAnim]);

  const baseContainerStyles: ViewStyle = {
    width: "100%",
    ...containerStyle,
  };

  const animatedBorderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.ring],
  });

  const baseContainerViewStyles: ViewStyle = {
    // Size
    height: 40,

    // Border
    borderRadius: borderRadius.md,
    borderWidth: 1,

    // Background - transparent
    backgroundColor: "transparent",

    // Error state
    ...(error && {
      borderColor: colors.destructive,
    }),

    // Disabled state
    ...(editable === false && {
      opacity: 0.5,
      backgroundColor: "transparent",
    }),

    // Custom styles (ViewStyle only)
    ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
  };

  const baseInputStyles: TextStyle = {
    // Size
    flex: 1,
    paddingHorizontal: 12,
    paddingRight: withIcon ? 40 : 12,

    // Typography
    fontSize: fontSize.base,
    color: colors.foreground,

    // Remove line height to let the system handle it
    height: "100%",
    textAlignVertical: "center",
    includeFontPadding: false,

    // Custom text styles
    ...inputStyle,
  };

  const animatedStyles = {
    borderColor: error ? colors.destructive : animatedBorderColor,
  };

  const animatedShadowStyles = {
    shadowOpacity: shadowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [shadow.sm.shadowOpacity, 0.15],
    }),
    shadowRadius: shadowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [shadow.sm.shadowRadius, 4],
    }),
    elevation: shadowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [shadow.sm.elevation, 3],
    }),
  };

  return (
    <View style={baseContainerStyles} className={className}>
      <Animated.View style={animatedShadowStyles}>
        <Animated.View style={StyleSheet.flatten([baseContainerViewStyles, animatedStyles])}>
          <TextInput
            ref={ref}
            style={baseInputStyles}
            placeholderTextColor={colors.mutedForeground}
            editable={editable}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
});

Input.displayName = "Input";

export { Input };

