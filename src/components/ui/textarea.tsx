import * as React from "react";
import { TextInput, View, ViewStyle, TextStyle, TextInputProps, Animated, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, shadow, fontSize, transitions } from "@/constants/design-system";
import { cn } from "@/lib/cn";

export interface TextareaProps extends Omit<TextInputProps, "style" | "multiline"> {
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  error?: boolean;
  errorMessage?: string;
  numberOfLines?: number;
  className?: string;
  disabled?: boolean;
}

const Textarea = React.forwardRef<TextInput, TextareaProps>(({ style, containerStyle, inputStyle, error, errorMessage, editable = true, disabled, numberOfLines = 4, className, ...props }, ref) => {
  // Handle disabled prop
  const isEditable = disabled !== undefined ? !disabled : editable;
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

  const baseTextareaStyles: ViewStyle = {
    minHeight: 80,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    backgroundColor: colors.input,
    ...(error && {
      borderColor: colors.destructive,
    }),
    ...(isEditable === false && {
      opacity: 0.5,
      backgroundColor: isDark ? colors.muted : colors.background,
    }),
    ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
  };

  const baseInputStyles: TextStyle = {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlignVertical: "top",
    includeFontPadding: false,
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
        <Animated.View style={StyleSheet.flatten([baseTextareaStyles, animatedStyles])}>
          <TextInput
            ref={ref}
            style={baseInputStyles}
            placeholderTextColor={colors.mutedForeground}
            editable={isEditable}
            multiline={true}
            numberOfLines={numberOfLines}
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

Textarea.displayName = "Textarea";

export { Textarea };

