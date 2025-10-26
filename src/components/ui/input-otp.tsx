import React, { useRef, useState, useEffect } from "react";
import { View, TextInput, Pressable, Platform, AccessibilityInfo , StyleSheet} from "react-native";
import { ThemedText } from "./themed-text";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";

interface InputOTPProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
}

export function InputOTP({ value = "", onChange, maxLength = 6, disabled = false, error = false, autoFocus = false, onComplete }: InputOTPProps) {
  const { colors } = useTheme();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Convert string value to array of characters
  const valueArray = value.split("").slice(0, maxLength);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Handle completion
  useEffect(() => {
    if (value.length === maxLength && onComplete) {
      onComplete(value);
    }
  }, [value, maxLength, onComplete]);

  const handleChangeText = (text: string, index: number) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, "");

    if (numericText.length > 1) {
      // Handle paste - distribute digits across inputs
      const newValue = numericText.slice(0, maxLength);
      onChange(newValue);

      // Focus the next empty input or the last input
      const nextIndex = Math.min(newValue.length, maxLength - 1);
      inputRefs.current[nextIndex]?.focus();
    } else if (numericText.length === 1) {
      // Single digit input
      const newArray = [...valueArray];
      newArray[index] = numericText;

      // Fill any gaps with empty strings
      const newValue = newArray.join("").padEnd(index + 1, "");
      onChange(newValue.slice(0, maxLength));

      // Move to next input
      if (index < maxLength - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace") {
      if (valueArray[index]) {
        // Clear current digit
        const newArray = [...valueArray];
        newArray[index] = "";
        onChange(newArray.join("").slice(0, index));
      } else if (index > 0) {
        // Move to previous input and clear it
        const newArray = [...valueArray];
        newArray[index - 1] = "";
        onChange(newArray.join("").slice(0, index - 1));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);

    // Select all text when focused
    inputRefs.current[index]?.setNativeProps({
      selection: { start: 0, end: 1 },
    });
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  const handlePressSlot = (index: number) => {
    if (!disabled) {
      inputRefs.current[index]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        {Array.from({ length: maxLength }).map((_, index) => {
          const isFocused = focusedIndex === index;
          const hasValue = !!valueArray[index as keyof typeof valueArray];

          return (
            <Pressable
              key={index}
              onPress={() => handlePressSlot(index)}
              disabled={disabled}
              accessible
              accessibilityRole="none"
              accessibilityLabel={`Dígito ${index + 1} de ${maxLength}`}
              accessibilityValue={{ text: valueArray[index] || "vazio" }}
            >
              <View
                style={StyleSheet.flatten([
                  styles.slot,
                  {
                    backgroundColor: disabled ? colors.muted : colors.input,
                    borderColor: error ? colors.destructive : isFocused ? colors.ring : hasValue ? colors.primary : colors.border,
                    opacity: disabled ? 0.5 : 1,
                  },
                  isFocused && styles.focusedSlot,
                  error && styles.errorSlot,
                ])}
              >
                <TextInput
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.input,
                    {
                      color: colors.foreground,
                    },
                  ]}
                  value={valueArray[index] || ""}
                  onChangeText={(text) => handleChangeText(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  onFocus={() => handleFocus(index)}
                  onBlur={handleBlur}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!disabled}
                  caretHidden
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                />
                {isFocused && !valueArray[index] && <View style={StyleSheet.flatten([styles.caret, { backgroundColor: colors.foreground }])} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface InputOTPGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function InputOTPGroup({ children }: InputOTPGroupProps) {
  return <View style={styles.inputGroup}>{children}</View>;
}

interface InputOTPSlotProps {
  index: number;
  value?: string;
  isFocused?: boolean;
  error?: boolean;
  disabled?: boolean;
}

export function InputOTPSlot({ value, isFocused, error, disabled }: InputOTPSlotProps) {
  const { colors } = useTheme();

  return (
    <View
      style={StyleSheet.flatten([
        styles.slot,
        {
          backgroundColor: disabled ? colors.muted : colors.input,
          borderColor: error ? colors.destructive : isFocused ? colors.ring : value ? colors.primary : colors.border,
          opacity: disabled ? 0.5 : 1,
        },
        isFocused && styles.focusedSlot,
        error && styles.errorSlot,
      ])}
    >
      <ThemedText size="lg" weight="semibold" style={{ textAlign: "center" }}>
        {value || ""}
      </ThemedText>
      {isFocused && !value && <View style={StyleSheet.flatten([styles.caret, { backgroundColor: colors.foreground }])} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  inputGroup: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  slot: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  focusedSlot: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  errorSlot: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  input: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
    height: "100%",
    position: "absolute",
    opacity: 0,
  },
  caret: {
    width: 2,
    height: 20,
    position: "absolute",
  },
});
