import React, { useCallback, useRef, useState, useEffect } from "react";
import { TextInput, TextInputProps, View, ViewStyle, TextStyle, Animated, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, shadow, fontSize, transitions } from "@/constants/design-system";
import { cn } from "@/lib/cn";

interface NumberInputProps extends Omit<TextInputProps, "onChange" | "value" | "onChangeText" | "keyboardType"> {
  value?: number;
  onChange?: (value: number | undefined) => void;
  onBlur?: (e: any) => void;
  error?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  min?: number;
  max?: number;
  step?: number;
  decimalPlaces?: number;
  allowNegative?: boolean;
  className?: string;
}

export function NumberInput({
  value,
  onChange,
  onBlur,
  placeholder = "0",
  error,
  containerStyle,
  inputStyle,
  min,
  max,
  step = 1,
  decimalPlaces = 0,
  allowNegative = true,
  editable = true,
  className,
  ...props
}: NumberInputProps) {
  const { colors, isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;

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

  // Format number for display
  const formatNumber = useCallback(
    (num: number): string => {
      if (decimalPlaces > 0) {
        return num.toFixed(decimalPlaces);
      }
      return num.toString();
    },
    [decimalPlaces]
  );

  // Parse string to number
  const parseNumber = useCallback(
    (str: string): number | undefined => {
      if (!str || str === "") return undefined;

      // Replace comma with dot for decimal separator
      const normalizedStr = str.replace(",", ".");
      const parsed = parseFloat(normalizedStr);

      if (isNaN(parsed)) return undefined;

      // Apply constraints
      let constrainedValue = parsed;

      if (min !== undefined && constrainedValue < min) {
        constrainedValue = min;
      }

      if (max !== undefined && constrainedValue > max) {
        constrainedValue = max;
      }

      if (!allowNegative && constrainedValue < 0) {
        constrainedValue = 0;
      }

      return constrainedValue;
    },
    [min, max, allowNegative]
  );

  // Update internal value when external value changes
  useEffect(() => {
    if (!isFocused) {
      if (value !== undefined && value !== null) {
        setInternalValue(formatNumber(value));
      } else {
        setInternalValue("");
      }
    }
  }, [value, formatNumber, isFocused]);

  // Handle input change
  const handleChangeText = useCallback(
    (text: string) => {
      setInternalValue(text);

      if (text === "" || text === "-") {
        onChange?.(undefined);
        return;
      }

      const parsed = parseNumber(text);
      onChange?.(parsed);
    },
    [onChange, parseNumber]
  );

  // Handle blur
  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);

      // Format the value on blur
      if (value !== undefined && value !== null) {
        setInternalValue(formatNumber(value));
      }

      onBlur?.(e);
    },
    [onBlur, value, formatNumber]
  );

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // Create regex pattern for input validation
  const getInputPattern = useCallback(() => {
    let pattern = allowNegative ? "-?" : "";
    pattern += "\\d*";
    if (decimalPlaces > 0) {
      pattern += "[.,]?\\d*";
    }
    return new RegExp(`^${pattern}$`);
  }, [allowNegative, decimalPlaces]);

  // Validate input characters
  const isValidInput = useCallback(
    (text: string): boolean => {
      if (text === "") return true;
      return getInputPattern().test(text);
    },
    [getInputPattern]
  );

  // Filter input to only allow valid characters
  const filterInput = useCallback(
    (text: string): string => {
      if (isValidInput(text)) {
        return text;
      }

      // Try to extract valid parts
      let filtered = "";
      for (let i = 0; i < text.length; i++) {
        const char = text[i as keyof typeof text];
        const testText = filtered + char;
        if (isValidInput(testText)) {
          filtered = testText;
        }
      }

      return filtered;
    },
    [isValidInput]
  );

  // Override handleChangeText to include filtering
  const handleFilteredChangeText = useCallback(
    (text: string) => {
      const filteredText = filterInput(text);
      handleChangeText(filteredText);
    },
    [filterInput, handleChangeText]
  );

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
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    backgroundColor: colors.input,
    ...(error && {
      borderColor: colors.destructive,
    }),
    ...(editable === false && {
      opacity: 0.5,
      backgroundColor: colors.input,
    }),
  };

  const baseInputStyles: TextStyle = {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: fontSize.base,
    color: colors.foreground,
    height: "100%",
    textAlignVertical: "center",
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
        <Animated.View style={StyleSheet.flatten([baseInputContainerStyles, animatedStyles])}>
          <TextInput
            ref={inputRef}
            style={baseInputStyles}
            value={internalValue}
            onChangeText={handleFilteredChangeText}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            editable={editable}
            {...props}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}