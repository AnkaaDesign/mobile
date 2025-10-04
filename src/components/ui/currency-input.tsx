import React, { useCallback, useRef, useState, useEffect } from "react";
import { TextInput, TextInputProps, View, ViewStyle, TextStyle, Animated, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, shadow, fontSize, lineHeight, transitions } from "@/constants/design-system";

interface CurrencyInputProps extends Omit<TextInputProps, "onChange" | "value" | "onChangeText" | "keyboardType"> {
  value?: number;
  onChange?: (value: number | undefined) => void;
  onBlur?: (e: any) => void;
  error?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export function CurrencyInput({ value, onChange, onBlur, placeholder = "R$ 0,00", error, containerStyle, inputStyle, editable = true, ...props }: CurrencyInputProps) {
  const { colors, isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;
  const [cents, setCents] = useState(() => {
    if (value === undefined || value === null) return 0;
    return Math.round(value * 100);
  });
  const previousCents = useRef(cents);

  // Animate border and shadow on focus
  useEffect(() => {
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

  // Format cents to display string
  function formatCentsToDisplay(totalCents: number): string {
    // If zero, return empty string (show placeholder)
    if (totalCents === 0) {
      return "";
    }

    const whole = Math.floor(totalCents / 100);
    const decimal = totalCents % 100;

    // Format whole part with thousand separators
    const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // Always show 2 decimal places
    const decimalStr = decimal.toString().padStart(2, "0");

    return `R$ ${wholeStr},${decimalStr}`;
  }

  // Extract only numbers from input
  function extractNumbers(str: string): string {
    return str.replace(/\D/g, "");
  }

  // Handle input change
  const handleChangeText = useCallback(
    (text: string) => {
      // If text is empty (user cleared the field), reset to 0
      if (!text) {
        setCents(0);
        previousCents.current = 0;
        onChange?.(undefined);
        return;
      }

      const currentNumbers = extractNumbers(formatCentsToDisplay(previousCents.current));
      const newNumbers = extractNumbers(text);

      // Detect if user is trying to delete
      const isDeleting = newNumbers.length < currentNumbers.length;

      if (isDeleting) {
        // Handle backspace - remove last digit from cents
        const newCents = Math.floor(previousCents.current / 10);
        setCents(newCents);
        previousCents.current = newCents;
        onChange?.(newCents > 0 ? newCents / 100 : undefined);
      } else {
        // Extract the new digit(s) added
        const addedDigits = newNumbers.slice(currentNumbers.length);

        if (addedDigits) {
          // Add new digits to the right
          let newCents = previousCents.current;

          for (const digit of addedDigits) {
            newCents = newCents * 10 + parseInt(digit, 10);

            // Limit to max safe value (999.999.999,99)
            const maxCents = 99999999999;
            if (newCents > maxCents) {
              newCents = maxCents;
              break;
            }
          }

          setCents(newCents);
          previousCents.current = newCents;
          onChange?.(newCents > 0 ? newCents / 100 : undefined);
        }
      }
    },
    [onChange],
  );

  // Handle blur
  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // Update cents when value prop changes
  useEffect(() => {
    if (!inputRef.current?.isFocused()) {
      const newCents = value !== undefined ? Math.round(value * 100) : 0;
      setCents(newCents);
      previousCents.current = newCents;
    }
  }, [value]);

  const displayValue = formatCentsToDisplay(cents);

  // Animated styles
  const animatedBorderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.ring],
  });

  const baseContainerStyles: ViewStyle = {
    width: "100%",
    ...containerStyle,
  };

  const baseInputContainerStyles: ViewStyle = {
    // Size
    height: 40,
    paddingHorizontal: 12,

    // Border
    borderRadius: borderRadius.md,
    borderWidth: 1,

    // Background
    backgroundColor: colors.input,

    // Base shadow
    ...shadow.sm,

    // Error state
    ...(error && {
      borderColor: colors.destructive,
    }),

    // Disabled state
    ...(editable === false && {
      opacity: 0.5,
      backgroundColor: isDark ? colors.muted : colors.background,
    }),

    // Custom styles (only ViewStyle properties)
    ...inputStyle,
  };

  const baseInputTextStyles: TextStyle = {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.foreground,
    height: "100%",
    textAlignVertical: "center",
    includeFontPadding: false,
    padding: 0,
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
    <View style={baseContainerStyles}>
      <Animated.View style={StyleSheet.flatten([animatedShadowStyles])}>
        <Animated.View style={StyleSheet.flatten([baseInputContainerStyles, animatedStyles])}>
          <TextInput
            ref={inputRef}
            style={baseInputTextStyles}
            value={displayValue}
            onChangeText={handleChangeText}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            editable={editable}
            {...props}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}
