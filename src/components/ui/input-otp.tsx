import React, { useRef, useState, useEffect } from "react";
import { View, TextInput, Pressable, Platform, StyleSheet } from "react-native";
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
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Convert string value to array of characters
  const valueArray = value.split("").slice(0, maxLength);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  // Handle completion
  useEffect(() => {
    if (value.length === maxLength && onComplete) {
      onComplete(value);
    }
  }, [value, maxLength, onComplete]);

  const handleChangeText = (text: string) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, "");
    onChange(numericText.slice(0, maxLength));
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handlePress = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  // Determine which slot should show the cursor
  const cursorIndex = Math.min(value.length, maxLength - 1);

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} disabled={disabled}>
        <View style={styles.inputGroup}>
          {Array.from({ length: maxLength }).map((_, index) => {
            const char = valueArray[index] || "";
            const showCursor = isFocused && index === cursorIndex && value.length < maxLength;
            const isFilledAndFocused = isFocused && index === value.length - 1 && value.length === maxLength;

            return (
              <View
                key={index}
                style={StyleSheet.flatten([
                  styles.slot,
                  {
                    backgroundColor: disabled ? colors.muted : colors.input,
                    borderColor: error
                      ? colors.destructive
                      : (showCursor || isFilledAndFocused)
                        ? colors.ring
                        : char
                          ? colors.primary
                          : colors.border,
                    opacity: disabled ? 0.5 : 1,
                  },
                  (showCursor || isFilledAndFocused) && styles.focusedSlot,
                  error && styles.errorSlot,
                ])}
              >
                <ThemedText size="xl" weight="semibold" style={{ textAlign: "center" }}>
                  {char}
                </ThemedText>
                {showCursor && (
                  <View style={StyleSheet.flatten([styles.caret, { backgroundColor: colors.foreground }])} />
                )}
              </View>
            );
          })}
        </View>
      </Pressable>

      {/* Hidden TextInput that captures all keyboard input */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        keyboardType="number-pad"
        maxLength={maxLength}
        editable={!disabled}
        caretHidden
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
      />
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
    position: "relative",
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
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 1,
    width: 1,
    // Position it off-screen but still focusable
    top: 0,
    left: 0,
  },
  caret: {
    width: 2,
    height: 20,
    position: "absolute",
  },
});
