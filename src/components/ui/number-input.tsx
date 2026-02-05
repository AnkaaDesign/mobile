import { useCallback, useRef, useState, useEffect } from "react";
import { TextInput, TextInputProps, View, ViewStyle, TextStyle, Animated, StyleSheet, LayoutChangeEvent } from "react-native";
import type { BlurEvent, FocusEvent } from "react-native/Libraries/Types/CoreEventTypes";
import { useTheme } from "@/lib/theme";
import { borderRadius, shadow, fontSize, transitions } from "@/constants/design-system";
import { useKeyboardAwareForm } from "@/contexts/KeyboardAwareFormContext";

interface NumberInputProps extends Omit<TextInputProps, "onChange" | "value" | "onChangeText" | "keyboardType" | "onBlur" | "onFocus"> {
  value?: number;
  onChange?: (value: number | undefined) => void;
  onChangeValue?: (value: number) => void;
  onBlur?: (e: BlurEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  error?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  min?: number;
  max?: number;
  step?: number;
  decimalPlaces?: number;
  /** Alias for decimalPlaces - for compatibility */
  decimals?: number;
  allowNegative?: boolean;
  className?: string;
  placeholder?: string;
  // Keyboard-aware form integration
  // Unique identifier for this field to enable keyboard-aware scrolling
  fieldKey?: string;
}

export function NumberInput({
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder = "0",
  error,
  containerStyle,
  inputStyle,
  min,
  max,
  step = 1,
  decimalPlaces,
  decimals,
  allowNegative = true,
  editable = true,
  className,
  fieldKey,
  ...props
}: NumberInputProps) {
  // Support both decimalPlaces and decimals (alias)
  const effectiveDecimalPlaces = decimalPlaces ?? decimals ?? 0;
  const { colors } = useTheme();
  const keyboardContext = useKeyboardAwareForm();
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
      if (effectiveDecimalPlaces > 0) {
        return num.toFixed(effectiveDecimalPlaces);
      }
      return num.toString();
    },
    [effectiveDecimalPlaces]
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
    (e: BlurEvent) => {
      setIsFocused(false);

      // Format the value on blur
      if (value !== undefined && value !== null) {
        setInternalValue(formatNumber(value));
      }

      onBlur?.(e);
    },
    [onBlur, value, formatNumber]
  );

  // Handle focus with keyboard-aware integration
  const handleFocus = useCallback((e: FocusEvent) => {
    setIsFocused(true);
    // Notify keyboard context about focus for auto-scrolling
    if (fieldKey && keyboardContext?.onFieldFocus) {
      keyboardContext.onFieldFocus(fieldKey);
    }
    onFocus?.(e);
  }, [onFocus, fieldKey, keyboardContext]);

  // Create regex pattern for input validation
  const getInputPattern = useCallback(() => {
    let pattern = allowNegative ? "-?" : "";
    pattern += "\\d*";
    if (effectiveDecimalPlaces > 0) {
      pattern += "[.,]?\\d*";
    }
    return new RegExp(`^${pattern}$`);
  }, [allowNegative, effectiveDecimalPlaces]);

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

  // Handle layout for keyboard-aware scrolling
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    if (fieldKey && keyboardContext?.onFieldLayout) {
      keyboardContext.onFieldLayout(fieldKey, event);
    }
  }, [fieldKey, keyboardContext]);

  return (
    <View
      style={baseContainerStyles}
      className={className}
      onLayout={handleLayout}
    >
      <Animated.View style={animatedShadowStyles}>
        <Animated.View style={StyleSheet.flatten([baseInputContainerStyles, animatedStyles])}>
          <TextInput
            {...props}
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
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}